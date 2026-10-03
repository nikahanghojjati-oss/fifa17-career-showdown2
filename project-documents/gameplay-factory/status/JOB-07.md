# Status · JOB-07 · Career index Rules + client + emulator proofs

State: WAITING ON CODEX
Step: 8 of 9
Updated: 2026-10-03 11:58 UTC
Chat: Sol Work mode
Code branch: gameplay/job-07-career-index
Head commit: 65a53ff692e789ffa1d3025b6e7efa1adc56bf00
PR: #325 https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/325
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37080155517

## Notes
- Lead: JOB-02 merged (4491e36). Code branch gameplay/job-07-career-index created from gameplay/recovery-v1. Ready to start.

- Step 1: Dependencies JOB-01 and JOB-02 are DONE and merged. Baseline recovery-v1 a11af482: npm ci succeeded; contracts 101/101; operations 73/73, fail 0; unchanged persistent-pair contract PASS. Exact baseline CI green: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37078432100. Terminal clone works; all writes use the connector per job.

- Step 2: Read job authority, data contract and all required sources. Persistent-pair fragment lines/markers and client seams match. Drift: journey witness begins 85 (was 84); now2/now3 use Date.now from JOB-02 fix. Registry/ops now include G-4/G-5/G-6 and season-race supplements; append career-index last, preserving those entries. Baseline contracts count 101 (rather than old expected 97). No budget-edge function changes planned.

- Step 3: Added both Appendix C/D tests, registry/ops registration and last CI step. node --check passed both. Local new contract failed undefined !== 500 as required. Exact-head tests-first CI 37079063991 is red: contract 1/102 fails for missing capacity export, and Career index matrix fails I0 (missing composed index match); earlier emulator groups passed. Baseline CI logs confirm 101/101 and ops 73 pass, 0 fail.

- Step 4: Applied Appendix A and injector Appendix F unchanged. Both builds PASS; exact index match count 1, composed size 128924 bytes (uncommitted). CI 37079315422 passed Setup, Transfer, Lifecycle and Terminal Close; pair fixture creation is denied as expected without its index write. Important CI sequencing observation: failed pair step skips Journey and Career index matrix, so the job's expected intermediate A-H/P1 output cannot appear until fixtures/client are implemented. Preserved the workflow as instructed; full matrix will be proved in step 7.

- Step 5: Applied Appendix E and G fixture updates; kept Date.now() in G hunks to preserve JOB-02's approved clock fix. Both node --check PASS. Exact-head CI 37079528608: Persistent Nik and Daniel pair matrix SUCCESS; Two-manager journey fails on missing createDurableCreationWitness export as expected before step 6, so Career matrix is skipped. All previous assertions preserved except the chartered KNOWN GAP 2 replacement.

- Step 6: Applied Appendix B unchanged: pure append/rollover plan, exact read-only memory index, reads-before-writes witnesses and exports, contractVersion 4. node --check client PASS; career-index contract PASS locally; unchanged persistent-pair contract PASS locally. Client saved on 524020edf2bce953127093ff8dc4a61929dadd90; full CI pending.

- Step 7 first full proof: CI 37079798528 at 524020e passed 102/102 contracts, 73 operations (0 fail), all emulator steps and 58 index checks. Log budget gate FAILED: D13 stranger index forgery was denied, but its missing pair document caused eager .data.data evaluation and a maximum-of-1000 diagnostic. Scope-local correction: cmsCareerIndexAppendEligible now gets the pair resource, rejects null/non-map before accessing pair.data.data; no rivalry or budget-edge function change. Both standalone local contracts still PASS. Full proof re-run pending on 65a53ff692e789ffa1d3025b6e7efa1adc56bf00.

- Step 7 BLOCKED after one correction: exact-head CI 37080155517 at 65a53ff692e789ffa1d3025b6e7efa1adc56bf00 is SUCCESS, with 102/102 contracts, 73 operations (0 fail) and all emulator groups including 58 career-index checks. However, the literal no-expression-limit log gate still FAILS at D13, the expected denial of a stranger creating an index for X2. The added null/map guard did not remove the diagnostic, so the eager-access hypothesis alone was insufficient. This repeats the same Step 7 budget-gate failure from 37079798528. Per handbook/Job §8, stopped here. Step stays 6 of 9 (last completed step). No PR or Codex request opened because step 7 is not complete.

