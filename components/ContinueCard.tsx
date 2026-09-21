"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useProfileInfo } from "@/components/useProfileInfo";
import { createClient } from "@/lib/supabase/client";
import { formatLastActive } from "@/lib/activity";
import { isWeakTopic } from "@/lib/weakness";
import { Card, Progress, Badge, Button, Icon, Skeleton } from "@/components/ui";

type ResumeTarget =
  | {
      kind: "module";
      href: string;
      topicName: string;
      attempted: number;
      totalQuestions: number;
      accuracy: number | null;
      lastAttemptedAt: string | null;
    }
  | { kind: "blocks"; href: "/blocks" };

/**
 * "Continue Practice" — the dashboard's hero action (§ Dashboard, "feels
 * like a persistent session, not a generic button"). Also used standalone
 * on the landing page for a returning, already-onboarded visitor.
 *
 * Ordered by practice_last_attempted_at (not the legacy last_attempted_at,
 * which is written only by exam submission, not practice — see
 * supabase/migrations/20260708000029_practice_attempts.sql) so "resume"
 * actually reflects the last *practice* session, matching the card's own
 * copy and its link into /practice/[moduleId].
 */
export default function ContinueCard() {
  const { user, isProfileComplete } = useAuth();
  const info = useProfileInfo();
  const [target, setTarget] = useState<ResumeTarget | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();
      const { data: prog } = await supabase
        .from("user_topic_progress")
        .select(
          "topic_id, practice_questions_attempted, practice_accuracy, practice_last_attempted_at"
        )
        .not("practice_last_attempted_at", "is", null)
        .order("practice_last_attempted_at", { ascending: false })
        .limit(1);

      if (!active) return;

      const row = prog?.[0];
      const topicId = row?.topic_id as string | undefined;

      if (topicId) {
        const [{ data: topic }, { count }] = await Promise.all([
          supabase
            .from("topics")
            .select("id, name, module_id")
            .eq("id", topicId)
            .maybeSingle(),
          supabase
            .from("mcqs")
            .select("id", { count: "exact", head: true })
            .eq("topic_id", topicId)
            .eq("status", "published"),
        ]);

        if (active && topic?.module_id) {
          setTarget({
            kind: "module",
            href: `/practice/${topic.module_id}`,
            topicName: (topic.name as string) ?? "",
            attempted: (row?.practice_questions_attempted as number) ?? 0,
            totalQuestions: count ?? 0,
            accuracy:
              row?.practice_accuracy != null
                ? Math.round(row.practice_accuracy as number)
                : null,
            lastAttemptedAt: (row?.practice_last_attempted_at as string) ?? null,
          });
          return;
        }
      }

      if (active) setTarget({ kind: "blocks", href: "/blocks" });
    }

    if (user && isProfileComplete) void load();
    return () => {
      active = false;
    };
  }, [user, isProfileComplete]);

  if (!user || !isProfileComplete) return null;

  if (!target) {
    return (
      <Card variant="elevated" padding="lg">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-3 h-5 w-48" />
        <Skeleton className="mt-2 h-4 w-24" />
        <Skeleton className="mt-4 h-2 w-full" />
        <Skeleton className="mt-5 h-11 w-full rounded-control" />
      </Card>
    );
  }

  if (target.kind === "blocks") {
    return (
      <Card variant="elevated" padding="lg" className="text-center">
        <p className="text-caption font-semibold tracking-wide text-primary uppercase">
          Continue where you left off
        </p>
        <p className="mt-2 text-h3 font-semibold text-text-primary">Start practicing</p>
        {info && (
          <p className="mt-1 text-sm text-text-tertiary">
            {info.collegeName} &middot; {info.yearName}
          </p>
        )}
        <Button href="/blocks" className="mt-4">
          Start Practice
        </Button>
      </Card>
    );
  }

  const isWeak = isWeakTopic(target.accuracy, target.attempted);

  const progressPct =
    target.totalQuestions > 0
      ? Math.min(100, Math.round((target.attempted / target.totalQuestions) * 100))
      : 0;

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-caption font-semibold tracking-wide text-primary uppercase">
            Continue
          </p>
          <p className="mt-1 text-h3 font-semibold text-text-primary">{target.topicName}</p>
          <p className="mt-0.5 text-sm text-text-tertiary">
            {formatLastActive(target.lastAttemptedAt)}
          </p>
        </div>
        {isWeak && <Badge variant="warning">Needs review</Badge>}
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>
            {target.attempted} question{target.attempted === 1 ? "" : "s"} practiced
          </span>
          {target.accuracy !== null && <span>{target.accuracy}% accuracy</span>}
        </div>
        <Progress
          value={progressPct}
          variant={isWeak ? "warning" : "default"}
          label={`${target.topicName} progress`}
        />
      </div>

      <Button href={target.href} fullWidth className="mt-5">
        Continue Practice
        <Icon icon={ArrowRight} size="sm" />
      </Button>
    </Card>
  );
}
