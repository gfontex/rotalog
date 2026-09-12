'use client';

import React, { useState } from 'react';
import { Clock, Search, ShieldCheck, WifiOff, Wifi } from 'lucide-react';

interface PunchRecord {
  id: string;
  userId: string;
  userName: string;
  userCpf: string;
  userRole: string;
  type: 'ENTRADA' | 'ALMOCO_SAIDA' | 'ALMOCO_RETORNO' | 'SAIDA';
  timestamp: string;
  isOffline: boolean;
}

interface TimeClockMirrorProps {
  punches: PunchRecord[];
}

export function TimeClockMirror({ punches }: TimeClockMirrorProps) {
  const [search, setSearch] = useState('');

  const filteredPunches = punches.filter((p) => {
    const q = search.toLowerCase();
    return p.userName.toLowerCase().includes(q) || p.userCpf.includes(q);
  });

  const punchTypeMap: any = {
    ENTRADA: { label: 'Entrada Turno', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    ALMOCO_SAIDA: { label: 'Saída Almoço', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    ALMOCO_RETORNO: { label: 'Retorno Almoço', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    SAIDA: { label: 'Saída Turno', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  };

  return (
    <div className="bg-[#1E293B] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Cabeçalho */}
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Espelho de Ponto Eletrônico CLT
          </h2>
          <p className="text-xs text-slate-400">
            Registro de batidas manuais em conformidade com as diretrizes trabalhistas
          </p>
        </div>

        {/* Busca */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por colaborador ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0B1120] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Tabela de Batidas */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#0B1120] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Colaborador</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Função</th>
              <th className="px-4 py-3">Tipo da Marcação</th>
              <th className="px-4 py-3">Data da Batida</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3 text-center">Modo de Gravação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredPunches.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma batida de ponto encontrada.
                </td>
              </tr>
            ) : (
              filteredPunches.map((p) => {
                const dateObj = new Date(p.timestamp);
                const styleObj = punchTypeMap[p.type] || { label: p.type, color: 'text-slate-400 bg-slate-800' };

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{p.userName}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{p.userCpf || '-'}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {p.userRole === 'DRIVER' ? 'Motorista' : p.userRole === 'FLEET_MANAGER' ? 'Gestor de Frota' : p.userRole}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${styleObj.color}`}>
                        {styleObj.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {dateObj.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-base text-purple-300">
                      {dateObj.toLocaleTimeString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.isOffline ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-[10px] font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <WifiOff className="w-3 h-3" />
                          Offline Sincronizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <Wifi className="w-3 h-3" />
                          Online em Tempo Real
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
