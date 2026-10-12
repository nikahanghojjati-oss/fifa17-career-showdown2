"use strict";
// QoL 3 + 6: a half-typed shared season result (QoL 3) and half-typed transfer guesses (QoL 6) survive a reload, the same way
// the signing draft already does (JOB-1050). Both drafts live on the player's own device, are scoped to rivalry, season and
// manager role, hold only that manager's own fields, and are removed when the result is published, the guesses are locked,
// or the Showdown ends (terminal close). Only js/storage.js touches localStorage. Node only; no emulator.
//   Q1  typing partial season facts saves one own-role draft; nothing of the rival's form is stored.
//   Q2  a reload (fresh page, same device storage) restores the typed values and checkboxes.
//   Q3  a poll never overwrites what the player typed after the restore.
//   Q4  clearing the form removes the draft.
//   Q5  another season, role or rivalry, or a corrupt draft, is never restored.
//   Q6  publishing removes the draft.
//   Q7  guesses: typing saves only the manager's own guess slots, a reload restores them, lock/phase change/context change remove them.
//   Q8  the Showdown ending sweeps every draft of that rivalry and nothing else.
//   Q9  wiring: storage only through js/storage.js helpers, never sessionStorage, no scoring or text change.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const RIVALRY="pair_"+"a".repeat(64);
const OTHER_RIVALRY="pair_"+"b".repeat(64);
const SESSION="session_"+"c".repeat(64);
const DEVICE="device_"+"d".repeat(32);
let checks=0;
const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};

// A device's storage: a Map behind the Storage shape, including Object.keys(localStorage) like a real browser.
function makeDevice(){
  const store=new Map();
  const localStorage=new Proxy({},{
    get:(_target,name)=>name==="getItem"?key=>store.has(key)?store.get(key):null:name==="setItem"?(key,value)=>{store.set(String(key),String(value));}:name==="removeItem"?key=>{store.delete(key);}:name==="length"?store.size:name==="key"?index=>[...store.keys()][index]??null:undefined,
    ownKeys:()=>[...store.keys()],
    getOwnPropertyDescriptor:(_target,name)=>store.has(name)?{enumerable:true,configurable:true,value:store.get(name)}:undefined
  });
  return {store,localStorage,drafts:()=>[...store.keys()].filter(key=>key.startsWith("cms.draft.v1:")).sort()};
}

function makeNode(id){
  const classes=new Set();
  const node={id,textContent:"",value:"",checked:false,disabled:false,dataset:{},attributes:{},children:[],
    classList:{toggle(name,force){const on=force===undefined?!classes.has(name):Boolean(force);if(on)classes.add(name);else classes.delete(name);return on;},contains:name=>classes.has(name),add:name=>classes.add(name),remove:name=>classes.delete(name)},
    setAttribute(name,value){node.attributes[name]=String(value);},removeAttribute(name){delete node.attributes[name];},hasAttribute:name=>name in node.attributes,
    closest(selector){return selector==="button"&&node.tagName==="BUTTON"?node:null;},
    append(...items){node.children.push(...items);},replaceChildren(...items){node.children=[...items];},focus(){}};
  return node;
}
function makeDocument(){
  const nodes=new Map(),listeners=[];
  const document={visibilityState:"visible",
    getElementById(id){if(!nodes.has(id))nodes.set(id,makeNode(id));return nodes.get(id);},
    createElement:tag=>makeNode(`<${tag}>`),createDocumentFragment:()=>makeNode("#fragment"),querySelector:()=>null,
    addEventListener(type,listener,capture){listeners.push({type,listener,capture});}};
  for(const id of ["completeSeason","confirmSeasonCompletion","editSeasonResults"])document.getElementById(id).tagName="BUTTON";
  const fire=(type,id)=>{const target=document.getElementById(id);for(const entry of listeners)if(entry.type===type&&entry.capture===true)entry.listener({target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});};
  return {document,fire};
}

