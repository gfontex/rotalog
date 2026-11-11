const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetcher(endpoint: string, options: RequestInit = {}) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Erro HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.warn(`[Web API] Falha na rota ${endpoint}:`, error.message);
    throw error;
  }
}

export const webApi = {
  // Autenticação
  login: (data: { company: string; cpf: string; password?: string }) =>
    fetcher('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCompanies: () => fetcher('/auth/companies'),
  getQuickUsers: () => fetcher('/auth/quick-users'),

  // Estatísticas
  getStats: (tenantId?: string) => fetcher(`/notifications/stats${tenantId ? `?tenantId=${tenantId}` : ''}`),

  // Empresas / Tenants
  getTenants: () => fetcher('/tenants'),
  createTenant: (data: {
    name: string;
    cnpj?: string;
    adminName: string;
    adminCpf: string;
    adminEmail: string;
    adminPassword?: string;
  }) =>
    fetcher('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Veículos
  getVehicles: (tenantId?: string) => fetcher(`/vehicles${tenantId ? `?tenantId=${tenantId}` : ''}`),
  createVehicle: (data: {
    plate: string;
    brand: string;
    model: string;
    year: number;
    currentMileage: number;
    tenantId?: string;
    branchId?: string;
  }) =>
    fetcher('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Relatórios de Viagens
  getUsages: (tenantId?: string) => fetcher(`/usages${tenantId ? `?tenantId=${tenantId}` : ''}`),
  getDriverTrips: (driverId: string) => fetcher(`/usages/driver/${driverId}`),

  // Ponto CLT
  getTimeClockReport: (tenantId?: string) => fetcher(`/timeclock/report${tenantId ? `?tenantId=${tenantId}` : ''}`),

  // Notificações e Auditoria
  getNotifications: (tenantId?: string) => fetcher(`/notifications${tenantId ? `?tenantId=${tenantId}` : ''}`),

  // Usuários
  getUsers: (tenantId?: string) => fetcher(`/users${tenantId ? `?tenantId=${tenantId}` : ''}`),
  createUser: (data: {
    name: string;
    cpf: string;
    email: string;
    role: string;
    password?: string;
    tenantId?: string;
  }) =>
    fetcher('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
