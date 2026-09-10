# R8 r16 Shared Journey Local Reconciliation reconciliation

Status: RECONCILED TO CURRENT PRODUCTION MAIN `4c4975c1d3982ce6b2d8d4b37c0a6a15d94b625a` / EXECUTABLE RUNTIME REMAINS `1.9.1-r16`

Purpose: record the exact product-visible ownership of r16 and the minimum visual-proposal delta required after the proposal had already been reconciled through r15.

## Current-main drift check

The visual reconciliation was first completed against executable r16 main `613e031c648d8d5cdb4e260e74cd93f895f49872`.

During this successor session, `main` advanced one commit to `4c4975c1d3982ce6b2d8d4b37c0a6a15d94b625a` via `MDP: record Local Reconciliation integration at 91.00 (#247)`.

Exact compare from `613e031...` to `4c4975c...` changes only:

- `MILESTONE_DELIVERY_PROGRESS.json`;
- `NEXT_TASK.md`;
- `R16_MDP_ACCOUNTING_BOUNDARY.md`;
- `SHARED_SHOWDOWN_JOURNEY_READINESS.json`;
- `tests/contracts/milestone-delivery-progress-contracts.cjs`.

The commit explicitly describes itself as accounting/provenance only and states that executable product authority remains r16. No HTML, CSS, production JavaScript runtime, service-worker shell, Firestore Rules, or other user-visible product source changed in this one-commit drift.

Visual conclusion: no new route, visual state, layout or screenshot family is required solely for #247. The proposal anchor advances to current main while keeping the same `1.9.1-r16` executable-state contract.

## Source authority inspected

Production authority inspected on executable r16 and current-main accounting descendant:

- `R16_LOCAL_RECONCILIATION_CANDIDATE.md`;
- `js/sharedLocalReconciliation.js`;
- `js/productionSharedLocalReconciliation.js`;
- `js/sparkConnectedRivalry.js`;
- runtime release integration at `1.9.1-r16`;
- #247 MDP accounting/provenance-only drift.

The source establishes that r16 integrates Shared Journey history with the existing Connected Rivalry reconciliation authority. It does not create a new route, a new Firestore collection, a second provider writer or a second canonical local-storage writer.

## Actual user-visible ownership

The user-visible r16 controls remain inside the existing Settings overlay, in the existing Connected Rivalry panel mounted under `#settingsContent` as `#sparkConnectedRivalryPanel`.

That panel already owns the relevant visible distinction:

- Remote Observed;
- Local Target;
- Local Commit;
- Refresh Shared State;
- Preview Remote → Local;
- non-mutating preview details;
- explicit confirmation;
- Back Up + Apply Exact Revision;
- status/error copy.

Therefore R8 owns r16 as an additive state family within Surface Group 03, not as a routed page and not as a second Restore/Recovery authority.

## Authority boundary that R8 must preserve

Candidate B remains preview/observation only. Candidate C remains the sole destructive local Apply authority.

R8 may make that boundary clearer, but must not change it. In particular:

- preview is read-only;
- Apply requires explicit confirmation;
- Apply requires online authority revalidation;
- a verified backup precedes local mutation;
- exact remote revision/content and local target guards remain product authority;
- stale local or remote state must fail closed;
- unrelated saves remain untouched;
- the Shared Journey r16 adapter performs no direct canonical local-storage write;
- no automatic Apply is introduced.

## Offline presentation

An already-observed exact remote envelope may remain visible for read-only preview while offline. Offline Apply is denied.

The visual state must therefore distinguish `OFFLINE_FALLBACK / PREVIEW ONLY` from an online `PREVIEW READY / APPLY AVAILABLE` state. It must never imply that offline observation has changed local gameplay.

## R8 visual treatment

Use the existing black/charcoal/gold technical-ledger language from Connected Rivalry. Keep the surface character-free.

Required material states for final evidence:

1. waiting or remote-observed state;
2. non-mutating preview ready with exact remote revision/hash and exact local target;
3. offline fallback showing preview-only and Apply denied;
4. explicit confirmed Apply-ready state with `BACK UP + APPLY EXACT REVISION`;
5. applied completion or representative fail-closed error.

These may be captured as one consolidated Connected Rivalry state-review sheet plus a mobile representative. No new navigation tile or route is justified.

## Permanent product locks

- exactly two managers;
- Manager 1 = Daniel;
- Manager 2 = Nik;
- Firebase Spark only;
- Billing permanently OFF;
- no Blaze or paid fallback;
- no public discovery, matchmaking, community or rankings;
- Private Remote Joining remains its existing exact-capability authority;
- no new persisted visual mood/outcome field;
- no production main modification from the visual proposal branch.

## Finality impact

r16 reconciliation is now represented in the proposal contracts, implementation map, prototype and screenshot gate, and the subsequent #247 accounting-only main advance has been checked for visual drift. This does not make the visual proposal final. Final screenshots, character/media closure, automated/structural QA and explicit owner approval remain required before sealing a senior-developer implementation handoff.
