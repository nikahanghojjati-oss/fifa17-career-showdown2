"use strict";
// G-11 contract: the DATA_CONTRACT_V1 fixtures in tests/fixtures/data-contract-v1 are exactly what the real model
// produces (K2), match the V1 field contract exactly (K3), never carry a rival's private inputs (K4), keep scoring
// unchanged (K5), agree across screens and managers (K6), bind through the G-4 seam (K7) and cover every state (K8).
// A field changes only through a relay message: change SPEC below in the same PR as that message, never alone.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.join(__dirname,"../..");
const Adapter=require(path.join(ROOT,"js/sharedActiveShowdownAdapter.js"));
const Seam=require(path.join(ROOT,"js/careerScreenSeam.js"));
const StartJoin=require(path.join(ROOT,"js/startJoinViewModel.js"));
const CONTRACT_VERSION="1.0";
const DIR="tests/fixtures/data-contract-v1";
const INTERIM="Current Showdown only. Career history is not yet available.";
const STATUS5=["loading","empty","unavailable","partial","ready"];
const MANAGERS=["daniel","nik"];
const TEAMS={premier_league:20,laliga:20,bundesliga:18,serie_a:20,ligue_1:20};
const INPUT_KEYS=["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"];
const REQUIRED_SCENARIOS=["empty-career","active-mid-season","finished-three-seasons","abandoned","tiebreak-finish","equal-position-tiebreaks","multi-showdown-career"];
let checks=0;
function check(name,fn){try{fn();checks+=1;}catch(error){console.error("FAIL "+name+": "+error.message);throw error;}}
const keysOf=o=>Object.keys(o);
function exact(o,keys,where){assert.ok(o&&typeof o==="object"&&!Array.isArray(o),where+" is not an object");assert.deepEqual(keysOf(o).slice().sort(),keys.slice().sort(),where+" keys");}
const isInt=v=>Number.isInteger(v);
const oneOf=(v,list,where)=>assert.ok(list.includes(v),where+" = "+JSON.stringify(v)+" not in "+JSON.stringify(list));
const intOrNull=(v,where)=>assert.ok(v===null||isInt(v),where+" int or null");
const numOrNull=(v,where)=>assert.ok(v===null||(typeof v==="number"&&Number.isFinite(v)),where+" number or null");
function walk(value,visit,trail="$"){visit(value,trail);if(value&&typeof value==="object")for(const [k,v] of Object.entries(value))walk(v,visit,trail+"."+k);}

// ---------- K1. Real provider shapes reach the adapter (regression for the unpaired identity guard) ----------
check("K1 unpaired real shape is none, not unavailable",()=>{
  // js/persistentNikDanielPair.js pairInitialize: an account with no pair link has managerRole:null and managerId:null.
  for(const viewer of MANAGERS){
    const identity={status:"ready",initialized:true,busy:false,online:true,managerId:viewer,registered:true};
    const pair={status:"unpaired",initialized:true,busy:false,managerRole:null,managerId:null,rivalryId:null,connectionState:null,capability:null};
    assert.equal(Adapter.classifyCurrentShowdown({identity,pair}),"none",viewer);
    assert.equal(Adapter.homeView({identity,pair}).status,"ready",viewer);
    assert.equal(Adapter.homeView({identity,pair}).continue.state,"unpaired",viewer);
    // The guard still catches a real mismatch: Nik's identity on Daniel's pair link.
    assert.equal(Adapter.classifyCurrentShowdown({identity:{...identity,managerId:"nik"},pair:{...pair,status:"paired",managerRole:"playerOne",managerId:"daniel",rivalryId:"pair_"+"1".repeat(64),connectionState:"active"}}),"unavailable");
  }
});

const G=require(path.join(ROOT,"tests/support/data-contract-v1-fixtures.cjs"));

