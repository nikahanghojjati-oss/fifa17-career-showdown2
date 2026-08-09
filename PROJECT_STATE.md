# PROJECT STATE — Career Mode Showdown

## Authority / continuation rule

This project is already designed and implemented through the current v0.95 convergence milestone. Do not restart planning, replace accepted architecture, or infer completion from filenames/comments alone.

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

**Application version:** v0.95.0 — Polish & Blueprint Alignment
**Runtime asset revision:** `0.95.0-r11`
**Hosting:** GitHub Pages
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage
**Product mode:** exactly two managers, one device/browser, one active showdown
**Current milestone:** original v0.95 Polish / Blueprint Alignment
**Current activity:** Workstream 6 final v0.95 polish / regression candidate
**Owner-accepted gates:** `0.95.0-r4`, `r5`, `r6`, `r8`, `r9`, `r10`
**Owner acceptance pending:** `0.95.0-r11` final polish candidate
**Next after r11 acceptance:** v1.0 Complete Release Candidate / Final Release

r11 completes the planned Workstream 6 implementation inside v0.95. It does not create a new roadmap branch.

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

# r11 — Workstream 6 final polish / regression — current gate

## Route presentation

`js/screens.js` remains the sole router and now owns a bounded presentation lifecycle around successful route commits.

Preserve:

- legality checks and critical-write flush before presentation;
- immediate destination commit with no artificial transition wait;
- 180 ms forward/back `transform` + `opacity` entrance;
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

Initial shell remains one local stylesheet plus seven local scripts. The raw startup ceiling is 155 KB and the more meaningful gzip-compressed ceiling is 35 KB. `js/menuFeedback.js` remains lazy and capped at 5.5 KB.

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

`0.95.0-r11`

Every initial local asset uses the same revision. Lazy assets derive it from the shell. Never reuse a deployed revision after changing runtime bytes.

---

# Workstream 6 — implemented; owner acceptance pending

Final v0.95 polish/regression now includes accessibility/focus, responsive consistency, performance, persistence/navigation/gameplay regression and the owner-approved **quality-gated FIFA-era navigation transition + original micro click-feedback experiment** in `ROADMAP_AMENDMENTS.md`.

The implementation does not create a second router, delay failed/blocked critical navigation or copy EA/FIFA assets/audio. Reduced Motion removes theatrical route state. Owner Chromebook/mobile testing remains the final quality decision; simplify or omit an effect if it lowers perceived quality.

After r11 acceptance, move directly to **v1.0 Complete Release Candidate / Final Release**.
