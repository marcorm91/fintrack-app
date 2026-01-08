import type { SortDirection } from '../types';

export function SortIndicator({
  active,
  direction
}: {
  active: boolean;
  direction: SortDirection;
}) {
  return (
    <span
      className={`inline-flex h-2.5 w-2.5 items-center justify-center ${active ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden="true"
    >
      {direction === 'asc' ? (
        <svg className="h-2.5 w-2.5" viewBox="0 0 16 16">
          <path d="M4 9l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg className="h-2.5 w-2.5" viewBox="0 0 16 16">
          <path d="M4 7l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}
