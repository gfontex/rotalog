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
import { ChecklistModal } from '../components/ChecklistModal';
import { ReturnChecklistModal } from '../components/ReturnChecklistModal';
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
  Gauge,
  Calendar,
  Utensils,
  MapPin,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Play,
  Pause,
  Flag,
  Navigation,
  CheckSquare,
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

  // Aba ativa do Painel (para Master e Controle)
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

  // Estados dos Modais Administrativos
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);

  // Estados de Operação de Rota e Checklist pelo PC
  const [selectedVehicleForRoute, setSelectedVehicleForRoute] = useState<any | null>(null);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [selectedUsageForReturn, setSelectedUsageForReturn] = useState<any | null>(null);
  const [isReturnChecklistOpen, setIsReturnChecklistOpen] = useState(false);
  const [activeUsage, setActiveUsage] = useState<any | null>(null);

  // Carregar sessão salva no navegador
  useEffect(() => {
    try {
      const saved = localStorage.getItem('@rotalog:user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  // Carregar lista de empresas para autocomplete/seleção
  useEffect(() => {
    webApi.getTenants().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setTenants(data);
        if (!loginCompany) setLoginCompany(data[0].name);
      }
    }).catch(() => {});
  }, []);

  // Ação de Login Unificada (por CPF e Senha)
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
    setActiveUsage(null);
    localStorage.removeItem('@rotalog:user');
  };

  // Carregamento de Dados da API do Banco SQLite
  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    setIsRefreshing(true);
    try {
      const tenantId = currentUser.tenantId;
      const [statsData, vehiclesData, tripsData, punchesData, notifsData, usersData, activeUsageData] =
        await Promise.allSettled([
          webApi.getStats(tenantId),
          webApi.getVehicles(tenantId),
          webApi.getUsages(tenantId),
          webApi.getTimeClockReport(tenantId),
          webApi.getNotifications(tenantId),
          webApi.getUsers(tenantId),
          webApi.getActiveUsage(currentUser.id),
        ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (vehiclesData.status === 'fulfilled') setVehicles(vehiclesData.value);
      if (tripsData.status === 'fulfilled') setTrips(tripsData.value);
      if (punchesData.status === 'fulfilled') setPunches(punchesData.value);
      if (notifsData.status === 'fulfilled') setNotifications(notifsData.value);
      if (usersData.status === 'fulfilled') setUsers(usersData.value);
      if (activeUsageData.status === 'fulfilled' && activeUsageData.value) {
        setActiveUsage(activeUsageData.value);
      } else {
        setActiveUsage(null);
      }
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

  const isMaster = currentUser?.role === 'ADMIN';
  const isControl = currentUser?.role === 'FLEET_MANAGER';
  const isDriver = currentUser?.role === 'DRIVER';

  // Handlers de Rota e Checklist
  const handleStartRoute = (vehicle: any) => {
    setSelectedVehicleForRoute(vehicle);
    setIsChecklistOpen(true);
  };

  const handleFinishRoute = (vehicle: any) => {
    const usage = trips.find(
      (t) => (t.vehicleId === vehicle.id || t.vehiclePlate === vehicle.plate) && t.status !== 'COMPLETED'
    ) || {
      id: vehicle.id,
      vehicle,
      vehiclePlate: vehicle.plate,
      vehicleModel: vehicle.model,
      startTime: new Date().toISOString(),
      driver: { name: vehicle.currentDriver?.name || 'Condutor' },
    };
    setSelectedUsageForReturn(usage);
    setIsReturnChecklistOpen(true);
  };

  const handlePauseLunch = async () => {
    if (!activeUsage) return;
    try {
      await webApi.pauseLunch(activeUsage.id);
      loadAllData();
    } catch (err: any) {
      alert('Erro ao pausar almoço: ' + (err.message || 'Erro inesperado.'));
    }
  };

  const handleResumeLunch = async () => {
    if (!activeUsage) return;
    try {
      await webApi.resumeLunch(activeUsage.id);
      loadAllData();
    } catch (err: any) {
      alert('Erro ao retomar almoço: ' + (err.message || 'Erro inesperado.'));
    }
  };

  // =========================================================================
  // 1. TELA DE LOGIN UNIFICADA (RESPONSIVA NO CELULAR E NO PC)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-indigo-500 selection:text-white">
        <div className="max-w-md w-full mx-auto flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-white text-lg tracking-wider block">ROTALOG</span>
              <span className="text-[10px] text-slate-400 font-medium">Gestão de Frotas & Ponto CLT</span>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            Acesso Único
          </span>
        </div>

        <div className="max-w-md w-full mx-auto my-6 bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500" />

          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-white mb-1.5 tracking-tight">Portal de Acesso</h1>
            <p className="text-xs text-slate-400">
              O sistema detecta sua hierarquia automaticamente pelo CPF.
            </p>
          </div>

          {loginError && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <span className="leading-relaxed">{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Empresa / Base Operacional
              </label>
              <input
                type="text"
                placeholder="Ex: MK Seguranca"
                value={loginCompany}
                onChange={(e) => setLoginCompany(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                CPF do Usuário (Identificador)
              </label>
              <input
                type="text"
                placeholder="Ex: 000.111.222-33"
                value={loginCpf}
                onChange={(e) => setLoginCpf(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                Senha de Acesso
              </label>
              <input
                type="password"
                placeholder="Digite sua senha cadastrada"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                A senha padrão do funcionário é o próprio CPF cadastrado pelo gestor.
              </p>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/25 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loginLoading ? 'Identificando Hierarquia...' : 'Acessar Meu Painel'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Atalhos Rápidos para Demonstração em Sala */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Atalhos de Apresentação (3 Níveis de Acesso)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLogin(undefined, '000.111.222-33', 'admin123', 'MK Seguranca')}
                className="p-2.5 bg-[#070B14] hover:bg-slate-900 border border-purple-500/30 hover:border-purple-500/60 rounded-xl text-left transition-all group"
              >
                <div className="text-[10px] font-extrabold text-purple-400 group-hover:text-purple-300">👑 Master</div>
                <div className="text-xs font-bold text-white truncate">Admin Geral</div>
                <div className="text-[10px] text-slate-500">Cadastra tudo</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin(undefined, '333.444.555-66', '333.444.555-66', 'MK Seguranca')}
                className="p-2.5 bg-[#070B14] hover:bg-slate-900 border border-blue-500/30 hover:border-blue-500/60 rounded-xl text-left transition-all group"
              >
                <div className="text-[10px] font-extrabold text-blue-400 group-hover:text-blue-300">👔 Controle</div>
                <div className="text-xs font-bold text-white truncate">Roberto (Gestor)</div>
                <div className="text-[10px] text-slate-500">Frota & Equipe</div>
              </button>

              <button
                type="button"
                onClick={() => handleLogin(undefined, '111.222.333-44', '111.222.333-44', 'MK Seguranca')}
                className="p-2.5 bg-[#070B14] hover:bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl text-left transition-all group"
              >
                <div className="text-[10px] font-extrabold text-emerald-400 group-hover:text-emerald-300">🚗 Colaborador</div>
                <div className="text-xs font-bold text-white truncate">Carlos Silva</div>
                <div className="text-[10px] text-slate-500">Suas viagens</div>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto text-center py-2">
          <Link
            href="/master"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors py-1.5 px-3 rounded-full hover:bg-indigo-950/30 border border-transparent hover:border-indigo-900/40"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Portal Master MEU (Cadastrar Nova Empresa Cliente)</span>
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. PAINEL DO COLABORADOR / MOTORISTA (INICIAR ROTA + CHECKLIST PELO PC)
  // =========================================================================
  if (isDriver) {
    const driverTrips = trips.filter((t) => t.driverId === currentUser.id);
    const driverPunches = punches.filter((p) => p.userId === currentUser.id);
    const availableCars = vehicles.filter((v) => v.status === 'AVAILABLE');

    const totalKm = driverTrips.reduce((acc, t) => acc + (t.totalDistanceKm || 0), 0);
    const totalLunch = driverTrips.reduce((acc, t) => acc + (t.totalLunchMinutes || 0), 0);

    return (
      <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100">
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

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Card de Boas-vindas Personalizado */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  🚗 Perfil: Colaborador Operacional
                </span>
                <span className="text-xs text-slate-400 font-mono">CPF: {currentUser.cpf}</span>
              </div>
              <h1 className="text-2xl font-black text-white">Olá, {currentUser.name}!</h1>
              <p className="text-xs text-slate-400 mt-1">
                Base Operacional: <strong className="text-emerald-400 font-semibold">{currentUser.tenantName}</strong> • Seus dados privativos
              </p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl max-w-sm w-full">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                <Smartphone className="w-4 h-4" />
                Operação em Rota (App Mobile)
              </div>
              <p className="text-xs text-emerald-300/90 leading-relaxed">
                Você pode iniciar a rota por aqui no PC ou usar o <strong>App Mobile ROTALOG</strong> no celular pelo Expo Go para operar offline na rua.
              </p>
            </div>
          </div>

          {/* BANNER DE ROTA ATIVA (SE O MOTORISTA JÁ ESTIVER COM CARRO EM ROTA) */}
          {activeUsage && (
            <div className="bg-gradient-to-r from-blue-950/80 via-[#0F172A] to-blue-950/80 border-2 border-blue-500/50 rounded-3xl p-6 shadow-2xl animate-pulse-glow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Navigation className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      {activeUsage.status === 'PAUSED_LUNCH' ? '🍽️ Pausa de Almoço' : '🛣️ Rota em Andamento'}
                    </span>
                    <h2 className="text-xl font-black text-white mt-1">
                      Viatura: {activeUsage.vehiclePlate || 'Carro em Rota'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Início da viagem: {new Date(activeUsage.startTime).toLocaleTimeString('pt-BR')} • Almoço acumulado: {activeUsage.totalLunchMinutes || 0} min
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeUsage.status === 'PAUSED_LUNCH' ? (
                    <button
                      onClick={handleResumeLunch}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Retomar Rota</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseLunch}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-600/20 flex items-center gap-1.5"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pausar para Almoço</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedUsageForReturn(activeUsage);
                      setIsReturnChecklistOpen(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-1.5"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Encerrar Rota (Devolução)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO: INICIAR NOVA ROTA PELO PC (CHECKLIST DE SAÍDA) */}
          {!activeUsage && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">Iniciar Rota pelo PC (Preencher Checklist)</h2>
                    <p className="text-xs text-slate-400">Escolha um veículo disponível no pátio para abrir o checklist de vistoria</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {availableCars.length} Disponíveis
                </span>
              </div>

              {availableCars.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Nenhum veículo disponível no pátio no momento. Aguarde a devolução ou consulte o gestor.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableCars.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 bg-[#070B14] border border-slate-800 hover:border-emerald-500/40 rounded-2xl transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-black text-white text-sm px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                            {v.plate}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            LIVRE
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-200 text-sm">{v.brand} {v.model}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">Odômetro: {v.currentMileage.toLocaleString('pt-BR')} km</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartRoute(v)}
                        className="mt-3 w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Preencher Checklist & Iniciar</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Métricas Pessoais do Colaborador */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
                <Car className="w-4 h-4" />
                Viagens Feitas
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">{driverTrips.length}</div>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                <Gauge className="w-4 h-4" />
                Km Percorrido
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">{totalKm} Km</div>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                <Utensils className="w-4 h-4" />
                Pausas de Almoço
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">{totalLunch} min</div>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold mb-1">
                <Clock className="w-4 h-4" />
                Pontos CLT Hoje
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">{driverPunches.length}</div>
            </div>
          </div>

          {/* Histórico Privativo de Viagens */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Suas Viagens e Rotas Pessoais ({driverTrips.length})</h2>
              </div>
              <span className="text-xs text-slate-400">Acesso Restrito ao Condutor</span>
            </div>

            {driverTrips.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">Você ainda não realizou nenhuma viagem com as viaturas da base.</p>
            ) : (
              <div className="space-y-3">
                {driverTrips.map((t) => (
                  <div key={t.id} className="p-4 bg-[#070B14] border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {t.vehiclePlate}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">{t.vehicleModel}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {t.status === 'COMPLETED' ? 'Finalizada' : 'Em Andamento'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Início: {new Date(t.startTime).toLocaleTimeString('pt-BR')} • Almoço Total: {t.totalLunchMinutes} min • Distância: {t.totalDistanceKm} Km
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Modais de Checklist para o Motorista */}
        <ChecklistModal
          isOpen={isChecklistOpen}
          onClose={() => setIsChecklistOpen(false)}
          onSuccess={loadAllData}
          vehicle={selectedVehicleForRoute}
          drivers={[{ id: currentUser.id, name: currentUser.name, cpf: currentUser.cpf, role: currentUser.role }]}
          currentUserId={currentUser.id}
        />

        <ReturnChecklistModal
          isOpen={isReturnChecklistOpen}
          onClose={() => setIsReturnChecklistOpen(false)}
          onSuccess={loadAllData}
          usage={selectedUsageForReturn}
        />
      </div>
    );
  }

  // =========================================================================
  // 3. PAINEL DO USUÁRIO MASTER (ADMIN) E DO USUÁRIO DE CONTROLE (FLEET_MANAGER)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100">
      {/* Cabeçalho Executivo com Ações Contextuais */}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:p-8 py-6 space-y-6">
        {/* Banner Informativo com a Identificação do Perfil */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#111C38] to-[#0F172A] border border-slate-800/80 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl border ${isMaster ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-white">
                  Base Operacional: <span className="text-emerald-400">{currentUser.tenantName}</span>
                </h1>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${isMaster ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                  {isMaster ? '👑 Perfil: Usuário Master (Acesso Total)' : '👔 Perfil: Usuário de Controle da Frota'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isMaster
                  ? 'Você pode cadastrar viaturas, definir senhas e cadastrar quem terá o controle da frota e os motoristas.'
                  : 'Você tem controle em tempo real dos carros, relatórios de viagens, espelho de ponto CLT e pode cadastrar colaboradores.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-[#070B14] px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold">Sincronização Ativa</span>
            </div>
          </div>
        </div>

        {/* Métricas Principais da Frota */}
        <MetricCards stats={stats} />

        {/* Navegação por Abas Executivas */}
        <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'fleet'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Registros dos Carros ({vehicles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all whitespace-nowrap ${
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
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'timeclock'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Espelho de Ponto CLT ({punches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Colaboradores & Hierarquia ({users.length})</span>
          </button>
        </div>

        {/* Conteúdo Dinâmico das Abas */}
        <div>
          {activeTab === 'fleet' && (
            <FleetMonitor
              vehicles={vehicles}
              onStartRoute={handleStartRoute}
              onFinishRoute={handleFinishRoute}
            />
          )}

          {activeTab === 'trips' && <TripReports trips={trips} />}
          {activeTab === 'timeclock' && <TimeClockMirror punches={punches} />}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-white">Equipe e Colaboradores da Base</h3>
                  <p className="text-xs text-slate-400">
                    {isMaster
                      ? 'Você pode cadastrar usuários de controle da frota e motoristas, definindo senhas e cargos.'
                      : 'Você pode cadastrar os colaboradores operacionais e consultar os acessos da base.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsNewUserOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>+ Cadastrar Colaborador</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {users.map((u) => {
                  const isAdmin = u.role === 'ADMIN';
                  const isManager = u.role === 'FLEET_MANAGER';
                  const isDriverUser = u.role === 'DRIVER';

                  const badgeLabel = isAdmin
                    ? '👑 Usuário Master'
                    : isManager
                    ? '👔 Controle da Frota'
                    : '🚗 Colaborador';

                  const badgeClass = isAdmin
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                    : isManager
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

                  return (
                    <div
                      key={u.id}
                      className="bg-[#0F172A] rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Base: {currentUser.tenantName}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-white text-sm">{u.name}</h4>
                        <p className="text-xs text-slate-400 font-mono mt-1">CPF: {u.cpf}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Acesso ao Sistema:</span>
                        <span className="font-bold text-slate-200">
                          {isDriverUser
                            ? 'Somente viagens próprias'
                            : isManager
                            ? 'Controle de carros & equipe'
                            : 'Gestão completa da base'}
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

      {/* Modais Administrativos */}
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

      {/* Modais de Checklist e Devolução no PC */}
      <ChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        onSuccess={loadAllData}
        vehicle={selectedVehicleForRoute}
        drivers={users.length > 0 ? users : [{ id: currentUser.id, name: currentUser.name, cpf: currentUser.cpf, role: currentUser.role }]}
        currentUserId={currentUser.id}
      />

      <ReturnChecklistModal
        isOpen={isReturnChecklistOpen}
        onClose={() => setIsReturnChecklistOpen(false)}
        onSuccess={loadAllData}
        usage={selectedUsageForReturn}
      />
    </div>
  );
}
