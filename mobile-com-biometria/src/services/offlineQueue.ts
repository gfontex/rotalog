// Gerenciador de Fila Offline-First para o ROTALOG Mobile

export interface QueuedChecklist {
  id: string;
  type: 'ENTRY' | 'EXIT';
  vehicleId: string;
  vehiclePlate: string;
  mileage: number;
  itemsResult: Record<string, boolean>;
  observation?: string;
  photoUrls?: string[];
  hasProblem: boolean;
  createdAt: string;
  retryCount: number;
}

export interface QueuedClocking {
  id: string;
  type: 'IN' | 'OUT' | 'LUNCH_OUT' | 'LUNCH_IN';
  timestamp: string;
  facialVerified: boolean;
  matchScore: number;
  createdAt: string;
}

class OfflineQueueService {
  private checklistQueue: QueuedChecklist[] = [];
  private clockingQueue: QueuedClocking[] = [];
  private listeners: Array<() => void> = [];

  // Adicionar checklist na fila offline
  enqueueChecklist(checklist: Omit<QueuedChecklist, 'id' | 'createdAt' | 'retryCount'>): QueuedChecklist {
    const item: QueuedChecklist = {
      ...checklist,
      id: `offline_chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    this.checklistQueue.push(item);
    this.notifyListeners();
    return item;
  }

  // Adicionar batida de ponto na fila offline
  enqueueClocking(clocking: Omit<QueuedClocking, 'id' | 'createdAt'>): QueuedClocking {
    const item: QueuedClocking = {
      ...clocking,
      id: `offline_clock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    this.clockingQueue.push(item);
    this.notifyListeners();
    return item;
  }

  // Total de itens pendentes na fila
  getPendingCount(): number {
    return this.checklistQueue.length + this.clockingQueue.length;
  }

  // Obter itens da fila
  getChecklistQueue(): QueuedChecklist[] {
    return [...this.checklistQueue];
  }

  // Sincronizar fila pendente com o Backend (quando a conexão retorna)
  async syncQueue(apiBaseUrl: string = 'http://localhost:3001/api'): Promise<{
    syncedChecklists: number;
    syncedClockings: number;
    failed: number;
  }> {
    let syncedChecklists = 0;
    let syncedClockings = 0;
    let failed = 0;

    const remainingChecklists: QueuedChecklist[] = [];

    for (const item of this.checklistQueue) {
      try {
        const response = await fetch(`${apiBaseUrl}/checklists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId: item.vehicleId,
            type: item.type,
            mileage: item.mileage,
            itemsResult: item.itemsResult,
            observation: item.observation,
            photoUrls: item.photoUrls,
            hasProblem: item.hasProblem,
          }),
        });

        if (response.ok) {
          syncedChecklists++;
        } else {
          item.retryCount++;
          remainingChecklists.push(item);
          failed++;
        }
      } catch (error) {
        item.retryCount++;
        remainingChecklists.push(item);
        failed++;
      }
    }

    this.checklistQueue = remainingChecklists;
    this.notifyListeners();

    return {
      syncedChecklists,
      syncedClockings,
      failed,
    };
  }

  // Limpar fila manualmente (ou para testes)
  clearQueue() {
    this.checklistQueue = [];
    this.clockingQueue = [];
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Erro no listener da fila offline:', err);
      }
    });
  }
}

export const offlineQueue = new OfflineQueueService();
