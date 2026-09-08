import request from 'supertest';
import app from '../../app.js';
import { signToken } from '../../logic/auth.js';

describe('admin RBAC integration', () => {
  it('rejects a taxpayer token on an admin route before controller access', async () => {
    const token = signToken({ sub: '11111111-1111-4111-8111-111111111111', role: 'taxpayer' });

    const response = await request(app).get('/api/admin/taxpayers').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('You are not allowed to access this resource.');
  });
});
