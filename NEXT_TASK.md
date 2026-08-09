# NEXT TASK

## Current gate: v0.95.0-r12 — v1.0 release stabilization candidate

Owner/browser accepted baseline:

- Workstream 1B / `0.95.0-r4` — FIFA-era presentation, procedural club identities and two-pack reveal;
- Workstream 2 / `0.95.0-r5` — phased Transfer Challenge and canonical FIFA 17 transfer metadata/selectors;
- Workstream 3 / `0.95.0-r6` — Settings and persistent motion accessibility;
- Workstream 4 / `0.95.0-r8` — Career Statistics / Trophy Room / Rivalry Statistics after Home-bootstrap stabilization;
- Workstream 5 / `0.95.0-r9` — Season pre-commit Review / Edit / Confirm & Save flow;
- stabilization / `0.95.0-r10` — explicit League Wheel Continue checkpoint and refresh/resume protection.

**Application version:** v0.95.0

**Asset revision:** `0.95.0-r12`

**Current activity:** final release stabilization after the r11 end-to-end browser audit

**Source status:** fixes implemented; all local deterministic, full-DOM and real-Chromium release validation passed; deployment and owner Chrome/Chromebook acceptance pending

**Owner acceptance:** pending

Do not declare v1.0 until the r12 browser checklist below passes. If it passes, move directly to the v1.0 Complete Release Candidate / Final Release without creating another feature roadmap.

---

# r11 browser-audit result

The r11 presentation work itself passed cloud-browser checks at 1363 × 936:

- forward/back route direction, bounded cleanup and destination focus;
- rapid route replacement leaving one legal visible screen;
- persisted Menu Click Feedback preference;
- Reduce Motion removing route theatrics without delaying navigation;
- Home media remaining lazy and suppressing competing micro feedback while playing;
- explicit League Wheel Continue and refresh/Continue Career recovery;
- permanent two-pack club reveal and Rivalry Confirmation;
- Transfer timer resume, Guess Entry, Signing Entry, draft recovery and canonical verdicts;
- max-11 scoring, Season Review, final save, completed hub, Legacy and analytics.

The same full flow exposed one release-blocking integration regression and two smaller shell-polish defects. r12 corrects them before the v1.0 conversion.

---

# r12 stabilization fixes

## Season Review Edit routing

### Reported runtime behavior

From Season Review, pressing **EDIT RESULTS** returned to Showdown Home instead of reopening the populated Season Results form.

### Root cause

`js/seasonEngine.js` created the Edit control with the router-reserved `.backButton` class. `js/screens.js` intentionally intercepts every ordinary `.backButton` at document capture phase, so Smart Back stopped the Season engine's own Edit handler before it could run.

### Corrected contract

- Edit Results uses the visually equivalent non-routing `.compactButton` class;
- centralized Smart Back remains unchanged and authoritative;
- Edit stays inside Season Results;
- all entered values and checked achievements remain intact;
- the previous in-memory review snapshot is invalidated;
- a fresh Review is required before Confirm & Save;
- no localStorage write occurs during Review or Edit.

The Season Review workflow now rejects any future Edit control that reuses `.backButton`. Runtime DOM simulation dispatches the real click through centralized capture delegation and proves that entry mode and values are restored.

## Active-save header synchronization

The Home header could display **No Active Showdown** after reload even while Continue Career correctly found an active save. It could also remain stale immediately after creating a Showdown until a later gameplay render.

`refreshMainMenuExperience()` now derives one normalized shell state for both the Continue tile and `#seasonIndicator`:

- no save → **No Active Showdown**;
- active save → **Season N / Total**;
- completed save → **Showdown Complete**.

New Showdown creation refreshes the shell only after the critical save succeeds and before League selection opens.

## Completed-season grammar

Completed Showdown Home now renders **1 season completed** and pluralizes only for other counts.

## Release-maintenance hardening

- eager Home feedback timing and lazy synthesis timing use separate module-owned helpers, removing their accidental global function collision;
- obsolete direct-binding optional-module initializers and the retired Home Trophy Room fallback are removed;
- active-save deletion/reset paths reuse `refreshMainMenuExperience()` for shell synchronization;
- Rule Book Back remains exclusively controlled by centralized Smart Back;
- Static App validation rejects future cross-module named-function collisions and retired optional-module fallbacks.

The exact candidate passes all 21 deterministic workflow blocks and an independent full-DOM audit of the complete one-season flow, refresh/resume checkpoints, every current feature destination, media lifecycle, normal/reduced motion and Settings preference recovery with zero runtime errors, duplicate IDs or automated accessibility violations.

An additional real-Chromium 149 release audit passes 98 desktop/mobile journey checkpoints and 22 accessibility scans at 1366 × 768 and 390 × 844. It also verifies no horizontal viewport escapes, failed local assets, page errors or severe application console errors. Browser findings corrected before the final pass include fallback-content, club-reveal, dashboard-status and Season Summary caption contrast, Transfer phase-label and verdict-detail contrast, analytics/Legacy and Settings contrast, content-bearing route and Settings entrance opacity, and the mobile media selector's containment. This evidence does not replace deployed owner Chrome/Chromebook acceptance.

---

# r12 owner/browser acceptance checklist

Hard-refresh once so Chrome receives `0.95.0-r12`.

1. With no active save, Home must show **No Active Showdown** and Continue Career must be disabled.
2. Create a disposable one-season Showdown. Immediately after Start Showdown, the header must read **Season 1 / 1** before the League Wheel is spun.
3. Spin the League Wheel, wait at least ten seconds and confirm the app remains on League selection. Refresh, press Continue Career and confirm the same league still requires explicit Continue.
4. Continue to Club Assignment, use Back once, return with the same league, open both packs and confirm the permanent rivalry.
5. Complete Transfer Window → Guess Entry → Signing Entry → Verdicts. Confirm draft signing values survive Back → Showdown Home → reopen.
6. Enter Season Results and press **REVIEW SEASON**. Verify the calculated max-11 model.
7. Press **EDIT RESULTS**. This is the critical r12 check: the populated Season Results form must reappear immediately, with no jump to Showdown Home and no lost values.
8. Change one value, Review again, then Confirm & Save. Summary must use the edited value exactly once.
9. Open completed Showdown Home. It must say **1 season completed**, not **1 seasons completed**.
10. Return to Main Menu and refresh. The header must show **Showdown Complete** and Continue Career must reopen the completed hub.
11. Smoke-check Legacy, Career Statistics, Rivalry Statistics, Trophy Room, Rule Book, Settings, normal motion, Reduce Motion and Menu Click Feedback persistence.
12. Repeat the critical header, Review → Edit and completed-hub checks on the target Chromebook and mobile browser.

Quality rejection rule:

Any lost Season value, unexpected Smart Back navigation, stale header, duplicate completion, runtime error, choppy transition or mobile/Chromebook layout regression blocks v1.0.

If r12 passes, move directly to **v1.0 Complete Release Candidate / Final Release**.
