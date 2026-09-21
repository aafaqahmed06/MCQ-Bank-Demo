# DiagKnow — UI Professionalization & Design System Upgrade

> **Source of truth.** This is the full spec, kept here for human reading and
> history. Claude Code doesn't load this automatically — for actual agent
> sessions, use the split files instead:
> - `.claude/rules/ui-design-system.md` — tokens, components, system rules (auto-attaches when frontend files are touched)
> - `.claude/rules/ui-upgrade-plan.md` — north star, page specs, phased rollout (reference explicitly per phase)

> **Objective:** Transform the current DiagKnow frontend from a functional, vibe-coded medical MCQ app into a cohesive, production-grade medical learning product.
>
> **Core principle:** Do not merely make the UI "prettier." Establish a visual system, information hierarchy, interaction language, and component architecture that makes DiagKnow feel intentionally designed.

---

## 1. North Star

DiagKnow should feel like:

> **A clinical learning instrument that happens to be software.**

Not:

> A generic SaaS dashboard that happens to contain medical questions.

The UI should communicate four things constantly:

**Know where you are.
Know how you're doing.
Know what you don't know.
Know what to do next.**

The product's strongest visual differentiator should therefore be its understanding of:

* curriculum
* progress
* weaknesses
* practice history
* exam performance
* next-best study action

---

## 2. Design Personality

DiagKnow should feel:

* precise
* intelligent
* clinical
* modern
* trustworthy
* academically serious
* focused
* technologically sophisticated
* calm rather than flashy

It should **not** feel like:

* generic SaaS
* fintech
* gaming UI
* an AI chatbot wrapper
* a futuristic neon dashboard
* a collection of unrelated Tailwind components

The interface should have personality without becoming decorative.

---

## 3. First Principle: Stop Making Everything a Card

One of the biggest sources of the "vibe-coded" appearance is excessive card usage.

Do **not** automatically wrap every conceptual unit in:

```tsx
<div className="rounded-xl border bg-card p-6 shadow-sm">
```

That pattern should become rare.

Instead establish four visual levels.

### Level 0 — Canvas

The page itself.

No border.

No card.

Used for:

* page background
* reading space
* large layouts

### Level 1 — Section

A semantic grouping created primarily through:

* typography
* spacing
* dividers
* alignment

Example:

```text
YOUR PROGRESS

342 questions     78% accuracy     12 exams
```

### Level 2 — Interactive Surface

Used for something the user can actually select.

Example:

```text
Anatomy                                      →

18 topics · 240 questions

██████████████░░ 78%
```

### Level 3 — Elevated Surface

Reserve this for important actions or information:

* Continue Practice
* Smart Practice
* Exam launch
* important warnings
* results
* key insights

If everything is elevated, nothing is elevated.

---

## 4. Establish Design Tokens Before Redesigning Pages

Do not redesign every page independently.

Create a centralized design system first.

### 4.1 Color tokens

Use semantic tokens rather than page-specific colors.

```text
background
surface
surface-secondary
surface-elevated

text-primary
text-secondary
text-tertiary
text-disabled

border-subtle
border-default
border-strong

primary
primary-hover
primary-active

success
warning
error
info
```

Components should consume semantic tokens rather than hard-coded colors.

Bad:

```tsx
text-[#00B8A9]
border-[#00B8A9]/30
```

Better:

```tsx
text-primary
border-primary/30
```

---

## 5. Spacing System

Use a deliberate spacing scale.

Recommended:

```text
4
8
12
16
20
24
32
40
48
64
80
96
```

Avoid arbitrary values unless there is a genuine design requirement.

A major source of professional polish is **rhythm**.

If one card uses:

```text
p-5
```

another:

```text
p-7
```

another:

```text
px-6 py-4
```

and another:

```text
p-[18px]
```

the interface will feel assembled rather than designed.

---

## 6. Radius System

Do not use the same radius everywhere.

Suggested semantic scale:

```text
6px   badges / tiny controls
10px  buttons / inputs
12px  compact surfaces
14px  interactive surfaces
16px  major cards
20px  hero surfaces
24px  large compositions
```

The exact values can be tuned, but they must be tokens.

Avoid:

