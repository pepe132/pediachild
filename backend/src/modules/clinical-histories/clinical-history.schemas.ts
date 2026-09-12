import { z } from 'zod';
import { ClinicalPresenceStatus, PathologicalCategory } from './pathological-history-item.entity';
import { FamilyRelationship } from './family-member-history.entity';
import { FoodType } from './food-frequency.entity';
import { ImmunizationStatus } from './clinical-history.entity';

const text = (max = 10_000) => z.string().trim().max(max).nullable().optional();
const integer = (min: number, max: number) => z.number().int().min(min).max(max).nullable().optional();

const familyMember = z.object({
  relationship: z.nativeEnum(FamilyRelationship), age: integer(0, 130), origin: text(300), residence: text(300),
  schooling: text(200), language: text(100), occupation: text(200), religion: text(150), substanceUse: text(),
  tattoosPiercings: text(), comorbidities: text(), bloodType: text(20),
});
const nonPathological = z.object({
  origin: text(300), residence: text(300), housingNotes: text(), servicesNotes: text(), cookingFuelNotes: text(),
  waterNotes: text(), bathroomNotes: text(), cohabitantsNotes: text(), roomNotes: text(), animalContactNotes: text(),
  biomassExposureNotes: text(), bathingNotes: text(), clothingChangeNotes: text(), toothBrushingsPerDay: integer(0, 20),
  urinationNotes: text(), bowelMovementsPerDay: z.number().min(0).max(50).nullable().optional(), bristolType: integer(1, 7),
});
const nutrition = z.object({
  exclusiveBreastfeedingNotes: text(), complementaryFeedingNotes: text(), familyDietNotes: text(), mealsPerDay: integer(0, 20), twentyFourHourRecall: text(),
});
const perinatal = z.object({
  maternalAgeAtPregnancy: integer(0, 70), pregnancies: integer(0, 30), births: integer(0, 30), cesareans: integer(0, 30), abortions: integer(0, 30), pregnancyNumber: integer(1, 30),
  pregnancyPlanned: z.boolean().nullable().optional(), pregnancyDesired: z.boolean().nullable().optional(), pregnancyNotes: text(), prenatalVisits: integer(0, 100),
  ultrasoundNotes: text(), maternalVaccinesNotes: text(), maternalConditionsNotes: text(), birthRoute: z.enum(['VAGINAL', 'ABDOMINAL_CESAREAN']).nullable().optional(), birthPlace: text(300),
  gestationalAgeWeeks: integer(15, 50), gestationalAgeDays: integer(0, 6), birthWeightGrams: integer(100, 10_000),
  birthLengthCm: z.number().min(10).max(100).nullable().optional(), apgar: text(100), criedAndBreathedAtBirth: z.boolean().nullable().optional(),
  metabolicScreeningNotes: text(), hearingScreeningNotes: text(), cardiacScreeningNotes: text(), ophthalmologicalScreeningNotes: text(), hipScreeningNotes: text(), perinatalHospitalizationNotes: text(),
});
const foodFrequency = z.object({ foodType: z.nativeEnum(FoodType), daysPerWeek: z.number().int().min(0).max(7) });
const pathologicalItem = z.object({ category: z.nativeEnum(PathologicalCategory), status: z.nativeEnum(ClinicalPresenceStatus), description: text() })
  .refine((item) => item.status !== ClinicalPresenceStatus.PRESENT || Boolean(item.description), { message: 'Describe el antecedente presente.', path: ['description'] });

export const clinicalHistoryInputSchema = z.object({
  informantName: text(200), informantRelationship: text(100), siblingsHistory: text(), grandparentsHistory: text(),
  neurodevelopmentNotes: text(), ediResultNotes: text(), schoolingNotes: text(), immunizationStatus: z.nativeEnum(ImmunizationStatus).default(ImmunizationStatus.UNKNOWN),
  missingVaccines: text(), immunizationNotes: text(), familyMembers: z.array(familyMember).max(2).default([]),
  nonPathologicalHistory: nonPathological.nullable().optional(), nutritionHistory: nutrition.nullable().optional(),
  foodFrequencies: z.array(foodFrequency).max(12).default([]), perinatalHistory: perinatal.nullable().optional(),
  pathologicalHistoryItems: z.array(pathologicalItem).max(5).default([]),
}).superRefine((input, context) => {
  if (input.immunizationStatus === ImmunizationStatus.INCOMPLETE && !input.missingVaccines) context.addIssue({ code: 'custom', path: ['missingVaccines'], message: 'Indica qué vacunas faltan.' });
  const unique = (values: string[]) => new Set(values).size === values.length;
  if (!unique(input.familyMembers.map((x) => x.relationship))) context.addIssue({ code: 'custom', path: ['familyMembers'], message: 'No se permiten parentescos repetidos.' });
  if (!unique(input.foodFrequencies.map((x) => x.foodType))) context.addIssue({ code: 'custom', path: ['foodFrequencies'], message: 'No se permiten alimentos repetidos.' });
  if (!unique(input.pathologicalHistoryItems.map((x) => x.category))) context.addIssue({ code: 'custom', path: ['pathologicalHistoryItems'], message: 'No se permiten categorías repetidas.' });
});

export type ClinicalHistoryInput = z.infer<typeof clinicalHistoryInputSchema>;
