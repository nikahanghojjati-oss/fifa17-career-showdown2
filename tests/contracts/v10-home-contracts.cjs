#!/usr/bin/env node
"use strict";
// JOB-25 (G-13 part 2b): Team V's Home (5e05a1f) on the app's #mainMenu, Nik's Audius playlist, and Loading left
// as the app's own startup splash. Static checks plus Team V's real soundtrack.js run in node:vm with a small fake DOM.
// r87 (Nik 2026-11-01): Home has no music strip; soundtrack.js owns the one <audio> and its state, and the only controls
// are the phone MUSIC tab and the desktop top-bar dock (js/musicDockV10.js), driven here through the HomeSoundtrack API.

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const crypto=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const sha=file=>crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT,file))).digest("hex");
let n=0;
function test(name,fn){try{fn();console.log(`ok ${++n} - ${name}`);}catch(error){console.error(`not ok ${++n} - ${name}`);throw error;}}

const html=read("index.html"),binder=read("js/homeScreensV10.js"),soundtrack=read("visual-assets/v10_1/home/soundtrack.js");
const adapter=read("css/homeV10.css"),homeCss=read("visual-assets/v10_1/home/home.css"),sw=read("service-worker.js");
const Home=require(path.join(ROOT,"js/homeScreensV10.js"));
const PRODUCT_IDS=["continueCareer","newShowdown","legacyButton","careerStatisticsButton","ruleBookButton","settingsButton"];

// ---- a small fake DOM, enough for soundtrack.js ----
function fakeDom(){
  const listeners=new WeakMap();
  const make=(tag,props={})=>{
    const el={tagName:tag.toUpperCase(),dataset:{},attributes:{},children:[],parentNode:null,textContent:"",disabled:false,paused:true,ended:false,currentTime:0,muted:false,src:"",...props,
      classList:{set:new Set(),toggle(c,on){on?this.set.add(c):this.set.delete(c);},contains(c){return this.set.has(c);}},
      setAttribute(k,v){this.attributes[k]=String(v);if(k==="src")this.src=String(v);},getAttribute(k){return k==="src"?(this.src||null):(this.attributes[k]??null);},
      removeAttribute(k){delete this.attributes[k];if(k==="src")this.src="";},
      addEventListener(type,fn){const map=listeners.get(el)||{};(map[type]=map[type]||[]).push(fn);listeners.set(el,map);},
      appendChild(child){if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(c=>c!==child);child.parentNode=el;el.children.push(child);return child;},
      click(){((listeners.get(el)||{}).click||[]).forEach(fn=>fn({target:el}));},fire(type){((listeners.get(el)||{})[type]||[]).forEach(fn=>fn({target:el}));},
      play(){el.paused=false;return Promise.resolve();},pause(){el.paused=true;},load(){},closest(){return null;}
    };
    return el;
  };
  const body=make("body");
  const created=[];
  const document={body,getElementById:()=>null,querySelector:()=>null,createElement:tag=>{const el=make(tag);created.push(el);return el;}};
  const requests=[];
  const window={document,fetch:url=>{requests.push(String(url));return Promise.reject(new Error("no network"));},Element:function(){}};
  window.window=window;
  return {window,document,body,created,requests};
}
function runSoundtrack(dom){vm.runInNewContext(soundtrack,{window:dom.window,document:dom.document,Element:dom.window.Element,console},{filename:"soundtrack.js"});return dom.window.HomeSoundtrack;}

