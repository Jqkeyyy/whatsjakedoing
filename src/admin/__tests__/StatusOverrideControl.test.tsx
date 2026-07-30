import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusOverrideControl } from '../StatusOverrideControl';
import * as adminApi from '../../lib/adminApi';
import type { StatusOverride } from '../../types';

beforeEach(() => {
  vi.restoreAllMocks();
});

// datetime-local inputs don't reliably support userEvent.type() keystroke
// simulation in jsdom — set the value directly via fireEvent.change instead.

describe('StatusOverrideControl — no active override', () => {
  it('sets a new override on submit', async () => {
    vi.spyOn(adminApi, 'setStatusOverride').mockResolvedValue({
      id: 'o1',
      isBusy: true,
      startsAt: '2026-07-29T15:00:00.000Z',
      endsAt: '2026-07-29T16:00:00.000Z',
    });
    const onChange = vi.fn();
    render(<StatusOverrideControl current={null} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText(/status text/i), 'Napping');
    fireEvent.change(screen.getByLabelText(/^until/i), { target: { value: '2026-07-29T11:00' } });
    await userEvent.click(screen.getByRole('button', { name: /set status/i }));

    expect(adminApi.setStatusOverride).toHaveBeenCalledWith(
      expect.objectContaining({ statusText: 'Napping', isBusy: true })
    );
    expect(onChange).toHaveBeenCalled();
  });
});

describe('StatusOverrideControl — active override', () => {
  const current: StatusOverride = {
    id: 'o1',
    statusText: 'Napping',
    isBusy: true,
    startsAt: '2026-07-29T15:00:00.000Z',
    endsAt: '2026-07-29T16:00:00.000Z',
  };

  it('shows a Clear button that removes the override', async () => {
    vi.spyOn(adminApi, 'clearStatusOverride').mockResolvedValue(undefined);
    const onChange = vi.fn();
    render(<StatusOverrideControl current={current} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(adminApi.clearStatusOverride).toHaveBeenCalledWith('o1');
    expect(onChange).toHaveBeenCalled();
  });
});
