import { afterEach, describe, expect, it, vi } from 'vitest';
import { getClinicalHistory, saveClinicalHistory } from './clinical-histories.api';
import type { ClinicalHistoryInput } from '../../types/clinical-history';

afterEach(() => vi.unstubAllGlobals());

describe('clinical history API', () => {
  it('loads the history using the patient route and credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ clinicalHistory: null }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(getClinicalHistory('patient-1')).resolves.toEqual({ clinicalHistory: null });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/v1/patients/patient-1/clinical-history', expect.objectContaining({ credentials: 'include' }));
  });

  it('saves the complete history with PUT', async () => {
    const response = { clinicalHistory: { id: 'history-1' } };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const input = { immunizationStatus: 'COMPLETE' } as ClinicalHistoryInput;
    await expect(saveClinicalHistory('patient-1', input)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/v1/patients/patient-1/clinical-history', expect.objectContaining({ method: 'PUT', body: JSON.stringify(input), credentials: 'include' }));
  });
});
