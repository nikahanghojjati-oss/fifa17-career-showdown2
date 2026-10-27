"use strict";
// r80 short screens (Nik): nothing on any screen may be jammed, clipped or covered at any window size, every button must be
// reachable, no dimming, and `main` is the only scroller. tests/browser/r80-short-screens-audit.cjs sweeps the screens at 13
// window sizes; this contract pins each fix that sweep needed, so a later style change cannot quietly bring the overlap back.
//   S1 Rivalry Statistics 1100x600 / 1024x600: BACK TO SHOWDOWN HOME joins the flow under the panels (no docked bar on them).
//   S2 Trophy Room 1100x600 / 1024x600: BACK joins the flow under the cabinet; 844x390: the wordmark band is 88px.
//   S3 Standings 1536x864: the eight-row board grows past Team V's 52% instead of scrolling inside itself.
//   S4 Season Results 1024x768, 1100x600, 1024x600 and 1536x864: the page-scroll layout (same cards, main scrolls), with the
//      cards in front of the cut-out layers and the plate filling the window.
//   S5 Final Winner: the last-season result line wraps in its own cell (1024x768); the plaque is 148 picture px tall.
//   S6 Career Statistics 360x740: the Compare panel fits its seven rows above the action buttons.
//   S7 Home 1024x768, 1100x600, 1024x600 and 1366x640: the soundtrack credit keeps one line and the card fits its content
//      (AUDIUS SOUNDTRACK is not cut) and ends above the tile row; at 1024x600 SHOWDOWN HQ keeps one line, so HOME
//      no longer runs into TWO MANAGERS · ONE LEGACY; from 1001px to 1099px the tile names fit their text column.
//   S8 the browser audit covers every screen and window size above and fails on any finding outside its listed design items;
//      test:browser (the Gate's full browser bundle) runs every screen at 1366x768, 1100x600, 1024x768, 844x390 and 393x660.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let checks=0;
const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};
const flat=text=>text.replace(/\s+/g," ");
// the body of the first @media block whose query matches `query` exactly (whitespace-insensitive)
function mediaBlock(text,query){
  const src=flat(text),head=`@media ${flat(query)}`;
  const at=src.indexOf(head);
  assert.ok(at>=0,`@media ${query} is present`);
  let i=src.indexOf("{",at+head.length),depth=0,start=i;
  for(;i<src.length;i+=1){if(src[i]==="{")depth+=1;else if(src[i]==="}"){depth-=1;if(depth===0)break;}}
  return src.slice(start+1,i);
}

const rivalryCss=read("css/rivalryLegacyV10.css");
const careerJs=read("js/careerScreensV10.js");
const seasonJs=read("js/seasonFinalV10.js");
const homeCss=read("css/homeV10.css");

