'use client';

// Cabecalho do painel, identificacao do usuario e atalhos de cadastro

import React, { useState, useEffect } from 'react';
import { Bell, Car, UserPlus, RefreshCw, Radio, LogOut, Building2 } from 'lucide-react';
import { RotaLogHeaderBrand, ThemeSwitcherBar } from './BrandLogo';
import { UI_TOKENS } from '../theme';

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
  selectedTenantName = 'Teste Apresentação',
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
        return 'Admin (Representante Legal)';
      case 'FLEET_MANAGER':
        return 'Gestor de Frota';
      case 'DRIVER':
        return 'Motorista';
      default:
        return 'Colaborador';
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return UI_TOKENS.badgeAdmin;
      case 'FLEET_MANAGER':
        return UI_TOKENS.badgeInfo;
      case 'DRIVER':
        return UI_TOKENS.badgeSuccess;
      default:
        return 'bg-surface-elevated text-content-secondary border border-surface-border';
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
    <header className="bg-surface-card/95 backdrop-blur-md border-b border-surface-border sticky top-0 z-30 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Identificação da Empresa */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <RotaLogHeaderBrand />
            <div className="hidden sm:flex flex-col border-l border-surface-border pl-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${UI_TOKENS.badgeInfo}`}>
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                SISTEMA ONLINE
              </span>
              <p className="text-xs text-content-secondary flex items-center gap-1.5 mt-1">
                <Building2 className="w-3.5 h-3.5 text-brand-primary" />
                Base: <strong className="text-content-primary font-semibold">{currentUser?.tenantName || selectedTenantName}</strong>
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="md:hidden p-2 rounded-lg text-content-secondary hover:text-rose-400 hover:bg-rose-500/10 border border-surface-border transition-colors"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ações Rápidas & Perfil */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <ThemeSwitcherBar compact />

          <div className="hidden lg:flex items-center bg-surface-bg border border-surface-border rounded-xl px-3 py-1.5 text-xs text-content-secondary font-mono">
            <span>{time || '--:--:--'}</span>
          </div>

          <button
            onClick={onRefresh}
            title="Atualizar dados do servidor"
            className="p-2 rounded-xl bg-surface-elevated hover:border-brand-primary/40 text-content-secondary border border-surface-border transition-all text-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-primary' : ''}`} />
          </button>

          {(isMaster || isControl) && (
            <button
              onClick={onToggleNotifications}
              className="relative p-2 rounded-xl bg-surface-elevated hover:border-brand-primary/40 text-content-secondary border border-surface-border transition-all text-xs cursor-pointer"
              title="Central de Alertas e Avarias"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="keep-white absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-[10px] font-extrabold text-white flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}

          {(isMaster || isControl) && (
            <button
              onClick={onOpenNewVehicle}
              className="keep-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold transition-all cursor-pointer"
              title="Cadastrar viatura na frota"
            >
              <Car className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Novo Veículo</span>
              <span className="sm:hidden">Veículo</span>
            </button>
          )}

          {canAddCollaborator && (
            <button
              onClick={onOpenNewUser}
              className="keep-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold transition-all cursor-pointer"
              title={isMaster ? 'Cadastrar gestor ou motorista' : 'Cadastrar motorista'}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isMaster ? 'Novo Colaborador' : 'Novo Motorista'}</span>
              <span className="sm:hidden">Equipe</span>
            </button>
          )}

          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-surface-border">
            <div className="w-8 h-8 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center font-bold text-xs text-brand-primary">
              {getInitials(currentUser?.name)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-content-primary truncate max-w-[140px]">{currentUser?.name || 'Usuário'}</p>
              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${getRoleBadgeStyle(currentUser?.role)}`}>
                {getRoleLabel(currentUser?.role)}
              </span>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="hidden md:flex p-1.5 rounded-lg text-content-secondary hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1 cursor-pointer"
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
