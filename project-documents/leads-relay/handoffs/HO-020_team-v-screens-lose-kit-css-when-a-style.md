# HO-020 · Team V → Team G · Team V screens lose kit CSS when a stylesheet takes over 4 s (v10Screens.js timeout)

```ticket
{
 "id": "HO-020",
 "from": "V",
 "to": "G",
 "title": "Team V screens lose kit CSS when a stylesheet takes over 4 s (v10Screens.js timeout)",
 "kind": "bug",
 "priority": "top",
 "worker": "sonnet",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-06T05:16:35Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-06T05:16:54Z", "by": "G", "status": "RECEIVED", "note": ""}]
}
```

# Team V screens lose their kit CSS when a stylesheet takes over 4 s (style loader timeout)

**Found by:** your layout audit run 3 (Final Winner ghost title, and broken, stretched cut-outs at 1366x650). Diagnosed by Team V on main bc77a0b. **Not a Team V design fault.**

**What players see** (only when any shared kit CSS takes longer than 4 s to load: slow phone or network, or a cold start):
- The screen-reader text "SHOWDOWN CHAMPION" paints as ghost text over the brush title.
- The eyebrow and tagline sit over the title.
- The plate isn't painted, and the near-arm overlays stretch about 37% into a hand and a sleeve.
This can hit any Team V screen, not only Final Winner.

**Cause:** `js/v10Screens.js` `vsStyle()` lines 127–137.
- The 4000 ms timeout calls `done()`, which sets `entry.settled=true` (line 133) while the sheet is still loading.
- `vsSyncStyles()` (line 178) then disables that still-loading link on a non-Team-V screen such as Dashboard. Chromium drops the request, and re-enabling the link never reloads it. In that state the links for `shared/showdown-type.css`, `showdown-ui.css`, `stage.css` and `motion.css` have `disabled=false` but `link.sheet===null`.
- The comment at lines 123–125 states this exact rule, and the timeout path breaks it. (The comment at 130–131 says a late sheet still applies; the repro shows it doesn't.)

**Proposed fix (untested; please verify with the repro below):**
```js
const done=real=>{if(timer!==null)root.clearTimeout(timer);timer=null;if(real===true)entry.settled=true;vsSyncStyles();resolve(true);};
link.addEventListener("load",()=>done(true),{once:true});link.addEventListener("error",()=>done(true),{once:true});
timer=root.setTimeout(()=>done(false),STYLE_TIMEOUT_MS);
```
The screen is still released after 4 s, but the link is only toggled once it has really loaded or errored. A belt-and-braces option: in `vsSyncStyles`, if an enabled link has `sheet===null` after settling, re-append a fresh link.

**Repro:** delay the shared kit CSS by 4.5 s (route interception in Playwright), open Dashboard, then open Final Winner. Expect the ghost title and stretched overlays before the fix, and a clean screen after.

**For the audit:** python's single-threaded http.server makes this happen on cold start. Use http-server, or check that every `link[data-v10-style]` has a non-null sheet before taking screenshots.

**Evidence:** `project-documents/factory/evidence-claude-check/final-winner-style-loader/` on factory/v1-wtt5ye (DIAGNOSIS.md, bad_vs_ok_sheet.jpg).
**Done when:** the 4.5 s-delay repro renders Final Winner cleanly at 1366x650, 393x660 and 375x553.
