'use client';

import React, { useState } from 'react';
import { Download, Search, FileText, CheckCircle2, Clock, Coffee, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ChecklistData {
  mileage: number;
  hasProblem?: boolean;
  itemsResult?: any;
  observation?: string | null;
  createdAt?: string;
}

interface TripItem {
  id: string;
  startTime: string;
  endTime?: string | null;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalLunchMinutes: number;
  status: 'IN_PROGRESS' | 'PAUSED_LUNCH' | 'COMPLETED';
  driver?: {
    id: string;
    name: string;
    cpf: string;
  } | null;
  vehicle?: {
    id: string;
    plate: string;
    brand: string;
    model: string;
  } | null;
  entryChecklist?: ChecklistData | null;
  exitChecklist?: ChecklistData | null;
}

interface TripReportsProps {
  trips: TripItem[];
}

function formatCheckItem(items: any, keys: string[]): string {
  if (!items || typeof items !== 'object') return 'OK';
  for (const k of keys) {
    if (items[k] !== undefined) {
      const val = items[k];
      if (typeof val === 'boolean') return val ? 'OK' : 'AVARIA';
      if (typeof val === 'object' && val !== null) {
        if (val.ok === false) {
          return val.observation ? `AVARIA (${val.observation})` : 'AVARIA';
        }
        return 'OK';
      }
    }
  }
  return 'OK';
}

export function TripReports({ trips }: TripReportsProps) {
  const [search, setSearch] = useState('');

  const filteredTrips = trips.filter((t) => {
    const q = search.toLowerCase();
    const driverName = t.driver?.name?.toLowerCase() || '';
    const plate = t.vehicle?.plate?.toLowerCase() || '';
    const model = t.vehicle?.model?.toLowerCase() || '';
    return driverName.includes(q) || plate.includes(q) || model.includes(q);
  });

  const exportChecklistsAndTripsXLSX = () => {
    if (filteredTrips.length === 0) {
      alert('Não há dados de checklists ou viagens para exportar.');
      return;
    }

    const checklistRows: any[] = [];
    filteredTrips.forEach((t) => {
      const baseInfo = {
        Motorista: t.driver?.name || 'N/A',
        CPF: t.driver?.cpf || 'N/A',
        Placa: t.vehicle?.plate || 'N/A',
        Veículo: `${t.vehicle?.brand || ''} ${t.vehicle?.model || ''}`.trim() || 'N/A',
      };

      if (t.entryChecklist) {
        const items = t.entryChecklist.itemsResult || {};
        checklistRows.push({
          ...baseInfo,
          'Tipo Checklist': 'Saída (Início de Rota)',
          'Data/Hora': new Date(t.entryChecklist.createdAt || t.startTime).toLocaleString('pt-BR'),
          'Odômetro (Km)': t.entryChecklist.mileage || 0,
          'Resultado Geral': t.entryChecklist.hasProblem ? 'AVARIA REPORTADA' : 'CONFORME',
          Combustível: items.fuelLevel ? String(items.fuelLevel) : formatCheckItem(items, ['fuel']),
          Pneus: formatCheckItem(items, ['tires']),
          Lataria: formatCheckItem(items, ['bodywork']),
          Luzes: formatCheckItem(items, ['lights', 'headlights']),
          Documentação: formatCheckItem(items, ['docs', 'documents']),
          Observações: t.entryChecklist.observation || '-',
        });
      }

      if (t.exitChecklist) {
        const items = t.exitChecklist.itemsResult || {};
        checklistRows.push({
          ...baseInfo,
          'Tipo Checklist': 'Devolução (Fim de Rota)',
          'Data/Hora': new Date(t.exitChecklist.createdAt || t.endTime || t.startTime).toLocaleString('pt-BR'),
          'Odômetro (Km)': t.exitChecklist.mileage || 0,
          'Resultado Geral': t.exitChecklist.hasProblem ? 'AVARIA REPORTADA' : 'CONFORME',
          Combustível: items.fuelLevel ? String(items.fuelLevel) : formatCheckItem(items, ['fuel']),
          Pneus: formatCheckItem(items, ['tires']),
          Lataria: formatCheckItem(items, ['bodywork']),
          Luzes: formatCheckItem(items, ['lights', 'headlights']),
          Documentação: formatCheckItem(items, ['docs', 'documents']),
          Observações: t.exitChecklist.observation || '-',
        });
      }
    });

    const tripRows = filteredTrips.map((t) => ({
      Motorista: t.driver?.name || 'N/A',
      CPF: t.driver?.cpf || 'N/A',
      Placa: t.vehicle?.plate || 'N/A',
      Veículo: `${t.vehicle?.brand || ''} ${t.vehicle?.model || ''}`.trim(),
      Saída: new Date(t.startTime).toLocaleString('pt-BR'),
      Chegada: t.endTime ? new Date(t.endTime).toLocaleString('pt-BR') : 'Em Aberto',
      'Duração Líquida (min)': t.totalDurationMinutes || 0,
      'Almoço (min)': t.totalLunchMinutes || 0,
      'Km Inicial': t.entryChecklist?.mileage || 0,
      'Km Final': t.exitChecklist?.mileage ?? '-',
      'Km Percorrido': t.totalDistanceKm || 0,
      Status:
        t.status === 'COMPLETED'
          ? 'Concluída'
          : t.status === 'PAUSED_LUNCH'
          ? 'Pausa Almoço'
          : 'Em Rota',
    }));

    const wsChecklists = XLSX.utils.json_to_sheet(
      checklistRows.length > 0
        ? checklistRows
        : [{ Motorista: 'Nenhum checklist vinculado às viagens filtradas' }]
    );
    wsChecklists['!cols'] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 11 },
      { wch: 24 },
      { wch: 22 },
      { wch: 20 },
      { wch: 15 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 40 },
    ];

    const wsTrips = XLSX.utils.json_to_sheet(tripRows);
    wsTrips['!cols'] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 11 },
      { wch: 24 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsChecklists, 'Checklists de Vistoria');
    XLSX.utils.book_append_sheet(wb, wsTrips, 'Viagens e Quilometragem');
    XLSX.writeFile(wb, `relatorio_checklists_e_viagens_${Date.now()}.xlsx`);
  };

  return (
    <div className="bg-[#1E293B] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Cabeçalho do Relatório */}
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Relatório Operacional de Viagens & Checklists
          </h2>
          <p className="text-xs text-slate-400">
            Histórico detalhado com Km rodado, intervalo de refeição, inspeções e avarias
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Busca */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar motorista ou placa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0B1120] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Botão Exportar Excel (.xlsx) */}
          <button
            type="button"
            onClick={exportChecklistsAndTripsXLSX}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Checklists (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Tabela de Viagens */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#0B1120] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Motorista</th>
              <th className="px-4 py-3">Veículo / Placa</th>
              <th className="px-4 py-3">Horário de Saída</th>
              <th className="px-4 py-3">Horário de Chegada</th>
              <th className="px-4 py-3 text-center">Duração Líquida</th>
              <th className="px-4 py-3 text-center">Almoço</th>
              <th className="px-4 py-3 text-right">Km Inicial</th>
              <th className="px-4 py-3 text-right">Km Final</th>
              <th className="px-4 py-3 text-right">Km Percorrido</th>
              <th className="px-4 py-3">Checklist (Saída / Retorno)</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTrips.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma viagem registrada até o momento.
                </td>
              </tr>
            ) : (
              filteredTrips.map((t) => {
                const startDate = new Date(t.startTime);
                const endDate = t.endTime ? new Date(t.endTime) : null;
                const kmInitial = t.entryChecklist?.mileage || 0;
                const kmFinal = t.exitChecklist?.mileage || '-';
                const hasChecklistProblem = t.entryChecklist?.hasProblem || t.exitChecklist?.hasProblem;

                return (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Motorista */}
                    <td className="px-4 py-3 font-semibold text-white">
                      <div>{t.driver?.name || 'Condutor'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">CPF: {t.driver?.cpf || '-'}</div>
                    </td>

                    {/* Veículo */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-blue-400">{t.vehicle?.plate || '-'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {t.vehicle?.brand} {t.vehicle?.model}
                      </div>
                    </td>

                    {/* Saída */}
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {startDate.toLocaleDateString('pt-BR')} {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Chegada */}
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {endDate ? (
                        `${endDate.toLocaleDateString('pt-BR')} ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                      ) : (
                        <span className="text-amber-400 font-sans italic">Em Trânsito</span>
                      )}
                    </td>

                    {/* Duração */}
                    <td className="px-4 py-3 text-center font-mono">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-200">
                        {t.totalDurationMinutes} min
                      </span>
                    </td>

                    {/* Almoço */}
                    <td className="px-4 py-3 text-center font-mono">
                      {t.totalLunchMinutes > 0 ? (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded flex items-center justify-center gap-1 w-max mx-auto">
                          <Coffee className="w-3 h-3" />
                          {t.totalLunchMinutes} min
                        </span>
                      ) : (
                        <span className="text-slate-500">0 min</span>
                      )}
                    </td>

                    {/* Km Inicial */}
                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                      {kmInitial.toLocaleString('pt-BR')} km
                    </td>

                    {/* Km Final */}
                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                      {typeof kmFinal === 'number' ? `${kmFinal.toLocaleString('pt-BR')} km` : kmFinal}
                    </td>

                    {/* Km Percorrido */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      +{t.totalDistanceKm} km
                    </td>

                    {/* Checklist (Saída / Retorno) */}
                    <td className="px-4 py-3 max-w-[200px]">
                      {hasChecklistProblem ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          Avaria Reportada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Vistoria OK
                        </span>
                      )}
                      {(t.exitChecklist?.observation || t.entryChecklist?.observation) && (
                        <p className="text-[10px] text-slate-400 truncate mt-1" title={t.exitChecklist?.observation || t.entryChecklist?.observation || ''}>
                          {t.exitChecklist?.observation || t.entryChecklist?.observation}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {t.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Concluída
                        </span>
                      ) : t.status === 'PAUSED_LUNCH' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold border border-amber-500/30">
                          <Coffee className="w-3 h-3" />
                          Almoço
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-semibold border border-blue-500/30">
                          <Clock className="w-3 h-3 animate-spin" />
                          Em Rota
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
