import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export interface QueuedClock {
  id: string;
  userId: string;
  type: 'ENTRADA' | 'ALMOCO_SAIDA' | 'ALMOCO_RETORNO' | 'SAIDA';
  timestamp: string;
  isOffline: boolean;
  latitude?: number;
  longitude?: number;
}

const STORAGE_KEY = '@rotalog_offline_clock_queue';

export const offlineQueue = {
  // Adiciona uma batida na fila local
  enqueue: async (item: Omit<QueuedClock, 'id' | 'isOffline'>): Promise<QueuedClock> => {
    const queue = await offlineQueue.getAll();
    const queuedItem: QueuedClock = {
      ...item,
      id: 'offline-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      isOffline: true,
    };
    queue.push(queuedItem);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return queuedItem;
  },

  // Retorna todos os itens pendentes
  getAll: async (): Promise<QueuedClock[]> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Retorna quantidade de batidas pendentes
  getPendingCount: async (): Promise<number> => {
    const list = await offlineQueue.getAll();
    return list.length;
  },

  // Sincroniza a fila com o backend
  sync: async (): Promise<{ success: boolean; syncedCount: number; error?: string }> => {
    const list = await offlineQueue.getAll();
    if (list.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    try {
      await api.syncOfflineClocks(list);
      // Limpa fila após sincronização com sucesso
      await AsyncStorage.removeItem(STORAGE_KEY);
      return { success: true, syncedCount: list.length };
    } catch (err: any) {
      return {
        success: false,
        syncedCount: 0,
        error: err?.message || 'Falha ao sincronizar com servidor',
      };
    }
  },

  // Limpa a fila
  clear: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
