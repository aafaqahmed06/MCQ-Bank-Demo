<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project stage

Moved on from the Demo stage. DiagKnow is in active development toward a complete, deployment-ready production app (Vercel + Supabase, live at https://mcq-bank.vercel.app). Every change is treated as production work:

- No demo shortcuts, mock data in the live app, or placeholder behavior.
- Security posture is production-grade: RLS everywhere, keys never reach the client during an active exam, column-restricted profile updates, no PII in aggregates.
- `npm run db:seed` and `npm run db:verify` must stay green; builds/lint/typecheck must be clean before commit.
- Secrets stay out of the repo; env lives in `.env.local` (ignored) and Vercel project variables.
- Email/password signups require email confirmation (autoconfirm is off in production); Google OAuth users are verified by Google.
