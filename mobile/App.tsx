// Aplicativo mobile (Expo) - login, controle de rotas, check list, ponto CLT e cadastros

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, BASE_URL, setCustomApiUrl } from './src/services/api';
import { offlineQueue } from './src/services/offlineQueue';
import {
  THEMES,
  ThemeMode,
  ThemeTokens,
  SPACING,
  RADIUS,
  TYPOGRAPHY,
} from './src/theme';

const ASSETS = {
  logo: require('./assets/images/logo-rotalog.jpg'),
  heroBanner: require('./assets/images/fleet-hero-banner.jpg'),
  vehiclePlaceholder: require('./assets/images/vehicle-placeholder.jpg'),
  emptyState: require('./assets/images/empty-state-corporate.jpg'),
};

interface UserProfile {
  id: string;
  name: string;
  cpf: string;
  role: 'ADMIN' | 'FLEET_MANAGER' | 'DRIVER' | string;
  tenantName: string;
  branchName?: string;
}

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  isAvailable?: boolean;
  currentMileage: number;
  currentDriver?: {
    id: string;
    name: string;
  } | null;
}

interface VehicleUsage {
  id: string;
  vehicleId: string;
  driverId: string;
  startTime: string;
  endTime?: string | null;
  lunchStartTime?: string | null;
  lunchEndTime?: string | null;
  totalLunchMinutes: number;
  totalDurationMinutes: number;
  totalDistanceKm: number;
  status: 'IN_PROGRESS' | 'PAUSED_LUNCH' | 'COMPLETED';
  vehicle?: Vehicle;
  entryChecklist?: {
    mileage: number;
    observation?: string;
    itemsResult?: any;
  };
  exitChecklist?: {
    mileage: number;
    observation?: string;
    hasProblem?: boolean;
    itemsResult?: any;
  };
}

