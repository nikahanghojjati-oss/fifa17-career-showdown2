# r15 Journey Conflicts Visual Reconciliation — 2026-09-10

Status: RECONCILED INTO R8 PROPOSAL

Production main anchor:

`4d202126ce1606a4e3f74c09b31201cf4ec51c6e`

Production release:

`1.9.1-r15` — `MDP: Journey Conflicts r15 (#244)`.

Previous visual anchor:

`97c28b1efea6ee6e901e6076a834ec419cbad5aa` / `1.9.1-r14`.

## 1. What changed

r15 adds the Journey Conflicts protocol and production guard around the existing Shared Setup and Shared Season Commit mutation calls.

It does not add a new routed page, modal, provider collection, public discovery surface or second canonical authority.

The protocol emits non-authorizing, in-memory conflict receipts and classifies mutation outcomes as:

- `ACCEPTED`;
- `STALE`;
- `REPLAY_ALTERED`;
- `UNAUTHORIZED`;
- `QUOTA`;
- `TRANSIENT`;
- `DENIED`;
- `RECEIPT_EXPIRED`.

The guard permits at most one stale-base retry under the same operation identity and rejects altered replay before another provider invocation.

## 2. Visual consequence

There is no justified standalone `Journey Conflicts` destination.

Visual handling belongs to the existing mutation-owning surfaces:

- Shared Setup / League / Club setup overlay;
- Shared Season Commit / Season Results review;
- cross-product provider/error state grammar where an error is surfaced.

`ACCEPTED` and a successfully recovered one-time stale retry should normally remain quiet. They should not produce a celebratory conflict banner.

The user-visible problem classes need differentiated consequences without exposing raw hashes, operation IDs or internal authority keys in ordinary UI.

## 3. Proposed state mapping

### `STALE`

If the one permitted retry succeeds: no persistent error surface.

If stale contention remains after the bounded retry: show `SHARED STATE CHANGED` / refresh-and-review treatment. Do not imply data loss. Do not offer force overwrite.

### `REPLAY_ALTERED`

Integrity-protective block. Show `REQUEST CHANGED — NOT APPLIED` and require a fresh deliberate action from current state. This is stronger than ordinary transient failure, but still must not claim canonical local Save corruption.

### `UNAUTHORIZED`

Show `PRIVATE SESSION AUTHORITY REQUIRED` or the more specific existing account/device/session message. Point toward the existing Connected Account / Remote Joining path. Never create a second join flow.

### `QUOTA`

Show provider-limited/unavailable state. Local Career Mode remains usable. No billing, Blaze, Cloud Functions, paid upgrade or quota purchase is offered.

### `TRANSIENT`

Show `TEMPORARILY UNAVAILABLE` with bounded retry/refresh behavior. Do not loop automatically.

### `DENIED`

Show provider rejection using safe existing message semantics. No force bypass.

### `RECEIPT_EXPIRED`

The local conflict receipt is no longer usable. Ask the user to refresh current shared state and perform a fresh deliberate action. Do not imply the rivalry itself expired.

## 4. Authority invariants

The proposal must preserve the r15 runtime facts:

- Firebase transaction/CAS remains mutation authority;
- conflict receipts are `authoritative:false`;
- receipts do not mutate canonical local Save storage;
- no provider write is created by the receipt layer itself;
- no list permission is required;
- no billing is required;
- Private Remote Joining remains the exact two-manager session authority;
- no public discovery/community/rankings.

## 5. Screenshot impact

Add final review rows for only materially visible conflict outcomes, not every internal receipt classification.

Minimum final visual proof:

1. stale-after-bounded-retry / state-changed treatment;
2. replay-altered integrity block;
3. unauthorized/fresh-private-session-required treatment;
4. quota/provider-unavailable treatment;
5. receipt-expired/fresh-action treatment;
6. 390px representative of the longest message if geometry differs.

A single state review sheet can satisfy several rows if all states are independently readable at owner-review scale.

## 6. Reconciliation result

r15 is additive to the R8 state system and does not invalidate the route architecture or r14 Journey Reconnect design.

The visual proposal therefore adds one cross-product state contract and review sheet, then continues existing page-by-page closure.

Final-main reconciliation remains open because production may advance again before owner approval.
