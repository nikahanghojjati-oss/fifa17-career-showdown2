# CHANGELOG — Career Mode Showdown

This file preserves continuity so later development does not reconstruct the project from old chats or mistake implementation revisions for a replacement roadmap.

The original release destination remains:

`v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`

The project is currently inside the original **v0.95** convergence milestone.

---

# v0.95.0-r6 — Settings / Persistent Motion Accessibility

Status: **implemented and machine-validated; owner browser acceptance pending**

Workstream 3 adds the small owner-approved Settings surface while preserving accepted r4 presentation and r5 Transfer behavior.

## Settings architecture

- Added Home `SETTINGS` tile without changing the dominant Continue/New/Legacy hierarchy.
- Added lazy `js/settings.js` and `css/settings.css`.
- Settings opens as an accessible modal over the current screen rather than adding a new `screens.js` route.
- Central route/history authority therefore remains unchanged.
- Settings scope is intentionally limited to application information, motion/accessibility preference and access to existing data management.
- No account, backend, cloud, theme, notification or online preference system was added.

## Application preferences

Added isolated storage key:

`careerModeShowdown.preferences`

Current preference schema version: 1.

Current user option:

`reducedMotion: boolean`

`false` means Follow Device. `true` forces reduced non-essential motion.

The effective motion rule is:

**user Reduce Motion OR system/browser reduced-motion request**.

There is deliberately no force-full-motion setting that can override an accessibility request from the operating system/browser.

Preference state is applied during core storage initialization and synchronized when the system media query or another tab changes it.

## Motion behavior

### Club Assignment

`isReducedClubMotionPreferred()` now consumes the shared effective application preference. Reduced mode skips the theatrical stage timers only after the permanent pair has been generated and saved. Pair persistence, rollback, no-reroll and explicit confirmation remain unchanged.

### League Wheel

The wheel now consumes the same effective motion preference.

Standard timing remains:

- 4000 ms spin;
- 700 ms automatic advance.

Reduced timing is:

- 80 ms selection resolution;
- 120 ms automatic advance.

This removes the previous accessibility mismatch where CSS could visually eliminate wheel animation while JavaScript still waited four seconds. Random selection, save-before-progress, rollback and stale-operation guards are unchanged.

### CSS

`css/app.css` now minimizes transitions/animations when either:

- `html[data-motion-reduced="true"]` is active; or
- `prefers-reduced-motion: reduce` is requested by the browser/device.

## Settings accessibility

The lazy Settings surface includes:

- modal dialog semantics;
- labelled title;
- inert/hidden background application;
- Escape/backdrop close;
- Tab/Shift+Tab containment;
- opener focus restoration;
- motion radiogroup/radio semantics;
- roving radio tab stop;
- Arrow Up/Down/Left/Right plus Home/End navigation;
- selected-option focus restoration after dynamic rerender;
- visible focus treatment;
- bounded desktop dialog;
- low-height Chromebook layout;
- full-height mobile layout with internal scrolling.

## Data Management reuse

Settings does not duplicate destructive storage code.

`OPEN LEGACY & DATA MANAGEMENT` opens the existing Legacy module. Existing transactional and confirmation-protected delete/reset behavior remains authoritative there.

`Reset All Showdown Data` continues to remove active showdown + Legacy competition data only. The application motion preference intentionally survives that reset.

## Home layout

The accepted r4 Home structure remains:

- Continue Career dominant across two rows;
- New Showdown + Legacy upper support row;
- Trophy Room + Rule Book + Settings lower support row;
- soundtrack/trailer rail below the two navigation rows.

Responsive two-column and single-column flows include Settings without moving the media rail into a fixed/overlapping track.

## Diagnostics / validation

Runtime diagnostics now verify:

- Settings Home binding;
- preference APIs;
- document motion-state attributes;
- optional Settings load failures.

Added `Validate Settings Workstream` covering:

- Follow Device default;
- persistent Reduce Motion override;
- OS/browser reduced-motion precedence;
- preference isolation from Showdown-data reset;
- Settings lazy loading;
- modal/radio/focus accessibility contracts;
- no direct localStorage access from Settings UI;
- no duplicated destructive storage primitives;
- Legacy Data Management reuse;
- shared Club Reveal/League Wheel motion preference;
- materially shortened reduced wheel timing;
- user-forced reduced-motion CSS;
- Chromebook/mobile viewport guards;
- Settings CSS/HTML structural integrity.

The existing Static App and Transfer Workstream gates remain in parallel.

---

# v0.95.0-r5 — Phased Transfer Challenge / Canonical FIFA 17 Transfer Data

Status: **owner browser accepted; retained by r6**

Workstream 2 replaced the old combined post-window signing/guess form with an explicit persistent sequence while preserving every locked competition rule.

## Transfer phase model

The existing Transfer Challenge record remains authoritative. No duplicate challenge record or second router was introduced.

Status remains:

- `not_started`
- `active`
- `recording`
- `completed`

Persistent `phase` adds:

- `window`
- `guess_entry`
- `signing_entry`
- `completed`

Both Guess Entry and Signing Entry intentionally remain `status: recording`, allowing `js/screens.js` to remain the single route/history authority.

Current flow:

**15-minute window → Guess Entry → locked guesses → Signing Entry → locked signings → canonical verdicts → Season Results**

## Persistence / recovery

