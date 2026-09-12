'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Bell, Car, UserPlus, RefreshCw, Radio, Building2 } from 'lucide-react';

interface HeaderProps {
  onOpenNewVehicle: () => void;
  onOpenNewUser: () => void;
  onOpenNewTenant: () => void;
  onToggleNotifications: () => void;
  notificationCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  selectedTenantName?: string;
}

export function Header({
  onOpenNewVehicle,
  onOpenNewUser,
  onOpenNewTenant,
  onToggleNotifications,
  notificationCount,
  onRefresh,
  isRefreshing,
  selectedTenantName = 'MK Seguranca',
}: HeaderProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR'));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#111827] border-b border-slate-800 sticky top-0 z-30 px-6 py-3.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Subtítulo */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider text-white">ROTALOG</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                AO VIVO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Base Atual: <span className="text-emerald-400 font-bold">{selectedTenantName}</span>
            </p>
          </div>
        </div>

        {/* Relógio & Ações Rápidas */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          {/* Relógio em Tempo Real */}
          <div className="hidden lg:flex items-center bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono">
            <span>{time || '--:--:--'}</span>
          </div>

          {/* Botão Atualizar */}
          <button
            onClick={onRefresh}
            title="Atualizar dados agora"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* Sino de Notificações com Badge */}
          <button
            onClick={onToggleNotifications}
            className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Central de Notificações e Alertas"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Botão: Cadastrar Nova Empresa / Base */}
          <button
            onClick={onOpenNewTenant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
            title="Cadastrar nova empresa cliente (ex: MK Segurança)"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>+ Empresa / Base</span>
          </button>

          {/* Cadastrar Veículo */}
          <button
            onClick={onOpenNewVehicle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            <Car className="w-3.5 h-3.5" />
            <span>+ Veículo</span>
          </button>

          {/* Cadastrar Colaborador */}
          <button
            onClick={onOpenNewUser}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Colaborador</span>
          </button>

          {/* Perfil do Gestor */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
              MK
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-200">Admin MK Segurança</p>
              <p className="text-[10px] text-slate-400">Gestor Geral</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
