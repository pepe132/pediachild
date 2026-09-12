import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app';
import type { AuthServiceContract, PublicUser } from '../src/modules/auth/auth.service';
import { AgeUnit, PatientSex, type Patient } from '../src/modules/patients/patient.entity';
import type { PatientServiceContract } from '../src/modules/patients/patient.service';

const pediatrician: PublicUser = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Pediatra de prueba',
  email: 'pediatra@example.com',
  role: 'PEDIATRICIAN',
};

const patient = {
  id: '22222222-2222-4222-8222-222222222222',
  pediatricianId: pediatrician.id,
  firstName: 'Ana',
  lastName: 'López',
  ageValue: 8,
  ageUnit: AgeUnit.YEARS,
  dateOfBirth: null,
  sex: null,
  active: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
} as Patient;

function authService(authenticated = true): AuthServiceContract {
  return {
    login: vi.fn(),
    authenticate: vi.fn().mockResolvedValue(authenticated ? pediatrician : null),
    logout: vi.fn(),
  };
}

function patientService(): PatientServiceContract {
  return {
    create: vi.fn().mockResolvedValue(patient),
    list: vi.fn().mockResolvedValue({
      data: [patient],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }),
    getById: vi.fn().mockResolvedValue(patient),
    update: vi.fn().mockResolvedValue(patient),
  };
}

describe('patient endpoints', () => {
  it('creates a patient owned by the authenticated pediatrician', async () => {
    const patients = patientService();
    const response = await request(createApp(authService(), patients))
      .post('/api/v1/patients')
      .set('Cookie', 'pediachild_session=test-token')
      .send({
        firstName: ' Ana ',
        lastName: ' López ',
        ageValue: 8,
        ageUnit: 'YEARS',
        dateOfBirth: '2018-01-01',
        sex: 'FEMALE',
      });

    expect(response.status).toBe(201);
    expect(response.body.patient.id).toBe(patient.id);
    expect(patients.create).toHaveBeenCalledWith(pediatrician.id, {
      firstName: 'Ana',
      lastName: 'López',
      ageValue: 8,
      ageUnit: AgeUnit.YEARS,
      dateOfBirth: '2018-01-01',
      sex: PatientSex.FEMALE,
    });
  });

  it('lists patients with pagination and normalized filters', async () => {
    const patients = patientService();
    const response = await request(createApp(authService(), patients))
      .get('/api/v1/patients?search=Ana&page=1&limit=20&sort=name&order=asc')
      .set('Cookie', 'pediachild_session=test-token');

    expect(response.status).toBe(200);
    expect(response.body.pagination.total).toBe(1);
    expect(patients.list).toHaveBeenCalledWith(
      pediatrician.id,
      expect.objectContaining({ search: 'Ana', page: 1, limit: 20, active: true }),
    );
  });

  it('rejects a future birth date', async () => {
    const response = await request(createApp(authService(), patientService()))
      .post('/api/v1/patients')
      .set('Cookie', 'pediachild_session=test-token')
      .send({
        firstName: 'Ana',
        lastName: 'López',
        ageValue: 8,
        ageUnit: 'YEARS',
        dateOfBirth: '2999-01-01',
        sex: 'FEMALE',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication for every patient route', async () => {
    const response = await request(createApp(authService(false), patientService()))
      .get('/api/v1/patients')
      .set('Cookie', 'pediachild_session=invalid');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_SESSION');
  });
});
