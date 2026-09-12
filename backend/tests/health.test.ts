import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app';

describe('health endpoint', () => {
  it('returns the service status', async () => {
    const response = await request(createApp()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'pediachild-backend',
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
  });

  it('returns the standard error shape for unknown routes', async () => {
    const response = await request(createApp()).get('/api/v1/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Route GET /api/v1/unknown not found.',
      },
    });
  });
});
