#!/usr/bin/env node
"use strict";
// Phoenix 3.0 W3 (B3): the shared taps that use the one tap memory (js/sharedTapMemory.js). Real function bodies from each
// screen, evaluated in a sandbox with the real helper and a clock that moves:
//   W1 Season Commit (LOCK & CONFIRM SEASON, CONFIRM SEASON): noted before the write; after a reload the same tap is sent once
//      by itself, only while the read shows this manager's step open; a landed tap, a later season or a second reload never
//   W2 Season Results (CONFIRM MY RESULT): the same result and the same operationId go again once, only while this manager has
//      no result this season; RESULTS_READY or an own result drops it
//   W3 Transfer War (LOCK MY GUESSES / LOCK MY SIGNINGS): only in the same phase with his lock still open; never during the
//      replay; the next phase (the server moved on by its clock) drops it
//   W4 Career Start (I STARTED AT): the same operationId once, only while he is not acknowledged and Career Start is not ready
//   W5 a closed or ended Showdown forgets its notes (Terminal Close); no helper loaded means no note and no resend (as before)
//   W6 no Firestore offline cache and no new read: the resend runs after the screen's own read, the write path is the tap's own
//   W7 a tap answered on the page that made it (landed, refused or failed) is never sent again; an edit of what he tapped drops
//      the note, so a reload after "publish failed, EDIT MY RESULT, change it" never sends the old result (lead review, #1592)
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const HELPER=read("js/sharedTapMemory.js");
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const body=(src,name)=>{const m=new RegExp(`(?:async )?function ${name}\\([^)]*\\)\\{`).exec(src);assert.ok(m,`${name} exists`);let i=m.index+m[0].length,d=1;while(d&&i<src.length){const c=src[i++];if(c==="{")d++;else if(c==="}")d--;}return src.slice(m.index,i);};
const R="pair_"+"a".repeat(64);
// A page: storage that survives a "reload" (a new sandbox over the same Map), timers run on flush().
function sandbox(storage,extra){
  const timers=[];
  const root={readStorageValue:k=>storage.has(k)?storage.get(k):null,writeStorageValue:(k,v)=>{storage.set(k,v);return true;},removeStorageValue:k=>{storage.delete(k);return true;},
    setTimeout:fn=>{timers.push(fn);return timers.length;},crypto:{getRandomValues:a=>{for(let i=0;i<a.length;i++)a[i]=(i*37+11)&255;return a;}}};
  root.globalThis=root;vm.createContext(root);vm.runInContext(HELPER,root);
  const sb={root,console,JSON,Object,Array,Number,String,Boolean,Promise,Error,...extra};
  sb.flush=async()=>{while(timers.length)await timers.shift()();for(let i=0;i<5;i++)await Promise.resolve();};
  return sb;
}

