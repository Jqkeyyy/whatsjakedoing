import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import * as adminApi from '../../lib/adminApi';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('LoginForm', () => {
  it('calls onSuccess after a successful login', async () => {
    vi.spyOn(adminApi, 'login').mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/password/i), 'hunter2');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(adminApi.login).toHaveBeenCalledWith('hunter2');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows an error message and does not call onSuccess on failure', async () => {
    vi.spyOn(adminApi, 'login').mockRejectedValue(new Error('Invalid password'));
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Invalid password')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
