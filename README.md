# 🛡️ ROTALOG • Sistema de Gestão de Frotas & Ponto Eletrônico CLT

> Plataforma Fullstack Multi-tenant para Gestão de Viaturas, Inspeção Veicular (Checklist), Roteamento de Manutenção e Ponto Eletrônico CLT com sincronização em tempo real e arquitetura Offline-First.

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2010-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%205-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Next.js](https://img.shields.io/badge/Web-Next.js%2014-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/Mobile-React%20Native%20(Expo%2051)-61DAFB?style=flat-square&logo=react&logoColor=black)](https://expo.dev/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 🎯 Sobre o Projeto

O **ROTALOG** é uma solução corporativa desenvolvida para empresas com frotas operacionais e equipes externas em trânsito (empresas de segurança privada, logística, transportes e serviços). 

O sistema integra em um ecossistema único:
1. **Controle de Viaturas & Ciclo de Rota**: Desde a saída da base até a devolução do veículo.
2. **Checklist Digital de Inspeção**: Vistoria rápida de itens críticos (combustível, pneus, lataria, faróis, documentação) na saída e na devolução.
3. **Triagem Automática de Manutenção**: Se o checklist de devolução apontar avarias, o veículo é automaticamente bloqueado para status `MAINTENANCE` (Oficina) e emite alerta prioritário para a gestão.
4. **Cálculo Preciso de Quilometragem e Tempo Líquido**: Contabilização automática do Km percorrido (`Odômetro Final - Inicial`) e apuração do tempo de viagem descontando o intervalo de almoço/refeição.
5. **Ponto Eletrônico CLT Manual (Portaria MTP 671)**: Registro com precisão de segundos e carimbo de data/hora, com fila de armazenamento local (`AsyncStorage`) para funcionamento contínuo mesmo sem conexão à internet.
6. **Arquitetura Multi-Tenant**: Cada cliente/empresa (ex: **MK Segurança**) opera com sua própria base, viaturas, colaboradores e registros isolados.

---

## 👥 Hierarquia e Regras de Permissão (3 Níveis)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. ADMINISTRADOR (ADMIN)                                                │
│ • Gestão de bases e empresas contratantes (Multi-tenant)                │
│ • Cadastro de viaturas e colaboradores da frota                         │
│ • Definição de senhas com criptografia segura (bcrypt)                  │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. GESTOR DE ROTAS / FROTA (FLEET_MANAGER)                              │
│ • Monitoramento de todos os veículos em tempo real                      │
│ • Visualização de quem está conduzindo cada viatura em trânsito         │
│ • Acesso a todos os checklists, histórico completo e relatórios com CSV │
│ • Recepção de alertas instantâneos de avarias e ocorrências             │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. MOTORISTA OPERACIONAL (DRIVER)                                       │
│ • Seleção de viaturas disponíveis no pátio                              │
│ • Viaturas ocupadas ou em oficina aparecem em cinza e irclicáveis        │
│ • Histórico Privativo: consulta estritamente suas próprias viagens,     │
│   horários de almoço, checklists e considerações de entrega             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica & Arquitetura

### **Backend (`backend/`)**
* **Framework**: NestJS (Node.js + TypeScript).
* **Arquitetura**: Modular (`Auth`, `Users`, `Vehicles`, `Checklists`, `Usages`, `Timeclock`, `Notifications`, `Tenants`).
* **ORM & Banco de Dados**: Prisma ORM com SQLite em arquivo físico (`rotalog.db`) para persistência local instantânea e zero-configuração; schema compatível com PostgreSQL (`schema.postgresql.prisma`) para deploy em nuvem.
* **Segurança**: Autenticação JWT e senhas criptografadas via `bcryptjs` (10 rounds de salt).
* **Validação**: `class-validator` e `class-transformer` em todos os DTOs.

### **Mobile App (`mobile/`)**
* **Framework**: React Native com Expo SDK 51 (TypeScript).
* **Compatibilidade**: Totalmente funcional no **Expo Go** (Android e iOS) ou versão Web.
* **Modo Offline-First**: Fila local em `@react-native-async-storage/async-storage` que armazena batidas de ponto em áreas de sombra e permite sincronização em lote com um toque.
* **UI/UX**: Design executivo Dark Mode (azul escuro profundo `#0B1120`, ardósia `#1E293B`, esmeralda `#10B981` e âmbar `#F59E0B`).

### **Web Dashboard (`web/`)**
* **Framework**: Next.js 14+ (App Router, Server & Client Components, TypeScript).
* **Estilização**: Tailwind CSS com tema corporativo escuro.
* **Ícones**: Lucide React.
* **Recursos**:
  * Cards métricos de frota em tempo real.
  * Monitor interativo de veículos com busca por placa/condutor.
  * Relatório operacional de viagens com exportação nativa para **CSV**.
  * Espelho de ponto eletrônico CLT com identificador de batidas sincronizadas offline.
  * Central de notificações com drawer lateral de eventos.
  * Modais para cadastro ágil de novas empresas, veículos e colaboradores com definição de senhas.

---

## 📂 Estrutura do Monorepo

```
AppFrotaManual/
├── backend/                  # API NestJS + Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma     # Modelagem SQLite com persistência em disco
│   │   ├── rotalog.db        # Banco de dados relacional físico
│   │   └── seed.ts           # População inicial de dados
│   ├── src/
│   │   ├── auth/             # Autenticação JWT e validação de senhas
│   │   ├── checklists/       # Modelos de checklist e histórico de inspeções
│   │   ├── notifications/    # Auditoria e central de alertas em tempo real
│   │   ├── tenants/          # Multi-tenant (Bases/Empresas operacionais)
│   │   ├── timeclock/        # Ponto eletrônico CLT manual e sync offline
│   │   ├── usages/           # Ciclo de vida da rota, pausas e devolução
│   │   ├── users/            # Colaboradores e hierarquias (Admin/Gestor/Driver)
│   │   └── vehicles/         # Frota de veículos e status operacionais
│   └── package.json
│
├── mobile/                   # App Mobile React Native (Expo Go)
│   ├── src/
│   │   └── services/
│   │       ├── api.ts        # Integração REST com backend
│   │       └── offlineQueue.ts # Fila local Offline-First (AsyncStorage)
│   ├── App.tsx               # Fluxos de autenticação, checklist, rota e ponto
│   └── package.json
│
├── web/                      # Painel Web do Gestor (Next.js 14)
│   ├── src/
│   │   ├── app/              # App Router (layout.tsx, page.tsx, globals.css)
│   │   ├── components/       # Monitor da frota, relatórios, espelho de ponto, modais
│   │   └── services/         # Cliente de API e exportação de relatórios
│   └── package.json
│
├── .gitignore                # Regras de exclusão para Git/GitHub
├── docker-compose.yml        # PostgreSQL opcional para ambiente de contêineres
├── iniciar_tudo.bat          # Inicializador mestre para Windows (1 clique)
├── iniciar_backend.bat       # Script individual para o backend
├── iniciar_web.bat           # Script individual para o painel web
└── iniciar_mobile.bat        # Script individual para o app mobile
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* **Node.js** 18+ instalado.
* Gerenciador de pacotes `npm`.

### Inicialização Rápida no Windows (1 Clique)
Basta dar dois cliques no arquivo:
```cmd
iniciar_tudo.bat
```
O script abrirá 3 janelas de terminal dedicadas executando o Backend, o Painel Web e o Metro Bundler do Expo Mobile.

---

### Inicialização Individual (Passo a Passo)

#### 1. Backend (API NestJS)
```bash
cd backend
npm install
npx prisma db push
npx ts-node prisma/seed.ts
npm run start:dev
```
> API ativa em: `http://localhost:3001`

#### 2. Frontend Web (Next.js Dashboard)
```bash
cd web
npm install
npm run dev
```
> Painel Web acessível em: `http://localhost:3000`

#### 3. Frontend Mobile (Expo Go)
```bash
cd mobile
npm install
npx expo start
```
> Pressione `w` no terminal para abrir no navegador ou leia o **QR Code** no app **Expo Go** do seu celular Android/iOS.

---

## 🔑 Credenciais Pré-Cadastradas para Demonstração

Base / Empresa de Testes: **`MK Seguranca`**

| Hierarquia | Nome | CPF | Senha de Acesso | Escopo de Permissões |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | Admin MK Segurança | `000.111.222-33` | `admin123` | Cadastro de carros, colaboradores e senhas |
| **Gestor de Frota** | Roberto Santos | `333.444.555-66` | `333.444.555-66` | Controle global da frota, checklists e relatórios |
| **Motorista 1** | Carlos Silva | `111.222.333-44` | `111.222.333-44` | Início de rota + visualização restrita de seu histórico |
| **Motorista 2** | João Pereira | `222.333.444-55` | `222.333.444-55` | Início de rota + visualização restrita de seu histórico |

---

## 📄 Licença

Este projeto foi desenvolvido para fins operacionais corporativos e portfólio profissional de arquitetura de software.
Distribuído sob a licença MIT.
