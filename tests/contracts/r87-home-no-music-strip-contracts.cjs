#!/usr/bin/env node
"use strict";
// r87 (Nik 2026-11-01): Home has no separate music strip (.menuMusicTile, the thin soundtrack card with its own PLAY /
// MUTE / TRACKS buttons) at any size, on phone Home or desktop Home. Music lives only in the phone MUSIC tab of the bottom
// bar and the desktop top-bar player (js/musicDockV10.js); visual-assets/v10_1/home/soundtrack.js owns the one <audio>.
// This contract shuts every route the strip could come back by:
//   1. markup: no strip element (or its old ids/classes) in index.html;
//   2. code: no script in js/ or visual-assets/ builds it (createElement / innerHTML / template / class names);
//   3. styles: no rule for it in any stylesheet, in any media query (css/, visual-assets/, and CSS that scripts inject);
//   4. the replacement stays: the MUSIC tab and the top-bar dock are built, soundtrack.js owns the <audio>, and the
//      soundtrack starts with the app, not with Home's markup;
//   5. the tab bar never covers a Home tile in the 761-900px landscape band (Home ends at the bar and <main> scrolls).
// CONTRACT_ROOT=<dir> runs the same checks against another tree (used to show it fails on 90bbeb5).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ROOT=process.env.CONTRACT_ROOT?path.resolve(process.env.CONTRACT_ROOT):path.resolve(__dirname,"../..");
const read=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
let n=0,failed=0;
function check(name,fn){try{fn();console.log(`ok ${++n} - ${name}`);}catch(error){failed+=1;console.error(`not ok ${++n} - ${name}\n  ${String(error.message).split("\n")[0]}`);}}
function walk(dir,ext,out=[]){
  const abs=path.join(ROOT,dir);if(!fs.existsSync(abs))return out;
  for(const entry of fs.readdirSync(abs,{withFileTypes:true})){
    const rel=path.join(dir,entry.name);
    if(entry.isDirectory()){if(entry.name!=="node_modules")walk(rel,ext,out);}
    else if(ext.some(e=>entry.name.endsWith(e)))out.push(rel);
  }
  return out;
}
const stripCode=s=>s.replace(/\/\*[\s\S]*?\*\//g,"").replace(/(^|[^:"'`\\])\/\/[^\n]*/g,"$1");

// Every name the strip and its parts were known by (index.html r56 YouTube card, Team V's Audius card, r85 TRACKS sheet).
const STRIP_NAMES=["menuMusicTile","menuMusicHeader","menuMusicArtist","menuMusicSource","menuMusicPlayer","menuMusicPlaceholder","menuMusicStatus",
  "menuMusicControls","menuMusicControl","menuMusicToggle","menuMusicMute","menuMediaSelector","menuMediaChoice","menuAudiusSelector",
  "phoneSheetToggle","phoneTrackSheetToggle","phoneTrackSheetOpen","phoneTrackSheetClose","phoneTrackSheetBackdrop","v10HomeRetiredMedia","vinylDeck"];
const STRIP_RE=new RegExp(`\\b(?:${STRIP_NAMES.join("|")})\\b`);

check("1. index.html has no Home music strip element",()=>{
  const html=read("index.html");
  const hit=html.match(STRIP_RE);
  assert.equal(hit,null,`index.html still names ${hit&&hit[0]}`);
  assert.doesNotMatch(html,/aria-label="Menu media"|data-menu-media-source/,"no menu media card or choices");
  const grid=(html.match(/<div class="fifaMenuGrid">([\s\S]*?)\n<\/div>/)||[])[1]||"";
  assert.ok(grid,"Home tile grid found");
  assert.deepEqual([...grid.matchAll(/<(section|div|aside)\b/g)].map(m=>m[1]),[],"the tile grid holds tiles only");
});

check("2. no script builds the strip (createElement / innerHTML / templates / class names)",()=>{
  const named=["js/homeScreensV10.js","js/menuExperience.js","visual-assets/v10_1/home/soundtrack.js","js/musicDockV10.js"];
  for(const f of named)assert.ok(fs.existsSync(path.join(ROOT,f)),`${f} exists`);
  assert.ok(!fs.existsSync(path.join(ROOT,"visual-assets/v10_1/home/home.js")),"Team V's home.js (its strip builder) is not shipped");
  const files=[...new Set([...named,...walk("js",[".js"]),...walk("visual-assets",[".js"])])];
  const offenders=[];
  for(const f of files){const code=stripCode(read(f));const hit=code.match(STRIP_RE);if(hit)offenders.push(`${f}: ${hit[0]}`);}
  assert.deepEqual(offenders,[],"scripts that still name a strip part");
  const binder=stripCode(read("js/homeScreensV10.js"));
  assert.doesNotMatch(binder,/hmEl\("(?:section|div)","[^"]*(?:music|media|track)/i,"Home's binder creates no music element");
  assert.doesNotMatch(binder,/function hmMusic\b|retired|cloneNode\(true\)/,"no strip builder or YouTube retirement left");
  const menu=stripCode(read("js/menuExperience.js"));
  assert.doesNotMatch(menu,/MENU_MEDIA_SOURCES|youtube|createMenuMediaIframe|ensureMenuMediaSelector|bindMenuMediaControls/i,"the old YouTube strip code is gone");
  const sound=stripCode(read("visual-assets/v10_1/home/soundtrack.js"));
  assert.doesNotMatch(sound,/querySelector|getElementById|innerHTML|insertAdjacentHTML|\.card\b/,"soundtrack.js reads and builds no Home markup");
});

check("3. no stylesheet has a rule for the strip, in any media query",()=>{
  const sheets=[...walk("css",[".css"]),...walk("visual-assets",[".css"])];
  assert.ok(sheets.length>10,"stylesheets found");
  const offenders=[];
  for(const f of sheets){const css=read(f).replace(/\/\*[\s\S]*?\*\//g,"");const hit=css.match(STRIP_RE);if(hit)offenders.push(`${f}: ${hit[0]}`);}
  // CSS that scripts inject (template strings with selectors).
  for(const f of walk("js",[".js"])){const code=stripCode(read(f));const hit=code.match(/[.#](?:menuMusic\w*|menuMedia\w*|phoneTrackSheet\w*|phoneSheetToggle)\s*[{,:[]/);if(hit)offenders.push(`${f}: ${hit[0]}`);}
  assert.deepEqual(offenders,[],"style rules that still target a strip part");
  for(const f of sheets)assert.doesNotMatch(read(f),/@keyframes\s+home-vinyl-spin/,`${f}: the strip's vinyl animation is gone`);
});

check("4. music stays: MUSIC tab and top-bar dock, one <audio> owned by soundtrack.js, started with the app",()=>{
  const dock=read("js/musicDockV10.js"),sound=read("visual-assets/v10_1/home/soundtrack.js"),binder=read("js/homeScreensV10.js");
  assert.match(dock,/b\.id="cmsMusicTab"/,"phone MUSIC tab");assert.match(dock,/el\.id="cmsMusicDockTop"/,"desktop top-bar dock");
  assert.match(dock,/el\.id="cmsMusicSheet"/,"the player sheet with the track list");
  assert.doesNotMatch(dock,/phoneTrackSheet|mdHomeHook/,"the dock no longer hooks a Home TRACKS button");
  assert.match(sound,/document\.createElement\("audio"\)/);assert.match(sound,/document\.body\.appendChild\(audio\)/);
  assert.match(sound,/if \(window\.HomeSoundtrack\) return;/,"a second load never drops the playing <audio>");
  assert.match(binder,/load\("v10-home-soundtrack",BASE\+"home\/soundtrack\.js"/);
  assert.match(binder,/root\.HomeSoundtrack\.init\(MEDIA\)/);
  assert.match(binder,/mount:hmDecorate,unmount:hmUnmount\}\);\n    hmStartMusic\(\);/,"install() starts the music before Home is drawn");
  const Home=require(path.join(ROOT,"js/homeScreensV10.js"));
  assert.deepEqual(Home.MEDIA.tracks.slice(0,2).map(t=>`${t.title} / ${t.artist}`),["SONG 2 / Blur","LOVE ME AGAIN / John Newman"]);
  assert.equal(Home.MEDIA.defaultTrack,"song2");
});

check("5. the tab bar never covers a Home tile in the 761-900px landscape band; <main> scrolls when Home is taller",()=>{
  const css=read("css/homeV10.css");
  const at=css.indexOf("@media (min-width: 761px) and (max-width: 900px) and (min-height: 481px) and (orientation: landscape) {");
  assert.ok(at>=0,"the band rule exists");
  const body=css.slice(at,css.indexOf("\n}\n",at));
  assert.match(body,/#app #mainMenu\.v10Home \{\n    position: relative; inset: auto; height: max\(100%, 525px\); min-height: 0;\n    --tile-top: calc\(100% - 8px - var\(--tile-h\)\);/,"Home is a page in <main> that ends at the bar; the tiles end 8px above it");
  assert.match(body,/main:has\(> #mainMenu\.v10Home:not\(\.hidden\)\) \{ padding: 0; \}/);
  assert.match(body,/> \.nav-reserve, #app #mainMenu\.v10Home \.menuBottomStrip \{ display: none; \}/,"the footer band never lies over the tiles");
  assert.doesNotMatch(body,/visibility:\s*hidden|opacity:\s*0/,"nothing in the band is hidden by visibility or opacity");
  assert.match(read("visual-assets/v10_1/shared/navbar/navbar.css"),/\.sd-nav-bottom/,"the bottom tab bar stays");
});

console.log(`1..${n}`);
if(failed){console.error(`r87 Home no-music-strip contracts: ${failed} of ${n} failed`);process.exit(1);}
console.log(`r87 Home no-music-strip contracts: ${n} checks passed`);