## Self-check
- PASS: Tests-first CI 37079063991 at a16875b failed I0 (missing index match) and the contract failed undefined !== 500; both new files passed node --check.
- PASS: New index contract and unchanged persistent-pair contract PASS locally. Local npm contract command exited 0; its captured output did not print the census summary, so 102/102 count is asserted from exact-head CI, not inferred from the local output. Local npm operations exited 0, pass 73/fail 0, last line duration_ms 643.322557.
- PASS: Validate Gameplay Fast SUCCESS on exact head 65a53ff692e789ffa1d3025b6e7efa1adc56bf00, run 37080155517, both jobs and every emulator step SUCCESS.
- PASS: PASS career index composed-Rules emulator: 58 numbered checks (A access, B creation, C redemption, D append-only, E idempotency, F races, H agreement, G paging, P provider).
- PASS: PASS persistent pair Rules emulator: canonical roles, private exact reads, list/delete denial, registered-device writes, replacement/abandonment protections and atomic pairing witnesses enforced (full line in run 37080155517).
- PASS: PASS two-manager journey Sections A-G (3 seasons main): main journey, stranger denial, privacy, idempotent retry, simultaneous taps, second Showdown known gaps, and persistent-provider abandon all proved. The test now asserts [R2], then [R2,R3], excludes R1, and removes only the chartered KNOWN GAP 2 assertion.
- PASS: Qualified expression-budget gate per Lead answer: mechanically inspected every diagnostic in run 37080155517. One log line contains two phrase occurrences; its next numbered ok line is case D13, which expects PERMISSION_DENIED (stranger cannot create an index naming a rivalry they are not in). No diagnostic is associated with an expected-success case; every creation/redemption/rollover/append/journey success case passes. No assertion changed.
- PASS: Four budget-edge functions unchanged; firestore.spark.rules, sparkPrivatePairing.js, existing persistent-pair contract and both build scripts byte-identical to baseline.
- PASS: GitHub compare with a11af482 is ahead 5/behind 0 and exactly the ten allowed code files, 570 additions/17 deletions. No generated Rules or debug log committed; local composed artifact rebuilt to 129019 bytes; contractVersion stays 4.
- PASS: Nothing deployed, merged, force-pushed or written to main. No billing words added to the fragment.
- PASS: PR #325 opened into gameplay/recovery-v1, exact head 65a53ff692e789ffa1d3025b6e7efa1adc56bf00, with requirement table, allowed file list, exact CI link and required deploy-order line. Codex step 9 pending.

## Blocked question
Team G lead: Step 7 passed every executable suite, but D13's denied stranger index creation still emits the Rules expression-limit diagnostic after a null/map guard in cmsCareerIndexAppendEligible. Please provide the intended Rules correction within the allowed fragment scope, or explicitly qualify the budget gate to apply to legitimate operations if that was the intended criterion. The worker has not weakened a test or marked the unmet gate PASS.

### Failing verification assertion
```js
assert.equal(emulatorJobLog.includes('maximum of 1000 expressions'), false);
// actual true, expected false, in both runs 37079798528 and 37080155517
```

### Relevant emulator output
```text
2026-10-03T00:03:05.4125337Z ok 35 D12 Nik cannot write Daniel index
2026-10-03T00:03:05.4126485Z false for 'create' @ L2614, false for 'create' @ L2758, false for 'update' @ L2616, false for 'update' @ L2758
2026-10-03T00:03:05.4317506Z [2026-10-03T00:03:05.431Z]  @firebase/firestore: Firestore (12.17.0): GrpcConnection RPC 'Write' stream 0x13b959a0 error. Code: 7 Message: 7 PERMISSION_DENIED: 
2026-10-03T00:03:05.4322078Z evaluation error at L2614:24 for 'create' @ L2614, false for 'create' @ L2758, Unable to evaluate the expression as the maximum of 1000 expressions to evaluate has been reached. for 'update' @ L2616, Unable to evaluate the expression as the maximum of 1000 expressions to evaluate has been reached. for 'update' @ L2758, false for 'create' @ L2614, false for 'create' @ L2758
2026-10-03T00:03:05.4325251Z ok 36 D13 stranger cannot create an index naming a rivalry they are not in
2026-10-03T00:03:05.4506691Z ok 37 D14 head write with a skipped revision is denied
2026-10-03T00:03:05.5036960Z ok 38 E1 pair-link reconfirm of the same rivalry without an index write succeeds
```