// ---- Season results (QoL 3): the real js/storage.js and the real js/productionSharedSeasonResults.js in one page context ----
function openSeasonPage(device,{rivalry=RIVALRY,season=2,role="playerOne",ownResult=null,onPublish=null}={}){
  const {document,fire}=makeDocument();
  const store={revision:ownResult?1:0,ownResult};
  const projection=()=>({ok:true,authoritative:true,managerRole:role,seasonNumber:season,revision:store.revision,state:store.ownResult?{phase:"COLLECTING",revision:store.revision,publishedRoles:[role]}:null,ownResult:store.ownResult?{...store.ownResult}:null,opponentResult:null,allResults:null});
  const provider={read:async()=>projection(),publishResult:async options=>{store.ownResult={...options.result};store.revision+=1;if(onPublish)onPublish();return {...projection(),status:"accepted",replayed:false};}};
  let random=0;
  const sandbox={console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,localStorage:device.localStorage,
    __showdown:{id:"save_"+"e".repeat(24),currentRound:season,totalRounds:3,managers:{playerOne:"Daniel",playerTwo:"Nik"},clubs:{playerOne:"A",playerTwo:"B"},sharedJourney:{contractVersion:1,mode:"shared",rivalryId:rivalry}},
    document,
    crypto:{getRandomValues(bytes){for(let i=0;i<bytes.length;i+=1)bytes[i]=(random+i)&255;random+=1;return bytes;}},
    reportApplicationError(){},
    ensureGameplayModules:async()=>true,
    loadRuntimeScript:async key=>{throw new Error(`unexpected runtime load ${key}`);},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>true,getState:()=>({ready:true,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:"premier_league",clubs:{playerOne:"A",playerTwo:"B"}},managerRole:role,rivalryId:rivalry,sessionId:SESSION,deviceId:DEVICE})},
    CareerModeProductionSharedTransferChallenge:{refresh:async()=>true,getState:()=>({seasonNumber:season,state:{phase:"COMPLETED"}})},
    CareerModeSharedShowdownCatalog:{catalog:{premier_league:new Array(20).fill("club")}},
    CareerModeSharedShowdownSetup:{},CareerModeSharedSeasonResults:{},CareerModeSparkSharedSeasonResults:provider,
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid"}},firestore:{},firestoreSdk:{}})}};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read("js/storage.js"),sandbox,{filename:"js/storage.js"});
  vm.runInContext(`var currentShowdown=globalThis.__showdown;\n${read("js/productionSharedSeasonResults.js")}`,sandbox,{filename:"js/productionSharedSeasonResults.js"});
  const api=sandbox.CareerModeProductionSharedSeasonResults;
  assert.equal(api.install(),true);
  const prefix=role==="playerOne"?"p1":"p2";
  const field=suffix=>document.getElementById(`${prefix}${suffix}`);
  const type=(suffix,value)=>{field(suffix).value=String(value);fire("input",`${prefix}${suffix}`);};
  const check=(suffix,on)=>{field(suffix).checked=Boolean(on);fire("input",`${prefix}${suffix}`);fire("change",`${prefix}${suffix}`);};
  const click=id=>{fire("click",id);};
  return {api,document,field,type,check,click,fire,prefix,sandbox};
}
const season1Key=(role="playerOne",rivalry=RIVALRY,season=2)=>`cms.draft.v1:${rivalry}:${season}:${role}:seasonResult`;
const formValues=page=>["LeaguePosition","LeaguePoints","LeagueGoals"].map(suffix=>page.field(suffix).value).concat(["DomesticCup","ChampionsLeague","TopScorer","TopAssist"].map(suffix=>page.field(suffix).checked));

