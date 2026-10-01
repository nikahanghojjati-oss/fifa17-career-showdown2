# FOR SOL 5.6 · HLC R3.1 changed lines · 2026-10-01

Applies SOL_HLC_R3_QUICK_CHECK_VERDICT_2026-10-01 R3.1-1..5. Documents only. Nothing else changed (each file also gets one changelog line "R3.1 2026-10-01: Sol R3.1-1..5 applied").
Patch commit: `faa2c099b93d3a5937f997eb4e77e364f2854440` on `claude-cloud/hlc-goals` (parent `4f5555c`).

## R3.1-1 · C5.1 (CLOUD_BRIEF_HOME_V1_R3.md, CLOUD_BRIEF_LEAGUE_V1_R3.md, CLOUD_BRIEF_CLUB_V1_R3.md)
OLD: 1. Every string, id, role and aria attribute in section S comes from production main, spelled and cased as the product renders it. Where the goal image disagrees with the product, the product wins; record each case in the handoff (section D).

NEW: 1. Every live product string, id, role and aria attribute in section S follows production main unless that screen's section S explicitly declares a Sol/owner-approved exception. Home's Audius soundtrack content is the current explicit exception. Where the goal image disagrees with product truth, product truth or an explicit approved exception wins; record each case in the handoff.

## R3.1-2 · Intake Branches (CLOUD_HLC_INTAKE_V1_R3.md)
OLD: `... add `visual-assets/v10_1/<screen>/assets/` (plates, `platemap.json`, `REF_GOAL_*`, `intake_report.md` with base SHA, sizes, SHA-256 values and the gate counts) and `visual-assets/v10_1/<screen>/evidence/intake_*`. Commit ...`

NEW: `... add `visual-assets/v10_1/<screen>/assets/` (plates, `platemap.json`, `REF_GOAL_*`, `intake_report.md` with base SHA, sizes, SHA-256 values and the gate counts), `visual-assets/v10_1/<screen>/evidence/` (`intake_*`) and `visual-assets/v10_1/<screen>/tools/intake_hlc.py`; if `BUILD_RESULT.md` is emitted at screen root under the chosen structure, include it as well. Do not broaden write scope beyond the R3 intake scope. Commit ...`

## R3.1-3 · Home H3 (CLOUD_BRIEF_HOME_V1_R3.md)
OLD: `(min 32 px tall desktop; selected chip gold)`

NEW: `each at least 40 px tall on desktop; selected chip gold` (sentence now reads "The four choices as compact chips in one row or a 2 × 2 grid each at least 40 px tall on desktop; selected chip gold.")

## R3.1-4 · League W1 (CLOUD_BRIEF_LEAGUE_V1_R3.md)
OLD: `Do not draw, edit or restyle league marks yourself, and do not touch `data/leagues.js`` (its `logo` fields ...)

NEW: `Do not redraw league-mark geometry, alter the source recipes, or invent replacement marks. The OWNER-2 wheel-only monochrome presentation transform defined above is explicitly allowed and required. Outside the wheel, do not restyle the crest-build marks unless separately approved. Keep `data/leagues.js` untouched` (its `logo` fields ...)

## R3.1-5 · C5.7 and G8 (all three screen briefs)
C5.7 OLD: `(the only such case is the Club-only pack-box exception in G8)`

C5.7 NEW: `(the only such cases are the two bounded runtime exceptions in G8: League-only fingertip/hand layering and Club-only pack reveal)`

G8 OLD: `... except where section S allows it. **Club-only pack-box exception (D7):** ...`

G8 NEW: `... except for exactly two bounded runtime exceptions. **1. League-only fingertip/hand layering:** in League, the decorative wheel rim/background may pass beneath Daniel's original hand/fingertip overlay required by W2. No live text, wheel-item label, button, status line, or other control may enter the hand protected box. The overlay remains exactly registered through `plateToScreen`. Face boxes remain fully protected. **2. Club-only pack reveal (D7):** ...` (D7 text that follows is unchanged)

G8 report line OLD: `(c) zero live-text/control intersection with pack boxes. |`

G8 report line NEW: `(c) zero live-text/control intersection with pack boxes. For League QA, report separately: (a) face clearance; (b) live-text/control clearance from Daniel's hand box; (c) fingertip overlay registration error; (d) confirmation that only decorative wheel geometry is beneath the hand. |`

## Diffstat (`git diff --stat faa2c099b93d3a5937f997eb4e77e364f2854440~1 faa2c099b93d3a5937f997eb4e77e364f2854440`)
```
 visual-assets/goals/CLOUD_BRIEF_CLUB_V1_R3.md   |  8 ++++----
 visual-assets/goals/CLOUD_BRIEF_HOME_V1_R3.md   | 10 +++++-----
 visual-assets/goals/CLOUD_BRIEF_LEAGUE_V1_R3.md |  9 +++++----
 visual-assets/goals/CLOUD_HLC_INTAKE_V1_R3.md   |  3 ++-
 4 files changed, 16 insertions(+), 14 deletions(-)
```
