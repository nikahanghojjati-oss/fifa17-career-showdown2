# R9 Slice 5 — Shared Season Results Authority Alignment

Status: CONTRACT WRITTEN — VISUAL IMPLEMENTATION NOT STARTED
Base runtime: `1.9.1-r44`
Base main: `47cbfbaba083e1eb35c06d687cceceb799e34920`

Transfer remains Slice 4 and is isolated in draft PR #298. This document defines the next high-risk non-Transfer visual contract.

## Why this route cannot use the old R8 screenshot as implementation authority

The current `seasonEntry` route is no longer one form followed by one local summary.

It is a staged Shared Journey surface in which multiple production modules reuse the same review DOM in a strict order. Some stages are provider writes, some are read-only authoritative projections, and opponent data remains private until the Season Results protocol allows reveal.

A visual rewrite that flattens these stages would create false authority.

## Stage 1 — own result entry

Primary owner: `js/productionSharedSeasonResults.js`

Precondition:

- Shared mode
- confirmed Shared Setup
- completed Shared Transfer for this exact season
- exact current shared season

Real route:

- `#seasonEntry`

Real input cards:

- Daniel result card
- Nik result card

Current privacy rule:

- only the local manager's card is visible/editable
- opponent card is hidden
- opponent result is not available before both publish

Primary real action:

- `#completeSeason` → `REVIEW MY SEASON RESULT`

Important:

- this action does not persist the canonical local Save
- it moves only into an in-memory review draft

## Stage 2 — own review before publication

Shared Season Results reuses the existing `#seasonReviewPanel`.

Real nodes include:

- `#seasonReviewHeading`
- `#seasonReviewStatusMeta`
- `#seasonReviewOne`
- `#seasonReviewTwo`
- `#seasonReviewResult`
- `#seasonReviewError`
- `#confirmSeasonCompletion`
- `#editSeasonResults`

Current presentation state is already projected onto:

- `#seasonEntry[data-shared-season-results="review"]`

Before publication:

- own reviewed card visible
- opponent card hidden
- `EDIT MY RESULT` available
- `PUBLISH MY SEASON RESULT` available
- publication is described as immutable for this manager/season

## Stage 3 — own result published, rival not yet published

Protocol: `js/sharedSeasonResults.js`

Persisted phases:

- `COLLECTING`
- `RESULTS_READY`

In `COLLECTING`:

- exactly one published role exists
- the publishing manager can see their own result
- opponent result remains unavailable
- screen polls current provider state

Current text:

- `YOUR RESULT IS PUBLISHED`
- `PUBLISHED · WAITING FOR YOUR RIVAL`

The publish action becomes disabled/confirmed.

R9 must not display an empty opponent card as though its values are merely loading. It is private/unavailable by contract.

## Stage 4 — both manager results published

In `RESULTS_READY`:

- both published roles exist
- provider projection may reveal both results to both managers
- Shared Season Results itself still declares `authoritativeScoring:false`

Current review text explicitly says scoring is a separate capability.

This distinction must remain visible in R9:

"Both results published" is not the same thing as "season score committed."

## Stage 5 — Shared Season Commit

Owner: `js/productionSharedSeasonCommit.js`

Precondition:

- exact Season Results state is `RESULTS_READY`

Real runtime-created nodes:

- `#sharedSeasonCommitStatus`
- `#sharedSeasonCommitAction`

Current states:

### Coordinator has not committed

Coordinator:

- `COMMIT SHARED SEASON`

Peer:

- `WAITING FOR COORDINATOR`

Only the confirmed coordinator may create the immutable Shared Season snapshot.

### Snapshot committed, own acknowledgement pending

- `ACKNOWLEDGE SHARED SEASON`

Both managers must acknowledge independently.

### Own acknowledged, rival pending

- `ACKNOWLEDGED ✓ · WAITING FOR RIVAL`

### Both acknowledged

Commit phase becomes `ACKNOWLEDGED`.

The real status says canonical scoring is the next capability.

R9 must not merge Commit and Scoring into one apparent click.

## Stage 6 — canonical scoring

Owner: `js/productionSharedCanonicalScoring.js`

Precondition:

- committed Shared Season is acknowledged by both managers

Real runtime-created panel:

- `#sharedCanonicalScoringPanel`
- `#sharedCanonicalScoringHeading`
- `#sharedCanonicalScoringTotals`
- `#sharedCanonicalScoringBreakdown`
- `#sharedCanonicalScoringWinner`

Verified phase:

- `SCORING_RECONCILED`

Contracts:

- `authoritativeScoring:true`
- provider-enforced source
- read-only derived projection
- submitted totals are not trusted

Current breakdown includes:

- Champions League
- League Title
- Domestic Cup
- Performance Bonus
- Individual Awards Bonus

R9 should visually elevate this panel as the first authoritative season-score outcome.

## Stage 7 — Shared History Convergence

Owner: `js/productionSharedHistoryConvergence.js`

Preconditions:

- acknowledged Season Commit
- canonical scoring available

Real runtime-created panel:

