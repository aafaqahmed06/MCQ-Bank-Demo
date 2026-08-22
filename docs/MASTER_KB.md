# DiagKnow — Product & Engineering Master Knowledge Base

> **Status:** Working source of truth  
> **Purpose:** Product context, engineering constraints, content-pipeline specifications, and decision criteria for AI agents and human contributors.  
> **Rule:** When specifications conflict, do not silently choose an interpretation. Flag the contradiction and preserve the higher-priority source of truth.

---

# Repository Structure

```text
DiagKnow/
├── Architecture/
│   ├── database-schema.md
│   └── system-architecture.md
├── MCQ Pipeline/
│   ├── generation-spec.md
│   ├── verification-spec.md
│   ├── tagging-spec.md
│   └── topic-checklist.md
├── Product/
│   ├── roadmap.md
│   ├── differentiation.md
│   └── feature-specs.md
├── Design/
│   ├── UI-guidelines.md
│   └── mascot-guidelines.md
└── Business/
    ├── competitors.md
    └── pricing.md
```

---

# GLOBAL OPERATING PRINCIPLES

## Product thesis

DiagKnow is not intended to be “another AI medical app.” Its core product is a **high-quality, structured, curriculum-aware question bank and learning system** for medical students, beginning with MBBS students in Pakistan.

The strategic hierarchy is:

1. **Trustworthiness of content**
2. **Curriculum relevance**
3. **Excellent retrieval of the right question at the right time**
4. **Fast, low-friction practice**
5. **Adaptive intelligence**
6. **AI features only where they create measurable value**

AI is primarily infrastructure. The student should experience a reliable study product, not a chatbot wearing a stethoscope.

## Non-negotiable engineering principles

- Never sacrifice content integrity for generation volume.
- Never expose unverified AI-generated medical content as production truth.
- Preserve provenance for every generated question.
- Keep deterministic validation separate from LLM judgment.
- Avoid irreversible schema decisions when extensibility is cheap.
- Prefer normalized metadata where relationships are queried; use JSONB for flexible payloads.
- Every production write path must be protected by authorization and validation.
- Treat RLS as part of application architecture, not an afterthought.
- Do not let AI agents silently alter production data.
- Every automated pipeline stage should emit an inspectable artifact.
- Prefer idempotent jobs and resumable batch processing.
- Design V1 for clarity and reliability, not maximal feature count.

## Content quality principle

A question is not “good” because it sounds plausible.

A production MCQ must satisfy:

```text
Factually supported
AND
Single-best-answer valid
AND
Curriculum-relevant
AND
Unambiguous
AND
Correctly tagged
AND
Appropriately difficult
AND
Non-duplicative
AND
Explanation is accurate
```

Failure of any mandatory criterion prevents automatic publication.

---

# Architecture/database-schema.md

# Database Schema Specification

## Architectural objective

The database must support:

- Medical colleges
- Academic years
- Blocks/modules
- Topic hierarchy
- Large MCQ banks
- Rich tagging
- Question provenance
- Generation and verification states
- Student attempts
- Performance analytics
- Adaptive retrieval
- Future spaced repetition
- Admin/content workflows

Supabase/Postgres is the current backend assumption.

## Core entities

### profiles

Extends authenticated users.

```sql
profiles
- id uuid PK references auth.users(id)
- display_name text
- medical_college_id uuid nullable
- academic_year_id uuid nullable
- onboarding_completed boolean default false
- created_at timestamptz default now()
- updated_at timestamptz default now()
```

Do not use client-controlled fields for authorization.

### medical_colleges

```sql
medical_colleges
- id uuid PK
- name text unique
- country_code text
- city text nullable
- active boolean default true
- created_at timestamptz
```

### academic_years

```sql
academic_years
- id uuid PK
- name text
- sequence smallint
```

Example: MBBS Year 1, MBBS Year 2.

### blocks

A major curricular unit.

```sql
blocks
- id uuid PK
- name text
- slug text unique
- description text nullable
- academic_year_id uuid references academic_years
- sequence integer
- active boolean default true
```

### modules

Subdivisions inside blocks.

```sql
modules
- id uuid PK
- block_id uuid references blocks
- name text
- slug text
- description text nullable
- sequence integer
- unique(block_id, slug)
```

### topics

Topics must not be represented only as raw strings.

```sql
topics
- id uuid PK
- parent_topic_id uuid nullable references topics
- canonical_name text
- slug text unique
- subject text nullable
- description text nullable
- depth smallint
- active boolean default true
```

This supports:

