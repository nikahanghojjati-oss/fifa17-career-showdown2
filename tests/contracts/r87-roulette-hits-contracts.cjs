"use strict";
// Fable job 2 (r87 between-seasons flow), sync and reads findings of the Russian Roster Roulette:
//  H1 F2-02 persisted hits: each spin mark saves that season's outcome; replays take it as the authority, so a squad data fix
//     after season 1 never changes season 1's shot (the saved player stays out, nobody else is removed).
//  H2 F2-02 this season: the partner's saved outcome is the authority for his turn; a saved safe spin stays safe.
//  H3 F2-02 version: the mark's version names the engine revision and this Showdown's own data only; ENGINE_REVISION is pinned.
//  H4 F2-02 version stop: the partner spun on another version -> a plain "update the game on the other phone" stop, never a
//     silent desync; TRY AGAIN re-reads the marks; CONTINUE goes on with the partner's saved spin.
//  H5 F2-10 a second browser (the server already holds this manager's mark, or the window opened) shows the result card with no
//     second spin, and writes no outcome again.
//  H6 F2-08 a lock that saved but whose follow-up read failed: saved, loading verdicts, own inputs kept, no "No signings were
//     entered", no "did it save?", and it reads again by itself.
//  H7 F2-02/F2-12 production wiring: the mark carries the outcome; an earlier season is read with plain gets
//     (provider.readRouletteSeason), never the prerequisite transaction, and a kept copy costs nothing.
//  H8 S6 the reconnect banner's 15 s check waits while the full-screen roulette is up.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const crypto=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
global.window=globalThis;
require("../../data/transferOptions.js");
const Squads=require("../../data/rosterSquads.js");
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
// A fresh engine instance, optionally on other squad data (a later build's corrected rows).
function engine(squads){
  const key=require.resolve("../../js/rosterRoulette.js");delete require.cache[key];
  if(squads)globalThis.CareerModeRosterSquads=squads;else delete globalThis.CareerModeRosterSquads;
  let api;try{api=require(key);}finally{delete globalThis.CareerModeRosterSquads;}
  // The engine reads its data at call time: each call runs with this instance's data in place.
  const wrap=fn=>(...args)=>{if(squads)globalThis.CareerModeRosterSquads=squads;try{return fn(...args);}finally{delete globalThis.CareerModeRosterSquads;}};
  return Object.freeze({...api,forSeason:wrap(api.forSeason),version:wrap(api.version),board:wrap(api.board),outcome:api.outcome});
}
const RID="pair_"+"ab".repeat(32),CLUBS={playerOne:"Liverpool",playerTwo:"Arsenal"};
const noSignings=n=>[null,...Array.from({length:n},()=>({playerOne:[],playerTwo:[]}))];
const names=board=>board.filter(p=>p.name).map(p=>p.name);

