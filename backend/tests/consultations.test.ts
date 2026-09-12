import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app';
import type { AppointmentServiceContract } from '../src/modules/appointments/appointment.service';
import type { AuthServiceContract, PublicUser } from '../src/modules/auth/auth.service';
import {
  ConsultationStatus,
  type Consultation,
} from '../src/modules/consultations/consultation.entity';
import type { ConsultationServiceContract } from '../src/modules/consultations/consultation.service';
import { AgeUnit } from '../src/modules/patients/patient.entity';
import type { PatientServiceContract } from '../src/modules/patients/patient.service';

const pediatrician: PublicUser = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Pediatra de prueba',
  email: 'pediatra@example.com',
  role: 'PEDIATRICIAN',
};
const patientId = '22222222-2222-4222-8222-222222222222';
const appointmentId = '33333333-3333-4333-8333-333333333333';
const consultation = {
  id: '44444444-4444-4444-8444-444444444444',
  patientId,
  pediatricianId: pediatrician.id,
  appointmentId: null,
  consultationDate: new Date(),
  patientAgeValue: 8,
  patientAgeUnit: AgeUnit.YEARS,
  reason: 'Seguimiento',
  currentIllness: null,
  physicalExamination: null,
  notes: null,
  laboratoryNotes: null,
  imagingNotes: null,
  status: ConsultationStatus.IN_PROGRESS,
  completedAt: null,
  diagnoses: [],
  treatments: [],
} as unknown as Consultation;

function authService(authenticated = true): AuthServiceContract {
  return {
    login: vi.fn(),
    authenticate: vi.fn().mockResolvedValue(authenticated ? pediatrician : null),
    logout: vi.fn(),
  };
}

function patientService(): PatientServiceContract {
  return { create: vi.fn(), list: vi.fn(), getById: vi.fn(), update: vi.fn() };
}

function appointmentService(): AppointmentServiceContract {
  return {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
    markNoShow: vi.fn(),
  };
}

function consultationService(): ConsultationServiceContract {
  return {
    createForPatient: vi.fn().mockResolvedValue(consultation),
    startFromAppointment: vi.fn().mockResolvedValue({
      ...consultation,
      appointmentId,
    }),
    listForPatient: vi.fn().mockResolvedValue({
      data: [consultation],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }),
    getById: vi.fn().mockResolvedValue(consultation),
    update: vi.fn().mockResolvedValue(consultation),
    complete: vi.fn().mockResolvedValue({
      ...consultation,
      status: ConsultationStatus.COMPLETED,
      completedAt: new Date(),
    }),
  };
}

function app(consultations: ConsultationServiceContract, authenticated = true) {
  return createApp(
    authService(authenticated),
    patientService(),
    appointmentService(),
    consultations,
  );
}

describe('consultation endpoints', () => {
  it('creates a direct consultation for an owned patient', async () => {
    const consultations = consultationService();
    const response = await request(app(consultations))
      .post(`/api/v1/patients/${patientId}/consultations`)
      .set('Cookie', 'pediachild_session=test-token')
      .send({
        reason: ' Seguimiento ',
        vitalSigns: { heartRateBpm: 90, temperatureC: 36.7 },
        anthropometricMeasurement: {
          weightKg: 24.5,
          lengthHeightCm: 122,
          measurementPosition: 'STANDING_HEIGHT',
          weightForAgePercentile: 50,
        },
        diagnoses: [{ description: 'Diagnóstico inicial' }],
        treatments: [{ description: 'Tratamiento inicial', frequency: 'Cada 8 horas' }],
      });

    expect(response.status).toBe(201);
    expect(response.body.consultation.id).toBe(consultation.id);
    expect(consultations.createForPatient).toHaveBeenCalledWith(
      pediatrician.id,
      patientId,
      expect.objectContaining({
        reason: 'Seguimiento',
        vitalSigns: expect.objectContaining({ heartRateBpm: 90 }),
        anthropometricMeasurement: expect.objectContaining({ weightForAgePercentile: 50 }),
      }),
    );
  });

  it('rejects invalid clinical measurements', async () => {
    const consultations = consultationService();
    const response = await request(app(consultations))
      .post(`/api/v1/patients/${patientId}/consultations`)
      .set('Cookie', 'pediachild_session=test-token')
      .send({
        reason: 'Consulta inválida',
        vitalSigns: { oxygenSaturationPercent: 120 },
        anthropometricMeasurement: { weightForAgePercentile: 42 },
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(consultations.createForPatient).not.toHaveBeenCalled();
  });

  it('requires measurement position when length or height is provided', async () => {
    const response = await request(app(consultationService()))
      .post(`/api/v1/patients/${patientId}/consultations`)
      .set('Cookie', 'pediachild_session=test-token')
      .send({ reason: 'Medición', anthropometricMeasurement: { lengthHeightCm: 80 } });

    expect(response.status).toBe(400);
    expect(
      response.body.error.fields['anthropometricMeasurement.measurementPosition'],
    ).toBeDefined();
  });

  it('lists the consultation history for a patient', async () => {
    const consultations = consultationService();
    const response = await request(app(consultations))
      .get(`/api/v1/patients/${patientId}/consultations?status=IN_PROGRESS`)
      .set('Cookie', 'pediachild_session=test-token');

    expect(response.status).toBe(200);
    expect(response.body.pagination.total).toBe(1);
    expect(consultations.listForPatient).toHaveBeenCalledWith(
      pediatrician.id,
      patientId,
      expect.objectContaining({ status: ConsultationStatus.IN_PROGRESS }),
    );
  });

  it('starts a consultation from an appointment', async () => {
    const consultations = consultationService();
    const response = await request(app(consultations))
      .post(`/api/v1/appointments/${appointmentId}/start-consultation`)
      .set('Cookie', 'pediachild_session=test-token');

    expect(response.status).toBe(201);
    expect(response.body.consultation.appointmentId).toBe(appointmentId);
    expect(consultations.startFromAppointment).toHaveBeenCalledWith(
      pediatrician.id,
      appointmentId,
    );
  });

  it('updates and completes a consultation', async () => {
    const consultations = consultationService();
    const updateResponse = await request(app(consultations))
      .patch(`/api/v1/consultations/${consultation.id}`)
      .set('Cookie', 'pediachild_session=test-token')
      .send({ notes: 'Nueva nota' });
    const completeResponse = await request(app(consultations))
      .post(`/api/v1/consultations/${consultation.id}/complete`)
      .set('Cookie', 'pediachild_session=test-token');

    expect(updateResponse.status).toBe(200);
    expect(completeResponse.status).toBe(200);
    expect(consultations.update).toHaveBeenCalledWith(pediatrician.id, consultation.id, {
      notes: 'Nueva nota',
    });
    expect(consultations.complete).toHaveBeenCalledWith(pediatrician.id, consultation.id);
  });

  it('protects consultation routes', async () => {
    const response = await request(app(consultationService(), false))
      .get(`/api/v1/consultations/${consultation.id}`)
      .set('Cookie', 'pediachild_session=invalid');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_SESSION');
  });
});
