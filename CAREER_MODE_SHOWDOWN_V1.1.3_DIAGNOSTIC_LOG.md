# Career Mode Showdown v1.1.3 — Diagnostic Log

Companion to `CAREER_MODE_SHOWDOWN_V1.1.3_ACTIVE_HANDOFF.md`.

This file is append-only in spirit: it records diagnostic and pre-release evidence, including failed checks, so later developers do not mistake corrected test harness failures for product defects or silently repeat them.

## 2026-08-11 / 2026-08-12 — deterministic asset generation

- Temporary workflow: `Temporary v1.1.3 Licensed Visual Builder`.
- Run ID: `31551552859`.
- Input head: `1d2cad86562d060be9599bfb70732d9e92f37437`.
- Conclusion: SUCCESS.
- Generated asset commit: `2e46d51a4850a5922c99aeafa202ecbe5f4c2d13`.
- Result: 12 active licensed local derivatives in `assets/football/asset-manifest.json`; per-image ceiling held; exact source/output hashes recorded.

## 2026-08-12 — deterministic runtime integration

- Temporary workflow: `Temporary v1.1.3 Runtime Integration`.
- Run ID: `31551887524`.
- Input head: `fd0750ea19292b975dc4c4243941a6c8b1dd7ced`.
- Conclusion: SUCCESS.
- Generated integration commit: `aa0fe59dd3e5485f4616fc5450033db1b269d49f`.
- Result: required visual screen ownership expanded to eleven destinations; v1.1.3 visual CSS loaded after protected base CSS; route-scoped visual integration applied.

## 2026-08-12 — first 11-screen browser preview

- Temporary workflow: `Temporary v1.1.3 Visual Preview`.
- Run ID: `31551978375`.
- Head: `1a7b217fcf115101c81c88d72a5c3840a1e92494`.
- Job: `93976403628`.
- Conclusion: FAILURE.
- Failure: `createShowdown/james-rodriguez-world-cup-2014-v113: image did not settle`.
- Evidence review: `waitForVisual()` had already required a decoded image plus the `imageLoaded` class, but the subsequent assertion required computed opacity `>= .999` after only two animation frames. Protected base CSS intentionally fades image opacity over 180 ms, so the audit could inspect the image inside that valid transition window.
- Classification: TEST-HARNESS TIMING FAILURE, not accepted product/asset evidence and not a reason to change the 180 ms product fade.
- Screenshot artifact: none; failure occurred before the first screenshot was written.
- Correction: make `waitForVisual()` wait for the existing computed opacity transition to reach its settled state before layout/composition assertions. No opacity, crop, face-safety, overflow or startup-network threshold was lowered.

## 2026-08-12 — second 11-screen browser preview

- Run ID: `31552082889`.
- Head: `4173f5bbf50cccd499f18a8f0887a3d6c2fe5a86`.
- Job: `93976729622`.
- Conclusion: FAILURE.
- Product finding: `transferChallenge/marcus-rashford-chelsea-2017-v113: copy overlaps protected photo anchor`.
- Classification: REAL LAYOUT GATE FINDING. The new Rashford source was intentionally given a larger match-photo stage, and the inherited Transfer copy width intruded into that protected stage.
- Artifact: `9124620903`; the first four desktop screens were captured before the Transfer assertion.
- Manual review of those first four captures:
  - James reads as a materially stronger, historic World Cup portrait/action image than the rejected interview still;
  - Ronaldo, Pogba and Zlatan cinematic bands were visually clean and integrated rather than wallpaper-like;
  - hierarchy/copy contrast remained controlled.
- Correction commit: `be95d5062030667bc04a9a472e78fc97f841329d`.
- Correction strategy: keep the larger Rashford/Martial image stages and narrow/rebalance Transfer copy plates by breakpoint. The finding was not hidden by shrinking the player photograph.

## 2026-08-12 — third 11-screen browser preview

