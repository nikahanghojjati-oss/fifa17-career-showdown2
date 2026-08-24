# Production Proof — Stage 4 Connected Rivalry First Slice

Date: 2026-08-24 ET

## Exact production boundary

- Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
- Application/runtime: `v1.7.0 / 1.7.0-r2`
- Runtime release merge: `ce09cbef6030bcd1329121be556ba4da2fe20fd2` (PR #131)
- Live `main` immediately before the evidence branch: `6d1e5f55e666eebbf5a9527eb0db5e93f6e18d60`
- Immutable Stage 4 source seal: `7336adda832322bbd93e8c16f3de0e4bbf5273c1`
- Production-published Firestore Rules blob: `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`
- Firebase Spark / zero billing; App Check enforcement OFF

No screenshot, raw token, API key, site key or complete private rivalry capability is stored in the repository. Manager labels are recorded only to distinguish the witnessed browser roles; private rivalry identifiers remain redacted.

## Evidence sequence

### Ordinary Chrome / Chromebook rivalry

1. Read-only production diagnostics reported `status: ready`, `attempted: true`, `connected: true` and `tokenObserved: true` through the reCAPTCHA Enterprise provider. The same diagnostic preserved memory-only Firestore and popup-only `browserSessionPersistence`; no raw token was returned or recorded.
2. The existing Connected Account and registered-device/private-pairing state remained intact. No setup was repeated.
3. Player Two / Lil verified the existing private rivalry, refreshed a clean unpublished base and published the first authoritative gameplay projection at revision 0. The UI reported that the local Save Library remained unchanged.
4. A distinct incognito Player One / Tyuu binding refreshed the same private rivalry and observed revision 0. The UI reported that no local save was overwritten.

### Installed-app/Safari iPhone rivalry

The owner explicitly reported using the installed Career Mode app and Safari on one physical iPhone. This was a second independent private rivalry and is not conflated with the Chromebook rivalry.

1. Player Two / Gop refreshed an unpublished base and published authoritative revision 0. The UI reported that the local Save Library remained unchanged.
2. Player One / Nik attempted to publish from an unrefreshed base. Production rejected the stale write, instructed a refresh and reported that local saves were not changed. This proves no silent rebase and no last-writer-wins fallback.
3. Player One / Nik refreshed safely to authoritative revision 0 with no local overwrite.
4. Player One / Nik published exactly once from that observed base. Production advanced monotonically to revision 1 and reported that the local Save Library remained unchanged.
5. Player Two / Gop refreshed the same rivalry and observed authoritative revision 1 with no local overwrite.

## Capability classification

Production-proven in this first Stage 4 slice:

- ordinary-browser App Check ready/connected/token-observed;
- exact private-rivalry attachment for both entitled manager bindings;
- initial authoritative revision-0 publication;
- cross-manager authoritative read without local Apply;
- live stale-base rejection without silent rebase or local overwrite;
- safe refresh recovery after the conflict;
- monotonic compare-and-swap advancement to revision 1;
- cross-manager convergence on revision 1;
- bounded owner-reported installed-app/Safari behavior on one physical iPhone.

Not yet production-proven or authorized:

- exact idempotency replay and same-key/different-request conflict;
- third-account and revoked-device production negatives;
- two-physical-device/two-network, adverse-network, token-expiry and sleep/wake hardening;
- remote-to-local reconciliation or any automatic remote overwrite;
- Stage 5 Remote Joining sessions.

## RJR-1 reconciliation

The fixed readiness ledger moves only on genuine capability evidence:

- `69 -> 72`: entitled attach, revision-0 publication and cross-manager revision-0 read;
- `72 -> 74`: stale-base rejection and bounded iPhone cross-surface hardening;
- `74 -> 77`: stale recovery, monotonic revision-1 publication and cross-manager revision-1 convergence.

Current Remote Joining readiness: `77/100`. No points are awarded for screenshots themselves, documentation, branch commits, CI, WEC/SLE packaging or repeated proof of an already-credited capability.

## Next safe boundary

Stage 4 remains open. Before authoritative remote bytes may affect canonical local saves, implement and review one explicit remote-to-local reconciliation contract under Candidate C authority: non-mutating preview by default, exact target identity, immutable observed remote revision/hash, explicit confirmation, backup-before-Apply, transaction-owned mutation, stale-state and anti-clobber guards, ownership-scoped rollback, exact recovery verification, and unmistakable observed-remote versus committed-local UI. Stage 5 remains locked until that boundary and remaining Stage 4 hardening are production-proven.
