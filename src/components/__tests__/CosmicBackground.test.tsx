import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CosmicBackground } from '../CosmicBackground';

describe('CosmicBackground', () => {
  it('renders the starfield and sun layers', () => {
    render(<CosmicBackground />);
    expect(screen.getByTestId('cosmic-background')).toBeInTheDocument();
    expect(screen.getByTestId('cosmic-starfield')).toBeInTheDocument();
    expect(screen.getByTestId('cosmic-sun')).toBeInTheDocument();
  });

  it('does not render a shooting star or glisten on initial mount', () => {
    render(<CosmicBackground />);
    expect(screen.queryByTestId('cosmic-shooting-star')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cosmic-glisten')).not.toBeInTheDocument();
  });
});
