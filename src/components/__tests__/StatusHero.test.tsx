import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusHero } from '../StatusHero';

describe('StatusHero', () => {
  it('shows the status label and a Free badge when not busy', () => {
    render(<StatusHero status={{ label: 'Reading', isBusy: false, source: 'default' }} />);
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('shows a Busy badge when the status is busy', () => {
    render(<StatusHero status={{ label: 'Client work', isBusy: true, source: 'event' }} />);
    expect(screen.getByText('Client work')).toBeInTheDocument();
    expect(screen.getByText('Busy')).toBeInTheDocument();
  });
});
