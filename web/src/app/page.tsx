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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'vehicles' | 'employees' | 'checklists' | 'timeclock'>('reports');
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'FLEET_MANAGER' | 'HR' | 'DRIVER'>('ADMIN');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Modais
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  // Veículos da frota
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
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
    {
      id: '2',
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
      name: 'João Silva',
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

  // RELATÓRIO CONSOLIDADO COMPLETO (Explicado no áudio)
  const [usageReports] = useState<FleetUsageReportItem[]>([
    {
      id: 'r1',
      driverName: 'João Silva',
      driverCpf: '333.444.555-66',
      facialVerified: true,
      vehiclePlate: 'RTL9A88',
      vehicleModel: 'Volkswagen Gol 1.0 MPI',
      startTime: '08:00',
      endTime: '17:30',
      totalDurationHours: 9.5,
      lunchStart: '12:00',
      lunchEnd: '13:00',
      lunchDurationMinutes: 60,
      netDrivingHours: 8.5,
      startMileage: 58040,
      endMileage: 58160,
      distanceKm: 120,
      checklistStatus: 'OK',
      observation: 'Veículo entregue limpo e abastecido na base.',
      date: '06/09/2026',
    },
    {
      id: 'r2',
      driverName: 'Carlos Oliveira',
      driverCpf: '111.222.333-44',
      facialVerified: true,
      vehiclePlate: 'LOG4F33',
      vehicleModel: 'Chevrolet Onix Plus Premier',
      startTime: '09:15',
      endTime: '18:15',
      totalDurationHours: 9.0,
      lunchStart: '12:30',
      lunchEnd: '13:15',
      lunchDurationMinutes: 45,
      netDrivingHours: 8.25,
      startMileage: 12715,
      endMileage: 12800,
      distanceKm: 85,
      checklistStatus: 'AVARIA',
      observation: 'Farol direito queimado. Bloqueado preventivamente para manutenção.',
      date: '05/09/2026',
    },
    {
      id: 'r3',
      driverName: 'João Silva',
      driverCpf: '333.444.555-66',
      facialVerified: true,
      vehiclePlate: 'BRA2E19',
      vehicleModel: 'Fiat Strada Freedom 1.3',
      startTime: '13:00',
      endTime: '17:40',
      totalDurationHours: 4.67,
      lunchStart: '-',
      lunchEnd: '-',
      lunchDurationMinutes: 0,
      netDrivingHours: 4.67,
      startMileage: 35260,
      endMileage: 35400,
      distanceKm: 140,
      checklistStatus: 'OK',
      observation: 'Rota curta direta (sem intervalo de almoço).',
      date: '04/09/2026',
    },
  ]);

  // Download real do arquivo CSV para Excel
  const handleDownloadExcel = () => {
    const headers = [
      'Data',
      'Motorista',
      'CPF',
      'Validacao Facial',
      'Placa',
      'Modelo',
      'Saida',
      'Retorno',
      'Tempo Total (h)',
      'Inicio Almoco',
      'Fim Almoco',
      'Pausa Almoco (min)',
      'Horas Liquidas Direcao',
      'Km Inicial',
      'Km Final',
      'Km Percorrido',
      'Vistoria',
      'Observacoes',
    ];

    const rows = usageReports.map((r) => [
      r.date,
      `"${r.driverName}"`,
      r.driverCpf,
      r.facialVerified ? 'SIM (100% On-Device)' : 'NAO',
      r.vehiclePlate,
      `"${r.vehicleModel}"`,
      r.startTime,
      r.endTime,
      r.totalDurationHours.toFixed(2),
      r.lunchStart,
      r.lunchEnd,
      r.lunchDurationMinutes,
      r.netDrivingHours.toFixed(2),
      r.startMileage,
      r.endMileage,
      r.distanceKm,
      r.checklistStatus,
      `"${r.observation || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ROTALOG_Relatorio_Consolidado_Frota_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotification('Relatório oficial exportado com sucesso! Arquivo CSV/Excel baixado.');
    setTimeout(() => setExportNotification(null), 5000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const filteredReports = usageReports.filter(
    (r) =>
      r.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()),
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
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet size={18} />
            Relatório Consolidado
          </button>

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
            {activeTab === 'reports' && 'Relatório Oficial de Utilização da Frota'}
            {activeTab === 'overview' && 'Visão Geral da Frota e Operação'}
            {activeTab === 'vehicles' && 'Controle e Manutenção de Veículos'}
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

        {/* Notificação de Download */}
        {exportNotification && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            {exportNotification}
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* TAB: RELATÓRIO CONSOLIDADO COMPLETO (O ponto central explicado no áudio) */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Barra de Filtros e Ações de Exportação */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por motorista, placa ou modelo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20"
                  >
                    <FileSpreadsheet size={15} />
                    Exportar Excel (.csv)
                  </button>
                  <button
                    onClick={handlePrintPdf}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20"
                  >
                    <FileText size={15} />
                    Exportar PDF / Imprimir
                  </button>
                </div>
              </div>

              {/* Tabela do Relatório Consolidado */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Relatório de Utilização, Almoço e Checklists
                    </h3>
                    <p className="text-xs text-slate-400">
                      Consolidação com validação facial on-device, horário de entrada/saída, intervalo e odômetro
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
                    {filteredReports.length} registros no período
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 uppercase font-semibold text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3.5">Data</th>
                        <th className="px-4 py-3.5">Motorista</th>
                        <th className="px-4 py-3.5">Veículo (Placa / Modelo)</th>
                        <th className="px-4 py-3.5">Horário da Rota</th>
                        <th className="px-4 py-3.5">Intervalo Almoço</th>
                        <th className="px-4 py-3.5">Horas de Direção</th>
                        <th className="px-4 py-3.5">Quilometragem (Km)</th>
                        <th className="px-4 py-3.5">Checklist / Vistoria</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredReports.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3.5 font-medium text-slate-200">{item.date}</td>
                          <td className="px-4 py-3.5">
                            <div>
                              <span className="font-bold text-white block">{item.driverName}</span>
                              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={11} /> Facial On-Device Confirmada
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div>
                              <span className="font-bold text-white tracking-wide block">{item.vehiclePlate}</span>
                              <span className="text-slate-400">{item.vehicleModel}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div>
                              <span className="text-white font-medium block">
                                {item.startTime} às {item.endTime}
                              </span>
                              <span className="text-[10px] text-slate-400">Total: {item.totalDurationHours}h</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {item.lunchDurationMinutes > 0 ? (
                              <div>
                                <span className="text-amber-300 font-medium flex items-center gap-1">
                                  <Coffee size={12} /> {item.lunchStart} - {item.lunchEnd}
                                </span>
                                <span className="text-[10px] text-slate-400">({item.lunchDurationMinutes} min)</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Sem pausa de almoço</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-emerald-400 text-sm">{item.netDrivingHours.toFixed(2)}h</span>
                            <span className="text-[10px] text-slate-500 block">horas líquidas</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div>
                              <span className="font-bold text-white block">+{item.distanceKm} km</span>
                              <span className="text-[10px] text-slate-400">
                                {item.startMileage} → {item.endMileage}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {item.checklistStatus === 'OK' ? (
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                100% Liberado
                              </span>
                            ) : (
                              <div>
                                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Avaria Reportada
                                </span>
                                <span className="text-[10px] text-amber-400/80 block mt-1">Oficina</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

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
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Horas em Operação</span>
                    <Clock size={20} className="text-emerald-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-emerald-400">453.2h</span>
                    <span className="text-xs text-slate-400">acumuladas</span>
                  </div>
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
                    <span className="text-xs text-slate-400">em oficina</span>
                  </div>
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
                </div>
              </div>

              {/* Status dos Carros */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                <h3 className="font-semibold text-white mb-4">Status da Frota</h3>
                <div className="space-y-3">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-3.5 bg-slate-800/50 rounded-xl border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-800 rounded-lg text-slate-300">
                          <Car size={20} />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-white">{v.plate}</span>
                          <span className="text-xs text-slate-400 block">
                            {v.brand} {v.model} ({v.year}) • {v.currentMileage.toLocaleString('pt-BR')} km
                          </span>
                        </div>
                      </div>
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
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: VEÍCULOS */}
          {activeTab === 'vehicles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Veículos da Frota</h3>
                <button
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition"
                >
                  <Plus size={16} /> Cadastrar Veículo
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4 font-bold text-white">{v.plate}</td>
                        <td className="px-6 py-4">{v.brand} {v.model}</td>
                        <td className="px-6 py-4 text-slate-400">{v.year}</td>
                        <td className="px-6 py-4">{v.currentMileage.toLocaleString('pt-BR')} km</td>
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
                            {v.status === 'IN_USE' && 'Em Uso'}
                            {v.status === 'MAINTENANCE' && 'Manutenção'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: COLABORADORES */}
          {activeTab === 'employees' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Colaboradores da Empresa</h3>
                <button
                  onClick={() => setIsEmployeeModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition"
                >
                  <Plus size={16} /> Cadastrar Colaborador
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Nome</th>
                      <th className="px-6 py-4">CPF</th>
                      <th className="px-6 py-4">Função</th>
                      <th className="px-6 py-4">Biometria (LGPD)</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {employees.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4 font-semibold text-white">{e.name}</td>
                        <td className="px-6 py-4 text-slate-400">{e.cpf}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 text-xs font-semibold">
                            {e.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-emerald-400 text-xs font-medium">✓ Vetor Cadastrado</td>
                        <td className="px-6 py-4 text-emerald-400 text-xs font-semibold">Ativo</td>
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
                <h3 className="font-semibold text-white mb-4">Inspeções Recentes</h3>
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">RTL9A88 • Entrada</span>
                      <span className="text-xs text-slate-400 block mt-0.5">Motorista: João Silva • Odômetro: 58.040 km</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-semibold">
                      Tudo OK
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">LOG4F33 • Saída</span>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        Motorista: Carlos Oliveira • Odômetro: 12.800 km (+85 km)
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full font-semibold">
                      Avaria Reportada (Oficina)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PONTO CLT */}
          {activeTab === 'timeclock' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                <h3 className="font-semibold text-white mb-4">Espelho de Ponto Facial (CLT)</h3>
                <div className="space-y-3">
                  {employees.map((e) => (
                    <div
                      key={e.id}
                      className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-white">{e.name}</span>
                        <span className="text-xs text-slate-400 block">{e.role} • CPF: {e.cpf}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                        Face Match: 98.8%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL VEICULO */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Cadastrar Veículo</h3>
            <button
              onClick={() => setIsVehicleModalOpen(false)}
              className="mt-4 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL COLABORADOR */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Cadastrar Colaborador</h3>
            <button
              onClick={() => setIsEmployeeModalOpen(false)}
              className="mt-4 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
