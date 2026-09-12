import { Router } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { requireAuth } from '../auth/auth.middleware';
import type { AuthServiceContract } from '../auth/auth.service';
import { patientIdSchema } from '../patients/patient.schemas';
import { clinicalHistoryInputSchema } from './clinical-history.schemas';
import type { ClinicalHistoryServiceContract } from './clinical-history.service';

function ownerId(request: Express.Request) {
  if (!request.authenticatedUser) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Debes iniciar sesión.');
  return request.authenticatedUser.id;
}

export function createClinicalHistoryRouter(auth: AuthServiceContract, service: ClinicalHistoryServiceContract) {
  const router = Router({ mergeParams: true });
  router.use(requireAuth(auth));
  router.get('/', async (request, response, next) => {
    try {
      const patientId = patientIdSchema.parse((request.params as { patientId?: string }).patientId);
      response.json({ clinicalHistory: await service.get(ownerId(request), patientId) });
    } catch (error) { next(error); }
  });
  router.put('/', async (request, response, next) => {
    try {
      const patientId = patientIdSchema.parse((request.params as { patientId?: string }).patientId);
      const input = clinicalHistoryInputSchema.parse(request.body);
      response.json({ clinicalHistory: await service.put(ownerId(request), patientId, input) });
    } catch (error) { next(error); }
  });
  return router;
}
