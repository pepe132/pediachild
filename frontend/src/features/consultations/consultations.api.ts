import { apiRequest } from '../../api/client';
import type { AgeUnit } from '../../types/patient';
import type { Consultation, ConsultationListResponse } from '../../types/consultation';

export interface ConsultationInput {
  consultationDate: string;
  patientAgeValue: number;
  patientAgeUnit: AgeUnit;
  reason: string;
  currentIllness: string | null;
  physicalExamination: string | null;
  notes: string | null;
  laboratoryNotes: string | null;
  imagingNotes: string | null;
  diagnoses: Array<{ description: string; code: string | null }>;
  treatments: Array<{ description: string; dose: string | null; route: string | null; frequency: string | null; duration: string | null; instructions: string | null }>;
  vitalSigns: {
    heartRateBpm: number | null;
    respiratoryRateRpm: number | null;
    systolicPressureMmhg: number | null;
    diastolicPressureMmhg: number | null;
    oxygenSaturationPercent: number | null;
    temperatureC: number | null;
    pulsesDescription: string | null;
    capillaryRefillSeconds: number | null;
  } | null;
  anthropometricMeasurement: {
    weightKg: number | null;
    lengthHeightCm: number | null;
    headCircumferenceCm: number | null;
    measurementPosition: 'RECUMBENT_LENGTH' | 'STANDING_HEIGHT' | null;
    weightForAgePercentile: 3 | 15 | 50 | 85 | 97 | null;
    weightForLengthHeightPercentile: 3 | 15 | 50 | 85 | 97 | null;
    lengthHeightForAgePercentile: 3 | 15 | 50 | 85 | 97 | null;
    nutritionalDiagnosis: string | null;
  } | null;
}

export function listPatientConsultations(patientId: string) {
  return apiRequest<ConsultationListResponse>(`/patients/${patientId}/consultations?limit=50`);
}

export function createConsultation(patientId: string, input: ConsultationInput) {
  return apiRequest<{ consultation: Consultation }>(`/patients/${patientId}/consultations`, {
    method: 'POST', body: JSON.stringify(input),
  });
}

export function getConsultation(consultationId: string) {
  return apiRequest<{ consultation: Consultation }>(`/consultations/${consultationId}`);
}

export function updateConsultation(consultationId: string, input: ConsultationInput) {
  return apiRequest<{ consultation: Consultation }>(`/consultations/${consultationId}`, {
    method: 'PATCH', body: JSON.stringify(input),
  });
}

export function completeConsultation(consultationId: string) {
  return apiRequest<{ consultation: Consultation }>(`/consultations/${consultationId}/complete`, {
    method: 'POST',
  });
}
