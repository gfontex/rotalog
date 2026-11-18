'use client';

import React, { useState, useEffect } from 'react';
import { X, Car, UserPlus, Save, Building2, ShieldCheck, KeyRound, Info } from 'lucide-react';
import { webApi } from '../services/api';
import { UI_TOKENS } from '../theme';

// =========================================================================
// MODAL: CADASTRAR NOVA EMPRESA / BASE
// =========================================================================
interface NewTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewTenantModal({ isOpen, onClose, onSuccess }: NewTenantModalProps) {
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminCpf, setAdminCpf] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !adminName || !adminCpf || !adminEmail) {
      alert('Preencha os campos obrigatórios da Empresa e do Administrador.');
      return;
    }

    setLoading(true);
    try {
      await webApi.createTenant({
        name,
        cnpj,
        adminName,
        adminCpf,
        adminEmail,
        adminPassword: adminPassword || adminCpf,
      });
      alert(`Empresa "${name}" e conta Administrador criadas com sucesso no banco de dados.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao cadastrar empresa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${UI_TOKENS.card} max-w-lg w-full p-6`}>
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-primary" />
            <h3 className="font-bold text-content-primary text-base">Criar Nova Empresa / Base Operacional</h3>
          </div>
          <button onClick={onClose} className="text-content-secondary hover:text-content-primary cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className={`p-3 rounded-xl text-xs ${UI_TOKENS.badgeInfo}`}>
            Ao cadastrar uma nova empresa (ex: Teste Apresentação), o sistema gera automaticamente a conta de <strong>Administrador Geral</strong> que receberá as credenciais para gerenciar a frota e os colaboradores.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Nome da Empresa / Base *</label>
              <input
                type="text"
                placeholder="Ex: Teste Apresentação"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={UI_TOKENS.input}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">CNPJ (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: 12.345.678/0001-90"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className={`${UI_TOKENS.input} font-mono`}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-surface-border">
            <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider mb-2">Conta do Administrador da Empresa</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">Nome do Gestor / Admin *</label>
                <input
                  type="text"
                  placeholder="Ex: Roberto Gestor MK"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className={UI_TOKENS.input}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">CPF do Admin *</label>
                  <input
                    type="text"
                    placeholder="Ex: 000.111.222-33"
                    value={adminCpf}
                    onChange={(e) => setAdminCpf(e.target.value)}
                    className={`${UI_TOKENS.input} font-mono`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-secondary mb-1">E-mail do Admin *</label>
                  <input
                    type="email"
                    placeholder="admin@empresa.com.br"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className={UI_TOKENS.input}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">
                  Senha do Administrador (Padrão: CPF)
                </label>
                <input
                  type="password"
                  placeholder="Deixe em branco para usar o CPF"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className={UI_TOKENS.input}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 ${UI_TOKENS.btnSecondary}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 ${UI_TOKENS.btnPrimary}`}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Criar Empresa & Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// MODAL: CADASTRAR NOVO VEICULO
// =========================================================================
interface NewVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenants?: any[];
}

export function NewVehicleModal({ isOpen, onClose, onSuccess, tenants = [] }: NewVehicleModalProps) {
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2024');
  const [mileage, setMileage] = useState('0');
  const [status, setStatus] = useState<'AVAILABLE' | 'MAINTENANCE'>('AVAILABLE');
  const [tenantId, setTenantId] = useState(tenants[0]?.id || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenants.length > 0 && !tenantId) {
      setTenantId(tenants[0].id);
    }
  }, [tenants, tenantId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !brand || !model) {
      alert('Preencha os campos obrigatórios (Placa, Marca e Modelo).');
      return;
    }

    setLoading(true);
    try {
      await webApi.createVehicle({
        plate: plate.toUpperCase().trim(),
        brand,
        model,
        year: parseInt(year, 10) || 2024,
        currentMileage: parseInt(mileage, 10) || 0,
        status,
        tenantId: tenantId || tenants[0]?.id,
      });
      alert('Veículo cadastrado com sucesso no banco de dados.');
      setPlate('');
      setBrand('');
      setModel('');
      setMileage('0');
      setStatus('AVAILABLE');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao cadastrar veículo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${UI_TOKENS.card} max-w-md w-full p-6`}>
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-brand-primary" />
            <h3 className="font-bold text-content-primary text-base">Cadastrar Novo Veículo na Frota</h3>
          </div>
          <button onClick={onClose} className="text-content-secondary hover:text-content-primary cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {tenants.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Empresa / Base</label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className={UI_TOKENS.input}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Placa do Veículo *</label>
            <input
              type="text"
              placeholder="Ex: TAP1A01"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              className={`${UI_TOKENS.input} uppercase font-mono`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Marca *</label>
              <input
                type="text"
                placeholder="Ex: Fiat"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={UI_TOKENS.input}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Modelo *</label>
              <input
                type="text"
                placeholder="Ex: Strada Freedom"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={UI_TOKENS.input}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Ano de Fabricação</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={`${UI_TOKENS.input} font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Odômetro Atual (Km)</label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className={`${UI_TOKENS.input} font-mono`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Status Inicial do Veículo</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'AVAILABLE' | 'MAINTENANCE')}
              className={UI_TOKENS.input}
            >
              <option value="AVAILABLE">Disponível no Pátio (Pronto para Rota)</option>
              <option value="MAINTENANCE">Em Manutenção / Oficina</option>
            </select>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 ${UI_TOKENS.btnSecondary}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 ${UI_TOKENS.btnPrimary}`}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar Veículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// MODAL: CADASTRAR NOVO COLABORADOR COM SENHA E HIERARQUIA
// =========================================================================
interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenants?: any[];
  currentUserRole?: 'ADMIN' | 'FLEET_MANAGER' | 'DRIVER' | string;
}

export function NewUserModal({ isOpen, onClose, onSuccess, tenants = [], currentUserRole = 'ADMIN' }: NewUserModalProps) {
  const isFleetManager = currentUserRole === 'FLEET_MANAGER';
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('DRIVER');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState(tenants[0]?.id || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isFleetManager) {
      setRole('DRIVER');
    }
  }, [isFleetManager]);

  useEffect(() => {
    if (tenants.length > 0 && !tenantId) {
      setTenantId(tenants[0].id);
    }
  }, [tenants, tenantId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cpf) {
      alert('Preencha os campos obrigatórios (Nome e CPF).');
      return;
    }

    setLoading(true);
    try {
      const chosenPassword = password.trim().length > 0 ? password.trim() : cpf.trim();

      await webApi.createUser({
        name,
        cpf,
        email: email.trim() || undefined,
        role: isFleetManager ? 'DRIVER' : role,
        creatorRole: currentUserRole,
        password: chosenPassword,
        tenantId: tenantId || tenants[0]?.id,
      });

      alert(
        `Colaborador "${name}" cadastrado com sucesso.\n` +
        `Perfil: ${isFleetManager ? 'DRIVER (Motorista)' : role}\n` +
        `Senha de acesso: ${chosenPassword}`
      );
      setName('');
      setCpf('');
      setEmail('');
      setPassword('');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao cadastrar colaborador: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${UI_TOKENS.card} max-w-md w-full p-6`}>
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-content-primary text-base">Cadastrar Colaborador & Senha</h3>
          </div>
          <button onClick={onClose} className="text-content-secondary hover:text-content-primary cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {tenants.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Empresa / Base</label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className={UI_TOKENS.input}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Nome Completo *</label>
            <input
              type="text"
              placeholder="Ex: Carlos Eduardo Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={UI_TOKENS.input}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">CPF (apenas números ou com traço) *</label>
            <input
              type="text"
              placeholder="Ex: 111.222.333-44"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className={`${UI_TOKENS.input} font-mono`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">E-mail Corporativo (Opcional)</label>
            <input
              type="email"
              placeholder="nome@testeapresentacao.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={UI_TOKENS.input}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">
              Hierarquia Operacional / Perfil de Acesso *
            </label>
            {isFleetManager ? (
              <div className="p-3 bg-surface-elevated border border-blue-500/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <Car className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400">Motorista Operacional</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono">Somente Motoristas</span>
                </div>
                <p className="text-[11px] text-content-secondary mt-1">
                  O perfil de <strong>Gestor de Frota</strong> tem permissão para cadastrar apenas <strong>Motoristas</strong>. O cadastro de outros gestores é exclusivo do Admin (Representante Legal).
                </p>
              </div>
            ) : (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={UI_TOKENS.input}
              >
                <option value="DRIVER">Motorista (Rotas, checklists e seu histórico)</option>
                <option value="FLEET_MANAGER">Gestor de Frota (Cadastra motoristas, carros, status e relatórios)</option>
                <option value="ADMIN">Admin / Representante Legal (Permissão total no sistema)</option>
              </select>
            )}
          </div>

          <div className="bg-surface-elevated p-3 rounded-xl border border-surface-border">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Senha de Acesso do Colaborador
              </label>
            </div>
            <p className="text-[11px] text-amber-400 mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Recomendação:</strong> Se deixar vazio, o CPF será definido como senha inicial.
              </span>
            </p>
            <input
              type="text"
              placeholder="Digite uma senha personalizada ou deixe em branco"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${UI_TOKENS.input} font-mono`}
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 ${UI_TOKENS.btnSecondary}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="keep-white flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar no Banco'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