```text
rounded-lg
rounded-xl
rounded-2xl
rounded-3xl
```

being chosen ad hoc by individual components.

---

## 7. Typography

Typography should establish hierarchy before borders and shadows do.

Recommended scale:

```text
Display    40–48px
H1         30–36px
H2         22–26px
H3         16–18px

Body       15–16px
Metadata   13–14px
Caption    11–12px
```

Recommended weights:

```text
400 — body
500 — emphasis
600 — headings / important data
700 — rare emphasis
```

Avoid making everything bold.

The most important information should be obvious because of hierarchy, not because every label is `font-bold`.

---

## 8. Surface and Shadow Rules

Shadows should communicate elevation, not decoration.

Use approximately:

```text
Level 0: none
Level 1: extremely subtle
Level 2: subtle
Level 3: obvious but restrained
```

Avoid:

```text
shadow-xl
shadow-2xl
```

everywhere.

Borders should also be semantic:

```text
subtle
default
strong
```

Do not invent a slightly different border color for every component.

---

## 9. Component Architecture

Create a reusable UI system.

Recommended:

```text
components/
  ui/
    Button
    IconButton
    Input
    Select
    Badge
    Progress
    Card
    Surface
    Tabs
    Modal
    Toast
    Tooltip
    Avatar
    Skeleton
    EmptyState
    ErrorState
    Breadcrumbs
    Stat
    StatGroup
```

Feature-specific components:

```text
components/
  features/
    dashboard/
    curriculum/
    practice/
    exam/
    results/
    leaderboard/
    bookmarks/
    account/
    onboarding/
```

---

## 10. Component Variants

Use component APIs instead of repeated styling.

For example:

```tsx
<Card variant="default" />
<Card variant="interactive" />
<Card variant="elevated" />
<Card variant="highlight" />
<Card variant="danger" />
```

Buttons:

```tsx
<Button variant="primary" />
<Button variant="secondary" />
<Button variant="ghost" />
<Button variant="danger" />
<Button variant="link" />
```

Progress:

```tsx
<Progress variant="default" />
<Progress variant="success" />
<Progress variant="warning" />
<Progress variant="danger" />
```

This ensures the design language remains coherent as the codebase grows.

---

## 11. Icon System

Use one icon family throughout the application.

Lucide is a reasonable choice.

Standardize:

* size
* stroke width
* alignment
* semantic meaning
* hover behavior
* focus behavior
* disabled behavior

Avoid mixing:

```text
Unicode arrows
inline SVGs
different icon libraries
emoji
random icon assets
```

For example, do not use `→` in one place and a completely different arrow icon elsewhere for the same action.

Create:

```tsx
<Icon />
<IconButton />
```

and semantic icon wrappers where useful.

---

## 12. Application Shell

The shell should establish DiagKnow's identity before users even reach the content.

### Desktop navigation

Prioritize high-frequency actions:

```text
DIAGKNOW

Home
Practice
Exams
Progress

                          Bookmarks
                          Help
                          Theme
                          Profile
```

Account/settings should live behind the profile menu.

### Mobile

Consider:

```text
Home
Practice
Exam
Progress
Me
```

as bottom navigation.

Do not simply collapse the desktop navbar into a hamburger.

Mobile should have its own interaction model.

---

## 13. Dashboard

The dashboard should become the strongest screen in the application.

The hierarchy should be:

1. Continue learning
2. Progress
3. Weaknesses
4. Quick actions
5. Recent activity
6. Secondary information

Suggested structure:

```text
Good evening, Aafaq

MBBS · Year 1

┌─────────────────────────────────────┬──────────────────────┐
│ CONTINUE                            │ THIS WEEK            │
│                                     │                      │
│ Anatomy                             │ 78% accuracy         │
│ Thorax → Mediastinum                │                      │
│                                     │ ▁▃▅▃▆▇▅              │
│ ███████████░░ 72%                   │ +12% vs last week    │
│                                     │                      │
│ [ Continue Practice → ]             │                      │
└─────────────────────────────────────┴──────────────────────┘

YOUR CURRICULUM

Anatomy             Physiology
████████░░ 82%      ██████░░░░ 64%

Biochemistry        Minor Subjects
████░░░░░░ 41%      ██░░░░░░░░ 23%

FOCUS NEXT

3 topics need review

[ Practice weak topics ]

RECENT ACTIVITY

...
```

