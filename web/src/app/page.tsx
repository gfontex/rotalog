'use client';

import React, { useState } from 'react';
import {
  Car,
  Users,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  TrendingUp,
  Download,
  Gauge,
  Check,
  Coffee,
  Calendar,
  Lock,
  Camera,
  Sparkles,
  LogOut,
  Key,
  Building2,
  UserCheck,
  Upload,
  Eye,
  EyeOff,
  Bell,
  BellRing,
  Flag,
  Radio,
  Trash2,
  User,
  Navigation,
} from 'lucide-react';

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  currentMileage: number;
  branch: string;
  totalHoursUsed: number;
  totalTrips: number;
  currentDriverName?: string | null; // QUEM ESTÁ USANDO O CARRO
  currentDriverCpf?: string | null;
  usageStartTime?: string | null;
}

interface Employee {
  id: string;
  name: string;
  cpf: string;
  email: string;
  role: 'ADMIN' | 'FLEET_MANAGER' | 'HR' | 'DRIVER';
  branch: string;
  isActive: boolean;
  biometricEnrolled: boolean;
  biometricConfidence?: number;
  lastClocking?: string;
  totalWorkHoursWeek: number;
}

interface FleetUsageReportItem {
  id: string;
  driverName: string;
  driverCpf: string;
  facialVerified: boolean;
  vehiclePlate: string;
  vehicleModel: string;
  startTime: string;
  endTime: string;
  totalDurationHours: number;
  lunchStart: string;
  lunchEnd: string;
  lunchDurationMinutes: number;
  netDrivingHours: number;
  startMileage: number;
  endMileage: number;
  distanceKm: number;
  checklistStatus: 'OK' | 'AVARIA';
  observation?: string;
  date: string;
}

interface FleetNotification {
  id: string;
  type: 'INICIO_ROTA' | 'INICIO_PAUSA_ALMOCO' | 'FIM_PAUSA_ALMOCO' | 'FIM_ROTA' | 'ALERTA_AVARIA';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  driverName: string;
  vehiclePlate?: string;
  vehicleModel?: string;
}

