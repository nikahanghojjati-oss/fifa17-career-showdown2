# Production Proof — Two Physical Devices / Connected Rivalry Hardening

Date: 2026-08-24 ET

## Boundary

- public application/runtime: `v1.8.0 / 1.8.0-r1`;
- devices: one owner-controlled Chromebook and one owner-controlled iPhone Safari surface;
- managers: Player One / Nik and Player Two / Gop on distinct authenticated account/profile/save identities;
- Firebase Spark / zero billing; App Check enforcement OFF;
- no raw token, complete private capability, API key or site key is stored here.

This is new physical-device evidence, not a reinterpretation of the earlier normal/incognito or installed-app/Safari-on-one-phone proofs.

## Witnessed sequence

1. The Chromebook, on Player One / Nik, created a fresh 15-minute one-use private pairing capability.
2. The iPhone, on Player Two / Gop, redeemed that fresh capability successfully. Both devices showed the same redacted Connected Rivalry fingerprint and retained their exact local target identities.
3. Both devices refreshed an unpublished shared-state base without local Apply or a reported local-save overwrite.
4. The Chromebook published authoritative revision 0. The iPhone refreshed and observed revision 0.
5. The iPhone published revision 1.
6. The Chromebook attempted a write from its stale revision-0 base. Production rejected it, instructed refresh and reported that local saves were not changed.
7. The Chromebook refreshed and converged on authoritative revision 1. Neither surface reported a local commit or overwrite.

The sequence also exposed—but did not invalidate the protocol—the selector UX defect fixed by the separate v1.8.1 candidate: operation rerenders visually defaulted the top pairing selector to the first manager option even though the Connected Rivalry local target remained exact.

## Capability classification

Newly proven:

- fresh private capability creation/redemption across two physical devices;
- Connected Rivalry revision publication, stale rejection and convergence across those physical devices;
- preservation of each exact local Save target with no local Apply during the proof.

Still incomplete:

- exact idempotency replay in production;
- third-account and revoked-device production negatives;
- two-network, adverse-network, token-expiry and sleep/wake hardening;
- owner-controlled remote-to-local Candidate C Apply evidence;
- final stable Remote Joining release acceptance and actual Stage 5 sessions.

## RJR-1 reconciliation

The fixed real-device-hardening domain moves from 4/10 to 5/10, and total readiness moves from `77/100` to `78/100`. The +1 is deliberately limited to the newly proven two-physical-device boundary. Screenshots, documentation, code, tests, PRs, CI, merge and deployment receive no readiness credit.
