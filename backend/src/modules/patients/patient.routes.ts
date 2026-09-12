import { Router } from 'express';

import { AppError } from '../../shared/errors/app-error';
import { requireAuth } from '../auth/auth.middleware';
import type { AuthServiceContract } from '../auth/auth.service';
import {
  createPatientSchema,
  listPatientsSchema,
  patientIdSchema,
  updatePatientSchema,
} from './patient.schemas';
import type { PatientServiceContract } from './patient.service';

function pediatricianId(request: Express.Request): string {
  if (!request.authenticatedUser) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Debes iniciar sesión.');
  }
  return request.authenticatedUser.id;
}

export function createPatientRouter(
  authService: AuthServiceContract,
  patientService: PatientServiceContract,
) {
  const router = Router();
  router.use(requireAuth(authService));

  router.get('/', async (request, response, next) => {
    try {
      const query = listPatientsSchema.parse(request.query);
      response.status(200).json(await patientService.list(pediatricianId(request), query));
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (request, response, next) => {
    try {
      const input = createPatientSchema.parse(request.body);
      const patient = await patientService.create(pediatricianId(request), input);
      response.status(201).json({ patient });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:patientId', async (request, response, next) => {
    try {
      const patientId = patientIdSchema.parse(request.params.patientId);
      const patient = await patientService.getById(pediatricianId(request), patientId);
      response.status(200).json({ patient });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:patientId', async (request, response, next) => {
    try {
      const patientId = patientIdSchema.parse(request.params.patientId);
      const input = updatePatientSchema.parse(request.body);
      const patient = await patientService.update(pediatricianId(request), patientId, input);
      response.status(200).json({ patient });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
