"use strict";
// JOB-09 closed-Showdown adapter + career loader contracts. Plain node:assert, no Firebase, no emulator.
// Fixtures are built from the real model functions (buildProjection, Terminal.prepare, the JOB-05 adapter).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const Adapter=require(path.join(root,"js/sharedClosedShowdownAdapter.js"));
const Career=require(path.join(root,"js/sharedCareerAnalytics.js"));
const Active=require(path.join(root,"js/sharedActiveShowdownAdapter.js"));
const History=require(path.join(root,"js/sharedHistoryConvergence.js"));
const Terminal=require(path.join(root,"js/sharedTerminalClose.js"));
const F=require("../support/active-showdown-fixtures.cjs");
const {result:R,projection:P}=F;

const clone=x=>JSON.parse(JSON.stringify(x));
const id=seed=>"pair_"+seed.repeat(64);
const perfect=R({leaguePosition:1,leaguePoints:101,leagueGoals:101,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true});
function deepFreeze(x){if(x&&typeof x==="object"&&!Object.isFrozen(x)){Object.values(x).forEach(deepFreeze);Object.freeze(x);}return x;}
// What readCompletedShowdown() returns (js/sparkCompletedShowdownReader.js csrState), built from a real projection and a real Terminal Close intent.
function completedRead(p,{role="playerOne",witnessTotals=null,final=null,rivalryId=p.rivalryId}={}){
  const witness=F.closed(p,witnessTotals).terminalWitness,a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
  return deepFreeze({status:"completed",code:null,rivalryId,managerRole:role,terminalWitness:witness,projection:p,final:final||{totals:{playerOne:a,playerTwo:b},winner:a>b?"playerOne":b>a?"playerTwo":"draw",margin:Math.abs(a-b),seasonsPlayed:p.totalSeasons}});
}
const statusRead=(status,rivalryId,{role="playerOne",code=null,projection=null}={})=>deepFreeze({status,code,rivalryId,managerRole:status==="unavailable"?null:role,terminalWitness:null,projection,final:null});
const index=(ids,status="ready")=>deepFreeze({status,accountId:"acct_daniel",rivalryIds:status==="ready"?ids:[],sealedPageCount:0,code:status==="unavailable"?"permission-denied":null});
const readsOf=list=>Object.fromEntries(list.map(r=>[r.rivalryId,r]));
// The current Showdown, exactly as the JOB-05 adapter hands it to the career model.
const liveSnap=(p,extra={})=>({identity:F.identity(),pair:F.pair(p.rivalryId),multiSeason:F.multiFor(p),history:F.history(p),finalReconciliation:null,terminalClose:null,seasonResults:null,...extra});
const noCurrent=()=>Active.careerInput({identity:F.identity(),pair:F.pair(null,{status:"unpaired",rivalryId:null,connectionState:null}),multiSeason:null,history:null,finalReconciliation:null,terminalClose:null,seasonResults:null});
const model=o=>Career.buildCareerModel(Adapter.buildClosedCareerInput(o));
// Three finished seasons: Daniel 5+1+0 = 6, Nik 0+0+3 = 3.
const s1=()=>P({seed:"1",seasons:[[R({championsLeague:true}),R()],[R({domesticCup:true}),R()],[R(),R({leaguePosition:1})]]});
// An abandoned Showdown that had an 11-point Nik season before it was abandoned.
const s2=()=>P({seed:"2",seasons:[[R(),perfect]]});
// The live Showdown: 1 of 3 seasons accepted, Daniel 3, Nik 0.
const s3=()=>P({seed:"3",seasons:[[R({leaguePosition:1}),R()]]});
function frozen(x,borrowed){if(borrowed.has(x))return;if(x&&typeof x==="object"){assert.ok(Object.isFrozen(x),"every owned output object is frozen");Object.values(x).forEach(y=>frozen(y,borrowed));}}
function noIds(x){if(x&&typeof x==="object"){for(const key of Object.keys(x))assert.ok(!["accountId","profileId","saveId","terminalWitness","managerRole","sessionId"].includes(key),"model output must not carry "+key);Object.values(x).forEach(noIds);}}

let cases=0;
async function check(name,fn){try{await fn();cases+=1;}catch(error){error.message=name+": "+error.message;throw error;}}

