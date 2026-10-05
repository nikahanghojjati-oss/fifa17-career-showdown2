# Career Mode Showdown Factory QA Review

Date: 2026-10-04 ET  
Mode: read-only systems review  
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`  
Review branch: `qa/showdown-qa-review-2026-10-04`

Scope:
- Team V visual factory;
- Team G gameplay factory;
- Claude leadership;
- GPT-5.6 Sol normal-chat workers;
- GPT-6.1 Sol Work mode;
- Astra Work mode;
- Claude Opus 5.5;
- Claude Sonnet 5.5;
- Fable 5.1;
- Codex specialist review;
- project evolution;
- current control-plane reliability;
- post-5.2 operating model.

No product branch was changed by this review.

---

## Executive verdict

The factory experiment worked.

Team V proved that Career Mode Showdown can decompose a large visual program into hundreds of bounded jobs, route work across several model families, preserve state through commits/status records, and reassemble the result into an owner-approved package.

Team G is proving the harder extension: the same factory model can operate on stateful gameplay, Firebase rules and synchronization, long-game recovery, shared history, UI integration and race conditions.

The largest current factory weakness is no longer worker intelligence.

It is control-plane truth.

There are now enough:
- workers;
- Claude lead threads;
- boards;
- status files;
- PRs;
- factory branches;
- recovery branches;
- relay messages;
- handoffs;
- automation

that the written system state can lag behind the actual repository state.

That has already happened.

The recommended post-5.2 direction is:

# One truth, many workers

Keep the factories.
Keep model specialization.
Keep one integration authority.

But do not let:
- a factory board;
- a Claude conversation;
- a GPT chat;
- a handoff;
- a status file;
- a progress score

become product truth.

Product-current truth should be small, machine-readable and reconcilable against live GitHub state.

---

## Evidence snapshot

Observed during this review:

| Item | State observed |
| --- | --- |
| main | `8abc561601b75a5a18f03a13ae93be991c5c12bc` |
| live release represented by main | v1.9.1 r53 |
| Team V branch | `factory/v1-wtt5ye` |
| Team V package head | `5e05a1f7dd17ac4ecbba7bb12f0cb91ce8c41f41` |
| Team V board | 238 / 238 jobs, 100% |
| gameplay recovery head when inspected | `710121b34a6bb332e67bb9d2dfcd92abccbf9a19` |
| Team G board | 20 / 33 jobs, 70% at 11:25 PM ET |
| Team G control branch | `factory/gameplay-v1` |
| Claude Team G lead state | Gaffer PAUSE, 91% of 5-hour window |
| current visual approval | V2G-016 says Nik approved `5e05a1f` for wiring |
| open PRs observed | #352, #362, #363 |
| important merged PRs observed | #344-#360 subset, including #350, #357, #358, #359, #360 |

Main remained r53 while newer work existed on recovery/integration branches.

Therefore:
recovery merge != production proof.

---

## Q1 · What has the factory become?

It is a lightweight multi-model production operating system.

Its core pattern is:

1. lead defines truth and job boundary;
2. worker executes a bounded job;
3. CI/review verifies the output;
4. lead/integration authority accepts or rejects;
5. accepted work moves toward a recovery candidate;
6. main and physical production evidence remain separate final authorities.

Team V and Team G apply the pattern differently.

### Team V

Purpose:
presentation production.

Claude lead owns:
- visual product truth;
- board;
- job definitions;
- quality bar;
- screen rendering/checking;
- intake/adjudication.

Workers build:
- truth sheets;
- plates;
- screens;
- phone layouts;
- fixes;
- motion;
- package docs.

### Team G

Purpose:
gameplay/data/integration.

Claude Team G lead owns:
- job decomposition;
- gameplay product truth;
- board;
- worker intake;
- PR review;
- merge into `gameplay/recovery-v1`;
- gated path toward main.

Workers build:
- tests;
- gameplay code;
- adapters;
- screen wiring;
- long-game behavior;
- race-condition fixes.

This separation is healthy.

Do not merge Team V and Team G into one giant factory.

---

## Q2 · How well has Claude run the factories?

Strongly.

Claude's best role has been:
- lead;
- decomposer;
- visual judge;
- job author;
- blocked-question resolver;
- integration reviewer.

This is better than asking one worker to:
plan -> implement -> judge itself -> remember months of product history -> ship.

The weak point is resource concentration.

The Team G board showed the Claude lead pool at 91% and paused.

Therefore the future split should be:

### Lead-only work

Keep with Claude lead:
- product-truth decisions;
- difficult contract decisions;
- acceptance/rejection;
- visual taste;
- job re-brief after failure;
- cross-factory adjudication.

### Delegable intake work

Can go to a non-authoritative worker:
- branch inventory;
- status reconciliation;
- exact checklist comparison;
- PR metadata collection;
- measured gate pre-check;
- report formatting.

The delegate reports facts.
It does not redefine truth.

---

## Q3 · GPT-5.6 Sol normal chat: how did it perform?

Team V scorecard:

| Metric | GPT-5.6 Sol |
| --- | ---: |
| jobs | 121 |
| passed first time | 101 / 121 = 83% |
| fix rounds | 27 on 20 jobs |
| first scored average | 4.01 |
| final average | 4.24 |

The important result is job class.

### Very strong

The factory report records 46 / 46 first-time passes across:
- reviews;
- motion;
- truth/data-oriented work.

This makes normal Sol a good default for:
- product-truth extraction;
- contracts;
- structured reviews;
- status reconciliation;
- QA packets;
- motion notes;
- documentation;
- bounded mechanical deltas;
- branch inventory.

### Weak relative performance

Initial visual screen builds:
1 / 7 first-time pass.

Phone layouts:
12 / 21 first-time pass.

Conclusion:
GPT-5.6 should remain a major factory worker, but not the universal visual builder.

---

## Q4 · GPT-6.1 Sol Work mode: how did it perform?

Team V scorecard records:
- 6 jobs;
- 6 first-time passes;
- scored first-check average about 4.3 on the small sample.

Positive result, but small/easier sample.

More important operational finding:
Work mode consumed the metered pool quickly, often required repeated Continue interactions on long bundles, and encountered save collisions such as HTTP 422 / 409.

Recommended lane:
use Work because the environment is necessary:
- terminal;
- npm/node;
- emulator;
- filesystem/repo integration;
- environment-dependent investigation.

Do not use Work merely because a job is "hard".

---

## Q5 · Astra: what did it achieve?

Team V scorecard:
- 9 jobs;
- 9 first-time passes;
- scored first-check average 4.3 on limited scored sample.

This supports Astra as a reliable specialist.

Good use:
- independent bounded review;
- high-effort package check;
- mechanical specialist task;
- diversity when another model family is already committed to the main approach.

Do not create an independent Astra product authority.

---

## Q6 · Opus 5.5: what did it achieve?

Team V:
- 34 jobs;
- 34 / 34 first-time pass;
- zero fix rounds;
- first scored average 4.32.

Most persuasive comparable result:
Opus phone-layout work: 18 / 18 first-time passes.

Opus also performed the final package review when job 108's planned Codex review was substituted with an Opus project thread, and CC-008 final polish produced the approved package head.

Recommended use:
- first visual composition;
- difficult responsive composition;
- first-of-kind visual system;
- final visual judgment;
- owner-gate level visual review.

Do not spend Opus on mechanical tasks that GPT/Sonnet can do reliably.

---

## Q7 · Sonnet 5.5: what did it achieve?

Team V:
- 52 jobs;
- 50 / 52 first-time pass = 96%;
- 2 fix rounds;
- first scored average 4.22;
- final 4.25.

Strongest role:
- exact fixes;
- bounded UI implementation;
- review;
- already-defined presentation work.

Team G also used Sonnet on Rivalry Statistics / Legacy integration.

Recommended use:
defined execution where the answer is already constrained.

---

## Q8 · What did Fable do?

Fable's value was clearest as a rescue worker.

Jobs:
- 58;
- 83;
- 114

had each already failed two GPT repair rounds.

Fable fixed all three in one pass, about 13 minutes total.

Final scores:
- 4.3;
- 4.3;
- 4.2.

CC-007 also re-cut roughly 100 jobs:
- $7.89;
- 16 minutes.

This validates a rule:

# Two failures -> reframe or reroute

Do not run a third identical repair attempt under unchanged evidence.

Caution:
PR #341 was accidentally opened from a cloud/factory branch toward main and remains titled DO NOT MERGE.

Therefore high-speed cloud work needs strong target-branch validation.

---

## Q9 · What model should do what?

| Work class | Recommended primary |
| --- | --- |
| truth/docs/contracts/status reconciliation | GPT-5.6 Sol normal chat |
| structured review/motion/data | GPT-5.6 Sol |
| small exact code delta | GPT-5.6 Sol or Sonnet |
| new visual composition | Opus 5.5 |
| hard phone/responsive layout | Opus 5.5 |
| exact visual delta/fix | Sonnet 5.5 |
| rescue after 2 failed visual repairs | Fable 5.1 |
| npm/emulator/terminal integration | Sol Work |
| independent specialist review | Astra |
| final visual gate | Opus with rendered evidence |
| high-risk gameplay diagnosis | blind independent QA reviewers |
| final product release gate | exact-head automated evidence + independent review + required real-device proof |

This is specialization, not a universal model ranking.

---

## Q10 · How did the project evolve into factories?

### Generation 1 · local product

Career Mode Showdown first became a functioning SPA:
- routing;
- storage;
- league/club choice;
- seasons;
- scoring;
- statistics;
- Legacy.

The correct strategic choice was local product completeness before networking.

### Generation 2 · recovery and offline reliability

The project hardened:
- PWA;
- updater;
- Save Library;
- recovery;
- storage failure;
- Candidate A/B/C;
- rollback;
- identity.

This created the project's evidence discipline.

### Generation 3 · private connected architecture

The project added:
- accounts;
- device registration;
- pairing;
- Connected Rivalry;
- remote/private state

while preserving:
- Spark only;
- billing off;
- local-first safety;
- exactly two private managers.

### Generation 4 · milestone/evidence operating systems

RJR, SSJR, MDP, POS10/POS20 increased:
- exact-head rigor;
- evidence accountability;
- release proof.

They also increased documentation/control-plane complexity.

### Generation 5 · isolated visual and QA workstreams

Visual became a presentation-only sibling.
QA became an evidence/review sibling.

This reduced the chance that aesthetic work or review work silently changed product authority.

### Generation 6 · factories

Team V and Team G converted work into bounded, resumable, measurable jobs.

This is the largest organizational shift in the project.

---

## Q11 · Where is the project right now?

### Team V

Board:
238 / 238 complete.

Package:
15 screens plus shared kit and showcase.

Approved package:
`5e05a1f`.

### Team G

Board reported:
20 / 33 complete.

Important repository work observed:

- PR #349 loader/top bar foundation: merged.
- PR #360 Home/Audius/Loading: merged.
- PR #354 Start/Join/League/Club: merged.
- PR #355 Rule Book/Settings: merged.
- PR #357 Season Results/Final Winner/Standings: merged.
- PR #350 long-game session-expiry recovery: merged.
- PR #358 fewer-taps flow: merged.
- PR #359 simultaneous Season Result stale handling: merged.
- PR #362 Transfer War integration: open during review.
- PR #352 Rivalry/Legacy integration: open during review.
- PR #363 J10 local reconciliation waiting fix: open during review.

Main remained r53 at the review snapshot.

---

# Current verified system findings

## F1 · Team G board/status disagrees with live execution

Classification: PROCESS_DEFECT  
Severity: High  
Confidence: High

Observed:

### JOB-29

Status file:
`IN PROGRESS`, step 3/4.

Live PR:
#357 merged into `gameplay/recovery-v1`.

### JOB-31

Board open table:
`NOT WRITTEN`.

Live PR:
#350 merged.

The same board's bug section says the job 31 fix is DONE.

### JOB-33

Board:
`NOT WRITTEN`.

Live PR:
#358 merged.

Relay also reports job 33 merged.

### JOB-27

Status file:
`READY`, step 0, PR none.

Live:
PR #362 exists and board running section shows 6/7.

Impact:
a reviewer can receive a false factory state while the code execution plane is correct and ahead.

Smallest fix:
derive/reconcile board state from:
- job definition;
- status file;
- PR state;
- merge state;
- branch head;
- exact-head CI;
- lead acceptance.

If contradictory:
show `CONTROL_PLANE_STALE`.

Do not silently choose one stale normal status.

---

## F2 · Root active-authority metadata is ambiguous

Classification: PROCESS_DEFECT  
Severity: High  
Confidence: High

Root `AGENTS.md`:
POS20 active.

`CURRENT_PRODUCT_GUARDS.json`:
`"operatingSystem": "POS10"`.

Possibilities:
- stale field;
- guard-kernel provenance;
- intentionally frozen origin field.

The problem is that the name looks like current operating authority.

Smallest correction:
either update it to active authority or rename/separate the concept, e.g.:
- `activeOperatingSystem`;
- `guardKernelOrigin`.

Do not change guard behavior merely to fix naming.

---

## F3 · Direct/lead execution can bypass the factory ledger

Classification: PROCESS_DEFECT  
Severity: High  
Confidence: High

Jobs 27/31/33 demonstrate that real work may happen through lead/direct PR paths without the corresponding factory status record moving in lockstep.

This creates orphan execution.

Recommendation:
every factory-associated PR should carry a machine-readable job id.
GitHub events should reconcile status automatically.

---

## F4 · Claude lead is both authority and scarce throughput resource

Classification: PROCESS_DEFECT / capacity risk  
Severity: Medium  
Confidence: High

Team G board showed lead usage at 91%, paused.

Recommendation:
keep authority/judgment with lead, move mechanical intake to delegates.

Never solve lead scarcity by giving multiple leads independent truth.

---

## F5 · Early visual routing wasted repair loops

Classification: PROCESS_DEFECT  
Severity: Medium  
Confidence: High

GPT-5.6 did much of the early visual work and accumulated nearly all factory repair rounds.

The factory later discovered superior routing empirically.

Future factories should begin with scorecard-based routing instead of relearning it.

---

## F6 · Work mode has coordination cost

Classification: PROCESS_DEFECT / routing issue  
Severity: Medium  
Confidence: Medium-High

It is capable, but:
- metered;
- continuation-heavy on bundles;
- prone to save collisions in the observed factory history.

Use it where terminal/environment capability is essential.

---

## F7 · Visual scoring is not fully independent

Classification: PROCESS_DEFECT  
Severity: Medium  
Confidence: High

Claude-family workers were often checked by Claude-family lead/reviewer.

This does not invalidate the scorecard:
actual FIX rounds are concrete evidence.

But numeric model comparisons should not be treated as a controlled benchmark.

Recommended:
sample independent reviews for benchmark calibration.

---

## F8 · Factory completion is not production proof

Classification: release evidence rule  
Severity: Critical if violated  
Confidence: High

Team V 100% means visual package complete, not live production.

Recovery merge means integrated candidate, not production.

CI green means automated gates passed, not real two-account physical proof.

Preserve this distinction permanently.

---

## F9 · Accidental branch targeting demonstrates guard need

Classification: PROCESS_DEFECT  
Severity: Medium-High  
Confidence: High

PR #341:
`DO NOT MERGE: factory branch into main (opened by mistake; CC-007 brief already on factory/v1-wtt5ye)`.

No claim of damage.

Lesson:
factory/cloud branches should have an automated forbidden-target check.

---

# Recommended post-5.2 design

## Level 0 · Owner policy

Small, explicit, human-owned:
- exactly two managers;
- Spark only;
- billing off;
- privacy;
- scoring;
- manager side assignment;
- no public discovery/community/rankings;
- owner release decisions.

Workers cannot silently rewrite this.

## Level 1 · Canonical current authority

Proposed concept:

`SHOWDOWN_AUTHORITY_CURRENT.json`

Suggested fields:
- main SHA;
- production runtime/version;
- active operating system;
- product guards version/hash;
- data contract version/hash;
- approved visual package SHA where relevant;
- recovery/integration head;
- approved release-candidate SHA if any;
- unresolved release blockers;
- behavior-affecting owner decisions;
- generator version/timestamp.

Important:
generate/validate from authoritative inputs wherever possible.

Do not create another manually narrated mega-status document.

## Level 2 · Integration candidate manifest

Proposed:

`INTEGRATION_CANDIDATE.json`

Pin:
- Team V package SHA;
- Team G recovery SHA;
- included PRs;
- exact-head test evidence;
- contract version;
- unresolved evidence debt;
- physical proof status;
- production eligibility.

Only one candidate SHA at a time is release-proof eligible.

## Level 3 · Factory boards

Boards are:
- queues;
- progress views;
- dashboards.

They are not product authority.

Each board should declare the Level-1 authority snapshot/hash it was built against.

## Level 4 · Worker jobs

A worker should normally need only:
- one job id;
- one frozen authority snapshot;
- one base SHA;
- one contract version;
- one file/path allowlist;
- one acceptance test;
- one output target.

The worker should not need months of historical narrative.

---

# Cross-factory contract protocol

Team V owns presentation.
Team G owns gameplay/data.
Integration composes them.
Nik owns product behavior.

If Team V needs a field:
- do not invent it;
- submit contract-change request.

Team G:
- accepts and bumps contract;
- or rejects with reason.

If Team G changes shape:
- do not silently change Team V fixtures;
- bump contract;
- produce compatibility fixture/evidence.

Each factory pins exact contract hash/version.

---

# Blind review recommendation

Use blind independent analysis for high-risk topics:
- races;
- Firestore Rules/authz;
- reconciliation;
- history convergence;
- scoring/tiebreak;
- release blockers;
- final pre-main code review;
- sampled final visual gates.

Protocol:
1. freeze SHA and acceptance rules;
2. Reviewer A and B receive identical evidence;
3. do not show hypotheses to the other reviewer;
4. each returns facts, hypothesis, confidence, smallest fix, regression check;
5. Sol/lead adjudicates against source;
6. one implementation worker edits.

Do not run blind parallel implementation of the same feature.

Models should compete in diagnosis, not in concurrent mutation.

---

# Completion vocabulary

Recommend:
- `WORKER_DONE`
- `LEAD_ACCEPTED`
- `INTEGRATED`
- `CANDIDATE_GREEN`
- `DEVICE_PROVEN`
- `PRODUCTION_PROVEN`
- `CLOSED`

This prevents one word, DONE, from meaning seven different things.

---

# Factory health audit

A future read-only health check should detect:

1. status NOT STARTED but matching PR exists;
2. status IN PROGRESS but PR merged;
3. status DONE but no output commit;
4. merged PR but missing job/status record;
5. board/status disagreement;
6. stale authority snapshot;
7. `AGENTS.md` vs machine-readable authority disagreement;
8. relay says package approved but integration manifest lacks package SHA;
9. factory/cloud PR targeting main without explicit release authorization;
10. exact-head check belongs to a different SHA than discussed candidate;
11. production-proof claim lacks exact deployed SHA + required physical evidence.

This check would have caught several current contradictions.

---

# Post-5.2 closeout sequence

## A · release truth

- prove exact deployed release;
- complete required two-manager / long-game acceptance;
- record final production SHA/runtime;
- explicitly carry unresolved blockers.

## B · control-plane reconciliation

- reconcile job/status/PR contradictions;
- resolve POS20/POS10 metadata ambiguity;
- archive/close accidental stale PRs when product authority approves;
- create canonical authority manifest;
- make stale status detectable.

## C · archive

- freeze Team V completed factory state;
- freeze completed Team G milestone state;
- preserve scorecards and evidence;
- move superseded operational handoffs to history.

## D · future work

Do not grow one immortal 200+ job factory forever.

Create temporary milestone factories:
- hardening;
- UX polish;
- data/history;
- bug-fix;
- next feature milestone.

Each starts from a frozen authority snapshot and is archived after integration.

---

# Factory scorecard interpretation warning

The model data is useful but not scientific.

Confounders:
- job difficulty differed;
- later jobs were smaller/better briefed;
- Claude often judged Claude-family output;
- numeric scores exist only for a subset;
- Work/Astra samples are small;
- cost data is incomplete.

Correct conclusion:
route by comparable job class.

Incorrect conclusion:
"one model is globally best."

---

# Historical external-review connection

The retained August 21 Grok review warned that process/documentation complexity was becoming a first-class risk.

It recommended a smaller current authority surface and live-state re-verification by successor sessions.

The factories solve old long-chat/context problems, but current Team G status drift demonstrates a new form of the same authority-sprawl problem.

The answer is not less rigor.

It is a smaller machine-reconciled current truth.

---

# Final assessment

The factory is a success.

The next maturity problem is not:
"Can AI do the work?"

It is:
"Can every worker prove which truth it used, and can the system prove its reported status matches GitHub?"

Recommended future:

- keep Team V and Team G specialized;
- keep Claude lead judgment;
- keep GPT normal-chat throughput;
- keep Opus/Sonnet/Fable/Astra specialization;
- keep QA independent;
- add one canonical current truth;
- add one integration candidate manifest;
- make boards derived/reconciled;
- use blind review on high-risk analysis;
- use one implementation path;
- archive factories after milestones;
- never equate factory completion with production proof.

That gives Career Mode Showdown one truth and many workers without creating competing authorities.
