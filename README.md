# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Application version:** v1.1.2 — Maintenance Candidate
**Runtime asset revision:** `1.1.2-r1`
**Current phase:** Candidate B — read-only Import Analysis + Migration Preview; Candidate A remains protected and Candidate C restore remains blocked
**Protected surface:** the owner-liked cinematic loading screen remains regression-protected
**Current developer entry:** `00_DEVELOPER_START_HERE.md`
**Next roadmap candidate after Candidate B production proof:** Candidate C — Atomic Restore + Recovery UX
**Post-v1 execution roadmap:** `POST_V1_ROADMAP_EXECUTION.md`

## Development entry point

The project design phase is complete. Do not restart planning, replace established architecture, or reconstruct the current state from old chats before reading the repository handoff.

Read in this order:

1. `00_HANDOFF_GOLDEN_RULE.md` — permanent owner-mandated continuous public handoff protocol.
2. `00_DEVELOPER_START_HERE.md` — canonical fast bootstrap, authority order, current production state, locked systems and exact decision tree.
2. `NEXT_TASK.md` — current owner gate and the exact implementation path that becomes legal next.
3. `POST_V1_ROADMAP_EXECUTION.md` — dependency-ordered post-v1 execution guide and source-grounded milestone boundaries.
4. current source — highest implementation authority when documentation and implementation differ.
5. `PROJECT_STATE.md` — established system contracts, architecture and accepted historical baselines.
6. `ROADMAP_AMENDMENTS.md` — owner-approved pre-v1 amendments and completed workstreams.
7. `STABILITY_PLAN_V1.0.X.md` — finite stability-lane philosophy and original v1.1 A/B/C split.
8. `CHANGELOG.md` — implementation/stabilization history.
9. `RELEASE_V1.0.1.md` and `RELEASE_V1.0.0.md` — stable release evidence and rollback context.
10. `THIRD_PARTY_NOTICES.md` — intentional external font/media source/license notes.
11. the `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION*.md` files — detailed chronology when source/decision archaeology is genuinely required.
12. original Project Bible — blueprint where later decisions/current source have not intentionally superseded it.

The original release path **v0.95 → v1.0** and the finite v1.0.2 clean-anchor maintenance lane are complete. v1.1.0 Candidate A is also merged, deployed and technically proven. The current clean-stability seal exists to reproduce that production state against every permanent feature/workstream/release gate before further roadmap work. The owner-liked loading screen and clean player-anchor architecture remain protected; owner real-device art-direction acceptance remains separate from automated proof.

---

## v1.1.2 — Candidate B Import Analysis + Migration Preview

Candidate B adds a preview-only import workflow to the existing lazy Data Management surface. A local backup is size-gated, parsed, checked against the Candidate A format, SHA-256 verified, schema validated and passed through explicit ordered migrations before any conflict preview is shown. Existing Showdown IDs remain strings for comparison. New, exact duplicate, same-effective-revision, different-revision and malformed/unresolvable outcomes are surfaced instead of silently merged.

The feature performs zero canonical localStorage writes/removals and exposes no restore/apply action. Candidate C remains the only future stage allowed to commit imported data. Historical schema fixtures, hostile JSON structure, oversized files, tampering, corrupt local bytes, large imports, keyboard/drop/touch/mobile accessibility and exact deployed-site behavior are permanently gated.

See `RELEASE_V1.1.2.md` and `CAREER_MODE_SHOWDOWN_V1.1.2_CANDIDATE_B_HANDOFF.md`.

## v1.1.1 — James Rodríguez Real Madrid source refresh

v1.1.1 is a finite visual maintenance patch requested after the sealed v1.1.0 build. Create Showdown now uses a different Real Madrid-authored James Rodríguez photograph from September 2016, licensed CC BY 3.0 through Wikimedia Commons. The complete 863 × 1080 source frame is preserved and shown with the existing clean-anchor `object-fit: contain` policy, so the new source is not subjected to a second blind responsive crop.

The prior 2019 James runtime derivative is removed from the active asset set. Rashford, Martial, Messi, Lahm and the owner-liked Marco Reus Home/loading surfaces remain protected. Candidate A backup/export behavior, gameplay, routes, storage schema and Transfer/Season state machines are unchanged.

For this build, permanent release evidence is strengthened around exact source fingerprints, active-asset exclusivity, no-crop geometry, physical-pixel scale, frame occupancy, face-safe accent placement and four-viewport browser evidence. The owner additionally requires two independent executions of every permanent gate family on one frozen final SHA. Candidate B remains the next substantive roadmap step after this maintenance patch is closed.

See `RELEASE_V1.1.1.md` and `CAREER_MODE_SHOWDOWN_V1.1.1_JAMES_SOURCE_REFRESH_HANDOFF.md` for exact provenance and release evidence.

## v1.1.0 — Data Safety and Recovery / Candidate A

