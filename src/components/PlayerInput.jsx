import { useState } from 'react';
import { CATEGORIES, GENDERS } from '../utils/queueMatcher';
import GenderIcon from './GenderIcon';

export default function PlayerInput({ onAdd }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES.BEGINNERS);
  const [gender, setGender] = useState(GENDERS.MALE);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, category, gender });
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-medium text-slate-700">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value={CATEGORIES.BEGINNERS}>{CATEGORIES.BEGINNERS}</option>
          <option value={CATEGORIES.INTERMEDIATE}>{CATEGORIES.INTERMEDIATE}</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">Gender</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGender(GENDERS.MALE)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
              gender === GENDERS.MALE
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            aria-pressed={gender === GENDERS.MALE}
          >
            <GenderIcon gender={GENDERS.MALE} />
            Male
          </button>
          <button
            type="button"
            onClick={() => setGender(GENDERS.FEMALE)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
              gender === GENDERS.FEMALE
                ? 'border-rose-300 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            aria-pressed={gender === GENDERS.FEMALE}
          >
            <GenderIcon gender={GENDERS.FEMALE} />
            Female
          </button>
        </div>
      </div>
      <button
        type="submit"
        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        Add
      </button>
    </form>
  );
}