(async()=>{
await check("C1 API surface",()=>{
  assert.equal(typeof Adapter.buildClosedCareerInput,"function");assert.equal(typeof Adapter.describeClosedCareer,"function");
  assert.deepEqual([...Adapter.readStatuses],["completed","abandoned","not-closed","unavailable"]);
  for(const k of ["sessionRequired","providerWriteRequired","listPermissionRequired","canonicalStorageMutation","billingRequired"])assert.equal(Adapter[k],false,k);
  assert.equal(Adapter.contractVersion,1);assert.ok(Object.isFrozen(Adapter));
});

await check("C2 completed Showdown counts once with the witness totals",()=>{
  const p=s1(),r=completedRead(p),input=Adapter.buildClosedCareerInput({index:index([p.rivalryId]),reads:readsOf([r]),current:noCurrent()});
  assert.deepEqual(Object.keys(input),["indexStatus","showdowns","currentShowdownOnly"]);
  assert.equal(input.indexStatus,"ready");assert.equal(input.currentShowdownOnly,false);
  assert.equal(input.showdowns.length,1);assert.equal(input.showdowns[0].classification,"completed");
  assert.equal(input.showdowns[0].projection,p,"projection is the reader's verified projection itself");
  assert.deepEqual(input.showdowns[0].final,{totals:clone(r.terminalWitness.managerTotals),winner:r.terminalWitness.winner});
  const m=Career.buildCareerModel(input);
  assert.equal(m.status,"ready");assert.equal(m.interimLabel,null);assert.deepEqual(m.coverage,{readable:1,indexed:1});
  assert.equal(m.managers.daniel.careerPoints,r.terminalWitness.managerTotals.playerOne);assert.equal(m.managers.nik.careerPoints,r.terminalWitness.managerTotals.playerTwo);
  assert.deepEqual([m.managers.daniel.showdowns.completed,m.managers.daniel.showdowns.wins,m.managers.nik.showdowns.losses],[1,1,1]);
  const row=m.history.showdowns[0];assert.equal(row.status,"completed");assert.deepEqual(row.totals,{daniel:6,nik:3});assert.equal(row.winner,"daniel");assert.equal(row.seasons.length,3);
});

await check("C3 abandoned Showdown is a status row and counts for nothing",()=>{
  const p=s2(),forged=statusRead("abandoned",p.rivalryId,{projection:p});
  const input=Adapter.buildClosedCareerInput({index:index([p.rivalryId]),reads:readsOf([forged]),current:noCurrent()});
  assert.deepEqual(clone(input.showdowns),[{rivalryId:p.rivalryId,classification:"abandoned",projection:null,final:null}]);
  const m=Career.buildCareerModel(input);
  assert.equal(m.status,"ready");assert.deepEqual(m.coverage,{readable:1,indexed:1});
  assert.equal(m.managers.nik.careerPoints,0);assert.equal(m.managers.nik.bestSeasonScore,null);assert.equal(m.managers.nik.perfectSeasons,0);assert.equal(m.managers.nik.seasons,0);
  const row=m.history.showdowns[0];assert.equal(row.status,"abandoned");assert.equal(row.totals,null);assert.equal(row.winner,null);assert.deepEqual(row.seasons,[]);
});

await check("C4 totals must equal the Terminal Close managerTotals; forgeries are unavailable, never shorter",()=>{
  const p=s1(),good=completedRead(p),a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
  const tampered=clone(p);tampered.managerRecords.playerTwo.totalPoints+=1;
  const partialP=P({seed:"1",seasons:[[R({championsLeague:true}),R()],[R({domesticCup:true}),R()]]});
  const forged=[
    ["witness totals differ",completedRead(p,{witnessTotals:{playerOne:a+1,playerTwo:b}})],
    ["final totals differ",completedRead(p,{final:{totals:{playerOne:a,playerTwo:b+1},winner:"playerOne",margin:a-b-1,seasonsPlayed:3}})],
    ["final winner wrong",completedRead(p,{final:{...good.final,winner:"draw"}})],
    ["margin wrong",completedRead(p,{final:{...good.final,margin:0}})],
    ["seasonsPlayed wrong",completedRead(p,{final:{...good.final,seasonsPlayed:2}})],
    ["tampered projection",deepFreeze({...clone(good),projection:tampered})],
    ["2 of 3 seasons",deepFreeze({...clone(good),projection:partialP})],
    ["witness for another rivalry",deepFreeze({...clone(good),terminalWitness:completedRead(s2()).terminalWitness})],
    ["missing witness",deepFreeze({...clone(good),terminalWitness:null})],
    ["read names another rivalry",completedRead(p,{rivalryId:id("9")})],
    ["bad role",deepFreeze({...clone(good),managerRole:"playerThree"})]
  ];
  for(const [label,r] of forged){
    const input=Adapter.buildClosedCareerInput({index:index([p.rivalryId]),reads:{[p.rivalryId]:r},current:noCurrent()});
    assert.deepEqual(clone(input.showdowns),[{rivalryId:p.rivalryId,classification:"unavailable",projection:null,final:null}],label);
    const m=Career.buildCareerModel(input);assert.equal(m.status,"partial",label);assert.deepEqual(m.coverage,{readable:0,indexed:1},label);assert.equal(m.managers.daniel.careerPoints,0,label+": nothing invented");
  }
});

await check("C5 unreadable Showdowns make the career partial",()=>{
  const p=s1(),q=s2();
  const cases5=[[statusRead("unavailable",q.rivalryId,{code:"permission-denied"}),"permission-denied"],[undefined,"CLOSED_READ_MISSING"],[deepFreeze({status:"weird",rivalryId:q.rivalryId}),"CLOSED_READ_INVALID"]];
  for(const [r,code] of cases5){
    const reads={[p.rivalryId]:completedRead(p)};if(r)reads[q.rivalryId]=r;
    const o={index:index([p.rivalryId,q.rivalryId]),reads,current:noCurrent()},m=model(o);
    assert.equal(m.status,"partial",code);assert.deepEqual(m.coverage,{readable:1,indexed:2},code);assert.equal(m.managers.daniel.careerPoints,6,code+": readable Showdown still counts");
    assert.equal(m.history.showdowns[1].status,"unavailable",code);assert.equal(Adapter.describeClosedCareer(o)[1].code,code);
  }
});

await check("C6 index and current states",()=>{
  assert.equal(model({index:index([],"loading"),reads:{},current:noCurrent()}).status,"loading");
  const u=model({index:index([],"unavailable"),reads:{},current:noCurrent()});assert.equal(u.status,"unavailable");assert.equal(u.managers.daniel.careerPoints,null);assert.deepEqual(u.history.showdowns,[]);
  assert.equal(Adapter.describeClosedCareer({index:index([],"unavailable")})[0].code,"permission-denied");
  for(const bad of [null,{},{status:"ready",rivalryIds:"x"},{status:"ready",rivalryIds:[id("1"),id("1")]},{status:"ready",rivalryIds:["pair_1"]}])assert.equal(model({index:bad,reads:{},current:noCurrent()}).status,"unavailable",JSON.stringify(bad));
  const e=model({index:index([]),reads:{},current:noCurrent()});assert.equal(e.status,"empty");assert.equal(e.interimLabel,null);
  const loadingCurrent=Active.careerInput({pair:null});assert.equal(loadingCurrent.indexStatus,"loading");
  assert.equal(model({index:index([s1().rivalryId]),reads:readsOf([completedRead(s1())]),current:loadingCurrent}).status,"loading","waits for the live Showdown");
});

await check("C7 the live Showdown joins career history from the JOB-05 adapter",()=>{
  const p=s1(),q=s2(),live=s3(),current=Active.careerInput(liveSnap(live));
  assert.equal(current.showdowns[0].classification,"active");
  const input=Adapter.buildClosedCareerInput({index:index([p.rivalryId,q.rivalryId,live.rivalryId]),reads:readsOf([completedRead(p),statusRead("abandoned",q.rivalryId),statusRead("not-closed",live.rivalryId)]),current});
  assert.equal(input.showdowns[2].projection,current.showdowns[0].projection,"live projection passed by identity");
  const m=Career.buildCareerModel(input);
  assert.equal(m.status,"ready");assert.deepEqual(m.coverage,{readable:3,indexed:3});
  assert.deepEqual(m.history.showdowns.map(row=>row.status),["completed","abandoned","in-progress"]);
  assert.equal(m.managers.daniel.careerPoints,6+3);assert.equal(m.managers.nik.careerPoints,3);
  assert.equal(m.managers.daniel.showdowns.completed,1);assert.equal(m.managers.daniel.seasons,4);
});

await check("C8 completion pending counts seasons but not the outcome",()=>{
  const p=s1(),live=P({seed:"3",seasons:[[R({leaguePosition:1}),R()],[R(),R()],[R(),R({championsLeague:true})]]}),current=Active.careerInput(liveSnap(live));
  assert.equal(current.showdowns[0].classification,"completion-pending");
  const m=model({index:index([p.rivalryId,live.rivalryId]),reads:readsOf([completedRead(p),statusRead("not-closed",live.rivalryId,{role:"playerTwo"})]),current});
  assert.deepEqual(m.history.showdowns.map(row=>row.status),["completed","completion-pending"]);
  assert.equal(m.managers.daniel.showdowns.completed,1);assert.equal(m.managers.nik.careerPoints,3+5);
});

await check("C9 a stale pending rivalry in one index is excluded, so both managers agree",()=>{
  const p=s1(),live=s3(),stale=id("7"),current=Active.careerInput(liveSnap(live));
  const reads=readsOf([completedRead(p),statusRead("not-closed",stale),statusRead("not-closed",live.rivalryId)]);
  const daniel=Adapter.buildClosedCareerInput({index:index([p.rivalryId,stale,live.rivalryId]),reads,current});
  const nikReads=readsOf([completedRead(p,{role:"playerTwo"}),statusRead("not-closed",live.rivalryId,{role:"playerTwo"})]);
  const nik=Adapter.buildClosedCareerInput({index:index([p.rivalryId,live.rivalryId]),reads:nikReads,current:Active.careerInput(liveSnap(live,{identity:F.identity("nik"),pair:F.pair(live.rivalryId,{managerId:"nik"})}))});
  assert.equal(daniel.showdowns[1].classification,"pending");
  assert.deepEqual(clone(Career.buildCareerModel(daniel)),clone(Career.buildCareerModel(nik)),"Daniel's and Nik's career models are identical");
  assert.deepEqual(Career.buildCareerModel(daniel).coverage,{readable:2,indexed:2});
  assert.equal(Adapter.describeClosedCareer({index:index([stale]),reads,current})[0].code,"CLOSED_NOT_CURRENT");
});

await check("C10 a not-closed Showdown with an unknown live state is unavailable, never hidden",()=>{
  const p=s1(),live=s3();
  for(const current of [null,"x",{indexStatus:"ready",showdowns:[{}],currentShowdownOnly:true},Active.careerInput({pair:F.pair(live.rivalryId,{status:"error"})})]){
    const o={index:index([p.rivalryId,live.rivalryId]),reads:readsOf([completedRead(p),statusRead("not-closed",live.rivalryId)]),current},m=model(o);
    assert.equal(m.status,"partial",JSON.stringify(current));assert.equal(m.history.showdowns[1].status,"unavailable");
    assert.match(Adapter.describeClosedCareer(o)[1].code,/^CLOSED_CURRENT_(UNKNOWN|UNAVAILABLE)$/);
  }
  assert.equal(model({index:index([p.rivalryId]),reads:readsOf([completedRead(p)]),current:null}).status,"ready","an unknown live state does not touch closed Showdowns");
});

await check("C11 terminal and live views of the same Showdown",()=>{
  const p=s1(),pClosed=Active.careerInput(liveSnap(p,{terminalClose:F.closed(p)})),pAlt=P({seed:"1",seasons:[[R(),R()],[R(),R()],[R(),R({championsLeague:true})]]}),pOther=Active.careerInput(liveSnap(pAlt,{terminalClose:F.closed(pAlt)}));
  assert.equal(pOther.showdowns[0].classification,"completed");assert.equal(pOther.showdowns[0].rivalryId,p.rivalryId);
  assert.equal(pClosed.showdowns[0].classification,"completed");
  const one=(r,current)=>Adapter.buildClosedCareerInput({index:index([p.rivalryId]),reads:{[p.rivalryId]:r},current}).showdowns[0].classification;
  assert.equal(one(statusRead("not-closed",p.rivalryId),pClosed),"unavailable","live says closed, root read says not closed");
  assert.equal(one(completedRead(p),Active.careerInput(liveSnap(p))),"completed","closed read wins over a live view still catching up");
  assert.equal(one(completedRead(p),pClosed),"completed","agreeing terminal views");
  const pReloaded=Active.careerInput(liveSnap(p,{pair:F.pair(p.rivalryId,{connectionState:"closed"}),history:null}));assert.equal(pReloaded.showdowns[0].classification,"abandoned");
  assert.equal(one(completedRead(p),pReloaded),"completed","a reloaded closed pair without its local witness never hides the verified close");
  assert.equal(one(completedRead(p),pOther),"unavailable","terminal views disagree");
  const q=s2(),qLive=Active.careerInput(liveSnap(q)),qAbandoned=Active.careerInput(liveSnap(q,{pair:F.pair(q.rivalryId,{connectionState:"closed"})}));
  assert.equal(qAbandoned.showdowns[0].classification,"abandoned");
  assert.equal(Adapter.buildClosedCareerInput({index:index([q.rivalryId]),reads:readsOf([statusRead("abandoned",q.rivalryId)]),current:qLive}).showdowns[0].classification,"abandoned","abandon is irreversible");
  assert.equal(Adapter.buildClosedCareerInput({index:index([q.rivalryId]),reads:readsOf([statusRead("not-closed",q.rivalryId)]),current:qAbandoned}).showdowns[0].classification,"unavailable");
  assert.equal(one(statusRead("abandoned",p.rivalryId),pClosed),"unavailable","abandoned read vs completed live view");
});

await check("C12 no backfill: a live Showdown outside the career index stays out of career history",()=>{
  const p=s1(),live=s3(),o={index:index([p.rivalryId]),reads:readsOf([completedRead(p)]),current:Active.careerInput(liveSnap(live))};
  const m=model(o);assert.deepEqual(m.coverage,{readable:1,indexed:1});assert.equal(m.managers.daniel.careerPoints,6);
  assert.deepEqual(clone(Adapter.describeClosedCareer(o)[1]),{rivalryId:live.rivalryId,source:"outside-index",classification:"active",code:"CLOSED_NOT_INDEXED"});
});

await check("C13 scoring unchanged across lengths",()=>{
  for(const n of [1,3,5,10]){
    const seasons=Array.from({length:n},(_,i)=>i===0?[perfect,R({topScorer:true,topAssist:true,leaguePoints:100})]:[R({leaguePosition:2}),R({domesticCup:true})]);
    const p=P({seed:"5",totalSeasons:n,seasons}),r=completedRead(p),m=model({index:index([p.rivalryId]),reads:readsOf([r]),current:noCurrent()});
    assert.equal(m.status,"ready",String(n));
    const s=m.history.showdowns[0].seasons[0];assert.equal(s.score.daniel,11);assert.equal(s.score.nik,2,"performance 1 + awards 1, never 2 each");
    assert.equal(m.managers.daniel.careerPoints,r.terminalWitness.managerTotals.playerOne);assert.equal(m.managers.nik.careerPoints,r.terminalWitness.managerTotals.playerTwo);
    assert.equal(m.managers.daniel.perfectSeasons,1);assert.ok(m.managers.daniel.bestSeasonScore<=11);
  }
  const src=read("js/sharedClosedShowdownAdapter.js");assert.doesNotMatch(src,/\?\s*5\s*:|\?\s*3\s*:|scoring\.total\s*=/,"the adapter never computes scores");
});

await check("C14 exactly two managers; both views identical; no ids in the model",()=>{
  const p=s1(),q=s2();
  const d=Adapter.buildClosedCareerInput({index:index([p.rivalryId,q.rivalryId]),reads:readsOf([completedRead(p),statusRead("abandoned",q.rivalryId)]),current:noCurrent()});
  const n=Adapter.buildClosedCareerInput({index:index([p.rivalryId,q.rivalryId]),reads:readsOf([completedRead(p,{role:"playerTwo"}),statusRead("abandoned",q.rivalryId,{role:"playerTwo"})]),current:noCurrent()});
  assert.deepEqual(clone(d),clone(n));
  const m=Career.buildCareerModel(d);assert.deepEqual(Object.keys(m.managers),["daniel","nik"]);noIds(m);
  assert.equal(m.history.showdowns[0].clubs.daniel,p.managerRecords.playerOne.club,"Daniel = playerOne, left");
});

await check("C15 abandoning later rebuilds the career without those seasons",()=>{
  const p=s1(),q=P({seed:"2",seasons:[[R(),perfect],[R(),perfect]]});
  const before=model({index:index([p.rivalryId,q.rivalryId]),reads:readsOf([completedRead(p),statusRead("not-closed",q.rivalryId)]),current:Active.careerInput(liveSnap(q))});
  assert.equal(before.managers.nik.careerPoints,3+22);assert.equal(before.managers.nik.perfectSeasons,2);
  const after=model({index:index([p.rivalryId,q.rivalryId]),reads:readsOf([completedRead(p),statusRead("abandoned",q.rivalryId)]),current:noCurrent()});
  assert.equal(after.managers.nik.careerPoints,3);assert.equal(after.managers.nik.perfectSeasons,0);assert.equal(after.managers.nik.bestSeasonScore,3);
  assert.equal(after.trophyRoom.records.find(r=>r.label==="Highest season score").value,5);
});

await check("C16 never throws, frozen, pure",()=>{
  for(const bad of [undefined,null,{},"x",{index:index([id("1")]),reads:null,current:7},{index:{status:"ready",rivalryIds:[id("1")]},reads:{[id("1")]:{status:"completed",rivalryId:id("1"),managerRole:"playerOne",projection:{},terminalWitness:{},final:{}}}}]){
    const v=Adapter.buildClosedCareerInput(bad);assert.ok(Object.isFrozen(v));assert.ok(["unavailable","ready","loading"].includes(v.indexStatus));
    const d=Adapter.describeClosedCareer(bad);assert.ok(Array.isArray(d)&&Object.isFrozen(d));
  }
  const p=s1(),live=s3(),current=Active.careerInput(liveSnap(live)),reads=readsOf([completedRead(p),statusRead("not-closed",live.rivalryId)]),idx=index([p.rivalryId,live.rivalryId]);
  const mutableIdx=clone(idx),before=clone(mutableIdx);
  const v=Adapter.buildClosedCareerInput({index:mutableIdx,reads,current});
  frozen(v,new Set([p,current.showdowns[0].projection]));assert.deepEqual(mutableIdx,before,"caller input unchanged");assert.equal(Object.isFrozen(mutableIdx),false,"caller input not frozen by the adapter");
  assert.deepEqual(clone(Adapter.buildClosedCareerInput({index:idx,reads,current})),clone(v),"deterministic");
  const src=read("js/sharedClosedShowdownAdapter.js");
  assert.doesNotMatch(src,/localStorage|sessionStorage|indexedDB|document\.|\bwindow\b|getState\s*\(|addEventListener|setInterval|setTimeout|Date\.now|Math\.random|getDoc|firebase|firestore|require\("\.\/spark|fetch\(/i);
  globalThis.currentShowdown={rivalryId:p.rivalryId,scores:[99,99]};
  try{assert.deepEqual(clone(Adapter.buildClosedCareerInput({index:idx,reads,current})),clone(v),"globals change nothing");}finally{delete globalThis.currentShowdown;}
});

await check("C17 browser globals",()=>{
  const p=s1(),o={index:index([p.rivalryId]),reads:readsOf([completedRead(p)]),current:noCurrent()};
  const context=vm.createContext({CareerModeSharedHistoryConvergence:History,CareerModeSharedTerminalClose:Terminal});
  vm.runInContext(read("js/sharedClosedShowdownAdapter.js"),context);
  assert.ok(context.CareerModeSharedClosedShowdownAdapter);
  assert.deepEqual(clone(context.CareerModeSharedClosedShowdownAdapter.buildClosedCareerInput(o)),clone(Adapter.buildClosedCareerInput(o)));
});

// Loader: loaded in a vm with fake index and reader globals, so every call is counted.
function loaderWith({indexes,reads}){
  const calls={index:0,reader:[]};
  const context=vm.createContext({
    CareerModeSharedHistoryConvergence:History,CareerModeSharedTerminalClose:Terminal,CareerModeSharedCareerAnalytics:Career,
    CareerModePersistentNikDanielPair:{readCareerIndex:async({accountId})=>{calls.index+=1;const v=indexes[accountId];if(v instanceof Error)throw v;return v||index([]);}},
    CareerModeSparkCompletedShowdownReader:{readCompletedShowdown:async options=>{calls.reader.push({uid:options.user.uid,rivalryId:options.rivalryId,keys:Object.keys(options).sort().join(",")});const v=reads[options.rivalryId];if(v instanceof Error)throw v;return typeof v==="function"?v():v;}}
  });
  vm.runInContext(read("js/sharedClosedShowdownAdapter.js"),context);
  vm.runInContext(read("js/sparkClosedShowdownCareerLoader.js"),context);
  return {L:context.CareerModeSparkClosedShowdownCareerLoader,calls};
}
const services={firestore:{},firebaseSdk:{doc:()=>({}),getDoc:async()=>({exists:()=>false})},cryptoImpl:{subtle:{}}};

await check("L1 loader surface and source",()=>{
  const L=require(path.join(root,"js/sparkClosedShowdownCareerLoader.js"));
  assert.equal(typeof L.loadClosedShowdownCareer,"function");assert.equal(typeof L.clearClosedShowdownCache,"function");
  for(const k of ["sessionRequired","deviceRequired","providerWriteRequired","listPermissionRequired","canonicalStorageMutation","billingRequired"])assert.equal(L[k],false,k);
  const src=read("js/sparkClosedShowdownCareerLoader.js");
  for(const banned of [/runTransaction/,/getDocs\(/,/collection\(/,/query\(/,/onSnapshot/,/setDoc|updateDoc|deleteDoc|writeBatch/,/localStorage|sessionStorage|indexedDB/,/"sessions"|'sessions'/,/getState\s*\(/,/Date\.now|setTimeout|setInterval/])assert.doesNotMatch(src,banned,String(banned));
  assert.match(src,/readCareerIndex\(\{firestore:o\.firestore,firebaseSdk:o\.firebaseSdk,accountId:uid\}\)/);assert.match(src,/readCompletedShowdown\(/);
});

await check("L2 walks the index in order and builds the career for both managers",async()=>{
  const p=s1(),q=s2(),live=s3();
  const {L,calls}=loaderWith({indexes:{acct_daniel:index([p.rivalryId,q.rivalryId,live.rivalryId]),acct_nik:index([p.rivalryId,q.rivalryId,live.rivalryId])},reads:readsOf([completedRead(p),statusRead("abandoned",q.rivalryId),statusRead("not-closed",live.rivalryId)])});
  const d=await L.loadClosedShowdownCareer({...services,user:{uid:"acct_daniel"},current:Active.careerInput(liveSnap(live))});
  assert.equal(d.status,"ready");assert.equal(d.accountId,"acct_daniel");assert.ok(Object.isFrozen(d));
  assert.deepEqual(calls.reader.map(c=>c.rivalryId),[p.rivalryId,q.rivalryId,live.rivalryId]);assert.equal(calls.reader[0].keys,"cryptoImpl,firebaseSdk,firestore,rivalryId,user");
  assert.deepEqual(d.model.history.showdowns.map(r=>r.status),["completed","abandoned","in-progress"]);
  const n=await L.loadClosedShowdownCareer({...services,user:{uid:"acct_nik"},current:Active.careerInput(liveSnap(live,{identity:F.identity("nik"),pair:F.pair(live.rivalryId,{managerId:"nik"})}))});
  assert.deepEqual(clone(n.model),clone(d.model),"identical career for Daniel and Nik");
});

await check("L3 terminal results are cached per signed-in account only",async()=>{
  const p=s1(),q=s2(),live=s3();
  let liveCalls=0;
  const {L,calls}=loaderWith({indexes:{acct_daniel:index([p.rivalryId,q.rivalryId,live.rivalryId]),acct_nik:index([p.rivalryId])},reads:{...readsOf([completedRead(p),statusRead("abandoned",q.rivalryId)]),[live.rivalryId]:()=>{liveCalls+=1;return statusRead("not-closed",live.rivalryId);}}});
  const current=Active.careerInput(liveSnap(live));
  const first=await L.loadClosedShowdownCareer({...services,user:{uid:"acct_daniel"},current});assert.equal(calls.reader.length,3);assert.equal(L.closedShowdownCacheSize(),2);
  const second=await L.loadClosedShowdownCareer({...services,user:{uid:"acct_daniel"},current});
  assert.equal(calls.reader.length,4,"only the live Showdown is read again");assert.equal(liveCalls,2);assert.deepEqual(clone(second.model),clone(first.model));
  await L.loadClosedShowdownCareer({...services,user:{uid:"acct_nik"},current:noCurrent()});
  assert.equal(calls.reader.length,5,"another account starts with an empty cache");assert.equal(calls.reader[4].uid,"acct_nik");assert.equal(L.closedShowdownCacheSize(),1);
  L.clearClosedShowdownCache();assert.equal(L.closedShowdownCacheSize(),0);
});

await check("L4 never throws; failures are unavailable, never empty",async()=>{
  const p=s1(),q=s2();
  const {L}=loaderWith({indexes:{acct_daniel:index([p.rivalryId,q.rivalryId]),acct_broken:new Error("boom")},reads:{[p.rivalryId]:completedRead(p),[q.rivalryId]:new Error("network")}});
  for(const bad of [undefined,{},{...services},{user:{uid:"acct_daniel"}},{...services,user:{uid:""}},{...services,firebaseSdk:{doc:()=>1},user:{uid:"acct_daniel"}}]){
    const v=await L.loadClosedShowdownCareer(bad);assert.equal(v.status,"unavailable",JSON.stringify(Object.keys(bad||{})));assert.equal(v.model.status,"unavailable");assert.ok(Object.isFrozen(v));
  }
  const broken=await L.loadClosedShowdownCareer({...services,user:{uid:"acct_broken"},current:noCurrent()});assert.equal(broken.status,"unavailable");
  const partial=await L.loadClosedShowdownCareer({...services,user:{uid:"acct_daniel"},current:noCurrent()});
  assert.equal(partial.status,"partial");assert.deepEqual(partial.model.coverage,{readable:1,indexed:2});assert.equal(partial.entries[1].code,"CLOSED_READ_MISSING");
});

await check("L5 paging: the real career index client walks sealed pages, then the head",async()=>{
  const L=require(path.join(root,"js/sparkClosedShowdownCareerLoader.js"));L.clearClosedShowdownCache();
  const ids=Array.from({length:501},(_,i)=>"pair_"+i.toString(16).padStart(64,"0"));
  const env=(type,objectId,data)=>({schemaVersion:1,objectType:type,objectId,revision:type==="careerIndexPage"?0:1,lifecycleState:"live",contentHash:"sha256:"+"0".repeat(64),data});
  const docs={"accounts/acct_daniel/careerIndex/page_1":env("careerIndexPage","page_1",{pageNumber:1,rivalryIds:ids.slice(0,500)}),"accounts/acct_daniel/careerIndex/current":env("careerIndex","current",{rivalryIds:ids.slice(500),sealedPageCount:1})};
  const log=[];
  const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),getDoc:async ref=>{log.push(ref.path);const v=docs[ref.path];return {exists:()=>v!==undefined,data:()=>v};}};
  const v=await L.loadClosedShowdownCareer({firestore:{},firebaseSdk:sdk,user:{uid:"acct_daniel"},cryptoImpl:require("node:crypto").webcrypto,current:noCurrent()});
  assert.deepEqual(log.slice(0,2),["accounts/acct_daniel/careerIndex/current","accounts/acct_daniel/careerIndex/page_1"]);
  assert.deepEqual(log.slice(2),ids.map(x=>"rivalries/"+x),"one exact root get per indexed Showdown, in career order");
  assert.equal(v.status,"partial");assert.deepEqual(v.model.coverage,{readable:0,indexed:501},"missing Showdowns are unavailable, never a shorter career");
  assert.equal(v.entries[0].code,"COMPLETED_RIVALRY_MISSING");
});

console.log("PASS closed-Showdown adapter contracts ("+cases+"/"+cases+" cases): completed and abandoned Showdowns from the session-free reader, witness totals, live-Showdown merge, stale pending exclusion, no backfill, unavailable never empty, two managers, pure frozen adapter, paged cached loader.");
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
