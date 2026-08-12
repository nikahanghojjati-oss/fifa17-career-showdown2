# PROJECT STATE — Career Mode Showdown

## Authority / continuation rule

This project is already designed and implemented through the v1.0.2 visual-maintenance patch. Do not restart planning, replace accepted architecture, or infer completion from filenames/comments alone.

Authority when sources disagree:

1. current source on `main`;
2. explicit later owner decisions/amendments;
3. `PROJECT_STATE.md`;
4. `ROADMAP_AMENDMENTS.md`;
5. `NEXT_TASK.md`;
6. original Project Bible / architecture / release documentation;
7. older historical records/conversations.

Current source is implementation authority. Browser acceptance remains required for visual/interaction work after machine validation.

---

# Current implementation

**Application version:** v1.1.2 — Maintenance Candidate
**Runtime asset revision:** `1.1.2-r1`
**Hosting:** GitHub Pages
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage
**Product mode:** exactly two managers, one device/browser, one active showdown
**Current milestone:** v1.1.2 — Candidate B complete; Candidate C Atomic Restore + Recovery UX next
**Current activity:** Candidate B is merged/deployed/proven; next runtime work is Candidate C atomic restore with exact raw snapshots, explicit choices, storage-authority writes and verified rollback
**Protected loading-screen status:** owner explicitly likes the loading presentation; its composition/timing remains regression-protected
**Runtime change class:** lazy Data Management import-analysis module + migration/conflict preview + validation gates; gameplay, scoring, routes, storage schema/keys, Candidate A export semantics and state-machine rules remain locked
**Current runtime authority:** v1.1.2 / `1.1.2-r1` at merge `6dfea100829016eee4820b342729b8c823426f95`
**Next roadmap candidate:** Candidate C — Atomic Restore + Recovery UX

r11 completed the planned Workstream 6 presentation implementation inside v0.95. The end-to-end r11 browser audit then exposed a Season Review integration regression and stale shell state. r12 fixed and deployed those release blockers without adding a feature roadmap branch.

The owner's deployed-r12 Chromebook review then made two visual requirements mandatory for v1: materially improve the undersized/flat Home layout and restore a cinematic pre-menu presentation with a large, properly licensed Marco Reus image. r13 implements both while preserving all r12 behavior.

An external review then raised generic maintainability, edge-case, accessibility, and future-scaling concerns. Source inspection rejected an unsupported rewrite or framework migration, while the valid risk categories became the finite v1.0.1 Stability Lane implementation in `STABILITY_PLAN_V1.0.X.md`.

---

# v1.1.2 — Candidate B Import Analysis + Migration Preview

Candidate B is the read-only second stage of v1.1 Data Safety and Recovery. It verifies a selected Candidate A backup, validates current and supported historical schemas, previews deterministic migrations, classifies duplicate/conflicting Showdown identities, and explains active/Legacy/preference effects without restoring anything.

Candidate B is lazy inside the existing Legacy/Data Management surface. It performs zero canonical localStorage writes/removals and makes no network request. Oversized files are rejected before File.text(), unsupported future formats/schemas fail closed, hostile object keys/depth are rejected, and exact current storage bytes are preserved during preview.

Candidate B release evidence is complete. Candidate C is now the first legal stage allowed to write imported state and must preserve Candidate B as the read-only analysis boundary.

# v1.1.1 — James Rodríguez Real Madrid source refresh

The owner explicitly requested a different James Rodríguez picture source while keeping the subject in his Real Madrid period. The selected source is the Real Madrid-authored CC BY 3.0 Commons photograph `James Rodríguez in September 2016 - 02.jpg` from 28 September 2016.

The complete 863 × 1080 licensed source frame is preserved as `assets/football/james-rodriguez-real-madrid-2016-smart-v111.webp`, with no source crop and no runtime secondary crop. The clean-anchor/face-safe diagonal system remains the visual architecture. The replaced 2019 James runtime derivative is removed from the active asset set and is guarded against returning.

This is a bounded maintenance patch, not Candidate B. Candidate A backup/export remains unchanged. Candidate B import analysis remains the next substantive roadmap candidate after v1.1.1 is merged, deployed and visually accepted or explicitly deferred.

Release evidence for this patch is intentionally deeper on the changed failure surface and must execute every permanent gate family twice on the exact frozen SHA.

