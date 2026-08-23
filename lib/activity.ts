import type { SupabaseClient } from "@supabase/supabase-js";

const THROTTLE_MS = 5 * 60 * 1000;
const STORAGE_KEY = "diagnknow-last-active-touch";

/**
 * Fires the touch_last_active RPC at most once per THROTTLE_MS per browser,
 * so navigating between pages doesn't add a round trip on every load. The
 * RPC itself (20260708000038_last_active.sql) re-checks the same window
 * server-side, so a cleared/blocked localStorage just means an extra no-op
 * call rather than an extra write.
 */
export function touchLastActiveIfStale(
  supabase: SupabaseClient,
  userId: string
) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { userId: string; at: number }) : null;
    if (parsed?.userId === userId && Date.now() - parsed.at < THROTTLE_MS) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, at: Date.now() }));
  } catch {
    // localStorage unavailable -- fall through, the DB-side window still protects us
  }
  void supabase.rpc("touch_last_active");
}

/** "never" / "active recently" / "N minutes/hours/days ago" for admin display. */
export function formatLastActive(timestamp: string | null): string {
  if (!timestamp) return "never";

  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return "active recently";

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
