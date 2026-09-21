"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ListChecks,
  Target,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  Lock,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useProfileInfo } from "@/components/useProfileInfo";
import ContinueCard from "@/components/ContinueCard";
import DkBot from "@/components/DkBot";
import { createClient } from "@/lib/supabase/client";
import { getSmartPracticeEligibility, type SmartPracticeEligibility } from "@/lib/smartPractice";
import { formatLastActive } from "@/lib/activity";
import { isWeakTopic } from "@/lib/weakness";
import type { Module } from "@/types";
import { Card, Badge, Progress, Button, Icon, Skeleton, EmptyState } from "@/components/ui";

type PracticeStats = {
  questionsAttempted: number;
  accuracy: number | null;
};

type ExamStats = {
  examsCompleted: number;
  avgScore: number | null;
};

type WeakTopic = {
  topicId: string;
  name: string;
  moduleId: string;
  accuracy: number;
};

type ActivityEvent =
  | { type: "exam"; key: string; at: string; score: number; correctCount: number; totalQuestions: number }
  | { type: "practice"; key: string; at: string; topicName: string; moduleId: string; accuracy: number | null };

type Tab = "practice" | "exam";

const STAT_ICONS = {
  "Questions practiced": ListChecks,
  Accuracy: Target,
  "Exams completed": ClipboardCheck,
  "Avg exam score": TrendingUp,
} as const;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function HomeDashboard({ subjects }: { subjects: Module[] }) {
  const { profile } = useAuth();
  const info = useProfileInfo();
  const [tab, setTab] = useState<Tab>("practice");
  const [practiceStats, setPracticeStats] = useState<PracticeStats | null>(null);
  const [examStats, setExamStats] = useState<ExamStats | null>(null);
  const [smartEligibility, setSmartEligibility] = useState<SmartPracticeEligibility | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[] | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();
      const [progRes, examRes, eligibilityRes] = await Promise.all([
        supabase
          .from("user_topic_progress")
          .select(
            "topic_id, practice_questions_attempted, practice_questions_correct, practice_accuracy, practice_last_attempted_at"
          )
          .order("practice_last_attempted_at", { ascending: false, nullsFirst: false }),
        supabase
          .from("exams")
          .select("id, status, score, correct_count, total_questions, submitted_at")
          .eq("status", "submitted")
          .order("submitted_at", { ascending: false })
          .limit(1000),
        getSmartPracticeEligibility().catch(() => null),
      ]);

      if (!active) return;

      setSmartEligibility(eligibilityRes);

      const rows = progRes.data ?? [];
      const attempted = rows.reduce(
        (sum, r) => sum + ((r.practice_questions_attempted as number) ?? 0),
        0
      );
      const correct = rows.reduce(
        (sum, r) => sum + ((r.practice_questions_correct as number) ?? 0),
        0
      );

      const exams = examRes.data ?? [];
      const examsCompleted = exams.length;
      const avgScore =
        examsCompleted > 0
          ? Math.round(
              (exams.reduce((sum, e) => sum + Number(e.score ?? 0), 0) / examsCompleted) * 10
            ) / 10
          : null;

      setPracticeStats({
        questionsAttempted: attempted,
        accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : null,
      });
      setExamStats({ examsCompleted, avgScore });

      // Weakest practiced topics (min attempt count, worst accuracy first).
      const weakRows = rows
        .filter(
          (r) =>
            isWeakTopic(
              r.practice_accuracy as number | null,
              (r.practice_questions_attempted as number) ?? 0
            )
        )
        .sort((a, b) => (a.practice_accuracy as number) - (b.practice_accuracy as number))
        .slice(0, 3);

      // Rows are already ordered by practice_last_attempted_at desc.
      const recentPracticeRows = rows.filter((r) => r.practice_last_attempted_at).slice(0, 6);

      const neededTopicIds = [
        ...new Set(
          [...weakRows, ...recentPracticeRows].map((r) => r.topic_id as string)
        ),
      ];
      const { data: topicRows } = neededTopicIds.length
        ? await supabase.from("topics").select("id, name, module_id").in("id", neededTopicIds)
        : { data: [] as { id: string; name: string; module_id: string }[] };

      if (!active) return;

      const topicById = new Map(
        (topicRows ?? []).map((t) => [t.id as string, t as { id: string; name: string; module_id: string }])
      );

      setWeakTopics(
        weakRows
          .map((r) => {
            const topic = topicById.get(r.topic_id as string);
            if (!topic) return null;
            return {
              topicId: r.topic_id as string,
              name: topic.name,
              moduleId: topic.module_id,
              accuracy: Math.round(r.practice_accuracy as number),
            };
          })
          .filter((t): t is WeakTopic => t !== null)
      );

      const examEvents: ActivityEvent[] = exams
        .filter((e) => e.submitted_at)
        .map((e) => ({
          type: "exam" as const,
          key: e.id as string,
          at: e.submitted_at as string,
          score: Number(e.score ?? 0),
          correctCount: (e.correct_count as number) ?? 0,
          totalQuestions: (e.total_questions as number) ?? 0,
        }));

      const practiceEvents: ActivityEvent[] = recentPracticeRows
        .map((r): ActivityEvent | null => {
          const topic = topicById.get(r.topic_id as string);
          if (!topic) return null;
          return {
            type: "practice" as const,
            key: r.topic_id as string,
            at: r.practice_last_attempted_at as string,
            topicName: topic.name,
            moduleId: topic.module_id,
            accuracy:
              r.practice_accuracy != null ? Math.round(r.practice_accuracy as number) : null,
          };
        })
        .filter((e): e is ActivityEvent => e !== null);

      setActivity(
        [...examEvents, ...practiceEvents]
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
          .slice(0, 8)
      );
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const display =
    info && profile
      ? [info.collegeName, info.programName, info.yearName].filter(Boolean).join(" · ")
      : null;

  const practiceCards: { label: keyof typeof STAT_ICONS; value: string; isSet: boolean }[] = [
    {
      label: "Questions practiced",
      value: practiceStats ? String(practiceStats.questionsAttempted) : "",
      isSet: practiceStats ? practiceStats.questionsAttempted > 0 : false,
    },
    {
      label: "Accuracy",
      value: practiceStats
        ? practiceStats.accuracy === null
          ? "—"
          : `${practiceStats.accuracy}%`
        : "",
      isSet: practiceStats ? practiceStats.accuracy !== null : false,
    },
  ];

  const examCards: { label: keyof typeof STAT_ICONS; value: string; isSet: boolean }[] = [
    {
      label: "Exams completed",
      value: examStats ? String(examStats.examsCompleted) : "",
      isSet: examStats ? examStats.examsCompleted > 0 : false,
    },
    {
      label: "Avg exam score",
      value: examStats ? (examStats.avgScore === null ? "—" : `${examStats.avgScore}%`) : "",
      isSet: examStats ? examStats.avgScore !== null : false,
    },
  ];

  const statCards = tab === "practice" ? practiceCards : examCards;
  const statsLoading = tab === "practice" ? !practiceStats : !examStats;

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-1.5">
        <h1 className="text-display font-bold tracking-tight text-text-primary">
          {greeting()}
          {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        {profile?.full_name ? (
          display && <p className="text-text-tertiary">{display}</p>
        ) : (
          <p className="text-text-tertiary">
            Complete{" "}
            <Link href="/onboarding" className="text-primary hover:underline">
              onboarding
            </Link>{" "}
            to save your details.
          </p>
        )}
      </header>

      {/* Continue (hero) + This Week — dominant action, per §1 the only
          Level-3 elevated pair on the page. */}
      <section className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <ContinueCard />
        </div>

        <div data-tutorial="stats" className="md:col-span-2">
          <Card variant="elevated" padding="lg" className="h-full">
            <div className="flex items-center justify-between">
              <p className="text-caption font-semibold tracking-wide text-text-tertiary uppercase">
                This week
              </p>
              <div
                role="tablist"
                aria-label="Statistics view"
                className="inline-flex rounded-control border border-border-default bg-surface-secondary p-0.5"
              >
                {(["practice", "exam"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={`rounded-control px-2.5 py-1 text-caption font-medium capitalize transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                      tab === t
                        ? "bg-primary text-white"
                        : "text-text-tertiary hover:text-text-primary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {statCards.map((card) => {
                const StatIconComponent = STAT_ICONS[card.label];
                return (
                  <div key={card.label}>
                    <Icon icon={StatIconComponent} size="sm" className="text-primary" />
                    {statsLoading ? (
                      <Skeleton className="mt-2 h-7 w-12" />
                    ) : (
                      <p
                        className={`mt-2 text-h2 font-semibold tabular-nums ${
                          card.isSet ? "text-text-primary" : "text-text-tertiary"
                        }`}
                      >
                        {card.value}
                      </p>
                    )}
                    <p className="mt-0.5 text-caption text-text-tertiary">{card.label}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      {/* Your Curriculum — Level 1, no card wrapper (§1). */}
      {subjects.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-caption font-semibold tracking-wide text-text-tertiary uppercase">
            Your curriculum
          </h2>
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {subjects.map((s) => {
              const pct =
                s.topicsTotal && s.topicsTotal > 0
                  ? Math.round(((s.topicsCompleted ?? 0) / s.topicsTotal) * 100)
                  : 0;
              return (
                <div key={s.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">{s.name}</span>
                    <span className="tabular-nums text-text-tertiary">{pct}%</span>
                  </div>
                  <Progress value={pct} size="sm" label={`${s.name} completion`} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Focus Next — weaknesses, only shown when there's a real signal. */}
      {weakTopics && weakTopics.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-caption font-semibold tracking-wide text-warning-text uppercase">
            <Icon icon={AlertTriangle} size="xs" />
            Focus next — {weakTopics.length} topic{weakTopics.length === 1 ? "" : "s"} need
            review
          </h2>
          <div className="space-y-2">
            {weakTopics.map((t) => (
              <Link
                key={t.topicId}
                href={`/practice/${t.moduleId}`}
                className="flex items-center justify-between rounded-interactive border border-border-default bg-surface px-4 py-3 text-sm transition-colors duration-150 hover:border-warning/40"
              >
                <span className="font-medium text-text-primary">{t.name}</span>
                <Badge variant="warning">{t.accuracy}% accuracy</Badge>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/practice/smart" variant="secondary" size="sm">
              Practice weak topics
            </Button>
            <Button href="/mistakes" variant="ghost" size="sm">
              View all mistakes
            </Button>
          </div>
        </section>
      )}

      {/* Quick actions — secondary now that Continue is the dominant action. */}
      <section className="space-y-3" aria-label="Quick actions">
        <h2 className="text-caption font-semibold tracking-wide text-text-tertiary uppercase">
          Quick actions
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Link data-tutorial="practice" href="/blocks" className="block h-full">
            <Card variant="interactive" padding="md" className="h-full">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-text-primary">Start Practice</p>
                <Icon icon={ArrowRight} size="sm" className="text-text-tertiary" />
              </div>
              <p className="mt-1 text-sm text-text-tertiary">
                Revise by block, module and topic
              </p>
            </Card>
          </Link>

          <Link data-tutorial="exam" href="/exam" className="block h-full">
            <Card variant="interactive" padding="md" className="h-full">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-text-primary">Exam Simulation</p>
                <Icon icon={ArrowRight} size="sm" className="text-text-tertiary" />
              </div>
              <p className="mt-1 text-sm text-text-tertiary">
                Timed, graded exam under real conditions
              </p>
            </Card>
          </Link>

          <Link href="/practice/smart" className="block h-full">
            <Card variant="interactive" padding="md" className="h-full">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-text-primary">Smart Practice</p>
                {smartEligibility && !smartEligibility.eligible ? (
                  <Icon icon={Lock} size="sm" className="text-text-tertiary" />
                ) : (
                  <Icon icon={ArrowRight} size="sm" className="text-text-tertiary" />
                )}
              </div>
              {smartEligibility && !smartEligibility.eligible ? (
                <div className="mt-2 space-y-1.5">
                  <p className="text-sm text-text-tertiary">
                    {smartEligibility.attempts} of {smartEligibility.minAttempts} questions
                    answered
                  </p>
                  <Progress
                    value={(smartEligibility.attempts / smartEligibility.minAttempts) * 100}
                    size="sm"
                    label="Smart Practice eligibility"
                  />
                </div>
              ) : (
                <p className="mt-1 text-sm text-text-tertiary">
                  A mix weighted toward your weakest topics
                </p>
              )}
            </Card>
          </Link>
        </div>
      </section>

      {/* Recent activity — compact, supporting information (§ Dashboard). */}
      <section className="space-y-3">
        <h2 className="text-caption font-semibold tracking-wide text-text-tertiary uppercase">
          Recent activity
        </h2>

        {activity === null ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : activity.length === 0 ? (
          <EmptyState
            illustration={<DkBot state="thumbsUp" size="small" alt={null} />}
            title="No activity yet"
            description="Start practicing or take your first exam simulation to build your stats."
            action={<Button href="/blocks">Start practicing</Button>}
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {activity.map((event, i) => {
              const showDayHeader =
                i === 0 || dayLabel(event.at) !== dayLabel(activity[i - 1].at);
              const row =
                event.type === "exam" ? (
                  <div className="flex items-center justify-between py-3 text-sm">
                    <div className="flex items-center gap-2.5">
                      <Icon icon={ClipboardCheck} size="sm" className="text-text-tertiary" />
                      <span className="text-text-primary">
                        Exam completed &middot; {event.correctCount}/{event.totalQuestions} (
                        {Math.round(event.score)}%)
                      </span>
                    </div>
                    <span className="text-text-tertiary">{formatLastActive(event.at)}</span>
                  </div>
                ) : (
                  <Link
                    href={`/practice/${event.moduleId}`}
                    className="flex items-center justify-between py-3 text-sm hover:text-primary"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon icon={ListChecks} size="sm" className="text-text-tertiary" />
                      <span className="text-text-primary">
                        Practiced {event.topicName}
                        {event.accuracy !== null ? ` · ${event.accuracy}%` : ""}
                      </span>
                    </div>
                    <span className="text-text-tertiary">{formatLastActive(event.at)}</span>
                  </Link>
                );
              return (
                <li key={event.key}>
                  {showDayHeader && (
                    <p className="pt-3 text-caption font-semibold text-text-tertiary first:pt-0">
                      {dayLabel(event.at)}
                    </p>
                  )}
                  {row}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Leaderboard — secondary, per §1 not another dominant surface. */}
      <section data-tutorial="leaderboard">
        <Link href="/leaderboard" className="block">
          <Card
            variant="interactive"
            padding="md"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Icon icon={Trophy} size="md" className="text-primary" />
              <div>
                <p className="font-semibold text-text-primary">Leaderboard</p>
                <p className="text-sm text-text-tertiary">
                  See how you compare with your cohort
                </p>
              </div>
            </div>
            <Icon icon={ArrowRight} size="sm" className="text-text-tertiary" />
          </Card>
        </Link>
      </section>
    </div>
  );
}
