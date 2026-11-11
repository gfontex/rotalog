'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  KeyRound,
  UserPlus,
  CheckCircle,
  ArrowLeft,
  Lock,
  Users,
  Car,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Briefcase,
  Layers,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import { webApi } from '../../services/api';

export default function MasterSuperAdminPage() {
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
      setTenants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('Erro ao carregar empresas:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adminName.trim() || !adminCpf.trim() || !adminEmail.trim()) {
      alert('Preencha os campos obrigatórios da Empresa e do Administrador.');
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    try {
      await webApi.createTenant({
        name: name.trim(),
        cnpj: cnpj.trim() || undefined,
        adminName: adminName.trim(),
        adminCpf: adminCpf.trim(),
        adminEmail: adminEmail.trim(),
        adminPassword: adminPassword.trim() || adminCpf.trim(),
      });

      setSuccessMsg(`Empresa "${name}" criada com sucesso! O administrador ${adminName} já pode logar no portal com o CPF ${adminCpf}.`);
      setName('');
      setCnpj('');
      setAdminName('');
      setAdminCpf('');
      setAdminEmail('');
      setAdminPassword('');
      loadTenants();
    } catch (err: any) {
      alert('Erro ao cadastrar empresa: ' + (err.message || 'Erro inesperado.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Topo Executivo com Efeito Glow */}
      <header className="border-b border-indigo-950/60 bg-[#0B1120]/80 backdrop-blur-xl sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-black tracking-wider text-white">ROTALOG</span>
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Painel Master • Software House
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Área Restrita para Cadastro de Empresas Clientes (Tenants) e Gestão de Licenças
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadTenants}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-2 transition-all hover:border-slate-700"
              title="Atualizar lista do banco de dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all shadow-lg shadow-emerald-500/5 hover:border-emerald-500/50"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ir para Login do Cliente</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Coluna Esquerda: Formulário de Cadastro da Empresa */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-[#0F172A] border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-between">
            {/* Gradiente decorativo superior */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-white text-lg tracking-tight">Cadastrar Nova Empresa</h2>
                  <p className="text-xs text-slate-400">Gere uma nova base operacional para seu cliente</p>
                </div>
              </div>

              <div className="mt-4 mb-5 p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  O cliente <strong>não tem acesso de auto-cadastro</strong>. Você cadastra a empresa aqui e entrega a senha para o Administrador dele.
                </span>
              </div>

              {successMsg && (
                <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-start gap-3 animate-fade-in">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateTenant} className="space-y-4">
                {/* Dados da Empresa */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome da Empresa / Base Contratante *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: MK Segurança ou Transportes Alfa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    CNPJ da Empresa (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 12.345.678/0001-90"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition-all"
                  />
                </div>

                {/* Dados do Administrador Inicial */}
                <div className="pt-4 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 mb-3">
                    <KeyRound className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-extrabold text-purple-300 uppercase tracking-wider">
                      Administrador Geral do Cliente
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Nome do Gestor / Responsável *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos Roberto Admin"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          CPF (Login do Usuário) *
                        </label>
                        <input
                          type="text"
                          placeholder="000.111.222-33"
                          value={adminCpf}
                          onChange={(e) => setAdminCpf(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          Senha (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Padrão: CPF"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        E-mail de Contato *
                      </label>
                      <input
                        type="email"
                        placeholder="admin@mkseguranca.com.br"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#070B14] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-extrabold rounded-2xl transition-all shadow-xl shadow-indigo-600/30 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gravando no Banco de Dados...</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" />
                      <span>Cadastrar Empresa e Gerar Acesso</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-500">
                Os dados são gravados com criptografia de senha <strong className="text-slate-400 font-mono">bcryptjs</strong> no SQLite físico.
              </span>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Empresas Ativas no Banco e Explicação do Modelo */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card de Resumo das Empresas */}
          <div className="bg-[#0F172A] border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Empresas Clientes no Sistema</h3>
                  <p className="text-xs text-slate-400">Bases isoladas no banco de dados relacional</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {tenants.length} {tenants.length === 1 ? 'Empresa' : 'Empresas'}
              </span>
            </div>

            {tenants.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                Nenhuma empresa encontrada no banco de dados. Cadastre uma no formulário ao lado.
              </div>
            ) : (
              <div className="space-y-3.5">
                {tenants.map((t, index) => (
                  <div
                    key={t.id || index}
                    className="p-4 sm:p-5 bg-[#070B14] border border-slate-800 hover:border-indigo-500/40 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-sm text-indigo-400 group-hover:border-indigo-500/40 transition-colors">
                        {t.name ? t.name.slice(0, 2).toUpperCase() : 'EM'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                            {t.name}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {t.status || 'ATIVO'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          CNPJ: <span className="font-mono text-slate-300">{t.cnpj || 'Não cadastrado'}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          ID: {t.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        href="/"
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-xs text-slate-200 hover:text-white font-bold border border-slate-800 hover:border-indigo-500 transition-all flex items-center gap-1.5"
                      >
                        <span>Entrar no Portal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cartão Didático de Arquitetura Multi-Tenant para a Apresentação */}
          <div className="bg-gradient-to-br from-[#0F172A] to-[#131D38] border border-indigo-900/30 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2.5 mb-3 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="text-sm font-bold text-white">Como Explicar Essa Tela para o Professor:</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              &quot;Professor, este é o <strong>Portal Master do Software ROTALOG</strong>. O nosso sistema é um <em>SaaS B2B Multi-tenant</em>. 
              Por regra de negócio, <strong>o cliente final não pode criar sua própria empresa sozinho na tela inicial</strong>, pois isso violaria contratos comerciais e segurança da informação. 
              A software house é quem cadastra a empresa contratante nesta tela à parte e gera a primeira conta de Administrador. A partir disso, o cliente recebe seu login e passa a operar com seus próprios veículos e motoristas de forma 100% isolada e segura.&quot;
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
