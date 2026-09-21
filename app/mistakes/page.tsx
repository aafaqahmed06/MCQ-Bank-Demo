import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import DkBot from "@/components/DkBot";
import { getMostMissedTopics } from "@/lib/curriculum";
import { Badge, Button, EmptyState, Icon } from "@/components/ui";

export default async function MistakesPage() {
  const missed = await getMostMissedTopics(15);

  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-h1 font-bold tracking-tight text-text-primary">Mistakes</h1>
            <p className="text-text-tertiary">
              Your most-missed topics, ranked by accuracy — practice these first.
            </p>
          </header>

          {missed.length === 0 ? (
            <EmptyState
              illustration={<DkBot state="thumbsUp" size="small" alt={null} />}
              title="No mistakes tracked yet"
              description="Keep practicing — topics you're consistently missing will show up here."
              action={<Button href="/blocks">Start practicing</Button>}
            />
          ) : (
            <>
              <div className="space-y-2">
                {missed.map((topic, i) => (
                  <Link
                    key={topic.topicId}
                    href={`/practice/${topic.moduleId}?topic=${encodeURIComponent(topic.topicName)}`}
                    className="flex items-center gap-4 rounded-interactive border border-border-default bg-surface px-4 py-3 transition-colors duration-150 hover:border-warning/40"
                  >
                    <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-text-tertiary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text-primary">{topic.topicName}</p>
                      <p className="text-caption text-text-tertiary">
                        {topic.moduleName} · {topic.attempted} attempts
                      </p>
                    </div>
                    <Badge variant="warning" size="sm">
                      <Icon icon={AlertTriangle} size="xs" />
                      {topic.accuracy}%
                    </Badge>
                    <Icon icon={ArrowRight} size="sm" className="shrink-0 text-text-tertiary" />
                  </Link>
                ))}
              </div>

              <Button href="/practice/smart">Practice mistakes</Button>
            </>
          )}
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
