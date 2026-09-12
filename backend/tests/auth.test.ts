import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app';
import type { AuthServiceContract, PublicUser } from '../src/modules/auth/auth.service';

const user: PublicUser = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Pediatra de prueba',
  email: 'pediatra@example.com',
  role: 'PEDIATRICIAN',
};

function createAuthService(overrides: Partial<AuthServiceContract> = {}): AuthServiceContract {
  return {
    login: vi.fn().mockResolvedValue({
      token: 'test-session-token',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      user,
    }),
    authenticate: vi.fn().mockResolvedValue(user),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('authentication endpoints', () => {
  it('logs in and stores the session in an httpOnly cookie', async () => {
    const authService = createAuthService();
    const response = await request(createApp(authService)).post('/api/v1/auth/login').send({
      email: 'PEDIATRA@example.com',
      password: 'correct-password',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user });
    expect(response.headers['set-cookie']?.[0]).toContain('pediachild_session=test-session-token');
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(authService.login).toHaveBeenCalledWith({
      identifier: 'pediatra@example.com',
      password: 'correct-password',
    });
  });

  it('rejects invalid login input', async () => {
    const response = await request(createApp(createAuthService()))
      .post('/api/v1/auth/login')
      .send({ email: 'invalid', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns the authenticated user', async () => {
    const authService = createAuthService();
    const response = await request(createApp(authService))
      .get('/api/v1/auth/me')
      .set('Cookie', 'pediachild_session=test-session-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user });
    expect(authService.authenticate).toHaveBeenCalledWith('test-session-token');
  });

  it('rejects access without a session cookie', async () => {
    const response = await request(createApp(createAuthService())).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('revokes the session on logout', async () => {
    const authService = createAuthService();
    const response = await request(createApp(authService))
      .post('/api/v1/auth/logout')
      .set('Cookie', 'pediachild_session=test-session-token');

    expect(response.status).toBe(204);
    expect(authService.logout).toHaveBeenCalledWith('test-session-token');
    expect(response.headers['set-cookie']?.[0]).toContain('pediachild_session=;');
  });
});
