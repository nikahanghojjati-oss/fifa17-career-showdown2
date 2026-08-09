# NEXT TASK

## Current gate: v0.95.0-r8 Workstream 4 stabilization / browser acceptance

Accepted owner/browser gates:

- Workstream 1B / `0.95.0-r4` — FIFA-era presentation, procedural club identities and two-pack reveal;
- Workstream 2 / `0.95.0-r5` — phased Transfer Challenge and canonical FIFA 17 transfer metadata/selectors;
- Workstream 3 / `0.95.0-r6` — Settings and persistent motion accessibility.

Workstream 4 / r7 introduced the blueprint-aligned Career Statistics surface. During owner browser acceptance, a real startup defect was discovered before Workstream 4 was accepted. That defect is fixed in r8.

**Application version:** v0.95.0  
**Asset revision:** `0.95.0-r8`  
**Current workstream:** Workstream 4 — Main Menu Statistics alignment / stabilization  
**Source status:** implemented and machine-validated  
**Owner acceptance:** pending

Stay on Workstream 4 until the owner completes the r7/r8 browser acceptance pass. Do not begin Season pre-commit review / Workstream 5 while this gate remains open.

---

# r8 root-cause fix

## Browser symptom reported during r7 acceptance

On initial site entry diagnostics reported:

`Application integrity check failed. missing UI: menuMediaSelector; integrity problems: menuMusicToggle is not bound, menuMusicMute is not bound, menu media selector contains 0 choices instead of 7`

## Root cause

r7 intentionally replaced the Home `#trophyRoomButton` tile with the blueprint-aligned `#careerStatisticsButton` tile.

`js/menuExperience.js` still contained an older startup prerequisite that queried `#trophyRoomButton` and returned early when any of several Home navigation tiles were absent.

Because the removed Trophy Room Home id no longer existed, `initializeMenuExperience()` stopped before it could:

- generate `#menuMediaSelector`;
- generate the seven soundtrack/trailer choices;
- bind `#menuMusicToggle`;
- bind `#menuMusicMute`;
- finish the Marco Reus/Home enhancement pass;
- mark the menu experience initialized.

The diagnostics warning was therefore accurate. This was not a YouTube failure, localStorage failure, race condition or Chromebook-specific bug.

## Why r7 CI missed it

The existing gates independently verified:

- the new `careerStatisticsButton` existed;
- the analytics route/binding existed;
- the media catalog source still contained the accepted choices;
- diagnostics expected seven media choices.

They did not validate the coupling between the **current Home DOM ids** and the actual `initializeMenuExperience()` prerequisite logic. The old Trophy Room dependency could therefore survive source-level checks while aborting the real browser initializer.

---

# Permanent prevention added in r8

## Menu initialization is no longer all-or-nothing on unrelated navigation tiles

`js/menuExperience.js` now decorates each Home navigation tile independently.

A missing/renamed optional navigation tile can no longer silently prevent the media subsystem from initializing.

The current Statistics tile is explicitly understood as:

`#careerStatisticsButton`

The deprecated Home `#trophyRoomButton` dependency is removed.

## Media bootstrap is its own required subsystem

Initialization now always attempts, in order:

1. Home tile decoration;
2. seven-choice media selector creation;
3. Marco Reus Home treatment;
4. Home UI recache/refresh;
5. placeholder/header rendering;
6. Play/Mute binding;
7. media-control state rendering.

## Explicit post-initialization integrity check

`getMenuExperienceIntegrity()` now verifies immediately that:

- `#menuMediaSelector` exists;
- the exact seven accepted media keys exist;
- Play has its idempotent `musicBound` marker;
- Mute has its idempotent `musicBound` marker.

If that required state is incomplete, Home initialization throws a concrete startup error instead of silently returning and waiting for delayed diagnostics to discover a partial UI.

## Dedicated CI regression gate

New workflow:

`.github/workflows/validate-menu-bootstrap.yml`

It couples the actual current Home shell to the menu initializer and protects against the exact r7 regression by asserting:

- Home uses `careerStatisticsButton`;
- deprecated `trophyRoomButton` is not a Home id;
- the old all-or-nothing Trophy Room prerequisite cannot return;
- the Statistics tile is recognized by the Home decorator;
- the canonical media catalog remains exactly seven choices;
- selector creation remains in the initializer;
- Play/Mute binding remains in the initializer;
- post-init self-validation remains present;
- incomplete initialization fails loudly;
- every initial local asset uses the `0.95.0-r8` cache revision.

This gate is additive to the existing Static App, Transfer, Settings and Statistics workflows.

---

# What remains unchanged from r7

The r8 stabilization changes do not alter the Workstream 4 product design:

1. **Career Statistics** — all-time completed-showdown analytics from Home.
2. **Rivalry Statistics** — currently loaded showdown analytics from Showdown Home.
3. **Trophy Room** — honours cabinets and detailed records opened contextually.

All continue to reuse `js/analytics.js`; no second analytics engine or statistics storage model exists.

r8 does not intentionally change:

- scoring;
- Transfer Challenge rules or phases;
- transfer selectors/data;
- Season Results/Season Summary;
- Club Assignment / Club Reveal;
- League Wheel;
- Settings/motion preference;
- Legacy persistence/data controls;
- centralized Smart Back architecture.

---

# r8 browser acceptance checklist

Hard-refresh the deployed site once before continuing the Workstream 4 test so the browser receives `0.95.0-r8` shell assets.

## A. Immediate startup regression

Expected on first entry:

- no `Application integrity check failed` notice;
- Home finishes loading normally;
- Continue Career metadata resolves instead of remaining in its raw loading state;
- Marco Reus Home treatment remains available;
- soundtrack/trailer selector appears with exactly seven choices;
- Play Track works;
- Mute becomes available only after media loads;
- no media iframe exists before Play.

## B. Workstream 4 Statistics acceptance

Continue the r7 test on r8:

- Home top-level tile says STATISTICS;
- Career Statistics opens from Home;
- Back returns to Home;
- completed-showdown totals match Legacy history;
- unfinished active showdown does not inflate permanent career totals;
- Career Table values are correct;
- two-manager comparison/leaders are correct when the archive contains exactly two manager identities;
- OPEN TROPHY ROOM works;
- Trophy Room Back returns to Career Statistics when opened there;
- completed Showdown Home → Trophy Room → Back returns to Showdown Home;
- CURRENT RIVALRY STATISTICS opens the existing current-showdown view;
- deleting disposable Legacy history updates Career Statistics/Trophy Room on reopen;
- Chromebook/mobile layouts remain usable.

## C. Accepted-system smoke check

- Settings still opens and persists motion preference;
- League Wheel / Club Reveal remain correct;
- Transfer Window → Guess Entry → Signing Entry → Verdicts remains correct;
- Season scoring remains maximum 11;
- Back/Continue remains canonical;
- Legacy/Rule Book remain available.

---

# If r8 still has a defect

Remain in Workstream 4 stabilization.

Fix the actual root cause, add deterministic regression coverage, bump the asset revision for deployed runtime changes, validate the exact final head, and deploy that exact head before asking for another browser pass.

Do not begin Workstream 5 while an r8 Workstream 4 regression remains open.

---

# After r8 / Workstream 4 acceptance

## Workstream 5 — Season pre-commit review

Inspect COMPLETE SEASON and add a lightweight review/confirmation checkpoint before irreversible season completion if an equivalent safeguard remains absent. Completed historical seasons remain read-only.

## Workstream 6 — final v0.95 polish/regression

Final accessibility/focus, responsive consistency, typography/contrast, feedback/transitions, performance, persistence/navigation/gameplay regression and documentation synchronization.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.