# v1.1.0 — Data Safety and Recovery / Candidate A

The owner approved v1.0.2 and unlocked the post-v1 roadmap. Candidate A adds a versioned, checksum-protected, human-readable local backup export without introducing restore writes or a second persistence authority. Five maintenance bugs are fixed in the same bounded release. FIFA-style diagonal accents return only in lower-body face-safe zones; the loading screen remains protected.

Candidate B/C remain dependency-blocked until this release is merged, deployed and proven.

## v1.1.0 Clean Stability Seal

A post-release clean-build pass was requested on August 11, 2026. It branches directly from the final deployed/proven `main` baseline and does not invent a new application version when no runtime defect reproduces. The clean-build release condition is stricter than a single CI summary: each permanent feature/workstream workflow must pass independently, the five-run release burn-in must be 5/5, Stability must complete two consecutive Chromium cycles, and after merge GitHub Pages must again pass exact-byte verification plus runtime provenance, Home/Reus, football-photo, Candidate A export and the complete public journey.

The first frozen clean candidate reproduced **zero runtime defects** across all twelve permanent workflows. The only defect found was stale continuation metadata in the highest-authority bootstrap documents, which still described the already-completed v1.0.2/PR #14 path as current. That documentation defect is corrected without changing application bytes.

# v1.0.2 — clean-anchor footballer photography maintenance

## Owner-reproduced defects

The owner supplied current Chromebook screenshots showing three real presentation failures after r5:

- James Rodríguez was washed by the light overlay, reducing facial detail;
- Marcus Rashford's face was crossed by decorative diagonal geometry;
- desktop Home Marco Reus used a diagonal clipped photo edge that looked unattractive around the head/neck.

The owner explicitly likes the loading screen. That presentation is protected rather than redesigned.

## Maintenance architecture

v1.0.2 changes the footballer-photo rule from **graphics over photograph** to **photograph as clean anchor**.

James/Rashford/Martial now declare `treatment: "clean-anchor"`. Their decorative ambience is behind the photograph, the image frame is above decorative pseudo-elements, and the copy occupies its own plate outside the photo anchor. The underlying licensed r5 derivative files remain unchanged and continue to use `object-fit: contain`.

Desktop Home Reus is integrated as a rectangular right-side player-photo anchor with no diagonal `clip-path` through the head/neck. The accepted mobile Reus treatment stays separately bounded. The startup/loading Reus presentation remains protected.

## Robustness

Permanent browser gates now protect:

- clean-anchor treatment metadata;
- decorative layers behind required player photographs;
- copy/photo non-overlap;
- crop-safe full derivative rendering;
- James tuned desktop and near-breakpoint geometry;
- desktop Reus rectangular anchor and protected mobile Reus path;
- real 1366×768, 940×700 and 390×844 visual journeys;
- existing source/license/provenance and Messi/Lahm contracts.

v1.0.2 advances application/cache identity to `v1.0.2` / `1.0.2-r1` while preserving all gameplay and persistence contracts.

Owner visual acceptance remains a separate final gate after deployment.

---

# v1.0.1 — stability hardening

## Reproducible evidence

v1.0.1 adds the tenth GitHub Actions workflow and moves the broad browser evidence into repository-owned scripts with pinned Node 24 compatible tooling.

Each complete run covers 70 functional/responsive checkpoints and 36 axe scans across a 1366 × 768 Chromebook journey and 390 × 844 reduced-motion touch/mobile journey. Pull requests and main run the journey twice consecutively. Main additionally waits for Pages revision convergence, compares every runtime file byte for byte, and repeats the complete journey on the public URL.

Failure fixtures cover corrupt active/Legacy/preference bytes, quota rejection, rapid Start activation, rapid Transfer draft replacement, reload, Smart Back, browser leave/return, and double Season confirmation. Corrupt bytes fail closed and remain available rather than being silently erased; quota rejection blocks navigation and rolls back unsaved state.

## Reproduced fix

The expanded mobile Season Review scan found four unawarded achievement labels at 3.51:1 contrast. `css/season.css` now uses `#52616b` on `#edf1f2`, producing 5.63:1. A deterministic Season Review assertion and the browser scan protect the fix.

No storage schema, gameplay rule, route, state-machine phase, media selection, startup timing, portrait asset or accepted layout changes.

