import LogoMark from "@/components/LogoMark";

const FEATURES = [
  "Practice by block, module, and topic",
  "Smart Practice weighted toward your weakest topics",
  "Timed exam simulations with instant grading",
];

/**
 * Branded split layout shared by every auth screen (sign in/up, forgot
 * password, reset password) — "not a default auth-library form"
 * (.claude/rules/ui-upgrade-plan.md, Authentication). Single column on
 * mobile: the identity panel collapses to a compact header above the form.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid flex-1 overflow-hidden rounded-card border border-border-default lg:grid-cols-2">
      <div className="hidden flex-col justify-center bg-primary px-10 py-12 text-white lg:flex">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-8" />
            <span className="text-lg font-semibold tracking-tight">DiagKnow</span>
          </div>
          <p className="text-h2 leading-snug font-semibold text-balance">
            Know what you don&apos;t know, before the exam does
          </p>
          <ul className="space-y-3 text-sm text-white/80">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-surface px-4 py-10 sm:px-8 md:py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 text-center lg:hidden">
            <span className="text-primary">
              <LogoMark className="size-8" />
            </span>
            <span className="text-lg font-semibold text-text-primary">DiagKnow</span>
          </div>
          <h1 className="text-h1 font-bold text-text-primary">{title}</h1>
          <p className="mt-1 text-text-tertiary">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
