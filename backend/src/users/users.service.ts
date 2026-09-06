import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, branchId?: string, role?: string) {
    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;
    if (role) where.role = role;

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        role: true,
        tenantId: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        branch: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    return user;
  }

  async create(tenantId: string, dto: CreateUserDto) {
    const cleanCpf = dto.cpf.replace(/\D/g, '');
    const finalEmail = (dto.email || `usuario.${cleanCpf}@mkseguranca.com.br`).toLowerCase();
    const finalPassword = dto.password || cleanCpf || dto.cpf;

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: finalEmail }, { cpf: dto.cpf }, { cpf: cleanCpf }],
      },
    });

    if (existing) {
      throw new ConflictException('Já existe um colaborador com este CPF ou e-mail.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(finalPassword, salt);

    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name,
        cpf: dto.cpf,
        email: finalEmail,
        passwordHash,
        role: dto.role,
        tenantId,
        branchId: dto.branchId || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        role: true,
        tenantId: true,
        branchId: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Se informou vetor de biometria facial, cadastra no FacialEmbedding
    if (dto.embeddingVector && Array.isArray(dto.embeddingVector) && dto.embeddingVector.length > 0) {
      await this.prisma.facialEmbedding.create({
        data: {
          tenantId,
          userId: newUser.id,
          embeddingVector: dto.embeddingVector,
          consentGiven: true,
          consentAt: new Date(),
        },
      });

      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId: newUser.id,
          entityType: 'User',
          entityId: newUser.id,
          action: 'CADASTRO_BIOMETRICO_USUARIO',
          details: {
            method: 'WEB_ADMIN_REGISTRATION',
            dimensions: dto.embeddingVector.length,
            lgpdConsent: true,
          },
        },
      });
    }

    return newUser;
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto) {
    await this.findOne(tenantId, id);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.cpf) updateData.cpf = dto.cpf;
    if (dto.email) updateData.email = dto.email.toLowerCase();
    if (dto.role) updateData.role = dto.role;
    if (dto.branchId !== undefined) updateData.branchId = dto.branchId || null;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(dto.password, salt);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        role: true,
        tenantId: true,
        branchId: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    // Soft delete para segurança e histórico
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
