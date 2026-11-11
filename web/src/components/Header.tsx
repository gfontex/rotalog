'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Bell, Car, UserPlus, RefreshCw, Radio, LogOut, User, Building2 } from 'lucide-react';

interface HeaderProps {
  onOpenNewVehicle: () => void;
  onOpenNewUser: () => void;
  onToggleNotifications: () => void;
  notificationCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  selectedTenantName?: string;
  currentUser?: {
    name: string;
    cpf: string;
    role: string;
    tenantName?: string;
  } | null;
  onLogout?: () => void;
}

export function Header({
  onOpenNewVehicle,
  onOpenNewUser,
  onToggleNotifications,
  notificationCount,
  onRefresh,
  isRefreshing,
  selectedTenantName = 'MK Seguranca',
  currentUser,
  onLogout,
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

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Usuário Master (Admin)';
      case 'FLEET_MANAGER':
        return 'Gestor de Controle da Frota';
      case 'DRIVER':
        return 'Colaborador / Motorista';
      default:
        return 'Colaborador';
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'FLEET_MANAGER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'DRIVER':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const isMaster = currentUser?.role === 'ADMIN';
  const isControl = currentUser?.role === 'FLEET_MANAGER';
  const canAddCollaborator = isMaster || isControl;

  return (
    <header className="bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-6 py-3.5 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3.5">
        {/* Logo & Identificação da Empresa */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-wider text-white">ROTALOG</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  SISTEMA ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Base: <strong className="text-slate-200 font-semibold">{currentUser?.tenantName || selectedTenantName}</strong>
              </p>
            </div>
          </div>

          {/* Botão de Logout Mobile */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 transition-colors"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ações Rápidas & Perfil */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          {/* Relógio em Tempo Real */}
          <div className="hidden lg:flex items-center bg-[#070B14] border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono">
            <span>{time || '--:--:--'}</span>
          </div>

          {/* Botão Atualizar */}
          <button
            onClick={onRefresh}
            title="Atualizar dados do servidor"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* Sino de Notificações (para Master e Controle) */}
          {(isMaster || isControl) && (
            <button
              onClick={onToggleNotifications}
              className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all text-xs"
              title="Central de Alertas e Avarias"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-extrabold text-white flex items-center justify-center animate-bounce">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}

          {/* Ações: Cadastrar Veículo (Exclusivo do Master) */}
          {isMaster && (
            <button
              onClick={onOpenNewVehicle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
              title="Cadastrar viatura na frota"
            >
              <Car className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Veículo</span>
              <span className="sm:hidden">+ Carro</span>
            </button>
          )}

          {/* Ações: Cadastrar Colaborador (Master e Usuário de Controle) */}
          {canAddCollaborator && (
            <button
              onClick={onOpenNewUser}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
              title="Cadastrar colaborador / definir hierarquia"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Colaborador</span>
              <span className="sm:hidden">+ Equipe</span>
            </button>
          )}

          {/* Perfil do Usuário Logado */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800/80">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
              {getInitials(currentUser?.name)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-100 truncate max-w-[140px]">{currentUser?.name || 'Usuário'}</p>
              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(currentUser?.role)}`}>
                {getRoleLabel(currentUser?.role)}
              </span>
            </div>

            {/* Botão Sair Desktop */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
