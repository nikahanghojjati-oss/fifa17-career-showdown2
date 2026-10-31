# CARD-HUNT-A08-1 · Biggest Showdown win names one manager on a tie

- Verdict: CONFIRMED MODEL/CAREER-SEAM INCONSISTENCY (HIGH confidence for the data path; Team V Career Statistics currently omits this particular stat, so the visible mismatch is in the career-seam/fallback view rather than its current Team V plate).
- Origin: `HUNT-A08.md`, finding row 1 (slice `js/sharedCareerAnalytics.js:1-158`).
- Checked branch: `gameplay/bug-list-1`.
- Lane: **Work mode** (pure shared career calculation and Node contract).
- Size: **S** (a small record consistency fix and a focused regression test).

## What the player sees

After Daniel and Nik each win a completed Showdown by the same margin, the career summary's **Biggest Showdown win** can credit only Daniel, while Trophy Room's **Biggest Showdown win** record says **Shared**. The first winner in career history wins the summary tie. Note: Team V's current Career Statistics plate does not render `biggestShowdownWin`; the inconsistent summary exists in the career screen seam and any fallback rendering that uses it.

## Where in today's game

`js/sharedCareerAnalytics.js:137-143` (winner chosen in career-history order):

```js
const win={manager:finalWinner,margin,showdownRef:entry.rivalryId};
// Equal biggest wins keep the first career-order witness; the record reports shared ties.
if(biggestShowdownWin===null||margin>biggestShowdownWin.margin)biggestShowdownWin=win;
candidates[3].push({manager:finalWinner,value:margin,ref:{rivalryId:entry.rivalryId}});
```

`js/sharedCareerAnalytics.js:91-96` separately computes record ties using `managers.size===1?tied[0].manager:"shared"`. `js/careerScreenSeam.js:75-77` displays `model.biggestShowdownWin.manager` in the career summary; `js/careerScreensV10.js:67-69` sends the shared Trophy Room record to its screen.

## Why

`biggestShowdownWin` updates only when a *strictly larger* winning margin appears, preserving whichever manager won first on equal margins. The separate all-time record correctly recognizes two different winning managers with the same margin as a shared record. These are two inconsistent answers to the same career question.

## How to reproduce

Using `tests/support/career-fixture-helpers.cjs`:

```js
const a=projection({seed:"1",totalSeasons:1,seasons:[[result({domesticCup:true}),result()]]});
const b=projection({seed:"2",totalSeasons:1,seasons:[[result(),result({domesticCup:true})]]});
const entry=p=>({rivalryId:p.rivalryId,classification:"completed",projection:p,final:finalFor(p)});
const m=Analytics.buildCareerModel({indexStatus:"ready",showdowns:[entry(a),entry(b)]});
```

Each manager wins one Showdown by **1**. Today's wrong `m.biggestShowdownWin` is `{manager:"daniel",margin:1,showdownRef:a.rivalryId}`; the Trophy Room record is `{label:"Biggest Showdown win",manager:"shared",value:1,ref:null}`. The current `Seam.careerScreenView("careerStatistics",m)` therefore says `Daniel by 1` where the same-stat record says `Shared · 1`. Expected: a shared tied biggest win, not sole Daniel credit.

## Failing test to write

`tests/contracts/sweep-biggest-showdown-tie-contracts.cjs`

Copy `projection`, `result`, `finalFor`, the `entry` helper, and the `model`/record assertions from `tests/contracts/shared-career-analytics-contracts.cjs:8-15,166-189`. For the two one-Season completed Showdowns above, assert both `m.biggestShowdownWin.manager==="shared"` and `m.biggestShowdownWin.margin===1`; expect no single `showdownRef` on the cross-manager tie. Assert the Trophy Room record remains `manager:"shared",value:1,ref:null` and that the seam's career-summary text does not credit either manager alone. Today the first and final seam assertions fail: `manager:"daniel"` / `Daniel by 1`. Negative controls: with a unique larger Daniel margin, both answers must credit Daniel; a single completed win must keep its showdown reference. Run `node tests/contracts/sweep-biggest-showdown-tie-contracts.cjs`.

## Smallest fix

After computing the `records` array, reconcile the career-wide `biggestShowdownWin` with the **Biggest Showdown win** record when it has a shared cross-manager tie: use `manager:"shared"`, the equal maximum margin, and a null single-winner reference. Keep unique winning records unchanged. Adjust the career-seam text for a shared tie (for example, `Shared · 1`, not `Shared by 1`) so it matches Trophy Room.

## Risk and callers checked on today's branch

- **Career summary consumer:** `js/careerScreenSeam.js:75-87` maps `biggestShowdownWin` to a named career summary; `js/statistics.js:370-377` paints that seam for Career Statistics. Preserve its valid-manager and missing-record behavior.
- **Team V screens:** `js/careerScreensV10.js:36-69,75-90` builds the Career Statistics and Trophy Room frames. Trophy Room reads `trophyRoom.records`; the Team V Career Statistics frame does **not** yet show `biggestShowdownWin`. Do not add an unrelated new UI element for this fix.
- **Shared data dependents:** `tests/contracts/shared-career-analytics-contracts.cjs:94-105,155-189` checks the biggest-win API and record tie semantics; `tests/contracts/career-screen-seam-contracts.cjs:103-110` checks career summary text; `tests/contracts/career-screens-v10-contracts.cjs:45-70` checks Team V's model transfer.

No gameplay files or tests were changed by this card.