// ---------- K2. Generated from the model, never drifted ----------
check("K2 committed fixtures equal a fresh run of the generator",()=>{
  const problems=G.diffFixtures(ROOT);
  assert.deepEqual(problems,[],"fixtures drifted from the model; run node tests/support/data-contract-v1-fixtures.cjs --write and commit");
});
check("K2 generator is deterministic and uses the real modules",()=>{
  assert.deepEqual(G.buildDataContractFixtures(),G.buildDataContractFixtures());
  const src=fs.readFileSync(path.join(ROOT,"tests/support/data-contract-v1-fixtures.cjs"),"utf8");
  assert.doesNotMatch(src,/Date\.now|new Date|Math\.random|process\.env|localStorage|sessionStorage|indexedDB/);
  for(const call of ["History.buildProjection(","Adapter.buildActiveShowdownViews(","Adapter.seasonResultsView(","Adapter.careerInput(","Career.buildCareerModel(","StartJoin.buildStartJoinViewModel(","StartJoin.navLockState("])assert.ok(src.includes(call),call);
});
const files=G.committedFixtureFiles(ROOT);
const index=JSON.parse(files[DIR+"/index.json"]);
const nav=JSON.parse(files[DIR+"/nav.json"]);
const fixtures=index.scenarios.map(row=>({row,fx:JSON.parse(files[DIR+"/"+row.file])}));
check("K2 index lists every file with its hash",()=>{
  exact(index,["schema","contractVersion","generator","regenerate","screens","scenarios","nav"],"index");
  assert.equal(index.schema,G.SCHEMA);assert.equal(index.contractVersion,CONTRACT_VERSION);
  assert.deepEqual(Object.keys(files).sort(),[DIR+"/index.json",DIR+"/nav.json",...index.scenarios.map(r=>DIR+"/"+r.file)].sort());
  const crypto=require("node:crypto"),sha=t=>"sha256:"+crypto.createHash("sha256").update(t).digest("hex");
  for(const r of index.scenarios){exact(r,["id","file","summary","careerStatus","classification","sha256"],"index row "+r.id);assert.equal(r.file,r.id+".json");assert.equal(r.sha256,sha(files[DIR+"/"+r.file]),r.id);}
  assert.equal(index.nav.sha256,sha(files[DIR+"/nav.json"]));
});

