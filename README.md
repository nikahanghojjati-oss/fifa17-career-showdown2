# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Application version:** v0.95.0 — Polish & Blueprint Alignment  
**Runtime asset revision:** `0.95.0-r9`  
**Current phase:** Workstream 5 — Season pre-commit review browser acceptance  
**Owner-accepted gates:** `0.95.0-r4`, `0.95.0-r5`, `0.95.0-r6`, `0.95.0-r8`  
**Next after r9 acceptance:** Workstream 6 — final v0.95 polish/regression, then v1.0

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

## Current r9 — Season pre-commit review

The previous Season Results flow validated the form and immediately wrote a completed Season. r9 inserts an explicit, non-persistent review checkpoint before the irreversible transaction.

Current flow:

**Season Results → Review Season → Edit Results OR Confirm & Save Season → Season Summary**

### Review contract

Pressing **REVIEW SEASON**:

- validates both managers' required numeric fields;
- captures the current form into an isolated memory-only snapshot;
- calculates the existing locked scoring model and Season winner;
- displays position, points, goals, achievement states, all score components, Season score, projected winner and projected overall Showdown score;
- does not save to localStorage;
- does not append a round;
- does not change Showdown status/currentRound/score;
- creates no new persistence key.

**EDIT RESULTS** returns to the same form with values intact and invalidates the old review snapshot.

### Confirmation contract

**CONFIRM & SAVE SEASON** is the only new Season persistence boundary.

Before saving it:

- verifies Showdown identity and Season number;
- verifies the Transfer Challenge is still complete;
- rejects an already-completed Season;
- recomputes canonical scoring/winner data from reviewed raw values;
- checks the deterministic review fingerprint;
- blocks a changed/tampered review snapshot;
- creates the completion timestamp only at final confirmation.

It then uses the existing rollback-protected `persistCompletedSeason()` transaction. If browser storage rejects the critical write, rounds/currentRound/status/completedAt/score are restored and the Review remains available to retry or edit.

Completed Seasons remain read-only.

### Lightweight presentation

`css/season.css` is lazy-loaded with gameplay. Home startup remains exactly one local stylesheet and seven local scripts.

Season Review remains inside the existing `seasonEntry` route, so `js/screens.js` is still the sole route/history authority.

Responsive guards cover Chromebook low-height layouts, mobile and small phones.

### Regression protection

Dedicated GitHub Actions workflow: **Validate Season Review**.

It protects canonical scoring/winner behavior, the non-persistent Review boundary, deterministic snapshot integrity, tamper blocking, final-confirmation-only persistence, rollback preservation, lazy loading and responsive guards.

Runtime diagnostics also verify Review/Confirm/Edit APIs and binding markers once gameplay is loaded.

---

## Accepted r8 — Career Statistics + Home bootstrap stabilization

Workstream 4 is owner accepted.

The Home Statistics architecture remains:

- **Career Statistics** — permanent all-time completed-career data from Home.
- **Rivalry Statistics** — current loaded showdown only, contextual to Showdown Home.
- **Trophy Room** — detailed honours cabinets/all-time records, opened contextually.

All use the established `js/analytics.js` engine; no second analytics model/storage layer exists.

r8 permanently fixed the r7 Home bootstrap bug where a removed Trophy Room Home ID could abort media initialization. Home tile decoration is independent, media bootstrap self-validates, and **Validate Home Bootstrap** protects the current seven-choice media/startup contract across later cache revisions.

---

## Accepted r6 — Settings / motion accessibility

Settings remains a lazy modal rather than a route. It provides application/build information, **Follow Device / Reduce Motion**, and safe access to existing Legacy Data Management.

Application preferences use `careerModeShowdown.preferences`. System/browser reduced-motion always wins and the preference survives Showdown-data reset.

League Wheel and Club Reveal consume the same effective reduced-motion contract.

---

## Accepted r5 — phased Transfer Challenge

Locked flow:

**15-minute Transfer Window → Guess Entry → lock guesses → Signing Entry → lock signings → canonical verdicts → Season Results**

Accepted r5 includes persistent Transfer sub-phases, critical save/rollback, debounced drafts, old-save migration, 36 FIFA 17 Transfer League options, 164 FIFA 17 player nationalities, searchable canonical selectors and one persisted deadline/visible timer loop maximum.

