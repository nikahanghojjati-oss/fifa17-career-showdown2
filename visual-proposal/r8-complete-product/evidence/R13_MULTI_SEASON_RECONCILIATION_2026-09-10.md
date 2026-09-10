# R8 Proposal Reconciliation — r13 Multi Season

Status: RECONCILED INTO ACTIVE PROPOSAL

Production source examined read-only:

- previous proposal anchor: `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`
- current `main`: `ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686`
- release: `v1.9.1`
- runtime: `1.9.1-r13`
- MDP: `77.50/100`
- SSJR: `0/100`

The product delta adds provider-backed Shared Multi Season progression after accepted Shared History Convergence. It does not add a new routed screen. It adds visible state/action ownership inside the existing Season Results review flow and changes the authoritative active-season cursor used when returning to Dashboard.

## Visible r13 state introduced

The production runtime owns two dynamic Season Results review elements:

- `#sharedMultiSeasonProgressionStatus`
- `#sharedMultiSeasonContinueAction`

The presentation must support three materially different states without inventing authority:

1. accepted season but Shared History has not yet been visibly witnessed on this device: status explains that the shared history review must be visible before advancing; action remains disabled and communicates waiting;
2. Shared History is converged and witnessed: status identifies the accepted season and next season; `CONTINUE TO SEASON N` becomes the one progression action when runtime authority permits it;
3. terminal plan: all configured seasons are authoritatively accepted; the action becomes disabled `SEASON PLAN COMPLETE ✓` and the status explicitly says Final Reconciliation remains a separate step.

The runtime supports only the established Showdown lengths 1/3/5/10, preserves fixed clubs, performs no canonical local-storage mutation in the visual layer, and does not require billing/Blaze/Cloud Run/Cloud Functions.

## Proposal impact

Affected contracts:

- `screens/07_SEASON_RESULTS_ENTRY.md`
- `screens/05_SHOWDOWN_HOME_DASHBOARD.md`
- `surfaces/05_SHARED_PLAY_STATE_SYSTEM.md`
- shared Season Results reference composition
- future final-main reconciliation ledger

Unaffected contracts remain valid. No proposal restart is justified.

## UX decision

Multi Season progression is visually a continuation gate inside the existing shared review journey, not a new menu, wizard, or route.

Hierarchy after Shared History Convergence:

1. accepted Shared History ledger remains visible/read-only;
2. compact status band explains whether progression is ready or waiting;
3. one explicit Continue action is shown only when runtime authority permits it;
4. action returns the user to canonical Dashboard for the next season;
5. on final accepted season, progression closes and Final Reconciliation is explicitly separate.

This prevents visual conflation of History Convergence, next-season progression, and future Final Reconciliation.

## Responsive and accessibility requirements

- status appears directly above or adjacent to the progression action;
- mobile keeps status before action in reading/focus order;
- disabled waiting state remains readable and is not opacity-only;
- state is communicated in text, not color alone;
- no animation delays or implies provider acceptance;
- action never appears to mutate history itself;
- reduced motion does not alter authority timing;
- long Showdown state remains within the existing review flow rather than producing nested modal navigation.

## Current conclusion

The proposal is aligned to r13 Multi Season. Final completion is still blocked by later main-development capabilities and the mandatory final-main reconciliation gate.