# Career Mode Showdown — v1.1.0 Clean Stability Build

Date: 2026-08-11
Owner request: create a clean build from the completed v1.1.0 release, run it against every permanent gate including each feature/workstream gate, fix any reproduced defect, and deliver the next stable bug-free build.

## Authority and scope

- Base branch: `main`.
- Frozen base SHA: `d23cea4d0a8bb3c428265546555a78008269d228`.
- Existing application identity at branch cut: `v1.1.0 / 1.1.0-r1`.
- Existing deployed Candidate A release remains the implementation authority.
- This is a stabilization/clean-build pass only. Do not begin Candidate B import analysis or Candidate C restore.
- Preserve gameplay, scoring, routing, storage keys/schema, player source crops, loading-screen composition, Messi/Lahm, and the existing save identity model unless a reproduced release defect specifically requires a bounded correction.
- Automated validation is technical proof, not a substitute for owner art-direction acceptance on real hardware.

## Clean-build branch

- Branch: `agent/v1.1.1-clean-stability`.
- Created directly from `d23cea4d0a8bb3c428265546555a78008269d228` with no intermediate source mutation.

## Permanent gate inventory at branch cut

The repository contains the following twelve permanent GitHub Actions workflows, all of which are release-authoritative for this clean-build pass:

1. `validate-menu-bootstrap.yml` — Home/bootstrap shell feature gate.
2. `validate-league-confirmation.yml` — League Selected/Confirmed feature gate.
3. `validate-transfer-workstream.yml` — Transfer Challenge feature gate.
4. `validate-season-review.yml` — Season Entry/Review/Summary feature gate.
5. `validate-statistics-workstream.yml` — Statistics feature gate.
6. `validate-settings-workstream.yml` — Settings/Data Management feature gate.
7. `validate-v1-visual-immersion.yml` — accepted V1 presentation/immersion gate.
8. `validate-football-visuals.yml` — licensed/crop-safe football photography gate.
9. `validate-final-polish.yml` — final route/micro-feedback/accessibility/performance gate.
10. `validate-static-app.yml` — broad static architecture/navigation/scoring/state/release contract gate.
11. `validate-stability-lane.yml` — storage/backup contracts, two consecutive Chromium cycles, and deployed Pages smoke on `main`.
12. `validate-v110-release-burnin.yml` — five independent complete release-gate comparisons.

## Validation policy for this build

- A failure/cancellation/timeout is not a pass.
- If any gate reproduces a defect, record the exact run/job/assertion, diagnose the root cause, implement the smallest compatible fix, and restart final-SHA proof from zero.
- Do not weaken a permanent contract merely to make CI green.
- Do not raise the existing startup budget to hide regressions.
- Final delivery requires one frozen PR head with every pull-request workflow green.
- After merge, `main` must be checked again. Stability must verify deployed Pages byte parity and complete public-site browser smoke.
- The five-pass release burn-in must be green on the final clean state.
- Temporary development helpers must not survive the final repository state.

## Continuous action log

1. Confirmed current `main` remained at `d23cea4d0a8bb3c428265546555a78008269d228`, the final clean post-deployment v1.1.0 state.
2. Read `PROJECT_STATE.md` and `NEXT_TASK.md`; both keep Candidate B/C outside the current clean-build scope and preserve all existing gameplay/storage/visual protections.
3. Enumerated the current repository tree and confirmed twelve permanent validation workflows, including all feature/workstream gates plus Stability and the five-pass release burn-in.
4. Created branch `agent/v1.1.1-clean-stability` directly from the exact deployed main SHA.
5. Created this handoff before implementation/validation so all subsequent findings, fixes, run IDs and release proof can be appended here.

## First frozen-baseline proof

Candidate SHA `12c3e428e278243dbe9d6b9750bbbb95f2f154ca` changed only this handoff relative to production, so it served as a clean reproducibility test of the deployed application bytes. All twelve permanent workflow families passed:

- Home Bootstrap run `31526372141` — SUCCESS.
- League Confirmation run `31526372053` — SUCCESS.
- Transfer Workstream run `31526372100` — SUCCESS.
- Season Review run `31526372035` — SUCCESS.
- Statistics Workstream run `31526372112` — SUCCESS.
- Settings Workstream run `31526372096` — SUCCESS.
- V1 Visual Immersion run `31526372021` — SUCCESS.
- Licensed Football Visuals run `31526372109` — SUCCESS.
- Final Polish run `31526372033` — SUCCESS.
- Static App run `31526372210` — SUCCESS.
- Stability Lane run `31526372201` — storage/contracts SUCCESS and two consecutive complete Chromium cycles SUCCESS; deployed-site smoke correctly skipped because this is a pull request.
- v1.1.0 Release Burn-In run `31526372058` — SUCCESS, with all five independent complete release passes green.

