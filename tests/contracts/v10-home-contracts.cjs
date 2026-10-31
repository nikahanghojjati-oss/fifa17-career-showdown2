#!/usr/bin/env node
"use strict";
// JOB-25 (G-13 part 2b): Team V's Home (5e05a1f) on the app's #mainMenu, Nik's Audius playlist, and Loading left
// as the app's own startup splash. Static checks plus Team V's real soundtrack.js run in node:vm with a small fake DOM.

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
const PRODUCT_IDS=["continueCareer","newShowdown","legacyButton","careerStatisticsButton","ruleBookButton","settingsButton","menuMusicToggle","menuMusicMute","menuMusicStatus","menuMusicPlayer"];

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
  const body=make("body"),card=make("section"),toggle=make("button",{id:"menuMusicToggle"}),mute=make("button",{id:"menuMusicMute"}),status=make("p",{id:"menuMusicStatus"});
  const selector=make("div"),title=make("strong"),artist=make("p");
  const choices=Home.MEDIA.tracks.map(t=>t.key).map(key=>{const b=make("button");b.dataset.soundtrackTrack=key;return b;});
  card.querySelector=sel=>({".menuMusicHeader strong":title,".menuMusicArtist":artist,".menuMediaSelector":selector})[sel]||null;
  card.querySelectorAll=sel=>sel==="[data-soundtrack-track]"?choices:[];
  const ids={menuMusicToggle:toggle,menuMusicMute:mute,menuMusicStatus:status};
  const created=[];
  const document={body,getElementById:id=>ids[id]||null,querySelector:sel=>sel===".menuMusicTile"?card:null,createElement:tag=>{const el=make(tag);created.push(el);return el;}};
  const requests=[];
  const window={document,fetch:url=>{requests.push(String(url));return Promise.reject(new Error("no network"));},Element:function(){}};
  window.window=window;
  return {window,document,body,card,toggle,mute,status,choices,created,requests,listenerCount:(el,type)=>((listeners.get(el)||{})[type]||[]).length};
}
function runSoundtrack(dom){vm.runInNewContext(soundtrack,{window:dom.window,document:dom.document,Element:dom.window.Element,console},{filename:"soundtrack.js"});return dom.window.HomeSoundtrack;}

