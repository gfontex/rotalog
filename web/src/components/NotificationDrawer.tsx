'use client';

import React from 'react';
import { X, Bell, AlertTriangle, Navigation, Coffee, Flag, Clock, CheckCircle2 } from 'lucide-react';
import { UI_TOKENS } from '../theme';
import { CorporateEmptyState } from './BrandLogo';

interface NotificationItem {
  id: string;
  action: 'INICIO_ROTA' | 'PAUSA_ALMOCO' | 'RETOMADA_ALMOCO' | 'FIM_ROTA' | 'ALERTA_AVARIA' | 'BATIDA_PONTO';
  entityType: string;
  entityId: string;
  details: any;
  timestamp: string;
  userName?: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
}

export function NotificationDrawer({ isOpen, onClose, notifications }: NotificationDrawerProps) {
  if (!isOpen) return null;

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'ALERTA_AVARIA':
        return {
          icon: AlertTriangle,
          color: 'text-rose-400',
          bg: UI_TOKENS.badgeDanger,
          badge: 'AVARIA DETECTADA',
        };
      case 'INICIO_ROTA':
        return {
          icon: Navigation,
          color: 'text-emerald-400',
          bg: UI_TOKENS.badgeSuccess,
          badge: 'INÍCIO DE ROTA',
        };
      case 'PAUSA_ALMOCO':
        return {
          icon: Coffee,
          color: 'text-amber-400',
          bg: UI_TOKENS.badgeWarning,
          badge: 'INTERVALO DE ALMOÇO',
        };
      case 'RETOMADA_ALMOCO':
        return {
          icon: CheckCircle2,
          color: 'text-sky-400',
          bg: UI_TOKENS.badgeInfo,
          badge: 'RETOMADA DE ROTA',
        };
      case 'FIM_ROTA':
        return {
          icon: Flag,
          color: 'text-purple-400',
          bg: UI_TOKENS.badgeAdmin,
          badge: 'ROTA CONCLUÍDA',
        };
      default:
        return {
          icon: Clock,
          color: 'text-content-secondary',
          bg: 'bg-surface-elevated border border-surface-border',
          badge: 'PONTO ELETRÔNICO',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-surface-card h-full border-l border-surface-border flex flex-col">
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-primary" />
            <h3 className="font-bold text-content-primary text-base">Central de Notificações</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-elevated text-content-secondary border border-surface-border">
              {notifications.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <CorporateEmptyState
              title="Sem notificações no momento"
              description="Alertas operacionais, batidas de ponto e ocorrências aparecerão aqui."
            />
          ) : (
            notifications.map((n) => {
              const conf = getActionConfig(n.action);
              const IconComp = conf.icon;
              const dateObj = new Date(n.timestamp);

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl ${conf.bg} transition-all`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded flex items-center gap-1 ${conf.color}`}>
                      <IconComp className="w-3 h-3" />
                      {conf.badge}
                    </span>
                    <span className="text-[11px] font-mono text-content-secondary">
                      {dateObj.toLocaleTimeString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-xs text-content-primary leading-relaxed font-medium">
                    {n.details?.message || JSON.stringify(n.details)}
                  </p>

                  <div className="mt-2 pt-2 border-t border-surface-border flex items-center justify-between text-[11px] text-content-secondary">
                    <span>{n.userName ? `Responsável: ${n.userName}` : 'Sistema ROTALOG'}</span>
                    <span>{dateObj.toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
