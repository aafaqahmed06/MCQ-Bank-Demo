"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark as BookmarkIcon } from "lucide-react";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import BookmarkButton from "@/components/BookmarkButton";
import { getBookmarkedQuestions, type BookmarkedQuestion } from "@/lib/bookmarks";
import { Card, EmptyState, Skeleton, Button, cn } from "@/components/ui";

export default function BookmarksPage() {
  const [items, setItems] = useState<BookmarkedQuestion[] | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getBookmarkedQuestions()
      .then((data) => {
        if (active) setItems(data);
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const subjects = useMemo(() => {
    if (!items) return [];
    return [...new Set(items.map((i) => i.moduleName).filter(Boolean))].sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return subjectFilter ? items.filter((i) => i.moduleName === subjectFilter) : items;
  }, [items, subjectFilter]);

  function handleRemove(mcqId: string) {
    setItems((prev) => (prev ? prev.filter((i) => i.mcqId !== mcqId) : prev));
  }

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-h1 font-bold tracking-tight text-text-primary">Bookmarks</h1>
            <p className="text-text-tertiary">
              {items
                ? `${items.length} saved question${items.length === 1 ? "" : "s"}`
                : "Loading your saved questions…"}
            </p>
          </header>

          {items === null ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={BookmarkIcon}
              title="No bookmarked questions"
              description="Questions you save while practicing will appear here."
              action={<Button href="/blocks">Start practicing</Button>}
            />
          ) : (
            <>
              {subjects.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSubjectFilter(null)}
                    aria-pressed={subjectFilter === null}
                    className={cn(
                      "rounded-control border px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      subjectFilter === null
                        ? "border-primary bg-primary text-white"
                        : "border-border-default bg-surface text-text-secondary hover:border-primary/40"
                    )}
                  >
                    All
                  </button>
                  {subjects.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubjectFilter(s)}
                      aria-pressed={subjectFilter === s}
                      className={cn(
                        "rounded-control border px-3 py-1.5 text-sm font-medium transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        subjectFilter === s
                          ? "border-primary bg-primary text-white"
                          : "border-border-default bg-surface text-text-secondary hover:border-primary/40"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {filtered.map((item) => (
                  <Card key={item.mcqId} variant="default" padding="md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-caption font-semibold tracking-wide text-primary uppercase">
                          {item.moduleName}
                          {item.topicName ? ` · ${item.topicName}` : ""}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-text-primary">{item.question}</p>
                      </div>
                      <BookmarkButton
                        mcqId={item.mcqId}
                        onToggle={(bookmarked) => {
                          if (!bookmarked) handleRemove(item.mcqId);
                        }}
                      />
                    </div>
                    <div className="mt-3">
                      <Button
                        href={`/practice/${item.moduleId}?topic=${encodeURIComponent(item.topicName)}`}
                        variant="secondary"
                        size="sm"
                      >
                        Practice this topic
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
