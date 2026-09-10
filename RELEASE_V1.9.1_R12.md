# Career Mode Showdown v1.9.1-r12 Shared History Convergence

Status: RELEASE CANDIDATE
Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r12`
Previous known-good runtime: `1.9.1-r11`
Remote Joining readiness: `100/100` under frozen model `RJR-1`
Shared Showdown Journey readiness under `SSJR-1.1`: `0/100`
Milestone Delivery Progress: `65.80/100` until the exact coherent r12 candidate head completes its required lifecycle proof and the MDP ledger is updated separately.

## Purpose

r12 advances the Shared Showdown Journey beyond r11 Canonical Scoring by deriving one provider-authoritative read-only history projection from contiguous terminal Shared Season Commit and Canonical Scoring pairs.

Both managers can see the same accepted season history, identity-safe manager records and trophy attribution on their own Season Review surface. The projection is accepted only when every included season has an `ACKNOWLEDGED` revision-3 Season Commit and a `SCORING_RECONCILED` revision-1 canonical score bound to the exact same accepted results revision and content hash.

## Authority and identity

`js/sharedHistoryConvergence.js` validates the confirmed setup, exactly two entitled manager slots and contiguous accepted seasons before rebuilding the deterministic history projection.

`js/sparkSharedHistoryConvergence.js` uses the existing provider-enforced setup, Season Commit and Canonical Scoring authorities with exact account, device, rivalry, active-session and season addressing. It adds no Firestore write surface and no list permission.

`js/productionSharedHistoryConvergence.js` waits for current r10 and r11 terminal authority before reading history, renders the accepted projection only for the active shared rivalry/season context and fails closed on stale context, hash disagreement, provider denial or an incomplete next season.

## Production presentation

The r12 projection is mounted after the canonical scoring block in the existing Season Review. It presents:

* accepted season count and league;
* each manager's fixed club, season win/draw/loss record and accumulated Showdown points;
* each manager's league, domestic cup and Champions League trophy attribution.

The production adapter does not advance a season, overwrite the local scoreboard, mutate a Local Profile, archive a Showdown or perform final journey reconciliation. Those remain later explicit SSJR capabilities.

## Save Library lifecycle correction

During r12 validation, the deployed Save Library audit exposed an independent Settings lifecycle race: an asynchronous `career-mode-offline-state-change` rebuilt the entire Settings DOM and could destroy an in-progress Local Profile editor. r12 replaces only the Offline App panel for that asynchronous event and permanently verifies that the exact Save Library editor, unsaved draft and CANCEL control survive while connectivity presentation still refreshes. Canonical Save Library bytes remain unchanged.

## Whole-shell integration

The ordinary Shared Journey bootstrap installs History Convergence in normal shared play. The r12 service-worker shell owns all three History Convergence modules and retains the verified r11 whole shell as its explicit rollback target.

All revisioned startup assets must resolve coherently as `1.9.1-r12`; the release is not integrated merely because source files or CI exist.

## Safety boundaries

r12 does not mutate `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, or `careerModeShowdown.preferences` as part of History Convergence.

No billing is authorized. Firebase remains Spark-only. App Check enforcement remains OFF. r12 requires no Blaze plan, Cloud Functions, Cloud Run, paid service, public discovery, community surface, ranking system or Firestore persistence.

## Acceptance boundary

History Convergence can reach its 90% MDP pre-integration lifecycle state only after the complete coherent r12 candidate, including the ordinary runtime bootstrap, whole-shell cache, deterministic/provider/production contracts, two-context browser audit, Save Library lifecycle regression proof and inherited POS20 gates, passes on one exact candidate head.

That pre-integration state would move Milestone Delivery Progress from `65.80/100` to `69.80/100`. Product integration remains incomplete until the expected exact r12 head is merged to `main`, the coherent `1.9.1-r12` GitHub Pages runtime is deployed and verified, and required post-merge/burn-in gates are green. Only then may History Convergence reach 100% lifecycle maturity and MDP `70.30/100`.

SSJR remains `0/100` from source, CI, merge or deployment alone. Genuine production-two-account evidence remains a separate fixed acceptance layer.