```text
Anatomy
└── Lower Limb
    └── Femoral Triangle
        └── Femoral Nerve
```

Do not hard-code retrieval logic around one fixed depth.

## MCQ table

The existing baseline concept:

```sql
mcqs
- id uuid PK
- block_id uuid
- module_id uuid
- topic text
- question text
- options jsonb
- correct_answer smallint
- explanation text
- difficulty smallint
- created_at timestamptz
```

is insufficient for long-term DiagKnow requirements.

Recommended production model:

```sql
mcqs
- id uuid PK
- stem text not null
- question_type text default 'single_best_answer'
- options jsonb not null
- correct_option_index smallint not null
- explanation text not null

- primary_topic_id uuid nullable references topics
- difficulty smallint check (difficulty between 1 and 3)

- status text not null
  -- draft
  -- generated
  -- validating
  -- verified
  -- needs_review
  -- rejected
  -- archived
  -- published

- source_type text
  -- textbook
  -- faculty
  -- curated
  -- generated

- source_reference jsonb nullable
- generation_metadata jsonb nullable
- verification_metadata jsonb nullable

- content_hash text nullable
- version integer default 1
- created_at timestamptz default now()
- updated_at timestamptz default now()
- published_at timestamptz nullable
```

## Topic relationships

One question may involve multiple topics.

```sql
mcq_topics
- mcq_id uuid references mcqs on delete cascade
- topic_id uuid references topics
- relationship_type text
  -- primary
  -- secondary
  -- prerequisite
  -- clinical_correlation
- weight numeric nullable
- primary key (mcq_id, topic_id, relationship_type)
```

This is essential. A question may test renal physiology while using cardiovascular context. Retrieval should distinguish **what the question is about** from **what context appears in the stem**.

## Tagging system

Use a generalized tagging layer.

```sql
tags
- id uuid PK
- namespace text
- name text
- slug text
- description text nullable
- active boolean default true
- unique(namespace, slug)
```

Examples:

```text
namespace: cognitive
tag: recall

namespace: cognitive
tag: application

namespace: anatomy_structure
tag: nerve

namespace: question_style
tag: clinical_vignette
```

Question/tag mapping:

```sql
mcq_tags
- mcq_id uuid
- tag_id uuid
- confidence numeric nullable
- assigned_by text
  -- rule
  -- model
  -- human
- created_at timestamptz
- primary key(mcq_id, tag_id)
```

## Provenance

Every generated question should be traceable.

```sql
mcq_sources
- id uuid PK
- mcq_id uuid references mcqs
- source_document_id uuid nullable
- source_locator text nullable
- supporting_excerpt text nullable
- source_confidence numeric nullable
```

Do not store entire copyrighted source books unnecessarily. Store references/locators and only the minimum excerpt required for auditing.

## Generation jobs

```sql
generation_jobs
- id uuid PK
- status text
- model text
- prompt_version text
- input_manifest jsonb
- output_manifest jsonb
- started_at timestamptz
- completed_at timestamptz
- error jsonb nullable
```

## Verification records

Never overwrite verification history.

```sql
verification_runs
- id uuid PK
- mcq_id uuid references mcqs
- verifier_type text
- verifier_model text nullable
- rubric_version text
- verdict text
  -- pass
  -- revise
  -- reject
  -- uncertain
- confidence numeric
- findings jsonb
- created_at timestamptz
```

## Duplicate detection

```sql
mcq_similarity
- mcq_a_id uuid
- mcq_b_id uuid
- similarity_score numeric
- similarity_type text
  -- lexical
  -- semantic
  -- concept
- created_at timestamptz
```

Only store pairs above a configurable threshold.

## Student attempts

```sql
attempts
- id uuid PK
- user_id uuid references profiles
- mcq_id uuid references mcqs
- selected_option_index smallint
- is_correct boolean
- response_time_ms integer nullable
- session_id uuid nullable
- attempted_at timestamptz default now()
```

Keep attempts append-oriented. Do not mutate historical answers when the user retries.

## Practice sessions

```sql
practice_sessions
- id uuid PK
- user_id uuid
- mode text
  -- practice
  -- timed_exam
  -- review
  -- adaptive
- configuration jsonb
- started_at timestamptz
- completed_at timestamptz nullable
```

## Performance aggregates

Raw attempts are source-of-truth. Aggregates can be regenerated.

Potential aggregate dimensions:

- topic
- block
- module
- tag
- difficulty
- time period

Do not prematurely create dozens of aggregate tables. Start with indexed queries/materialized views only after actual performance requirements are known.

