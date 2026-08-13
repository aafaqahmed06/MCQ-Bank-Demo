export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </div>
    </div>
  );
}
