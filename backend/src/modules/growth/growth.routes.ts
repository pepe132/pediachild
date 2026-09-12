import { Router } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { requireAuth } from '../auth/auth.middleware';
import type { AuthServiceContract } from '../auth/auth.service';
import { patientIdSchema } from '../patients/patient.schemas';
import type { GrowthService } from './growth.service';

export function createGrowthRouter(auth: AuthServiceContract, service: GrowthService) {
  const router = Router({ mergeParams: true }); router.use(requireAuth(auth));
  router.get('/', async (req,res,next)=>{try {
    if(!req.authenticatedUser) throw new AppError(401,'AUTHENTICATION_REQUIRED','Debes iniciar sesión.');
    const patientId=patientIdSchema.parse((req.params as { patientId?: string }).patientId);
    res.json(await service.getForPatient(req.authenticatedUser.id,patientId));
  } catch(error){next(error);}});
  return router;
}
