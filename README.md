# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Application version:** v1.0.1 — Stable
**Runtime asset revision:** `1.0.1-r2`
**Current phase:** bounded Version 1 stability hardening
**Accepted foundation:** deployed r13 visual immersion plus r12 release stabilization
**Next lane:** v1.0.x soak exit, then staged v1.1.0 data safety

## Development entry point

The project design phase is complete. Do not restart planning or replace established architecture.

Read in this order:

1. `PROJECT_STATE.md` — exact implementation, locked rules, architecture and roadmap status.
2. `ROADMAP_AMENDMENTS.md` — later owner-approved requirements.
3. `NEXT_TASK.md` — current browser gate and exact next workstream.
4. `CHANGELOG.md` — implementation/stabilization history.
5. `STABILITY_PLAN_V1.0.X.md` — external-review disposition, finite patch scope and refined v1.1 split.
6. `RELEASE_V1.0.1.md` — current patch changes, gates, exclusions and rollback.
7. `RELEASE_V1.0.0.md` — original stable features, limits, storage/recovery and browser evidence.
8. `THIRD_PARTY_NOTICES.md` — intentional external font/media source/license notes.
9. current source — highest implementation authority.
10. original Project Bible — blueprint where later decisions/current source have not intentionally superseded it.

The original release path **v0.95 → v1.0** is complete.

---

## v1.0.1 — Stability hardening

v1.0.1 preserves the exact accepted Version 1 competition and presentation while making the broadest release evidence reproducible inside the repository.

The new Stability Lane workflow owns real Chromium and axe coverage, runs the complete Chromebook/mobile journey twice, exercises corrupt storage, quota rejection, rapid input, reload, browser leave/return and double-submit paths, then verifies every deployed runtime byte and repeats the journey on the public Pages URL after a main update.

The expanded mobile Season Review scan reproduced one serious contrast issue in the four unawarded achievement labels. Their text token changes from `#74818a` to `#52616b`, raising measured contrast on the existing light background from 3.51:1 to 5.63:1. No gameplay, route, storage schema, accepted visual composition or persistent key changes.

See `STABILITY_PLAN_V1.0.X.md` for the review disposition and finite lane exit, and `RELEASE_V1.0.1.md` for the patch record.

---

## Version 1 stable — sealed from accepted r13

r12 deployed the final functional stabilization. The owner's target-Chromebook review then identified two visual release blockers: the Home shell was too small and visually flat at a 1920 × 1080 Chromebook window, and the earlier pre-menu loading presentation had disappeared.

Accepted r13 resolved both requirements without changing gameplay, routes or storage:

- a wider proportional Home shell that uses a 1510 px safe desktop canvas while retaining tablet, mobile and low-height breakpoints;
- a clearer hierarchy of blue, brushed-silver and graphite tiles, stronger type scale, restrained bevels and FIFA-17-era yellow/cyan accents using original project CSS;
- a cinematic, cosmetic startup scene with an original `CM17` identity, split composition, finite progress treatment and a large locally optimized Marco Reus photograph;
- a properly attributed Tim Reckmann photograph from Wikimedia Commons under CC BY 2.0, reused from local cache on Home with no runtime image-host dependency;
- bounded startup timing of about 1.9 seconds in normal motion and 220 ms for reduced motion, with the app inert and hidden from assistive technology until the startup exits.

The initial dependency shape remains one eager local stylesheet and seven eager local scripts. The deliberate visual-release budgets are now 165 KB raw / 37.5 KB gzip for code, 95 KB for the portrait and 260 KB combined first-party startup; the exact candidate measures 163,887 bytes raw, 36,681 bytes gzip and 89,008 bytes for the portrait. Optional gameplay, analytics, Settings and media resources remain lazy.

All 22 deterministic blocks across nine workflows pass. Real Chromium passes 98 complete-flow checkpoints and 23 WCAG scans, plus dedicated startup/Home checks at 1920 × 912, 1366 × 768, 768 × 1024 and 390 × 844 with normal and reduced motion, no horizontal escape, duplicate ID, failed local asset or JavaScript runtime error.

Version 1 seals that accepted behavior under `v1.0.0` / `1.0.0-r1`. See `RELEASE_V1.0.0.md` for the stable release record and `NEXT_TASK.md` for the bounded stability lane.

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

`assets/marco-reus-2015-cc-by.webp` is the only new first-party startup image. It is a locally transformed 900 × 1520 WebP and remains below the dedicated 95 KB ceiling.

`js/screens.js` is the sole route/history authority. `js/storage.js` remains persistence authority. Statistics remain derived; Season Review remains ephemeral.

---

## Automated validation

Nine GitHub Actions gates protect the stable v1.0 build:

- **Validate Static App** — syntax, scoring, route matrix, Club Assignment, procedural crests, startup budget, Smart Back and responsive shell.
- **Validate Home Bootstrap** — Home IDs/media bootstrap/revision coherence.
- **Validate Transfer Workstream** — accepted Transfer state/data/selectors.
- **Validate Settings Workstream** — preference/accessibility/reset isolation.
- **Validate Statistics Workstream** — analytics fixtures and shared/lazy architecture.
- **Validate Season Review** — non-persistent Review and confirmation-only transaction boundary.
- **Validate League Confirmation** — explicit Continue, save-before-navigation, rollback and refresh/resume route boundary.
- **Validate Final Polish** — transition ordering/stale cleanup, reduced motion, route focus, original feedback synthesis, preference migration, accessibility and bundle budgets.
- **Validate V1 Visual Immersion** — exact stable cache identity, local portrait integrity/licensing, responsive metallic shell, finite startup lifecycle, reduced motion and startup budgets.

The owner accepted the deployed r13 visual baseline. Automated checks and deployed-byte verification continue to protect that decision.

---

## Stable baseline and next lane

Version 1 is the accepted one-device local baseline. v1.0.1 implements the bounded browser CI, public-deployment smoke, failure fixtures and one reproduced accessibility fix without changing the competition contract.

Version 1.1 data-safety and backup work begins only after the v1.0.1 release and soak gates exit cleanly. v1.0.2 remains defect-only. No replacement v0.17/v0.18 roadmap is planned.
