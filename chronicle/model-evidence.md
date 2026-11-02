# Model effectiveness: cumulative evidence through 31 October 2026

The old 237-job visual factory scorecard is a historical cohort, not a whole-project model ranking. This reconciliation combines that cohort with signed status records, main commit history, later handoffs, accepted review findings and merged fixes. It is an observational repository study, not a controlled model benchmark.

## What changed in the interpretation

- GPT-5.6 Sol’s early visual-layout weaknesses cannot be generalized to Sol 6, Sol 6.1, Terra, or every GPT task. Its historical text/review/motion slice passed 46/46.
- Sol 6.1 has later accepted diagnostic contributions with merged fixes in r86 and r87, beyond the old six-job Work sample.
- Terra’s credited launch-database diagnosis prompted the Special Player rebuild; implementation credit remains separate.
- Fable has evidence of cinematic construction and screen-transition repair, beyond its three historical rescue jobs.
- Opus has extensive integration evidence and also documented rework. Its 34/34 historical visual cohort is not a perfect record across the project.
- Luna, model versions omitted from labels, and most effort settings remain unranked where completed signed evidence is absent.

## Coverage and limits

Captured main: `5b4337fdd64aaf1e2ed8de5abf6830021f29c82e`. Work branch r87: `73713d75b5ef9f5cee62a26038ec1468111c5e34`. The r87 branch is work in progress, not a claim of production deployment.

Read 3,973 unique commit objects reachable from captured main and 1,297 distinct Markdown blobs selected across seven pinned refs. The latter includes all selected main/r87 Markdown blobs and factory status/review/worker/handoff records, with identical blob content deduplicated. There are 567 factory status records: 424 numbered job dossiers and 143 other status records. 120 numbered job dossiers have no literal Chat field. Also inspected 95 additional recent r87 commits from its first API page; this is not an exhaustive r87 ancestry walk.

Coverage is repository-wide on captured main and bounded across selected branches, not exhaustive over every repository branch, private chat or external artifact. No live app, model benchmark, billing measurement or game regression was rerun. Historical records can overwrite earlier checks; missing fields cannot establish failure or absence of work. Commit signatures are recorded attribution, not cryptographic proof of model execution.

## Comparison by identified model

### GPT-5.6 Sol

**Role:** Normal chat; product truth, reviews, motion, visual implementation

Historical Team V: 101/121 first passes (83.5%); reviews, motion and truth/data combined 46/46; screen builds 1/7 and phone layouts 12/21.

133 numbered job-status records explicitly name GPT-5.6 Sol across the two pinned factory branches. This is broader attribution coverage, not 133 independently evaluated outcomes.

**Assessment:** Best-supported strength is structured text/data and review. The early visual-build weakness is cohort-specific; it does not establish the performance of later GPT models.

**Effort:** High is named for the art-director conversation in a routing document; individual outcome rows mostly omit effort.

- [WORKER_SCORECARD.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0ed7a5ee76a07324c12140a12cf95d9ce1fee22d/project-documents/factory/reviews/WORKER_SCORECARD.md)
- [WORKER_MODEL_DECISION_V10.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0ed7a5ee76a07324c12140a12cf95d9ce1fee22d/visual-assets/v10/WORKER_MODEL_DECISION_V10.md)

### GPT-6 Sol

**Role:** Work-mode source audit; normal-chat logic fixes

JOB-1017 reports four confirmed findings with eight standalone Node cases, without browser/Firebase execution. JOB-1055 and JOB-1058 are explicitly signed GPT-6 Sol normal chat.

Three explicit GPT-6 Sol job records: 1017, 1055, 1058. JOB-1058 addresses the shared transfer countdown.

**Assessment:** Evidence of useful audit and bounded logic work. No comparable first-pass or accepted-finding denominator supports a whole-model win rate.

**Effort:** High is a routing recommendation, not a measured effort/result comparison.

- [JOB-1017.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/fe1fbfef3c8477692b52bb469754a9acff8e33a9/project-documents/gameplay-factory/status/JOB-1017.md)
- [JOB-1058.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/fe1fbfef3c8477692b52bb469754a9acff8e33a9/project-documents/gameplay-factory/status/JOB-1058.md)

