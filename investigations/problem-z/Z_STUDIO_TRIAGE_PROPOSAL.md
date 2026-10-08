# Problem Z — Critical two-manager access and continuity investigation
**Date:** 2026-10-08  
**Status:** INVESTIGATION / PROPOSAL ONLY — awaiting Team G Lead (Claude Opus 5.5) triage and approval  
**Branch:** `investigation/problem-z-z-studio-2026-10-08` (branched from live `main` at `bc77a0b934c3d43279f27f73a72db21c2db2b4f2`)  
**Severity recommendation:** P0 gameplay-blocking incident (priority to be confirmed by lead)  
**Scope:** Read-only source review and owner-supplied physical-playtest evidence. No live reproduction, deployment, schema mutation, production fix, gameplay implementation or approval was performed.

## Owner-reported evidence (physical playtest, Nik and Daniel, 2026-10-07)

1. **Run 1 — Transfer War Room:** Daniel's tablet could not display the necessary cards/boxes correctly; attempts to advance produced an error, and refresh lost continuity. The accompanying transfer photo reads: "Shared Transfer Challenge league action failed. Complete signing 1 with player name, previous league and nationality." The message is consistent with a signing-field validation error; it **does not prove** the responsive layout caused that validation error. Both must be examined.
2. **Run 2 — after league/club draw:** Continue Career led to a disconnect/restart, requiring a new pairing/session and repeated setup.
3. **Run 3 — Problem Z escalation:** Home stopped displaying the sign-in entry, with only "Season 1/1" visible. On one device the sign-in panel stayed at "CONNECTING / Opening Google sign-in…"; attempts in other accounts, browsers and devices did not restore usable account-to-game identity. Signing in through Settings did not make Career Start recognize that manager.
4. **UI divergence:** A wide screen showed a tiny left-side "DEVICE / OFFLINE APP" panel and legacy text on the game background despite that content no longer belonging to the intended public-facing online UI. Treat as possible incomplete UI containment, mixed runtime versions or a load failure, not as definitive proof of a service-worker bug.

**Impact:** The private two-person game cannot reliably move from Google login to known manager/device, existing rivalry, exact ACTIVE private session and resumed canonical gameplay. Repeated starts risk confusing a current local Showdown with the authoritative remote Showdown. **Do not ask users to delete saves, clear site data, revoke devices, repeatedly switch Google accounts or abandon the existing Showdown as a diagnostic shortcut.**

## Code-grounded observations (all from main at the branch base)

### A. Sign-in path has multiple async boundaries and weak terminal-state signaling

- `js/onlinePlayerIdentity.js`: `signInOnlineIdentity()` first awaits `resolveOnlineDependencies()`, then awaits `account.signIn()`, then calls `initializeOnlineIdentity(true)`. While pending it shows "Opening Google sign-in…". No explicit bounded timeout or user-facing recovery action for an indefinitely pending popup is evident in this path.
- `js/sparkConnectedAccount.js`: `sparkConnectedSignIn()` calls `await sparkConnectedInitialize()` **before** `authSdk.signInWithPopup()`. `sparkConnectedInitialize()` itself awaits Firebase service resolution, session persistence and loading bootstrap. Some mobile popup/browser contexts may lose the user gesture during asynchronous setup. This is a **testable possibility**, not a confirmed browser diagnosis.
- `sparkConnectedSignIn()` typically *returns* a state such as `sign-in-failed`, `bootstrap-error` or `account-unavailable` rather than throwing; the caller in `onlinePlayerIdentity.js` does not inspect that returned state before reinitializing. `resolveSignedInOnlineIdentity()` then treats any account that is not `connected` as effectively signed out. The UI can therefore conflate failed authentication, incomplete private-account setup, device-registration failure and signed-out status.
- `js/sparkConnectedAccount.js` deliberately uses `browserSessionPersistence`; durable automatic sign-in across separate browser sessions is **not** part of the present security contract. Preserving this policy is mandatory unless Team G Lead separately authorizes and security-reviews a change.

### B. Missing Home sign-in is a meaningful load/lifecycle symptom

- `index.html` contains `#topHeader` and `#seasonIndicator`, but no static Google sign-in control.
- `js/onlinePlayerIdentity.js` creates `#onlinePlayerIdentityBadge` dynamically via `ensureOnlineIdentityBadge()` and inserts it adjacent to `#seasonIndicator`. If the identity module is delayed, fails to load, throws, or never mounts its UI, the header may show only the season indicator.
- `js/showdown.js` dynamically loads and initializes the online identity module during entry/bootstrap; failures are reported through an error boundary, not necessarily represented by a durable sign-in CTA.
- `js/menuExperience.js` can render season/save metadata independently of successful connected-account identity. Thus "Season 1/1" is not proof that authentication, pairing or remote session authority is healthy.

### C. Legacy Settings panel should be hidden in the intended online surface

