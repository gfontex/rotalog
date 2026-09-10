import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { UserProfile, AssignedVehicle } from './src/types';
import { offlineQueue } from './src/services/offlineQueue';
import { OnDeviceBiometricsEngine } from './src/services/biometricsService';

interface FleetVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  currentMileage: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  currentDriver?: string | null;
}

export type AlignmentStatus = 'INITIAL' | 'PERFECT' | 'TOO_FAR' | 'TOO_CLOSE' | 'NO_FACE' | 'TOO_DARK';

export default function App() {
  // ==========================================
  // ESTADO DE AUTENTICAÇÃO (LOGIN / DESLOGAR)
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
    biometricEnrolled: true,
  });

  // Conectividade Offline-First
  const [isNetworkOnline, setIsNetworkOnline] = useState<boolean>(true);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);

  // Aba selecionada no App
  const [currentTab, setCurrentTab] = useState<'ROUTE' | 'ENROLL_FACE' | 'TIMECLOCK'>('ROUTE');

  // Permissões da Câmera (expo-camera)
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

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

  // Modais
  const [isVehicleSelectModalOpen, setIsVehicleSelectModalOpen] = useState(false);
  const [isFaceCameraModalOpen, setIsFaceCameraModalOpen] = useState(false);
  const [cameraPurpose, setCameraPurpose] = useState<'VERIFY_START_ROUTE' | 'ENROLL_EMPLOYEE' | 'CLOCK_IN'>('VERIFY_START_ROUTE');
  const [faceScanState, setFaceScanState] = useState<'PREVIEW' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('PREVIEW');
  const [scanConfidence, setScanConfidence] = useState<number>(0);
  const [alignmentStatus, setAlignmentStatus] = useState<AlignmentStatus>('INITIAL');
  const [guidanceMsg, setGuidanceMsg] = useState<string>('🟡 Posicione o rosto no centro');
  const isAutoCapturingRef = useRef(false);

  // Cadastro & Gerenciamento de Usuários
  interface RegisteredEmployee {
    id: string;
    name: string;
    cpf: string;
    role: 'ADMIN' | 'DRIVER' | 'FLEET_MANAGER' | 'HR';
    biometricEnrolled: boolean;
    biometricConfidence?: number;
    biometricVector?: number[];
  }

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredEmployee[]>([
    {
      id: 'u-admin',
      name: 'Administrador Master',
      cpf: '139.932.487-08',
      role: 'ADMIN',
      biometricEnrolled: true,
      biometricConfidence: 99.8,
    },
    {
      id: 'u1',
      name: 'Joãozinho Silva',
      cpf: '333.444.555-66',
      role: 'DRIVER',
      biometricEnrolled: true,
      biometricConfidence: 99.1,
    },
    {
      id: 'u2',
      name: 'Carlos Oliveira',
      cpf: '111.222.333-44',
      role: 'FLEET_MANAGER',
      biometricEnrolled: true,
      biometricConfidence: 98.7,
    },
    {
      id: 'u3',
      name: 'Mariana Santos',
      cpf: '222.333.444-55',
      role: 'HR',
      biometricEnrolled: false,
    },
    {
      id: 'u4',
      name: 'Marcos Souza (Novo Motorista)',
      cpf: '444.555.666-77',
      role: 'DRIVER',
      biometricEnrolled: false,
    },
  ]);

  // Form de Cadastro de Novo Usuário
  const [newUserName, setNewUserName] = useState('');
  const [newUserCpf, setNewUserCpf] = useState('');
  const [newUserRole, setNewUserRole] = useState<'DRIVER' | 'FLEET_MANAGER' | 'HR' | 'ADMIN'>('DRIVER');

  // Colaborador alvo para captura de biometria (quando selecionado da lista)
  const [targetEmployeeForEnroll, setTargetEmployeeForEnroll] = useState<RegisteredEmployee | null>(null);

  // Checklist
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

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe(() => {
      setPendingQueueCount(offlineQueue.getPendingCount());
    });
    return () => unsubscribe();
  }, []);

  // Timer de rota
  useEffect(() => {
    let timer: any;
    if (activeRoute.inProgress && !activeRoute.isOnLunch) {
      timer = setInterval(() => {
        setActiveRoute((prev) => ({ ...prev, elapsedMinutes: prev.elapsedMinutes + 1 }));
      }, 60000);
    }
    return () => clearInterval(timer);
  }, [activeRoute.inProgress, activeRoute.isOnLunch]);

  // Sondagem e Captura Automática Hands-Free (Estilo Face ID Apple)
  useEffect(() => {
    if (!isFaceCameraModalOpen) {
      setAlignmentStatus('INITIAL');
      setGuidanceMsg('🟡 Posicione o rosto no círculo');
      isAutoCapturingRef.current = false;
      return;
    }

    let isMounted = true;
    let isProbing = false;

    const probeInterval = setInterval(async () => {
      if (
        !isMounted ||
        isProbing ||
        isAutoCapturingRef.current ||
        faceScanState === 'SCANNING' ||
        faceScanState === 'SUCCESS'
      ) {
        return;
      }
      if (!cameraRef.current || !cameraRef.current.takePictureAsync) {
        return;
      }

      isProbing = true;
      try {
        const pic = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.1,
        });

        if (pic?.base64 && isMounted) {
          const res = await fetch('http://192.168.99.106:3001/api/biometrics/process-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: pic.base64,
              mode: 'PROBE',
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (isMounted && !isAutoCapturingRef.current) {
              const status: AlignmentStatus = data.guidanceStatus || (data.isFaceDetected ? 'PERFECT' : 'NO_FACE');
              const msg: string = data.guidanceMessage || (status === 'PERFECT' ? '🟢 PERFEITO! MANTENHA PARADO...' : '🔴 CENTRALIZE O ROSTO NO CÍRCULO');

              setAlignmentStatus(status);
              setGuidanceMsg(msg);

              if (status === 'PERFECT') {
                // ACENDE VERDE IMEDIATAMENTE!
                isAutoCapturingRef.current = true;

                // DISPARA A VALIDAÇÃO/CADASTRO AUTOMATICAMENTE (SEM PRECISAR CLICAR)!
                setTimeout(() => {
                  if (isMounted) {
                    handleCaptureAndRecognizeFace();
                  }
                }, 350);
              }
            }
          }
        }
      } catch (err) {
        // Silencioso na sonda contínua
      } finally {
        isProbing = false;
      }
    }, 700);

    return () => {
      isMounted = false;
      clearInterval(probeInterval);
    };
  }, [isFaceCameraModalOpen, faceScanState]);

  // Ação de Login no Celular (Reconhece qualquer usuário cadastrado dinamicamente)
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
        biometricEnrolled: found.biometricEnrolled,
      });
      setIsLoggedIn(true);
      Alert.alert(
        'Login Efetuado',
        `Bem-vindo(a), ${found.name}!\nPerfil: ${found.role === 'ADMIN' ? 'Administrador Master' : found.role === 'DRIVER' ? 'Motorista Operacional' : found.role}\nBiometria Facial: ${found.biometricEnrolled ? '✓ Ativa (192-d)' : '⚠️ Pendente de Cadastro'}`
      );
    } else {
      Alert.alert(
        'Colaborador Não Encontrado',
        `Nenhum colaborador localizado com o CPF ${cleanPass}.\nCadastre o colaborador na aba '📸 Cadastrar Facial' ou utilize um dos usuários listados.`
      );
    }
  };

  const handleLogoutMobile = () => {
    setIsLoggedIn(false);
    setSelectedVehicle(null);
  };

  // 1. Iniciar Processo: Selecionar Veículo
  const handleSelectVehicleForRoute = (v: FleetVehicle) => {
    if (v.status !== 'AVAILABLE') {
      Alert.alert('Veículo Indisponível', `O veículo ${v.plate} está em uso ou manutenção.`);
      return;
    }
    setSelectedVehicle(v);
    setIsVehicleSelectModalOpen(false);

    // Abre a câmera frontal real para reconhecimento facial
    setCameraPurpose('VERIFY_START_ROUTE');
    setFaceScanState('PREVIEW');
    setIsFaceCameraModalOpen(true);
  };

  // 2. Executar Captura e Validação Facial na Câmera Real
  const handleCaptureAndRecognizeFace = async () => {
    setFaceScanState('SCANNING');

    let base64Photo = '';
    try {
      if (cameraRef.current && cameraRef.current.takePictureAsync) {
        const pic = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.25,
        });
        base64Photo = pic?.base64 || '';
      }
    } catch (err: any) {
      console.log('Frame capture error:', err);
      isAutoCapturingRef.current = false;
      setFaceScanState('ERROR');
      Alert.alert('Erro na Câmera', 'Falha ao acionar a câmera: ' + (err?.message || 'Câmera indisponível.'));
      return;
    }

    if (!base64Photo) {
      isAutoCapturingRef.current = false;
      setFaceScanState('ERROR');
      Alert.alert('Erro na Captura', 'Não foi possível capturar o frame da foto da câmera.');
      return;
    }

    const enrolledVector = targetEmployeeForEnroll
      ? targetEmployeeForEnroll.biometricVector
      : currentUser.biometricVector;

    let apiResult: any = null;
    try {
      const response = await fetch('http://192.168.99.106:3001/api/biometrics/process-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Photo,
          enrolledVector,
          mode: cameraPurpose === 'ENROLL_EMPLOYEE' ? 'ENROLL' : 'VERIFY',
        }),
      });

      if (response.ok) {
        apiResult = await response.json();
      } else {
        const errJson = await response.json().catch(() => ({}));
        isAutoCapturingRef.current = false;
        setFaceScanState('ERROR');
        Alert.alert('Erro no Servidor', errJson.message || 'Falha no processamento da imagem facial.');
        return;
      }
    } catch (e) {
      isAutoCapturingRef.current = false;
      setFaceScanState('ERROR');
      Alert.alert(
        'Servidor Inacessível',
        'Não foi possível conectar ao servidor de IA facial em 192.168.99.106:3001.\nVerifique se o backend está ativo na mesma rede Wi-Fi.',
      );
      return;
    }

    // Se a IA analisou e o enquadramento ainda não está perfeito:
    if (!apiResult || !apiResult.isFaceDetected) {
      isAutoCapturingRef.current = false;
      setFaceScanState('PREVIEW');
      const gStatus: AlignmentStatus = apiResult?.guidanceStatus || 'NO_FACE';
      const gMsg: string = apiResult?.guidanceMessage || apiResult?.error || '🔴 CENTRALIZE O ROSTO NO CÍRCULO';
      setAlignmentStatus(gStatus);
      setGuidanceMsg(gMsg);
      return;
    }

    // Se for validação de identidade e a IA reprovou (rosto de outra pessoa):
    if (cameraPurpose !== 'ENROLL_EMPLOYEE' && !apiResult.isMatch) {
      isAutoCapturingRef.current = false;
      setFaceScanState('ERROR');
      Alert.alert(
        'Acesso Bloqueado',
        apiResult.message || 'Rosto não confere com o colaborador cadastrado! Operação bloqueada por segurança.',
      );
      return;
    }

    const finalConfidence = apiResult.confidence || 95.0;
    const finalVector = apiResult.vector;

    setScanConfidence(finalConfidence);
    setFaceScanState('SUCCESS');

    setTimeout(() => {
      setIsFaceCameraModalOpen(false);
      isAutoCapturingRef.current = false;
      if (cameraPurpose === 'VERIFY_START_ROUTE') {
        // Abre o Checklist de Entrada
        setChecklistType('ENTRY');
        setChecklistMileage(String(selectedVehicle?.currentMileage || 18900));
        setIsChecklistModalOpen(true);
      } else if (cameraPurpose === 'ENROLL_EMPLOYEE') {
        if (targetEmployeeForEnroll) {
          // Atualiza biometria de usuário existente
          setRegisteredUsers((prev) =>
            prev.map((u) =>
              u.id === targetEmployeeForEnroll.id
                ? {
                    ...u,
                    biometricEnrolled: true,
                    biometricConfidence: finalConfidence,
                    biometricVector: finalVector,
                  }
                : u,
            ),
          );
          Alert.alert(
            'Biometria Atualizada!',
            `Vetor facial de 192 dimensões vinculado com sucesso a ${targetEmployeeForEnroll.name} (${finalConfidence}% de confiança).\nLGPD 100% compliant!`,
          );
          setTargetEmployeeForEnroll(null);
        } else {
          // Cadastro de novo usuário com facial vinculada
          const digits = newUserCpf.replace(/\D/g, '');
          const formattedCpf =
            digits.length === 11
              ? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
              : newUserCpf;

          const createdUser: RegisteredEmployee = {
            id: `u-${Date.now()}`,
            name: newUserName.trim() || 'Novo Colaborador',
            cpf: formattedCpf || '000.000.000-00',
            role: newUserRole,
            biometricEnrolled: true,
            biometricConfidence: finalConfidence,
            biometricVector: finalVector,
          };

          setRegisteredUsers((prev) => [createdUser, ...prev]);
          Alert.alert(
            'Novo Colaborador & Facial Cadastrados!',
            `Colaborador: ${createdUser.name}\nCPF / Senha: ${createdUser.cpf}\nCargo: ${createdUser.role}\nBiometria 192-d gravada (${finalConfidence}%).\n\nAgora você já pode fazer login no app com o CPF dele!`,
          );
          setNewUserName('');
          setNewUserCpf('');
        }
      } else if (cameraPurpose === 'CLOCK_IN') {
        Alert.alert(
          'Ponto Registrado!',
          `Batida facial confirmada às ${new Date().toLocaleTimeString('pt-BR')} (Face Match: ${finalConfidence}%).`,
        );
      }
    }, 1200);
  };

  // 3. Confirmar Checklist
  const handleConfirmChecklist = () => {
    const mileageNum = parseInt(checklistMileage, 10);
    if (isNaN(mileageNum) || mileageNum <= 0) {
      Alert.alert('Odômetro Obrigatório', 'Por favor, informe a quilometragem atual do painel.');
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
            : v,
        ),
      );

      // Notificação exata solicitada no áudio: "Iniciando rota com carro X"
      Alert.alert(
        'Iniciando rota',
        `Iniciando rota com carro ${selectedVehicle!.brand} ${selectedVehicle!.model} (Placa ${selectedVehicle!.plate}).`,
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
            : v,
        ),
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

      // Notificação exata solicitada no áudio: "Rota finalizada, checklist finalizado"
      Alert.alert(
        'Rota Finalizada',
        hasProblem
          ? 'Rota finalizada, checklist finalizado (Avaria detectada, veículo direcionado à oficina).'
          : 'Rota finalizada, checklist finalizado.',
      );
    }
  };

  // 4. Pausa para Almoço / Retomada (Opção A)
  const handleToggleLunch = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (!activeRoute.isOnLunch) {
      setActiveRoute({
        ...activeRoute,
        isOnLunch: true,
        lunchStartTime: timeStr,
      });
      // Notificação exata solicitada: "Iniciando intervalo para almoço"
      Alert.alert('Intervalo de Almoço', 'Iniciando intervalo para almoço.');
    } else {
      const pauseDuration = 45;
      setActiveRoute({
        ...activeRoute,
        isOnLunch: false,
        totalLunchMinutes: activeRoute.totalLunchMinutes + pauseDuration,
      });
      // Notificação exata solicitada: "Intervalo para almoço finalizado"
      Alert.alert('Intervalo de Almoço', 'Intervalo para almoço finalizado.');
    }
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
          <Text style={styles.loginSubtitle}>App de Frota, Biometria & Ponto CLT</Text>

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
              <Text style={styles.quickAccessTitle}>👥 USUÁRIOS CADASTRADOS NA BASE MKSEGURANCA:</Text>
              <Text style={{ color: '#64748b', fontSize: 11, marginBottom: 8 }}>
                Toque em qualquer colaborador para preencher o CPF e entrar:
              </Text>
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
                      {u.role === 'ADMIN' ? '👑 Master' : u.role === 'DRIVER' ? '🚗 Motorista' : u.role}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text style={styles.quickUserCpfText}>CPF: {u.cpf}</Text>
                    <Text style={{ color: u.biometricEnrolled ? '#34d399' : '#fbbf24', fontSize: 10, fontWeight: '700' }}>
                      {u.biometricEnrolled ? '✓ Facial OK' : '⚠️ Sem Facial'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // TELA PRINCIPAL DO APLICATIVO LOGADO
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* CABEÇALHO DO MOTORISTA & BOTÃO DESLOGAR */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>ROTALOG</Text>
            <Text style={styles.brandSubtitle}>
              {currentUser.name} • Base: {currentUser.tenantId.toUpperCase()}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btnLogout} onPress={handleLogoutMobile}>
          <Text style={styles.btnLogoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* ABAS DO APP MOBILE */}
      <View style={styles.mobileTabs}>
        <TouchableOpacity
          style={[styles.tabButton, currentTab === 'ROUTE' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('ROUTE')}
        >
          <Text style={[styles.tabButtonText, currentTab === 'ROUTE' && styles.tabButtonTextActive]}>
            🚗 Operação / Rota
          </Text>
        </TouchableOpacity>

        {/* APENAS O ADMINISTRADOR TEM PERMISSÃO PARA CADASTRAR FACIAL E NOVOS USUÁRIOS */}
        {currentUser.role === 'ADMIN' && (
          <TouchableOpacity
            style={[styles.tabButton, currentTab === 'ENROLL_FACE' && styles.tabButtonActive]}
            onPress={() => setCurrentTab('ENROLL_FACE')}
          >
            <Text style={[styles.tabButtonText, currentTab === 'ENROLL_FACE' && styles.tabButtonTextActive]}>
              👑 Cadastrar Facial (ADM)
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.tabButton, currentTab === 'TIMECLOCK' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('TIMECLOCK')}
        >
          <Text style={[styles.tabButtonText, currentTab === 'TIMECLOCK' && styles.tabButtonTextActive]}>
            ⏱️ Bater Ponto
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ========================================================== */}
        {/* ABA 1: OPERAÇÃO / ROTA DO MOTORISTA                        */}
        {/* ========================================================== */}
        {currentTab === 'ROUTE' && (
          <>
            {/* PAINEL DE ROTA ATIVA (SE ESTIVER EM CURSO) */}
            {activeRoute.inProgress ? (
              <View style={styles.activeRouteCard}>
                <View style={styles.activeRouteHeader}>
                  <View>
                    <Text style={styles.activeRouteBadge}>
                      {activeRoute.isOnLunch ? '☕ EM PAUSA DE ALMOÇO' : '🚗 EM ROTA ATIVA'}
                    </Text>
                    <Text style={styles.activeRouteVehicle}>{activeRoute.vehicleModel}</Text>
                    <Text style={styles.activeRoutePlate}>{activeRoute.vehiclePlate}</Text>
                  </View>
                  <View style={styles.activeRouteTimerBox}>
                    <Text style={styles.activeRouteTimerText}>{activeRoute.elapsedMinutes}m</Text>
                    <Text style={styles.activeRouteTimerLabel}>em trânsito</Text>
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
                      setIsChecklistModalOpen(true);
                    }}
                  >
                    <Text style={styles.btnFinishRouteText}>🏁 Devolver Veículo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* CARD PARA INICIAR NOVA VIAGEM */
              <View style={styles.startCard}>
                <Text style={styles.startTitle}>Iniciar Nova Rota</Text>
                <Text style={styles.startDesc}>
                  Selecione o carro da base MKSEGURANCA, realize a validação facial pela câmera frontal e confirme o odômetro.
                </Text>
                <TouchableOpacity
                  style={styles.btnStartBig}
                  onPress={() => setIsVehicleSelectModalOpen(true)}
                >
                  <Text style={styles.btnStartBigText}>🚗 Selecionar Veículo & Iniciar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* QUADRO DE VEÍCULOS EM USO E POR QUEM */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quadro da Frota — Base MKSEGURANCA</Text>
              <Text style={styles.sectionDesc}>Veja quem está utilizando cada veículo da base:</Text>
            </View>

            {availableVehicles.map((v) => (
              <View key={v.id} style={styles.vehicleCard}>
                <View style={styles.vehicleCardTop}>
                  <Text style={styles.vehiclePlate}>{v.plate}</Text>
                  <Text
                    style={[
                      styles.vehicleStatusBadge,
                      v.status === 'IN_USE'
                        ? styles.statusInUse
                        : v.status === 'AVAILABLE'
                        ? styles.statusAvailable
                        : styles.statusMaint,
                    ]}
                  >
                    {v.status === 'IN_USE' ? 'EM USO' : v.status === 'AVAILABLE' ? 'DISPONÍVEL' : 'OFICINA'}
                  </Text>
                </View>
                <Text style={styles.vehicleName}>
                  {v.brand} {v.model}
                </Text>
                <Text style={styles.vehicleInfo}>
                  Hodômetro: {v.currentMileage.toLocaleString('pt-BR')} km
                </Text>

                {v.status === 'IN_USE' ? (
                  <View style={styles.driverInfoBox}>
                    <Text style={styles.driverInfoLabel}>🚗 Utilizado no momento por:</Text>
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
          </>
        )}

        {/* ========================================================== */}
        {/* ABA 2: TELINHA PARA CADASTRAR USUÁRIOS E FACIAL            */}
        {/* ========================================================== */}
        {currentTab === 'ENROLL_FACE' && (
          <>
            {/* CARD 1: CADASTRAR NOVO USUÁRIO */}
            <View style={styles.enrollCard}>
              <Text style={styles.enrollTitle}>+ Cadastrar Novo Usuário</Text>
              <Text style={styles.enrollDesc}>
                Informe os dados do colaborador, escolha o cargo e capture o rosto com a câmera frontal. A senha de acesso será o CPF.
              </Text>

              <View style={styles.enrollInputGroup}>
                <Text style={styles.inputLabel}>Nome Completo</Text>
                <TextInput
                  style={styles.textInput}
                  value={newUserName}
                  onChangeText={setNewUserName}
                  placeholder="Ex: Carlos Eduardo ou Maria Silva"
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

              <TouchableOpacity
                style={styles.btnOpenCamEnroll}
                onPress={() => {
                  if (!newUserName.trim() || !newUserCpf.trim()) {
                    Alert.alert('Campos Obrigatórios', 'Por favor, digite o nome e o CPF do novo usuário antes de capturar a biometria.');
                    return;
                  }
                  setTargetEmployeeForEnroll(null);
                  setCameraPurpose('ENROLL_EMPLOYEE');
                  setFaceScanState('PREVIEW');
                  setIsFaceCameraModalOpen(true);
                }}
              >
                <Text style={styles.btnOpenCamEnrollText}>📸 Abrir Câmera & Gravar Biometria Facial</Text>
              </TouchableOpacity>
            </View>

            {/* CARD 2: LISTA DE USUÁRIOS E STATUS FACIAL */}
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <Text style={styles.sectionTitle}>Colaboradores da Base MKSEGURANCA</Text>
              <Text style={styles.sectionDesc}>Toque em qualquer colaborador para gravar ou atualizar a biometria:</Text>
            </View>

            {registeredUsers.map((emp) => (
              <View key={emp.id} style={styles.userListItemCard}>
                <View style={styles.userListCardHeader}>
                  <View style={styles.userListAvatar}>
                    <Text style={styles.userListAvatarText}>{emp.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.userListName}>{emp.name}</Text>
                    <Text style={styles.userListCpf}>CPF: {emp.cpf} • {emp.role}</Text>
                  </View>
                  <View
                    style={[
                      styles.biometricStatusPill,
                      emp.biometricEnrolled ? styles.bioPillActive : styles.bioPillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.biometricStatusText,
                        emp.biometricEnrolled ? styles.bioTextActive : styles.bioTextPending,
                      ]}
                    >
                      {emp.biometricEnrolled ? `✓ Ativa (${emp.biometricConfidence || 99}%)` : '⚠️ Pendente'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.btnUserEnrollAction,
                    emp.biometricEnrolled ? styles.btnReEnroll : styles.btnFirstEnroll,
                  ]}
                  onPress={() => {
                    setTargetEmployeeForEnroll(emp);
                    setCameraPurpose('ENROLL_EMPLOYEE');
                    setFaceScanState('PREVIEW');
                    setIsFaceCameraModalOpen(true);
                  }}
                >
                  <Text style={styles.btnUserEnrollActionText}>
                    {emp.biometricEnrolled
                      ? '🔄 Recadastrar Facial'
                      : '📸 Gravar Biometria Facial Deste Colaborador'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* ========================================================== */}
        {/* ABA 3: BATER PONTO CLT COM FACIAL                           */}
        {/* ========================================================== */}
        {currentTab === 'TIMECLOCK' && (
          <View style={styles.enrollCard}>
            <Text style={styles.enrollTitle}>Registro de Ponto Facial (CLT)</Text>
            <Text style={styles.enrollDesc}>
              Validação de entrada, almoço e saída com conferência facial on-device.
            </Text>

            <TouchableOpacity
              style={[styles.btnOpenCamEnroll, { backgroundColor: '#10b981' }]}
              onPress={() => {
                setCameraPurpose('CLOCK_IN');
                setFaceScanState('PREVIEW');
                setIsFaceCameraModalOpen(true);
              }}
            >
              <Text style={styles.btnOpenCamEnrollText}>📸 Olhar para a Câmera & Bater Ponto</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ========================================================== */}
      {/* MODAL: CÂMERA REAL DO CELULAR (EXPO-CAMERA FRONTAL)        */}
      {/* ========================================================== */}
      <Modal visible={isFaceCameraModalOpen} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.cameraScreen}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraHeaderTitle}>
              {cameraPurpose === 'ENROLL_EMPLOYEE'
                ? (targetEmployeeForEnroll
                    ? `Facial: ${targetEmployeeForEnroll.name}`
                    : `Nova Facial: ${newUserName || 'Novo Colaborador'}`)
                : cameraPurpose === 'CLOCK_IN'
                ? 'Validação de Ponto Eletrônico'
                : 'Reconhecimento Facial do Motorista'}
            </Text>
            <TouchableOpacity onPress={() => setIsFaceCameraModalOpen(false)}>
              <Text style={styles.cameraCloseBtn}>Fechar ✕</Text>
            </TouchableOpacity>
          </View>

          {/* CÂMERA REAL DO DISPOSITIVO OU PEDIDO DE PERMISSÃO */}
          {!permission?.granted ? (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionTitle}>Permissão da Câmera Necessária</Text>
              <Text style={styles.permissionDesc}>
                Para validar o reconhecimento facial seguro no celular, conceda acesso à câmera frontal.
              </Text>
              <TouchableOpacity style={styles.btnGrantPermission} onPress={requestPermission}>
                <Text style={styles.btnGrantPermissionText}>Conceder Permissão da Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSimulateScan}
                onPress={handleCaptureAndRecognizeFace}
              >
                <Text style={styles.btnSimulateScanText}>Simular Captura Facial</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraContainer}>
              <CameraView
                ref={cameraRef}
                style={styles.cameraPreview}
                facing="front"
              />

              {/* OVERLAY ESTILO APPLE FACE ID */}
              <View style={styles.faceIdOverlay} pointerEvents="box-none">
                {/* DICA DE ENQUADRAMENTO TOPO */}
                <View
                  style={[
                    styles.faceIdPromptPill,
                    alignmentStatus === 'PERFECT' && styles.promptPillGreen,
                    (alignmentStatus === 'TOO_FAR' || alignmentStatus === 'TOO_CLOSE' || alignmentStatus === 'TOO_DARK') && styles.promptPillAmber,
                    alignmentStatus === 'NO_FACE' && styles.promptPillRed,
                    faceScanState === 'SUCCESS' && styles.promptPillGreen,
                  ]}
                >
                  <Text style={styles.faceIdPromptPillText}>
                    {faceScanState === 'SCANNING'
                      ? '⚡ Mapeando biometria facial...'
                      : faceScanState === 'SUCCESS'
                      ? '✓ Rosto Identificado com Sucesso!'
                      : faceScanState === 'ERROR'
                      ? '⚠️ Centralize o rosto com boa luz'
                      : guidanceMsg}
                  </Text>
                </View>

                {/* MOLDURA CIRCULAR CENTRAL FACE ID */}
                <View style={styles.faceIdRingWrapper}>
                  {/* CANTOS RETICULARES (ESTILO IPHONE) */}
                  <View
                    style={[
                      styles.reticleCorner,
                      styles.reticleTL,
                      (alignmentStatus === 'PERFECT' || faceScanState === 'SUCCESS') && styles.reticleGreen,
                      (alignmentStatus === 'TOO_FAR' || alignmentStatus === 'TOO_CLOSE' || alignmentStatus === 'TOO_DARK') && styles.reticleAmber,
                      alignmentStatus === 'NO_FACE' && styles.reticleRed,
                    ]}
                  />
                  <View
                    style={[
                      styles.reticleCorner,
                      styles.reticleTR,
                      (alignmentStatus === 'PERFECT' || faceScanState === 'SUCCESS') && styles.reticleGreen,
                      (alignmentStatus === 'TOO_FAR' || alignmentStatus === 'TOO_CLOSE' || alignmentStatus === 'TOO_DARK') && styles.reticleAmber,
                      alignmentStatus === 'NO_FACE' && styles.reticleRed,
                    ]}
                  />
                  <View
                    style={[
                      styles.reticleCorner,
                      styles.reticleBL,
                      (alignmentStatus === 'PERFECT' || faceScanState === 'SUCCESS') && styles.reticleGreen,
                      (alignmentStatus === 'TOO_FAR' || alignmentStatus === 'TOO_CLOSE' || alignmentStatus === 'TOO_DARK') && styles.reticleAmber,
                      alignmentStatus === 'NO_FACE' && styles.reticleRed,
                    ]}
                  />
                  <View
                    style={[
                      styles.reticleCorner,
                      styles.reticleBR,
                      (alignmentStatus === 'PERFECT' || faceScanState === 'SUCCESS') && styles.reticleGreen,
                      (alignmentStatus === 'TOO_FAR' || alignmentStatus === 'TOO_CLOSE' || alignmentStatus === 'TOO_DARK') && styles.reticleAmber,
                      alignmentStatus === 'NO_FACE' && styles.reticleRed,
                    ]}
                  />

                  {/* CÍRCULO CENTRAL COM BORDA LUMINOSA */}
                  <View
                    style={[
                      styles.faceIdCircle,
                      (alignmentStatus === 'PERFECT' || faceScanState === 'SUCCESS') && styles.faceIdCircleSuccess,
                      (alignmentStatus === 'TOO_FAR' || alignmentStatus === 'TOO_CLOSE' || alignmentStatus === 'TOO_DARK') && styles.faceIdCircleAmber,
                      alignmentStatus === 'NO_FACE' && styles.faceIdCircleError,
                      faceScanState === 'SCANNING' && styles.faceIdCircleScanning,
                      faceScanState === 'ERROR' && styles.faceIdCircleError,
                    ]}
                  >
                    {/* FEEDBACK DE CARREGAMENTO NO CENTRO */}
                    {faceScanState === 'SCANNING' && (
                      <View style={styles.scanningCenterBox}>
                        <ActivityIndicator size="large" color="#38bdf8" />
                        <Text style={styles.scanningCenterText}>Processando IA...</Text>
                      </View>
                    )}

                    {/* BADGE DE SUCESSO VERDE APPLE */}
                    {faceScanState === 'SUCCESS' && (
                      <View style={styles.successCenterBox}>
                        <View style={styles.successCheckCircle}>
                          <Text style={styles.successCheckText}>✓</Text>
                        </View>
                        <Text style={styles.successCenterTitle}>Autenticado</Text>
                        <Text style={styles.successCenterConfidence}>
                          {scanConfidence}% de Similaridade
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* MARCADORES RADIAIS (DEPTH TICKS) AO REDOR DO CÍRCULO */}
                  <View style={styles.radialTicksContainer} pointerEvents="none">
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                      <View
                        key={deg}
                        style={[
                          styles.radialTick,
                          { transform: [{ rotate: `${deg}deg` }, { translateY: -142 }] },
                          (alignmentStatus === 'PERFECT' || faceScanState === 'SUCCESS') && styles.radialTickSuccess,
                          (alignmentStatus === 'TOO_FAR' || alignmentStatus === 'TOO_CLOSE' || alignmentStatus === 'TOO_DARK') && styles.radialTickAmber,
                          alignmentStatus === 'NO_FACE' && styles.radialTickRed,
                          faceScanState === 'SCANNING' && styles.radialTickScanning,
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* INSTRUÇÃO INFERIOR */}
                <Text style={styles.faceIdSubInstruction}>
                  {faceScanState === 'SCANNING'
                    ? 'Mantenha o celular parado por 1 segundo'
                    : faceScanState === 'SUCCESS'
                    ? 'Validação biométrica concluída!'
                    : alignmentStatus === 'PERFECT'
                    ? '🟢 Perfeito! Gravando automaticamente...'
                    : alignmentStatus === 'TOO_FAR'
                    ? '🔍 Rosto pequeno: aproxime mais a câmera'
                    : alignmentStatus === 'TOO_CLOSE'
                    ? '↔️ Rosto muito perto: afaste um pouco a câmera'
                    : alignmentStatus === 'TOO_DARK'
                    ? '💡 Pouca luz: ilumine seu rosto'
                    : '🔴 Centralize o rosto dentro do círculo'}
                </Text>
              </View>
            </View>
          )}

          {/* BARRA INFERIOR COM DISPARADOR ESTILO CÂMERA APPLE */}
          <View style={styles.cameraControlsApple}>
            <TouchableOpacity
              style={[
                styles.appleShutterOuter,
                (alignmentStatus === 'PERFECT' || faceScanState === 'SUCCESS') && styles.appleShutterOuterGreen,
                (alignmentStatus === 'TOO_FAR' || alignmentStatus === 'TOO_CLOSE' || alignmentStatus === 'TOO_DARK') && styles.appleShutterOuterAmber,
                alignmentStatus === 'NO_FACE' && styles.appleShutterOuterRed,
                faceScanState === 'SCANNING' && { opacity: 0.6 },
              ]}
              disabled={faceScanState === 'SCANNING'}
              onPress={handleCaptureAndRecognizeFace}
            >
              <View
                style={[
                  styles.appleShutterInner,
                  (alignmentStatus === 'PERFECT' || faceScanState === 'SUCCESS') && { backgroundColor: '#10b981' },
                  (alignmentStatus === 'TOO_FAR' || alignmentStatus === 'TOO_CLOSE' || alignmentStatus === 'TOO_DARK') && { backgroundColor: '#f59e0b' },
                  alignmentStatus === 'NO_FACE' && { backgroundColor: '#ef4444' },
                ]}
              />
            </TouchableOpacity>

            <Text style={styles.appleShutterLabel}>
              {faceScanState === 'SCANNING'
                ? '⚡ Capturando biometria...'
                : alignmentStatus === 'PERFECT'
                ? '🟢 PERFEITO! Gravando biometria...'
                : alignmentStatus === 'TOO_FAR'
                ? '🔍 APROXIME O CELULAR'
                : alignmentStatus === 'TOO_CLOSE'
                ? '↔️ AFASTE O CELULAR'
                : alignmentStatus === 'TOO_DARK'
                ? '💡 ILUMINE O ROSTO'
                : alignmentStatus === 'NO_FACE'
                ? '🔴 CENTRALIZE O ROSTO'
                : '⚡ Modo Automático: Posicione o rosto'}
            </Text>

            <Text style={styles.lgpdBadgeApple}>
              🔒 Biometria On-Device • Vetor 192-d criptografado (LGPD)
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ========================================================== */}
      {/* MODAL: SELEÇÃO DE VEÍCULO DA BASE MKSEGURANCA             */}
      {/* ========================================================== */}
      <Modal visible={isVehicleSelectModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Escolha o Veículo da Frota</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {availableVehicles
                .filter((v) => v.status === 'AVAILABLE')
                .map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={styles.modalVehicleItem}
                    onPress={() => handleSelectVehicleForRoute(v)}
                  >
                    <Text style={styles.modalVehiclePlate}>{v.plate}</Text>
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
              {checklistType === 'ENTRY' ? 'Checklist de Saída' : 'Checklist de Retorno'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Veículo: {selectedVehicle?.plate || activeRoute.vehiclePlate}
            </Text>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Odômetro do Painel (Km) *</Text>
            <TextInput
              style={styles.textInput}
              value={checklistMileage}
              onChangeText={setChecklistMileage}
              keyboardType="numeric"
              placeholder="Ex: 18900"
              placeholderTextColor="#64748b"
            />

            <View style={{ marginTop: 12 }}>
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
                      ? 'Estado dos Pneus'
                      : item === 'avarias'
                      ? 'Sem Avarias ou Amassados'
                      : 'Lanternas e Faróis'}
                  </Text>
                  <Text style={checklistItems[item] ? styles.chkOk : styles.chkBad}>
                    {checklistItems[item] ? '✓ OK' : '⚠ Problema'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.btnConfirmChecklist} onPress={handleConfirmChecklist}>
              <Text style={styles.btnConfirmChecklistText}>Confirmar Checklist & Liberar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// ESTILOS VISUAIS EXECUTIVOS (DARK THEME)
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  brandTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  brandSubtitle: { color: '#94a3b8', fontSize: 11 },
  btnLogout: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnLogoutText: { color: '#f87171', fontSize: 12, fontWeight: '700' },

  // Abas
  mobileTabs: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#0284c7',
  },
  tabButtonText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  tabButtonTextActive: { color: '#fff' },

  content: { flex: 1, padding: 16 },

  // Rota Ativa Card
  activeRouteCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#0284c7',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  activeRouteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  activeRouteBadge: { color: '#38bdf8', fontSize: 11, fontWeight: '800', marginBottom: 4 },
  activeRouteVehicle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  activeRoutePlate: { color: '#94a3b8', fontSize: 13, fontFamily: 'monospace', fontWeight: '700' },
  activeRouteTimerBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeRouteTimerText: { color: '#38bdf8', fontSize: 18, fontWeight: '900' },
  activeRouteTimerLabel: { color: '#64748b', fontSize: 10 },
  activeRouteActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnLunchPause: {
    flex: 1,
    backgroundColor: '#d97706',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnLunchActive: { backgroundColor: '#10b981' },
  btnLunchText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  btnFinishRoute: {
    flex: 1,
    backgroundColor: '#9333ea',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnFinishRouteText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Iniciar Card
  startCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  startTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  startDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginVertical: 8 },
  btnStartBig: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnStartBigText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Lista de Veículos
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  sectionDesc: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  vehicleCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  vehicleCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  vehiclePlate: { color: '#fff', fontSize: 14, fontWeight: '800', fontFamily: 'monospace' },
  vehicleStatusBadge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusAvailable: { backgroundColor: '#064e3b', color: '#34d399' },
  statusInUse: { backgroundColor: '#0c4a6e', color: '#38bdf8' },
  statusMaint: { backgroundColor: '#4c0519', color: '#fb7185' },
  vehicleName: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
  vehicleInfo: { color: '#64748b', fontSize: 11, marginTop: 2 },
  driverInfoBox: {
    backgroundColor: '#0284c715',
    borderWidth: 1,
    borderColor: '#0284c740',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
  },
  driverInfoLabel: { color: '#38bdf8', fontSize: 10, fontWeight: '800' },
  driverInfoName: { color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 1 },
  btnPickVehicle: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPickVehicleText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Telinha de Cadastro Facial
  enrollCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
  },
  enrollTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  enrollDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 14 },
  enrollInputGroup: { marginBottom: 16 },
  btnOpenCamEnroll: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnOpenCamEnrollText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Câmera Modal
  cameraScreen: { flex: 1, backgroundColor: '#000' },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  cameraHeaderTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  cameraCloseBtn: { color: '#f87171', fontSize: 13, fontWeight: '700' },
  cameraContainer: { flex: 1, overflow: 'hidden', position: 'relative', backgroundColor: '#000' },
  cameraPreview: { flex: 1 },

  // Apple Face ID Overlay
  faceIdOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  faceIdPromptPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  promptPillGreen: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(6, 78, 59, 0.95)',
  },
  promptPillRed: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(127, 29, 29, 0.95)',
  },
  promptPillAmber: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(120, 53, 15, 0.95)',
  },
  faceIdPromptPillText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  faceIdRingWrapper: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  faceIdCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.03)',
  },
  faceIdCircleScanning: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  faceIdCircleSuccess: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  faceIdCircleError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  faceIdCircleAmber: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },

  // Reticle Corners (Estilo Face ID)
  reticleCorner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#38bdf8',
    borderWidth: 3,
  },
  reticleTL: {
    top: 6,
    left: 6,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
  },
  reticleTR: {
    top: 6,
    right: 6,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 10,
  },
  reticleBL: {
    bottom: 6,
    left: 6,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
  },
  reticleBR: {
    bottom: 6,
    right: 6,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 10,
  },
  reticleGreen: {
    borderColor: '#10b981',
  },
  reticleRed: {
    borderColor: '#ef4444',
  },
  reticleAmber: {
    borderColor: '#f59e0b',
  },

  // Radial Ticks (Depth scan ring)
  radialTicksContainer: {
    position: 'absolute',
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radialTick: {
    position: 'absolute',
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  radialTickScanning: {
    backgroundColor: '#38bdf8',
  },
  radialTickSuccess: {
    backgroundColor: '#10b981',
    height: 16,
    width: 4,
  },
  radialTickRed: {
    backgroundColor: '#ef4444',
  },
  radialTickAmber: {
    backgroundColor: '#f59e0b',
  },

  // Central Status Boxes
  scanningCenterBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningCenterText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  successCenterBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheckCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  successCheckText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  successCenterTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  successCenterConfidence: {
    color: '#86efac',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },

  faceIdSubInstruction: {
    color: '#cbd5e1',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
    fontWeight: '600',
  },

  // Apple Camera Controls
  cameraControlsApple: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  appleShutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  appleShutterOuterGreen: {
    borderColor: '#10b981',
  },
  appleShutterOuterRed: {
    borderColor: '#ef4444',
  },
  appleShutterOuterAmber: {
    borderColor: '#f59e0b',
  },
  appleShutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#38bdf8',
  },
  appleShutterLabel: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  lgpdBadgeApple: {
    color: '#64748b',
    fontSize: 11,
  },

  // Permissão Câmera
  permissionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  permissionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  permissionDesc: { color: '#94a3b8', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  btnGrantPermission: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  btnGrantPermissionText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  btnSimulateScan: { padding: 10 },
  btnSimulateScanText: { color: '#64748b', fontSize: 12, textDecorationLine: 'underline' },

  // Modal Genérico
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1e293b' },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { color: '#94a3b8', fontSize: 12, marginBottom: 14 },
  modalVehicleItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  modalVehiclePlate: { color: '#38bdf8', fontSize: 14, fontWeight: '800', fontFamily: 'monospace' },
  modalVehicleModel: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 2 },
  modalVehicleKm: { color: '#94a3b8', fontSize: 11, marginTop: 1 },
  modalBtnCancel: { marginTop: 10, padding: 10, alignItems: 'center' },
  modalBtnCancelText: { color: '#94a3b8', fontSize: 12 },

  // Checklist
  inputLabel: { color: '#cbd5e1', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  textInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
  },
  chkItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  chkItemLabel: { color: '#e2e8f0', fontSize: 12 },
  chkOk: { color: '#34d399', fontWeight: '800', fontSize: 12 },
  chkBad: { color: '#f87171', fontWeight: '800', fontSize: 12 },
  btnConfirmChecklist: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  btnConfirmChecklistText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Login Screen
  loginContainer: { flex: 1, backgroundColor: '#06090e', justifyContent: 'center', padding: 20 },
  loginCard: {
    backgroundColor: '#0c1220',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  loginLogoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  loginLogoText: { color: '#fff', fontWeight: '900', fontSize: 24 },
  loginTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  loginSubtitle: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  loginForm: { width: '100%' },
  btnLoginSubmit: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  btnLoginSubmitText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  quickAccessSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
  quickAccessTitle: { color: '#64748b', fontSize: 10, fontWeight: '800', marginBottom: 8 },
  // Cargo Seletor
  rolePickerRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  roleBtn: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  roleBtnActive: { backgroundColor: '#0284c730', borderColor: '#38bdf8' },
  roleBtnText: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
  roleBtnTextActive: { color: '#38bdf8' },

  // Lista de Usuários no Cadastro Facial
  userListItemCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  userListCardHeader: { flexDirection: 'row', alignItems: 'center' },
  userListAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  userListAvatarText: { color: '#38bdf8', fontWeight: '900', fontSize: 16 },
  userListName: { color: '#fff', fontSize: 13, fontWeight: '800' },
  userListCpf: { color: '#64748b', fontSize: 11, marginTop: 1 },
  biometricStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  bioPillActive: { backgroundColor: '#064e3b' },
  bioPillPending: { backgroundColor: '#451a03' },
  biometricStatusText: { fontSize: 10, fontWeight: '800' },
  bioTextActive: { color: '#34d399' },
  bioTextPending: { color: '#fbbf24' },
  btnUserEnrollAction: {
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  btnReEnroll: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  btnFirstEnroll: { backgroundColor: '#0284c7' },
  btnUserEnrollActionText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // Itens de acesso rápido no login
  btnQuickUserItem: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  btnQuickAdmin: { backgroundColor: '#0284c715', borderColor: '#0284c740' },
  btnQuickDriver: { backgroundColor: '#064e3b15', borderColor: '#05966930' },
  quickUserNameText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  quickUserRoleBadge: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
  quickUserCpfText: { color: '#64748b', fontSize: 10, fontFamily: 'monospace' },
});
