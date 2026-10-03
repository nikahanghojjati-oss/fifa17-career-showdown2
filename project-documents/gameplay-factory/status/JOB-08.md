# Status · JOB-08 · Completed-only read grant + session-free reader

State: WAITING ON CODEX
Step: 7 of 8
Updated: 2026-10-03 13:11 UTC
Chat: Sol Work mode
Code branch: gameplay/job-08-completed-read
Head commit: e09a9f24f00f1a680b66e0dd942bcbb8a7df9176
PR: #326
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37125026102

## Notes
- Lead: JOB-07 merged (PR #325, merge 889810f). Lead to create code branch gameplay/job-08-completed-read from gameplay/recovery-v1 at 889810f before Nik starts the job. Lead reference run on 889810f: contracts 103/103, ops 73/0, every rules-emulator step PASS including Completed-only read 56 checks; only budget diagnostics are the two known career-index D13 denials. Ready to start.

- Step 1: JOB-07 is DONE and merged; job branch and recovery head both 889810f9e77efc09c79318cebe70d3d7f30676c9. npm ci PASS; local contracts 102/102; operations 73 pass / 0 fail. Exact baseline Validate Gameplay Fast 37122294996 SUCCESS; Career index matrix SUCCESS. All writes use the GitHub connector as instructed.

- Step 2: Read all required sources, S2C-005R2 D2 ruling, lead handoff D2 and DATA_CONTRACT sections 6/8. Read-first line observations match current 889810f (no drift). Composed baseline builds PASS: role get seam count 1, setup/results/commit seams 3; both KNOWN GAP 1 assertions present. Composed artifact 129241 bytes; not committed.

- Step 2: Step 3 tests-first files saved on 0108614dd8c3f9d949b20fbac6722ccfa7401a4f. Appendix C/D/E applied verbatim; node --check both new tests PASS. Local contract fails MODULE_NOT_FOUND for js/sparkCompletedShowdownReader.js as required. Waiting for exact-head red CI evidence before completing step 3.

- Step 3: Tests-first exact-head CI https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37124538984 on 0108614dd8c3f9d949b20fbac6722ccfa7401a4f: contract fails only missing reader (1/103); every existing emulator step SUCCESS; Completed-only read matrix fails at I0, 0 !== 1 (no grant). No existing assertion changed.

- Step 3: Step 4 client saved verbatim from Appendix B on e827ace71bae43dc5f3cd41f5dfa9ddb20ed9a81. node --check PASS; local contract passes K1-K6 and fails K7: data.connectionState == 'closed', as required before Rules grant. Waiting for its exact-head emulator I0 failure before completing step 4.

- Step 4: Appendix B reader saved on e827ace71bae43dc5f3cd41f5dfa9ddb20ed9a81. node --check PASS; local and CI contract pass K1-K6 and fail K7 at data.connectionState == 'closed'. CI 37124801380: every prior emulator step PASS, Completed-only read matrix still fails I0 0 !== 1, as expected before Rules.

- Step 5: Applied Appendix A/F verbatim together in one code commit e09a9f24f00f1a680b66e0dd942bcbb8a7df9176. Both builds PASS, composed artifact 131462 bytes; season helper count 4, Showdown helper count 3. New local contract PASS; journey and injector node --check PASS. Exact-head CI pending.

- Step 6: Full local and exact-head CI proof PASS; 103/103 contracts, operations 73/0, every emulator step green, completed-read 56 checks, journey updated, career-index Phase A 56 / Phase B 58. Qualified budget gate PASS (next ok is denied D14, stderr immediately follows denied D13; details in Self-check). Diff exactly nine allowed files.

- Step 7: Opened PR #326 into gameplay/recovery-v1 on exact head e09a9f24f00f1a680b66e0dd942bcbb8a7df9176. Body contains both requirement/read-surface tables, all nine files, exact-head green CI link and required deploy-order statement. No merge or deploy.

- Step 7: Step 8 started: Posted exactly @codex review on PR #326 after full green exact-head CI. Waiting for Codex and any one permitted fix round; step remains 7 until review is handled.

## Self-check
- PASS: Tests-first CI 37124538984 at 0108614dd8c3f9d949b20fbac6722ccfa7401a4f: only new contract failed missing module (1/103); all prior emulator steps succeeded; completed matrix I0 failed 0 !== 1. Client-only CI 37124801380 at e827ace71bae43dc5f3cd41f5dfa9ddb20ed9a81: K1-K6 passed, K7 failed at data.connectionState == 'closed'; emulator I0 failed as expected.
- PASS: Local completed-only contract; full contracts 103/103; operations 73 pass / 0 fail. node --check reader, new tests, journey and injector PASS.
- PASS: Validate Gameplay Fast 37125026102 SUCCESS on exact code head e09a9f24f00f1a680b66e0dd942bcbb8a7df9176; both jobs and every step succeeded.
- PASS: Exact CI output: PASS persistent pair Rules emulator: Daniel=Player One and Nik=Player Two are canonical, mismatched roles are rejected, private account get, no list/delete, registered-device writes, active-career replacement denial, authorized current-pair abandonment with wrong-account/device/data-mutation denial, provider-closed fresh replacement including safe Daniel/Nik role reuse by the same Google account, rivalry membership and expired-pending replacement safety, mandatory atomic creator and post-redeem recovery witnesses, witness-less create/redeem denial, stale-creator capability rollback, and stale-tab double-active rollback are enforced.
- PASS: Exact CI output: PASS two-manager journey Sections A-G (3 seasons main): main journey, stranger denial, privacy, idempotent retry, simultaneous taps, second Showdown, completed-only reads of closed Showdowns, and persistent-provider abandon all proved.
- PASS: Exact CI output: PASS career index composed-Rules emulator (Phase A shipped): 56 numbered checks (A access, B creation, C redemption, D append-only, E idempotency, F races, H agreement, G paging, P provider).
- PASS: Exact CI output: PASS career index composed-Rules emulator (Phase B enforced): 58 numbered checks (A access, B creation, C redemption, D append-only, E idempotency, F races, H agreement, G paging, P provider).
- PASS: Exact CI output: PASS completed-only read emulator: 56 numbered checks (I0, A completed reads, B denials, C closed writes, D abandoned, E forged witnesses, F active regressions, P session-free reader).
- PASS: Journey proves both managers read closed R1 setup/season1; R1/R2 completed; R3 abandoned; index [R2,R3]; identical projections/finals from fresh clients. Only chartered KNOWN GAP 1 assertions changed; label gone.
- PASS: Qualified expression-budget gate mechanically checked complete emulator log: exactly 2 diagnostic lines; NEXT ok lines are denied D14 in both Phase A and B, not an expected-success case. Logs interleave stderr after D13's ok line (13:08:31.1153954/13:08:36.2702238), then diagnostic (13:08:31.1157004/13:08:36.2706324), then D14 denial (13:08:31.1326461/13:08:36.2820990). Diagnostic remains within adjacent denied D13/D14 cases; all success cases pass; none in completed-read or journey sections.
- PASS: Four budget-edge functions and all write rules unchanged; firestore.spark.rules, six other fragments and both build scripts byte-identical. Grant added to exactly four get seams; no transfer, draft, session, invite, careerStart or leagueProjection grant.
- PASS: Diff against origin/gameplay/recovery-v1: exactly nine permitted code files, 610 insertions / 5 deletions. Local staged content equals remote e09a9f2. Generated Rules rebuilt to 131462 bytes, not committed; no debug log; persistent pair contractVersion 4; index.html/service-worker/deploy workflows unchanged.
- PASS: No deployment, merge, force push or main mutation. No billing words in fragment.
- PENDING: PR and Codex review (steps 7-8).

## Blocked question
