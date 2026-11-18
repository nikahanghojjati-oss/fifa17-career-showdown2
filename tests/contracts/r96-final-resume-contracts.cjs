"use strict";
// r96 F3 (Fable hunt of 2.8.0, finding F3; also in 2.7.0): a phone whose tab dies right after its final CONFIRM SEASON and that
// is opened again within seconds resumes into the still-live Showdown (the reload resume or Home's CONTINUE SHOWDOWN: the pair's
// "continuing"). When the other phone's automatic close lands during that entry, the page used to stay on Home (WAITING FOR
// DANIEL) or on Remote Joining ("Waiting for Daniel"), because the close was only followed on game screens. Reproduced on demand
// with CE2PG (1 season, killed tab on the final season, the reopened tab's Firestore slowed 1.5 s / 3 s while Daniel's close
// lands). This contract drives js/productionSharedJourneyEntry.js with the pair and Terminal Close as stand-ins: once the page
// learns the Showdown it was entering has closed, it opens the Showdown Champion (Season Results' host, which draws Final Winner),
// with at most one Terminal Close read, never on a game screen, never for a Showdown ended early, once per Showdown.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const ENTRY=process.env.R96_ENTRY_FILE?fs.readFileSync(process.env.R96_ENTRY_FILE,"utf8"):read("js/productionSharedJourneyEntry.js");
const R="pair_"+"d".repeat(64),OTHER="pair_"+"e".repeat(64);
let passed=0;const ok=(id,label)=>{passed++;console.log(`ok   ${id} ${label}`);};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function settle(){for(let i=0;i<12;i++)await tick();}

// One page: Home is up (mainMenu), signed in, the save of Showdown R on this phone. tc = what Terminal Close answers.
function page({tc="CLOSED",tcHeld=null,screen="mainMenu",championPending="",pairInit=null}={}){
  const calls={nav:[],refresh:0,rjClose:0,connectClose:0,errors:[],liveDropped:0};
  const listeners={doc:new Map(),win:new Map()};
  const on=(map,type,fn)=>{if(!map.has(type))map.set(type,[]);map.get(type).push(fn);};
  const pairListeners=new Set();let pairState=pairInit||{initialized:true,status:"paired",busy:false,rivalryId:R,connectionState:"active",closedRivalryId:null,closedProviderSaveId:null};
  let tcState=tcHeld;let active=screen;const storage=new Map();if(championPending)storage.set("cms.championPending.v1",championPending);
  const overlay={classList:{contains:c=>c==="hidden",add(){},remove(){}}};
  const ctx={console,setTimeout,clearTimeout,Promise,Date,Set,Map,JSON,Object,Error,
    document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),documentElement:{},addEventListener:(t,f)=>on(listeners.doc,t,f)},
    MutationObserver:class{observe(){}},
    addEventListener:(t,f)=>on(listeners.win,t,f),
    sessionStorage:{getItem:()=>null,setItem(){},removeItem:key=>{if(key==="careerModeShowdown.liveGame.v1")calls.liveDropped++;}},
    readStorageValue:key=>storage.has(key)?storage.get(key):null,removeStorageValue:key=>storage.delete(key),writeStorageValue:(k,v)=>storage.set(k,v),
    getActiveScreenName:()=>active,
    ensureSaveLibraryRuntimeAuthority:async()=>true,ensureGameplayModules:async()=>true,
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>({activeSaveId:"save_"+"1".repeat(24),saves:[]})},
    loadSavedShowdown:()=>({sharedJourney:{mode:"shared",rivalryId:R}}),
    CareerModeSparkConnectedRivalry:{initialize:async()=>true,getState:()=>({attached:true,rivalryId:R})},
    CareerModeProductionSharedSeasonResults:{},
    CareerModeSparkRemoteJoining:{closePanel:()=>{calls.rjClose++;return true;}},
    CareerModeConnectPlayersScreenV10:{close:()=>{calls.connectClose++;return true;}},
    CareerModePersistentNikDanielPair:{subscribe:fn=>{pairListeners.add(fn);return()=>pairListeners.delete(fn);},getState:()=>pairState},
    CareerModeProductionSharedTerminalClose:{install(){},getState:()=>tcState,refresh:async()=>{calls.refresh++;tcState=tc==="CLOSED"?{phase:"CLOSED",terminal:true,rivalryId:R}:tc==="DELETED"?{phase:"DELETED",terminal:false,deleted:true,rivalryId:R}:null;return tcState;}},
    navigateTo:async id=>{calls.nav.push(id);active=id;for(const f of listeners.doc.get("career-mode-screen-shown")||[])f();return true;},
    reportApplicationError:(c,e)=>calls.errors.push(`${c}: ${e&&e.message}`)};
  ctx.globalThis=ctx;vm.createContext(ctx);
  vm.runInContext("var currentShowdown=null;",ctx);// the app's classic-script global
  vm.runInContext(ENTRY,ctx,{filename:"productionSharedJourneyEntry.js"});
  const entry=ctx.CareerModeProductionSharedJourneyEntry;entry.install();
  return {calls,entry,storage,ctx,
    pair(next){pairState={...pairState,...next};for(const f of [...pairListeners])f(pairState);},
    tcEvent(state){tcState=state;for(const f of listeners.win.get("career-mode-shared-terminal-close-state-change")||[])f({detail:{phase:state.phase,rivalryId:state.rivalryId}});},
    show(id){active=id;for(const f of listeners.doc.get("career-mode-screen-shown")||[])f();}};
}
const closedPair={status:"unpaired",rivalryId:null,connectionState:null,closedRivalryId:R,closedProviderSaveId:"save_"+"1".repeat(24)};

