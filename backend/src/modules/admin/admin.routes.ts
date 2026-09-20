import { Router } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { requireAuth } from '../auth/auth.middleware';
import type { AuthServiceContract } from '../auth/auth.service';
import { UserRole } from '../auth/user.entity';
import { listSpecialistsSchema,rejectionSchema,specialistIdSchema } from './admin.schemas';
import type { AdminServiceContract } from './admin.service';
export function createAdminRouter(auth:AuthServiceContract,service:AdminServiceContract){const r=Router();r.use(requireAuth(auth),(req,_res,next)=>req.authenticatedUser?.role===UserRole.ADMIN?next():next(new AppError(403,'ADMIN_REQUIRED','Se requiere una cuenta administradora.')));r.get('/specialists',async(req,res,next)=>{try{const q=listSpecialistsSchema.parse(req.query);res.json(await service.list(q.status,q.page,q.limit));}catch(e){next(e);}});r.post('/specialists/:id/approve',async(req,res,next)=>{try{res.json({specialist:await service.approve(req.authenticatedUser!.id,specialistIdSchema.parse(req.params.id))});}catch(e){next(e);}});r.post('/specialists/:id/reject',async(req,res,next)=>{try{const b=rejectionSchema.parse(req.body);res.json({specialist:await service.reject(req.authenticatedUser!.id,specialistIdSchema.parse(req.params.id),b.reason)});}catch(e){next(e);}});r.post('/specialists/:id/suspend',async(req,res,next)=>{try{res.json({specialist:await service.suspend(req.authenticatedUser!.id,specialistIdSchema.parse(req.params.id))});}catch(e){next(e);}});return r;}
