import { apiRequest } from '../../api/client';
import type { ClinicalHistory, ClinicalHistoryInput } from '../../types/clinical-history';

export function getClinicalHistory(patientId: string) {
  return apiRequest<{ clinicalHistory: ClinicalHistory | null }>(`/patients/${patientId}/clinical-history`);
}

export function saveClinicalHistory(patientId: string, input: ClinicalHistoryInput) {
  return apiRequest<{ clinicalHistory: ClinicalHistory }>(`/patients/${patientId}/clinical-history`, {
    method: 'PUT', body: JSON.stringify(input),
  });
}
