const jwt = require('jsonwebtoken');
const {
  authorizeRole,
  generateTIN,
  hashPassword,
  signToken,
  TIN_PATTERN,
  verifyPassword,
  verifyToken,
} = require('../auth');

describe('auth logic', () => {
  it('hashes and verifies passwords without storing plaintext', async () => {
    const plaintext = 'StrongPass1';
    const hash = await hashPassword(plaintext);

    expect(hash).not.toBe(plaintext);
    expect(hash.startsWith('$2')).toBe(true);
    await expect(verifyPassword(plaintext, hash)).resolves.toBe(true);
    await expect(verifyPassword('WrongPass1', hash)).resolves.toBe(false);
  });

  it('generates TIN values in the required deterministic format', () => {
    expect(generateTIN(new Date('2026-06-26T00:00:00.000Z'), 42)).toBe('TIN-2026-000042');
    expect(generateTIN(new Date('2026-06-26T00:00:00.000Z'), 42)).toMatch(TIN_PATTERN);
  });

  it('signs and verifies JWT payloads', () => {
    const token = signToken({ sub: 'usr-001', role: 'taxpayer' }, { secret: 'test-secret', expiresIn: '10m' });
    const decoded = verifyToken(token, { secret: 'test-secret' });

    expect(decoded.sub).toBe('usr-001');
    expect(decoded.role).toBe('taxpayer');
  });

  it('rejects expired tokens', () => {
    const token = signToken({ sub: 'usr-001', role: 'taxpayer' }, { secret: 'test-secret', expiresIn: '-1s' });

    expect(() => verifyToken(token, { secret: 'test-secret' })).toThrow('jwt expired');
  });

  it('rejects tampered tokens', () => {
    const token = signToken({ sub: 'usr-001', role: 'taxpayer' }, { secret: 'test-secret', expiresIn: '10m' });
    const [header, payload] = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'usr-001', role: 'admin' })).toString('base64url');
    const tampered = [header, tamperedPayload, token.split('.')[2]].join('.');

    expect(() => verifyToken(tampered, { secret: 'test-secret' })).toThrow(jwt.JsonWebTokenError);
    expect(payload).not.toBe(tamperedPayload);
  });

  it('authorizes only the required role', () => {
    expect(authorizeRole({ sub: 'usr-900', role: 'admin' }, 'admin')).toBe(true);
    expect(authorizeRole({ sub: 'usr-001', role: 'taxpayer' }, 'admin')).toBe(false);
    expect(authorizeRole(null, 'admin')).toBe(false);
  });
});
