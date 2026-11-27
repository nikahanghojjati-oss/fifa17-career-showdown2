"use strict";
// r100 (Nik 2026-11-26 23:19 UTC: "Does it say drop the ball or spin the wheel? It's important to show the right screen and
// the right button."). Since #1633 the League Roulette is the 3D board on every shared Showdown screen, also before both
// players are connected (Daniel's "Waiting for Nik"), but three writers still put the old wheel's words on it:
//   - the shared presentation's not-connected branch: "Connect both players to spin", CONNECT BOTH PLAYERS FIRST, "... before
//     the wheel can spin." (js/productionSharedShowdownPresentation.js ssjpRenderLeague)
//   - the plain wheel's own render: "Spin to pick the league" (shown as SPIN TO PICK THE LEAGUE) and SPIN WHEEL, written over the
//     presentation's words on every render before the league is known (js/leagueWheel.js renderLeagueWheelState)
//   - the dashboard line "Spin to select league" (js/showdownUI.js) and the page's own defaults (index.html)
// The checks, on the real files in node:vm:
//   W1 every state of the shared League Roulette while the board is on writes no "spin" and no "wheel": not connected (WAITING
//      FOR the other manager, by name, from the Setup or the pair), connected before ball 1 (your turn / theirs), a ball rolling,
//      between balls (your turn / theirs), the league revealed
//   W2 the plain wheel keeps its words where the roulette is not armed (an older Setup) or could not run (the 2D fallback)
//   W3 js/leagueWheel.js leaves the words to the presentation in a shared Showdown, says the roulette line and waits during
//      Daniel's START, and keeps SPIN WHEEL on one device and in the 2D fallback; js/showdownUI.js follows it
//   W4 the page's own defaults say no spin and no wheel (the first frame before any script has written)
//   W5 Daniel's waiting screen before Nik connects (the entry's draw lock): WAITING FOR the other manager, the first-ball note,
//      and no CONTINUE CAREER beside WAITING while it is open
//   W6 the board armed before the presentation has taken the step: the roulette's words from the first frame
//   W7 no player screen reaches a one-device League Roulette (START is the shared entry; no Showdown without a manager)
// No Firestore, no storage: the pair's role is read from its state already on the page.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};
const pick=(code,re)=>{const m=code.match(re);assert.ok(m,`missing ${re}`);return m[0];};
const WHEEL_WORDS=/\bspin|\bwheel/i;

