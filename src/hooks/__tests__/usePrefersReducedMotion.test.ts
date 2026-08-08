import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrefersReducedMotion } from '../usePrefersReducedMotion';

function mockMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = [];
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_event: string, cb: () => void) => listeners.push(cb),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;
  vi.spyOn(window, 'matchMedia').mockReturnValue(mql);
  return { mql, trigger: () => listeners.forEach((cb) => cb()) };
}

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when the user has not requested reduced motion', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when the user has requested reduced motion', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when the media query change fires', () => {
    const { mql, trigger } = mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    (mql as { matches: boolean }).matches = true;
    act(() => {
      trigger();
    });
    expect(result.current).toBe(true);
  });
});