### GPT-6.1 Sol / Sol 6.1

**Role:** Work-mode implementation; independent red-team review

Historical Team V Work cohort: 6/6 first passes. Separately, Claude accepted the r85 History timeout finding; PR #1025 merged its fix. PR #1102 merged fixes explicitly attributed to Sol 6.1 squad findings.

Seven numbered job-status records explicitly contain Sol 6.1: six visual bundle jobs plus Team G JOB-1020. Later review value is supported by accepted findings and merged fixes, not just author claims.

**Assessment:** Strong newer evidence for diagnostic review and useful bounded implementation. Keep the six-job historical rate separate from red-team results.

**Effort:** High appears in the bundle launch instructions. Per-job runtime effort is not attested; the newer reviewer records do not state effort.

- [WORKER_SCORECARD.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0ed7a5ee76a07324c12140a12cf95d9ce1fee22d/project-documents/factory/reviews/WORKER_SCORECARD.md)
- [SOL_ROUND2_R85_VERDICTS.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/d54db6f05f5a3f8643fff19727da8053ff070950/SOL_ROUND2_R85_VERDICTS.md)
- [JOB-1020.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/fe1fbfef3c8477692b52bb469754a9acff8e33a9/project-documents/gameplay-factory/status/JOB-1020.md)
- [LOG_LEAD_REPLIES.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0ed7a5ee76a07324c12140a12cf95d9ce1fee22d/project-documents/factory/handoffs/lead-shelf/LOG_LEAD_REPLIES.md)

### GPT-5.6 Terra

**Role:** FIFA 17 data verification

HO-037 explicitly credits Terra job 1851 with identifying later-update data in the old 200-player pool, including 112 overall-rating mismatches against launch.

The relay records the decision to rebuild; PR #1030 merged the launch-data top-300 rebuild. The relay reports 305 rows after retaining ties.

**Assessment:** A concrete data-quality contribution that changed the product. Credit the diagnosis to Terra and the rebuild to its implementers. The underlying CSV was not independently revalidated in this audit.

**Effort:** Not recorded. No evidence here for a Terra 6 or Terra 6.1 completion.

- [HO-037_rebuild-200-special-players-from-fifa-17.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/d6dabc59cc5607dcdde6ec69551236f5c743b87a/project-documents/leads-relay/handoffs/HO-037_rebuild-200-special-players-from-fifa-17.md)

### Astra (Work mode)

**Role:** Visual implementation bundle

Historical Team V: 9/9 first passes; only one numerically scored job (4.3). JOB-168 explicitly records a mixed Astra/Claude handoff after a save failure.

All nine bundle labels omit Astra version. GPT-6 Astra Medium/High also appears in routing documents, which do not establish those settings were used for these jobs.

**Assessment:** Positive small historical sample. Do not relabel it GPT-6 Astra or treat 100% as proof of superiority.

**Effort:** High is linked in bundle instructions; Medium/High elsewhere are proposed routing.

- [WORKER_SCORECARD.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0ed7a5ee76a07324c12140a12cf95d9ce1fee22d/project-documents/factory/reviews/WORKER_SCORECARD.md)
- [LOG_LEAD_REPLIES.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0ed7a5ee76a07324c12140a12cf95d9ce1fee22d/project-documents/factory/handoffs/lead-shelf/LOG_LEAD_REPLIES.md)
- [WORKER_MODEL_DECISION_V10.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0ed7a5ee76a07324c12140a12cf95d9ce1fee22d/visual-assets/v10/WORKER_MODEL_DECISION_V10.md)

### Luna / GPT-6 Luna

**Role:** Earlier visual-builder discussion; later routing policy

The V10 decision document discusses earlier Luna visual work and removes Luna from the default builder role.

No attributable completed job, signed delivery or comparable outcome denominator was found for Luna in this captured corpus.

**Assessment:** Unranked for effectiveness. A policy opinion is historical context, not a measured failure rate. No separate Terra Luna model is attested.

**Effort:** Luna Max is discussed as a non-default choice; no signed outcome at Max found.

