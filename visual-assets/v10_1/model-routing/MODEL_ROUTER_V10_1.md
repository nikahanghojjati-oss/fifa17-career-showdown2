# SUPERSEDED FOR ACTIVE VISUAL WORK
Use `visual-assets/v10_1/coordination/STUDIO_WORKFLOW_AND_ROUTING_V2.md`. This file is retained as historical routing evidence only.

# SHOWDOWN VISUAL V10.1 — MODEL AVAILABILITY ROUTER

Status: ACTIVE
Purpose: keep visual work moving without allowing model availability to change project authority.
Branch: `visual/cinematic-system-v10`

## 1. Core rule

Model availability changes routing, not truth.

The visual constitution, product behavior, manager identities, approved assets and owner authority do not change because Astra is temporarily quota-constrained.

Nik remains final taste authority.
GPT-5.6 Sol remains producer / product-truth / synthesis authority.
GPT-6 Astra High remains executive cinematic art-direction authority when available.
GPT-6 Sol High in Work remains the principal implementation builder after a visual specification is frozen.
Claude Opus 5.5 is an independent senior reviewer / overflow art-direction worker. It may temporarily cover Astra review work, but it may not permanently promote a visual standard without Astra or Nik.

## 2. Availability modes

### MODE A — ASTRA_CONSTRAINED

Use when:
- the 5-hour usage pool is at or below roughly 25%; or
- the next reset is still materially far away; or
- Nik explicitly says to conserve Astra.

Current status on 2026-09-27: ACTIVE.

Goal:
Continue useful visual work without spending scarce Astra capacity and without pretending Claude is Astra.

Authority:
- Claude may critique, red-team, research, inspect images/code and issue provisional visual judgments.
- Claude may NOT rewrite canonical V10.1 authority by itself.
- Claude may NOT permanently approve a golden frame.
- GPT-5.6 Sol reconciles Claude findings into project authority.
- Any provisional golden frame built during this mode remains PROVISIONAL_ASTRA_REVIEW_PENDING.

Allowed work:
1. focused V10.1 art-direction review;
2. baseline-vs-spec visual red team;
3. approved-asset fit audit;
4. camera / depth / lighting / mobile critique;
5. implementation-risk review;
6. review of a provisional golden frame;
7. code/CSS/DOM critique if a provisional implementation exists;
8. research overflow that does not redefine product truth.

Not allowed:
- production-main edits;
- product behavior redesign;
- independent canonical promotion;
- new image generation unless Nik explicitly authorizes a bounded asset ticket;
- parallel edits by Claude and another worker to the same file set;
- treating internal model ratings as owner approval.

### MODE B — ASTRA_AVAILABLE

Use after a reset or whenever Astra capacity is comfortably available.

Recommended trigger:
- above roughly 40% of the 5-hour pool for a meaningful visual task; or
- Nik explicitly says Astra is available.

For the gray zone between ~25% and ~40%, default to conserving Astra unless the next task is uniquely dependent on its cinematic judgment.

Goal:
Use Astra only where its art-direction judgment has the highest marginal value.

Authority:
1. Astra High reviews/finalizes high-impact visual direction.
2. GPT-5.6 Sol reconciles art direction with product truth and writes the frozen build contract.
3. GPT-6 Sol High Work builds the exact browser candidate.
4. Claude Opus 5.5 independently red-teams the rendered output and/or implementation when useful.
5. Astra performs the milestone visual spot-check when the candidate materially changes.
6. Nik gives final owner approval.

## 3. ASTRA_CONSTRAINED workflow

### A1 — Claude onboarding
Claude reads only the canonical packet in the order stated by `CLAUDE_OPUS_5_5_START_HERE.md`.

### A2 — Focused interim art review
Claude reviews the frozen V10.1 C2 Decision Desk specification against:
- Astra's presentation bible;
- the 7/10 desktop/mobile baseline;
- current product-truth card;
- current approved assets.

Required outcome:
- MUST FIX BEFORE PROVISIONAL GOLDEN FRAME
- SHOULD REFINE
- ALREADY STRONG
- PROVISIONALLY READY FOR GOLDEN FRAME / NOT PROVISIONALLY READY

Claude cannot use the word READY as permanent project promotion.

### A3 — Sol reconciliation
GPT-5.6 Sol:
- validates every proposed change against product truth;
- rejects contradictions;
- updates only the canonical V10.1 spec;
- writes a short Claude-delta record;
- does not silently absorb optional opinions as hard rules.

### A4 — Asset-fit audit
Claude or Sol checks the currently approved Transfer poses and stadium source against the frozen C2 camera.

Outcome:
- FIT
- FIT WITH COMPOSITIONAL LIMITS
- ASSET BLOCKER

