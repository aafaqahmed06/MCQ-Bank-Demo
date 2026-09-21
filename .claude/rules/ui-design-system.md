---
paths: ["components/**", "app/**/*.tsx", "app/**/*.jsx", "styles/**", "app/globals.css", "tailwind.config.*"]
---

# DiagKnow — Design System Rules

Full spec: `docs/UI_UPGRADE.md`. This file holds the system-level rules —
tokens, components, states — that apply no matter which page you're touching.
For page-specific layouts and content, see `.claude/rules/ui-upgrade-plan.md`.

Before editing any component covered here, work through the guardrails in
section 9 below.

---

## 1. Stop making everything a card

The biggest source of "vibe-coded" appearance is excessive card usage. Do
**not** default to:

```tsx
<div className="rounded-xl border bg-card p-6 shadow-sm">
```

Use four visual levels instead:

- **Level 0 — Canvas.** The page itself. No border, no card. Page
  background, reading space, large layouts.
- **Level 1 — Section.** A semantic grouping made with typography, spacing,
  dividers, and alignment — not a box.
- **Level 2 — Interactive Surface.** For something the user can actually
  select (a topic row, a clickable stat).
- **Level 3 — Elevated Surface.** Reserved for important actions or
  information: Continue Practice, Smart Practice, exam launch, warnings,
  results, key insights. If everything is elevated, nothing is.

## 2. Design tokens

Centralize tokens before touching pages. Components consume semantic tokens,
never hard-coded values.

**Color** — semantic, not page-specific:

```
background, surface, surface-secondary, surface-elevated
text-primary, text-secondary, text-tertiary, text-disabled
border-subtle, border-default, border-strong
primary, primary-hover, primary-active
success, warning, error, info
```

Bad: `text-[#00B8A9]`, `border-[#00B8A9]/30`
Better: `text-primary`, `border-primary/30`

**Spacing scale** (avoid arbitrary values):

```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
```

Inconsistent spacing (`p-5` here, `p-7` there, `p-[18px]` somewhere else) is
what makes an interface feel assembled instead of designed.

**Radius scale** (semantic, not ad hoc `rounded-lg`/`rounded-xl`/`rounded-2xl`
picked per component):

```
6px   badges / tiny controls
10px  buttons / inputs
12px  compact surfaces
14px  interactive surfaces
16px  major cards
20px  hero surfaces
24px  large compositions
```

**Typography scale:**

```
Display    40–48px
H1         30–36px
H2         22–26px
H3         16–18px
Body       15–16px
Metadata   13–14px
Caption    11–12px
```

Weights: 400 body, 500 emphasis, 600 headings/important data, 700 rare
emphasis. Do not make everything bold — hierarchy should come from scale and
weight, not from `font-bold` on every label.

**Shadow/border rules:**

```
Level 0: none
Level 1: extremely subtle
Level 2: subtle
Level 3: obvious but restrained
```

Avoid `shadow-xl`/`shadow-2xl` everywhere. Borders are semantic: `subtle`,
`default`, `strong` — don't invent a slightly different border color per
component.

## 3. Component architecture

```
components/
  ui/
    Button, IconButton, Input, Select, Badge, Progress, Card, Surface,
    Tabs, Modal, Toast, Tooltip, Avatar, Skeleton, EmptyState, ErrorState,
    Breadcrumbs, Stat, StatGroup
  features/
    dashboard/, curriculum/, practice/, exam/, results/, leaderboard/,
    bookmarks/, account/, onboarding/
```

Use component variant APIs instead of repeated one-off styling:

```tsx
<Card variant="default" | "interactive" | "elevated" | "highlight" | "danger" />
<Button variant="primary" | "secondary" | "ghost" | "danger" | "link" />
<Progress variant="default" | "success" | "warning" | "danger" />
```

## 4. Icon system

One icon family throughout (Lucide is fine). Standardize size, stroke width,
alignment, hover/focus/disabled behavior. Never mix Unicode arrows, inline
SVGs, other icon libraries, and emoji for the same semantic purpose — e.g.
don't use `→` in one place and a different arrow icon elsewhere for the same
action. Wrap as `<Icon />` / `<IconButton />`.