- [WORKER_MODEL_DECISION_V10.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0ed7a5ee76a07324c12140a12cf95d9ce1fee22d/visual-assets/v10/WORKER_MODEL_DECISION_V10.md)

### Codex (underlying model unspecified)

**Role:** Implementation and automated review

Historical Team V: 7/7 first passes, no numerical review scores. Team G rows also record both successful Codex jobs and jobs repaired by the lead.

Review, implementation and cloud/Work labels are preserved separately. A Codex signature or tool label does not establish a particular GPT model version.

**Assessment:** Useful cross-role evidence, insufficient for an exact GPT-model leaderboard. Quota-exhausted or uncompleted reviews do not count as completed reviews.

**Effort:** Mostly unrecorded; do not infer from the Codex name.

- [WORKER_SCORECARD.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0ed7a5ee76a07324c12140a12cf95d9ce1fee22d/project-documents/factory/reviews/WORKER_SCORECARD.md)
- [WORKER_SCORECARD.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/fe1fbfef3c8477692b52bb469754a9acff8e33a9/project-documents/gameplay-factory/WORKER_SCORECARD.md)

### Claude Opus 5.5

**Role:** Implementation, integration and repair

Historical Team V: 34/34 first passes; 18/18 phone layouts; 4.32 first/final average over 13 scored jobs.

Later Team G rows document real corrective rounds on Opus-led integration (for example jobs 24, 31 and 33). PR #824 is a later documented repair extending the no-flash work.

**Assessment:** Broad evidence for delivery and complex integration, with real rework. The old perfect cohort is not an all-project perfect record. 1M context signatures are a context label, not an effort level.

**Effort:** Medium/High/Extra high appear in routing; no comparable outcome series by effort.

- [WORKER_SCORECARD.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0ed7a5ee76a07324c12140a12cf95d9ce1fee22d/project-documents/factory/reviews/WORKER_SCORECARD.md)
- [WORKER_SCORECARD.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/fe1fbfef3c8477692b52bb469754a9acff8e33a9/project-documents/gameplay-factory/WORKER_SCORECARD.md)

### Claude Sonnet 5.5

**Role:** Visual changes, reviews and gameplay fixes

Historical Team V: 50/52 first passes (96.2%); 4.22 first and 4.25 final average over 11 scored jobs.

Later Team G records include JOB-1040 with one corrective round and JOB-1043 passing first time. The scorecard itself identifies its author as a Sonnet 5.5 thread.

**Assessment:** Good evidence for precise changes and review in the studied tasks. Task mix and reviewer overlap prevent a causal head-to-head ranking.

**Effort:** No reliable outcome comparison by effort found.

- [WORKER_SCORECARD.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0ed7a5ee76a07324c12140a12cf95d9ce1fee22d/project-documents/factory/reviews/WORKER_SCORECARD.md)
- [WORKER_SCORECARD.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/fe1fbfef3c8477692b52bb469754a9acff8e33a9/project-documents/gameplay-factory/WORKER_SCORECARD.md)

### Claude Fable 5.1

**Role:** Rescue work, screen-transition repair and cinematic screen construction

Historical rescue: jobs 58, 83 and 114 each passed after Fable took over following two failed GPT fix rounds. JOB-1635 has individually signed Fable commits.

The r87 HO-040 handoff explicitly credits Fable 5.1 with the Roulette screen and records owner approval. The handoff also leaves real-iPhone frame rate unmeasured. Later Opus work extended the screen-flash fix in PR #824.

**Assessment:** Strong evidence beyond rescue: sophisticated new construction and cross-screen repair. Keep original assignment, rescue, integration and later repair as separate credits.

**Effort:** High appears in an audit assignment; Roulette delivery does not state effort.

- [WORKER_SCORECARD.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/0ed7a5ee76a07324c12140a12cf95d9ce1fee22d/project-documents/factory/reviews/WORKER_SCORECARD.md)
- [HANDOFF_HO-040_DONE.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/73713d75b5ef9f5cee62a26038ec1468111c5e34/gameplay/r87/HANDOFF_HO-040_DONE.md)

