'use client';

import React from 'react';
import { X, Bell, AlertTriangle, Navigation, Coffee, Flag, Clock, CheckCircle2 } from 'lucide-react';

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
          color: 'text-red-400',
          bg: 'bg-red-500/10 border-red-500/30',
          badge: 'AVARIA DETECTADA',
        };
      case 'INICIO_ROTA':
        return {
          icon: Navigation,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          badge: 'INÍCIO DE ROTA',
        };
      case 'PAUSA_ALMOCO':
        return {
          icon: Coffee,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/30',
          badge: 'INTERVALO DE ALMOÇO',
        };
      case 'RETOMADA_ALMOCO':
        return {
          icon: CheckCircle2,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/30',
          badge: 'RETOMADA DE ROTA',
        };
      case 'FIM_ROTA':
        return {
          icon: Flag,
          color: 'text-purple-400',
          bg: 'bg-purple-500/10 border-purple-500/30',
          badge: 'ROTA CONCLUÍDA',
        };
      default:
        return {
          icon: Clock,
          color: 'text-slate-400',
          bg: 'bg-slate-800 border-slate-700',
          badge: 'PONTO ELETRÔNICO',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#111827] h-full shadow-2xl border-l border-slate-800 flex flex-col">
        {/* Topo do Drawer */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Central de Notificações</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {notifications.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Notificações */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              Nenhuma notificação registrada ainda.
            </div>
          ) : (
            notifications.map((n) => {
              const conf = getActionConfig(n.action);
              const IconComp = conf.icon;
              const dateObj = new Date(n.timestamp);

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border ${conf.bg} transition-all`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded ${conf.color} bg-black/30`}>
                      {conf.badge}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {dateObj.toLocaleTimeString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {n.details?.message || JSON.stringify(n.details)}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
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
