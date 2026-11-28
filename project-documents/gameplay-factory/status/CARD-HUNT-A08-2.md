# CARD-HUNT-A08-2 · Level Career Table gives Nik second place

- Verdict: **CONFIRMED IN CAREER-SCREEN SEAM** (HIGH confidence in the deterministic renderer; **Team V's currently mounted Trophy Room already handles tied ranks correctly**, so do not claim this is a Team V screen bug).
- Origin: `HUNT-A08.md`, finding row 2 (slice `js/sharedCareerAnalytics.js:1-158`).
- Checked branch: `gameplay/bug-list-1` (14 October 2026).
- Lane: **Work mode** (pure career view / Node contract; no browser needed to catch the wrong rank label).
- Size: **S** (one small rank-expression adjustment plus a focused contract).

## What the player sees

On the older/fallback Trophy Room CAREER TABLE, Daniel and Nik can finish level on career points and Season wins, yet the table says **1. Daniel (level)** and **2. Nik (level)**. The two rank numbers contradict the word *level*. **Scope:** Team V's active Trophy Room already renders both tied managers as `#1`; the defect is in the still-used career-screen seam / underlying fallback view, not Team V's rank formatter.

## Where in today's game

`js/sharedCareerAnalytics.js:99-102` correctly marks the tied pair:

```js
standings.sort((a,b)=>b.careerPoints-a.careerPoints||b.seasonWins-a.seasonWins);
if(standings.length&&standings[0].careerPoints===standings[1].careerPoints&&standings[0].seasonWins===standings[1].seasonWins)standings.forEach(row=>{row.level=true;});
```

`js/careerScreenSeam.js:85` then ignores `level` when it assigns the printed number:

```js
{heading:"CAREER TABLE",rows:room.standings.map((row,index)=>({label:(index+1)+". "+csNames[row.manager]+(row.level?" (level)":""),value:csNumber(row.careerPoints)+" points, "+csNumber(row.seasonWins)+" season wins"}))},
```

The old host renders the seam via `js/trophyRoom.js:196-209`. In contrast, `js/careerScreensV10.js:37-42,69-76` explicitly sets `rank: 1` for every `row.level===true` and prints `#1` on both Team V rows.

## Why

The career model identifies an exact tie, but `csTrophySections` still uses each array position (`index+1`) as the display rank. That works when one manager leads, but places a second manager *second* even when the game says their points and Season wins are equal.

## How to reproduce

With the fixture helpers from `tests/support/career-fixture-helpers.cjs`, build a single completed two-Season Showdown:

```js
const seven=result({championsLeague:true,domesticCup:true,topScorer:true});
const five=result({championsLeague:true});
const p=projection({totalSeasons:2,seasons:[[seven,five],[five,seven]]});
const m=Analytics.buildCareerModel({indexStatus:"ready",showdowns:[
  {rivalryId:p.rivalryId,classification:"completed",projection:p,final:finalFor(p)}
]});
const labels=Seam.careerScreenView("trophyRoom",m).sections[1].rows.map(r=>r.label);
```

Both managers total **12** career points (7+5), with **one Season win apiece**. `m.trophyRoom.standings` marks both `level:true`. **Wrong today:** `["1. Daniel (level)","2. Nik (level)"]`. **Expected:** `["1. Daniel (level)","1. Nik (level)"]`. A no-tie control, for example one 7–5 Season, must remain `["1. Daniel","2. Nik"]`.

## Failing test to write

`tests/contracts/sweep-career-table-level-rank-contracts.cjs`

Copy the Node `assert`, `Analytics.buildCareerModel`, `Seam.careerScreenView`, `result`, `projection`, `finalFor`, and `entry` sandbox pattern from `tests/contracts/career-screen-seam-contracts.cjs:3-16,103-126`. Use the two-Season input above. Assert:

1. Exact model totals: Daniel 12 / Nik 12; both Season wins 1; both standing rows `level===true`.
2. Seam Trophy Room labels equal `["1. Daniel (level)","1. Nik (level)"]`; **today the second is "2. Nik (level)"**.
3. Unique-leader input keeps proper 1/2 ordering, including a Nik-leading case.
4. `CareerModeCareerScreensV10.toV10Frame(m,"trophyRoom").standings` stays `#1` / `#1`, because that path is already correct.

Run `node tests/contracts/sweep-career-table-level-rank-contracts.cjs`. The pre-existing `tests/contracts/career-screen-seam-contracts.cjs:125-127` *asserts the erroneous 1/2 tie labels* and must be updated with the smallest fix.

## Smallest fix

In `csTrophySections`, calculate the printed rank as `row.level ? 1 : index + 1` rather than always `index + 1`. Keep the `(level)` suffix, manager order, points and Season wins unchanged. Update the old seam contract's tied-row expected labels; do not modify Team V ranks.

## Risk and callers checked on today's branch

- `js/trophyRoom.js:196-209` calls `careerScreenView("trophyRoom", model)` and `paintCareerScreenView` in the older/host render path; `js/trophyRoom.js:259-266` opens Team V after the older route.
- `js/careerScreensV10.js:37-42,62-90` uses its own correct tie-aware `v10Ranks` for the Team V Trophy Room and Career Statistics; keep that behavior and both managers' ordering.
- `js/sharedCareerAnalytics.js:96-103` constructs sorted standings; it already sets `level` correctly and should not be changed.
- `tests/contracts/career-screen-seam-contracts.cjs:103-127` checks seam labels and currently enshrines the wrong tie label; `tests/contracts/shared-career-analytics-contracts.cjs:166-189` checks tie flags; `tests/contracts/career-screens-v10-contracts.cjs` check V6 asserts the correct Team V `#1`/`#1` tie ranks.

No game files or tests were changed by this card.
