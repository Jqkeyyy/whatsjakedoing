import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders the status hero and hub links', () => {
    render(<App />);
    expect(screen.getByText('Right now')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });
});
