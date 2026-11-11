'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ClipboardCheck,
  Car,
  Fuel,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Gauge,
  User,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { webApi } from '../services/api';

interface VehicleItem {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  currentMileage: number;
}

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicle: VehicleItem | null;
  drivers: any[];
  currentUserId?: string;
}

const CHECKLIST_ITEMS = [
  { id: 'fuel', label: 'Nível de Combustível', icon: Fuel, isFuel: true },
  { id: 'tires', label: 'Estado dos Pneus e Calibragem', icon: Gauge },
  { id: 'lights', label: 'Faróis, Lanternas e Setas', icon: CheckCircle2 },
  { id: 'bodywork', label: 'Lataria e Pintura (Sem amassados ou avarias)', icon: Car },
  { id: 'documents', label: 'Documentação do Veículo (CRLV) e Seguro', icon: FileText },
  { id: 'spare_tire', label: 'Estepe, Macaco, Chave de Roda e Triângulo', icon: CheckCircle2 },
  { id: 'wipers', label: 'Limpadores de Para-brisa e Vidros', icon: CheckCircle2 },
  { id: 'cleanliness', label: 'Limpeza Interna e Externa', icon: CheckCircle2 },
];

export function ChecklistModal({
  isOpen,
  onClose,
  onSuccess,
  vehicle,
  drivers,
  currentUserId,
}: ChecklistModalProps) {
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [mileage, setMileage] = useState<number>(0);
  const [fuelLevel, setFuelLevel] = useState('CHEIO');
  const [itemsState, setItemsState] = useState<Record<string, { ok: boolean; obs: string }>>({});
  const [generalObs, setGeneralObs] = useState('');
  const [loading, setLoading] = useState(false);

  // Inicializa o estado do checklist
  useEffect(() => {
    if (vehicle) {
      setMileage(vehicle.currentMileage || 0);
      const initialItems: Record<string, { ok: boolean; obs: string }> = {};
      CHECKLIST_ITEMS.forEach((item) => {
        initialItems[item.id] = { ok: true, obs: '' };
      });
      setItemsState(initialItems);
      setGeneralObs('');
      setFuelLevel('CHEIO');

      // Se for condutor logado, já seleciona a si mesmo
      if (currentUserId) {
        setSelectedDriverId(currentUserId);
      } else if (drivers.length > 0) {
        setSelectedDriverId(drivers[0].id);
      }
    }
  }, [vehicle, currentUserId, drivers]);

  if (!isOpen || !vehicle) return null;

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

  const hasAnyProblem = Object.values(itemsState).some((item) => !item.ok);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      alert('Selecione o condutor responsável pela viatura.');
      return;
    }

    if (mileage < vehicle.currentMileage) {
      alert(`O odômetro inicial não pode ser menor que o odômetro atual do carro (${vehicle.currentMileage} km).`);
      return;
    }

    setLoading(true);
    try {
      // Formata os itens para a API
      const itemsResult: Record<string, { ok: boolean; observation?: string }> = {};
      Object.entries(itemsState).forEach(([key, val]) => {
        itemsResult[key] = {
          ok: val.ok,
          observation: key === 'fuel' ? `Nível: ${fuelLevel} ${val.obs ? `• ${val.obs}` : ''}` : val.obs || undefined,
        };
      });

      await webApi.startUsage({
        vehicleId: vehicle.id,
        driverId: selectedDriverId,
        mileage: Number(mileage),
        itemsResult,
        observation: generalObs.trim() || undefined,
      });

      alert(`✅ Rota iniciada com sucesso para a viatura ${vehicle.plate}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao iniciar rota: ' + (err.message || 'Erro inesperado.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0F172A] rounded-3xl max-w-2xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="p-5 sm:p-6 bg-[#070B14] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                Vistoria Digital de Saída (Checklist)
              </h3>
              <p className="text-xs text-slate-400">
                Inspeção obrigatória antes de assumir a viatura na rua
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll Interno */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Card Resumo da Viatura */}
          <div className="p-4 bg-[#070B14] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Viatura Selecionada
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-white text-base px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                  {vehicle.plate}
                </span>
                <span className="text-sm font-bold text-slate-200">
                  {vehicle.brand} {vehicle.model} ({vehicle.year})
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Odômetro Atual
              </span>
              <span className="font-mono font-extrabold text-emerald-400 text-sm">
                {vehicle.currentMileage.toLocaleString('pt-BR')} Km
              </span>
            </div>
          </div>

          {/* Dados Iniciais: Condutor e Odômetro de Saída */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Condutor Responsável *
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                required
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.role === 'DRIVER' ? 'Motorista' : 'Gestor/Admin'}) - CPF {d.cpf}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                Odômetro Inicial de Saída (Km) *
              </label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                min={vehicle.currentMileage}
                className="w-full px-3.5 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* SEÇÃO: ITENS DO CHECKLIST OBRIGATÓRIO */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                Itens a Preencher na Vistoria
              </label>
              <span className="text-[11px] text-slate-400">Marque se cada item está Conforme ou Não</span>
            </div>

            <div className="space-y-2.5">
              {CHECKLIST_ITEMS.map((item) => {
                const state = itemsState[item.id] || { ok: true, obs: '' };
                const Icon = item.icon;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      state.ok
                        ? 'bg-[#070B14] border-slate-800'
                        : 'bg-rose-500/5 border-rose-500/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${state.ok ? 'text-slate-400' : 'text-rose-400'}`} />
                        <span className="text-xs sm:text-sm font-semibold text-slate-200">
                          {item.label}
                        </span>
                      </div>

                      {/* Botões Conforme / Não Conforme */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => toggleItemOk(item.id, true)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            state.ok
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>OK (Conforme)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleItemOk(item.id, false)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            !state.ok
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Avaria</span>
                        </button>
                      </div>
                    </div>

                    {/* Seletor específico de Combustível */}
                    {item.isFuel && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-400">Nível do Tanque:</span>
                        {['CHEIO', '3/4', '1/2', '1/4', 'RESERVA'].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setFuelLevel(lvl)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              fuelLevel === lvl
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Campo de Observação caso haja Avaria */}
                    {!state.ok && (
                      <div className="mt-2.5 pt-2 border-t border-rose-500/20">
                        <input
                          type="text"
                          placeholder="Descreva a avaria ou irregularidade identificada..."
                          value={state.obs}
                          onChange={(e) => setItemObs(item.id, e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#0B1120] border border-rose-500/40 rounded-xl text-xs text-rose-200 placeholder-rose-400/50 focus:outline-none focus:border-rose-400"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observações Gerais */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Observações Gerais da Vistoria (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Veículo higienizado, pneus dianteiros novos, pronto para a rota diária."
              value={generalObs}
              onChange={(e) => setGeneralObs(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#070B14] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Alerta de Avaria */}
          {hasAnyProblem && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                <strong>Atenção:</strong> Você apontou itens não conformes. O registro ficará salvo no histórico de auditoria da frota.
              </span>
            </div>
          )}

          {/* Botões do Rodapé */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold rounded-xl transition-all shadow-xl shadow-emerald-600/25 text-xs flex items-center gap-2 cursor-pointer"
            >
              {loading ? 'Iniciando Rota...' : 'Confirmar Checklist e Iniciar Rota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