// ---------- K3. DATA_CONTRACT_V1 field contract (exact keys, types, enums, bounds) ----------
// Keys outside V1 are listed with their source; any other key, or a missing key, fails.
const SPEC={
  fixture:["schema","contractVersion","scenario","summary","generator","checkSource","career","careerInterim","viewers"],
  viewer:["classification","home","startJoin","seasonResults","seasonResultsBySeason","finalWinner","rivalry"], // classification: fixture metadata (G-5 enum)
  home:["status","viewerRole","continue"], // V1 §1; tiles.* not yet produced (G-13)
  continue:["state","leagueId","clubs","season","totalSeasons","score"],
  startJoin:["status","viewerRole","busy","pairing","session","abandonShowdown","forgetThisDevice","primaryActions","moreActions"], // V1 §2 + G2V-005 item 2
  action:["available","enabled","provider","args","confirm","confirmedByProvider"], // G2V-005 item 2
  pairingActions:["createCode","join","copyCode","newCode","checkStatus","retry"],
  sessionActions:["host","join","refresh","revoke","close","forget"],
  seasonResults:["status","season","phase","viewerRole","inputs","breakdown","winner","tiebreak"], // V1 §3 + G-5 §4 (season, viewerRole)
  breakdown:["championsLeague","leagueTitle","domesticCup","performanceBonus","awardsBonus","total"], // V1 §3, nested per manager (G2V-005 item 1)
  finalWinner:["status","state","totals","winner","margin","seasonsPlayed","trophies"], // V1 §4
  trophies:["championsLeague","leagueTitles","domesticCups","total"],
  rivalry:["status","leagueId","clubs","season","totalSeasons","score","managers","seasons","transfers"], // V1 §5
  rivalryManager:["seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","bestSeasonScore"],
  rivalrySeason:["season","score","winner","leaguePosition","leaguePoints","leagueGoals"],
  career:["status","interimLabel","coverage","managers","biggestShowdownWin","trophyRoom","history"], // V1 §0, §6, §7, §8
  careerManager:["careerPoints","seasons","seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","performanceBonuses","awardsBonuses","bestSeasonScore","bestLeaguePoints","bestLeagueGoals","bestLeaguePosition","averageSeasonScore","averageLeaguePoints","averageLeagueGoals","showdowns"],
  historyRow:["number","rivalryId","status","leagueId","clubs","seasonsPlayed","totalSeasons","totals","winner","seasons"], // V1 §8 + rivalryId (G-3 ref target)
  historySeason:["season","score","winner","tiebreak","leaguePosition","leaguePoints","leagueGoals"],
  record:["label","manager","value","ref"],
  recordLabels:["Highest season score","Highest league points","Highest league goals","Biggest Showdown win","Most perfect seasons"],
  checkSource:["ref","totalSeasons","leagueId","state","seasons"]
};
const pairOf=(v,where,test)=>{exact(v,MANAGERS,where);for(const m of MANAGERS)test(v[m],where+"."+m);};
function league(v,where,nullable=true){if(nullable&&v===null)return;oneOf(v,Object.keys(TEAMS),where);}
function seasonsTotal(v,where){if(v===null)return;oneOf(v,[1,3,5,10],where);}
function input(r,where,leagueId){
  if(r===null)return;exact(r,INPUT_KEYS,where);const teams=TEAMS[leagueId]||20;
  assert.ok(isInt(r.leaguePosition)&&r.leaguePosition>=1&&r.leaguePosition<=teams,where+".leaguePosition bound");
  assert.ok(isInt(r.leaguePoints)&&r.leaguePoints>=0&&r.leaguePoints<=(teams-1)*6,where+".leaguePoints bound");
  assert.ok(isInt(r.leagueGoals)&&r.leagueGoals>=0&&r.leagueGoals<=300,where+".leagueGoals bound");
  for(const k of INPUT_KEYS.slice(3))assert.equal(typeof r[k],"boolean",where+"."+k);
}
function action(a,where){exact(a,SPEC.action,where);assert.equal(typeof a.available,"boolean");assert.equal(typeof a.enabled,"boolean");assert.equal(typeof a.confirmedByProvider,"boolean");assert.ok(a.provider===null||typeof a.provider==="string",where);assert.ok(a.confirm===null||typeof a.confirm==="string",where);if(!a.available)assert.deepEqual(a,{available:false,enabled:false,provider:null,args:null,confirm:null,confirmedByProvider:false},where);}
function validateHome(h,where){
  exact(h,SPEC.home,where);oneOf(h.status,STATUS5,where+".status");oneOf(h.viewerRole,[...MANAGERS,null],where+".viewerRole");
  const c=h.continue;exact(c,SPEC.continue,where+".continue");oneOf(c.state,["paired","waiting","recovery-required","unpaired",null],where+".continue.state");
  league(c.leagueId,where+".leagueId");if(c.clubs!==null)pairOf(c.clubs,where+".clubs",(v,w)=>assert.equal(typeof v,"string",w));
  intOrNull(c.season,where+".season");seasonsTotal(c.totalSeasons,where+".totalSeasons");if(c.score!==null)pairOf(c.score,where+".score",(v,w)=>assert.ok(isInt(v)&&v>=0,w));
}
function validateStartJoin(s,where){
  exact(s,SPEC.startJoin,where);oneOf(s.status,["loading","unavailable","ready"],where+".status");oneOf(s.viewerRole,[...MANAGERS,null],where);assert.equal(typeof s.busy,"boolean");
  exact(s.pairing,["state","code","actions"],where+".pairing");oneOf(s.pairing.state,["none","code-created","waiting-for-nik","paired"],where+".pairing.state");
  assert.ok(s.pairing.code===null||typeof s.pairing.code==="string");exact(s.pairing.actions,SPEC.pairingActions,where+".pairing.actions");for(const k of SPEC.pairingActions)action(s.pairing.actions[k],where+".pairing."+k);
  exact(s.session,["state","actions"],where+".session");oneOf(s.session.state,["open","active","revoked","closed","expired",null],where+".session.state");
  exact(s.session.actions,SPEC.sessionActions,where+".session.actions");for(const k of SPEC.sessionActions)action(s.session.actions[k],where+".session."+k);
  action(s.abandonShowdown,where+".abandonShowdown");action(s.forgetThisDevice,where+".forgetThisDevice");
  const ids=[...SPEC.pairingActions.map(k=>"pairing."+k),...SPEC.sessionActions.map(k=>"session."+k),"abandonShowdown","forgetThisDevice"];
  for(const id of [...s.primaryActions,...s.moreActions])oneOf(id,ids,where+" action id");
}
function validateSeasonResults(r,where,leagueId){
  exact(r,SPEC.seasonResults,where);oneOf(r.status,STATUS5,where+".status");intOrNull(r.season,where+".season");
  oneOf(r.phase,["entering","waiting-for-rival","results-ready","committed",null],where+".phase");oneOf(r.viewerRole,[...MANAGERS,null],where+".viewerRole");
  if(r.inputs!==null)pairOf(r.inputs,where+".inputs",(v,w)=>input(v,w,leagueId));
  if(r.breakdown!==null)pairOf(r.breakdown,where+".breakdown",(b,w)=>{exact(b,SPEC.breakdown,w);oneOf(b.championsLeague,[0,5],w);oneOf(b.leagueTitle,[0,3],w);oneOf(b.domesticCup,[0,1],w);oneOf(b.performanceBonus,[0,1],w);oneOf(b.awardsBonus,[0,1],w);assert.equal(b.total,b.championsLeague+b.leagueTitle+b.domesticCup+b.performanceBonus+b.awardsBonus,w+".total");assert.ok(b.total<=11);});
  oneOf(r.winner,[...MANAGERS,"draw",null],where+".winner");oneOf(r.tiebreak,["none","league-position","league-points","draw",null],where+".tiebreak");
  if(r.phase!=="committed")assert.ok(r.breakdown===null&&r.winner===null&&r.tiebreak===null,where+" breakdown/winner/tiebreak only once committed");
}
function validateFinal(f,where){
  exact(f,SPEC.finalWinner,where);oneOf(f.status,STATUS5,where+".status");oneOf(f.state,["completion-pending","completed",null],where+".state");
  if(f.totals!==null){pairOf(f.totals,where+".totals",(v,w)=>assert.ok(isInt(v)&&v>=0,w));const a=f.totals.daniel,b=f.totals.nik;assert.equal(f.winner,a>b?"daniel":b>a?"nik":"draw",where+" totals-only winner");assert.equal(f.margin,Math.abs(a-b),where+".margin");}
  else assert.ok(f.winner===null&&f.margin===null,where);
  intOrNull(f.seasonsPlayed,where+".seasonsPlayed");
  if(f.trophies!==null)pairOf(f.trophies,where+".trophies",(t,w)=>{exact(t,SPEC.trophies,w);assert.equal(t.total,t.championsLeague+t.leagueTitles+t.domesticCups,w);});
}
function validateRivalry(v,where){
  exact(v,SPEC.rivalry,where);oneOf(v.status,STATUS5,where+".status");league(v.leagueId,where+".leagueId");intOrNull(v.season,where+".season");seasonsTotal(v.totalSeasons,where+".totalSeasons");
  if(v.clubs!==null)pairOf(v.clubs,where+".clubs",(c,w)=>assert.equal(typeof c,"string",w));if(v.score!==null)pairOf(v.score,where+".score",(s,w)=>assert.ok(isInt(s),w));
  if(v.managers!==null)pairOf(v.managers,where+".managers",(m,w)=>{exact(m,SPEC.rivalryManager,w);for(const k of SPEC.rivalryManager)k==="bestSeasonScore"?intOrNull(m[k],w+"."+k):assert.ok(isInt(m[k]),w+"."+k);});
  assert.ok(Array.isArray(v.seasons));v.seasons.forEach((s,i)=>{exact(s,SPEC.rivalrySeason,where+".seasons["+i+"]");oneOf(s.winner,[...MANAGERS,"draw"],where);for(const k of ["leaguePosition","leaguePoints","leagueGoals"])pairOf(s[k],where+"."+k,(x,w)=>assert.ok(isInt(x),w));});
  exact(v.transfers,["status"],where+".transfers");oneOf(v.transfers.status,STATUS5,where+".transfers.status");
}
function validateCareer(c,where){
  exact(c,SPEC.career,where);oneOf(c.status,STATUS5,where+".status");oneOf(c.interimLabel,[INTERIM,null],where+".interimLabel");
  exact(c.coverage,["readable","indexed"],where+".coverage");intOrNull(c.coverage.readable,where);intOrNull(c.coverage.indexed,where);
  pairOf(c.managers,where+".managers",(m,w)=>{exact(m,SPEC.careerManager,w);for(const k of SPEC.careerManager){if(k==="showdowns"){exact(m.showdowns,["completed","wins","draws","losses"],w+".showdowns");for(const x of Object.values(m.showdowns))intOrNull(x,w);}else if(k.startsWith("average"))numOrNull(m[k],w+"."+k);else intOrNull(m[k],w+"."+k);}});
  if(c.biggestShowdownWin!==null){exact(c.biggestShowdownWin,["manager","margin","showdownRef"],where+".biggestShowdownWin");oneOf(c.biggestShowdownWin.manager,MANAGERS,where);assert.ok(isInt(c.biggestShowdownWin.margin)&&c.biggestShowdownWin.margin>0);}
  exact(c.trophyRoom,["cabinet","standings","records"],where+".trophyRoom");pairOf(c.trophyRoom.cabinet,where+".cabinet",(x,w)=>exact(x,["championsLeagues","leagueTitles","domesticCups","totalTrophies"],w));
  for(const row of c.trophyRoom.standings){assert.ok(keysOf(row).every(k=>["manager","careerPoints","seasonWins","level"].includes(k)),where+" standings keys");oneOf(row.manager,MANAGERS,where);if("level" in row)assert.equal(row.level,true);}
  if(["ready","partial","empty"].includes(c.status))assert.deepEqual(c.trophyRoom.records.map(r=>r.label),SPEC.recordLabels,where+" record labels");
  for(const r of c.trophyRoom.records){exact(r,SPEC.record,where+".record");oneOf(r.manager,[...MANAGERS,"shared"],where);numOrNull(r.value,where);}
  exact(c.history,["showdowns"],where+".history");
  c.history.showdowns.forEach((row,i)=>{const w=where+".history["+i+"]";exact(row,SPEC.historyRow,w);assert.equal(row.number,i+1,w+".number");oneOf(row.status,["completed","in-progress","completion-pending","abandoned","unavailable"],w+".status");
    if(row.status==="abandoned"||row.status==="unavailable"){assert.deepEqual([row.leagueId,row.clubs,row.seasonsPlayed,row.totalSeasons,row.totals,row.winner,row.seasons],[null,null,null,null,null,null,[]],w+" status-only row");return;}
    league(row.leagueId,w,false);seasonsTotal(row.totalSeasons,w);pairOf(row.totals,w+".totals",(x,ww)=>assert.ok(isInt(x),ww));oneOf(row.winner,row.status==="in-progress"?[null]:[...MANAGERS,"draw"],w+".winner");
    row.seasons.forEach((s,j)=>{exact(s,SPEC.historySeason,w+".seasons["+j+"]");oneOf(s.tiebreak,["none","league-position","league-points","draw"],w);});
  });
}
check("K3 nav fixture matches V1 §10",()=>{
  exact(nav,["schema","contractVersion","scenario","summary","generator","lockText","screens"],"nav");assert.equal(nav.lockText,"Finish this step first");
  assert.deepEqual(keysOf(nav.screens),G.SCREEN_IDS);
  for(const [id,s] of Object.entries(nav.screens)){exact(s,["locked","reason"],"nav."+id);oneOf(s.reason,["transfer-window","season-entry","setup",null],"nav."+id);assert.equal(s.locked,s.reason!==null);assert.deepEqual(s,{...StartJoin.navLockState(id)});}
  assert.deepEqual(Object.entries(nav.screens).filter(([,s])=>s.locked).map(([id])=>id).sort(),["clubWheelScreen","leagueWheelScreen","seasonEntry","transferChallenge"]);
});
for(const {row,fx} of fixtures){
  check("K3 "+row.id+" matches DATA_CONTRACT_V1",()=>{
    exact(fx,SPEC.fixture,row.id);assert.equal(fx.schema,G.SCHEMA);assert.equal(fx.contractVersion,CONTRACT_VERSION);assert.equal(fx.scenario,row.id);
    validateCareer(fx.career,row.id+".career");validateCareer(fx.careerInterim,row.id+".careerInterim");
    assert.equal(fx.career.interimLabel,null,"launch-state career has no interim label");assert.equal(fx.careerInterim.interimLabel,INTERIM);
    exact(fx.viewers,MANAGERS,row.id+".viewers");
    for(const m of MANAGERS){const v=fx.viewers[m],w=row.id+"."+m;exact(v,SPEC.viewer,w);
      oneOf(v.classification,["loading","unavailable","none","pending","abandoned","active","completion-pending","completed"],w+".classification");
      validateHome(v.home,w+".home");validateStartJoin(v.startJoin,w+".startJoin");validateFinal(v.finalWinner,w+".finalWinner");validateRivalry(v.rivalry,w+".rivalry");
      const leagueId=v.rivalry.leagueId||v.home.continue.leagueId;
      validateSeasonResults(v.seasonResults,w+".seasonResults",leagueId);v.seasonResultsBySeason.forEach((r,i)=>{validateSeasonResults(r,w+".seasonResultsBySeason["+i+"]",leagueId);assert.equal(r.season,i+1);});
      if(v.viewerRole!==undefined)assert.fail("viewerRole belongs inside views");
      for(const view of [v.home,v.startJoin,v.seasonResults])if(view.viewerRole!==null)assert.equal(view.viewerRole,m,w+" viewerRole");
    }
    fx.checkSource.forEach((sd,i)=>{const w=row.id+".checkSource["+i+"]";exact(sd,SPEC.checkSource,w);league(sd.leagueId,w,false);seasonsTotal(sd.totalSeasons,w);oneOf(sd.state,["completed","active","completion-pending","abandoned"],w);assert.ok(sd.seasons.length<=sd.totalSeasons);sd.seasons.forEach((s,j)=>pairOf(s,w+".seasons["+j+"]",(r,ww)=>input(r,ww,sd.leagueId)));});
  });
}