## RLS baseline

Minimum principle:

- Students can read published MCQs allowed for their product tier.
- Students can create/read their own attempts.
- Students cannot modify other users' attempts.
- Client cannot write verification status.
- Client cannot directly publish questions.
- Admin/service workflows use separate controlled access.

Every new table must explicitly answer:

```text
Who can SELECT?
Who can INSERT?
Who can UPDATE?
Who can DELETE?
Can the client bypass server validation?
```

## Indexing priorities

Likely indexes:

```text
mcqs(status)
mcqs(primary_topic_id)
mcq_topics(topic_id, mcq_id)
mcq_tags(tag_id, mcq_id)
attempts(user_id, attempted_at desc)
attempts(user_id, mcq_id)
verification_runs(mcq_id, created_at desc)
```

Add composite indexes based on real query plans, not intuition.

---

# Architecture/system-architecture.md

# System Architecture

## High-level flow

```text
SOURCE MATERIAL
      |
      v
Extraction / Topic Mapping
      |
      v
Generation Pipeline
      |
      v
Deterministic Validation
      |
      v
Semantic / Adversarial Verification
      |
      v
Duplicate Detection
      |
      v
Human Review Queue (exceptions only)
      |
      v
Published Question Bank
      |
      v
Student Retrieval Engine
      |
      v
Attempts + Analytics
      |
      v
Adaptive Recommendations
```

## Frontend

Assumed stack:

- Next.js
- TypeScript
- React
- Supabase client/server integration

Frontend responsibilities:

- Render study flows
- Collect answers
- Display explanations
- Configure sessions
- Present analytics

Frontend must not own:

- correctness authority
- subscription authorization
- question publication
- verification decisions

## Backend

Use server-side routes/functions for consequential operations:

- session generation
- subscription checks
- privileged writes
- admin workflows
- content publication

Validate all external input with schemas.

## Question retrieval engine

Question retrieval must become independent of the original storage hierarchy.

A student request might be:

```text
Give me:
20 questions
Year 1
Physiology
Renal
Difficulty 2-3
Prefer weak concepts
Exclude recently answered questions
```

This should not depend on a brittle condition such as:

```text
block = X AND module = Y
```

Instead, construct a retrieval specification from multiple filters.

Conceptually:

```text
Candidate Pool
  = published
  ∩ curriculum scope
  ∩ requested topics/tags
  ∩ difficulty range
  - excluded/recent questions

Ranking
  = relevance
  + weakness weight
  + novelty
  + curriculum priority
  + spacing weight
```

## API contracts

Prefer explicit contracts:

```text
POST /api/practice/session
POST /api/practice/answer
GET  /api/analytics/overview
POST /api/admin/mcqs/publish
```

Do not expose generic database mutation endpoints merely because the frontend needs a feature.

## Pipeline boundaries

Each stage must have a defined input and output.

### Generation

Input:

```text
topic specification
source references
generation configuration
prompt version
```

Output:

```text
raw structured MCQs
generation metadata
```

### Deterministic validation

Checks:

- JSON validity
- required fields
- option count
- answer index range
- duplicate options
- empty explanation
- malformed tags

### Semantic verification

Checks:

- factual accuracy
- answer correctness
- ambiguity
- distractor plausibility
- curriculum relevance

### Publication

Only questions satisfying publication policy enter `published`.

## Observability

Track:

- generation success/failure
- verifier verdict distributions
- rejection reasons
- duplicate rates
- retrieval latency
- question exposure
- answer accuracy
- anomaly rates

Do not wait for production failure to add pipeline logs.

---

# MCQ Pipeline/generation-spec.md

# MCQ Generation Specification

## Objective

Generate medically accurate, curriculum-aligned, high-discrimination single-best-answer questions suitable for MBBS students.

Generation is a **content production stage**, not publication.

## Input contract

Every generation task should specify:

```json
{
  "subject": "",
  "academic_year": "",
  "topic": "",
  "subtopics": [],
  "source_manifest": [],
  "target_count": 0,
  "difficulty_distribution": {
    "1": 0,
    "2": 0,
    "3": 0
  },
  "cognitive_distribution": {
    "C1": 0,
    "C2": 0,
    "C3": 0
  },
  "excluded_concepts": [],
  "generation_batch_id": ""
}
```

## Difficulty definitions

### Difficulty 1

Tests a foundational fact or straightforward relationship.

Not necessarily trivial; merely low inference.

### Difficulty 2

Requires understanding, discrimination, or linking concepts.

