import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import type { HubLink } from '../../types';

const hubLinks: HubLink[] = [
  { id: 'link-portfolio', label: 'Portfolio', url: 'https://example.com/portfolio' },
];

describe('Sidebar', () => {
  it('renders the bio and hub links', () => {
    render(<Sidebar bio="Building things." hubLinks={hubLinks} />);
    expect(screen.getByText('Building things.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute(
      'href',
      'https://example.com/portfolio'
    );
  });
});
