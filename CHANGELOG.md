# CHANGELOG — Career Mode Showdown

This file preserves continuity so later development does not reconstruct the project from old chats or mistake implementation revisions for a replacement roadmap.

The release destination remains:

`v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`

The project is currently inside the original **v0.95** convergence milestone.

---

# v0.95.0-r9 — Season Pre-Commit Review

Status: **implemented and machine-validated during development; final exact-head validation/browser acceptance required after documentation sync**

Workstream 5 inserts a review/confirmation checkpoint between Season Results and the irreversible completed-Season transaction.

## Root problem

Before r9, `completeCurrentSeason()` validated the entered results and immediately persisted the completed Season. A user could not see the complete calculated result before it became read-only.

## New flow

**Season Results → Review Season → Edit Results OR Confirm & Save Season → Season Summary**

Season Review is an in-place state of the existing `seasonEntry` route; no second router or review route was added.

## Non-persistent Review

**REVIEW SEASON** now:

- validates both managers;
- reads the current form values;
- uses the canonical scoring/winner engines;
- creates an isolated memory-only snapshot;
- creates a deterministic review fingerprint;
- renders position/points/goals, four achievement states, every score component, Season score, projected winner and projected overall Showdown score;
- performs no localStorage write;
- does not append a round, advance currentRound, change status/score or create a completion timestamp.

## Edit without data loss

**EDIT RESULTS** returns to the same form with all entered values intact and clears the previous review snapshot. Any change therefore requires a fresh Review before confirmation.

## Final confirmation safeguard

**CONFIRM & SAVE SEASON** is the only new Season persistence boundary.

It verifies the Showdown/Season context and Transfer completion, rejects duplicates, recomputes canonical score/winner data from reviewed raw values, verifies the review fingerprint, creates the completion timestamp only at confirmation and retains double-submit protection.

Only then does it enter the established `persistCompletedSeason()` transaction.

## Persistence failure safety

The existing rollback snapshot remains authoritative. If the critical active-save write fails, rounds/currentRound/status/completedAt/score are restored and the Review remains available to retry or edit.

If the Season saves but Summary rendering later fails, the saved Season remains authoritative and the UI falls back safely to Showdown Home with an accurate error notice.

## Lazy presentation

Added `css/season.css`, loaded only with the gameplay package.

The initial Home bundle remains one local stylesheet + seven local JavaScript files.

The Review presentation includes Chromebook low-height, mobile, small-phone and reduced-motion guards.

## Diagnostics / CI

Runtime diagnostics now verify Review/Confirm/Edit APIs and binding integrity when gameplay is loaded.

Added **Validate Season Review** with executable fixtures for:

- canonical max-11 preview scoring;
- canonical winner;
- null preview completion timestamp;
- deterministic review fingerprint;
- timestamp creation only at confirmation;
- changed/tampered snapshot blocking;
- Review path forbidden from persistence;
- Confirm path as the persistence boundary;
- rollback preservation;
- no new review storage key;
- lazy Review CSS;
- Chromebook/mobile guards.

Also made the r8 **Validate Home Bootstrap** cache-coherence check revision-independent so it protects Home behavior across later v0.95 runtime revisions instead of failing simply because r9 exists.

---

# v0.95.0-r8 — Home Bootstrap Stabilization

Status: **owner browser accepted**

r7 replaced the top-level Home Trophy Room tile with `careerStatisticsButton`, but `initializeMenuExperience()` still required the removed `trophyRoomButton` ID in an all-or-nothing prerequisite. The initializer returned before creating the media selector or binding Play/Mute.

r8 permanently corrected the architecture:

- Home navigation tiles decorate independently;
- current `careerStatisticsButton` is understood explicitly;
- media selector/bindings initialize independently of unrelated optional tiles;
- `getMenuExperienceIntegrity()` validates the exact seven media choices and bindings immediately;
- incomplete required initialization fails loudly;
- **Validate Home Bootstrap** couples current Home IDs to initializer behavior.

Owner subsequently confirmed Home, Career Statistics, Trophy Room and Legacy work correctly.

---

# v0.95.0-r7 — Main Menu Career Statistics Alignment

Status: **feature architecture owner accepted through r8 stabilization**

Workstream 4 aligned the Main Menu with the Statistics blueprint:

- top-level **STATISTICS** replaced the competing Home Trophy Room tile;
- Career Statistics became the permanent all-time Home destination;
- Rivalry Statistics remained current-showdown-only;
- Trophy Room remained the honours/cabinet destination;
- all surfaces continue to reuse `js/analytics.js`;
- Career/Trophy assets remain lazy and do not wake the full gameplay runtime;
- `js/screens.js` remains sole route/history authority;
- Trophy Room reuses the shared Career Table renderer.