test("Home keeps every product id, button and text; the skin only decorates",()=>{
  for(const id of PRODUCT_IDS)assert.match(html,new RegExp(`id=["']${id}["']`),id);
  assert.doesNotMatch(binder,/\.menuTile(?:Label|Code|Meta)[^\n]*textContent/,"tile text stays product-owned");
  assert.doesNotMatch(binder,/(?:continueCareer|newShowdown|legacyButton|careerStatisticsButton|ruleBookButton|settingsButton)["')\]][^\n]*(?:\.remove\(\)|replaceWith|outerHTML)/);
  assert.doesNotMatch(binder,/createElement\("button"\)[^\n]*trophyRoomButton|id="trophyRoomButton"/,"no second #trophyRoomButton (Career Statistics owns it)");
  assert.doesNotMatch(binder,/localStorage|sessionStorage|indexedDB/);
  // r90 W9 (LOOK hunt L12): one struck-medal icon set on every tile; Continue shows a drawn number-17 shirt, no photo.
  assert.equal(Home.TILE_ICONS.continueCareer,"continue");
  for(const id of ["newShowdown","legacyButton","careerStatisticsButton","homeTrophyRoomButton","homeStoryButton","ruleBookButton","settingsButton"])assert.ok(Array.isArray(Home.ICON_ART[Home.TILE_ICONS[id]])&&Home.ICON_ART[Home.TILE_ICONS[id]].length>=2,id);
  // every icon is relief, not a flat line drawing: raised metal with a lit rim, and ids that are unique to its tile
  for(const key of Object.values(Home.TILE_ICONS)){const svg=Home.tileIcon(key);assert.match(svg,/<mask id="w9i-/,key);assert.match(svg,/<radialGradient id="w9i-[^"]+" gradientUnits="userSpaceOnUse" cx="13" cy="9"/,key+": one key light, top left, on every tile");assert.doesNotMatch(svg,/filter=|feGaussianBlur|feSpecular/,key+": no glow or gloss filters");}
  assert.doesNotMatch(binder,/home-tiles\/|TILE_[A-Z]+_V1/,"no tile render is fetched");
});
test("Daniel starts and Nik joins with the product's own copy (the binder never writes it)",()=>{
  assert.match(html,/START A SHOWDOWN/);
  // r79 PR3: Nik's tile copy comes from the permanent pair (JOIN with Daniel's note, WAITING FOR DANIEL, or Join with a code);
  // Daniel's stays START A SHOWDOWN. Still the product's own copy, never the binder's.
  const identity=read("js/onlinePlayerIdentity.js");
  // r79 PR4: Daniel's tile reads PAIR AGAIN WITH NIK only when Nik's own record no longer names him (nothing live).
  assert.match(identity,/const nik=isNik\?nikHomeTile\(\):current\?\.status==="ready"\?liveHomeTile\(\)\|\|pairAgainTile\(\):null;[^\n]*nik\?nik\[1\]:"START A SHOWDOWN"/);
  assert.match(identity,/function nikHomeTile\(\)\{[^\n]*"JOIN DANIEL'S SHOWDOWN"[^\n]*"WAITING FOR DANIEL"[^\n]*"JOIN DANIEL'S SHOWDOWN"/);
  assert.doesNotMatch(binder,/JOIN DANIEL|START A SHOWDOWN|"(?:Daniel|Nik)"/);
});
test("Audius makes no request before the Play tap",()=>{
  const dom=fakeDom(),api=runSoundtrack(dom);
  api.init(Home.MEDIA);
  assert.equal(dom.created.length,0,"no <audio> before Play");
  assert.deepEqual(dom.requests,[]);
  assert.equal(api.current().key,"song2");assert.equal(api.state().src,null);
  api.toggle();
  assert.equal(dom.created.length,1,"one <audio> on Play");
  const audio=dom.created[0];
  assert.equal(audio.preload,"none");
  assert.equal(audio.src,"https://api.audius.co/v1/tracks/6R99GRQ/stream?app_name=CareerModeShowdown17");
  assert.equal(audio.paused,false);assert.deepEqual(dom.requests,[],"no fetch: the <audio> element streams");
  assert.doesNotMatch(soundtrack,/fetch\s*\(|XMLHttpRequest|localStorage/);
});
test("one long-lived <audio> on <body> keeps playing after Home unmounts and is reused when Home mounts again",()=>{
  const dom=fakeDom(),api=runSoundtrack(dom);
  api.init(Home.MEDIA);api.toggle();
  const audio=dom.created[0];
  assert.equal(audio.parentNode,dom.body,"audio lives on <body>, outside #mainMenu");
  assert.equal(audio.dataset.v10PersistentMedia,"home");
  api.init(Home.MEDIA);api.init(Home.MEDIA);
  api.toggle();assert.equal(audio.paused,true,"one toggle pauses");
  api.toggle();assert.equal(dom.created.length,1,"no second <audio>");
  api.mute();assert.equal(audio.muted,true);api.choose("kids");assert.equal(audio.muted,true,"mute stays on across songs");
  assert.equal(dom.body.children.filter(c=>c.tagName==="AUDIO").length,1);
  assert.match(soundtrack,/v10PersistentMedia/);assert.match(soundtrack,/document\.body\.appendChild\(audio\)/);
  assert.match(soundtrack,/if \(window\.HomeSoundtrack\) return;/,"a second load never replaces the playing <audio>");
});
test("r87: init running again keeps the chosen song; Song 2 is only the first pick",()=>{
  const dom=fakeDom(),api=runSoundtrack(dom);
  api.init(Home.MEDIA);
  assert.equal(api.current().key,"song2","Song 2 opens the game");
  api.choose("loveMeAgain");api.toggle();
  const audio=dom.created[0];
  api.init(Home.MEDIA);
  assert.equal(api.current().key,"loveMeAgain","re-init never jumps the title back to Song 2 while Love Me Again plays");
  assert.equal(api.state().selected,"loveMeAgain");
  api.toggle();api.toggle();
  assert.match(audio.src,/GNQJ5dl/,"pause and play resume the same song, not Song 2 from the start");
});
test("r87: Play after a failed stream asks Audius again instead of replaying the dead <audio>",()=>{
  const dom=fakeDom(),api=runSoundtrack(dom);
  api.init(Home.MEDIA);api.toggle();
  const audio=dom.created[0];
  audio.paused=true;audio.fire("error");
  assert.equal(api.state().failed,true);assert.equal(api.state().wantPlaying,false);
  let loads=0;audio.load=()=>{loads+=1;};audio.src="";
  api.toggle();
  assert.match(audio.src,/6R99GRQ/,"the stream URL is set again");
  assert.equal(api.state().failed,false);assert.equal(api.state().wantPlaying,true);
  assert.equal(audio.paused,false);
});
test("r87 (Nik 2026-11-01): Home has no music strip; the old YouTube player and its diagnostics are gone",()=>{
  assert.doesNotMatch(html,/menuMusicTile|menuMusic(?:Toggle|Mute|Status|Player)|menuMediaSelector/,"no strip markup in index.html");
  assert.doesNotMatch(binder,/menuMusicTile|v10HomeRetiredMedia|phoneTrackSheet|menuMediaSelector|cloneNode\(true\)/,"Home's binder never builds a strip");
  assert.doesNotMatch(binder+soundtrack,/youtube\.com|youtube-nocookie\.com|youtu\.be/i);
  assert.doesNotMatch(read("js/menuExperience.js"),/MENU_MEDIA_SOURCES|youtube|menuMusic|menuMedia(?:Selector|Iframe)/i);
  assert.doesNotMatch(read("js/diagnostics.js"),/menuMusic|menuMediaSelector|"bastille"|getMenuMediaProblems/);
  assert.match(read("js/ssjr.js"),/v10-home-screens","js\/homeScreensV10\.js"/);
});
test("Audius is the only new network host",()=>{
  const hosts=new Set([...(binder+soundtrack).matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map(m=>m[1].toLowerCase()));
  assert.deepEqual([...hosts],["api.audius.co"]);
  assert.equal(Home.MEDIA.tracks.length,19);assert.deepEqual(Home.MEDIA.tracks.map(t=>t.audiusTrackId),["6R99GRQ","GNQJ5dl","5xdlPEJ","K9J0w8l","Nvydpr7","WGNNo","PQ28va7","3mjjB","y7Z9P","Ymgov","qZ17b","gb33l","n1zqQ","ygyOr","3RaaM","AV9dv","ryBXG","G5rXAWE","0dGWK"],"Nik's list (2026-10-27): Song 2 first, Love Me Again second, the new picks, then the earlier top 10 in order");assert.equal(Home.MEDIA.defaultTrack,"song2");
});
test("Home registers through job 24's loader with Team V's CSS and the adapter; the soundtrack starts with the app (HE-06)",()=>{
  assert.match(binder,/V\.register\("mainMenu",\{css:HOME_CSS\.slice\(\),js:\[\],/);
  assert.match(binder,/load\("v10-home-soundtrack",BASE\+"home\/soundtrack\.js",\(\)=>Boolean\(root\.HomeSoundtrack\)\)/);
  assert.match(binder,/js:\[\],frame:\(\)=>FRAME,mount:hmDecorate,unmount:hmUnmount\}\);\n    hmStartMusic\(\);/,"install() starts the soundtrack and its player before Home is drawn");
  assert.deepEqual([...Home.HOME_CSS],["home/home.css","../../css/homeV10.css"]);
  assert.doesNotMatch(binder,/register\("loadingScreen"/);
});
test("Loading stays the app's splash: the Reus photo in Team V's tunnel room (HO-072) and its credit",()=>{
  assert.match(html,/<source media="\(orientation: portrait\)" srcset="assets\/loading\/ENV_LOADING_PHONE_HC_590W\.webp\?v=[^"]+" width="590" height="1049">\n<img class="startupRoom" src="assets\/loading\/ENV_LOADING_PLATE_HC_1X\.webp\?v=[^"]+" width="1920" height="1080" alt="" decoding="async" fetchpriority="high">/,"HO-072: Team V's tunnel room (phone and desktop) is the first layer of the splash");
  assert.match(html,/<source media="\(orientation: portrait\)" srcset="assets\/loading\/REUS_P_590W\.webp\?v=[^"]+" width="521" height="881">\n<img id="startupAthlete" class="startupReus" src="assets\/loading\/REUS_D_1X\.webp\?v=[^"]+" width="793" height="1339" alt="" decoding="async" fetchpriority="high">/,"HO-072: the cut-out of the licensed Reus photo (phone and desktop) stands in the room");
  assert.equal([...html.matchAll(/<link rel="preload" as="image" href="assets\/loading\/(?:ENV_LOADING_PLATE_HC_1X|REUS_D_1X|ENV_LOADING_PHONE_HC_590W|REUS_P_590W)\.webp\?v=[^"]+" media="\(orientation: (?:portrait|landscape)\)" fetchpriority="high">/g)].length,4,"first paint preloads only the light pair for the window's shape");
  for(const sharp of ["ENV_LOADING_PHONE_HC","ENV_LOADING_PLATE_HC_2X","REUS_P","REUS_D_2X"]){
    assert.match(html,new RegExp(`<source media="\\(orientation: (?:portrait|landscape)\\) and [^"]+" srcset="assets/loading/${sharp}\\.webp" width="\\d+" height="\\d+">`),`the sharp ${sharp} layer is asked for by sharp or large screens only, after first paint`);
    assert.ok(fs.existsSync(path.join(ROOT,"assets/loading",sharp+".webp")),sharp);
    assert.ok(!sw.includes(`assets/loading/${sharp}.webp`),`${sharp} is not precached`);
  }
  assert.match(html,/<img class="startupIdentity" src="assets\/loading\/LOGO_CM17_WORDMARK_V3_640\.webp\?v=[^"]+" width="640" height="107" alt="" decoding="async">/,"the title is the V3 logo lettering, live on the cover (no lettering is baked into the layers)");
  assert.deepEqual(fs.readFileSync(path.join(ROOT,"assets/loading/LOGO_CM17_WORDMARK_V3_640.webp")),fs.readFileSync(path.join(ROOT,"visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V3_640.webp")),"the cover's logo is Team V's file, byte for byte");
  assert.ok(fs.existsSync(path.join(ROOT,"assets/marco-reus-2015-cc-by.webp")),"the licensed source photo stays");
  assert.match(html,/<p class="startupPhotoCredit">Marco Reus photo: <a [^>]*>Tim Reckmann<\/a> · <a [^>]*>CC BY 2\.0<\/a> · Cropped and edited for display<\/p>/,"HO-030: credit keeps Tim Reckmann, CC BY 2.0 and says edited");
  assert.doesNotMatch(binder,/loadingScreen|startupPhotoCredit|startupIdentity/);
  assert.equal(fs.existsSync(path.join(ROOT,"visual-assets/v10_1/loading")),false,"no unwired Loading files are shipped");
});
test("Home CSS/JS are precached; Home images use the revision-keyed runtime image cache, never SHELL_PATHS",()=>{
  const shell=new Set([...sw.matchAll(/^\s+"([^"]+)",?$/gm)].map(m=>m[1]));
  for(const file of ["js/homeScreensV10.js","visual-assets/v10_1/home/home.css","visual-assets/v10_1/home/soundtrack.js","css/homeV10.css"])assert.ok(shell.has(file),file);
  assert.ok(![...shell].some(file=>/^visual-assets\/.*\.(webp|png|jpe?g|avif|gif|svg)$/i.test(file)),"no Team V image precached");
  const imageRule=new RegExp(/const V10_IMAGE_PATH = \/(.+)\/i;/.exec(sw)[1],"i");
  const images=[...binder.matchAll(/BASE\+"([^"]+\.webp)/g),...binder.matchAll(/\$\{BASE\}\$\{file\}/g)].length;
  assert.ok(images>0);
  const files=[...[...binder.matchAll(/pic\("[^"]+","([^"]+\.webp)"/g)].map(m=>m[1]),"home/assets/LOGO_CM17_WORDMARK_V3_640.webp","home/assets/LOGO_CM17_WORDMARK_V3_1040.webp","home/assets/LOGO_CM17_WORDMARK_V3_2080.webp",
...[...homeCss.matchAll(/url\("?(assets\/[^")]+\.webp)"?\)/g)].map(m=>"home/"+m[1])];
  for(const file of files){const full="visual-assets/v10_1/"+file;assert.ok(fs.existsSync(path.join(ROOT,full)),full);assert.ok(imageRule.test(full),full);}
  for(const m of homeCss.matchAll(/url\((\.\.\/shared\/fonts\/[^)]+\.woff2)\)/g))assert.ok(shell.has("visual-assets/v10_1/"+m[1].slice(3)),m[1]);
  assert.doesNotMatch(homeCss,/tr2\/slice-02-plate/,"fonts come from the shared kit");
});
test("Home shows all seven of Team V's tiles (Nik, 2026-10-05): Legacy and Statistics are shown and Trophy Room is added",()=>{
  const appCss=read("css/app.css");
  assert.doesNotMatch(appCss,/#(?:legacyButton|careerStatisticsButton)[^{]*\{[^}]*display:none/,"Legacy and Statistics are not hidden");
  assert.match(appCss,/#rivalryStatisticsButton:not\(\[data-test-surface=internal-audit\]\)\{display:none!important\}/,"the dashboard's local Rivalry Statistics stays contained");
  assert.equal(Home.TROPHY_TILE.id,"homeTrophyRoomButton","Career Statistics keeps #trophyRoomButton");
  assert.equal(Home.TILE_ICONS[Home.TROPHY_TILE.id],"homeTrophyRoomButton","r90 W9: Trophy Room carries the drawn cup of the Home icon set");
  assert.match(binder,/root\.openOptionalModule\("trophyRoom"\)/,"the tile opens the product's own Trophy Room route");
  const phone=adapter.split("/* ---------- phone portrait")[1];
  for(const id of ["continueCareer","newShowdown","legacyButton","careerStatisticsButton","homeTrophyRoomButton","ruleBookButton","settingsButton"])assert.match(phone,new RegExp(`#${id} \\{ grid-column`),id);
});
test("the adapter keeps the product's protected Home facts (desktop tile placement); Reus is hidden, not restyled",()=>{
  assert.doesNotMatch(adapter,/menuCoverAthlete\s*(?:img|::|\.)|menuCoverNumber|object-fit/,"the adapter never restyles the old Reus cover");
  assert.match(adapter,/#mainMenu\.v10Home #continueCareer \.menuCoverAthlete, #mainMenu\.v10Home \.menuAthleteCredit \{ display: none; \}/,"the old Reus cover and credit are not shown on Home");
  const desktop=adapter.split("/* ---------- phone portrait")[0];
  assert.doesNotMatch(desktop,/grid-(?:column|row)\s*:/,"desktop keeps the app's grid placement values");
  assert.doesNotMatch(adapter,/#(?:legacyButton|careerStatisticsButton|rivalryStatisticsButton)[^{]*\{[^}]*display/,"the adapter never sets tile display");
  assert.match(adapter,/#mainMenu\.v10Home #continueCareer:disabled \{ opacity: 1; filter: none; \}/);
});
test("Team V files are the 5e05a1f copies with only the listed edits (HO-005: phone overlays V2; HO-027 r78: no state dimming; r87: no music strip)",()=>{
  // r87 (Nik 2026-11-01): every .menuMusicTile / soundtrack strip rule left home.css.
  assert.equal(sha("visual-assets/v10_1/home/home.css"),"f801ac76b2efa05d9371a7c34dad80c734cb1a92706d560c9994478d61d5f528");
  assert.doesNotMatch(homeCss,/OVL_HOME_(?:DANIEL|NIK)_PHONE_V1/,"HO-005: phone overlays without the ghost coat (V2)");
  // r85 (app, Nik 2026-10-27): a small API (toggle, mute, choose, tracks, current, subscribe) for the docked player in js/musicDockV10.js.
  // r87 (app): init keeps the chosen song, and Play after a failed stream asks Audius again.
  // r87 (Nik 2026-11-01): no strip UI; the file owns only the <audio>, the playback state and the API.
  assert.equal(sha("visual-assets/v10_1/home/soundtrack.js"),"1e8c1287fcc7cbd5c4f26232ccf297db82c8fbcbdc2e075f411aa38441759ac1");
  assert.equal((soundtrack.match(/r87 \(app\)/g)||[]).length,1);
  assert.doesNotMatch(soundtrack,/querySelector|getElementById|menuMusic|ui\./,"soundtrack.js reads no Home markup");
});

console.log(`1..${n}`);
