import { apiRequest } from '../../api/client';

export type GrowthIndicator = 'weight' | 'height' | 'head';
export interface GrowthPoint { ageDays: number; value: number }
export interface GrowthResponse {
  available: boolean;
  missing: string[];
  source?: string;
  gestationalAgeDays?: number | null;
  observations: Array<{
    consultationId: string; measuredAt: string; chronologicalDays: number; correctedAgeDays: number; ageCorrected: boolean;
    values: Record<GrowthIndicator, number | null>;
    percentiles: Record<GrowthIndicator, { zScore: number; percentile: number } | null>;
  }>;
  charts: Array<{ indicator: GrowthIndicator; unit: string; curves: Array<{ percentile: number; points: GrowthPoint[] }> }>;
}
export const getPatientGrowth = (patientId: string) => apiRequest<GrowthResponse>(`/patients/${patientId}/growth`);
