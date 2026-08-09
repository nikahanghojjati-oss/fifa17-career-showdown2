# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Application version:** v0.95.0 — Polish & Blueprint Alignment
**Runtime asset revision:** `0.95.0-r12`
**Current phase:** r12 release candidate validated locally; deployment and owner browser acceptance pending
**Owner-accepted gates:** `0.95.0-r4`, `r5`, `r6`, `r8`, `r9`, `r10`
**Next after r12 acceptance:** v1.0 Complete Release Candidate / Final Release

## Development entry point

The project design phase is complete. Do not restart planning or replace established architecture.

Read in this order:

1. `PROJECT_STATE.md` — exact implementation, locked rules, architecture and roadmap status.
2. `ROADMAP_AMENDMENTS.md` — later owner-approved requirements.
3. `NEXT_TASK.md` — current browser gate and exact next workstream.
4. `CHANGELOG.md` — implementation/stabilization history.
5. `THIRD_PARTY_NOTICES.md` — intentional external font/media source/license notes.
6. current source — highest implementation authority.
7. original Project Bible — blueprint where later decisions/current source have not intentionally superseded it.

The release path remains **v0.95 → v1.0**.

---

## Current r12 — release stabilization

The full r11 browser audit validated the final-polish presentation and complete one-season flow, then exposed an integration regression: **EDIT RESULTS** reused the router-reserved `.backButton` class, so centralized Smart Back returned to Showdown Home before the Season engine could restore the form. r12 classifies Edit as a non-routing compact control, preserves every entered value, clears the ephemeral review snapshot and requires a fresh Review.

r12 also synchronizes the global save indicator during Home bootstrap and successful New Showdown creation, and corrects the singular **1 season completed** label. A new runtime DOM regression proves the Edit click passes through the real centralized capture layer without losing values.

The release-maintenance pass also removes a duplicate global menu-feedback timing helper, obsolete optional-module direct bindings and the retired Home Trophy Room fallback. Active-save deletion/reset paths now reuse the same shell refresh authority. Static validation rejects future cross-module named-function collisions.

The browser-validated r11 presentation work remains intact: short directional route transitions, reduced-motion removal of theatrics, destination focus, screen accessibility-tree synchronization and an original optional 64 ms Web Audio cue that remains lazy, media-aware and non-blocking.

The startup shell remains seven local scripts and one local stylesheet with a 35 KB gzip ceiling. All eight established workflows remain mandatory. The exact candidate passes all 21 deterministic blocks plus an independent full-DOM journey across every feature destination with zero runtime errors, duplicate IDs or automated accessibility violations.

A real-Chromium 149 release audit also passes 98 checkpoints and 22 accessibility scans at 1366 × 768 and 390 × 844, covering normal/reduced motion, the ten-second League gate, refresh recovery, Back/reopen drafts, Review/Edit/Confirm, optional routes, destructive transactions, responsive containment and preference persistence. Transient and settled contrast plus mobile media-selector findings discovered during that audit are corrected. Exact deployed owner Chrome/Chromebook acceptance is still required.

See `NEXT_TASK.md` for the r12 exact browser checklist.

---

## Accepted r10 — explicit League Wheel confirmation

r10 fixes the reported auto-navigation bug after League selection.

Previous behavior:

**Spin → selected league → automatic Club Assignment after a short delay**

Correct behavior now:

**Spin → League Selected → stay on League Wheel → CONTINUE TO CLUB ASSIGNMENT → League Confirmed → Club Assignment**

The old post-spin advance timer has been removed.

### Reliability contract

After the spin:

- the selected league is persisted and cannot be rerolled;
- the application remains on the League Wheel indefinitely;
- refresh / Continue Career returns to the League Wheel with the same league;
- Club Assignment is not a legal route until explicit confirmation.

On Continue:

- status changes from `League Selected` to `League Confirmed`;
- confirmation is critically saved before navigation;
- failed storage rolls status back and blocks Club Assignment;
- successful confirmation opens Club Assignment exactly once.

`js/screens.js` independently protects the same route boundary, so refresh/resume/fallback navigation cannot bypass the Continue checkpoint.

Dedicated **Validate League Confirmation** and the Static App route matrix protect this behavior.

---

## Accepted r9 — Season pre-commit review

Owner browser testing accepted the Review / Edit / Confirm engine.

Locked flow:

**Season Results → Review Season → Edit Results OR Confirm & Save Season → Season Summary**

