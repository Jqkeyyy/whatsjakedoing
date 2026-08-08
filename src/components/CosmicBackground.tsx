import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { randomArcPath, randomDelayMs, randomGlistenPosition } from '../lib/cosmicRandom';
import {
  SHOOTING_STAR_MIN_DELAY_MS,
  SHOOTING_STAR_MAX_DELAY_MS,
  SHOOTING_STAR_VISIBLE_MS,
  GLISTEN_MIN_DELAY_MS,
  GLISTEN_MAX_DELAY_MS,
  GLISTEN_VISIBLE_MS,
} from '../lib/cosmicConfig';

interface ShootingStarState {
  key: number;
  path: string;
}

interface GlistenState {
  key: number;
  top: number;
  left: number;
}

export function CosmicBackground() {
  const reducedMotion = usePrefersReducedMotion();
  const [shootingStar, setShootingStar] = useState<ShootingStarState | null>(null);
  const [glisten, setGlisten] = useState<GlistenState | null>(null);
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

  useEffect(() => {
    if (reducedMotion) return;

    let launchTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;

    function scheduleGlisten() {
      const delay = randomDelayMs(GLISTEN_MIN_DELAY_MS, GLISTEN_MAX_DELAY_MS);
      launchTimer = setTimeout(() => {
        nextKey.current += 1;
        setGlisten({ key: nextKey.current, ...randomGlistenPosition() });
        clearTimer = setTimeout(() => setGlisten(null), GLISTEN_VISIBLE_MS);
        scheduleGlisten();
      }, delay);
    }

    scheduleGlisten();
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
      {glisten && (
        <span
          key={glisten.key}
          data-testid="cosmic-glisten"
          className="cosmic-glisten"
          style={{ top: `${glisten.top}%`, left: `${glisten.left}%` }}
        >
          <span className="cosmic-glisten-core" />
        </span>
      )}
    </div>
  );
}
