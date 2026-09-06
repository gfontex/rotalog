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
  Activity,
  ArrowUpRight,
  Filter,
  Download,
  Gauge,
  Check,
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
  lastClocking?: string;
  totalWorkHoursWeek: number;
}

interface ChecklistItem {
  id: string;
  vehiclePlate: string;
  driverName: string;
  type: 'ENTRY' | 'EXIT';
  mileage: number;
  hasProblem: boolean;
  observations: string;
  date: string;
  distanceDeltaKm?: number;
  items: { [key: string]: boolean };
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'usages' | 'employees' | 'checklists' | 'timeclock'>('overview');
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'FLEET_MANAGER' | 'HR' | 'DRIVER'>('ADMIN');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Modais
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  // Dados de veículos com métricas de horas de uso (Fase 2)
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      plate: 'BRA2E19',
      brand: 'Fiat',
      model: 'Strada Freedom 1.3',
      year: 2023,
      status: 'AVAILABLE',
      currentMileage: 35400,
      branch: 'Matriz São Paulo',
      totalHoursUsed: 142.5,
      totalTrips: 48,
    },
    {
      id: '2',
      plate: 'RTL9A88',
      brand: 'Volkswagen',
      model: 'Gol 1.0 MPI',
      year: 2022,
      status: 'IN_USE',
      currentMileage: 58120,
      branch: 'Matriz São Paulo',
      totalHoursUsed: 218.0,
      totalTrips: 76,
    },
    {
      id: '3',
      plate: 'LOG4F33',
      brand: 'Chevrolet',
      model: 'Onix Plus Premier',
      year: 2024,
      status: 'MAINTENANCE',
      currentMileage: 12800,
      branch: 'Matriz São Paulo',
      totalHoursUsed: 86.2,
      totalTrips: 29,
    },
  ]);

  // Colaboradores
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: 'Administrador do Sistema',
      cpf: '000.111.222-33',
      email: 'admin@rotalog.com',
      role: 'ADMIN',
      branch: 'Matriz São Paulo',
      isActive: true,
      biometricEnrolled: true,
      lastClocking: '08:00 (Entrada)',
      totalWorkHoursWeek: 40.0,
    },
    {
      id: '2',
      name: 'Carlos Oliveira',
      cpf: '111.222.333-44',
      email: 'gestor@rotalog.com',
      role: 'FLEET_MANAGER',
      branch: 'Matriz São Paulo',
      isActive: true,
      biometricEnrolled: true,
      lastClocking: '08:15 (Entrada)',
      totalWorkHoursWeek: 42.5,
    },
    {
      id: '3',
      name: 'Mariana Santos',
      cpf: '222.333.444-55',
      email: 'rh@rotalog.com',
      role: 'HR',
      branch: 'Matriz São Paulo',
      isActive: true,
      biometricEnrolled: true,
      lastClocking: '08:30 (Entrada)',
      totalWorkHoursWeek: 39.0,
    },
    {
      id: '4',
      name: 'João da Silva',
      cpf: '333.444.555-66',
      email: 'motorista@rotalog.com',
      role: 'DRIVER',
      branch: 'Matriz São Paulo',
      isActive: true,
      biometricEnrolled: true,
      lastClocking: '07:45 (Entrada)',
      totalWorkHoursWeek: 44.0,
    },
  ]);

  // Checklists com distâncias calculadas da Fase 2
  const [checklists] = useState<ChecklistItem[]>([
    {
      id: 'c1',
      vehiclePlate: 'RTL9A88',
      driverName: 'João da Silva',
      type: 'ENTRY',
      mileage: 58040,
      hasProblem: false,
      observations: 'Veículo em perfeito estado para rota matutina.',
      date: 'Hoje, 07:50',
      items: { combustivel: true, pneus: true, documentacao: true, avarias: true, limpeza: true, iluminacao: true },
    },
    {
      id: 'c2',
      vehiclePlate: 'LOG4F33',
      driverName: 'Carlos Oliveira',
      type: 'EXIT',
      mileage: 12800,
      distanceDeltaKm: 85,
      hasProblem: true,
      observations: 'Farol dianteiro direito queimado. Enviado para manutenção.',
      date: 'Ontem, 18:20',
      items: { combustivel: true, pneus: true, documentacao: true, avarias: true, limpeza: true, iluminacao: false },
    },
    {
      id: 'c3',
      vehiclePlate: 'BRA2E19',
      driverName: 'João da Silva',
      type: 'EXIT',
      mileage: 35400,
      distanceDeltaKm: 120,
      hasProblem: false,
      observations: 'Rota concluída sem intercorrências.',
      date: 'Anteontem, 17:30',
      items: { combustivel: true, pneus: true, documentacao: true, avarias: true, limpeza: true, iluminacao: true },
    },
  ]);

  // Formulário Novo Veículo
  const [newVehicle, setNewVehicle] = useState({
    plate: '',
    brand: '',
    model: '',
    year: 2024,
    currentMileage: 0,
    status: 'AVAILABLE' as 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE',
  });

  // Formulário Novo Colaborador
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    cpf: '',
    email: '',
    role: 'DRIVER' as 'ADMIN' | 'FLEET_MANAGER' | 'HR' | 'DRIVER',
    password: '',
  });

  // Totais consolidados de uso veicular (Fase 2)
  const totalFleetHours = vehicles.reduce((acc, v) => acc + v.totalHoursUsed, 0);
  const totalFleetTrips = vehicles.reduce((acc, v) => acc + v.totalTrips, 0);

  // Exportar relatório
  const handleExport = (type: 'EXCEL' | 'PDF') => {
    setExportNotification(`Relatório consolidado de horas e uso da frota gerado em ${type}! Download iniciado.`);
    setTimeout(() => setExportNotification(null), 4000);
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.plate || !newVehicle.brand || !newVehicle.model) return;

    const created: Vehicle = {
      id: String(Date.now()),
      plate: newVehicle.plate.toUpperCase(),
      brand: newVehicle.brand,
      model: newVehicle.model,
      year: Number(newVehicle.year),
      currentMileage: Number(newVehicle.currentMileage),
      status: newVehicle.status,
      branch: 'Matriz São Paulo',
      totalHoursUsed: 0,
      totalTrips: 0,
    };

    setVehicles([created, ...vehicles]);
    setNewVehicle({ plate: '', brand: '', model: '', year: 2024, currentMileage: 0, status: 'AVAILABLE' });
    setIsVehicleModalOpen(false);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.cpf || !newEmployee.email) return;

    const created: Employee = {
      id: String(Date.now()),
      name: newEmployee.name,
      cpf: newEmployee.cpf,
      email: newEmployee.email,
      role: newEmployee.role,
      branch: 'Matriz São Paulo',
      isActive: true,
      biometricEnrolled: false,
      lastClocking: 'Não registrado',
      totalWorkHoursWeek: 0,
    };

    setEmployees([...employees, created]);
    setNewEmployee({ name: '', cpf: '', email: '', role: 'DRIVER', password: '' });
    setIsEmployeeModalOpen(false);
  };

  const toggleVehicleStatus = (id: string, status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE') => {
    setVehicles(vehicles.map((v) => (v.id === id ? { ...v, status } : v)));
  };

  const toggleEmployeeActive = (id: string) => {
    setEmployees(employees.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e)));
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.cpf.includes(searchQuery) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* SIDEBAR CORPORATIVO */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30 text-white">
            R
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">ROTALOG</h1>
            <span className="text-xs text-blue-400 font-medium tracking-wide uppercase">Controle de Frota</span>
          </div>
        </div>

        {/* Perfil & RBAC Switcher */}
        <div className="mb-6 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Perfil Conectado (RBAC)
          </label>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold px-2.5 py-1.5 text-blue-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ADMIN">ADMIN (Controle Total)</option>
            <option value="FLEET_MANAGER">GESTOR DE FROTA</option>
            <option value="HR">RECURSOS HUMANOS (RH)</option>
            <option value="DRIVER">MOTORISTA (App/Campo)</option>
          </select>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <TrendingUp size={18} />
            Visão Geral
          </button>

          {(currentRole === 'ADMIN' || currentRole === 'FLEET_MANAGER') && (
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'vehicles'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Car size={18} />
              Gestão de Veículos
            </button>
          )}

          {(currentRole === 'ADMIN' || currentRole === 'FLEET_MANAGER') && (
            <button
              onClick={() => setActiveTab('usages')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'usages'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Gauge size={18} />
              Controle de Horas / Uso
            </button>
          )}

          {(currentRole === 'ADMIN' || currentRole === 'HR') && (
            <button
              onClick={() => setActiveTab('employees')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Users size={18} />
              Colaboradores
            </button>
          )}

          <button
            onClick={() => setActiveTab('checklists')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'checklists'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <ShieldCheck size={18} />
            Checklists Veiculares
          </button>

          {(currentRole === 'ADMIN' || currentRole === 'HR') && (
            <button
              onClick={() => setActiveTab('timeclock')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'timeclock'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Clock size={18} />
              Ponto & Jornada (CLT)
            </button>
          )}
        </nav>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
          <p className="font-medium text-slate-400">ROTALOG SaaS v1.0</p>
          <p className="mt-0.5">Empresa Piloto Transporte</p>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {activeTab === 'overview' && 'Visão Geral da Frota e Operação'}
            {activeTab === 'vehicles' && 'Controle e Manutenção de Veículos'}
            {activeTab === 'usages' && 'Controle de Horas de Uso por Veículo'}
            {activeTab === 'employees' && 'Gestão de Colaboradores e Biometria LGPD'}
            {activeTab === 'checklists' && 'Inspeções e Checklists de Entrada/Saída'}
            {activeTab === 'timeclock' && 'Controle de Ponto Facial e Jornada CLT'}
          </h2>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Backend NestJS Online (Porta 3001)
            </span>
          </div>
        </header>

        {/* Notificação de Exportação */}
        {exportNotification && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            {exportNotification}
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* TAB: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total de Veículos</span>
                    <Car size={20} className="text-blue-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{vehicles.length}</span>
                    <span className="text-xs text-slate-400">veículos cadastrados</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Piloto inicial com 3 unidades</div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Horas de Operação</span>
                    <Clock size={20} className="text-emerald-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-emerald-400">{totalFleetHours.toFixed(1)}h</span>
                    <span className="text-xs text-slate-400">acumuladas</span>
                  </div>
                  <div className="mt-2 text-xs text-emerald-500/80">{totalFleetTrips} viagens finalizadas</div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Em Manutenção</span>
                    <AlertTriangle size={20} className="text-amber-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-amber-400">
                      {vehicles.filter((v) => v.status === 'MAINTENANCE').length}
                    </span>
                    <span className="text-xs text-slate-400">em reparo técnico</span>
                  </div>
                  <div className="mt-2 text-xs text-amber-500/80">Bloqueio preventivo automático</div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Colaboradores</span>
                    <Users size={20} className="text-purple-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{employees.length}</span>
                    <span className="text-xs text-slate-400">ativos na base</span>
                  </div>
                  <div className="mt-2 text-xs text-purple-400/80">Consentimento LGPD ativo</div>
                </div>
              </div>

              {/* Status da Frota e Alertas Recentes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Status da Frota em Tempo Real</h3>
                    <button
                      onClick={() => setActiveTab('vehicles')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      Gerenciar frota <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {vehicles.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3.5 bg-slate-800/50 rounded-xl border border-slate-800 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-slate-800 rounded-lg text-slate-300">
                            <Car size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{v.plate}</span>
                              <span className="text-xs text-slate-400">
                                {v.brand} {v.model} ({v.year})
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {v.currentMileage.toLocaleString('pt-BR')} km rodados • {v.totalHoursUsed}h de uso acumulado
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            v.status === 'AVAILABLE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : v.status === 'IN_USE'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {v.status === 'AVAILABLE' && 'Disponível'}
                          {v.status === 'IN_USE' && 'Em Operação'}
                          {v.status === 'MAINTENANCE' && 'Manutenção'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alertas Automáticos */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Alertas Operacionais</h3>
                    <AlertTriangle size={18} className="text-amber-400" />
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                        <AlertTriangle size={14} />
                        Avaria em Checklist de Saída
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Veículo <strong>LOG4F33</strong> teve problema de iluminação. Direcionado automaticamente para manutenção.
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-2">Ontem, 18:20 • Status atualizado no banco</span>
                    </div>

                    <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                        <ShieldCheck size={14} />
                        Sincronização Offline Ativa
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Fila offline operando para motoristas em áreas de sombra de sinal celular.
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-2">Tecnologia Offline-First testada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTROLE DE HORAS / USO (FASE 2) */}
          {activeTab === 'usages' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Horas de Uso e Quilometragem por Veículo</h3>
                  <p className="text-xs text-slate-400">Cálculo automatizado a partir dos checklists de entrada e saída</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport('EXCEL')}
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-400" />
                    Exportar Excel
                  </button>
                  <button
                    onClick={() => handleExport('PDF')}
                    className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition shadow-md shadow-blue-600/20"
                  >
                    <FileText size={15} />
                    Exportar PDF
                  </button>
                </div>
              </div>

              {/* Tabela de Uso da Frota */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Veículo</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Total de Horas</th>
                      <th className="px-6 py-4">Viagens Concluídas</th>
                      <th className="px-6 py-4">Odômetro Atual</th>
                      <th className="px-6 py-4 text-right">Média Diária</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4">
                          <span className="font-bold text-white block">{v.plate}</span>
                          <span className="text-xs text-slate-400">
                            {v.brand} {v.model}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              v.status === 'AVAILABLE'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : v.status === 'IN_USE'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {v.status === 'AVAILABLE' && 'Disponível'}
                            {v.status === 'IN_USE' && 'Em Rota'}
                            {v.status === 'MAINTENANCE' && 'Manutenção'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-emerald-400">{v.totalHoursUsed} horas</td>
                        <td className="px-6 py-4 text-slate-300">{v.totalTrips} rotas</td>
                        <td className="px-6 py-4">{v.currentMileage.toLocaleString('pt-BR')} km</td>
                        <td className="px-6 py-4 text-right font-medium text-slate-400">
                          {(v.totalHoursUsed / 30).toFixed(1)} h/dia
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: VEÍCULOS */}
          {activeTab === 'vehicles' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por placa, modelo ou marca..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-md shadow-blue-600/20"
                >
                  <Plus size={16} />
                  Cadastrar Veículo
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Placa</th>
                      <th className="px-6 py-4">Veículo</th>
                      <th className="px-6 py-4">Ano</th>
                      <th className="px-6 py-4">Quilometragem</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredVehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4 font-bold text-white tracking-wider">{v.plate}</td>
                        <td className="px-6 py-4 font-medium text-slate-200">
                          {v.brand} {v.model}
                        </td>
                        <td className="px-6 py-4 text-slate-400">{v.year}</td>
                        <td className="px-6 py-4">{v.currentMileage.toLocaleString('pt-BR')} km</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              v.status === 'AVAILABLE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : v.status === 'IN_USE'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {v.status === 'AVAILABLE' && 'Disponível'}
                          {v.status === 'IN_USE' && 'Em Uso'}
                          {v.status === 'MAINTENANCE' && 'Manutenção'}
                        </span>
                      </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleVehicleStatus(v.id, 'AVAILABLE')}
                              className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg text-slate-400 transition"
                            >
                              Liberar
                            </button>
                            <button
                              onClick={() => toggleVehicleStatus(v.id, 'MAINTENANCE')}
                              className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 rounded-lg text-slate-400 transition"
                            >
                              Oficina
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CHECKLISTS */}
          {activeTab === 'checklists' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Inspeções Recentes de Veículos (Checklists)</h3>
                  <span className="text-xs text-slate-400">Integrado fim a fim com a frota</span>
                </div>

                <div className="space-y-4">
                  {checklists.map((c) => (
                    <div key={c.id} className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white text-base tracking-wide">{c.vehiclePlate}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              c.type === 'ENTRY' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                            }`}
                          >
                            {c.type === 'ENTRY' ? 'Checklist de Entrada' : 'Checklist de Saída'}
                          </span>
                          {c.distanceDeltaKm && (
                            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                              +{c.distanceDeltaKm} km rodados
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{c.date} • Motorista: {c.driverName}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-3 text-xs">
                        {Object.entries(c.items).map(([key, ok]) => (
                          <div
                            key={key}
                            className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                              ok
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/5 border-red-500/20 text-red-400'
                            }`}
                          >
                            {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                            <span className="capitalize">{key}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <strong className="text-slate-400">Observações: </strong> {c.observations}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: COLABORADORES */}
          {activeTab === 'employees' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CPF ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => setIsEmployeeModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-md shadow-blue-600/20"
                >
                  <Plus size={16} />
                  Cadastrar Colaborador
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Colaborador</th>
                      <th className="px-6 py-4">CPF</th>
                      <th className="px-6 py-4">Função (RBAC)</th>
                      <th className="px-6 py-4">Biometria (LGPD)</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredEmployees.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-semibold text-white block">{e.name}</span>
                            <span className="text-xs text-slate-400">{e.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{e.cpf}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-blue-400 border border-slate-700">
                            {e.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {e.biometricEnrolled ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                              <CheckCircle2 size={14} /> Vetor Cadastrado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
                              <AlertTriangle size={14} /> Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              e.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {e.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleEmployeeActive(e.id)}
                            className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          >
                            {e.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PONTO & JORNADA */}
          {activeTab === 'timeclock' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white">Espelho de Ponto Facial & Compliance CLT</h3>
                    <p className="text-xs text-slate-400">Batidas validadas via ML Kit + TFLite On-Device</p>
                  </div>
                  <button
                    onClick={() => handleExport('EXCEL')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 transition"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-400" />
                    Exportar Relatório (Excel / PDF)
                  </button>
                </div>

                <div className="space-y-3">
                  {employees.map((e) => (
                    <div key={e.id} className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-sm text-white block">{e.name}</span>
                        <span className="text-xs text-slate-400">CPF: {e.cpf} • Função: {e.role}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <span className="text-slate-400 block text-[11px]">Última Batida</span>
                          <span className="font-semibold text-emerald-400">{e.lastClocking}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Face Match: 98.6%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAIS */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Cadastrar Novo Veículo</h3>
            <form onSubmit={handleAddVehicle} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Placa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: BRA2E19"
                  value={newVehicle.plate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fiat"
                    value={newVehicle.brand}
                    onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Modelo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Strada"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ano</label>
                  <input
                    type="number"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Km Inicial</label>
                  <input
                    type="number"
                    value={newVehicle.currentMileage}
                    onChange={(e) => setNewVehicle({ ...newVehicle, currentMileage: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shadow-md shadow-blue-600/20"
                >
                  Salvar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Cadastrar Colaborador</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Marcos Souza"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CPF</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={newEmployee.cpf}
                    onChange={(e) => setNewEmployee({ ...newEmployee, cpf: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Função (RBAC)</label>
                  <select
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="DRIVER">Motorista</option>
                    <option value="FLEET_MANAGER">Gestor de Frota</option>
                    <option value="HR">Recursos Humanos (RH)</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  placeholder="nome@rotalog.com"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shadow-md shadow-blue-600/20"
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
