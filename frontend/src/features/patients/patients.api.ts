import { apiRequest } from '../../api/client';
import type { AgeUnit, Patient, PatientListResponse, PatientSex } from '../../types/patient';

export interface PatientFilters {
  search?: string;
  registeredFrom?: string;
  registeredTo?: string;
  page: number;
  limit: number;
  sort: 'name' | 'createdAt';
  order: 'asc' | 'desc';
}

export function listPatients(filters: PatientFilters) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return apiRequest<PatientListResponse>(`/patients?${query.toString()}`);
}

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  ageValue: number;
  ageUnit: AgeUnit;
  dateOfBirth?: string | null;
  sex?: PatientSex | null;
  placeOfBirth?: string | null;
}

export function createPatient(input: CreatePatientInput) {
  return apiRequest<{ patient: Patient }>('/patients', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getPatient(patientId: string) {
  return apiRequest<{ patient: Patient }>(`/patients/${patientId}`);
}

export function updatePatient(patientId: string, input: CreatePatientInput) {
  return apiRequest<{ patient: Patient }>(`/patients/${patientId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
