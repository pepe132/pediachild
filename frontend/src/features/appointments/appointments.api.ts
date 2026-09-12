import { apiRequest } from '../../api/client';
import type { Appointment, AppointmentListResponse, AppointmentStatus } from '../../types/appointment';
import type { Consultation } from '../../types/consultation';

export interface AppointmentInput {
  patientId: string;
  scheduledAt: string;
  durationMinutes: number;
  reason: string;
  notes: string | null;
}

export function listAppointments(filters: { from?: string; to?: string; status?: AppointmentStatus; patientId?: string }) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
  return apiRequest<AppointmentListResponse>(`/appointments?limit=100&${query.toString()}`);
}

export function getAppointment(id: string) {
  return apiRequest<{ appointment: Appointment }>(`/appointments/${id}`);
}

export function createAppointment(input: AppointmentInput) {
  return apiRequest<{ appointment: Appointment }>('/appointments', { method: 'POST', body: JSON.stringify(input) });
}

export function updateAppointment(id: string, input: Omit<AppointmentInput, 'patientId'>) {
  return apiRequest<{ appointment: Appointment }>(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function changeAppointmentStatus(id: string, action: 'confirm' | 'cancel' | 'no-show') {
  return apiRequest<{ appointment: Appointment }>(`/appointments/${id}/${action}`, { method: 'POST' });
}

export function startAppointmentConsultation(id: string) {
  return apiRequest<{ consultation: Consultation }>(`/appointments/${id}/start-consultation`, { method: 'POST' });
}
