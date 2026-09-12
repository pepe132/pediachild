import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(5).max(254).optional(),
  email: z.string().trim().toLowerCase().optional(),
  password: z.string().min(8).max(128),
}).refine((value) => Boolean(value.identifier || value.email), { message: 'Escribe tu correo o teléfono.', path: ['identifier'] }).transform((value) => {
  const identifier = value.identifier || value.email!;
  return { identifier: /^\d{10}$/.test(identifier) ? `+52${identifier}` : identifier, password: value.password };
});
const phone = z.string().trim().regex(/^\d{10}$/, 'Escribe exactamente los 10 dígitos del teléfono.').transform((value) => `+52${value}`);
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre completo.').max(120, 'El nombre es demasiado largo.'),
  email: z.string().trim().toLowerCase().email('Escribe un correo electrónico válido.').max(254), phone,
  password: z.string().min(12, 'La contraseña debe tener al menos 12 caracteres.').max(128),
  specialty: z.string().trim().min(2, 'Selecciona una especialidad.').max(150),
  professionalLicense: z.string().trim().min(1, 'Escribe la cédula profesional.').max(100, 'La cédula es demasiado larga.'),
  specialtyLicense: z.string().trim().max(100).nullable().optional(), clinicName: z.string().trim().max(200).nullable().optional(), clinicPhone: phone.nullable().optional(), clinicAddress: z.string().trim().max(1000).nullable().optional(),
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, 'La nueva contraseña debe tener al menos 12 caracteres.').max(128),
}).refine(value => value.currentPassword !== value.newPassword, { message: 'La nueva contraseña debe ser diferente.', path: ['newPassword'] });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
