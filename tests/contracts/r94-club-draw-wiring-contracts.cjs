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
//   W7 a stop the device storage could not save is never sent: it stays the phone's only stop and is sent once saved
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
  // W7: the device storage is full (or refuses the write): the stop is fixed at the tap but never sent until it is saved.
  {
    const storage=fakeStorage();storage.full=true;
    const d=loadPage(storage);const setup=drawSetup();
    await d.step.prepare(setup,CTX);d.step.sync(setup,CTX);
    assert.equal(d.step.tap(setup,CTX),null,"a stop the device could not save is not handed out to be sent");
    assert.equal(d.step.pending(CTX,setup),137,"it is still this phone's stop");
    assert.equal(d.step.unsaved(CTX,setup),true,"and it is marked as not saved");
    assert.equal(d.step.canStop(setup,CTX),false,"STOP cannot be tapped again");
    assert.equal(d.step.tap(setup,CTX),null,"no second draw");
    assert.equal(d.step.sendable(CTX,setup),null,"nothing to send while the save keeps failing");
    assert.equal(d.calls.filter(c=>c[0]==="tap").length,1,"one stop only");
    const SLOT=`${d.step.PENDING_KEY}:pair_test:playerTwo`;
    assert.equal(storage.getItem(SLOT),null,"nothing reached the device storage");
    storage.full=false;
    assert.equal(d.step.sendable(CTX,setup),137,"once the save works the same stop may be sent");
    assert.equal(d.step.unsaved(CTX,setup),false);
    assert.equal(JSON.parse(storage.getItem(SLOT)).stop,137,"and it is on the device, so a closed tab finds it");
    assert.equal(loadPage(storage).step.pending(CTX,setup),137,"a reopened tab sees the same stop");
    ok("W7","a stop the device could not save is never sent: it stays this phone's only stop and is sent once the save succeeds");
  }
  // W5 ------------------------------------------------------------------------------------------------------------------
  {
    assert.match(PRES_SRC,/ssjpMutate\("open",\{draw:2\}\)/,"open asks for draw 2");
    const confirms=[...PRES_SRC.matchAll(/ssjpMutate\("confirm"(,[^)]*)?\)/g)].map(m=>m[0]);
    assert.deepEqual(confirms.filter(x=>x.includes("stop")),['ssjpMutate("confirm",{stop:sendable})','ssjpMutate("confirm",{stop})'],"a stop is sent only as the saved stop (resend) or the tapped/saved one (STOP)");
    assert.match(PRES_SRC,/let stop=drawStep\.pending\(ctx,setup\)===null\?drawStep\.tap\(setup,ctx\):drawStep\.sendable\(ctx,setup\);/,"STOP sends the saved stop first, a new tap only when none is pending");
    assert.match(PRES_SRC,/const sendable=drawStep\.sendable\(ctx,setup\);if\(sendable!==null\)void ssjpMutate\("confirm",\{stop:sendable\}\)/,"the resend sends only a stop saved on the device");
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
    ok("W5","open asks for draw 2; a stop is only ever the saved one; old-shape Setups keep the club packs; the deal and the length stay the same two coordinator writes");
  }
  // W6 ------------------------------------------------------------------------------------------------------------------
  {
    for(const file of ["js/clubDrawStep.js","js/clubDrawScene3d.js","css/clubDraw.css"])assert.ok(SW_SRC.split(file).length>=3,`${file} is in both service worker lists`);
    const rules=CSS_SRC.replace(/\/\*[\s\S]*?\*\//g,"").split("}").map(r=>r.split("{")[0].trim()).filter(Boolean).filter(sel=>!sel.startsWith("@"));
    for(const sel of rules)for(const part of sel.split(","))assert.ok(/#clubWheelScreen\[data-club-draw="spin"\]|^\s*\.clubDraw/.test(part),`draw style outside draw mode: ${part.trim()}`);
    assert.equal(/backdrop-filter|brightness\(|rgba\(0,\s*0,\s*0,\s*0?\.[5-9]\)\s*;\s*position:\s*fixed/.test(CSS_SRC),false,"no dimming");
    assert.match(V10_SRC,/section\.dataset\.clubDraw==="spin"\)return false;/,"Team V's pack plate is off in draw mode (CL1-CL6 kept for old Setups)");
    ok("W6","the step, scene and stylesheet are offline; draw styles only in draw mode; no dimming; the pack plate stays for old Setups");
  }
  console.log(`PASS R94-02 club draw wiring: ${passed} checks.`);
}
main().catch(error=>{console.error(error);process.exit(1);});
