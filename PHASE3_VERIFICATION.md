# Phase 3 Verification

## Implemented

- ES module Express server with `/api/auth`, `/api/returns`, `/api/users`, `/api/payments`, `/api/documents`, and `/api/admin` routes.
- Sequelize v6 models, associations, migrations, and seed data for the five required entities:
  `Users`, `Tax_Returns`, `Income_Declarations`, `Payments`, `Admin_Logs`.
- JWT authentication, bcrypt password hashing, taxpayer/admin RBAC middleware, and an integration test proving taxpayer tokens are rejected from admin routes.
- Server-side-only tax computation through `computeTax`.
- PDFKit receipt and TCC endpoints.
- React service layer replaced with real `fetch` calls. The deleted `/client/src/mocks` folder is no longer used.

## Auth Storage Choice

The client stores the JWT in `localStorage` for this academic simulation so route guards survive refreshes without adding cookie/CSRF infrastructure. A production deployment should prefer httpOnly secure cookies with CSRF protection.

## Local Setup

1. Create a PostgreSQL 15 database named `etax_filing`.
2. Copy `server/.env.example` to `server/.env` and adjust credentials.
3. From `/server`, run:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

4. From `/client`, run:

```bash
npm run dev
```

Seeded accounts use password `Password123`:

- Taxpayer: `amina.yusuf@example.com`
- Admin: `admin@etax.test`

## Environment Gap

Automated tests and client build pass in this workspace, but the full manual database lifecycle could not be run because no local PostgreSQL service is listening at `127.0.0.1:5432`.