- Run ID: `31552209516`.
- Head: `be95d5062030667bc04a9a472e78fc97f841329d`.
- Job: `93977116951`.
- Conclusion: FAILURE.
- Progress before failure: Create Showdown, League Wheel, Club Assignment, Showdown Home, Transfer Challenge, Season Results and Season Summary all passed the active visual assertions at desktop. This confirms the prior Transfer copy/photo overlap is resolved at that breakpoint.
- Failure: temporary audit attempted `careerStatistics` after loading its optional module but had not invoked the module's `createCareerStatisticsScreen()` constructor. The runtime correctly reported `Missing screen careerStatistics`.
- Classification: TEST-HARNESS LAZY-SCREEN SETUP FAILURE, not a runtime product defect.
- Artifact: `9124663264`; seven desktop screen captures were preserved, including the corrected Transfer view and both season bands.
- Manual Transfer review: Martial is clean and prominent in the isolated Champions League frame; Rashford's Chelsea match frame shows a real emotional match moment and now has clear separation from the copy plate. The full-frame Rashford subject occupancy remained under qualitative review pending responsive evidence.
- Correction commit: `92f45855de122ff572321ad698905e0d5fe6736e`.
- Correction: construct `careerStatistics`, `trophyRoom` and `ruleBook` through their real lazy-module screen constructors before audit, and capture every destination screenshot before layout assertions so any future failure keeps direct visual evidence.

## 2026-08-12 — fourth 11-screen browser preview / responsive visual acceptance gate

- Run ID: `31552440038`.
- Head: `92f45855de122ff572321ad698905e0d5fe6736e`.
- Job: `93977808295`.
- Conclusion: SUCCESS.
- Artifact: `9124750493`, digest `sha256:24beaf4b2534312d269ce47ef067c0c2f1103d60a184352eda18c56c066015f2`.
- Coverage: all 11 visual destinations and all 12 active football derivatives at 1366×768 desktop, 940×700 windowed/Chromebook geometry and 390×844 mobile DPR2 — 33 screenshots total.
- Runtime assertions passed:
  - zero football-archive image requests during Home startup;
  - all 12 active derivatives were requested only after their owning routes were explicitly exercised;
  - every visual used `object-fit: contain`;
  - no horizontal overflow;
  - clean-anchor copy remained outside protected photo stages;
  - accent geometry stayed in the lower safe zone;
  - no first-party request or page errors.
- Manual screenshot review accepted the generated candidates for release-candidate integration:
  - James World Cup source is a clear cinematic/historic improvement over the rejected interview source;
  - Rashford's Chelsea 2–0 teammate-embrace moment is readable at desktop/windowed/mobile after the copy-width correction and no longer requires a tighter semantic crop;
  - Martial remains prominent and clean in the Champions League frame;
  - Ronaldo, Pogba, Zlatan, Griezmann, Neymar, Falcao and Balotelli each read as a bounded screen-purpose visual rather than decorative wallpaper;
  - the full responsive set remains visually controlled and does not turn the interface into a photo collage.
- This is diagnostic visual acceptance evidence, not the official repeated release proof. The successful logic will be promoted into the permanent Licensed Football Visuals gate before candidate freeze.

## 2026-08-12 — release identity finalizer diagnostics

### First exact-count attempt

- Temporary workflow: `Temporary v1.1.3 Release Identity Finalizer`.
- Run ID: `31552675540`.
- Head: `c7a9e268985d5abd7acb636726d3981255471a45`.
- Job: `93978521485`.
- Conclusion: FAILURE.
- Failure: exact-count helper expected nine `1.1.2-r1` references in `index.html`; the actual guarded count is ten.
- Classification: FAIL-CLOSED INTEGRATION-HELPER COUNT ERROR. The helper stopped before commit; no partial version-identity mutation was published by the failed run.
- No runtime/test threshold or product behavior was changed to address this.
- Correction commit: `1ec1f2fbddee2d4dfe3db54d39d056c9ff6d4e14`, changing only the expected guarded count from nine to ten.

### Corrected exact-count attempt

- Run ID: `31552781658`.
- Head: `1ec1f2fbddee2d4dfe3db54d39d056c9ff6d4e14`.
- Conclusion: SUCCESS.
- Generated identity commit: `ec202741e40c1972393db5b55d34552e3efe9f1d`.
- Result: package/package-lock application version is `1.1.3`; runtime/cache revision is `1.1.3-r1`; footer is `v1.1.3 · Stable`; `APP_VERSION`, optional-module fallback, football-visual fallback and visual-fidelity cache query are coherent.
- Startup splash duration was not shortened and gameplay/scoring behavior was not modified.

