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
import { RotaLogBrandHero, RotaLogHeaderBrand, ThemeSwitcherBar } from '../components/BrandLogo';
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
  // Autenticação Única do Usuário (o tipo de login é definido automaticamente ao autenticar)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loginCompany, setLoginCompany] = useState('Teste Apresentação');
  const [loginCpf, setLoginCpf] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Aba ativa do Painel (para Admin e Gestor)
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

  // Carregar sessão salva no navegador (limpa sessões antigas fora da empresa atual)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('@rotalog:user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.tenantName === 'Teste Apresentação') {
          setCurrentUser(parsed);
        } else {
          localStorage.removeItem('@rotalog:user');
        }
      }
    } catch (_) {
      localStorage.removeItem('@rotalog:user');
    }
  }, []);

  // Carregar lista de empresas para autocomplete/seleção
  useEffect(() => {
    webApi.getTenants().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setTenants(data);
        setLoginCompany(data[0].name);
      }
    }).catch(() => {});
  }, []);

  // Ação de Login Única (Admin, Gestor ou Motorista definidos automaticamente pelo CPF/Senha)
  const handleLogin = async (
    e?: React.FormEvent,
    customCpf?: string,
    customPass?: string,
    customComp?: string
  ) => {
    if (e) e.preventDefault();
    const comp = customComp || loginCompany;
    const cpf = customCpf || loginCpf;
    const pass = customPass || loginPassword;

    if (!comp || !cpf) {
      setLoginError('Informe a Empresa e o seu CPF.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await webApi.login({
        company: comp,
        cpf,
        password: pass || '123456',
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

  const handlePunch = async (type: 'ENTRADA' | 'ALMOCO_SAIDA' | 'ALMOCO_RETORNO' | 'SAIDA') => {
    if (!currentUser) return;
    try {
      await webApi.punchTimeClock({
        userId: currentUser.id,
        type,
        tenantId: currentUser.tenantId,
      });
      loadAllData();
      alert(`Ponto registrado com sucesso! Tipo: ${type}`);
    } catch (err: any) {
      alert('Erro ao registrar ponto: ' + (err.message || 'Erro inesperado.'));
    }
  };

  const handleChangeVehicleStatus = async (vehicle: any, newStatus: 'AVAILABLE' | 'MAINTENANCE') => {
    try {
      await webApi.updateVehicleStatus(vehicle.id, newStatus);
      loadAllData();
    } catch (err: any) {
      alert('Erro ao atualizar status do veículo: ' + (err.message || 'Erro inesperado.'));
    }
  };

  // =========================================================================
  // 1. TELA ÚNICA DE LOGIN (3 TIPOS DEFINIDOS AO AUTENTICAR: ADMIN / GESTOR / MOTORISTA)
  // =========================================================================
  if (!currentUser) {
    const sampleAccounts = [
      { name: 'Ricardo Almeida', roleLabel: '👑 Admin', badge: 'text-purple-400 border-purple-500/30', cpf: '111.111.111-11', pass: '123456' },
      { name: 'Roberto Mendes', roleLabel: '👔 Gestor', badge: 'text-blue-400 border-blue-500/30', cpf: '222.222.222-22', pass: '123456' },
      { name: 'Fernanda Costa', roleLabel: '👔 Gestora', badge: 'text-blue-400 border-blue-500/30', cpf: '222.333.444-55', pass: '123456' },
      { name: 'Carlos Eduardo Silva', roleLabel: '🚗 Motorista', badge: 'text-emerald-400 border-emerald-500/30', cpf: '333.333.333-33', pass: '123456' },
      { name: 'Marcos Vinícius', roleLabel: '🚗 Motorista', badge: 'text-emerald-400 border-emerald-500/30', cpf: '444.444.444-44', pass: '123456' },
      { name: 'Lucas Gabriel Pereira', roleLabel: '🚗 Motorista', badge: 'text-emerald-400 border-emerald-500/30', cpf: '555.555.555-55', pass: '123456' },
    ];

    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-sky-500 selection:text-white">
        <div className="max-w-lg w-full mx-auto flex items-center justify-between gap-3 py-2">
          <RotaLogHeaderBrand />
          <ThemeSwitcherBar compact />
        </div>

        <div className="max-w-lg w-full mx-auto my-5 bg-[#0F172A] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />

          <div className="mb-5 pt-1">
            <RotaLogBrandHero />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight text-center mt-5">
              Portal de Acesso
            </h1>
            <p className="text-xs text-slate-400 mt-1 text-center">
              Entre com seu CPF e senha para acessar o painel.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <span className="leading-relaxed">{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Empresa / Base Operacional
              </label>
              <input
                type="text"
                placeholder="Ex: Teste Apresentação"
                value={loginCompany}
                onChange={(e) => setLoginCompany(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                CPF do Usuário
              </label>
              <input
                type="text"
                placeholder="Ex: 111.111.111-11"
                value={loginCpf}
                onChange={(e) => setLoginCpf(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                Senha de Acesso
              </label>
              <input
                type="password"
                placeholder="Digite sua senha (padrão: 123456)"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="keep-white w-full py-3.5 mt-1 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-sky-500/25 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loginLoading ? 'Identificando Perfil...' : 'Entrar no Sistema'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Acessos Fictícios da Empresa Teste Apresentação */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Acessos Fictícios • Teste Apresentação (Senha: 123456)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleAccounts.map((acc) => (
                <button
                  key={acc.cpf}
                  type="button"
                  onClick={() => handleLogin(undefined, acc.cpf, acc.pass, 'Teste Apresentação')}
                  className={`p-2.5 bg-[#070B14] hover:bg-slate-900 border rounded-xl text-left transition-all cursor-pointer ${acc.badge}`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-white truncate">{acc.name}</span>
                    <span className="text-[10px] font-extrabold shrink-0">{acc.roleLabel}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    CPF: {acc.cpf} • Senha: {acc.pass}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-lg w-full mx-auto text-center py-2">
          <Link
            href="/master"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors py-1.5 px-3 rounded-full hover:bg-indigo-950/30 border border-transparent hover:border-indigo-900/40"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Portal Software House (/master)</span>
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

          {/* Registro de Ponto Eletrônico CLT (Batidas do Dia) */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">Registro de Ponto Eletrônico CLT</h2>
                  <p className="text-xs text-slate-400">Controle de jornada e intervalos em conformidade trabalhista</p>
                </div>
              </div>
              <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 self-start sm:self-auto">
                {driverPunches.length} batidas registradas hoje
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handlePunch('ENTRADA')}
                className="p-3.5 rounded-2xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/20"
              >
                <span className="text-lg">🟢</span>
                <span>Entrada Turno</span>
              </button>

              <button
                type="button"
                onClick={() => handlePunch('ALMOCO_SAIDA')}
                className="p-3.5 rounded-2xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-950/20"
              >
                <span className="text-lg">🥪</span>
                <span>Saída Almoço</span>
              </button>

              <button
                type="button"
                onClick={() => handlePunch('ALMOCO_RETORNO')}
                className="p-3.5 rounded-2xl bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/30 hover:border-blue-500/60 text-blue-300 font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-blue-950/20"
              >
                <span className="text-lg">☕</span>
                <span>Retorno Almoço</span>
              </button>

              <button
                type="button"
                onClick={() => handlePunch('SAIDA')}
                className="p-3.5 rounded-2xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 hover:border-rose-500/60 text-rose-300 font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-rose-950/20"
              >
                <span className="text-lg">🔴</span>
                <span>Saída Turno</span>
              </button>
            </div>

            {driverPunches.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-slate-800/80">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block mb-2">
                  Histórico de Batidas de Hoje:
                </span>
                <div className="flex flex-wrap gap-2">
                  {driverPunches.map((p) => {
                    const timeStr = new Date(p.timestamp).toLocaleTimeString('pt-BR');
                    const typeLabels: any = {
                      ENTRADA: 'Entrada Turno',
                      ALMOCO_SAIDA: 'Saída Almoço',
                      ALMOCO_RETORNO: 'Retorno Almoço',
                      SAIDA: 'Saída Turno',
                    };
                    return (
                      <span key={p.id} className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#070B14] border border-slate-800 text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-purple-400" />
                        <strong>{typeLabels[p.type] || p.type}</strong>: {timeStr}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
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
                  {isMaster ? '👑 Admin (Representante Legal • Permissão Total)' : '👔 Gestor de Frota'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isMaster
                  ? 'Permissão total: gerencie carros, status dos veículos, relatórios, ponto CLT e cadastre Gestores e Motoristas.'
                  : 'Gerencie carros, status dos veículos, relatórios e históricos completos, além de cadastrar novos Motoristas (exceto gestores).'}
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
              canManageVehicles={isMaster || isControl}
              onChangeVehicleStatus={handleChangeVehicleStatus}
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
                      ? 'Como Admin, você cadastra Gestores de Frota e Motoristas definindo tipo de perfil e senha.'
                      : 'Como Gestor de Frota, você pode cadastrar apenas Motoristas Operacionais.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsNewUserOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>{isMaster ? '+ Cadastrar Gestor / Motorista' : '+ Cadastrar Motorista'}</span>
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
                        <div className="mt-2.5 p-2.5 rounded-xl bg-[#070B14] border border-slate-800 space-y-1 font-mono text-xs">
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500">CPF:</span>
                            <span className="font-bold">{u.cpf}</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-300">
                            <span className="text-slate-500 flex items-center gap-1 font-sans text-[11px]">
                              <KeyRound className="w-3 h-3 text-amber-400" />
                              Senha:
                            </span>
                            <span className="font-extrabold tracking-wide">{u.password || '123456'}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5">{u.email}</p>
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
        currentUserRole={currentUser.role}
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
