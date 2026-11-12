'use client';

import React, { useState, useEffect } from 'react';
import { X, Car, UserPlus, Save, Building2, ShieldCheck, KeyRound } from 'lucide-react';
import { webApi } from '../services/api';

// =========================================================================
// MODAL: CADASTRAR NOVA EMPRESA / BASE (QUANDO VOCE VENDE UMA CONTA)
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
      alert(`Empresa "${name}" e conta Administrador criadas com sucesso no banco de dados!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao cadastrar empresa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1E293B] rounded-2xl max-w-lg w-full border border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Criar Nova Empresa / Base Operacional</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg text-xs text-indigo-300">
            Ao cadastrar uma nova empresa (ex: MK Segurança), o sistema gera automaticamente a conta de <strong>Administrador Geral</strong> que receberá as credenciais para gerenciar a frota e os colaboradores.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nome da Empresa / Base *</label>
              <input
                type="text"
                placeholder="Ex: MK Segurança"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">CNPJ (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: 12.345.678/0001-90"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Conta do Administrador da Empresa</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Gestor / Admin *</label>
                <input
                  type="text"
                  placeholder="Ex: Roberto Gestor MK"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">CPF do Admin *</label>
                  <input
                    type="text"
                    placeholder="Ex: 000.111.222-33"
                    value={adminCpf}
                    onChange={(e) => setAdminCpf(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">E-mail do Admin *</label>
                  <input
                    type="email"
                    placeholder="admin@mkseguranca.com.br"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Senha do Administrador (Padrão: CPF)
                </label>
                <input
                  type="password"
                  placeholder="Deixe em branco para usar o CPF"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/20"
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
  const [year, setYear] = useState('2023');
  const [mileage, setMileage] = useState('0');
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
        year: parseInt(year, 10) || 2023,
        currentMileage: parseInt(mileage, 10) || 0,
        tenantId: tenantId || tenants[0]?.id,
      });
      alert('Veículo cadastrado com sucesso no banco de dados!');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao cadastrar veículo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1E293B] rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Cadastrar Novo Veículo na Frota</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {tenants.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Empresa / Base</label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Placa do Veículo *</label>
            <input
              type="text"
              placeholder="Ex: MKS1A01"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Marca *</label>
              <input
                type="text"
                placeholder="Ex: Fiat"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Modelo *</label>
              <input
                type="text"
                placeholder="Ex: Strada Freedom"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Ano de Fabricação</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Odômetro Atual (Km)</label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center justify-center gap-1 shadow-lg shadow-blue-600/20"
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
  const [role, setRole] = useState(isFleetManager ? 'DRIVER' : 'DRIVER');
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
    if (!name || !cpf || !email) {
      alert('Preencha os campos obrigatórios (Nome, CPF e E-mail).');
      return;
    }

    setLoading(true);
    try {
      // Regra de Negocio: Se o gestor nao digitar senha, usa o CPF do funcionario
      const chosenPassword = password.trim().length > 0 ? password.trim() : cpf.trim();

      await webApi.createUser({
        name,
        cpf,
        email,
        role,
        password: chosenPassword,
        tenantId: tenantId || tenants[0]?.id,
      });

      alert(
        `Colaborador "${name}" cadastrado com sucesso no banco de dados!\n` +
        `Hierarquia: ${role}\n` +
        `Senha de acesso: ${chosenPassword}`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao cadastrar colaborador: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1E293B] rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Cadastrar Colaborador & Senha</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {tenants.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Empresa / Base</label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Nome Completo *</label>
            <input
              type="text"
              placeholder="Ex: Carlos Eduardo Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">CPF (apenas números ou com traço) *</label>
            <input
              type="text"
              placeholder="Ex: 111.222.333-44"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">E-mail Corporativo *</label>
            <input
              type="email"
              placeholder="carlos.silva@mkseguranca.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Hierarquia Operacional / Perfil de Acesso */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Hierarquia Operacional / Perfil de Acesso *
            </label>
            {isFleetManager ? (
              <div className="p-3 bg-slate-900 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400">🚗 Motorista Operacional</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">Restrito</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  O perfil de <strong>Gestor de Frota</strong> tem permissão para cadastrar apenas motoristas. O cadastro de novos gestores e administradores é exclusivo do Dono da Empresa (Master).
                </p>
              </div>
            ) : (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B1120] border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="DRIVER">🚗 Motorista Operacional (Acesso restrito às suas viagens)</option>
                <option value="FLEET_MANAGER">👔 Gestor de Rota / Frota (Controle da frota e cadastro de motoristas)</option>
                <option value="ADMIN">👑 Administrador Geral / Dono (Gestão completa, frotas e equipe)</option>
              </select>
            )}
          </div>

          {/* Campo de Senha com Recomendacao */}
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Senha de Acesso do Colaborador
              </label>
            </div>
            <p className="text-[11px] text-amber-400/90 mb-2">
              💡 <strong>Recomendação:</strong> O padrão é o <strong>CPF do funcionário</strong>. Se deixar vazio, o CPF será definido como senha inicial.
            </p>
            <input
              type="text"
              placeholder="Digite uma senha personalizada ou deixe em branco"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B1120] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/20"
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