async function seasonScenarios(){
  const device=makeDevice();
  // Q1: a half-typed form (position, points and one tick; goals left empty) is saved for the own role and season only.
  const first=openSeasonPage(device);
  await first.api.refresh();
  first.type("LeaguePosition",7);first.type("LeaguePoints",55);first.check("TopScorer",true);
  assert.deepEqual(device.drafts(),[season1Key()],"Q1 exactly one draft: own role, this rivalry, this season");
  const saved=JSON.parse(device.store.get(season1Key()));
  assert.deepEqual(saved,{version:1,rivalryId:RIVALRY,seasonNumber:2,role:"playerOne",values:{LeaguePosition:"7",LeaguePoints:"55",LeagueGoals:""},checks:{DomesticCup:false,ChampionsLeague:false,TopScorer:true,TopAssist:false}});
  assert.equal(first.document.getElementById("p2LeaguePosition").value,"","Q1 the rival's form is untouched");
  assert.equal(JSON.stringify(saved).includes("playerTwo"),false);
  ok("Q1 typing half a season result saves one draft for this manager, rivalry and season");

  // Q2: reload = new page, same device storage.
  const reloaded=openSeasonPage(device);
  assert.deepEqual(formValues(reloaded),["","","",false,false,false,false],"Q2 a fresh page starts empty");
  await reloaded.api.refresh();
  assert.deepEqual(formValues(reloaded),["7","55","",false,false,true,false],"Q2 the half-typed result is back after the reload");
  assert.equal(reloaded.document.getElementById("p2LeaguePosition").value,"","Q2 nothing is restored into the rival's form");
  assert.equal(reloaded.document.getElementById("p2TopScorer").checked,false);
  ok("Q2 a reload restores the typed values and the ticked boxes");

  // Q3: later polls keep what the player typed; Q4: an emptied form leaves no draft.
  reloaded.type("LeaguePosition",3);
  await reloaded.api.refresh();await reloaded.api.refresh();
  assert.equal(reloaded.field("LeaguePosition").value,"3","Q3 a poll never overwrites typed input with the saved draft");
  assert.equal(JSON.parse(device.store.get(season1Key())).values.LeaguePosition,"3");
  reloaded.type("LeaguePosition","");reloaded.type("LeaguePoints","");reloaded.check("TopScorer",false);
  assert.deepEqual(device.drafts(),[],"Q4 an emptied form removes its draft");
  ok("Q3 polls never overwrite typed input; Q4 clearing the form removes the draft");

  // Q5: other season, role, rivalry and corrupt drafts are not restored.
  const stray=makeDevice();
  const body=(rivalry,season,role)=>JSON.stringify({version:1,rivalryId:rivalry,seasonNumber:season,role,values:{LeaguePosition:"9",LeaguePoints:"9",LeagueGoals:"9"},checks:{DomesticCup:true,ChampionsLeague:true,TopScorer:true,TopAssist:true}});
  stray.store.set(season1Key("playerOne",RIVALRY,3),body(RIVALRY,3,"playerOne"));
  stray.store.set(season1Key("playerTwo",RIVALRY,2),body(RIVALRY,2,"playerTwo"));
  stray.store.set(season1Key("playerOne",OTHER_RIVALRY,2),body(OTHER_RIVALRY,2,"playerOne"));
  stray.store.set(season1Key("playerOne",RIVALRY,2),"{not json");
  const clean=openSeasonPage(stray);await clean.api.refresh();
  assert.deepEqual(formValues(clean),["","","",false,false,false,false],"Q5 only this manager's own draft for this season can be restored");
  stray.store.set(season1Key("playerOne",RIVALRY,2),body(OTHER_RIVALRY,2,"playerOne"));
  const mismatched=openSeasonPage(stray);await mismatched.api.refresh();
  assert.deepEqual(formValues(mismatched),["","","",false,false,false,false],"Q5 a draft whose own header names another rivalry is ignored");
  const asTwo=openSeasonPage(stray,{role:"playerTwo"});await asTwo.api.refresh();
  assert.equal(asTwo.field("LeaguePosition").value,"9","Q5 Nik's device restores Nik's own draft");
  assert.equal(asTwo.document.getElementById("p1LeaguePosition").value,"","Q5 and never the other manager's");
  ok("Q5 another season, role or rivalry, and a corrupt draft, are never restored");

  // Q6: publishing removes the draft (and a later reload shows the published review, not a stale form).
  const live=makeDevice();
  const writer=openSeasonPage(live);await writer.api.refresh();
  writer.type("LeaguePosition",2);writer.type("LeaguePoints",70);writer.type("LeagueGoals",66);writer.check("DomesticCup",true);
  assert.deepEqual(live.drafts(),[season1Key()]);
  writer.click("completeSeason");
  assert.equal(writer.document.getElementById("seasonEntry").dataset.sharedSeasonResults,"review");
  assert.deepEqual(live.drafts(),[season1Key()],"Q6 reviewing is not publishing: the draft stays until the publish succeeds");
  writer.click("confirmSeasonCompletion");
  const started=Date.now();
  while(Date.now()-started<4000&&!writer.api.getState()?.ownResult)await new Promise(resolve=>setTimeout(resolve,10));
  await new Promise(resolve=>setTimeout(resolve,50));
  assert.ok(writer.api.getState()?.ownResult,"Q6 the result was published");
  assert.deepEqual(live.drafts(),[],"Q6 the draft is gone once the result is published");
  const afterPublish=openSeasonPage(live,{ownResult:{leaguePosition:2,leaguePoints:70,leagueGoals:66,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false}});
  await afterPublish.api.refresh();
  assert.deepEqual(live.drafts(),[],"Q6 a reload after publishing does not bring a draft back");
  // A draft left over from another device is dropped as soon as the shared result exists.
  live.store.set(season1Key(),body(RIVALRY,2,"playerOne"));
  const late=openSeasonPage(live,{ownResult:{leaguePosition:2,leaguePoints:70,leagueGoals:66,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false}});
  await late.api.refresh();
  assert.deepEqual(live.drafts(),[],"Q6 an already-published result removes a leftover draft");
  ok("Q6 publishing removes the draft, and a published result never restores one");
}

