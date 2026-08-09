# NEXT TASK

## Current gate: v0.95.0-r7 Workstream 4 browser acceptance

Accepted owner/browser gates:

- Workstream 1B / `0.95.0-r4` — FIFA-era presentation, procedural club identities and two-pack reveal;
- Workstream 2 / `0.95.0-r5` — phased Transfer Challenge and canonical FIFA 17 transfer metadata/selectors;
- Workstream 3 / `0.95.0-r6` — Settings and persistent motion accessibility.

**Application version:** v0.95.0  
**Asset revision:** `0.95.0-r7`  
**Current workstream:** Workstream 4 — Main Menu Statistics alignment  
**Source status:** implemented and machine-validated  
**Owner acceptance:** pending

Stay on Workstream 4 until the owner has tested r7 on the real Chromebook/mobile browser. Do not begin Season pre-commit review / Workstream 5 while a real r7 defect remains unresolved.

---

# What r7 implements

## Home information architecture

The accepted r6 Home geometry is preserved: the same number of navigation tiles, the same dominant Continue Career area and the same media rail position.

The former top-level **TROPHY ROOM** Home tile is now the blueprint-aligned **STATISTICS** tile.

The three analytics surfaces now have explicit responsibilities:

1. **Career Statistics** — permanent all-time career data from completed showdowns; opened from Home.
2. **Rivalry Statistics** — the currently loaded active/completed showdown only; remains available from Showdown Home.
3. **Trophy Room** — honours cabinets and detailed all-time records; opened from Career Statistics or the completed-showdown recovery hub.

All three reuse the existing `js/analytics.js` engine. r7 does not create a second analytics engine or a second data model.

## Career Statistics

New lazy screen: `careerStatistics`.

It includes:

- Completed Showdowns;
- Seasons Played;
- Career Points;
- Trophies Won;
- Career Table with manager showdown and season records;
- two-manager Career comparison when the archive contains exactly two manager identities;
- Career Leaders for Showdown wins, Career points, trophies, Season wins, best average Season score and best single-Season score;
- an empty state before any showdown has been completed.

When an active showdown is already loaded in the current session, Career Statistics also exposes **CURRENT RIVALRY STATISTICS**.

Career Statistics exposes **OPEN TROPHY ROOM** for the more detailed honours/cabinet view.

## Existing analytics preserved

### Rivalry Statistics

The existing current-showdown experience remains intact:

- current Showdown points;
- season wins/draws;
- trophies and grouped bonuses;
- averages/best Season numbers;
- Transfer signing/release totals;
- Season-by-Season progression.

### Trophy Room

The existing honours experience remains intact:

- Career summary;
- Career Table;
- manager trophy cabinets;
- supporting achievements;
- all-time records.

Trophy Room now consumes the Career Table renderer shared by `js/statistics.js` rather than maintaining a second copy of the same table UI.

## Lightweight loading

Career Statistics remains completely outside the initial Home bundle.

Home startup is still exactly:

- one local stylesheet;
- seven local JavaScript files maximum / currently exactly seven;
- no eager analytics, Statistics or Trophy Room assets.

Opening Career Statistics lazy-loads:

- `css/analytics.css`;
- `js/analytics.js`;
- `js/statistics.js`.

It does **not** load the League/Club/Transfer/Season gameplay package merely to read saved career history.

Trophy Room adds only `js/trophyRoom.js` after the shared analytics package is available.

## Navigation

`js/screens.js` remains the only route/history authority.

New route policy:

- Career Statistics → Back → Main Menu;
- Rivalry Statistics → Back → Showdown Home / Main Menu;
- Trophy Room opened from Career Statistics → Back returns to Career Statistics through advisory history;
- Trophy Room opened from completed Showdown Home → Back returns to Showdown Home;
- fallback order for Trophy Room is Showdown Home → Career Statistics → Main Menu.

Read-only Statistics routes are not classified as gameplay-runtime routes.

---

# r7 browser acceptance checklist

Hard-refresh once before starting so Chrome receives `0.95.0-r7` assets.

## A. Home / r4-r6 regression

Expected:

- no startup integrity warning;
- Home still fits correctly on the Chromebook;
- Continue Career remains the dominant tile;
- New Showdown, Legacy, Rule Book and Settings remain in their accepted positions;
- the old top-level Trophy Room tile is replaced by **STATISTICS** without creating an extra Home row;
- soundtrack/trailer rail remains below navigation and does not overlap;
- r6 Settings and Reduce Motion still work.

## B. Career Statistics from Home

Open **STATISTICS**.

Expected:

- screen title: **CAREER STATISTICS**;
- opens without needing to enter/resume gameplay;
- no loading error or integrity warning;
- Back returns to Home;
- scrolling remains smooth on Chromebook/mobile.

If there are no completed showdowns, expected:

- all summary totals are zero;
- a clear empty-state message appears;
- Trophy Room remains accessible;
- no fake manager rows or invented records appear.

If completed showdowns exist, continue with C-F.

## C. Career summary accuracy

Compare Career Statistics with known Legacy history.

Expected:

- **Completed Showdowns** counts archived completed rivalries once;
- **Seasons Played** counts completed Showdown seasons once, not once per manager;
- **Career Points** equals both managers' final Showdown points added together across completed showdowns;
- **Trophies Won** equals all league titles + Champions Leagues + main domestic cups across both managers;
- a currently active unfinished showdown does not inflate permanent completed-career totals.

## D. Career Table

Expected:

