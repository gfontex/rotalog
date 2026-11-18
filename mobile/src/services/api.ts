// Conexao do aplicativo mobile com a API do backend (requisicoes HTTP)

import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveDefaultHost(): string {
  // 1. Se estiver rodando no navegador (Web)
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }

  // 2. Tenta extrair automaticamente o IP se o Expo estiver em modo LAN
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const hostPart = hostUri.split(':')[0];
      // Verifica se é um IP numérico válido (ex: 192.168.x.x) e não domínio de túnel
      const isNumericIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostPart);
      if (isNumericIp && hostPart !== '127.0.0.1') {
        return `http://${hostPart}:3001`;
      }
    }
  } catch (_) {}

  // 3. IP padrão da máquina na rede local
  const LOCAL_MACHINE_IP = '192.168.99.113';
  return `http://${LOCAL_MACHINE_IP}:3001`;
}

export let BASE_URL = resolveDefaultHost();

export function setCustomApiUrl(url: string) {
  let cleaned = url.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `http://${cleaned}`;
  }
  // Remove barra final se houver
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  BASE_URL = cleaned;
}

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorBody.message || `Erro HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Tempo esgotado ao conectar no servidor (${BASE_URL}). Verifique se o backend está rodando e se o IP está correto.`);
    }
    throw err;
  }
}

export const api = {
  // Autenticação com Base/Empresa + CPF + Senha
  getCompanies: () => request('/auth/companies'),
  getQuickUsers: () => request('/auth/quick-users'),
  login: (company: string, cpf: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ company, cpf, password }),
    }),
  quickLogin: (cpf: string) =>
    request('/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ cpf }),
    }),

  // Veículos
  getVehicles: (tenantId?: string) => request(`/vehicles${tenantId ? `?tenantId=${tenantId}` : ''}`),
  getAvailableVehicles: () => request('/vehicles/available'),
  createVehicle: (data: {
    plate: string;
    brand: string;
    model: string;
    year: number;
    currentMileage: number;
    status?: 'AVAILABLE' | 'MAINTENANCE';
    tenantId?: string;
  }) =>
    request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateVehicleStatus: (
    id: string,
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE',
    currentMileage?: number
  ) =>
    request(`/vehicles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(currentMileage !== undefined ? { currentMileage } : {}),
      }),
    }),

  // Usuários & Cadastros (Admin e Gestor)
  getUsers: (tenantId?: string) => request(`/users${tenantId ? `?tenantId=${tenantId}` : ''}`),
  createUser: (data: {
    name: string;
    cpf: string;
    email?: string;
    role: 'ADMIN' | 'FLEET_MANAGER' | 'DRIVER';
    creatorRole?: string;
    password?: string;
    tenantId?: string;
  }) =>
    request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Checklist
  getChecklistTemplate: () => request('/checklists/template'),
  getDriverChecklists: (driverId: string) => request(`/checklists?driverId=${driverId}`),

  // Rota / Usages
  getActiveUsage: (driverId: string) => request(`/usages/active/${driverId}`),
  getDriverTrips: (driverId: string) => request(`/usages/driver/${driverId}`),
  getAllTrips: (tenantId?: string) => request(`/usages${tenantId ? `?tenantId=${tenantId}` : ''}`),

  startUsage: (data: {
    vehicleId: string;
    driverId: string;
    mileage: number;
    itemsResult: Record<string, { ok: boolean; observation?: string }>;
    observation?: string;
  }) =>
    request('/usages/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  pauseLunch: (usageId: string) =>
    request(`/usages/${usageId}/pause-lunch`, {
      method: 'PATCH',
    }),
  resumeLunch: (usageId: string) =>
    request(`/usages/${usageId}/resume-lunch`, {
      method: 'PATCH',
    }),
  finishUsage: (
    usageId: string,
    data: {
      exitMileage: number;
      itemsResult: Record<string, { ok: boolean; observation?: string }>;
      observation?: string;
    }
  ) =>
    request(`/usages/${usageId}/finish`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Ponto CLT
  punchClock: (data: {
    userId: string;
    type: 'ENTRADA' | 'ALMOCO_SAIDA' | 'ALMOCO_RETORNO' | 'SAIDA';
    timestamp?: string;
    isOffline?: boolean;
    latitude?: number;
    longitude?: number;
  }) =>
    request('/timeclock/punch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  syncOfflineClocks: (clocks: any[]) =>
    request('/timeclock/sync', {
      method: 'POST',
      body: JSON.stringify({ clocks }),
    }),
  getTodayPunches: (userId: string) => request(`/timeclock/today/${userId}`),
  getTimeClockReport: (tenantId?: string) => request(`/timeclock/report${tenantId ? `?tenantId=${tenantId}` : ''}`),

  // Notificações
  getNotifications: () => request('/notifications'),
};
