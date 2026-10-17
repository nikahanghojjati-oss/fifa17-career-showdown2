# Final Winner layout audit: diagnosis (main bc77a0b, audit tool a3660e1)

Both reported problems are REAL when the audit hits them, but they are ONE defect, not two design faults, and they are intermittent.
Cause is in main's loader (js/v10Screens.js), NOT in Team V's visual-assets/v10_1/final-winner/* files.

## Evidence
- 4 clean runs (3 repeats x 1366x650, 393x660, 375x553, 1440x900, plus 1920x1080): no ghost text, plate present, cut-outs rendered 1366x769 = exact 1672:941 ratio (stage camera k=0.817, cover, y=-102.9). Screenshots OK_*.png.
- Runs 1 and 2 (cold start, single-threaded python http.server) and the forced repro (shared kit CSS delayed 4.5 s via Playwright route, FW_DELAY_MS=4500) reproduce BOTH problems: BAD_*.png.
- In the bad state the DOM shows `link[data-v10-style=".../shared/showdown-type.css|showdown-ui.css|stage.css|motion.css"]` with `disabled=false` but `link.sheet === null` ("nosheet"): the four shared kit stylesheets never applied. `document.styleSheets` lacks them.

## Problem 1: ghost text (CONFIRMED, same root cause)
- `<span class="sd-visually-hidden">SHOWDOWN CHAMPION</span>` at visual-assets/v10_1/final-winner/app-shell.html:32 (eyebrow line 31 and tagline 34 are normal visible text and sit behind/around the brush title in the bad state because stage/type CSS is missing).
- The only visually-hidden rule is `.sd-visually-hidden` in visual-assets/v10_1/shared/showdown-type.css:94-105 (club.css:19 has its own copy but is not loaded here). When showdown-type.css has no sheet, the span is static, 150x55 / 288x27, painted dark (rgb(32,39,45)) over the brush image.
- The markup and rule are correct; the sheet is missing.

## Problem 2: cut-outs "fragments" at 1366x650 (CONFIRMED in bad state, not a design/registration bug)
- The cut-outs are the NEAR_ARM overlays (app-shell.html:147-148, assets OVL_FW_*_NEAR_ARM_V1): full 1672x941 canvases containing only a hand and a sleeve. They are meant to sit on the plate (ENV_TR_PLATE) that carries the managers.
- final-winner.css:589-601 sizes them `position:absolute; inset:0; width:100%; height:100%` with no object-fit, relying on `.sd-stage__registered` (shared/stage.css:29-37) being sized by --sd-stage-scene-w/h (set by ShowdownStage.layout, stage.js:171-179). With stage.css absent, the plate (stage.css:46-49 background-image) is not painted (black) and the registered wrapper collapses (0 height), so the cut-out imgs (object-fit: fill) stretch to the stage box 1366x563: ratio 2.426 vs 1.777 = 36.6% (the audit's "about 37%").
- With stage.css applied, ShowdownStage gives k=0.817 (cover, focal centre, 1366x769 box clipped to 563 high) and the arms line up on the plate; the FACE_BOXES/platemap math (final-winner.js:7-10, phone_band 280,85,1450,600) is fine.

## Root cause (file:line, main)
js/v10Screens.js:127-137 `vsStyle()`: the 4000 ms STYLE_TIMEOUT_MS timer (line 135) calls `done()` which sets `entry.settled=true` (line 133) even though the link has NOT loaded. `vsSyncStyles()` (lines 171-185; `if(!settled)continue` at 178) then treats it as settled and, on any non-Team-V screen (Dashboard, club wheel...), sets `link.disabled=true` on the still-loading sheet. Chromium drops a request for a stylesheet that is disabled while loading; re-enabling later (when seasonEntry mounts) never reloads it. Result: permanent "nosheet" for the kit CSS. The file's own comment (line 123-125) states this rule but the timeout path breaks it. Triggers: any kit CSS slower than 4 s (slow phone network, loaded/single-threaded test server, cold audit start).

## Smallest fix (js/v10Screens.js, lines 133-135; NOT applied or run, one edit attempt was blocked by the sandbox)
```js
const done=real=>{if(timer!==null)root.clearTimeout(timer);timer=null;if(real===true)entry.settled=true;vsSyncStyles();resolve(true);};
link.addEventListener("load",()=>done(true),{once:true});link.addEventListener("error",()=>done(true),{once:true});
timer=root.setTimeout(()=>done(false),STYLE_TIMEOUT_MS);
```
The timeout still releases the screen (promise resolves) but the link is never toggled until it really loads or errors. Optional defence in depth: give final-winner.css its own `.finalWinner .sd-visually-hidden` clip rule.

## Audit tool note
Team G's capture is then non-deterministic. Suggest the audit server be multi-threaded (http-server, not python http.server) and a check that `link[data-v10-style]` sheets are non-null before screenshotting.

## Files
- /tmp/claude-0/fwcheck/final-winner-contact-sheet.png (BAD vs OK, all sizes), shots/*.png (BAD_* = broken state, OK_* = clean)
- 1366x650 BAD_run1 / BAD_delayedcss, OK_1366x650; 1440 BAD_run1, OK_1440x900; 393 BAD_delayedcss, OK; 375 BAD_run2, OK; 1920x1080 OK only (never failed).
- raw: out/ out2/ out3/ rep1-3/ del4500/ (findings.json, eval-*.txt DOM dumps with the link disabled/loaded log)