- each manager has one row;
- rankings are stable and sensible;
- Showdown W-D-L, Season W-D-L, Career points and trophies reflect completed history;
- long manager names remain contained;
- on phone/small width the table scrolls horizontally rather than crushing or overflowing the page.

If your historical archive has exactly two manager identities, the Manager Comparison section should appear. If older test data contains additional manager names, the app intentionally omits the two-person comparison rather than pretending all records belong to only two identities.

## E. Manager comparison / Career Leaders

With exactly two managers in completed history, expected:

- both manager names appear correctly;
- Showdown wins/win rate, Season wins, Career points, average/best Season scores, league averages, perfect Seasons and Transfer totals agree with the archive;
- the leading value is visually emphasized where appropriate;
- RELEASE totals do not incorrectly reward a higher value as a positive performance metric.

Career Leaders expected:

- Most Showdown Wins;
- Most Career Points;
- Most Trophies;
- Most Season Wins;
- Best Average Season Score;
- Best Season Score.

Ties should show every tied manager rather than silently picking one.

## F. Trophy Room bridge

From Career Statistics press **OPEN TROPHY ROOM**.

Expected:

- Trophy Room still shows its Career summary, manager cabinets and all-time records;
- no duplicate or blank Career Table;
- pressing Back returns to Career Statistics.

Then test the other context if a completed active showdown is available:

1. open completed Showdown Home;
2. open Trophy Room from the completion hub;
3. press Back.

Expected: Back returns to Showdown Home, not arbitrarily to Career Statistics.

## G. Current Rivalry bridge

With an active showdown already loaded in the current browser session, open Career Statistics.

Expected:

- **CURRENT RIVALRY STATISTICS** is visible;
- it opens the same existing current-showdown analytics view used by Showdown Home;
- it does not create a separate or conflicting statistics record;
- Rivalry Statistics values still include only that showdown;
- Back follows the existing Showdown context safely.

If no active showdown is loaded, the Current Rivalry button is intentionally hidden.

## H. History mutation / refresh

Using disposable data if needed:

1. note Career Statistics totals;
2. delete a completed Legacy showdown through the existing Data Management controls;
3. return to Home and reopen Statistics.

Expected:

- Career Statistics reflects the new archive state;
- Trophy Room reflects the same archive state;
- neither page shows stale deleted totals.

Do not use production/valuable history for destructive testing unless you already intend to delete it.

## I. Responsive / accessibility

Chromebook low-height and phone:

- no Home overlap from the Statistics tile;
- Career Statistics summary cards remain readable;
- manager comparison stacks cleanly on phone;
- Career Table remains horizontally scrollable;
- records/leader cards collapse to sensible columns;
- visible keyboard focus remains intact;
- ordinary Back is still centralized;
- Reduce Motion does not break any Statistics screen.

## J. r5/r6 smoke regression

Perform a short smoke check only; do not repeat the full already-accepted gates unless something looks wrong:

- Settings opens and preference persists;
- Transfer Challenge still follows Window → Guess → Signing → Verdicts;
- a controlled League/Nationality selector still opens correctly;
- Showdown Home and current Rivalry Statistics still open;
- scoring maximum remains 11.

---

# Machine validation protecting r7

Four exact-head GitHub Actions gates are expected on final r7:

## Validate Static App

Protects:

- JavaScript syntax;
- locked max-11 scoring and grouped bonuses;
- draw / 0-0 tiebreak rules;
- canonical Showdown route matrix;
- Career/Rivalry/Trophy route contracts;
- all 98 deterministic original club identities;
- two-pack reveal transaction/timing;
- startup script/style/byte limits;
- central Back authority and no `screenHistory` leakage;
- Home Chromebook/mobile guards;
- completed-showdown recovery.

## Validate Transfer Workstream

Protects accepted r5 Transfer state/data/selector behavior.

## Validate Settings Workstream

Protects accepted r6 preference/accessibility/reset isolation behavior.

## Validate Statistics Workstream

Protects r7 with executable completed-history fixtures and architecture checks:

- completed Showdown/Season totals;
- Career points and trophies;
- manager Showdown records;
- Transfer signing/release accumulation;
- highest Season/league records;
- current Rivalry analytics;
- Home Statistics entry;
- analytics staying lazy;
- Statistics not waking the gameplay runtime;
- one analytics engine only;
- Trophy Room shared Career Table;
- central route/Back ownership.

Automated validation does not replace owner visual/browser acceptance.

---

# If r7 has a defect

Stay in Workstream 4. Inspect current `main`, fix the actual analytics/render/navigation/layout cause, preserve the existing `js/analytics.js` engine, and extend the Statistics regression gate for the discovered root cause.

Do not create a second analytics engine, second storage model, second route history or eager Home analytics bundle.

---

# After r7 acceptance

## Workstream 5 — Season pre-commit review

Inspect the current Complete Season path and add a lightweight review/confirmation before irreversible Season completion if an equivalent safeguard is still absent.

Requirements:

- preserve scoring/gameplay rules exactly;
- review the two managers' entered results and calculated score before commit;
- cancel/edit must return without losing the draft;
- final confirmation must retain the existing transactional save/rollback behavior;
- completed historical Seasons remain read-only;
- no modal/framework bloat if a simple native/lightweight confirmation surface is sufficient.

## Workstream 6 — final v0.95 polish/regression

Accessibility/focus, responsive consistency, typography/contrast, feedback/transitions, performance, persistence/navigation/gameplay regression and final documentation synchronization.

Then move directly to **v1.0 Complete Release Candidate / Final Release**.