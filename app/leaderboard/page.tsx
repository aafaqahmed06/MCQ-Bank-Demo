import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import Leaderboard from "@/components/Leaderboard";
import { Card } from "@/components/ui";

export default function LeaderboardPage() {
  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-h1 font-bold tracking-tight text-text-primary">
              Leaderboard
            </h1>
            <p className="text-text-tertiary">
              Top students by correct answers and accuracy across completed
              exams.
            </p>
          </header>
          <Card variant="default" padding="md">
            <Leaderboard />
          </Card>
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
