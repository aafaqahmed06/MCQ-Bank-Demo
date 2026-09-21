import { cn } from "@/components/ui";

type ExamNavigatorProps = {
  total: number;
  current: number;
  answers: (number | null)[];
  onJump: (index: number) => void;
};

/** Jump navigation grid (§ Exam mode — "question navigator: jump
 * navigation, answered/unanswered status"). No correct/incorrect states
 * here — the exam is ungraded until submission. */
export default function ExamNavigator({ total, current, answers, onJump }: ExamNavigatorProps) {
  return (
    <div
      className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-5"
      role="group"
      aria-label="Question navigator"
    >
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === current;
        const isAnswered = answers[i] !== null;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            aria-current={isCurrent ? "step" : undefined}
            aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ", unanswered"}`}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-control text-caption font-semibold tabular-nums transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              isCurrent
                ? "bg-primary text-white"
                : isAnswered
                  ? "border border-primary/40 bg-primary/10 text-primary hover:border-primary/60"
                  : "border border-border-default bg-surface text-text-tertiary hover:border-primary/40 hover:text-text-primary"
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
