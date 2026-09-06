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

export default function App() {
  // Simulação de conectividade de rede (Online x Offline)
  const [isNetworkOnline, setIsNetworkOnline] = useState<boolean>(true);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);

  // Usuário ativo
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

  // Veículo vinculado
  const [vehicle, setVehicle] = useState<AssignedVehicle>({
    id: 'v1',
    plate: 'RTL9A88',
    brand: 'Volkswagen',
    model: 'Gol 1.0 MPI',
    currentMileage: 58120,
    status: 'IN_USE',
  });

  // Sessão de rota ativa (Controle de Horas de Uso)
  const [activeRoute, setActiveRoute] = useState<{
    inProgress: boolean;
    startMileage: number;
    startTime: string;
    elapsedMinutes: number;
  }>({
    inProgress: true,
    startMileage: 58040,
    startTime: '08:15',
    elapsedMinutes: 85, // 1h 25m em rota
  });

  // Batidas de ponto do dia
  const [clockings, setClockings] = useState<ClockingRecord[]>([
    {
      id: '1',
      type: 'IN',
      timestamp: '07:45',
      facialVerified: true,
      matchScore: 98.8,
    },
    {
      id: '2',
      type: 'LUNCH_OUT',
      timestamp: '12:02',
      facialVerified: true,
      matchScore: 99.1,
    },
  ]);

  // Modais de Operação
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistType, setChecklistType] = useState<'ENTRY' | 'EXIT'>('EXIT');
  const [faceScanState, setFaceScanState] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');

  // Estado do Checklist
  const [checklistItems, setChecklistItems] = useState<{ [key: string]: boolean }>({
    combustivel: true,
    pneus: true,
    documentacao: true,
    avarias: true,
    limpeza: true,
    iluminacao: true,
  });
  const [checklistObs, setChecklistObs] = useState('');
  const [checklistMileage, setChecklistMileage] = useState('58120');

  // Inscrever-se nas mudanças da fila offline
  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe(() => {
      setPendingQueueCount(offlineQueue.getPendingCount());
    });
    return () => unsubscribe();
  }, []);

  // Disparar batida facial (Pipeline On-Device)
  const handleStartFacialPunch = () => {
    setIsFaceModalOpen(true);
    setFaceScanState('SCANNING');

    // Simula a detecção do ML Kit e cálculo de embedding do TFLite
    setTimeout(() => {
      setFaceScanState('SUCCESS');
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      setTimeout(() => {
        const newRecord: ClockingRecord = {
          id: String(Date.now()),
          type: clockings.length % 2 === 0 ? 'IN' : 'OUT',
          timestamp: timeStr,
          facialVerified: true,
          matchScore: 98.5,
        };

        if (!isNetworkOnline) {
          offlineQueue.enqueueClocking({
            type: newRecord.type,
            timestamp: newRecord.timestamp,
            facialVerified: true,
            matchScore: 98.5,
          });
        }

        setClockings([newRecord, ...clockings]);
        setIsFaceModalOpen(false);
        setFaceScanState('IDLE');

        Alert.alert(
          'Ponto Registrado!',
          !isNetworkOnline
            ? `Ponto registrado offline às ${timeStr} e enfileirado para sincronização.`
            : `Ponto batido com sucesso às ${timeStr} com validação biométrica on-device.`,
        );
      }, 1000);
    }, 1800);
  };

  // Abrir checklist de entrada ou saída
  const openChecklist = (type: 'ENTRY' | 'EXIT') => {
    setChecklistType(type);
    setChecklistObs('');
    setIsChecklistModalOpen(true);
  };

  // Salvar Checklist (com suporte Offline-First e cálculo de rota)
  const handleSaveChecklist = () => {
    const mileageNum = parseInt(checklistMileage, 10) || vehicle.currentMileage;
    const hasProblem = Object.values(checklistItems).some((item) => !item);

    setIsChecklistModalOpen(false);

    if (checklistType === 'ENTRY') {
      // Inicia rota
      setActiveRoute({
        inProgress: true,
        startMileage: mileageNum,
        startTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        elapsedMinutes: 0,
      });
      setVehicle({ ...vehicle, status: 'IN_USE', currentMileage: mileageNum });
    } else {
      // Finaliza rota
      const kmDriven = Math.max(0, mileageNum - activeRoute.startMileage);
      setActiveRoute({
        inProgress: false,
        startMileage: mileageNum,
        startTime: '',
        elapsedMinutes: 0,
      });
      setVehicle({
        ...vehicle,
        status: hasProblem ? 'MAINTENANCE' : 'AVAILABLE',
        currentMileage: mileageNum,
      });
    }

    // Se estiver sem conexão, enfileira localmente
    if (!isNetworkOnline) {
      offlineQueue.enqueueChecklist({
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.plate,
        type: checklistType,
        mileage: mileageNum,
        itemsResult: checklistItems,
        observation: checklistObs,
        hasProblem,
      });

      Alert.alert(
        'Modo Offline Ativo',
        `Checklist de ${checklistType === 'ENTRY' ? 'Entrada' : 'Saída'} gravado localmente no smartphone. Será sincronizado automaticamente assim que a conexão retornar.`,
      );
      return;
    }

    // Caso online: confirmação instantânea
    Alert.alert(
      hasProblem ? 'Alerta de Avaria!' : 'Checklist Concluído!',
      checklistType === 'ENTRY'
        ? 'Checklist de entrada concluído. Veículo liberado para rota.'
        : hasProblem
        ? 'Avaria reportada! Veículo direcionado para MANUTENÇÃO e Gestor notificado.'
        : 'Checklist de saída concluído com sucesso. Veículo liberado na base.',
    );
  };

  // Sincronizar fila pendente
  const handleSyncQueue = async () => {
    if (pendingQueueCount === 0) {
      Alert.alert('Fila Vazia', 'Não há itens pendentes para sincronizar no momento.');
      return;
    }

    offlineQueue.clearQueue();
    Alert.alert('Sincronização Concluída', 'Todos os checklists e batidas offline foram enviados com sucesso ao servidor.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* HEADER CORPORATIVO */}
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

        {/* Botão de Toggle de Rede para Teste Offline */}
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

        {/* BOTÃO PRINCIPAL: BATER PONTO COM RECONHECIMENTO FACIAL */}
        <TouchableOpacity style={styles.punchButton} onPress={handleStartFacialPunch} activeOpacity={0.85}>
          <View style={styles.punchIconCircle}>
            <Text style={styles.punchIconText}>👤</Text>
          </View>
          <View style={styles.punchTextContainer}>
            <Text style={styles.punchTitle}>Bater Ponto Facial</Text>
            <Text style={styles.punchSubtitle}>Validação 100% on-device (ML Kit + TFLite)</Text>
          </View>
        </TouchableOpacity>

        {/* CARD DE ROTA E VEÍCULO EM USO */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Controle de Uso do Veículo</Text>
          <TouchableOpacity onPress={() => openChecklist(activeRoute.inProgress ? 'EXIT' : 'ENTRY')}>
            <Text style={styles.sectionAction}>
              {activeRoute.inProgress ? 'Checklist Saída' : 'Checklist Entrada'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.vehicleCard}>
          <View style={styles.vehicleRow}>
            <View>
              <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
              <Text style={styles.vehicleModel}>
                {vehicle.brand} {vehicle.model}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                vehicle.status === 'AVAILABLE' && styles.statusBadgeAvailable,
                vehicle.status === 'MAINTENANCE' && styles.statusBadgeMaintenance,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  vehicle.status === 'AVAILABLE' && styles.statusBadgeTextAvailable,
                  vehicle.status === 'MAINTENANCE' && styles.statusBadgeTextMaintenance,
                ]}
              >
                {vehicle.status === 'IN_USE' && 'Em Rota'}
                {vehicle.status === 'AVAILABLE' && 'Disponível'}
                {vehicle.status === 'MAINTENANCE' && 'Manutenção'}
              </Text>
            </View>
          </View>

          {/* Medidor de Tempo em Rota (Controle de Horas da Fase 2) */}
          {activeRoute.inProgress ? (
            <View style={styles.activeRouteBox}>
              <View style={styles.routeMetricItem}>
                <Text style={styles.routeMetricLabel}>Início da Rota</Text>
                <Text style={styles.routeMetricValue}>{activeRoute.startTime}</Text>
              </View>
              <View style={styles.routeMetricItem}>
                <Text style={styles.routeMetricLabel}>Tempo em Operação</Text>
                <Text style={styles.routeMetricValueHighlight}>
                  {Math.floor(activeRoute.elapsedMinutes / 60)}h {activeRoute.elapsedMinutes % 60}m
                </Text>
              </View>
              <View style={styles.routeMetricItem}>
                <Text style={styles.routeMetricLabel}>Km Inicial</Text>
                <Text style={styles.routeMetricValue}>{activeRoute.startMileage}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noRouteBox}>
              <Text style={styles.noRouteText}>Nenhuma rota em andamento. Faça o Checklist de Entrada.</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.vehicleDetailsRow}>
            <View>
              <Text style={styles.detailLabel}>Odômetro Atual</Text>
              <Text style={styles.detailValue}>{vehicle.currentMileage.toLocaleString('pt-BR')} km</Text>
            </View>

            <TouchableOpacity
              style={styles.checklistQuickBtn}
              onPress={() => openChecklist(activeRoute.inProgress ? 'EXIT' : 'ENTRY')}
            >
              <Text style={styles.checklistQuickBtnText}>
                {activeRoute.inProgress ? 'Finalizar Rota' : 'Iniciar Rota'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CARD DA FILA OFFLINE-FIRST (SE HOUVER PENDÊNCIAS) */}
        {pendingQueueCount > 0 && (
          <View style={styles.queueCard}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitle}>⚠ Fila Offline com {pendingQueueCount} pendência(s)</Text>
              <TouchableOpacity style={styles.syncBtn} onPress={handleSyncQueue}>
                <Text style={styles.syncBtnText}>Sincronizar</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.queueSubtitle}>
              Os dados estão salvos com segurança no aparelho e serão transmitidos ao servidor.
            </Text>
          </View>
        )}

        {/* HISTÓRICO DE PONTOS DE HOJE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Jornada de Hoje (CLT)</Text>
          <Text style={styles.sectionSubtitle}>{clockings.length} batidas registradas</Text>
        </View>

        <View style={styles.historyCard}>
          {clockings.map((c, index) => (
            <View key={c.id} style={[styles.clockingRow, index > 0 && styles.clockingRowBorder]}>
              <View style={styles.clockingLeft}>
                <View style={styles.clockingIconBox}>
                  <Text style={styles.clockingIcon}>⏰</Text>
                </View>
                <View>
                  <Text style={styles.clockingType}>
                    {c.type === 'IN' && 'Entrada de Turno'}
                    {c.type === 'OUT' && 'Saída de Turno'}
                    {c.type === 'LUNCH_OUT' && 'Pausa Almoço (Saída)'}
                    {c.type === 'LUNCH_IN' && 'Retorno Almoço (Entrada)'}
                  </Text>
                  <Text style={styles.clockingMatch}>Biometria: {c.matchScore}% de similaridade</Text>
                </View>
              </View>
              <Text style={styles.clockingTime}>{c.timestamp}</Text>
            </View>
          ))}
        </View>

        {/* RODAPÉ INFORMATIVO */}
        <View style={styles.offlineFooter}>
          <Text style={styles.offlineFooterText}>
            ☁ Fila Offline: {pendingQueueCount} pendências | Conexão: {isNetworkOnline ? 'Ativa' : 'Desconectada'}
          </Text>
        </View>
      </ScrollView>

      {/* MODAL DE RECONHECIMENTO FACIAL ON-DEVICE */}
      <Modal visible={isFaceModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.faceModalContainer}>
            <Text style={styles.faceModalTitle}>Reconhecimento Facial</Text>
            <Text style={styles.faceModalSubtitle}>Posicione seu rosto no quadro abaixo</Text>

            <View style={styles.cameraBox}>
              <View style={[styles.cameraGuide, faceScanState === 'SUCCESS' && styles.cameraGuideSuccess]}>
                {faceScanState === 'SCANNING' && <Text style={styles.scanText}>Analisando traços faciais...</Text>}
                {faceScanState === 'SUCCESS' && <Text style={styles.successText}>✓ Rosto Confirmado!</Text>}
              </View>
            </View>

            <View style={styles.pipelineInfo}>
              <Text style={styles.pipelineText}>⚙ ML Kit: Rosto Detectado</Text>
              <Text style={styles.pipelineText}>⚙ TFLite MobileFaceNet: Vetor Gerado</Text>
              <Text style={styles.pipelineText}>🔒 LGPD: Nenhuma foto é transmitida</Text>
            </View>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setIsFaceModalOpen(false);
                setFaceScanState('IDLE');
              }}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CHECKLIST VEICULAR (ENTRADA / SAÍDA) */}
      <Modal visible={isChecklistModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.checklistModalContainer}>
            <Text style={styles.checklistModalTitle}>
              Checklist de {checklistType === 'ENTRY' ? 'Entrada (Início de Rota)' : 'Saída (Fim de Rota)'}
            </Text>
            <Text style={styles.checklistModalSubtitle}>
              {vehicle.plate} • {vehicle.brand} {vehicle.model}
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
                <Text style={styles.inputLabel}>Observações ou Descrição de Avarias</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={checklistObs}
                  onChangeText={setChecklistObs}
                  placeholder="Informe detalhes caso haja algum problema..."
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
                  {checklistType === 'ENTRY' ? 'Liberar Veículo' : 'Concluir Devolução'}
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
  punchButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#2563eb',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  punchIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchIconText: {
    fontSize: 20,
  },
  punchTextContainer: {
    flex: 1,
  },
  punchTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  punchSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionAction: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 12,
  },
  vehicleCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehiclePlate: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  vehicleModel: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  statusBadgeAvailable: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBadgeMaintenance: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusBadgeText: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadgeTextAvailable: {
    color: '#34d399',
  },
  statusBadgeTextMaintenance: {
    color: '#f87171',
  },
  activeRouteBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  noRouteBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  noRouteText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  routeMetricItem: {
    alignItems: 'center',
  },
  routeMetricLabel: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  routeMetricValue: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  routeMetricValueHighlight: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1f2937',
    marginVertical: 12,
  },
  vehicleDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 11,
  },
  detailValue: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checklistQuickBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  checklistQuickBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  queueCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  queueTitle: {
    color: '#fde047',
    fontSize: 13,
    fontWeight: 'bold',
  },
  syncBtn: {
    backgroundColor: '#ca8a04',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  queueSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  clockingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  clockingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  clockingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clockingIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockingIcon: {
    fontSize: 14,
  },
  clockingType: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  clockingMatch: {
    color: '#34d399',
    fontSize: 11,
  },
  clockingTime: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: 'bold',
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

  // Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
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
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  cameraBox: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#090d16',
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  cameraGuide: {
    width: 180,
    height: 180,
    borderRadius: 90,
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
    marginBottom: 16,
  },
  pipelineText: {
    color: '#64748b',
    fontSize: 11,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },

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
    height: 70,
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
