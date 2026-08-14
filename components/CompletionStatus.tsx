type CompletionStatusProps = {
  completed: number;
  total: number;
};

/**
 * Shows practice progress for a topic group / subject / block.
 * - fully completed  -> teal "✓ Completed" chip (option A)
 * - partially done   -> small progress ring with completed/total (option B)
 * - not started      -> nothing
 */
export default function CompletionStatus({ completed, total }: CompletionStatusProps) {
  if (total <= 0) return null;

  if (completed >= total) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-cyan)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-cyan-strong)]">
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
          <path
            d="M3 8.5 6.5 12 13 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Completed
      </span>
    );
  }

  if (completed > 0) {
    const radius = 9;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(100, (completed / total) * 100);
    return (
      <div
        className="flex items-center gap-1.5"
        title={`${completed} of ${total} topics done`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="2.5"
          />
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            transform="rotate(-90 12 12)"
          />
        </svg>
        <span className="text-xs font-medium tabular-nums text-[var(--text-muted)]">
          {completed}/{total}
        </span>
      </div>
    );
  }

  return null;
}