### Difficulty 3

Requires multi-step reasoning, application, prioritization, or discrimination between closely related concepts.

Difficulty is not determined by obscure trivia.

## Cognitive levels

### C1 — Recall

Direct retrieval of knowledge.

### C2 — Understanding

Requires interpretation or explanation of relationships.

### C3 — Application/Reasoning

Requires applying knowledge to a novel situation, clinical scenario, mechanism, or multi-step inference.

A long vignette does not automatically make a question C3.

## Question requirements

Each MCQ must:

1. Test a meaningful learning objective.
2. Have one defensibly best answer.
3. Avoid hidden assumptions.
4. Avoid “all of the above.”
5. Avoid “none of the above.”
6. Avoid grammatical clues.
7. Keep options structurally parallel where possible.
8. Avoid negative stems unless educationally necessary.
9. Avoid trivia unless explicitly required by curriculum.
10. Include an explanation for why the correct answer is correct.

## Distractor requirements

Distractors should be:

- plausible to a partially informed student
- incorrect for a specific reason
- from the same conceptual neighborhood
- not obviously absurd

Bad distractor:

> Femoral nerve

when the question asks about a venous tributary.

Good distractor:

> A nearby structure commonly confused with the correct answer.

## Structured output

```json
{
  "batch_id": "",
  "questions": [
    {
      "external_id": "",
      "stem": "",
      "options": ["", "", "", "", ""],
      "correct_option_index": 0,
      "explanation": "",
      "primary_topic": "",
      "secondary_topics": [],
      "difficulty": 1,
      "cognitive_level": "C1",
      "learning_objective": "",
      "source_locator": ""
    }
  ]
}
```

Do not permit prose outside the machine-readable output in automated mode.

## Generation anti-patterns

Reject or flag:

- multiple correct answers
- “most appropriate” without enough discriminating information
- explanation contradicts key
- options with overlapping meanings
- unsupported absolute statements
- generated references that do not exist
- fake textbook citations
- duplicate conceptual templates
- obvious patterning of correct answer positions

## Answer position balancing

Across a sufficiently large batch, answer positions should be approximately balanced.

Do not force perfect alternation. Random-looking distribution is preferable to mechanical sequences.

## Batch size

Use bounded batches. Prefer smaller independently auditable batches over giant monolithic generations.

Recommended operational range:

```text
20–100 MCQs per generation batch
```

Adjust based on model reliability and source complexity.

## Generation acceptance

A generated item proceeds only if:

```text
schema_valid = true
AND
required_fields_present = true
AND
basic_duplicate_checks_pass = true
```

Semantic correctness is verified later.

---

# MCQ Pipeline/verification-spec.md

# Verification Specification

## Philosophy

Verification is adversarial.

The verifier must not be asked:

> “Is this question good?”

Instead:

> “Assume this question may contain an error. Independently solve it, search for ambiguity, and attempt to falsify every critical claim.”

## Verification stages

### Stage 0 — Schema validation

Deterministic.

Checks:

- required fields
- option count
- answer range
- valid difficulty
- valid cognitive level
- non-empty explanation

### Stage 1 — Internal consistency

Check whether:

```text
stem
options
correct answer
explanation
tags
```

agree with one another.

### Stage 2 — Independent solving

The verifier should determine the answer independently before considering the supplied answer key.

Required output:

```text
independent_answer
supplied_answer
match: true/false
```

### Stage 3 — Factual verification

Evaluate:

- stem claims
- answer claims
- explanation claims

Against the supplied authoritative source material where available.

If source support cannot be established, verdict may be `uncertain`; uncertainty must not be silently converted to PASS.

### Stage 4 — Ambiguity analysis

Ask:

- Could more than one option reasonably be correct?
- Does interpretation depend on unstated assumptions?
- Is terminology underspecified?
- Would expert disagreement be plausible?

### Stage 5 — Distractor analysis

Each distractor should be categorized:

```text
plausible_incorrect
irrelevant
technically_correct
partially_correct
duplicate_meaning
ambiguous
```

A technically correct distractor is a critical defect in single-best-answer format.

### Stage 6 — Educational quality

Assess:

- relevance
- cognitive target
- difficulty calibration
- explanation value
- redundancy

## Verdicts

### PASS

All critical criteria pass.

Minor stylistic defects may be recorded but do not prevent publication.

### REVISE

Core concept is salvageable, but wording, explanation, tags, difficulty, or options require modification.

### REJECT

The question is fundamentally flawed, unsupported, unsafe to publish, duplicated beyond usefulness, or based on an invalid learning objective.

