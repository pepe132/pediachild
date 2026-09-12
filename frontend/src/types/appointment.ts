import type { Patient } from './patient';

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  patientId: string;
  patient: Patient;
  scheduledAt: string;
  durationMinutes: number;
  endsAt: string;
  reason: string;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentListResponse {
  data: Appointment[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