// ---------- K4. Privacy: no ids, no codes, no rival's unpublished inputs ----------
const FORBIDDEN_KEYS=["accountId","profileId","saveId","deviceId","providerSaveId","providerProfileId","sessionId","capability","managerSlots","managerRecords","projection","terminalWitness","opponentResult","ownResult","allResults","publishedRoles","operationIds","operationHashes","acceptedRevisionKey","resultsContentHash","contentHash","email","uid"];
check("K4 no private keys or ids in any fixture",()=>{
  for(const [file,text] of Object.entries(files)){
    walk(JSON.parse(text),(v,trail)=>{
      if(v&&typeof v==="object"&&!Array.isArray(v))for(const k of keysOf(v))assert.ok(!FORBIDDEN_KEYS.includes(k),file+" "+trail+"."+k);
      if(typeof v==="string"){assert.doesNotMatch(v,/^(acct|profile|save|device|session)_/,file+" "+trail);assert.doesNotMatch(v,/@/,file+" "+trail);}
    });
  }
});
check("K4 the pairing code appears only in Daniel's own Start/Join view after he created it",()=>{
  for(const {row,fx} of fixtures){
    walk(fx,(v,trail)=>{if(typeof v==="string"&&v.startsWith("CMS17-"))assert.equal(trail,"$.viewers.daniel.startJoin.pairing.code",row.id+" "+trail);});
    assert.equal(fx.viewers.nik.startJoin.pairing.code,null,row.id);
  }
  const code=fixtures.find(f=>f.row.id==="pairing-code-created").fx;assert.match(code.viewers.daniel.startJoin.pairing.code,/^CMS17-pair_[0-9a-f]{64}$/);assert.equal(code.viewers.daniel.startJoin.pairing.state,"code-created");
});
check("K4 a rival's unpublished season inputs never reach the other manager",()=>{
  let proved=0;
  for(const sc of G.scenarios()){
    if(!sc.sentinel)continue;
    const fx=fixtures.find(f=>f.row.id===sc.id).fx,{owner,rival,value}=sc.sentinel;
    let inOwner=0;walk(fx.viewers[owner],v=>{if(v===value)inOwner+=1;});assert.ok(inOwner>0,sc.id+" sentinel must be visible to its owner (proves the walk)");
    for(const part of [fx.viewers[rival],fx.career,fx.careerInterim,fx.checkSource])walk(part,(v,trail)=>assert.notEqual(v,value,sc.id+" sentinel leaked at "+trail));
    const cur=fx.viewers[rival].seasonResults;assert.equal(cur.inputs[owner],null,sc.id+" rival sees owner inputs");assert.equal(cur.phase,"entering");
    proved+=1;
  }
  assert.ok(proved>=1,"at least one scenario carries an unpublished-input sentinel");
  for(const {row,fx} of fixtures)for(const m of MANAGERS){const r=fx.viewers[m].seasonResults,other=m==="daniel"?"nik":"daniel";
    if(r.phase==="entering"||r.phase==="waiting-for-rival")assert.equal(r.inputs[other],null,row.id+" "+m+" sees rival input before results-ready");}
});
check("K4 checkSource holds only accepted seasons (both managers already saw them)",()=>{
  for(const {row,fx} of fixtures){
    const rows=fx.career.history.showdowns.filter(r=>r.seasons.length);
    const counted=fx.checkSource.filter(s=>s.state!=="abandoned");
    assert.deepEqual(counted.map(s=>s.seasons.length),rows.map(r=>r.seasons.length),row.id);
  }
});