### Important

There should be **one dominant action**.

Do not make:

* Practice
* Exam
* Leaderboard
* Bookmarks
* Progress

all look like equally important giant cards.

---

## 14. Continue Practice

This should feel like a persistent learning session.

Display:

```text
CONTINUE PRACTICING

Anatomy
Thorax → Mediastinum

Question 37 / 52

██████████████░░░░

Last studied 2 hours ago

[ Continue → ]
```

Where available, expose:

* accuracy
* remaining questions
* last activity
* topic
* weakness indicator

This is much stronger than a generic "Continue" button.

---

## 15. Curriculum

Keep the information architecture:

```text
Block
 ↓
Module
 ↓
Topic
```

But improve information density.

Instead of:

```text
[ Anatomy ]
[ Physiology ]
[ Biochemistry ]
```

use:

```text
FOUNDATION BLOCK

01  Anatomy

    12 / 18 topics
    ████████████░░

    240 questions · 78% complete

                                      →
```

Each unit should communicate:

* name
* topic count
* question count
* completion
* weakness
* recent activity where relevant
* navigation affordance

---

## 16. Topic Health

Make weakness detection a first-class visual concept.

Example:

```text
YOUR TOPIC HEALTH

Anatomy
██████████████░░ 87%

Physiology
██████████░░░░░░ 64%

Biochemistry
███████░░░░░░░░░ 48%

Pathology
███░░░░░░░░░░░░░ 21%

3 topics need attention

[ Review weak areas → ]
```

Use semantic states:

```text
mastered
strong
developing
needs-review
unattempted
```

Never rely exclusively on color.

---

## 17. Surface Useful Metadata

DiagKnow contains valuable information. Surface it.

Instead of:

```text
Anatomy
```

show:

```text
Anatomy
18 topics · 240 questions · 78% complete
```

Instead of:

```text
Smart Practice
```

show:

```text
Smart Practice
24 questions weighted toward your weakest topics
```

Instead of:

```text
Bookmarks
```

show:

```text
Bookmarks
23 saved questions
```

This is how the UI communicates that DiagKnow is an intelligent learning system rather than just an MCQ database.

---

## 18. MCQ Interface

The MCQ interface is the single most important interaction surface.

It deserves the highest level of polish.

### Header

```text
ANATOMY · THORAX

Question 12 / 40                         30%
```

Keep it quiet.

The question itself should dominate.

### Question

Use a readable content width:

```text
760–820px
```

Avoid wrapping the question in unnecessary nested cards.

Medical content needs reading space.

---

## 19. Answer Options

Each answer should be a large, deliberate interaction target.

Example:

```text
┌──────────────────────────────────────────────┐
│ A    Right phrenic nerve                    │
│                                              │
│                                          ○   │
└──────────────────────────────────────────────┘
```

Selected:

```text
┌──────────────────────────────────────────────┐
│ A ✓  Right phrenic nerve                    │
└──────────────────────────────────────────────┘
```

Every option needs explicit states:

```text
default
hover
focus
selected
correct
incorrect
disabled
```

---

## 20. Answer Feedback

Feedback should feel immediate and educational.

Correct:

```text
✓ CORRECT
```

Incorrect:

```text
✕ INCORRECT
```

Then transition naturally into the explanation.

Avoid making feedback feel like a modal interrupting the learning flow.

---

## 21. Explanation

Do not put every explanation inside another generic rounded card.

Instead:

```text
WHY THIS IS CORRECT

The phrenic nerve originates from C3–C5
and provides motor innervation to the diaphragm.

CLINICAL PEARL

C3, C4, C5 keep the diaphragm alive.
```

Use:

* clear section labels
* readable body text
* whitespace
* subtle dividers
* semantic emphasis

The explanation should feel like a teaching layer.

---

## 22. Keyboard Shortcuts

Desktop practice should support rapid interaction.

Recommended:

```text
A–E
Select answer

Enter
Submit

Arrow Right
Next question

B
Bookmark

R
Report
```

