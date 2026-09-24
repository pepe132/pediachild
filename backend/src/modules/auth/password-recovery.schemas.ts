import { z } from 'zod';

const identifier = z
  .string()
  .trim()
  .toLowerCase()
  .min(5)
  .max(254)
  .transform((value) => (/^\d{10}$/.test(value) ? `+52${value}` : value));

export const forgotPasswordSchema = z.object({ identifier });

export const resetPasswordSchema = z.object({
  token: z.string().min(40).max(200),
  newPassword: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres.')
    .max(128),
});
