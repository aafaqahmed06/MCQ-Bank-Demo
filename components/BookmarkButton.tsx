"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

type BookmarkButtonProps = {
  mcqId: string;
};

export default function BookmarkButton({ mcqId }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const supabase = createClient();
    supabase
      .from("bookmarks")
      .select("mcq_id")
      .eq("user_id", user.id)
      .eq("mcq_id", mcqId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setBookmarked(!!data);
      });
    return () => {
      active = false;
    };
  }, [user, mcqId]);

  const toggle = useCallback(async () => {
    if (!user || loading) return;
    setLoading(true);
    const supabase = createClient();
    if (bookmarked) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("mcq_id", mcqId);
      if (!error) setBookmarked(false);
    } else {
      const { error } = await supabase
        .from("bookmarks")
        .insert({ user_id: user.id, mcq_id: mcqId });
      if (!error) setBookmarked(true);
    }
    setLoading(false);
  }, [user, bookmarked, loading, mcqId]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!user || loading}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        bookmarked
          ? "border-amber-300/50 bg-amber-400/15 text-amber-300 hover:border-amber-300/70"
          : "border-cyan-300/25 bg-[var(--bg-card-dim)]/60 text-[var(--text-btn-secondary)] hover:border-cyan-300/40 hover:text-[var(--accent-cyan-strong)]"
      }`}
    >
      <span aria-hidden>{bookmarked ? "★" : "☆"}</span>
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}