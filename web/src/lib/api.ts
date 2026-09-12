// Cliente de API HTTP para comunicação com o backend NestJS do ROTALOG

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rotalog-api.onrender.com/api';

export interface User {
  id: string;
  name: string;
  cpf: string;
  email: string;
  role: 'DRIVER' | 'FLEET_MANAGER' | 'HR' | 'ADMIN';
  tenantId: string;
  branchId?: string | null;
  isActive: boolean;
  facialEnrolled?: boolean;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  currentMileage: number;
  branch?: {
    id: string;
    name: string;
    city?: string;
  };
}

export const api = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('rotalog_token');
  },

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rotalog_token', token);
    }
  },

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rotalog_token');
      localStorage.removeItem('rotalog_user');
    }
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro na requisição: ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      // Se a requisição de rede falhar (ex: backend offline no momento do teste), permite fallback mock
      throw err;
    }
  },
};
