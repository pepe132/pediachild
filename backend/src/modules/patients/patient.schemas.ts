import { z } from 'zod';

import { AgeUnit, PatientSex } from './patient.entity';

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Debe usar el formato YYYY-MM-DD.')
  .refine(isValidIsoDate, 'La fecha no es válida.');

const birthDateSchema = isoDateSchema
  .refine(
    (value) => new Date(`${value}T00:00:00.000Z`).getTime() <= Date.now(),
    'La fecha de nacimiento no puede estar en el futuro.',
  );

const patientFields = {
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  ageValue: z.number().int().min(0).max(10_000),
  ageUnit: z.nativeEnum(AgeUnit),
  dateOfBirth: birthDateSchema,
  sex: z.nativeEnum(PatientSex),
  placeOfBirth: z.string().trim().max(300).nullable().optional(),
};

export const createPatientSchema = z.object(patientFields);

export const updatePatientSchema = z
  .object({
    ...Object.fromEntries(
      Object.entries(patientFields).map(([key, schema]) => [key, schema.optional()]),
    ),
    active: z.boolean().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, 'Debes enviar al menos un campo.');

export const patientIdSchema = z.string().uuid();

export const listPatientsSchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    registeredFrom: isoDateSchema.optional(),
    registeredTo: isoDateSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    active: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
    sort: z.enum(['name', 'createdAt']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine(
    (input) => !input.registeredFrom || !input.registeredTo || input.registeredFrom <= input.registeredTo,
    { message: 'El rango de fechas no es válido.', path: ['registeredTo'] },
  );

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type ListPatientsInput = z.infer<typeof listPatientsSchema>;