- `#sharedHistoryConvergencePanel`
- `#sharedHistoryConvergenceHeading`
- `#sharedHistoryConvergenceSummary`
- `#sharedHistoryConvergenceRecords`
- `#sharedHistoryConvergenceTrophies`

Verified phase:

- `HISTORY_CONVERGED`

It is a read-only authoritative projection of:

- accepted season count
- aggregate Daniel/Nik points
- overall lead
- manager records
- trophy attribution

Multi-Season progression explicitly requires this panel to be visibly witnessed before advancing.

Therefore R9 must not collapse History Convergence into a hidden background success message.

## Stage 8A — more seasons remain

Owner: `js/productionSharedMultiSeasonProgression.js`

Real runtime-created nodes in the review flow:

- `#sharedMultiSeasonProgressionStatus`
- `#sharedMultiSeasonContinueAction`

Only after History Convergence is visibly witnessed:

- action becomes `CONTINUE TO SEASON N`
- one exact local cursor advance occurs
- navigation returns to `dashboard`

No provider write occurs in this module.

## Stage 8B — final season complete

If accepted seasons equals total seasons, Multi-Season does not create another season.

Final reconciliation and terminal close become the next stages.

## Stage 9 — Final Reconciliation

Owner: `js/productionSharedFinalReconciliation.js`

Real runtime-created panel:

- `sharedFinalReconciliationPanel`
- `#sharedFinalReconciliationHeading`
- `#sharedFinalReconciliationSummary`
- `#sharedFinalReconciliationWinner`
- `#sharedFinalReconciliationClose`

Verified active phase:

- `FINAL_SEASON_RECONCILED`

Current text explicitly states:

- all seasons accepted
- no additional season
- final results read-only
- Terminal Close is separate

R9 must visually distinguish final score reconciliation from actual provider terminal closure.

## Stage 10 — Terminal Close

Owner: `js/productionSharedTerminalClose.js`

Real runtime-created panel:

- `#sharedTerminalClosePanel`
- `#sharedTerminalCloseHeading`
- `#sharedTerminalCloseSummary`
- `#sharedTerminalCloseStatus`
- `#sharedTerminalCloseAction`
- `#sharedTerminalCloseRetry`

Current presentation phases:

- `READY`
- `RECOVERY_PENDING`
- `BLOCKED`
- `CLOSED`

### READY

Real action:

- `CLOSE SHARED SHOWDOWN`

Requires exact active private session authority.

### BLOCKED

Final results stay preserved, but Terminal Close waits for exact private authority to return.

No fake close success may be shown.

### RECOVERY_PENDING

Provider acknowledgement is ambiguous.

Real retry:

- `RETRY SAME TERMINAL CLOSE`

Retry is bound to the exact same terminal witness.

R9 must not offer a new or replacement close action.

### CLOSED

Terminal is verified.

Current text explicitly states:

- no new session
- no new season
- final results remain read-only

The close/retry controls disappear.

## R9 layout model

The visual route should behave as one staged "season authority stack," not as a long list of equally important cards.

Recommended ordering:

1. current stage/status rail
2. manager result entry or publication review
3. Season Commit
4. Canonical Score
5. History Convergence
6. Next-season action OR Final Reconciliation
7. Terminal Close

Only currently eligible stages should carry primary visual emphasis.

## Privacy rules

Before `RESULTS_READY`:

- never show opponent result
- never reserve an opponent data card that looks merely unloaded
- never derive rival result from local memory

At and after `RESULTS_READY`:

- use only provider projection exposed by current runtime

## Visual state vocabulary

The global R9 vocabulary should be reused:

- EDITING
- REVIEW
- PUBLISHED
- WAITING
- COMMIT REQUIRED
- ACKNOWLEDGEMENT REQUIRED
- AUTHORITATIVE SCORE
- HISTORY CONVERGED
- CONTINUE
- FINAL RECONCILED
- TERMINAL CLOSE REQUIRED
- OUTCOME UNCONFIRMED
- BLOCKED / RECONNECT REQUIRED
- CLOSED

These are presentation labels, not replacement protocol phases.

## Protected behavior

R9 implementation must not modify:

- Shared Season Results privacy
- publication idempotency/CAS
- coordinator-only Season Commit
- both-manager acknowledgements
- canonical scoring source
- History Convergence witness requirement
- exact-once local season cursor
- final reconciliation
- same-witness Terminal Close retry
- exact active-session requirement for Terminal Close
- canonical storage boundaries
- scoring rules
- Spark / zero-billing architecture
- current Griezmann licensed Season Entry visual/crop

## Implementation gate

Do not begin Season Results CSS/DOM reordering until browser evidence is designed for:

- Daniel entry
- Nik entry
- one published / one private
- both published
- coordinator commit pending
- peer waiting
- one acknowledgement pending
- both acknowledged
- scoring reconciled
- history converged
- continue to next season
- final reconciliation
- Terminal Close READY
- Terminal Close BLOCKED
- Terminal Close RECOVERY_PENDING
- Terminal Close CLOSED
- mobile 390x844
- Chromebook 1366x768
