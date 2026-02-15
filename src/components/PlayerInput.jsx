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
        <label htmlFor="name" className="text-sm font-semibold text-[color:var(--muted)]">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          className="field"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-semibold text-[color:var(--muted)]">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="field field-select"
        >
          <option value={CATEGORIES.BEGINNERS}>{CATEGORIES.BEGINNERS}</option>
          <option value={CATEGORIES.INTERMEDIATE}>{CATEGORIES.INTERMEDIATE}</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-[color:var(--muted)]">Gender</span>
        <div className="segmented">
          <button
            type="button"
            onClick={() => setGender(GENDERS.MALE)}
            className={`segment inline-flex items-center gap-2 ${gender === GENDERS.MALE ? 'segment-active' : ''}`}
            aria-pressed={gender === GENDERS.MALE}
          >
            <GenderIcon gender={GENDERS.MALE} />
            Male
          </button>
          <button
            type="button"
            onClick={() => setGender(GENDERS.FEMALE)}
            className={`segment inline-flex items-center gap-2 ${gender === GENDERS.FEMALE ? 'segment-active' : ''}`}
            aria-pressed={gender === GENDERS.FEMALE}
          >
            <GenderIcon gender={GENDERS.FEMALE} />
            Female
          </button>
        </div>
      </div>
      <button
        type="submit"
        className="btn btn-primary"
      >
        Add
      </button>
    </form>
  );
}
