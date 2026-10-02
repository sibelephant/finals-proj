import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import models, { sequelize } from '../../models/index.js';
import { hashPassword, signToken } from '../../logic/auth.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../../../mock-bank-statements');
const GTBANK = join(FIXTURES, 'gtbank_statement_2025.csv');

async function reset() {
  await sequelize.query('TRUNCATE TABLE "Bank_Transactions", "Payments", "Income_Declarations", "Tax_Returns", "Admin_Logs", "Users" RESTART IDENTITY CASCADE');
}

async function makeUser(role = 'taxpayer') {
  return models.User.create({
    fullName: `Test ${role}`,
    email: `${role}-${Math.random().toString(16).slice(2)}@example.com`,
    passwordHash: await hashPassword('Password123'),
    phone: '08000000000',
    address: '1 Test Road',
    tin: `TIN-2026-${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`,
    role,
  });
}

const auth = (user) => `Bearer ${signToken({ sub: user.id, role: user.role })}`;

beforeEach(reset);
afterAll(async () => {
  await reset();
  await sequelize.close();
});

describe('regressions: duplicate filing', () => {
  // covers: a second return for the same year returned 500 from the unique index
  it('answers 409 when a taxpayer files the same year twice', async () => {
    const taxpayer = await makeUser();
    const body = { filingYear: 2026, grossIncome: 3000000 };

    const first = await request(app).post('/api/returns').set('Authorization', auth(taxpayer)).send(body);
    const second = await request(app).post('/api/returns').set('Authorization', auth(taxpayer)).send(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
  });

  it('answers 400 with field errors for an unresolvable filing year', async () => {
    const taxpayer = await makeUser();

    const response = await request(app)
      .post('/api/returns')
      .set('Authorization', auth(taxpayer))
      .send({ filingYear: 'abc', grossIncome: 3000000 });

    expect(response.status).toBe(400);
    expect(response.body.errors.filingYear).toMatch(/filing year/i);
  });

  it('answers 400 rather than 500 for an amount the column cannot hold', async () => {
    const taxpayer = await makeUser();

    const response = await request(app)
      .post('/api/returns')
      .set('Authorization', auth(taxpayer))
      .send({ filingYear: 2026, grossIncome: 1e13 });

    expect(response.status).toBe(400);
  });

  // covers: NTA extra fields were persisted but never deducted
  it('stores and computes the NHIS and housing loan relief it accepted', async () => {
    const taxpayer = await makeUser();

    const response = await request(app)
      .post('/api/returns')
      .set('Authorization', auth(taxpayer))
      .send({ filingYear: 2026, grossIncome: 5000000, nhisContribution: 100000, housingLoanInterest: 400000 });

    expect(response.status).toBe(201);
    expect(response.body.computedResult.totalDeductions).toBe(180000);
    expect(response.body.declaration.nhisContribution).toBe(100000);
  });
});

describe('regressions: payment idempotency', () => {
  async function fileReturn(taxpayer, year = 2026) {
    const created = await request(app)
      .post('/api/returns')
      .set('Authorization', auth(taxpayer))
      .send({ filingYear: year, grossIncome: 3000000 });
    return created.body.taxReturn;
  }

  it('answers 409 when the same return is paid twice', async () => {
    const taxpayer = await makeUser();
    const taxReturn = await fileReturn(taxpayer);

    const first = await request(app)
      .post('/api/payments')
      .set('Authorization', auth(taxpayer))
      .send({ taxReturnId: taxReturn.id });
    const second = await request(app)
      .post('/api/payments')
      .set('Authorization', auth(taxpayer))
      .send({ taxReturnId: taxReturn.id });

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(await models.Payment.count({ where: { taxReturnId: taxReturn.id } })).toBe(1);
  });

  it('mints an unguessable payment reference', async () => {
    const taxpayer = await makeUser();
    const taxReturn = await fileReturn(taxpayer, 2025);

    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', auth(taxpayer))
      .send({ taxReturnId: taxReturn.id });

    expect(response.body.payment.paymentReference).toMatch(/^PAY-ETAX-[0-9a-f-]{36}$/);
  });

  it('refuses to pay a return belonging to somebody else', async () => {
    const owner = await makeUser();
    const stranger = await makeUser();
    const taxReturn = await fileReturn(owner);

    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', auth(stranger))
      .send({ taxReturnId: taxReturn.id });

    expect(response.status).toBe(403);
  });
});

describe('regressions: bank statement upload', () => {
  const upload = (user, file = GTBANK, name = 'gtbank_statement_2025.csv') =>
    request(app)
      .post('/api/bank-statements/upload')
      .set('Authorization', auth(user))
      .attach('file', readFileSync(file), name);

  // covers: re-uploading the same statement duplicated every transaction
  it('does not duplicate transactions when the same file is uploaded twice', async () => {
    const taxpayer = await makeUser();

    await upload(taxpayer);
    const afterFirst = await models.BankTransaction.count({ where: { userId: taxpayer.id } });
    await upload(taxpayer);
    const afterSecond = await models.BankTransaction.count({ where: { userId: taxpayer.id } });

    expect(afterFirst).toBeGreaterThan(10);
    expect(afterSecond).toBe(afterFirst);
  });

  it('answers 422 for a malformed CSV instead of 500', async () => {
    const taxpayer = await makeUser();

    const response = await request(app)
      .post('/api/bank-statements/upload')
      .set('Authorization', auth(taxpayer))
      .attach('file', Buffer.from('Date,Narration,Amount\n2025-01-15,"Salary,50000\n'), 'broken.csv');

    expect(response.status).toBe(422);
    expect(response.body.message).toMatch(/could not read csv/i);
  });

  it('accepts a statement with no balance column', async () => {
    const taxpayer = await makeUser();
    const csv = 'Date,Narration,Debit,Credit\n2025-01-15,Salary,,50000\n';

    const response = await request(app)
      .post('/api/bank-statements/upload')
      .set('Authorization', auth(taxpayer))
      .attach('file', Buffer.from(csv), 'no-balance.csv');

    expect(response.status).toBe(201);
    expect(response.body.transactions[0].balance).toBeNull();
  });

  it('skips the one impossible date and still stores the valid rows', async () => {
    const taxpayer = await makeUser();
    const csv = 'Date,Narration,Debit,Credit,Balance\n2025-02-31,Salary,,50000,50000\n2025-03-01,Salary,,50000,100000\n';

    const response = await request(app)
      .post('/api/bank-statements/upload')
      .set('Authorization', auth(taxpayer))
      .attach('file', Buffer.from(csv), 'one-bad-date.csv');

    expect(response.status).toBe(201);
    expect(response.body.errors).toHaveLength(1);
    expect(await models.BankTransaction.count({ where: { userId: taxpayer.id } })).toBe(1);
  });
});

describe('regressions: admin taxpayer list', () => {
  // covers: serializeUser was async and mapped without await, so every row
  // serialised as {} and the admin list rendered blanks
  it('returns populated taxpayer rows, not empty objects', async () => {
    const admin = await makeUser('admin');
    await makeUser();

    const response = await request(app).get('/api/admin/taxpayers').set('Authorization', auth(admin));

    expect(response.status).toBe(200);
    expect(response.body.taxpayers).toHaveLength(1);
    expect(response.body.taxpayers[0]).toMatchObject({
      email: expect.any(String),
      fullName: expect.any(String),
      complianceStatus: expect.any(String),
    });
    expect(response.body.taxpayers[0]).not.toHaveProperty('passwordHash');
  });

  it('derives compliance status from the most recent return', async () => {
    const admin = await makeUser('admin');
    const taxpayer = await makeUser();

    await request(app)
      .post('/api/returns')
      .set('Authorization', auth(taxpayer))
      .send({ filingYear: 2025, grossIncome: 3000000 });

    const response = await request(app).get('/api/admin/taxpayers').set('Authorization', auth(admin));

    expect(response.body.taxpayers[0].complianceStatus).toBe('pending');
  });

  it('reports a taxpayer who has paid', async () => {
    const admin = await makeUser('admin');
    const taxpayer = await makeUser();
    const created = await request(app)
      .post('/api/returns')
      .set('Authorization', auth(taxpayer))
      .send({ filingYear: 2025, grossIncome: 3000000 });

    await request(app)
      .post('/api/payments')
      .set('Authorization', auth(taxpayer))
      .send({ taxReturnId: created.body.taxReturn.id });

    const response = await request(app).get('/api/admin/taxpayers').set('Authorization', auth(admin));

    expect(response.body.taxpayers[0].complianceStatus).toBe('compliant');
  });

  // covers: AdminOverview reads stats.totalTaxpayers but the route omitted it
  it('includes the total taxpayer count in the reports payload', async () => {
    const admin = await makeUser('admin');
    await makeUser();

    const response = await request(app).get('/api/admin/reports').set('Authorization', auth(admin));

    expect(response.status).toBe(200);
    expect(response.body.totalTaxpayers).toBe(1);
  });
});