Display subtle contextual hints:

```text
A–E select · Enter submit
```

Do not interfere with typing into inputs.

---

## 23. Question Progress

Basic percentage indicators are insufficient.

Use meaningful progress.

```text
12 / 50                              24%

● ● ● ● ● ● ● ● ○ ○ ○ ○ ○ ...
```

Support:

```text
answered
current
unanswered
incorrect
bookmarked
```

For exams, provide a proper question navigator.

---

## 24. Exam Mode

Exam mode should visually distinguish itself from normal practice.

Suggested layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ DIAGKNOW     Standard Exam                 42:18 remaining  │
├──────────────────────────────────────┬───────────────────────┤
│                                      │ QUESTIONS             │
│ Q42                                  │                       │
│                                      │ 39 40 41 [42] 43     │
│ Which of the following...            │ 44 45 46 47 48       │
│                                      │                       │
│ A ○ ...                              │                       │
│ B ○ ...                              │                       │
│ C ○ ...                              │                       │
│ D ○ ...                              │                       │
│ E ○ ...                              │                       │
│                                      │                       │
│ [← Previous]          [Next →]       │ [Submit exam]         │
└──────────────────────────────────────┴───────────────────────┘
```

Support:

* timer
* question navigator
* jump navigation
* answered/unanswered status
* previous/next
* submit confirmation
* responsive layout

---

## 25. Exam Selection

Do not present exam lengths as generic buttons.

Communicate the commitment.

```text
20 QUESTIONS
Quick Check

~20 min
Rapid revision


50 QUESTIONS
Standard Exam

~50 min
Balanced simulation


100 QUESTIONS
Full Simulation

~100 min
Exam endurance
```

When selected:

```text
50 questions
50 minutes
Instant grading
Full review

[ Start exam ]
```

---

## 26. Results

The results page should answer four questions:

1. How did I perform?
2. Where did I struggle?
3. What should I study next?
4. Can I review my mistakes?

Suggested hierarchy:

```text
EXAM COMPLETE

78%

39 / 50
78% accuracy

+6% vs previous exam

CORRECT        INCORRECT        TIME
39             11               43m


PERFORMANCE BY AREA

Anatomy
███████████████░ 87%

Physiology
███████████░░░░░ 72%

Biochemistry
███████░░░░░░░░░ 48%


FOCUS NEXT

3 topics need review

[ Review weak topics ]

[ Review answers ]    [ New exam ]
```

Do not make the result page merely a giant score.

The educational value is in the diagnosis after the score.

---

## 27. Mistakes

Consider a dedicated mistakes experience.

```text
MY MISTAKES

42 questions missed


MOST COMMON WEAK AREAS

Anatomy
████████████

Physiology
███████

Biochemistry
████


[ Practice mistakes ]
```

This should be directly driven by performance data.

Potentially make this one of the major navigation destinations.

---

## 28. Bookmarks

Bookmarks should be a useful study tool, not merely a saved-list database.

```text
BOOKMARKS

23 saved questions

[ All ] [ Anatomy ] [ Physiology ] [ Biochemistry ]


Question...
Question...
Question...


[ Practice bookmarked questions ]
```

Support:

* filtering
* sorting where useful
* opening the question
* removing bookmark
* practicing the collection

---

## 29. Recent Activity

Use a compact activity timeline.

```text
RECENT ACTIVITY

Today

✓ Completed Thorax — 82%
✓ Practiced Cardiac Cycle — 76%
🔖 Bookmarked 3 questions

Yesterday

