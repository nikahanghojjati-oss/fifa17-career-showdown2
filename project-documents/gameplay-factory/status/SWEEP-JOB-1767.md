# SWEEP-JOB-1767 · Shared season commit audit

Compared `JOB-1767.md` against current `gameplay/bug-list-1` (r75). Gameplay findings only.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| An old **COMMIT & ACKNOWLEDGE SHARED SEASON** tap might commit the previous season after its pending read completes and the player has moved to a different season. | `js/productionSharedSeasonCommit.js:164-166` (old mutation) -> `js/productionSharedSeasonCommit.js:176-178` | **FIXED** | Current line 176: `const ctx=await psscProviderContext(request);if(!psscContextMatches(request))return false;let current=psscResultError(await provider.read(ctx.options));`<br>Current line 177: `if(!psscContextMatches(request))return false;`<br>Current line 178: `if(!psscSatisfied(kind,current)){if(!await psscWrite(kind,ctx,request,current))return false;` — the second context check now occurs after the read and before a write. |

Still open: 0
