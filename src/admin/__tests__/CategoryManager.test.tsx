import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryManager } from '../CategoryManager';
import * as adminApi from '../../lib/adminApi';
import type { Category } from '../../types';

const categories: Category[] = [
  { id: 'c1', name: 'Work', color: '#9A3412', isBusy: true },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('CategoryManager', () => {
  it('lists existing categories', () => {
    render(<CategoryManager categories={categories} onChange={vi.fn()} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('creates a new category and calls onChange', async () => {
    vi.spyOn(adminApi, 'createCategory').mockResolvedValue({
      id: 'c2',
      name: 'Free time',
      color: '#059669',
      isBusy: false,
    });
    const onChange = vi.fn();
    render(<CategoryManager categories={categories} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText(/name/i), 'Free time');
    await userEvent.type(screen.getByLabelText(/color/i), '#059669');
    await userEvent.click(screen.getByRole('button', { name: /add category/i }));

    expect(adminApi.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Free time', color: '#059669' })
    );
    expect(onChange).toHaveBeenCalled();
  });

  it('deletes a category and calls onChange', async () => {
    vi.spyOn(adminApi, 'deleteCategory').mockResolvedValue(undefined);
    const onChange = vi.fn();
    render(<CategoryManager categories={categories} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /delete work/i }));

    expect(adminApi.deleteCategory).toHaveBeenCalledWith('c1');
    expect(onChange).toHaveBeenCalled();
  });
});
