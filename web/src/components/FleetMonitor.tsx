'use client';

import React, { useState } from 'react';
import { Car, User, Search, Filter, ShieldAlert, CheckCircle2, Navigation } from 'lucide-react';

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
}

export function FleetMonitor({ vehicles }: FleetMonitorProps) {
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
    <div className="bg-[#1E293B] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Barra de Filtros & Busca */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-400" />
            Monitoramento da Frota em Tempo Real
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhamento de viaturas, motoristas em rota e odômetro atualizado
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Busca */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar placa, modelo, condutor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0B1120] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filtros por Botão */}
          <div className="flex bg-[#0B1120] p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({vehicles.length})
            </button>
            <button
              onClick={() => setFilter('IN_USE')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'IN_USE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Em Rota ({vehicles.filter((v) => v.status === 'IN_USE').length})
            </button>
            <button
              onClick={() => setFilter('AVAILABLE')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'AVAILABLE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Disponíveis ({vehicles.filter((v) => v.status === 'AVAILABLE').length})
            </button>
            <button
              onClick={() => setFilter('MAINTENANCE')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'MAINTENANCE' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Oficina ({vehicles.filter((v) => v.status === 'MAINTENANCE').length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Cartões de Veículos */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">
            Nenhum veículo localizado com os critérios selecionados.
          </div>
        ) : (
          filteredVehicles.map((v) => {
            const isAvailable = v.status === 'AVAILABLE';
            const isInUse = v.status === 'IN_USE';
            const isMaintenance = v.status === 'MAINTENANCE';

            return (
              <div
                key={v.id}
                className={`bg-[#0B1120] rounded-xl p-4 border transition-all hover:border-slate-600 ${
                  isInUse
                    ? 'border-blue-500/40 shadow-md shadow-blue-500/5'
                    : isMaintenance
                    ? 'border-amber-500/40 shadow-md shadow-amber-500/5'
                    : 'border-slate-800'
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between">
                  <span className="text-base font-black tracking-wider text-white bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
                    {v.plate}
                  </span>

                  {/* Status Badge */}
                  {isInUse && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                      <Navigation className="w-3 h-3 animate-pulse" />
                      EM ROTA
                    </span>
                  )}
                  {isAvailable && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      DISPONÍVEL
                    </span>
                  )}
                  {isMaintenance && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      OFICINA
                    </span>
                  )}
                </div>

                {/* Marca e Modelo */}
                <div className="mt-3">
                  <h3 className="font-bold text-slate-200 text-sm">
                    {v.brand} {v.model}
                  </h3>
                  <p className="text-xs text-slate-500">Ano de fabricação: {v.year}</p>
                </div>

                {/* Odômetro e Base */}
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Odômetro:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {v.currentMileage.toLocaleString('pt-BR')} km
                  </span>
                </div>

                {/* Condutor Atual (se em rota) */}
                <div className="mt-2 text-xs">
                  {isInUse ? (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 mt-1">
                      <span className="text-[10px] text-blue-400 font-semibold block uppercase tracking-wider">
                        Condutor Atual:
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-slate-200 font-bold">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span>{v.currentDriver?.name || 'Motorista em Rota'}</span>
                      </div>
                    </div>
                  ) : isMaintenance ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-1 text-amber-300">
                      <span className="text-[10px] font-semibold block uppercase tracking-wider">
                        Avaria / Manutenção:
                      </span>
                      <span className="text-[11px]">Viatura bloqueada para reparos</span>
                    </div>
                  ) : (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2 mt-1 text-slate-400">
                      <span className="text-[10px] font-semibold block uppercase tracking-wider text-slate-500">
                        Pátio Operacional:
                      </span>
                      <span className="text-[11px] text-emerald-400 font-medium">Livre para escala</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
