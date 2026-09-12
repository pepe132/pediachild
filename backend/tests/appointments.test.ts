import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app';
import type { AuthServiceContract, PublicUser } from '../src/modules/auth/auth.service';
import {
  AppointmentStatus,
  type Appointment,
} from '../src/modules/appointments/appointment.entity';
import type { AppointmentServiceContract } from '../src/modules/appointments/appointment.service';
import type { Patient } from '../src/modules/patients/patient.entity';
import type { PatientServiceContract } from '../src/modules/patients/patient.service';

const pediatrician: PublicUser = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Pediatra de prueba',
  email: 'pediatra@example.com',
  role: 'PEDIATRICIAN',
};

const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
const appointment = {
  id: '33333333-3333-4333-8333-333333333333',
  patientId: '22222222-2222-4222-8222-222222222222',
  pediatricianId: pediatrician.id,
  scheduledAt,
  durationMinutes: 30,
  endsAt: new Date(scheduledAt.getTime() + 30 * 60 * 1000),
  reason: 'Consulta de seguimiento',
  notes: null,
  status: AppointmentStatus.SCHEDULED,
  createdAt: new Date(),
  updatedAt: new Date(),
} as Appointment;

function authService(): AuthServiceContract {
  return {
    login: vi.fn(),
    authenticate: vi.fn().mockResolvedValue(pediatrician),
    logout: vi.fn(),
  };
}

function patientService(): PatientServiceContract {
  return {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  };
}

function appointmentService(): AppointmentServiceContract {
  return {
    create: vi.fn().mockResolvedValue(appointment),
    list: vi.fn().mockResolvedValue({
      data: [appointment],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    }),
    getById: vi.fn().mockResolvedValue(appointment),
    update: vi.fn().mockResolvedValue(appointment),
    confirm: vi.fn().mockResolvedValue({ ...appointment, status: AppointmentStatus.CONFIRMED }),
    cancel: vi.fn().mockResolvedValue({ ...appointment, status: AppointmentStatus.CANCELLED }),
    markNoShow: vi.fn().mockResolvedValue({ ...appointment, status: AppointmentStatus.NO_SHOW }),
  };
}

describe('appointment endpoints', () => {
  it('creates an appointment for the authenticated pediatrician', async () => {
    const appointments = appointmentService();
    const response = await request(createApp(authService(), patientService(), appointments))
      .post('/api/v1/appointments')
      .set('Cookie', 'pediachild_session=test-token')
      .send({
        patientId: appointment.patientId,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: 30,
        reason: ' Consulta de seguimiento ',
      });

    expect(response.status).toBe(201);
    expect(response.body.appointment.id).toBe(appointment.id);
    expect(appointments.create).toHaveBeenCalledWith(
      pediatrician.id,
      expect.objectContaining({
        patientId: appointment.patientId,
        reason: 'Consulta de seguimiento',
      }),
    );
  });

  it('lists the agenda by date and status', async () => {
    const appointments = appointmentService();
    const from = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const to = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const response = await request(createApp(authService(), patientService(), appointments))
      .get(`/api/v1/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&status=SCHEDULED`)
      .set('Cookie', 'pediachild_session=test-token');

    expect(response.status).toBe(200);
    expect(response.body.pagination.total).toBe(1);
    expect(appointments.list).toHaveBeenCalledWith(
      pediatrician.id,
      expect.objectContaining({ from, to, status: AppointmentStatus.SCHEDULED }),
    );
  });

  it.each([
    ['confirm', 'confirm'],
    ['cancel', 'cancel'],
    ['no-show', 'markNoShow'],
  ] as const)('supports the %s action', async (path, method) => {
    const appointments = appointmentService();
    const response = await request(createApp(authService(), patientService(), appointments))
      .post(`/api/v1/appointments/${appointment.id}/${path}`)
      .set('Cookie', 'pediachild_session=test-token');

    expect(response.status).toBe(200);
    expect(appointments[method]).toHaveBeenCalledWith(pediatrician.id, appointment.id);
  });

  it('rejects appointments scheduled in the past', async () => {
    const response = await request(
      createApp(authService(), patientService(), appointmentService()),
    )
      .post('/api/v1/appointments')
      .set('Cookie', 'pediachild_session=test-token')
      .send({
        patientId: appointment.patientId,
        scheduledAt: '2020-01-01T12:00:00.000Z',
        durationMinutes: 30,
        reason: 'Consulta',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
