# Status · JOB-16 · Two-manager browser journey (localhost-only emulator switch)

State: IN PROGRESS
Step: 7 of 9
Updated: 2026-10-03 14:33 UTC
Chat: GPT-5.6 Sol normal chat
Code branch: gameplay/job-16-browser-journey
Head commit: ba2eb69db015e0f91e4e6afceb928db4d90e5217
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37129725411

## Notes
- Step 1: JOB-02, JOB-07 and JOB-17 are DONE and merged; the provider journey exists on gameplay/recovery-v1. Recovery head 843e64e is green in Validate Gameplay Fast run 37125870168 (Gameplay contracts SUCCESS; Composed Rules on the emulator SUCCESS). Scanned all 117 js/*.js blobs on that exact tree: no connectAuthEmulator or connectFirestoreEmulator. validate-gameplay-fast.yml pins firebase@12.17.1; deploy-github-pages.yml copies only index/runtime files plus acceptance, assets, css, data and js, never tests/. The job branch was safely fast-forwarded from 889810f to current recovery 843e64e after JOB-08 merged; no force update and no product files changed.

- Step 2: Added the Appendix B contract and re-appended its POS20 registry/operations entries last after JOB-08. Exact-head run 37126386490 produced the required tests-first failure: Gameplay contracts failed 1/104 because tests/browser/support/emulator-runtime-switch.js does not exist yet (MODULE_NOT_FOUND). The failure occurs after Node parsed the new contract; no production or emulator switch file exists at this step.

- Step 3: Added Appendix A emulator-runtime-switch.js and Appendix D emulator config exactly. Exact-head run 37126548611: Gameplay contracts SUCCESS, 104/104 current blocking contracts; Operations audit pass 73 / fail 0. New contract PASS line: `PASS browser journey emulator switch contracts: localhost+flag only, production runtime untouched, Pages excludes tests/, startup gzip 37493/37500, services parity.` No production file references the switch.

- Step 4: Added Appendix C J0-J3 journey and appended the separate `browser-journey` CI job. Exact-head browser job SUCCESS. Last line: `PASS two-manager browser journey: 8 numbered checks (J0-J3 so far) on the Auth + Firestore emulators, composed production Rules, 3-season Showdown.` Artifact `browser-journey-screens` uploaded as artifact 11274672527. Gameplay contracts also SUCCESS on the same head.

- Step 5 / J4 checkpoint: Shared Setup is green on exact head 5bf7830 in browser run 37127199873. J4.1-J4.4 all passed: peer draw controls locked, same league, same distinct clubs, Daniel LEFT, both identical confirmations. One navigation behavior is being preserved as a non-blocking UI bug per §6: Nik receives the host league automatically but the presentation stays on the league screen until the non-authoritative `CONTINUE TO CLUB PACKS` navigation button is pressed.

- Step 5 / J5 checkpoint: Career Start is green on exact head e6e982d in browser run 37127516841. J5.1-J5.3 passed: each manager saw only their assigned club acknowledgement, both acknowledgements converged, and both reached the real Shared Transfer Challenge. Browser PASS currently has 15 numbered checks through J5 plus JZ; artifact `browser-journey-screens` uploaded as 11275108038.

- Step 5: J4 and J5 pass on the exact repaired head. J4 proves one authoritative league and two distinct clubs converge on both phone contexts with Daniel fixed in the LEFT/playerOne slot. A real presentation bug was captured without product code changes: after Daniel advances to the club screen, Nik's provider authority follows but Nik remains on the league screen until a navigation-only `CONTINUE TO CLUB PACKS` tap; the test marks this `// BUG` for the report. J5 proves each manager sees and acknowledges only their assigned Career Start club, both acknowledgements converge, and both reach the real Shared Transfer Challenge. Exact-head run 37127516841: Gameplay contracts SUCCESS, Composed Rules emulator SUCCESS, Two-manager browser journey SUCCESS; browser PASS line has 15 numbered checks and artifact `browser-journey-screens` 11275108038.

- Step 6 / J6-J7 checkpoint: exact head b8f45d5 is fully green in run 37128820835. J6.1-J6.5 passed including rendered-page privacy for unfinished rival guesses/signings and identical reveal only after COMPLETED. J7.1-J7.2 passed: Daniel's 1/87/93 result stayed absent from Nik before Nik published; after RESULTS_READY both review cards converged with identical raw facts. Canonical scoring remains intentionally locked until Shared Season Commit acknowledgement, so exact 9-3 scoring is proved immediately after the UI commit in J8. Browser PASS: 22 numbered checks through J7 plus JZ; artifact 11276550184. Non-blocking bugs carried forward: Nik setup presentation needs a navigation-only club-screen tap after authority follows, and the shared early-end control can show stale legacy `END WINDOW EARLY` copy while shared WINDOW_OPEN authority remains active.

- Step 7 BLOCKED / J8 canonical scoring wake: the same failure reproduced twice, first in run 37129309379 and again with diagnostics in run 37129725411. Both managers completed the real Shared Season Commit UI. Diagnostic state on Daniel proves the commit is authoritative and terminal for the season: committed=true, phase=ACKNOWLEDGED, revision=3, resultsRevision=2, acknowledgedRoles=[playerOne,playerTwo], with the exact Season 1 results. The production canonical scoring adapter nevertheless remained null for 60 seconds while #seasonEntry stayed visible and document.visibilityState was visible. This blocks exact 9-3 scoring, history convergence, Season 2 progression, reload, final reconciliation, Terminal Close, stranger, and second-Showdown sections. Per JOB-16 §8, work stops after the same step failed twice for the same reason.

### Blocking assertion
`J8_CANONICAL_SCORING_NOT_VISIBLE`: wait for `window.CareerModeProductionSharedCanonicalScoring.getState().phase === "SCORING_RECONCILED"` timed out after 60,000 ms after `#sharedSeasonCommitAction` showed `SEASON COMMIT ACKNOWLEDGED ✓`.

### Browser descriptions
`--- daniel: screens=seasonEntry | badge=DANIEL | panel=CAREER READYCareer ready.CONTINUE CAREERDaniel | overlays=`
`--- nik: screens=seasonEntry | badge=NIK | panel=CAREER READYCareer ready.CONTINUE CAREERNik | overlays=`
Both page error arrays were empty.

### Diagnostic state
Daniel commit: `{committed:true, ready:true, coordinatorRole:"playerOne", seasonNumber:1, phase:"ACKNOWLEDGED", revision:3, resultsRevision:2, acknowledgedRoles:["playerOne","playerTwo"]}`.
Daniel scoring: `null`.
Daniel setup: `SHOWDOWN_CONFIRMED`, revision 6, exact active session present.
Season Entry visible: true. Scoring panel exists: false. Document visibility: visible.

### Last 30 workflow log lines
```text
2026-10-03T14:32:35.9280464Z ##[endgroup]
2026-10-03T14:32:36.0805701Z With the provided path, there will be 12 files uploaded
2026-10-03T14:32:36.0815006Z Artifact name is valid!
2026-10-03T14:32:36.0815726Z Root directory input is valid!
2026-10-03T14:32:36.2599137Z Uploading artifact: browser-journey-screens.zip
2026-10-03T14:32:36.2676123Z Beginning upload of artifact content to blob storage
2026-10-03T14:32:36.4399338Z Uploaded bytes 1020281
2026-10-03T14:32:36.4556742Z Finished uploading artifact content to blob storage!
2026-10-03T14:32:36.4558576Z SHA256 digest of uploaded artifact is ede42d4ce6d24c85304d1f06ea3b377cfdf3b292a3d22cd0ab9ea1359ed10d2e
2026-10-03T14:32:36.4559992Z Finalizing artifact upload
2026-10-03T14:32:36.7011497Z Artifact browser-journey-screens successfully finalized. Artifact ID 11276581376
2026-10-03T14:32:36.7013514Z Artifact browser-journey-screens has been successfully uploaded! Final size is 1020281 bytes. Artifact ID is 11276581376
2026-10-03T14:32:36.7017316Z Artifact download URL: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37129725411/artifacts/11276581376
2026-10-03T14:32:36.7205649Z Post job cleanup.
2026-10-03T14:32:36.8836659Z Post job cleanup.
2026-10-03T14:32:36.9805283Z [command]/usr/bin/git version
2026-10-03T14:32:36.9856849Z git version 2.55.0
2026-10-03T14:32:36.9895803Z Temporarily overriding HOME='/home/runner/work/_temp/7ec368a0-baf5-49dd-845d-2fd2bd30fe9e' before making global git config changes
2026-10-03T14:32:36.9897588Z Adding repository directory to the temporary git global config as a safe directory
2026-10-03T14:32:36.9917681Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/fifa17-career-showdown2/fifa17-career-showdown2
2026-10-03T14:32:36.9960533Z [command]/usr/bin/git config --local --name-only --get-regexp core\\.sshCommand
2026-10-03T14:32:37.0013256Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
2026-10-03T14:32:37.0387647Z [command]/usr/bin/git config --local --name-only --get-regexp http\\.https\\:\/\/github\\.com\/\\.extraheader
2026-10-03T14:32:37.0412776Z http.https://github.com/.extraheader
2026-10-03T14:32:37.0459161Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
2026-10-03T14:32:37.0495961Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\\.https\\:\/\/github\\.com\/\\.extraheader' && git config --local --unset-all http.https://github.com/.extraheader || :"
2026-10-03T14:32:37.0846402Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\\.gitdir:
2026-10-03T14:32:37.0926325Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
2026-10-03T14:32:37.1331470Z Cleaning up orphan processes
```


- Step 7 BLOCKED after the same canonical-scoring failure reproduced twice (runs 37129309379 and 37129725411). J0-J7.2 still pass, both supporting CI jobs are green, and the season-1 commit itself is fully acknowledged. The browser cannot reach canonical scoring through the UI, so J8-J12 are not legally reachable without seeding or calling a provider/adapter directly.
- Failing assertion: `J8_CANONICAL_SCORING_NOT_VISIBLE` after 60 seconds waiting for `CareerModeProductionSharedCanonicalScoring.getState().phase === "SCORING_RECONCILED"`.
- Diagnostic at failure: commit `ok:true, committed:true, ready:true, phase:"ACKNOWLEDGED", revision:3, resultsRevision:2`; setup `ready:true, phase:"SHOWDOWN_CONFIRMED", revision:6`; `seasonEntryVisible:true`; `scoring:null`; `scoringPanel:false`; `visibility:"visible"`.
- Page descriptions:
  - `--- daniel: screens=seasonEntry | badge=DANIEL | panel=CAREER READYCareer ready.CONTINUE CAREERDaniel | overlays=`
  - `--- daniel errors: []`
  - `--- nik: screens=seasonEntry | badge=NIK | panel=CAREER READYCareer ready.CONTINUE CAREERNik | overlays=`
  - `--- nik errors: []`
- Failure excerpt:
  - `Error: J8_CANONICAL_SCORING_NOT_VISIBLE {... "commit":{"ok":true,"committed":true,"ready":true,"phase":"ACKNOWLEDGED","revision":3,...},"scoring":null,...,"seasonEntryVisible":true,"scoringPanel":false,"visibility":"visible"}`
  - `at commitSeasonViaUi (.../tests/browser/two-manager-browser-journey.cjs:145:13)`
  - `at async main (.../tests/browser/two-manager-browser-journey.cjs:451:5)`
  - `cause: page.waitForFunction: Timeout 60000ms exceeded`
- Last 30 log lines:
```text
2026-10-03T14:32:35.9280464Z ##[endgroup]
2026-10-03T14:32:36.0805701Z With the provided path, there will be 12 files uploaded
2026-10-03T14:32:36.0815006Z Artifact name is valid!
2026-10-03T14:32:36.0815726Z Root directory input is valid!
2026-10-03T14:32:36.2599137Z Uploading artifact: browser-journey-screens.zip
2026-10-03T14:32:36.2676123Z Beginning upload of artifact content to blob storage
2026-10-03T14:32:36.4399338Z Uploaded bytes 1020281
2026-10-03T14:32:36.4556742Z Finished uploading artifact content to blob storage!
2026-10-03T14:32:36.4558576Z SHA256 digest of uploaded artifact is ede42d4ce6d24c85304d1f06ea3b377cfdf3b292a3d22cd0ab9ea1359ed10d2e
2026-10-03T14:32:36.4559992Z Finalizing artifact upload
2026-10-03T14:32:36.7011497Z Artifact browser-journey-screens successfully finalized. Artifact ID 11276581376
2026-10-03T14:32:36.7013514Z Artifact browser-journey-screens has been successfully uploaded! Final size is 1020281 bytes. Artifact ID is 11276581376
2026-10-03T14:32:36.7017316Z Artifact download URL: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37129725411/artifacts/11276581376
2026-10-03T14:32:36.7205649Z Post job cleanup.
2026-10-03T14:32:36.8836659Z Post job cleanup.
2026-10-03T14:32:36.9805283Z [command]/usr/bin/git version
2026-10-03T14:32:36.9856849Z git version 2.55.0
2026-10-03T14:32:36.9895803Z Temporarily overriding HOME='/home/runner/work/_temp/7ec368a0-baf5-49dd-845d-2fd2bd30fe9e' before making global git config changes
2026-10-03T14:32:36.9897588Z Adding repository directory to the temporary git global config as a safe directory
2026-10-03T14:32:36.9917681Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/fifa17-career-showdown2/fifa17-career-showdown2
2026-10-03T14:32:36.9960533Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
2026-10-03T14:32:37.0013256Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
2026-10-03T14:32:37.0387647Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
2026-10-03T14:32:37.0412776Z http.https://github.com/.extraheader
2026-10-03T14:32:37.0459161Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
2026-10-03T14:32:37.0495961Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
2026-10-03T14:32:37.0846402Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
2026-10-03T14:32:37.0926325Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
2026-10-03T14:32:37.1331470Z Cleaning up orphan processes
```


- Step 7 BLOCKED at J8 canonical-scoring presentation after two same-reason failures. First exact-head failure: run 37129309379 on 54d5692606c0837178fda20607fca02bb75db42c timed out waiting for #sharedCanonicalScoringPanel after both UI acknowledgements. Diagnostic retry: run 37129725411 on 8184e3d6189dda5450f59c5493f5b61780bedf77 failed at the same gate after 60 seconds. Read-only diagnostics prove the Season Commit is genuinely committed/ACKNOWLEDGED at revision 3 with both roles acknowledged, Shared Setup is SHOWDOWN_CONFIRMED revision 6, seasonEntry is visible, document visibility is visible, but CareerModeProductionSharedCanonicalScoring.getState() is null and #sharedCanonicalScoringPanel does not exist. No product/provider bypass, seeding, force click, admin write, or direct provider call was used. J0-J7 remain proven; J8-J12 cannot be reached through the UI while canonical scoring never wakes.

### Failing assertion / diagnostic
`Error: J8_CANONICAL_SCORING_NOT_VISIBLE {"commit":{"ok":true,"committed":true,"ready":true,"coordinatorRole":"playerOne","runtimeRevision":"1.9.1-r10","seasonNumber":1,"phase":"ACKNOWLEDGED","revision":3,"managerRole":"playerOne","ownAcknowledged":true,"acknowledgedRoles":["playerOne","playerTwo"]},"scoring":null,"setup":{"status":"ready","ready":true,"revision":6,"phase":"SHOWDOWN_CONFIRMED","managerRole":"playerOne","remoteRole":"host"},"seasonEntryVisible":true,"scoringPanel":false,"visibility":"visible"}`

### Page descriptions
`--- daniel: screens=seasonEntry | badge=DANIEL | panel=CAREER READYCareer ready.CONTINUE CAREERDaniel | overlays=`
`--- daniel errors: []`
`--- nik: screens=seasonEntry | badge=NIK | panel=CAREER READYCareer ready.CONTINUE CAREERNik | overlays=`
`--- nik errors: []`

### Last 30 browser-job log lines
```
2026-10-03T14:32:35.9280264Z   MAVEN_ARGS: -ntp
2026-10-03T14:32:35.9280464Z ##[endgroup]
2026-10-03T14:32:36.0805701Z With the provided path, there will be 12 files uploaded
2026-10-03T14:32:36.0815006Z Artifact name is valid!
2026-10-03T14:32:36.0815726Z Root directory input is valid!
2026-10-03T14:32:36.2599137Z Uploading artifact: browser-journey-screens.zip
2026-10-03T14:32:36.2676123Z Beginning upload of artifact content to blob storage
2026-10-03T14:32:36.4399338Z Uploaded bytes 1020281
2026-10-03T14:32:36.4556742Z Finished uploading artifact content to blob storage!
2026-10-03T14:32:36.4558576Z SHA256 digest of uploaded artifact is ede42d4ce6d24c85304d1f06ea3b377cfdf3b292a3d22cd0ab9ea1359ed10d2e
2026-10-03T14:32:36.4559992Z Finalizing artifact upload
2026-10-03T14:32:36.7011497Z Artifact browser-journey-screens successfully finalized. Artifact ID 11276581376
2026-10-03T14:32:36.7013514Z Artifact browser-journey-screens has been successfully uploaded! Final size is 1020281 bytes. Artifact ID is 11276581376
2026-10-03T14:32:36.7017316Z Artifact download URL: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37129725411/artifacts/11276581376
2026-10-03T14:32:36.7205649Z Post job cleanup.
2026-10-03T14:32:36.8836659Z Post job cleanup.
2026-10-03T14:32:36.9805283Z [command]/usr/bin/git version
2026-10-03T14:32:36.9856849Z git version 2.55.0
2026-10-03T14:32:36.9895803Z Temporarily overriding HOME='/home/runner/work/_temp/7ec368a0-baf5-49dd-845d-2fd2bd30fe9e' before making global git config changes
2026-10-03T14:32:36.9897588Z Adding repository directory to the temporary git global config as a safe directory
2026-10-03T14:32:36.9917681Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/fifa17-career-showdown2/fifa17-career-showdown2
2026-10-03T14:32:36.9960533Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
2026-10-03T14:32:37.0013256Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
2026-10-03T14:32:37.0387647Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
2026-10-03T14:32:37.0412776Z http.https://github.com/.extraheader
2026-10-03T14:32:37.0459161Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
2026-10-03T14:32:37.0495969Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
2026-10-03T14:32:37.0846402Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
2026-10-03T14:32:37.0926325Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
2026-10-03T14:32:37.1331470Z Cleaning up orphan processes
```

- Lead (2026-10-03 14:45 UTC): BLOCKED received. Right call not to seed or call providers directly. The lead is finding the root cause of canonical scoring not starting after the ACKNOWLEDGED commit (product bug vs harness gap). Do nothing until the lead's answer lands here; then type continue.

- Lead (2026-10-03 15:20 UTC): root cause found. It is a real product bug, also on live main: the app never puts the rivalry id into the Showdown's sharedJourney marker, and canonical scoring, history convergence and multi-season progression read the rivalry only from there, so they silently do nothing after the commit (the browser audits hid it by seeding the id). The lead is fixing it in a separate fix PR into gameplay/recovery-v1. Keep State BLOCKED and do nothing; when the fix is merged the lead will write here which commit to merge into your branch, then type continue.

- Lead answer (2026-10-03 16:00 UTC): unblocked. The product fix is merged into gameplay/recovery-v1 (PR #331, merge 31360a0): canonical scoring, history convergence, multi-season, terminal close and final reconciliation now read the rivalry from confirmed Shared Setup when the marker lacks it. The lead merged recovery 31360a0 into your branch with an ordinary merge commit (no force-push): new head ba2eb69db015e0f91e4e6afceb928db4d90e5217. Registry and ops list keep every newer entry and put your browserJourneySwitchContract last; your browser-journey CI job comes after the Closed-Showdown adapter step. Lead check on ba2eb69: switch contract PASS, rivalry lookup 12/12, test:ops 73/73. Lead local browser runs with the fix: J0 to J8.5 and JZ pass (29/29) when J9 is skipped.
- Lead decisions for the rest of the job:
  1. Do not seed any id and do not call providers directly; the real UI path now works.
  2. J9 (reload mid-journey): the current product cannot resume after a reload. The private session does not survive, the app opens on the main menu, and multi-season restarts its cursor at season 1. That is a separate product job (resume after reload), not this job. DEFAULT: change J9 to print exactly "J9 SKIPPED: resume after reload is a separate product job (lead decision 2026-10-03)" and continue to J10. Do not count J9 as a pass and do not hide it.
  3. Known intermittent product bugs, each getting its own job: permission-denied on Nik's season acknowledge (about 2 in 8 runs, J7.3) and SEASON_RESULTS_STALE_BASE_REVISION on a simultaneous publish (about 1 in 8, J8.3). If one of these exact errors stops a CI run, record the run link and that error here, re-run the job once, and continue if the re-run is green. Any other failure is real: stop and set BLOCKED.
  4. Job 18 is merged, so the pair-code settle wait may be removed (optional).
- Next: type continue. Resume at step 7 with the exact-head CI on ba2eb69, which starts by itself because the lead pushed to gameplay/**.

## Self-check

## Blocked question