✓ Anatomy block — 74%
```

Don't over-design this.

It is supporting information.

---

## 30. D.K. Bot

D.K. should be a **product character**, not a decoration.

The mascot should have a job:

**guide → react → explain → motivate**

### Onboarding

> Let's get your curriculum set up.

### Correct answer

> Nice. That's one down.

### Weak topic

> You've missed several questions from this topic. Let's fix that.

### Streak

> Three days in a row. Keep it going.

### Results

React contextually to the result.

### Empty state

Explain what the student can do next.

Do not put D.K. everywhere.

Presence should be meaningful.

---

## 31. Authentication

Authentication should look branded rather than like a default Supabase form.

Concept:

```text
┌──────────────────────┬─────────────────────────────────────┐
│                      │                                     │
│      DIAGKNOW        │         Welcome back                │
│                      │                                     │
│       [D.K.]         │         Sign in to continue         │
│                      │                                     │
│  Know what you       │       [ Continue with Google ]      │
│  don't know.         │                                     │
│                      │                                     │
│                      │       ───── or ─────                 │
│                      │                                     │
│                      │       Email                         │
│                      │       Password                       │
│                      │                                     │
│                      │       [ Sign in ]                    │
└──────────────────────┴─────────────────────────────────────┘
```

Mobile should become a single-column composition.

---

## 32. Onboarding

Use a deliberate progression.

```text
1 — YOU
2 — YOUR CURRICULUM
3 — READY
```

Step 1:

```text
Name
```

Step 2:

```text
College
Program
Year
```

Step 3:

```text
You're all set.

MBBS
Year 1
[Institution]

[ Start practicing ]
```

Use a subtle step indicator.

---

## 33. Settings

Replace large generic cards with a settings hierarchy.

```text
ACCOUNT

PROFILE
────────────────────────────────

Name
College
Program
Year

Edit


PREFERENCES
────────────────────────────────

Appearance                 Dark
Motion                    Standard


SECURITY
────────────────────────────────

Email
Password
Sessions


DANGER ZONE
────────────────────────────────

Delete account
```

Rows should feel like settings rows, not giant cards.

---

## 34. Leaderboard

Keep it restrained.

```text
YOUR RANK

#18
+4 this week


TOP STUDENTS

1   Student       92%
2   Student       90%
3   Student       88%

...

18  YOU           74%
```

The user's own row should have a distinct treatment.

Avoid turning medical education into an arcade.

---

## 35. Landing Page

The landing page needs to communicate the product in seconds.

Suggested hero:

```text
DIAGKNOW

Know what you don't know
before the exam does.

Curriculum-aware practice for MBBS.

[ Start practicing ]    [ Explore curriculum ]
```

Then:

```text
[ Polished product screenshot / interface composition ]
```

Then product facts:

```text
1,500+ questions
X topics
Y curriculum blocks
```

Then:

```text
WHY DIAGKNOW?

01  Curriculum-aware
02  Weakness-driven
03  Exam simulation
04  Built for MBBS
```

Then demonstrate an actual MCQ.

The interface itself should be the marketing asset.

---

## 36. Brand Motifs

Create only a few recurring motifs.

### Diagnostic grid

A very subtle background grid for selected:

* landing sections
* dashboard hero
* major empty states

### Clinical accent line

A restrained teal accent for:

* progress
* active states
* section markers

### Diagnostic nodes

A subtle connected-node motif representing:

* curriculum
* mastery
* weak areas
* Smart Practice

Do not use these motifs on every component.

A brand motif loses power when it becomes wallpaper.

---

## 37. Dark Mode

Dark mode should feel premium and clinical.

Conceptual palette:

```text
Background       #0B1115
Surface 1        #10181D
Surface 2        #151F25
Surface 3        #1A262D

Text primary     #F1F6F7
Text secondary   #A9BBC2
Text tertiary    #72858D
```

Teal should primarily indicate:

* active
* selected
* progress
* primary actions
* meaningful highlights

Avoid:

* glowing borders everywhere
* cyan text everywhere
* neon gradients
* excessive glow
* cyberpunk styling

---

## 38. Light Mode

Conceptual palette:

```text
Background       #F7F9F8
Surface          #FFFFFF
Surface 2        #F1F5F4
Border           #DCE5E4
```

Use cool clinical neutrals.

Do not make every component look like a floating white rectangle.

---

## 39. Motion

Create a formal motion system.

Recommended:

```text
instant       100ms
micro         150ms
standard      200ms
transition    300ms
emphasis      450ms
```

Examples:

### Hover

```text
translateY(-1px)
```

### Modal

```text
opacity + subtle scale
```

### Page transition

```text
opacity + 4px translation
```

### Progress

```text
width transition
```

### Success

Subtle emphasis.

Do not animate everything.

Motion should communicate:

* state
* continuity
* causality
* feedback

---

## 40. Loading States

Replace generic:

```text
Loading...
```

with skeletons where appropriate.

Create skeleton variants for:

* dashboard
* curriculum
* leaderboard
* question
* results
* profile

Skeleton geometry should resemble the actual content.

---

## 41. Empty States

Every empty state should answer:

1. What happened?
2. Why is it empty?
3. What should I do?

Example:

```text
No bookmarked questions