// ---- Transfer guesses (QoL 6): the real guess-draft helpers from js/productionSharedTransferChallenge.js ----
function guessHarness(device){
  const source=read("js/productionSharedTransferChallenge.js");
  const start=source.indexOf("  // QoL 6:"),end=source.indexOf("  function pstcDisableRole(");
  assert.ok(start>0&&end>start,"the guess draft block must exist");
  const block=source.slice(start,end);
  const nodes=new Map();
  const field=id=>{if(!nodes.has(id))nodes.set(id,{id,value:"",dataset:{},disabled:true});return nodes.get(id);};
  const labels={league:{"england-premier-league":"English Premier League (EPL)","spain-primera-division":"Spanish Primera División"},nationality:{england:"England",spain:"Spain"}};
  const timers=[];
  const sandbox={
    root:{setTimeout:fn=>{timers.push(fn);return timers.length;}},
    pstcSharedMarker:()=>true,
    pstcReplayPhase:()=>replay,
    pstcGuessPrefix:role=>role==="playerOne"?"p2":"p1",
    pstcField:field,
    pstcCanonical:input=>input?.dataset?.canonicalId||"",
    pstcSetSelector(input,kind,id){const label=labels[kind]?.[id];if(label){input.value=label;input.dataset.canonicalId=id;}else{input.value=String(id||"");delete input.dataset.canonicalId;}},
    pstcSyncGuessValue(typeNode,valueNode,editable){valueNode.disabled=!editable||!typeNode.value;},
    pstcRequestContext:()=>request,
    URL,RegExp,Number,String,Array,JSON
  };
  let replay=null,request={key:"k",rivalryId:RIVALRY,seasonNumber:2};
  // The page globals the draft helpers use are the real storage.js ones, in a page context with this device's storage.
  const page={console:{log(){},warn(){},error(){}},localStorage:device.localStorage};page.window=page;page.globalThis=page;vm.createContext(page);
  vm.runInContext(read("js/storage.js"),page,{filename:"js/storage.js"});
  for(const name of ["readStorageValue","writeStorageValue","removeStorageValue"])sandbox.root[name]=page[name];
  vm.createContext(sandbox);
  const api=vm.runInContext(`let view=null;\n${block}\n({save:pstcSaveGuessDraft,restore:pstcRestoreGuessDraft,clear:pstcClearGuessDraft,change:pstcGuessDraftChange,remove:pstcRemoveGuessDraft,ref:pstcGuessDraftRef,setView:value=>{view=value;}})`,sandbox,{filename:"guess-draft-block.js"});
  return {api,field,labels,timers,setReplay:value=>{replay=value;},setRequest:value=>{request=value;},drafts:()=>device.drafts()};
}
const guessState=(role,{locked=false,phase="GUESS_ENTRY"}={})=>({managerRole:role,state:{phase,guessLockedRoles:locked?[role]:[],signingLockedRoles:[]}});
const guessKey=(role="playerOne",rivalry=RIVALRY,season=2)=>`cms.draft.v1:${rivalry}:${season}:${role}:transferGuess`;