v1.1.0 adds a versioned, SHA-256-protected, human-readable local backup export for active Showdown, Legacy and preferences without mutating canonical storage. It also fixes five bounded maintenance defects and restores FIFA-style diagonal accent energy only in face-safe lower-body zones. Candidate B/C remain deferred.

## v1.0.2 — Clean-anchor footballer photography maintenance

v1.0.2 does not add a feature workstream. It fixes reproduced real-device presentation defects while keeping Version 1 gameplay/storage/routing intact.

The footballer presentation rule is now **player first**: James, Rashford and Martial use clean photo anchors with decorative geometry behind the photograph and copy outside the image zone. Desktop Home Reus is a rectangular right-side tile photograph instead of a diagonal head/neck cut. The cinematic loading presentation remains protected.

Permanent visual/browser gates enforce the clean-anchor layering, crop safety, responsive geometry, source provenance and Home/loading separation at Chromebook, near-breakpoint and mobile sizes.

Runtime merge `7a573ff2691b6143ecbc53df589822d5609f5e05` and Pages deployment `5852810024` are verified. Post-merge Licensed Football Visuals and Stability Lane both passed, including exact deployed-byte verification and the complete public journey. Owner art-direction acceptance remains open.

See `RELEASE_V1.0.2.md` for the exact maintenance scope and rollback boundary.

---

## v1.0.1 — Stability hardening

v1.0.1 preserves the exact accepted Version 1 competition and presentation while making the broadest release evidence reproducible inside the repository.

The Stability Lane workflow owns real Chromium and axe coverage, runs the complete Chromebook/mobile journey twice, exercises corrupt storage, quota rejection, rapid input, reload, browser leave/return and double-submit paths, then verifies every deployed runtime byte and repeats the journey on the public Pages URL after a main update.

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

All 22 deterministic blocks across nine original v1 workflows passed at that accepted baseline. Real Chromium passed 98 complete-flow checkpoints and 23 WCAG scans, plus dedicated startup/Home checks at 1920 × 912, 1366 × 768, 768 × 1024 and 390 × 844 with normal and reduced motion, no horizontal escape, duplicate ID, failed local asset or JavaScript runtime error.

Version 1 sealed that accepted behavior under `v1.0.0` / `1.0.0-r1`. Later v1.0.1/r5 work preserved its competition and Home/Reus foundations while strengthening release evidence and correcting owner-rejected football photography. See `NEXT_TASK.md` for the current bounded gate.

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

`assets/marco-reus-2015-cc-by.webp` remains the first-party startup portrait. It is a locally transformed 900 × 1520 WebP and remains below the dedicated 95 KB ceiling.

`js/screens.js` is the sole route/history authority. `js/storage.js` remains persistence authority. Statistics remain derived; Season Review remains ephemeral.

---

## Automated validation

Eleven permanent GitHub Actions workflows now protect the stable v1.0.1/r5 build:

- **Validate Static App** — syntax, scoring, route matrix, Club Assignment, procedural crests, startup budget, Smart Back, release/document coherence and responsive shell.
- **Validate Home Bootstrap** — Home IDs/media bootstrap/revision coherence.
- **Validate Transfer Workstream** — accepted Transfer state/data/selectors.
- **Validate Settings Workstream** — preference/accessibility/reset isolation.
- **Validate Statistics Workstream** — analytics fixtures and shared/lazy architecture.
- **Validate Season Review** — non-persistent Review and confirmation-only transaction boundary.
- **Validate League Confirmation** — explicit Continue, save-before-navigation, rollback and refresh/resume route boundary.
- **Validate Final Polish** — transition ordering/stale cleanup, reduced motion, route focus, original feedback synthesis, preference migration, accessibility and bundle budgets.
- **Validate V1 Visual Immersion** — stable cache identity, local portrait integrity/licensing, responsive metallic shell, finite startup lifecycle, reduced motion and startup budgets.
- **Validate Licensed Football Visuals** — required player-photo provenance, authored-crop contracts and real desktop/near-breakpoint/mobile browser presentation.
- **Validate Stability Lane** — storage/release contracts, two consecutive full Chromium/provenance/Home/photo audit cycles, exact Pages byte verification and deployed complete-journey smoke.

The earlier Home/Reus visual baseline remains protected. The current r5 James/Rashford/Martial implementation is technically merged/deployed/green, while owner real-device art-direction acceptance remains explicitly open.

---

## Stable baseline and next lane

Version 1 is the accepted one-device local competition baseline. v1.0.1/r5 preserves that contract while incorporating the latest owner-directed visual correction and the strongest repository/deployment validation lane.

The current finite gate is owner real-device review of the r5 player presentation. If new rejection evidence arrives, fix only the reproduced visual issue from current r5. If the owner accepts r5 or explicitly defers the review, `v1.1.0 Data Safety and Recovery` becomes Current and the first implementation branch is Candidate A only: Versioned Backup Envelope + Non-Mutating Export.

Do not skip ahead to Candidate B/C, PWA, profiles, cloud or two-device work. See `NEXT_TASK.md` and `POST_V1_ROADMAP_EXECUTION.md` for the exact dependency gates.
