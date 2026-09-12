import { apiRequest } from '../../api/client';
import type { User } from '../../types/auth';

export function getCurrentUser() {
  return apiRequest<{ user: User }>('/auth/me');
}

export function login(input: { identifier: string; password: string }) {
  return apiRequest<{ user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export interface RegisterInput { name: string; email: string; phone: string; password: string; specialty: string; professionalLicense: string; specialtyLicense: string | null; clinicName: string | null; clinicPhone: string | null; clinicAddress: string | null }
export function registerSpecialist(input: RegisterInput) { return apiRequest<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }); }

export function logout() {
  return apiRequest<void>('/auth/logout', { method: 'POST' });
}
export function changePassword(input: { currentPassword: string; newPassword: string }) {
  return apiRequest<void>('/auth/change-password', { method: 'POST', body: JSON.stringify(input) });
}
