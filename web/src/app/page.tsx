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
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Começa logado no Admin MK Segurança
  const [currentUser, setCurrentUser] = useState({
    name: 'Administrador MK Segurança',
    company: 'MK Seguranca',
    cpf: '139.932.487-08',
    role: 'ADMIN' as 'ADMIN' | 'FLEET_MANAGER' | 'HR' | 'DRIVER',
  });

  // FORMULÁRIO DE LOGIN
  const [loginCompany, setLoginCompany] = useState('MK Seguranca');
  const [loginPassword, setLoginPassword] = useState('13993248708');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // NAVEGAÇÃO DO PAINEL
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'vehicles' | 'employees' | 'checklists' | 'timeclock'>('overview');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // NOTIFICAÇÕES ADMINISTRATIVAS (EXCLUSIVAS PARA PERFIS MASTER: ADMIN & FLEET_MANAGER)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<FleetNotification[]>([
    {
      id: 'notif-1',
      type: 'INICIO_ROTA',
      title: 'Início de Rota',
      message: 'Joãozinho iniciou rota com o carro Renault Kangoo 1.6 Maxi, placa MKF1A01.',
      timestamp: 'Há 5 min',
      isRead: false,
      driverName: 'Joãozinho Silva',
      vehiclePlate: 'MKF1A01',
      vehicleModel: 'Renault Kangoo 1.6 Maxi',
    },
    {
      id: 'notif-2',
      type: 'INICIO_PAUSA_ALMOCO',
      title: 'Pausa para Almoço',
      message: 'Joãozinho iniciou uma pausa para o almoço.',
      timestamp: 'Há 25 min',
      isRead: false,
      driverName: 'Joãozinho Silva',
      vehiclePlate: 'MKF1A01',
      vehicleModel: 'Renault Kangoo 1.6 Maxi',
    },
    {
      id: 'notif-3',
      type: 'FIM_PAUSA_ALMOCO',
      title: 'Retorno do Almoço',
      message: 'Joãozinho finalizou a pausa para o almoço (45 min) e retomou o veículo.',
      timestamp: 'Há 1 hora',
      isRead: true,
      driverName: 'Joãozinho Silva',
      vehiclePlate: 'MKS2B02',
      vehicleModel: 'Fiat Strada Freedom',
    },
    {
      id: 'notif-4',
      type: 'FIM_ROTA',
      title: 'Fim de Uso do Carro',
      message: 'Carlos Oliveira finalizou o uso do carro Volkswagen Gol, placa MKG3C03.',
      timestamp: 'Há 2 horas',
      isRead: true,
      driverName: 'Carlos Oliveira',
      vehiclePlate: 'MKG3C03',
      vehicleModel: 'Volkswagen Gol',
    },
  ]);

  // MODAL VEÍCULO
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleBrand, setNewVehicleBrand] = useState('Fiat');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleYear, setNewVehicleYear] = useState(2024);
  const [newVehicleMileage, setNewVehicleMileage] = useState(15000);
  const [newVehicleBranch, setNewVehicleBranch] = useState('Base Operacional MK');

  // MODAL NOVO USUÁRIO / COLABORADOR
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpCpf, setNewEmpCpf] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<'ADMIN' | 'FLEET_MANAGER' | 'HR' | 'DRIVER'>('DRIVER');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [newEmpBranch, setNewEmpBranch] = useState('Base Operacional MK');
  const [isFacialEnrolled, setIsFacialEnrolled] = useState(false);
  const [facialStep, setFacialStep] = useState<'idle' | 'scanning' | 'done'>('idle');

  // VEÍCULOS DA FROTA
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      plate: 'MKF1A01',
      brand: 'Renault',
      model: 'Kangoo 1.6 Maxi',
      year: 2023,
      status: 'AVAILABLE',
      currentMileage: 32400,
      branch: 'Base Operacional MK',
      totalHoursUsed: 198.5,
      totalTrips: 64,
    },
    {
      id: '2',
      plate: 'MKS2B02',
      brand: 'Fiat',
      model: 'Strada Freedom 1.3',
      year: 2024,
      status: 'IN_USE',
      currentMileage: 18900,
      branch: 'Base Operacional MK',
      totalHoursUsed: 142.5,
      totalTrips: 48,
    },
    {
      id: '3',
      plate: 'MKG3C03',
      brand: 'Volkswagen',
      model: 'Gol 1.0 City',
      year: 2022,
      status: 'MAINTENANCE',
      currentMileage: 49200,
      branch: 'Base Operacional MK',
      totalHoursUsed: 286.0,
      totalTrips: 92,
    },
    {
      id: '4',
      plate: 'RTL9A88',
      brand: 'Volkswagen',
      model: 'Gol 1.0 MPI',
      year: 2022,
      status: 'AVAILABLE',
      currentMileage: 58160,
      branch: 'Matriz São Paulo',
      totalHoursUsed: 224.5,
      totalTrips: 78,
    },
  ]);

  // COLABORADORES E USUÁRIOS
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: 'Administrador MK Segurança',
      cpf: '139.932.487-08',
      email: 'admin@mkseguranca.com.br',
      role: 'ADMIN',
      branch: 'Base Operacional MK',
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
      branch: 'Base Operacional MK',
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
      branch: 'Base Operacional MK',
      isActive: true,
      biometricEnrolled: true,
      biometricConfidence: 99.1,
      lastClocking: '08:30 (Entrada)',
      totalWorkHoursWeek: 39.0,
    },
    {
      id: '4',
      name: 'Joãozinho Silva - Motorista Operacional',
      cpf: '333.444.555-66',
      email: 'motorista@mkseguranca.com.br',
      role: 'DRIVER',
      branch: 'Base Operacional MK',
      isActive: true,
      biometricEnrolled: true,
      biometricConfidence: 98.9,
      lastClocking: '07:45 (Início Rota)',
      totalWorkHoursWeek: 41.0,
    },
  ]);

  // RELATÓRIOS CONSOLIDADOS COM ALMOÇO DEDUZIDO
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
      observation: 'Farol dianteiro esquerdo quebrado e amassado no para-choque.',
      date: '05/09/2026',
    },
  ]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const isMasterUser = currentUser.role === 'ADMIN' || currentUser.role === 'FLEET_MANAGER';
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // FORMATADOR DE CPF
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

    const comp = loginCompany.trim().toLowerCase();
    const cleanPass = loginPassword.replace(/\D/g, '');

    const matchedEmployee = employees.find(
      (emp) => emp.cpf.replace(/\D/g, '') === cleanPass || emp.cpf === loginPassword.trim()
    );

    if (comp.includes('mk') || comp.includes('seguran') || comp.includes('rotalog')) {
      if (cleanPass === '13993248708' || (matchedEmployee && matchedEmployee.role === 'ADMIN')) {
        setCurrentUser({
          name: 'Administrador MK Segurança',
          company: 'MK Segurança',
          cpf: '139.932.487-08',
          role: 'ADMIN',
        });
        setIsLoggedIn(true);
        showToast('Login realizado como Administrador Master!');
        return;
      }

      if (matchedEmployee) {
        setCurrentUser({
          name: matchedEmployee.name,
          company: 'MK Segurança',
          cpf: matchedEmployee.cpf,
          role: matchedEmployee.role,
        });
        setIsLoggedIn(true);
        showToast(`Login efetuado: ${matchedEmployee.name} (${matchedEmployee.role})`);
        return;
      }
    }

    setLoginError('Credenciais inválidas. Verifique a Empresa e a Senha (seu CPF cadastrado).');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsNotificationOpen(false);
    showToast('Sessão encerrada com sucesso.');
  };

  // DISPARAR EVENTO DE NOTIFICAÇÃO EM TEMPO REAL (SIMULAÇÃO DO JOÃOZINHO)
  const triggerFleetEvent = (
    type: 'INICIO_ROTA' | 'INICIO_PAUSA_ALMOCO' | 'FIM_PAUSA_ALMOCO' | 'FIM_ROTA',
    driverName = 'Joãozinho',
    carModel = 'Renault Kangoo 1.6 Maxi',
    carPlate = 'MKF1A01'
  ) => {
    let title = '';
    let message = '';

    if (type === 'INICIO_ROTA') {
      title = 'Início de Rota';
      message = `${driverName} iniciou rota com o carro ${carModel}, placa ${carPlate}.`;
      // Atualiza o status do carro para Em Rota
      setVehicles((prev) =>
        prev.map((v) => (v.plate === carPlate ? { ...v, status: 'IN_USE' } : v))
      );
    } else if (type === 'INICIO_PAUSA_ALMOCO') {
      title = 'Pausa para o Almoço';
      message = `${driverName} iniciou uma pausa para o almoço.`;
    } else if (type === 'FIM_PAUSA_ALMOCO') {
      title = 'Retorno do Almoço';
      message = `${driverName} finalizou a pausa para o almoço e retomou o veículo ${carPlate}.`;
    } else if (type === 'FIM_ROTA') {
      title = 'Fim de Uso do Carro';
      message = `${driverName} finalizou o uso do carro ${carModel}, placa ${carPlate}. (Odômetro: 32.550 km | Vistoria: OK)`;
      // Atualiza o status do carro de volta para Disponível
      setVehicles((prev) =>
        prev.map((v) => (v.plate === carPlate ? { ...v, status: 'AVAILABLE' } : v))
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

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // CADASTRO DE NOVO CARRO / VEÍCULO
  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehiclePlate.trim() || !newVehicleModel.trim()) {
      showToast('Preencha a placa e o modelo do veículo.', 'error');
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
    };

    setVehicles([newVeh, ...vehicles]);
    setIsVehicleModalOpen(false);
    setNewVehiclePlate('');
    setNewVehicleModel('');
    showToast(`Veículo ${newVeh.plate} cadastrado com sucesso na frota!`);
  };

  // CADASTRO DE NOVO USUÁRIO / COLABORADOR COM BIOMETRIA
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpCpf.trim()) {
      showToast('Preencha o nome e o CPF do funcionário.', 'error');
      return;
    }

    const cleanCpf = newEmpCpf.replace(/\D/g, '');
    if (cleanCpf.length < 11) {
      showToast('Informe um CPF válido com 11 dígitos.', 'error');
      return;
    }

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
    showToast(`Colaborador ${newEmp.name} cadastrado! Senha padrão definida como CPF.`);
  };

  // SIMULAÇÃO DA CAPTURA FACIAL ON-DEVICE (GOOGLE ML KIT + MOBILENET)
  const handleTriggerFacialScan = () => {
    setFacialStep('scanning');
    setTimeout(() => {
      setFacialStep('done');
      setIsFacialEnrolled(true);
      showToast('Face detectada e vetor biométrico 192-d registrado com sucesso!');
    }, 1800);
  };

  // EXPORTAÇÃO EXCEL (.CSV)
  const handleExportCSV = () => {
    const headers = 'Data;Motorista;CPF;Veiculo;Inicio;Fim;Almoco;Horas_Liquidas;Km_Percorrido;Vistoria\n';
    const rows = usageReports
      .map(
        (r) =>
          `${r.date};${r.driverName};${r.driverCpf};${r.vehiclePlate} (${r.vehicleModel});${r.startTime};${r.endTime};${r.lunchDurationMinutes}min;${r.netDrivingHours}h;${r.distanceKm}km;${r.checklistStatus}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_Frota_MK_Seguranca_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha Excel (.csv) exportada com sucesso!');
  };

  // EXPORTAÇÃO PDF / IMPRESSÃO
  const handleExportPDF = () => {
    window.print();
  };

  // ==========================================
  // TELA 1: LOGIN (QUANDO NÃO ESTIVER AUTENTICADO)
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
              Gestão de Frota, Biometria On-Device & Controle CLT
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Acesse sua Conta</h2>
            <p className="text-xs text-slate-400 mb-6">
              Digite o nome da empresa e utilize o seu <strong>CPF cadastrado</strong> como senha.
            </p>

            {loginError && (
              <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Empresa / Login
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginCompany}
                    onChange={(e) => setLoginCompany(e.target.value)}
                    placeholder="Ex: MK Seguranca"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
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
                    placeholder="Ex: 13993248708 ou formatado"
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
                  * Por padrão, a senha de acesso é o próprio CPF cadastrado.
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
                ⚡ Acesso Rápido de Demonstração (1 Clique):
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setLoginCompany('MK Seguranca');
                    setLoginPassword('13993248708');
                  }}
                  className="p-2.5 bg-slate-800/50 hover:bg-slate-800 text-left rounded-xl border border-slate-700/60 transition-colors"
                >
                  <span className="font-bold text-sky-400 block">👑 Administrador Master</span>
                  <span className="text-slate-300 text-[10px] block">CPF: 139.932.487-08</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginCompany('MK Seguranca');
                    setLoginPassword('33344455566');
                  }}
                  className="p-2.5 bg-slate-800/50 hover:bg-slate-800 text-left rounded-xl border border-slate-700/60 transition-colors"
                >
                  <span className="font-bold text-emerald-400 block">🚚 Motorista Joãozinho</span>
                  <span className="text-slate-300 text-[10px] block">CPF: 333.444.555-66</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-slate-400">
            © 2026 ROTALOG — Multi-Tenant SaaS • Totalmente compatível com LGPD & Portaria 671 MTE
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA 2: PAINEL GERENCIAL DO SISTEMA (LOGADO)
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

      {/* CABEÇALHO SUPERIOR EXECUTIVO */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">ROTALOG</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {currentUser.company}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Painel Integrado de Frota, Biometria & Notificações Administrativas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* ========================================================================= */}
            {/* SINO DE NOTIFICAÇÕES (EXCLUSIVO PARA USUÁRIOS MASTER: ADMIN & GESTOR) */}
            {/* ========================================================================= */}
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

                {/* PAINEL DROPDOWN DE NOTIFICAÇÕES */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-400">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-white block">Eventos da Frota</span>
                          <span className="text-[10px] text-slate-400">Exclusivo para Gestores Master</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-semibold text-sky-400 hover:underline px-2 py-1"
                          >
                            Ler todas
                          </button>
                        )}
                        <button
                          onClick={clearNotifications}
                          title="Limpar todas"
                          className="p-1 hover:text-rose-400 text-slate-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                          Nenhuma notificação recente da frota.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 transition-colors flex items-start gap-3 ${
                              n.isRead ? 'bg-slate-900/40 opacity-75' : 'bg-slate-800/30'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {n.type === 'INICIO_ROTA' && (
                                <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                                  <Car className="w-4 h-4" />
                                </div>
                              )}
                              {n.type === 'INICIO_PAUSA_ALMOCO' && (
                                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                                  <Coffee className="w-4 h-4" />
                                </div>
                              )}
                              {n.type === 'FIM_PAUSA_ALMOCO' && (
                                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              )}
                              {n.type === 'FIM_ROTA' && (
                                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                                  <Flag className="w-4 h-4" />
                                </div>
                              )}
                              {n.type === 'ALERTA_AVARIA' && (
                                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
                                  <AlertTriangle className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-bold text-slate-200 text-xs">{n.title}</span>
                                <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                              </div>
                              <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2 bg-slate-950 border-t border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400">
                        Monitoramento em tempo real via Telemetria ROTALOG
                      </span>
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
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">CPF: {currentUser.cpf}</span>
            </div>

            <button
              onClick={handleLogout}
              title="Encerrar Sessão"
              className="p-2.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-500/30 border border-slate-700/60 rounded-xl text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* BARRA DE NAVEGAÇÃO DE ABAS */}
      <div className="bg-slate-900/40 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto py-2">
          <nav className="flex items-center gap-1">
            {[
              { id: 'overview', label: 'Dashboard Geral', icon: TrendingUp },
              { id: 'reports', label: 'Relatórios de Uso / Almoço', icon: FileSpreadsheet },
              { id: 'vehicles', label: 'Gestão de Veículos (Carros)', icon: Car },
              { id: 'employees', label: 'Colaboradores & Biometria', icon: Users },
              { id: 'timeclock', label: 'Espelho de Ponto CLT', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* BOTÕES RÁPIDOS DE CADASTRO PARA ADMIN / GESTOR */}
          {isMasterUser && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setIsVehicleModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white rounded-lg text-xs font-bold border border-slate-700 transition-colors shadow-sm"
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
        {/* BARRA DE SIMULAÇÃO DE EVENTOS DO MOTORISTA "JOÃOZINHO" (EXCLUSIVA MASTER) */}
        {/* ========================================================================= */}
        {isMasterUser && (
          <div className="p-4 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="font-extrabold text-sm text-white">
                  Central de Notificações da Frota (Simulador em Tempo Real)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  Apenas Usuários Master
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Teste as notificações de uso do veículo pelo motorista <strong>Joãozinho</strong> conforme sua regra:
              </p>
            </div>

            {/* BOTÕES DE DISPARO DAS 4 ETAPAS DE NOTIFICAÇÃO */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => triggerFleetEvent('INICIO_ROTA', 'Joãozinho', 'Renault Kangoo', 'MKF1A01')}
                className="px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Car className="w-3.5 h-3.5 text-sky-400" />
                <span>1. Início de Rota</span>
              </button>

              <button
                type="button"
                onClick={() => triggerFleetEvent('INICIO_PAUSA_ALMOCO', 'Joãozinho')}
                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Pausa Almoço</span>
              </button>

              <button
                type="button"
                onClick={() => triggerFleetEvent('FIM_PAUSA_ALMOCO', 'Joãozinho', 'Renault Kangoo', 'MKF1A01')}
                className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Retomou Almoço</span>
              </button>

              <button
                type="button"
                onClick={() => triggerFleetEvent('FIM_ROTA', 'Joãozinho', 'Renault Kangoo', 'MKF1A01')}
                className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Flag className="w-3.5 h-3.5 text-purple-400" />
                <span>4. Fim de Uso</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* ABA: DASHBOARD GERAL                    */}
        {/* ======================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Total de Carros</span>
                  <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                    <Car className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-white mt-2">{vehicles.length} Veículos</div>
                <div className="text-[11px] text-emerald-400 font-medium mt-1">
                  {vehicles.filter((v) => v.status === 'AVAILABLE').length} disponíveis na garagem
                </div>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Em Rota Ativa</span>
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-white mt-2">
                  {vehicles.filter((v) => v.status === 'IN_USE').length} Em Trânsito
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Notificações operacionais ativas</div>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Colaboradores Ativos</span>
                  <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-white mt-2">{employees.length} Cadastrados</div>
                <div className="text-[11px] text-purple-400 mt-1">100% com senha padrão CPF</div>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Notificações Recebidas</span>
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                    <Bell className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-white mt-2">{notifications.length} Eventos</div>
                <div className="text-[11px] text-amber-400 font-medium mt-1">
                  {unreadCount} não lidas no sino
                </div>
              </div>
            </div>

            {/* VISÃO RÁPIDA DOS CARROS */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Status da Frota em Tempo Real</h3>
                  <p className="text-xs text-slate-400">Veículos vinculados à empresa {currentUser.company}</p>
                </div>
                {isMasterUser && (
                  <button
                    onClick={() => setIsVehicleModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Carro</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-sm text-white px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                          {v.plate}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            v.status === 'AVAILABLE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : v.status === 'IN_USE'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {v.status === 'AVAILABLE'
                            ? 'DISPONÍVEL'
                            : v.status === 'IN_USE'
                            ? 'EM ROTA'
                            : 'OFICINA'}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-slate-200">
                        {v.brand} {v.model} ({v.year})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Hodômetro: {v.currentMileage.toLocaleString('pt-BR')} km
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Total em rota:</span>
                      <span className="font-bold text-slate-200">{v.totalHoursUsed}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* ABA: RELATÓRIOS CONSOLIDADOS            */}
        {/* ======================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-white">
                  Relatório Consolidado de Horas ao Volante & Intervalos
                </h2>
                <p className="text-xs text-slate-400">
                  Cálculo automático de almoço deduzido (Opção A) e validações faciais
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar Excel (.csv)</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar PDF / Imprimir</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Motorista & CPF</th>
                      <th className="py-3 px-4">Biometria</th>
                      <th className="py-3 px-4">Veículo</th>
                      <th className="py-3 px-4">Início / Fim</th>
                      <th className="py-3 px-4">Almoço (Opção A)</th>
                      <th className="py-3 px-4">Horas Líquidas</th>
                      <th className="py-3 px-4">Km Rodado</th>
                      <th className="py-3 px-4">Inspeção</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {usageReports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-300">{r.date}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{r.driverName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{r.driverCpf}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Facial 99%
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-200 block">{r.vehiclePlate}</span>
                          <span className="text-[11px] text-slate-400">{r.vehicleModel}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {r.startTime} às {r.endTime}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            <Coffee className="w-3 h-3" />
                            {r.lunchDurationMinutes} min deduzidos
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-emerald-400 text-sm">
                          {r.netDrivingHours}h
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">{r.distanceKm} km</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              r.checklistStatus === 'OK'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {r.checklistStatus === 'OK' ? '100% APROVADO' : 'AVARIA REPORTADA'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* ABA: GESTÃO DE VEÍCULOS (CARROS)       */}
        {/* ======================================= */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-white">Carros Cadastrados na Frota</h2>
                <p className="text-xs text-slate-400">
                  Gerenciamento de veículos da empresa {currentUser.company}
                </p>
              </div>
              {isMasterUser && (
                <button
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Novo Carro</span>
                </button>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Placa</th>
                    <th className="py-3 px-4">Marca e Modelo</th>
                    <th className="py-3 px-4">Ano</th>
                    <th className="py-3 px-4">Status Atual</th>
                    <th className="py-3 px-4">Odômetro Atual</th>
                    <th className="py-3 px-4">Base / Garagem</th>
                    <th className="py-3 px-4">Horas em Trânsito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{v.plate}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {v.brand} {v.model}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{v.year}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            v.status === 'AVAILABLE'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : v.status === 'IN_USE'
                              ? 'bg-sky-500/10 text-sky-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {v.status === 'AVAILABLE'
                            ? 'Disponível'
                            : v.status === 'IN_USE'
                            ? 'Em Rota'
                            : 'Oficina'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {v.currentMileage.toLocaleString('pt-BR')} km
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{v.branch}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400">{v.totalHoursUsed}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* ABA: COLABORADORES & BIOMETRIA FACIAL  */}
        {/* ======================================= */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-white">Usuários & Biometria Facial</h2>
                <p className="text-xs text-slate-400">
                  Cadastros com senha padrão (CPF) e vetor facial 192 dimensões (LGPD)
                </p>
              </div>
              {isMasterUser && (
                <button
                  onClick={() => setIsEmployeeModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Novo Usuário</span>
                </button>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Nome do Colaborador</th>
                    <th className="py-3 px-4">CPF (Senha Padrão)</th>
                    <th className="py-3 px-4">Cargo / Perfil</th>
                    <th className="py-3 px-4">Biometria Facial (192-d)</th>
                    <th className="py-3 px-4">Status Conta</th>
                    <th className="py-3 px-4">Última Batida de Ponto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {employees.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{e.name}</span>
                        <span className="text-[11px] text-slate-400">{e.email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{e.cpf}</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                            SENHA
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {e.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {e.biometricEnrolled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cadastrada ({e.biometricConfidence || 99}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-400 font-bold text-[10px]">Ativo</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{e.lastClocking}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* ABA: PONTO ELETRÔNICO CLT               */}
        {/* ======================================= */}
        {activeTab === 'timeclock' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
              <h2 className="text-base font-bold text-white">Espelho de Ponto Eletrônico (Portaria 671 MTE)</h2>
              <p className="text-xs text-slate-400">
                Auditoria de horários diários, tolerância de 10 min (Art. 58) e teto de horas extras (Art. 59)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((e) => (
                <div key={e.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-white text-sm block">{e.name}</span>
                      <span className="text-xs text-slate-400 font-mono">CPF: {e.cpf}</span>
                    </div>
                    <span className="text-xs font-bold text-sky-400 px-2.5 py-1 bg-sky-500/10 rounded-lg">
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
      </main>

      {/* ========================================== */}
      {/* MODAL 1: REGISTRAR CARRO (ADMIN/GESTOR)    */}
      {/* ========================================== */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                  <Car className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Cadastrar Novo Carro na Frota</h3>
              </div>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Placa do Veículo *
                  </label>
                  <input
                    type="text"
                    value={newVehiclePlate}
                    onChange={(e) => setNewVehiclePlate(e.target.value)}
                    placeholder="Ex: MKF1A01"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white uppercase font-mono focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Marca *
                  </label>
                  <select
                    value={newVehicleBrand}
                    onChange={(e) => setNewVehicleBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Fiat">Fiat</option>
                    <option value="Renault">Renault</option>
                    <option value="Volkswagen">Volkswagen</option>
                    <option value="Chevrolet">Chevrolet</option>
                    <option value="Toyota">Toyota</option>
                    <option value="Ford">Ford</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    placeholder="Ex: Fiorino 1.4 EVO"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ano de Fabricação
                  </label>
                  <input
                    type="number"
                    value={newVehicleYear}
                    onChange={(e) => setNewVehicleYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Odômetro Atual (Km)
                  </label>
                  <input
                    type="number"
                    value={newVehicleMileage}
                    onChange={(e) => setNewVehicleMileage(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Base / Garagem
                  </label>
                  <input
                    type="text"
                    value={newVehicleBranch}
                    onChange={(e) => setNewVehicleBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20"
                >
                  Salvar Carro na Frota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: CRIAR NOVO USUÁRIO + BIOMETRIA   */}
      {/* ========================================== */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Criar Novo Usuário / Colaborador</h3>
                  <p className="text-xs text-slate-400">
                    Definição de cargo, senha padrão (CPF) e biometria facial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo do Funcionário *
                </label>
                <input
                  type="text"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  placeholder="Ex: Rogério da Costa Martins"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CPF do Funcionário *
                  </label>
                  <input
                    type="text"
                    value={newEmpCpf}
                    onChange={(e) => {
                      const formatted = formatCpf(e.target.value);
                      setNewEmpCpf(formatted);
                      setNewEmpPassword(formatted.replace(/\D/g, ''));
                    }}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cargo / Perfil de Acesso *
                  </label>
                  <select
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="DRIVER">Motorista Operacional</option>
                    <option value="FLEET_MANAGER">Gestor de Frota</option>
                    <option value="HR">RH / Financeiro</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Senha de Acesso (Padrão: CPF do Trabalhador)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newEmpPassword}
                    onChange={(e) => setNewEmpPassword(e.target.value)}
                    placeholder="Auto-preenchida com o CPF"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-sky-400 mt-1">
                  ✓ Por padrão da empresa, a senha de login do funcionário é o próprio CPF cadastrado.
                </p>
              </div>

              {/* SEÇÃO DE BIOMETRIA FACIAL ON-DEVICE */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Cadastrar Facial do Funcionário</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                    LGPD Compliant
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  O sistema extrai um vetor matemático de 192 dimensões (MobileFaceNet). Nenhuma foto é armazenada.
                </p>

                {facialStep === 'idle' && (
                  <button
                    type="button"
                    onClick={handleTriggerFacialScan}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700/80 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Iniciar Captura Facial (Webcam / Foto)</span>
                  </button>
                )}

                {facialStep === 'scanning' && (
                  <div className="py-4 px-3 bg-sky-950/40 border border-sky-500/30 rounded-xl flex items-center justify-center gap-3 text-sky-300 text-xs">
                    <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    <span>Detectando rosto e gerando vetor biométrico 192-d...</span>
                  </div>
                )}

                {facialStep === 'done' && (
                  <div className="py-3 px-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Biometria Facial Cadastrada (192 floats)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFacialStep('idle')}
                      className="text-[11px] text-slate-400 hover:text-white underline"
                    >
                      Refazer
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20"
                >
                  Cadastrar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