### Last 30 CI log lines
```text
2026-10-03T00:03:06.5259104Z ok 55 P3 both managers read the same ordered ids
2026-10-03T00:03:06.5304420Z ok 56 P4 reading another account's index is unavailable, never empty
2026-10-03T00:03:06.6853544Z ok 57 P5 second Showdown: both indexes are [P1, P2]; the pair link moved on, history stayed
2026-10-03T00:03:06.7384055Z ok 58 P6 a missing sealed page makes the index unavailable, never shorter
2026-10-03T00:03:06.7396865Z PASS career index composed-Rules emulator: 58 numbered checks (A access, B creation, C redemption, D append-only, E idempotency, F races, H agreement, G paging, P provider).
2026-10-03T00:03:06.7757299Z [32m[1m✔ [22m[39m Script exited successfully (code 0)
2026-10-03T00:03:07.2770835Z [36m[1mi  emulators:[22m[39m Shutting down emulators.
2026-10-03T00:03:07.2774279Z [36m[1mi  firestore:[22m[39m Stopping Firestore Emulator
2026-10-03T00:03:07.6189103Z [36m[1mi  hub:[22m[39m Stopping emulator hub
2026-10-03T00:03:07.6195183Z [36m[1mi  logging:[22m[39m Stopping Logging Emulator
2026-10-03T00:03:07.6710620Z Post job cleanup.
2026-10-03T00:03:07.8107330Z Post job cleanup.
2026-10-03T00:03:07.9471286Z (node:3302) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
2026-10-03T00:03:07.9473106Z (Use `node --trace-deprecation ...` to show where the warning was created)
2026-10-03T00:03:07.9476175Z Cache hit occurred on the primary key node-cache-Linux-x64-npm-40541ada0448445b70f884ac7cd54804d21da5561a199b02d3e90981a4d06746, not saving cache.
2026-10-03T00:03:07.9634057Z Post job cleanup.
2026-10-03T00:03:08.0490890Z [command]/usr/bin/git version
2026-10-03T00:03:08.0534358Z git version 2.55.0
2026-10-03T00:03:08.0574181Z Temporarily overriding HOME='/home/runner/work/_temp/9faf5e0e-7d38-4bd0-a439-c2bcc3b18935' before making global git config changes
2026-10-03T00:03:08.0576054Z Adding repository directory to the temporary git global config as a safe directory
2026-10-03T00:03:08.0585023Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/fifa17-career-showdown2/fifa17-career-showdown2
2026-10-03T00:03:08.0630602Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
2026-10-03T00:03:08.0668081Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
2026-10-03T00:03:08.0921585Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
2026-10-03T00:03:08.0951367Z http.https://github.com/.extraheader
2026-10-03T00:03:08.0962724Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
2026-10-03T00:03:08.0999132Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
2026-10-03T00:03:08.1283604Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
2026-10-03T00:03:08.1322964Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
2026-10-03T00:03:08.1709121Z Cleaning up orphan processes
```

### Lead answer (2026-10-02 8:25 PM Boston time)
Decision: the budget gate is qualified, not the Rules. No Rules change is needed for D13.

Why: Firestore's 1000-expression limit is shared by every rule considered for one request. On D13 the create rule is already false (evaluation error at the membership check), and the leftover update candidates then hit the limit. Hitting the limit can only deny, never allow, so a denied-expected request that ends at the limit is still correctly denied. The real risk is a LEGITIMATE operation reaching the limit, and your runs show none does.

New gate wording for step 7 (replaces "no 'maximum of 1000 expressions' anywhere in the emulator log"):
- Every emulator case that expects success passes (creation, redemption, rollover, append, journey). PASS already.
- The phrase "maximum of 1000 expressions" may appear only on the log lines of cases that expect PERMISSION_DENIED. Check it mechanically: for each occurrence, the next `ok N <case>` line must be a denial case (today only D13). Record the case name(s) in the self-check.
- If the phrase ever appears next to a case that expects success, that is a FAIL and BLOCKED again.

Do not edit any test assertion to hide the phrase; only change the self-check line to this qualified gate with the evidence. Then continue with step 8 (open the PR into gameplay/recovery-v1) and step 9 (Codex review).

- Step 7 resumed: Lead qualified the budget gate and set IN PROGRESS. Re-read the exact live code head (65a53ff692e789ffa1d3025b6e7efa1adc56bf00), verified exact-head CI SUCCESS, confirmed the saved client/tests exist, and mechanically associated all limit diagnostics with denied case D13 only. Step 7 now PASS with the original test assertions unchanged. Proceeding to PR and Codex steps.

- Step 8: Opened PR #325 into gameplay/recovery-v1 with the R1-R18 proof table, all ten changed files, exact-head CI URL and deploy-order statement. No merge or deployment.

- Step 9 started: Posted exactly @codex review on PR #325 after verifying exact-head CI green. State WAITING ON CODEX; Step stays 8 until review handling is complete. Request time 2026-10-03T11:58:02.676Z.