function guessScenarios(){
  const device=makeDevice();
  const page=guessHarness(device);
  page.api.setView(guessState("playerOne"));
  // Nik-as-playerOne types against the rival: slot 1 a league picked from the list, slot 2 a half-typed nationality, slot 3 untouched.
  page.field("p2Guess1Type").value="league";page.field("p2Guess1Value").value=page.labels.league["england-premier-league"];page.field("p2Guess1Value").dataset.canonicalId="england-premier-league";
  page.field("p2Guess2Type").value="nationality";page.field("p2Guess2Value").value="Spa";
  assert.equal(page.api.save("playerOne"),true);
  assert.deepEqual(device.drafts(),[guessKey()],"Q7 one own-role guess draft");
  const saved=JSON.parse(device.store.get(guessKey()));
  assert.deepEqual(saved,{version:1,rivalryId:RIVALRY,seasonNumber:2,role:"playerOne",rows:[{slot:1,type:"league",valueId:"england-premier-league",value:"English Premier League (EPL)"},{slot:2,type:"nationality",valueId:"",value:"Spa"}]},"Q7 only the filled guess slots are saved, nothing of the signings or the rival");
  ok("Q7 typing guesses saves the filled slots for this manager, rivalry and season");

  // Reload: fresh empty fields + same storage.
  const reloaded=guessHarness(device);
  reloaded.api.setView(guessState("playerOne"));
  assert.equal(reloaded.api.restore("playerOne",{guesses:null,signings:null}),true);
  assert.deepEqual([1,2,3].map(slot=>[reloaded.field(`p2Guess${slot}Type`).value,reloaded.field(`p2Guess${slot}Value`).value,reloaded.field(`p2Guess${slot}Value`).dataset.canonicalId||""]),
    [["league","English Premier League (EPL)","england-premier-league"],["nationality","Spa",""],["","",""]],"Q7 a reload brings the guesses back, the picked league with its canonical id");
  assert.equal(reloaded.field("p2Guess1Value").disabled,false,"Q7 a restored guess can be edited straight away");
  assert.equal(reloaded.field("p1Guess1Type").value,"","Q7 the rival-side guess fields are untouched");
  // A poll does not overwrite what is already on screen.
  reloaded.field("p2Guess2Value").value="Spain";reloaded.field("p2Guess2Value").dataset.canonicalId="spain";
  reloaded.api.restore("playerOne",{guesses:null});
  assert.equal(reloaded.field("p2Guess2Value").value,"Spain","Q7 restore only fills guess slots that are still empty");
  ok("Q7 a reload restores the half-typed guesses without overwriting anything on screen");

  // Locked, already-recorded, other season or role, and the wrong phase never restore; they drop the stale draft.
  const fresh=guessHarness(device);
  fresh.api.setView(guessState("playerOne",{locked:true}));
  assert.equal(fresh.api.restore("playerOne",{guesses:null}),false);
  assert.deepEqual(device.drafts(),[],"Q7 a locked role removes its draft");
  device.store.set(guessKey(),saved&&JSON.stringify(saved));
  const withRows=guessHarness(device);withRows.api.setView(guessState("playerOne"));
  assert.equal(withRows.api.restore("playerOne",{guesses:[{slot:1,type:"league",valueId:"england-premier-league"}]}),false);
  assert.deepEqual(device.drafts(),[],"Q7 guesses already recorded by the shared challenge win over a draft");
  device.store.set(guessKey("playerOne",RIVALRY,3),JSON.stringify({...saved,seasonNumber:3}));
  device.store.set(guessKey("playerTwo",RIVALRY,2),JSON.stringify({...saved,role:"playerTwo"}));
  device.store.set(guessKey("playerOne",OTHER_RIVALRY,2),JSON.stringify({...saved,rivalryId:OTHER_RIVALRY}));
  const other=guessHarness(device);other.api.setView(guessState("playerOne"));
  assert.equal(other.api.restore("playerOne",{guesses:null}),false,"Q7 only the exact rivalry, season and role are read");
  assert.equal(other.field("p2Guess1Type").value,"");
  const signingPhase=guessHarness(device);signingPhase.api.setView(guessState("playerOne",{phase:"SIGNING_ENTRY"}));
  assert.equal(signingPhase.api.save("playerOne"),false,"Q7 nothing is saved outside unlocked guess entry");
  const replay=guessHarness(device);replay.api.setView(guessState("playerOne"));replay.setReplay("WINDOW_OPEN");replay.field("p2Guess1Type").value="league";
  assert.equal(replay.api.save("playerOne"),false,"Q7 a historical replay never writes a draft");
  const wrongRole=guessHarness(device);wrongRole.api.setView(guessState("playerOne"));wrongRole.field("p1Guess1Type").value="league";
  assert.equal(wrongRole.api.save("playerTwo"),false,"Q7 a manager can only save their own guesses");
  for(const key of device.drafts())device.store.delete(key);

  // clearing the slots removes the draft; the lock removes it; a season change removes the previous one.
  const lifecycle=guessHarness(device);lifecycle.api.setView(guessState("playerOne"));
  lifecycle.field("p2Guess1Type").value="league";
  assert.equal(lifecycle.api.save("playerOne"),true);assert.deepEqual(device.drafts(),[guessKey()]);
  lifecycle.field("p2Guess1Type").value="";
  assert.equal(lifecycle.api.save("playerOne"),true);assert.deepEqual(device.drafts(),[],"Q7 an emptied guess form removes its draft");
  lifecycle.field("p2Guess1Type").value="league";lifecycle.api.save("playerOne");
  lifecycle.api.clear("playerOne");
  assert.deepEqual(device.drafts(),[],"Q7 locking (clear) removes the draft");
  lifecycle.field("p2Guess1Type").value="league";lifecycle.api.save("playerOne");
  lifecycle.api.change({target:{id:"p2Guess1Value"}});
  assert.equal(lifecycle.timers.length,1,"Q7 typing re-saves once the selector has set its canonical id");
  lifecycle.api.change({target:{id:"p1Guess1Value"}});lifecycle.api.change({target:{id:"p2Signing1Name"}});
  assert.equal(lifecycle.timers.length,1,"Q7 typing in the rival-side guess fields or in signings does not touch the guess draft");
  ok("Q7 locking, emptying, a locked role, recorded guesses, other contexts and replay all leave no stale or foreign guess draft");
}

