import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role admin client. Server-only — NEVER import this from a
 * client component (the `server-only` import enforces that at build time).
 * Used for exam generation/grading and other trusted operations.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}