test("Home keeps every product id, button and text; the skin only decorates",()=>{
  for(const id of PRODUCT_IDS)assert.match(html,new RegExp(`id=["']${id}["']`),id);
  assert.doesNotMatch(binder,/\.menuTile(?:Label|Code|Meta)[^\n]*textContent/,"tile text stays product-owned");
  assert.doesNotMatch(binder,/(?:continueCareer|newShowdown|legacyButton|careerStatisticsButton|ruleBookButton|settingsButton)["')\]][^\n]*(?:\.remove\(\)|replaceWith|outerHTML)/);
  assert.doesNotMatch(binder,/createElement\("button"\)[^\n]*trophyRoomButton|id="trophyRoomButton"/,"no second #trophyRoomButton (Career Statistics owns it)");
  assert.doesNotMatch(binder,/localStorage|sessionStorage|indexedDB/);
  assert.equal(Home.TILE_ART.continueCareer,"TILE_CONTINUE_V1.webp","Continue shows Team V's number-17 player (owner, 2026-10-05)");
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
  assert.equal(dom.status.textContent,"SONG 2 · AUDIUS · READY");
  dom.toggle.click();
  assert.equal(dom.created.length,1,"one <audio> on Play");
  const audio=dom.created[0];
  assert.equal(audio.preload,"none");
  assert.equal(audio.src,"https://api.audius.co/v1/tracks/6R99GRQ/stream?app_name=CareerModeShowdown17");
  assert.equal(audio.paused,false);assert.deepEqual(dom.requests,[],"no fetch: the <audio> element streams");
  assert.doesNotMatch(soundtrack,/fetch\s*\(|XMLHttpRequest|localStorage/);
});
test("one long-lived <audio> on <body> keeps playing after Home unmounts and is reused when Home mounts again",()=>{
  const dom=fakeDom(),api=runSoundtrack(dom);
  api.init(Home.MEDIA);dom.toggle.click();
  const audio=dom.created[0];
  assert.equal(audio.parentNode,dom.body,"audio lives on <body>, outside #mainMenu");
  assert.equal(audio.dataset.v10PersistentMedia,"home");
  api.init(Home.MEDIA);api.init(Home.MEDIA);
  assert.equal(dom.listenerCount(dom.toggle,"click"),1,"re-mount binds Play once");
  assert.equal(dom.listenerCount(dom.mute,"click"),1,"re-mount binds Mute once");
  dom.toggle.click();assert.equal(audio.paused,true,"one tap pauses (no double listener)");
  dom.toggle.click();assert.equal(dom.created.length,1,"no second <audio>");
  assert.equal(dom.body.children.filter(c=>c.tagName==="AUDIO").length,1);
  assert.match(soundtrack,/v10PersistentMedia/);assert.match(soundtrack,/document\.body\.appendChild\(persistent\)/);
  assert.doesNotMatch(soundtrack,/ui\.card\.appendChild\(audio\)/);
});
test("r87: Home mounting again (or the online signal) keeps the chosen song; Song 2 is only the first pick",()=>{
  const dom=fakeDom(),api=runSoundtrack(dom);
  api.init(Home.MEDIA);
  assert.equal(api.current().key,"song2","Song 2 opens the game");
  api.choose("loveMeAgain");dom.toggle.click();
  const audio=dom.created[0];
  api.init(Home.MEDIA);
  assert.equal(api.current().key,"loveMeAgain","re-init never jumps the title back to Song 2 while Love Me Again plays");
  assert.equal(dom.choices.find(b=>b.dataset.soundtrackTrack==="loveMeAgain").attributes["aria-pressed"],"true");
  dom.toggle.click();dom.toggle.click();
  assert.match(audio.src,/GNQJ5dl/,"pause and play resume the same song, not Song 2 from the start");
});
test("r87: Play after a failed stream asks Audius again instead of replaying the dead <audio>",()=>{
  const dom=fakeDom(),api=runSoundtrack(dom);
  api.init(Home.MEDIA);dom.toggle.click();
  const audio=dom.created[0];
  audio.paused=true;audio.fire("error");
  assert.equal(api.state().failed,true);assert.equal(api.state().wantPlaying,false);
  assert.equal(dom.status.textContent,Home.MEDIA.statusError);
  let loads=0;audio.load=()=>{loads+=1;};audio.src="";
  dom.toggle.click();
  assert.match(audio.src,/6R99GRQ/,"the stream URL is set again");
  assert.equal(api.state().failed,false);assert.equal(api.state().wantPlaying,true);
  assert.equal(audio.paused,false);
});
test("the YouTube player is retired only by lazy Home code, and product diagnostics still see their nodes",()=>{
  assert.match(html,/id="menuMusicPlayer"/,"index.html is unchanged");
  assert.match(binder,/v10HomeRetiredMedia/);assert.match(binder,/retired\.hidden=true/);
  assert.match(binder,/\["menuMusicPlayer","menuMediaSelector"\]/);
  assert.match(binder,/iframe/);assert.match(binder,/cloneNode\(true\)/,"YouTube click listeners stay on the old buttons");
  assert.match(binder,/dataset\.musicBound="true"/);
  assert.doesNotMatch(binder+soundtrack,/youtube\.com|youtube-nocookie\.com|youtu\.be/i);
  assert.doesNotMatch(binder+soundtrack,/data-menu-media-source|menuMediaSource/,"Audius choices never count as diagnostics' seven YouTube choices");
  assert.match(read("js/diagnostics.js"),/"bastille", "highlow", "move", "music", "shelter", "trailer", "youth"/);
  assert.match(read("js/ssjr.js"),/v10-home-screens","js\/homeScreensV10\.js"/);
});
test("Audius is the only new network host",()=>{
  const hosts=new Set([...(binder+soundtrack).matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map(m=>m[1].toLowerCase()));
  assert.deepEqual([...hosts],["api.audius.co"]);
  assert.equal(Home.MEDIA.tracks.length,19);assert.deepEqual(Home.MEDIA.tracks.map(t=>t.audiusTrackId),["6R99GRQ","GNQJ5dl","5xdlPEJ","K9J0w8l","Nvydpr7","WGNNo","PQ28va7","3mjjB","y7Z9P","Ymgov","qZ17b","gb33l","n1zqQ","ygyOr","3RaaM","AV9dv","ryBXG","G5rXAWE","0dGWK"],"Nik's list (2026-10-27): Song 2 first, Love Me Again second, the new picks, then the earlier top 10 in order");assert.equal(Home.MEDIA.defaultTrack,"song2");
});
test("Home registers through job 24's loader with Team V's CSS, the adapter and the soundtrack",()=>{
  assert.match(binder,/V\.register\("mainMenu",\{css:HOME_CSS\.slice\(\),js:\[\["v10-home-soundtrack","home\/soundtrack\.js"/);
  assert.deepEqual([...Home.HOME_CSS],["home/home.css","../../css/homeV10.css"]);
  assert.doesNotMatch(binder,/register\("loadingScreen"/);
});
test("Loading stays the app's splash: edited Reus photo (HO-030) and its credit",()=>{
  assert.match(html,/<source media="\(max-aspect-ratio: 7\/5\)" srcset="assets\/LOADING_REUS_PHONE\.webp\?v=[^"]+" width="1179" height="2096">\n<img id="startupAthlete" src="assets\/LOADING_REUS_DESKTOP\.webp\?v=[^"]+" width="1920" height="1080" alt="" decoding="async" fetchpriority="high">/,"HO-030: the edited Reus photo (phone and desktop crops) is the splash picture");
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
  const files=[...[...binder.matchAll(/pic\("[^"]+","([^"]+\.webp)"/g)].map(m=>m[1]),"home/assets/LOGO_CM17_WORDMARK_V1.webp",
    ...Object.values(Home.TILE_ART).map(f=>"shared/art/home-tiles/"+f),...[...homeCss.matchAll(/url\("?(assets\/[^")]+\.webp)"?\)/g)].map(m=>"home/"+m[1])];
  for(const file of files){const full="visual-assets/v10_1/"+file;assert.ok(fs.existsSync(path.join(ROOT,full)),full);assert.ok(imageRule.test(full),full);}
  for(const m of homeCss.matchAll(/url\((\.\.\/shared\/fonts\/[^)]+\.woff2)\)/g))assert.ok(shell.has("visual-assets/v10_1/"+m[1].slice(3)),m[1]);
  assert.doesNotMatch(homeCss,/tr2\/slice-02-plate/,"fonts come from the shared kit");
});
test("Home shows all seven of Team V's tiles (Nik, 2026-10-05): Legacy and Statistics are shown and Trophy Room is added",()=>{
  const appCss=read("css/app.css");
  assert.doesNotMatch(appCss,/#(?:legacyButton|careerStatisticsButton)[^{]*\{[^}]*display:none/,"Legacy and Statistics are not hidden");
  assert.match(appCss,/#rivalryStatisticsButton:not\(\[data-test-surface=internal-audit\]\)\{display:none!important\}/,"the dashboard's local Rivalry Statistics stays contained");
  assert.equal(Home.TROPHY_TILE.id,"homeTrophyRoomButton","Career Statistics keeps #trophyRoomButton");
  assert.equal(Home.TROPHY_TILE.art,"shared/trophies/TRO_LEAGUE_TITLE_V1_512.webp","Team V's Home frame art for Trophy Room");
  assert.ok(fs.existsSync(path.join(ROOT,"visual-assets/v10_1/"+Home.TROPHY_TILE.art)));
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
test("Team V files are the 5e05a1f copies with only the listed edits (HO-005: phone overlays V2; HO-027 r78: no state dimming)",()=>{
  assert.equal(sha("visual-assets/v10_1/home/home.css"),"ba72603790119c404a32711ddc36cbb6ad4190c108d496a1193eef8bbc3dbc53");
  assert.doesNotMatch(homeCss,/OVL_HOME_(?:DANIEL|NIK)_PHONE_V1/,"HO-005: phone overlays without the ghost coat (V2)");
  // r85 (app, Nik 2026-10-27): a small API (toggle, mute, choose, tracks, current, subscribe) for the docked player in js/musicDockV10.js.
  // r87 (app): init keeps the chosen song, and Play after a failed stream asks Audius again.
  assert.equal(sha("visual-assets/v10_1/home/soundtrack.js"),"b65c53dbb662e99ad5929607447fc5eaa7bea94fc5db9db79ddc267dd9c19b1a");
  assert.equal((soundtrack.match(/r85 \(app\)/g)||[]).length,2);
  assert.equal((soundtrack.match(/r87 \(app\)/g)||[]).length,2);
  assert.equal((soundtrack.match(/JOB-25 \(app\)/g)||[]).length,2);
});

console.log(`1..${n}`);
