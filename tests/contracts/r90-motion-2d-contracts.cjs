#!/usr/bin/env node
"use strict";
// r90 MOTION hunt, 2D rows: the Final Winner ceremony never dims or flashes (M7), and at Light (html[data-gfx="0"], set by
// js/gfxTier.js) the heavy 2D effects step down while Balanced and up keep today's look (M18-M26). Layout shift rows: CLS.
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
// M27 (r91 HO-071, was "the five stage wordmarks ask for their drawn width"): the V3 title family. Every V3 picture of one
// step has one height (38/76/150/300 px) and its own width, so each title's srcset must carry the files' REAL widths and its
// "sizes" must ask for the one shared title height (--hc-title-h in css/r78-type.css) times that title's width/height ratio.
// A wrong width here would draw one screen's title bigger or blurrier than the others.
{const dims=file=>{const b=fs.readFileSync(path.join(ROOT,file));assert.equal(b.subarray(8,12).toString(),"WEBP",file);const kind=b.subarray(12,16).toString();
    if(kind==="VP8X")return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
    if(kind==="VP8L"){const n=b.readUInt32LE(21);return [1+(n&0x3fff),1+((n>>>14)&0x3fff)];}
    return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];};
  const W="visual-assets/v10_1/",STEPS=[480,960,1920,3840],HEIGHTS=[38,76,150,300];
  const h=/--hc-title-h: clamp\((\d+)px, ([\d.]+)vw, (\d+)px\);/.exec(read("css/r78-type.css"));assert.ok(h,"the shared title height is one variable");
  const [hMin,hVw,hMax]=h.slice(1).map(Number);
  const titles=[["js/careerScreensV10.js","career-statistics/assets/TITLE_CS"],["visual-assets/v10_1/trophy-room/trophy-room.js","trophy-room/assets/TITLE_TR"],
    ["visual-assets/v10_1/season-results/app-shell.html","season-results/assets/TITLE_SR"],["visual-assets/v10_1/season-results/app-shell.html","season-results/assets/TITLE_SR_PHONE"],
    ["visual-assets/v10_1/final-winner/app-shell.html","shared/wordmarks/TITLE_FINAL_WINNER"],["visual-assets/v10_1/standings/app-shell.html","shared/wordmarks/TITLE_STANDINGS"],
    ["js/rivalryLegacyV10Markup.js","legacy/assets/TITLE_LG"],["js/rivalryLegacyV10Markup.js","rivalry-statistics/assets/TITLE_RV"],["js/rivalryLegacyV10Markup.js","rivalry-statistics/assets/TITLE_RV_PHONE"],
    ["js/connectPlayersScreenV10.js","shared/wordmarks/TITLE_CONNECT_PLAYERS"],["js/rulesSettingsV10.js","shared/wordmarks/TITLE_RULE_BOOK"],["js/rulesSettingsV10.js","shared/wordmarks/TITLE_SETTINGS"],
    ["visual-assets/v10_1/tr2/slice-02-plate/plate.js","shared/wordmarks/TITLE_TRANSFER"]];
  for(const [file,asset] of titles){
    const name=asset.split("/").pop(),src=read(file),real=STEPS.map((step,i)=>{const [w,hh]=dims(`${W}${asset}_V3_${step}.webp`);assert.equal(hh,HEIGHTS[i],`${name} ${step} height`);return w;});
    assert.ok(!src.includes(name+"_V2_"),`${file} no longer draws ${name}_V2`);
    // The four widths as the file writes them: a plain srcset, the Rule Book/Settings table, or Transfer War's [step, width] pairs.
    const esc=name.replace(/_/g,"_"),at=src.indexOf(name+"_V3_");assert.ok(at>=0,`${file} draws ${name}_V3`);
    let widths=STEPS.map(step=>{const m=new RegExp(esc+"_V3_"+step+"\\.webp (\\d+)w").exec(src);return m?Number(m[1]):null;});
    if(widths.includes(null)){const m=new RegExp(esc+'_V3_960\\.webp":\\{key:"[A-Z_]+",widths:\\[(\\d+),(\\d+),(\\d+),(\\d+)\\]').exec(src)||/\[\[480, (\d+)\], \[960, (\d+)\], \[1920, (\d+)\], \[3840, (\d+)\]\]/.exec(src.slice(Math.max(0,at-200),at+600));
      assert.ok(m,`${name} widths found in ${file}`);widths=m.slice(1).map(Number);}
    assert.deepEqual(widths,real,`${name} srcset widths are the files' real widths`);
    const ratio=real[2]/150,want=`clamp(${Math.round(hMin*ratio)}px, ${(hVw*ratio).toFixed(2)}vw, ${Math.floor(hMax*ratio)}px)`;
    assert.ok(src.slice(at-200,at+1400).includes(want)||src.includes(`sizes:"${want}"`),`${name} asks for the shared title height: ${want}`);}
  const type=read("css/r78-type.css");
  assert.match(type,/img\.hc-title-img \{ object-fit: scale-down !important; object-position: 50% 50% !important; \}/,"a title is never stretched or enlarged inside its box");
  for(const key of ["CS","LG","RV","SR","SR_PHONE","CONNECT","FINAL_WINNER","STANDINGS","TRANSFER","TR","RULE_BOOK","SETTINGS"])
    assert.match(type,new RegExp('img\\.hc-title-img\\[data-hc-title="'+key+'"\\] \\{ aspect-ratio: 1920 / \\d+; \\}'),`${key} keeps the box its old picture had, so nothing moves`);
  // Home logo: three real widths, and every V3 file a screen can fetch is lighter than the V1/V2 file of the same step.
  const home=read("js/homeScreensV10.js");
  for(const w of [640,1040,2080]){assert.equal(dims(`${W}home/assets/LOGO_CM17_WORDMARK_V3_${w}.webp`)[0],w,`logo ${w}`);assert.ok(home.includes(`LOGO_CM17_WORDMARK_V3_${w}.webp ${w}w`),`Home lists the ${w} logo`);}
  const size=file=>fs.statSync(path.join(ROOT,W+file)).size;
  assert.ok(size("home/assets/LOGO_CM17_WORDMARK_V3_640.webp")<size("home/assets/LOGO_CM17_WORDMARK_V1_640W.webp")&&size("home/assets/LOGO_CM17_WORDMARK_V3_1040.webp")<size("home/assets/LOGO_CM17_WORDMARK_V1.webp"),"the Home logo got lighter");
  for(const [,asset] of titles)for(const step of STEPS)assert.ok(size(`${asset}_V3_${step}.webp`)<size(`${asset}_V2_${step}.webp`),`${asset} ${step} is lighter than V2`);
  ok("M27","the V3 title family: real srcset widths, one shared title height, old boxes kept, lighter files");}
