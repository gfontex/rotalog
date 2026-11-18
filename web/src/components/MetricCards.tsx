'use client';

import React from 'react';
import { Car, Navigation, CheckCircle2, Wrench, Gauge, Clock } from 'lucide-react';

interface MetricCardsProps {
  stats: {
    totalVehicles: number;
    availableVehicles: number;
    inUseVehicles: number;
    maintenanceVehicles: number;
    totalDrivers: number;
    activeRoutesCount: number;
    totalKmDriven: number;
    totalPunchesToday: number;
  };
}

export function MetricCards({ stats }: MetricCardsProps) {
  const cards = [
    {
      title: 'Total da Frota',
      value: stats.totalVehicles,
      sub: `${stats.totalDrivers} motoristas cadastrados`,
      icon: Car,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/25',
    },
    {
      title: 'Em Rota Ativa',
      value: stats.inUseVehicles,
      sub: stats.inUseVehicles > 0 ? 'Viaturas em trânsito agora' : 'Nenhuma rota em trânsito',
      icon: Navigation,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/25',
      pulse: stats.inUseVehicles > 0,
    },
    {
      title: 'Disponíveis no Pátio',
      value: stats.availableVehicles,
      sub: 'Prontos para nova saída',
      icon: CheckCircle2,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/25',
    },
    {
      title: 'Oficina / Manutenção',
      value: stats.maintenanceVehicles,
      sub: stats.maintenanceVehicles > 0 ? 'Avarias relatadas em checklist' : 'Frota 100% operacional',
      icon: Wrench,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/25',
    },
    {
      title: 'Km Total Rodado',
      value: `${stats.totalKmDriven.toLocaleString('pt-BR')} km`,
      sub: 'Acumulado nas viagens',
      icon: Gauge,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/25',
    },
    {
      title: 'Ponto CLT Hoje',
      value: stats.totalPunchesToday,
      sub: 'Batidas registradas hoje',
      icon: Clock,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/25',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div
            key={index}
            className={`bg-surface-card rounded-2xl p-4 border ${card.borderColor} transition-all hover:translate-y-[-2px]`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-secondary">{card.title}</span>
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                <IconComponent className={`w-4 h-4 ${card.pulse ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-content-primary">{card.value}</p>
              <p className="text-[11px] text-content-secondary mt-0.5 truncate">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
