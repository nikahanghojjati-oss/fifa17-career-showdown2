# Career Mode Showdown v1.8.1-r1 Maintenance Handoff

Status: RELEASE CANDIDATE / PAIRING IDENTITY UX HARDENING / NOT PRODUCTION-PROVEN
Application version: `v1.8.1`
Runtime revision: `1.8.1-r1`
Previous known-good whole shell: `1.8.0-r1`
Branch: `agent/v181-pairing-ux-hardening`
Remote Joining readiness: `78/100` under fixed model `RJR-1`

## Purpose and defect

Real Chromebook/iPhone evidence showed the top private-pairing selector visually returning from Player Two to Player One after operations. `renderPanel()` rebuilt option values as indexes and never restored the chosen identity. The same sequence showed Firestore's raw permission-denied text when a consumed, expired or unreadable one-use capability was attempted.

## Candidate authority

`js/sparkPrivatePairing.js` now derives one stable selector key from manager role, `profileId` and `saveId`. It stores that key before asynchronous create/join work and restores the exact option on every rerender. A selector-only change updates in-memory state without rebuilding the form, so pasted capability text is retained. Sign-out/account-switch boundaries clear the selection and ephemeral capability state.

Denied and capability-opaque redemption outcomes are mapped to one non-enumerating explanation: the code may be expired, used or unavailable to the account, with instructions to create a fresh code or use Connected Rivalry if already paired. Slot mismatch and other safe local guidance remain specific. Raw `Missing or insufficient permissions` is never shown by this path.

## Locked safety boundary

No Firestore Rules, provider, billing, App Check enforcement, auth persistence, connected-rivalry protocol or canonical browser-storage behavior changes. The Installable Offline App and local Career Mode remain independent of Firebase.

Candidate C remains the sole destructive reconciliation authority. It retains immutable confirmed intent, verified backup before mutation, strict exact raw snapshot guards, transaction-owned mutation, stale-state and anti-clobber rejection, ownership-scoped reverse rollback and exact recovery verification. Exactly two private managers, no public discovery and the Stage 5 lock remain mandatory.

## Evidence and promotion

Permanent Node contracts prove stable identity keys and safe error mapping. The rendered mobile-browser audit proves a pasted code survives manager selection, Player Two survives successful create rerenders, and Player Two plus safe guidance survive a simulated Firestore permission denial.

Require complete exact-head local validation, all permanent PR workflow families, clean reviews/threads/mergeability, expected-head merge and deployed verification under standing owner authorization. Do not republish unchanged Rules blob `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`. Recover the whole shell to `1.8.0-r1` if promotion fails; never construct a mixed-version rollback.
