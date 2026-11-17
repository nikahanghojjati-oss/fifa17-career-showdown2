"use strict";
// R94-02 PR 3 (Nik 2026-11-15, "Fable studies, Opus builds"): the Club Assignment spin and stop wired into the product.
// js/clubDrawStep.js shows the draw for a draw 2 Setup (its ledger carries `stops`); js/productionSharedShowdownPresentation.js
// owns every write. These checks hold the integrity rules of the build brief (gameplay/r94/threads/R94_02_CLUB_ASSIGNMENT_BUILD_BRIEF.md):
//   W1 the club rule is the protocol's: candidates[role][floor(stop/120)], stops matched to confirmedRoles in order
//   W2 first tap wins: the stop is computed once at the tap and saved on the phone BEFORE the confirm is sent; a second tap,
//      a reload, a closed tab reopened or a second tab gets the same saved stop (localStorage via js/storage.js), never a new one
//   W3 the ball never rests before Firebase holds the stop: the step only lets it rest from accepted(); the stored stop wins
//   W4 a reload with a saved stop keeps the ball rolling toward it (pending) until Firebase holds it; the rival's stored stop
//      is shown at rest at once when the screen had not started
//   W5 the presentation: `open` asks for draw 2; a stop is only ever sent from the saved/tapped stop; an old-shape Setup keeps
//      the club packs (mixed versions); the coordinator deals the candidates and locks the length by itself (still 6 writes)
//   W6 shipped and offline: the step, the scene and the stylesheet are in the service worker; draw styles only apply in draw
//      mode; no dimming; Team V's pack plate stays for old Setups and is off in draw mode
//   W7 a stop the device storage refused stays the phone's only stop in memory and is still sent; a stored stop wins when storage works
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"..","..");
const read=rel=>fs.readFileSync(path.join(ROOT,rel),"utf8");
const STEP_SRC=read("js/clubDrawStep.js");
const PRES_SRC=read("js/productionSharedShowdownPresentation.js");
const SETUP_SRC=read("js/productionSharedShowdownSetup.js");
const CSS_SRC=read("css/clubDraw.css");
const SW_SRC=read("service-worker.js");
const V10_SRC=read("js/clubScreenV10.js");
let passed=0;
// Objects made inside the page realm have that realm's prototypes: compare their plain JSON shape.
const plain=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
function ok(id,label){passed+=1;console.log(`PASS ${id} ${label}`);}

const CANDIDATES={playerOne:["Osasuna","Espanyol","Getafe"],playerTwo:["Sevilla","Villarreal","Celta Vigo"]};
const OPEN_OP="a".repeat(64);
function drawSetup(extra={}){return {schemaVersion:1,phase:"SEASON_LENGTH_COMMITTED",revision:4,leagueId:"laliga",clubs:null,totalSeasons:3,confirmedRoles:[],stops:[],receipts:[{operationHash:OPEN_OP,type:"open"}],drawVersion:2,candidates:structuredClone(CANDIDATES),...extra};}

