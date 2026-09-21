import type { Module } from "@/types";
import { getTopicHealthState, type TopicHealthState } from "@/lib/weakness";
import { TOPIC_HEALTH_ICON } from "@/components/TopicHealthBadge";
import { Button, Icon } from "@/components/ui";
import { Progress, type ProgressVariant } from "@/components/ui/Progress";

// Literal classes (not interpolated) so Tailwind's build-time scan finds them.
const STATE_ICON_CLASS: Record<TopicHealthState, string> = {
  mastered: "text-success",
  strong: "text-primary",
  developing: "text-info",
  "needs-review": "text-warning",
  unattempted: "text-text-tertiary",
};

const STATE_PROGRESS_VARIANT: Record<TopicHealthState, ProgressVariant> = {
  mastered: "success",
  strong: "default",
  developing: "info",
  "needs-review": "warning",
  unattempted: "default",
};

/**
 * "Your Topic Health" (.claude/rules/ui-upgrade-plan.md, Curriculum §Topic
 * Health) — per-subject mastery, distinct from the dashboard's per-subject
 * *completion* row. Only lists subjects with at least one practice attempt;
 * an unattempted subject has no accuracy to show here.
 */
export function TopicHealthOverview({ subjects }: { subjects: Module[] }) {
  const attempted = subjects.filter((s) => s.accuracy !== null);
  if (attempted.length === 0) return null;

  const needsReviewCount = attempted.filter(
    (s) => getTopicHealthState(s.accuracy ?? null, s.questionsAttempted ?? 0) === "needs-review"
  ).length;

  return (
    <section className="space-y-3">
      <h2 className="text-caption font-semibold tracking-wide text-text-tertiary uppercase">
        Your topic health
      </h2>
      <div className="space-y-3">
        {attempted.map((s) => {
          const state = getTopicHealthState(s.accuracy ?? null, s.questionsAttempted ?? 0);
          return (
            <div key={s.id} className="flex items-center gap-3">
              <Icon icon={TOPIC_HEALTH_ICON[state]} size="xs" className={STATE_ICON_CLASS[state]} />
              <span className="w-32 shrink-0 text-sm font-medium text-text-primary">
                {s.name}
              </span>
              <Progress
                value={s.accuracy ?? 0}
                variant={STATE_PROGRESS_VARIANT[state]}
                label={`${s.name} accuracy`}
                className="flex-1"
              />
              <span className="w-10 shrink-0 text-right text-sm tabular-nums text-text-tertiary">
                {s.accuracy}%
              </span>
            </div>
          );
        })}
      </div>
      {needsReviewCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-sm text-text-secondary">
            {needsReviewCount} subject{needsReviewCount === 1 ? "" : "s"} need
            {needsReviewCount === 1 ? "s" : ""} attention
          </p>
          <Button href="/practice/smart" variant="secondary" size="sm">
            Review weak areas
          </Button>
        </div>
      )}
    </section>
  );
}
