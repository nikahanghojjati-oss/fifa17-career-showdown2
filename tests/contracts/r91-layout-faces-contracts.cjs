"use strict";
// r91 layout hunt, art thread's phone and tablet audit (PHONE_TABLET_AUDIT.md rows L1-L5 and the 12px rows). The browser side
// is tests/browser/r80-short-screens-audit.cjs (0 findings at the Gate sizes plus 820x1180, 1180x820 and 1920x866/1035) and the
// face measurements in the PR. This file pins the rules:
//   L1 Season Results REVIEW on upright tablets (700-900 x 960+): the hero row is tall enough to put the title picture and the
//      tab row under both chins (--sr-hero-min, 14px + 21.34% of the room's width, over the 73% the title stands at)
//   L3 Season Results on landscape windows 901-1499 wide: the title picture is centred between the faces and narrowed to fit
//   L2 Legacy sideways phones (390-500 tall): the tab column and card start at y 130 (padding-top 64px), under both chins
//   L5 League: sideways phones (640-900 x up to 440) draw both heads (plate the window's width, hair 6px under the bar) and
//      place the title between the men, the wheel and buttons under the chins; the version footer is hidden up to 900px wide
//   L4 Career Statistics: totals 22px clear of Nik's face on desktop (was 6px), hub 24px/28px under the chins on phones/tablets
//   R  Roster Russian Roulette on upright tablets (portrait layout 600-899 wide): the rest picture shifts until the TOP OF THE FRAME (rail ends and
//      finial) is 14px under the title, never past 8px above the revolver's own lowest point's caption (floor: the old face-based shift)
//   H  Home on sideways phones (max 900 x 480): the wordmark stands in the phone plate's ceiling band (hair at 11.66vw), between SIGN IN and the plate edge
//   F  the 12px floor: Final Winner totals/result strip, Club reveal labels, Trophy BACK/MORE on 481-900 portrait; the career
//      table head on desktop; the Legacy carousel arrows
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const season = read("js/seasonFinalV10.js"), career = read("js/careerScreensV10.js");
const setup = read("css/v10Setup.css"), legacy = read("css/rivalryLegacyV10.css"), shell = read("css/v10Shell.css"), type = read("css/r78-type.css");
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// L1
ok(/grid-template-rows:minmax\(var\(--sr-hero-min,160px\),1fr\) 56px auto auto 64px;/.test(season), "L1 the review grid's hero track reads --sr-hero-min");
const tall = season.indexOf("@media (min-width:700px) and (max-width:900px) and (min-height:960px) and (orientation:portrait) {\n /* r91 L1");
ok(tall >= 0, "L1 the tablet block names its row");
const tallBlock = season.slice(tall, season.indexOf("\n}", tall));
ok(/--sr-hero-min:max\(160px,calc\(\(26px \+ var\(--sr-hc-w\) \* \.2134\) \/ \.73\)\);/.test(tallBlock), "L1 the hero is chin line + 26px over the title's 73%");
ok(/grid-template-rows:minmax\(var\(--sr-hero-min\),1fr\) 56px auto 64px;/.test(tallBlock), "L1 the entry grid reads it too");
// L3
const t3 = season.indexOf("@media (min-width:901px) and (max-width:1499px) and (min-height:501px) and (orientation:landscape) {\n #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage #screen-title { left:29.8%; width:36.4%; }");
ok(t3 >= 0, "L3 the title is centred at 48% of the room and 36.4% wide below 1500px");
ok(season.indexOf("#screen-title { top:14%;left:27.99%;width:43.49%; }") >= 0, "L3 1500px and wider keep the approved 43.49% title");
// L2
ok(/\.sd-stage__layer--ui \{ padding-top:64px; align-content:start; grid-template-rows:60px auto 44px auto; row-gap:6px; \}/.test(legacy), "L2 Legacy starts its block at y 130");
// L5
ok(/@media \(min-width: 640px\) and \(max-width: 900px\) and \(max-height: 440px\) and \(orientation: landscape\) \{\n  html\[data-v10-setup="league"\] \{\n    --bx-pw: max\(100vw, calc\(100vh \* 1536 \/ 864\)\);/.test(setup), "L5 the sideways League draws the room the window's width");
ok(/--bx-y0: calc\(58px - var\(--bx-ph\) \* \.08\); --bx-chin: calc\(var\(--bx-y0\) \+ var\(--bx-ph\) \* \.37\);/.test(setup), "L5 hair 6px under the bar, chins at 37% of the room");
ok(/grid-template-rows: calc\(var\(--bx-chin\) \+ 6px - 58px\) auto auto auto;/.test(setup), "L5 row 1 (title) ends 6px under the chins; the wheel and buttons start below");
ok(/#leagueWheel \{ grid-column: 1; grid-row: 2 \/ 5; margin: 0; \}/.test(setup) && /#spinLeague \{ grid-column: 2; grid-row: 3; \}/.test(setup), "L5 wheel left, buttons right, under the chins");
ok(/@media \(max-width: 900px\) \{\n  html\[data-v10-setup="league"\] #app > footer \{\n    position: absolute; width: 1px; height: 1px;/.test(setup), "L5 the League's version footer is hidden up to 900px wide");
ok(!/html\[data-v10-setup="league"\] #app > footer \{ min-height: 28px; padding: 3px 1[02]px; font-size: 10px/.test(setup), "L5 the two 10px footer rules are gone");
// L4
ok(/--hc-half: calc\(var\(--hc-face-half-px, calc\(var\(--hc-rw\) \* \.1706\)\) - var\(--hc-g\) - 22px\);/.test(shell), "L4 desktop totals keep 22px from Nik's face");
ok(/\.phoneHub \{ top:calc\(var\(--cs-face-bottom\) \+ 24px\); \}/.test(career) && /\.phoneHub \{ top:calc\(var\(--cs-face-bottom\) \+ 28px\); \}/.test(career), "L4 the hub starts 24px (short phones) / 28px (tablet) under the chins");
// R
const rrr = read("visual-assets/v10_1/roulette/index.html");
const fu = rrr.slice(rrr.indexOf("function fitUnderTitle(){"), rrr.indexOf("function fitShortPhone"));
ok(fu.includes("const TAB=PH&&w>=600"), "R the tablet rule runs on an upright layout 600px or wider");
ok(fu.includes("[(BOARD_W+.2)/2,BOARD_H/2+.115],[0,BOARD_H/2+.2]"), "R the clearance is measured from the rail ends and the finial tip");
ok(fu.includes("r.bottom+(TAB?14:10)"), "R 14px under the title on tablets, the 10px phone line unchanged");
ok(fu.includes("cap.top-8-bot") && fu.includes("faceNeed"), "R the revolver stays 8px above the caption, floor = the old face-based shift");
ok(/if\(PH&&h<=700\) fitShortPhone/.test(fu), "R short phones keep their own pass");
// H
const home = read("css/homeV10.css");
ok(/--home-hair: 11\.66vw;\n\s+--home-logo-w: min\(calc\(\(var\(--home-hair\) - 16px\) \* 640 \/ 233\), calc\(40vw - 90px\), 280px\);/.test(home), "H the sideways-phone wordmark is sized to the ceiling band");
ok(home.includes(":root #app #mainMenu.v10Home .fifaMenuShell > .homeLockup { top: max(8px, calc((var(--home-hair) - var(--home-logo-h)) / 2)); translate: none; }"), "H it starts 8px down (centred in the band) and drops the 12px lift");
ok(home.includes("#app #mainMenu.v10Home .homeLockup { left: calc((40vw + 70px) / 2); }"), "H it stands between SIGN IN and the plate's right edge");
// F
const fb = type.indexOf("@media (min-width:481px) and (max-width:900px) and (orientation:portrait) {\n  :root:not(#sa-f1)", type.indexOf("r91 12px floor"));
ok(fb >= 0, "F the tablet floor block exists");
const fblock = type.slice(fb, type.indexOf("\n}", fb));
for(const sel of ["small#danielName", "small#nikName", "small#panelLastSeasonResult", "span#panelLastSeasonLabel", "finalWinnerMetaCell > span", "finalWinnerMetaCell > small",
    "finalWinnerRematchSub", "span.clubCardLabel", "small.clubCardState", "div.clubVs > span", "button#trophyRoomBack.backButton", "span.trophyPhoneMoreOpen"])
    ok(fblock.includes(sel), "F tablet floor covers " + sel);
ok(/font-size: 12px !important;/.test(fblock), "F the size is 12px");
ok(/careerTable th,[\s\S]*?\{ font-size: 12px !important; \}/.test(type), "F the career table head is 12px on desktop");
ok(/legacyPager > button \{ font-size: 22px !important; line-height: 1; \}/.test(type), "F the Legacy carousel arrows are 22px");
console.log(`r91 layout faces contracts passed (${n} checks)`);
