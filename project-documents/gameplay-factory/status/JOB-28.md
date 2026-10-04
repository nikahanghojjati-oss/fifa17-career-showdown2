# Status · JOB-28 · G-13 part 2e: Rivalry Statistics and Legacy (History)

State: BLOCKED
Step: 4 of 5
Updated: 2026-10-04 22:40 UTC
Chat: Sol Work mode
Code branch: gameplay/job-28-v10-history
Head commit: 022e11e0021ed8829a03229084a0b6d040954fcf
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/352
CI run: none returned for exact head (workflow_runs: []; statuses: [])

## Notes
- Step 1: Read current RULES/handbook/COMMON, pinned 5e05a1f truth/build notes, NAV/data contract, job 24 PR #349 and loader fixes. Job explicitly permits starting from its unmerged code branch.
- Step 2: Saved failing numbered contracts first; registered in supplemental registry and operations expectedSupplementalContracts.
- Step 3: Pure mappings: published data only; Daniel left; completed History only; missing values unavailable; no backfill or private inputs.
- Step 4a: Copied only runtime text and referenced existing WebP Git objects from pinned source; no binary generated/uploaded; text precached, images use foundation runtime cache.
- Step 4: Registered on existing statistics and legacy routes; read-only active/closed adapters; host redraw invalidation, original-markup restoration, stage/listener cleanup; removed remaining Statistics containment.
- Step 5 (local part complete): 118/118 contracts and operations 73/73 pass; unchanged startup and pinned-source audit verified; PR #352 opened with Before/After/How, all Team V edits and model gaps.
- DEFAULT: Stage actually reads dataset.src1x/src2x, so pinned data-src1x/data-src2x are preserved; semantic rivalryStatistics uses existing app statistics id.
- Required remote verification missing: no exact-head workflow runs or statuses were returned. No polling. Terminal git write dry-run fails because credentials are unavailable; connector writes succeeded at every step.
- Codex review not requested because COMMON/handbook requires green exact-head CI first. No merge/deploy/main/Rules/scoring/provider setting change.
- PR currently mergeable:false. It intentionally starts from job 24 as ordered; lead must integrate foundation and reconcile recovery before merge.

## Self-check
- npm run test:contracts: exit 0. Last line: PASS POS10 selected deterministic census (118/118 current blocking contracts: frozen POS10 floor + POS20 supplements).
- npm run test:ops: exit 0. Last summary: tests 73; pass 73; fail 0.
- New contract: v10-rivalry-legacy contracts passed (12 checks), including both real renderers in Node VM plus registration/remount/unmount.
- Career Screens V10: 10/10; Career Screen Seam: 17/17; no existing cases skipped/deleted.
- Release contract: PASS Dynamic static release contracts v1.9.1/1.9.1-r53; startup 162809/37495.
- index.html and js/screens.js byte-identical to job 24 base; RUNTIME_REVISION unchanged.
- Rivalry CSS and both plate maps byte-identical to 5e05a1f; only referenced runtime assets copied.
- git diff --check: pass.
- Exact-head GitHub evidence: commit and PR head confirmed 022e11e0021ed8829a03229084a0b6d040954fcf; workflow_runs=[]; statuses=[]. Required remote checks cannot be claimed green.

## Model gaps
- Career/active models lack transfer summaries: Transfer Signings displays Unavailable, never zero.
- No completion date in data contract; no fabricated archive dates.
- Partial coverage reports unreadable Showdowns while History cards remain completed-only per job 28.

## Blocked question
- Team G lead: restore or trigger Validate Gameplay Fast (all four jobs, including the two-manager browser journey) and Validate POS20 on exact PR #352 head 022e11e0021ed8829a03229084a0b6d040954fcf. The connector returned no runs/statuses and terminal write access is unavailable. Then request the mandated Codex review, handle findings, complete phone/desktop intake and finalize DONE. Foundation PR #349 integration/recovery reconciliation also remains lead-owned; current PR mergeable:false.