### UNCERTAIN

Verifier cannot establish correctness with sufficient confidence.

Uncertain is not pass.

## Machine-readable report

```json
{
  "mcq_id": "",
  "verdict": "PASS",
  "confidence": 0.0,
  "independent_correct_option": 0,
  "supplied_correct_option": 0,
  "answer_key_match": true,
  "factual_accuracy": {
    "status": "pass",
    "issues": []
  },
  "ambiguity": {
    "status": "pass",
    "issues": []
  },
  "distractors": {
    "status": "pass",
    "issues": []
  },
  "explanation": {
    "status": "pass",
    "issues": []
  },
  "tags": {
    "status": "pass",
    "issues": []
  },
  "recommended_action": "publish"
}
```

## Critical-failure conditions

Automatic PASS is forbidden when:

- supplied answer differs from independently verified answer
- two options are defensibly correct
- source evidence contradicts the question
- explanation is materially incorrect
- question is substantially duplicated
- verification confidence is below configured threshold

## Model independence

Where economically possible, generator and verifier should not be the same model instance performing the same reasoning trajectory.

The goal is error diversity, not model-brand diversity for its own sake.

## Human review queue

Human review should focus on:

```text
REVISE
REJECT appeals
UNCERTAIN
high-value difficult questions
high-impact clinical content
```

Do not waste human attention reviewing every obvious PASS if automated verification is sufficiently reliable.

---

# MCQ Pipeline/tagging-spec.md

# Tagging Specification

## Objective

Tags allow DiagKnow to retrieve questions by what they test rather than merely where they were originally stored.

## Tagging dimensions

Every production MCQ should support applicable tags from the following dimensions.

### 1. Curriculum

```text
academic_year
subject
block
module
primary_topic
secondary_topic
```

### 2. Knowledge domain

Examples:

```text
anatomy
physiology
biochemistry
histology
embryology
pathology
pharmacology
```

### 3. Structure/entity

Examples:

```text
nerve
artery
vein
muscle
bone
joint
receptor
enzyme
hormone
```

### 4. Cognitive operation

```text
recall
recognition
comparison
mechanism
localization
application
clinical_reasoning
calculation
sequence
cause_effect
```

### 5. Question style

```text
direct
clinical_vignette
image_based
assertion_reason
mechanism
comparison
best_next_step
```

Do not enable a style until the product actually supports it.

### 6. Difficulty

```text
D1
D2
D3
```

### 7. Cognitive level

```text
C1
C2
C3
```

### 8. Prerequisite relationships

Questions may require concepts outside their primary topic.

Example:

```text
primary: renal physiology
prerequisite: membrane transport
```

## Primary topic rule

Every MCQ should have exactly one primary topic unless explicitly marked interdisciplinary.

The primary topic answers:

> If a student got this wrong, what concept should we say they need to study?

## Secondary topic rule

Secondary topics provide retrieval context but should not dilute mastery analytics.

## Tag assignment

Tag source:

```text
rule
model
human
```

Tag confidence should be preserved when generated automatically.

## Forbidden tagging behavior

Do not:

- tag every concept mentioned in the stem
- use free-text synonyms as separate canonical tags
- create tags ad hoc during production
- mix difficulty with topic taxonomy
- treat source chapter names as conceptual tags

## Tag quality metrics

Track:

- percentage of questions with valid primary topic
- orphan tags
- duplicate/synonymous tags
- model/human disagreement
- retrieval usefulness

---

# MCQ Pipeline/topic-checklist.md

# Topic Checklist Specification

## Purpose

The topic checklist is the canonical coverage map for MCQ generation and curriculum auditing.

The current DiagKnow scope has evolved beyond the original 88 exact topic strings. Therefore this document must support expansion without breaking historical mappings.

## Required fields per topic

```text
Canonical ID
Canonical Name
Parent Topic
Subject
Academic Year
Block
Module
Priority
Generation Status
Target MCQ Count
Verified MCQ Count
Coverage Status
Aliases
Notes
```

## Canonical topic template

```yaml
id: ANAT-LL-FEM-NERVE
name: Femoral Nerve
parent: Femoral Triangle
subject: Anatomy
academic_year: MBBS Year 1
block: Lower Limb
module: Neurovascular Structures
priority: high
target_mcqs: 60
verified_mcqs: 0
coverage_status: not_started
aliases:
  - anterior crural nerve
notes: Include roots, course, branches, motor and sensory distribution, clinical injury.
```

## Coverage status

