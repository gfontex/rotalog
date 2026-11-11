'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { MetricCards } from '../components/MetricCards';
import { FleetMonitor } from '../components/FleetMonitor';
import { TripReports } from '../components/TripReports';
import { TimeClockMirror } from '../components/TimeClockMirror';
import { NotificationDrawer } from '../components/NotificationDrawer';
import { NewVehicleModal, NewUserModal } from '../components/ManagementModals';
import { webApi } from '../services/api';
import {
  Car,
  FileText,
  Clock,
  Users,
  ShieldCheck,
  KeyRound,
  Building2,
  Lock,
  ArrowRight,
  Smartphone,
  CheckCircle,
  AlertCircle,
  LogOut,
  QrCode,
} from 'lucide-react';

interface AuthUser {
  id: string;
  name: string;
  cpf: string;
  email: string;
  role: 'ADMIN' | 'FLEET_MANAGER' | 'DRIVER';
  tenantId: string;
  tenantName: string;
  branchName?: string;
}

export default function DashboardPage() {
  // Autenticação do Usuário
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loginCompany, setLoginCompany] = useState('MK Seguranca');
  const [loginCpf, setLoginCpf] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Aba ativa do Painel
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

  // Carregar sessão salva no navegador
  useEffect(() => {
    try {
      const saved = localStorage.getItem('@rotalog:user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  // Carregar empresas disponíveis para o select de login
  useEffect(() => {
    webApi.getTenants().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setTenants(data);
        if (!loginCompany) setLoginCompany(data[0].name);
      }
    }).catch(() => {});
  }, []);

  // Ação de Login
  const handleLogin = async (e?: React.FormEvent, customCpf?: string, customPass?: string, customComp?: string) => {
    if (e) e.preventDefault();
    const comp = customComp || loginCompany;
    const cpf = customCpf || loginCpf;
    const pass = customPass || loginPassword;

    if (!comp || !cpf) {
      setLoginError('Informe a Base da Empresa e o seu CPF.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await webApi.login({
        company: comp,
        cpf,
        password: pass || cpf,
      });

      if (res && res.user) {
        const userData: AuthUser = res.user;
        setCurrentUser(userData);
        localStorage.setItem('@rotalog:user', JSON.stringify(userData));
      } else {
        throw new Error('Falha ao autenticar.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao realizar login.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('@rotalog:user');
  };

  // Carregamento de Dados da API do Banco SQLite
  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    setIsRefreshing(true);
    try {
      const tenantId = currentUser.tenantId;
      const [statsData, vehiclesData, tripsData, punchesData, notifsData, usersData] =
        await Promise.allSettled([
          webApi.getStats(tenantId),
          webApi.getVehicles(tenantId),
          webApi.getUsages(tenantId),
          webApi.getTimeClockReport(tenantId),
          webApi.getNotifications(tenantId),
          webApi.getUsers(tenantId),
        ]);

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
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadAllData();
      const interval = setInterval(loadAllData, 4000);
      return () => clearInterval(interval);
    }
  }, [currentUser, loadAllData]);

  // =========================================================================
  // 1. TELA DE LOGIN DO CLIENTE (SE NÃO ESTIVER AUTENTICADO)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex flex-col justify-between p-4 sm:p-6">
        {/* Cabeçalho Minimalista da Tela de Login */}
        <div className="max-w-md w-full mx-auto flex items-center justify-between py-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-white text-lg tracking-wider">ROTALOG</span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Acesso Corporativo
          </span>
        </div>

        {/* Card Central de Login */}
        <div className="max-w-md w-full mx-auto bg-[#1E293B] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-white mb-1">Acesso ao Sistema</h1>
            <p className="text-xs text-slate-400">
              Digite a Base da sua empresa, seu CPF e a senha fornecida pelo gestor.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Empresa / Base Operacional</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: MK Seguranca"
                  value={loginCompany}
                  onChange={(e) => setLoginCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B1120] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">CPF do Colaborador</label>
              <input
                type="text"
                placeholder="Ex: 000.111.222-33"
                value={loginCpf}
                onChange={(e) => setLoginCpf(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B1120] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Senha de Acesso</label>
              <input
                type="password"
                placeholder="Digite sua senha"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B1120] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                A senha padrão inicial é o próprio CPF cadastrado pelo gestor.
              </p>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 text-sm flex items-center justify-center gap-2"
            >
              {loginLoading ? 'Validando Acesso...' : 'Entrar no Sistema'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Atalhos Rápidos para Demonstração em Sala de Aula */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Acesso Rápido para Apresentação
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLogin(undefined, '000.111.222-33', 'admin123', 'MK Seguranca')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-purple-500/30 rounded-lg text-left transition-all"
              >
                <div className="text-[10px] font-bold text-purple-400">👑 Admin</div>
                <div className="text-[11px] text-slate-200 truncate">Admin MK</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin(undefined, '333.444.555-66', '333.444.555-66', 'MK Seguranca')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-blue-500/30 rounded-lg text-left transition-all"
              >
                <div className="text-[10px] font-bold text-blue-400">👔 Gestor</div>
                <div className="text-[11px] text-slate-200 truncate">Roberto S.</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin(undefined, '111.222.333-44', '111.222.333-44', 'MK Seguranca')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 rounded-lg text-left transition-all"
              >
                <div className="text-[10px] font-bold text-emerald-400">🚗 Motorista</div>
                <div className="text-[11px] text-slate-200 truncate">Carlos S.</div>
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé: Link Exclusivo do Proprietário (Software House) */}
        <div className="max-w-md w-full mx-auto text-center py-4">
          <Link
            href="/master"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors py-1 px-3 rounded-full hover:bg-indigo-950/30 border border-transparent hover:border-indigo-900/40"
          >
            <Lock className="w-3 h-3" />
            <span>Portal do Mantenedor (Cadastrar Nova Empresa Cliente)</span>
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. PAINEL DO MOTORISTA (SE O USUÁRIO LOGADO FOR "DRIVER")
  // =========================================================================
  if (currentUser.role === 'DRIVER') {
    const driverTrips = trips.filter((t) => t.driverId === currentUser.id);
    const driverPunches = punches.filter((p) => p.userId === currentUser.id);

    return (
      <div className="min-h-screen flex flex-col bg-[#0B1120]">
        <Header
          onOpenNewVehicle={() => {}}
          onOpenNewUser={() => {}}
          onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
          notificationCount={notifications.length}
          onRefresh={loadAllData}
          isRefreshing={isRefreshing}
          selectedTenantName={currentUser.tenantName}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* Card de Boas-vindas do Motorista */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  🚗 Perfil: Motorista Operacional
                </span>
                <span className="text-xs text-slate-400 font-mono">CPF: {currentUser.cpf}</span>
              </div>
              <h1 className="text-xl font-bold text-white">Olá, {currentUser.name}!</h1>
              <p className="text-xs text-slate-400 mt-1">
                Empresa Vinculada: <strong className="text-slate-200">{currentUser.tenantName}</strong>
              </p>
            </div>

            {/* Aviso do App Mobile */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl max-w-md">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                <Smartphone className="w-4 h-4" />
                Operação em Trânsito (App Mobile)
              </div>
              <p className="text-xs text-emerald-300 leading-relaxed">
                Para iniciar viagens, preencher vistoria de saída/devolução e bater ponto mesmo sem sinal de internet, utilize o <strong>App Mobile ROTALOG</strong> no seu celular via Expo Go.
              </p>
            </div>
          </div>

          {/* Histórico Privativo do Motorista */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Suas Viagens e Rotas ({driverTrips.length})
            </h2>

            {driverTrips.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhuma rota registrada no seu histórico ainda.</p>
            ) : (
              <div className="space-y-3">
                {driverTrips.map((t) => (
                  <div key={t.id} className="p-4 bg-[#0B1120] border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{t.vehiclePlate}</span>
                        <span className="text-xs text-slate-400">{t.vehicleModel}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {t.status === 'COMPLETED' ? 'Finalizada' : 'Em Andamento'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Início: {new Date(t.startTime).toLocaleTimeString('pt-BR')} • Almoço: {t.totalLunchMinutes} min • Distância: {t.totalDistanceKm} Km
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // 3. PAINEL DO GESTOR E ADMINISTRADOR (ADMIN / FLEET_MANAGER)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#0B1120]">
      {/* Cabeçalho Executivo */}
      <Header
        onOpenNewVehicle={() => setIsNewVehicleOpen(true)}
        onOpenNewUser={() => setIsNewUserOpen(true)}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        notificationCount={notifications.length}
        onRefresh={loadAllData}
        isRefreshing={isRefreshing}
        selectedTenantName={currentUser.tenantName}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Conteúdo Central */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner Informativo da Empresa */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white">
                  Base Operacional: <span className="text-emerald-400">{currentUser.tenantName}</span>
                </h1>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                  {currentUser.role === 'ADMIN' ? 'Perfil: Administrador Geral' : 'Perfil: Gestor de Frota'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monitoramento da frota, inspeção de viaturas e espelho de ponto eletrônico CLT.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                ? 'border-blue-500 text-blue-400'
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
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Espelho de Ponto CLT ({punches.length})</span>
          </button>

          {/* Aba de Usuários restrita ao ADMIN */}
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Colaboradores & Senhas ({users.length})</span>
            </button>
          )}
        </div>

        {/* Conteúdo Dinâmico das Abas */}
        <div>
          {activeTab === 'fleet' && <FleetMonitor vehicles={vehicles} />}
          {activeTab === 'trips' && <TripReports trips={trips} />}
          {activeTab === 'timeclock' && <TimeClockMirror punches={punches} />}
          {activeTab === 'users' && currentUser.role === 'ADMIN' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Equipe de Colaboradores da Base</h3>
                  <p className="text-xs text-slate-400">
                    Definição de senhas com criptografia segura (bcrypt) e controle de permissões.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewUserOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Cadastrar Novo Colaborador</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((u) => {
                  const isAdmin = u.role === 'ADMIN';
                  const isManager = u.role === 'FLEET_MANAGER';
                  const isDriver = u.role === 'DRIVER';

                  const badgeLabel = isAdmin
                    ? '👑 Administrador'
                    : isManager
                    ? '👔 Gestor de Frota'
                    : '🚗 Motorista';

                  const badgeClass = isAdmin
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                    : isManager
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

                  return (
                    <div
                      key={u.id}
                      className="bg-[#1E293B] rounded-xl p-4 border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Base: {currentUser.tenantName}
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
                            : 'Gestão da base'}
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

      {/* Modais de Cadastro */}
      <NewVehicleModal
        isOpen={isNewVehicleOpen}
        onClose={() => setIsNewVehicleOpen(false)}
        onSuccess={loadAllData}
        tenants={[{ id: currentUser.tenantId, name: currentUser.tenantName }]}
      />

      <NewUserModal
        isOpen={isNewUserOpen}
        onClose={() => setIsNewUserOpen(false)}
        onSuccess={loadAllData}
        tenants={[{ id: currentUser.tenantId, name: currentUser.tenantName }]}
      />
    </div>
  );
}