// ---------- K5. Scoring never changes (independent re-derivation from checkSource) ----------
function score(r){const b={championsLeague:r.championsLeague?5:0,leagueTitle:r.leaguePosition===1?3:0,domesticCup:r.domesticCup?1:0,performanceBonus:(r.leaguePoints>=100||r.leagueGoals>=100)?1:0,awardsBonus:(r.topScorer||r.topAssist)?1:0};b.total=b.championsLeague+b.leagueTitle+b.domesticCup+b.performanceBonus+b.awardsBonus;return b;}
function seasonWinner(d,n){const a=score(d).total,b=score(n).total;if(a!==b)return [a>b?"daniel":"nik","none"];if(d.leaguePosition!==n.leaguePosition)return [d.leaguePosition<n.leaguePosition?"daniel":"nik","league-position"];if(d.leaguePoints!==n.leaguePoints)return [d.leaguePoints>n.leaguePoints?"daniel":"nik","league-points"];return ["draw","draw"];}
check("K5 every season score, winner, tiebreak and total re-derives from the season facts",()=>{
  for(const {row,fx} of fixtures){
    const rows=fx.career.history.showdowns.filter(r=>r.seasons.length),srcs=fx.checkSource.filter(s=>s.state!=="abandoned");
    rows.forEach((hr,i)=>{const src=srcs[i];assert.equal(hr.leagueId,src.leagueId);assert.equal(hr.totalSeasons,src.totalSeasons);let td=0,tn=0;
      hr.seasons.forEach((s,j)=>{const {daniel:d,nik:n}=src.seasons[j],[w,t]=seasonWinner(d,n);assert.deepEqual(s.score,{daniel:score(d).total,nik:score(n).total},row.id+" score");assert.equal(s.winner,w,row.id+" winner");assert.equal(s.tiebreak,t,row.id+" tiebreak");assert.deepEqual(s.leaguePosition,{daniel:d.leaguePosition,nik:n.leaguePosition});td+=score(d).total;tn+=score(n).total;});
      assert.deepEqual(hr.totals,{daniel:td,nik:tn},row.id+" totals");if(hr.status==="completed"||hr.status==="completion-pending")assert.equal(hr.winner,td>tn?"daniel":tn>td?"nik":"draw",row.id+" final is totals only");});
    for(const m of MANAGERS)for(const r of fx.viewers[m].seasonResultsBySeason)if(r.phase==="committed")for(const who of MANAGERS)assert.deepEqual(r.breakdown[who],score(r.inputs[who]),row.id+" breakdown");
  }
  const perfect=score({leaguePosition:1,leaguePoints:101,leagueGoals:104,championsLeague:true,domesticCup:true,topScorer:true,topAssist:true});assert.equal(perfect.total,11);assert.equal(perfect.performanceBonus,1);assert.equal(perfect.awardsBonus,1);
});
check("K5 career totals are sums of counted seasons; abandoned counts for nothing",()=>{
  for(const {row,fx} of fixtures){if(!["ready","partial"].includes(fx.career.status))continue;
    for(const m of MANAGERS){const rows=fx.career.history.showdowns.filter(r=>r.status!=="abandoned"&&r.status!=="unavailable");
      assert.equal(fx.career.managers[m].careerPoints,rows.reduce((t,r)=>t+r.totals[m],0),row.id+" careerPoints "+m);
      assert.equal(fx.career.managers[m].seasons,rows.reduce((t,r)=>t+r.seasons.length,0),row.id+" seasons "+m);
      const completed=rows.filter(r=>r.status==="completed");assert.equal(fx.career.managers[m].showdowns.completed,completed.length,row.id);
      assert.equal(fx.career.managers[m].showdowns.wins,completed.filter(r=>r.winner===m).length,row.id+" wins");}}
  const ab=fixtures.find(f=>f.row.id==="abandoned").fx;assert.equal(ab.career.managers.nik.perfectSeasons,0);assert.equal(ab.career.managers.nik.bestSeasonScore,null);assert.equal(ab.career.managers.nik.careerPoints,0);
});

