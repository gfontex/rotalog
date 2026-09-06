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
import { UserProfile, AssignedVehicle, ClockingRecord } from './src/types';
import { offlineQueue } from './src/services/offlineQueue';

interface FleetVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  currentMileage: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
}

export default function App() {
  // Simulação de conectividade de rede (Online x Offline)
  const [isNetworkOnline, setIsNetworkOnline] = useState<boolean>(true);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);

  // Usuário ativo (Motorista)
  const [user] = useState<UserProfile>({
    id: 'u1',
    name: 'João Silva',
    cpf: '333.444.555-66',
    email: 'motorista@rotalog.com',
    role: 'DRIVER',
    tenantId: 'tenant-1',
    branchName: 'Matriz São Paulo',
    biometricEnrolled: true,
  });

  // Lista de veículos disponíveis para seleção (Passo 1 do fluxo)
  const [availableVehicles, setAvailableVehicles] = useState<FleetVehicle[]>([
    {
      id: 'v1',
      plate: 'RTL9A88',
      brand: 'Volkswagen',
      model: 'Gol 1.0 MPI',
      currentMileage: 58040,
      status: 'AVAILABLE',
    },
    {
      id: 'v2',
      plate: 'BRA2E19',
      brand: 'Fiat',
      model: 'Strada Freedom 1.3',
      currentMileage: 35400,
      status: 'AVAILABLE',
    },
    {
      id: 'v3',
      plate: 'LOG4F33',
      brand: 'Chevrolet',
      model: 'Onix Plus Premier',
      currentMileage: 12800,
      status: 'MAINTENANCE',
    },
  ]);

  // Veículo selecionado pelo motorista
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);

  // Sessão de rota ativa (Controle de Horas de Uso e Pausa de Almoço)
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

  // Modais do Fluxo Operacional
  const [isVehicleSelectModalOpen, setIsVehicleSelectModalOpen] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistType, setChecklistType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [faceScanState, setFaceScanState] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');

  // Estado dos Itens do Checklist
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

  // 1. Iniciar Processo: Selecionar Veículo
  const handleStartRouteProcess = () => {
    setIsVehicleSelectModalOpen(true);
  };

  // 2. Escolher o Veículo na lista e disparar Biometria Facial
  const handleSelectVehicle = (vehicle: FleetVehicle) => {
    if (vehicle.status === 'MAINTENANCE') {
      Alert.alert('Veículo em Manutenção', 'Este veículo está em reparo técnico e não pode ser liberado.');
      return;
    }
    setSelectedVehicle(vehicle);
    setChecklistMileage(String(vehicle.currentMileage));
    setIsVehicleSelectModalOpen(false);

    // Avança para a Validação Facial On-Device
    setIsFaceModalOpen(true);
    setFaceScanState('SCANNING');

    setTimeout(() => {
      setFaceScanState('SUCCESS');
      setTimeout(() => {
        setIsFaceModalOpen(false);
        setFaceScanState('IDLE');
        // Avança para o Checklist de Entrada
        setChecklistType('ENTRY');
        setChecklistObs('');
        setIsChecklistModalOpen(true);
      }, 900);
    }, 1600);
  };

  // 3. Salvar Checklist (Entrada ou Saída)
  const handleSaveChecklist = () => {
    const mileageNum = parseInt(checklistMileage, 10) || (selectedVehicle?.currentMileage ?? 0);
    const hasProblem = Object.values(checklistItems).some((item) => !item);

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

      // Atualiza status do veículo
      setAvailableVehicles(
        availableVehicles.map((v) =>
          v.id === selectedVehicle!.id ? { ...v, status: 'IN_USE', currentMileage: mileageNum } : v,
        ),
      );

      Alert.alert(
        'Iniciando Rota',
        `Iniciando rota com o carro ${selectedVehicle!.brand} ${selectedVehicle!.model} (Placa ${selectedVehicle!.plate}).`,
      );
    } else {
      // Checklist de Saída / Fim de Rota
      const kmDriven = Math.max(0, mileageNum - activeRoute.startMileage);
      const now = new Date();
      const endTimeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Salva no histórico de viagens
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

      // Atualiza o veículo na frota
      setAvailableVehicles(
        availableVehicles.map((v) =>
          v.id === activeRoute.vehicleId
            ? {
                ...v,
                status: hasProblem ? 'MAINTENANCE' : 'AVAILABLE',
                currentMileage: mileageNum,
              }
            : v,
        ),
      );

      // Reseta rota ativa
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

      Alert.alert(
        'Rota Finalizada',
        hasProblem
          ? 'Rota finalizada, checklist finalizado (Avaria reportada, veículo enviado para manutenção).'
          : 'Rota finalizada, checklist finalizado.',
      );
    }
  };

  // 4. Pausa para Almoço / Retomada (Opção A)
  const handleToggleLunch = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (!activeRoute.isOnLunch) {
      // Iniciar Pausa de Almoço
      setActiveRoute({
        ...activeRoute,
        isOnLunch: true,
        lunchStartTime: timeStr,
      });
      Alert.alert('Intervalo de Almoço', 'Iniciando intervalo para almoço.');
    } else {
      // Retomar Rota
      const pauseDuration = 45; // Simulação de 45 minutos de almoço
      setActiveRoute({
        ...activeRoute,
        isOnLunch: false,
        totalLunchMinutes: activeRoute.totalLunchMinutes + pauseDuration,
      });
      Alert.alert('Intervalo de Almoço', 'Intervalo para almoço finalizado.');
    }
  };

  // Abrir checklist de saída para finalizar o carro
  const handleOpenExitChecklist = () => {
    setChecklistType('EXIT');
    setChecklistObs('');
    setIsChecklistModalOpen(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>ROTALOG</Text>
            <Text style={styles.brandSubtitle}>App do Motorista</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setIsNetworkOnline(!isNetworkOnline)}
          style={[styles.onlineBadge, !isNetworkOnline && styles.offlineBadge]}
          activeOpacity={0.7}
        >
          <View style={[styles.onlineDot, !isNetworkOnline && styles.offlineDot]} />
          <Text style={[styles.onlineText, !isNetworkOnline && styles.offlineText]}>
            {isNetworkOnline ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CARD DO MOTORISTA */}
        <View style={styles.driverCard}>
          <View style={styles.driverRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{user.name.charAt(0)}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{user.name}</Text>
              <Text style={styles.driverCpf}>CPF: {user.cpf}</Text>
              <Text style={styles.driverBranch}>{user.branchName}</Text>
            </View>
          </View>
          <View style={styles.biometricBadge}>
            <Text style={styles.biometricBadgeText}>✓ Biometria Facial Registrada (LGPD)</Text>
          </View>
        </View>

        {/* ÁREA DE OPERAÇÃO: ROTA ATIVA OU INICIAR NOVA UTILIZAÇÃO */}
        {!activeRoute.inProgress ? (
          /* NENHUM CARRO EM USO: BOTÃO PARA PEGAR CARRO */
          <View style={styles.startActionCard}>
            <Text style={styles.startCardTitle}>Nenhum veículo em uso</Text>
            <Text style={styles.startCardSubtitle}>
              Selecione o modelo e a placa do carro para realizar a validação facial e o checklist de entrada.
            </Text>

            <TouchableOpacity style={styles.primaryActionButton} onPress={handleStartRouteProcess}>
              <Text style={styles.primaryActionIcon}>🚗</Text>
              <View>
                <Text style={styles.primaryActionText}>Selecionar Veículo & Iniciar</Text>
                <Text style={styles.primaryActionSub}>Reconhecimento facial + Checklist</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          /* VEÍCULO EM USO: PAINEL DE CONTROLE DE ROTA */
          <View style={styles.activeRouteCard}>
            <View style={styles.activeRouteHeader}>
              <View>
                <Text style={styles.activeRoutePlate}>{activeRoute.vehiclePlate}</Text>
                <Text style={styles.activeRouteModel}>{activeRoute.vehicleModel}</Text>
              </View>
              <View
                style={[
                  styles.activeRouteBadge,
                  activeRoute.isOnLunch && styles.activeRouteBadgeLunch,
                ]}
              >
                <Text
                  style={[
                    styles.activeRouteBadgeText,
                    activeRoute.isOnLunch && styles.activeRouteBadgeTextLunch,
                  ]}
                >
                  {activeRoute.isOnLunch ? 'Em Pausa (Almoço)' : 'Em Rota'}
                </Text>
              </View>
            </View>

            {/* Banner se estiver em almoço */}
            {activeRoute.isOnLunch && (
              <View style={styles.lunchAlertBanner}>
                <Text style={styles.lunchAlertText}>
                  🍽 Intervalo de Almoço em andamento desde às {activeRoute.lunchStartTime}
                </Text>
              </View>
            )}

            {/* Métricas da Rota */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Saída da Base</Text>
                <Text style={styles.metricVal}>{activeRoute.startTime}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Km Inicial</Text>
                <Text style={styles.metricVal}>{activeRoute.startMileage}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Pausa Almoço</Text>
                <Text style={styles.metricVal}>
                  {activeRoute.totalLunchMinutes > 0 ? `${activeRoute.totalLunchMinutes} min` : '0 min'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* BOTÕES DE AÇÃO NA ROTA: ALMOÇO (OPÇÃO A) E FINALIZAR */}
            <View style={styles.routeActionButtonsRow}>
              {/* Botão de Almoço / Pausa (Opção A: 1 clique rápido) */}
              <TouchableOpacity
                style={[
                  styles.lunchActionButton,
                  activeRoute.isOnLunch && styles.lunchActionButtonActive,
                ]}
                onPress={handleToggleLunch}
                activeOpacity={0.8}
              >
                <Text style={styles.lunchActionIcon}>{activeRoute.isOnLunch ? '▶' : '⏸'}</Text>
                <Text style={styles.lunchActionText}>
                  {activeRoute.isOnLunch ? 'Retomar Rota' : 'Pausa / Almoço'}
                </Text>
              </TouchableOpacity>

              {/* Botão de Finalizar Checklist de Saída */}
              <TouchableOpacity
                style={styles.finishRouteButton}
                onPress={handleOpenExitChecklist}
                activeOpacity={0.8}
              >
                <Text style={styles.finishRouteIcon}>🏁</Text>
                <Text style={styles.finishRouteText}>Devolver Carro</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* HISTÓRICO DE ROTAS E DEVOLUÇÕES DE HOJE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Histórico de Viagens de Hoje</Text>
          <Text style={styles.sectionSubtitle}>{recentTrips.length} concluídas</Text>
        </View>

        <View style={styles.historyCard}>
          {recentTrips.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>Nenhuma rota finalizada hoje ainda.</Text>
            </View>
          ) : (
            recentTrips.map((trip, idx) => (
              <View key={idx} style={[styles.tripRow, idx > 0 && styles.tripRowBorder]}>
                <View>
                  <Text style={styles.tripPlate}>{trip.plate} • {trip.model}</Text>
                  <Text style={styles.tripMeta}>
                    {trip.startTime} às {trip.endTime} • Almoço: {trip.lunchDuration}
                  </Text>
                </View>
                <View style={styles.tripStats}>
                  <Text style={styles.tripKm}>+{trip.kmDriven} km</Text>
                  <Text style={styles.tripDuration}>{trip.duration}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.offlineFooter}>
          <Text style={styles.offlineFooterText}>
            ☁ Fila Offline: {pendingQueueCount} pendências | Conexão: {isNetworkOnline ? 'Ativa' : 'Desconectada'}
          </Text>
        </View>
      </ScrollView>

      {/* MODAL 1: SELEÇÃO DE VEÍCULO (PLACA E MODELO) */}
      <Modal visible={isVehicleSelectModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.vehicleSelectContainer}>
            <Text style={styles.modalTitle}>Selecione o Veículo</Text>
            <Text style={styles.modalSubtitle}>Escolha o carro que você vai conduzir:</Text>

            <View style={styles.vehicleList}>
              {availableVehicles.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.vehicleSelectItem,
                    v.status === 'MAINTENANCE' && styles.vehicleSelectItemDisabled,
                  ]}
                  onPress={() => handleSelectVehicle(v)}
                  disabled={v.status === 'MAINTENANCE'}
                >
                  <View style={styles.vehicleSelectLeft}>
                    <View style={styles.vehicleSelectIconBox}>
                      <Text style={styles.vehicleSelectIcon}>🚗</Text>
                    </View>
                    <View>
                      <Text style={styles.vehicleSelectPlate}>{v.plate}</Text>
                      <Text style={styles.vehicleSelectModel}>
                        {v.brand} {v.model}
                      </Text>
                      <Text style={styles.vehicleSelectKm}>{v.currentMileage.toLocaleString('pt-BR')} km</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.vehicleStatusBadge,
                      v.status === 'AVAILABLE' && styles.statusAvailable,
                      v.status === 'IN_USE' && styles.statusInUse,
                      v.status === 'MAINTENANCE' && styles.statusMaintenance,
                    ]}
                  >
                    <Text style={styles.vehicleStatusBadgeText}>
                      {v.status === 'AVAILABLE' && 'Liberado'}
                      {v.status === 'IN_USE' && 'Em Uso'}
                      {v.status === 'MAINTENANCE' && 'Oficina'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setIsVehicleSelectModalOpen(false)}
            >
              <Text style={styles.closeModalBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: RECONHECIMENTO FACIAL ON-DEVICE */}
      <Modal visible={isFaceModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.faceModalContainer}>
            <Text style={styles.faceModalTitle}>Validação Facial do Motorista</Text>
            <Text style={styles.faceModalSubtitle}>
              Veículo: {selectedVehicle?.plate} ({selectedVehicle?.model})
            </Text>

            <View style={styles.cameraBox}>
              <View style={[styles.cameraGuide, faceScanState === 'SUCCESS' && styles.cameraGuideSuccess]}>
                {faceScanState === 'SCANNING' && <Text style={styles.scanText}>Analisando traços faciais...</Text>}
                {faceScanState === 'SUCCESS' && <Text style={styles.successText}>✓ Rosto Confirmado!</Text>}
              </View>
            </View>

            <View style={styles.pipelineInfo}>
              <Text style={styles.pipelineText}>⚙ ML Kit: Face identificada</Text>
              <Text style={styles.pipelineText}>⚙ TFLite: Vetor comparado on-device</Text>
              <Text style={styles.pipelineText}>🔒 LGPD: Nenhuma imagem armazenada</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: CHECKLIST DE ENTRADA OU SAÍDA */}
      <Modal visible={isChecklistModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.checklistModalContainer}>
            <Text style={styles.checklistModalTitle}>
              Checklist de {checklistType === 'ENTRY' ? 'Entrada (Início de Rota)' : 'Saída (Devolução do Carro)'}
            </Text>
            <Text style={styles.checklistModalSubtitle}>
              {checklistType === 'ENTRY' ? selectedVehicle?.plate : activeRoute.vehiclePlate} • Vistoria Obrigatória
            </Text>

            <ScrollView style={styles.checklistScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quilometragem no Painel (Km)</Text>
                <TextInput
                  style={styles.textInput}
                  value={checklistMileage}
                  onChangeText={setChecklistMileage}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.checklistSectionTitle}>Itens de Inspeção</Text>
              {Object.entries({
                combustivel: 'Nível de Combustível',
                pneus: 'Pneus e Calibragem',
                documentacao: 'Documentação CRLV',
                avarias: 'Avarias / Lataria',
                limpeza: 'Limpeza do Carro',
                iluminacao: 'Faróis e Lanternas',
              }).map(([key, label]) => {
                const isOk = checklistItems[key];
                return (
                  <View key={key} style={styles.checkItemRow}>
                    <Text style={styles.checkItemLabel}>{label}</Text>
                    <View style={styles.checkItemButtons}>
                      <TouchableOpacity
                        style={[styles.checkBtn, isOk && styles.checkBtnOkActive]}
                        onPress={() => setChecklistItems({ ...checklistItems, [key]: true })}
                      >
                        <Text style={[styles.checkBtnText, isOk && styles.checkBtnTextActive]}>OK</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.checkBtn, !isOk && styles.checkBtnProblemActive]}
                        onPress={() => setChecklistItems({ ...checklistItems, [key]: false })}
                      >
                        <Text style={[styles.checkBtnText, !isOk && styles.checkBtnTextProblemActive]}>Problema</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Observações ou Avarias</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={checklistObs}
                  onChangeText={setChecklistObs}
                  placeholder="Descreva detalhes..."
                  placeholderTextColor="#64748b"
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtnModal} onPress={() => setIsChecklistModalOpen(false)}>
                <Text style={styles.cancelBtnModalText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveChecklistBtn} onPress={handleSaveChecklist}>
                <Text style={styles.saveChecklistBtnText}>
                  {checklistType === 'ENTRY' ? 'Concluir e Liberar' : 'Finalizar e Devolver'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  brandTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '500',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  offlineBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  offlineDot: {
    backgroundColor: '#f87171',
  },
  onlineText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '600',
  },
  offlineText: {
    color: '#f87171',
  },
  scrollContent: {
    padding: 20,
    gap: 18,
  },
  driverCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#60a5fa',
    fontSize: 20,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverCpf: {
    color: '#94a3b8',
    fontSize: 12,
  },
  driverBranch: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  biometricBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  biometricBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // CARD INICIAL
  startActionCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
  },
  startCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startCardSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 18,
  },
  primaryActionButton: {
    width: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#2563eb',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 6,
  },
  primaryActionIcon: {
    fontSize: 24,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  primaryActionSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },

  // CARD ROTA ATIVA
  activeRouteCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  activeRouteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeRoutePlate: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  activeRouteModel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  activeRouteBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  activeRouteBadgeLunch: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  activeRouteBadgeText: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeRouteBadgeTextLunch: {
    color: '#facc15',
  },
  lunchAlertBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  lunchAlertText: {
    color: '#fde047',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  metricVal: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1f2937',
    marginVertical: 14,
  },
  routeActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lunchActionButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    gap: 6,
  },
  lunchActionButtonActive: {
    backgroundColor: '#854d0e',
    borderColor: '#ca8a04',
  },
  lunchActionIcon: {
    color: '#fde047',
    fontSize: 14,
  },
  lunchActionText: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
  finishRouteButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  finishRouteIcon: {
    fontSize: 14,
  },
  finishRouteText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // HISTÓRICO
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 12,
  },
  historyCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  emptyHistory: {
    padding: 20,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: '#64748b',
    fontSize: 12,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  tripRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  tripPlate: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tripMeta: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  tripStats: {
    alignItems: 'flex-end',
  },
  tripKm: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: 'bold',
  },
  tripDuration: {
    color: '#38bdf8',
    fontSize: 11,
  },
  offlineFooter: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  offlineFooterText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },

  // MODAL SELEÇÃO DE VEÍCULO
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  vehicleSelectContainer: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  vehicleList: {
    gap: 10,
    marginVertical: 6,
  },
  vehicleSelectItem: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleSelectItemDisabled: {
    opacity: 0.5,
  },
  vehicleSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleSelectIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleSelectIcon: {
    fontSize: 18,
  },
  vehicleSelectPlate: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  vehicleSelectModel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  vehicleSelectKm: {
    color: '#64748b',
    fontSize: 11,
  },
  vehicleStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusAvailable: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusInUse: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  statusMaintenance: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  vehicleStatusBadgeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  closeModalBtn: {
    marginTop: 14,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },

  // MODAL FACIAL
  faceModalContainer: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  faceModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  faceModalSubtitle: {
    color: '#38bdf8',
    fontSize: 12,
    marginTop: 4,
  },
  cameraBox: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#090d16',
    marginVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  cameraGuide: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: '#38bdf8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraGuideSuccess: {
    borderColor: '#34d399',
    borderStyle: 'solid',
  },
  scanText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  successText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: 'bold',
  },
  pipelineInfo: {
    width: '100%',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 10,
    gap: 4,
  },
  pipelineText: {
    color: '#64748b',
    fontSize: 11,
  },

  // MODAL CHECKLIST
  checklistModalContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  checklistModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checklistModalSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 14,
  },
  checklistScroll: {
    marginVertical: 10,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  checklistSectionTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 10,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  checkItemLabel: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  checkItemButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  checkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  checkBtnOkActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  checkBtnProblemActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  checkBtnText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  checkBtnTextActive: {
    color: '#34d399',
  },
  checkBtnTextProblemActive: {
    color: '#f87171',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  cancelBtnModal: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  cancelBtnModalText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  saveChecklistBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },
  saveChecklistBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