## 5. Brand motifs — use sparingly

Only a few recurring motifs, each meaningful, not wallpaper:

- **Diagnostic grid** — subtle background grid for select landing sections,
  dashboard hero, major empty states.
- **Clinical accent line** — restrained teal accent for progress, active
  states, section markers.
- **Diagnostic nodes** — subtle connected-node motif for curriculum,
  mastery, weak areas, Smart Practice.

## 6. Dark mode

Premium and clinical, not neon:

```
Background       #0B1115
Surface 1        #10181D
Surface 2        #151F25
Surface 3        #1A262D
Text primary     #F1F6F7
Text secondary   #A9BBC2
Text tertiary    #72858D
```

Teal indicates active/selected/progress/primary actions/meaningful
highlights only. Avoid glowing borders, cyan text everywhere, neon
gradients, excessive glow, cyberpunk styling.

## 7. Light mode

Cool clinical neutrals, not a floating-white-rectangle look:

```
Background       #F7F9F8
Surface          #FFFFFF
Surface 2        #F1F5F4
Border           #DCE5E4
```

## 8. Motion

```
instant       100ms
micro         150ms
standard      200ms
transition    300ms
emphasis      450ms
```

Hover: `translateY(-1px)`. Modal: opacity + subtle scale. Page transition:
opacity + 4px translation. Progress: width transition. Do not animate
everything — motion should communicate state, continuity, causality, or
feedback, nothing else.

## 9. System states (apply everywhere)

**Loading** — replace generic "Loading..." text with skeletons whose
geometry resembles the actual content (dashboard, curriculum, leaderboard,
question, results, profile each need their own skeleton).

**Empty states** — every one must answer: what happened, why is it empty,
what should I do. Example:

```
No bookmarked questions
Questions you save while practicing will appear here.
[ Start practicing ]
```

Use D.K. only when it genuinely improves the experience, not by default.

**Error states** — understandable, actionable, calm, reassuring. Instead of
"Failed to start exam":

```
We couldn't start your exam
Something went wrong while preparing your question set.
Your previous progress is safe.
[ Try again ]
```

**Toasts** — centralized system. Desktop top-right, mobile bottom, short
duration, semantic icon, accessible announcement, consistent animation.

**Accessibility** — visible focus, sufficient contrast, 44px minimum touch
targets, semantic headings, `aria-live` for answer feedback, modal focus
trapping, Escape to close, full keyboard navigation, accessible progress
indicators, correctness never conveyed by color alone, reduced-motion
support.

## 10. "Vibe-coded smell" checklist

Actively search for and reduce: `rounded-xl`/`rounded-2xl` everywhere,
arbitrary padding/gaps/colors, repeated or nested card wrappers, repeated
teal borders, excessive shadows/gradients/centered layouts, giant headings,
generic arrows, inconsistent icons or button sizes, unnecessary animation,
multiple primary CTAs, generic empty/loading states, one-off design tokens.

Prefer: semantic variants, typography hierarchy, meaningful whitespace,
deliberate density, consistent icons, meaningful elevation, data-driven UI,
semantic states, reusable components, predictable spacing and interaction
patterns.

## 11. Guardrails — before modifying any component

Work through these in order:

1. Is this a new visual pattern? If yes, does it belong in the design
   system (this file), or is it truly one-off?
2. Does an existing component already solve this? If yes, extend it —
   don't create a parallel one.
3. Am I improving hierarchy or adding decoration? Prefer hierarchy.
4. Does this actually need a card? If not, don't use one.
5. Does this need a border? If not, don't add one.
6. Does this need animation? If not, don't add one.
7. Does this need a new color? If not, use an existing token.
8. Does this need a new radius? If not, use an existing token.

A component is not done because it has nicer colors, more animation,
gradients, rounded cards, or larger type. It's done when hierarchy is
immediately understandable, the primary action is obvious, states
(loading/empty/error/focus) are designed, spacing and typography are
consistent, and it uses design-system variants rather than one-off styling.