// ---------- K6. Same numbers on every screen and on both phones ----------
const COUNTED=["active","completion-pending","completed"];
check("K6 home, rivalry, final winner and history agree for the current Showdown",()=>{
  for(const {row,fx} of fixtures)for(const m of MANAGERS){const v=fx.viewers[m];if(!COUNTED.includes(v.classification)||v.rivalry.status!=="ready")continue;
    const cur=fx.careerInterim.history.showdowns[0];
    assert.deepEqual(v.rivalry.score,cur.totals,row.id+" rivalry vs history");
    if(v.home.continue.score!==null)assert.deepEqual(v.home.continue.score,v.rivalry.score,row.id+" home vs rivalry");
    if(v.finalWinner.totals!==null)assert.deepEqual(v.finalWinner.totals,v.rivalry.score,row.id+" final vs rivalry");
    assert.deepEqual(v.rivalry.seasons,cur.seasons.map(({tiebreak,...rest})=>rest),row.id+" rivalry seasons vs history");
    for(const k of SPEC.rivalryManager)for(const who of MANAGERS)assert.equal(v.rivalry.managers[who][k],fx.careerInterim.managers[who][k],row.id+" "+k);
    v.seasonResultsBySeason.filter(r=>r.phase==="committed").forEach(r=>{const s=v.rivalry.seasons[r.season-1];assert.deepEqual({daniel:r.breakdown.daniel.total,nik:r.breakdown.nik.total},s.score);assert.equal(r.winner,s.winner);});
  }
});
check("K6 Daniel and Nik see identical shared numbers; only their own role differs",()=>{
  const strip=v=>JSON.parse(JSON.stringify(v),(k,x)=>k==="viewerRole"?undefined:x);
  for(const {row,fx} of fixtures){const d=fx.viewers.daniel,n=fx.viewers.nik;
    if(d.classification!==n.classification)continue; // pairing-code-created: Nik has no Showdown yet
    for(const k of ["rivalry","finalWinner"])assert.deepEqual(d[k],n[k],row.id+" "+k);
    assert.deepEqual(strip(d.home),strip(n.home),row.id+" home");
    assert.deepEqual(d.seasonResultsBySeason.filter(r=>r.phase==="committed").map(strip),n.seasonResultsBySeason.filter(r=>r.phase==="committed").map(strip),row.id+" committed seasons");
    if(d.seasonResults.phase==="results-ready")assert.deepEqual(strip(d.seasonResults),strip(n.seasonResults),row.id+" results-ready");
  }
});
check("K6 one-Showdown career equals the adapter path (interim label aside)",()=>{
  for(const {row,fx} of fixtures){
    const single=fx.career.history.showdowns.length<=1&&fx.checkSource.length<=1&&row.id!=="partial-career"&&row.id!=="pairing-code-created";
    if(!single)continue;const {interimLabel:a,...career}=fx.career,{interimLabel:b,...interim}=fx.careerInterim;
    assert.deepEqual(career,interim,row.id);
  }
});

