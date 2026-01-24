import { useState } from 'react';
import { CATEGORIES } from '../utils/queueMatcher';

export default function PlayerInput({ onAdd }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES.BEGINNERS);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, category });
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-gray-600">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          className="rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium text-gray-600">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        >
          <option value={CATEGORIES.BEGINNERS}>{CATEGORIES.BEGINNERS}</option>
          <option value={CATEGORIES.INTERMEDIATE}>{CATEGORIES.INTERMEDIATE}</option>
        </select>
      </div>
      <button
        type="submit"
        className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        Add
      </button>
    </form>
  );
}
