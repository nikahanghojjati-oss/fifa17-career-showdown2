#!/usr/bin/env node
"use strict";
// r90 MOTION hunt, 2D rows: the Final Winner ceremony never dims or flashes (M7), and at Light (html[data-gfx="0"], set by
// js/gfxTier.js) the heavy 2D effects step down while Balanced and up keep today's look (M18-M26).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
let n=0;const ok=(id,msg)=>{n++;console.log(`ok ${n} ${id} ${msg}`);};
// M7: no dim, no flash
{const js=read("visual-assets/v10_1/final-winner/final-winner.js"),css=read("visual-assets/v10_1/final-winner/final-winner.css");
  assert.doesNotMatch(js,/finalWinnerFlash|flashAtMs|flashMs/,"the ceremony creates no flash layer");
  assert.doesNotMatch(css,/finalWinnerFlash|fwFlash|fwDim|fwAnticipate::after/,"no flash or dim rules remain");
  assert.doesNotMatch(css,/rgb\(0 0 0 \/ \.5\)/,"no 50% black layer");
  assert.match(js,/root\.classList\.add\("fwAnticipate"\)/,"the drum pulse on the trophy glow stays");
  assert.match(css,/#stage-root\.fwAnticipate \.winnerTrophyGlow \{ animation: fwDrum/,"the drum pulse is the trophy glow only");
  ok("M7","the Final Winner ceremony keeps its drum pulse, confetti and name wipe with no dimming and no flash");}
// M18-M26: Light only
{const light=(file,re,why)=>{assert.match(read(file),re,why);};
  light("visual-assets/v10_1/shared/showdown-ui.css",/html\[data-gfx="0"\] \{ --sd-panel-blur: none; \}/,"panels drop the live blur at Light");
  light("visual-assets/v10_1/shared/showdown-ui.css",/html\[data-gfx="0"\] \.sd-panel \{ background: linear-gradient\(180deg, rgba\(18,18,20,\.95\), rgba\(8,9,12,\.93\)\); \}/,"and take a deeper marble tint");
  assert.match(read("visual-assets/v10_1/shared/showdown-ui.css"),/:root \{\n  --sd-panel-blur: blur\(6px\);/,"Balanced and up keep the 6 px blur");
  light("visual-assets/v10_1/shared/stage.css",/html\[data-gfx="0"\] \.sd-stage__dust \{ display: none; \}\nhtml\[data-gfx="0"\] \.sd-stage__flare \{ filter: none; \}/,"no dust and an unblurred flare at Light");
  light("css/homeV10.css",/html\[data-gfx="0"\] #app #mainMenu\.v10Home \.fifaMenuGrid > \.menuTile \{ -webkit-backdrop-filter: none; backdrop-filter: none; \}/,"Home tiles without blur at Light");
  light("css/rulesSettingsV10.css",/html\[data-gfx="0"\] #app #ruleBook\.v10RuleBook #ruleBookSections \.ruleSection \{ filter:none; \}/,"Rule Book cards without the drop-shadow pass at Light");
  light("visual-assets/v10_1/final-winner/final-winner.css",/html\[data-gfx="0"\] \.finalWinnerManagerSpotlight \{ filter: none; \}/,"Final Winner spotlights without blur at Light");
  light("css/v10Club.css",/html\[data-gfx="0"\] #clubWheelScreen #covers polygon\[filter="url\(#cvUnder\)"\] \{ display: none; \}/,"Club Assignment leaves out the blurred under-glow at Light");
  assert.match(read("visual-assets/v10_1/club/club.js"),/<polygon points="\$\{pts\(s\.panel\)\}" fill="#F2C45B" opacity="\.18" filter="url\(#cvUnder\)"/,"Team V's under-glow polygon is the one Light hides (club.js untouched)");
  assert.match(read("js/gfxTier.js"),/function gfxMarkRoot\(level,assets\)\{/,"js/gfxTier.js writes html[data-gfx]");
  light("visual-assets/v10_1/shared/stage.css",/html\[data-gfx="0"\] \.sd-stage \{ will-change: opacity; \}/,"M33: at Light the stage keeps its own layer once the dust is gone");
  assert.match(read("visual-assets/v10_1/shared/stage.css"),/\.sd-stage \{\n[^}]*isolation: isolate;/,"the stage is already isolated, so the hint changes no stacking");
  ok("M18-M26","at Light the panels, stage dust and flare, Home tiles, Rule Book cards, Final Winner spotlights and Club glow step down; other levels are untouched");}
// M27: wordmark srcset sizes match the drawn width (measured 25-44% of the window at 1366 and 1920), so a DPR 1 screen
// fetches the 480/960 file instead of the 960/1920 one; phones keep 92vw.
{for(const [file,name,vw] of [["js/careerScreensV10.js","TITLE_CS_V2","40vw"],["visual-assets/v10_1/trophy-room/trophy-room.js","TITLE_TR_V2","35vw"],["visual-assets/v10_1/season-results/app-shell.html","TITLE_SR_V2","46vw"],["visual-assets/v10_1/final-winner/app-shell.html","TITLE_FINAL_WINNER_V2","31vw"],["js/rivalryLegacyV10Markup.js","TITLE_LG_V2","34vw"]])
    assert.match(read(file),new RegExp(name+"_480\\.webp 480w[^\"\\\\]*\\\\?\"\\s*sizes=\\\\?\"\\(max-width: 900px\\) 92vw, "+vw),`${name} sizes ${vw}`);
  ok("M27","the five stage wordmarks ask for their drawn width, not 60vw");}
console.log(`PASS r90 MOTION 2D contracts: ${n} numbered checks.`);