// ---------- K7. Fixtures bind through the G-4 career screen seam without degrading ----------
check("K7 careerScreenView keeps each fixture's status",()=>{
  for(const {row,fx} of fixtures){
    for(const model of [fx.career,fx.careerInterim])for(const screen of ["careerStatistics","trophyRoom","legacy"])assert.equal(Seam.careerScreenView(screen,model).status,model.status,row.id+" "+screen);
    if(fx.careerInterim.history.showdowns.length===1&&["ready","partial"].includes(fx.careerInterim.status))assert.equal(Seam.careerScreenView("rivalryStatistics",fx.careerInterim).status,fx.careerInterim.status,row.id+" rivalryStatistics");
  }
});

// ---------- K8. Coverage of the states Team V designs ----------
check("K8 required scenarios and every state are present",()=>{
  const ids=fixtures.map(f=>f.row.id);for(const id of REQUIRED_SCENARIOS)assert.ok(ids.includes(id),id);
  const seen=(fn)=>new Set(fixtures.flatMap(fn));
  const careerStatuses=seen(f=>[f.fx.career.status]);for(const s of STATUS5)assert.ok(careerStatuses.has(s),"career status "+s);
  const phases=seen(f=>MANAGERS.flatMap(m=>[f.fx.viewers[m].seasonResults.phase,...f.fx.viewers[m].seasonResultsBySeason.map(r=>r.phase)]));for(const p of ["entering","waiting-for-rival","results-ready","committed"])assert.ok(phases.has(p),"phase "+p);
  const states=seen(f=>[f.fx.viewers.daniel.finalWinner.state]);for(const s of ["completion-pending","completed"])assert.ok(states.has(s),"final "+s);
  const tiebreaks=seen(f=>f.fx.career.history.showdowns.flatMap(r=>r.seasons.map(s=>s.tiebreak)));for(const t of ["none","league-position","league-points","draw"])assert.ok(tiebreaks.has(t),"tiebreak "+t);
  const rows=seen(f=>[...f.fx.career.history.showdowns,...f.fx.careerInterim.history.showdowns].map(r=>r.status));for(const s of ["completed","in-progress","completion-pending","abandoned","unavailable"])assert.ok(rows.has(s),"history "+s);
  const winners=seen(f=>[f.fx.viewers.daniel.finalWinner.winner]);for(const w of ["daniel","draw"])assert.ok(winners.has(w),"final winner "+w);
  const multi=fixtures.find(f=>f.row.id==="multi-showdown-career").fx;assert.ok(multi.career.managers.daniel.showdowns.wins>=1&&multi.career.managers.nik.showdowns.wins>=1,"both managers win a Showdown");
  const pairing=seen(f=>MANAGERS.map(m=>f.fx.viewers[m].startJoin.pairing.state));for(const s of ["none","code-created","paired"])assert.ok(pairing.has(s),"pairing "+s);
  const tie=fixtures.find(f=>f.row.id==="tiebreak-finish").fx;assert.equal(tie.viewers.daniel.finalWinner.winner,"draw");assert.equal(tie.viewers.daniel.finalWinner.margin,0);
});