// A page as the step sees it: a document with the Club screen's arena, the device's localStorage behind js/storage.js's
// helpers (it survives a reload and a closed tab: a new instance of the module on the same storage), and a fake scene that
// records what the step asked of it.
function fakeStorage(){const map=new Map();return {map,getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>{map.set(k,String(v));},removeItem:k=>{map.delete(k);}};}
function fakeElement(tag){
  const el={tagName:tag,dataset:{},children:[],attrs:{},id:"",className:"",
    setAttribute(k,v){this.attrs[k]=v;},append(...c){this.children.push(...c);},replaceChildren(){this.children=[];},remove(){},
    insertBefore(child){this.children.unshift(child);page.stage=child;return child;}};
  const page=fakeElement.page;return el;
}
function loadPage(storage){
  const calls=[];const page={stage:null};
  const doc={
    getElementById:id=>id==="clubDrawStage"?page.stage:null,
    querySelector:sel=>sel==="#clubWheelScreen .clubRevealArena"?page.area:null,
    createElement:tag=>{fakeElement.page=page;return fakeElement(tag);}
  };
  fakeElement.page=page;page.area=fakeElement("div");
  const scene={alive:true,states:["idle","idle"],stops:[null,null],
    start(){calls.push(["start"]);this.states=["spin","spin"];},
    state(i){return this.states[i];},
    canStop(i){return this.stops[i]===null&&this.states[i]==="spin";},
    tap(i){calls.push(["tap",i]);this.stops[i]=137;this.states[i]="stopping";return 137;},
    accept(i,stop){calls.push(["accept",i,stop]);this.stops[i]=stop;},
    restOn(i,stop,o){calls.push(["restOn",i,stop,o||{}]);if(this.stops[i]===null)this.stops[i]=stop;return true;},
    on(){return ()=>{};},dispose(){this.alive=false;},probe(){return {};}};
  const sandbox={document:doc,readStorageValue:k=>storage.getItem(k),writeStorageValue:(k,v)=>{if(storage.full)return false;storage.setItem(k,v);return true;},removeStorageValue:k=>{storage.removeItem(k);return true;},crypto:{getRandomValues:a=>{a[0]=7;return a;}},calls,scene,page,
    CareerModeClubDraw3d:{preload:async()=>true,mount:async(stage,opts)=>{calls.push(["mount",opts.me,opts.balls.map(b=>b.clubs)]);return scene;}},
    innerWidth:1920,innerHeight:866,structuredClone};
  sandbox.globalThis=sandbox;
  vm.runInNewContext(STEP_SRC,sandbox,{filename:"js/clubDrawStep.js"});
  return {step:sandbox.CareerModeClubDrawStep,calls,scene,page,sandbox};
}
const CTX={rivalryId:"pair_test",role:"playerTwo",visible:true};