// ---- Showdown end + wiring ----
async function sweepScenario(){
  const device=makeDevice();
  const page={console:{log(){},warn(){},error(){}},localStorage:device.localStorage};page.window=page;page.globalThis=page;vm.createContext(page);
  vm.runInContext(read("js/storage.js"),page,{filename:"js/storage.js"});
  const keep=[`cms.draft.v1:${OTHER_RIVALRY}:1:playerOne:seasonResult`,`cms.signingDraft.v1:${RIVALRY}:1:playerOne`,"careerModeShowdown.preferences","cms.v10.ui"];
  keep.forEach(key=>device.store.set(key,"x"));
  for(const season of [1,2,3])for(const role of ["playerOne","playerTwo"])for(const kind of ["seasonResult","transferGuess"])device.store.set(`cms.draft.v1:${RIVALRY}:${season}:${role}:${kind}`,"{}");
  assert.equal(device.drafts().length,13);
  assert.equal(page.clearDraftsForRivalry(RIVALRY),true);
  assert.deepEqual(device.drafts(),[`cms.draft.v1:${OTHER_RIVALRY}:1:playerOne:seasonResult`],"Q8 every draft of the ended rivalry is gone");
  assert.deepEqual(keep.filter(key=>!device.store.has(key)),[],"Q8 other rivalries, signing drafts, preferences and saves are untouched");
  const terminal=read("js/productionSharedTerminalClose.js");
  assert.match(terminal,/state=ptcFreeze\(next\);stateContextKey=request\.key;ptcRender\(\);\s*\/\/ QoL 3\+6[^\n]*\n\s*if\(state\.phase==="CLOSED"&&typeof root\.clearDraftsForRivalry==="function"\)\{try\{root\.clearDraftsForRivalry\(state\.rivalryId\|\|request\.rivalryId\);\}catch\(_error\)\{\}\}/,"Q8 a CLOSED Showdown sweeps the drafts of its rivalry");
  ok("Q8 the Showdown ending sweeps that rivalry's drafts and nothing else");
}

