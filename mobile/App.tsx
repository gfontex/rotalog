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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, BASE_URL, setCustomApiUrl } from './src/services/api';
import { offlineQueue } from './src/services/offlineQueue';

// Interface do Usuario Autenticado
interface UserProfile {
  id: string;
  name: string;
  cpf: string;
  role: 'ADMIN' | 'FLEET_MANAGER' | 'DRIVER' | string;
  tenantName: string;
  branchName?: string;
}

// Interface do Veiculo
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

// Interface da Rota / Viagem
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

// Formatadores de data e hora 100% compativeis com o motor JavaScript Hermes do Android
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
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
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

// ErrorBoundary para capturar qualquer excecao de renderizacao sem fechar o app
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
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
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#070B14', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#1E293B', padding: 20, borderRadius: 16, width: '100%', borderWidth: 1, borderColor: '#EF4444' }}>
            <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              ⚠️ Recuperação de Falha
            </Text>
            <Text style={{ color: '#CBD5E1', fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
              {this.state.error?.message || 'Ocorreu um erro inesperado no aplicativo.'}
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 10, alignItems: 'center' }}
              onPress={() => this.setState({ hasError: false, error: null })}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Recarregar Aplicativo</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  // Estado de Autenticacao
  const [user, setUser] = useState<UserProfile | null>(null);
  const [companyInput, setCompanyInput] = useState('MK Seguranca');
  const [cpfInput, setCpfInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [quickUsers, setQuickUsers] = useState<any[]>([]);
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
      Alert.alert('✅ Conexão Estabelecida!', `Servidor respondendo com sucesso em:\n${url}`);
      loadQuickUsers();
    } catch (err: any) {
      setConnectionStatus('FAIL');
      Alert.alert(
        '❌ Falha na Conexão',
        `Não foi possível alcançar o servidor em:\n${url}\n\nDica: Se estiver usando celular físico, certifique-se de que o PC e o celular estão no mesmo Wi-Fi ou inicie o Expo com o MODO 1 (TUNNEL).`
      );
    } finally {
      setTestingConnection(false);
    }
  };

  // Navegacao por Abas
  const [activeTab, setActiveTab] = useState<'route' | 'timeclock' | 'history'>('route');

  // Estados de Rota & Veiculos
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeUsage, setActiveUsage] = useState<VehicleUsage | null>(null);
  const [driverTrips, setDriverTrips] = useState<VehicleUsage[]>([]);
  const [routeSeconds, setRouteSeconds] = useState(0);

  // Estados dos Modais de Checklist
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

  // Estados de Ponto Eletronico CLT
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayPunches, setTodayPunches] = useState<any[]>([]);
  const [offlinePendingCount, setOfflinePendingCount] = useState(0);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [punchFeedback, setPunchFeedback] = useState<string | null>(null);

  // Relogio digital continuo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cronometro da Rota Ativa
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

  // Carrega atalhos iniciais
  useEffect(() => {
    loadQuickUsers();
    updateOfflineCount();
  }, []);

  // Ao logar, carrega dados especificos daquele usuario
  useEffect(() => {
    if (user) {
      refreshActiveUsage();
      loadVehicles();
      loadTodayPunches();
      loadTripsHistory();
      updateOfflineCount();
    }
  }, [user]);

  const updateOfflineCount = async () => {
    const count = await offlineQueue.getPendingCount();
    setOfflinePendingCount(count);
  };

  const loadQuickUsers = async () => {
    try {
      const data = await api.getQuickUsers();
      setQuickUsers(data);
    } catch {
      // Fallback
    }
  };

  // Login com Base + CPF + Senha
  const handleLogin = async (customCompany?: string, customCpf?: string, customPass?: string) => {
    const company = customCompany || companyInput;
    const cpf = customCpf || cpfInput;
    const pass = customPass || passwordInput;

    if (!company || !cpf) {
      Alert.alert('Campos Obrigatórios', 'Informe o nome da Empresa/Base e o seu CPF.');
      return;
    }

    setLoadingAuth(true);
    try {
      // Se clicou em atalho rapido e senha nao foi digitada, usa quickLogin ou CPF
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

  // Carrega todos os veiculos para a tela
  const loadVehicles = async () => {
    try {
      const list = await api.getVehicles();
      setVehicles(list);
    } catch (err) {
      console.log('Erro ao carregar veiculos:', err);
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

  // HISTORICO RESTRITO: Se for MOTORISTA, busca APENAS suas proprias viagens!
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

  // FLUXO B: Iniciar Viagem e Checklist de Saida
  const openStartModal = (vehicle: Vehicle) => {
    if (vehicle.status !== 'AVAILABLE') {
      Alert.alert('Viatura Indisponível', 'Este veículo está em trânsito ou em manutenção.');
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
      Alert.alert('🟢 Rota Iniciada!', `Viatura ${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.plate}) liberada com sucesso.`);
      loadVehicles();
    } catch (err: any) {
      Alert.alert('Erro ao iniciar', err.message);
    }
  };

  // FLUXO C: Pausa e Retomada de Almoco
  const handlePauseLunch = async () => {
    if (!activeUsage) return;
    try {
      const updated = await api.pauseLunch(activeUsage.id);
      setActiveUsage(updated);
      Alert.alert('☕ Intervalo Registrado', 'Pausa para almoço iniciada. O tempo está sendo contabilizado para o relatório da gestão.');
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleResumeLunch = async () => {
    if (!activeUsage) return;
    try {
      const updated = await api.resumeLunch(activeUsage.id);
      setActiveUsage(updated);
      Alert.alert('🟢 Rota Retomada', 'Intervalo de almoço encerrado. Boa continuação de trajeto!');
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  // FLUXO D: Devolucao e Finalizacao
  const openFinishModal = () => {
    if (!activeUsage) return;
    const initialKm = activeUsage.entryChecklist?.mileage || activeUsage.vehicle?.currentMileage || 0;
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
      Alert.alert('Atenção', `O odômetro final (${exitMileage} km) não pode ser inferior ao odômetro de saída (${initialKm} km).`);
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

      const res = await api.finishUsage(activeUsage.id, {
        exitMileage,
        itemsResult,
        observation: observationInput,
      });

      setFinishModalVisible(false);
      setActiveUsage(null);
      const kmDriven = exitMileage - initialKm;

      if (hasProblem) {
        Alert.alert(
          '⚠️ Viatura Devolvida com Avaria',
          `Km Percorrido: ${kmDriven} km.\nVeículo encaminhado automaticamente para a OFICINA (Manutenção) e alerta prioritário emitido.`
        );
      } else {
        Alert.alert(
          '🏁 Rota Concluída com Sucesso!',
          `Km Percorrido: ${kmDriven} km.\nViatura liberada e disponível no pátio para o próximo turno.`
        );
      }
      loadVehicles();
      loadTripsHistory();
    } catch (err: any) {
      Alert.alert('Erro ao finalizar', err.message);
    }
  };

  // FLUXO E: Ponto CLT Manual
  const handlePunchClock = async (type: 'ENTRADA' | 'ALMOCO_SAIDA' | 'ALMOCO_RETORNO' | 'SAIDA') => {
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
      setPunchFeedback(`Modo Offline: [${typeLabels[type]}] armazenado na memória do dispositivo.`);
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
      setPunchFeedback(`✅ [${typeLabels[type]}] registrado às ${safeFormatTime(new Date())}!`);
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
      Alert.alert('Sincronização Concluída', `${res.syncedCount} batida(s) sincronizada(s) com o banco de dados.`);
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
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // TELA DE LOGIN: EMPRESA/BASE + CPF + SENHA
  // =========================================================================
  if (!user) {
    return (
      <SafeAreaView style={styles.darkContainer}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.loginContent}>
          <View style={styles.brandHeader}>
            <View style={styles.shieldIconContainer}>
              <Ionicons name="shield-checkmark" size={44} color="#10B981" />
            </View>
            <Text style={styles.brandTitle}>ROTALOG</Text>
            <Text style={styles.brandSubtitle}>Gestão Operacional de Frotas & Ponto CLT</Text>
            <View style={styles.manualBadge}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
              <Text style={styles.manualBadgeText}>Acesso Seguro por Base • Gestão Ágil e Direta</Text>
            </View>
          </View>

          {/* Formulario de Login */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Acesso Operacional do Colaborador</Text>

            {/* Campo 1: Empresa / Base */}
            <Text style={styles.inputLabel}>Empresa / Base Operacional *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="business-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                placeholder="Ex: MK Seguranca"
                placeholderTextColor="#64748B"
                value={companyInput}
                onChangeText={setCompanyInput}
              />
            </View>

            {/* Campo 2: CPF */}
            <Text style={styles.inputLabel}>CPF do Colaborador *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                placeholder="Ex: 111.222.333-44"
                placeholderTextColor="#64748B"
                value={cpfInput}
                onChangeText={setCpfInput}
                keyboardType="numeric"
              />
            </View>

            {/* Campo 3: Senha */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.inputLabel}>Senha de Acesso *</Text>
              <Text style={styles.inputTip}>Padrão: CPF do colaborador</Text>
            </View>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                placeholder="Informe sua senha ou CPF"
                placeholderTextColor="#64748B"
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
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Entrar no Sistema</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Atalhos para a Base MK Seguranca (3 Hierarquias) */}
          <View style={styles.quickCard}>
            <View style={styles.quickHeader}>
              <Ionicons name="flash" size={18} color="#F59E0B" />
              <Text style={styles.quickTitle}>Atalhos de Teste • Base MK Segurança</Text>
            </View>
            <Text style={styles.quickDesc}>Selecione um perfil para entrar direto com as permissões da hierarquia:</Text>

            {quickUsers.map((u) => {
              const roleBadge =
                u.role === 'ADMIN'
                  ? '👑 Administrador'
                  : u.role === 'FLEET_MANAGER'
                  ? '👔 Gestor de Frota'
                  : '🚗 Motorista';

              const roleColor =
                u.role === 'ADMIN'
                  ? '#8B5CF6'
                  : u.role === 'FLEET_MANAGER'
                  ? '#3B82F6'
                  : '#10B981';

              return (
                <TouchableOpacity
                  key={u.id}
                  style={styles.quickUserItem}
                  onPress={() => {
                    setCompanyInput(u.tenant?.name || 'MK Seguranca');
                    setCpfInput(u.cpf);
                    // Senha padrao
                    const pass = u.role === 'ADMIN' ? 'admin123' : u.cpf;
                    setPasswordInput(pass);
                    handleLogin(u.tenant?.name || 'MK Seguranca', u.cpf, pass);
                  }}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: roleColor }]}>
                    <Text style={styles.avatarText}>{u.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.quickUserName}>{u.name}</Text>
                    <Text style={[styles.quickUserSub, { color: roleColor, fontWeight: '700' }]}>
                      {roleBadge}
                    </Text>
                    <Text style={styles.quickUserSub}>CPF: {u.cpf}</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={22} color="#64748B" />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Configuração de Conexão com o Servidor */}
          <TouchableOpacity
            style={styles.serverConfigToggle}
            onPress={() => setShowServerConfig(!showServerConfig)}
          >
            <Ionicons
              name={connectionStatus === 'OK' ? 'checkmark-circle' : connectionStatus === 'FAIL' ? 'alert-circle' : 'settings-outline'}
              size={15}
              color={connectionStatus === 'OK' ? '#10B981' : connectionStatus === 'FAIL' ? '#EF4444' : '#94A3B8'}
            />
            <Text style={styles.serverConfigToggleText}>
              Servidor: {BASE_URL} {connectionStatus === 'OK' ? '🟢 Online' : ''}
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
                placeholderTextColor="#64748B"
              />

              {/* Atalhos Rápidos de IP */}
              <Text style={[styles.inputLabel, { marginTop: 8, fontSize: 11 }]}>Atalhos Rápidos de Rede:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                <TouchableOpacity
                  style={styles.serverPresetBtn}
                  onPress={() => {
                    const u = 'http://192.168.99.113:3001';
                    setCustomServerUrl(u);
                    setCustomApiUrl(u);
                    testServerConnection(u);
                  }}
                >
                  <Text style={styles.serverPresetText}>🏠 Wi-Fi Local (192.168.99.113)</Text>
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
                  <Text style={styles.serverPresetText}>🌐 Localhost (Web)</Text>
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
                  <Text style={styles.serverPresetText}>📱 Emulador Android</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.saveServerBtn, { flex: 1, backgroundColor: '#059669' }]}
                  disabled={testingConnection}
                  onPress={() => testServerConnection()}
                >
                  {testingConnection ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveServerBtnText}>🔌 Testar Conexão</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveServerBtn, { flex: 1, backgroundColor: '#3B82F6' }]}
                  onPress={() => {
                    setCustomApiUrl(customServerUrl);
                    setShowServerConfig(false);
                    loadQuickUsers();
                    Alert.alert('Salvo', `Servidor atualizado para:\n${customServerUrl}`);
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

  // =========================================================================
  // PAINEL LOGADO
  // =========================================================================
  const isDriver = user.role === 'DRIVER';

  return (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle="light-content" />

      {/* Top Bar Executiva */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.topBarName}>{user.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Text style={styles.topBarTenant}>{user.tenantName}</Text>
            <Text style={styles.topBarTenant}>•</Text>
            <Text
              style={[
                styles.topBarTenant,
                {
                  color:
                    user.role === 'ADMIN'
                      ? '#A78BFA'
                      : user.role === 'FLEET_MANAGER'
                      ? '#60A5FA'
                      : '#34D399',
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
            style={[styles.offlineChip, isSimulatedOffline && styles.offlineChipActive]}
            onPress={() => setIsSimulatedOffline(!isSimulatedOffline)}
          >
            <View style={[styles.statusDot, { backgroundColor: isSimulatedOffline ? '#F59E0B' : '#10B981' }]} />
            <Text style={styles.offlineChipText}>{isSimulatedOffline ? 'Offline' : 'Online'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              setUser(null);
              setActiveUsage(null);
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner de Sincronizacao Offline */}
      {offlinePendingCount > 0 && (
        <TouchableOpacity style={styles.offlineBanner} onPress={handleSyncOffline}>
          <Ionicons name="cloud-offline" size={18} color="#FFFFFF" />
          <Text style={styles.offlineBannerText}>
            {offlinePendingCount} batida(s) salva(s) offline. Toque para sincronizar com o banco.
          </Text>
        </TouchableOpacity>
      )}

      {/* ===================================================================== */}
      {/* ABA 1: ROTA & VEICULOS (REGRA: INDISPONIVEIS FICAM CINZA E IRCLICAVEIS) */}
      {/* ===================================================================== */}
      {activeTab === 'route' && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          {activeUsage ? (
            // ROTA ATIVA
            <View style={styles.activeRouteCard}>
              <View style={styles.routeHeaderRow}>
                <View style={[styles.statusPill, activeUsage.status === 'PAUSED_LUNCH' ? styles.pillLunch : styles.pillRoute]}>
                  <Text style={styles.statusPillText}>
                    {activeUsage.status === 'PAUSED_LUNCH' ? '☕ EM PAUSA DE ALMOÇO' : '🟢 ROTA EM ANDAMENTO'}
                  </Text>
                </View>
                <Text style={styles.routePlate}>
                  {activeUsage.vehicle?.plate || 'VIATURA'}
                </Text>
              </View>

              <Text style={styles.routeModel}>
                {activeUsage.vehicle ? `${activeUsage.vehicle.brand} ${activeUsage.vehicle.model}` : 'Viatura Operacional'}
              </Text>

              <View style={styles.timerDisplayBox}>
                <Text style={styles.timerLabel}>CRONÔMETRO DE VIAGEM EM TEMPO REAL</Text>
                <Text style={styles.timerValue}>{formatSeconds(routeSeconds)}</Text>
                {activeUsage.totalLunchMinutes > 0 && (
                  <Text style={styles.timerSub}>
                    Tempo de almoço acumulado: {activeUsage.totalLunchMinutes} min
                  </Text>
                )}
              </View>

              <View style={styles.routeActionsGrid}>
                {activeUsage.status === 'PAUSED_LUNCH' ? (
                  <TouchableOpacity style={styles.resumeLunchBtn} onPress={handleResumeLunch}>
                    <Ionicons name="play" size={20} color="#FFFFFF" />
                    <Text style={styles.btnActionText}>Retomar Rota</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.pauseLunchBtn} onPress={handlePauseLunch}>
                    <Ionicons name="cafe-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.btnActionText}>Pausar p/ Almoço</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.finishRouteBtn} onPress={openFinishModal}>
                  <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.btnActionText}>Finalizar & Devolver</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // SELECAO DE VEICULO: DISPONIVEIS CLICAVEIS, OUTROS CINZA E IRCLICAVEIS
            <View>
              <View style={styles.noRouteHero}>
                <Ionicons name="car-sport-outline" size={44} color="#3B82F6" />
                <Text style={styles.noRouteTitle}>Seleção de Viatura & Checklist</Text>
                <Text style={styles.noRouteSub}>
                  Viaturas em verde estão disponíveis para o seu turno. Viaturas em cinza estão ocupadas ou em oficina e não podem ser selecionadas.
                </Text>
              </View>

              <Text style={styles.sectionHeading}>Veículos da Base ({vehicles.length})</Text>

              {vehicles.map((v) => {
                const isAvailable = v.status === 'AVAILABLE';
                const isInUse = v.status === 'IN_USE';
                const isMaintenance = v.status === 'MAINTENANCE';

                return (
                  <TouchableOpacity
                    key={v.id}
                    disabled={!isAvailable} // REGRA: IRCLICAVEL SE NAO DISPONIVEL
                    style={[
                      styles.vehicleCard,
                      !isAvailable && styles.vehicleCardDisabled, // REGRA: CINZA SE INDISPONIVEL
                    ]}
                    onPress={() => openStartModal(v)}
                  >
                    <View style={styles.vehicleCardHeader}>
                      <Text style={[styles.vehiclePlateBadge, !isAvailable && { color: '#64748B' }]}>
                        {v.plate}
                      </Text>

                      {isAvailable ? (
                        <View style={styles.availableTag}>
                          <Text style={styles.availableTagText}>🟢 DISPONÍVEL</Text>
                        </View>
                      ) : isInUse ? (
                        <View style={styles.inUseTag}>
                          <Text style={styles.inUseTagText}>🔒 EM USO (INDISPONÍVEL)</Text>
                        </View>
                      ) : (
                        <View style={styles.maintenanceTag}>
                          <Text style={styles.maintenanceTagText}>⚠️ OFICINA (BLOQUEADO)</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.vehicleName, !isAvailable && { color: '#94A3B8' }]}>
                      {v.brand} {v.model}
                    </Text>

                    <View style={styles.vehicleMetaRow}>
                      <Text style={styles.vehicleMeta}>Ano: {v.year}</Text>
                      <Text style={styles.vehicleMeta}>•</Text>
                      <Text style={styles.vehicleMeta}>Odômetro: {v.currentMileage} km</Text>
                    </View>

                    {/* Botao de Acao ou Aviso de Bloqueio */}
                    {isAvailable ? (
                      <View style={styles.startTripPrompt}>
                        <Text style={styles.startTripPromptText}>Toque para Iniciar Viagem & Checklist</Text>
                        <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
                      </View>
                    ) : (
                      <View style={styles.disabledTripPrompt}>
                        <Ionicons name="lock-closed" size={14} color="#64748B" />
                        <Text style={styles.disabledTripPromptText}>
                          {isInUse ? 'Viatura em trânsito com outro condutor' : 'Viatura bloqueada para reparos mecânicos'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* ===================================================================== */}
      {/* ABA 2: PONTO ELETRONICO CLT */}
      {/* ===================================================================== */}
      {activeTab === 'timeclock' && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <View style={styles.clockCard}>
            <Text style={styles.clockDate}>
              {safeFormatFullDate(currentTime)}
            </Text>
            <Text style={styles.clockTime}>
              {safeFormatTime(currentTime)}
            </Text>
            <View style={styles.cltTag}>
              <Ionicons name="document-text-outline" size={14} color="#10B981" />
              <Text style={styles.cltTagText}>Ponto Eletrônico CLT • 100% Manual</Text>
            </View>
          </View>

          {punchFeedback && (
            <View style={styles.feedbackBanner}>
              <Text style={styles.feedbackBannerText}>{punchFeedback}</Text>
            </View>
          )}

          <View style={styles.punchGrid}>
            <TouchableOpacity
              style={[styles.punchButton, { backgroundColor: '#10B981' }]}
              onPress={() => handlePunchClock('ENTRADA')}
            >
              <Ionicons name="enter-outline" size={28} color="#FFFFFF" />
              <Text style={styles.punchBtnTitle}>Entrada Turno</Text>
              <Text style={styles.punchBtnSub}>Início do Expediente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.punchButton, { backgroundColor: '#F59E0B' }]}
              onPress={() => handlePunchClock('ALMOCO_SAIDA')}
            >
              <Ionicons name="cafe-outline" size={28} color="#FFFFFF" />
              <Text style={styles.punchBtnTitle}>Saída Almoço</Text>
              <Text style={styles.punchBtnSub}>Início do Intervalo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.punchButton, { backgroundColor: '#3B82F6' }]}
              onPress={() => handlePunchClock('ALMOCO_RETORNO')}
            >
              <Ionicons name="restaurant-outline" size={28} color="#FFFFFF" />
              <Text style={styles.punchBtnTitle}>Retorno Almoço</Text>
              <Text style={styles.punchBtnSub}>Fim do Intervalo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.punchButton, { backgroundColor: '#EF4444' }]}
              onPress={() => handlePunchClock('SAIDA')}
            >
              <Ionicons name="exit-outline" size={28} color="#FFFFFF" />
              <Text style={styles.punchBtnTitle}>Saída Turno</Text>
              <Text style={styles.punchBtnSub}>Fim do Expediente</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeading}>Minhas Batidas de Hoje ({todayPunches.length})</Text>

          {todayPunches.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhuma batida efetuada hoje ainda.</Text>
            </View>
          ) : (
            todayPunches.map((p, idx) => {
              const labelMap: any = {
                ENTRADA: '🟢 Entrada no Turno',
                ALMOCO_SAIDA: '☕ Saída para Almoço',
                ALMOCO_RETORNO: '🥪 Retorno do Almoço',
                SAIDA: '🔴 Saída do Expediente',
              };
              return (
                <View key={p.id || idx} style={styles.punchRecordItem}>
                  <View>
                    <Text style={styles.punchRecordType}>{labelMap[p.type] || p.type}</Text>
                    <Text style={styles.punchRecordSub}>
                      {p.isOffline ? 'Gravado offline (sincronizado)' : 'Gravado online no banco'}
                    </Text>
                  </View>
                  <Text style={styles.punchRecordTime}>
                    {safeFormatTime(p.timestamp)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ===================================================================== */}
      {/* ABA 3: HISTORICO RESTRITO (O MOTORISTA SO VE AS SUAS PROPRIAS ROTAS) */}
      {/* ===================================================================== */}
      {activeTab === 'history' && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          {isDriver ? (
            <View style={styles.privacyNoticeCard}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={styles.privacyNoticeText}>
                Visualização Restrita: você tem acesso exclusivo às suas próprias rotas, checklists e intervalos.
              </Text>
            </View>
          ) : (
            <View style={[styles.privacyNoticeCard, { borderColor: '#3B82F6' }]}>
              <Ionicons name="eye" size={20} color="#3B82F6" />
              <Text style={styles.privacyNoticeText}>
                Visão de Gestão: visualizando viagens e relatórios operacionais de toda a base.
              </Text>
            </View>
          )}

          <Text style={styles.sectionHeading}>
            {isDriver ? 'Minhas Rotas & Checklists Anteriores' : 'Histórico Geral de Viagens da Base'} ({driverTrips.length})
          </Text>

          {driverTrips.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhuma rota registrada até o momento.</Text>
            </View>
          ) : (
            driverTrips.map((trip) => {
              const startDt = new Date(trip.startTime);
              const endDt = trip.endTime ? new Date(trip.endTime) : null;
              const lunchStartDt = trip.lunchStartTime ? new Date(trip.lunchStartTime) : null;
              const lunchEndDt = trip.lunchEndTime ? new Date(trip.lunchEndTime) : null;

              return (
                <View key={trip.id} style={styles.tripHistoryCard}>
                  {/* Topo do Card da Viagem */}
                  <View style={styles.tripHeaderRow}>
                    <View>
                      <Text style={styles.tripDateTitle}>
                        {safeFormatShortDate(startDt)}
                      </Text>
                      <Text style={styles.tripPlate}>
                        {trip.vehicle?.plate} • {trip.vehicle?.brand} {trip.vehicle?.model}
                      </Text>
                    </View>
                    <View style={styles.kmBadge}>
                      <Text style={styles.kmBadgeText}>+{trip.totalDistanceKm} km</Text>
                    </View>
                  </View>

                  {/* Detalhes de Horarios: Saida, Almoco e Entrega */}
                  <View style={styles.tripTimeBox}>
                    <View style={styles.timeDetailCol}>
                      <Text style={styles.timeDetailLabel}>🟢 SAÍDA</Text>
                      <Text style={styles.timeDetailVal}>{safeFormatShortTime(startDt)}</Text>
                      <Text style={styles.timeDetailKm}>Km: {trip.entryChecklist?.mileage || '-'}</Text>
                    </View>

                    <View style={styles.timeDetailCol}>
                      <Text style={styles.timeDetailLabel}>☕ ALMOÇO</Text>
                      <Text style={styles.timeDetailVal}>
                        {lunchStartDt && lunchEndDt
                          ? `${safeFormatShortTime(lunchStartDt)} - ${safeFormatShortTime(lunchEndDt)}`
                          : trip.totalLunchMinutes > 0
                          ? `${trip.totalLunchMinutes} min`
                          : 'Sem Pausa'}
                      </Text>
                      <Text style={styles.timeDetailKm}>Intervalo</Text>
                    </View>

                    <View style={styles.timeDetailCol}>
                      <Text style={styles.timeDetailLabel}>🏁 DEVOLUÇÃO</Text>
                      <Text style={styles.timeDetailVal}>
                        {endDt ? safeFormatShortTime(endDt) : 'Em Aberto'}
                      </Text>
                      <Text style={styles.timeDetailKm}>Km: {trip.exitChecklist?.mileage || '-'}</Text>
                    </View>
                  </View>

                  {/* Checklist & Consideracoes Finais do Motorista */}
                  {trip.entryChecklist?.observation ? (
                    <View style={styles.observationRow}>
                      <Text style={styles.obsLabel}>Nota Checklist Saída:</Text>
                      <Text style={styles.obsText}>{trip.entryChecklist.observation}</Text>
                    </View>
                  ) : null}

                  {trip.exitChecklist?.observation ? (
                    <View style={styles.observationRow}>
                      <Text style={styles.obsLabel}>Considerações de Devolução:</Text>
                      <Text style={styles.obsText}>{trip.exitChecklist.observation}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ===================================================================== */}
      {/* MODAIS DE CHECKLIST (SAIDA & DEVOLUCAO) */}
      {/* ===================================================================== */}
      <Modal visible={startModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Checklist de Saída</Text>
                <Text style={styles.modalSub}>
                  {selectedVehicle?.brand} {selectedVehicle?.model} ({selectedVehicle?.plate})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setStartModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Odômetro Atual do Painel (Km) *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={odometerInput}
                onChangeText={setOdometerInput}
                placeholder="Ex: 45200"
                placeholderTextColor="#64748B"
              />

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>
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
                    style={[styles.checklistItemRow, !isOk && styles.checklistItemRowProblem]}
                    onPress={() =>
                      setChecklistItems((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }))
                    }
                  >
                    <Text style={styles.checkItemText}>{item.label}</Text>
                    <View style={[styles.checkStatusBadge, isOk ? styles.badgeOk : styles.badgeProblem]}>
                      <Text style={styles.checkStatusText}>{isOk ? 'OK' : 'PROBLEMA'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Observações de Saída (Opcional):</Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                multiline
                value={observationInput}
                onChangeText={setObservationInput}
                placeholder="Informe notas antes de sair com a viatura..."
                placeholderTextColor="#64748B"
              />
            </ScrollView>

            <TouchableOpacity style={styles.confirmModalBtn} onPress={handleConfirmStart}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.confirmModalBtnText}>Confirmar Checklist & Iniciar Rota</Text>
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
                <Text style={styles.modalSub}>Finalizar rota e entregar viatura</Text>
              </View>
              <TouchableOpacity onPress={() => setFinishModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Odômetro Final do Painel (Km) *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={odometerInput}
                onChangeText={setOdometerInput}
                placeholder="Informe o Km final"
                placeholderTextColor="#64748B"
              />

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>
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
                    style={[styles.checklistItemRow, !isOk && styles.checklistItemRowProblem]}
                    onPress={() =>
                      setChecklistItems((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }))
                    }
                  >
                    <Text style={styles.checkItemText}>{item.label}</Text>
                    <View style={[styles.checkStatusBadge, isOk ? styles.badgeOk : styles.badgeProblem]}>
                      <Text style={styles.checkStatusText}>{isOk ? 'OK' : 'AVARIA'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Considerações Finais / Relato:</Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                multiline
                value={observationInput}
                onChangeText={setObservationInput}
                placeholder="Descreva detalhes ou considerações da viagem..."
                placeholderTextColor="#64748B"
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.confirmModalBtn, { backgroundColor: '#EF4444' }]}
              onPress={handleConfirmFinish}
            >
              <Ionicons name="flag" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.confirmModalBtnText}>Confirmar Devolução & Finalizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Barra Inferior (Tabs) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'route' && styles.navItemActive]}
          onPress={() => setActiveTab('route')}
        >
          <Ionicons
            name={activeTab === 'route' ? 'car' : 'car-outline'}
            size={22}
            color={activeTab === 'route' ? '#3B82F6' : '#94A3B8'}
          />
          <Text style={[styles.navText, activeTab === 'route' && styles.navTextActive]}>
            Viagem / Viatura
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'timeclock' && styles.navItemActive]}
          onPress={() => setActiveTab('timeclock')}
        >
          <Ionicons
            name={activeTab === 'timeclock' ? 'time' : 'time-outline'}
            size={22}
            color={activeTab === 'timeclock' ? '#10B981' : '#94A3B8'}
          />
          <Text style={[styles.navText, activeTab === 'timeclock' && { color: '#10B981' }]}>
            Ponto CLT
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'history' && styles.navItemActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons
            name={activeTab === 'history' ? 'document-text' : 'document-text-outline'}
            size={22}
            color={activeTab === 'history' ? '#F59E0B' : '#94A3B8'}
          />
          <Text style={[styles.navText, activeTab === 'history' && { color: '#F59E0B' }]}>
            {isDriver ? 'Meu Histórico' : 'Histórico Base'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  loginContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  manualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  manualBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  inputTip: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    height: 46,
    color: '#F8FAFC',
    fontSize: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  quickCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickTitle: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 13,
    marginLeft: 6,
  },
  quickDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 12,
  },
  quickUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  quickUserName: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 13,
  },
  quickUserSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  serverConfigToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  serverConfigToggleText: {
    color: '#94A3B8',
    fontSize: 11,
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  serverConfigBox: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serverPresetBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serverPresetText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  saveServerBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveServerBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  topBarLeft: {
    flex: 1,
  },
  topBarName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  topBarTenant: {
    fontSize: 11,
    color: '#94A3B8',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  offlineChipActive: {
    borderColor: '#F59E0B',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  offlineChipText: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  logoutBtn: {
    padding: 6,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  offlineBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },

  tabContent: {
    padding: 16,
    paddingBottom: 90,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 10,
    marginTop: 6,
  },

  // Rota Ativa
  activeRouteCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillRoute: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  pillLunch: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusPillText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 10,
  },
  routePlate: {
    fontSize: 16,
    fontWeight: '900',
    color: '#3B82F6',
  },
  routeModel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 6,
  },
  timerDisplayBox: {
    backgroundColor: '#0B1120',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  timerValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#10B981',
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  timerSub: {
    fontSize: 11,
    color: '#F59E0B',
  },
  routeActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  pauseLunchBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeLunchBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishRouteBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 6,
  },

  // Sem Rota
  noRouteHero: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  noRouteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 8,
  },
  noRouteSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },

  // Cards de Veiculos
  vehicleCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  vehicleCardDisabled: {
    backgroundColor: '#131B2A',
    borderColor: '#1E293B',
    opacity: 0.65, // REGRA DO MOTORISTA: CINZA E APAGADO
  },
  vehicleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehiclePlateBadge: {
    fontSize: 15,
    fontWeight: '900',
    color: '#3B82F6',
  },
  availableTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  availableTagText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 10,
  },
  inUseTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inUseTagText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 10,
  },
  maintenanceTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  maintenanceTagText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 10,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 4,
  },
  vehicleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  vehicleMeta: {
    fontSize: 11,
    color: '#94A3B8',
  },
  startTripPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B1120',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  startTripPromptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
  disabledTripPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  disabledTripPromptText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },

  // Ponto CLT
  clockCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  clockDate: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  clockTime: {
    fontSize: 44,
    fontWeight: '900',
    color: '#F8FAFC',
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  cltTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
  },
  cltTagText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  feedbackBanner: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  feedbackBannerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  punchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  punchButton: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  punchBtnTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    marginTop: 6,
  },
  punchBtnSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  punchRecordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  punchRecordType: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 13,
  },
  punchRecordSub: {
    color: '#94A3B8',
    fontSize: 10,
  },
  punchRecordTime: {
    fontSize: 16,
    fontWeight: '900',
    color: '#3B82F6',
  },

  // Historico Restrito
  privacyNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    marginBottom: 14,
    gap: 8,
  },
  privacyNoticeText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 15,
  },
  tripHistoryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tripDateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    textTransform: 'capitalize',
  },
  tripPlate: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '700',
    marginTop: 2,
  },
  kmBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kmBadgeText: {
    color: '#10B981',
    fontWeight: '900',
    fontSize: 12,
  },
  tripTimeBox: {
    flexDirection: 'row',
    backgroundColor: '#0B1120',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timeDetailCol: {
    flex: 1,
    alignItems: 'center',
  },
  timeDetailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  timeDetailVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  timeDetailKm: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  observationRow: {
    backgroundColor: '#131B2A',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  obsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  obsText: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
  },

  // Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  modalSub: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B1120',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  checklistItemRowProblem: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  checkItemText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  checkStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeOk: {
    backgroundColor: '#10B981',
  },
  badgeProblem: {
    backgroundColor: '#EF4444',
  },
  checkStatusText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
  },
  confirmModalBtn: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  confirmModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  // Bottom Nav
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingBottom: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#3B82F6',
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
  navTextActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },
});

export default function App() {
  return (
    <RootErrorBoundary>
      <MainApp />
    </RootErrorBoundary>
  );
}