Five-pass job evidence for run `31526372058`:

- Pass 1 job `93895594147` — SUCCESS.
- Pass 2 job `93895593890` — SUCCESS.
- Pass 3 job `93895594099` — SUCCESS.
- Pass 4 job `93895594066` — SUCCESS.
- Pass 5 job `93895593998` — SUCCESS.

Stability job evidence:

- contracts job `93895594561` — SUCCESS.
- two-cycle Chromium job `93895645674` — SUCCESS.
- deployed-site job `93896772598` — SKIPPED by design on pull requests; mandatory after merge to `main`.

### Defect found during the clean-build audit

No runtime defect reproduced. The clean audit did reproduce a **continuation-authority defect**: `00_DEVELOPER_START_HERE.md`, `PROJECT_STATE.md`, `README.md` and `NEXT_TASK.md` still described v1.0.2 and the pre-merge PR #14 release path as the current operational state even though v1.1.0 Candidate A had already merged, deployed and passed final Pages smoke. A new developer following those highest-authority files could therefore regress the project by reopening completed work or treating Candidate A as unmerged.

The correction updates current-state/next-task metadata only. It does not change HTML, CSS, JavaScript, data, assets, storage behavior, gameplay, routing, scoring, source crops, startup timing or application/cache identity.

After these authority corrections and removal of this temporary helper, the new clean SHA must re-earn the entire twelve-workflow matrix plus 5/5 burn-in.

## Corrected clean-candidate proof

