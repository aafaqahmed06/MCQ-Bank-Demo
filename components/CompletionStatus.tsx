import { CheckCircle2 } from "lucide-react";
import { Badge, Icon } from "@/components/ui";

type CompletionStatusProps = {
  completed: number;
  total: number;
};

/**
 * Shows practice progress for a topic group / subject / block.
 * - fully completed  -> success "Completed" badge
 * - partially done   -> small progress ring with completed/total
 * - not started      -> nothing
 */
export default function CompletionStatus({ completed, total }: CompletionStatusProps) {
  if (total <= 0) return null;

  if (completed >= total) {
    return (
      <Badge variant="success" size="sm">
        <Icon icon={CheckCircle2} size="xs" />
        Completed
      </Badge>
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
            stroke="var(--border-default)"
            strokeWidth="2.5"
          />
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            transform="rotate(-90 12 12)"
          />
        </svg>
        <span className="text-caption font-medium tabular-nums text-text-tertiary">
          {completed}/{total}
        </span>
      </div>
    );
  }

  return null;
}
