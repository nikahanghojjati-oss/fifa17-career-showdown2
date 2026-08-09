# CHANGELOG — Career Mode Showdown

This file preserves implementation continuity without replacing the original roadmap.

Release destination remains:

`v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`

The project remains inside the original **v0.95** convergence milestone.

---

# v0.95.0-r11 — Workstream 6 Final Polish / Regression

Status: **implemented; owner browser acceptance pending**

## Central route presentation

- replaced the frame-cancelled 130 ms route marker with an animation-end lifecycle and bounded fallback cleanup;
- added 180 ms forward/back transform-and-opacity entrances plus an original yellow/cyan route rail;
- kept legality checks, destination rendering and critical-write flush ahead of presentation;
- added revision-guarded stale transition cancellation;
- preserved immediate destination commits with no transition delay;
- completely skips theatrical route state for effective reduced motion;
- moves focus to the destination heading and resets screen scroll position;
- synchronizes route `aria-hidden` and `aria-labelledby` state.

## Original click feedback

- added lazy `js/menuFeedback.js` Web Audio synthesis with no recorded/bundled/fetched sound;
- uses a restrained 64 ms project-original two-voice cue;
- arms only from eligible explicit interaction and plays only after successful route commit;
- suppresses playback while Home soundtrack/trailer media is playing;
- adds a 110 ms repeat cooldown and hidden-page suspension;
- keeps missing/blocked audio completely non-blocking;
- added a persistent Settings **MENU CLICK FEEDBACK** switch;
- upgraded application preferences to schema 2 with safe version-1 migration.

## Accessibility / responsive / performance

- associated Create Showdown labels and declared all shell button types;
- added League/Transfer live status semantics;
- added contextual accessible names to every compact Transfer field and preserved them through enhanced comboboxes;
- added focus-visible treatments to Back, compact and Home media controls;
- made the loading shell leave the accessibility tree after startup;
- retained seven initial scripts and one stylesheet;
- established 155 KB raw and 35 KB gzip startup ceilings;
- keeps the 4.8 KB synthesizer lazy.

## Regression protection

Added **Validate Final Polish** for route ordering/races, reduced motion, focus, preference migration, original synthesis, media suppression, cooldown, labels and bundle budgets.

All 21 deterministic blocks across eight workflows pass locally. Runtime DOM simulation passes Home, Create, League confirmation, Club Reveal, Dashboard, Transfer Challenge, Career Statistics, Rule Book, Legacy and Settings with zero automated accessibility violations on the audited screens.

---

# v0.95.0-r10 — Explicit League Confirmation Stabilization

Status: **owner browser accepted**

## Reported bug

After a League Wheel spin completed, the selected league appeared and the button changed to **CONTINUE TO CLUB ASSIGNMENT**, but the application automatically opened Club Assignment without waiting for the button press.

## Root cause

`js/leagueWheel.js` scheduled `prepareClubAssignment()` after every successful spin:

- 700 ms normal motion;
- 120 ms reduced motion.

The UI advertised an explicit Continue checkpoint while the runtime bypassed it.

## Corrected flow

**Spin → League Selected → remain on League Wheel → explicit Continue → League Confirmed → Club Assignment**

Changes:

- removed normal/reduced post-spin advance constants;
- removed the post-spin Club Assignment timeout;
- selected league is still persisted immediately and remains non-rerollable;
- new `League Selected` state remains canonical to League Wheel;
- explicit Continue changes state to `League Confirmed`;
- confirmation is saved before Club Assignment opens;
- failed confirmation persistence rolls status back to `League Selected`, surfaces an error and blocks navigation;
- refresh/Continue Career before confirmation restores the same selected league on League Wheel;
- `js/screens.js` independently rejects Club Assignment while League confirmation is pending;
- Back from uncompleted Club Assignment preserves the same confirmed league and does not reroll.

## Regression protection

Added **Validate League Confirmation**.

It verifies:

- no automatic post-spin advance timer;
- spin completion cannot call `prepareClubAssignment()`;
- Continue save-before-navigation ordering;
- failed-save rollback/no-navigation;
- `League Selected` refresh/resume → League Wheel;
- `League Confirmed` refresh/resume → Club Assignment;
- existing `Clubs Assigned` reveal confirmation route remains intact.

The main Static App route matrix now distinguishes the same two states.

Deployed shell cache revision advances to `0.95.0-r10` so r9 routing bytes cannot remain active after a proper refresh.

---

# v0.95.0-r9 — Season Pre-Commit Review

Status: **owner browser accepted**

Workstream 5 inserted the review/confirmation checkpoint between Season Results and irreversible completion:

**Season Results → Review Season → Edit Results OR Confirm & Save Season → Season Summary**

Owner testing confirmed the new engine, confirmation and Edit behavior work correctly.

Preserve:

- Review validates and calculates but performs no persistence;
- memory-only isolated review snapshot;
- canonical max-11 scoring and canonical winner logic;
- deterministic fingerprint/tamper blocking;
- Edit preserves entered values and forces a new review after changes;
- Confirm revalidates Showdown/Season/Transfer context;
- Confirm rebuilds canonical scoring/winner from reviewed raw values;
- completion timestamp only at final confirmation;
- established `persistCompletedSeason()` transaction and rollback;
- double-submit protection;
- safe fallback if Summary rendering fails after a successful save;
- lazy `css/season.css` and no new route/storage key.

