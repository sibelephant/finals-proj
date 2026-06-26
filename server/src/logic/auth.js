import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const BCRYPT_COST = 10;
const DEFAULT_JWT_SECRET = 'phase-2-test-secret-change-in-phase-3';
export const TIN_PATTERN = /^TIN-\d{4}-\d{6}$/;

export async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, BCRYPT_COST);
}

export async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

export function generateTIN(date = new Date(), randomNumber = Math.floor(Math.random() * 1000000)) {
  const year = date.getUTCFullYear();
  const sequence = String(randomNumber).padStart(6, '0').slice(-6);
  return `TIN-${year}-${sequence}`;
}

export function signToken(payload, options = {}) {
  const secret = options.secret || process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  const expiresIn = options.expiresIn || '1h';
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token, options = {}) {
  const secret = options.secret || process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  return jwt.verify(token, secret);
}

export function authorizeRole(decodedPayload, requiredRole) {
  return Boolean(decodedPayload && decodedPayload.role === requiredRole);
}
