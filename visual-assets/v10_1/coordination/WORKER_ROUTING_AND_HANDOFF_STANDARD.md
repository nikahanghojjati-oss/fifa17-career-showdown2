# SHOWDOWN VISUAL — WORKER ROUTING & HANDOFF STANDARD

Status: ACTIVE
Owner: Nik
Coordinator: GPT-5.6 Sol
Canonical visual branch: `visual/cinematic-system-v10`

## Mandatory recipient header

Every handoff/task file MUST begin with this block:

```
Recipient:
Surface:
Model:
Effort:
Branch:
Role:
Input authority:
Expected output:
Return to:
Stop condition:
```

No file is considered ready to hand off unless the recipient and surface are explicit.

When GPT-5.6 Sol gives Nik a file in chat, Sol must also state in plain language:
1. exactly who receives it;
2. exactly where to open that worker;
3. exact model;
4. exact effort;
5. exact branch, if GitHub is involved;
6. what result comes back and to whom.

## Worker map

### Claude Chat Project — lead visual production
Surface: `Claude Career Mode Showdown`
Model: Opus 5.5
Default effort: Extra
Role: Lead Visual Producer + Art Director

Use for:
- visual concept direction;
- atmosphere;
- camera/composition;
- pose strategy;
- motion/transition direction;
- asset planning;
- UI/world relationship;
- critique of rendered evidence;
- deciding whether a candidate is visually strong enough to advance.

Do NOT use as the default code executor.

### Claude Code Cloud Session — implementation
Surface: `claude.ai/code` hosted Cloud Session
Default model: Opus 5.5
Default effort: High
Role: principal implementation worker while promotional Cloud Session credit exists

Use for:
- HTML/CSS/JS/SVG implementation;
- animation implementation;
- Playwright rendering;
- state coverage;
- automated QA;
- browser evidence generation;
- isolated branch commits.

It implements a frozen producer brief. It does not own taste.

### Claude in Chrome — runtime QA
Surface: Chrome extension
Model: Claude available in the extension
Default effort: normal/high-quality interactive mode
Role: browser QA

Use for:
- live page inspection;
- DOM/console/network issues;
- interaction checks;
- responsive checks;
- verifying the actual deployed page.

Do not use it to redefine the visual system.

### GPT-6 Astra High — cinematic specialist
Surface: ChatGPT
Model: GPT-6 Astra High
Effort: High
Role: scarce executive cinematic specialist

Use only for:
- unresolved high-impact cinematic questions;
- new presentation-family establishment;
- milestone spot-checks;
- owner-requested specialist review.

### GPT-6 Sol High Work — senior technical production specialist
Surface: ChatGPT Work
Model: GPT-6 Sol
Effort: High
Role: selective senior technical-production / integration specialist

Use for:
- difficult technical integration;
- rescue implementation;
- cross-screen architecture;
- high-value independent verification;
- work Claude Code cannot complete reliably.

### GPT-5.6 Sol — coordinator / product-truth guard
Surface: current ChatGPT conversation
Model: GPT-5.6 Sol
Role:
- routing;
- branch creation;
- product-truth validation;
- authority-state updates;
- budget discipline;
- task packaging;
- handoff continuity;
- deciding which worker should act next.

Sol does not own final visual direction.

## Handoff sequence

### A. Producer -> Coordinator
Claude Chat returns a `VISUAL_PRODUCER_PACKAGE`.

Nik gives the full package to GPT-5.6 Sol.

Sol:
- checks product-truth conflicts;
- identifies any owner decisions;
- commits the accepted producer package to the canonical visual branch;
- creates the implementation branch;
- writes the Cloud build task.

### B. Coordinator -> Cloud Session
Sol gives Nik:
- the exact implementation task file;
- exact branch;
- exact model/effort;
- attachments/assets if any.

Nik launches one Cloud Session.

### C. Cloud Session -> Coordinator
Cloud returns:
- changed-file list;
- commit SHA;
- browser-openable candidate;
- screenshots;
- motion evidence;
- state QA;
- candidate fingerprint;
- implementation limitations;
- no PR unless explicitly requested.

Nik gives the complete handoff to GPT-5.6 Sol.

### D. Coordinator -> runtime QA / producer review
Sol validates product truth first.

Then:
- Claude in Chrome may perform runtime QA when a preview URL is available;
- Claude Chat Project performs the visual producer review of the frozen candidate.

### E. Producer -> Coordinator -> revision worker
Claude Chat returns:
- APPROVE FOR OWNER REVIEW
or
- REVISE with stable issue IDs and exact visual deltas.

Sol packages only accepted deltas into the next Cloud task.

### F. Milestone specialist
Astra or GPT-6 Sol Work is invoked only when the producer/coordinator identifies a reason that justifies scarce usage.

## Branch rule

Canonical visual authority:
`visual/cinematic-system-v10`

Implementation work:
always on a dedicated branch created FROM the current canonical visual head.

Production:
`main`
is never the default visual working branch.

## Budget rule

The visual system is now quality-first, not lightweight-first.

Performance still matters enough to keep the site usable, but no visual direction may be rejected merely because it uses more layers, motion, or assets than the old lightweight proposal.

Cloud Session promotional credit remains a shared project resource. Do not spend all of it on visuals; preserve the agreed reserve for main-game readiness/testing.
