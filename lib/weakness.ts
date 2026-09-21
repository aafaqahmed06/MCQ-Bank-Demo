/**
 * Shared "needs review" thresholds for practice-mode topic accuracy.
 * Deliberately separate from Smart Practice's own weighting (which reads
 * practice_attempts + exam_answers directly, see lib/practiceRankingCore.ts)
 * -- this is a much simpler, display-only signal for the dashboard's
 * Continue card and Focus Next section.
 */
export const WEAK_ACCURACY_THRESHOLD = 60;
export const WEAK_MIN_ATTEMPTS = 3;

export function isWeakTopic(accuracy: number | null, attempted: number): boolean {
  return (
    accuracy !== null && attempted >= WEAK_MIN_ATTEMPTS && accuracy < WEAK_ACCURACY_THRESHOLD
  );
}

/**
 * Five-state curriculum health classification (.claude/rules/ui-design-system.md
 * "Semantic states"). Thresholds beyond the existing weak-topic gate above
 * are this project's own interpretation -- the spec names the five states
 * but not exact cutoffs. "needs-review" reuses isWeakTopic's reliability
 * gate (>= WEAK_MIN_ATTEMPTS) rather than flagging a topic on 1-2 unlucky
 * attempts.
 */
export type TopicHealthState = "mastered" | "strong" | "developing" | "needs-review" | "unattempted";

export const TOPIC_HEALTH_LABEL: Record<TopicHealthState, string> = {
  mastered: "Mastered",
  strong: "Strong",
  developing: "Developing",
  "needs-review": "Needs review",
  unattempted: "Not started",
};

export function getTopicHealthState(
  accuracy: number | null,
  attempted: number
): TopicHealthState {
  if (attempted <= 0 || accuracy === null) return "unattempted";
  if (isWeakTopic(accuracy, attempted)) return "needs-review";
  if (accuracy >= 90) return "mastered";
  if (accuracy >= 75) return "strong";
  return "developing";
}
