import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';

@Injectable()
export class ChecklistsService {
  constructor(private prisma: PrismaService) {}

  getTemplate() {
    return [
      { id: 'fuel', title: 'Nível de Combustível', description: 'Conferir marcador e tampa do tanque' },
      { id: 'tires', title: 'Estado dos Pneus e Calibragem', description: 'Desgaste, calibração e estepe operacional' },
      { id: 'bodywork', title: 'Avarias / Lataria e Vidros', description: 'Riscos, amassados e retrovisores' },
      { id: 'lights', title: 'Faróis e Lanternas', description: 'Luz alta, baixa, setas, pisca e giroflex' },
      { id: 'docs', title: 'Documentação e Limpeza', description: 'CRLV atualizado, triângulo e asseio' },
    ];
  }

  // Se driverId for informado, filtra exclusivamente as inspeções daquele motorista!
  async findAll(tenantId?: string, driverId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (driverId) where.driverId = driverId;

    const list = await this.prisma.vehicleChecklist.findMany({
      where,
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, cpf: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((c) => ({
      ...c,
      itemsResult: typeof c.itemsResult === 'string' ? JSON.parse(c.itemsResult) : c.itemsResult,
    }));
  }

  async create(dto: CreateChecklistDto) {
    let tenantId = dto.tenantId;
    if (!tenantId) {
      const v = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
      tenantId = v?.tenantId || (await this.prisma.tenant.findFirst())?.id || '';
    }

    // Calcula hasProblem se algum item não estiver OK
    let hasProblem = dto.hasProblem || false;
    if (dto.itemsResult) {
      for (const key of Object.keys(dto.itemsResult)) {
        if (dto.itemsResult[key]?.ok === false) {
          hasProblem = true;
          break;
        }
      }
    }

    // Se houver problema, grava log de alerta de avaria no banco
    if (hasProblem) {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
      const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });

      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId: dto.driverId,
          action: 'ALERTA_AVARIA',
          entityType: 'VEHICLE',
          entityId: dto.vehicleId,
          details: JSON.stringify({
            message: `Alerta de avaria detectado no checklist de ${dto.type === 'ENTRY' ? 'Saída' : 'Devolução'}. Veículo: ${vehicle?.brand} ${vehicle?.model} (${vehicle?.plate}).`,
            itemsResult: dto.itemsResult,
            observation: dto.observation,
          }),
        },
      });
    }

    const created = await this.prisma.vehicleChecklist.create({
      data: {
        tenantId,
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        type: dto.type,
        mileage: dto.mileage,
        itemsResult: JSON.stringify(dto.itemsResult),
        observation: dto.observation || null,
        hasProblem,
        photoUrls: dto.photoUrls ? JSON.stringify(dto.photoUrls) : null,
      },
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, cpf: true } },
      },
    });

    return {
      ...created,
      itemsResult: dto.itemsResult,
    };
  }
}
