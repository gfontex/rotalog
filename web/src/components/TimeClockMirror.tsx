'use client';

import React, { useState } from 'react';
import { Clock, Search, WifiOff, Wifi, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { UI_TOKENS } from '../theme';
import { CorporateEmptyState } from './BrandLogo';

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
    ENTRADA: { label: 'Entrada Turno', color: UI_TOKENS.badgeSuccess },
    ALMOCO_SAIDA: { label: 'Saída Almoço', color: UI_TOKENS.badgeWarning },
    ALMOCO_RETORNO: { label: 'Retorno Almoço', color: UI_TOKENS.badgeInfo },
    SAIDA: { label: 'Saída Turno', color: UI_TOKENS.badgeDanger },
  };

  const exportTimeClockXLSX = () => {
    if (filteredPunches.length === 0) {
      alert('Não há batidas de ponto para exportar.');
      return;
    }

    const rows = filteredPunches.map((p) => {
      const dateObj = new Date(p.timestamp);
      const roleLabel =
        p.userRole === 'DRIVER'
          ? 'Motorista'
          : p.userRole === 'FLEET_MANAGER'
          ? 'Gestor de Frota'
          : p.userRole === 'ADMIN'
          ? 'Admin (Representante Legal)'
          : p.userRole;

      return {
        Colaborador: p.userName,
        CPF: p.userCpf || '-',
        Função: roleLabel,
        'Tipo da Marcação': punchTypeMap[p.type]?.label || p.type,
        'Data da Batida': dateObj.toLocaleDateString('pt-BR'),
        Horário: dateObj.toLocaleTimeString('pt-BR'),
        'Modo de Registro': p.isOffline ? 'Offline Sincronizado' : 'Online em Tempo Real',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 30 },
      { wch: 16 },
      { wch: 24 },
      { wch: 20 },
      { wch: 16 },
      { wch: 14 },
      { wch: 24 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ponto dos Colaboradores');
    XLSX.writeFile(wb, `relatorio_ponto_colaboradores_${Date.now()}.xlsx`);
  };

  return (
    <div className={`${UI_TOKENS.card} overflow-hidden`}>
      <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Espelho de Ponto Eletrônico CLT
          </h2>
          <p className="text-xs text-content-secondary">
            Registro de batidas manuais em conformidade com as diretrizes trabalhistas
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-content-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por colaborador ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-surface-bg border border-surface-border rounded-xl text-xs text-content-primary placeholder-content-muted focus:outline-none focus:border-brand-primary"
            />
          </div>

          <button
            type="button"
            onClick={exportTimeClockXLSX}
            className="keep-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Ponto (.xlsx)</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredPunches.length === 0 ? (
          <CorporateEmptyState
            title="Nenhuma batida de ponto encontrada"
            description="Registros de entrada, almoço e saída dos colaboradores serão exibidos aqui."
          />
        ) : (
          <table className="w-full text-left text-xs text-content-secondary">
            <thead className="bg-surface-bg text-content-secondary uppercase tracking-wider font-semibold border-b border-surface-border">
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
            <tbody className="divide-y divide-surface-border">
              {filteredPunches.map((p) => {
                const dateObj = new Date(p.timestamp);
                const styleObj = punchTypeMap[p.type] || { label: p.type, color: 'bg-surface-elevated text-content-secondary border border-surface-border' };

                return (
                  <tr key={p.id} className="hover:bg-surface-elevated/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-content-primary">{p.userName}</td>
                    <td className="px-4 py-3 font-mono text-content-secondary">{p.userCpf || '-'}</td>
                    <td className="px-4 py-3 text-content-secondary">
                      {p.userRole === 'DRIVER' ? 'Motorista' : p.userRole === 'FLEET_MANAGER' ? 'Gestor de Frota' : p.userRole}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${styleObj.color}`}>
                        {styleObj.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-content-primary">
                      {dateObj.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-base text-purple-400">
                      {dateObj.toLocaleTimeString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.isOffline ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${UI_TOKENS.badgeWarning}`}>
                          <WifiOff className="w-3 h-3" />
                          Offline Sincronizado
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${UI_TOKENS.badgeSuccess}`}>
                          <Wifi className="w-3 h-3" />
                          Online em Tempo Real
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
