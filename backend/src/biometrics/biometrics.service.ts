import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EnrollBiometricsDto } from './dto/enroll-biometrics.dto.js';
import { VerifyBiometricsDto } from './dto/verify-biometrics.dto.js';

@Injectable()
export class BiometricsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcula a distância euclidiana L2 entre dois vetores de embeddings (MobileFaceNet 192-d)
   * Quanto menor a distância, maior a semelhança facial.
   * Valores típicos: < 0.80 indica a mesma pessoa.
   */
  calculateEuclideanDistance(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new BadRequestException('Vetores biométricos possuem dimensões incompatíveis.');
    }

    let sumSquares = 0;
    for (let i = 0; i < vecA.length; i++) {
      const diff = vecA[i] - vecB[i];
      sumSquares += diff * diff;
    }

    return Math.sqrt(sumSquares);
  }

  /**
   * Converte a distância euclidiana em um percentual amigável de similaridade (0 a 100%)
   */
  distanceToConfidencePercentage(distance: number): number {
    // Para MobileFaceNet normalizado, distâncias variam entre 0 (idêntico) e ~1.4 (oposto)
    const confidence = Math.max(0, Math.min(100, (1 - distance / 1.4) * 100));
    return Number(confidence.toFixed(1));
  }

  /**
   * Cadastro (Enrollment) do vetor biométrico do colaborador
   * IMPORTANTE LGPD: A foto é descartada na captura; apenas o vetor matemático é persistido.
   */
  async enroll(tenantId: string, authorId: string, dto: EnrollBiometricsDto) {
    if (!dto.consentGiven) {
      throw new BadRequestException(
        'O consentimento formal e explícito do colaborador nos termos da LGPD é estritamente obrigatório.',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Colaborador não localizado na empresa.');
    }

    // Upsert do vetor de embedding
    const embedding = await this.prisma.facialEmbedding.upsert({
      where: { userId: user.id },
      create: {
        tenantId,
        userId: user.id,
        embeddingVector: dto.embeddingVector,
        consentGiven: true,
        consentAt: new Date(),
      },
      update: {
        embeddingVector: dto.embeddingVector,
        consentGiven: true,
        consentAt: new Date(),
      },
    });

    // Auditoria de conformidade LGPD
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: authorId,
        action: 'CADASTRO_BIOMETRIA_FACIAL_LGPD',
        entityType: 'FACIAL_EMBEDDING',
        entityId: embedding.id,
        details: {
          colaboradorId: user.id,
          nome: user.name,
          cpf: user.cpf,
          vetorDimensoes: dto.embeddingVector.length,
          termoConsentimentoRegistrado: true,
        },
      },
    });

    return {
      success: true,
      message: 'Vetor biométrico cadastrado com sucesso. Nenhuma imagem bruta foi armazenada.',
      enrolledAt: embedding.createdAt,
    };
  }

  /**
   * Verificação e matching biométrico facial (usado a cada batida de ponto)
   */
  async verify(tenantId: string, dto: VerifyBiometricsDto) {
    const enrolled = await this.prisma.facialEmbedding.findFirst({
      where: { userId: dto.userId, tenantId },
      include: {
        user: { select: { id: true, name: true, cpf: true, isActive: true } },
      },
    });

    if (!enrolled || !enrolled.consentGiven) {
      throw new NotFoundException('Colaborador não possui biometria cadastrada ou termo revogado.');
    }

    if (!enrolled.user.isActive) {
      throw new BadRequestException('Colaborador inativo na empresa.');
    }

    const enrolledVector = enrolled.embeddingVector as number[];
    const distance = this.calculateEuclideanDistance(dto.capturedEmbedding, enrolledVector);
    const confidence = this.distanceToConfidencePercentage(distance);

    // Threshold de segurança (padrão: distância <= 0.80)
    const threshold = dto.threshold ?? 0.8;
    const isMatch = distance <= threshold;

    return {
      isMatch,
      distance: Number(distance.toFixed(4)),
      confidencePercentage: confidence,
      threshold,
      user: {
        id: enrolled.user.id,
        name: enrolled.user.name,
      },
      message: isMatch
        ? `Identidade confirmada com ${confidence}% de similaridade.`
        : `Rosto não corresponde ao colaborador cadastrado (similaridade: ${confidence}%).`,
    };
  }

  /**
   * Exclusão e expurgo definitivo de dados biométricos (Direito de Revogação LGPD)
   */
  async deleteBiometrics(tenantId: string, authorId: string, userId: string) {
    const existing = await this.prisma.facialEmbedding.findFirst({
      where: { userId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Nenhum dado biométrico encontrado para este colaborador.');
    }

    // Exclusão física imediata do vetor no banco de dados
    await this.prisma.facialEmbedding.delete({
      where: { id: existing.id },
    });

    // Registro de auditoria comprovando a eliminação em compliance LGPD
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: authorId,
        action: 'EXCLUSAO_DEFINITIVA_BIOMETRIA_LGPD',
        entityType: 'FACIAL_EMBEDDING',
        entityId: existing.id,
        details: {
          colaboradorId: userId,
          motivo: 'Revogação de consentimento ou desligamento do colaborador',
          dataExclusao: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: 'Todos os vetores biométricos do colaborador foram eliminados definitivamente do banco de dados.',
    };
  }

  /**
   * Consulta de status de biometria para listagens
   */
  async getStatus(tenantId: string, userId: string) {
    const embedding = await this.prisma.facialEmbedding.findFirst({
      where: { userId, tenantId },
    });

    return {
      userId,
      isEnrolled: !!embedding,
      consentGiven: embedding?.consentGiven ?? false,
      enrolledAt: embedding?.consentAt ?? null,
    };
  }
}
