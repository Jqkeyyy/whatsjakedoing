import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CosmicBackground } from '../CosmicBackground';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

vi.mock('../../hooks/usePrefersReducedMotion');

describe('CosmicBackground', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the starfield and sun layers', () => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
    render(<CosmicBackground />);
    expect(screen.getByTestId('cosmic-background')).toBeInTheDocument();
    expect(screen.getByTestId('cosmic-starfield')).toBeInTheDocument();
    expect(screen.getByTestId('cosmic-sun')).toBeInTheDocument();
  });

  it('does not render a shooting star on initial mount', () => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
    render(<CosmicBackground />);
    expect(screen.queryByTestId('cosmic-shooting-star')).not.toBeInTheDocument();
  });

  it('launches a shooting star once the random delay elapses', () => {
    vi.useFakeTimers();
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
    vi.spyOn(Math, 'random').mockReturnValue(0); // shortest possible delay

    render(<CosmicBackground />);
    expect(screen.queryByTestId('cosmic-shooting-star')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3 * 60_000);
    });
    expect(screen.getByTestId('cosmic-shooting-star')).toBeInTheDocument();
  });

  it('never launches a shooting star when reduced motion is on', () => {
    vi.useFakeTimers();
    vi.mocked(usePrefersReducedMotion).mockReturnValue(true);

    render(<CosmicBackground />);
    act(() => {
      vi.advanceTimersByTime(60 * 60_000);
    });
    expect(screen.queryByTestId('cosmic-shooting-star')).not.toBeInTheDocument();
  });

  it('does not render a glisten sparkle on initial mount', () => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
    render(<CosmicBackground />);
    expect(screen.queryByTestId('cosmic-glisten')).not.toBeInTheDocument();
  });

  it('shows a glisten sparkle once its random delay elapses', () => {
    vi.useFakeTimers();
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    render(<CosmicBackground />);
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(screen.getByTestId('cosmic-glisten')).toBeInTheDocument();
  });

  it('never shows a glisten sparkle when reduced motion is on', () => {
    vi.useFakeTimers();
    vi.mocked(usePrefersReducedMotion).mockReturnValue(true);

    render(<CosmicBackground />);
    act(() => {
      vi.advanceTimersByTime(5 * 60_000);
    });
    expect(screen.queryByTestId('cosmic-glisten')).not.toBeInTheDocument();
  });
});
