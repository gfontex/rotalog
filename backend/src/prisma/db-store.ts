import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcryptjs';

export interface MockTenant {
  id: string;
  name: string;
  cnpj: string;
  status: string;
  createdAt: Date;
}

export interface MockBranch {
  id: string;
  tenantId: string;
  name: string;
  city: string;
  state: string;
}

export interface MockUser {
  id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  cpf: string;
  email: string;
  passwordHash: string;
  role: 'DRIVER' | 'FLEET_MANAGER' | 'HR' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
}

export interface MockVehicle {
  id: string;
  tenantId: string;
  branchId?: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  currentMileage: number;
  currentDriverName?: string | null;
  currentDriverId?: string | null;
}

export interface MockChecklist {
  id: string;
  tenantId: string;
  vehicleId: string;
  driverId: string;
  type: 'ENTRY' | 'EXIT';
  mileage: number;
  itemsResult: any;
  observation?: string;
  hasProblem: boolean;
  photoUrls?: any;
  createdAt: Date;
}

export interface MockUsage {
  id: string;
  tenantId: string;
  vehicleId: string;
  driverId: string;
  driverName?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  entryChecklistId?: string;
  exitChecklistId?: string;
  startTime: Date;
  endTime?: Date | null;
  lunchStartTime?: Date | null;
  lunchEndTime?: Date | null;
  totalLunchMinutes: number;
  totalDurationMinutes: number;
  totalDistanceKm: number;
  status: 'IN_PROGRESS' | 'PAUSED_LUNCH' | 'COMPLETED';
  createdAt: Date;
}

export interface MockTimeClock {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  type: 'ENTRADA' | 'ALMOCO_SAIDA' | 'ALMOCO_RETORNO' | 'SAIDA';
  timestamp: Date;
  isOffline: boolean;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: Date;
}

export interface MockNotification {
  id: string;
  tenantId: string;
  userId?: string;
  userName?: string;
  action: 'INICIO_ROTA' | 'PAUSA_ALMOCO' | 'RETOMADA_ALMOCO' | 'FIM_ROTA' | 'ALERTA_AVARIA' | 'BATIDA_PONTO';
  entityType: string;
  entityId: string;
  details: any;
  timestamp: Date;
}

@Injectable()
export class DbStore {
  private readonly logger = new Logger(DbStore.name);
  public isConnectedToDb = false;

  public tenants: MockTenant[] = [];
  public branches: MockBranch[] = [];
  public users: MockUser[] = [];
  public vehicles: MockVehicle[] = [];
  public checklists: MockChecklist[] = [];
  public usages: MockUsage[] = [];
  public timeClocks: MockTimeClock[] = [];
  public notifications: MockNotification[] = [];

  constructor(private prisma: PrismaService) {
    this.seedInitialInMemory();
    this.checkDbConnection();
  }

  private async checkDbConnection() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.isConnectedToDb = true;
      this.logger.log('Conexão PostgreSQL verificada com sucesso. Operando em modo banco de dados real.');
    } catch {
      this.isConnectedToDb = false;
      this.logger.log('PostgreSQL indisponível no momento. Operando com armazenamento em memória nativo do ROTALOG.');
    }
  }

  private seedInitialInMemory() {
    const tenantId = 'tenant-rotalog-01';
    const branchSP = 'branch-sp-01';
    const branchCampinas = 'branch-camp-02';

    this.tenants.push({
      id: tenantId,
      name: 'ROTALOG Logística & Operações S/A',
      cnpj: '12.345.678/0001-90',
      status: 'ACTIVE',
      createdAt: new Date(),
    });

    this.branches.push(
      { id: branchSP, tenantId, name: 'Base Central - São Paulo', city: 'São Paulo', state: 'SP' },
      { id: branchCampinas, tenantId, name: 'Base Operacional - Campinas', city: 'Campinas', state: 'SP' }
    );

    const defaultHash = bcrypt.hashSync('rotalog123', 10);

    this.users.push(
      {
        id: 'user-carlos-01',
        tenantId,
        branchId: branchSP,
        name: 'Carlos Silva',
        cpf: '111.222.333-44',
        email: 'carlos.silva@rotalog.com.br',
        passwordHash: defaultHash,
        role: 'DRIVER',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 'user-joao-02',
        tenantId,
        branchId: branchCampinas,
        name: 'João Pereira',
        cpf: '222.333.444-55',
        email: 'joao.pereira@rotalog.com.br',
        passwordHash: defaultHash,
        role: 'DRIVER',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 'user-roberto-03',
        tenantId,
        branchId: branchSP,
        name: 'Roberto Santos',
        cpf: '333.444.555-66',
        email: 'roberto.santos@rotalog.com.br',
        passwordHash: defaultHash,
        role: 'FLEET_MANAGER',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 'user-mariana-04',
        tenantId,
        branchId: branchSP,
        name: 'Mariana Lima',
        cpf: '444.555.666-77',
        email: 'mariana.lima@rotalog.com.br',
        passwordHash: defaultHash,
        role: 'HR',
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 'user-admin-05',
        tenantId,
        branchId: branchSP,
        name: 'Marcos Souza',
        cpf: '555.666.777-88',
        email: 'admin@rotalog.com.br',
        passwordHash: defaultHash,
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
      }
    );

    this.vehicles.push(
      {
        id: 'veh-strada-01',
        tenantId,
        branchId: branchSP,
        plate: 'BRA2E19',
        brand: 'Fiat',
        model: 'Strada Freedom 1.3 CS',
        year: 2023,
        status: 'AVAILABLE',
        currentMileage: 45200,
      },
      {
        id: 'veh-hilux-02',
        tenantId,
        branchId: branchSP,
        plate: 'RTO4F88',
        brand: 'Toyota',
        model: 'Hilux CD 4x4 Power',
        year: 2022,
        status: 'AVAILABLE',
        currentMileage: 82150,
      },
      {
        id: 'veh-master-03',
        tenantId,
        branchId: branchCampinas,
        plate: 'RLG9A12',
        brand: 'Renault',
        model: 'Master Furgão L3H2',
        year: 2023,
        status: 'AVAILABLE',
        currentMileage: 114300,
      },
      {
        id: 'veh-gol-04',
        tenantId,
        branchId: branchSP,
        plate: 'ROT8B34',
        brand: 'Volkswagen',
        model: 'Gol Trendline 1.6',
        year: 2021,
        status: 'MAINTENANCE',
        currentMileage: 63800,
      }
    );

    // Initial notification
    this.notifications.push({
      id: 'notif-init-01',
      tenantId,
      action: 'INICIO_ROTA',
      entityType: 'SYSTEM',
      entityId: 'system',
      details: {
        message: 'Sistema ROTALOG operacionalizado com sucesso.',
      },
      timestamp: new Date(),
    });
  }

  addNotification(notif: Omit<MockNotification, 'id' | 'timestamp'>) {
    const item: MockNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date(),
    };
    this.notifications.unshift(item);
    return item;
  }
}
