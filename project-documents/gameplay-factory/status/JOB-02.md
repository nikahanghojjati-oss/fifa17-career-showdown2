# Status · JOB-02 · Two-manager journey on the emulator (provider level)

State: BLOCKED
Step: 5 of 8
Updated: 2026-10-02 10:22 UTC
Chat: GPT-5.6 Sol normal chat
Code branch: gameplay/job-02-two-manager-journey
Head commit: b32d28e2dadeac415b7c892e4d67bd3900672b44
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/36994806517

## Notes
- Step 1: Job 1 is DONE and merged into gameplay/recovery-v1 at fb28e70. Baseline is Job 1 exact-head green run 36986447232: Gameplay contracts SUCCESS and Composed Rules on the emulator SUCCESS. Per the job's lane override, no local install/emulator run was attempted.


- Step 2: Created the two-manager journey skeleton and Section A. Exact-head CI run 36991751197 passed Gameplay contracts and the full Composed Rules emulator job, including the new Two-manager journey step through real Terminal Close.


- Step 3: Added stranger denial at setup, after season 1 commit, and after Terminal Close, plus seasonCommits list denial for Daniel, Nik and the stranger. Exact-head CI journey step passed.

- Step 4: Privacy checks now cover both directions for unfinished transfer inputs, both directions before all season results are published, and cross-role reads after COMPLETED / RESULTS_READY. Exact-head CI 36992525873 passed both jobs.

- Step 5: Added season-1 commit idempotent replay proof, exact stored-commit equality, one-row history proof, and season-2 simultaneous publishResult taps with one first writer, one stale retry, RESULTS_READY convergence, unique roles and unique operation IDs. Exact-head CI 36992910043 passed both jobs.

- Step 6 BLOCKED: Sections F/G reached Showdown 2 transfer COMPLETED, but Daniel's first season result publish returned {ok:false, code:"permission-denied"} twice. Attempt 1 used the real pairing-created rivalry. Attempt 2 used the JOB-02-authorized fallback: real create/redeem proof followed by a template-equivalent paired gameplay root/session. The same denial remained.

## Failing assertion
```js
let results=await Results.publishResult({...a(300),seasonNumber:1,operationId:op("season_result_op_",101),baseRevision:0,result:resultFor("playerOne",1)});assert.equal(results.ok,true,JSON.stringify(results));
```

## Last 30 CI log lines
```text
2026-10-02T10:12:56.8703122Z false !== true
2026-10-02T10:12:56.8703344Z 
2026-10-02T10:12:56.8704354Z     at playFreshSingleSeason (/home/runner/work/fifa17-career-showdown2/fifa17-career-showdown2/tests/firebase/two-manager-journey-emulator.cjs:136:165)
2026-10-02T10:12:56.8705966Z     at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
2026-10-02T10:12:56.8707550Z     at async runSecondShowdownAndAbandon (/home/runner/work/fifa17-career-showdown2/fifa17-career-showdown2/tests/firebase/two-manager-journey-emulator.cjs:160:3)
2026-10-02T10:12:56.8709519Z     at async /home/runner/work/fifa17-career-showdown2/fifa17-career-showdown2/tests/firebase/two-manager-journey-emulator.cjs:256:171
2026-10-02T10:12:56.8822422Z [33m[1m⚠ [22m[39m Script exited unsuccessfully (code 1)
2026-10-02T10:12:57.3833046Z [36m[1mi  emulators:[22m[39m Shutting down emulators.
2026-10-02T10:12:57.3837356Z [36m[1mi  firestore:[22m[39m Stopping Firestore Emulator
2026-10-02T10:12:57.7162224Z [36m[1mi  hub:[22m[39m Stopping emulator hub
2026-10-02T10:12:57.7166369Z [36m[1mi  logging:[22m[39m Stopping Logging Emulator
2026-10-02T10:12:57.7197846Z 
2026-10-02T10:12:57.7199567Z [1m[31mError:[39m[22m Script "[1mCMS_SHOWDOWN_LENGTH=3 node tests/firebase/two-manager-journey-emulator.cjs[22m" exited with code 1
2026-10-02T10:12:58.0088449Z ##[error]Process completed with exit code 1.
2026-10-02T10:12:58.0202847Z Post job cleanup.
2026-10-02T10:12:58.1527337Z Post job cleanup.
2026-10-02T10:12:58.2391132Z [command]/usr/bin/git version
2026-10-02T10:12:58.2429211Z git version 2.55.0
2026-10-02T10:12:58.2464776Z Temporarily overriding HOME='/home/runner/work/_temp/800f5f84-ebc7-43e1-b649-e4c2c91bf1d7' before making global git config changes
2026-10-02T10:12:58.2466552Z Adding repository directory to the temporary git global config as a safe directory
2026-10-02T10:12:58.2471114Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/fifa17-career-showdown2/fifa17-career-showdown2
2026-10-02T10:12:58.2504483Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
2026-10-02T10:12:58.2534472Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
2026-10-02T10:12:58.2742843Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
2026-10-02T10:12:58.2767565Z http.https://github.com/.extraheader
2026-10-02T10:12:58.2778175Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
2026-10-02T10:12:58.2808905Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
2026-10-02T10:12:58.3014016Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
2026-10-02T10:12:58.3069426Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
2026-10-02T10:12:58.3475719Z Cleaning up orphan processes
```