An asset blocker must name exactly what fails: camera, crop, eyeline, light direction, prop contact, alpha, perspective or mobile use.

No generation follows automatically.

### A5 — Provisional golden frame
If the spec is provisionally ready and no unresolved asset blocker exists, GPT-5.6 Sol may build one isolated desktop + mobile golden-frame candidate without using GPT-6 Sol Work.

The candidate must be marked:
`PROVISIONAL_ASTRA_REVIEW_PENDING`

It cannot become the reusable visual reference yet.

### A6 — Claude render red team
Claude compares:
- 7/10 baseline;
- frozen V10.1 spec;
- provisional desktop/mobile render.

It judges:
- spatial credibility;
- character integration;
- hierarchy;
- distinctive Showdown identity;
- mobile quality;
- poster/dashboard regression;
- implementation risks.

### A7 — Freeze reset packet
Before Astra returns, Sol freezes:
- accepted Claude findings;
- rejected Claude findings with reason;
- spec delta;
- current candidate fingerprint;
- desktop/mobile evidence;
- unresolved questions only.

### A8 — Astra reentry
When Astra becomes available, do NOT ask it to reread the entire project history.

Give it:
1. original Astra presentation bible;
2. current V10.1 authority;
3. current frozen SV01 spec;
4. Claude interim review;
5. Sol reconciliation delta;
6. latest rendered evidence;
7. unresolved questions.

Astra returns:
- READY FOR GOLDEN FRAME / READY FOR OWNER REVIEW; or
- smallest required corrections.

## 4. ASTRA_AVAILABLE workflow

### B1 — Astra art-direction review
Astra reviews the frozen screen spec before implementation.

### B2 — Sol product-truth reconciliation
Sol integrates only compatible visual deltas and freezes the build contract.

### B3 — Asset-fit audit
Existing assets are tested before any generation request.

### B4 — GPT-6 Sol High Work build
The implementation worker receives:
- exact current product source;
- frozen visual contract;
- exact asset IDs;
- exact states;
- exact desktop/mobile targets;
- forbidden behavior;
- QA matrix.

It does not invent a new visual system.

### B5 — Claude independent red team
Claude reviews rendered evidence and implementation for:
- visual drift;
- generic web-app regressions;
- camera/depth inconsistencies;
- responsive problems;
- code/CSS performance risks;
- accidental behavior changes.

Claude does not edit the canonical candidate during review.

### B6 — Astra milestone spot-check
Use Astra for material visual changes, not every small CSS correction.

### B7 — Nik owner review
Only Nik can establish that the new frame materially clears the 7/10 baseline.

### B8 — Promotion
After owner approval:
- record exact fingerprint;
- promote as reusable visual reference;
- then extend the grammar to later screens.

## 5. Concurrency rule

Never have Claude and GPT-6 Sol Work write the same visual artifact simultaneously.

One writer, one reviewer.

Recommended:
- builder owns candidate branch/path;
- reviewer reads exact fingerprint;
- Sol merges accepted feedback.

## 6. Source drift rule

Before any implementation or product-specific review, re-resolve `main`.

If `main` differs from the recorded product anchor:
- report SOURCE_DRIFT;
- refresh the product-truth card;
- do not guess whether behavior changed.

## 7. Cost / quota principle

Use expensive scarce reasoning for decisions that change visual direction.

Use Claude for overflow research, independent critique, asset-fit analysis and red-team work when Astra is constrained.

Use Astra for:
- establishing or overturning camera/scene language;
- resolving disputed high-impact art-direction choices;
- milestone promotion reviews.

Use GPT-6 Sol High Work for:
- execution after the target is frozen.

Use GPT-5.6 Sol chat for:
- continuity;
- reconciliation;
- product truth;
- authority maintenance;
- provisional visual work when Work quota is intentionally conserved.

## 8. Claude surface and effort routing

For COV-01 use:
`Claude Chat Project + Opus 5.5 + Extra / xhigh`

Reason:
COV-01 is a bounded multimodal visual-review task and benefits more from persistent Project instructions/knowledge than from autonomous coding orchestration.

Routing:
- COV-01 / major art-direction review: Claude Project + Extra
- routine visual follow-up: Claude Project + High
- repetitive QA: Medium if available
- rare unresolved high-impact single problem: Max
- broad autonomous repo engineering or later isolated implementation: Claude Code, with Ultracode only when workflow orchestration materially helps

Claude Code remains valuable for direct repository execution, but it is not the preferred surface for the current COV-01 review.

Read:
`visual-assets/v10_1/claude/CLAUDE_EFFORT_POLICY_V10_1.md`
and
`visual-assets/v10_1/claude-project/CLAUDE_PROJECT_ROUTE_V10_1.md`