(async()=>{
  // ---------- H1 ----------
  {
    const R=engine();
    const s1=R.forSeason(RID,CLUBS,1);
    const daniel=s1.turns.find(t=>t.role==="playerOne");
    assert.equal(daniel.fired,true);assert.equal(daniel.player.name,"J. Milner");assert.equal(daniel.hitSlot,7);
    const version=R.version(CLUBS,{});
    const outcome=R.outcome(s1,"playerOne",version);
    assert.deepEqual({...outcome},{fired:true,hitName:"J. Milner",hitNumber:7,hitSlot:7,version});
    const nik=R.outcome(s1,"playerTwo",version);assert.equal(nik.fired,false);assert.equal(nik.hitName,null);assert.equal(nik.hitSlot,null);
    const hits={1:{playerOne:outcome,playerTwo:nik}};
    // Same build, saved outcome = computed outcome: identical boards.
    assert.deepEqual(JSON.stringify(R.forSeason(RID,CLUBS,2,{history:noSignings(1),hits}).boards),JSON.stringify(R.forSeason(RID,CLUBS,2,{history:noSignings(1)}).boards));
    // A later build corrects Liverpool's rows: Lucas Leiva now stands in slot 7, Milner among the hidden reserves.
    const fixed=JSON.parse(JSON.stringify(Squads));const lfc=fixed.squads.Liverpool;
    const milner=lfc.xi[7],leiva=lfc.reserves[0];lfc.xi[7]=["LB",leiva[1],leiva[2],leiva[3]];lfc.reserves[0]=["LB",milner[1],milner[2],milner[3]];
    const Fixed=engine(fixed);
    assert.notEqual(Fixed.version(CLUBS,{}),version,"a data change for this Showdown's clubs changes the version");
    const replay=Fixed.forSeason(RID,CLUBS,2,{history:noSignings(1),hits}).boards.playerOne;
    assert.equal(names(replay).includes("J. Milner"),false,"the player shot in season 1 stays out, wherever the new data put him");
    assert.equal(names(replay).includes("Lucas Leiva"),true,"a data change after season 1 doesn't change the season 1 hit: nobody else is removed");
    const old=Fixed.forSeason(RID,CLUBS,2,{history:noSignings(1)}).boards.playerOne;
    assert.equal(names(old).includes("Lucas Leiva"),false,"(without the saved hit the new data would have shot Lucas Leiva instead)");
    // Ten seasons later he is still out and Leiva was never shot.
    const s10hits={...hits};
    for(let k=2;k<=9;k+=1){const plan=Fixed.forSeason(RID,CLUBS,k,{history:noSignings(k-1),hits:s10hits});s10hits[k]={playerOne:Fixed.outcome(plan,"playerOne",version),playerTwo:Fixed.outcome(plan,"playerTwo",version)};}
    const s10=Fixed.forSeason(RID,CLUBS,10,{history:noSignings(9),hits:s10hits});
    assert.equal(names(s10.boards.playerOne).includes("J. Milner"),false);
    for(let k=2;k<=9;k+=1)assert.notEqual(s10hits[k].playerOne.hitName,"J. Milner","the saved player is never shot twice");
    // A malformed saved outcome is ignored (computed as before), never trusted.
    const bad=R.forSeason(RID,CLUBS,2,{history:noSignings(1),hits:{1:{playerOne:{fired:true,hitName:"",hitSlot:99}}}}).boards;
    assert.deepEqual(JSON.stringify(bad),JSON.stringify(R.forSeason(RID,CLUBS,2,{history:noSignings(1)}).boards));
    ok("H1","F2-02 persisted hits: replays take the saved shot as the authority; a data change after season 1 doesn't change the season 1 hit");
  }

  // ---------- H2 ----------
  {
    const R=engine(),version=R.version(CLUBS,{});
    const plain=R.forSeason(RID,CLUBS,1);
    // Nik's phone (another build) saved "Nik lost B. Leno": this phone shows exactly that for his turn.
    const leno=plain.boards.playerTwo.find(p=>p.name&&!p.bench&&p.pos==="GK");
    const saved=R.forSeason(RID,CLUBS,1,{hits:{1:{playerOne:null,playerTwo:{fired:true,hitName:leno.name,hitNumber:leno.number,hitSlot:leno.slot,version}}}});
    const nik=saved.turns.find(t=>t.role==="playerTwo");
    assert.equal(nik.fired,true);assert.equal(nik.player.name,leno.name);assert.equal(nik.hitSlot,leno.slot);assert.equal(nik.stopChamber,nik.bulletChamber,"the animation lands on the bullet");assert.equal(nik.authority,"saved");
    assert.deepEqual(saved.turns.find(t=>t.role==="playerOne"),plain.turns.find(t=>t.role==="playerOne"),"Daniel's own turn is unchanged");
    // Daniel's saved safe spin stays safe even if this build's chambers say otherwise.
    const safe=R.forSeason(RID,CLUBS,1,{hits:{1:{playerOne:{fired:false,hitName:null,hitNumber:null,hitSlot:null,version},playerTwo:null}}}).turns.find(t=>t.role==="playerOne");
    assert.equal(safe.fired,false);assert.equal(safe.player,null);assert.notEqual(safe.stopChamber,safe.bulletChamber);
    // A saved player this board no longer has: the line still names him, at his saved slot.
    const gone=R.forSeason(RID,CLUBS,1,{hits:{1:{playerOne:{fired:true,hitName:"A. Nobody",hitNumber:null,hitSlot:4,version},playerTwo:null}}}).turns.find(t=>t.role==="playerOne");
    assert.equal(gone.player.name,"A. Nobody");assert.equal(gone.hitSlot,4);
    ok("H2","F2-02 this season: a saved outcome (fired or safe) is the authority for that manager's turn");
  }

  // ---------- H3 ----------
  {
    const R=engine(),version=R.version(CLUBS,{});
    assert.match(version,/^rr4\.[0-9]+\.[0-9a-f]{8}$/);assert.equal(R.version(CLUBS,{}),version,"stable");
    const other=JSON.parse(JSON.stringify(Squads));other.squads["Real Madrid"].xi[0][1]="Somebody Else";
    assert.equal(engine(other).version(CLUBS,{}),version,"a data fix for another club never stops this Showdown");
    const sp={playerOne:{name:"Neymar",overall:92,number:11},playerTwo:{name:"L. Messi",overall:93,number:10}};
    assert.notEqual(R.version(CLUBS,{special:sp}),version,"the Special Players are part of this Showdown's data");
    assert.equal(R.version({playerOne:"Not A Club",playerTwo:"Arsenal"},{}),null);
    // The engine revision is pinned to the engine's text: any change to js/rosterRoulette.js must decide whether a board or a
    // shot can come out differently (then bump ENGINE_REVISION) and update this pin.
    const PIN={revision:1,sha256:"215b36cb9af76c44b2290a937c6e8eeb80a7ffe9052537ef90693c347fc14283"};
    const sha=crypto.createHash("sha256").update(read("js/rosterRoulette.js")).digest("hex");
    assert.equal(R.engineRevision,PIN.revision,"ENGINE_REVISION changed: update the pin below with the file's sha256");
    assert.equal(sha,PIN.sha256,"js/rosterRoulette.js changed: if a board or a shot can come out differently, bump ENGINE_REVISION; then update this pin");
    // The provider and the Rules accept exactly this version shape.
    const Provider=require("../../js/sparkSharedTransferChallenge.js");
    assert.equal(Provider.outcomeValid(R.outcome(R.forSeason(RID,CLUBS,1),"playerOne",version)),true);
    assert.match(read("firestore.transfer-challenge-production.fragment.rules"),/value\.version\.matches\('\^rr\[0-9\]\{1,3\}\[\.\]\[0-9\]\{1,4\}\[\.\]\[0-9a-f\]\{8\}\$'\)/);
    ok("H3","F2-02 version: engine revision + this Showdown's data only; ENGINE_REVISION pinned to the engine text");
  }

  // ---------- step harness (H4, H5) ----------
  class El{constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.listeners={};this.style={};this.classList={add(){},remove(){}};this.textContent="";this.parent=null;this.id="";this.className="";
    if(tag==="iframe")this.contentWindow={posted:[],postMessage(m){this.posted.push(m);},location:{href:"x"},THREE:{}};}
    append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}
    setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
    addEventListener(t,fn){(this.listeners[t]||=[]).push(fn);}focus(){}
    all(){return [this,...this.children.flatMap(c=>c.all())];}
    querySelector(sel){return sel==="button"?this.all().slice(1).find(n=>n.tagName==="button")||null:null;}}
  function stepPage(){
    const frames=[];const body=new El("body"),doc={body,frames,createElement:tag=>{const el=new El(tag);if(tag==="iframe")frames.push(el);return el;},getElementById:id=>body.all().find(n=>n.id===id)||null};
    const store=new Map(),R=engine();
    const sandbox={document:doc,setTimeout:(fn,ms)=>setTimeout(fn,Math.min(ms,30)),clearTimeout,location:{origin:"x"},addEventListener(){},removeEventListener(){},
      readStorageValue:k=>store.get(k)||null,writeStorageValue:(k,v)=>{store.set(k,v);return true;},
      loadRuntimeScript:async()=>{Object.assign(sandbox,{CareerModeFifa17Players:{},CareerModeRosterSquads:{},CareerModeMarqueePlayers:{},CareerModeMarqueePlayer:{forShowdown:()=>null},CareerModeRosterRoulette:R});return true;}};
    vm.createContext(sandbox);vm.runInContext(read("js/rosterRouletteStep.js"),sandbox);
    const step=sandbox.CareerModeRosterRouletteStep;
    const panel=async()=>{let p=null;for(let i=0;i<300&&!p;i+=1){await new Promise(r=>setTimeout(r,5));p=doc.getElementById(step.panelId);}return p;};
    const title=p=>p.all().find(n=>n.className==="rrStepTitle").textContent;
    const lines=p=>p.all().filter(n=>n.className==="rrStepLine").map(n=>n.textContent);
    const press=(p,label)=>{const b=p.all().find(n=>n.tagName==="button"&&n.textContent===label);assert.ok(b,`button ${label}: ${p.all().filter(n=>n.tagName==="button").map(n=>n.textContent)}`);b.listeners.click[0]();};
    return {doc,body,store,step,R,panel,title,lines,press};
  }
  const ctxFor=(extra)=>({rivalryId:RID,managerRole:"playerOne",season:1,clubs:CLUBS,confirmedAtMs:Date.parse("2026-11-01T00:00:00Z"),phase:"NOT_STARTED",verdicts:async()=>({ok:false}),...extra});

  // ---------- H4 ----------
  {
    const page=stepPage(),version=page.R.version(CLUBS,{});
    const other={fired:false,hitName:null,hitNumber:null,hitSlot:null,version:"rr4.1.deadbeef"};
    let refreshes=0,remembered=null;
    // This browser already watched the scene (so the run goes straight to the card after the stop).
    page.store.set(page.step.watchedKey,JSON.stringify([`${RID}|1|playerOne`]));
    const ctx=ctxFor({marks:{playerOne:null,playerTwo:other},windowStarted:false,remember:o=>{remembered=o;},
      refreshMarks:async()=>{refreshes+=1;return {marks:{playerOne:null,playerTwo:refreshes>1?{...other,version}:other},windowStarted:false};}});
    const run=page.step.runBeforeTransfers(ctx);
    let p=await page.panel();
    assert.equal(page.title(p),"Update the game on the other phone","a plain stop, never a silent desync");
    assert.match(page.lines(p).join(" "),/Nik spun this season's roulette on a different version of the game/);
    assert.equal(page.doc.getElementById(page.step.stageId),null,"no spin behind the stop");
    page.press(p,"TRY AGAIN");await new Promise(r=>setTimeout(r,40));
    p=await page.panel();assert.equal(page.title(p),"Update the game on the other phone","still different after one re-read");assert.equal(refreshes,1);
    page.press(p,"TRY AGAIN");await new Promise(r=>setTimeout(r,60));
    p=await page.panel();assert.notEqual(page.title(p),"Update the game on the other phone","the other phone was updated: the spins go on");
    page.press(p,p.all().find(n=>n.className==="menuButton rrStepPrimary").textContent);
    assert.equal(await run,true);assert.equal(remembered.version,version,"the outcome this phone saves carries its own version");
    // CONTINUE goes on with the partner's saved spin as the authority for his turn.
    const page2=stepPage();page2.store.set(page2.step.watchedKey,JSON.stringify([`${RID}|1|playerOne`]));
    const lenoBoard=page2.R.forSeason(RID,CLUBS,1).boards.playerTwo,keeper=lenoBoard.find(x=>x.pos==="GK");
    const run2=page2.step.runBeforeTransfers(ctxFor({marks:{playerOne:null,playerTwo:{fired:true,hitName:keeper.name,hitNumber:keeper.number,hitSlot:keeper.slot,version:"rr4.1.deadbeef"}},windowStarted:false,remember(){}}));
    let q=await page2.panel();page2.press(q,"CONTINUE WITH NIK'S SAVED SPIN");await new Promise(r=>setTimeout(r,40));
    q=await page2.panel();assert.ok(page2.lines(q).includes(`Nik lost ${keeper.name}.`),"Nik's line is his saved spin");
    page2.press(q,"BACK TO SHOWDOWN HOME");assert.equal(await run2,false);
    // The same version, or a partner mark with no outcome (an older mark), never stops.
    const page3=stepPage();page3.store.set(page3.step.watchedKey,JSON.stringify([`${RID}|1|playerOne`]));
    const run3=page3.step.runBeforeTransfers(ctxFor({marks:{playerOne:null,playerTwo:true},windowStarted:false}));
    const r3=await page3.panel();assert.notEqual(page3.title(r3),"Update the game on the other phone");page3.press(r3,"BACK TO SHOWDOWN HOME");await run3;
    ok("H4","F2-02 version stop: a partner mark on another version stops with plain words; TRY AGAIN re-reads; CONTINUE uses his saved spin");
  }

  // ---------- H5 ----------
  {
    const page=stepPage(),version=page.R.version(CLUBS,{});
    let remembered=0;
    const mine={fired:true,hitName:"J. Milner",hitNumber:7,hitSlot:7,version};
    const run=page.step.runBeforeTransfers(ctxFor({marks:{playerOne:mine,playerTwo:null},windowStarted:false,remember:()=>{remembered+=1;}}));
    const p=await page.panel();
    assert.equal(page.doc.frames.length,0,"no second spin: the scene never loads");
    assert.equal(page.title(p),"Release J. Milner","the result card for that season");
    page.press(p,"I'VE RELEASED HIM");assert.equal(await run,true);
    assert.equal(remembered,0,"the server already holds his mark: nothing new is saved");
    assert.ok(JSON.parse(page.store.get(page.step.doneKey)).includes(`${RID}|1|playerOne`),"done on this browser now too");
    // The window already opened (both managers spun): the result card too, no spin.
    const page2=stepPage();
    const run2=page2.step.runBeforeTransfers(ctxFor({marks:null,windowStarted:true,phase:"WINDOW_OPEN",remember:()=>{remembered+=1;}}));
    const q=await page2.panel();assert.equal(page2.doc.frames.length,0);
    page2.press(q,q.all().find(n=>n.className==="menuButton rrStepPrimary").textContent);assert.equal(await run2,true);assert.equal(remembered,0);
    ok("H5","F2-10 a second browser or cleared storage shows the result card from the server mark, with no second spin");
  }

  // ---------- production harness (H6, H7) ----------
  const {FakeNode}=require("../support/fake-dom.cjs");
  const rivalryId="pair_"+"a".repeat(64),sessionId="session_"+"b".repeat(64),device1="device_"+"1".repeat(32);
  const leagues=global.FIFA17_TRANSFER_LEAGUES.map(x=>x.id),nations=global.FIFA17_TRANSFER_NATIONALITIES.map(x=>x.id);
  async function settle(){for(let i=0;i<40;i+=1)await new Promise(resolve=>setImmediate(resolve));}
  function prodPhone({provider,step,timers,seen=null}){
    const byId=new Map(),listeners=[];
    const doc={visibilityState:"visible",
      getElementById(id){if(!byId.has(id)){const node=new FakeNode("div");node.id=id;node.value="";node.hasAttribute=k=>Object.prototype.hasOwnProperty.call(node.attributes,k);node.removeAttribute=k=>{delete node.attributes[k];};node.querySelectorAll=()=>[];if(id==="transferChallenge")node.classList.add("hidden");byId.set(id,node);}return byId.get(id);},
      querySelector:()=>null,querySelectorAll:()=>[],createElement:tag=>new FakeNode(tag),createTextNode:text=>Object.assign(new FakeNode("#text"),{ownText:text}),addEventListener(type,fn,capture){listeners.push({type,fn,capture});}};
    const tap=id=>{const target=doc.getElementById(id);for(const l of listeners.filter(item=>item.type==="click"))l.fn({target:{closest:()=>target},preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});};
    const storage=new Map(seen?[[`cms.transferViews.v1:${rivalryId}:1:playerOne`,JSON.stringify(seen)]]:[]);
    const sandbox={console,Date,Promise,JSON,Math,Number,String,Array,Object,Set,Map,Error,Boolean,RegExp,Uint8Array,
      setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},
      performance:{now:()=>Date.now()},crypto:crypto.webcrypto,document:doc,addEventListener(){},
      readStorageValue:k=>storage.has(k)?storage.get(k):null,writeStorageValue:(k,v)=>{storage.set(k,v);return true;},removeStorageValue:k=>{storage.delete(k);},
      currentShowdown:{id:"save_1",currentRound:1,sharedJourney:{mode:"shared",rivalryId},managers:{playerOne:"Daniel",playerTwo:"Nik"},clubs:{playerOne:"Liverpool",playerTwo:"Arsenal"}},
      navigateTo:async id=>{doc.getElementById(id).classList.remove("hidden");return true;},
      CareerModeProductionSharedShowdownSetup:{refresh:async()=>null,getState:()=>({ready:true,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",clubs:CLUBS},setupUpdatedAtMs:Date.parse("2026-11-01T00:00:00Z"),managerRole:"playerOne",rivalryId,sessionId,deviceId:device1})},
      CareerModeProductionSharedCareerStart:{refresh:async()=>null,getState:()=>({state:{phase:"CAREER_START_READY",revision:2}})},
      CareerModeSharedTransferChallenge:{},CareerModeSparkSharedTransferChallenge:provider,
      CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"manager_one",getIdTokenResult:async()=>({issuedAtTime:new Date().toISOString()})}},firestore:{},firestoreSdk:{getDoc:async()=>null,doc:()=>null}})},
      CareerModeRosterRouletteStep:step};
    sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(read("js/productionSharedTransferChallenge.js"),sandbox,{filename:"productionSharedTransferChallenge.js"});
    return {api:sandbox.CareerModeProductionSharedTransferChallenge,doc,tap,storage,text:id=>doc.getElementById(id).textContent};
  }
  const Real=require("../../js/sparkSharedTransferChallenge.js");

  // ---------- H6 ----------
  {
    const G=[{slot:1,type:"league",valueId:leagues[0]}];
    const signing={slot:1,name:"A. Signing",leagueId:leagues[1],nationalityId:nations[1],overall:75,position:"CM"};
    const base={phase:"SIGNING_ENTRY",revision:5,coordinatorRole:"playerOne",startedAtEpochMs:1,endedAtEpochMs:2,endRequestedRoles:["playerOne","playerTwo"],guessLockedRoles:["playerOne","playerTwo"],signingLockedRoles:["playerTwo"],operationIds:[],operationTypes:[],operationHashes:[],baseRevisions:[],actorRoles:[]};
    let state=base,readsFail=false,reads=0;
    const verdicts={playerOne:[{...signing,release:false,matchedBy:[]}],playerTwo:[]};
    const provider={rouletteEligible:()=>false,outcomeValid:Real.outcomeValid,
      read:async()=>{reads+=1;if(readsFail)return {ok:false,code:"unavailable"};return {ok:true,revision:state.revision,state,managerRole:"playerOne",seasonNumber:1,spunRoles:null,spinMarks:null,ownInputs:{guesses:G,signings:state.phase==="COMPLETED"?[signing]:null},opponentInputs:state.phase==="COMPLETED"?{guesses:G,signings:[]}:null,verdicts:state.phase==="COMPLETED"?verdicts:null};},
      lockSignings:async options=>{assert.deepEqual(JSON.parse(JSON.stringify(options.signings)),[signing]);state={...base,phase:"COMPLETED",revision:6,signingLockedRoles:["playerTwo","playerOne"]};readsFail=true;return {ok:true,status:"accepted",replayed:false,revision:6,state,managerRole:"playerOne",seasonNumber:1,needsRefresh:true};},
      startWindow:async()=>({ok:false}),requestEndWindow:async()=>({ok:false}),advanceExpiredWindow:async()=>({ok:false}),lockGuesses:async()=>({ok:false}),markSpun:async()=>({ok:true})};
    const timers=[];
    const phone=prodPhone({provider,step:{fromMs:0,decide:()=>false,runBeforeTransfers:async()=>true,close(){}},timers,seen:["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY"]});
    phone.api.install();await settle();assert.equal(await phone.api.open(),true);await settle();
    const field=(id,value,canonical)=>{const node=phone.doc.getElementById(id);node.value=value;if(canonical)node.dataset.canonicalId=canonical;};
    field("p1Signing1Name","A. Signing");field("p1Signing1Overall","75");field("p1Signing1Position","CM");field("p1Signing1League","x",leagues[1]);field("p1Signing1Nationality","y",nations[1]);
    for(const i of [2,3])for(const k of ["Overall","Position"])field(`p1Signing${i}${k}`,"");
    phone.tap("completeTransferChallenge");await settle();
    assert.equal(phone.text("transferPhaseStatus"),"SAVED · LOADING VERDICTS","the lock saved: the screen says so");
    assert.equal(phone.text("transferChallengeError"),"","no \"did it save?\" line");
    assert.equal(/No signings were entered/.test(phone.text("transferResultsOne")+phone.text("transferResultsTwo")),false,"never an empty verdict screen");
    assert.match(phone.text("transferResultsOne"),/Loading the verdicts/);
    assert.equal(phone.doc.getElementById("p1Signing1Name").value,"A. Signing","his own inputs stay on screen");
    // It reads again by itself; the next read brings the verdicts.
    const retry=timers.find(t=>t.ms===1500);assert.ok(retry,"a retry is scheduled");
    readsFail=false;retry.fn();await settle();
    assert.equal(phone.text("transferPhaseStatus"),"TRANSFER CHALLENGE COMPLETE · VERDICTS REVEALED");
    assert.match(phone.text("transferResultsOne"),/A\. Signing/);
    assert.ok(phone.storage.get("careerModeShowdown.rouletteVerdicts.v1").includes("A. Signing"),"the kept copy for next season's boards is written");
    ok("H6","F2-08 after a saved lock a failed read shows saved, loading verdicts with the own inputs, and retries by itself");
  }

  // ---------- H7 ----------
  {
    const R=engine(),version=R.version(CLUBS,{}),outcome=R.outcome(R.forSeason(RID,CLUBS,1),"playerOne",version);
    const marks=[],seasonReads=[];let txReads=0;
    const provider={rouletteEligible:()=>true,outcomeValid:Real.outcomeValid,
      read:async options=>{txReads+=1;return {ok:true,revision:0,state:null,managerRole:"playerOne",seasonNumber:options.seasonNumber,spunRoles:[],spinMarks:{playerOne:null,playerTwo:null},ownInputs:null,opponentInputs:null,verdicts:null};},
      readRouletteSeason:async options=>{seasonReads.push([options.seasonNumber,options.verdicts]);assert.equal(typeof options.firebaseSdk.getDoc,"function");return {ok:true,seasonNumber:options.seasonNumber,verdicts:{playerOne:[],playerTwo:[]},hits:{playerOne:outcome,playerTwo:null}};},
      markSpun:async options=>{marks.push(options.outcome||null);return {ok:true};},
      startWindow:async()=>({ok:false}),requestEndWindow:async()=>({ok:false}),advanceExpiredWindow:async()=>({ok:false}),lockGuesses:async()=>({ok:false}),lockSignings:async()=>({ok:false})};
    let history=null;
    const step={fromMs:0,decide:()=>true,close(){},runBeforeTransfers:async ctx=>{
      assert.deepEqual(JSON.parse(JSON.stringify(ctx.marks)),{playerOne:null,playerTwo:null});assert.equal(ctx.windowStarted,false);
      history=[await ctx.verdicts(1),await ctx.verdicts(1)];ctx.remember(outcome);return true;}};
    const phone=prodPhone({provider,step,timers:[]});
    phone.api.install();await settle();
    const before=txReads;assert.equal(await phone.api.open(),true);await settle();
    assert.deepEqual(JSON.parse(JSON.stringify(marks)),[{...outcome}],"the mark carries this manager's outcome");
    assert.deepEqual(JSON.parse(JSON.stringify(seasonReads)),[[1,true]],"one plain-gets read of the missing season; the second ask is served from the kept copy");
    assert.equal(txReads-before,1,"no prerequisite transaction for the history (only the screen's own read)");
    assert.deepEqual(JSON.parse(JSON.stringify(history[1].hits.playerOne)),{...outcome});
    assert.ok(phone.storage.get("careerModeShowdown.rouletteOutcome.v1").includes(version),"kept until the mark lands, so a reload re-sends the same outcome");
    ok("H7","F2-02/F2-12 production: the mark carries the outcome; a missing season is read with plain gets once, then kept");
  }

  // ---------- H8 ----------
  {
    let interval=null,checksAsked=0;
    const sandbox={console,Date,Promise,JSON,Math,Number,String,Array,Object,Set,Map,Error,setTimeout:()=>0,clearTimeout(){},setInterval:fn=>{interval=fn;return 1;},addEventListener(){},
      document:{visibilityState:"visible",addEventListener(){}},
      CareerModeProductionSharedSeasonCommit:{waitingListenerHealthy:()=>{checksAsked+=1;return true;}},
      CareerModeSparkRemoteJoining:{getState:()=>({expiresAtEpochMs:Date.now()+3600000})},
      CareerModeRosterRouletteStep:{active:()=>true}};
    sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(read("js/productionSharedJourneyReconnect.js"),sandbox);
    sandbox.CareerModeProductionSharedJourneyReconnect.install();
    for(let i=0;i<12;i+=1)interval();
    assert.equal(checksAsked,0,"three minutes of roulette: the 15 s check never runs (no Setup or progression re-read)");
    sandbox.CareerModeRosterRouletteStep.active=()=>false;interval();assert.equal(checksAsked,1,"after the roulette the check runs as before");
    sandbox.CareerModeRosterRouletteStep.active=()=>true;sandbox.CareerModeSparkRemoteJoining.getState=()=>({expiresAtEpochMs:Date.now()-1});interval();
    assert.equal(checksAsked,2,"an expiring session still runs the check during the roulette");
    ok("H8","S6 the reconnect banner's 15 s check waits while the full-screen roulette is up");
  }
  console.log(`PASS r87 roulette hits (Fable job 2 F2-02, F2-08, F2-10, F2-12, S6): ${checks} groups`);
})().catch(error=>{console.error(error);process.exitCode=1;});