## 2026-08-12 — current validator / authority alignment diagnostics

### Current-release stale-pin audit

- Temporary workflow: `Temporary v1.1.3 Release Validator Audit`.
- Run ID: `31553085847`.
- Conclusion: SUCCESS.
- Purpose: identify executable validation surfaces still asserting the previous v1.1.2 current-envelope identity after runtime identity advanced to v1.1.3.
- Finding: stale current-envelope pins existed in Season Review, V1 Visual Immersion, Final Polish, Static App, Statistics, Home Bootstrap and Release Burn-In workflows plus Candidate A/B current-envelope contract labels/support scripts.
- Guard result: the protected eager startup ceilings remained exactly 165,000 raw bytes / 37,500 gzip bytes. The audit did not authorize any increase.
- Historical v1.1.2/v1.1.1 release evidence was intentionally retained as history rather than globally rewritten.

### First current-authority publication attempt

- Temporary workflow: `Temporary v1.1.3 Current Authority Alignment`.
- Run ID: `31553283050`.
- Conclusion: FAILURE at publication boundary.
- The deterministic alignment helper itself completed successfully and the budget/history guard completed successfully.
- The workflow then created a local commit containing ordinary files plus workflow YAML, but GitHub rejected the ref update because the Actions `GITHUB_TOKEN` had `contents:write` without the separate workflow-file permission.
- Classification: TOOLING / GITHUB SECURITY PERMISSION BOUNDARY. The intended patch was validated before GitHub refused publication; the failure did not justify bypassing or weakening repository security.
- No rejected workflow-YAML ref update reached the branch.

### Split ordinary-file alignment

- Run ID: `31553331317`.
- Conclusion: SUCCESS.
- Strategy: rerun the exact helper and guards, restore workflow YAML before commit, and publish only ordinary current-authority docs/tests/support files with the normal Actions token.
- Generated commit: `4a82447b26249d0602ce6ec1bab9e5bfbf92da75`.
- Result: `PROJECT_STATE.md`, `README.md`, `NEXT_TASK.md`, `00_DEVELOPER_START_HERE.md`, `CHANGELOG.md`, Candidate A/B current-envelope contracts and release-burn-in support labels are aligned to v1.1.3 while immutable historical release records remain unchanged.
- Workflow YAML remained intentionally pending for publication through the user-authorized GitHub connector.

### Season Review workflow connector publication

- `validate-season-review.yml` was advanced directly through the GitHub connector after the permission split.
- Commit: `c270301ca310a61d75524b524d2543e95deff497`.
- Change class: current release/cache-revision guard only; Season Review gameplay/rollback/Smart Back/a11y/startup contracts remain intact.

### First exact workflow-tree staging attempt

- Run ID: `31553491536`.
- Head: `0ca7d5c6e4c8d4a5f3f4bb805e492016e491f40c`.
- Job: `93980981506`.
- Conclusion: FAILURE before staging.
- Failure: the original current-authority helper is deliberately fail-closed/non-idempotent and expected at least one `v1.1.2` occurrence in `validate-season-review.yml`; that workflow had already been correctly advanced through the connector, so the helper found zero and stopped.
- Classification: INTEGRATION-HELPER IDEMPOTENCY / ALREADY-APPLIED-SCOPE FAILURE. No staged commit/tree was created and no workflow files were published by this run.
- Correction strategy: do not loosen the original broad helper. Create a narrow staging helper for the six remaining stale workflow files only, excluding already-correct Season Review and already-published ordinary docs/tests. That narrow helper will remain exact/fail-closed for its intended one-time scope.

### Successful six-workflow staged-tree publication

