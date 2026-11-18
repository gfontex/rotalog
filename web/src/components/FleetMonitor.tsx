'use client';

import React, { useState } from 'react';
import {
  Car,
  User,
  Search,
  ShieldAlert,
  CheckCircle2,
  Navigation,
  CheckSquare,
  Flag,
  Wrench,
} from 'lucide-react';
import { ASSETS, UI_TOKENS } from '../theme';
import { CorporateEmptyState } from './BrandLogo';

interface VehicleItem {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  currentMileage: number;
  branchName?: string | null;
  currentDriver?: {
    id: string;
    name: string;
  } | null;
}

interface FleetMonitorProps {
  vehicles: VehicleItem[];
  onSelectVehicle?: (v: VehicleItem) => void;
  onStartRoute?: (v: VehicleItem) => void;
  onFinishRoute?: (v: VehicleItem) => void;
  canManageVehicles?: boolean;
  onChangeVehicleStatus?: (v: VehicleItem, newStatus: 'AVAILABLE' | 'MAINTENANCE') => void;
}

export function FleetMonitor({
  vehicles,
  onStartRoute,
  onFinishRoute,
  canManageVehicles = false,
  onChangeVehicleStatus,
}: FleetMonitorProps) {
  const [filter, setFilter] = useState<'ALL' | 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE'>('ALL');
  const [search, setSearch] = useState('');

  const filteredVehicles = vehicles.filter((v) => {
    const matchesFilter = filter === 'ALL' || v.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      v.plate.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      (v.currentDriver?.name && v.currentDriver.name.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className={`${UI_TOKENS.card} overflow-hidden`}>
      {/* Barra de Filtros & Busca */}
      <div className="p-5 sm:p-6 border-b border-surface-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-content-primary flex items-center gap-2">
            <Car className="w-5 h-5 text-brand-primary" />
            Registros dos Carros & Operação da Frota
          </h2>
          <p className="text-xs text-content-secondary">
            Acompanhamento de viaturas, checklist de vistoria e início de rotas pelo PC
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-content-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar placa, modelo, condutor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-surface-bg border border-surface-border rounded-xl text-xs text-content-primary placeholder-content-muted focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="flex bg-surface-bg p-1 rounded-xl border border-surface-border text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'ALL'
                  ? 'keep-white bg-brand-primary text-white font-bold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Todos ({vehicles.length})
            </button>
            <button
              onClick={() => setFilter('AVAILABLE')}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'AVAILABLE'
                  ? 'keep-white bg-emerald-600 text-white font-bold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Disponíveis ({vehicles.filter((v) => v.status === 'AVAILABLE').length})
            </button>
            <button
              onClick={() => setFilter('IN_USE')}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'IN_USE'
                  ? 'keep-white bg-blue-600 text-white font-bold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Em Rota ({vehicles.filter((v) => v.status === 'IN_USE').length})
            </button>
            <button
              onClick={() => setFilter('MAINTENANCE')}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'MAINTENANCE'
                  ? 'keep-white bg-amber-600 text-white font-bold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Oficina ({vehicles.filter((v) => v.status === 'MAINTENANCE').length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Cartões de Veículos */}
      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full">
            <CorporateEmptyState
              title="Nenhum veículo localizado"
              description="Não há viaturas correspondentes aos filtros ou termos pesquisados."
            />
          </div>
        ) : (
          filteredVehicles.map((v) => {
            const isAvailable = v.status === 'AVAILABLE';
            const isInUse = v.status === 'IN_USE';
            const isMaintenance = v.status === 'MAINTENANCE';

            return (
              <div
                key={v.id}
                className={`bg-surface-bg rounded-2xl p-4 border flex flex-col justify-between transition-all hover:border-brand-primary/40 ${
                  isInUse
                    ? 'border-blue-500/40'
                    : isMaintenance
                    ? 'border-amber-500/40'
                    : 'border-surface-border'
                }`}
              >
                <div>
                  {/* Miniatura Corporativa do Veículo + Placa & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="logo-navy-box w-11 h-9 rounded-lg overflow-hidden border border-sky-500/25 shrink-0">
                        <img
                          src={ASSETS.vehiclePlaceholder}
                          alt={`${v.brand} ${v.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-black tracking-wider text-content-primary bg-surface-elevated px-2.5 py-1 rounded-lg border border-surface-border font-mono">
                        {v.plate}
                      </span>
                    </div>

                    {isInUse && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${UI_TOKENS.badgeInfo}`}>
                        <Navigation className="w-3 h-3 animate-pulse" />
                        EM ROTA
                      </span>
                    )}
                    {isAvailable && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${UI_TOKENS.badgeSuccess}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        DISPONÍVEL
                      </span>
                    )}
                    {isMaintenance && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${UI_TOKENS.badgeWarning}`}>
                        <ShieldAlert className="w-3 h-3" />
                        OFICINA
                      </span>
                    )}
                  </div>

                  {/* Marca e Modelo */}
                  <div className="mt-3">
                    <h3 className="font-extrabold text-content-primary text-sm">
                      {v.brand} {v.model}
                    </h3>
                    <p className="text-xs text-content-muted">Ano de fabricação: {v.year}</p>
                  </div>

                  {/* Odômetro */}
                  <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between text-xs text-content-secondary">
                    <span>Odômetro:</span>
                    <span className="font-mono font-bold text-content-primary">
                      {v.currentMileage.toLocaleString('pt-BR')} km
                    </span>
                  </div>

                  {/* Condutor Atual / Detalhes de Status */}
                  <div className="mt-2 text-xs">
                    {isInUse ? (
                      <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-2.5 mt-1">
                        <span className="text-[10px] text-blue-400 font-bold block uppercase tracking-wider">
                          Condutor em Trânsito:
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-content-primary font-bold">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          <span>{v.currentDriver?.name || 'Motorista em Rota'}</span>
                        </div>
                      </div>
                    ) : isMaintenance ? (
                      <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-2.5 mt-1 text-amber-400">
                        <span className="text-[10px] font-bold block uppercase tracking-wider">
                          Vistoria Apontou Avaria:
                        </span>
                        <span className="text-[11px]">Carro bloqueado para conserto</span>
                      </div>
                    ) : (
                      <div className="bg-surface-elevated border border-surface-border rounded-xl p-2.5 mt-1 text-content-secondary">
                        <span className="text-[10px] font-bold block uppercase tracking-wider text-content-muted">
                          Pátio Operacional:
                        </span>
                        <span className="text-[11px] text-emerald-400 font-semibold">Livre para assumir rota</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="mt-4 pt-3 border-t border-surface-border space-y-2">
                  {isAvailable && onStartRoute && (
                    <button
                      type="button"
                      onClick={() => onStartRoute(v)}
                      className="keep-white w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Iniciar Rota (Checklist)</span>
                    </button>
                  )}

                  {isInUse && onFinishRoute && (
                    <button
                      type="button"
                      onClick={() => onFinishRoute(v)}
                      className="keep-white w-full py-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Encerrar Rota (Devolução)</span>
                    </button>
                  )}

                  {canManageVehicles && isAvailable && onChangeVehicleStatus && (
                    <button
                      type="button"
                      onClick={() => onChangeVehicleStatus(v, 'MAINTENANCE')}
                      className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Enviar p/ Oficina (Manutenção)</span>
                    </button>
                  )}

                  {isMaintenance && canManageVehicles && onChangeVehicleStatus ? (
                    <button
                      type="button"
                      onClick={() => onChangeVehicleStatus(v, 'AVAILABLE')}
                      className="w-full py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/35 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Liberar da Oficina (Disponível)</span>
                    </button>
                  ) : isMaintenance ? (
                    <div className="w-full py-1.5 text-center text-[11px] text-amber-400 font-bold bg-amber-500/10 rounded-xl border border-amber-500/25">
                      Indisponível no Momento
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
