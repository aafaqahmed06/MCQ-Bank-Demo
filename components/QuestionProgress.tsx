import { cn } from "@/components/ui";

export type QuestionDotState = "correct" | "incorrect" | "unanswered";

type QuestionProgressProps = {
  /** 1-indexed */
  current: number;
  total: number;
  /** Per-question outcome, length === total. */
  states: QuestionDotState[];
  /** Per-question bookmarked flag, length === total. */
  bookmarked?: boolean[];
};

const DOT_CLASS: Record<QuestionDotState, string> = {
  correct: "bg-success",
  incorrect: "bg-error",
  unanswered: "border border-border-default bg-surface-secondary",
};

/** `12 / 50  24%` plus a dot strip (§ MCQ interface "Question progress") —
 * more than a bare percentage: each dot encodes correct/incorrect/
 * unanswered, the current question is ringed, bookmarked ones get a mark. */
export default function QuestionProgress({
  current,
  total,
  states,
  bookmarked,
}: QuestionProgressProps) {
  const answeredCount = states.filter((s) => s !== "unanswered").length;
  const pct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div
      className="space-y-2"
      role="group"
      aria-label={`Question ${current} of ${total}, ${pct}% answered`}
    >
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span className="tabular-nums">
          {current} / {total}
        </span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="flex flex-wrap gap-1.5" aria-hidden="true">
        {states.map((state, i) => (
          <span
            key={i}
            className={cn(
              "relative h-2 w-2 rounded-full transition-colors duration-150",
              DOT_CLASS[state],
              i === current - 1 && "ring-2 ring-primary ring-offset-1 ring-offset-background"
            )}
          >
            {bookmarked?.[i] && (
              <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-warning" />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
