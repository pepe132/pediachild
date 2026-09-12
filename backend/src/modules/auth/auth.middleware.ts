import type { RequestHandler } from 'express';
import { createHash } from 'node:crypto';

import { AppError } from '../../shared/errors/app-error';
import type { AuthServiceContract } from './auth.service';
import { appDataSource } from '../../database/data-source';
import { AuditLog } from '../audit/audit-log.entity';
import { env } from '../../config/env';

export const SESSION_COOKIE_NAME = 'pediachild_session';

export function requireAuth(authService: AuthServiceContract): RequestHandler {
  return async (request, _response, next) => {
    try {
      const token = request.cookies[SESSION_COOKIE_NAME] as string | undefined;
      if (!token) {
        throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Debes iniciar sesión.');
      }

      const user = await authService.authenticate(token);
      if (!user) {
        throw new AppError(401, 'INVALID_SESSION', 'La sesión no es válida o expiró.');
      }

      request.authenticatedUser = user;
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && appDataSource.isInitialized) {
        const startedUserId = user.id;
        _response.once('finish', () => {
          const ip = request.ip || request.socket.remoteAddress || '';
          void appDataSource.getRepository(AuditLog).insert({
            userId: startedUserId, method: request.method, path: request.originalUrl.slice(0, 500),
            statusCode: _response.statusCode,
            ipHash: ip ? createHash('sha256').update(`${env.SESSION_SECRET}:${ip}`).digest('hex') : null,
            userAgent: request.get('user-agent')?.slice(0, 500) ?? null,
          });
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
