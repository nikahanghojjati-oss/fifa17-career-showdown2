# PR #260 hardening checkpoint — 2026-09-14

This checkpoint anchors the fresh exact-head seal after the persistent Nik/Daniel pair blocker corrections. It is not itself a seal result and must not be used to claim CI, review, deployment, or merge readiness.

Implemented before this checkpoint:

- One-use pairing redemption and `accounts/{accountId}/pairLinks/current` now commit as one provider transaction on the persistent pair path.
- Generated Firestore Rules require every rivalry redemption to end with the authenticated account's canonical `pairLinks/current` witness for the exact rivalry and invite role, preventing a direct provider-call bypass.
- A stale registered tab cannot replace an active current pair with another rivalry; the transaction fails before consuming the new invite.
- Successful redemption has durable provider recovery authority before local Connected Rivalry pointer attachment becomes relevant.
- Old `Nik = playerOne / Daniel = playerTwo` saves fail closed instead of being relabelled over role-keyed history.
- `CONNECT PLAYERS` / `REVIEW CONNECTION` routes to the persistent Nik/Daniel pair controls rather than Settings or Save Library.
- `recovery-required` exposes `OPEN RECOVERY`, routed to the bounded Atomic Restore & Recovery surface.
- The selected 1/3/5/10 season count is preserved when the paired-first Showdown shell is created.
- The retired Stage 5E engineering overlay audit now targets the clean persistent-pair product surface instead of requiring `sparkRemoteJoiningOverlay` to be re-exposed.
- Provider emulator/contracts/browser regressions were extended for stale-tab double-active rejection, witness-less redemption denial, atomic post-redeem recovery, reversed-role rejection, connection routing, recovery action, and season-count preservation.

Required next gate:

1. Resolve the exact live head created by this checkpoint.
2. Run a completely fresh POS20 seal on that one SHA and do not combine evidence from earlier heads.
3. Request a fresh Codex review on the same final SHA and resolve every current finding.
4. Keep PR #260 draft until every exact-head family is green.
5. Merge only with the verified expected head SHA.
6. After merge, verify new `main`, GitHub Pages, generated/deployed Firestore Rules, provider emulator proof, and the permanent Spark-only / billing-OFF boundary.

No Cloud Functions, Cloud Run, Blaze, payment method, public discovery, community, or rankings are permitted.