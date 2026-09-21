# DiagKnow — UI Upgrade Plan (North Star, Pages, Phases)

Full spec: `docs/UI_UPGRADE.md`. Design tokens, components, and system-wide
states live in `.claude/rules/ui-design-system.md` (auto-attached when you
touch frontend files) — read that first for *how* to build anything here.
This file is *what* to build, page by page, and in what order. Not
auto-attached: reference it explicitly per session, e.g. "implement Phase 3
(Dashboard) per this file's Dashboard and Topic Health sections."

---

## North star

DiagKnow should feel like **a clinical learning instrument that happens to
be software** — not a generic SaaS dashboard that happens to contain medical
questions. The UI should constantly communicate:

**Know where you are. Know how you're doing. Know what you don't know.
Know what to do next.**

That means the product's strongest visual differentiator is its
understanding of curriculum, progress, weaknesses, practice history, exam
performance, and next-best study action — not decoration.

## Design personality

Precise, intelligent, clinical, modern, trustworthy, academically serious,
focused, technologically sophisticated, calm rather than flashy. Not
generic SaaS, fintech, gaming UI, an AI chatbot wrapper, a neon dashboard,
or a pile of unrelated Tailwind components.

## How to prompt this work

Never say "make the UI more professional / premium / prettier" — that
invites arbitrary styling. Instead, frame each session as:

> Implement the following design system and page hierarchy. Preserve
> existing functionality, backend contracts, data structures,
> authentication, routing, and accessibility. Reuse existing components
> where appropriate. Create reusable variants rather than one-off styles.
> Do not introduce fake data or change product semantics.

Before writing anything for a page, inventory what already exists there
against `.claude/rules/ui-design-system.md` — don't assume a blank slate.

---

## Application shell

**Desktop nav** prioritizes high-frequency actions: Home, Practice, Exams,
Progress up front; Bookmarks, Help, Theme, Profile pushed right.
Account/settings live behind the profile menu.

**Mobile** gets its own bottom nav (Home, Practice, Exam, Progress, Me) —
don't just collapse the desktop navbar into a hamburger.

## Dashboard

The strongest screen in the app. Hierarchy: Continue learning → Progress →
Weaknesses → Quick actions → Recent activity → Secondary information.
**One dominant action** — Practice, Exam, Leaderboard, Bookmarks, and
Progress should not all look like equally-important giant cards.

```
Good evening, Aafaq
MBBS · Year 1

CONTINUE                          THIS WEEK
Anatomy                           78% accuracy
Thorax → Mediastinum              ▁▃▅▃▆▇▅  +12% vs last week
███████████░░ 72%
[ Continue Practice → ]

YOUR CURRICULUM
Anatomy 82%   Physiology 64%   Biochemistry 41%   Minor Subjects 23%

FOCUS NEXT — 3 topics need review
[ Practice weak topics ]

RECENT ACTIVITY ...
```

### Continue Practice

Feels like a persistent session, not a generic button — show topic,
sub-topic, question count, progress bar, last-studied time, and (where
available) accuracy and weakness indicator.

## Curriculum

Keep the Block → Module → Topic hierarchy, but raise information density.
Each unit shows name, topic count, question count, completion %, weakness
signal, recent activity, and a navigation affordance — not just a label in
a button.

### Topic Health

Make weakness detection first-class:

```
YOUR TOPIC HEALTH
Anatomy      ██████████████░░ 87%
Physiology   ██████████░░░░░░ 64%
Biochemistry ███████░░░░░░░░░ 48%
Pathology    ███░░░░░░░░░░░░░ 21%
3 topics need attention
[ Review weak areas → ]
```

Semantic states: `mastered`, `strong`, `developing`, `needs-review`,
`unattempted`. Never rely on color alone.

### Surface useful metadata everywhere

"Anatomy" → "Anatomy · 18 topics · 240 questions · 78% complete". "Smart
Practice" → "Smart Practice · 24 questions weighted toward your weakest
topics". "Bookmarks" → "Bookmarks · 23 saved questions". This is how the UI
signals DiagKnow is an intelligent system, not just a question database.

## MCQ interface (highest-polish surface in the app)

**Header** stays quiet: `ANATOMY · THORAX` / `Question 12 / 40` / `30%`.
The question dominates — readable width (760–820px), no unnecessary nested
cards.

**Answer options** are large, deliberate targets with explicit states:
default, hover, focus, selected, correct, incorrect, disabled.

**Feedback** is immediate: `✓ CORRECT` / `✕ INCORRECT`, then flows straight
into the explanation — not a modal interrupting the flow.

**Explanation** reads as a teaching layer, not another card:

```
WHY THIS IS CORRECT
The phrenic nerve originates from C3–C5 and provides motor
innervation to the diaphragm.

CLINICAL PEARL
C3, C4, C5 keep the diaphragm alive.
```

**Keyboard shortcuts:** A–E select, Enter submit, → next question, B
bookmark, R report. Show a subtle hint (`A–E select · Enter submit`); never
interfere with typing into inputs.

**Question progress:** more than a percentage — answered/current/
unanswered/incorrect/bookmarked states, e.g. `12 / 50  24%` plus a dot
strip. Exams get a full question navigator.

## Exam mode

Visually distinct from normal practice: timer, question navigator (jump
navigation, answered/unanswered status), previous/next, submit
confirmation, responsive two-pane layout (question + navigator sidebar).

**Exam selection** communicates commitment, not just length:

```
20 QUESTIONS · Quick Check · ~20 min · Rapid revision
50 QUESTIONS · Standard Exam · ~50 min · Balanced simulation
100 QUESTIONS · Full Simulation · ~100 min · Exam endurance
```

## Results

Must answer: How did I perform? Where did I struggle? What should I study
next? Can I review my mistakes?

