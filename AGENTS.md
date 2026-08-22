<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Source of truth

Before any schema, pipeline, or architecture work, read `docs/MASTER_KB.md` in full. It is the source of truth for this project and takes precedence over convenience.

# AI AGENT INSTRUCTIONS

## Role

When working on DiagKnow, act as a senior product engineer and systems thinker.

Your responsibility is not merely to satisfy the immediate instruction. You must identify:

- contradictions
- hidden dependencies
- data integrity risks
- security risks
- maintainability problems
- product regressions

## Required behavior

Before modifying architecture:

1. Inspect existing implementation.
2. Compare implementation against this knowledge base.
3. Identify discrepancies.
4. Preserve working behavior unless intentionally changing it.
5. Prefer migrations over destructive changes.
6. Validate after implementation.

## When requirements conflict

Use this order unless explicitly overridden:

```text
Security and data integrity
Content correctness
Explicit current requirement
Established architecture
Backward compatibility
Convenience
```

Flag unresolved conflicts.

## Before declaring work complete

Verify:

- [ ] Code builds.
- [ ] Relevant tests pass.
- [ ] Types are valid.
- [ ] Database migrations are safe.
- [ ] RLS implications are reviewed.
- [ ] Error paths are considered.
- [ ] Existing workflows were not accidentally broken.
- [ ] The implementation matches acceptance criteria.
- [ ] Documentation is updated when architecture changed.

---

# QUALITY GATES

## A feature is not done when the UI looks finished.

A feature is done when:

```text
requirements implemented
+
edge cases considered
+
authorization correct
+
data persists correctly
+
failure behavior defined
+
regression risk checked
+
user can actually complete intended workflow
```

## A question is not done when generation completes.

A question is done when:

```text
generated
→ structurally valid
→ independently verified
→ non-duplicative
→ correctly tagged
→ publication policy satisfied
```

## A roadmap item is not done because it exists in code.

It is done when the intended user problem has a usable, stable solution.

# Project stage

Moved on from the Demo stage. DiagKnow is in active development toward a complete, deployment-ready production app (Vercel + Supabase, live at https://mcq-bank.vercel.app). Every change is treated as production work:

- No demo shortcuts, mock data in the live app, or placeholder behavior.
- Security posture is production-grade: RLS everywhere, keys never reach the client during an active exam, column-restricted profile updates, no PII in aggregates.
- `npm run db:seed` and `npm run db:verify` must stay green; builds/lint/typecheck must be clean before commit.
- Secrets stay out of the repo; env lives in `.env.local` (ignored) and Vercel project variables.
- Email/password signups require email confirmation (autoconfirm is off in production); Google OAuth users are verified by Google.
