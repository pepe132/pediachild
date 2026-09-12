import type { AgeUnit } from '../types/patient';

const ageLabels: Record<AgeUnit, [string, string]> = {
  DAYS: ['día', 'días'],
  MONTHS: ['mes', 'meses'],
  YEARS: ['año', 'años'],
};

export function formatPatientAge(value: number, unit: AgeUnit) {
  const labels = ageLabels[unit];
  return `${value} ${value === 1 ? labels[0] : labels[1]}`;
}
