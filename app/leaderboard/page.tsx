import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import Leaderboard from "@/components/Leaderboard";

export default function LeaderboardPage() {
  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
              Leaderboard
            </h1>
            <p className="text-[var(--text-muted)]">
              Top students by correct answers and accuracy across completed
              exams.
            </p>
          </header>
          <section className="hud-card rounded-xl p-4 sm:p-6">
            <Leaderboard />
          </section>
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}