- `js/settings.js` still intentionally constructs a `DEVICE / OFFLINE APP` panel.
- `js/onlinePlayerIdentity.js` injects `#onlineInternalSurfaceContainment` CSS using `display:none!important` specifically for `#settingsContent .settingsOfflinePanel` and other internal panels; `hideOnlineInternalPanels()` additionally hides them.
- Seeing the panel suggests checking whether online identity initialization, injected CSS, dynamic script loading, service-worker revision and Settings mutation-observer re-render actually completed on the affected device. It **does not** establish that legacy code was deployed by mistake.
- `service-worker.js` deliberately maintains current and previous runtime caches; `index.html` declares revision `1.9.1-r62`. Verify live device shell/script revisions against the actual deployed version rather than assuming all devices received the same assets.

### D. Continue Career has overlapping local and connected routing responsibilities

- `js/screens.js` binds `#continueCareer` to `resumeSavedShowdown()`, which uses local saved-game canonical routes.
- `js/onlinePlayerIdentity.js` uses a capture-phase click handler to route ready online managers via `openCanonicalCareerContinue()`, which delegates to `persistentNikDanielPair.continuePair()` when an active rivalry exists.
- `js/productionSharedJourneyEntry.js` also restores gameplay depending on persisted Shared Journey marker, remote ACTIVE session, confirmed setup and accepted season. The multiple layers need an explicit authority/resume invariant for reload, cross-device delays, stale local shells, and errors. This note **does not assert** that duplicate handlers caused the playtest reset.

### E. Tablet Transfer War Room should be audited separately

- `css/v10Transfer.css` contains narrow portrait-specific responsive overrides (including a `max-width:760px` + portrait condition), while the observed tablet appears landscape; inspect relevant Team V and production transfer CSS at the actual viewport and zoom.
- `js/productionSharedTransferChallenge.js` validates required signing fields and surfaces `TRANSFER_SIGNINGS_INVALID` ("player name, previous league and nationality"). Determine whether clipping obscures a required input or CTA, whether the selector's canonical ID was stored, and whether a provider rejection was accurately rendered.
- Resume after reload must not silently skip either manager's canonical full-screen experience (see `00_SHARED_SHOWDOWN_DUAL_FULL_SCREEN_RULE.md`).

## Ranked diagnostic hypotheses (not fixes)

1. **H1 — Popup/async gesture or Firebase initialization stalls:** lazy-loading Firebase and private-account dependencies before calling `signInWithPopup` interferes with popup launch/return on specific browser/device combinations. Capture browser popup outcomes and auth state transitions before changing flow.
2. **H2 — Diverged identity state machine:** Firebase `currentUser`, Connected Account `connected`, registered device, locally chosen Daniel/Nik role, and Home identity state disagree; unsuccessful `signIn()` return value is not handled explicitly, causing misleading sign-in state and disabled start.
3. **H3 — UI/bootstrap/cache version incoherence:** dynamic online identity module or its containment style fails in some contexts; header badge absent, older Settings panel appears, cached shell/runtime differs or a script load times out. Correlate revisions without destructive cache wipes.
4. **H4 — Resume authority mismatch after error/reload:** local save / pending Shared Journey / pair / remote session are individually valid but not from the same account-device-rivalry context, or handler order routes to local setup rather than the active connected game.
5. **H5 — Transfer responsive/validation combined:** in tablet landscape, required signing inputs and action buttons are clipped, while the backend refuses partially filled or missing canonical selector IDs.

## Proposed Z Studio charter — **requires Team G Lead approval**

**Purpose:** A temporary, tightly scoped cross-cutting recovery effort to eliminate the entire *sign-in → recognized manager/device → exact existing pair/session → canonical resume* failure chain. Do not turn Z Studio into an unapproved gameplay redesign.

**Decision owner:** Team G Lead (Claude Opus 5.5) alone chooses whether to establish Z Studio, confirms priority, approves scope, appoints workers, allocates implementation branches and determines release/merge order. This investigation branch and issue are a proposal only.

**Suggested workstreams (not assignments):**
1. Authentication lifecycle: reproduce popup, Firebase initialization and auth→Connected Account reconciliation; instrument safe state transitions and explicit failures.
2. Device/identity/pairing continuity: verify UID/device/role binding, existing rivalry lookup, reconnect and account mismatch recovery without compromising private authority.
3. UI/runtime coherence: ensure Home always provides an actionable, accessible sign-in/retry state; resolve unintended Settings surfacing; audit service-worker version compatibility and loading failures.
4. Canonical recovery: design idempotent Continue Career that never silently starts a new Showdown, loses the correct pair, or skips a required screen on one device.
5. Tablet transfer: reproduce relevant portrait/landscape viewports, validate every required signing/guess control, scrolling, keyboard, safe-area and error focus; preserve full-screen stage requirements.
6. Evidence and release assurance: add deterministic contract/browser regression coverage plus one real two-manager physical acceptance run after lead-approved implementation.

## Lead decisions requested