Preserve:

- Review is memory-only and does not persist;
- canonical max-11 scoring and winner logic;
- deterministic review fingerprint/tamper detection;
- Edit preserves entered form values and invalidates the old snapshot;
- Confirm revalidates Showdown/Season/Transfer context and recomputes canonical score/winner;
- completion timestamp only at confirmation;
- existing critical save/rollback transaction;
- double-submit protection;
- lazy `css/season.css`;
- no Review route or storage key.

---

## Other accepted v0.95 baselines

### r8 — Career Statistics / Home bootstrap

- Home **STATISTICS** opens all-time Career Statistics.
- Rivalry Statistics remains current-showdown only.
- Trophy Room remains honours/all-time-record detail.
- `js/analytics.js` remains the single analytics calculation engine.
- Home media bootstrap is self-validating and keeps exactly seven accepted choices.
- no media iframe before explicit Play.

### r6 — Settings / motion accessibility

Settings remains a lazy modal. `careerModeShowdown.preferences` schema 2 stores Reduce Motion and Menu Click Feedback preferences; device/browser reduced motion always wins. Showdown-data reset preserves application preferences.

### r5 — phased Transfer Challenge

**15-minute Transfer Window → Guess Entry → lock guesses → Signing Entry → lock signings → canonical verdicts → Season Results**

Preserve maximum three signings each, three opponent guesses, League/Nationality guess types, correctly guessed signing released, canonical FIFA-17-era metadata/selectors, critical save rollback and debounced drafts.

### r4 — FIFA-era presentation / Club Reveal

Preserve original procedural identities for all 98 clubs, exactly two sealed Showdown packs, one permanent same-league/different-club pair, save-before-reveal rollback, no reroll, explicit Rivalry Confirmation, refresh recovery and reduced-motion support.

No official club badges, copied EA/FIFA UI art, proprietary FIFA fonts or copied interface audio are bundled.

---

## Locked competition rules

- Exactly two managers, one device/browser in v1.
- Same selected league, two different permanent clubs.
- Showdown length: 1 / 3 / 5 / 10 seasons.
- Transfer Challenge: 15 minutes, maximum three signings each, three opponent guesses, League or Nationality, correctly guessed signing released.
- Champions League winner: +5.
- League winner: +3.
- Main domestic cup winner: +1.
- 100 league points and/or 100 league goals: +1 maximum for the pair.
- Top Scorer and/or Top Assist: +1 maximum for the pair.
- Maximum per manager per Season: **11**.
- Equal non-zero scores are a draw.
- Only 0–0 uses league position, then league points.

---

## Performance / architecture

Initial local runtime remains exactly one local stylesheet plus seven scripts:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

Gameplay, Transfer data/selectors, Season Review CSS, analytics, Trophy Room, Legacy, Rule Book, Settings and diagnostics remain lazy.

`js/screens.js` is the sole route/history authority. `js/storage.js` remains persistence authority. Statistics remain derived; Season Review remains ephemeral.

---

## Automated validation

Eight GitHub Actions gates protect the current v0.95 build:

- **Validate Static App** — syntax, scoring, route matrix, Club Assignment, procedural crests, startup budget, Smart Back and responsive shell.
- **Validate Home Bootstrap** — Home IDs/media bootstrap/revision coherence.
- **Validate Transfer Workstream** — accepted Transfer state/data/selectors.
- **Validate Settings Workstream** — preference/accessibility/reset isolation.
- **Validate Statistics Workstream** — analytics fixtures and shared/lazy architecture.
- **Validate Season Review** — non-persistent Review and confirmation-only transaction boundary.
- **Validate League Confirmation** — explicit Continue, save-before-navigation, rollback and refresh/resume route boundary.
- **Validate Final Polish** — transition ordering/stale cleanup, reduced motion, route focus, original feedback synthesis, preference migration, accessibility and bundle budgets.

Automated checks do not replace Chromebook/mobile owner acceptance. See `NEXT_TASK.md` for the r12 checklist.

---

## Remaining release path

1. **r12 release-stabilization browser acceptance**
   - prove Review → Edit restores the populated Season Results form instead of triggering Smart Back;
   - prove active/completed save headers synchronize on creation and reload;
   - repeat the accepted r11 navigation, feedback, Chromebook/mobile and full-flow smoke checks.
2. **v1.0 Complete Release Candidate / Final Release**

No replacement v0.17/v0.18 roadmap is planned.
