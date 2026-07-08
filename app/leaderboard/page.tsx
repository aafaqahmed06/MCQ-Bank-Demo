import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";

export default function LeaderboardPage() {
  return (
    <LayoutWrapper>
      <RequireProfile>
        <div className="space-y-6">
          <div className="hud-card fade-in rounded-xl p-8 text-center">
            <h1 className="text-3xl font-bold text-[var(--text-heading)]">Leaderboard</h1>
            <p className="mt-3 text-[var(--text-muted)]">
              Rankings and progress comparisons will appear here later.
            </p>
          </div>
        </div>
      </RequireProfile>
    </LayoutWrapper>
  );
}
