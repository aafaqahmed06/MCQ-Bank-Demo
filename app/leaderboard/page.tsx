import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import Leaderboard from "@/components/Leaderboard";

export default function LeaderboardPage() {
  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          <section className="hud-card fade-in rounded-xl p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-[var(--text-heading)]">
              Leaderboard
            </h1>
            <p className="mt-2 text-[var(--text-muted)]">
              Top students by correct answers and accuracy across completed
              exams.
            </p>
            <div className="mt-6">
              <Leaderboard />
            </div>
          </section>
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}