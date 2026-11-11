import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveDefaultHost(): string {
  // 1. Tenta extrair automaticamente o IP da máquina a partir da conexão do Expo Go
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3001`;
      }
    }
  } catch (_) {}

  // 2. IP atual da máquina na rede local
  const LOCAL_MACHINE_IP = '192.168.99.111';

  // 3. Fallbacks por plataforma
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }

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
  getVehicles: () => request('/vehicles'),
  getAvailableVehicles: () => request('/vehicles/available'),

  // Checklist
  getChecklistTemplate: () => request('/checklists/template'),
  getDriverChecklists: (driverId: string) => request(`/checklists?driverId=${driverId}`),

  // Rota / Usages
  getActiveUsage: (driverId: string) => request(`/usages/active/${driverId}`),
  getDriverTrips: (driverId: string) => request(`/usages/driver/${driverId}`),
  getAllTrips: () => request('/usages'),

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

  // Notificações
  getNotifications: () => request('/notifications'),
};