check("K8 one league table: distinct positions, consistent points, one winner per trophy (Team V PRODUCT_TRUTH)",()=>{
  for(const {row,fx} of fixtures){if(row.id==="equal-position-tiebreaks")continue;
    for(const sd of fx.checkSource)sd.seasons.forEach(({daniel:d,nik:n},i)=>{const w=row.id+" "+sd.ref+" S"+(i+1);
      assert.notEqual(d.leaguePosition,n.leaguePosition,w+" equal positions");
      if(d.leaguePoints!==n.leaguePoints)assert.equal(d.leaguePosition<n.leaguePosition,d.leaguePoints>n.leaguePoints,w+" higher position has fewer points");
      for(const f of ["championsLeague","domesticCup","topScorer","topAssist"])assert.ok(!(d[f]&&n[f]),w+" both have "+f);});}
  const eq=fixtures.find(f=>f.row.id==="equal-position-tiebreaks").fx;assert.deepEqual(eq.career.history.showdowns[0].seasons.map(s=>s.tiebreak),["league-points","draw","none"]);
});

console.log("PASS data contract v1 fixtures contracts ("+checks+" checks, "+fixtures.length+" scenarios + nav): real provider shapes, generated from the model, V1 fields, privacy, scoring, cross-screen agreement, seam binding, state coverage.");
