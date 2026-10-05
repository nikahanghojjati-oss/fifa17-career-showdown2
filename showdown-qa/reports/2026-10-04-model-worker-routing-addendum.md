# Model Worker Routing Addendum

Date: 2026-10-04 ET  
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`  
Branch: `qa/showdown-qa-review-2026-10-04`  
Scope: factory reviewer/worker routing conclusions developed after the main factory-system review.

Status: QA/process proposal only. This file does not authorize product-code changes, merges, deployments, or changes to product guards.

---

## Executive recommendation

Use two principal everyday ChatGPT worker classes in the future bug-hunt / QA factory:

1. `GPT-6 Luna Max` as the deep QA investigator, skeptical reviewer, race-condition hunter, contradiction finder, and difficult root-cause worker.
2. `GPT-5.6 Sol normal chat` as the high-volume general reviewer, coordinator, structured QA worker, status reconciler, bounded engineering analyst, and practical day-to-day worker.

Do not replace one with the other. They are complementary.

Escalate beyond those two only when the task shape justifies it:

- `GPT-6.1 Sol Work`: sustained multi-file, terminal, npm, emulator, filesystem, or environment-dependent technical investigation.
- `GPT-6 Astra Work`: rare system-level audit, architecture/factory review, major milestone gate, or unresolved high-impact disagreement.
- Claude lead: factory manager, job decomposition, acceptance/adjudication, and escalation gatekeeper.
- Opus 5.5: independent/blind second opinion when model diversity is especially valuable.
- Fable: rescue/reroute specialist where its demonstrated factory strengths fit.

The intended pattern is:

`regular work -> Sol Chat / Luna Max -> Sol Work when environment/depth demands it -> Astra for exceptional systemic review`.

---

## Why Luna Max should be a regular bug-hunt-factory worker

The QA project charter already designates GPT-6 Luna Max as the preferred model for difficult bug diagnosis, candidate fixes, and reviews.

That makes Luna Max suitable as a regular QA worker, not only as an occasional external reviewer.

Recommended Luna Max jobs include:

- synchronization and race-condition diagnosis;
- stale read / stale authority analysis;
- long-game and multi-season state investigation;
- Local Reconciliation / Final Reconciliation failures;
- authorization vs product-defect separation;
- conflicting test, documentation, status, and live-repository evidence;
- regression archaeology across several PRs;
- classification of PRODUCT_DEFECT vs TEST_DEFECT vs PROCESS_DEFECT vs INFRA_FLAKE vs UNKNOWN;
- identification of fragile behavior that currently passes;
- review of misleading documentation or factory-control state;
- bounded fix proposals plus focused regression checks.

Luna should remain QA/review oriented unless the product authority explicitly changes that boundary. The current QA architecture is intentionally valuable because Luna can challenge implementation without becoming the implementation authority.

---

## Why Max rather than a lighter Luna lane for the hardest jobs

The difficult QA failures in this project are frequently not simple visible defects.

They require reasoning across:

- simultaneous writes;
- stale state;
- exact-head evidence;
- season-number/document identity;
- Firestore rules and client state;
- historical PR behavior;
- local vs shared authority;
- test validity;
- documentation drift;
- product vs process defect classification.

A strong worker must often answer not only "what failed?" but:

- which write raced?
- which read could be stale?
- which authority is current?
- is the test reproducing production behavior?
- is this a product defect or a test/control-plane defect?
- what is the smallest fix?
- what exact regression proves it?
- what remains unknown?

That is the reason to reserve Luna Max for the deeper QA lane.

Important evidence qualification:

The current factory scorecards contain extensive measured results for GPT-5.6 Sol, Sonnet, Opus, Astra Work, Sol Work, and Fable. They do not yet contain an equivalent large empirical factory scorecard for Luna Max.

Therefore Luna Max's proposed regular-worker role is currently supported by:
- the QA charter's explicit model preference;
- the task fit of difficult QA work;
- the project's recurring defect classes;
- the value of an independent QA lane.

It should be measured once the bug-hunt factory starts rather than assumed to be universally superior.

---

## The second principal worker: GPT-5.6 Sol normal chat

GPT-5.6 Sol normal chat should remain a main factory worker.

The Team V scorecard already showed it was strong on:
- truth/review work;
- motion;
- data-oriented work;
- structured analysis;
- bounded jobs.

Recommended regular Chat jobs:

- PR review;
- bounded component review;
- QA packet preparation;
- status and board reconciliation;
- acceptance-criteria checking;
- comparing a proposed fix to current source;
- converting findings into precise factory jobs;
- reviewing Luna findings for evidence quality;
- checking whether a proposed regression actually covers the defect;
- triage and escalation decisions;
- coordination of worker outputs.

Do not make Luna replace regular Sol Chat.

The factory benefits from having both as first-class worker populations.

---

## When Sol Work should enter

Use GPT-6.1 Sol Work when the environment or investigation scope is itself part of the job.

Good triggers:

- several modules and tests must be inspected together;
- terminal/npm/node commands are required;
- Firebase Emulator or browser tooling is needed;
- filesystem/repository manipulation is needed;
- a long technical investigation must be carried through several dependent steps;
- normal chat has identified the likely area but cannot efficiently establish proof.

The existing factory review already found that Work mode can consume the metered pool quickly and can encounter long-session operational friction.

Therefore:

Use Work because Work capabilities are necessary, not merely because a task is intellectually difficult.

---

## When Astra should enter

Astra should not be an everyday factory worker.

Treat Astra as the periodic senior systems reviewer / "factory inspector general."

Recommended Astra triggers:

- before a major release or milestone such as a post-5.2 gate;
- after a large factory generation;
- after a substantial architecture change;
- when the written control plane appears to be drifting from live repository state;
- when Luna and Sol repeatedly find symptoms without identifying the systemic cause;
- when two strong reviewers materially disagree on a high-impact issue;
- when the question is "is this whole factory/architecture healthy?" rather than "what is wrong with this file?";
- when deciding whether the factory itself has become too complicated;
- when an independent, high-effort package-wide review is worth the metered cost.

Claude lead can act as the default escalation gatekeeper for Astra, subject to Nik's product-owner direction.

Astra is a reviewer/advisor, not a new source of product truth.

---

## When ordinary Chat should enter

Ordinary GPT-5.6 Sol Chat should enter constantly.

It is the default high-volume reasoning layer for work that does not need a Work environment and does not justify Astra-level escalation.

This includes both worker jobs and review of other workers.

A useful operating rule:

- normal bounded review -> GPT-5.6 Sol Chat;
- difficult adversarial QA -> Luna Max;
- environment-heavy sustained investigation -> Sol Work;
- systemic milestone audit -> Astra Work.

---

## Blind review protocol

For selected high-risk bugs, run one Luna Max worker and one Sol Chat worker independently on the same frozen evidence.

Do not show either worker the other's hypothesis.

If they converge independently:
- confidence rises, but source verification is still required.

If they disagree:
- treat the disagreement as evidence;
- have the lead/Sol adjudicate;
- escalate to Sol Work or Astra only when impact/uncertainty justifies it.

Use blind review, not blind parallel implementation.

Only one accepted implementation lane should mutate the product surface.

High-value blind-review targets:

- synchronization races;
- Firestore Rules/authz;
- reconciliation/history convergence;
- scoring/tiebreak logic;
- release blockers;
- pre-main acceptance.

---

## Suggested future bug-hunt factory worker architecture

### Principal everyday workers

`Luna Max`
- deep QA;
- bug hunting;
- adversarial review;
- race/state investigation;
- contradiction and fragility detection.

`GPT-5.6 Sol Chat`
- high-volume review;
- coordination;
- triage;
- structured QA;
- evidence packet refinement;
- bounded engineering analysis.

### Escalation workers

`GPT-6.1 Sol Work`
- sustained environment-dependent technical investigation.

`GPT-6 Astra Work`
- exceptional system-wide review and milestone audit.

### Management / adjudication

`Claude lead`
- job decomposition;
- scope/acceptance;
- routing;
- escalation;
- cross-worker adjudication.

`Sol implementation authority`
- independently verifies accepted QA findings against current live authority;
- implements accepted product changes;
- owns tests, exact-head gates, merge, shipment, and required production verification.

---

## Do not let bug hunting become unbounded wandering

Do not issue an endless "find bugs forever" instruction.

Prefer bounded missions such as:

- audit Shared Showdown five-season reliability;
- inspect reconciliation for stuck wait states;
- review simultaneous publishing races;
- compare factory status/control files against live PR/branch state;
- audit one feature for product defects, test defects, process defects, and fragile behavior;
- review one milestone for unproven assumptions.

Each QA job should end with:

- observed facts;
- classification;
- severity/impact;
- hypothesis and confidence;
- smallest bounded fix proposal;
- focused regression;
- unknowns/evidence debt;
- escalation recommendation if needed.

This keeps Luna productive without encouraging speculative issue inflation.

---

## Measurement recommendation once the bug-hunt factory starts

Do not permanently rank Luna Max from theory alone.

Track by worker and job class:

- jobs attempted;
- first-pass accepted findings;
- false-positive/rejected findings;
- root-cause accuracy after implementation verification;
- smallest-fix acceptance rate;
- regression-test quality;
- number of unnecessary escalations;
- time/usage cost;
- bugs uniquely found that other workers missed.

Compare Luna Max and GPT-5.6 Sol Chat on matched QA classes.

If Luna consistently earns its Max cost on hard QA, keep it as a principal worker.

If particular bug classes are equally well handled by cheaper workers, route those classes down.

This preserves the factory's central lesson:

route by job class and evidence, not by one universal model ranking.

---

## Bottom line

Current recommended worker hierarchy:

`Claude lead`
-> manages factory routing and escalation

`Luna Max + GPT-5.6 Sol Chat`
-> two principal everyday QA/review worker populations

`GPT-6.1 Sol Work`
-> difficult environment-heavy technical investigations

`GPT-6 Astra Work`
-> rare, high-value, system-level audit

`Sol implementation authority`
-> verifies and implements accepted product changes

For the immediate pre-factory period, use Luna Max heavily for bounded QA sweeps while the factory has spare review capacity.

When the new factories start, Luna Max should remain a regular main worker in the bug-hunt / QA factory rather than becoming only an occasional reviewer.

Astra should remain the rare visitor.

Luna Max should be an employee.