- Window → Guess, Guess → Signing and Signing → Completed are critical immediate saves.
- Each critical transition snapshots challenge/showdown state first.
- Failed persistence restores the prior state and blocks progression.
- Ordinary transfer draft entry remains debounced/deduplicated.
- Only the active phase form is captured, preventing Signing Entry edits from rewriting locked guesses.
- Continue Career restores the exact Transfer phase after refresh.

## Old-save compatibility

Old pre-r5 `recording` challenge records without a `phase` migrate safely to `guess_entry`. Existing drafts remain. Recognized historical free-text values map to canonical IDs; unknown values remain visible and require valid re-selection.

## FIFA 17 transfer metadata

Lazy `data/transferOptions.js` remains separate from the five-league Showdown Wheel:

- 36 Transfer League options: 35 historical FIFA 17 domestic competitions plus Rest of World;
- 164 FIFA 17 player nationalities;
- stable canonical IDs and historical aliases.

## Searchable controlled selectors / canonical verdicts

Lazy `js/transferSelector.js` and `css/transfer.css` provide framework-free searchable controlled Previous League, Nationality and Guess Value inputs with bounded results, keyboard/ARIA behavior and responsive viewport protection.

Release matching compares canonical League/Nationality IDs rather than arbitrary normalized strings.

## Validation

`Validate Transfer Workstream` protects dataset size/identity, old-save migration, phase order, canonical matching, selector accessibility/responsiveness and lazy-loading isolation.

---

# v0.95.0-r4 — FIFA-Era Typography / Original Club Crests / Two-Pack Reveal

Status: **owner browser accepted; retained by r6**

Workstream 1B implemented the owner-approved presentation amendments without changing competition rules, scoring, storage architecture, season progression or central navigation.

- Barlow Condensed for selected display roles with fallback-safe `display=swap`.
- Original deterministic procedural identities for all 98 Showdown clubs.
- Two sealed packs reveal the already-persisted permanent club pair sequentially.
- Save failure rolls back before reveal.
- No reroll path.
- `Clubs Assigned` remains the confirmation checkpoint.
- Refresh/Continue restores the exact pair.
- Explicit confirmation changes status to `Ready`.
- Club Reveal presentation is owned by `css/app.css`; no runtime reveal stylesheet injection.

---

# v0.95.0-r3 — Optional-Screen Visual Consistency / Contrast Polish

Status: **implemented; retained**

Normalized Rule Book, Statistics/Trophy and Legacy contrast/hierarchy while keeping optional styles lazy.

# v0.95.0-r2 — Reveal / Diagnostics Browser Hotfix

Corrected runtime-version diagnostics, Chromebook Club Reveal geometry and rejected sweep effect; retained finite reveal behavior.

# v0.95.0-r1 — Staged Club Reveal / Rivalry Confirmation

Established `Clubs Assigned` as the persisted permanent-pair/confirmation checkpoint and implemented save-before-animation reveal/confirmation flow.

---

# v0.16.0-r3 — Chromebook Home Layout Stabilization

Status: **owner accepted**

- content-sized Home rows;
- soundtrack/trailer rail below Career tiles;
- compact desktop media selector;
- low-height Chromebook handling;
- mobile preserved;
- CI guard against fixed-row overlap regression.

# v0.16.0-r2 — Navigation / Cache / Roadmap Re-anchor

- fixed contextual Back from Completed Showdown Home;
- centralized cache revision ownership;
- re-established original `v0.95 → v1.0` roadmap authority;
- restored continuation documentation.

# v0.16.0-r1 — Smart Navigation & Lightweight Runtime

- unified initial `css/app.css`;
- seven-script startup;
- lazy gameplay and optional modules;
- centralized state-aware Back authority;
- completed-showdown recovery hub;
- exact-head CI/startup budget;
- obsolete prototype removal.

# v0.15.x — Stability / Performance Consolidation

Established transaction-safe persistence, race-safe delayed operations, persisted Transfer deadline, debounced Transfer drafts, hidden timer shutdown, stabilized Seasons, lazy secondary modules, lightweight media and diagnostics.

# v0.10.1 — Season / Routing / Persistence Stabilization

Established safe season persistence/rollback, visible errors, route validation and hardened localStorage failure behavior.

# v0.10 — Statistics / Trophy Room Expansion

Added rivalry analytics, cumulative manager statistics, records, Trophy Room and Statistics UI.

# v0.9 — Legacy / Data Management

Added completed-showdown archive/history and protected deletion/data-management flows.

# v0.8 — Transfer Challenge / Corrected Competitive Rules

Established 15-minute Transfer Challenge and authoritative max-11 grouped-bonus scoring/tiebreak rules.

# v0.7 — Working Showdown / Season Progression

Established Showdown Home, Season Results, scoring, Season Summary, multi-season progression and active-save continuity.

# v0.6.1 and earlier — Foundation

- v0.6.1: application framework/navigation/storage foundation.
- v0.6: League Wheel.
- v0.5: league/club/data foundation.
- v0.4: functional HTML/CSS/JS prototype.
- v0.3: FIFA-17-era UI direction.
- v0.2: rivalry experience design.
- v0.1: project foundation.

---

# Remaining v0.95 roadmap

## Current gate

Owner browser acceptance of **`0.95.0-r6` Workstream 3**.

## Workstream 4 — Main Menu Statistics alignment

Reuse current analytics/Trophy/Rivalry engines; do not create a second analytics engine.

## Workstream 5 — Season pre-commit review

Add/confirm review before irreversible season completion.

## Workstream 6 — final v0.95 regression/polish

Accessibility, responsive consistency, typography/contrast, feedback, performance and full gameplay/persistence/navigation regression.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.
