import { useState } from 'react';
import type { Category } from '../types';
import { createCategory, deleteCategory } from '../lib/adminApi';
import { CategoryDot } from '../components/CategoryDot';

interface CategoryManagerProps {
  categories: Category[];
  onChange: () => void;
}

export function CategoryManager({ categories, onChange }: CategoryManagerProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [isBusy, setIsBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createCategory({ name, color, isBusy });
      setName('');
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteCategory(id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }

  return (
    <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-offset">
      <h2 className="font-display text-lg text-ink">Categories</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between">
            <CategoryDot color={category.color} label={category.name} />
            <button
              type="button"
              onClick={() => handleDelete(category.id)}
              aria-label={`Delete ${category.name}`}
              className="text-xs font-semibold text-terracotta"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2">
        <label htmlFor="category-name" className="text-sm font-semibold text-ink">
          Name
        </label>
        <input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border-2 border-ink px-2 py-1"
        />
        <label htmlFor="category-color" className="text-sm font-semibold text-ink">
          Color
        </label>
        <input
          id="category-color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="rounded-lg border-2 border-ink px-2 py-1"
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={isBusy} onChange={(e) => setIsBusy(e.target.checked)} />
          Counts as busy
        </label>
        {error && <p className="text-sm text-terracotta">{error}</p>}
        <button
          type="submit"
          className="rounded-full border-2 border-ink bg-terracotta px-3 py-1.5 font-semibold text-white"
        >
          Add category
        </button>
      </form>
    </div>
  );
}
