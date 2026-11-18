'use client';

// Resumo: Check list preenchimento (vistoria de devolucao do veiculo)

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Car,
  Gauge,
  Fuel,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { webApi } from '../services/api';
import { UI_TOKENS } from '../theme';

interface ReturnChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usage: any | null;
}

const RETURN_CHECKLIST_ITEMS = [
  { id: 'fuel', label: 'Nível de Combustível de Devolução', icon: Fuel, isFuel: true },
  { id: 'tires', label: 'Pneus e Rodas (Sem furos ou danos)', icon: Gauge },
  { id: 'bodywork', label: 'Lataria (Sem novas avarias ou batidas na rota)', icon: Car },
  { id: 'cleanliness', label: 'Limpeza Interna e Retirada de Pertences', icon: CheckCircle2 },
  { id: 'documents', label: 'Documentos e Chaves Entregues', icon: FileText },
];

export function ReturnChecklistModal({
  isOpen,
  onClose,
  onSuccess,
  usage,
}: ReturnChecklistModalProps) {
  const [exitMileage, setExitMileage] = useState<number>(0);
  const [fuelLevel, setFuelLevel] = useState('CHEIO');
  const [itemsState, setItemsState] = useState<Record<string, { ok: boolean; obs: string }>>({});
  const [generalObs, setGeneralObs] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usage) {
      const startKm = usage.vehicle?.currentMileage || 45000;
      setExitMileage(startKm + 25);

      const initialItems: Record<string, { ok: boolean; obs: string }> = {};
      RETURN_CHECKLIST_ITEMS.forEach((item) => {
        initialItems[item.id] = { ok: true, obs: '' };
      });
      setItemsState(initialItems);
      setGeneralObs('');
      setFuelLevel('CHEIO');
    }
  }, [usage]);

  if (!isOpen || !usage) return null;

  const startKm = usage.vehicle?.currentMileage || 0;
  const distanceDriven = Math.max(0, exitMileage - startKm);
  const hasProblem = Object.values(itemsState).some((item) => !item.ok);

  const toggleItemOk = (id: string, ok: boolean) => {
    setItemsState((prev) => ({
      ...prev,
      [id]: { ...prev[id], ok },
    }));
  };

  const setItemObs = (id: string, obs: string) => {
    setItemsState((prev) => ({
      ...prev,
      [id]: { ...prev[id], obs },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exitMileage < startKm) {
      alert(`O odômetro final (${exitMileage} km) não pode ser menor que o odômetro de saída (${startKm} km).`);
      return;
    }

    setLoading(true);
    try {
      const itemsResult: Record<string, { ok: boolean; observation?: string }> = {};
      Object.entries(itemsState).forEach(([key, val]) => {
        itemsResult[key] = {
          ok: val.ok,
          observation: key === 'fuel' ? `Nível: ${fuelLevel} ${val.obs ? `• ${val.obs}` : ''}` : val.obs || undefined,
        };
      });

      await webApi.finishUsage(usage.id, {
        exitMileage: Number(exitMileage),
        itemsResult,
        observation: generalObs.trim() || undefined,
      });

      if (hasProblem) {
        alert('Rota encerrada. Como foram apontadas avarias, a viatura foi movida para a OFICINA (MANUTENÇÃO) e bloqueada para novos motoristas.');
      } else {
        alert('Viatura devolvida em perfeito estado. Rota finalizada e carro liberado no pátio.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao finalizar rota: ' + (err.message || 'Erro inesperado.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className={`${UI_TOKENS.card} max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]`}>
        {/* Cabeçalho */}
        <div className="p-5 sm:p-6 bg-surface-bg border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${UI_TOKENS.badgeInfo}`}>
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-content-primary text-base sm:text-lg">
                Vistoria de Devolução & Entrega da Viatura
              </h3>
              <p className="text-xs text-content-secondary">
                Conferência final de encerramento da rota e cálculo de quilometragem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Card Resumo do Uso */}
          <div className="p-4 bg-surface-bg border border-surface-border rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] font-bold text-content-secondary uppercase tracking-wider block mb-0.5">Viatura</span>
              <span className="font-mono font-bold text-content-primary text-sm">{usage.vehicle?.plate || usage.vehiclePlate}</span>
              <p className="text-xs text-content-secondary">{usage.vehicle?.model || usage.vehicleModel}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-content-secondary uppercase tracking-wider block mb-0.5">Condutor</span>
              <span className="font-bold text-content-primary text-sm">{usage.driver?.name || usage.driverName || 'Motorista'}</span>
              <p className="text-xs text-content-secondary">Saída: {new Date(usage.startTime).toLocaleTimeString('pt-BR')}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-content-secondary uppercase tracking-wider block mb-0.5">Km Inicial</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{startKm.toLocaleString('pt-BR')} Km</span>
            </div>
          </div>

          {/* Cálculo do Odômetro Final */}
          <div className="p-4 bg-sky-500/10 border border-sky-500/25 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                  Odômetro Final de Devolução (Km) *
                </label>
                <input
                  type="number"
                  value={exitMileage}
                  onChange={(e) => setExitMileage(Number(e.target.value))}
                  min={startKm}
                  className="px-3.5 py-2 bg-surface-bg border border-surface-border rounded-xl text-sm text-content-primary focus:outline-none focus:border-brand-primary font-mono font-bold w-48"
                  required
                />
              </div>

              <div className="bg-surface-bg p-3 rounded-xl border border-surface-border text-right">
                <span className="text-[10px] font-bold text-content-secondary uppercase tracking-wider block mb-0.5">
                  Distância Total Percorrida
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  + {distanceDriven.toLocaleString('pt-BR')} Km
                </span>
              </div>
            </div>
          </div>

          {/* Itens do Checklist de Devolução */}
          <div>
            <label className="text-xs font-bold text-content-primary uppercase tracking-wider block mb-2.5">
              Conferência dos Itens de Devolução
            </label>

            <div className="space-y-2.5">
              {RETURN_CHECKLIST_ITEMS.map((item) => {
                const state = itemsState[item.id] || { ok: true, obs: '' };
                const Icon = item.icon;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      state.ok ? 'bg-surface-bg border-surface-border' : 'bg-rose-500/10 border-rose-500/35'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${state.ok ? 'text-content-secondary' : 'text-rose-400'}`} />
                        <span className="text-xs sm:text-sm font-semibold text-content-primary">
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => toggleItemOk(item.id, true)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            state.ok
                              ? 'keep-white bg-emerald-600 text-white'
                              : 'bg-surface-elevated text-content-secondary hover:text-content-primary border border-surface-border'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Conforme</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleItemOk(item.id, false)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            !state.ok
                              ? 'keep-white bg-rose-600 text-white'
                              : 'bg-surface-elevated text-content-secondary hover:text-content-primary border border-surface-border'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Avaria / Problema</span>
                        </button>
                      </div>
                    </div>

                    {item.isFuel && (
                      <div className="mt-3 pt-2.5 border-t border-surface-border flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-content-secondary">Nível do Tanque:</span>
                        {['CHEIO', '3/4', '1/2', '1/4', 'RESERVA'].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setFuelLevel(lvl)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              fuelLevel === lvl
                                ? 'keep-white bg-brand-primary text-white'
                                : 'bg-surface-elevated text-content-secondary hover:text-content-primary border border-surface-border'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    )}

                    {!state.ok && (
                      <div className="mt-2.5 pt-2 border-t border-rose-500/20">
                        <input
                          type="text"
                          placeholder="Descreva o problema ou avaria identificada na devolução..."
                          value={state.obs}
                          onChange={(e) => setItemObs(item.id, e.target.value)}
                          className="w-full px-3 py-1.5 bg-surface-card border border-rose-500/40 rounded-xl text-xs text-rose-400 placeholder-rose-400/50 focus:outline-none focus:border-rose-400"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {hasProblem && (
            <div className={`p-4 rounded-xl text-xs flex items-start gap-3 ${UI_TOKENS.badgeWarning}`}>
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">
                  Regra Automática de Manutenção:
                </strong>
                Como foram apontadas avarias na devolução, ao confirmar, o veículo será automaticamente bloqueado no status <strong>OFICINA (MAINTENANCE)</strong> e um alerta prioritário será emitido para o gestor.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider mb-1.5">
              Considerações Finais da Devolução
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Rota finalizada sem intercorrências, veículo devolvido no pátio 2."
              value={generalObs}
              onChange={(e) => setGeneralObs(e.target.value)}
              className={UI_TOKENS.input}
            />
          </div>

          <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={UI_TOKENS.btnSecondary}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className={UI_TOKENS.btnPrimary}
            >
              {loading ? 'Finalizando...' : 'Confirmar Devolução e Encerrar Rota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