Added **Validate Season Review** and runtime Review binding/integrity diagnostics.

---

# v0.95.0-r8 — Home Bootstrap Stabilization

Status: **owner browser accepted**

Fixed r7 Home startup coupling where `initializeMenuExperience()` still required removed `trophyRoomButton` and aborted media initialization.

Preserve independent Home tile decoration, `careerStatisticsButton`, required media bootstrap/self-validation, exact seven media choices, Play/Mute binding and revision-independent **Validate Home Bootstrap**.

Owner confirmed Home, Career Statistics, Trophy Room and Legacy work correctly.

---

# v0.95.0-r7 — Main Menu Career Statistics Alignment

Status: **owner accepted through r8 stabilization**

- Home top-level **STATISTICS** destination;
- Career Statistics = completed all-time career data;
- Rivalry Statistics = current Showdown only;
- Trophy Room = honours/all-time records;
- all reuse `js/analytics.js`;
- analytics/Trophy assets remain lazy;
- central routing remains in `js/screens.js`.

---

# v0.95.0-r6 — Settings / Persistent Motion Accessibility

Status: **owner browser accepted**

Added lazy Settings modal, build information, Follow Device / Reduce Motion preference and safe Legacy Data Management access. System/browser reduced-motion always wins; Showdown reset preserves application preference.

---

# v0.95.0-r5 — Phased Transfer Challenge / Canonical FIFA 17 Transfer Data

Status: **owner browser accepted**

Established:

**Transfer Window → Guess Entry → lock guesses → Signing Entry → lock signings → canonical verdicts → Season Results**

Preserved rules while adding persistent sub-phases, critical rollback, debounced drafts, migration, 36 FIFA 17 Transfer League options, 164 FIFA 17 nationalities, searchable controlled selectors and canonical RELEASE/SAFE matching.

---

# v0.95.0-r4 — FIFA-Era Typography / Original Club Crests / Two-Pack Reveal

Status: **owner browser accepted**

Established fallback-safe display typography, deterministic original identities for all 98 clubs, two sealed Showdown packs, save-before-reveal rollback, permanent no-reroll assignment, `Clubs Assigned` checkpoint, explicit Rivalry Confirmation and Chromebook/mobile reveal layout.

No official badge art or proprietary FIFA/EA font files are bundled.

---

# v0.95.0-r3 — Optional-Screen Visual Consistency

Normalized Rule Book, Statistics, Trophy Room and Legacy contrast while keeping optional styles lazy.

# v0.95.0-r2 — Reveal / Diagnostics Browser Hotfix

Corrected runtime-version diagnostics and Chromebook Club Reveal geometry.

# v0.95.0-r1 — Staged Club Reveal / Rivalry Confirmation

Established `Clubs Assigned` as the persisted pair/confirmation checkpoint and staged reveal flow.

---

# v0.16.0-r3 — Chromebook Home Layout Stabilization

Owner accepted. Established content-sized Home rows, media rail below navigation and low-height Chromebook handling.

# v0.16.0-r2 — Navigation / Cache / Roadmap Re-anchor

Fixed contextual completed-showdown Back behavior, centralized cache revision ownership and restored v0.95 → v1.0 roadmap authority.

# v0.16.0-r1 — Smart Navigation & Lightweight Runtime

Established one unified initial stylesheet, seven-script startup, lazy gameplay/optional modules, centralized state-aware Back, completed-showdown recovery and CI/startup budgets.

# v0.15.x — Stability / Performance Consolidation

Established transaction-safe persistence, race-safe delayed operations, persisted Transfer deadline, debounced drafts, hidden timer shutdown, stabilized Seasons, lazy secondary modules and diagnostics.

# v0.10.1 — Season / Routing / Persistence Stabilization

Established safe Season persistence/rollback, visible errors, route validation and hardened localStorage failure behavior.

# v0.10 — Statistics / Trophy Room Expansion

Added rivalry analytics, cumulative manager statistics, records, Trophy Room and Statistics UI.

# v0.9 — Legacy / Data Management

Added completed-showdown archive/history and protected deletion/reset flows.

# v0.8 — Transfer Challenge / Corrected Competitive Rules

Established the Transfer Challenge and authoritative max-11 grouped-bonus scoring/tiebreak rules.

# v0.7 — Working Showdown / Season Progression

Established Showdown Home, Season Results, scoring, Season Summary, multi-season progression and active-save continuity.

# v0.6.1 and earlier — Foundation

Application framework/navigation/storage, League Wheel, league/club data, functional static prototype and FIFA-17-era UI direction.

---

# Remaining v0.95 roadmap

## Current gate

Owner Chromebook/mobile acceptance of **`0.95.0-r11` final polish / regression candidate**.

## Workstream 6 — implemented

Accessibility/focus, responsive consistency, typography/contrast, performance and full gameplay/persistence/navigation regression.

Owner-approved quality-gated addition:

- smooth FIFA-era-inspired navigation transition integrated with the central router;
- original/safely-created very short menu click cue, never copied EA/FIFA audio;
- reduced-motion-safe and non-blocking;
- ship only if real Chromebook/mobile testing demonstrates a clear quality improvement with no lag, choppiness or route/audio race.

After r11 acceptance, move directly to **v1.0 Complete Release Candidate / Final Release**.
