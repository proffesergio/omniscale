export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? 'brand-light' : ''}`}>
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M6 25V14L16 5l10 9v11H6Z"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="m7 24 9-9 9 9M16 5v10"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </svg>
      omni<span className="brand-weight">scale</span>
    </span>
  );
}