The Showdown League Wheel remains exactly five leagues.

---

## Accepted r4 — FIFA-era presentation / Club Reveal

Preserve fallback-safe Barlow Condensed display hierarchy, original deterministic procedural identities for all 98 clubs, two sealed Showdown packs, save-before-reveal rollback, permanent no-reroll club pair, explicit Rivalry Confirmation and Chromebook/mobile presentation.

No official club badge images/vector paths or proprietary FIFA/EA font files are bundled.

---

## Locked competition rules

- Exactly two managers, one device/browser in v1.
- Same selected league, two different permanent clubs.
- Showdown length: 1 / 3 / 5 / 10 seasons.
- Transfer Challenge: 15 minutes, maximum three signings each, three opponent guesses, League or Nationality, correctly guessed signing must be released.
- Champions League winner: +5.
- League winner: +3.
- Main domestic cup winner: +1.
- 100 league points and/or 100 league goals: +1 maximum for the pair.
- Top Scorer and/or Top Assist: +1 maximum for the pair.
- Maximum score per manager per season: **11**.
- Equal non-zero scores are a draw.
- Only 0-0 uses league position, then league points.

---

## Current feature set

- New/resumable showdowns
- five-league League Wheel
- permanent same-league Club Assignment
- 98 original procedural club identities
- two-pack Club Reveal / Rivalry Confirmation
- Showdown Home
- phased Transfer Challenge
- canonical FIFA 17 Transfer selectors
- Season Results
- **Season pre-commit Review / Confirm safeguard**
- automatic locked scoring
- Season Summary / multi-season progression
- completed-showdown recovery hub
- Legacy history / Data Management
- Career Statistics
- current Rivalry Statistics
- Trophy Room
- Rule Book
- Settings / persistent motion accessibility
- lazy soundtrack/trailer media
- centralized state-aware Back navigation
- runtime diagnostics
- Chromebook/laptop/mobile responsive presentation

---

## Performance contract

Initial local runtime remains exactly:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

Gameplay/feature assets remain lazy, including `css/season.css`. CI enforces one initial local stylesheet, seven initial JavaScript files and the established startup byte ceiling.

Menu media creates no iframe until explicit Play.

---

## Reliability contract

Preserve:

- one-pair/no-reroll Club Assignment;
- save-before-reveal rollback;
- refresh/Continue same-pair recovery;
- explicit Transfer Window → Guess → Signing → Completed phases;
- canonical Transfer values/verdicts;
- critical Transfer save/rollback;
- debounced/deduplicated drafts;
- persisted Transfer deadline;
- Season Review with no persistence before final confirmation;
- reviewed-snapshot fingerprint verification;
- Season completion rollback;
- centralized state-aware Back routing;
- completed-showdown recovery;
- isolated Settings preferences;
- one analytics engine;
- derived/read-only career analytics;
- shell-owned asset revision;
- stale async-operation identity guards;
- reduced-motion behavior;
- Chromebook/mobile viewport guards.

---

## Automated validation

Six GitHub Actions gates now protect v0.95:

- **Validate Static App** — syntax, scoring, route matrix, Club Assignment, original crests, startup budget, Back authority and responsive shell.
- **Validate Home Bootstrap** — current Home IDs, seven media choices, Play/Mute initialization and revision coherence.
- **Validate Transfer Workstream** — accepted r5 Transfer state/data/selectors.
- **Validate Settings Workstream** — accepted r6 preference/accessibility/reset isolation.
- **Validate Statistics Workstream** — completed-history analytics fixtures and shared/lazy analytics architecture.
- **Validate Season Review** — r9 pre-commit snapshot/persistence/rollback boundary and responsive review presentation.

Automated checks do not replace owner Chromebook/mobile acceptance. See `NEXT_TASK.md` for the r9 browser checklist.

---

## Remaining release path

1. **Workstream 5 — current r9 Season Review browser acceptance**
2. **Workstream 6 — final v0.95 polish/regression**
   - includes the owner-requested quality-gated FIFA-era navigation transition and original micro click-feedback experiment;
   - ship it only if it is smoother than the current behavior on real Chromebook/mobile devices and fully respects reduced-motion/central routing.
3. **v1.0 Complete Release Candidate / Final Release**

No v0.17/v0.18 replacement roadmap is planned.