## Lane exit

If candidate, PR, post-merge, byte-parity, deployed-browser and owner-soak gates remain clean, v1.0.x exits without a planned v1.0.2. A v1.0.2 build is allowed only for a reproduced release defect. The next feature milestone remains staged v1.1.0 Data Safety and Recovery.

---

# Current product flow

Main Menu  
→ Create Showdown  
→ League Wheel  
→ **League Selected checkpoint**  
→ explicit **CONTINUE TO CLUB ASSIGNMENT**  
→ **League Confirmed checkpoint**  
→ Club Assignment / Two-Pack Reveal  
→ Rivalry Confirmation  
→ Showdown Home  
→ Transfer Window  
→ Guess Entry  
→ Signing Entry  
→ Transfer Verdicts  
→ Season Results  
→ Season Review  
→ Edit Results OR Confirm & Save  
→ Season Summary  
→ next Season / completed Showdown  
→ Legacy / Statistics / Trophy Room

---

# r13 — V1 visual immersion — accepted stable foundation

## Owner-required blockers

The target screenshot is a 1920 × 1080 Chromebook window with an effective page viewport near 1920 × 912. In r12 the 1180 px Home canvas used only about 61% of that width and left most of the usable height as a flat blue field. The owner also required the earlier loading presentation to return before Home.

Preserve the r13 response:

- Home uses a proportional safe width capped at 1510 px and a flexible height rather than a fixed Chromebook-only composition;
- breakpoints cover desktop, low-height laptop/Chromebook, tablet and small mobile layouts;
- tile hierarchy uses original metallic blue, brushed-silver and graphite treatments with restrained yellow/cyan accents;
- the main career tile remains dominant and reuses the locally cached athlete photo;
- startup is cosmetic, silent and finite; it does not become a new route or persistence checkpoint;
- startup keeps `#app` inert and `aria-hidden` until dismissal, then removes both states exactly once;
- normal startup minimum is 1900 ms, reduced-motion startup is 220 ms and exit cleanup is bounded at 240 ms;
- startup and Home use `assets/marco-reus-2015-cc-by.webp`, a 900 × 1520 / 89,008-byte local WebP transformed from Tim Reckmann's CC BY 2.0 Wikimedia photograph;
- attribution, source, license, transformations and non-endorsement are recorded in `THIRD_PARTY_NOTICES.md`.

No EA/FIFA logo, official loading-screen art, proprietary game font, club badge or copied interface bytes are bundled. The composition is deliberately influenced by mid-2010s football-game menus but remains an original project treatment.

## r13 performance and regression evidence

The dependency count remains exactly one eager local stylesheet and seven eager local scripts. Updated bounded ceilings are 165,000 raw code bytes, 37,500 gzip code bytes, 95,000 portrait bytes and 260,000 combined first-party startup bytes. Exact r13 measurements are 163,887 raw, 36,681 gzip and 89,008 portrait bytes.

All nine workflows / 22 deterministic blocks pass. Real Chromium passes 98 complete-flow checkpoints and 23 automated WCAG scans, including startup isolation, active/completed Home, explicit League confirmation, two-pack reveal, Transfer phases/verdicts, max-11 Review/Edit/Confirm, reload recovery, optional destinations and Settings. Separate visual checks cover 1920 × 912, 1366 × 768, 768 × 1024 and 390 × 844 under normal and reduced motion with no horizontal viewport escape, duplicate ID, failed local asset or JavaScript runtime error.

The owner accepted the exact deployed r13 presentation on August 9, 2026. The v1.0.0 seal changes release identity and records only.

---

# r12 — final release stabilization — deployed baseline

## Season Review Edit integration

The r11 end-to-end browser audit proved that **EDIT RESULTS** was intercepted as Smart Back and returned to Showdown Home.

Root cause:

- `js/seasonEngine.js` gave the Edit control the router-reserved `.backButton` class;
- `js/screens.js` correctly captures `.backButton` actions before feature-level bubbling handlers;
- the Edit handler therefore never executed.

Preserve the r12 correction:

- Edit Results uses `.compactButton`, not `.backButton`;
- centralized Smart Back remains unchanged;
- Review → Edit stays on `seasonEntry` and restores the populated form;
- the ephemeral review draft is cleared and a fresh Review is required;
- no Review/Edit persistence key or write is introduced.

