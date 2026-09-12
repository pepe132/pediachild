export type ImmunizationStatus = 'COMPLETE' | 'INCOMPLETE' | 'UNKNOWN';
export type FamilyRelationship = 'MOTHER' | 'FATHER';
export type FoodType = 'RED_MEAT' | 'CHICKEN' | 'EGG' | 'MILK' | 'FISH' | 'CEREALS' | 'TORTILLA' | 'LEGUMES' | 'VEGETABLES' | 'FRUITS' | 'SODA' | 'BREAD';
export type PathologicalCategory = 'ALLERGY' | 'SURGERY' | 'TRAUMA' | 'EXANTHEMATIC_DISEASE' | 'HOSPITALIZATION';
export type ClinicalPresenceStatus = 'DENIED' | 'PRESENT' | 'UNKNOWN';

export interface FamilyMemberHistory {
  relationship: FamilyRelationship; age: number | null; origin: string; residence: string; schooling: string;
  language: string; occupation: string; religion: string; substanceUse: string; tattoosPiercings: string;
  comorbidities: string; bloodType: string;
}
export interface NonPathologicalHistory {
  origin: string; residence: string; housingNotes: string; servicesNotes: string; cookingFuelNotes: string;
  waterNotes: string; bathroomNotes: string; cohabitantsNotes: string; roomNotes: string; animalContactNotes: string;
  biomassExposureNotes: string; bathingNotes: string; clothingChangeNotes: string; toothBrushingsPerDay: number | null;
  urinationNotes: string; bowelMovementsPerDay: number | null; bristolType: number | null;
}
export interface NutritionHistory {
  exclusiveBreastfeedingNotes: string; complementaryFeedingNotes: string; familyDietNotes: string;
  mealsPerDay: number | null; twentyFourHourRecall: string;
}
export interface PerinatalHistory {
  maternalAgeAtPregnancy: number | null; pregnancies: number | null; births: number | null; cesareans: number | null;
  abortions: number | null; pregnancyNumber: number | null; pregnancyPlanned: boolean | null; pregnancyDesired: boolean | null;
  pregnancyNotes: string; prenatalVisits: number | null; ultrasoundNotes: string; maternalVaccinesNotes: string;
  maternalConditionsNotes: string; birthRoute: '' | 'VAGINAL' | 'ABDOMINAL_CESAREAN'; birthPlace: string; gestationalAgeWeeks: number | null;
  gestationalAgeDays: number | null; birthWeightGrams: number | null; birthLengthCm: number | null; apgar: string;
  criedAndBreathedAtBirth: boolean | null; metabolicScreeningNotes: string; hearingScreeningNotes: string;
  cardiacScreeningNotes: string; ophthalmologicalScreeningNotes: string; hipScreeningNotes: string; perinatalHospitalizationNotes: string;
}
export interface ClinicalHistoryInput {
  informantName: string; informantRelationship: string; siblingsHistory: string; grandparentsHistory: string;
  neurodevelopmentNotes: string; ediResultNotes: string; schoolingNotes: string; immunizationStatus: ImmunizationStatus;
  missingVaccines: string; immunizationNotes: string; familyMembers: FamilyMemberHistory[];
  nonPathologicalHistory: NonPathologicalHistory; nutritionHistory: NutritionHistory;
  foodFrequencies: { foodType: FoodType; daysPerWeek: number }[]; perinatalHistory: PerinatalHistory;
  pathologicalHistoryItems: { category: PathologicalCategory; status: ClinicalPresenceStatus; description: string }[];
}
export interface ClinicalHistory extends ClinicalHistoryInput { id: string; patientId: string; createdAt: string; updatedAt: string }
