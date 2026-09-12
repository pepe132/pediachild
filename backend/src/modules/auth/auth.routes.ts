import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { env } from '../../config/env';
import { AppError } from '../../shared/errors/app-error';
import { changePasswordSchema, loginSchema, registerSchema } from './auth.schemas';
import { requireAuth, SESSION_COOKIE_NAME } from './auth.middleware';
import type { AuthServiceContract } from './auth.service';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_LOGIN_ATTEMPTS',
      message: 'Demasiados intentos. Intenta nuevamente más tarde.',
    },
  },
});

function cookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    path: '/',
    ...(expires ? { expires } : {}),
  };
}

export function createAuthRouter(authService: AuthServiceContract) {
  const router = Router();
  router.post('/register', loginLimiter, async (request, response, next) => {
    try {
      if (!authService.register) throw new AppError(501, 'REGISTRATION_UNAVAILABLE', 'El registro no está disponible.');
      const user = await authService.register(registerSchema.parse(request.body));
      response.status(201).json({ user });
    } catch (error) { next(error); }
  });

  router.post('/login', loginLimiter, async (request, response, next) => {
    try {
      const input = loginSchema.parse(request.body);
      const result = await authService.login(input);

      response.cookie(SESSION_COOKIE_NAME, result.token, cookieOptions(result.expiresAt));
      response.status(200).json({ user: result.user });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', async (request, response, next) => {
    try {
      const token = request.cookies[SESSION_COOKIE_NAME] as string | undefined;
      if (token) {
        await authService.logout(token);
      }

      response.clearCookie(SESSION_COOKIE_NAME, cookieOptions());
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.post('/change-password', requireAuth(authService), async (request, response, next) => {
    try {
      if (!request.authenticatedUser || !authService.changePassword) throw new AppError(501, 'PASSWORD_CHANGE_UNAVAILABLE', 'No fue posible cambiar la contraseña.');
      await authService.changePassword(request.authenticatedUser.id, changePasswordSchema.parse(request.body));
      response.clearCookie(SESSION_COOKIE_NAME, cookieOptions());
      response.status(204).send();
    } catch (error) { next(error); }
  });

  router.get('/me', requireAuth(authService), (request, response, next) => {
    if (!request.authenticatedUser) {
      next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Debes iniciar sesión.'));
      return;
    }
    response.status(200).json({ user: request.authenticatedUser });
  });

  return router;
}
