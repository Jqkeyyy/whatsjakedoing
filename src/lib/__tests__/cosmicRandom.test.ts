import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  randomBetween,
  randomDelayMs,
  randomArcPath,
  randomGlistenPosition,
} from '../cosmicRandom';

describe('randomBetween', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns min when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(randomBetween(10, 20)).toBe(10);
  });

  it('approaches max as Math.random approaches 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    expect(randomBetween(10, 20)).toBeCloseTo(20, 1);
  });
});

describe('randomDelayMs', () => {
  afterEach(() => vi.restoreAllMocks());

  it('rounds to the nearest millisecond within range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(randomDelayMs(1000, 2000)).toBe(1500);
  });
});

describe('randomArcPath', () => {
  afterEach(() => vi.restoreAllMocks());

  it('produces a well-formed SVG quadratic path string', () => {
    const path = randomArcPath(400, 300);
    expect(path).toMatch(/^M -?\d+ -?\d+ Q -?\d+ -?\d+ -?\d+ -?\d+$/);
  });

  it('starts near the top-left and ends near the bottom-right for the given bounds', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const path = randomArcPath(400, 300);
    expect(path).toBe('M 0 0 Q 120 0 240 120');
  });
});

describe('randomGlistenPosition', () => {
  it('returns top/left percentages within the 5-90 range', () => {
    const { top, left } = randomGlistenPosition();
    expect(top).toBeGreaterThanOrEqual(5);
    expect(top).toBeLessThanOrEqual(90);
    expect(left).toBeGreaterThanOrEqual(5);
    expect(left).toBeLessThanOrEqual(90);
  });
});