### Claude Haiku 5.5

**Role:** Small lead contract follow-ups

Two non-squash main commits explicitly name Haiku 5.5: 59864540 (sealed-club-summary contract) and 66c5ac67 (keep-empty/backup-choice contract).

These signatures establish limited contributions; they do not identify the author of surrounding Opus-session work.

**Assessment:** Real but very small signed sample. No defensible success rate or broad capability ranking.

**Effort:** Not recorded.


### GPT-6, variant unspecified

**Role:** Recorded chat work

JOB-1048 (Team G) and JOB-1047 (Team V) explicitly record GPT-6 without a Sol/Astra/Luna variant.

Preserved as separate evidence; not silently assigned to GPT-6 Sol.

**Assessment:** Insufficient model identity for a variant-specific conclusion.

**Effort:** Not recorded.


### Sol / Claude, version unspecified

**Role:** Additional implementation, review and lead work

Many records name only Sol Work mode, Sol chat, Claude Code or lead. Some statuses have no Chat field at all.

Versionless records and unsigned r87 audits remain unattributed. A role assignment, filename, branch name or question addressed to Astra is not a signature.

**Assessment:** Do not fill the gaps by guessing the model or effort.

**Effort:** A Sol Work Low-effort scorecard backfill is explicitly recorded; its exact model version is not.

- [WORKER_SCORECARD.md](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/fe1fbfef3c8477692b52bb469754a9acff8e33a9/project-documents/gameplay-factory/WORKER_SCORECARD.md)

## Historical Team V outcomes (4 October cohort only)

| Recorded label | Jobs | First passes | Rate | Scored jobs | First / final mean |
|---|---:|---:|---:|---:|---|
| GPT-5.6 Sol (normal chat) | 121 | 101 | 83.5% | 48 | 4.01 / 4.24 |
| Codex | 7 | 7 | 100.0% | 0 | None / None |
| Image tickets (ChatGPT) | 8 | 8 | 100.0% | 0 | None / None |
| Claude Sonnet 5.5 | 52 | 50 | 96.2% | 11 | 4.22 / 4.25 |
| Astra (Work mode) | 9 | 9 | 100.0% | 1 | 4.3 / 4.3 |
| GPT-6.1 Sol (Work mode) | 6 | 6 | 100.0% | 3 | 4.3 / 4.3 |
| Claude Opus 5.5 | 34 | 34 | 100.0% | 13 | 4.32 / 4.32 |

Fable rescues retain separate credit because their original jobs remain under GPT-5.6. No 237-job figure is added to the 424 dossier count: they overlap and have different inclusion rules. Unequal task mix, small samples and Claude reviewing Claude limit inference. No pooled all-project pass rate is computed.

## Effort evidence

| Setting | What is actually recorded | Limit |
|---|---|---|
| GPT-5.6 Sol High | Current art-director conversation named in V10 document | Identity/role context; no effort-specific outcome series |
| Sol Work Low | Team G scorecard says its backfill was completed by a Low-effort Sol Work chat | Completed documentation attribution; model version unknown |
| Sol 6.1 High | Team V bundle launch instruction names GPT-6.1 Sol High | Linked assignment context; per-job effort not independently attested |
| Astra High | Lead log provides a High-effort Astra bundle prompt | Version absent; no comparison with other efforts |
| GPT-6 Sol High; GPT-6 Astra Medium/High | V10 model decision and worker routing | Recommendations, not completed-job evidence |
| GPT-5.6 Sol Max; Luna Max; Astra Max | Successor capability expectations / routing policy | No signed comparable completed-outcome series at Max |
| Extra high / xhigh | Routing documents discuss Opus Extra high and GPT escalation | No verified per-effort denominator; no effort leaderboard |
| Terra, Haiku, newer Sol review, Roulette Fable | Delivery/credit records omit effort | Unknown, retained explicitly |

A launch instruction supports assigned effort, not proof of the effective runtime setting. Confidence/severity columns saying High or Medium are not reasoning-effort metadata. Context length (1M) is not effort.

## Attribution and outcome rules

