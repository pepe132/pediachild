import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { AppError } from '../shared/errors/app-error';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export const originProtection: RequestHandler = (request, _response, next) => {
  if (safeMethods.has(request.method) || env.NODE_ENV !== 'production') return next();
  const origin = request.get('origin');
  if (origin !== env.FRONTEND_URL) return next(new AppError(403, 'INVALID_ORIGIN', 'Origen de solicitud no permitido.'));
  next();
};

export const apiLimiter = rateLimit({
  windowMs: 60_000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Demasiadas solicitudes. Intenta nuevamente en un minuto.' } },
});
