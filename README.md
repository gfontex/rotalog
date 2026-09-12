# 🚗 ROTALOG — Sistema de Gestão de Frotas, Checklist & Ponto CLT

> Plataforma Fullstack moderna para controle operacional de frotas, inspeção veicular (checklist de saída e devolução) e controle de ponto eletrônico em conformidade com as normas da CLT.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React Native](https://img.shields.io/badge/React_Native-Expo-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=flat&logo=postgresql&logoColor=white)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Status-Produ%C3%A7%C3%A3o-success)](https://rotalog-web-omega.vercel.app/)

---

## 🌐 Demonstração Online (Nuvem 24/7)

- **Painel Web dos Gestores:** [https://rotalog-web-omega.vercel.app/](https://rotalog-web-omega.vercel.app/)
- **API Backend (NestJS):** [https://rotalog-api.onrender.com](https://rotalog-api.onrender.com)
- **Banco de Dados Cloud:** PostgreSQL gerenciado na nuvem (Supabase - São Paulo)

---

## 🎯 Visão Geral do Projeto

O **ROTALOG** foi desenvolvido para solucionar os principais desafios da gestão operacional e logística de empresas com frotas veiculares:

1. **Inspeção de Veículos Ágil:** Checklist digital de saída e retorno (pneus, lataria, combustível, luzes e documentação).
2. **Controle de Quilometragem:** Registro obrigatório do odômetro do painel com cálculo automatizado da distância percorrida por viagem.
3. **Sessão de Rota com Cronômetro:** Acompanhamento da duração da viagem e controle de pausas para refeição/almoço.
4. **Encaminhamento Automático para Oficina:** Veículos com avarias reportadas no checklist de devolução são automaticamente bloqueados e marcados como `MAINTENANCE`.
5. **Ponto Eletrônico CLT:** Registro direto de batidas (Entrada, Saída Almoço, Retorno Almoço, Fim de Expediente) com validação de jornada de 8h diárias e alertas de horas extras.
6. **Operação Offline-First:** Fila de sincronização local que armazena checklists e pontos mesmo sem sinal de internet, sincronizando assim que a conexão é restabelecida.

---

## 🏗️ Arquitetura do Sistema

O projeto é estruturado como um **Monorepo** profissional:

```text
rotalog/
├── backend/            # API REST em NestJS, TypeScript, Prisma ORM e PostgreSQL
│   ├── src/
│   │   ├── auth/       # Autenticação JWT, guards e controle de perfis (RBAC)
│   │   ├── checklists/ # Gestão e registro de checklists de entrada e saída
│   │   ├── timeclock/  # Lógica de ponto eletrônico e consolidação de jornada CLT
│   │   ├── usages/     # Ciclo de vida de viagens (início, almoço, devolução)
│   │   ├── vehicles/   # Cadastro, disponibilidade e manutenção de viaturas
│   │   └── users/      # Gestão de operadores, motoristas e gestores
│   └── prisma/         # Modelagem relacional e migrations do banco de dados
│
├── web/                # Dashboard Administrativo em Next.js (App Router) & Tailwind CSS
│   ├── src/app/        # Páginas e componentes do painel executivo
│   └── src/lib/        # Cliente de API HTTP desacoplado
│
├── mobile/             # Aplicativo do Operador/Motorista em React Native (Expo)
│   ├── App.tsx         # Interface mobile dark mode com fluxos diretos
│   └── src/services/   # Fila de persistência offline
│
└── *.bat               # Scripts de inicialização local com 1 clique para Windows
```

---

## 🚀 Tecnologias Utilizadas

### Backend
- **NestJS** (Arquitetura modular, Injeção de Dependências, Validation Pipes)
- **Prisma ORM** (Modelagem declarativa e type-safety ponta a ponta)
- **PostgreSQL** (Banco de dados relacional com integridade referencial)
- **Passport & JWT** (Autenticação com tokens de acesso e refresh tokens)
- **Vitest** (Testes unitários e de regras de negócio CLT)

### Frontend Web (Dashboard)
- **Next.js** (React Server Components, App Router)
- **Tailwind CSS** (Design system responsivo e executivo em Dark Mode)
- **Lucide React** (Ícones modernos e intuitivos)

### Mobile
- **React Native** com **Expo**
- **Offline Queue** (Persistência e sincronização em segundo plano)

### Infraestrutura & Deploy
- **Vercel** (Hospedagem e CDN global do Painel Web)
- **Render** (Hospedagem do serviço de backend Node.js)
- **Supabase** (PostgreSQL na nuvem na região da América do Sul)

---

## 💻 Como Rodar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 20 ou superior)
- Git

### 1. Clonar o Repositório
```bash
git clone https://github.com/gfontex/rotalog.git
cd rotalog
```

### 2. Backend
```bash
cd backend
npm install
# Configure o arquivo .env com a sua DATABASE_URL do PostgreSQL
npx prisma db push
npm run start:dev
```

### 3. Painel Web
```bash
cd web
npm install
npm run dev
```

### 4. Aplicativo Mobile
```bash
cd mobile
npm install
npx expo start
```

---

## 👥 Perfis de Acesso (RBAC)

- `ADMIN`: Acesso irrestrito a configurações, cadastro de colaboradores e bases.
- `FLEET_MANAGER`: Gestão de frota, liberação de veículos da oficina e relatórios de viagem.
- `HR`: Auditoria de jornadas de trabalho, espelho de ponto e controle de horas extras.
- `DRIVER`: Operação de veículos, checklists de vistoria e registro de ponto.

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