Questions you save while practicing
will appear here.

[ Start practicing ]
```

Use D.K. only when it genuinely improves the experience.

---

## 42. Error States

Avoid technical dead ends.

Instead of:

```text
Failed to start exam
```

use:

```text
We couldn't start your exam

Something went wrong while preparing
your question set.

Your previous progress is safe.

[ Try again ]
```

Errors should be:

* understandable
* actionable
* calm
* reassuring
* technically useful where appropriate

---

## 43. Toast System

Centralize toast notifications.

Examples:

```text
✓ Answer saved

🔖 Added to bookmarks

✓ Report submitted

✓ Profile updated

⚠ Couldn't sync your progress
```

Requirements:

* desktop: top-right
* mobile: bottom
* short duration
* semantic icon
* accessible announcement
* consistent animation

---

## 44. Accessibility

Maintain and expand accessibility.

Requirements:

* visible focus
* sufficient contrast
* minimum 44px touch targets
* semantic headings
* `aria-live` for answer feedback
* modal focus trapping
* Escape to close modal
* keyboard navigation
* accessible progress indicators
* correctness cannot be communicated by color alone
* reduced-motion support

---

## 45. Mobile

Perform a dedicated mobile design pass.

Do not merely rely on CSS breakpoints.

Priorities:

* 44px+ touch targets
* readable MCQ text
* sticky controls where useful
* mobile navigation
* compact progress
* usable exam navigator
* no horizontal overflow
* no microscopic metadata
* no desktop layouts squeezed onto phones

The mobile product should feel intentionally designed.

---

## 46. "Vibe-Coded Smell" Checklist

Actively search the codebase for these.

### Reduce

* `rounded-xl` everywhere
* `rounded-2xl` everywhere
* arbitrary padding
* arbitrary gaps
* arbitrary colors
* repeated card wrappers
* nested cards
* repeated teal borders
* excessive shadows
* excessive gradients
* excessive centered layouts
* giant headings
* generic arrows
* inconsistent icons
* inconsistent button sizes
* unnecessary animation
* multiple primary CTAs
* generic empty states
* generic loading text
* one-off design tokens

### Prefer

* semantic variants
* typography hierarchy
* meaningful whitespace
* deliberate density
* consistent icons
* meaningful elevation
* data-driven UI
* semantic states
* reusable components
* predictable spacing
* predictable interaction patterns

---

## 47. AI Coding-Agent Rules

This document should be given to Claude/OpenCode/Cursor as a **design specification**, not merely inspiration.

### Never tell the agent:

> Make the UI more professional.

or:

> Make this look premium.

or:

> Make this page prettier.

Those instructions encourage arbitrary styling.

Instead tell the agent:

> Implement the following design system and page hierarchy. Preserve existing functionality, backend contracts, data structures, authentication, routing, and accessibility. Reuse existing components where appropriate. Create reusable variants rather than one-off styles. Do not introduce fake data or change product semantics.

---

## 48. AI Guardrails

Before modifying a component, the coding agent should determine:

### Is this a new visual pattern?

If yes, determine whether it belongs in the design system.

### Does an existing component solve this?

If yes, extend it.

### Am I improving hierarchy or adding decoration?

Prefer hierarchy.

### Does this actually need a card?

If not, don't use one.

### Does this need a border?

If not, don't add one.

### Does this need animation?

If not, don't add one.

### Does this need a new color?

If not, use an existing token.

### Does this need a new radius?

If not, use an existing token.

---

## 49. Implementation Order

Do not redesign the entire application in one giant AI prompt.

### Phase 1 — Design Foundation

Implement:

* color tokens
* typography tokens
* spacing tokens
* radius tokens
* elevation tokens
* Button variants
* Card/Surface variants
* Badge
* Progress
* Icon system
* Skeleton
* Toast
* EmptyState
* ErrorState
* Modal
* Tooltip

Do not redesign major pages yet.

---

### Phase 2 — Application Shell

Redesign:

1. navbar
2. mobile navigation
3. page containers
4. background
5. theme system
6. footer

---

### Phase 3 — Dashboard

Redesign around:

1. Continue
2. Progress
3. Weakness
4. Quick actions
5. Recent activity
6. Leaderboard

---

### Phase 4 — Curriculum

Redesign:

```text
Blocks
 ↓
