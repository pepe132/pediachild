import type { AgeUnit, Patient } from './patient';

export interface Diagnosis {
  id: string;
  description: string;
  code: string | null;
}

export interface Treatment {
  id: string;
  description: string;
  dose: string | null;
  route: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
}

export interface VitalSigns {
  id: string;
  heartRateBpm: number | null;
  respiratoryRateRpm: number | null;
  systolicPressureMmhg: number | null;
  diastolicPressureMmhg: number | null;
  oxygenSaturationPercent: number | null;
  temperatureC: number | null;
  pulsesDescription: string | null;
  capillaryRefillSeconds: number | null;
}

export interface AnthropometricMeasurement {
  id: string;
  weightKg: number | null;
  lengthHeightCm: number | null;
  bmi: number | null;
  headCircumferenceCm: number | null;
  measurementPosition: 'RECUMBENT_LENGTH' | 'STANDING_HEIGHT' | null;
  weightForAgePercentile: number | null;
  weightForLengthHeightPercentile: number | null;
  lengthHeightForAgePercentile: number | null;
  nutritionalDiagnosis: string | null;
}

export interface Consultation {
  id: string;
  patientId: string;
  patient?: Patient;
  appointmentId: string | null;
  consultationDate: string;
  patientAgeValue: number;
  patientAgeUnit: AgeUnit;
  reason: string;
  currentIllness: string | null;
  physicalExamination: string | null;
  notes: string | null;
  laboratoryNotes: string | null;
  imagingNotes: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED';
  completedAt: string | null;
  diagnoses: Diagnosis[];
  treatments: Treatment[];
  vitalSigns: VitalSigns | null;
  anthropometricMeasurement: AnthropometricMeasurement | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationListResponse {
  data: Consultation[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
