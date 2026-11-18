import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import * as XLSX from 'xlsx';

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
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`Veículo ${dto.vehicleId} não encontrado.`);
    }

    const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
    if (!driver) {
      throw new NotFoundException(`Colaborador/Motorista ${dto.driverId} não encontrado.`);
    }

    const tenantId = dto.tenantId || vehicle.tenantId;

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
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId: dto.driverId,
          action: 'ALERTA_AVARIA',
          entityType: 'VEHICLE',
          entityId: dto.vehicleId,
          details: JSON.stringify({
            message: `Alerta de avaria detectado no checklist de ${dto.type === 'ENTRY' ? 'Saída' : 'Devolução'}. Veículo: ${vehicle.brand} ${vehicle.model} (${vehicle.plate}).`,
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

  private formatCheckItem(items: any, keys: string[]): string {
    if (!items || typeof items !== 'object') return 'Não informado';
    for (const k of keys) {
      if (items[k] !== undefined) {
        const val = items[k];
        if (typeof val === 'boolean') return val ? 'OK' : 'AVARIA';
        if (typeof val === 'object' && val !== null) {
          if (val.ok === false) {
            return val.observation ? `AVARIA (${val.observation})` : 'AVARIA';
          }
          return 'OK';
        }
      }
    }
    return 'OK';
  }

  async exportXlsxBuffer(tenantId?: string): Promise<Buffer> {
    const checklists = await this.findAll(tenantId);
    const usages = await this.prisma.vehicleUsage.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, cpf: true } },
        entryChecklist: true,
        exitChecklist: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const checklistRows =
      checklists.length > 0
        ? checklists.map((c) => {
            const dt = new Date(c.createdAt);
            const items = c.itemsResult || {};
            return {
              Data: dt.toLocaleDateString('pt-BR'),
              Horário: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              'Tipo (Saída / Retorno)': c.type === 'ENTRY' ? 'Saída (Início Rota)' : 'Retorno (Devolução)',
              Motorista: c.driver?.name || '-',
              CPF: c.driver?.cpf || '-',
              Placa: c.vehicle?.plate || '-',
              Veículo: `${c.vehicle?.brand || ''} ${c.vehicle?.model || ''}`.trim() || '-',
              'Odômetro (Km)': c.mileage,
              'Situação Geral': c.hasProblem ? 'AVARIA' : 'CONFORME',
              Combustível: items.fuelLevel ? String(items.fuelLevel) : this.formatCheckItem(items, ['fuel']),
              Pneus: this.formatCheckItem(items, ['tires']),
              Lataria: this.formatCheckItem(items, ['bodywork']),
              'Faróis / Luzes': this.formatCheckItem(items, ['lights', 'headlights']),
              'Documentação CRLV': this.formatCheckItem(items, ['docs', 'documents']),
              Observações: c.observation || '-',
            };
          })
        : [
            {
              Data: '-',
              Horário: '-',
              'Tipo (Saída / Retorno)': '-',
              Motorista: 'Nenhum checklist encontrado',
              CPF: '-',
              Placa: '-',
              Veículo: '-',
              'Odômetro (Km)': 0,
              'Situação Geral': '-',
              Combustível: '-',
              Pneus: '-',
              Lataria: '-',
              'Faróis / Luzes': '-',
              'Documentação CRLV': '-',
              Observações: '-',
            },
          ];

    const usageRows =
      usages.length > 0
        ? usages.map((u) => {
            const start = new Date(u.startTime);
            const end = u.endTime ? new Date(u.endTime) : null;
            const statusLabels: Record<string, string> = {
              COMPLETED: 'Concluída',
              IN_PROGRESS: 'Em Rota',
              PAUSED_LUNCH: 'Pausa Almoço',
            };
            return {
              Motorista: u.driver?.name || '-',
              CPF: u.driver?.cpf || '-',
              Placa: u.vehicle?.plate || '-',
              Veículo: `${u.vehicle?.brand || ''} ${u.vehicle?.model || ''}`.trim() || '-',
              Saída: `${start.toLocaleDateString('pt-BR')} ${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
              Chegada: end
                ? `${end.toLocaleDateString('pt-BR')} ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Em Aberto',
              'Duração (min)': u.totalDurationMinutes || 0,
              'Almoço (min)': u.totalLunchMinutes || 0,
              'Km Inicial': u.entryChecklist?.mileage || 0,
              'Km Final': u.exitChecklist?.mileage ?? '-',
              'Km Rodado': u.totalDistanceKm || 0,
              Status: statusLabels[u.status] || u.status,
            };
          })
        : [
            {
              Motorista: 'Nenhuma viagem registrada',
              CPF: '-',
              Placa: '-',
              Veículo: '-',
              Saída: '-',
              Chegada: '-',
              'Duração (min)': 0,
              'Almoço (min)': 0,
              'Km Inicial': 0,
              'Km Final': '-',
              'Km Rodado': 0,
              Status: '-',
            },
          ];

    const wsChecklists = XLSX.utils.json_to_sheet(checklistRows);
    wsChecklists['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 22 },
      { wch: 28 },
      { wch: 16 },
      { wch: 11 },
      { wch: 24 },
      { wch: 15 },
      { wch: 15 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 40 },
    ];

    const wsUsages = XLSX.utils.json_to_sheet(usageRows);
    wsUsages['!cols'] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 11 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsChecklists, 'Checklists de Vistoria');
    XLSX.utils.book_append_sheet(wb, wsUsages, 'Viagens e Rotas');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