The dedicated Statistics workflow protects completed-history totals, manager records, transfer accumulation, records, lazy loading and route contracts.

---

# v0.95.0-r6 — Settings / Persistent Motion Accessibility

Status: **owner browser accepted**

Workstream 3 added the small lazy Settings modal, application/build information, Follow Device / Reduce Motion preference and safe access to existing Legacy Data Management.

Application preference key: `careerModeShowdown.preferences`.

System/browser reduced-motion always wins. Club Reveal and League Wheel consume the same effective preference, and Showdown-data reset preserves application preferences.

---

# v0.95.0-r5 — Phased Transfer Challenge / Canonical FIFA 17 Transfer Data

Status: **owner browser accepted**

Established:

**Transfer Window → Guess Entry → lock guesses → Signing Entry → lock signings → canonical verdicts → Season Results**

Preserved competition rules while adding persistent Transfer sub-phases, critical save/rollback, debounced active drafts, old-record migration, 36 FIFA 17 Transfer League options, 164 FIFA 17 player nationalities, controlled searchable selectors and canonical-ID RELEASE/SAFE matching.

The Showdown League Wheel remains five leagues.

---

# v0.95.0-r4 — FIFA-Era Typography / Original Club Crests / Two-Pack Reveal

Status: **owner browser accepted**

Established fallback-safe Barlow Condensed hierarchy, original deterministic procedural identities for all 98 clubs, exactly two sealed Showdown packs, save-before-reveal rollback, permanent no-reroll assignment, `Clubs Assigned` confirmation checkpoint, explicit Rivalry Confirmation and Chromebook/mobile reveal layout.

No official club badge vectors/images or proprietary FIFA/EA font files are bundled.

---

# v0.95.0-r3 — Optional-Screen Visual Consistency

Normalized Rule Book, Statistics, Trophy Room and Legacy contrast while keeping optional styles lazy.

# v0.95.0-r2 — Reveal / Diagnostics Browser Hotfix

Corrected runtime-version diagnostics and Chromebook Club Reveal geometry.

# v0.95.0-r1 — Staged Club Reveal / Rivalry Confirmation

Established `Clubs Assigned` as the persisted pair/confirmation checkpoint and staged reveal flow.

---

# v0.16.0-r3 — Chromebook Home Layout Stabilization

Owner accepted. Established content-sized Home rows, media rail below navigation and low-height Chromebook density handling.

# v0.16.0-r2 — Navigation / Cache / Roadmap Re-anchor

Fixed contextual completed-showdown Back behavior, centralized cache revision ownership and restored v0.95 → v1.0 roadmap authority.

# v0.16.0-r1 — Smart Navigation & Lightweight Runtime

Established one unified initial stylesheet, seven-script startup, lazy gameplay/optional modules, centralized state-aware Back, completed-showdown recovery and exact-head CI/startup budgets.

# v0.15.x — Stability / Performance Consolidation

Established transaction-safe persistence, race-safe delayed operations, persisted Transfer deadline, debounced drafts, hidden timer shutdown, stabilized Seasons, lazy secondary modules and diagnostics.

# v0.10.1 — Season / Routing / Persistence Stabilization

Established safe Season persistence/rollback, visible errors, route validation and hardened localStorage failure behavior.

# v0.10 — Statistics / Trophy Room Expansion

Added rivalry analytics, cumulative manager statistics, records, Trophy Room and Statistics UI.

# v0.9 — Legacy / Data Management

Added completed-showdown archive/history and protected deletion/reset flows.

# v0.8 — Transfer Challenge / Corrected Competitive Rules

Established 15-minute Transfer Challenge and authoritative max-11 grouped-bonus scoring/tiebreak rules.

# v0.7 — Working Showdown / Season Progression

Established Showdown Home, Season Results, scoring, Season Summary, multi-season progression and active-save continuity.

# v0.6.1 and earlier — Foundation

Application framework/navigation/storage, League Wheel, league/club data, functional static prototype and FIFA-17-era UI direction.

---

# Remaining v0.95 roadmap

## Current gate — Workstream 5

Owner browser acceptance of **`0.95.0-r9` Season pre-commit Review**.

## Workstream 6 — final v0.95 regression/polish

Accessibility, focus, responsive consistency, typography/contrast, feedback, performance and full gameplay/persistence/navigation regression.

Owner-requested quality-gated addition:

- smooth FIFA-era-inspired navigation transition integrated with central routing and reduced-motion;
- original/safely-created very short menu click cue, never copied EA/FIFA audio;
- ship only if real Chromebook/mobile testing shows a clear quality improvement with no lag/choppiness/routing risk.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.