'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, KeyRound, UserPlus, CheckCircle, ArrowLeft, Lock, Users, Car, ExternalLink, RefreshCw } from 'lucide-react';
import { webApi } from '../../services/api';

export default function MasterSuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState('');

  // Estados do Formulário de Empresa
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminCpf, setAdminCpf] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Lista de Empresas
  const [tenants, setTenants] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTenants = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await webApi.getTenants();
      setTenants(data);
    } catch (err: any) {
      console.warn('Erro ao carregar empresas:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadTenants();
    }
  }, [isAuthenticated, loadTenants]);

  // Validação do Acesso Master
  const handleMasterLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcode.trim() === 'rotalog2026' || passcode.trim() === 'admin' || passcode.trim() === 'master') {
      setIsAuthenticated(true);
      setPassError('');
    } else {
      setPassError('Chave master incorreta. (Dica de demonstração: use "rotalog2026" ou "admin")');
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !adminName || !adminCpf || !adminEmail) {
      alert('Preencha os campos obrigatórios da Empresa e do Administrador.');
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    try {
      await webApi.createTenant({
        name,
        cnpj,
        adminName,
        adminCpf,
        adminEmail,
        adminPassword: adminPassword || adminCpf,
      });

      setSuccessMsg(`Empresa "${name}" criada com sucesso! O administrador ${adminName} já pode logar com o CPF ${adminCpf}.`);
      setName('');
      setCnpj('');
      setAdminName('');
      setAdminCpf('');
      setAdminEmail('');
      setAdminPassword('');
      loadTenants();
    } catch (err: any) {
      alert('Erro ao cadastrar empresa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Se não estiver desbloqueado, mostra a tela de Chave Master
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1E293B] border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <Lock className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-2xl font-black text-center text-white mb-2">Portal Master ROTALOG</h2>
          <p className="text-sm text-center text-slate-400 mb-6">
            Área restrita da Software House para cadastrar novas empresas clientes. Clientes comuns não têm acesso a esta tela.
          </p>

          <form onSubmit={handleMasterLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Chave Master de Desenvolvedor / Mantenedor</label>
              <input
                type="password"
                placeholder="Digite a chave master (ex: rotalog2026)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0B1120] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              {passError && <p className="text-xs text-rose-400 mt-1">{passError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm"
            >
              Acessar Painel Master
            </button>
          </form>

          {/* Atalho Rápido para Apresentação */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => {
                setPasscode('rotalog2026');
                setIsAuthenticated(true);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
            >
              [Clique aqui para Acesso Rápido na Apresentação]
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para o Login do Cliente
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Painel Master Desbloqueado
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200">
      {/* Topo Master */}
      <header className="bg-[#111827] border-b border-indigo-900/50 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">ROTALOG MASTER</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Área do Proprietário
                </span>
              </div>
              <p className="text-xs text-slate-400">Gestão de Empresas Clientes e Licenciamento</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadTenants}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              Atualizar
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              Ver Portal do Cliente
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulário: Cadastrar Nova Empresa */}
        <div className="lg:col-span-5 bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-white text-base">Cadastrar Nova Empresa Cliente</h2>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Aqui você cadastra a empresa contratante (ex: <strong>MK Segurança</strong>) e gera a conta do seu Administrador Geral. O cliente não faz auto-cadastro.
          </p>

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateTenant} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nome da Empresa / Base *</label>
              <input
                type="text"
                placeholder="Ex: MK Segurança"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B1120] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
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
                className="w-full px-3 py-2 bg-[#0B1120] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="pt-3 border-t border-slate-800">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2.5">
                Conta do Administrador do Cliente
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Gestor Geral *</label>
                  <input
                    type="text"
                    placeholder="Ex: Administrador MK"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1120] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">CPF do Gestor (Para Login) *</label>
                  <input
                    type="text"
                    placeholder="Ex: 000.111.222-33"
                    value={adminCpf}
                    onChange={(e) => setAdminCpf(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1120] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">E-mail do Gestor *</label>
                  <input
                    type="email"
                    placeholder="Ex: admin@mkseguranca.com.br"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1120] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Senha de Acesso (Opcional - Padrão é o próprio CPF)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: admin123 ou deixe vazio para usar o CPF"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1120] border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm mt-2"
            >
              {loading ? 'Cadastrando no Banco...' : 'Criar Empresa & Ativar Administrador'}
            </button>
          </form>
        </div>

        {/* Lista de Empresas Contratantes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-white text-base">Empresas Clientes Cadastradas ({tenants.length})</h2>
              </div>
              <span className="text-xs text-slate-400">Banco de Dados Ativo</span>
            </div>

            {tenants.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">Nenhuma empresa cadastrada no momento.</p>
            ) : (
              <div className="space-y-3">
                {tenants.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-[#0B1120] border border-slate-800 hover:border-indigo-500/50 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{t.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {t.status || 'ATIVO'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        CNPJ: <span className="font-mono text-slate-300">{t.cnpj || 'Não informado'}</span> • Criado em:{' '}
                        {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 text-indigo-400" />
                        Acessar Portal
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dica Arquitetural para Apresentação */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Segurança Multi-Tenant (Explicação para o Professor)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              O modelo de negócio da plataforma é <strong>B2B Software as a Service (SaaS)</strong>. O cliente não pode ter botão de auto-cadastro na tela inicial, pois cada empresa é um contrato fechado. A Software House cadastra o cliente neste painel Master; o cliente recebe apenas suas credenciais de login e, a partir de então, gerencia sua própria equipe e frota de maneira isolada.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
