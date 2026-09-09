# Career Mode Showdown v1.9.1-r8 Shared Transfer Challenge

Status: RELEASE CANDIDATE
Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r8`
Previous known-good runtime: `1.9.1-r7`
Remote Joining readiness: `100/100` under frozen model `RJR-1`
Shared Showdown Journey readiness: `0/100` under fixed model `SSJR-1.1`

## Purpose

r8 advances the actual Shared Showdown Journey beyond authoritative Shared Career Start. It adds the Shared Transfer Challenge for each season while preserving the existing FIFA-style Transfer Challenge screen and FIFA 17 league/nationality selectors.

After both managers reach `SHOWDOWN_CONFIRMED · REV 6` and `CAREER_START_READY · REV 2`, the exact two bound managers can enter one shared Transfer Challenge for the current season. The provider, not either browser's local Save Library, owns the shared challenge state.

## Shared Transfer Challenge authority

The coordinator starts one server-authoritative 15-minute transfer window. Either manager may request an early close, but early close occurs only after both distinct roles request it. Natural expiry is accepted only at or after the exact server-derived deadline.

After the window closes, each manager privately records up to three guesses against the rival. Guesses are role-owned and cannot be read by the opponent before completion. After both managers lock guesses, each privately records up to three completed FIFA 17 signings with canonical previous-league and nationality IDs.

The public challenge ledger contains phase, revision, lock state, operation history and timing only. Guess and signing payloads live in role-private documents. Firestore Rules atomically bind each private lock payload to its matching public transition with `getAfter()`. The opponent role document becomes readable only when the public challenge reaches `COMPLETED`.

Both managers then derive identical release verdicts. A signing is marked for release when at least one opponent guess matches its previous league or nationality.

Every provider read or mutation rechecks the signed-in account, active registered device, exact two-manager rivalry, exact ACTIVE private session, confirmed Shared Setup and ready Shared Career Start. CAS, idempotency and terminal-state checks fail closed.

## Player-facing journey

The ordinary Showdown Home season action now routes a shared Showdown into the existing Transfer Challenge screen under shared provider authority.

The screen preserves the familiar four-step presentation:

1. Transfer Window;
2. Guess Entry;
3. Signing Entry;
4. Transfer Verdicts.

During Guess Entry and Signing Entry, each browser shows only that manager's legitimate editable card. Rival inputs remain hidden until completion. The existing FIFA 17 selector UX remains the canonical entry surface.

The shared adapter owns the existing controls in the capture phase so local-only Transfer Challenge handlers cannot mutate shared authority. It performs no `localStorage`, `sessionStorage`, or canonical Save Library mutation.

Shared Season Results is not part of r8. After the shared Transfer Challenge completes, the verdicts are visible to both managers, but the UI deliberately does not fall through into local-only Season Results authority.

## Whole-shell boundary

Executable browser behavior changed, so r8 is a new whole-shell identity. The Service Worker current runtime is `1.9.1-r8`; coherent `1.9.1-r7` remains the immediate previous known-good recovery target.

The r8 shell includes `sharedTransferChallenge.js`, `sparkSharedTransferChallenge.js`, and `productionSharedTransferChallenge.js` in addition to the existing Shared Setup and Shared Career Start runtime.

HTML asset revision, direct asset query strings, manifest icon revisions, lazy runtime loading and Service Worker cache identity must all converge on `1.9.1-r8`. Never certify a mixed r7/r8 shell.

## Firestore and zero-billing boundary

The deterministic additive production Rules build composes exactly three reviewed Shared Journey fragments onto the unchanged Spark base: Shared Setup, Career Start and Transfer Challenge.

Firebase remains Spark and billing remains permanently OFF. No Blaze, Cloud Billing linkage, payment method, purchased credits, Cloud Run or Cloud Functions are permitted. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

Exactly two private managers remain required. No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboard is introduced.

Canonical local gameplay storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`. Shared Transfer Challenge authority does not mutate those stores.

## Product-credit truth

This implementation, its CI, review, Rules publication, merge and deployment earn zero SSJR credit by themselves. SSJR-1.1 remains `0/100` until genuine two-account production evidence satisfies the fixed acceptance model.

Once coherent r8 production is independently proven, the next product capability is Shared Season Results. It must preserve the exact two-manager shared authority rather than reuse local-only season mutation paths.
