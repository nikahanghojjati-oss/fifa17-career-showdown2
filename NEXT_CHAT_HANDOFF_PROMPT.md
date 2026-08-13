# Next Chat Developer Handoff Prompt

Copy the prompt below into a new ChatGPT development chat.

---

You are taking over an existing production software project as the next senior developer. Do not restart the project, redesign it, or ask me to reconstruct previous chat history. The GitHub repository now contains the current handoff and production proof needed to continue from the exact last point.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Your first responsibility is to use the GitHub repository as source authority and become fully caught up before making code changes.

Read in this order:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `V1.2.0_R2_PRODUCTION_PROOF.md`
7. `RELEASE_V1.2.0_R2.md`
8. `CAREER_MODE_SHOWDOWN_V1.2.0_R2_MAINTENANCE_HANDOFF.md`
9. `POST_V1_ROADMAP_EXECUTION.md`
10. `00_MASTER_DEVELOPER_CONTEXT.md` when deeper historical context is useful
11. immutable `RELEASE_V1.2.0.md` and `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md` only for previous-runtime rollback/history
12. current source, relevant tests, Git history, and open PR #37 before implementing v1.3 work.

Authority hierarchy when information conflicts:

1. current verified source on `main`
2. later explicit owner instructions
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. current release/maintenance records
7. roadmap and architecture documents
8. historical handoffs/conversation records

Do not revert verified working source to satisfy stale prose. Correct or relabel stale documentation instead.

Current production baseline you should independently verify in GitHub:

- application v1.2.0 — Installable Offline App
- production runtime `1.2.0-r2`
- previous known-good runtime `1.2.0-r1`
- r2 is merged, deployed, exact-byte verified and technically production-proven
- release PR #39
- hotfix merge `2179b7928602b9579dc6e129c40b8739082de80a`
- post-merge visual-test authority `e966a5a44927992e2e33f602434c5311bf7caee7`
- Stability `31740111919`
- final deployed-site-smoke job `94581704562`
- dedicated V1 Visual Immersion `31740111961`
- Release Integration Burn-In `31740111986`, 2/2 complete stateful journeys passed
- production proof is `V1.2.0_R2_PRODUCTION_PROOF.md`

The last shipped work fixed two production regressions:

1. iOS installed/standalone loading composition. The root cause was viewport-height-sensitive composition in the installed app, not a bad Reus image. r2 separates safe-area/viewport behavior from the art composition, uses a bounded width-owned mobile top band and stable subject-safe image box, and uses an opacity/filter-only entrance animation so protected geometry cannot shift.
2. Install UI hierarchy. The global floating install/status rail and panel were fully removed. Install/update actions live only inside Settings. Do not reintroduce floating/sticky global install UI unless I explicitly authorize that exact pattern.

The release also made visual testing smarter. Loading visual coverage now includes desktop, low-height desktop, narrow mobile browser and iOS standalone-height archetypes. Tests judge composition relationships and settled geometry, with screenshot evidence. Do not weaken this to element-existence, decode-success or resolution-only checks, and do not lower thresholds merely because a test sampled an animation incorrectly.

Preserve all established product rules and architecture. In particular:

- exactly two managers
- Showdown lengths 1/3/5/10
- same selected league, different permanent clubs
- UCL +5, League +3, main domestic Cup +1
- 100 League Points and/or Goals share maximum +1
- Top Scorer and/or Top Assist share maximum +1
- maximum Season score 11
- equal non-zero scores remain Draw
- only 0–0 uses league position then league points
- `js/screens.js` remains sole navigation/history/Smart Back authority
- `js/storage.js` remains sole canonical persistence/destructive mutation authority
- `js/storageTransaction.js` remains the raw transaction engine
- exactly three canonical localStorage keys remain legal
- Candidate A remains non-mutating export
- Candidate B remains strictly read-only analysis
- Candidate C remains the only import stage allowed to commit canonical state and must preserve immutable confirmed intent, strict exact raw snapshot/preconditions, last-moment prewrite checks, transaction-owned rollback, anti-clobber ownership, post-write verification and byte-for-byte rollback verification
- Cache Storage/Service Worker stores application bytes only, never canonical user data
- whole-runtime cache coherence is protected
- current `1.2.0-r2` shell and previous-known-good `1.2.0-r1` recovery semantics are protected
- install/update presentation remains Settings-owned
- accepted Home/loading and route-scoped football visual intent is protected unless new reproducible evidence requires a fix
- eager raw <=165,000 bytes, eager gzip <=37,500 bytes, Reus startup portrait <=95,000 bytes, combined first-party startup <=260,000 bytes
- normal loading minimum 2700 ms; reduced-motion loading 220 ms
- 14 permanent workflow families and 27 protected multiline executable blocks remain the validation topology; normal PRs run 13 families and Burn-In is main/manual release-only.