// ---- W1/W2: the shared presentation's League Roulette words ----
const P=read("js/productionSharedShowdownPresentation.js");
const render=pick(P,/  function ssjpRenderLeague\(\)\{[\s\S]*?\n  \}\n/)+pick(P,/  \/\/ R98-01: Select League as the League Roulette\.[\s\S]*?\n  \/\/ The board follows the ledger/).replace(/  \/\/ The board follows the ledger$/,"");
// (optional here, so on a file without them the check fails on the words it shows, not on a missing helper)
const other=(P.match(/  function ssjpOtherUpper\(\)\{[\s\S]*?\n  \}\n/)||["  function ssjpOtherUpper(){return \"?\";}\n"])[0];
const line=(P.match(/  const ROULETTE_LINE="[^"]+";/)||['  const ROULETTE_LINE="Five leagues. Four balls. One league stays.";'])[0];
function node(id){return {id,textContent:"",label:"",disabled:false,dataset:{},classList:{s:new Set(),add(c){this.s.add(c);},remove(c){this.s.delete(c);},contains(c){return this.s.has(c);}}};}
function presentation({armed=true,state,stage=0,caughtUp=true,pair=null}){
  const els={leagueWheelScreen:node("leagueWheelScreen"),selectedLeague:node("selectedLeague"),spinLeague:node("spinLeague"),leagueStateNote:node("leagueStateNote"),leagueWheel:{querySelector:()=>null}};
  const out={status:""};
  const ctx={state,witnessedLeagueId:null,leagueSpinUntil:0,LEAGUE_SPIN_MS:4100,LEAGUE_AUTO_FORWARD_MS:5000,LEAGUE_REVEAL_HOLD_MS:900,
    rouletteStep:armed?{armed:()=>true,stage:()=>stage,caughtUp:()=>caughtUp,leagueOut:()=>"seriea"}:null,
    root:{document:{getElementById:id=>els[id]||null},CareerModePersistentNikDanielPair:pair?{getState:()=>pair}:undefined},
    ssjpPending:()=>true,ssjpRemoveForeignStatus(){},ssjpRouletteOn:()=>armed,ssjpRouletteSync(){},ssjpRouletteTextSteps:()=>false,ssjpClearLeagueLock(){},
    ssjpText:(el,text)=>{if(el)el.textContent=String(text);},ssjpSetControl:(el,o)=>{el.label=o.label;el.disabled=Boolean(o.disabled);},ssjpSetSharedStatus:t=>{out.status=t;},
    ssjpManagers:()=>({playerOne:"Daniel",playerTwo:"Nik"}),ssjpHostName:()=>"Daniel",ssjpHostUpper:()=>"DANIEL",
    ssjpCoordinator:()=>Boolean(state&&state.setup&&state.managerRole===state.setup.coordinatorRole),ssjpActionBusy:()=>false,
    ssjpLeagueRecord:id=>({seriea:{name:"Serie A"},laliga:{name:"LaLiga"}})[id]||null,ssjpIsDraw:()=>true,ssjpDrawAdvance(){},ssjpDrawPrepare(){},ssjpLater(){},ssjpAutoForwardToClubs(){},
    ssjpDrops:()=>state.setupDrops,ssjpRoleName:role=>role==="playerOne"?"Daniel":"Nik",
    ssjpBallRole:ball=>{const c=state?.setup?.coordinatorRole;return ball%2===1?c:(c==="playerOne"?"playerTwo":"playerOne");}};
  vm.createContext(ctx);vm.runInContext(`${line}\n${other}\n${render}\nglobalThis.go=ssjpRenderLeague;`,ctx);
  assert.equal(ctx.go(),true,"the screen is rendered");
  const texts=[els.selectedLeague.textContent,els.spinLeague.label,els.leagueStateNote.textContent,out.status];
  return {texts,result:els.selectedLeague.textContent,button:els.spinLeague.label,disabled:els.spinLeague.disabled,note:els.leagueStateNote.textContent,status:out.status};
}
const setup=(phase,extra={})=>({coordinatorRole:"playerOne",phase,leagueId:"seriea",...extra});
const STATES=[
  ["Daniel waiting for Nik (not connected)",{state:{ready:false,managerRole:"playerOne",status:"ready",message:"Setup stays closed until Daniel and Nik are connected in an ACTIVE session."}},{button:"WAITING FOR NIK",disabled:true}],
  ["Nik waiting for Daniel (not connected, role from the pair)",{state:{ready:false,managerRole:null},pair:{managerRole:"playerTwo"}},{button:"WAITING FOR DANIEL",disabled:true}],
  ["not connected, role unknown",{state:{ready:false,managerRole:null}},{button:"WAITING FOR THE OTHER PLAYER",disabled:true}],
  ["connected, Daniel's first ball (his phone)",{state:{ready:true,managerRole:"playerOne",remoteRole:"host",setup:null,setupDrops:0}},{button:"DROP BALL",disabled:false}],
  ["connected, Daniel's first ball (Nik's phone)",{state:{ready:true,managerRole:"playerTwo",remoteRole:"guest",setup:null,setupDrops:0}},{button:"WAITING FOR DANIEL",disabled:true}],
  ["setup open, ball 1 (Daniel)",{state:{ready:true,managerRole:"playerOne",setup:setup("SHARED_SETUP_OPEN"),setupDrops:0}},{button:"DROP BALL",disabled:false}],
  ["ball 1 rolling",{state:{ready:true,managerRole:"playerTwo",setup:setup("LEAGUE_WHEEL_COMMITTED"),setupDrops:1},caughtUp:false,stage:0},{button:"BALL ROLLING…",disabled:true}],
  ["after ball 1, Nik's ball (Nik's phone)",{state:{ready:true,managerRole:"playerTwo",setup:setup("LEAGUE_WHEEL_COMMITTED"),setupDrops:1},stage:1},{button:"DROP BALL",disabled:false}],
  ["after ball 2, Daniel's ball (Nik's phone)",{state:{ready:true,managerRole:"playerTwo",setup:setup("LEAGUE_WHEEL_COMMITTED"),setupDrops:2},stage:2},{button:"WAITING FOR DANIEL",disabled:true}],
  ["the league revealed",{state:{ready:true,managerRole:"playerOne",setup:setup("LEAGUE_WHEEL_COMMITTED"),setupDrops:4},stage:4},{button:"CONTINUE TO BALL GAME",disabled:false}],
];
function w1(){
  for(const [label,opts,want] of STATES){
    const v=presentation(opts);
    for(const t of v.texts)assert.doesNotMatch(String(t),WHEEL_WORDS,`${label}: "${t}" says spin or wheel while the 3D board is on`);
    assert.equal(v.button,want.button,`${label}: the button`);assert.equal(v.disabled,want.disabled,`${label}: the button ${want.disabled?"rests":"is live"}`);
    if(/not connected/.test(label)){
      assert.equal(v.result,"Five leagues. Four balls. One league stays.",`${label}: the roulette line`);
      assert.equal(v.note,"Both players must be connected before the first ball drops.",`${label}: the note names the first ball`);
    }
  }
  const failed=presentation({state:{ready:false,managerRole:"playerOne",status:"error",message:"Could not reach the Showdown. Check the connection."}});
  assert.equal(failed.note,"Could not reach the Showdown. Check the connection.","a real problem is still told in the note");
  ok("W1",`every League Roulette state with the 3D board on (${STATES.length} states, both phones) says balls, never spin or wheel; the buttons are DROP BALL / WAITING FOR the other manager / BALL ROLLING… / CONTINUE`);
}
function w2(){
  const v=presentation({armed:false,state:{ready:false,managerRole:"playerOne"}});
  assert.equal(v.result,"Connect both players to spin","the plain league wheel (roulette not armed) keeps its words");
  assert.equal(v.button,"CONNECT BOTH PLAYERS FIRST");
  ok("W2","the plain wheel keeps its own words where the roulette is not armed");
}

// ---- W3: js/leagueWheel.js and js/showdownUI.js ----
function wheelWorld({pending=false,starting=false,failed=false,step=true,selected=null}){
  const els={leagueWheel:{querySelector:()=>({style:{},dataset:{}})},selectedLeague:node("selectedLeague"),spinLeague:node("spinLeague"),leagueStateNote:node("leagueStateNote")};
  els.selectedLeague.textContent="Ball 2 of 4 is in";els.spinLeague.textContent="WAITING FOR DANIEL";
  const ctx={document:{getElementById:id=>els[id]||null},currentShowdown:{selectedLeague:selected,managers:{playerOne:"Daniel",playerTwo:"Nik"}},
    setWheelRotationWithoutAnimation(){},getLeagueRotation:()=>0,hasLockedClubAssignment:()=>false,isLeagueSelectionConfirmed:()=>false};
  ctx.window=ctx;ctx.window.CareerModeProductionSharedJourneyEntry={isPending:()=>pending,isStarting:()=>starting};
  if(step)ctx.window.CareerModeLeagueRouletteStep={failed:()=>failed};
  vm.createContext(ctx);vm.runInContext(read("js/leagueWheel.js")+";globalThis.go=renderLeagueWheelState;",ctx);ctx.go();
  return {result:els.selectedLeague.textContent,button:els.spinLeague.textContent,disabled:els.spinLeague.disabled,owner:ctx.leagueRouletteWordsOwner()};
}
function w3(){
  {const v=wheelWorld({pending:true});assert.equal(v.owner,"presentation");assert.equal(v.result,"Ball 2 of 4 is in","a shared Showdown's words are the presentation's: the wheel's render never writes over them");assert.equal(v.button,"WAITING FOR DANIEL");}
  {const v=wheelWorld({starting:true});assert.equal(v.owner,"start");assert.equal(v.result,"Five leagues. Four balls. One league stays.","Daniel's START: the roulette line");
    assert.equal(v.button,"WAITING…");assert.equal(v.disabled,true,"and a resting button until the presentation takes over");assert.doesNotMatch(v.result+v.button,WHEEL_WORDS);}
  {const v=wheelWorld({starting:true,step:false});assert.equal(v.owner,"start","the board's module still on its way: the roulette's words already");}
  {const v=wheelWorld({});assert.equal(v.owner,false);assert.equal(v.result,"Spin to pick the league","one device: the plain wheel's words");assert.equal(v.button,"SPIN WHEEL");}
  {const v=wheelWorld({pending:true,failed:true});assert.equal(v.owner,false);assert.equal(v.button,"SPIN WHEEL","the 2D fallback keeps its wheel words");}
  const U=read("js/showdownUI.js");
  assert.ok(U.includes('const rouletteWords = !leagueName && typeof window.leagueRouletteWordsOwner === "function" ? window.leagueRouletteWordsOwner() : false;'),"the dashboard line asks the same owner");
  assert.ok(U.includes('else if(!rouletteWords){ setDashboardTextIfChanged(ui.selectedLeague, leagueName || "Spin to select league"); }'),"and keeps \"Spin to select league\" only off the shared roulette");
  ok("W3","the plain wheel's render leaves a shared Showdown's words to the presentation, says the roulette line during START, and keeps SPIN WHEEL on one device and in the 2D fallback");
}

// ---- W4: the page's own defaults ----
function w4(){
  const I=read("index.html"),screen=pick(I,/<div id="selectedLeague"[\s\S]*?<button class="menuButton" id="spinLeague"[^>]*>[^<]*<\/button>/);
  const text=screen.replace(/<[^>]+>/g," ");
  assert.doesNotMatch(text,WHEEL_WORDS,"no spin or wheel in the first frame");
  assert.ok(screen.includes('<button class="menuButton" id="spinLeague" type="button" disabled>WAITING…</button>'),"the button rests until a script gives it its words");
  ok("W4","the page's own defaults (before any script writes) say no spin and no wheel");
}
// ---- W5: Daniel's waiting screen (js/productionSharedJourneyEntry.js applyLocalDrawLock) ----
// Before Nik connects the presentation is not active yet: the entry's draw lock owns the board's screen.
const E=read("js/productionSharedJourneyEntry.js");
const lock=pick(E,/  function rouletteWaiting\(\)\{[\s\S]*?\n  async function ensureSaveAuthority\(\)/).replace(/  async function ensureSaveAuthority\(\)$/,"");
function entryWorld({role="playerOne",failed=false,layerOpen=true,active=false,isPending=true}){
  const els={},kids=[];
  const el=(tag,id)=>{const e={tagName:tag,id,textContent:"",className:"",disabled:false,dataset:{},title:"",hidden:false,attrs:{},
    classList:{s:new Set(),add(c){this.s.add(c);},remove(c){this.s.delete(c);},contains(c){return this.s.has(c);}},
    setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(){},remove(){const i=kids.indexOf(this);if(i>=0)kids.splice(i,1);delete els[this.id];}};
    if(id)els[id]=e;return e;};
  el("button","spinLeague").textContent="WAITING…";el("button","openClubPack");
  const layer=el("section","connectPlayersScreen");if(!layerOpen)layer.classList.add("hidden");
  const wheel={firstChild:null,querySelector:()=>null,insertBefore(node){kids.push(node);if(node.id)els[node.id]=node;}};
  const doc={getElementById:id=>els[id]||null,querySelector:q=>q==="#leagueWheelScreen .wheelContainer"?wheel:null,createElement:tag=>el(tag,"")};
  const ctx={root:{document:doc,CareerModeLeagueRouletteStep:{failed:()=>failed},CareerModePersistentNikDanielPair:{getState:()=>({managerRole:role})}},
    currentShowdown:{managers:{playerOne:"Daniel",playerTwo:"Nik"}},pending:()=>isPending,presentationActive:()=>active,continueFromLockedWheel(){},
    LOCAL_SPIN_ID:"spinLeague",LOCAL_CLUB_ID:"openClubPack",SHARED_CONTINUE_ID:"continueSharedSetupGate",PANEL_ID:"productionSharedJourneyEntryOverlay"};
  ctx.create=(tag,className,text)=>{const e=doc.createElement(tag);e.className=className;e.textContent=String(text);return e;};
  vm.createContext(ctx);vm.runInContext(lock+";globalThis.go=applyLocalDrawLock;globalThis.open=waitingOpen;",ctx);ctx.go();
  return {button:els.spinLeague.textContent,disabled:els.spinLeague.disabled,note:els.sharedJourneyLeagueLockNote?.textContent||null,
    resume:Boolean(els.continueSharedSetupGate),layer,again(){ctx.go();return {resume:Boolean(els.continueSharedSetupGate)};}};
}
function w5(){
  {const v=entryWorld({});assert.equal(v.button,"WAITING FOR NIK","Daniel waits for Nik");assert.equal(v.disabled,true);
    assert.equal(v.note,"Both players must be connected before the first ball drops.");assert.equal(v.resume,false,"WAITING is open over the board: one button, no CONTINUE CAREER beside the CONNECTING bar");
    assert.doesNotMatch(v.button+v.note,WHEEL_WORDS);
    v.layer.classList.add("hidden");assert.equal(v.again().resume,true,"WAITING closed (BACK, Escape, X): CONTINUE CAREER is back to reopen it");}
  {const v=entryWorld({role:"playerTwo"});assert.equal(v.button,"WAITING FOR DANIEL","Nik waits for Daniel");}
  {const v=entryWorld({layerOpen:false});assert.equal(v.resume,true,"WAITING closed from the start: CONTINUE CAREER stays");}
  {const v=entryWorld({failed:true});assert.equal(v.button,"WAITING…","the 2D fallback: the label is not the roulette's");assert.equal(v.note,"Connect Daniel and Nik to pick the league.");assert.equal(v.resume,true);}
  {const v=entryWorld({active:true});assert.equal(v.note,null,"the presentation owns the screen once both are connected");assert.equal(v.resume,false);}
  assert.ok(/observe\(layer,\{attributes:true,attributeFilter:\["class","hidden"\]\}\)/.test(E),"the lock follows WAITING opening and closing");
  ok("W5","Daniel's waiting screen says WAITING FOR NIK (Nik's WAITING FOR DANIEL) and the first-ball note, with one button while WAITING is open");
}
// ---- W6: the board armed before the presentation has taken the step ----
// lr-buttons run (silver, Daniel on the phone): js/v10Setup.js arms the board idle before the presentation has loaded the step;
// for that moment the words fell through to "BOTH PLAYERS CONNECTED · Spin the wheel.". The step already on the page counts.
function w6(){
  const on=pick(P,/  function ssjpRouletteOn\(\)\{[^\n]*\n/),adopt=(P.match(/  function ssjpAdoptRouletteStep\(\)\{[\s\S]*?\n  \}\n/)||[""])[0];
  const world=(global)=>{const heard=[];const ctx={rouletteStep:null,rouletteListening:false,active:true,root:{CareerModeLeagueRouletteStep:global},
    ssjpPending:()=>true,ssjpActiveScreen:()=>"leagueWheelScreen",ssjpRenderLeague(){heard.push("render");}};
    vm.createContext(ctx);vm.runInContext(`${adopt}\n${on}\nglobalThis.go=ssjpRouletteOn;globalThis.step=()=>rouletteStep;`,ctx);return {ctx,heard};};
  let listener=null;const armedStep={armed:()=>true,on(fn){listener=fn;return()=>{};}};
  {const {ctx,heard}=world(armedStep);assert.equal(ctx.go(),true,"the board armed on the page: the roulette's words, not the wheel's");assert.equal(ctx.step(),armedStep,"the same step is taken");
    listener("land");assert.deepEqual(heard,["render"],"and its balls re-render the words");}
  {const {ctx}=world(null);assert.equal(ctx.go(),false,"no step on the page: the plain wheel");}
  {const {ctx}=world({armed:()=>false,on(){return()=>{};}});assert.equal(ctx.go(),false,"a step not armed (the 2D fallback): the plain wheel");}
  ok("W6","the board armed before the presentation has loaded its step already gets the roulette's words (no 'Spin the wheel.' flash)");
}
// ---- W7: no one-device League Roulette from a player screen (lead 2026-11-27, Duet's "signed out, 2D wheel") ----
// The plain wheel's words (SPIN WHEEL, "Spin to pick the league") are reached only where the shared roulette is not armed:
// the no-WebGL fallback, or START's fallback should js/productionSharedJourneyEntry.js fail to load (signed in only).
// No player route makes a one-device Showdown: START is always the shared entry, and a device with no identity creates none.
function w7(){
  // (a) START on the Seasons screen is caught before the local handler (screens.js startShowdownFromSetup) and runs the shared entry
  const install=pick(E,/  function installStartButton\(\)\{[\s\S]*?\n  \}\n/);
  const started=[],listeners=[];let stopped=false,prevented=false;
  const start={dataset:{},addEventListener:(type,fn,capture)=>listeners.push({type,fn,capture})};
  const ctx={root:{document:{getElementById:id=>id==="startShowdown"?start:null}},SHARED_START_ID:"sharedShowdownStart",syncStartButtonIdentity(){},seasonsStartGate(){},
    startShared:o=>{started.push(o);return Promise.resolve(false);}};
  vm.createContext(ctx);vm.runInContext(install+";globalThis.go=installStartButton;",ctx);
  assert.equal(ctx.go(),true);assert.equal(listeners.length,1);assert.equal(listeners[0].type,"click");assert.equal(listeners[0].capture,true,"START is caught in the capture phase");
  listeners[0].fn({preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});
  assert.ok(prevented&&stopped,"the local START handler never runs");assert.equal(started.length,1,"the shared entry starts the Showdown");
  const shared=pick(E,/  async function startShared\(options=\{\}\)\{[\s\S]*?\n    busy=true;/);
  assert.match(shared,/if\(!entryIdentityReady\(\)\)\{[\s\S]*identity\.openGate\(\);return false;[\s\S]*return false;\s*\}/,"signed out: START opens the sign-in gate and stops");
  // (b) createShowdown makes nothing without a signed-in manager (so no signed-out device holds a one-device Showdown)
  const S=read("js/showdown.js"),create=pick(S,/async function createShowdown\(\)\{[^\n]*\n/);
  const notices=[];let made=0;
  const c={document:{getElementById:id=>id==="roundAmount"?{value:"3"}:null},navigator:{onLine:true},showdownCreationPromise:null,ALLOWED_SHOWDOWN_ROUNDS:[1,3,5,10],
    showScreen:()=>{made+=1;return true;},normalizeShowdown:x=>x,saveCurrentShowdown:()=>true,currentShowdown:null};
  c.window={showAppNotice:t=>notices.push(t),CareerModeOnlinePlayerIdentity:{getState:()=>({status:"signed-out",managerId:null})},CareerModeSaveLibraryRuntime:{isReady:()=>true,createShowdown:async x=>{made+=1;return x;}}};
  vm.createContext(c);vm.runInContext(`let showdownCreationPromise=null;const CURRENT_SHOWDOWN_SCHEMA_VERSION=2;${create};globalThis.go=createShowdown;`,c);
  return c.go().then(result=>{
    assert.equal(result,false);assert.equal(made,0,"no Showdown and no League Roulette");assert.deepEqual(notices,["Choose Daniel or Nik first."]);
    // (c) the plain wheel writes its words only where the shared roulette is not armed (W3 runs it; here the rule itself)
    const W=read("js/leagueWheel.js");
    assert.match(W,/function leagueRouletteWordsOwner\(\)/);
    ok("W7","no player screen reaches a one-device League Roulette: START is always the shared entry (signed out: the sign-in gate), createShowdown makes nothing without a manager, so SPIN WHEEL is left only to the fallbacks");
  });
}
w1();w2();w3();w4();w5();w6();
w7().then(()=>console.log(`PASS r100 League Roulette words contracts (${n} checks)`)).catch(error=>{console.error(error);process.exitCode=1;});