```
EXAM COMPLETE
78%  39/50  78% accuracy  +6% vs previous exam
CORRECT 39   INCORRECT 11   TIME 43m

PERFORMANCE BY AREA
Anatomy 87%   Physiology 72%   Biochemistry 48%

FOCUS NEXT — 3 topics need review
[ Review weak topics ]
[ Review answers ]  [ New exam ]
```

The educational value is the diagnosis after the score, not the score
alone.

## Mistakes

Dedicated experience driven by performance data — most-missed topics
ranked, `[ Practice mistakes ]` CTA. Consider promoting to a primary nav
destination.

## Bookmarks

A study tool, not a saved-list dump: filter by subject, open/remove/
practice-the-collection.

## Recent activity

Compact timeline, grouped by day (Today / Yesterday). Don't over-design —
it's supporting information, not a hero surface.

## D.K. (mascot)

A product character with a job — **guide → react → explain → motivate** —
not a decoration. Present at: onboarding ("Let's get your curriculum set
up"), correct-answer reactions, weak-topic nudges, streaks, contextual
results reactions, and empty states. Don't put D.K. everywhere — presence
should be meaningful.

## Authentication

Branded, not a default auth-library form: split layout with DiagKnow
identity/tagline on one side, the actual sign-in form on the other. Single
column on mobile.

## Onboarding

Deliberate three-step progression (You → Your Curriculum → Ready) with a
subtle step indicator. Step 1 is name; step 2 is college/program/year; step
3 confirms and hands off to `[ Start practicing ]`.

## Settings

Replace giant generic cards with a settings hierarchy: Profile, Preferences
(appearance, motion), Security (email, password, sessions), Danger Zone
(delete account) as labeled row-groups, not stacked cards.

## Leaderboard

Restrained — rank + trend at top, ranked list below, the user's own row
visually distinct. Avoid turning medical education into an arcade.

## Landing page

Hero communicates the product in seconds: headline (`Know what you don't
know before the exam does`), subhead, two CTAs (`Start practicing` /
`Explore curriculum`), a real interface screenshot, product facts (question
count, topic count, block count), a "why DiagKnow" 4-point list, then a
live MCQ demo. The interface itself is the marketing asset.

## Mobile

A dedicated pass, not just breakpoints: 44px+ touch targets, readable MCQ
text, sticky controls where useful, its own nav model, compact progress,
usable exam navigator, no horizontal overflow, no microscopic metadata, no
desktop layout squeezed onto a phone.

---

## Implementation order

Don't attempt this in one giant prompt. Work phase by phase, foundation
first:

1. **Design foundation** — tokens, Button/Card/Surface variants, Badge,
   Progress, icon system, Skeleton, Toast, EmptyState, ErrorState, Modal,
   Tooltip. No page redesigns yet.
2. **Application shell** — navbar, mobile nav, page containers, background,
   theme system, footer.
3. **Dashboard** — Continue, Progress, Weakness, Quick actions, Recent
   activity, Leaderboard.
4. **Curriculum** — Blocks → Modules → Topics.
5. **Practice** — question header/typography, options, feedback,
   explanation, bookmark, report, navigation, keyboard interaction,
   progress.
6. **Exams** — timer, navigator, answer states, jump navigation, submit
   confirmation, responsive workspace.
7. **Results** — score, performance breakdown, trend, weak areas, answer
   review, next action.
8. **Secondary pages** — bookmarks, mistakes, leaderboard, onboarding,
   authentication, account, settings, legal.
9. **Polish** — microinteractions, transitions, skeletons, empty/error/
   focus states, responsive edge cases, accessibility, performance, visual
   consistency.

## Priority matrix (if time is limited)

| Priority | Area                        | Impact      |
|---------:|------------------------------|-------------|
| 1        | Design-token system          | Very High   |
| 2        | Surface/card hierarchy       | Very High   |
| 3        | Dashboard                    | Very High   |
| 4        | MCQ experience                | Very High   |
| 5        | Curriculum                   | Very High   |
| 6        | Exam workspace                | Very High   |
| 7        | Results                      | Very High   |
| 8        | Typography                   | High        |
| 9        | Mobile navigation             | High        |
| 10       | Loading/error/empty states   | High        |
| 11       | Icon system                  | Medium-High |
| 12       | D.K. integration              | Medium-High |
| 13       | Motion                       | Medium      |
| 14       | Mistakes/bookmarks            | Medium      |
| 15       | Landing page                 | Medium      |
| 16       | Account/settings               | Medium      |
| 17       | Search/command interface     | Low for V1  |

## Definition of done (per page)

Not done because it has nicer colors, more animation, gradients, rounded
cards, or bigger type. Done when: hierarchy is immediately understandable,
primary action is obvious, content density is appropriate, major states
(loading/empty/error/focus) are designed, spacing and typography are
consistent, components use design-system variants, mobile behavior is
intentional, keyboard/focus behavior works, and the page still feels
unmistakably like DiagKnow.

## Final visual QA (ask after each phase)

1. Does this look like a developer built a functional MCQ app? If yes,
   keep refining.
2. Does this look like a generic SaaS dashboard? If yes, reduce card
   usage, reduce decorative effects, strengthen information hierarchy.
3. Could you identify DiagKnow from a screenshot without the logo? If no,
   strengthen recurring motifs, typography, interaction patterns, and the
   curriculum/weakness visual model.
4. Can a medical student immediately tell what to do next? If no,
   simplify hierarchy, strengthen the primary CTA, expose relevant
   context.
5. Does the interface make DiagKnow's intelligence visible — curriculum
   awareness, mastery, weakness detection, adaptive practice, exam
   performance, recommended next action? If no, the UI is still just a
   presentation layer over the data.
