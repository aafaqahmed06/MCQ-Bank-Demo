import Link from "next/link";
import LayoutWrapper from "@/components/LayoutWrapper";

export default function LandingPage() {
  return (
    <LayoutWrapper>
      <div className="space-y-6">
        <section className="hud-card fade-in rounded-xl p-6 text-center sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent-cyan)]">
            MBBS Practice
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--text-heading)]">DiagKnow</h1>
          <p className="hud-muted mx-auto mt-3 max-w-2xl">
            Structured practice by block and module. Build clinical knowledge one
            question at a time.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/onboarding"
              className="hud-primary-btn rounded-xl px-8 py-4 font-medium"
            >
              Get Started
            </Link>
            <Link
              href="/home"
              className="rounded-xl border border-violet-300/30 bg-[var(--bg-landing-btn)]/60 px-8 py-4 font-medium text-[var(--text-btn-landing)] transition-colors hover:border-cyan-300/40 hover:text-[var(--accent-cyan-strong)] active:border-cyan-300/40 active:text-[var(--accent-cyan-strong)]"
            >
              Go to Dashboard
            </Link>
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}
