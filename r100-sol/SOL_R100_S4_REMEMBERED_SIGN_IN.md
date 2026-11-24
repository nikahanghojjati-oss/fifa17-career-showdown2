# Sol 3.0.0 job S4: remembered sign-in and SIGN OUT (High)

Read `r100-sol/_HOUSE_RULES_R100.md` on this branch first. IDs: `S4-NN`.

## Pin
- **#1599** `claude-gameplay/r100-remember-sign-in` head `42c25d3bf18e69fd85ed011aa16806baec16aa3d` (base gameplay/r100 `2c7e89de`). Diff: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1599/files
- Files: `js/sparkConnectedAccount.js`, `js/productionFirebaseRuntime.js`, `js/onlinePlayerIdentity.js`, `js/sparkRemoteJoining.js`, `js/sparkStandardAuthPrivateSession.js`, guard files `CURRENT_PRODUCT_GUARDS.json`, `AGENTS.md`, and their contracts.

## What Nik decided (product truth, not a bug)
- The phone now REMEMBERS sign-in (Firebase's own IndexedDB persistence; local storage only on a browser without IndexedDB). Google popup only, no extra scopes, Firestore stays memory-only, the 4-hour play session is unchanged.
- A new SIGN OUT button in the Settings ACCOUNT box ends it on that device; all open tabs restart signed out on Home. Account deletion also ends it.
- Accepted risk: someone holding the unlocked device can play as that manager. iPhone Safari may forget the sign-in after about a week without use.

## Sharp questions
- Does SIGN OUT always end it: after SIGN OUT, does a reload, a killed tab, a browser restart, a second tab, or the service worker ever bring the old account back without a Google tap?
- SIGN OUT in the middle of a season, a Transfer War, a Prime Pack round or a pending tap (W3 tap memory, JOIN resend): can anything be sent AFTER sign-out under the old account, or under the new account if the other manager then signs in on the same device?
- Wrong manager on a shared device: Nik signs out, Daniel signs in on the same Chromebook. Can the page, the tap memory, the pair state or any cache still act as Nik, or show Nik's private values?
- Does remembering sign-in change any authority: the play session, pairing, JOIN, UNPAIR, the private session expiry? Can a remembered sign-in on an old device revive an expired or closed private session?
- If the remembered persistence cannot be set, does sign-in fail closed exactly as before (clear message, no silent fallback)?

## Already proven (challenge only with a concrete hole)
- Contract 6/6 (fails on base), browser audit 10/10 (reload, closed tab, restart stay signed in; after SIGN OUT all stay signed out; SIGN OUT restarts other tabs), full contracts 369/369, tabkill and coldoffline 21/21 signed in with 0 sign-in taps, CE2PG 3 seasons 2,918 vs base 2,939 billed reads, writes 206 = 206.
