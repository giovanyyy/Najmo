# NAJMO ERP - Commercial Management SaaS

NAJMO ERP is a comprehensive, multi-account, multi-currency, and multi-role enterprise resource planning application tailored for commercial management. It consists of a robust NestJS backend and a highly dynamic Next.js 15 frontend.

## 🌟 Key Features

- **Multi-Account Treasury**: Manage cash, CCP, banks, and crypto wallets (USDT) seamlessly.
- **Cross-Currency Operations**: Automatic conversions and tracking between DZD, EUR, USD, and USDT.
- **Meta Ads Integration**: Manage ad budgets, recharge accounts from treasury, and track deductions automatically.
- **Invoicing & PDF Engine**: Generate professional PDF invoices automatically using Puppeteer. Includes partial and multiple payment tracking.
- **Operations Lifecycle**: Track financial operations through a strict `PENDING` -> `COMPLETED` state machine ensuring atomic balance updates.
- **Role-Based Access Control (RBAC)**: Centralized `PermissionsGuard` enforces access control on every single endpoint based on dynamic roles.
- **Global Audit Trail**: Every significant action (create, update, delete, transfer) is logged centrally via `AuditService` for compliance and troubleshooting.
- **Automated Alerts Engine**: Scheduled cron jobs scan for overdue invoices and low account balances, keeping you informed in real time.
- **Excel Export**: Export table data for offline analysis.

## 🏗 Architecture

### Backend (NestJS + Prisma + MySQL)
The backend is modularized to ensure separation of concerns.
- **Database Layer**: Prisma ORM with strict atomic transaction (`$transaction`) usage for all financial operations.
- **Security**: Local JWT authentication with custom permissions matrix.
- **Background Jobs**: Node-Cron powered scheduler for alerts.
- **Emailing**: Nodemailer integrated for automated communication.

### Frontend (Next.js + TailwindCSS + Zustand + React Query)
- **App Router**: Utilizes Next.js App Router for optimized server-side rendering.
- **State Management**: `Zustand` for global UI state (sidebar, modals).
- **Data Binding**: `React Query` (Tanstack Query) integrated with custom `apiFetch` hooks for smooth, cached, and optimistic data fetching.
- **UI/UX**: Premium aesthetic with dark-mode optimized Tailwind components.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MySQL Server

### 1. Backend Setup
\`\`\`bash
cd backend
npm install
# Setup .env file with DATABASE_URL and JWT_SECRET
npx prisma db push
npx prisma generate
npx ts-node prisma/seed.ts # Inject realistic Algerian demo data
npm run start:dev
\`\`\`

### 2. Frontend Setup
\`\`\`bash
cd frontend
npm install
# Setup .env.local with NEXT_PUBLIC_API_URL
npm run dev
\`\`\`

## 🛡 Security & Best Practices
- **Atomic Updates**: Financial updates (payments, transfers, expenses) are strictly wrapped in Prisma transactions. If one step fails, the entire operation is rolled back, preventing orphaned movements.
- **BigInt Overflows**: Monetary primary keys and sensitive IDs are strictly enforced as BigInt throughout the stack.
- **RBAC**: Guarded by a strict permissions matrix checking both route and method against the user's role.

---
*Developed for NAJMO Enterprise*
