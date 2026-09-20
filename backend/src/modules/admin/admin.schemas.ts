import { z } from 'zod';
export const specialistIdSchema=z.string().uuid();
export const listSpecialistsSchema=z.object({status:z.enum(['PENDING','APPROVED','REJECTED','SUSPENDED']).default('PENDING'),page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().positive().max(100).default(20)});
export const rejectionSchema=z.object({reason:z.string().trim().min(3).max(500)});