- Step 6 BLOCKED: direct real-pair chaining failed at Daniel's first fresh-rivalry Season Results publish with permission-denied in CI 36993445788. The job-authorized fallback then proved real pairing separately and reseeded the paired gameplay root exactly like the lifecycle template, but the same Season Results publish failed again with permission-denied in CI 36994806517. Per handbook, stopped after the same Step 6 failure twice; no app code or Rules were changed.

## Self-check

## Blocked question

Step 6 has failed twice at the same first Season Results write for the fresh second Showdown, including after the JOB-02-authorized seeded paired-state fallback. Should the Team G lead treat this repeat permission-denied as a product/Rules bug to split into a prerequisite job, or provide the exact intended fixture/authority change for JOB-02 to continue?

### Failing assertion

```text
AssertionError [ERR_ASSERTION]: {"ok":false,"code":"permission-denied"}
false !== true
at playFreshSingleSeason (.../tests/firebase/two-manager-journey-emulator.cjs:141:165)
```

### Last 30 CI log lines

```text
2026-10-02T10:21:45.4518303Z false !== true
2026-10-02T10:21:45.4518454Z 
2026-10-02T10:21:45.4519118Z     at playFreshSingleSeason (/home/runner/work/fifa17-career-showdown2/fifa17-career-showdown2/tests/firebase/two-manager-journey-emulator.cjs:141:165)
2026-10-02T10:21:45.4520048Z     at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
2026-10-02T10:21:45.4521248Z     at async runSecondShowdownAndAbandon (/home/runner/work/fifa17-career-showdown2/fifa17-career-showdown2/tests/firebase/two-manager-journey-emulator.cjs:165:3)
2026-10-02T10:21:45.4522422Z     at async /home/runner/work/fifa17-career-showdown2/fifa17-career-showdown2/tests/firebase/two-manager-journey-emulator.cjs:261:171
2026-10-02T10:21:45.4662146Z [33m[1m⚠ [22m[39m Script exited unsuccessfully (code 1)
2026-10-02T10:21:45.9676531Z [36m[1mi  emulators:[22m[39m Shutting down emulators.
2026-10-02T10:21:45.9679725Z [36m[1mi  firestore:[22m[39m Stopping Firestore Emulator
2026-10-02T10:21:46.3106090Z [36m[1mi  hub:[22m[39m Stopping emulator hub
2026-10-02T10:21:46.3110565Z [36m[1mi  logging:[22m[39m Stopping Logging Emulator
2026-10-02T10:21:46.3145809Z 
2026-10-02T10:21:46.3147270Z [1m[31mError:[39m[22m Script "[1mCMS_SHOWDOWN_LENGTH=3 node tests/firebase/two-manager-journey-emulator.cjs[22m" exited with code 1
2026-10-02T10:21:46.6074502Z ##[error]Process completed with exit code 1.
2026-10-02T10:21:46.6193809Z Post job cleanup.
2026-10-02T10:21:46.7593994Z Post job cleanup.
2026-10-02T10:21:46.8469601Z [command]/usr/bin/git version
2026-10-02T10:21:46.8512635Z git version 2.55.0
2026-10-02T10:21:46.8553959Z Temporarily overriding HOME='/home/runner/work/_temp/d9dd012b-b94d-47b0-9158-7e5370b332d9' before making global git config changes
2026-10-02T10:21:46.8555766Z Adding repository directory to the temporary git global config as a safe directory
2026-10-02T10:21:46.8559907Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/fifa17-career-showdown2/fifa17-career-showdown2
2026-10-02T10:21:46.8598732Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
2026-10-02T10:21:46.8633113Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
2026-10-02T10:21:46.8886431Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
2026-10-02T10:21:46.8914842Z http.https://github.com/.extraheader
2026-10-02T10:21:46.8926666Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
2026-10-02T10:21:46.8961570Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
2026-10-02T10:21:46.9278406Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
2026-10-02T10:21:46.9318853Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
2026-10-02T10:21:46.9729300Z Cleaning up orphan processes
```
Team G lead: Showdown 2 reaches transfer COMPLETED but the first season Results.publishResult is denied by the composed production Rules even after the job-authorized template-equivalent gameplay reseed. Please classify this as a gameplay gap/job or specify the expected provider-level bridge for Section F; worker must not change app code or Rules in JOB-02.
