import { Router } from 'express';

import { AppError } from '../../shared/errors/app-error';
import { requireAuth } from '../auth/auth.middleware';
import type { AuthServiceContract } from '../auth/auth.service';
import { appointmentIdSchema } from '../appointments/appointment.schemas';
import { patientIdSchema } from '../patients/patient.schemas';
import {
  consultationIdSchema,
  createConsultationSchema,
  listConsultationsSchema,
  updateConsultationSchema,
} from './consultation.schemas';
import type { ConsultationServiceContract } from './consultation.service';

function pediatricianId(request: Express.Request): string {
  if (!request.authenticatedUser) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Debes iniciar sesión.');
  }
  return request.authenticatedUser.id;
}

export function createConsultationRouter(
  authService: AuthServiceContract,
  consultationService: ConsultationServiceContract,
) {
  const router = Router();
  router.use(requireAuth(authService));

  router.get('/:consultationId', async (request, response, next) => {
    try {
      const consultationId = consultationIdSchema.parse(request.params.consultationId);
      const consultation = await consultationService.getById(
        pediatricianId(request),
        consultationId,
      );
      response.status(200).json({ consultation });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:consultationId', async (request, response, next) => {
    try {
      const consultationId = consultationIdSchema.parse(request.params.consultationId);
      const input = updateConsultationSchema.parse(request.body);
      const consultation = await consultationService.update(
        pediatricianId(request),
        consultationId,
        input,
      );
      response.status(200).json({ consultation });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:consultationId/complete', async (request, response, next) => {
    try {
      const consultationId = consultationIdSchema.parse(request.params.consultationId);
      const consultation = await consultationService.complete(
        pediatricianId(request),
        consultationId,
      );
      response.status(200).json({ consultation });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createPatientConsultationRouter(
  authService: AuthServiceContract,
  consultationService: ConsultationServiceContract,
) {
  const router = Router({ mergeParams: true });
  router.use(requireAuth(authService));

  router.get('/', async (request, response, next) => {
    try {
      const patientId = patientIdSchema.parse(
        (request.params as { patientId?: string }).patientId,
      );
      const query = listConsultationsSchema.parse(request.query);
      response
        .status(200)
        .json(await consultationService.listForPatient(pediatricianId(request), patientId, query));
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (request, response, next) => {
    try {
      const patientId = patientIdSchema.parse(
        (request.params as { patientId?: string }).patientId,
      );
      const input = createConsultationSchema.parse(request.body);
      const consultation = await consultationService.createForPatient(
        pediatricianId(request),
        patientId,
        input,
      );
      response.status(201).json({ consultation });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createStartConsultationRouter(
  authService: AuthServiceContract,
  consultationService: ConsultationServiceContract,
) {
  const router = Router({ mergeParams: true });
  router.use(requireAuth(authService));

  router.post('/', async (request, response, next) => {
    try {
      const appointmentId = appointmentIdSchema.parse(
        (request.params as { appointmentId?: string }).appointmentId,
      );
      const consultation = await consultationService.startFromAppointment(
        pediatricianId(request),
        appointmentId,
      );
      response.status(201).json({ consultation });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