```text
not_started
generation_in_progress
awaiting_verification
partially_covered
adequately_covered
needs_expansion
under_review
```

## Coverage principle

Do not define target count purely by topic size.

Target question volume should consider:

```text
concept breadth
clinical importance
exam frequency
difficulty diversity
number of distinct learning objectives
```

A tiny topic may need five excellent questions; a major physiological system may need hundreds.

## Coverage matrix

For mature topics, coverage should be evaluated across:

```text
fact/structure
function
mechanism
relationship
application
clinical correlation
common misconception
```

A topic with 100 recall questions is not “well covered.”

## Historical migration rule

If old questions contain raw topic strings:

1. Preserve original value.
2. Map to canonical topic.
3. Store alias/mapping history.
4. Never silently delete provenance.

---

# Product/roadmap.md

# Product Roadmap

## Roadmap philosophy

Do not build according to excitement. Build according to dependency and leverage.

A feature belongs in the roadmap when it either:

- improves learning outcomes
- improves trust
- materially improves retention
- creates defensibility
- unlocks later capabilities
- removes a major adoption barrier

## P0 — Foundation and correctness

### Content infrastructure

- [ ] Canonical topic taxonomy
- [ ] Rich MCQ tagging
- [ ] Generation metadata
- [ ] Verification pipeline
- [ ] Duplicate detection
- [ ] Publication states
- [ ] Content provenance

### Core student experience

- [ ] College/year selection
- [ ] Block/module/topic navigation
- [ ] MCQ practice
- [ ] Correct/incorrect feedback
- [ ] Explanation display
- [ ] Basic progress tracking
- [ ] Timed exam mode

### Engineering

- [ ] RLS audit
- [ ] Environment separation
- [ ] Database migrations
- [ ] Error monitoring
- [ ] Basic automated tests
- [ ] Deployment reliability

**Definition of done for P0:**

A student can enter, select relevant content, complete a stable practice session, receive correct feedback, and have their progress reliably stored.

## P1 — Intelligence

- [ ] Weak-topic detection
- [ ] Performance analytics
- [ ] Better question retrieval
- [ ] Recently-seen exclusion
- [ ] Difficulty-aware practice
- [ ] Topic recommendations
- [ ] Basic spaced repetition
- [ ] Personalized practice mode

## P2 — Differentiation

- [ ] Adaptive study plans
- [ ] Exam simulation
- [ ] Curriculum coverage heatmaps
- [ ] High-resolution mastery model
- [ ] AI-assisted explanation only where useful
- [ ] Cross-topic integration
- [ ] Institution-specific curriculum mapping

## P3 — Scale

- [ ] More MBBS years
- [ ] More institutions
- [ ] Faculty tools
- [ ] Collaborative analytics
- [ ] Content operations dashboard
- [ ] Premium intelligence features

## Roadmap kill rule

Before adding a feature, ask:

```text
What user problem does this solve?
What existing behavior changes?
How will we know it worked?
What maintenance burden does it create?
Does it delay a more important dependency?
```

If the answers are weak, do not build it.

---

# Product/differentiation.md

# Differentiation Strategy

## The wrong positioning

Do not position DiagKnow as:

> “An AI-powered medical education platform.”

That is increasingly generic and easily copied.

## The intended positioning

DiagKnow should aim to become:

> **The curriculum-aware practice and mastery layer for medical students.**

Initial wedge:

```text
Pakistan
→ MBBS
→ Year 1
→ curriculum-aligned high-quality practice
```

Expansion follows demonstrated product-market fit.

## Differentiation pillars

### 1. Local curriculum precision

Questions should reflect what students are actually studying.

A global question bank can be excellent and still be badly timed for a local student's block exam.

### 2. Structured content graph

DiagKnow should know:

```text
what concept is tested
what prerequisite supports it
what topic it belongs to
what the student is weak at
what should be practiced next
```

This becomes more defensible than a generic chat interface.

### 3. Trustworthy AI infrastructure

AI may generate and assist, but content should pass structured validation and adversarial verification.

The differentiator is not:

> “We use AI.”

It is:

> “The system can scale content production without treating raw model output as truth.”

### 4. Retrieval quality

The long-term moat is selecting the right next question.

### 5. Student workflow integration

Target the moments students already have:

- before a block exam
- after lectures
- during revision
- while identifying weaknesses
- while simulating an exam

## Competitor positioning rule

Do not attempt to out-feature every global platform.

Compete on:

```text
relevance × convenience × local alignment × price
```

while progressively building intelligence and content depth.

---

# Product/feature-specs.md

