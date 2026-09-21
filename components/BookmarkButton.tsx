"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Icon, cn } from "@/components/ui";

export type BookmarkButtonHandle = {
  toggle: () => void;
};

type BookmarkButtonProps = {
  mcqId: string;
  /** Lets a parent (e.g. the practice session's dot strip) mirror the
   * bookmarked state without re-querying Supabase itself. */
  onToggle?: (bookmarked: boolean) => void;
};

const BookmarkButton = forwardRef<BookmarkButtonHandle, BookmarkButtonProps>(
  function BookmarkButton({ mcqId, onToggle }, ref) {
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
        if (!error) {
          setBookmarked(false);
          onToggle?.(false);
        }
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({ user_id: user.id, mcq_id: mcqId });
        if (!error) {
          setBookmarked(true);
          onToggle?.(true);
        }
      }
      setLoading(false);
    }, [user, bookmarked, loading, mcqId, onToggle]);

    useImperativeHandle(ref, () => ({ toggle }), [toggle]);

    return (
      <button
        type="button"
        onClick={toggle}
        disabled={!user || loading}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
        title={bookmarked ? "Remove bookmark (B)" : "Bookmark (B)"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-control border px-3 py-1.5 text-caption font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
          bookmarked
            ? "border-warning/40 bg-warning-soft text-warning-text hover:border-warning/60"
            : "border-border-default bg-surface text-text-secondary hover:border-primary/40 hover:text-text-primary"
        )}
      >
        <Icon icon={Star} size="xs" className={bookmarked ? "fill-current" : undefined} />
        {bookmarked ? "Bookmarked" : "Bookmark"}
      </button>
    );
  }
);

export default BookmarkButton;