The Season Review workflow statically protects the control classification. Runtime DOM simulation dispatches the real click through centralized capture delegation and verifies mode, draft invalidation and value preservation.

## Shell save indicator

Home bootstrap and successful New Showdown creation now synchronize `#seasonIndicator` from the same saved state used by Continue Career:

- no active save → `No Active Showdown`;
- active save → `Season N / Total`;
- completed save → `Showdown Complete`.

The New Showdown path saves first, then refreshes shell state, then opens League selection. A failed save cannot advertise the unsaved candidate.

## Completed-season grammar

Completed Showdown Home uses the singular `1 season completed` and pluralizes other counts.

## Release-maintenance integrity

- `js/menuExperience.js` owns interaction timing and `js/menuFeedback.js` owns synthesis timing under distinct helper names;
- the removed Home Trophy Room tile has no runtime fallback or dead direct-binding initializer;
- optional destinations remain bound only through `js/optionalModules.js`;
- Rule Book Back uses centralized Smart Back only;
- delete/reset operations refresh global shell state through `refreshMainMenuExperience()`;
- Static App validation rejects duplicate named functions across runtime modules and the retired fallback architecture.

Release evidence for r12: all eight workflows / 21 deterministic blocks passed, and Real Chromium 149 passed 98 release checkpoints and 22 accessibility scans. Those functional fixes are deployed and must remain intact beneath the r13 visual layer.

## r11 browser evidence carried forward

The live r11 audit passed route transitions/focus, Reduce Motion, feedback preference persistence, lazy Home media, League confirmation, two-pack reveal, Transfer phases/draft recovery/verdicts, max-11 Review/confirmation, completed recovery, Legacy and analytics. r12 repeated and corrected its critical header and Review → Edit paths; r13 repeats them again as part of the complete-flow visual regression.

---

# r11 — Workstream 6 final polish / regression — implemented baseline

## Route presentation

`js/screens.js` remains the sole router and now owns a bounded presentation lifecycle around successful route commits.

Preserve:

- legality checks and critical-write flush before presentation;
- immediate destination commit with no artificial transition wait;
- 180 ms forward/back `transform` entrance with full content opacity at every accessible frame;
- one original CSS route rail using existing yellow/cyan tokens;
- animation-end cleanup plus 260 ms fallback;
- stale transition cancellation and navigation-revision protection;
- reduced-motion path with no theatrical route state;
- destination heading focus and scroll reset;
- `aria-hidden` / `aria-labelledby` screen synchronization;
- optional feedback failure isolated from navigation success.

The older entry marker was removed on the next animation frame and could cancel the intended 130 ms animation. Do not restore frame-immediate cleanup.

## Original micro feedback

`js/menuFeedback.js` is a lazy original Web Audio synthesizer.

Preserve:

- no recorded/bundled/fetched interface audio;
- no EA/FIFA waveform imitation or proprietary asset;
- explicit eligible user interaction before feedback;
- consumption only after successful route commit;
- Home media playback suppression;
- 110 ms repeat cooldown;
- no audio context at startup;
- hidden-page suspension;
- silent failure when Web Audio is unavailable/blocked.

Application preference schema is now version 2:

- `reducedMotion: boolean`;
- `menuFeedback: boolean`, default `true`.

Existing version-1 preference records migrate in memory with `menuFeedback: true`. Settings exposes the feedback preference as a compact accessible switch inside Motion & Feedback. Showdown-data reset still preserves the whole preference record.

## Accessibility / performance

Preserve contextual Transfer-field accessible names through combobox enhancement, setup-label associations, explicit button types, League/Transfer live status, loading-shell isolation and explicit focus-visible styles.

At r11 the initial-shell ceilings were 155 KB raw and 35 KB gzip. r13 deliberately supersedes those code ceilings with 165 KB raw / 37.5 KB gzip plus separate 95 KB portrait and 260 KB combined first-party startup ceilings. The dependency count is unchanged and `js/menuFeedback.js` remains lazy and capped at 5.5 KB.

Dedicated **Validate Final Polish** is mandatory alongside the seven accepted workflows. Current total: 21 deterministic validation blocks across eight workflows.

---

# r10 — League confirmation stabilization — owner accepted

## Reported regression

