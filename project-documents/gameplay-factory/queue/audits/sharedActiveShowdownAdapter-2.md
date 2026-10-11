# sharedActiveShowdownAdapter.js audit, second half (lines 76-152)

## 1. PROBABLE: season results report "loading" for an unpaired, pending or abandoned rivalry (line 107)

What the player sees: on the season results view for a manager who is unpaired, pending or abandoned, `seasonResultsView` returns `status:"loading"`. A screen that shows a spinner while status is "loading" would spin forever. The Rivalry, Final Winner and Home views map the same classifications to "ready" or "empty", so the screens disagree.

Why: the early return keeps the default `status:"loading"` set in the object literal on line 104:
`if(!COUNTED.includes(c.classification)&&c.classification!=="loading")return v;`
For classification "none", "pending" or "abandoned", `v.status` is never changed, so it stays "loading". Compare `winner()` on line 124, which maps those classifications to "empty".

Smallest change: on that line, return the view with `status:"empty"`, e.g. `return {...v,status:"empty"};`. Confirm that the season results screen treats "empty" as no-season, not as an error.

## 2. Riskiest place checked: `results()` source-mismatch guard (line 106)

`source&&(!ROLES.includes(role)||source.managerRole!==role)` returns "unavailable" with all fields null. This stops one manager's own result from showing to the other manager after a role change. This looked correct.

## 3. Riskiest place checked: `career()` (lines 133-140)

A completed rivalry without a projection is listed as "unavailable" instead of dropped, so the career history does not silently lose a Showdown. This looked correct.