- Confirm P0 incident classification and whether normal feature work/SSJR acceptance should pause until this blocker is isolated.
- Authorize or reject the proposed Z Studio effort; assign workers and select exact code ownership and branch strategy.
- Choose the minimum diagnostic/observability surface and what privacy-safe states can be emitted; never collect raw auth tokens, invite codes, private IDs, account emails, or complete saves.
- Decide if initial isolation uses a dedicated auth harness and non-deployed candidate builds before any branch implementation.
- Confirm *no automatic persistence policy change*; any move away from `browserSessionPersistence` requires a separately reviewed security decision.
- Specify first verification gate, reviewer(s), and exact protected publication conditions. No automatic merge/deploy.

## Suggested verification plan after approval

**Phase 0 — Freeze and baseline.** Snapshot main, exact production runtime and affected browser environments. Record harmless non-secret markers: runtime revision, sign-in terminal status, registered-device yes/no, pair/session state category, active screen, connectivity state and safe worker cache revision. No tokens, provider payloads, UIDs or raw invite codes.

**Phase 1 — Reproduction matrix.** Existing Daniel/Nik accounts on two *authorized* physical devices; iOS Safari, Chrome/Android or Android tablet, and the affected tablet's actual browser; portrait/landscape and refresh; popup blocked/cancelled/closed; network offline/return; cold/warm service worker; repeated login; no new Google account should be necessary for a healthy flow.

**Phase 2 — Deterministic failure gates.** Every sign-in attempt reaches a bounded success/error/retry state; no spinner forever. Distinguish signed-out / authenticated-but-bootstrap-failed / device-unavailable / role-selection-required / ready. A signed-in account that is not authorized/registered must never silently enter gameplay.

**Phase 3 — Shared resume/UX gates.** Return to the *same* saved Showdown and exact account-device-rivalry context after a reload or network interruption; preserve local saves; do not restart setup or require new pairing when current authority is valid. Inconsistent authority fails closed with a safe, specific recovery path. Both players still witness every canonical screen.

**Phase 4 — Transfer gates.** On tablet landscape and phone portrait, signing cards, names, previous league, nationality and action CTA all remain visible/scroll-accessible with keyboard open and browser chrome showing; provider error points at the missing field; no accidental reset; successful submission advances exactly once.

**Phase 5 — Owner acceptance and independent review.** Existing browser/contract tests plus POS10-selected/expanded POS20 proof, GitHub checks, security review and a legitimate two-device physical journey. No synthetic or CI evidence can substitute for SSJR physical proof. Team G Lead exclusively authorizes PR, merge and production release.

## Existing tests to extend (do not treat as proof of bug absence)

- `tests/browser/connected-account-settings-audit.cjs`
- `tests/browser/settings-layout-audit.cjs`
- `tests/browser/settings-offline-save-library-editor-audit.cjs`
- `tests/browser/shared-journey-reconnect-audit.cjs`
- `tests/browser/shared-transfer-challenge-replay-audit.cjs`
- `tests/browser/two-manager-browser-journey.cjs`
- `tests/contracts/private-account-auth-stage2i-contracts.cjs`
- `tests/contracts/shared-journey-reload-resume-contracts.cjs`
- `tests/contracts/shared-transfer-challenge-provider-contracts.cjs`

## Non-negotiable product and governance boundaries

- **Exactly two private managers**; no public discovery, public lobby or third user.
- **Firebase Spark / permanent zero billing**; no Blaze, billable cloud services or Cloud Functions.
- **Google popup-only** with `browserSessionPersistence` and no additional Google scopes unless a separately authorized, reviewed security change.
- **Firestore browser memory-only**; device and Firebase UID are authority, not a displayed name.
- **Candidate C is the sole destructive remote-to-local Apply path** with a backup-first exact rollback; no recovery shortcuts that overwrite an existing local save.
- No destructive account/logout/delete/reset/clear-storage experiments against production accounts for this investigation.
- POS20 is the active process authority, POS10 remains the minimum proof safety kernel. No SSJR/MDP credit from this investigation.

## Evidence gaps / next investigation questions

1. What exact URL and runtime revision did *each device* display at failure time? Was one in an installed PWA/saved offline context?
2. On affected device, did a Google popup actually open? Did the app show a Firebase error, a pending popup, or an account bootstrap failure? Capture only non-secret error **codes**.
3. Which device/browser/viewport and zoom for the Transfer War Room? Was the "signing 1" name, league or nationality accessible, selected with a canonical ID, and saved when the error appeared?
4. Immediately after Continue Career/reload, did both devices refer to the same current private rivalry and valid ACTIVE session? Was the locally saved Showdown still present?
5. Was the legacy Offline App panel inside Settings or unexpectedly protruding into Home? Does the DOM contain the online identity badge and `#onlineInternalSurfaceContainment` rule?
6. Did an existing browser account succeed before the repeated retries? Multiple Google accounts must not be used as a substitute for correct authorized Nik/Daniel identity.

**Current assessment:** High confidence that the identified code contains several distinct failure and recovery boundaries worth testing; **low confidence in any single root cause** until physical reproduction and safe diagnostics are captured. No repairs, tests, provider state reads, owner approvals or production changes are claimed here.
