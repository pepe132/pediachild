import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { forgotPasswordSchema, resetPasswordSchema } from './password-recovery.schemas';
import { PasswordRecoveryService } from './password-recovery.service';

const limiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_RECOVERY_ATTEMPTS',
      message: 'Espera antes de solicitar otro enlace.',
    },
  },
});

export function createPasswordRecoveryRouter(service: PasswordRecoveryService) {
  const router = Router();

  router.post('/forgot-password', limiter, async (request, response, next) => {
    try {
      const { identifier } = forgotPasswordSchema.parse(request.body);
      await service.request(identifier);
      response.status(202).json({
        message: 'Si la cuenta existe, recibirás instrucciones en el correo registrado.',
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/reset-password', limiter, async (request, response, next) => {
    try {
      const input = resetPasswordSchema.parse(request.body);
      await service.reset(input.token, input.newPassword);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
