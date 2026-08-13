import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="hud-card w-full max-w-md rounded-xl p-8 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent-cyan)]">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--text-heading)]">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/home"
          className="hud-primary-btn mt-6 inline-block rounded-xl px-6 py-3 font-semibold"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
