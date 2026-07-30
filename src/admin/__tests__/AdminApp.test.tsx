// src/admin/__tests__/AdminApp.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminApp } from '../AdminApp';
import * as adminApi from '../../lib/adminApi';
import * as useAdminDataModule from '../../hooks/useAdminData';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(useAdminDataModule, 'useAdminData').mockReturnValue({
    categories: [],
    events: [],
    statusOverride: null,
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe('AdminApp', () => {
  it('shows the login form when there is no valid session', async () => {
    vi.spyOn(adminApi, 'checkSession').mockResolvedValue(false);
    render(<AdminApp />);
    expect(await screen.findByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows the admin shell when the session is valid', async () => {
    vi.spyOn(adminApi, 'checkSession').mockResolvedValue(true);
    render(<AdminApp />);
    expect(await screen.findByRole('button', { name: /log out/i })).toBeInTheDocument();
    expect(screen.getByText('Right now')).toBeInTheDocument();
  });
});
