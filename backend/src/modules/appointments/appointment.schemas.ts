import { z } from 'zod';

import { AppointmentStatus } from './appointment.entity';

const dateTimeSchema = z.string().datetime({ offset: true });

const futureDateTimeSchema = dateTimeSchema.refine(
  (value) => new Date(value).getTime() > Date.now(),
  'La cita debe programarse en el futuro.',
);

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  scheduledAt: futureDateTimeSchema,
  durationMinutes: z.number().int().min(5).max(480).default(30),
  reason: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(5_000).nullable().optional(),
});

export const updateAppointmentSchema = z
  .object({
    scheduledAt: futureDateTimeSchema.optional(),
    durationMinutes: z.number().int().min(5).max(480).optional(),
    reason: z.string().trim().min(1).max(500).optional(),
    notes: z.string().trim().max(5_000).nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, 'Debes enviar al menos un campo.');

export const listAppointmentsSchema = z
  .object({
    from: dateTimeSchema.optional(),
    to: dateTimeSchema.optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    patientId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
  })
  .refine((input) => !input.from || !input.to || input.from < input.to, {
    message: 'El rango de fechas no es válido.',
    path: ['to'],
  });

export const appointmentIdSchema = z.string().uuid();

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;
