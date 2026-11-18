# ROTALOG — Sistema Integrado de Gestão de Frotas e Ponto Eletrônico CLT

> Plataforma Fullstack Multi-Tenant para gestão de veículos corporativos, vistorias digitais de saída e devolução (Checklist), triagem automática para manutenção, controle de rotas e registro de Ponto Eletrônico CLT com funcionamento Offline-First e exportação em Excel (`.xlsx`).

[![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Next.js](https://img.shields.io/badge/Web-Next.js%2014-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/Mobile-React%20Native%20(Expo)-61DAFB?style=flat-square&logo=react&logoColor=black)](https://expo.dev/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## Sobre o Projeto

O **ROTALOG** é uma solução corporativa desenvolvida para empresas com frotas operacionais e equipes externas em trânsito (logística, transportes, segurança privada e serviços de campo).

O sistema integra em um único ecossistema (API + Painel Web + Aplicativo Mobile):

1. **Login Unificado com Identificação Automática de Perfil:** Tela única de login (Empresa, CPF e Senha). Ao autenticar, o sistema identifica automaticamente o cargo do usuário (`ADMIN`, `FLEET_MANAGER` ou `DRIVER`) e adapta toda a interface e permissões.
2. **Controle de Frota e Ciclo Completo de Rota:** Controle desde a retirada do veículo no pátio, pausa/retomada de almoço e devolução final, impedindo que um motorista abra duas rotas simultâneas ou retire um veículo ocupado/em oficina.
3. **Checklist Digital de Saída e Devolução:** Vistoria obrigatória dos itens do veículo (nível de combustível, pneus, faróis/setas, lataria/vidros, documentação, estepe, limpadores e limpeza) com registro do odômetro.
4. **Bloqueio Automático para Oficina (Manutenção):** Se o checklist de devolução indicar qualquer item com problema (`hasProblem = true`), o veículo é movido automaticamente para o status `MAINTENANCE` (Oficina), gera um alerta de avaria para a gestão e fica bloqueado para novas rotas até ser liberado manualmente pelo Admin ou Gestor.
5. **Cálculo Automático de Quilometragem e Tempo Líquido:** Apuração automática do deslocamento (`Odômetro Final - Odômetro Inicial`) e da duração líquida da viagem descontando o tempo de intervalo de almoço.
6. **Ponto Eletrônico CLT com Fila Offline (`AsyncStorage`):** Registro das 4 marcações diárias (`Entrada`, `Saída Almoço`, `Retorno Almoço`, `Saída`). Se o motorista estiver sem internet, a batida é armazenada localmente com o horário real no dispositivo e sincronizada em lote assim que a conexão retorna.
7. **Exportação de Relatórios para Excel (`.xlsx`):** Geração de planilhas formatadas via SheetJS (`xlsx`) para Espelho de Ponto CLT, Checklists de Vistoria e Histórico de Viagens/Quilometragem.
8. **Alternância de Tema (Modo Claro e Modo Escuro):** Suporte nativo a Modo Escuro (`Dark Mode`) e Modo Claro (`Light Mode`) tanto no Painel Web quanto no App Mobile.

---

## Hierarquia e Regras de Permissão (3 Perfis)

| Nível | Cargo | Escopo de Permissões no Sistema |
| :---: | :--- | :--- |
| **1** | **Administrador (`ADMIN`)** | Acesso total: gerencia empresas/bases (`Tenants`), cadastra veículos, altera status de frota (`AVAILABLE` / `MAINTENANCE`), visualiza nome, CPF e senha da equipe, cadastra funcionários de **qualquer perfil** (`DRIVER`, `FLEET_MANAGER`, `ADMIN`) e acessa todos os relatórios e espelho de ponto. |
| **2** | **Gestor de Frota (`FLEET_MANAGER`)** | Monitoramento global da frota em tempo real (visualiza quem está conduzindo cada veículo), acesso a todos os checklists, alertas de avaria, relatórios `.xlsx`, cadastro de veículos e alteração de status (`AVAILABLE` / `MAINTENANCE`). Visualiza nome, CPF e senha da equipe e possui **trava de segurança no servidor (`ForbiddenException`)** permitindo cadastrar **apenas Motoristas (`DRIVER`)**. |
| **3** | **Motorista (`DRIVER`)** | Visualiza veículos disponíveis, preenche checklist de saída e devolução, registra pausa e retorno de almoço, bate ponto CLT (online ou offline) e consulta estritamente o seu próprio histórico de viagens e ponto. Veículos ocupados ou em oficina ficam bloqueados para seleção. |

---

## Stack Tecnológica e Arquitetura

### Backend (`backend/`)
* **Framework:** NestJS com TypeScript e arquitetura modular (`Auth`, `Users`, `Vehicles`, `Checklists`, `Usages`, `Timeclock`, `Notifications`, `Tenants`, `Prisma`).
* **ORM e Banco de Dados:** Prisma ORM com SQLite em arquivo local (`backend/prisma/rotalog.db`) para execução imediata sem necessidade de servidor externo; inclui também `schema.postgresql.prisma` e `docker-compose.yml` para ambiente PostgreSQL.
* **Autenticação e Segurança:** Tokens JWT (`@nestjs/jwt`), criptografia de senhas com `bcryptjs` e validação automática de entrada com `ValidationPipe` (`class-validator` e `class-transformer`).
* **Exportação Excel:** Biblioteca `xlsx` (SheetJS) para geração de buffers `.xlsx` diretamente pela API.

### Painel Web (`web/`)
* **Framework:** Next.js 14+ (App Router, TypeScript).
* **Interface e Estilo:** Tailwind CSS com Design System próprio em tokens (Modo Claro e Modo Escuro) e ícones vetoriais **Lucide React**.
* **Relatórios:** Exportação client-side e server-side de planilhas `.xlsx` (`TimeClockMirror.tsx` e `TripReports.tsx`).

### Aplicativo Mobile (`mobile/`)
* **Framework:** React Native com Expo SDK 51+ (TypeScript), compatível com **Expo Go** (Android/iOS) e **Expo Web**.
* **Ícones e Estilo:** `@expo/vector-icons` (`Ionicons`) com tema centralizado (`mobile/src/theme.ts`) para Modo Claro e Modo Escuro.
* **Resiliência Offline:** Fila persistente via `@react-native-async-storage/async-storage` (`mobile/src/services/offlineQueue.ts`) e cliente HTTP com detecção automática de host na rede local + timeout de 8s via `AbortController` (`mobile/src/services/api.ts`).

---

## Estrutura de Pastas

```text
AppFrotaManual/
├── backend/                        # API REST NestJS + Prisma ORM + SQLite
│   ├── prisma/
│   │   ├── schema.prisma           # Modelagem das tabelas e relacionamentos
│   │   ├── schema.postgresql.prisma# Schema alternativo para PostgreSQL
│   │   ├── rotalog.db              # Banco SQLite populado pronto para apresentação
│   │   └── seed.ts                 # Script de população inicial do banco
│   ├── src/
│   │   ├── auth/                   # Login unificado, JWT e identificação de cargo
│   │   ├── checklists/             # Vistorias de saída/retorno e exportação .xlsx
│   │   ├── notifications/          # AuditLog de alertas e indicadores do painel
│   │   ├── prisma/                 # Conexão do NestJS com o Prisma Client
│   │   ├── tenants/                # Cadastro e isolamento de empresas (Multi-tenant)
│   │   ├── timeclock/              # Ponto eletrônico CLT, sync offline e .xlsx
│   │   ├── usages/                 # Rotas, almoço e bloqueio automático para oficina
│   │   ├── users/                  # Funcionários e trava de hierarquia (Admin vs Gestor)
│   │   ├── vehicles/               # Frota, motorista ativo e status (Disponível/Oficina)
│   │   ├── app.module.ts           # Módulo raiz integrando os 9 módulos
│   │   └── main.ts                 # Bootstrap do servidor (porta 3001 + CORS)
│   ├── .env.example                # Modelo das variáveis de ambiente
│   └── package.json
│
├── web/                            # Painel Administrativo Web (Next.js 14)
│   ├── public/images/              # Logo oficial RotaLog e ilustrações corporativas
│   ├── src/
│   │   ├── app/                    # layout.tsx, globals.css e page.tsx (login e painéis)
│   │   ├── components/             # FleetMonitor, ChecklistModal, ReturnChecklistModal,
│   │   │                           # TimeClockMirror, TripReports, ManagementModals, etc.
│   │   ├── services/api.ts         # Cliente REST para o backend (porta 3001)
│   │   └── theme.ts                # Tokens centralizados (Modo Claro / Modo Escuro)
│   └── package.json
│
├── mobile/                         # App Mobile do Motorista e Gestor (React Native / Expo)
│   ├── assets/images/              # Logo oficial e imagens do app
│   ├── src/
│   │   ├── services/
│   │   │   ├── api.ts              # Cliente REST com detecção automática de IP/localhost
│   │   │   └── offlineQueue.ts     # Fila local de ponto CLT no AsyncStorage
│   │   └── theme.ts                # Tokens de tema (Modo Claro / Modo Escuro)
│   ├── App.tsx                     # Telas de login, rotas, checklist, ponto e equipe
│   └── package.json
│
├── .gitignore
├── docker-compose.yml              # PostgreSQL opcional via Docker
├── iniciar_tudo.bat                # Sobe Backend, Web e Mobile juntos no Windows
├── iniciar_backend.bat             # Sobe apenas o Backend (porta 3001)
├── iniciar_web.bat                 # Sobe apenas o Painel Web (porta 3000)
└── iniciar_mobile.bat              # Seletor de execução do Mobile (Tunnel / Web / LAN)
```

---

## Como Baixar e Rodar em um Notebook (Passo a Passo)

### 1. Pré-requisitos (Softwares para instalar no Notebook)
1. **Node.js (versão LTS 18, 20 ou 22):** necessário para rodar a API, o site e o Expo.
2. **Git:** necessário para clonar o repositório do GitHub.
3. **Visual Studio Code (VS Code):** opcional, recomendado para abrir os códigos na apresentação.
4. **Expo Go (no celular):** opcional, caso queira demonstrar o app mobile no telefone via QR Code (também é possível abrir no próprio navegador do notebook).

### 2. Clonar o Projeto do GitHub
Abra o **Prompt de Comando (CMD)** ou **PowerShell** no notebook e execute:
```bash
git clone https://github.com/gfontex/rotalog.git
cd rotalog
```

### 3. Primeira Inicialização (Com 1 Clique no Windows)
Após clonar o repositório no notebook, basta dar **dois cliques no arquivo `iniciar_tudo.bat`** na pasta raiz do projeto.

O script automático já:
1. Cria o arquivo `backend/.env` automaticamente a partir do `backend/.env.example` (se ainda não existir).
2. Instala as dependências (`npm install`) nas pastas `backend`, `web` e `mobile` caso `node_modules` ainda não exista.
3. Gera o cliente do Prisma (`npx prisma generate`) usando o banco `backend/prisma/rotalog.db` já incluído no repositório.
4. Abre as 3 janelas de execução:
   * **Backend API:** `http://localhost:3001`
   * **Painel Web:** `http://localhost:3000`
   * **App Mobile (Expo):** abre o menu interativo (`1` para QR Code Tunnel no celular, `2` para abrir direto no navegador em `http://localhost:8081`, ou `3` para LAN).

### 4. Execução Manual (Caso prefira rodar pelos terminais do VS Code)

**Terminal 1 — Backend:**
```bash
cd backend
copy .env.example .env
npm install
npx prisma generate
npm run start:dev
```
*(Se em algum momento quiser resetar o banco de dados para o estado inicial, rode `npx prisma db push` e `npx ts-node prisma/seed.ts` dentro de `backend/`.)*

**Terminal 2 — Painel Web:**
```bash
cd web
npm install
npm run dev
```
Acesse no navegador: `http://localhost:3000`

**Terminal 3 — App Mobile:**
```bash
cd mobile
npm install
npx expo start --web
```
*(Ou rode `npx expo start --tunnel` para gerar o QR Code e abrir no aplicativo **Expo Go** do celular.)* Acesse no navegador: `http://localhost:8081`

---

## Credenciais Cadastradas para Apresentação

* **Empresa (opcional no login):** `Teste Apresentação`
* **Senha padrão de todos os usuários:** `123456`

| Hierarquia | Cargo (`role`) | Nome | CPF | Senha |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `ADMIN` | Ricardo Almeida (Representante Legal) | `111.111.111-11` | `123456` |
| **Gestor de Frota** | `FLEET_MANAGER` | Roberto Mendes (Gestor de Frota) | `222.222.222-22` | `123456` |
| **Gestor de Frota** | `FLEET_MANAGER` | Fernanda Costa (Gestora Operacional) | `222.333.444-55` | `123456` |
| **Motorista** | `DRIVER` | Carlos Eduardo Silva | `333.333.333-33` | `123456` |
| **Motorista** | `DRIVER` | Marcos Vinícius Oliveira | `444.444.444-44` | `123456` |
| **Motorista** | `DRIVER` | Lucas Gabriel Pereira | `555.555.555-55` | `123456` |
| **Motorista** | `DRIVER` | André Luiz Souza | `666.666.666-66` | `123456` |

---

## Licença

Projeto desenvolvido para controle operacional corporativo de frotas e registro de ponto CLT.
