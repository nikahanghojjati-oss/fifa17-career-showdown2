# Career Mode Showdown v1.8.1-r1 Maintenance Handoff

Status: RELEASED / PRODUCTION DEPLOYED / 89 RUNTIME FILES BYTE-PROVEN / OWNER UX REGRESSION CHECK PENDING
Application version: `v1.8.1`
Runtime revision: `1.8.1-r1`
Previous known-good whole shell: `1.8.0-r1`
Release PR / merge: `#138` / `ca0cb6ce8628c5f993669c08ff33e8f64c634870`
Final PR head/tree: `e3a053bc6cca4aec5f82f3d25536c5eb1ae48e26` / `a86d8de18b9df768c782cc0a4338a9123fc05860`
Pages run: `32793956319`
Remote Joining readiness: `78/100` under fixed model `RJR-1`

## Purpose and defect

Real Chromebook/iPhone evidence showed the top private-pairing selector visually returning from Player Two to Player One after operations. `renderPanel()` rebuilt option values as indexes and never restored the chosen identity. The same sequence showed Firestore's raw permission-denied text when a consumed, expired or unreadable one-use capability was attempted.

## Production authority

`js/sparkPrivatePairing.js` now derives one stable selector key from manager role, `profileId` and `saveId`. It stores that key before asynchronous create/join work and restores the exact option on every rerender. A selector-only change updates in-memory state without rebuilding the form, so pasted capability text is retained. Sign-out/account-switch boundaries clear the selection and ephemeral capability state.

Denied and capability-opaque redemption outcomes are mapped to one non-enumerating explanation: the code may be expired, used or unavailable to the account, with instructions to create a fresh code or use Connected Rivalry if already paired. Slot mismatch and other safe local guidance remain specific. Raw `Missing or insufficient permissions` is never shown by this path.

## Locked safety boundary

No Firestore Rules, provider, billing, App Check enforcement, auth persistence, connected-rivalry protocol or canonical browser-storage behavior changes. The Installable Offline App and local Career Mode remain independent of Firebase.

Candidate C remains the sole destructive reconciliation authority. It retains immutable confirmed intent, verified backup before mutation, strict exact raw snapshot guards, transaction-owned mutation, stale-state and anti-clobber rejection, ownership-scoped reverse rollback and exact recovery verification. Exactly two private managers, no public discovery and the Stage 5 lock remain mandatory.

## Evidence and production acceptance

Permanent Node contracts prove stable identity keys and safe error mapping. The rendered mobile-browser audit proves a pasted code survives manager selection, Player Two survives successful create rerenders, and Player Two plus safe guidance survive a simulated Firestore permission denial.

The final exact head passed the complete contract and rendered-browser gates plus all 14 permanent PR workflow families. The sole review issue was corrected and resolved, expected-head merge completed, Pages succeeded and two independent verifiers proved all 89 public runtime files match `1.8.1-r1` byte-for-byte. Stability contracts, Chromium, deployed bytes and runtime provenance passed; the only post-merge failure was the known headless reCAPTCHA Enterprise `403 initial-throttle`. Do not retry it or mutate provider/App Check/Rules state.

The remaining production acceptance action is exactly one non-mutating syntactically valid but practically nonexistent-code submission with Player Two / Gop selected. The unavailable/opaque-code rerender must preserve Player Two and show privacy-safe fresh-code guidance without local Save, Connected Rivalry or authoritative gameplay mutation. Record the result and keep RJR at 78. Use `1.8.0-r1` only as the previous whole-shell recovery reference for a concrete runtime regression; never construct a mixed-version rollback.
