import {
  adminStats,
  computedResult,
  incomeDeclarations,
  payments,
  taxReturns,
  users,
} from '../mocks/data.js';

const delay = (value, ms = 450) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(value)), ms);
  });

export async function loginUser(email, password, role = 'taxpayer') {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }
  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.role === role);
  if (!user) {
    throw new Error('No matching mock account found for this role.');
  }
  return delay({ user, token: 'mock-token-not-used-in-phase-1' });
}

export async function registerUser(payload) {
  const tin = `TIN-2026-${Math.floor(100000 + Math.random() * 899999)}`;
  return delay({
    user: {
      id: `usr-${Date.now()}`,
      ...payload,
      tin,
      role: 'taxpayer',
      complianceStatus: 'Pending',
      createdAt: new Date().toISOString().slice(0, 10),
    },
  });
}

export async function getTaxReturns(userId) {
  return delay(taxReturns.filter((item) => item.userId === userId));
}

export async function getTaxReturnById(returnId) {
  const taxReturn = taxReturns.find((item) => item.id === returnId);
  const declaration = incomeDeclarations.find((item) => item.taxReturnId === returnId);
  const payment = payments.find((item) => item.taxReturnId === returnId) ?? null;
  return delay({ taxReturn, declaration, payment, computedResult });
}

export async function submitIncomeDeclaration(payload) {
  return delay({
    taxReturn: {
      id: `ret-${Date.now()}`,
      userId: payload.userId,
      filingYear: new Date().getFullYear(),
      filingStatus: 'submitted',
      grossIncome: Number(payload.grossIncome),
      taxableIncome: computedResult.taxableIncome,
      taxPayable: computedResult.taxPayable,
      submittedAt: new Date().toISOString().slice(0, 10),
      paidAt: null,
    },
    declaration: payload,
    computedResult,
  });
}

export async function confirmPayment({ taxReturnId, amount }) {
  return delay({
    id: `pay-${Date.now()}`,
    taxReturnId,
    amount,
    paymentReference: `PAY-ETAX-${Math.floor(100000 + Math.random() * 899999)}`,
    paymentStatus: 'successful',
    paidAt: new Date().toISOString().slice(0, 10),
  });
}

export async function getAdminStats() {
  return delay(adminStats);
}

export async function getTaxpayers() {
  return delay(users.filter((item) => item.role === 'taxpayer'));
}

export async function getTaxpayerDetails(userId) {
  const user = users.find((item) => item.id === userId);
  const returns = taxReturns.filter((item) => item.userId === userId);
  return delay({ user, returns });
}
