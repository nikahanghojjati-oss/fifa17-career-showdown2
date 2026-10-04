# Status · JOB-29 · G-13 part 2f: Season Results, Final Winner and Standings

State: READY
Step: 0 of 4
Updated: 2026-10-04 22:46 UTC
Chat: Sol Work mode
Code branch: gameplay/job-29-v10-results
Head commit: cf7a46e0c52c6a1fa4308f9000a5b171ef08b1c7
PR: none yet
CI run: not requested; blocked before implementation

## Notes
- Intake: read RULES.md, WORKER_HANDBOOK.md, JOB-29.md, G13_PART2_COMMON.md, own status and job 24 status; PR #349 supplies the loader API. JOB-29 explicitly authorizes starting from job 24 before it merges.
- DEFAULT: READY means eligible to start, equivalent to NOT STARTED; job 29 has no existing implementation commits on its code branch.
- Planned steps: 1 truth and failing contracts; 2 preserve controls and bind Season Results / Final Winner; 3 bind Standings and lazy assets; 4 local checks, exact-head CI, PR and Codex review.
- Source read: pinned Team V 5e05a1f7dd17ac4ecbba7bb12f0cb91ce8c41f41 PACKAGE, HANDOFF_TO_SOL, NAV_CONTRACT, three screen TRUTH and BUILD_RESULT files; inspected the foundation loader and existing season/final/history adapters.
- Product contradiction found before code changes: JOB-29 says "For ties, use league position, then league points (Nik's rule)" under Final Winner, and also "Never compute a different winner in the view." Existing final reconciliation returns draw for equal accumulated Showdown points, even when league positions differ. COMMON forbids scoring changes; handbook section 9.5 also requires final equal points = draw.
- No code, gameplay module, scoring, main, deployment or production data was changed. Only this job's status is saved.

## Self-check
- PASS: node tests/contracts/shared-final-reconciliation-contracts.cjs (exit 0). Last line: PASS r17 Final Reconciliation deterministic complete-showdown projection, exact local manager binding, winner authority and no-extra-season boundary
- Concrete fixture: the final contract's tieSetup has one accepted season; playerOne leaguePosition 2 and playerTwo leaguePosition 3, both leaguePoints 80 and both accumulated totals 0. Canonical season winner is playerOne; final reconciliation winner is draw.
- Existing assertion: assert.equal(tie.winner,"draw","Final overall authority reuses accumulated Showdown points; it must not invent a new cross-season tiebreaker.");
- PASS: node tests/contracts/shared-canonical-scoring-contracts.cjs (exit 0). Last line: PASS Shared Canonical Scoring deterministic core: r10 ACKNOWLEDGED commit is mandatory, canonical 5/3/1 scoring and both one-point bonus caps are recomputed from supported raw results, submitted totals are not trusted, all tied Showdown scores use league position then league points as tiebreakers, and local Save authority remains untouched.
- Pinned Final Winner TRUTH and BUILD_RESULT both say equal total Showdown points are a draw. Position/points are excluded from the Final Winner contract.
- New tests, full suites, CI, PR and Codex review not reached. No DONE claim.

## Blocked question
For the Team G lead: please resolve JOB-29's contradictory Final Winner tie instruction. Should position then league points apply only to the canonical per-season outcome, with Final Winner copying reconciliation.winner exactly (equal accumulated totals = draw)? If so, amend JOB-29 to say that explicitly. Applying a final position/points tiebreak would contradict reconciliation authority and the no-scoring-change guard.

## Model gaps
- No implementation yet. The final reconciliation deliberately does not expose final league-position/league-points tiebreak fields.

## Lead answer (2026-10-04 22:50 UTC)
Yes. League position then league points applies only to the canonical per-season outcome. Final Winner copies `reconciliation.winner` exactly; equal accumulated totals = draw. JOB-29 is amended. Resume from step 1.