One observation is keyed to its source artifact or team/job identity; mirrored documents and copied release messages are not new jobs. Assignment, implementation, rescue, review, acceptance and integration are separate roles. A DONE label establishes a recorded state, not an independent first pass. A self-reported finding stays separate from a lead-accepted finding. Acceptance stays separate from a merged fix. A game readiness score is not a model-effectiveness score.

No overall numeric model ranking is justified: task difficulty, tools, reviewers, model identity, effort, tokens and costs are incompletely observed. Strongest evidence by role: Fable for the documented Roulette visual delivery and rescue cases; Sol 6.1 for the later accepted review cases; Terra for the launch-data correction; Opus/Sonnet for broad implementation and integration, with the stated rework limits. These are evidence-backed role observations, not controlled superiority claims.

## Explicit Chat-label census (numbered dossiers, not success rates)

| Explicit label | Dossiers |
|---|---:|
| GPT-5.6 Sol | 133 |
| No attributable model | 132 |
| Claude Sonnet 5.5 | 52 |
| Claude, model/version unspecified | 32 |
| Claude Opus 5.5 | 27 |
| Sol, version unspecified | 19 |
| Astra, version unspecified | 9 |
| Codex, model unspecified | 8 |
| Sol 6.1 | 7 |
| GPT-6 Sol | 3 |
| GPT-6, variant unspecified | 2 |

## Non-squash commit-signature inventory

This inventory counts each model name once per commit object and excludes messages containing copied bullet commit sections. It is a conservative attribution inventory, not a count of jobs, first passes or quality. GPT contributions often lack co-author trailers and therefore cannot be compared to Claude by this count.

| Recorded signature | Non-squash commit objects |
|---|---:|
| Claude Opus 5.5 (1M context) | 324 |
| Claude Sonnet 5.5 | 42 |
| Claude | 13 |
| Claude Opus 5.5 | 7 |
| Claude Fable 5.1 | 3 |
| Claude Haiku 5.5 | 2 |

## Confirmed follow-up PRs