# Feature Specifications

## Feature: Practice Session

### User goal

Practice a selected body of material with minimal setup.

### Inputs

- scope
- question count
- difficulty
- mode

### System behavior

1. Validate user access.
2. Build candidate pool.
3. Exclude inappropriate/recent questions.
4. Rank candidates.
5. Create session manifest.
6. Serve stable question ordering.

### Acceptance criteria

- No duplicate question in a session.
- Correctness cannot be client-forged.
- Session survives refresh where technically appropriate.
- Explanation is hidden until answer/reveal action.

---

## Feature: Timed Exam

### User goal

Simulate exam conditions.

### Configuration

- scope
- question count
- duration
- answer review policy

### Requirements

- Server records start time.
- Submission is deterministic.
- Timeout behavior is defined.
- Results preserve attempt history.

---

## Feature: Performance Dashboard

### Core metrics

- accuracy
- questions attempted
- topic performance
- difficulty performance
- recent trend

Do not display decorative analytics without an actionable interpretation.

---

## Feature: Weakness Detection

A weakness signal should not rely on one wrong answer.

Potential model:

```text
weakness_score =
error_rate
× recency_weight
× confidence_adjustment
× topic_importance
```

Start simple and validate against user behavior before implementing a complex mastery algorithm.

---

## Feature: Adaptive Practice

Candidate ranking may consider:

```text
topic weakness
recency
novelty
difficulty fit
curriculum priority
spaced repetition
```

Never make the adaptive algorithm opaque to the point that it becomes impossible to debug.

---

## Feature: Content Reporting

Students should eventually be able to report:

- incorrect answer
- ambiguous question
- typo
- poor explanation
- outdated content

Reports enter a moderation queue and do not automatically alter question content.

---

# Design/UI-guidelines.md

# UI Guidelines

## Design objective

DiagKnow should feel:

- focused
- intelligent
- academically credible
- fast
- modern without becoming visually noisy

It should not resemble a generic “AI SaaS dashboard.”

## Primary UX rule

The interface should reduce friction between:

```text
I need to study
```

and

```text
I am answering a relevant question
```

## Information hierarchy

The most important element on a question screen is the question.

Priority:

1. stem
2. answer options
3. progress/time context
4. explanation
5. secondary metadata

Do not bury the question under badges, cards, gradients, mascots, or analytics.

## Question screen

Recommended structure:

```text
Header
- close/back
- progress
- timer when relevant

Body
- topic context (subtle)
- question stem
- options

Footer/action area
- submit/check
```

After submission:

```text
correct/incorrect state
correct answer
explanation
optional concept links
next action
```

## Typography

Prioritize:

- legibility
- mathematical/scientific symbol support
- clear hierarchy
- comfortable reading on mobile

Avoid tiny dense text.

## Color usage

Color must communicate state, not merely decoration.

Examples:

```text
correct
incorrect
warning
inactive
primary action
```

Do not rely solely on color for correctness/accessibility.

## Mobile-first

Core workflows must be comfortable on a phone.

Test:

- long stems
- five options
- long explanations
- poor network
- one-handed interaction

## Empty states

Empty states should answer:

```text
What is missing?
Why is it missing?
What can the student do next?
```

## Motion

Use motion for:

- feedback
- continuity
- state transitions

Do not animate everything merely because it is possible.

## UI anti-patterns

Avoid:

- excessive glassmorphism
- dashboards before utility
- permanent floating AI buttons
- too many simultaneous accent colors
- card-inside-card-inside-card layouts
- gamification that trivializes serious study

---

# Design/mascot-guidelines.md

# D.K. Mascot Guidelines

## Role

D.K. is a guide, not the product.

The mascot should support:

- onboarding
- encouragement
- contextual tips
- empty states
- milestones

It should not interrupt active studying.

## Personality

D.K. should feel:

- intelligent
- curious
- slightly playful
- supportive without being infantilizing

Avoid:

- corporate chatbot personality
- excessive cheerleading
- fake emotional intimacy
- constant jokes

## Usage hierarchy

### High-value uses

- first-run onboarding
- successful milestone
- subtle encouragement after a difficult session
- explaining a feature

### Low-value uses

- beside every button
- persistent chat overlay
- covering educational content
- repeated motivational interruptions

## Visual consistency

Maintain a canonical:

- silhouette
- proportions
- face
- core colors
- expression system

Create pose variants rather than redesigning the mascot per screen.

## Asset naming

```text
dk_idle
dk_thinking
dk_celebrating
dk_explaining
dk_concerned
dk_waving
```

