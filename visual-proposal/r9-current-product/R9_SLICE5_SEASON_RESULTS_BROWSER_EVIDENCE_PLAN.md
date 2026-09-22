# R9 Slice 5 — Shared Season Results Browser Evidence Plan

Base runtime: `1.9.1-r44`

This file is the visual implementation gate for the Shared Season Results authority stack.

## Required viewports

- desktop: 1280 × 800
- Chromebook target: 1366 × 768
- mobile: 390 × 844

The existing Shared Season Results / Commit / Scoring / History / Multi-Season browser audits already exercise 1280 × 800 and 390 × 844. R9 adds a Chromebook geometry pass and cross-stage visual assertions.

## Required state captures

### A. Own entry

Both roles independently:

- Daniel / playerOne
- Nik / playerTwo

Assert:

- only own result card visible
- rival result card hidden
- `#completeSeason` visible
- no Shared Commit / Scoring / History / Final / Terminal panels visible
- no horizontal overflow

### B. Local review before publish

Assert:

- `#seasonEntry[data-shared-season-results="review"]`
- heading = `REVIEW YOUR SEASON RESULT`
- own review card visible
- rival card hidden
- `#editSeasonResults` visible
- `#confirmSeasonCompletion` = `PUBLISH MY SEASON RESULT`

### C. One manager published

Assert:

- heading = `YOUR RESULT IS PUBLISHED`
- status = `PUBLISHED · WAITING FOR YOUR RIVAL`
- rival review card remains hidden
- publish action disabled/confirmed
- Commit / Scoring / History panels hidden

### D. Both managers published

Assert:

- heading = `BOTH MANAGERS PUBLISHED`
- both review cards visible
- result text explicitly separates publication from scoring
- Shared Season Commit panel/action now owns next progression

### E. Commit coordinator

Assert:

- real `#sharedSeasonCommitAction`
- label = `COMMIT SHARED SEASON`
- enabled
- visual treatment identifies the next required authority action

### F. Commit peer waiting

Assert:

- label = `WAITING FOR COORDINATOR`
- disabled
- no visual styling makes it look clickable

### G. Snapshot committed / own acknowledgement pending

Assert:

- label = `ACKNOWLEDGE SHARED SEASON`
- enabled
- status describes both-manager acknowledgement requirement

### H. Own acknowledged / rival pending

Assert:

- label = `ACKNOWLEDGED ✓ · WAITING FOR RIVAL`
- disabled
- no scoring panel yet

### I. Both acknowledged + canonical score

Assert:

- commit action terminal/disabled
- `#sharedCanonicalScoringPanel` visible
- phase projection = `SCORING_RECONCILED`
- totals/breakdown/winner visible
- scoring panel is visually higher priority than publication cards

### J. History converged

Assert:

- `#sharedHistoryConvergencePanel` visible
- heading = `SHARED HISTORY CONVERGED`
- accepted-season progress visible
- Daniel/Nik cumulative points visible
- manager records and trophy attribution visible
- panel remains visibly witnessable; it must not be visually collapsed

### K. More seasons remain

Assert:

- real `#sharedMultiSeasonContinueAction` visible
- label = `CONTINUE TO SEASON N`
- only after History Convergence is visible
- one click returns to Dashboard
- canonical local `currentRound` remains untouched by the Shared progression adapter

### L. Final reconciliation

Assert:

- `#sharedFinalReconciliationPanel` visible
- phase projection = `FINAL_SEASON_RECONCILED`
- no next-season action
- final winner / totals visible
- Terminal Close clearly remains separate

### M. Terminal Close READY

Assert:

- `#sharedTerminalClosePanel` visible
- phase projection = `READY`
- real `#sharedTerminalCloseAction`
- label = `CLOSE SHARED SHOWDOWN`

### N. Terminal Close BLOCKED

Assert:

- phase = `BLOCKED`
- no fake close action
- preserved-results / reconnect requirement visible

### O. Terminal Close RECOVERY_PENDING

Assert:

- phase = `RECOVERY_PENDING`
- real `#sharedTerminalCloseRetry`
- label = `RETRY SAME TERMINAL CLOSE`
- close action hidden
- retry language does not imply a fresh operation

### P. Terminal Close CLOSED

Assert:

- phase = `CLOSED`
- terminal marker = true
- close + retry hidden
- no new-session/no-new-season message visible

## Cross-stage geometry assertions

For each capture:

- `document.documentElement.scrollWidth <= document.documentElement.clientWidth`
- visible primary action has minimum 44px target height on mobile
- headings and status strings do not collide with football visual
- long 10-season strings wrap rather than overflow
- provider/recovery warnings remain real text, not pseudo-content
- hidden private rival content has no visible card shell that implies data loading

## Accessibility assertions

- stage/status messages remain live where current runtime already declares `aria-live`
- disabled authority actions expose disabled state
- review heading remains programmatically associated with `#seasonReviewPanel`
- keyboard focus stays on real action elements
- reduced-motion path does not remove information

## Mutation/authority regression assertions

R9 browser evidence must continue to prove:

- one publish per role
- peer cannot commit the season
- one coordinator commit
- one acknowledgement per role
- canonical scoring is read-only
- History Convergence is read-only
- Multi-Season progression performs no provider write
- Terminal Close retry uses the same witness
- no visual code changes Firebase/Firestore authority
