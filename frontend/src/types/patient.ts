export type AgeUnit = 'DAYS' | 'MONTHS' | 'YEARS';
export type PatientSex = 'FEMALE' | 'MALE';

export interface Patient {
  id: string;
  pediatricianId: string;
  firstName: string;
  lastName: string;
  ageValue: number;
  ageUnit: AgeUnit;
  dateOfBirth: string | null;
  sex: PatientSex | null;
  placeOfBirth: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientListResponse {
  data: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