- Narrow staging run: `31553673966`.
- Job: `93981527724`.
- Conclusion: SUCCESS through patch construction / expected permission refusal at bot ref update.
- Staged commit: `a08cdbe0d8782ff6c53e2f25d5c6c6376df4cd99`.
- Staged tree: `4e57fa0ac474fff5bf5daf37fd0752ebf5216b24`.
- Scope: the six remaining stale permanent workflows only — V1 Visual Immersion, Final Polish, Statistics, Home Bootstrap, Release Burn-In and Static App.
- Guard result before staging: startup ceilings remained exactly 165,000 raw / 37,500 gzip; historical v1.1.2/v1.1.1/v1.1.0 release records remained unchanged.
- The Actions token again received the expected workflow-file permission refusal. The already-built commit object was then fast-forwarded onto the branch through the user-authorized GitHub connector. This preserved the validated tree rather than recreating the workflow edits manually.

### Escaped revision-regex finding and correction

- A subsequent validator audit identified two remaining stale current-envelope regexes that the first plain-string workflow alignment intentionally had not matched: `^1\.1\.2-r\d+$` in Home Bootstrap and Statistics.
- This was a validator coherence issue only; runtime identity was already `1.1.3-r1`.
- Exact correction staging run: `31553845893`.
- Job: `93982043862`.
- Conclusion: SUCCESS through patch construction / expected bot workflow permission refusal.
- Staged commit: `6c27f09fab9d3119ec3a8cf23203d2572e918888`.
- Staged tree: `702ad9666932909d3ceec83816a14a241053efcc`.
- The user-authorized GitHub connector fast-forwarded that exact staged commit to the branch.
- No runtime behavior or thresholds changed.

### Final stale-pin audit after workflow publication

- Audit run: `31553906215`.
- Job: `93982223534`.
- Conclusion: SUCCESS.
- Result: zero stale escaped `1\.1\.2` current-envelope regexes remained in permanent executable validation surfaces.
- Plain `1.1.2` references that remained were intentional historical assertions in Static App validating the immutable previous `RELEASE_V1.1.2.md` record and its `1.1.2-r1` evidence.
- Protected startup thresholds still reported exactly 165,000 raw / 37,500 gzip.
- Current runtime identity reported coherently as v1.1.3 / `1.1.3-r1`.

### Temporary build/audit helper removal

- Once permanent gates had absorbed the successful diagnostic logic, all temporary v1.1.3 builder/integration/version/audit workflows and one-off helper scripts were removed before PR freeze.
- Cleanup tree: `36a2dcad50d0cfcd0503af5d3338249cc01a97cb`.
- Cleanup commit: `2d3c48350cbff264a29b372eaaed9836627ec98a`.
- Removed temporary workflows: licensed visual builder, runtime integrator, release identity finalizer, visual preview, release-validator audit and current-authority alignment.
- Removed one-off alignment/integration/finalization/staging helpers plus the temporary browser preview test.
- Retained permanent reproducible asset authority: `tools/build_r5_player_visuals.py`.
- Retained permanent browser evidence authority: `tests/browser/football-visual-audit.cjs`.

### Season Review diff cleanup

- A pre-PR compare against main revealed that the earlier connector publication of `validate-season-review.yml` had preserved behavior but compacted formatting, creating an unnecessary 87-line review diff.
- That noise was not accepted into the release candidate.
- The workflow was restored byte-for-byte from current main formatting and only its two current runtime-revision assertions/messages were advanced from v1.1.2 to v1.1.3.
- Cleanup commit: `8031b8853568170b036d506c46b7abfcc7d9c2ad`.
- Final compare result for Season Review: exactly 2 additions / 2 deletions; all protected Season Review behavior/rollback/Smart Back/a11y assertions remain intact.

## Pre-PR checkpoint

- Branch: `v1.1.3-candidate-c-visual-fixes`.
- Head after Season Review cleanup: `8031b8853568170b036d506c46b7abfcc7d9c2ad` before this handoff update.
- Base main remains `9c9ff5fe8a3361b91400e5b37b310fa7bb42f5de`.
- Branch is ahead of main and not behind.
- Temporary build/audit helpers are absent from the release diff.
- Permanent wheel and licensed-visual gates now carry the new regression/visual evidence.
- Next: open the diagnostic PR and let all permanent gate families evaluate the integrated candidate. Diagnostic PR failures, if any, must be corrected and recorded before any official two-pass freeze is started.

## Release-proof rule

Diagnostic runs, including corrected failures, are not counted toward the eventual official repeated pre-merge or production proof matrix. The final release candidate must be frozen and tested independently after temporary build/preview helpers are removed.
