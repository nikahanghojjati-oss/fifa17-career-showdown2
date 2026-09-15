# PR260 R11 Exact-Head Seal — 2026-09-15

Purpose: documentation-only seal for the final Continue reconciliation candidate. This file earns no product or milestone credit and exists only to create one immutable review/CI head.

## Product head immediately before this seal

`0df5e147795029157a155f99d381d3dea32b43d4`

Commit: `fix(pr260): reuse pair reconciliation on Continue R11`

## R11 blocker fixed

Fresh Codex review of the R10 seal found one remaining P1: canonical Continue could race or follow a transient failure of the automatic persistent-pair sidecar and then call `pair.initialize({force:true})` directly without the stale-role reconciliation callback. A browser with the opposite stale local Daniel/Nik role could therefore fall back into the mismatch guard even though its authenticated provider pair and local Save/Profile were valid.

R11 removes that bypass instead of adding a second reconciliation mechanism:

- canonical Continue awaits the existing `syncPersistentPairSidecar()` used by automatic identity synchronization;
- an already-running sidecar promise is reused rather than raced;
- the sidecar retains the provider-authoritative bounded stale-role reconciliation introduced in R10;
- when the first sidecar result is absent or `unavailable`, Continue retries that same reconciliation-capable sidecar once, covering a transient first provider read;
- canonical Continue no longer calls callback-free `pair.initialize()` directly.

## Focused proof completed before this seal

Workflow: `PR260 R11 Continue reconciliation`
Run: `35025197435`

Passed before publication:

- persistent Nik/Daniel pair contracts, including a permanent assertion that Continue reuses/retries the reconciliation-capable sidecar and does not directly call `pair.initialize()`;
- protected static release/startup budget: `162647 raw / 37468 gzip` under the unchanged `165000 / 37500` ceilings;
- release-shell coherence for `1.9.1-r20`;
- shared polished presentation contract;
- real Chromium persistent-pair routing audit covering CONNECT PLAYERS, CREATE CODE, JOIN, CONTINUE CAREER and OPEN RECOVERY.

The temporary R11 workflow and patch script removed themselves in the same publication commit and are absent from the product head.

The R10 Codex P1 thread was replied to with the proven R11 head and resolved after publication.

## Permanent constraints unchanged

- Daniel = Player One; Nik = Player Two.
- Pair authority remains private, account-owned and provider-authoritative.
- Firebase remains Spark-only; billing remains OFF.
- No Cloud Functions, Cloud Run, paid tier, public discovery/community/rankings or provider list expansion.
- Existing creator/redeemer atomic pair witnesses, exact Save/Profile recovery binding, Candidate C recovery, installed service-worker delivery and paired-first ordering remain unchanged.

## Merge gate

Do not merge based on R10 or earlier evidence. Require a fresh exact-head POS20 run and one fresh Codex review on the commit created by this R11 seal. If either finds a substantive blocker, fix it and create a new seal. If both are clean and `main` has not moved, merge PR #260 using the exact sealed head SHA, then verify the exact-main GitHub Pages deployment and Rules-only zero-billing Firestore deployment/readback before asking Nik and Daniel to perform physical two-device testing.
