# Surface Group 09 — r15 Shared Journey Conflicts

Status: ACTIVE PROPOSAL CONTRACT — RECONCILED TO PRODUCTION `1.9.1-r15`

Production anchor:

`4d202126ce1606a4e3f74c09b31201cf4ec51c6e`

Production owners:

- `js/sharedJourneyConflicts.js`;
- `js/productionSharedJourneyConflicts.js`;
- existing mutation surfaces in Shared Setup and Shared Season Commit.

This capability is not a route, modal or user-facing conflict inbox. It is a guard around existing shared mutations.

## Display rule

Do not display internal receipt fields in ordinary product UI:

- operation ID;
- attempt/static hashes;
- authority key;
- raw device/session/rivalry IDs unless an existing diagnostic surface already owns them.

Translate the runtime classification into a consequence on the surface where the user attempted the action.

## Classification treatment

`ACCEPTED`

- ordinary success path;
- no conflict badge;
- exact replay recovery may use existing non-duplicate confirmation copy only.

`STALE`

- if the single bounded retry succeeds, remain quiet;
- if it does not, `SHARED STATE CHANGED`;
- refresh/review current authority before retrying;
- no force overwrite.

`REPLAY_ALTERED`

- integrity-block treatment;
- `REQUEST CHANGED — NOT APPLIED`;
- explain that current shared state must be reviewed before a fresh action;
- stronger border/icon than transient error, but no claim of local-save damage.

`UNAUTHORIZED`

- authority/session treatment;
- reuse Connected Account / Registered Browser / Remote Joining language as specifically as the provider code permits;
- never duplicate the join workflow.

`QUOTA`

- provider-unavailable treatment;
- explicit `NO PAID FALLBACK` in owner/developer review; ordinary player copy may simply say shared cloud action is temporarily unavailable;
- Career Mode/local Save remains available;
- no billing CTA.

`TRANSIENT`

- temporary provider/network state;
- bounded retry or Refresh only;
- no repeating spinner storm.

`DENIED`

- safe provider rejection;
- no bypass/force action.

`RECEIPT_EXPIRED`

- local guard receipt expired;
- `REFRESH CURRENT SHARED STATE` then make a fresh deliberate action;
- do not say the rivalry or save expired.

## Placement

The message appears inside the existing action context:

- Shared Setup overlay for setup mutations;
- Season Results/Shared Season Commit review for commit/acknowledgement mutations;
- existing cross-product provider state region when appropriate.

Do not add a global top-of-app conflict strip unless production later establishes that ownership.

## Hierarchy

Use R8 state tokens:

- stale/transient: amber/gold;
- replay altered: red/cream integrity block, but not catastrophic full-screen failure;
- unauthorized: gold/amber action-needed;
- quota: amber/neutral provider unavailable;
- denied: red only when the denial is truly error/destructive-risk level;
- expired: cream/gold refresh-needed.

Every state uses text and geometry, never color alone.

## Actions

Allowed only when the existing runtime flow supports them:

- Refresh;
- retry after current-state re-read;
- open/join Remote Joining through its existing control;
- repeat a fresh deliberate setup/commit action after the state is current.

Forbidden:

- Force Apply;
- Ignore Conflict;
- Merge Remote Into Local Save;
- Reset Rivalry;
- Buy More Quota;
- Upgrade Firebase/Audius/provider tier;
- Retry Forever.

## Mobile

At 390px:

- body/status copy >=13px;
- state title >=12px and strongly weighted;
- one primary recovery action maximum per state block;
- long provider codes are converted to human-readable copy;
- no horizontal scrolling;
- action targets >=44px.

## Accessibility

- error/status region uses the semantics already owned by its parent surface;
- do not move focus when a background refresh classifies a receipt;
- a failed deliberate mutation may update an `aria-live` status once;
- repeated poll/refresh with unchanged classification is not re-announced;
- icons are decorative when text already conveys the state.

## Acceptance

- no new route or second provider authority;
- successful bounded stale retry does not create noisy warning residue;
- altered replay is unmistakably not applied;
- unauthorized state points toward existing private-session recovery only;
- quota state never offers paid fallback;
- receipt expiry does not imply rivalry expiry;
- local Save authority remains visually separate;
- final screenshot review includes materially visible conflict states only.
