# Claude / Cloud Review Packet

Date: 2026-10-04 ET  
Branch: `qa/showdown-qa-review-2026-10-04`  
Status: QA proposal only  
Mutation authority: none

## Read order

1. `showdown-qa/README.md`
2. `showdown-qa/reports/2026-10-04-factory-system-master-review.md`
3. `showdown-qa/reports/2026-10-04-historical-findings-ledger.md`
4. `showdown-qa/reports/2026-10-04-model-worker-routing-addendum.md`
5. `showdown-qa/reports/2026-09-25-navigation-reliability-reconstructed.md`
6. `showdown-qa/SOURCE_MANIFEST.md`
7. `showdown-qa/QA_PROJECT_CHARTER_SNAPSHOT.md`

Then independently reconcile live GitHub state before accepting any current-state claim.

## Goal

Return a governance/reliability proposal for Nik that preserves the factory system but makes Team V, Team G, GPT workers, Claude workers, Work mode, Astra, Fable, Codex and QA operate from one canonical current truth.

Do not implement anything from this packet.

## Core conclusion to evaluate

The factories are successful.

The highest current system risk is control-plane truth drift rather than lack of model capability.

### Verified examples from the QA snapshot

- JOB-29 status said IN PROGRESS while PR #357 was merged.
- Team G board listed JOB-31 NOT WRITTEN while PR #350 was merged.
- Team G board listed JOB-33 NOT WRITTEN while PR #358 was merged.
- JOB-27 status said READY / PR none while PR #362 existed and the board showed 6/7 progress.
- `AGENTS.md` says POS20 active while `CURRENT_PRODUCT_GUARDS.json` says `"operatingSystem": "POS10"`.
- PR #341 demonstrates an accidental factory/cloud branch target toward main and is explicitly titled DO NOT MERGE.

Re-check all of these against live state. If the repo moved, label the old observation HEAD_MOVED rather than treating it as current.

## Model-routing findings to evaluate

Team V scorecard evidence:

| Worker | Jobs | First-time pass | Important interpretation |
| --- | ---: | ---: | --- |
| GPT-5.6 Sol normal chat | 121 | 83% | excellent on truth/review/motion; weak on first visual builds |
| Opus 5.5 | 34 | 100% | strongest visual/phone evidence, but smaller/easier mix |
| Sonnet 5.5 | 52 | 96% | strong exact fixes/reviews/defined implementation |
| Astra Work | 9 | 100% | small sample, reliable specialist |
| GPT-6.1 Sol Work | 6 | 100% | small sample, environment useful but metered |
| Fable 5.1 | rescue lane | 3/3 rescue jobs | fixed three jobs after two GPT repair failures |

Do not convert this into a universal model ranking.

Propose routing by task class.

## Two-failure rule

Please assess formalizing:

If the same acceptance item fails twice under materially unchanged evidence:
- stop;
- reframe;
- change worker/lead/brief;
- do not run an identical third repair loop.

Fable's 3/3 rescue result is the strongest current evidence for this.

## Proposed authority architecture to assess

### Level 0 · owner policy

Human-owned behavior constraints.

### Level 1 · canonical current authority

Candidate concept:
`SHOWDOWN_AUTHORITY_CURRENT.json`

Potential fields:
- current main SHA;
- deployed runtime;
- active operating system;
- guard version/hash;
- data contract version/hash;
- approved visual package SHA;
- recovery/integration head;
- current release candidate;
- open release blockers;
- owner behavior decisions;
- generator version/time.

Prefer generation/validation from authoritative sources.

Do not create another giant narrative handoff.

### Level 2 · integration candidate

Candidate concept:
`INTEGRATION_CANDIDATE.json`

Pin:
- visual package SHA;
- recovery SHA;
- included PRs;
- exact-head checks;
- contract version;
- evidence debt;
- real-device proof state;
- production eligibility.

### Level 3 · factory boards

Derived queue/progress views only.

Each board should pin the authority snapshot it was built against.

### Level 4 · worker jobs

Each job should pin:
- job id;
- authority snapshot;
- base SHA;
- contract version;
- allowed paths;
- acceptance tests;
- output target.

## Board reconciliation proposal requested

Design a minimal mechanism that consumes:
- job definition;
- job status;
- PR state;
- merge state;
- code branch head;
- exact-head CI;
- lead acceptance.

When those sources contradict:
show an explicit state such as `CONTROL_PLANE_STALE`.

Do not silently prefer a stale status file or stale board.

## Cross-factory contract proposal requested

Team V:
presentation.

Team G:
gameplay/data.

Integration:
composition.

Nik:
product decisions.

If Team V needs a new field:
submit contract-change request.

If Team G changes a field:
bump contract/version/hash and provide compatible fixture/evidence.

No factory silently changes the other's product truth.

## Blind review protocol requested

Use blind independent review for:
- race conditions;
- Firestore Rules/authz;
- history/reconciliation;
- scoring/tiebreak;
- release blockers;
- pre-main final code review;
- sampled final visual review.

Suggested protocol:
1. freeze exact SHA and acceptance rules;
2. Reviewer A/B get same evidence;
3. hide hypotheses from each other;
4. require facts, hypothesis, confidence, smallest fix, regression test;
5. Sol/lead adjudicates;
6. one implementation worker mutates.

Do not use blind parallel implementation of the same product surface.

## Completion vocabulary proposal

Assess:
- WORKER_DONE
- LEAD_ACCEPTED
- INTEGRATED
- CANDIDATE_GREEN
- DEVICE_PROVEN
- PRODUCTION_PROVEN
- CLOSED

The purpose is to stop "DONE" from representing incompatible proof levels.

## Factory lifecycle proposal

After 5.2:

1. prove exact deployed release;
2. complete required two-device/long-game acceptance;
3. reconcile board/status/PR state;
4. clarify POS20/POS10 authority metadata;
5. archive completed factory generation;
6. preserve scorecards/evidence;
7. create the next factory only as a temporary milestone system from a frozen authority snapshot.

Do not maintain one immortal factory forever.

## What to return to Nik

Please return a proposal containing:

1. which QA findings you agree with;
2. which are stale or incorrect after live reconciliation;
3. any additional control-plane defects you find;
4. minimal canonical-authority manifest design;
5. minimal integration-candidate manifest design;
6. board/PR/status reconciliation design;
7. Team V <-> Team G contract-change protocol;
8. blind-review protocol;
9. factory archival/reset policy;
10. model-routing changes you recommend;
11. exact files you would change after Nik approves;
12. migration order;
13. risks and rollback of the governance changes.

## Hard constraints

Do not change:
- main;
- either factory;
- gameplay/recovery-v1;
- scoring;
- manager count or manager roles;
- Firebase billing/settings;
- privacy/public scope;
- auth/provider scope;
- canonical storage;
- Candidate C destructive-apply authority;
- production data;
- release/deployment state.

Return analysis/proposal only.

The goal is not more process.

The goal is a smaller current-authority surface that makes the existing process easier to trust.
