# Owner Production Proof — Stage 4 Remote-to-Local Reconciliation — 2026-08-25 ET

Status: PRODUCTION-PROVEN on deployed `v1.8.1 / 1.8.1-r3`.

This record closes the bounded pre-Stage-5 remote-to-local reconciliation gate for the fresh current-identity Nik/Gop rivalry. It records owner-observed production behavior only. It does not expose full account IDs, device IDs, identity hashes, or the full active rivalry ID.

## Production context

- Player One / Nik: normal Chromebook Chrome.
- Player Two / Gop: Chromebook Chrome Incognito.
- Fresh current-identity rivalry recognition fingerprint: `pair_8f24ae...3528c`.
- Target local Save recognition fingerprint: `save_7fcdfedf...4c6ca`.
- Player Two remained selected for the reconciliation lane.
- Firebase remained Spark / zero billing, Firestore memory-only, Google Auth popup-only `browserSessionPersistence`, App Check enforcement OFF.
- Candidate C remained the sole destructive local Apply authority. Stage 5 session orchestration was not started.

## Proof sequence

### 1. Non-mutating Preview at remote revision 0

Player Two observed remote revision 0, generated `PREVIEW REMOTE → LOCAL`, and the UI explicitly reported that revision 0 was observed only and had not changed the local Save. The Preview was bound to the exact remote revision/content hash and exact Player Two local target. Confirmation remained unchecked and Apply remained disabled.

### 2. Deliberate stale Preview rejection

Player One refreshed the same rivalry at revision 0 and published exactly once, advancing the authoritative remote projection to revision 1 while the Player Two revision-0 Preview remained untouched.

Player Two then explicitly confirmed and exercised the old revision-0 `BACK UP + APPLY EXACT REVISION` intent exactly once. Production rejected it with the bounded result that the remote state had changed after Preview and reviewed revision 0 was not applied. `LOCAL COMMIT` remained not applied, the Player Two target remained unchanged, and no backup-completed message appeared. This matches the source ordering in which fresh remote verification precedes backup creation and Candidate C mutation.

### 3. Fresh revision-1 baseline and Preview

Player Two refreshed to authoritative revision 1 without local overwrite. The real pre-Apply local state contained exactly one Save (`TEWE`) and exactly two stable Local Profiles (`ghyu` and `GOP`), both linked to that Save. No unrelated second Save existed in the real owner state, so no artificial Save was manufactured for testing.

A fresh non-mutating Preview was prepared at revision 1 with exact gameplay content hash:

`sha256:22bc1bea2833533a978ddfb0a6092b8279d40109234606da762d14cc359ccf3d`

The Preview remained bound to Player Two and the same local target. Confirmation was still unchecked and Apply disabled until the owner explicitly confirmed the reviewed intent.

### 4. Verified backup-first Candidate C Apply

The owner checked the exact confirmation and pressed `BACK UP + APPLY EXACT REVISION` exactly once.

Production completed the local commit at revision 1 and reported that remote revision 1 was applied to the reviewed local Save only after a verified backup and exact Candidate C transaction.

Chrome download history showed the generated backup file `career-mode-showdown-backup-2026-08-26T00-24-06Z.json`. The owner supplied the actual downloaded JSON for verification. It identifies backup format version 2, app `1.8.1`, runtime `1.8.1-r3`, export time `2026-08-26T00:24:06.489Z`, one Save and two Local Profiles, with no warnings or recovery payload.

The downloaded envelope checksum is:

`c2d3a4054e6aad5ff007dbe6f04340d2bbfc641f4ce60f4b34e3a827b5f834e4`

The checksum was independently recalculated using the production backup canonicalization rule and matched the embedded checksum exactly.

### 5. Post-Apply convergence, identity preservation, and remote immutability

After the successful Candidate C Apply, Player Two refreshed shared state exactly once without publishing. Production still showed:

- the same fresh rivalry fingerprint;
- `REMOTE OBSERVED: Revision 1`;
- the same Player Two local target;
- `LOCAL COMMIT: Revision 1`.

The post-Apply Save Library still contained exactly one active `TEWE` Save. The post-Apply Manager Identities still showed the same two stable profiles, `ghyu` and `GOP`, each linked to the Save.

A final read-only Preview still showed remote revision 1 with the exact same content hash:

`sha256:22bc1bea2833533a978ddfb0a6092b8279d40109234606da762d14cc359ccf3d`

The UI explicitly reported that remote revision 1 already matched the identity-safe local gameplay candidate. This establishes exact local convergence while the unchanged remote revision/hash proves the local Candidate C Apply did not mutate remote authority.

## Gate result

The bounded Stage 4 owner reconciliation gate is PASS.

Production owner evidence now establishes all required characteristics:

1. Preview is non-mutating.
2. Preview is bound to exact remote revision/hash and exact local target.
3. A stale Preview is rejected rather than silently rebased.
4. Successful Apply requires explicit confirmation.
5. A verified canonical backup is created before destructive Apply.
6. Candidate C remains the sole destructive Apply authority.
7. Player Two manager/profile identity and the real Save Library structure remain stable.
8. The intended local target converges to the exact reviewed remote authority.
9. Local Apply does not mutate the authoritative remote revision/hash.
10. Observed remote state and committed local state remain visibly distinct.

The owner state had no unrelated second Save, so unrelated-Save preservation was not artificially re-proven in production; permanent Candidate C contracts remain the evidence for that mutation boundary.

## RJR accounting

The repaired r3 ordinary-owner Connected Account proof had already restored the two r2-invalidated credits from 76 back to 78. This reconciliation proof materially closes one previously explicit uncredited RJR-1 capability: production remote-to-local reconciliation. It therefore adds exactly +1 in the `devices-pairing-connected-rivalry-remote-join` domain, for a conservative evidence-backed score of `79/100`.

No duplicate credit is awarded for pairing, revision-0 publication, revision-1 publication, stale-base CAS rejection, two-physical-device coverage, backup architecture, CI, documentation, or owner screenshot count.

## Remaining boundary

Stage 5 is still not started in this proof. Remaining explicit pre-Stage-5 hardening should be addressed in the smallest capability-first order, with exact idempotency replay / revoked-device authorization / adverse-network-reconnect evidence prioritized before session orchestration unless a fresh successor's live assessment proves a narrower dependency order.
