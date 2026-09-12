import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import type { AuthServiceContract, PublicUser } from '../src/modules/auth/auth.service';
import type { ClinicalHistoryServiceContract } from '../src/modules/clinical-histories/clinical-history.service';

const pediatrician: PublicUser = { id: '11111111-1111-4111-8111-111111111111', name: 'Pediatra', email: 'pediatra@example.com', role: 'PEDIATRICIAN' };
const patientId = '22222222-2222-4222-8222-222222222222';
const auth = (valid = true): AuthServiceContract => ({ login: vi.fn(), logout: vi.fn(), authenticate: vi.fn().mockResolvedValue(valid ? pediatrician : null) });
const service = (): ClinicalHistoryServiceContract => ({ get: vi.fn().mockResolvedValue(null), put: vi.fn().mockImplementation(async (_owner, id, input) => ({ id: '33333333-3333-4333-8333-333333333333', patientId: id, ...input })) });

describe('clinical history endpoints', () => {
  it('returns null when an owned patient has no clinical history', async () => {
    const histories = service();
    const response = await request(createApp(auth(), undefined, undefined, undefined, histories))
      .get(`/api/v1/patients/${patientId}/clinical-history`).set('Cookie', 'pediachild_session=test');
    expect(response.status).toBe(200);
    expect(response.body.clinicalHistory).toBeNull();
    expect(histories.get).toHaveBeenCalledWith(pediatrician.id, patientId);
  });

  it('validates and replaces a complete clinical history', async () => {
    const histories = service();
    const response = await request(createApp(auth(), undefined, undefined, undefined, histories))
      .put(`/api/v1/patients/${patientId}/clinical-history`).set('Cookie', 'pediachild_session=test')
      .send({
        informantName: 'Madre', neurodevelopmentNotes: 'Camina', ediResultNotes: 'Desarrollo normal', immunizationStatus: 'INCOMPLETE', missingVaccines: 'Influenza',
        familyMembers: [{ relationship: 'MOTHER', age: 29 }],
        nonPathologicalHistory: { bristolType: 4 },
        nutritionHistory: { mealsPerDay: 4 },
        foodFrequencies: [{ foodType: 'FRUITS', daysPerWeek: 7 }],
        perinatalHistory: { gestationalAgeWeeks: 39, gestationalAgeDays: 2, birthRoute: 'VAGINAL', apgar: '8/9', ophthalmologicalScreeningNotes: 'Normal', hipScreeningNotes: 'Normal' },
        pathologicalHistoryItems: [{ category: 'ALLERGY', status: 'DENIED' }],
      });
    expect(response.status).toBe(200);
    expect(histories.put).toHaveBeenCalledWith(pediatrician.id, patientId, expect.objectContaining({ immunizationStatus: 'INCOMPLETE' }));
  });

  it('requires missing vaccines and descriptions for present conditions', async () => {
    const histories = service();
    const response = await request(createApp(auth(), undefined, undefined, undefined, histories))
      .put(`/api/v1/patients/${patientId}/clinical-history`).set('Cookie', 'pediachild_session=test')
      .send({ immunizationStatus: 'INCOMPLETE', pathologicalHistoryItems: [{ category: 'ALLERGY', status: 'PRESENT' }] });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(histories.put).not.toHaveBeenCalled();
  });

  it('protects the clinical history', async () => {
    const response = await request(createApp(auth(false), undefined, undefined, undefined, service()))
      .get(`/api/v1/patients/${patientId}/clinical-history`).set('Cookie', 'pediachild_session=invalid');
    expect(response.status).toBe(401);
  });
});