async function main(){
  // W1 ------------------------------------------------------------------------------------------------------------------
  {
    const {step}=loadPage(fakeStorage());
    assert.equal(step.isDraw(drawSetup()),true,"a ledger with stops is draw 2");
    const old=drawSetup();delete old.stops;assert.equal(step.isDraw(old),false,"a ledger without stops is the old club packs");
    for(let stop=0;stop<360;stop+=1)for(const role of ["playerOne","playerTwo"])assert.equal(step.clubFor(drawSetup(),role,stop),CANDIDATES[role][Math.floor(stop/120)],`${role} ${stop}`);
    for(const bad of [-1,360,12.5,"40",null,undefined,Number.NaN])assert.equal(step.clubFor(drawSetup(),"playerOne",bad),null,`no club for ${String(bad)}`);
    assert.deepEqual(plain(step.storedStops(drawSetup({confirmedRoles:["playerTwo","playerOne"],stops:[359,0]}))),{playerOne:0,playerTwo:359},"stops follow confirmedRoles in order");
    assert.deepEqual(plain(step.storedStops(drawSetup({confirmedRoles:["playerTwo"],stops:[400]}))),{playerOne:null,playerTwo:null},"an invalid stored stop is no stop");
    assert.equal(step.candidates(drawSetup({candidates:{playerOne:["A","B"],playerTwo:["C","D","E"]}})),null,"three candidates each or nothing");
    // The same rule as the protocol's replay (js/sharedShowdownSetup.js clubForStop), stop by stop.
    const protocol=require(path.join(ROOT,"js/sharedShowdownSetup.js"));
    assert.equal(protocol.stopSectionDegrees,120);
    for(let stop=0;stop<360;stop+=1)for(const role of ["playerOne","playerTwo"])assert.equal(step.clubFor(drawSetup(),role,stop),protocol.clubForStop(CANDIDATES[role],stop),`protocol ${role} ${stop}`);
    ok("W1","the club is candidates[role][floor(stop/120)] for every stop 0..359, stops follow confirmedRoles, bad input names no club");
  }
  // W2 + W3 + W4 -------------------------------------------------------------------------------------------------------
  {
    const storage=fakeStorage();
    const a=loadPage(storage);const setup=drawSetup();
    assert.equal(await a.step.prepare(setup,CTX),true,"the draw is built");
    assert.deepEqual(plain(a.calls.find(c=>c[0]==="mount")),["mount",1,[CANDIDATES.playerOne,CANDIDATES.playerTwo]],"both phones build the same two balls; Nik's is ball 1");
    assert.equal(a.step.canStop(setup,CTX),false,"no STOP before the balls turn");
    a.step.sync(setup,CTX);
    assert.ok(a.calls.some(c=>c[0]==="start"),"the balls start once the screen shows");
    assert.equal(a.step.canStop(setup,CTX),true,"STOP opens at full speed");
    // The tap: computed once, saved on the phone before the caller can send it.
    const stop=a.step.tap(setup,CTX);
    assert.equal(stop,137);
    const SLOT=`${a.step.PENDING_KEY}:pair_test:playerTwo`;
    const saved=JSON.parse(storage.getItem(SLOT));
    assert.deepEqual(plain(saved),{key:`pair_test|playerTwo|${OPEN_OP}|${a.step.digest(setup)}`,stop:137},"the stop is saved on the phone, bound to rivalry, manager, the setup's open operation and candidates");
    assert.equal(a.step.tap(setup,CTX),null,"a second tap draws nothing new");
    assert.equal(a.calls.filter(c=>c[0]==="tap").length,1,"the scene was asked for one stop only");
    assert.equal(a.step.pending(CTX,setup),137,"the saved stop is what gets sent (and sent again)");
    assert.equal(a.step.pending({...CTX,rivalryId:"pair_other"},setup),null,"another rivalry never sees it");
    assert.equal(a.step.pending({...CTX,role:"playerOne"},setup),null,"the other manager never sees it");
    assert.equal(loadPage(storage).step.pending(CTX,drawSetup({receipts:[{operationHash:"b".repeat(64),type:"open"}]})),null,"another setup (a new open) with the same candidates never sees it");
    // W3: no rest before Firebase holds it; the step never calls accept for a stop Firebase does not hold.
    assert.equal(a.calls.some(c=>c[0]==="accept"),false,"no accept before Firebase holds the stop");
    assert.equal(a.step.accepted(setup,CTX),false,"accepted() needs the stop in the ledger");
    // The tab is closed after the tap, before Firebase holds the stop, and the app is opened again (a new page on the same
    // device storage, nothing in memory): the same stop, still rolling, STOP closed.
    const b=loadPage(storage);
    await b.step.prepare(setup,CTX);b.step.sync(setup,CTX);
    assert.equal(b.step.pending(CTX,setup),137,"the reopened tab finds the same saved stop");
    assert.equal(b.step.canStop(setup,CTX),false,"no second STOP after the tab is reopened");
    assert.equal(b.step.tap(setup,CTX),null,"no new draw after the tab is reopened");
    assert.deepEqual(plain(b.calls.find(c=>c[0]==="restOn")),["restOn",1,137,{pending:true}],"W4: the own ball rolls toward the saved stop, never resting");
    // Firebase holds a different stop (another tab of the same manager won): the stored stop wins and the saved one goes.
    const held=drawSetup({confirmedRoles:["playerTwo"],stops:[300],revision:5});
    assert.equal(b.step.accepted(held,CTX),true);
    assert.deepEqual(plain(b.calls.filter(c=>c[0]==="accept").pop()),["accept",1,300],"the ball may rest only on the stored stop");
    assert.equal(storage.getItem(SLOT),null,"the saved stop is cleared once Firebase holds one");
    assert.equal(b.step.clubFor(held,"playerTwo",300),"Celta Vigo");
    ok("W2","first tap wins: one stop computed at the tap, saved on the device first, the same stop after a second tap, a reload or a closed tab, bound to rivalry, manager, setup and candidates");
    ok("W3","the ball rests only from accepted(), on the stop Firebase holds (a different stored stop wins), and the saved stop is then cleared");
    // W4: the rival's stored stop on a screen that had not started is shown at rest at once.
    const c=loadPage(fakeStorage());
    const rivalHeld=drawSetup({confirmedRoles:["playerOne"],stops:[45],revision:5});
    await c.step.prepare(rivalHeld,{...CTX,visible:false});c.step.sync(rivalHeld,{...CTX,visible:false});
    assert.deepEqual(plain(c.calls.find(c2=>c2[0]==="restOn")),["restOn",0,45,{immediate:true}],"the rival's ball is at rest at once when the screen opens late");
    ok("W4","a reload with a saved stop keeps the own ball rolling toward it; a late screen shows the rival's stored stop at rest");
  }
  // W7: the device storage is full (or refuses the write): the stop stays in memory as this phone's only stop and is still
  // sent (a playable game comes first); a stop the storage holds is preferred whenever storage works.
  {
    const storage=fakeStorage();storage.full=true;
    const d=loadPage(storage);const setup=drawSetup();
    await d.step.prepare(setup,CTX);d.step.sync(setup,CTX);
    assert.equal(d.step.tap(setup,CTX),137,"a stop storage refused is still handed out to be sent");
    assert.equal(d.step.pending(CTX,setup),137,"it is this phone's stop");
    assert.equal(d.step.unsaved(CTX,setup),true,"marked as not saved, so the screen can say so");
    assert.equal(d.step.canStop(setup,CTX),false,"STOP cannot be tapped again");
    assert.equal(d.step.tap(setup,CTX),null,"no second draw");
    assert.equal(d.step.sendable(CTX,setup),137,"the resend sends the same stop from memory while the save keeps failing");
    assert.equal(d.calls.filter(c=>c[0]==="tap").length,1,"one stop only");
    const SLOT=`${d.step.PENDING_KEY}:pair_test:playerTwo`;
    assert.equal(storage.getItem(SLOT),null,"nothing reached the device storage");
    storage.full=false;
    assert.equal(d.step.sendable(CTX,setup),137,"once storage works the same stop is saved on the next resend");
    assert.equal(d.step.unsaved(CTX,setup),false);
    assert.equal(JSON.parse(storage.getItem(SLOT)).stop,137,"and it is on the device, so a closed tab finds it");
    assert.equal(loadPage(storage).step.pending(CTX,setup),137,"a reopened tab prefers the stored stop");
    ok("W7","a stop storage refused stays this phone's only stop in memory and is still sent and resent; once storage works it is saved and a reopened tab prefers it");
  }
  // W5 ------------------------------------------------------------------------------------------------------------------
  {
    // R95-01 PR 3: a new Setup opens draw 3 (the Ball Game, six clubs a ball); draw 2 Setups still read and show.
    assert.match(PRES_SRC,/ssjpMutate\("open",\{draw:3\}\)/,"open asks for draw 3");
    assert.ok(!/ssjpMutate\("open",\{draw:2\}\)/.test(PRES_SRC),"nothing opens draw 2 any more");
    const confirms=[...PRES_SRC.matchAll(/ssjpMutate\("confirm"(,[^)]*)?\)/g)].map(m=>m[0]);
    assert.deepEqual(confirms.filter(x=>x.includes("stop")),['ssjpMutate("confirm",{stop:sendable})','ssjpMutate("confirm",{stop})'],"a stop is sent only as the saved stop (resend) or the tapped/saved one (STOP)");
    assert.match(PRES_SRC,/let stop=drawStep\.pending\(ctx,setup\)===null\?drawStep\.tap\(setup,ctx\):drawStep\.sendable\(ctx,setup\);/,"STOP sends the saved stop first, a new tap only when none is pending");
    assert.match(PRES_SRC,/const sendable=drawStep\.sendable\(ctx,setup\);if\(sendable!==null\)void ssjpMutate\("confirm",\{stop:sendable\}\)/,"the resend sends the pending stop (saved on the device, or from memory when storage refused it)");
    assert.match(PRES_SRC,/if\(id==="continueClubAssignment"&&ssjpIsDraw\(state\.setup\)\)return ssjpDecideDraw\(\);/,"the draw's button is STOP");
    assert.match(PRES_SRC,/if\(ssjpIsDraw\(setup\)\)return ssjpRenderDraw\(setup,screen,open\);/,"only a draw 2 Setup shows the draw; an old-shape Setup keeps the club packs");
    assert.match(PRES_SRC,/function ssjpIsDraw\(setup\)\{return Boolean\(setup&&typeof setup==="object"&&Object\.hasOwn\(setup,"stops"\)\);\}/,"draw 2 is the ledger key stops, as in the protocol");
    assert.match(PRES_SRC,/setup\.phase==="LEAGUE_WHEEL_COMMITTED"\)\{if\(!drawClubsPromise\)drawClubsPromise=ssjpMutate\("commit-clubs"\)/,"the coordinator deals the candidates by itself (the same commit-clubs write)");
    assert.match(PRES_SRC,/setup\.phase==="CLUB_ASSIGNMENTS_COMMITTED"\)\{void ssjpCommitPreparedSeasonLength\(\);/,"then locks his season length by itself (the same commit-length write)");
    assert.match(SETUP_SRC,/if\(Object\.hasOwn\(setup,"stops"\)\)summary\.append\(create\("p","stateNote","CLUB DRAW · Stop your ball on the Club screen to confirm\."\)\);\s*else actions\.append\(action\("CONFIRM SETUP",\(\)=>void mutate\("confirm"\)/,"the Setup panel offers CONFIRM SETUP only for an old-shape Setup; a draw 2 Setup is confirmed only by STOP");
    assert.equal(/mutate\("confirm",/.test(SETUP_SRC),false,"the Setup panel never sends a stop (no blind stop anywhere)");
    assert.equal(/localStorage|sessionStorage/.test(STEP_SRC.replace(/\/\/.*$/gm,"")),false,"the saved stop goes through js/storage.js (localStorage), never touched directly");
    assert.match(STEP_SRC,/root\.readStorageValue,write=root\.writeStorageValue,remove=root\.removeStorageValue/,"the saved stop uses js/storage.js's helpers");
    assert.equal(/\.set\(|setDoc|updateDoc|runTransaction|mutate\(/.test(STEP_SRC.replace(/\.setItem\(|\.setAttribute\(|listeners\.set|\.set\(b,|const set=/g,"")),false,"the step never writes to Firebase");
    ok("W5","open asks for draw 3 (R95-01); a stop is only ever the saved one; old-shape Setups keep the club packs; the deal and the length stay the same two coordinator writes");
  }
  // W6 ------------------------------------------------------------------------------------------------------------------
  {
    for(const file of ["js/clubDrawStep.js","js/clubDrawScene3d.js","css/clubDraw.css"])assert.ok(SW_SRC.split(file).length>=3,`${file} is in both service worker lists`);
    const rules=CSS_SRC.replace(/\/\*[\s\S]*?\*\//g,"").split("}").map(r=>r.split("{")[0].trim()).filter(Boolean).filter(sel=>!sel.startsWith("@"));
    for(const sel of rules)for(const part of sel.split(","))assert.ok(/#clubWheelScreen\[data-club-draw="spin"\]|^\s*\.clubDraw/.test(part),`draw style outside draw mode: ${part.trim()}`);
    assert.equal(/backdrop-filter|brightness\(|rgba\(0,\s*0,\s*0,\s*0?\.[5-9]\)\s*;\s*position:\s*fixed/.test(CSS_SRC),false,"no dimming");
    // r94 look (gallery notes): the title is plain Cormorant SC gold text with nothing behind it; the enabled STOP is the
    // app's gold metal and the waiting one flat black with a gold edge; nothing in draw mode is blue (the app's cyan bar).
    const block=sel=>{const i=CSS_SRC.indexOf(sel);assert.ok(i>=0,`missing rule ${sel}`);return CSS_SRC.slice(CSS_SRC.indexOf("{",i)+1,CSS_SRC.indexOf("}",i));};
    const title=block('#clubWheelScreen[data-club-draw="spin"] > h2 {');
    for(const want of [/background:\s*none/,/border:\s*0/,/box-shadow:\s*none/,/"Cormorant SC"/,/color:\s*#C9A45C/])assert.match(title,want,`title: ${want}`);
    // Nik 22:15 ("color should make sense"): live STOP = Home's gold CONTINUE CAREER tile; waiting STOP = plainly inactive
    // (no gold face, no bevel, dimmed words), and it outranks the r78 gold-bevelled waiting look.
    const live=block('#clubWheelScreen[data-club-draw="spin"] #continueClubAssignment {');
    assert.match(live,/border-image:\s*var\(--bevel-gold-soft\)/,"the live STOP wears Home's gold bevel");
    assert.match(live,/background:\s*linear-gradient\(115deg, #FFE98F 0%, #F4CB5A 34%, #E8B93F 62%, #CD9526 100%\)/,"and Home's CONTINUE CAREER gold");
    const wait=block(':root:not(#r78):not(#r78) #clubWheelScreen[data-club-draw="spin"] #continueClubAssignment:disabled {');
    for(const want of [/border-image:\s*none/,/box-shadow:\s*none/,/color:\s*rgba\(233,223,200,\.62\)/,/background:\s*rgba\(10,10,12,\.82\)/])assert.match(wait,want,`waiting STOP: ${want}`);
    assert.equal(/gradient/.test(wait),false,"the waiting STOP has no gold face");
    // Nik 22:11-22:14: Home's language. Home's bevel tokens, Home tiles under the balls, the house marble page.
    assert.match(CSS_SRC,/--bevel-gold: linear-gradient\(135deg, #FFF1B8 0%, #E8B94A 16%, #8A6A12 38%, #F2C45B 58%, #FFF1B8 74%, #B8862A 100%\)/,"Home's gold bevel, same name and value as #mainMenu.v10Home");
    assert.match(block('#clubWheelScreen[data-club-draw="spin"] .clubRevealCard {\n'),/border-image:\s*var\(--bevel-gold\)/,"the manager boxes are Home tiles");
    assert.match(CSS_SRC,/ENV_SLAB_HC_V1_1X\.webp/,"the page is the house marble");
    // Nik 22:55-22:57: no boxed "CLUB DRAW" bar and no routine lines; a real note is plain text under STOP. The page has a
    // plate slot for Team V's hero-free Club lounge (empty until it lands), placed per size.
    assert.equal(/CLUB DRAW · Tap STOP|CLUB DRAW · Read your three clubs|CLUB DRAW · THREE CLUBS ON EACH BALL/.test(PRES_SRC),false,"the routine draw lines are gone");
    assert.match(PRES_SRC,/function ssjpPlaceDrawStatus\(screen\)\{[^}]*shell\.insertBefore\(node,back\)/,"a real note sits in the shell, right above BACK (under STOP)");
    assert.match(PRES_SRC,/else if\(unsaved\)ssjpSetSharedStatus\("YOUR STOP COULD NOT BE SAVED · Keep this screen open until it lands\."\)/,"the could-not-save note still shows");
    const note=block('#clubWheelScreen[data-club-draw="spin"] #sharedShowdownPresentationStatus {\n');
    for(const want of [/grid-area:\s*note/,/background:\s*none/,/border:\s*0/,/box-shadow:\s*none/])assert.match(note,want,`plain note: ${want}`);
    // HO-094 (Nik OK 2026-11-16): the empty handcrafted club lounge fills the slot, picked by the same two media rules in
    // the stylesheet and the step, decoded before the Reus Gate opens the screen, never precached.
    for(const want of [/ENV_CLUB_PLATE_HC_V3_1X\.webp/,/ENV_CLUB_PLATE_HC_V3_2X\.webp/,/ENV_CLUB_PHONE_HC_V4\.webp/,/ENV_CLUB_SIDEWAYS_HC_V4\.webp/,/--cd-plate-pos:/,/background-image: var\(--cd-plate\), var\(--cd-slab\)/])assert.match(CSS_SRC,want,`plate slot: ${want}`);
    const media=name=>{const m=STEP_SRC.match(new RegExp(`const ${name}="([^"]+)"`));assert.ok(m,`${name} in the step`);return m[1];};
    assert.ok(CSS_SRC.includes(`@media ${media("CD_PLATE_PHONE_MEDIA")} {`),"the step and the stylesheet pick the phone plate by the same rule");
    assert.ok(CSS_SRC.includes(`@media ${media("CD_PLATE_2X_MEDIA")} {`),"the step and the stylesheet pick the 2X plate by the same rule");
    assert.ok(CSS_SRC.includes(`@media ${media("CD_PLATE_SIDE_MEDIA")} {`),"the step and the stylesheet pick the sideways slot by the same rule");
    // HO-095 slots: the upright and sideways phone files are named once in the step and once in the stylesheet, and agree.
    const files=STEP_SRC.match(/const PLATE_FILES=Object\.freeze\(\{phone:"([^"]+)",side:(null|"[^"]+")\}\);/);
    assert.ok(files,"PLATE_FILES in the step");
    assert.match(CSS_SRC,new RegExp(`--cd-plate: url\\("\\.\\./visual-assets/v10_1/plates-hc/${files[1].replace(/\./g,"\\.")}"\\)`),"the upright phone slot names the same file");
    if(files[2]==="null")assert.equal(/--cd-plate-side:/.test(CSS_SRC),false,"no sideways file yet: the desktop plate shows");
    else assert.ok(CSS_SRC.includes(`--cd-plate-side: url("../visual-assets/v10_1/plates-hc/${JSON.parse(files[2])}")`),"the sideways slot names the same file");
    assert.match(CSS_SRC,/--cd-plate: var\(--cd-plate-side, var\(--cd-plate-desk\)\)/,"sideways phones read their own slot");
    assert.match(STEP_SRC,/const plate=cdsPlate\(\);[\s\S]*?await plate;\n\s*if\(!mounting\|\|mounting\.key!==key\)/,"the screen opens only once the plate is decoded (Reus Gate)");
    assert.equal(/ENV_CLUB_(?:PLATE|PHONE)_HC_V3/.test(SW_SRC),false,"the club lounge is never precached");
    // Lead 23:38: on desktop windows the box stays inside the side walls, so the lamps, banners and trophies are never behind it.
    assert.match(CSS_SRC,/--cd-wall: min\(11\.8vw, calc\(50vw - \(100dvh - var\(--sd-nav-top-h, 52px\)\) \* \.681\)\);/,"where the walls end on screen");
    assert.match(CSS_SRC,/\.clubAssignmentShell \{ width: min\(1640px, 100%, calc\(100vw - 2 \* \(var\(--cd-wall\) \+ 14px\)\)\); \}/,"the box stays inside the walls");
    // Gallery 23:06: on sideways phones the title sits over the pitch only and the right column starts at the top, with a
    // tighter tier for the shortest phones, so Nik's tile is never cut (740x360, 844x390, 568x320 checked with a note showing).
    for(const want of [/--cd-col: clamp\(170px, 29vw, 260px\); --cd-title-h: 26px;/,/margin: 0 calc\(var\(--cd-col\) \+ 10px\) 0 0;/,/margin-top: calc\(0px - var\(--cd-title-h\)\);/,/@media \(orientation: landscape\) and \(max-height: 340px\)/])assert.match(CSS_SRC,want,`sideways fit: ${want}`);
    assert.equal(/cyan|#00[a-f0-9]{4}\b|blue/i.test(CSS_SRC.replace(/\/\*[\s\S]*?\*\//g,"")),false,"nothing blue in draw mode");
    assert.match(V10_SRC,/section\.dataset\.clubDraw==="spin"\)return false;/,"Team V's pack plate is off in draw mode (CL1-CL6 kept for old Setups)");
    ok("W6","the step, scene and stylesheet are offline; draw styles only in draw mode; no dimming; the pack plate stays for old Setups");
  }
  // W8 (R95-01 PR 3) ---------------------------------------------------------------------------------------------------
  // The Ball Game: a draw 3 Setup (six clubs a ball) shows its six crests in 60 degree slices, by the protocol's own rule;
  // a draw 2 Setup keeps its thirds (W1); any other shape shows no draw.
  {
    const SIX={playerOne:["Osasuna","Espanyol","Getafe","Alaves","Eibar","Leganes"],playerTwo:["Sevilla","Villarreal","Celta Vigo","Malaga","Betis","Granada"]};
    const six=extra=>drawSetup({drawVersion:3,candidates:structuredClone(SIX),...extra});
    const protocol=require(path.join(ROOT,"js/sharedShowdownSetup.js"));
    const {step,calls}=loadPage(fakeStorage());
    assert.deepEqual(plain(step.candidates(six())),SIX,"six candidates each are a draw");
    for(const bad of [{playerOne:SIX.playerOne,playerTwo:SIX.playerTwo.slice(0,3)},{playerOne:SIX.playerOne.slice(0,4),playerTwo:SIX.playerTwo.slice(0,4)},{playerOne:[...SIX.playerOne,"X"],playerTwo:[...SIX.playerTwo,"Y"]}])
      assert.equal(step.candidates(six({candidates:bad})),null,"three or six a ball, the same on both");
    for(let stop=0;stop<360;stop+=1)for(const role of ["playerOne","playerTwo"]){
      assert.equal(step.clubFor(six(),role,stop),SIX[role][Math.floor(stop/60)],`${role} ${stop}`);
      assert.equal(step.clubFor(six(),role,stop),protocol.clubForStop(SIX[role],stop),`protocol ${role} ${stop}`);
    }
    assert.equal(protocol.draw3SectionDegrees,60);
    assert.equal(await step.prepare(six(),CTX),true,"the Ball Game is built");
    assert.deepEqual(plain(calls.find(c=>c[0]==="mount")),["mount",1,[SIX.playerOne,SIX.playerTwo]],"both balls carry their six clubs");
    assert.match(STEP_SRC,/row\.dataset\.count=String\(b\.clubs\.length\);/,"the flat stand-in knows how many crests a ball has");
    assert.match(STEP_SRC,/Math\.floor\(\(\(b\.front%360\)\+360\)%360\/cdsSectionFor\(b\.clubs\.length\)\)/,"and cycles them by their own slices");
    assert.match(CSS_SRC,/\.clubDrawFlatBall\[data-count="6"\] \.clubDrawFlatClub\{width:clamp\(44px,6\.4vw,92px\)\}/,"six smaller flat crests that wrap on a phone");
    ok("W8","the Ball Game (draw 3): six crests a ball, the club is candidates[role][floor(stop/60)] like the protocol, both balls mounted with six; the flat stand-in follows");
  }
  console.log(`PASS R94-02 club draw wiring: ${passed} checks.`);
}
main().catch(error=>{console.error(error);process.exit(1);});