After a League Wheel spin completed, the UI briefly displayed **CONTINUE TO CLUB ASSIGNMENT** but automatically opened Club Assignment without waiting for the user to press it.

## Root cause

`js/leagueWheel.js` contained a deliberate delayed call to `prepareClubAssignment()` after successful League selection:

- 700 ms normal-motion delay;
- 120 ms reduced-motion delay.

The presentation and runtime therefore contradicted each other.

## Corrected state contract

### `League Selected`

Created only after a successful spin and successful save.

- selected league is permanent for that Showdown;
- no reroll is allowed;
- League Wheel remains visible indefinitely;
- button reads **CONTINUE TO CLUB ASSIGNMENT**;
- refresh / Continue Career canonicalizes back to League Wheel;
- Club Assignment is not a legal route yet.

### `League Confirmed`

Created only by the explicit Continue action.

Before Club Assignment opens:

1. status changes to `League Confirmed`;
2. `saveCurrentShowdown()` must succeed;
3. failed persistence rolls status back to `League Selected`;
4. failed persistence blocks navigation and surfaces an error;
5. only a successful confirmation may call `prepareClubAssignment()`.

If the user later returns Back to the League Wheel before club assignment is completed, the same confirmed league remains and Continue reopens Club Assignment without another league draw.

## Route protection

`js/screens.js` distinguishes the two states:

- no league → League Wheel;
- `League Selected` + no clubs → League Wheel;
- `League Confirmed` + no clubs → Club Assignment;
- valid pair + `Clubs Assigned` → Club Reveal/Rivalry Confirmation;
- valid confirmed pair → normal Showdown route.

This prevents refresh, Continue Career, canonical fallback, Smart Back, or another module from bypassing the explicit League Continue checkpoint.

## Regression gate

Dedicated workflow:

`.github/workflows/validate-league-confirmation.yml`

It protects:

- no post-spin advance timer;
- spin completion cannot call `prepareClubAssignment()`;
- explicit Continue performs save-before-navigation;
- failed confirmation save rolls back and does not navigate;
- `League Selected` refresh/resume stays on League Wheel;
- `League Confirmed` refresh/resume opens Club Assignment;
- existing `Clubs Assigned` confirmation behavior remains intact.

The broader Static App route matrix contains the same two-state distinction.

---

# r9 — Season pre-commit review — owner accepted

The owner tested the new Review / Edit / Confirm system and accepted it in browser testing.

Locked flow:

**Season Results → REVIEW SEASON → EDIT RESULTS or CONFIRM & SAVE SEASON → Season Summary**

Preserve:

- Review is memory-only and performs no localStorage write;
- Review uses canonical max-11 scoring and canonical winner logic;
- deterministic review fingerprint detects changed/tampered reviewed data;
- Edit returns to the same form with entered values intact and invalidates the prior review snapshot;
- Confirm verifies Showdown/Season/Transfer context again;
- Confirm rebuilds scoring/winner from raw reviewed values;
- completion timestamp is created only at confirmation;
- `persistCompletedSeason()` remains the critical transaction;
- save failure restores rounds/currentRound/status/completedAt/score;
- double-submit guard prevents duplicate Season creation;
- `css/season.css` remains lazy with gameplay;
- no Season Review storage key or route exists.

Dedicated **Validate Season Review** remains mandatory.

---

# Other owner-accepted v0.95 baselines

## r4 — FIFA-era presentation / Club Reveal

Preserve fallback-safe Barlow Condensed display hierarchy, original deterministic procedural crests for all 98 Showdown clubs, exactly two sealed packs, same-league/different-club pair chosen once, save-before-reveal rollback, no reroll, `Clubs Assigned` checkpoint, explicit Rivalry Confirmation, refresh recovery and reduced-motion fast path.

## r5 — phased Transfer Challenge

Preserve:

**15-minute window → Guess Entry → critical guess lock → Signing Entry → critical signing lock → canonical verdicts → Season Results**

Rules remain maximum three signings per manager, three opponent guesses, League or Nationality, correctly guessed signing released.

Transfer metadata remains the researched FIFA-17-era canonical league/nationality dataset with searchable controlled selectors. It does not expand the five-league Showdown Wheel.

## r6 — Settings / motion accessibility

Settings remains a lazy modal. Preference key:

`careerModeShowdown.preferences`

