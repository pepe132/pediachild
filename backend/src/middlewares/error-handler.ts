import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../shared/errors/app-error';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    const fields = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join('.'), issue.message]),
    );

    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Hay información inválida.',
        fields,
      },
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    });
    return;
  }

  logger.error({ err: error }, 'Unhandled application error');

  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error interno.',
      ...(env.NODE_ENV === 'development' && error instanceof Error
        ? { detail: error.message }
        : {}),
    },
  });
};