Critical v1.3 warning:

Open draft PR #37, branch `agent/v13-hardening`, is NOT a trusted continuation baseline. Its last inspected head was `221212a87cc58712a1ebd9452d7b71cdaa36327d`. Commit `6ce7fe6fab87031b69e3dc5e98587fd3f78b3558` (`Freeze v1.3 shell identity`) accidentally replaced large portions of the proven production DOM while existing JS/CSS still depended on the production structure. This caused menu initialization/visibility failures and version-coherence problems.

Do not merge, deploy or blindly continue PR #37 as-is. Do not migrate the whole application to its accidental alternate shell unless I explicitly request a redesign.

Instead, start from current verified r2 `main`, fetch PR #37, compare it against current main rather than its historical base, classify every change, and salvage only useful evidence-backed hardening after separating it from the shell regression. Potentially useful ideas already identified include fail-closed Candidate A behavior when canonical storage reads are blocked, preservation/restoration of true pre-offline media state, update-activation race hardening, avoiding redundant Service Worker registration and semantic roadmap/dependency contracts. Revalidate each against current r2 source rather than assuming it is correct.

The immediate legal milestone is v1.3.0 — Recovery & Device Resilience Hardening. Audit before changing production code. Scope includes:

- browser close/reopen, reload, Service Worker controller change and update interruption
- failed population/activation and cache corruption/recovery
- exact preservation of all three canonical raw localStorage values
- blocked read/write, quota and corrupt-storage behavior
- Candidate C interruption, stale state, ownership uncertainty and rollback verification
- Settings/offline/update UI layering, focus, pointer, keyboard/touch and reduced motion
- Smart Back and lazy-screen/listener ownership
- Chromebook low-height, mobile, DPR2 and accessibility behavior
- external-media offline/online transitions
- dependency-lock and reproducible `npm ci` integrity
- CI ownership/cancellation/artifact semantics
- release/version/revision/handoff coherence
- performance headroom without raising protected limits.

Cloud, accounts, QR pairing, two-device transport, Local Profiles/Save Library, gameplay/scoring changes and framework rewrites are out of scope unless I explicitly change direction.

Working method:

- inspect exact source and history before editing
- identify root causes rather than applying cosmetic patches
- preserve working systems and accepted visuals
- make the smallest coherent correction
- add focused regression proof for every real defect
- distinguish product failures from test/browser/infrastructure failures
- inspect actual rendered visual evidence rather than assuming green tests prove visual quality
- do not weaken tests to make CI green
- avoid repetitive planning loops
- do the development in GitHub; do not hand me replacement project files
- continuously update the repository handoff during meaningful work as required by `00_HANDOFF_GOLDEN_RULE.md`
- record owner corrections, branch/base authority, experiments, failures, commits, CI evidence, deployment proof and the exact next action so another developer can resume without chat memory.

Before implementation, verify the latest `main` SHA because documentation-only handoff commits may have advanced the repository head after the r2 runtime proof. Do not confuse the mutable repository head with the immutable shipped runtime evidence.

After reading and verifying all of this, do not ask me to repeat the project. Briefly confirm the exact production baseline, the PR #37 risk, and the immediate v1.3 task, then begin the source/PR audit and continue development from `NEXT_TASK.md`.