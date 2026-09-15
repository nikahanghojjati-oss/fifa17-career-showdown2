# PR260 R10 Exact-Head Seal — 2026-09-15

Purpose: documentation-only seal for the final stale-role reconciliation candidate. This file earns no product or milestone credit and exists only to create one immutable review/CI head.

## Product head immediately before this seal

`52eccc1c916f0efced81759993084f4efa6e3787`

Commit: `fix(pr260): reconcile stale browser role from pair authority R10`

## R10 blocker fixed

A registered browser could retain the opposite local Daniel/Nik role after another browser established the account's durable ACTIVE pair. The previous ordering allowed `pair.initialize()` to reject the local/provider role mismatch before the online identity sidecar's provider-driven role repair could execute.

R10 keeps durable provider authority first and preserves the fail-closed mismatch guard:

- `pairInitialize()` reads and validates the durable account pair/rivalry identity first.
- Only when the validated durable manager differs from local browser identity may a caller-supplied `reconcileIdentity` callback run.
- The online identity sidecar uses that bounded callback to persist the canonical Daniel/Nik role to IndexedDB and update live identity state.
- The existing mismatch guard then runs again against the reconciled live state.
- Callers that do not supply the reconciliation callback retain the original fail-closed mismatch behavior.

## Focused proof already completed before this seal

Workflow: `PR260 R10 stale role reconcile`
Run: `34922295841`

Passed before publication:

- persistent Nik/Daniel pair contracts
- protected static startup/release budget
- release-shell coherence
- shared polished presentation contract
- real Chromium persistent-pair routing audit
- explicit stale-role regression: Nik's provider-linked ACTIVE pair repairs a stale local Daniel role before mismatch rejection and reaches canonical `playerTwo / nik` paired state

The temporary R10 workflow and patch script removed themselves in the same publication commit and are absent from this sealed tree.

## Merge gate

Do not merge based on any earlier R8/R9 evidence. Require fresh exact-head POS20 and a fresh Codex review on the commit created by this seal. If either produces a substantive blocker, fix it and create a new seal. If both are clean and main has not moved, merge PR #260 using the exact sealed head SHA, then verify the main-push GitHub Pages deployment and the Rules-only zero-billing Firestore deployment/readback before asking Nik and Daniel to perform physical two-device testing.
