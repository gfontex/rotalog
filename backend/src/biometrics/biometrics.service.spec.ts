import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BiometricsService } from './biometrics.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BiometricsService', () => {
  let service: BiometricsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
      },
      facialEmbedding: {
        upsert: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    service = new BiometricsService(mockPrisma);
  });

  describe('Cálculo de Distância Euclidiana e Similaridade', () => {
    it('deve retornar distância 0 para vetores idênticos (100% similaridade)', () => {
      const vecA = [0.5, 0.5, 0.5];
      const vecB = [0.5, 0.5, 0.5];
      const dist = service.calculateEuclideanDistance(vecA, vecB);
      expect(dist).toBe(0);
      expect(service.distanceToConfidencePercentage(dist)).toBe(100);
    });

    it('deve calcular corretamente a distância entre vetores distintos', () => {
      const vecA = [1, 0, 0];
      const vecB = [0, 1, 0];
      const dist = service.calculateEuclideanDistance(vecA, vecB);
      expect(dist).toBeCloseTo(Math.sqrt(2), 4);
    });
  });

  describe('Enrollment (Cadastro) com Conformidade LGPD', () => {
    it('deve rejeitar cadastro caso o consentimento LGPD não seja fornecido', async () => {
      await expect(
        service.enroll('tenant-1', 'admin-1', {
          userId: 'user-1',
          embeddingVector: [0.1, 0.2],
          consentGiven: false, // Consentimento ausente!
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve cadastrar com sucesso quando o consentimento é confirmado e gerar log de auditoria', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        name: 'João Motorista',
        cpf: '123.456.789-00',
      });

      mockPrisma.facialEmbedding.upsert.mockResolvedValue({
        id: 'emb-1',
        createdAt: new Date(),
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.enroll('tenant-1', 'admin-1', {
        userId: 'user-1',
        embeddingVector: [0.1, 0.2, 0.3],
        consentGiven: true,
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.facialEmbedding.upsert).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'CADASTRO_BIOMETRIA_FACIAL_LGPD' }),
        }),
      );
    });
  });

  describe('Verificação e Matching de Ponto', () => {
    it('deve aprovar matching quando a distância calculada for menor ou igual ao threshold', async () => {
      const enrolledVec = [0.2, 0.4, 0.6];
      mockPrisma.facialEmbedding.findFirst.mockResolvedValue({
        id: 'emb-1',
        embeddingVector: enrolledVec,
        consentGiven: true,
        user: { id: 'user-1', name: 'João', cpf: '123', isActive: true },
      });

      // Vetor capturado quase idêntico (distância ~0.017 < 0.80)
      const capturedVec = [0.21, 0.41, 0.61];
      const result = await service.verify('tenant-1', {
        userId: 'user-1',
        capturedEmbedding: capturedVec,
      });

      expect(result.isMatch).toBe(true);
      expect(result.confidencePercentage).toBeGreaterThan(95);
    });

    it('deve reprovar matching quando a distância calculada ultrapassar o threshold', async () => {
      const enrolledVec = [1.0, 0.0, 0.0];
      mockPrisma.facialEmbedding.findFirst.mockResolvedValue({
        id: 'emb-1',
        embeddingVector: enrolledVec,
        consentGiven: true,
        user: { id: 'user-1', name: 'João', cpf: '123', isActive: true },
      });

      // Vetor capturado completamente oposto
      const capturedVec = [0.0, 1.0, 0.0];
      const result = await service.verify('tenant-1', {
        userId: 'user-1',
        capturedEmbedding: capturedVec,
      });

      expect(result.isMatch).toBe(false);
      expect(result.distance).toBeGreaterThan(0.8);
    });
  });

  describe('Exclusão Definitiva LGPD', () => {
    it('deve excluir o registro biométrico do banco e gerar comprovante de auditoria', async () => {
      mockPrisma.facialEmbedding.findFirst.mockResolvedValue({ id: 'emb-1' });
      mockPrisma.facialEmbedding.delete.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.deleteBiometrics('tenant-1', 'admin-1', 'user-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.facialEmbedding.delete).toHaveBeenCalledWith({ where: { id: 'emb-1' } });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'EXCLUSAO_DEFINITIVA_BIOMETRIA_LGPD' }),
        }),
      );
    });
  });
});
