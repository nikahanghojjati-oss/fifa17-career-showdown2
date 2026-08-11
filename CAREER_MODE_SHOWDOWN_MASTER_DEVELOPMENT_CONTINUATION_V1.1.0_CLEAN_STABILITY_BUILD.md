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
