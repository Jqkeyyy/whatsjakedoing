import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { randomArcPath, randomDelayMs } from '../lib/cosmicRandom';
import {
  SHOOTING_STAR_MIN_DELAY_MS,
  SHOOTING_STAR_MAX_DELAY_MS,
  SHOOTING_STAR_VISIBLE_MS,
} from '../lib/cosmicConfig';

interface ShootingStarState {
  key: number;
  path: string;
}

export function CosmicBackground() {
  const reducedMotion = usePrefersReducedMotion();
  const [shootingStar, setShootingStar] = useState<ShootingStarState | null>(null);
  const nextKey = useRef(0);

  useEffect(() => {
    if (reducedMotion) return;

    let launchTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;

    function scheduleLaunch() {
      const delay = randomDelayMs(SHOOTING_STAR_MIN_DELAY_MS, SHOOTING_STAR_MAX_DELAY_MS);
      launchTimer = setTimeout(() => {
        nextKey.current += 1;
        setShootingStar({
          key: nextKey.current,
          path: randomArcPath(window.innerWidth, window.innerHeight),
        });
        clearTimer = setTimeout(() => setShootingStar(null), SHOOTING_STAR_VISIBLE_MS);
        scheduleLaunch();
      }, delay);
    }

    scheduleLaunch();
    return () => {
      clearTimeout(launchTimer);
      clearTimeout(clearTimer);
    };
  }, [reducedMotion]);

  return (
    <div
      data-testid="cosmic-background"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void"
      aria-hidden="true"
    >
      <div data-testid="cosmic-starfield" className="cosmic-starfield" />
      <div data-testid="cosmic-sun" className="cosmic-sun" />
      {shootingStar && (
        <span
          key={shootingStar.key}
          data-testid="cosmic-shooting-star"
          className="cosmic-shooting-star"
          style={{ offsetPath: `path('${shootingStar.path}')` } as unknown as React.CSSProperties}
        />
      )}
    </div>
  );
}