{
  const body=mediaBlock(rivalryCss,"(min-width:1024px) and (max-height:630px) and (orientation:landscape)");
  assert.match(body,/#app #statistics\[data-rivalry-legacy-v10\] \.rv-actions \{ position:static; margin:6px 0 0; \}/);
  ok("S1 Rivalry Statistics: on 600px-tall desktops the BACK action is in the flow, not docked over the panels");
}

{
  const body=mediaBlock(careerJs,"(min-width:901px) and (min-height:481px) and (max-height:630px)");
  assert.match(body,/#app #trophyRoom \.trophyBack \{position:relative;bottom:auto\}/);
  assert.match(careerJs,/--tr-title:88px;/,"sideways Trophy Room wordmark band is 88px");
  assert.doesNotMatch(careerJs,/--tr-title:78px;/,"the 78px band cut the tagline at 844x390");
  ok("S2 Trophy Room: BACK in the flow on 600px-tall desktops; sideways wordmark band 88px");
}

{
  const body=mediaBlock(seasonJs,"(min-width:901px) and (min-height:861px)");
  assert.match(body,/#app #standings\.standingsScreenV10 \.sdg-board\{height:auto;min-height:52%\}/);
  ok("S3 Standings: the board grows to fit eight rows on tall desktops (no inner scroller)");
}

{
  const src=flat(seasonJs);
  const bands=[
    "(min-width:901px) and (max-width:1239px) and (min-height:501px) and (max-height:800px) and (orientation:landscape),",
    "(min-width:1240px) and (max-width:1400px) and (min-height:620px) and (max-height:800px),",
    "(min-width:1401px) and (max-width:1879px) and (min-height:620px) and (max-height:1039px) and (orientation:landscape),",
    "(min-width:1880px) and (max-width:2620px) and (min-height:1040px) and (max-height:1120px) {"
  ];
  for(const band of bands){
    const count=src.split(band).length-1;
    assert.ok(count>=2,`Season Results page-scroll band ${band} is in the flow layout and its :active list (${count})`);
  }
  const body=mediaBlock(seasonJs,"(min-width:901px) and (max-width:1239px) and (min-height:501px) and (max-height:800px) and (orientation:landscape)");
  assert.match(body,/\.v10SeasonStage \.sd-stage__layer--ui \{ z-index:5; \}/,"cards stay in front of the cut-out and light layers");
  assert.match(body,/\.sd-stage__registered \{ top:0!important;width:max\(100vw,177\.77778svh\)!important;height:max\(56\.25vw,100svh\)!important; \}/,"the plate fills the window");
  ok("S4 Season Results: 901-1239 x 501-800 and 1401-1879 x 620-1039 use the page-scroll layout");
}

{
  assert.match(seasonJs,/#app #seasonEntry #finalWinnerLastSeason #panelLastSeasonResult \{ max-width:100%;white-space:normal;overflow-wrap:normal;text-align:center; \}/);
  assert.match(seasonJs,/height:max\(calc\(148 \* var\(--fw-k\)\),124px\);/);
  assert.match(seasonJs,/--fw-rh:max\(calc\(148 \* var\(--fw-k\)\),124px\);/);
  assert.doesNotMatch(seasonJs,/max\(calc\(138 \* var\(--fw-k\)\),124px\)/,"the 138px plaque cut TOTAL TROPHIES");
  ok("S5 Final Winner: the last-season line wraps in its cell and the plaque is 148 picture px");
}

{
  const body=mediaBlock(careerJs,"(max-width:370px) and (orientation:portrait) and (min-height:701px) and (max-height:800px)");
  assert.match(body,/#app #careerStatistics\.careerScreenV10 \.phoneHub \{ top:38\.5%; \}/);
  assert.match(body,/\.compareRow \{ padding:0; \}/);
  assert.match(body,/\.compareTrack \{ margin-top:0; \}/);
  ok("S6 Career Statistics 360x740: the Compare panel's seven rows fit above the action buttons");
}

{
  const body=mediaBlock(homeCss,"(min-width: 901px) and (max-width: 1199px) and (min-height: 501px) and (max-height: 775px) and (orientation: landscape), (min-width: 1200px) and (min-height: 600px) and (max-height: 800px) and (min-aspect-ratio: 2101/1000) and (orientation: landscape)");
  assert.match(body,/\.menuMusicArtist \{ white-space: nowrap; overflow: hidden; text-overflow: ellipsis; \}/);
  assert.doesNotMatch(body,/\.menuMusicStatus/,"the status line keeps SONG 2 · AUDIUS · READY in full");
  assert.match(body,/top: auto !important; bottom: max\(180px, calc\(46\.7vh - max\(17vh, 116px\)\)\) !important;/,"the card keeps Team V's bottom edge, at least 8px above the tile row");
  assert.match(body,/height: auto !important; min-height: max\(17vh, 116px\);/,"the card grows upward to fit its content");
  const head=mediaBlock(homeCss,"(min-width: 901px) and (max-width: 1199px) and (min-height: 501px) and (max-height: 640px) and (orientation: landscape)");
  assert.match(head,/#app #mainMenu\.v10Home \.fifaMenuHeadingMeta \.sd-label \{ font-size: min\(44px, 4vw\); \}/,"SHOWDOWN HQ keeps one line, so HOME stays under the lockup");
  const names=mediaBlock(homeCss,"(min-width: 1001px) and (max-width: 1099px) and (min-height: 501px) and (orientation: landscape)");
  assert.match(names,/\.menuTile:not\(#continueCareer\) \.menuTileLabel \{ font-size: min\(20px, 1\.68vw\); \}/,"tile names fit their column at 1001-1099px");
  ok("S7 Home 1024x768, 1100x600, 1024x600, 1366x640: one-line soundtrack credit; the card fits its content above the tiles");
}

{
  const audit=read("tests/browser/r80-short-screens-audit.cjs");
  for(const size of ["1920x1080","1536x864","1366x768","1366x640","1280x650","1100x600","1024x768","1024x600","820x1180","844x390","393x660","390x844","360x740"])
    assert.ok(audit.includes(`"${size}"`),`the audit sweeps ${size}`);
  for(const screen of ["HOME","SETTINGS","RULE_BOOK","CONNECT_PLAYERS","LEGACY","HISTORY","CAREER_STATISTICS","TROPHY_ROOM","RIVALRY","STANDINGS","FINAL_WINNER","SEASON_ENTRY","SEASON_REVIEW"])
    assert.match(audit,new RegExp(`\\b${screen}\\s*:`),`the audit opens ${screen}`);
  assert.match(audit,/if\(open\.length\) process\.exitCode = 1;/,"any finding outside the listed design items fails the audit");
  assert.doesNotMatch(audit,/\.only\(|\.skip\(/);
  // the Gate executes it: every screen at five representative sizes, one test:browser audit per size
  const pkg=JSON.parse(read("package.json"));
  const bundle=pkg.scripts["test:browser"].split(/\s+&&\s+/).map(command=>command.trim());
  for(const size of ["1366x768","1100x600","1024x768","844x390","393x660"])
    assert.ok(bundle.includes(`CMS_SHORT_SIZES=${size} node tests/browser/r80-short-screens-audit.cjs`),`test:browser runs the short-screens audit at ${size}`);
  assert.equal(pkg.scripts["test:short-screens"],"node tests/browser/r80-short-screens-audit.cjs","the full 13-size sweep stays a script");
  ok("S8 the browser audit sweeps 13 sizes and 13 screens, fails on any open finding, and test:browser runs it at five sizes");
}

console.log(`r80 short-screens contracts: ${checks} checks passed`);
