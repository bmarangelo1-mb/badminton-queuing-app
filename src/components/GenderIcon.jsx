import { GENDERS } from '../utils/queueMatcher';

export default function GenderIcon({ gender, className = '', title }) {
  const isMale = gender === GENDERS.MALE;
  const label = isMale ? 'Male' : 'Female';
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
        isMale ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
      } ${className}`}
      aria-label={label}
      title={title || label}
    >
      {isMale ? '♂' : '♀'}
    </span>
  );
}