(async()=>{
  // F3-1 the hunt's failure: reopened tab continuing, the close lands, the pair lets the Showdown go while Home (and Remote
  // Joining's wait) is up. The page must open the Champion screen, with one Terminal Close read.
  {
    const p=page();
    p.pair({status:"continuing",busy:true});p.pair({status:"paired",busy:false});
    p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,["seasonEntry"],"the Showdown Champion (Season Results' host) opens instead of Home staying up");
    assert.equal(p.calls.rjClose,1,"Remote Joining's wait for the closed session is taken down first");
    assert.equal(p.calls.refresh,1,"one Terminal Close read, on this path only");
    assert.deepEqual(p.calls.errors,[]);
    ok("F3-1","a close landing while the reopened tab is still entering the Showdown opens Final Winner, not Home or Remote Joining");
  }
  // F3-2 the close reaches this page through Terminal Close first (its own read or the rivalry listener): no second read.
  {
    const p=page();
    p.pair({status:"continuing",busy:true});p.pair({status:"paired",busy:false});
    p.tcEvent({phase:"CLOSED",terminal:true,rivalryId:R});await settle();
    assert.deepEqual(p.calls.nav,["seasonEntry"]);assert.equal(p.calls.refresh,0,"already CLOSED here: no read");
    p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,["seasonEntry"],"once per Showdown: the pair's later news opens nothing again");assert.equal(p.calls.refresh,0);
    ok("F3-2","Terminal Close's own CLOSED also opens it, with no read, and only once");
  }
  // F3-3 ended early (the other phone's END: DELETED, no finish witness): no Champion screen; Home stays.
  {
    const p=page({tc:"DELETED"});
    p.pair({status:"continuing",busy:true});p.pair({status:"paired",busy:false});
    p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,[],"an ended-early Showdown never shows a Champion screen");assert.equal(p.calls.refresh,1);
    ok("F3-3","a Showdown ended early keeps Home (no Final Winner made up)");
  }
  // F3-4 the entry already reached a game screen (it got into the Showdown before the close): the game screens own the close.
  {
    const p=page();
    p.pair({status:"continuing",busy:true});p.pair({status:"paired",busy:false});
    p.show("seasonEntry");p.show("mainMenu");
    p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,[],"an entry that reached the game is not followed here");assert.equal(p.calls.refresh,0);
    ok("F3-4","only an entry that never got past Home is followed");
  }
  // F3-5 the player moved on (another screen) before the close: nothing is taken over.
  {
    const p=page();
    p.pair({status:"continuing",busy:true});p.pair({status:"paired",busy:false});
    p.show("standings");
    p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,[]);assert.equal(p.calls.refresh,0);
    ok("F3-5","a page the player took elsewhere is left alone");
  }
  // F3-6 no entry on this page (Home just shows a Showdown that closed elsewhere): nothing new, no read.
  {
    const p=page();
    p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,[]);assert.equal(p.calls.refresh,0);assert.equal(p.calls.rjClose,0);
    ok("F3-6","without an entry in flight Home behaves as before (no read, no navigation)");
  }
  // F3-7 another Showdown closing (not the one being entered) is not followed.
  {
    const p=page();
    p.pair({status:"continuing",busy:true});p.pair({status:"paired",busy:false});
    p.pair({...closedPair,closedRivalryId:OTHER});await settle();
    assert.deepEqual(p.calls.nav,[]);assert.equal(p.calls.refresh,0);
    ok("F3-7","only the Showdown this page was entering");
  }
  // F3-8 the reload resume after the close (F1, cms.championPending.v1) is unchanged: same one read, same Champion screen.
  {
    const p=page({championPending:R});
    assert.equal(p.entry.championAfterClose(closedPair),true);await settle();
    assert.deepEqual(p.calls.nav,["seasonEntry"]);assert.equal(p.calls.refresh,1);
    const q=page({championPending:R,tc:"DELETED"});
    assert.equal(q.entry.championAfterClose(closedPair),true);await settle();
    assert.deepEqual(q.calls.nav,[],"DELETED: no Champion screen, Home stays, as before");assert.equal(q.storage.has("cms.championPending.v1"),false,"and the note is forgotten");
    ok("F3-8","F1's reload-after-close path keeps its behaviour");
  }
  // F3-9 no new Firebase surface: the entry still names no Firestore path and writes nothing.
  {
    assert.doesNotMatch(ENTRY,/\b(?:setDoc|updateDoc|addDoc|runTransaction|writeBatch)\b/);
    assert.match(ENTRY,/const ENTRY_CLOSE_WINDOW_MS=180000;/);
    ok("F3-9","no write and no new read path in the entry; the follow window is bounded");
  }
  // F3-10 the final season's own confirm tap notes the Champion as due before any write (a tab killed 300 ms after CONFIRM
  // SEASON had often not reached the later note, so the reopened tab never resumed). Last season or a sacking only.
  {
    const commit=read("js/productionSharedSeasonCommit.js");
    const body=commit.match(/  function psscMarkChampionDueIfFinal\(request\)\{[\s\S]*?\n  \}\n/);
    assert.ok(body,"psscMarkChampionDueIfFinal exists");
    assert.match(commit,/async function psscMutate\(kind\)\{\n    if\(busy\)return false;const request=psscRequestContext\(\);if\(!request\)return false;psscMarkChampionDueIfFinal\(request\);busy=true;/,"noted at the tap, before the commit or acknowledgement write");
    const run=({season,total,own=null,opp=null,held=""})=>{const store=new Map();if(held)store.set("cms.championPending.v1",held);
      const sandbox={root:{writeStorageValue:(k,v)=>store.set(k,v),readStorageValue:k=>store.has(k)?store.get(k):null},psscSetupState:()=>({setup:{totalSeasons:total}}),psscResultsState:()=>({ownResult:own,opponentResult:opp})};
      vm.createContext(sandbox);const fn=vm.runInContext(`(${body[0].trim()})`,sandbox);return {out:fn({rivalryId:R,seasonNumber:season}),note:store.get("cms.championPending.v1")||""};};
    assert.deepEqual(run({season:3,total:3}),{out:true,note:R},"the last season");
    assert.deepEqual(run({season:1,total:1}),{out:true,note:R},"a 1-season Showdown");
    assert.deepEqual(run({season:2,total:3}),{out:false,note:""},"not before the last season");
    assert.deepEqual(run({season:2,total:10,opp:{sacked:true}}),{out:true,note:R},"a sacking (either manager) ends the Showdown after this season");
    assert.deepEqual(run({season:2,total:10,own:{sacked:true}}),{out:true,note:R});
    assert.deepEqual(run({season:2,total:3,held:OTHER}),{out:false,note:OTHER},"an older note is left alone mid-Showdown");
    assert.deepEqual(run({season:3,total:3,held:OTHER}),{out:true,note:R},"the final tap replaces an older Showdown's note");
    ok("F3-10","the final season's confirm tap notes the Champion as due (last season or a sacking), before any write");
  }
  // ---- r96 F3b (Sol 6.2 SS-01): a same-tab refresh at the first ACKNOWLEDGED of the final season. The fresh page reads the
  // pair as live (status "paired", never "continuing") and the close lands straight after: the Champion screen must open.
  // F3-11 the close reaches the fresh page through the pair (its listener or the resume's own pair read): Final Winner, one read.
  {
    const p=page({championPending:R});
    p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,["seasonEntry"],"a live-then-closed pair on a fresh page with the Champion due opens Final Winner");
    assert.equal(p.calls.refresh,1,"one Terminal Close read, on this path only");
    assert.equal(p.calls.rjClose,1,"any Remote Joining wait is taken down first");
    assert.equal(p.calls.liveDropped,1,"the live-game flag (js/ssjr.js's loading screen) goes once the Champion screen is up");
    assert.deepEqual(p.calls.errors,[]);
    ok("F3-11","SS-01: paired then closed with no continuing between, on a fresh page with the Champion due, opens Final Winner");
  }
  // F3-12 the reload resume's own read already came back closed (js/onlinePlayerIdentity.js openCanonicalCareerContinue asks
  // before START): the Champion run takes over and is shared, never run twice.
  {
    const p=page({championPending:R,pairInit:{initialized:true,busy:false,...closedPair}});
    const run=p.entry.championTakingOver(closedPair);
    assert.ok(run&&typeof run.then==="function","the Champion screen takes over the resume (START's Waiting for Daniel never opens)");
    assert.equal(p.entry.championTakingOver(closedPair),run,"asked again: the same run");
    assert.equal(await run,true);await settle();
    assert.deepEqual(p.calls.nav,["seasonEntry"]);assert.equal(p.calls.refresh,1);
    const q=page({championPending:R});q.pair(closedPair);
    const shared=q.entry.championTakingOver(closedPair);assert.ok(shared,"the pair's listener got there first: its run is answered");
    assert.equal(await shared,true);await settle();
    assert.deepEqual(q.calls.nav,["seasonEntry"]);assert.equal(q.calls.refresh,1,"one read in all");
    ok("F3-12","the reload resume hands a closed Showdown to the same single Champion run");
  }
  // F3-13 nothing due on this phone (no final tap here, no note): a closed pair on a fresh page changes nothing.
  {
    const p=page();
    assert.equal(p.entry.championTakingOver(closedPair),null);p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,[]);assert.equal(p.calls.refresh,0);assert.equal(p.calls.rjClose,0);
    ok("F3-13","without the Champion due here, START keeps deciding (no read, no navigation)");
  }
  // F3-14 ended early (DELETED) under the same refresh: no Champion screen, the note is forgotten, the resume lets go.
  {
    const p=page({championPending:R,tc:"DELETED"});
    p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,[]);assert.equal(p.calls.refresh,1);
    assert.equal(p.storage.has("cms.championPending.v1"),false,"the note is forgotten");
    assert.equal(p.ctx.careerModeTabResumeLetGo,true,"the loading screen lets go to Home");
    ok("F3-14","a Showdown ended early never shows a Champion screen on the refresh path either");
  }
  // F3-15 only a fresh page still on Home: once a game screen showed, or for another Showdown, nothing is armed.
  {
    const p=page({championPending:R});
    p.show("seasonEntry");p.show("mainMenu");
    assert.equal(p.entry.championTakingOver(closedPair),null);p.pair(closedPair);await settle();
    assert.deepEqual(p.calls.nav,[]);assert.equal(p.calls.refresh,0);
    const q=page({championPending:R});q.pair({...closedPair,closedRivalryId:OTHER});await settle();
    assert.deepEqual(q.calls.nav,[]);assert.equal(q.calls.refresh,0);
    ok("F3-15","a page that left Home, or another Showdown's close, is left alone");
  }
  // F3-16 the reload resume asks before START (js/onlinePlayerIdentity.js), and only when the fresh read says nothing is live.
  {
    const identity=read("js/onlinePlayerIdentity.js");
    assert.match(identity,/if\(next\?\.connectionState==="active"&&next\.rivalryId\)return pair\.continuePair\(\);[^]*?const champion=root\.CareerModeProductionSharedJourneyEntry\?\.championTakingOver\?\.\(next\);if\(champion\)return Promise\.resolve\(champion\)\.then\(\(\)=>next,\(\)=>next\);[^]*?return openCanonicalStart\(\);/);
    ok("F3-16","openCanonicalCareerContinue hands a closed Showdown to the Champion before START");
  }
  console.log(`PASS r96 final resume contracts (${passed} checks)`);
})().catch(error=>{console.error(error);process.exitCode=1;});
