# Career Mode Showdown v1.9.1-r11 Shared Canonical Scoring

Status: RELEASE CANDIDATE
Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r11`
Previous known-good runtime: `1.9.1-r10`
Remote Joining readiness: `100/100` under frozen model `RJR-1`
Shared Showdown Journey readiness under `SSJR-1.1`: `0/100`
Milestone Delivery Progress: candidate accounting remains gated on exact-head validation.

## Purpose

r11 advances the Shared Showdown Journey beyond r10 Shared Season Commit by adding provider-authoritative canonical scoring derived from the exact terminal `ACKNOWLEDGED` Season Commit.

Both managers see the same read-only canonical season score inside the existing Shared Season Review only after r10 has reached revision 3 with both manager acknowledgements. r11 does not trust caller-submitted score totals and does not create another writable remote authority.

## Canonical FIFA 17 scoring

The r11 scoring protocol recomputes each manager's score from the two immutable seven-field season results captured by r10:

* Champions League winner: +5
* Domestic league winner: +3
* Main domestic cup winner: +1
* 100 league points and/or 100 league goals: +1 total maximum for this pair
* Top Scorer and/or Top Assist: +1 total maximum for this pair

Maximum season score is 11. A nonzero tied score remains a draw. Only a 0-0 score invokes the frozen no-bonus tiebreak order: league position, then league points.

## Authority and rendering

`js/sharedCanonicalScoring.js` validates the terminal r10 commit and deterministically derives the canonical score projection.

`js/sparkSharedCanonicalScoring.js` reads the existing provider-enforced Season Commit using exact account, device, rivalry, active-session and season context. It adds no Firestore write surface and no new Rules fragment.

`js/productionSharedCanonicalScoring.js` waits for provider-verified r10 `ACKNOWLEDGED` revision 3, renders the canonical totals, five-part breakdown and season winner in the existing Season Review, and periodically reconciles the read-only projection.

The r11 whole-shell cache now owns all three canonical scoring modules, so ordinary Shared Journey bootstrap and production acceptance flows do not depend on uncached candidate assets.

## Safety boundaries

r11 does not mutate `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, or `careerModeShowdown.preferences`.

r11 does not advance local season history, update the local Showdown scoreboard, begin another season, or perform final journey reconciliation. Those remain later explicit SSJR capabilities.

No billing is authorized. Firebase remains Spark-only. r11 requires no Blaze plan, Cloud Functions, Cloud Run, paid service, public discovery, community surface, or ranking system.

## Acceptance boundary

Source implementation, deterministic contracts, provider contracts, production contracts and the desktop/mobile browser path must pass on one exact r11 candidate head before Milestone Delivery Progress may move to the 90% pre-integration lifecycle state for Canonical Scoring.

Product integration remains incomplete until PR #232 is merged to `main`, the coherent `1.9.1-r11` GitHub Pages runtime is deployed and verified, and the post-merge MDP integration seal records that evidence.

SSJR remains `0/100` from source, CI or deployment alone. Production-two-account journey evidence is a separate acceptance dimension.