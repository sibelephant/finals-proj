# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

## Users

Primary users are Nigerian taxpayers filing Personal Income Tax returns and platform administrators managing taxpayer accounts and reviewing revenue reports. Taxpayers submit income declarations, upload bank statements, compute tax, and download receipts/certificates. Administrators review taxpayer lists, detailed filing history, revenue reports, and compliance rates.

## Product Purpose

Provide a secure, automated Personal Income Tax (PIT) filing portal for Nigeria — enabling digital return submission, instantaneous algorithmic tax computation, centralized record management, and administrative reporting.

## Positioning

A digital tax filing platform specifically designed for Nigeria's Personal Income Tax system, featuring a 6-band graduated tax rate (7%-24%), Consolidated Relief Allowance, pension/life assurance/NHF deductions, and automated tax band breakdown per return.

## Operating Context

Taxpayers and administrators interact via a React SPA (Vite 5173) front-end communicating with an Express API (port 4000) backed by PostgreSQL 16 (Docker). The platform is accessed through a web browser at http://localhost:5173. Seed data populates the demo environment; payment confirmation is mocked and bank statements are user-uploaded CSVs.

## Capabilities and Constraints

- Nigeria PIT computation using 6-band graduated system (7%-24%), CRA, pension/life assurance/NHF deductions, band breakdown per return
- Bank statement upload with CSV parsing and automatic credit/debit categorisation
- PDF document generation via PDFKit: Tax Payment Receipt and Tax Clearance Certificate
- Role-based access control via JWT middleware (Taxpayer and Admin roles)
- Administrative reporting: revenue totals, compliance rate, monthly bar chart, taxpayer search
- Filing lifecycle: Declare → Compute → Pay → Download Receipt + TCC

## Brand Commitments

Nigeria PIT computation, 6-band graduated tax rate (7%-24%), CRA, pension/life assurance/NHF deductions, PDF receipt and TCC generation, role-based taxpayer/admin separation.

## Evidence on Hand

- React SPA with Vite 5173, React Router 6, Lucide icons
- Express API with JWT, bcrypt, multer, PDFKit
- PostgreSQL 16 via Docker, Sequelize 6 ORM
- Space Grotesk font (Google Fonts)
- API endpoint definitions, test credentials, and project structure documented in README.md
- PHASE3_VERIFICATION.md present in project root

## Product Principles

- Security: JWT authentication, password hashing (bcrypt), role-separated endpoints
- Accuracy: Algorithmic tax computation matching Nigeria's graduated rates
- Usability: Declarative form flows, clear receipt/certificate download
- Transparency: Band breakdown and tax calculation details visible to users