export default function DashboardPage() {
  // ESTADO DE AUTENTICAÇÃO
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    name: 'Joãozinho Silva',
    company: 'MKSEGURANCA',
    cpf: '333.444.555-66',
    role: 'DRIVER' as 'ADMIN' | 'FLEET_MANAGER' | 'HR' | 'DRIVER',
  });

  // FORMULÁRIO DE LOGIN
  const [loginCompany, setLoginCompany] = useState('MKSEGURANCA');
  const [loginPassword, setLoginPassword] = useState('33344455566');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // NAVEGAÇÃO DO PAINEL
  const [activeTab, setActiveTab] = useState<'fleet_status' | 'my_profile' | 'reports' | 'vehicles' | 'employees' | 'timeclock'>('fleet_status');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // NOTIFICAÇÕES ADMINISTRATIVAS (EXCLUSIVAS PARA PERFIS MASTER: ADMIN & FLEET_MANAGER)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<FleetNotification[]>([
    {
      id: 'notif-1',
      type: 'INICIO_ROTA',
      title: 'Início de Rota',
      message: 'Joãozinho iniciou rota com o carro Fiat Strada Freedom, placa MKS2B02.',
      timestamp: 'Há 5 min',
      isRead: false,
      driverName: 'Joãozinho Silva',
      vehiclePlate: 'MKS2B02',
      vehicleModel: 'Fiat Strada Freedom',
    },
    {
      id: 'notif-2',
      type: 'INICIO_PAUSA_ALMOCO',
      title: 'Pausa para Almoço',
      message: 'Joãozinho iniciou uma pausa para o almoço.',
      timestamp: 'Há 25 min',
      isRead: false,
      driverName: 'Joãozinho Silva',
      vehiclePlate: 'MKS2B02',
      vehicleModel: 'Fiat Strada Freedom',
    },
  ]);

  // VEÍCULOS DA FROTA COM IDENTIFICAÇÃO DE QUEM ESTÁ USANDO
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      plate: 'MKS2B02',
      brand: 'Fiat',
      model: 'Strada Freedom 1.3',
      year: 2024,
      status: 'IN_USE',
      currentMileage: 18900,
      branch: 'Base MKSEGURANCA',
      totalHoursUsed: 142.5,
      totalTrips: 48,
      currentDriverName: 'Joãozinho Silva',
      currentDriverCpf: '333.444.555-66',
      usageStartTime: '08:00',
    },
    {
      id: '2',
      plate: 'MKF1A01',
      brand: 'Renault',
      model: 'Kangoo 1.6 Maxi',
      year: 2023,
      status: 'AVAILABLE',
      currentMileage: 32400,
      branch: 'Base MKSEGURANCA',
      totalHoursUsed: 198.5,
      totalTrips: 64,
      currentDriverName: null,
      currentDriverCpf: null,
      usageStartTime: null,
    },
    {
      id: '3',
      plate: 'MKG3C03',
      brand: 'Volkswagen',
      model: 'Gol 1.0 City',
      year: 2022,
      status: 'MAINTENANCE',
      currentMileage: 49200,
      branch: 'Base MKSEGURANCA',
      totalHoursUsed: 286.0,
      totalTrips: 92,
      currentDriverName: null,
      currentDriverCpf: null,
      usageStartTime: null,
    },
    {
      id: '4',
      plate: 'RTL9A88',
      brand: 'Volkswagen',
      model: 'Gol 1.0 MPI',
      year: 2022,
      status: 'AVAILABLE',
      currentMileage: 58160,
      branch: 'Base MKSEGURANCA',
      totalHoursUsed: 224.5,
      totalTrips: 78,
      currentDriverName: null,
      currentDriverCpf: null,
      usageStartTime: null,
    },
  ]);

  // COLABORADORES DA EMPRESA
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: 'Administrador Geral MK',
      cpf: '139.932.487-08',
      email: 'admin@mkseguranca.com.br',
      role: 'ADMIN',
      branch: 'Base MKSEGURANCA',
      isActive: true,
      biometricEnrolled: true,
      biometricConfidence: 99.4,
      lastClocking: '07:55 (Entrada)',
      totalWorkHoursWeek: 40.0,
    },
    {
      id: '2',
      name: 'Carlos Oliveira - Gestor de Frota',
      cpf: '111.222.333-44',
      email: 'gestor@mkseguranca.com.br',
      role: 'FLEET_MANAGER',
      branch: 'Base MKSEGURANCA',
      isActive: true,
      biometricEnrolled: true,
      biometricConfidence: 98.7,
      lastClocking: '08:15 (Entrada)',
      totalWorkHoursWeek: 42.5,
    },
    {
      id: '3',
      name: 'Mariana Santos - RH / Folha',
      cpf: '222.333.444-55',
      email: 'rh@mkseguranca.com.br',
      role: 'HR',
      branch: 'Base MKSEGURANCA',
      isActive: true,
      biometricEnrolled: true,
      biometricConfidence: 99.1,
      lastClocking: '08:30 (Entrada)',
      totalWorkHoursWeek: 39.0,
    },
    {
      id: '4',
      name: 'Joãozinho Silva',
      cpf: '333.444.555-66',
      email: 'joaozinho@mkseguranca.com.br',
      role: 'DRIVER',
      branch: 'Base MKSEGURANCA',
      isActive: true,
      biometricEnrolled: true,
      biometricConfidence: 98.9,
      lastClocking: '08:00 (Início de Rota)',
      totalWorkHoursWeek: 41.5,
    },
  ]);

  // HISTÓRICO DE ROTAS
  const [usageReports] = useState<FleetUsageReportItem[]>([
    {
      id: 'REP-001',
      driverName: 'Joãozinho Silva',
      driverCpf: '333.444.555-66',
      facialVerified: true,
      vehiclePlate: 'MKS2B02',
      vehicleModel: 'Fiat Strada Freedom',
      startTime: '08:00',
      endTime: '17:30',
      totalDurationHours: 9.5,
      lunchStart: '12:00',
      lunchEnd: '13:00',
      lunchDurationMinutes: 60,
      netDrivingHours: 8.5,
      startMileage: 18750,
      endMileage: 18900,
      distanceKm: 150,
      checklistStatus: 'OK',
      date: '06/09/2026',
    },
    {
      id: 'REP-002',
      driverName: 'Carlos Oliveira',
      driverCpf: '111.222.333-44',
      facialVerified: true,
      vehiclePlate: 'MKG3C03',
      vehicleModel: 'Volkswagen Gol',
      startTime: '08:15',
      endTime: '16:45',
      totalDurationHours: 8.5,
      lunchStart: '12:30',
      lunchEnd: '13:30',
      lunchDurationMinutes: 60,
      netDrivingHours: 7.5,
      startMileage: 49115,
      endMileage: 49200,
      distanceKm: 85,
      checklistStatus: 'AVARIA',
      observation: 'Farol dianteiro esquerdo quebrado.',
      date: '05/09/2026',
    },
  ]);

  // MODAIS
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleBrand, setNewVehicleBrand] = useState('Fiat');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleYear, setNewVehicleYear] = useState(2024);
  const [newVehicleMileage, setNewVehicleMileage] = useState(15000);
  const [newVehicleBranch, setNewVehicleBranch] = useState('Base MKSEGURANCA');

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpCpf, setNewEmpCpf] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<'ADMIN' | 'FLEET_MANAGER' | 'HR' | 'DRIVER'>('DRIVER');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [newEmpBranch, setNewEmpBranch] = useState('Base MKSEGURANCA');
  const [isFacialEnrolled, setIsFacialEnrolled] = useState(false);
  const [facialStep, setFacialStep] = useState<'idle' | 'scanning' | 'done'>('idle');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const isMasterUser = currentUser.role === 'ADMIN' || currentUser.role === 'FLEET_MANAGER';
  const isDriver = currentUser.role === 'DRIVER';
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  // AÇÃO DE LOGIN
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const comp = loginCompany.trim().toUpperCase().replace(/\s/g, '');
    const cleanPass = loginPassword.replace(/\D/g, '');

    // Busca usuário pelo CPF informado no campo senha
    const matchedEmployee = employees.find(
      (emp) => emp.cpf.replace(/\D/g, '') === cleanPass || emp.cpf === loginPassword.trim()
    );

    if (comp.includes('MK') || comp.includes('SEGURANCA') || comp.includes('ROTALOG')) {
      // Se for o Admin Master
      if (cleanPass === '13993248708' || (matchedEmployee && matchedEmployee.role === 'ADMIN')) {
        setCurrentUser({
          name: 'Administrador Geral MK',
          company: 'MKSEGURANCA',
          cpf: '139.932.487-08',
          role: 'ADMIN',
        });
        setActiveTab('fleet_status');
        setIsLoggedIn(true);
        showToast('Login realizado como Administrador Master!');
        return;
      }

      // Se for Motorista ou outro colaborador
      if (matchedEmployee) {
        setCurrentUser({
          name: matchedEmployee.name,
          company: 'MKSEGURANCA',
          cpf: matchedEmployee.cpf,
          role: matchedEmployee.role,
        });
        setActiveTab('fleet_status');
        setIsLoggedIn(true);
        showToast(`Bem-vindo, ${matchedEmployee.name}! Acesso de Motorista ativado.`);
        return;
      }
    }

    setLoginError('Credenciais inválidas. Verifique a Base (MKSEGURANCA) e a Senha (seu CPF cadastrado).');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsNotificationOpen(false);
    showToast('Sessão encerrada com sucesso.');
  };

  // DISPARAR EVENTO DE NOTIFICAÇÃO
  const triggerFleetEvent = (
    type: 'INICIO_ROTA' | 'INICIO_PAUSA_ALMOCO' | 'FIM_PAUSA_ALMOCO' | 'FIM_ROTA',
    driverName = 'Joãozinho Silva',
    carModel = 'Fiat Strada Freedom',
    carPlate = 'MKS2B02'
  ) => {
    let title = '';
    let message = '';

    if (type === 'INICIO_ROTA') {
      title = 'Início de Rota';
      message = `${driverName} iniciou rota com o carro ${carModel}, placa ${carPlate}.`;
      setVehicles((prev) =>
        prev.map((v) =>
          v.plate === carPlate
            ? { ...v, status: 'IN_USE', currentDriverName: driverName, usageStartTime: '08:00' }
            : v
        )
      );
    } else if (type === 'INICIO_PAUSA_ALMOCO') {
      title = 'Pausa para o Almoço';
      message = `${driverName} iniciou uma pausa para o almoço.`;
    } else if (type === 'FIM_PAUSA_ALMOCO') {
      title = 'Retorno do Almoço';
      message = `${driverName} finalizou a pausa para o almoço e retomou o veículo ${carPlate}.`;
    } else if (type === 'FIM_ROTA') {
      title = 'Fim de Uso do Carro';
      message = `${driverName} finalizou o uso do carro ${carModel}, placa ${carPlate}. (Odômetro: 18.900 km | Vistoria: OK)`;
      setVehicles((prev) =>
        prev.map((v) =>
          v.plate === carPlate
            ? { ...v, status: 'AVAILABLE', currentDriverName: null, usageStartTime: null }
            : v
        )
      );
    }

    const newNotif: FleetNotification = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      timestamp: 'Agora mesmo',
      isRead: false,
      driverName,
      vehiclePlate: carPlate,
      vehicleModel: carModel,
    };

    setNotifications([newNotif, ...notifications]);
    showToast(`🔔 ${message}`, 'success');
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehiclePlate.trim() || !newVehicleModel.trim()) {
      showToast('Preencha a placa e o modelo.', 'error');
      return;
    }

    const newVeh: Vehicle = {
      id: String(vehicles.length + 1),
      plate: newVehiclePlate.toUpperCase().trim(),
      brand: newVehicleBrand,
      model: newVehicleModel.trim(),
      year: Number(newVehicleYear),
      status: 'AVAILABLE',
      currentMileage: Number(newVehicleMileage),
      branch: newVehicleBranch,
      totalHoursUsed: 0,
      totalTrips: 0,
      currentDriverName: null,
    };

    setVehicles([newVeh, ...vehicles]);
    setIsVehicleModalOpen(false);
    setNewVehiclePlate('');
    setNewVehicleModel('');
    showToast(`Veículo ${newVeh.plate} cadastrado na frota!`);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpCpf.trim()) {
      showToast('Preencha o nome e o CPF do colaborador.', 'error');
      return;
    }

    const cleanCpf = newEmpCpf.replace(/\D/g, '');
    const newEmp: Employee = {
      id: String(employees.length + 1),
      name: newEmpName.trim(),
      cpf: formatCpf(newEmpCpf),
      email: `${newEmpName.toLowerCase().replace(/\s+/g, '.')}@mkseguranca.com.br`,
      role: newEmpRole,
      branch: newEmpBranch,
      isActive: true,
      biometricEnrolled: isFacialEnrolled,
      biometricConfidence: isFacialEnrolled ? 99.2 : undefined,
      lastClocking: 'Sem registro',
      totalWorkHoursWeek: 0,
    };

    setEmployees([newEmp, ...employees]);
    setIsEmployeeModalOpen(false);
    setNewEmpName('');
    setNewEmpCpf('');
    setNewEmpPassword('');
    setIsFacialEnrolled(false);
    setFacialStep('idle');
    showToast(`Colaborador ${newEmp.name} cadastrado com sucesso!`);
  };

  const handleTriggerFacialScan = () => {
    setFacialStep('scanning');
    setTimeout(() => {
      setFacialStep('done');
      setIsFacialEnrolled(true);
      showToast('Face detectada e vetor biométrico 192-d registrado!');
    }, 1800);
  };

  // ==========================================
  // TELA 1: LOGIN (BASE: MKSEGURANCA | SENHA: CPF)
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans text-slate-100">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl shadow-xl shadow-sky-500/20 mb-4 border border-sky-400/30">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">ROTALOG</h1>
            <p className="text-slate-400 text-sm mt-1.5">
              Base Operacional • Gestão de Frota & Ponto CLT
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1.5">Acesso ao Sistema</h2>
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl mb-5 text-xs text-sky-300">
              <strong>Regra de Acesso:</strong> Base: <span className="font-mono font-bold">MKSEGURANCA</span> | Senha: <span className="font-mono font-bold">Seu CPF</span>
            </div>

            {loginError && (
              <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Base / Empresa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginCompany}
                    onChange={(e) => setLoginCompany(e.target.value)}
                    placeholder="MKSEGURANCA"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono font-bold uppercase placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Senha (CPF do Trabalhador / Gestor)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Digite seu CPF (ex: 333.444.555-66)"
                    className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  * A senha padrão de qualquer colaborador é o seu próprio CPF cadastrado.
                </p>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all text-sm flex items-center justify-center gap-2"
              >
                <span>Entrar no Sistema</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
                ⚡ Escolha um Acesso Rápido para Testar:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setLoginCompany('MKSEGURANCA');
                    setLoginPassword('33344455566');
                  }}
                  className="p-2.5 bg-slate-800/50 hover:bg-slate-800 text-left rounded-xl border border-emerald-500/40 transition-colors"
                >
                  <span className="font-bold text-emerald-400 block">🚚 Motorista Joãozinho</span>
                  <span className="text-slate-300 text-[10px] block">Acesso restrito pessoal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginCompany('MKSEGURANCA');
                    setLoginPassword('13993248708');
                  }}
                  className="p-2.5 bg-slate-800/50 hover:bg-slate-800 text-left rounded-xl border border-sky-500/40 transition-colors"
                >
                  <span className="font-bold text-sky-400 block">👑 Administrador Master</span>
                  <span className="text-slate-300 text-[10px] block">Acesso administrativo total</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-slate-400">
            © 2026 ROTALOG — Base MKSEGURANCA • LGPD & Portaria 671 MTE
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA 2: PAINEL DO SISTEMA (LOGADO)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* NOTIFICAÇÃO TOAST FLUTUANTE */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm flex items-center gap-3 backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 ${
            notification.type === 'success'
              ? 'bg-slate-900/95 border-sky-500/50 text-white shadow-sky-500/20'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <div className="p-1.5 bg-sky-500/20 rounded-xl text-sky-400">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <span className="font-medium text-xs leading-relaxed max-w-sm">{notification.message}</span>
        </div>
      )}

      {/* CABEÇALHO SUPERIOR */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">ROTALOG</span>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Base: {currentUser.company}
                </span>
                {isDriver && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Acesso Motorista
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                {isDriver ? 'Quadro de Veículos & Meu Painel Pessoal' : 'Painel de Gestão da Frota & Notificações'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* SINO DE NOTIFICAÇÕES (APENAS PARA USUÁRIOS MASTER: ADMIN E GESTOR) */}
            {isMasterUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-all shadow-sm flex items-center justify-center"
                  title="Notificações da Frota em Tempo Real"
                >
                  <Bell className="w-4 h-4 text-sky-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-slate-950 animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-xs text-white">Eventos da Frota (Master)</span>
                      <button
                        onClick={() => setNotifications([])}
                        className="text-[10px] text-slate-400 hover:text-rose-400"
                      >
                        Limpar
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-3.5 bg-slate-900/40 flex items-start gap-3">
                          <Car className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-200 text-xs">{n.title}</span>
                              <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                            </div>
                            <p className="text-slate-300 text-[11px] mt-0.5">{n.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DADOS DO USUÁRIO LOGADO */}
            <div className="hidden sm:flex flex-col text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs font-bold text-white">{currentUser.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isMasterUser
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">CPF: {currentUser.cpf}</span>
            </div>

            <button
              onClick={handleLogout}
              title="Sair da Conta"
              className="p-2.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-500/30 border border-slate-700/60 rounded-xl text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* BARRA DE NAVEGAÇÃO SEGREGADA POR PERFIL */}
      <div className="bg-slate-900/40 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto py-2">
          <nav className="flex items-center gap-1">
            {/* 1. ABA COMUM PARA TODOS: QUADRO DA FROTA (VER CARROS EM USO E POR QUEM) */}
            <button
              onClick={() => setActiveTab('fleet_status')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'fleet_status'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Quadro de Carros em Uso</span>
            </button>

            {/* 2. ABAS EXCLUSIVAS DO MOTORISTA (APENAS DADOS DELE) */}
            {isDriver && (
              <>
                <button
                  onClick={() => setActiveTab('my_profile')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'my_profile'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Meus Dados & Minhas Horas</span>
                </button>
                <button
                  onClick={() => setActiveTab('timeclock')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'timeclock'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Meu Ponto CLT</span>
                </button>
              </>
            )}

            {/* 3. ABAS EXCLUSIVAS DE GESTORES / MASTER */}
            {isMasterUser && (
              <>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'reports'
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Relatório Geral da Frota</span>
                </button>
                <button
                  onClick={() => setActiveTab('employees')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'employees'
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Colaboradores & Biometria</span>
                </button>
                <button
                  onClick={() => setActiveTab('timeclock')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'timeclock'
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Espelho de Ponto Geral</span>
                </button>
              </>
            )}
          </nav>

          {/* BOTÕES ADMINISTRATIVOS APENAS PARA MASTER */}
          {isMasterUser && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setIsVehicleModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs font-bold border border-slate-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Carro</span>
              </button>
              <button
                onClick={() => setIsEmployeeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Usuário</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ========================================================================= */}
        {/* SEÇÃO PRINCIPAL: QUADRO DE CARROS (EM USO E POR QUEM)                    */}
        {/* Visível tanto para o Motorista quanto para a Gestão                      */}
        {/* ========================================================================= */}
        {activeTab === 'fleet_status' && (
          <div className="space-y-5">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-sky-400" />
                  <span>Quadro de Carros em Tempo Real — Base MKSEGURANCA</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consulte se cada veículo está sendo utilizado no momento e <strong>por qual motorista</strong>.
                </p>
              </div>

              {/* SIMULADOR MASTER CASO ESTEJA COMO ADMIN */}
              {isMasterUser && (
                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 px-2 font-semibold">Simular Joãozinho:</span>
                  <button
                    onClick={() => triggerFleetEvent('INICIO_ROTA')}
                    className="px-2.5 py-1 bg-sky-500/20 text-sky-300 rounded text-[11px] font-bold hover:bg-sky-500/30"
                  >
                    Iniciar Rota
                  </button>
                  <button
                    onClick={() => triggerFleetEvent('FIM_ROTA')}
                    className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded text-[11px] font-bold hover:bg-purple-500/30"
                  >
                    Finalizar
                  </button>
                </div>
              )}
            </div>

            {/* GRID DE CARROS COM IDENTIFICAÇÃO DE USO E CONDUTOR */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    v.status === 'IN_USE'
                      ? 'bg-slate-900/90 border-sky-500/40 shadow-lg shadow-sky-500/5'
                      : v.status === 'AVAILABLE'
                      ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40'
                      : 'bg-slate-900/40 border-rose-950/60'
                  }`}
                >
                  <div>
                    {/* PLACA E STATUS */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 font-mono font-black text-sm text-white tracking-wide">
                        {v.plate}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                          v.status === 'IN_USE'
                            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                            : v.status === 'AVAILABLE'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {v.status === 'IN_USE'
                          ? '● EM USO AGORA'
                          : v.status === 'AVAILABLE'
                          ? '● DISPONÍVEL'
                          : '● OFICINA / AVARIA'}
                      </span>
                    </div>

                    <div className="text-base font-bold text-white">
                      {v.brand} {v.model}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Ano {v.year} • {v.currentMileage.toLocaleString('pt-BR')} km rodados
                    </div>

                    {/* BLOCO EM DESTAQUE: QUEM ESTÁ USANDO O CARRO */}
                    <div className="mt-4 p-3.5 rounded-xl border bg-slate-950/90 border-slate-800">
                      {v.status === 'IN_USE' ? (
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 block">
                            🚗 Utilizado por:
                          </span>
                          <span className="text-sm font-black text-white block">
                            {v.currentDriverName || 'Motorista em trânsito'}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <Clock className="w-3.5 h-3.5 text-sky-400" />
                            <span>Em rota desde às {v.usageStartTime || '08:00'}</span>
                          </div>
                        </div>
                      ) : v.status === 'AVAILABLE' ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Livre na garagem. Pronto para rota.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>Em manutenção na oficina autorizada.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AÇÕES DE MOTORISTA */}
                  {isDriver && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      {v.status === 'AVAILABLE' ? (
                        <button
                          onClick={() => {
                            triggerFleetEvent('INICIO_ROTA', currentUser.name, `${v.brand} ${v.model}`, v.plate);
                            showToast(`Você iniciou a rota com o veículo ${v.plate}!`);
                          }}
                          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Pegar este Carro (Iniciar Rota)</span>
                        </button>
                      ) : v.currentDriverName === currentUser.name ? (
                        <button
                          onClick={() => {
                            triggerFleetEvent('FIM_ROTA', currentUser.name, `${v.brand} ${v.model}`, v.plate);
                            showToast(`Você devolveu o veículo ${v.plate} na garagem!`);
                          }}
                          className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>Finalizar Meu Uso (Devolver Carro)</span>
                        </button>
                      ) : (
                        <div className="text-center py-2 text-[11px] text-slate-500 font-medium">
                          Indisponível para reserva no momento
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA EXCLUSIVA DO MOTORISTA: MEUS DADOS PESSOAIS & MINHAS HORAS           */}
        {/* O motorista só tem acesso às informações dele                            */}
        {/* ========================================================================= */}
        {activeTab === 'my_profile' && isDriver && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{currentUser.name}</h2>
                  <p className="text-xs text-slate-400">
                    Cargo: <strong>Motorista Operacional</strong> • Base: <strong>MKSEGURANCA</strong>
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">CPF: {currentUser.cpf}</p>
                </div>
              </div>
            </div>

            {/* MINHAS MÉTRICAS DE TRABALHO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400 font-medium">Horas Rodadas na Semana</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">41.5h</div>
                <span className="text-[11px] text-slate-500">Dentro da jornada regular CLT</span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400 font-medium">Intervalo de Almoço (Art. 71)</span>
                <div className="text-2xl font-black text-white mt-1">1h00 diária</div>
                <span className="text-[11px] text-emerald-400 font-medium">Cumprido regularmente</span>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400 font-medium">Biometria Facial Cadastrada</span>
                <div className="text-2xl font-black text-sky-400 mt-1">100% Ativa</div>
                <span className="text-[11px] text-slate-400">Confiança 98.9% on-device</span>
              </div>
            </div>

            {/* APENAS O HISTÓRICO DAS MINHAS ROTAS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-bold text-sm text-white mb-3">Minhas Últimas Viagens</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Carro Utilizado</th>
                      <th className="py-2.5 px-3">Horário</th>
                      <th className="py-2.5 px-3">Almoço</th>
                      <th className="py-2.5 px-3">Horas Líquidas</th>
                      <th className="py-2.5 px-3">Distância</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-slate-300">06/09/2026</td>
                      <td className="py-3 px-3 font-bold text-white">MKS2B02 (Fiat Strada)</td>
                      <td className="py-3 px-3 font-mono text-slate-400">08:00 às 17:30</td>
                      <td className="py-3 px-3 text-amber-400 font-bold">60 min</td>
                      <td className="py-3 px-3 font-mono font-black text-emerald-400">8.5h</td>
                      <td className="py-3 px-3 font-mono text-slate-300">150 km</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA: PONTO ELETRÔNICO CLT (SE MOTORISTA, APENAS O DELE; SE MASTER, GERAL) */}
        {/* ========================================================================= */}
        {activeTab === 'timeclock' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
              <h2 className="text-base font-bold text-white">
                {isDriver ? 'Meu Espelho de Ponto Eletrônico' : 'Espelho de Ponto Geral da Frota'}
              </h2>
              <p className="text-xs text-slate-400">
                {isDriver
                  ? 'Visualização estrita das suas batidas com biometria facial e horas CLT.'
                  : 'Conferência de jornada 8h, tolerância de 10 min (Art. 58) e horas extras de todos.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees
                .filter((e) => (isDriver ? e.cpf === currentUser.cpf : true))
                .map((e) => (
                  <div key={e.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-bold text-white text-sm block">{e.name}</span>
                        <span className="text-xs text-slate-400 font-mono">CPF: {e.cpf}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 bg-emerald-500/10 rounded-lg">
                        {e.totalWorkHoursWeek}h semanais
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Jornada Diária Prevista:</span>
                        <span className="font-bold">8h00</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Intervalo Intrajornada (Art. 71):</span>
                        <span className="font-bold text-emerald-400">1h00 (Cumprido)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Validação Biométrica Facial:</span>
                        <span className="font-bold text-sky-400">100% On-Device</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA EXCLUSIVA DE GESTORES: RELATÓRIOS GERAIS DA FROTA                     */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && isMasterUser && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-white">Relatório Geral da Frota MKSEGURANCA</h2>
                <p className="text-xs text-slate-400">Consolidado de todas as rotas e intervalos</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Motorista</th>
                    <th className="py-3 px-4">Veículo</th>
                    <th className="py-3 px-4">Horários</th>
                    <th className="py-3 px-4">Almoço</th>
                    <th className="py-3 px-4">Horas Líquidas</th>
                    <th className="py-3 px-4">Vistoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {usageReports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">{r.date}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{r.driverName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{r.driverCpf}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-200">{r.vehiclePlate}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {r.startTime} às {r.endTime}
                      </td>
                      <td className="py-3.5 px-4 text-amber-400 font-bold">{r.lunchDurationMinutes} min</td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-400">{r.netDrivingHours}h</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            r.checklistStatus === 'OK'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {r.checklistStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA EXCLUSIVA DE GESTORES: TODOS OS COLABORADORES DA EMPRESA              */}
        {/* ========================================================================= */}
        {activeTab === 'employees' && isMasterUser && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-white">Gestão de Colaboradores & Biometria</h2>
                <p className="text-xs text-slate-400">Usuários cadastrados na Base MKSEGURANCA</p>
              </div>
              <button
                onClick={() => setIsEmployeeModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Usuário</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">CPF (Senha)</th>
                    <th className="py-3 px-4">Cargo</th>
                    <th className="py-3 px-4">Biometria</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {employees.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-white">{e.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{e.cpf}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-slate-300">
                          {e.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {e.biometricEnrolled ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cadastrada (192-d)
                          </span>
                        ) : (
                          <span className="text-amber-400 font-semibold">Pendente</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">Ativo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL NOVO VEÍCULO (MASTER) */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Cadastrar Novo Carro</h3>
            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Placa</label>
                <input
                  type="text"
                  value={newVehiclePlate}
                  onChange={(e) => setNewVehiclePlate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white uppercase font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo</label>
                <input
                  type="text"
                  value={newVehicleModel}
                  onChange={(e) => setNewVehicleModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO USUÁRIO (MASTER) */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Criar Novo Usuário</h3>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">CPF (Senha Padrão)</label>
                <input
                  type="text"
                  value={newEmpCpf}
                  onChange={(e) => setNewEmpCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cargo</label>
                <select
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="DRIVER">Motorista Operacional</option>
                  <option value="FLEET_MANAGER">Gestor de Frota</option>
                  <option value="HR">RH / Folha</option>
                  <option value="ADMIN">Administrador Master</option>
                </select>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-white font-bold block mb-1">Biometria Facial</span>
                <button
                  type="button"
                  onClick={handleTriggerFacialScan}
                  className="w-full py-2 bg-slate-800 text-sky-400 rounded-lg text-xs font-bold"
                >
                  {isFacialEnrolled ? '✓ Biometria 192-d Cadastrada' : 'Iniciar Captura Facial'}
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
