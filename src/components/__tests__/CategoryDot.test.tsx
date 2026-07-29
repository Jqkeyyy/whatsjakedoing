import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryDot } from '../CategoryDot';

describe('CategoryDot', () => {
  it('renders a colored dot with the given color', () => {
    const { container } = render(<CategoryDot color="#9A3412" />);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toHaveStyle({ backgroundColor: '#9A3412' });
  });

  it('renders the label when provided', () => {
    render(<CategoryDot color="#9A3412" label="Work" />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });
});
