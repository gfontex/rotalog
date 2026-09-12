'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { MetricCards } from '../components/MetricCards';
import { FleetMonitor } from '../components/FleetMonitor';
import { TripReports } from '../components/TripReports';
import { TimeClockMirror } from '../components/TimeClockMirror';
import { NotificationDrawer } from '../components/NotificationDrawer';
import { NewVehicleModal, NewUserModal, NewTenantModal } from '../components/ManagementModals';
import { webApi } from '../services/api';
import { Car, FileText, Clock, Users, ShieldCheck, KeyRound, Building2 } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'fleet' | 'trips' | 'timeclock' | 'users'>('fleet');

  // Dados do Servidor
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    inUseVehicles: 0,
    maintenanceVehicles: 0,
    totalDrivers: 0,
    activeRoutesCount: 0,
    totalKmDriven: 0,
    notificationsCount: 0,
    totalPunchesToday: 0,
  });

  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [punches, setPunches] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Estados dos Modais
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);

  // Carregamento de Dados da API do Banco SQLite
  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [tenantsData, statsData, vehiclesData, tripsData, punchesData, notifsData, usersData] =
        await Promise.allSettled([
          webApi.getTenants(),
          webApi.getStats(selectedTenantId || undefined),
          webApi.getVehicles(selectedTenantId || undefined),
          webApi.getUsages(selectedTenantId || undefined),
          webApi.getTimeClockReport(selectedTenantId || undefined),
          webApi.getNotifications(selectedTenantId || undefined),
          webApi.getUsers(selectedTenantId || undefined),
        ]);

      if (tenantsData.status === 'fulfilled' && tenantsData.value.length > 0) {
        setTenants(tenantsData.value);
        if (!selectedTenantId) {
          setSelectedTenantId(tenantsData.value[0].id);
        }
      }
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (vehiclesData.status === 'fulfilled') setVehicles(vehiclesData.value);
      if (tripsData.status === 'fulfilled') setTrips(tripsData.value);
      if (punchesData.status === 'fulfilled') setPunches(punchesData.value);
      if (notifsData.status === 'fulfilled') setNotifications(notifsData.value);
      if (usersData.status === 'fulfilled') setUsers(usersData.value);
    } catch (err) {
      console.warn('Erro ao atualizar dados do dashboard:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedTenantId]);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 4000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  const activeTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1120]">
      {/* Cabeçalho Executivo */}
      <Header
        onOpenNewVehicle={() => setIsNewVehicleOpen(true)}
        onOpenNewUser={() => setIsNewUserOpen(true)}
        onOpenNewTenant={() => setIsNewTenantOpen(true)}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        notificationCount={notifications.length}
        onRefresh={loadAllData}
        isRefreshing={isRefreshing}
        selectedTenantName={activeTenant?.name || 'MK Segurança'}
      />

      {/* Conteúdo Central */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner Informativo da Empresa / Base */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white">
                  Base Operacional: <span className="text-emerald-400">{activeTenant?.name || 'MK Segurança'}</span>
                </h1>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                  SQLite Ativo (rotalog.db)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hierarquia dividida em 3 níveis: Administrador, Gestor de Frota e Motoristas operacionais com histórico privativo.
              </p>
            </div>
          </div>

          {/* Seletor de Base (se houver mais de uma empresa cadastrada) */}
          <div className="flex items-center gap-2">
            {tenants.length > 1 && (
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="bg-[#0B1120] border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Sincronização em Tempo Real</span>
            </div>
          </div>
        </div>

        {/* Métricas Principais da Frota */}
        <MetricCards stats={stats} />

        {/* Navegação Superior por Abas */}
        <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'fleet'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Monitoramento da Frota ({vehicles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'trips'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Relatórios de Viagens ({trips.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('timeclock')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'timeclock'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Espelho de Ponto CLT ({punches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Equipe & Hierarquia ({users.length})</span>
          </button>
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div>
          {activeTab === 'fleet' && <FleetMonitor vehicles={vehicles} />}
          {activeTab === 'trips' && <TripReports trips={trips} />}
          {activeTab === 'timeclock' && <TimeClockMirror punches={punches} />}

          {/* Aba de Colaboradores e Hierarquia */}
          {activeTab === 'users' && (
            <div className="bg-[#1E293B] rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    Quadro de Colaboradores • 3 Níveis de Hierarquia
                  </h2>
                  <p className="text-xs text-slate-400">
                    Administradores, Gestores de Frota e Motoristas cadastrados no banco de dados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsNewUserOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                  >
                    + Novo Colaborador & Senha
                  </button>
                </div>
              </div>

              {/* Informação sobre Senhas */}
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl mb-4 flex items-center gap-2.5 text-xs text-slate-300">
                <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Política de Senhas:</strong> Ao cadastrar um colaborador, o gestor pode definir uma senha personalizada ou deixar em branco para que o <strong>próprio CPF do funcionário</strong> seja definido como senha inicial de acesso.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((u) => {
                  const isAdmin = u.role === 'ADMIN';
                  const isManager = u.role === 'FLEET_MANAGER';
                  const isDriver = u.role === 'DRIVER';

                  const badgeLabel = isAdmin
                    ? '👑 Administrador'
                    : isManager
                    ? '👔 Gestor de Rota / Frota'
                    : '🚗 Motorista';

                  const badgeClass = isAdmin
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                    : isManager
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

                  return (
                    <div
                      key={u.id}
                      className="bg-[#0B1120] rounded-xl p-4 border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Base: {u.tenant?.name || activeTenant?.name}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm">{u.name}</h4>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">CPF: {u.cpf}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Permissão:</span>
                        <span className="font-medium text-slate-300">
                          {isDriver
                            ? 'Rotas próprias'
                            : isManager
                            ? 'Controle total da frota'
                            : 'Acesso master'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Drawer de Notificações */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
      />

      {/* Modais de Cadastro Manual */}
      <NewTenantModal
        isOpen={isNewTenantOpen}
        onClose={() => setIsNewTenantOpen(false)}
        onSuccess={loadAllData}
      />

      <NewVehicleModal
        isOpen={isNewVehicleOpen}
        onClose={() => setIsNewVehicleOpen(false)}
        onSuccess={loadAllData}
        tenants={tenants}
      />

      <NewUserModal
        isOpen={isNewUserOpen}
        onClose={() => setIsNewUserOpen(false)}
        onSuccess={loadAllData}
        tenants={tenants}
      />
    </div>
  );
}
