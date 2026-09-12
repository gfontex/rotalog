import { Platform } from 'react-native';

const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';

export let BASE_URL = DEFAULT_HOST;

export function setCustomApiUrl(url: string) {
  BASE_URL = url.trim();
}

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

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
