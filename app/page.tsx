import LayoutWrapper from "@/components/LayoutWrapper";
import ContinueCard from "@/components/ContinueCard";
import HeroCTA from "@/components/HeroCTA";
import { createClient } from "@/lib/supabase/server";
import { getSubjectNames, getSampleQuestion } from "@/lib/curriculum";

const FEATURES = [
  {
    title: "Practice by block",
    body: "Work through each block, subject, and topic in order — practice quietly adapts to skip what you've mastered and resurface what you've missed.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <path d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
      </svg>
    ),
  },
  {
    title: "Smart Practice",
    body: "Once you've logged 25 practice attempts, Smart Practice mixes questions across every subject, weighted toward the topics you're actually weakest in.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.75" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: "Timed exam mode",
    body: "Sit a 20, 50, or 100-question timed paper, get instantly graded, and see full explanations after you submit.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <circle cx="12" cy="12" r="8.25" />
        <path d="M12 7.5V12h4.5" />
      </svg>
    ),
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const [{ count: mcqCount }, subjects, sample] = await Promise.all([
    supabase.from("mcqs").select("id", { count: "exact", head: true }).eq("status", "published"),
    getSubjectNames(),
    getSampleQuestion(),
  ]);

  return (
    <LayoutWrapper>
      <div className="flex flex-1 flex-col items-center py-10 md:py-16">
        {/* Hero */}
        <section className="w-full max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-[var(--accent-cyan-strong)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
              <path d="M9 12.75L11.25 15 15 9.75M12 3c-2.755 0-5.455.232-8.083.678a1.5 1.5 0 00-1.221 1.34c-.014 5.19 2.03 9.43 5.44 12.29 1.44 1.204 3.15 2.09 4.864 2.564 1.714-.474 3.424-1.36 4.864-2.564 3.41-2.86 5.454-7.1 5.44-12.29a1.5 1.5 0 00-1.221-1.34A48.09 48.09 0 0012 3z" />
            </svg>
            Every question sourced and reviewed
          </span>

          <h1 className="hero-serif mt-4 text-4xl leading-[1.1] text-balance text-[var(--text-heading)] sm:text-5xl md:text-6xl">
            Know what you don&apos;t know, before the exam does
          </h1>

          <p className="hud-muted mx-auto mt-5 max-w-xl text-base sm:text-lg">
            {mcqCount ?? 0} clinically-reviewed questions, organized by block, with practice
            that targets your actual weak topics.
          </p>

          <HeroCTA />
        </section>

        {/* Subject pills */}
        {subjects.length > 0 && (
          <div className="mt-14 flex w-full flex-wrap justify-center gap-2 md:mt-20">
            {subjects.map((name) => (
              <span
                key={name}
                className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-[var(--accent-cyan-strong)]"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Feature callouts */}
        <div className="mt-14 grid w-full gap-8 sm:grid-cols-3 sm:gap-6 md:mt-20">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <span className="flex size-10 items-center justify-center rounded-lg bg-cyan-500/10 text-[var(--accent-cyan-strong)]">
                {f.icon}
              </span>
              <h3 className="mt-3 font-semibold text-[var(--text-heading)]">{f.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{f.body}</p>
            </div>
          ))}
        </div>

        {/* Stat */}
        <div className="mt-14 rounded-xl border border-cyan-300/20 bg-[var(--bg-card)] px-8 py-4 text-center backdrop-blur-sm md:mt-20">
          <p className="text-2xl font-bold text-[var(--accent-cyan-strong)]">{mcqCount ?? 0}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">
            Practice Questions
          </p>
        </div>

        {/* Sample question */}
        {sample && (
          <div className="hud-card mt-14 w-full max-w-xl rounded-xl border-l-4 border-l-[var(--accent-cyan)] p-6 md:mt-20">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-cyan)]">
              Sample question{sample.topic ? ` · ${sample.topic}` : ""}
            </p>
            <p className="mt-3 font-medium text-[var(--text-heading)]">{sample.question}</p>
            <ul className="mt-4 space-y-2">
              {sample.options.map((opt, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-option)] px-4 py-2.5 text-left text-sm text-[var(--text-option)]"
                >
                  <span className="font-semibold">{String.fromCharCode(65 + i)}.</span> {opt}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 w-full max-w-xl">
          <ContinueCard />
        </div>

        <p className="mt-10 text-xs text-[var(--text-muted)]">
          Built by a medical student, for medical students
        </p>
      </div>
    </LayoutWrapper>
  );
}