After the authority correction and removal of the temporary sync workflow, SHA `18e7a90a800053c760bd211f3ab69601a84ad4ad` contained only five documentation files relative to production: `00_DEVELOPER_START_HERE.md`, `README.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, and this handoff. `compare_commits` confirmed there were no HTML, CSS, JavaScript, data, media, asset or other runtime-file changes.

Every permanent workflow then re-ran on `18e7a90a800053c760bd211f3ab69601a84ad4ad` and passed:

- Home Bootstrap run `31527067845` — SUCCESS.
- League Confirmation run `31527067551` — SUCCESS.
- Transfer Workstream run `31527067535` — SUCCESS.
- Season Review run `31527067513` — SUCCESS.
- Statistics Workstream run `31527067557` — SUCCESS.
- Settings Workstream run `31527067610` — SUCCESS.
- V1 Visual Immersion run `31527067454` — SUCCESS.
- Licensed Football Visuals run `31527067489` — SUCCESS.
- Final Polish run `31527067624` — SUCCESS.
- Static App run `31527067637` — SUCCESS.
- Stability Lane run `31527067531` — contracts SUCCESS and two consecutive complete Chromium cycles SUCCESS; deployed-site smoke skipped by design on pull requests.
- v1.1.0 Release Burn-In run `31527067515` — SUCCESS with all five independent complete release passes green.

Five-pass job evidence for the corrected candidate:

- Pass 1 job `93897888423` — SUCCESS.
- Pass 2 job `93897888463` — SUCCESS.
- Pass 3 job `93897888549` — SUCCESS.
- Pass 4 job `93897888474` — SUCCESS.
- Pass 5 job `93897888510` — SUCCESS.

Stability job evidence for the corrected candidate:

- contracts job `93897970919` — SUCCESS.
- two-cycle Chromium job `93898015485` — SUCCESS.
- deployed-site job `93899156257` — SKIPPED by design on pull requests; mandatory after merge.

### Clean-build disposition before final documentation-inclusive proof

- Runtime defects reproduced: **0**.
- Documentation/continuation defects reproduced and fixed: **1** (stale current-state authority across four bootstrap files).
- Runtime application bytes changed: **0**.
- Performance budgets raised: **no**.
- Permanent contracts weakened: **no**.
- Temporary helper present: **no**.
- Candidate B/C work introduced: **no**.

This handoff append changes the PR SHA, so its resulting documentation-inclusive head must itself pass the complete twelve-workflow matrix and 5/5 burn-in before exact-head merge. Post-merge `main` must additionally pass deployed GitHub Pages exact-byte verification and the full public-site smoke.

## Final documentation-inclusive PR head and merge proof

The public handoff append produced final PR head `533560464bfb55cbe482f586c07a488bc8a569fa`. That exact SHA re-earned the complete twelve-workflow pre-merge matrix before PR #15 was allowed to merge:

- Home Bootstrap run `31527594679` — SUCCESS.
- League Confirmation run `31527594693` — SUCCESS.
- Transfer Workstream run `31527594676` — SUCCESS.
- Season Review run `31527594690` — SUCCESS.
- Statistics Workstream run `31527594686` — SUCCESS.
- Settings Workstream run `31527594683` — SUCCESS.
- V1 Visual Immersion run `31527594674` — SUCCESS.
- Licensed Football Visuals run `31527594698` — SUCCESS.
- Final Polish run `31527594777` — SUCCESS.
- Static App run `31527594741` — SUCCESS.
- Stability Lane run `31527594774` — contracts SUCCESS and two complete Chromium cycles SUCCESS; deployed-site smoke skipped by design on PR.
- Release Burn-In run `31527594719` — SUCCESS with all five independent passes green.

Five-pass jobs on final PR head:

- Pass 1 `93899638190` — SUCCESS.
- Pass 2 `93899638070` — SUCCESS.
- Pass 3 `93899638121` — SUCCESS.
- Pass 4 `93899638087` — SUCCESS.
- Pass 5 `93899638102` — SUCCESS.

Stability jobs on final PR head:

- contracts `93899697365` — SUCCESS.
- two-cycle Chromium `93899697366` — SUCCESS.
- deployed-site `93900810251` — SKIPPED by design on PR.

PR #15 was then marked ready and merged with exact-head protection. Merge commit: `5002069b2babcc79c9fdb803b5ae3ec7b2266fc6`.

## Production proof on merged clean-stability runtime

GitHub Pages deployment run `31528064977` completed SUCCESS for merge SHA `5002069b2babcc79c9fdb803b5ae3ec7b2266fc6`.

Every permanent feature/workstream/release workflow also ran on that exact merge SHA and succeeded:

- Home Bootstrap `31528065764` — SUCCESS.
- League Confirmation `31528065893` — SUCCESS.
- Transfer Workstream `31528065674` — SUCCESS.
- Season Review `31528065686` — SUCCESS.
- Statistics Workstream `31528065802` — SUCCESS.
- Settings Workstream `31528065770` — SUCCESS.
- V1 Visual Immersion `31528065696` — SUCCESS.
- Licensed Football Visuals `31528065692` — SUCCESS.
- Final Polish `31528065715` — SUCCESS.
- Static App `31528065734` — SUCCESS.
- Stability Lane `31528065780` — SUCCESS.
- Release Burn-In `31528065729` — SUCCESS with all five independent passes green.

Production burn-in jobs:

- Pass 1 `93901145514` — SUCCESS.
- Pass 2 `93901145561` — SUCCESS.
- Pass 3 `93901145528` — SUCCESS.
- Pass 4 `93901145566` — SUCCESS.
- Pass 5 `93901145487` — SUCCESS.

Production Stability jobs:

- contracts `93901146115` — SUCCESS.
- two-cycle Chromium `93901233977` — SUCCESS.
- deployed-site smoke `93902341795` — SUCCESS.

The deployed-site smoke against the public GitHub Pages URL succeeded through every required stage:

1. exact deployed runtime-byte parity — SUCCESS;
2. runtime error provenance — SUCCESS;
3. Home/Reus visual audit — SUCCESS;
4. crop-safe licensed football-photo audit — SUCCESS;
5. Candidate A non-mutating backup/export audit — SUCCESS;
6. complete public-site gameplay/browser journey — SUCCESS.

## Clean-stability result before repository-state seal

- Runtime defects reproduced across the clean build: **0**.
- Continuation/authority defect found and fixed: **1**.
- Runtime application bytes intentionally changed by this build: **0**.
- Application identity: **v1.1.0 / 1.1.0-r1** (deliberately unchanged because there was no runtime patch).
- Startup/performance budgets raised: **no**.
- Permanent gates weakened: **no**.
- Candidate B import implementation introduced: **no**.
- Candidate C restore introduced: **no**.
- Temporary development helper left in repository: **no**.
- Owner subjective real-device visual acceptance: remains separate from automated technical proof until explicitly given.

This production-proof append itself changes only this handoff document. Therefore the resulting documentation-inclusive `main` SHA must run the complete twelve-workflow matrix one final time, including another 5/5 release burn-in and a successful deployed-site smoke, before the clean-stability build is declared fully sealed.
