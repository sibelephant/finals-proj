import { STORAGE_KEY } from '../auth/AuthContext.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function getToken() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').token;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.blob();

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed. Please try again.');
  }
  return data;
}

export async function loginUser(email, password, role = 'taxpayer') {
  const session = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (session.user.role !== role) throw new Error(`This account is not a ${role} account.`);
  return session;
}

export async function registerUser(payload) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getTaxReturns(userId) {
  const data = await request(`/users/${userId}/returns`);
  return data.returns;
}

export async function getTaxReturnById(returnId) {
  return request(`/returns/${returnId}`);
}

export async function submitIncomeDeclaration(payload) {
  const { userId, ...body } = payload;
  return request('/returns', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function confirmPayment({ taxReturnId }) {
  const data = await request('/payments', {
    method: 'POST',
    body: JSON.stringify({ taxReturnId }),
  });
  return data.payment;
}

export async function getAdminStats() {
  return request('/admin/reports');
}

export async function getTaxpayers() {
  const data = await request('/admin/taxpayers');
  return data.taxpayers;
}

export async function getTaxpayerDetails(userId) {
  return request(`/admin/taxpayers/${userId}`);
}

export function getDocumentUrl(returnId, type) {
  return `${API_BASE_URL}/documents/${returnId}/${type}`;
}

export async function uploadBankStatement(file) {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/bank-statements/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'Upload failed.');
  return data;
}

export async function getBankTransactions() {
  const data = await request('/bank-statements');
  return data.transactions;
}

export async function deleteBankTransaction(id) {
  return request(`/bank-statements/${id}`, { method: 'DELETE' });
}

export function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