// CLS (W9 row): the top bar's 52 px is reserved from the first paint in every nav state, so a screen laid out under the
// loading screen or the Reus Gate (data-nav "none") does not jump when the bar comes back; Club stays unseen until its look is on.
{const shell=read("css/v10Shell.css"),club=read("css/v10Club.css");
  assert.match(shell,/@media \(min-width: 901px\) \{\n  html\[data-nav="hub"\] #app, html\[data-nav="hidden"\] #app, html\[data-nav="none"\] #app \{ padding-top: var\(--sd-nav-top-h, 52px\); \}/,"the bar's height stays reserved under the gate");
  assert.match(read("js/v10Screens.js"),/mode:loading\?"none":entry\?entry\[1\]:"hidden"/,"nav is \"none\" only while a loading screen covers the app");
  assert.match(club,/#clubWheelScreen\[data-v10-pending\]:not\(\.cl-on\) \{ visibility: hidden; \}/,"Club stays unseen between its styles and its mount");
  assert.match(club,/html:not\(\[data-v10-screen="clubWheelScreen"\]\) #app > main:has\(> #clubWheelScreen:not\(\.hidden\)\) \{ position: static; inset: auto; z-index: auto; pointer-events: auto; \}/,"club.css's bare main rule cannot move the app's main before Club is named");
  assert.match(read("js/clubScreenV10.js"),/section\.classList\.add\("cl-on"\);\n      clDecorate\(section\);[\s\S]{0,240}root\.ClubPlate\.app\.mount\(/,"cl-on and Team V's first layout land in the same task");
  assert.match(read("js/v10Screens.js"),/liveIds\.some\(id=>\{const def=registry\.get\(id\);return Boolean\(def&&def\.css\.some\(css=>BASE\+css===file\)&&\(mounted\.has\(id\)\|\|def\.css\.every\(css=>styles\.get\(BASE\+css\)\?\.settled===true\)\)\);\}\)/,"a screen's sheets switch on together, once all have settled or it has mounted");
  ok("CLS","the top bar's room is kept under the gate, and Club shows only once laid out");}
console.log(`PASS r90 MOTION 2D contracts: ${n} numbered checks.`);
