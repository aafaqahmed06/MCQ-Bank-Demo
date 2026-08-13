"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useProfileInfo } from "@/components/useProfileInfo";
import { createClient } from "@/lib/supabase/client";

type ResumeTarget =
  | { kind: "module"; href: string; label: string; topicName?: string }
  | { kind: "blocks"; href: string; label: string };

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
        .select("topic_id, last_attempted_at")
        .order("last_attempted_at", { ascending: false })
        .limit(1);

      if (!active) return;

      const topicId = (prog?.[0]?.topic_id as string | undefined) ?? "";
      if (topicId) {
        const { data: topic } = await supabase
          .from("topics")
          .select("id, name, module_id")
          .eq("id", topicId)
          .maybeSingle();

        if (active && topic?.module_id) {
          setTarget({
            kind: "module",
            href: `/practice/${topic.module_id}`,
            label: "Resume your last practice session",
            topicName: (topic.name as string) ?? undefined,
          });
          return;
        }
      }

      if (active) {
        setTarget({
          kind: "blocks",
          href: "/blocks",
          label: "Start practicing",
        });
      }
    }

    if (user && isProfileComplete) void load();
    return () => {
      active = false;
    };
  }, [user, isProfileComplete]);

  if (!user || !isProfileComplete || !target) return null;

  return (
    <Link
      href={target.href}
      className="hud-card hud-card-hover block rounded-xl p-5 text-center"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent-cyan)]">
        Continue where you left off
      </p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-heading)]">
        {target.label}
      </p>
      {target.kind === "module" && target.topicName && (
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {target.topicName}
        </p>
      )}
      {info && (
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {info.collegeName} &middot; {info.yearName}
        </p>
      )}
    </Link>
  );
}
