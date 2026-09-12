import { z } from 'zod';

import { AgeUnit } from '../patients/patient.entity';
import { ConsultationStatus } from './consultation.entity';
import { MeasurementPosition } from './anthropometric-measurement.entity';

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
const nullableInteger = (min: number, max: number) => z.number().int().min(min).max(max).nullable().optional();
const nullableNumber = (min: number, max: number) => z.number().min(min).max(max).nullable().optional();
const percentileSchema = z.union([z.literal(3), z.literal(15), z.literal(50), z.literal(85), z.literal(97)]).nullable().optional();

export const vitalSignsInputSchema = z.object({
  heartRateBpm: nullableInteger(0, 400),
  respiratoryRateRpm: nullableInteger(0, 200),
  systolicPressureMmhg: nullableInteger(0, 400),
  diastolicPressureMmhg: nullableInteger(0, 300),
  oxygenSaturationPercent: nullableInteger(0, 100),
  temperatureC: nullableNumber(20, 50),
  pulsesDescription: nullableText(1_000),
  capillaryRefillSeconds: nullableNumber(0, 60),
});

export const anthropometricMeasurementInputSchema = z
  .object({
    weightKg: nullableNumber(0, 500),
    lengthHeightCm: nullableNumber(0, 300),
    headCircumferenceCm: nullableNumber(0, 100),
    measurementPosition: z.nativeEnum(MeasurementPosition).nullable().optional(),
    weightForAgePercentile: percentileSchema,
    weightForLengthHeightPercentile: percentileSchema,
    lengthHeightForAgePercentile: percentileSchema,
    nutritionalDiagnosis: nullableText(2_000),
  })
  .refine((input) => input.lengthHeightCm == null || input.measurementPosition != null, {
    message: 'Indica si se midió longitud acostado o estatura de pie.',
    path: ['measurementPosition'],
  });

export const diagnosisInputSchema = z.object({
  description: z.string().trim().min(1).max(1_000),
  code: nullableText(50),
});

export const treatmentInputSchema = z.object({
  description: z.string().trim().min(1).max(500),
  dose: nullableText(200),
  route: nullableText(100),
  frequency: nullableText(200),
  duration: nullableText(200),
  instructions: nullableText(5_000),
});

const consultationFields = {
  consultationDate: z.string().datetime({ offset: true }).optional(),
  patientAgeValue: z.number().int().min(0).max(10_000).optional(),
  patientAgeUnit: z.nativeEnum(AgeUnit).optional(),
  reason: z.string().trim().min(1).max(500),
  currentIllness: nullableText(10_000),
  physicalExamination: nullableText(10_000),
  notes: nullableText(10_000),
  laboratoryNotes: nullableText(10_000),
  imagingNotes: nullableText(10_000),
  diagnoses: z.array(diagnosisInputSchema).max(50).default([]),
  treatments: z.array(treatmentInputSchema).max(50).default([]),
  vitalSigns: vitalSignsInputSchema.nullable().optional(),
  anthropometricMeasurement: anthropometricMeasurementInputSchema.nullable().optional(),
};

export const createConsultationSchema = z.object(consultationFields);

export const updateConsultationSchema = z
  .object({
    consultationDate: z.string().datetime({ offset: true }).optional(),
    patientAgeValue: z.number().int().min(0).max(10_000).optional(),
    patientAgeUnit: z.nativeEnum(AgeUnit).optional(),
    reason: z.string().trim().min(1).max(500).optional(),
    currentIllness: nullableText(10_000),
    physicalExamination: nullableText(10_000),
    notes: nullableText(10_000),
    laboratoryNotes: nullableText(10_000),
    imagingNotes: nullableText(10_000),
    diagnoses: z.array(diagnosisInputSchema).max(50).optional(),
    treatments: z.array(treatmentInputSchema).max(50).optional(),
    vitalSigns: vitalSignsInputSchema.nullable().optional(),
    anthropometricMeasurement: anthropometricMeasurementInputSchema.nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, 'Debes enviar al menos un campo.');

export const listConsultationsSchema = z.object({
  status: z.nativeEnum(ConsultationStatus).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).refine((input) => !input.from || !input.to || input.from < input.to, {
  message: 'El rango de fechas no es válido.',
  path: ['to'],
});

export const consultationIdSchema = z.string().uuid();

export type DiagnosisInput = z.infer<typeof diagnosisInputSchema>;
export type TreatmentInput = z.infer<typeof treatmentInputSchema>;
export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>;
export type ListConsultationsInput = z.infer<typeof listConsultationsSchema>;
