import { CheckCircle2, TrendingUp, Activity, AlertTriangle, Circle } from "lucide-react";
import { getTopicHealthState, TOPIC_HEALTH_LABEL, type TopicHealthState } from "@/lib/weakness";
import { Badge, Icon, type BadgeSize, type BadgeVariant } from "@/components/ui";

export const TOPIC_HEALTH_ICON = {
  mastered: CheckCircle2,
  strong: TrendingUp,
  developing: Activity,
  "needs-review": AlertTriangle,
  unattempted: Circle,
} as const;

const STATE_VARIANT: Record<TopicHealthState, BadgeVariant> = {
  mastered: "success",
  strong: "primary",
  developing: "info",
  "needs-review": "warning",
  unattempted: "neutral",
};

type TopicHealthBadgeProps = {
  accuracy: number | null;
  attempted: number;
  size?: BadgeSize;
  className?: string;
};

/** Icon + label + color together (never color alone — §"Semantic states"). */
export function TopicHealthBadge({ accuracy, attempted, size = "md", className }: TopicHealthBadgeProps) {
  const state = getTopicHealthState(accuracy, attempted);
  return (
    <Badge variant={STATE_VARIANT[state]} size={size} className={className}>
      <Icon icon={TOPIC_HEALTH_ICON[state]} size="xs" />
      {TOPIC_HEALTH_LABEL[state]}
    </Badge>
  );
}
