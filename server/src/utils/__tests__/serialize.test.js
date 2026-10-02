import { describe, expect, it } from 'vitest';
import { serializeTransaction, serializeUser } from '../serialize.js';

const user = (extra = {}) => ({
  toJSON: () => ({ id: 'u1', email: 'a@b.com', role: 'taxpayer', passwordHash: 'secret-hash', ...extra }),
});

describe('serializeUser', () => {
  // covers: it was async and callers mapped it without await, so
  // GET /api/admin/taxpayers serialised every row as {}
  it('returns a plain object, not a promise', () => {
    const result = serializeUser(user());

    expect(result).not.toBeInstanceOf(Promise);
    expect(typeof result.then).toBe('undefined');
  });

  it('survives Array.map the way the admin route calls it', () => {
    const rows = [user({ id: 'u1' }), user({ id: 'u2' })].map(serializeUser);

    expect(JSON.parse(JSON.stringify(rows))).toEqual([
      expect.objectContaining({ id: 'u1', email: 'a@b.com' }),
      expect.objectContaining({ id: 'u2', email: 'a@b.com' }),
    ]);
  });

  it('never exposes the password hash', () => {
    expect(serializeUser(user())).not.toHaveProperty('passwordHash');
  });

  it('passes through a compliance status supplied by the caller', () => {
    expect(serializeUser(user({ complianceStatus: 'compliant' })).complianceStatus).toBe('compliant');
  });

  it('does not invent a compliance status when none was derived', () => {
    expect(serializeUser(user())).not.toHaveProperty('complianceStatus');
  });

  it('returns null for a missing user', () => {
    expect(serializeUser(null)).toBeNull();
  });

  it('accepts a plain object as well as a model instance', () => {
    expect(serializeUser({ id: 'u9', passwordHash: 'x' })).toEqual({ id: 'u9' });
  });
});

describe('serializeTransaction', () => {
  it('keeps a null balance null rather than turning it into zero', () => {
    expect(serializeTransaction({ balance: null, debit: 0, credit: 100 }).balance).toBeNull();
  });

  it('coerces numeric columns to numbers', () => {
    const result = serializeTransaction({ debit: '10.50', credit: '20', balance: '30' });

    expect(result).toMatchObject({ debit: 10.5, credit: 20, balance: 30 });
  });
});