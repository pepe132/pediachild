import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { Patient } from '../src/modules/patients/patient.entity';
import { PatientService } from '../src/modules/patients/patient.service';

describe('PatientService ownership', () => {
  it('always includes the pediatrician id when retrieving a patient', async () => {
    const repository = {
      findOneBy: vi.fn().mockResolvedValue(null),
    } as unknown as Repository<Patient>;
    const service = new PatientService(repository);

    await expect(
      service.getById(
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
      ),
    ).rejects.toEqual(expect.objectContaining({
      statusCode: 404,
      code: 'PATIENT_NOT_FOUND',
    }));

    expect(repository.findOneBy).toHaveBeenCalledWith({
      id: '22222222-2222-4222-8222-222222222222',
      pediatricianId: '11111111-1111-4111-8111-111111111111',
    });
  });
});
