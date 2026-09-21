export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm text-text-tertiary">Loading…</p>
      </div>
    </div>
  );
}
