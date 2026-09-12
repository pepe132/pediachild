import { Router } from 'express';

import { AppError } from '../../shared/errors/app-error';
import { requireAuth } from '../auth/auth.middleware';
import type { AuthServiceContract } from '../auth/auth.service';
import {
  appointmentIdSchema,
  createAppointmentSchema,
  listAppointmentsSchema,
  updateAppointmentSchema,
} from './appointment.schemas';
import type { AppointmentServiceContract } from './appointment.service';

function pediatricianId(request: Express.Request): string {
  if (!request.authenticatedUser) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Debes iniciar sesión.');
  }
  return request.authenticatedUser.id;
}

export function createAppointmentRouter(
  authService: AuthServiceContract,
  appointmentService: AppointmentServiceContract,
) {
  const router = Router();
  router.use(requireAuth(authService));

  router.get('/', async (request, response, next) => {
    try {
      const query = listAppointmentsSchema.parse(request.query);
      response.status(200).json(await appointmentService.list(pediatricianId(request), query));
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (request, response, next) => {
    try {
      const input = createAppointmentSchema.parse(request.body);
      const appointment = await appointmentService.create(pediatricianId(request), input);
      response.status(201).json({ appointment });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:appointmentId', async (request, response, next) => {
    try {
      const appointmentId = appointmentIdSchema.parse(request.params.appointmentId);
      const appointment = await appointmentService.getById(
        pediatricianId(request),
        appointmentId,
      );
      response.status(200).json({ appointment });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:appointmentId', async (request, response, next) => {
    try {
      const appointmentId = appointmentIdSchema.parse(request.params.appointmentId);
      const input = updateAppointmentSchema.parse(request.body);
      const appointment = await appointmentService.update(
        pediatricianId(request),
        appointmentId,
        input,
      );
      response.status(200).json({ appointment });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:appointmentId/confirm', async (request, response, next) => {
    try {
      const appointmentId = appointmentIdSchema.parse(request.params.appointmentId);
      const appointment = await appointmentService.confirm(
        pediatricianId(request),
        appointmentId,
      );
      response.status(200).json({ appointment });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:appointmentId/cancel', async (request, response, next) => {
    try {
      const appointmentId = appointmentIdSchema.parse(request.params.appointmentId);
      const appointment = await appointmentService.cancel(
        pediatricianId(request),
        appointmentId,
      );
      response.status(200).json({ appointment });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:appointmentId/no-show', async (request, response, next) => {
    try {
      const appointmentId = appointmentIdSchema.parse(request.params.appointmentId);
      const appointment = await appointmentService.markNoShow(
        pediatricianId(request),
        appointmentId,
      );
      response.status(200).json({ appointment });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