Modules
 ↓
Topics
```

---

### Phase 5 — Practice

Redesign:

* question header
* question typography
* options
* feedback
* explanation
* bookmark
* report
* navigation
* keyboard interaction
* progress

---

### Phase 6 — Exams

Implement:

* timer
* question navigator
* answer states
* jump navigation
* submit confirmation
* responsive exam workspace

---

### Phase 7 — Results

Implement:

* score
* performance breakdown
* trend
* weak areas
* answer review
* next action

---

### Phase 8 — Secondary Pages

Then:

* bookmarks
* mistakes
* leaderboard
* onboarding
* authentication
* account
* settings
* legal

---

### Phase 9 — Polish

Final pass:

* microinteractions
* transitions
* skeletons
* empty states
* error states
* focus states
* responsive edge cases
* accessibility
* performance
* visual consistency

---

## 50. Priority Matrix

If time is limited:

| Priority | Area                       | Impact      |
| -------: | --------------------------- | ----------- |
|        1 | Design-token system         | Very High   |
|        2 | Surface/card hierarchy      | Very High   |
|        3 | Dashboard                   | Very High   |
|        4 | MCQ experience               | Very High   |
|        5 | Curriculum                  | Very High   |
|        6 | Exam workspace               | Very High   |
|        7 | Results                     | Very High   |
|        8 | Typography                  | High        |
|        9 | Mobile navigation            | High        |
|       10 | Loading/error/empty states  | High        |
|       11 | Icon system                 | Medium-High |
|       12 | D.K. integration             | Medium-High |
|       13 | Motion                      | Medium      |
|       14 | Mistakes/bookmarks           | Medium      |
|       15 | Landing page                | Medium      |
|       16 | Account/settings              | Medium      |
|       17 | Search/command interface    | Low for V1  |

---

## 51. Definition of Done

A page is **not** professionally redesigned merely because it has:

* nicer colors
* more animations
* gradients
* rounded cards
* larger typography

A page is complete when:

* hierarchy is immediately understandable
* primary action is obvious
* content density is appropriate
* major states are designed
* spacing is consistent
* typography is consistent
* components use design-system variants
* mobile behavior is intentional
* keyboard/focus behavior works
* loading/empty/error states exist
* visual language matches the rest of DiagKnow
* one-off styling has been minimized
* product intelligence is visible
* the page still feels unmistakably like DiagKnow

---

## 52. Final Visual QA

After each major redesign, inspect the application without looking at the code.

Ask:

### Question 1

> Does this look like a developer built a functional MCQ application?

If yes, keep refining.

### Question 2

> Does this look like a generic SaaS dashboard?

If yes:

* reduce card usage
* reduce decorative effects
* strengthen information hierarchy

### Question 3

> Could I identify DiagKnow from a screenshot without seeing the logo?

If no:

* strengthen recurring visual motifs
* establish stronger typography
* establish stronger interaction patterns
* make the curriculum/weakness model visually distinctive

### Question 4

> Can a medical student immediately understand what to do next?

If no:

* simplify hierarchy
* strengthen primary CTA
* expose relevant context

### Question 5

> Does the interface make DiagKnow's intelligence visible?

Look specifically for:

* curriculum awareness
* mastery
* weakness detection
* adaptive practice
* exam performance
* recommended next action

If the answer is no, the UI is still mostly a presentation layer.

---

## 53. North-Star Statement

The finished product should communicate:

> **Know where you are.
> Know how you're doing.
> Know what you don't know.
> Know what to do next.**

And visually:

> **DiagKnow should feel like a clinical learning instrument that happens to be software.**
