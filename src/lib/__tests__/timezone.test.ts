import { describe, it, expect } from 'vitest';
import { chicagoWallTimeToUtcIso, utcIsoToChicagoWallTime } from '../timezone';

describe('chicagoWallTimeToUtcIso', () => {
  it('converts a winter (CST, UTC-6) wall time to UTC', () => {
    // Jan 15 2026, 09:00 America/Chicago == 15:00 UTC
    expect(chicagoWallTimeToUtcIso('2026-01-15T09:00')).toBe('2026-01-15T15:00:00.000Z');
  });

  it('converts a summer (CDT, UTC-5) wall time to UTC', () => {
    // Jul 15 2026, 09:00 America/Chicago == 14:00 UTC
    expect(chicagoWallTimeToUtcIso('2026-07-15T09:00')).toBe('2026-07-15T14:00:00.000Z');
  });
});

describe('utcIsoToChicagoWallTime', () => {
  it('converts a winter UTC instant back to Chicago wall time', () => {
    expect(utcIsoToChicagoWallTime('2026-01-15T15:00:00.000Z')).toBe('2026-01-15T09:00');
  });

  it('converts a summer UTC instant back to Chicago wall time', () => {
    expect(utcIsoToChicagoWallTime('2026-07-15T14:00:00.000Z')).toBe('2026-07-15T09:00');
  });

  it('round-trips through both conversions', () => {
    const original = '2026-03-10T18:30';
    const roundTripped = utcIsoToChicagoWallTime(chicagoWallTimeToUtcIso(original));
    expect(roundTripped).toBe(original);
  });
});
