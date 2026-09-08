# E-Tax Filing System

A secure, automated Personal Income Tax (PIT) filing portal for Nigeria — digital return submission, instantaneous algorithmic tax computation, centralized record management, and administrative reporting.

## Architecture

```
┌──────────────┐     fetch()     ┌──────────────┐     Sequelize    ┌────────────┐
│  React SPA   │ ──────────────> │  Express API  │ ──────────────> │ PostgreSQL │
│  (Vite 5173) │ <────────────── │  (Port 4000)  │ <────────────── │  (Docker)  │
└──────────────┘     JSON/JWT    └──────────────┘                  └────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Vite 6, Lucide icons |
| Backend | Express 4, JWT, bcrypt, multer, PDFKit |
| Database | PostgreSQL 16 via Docker, Sequelize 6 ORM |
| Fonts | Space Grotesk (Google Fonts) |

## Prerequisites

- Docker (for PostgreSQL)
- Node.js >= 20

## Setup

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Start the database (Docker)

```bash
cd server && docker compose up -d
```

Verify with: `docker ps | grep etax-postgres`

### 3. Run migrations and seed data

```bash
cd server && npm run db:migrate && npm run db:seed
```

### 4. Start the backend (API on port 4000)

```bash
cd server && npm run dev
```

### 5. Start the frontend (dev server on port 5173)

Open a **separate terminal**, then:

```bash
cd client && npm run dev
```

## Access

Open `http://localhost:5173` in a browser.

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Taxpayer | `amina.yusuf@example.com` | `Password123` |
| Admin | `admin@etax.test` | `Password123` |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | — | Register taxpayer |
| `POST` | `/api/auth/login` | — | Login (returns JWT) |
| `POST` | `/api/returns` | taxpayer | Submit income declaration + compute tax |
| `GET` | `/api/returns/:id` | any | Get return with declaration + payment |
| `GET` | `/api/users/:userId/returns` | any | List returns for a user |
| `POST` | `/api/payments` | taxpayer | Confirm payment (simulated) |
| `GET` | `/api/documents/:id/receipt` | taxpayer | Download payment receipt PDF |
| `GET` | `/api/documents/:id/tcc` | taxpayer | Download TCC PDF |
| `POST` | `/api/bank-statements/upload` | taxpayer | Upload CSV bank statement |
| `GET` | `/api/bank-statements` | any | List bank transactions |
| `DELETE` | `/api/bank-statements/:id` | any | Delete a transaction |
| `GET` | `/api/admin/taxpayers` | admin | List all taxpayers |
| `GET` | `/api/admin/taxpayers/:id` | admin | Taxpayer detail + filing history |
| `GET` | `/api/admin/reports` | admin | Revenue, compliance rate, monthly chart |
| `GET` | `/api/health` | — | Health check |

## Project Structure

```
├── client/                    # React SPA
│   ├── src/
│   │   ├── components/        # Reusable UI components (Badge, Button, Card, etc.)
│   │   ├── services/api.js    # API client — all backend calls
│   │   ├── utils/format.js    # Currency, date formatting
│   │   ├── auth/              # Auth context + session management
│   │   ├── App.jsx            # Routes and all page components
│   │   └── styles.css         # Global styles + design tokens
│   └── index.html
├── server/                    # Express API
│   ├── src/
│   │   ├── routes/            # Express route handlers
│   │   ├── logic/             # Tax computation, auth, validation, PDF generation, CSV parser
│   │   ├── models/            # Sequelize model definitions
│   │   ├── migrations/        # DB schema migrations
│   │   ├── seeders/           # Test data seeds
│   │   ├── middleware/        # JWT auth + role guards
│   │   └── config/            # Sequelize connection config
│   ├── docker-compose.yml     # PostgreSQL container
│   └── .env.example
└── PHASE3_VERIFICATION.md
```

## Key Features

- **Nigeria PIT computation** — 6-band graduated system (7%–24%), CRA (Consolidated Relief Allowance), pension/life assurance/NHF deductions, band breakdown per return
- **Bank statement upload** — CSV parsing with automatic credit/debit categorisation
- **PDF document generation** — Tax Payment Receipt and Tax Clearance Certificate via PDFKit
- **Role-based access** — Taxpayer and Admin roles with JWT RBAC middleware
- **Administrative reporting** — Revenue totals, compliance rate, monthly bar chart, taxpayer search
- **Filing lifecycle** — Declare → Compute → Pay → Download Receipt + TCC

## Notes

This is a **simulation** project. Payment confirmation is mocked (no real gateway integration), bank statements are user-uploaded CSVs (not live bank APIs), and seed data populates the demo environment.