- [PR #1025: r86: History waits while Showdowns keep arriving and shows progress](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1025) — merged=True; base `gameplay/r86`; recorded merged time 2026-10-27T22:32:54Z.
- [PR #1026: Reads at scale: career summaries in Firebase plus a phone copy](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1026) — merged=True; base `gameplay/r86`; recorded merged time 2026-10-27T23:36:34Z.
- [PR #1030: Marquee Players: FIFA 17 launch database, top 300 (HO-037)](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1030) — merged=True; base `gameplay/r86`; recorded merged time 2026-10-28T18:54:06Z.
- [PR #824: Season Results and Final Winner: no old-design flash on open](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/824) — merged=True; base `gameplay/bug-list-1`; recorded merged time 2026-10-12T16:57:37Z.
- [PR #1035: r86: Special Player reveal before Career Start](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1035) — merged=True; base `gameplay/r86`; recorded merged time 2026-10-28T23:35:30Z.
- [PR #1091: Red team r87 fixes: connectivity and career pages](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1091) — merged=True; base `gameplay/r87`; recorded merged time 2026-10-31T02:10:36Z.
- [PR #1102: Roulette squads: fix Sol job 2 (SQ-2-01..03) and sync 3D scene benches (SQ-1-01)](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1102) — merged=True; base `gameplay/r87`; recorded merged time 2026-10-31T13:37:45Z.

## Pinned source refs

- `main` → `5b4337fdd64aaf1e2ed8de5abf6830021f29c82e`
- `factory/gameplay-v1` → `fe1fbfef3c8477692b52bb469754a9acff8e33a9`
- `factory/v1-wtt5ye` → `0ed7a5ee76a07324c12140a12cf95d9ce1fee22d`
- `gameplay/r87` → `73713d75b5ef9f5cee62a26038ec1468111c5e34`
- `audit/r87-rr-sp` → `0426a4c6d0c334d0d5773edd61cb78147da90c36`
- `audit-packets` → `d54db6f05f5a3f8643fff19727da8053ff070950`
- `leads/relay` → `d6dabc59cc5607dcdde6ec69551236f5c743b87a`

## Editorial category ratings out of 100

Editorial assessment of documented project work; not a measured model benchmark.

Category scores reflect the previously discussed judgments of observed work in assigned roles. Overall scores are rounded holistic judgments, not weighted sums or averages of the category scores. Missing categories are unknown, never zero. Models had different tasks, tools, reviewers and evidence coverage; scores do not establish general capability or controlled superiority.

70: useful with supervision; 80: strong documented work; 90: particularly strong contribution evidence. Five-point distinctions are judgment calls, not statistically established differences.

| Model | Analysis | Visual | Coding | Review | Data | Overall | Coverage |
|---|---:|---:|---:|---:|---:|---:|---|
| GPT-5.6 Sol | 85 | 55 | 70 | 85 | 80 | 75 | Larger historical cohort; unequal task mix |
| GPT-6 Sol | 80 | Unscored | 75 | 80 | Unscored | 80 | Limited; provisional |
| GPT-6.1 Sol / Sol 6.1 | 85 | Unscored | 80 | 90 | Unscored | 85 | Small implementation sample plus later accepted reviews |
| GPT-5.6 Terra | 85 | Unscored | Unscored | Unscored | 90 | 90 | One consequential investigation; narrow |
| Astra (version unspecified) | Unscored | Unscored | 80 | Unscored | Unscored | 80 | Small historical sample; provisional |
| Luna / GPT-6 Luna | Unscored | Unscored | Unscored | Unscored | Unscored | Unscored | Insufficient attributable completed-outcome evidence |
| Claude Opus 5.5 | 85 | 90 | 90 | 85 | Unscored | 90 | Broader visual and integration evidence |
| Claude Sonnet 5.5 | 80 | 85 | 85 | 85 | Unscored | 85 | Broader historical cohort plus gameplay examples |
| Claude Fable 5.1 | 85 | 90 | 85 | 85 | Unscored | 90 | Rescue, transition-repair and owner-approved visual delivery |
| Claude Haiku 5.5 | Unscored | Unscored | Unscored | Unscored | Unscored | Unscored | Two narrow signed contract follow-ups |
| Codex (model unspecified) | Unscored | Unscored | 80 | 80 | Unscored | 80 | Mixed implementation/review records; underlying model unknown |

No separate Medium, High, Extra high or Max scores: assignment and routing instructions are not sufficient outcome evidence for comparisons by runtime effort. Versionless Sol/Claude and unspecified GPT-6 records are not assigned additional scores.

- **GPT-5.6 Sol:** Strong structured review/data slice, but substantial early visual repair burden. The 75 overall balances these rather than averaging categories mechanically.
- **GPT-6 Sol:** Source audit and bounded logic fixes. Standalone reproductions support diagnosis; no broad visual or independently accepted-finding denominator.
- **GPT-6.1 Sol / Sol 6.1:** Accepted History-loading diagnosis and merged r87 squad fixes strengthen the review assessment beyond the old six-job cohort.
- **GPT-5.6 Terra:** Credited launch-database-era diagnosis prompted a product-data rebuild. The overall 90 concerns this role, not broad coding or visual competence.
- **Astra (version unspecified):** Nine historical first passes, only one scored job and a mixed-contributor handoff. Version and broader category evidence remain incomplete.
- **Luna / GPT-6 Luna:** Routing discussion and historical opinions do not justify a numerical project-effectiveness score.
- **Claude Opus 5.5:** Strong historical visual outcomes and substantial integration work, with documented corrective rounds. The old perfect cohort is not an all-project perfect record.
- **Claude Sonnet 5.5:** Consistent precise implementation and review, including later work that required correction. Task and reviewer differences remain relevant.
- **Claude Fable 5.1:** Three documented rescues plus signed transition fixes and the Roulette screen. Later extensions and unmeasured real-iPhone frame rate limit a perfect-score claim.
- **Claude Haiku 5.5:** Attribution is real, but the sample cannot support a broad numerical effectiveness score.
- **Codex (model unspecified):** Useful deliveries and reviews coexist with lead-repaired work. The score belongs to this recorded contributor group, not a specific GPT version.