const req=season=>({key:`k${season}`,rivalryId:R,seasonNumber:season});
(async()=>{
// ---- W1 Season Commit
{
  const src=read("js/productionSharedSeasonCommit.js");
  const fns=["psscTapMemory","psscTapMemoryLoad","psscTapScope","psscTapNote","psscTapClear","psscTapPending","psscTapResend"].map(n=>body(src,n)).join("\n");
  assert.match(src,/const PSSC_TAP_STEP=Object\.freeze\(\{commit:"seasonCommit",acknowledge:"seasonAck"\}\);/);
  assert.match(src,/if\(!resend\)psscTapNote\(kind,request\);busy=true;/,"noted before the write, never re-noted by the resend");
  assert.match(src,/psscBind\(result,ctx,request\);psscTapResend\(request\);return view;/,"the resend runs after the screen's own read");
  const page=(storage,view,{ready=true,season=3}={})=>{
    const sb=sandbox(storage,{sent:[]});
    vm.runInNewContext(`const PSSC_TAP_STEP={commit:"seasonCommit",acknowledge:"seasonAck"};let tapMemoryLoading=null,tapResendKey="",busy=false,contextKey="k${season}";let view=${JSON.stringify(view)};
      function psscLoadScript(){return Promise.resolve(root.CareerModeSharedTapMemory);}function psscResultsReady(){return ${ready};}function psscContextMatches(){return true;}
      function psscRandomOperationId(){return "season_commit_op_"+"9".repeat(32);}
      async function psscMutate(kind,opts){sent.push({kind,resend:Boolean(opts&&opts.resend)});}
      ${fns}
      globalThis.api={note:(k,r)=>psscTapNote(k,r),clear:(k,r)=>psscTapClear(k,r),resend:r=>psscTapResend(r)};`,sb);
    return sb;
  };
  const coord={managerRole:"playerOne",coordinatorRole:"playerOne",committed:false,ownAcknowledged:false,phase:"RESULTS_READY"};
  {const storage=new Map();page(storage,coord).api.note("commit",req(3));
    const a=page(storage,coord);assert.equal(a.api.resend(req(3)),true);await a.flush();assert.deepEqual(JSON.parse(JSON.stringify(a.sent)),[{kind:"commit",resend:true}]);
    const b=page(storage,coord);assert.equal(b.api.resend(req(3)),false,"a second reload never sends it a third time");await b.flush();assert.equal(b.sent.length,0);}
  {const storage=new Map();page(storage,coord).api.note("commit",req(3));
    const a=page(storage,{...coord,committed:true});assert.equal(a.api.resend(req(3)),false,"landed: never resent");
    const ack=page(storage,{...coord,committed:true});assert.equal(ack.api.resend(req(3)),false);}
  {const storage=new Map();page(storage,coord).api.note("commit",req(3));
    const a=page(storage,coord,{ready:false});assert.equal(a.api.resend(req(3)),false,"results not ready: not sent (and dropped)");}
  {const storage=new Map();page(storage,{...coord,committed:true}).api.note("acknowledge",req(3));
    const n=page(storage,{...coord,committed:true},{season:4});assert.equal(n.api.resend(req(4)),false,"season 4 never sends season 3's CONFIRM");
    const back=page(storage,{...coord,committed:true});assert.equal(back.api.resend(req(3)),false,"and it was dropped");}
  {const storage=new Map();page(storage,{...coord,managerRole:"playerTwo",committed:true},{season:2}).api.note("acknowledge",req(2));
    const a=page(storage,{...coord,managerRole:"playerTwo",committed:true,ownAcknowledged:false},{season:2});assert.equal(a.api.resend(req(2)),true);await a.flush();assert.equal(a.sent[0].kind,"acknowledge");
    const s2=new Map();page(s2,{...coord,managerRole:"playerTwo",committed:true},{season:2}).api.note("acknowledge",req(2));
    const done=page(s2,{...coord,managerRole:"playerTwo",committed:true,phase:"ACKNOWLEDGED",ownAcknowledged:true},{season:2});assert.equal(done.api.resend(req(2)),false);}
  ok("W1","Season Commit: LOCK & CONFIRM / CONFIRM sent again once after a reload, only while still open, never in the next season or twice");
}
// ---- W2 Season Results
{
  const src=read("js/productionSharedSeasonResults.js");
  const fns=["pssrTapMemory","pssrTapMemoryLoad","pssrTapScope","pssrTapNote","pssrTapClear","pssrTapResend"].map(n=>body(src,n)).join("\n");
  assert.match(src,/draft\.operationId=draft\.operationId\|\|pssrRandomOperationId\(\);draft\.baseRevision=Number\(current\.revision\|\|0\);\n\s*pssrTapNote\(request,publishRole,draft\.operationId,draft\.result\);/,"noted with the operationId just before the write");
  assert.match(src,/if\(resend\)draft=\{contextKey,seasonNumber:view\.seasonNumber,managerRole:view\.managerRole,result:resend\.payload,fingerprint:"",operationId:resend\.operationId,/,"the resend publishes the noted result with the noted operationId");
  const page=(storage,view,season=3)=>{
    const sb=sandbox(storage,{sent:[]});
    vm.runInNewContext(`let tapMemoryLoading=null,tapResendKey="",busy=false,contextKey="k${season}";let view=${JSON.stringify(view)};
      function pssrLoadScript(){return Promise.resolve(root.CareerModeSharedTapMemory);}function pssrContextMatches(){return true;}
      async function pssrPublish(note){sent.push(note);}
      ${fns}
      globalThis.api={note:(r,role,id,res)=>pssrTapNote(r,role,id,res),resend:r=>pssrTapResend(r)};`,sb);
    return sb;
  };
  const OP="season_result_op_"+"1".repeat(32),RES={leaguePosition:2,leaguePoints:80};
  const open={managerRole:"playerTwo",ownResult:null,state:{phase:"COLLECTING"}};
  {const storage=new Map();page(storage,open).api.note(req(3),"playerTwo",OP,RES);
    const a=page(storage,open);assert.equal(a.api.resend(req(3)),true);await a.flush();
    assert.equal(a.sent[0].operationId,OP);assert.deepEqual(JSON.parse(JSON.stringify(a.sent[0].payload)),RES);
    const b=page(storage,open);assert.equal(b.api.resend(req(3)),false);}
  {const storage=new Map();page(storage,open).api.note(req(3),"playerTwo",OP,RES);
    assert.equal(page(storage,{...open,ownResult:RES}).api.resend(req(3)),false,"his result is there: never again");
    const s2=new Map();page(s2,open).api.note(req(3),"playerTwo",OP,RES);
    assert.equal(page(s2,{...open,state:{phase:"RESULTS_READY"}}).api.resend(req(3)),false);
    const s3=new Map();page(s3,open).api.note(req(3),"playerTwo",OP,RES);
    assert.equal(page(s3,open,4).api.resend(req(4)),false,"season 4 never publishes season 3's result");
    assert.equal(page(s3,{...open,managerRole:"playerOne"}).api.resend(req(3)),false,"the other manager's phone never sends it");}
  ok("W2","Season Results: CONFIRM MY RESULT goes again once with the same result and operationId, only while he has none this season");
}
// ---- W3 Transfer War
{
  const src=read("js/productionSharedTransferChallenge.js");
  const fns=["pstcTapMemory","pstcTapMemoryLoad","pstcTapScope","pstcTapNote","pstcTapClear","pstcTapPending","pstcTapResend"].map(n=>body(src,n)).join("\n");
  assert.match(src,/if\(!resend\)pstcTapNote\(method,request,payload\);/);
  assert.match(src,/pstcDecorateDashboard\(\);pstcTapResend\(request\);return view;/,"after the screen's own read");
  const page=(storage,view,{replay=false,season=2}={})=>{
    const sb=sandbox(storage,{sent:[]});
    vm.runInNewContext(`const PSTC_TAP_STEP={lockGuesses:"transferGuess",lockSignings:"transferSigning"};let tapMemoryLoading=null,tapResendKey="",busy=false,viewContextKey="k${season}";let view=${JSON.stringify(view)};
      function pstcLoadScript(){return Promise.resolve(root.CareerModeSharedTapMemory);}function pstcRequestMatches(){return true;}function pstcReplayPhase(){return ${replay};}
      function pstcRandomOperationId(){return "transfer_op_"+"5".repeat(32);}
      async function pstcMutate(method,payload,opts){sent.push({method,payload,resend:Boolean(opts&&opts.resend)});}
      ${fns}
      globalThis.api={note:(m,r,p)=>pstcTapNote(m,r,p),resend:r=>pstcTapResend(r)};`,sb);
    return sb;
  };
  const G=[{slot:1,league:"Premier League"}],S=[{name:"A Player",league:"Serie A",nationality:"Italy"}];
  const guessOpen={managerRole:"playerOne",state:{phase:"GUESS_ENTRY",guessLockedRoles:[],signingLockedRoles:[]}};
  {const storage=new Map();page(storage,guessOpen).api.note("lockGuesses",req(2),{guesses:G});
    assert.equal(page(storage,guessOpen,{replay:true}).api.resend(req(2)),false,"never during the replay (kept for after it)");
    const a=page(storage,guessOpen);assert.equal(a.api.resend(req(2)),true);await a.flush();
    assert.equal(a.sent[0].method,"lockGuesses");assert.deepEqual(JSON.parse(JSON.stringify(a.sent[0].payload)),{guesses:G});assert.equal(a.sent[0].resend,true);
    assert.equal(page(storage,guessOpen).api.resend(req(2)),false);}
  {const storage=new Map();page(storage,guessOpen).api.note("lockGuesses",req(2),{guesses:G});
    assert.equal(page(storage,{...guessOpen,state:{phase:"SIGNING_ENTRY",guessLockedRoles:[],signingLockedRoles:[]}}).api.resend(req(2)),false,"the server moved the phase on by its clock: a late lock is not sent");
    const s2=new Map();page(s2,guessOpen).api.note("lockGuesses",req(2),{guesses:G});
    assert.equal(page(s2,{...guessOpen,state:{phase:"GUESS_ENTRY",guessLockedRoles:["playerOne"],signingLockedRoles:[]}}).api.resend(req(2)),false,"landed: never again");}
  {const storage=new Map();const sign={managerRole:"playerTwo",state:{phase:"SIGNING_ENTRY",guessLockedRoles:["playerOne","playerTwo"],signingLockedRoles:["playerOne"]}};
    page(storage,sign).api.note("lockSignings",req(2),{signings:S});
    assert.equal(page(storage,sign,{season:3}).api.resend(req(3)),false,"season 3 never sends season 2's signings");
    const s2=new Map();page(s2,sign).api.note("lockSignings",req(2),{signings:S});
    const a=page(s2,sign);assert.equal(a.api.resend(req(2)),true);await a.flush();assert.equal(a.sent[0].method,"lockSignings");}
  ok("W3","Transfer War: a lock goes again once only in the same phase with his lock still open, never during the replay, never late or next season");
}
// ---- W4 Career Start
{
  const src=read("js/productionSharedCareerStart.js");
  const fns=["pcstTapMemory","pcstTapMemoryLoad","pcstTapScope","pcstTapNote","pcstTapClear","pcstTapResend","pcstOwnAcknowledged"].map(n=>body(src,n)).join("\n");
  assert.match(src,/const operationId=resendOperationId\|\|pcstRandomOperationId\(\);\n\s*if\(!resendOperationId\)pcstTapNote\(operationId\);/);
  const page=storage=>{
    const sb=sandbox(storage,{sent:[]});
    vm.runInNewContext(`let tapMemoryLoading=null,tapResendKey="",busy=false;const setup={rivalryId:"${R}",managerRole:"playerTwo"};
      function pcstSetupState(){return setup;}function pcstLoadScript(){return Promise.resolve(root.CareerModeSharedTapMemory);}
      async function pcstAcknowledge(opts){sent.push(opts);}
      ${fns}
      globalThis.api={note:id=>pcstTapNote(id),resend:r=>pcstTapResend(r,setup)};`,sb);
    return sb;
  };
  const OP="career_start_op_"+"2".repeat(32);
  const open={ok:true,managerRole:"playerTwo",state:{phase:"WAITING_FOR_ACKNOWLEDGEMENTS",acknowledgedRoles:["playerOne"]}};
  {const storage=new Map();page(storage).api.note(OP);
    const a=page(storage);assert.equal(a.api.resend(open),true);await a.flush();assert.equal(a.sent[0].resendOperationId,OP);
    assert.equal(page(storage).api.resend(open),false);}
  {const storage=new Map();page(storage).api.note(OP);
    assert.equal(page(storage).api.resend({...open,state:{phase:"WAITING_FOR_ACKNOWLEDGEMENTS",acknowledgedRoles:["playerOne","playerTwo"]}}),false,"acknowledged: never again");
    const s2=new Map();page(s2).api.note(OP);assert.equal(page(s2).api.resend({...open,state:{phase:"CAREER_START_READY",acknowledgedRoles:[]}}),false);}
  ok("W4","Career Start: I STARTED AT goes again once with the same operationId, only while he is not acknowledged");
}
// ---- W7 answered on its page, or edited: never sent again
{
  const sr=read("js/productionSharedSeasonResults.js"),tw=read("js/productionSharedTransferChallenge.js"),sc=read("js/productionSharedSeasonCommit.js"),cs=read("js/productionSharedCareerStart.js");
  assert.match(sr,/finally\{pssrTapClear\(request,publishRole\);busy=false;/,"Season Results: any answer on this page ends the note");
  assert.match(tw,/finally\{if\(PSTC_TAP_STEP\[method\]\)pstcTapClear\(method,request,tapRole\);busy=false;/,"Transfer War: any answer on this page ends the note");
  assert.match(sc,/finally\{psscTapClear\(kind,request\);busy=false;/,"Season Commit: any answer on this page ends the note");
  assert.match(cs,/\}finally\{\n[^\n]*\n\s*pcstTapClear\(pcstSetupState\(\)\);/,"Career Start: any answer on this page ends the note");
  assert.match(body(sr,"pssrEdit"),/pssrTapClear\(pssrRequestContext\(\),view\?\.managerRole\);draft=null;/,"EDIT MY RESULT drops the note");
  // Season Results, run for real: publish noted, the tab stays alive and the publish fails, he taps EDIT MY RESULT and changes
  // his position, the tab reloads before he publishes again: nothing is sent behind him.
  const fns=["pssrTapMemory","pssrTapMemoryLoad","pssrTapScope","pssrTapNote","pssrTapClear","pssrTapResend","pssrEdit","pssrDraftChange"].map(n=>body(sr,n)).join("\n");
  const page=(storage,view)=>{
    const sb=sandbox(storage,{sent:[],saved:[]});
    vm.runInNewContext(`let tapMemoryLoading=null,tapResendKey="",busy=false,contextKey="k3",draft={};let view=${JSON.stringify(view)};
      function pssrLoadScript(){return Promise.resolve(root.CareerModeSharedTapMemory);}function pssrContextMatches(){return true;}
      function pssrRequestContext(){return {key:"k3",rivalryId:"${R}",seasonNumber:3};}function pssrSharedMarker(){return true;}
      function pssrContinental(){}function pssrDraftFieldIds(){return ["p2LeaguePosition"];}function pssrDraftSave(){saved.push(1);}
      function pssrSetError(){}function pssrEntryMode(){}function pssrRenderEntry(){}function pssrField(){return null;}function pssrRolePrefix(){return "p2";}
      async function pssrPublish(note){sent.push(note);}
      ${fns}
      globalThis.api={note:(r,role,id,res)=>pssrTapNote(r,role,id,res),clear:(r,role)=>pssrTapClear(r,role),resend:r=>pssrTapResend(r),edit:()=>pssrEdit(),change:id=>pssrDraftChange({target:{id}})};`,sb);
    return sb;
  };
  const OP="season_result_op_"+"7".repeat(32),RES={leaguePosition:2,leaguePoints:80};
  const open={managerRole:"playerTwo",ownResult:null,state:{phase:"COLLECTING"}};
  {const storage=new Map(),a=page(storage,open);a.api.note(req(3),"playerTwo",OP,RES);a.api.clear(req(3),"playerTwo");
    const b=page(storage,open);assert.equal(b.api.resend(req(3)),false,"failed on a live page: the reload sends nothing");await b.flush();assert.equal(b.sent.length,0);}
  {const storage=new Map(),a=page(storage,open);a.api.note(req(3),"playerTwo",OP,RES);assert.equal(a.api.edit(),true);
    const b=page(storage,open);assert.equal(b.api.resend(req(3)),false,"EDIT MY RESULT then reload: the old result is never sent");}
  {const storage=new Map(),a=page(storage,open);a.api.note(req(3),"playerTwo",OP,RES);a.api.change("p2LeaguePosition");assert.equal(a.saved.length,1);
    const b=page(storage,open);assert.equal(b.api.resend(req(3)),false,"a changed field then reload: the old result is never sent");}
  {const storage=new Map(),a=page(storage,open);a.api.note(req(3),"playerTwo",OP,RES);
    const b=page(storage,open);assert.equal(b.api.resend(req(3)),true,"the tab died before any answer: sent once");}
  // Transfer War: a changed guess or signing field drops that lock's note.
  assert.match(body(tw,"pstcGuessDraftChange"),/pstcTapClear\("lockGuesses",pstcRequestContext\(\),role\);pstcSaveGuessDraft\(role\);/,"a changed guess drops the LOCK MY GUESSES note");
  assert.match(body(tw,"pstcSigningDraftChange"),/\{pstcTapClear\("lockSignings",pstcRequestContext\(\),role\);pstcSaveSigningDraft\(role\);\}/,"a changed signing drops the LOCK MY SIGNINGS note");
  ok("W7","a tap answered on its own page, or edited after, is never sent again; only a tab that died mid-write resends");
}
// ---- W5/W6
{
  const tc=read("js/productionSharedTerminalClose.js");
  assert.match(tc,/if\(state\.phase==="CLOSED"\|\|state\.phase==="DELETED"\)try\{root\.CareerModeSharedTapMemory\?\.forgetShowdown\?\.\(state\.rivalryId\|\|request\.rivalryId\);\}catch\(_error\)\{\}/,"a closed or ended Showdown forgets its notes");
  for(const [file,prefix] of [["js/productionSharedSeasonCommit.js","pssc"],["js/productionSharedSeasonResults.js","pssr"],["js/productionSharedTransferChallenge.js","pstc"],["js/productionSharedCareerStart.js","pcst"]]){
    const src=read(file);
    assert.match(src,new RegExp(`function ${prefix}TapMemory\\(\\)\\{try\\{return root\\.CareerModeSharedTapMemory\\|\\|null;`),`${file}: optional helper (missing = as before)`);
    assert.match(src,new RegExp(`\\n\\s+${prefix}TapMemoryLoad\\(\\);\\n`),`${file}: loaded beside its dependencies, never awaited`);
    for(const name of [`${prefix}TapNote`,`${prefix}TapClear`,`${prefix}TapResend`])assert.doesNotMatch(body(src,name),/getDoc|onSnapshot|runTransaction|provider\.read|setInterval/,`${file} ${name}: no read or poll`);
  }
  assert.match(read("service-worker.js"),/"js\/sharedTapMemory\.js",/,"precached for a cold start offline");
  assert.doesNotMatch(read("js/productionFirebaseRuntime.js"),/persistentLocalCache|enableIndexedDbPersistence|enableMultiTabIndexedDbPersistence/,"Firestore stays memory-only");
  ok("W5","a closed Showdown forgets its notes; the helper is optional, precached, and adds no read; Firestore stays memory-only");
}
console.log(`PASS r100 tap memory wiring contracts (${checks} checks)`);
})().catch(error=>{console.error(error);process.exit(1);});
