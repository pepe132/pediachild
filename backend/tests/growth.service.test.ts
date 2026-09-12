import { describe, expect, it } from 'vitest';
import { correctedAgeDays, percentileFor } from '../src/modules/growth/growth.service';

describe('WHO growth calculations', () => {
  it('returns the WHO median as percentile 50 at birth', () => {
    expect(percentileFor('weight', 'male', 0, 3.3464)?.percentile).toBe(50);
    expect(percentileFor('height', 'female', 0, 49.1477)?.percentile).toBe(50);
    expect(percentileFor('head', 'female', 0, 33.8787)?.percentile).toBe(50);
  });
  it('corrects prematurity until two years', () => {
    expect(correctedAgeDays(100, 224)).toBe(44);
    expect(correctedAgeDays(730, 224)).toBe(730);
    expect(correctedAgeDays(100, 280)).toBe(100);
  });
  it('does not calculate outside the WHO 0-5 range', () => {
    expect(percentileFor('weight', 'female', 1900, 20)).toBeNull();
  });
});