function safeFormatTime(dateInput: any): string {
  if (!dateInput) return '--:--';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '--:--';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function safeFormatShortTime(dateInput: any): string {
  if (!dateInput) return '--:--';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '--:--';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function safeFormatFullDate(dateInput: any): string {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const days = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const dayName = days[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} de ${monthName} de ${year}`;
}

function safeFormatShortDate(dateInput: any): string {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayName = days[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${dayName}, ${day}/${month}/${year}`;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ROTALOG Runtime Crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const dark = THEMES.dark;
      return (
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: dark.surfaces.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING.xl,
          }}
        >
          <View
            style={{
              backgroundColor: dark.surfaces.card,
              padding: SPACING.lg,
              borderRadius: RADIUS.lg,
              width: '100%',
              borderWidth: 1,
              borderColor: dark.semantic.danger.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs }}>
              <Ionicons name="alert-circle" size={20} color={dark.semantic.danger.main} />
              <Text
                style={{
                  color: dark.semantic.danger.main,
                  fontSize: TYPOGRAPHY.h2,
                  fontWeight: 'bold',
                }}
              >
                Recuperação de Falha
              </Text>
            </View>
            <Text
              style={{
                color: dark.text.secondary,
                fontSize: TYPOGRAPHY.caption,
                marginBottom: SPACING.md,
                lineHeight: 18,
              }}
            >
              {this.state.error?.message || 'Ocorreu um erro inesperado no aplicativo.'}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: dark.brand.primary,
                padding: SPACING.sm,
                borderRadius: RADIUS.sm,
                alignItems: 'center',
              }}
              onPress={() => this.setState({ hasError: false, error: null })}
            >
              <Text
                style={{
                  color: dark.text.inverse,
                  fontWeight: 'bold',
                  fontSize: TYPOGRAPHY.bodySm,
                }}
              >
                Recarregar Aplicativo
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const [appTheme, setAppTheme] = useState<ThemeMode>('dark');
  const themeColors = THEMES[appTheme];
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  const [user, setUser] = useState<(UserProfile & { tenantId?: string }) | null>(null);
  const [companyInput, setCompanyInput] = useState('Teste Apresentação');
  const [cpfInput, setCpfInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(BASE_URL);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'IDLE' | 'OK' | 'FAIL'>('IDLE');

  const testServerConnection = async (targetUrl?: string) => {
    const url = targetUrl || customServerUrl;
    setTestingConnection(true);
    try {
      setCustomApiUrl(url);
      await api.getVehicles();
      setConnectionStatus('OK');
      Alert.alert(
        'Conexão Estabelecida',
        `Servidor respondendo com sucesso em:\n${url}`
      );
    } catch {
      setConnectionStatus('FAIL');
      Alert.alert(
        'Falha na Conexão',
        `Não foi possível alcançar o servidor em:\n${url}\n\nVerifique se o computador e o dispositivo estão na mesma rede.`
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'route' | 'users' | 'timeclock' | 'history'>('route');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeUsage, setActiveUsage] = useState<VehicleUsage | null>(null);
  const [driverTrips, setDriverTrips] = useState<VehicleUsage[]>([]);
  const [routeSeconds, setRouteSeconds] = useState(0);

  const [usersList, setUsersList] = useState<any[]>([]);
  const [allPunches, setAllPunches] = useState<any[]>([]);
  const [newVehicleModalVisible, setNewVehicleModalVisible] = useState(false);
  const [newUserModalVisible, setNewUserModalVisible] = useState(false);
  const [vehPlate, setVehPlate] = useState('');
  const [vehBrand, setVehBrand] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehYear, setVehYear] = useState('2024');
  const [vehMileage, setVehMileage] = useState('0');
  const [vehStatus, setVehStatus] = useState<'AVAILABLE' | 'MAINTENANCE'>('AVAILABLE');
  const [usrName, setUsrName] = useState('');
  const [usrCpf, setUsrCpf] = useState('');
  const [usrEmail, setUsrEmail] = useState('');
  const [usrPassword, setUsrPassword] = useState('');
  const [usrRole, setUsrRole] = useState<'DRIVER' | 'FLEET_MANAGER' | 'ADMIN'>('DRIVER');

  const [startModalVisible, setStartModalVisible] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [odometerInput, setOdometerInput] = useState('');
  const [observationInput, setObservationInput] = useState('');
  const [checklistItems, setChecklistItems] = useState<{ [key: string]: boolean }>({
    fuel: true,
    tires: true,
    bodywork: true,
    lights: true,
    docs: true,
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayPunches, setTodayPunches] = useState<any[]>([]);
  const [offlinePendingCount, setOfflinePendingCount] = useState(0);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [punchFeedback, setPunchFeedback] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (activeUsage && activeUsage.status === 'IN_PROGRESS') {
      interval = setInterval(() => {
        const start = new Date(activeUsage.startTime).getTime();
        const now = Date.now();
        setRouteSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      }, 1000);
    } else {
      setRouteSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeUsage]);

  useEffect(() => {
    updateOfflineCount();
  }, []);

  useEffect(() => {
    if (user) {
      setActiveTab('route');
      refreshActiveUsage();
      loadVehicles();
      loadTodayPunches();
      loadTripsHistory();
      updateOfflineCount();
      if (user.role === 'ADMIN' || user.role === 'FLEET_MANAGER') {
        loadUsersList();
        loadAllPunchesReport();
      }
    }
  }, [user]);

  const updateOfflineCount = async () => {
    const count = await offlineQueue.getPendingCount();
    setOfflinePendingCount(count);
  };

  const loadUsersList = async () => {
    try {
      const list = await api.getUsers(user?.tenantId);
      if (Array.isArray(list)) {
        setUsersList(list);
      }
    } catch (err) {
      console.log('Erro ao carregar colaboradores:', err);
    }
  };

  const loadAllPunchesReport = async () => {
    try {
      const report = await api.getTimeClockReport(user?.tenantId);
      if (Array.isArray(report)) {
        setAllPunches(report);
      }
    } catch (err) {
      console.log('Erro ao carregar relatorio CLT:', err);
    }
  };

  // Autenticacao de login (identifica perfil Admin, Gestor ou Motorista)
  const handleLogin = async (
    customCompany?: string,
    customCpf?: string,
    customPass?: string
  ) => {
    const company = customCompany || companyInput;
    const cpf = customCpf || cpfInput;
    const pass = customPass || passwordInput;

    if (!company || !cpf) {
      Alert.alert('Campos Obrigatórios', 'Informe o nome da Empresa e o seu CPF.');
      return;
    }

    setLoadingAuth(true);
    try {
      let res;
      if (pass) {
        res = await api.login(company, cpf, pass);
      } else {
        res = await api.quickLogin(cpf);
      }

      setUser(res.user);
    } catch (err: any) {
      Alert.alert('Erro de Acesso', err.message || 'Falha ao autenticar.');
    } finally {
      setLoadingAuth(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const list = await api.getVehicles(user?.tenantId);
      if (Array.isArray(list)) setVehicles(list);
    } catch (err) {
      console.log('Erro ao carregar veiculos:', err);
    }
  };

  // Cadastro e inclusao de veiculos na frota
  const handleCreateVehicle = async () => {
    if (!vehPlate.trim() || !vehBrand.trim() || !vehModel.trim()) {
      Alert.alert('Validação', 'Preencha Placa, Marca e Modelo do veículo.');
      return;
    }
    try {
      await api.createVehicle({
        plate: vehPlate.toUpperCase().trim(),
        brand: vehBrand.trim(),
        model: vehModel.trim(),
        year: parseInt(vehYear, 10) || 2024,
        currentMileage: parseInt(vehMileage, 10) || 0,
        status: vehStatus,
        tenantId: user?.tenantId,
      });
      Alert.alert(
        'Veículo Cadastrado',
        `${vehBrand} ${vehModel} (${vehPlate.toUpperCase()}) adicionado à frota.`
      );
      setVehPlate('');
      setVehBrand('');
      setVehModel('');
      setVehMileage('0');
      setVehStatus('AVAILABLE');
      setNewVehicleModalVisible(false);
      loadVehicles();
    } catch (err: any) {
      Alert.alert('Erro ao cadastrar carro', err.message || 'Tente novamente.');
    }
  };

  // Alteracao de status de veiculos (disponivel ou oficina)
  const handleToggleVehicleStatus = async (vehicle: Vehicle) => {
    if (vehicle.status === 'IN_USE') {
      Alert.alert(
        'Em Rota',
        'Este veículo está em rota ativa no momento. Finalize a rota antes de alterar o status.'
      );
      return;
    }
    const nextStatus = vehicle.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await api.updateVehicleStatus(vehicle.id, nextStatus);
      Alert.alert(
        'Status Atualizado',
        `Veículo ${vehicle.plate} agora está ${
          nextStatus === 'AVAILABLE' ? 'DISPONÍVEL' : 'EM OFICINA'
        }.`
      );
      loadVehicles();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao atualizar status.');
    }
  };

  // Cadastro e inclusao de funcionarios (Admin cadastra gestor/motorista; Gestor cadastra motorista)
  const handleCreateUser = async () => {
    if (!usrName.trim() || !usrCpf.trim()) {
      Alert.alert('Validação', 'Preencha Nome Completo e CPF do colaborador.');
      return;
    }
    const assignedRole = user?.role === 'FLEET_MANAGER' ? 'DRIVER' : usrRole;
    const chosenPassword = usrPassword.trim().length > 0 ? usrPassword.trim() : '123456';

    try {
      await api.createUser({
        name: usrName.trim(),
        cpf: usrCpf.trim(),
        email: usrEmail.trim() || undefined,
        role: assignedRole,
        creatorRole: user?.role,
        password: chosenPassword,
        tenantId: user?.tenantId,
      });
      Alert.alert(
        'Cadastro Concluído',
        `${usrName} cadastrado como ${
          assignedRole === 'DRIVER'
            ? 'Motorista'
            : assignedRole === 'FLEET_MANAGER'
            ? 'Gestor de Frota'
            : 'Admin'
        }.\nSenha inicial: ${chosenPassword}`
      );
      setUsrName('');
      setUsrCpf('');
      setUsrEmail('');
      setUsrPassword('');
      setUsrRole('DRIVER');
      setNewUserModalVisible(false);
      loadUsersList();
    } catch (err: any) {
      Alert.alert('Erro no cadastro', err.message || 'Não foi possível cadastrar.');
    }
  };

  const refreshActiveUsage = async () => {
    if (!user) return;
    try {
      const usage = await api.getActiveUsage(user.id);
      setActiveUsage(usage || null);
    } catch (err) {
      console.log('Erro ao buscar rota ativa:', err);
    }
  };

  const loadTripsHistory = async () => {
    if (!user) return;
    try {
      if (user.role === 'DRIVER') {
        const myTrips = await api.getDriverTrips(user.id);
        setDriverTrips(myTrips);
      } else {
        const all = await api.getAllTrips();
        setDriverTrips(all);
      }
    } catch (err) {
      console.log('Erro ao carregar historico:', err);
    }
  };

  const loadTodayPunches = async () => {
    if (!user) return;
    try {
      const data = await api.getTodayPunches(user.id);
      setTodayPunches(data || []);
    } catch {
      // offline
    }
  };

  // Check list preenchimento de saida e inicio de rota
  const openStartModal = (vehicle: Vehicle) => {
    if (vehicle.status !== 'AVAILABLE') {
      Alert.alert(
        'Viatura Indisponível',
        'Este veículo está em trânsito ou em manutenção.'
      );
      return;
    }
    setSelectedVehicle(vehicle);
    setOdometerInput(String(vehicle.currentMileage || ''));
    setObservationInput('');
    setChecklistItems({
      fuel: true,
      tires: true,
      bodywork: true,
      lights: true,
      docs: true,
    });
    setStartModalVisible(true);
  };

  const handleConfirmStart = async () => {
    if (!selectedVehicle || !user) return;
    const mileage = parseInt(odometerInput, 10);
    if (isNaN(mileage) || mileage <= 0) {
      Alert.alert('Validação', 'Informe o odômetro atual do painel.');
      return;
    }

    try {
      const itemsResult: any = {};
      Object.keys(checklistItems).forEach((key) => {
        itemsResult[key] = { ok: checklistItems[key] };
      });

      const usage = await api.startUsage({
        vehicleId: selectedVehicle.id,
        driverId: user.id,
        mileage,
        itemsResult,
        observation: observationInput,
      });

      setStartModalVisible(false);
      setActiveUsage(usage);
      Alert.alert(
        'Rota Iniciada',
        `Viatura ${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.plate}) liberada com sucesso.`
      );
      loadVehicles();
    } catch (err: any) {
      Alert.alert('Erro ao iniciar', err.message);
    }
  };

  // Controle de pausa e retomada de almoco na rota
  const handlePauseLunch = async () => {
    if (!activeUsage) return;
    try {
      const updated = await api.pauseLunch(activeUsage.id);
      setActiveUsage(updated);
      Alert.alert(
        'Intervalo Registrado',
        'Pausa para almoço iniciada. O tempo está sendo contabilizado para o relatório da gestão.'
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleResumeLunch = async () => {
    if (!activeUsage) return;
    try {
      const updated = await api.resumeLunch(activeUsage.id);
      setActiveUsage(updated);
      Alert.alert(
        'Rota Retomada',
        'Intervalo de almoço encerrado. Boa continuação de trajeto.'
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  // Check list preenchimento de devolucao e encerramento de rota
  const openFinishModal = () => {
    if (!activeUsage) return;
    const initialKm =
      activeUsage.entryChecklist?.mileage || activeUsage.vehicle?.currentMileage || 0;
    setOdometerInput(String(initialKm + 15));
    setObservationInput('');
    setChecklistItems({
      fuel: true,
      tires: true,
      bodywork: true,
      lights: true,
      docs: true,
    });
    setFinishModalVisible(true);
  };

  const handleConfirmFinish = async () => {
    if (!activeUsage) return;
    const exitMileage = parseInt(odometerInput, 10);
    const initialKm = activeUsage.entryChecklist?.mileage || 0;

    if (isNaN(exitMileage) || exitMileage < initialKm) {
      Alert.alert(
        'Atenção',
        `O odômetro final (${exitMileage} km) não pode ser inferior ao odômetro de saída (${initialKm} km).`
      );
      return;
    }

    try {
      const itemsResult: any = {};
      let hasProblem = false;
      Object.keys(checklistItems).forEach((key) => {
        const isOk = checklistItems[key];
        itemsResult[key] = { ok: isOk };
        if (!isOk) hasProblem = true;
      });

      await api.finishUsage(activeUsage.id, {
        exitMileage,
        itemsResult,
        observation: observationInput,
      });

      setFinishModalVisible(false);
      setActiveUsage(null);
      const kmDriven = exitMileage - initialKm;

      if (hasProblem) {
        Alert.alert(
          'Viatura Devolvida com Avaria',
          `Km Percorrido: ${kmDriven} km.\nVeículo encaminhado automaticamente para a OFICINA (Manutenção) e alerta prioritário emitido.`
        );
      } else {
        Alert.alert(
          'Rota Concluída com Sucesso',
          `Km Percorrido: ${kmDriven} km.\nViatura liberada e disponível no pátio para o próximo turno.`
        );
      }
      loadVehicles();
      loadTripsHistory();
    } catch (err: any) {
      Alert.alert('Erro ao finalizar', err.message);
    }
  };

  // Registro de ponto CLT (entrada, almoco e saida)
  const handlePunchClock = async (
    type: 'ENTRADA' | 'ALMOCO_SAIDA' | 'ALMOCO_RETORNO' | 'SAIDA'
  ) => {
    if (!user) return;
    const nowIso = new Date().toISOString();

    const typeLabels = {
      ENTRADA: 'Entrada no Turno',
      ALMOCO_SAIDA: 'Saída Almoço',
      ALMOCO_RETORNO: 'Retorno Almoço',
      SAIDA: 'Saída Expediente',
    };

    if (isSimulatedOffline) {
      await offlineQueue.enqueue({
        userId: user.id,
        type,
        timestamp: nowIso,
      });
      await updateOfflineCount();
      setPunchFeedback(
        `Modo Offline: [${typeLabels[type]}] armazenado na memória do dispositivo.`
      );
      return;
    }

    try {
      const punch = await api.punchClock({
        userId: user.id,
        type,
        timestamp: nowIso,
        isOffline: false,
      });
      setTodayPunches((prev) => [...prev, punch]);
      setPunchFeedback(
        `[${typeLabels[type]}] registrado às ${safeFormatTime(new Date())}.`
      );
      setTimeout(() => setPunchFeedback(null), 4000);
    } catch {
      await offlineQueue.enqueue({
        userId: user.id,
        type,
        timestamp: nowIso,
      });
      await updateOfflineCount();
      setPunchFeedback(`Sem conexão: [${typeLabels[type]}] salvo na fila offline.`);
    }
  };

  const handleSyncOffline = async () => {
    const res = await offlineQueue.sync();
    if (res.success) {
      Alert.alert(
        'Sincronização Concluída',
        `${res.syncedCount} batida(s) sincronizada(s) com o banco de dados.`
      );
      await updateOfflineCount();
      loadTodayPunches();
    } else {
      Alert.alert('Falha', res.error || 'Não foi possível conectar ao servidor.');
    }
  };

  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Tela de login
  if (!user) {
    return (
      <SafeAreaView style={styles.darkContainer}>
        <StatusBar barStyle={themeColors.isLight ? 'dark-content' : 'light-content'} />
        <ScrollView contentContainerStyle={styles.loginContent}>
          <View style={styles.brandHeader}>
            <View style={styles.logoFrame}>
              <Image
                source={ASSETS.logo}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs }}>
              <Text style={styles.brandTitle}>Rota</Text>
              <Text style={[styles.brandTitle, { color: themeColors.brand.primary }]}>
                Log
              </Text>
            </View>
            <Text
              style={[
                styles.brandSubtitle,
                {
                  color: themeColors.brand.primary,
                  fontWeight: '800',
                  letterSpacing: 2,
                },
              ]}
            >
              — CONTROLE DE FROTAS —
            </Text>

            <View style={styles.pillarsRow}>
              <View style={styles.pillarPill}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={themeColors.brand.primary}
                />
                <Text style={styles.pillarText}>Ponto CLT</Text>
              </View>
              <View style={styles.pillarPill}>
                <Ionicons
                  name="clipboard-outline"
                  size={13}
                  color={themeColors.brand.primary}
                />
                <Text style={styles.pillarText}>Check List</Text>
              </View>
              <View style={styles.pillarPill}>
                <Ionicons
                  name="car-sport-outline"
                  size={13}
                  color={themeColors.brand.primary}
                />
                <Text style={styles.pillarText}>Gestão de Frotas</Text>
              </View>
            </View>
          </View>

          {/* Seletor de tema (Modo Escuro / Modo Claro) */}
          <View style={styles.themePickerRow}>
            {Object.values(THEMES).map((t) => {
              const selected = appTheme === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.themeChip,
                    {
                      backgroundColor: selected
                        ? t.brand.primary
                        : themeColors.surfaces.card,
                      borderColor: selected
                        ? t.brand.primary
                        : themeColors.surfaces.border,
                    },
                  ]}
                  onPress={() => setAppTheme(t.id)}
                >
                  <Ionicons
                    name={t.isLight ? 'sunny' : 'moon'}
                    size={14}
                    color={
                      selected ? themeColors.text.inverse : themeColors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.themeChipText,
                      {
                        color: selected
                          ? themeColors.text.inverse
                          : themeColors.text.secondary,
                      },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Formulario de acesso */}
          <View
            style={[
              styles.card,
              { borderTopWidth: 3, borderTopColor: themeColors.brand.primary },
            ]}
          >
            <Text style={styles.cardTitle}>Acesso ao Sistema</Text>

            <Text style={styles.inputLabel}>Empresa / Base Operacional *</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="business-outline"
                size={18}
                color={themeColors.text.secondary}
                style={{ marginRight: SPACING.xs }}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Teste Apresentação"
                placeholderTextColor={themeColors.text.muted}
                value={companyInput}
                onChangeText={setCompanyInput}
              />
            </View>

            <Text style={styles.inputLabel}>CPF do Usuário *</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="person-outline"
                size={18}
                color={themeColors.text.secondary}
                style={{ marginRight: SPACING.xs }}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Ex: 111.111.111-11"
                placeholderTextColor={themeColors.text.muted}
                value={cpfInput}
                onChangeText={setCpfInput}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.inputLabel}>Senha de Acesso *</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={themeColors.text.secondary}
                style={{ marginRight: SPACING.xs }}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Digite sua senha"
                placeholderTextColor={themeColors.text.muted}
                value={passwordInput}
                onChangeText={setPasswordInput}
                secureTextEntry={true}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loadingAuth && { opacity: 0.7 }]}
              onPress={() => handleLogin()}
              disabled={loadingAuth}
            >
              {loadingAuth ? (
                <ActivityIndicator color={themeColors.text.inverse} />
              ) : (
                <>
                  <Ionicons
                    name="log-in-outline"
                    size={20}
                    color={themeColors.text.inverse}
                    style={{ marginRight: SPACING.xs }}
                  />
                  <Text style={styles.primaryButtonText}>Entrar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Configuracao de conexao com o servidor */}
          <TouchableOpacity
            style={styles.serverConfigToggle}
            onPress={() => setShowServerConfig(!showServerConfig)}
          >
            <Ionicons
              name={
                connectionStatus === 'OK'
                  ? 'checkmark-circle'
                  : connectionStatus === 'FAIL'
                  ? 'alert-circle'
                  : 'settings-outline'
              }
              size={15}
              color={
                connectionStatus === 'OK'
                  ? themeColors.semantic.success.main
                  : connectionStatus === 'FAIL'
                  ? themeColors.semantic.danger.main
                  : themeColors.text.secondary
              }
            />
            <Text style={styles.serverConfigToggleText}>
              Servidor: {BASE_URL} {connectionStatus === 'OK' ? '(Online)' : ''}
            </Text>
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.serverConfigBox}>
              <Text style={styles.inputLabel}>Endereço da API Backend:</Text>
              <TextInput
                style={styles.textInput}
                value={customServerUrl}
                onChangeText={setCustomServerUrl}
                autoCapitalize="none"
                placeholder="Ex: http://192.168.99.113:3001"
                placeholderTextColor={themeColors.text.muted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.xs, fontSize: 11 }]}>
                Atalhos Rápidos de Rede:
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: SPACING.xs,
                  marginBottom: SPACING.sm,
                }}
              >
                <TouchableOpacity
                  style={styles.serverPresetBtn}
                  onPress={() => {
                    const u = 'http://192.168.99.113:3001';
                    setCustomServerUrl(u);
                    setCustomApiUrl(u);
                    testServerConnection(u);
                  }}
                >
                  <Ionicons
                    name="wifi-outline"
                    size={12}
                    color={themeColors.text.secondary}
                  />
                  <Text style={styles.serverPresetText}>
                    Wi-Fi Local (192.168.99.113)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.serverPresetBtn}
                  onPress={() => {
                    const u = 'http://localhost:3001';
                    setCustomServerUrl(u);
                    setCustomApiUrl(u);
                    testServerConnection(u);
                  }}
                >
                  <Ionicons
                    name="globe-outline"
                    size={12}
                    color={themeColors.text.secondary}
                  />
                  <Text style={styles.serverPresetText}>Localhost (Web)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.serverPresetBtn}
                  onPress={() => {
                    const u = 'http://10.0.2.2:3001';
                    setCustomServerUrl(u);
                    setCustomApiUrl(u);
                    testServerConnection(u);
                  }}
                >
                  <Ionicons
                    name="phone-portrait-outline"
                    size={12}
                    color={themeColors.text.secondary}
                  />
                  <Text style={styles.serverPresetText}>Emulador Android</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                <TouchableOpacity
                  style={[
                    styles.saveServerBtn,
                    {
                      flex: 1,
                      backgroundColor: themeColors.semantic.success.main,
                    },
                  ]}
                  disabled={testingConnection}
                  onPress={() => testServerConnection()}
                >
                  {testingConnection ? (
                    <ActivityIndicator
                      size="small"
                      color={themeColors.text.inverse}
                    />
                  ) : (
                    <Text style={styles.saveServerBtnText}>Testar Conexão</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveServerBtn,
                    { flex: 1, backgroundColor: themeColors.brand.primary },
                  ]}
                  onPress={() => {
                    setCustomApiUrl(customServerUrl);
                    setShowServerConfig(false);
                    Alert.alert(
                      'Salvo',
                      `Servidor atualizado para:\n${customServerUrl}`
                    );
                  }}
                >
                  <Text style={styles.saveServerBtnText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Painel principal e controle de rotas
  const isDriver = user.role === 'DRIVER';

  return (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle={themeColors.isLight ? 'dark-content' : 'light-content'} />

      {/* Top Bar Executiva com Logo RotaLog & Seletor de Tema */}
      <View style={styles.topBar}>
        <Image
          source={ASSETS.logo}
          style={styles.topBarLogo}
          resizeMode="cover"
        />
        <View style={styles.topBarLeft}>
          <Text style={styles.topBarName}>{user.name}</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.xxs,
              marginTop: 2,
            }}
          >
            <Text style={styles.topBarTenant}>{user.tenantName}</Text>
            <Text style={styles.topBarTenant}>•</Text>
            <Text
              style={[
                styles.topBarTenant,
                {
                  color:
                    user.role === 'ADMIN'
                      ? themeColors.semantic.admin.main
                      : user.role === 'FLEET_MANAGER'
                      ? themeColors.semantic.info.main
                      : themeColors.semantic.success.main,
                  fontWeight: '800',
                },
              ]}
            >
              {user.role === 'ADMIN'
                ? 'Administrador'
                : user.role === 'FLEET_MANAGER'
                ? 'Gestor de Frota'
                : 'Motorista'}
            </Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.offlineChip}
            onPress={() => setAppTheme(appTheme === 'dark' ? 'light' : 'dark')}
          >
            <Ionicons
              name={themeColors.isLight ? 'sunny' : 'moon'}
              size={13}
              color={themeColors.brand.primary}
              style={{ marginRight: SPACING.xxs }}
            />
            <Text style={styles.offlineChipText}>
              {themeColors.shortLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.offlineChip,
              isSimulatedOffline && styles.offlineChipActive,
            ]}
            onPress={() => setIsSimulatedOffline(!isSimulatedOffline)}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isSimulatedOffline
                    ? themeColors.semantic.warning.main
                    : themeColors.semantic.success.main,
                },
              ]}
            />
            <Text style={styles.offlineChipText}>
              {isSimulatedOffline ? 'Offline' : 'Online'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              setUser(null);
              setActiveUsage(null);
            }}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={themeColors.semantic.danger.main}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner de Sincronização Offline */}
      {offlinePendingCount > 0 && (
        <TouchableOpacity style={styles.offlineBanner} onPress={handleSyncOffline}>
          <Ionicons
            name="cloud-offline"
            size={18}
            color={themeColors.text.inverse}
          />
          <Text style={styles.offlineBannerText}>
            {offlinePendingCount} batida(s) salva(s) offline. Toque para sincronizar com o banco.
          </Text>
        </TouchableOpacity>
      )}

      {/* Controle de rotas e veiculos */}
      {activeTab === 'route' && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          {activeUsage ? (
            <View style={styles.activeRouteCard}>
              <View style={styles.routeHeaderRow}>
                <View
                  style={[
                    styles.statusPill,
                    activeUsage.status === 'PAUSED_LUNCH'
                      ? styles.pillLunch
                      : styles.pillRoute,
                  ]}
                >
                  <Ionicons
                    name={
                      activeUsage.status === 'PAUSED_LUNCH'
                        ? 'cafe-outline'
                        : 'navigate-circle-outline'
                    }
                    size={13}
                    color={
                      activeUsage.status === 'PAUSED_LUNCH'
                        ? themeColors.semantic.warning.main
                        : themeColors.semantic.success.main
                    }
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      activeUsage.status === 'PAUSED_LUNCH' && {
                        color: themeColors.semantic.warning.main,
                      },
                    ]}
                  >
                    {activeUsage.status === 'PAUSED_LUNCH'
                      ? 'EM PAUSA DE ALMOÇO'
                      : 'ROTA EM ANDAMENTO'}
                  </Text>
                </View>
                <Text style={styles.routePlate}>
                  {activeUsage.vehicle?.plate || 'VIATURA'}
                </Text>
              </View>

              <Text style={styles.routeModel}>
                {activeUsage.vehicle
                  ? `${activeUsage.vehicle.brand} ${activeUsage.vehicle.model}`
                  : 'Viatura Operacional'}
              </Text>

              <View style={styles.timerDisplayBox}>
                <Text style={styles.timerLabel}>
                  CRONÔMETRO DE VIAGEM EM TEMPO REAL
                </Text>
                <Text style={styles.timerValue}>{formatSeconds(routeSeconds)}</Text>
                {activeUsage.totalLunchMinutes > 0 && (
                  <Text style={styles.timerSub}>
                    Tempo de almoço acumulado: {activeUsage.totalLunchMinutes} min
                  </Text>
                )}
              </View>

              <View style={styles.routeActionsGrid}>
                {activeUsage.status === 'PAUSED_LUNCH' ? (
                  <TouchableOpacity
                    style={styles.resumeLunchBtn}
                    onPress={handleResumeLunch}
                  >
                    <Ionicons
                      name="play"
                      size={18}
                      color={themeColors.text.inverse}
                    />
                    <Text style={styles.btnActionText}>Retomar Rota</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.pauseLunchBtn}
                    onPress={handlePauseLunch}
                  >
                    <Ionicons
                      name="cafe-outline"
                      size={18}
                      color={themeColors.text.inverse}
                    />
                    <Text style={styles.btnActionText}>Pausar p/ Almoço</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.finishRouteBtn}
                  onPress={openFinishModal}
                >
                  <Ionicons
                    name="flag-outline"
                    size={18}
                    color={themeColors.text.inverse}
                  />
                  <Text style={styles.btnActionText}>Finalizar & Devolver</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.noRouteHero}>
                <Image
                  source={ASSETS.heroBanner}
                  style={styles.heroBannerImage}
                  resizeMode="cover"
                />
                <Text style={styles.noRouteTitle}>
                  {isDriver
                    ? 'Seleção de Viatura & Checklist'
                    : 'Gestão da Frota & Status'}
                </Text>
                <Text style={styles.noRouteSub}>
                  {isDriver
                    ? 'Viaturas disponíveis podem ser selecionadas para iniciar o turno. Viaturas ocupadas ou em oficina ficam bloqueadas.'
                    : 'Cadastre carros, altere o status operacional (Disponível/Oficina) ou inicie uma rota de vistoria.'}
                </Text>

                {!isDriver && (
                  <TouchableOpacity
                    style={styles.addMgmtBtn}
                    onPress={() => setNewVehicleModalVisible(true)}
                  >
                    <Ionicons
                      name="add-circle"
                      size={18}
                      color={themeColors.text.inverse}
                    />
                    <Text style={styles.addMgmtBtnText}>
                      Cadastrar Novo Carro
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.sectionHeading}>
                Veículos da Base ({vehicles.length})
              </Text>

              {vehicles.map((v) => {
                const isAvailable = v.status === 'AVAILABLE';
                const isInUse = v.status === 'IN_USE';

                return (
                  <View
                    key={v.id}
                    style={[
                      styles.vehicleCard,
                      !isAvailable && styles.vehicleCardDisabled,
                    ]}
                  >
                    <TouchableOpacity
                      disabled={!isAvailable}
                      onPress={() => openStartModal(v)}
                    >
                      <View style={styles.vehicleCardHeader}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: SPACING.xs,
                          }}
                        >
                          <Image
                            source={ASSETS.vehiclePlaceholder}
                            style={styles.vehicleThumb}
                            resizeMode="cover"
                          />
                          <Text
                            style={[
                              styles.vehiclePlateBadge,
                              !isAvailable && { color: themeColors.text.muted },
                            ]}
                          >
                            {v.plate}
                          </Text>
                        </View>

                        {isAvailable ? (
                          <View style={styles.availableTag}>
                            <Ionicons
                              name="checkmark-circle"
                              size={12}
                              color={themeColors.semantic.success.main}
                            />
                            <Text style={styles.availableTagText}>DISPONÍVEL</Text>
                          </View>
                        ) : isInUse ? (
                          <View style={styles.inUseTag}>
                            <Ionicons
                              name="lock-closed"
                              size={12}
                              color={themeColors.semantic.info.main}
                            />
                            <Text style={styles.inUseTagText}>EM USO</Text>
                          </View>
                        ) : (
                          <View style={styles.maintenanceTag}>
                            <Ionicons
                              name="construct"
                              size={12}
                              color={themeColors.semantic.warning.main}
                            />
                            <Text style={styles.maintenanceTagText}>OFICINA</Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.vehicleName,
                          !isAvailable && { color: themeColors.text.secondary },
                        ]}
                      >
                        {v.brand} {v.model}
                      </Text>

                      <View style={styles.vehicleMetaRow}>
                        <Text style={styles.vehicleMeta}>Ano: {v.year}</Text>
                        <Text style={styles.vehicleMeta}>•</Text>
                        <Text style={styles.vehicleMeta}>
                          Odômetro: {v.currentMileage} km
                        </Text>
                      </View>

                      {isAvailable ? (
                        <View style={styles.startTripPrompt}>
                          <Text style={styles.startTripPromptText}>
                            Toque para Iniciar Rota & Checklist
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color={themeColors.brand.primary}
                          />
                        </View>
                      ) : (
                        <View style={styles.disabledTripPrompt}>
                          <Ionicons
                            name="lock-closed"
                            size={14}
                            color={themeColors.text.muted}
                          />
                          <Text style={styles.disabledTripPromptText}>
                            {isInUse
                              ? `Em trânsito: ${
                                  v.currentDriver?.name || 'Outro condutor'
                                }`
                              : 'Viatura em manutenção na oficina'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {!isDriver && !isInUse && (
                      <TouchableOpacity
                        style={[
                          styles.statusToggleBtn,
                          isAvailable
                            ? styles.statusToggleToMaint
                            : styles.statusToggleToAvail,
                        ]}
                        onPress={() => handleToggleVehicleStatus(v)}
                      >
                        <Ionicons
                          name={
                            isAvailable
                              ? 'construct-outline'
                              : 'checkmark-circle-outline'
                          }
                          size={15}
                          color={
                            isAvailable
                              ? themeColors.semantic.warning.main
                              : themeColors.semantic.success.main
                          }
                        />
                        <Text
                          style={[
                            styles.statusToggleText,
                            {
                              color: isAvailable
                                ? themeColors.semantic.warning.main
                                : themeColors.semantic.success.main,
                            },
                          ]}
                        >
                          {isAvailable
                            ? 'Enviar para Oficina (Manutenção)'
                            : 'Liberar da Oficina (Disponível)'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Controle de ponto CLT */}
      {activeTab === 'timeclock' && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <View style={styles.clockCard}>
            <Text style={styles.clockDate}>{safeFormatFullDate(currentTime)}</Text>
            <Text style={styles.clockTime}>{safeFormatTime(currentTime)}</Text>
            <View style={styles.cltTag}>
              <Ionicons
                name="document-text-outline"
                size={14}
                color={themeColors.semantic.success.main}
              />
              <Text style={styles.cltTagText}>
                Ponto Eletrônico CLT • Registro Manual
              </Text>
            </View>
          </View>

          {punchFeedback && (
            <View style={styles.feedbackBanner}>
              <Text style={styles.feedbackBannerText}>{punchFeedback}</Text>
            </View>
          )}

          <View style={styles.punchGrid}>
            <TouchableOpacity
              style={[
                styles.punchButton,
                { backgroundColor: themeColors.semantic.success.main },
              ]}
              onPress={() => handlePunchClock('ENTRADA')}
            >
              <Ionicons
                name="enter-outline"
                size={26}
                color={themeColors.text.inverse}
              />
              <Text style={styles.punchBtnTitle}>Entrada Turno</Text>
              <Text style={styles.punchBtnSub}>Início do Expediente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.punchButton,
                { backgroundColor: themeColors.semantic.warning.main },
              ]}
              onPress={() => handlePunchClock('ALMOCO_SAIDA')}
            >
              <Ionicons
                name="cafe-outline"
                size={26}
                color={themeColors.text.inverse}
              />
              <Text style={styles.punchBtnTitle}>Saída Almoço</Text>
              <Text style={styles.punchBtnSub}>Início do Intervalo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.punchButton,
                { backgroundColor: themeColors.semantic.info.main },
              ]}
              onPress={() => handlePunchClock('ALMOCO_RETORNO')}
            >
              <Ionicons
                name="restaurant-outline"
                size={26}
                color={themeColors.text.inverse}
              />
              <Text style={styles.punchBtnTitle}>Retorno Almoço</Text>
              <Text style={styles.punchBtnSub}>Fim do Intervalo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.punchButton,
                { backgroundColor: themeColors.semantic.danger.main },
              ]}
              onPress={() => handlePunchClock('SAIDA')}
            >
              <Ionicons
                name="exit-outline"
                size={26}
                color={themeColors.text.inverse}
              />
              <Text style={styles.punchBtnTitle}>Saída Turno</Text>
              <Text style={styles.punchBtnSub}>Fim do Expediente</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeading}>
            Minhas Batidas de Hoje ({todayPunches.length})
          </Text>

          {todayPunches.length === 0 ? (
            <View style={styles.emptyCard}>
              <Image
                source={ASSETS.emptyState}
                style={styles.emptyStateImage}
                resizeMode="cover"
              />
              <Text style={styles.emptyText}>
                Nenhuma batida efetuada hoje ainda.
              </Text>
            </View>
          ) : (
            todayPunches.map((p, idx) => {
              const labelMap: any = {
                ENTRADA: 'Entrada no Turno',
                ALMOCO_SAIDA: 'Saída para Almoço',
                ALMOCO_RETORNO: 'Retorno do Almoço',
                SAIDA: 'Saída do Expediente',
              };
              return (
                <View key={p.id || idx} style={styles.punchRecordItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={themeColors.brand.primary}
                    />
                    <View>
                      <Text style={styles.punchRecordType}>
                        {labelMap[p.type] || p.type}
                      </Text>
                      <Text style={styles.punchRecordSub}>
                        {p.isOffline
                          ? 'Gravado offline (sincronizado)'
                          : 'Gravado online no banco'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.punchRecordTime}>
                    {safeFormatTime(p.timestamp)}
                  </Text>
                </View>
              );
            })
          )}

          {!isDriver && (
            <View style={{ marginTop: SPACING.lg }}>
              <TouchableOpacity
                style={[
                  styles.addMgmtBtn,
                  {
                    backgroundColor: themeColors.semantic.success.main,
                    marginBottom: SPACING.sm,
                    marginTop: 0,
                  },
                ]}
                onPress={() => {
                  const tenantQuery = user?.tenantId
                    ? `?tenantId=${user.tenantId}`
                    : '';
                  Linking.openURL(
                    `${BASE_URL}/timeclock/export-xlsx${tenantQuery}`
                  ).catch(() => {
                    Alert.alert(
                      'Erro',
                      'Não foi possível abrir o download da planilha XLSX.'
                    );
                  });
                }}
              >
                <Ionicons
                  name="download-outline"
                  size={18}
                  color={themeColors.text.inverse}
                />
                <Text style={styles.addMgmtBtnText}>
                  Exportar Ponto dos Colaboradores (.xlsx)
                </Text>
              </TouchableOpacity>

              <Text style={styles.sectionHeading}>
                Espelho de Ponto CLT da Empresa ({allPunches.length})
              </Text>
              {allPunches.map((p, idx) => (
                <View key={p.id || idx} style={styles.punchRecordItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.punchRecordType}>{p.userName}</Text>
                    <Text style={styles.punchRecordSub}>
                      {p.type} • CPF: {p.userCpf}
                    </Text>
                  </View>
                  <Text style={styles.punchRecordTime}>
                    {safeFormatTime(p.timestamp)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Cadastro de funcionarios */}
      {activeTab === 'users' && !isDriver && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <View style={styles.noRouteHero}>
            <Ionicons
              name="people-outline"
              size={38}
              color={themeColors.semantic.success.main}
            />
            <Text style={styles.noRouteTitle}>
              Cadastros & Equipe da Empresa
            </Text>
            <Text style={styles.noRouteSub}>
              {user.role === 'ADMIN'
                ? 'Como Admin (Representante Legal), você cadastra Gestores de Frota e Motoristas definindo tipo e senha.'
                : 'Como Gestor de Frota, você tem permissão para cadastrar novos Motoristas Operacionais.'}
            </Text>
            <TouchableOpacity
              style={[
                styles.addMgmtBtn,
                { backgroundColor: themeColors.semantic.success.main },
              ]}
              onPress={() => {
                setUsrRole('DRIVER');
                setNewUserModalVisible(true);
              }}
            >
              <Ionicons
                name="person-add"
                size={18}
                color={themeColors.text.inverse}
              />
              <Text style={styles.addMgmtBtnText}>
                {user.role === 'ADMIN'
                  ? 'Cadastrar Gestor / Motorista'
                  : 'Cadastrar Motorista'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeading}>
            Colaboradores Cadastrados ({usersList.length})
          </Text>

          {usersList.map((u) => {
            const roleLabel =
              u.role === 'ADMIN'
                ? 'Admin (Representante Legal)'
                : u.role === 'FLEET_MANAGER'
                ? 'Gestor de Frota'
                : 'Motorista';
            const roleColor =
              u.role === 'ADMIN'
                ? themeColors.semantic.admin.main
                : u.role === 'FLEET_MANAGER'
                ? themeColors.semantic.info.main
                : themeColors.semantic.success.main;
            const roleIcon =
              u.role === 'ADMIN'
                ? 'shield-checkmark-outline'
                : u.role === 'FLEET_MANAGER'
                ? 'briefcase-outline'
                : 'car-sport-outline';

            return (
              <View key={u.id} style={styles.userMgmtCard}>
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: roleColor, marginRight: SPACING.sm },
                  ]}
                >
                  <Ionicons
                    name={roleIcon as any}
                    size={16}
                    color={themeColors.text.inverse}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userMgmtName}>{u.name}</Text>
                  <Text
                    style={[
                      styles.quickUserSub,
                      { color: roleColor, fontWeight: '800', marginTop: 2 },
                    ]}
                  >
                    {roleLabel}
                  </Text>
                  <Text style={styles.userMgmtMeta}>
                    CPF: {u.cpf} • Senha: {u.password || '123456'}
                  </Text>
                  <Text style={styles.userMgmtMeta}>{u.email}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Historico de viagens e relatorios */}
      {activeTab === 'history' && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          {isDriver ? (
            <View style={styles.privacyNoticeCard}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={themeColors.semantic.success.main}
              />
              <Text style={styles.privacyNoticeText}>
                Visualização Restrita: você tem acesso exclusivo às suas próprias rotas, checklists e intervalos.
              </Text>
            </View>
          ) : (
            <View>
              <View
                style={[
                  styles.privacyNoticeCard,
                  { borderColor: themeColors.brand.primary },
                ]}
              >
                <Ionicons
                  name="bar-chart"
                  size={20}
                  color={themeColors.brand.primary}
                />
                <Text style={styles.privacyNoticeText}>
                  Relatórios Gerenciais: histórico consolidado de rotas, quilometragem, checklists e ocorrências.
                </Text>
              </View>

              <View style={styles.reportKpiRow}>
                <View style={styles.reportKpiBox}>
                  <Text style={styles.reportKpiVal}>{driverTrips.length}</Text>
                  <Text style={styles.reportKpiLbl}>Viagens</Text>
                </View>
                <View style={styles.reportKpiBox}>
                  <Text
                    style={[
                      styles.reportKpiVal,
                      { color: themeColors.semantic.success.main },
                    ]}
                  >
                    {driverTrips.reduce(
                      (s, t) => s + (t.totalDistanceKm || 0),
                      0
                    )}{' '}
                    km
                  </Text>
                  <Text style={styles.reportKpiLbl}>Rodados</Text>
                </View>
                <View style={styles.reportKpiBox}>
                  <Text
                    style={[
                      styles.reportKpiVal,
                      { color: themeColors.semantic.warning.main },
                    ]}
                  >
                    {
                      vehicles.filter((v) => v.status === 'MAINTENANCE')
                        .length
                    }
                  </Text>
                  <Text style={styles.reportKpiLbl}>Oficina</Text>
                </View>
              </View>

              <View style={{ gap: SPACING.xs, marginBottom: SPACING.md }}>
                <TouchableOpacity
                  style={[
                    styles.addMgmtBtn,
                    {
                      backgroundColor: themeColors.semantic.success.main,
                      marginTop: 0,
                    },
                  ]}
                  onPress={() => {
                    const tenantQuery = user?.tenantId
                      ? `?tenantId=${user.tenantId}`
                      : '';
                    Linking.openURL(
                      `${BASE_URL}/checklists/export-xlsx${tenantQuery}`
                    ).catch(() => {
                      Alert.alert(
                        'Erro',
                        'Não foi possível abrir o download dos Checklists XLSX.'
                      );
                    });
                  }}
                >
                  <Ionicons
                    name="document-attach-outline"
                    size={18}
                    color={themeColors.text.inverse}
                  />
                  <Text style={styles.addMgmtBtnText}>
                    Exportar Relatório de Checklists (.xlsx)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.addMgmtBtn,
                    {
                      backgroundColor: themeColors.semantic.admin.main,
                      marginTop: 0,
                    },
                  ]}
                  onPress={() => {
                    const tenantQuery = user?.tenantId
                      ? `?tenantId=${user.tenantId}`
                      : '';
                    Linking.openURL(
                      `${BASE_URL}/timeclock/export-xlsx${tenantQuery}`
                    ).catch(() => {
                      Alert.alert(
                        'Erro',
                        'Não foi possível abrir o download do Ponto CLT XLSX.'
                      );
                    });
                  }}
                >
                  <Ionicons
                    name="download-outline"
                    size={18}
                    color={themeColors.text.inverse}
                  />
                  <Text style={styles.addMgmtBtnText}>
                    Exportar Relatório de Ponto CLT (.xlsx)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.sectionHeading}>
            {isDriver
              ? 'Minhas Rotas & Checklists Anteriores'
              : 'Relatório Geral de Viagens'}{' '}
            ({driverTrips.length})
          </Text>

          {driverTrips.length === 0 ? (
            <View style={styles.emptyCard}>
              <Image
                source={ASSETS.emptyState}
                style={styles.emptyStateImage}
                resizeMode="cover"
              />
              <Text style={styles.emptyText}>
                Nenhuma rota registrada até o momento.
              </Text>
            </View>
          ) : (
            driverTrips.map((trip: any) => {
              const startDt = new Date(trip.startTime);
              const endDt = trip.endTime ? new Date(trip.endTime) : null;
              const lunchStartDt = trip.lunchStartTime
                ? new Date(trip.lunchStartTime)
                : null;
              const lunchEndDt = trip.lunchEndTime
                ? new Date(trip.lunchEndTime)
                : null;

              return (
                <View key={trip.id} style={styles.tripHistoryCard}>
                  <View style={styles.tripHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tripDateTitle}>
                        {safeFormatShortDate(startDt)}{' '}
                        {!isDriver && trip.driver?.name
                          ? `• ${trip.driver.name}`
                          : ''}
                      </Text>
                      <Text style={styles.tripPlate}>
                        {trip.vehicle?.plate} • {trip.vehicle?.brand}{' '}
                        {trip.vehicle?.model}
                      </Text>
                    </View>
                    <View style={styles.kmBadge}>
                      <Text style={styles.kmBadgeText}>
                        +{trip.totalDistanceKm} km
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tripTimeBox}>
                    <View style={styles.timeDetailCol}>
                      <Text style={styles.timeDetailLabel}>SAÍDA</Text>
                      <Text style={styles.timeDetailVal}>
                        {safeFormatShortTime(startDt)}
                      </Text>
                      <Text style={styles.timeDetailKm}>
                        Km: {trip.entryChecklist?.mileage || '-'}
                      </Text>
                    </View>

                    <View style={styles.timeDetailCol}>
                      <Text style={styles.timeDetailLabel}>ALMOÇO</Text>
                      <Text style={styles.timeDetailVal}>
                        {lunchStartDt && lunchEndDt
                          ? `${safeFormatShortTime(
                              lunchStartDt
                            )} - ${safeFormatShortTime(lunchEndDt)}`
                          : trip.totalLunchMinutes > 0
                          ? `${trip.totalLunchMinutes} min`
                          : 'Sem Pausa'}
                      </Text>
                      <Text style={styles.timeDetailKm}>Intervalo</Text>
                    </View>

                    <View style={styles.timeDetailCol}>
                      <Text style={styles.timeDetailLabel}>DEVOLUÇÃO</Text>
                      <Text style={styles.timeDetailVal}>
                        {endDt ? safeFormatShortTime(endDt) : 'Em Aberto'}
                      </Text>
                      <Text style={styles.timeDetailKm}>
                        Km: {trip.exitChecklist?.mileage || '-'}
                      </Text>
                    </View>
                  </View>

                  {trip.entryChecklist?.observation ? (
                    <View style={styles.observationRow}>
                      <Text style={styles.obsLabel}>Nota Checklist Saída:</Text>
                      <Text style={styles.obsText}>
                        {trip.entryChecklist.observation}
                      </Text>
                    </View>
                  ) : null}

                  {trip.exitChecklist?.observation ? (
                    <View style={styles.observationRow}>
                      <Text style={styles.obsLabel}>
                        Considerações de Devolução:
                      </Text>
                      <Text style={styles.obsText}>
                        {trip.exitChecklist.observation}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Check list preenchimento (saida e devolucao) */}
      <Modal visible={startModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Checklist de Saída</Text>
                <Text style={styles.modalSub}>
                  {selectedVehicle?.brand} {selectedVehicle?.model} (
                  {selectedVehicle?.plate})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setStartModalVisible(false)}>
                <Ionicons
                  name="close-circle"
                  size={26}
                  color={themeColors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>
                Odômetro Atual do Painel (Km) *
              </Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={odometerInput}
                onChangeText={setOdometerInput}
                placeholder="Ex: 45200"
                placeholderTextColor={themeColors.text.muted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>
                Checagem Rápida (Toque para Alternar OK / Problema):
              </Text>

              {[
                { key: 'fuel', label: 'Nível de Combustível & Tanque' },
                { key: 'tires', label: 'Estado dos Pneus & Calibragem' },
                { key: 'bodywork', label: 'Lataria & Vidros (Avarias/Riscos)' },
                { key: 'lights', label: 'Faróis, Lanternas & Giroflex' },
                { key: 'docs', label: 'Documentação CRLV & Chave de Roda' },
              ].map((item) => {
                const isOk = checklistItems[item.key];
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.checklistItemRow,
                      !isOk && styles.checklistItemRowProblem,
                    ]}
                    onPress={() =>
                      setChecklistItems((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }))
                    }
                  >
                    <Text style={styles.checkItemText}>{item.label}</Text>
                    <View
                      style={[
                        styles.checkStatusBadge,
                        isOk ? styles.badgeOk : styles.badgeProblem,
                      ]}
                    >
                      <Text style={styles.checkStatusText}>
                        {isOk ? 'OK' : 'PROBLEMA'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.inputLabel, { marginTop: SPACING.sm }]}>
                Observações de Saída (Opcional):
              </Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                multiline
                value={observationInput}
                onChangeText={setObservationInput}
                placeholder="Informe notas antes de sair com a viatura..."
                placeholderTextColor={themeColors.text.muted}
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.confirmModalBtn}
              onPress={handleConfirmStart}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={themeColors.text.inverse}
                style={{ marginRight: SPACING.xs }}
              />
              <Text style={styles.confirmModalBtnText}>
                Confirmar Checklist & Iniciar Rota
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={finishModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Checklist de Devolução</Text>
                <Text style={styles.modalSub}>
                  Finalizar rota e entregar viatura
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFinishModalVisible(false)}>
                <Ionicons
                  name="close-circle"
                  size={26}
                  color={themeColors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>
                Odômetro Final do Painel (Km) *
              </Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={odometerInput}
                onChangeText={setOdometerInput}
                placeholder="Informe o Km final"
                placeholderTextColor={themeColors.text.muted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>
                Checagem no Retorno (Indique se houve avaria):
              </Text>

              {[
                { key: 'fuel', label: 'Combustível entregue' },
                { key: 'tires', label: 'Pneus e estepe íntegros' },
                { key: 'bodywork', label: 'Lataria (Houve nova avaria/risco?)' },
                { key: 'lights', label: 'Faróis e lanternas íntegros' },
                { key: 'docs', label: 'Documentação CRLV devolvida' },
              ].map((item) => {
                const isOk = checklistItems[item.key];
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.checklistItemRow,
                      !isOk && styles.checklistItemRowProblem,
                    ]}
                    onPress={() =>
                      setChecklistItems((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }))
                    }
                  >
                    <Text style={styles.checkItemText}>{item.label}</Text>
                    <View
                      style={[
                        styles.checkStatusBadge,
                        isOk ? styles.badgeOk : styles.badgeProblem,
                      ]}
                    >
                      <Text style={styles.checkStatusText}>
                        {isOk ? 'OK' : 'AVARIA'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.inputLabel, { marginTop: SPACING.sm }]}>
                Considerações Finais / Relato:
              </Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                multiline
                value={observationInput}
                onChangeText={setObservationInput}
                placeholder="Descreva detalhes ou considerações da viagem..."
                placeholderTextColor={themeColors.text.muted}
              />
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.confirmModalBtn,
                { backgroundColor: themeColors.semantic.danger.main },
              ]}
              onPress={handleConfirmFinish}
            >
              <Ionicons
                name="flag"
                size={20}
                color={themeColors.text.inverse}
                style={{ marginRight: SPACING.xs }}
              />
              <Text style={styles.confirmModalBtnText}>
                Confirmar Devolução & Finalizar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cadastro de veiculos */}
      <Modal
        visible={newVehicleModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Cadastrar Novo Veículo</Text>
                <Text style={styles.modalSub}>
                  Inclusão direta na frota da empresa
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setNewVehicleModalVisible(false)}
              >
                <Ionicons
                  name="close-circle"
                  size={26}
                  color={themeColors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Placa do Veículo *</Text>
              <TextInput
                style={styles.textInput}
                value={vehPlate}
                onChangeText={setVehPlate}
                autoCapitalize="characters"
                placeholder="Ex: TAP7G07"
                placeholderTextColor={themeColors.text.muted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.sm }]}>
                Marca *
              </Text>
              <TextInput
                style={styles.textInput}
                value={vehBrand}
                onChangeText={setVehBrand}
                placeholder="Ex: Fiat"
                placeholderTextColor={themeColors.text.muted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.sm }]}>
                Modelo *
              </Text>
              <TextInput
                style={styles.textInput}
                value={vehModel}
                onChangeText={setVehModel}
                placeholder="Ex: Toro Volcano 2.0"
                placeholderTextColor={themeColors.text.muted}
              />

              <View
                style={{
                  flexDirection: 'row',
                  gap: SPACING.sm,
                  marginTop: SPACING.sm,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Ano</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={vehYear}
                    onChangeText={setVehYear}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Odômetro (Km)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={vehMileage}
                    onChangeText={setVehMileage}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: SPACING.sm }]}>
                Status Inicial
              </Text>
              <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                <TouchableOpacity
                  style={[
                    styles.roleOptionChip,
                    vehStatus === 'AVAILABLE' && {
                      backgroundColor: themeColors.semantic.success.main,
                      borderColor: themeColors.semantic.success.main,
                    },
                  ]}
                  onPress={() => setVehStatus('AVAILABLE')}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      vehStatus === 'AVAILABLE' && {
                        color: themeColors.text.inverse,
                      },
                    ]}
                  >
                    Disponível
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOptionChip,
                    vehStatus === 'MAINTENANCE' && {
                      backgroundColor: themeColors.semantic.warning.main,
                      borderColor: themeColors.semantic.warning.main,
                    },
                  ]}
                  onPress={() => setVehStatus('MAINTENANCE')}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      vehStatus === 'MAINTENANCE' && {
                        color: themeColors.text.inverse,
                      },
                    ]}
                  >
                    Oficina
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.confirmModalBtn}
              onPress={handleCreateVehicle}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={themeColors.text.inverse}
                style={{ marginRight: SPACING.xs }}
              />
              <Text style={styles.confirmModalBtnText}>Salvar Veículo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cadastro de funcionarios (modal) */}
      <Modal
        visible={newUserModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {user.role === 'ADMIN'
                    ? 'Cadastrar Colaborador'
                    : 'Cadastrar Motorista'}
                </Text>
                <Text style={styles.modalSub}>
                  {user.role === 'ADMIN'
                    ? 'Defina o tipo de acesso (Gestor ou Motorista)'
                    : 'Gestores cadastram apenas Motoristas'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setNewUserModalVisible(false)}>
                <Ionicons
                  name="close-circle"
                  size={26}
                  color={themeColors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Nome Completo *</Text>
              <TextInput
                style={styles.textInput}
                value={usrName}
                onChangeText={setUsrName}
                placeholder="Ex: João Pedro Ferreira"
                placeholderTextColor={themeColors.text.muted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.sm }]}>
                CPF *
              </Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={usrCpf}
                onChangeText={setUsrCpf}
                placeholder="Ex: 777.777.777-77"
                placeholderTextColor={themeColors.text.muted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.sm }]}>
                E-mail (Opcional)
              </Text>
              <TextInput
                style={styles.textInput}
                autoCapitalize="none"
                value={usrEmail}
                onChangeText={setUsrEmail}
                placeholder="joao@testeapresentacao.com.br"
                placeholderTextColor={themeColors.text.muted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.sm }]}>
                Senha Inicial (Padrão: 123456)
              </Text>
              <TextInput
                style={styles.textInput}
                value={usrPassword}
                onChangeText={setUsrPassword}
                placeholder="Deixe vazio para usar 123456"
                placeholderTextColor={themeColors.text.muted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.sm }]}>
                Tipo / Permissão de Acesso *
              </Text>
              {user.role === 'FLEET_MANAGER' ? (
                <View style={styles.permissionBox}>
                  <Text style={styles.permissionBoxText}>
                    Motorista Operacional (Restrito: Gestores de Frota podem cadastrar apenas Motoristas; apenas o Admin cadastra outros Gestores).
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    gap: SPACING.xs,
                    flexWrap: 'wrap',
                  }}
                >
                  {(
                    [
                      {
                        key: 'DRIVER',
                        label: 'Motorista',
                        color: themeColors.semantic.success.main,
                      },
                      {
                        key: 'FLEET_MANAGER',
                        label: 'Gestor',
                        color: themeColors.semantic.info.main,
                      },
                      {
                        key: 'ADMIN',
                        label: 'Admin',
                        color: themeColors.semantic.admin.main,
                      },
                    ] as const
                  ).map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.roleOptionChip,
                        usrRole === opt.key && {
                          backgroundColor: opt.color,
                          borderColor: opt.color,
                        },
                      ]}
                      onPress={() => setUsrRole(opt.key)}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          usrRole === opt.key && {
                            color: themeColors.text.inverse,
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.confirmModalBtn}
              onPress={handleCreateUser}
            >
              <Ionicons
                name="person-add"
                size={20}
                color={themeColors.text.inverse}
                style={{ marginRight: SPACING.xs }}
              />
              <Text style={styles.confirmModalBtnText}>Salvar Cadastro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Barra Inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'route' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('route')}
        >
          <Ionicons
            name={activeTab === 'route' ? 'car' : 'car-outline'}
            size={21}
            color={
              activeTab === 'route'
                ? themeColors.brand.primary
                : themeColors.text.secondary
            }
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'route' && styles.navTextActive,
            ]}
          >
            {isDriver ? 'Iniciar Rota' : 'Frota'}
          </Text>
        </TouchableOpacity>

        {!isDriver && (
          <TouchableOpacity
            style={[
              styles.navItem,
              activeTab === 'users' && styles.navItemActive,
            ]}
            onPress={() => setActiveTab('users')}
          >
            <Ionicons
              name={activeTab === 'users' ? 'people' : 'people-outline'}
              size={21}
              color={
                activeTab === 'users'
                  ? themeColors.semantic.admin.main
                  : themeColors.text.secondary
              }
            />
            <Text
              style={[
                styles.navText,
                activeTab === 'users' && {
                  color: themeColors.semantic.admin.main,
                  fontWeight: '700',
                },
              ]}
            >
              Cadastros
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'timeclock' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('timeclock')}
        >
          <Ionicons
            name={activeTab === 'timeclock' ? 'time' : 'time-outline'}
            size={21}
            color={
              activeTab === 'timeclock'
                ? themeColors.semantic.success.main
                : themeColors.text.secondary
            }
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'timeclock' && {
                color: themeColors.semantic.success.main,
                fontWeight: '700',
              },
            ]}
          >
            Ponto CLT
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'history' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons
            name={
              activeTab === 'history'
                ? 'document-text'
                : 'document-text-outline'
            }
            size={21}
            color={
              activeTab === 'history'
                ? themeColors.semantic.warning.main
                : themeColors.text.secondary
            }
          />
          <Text
            style={[
              styles.navText,
              activeTab === 'history' && {
                color: themeColors.semantic.warning.main,
                fontWeight: '700',
              },
            ]}
          >
            {isDriver ? 'Histórico' : 'Relatórios'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Estilos da interface
function createStyles(themeColors: ThemeTokens) {
  return StyleSheet.create({
    darkContainer: {
      flex: 1,
      backgroundColor: themeColors.surfaces.background,
    },
    loginContent: {
      padding: SPACING.xl,
      justifyContent: 'center',
      minHeight: '100%',
    },
    brandHeader: {
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    logoFrame: {
      width: 148,
      height: 148,
      borderRadius: RADIUS.xl,
      backgroundColor: themeColors.surfaces.logoContainer,
      borderWidth: 1,
      borderColor: themeColors.brand.primaryBorder,
      padding: SPACING.xs,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginBottom: SPACING.xs,
    },
    logoImage: {
      width: '100%',
      height: '100%',
      borderRadius: RADIUS.lg,
    },
    pillarsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: SPACING.xs,
      marginTop: SPACING.sm,
    },
    pillarPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xxs,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xxs,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      backgroundColor: themeColors.surfaces.card,
      borderColor: themeColors.surfaces.border,
    },
    pillarText: {
      fontSize: TYPOGRAPHY.tiny,
      fontWeight: '700',
      color: themeColors.text.secondary,
    },
    themePickerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: SPACING.xs,
      marginBottom: SPACING.md,
    },
    themeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
    },
    themeChipText: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: '800',
    },
    brandTitle: {
      fontSize: TYPOGRAPHY.display,
      fontWeight: '900',
      fontStyle: 'italic',
      color: themeColors.text.primary,
      letterSpacing: 1.5,
    },
    brandSubtitle: {
      fontSize: TYPOGRAPHY.tiny,
      color: themeColors.text.secondary,
      marginTop: SPACING.xxs,
      textAlign: 'center',
    },
    card: {
      backgroundColor: themeColors.surfaces.card,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
      marginBottom: SPACING.md,
    },
    cardTitle: {
      fontSize: TYPOGRAPHY.h3,
      fontWeight: '700',
      color: themeColors.text.primary,
      marginBottom: SPACING.sm,
    },
    inputLabel: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: '600',
      color: themeColors.text.secondary,
      marginBottom: SPACING.xs,
    },
    inputTip: {
      fontSize: TYPOGRAPHY.tiny,
      color: themeColors.semantic.warning.main,
      fontWeight: '600',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surfaces.input,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
      paddingHorizontal: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    textInput: {
      flex: 1,
      height: 44,
      color: themeColors.text.primary,
      fontSize: TYPOGRAPHY.body,
    },
    primaryButton: {
      flexDirection: 'row',
      backgroundColor: themeColors.brand.primary,
      height: 48,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.xs,
    },
    primaryButtonText: {
      color: themeColors.text.inverse,
      fontSize: TYPOGRAPHY.h3,
      fontWeight: '700',
    },
    quickCard: {
      backgroundColor: themeColors.surfaces.card,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
    },
    quickHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.xxs,
    },
    quickTitle: {
      color: themeColors.semantic.warning.main,
      fontWeight: '800',
      fontSize: TYPOGRAPHY.bodySm,
      marginLeft: SPACING.xs,
    },
    quickDesc: {
      color: themeColors.text.secondary,
      fontSize: TYPOGRAPHY.caption,
      marginBottom: SPACING.sm,
    },
    quickUserItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surfaces.input,
      padding: SPACING.sm,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.xs,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
    },
    avatarCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickUserName: {
      color: themeColors.text.primary,
      fontWeight: '700',
      fontSize: TYPOGRAPHY.bodySm,
    },
    quickUserSub: {
      fontSize: TYPOGRAPHY.tiny,
      color: themeColors.text.secondary,
    },
    serverConfigToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.md,
    },
    serverConfigToggleText: {
      color: themeColors.text.secondary,
      fontSize: TYPOGRAPHY.caption,
      marginLeft: SPACING.xs,
      textDecorationLine: 'underline',
    },
    serverConfigBox: {
      backgroundColor: themeColors.surfaces.card,
      padding: SPACING.md,
      borderRadius: RADIUS.md,
      marginTop: SPACING.sm,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
    },
    serverPresetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xxs,
      backgroundColor: themeColors.surfaces.input,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
    },
    serverPresetText: {
      color: themeColors.text.secondary,
      fontSize: TYPOGRAPHY.tiny,
      fontWeight: '600',
    },
    saveServerBtn: {
      backgroundColor: themeColors.brand.primary,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.sm,
      alignItems: 'center',
      marginTop: SPACING.xs,
    },
    saveServerBtnText: {
      color: themeColors.text.inverse,
      fontWeight: '600',
      fontSize: TYPOGRAPHY.caption,
    },

    // Top Bar
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: themeColors.surfaces.card,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.surfaces.border,
    },
    topBarLogo: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.sm,
      marginRight: SPACING.sm,
      backgroundColor: themeColors.surfaces.logoContainer,
    },
    topBarLeft: {
      flex: 1,
    },
    topBarName: {
      fontSize: TYPOGRAPHY.h3,
      fontWeight: '800',
      color: themeColors.text.primary,
    },
    topBarTenant: {
      fontSize: TYPOGRAPHY.caption,
      color: themeColors.text.secondary,
    },
    topBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    offlineChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surfaces.input,
      paddingHorizontal: SPACING.xs,
      paddingVertical: SPACING.xxs,
      borderRadius: RADIUS.pill,
      marginRight: SPACING.xs,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
    },
    offlineChipActive: {
      borderColor: themeColors.semantic.warning.main,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: SPACING.xxs,
    },
    offlineChipText: {
      fontSize: TYPOGRAPHY.tiny,
      color: themeColors.text.primary,
      fontWeight: '600',
    },
    logoutBtn: {
      padding: SPACING.xs,
    },
    offlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.semantic.warning.pressed,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.md,
    },
    offlineBannerText: {
      color: themeColors.text.inverse,
      fontSize: TYPOGRAPHY.caption,
      fontWeight: '700',
      marginLeft: SPACING.xs,
    },

    tabContent: {
      padding: SPACING.md,
      paddingBottom: 96,
    },
    sectionHeading: {
      fontSize: TYPOGRAPHY.h3,
      fontWeight: '800',
      color: themeColors.text.primary,
      marginBottom: SPACING.sm,
      marginTop: SPACING.xs,
    },

    // Rota Ativa
    activeRouteCard: {
      backgroundColor: themeColors.surfaces.card,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: themeColors.semantic.success.border,
    },
    routeHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xxs,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xxs,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
    },
    pillRoute: {
      backgroundColor: themeColors.semantic.success.bg,
      borderColor: themeColors.semantic.success.border,
    },
    pillLunch: {
      backgroundColor: themeColors.semantic.warning.bg,
      borderColor: themeColors.semantic.warning.border,
    },
    statusPillText: {
      color: themeColors.semantic.success.main,
      fontWeight: '800',
      fontSize: TYPOGRAPHY.tiny,
    },
    routePlate: {
      fontSize: TYPOGRAPHY.h3,
      fontWeight: '900',
      color: themeColors.brand.primary,
    },
    routeModel: {
      fontSize: TYPOGRAPHY.h2,
      fontWeight: '700',
      color: themeColors.text.primary,
      marginTop: SPACING.xs,
    },
    timerDisplayBox: {
      backgroundColor: themeColors.surfaces.input,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      alignItems: 'center',
      marginVertical: SPACING.md,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
    },
    timerLabel: {
      fontSize: TYPOGRAPHY.tiny,
      fontWeight: '700',
      color: themeColors.text.secondary,
      letterSpacing: 1,
    },
    timerValue: {
      fontSize: TYPOGRAPHY.display,
      fontWeight: '900',
      color: themeColors.semantic.success.main,
      marginVertical: SPACING.xxs,
      fontVariant: ['tabular-nums'],
    },
    timerSub: {
      fontSize: TYPOGRAPHY.caption,
      color: themeColors.semantic.warning.main,
    },
    routeActionsGrid: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    pauseLunchBtn: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: themeColors.semantic.warning.pressed,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resumeLunchBtn: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: themeColors.semantic.success.main,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    finishRouteBtn: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: themeColors.semantic.danger.main,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnActionText: {
      color: themeColors.text.inverse,
      fontWeight: '700',
      fontSize: TYPOGRAPHY.caption,
      marginLeft: SPACING.xs,
    },

    // Hero Sem Rota
    noRouteHero: {
      backgroundColor: themeColors.surfaces.card,
      padding: SPACING.lg,
      borderRadius: RADIUS.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
      marginBottom: SPACING.md,
    },
    heroBannerImage: {
      width: '100%',
      height: 112,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.sm,
      backgroundColor: themeColors.surfaces.logoContainer,
    },
    noRouteTitle: {
      fontSize: TYPOGRAPHY.h3,
      fontWeight: '800',
      color: themeColors.text.primary,
      marginTop: SPACING.xs,
    },
    noRouteSub: {
      fontSize: TYPOGRAPHY.caption,
      color: themeColors.text.secondary,
      textAlign: 'center',
      marginTop: SPACING.xxs,
      lineHeight: 16,
    },

    // Cards de Veículos
    vehicleCard: {
      backgroundColor: themeColors.surfaces.card,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
      marginBottom: SPACING.sm,
    },
    vehicleCardDisabled: {
      backgroundColor: themeColors.surfaces.disabled,
      borderColor: themeColors.surfaces.border,
      opacity: 0.65,
    },
    vehicleCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    vehicleThumb: {
      width: 44,
      height: 32,
      borderRadius: RADIUS.xs,
      backgroundColor: themeColors.surfaces.logoContainer,
    },
    vehiclePlateBadge: {
      fontSize: TYPOGRAPHY.h3,
      fontWeight: '900',
      color: themeColors.brand.primary,
    },
    availableTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xxs,
      backgroundColor: themeColors.semantic.success.bg,
      borderWidth: 1,
      borderColor: themeColors.semantic.success.border,
      paddingHorizontal: SPACING.xs,
      paddingVertical: SPACING.xxs,
      borderRadius: RADIUS.xs,
    },
    availableTagText: {
      color: themeColors.semantic.success.main,
      fontWeight: '800',
      fontSize: TYPOGRAPHY.tiny,
    },
    inUseTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xxs,
      backgroundColor: themeColors.semantic.info.bg,
      borderWidth: 1,
      borderColor: themeColors.semantic.info.border,
      paddingHorizontal: SPACING.xs,
      paddingVertical: SPACING.xxs,
      borderRadius: RADIUS.xs,
    },
    inUseTagText: {
      color: themeColors.semantic.info.main,
      fontWeight: '700',
      fontSize: TYPOGRAPHY.tiny,
    },
    maintenanceTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xxs,
      backgroundColor: themeColors.semantic.warning.bg,
      borderWidth: 1,
      borderColor: themeColors.semantic.warning.border,
      paddingHorizontal: SPACING.xs,
      paddingVertical: SPACING.xxs,
      borderRadius: RADIUS.xs,
    },
    maintenanceTagText: {
      color: themeColors.semantic.warning.main,
      fontWeight: '700',
      fontSize: TYPOGRAPHY.tiny,
    },
    vehicleName: {
      fontSize: TYPOGRAPHY.h3,
      fontWeight: '700',
      color: themeColors.text.primary,
      marginTop: SPACING.xs,
    },
    vehicleMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      marginTop: 2,
    },
    vehicleMeta: {
      fontSize: TYPOGRAPHY.caption,
      color: themeColors.text.secondary,
    },
    startTripPrompt: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: themeColors.surfaces.input,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
      marginTop: SPACING.sm,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.sm,
    },
    startTripPromptText: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: '700',
      color: themeColors.brand.primary,
    },
    disabledTripPrompt: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surfaces.input,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
      marginTop: SPACING.sm,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.sm,
      gap: SPACING.xs,
    },
    disabledTripPromptText: {
      fontSize: TYPOGRAPHY.tiny,
      color: themeColors.text.muted,
      fontWeight: '600',
    },

    // Ponto CLT
    clockCard: {
      backgroundColor: themeColors.surfaces.card,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
      marginBottom: SPACING.md,
    },
    clockDate: {
      fontSize: TYPOGRAPHY.caption,
      color: themeColors.text.secondary,
      textTransform: 'capitalize',
    },
    clockTime: {
      fontSize: 40,
      fontWeight: '900',
      color: themeColors.text.primary,
      marginVertical: SPACING.xxs,
      fontVariant: ['tabular-nums'],
    },
    cltTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.semantic.success.bg,
      borderWidth: 1,
      borderColor: themeColors.semantic.success.border,
      paddingHorizontal: SPACING.xs,
      paddingVertical: SPACING.xxs,
      borderRadius: RADIUS.pill,
    },
    cltTagText: {
      color: themeColors.semantic.success.main,
      fontSize: TYPOGRAPHY.tiny,
      fontWeight: '600',
      marginLeft: SPACING.xxs,
    },
    feedbackBanner: {
      backgroundColor: themeColors.semantic.success.main,
      padding: SPACING.sm,
      borderRadius: RADIUS.sm,
      marginBottom: SPACING.md,
    },
    feedbackBannerText: {
      color: themeColors.text.inverse,
      fontWeight: '700',
      fontSize: TYPOGRAPHY.caption,
      textAlign: 'center',
    },
    punchGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    punchButton: {
      width: '48%',
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 96,
    },
    punchBtnTitle: {
      color: themeColors.text.inverse,
      fontWeight: '800',
      fontSize: TYPOGRAPHY.body,
      marginTop: SPACING.xs,
    },
    punchBtnSub: {
      color: themeColors.text.inverse,
      opacity: 0.85,
      fontSize: TYPOGRAPHY.tiny,
      marginTop: 2,
    },
    punchRecordItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: themeColors.surfaces.card,
      padding: SPACING.md,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.xs,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
    },
    punchRecordType: {
      color: themeColors.text.primary,
      fontWeight: '700',
      fontSize: TYPOGRAPHY.bodySm,
    },
    punchRecordSub: {
      color: themeColors.text.secondary,
      fontSize: TYPOGRAPHY.tiny,
    },
    punchRecordTime: {
      fontSize: TYPOGRAPHY.h3,
      fontWeight: '900',
      color: themeColors.brand.primary,
    },

    // Histórico Restrito
    privacyNoticeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surfaces.card,
      padding: SPACING.sm,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: themeColors.semantic.success.border,
      marginBottom: SPACING.md,
      gap: SPACING.xs,
    },
    privacyNoticeText: {
      flex: 1,
      color: themeColors.text.primary,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: 16,
    },
    tripHistoryCard: {
      backgroundColor: themeColors.surfaces.card,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
      marginBottom: SPACING.sm,
    },
    tripHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    tripDateTitle: {
      fontSize: TYPOGRAPHY.body,
      fontWeight: '800',
      color: themeColors.text.primary,
      textTransform: 'capitalize',
    },
    tripPlate: {
      fontSize: TYPOGRAPHY.caption,
      color: themeColors.brand.primary,
      fontWeight: '700',
      marginTop: 2,
    },
    kmBadge: {
      backgroundColor: themeColors.semantic.success.bg,
      borderWidth: 1,
      borderColor: themeColors.semantic.success.border,
      paddingHorizontal: SPACING.xs,
      paddingVertical: SPACING.xxs,
      borderRadius: RADIUS.xs,
    },
    kmBadgeText: {
      color: themeColors.semantic.success.main,
      fontWeight: '900',
      fontSize: TYPOGRAPHY.caption,
    },
    tripTimeBox: {
      flexDirection: 'row',
      backgroundColor: themeColors.surfaces.input,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      marginVertical: SPACING.sm,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
    },
    timeDetailCol: {
      flex: 1,
      alignItems: 'center',
    },
    timeDetailLabel: {
      fontSize: TYPOGRAPHY.tiny,
      fontWeight: '800',
      color: themeColors.text.secondary,
      letterSpacing: 0.5,
    },
    timeDetailVal: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: '800',
      color: themeColors.text.primary,
      marginTop: 2,
    },
    timeDetailKm: {
      fontSize: TYPOGRAPHY.tiny,
      color: themeColors.text.muted,
      marginTop: 1,
    },
    observationRow: {
      backgroundColor: themeColors.surfaces.input,
      padding: SPACING.xs,
      borderRadius: RADIUS.xs,
      marginTop: SPACING.xs,
    },
    obsLabel: {
      fontSize: TYPOGRAPHY.tiny,
      fontWeight: '700',
      color: themeColors.text.secondary,
    },
    obsText: {
      fontSize: TYPOGRAPHY.caption,
      color: themeColors.text.primary,
      marginTop: 2,
    },
    emptyCard: {
      backgroundColor: themeColors.surfaces.card,
      padding: SPACING.lg,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
      alignItems: 'center',
    },
    emptyStateImage: {
      width: 84,
      height: 84,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.sm,
      backgroundColor: themeColors.surfaces.logoContainer,
    },
    emptyText: {
      color: themeColors.text.secondary,
      fontSize: TYPOGRAPHY.caption,
    },

    // Modais
    modalOverlay: {
      flex: 1,
      backgroundColor: themeColors.surfaces.overlay,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: themeColors.surfaces.card,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.md,
    },
    modalTitle: {
      fontSize: TYPOGRAPHY.h2,
      fontWeight: '900',
      color: themeColors.text.primary,
    },
    modalSub: {
      fontSize: TYPOGRAPHY.caption,
      color: themeColors.brand.primary,
      marginTop: 2,
    },
    checklistItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: themeColors.surfaces.input,
      padding: SPACING.sm,
      borderRadius: RADIUS.sm,
      marginBottom: SPACING.xs,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
    },
    checklistItemRowProblem: {
      borderColor: themeColors.semantic.danger.border,
      backgroundColor: themeColors.semantic.danger.bg,
    },
    checkItemText: {
      color: themeColors.text.primary,
      fontSize: TYPOGRAPHY.caption,
      fontWeight: '600',
      flex: 1,
    },
    checkStatusBadge: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xxs,
      borderRadius: RADIUS.xs,
    },
    badgeOk: {
      backgroundColor: themeColors.semantic.success.main,
    },
    badgeProblem: {
      backgroundColor: themeColors.semantic.danger.main,
    },
    checkStatusText: {
      color: themeColors.text.inverse,
      fontWeight: '900',
      fontSize: TYPOGRAPHY.tiny,
    },
    confirmModalBtn: {
      flexDirection: 'row',
      backgroundColor: themeColors.semantic.success.main,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.md,
    },
    confirmModalBtnText: {
      color: themeColors.text.inverse,
      fontWeight: '800',
      fontSize: TYPOGRAPHY.body,
    },

    // Bottom Nav
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 64,
      backgroundColor: themeColors.surfaces.card,
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: themeColors.surfaces.border,
      paddingBottom: SPACING.xs,
    },
    navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navItemActive: {
      borderTopWidth: 2,
      borderTopColor: themeColors.brand.primary,
    },
    navText: {
      fontSize: TYPOGRAPHY.tiny,
      fontWeight: '600',
      color: themeColors.text.secondary,
      marginTop: SPACING.xxs,
    },
    navTextActive: {
      color: themeColors.brand.primary,
      fontWeight: '700',
    },

    // Estilos dos modais e listagens
    permissionBox: {
      backgroundColor: themeColors.surfaces.input,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    permissionBoxText: {
      color: themeColors.text.secondary,
      fontSize: TYPOGRAPHY.caption,
      lineHeight: 16,
    },
    addMgmtBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.brand.secondary,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.md,
      marginTop: SPACING.sm,
      gap: SPACING.xs,
    },
    addMgmtBtnText: {
      color: themeColors.text.inverse,
      fontSize: TYPOGRAPHY.caption,
      fontWeight: '800',
    },
    statusToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      marginTop: SPACING.sm,
      gap: SPACING.xs,
    },
    statusToggleToMaint: {
      backgroundColor: themeColors.semantic.warning.bg,
      borderColor: themeColors.semantic.warning.border,
    },
    statusToggleToAvail: {
      backgroundColor: themeColors.semantic.success.bg,
      borderColor: themeColors.semantic.success.border,
    },
    statusToggleText: {
      fontSize: TYPOGRAPHY.caption,
      fontWeight: '700',
    },
    userMgmtCard: {
      backgroundColor: themeColors.surfaces.card,
      padding: SPACING.md,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.xs,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    userMgmtName: {
      color: themeColors.text.primary,
      fontSize: TYPOGRAPHY.body,
      fontWeight: '700',
    },
    userMgmtMeta: {
      color: themeColors.text.secondary,
      fontSize: TYPOGRAPHY.caption,
      marginTop: 2,
    },
    reportKpiRow: {
      flexDirection: 'row',
      gap: SPACING.xs,
      marginBottom: SPACING.md,
    },
    reportKpiBox: {
      flex: 1,
      backgroundColor: themeColors.surfaces.card,
      padding: SPACING.sm,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
      alignItems: 'center',
    },
    reportKpiVal: {
      color: themeColors.text.primary,
      fontSize: TYPOGRAPHY.h3,
      fontWeight: '900',
    },
    reportKpiLbl: {
      color: themeColors.text.secondary,
      fontSize: TYPOGRAPHY.tiny,
      fontWeight: '700',
      marginTop: 2,
    },
    roleOptionChip: {
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: RADIUS.sm,
      backgroundColor: themeColors.surfaces.input,
      borderWidth: 1,
      borderColor: themeColors.surfaces.border,
    },
    roleOptionText: {
      color: themeColors.text.primary,
      fontSize: TYPOGRAPHY.caption,
      fontWeight: '700',
    },
  });
}

export default function App() {
  return (
    <RootErrorBoundary>
      <MainApp />
    </RootErrorBoundary>
  );
}
