'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  Briefcase,
  Layers,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { webApi } from '../../services/api';
import {
  RotaLogHeaderBrand,
  ThemeSwitcherBar,
  CorporateEmptyState,
} from '../../components/BrandLogo';
import { UI_TOKENS } from '../../theme';

export default function MasterSuperAdminPage() {
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminCpf, setAdminCpf] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

      setSuccessMsg(
        `Empresa "${name}" criada com sucesso. O administrador ${adminName} já pode logar no portal com o CPF ${adminCpf}.`
      );
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
    <div className={`${UI_TOKENS.pageBg} flex flex-col`}>
      <header className="border-b border-surface-border bg-surface-card/90 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <RotaLogHeaderBrand />
            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${UI_TOKENS.badgeAdmin}`}>
              <Sparkles className="w-3 h-3" />
              Painel Master • Software House
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeSwitcherBar compact />

            <button
              onClick={loadTenants}
              disabled={refreshing}
              className={UI_TOKENS.btnSecondary}
              title="Atualizar lista do banco de dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-primary' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <Link
              href="/"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${UI_TOKENS.badgeSuccess}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ir para Login do Cliente</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        <div className="lg:col-span-5 flex flex-col">
          <div className={`${UI_TOKENS.card} p-6 sm:p-7 relative overflow-hidden flex-1 flex flex-col justify-between`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />

            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-2 rounded-xl ${UI_TOKENS.badgeInfo}`}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-content-primary text-lg tracking-tight">
                    Cadastrar Nova Empresa
                  </h2>
                  <p className="text-xs text-content-secondary">
                    Gere uma nova base operacional para seu cliente
                  </p>
                </div>
              </div>

              <div className="mt-4 mb-5 p-3.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-content-secondary leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  O cliente <strong>não tem acesso de auto-cadastro</strong>. Cadastre a empresa aqui e entregue a credencial para o Administrador responsável.
                </span>
              </div>

              {successMsg && (
                <div className={`mb-5 p-4 rounded-xl text-xs flex items-start gap-3 ${UI_TOKENS.badgeSuccess}`}>
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider mb-1.5">
                    Nome da Empresa / Base Contratante *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Transportes Alfa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={UI_TOKENS.input}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider mb-1.5">
                    CNPJ da Empresa (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 12.345.678/0001-90"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className={`${UI_TOKENS.input} font-mono`}
                  />
                </div>

                <div className="pt-4 border-t border-surface-border">
                  <div className="flex items-center gap-2 mb-3">
                    <KeyRound className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">
                      Administrador Geral do Cliente
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        Nome do Gestor / Responsável *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos Roberto Admin"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className={UI_TOKENS.input}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-content-secondary mb-1">
                          CPF (Login do Usuário) *
                        </label>
                        <input
                          type="text"
                          placeholder="000.111.222-33"
                          value={adminCpf}
                          onChange={(e) => setAdminCpf(e.target.value)}
                          className={`${UI_TOKENS.input} font-mono`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-content-secondary mb-1">
                          Senha (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Padrão: CPF"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className={`${UI_TOKENS.input} font-mono`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-content-secondary mb-1">
                        E-mail de Contato *
                      </label>
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
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 mt-2 ${UI_TOKENS.btnPrimary}`}
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

            <div className="mt-6 pt-4 border-t border-surface-border text-center">
              <span className="text-[11px] text-content-muted">
                Os dados são gravados com criptografia de senha{' '}
                <strong className="text-content-secondary font-mono">bcryptjs</strong> no SQLite físico.
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className={`${UI_TOKENS.card} p-6 sm:p-7`}>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${UI_TOKENS.badgeSuccess}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-content-primary text-lg">
                    Empresas Clientes no Sistema
                  </h3>
                  <p className="text-xs text-content-secondary">
                    Bases isoladas no banco de dados relacional
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${UI_TOKENS.badgeInfo}`}>
                {tenants.length} {tenants.length === 1 ? 'Empresa' : 'Empresas'}
              </span>
            </div>

            {tenants.length === 0 ? (
              <CorporateEmptyState
                title="Nenhuma empresa cadastrada"
                description="Utilize o formulário ao lado para criar a primeira base operacional."
              />
            ) : (
              <div className="space-y-3">
                {tenants.map((t, index) => (
                  <div
                    key={t.id || index}
                    className="p-4 sm:p-5 bg-surface-bg border border-surface-border hover:border-brand-primary/40 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center font-bold text-sm text-brand-primary">
                        {t.name ? t.name.slice(0, 2).toUpperCase() : 'EM'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-content-primary text-base">
                            {t.name}
                          </h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${UI_TOKENS.badgeSuccess}`}>
                            {t.status || 'ATIVO'}
                          </span>
                        </div>
                        <p className="text-xs text-content-secondary mt-1">
                          CNPJ:{' '}
                          <span className="font-mono text-content-primary">
                            {t.cnpj || 'Não cadastrado'}
                          </span>
                        </p>
                        <p className="text-[11px] text-content-muted mt-0.5 font-mono">
                          ID: {t.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link href="/" className={UI_TOKENS.btnSecondary}>
                        <span>Entrar no Portal</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
