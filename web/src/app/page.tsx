'use client';

// Resumo: Pagina principal do painel web - login, visao do motorista e visao da gestao

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
import {
  RotaLogBrandHero,
  RotaLogHeaderBrand,
  ThemeSwitcherBar,
  CorporateEmptyState,
} from '../components/BrandLogo';
import { webApi } from '../services/api';
import { ASSETS, UI_TOKENS } from '../theme';
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
  AlertCircle,
  LogOut,
  LogIn,
  Gauge,
  Utensils,
  Coffee,
  Briefcase,
  Play,
  Pause,
  Flag,
  Navigation,
  CheckSquare,
  UserPlus,
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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loginCompany, setLoginCompany] = useState('Teste Apresentação');
  const [loginCpf, setLoginCpf] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'fleet' | 'trips' | 'timeclock' | 'users'>('fleet');

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

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);

  const [selectedVehicleForRoute, setSelectedVehicleForRoute] = useState<any | null>(null);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [selectedUsageForReturn, setSelectedUsageForReturn] = useState<any | null>(null);
  const [isReturnChecklistOpen, setIsReturnChecklistOpen] = useState(false);
  const [activeUsage, setActiveUsage] = useState<any | null>(null);

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

  useEffect(() => {
    webApi
      .getTenants()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTenants(data);
          setLoginCompany(data[0].name);
        }
      })
      .catch(() => {});
  }, []);

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

  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    setIsRefreshing(true);
    try {
      const tenantId = currentUser.tenantId;
      const [
        statsData,
        vehiclesData,
        tripsData,
        punchesData,
        notifsData,
        usersData,
        activeUsageData,
      ] = await Promise.allSettled([
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

  const handleStartRoute = (vehicle: any) => {
    setSelectedVehicleForRoute(vehicle);
    setIsChecklistOpen(true);
  };

  const handleFinishRoute = (vehicle: any) => {
    const usage = trips.find(
      (t) =>
        (t.vehicleId === vehicle.id || t.vehiclePlate === vehicle.plate) &&
        t.status !== 'COMPLETED'
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

  const handlePunch = async (
    type: 'ENTRADA' | 'ALMOCO_SAIDA' | 'ALMOCO_RETORNO' | 'SAIDA'
  ) => {
    if (!currentUser) return;
    try {
      await webApi.punchTimeClock({
        userId: currentUser.id,
        type,
        tenantId: currentUser.tenantId,
      });
      loadAllData();
      alert(`Ponto registrado com sucesso. Tipo: ${type}`);
    } catch (err: any) {
      alert('Erro ao registrar ponto: ' + (err.message || 'Erro inesperado.'));
    }
  };

  const handleChangeVehicleStatus = async (
    vehicle: any,
    newStatus: 'AVAILABLE' | 'MAINTENANCE'
  ) => {
    try {
      await webApi.updateVehicleStatus(vehicle.id, newStatus);
      loadAllData();
    } catch (err: any) {
      alert('Erro ao atualizar status do veículo: ' + (err.message || 'Erro inesperado.'));
    }
  };

  // Tela de login
  if (!currentUser) {
    return (
      <div className={`${UI_TOKENS.pageBg} flex flex-col justify-between p-4 sm:p-6 lg:p-8`}>
        <div className="max-w-lg w-full mx-auto flex items-center justify-between gap-3 py-2">
          <RotaLogHeaderBrand />
          <ThemeSwitcherBar compact />
        </div>

        <div className={`max-w-lg w-full mx-auto my-4 ${UI_TOKENS.card} p-5 sm:p-7 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />

          <div className="mb-5 pt-1">
            <RotaLogBrandHero />
            <h1 className="text-xl sm:text-2xl font-black text-content-primary tracking-tight text-center mt-5">
              Portal de Acesso
            </h1>
          </div>

          {loginError && (
            <div className={`mb-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${UI_TOKENS.badgeDanger}`}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="leading-relaxed">{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand-primary" />
                Empresa / Base Operacional
              </label>
              <input
                type="text"
                placeholder="Ex: Teste Apresentação"
                value={loginCompany}
                onChange={(e) => setLoginCompany(e.target.value)}
                className={`${UI_TOKENS.input} font-medium`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                CPF do Usuário
              </label>
              <input
                type="text"
                placeholder="Ex: 111.111.111-11"
                value={loginCpf}
                onChange={(e) => setLoginCpf(e.target.value)}
                className={`${UI_TOKENS.input} font-mono`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                Senha de Acesso
              </label>
              <input
                type="password"
                placeholder="Digite sua senha"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={UI_TOKENS.input}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="keep-white w-full py-3 mt-1 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50 text-white font-black rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loginLoading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="max-w-lg w-full mx-auto text-center py-2">
          <Link
            href="/master"
            className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-brand-primary transition-colors py-1.5 px-3 rounded-full border border-transparent hover:border-surface-border"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Portal Software House (/master)</span>
          </Link>
        </div>
      </div>
    );
  }

  // Painel do motorista (rotas, check list e ponto CLT)
  if (isDriver) {
    const driverTrips = trips.filter((t) => t.driverId === currentUser.id);
    const driverPunches = punches.filter((p) => p.userId === currentUser.id);
    const availableCars = vehicles.filter((v) => v.status === 'AVAILABLE');

    const totalKm = driverTrips.reduce((acc, t) => acc + (t.totalDistanceKm || 0), 0);
    const totalLunch = driverTrips.reduce(
      (acc, t) => acc + (t.totalLunchMinutes || 0),
      0
    );

    return (
      <div className={`${UI_TOKENS.pageBg} flex flex-col`}>
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
          {/* Card de Boas-vindas com Ilustração Corporativa */}
          <div className={`${UI_TOKENS.card} p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${UI_TOKENS.badgeSuccess}`}>
                  <Car className="w-3.5 h-3.5" />
                  Perfil: Colaborador Operacional
                </span>
                <span className="text-xs text-content-secondary font-mono">
                  CPF: {currentUser.cpf}
                </span>
              </div>
              <h1 className="text-2xl font-black text-content-primary">
                Olá, {currentUser.name}
              </h1>
              <p className="text-xs text-content-secondary mt-1">
                Base Operacional:{' '}
                <strong className="text-emerald-400 font-semibold">
                  {currentUser.tenantName}
                </strong>{' '}
                • Painel individual de rotas e ponto CLT
              </p>
            </div>

            <div className={`p-4 rounded-xl max-w-sm w-full ${UI_TOKENS.badgeSuccess}`}>
              <div className="flex items-center gap-2 text-xs font-bold mb-1">
                <Smartphone className="w-4 h-4" />
                Operação em Rota (App Mobile)
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Inicie a rota pelo computador ou utilize o aplicativo mobile{' '}
                <strong className="text-content-primary">RotaLog</strong> via Expo Go.
              </p>
            </div>
          </div>

          {/* BANNER DE ROTA ATIVA */}
          {activeUsage && (
            <div className={`${UI_TOKENS.card} border-blue-500/40 p-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-xl ${UI_TOKENS.badgeInfo}`}>
                    <Navigation className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${UI_TOKENS.badgeInfo}`}>
                      {activeUsage.status === 'PAUSED_LUNCH' ? (
                        <>
                          <Coffee className="w-3 h-3" />
                          Pausa de Almoço
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3 h-3" />
                          Rota em Andamento
                        </>
                      )}
                    </span>
                    <h2 className="text-xl font-black text-content-primary mt-1">
                      Viatura: {activeUsage.vehiclePlate || 'Carro em Rota'}
                    </h2>
                    <p className="text-xs text-content-secondary mt-0.5">
                      Início da viagem:{' '}
                      {new Date(activeUsage.startTime).toLocaleTimeString('pt-BR')} •
                      Almoço acumulado: {activeUsage.totalLunchMinutes || 0} min
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeUsage.status === 'PAUSED_LUNCH' ? (
                    <button
                      onClick={handleResumeLunch}
                      className="keep-white px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Retomar Rota</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseLunch}
                      className="keep-white px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
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
                    className="keep-white px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Encerrar Rota (Devolução)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INICIAR NOVA ROTA PELO PC */}
          {!activeUsage && (
            <div className={`${UI_TOKENS.card} p-6`}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${UI_TOKENS.badgeSuccess}`}>
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-content-primary">
                      Iniciar Rota pelo PC (Preencher Checklist)
                    </h2>
                    <p className="text-xs text-content-secondary">
                      Escolha um veículo disponível no pátio para abrir o checklist de vistoria
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${UI_TOKENS.badgeSuccess}`}>
                  {availableCars.length} Disponíveis
                </span>
              </div>

              {availableCars.length === 0 ? (
                <CorporateEmptyState
                  title="Nenhum veículo disponível no pátio"
                  description="Aguarde a devolução de uma viatura ou consulte o gestor de frota."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableCars.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 bg-surface-bg border border-surface-border hover:border-emerald-500/40 rounded-2xl transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="logo-navy-box w-9 h-7 rounded overflow-hidden border border-sky-500/20">
                              <img
                                src={ASSETS.vehiclePlaceholder}
                                alt={v.model}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="font-mono font-black text-content-primary text-sm px-2 py-0.5 rounded bg-surface-elevated border border-surface-border">
                              {v.plate}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${UI_TOKENS.badgeSuccess}`}>
                            LIVRE
                          </span>
                        </div>
                        <h4 className="font-bold text-content-primary text-sm">
                          {v.brand} {v.model}
                        </h4>
                        <p className="text-xs text-content-muted mt-0.5 font-mono">
                          Odômetro: {v.currentMileage.toLocaleString('pt-BR')} km
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartRoute(v)}
                        className="keep-white mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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

          {/* Métricas Pessoais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className={`${UI_TOKENS.card} p-4`}>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
                <Car className="w-4 h-4" />
                Viagens Feitas
              </div>
              <div className="text-xl sm:text-2xl font-black text-content-primary">
                {driverTrips.length}
              </div>
            </div>

            <div className={`${UI_TOKENS.card} p-4`}>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                <Gauge className="w-4 h-4" />
                Km Percorrido
              </div>
              <div className="text-xl sm:text-2xl font-black text-content-primary">
                {totalKm} Km
              </div>
            </div>

            <div className={`${UI_TOKENS.card} p-4`}>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                <Utensils className="w-4 h-4" />
                Pausas de Almoço
              </div>
              <div className="text-xl sm:text-2xl font-black text-content-primary">
                {totalLunch} min
              </div>
            </div>

            <div className={`${UI_TOKENS.card} p-4`}>
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold mb-1">
                <Clock className="w-4 h-4" />
                Pontos CLT Hoje
              </div>
              <div className="text-xl sm:text-2xl font-black text-content-primary">
                {driverPunches.length}
              </div>
            </div>
          </div>

          {/* Controle de ponto CLT */}
          <div className={`${UI_TOKENS.card} p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${UI_TOKENS.badgeAdmin}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-content-primary">
                    Registro de Ponto Eletrônico CLT
                  </h2>
                  <p className="text-xs text-content-secondary">
                    Controle de jornada e intervalos em conformidade trabalhista
                  </p>
                </div>
              </div>
              <span className={`text-xs font-mono px-3 py-1 rounded-full self-start sm:self-auto ${UI_TOKENS.badgeAdmin}`}>
                {driverPunches.length} batidas registradas hoje
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handlePunch('ENTRADA')}
                className={`p-4 rounded-xl font-bold text-xs flex flex-col items-center gap-2 transition-all cursor-pointer hover:opacity-90 ${UI_TOKENS.badgeSuccess}`}
              >
                <LogIn className="w-5 h-5" />
                <span>Entrada Turno</span>
              </button>

              <button
                type="button"
                onClick={() => handlePunch('ALMOCO_SAIDA')}
                className={`p-4 rounded-xl font-bold text-xs flex flex-col items-center gap-2 transition-all cursor-pointer hover:opacity-90 ${UI_TOKENS.badgeWarning}`}
              >
                <Utensils className="w-5 h-5" />
                <span>Saída Almoço</span>
              </button>

              <button
                type="button"
                onClick={() => handlePunch('ALMOCO_RETORNO')}
                className={`p-4 rounded-xl font-bold text-xs flex flex-col items-center gap-2 transition-all cursor-pointer hover:opacity-90 ${UI_TOKENS.badgeInfo}`}
              >
                <Coffee className="w-5 h-5" />
                <span>Retorno Almoço</span>
              </button>

              <button
                type="button"
                onClick={() => handlePunch('SAIDA')}
                className={`p-4 rounded-xl font-bold text-xs flex flex-col items-center gap-2 transition-all cursor-pointer hover:opacity-90 ${UI_TOKENS.badgeDanger}`}
              >
                <LogOut className="w-5 h-5" />
                <span>Saída Turno</span>
              </button>
            </div>

            {driverPunches.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-surface-border">
                <span className="text-[11px] font-extrabold uppercase text-content-secondary tracking-wider block mb-2">
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
                      <span
                        key={p.id}
                        className="text-xs font-mono px-3 py-1.5 rounded-xl bg-surface-bg border border-surface-border text-content-primary flex items-center gap-1.5"
                      >
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
          <div className={`${UI_TOKENS.card} p-6`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-primary" />
                <h2 className="text-base font-bold text-content-primary">
                  Suas Viagens e Rotas Pessoais ({driverTrips.length})
                </h2>
              </div>
              <span className="text-xs text-content-secondary">Acesso Restrito ao Condutor</span>
            </div>

            {driverTrips.length === 0 ? (
              <CorporateEmptyState
                title="Sem histórico de viagens"
                description="Você ainda não realizou nenhuma rota com as viaturas da base."
              />
            ) : (
              <div className="space-y-3">
                {driverTrips.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-surface-bg border border-surface-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-content-primary text-sm px-2 py-0.5 rounded bg-surface-elevated border border-surface-border">
                          {t.vehiclePlate}
                        </span>
                        <span className="text-xs font-semibold text-content-primary">
                          {t.vehicleModel}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'COMPLETED'
                              ? UI_TOKENS.badgeSuccess
                              : UI_TOKENS.badgeWarning
                          }`}
                        >
                          {t.status === 'COMPLETED' ? 'Finalizada' : 'Em Andamento'}
                        </span>
                      </div>
                      <p className="text-xs text-content-secondary mt-1">
                        Início: {new Date(t.startTime).toLocaleTimeString('pt-BR')} •
                        Almoço Total: {t.totalLunchMinutes} min • Distância:{' '}
                        {t.totalDistanceKm} Km
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        <ChecklistModal
          isOpen={isChecklistOpen}
          onClose={() => setIsChecklistOpen(false)}
          onSuccess={loadAllData}
          vehicle={selectedVehicleForRoute}
          drivers={[
            {
              id: currentUser.id,
              name: currentUser.name,
              cpf: currentUser.cpf,
              role: currentUser.role,
            },
          ]}
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

  // Painel do admin e gestor de frota
  return (
    <div className={`${UI_TOKENS.pageBg} flex flex-col`}>
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:p-8 py-6 space-y-6">
        {/* Banner Executivo com Ilustração Corporativa de Telemetria */}
        <div className={`${UI_TOKENS.card} p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4`}>
          <div className="flex items-center gap-4">
            <div className="logo-navy-box hidden sm:block w-24 h-16 rounded-xl overflow-hidden border border-sky-500/30 shrink-0">
              <img
                src={ASSETS.heroBanner}
                alt="Telemetria RotaLog"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-content-primary">
                  Base Operacional:{' '}
                  <span className="text-brand-primary">{currentUser.tenantName}</span>
                </h1>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    isMaster ? UI_TOKENS.badgeAdmin : UI_TOKENS.badgeInfo
                  }`}
                >
                  {isMaster ? (
                    <>
                      <ShieldCheck className="w-3 h-3" />
                      Admin (Representante Legal • Permissão Total)
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-3 h-3" />
                      Gestor de Frota
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-content-secondary mt-1">
                {isMaster
                  ? 'Permissão total: gerencie carros, status dos veículos, relatórios, ponto CLT e cadastre Gestores e Motoristas.'
                  : 'Gerencie carros, status dos veículos, relatórios e históricos completos, além de cadastrar novos Motoristas.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-surface-bg px-3.5 py-2 rounded-xl border border-surface-border">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold">Sincronização Ativa</span>
            </div>
          </div>
        </div>

        <MetricCards stats={stats} />

        {/* Navegação por Abas */}
        <div className="flex border-b border-surface-border space-x-1 sm:space-x-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'fleet'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Registros dos Carros ({vehicles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'trips'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Relatórios de Viagens ({trips.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('timeclock')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'timeclock'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Espelho de Ponto CLT ({punches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Colaboradores & Hierarquia ({users.length})</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
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
                  <h3 className="text-base font-extrabold text-content-primary">
                    Equipe e Colaboradores da Base
                  </h3>
                  <p className="text-xs text-content-secondary">
                    {isMaster
                      ? 'Como Admin, você cadastra Gestores de Frota e Motoristas definindo tipo de perfil e senha.'
                      : 'Como Gestor de Frota, você pode cadastrar apenas Motoristas Operacionais.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsNewUserOpen(true)}
                  className="keep-white px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {isMaster ? 'Cadastrar Gestor / Motorista' : 'Cadastrar Motorista'}
                  </span>
                </button>
              </div>

              {users.length === 0 ? (
                <CorporateEmptyState
                  title="Nenhum colaborador encontrado"
                  description="Cadastre motoristas e gestores para operar a frota da base."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {users.map((u) => {
                    const isAdmin = u.role === 'ADMIN';
                    const isManager = u.role === 'FLEET_MANAGER';
                    const isDriverUser = u.role === 'DRIVER';

                    const badgeLabel = isAdmin
                      ? 'Admin (Representante Legal)'
                      : isManager
                      ? 'Gestor de Frota'
                      : 'Motorista Operacional';

                    const badgeClass = isAdmin
                      ? UI_TOKENS.badgeAdmin
                      : isManager
                      ? UI_TOKENS.badgeInfo
                      : UI_TOKENS.badgeSuccess;

                    const RoleIcon = isAdmin
                      ? ShieldCheck
                      : isManager
                      ? Briefcase
                      : Car;

                    return (
                      <div
                        key={u.id}
                        className={`${UI_TOKENS.card} p-4 sm:p-5 flex flex-col justify-between hover:border-brand-primary/40 transition-all`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${badgeClass}`}
                            >
                              <RoleIcon className="w-3 h-3" />
                              {badgeLabel}
                            </span>
                            <span className="text-[10px] text-content-muted font-mono">
                              Base: {currentUser.tenantName}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-content-primary text-sm">
                            {u.name}
                          </h4>
                          <div className="mt-2.5 p-2.5 rounded-xl bg-surface-bg border border-surface-border space-y-1 font-mono text-xs">
                            <div className="flex items-center justify-between text-content-primary">
                              <span className="text-content-muted">CPF:</span>
                              <span className="font-bold">{u.cpf}</span>
                            </div>
                            <div className="flex items-center justify-between text-amber-400">
                              <span className="text-content-muted flex items-center gap-1 font-sans text-[11px]">
                                <KeyRound className="w-3 h-3 text-amber-400" />
                                Senha:
                              </span>
                              <span className="font-extrabold tracking-wide">
                                {u.password || '123456'}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-content-muted mt-1.5">{u.email}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-surface-border text-[11px] text-content-secondary flex items-center justify-between">
                          <span>Acesso ao Sistema:</span>
                          <span className="font-bold text-content-primary">
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
              )}
            </div>
          )}
        </div>
      </main>

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
      />

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

      <ChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        onSuccess={loadAllData}
        vehicle={selectedVehicleForRoute}
        drivers={
          users.length > 0
            ? users
            : [
                {
                  id: currentUser.id,
                  name: currentUser.name,
                  cpf: currentUser.cpf,
                  role: currentUser.role,
                },
              ]
        }
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