Use predictable names and version assets deliberately.

---

# Business/competitors.md

# Competitor Landscape

## Competitive categories

### Global medical learning platforms

Examples include major comprehensive resources such as AMBOSS and other established medical education ecosystems.

Strengths:

- huge content libraries
- mature UX
- strong brand
- significant editorial resources

Weaknesses/opportunities:

- may not align perfectly with local curricula
- may be expensive relative to local purchasing power
- may optimize for different examination systems

### Anatomy-focused platforms

Examples include visual/anatomy learning products.

Strength:

- specialized visualization and teaching.

DiagKnow should not attempt to beat a dedicated anatomy visualization platform at 3D anatomy.

### Generic AI medical apps

Common pattern:

```text
LLM
+ medical aesthetic
+ chat interface
= “AI medical education”
```

Weakness:

The chat interface is easy to replicate and often fails to create a durable study workflow.

### Local MCQ apps

Potential advantages:

- curriculum familiarity
- local pricing
- existing distribution

Potential weaknesses:

- weak product design
- poor question quality control
- limited personalization
- fragmented taxonomy

## Known local signal: Bedside

A previously observed local competitor pattern is a product emphasizing AI explanations. Anecdotal student perception indicated that a product can be dismissed as “ChatGPT with a medical aesthetic” if the AI layer is not embedded into a superior workflow.

Strategic implication:

**Do not sell the presence of AI. Sell the outcome.**

## Competitive response matrix

If competitor adds AI chat:

> Improve retrieval and learning workflow.

If competitor adds more MCQs:

> Improve quality, tagging, and relevance.

If competitor lowers price:

> Preserve efficient infrastructure and differentiate on value.

If global competitor enters local market:

> Double down on curriculum mapping and local workflow.

## Strategic moat hypothesis

The most defensible asset DiagKnow can build is:

```text
high-quality question bank
+
rich concept graph
+
student performance data
+
adaptive retrieval
+
trusted workflow
```

The model used to generate individual questions is not the moat.

---

# Business/pricing.md

# Pricing Strategy

## Pricing principle

Pricing must reflect the target market's purchasing power while funding:

- infrastructure
- content operations
- AI verification where used
- support
- continued development

Do not adopt a low price that makes quality financially impossible.

## Potential product tiers

### Free

Purpose: acquisition and proof of value.

Potential limits:

- limited daily questions
- limited analytics
- selected topics
- basic practice

The free tier must demonstrate genuine usefulness.

### Student / Core

Potential value:

- unlimited core practice
- full relevant question bank
- detailed explanations
- analytics
- exam mode

### Premium Intelligence

Only charge more when intelligence creates measurable value.

Potential features:

- adaptive practice
- personalized study recommendations
- advanced analytics
- exam prediction/coverage tools, if validated
- advanced review scheduling

## Avoid premature pricing complexity

Do not launch with six plans, tokens, credits, and feature matrices.

Initial objective:

```text
Can a student immediately understand:
what they get,
what it costs,
and why it is worth paying?
```

## Price testing

Test:

- monthly
- semester
- annual

The likely best unit may be aligned with academic cycles rather than generic SaaS monthly billing.

## Regional payment constraint

Pakistan-specific payment and collection constraints must be treated as an implementation requirement, not an afterthought.

Before promising subscriptions:

- verify payment availability
- verify settlement mechanics
- verify refund process
- verify web/mobile integration
- verify fee structure

Do not design the entire business around a payment provider that cannot reliably serve the target market.

## Pricing decision framework

Evaluate:

```text
willingness to pay
vs
perceived academic value
vs
competitor price
vs
infrastructure cost
vs
content cost
vs
conversion friction
```

Do not optimize solely for maximum conversion or maximum sticker price.

---

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

---

# CURRENT STRATEGIC SUMMARY

DiagKnow should currently optimize for:

```text
1. Build trustworthy content infrastructure.
2. Build excellent curriculum-aware practice.
3. Build rich tagging and flexible retrieval.
4. Validate the student experience.
5. Add adaptive intelligence.
6. Expand content and institutions.
```

Avoid the temptation to jump directly to:

```text
chatbot
→ social feed
→ complex gamification
→ dozens of AI features
→ massive multi-country expansion
```

before the core loop is excellent.

The core loop is:

> **Student knows what to study → DiagKnow gives relevant questions → student answers → DiagKnow explains → system learns where the student is weak → next session becomes more useful.**

If that loop becomes excellent, additional features have somewhere valuable to attach.
