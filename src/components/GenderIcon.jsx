import { GENDERS } from '../utils/queueMatcher';

export default function GenderIcon({ gender, className = '', title }) {
  const isMale = gender === GENDERS.MALE;
  const label = isMale ? 'Male' : 'Female';
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-sm font-extrabold shadow-sm ${
        isMale
          ? 'border-[rgba(34,211,238,0.35)] bg-[rgba(34,211,238,0.18)] text-white'
          : 'border-[rgba(251,113,133,0.35)] bg-[rgba(251,113,133,0.18)] text-white'
      } ${className}`}
      aria-label={label}
      title={title || label}
    >
      {isMale ? '♂' : '♀'}
    </span>
  );
}
