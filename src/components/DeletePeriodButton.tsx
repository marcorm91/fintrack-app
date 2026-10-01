export function DeletePeriodButton({ label, disabled, onClick }: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="btn btn-danger h-11 w-11 shrink-0 p-0"
      aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
      </svg>
    </button>
  );
}
