import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { UserProfile } from './src/types';
import { offlineQueue } from './src/services/offlineQueue';

interface FleetVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  currentMileage: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  currentDriver?: string | null;
}

interface RegisteredEmployee {
  id: string;
  name: string;
  cpf: string;
  role: 'ADMIN' | 'DRIVER' | 'FLEET_MANAGER' | 'HR';
}

interface TimeClockEntry {
  id: string;
  type: 'ENTRADA' | 'ALMOCO_SAIDA' | 'ALMOCO_RETORNO' | 'SAIDA';
  label: string;
  time: string;
  date: string;
  userName: string;
}

export default function App() {
  // ==========================================
  // ESTADO DE AUTENTICAÇÃO
  // ==========================================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginCompany, setLoginCompany] = useState('MKSEGURANCA');
  const [loginCpf, setLoginCpf] = useState('33344455566');
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'u1',
    name: 'Joãozinho Silva',
    cpf: '333.444.555-66',
    email: 'joaozinho@mkseguranca.com.br',
    role: 'DRIVER',
    tenantId: 'mk-seguranca',
    branchName: 'Base MKSEGURANCA',
    biometricEnrolled: false,
  });

  // Conectividade e Fila Offline
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);

  // Aba selecionada no App
  const [currentTab, setCurrentTab] = useState<'ROUTE' | 'TIMECLOCK' | 'EMPLOYEES'>('ROUTE');

  // Relógio Digital em tempo real para o Ponto
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  // Veículos da Base MKSEGURANCA
  const [availableVehicles, setAvailableVehicles] = useState<FleetVehicle[]>([
    {
      id: 'v1',
      plate: 'MKS2B02',
      brand: 'Fiat',
      model: 'Strada Freedom 1.3',
      currentMileage: 18900,
      status: 'AVAILABLE',
      currentDriver: null,
    },
    {
      id: 'v2',
      plate: 'MKF1A01',
      brand: 'Renault',
      model: 'Kangoo 1.6 Maxi',
      currentMileage: 32400,
      status: 'AVAILABLE',
      currentDriver: null,
    },
    {
      id: 'v3',
      plate: 'MKG3C03',
      brand: 'Volkswagen',
      model: 'Gol 1.0 City',
      currentMileage: 49200,
      status: 'MAINTENANCE',
      currentDriver: null,
    },
  ]);

  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);

  // Sessão de rota ativa
  const [activeRoute, setActiveRoute] = useState<{
    inProgress: boolean;
    vehicleId: string;
    vehiclePlate: string;
    vehicleModel: string;
    startMileage: number;
    startTime: string;
    elapsedMinutes: number;
    isOnLunch: boolean;
    lunchStartTime: string | null;
    totalLunchMinutes: number;
  }>({
    inProgress: false,
    vehicleId: '',
    vehiclePlate: '',
    vehicleModel: '',
    startMileage: 0,
    startTime: '',
    elapsedMinutes: 0,
    isOnLunch: false,
    lunchStartTime: null,
    totalLunchMinutes: 0,
  });

  // Modais de Operação
  const [isVehicleSelectModalOpen, setIsVehicleSelectModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistType, setChecklistType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [checklistItems, setChecklistItems] = useState<{ [key: string]: boolean }>({
    combustivel: true,
    pneus: true,
    documentacao: true,
    avarias: true,
    limpeza: true,
    iluminacao: true,
  });
  const [checklistObs, setChecklistObs] = useState('');
  const [checklistMileage, setChecklistMileage] = useState('');

  // Histórico de saídas do dia
  const [recentTrips, setRecentTrips] = useState<
    Array<{
      plate: string;
      model: string;
      startTime: string;
      endTime: string;
      duration: string;
      lunchDuration: string;
      kmDriven: number;
    }>
  >([]);

  // Cadastro de Colaboradores (Sem Biometria)
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredEmployee[]>([
    {
      id: 'u-admin',
      name: 'Administrador Master',
      cpf: '139.932.487-08',
      role: 'ADMIN',
    },
    {
      id: 'u1',
      name: 'Joãozinho Silva',
      cpf: '333.444.555-66',
      role: 'DRIVER',
    },
    {
      id: 'u2',
      name: 'Carlos Oliveira',
      cpf: '111.222.333-44',
      role: 'FLEET_MANAGER',
    },
    {
      id: 'u3',
      name: 'Mariana Santos',
      cpf: '222.333.444-55',
      role: 'HR',
    },
    {
      id: 'u4',
      name: 'Marcos Souza',
      cpf: '444.555.666-77',
      role: 'DRIVER',
    },
  ]);

  // Form de Cadastro de Novo Usuário (ADM)
  const [newUserName, setNewUserName] = useState('');
  const [newUserCpf, setNewUserCpf] = useState('');
  const [newUserRole, setNewUserRole] = useState<'DRIVER' | 'FLEET_MANAGER' | 'HR' | 'ADMIN'>('DRIVER');

  // Histórico de Batidas de Ponto CLT
  const [timeClockRecords, setTimeClockRecords] = useState<TimeClockEntry[]>([
    {
      id: 'tc-1',
      type: 'ENTRADA',
      label: 'Entrada Turno Manhã',
      time: '08:00:12',
      date: new Date().toLocaleDateString('pt-BR'),
      userName: 'Joãozinho Silva',
    },
  ]);

  // Fila Offline
  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe(() => {
      setPendingQueueCount(offlineQueue.getPendingCount());
    });
    return () => unsubscribe();
  }, []);

  // Relógio Digital
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('pt-BR'));
      setCurrentDateStr(now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer de Rota Ativa
  useEffect(() => {
    let timer: any;
    if (activeRoute.inProgress && !activeRoute.isOnLunch) {
      timer = setInterval(() => {
        setActiveRoute((prev) => ({ ...prev, elapsedMinutes: prev.elapsedMinutes + 1 }));
      }, 60000);
    }
    return () => clearInterval(timer);
  }, [activeRoute.inProgress, activeRoute.isOnLunch]);

  // ==========================================
  // AUTENTICAÇÃO E LOGIN
  // ==========================================
  const handleLoginMobile = (overrideCpf?: string) => {
    const rawCpf = overrideCpf || loginCpf;
    const cleanPass = rawCpf.replace(/\D/g, '');

    const found = registeredUsers.find(
      (u) => u.cpf.replace(/\D/g, '') === cleanPass || u.cpf === rawCpf.trim()
    );

    if (found) {
      setCurrentUser({
        id: found.id,
        name: found.name,
        cpf: found.cpf,
        email: `${found.name.toLowerCase().replace(/\s+/g, '.')}@mkseguranca.com.br`,
        role: found.role,
        tenantId: 'mk-seguranca',
        branchName: 'Base MKSEGURANCA',
        biometricEnrolled: false,
      });
      setIsLoggedIn(true);
      Alert.alert(
        'Login Efetuado com Sucesso',
        `Bem-vindo(a), ${found.name}!\nCargo: ${
          found.role === 'ADMIN'
            ? 'Administrador Master'
            : found.role === 'DRIVER'
            ? 'Motorista Operacional'
            : found.role === 'FLEET_MANAGER'
            ? 'Gestor de Frota'
            : 'Recursos Humanos'
        }\nBase: MKSEGURANCA`
      );
    } else {
      Alert.alert(
        'Colaborador Não Encontrado',
        `Nenhum colaborador localizado com o CPF informado: ${cleanPass}.\nVerifique o número digitado ou utilize um dos perfis pré-cadastrados.`
      );
    }
  };

  const handleLogoutMobile = () => {
    setIsLoggedIn(false);
    setSelectedVehicle(null);
  };

  // ==========================================
  // FLUXO DE OPERAÇÃO E ROTA (100% DIRETO)
  // ==========================================
  const handleSelectVehicleForRoute = (v: FleetVehicle) => {
    if (v.status !== 'AVAILABLE') {
      Alert.alert('Veículo Indisponível', `O veículo ${v.plate} está em uso ou manutenção.`);
      return;
    }
    setSelectedVehicle(v);
    setIsVehicleSelectModalOpen(false);

    // FLUXO DIRETO: VAI DIRETO PARA O CHECKLIST DE SAÍDA (SEM CÂMERA NEM BIOMETRIA!)
    setChecklistType('ENTRY');
    setChecklistMileage(String(v.currentMileage));
    setChecklistItems({
      combustivel: true,
      pneus: true,
      documentacao: true,
      avarias: true,
      limpeza: true,
      iluminacao: true,
    });
    setChecklistObs('');
    setIsChecklistModalOpen(true);
  };

  const handleConfirmChecklist = () => {
    const mileageNum = parseInt(checklistMileage, 10);
    if (isNaN(mileageNum) || mileageNum <= 0) {
      Alert.alert('Odômetro Obrigatório', 'Por favor, informe a quilometragem atual do painel do veículo.');
      return;
    }

    const hasProblem = Object.values(checklistItems).some((val) => !val);
    setIsChecklistModalOpen(false);

    if (checklistType === 'ENTRY') {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      setActiveRoute({
        inProgress: true,
        vehicleId: selectedVehicle!.id,
        vehiclePlate: selectedVehicle!.plate,
        vehicleModel: `${selectedVehicle!.brand} ${selectedVehicle!.model}`,
        startMileage: mileageNum,
        startTime: timeStr,
        elapsedMinutes: 0,
        isOnLunch: false,
        lunchStartTime: null,
        totalLunchMinutes: 0,
      });

      setAvailableVehicles(
        availableVehicles.map((v) =>
          v.id === selectedVehicle!.id
            ? { ...v, status: 'IN_USE', currentMileage: mileageNum, currentDriver: currentUser.name }
            : v
        )
      );

      // Notificação oficial solicitada: "Iniciando rota com carro X"
      Alert.alert(
        'Iniciando rota',
        `Iniciando rota com carro ${selectedVehicle!.brand} ${selectedVehicle!.model} (Placa ${selectedVehicle!.plate}).`
      );
    } else {
      // Checklist de Saída / Fim de Rota
      const kmDriven = Math.max(0, mileageNum - activeRoute.startMileage);
      const now = new Date();
      const endTimeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      setRecentTrips([
        {
          plate: activeRoute.vehiclePlate,
          model: activeRoute.vehicleModel,
          startTime: activeRoute.startTime,
          endTime: endTimeStr,
          duration: `${Math.max(1, activeRoute.elapsedMinutes)} min`,
          lunchDuration:
            activeRoute.totalLunchMinutes > 0 ? `${activeRoute.totalLunchMinutes} min` : 'Sem intervalo',
          kmDriven,
        },
        ...recentTrips,
      ]);

      setAvailableVehicles(
        availableVehicles.map((v) =>
          v.id === activeRoute.vehicleId
            ? {
                ...v,
                status: hasProblem ? 'MAINTENANCE' : 'AVAILABLE',
                currentMileage: mileageNum,
                currentDriver: null,
              }
            : v
        )
      );

      setActiveRoute({
        inProgress: false,
        vehicleId: '',
        vehiclePlate: '',
        vehicleModel: '',
        startMileage: 0,
        startTime: '',
        elapsedMinutes: 0,
        isOnLunch: false,
        lunchStartTime: null,
        totalLunchMinutes: 0,
      });
      setSelectedVehicle(null);

      // Notificação oficial solicitada: "Rota finalizada, checklist finalizado"
      Alert.alert(
        'Rota Finalizada',
        hasProblem
          ? 'Rota finalizada, checklist finalizado (Avaria reportada, veículo direcionado à manutenção preventiva).'
          : 'Rota finalizada, checklist finalizado com sucesso.'
      );
    }
  };

  // Pausa para Almoço / Retomada
  const handleToggleLunch = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (!activeRoute.isOnLunch) {
      setActiveRoute({
        ...activeRoute,
        isOnLunch: true,
        lunchStartTime: timeStr,
      });
      Alert.alert('Intervalo de Almoço', 'Iniciando intervalo para almoço.');
    } else {
      const pauseDuration = 45;
      setActiveRoute({
        ...activeRoute,
        isOnLunch: false,
        totalLunchMinutes: activeRoute.totalLunchMinutes + pauseDuration,
      });
      Alert.alert('Intervalo de Almoço', 'Intervalo para almoço finalizado.');
    }
  };

  // ==========================================
  // PONTO ELETRÔNICO CLT (1 TOQUE DIRETO)
  // ==========================================
  const handleRegisterTimeClock = (type: 'ENTRADA' | 'ALMOCO_SAIDA' | 'ALMOCO_RETORNO' | 'SAIDA') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR');
    const dateStr = now.toLocaleDateString('pt-BR');

    const labels: Record<string, string> = {
      ENTRADA: 'Entrada no Turno',
      ALMOCO_SAIDA: 'Saída para Intervalo / Almoço',
      ALMOCO_RETORNO: 'Retorno do Almoço',
      SAIDA: 'Saída / Fim de Expediente',
    };

    const newRecord: TimeClockEntry = {
      id: `tc-${Date.now()}`,
      type,
      label: labels[type] || type,
      time: timeStr,
      date: dateStr,
      userName: currentUser.name,
    };

    setTimeClockRecords([newRecord, ...timeClockRecords]);

    Alert.alert(
      'Ponto Registrado!',
      `✓ Registro confirmado com sucesso!\n\nColaborador: ${currentUser.name}\nTipo: ${labels[type]}\nHorário: ${timeStr}\nData: ${dateStr}\nLocal: Base MKSEGURANCA`
    );
  };

  // ==========================================
  // CADASTRO DIRETO DE USUÁRIOS (ADM)
  // ==========================================
  const handleCreateEmployeeDirect = () => {
    if (!newUserName.trim() || !newUserCpf.trim()) {
      Alert.alert('Campos Obrigatórios', 'Por favor, informe o Nome Completo e o CPF do novo colaborador.');
      return;
    }

    const digits = newUserCpf.replace(/\D/g, '');
    const formattedCpf =
      digits.length === 11
        ? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
        : newUserCpf;

    const created: RegisteredEmployee = {
      id: `u-${Date.now()}`,
      name: newUserName.trim(),
      cpf: formattedCpf,
      role: newUserRole,
    };

    setRegisteredUsers([created, ...registeredUsers]);
    setNewUserName('');
    setNewUserCpf('');

    Alert.alert(
      'Colaborador Cadastrado!',
      `Nome: ${created.name}\nCPF / Senha de Acesso: ${created.cpf}\nCargo: ${
        created.role === 'ADMIN'
          ? 'Administrador Master'
          : created.role === 'DRIVER'
          ? 'Motorista Operacional'
          : created.role === 'FLEET_MANAGER'
          ? 'Gestor de Frota'
          : 'RH'
      }\n\nO colaborador já está cadastrado e pode fazer login imediatamente no aplicativo!`
    );
  };

  // ==========================================
  // TELA DE LOGIN DO APP MOBILE
  // ==========================================
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#06090e" />
        <View style={styles.loginCard}>
          <View style={styles.loginLogoBadge}>
            <Text style={styles.loginLogoText}>R</Text>
          </View>
          <Text style={styles.loginTitle}>ROTALOG</Text>
          <Text style={styles.loginSubtitle}>App de Frota, Checklist & Ponto CLT</Text>
          <View style={styles.directModeBadge}>
            <Text style={styles.directModeBadgeText}>⚡ MODO OPERACIONAL DIRETO (SEM BIOMETRIA)</Text>
          </View>

          <View style={styles.loginForm}>
            <Text style={styles.inputLabel}>Base / Empresa</Text>
            <TextInput
              style={styles.textInput}
              value={loginCompany}
              onChangeText={setLoginCompany}
              placeholder="MKSEGURANCA"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Senha (Seu CPF)</Text>
            <TextInput
              style={styles.textInput}
              value={loginCpf}
              onChangeText={setLoginCpf}
              placeholder="Digite seu CPF (ex: 33344455566)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.btnLoginSubmit} onPress={() => handleLoginMobile()}>
              <Text style={styles.btnLoginSubmitText}>Entrar no Aplicativo</Text>
            </TouchableOpacity>

            <View style={styles.quickAccessSection}>
              <Text style={styles.quickAccessTitle}>👥 ACESSO RÁPIDO — TOQUE PARA ENTRAR:</Text>
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                {registeredUsers.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={[
                      styles.btnQuickUserItem,
                      u.role === 'ADMIN' ? styles.btnQuickAdmin : styles.btnQuickDriver,
                    ]}
                    onPress={() => {
                      setLoginCompany('MKSEGURANCA');
                      setLoginCpf(u.cpf.replace(/\D/g, ''));
                      handleLoginMobile(u.cpf);
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.quickUserNameText}>{u.name}</Text>
                      <Text style={styles.quickUserRoleBadge}>
                        {u.role === 'ADMIN'
                          ? '👑 Master'
                          : u.role === 'DRIVER'
                          ? '🚗 Motorista'
                          : u.role === 'FLEET_MANAGER'
                          ? '🏢 Gestor'
                          : '📋 RH'}
                      </Text>
                    </View>
                    <Text style={styles.quickUserCpfText}>CPF: {u.cpf}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // TELA PRINCIPAL (LOGADO)
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* CABEÇALHO DO APLICATIVO */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.brandTitle}>ROTALOG</Text>
              <View style={styles.headerDirectTag}>
                <Text style={styles.headerDirectTagText}>Direto</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>
              {currentUser.name} • {currentUser.role === 'ADMIN' ? '👑 Master' : '🚗 Motorista'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btnLogout} onPress={handleLogoutMobile}>
          <Text style={styles.btnLogoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* ABAS SUPERIORES */}
      <View style={styles.mobileTabs}>
        <TouchableOpacity
          style={[styles.tabButton, currentTab === 'ROUTE' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('ROUTE')}
        >
          <Text style={[styles.tabButtonText, currentTab === 'ROUTE' && styles.tabButtonTextActive]}>
            🚗 Operação / Rota
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, currentTab === 'TIMECLOCK' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('TIMECLOCK')}
        >
          <Text style={[styles.tabButtonText, currentTab === 'TIMECLOCK' && styles.tabButtonTextActive]}>
            ⏱️ Bater Ponto
          </Text>
        </TouchableOpacity>

        {currentUser.role === 'ADMIN' && (
          <TouchableOpacity
            style={[styles.tabButton, currentTab === 'EMPLOYEES' && styles.tabButtonActive]}
            onPress={() => setCurrentTab('EMPLOYEES')}
          >
            <Text style={[styles.tabButtonText, currentTab === 'EMPLOYEES' && styles.tabButtonTextActive]}>
              👥 Usuários (ADM)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* ========================================================== */}
        {/* ABA 1: OPERAÇÃO / ROTA DO MOTORISTA                        */}
        {/* ========================================================== */}
        {currentTab === 'ROUTE' && (
          <>
            {/* PAINEL DE ROTA ATIVA */}
            {activeRoute.inProgress ? (
              <View style={styles.activeRouteCard}>
                <View style={styles.activeRouteHeader}>
                  <View>
                    <View
                      style={[
                        styles.activeRouteBadgeContainer,
                        activeRoute.isOnLunch ? styles.badgeAmberBg : styles.badgeGreenBg,
                      ]}
                    >
                      <Text style={styles.activeRouteBadge}>
                        {activeRoute.isOnLunch ? '☕ EM PAUSA DE ALMOÇO' : '🚗 EM ROTA ATIVA'}
                      </Text>
                    </View>
                    <Text style={styles.activeRouteVehicle}>{activeRoute.vehicleModel}</Text>
                    <Text style={styles.activeRoutePlate}>{activeRoute.vehiclePlate}</Text>
                    <Text style={styles.activeRouteKmStart}>
                      Odômetro de saída: {activeRoute.startMileage.toLocaleString('pt-BR')} km
                    </Text>
                  </View>
                  <View style={styles.activeRouteTimerBox}>
                    <Text style={styles.activeRouteTimerText}>{activeRoute.elapsedMinutes}m</Text>
                    <Text style={styles.activeRouteTimerLabel}>em trânsito</Text>
                    <Text style={styles.activeRouteStartTime}>Saída: {activeRoute.startTime}</Text>
                  </View>
                </View>

                <View style={styles.activeRouteActions}>
                  <TouchableOpacity
                    style={[styles.btnLunchPause, activeRoute.isOnLunch && styles.btnLunchActive]}
                    onPress={handleToggleLunch}
                  >
                    <Text style={styles.btnLunchText}>
                      {activeRoute.isOnLunch ? '🟢 Retomar Rota' : '☕ Pausar para Almoço'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnFinishRoute}
                    onPress={() => {
                      setChecklistType('EXIT');
                      setChecklistMileage(String(activeRoute.startMileage + 25));
                      setChecklistItems({
                        combustivel: true,
                        pneus: true,
                        documentacao: true,
                        avarias: true,
                        limpeza: true,
                        iluminacao: true,
                      });
                      setIsChecklistModalOpen(true);
                    }}
                  >
                    <Text style={styles.btnFinishRouteText}>🏁 Devolver Veículo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* CARD DE INÍCIO DIRETO */
              <View style={styles.startCard}>
                <View style={styles.startCardHeader}>
                  <Text style={styles.startTitle}>Iniciar Nova Viagem</Text>
                  <View style={styles.fastTrackBadge}>
                    <Text style={styles.fastTrackBadgeText}>⚡ Acesso Ágil</Text>
                  </View>
                </View>
                <Text style={styles.startDesc}>
                  Selecione o veículo da frota, confira o checklist inicial de odômetro e inicie sua rota diretamente, sem necessidade de câmera ou biometria.
                </Text>
                <TouchableOpacity
                  style={styles.btnStartBig}
                  onPress={() => setIsVehicleSelectModalOpen(true)}
                >
                  <Text style={styles.btnStartBigText}>🚗 Selecionar Veículo & Iniciar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* QUADRO DE VEÍCULOS DA BASE MKSEGURANCA */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quadro da Frota — Base MKSEGURANCA</Text>
              <Text style={styles.sectionDesc}>Disponibilidade e motoristas em rota em tempo real:</Text>
            </View>

            {availableVehicles.map((v) => (
              <View key={v.id} style={styles.vehicleCard}>
                <View style={styles.vehicleCardTop}>
                  <Text style={styles.vehiclePlate}>{v.plate}</Text>
                  <View
                    style={[
                      styles.vehicleStatusBadge,
                      v.status === 'IN_USE'
                        ? styles.statusInUse
                        : v.status === 'AVAILABLE'
                        ? styles.statusAvailable
                        : styles.statusMaint,
                    ]}
                  >
                    <Text
                      style={[
                        styles.vehicleStatusText,
                        v.status === 'IN_USE'
                          ? styles.statusTextInUse
                          : v.status === 'AVAILABLE'
                          ? styles.statusTextAvailable
                          : styles.statusTextMaint,
                      ]}
                    >
                      {v.status === 'IN_USE' ? '● EM USO' : v.status === 'AVAILABLE' ? '✓ DISPONÍVEL' : '⚠️ OFICINA'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.vehicleName}>
                  {v.brand} {v.model}
                </Text>
                <Text style={styles.vehicleInfo}>
                  Hodômetro Atual: {v.currentMileage.toLocaleString('pt-BR')} km
                </Text>

                {v.status === 'IN_USE' ? (
                  <View style={styles.driverInfoBox}>
                    <Text style={styles.driverInfoLabel}>🚗 Em trânsito com:</Text>
                    <Text style={styles.driverInfoName}>{v.currentDriver || 'Joãozinho Silva'}</Text>
                  </View>
                ) : v.status === 'AVAILABLE' && !activeRoute.inProgress ? (
                  <TouchableOpacity
                    style={styles.btnPickVehicle}
                    onPress={() => handleSelectVehicleForRoute(v)}
                  >
                    <Text style={styles.btnPickVehicleText}>Pegar este Carro</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}

            {/* HISTÓRICO RECENTE DE ROTAS DO DIA */}
            {recentTrips.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Histórico de Viagens Hoje</Text>
                </View>
                {recentTrips.map((trip, idx) => (
                  <View key={idx} style={styles.tripCard}>
                    <View style={styles.tripCardTop}>
                      <Text style={styles.tripPlate}>{trip.plate} • {trip.model}</Text>
                      <Text style={styles.tripKm}>+{trip.kmDriven} km</Text>
                    </View>
                    <Text style={styles.tripTime}>
                      Horário: {trip.startTime} às {trip.endTime} ({trip.duration})
                    </Text>
                    <Text style={styles.tripLunch}>Intervalo de Almoço: {trip.lunchDuration}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ========================================================== */}
        {/* ABA 2: BATER PONTO CLT (DIRETO E SEGURO)                    */}
        {/* ========================================================== */}
        {currentTab === 'TIMECLOCK' && (
          <View style={styles.timeClockContainer}>
            {/* CARD DIGITAL DO RELÓGIO */}
            <View style={styles.digitalClockCard}>
              <Text style={styles.clockDateText}>{currentDateStr}</Text>
              <Text style={styles.clockDigitalTime}>{currentTimeStr}</Text>
              <Text style={styles.clockCollabName}>Colaborador: {currentUser.name}</Text>
              <View style={styles.clockBranchBadge}>
                <Text style={styles.clockBranchText}>📍 Base MKSEGURANCA • Ponto Conectado</Text>
              </View>
            </View>

            {/* BOTÕES DE BATIDA DE PONTO */}
            <View style={styles.clockActionsCard}>
              <Text style={styles.clockActionsTitle}>Registrar Batida de Ponto</Text>
              <Text style={styles.clockActionsSubtitle}>
                Toque no botão correspondente ao seu momento de expediente:
              </Text>

              <View style={styles.clockGrid}>
                <TouchableOpacity
                  style={[styles.btnClockAction, styles.btnClockEntry]}
                  onPress={() => handleRegisterTimeClock('ENTRADA')}
                >
                  <Text style={styles.btnClockIcon}>🟢</Text>
                  <Text style={styles.btnClockText}>1. Entrada</Text>
                  <Text style={styles.btnClockSub}>Início de Turno</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnClockAction, styles.btnClockLunchOut]}
                  onPress={() => handleRegisterTimeClock('ALMOCO_SAIDA')}
                >
                  <Text style={styles.btnClockIcon}>☕</Text>
                  <Text style={styles.btnClockText}>2. Almoço</Text>
                  <Text style={styles.btnClockSub}>Saída Intervalo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnClockAction, styles.btnClockLunchIn]}
                  onPress={() => handleRegisterTimeClock('ALMOCO_RETORNO')}
                >
                  <Text style={styles.btnClockIcon}>🥪</Text>
                  <Text style={styles.btnClockText}>3. Retorno</Text>
                  <Text style={styles.btnClockSub}>Volta do Almoço</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnClockAction, styles.btnClockExit]}
                  onPress={() => handleRegisterTimeClock('SAIDA')}
                >
                  <Text style={styles.btnClockIcon}>🔴</Text>
                  <Text style={styles.btnClockText}>4. Saída</Text>
                  <Text style={styles.btnClockSub}>Fim de Turno</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* HISTÓRICO DE BATIDAS DO DIA */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Batidas Registradas Hoje</Text>
            </View>

            {timeClockRecords.map((rec) => (
              <View key={rec.id} style={styles.punchRecordItem}>
                <View style={styles.punchRecordLeft}>
                  <Text style={styles.punchRecordType}>
                    {rec.type === 'ENTRADA'
                      ? '🟢 ENTRADA'
                      : rec.type === 'ALMOCO_SAIDA'
                      ? '☕ SAÍDA ALMOÇO'
                      : rec.type === 'ALMOCO_RETORNO'
                      ? '🥪 VOLTA ALMOÇO'
                      : '🔴 SAÍDA'}
                  </Text>
                  <Text style={styles.punchRecordCollab}>{rec.userName} • Base MKSEGURANCA</Text>
                </View>
                <View style={styles.punchRecordRight}>
                  <Text style={styles.punchRecordTime}>{rec.time}</Text>
                  <Text style={styles.punchRecordDate}>{rec.date}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ========================================================== */}
        {/* ABA 3: GESTÃO DE COLABORADORES (ADM)                       */}
        {/* ========================================================== */}
        {currentTab === 'EMPLOYEES' && currentUser.role === 'ADMIN' && (
          <View style={styles.employeesContainer}>
            {/* CARD: CADASTRAR NOVO COLABORADOR (DIRETO) */}
            <View style={styles.enrollCard}>
              <View style={styles.enrollCardTop}>
                <Text style={styles.enrollTitle}>+ Cadastrar Novo Colaborador</Text>
                <View style={styles.directEnrollBadge}>
                  <Text style={styles.directEnrollBadgeText}>Cadastro Direto</Text>
                </View>
              </View>
              <Text style={styles.enrollDesc}>
                Cadastre o novo funcionário com Nome, CPF e Cargo. Ele já poderá acessar o sistema no mesmo instante usando o CPF como senha.
              </Text>

              <View style={styles.enrollInputGroup}>
                <Text style={styles.inputLabel}>Nome Completo</Text>
                <TextInput
                  style={styles.textInput}
                  value={newUserName}
                  onChangeText={setNewUserName}
                  placeholder="Ex: Carlos Eduardo ou Maria Santos"
                  placeholderTextColor="#64748b"
                />

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>CPF (Senha de Acesso)</Text>
                <TextInput
                  style={styles.textInput}
                  value={newUserCpf}
                  onChangeText={setNewUserCpf}
                  placeholder="000.000.000-00"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                />

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Cargo / Função</Text>
                <View style={styles.rolePickerRow}>
                  <TouchableOpacity
                    style={[styles.roleBtn, newUserRole === 'DRIVER' && styles.roleBtnActive]}
                    onPress={() => setNewUserRole('DRIVER')}
                  >
                    <Text style={[styles.roleBtnText, newUserRole === 'DRIVER' && styles.roleBtnTextActive]}>
                      🚗 Motorista
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleBtn, newUserRole === 'FLEET_MANAGER' && styles.roleBtnActive]}
                    onPress={() => setNewUserRole('FLEET_MANAGER')}
                  >
                    <Text style={[styles.roleBtnText, newUserRole === 'FLEET_MANAGER' && styles.roleBtnTextActive]}>
                      🏢 Gestor
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleBtn, newUserRole === 'HR' && styles.roleBtnActive]}
                    onPress={() => setNewUserRole('HR')}
                  >
                    <Text style={[styles.roleBtnText, newUserRole === 'HR' && styles.roleBtnTextActive]}>
                      📋 RH
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleBtn, newUserRole === 'ADMIN' && styles.roleBtnActive]}
                    onPress={() => setNewUserRole('ADMIN')}
                  >
                    <Text style={[styles.roleBtnText, newUserRole === 'ADMIN' && styles.roleBtnTextActive]}>
                      👑 Master
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.btnSaveEmployeeDirect} onPress={handleCreateEmployeeDirect}>
                <Text style={styles.btnSaveEmployeeDirectText}>💾 Salvar e Cadastrar Colaborador</Text>
              </TouchableOpacity>
            </View>

            {/* LISTA DE COLABORADORES CADASTRADOS */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionTitle}>Quadro de Colaboradores — Base MKSEGURANCA</Text>
              <Text style={styles.sectionDesc}>Total de {registeredUsers.length} usuários ativos no sistema:</Text>
            </View>

            {registeredUsers.map((emp) => (
              <View key={emp.id} style={styles.userListItemCard}>
                <View style={styles.userListCardHeader}>
                  <View style={styles.userListAvatar}>
                    <Text style={styles.userListAvatarText}>{emp.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.userListName}>{emp.name}</Text>
                    <Text style={styles.userListCpf}>CPF: {emp.cpf}</Text>
                  </View>
                  <View style={styles.userRoleTag}>
                    <Text style={styles.userRoleTagText}>
                      {emp.role === 'ADMIN'
                        ? '👑 Master'
                        : emp.role === 'DRIVER'
                        ? '🚗 Motorista'
                        : emp.role === 'FLEET_MANAGER'
                        ? '🏢 Gestor'
                        : '📋 RH'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ========================================================== */}
      {/* MODAL: SELEÇÃO DE VEÍCULO DA BASE MKSEGURANCA             */}
      {/* ========================================================== */}
      <Modal visible={isVehicleSelectModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Escolha o Veículo da Frota</Text>
            <Text style={styles.modalSubtitle}>Selecione o carro para iniciar o checklist:</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {availableVehicles
                .filter((v) => v.status === 'AVAILABLE')
                .map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={styles.modalVehicleItem}
                    onPress={() => handleSelectVehicleForRoute(v)}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.modalVehiclePlate}>{v.plate}</Text>
                      <Text style={styles.modalVehicleStatus}>✓ Disponível</Text>
                    </View>
                    <Text style={styles.modalVehicleModel}>
                      {v.brand} {v.model}
                    </Text>
                    <Text style={styles.modalVehicleKm}>
                      Odômetro: {v.currentMileage.toLocaleString('pt-BR')} km
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalBtnCancel}
              onPress={() => setIsVehicleSelectModalOpen(false)}
            >
              <Text style={styles.modalBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* MODAL: CHECKLIST (ENTRADA / SAÍDA)                         */}
      {/* ========================================================== */}
      <Modal visible={isChecklistModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {checklistType === 'ENTRY' ? 'Checklist de Saída (Início de Rota)' : 'Checklist de Retorno (Devolução)'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Veículo: {selectedVehicle?.plate || activeRoute.vehiclePlate} (
              {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : activeRoute.vehicleModel})
            </Text>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Odômetro do Painel (Km) *</Text>
            <TextInput
              style={styles.textInput}
              value={checklistMileage}
              onChangeText={setChecklistMileage}
              keyboardType="numeric"
              placeholder="Ex: 18900"
              placeholderTextColor="#64748b"
            />

            <View style={{ marginTop: 14 }}>
              <Text style={[styles.inputLabel, { marginBottom: 6 }]}>Itens de Inspeção Visual:</Text>
              {['combustivel', 'pneus', 'avarias', 'iluminacao'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.chkItemRow}
                  onPress={() =>
                    setChecklistItems({ ...checklistItems, [item]: !checklistItems[item] })
                  }
                >
                  <Text style={styles.chkItemLabel}>
                    {item === 'combustivel'
                      ? 'Nível de Combustível'
                      : item === 'pneus'
                      ? 'Estado dos Pneus e Calibragem'
                      : item === 'avarias'
                      ? 'Sem Avarias ou Amassados'
                      : 'Faróis e Lanternas Funcionando'}
                  </Text>
                  <Text style={checklistItems[item] ? styles.chkOk : styles.chkBad}>
                    {checklistItems[item] ? '✓ OK' : '⚠ Problema'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.btnConfirmChecklist} onPress={handleConfirmChecklist}>
              <Text style={styles.btnConfirmChecklistText}>
                {checklistType === 'ENTRY' ? 'Confirmar Checklist & Iniciar Rota' : 'Confirmar Devolução do Veículo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtnCancel, { marginTop: 10 }]}
              onPress={() => setIsChecklistModalOpen(false)}
            >
              <Text style={styles.modalBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// ESTILOS VISUAIS EXECUTIVOS
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0c1220',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  brandTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  headerDirectTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  headerDirectTagText: { color: '#34d399', fontSize: 10, fontWeight: '700' },
  brandSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 1 },
  btnLogout: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnLogoutText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },

  // Abas
  mobileTabs: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#0284c7',
  },
  tabButtonText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  tabButtonTextActive: { color: '#38bdf8', fontWeight: '800' },

  content: { flex: 1, padding: 16 },

  // Tela de Login
  loginContainer: {
    flex: 1,
    backgroundColor: '#06090e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0c1220',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  loginLogoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loginLogoText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  loginTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  loginSubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4, marginBottom: 8 },
  directModeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  directModeBadgeText: { color: '#34d399', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  loginForm: { width: '100%' },
  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  textInput: {
    backgroundColor: '#080d1a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  btnLoginSubmit: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  btnLoginSubmitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  quickAccessSection: { marginTop: 20, width: '100%' },
  quickAccessTitle: { color: '#64748b', fontSize: 11, fontWeight: '800', marginBottom: 8 },
  btnQuickUserItem: {
    backgroundColor: '#080d1a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  btnQuickAdmin: { borderColor: '#f59e0b' },
  btnQuickDriver: { borderColor: '#1e293b' },
  quickUserNameText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  quickUserRoleBadge: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  quickUserCpfText: { color: '#64748b', fontSize: 11, marginTop: 2 },

  // Painel de Rota Ativa
  activeRouteCard: {
    backgroundColor: '#0c1220',
    borderWidth: 1,
    borderColor: '#0284c7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  activeRouteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activeRouteBadgeContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgeGreenBg: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  badgeAmberBg: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  activeRouteBadge: { color: '#38bdf8', fontSize: 11, fontWeight: '800' },
  activeRouteVehicle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  activeRoutePlate: { color: '#38bdf8', fontSize: 14, fontWeight: '800', marginTop: 2 },
  activeRouteKmStart: { color: '#64748b', fontSize: 11, marginTop: 4 },
  activeRouteTimerBox: {
    backgroundColor: '#080d1a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activeRouteTimerText: { color: '#38bdf8', fontSize: 22, fontWeight: '900' },
  activeRouteTimerLabel: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  activeRouteStartTime: { color: '#94a3b8', fontSize: 9, marginTop: 2 },
  activeRouteActions: { flexDirection: 'row', gap: 10 },
  btnLunchPause: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnLunchActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#d97706',
  },
  btnLunchText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnFinishRoute: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnFinishRouteText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Card Iniciar Rota
  startCard: {
    backgroundColor: '#0c1220',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 18,
  },
  startCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  startTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  fastTrackBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fastTrackBadgeText: { color: '#38bdf8', fontSize: 11, fontWeight: '800' },
  startDesc: { color: '#94a3b8', fontSize: 13, marginVertical: 8, lineHeight: 18 },
  btnStartBig: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  btnStartBigText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Seções & Veículos
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  sectionDesc: { color: '#64748b', fontSize: 12, marginTop: 2 },
  vehicleCard: {
    backgroundColor: '#0c1220',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  vehicleCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehiclePlate: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  vehicleStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusInUse: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: '#ef4444' },
  statusAvailable: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: '#10b981' },
  statusMaint: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: '#f59e0b' },
  vehicleStatusText: { fontSize: 11, fontWeight: '800' },
  statusTextInUse: { color: '#f87171' },
  statusTextAvailable: { color: '#34d399' },
  statusTextMaint: { color: '#fbbf24' },
  vehicleName: { color: '#cbd5e1', fontSize: 13, marginTop: 4, fontWeight: '600' },
  vehicleInfo: { color: '#64748b', fontSize: 11, marginTop: 2 },
  driverInfoBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#080d1a',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverInfoLabel: { color: '#94a3b8', fontSize: 11 },
  driverInfoName: { color: '#38bdf8', fontSize: 12, fontWeight: '700' },
  btnPickVehicle: {
    marginTop: 10,
    backgroundColor: '#0369a1',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnPickVehicleText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Histórico de Viagens
  tripCard: {
    backgroundColor: '#0c1220',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 8,
  },
  tripCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripPlate: { color: '#fff', fontSize: 13, fontWeight: '700' },
  tripKm: { color: '#10b981', fontSize: 13, fontWeight: '800' },
  tripTime: { color: '#94a3b8', fontSize: 11, marginTop: 3 },
  tripLunch: { color: '#64748b', fontSize: 10, marginTop: 1 },

  // Ponto Eletrônico CLT
  timeClockContainer: { width: '100%' },
  digitalClockCard: {
    backgroundColor: '#0c1220',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#0284c7',
    alignItems: 'center',
    marginBottom: 16,
  },
  clockDateText: { color: '#94a3b8', fontSize: 12, textTransform: 'capitalize' },
  clockDigitalTime: { color: '#38bdf8', fontSize: 38, fontWeight: '900', marginVertical: 6, letterSpacing: 2 },
  clockCollabName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  clockBranchBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  clockBranchText: { color: '#38bdf8', fontSize: 11, fontWeight: '700' },

  clockActionsCard: {
    backgroundColor: '#0c1220',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 18,
  },
  clockActionsTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  clockActionsSubtitle: { color: '#64748b', fontSize: 12, marginTop: 2, marginBottom: 14 },
  clockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  btnClockAction: {
    width: '48%',
    backgroundColor: '#080d1a',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnClockEntry: { borderColor: '#10b981' },
  btnClockLunchOut: { borderColor: '#f59e0b' },
  btnClockLunchIn: { borderColor: '#0284c7' },
  btnClockExit: { borderColor: '#ef4444' },
  btnClockIcon: { fontSize: 20, marginBottom: 4 },
  btnClockText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  btnClockSub: { color: '#64748b', fontSize: 10, marginTop: 2 },

  punchRecordItem: {
    backgroundColor: '#0c1220',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  punchRecordLeft: { flex: 1 },
  punchRecordType: { color: '#fff', fontSize: 13, fontWeight: '800' },
  punchRecordCollab: { color: '#64748b', fontSize: 11, marginTop: 2 },
  punchRecordRight: { alignItems: 'flex-end' },
  punchRecordTime: { color: '#38bdf8', fontSize: 14, fontWeight: '800' },
  punchRecordDate: { color: '#64748b', fontSize: 10, marginTop: 2 },

  // Aba Funcionários (ADM)
  employeesContainer: { width: '100%' },
  enrollCard: {
    backgroundColor: '#0c1220',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  enrollCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  enrollTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  directEnrollBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  directEnrollBadgeText: { color: '#34d399', fontSize: 10, fontWeight: '700' },
  enrollDesc: { color: '#94a3b8', fontSize: 12, marginVertical: 8, lineHeight: 16 },
  enrollInputGroup: { marginTop: 6 },
  rolePickerRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  roleBtn: {
    flex: 1,
    backgroundColor: '#080d1a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  roleBtnActive: {
    borderColor: '#0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
  },
  roleBtnText: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  roleBtnTextActive: { color: '#38bdf8', fontWeight: '800' },
  btnSaveEmployeeDirect: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  btnSaveEmployeeDirectText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  userListItemCard: {
    backgroundColor: '#0c1220',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 8,
  },
  userListCardHeader: { flexDirection: 'row', alignItems: 'center' },
  userListAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userListAvatarText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  userListName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  userListCpf: { color: '#64748b', fontSize: 11, marginTop: 1 },
  userRoleTag: {
    backgroundColor: '#080d1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  userRoleTagText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },

  // Modais
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0c1220',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  modalSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 2, marginBottom: 12 },
  modalVehicleItem: {
    backgroundColor: '#080d1a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  modalVehiclePlate: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modalVehicleStatus: { color: '#10b981', fontSize: 11, fontWeight: '700' },
  modalVehicleModel: { color: '#cbd5e1', fontSize: 12, marginTop: 2 },
  modalVehicleKm: { color: '#64748b', fontSize: 11, marginTop: 2 },
  modalBtnCancel: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  modalBtnCancelText: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },

  chkItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  chkItemLabel: { color: '#cbd5e1', fontSize: 12 },
  chkOk: { color: '#10b981', fontSize: 12, fontWeight: '700' },
  chkBad: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  btnConfirmChecklist: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  btnConfirmChecklistText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