function wiringChecks(){
  const results=read("js/productionSharedSeasonResults.js"),transfer=read("js/productionSharedTransferChallenge.js"),storage=read("js/storage.js"),terminal=read("js/productionSharedTerminalClose.js");
  for(const [name,source] of [["Season Results",results],["Transfer Challenge",transfer],["Terminal Close",terminal]]){
    assert.equal(/\blocalStorage\b/.test(source),false,`${name} reaches browser storage only through the js/storage.js helpers`);
    assert.equal(/\bsessionStorage\b/.test(source),false,`${name} never uses sessionStorage`);
  }
  assert.equal(/\bsessionStorage\b/.test(storage),false,"storage.js never uses sessionStorage");
  assert.ok(results.includes("root.writeStorageValue(key,JSON.stringify")&&results.includes("root.readStorageValue(key)")&&results.includes("root.removeStorageValue(key)"));
  assert.ok(transfer.includes("root.writeStorageValue(pstcGuessDraftKey(ref),JSON.stringify")&&transfer.includes("root.removeStorageValue(key)"));
  assert.ok(results.includes("`cms.draft.v1:${request.rivalryId}:${request.seasonNumber}:${role}:seasonResult`"),"season key: rivalry, season, role");
  assert.ok(transfer.includes("`cms.draft.v1:${ref.rivalryId}:${ref.seasonNumber}:${ref.role}:transferGuess`"),"guess key: rivalry, season, role");
  // Season result: restore only in the editable entry state, clear on a published or ready result and on publish.
  assert.ok(results.includes("pssrEntryMode(false);pssrHidden(pssrCard(role),false);pssrHidden(pssrCard(other),true);pssrDraftRestore(role);"));
  assert.ok(results.includes("if(own||ready){pssrDraftClear(role);"));
  assert.equal((results.match(/pssrDraftClear\(publishRole,request\);view=\{/g)||[]).length,2,"both publish outcomes clear the draft");
  assert.ok(results.includes('root.document.addEventListener("input",pssrDraftChange,true)')&&results.includes('root.document.addEventListener("change",pssrDraftChange,true)'));
  assert.ok(results.includes("pssrDraftFieldIds(role).includes(id)"),"only the manager's own result fields save a draft");
  // Guesses: restore only in live unlocked guess entry, clear once locked or past guess entry, and when the lock succeeds.
  assert.ok(transfer.includes('if(method==="lockGuesses")pstcClearGuessDraft(view.managerRole);'));
  assert.ok(transfer.includes('if(actualPhase==="SIGNING_ENTRY"||actualPhase==="COMPLETED"||(actualPhase==="GUESS_ENTRY"&&state?.guessLockedRoles?.includes(role)))pstcClearGuessDraft(role);else if(actualPhase==="GUESS_ENTRY"&&!isReplay)pstcRestoreGuessDraft(role,own);'));
  assert.ok(transfer.includes('root.document.addEventListener("input",pstcGuessDraftChange,true);root.document.addEventListener("change",pstcGuessDraftChange,true);'));
  assert.ok(transfer.includes("pstcGuessDraftRef&&guessRef&&!pstcSameGuessDraftRef(guessDraftRef,guessRef)")||transfer.includes("guessDraftRef&&guessRef&&!pstcSameGuessDraftRef(guessDraftRef,guessRef)"),"a rivalry, season or role change removes the previous guess draft");
  // Scoring, rules and text: the lock payload and the publish payload are built exactly as before.
  assert.ok(transfer.includes("rows.push({slot:i,type:kind,valueId:id});"));
  assert.ok(results.includes("pssrFingerprint(currentResult)!==draft.fingerprint"));
  // storage.js adds one small sweep and exports it; the existing generic read/write/remove helpers carry the drafts.
  assert.match(storage,/function clearDraftsForRivalry\(id\)\{try\{Object\.keys\(localStorage\)\.filter\(key=>key\.startsWith\(`cms\.draft\.v1:\$\{id\}:`\)\)/);
  assert.ok(storage.includes("window.clearDraftsForRivalry=clearDraftsForRivalry;"));
  ok("Q9 drafts go through the js/storage.js helpers only, never sessionStorage, keyed by rivalry, season and role, cleared on publish, lock and Showdown end");
}

(async()=>{
  await seasonScenarios();
  guessScenarios();
  await sweepScenario();
  wiringChecks();
  console.log(`PASS QoL 3+6 keep-drafts contracts: ${checks} checks.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
