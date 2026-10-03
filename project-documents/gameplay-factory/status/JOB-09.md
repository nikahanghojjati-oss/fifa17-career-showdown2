# Status · JOB-09 · Closed-Showdown adapter into the career model

State: IN PROGRESS
Step: 6 of 7
Updated: 2026-10-03 15:33 UTC
Chat: Sol Work mode (job 9, 04fd13bb5a42)
Code branch: gameplay/job-09-closed-adapter
Head commit: 744e9a0db9550be8cf74632edcb0f988c2e08ada
PR: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/330 (open, ready for review)
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37133244137 (SUCCESS, exact head 744e9a0db9550be8cf74632edcb0f988c2e08ada)

## Notes
- Lead: JOB-03 (PR #316) and JOB-08 (PR #326, merge 843e64e) are merged; JOB-05 and JOB-07 too. Lead to create code branch gameplay/job-09-closed-adapter from gameplay/recovery-v1 at 843e64e before Nik starts the job. Lead reference run on 843e64e: new contract 22/22, contracts 104/104, ops 73/0, every rules-emulator step PASS including the new Closed-Showdown adapter journey (12 checks); only budget diagnostics are the two known career-index D13 denials. Jobs 11, 16 and 18 also append registry entries: whoever merges later re-appends last. Ready to start.

- Step 1: Dependencies JOB-03, JOB-08 and JOB-11 DONE and merged. Job branch fast-forwarded without merge/force to recovery-v1 372b3b75fd0cf36b88d8241674fd69d7c8196091, which includes JOB-11 merge 372b3b7 after JOB-08 843e64e. npm ci exit 0; Node v24.19.0; local contracts 104/104. Local ops exit 0 but no final census; exact-head baseline CI logs tests 73 / pass 73 / fail 0. Validate Gameplay Fast 37129924697 SUCCESS; every emulator step including Completed-only read matrix SUCCESS. Connector write access verified with fast-forward; no merge, deploy or main write.

- Step 2a checkpoint: Read DATA_CONTRACT_V1 sections 0/6/7/8 and career model, active adapter and completed reader. Required source lines verified: career verified 33 / uniqueEntries 50 / buildCareerModel 104 / interim option 105; active inspect 20 / career 130 / careerInput 146; reader state 42 / read 132 / not-closed 142 / abandoned 145 / API 178. JOB-11 changes active guard 48 only; no observed line drift. Adapter/loader absent; fixture smoke prints CLOSED 5 playerOne SHOWDOWN_COMPLETE. DEFAULT: split step 2 into saved parts to honor four-file read limit; step stays 1 until all required references are checked.

- Step 2b checkpoint: Checked persistent index client, active adapter contract and both unchanged fixture helpers. Index references match pairReadCareerIndexWith 64 / pairReadCareerIndex 66 / active replacement guard 126; reads head then sealed pages, returns pages before head in career order, rejects duplicate ids and never throws outward. Existing fixture helpers build verified projections and real Terminal Close intents; contract uses borrowed-projection freeze checks, immutable caller assertions and browser vm agreement. Still to read: emulator pairing/play/abandon patterns, ops registry lines, S2C-005R2 and lead handoff authority. No code changes; step 2 remains incomplete.

- Step 2: All read-first references checked. Journey lines 99/127/206 match; ops completedShowdownReadContract stays 72 and expectedSupplementalContracts moved 76 -> 77 because JOB-11 appended its entry. Read lead handoff sections 3/5 and S2C-005R2 sections 2/5. DEFAULT: ruling is absent on leads/relay (404); used the exact visual/cinematic-system-v10 archive path linked by the handoff, solely for the job-required authority. Counting, no backfill, account-scoped memory cache and no new read paths confirmed. Fixture smoke PASS CLOSED 5 playerOne SHOWDOWN_COMPLETE; both new modules remain absent. Step 2 complete.

- Step 3a checkpoint: Copied Appendix C contract (313 lines) and Appendix D emulator journey (246 lines) verbatim; node --check both PASS. Local contract fails exactly MODULE_NOT_FOUND: Cannot find module /workspace/scratch/04fd13bb5a42/job9/js/sharedClosedShowdownAdapter.js. Both text files saved through connector. Step 3 still incomplete: Appendix E registry/ops/workflow changes and tests-first exact-head CI evidence are next. Implementation files remain absent; no existing assertion changed.

- Step 3b checkpoint: Appendix E registry entry and ops const/list appended last after JOB-11, preserving every existing entry and assertion. Regex dots are escaped once in decoded patterns. Ops syntax PASS; focused control-plane test 30 pass / 0 fail. Saved both code files. Workflow addition follows in step 3c before reading tests-first CI.

- Step 3c checkpoint: Added Appendix E Closed-Showdown adapter journey as the final rules-emulator step after Completed-only read matrix; demo-cms-gameplay-fast-closed-adapter only. Both new tests node --check PASS; local contract fails exactly Cannot find module /workspace/scratch/04fd13bb5a42/job9/js/sharedClosedShowdownAdapter.js (MODULE_NOT_FOUND). Complete tests-first code saved on 88220a9293ca6f8ceab4b6c36d82bc47c4ba5eca. No implementation added. Step stays 2 until next-turn exact-head CI proves only the new contract and new journey fail, with all prior emulator steps green. No CI polling this turn.

- Step 3 CI read: Exact-head Validate Gameplay Fast run 37132170119 is PENDING; earlier head 94a569b is still running. Read once this turn; no polling or implementation changes. Resume by reading https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37132170119.

- Step 3 CI read: Run 37132170119 now IN PROGRESS on exact head 88220a9. Gameplay contracts completed with expected missing-adapter failure; emulator job is installing dependencies and has not reached the new journey. No polling; step 3 remains incomplete until emulator evidence arrives.

- Step 3: Tests-first CI proof complete on 88220a9293ca6f8ceab4b6c36d82bc47c4ba5eca / run 37132170119. Contract fails only the new contract (1/105) with missing js/sharedClosedShowdownAdapter.js. Every existing emulator step SUCCESS, including Two-manager journey, Career index Phase A 56 / Phase B 58 and Completed-only read 56. New Closed-Showdown adapter journey fails exactly Cannot find module '../../js/sparkClosedShowdownCareerLoader.js' (MODULE_NOT_FOUND). Red CI is intentional; step 4 may start.

- Step 4: Copied Appendix A pure adapter verbatim; node --check PASS. Local contract passes C1-C17 and fails exactly at L1 loader surface and source: Cannot find module /workspace/scratch/04fd13bb5a42/job9/js/sparkClosedShowdownCareerLoader.js. Saved adapter on bf69b3598ab3ea42c1b6ecee7768d8481c2b8dad. Loader remains absent; no existing source or assertion changed. No CI polling after this push.

- Step 5: Copied Appendix B loader verbatim; node --check PASS. PASS closed-Showdown adapter contracts (22/22 cases). npm run test:ops reports tests 73 / pass 73 / fail 0. npm run test:contracts returned exit 0 but its log ended at Final Reconciliation without a final census, so do not claim 105/105 locally; exact-head CI must supply that evidence (handbook section 7 fallback). Loader saved on 7b735a7f5f6ed2b0c91c86817d7b096635ec2bf9; all seven authorized code files now present. No CI polling after push; step 6 reads exact-head CI, budget gate and file compare.

- Step 6 CI checkpoint: Exact-head run 37132554539 / 7b735a7 has Gameplay contracts SUCCESS: closed-Showdown adapter 22/22, full census 105/105, operations tests 73 / pass 73 / fail 0. Emulator job still running (lifecycle step); no polling. Step stays 5 until emulator/budget/file-scope proof complete.

- Step 6 proof checkpoint: Validate Gameplay Fast 37132554539 SUCCESS on 7b735a7; both jobs and all steps green. Exact emulator final lines:
- PASS two-manager journey Sections A-G (3 seasons main): main journey, stranger denial, privacy, idempotent retry, simultaneous taps, second Showdown, completed-only reads of closed Showdowns, and persistent-provider abandon all proved.
- PASS career index composed-Rules emulator (Phase A shipped): 56 numbered checks (A access, B creation, C redemption, D append-only, E idempotency, F races, H agreement, G paging, P provider).
- PASS career index composed-Rules emulator (Phase B enforced): 58 numbered checks (A access, B creation, C redemption, D append-only, E idempotency, F races, H agreement, G paging, P provider).
- PASS completed-only read emulator: 56 numbered checks (I0, A completed reads, B denials, C closed writes, D abandoned, E forged witnesses, F active regressions, P session-free reader).
- PASS closed-Showdown adapter emulator: 12 numbered checks (I0, A Terminal Close, B abandon rebuild, C three-Showdown career for both managers with cache, D stranger and unknown live state).
- Step 6 budget PASS: exactly two diagnostic lines, each immediately followed by career-index D13 stranger cannot create an index naming a rivalry they are not in (Phase A / Phase B); no diagnostic in the new adapter journey. Compare lists exactly seven authorized files.
- Step 6 integration drift: JOB-18 PR #329 merged as f7d18a1 while tests ran; its pair-code-entry-race registry/ops entry must precede JOB-09. Current job head already includes lead's fresh-start fix merge e44b695 (lead advanced job branch before step 3a save), but is four commits behind current recovery. DEFAULT: import approved JOB-18 baseline changes with ordinary fast-forward commits, preserving job history (no merge or force), then append JOB-09 last and repeat exact-head proof. Step 6 remains incomplete; next saved parts update registry/ops plus the two JOB-18 baseline files. No PR opened yet.

- Step 6 refresh blocked: Live refs remain divergent (JOB-09 7b735a7, recovery f7d18a1, common ancestor e44b695). Correction to the prior DEFAULT: copying JOB-18 baseline files in single-parent commits would add its provider/test to JOB-09's three-dot PR diff, violating the required seven-file scope; a rebase needs forbidden force-push, and integrating both histories needs a merge reserved to the lead. No code changed; current seven-file implementation and green exact-head proof preserved. Lead must refresh the existing job branch before worker re-appends its entry last and repeats CI.

- Lead answer (2026-10-03 15:35 UTC): done. Merged gameplay/recovery-v1 at f7d18a1 (job 18) into gameplay/job-09-closed-adapter with an ordinary merge commit, no force-push: new head 744e9a0db9550be8cf74632edcb0f988c2e08ada. Registry and ops list keep pairCodeEntryRaceContract before closedShowdownAdapterContract (job 9 last). Lead local check on 744e9a0: pair-code race PASS, closed adapter 22/22 PASS, test:ops 73/73. Diff against recovery is still exactly your seven files. Pushing to gameplay/** starts Validate Gameplay Fast on 744e9a0 by itself; continue with step 6 by reading that exact-head run once, then step 7 (PR into gameplay/recovery-v1).

- Step 6 resumed: Lead completed integration refresh and resolved registry order at 744e9a0. Exact-head run 37133244137 is IN PROGRESS; read once, no polling. Prior green proof at 7b735a7 is historical; finish requires fresh exact-head emulator/budget/file-scope evidence.

- Step 6: Full proof complete on refreshed 744e9a0db9550be8cf74632edcb0f988c2e08ada / Validate Gameplay Fast 37133244137 SUCCESS. Contracts 106/106 (JOB-18 adds the additional baseline contract), closed adapter 22/22, operations 73/0. All emulator steps PASS; final lines:
- PASS two-manager journey Sections A-G (3 seasons main): main journey, stranger denial, privacy, idempotent retry, simultaneous taps, second Showdown, completed-only reads of closed Showdowns, and persistent-provider abandon all proved.
- PASS career index composed-Rules emulator (Phase A shipped): 56 numbered checks (A access, B creation, C redemption, D append-only, E idempotency, F races, H agreement, G paging, P provider).
- PASS career index composed-Rules emulator (Phase B enforced): 58 numbered checks (A access, B creation, C redemption, D append-only, E idempotency, F races, H agreement, G paging, P provider).
- PASS completed-only read emulator: 56 numbered checks (I0, A completed reads, B denials, C closed writes, D abandoned, E forged witnesses, F active regressions, P session-free reader).
- PASS closed-Showdown adapter emulator: 12 numbered checks (I0, A Terminal Close, B abandon rebuild, C three-Showdown career for both managers with cache, D stranger and unknown live state).
- Step 6 qualified budget gate PASS on the refreshed emulator log: exactly two maximum-of-1000 diagnostic lines, followed immediately by denied career-index D13 in Phase A and Phase B; none in the new adapter journey. Compare with recovery f7d18a1 is ahead, behind 0, exactly seven authorized files. Current-head registry has JOB-18 then JOB-09 last; ops ordered likewise; regex dots correct; CI new step last in rules-emulator; persistent pair contractVersion still 4. No worker merge, force-push or deploy.

- Step 7 checkpoint: PR #330 created open/non-draft into gameplay/recovery-v1, exact head 744e9a0, seven files. Body contains both required tables, seven-file list, exact-head green CI URL and required no-change line. PR creation starts the additional POS20 validation checks; do not poll this turn. Fast CI and job proofs are complete; keep IN PROGRESS / Step 6 until next-turn PR checks are read, then finish DONE if green. No Codex review required.

- Step 7 PR check read: PR #330 remains open/non-draft, mergeable, seven files, head 744e9a0, base gameplay/recovery-v1. Validate POS20 37133544901 IN PROGRESS on this head; no polling. Fast CI remains green. Finish when these PR checks pass.

## Self-check
- PASS Tests first: run 37132170119 on 88220a9 fails only the new contract (missing adapter) and new emulator journey (missing loader); every existing emulator step green. Adapter-only local test passed C1-C17 and failed L1, as required.
- PASS Focused/suites: adapter+loader 22/22 locally and on CI; refreshed exact-head full contracts 106/106; operations 73 pass / 0 fail. Local full-suite log lacked final census, so CI provides that count under handbook section 7.
- PASS Fast CI: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37133244137 SUCCESS on 744e9a0db9550be8cf74632edcb0f988c2e08ada. Both jobs and every step green; new journey 12 checks, completed-only 56, index Phase A 56 / Phase B 58, two-manager journey PASS.
- PASS Both-manager proofs: new journey A2/C4/C5 verifies Terminal Close witness totals and identical fresh-client models; B2 removes abandoned seasons/records; C2/C3 cache get counts 17 then 2. Live R3 uses JOB-05; unknown live state is partial, stranger gets nothing.
- PASS Qualified budget gate: exactly two diagnostic lines, immediately followed by denied career-index D13 in Phase A/B; no new-journey diagnostic; all expected-success cases PASS.
- PASS Scope: compare against recovery f7d18a1 and PR #330 list exactly seven authorized files. No Rules, shell, screen, existing provider/contract/helper, generated Rules or debug log changed. Persistent pair contractVersion stays 4; modules remain unreferenced by the app.
- PASS Registry: JOB-18 entry retained before JOB-09; JOB-09 registry entry and ops array item last; decoded patterns escape dots once; new CI step last within rules-emulator.
- PASS Safety: no worker merge, force-push, deploy or main write; no settings, billing, auth, scoring or private-read changes. Integration refresh was performed by the lead.
- PASS PR: #330 open/non-draft into gameplay/recovery-v1 with both required mapping/proof tables, seven files, green exact-head CI URL and required sentence. Additional PR validation is running: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37133544901 (Validate POS20, exact head 744e9a0); DONE awaits its next-turn result.


## Blocked question