System/browser reduced motion always wins. User Reduce Motion also forces reduced non-essential motion. Workstream 6 extends the same preference record with the independent `menuFeedback` switch. Showdown data reset preserves application preferences.

## r8 — Career Statistics / Trophy Room / Home bootstrap

Home top-level analytics destination is **STATISTICS**.

- Career Statistics = completed-career all-time analytics.
- Rivalry Statistics = current loaded Showdown only.
- Trophy Room = honours/cabinets/all-time records.
- `js/analytics.js` remains the single analytics calculation engine.
- no statistics persistence layer.
- Home media remains seven accepted choices and no iframe loads before Play.
- Home initialization must fail loudly if its required media subsystem is incomplete.

---

# Locked competition rules

Per manager per Season:

- Champions League winner: **+5**
- Domestic league winner: **+3**
- Main domestic cup winner: **+1**
- 100 league points and/or 100 league goals: **+1 maximum for the pair**
- Top Scorer and/or Top Assist: **+1 maximum for the pair**
- maximum: **11**

Season winner:

1. higher score wins;
2. equal non-zero scores = Draw;
3. only 0–0 uses better league position, then more league points, otherwise Draw.

Match rule:

- Career Mode matches normally simulated;
- Champions League final may be played or simulated;
- main domestic cup final may be played or simulated.

---

# Locked v1 product scope

- exactly two managers;
- one device/browser;
- one active Showdown;
- separate FIFA 17 Career Mode saves;
- one selected league per Showdown;
- same league for both managers;
- two different permanent clubs assigned once;
- club reuse across different Showdowns allowed;
- 1 / 3 / 5 / 10 Seasons;
- Showdown League Wheel remains the top five FIFA-17-era European leagues;
- manual result entry;
- localStorage persistence;
- no accounts/backend/cloud/realtime/two-device mode in v1 unless scope is explicitly changed.

---

# Architecture locks

## Navigation

`js/screens.js` is the sole route/history authority.

Preserve centralized Smart Back, bounded/advisory history, state-aware route validation, canonical resume routing, critical-write flush before leaving, and stale-operation cancellation. No other module may manipulate `screenHistory`.

Settings and Season Review are not routes.

## Persistence

Storage authority: `js/storage.js`.

Keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Critical transitions save immediately with rollback. Drafts remain debounced/deduplicated. Completed active save remains safe even if Legacy synchronization fails. Statistics remain derived and Season Review remains ephemeral.

Preference schema version 2 stores `reducedMotion` and `menuFeedback`. Older records normalize without losing the existing motion choice.

## Initial shell

Exactly one local stylesheet plus seven local scripts:

- `css/app.css`
- `js/storage.js`
- `js/showdown.js`
- `js/scoring.js`
- `js/screens.js`
- `js/menuExperience.js`
- `js/optionalModules.js`
- `js/app.js`

## Lazy gameplay

- `data/leagues.js`
- `data/clubs.js`
- `js/dataEngine.js`
- `js/visualIdentity.js`
- `js/showdownUI.js`
- `js/leagueWheel.js`
- `js/clubAssignment.js`
- Transfer metadata/selectors/challenge
- `css/season.css`
- `js/seasonEngine.js`

Analytics, Trophy Room, Legacy, Rule Book, Settings and diagnostics remain lazy secondary modules.

`js/menuFeedback.js` is a lazy non-critical polish module and must never become a startup or navigation dependency.

## Cache identity

`index.html` owns deployed runtime revision:

`1.0.1-r5`

Every initial local asset uses the same revision. Lazy assets derive it from the shell. Never reuse a deployed revision after changing runtime bytes.

---

# Version 1 stable release seal

Version 1 includes the completed v0.95 accessibility, responsive, performance, persistence, navigation and gameplay convergence plus the owner-accepted r13 visual-immersion requirements in `ROADMAP_AMENDMENTS.md`.

The implementation does not create a second router, delay failed/blocked critical navigation or copy EA/FIFA interface assets/audio. Reduced Motion removes theatrical route state and shortens startup. r12 protects Review → Edit and shell synchronization; accepted r13 preserves both while expanding the original responsive presentation.

The exact behavior remains the **Version 1 Stable** contract. v1.0.1 hardens its evidence and fixes one reproduced contrast defect. Feature expansion starts only after the finite stability-lane exit.
