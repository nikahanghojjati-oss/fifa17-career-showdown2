'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createRequire}=require('node:module');
const {createHash,webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'../../../../..');
const Setup=require(root+'/js/sharedShowdownSetup.js');
const Catalog=require(root+'/js/sharedShowdownCatalog.js');
const Reader=require(root+'/js/sparkCompletedShowdownReader.js');
const Adapter=require(root+'/js/sharedClosedShowdownAdapter.js');
const Career=require(root+'/js/sharedCareerAnalytics.js');
const F=require(root+'/tests/support/active-showdown-fixtures.cjs');
const snapshots={};
let ledger=null;
let rid;
const sid='session_'+'b'.repeat(64),deviceId='device_'+'0'.repeat(32);
async function buildSetup(totalSeasons,slots){
 rid='pair_'+totalSeasons.toString(16).repeat(64);
 const protocol=await Setup.createProtocol({catalog:Catalog.catalog,cryptoImpl:webcrypto});let state=null;
 const roles=['playerOne','playerTwo'];
 const authority=role=>({rivalryId:rid,connectionState:'active',managerSlots:slots.map(s=>({...s,accountState:'active'})),actor:{...Object.fromEntries(['accountId','profileId','saveId'].map(k=>[k,slots.find(s=>s.slotId===role)[k]])),managerRole:role,deviceId,deviceState:'active'},session:{sessionId:sid,rivalryId:rid,state:'active',hostAccountId:slots[0].accountId,memberAccountIds:slots.map(s=>s.accountId),expiresAtEpochMs:Number.MAX_SAFE_INTEGER},nowEpochMs:0});
 for(const [i,type] of ['open','commit-league','commit-clubs','commit-length','confirm','confirm'].entries()){
  const operationId='setup_op_'+(i+1).toString(16).padStart(32,'0');
  const command=['commit-league','commit-clubs'].includes(type)?await protocol.prepareDraw({state,type,operationId}):{type,operationId,baseRevision:i,...(type==='commit-length'?{totalSeasons}:{}),...(type==='confirm'?{setupHash:await protocol.confirmationHash(state)}:{})};
  const next=await protocol.apply({state,authority:authority(i===5?roles[1]:roles[0]),command});assert.equal(next.ok,true);state=next.state;
 }
 ledger={schemaVersion:1,objectType:'sharedSetupLedger',rivalryId:rid,revision:6,phase:state.phase,coordinatorRole:state.coordinatorRole,operationIds:state.receipts.map((r,i)=>'setup_op_'+(i+1).toString(16).padStart(32,'0')),operationTypes:state.receipts.map(r=>r.type),baseRevisions:state.receipts.map((r,i)=>i),actorRoles:state.receipts.map(r=>r.actorRole),totalSeasons,confirmedRoles:state.confirmedRoles,activeSessionId:sid,updatedAt:0,updatedByDeviceId:deviceId};
 return {...state,rivalryId:rid};
}
function capture(kind,data){
 const total=data.totalSeasons;
 const snap=snapshots[total]??={docs:{[`rivalries/${rid}/sharedSetup/authoritative`]:ledger}};
 if(kind==='season'){
  const {resultState:r,commitState:c,seasonNumber:n}=data;
  const base=`rivalries/${rid}/seasonResults/season_${n}`;
  snap.docs[base]={schemaVersion:1,objectType:'sharedSeasonResults',rivalryId:rid,seasonNumber:n,runtimeRevision:r.runtimeRevision,phase:r.phase,revision:r.revision,publishedRoles:r.publishedRoles,operationIds:r.receipts.map(x=>x.operationId),operationHashes:r.receipts.map(x=>x.commandHash),baseRevisions:r.receipts.map(x=>x.baseRevision),actorRoles:r.receipts.map(x=>x.actorRole)};
  for(const role of ['playerOne','playerTwo']){const receipt=r.receipts.find(x=>x.actorRole===role);snap.docs[base+'/roles/'+role]={schemaVersion:1,objectType:'sharedSeasonResultRole',rivalryId:rid,seasonNumber:n,managerRole:role,result:r.results[role],operationId:receipt.operationId,commandHash:receipt.commandHash};}
  snap.docs[`rivalries/${rid}/seasonCommits/season_${n}`]={schemaVersion:1,objectType:'sharedSeasonCommit',rivalryId:rid,seasonNumber:n,runtimeRevision:c.runtimeRevision,phase:c.phase,revision:c.revision,resultsRevision:c.resultsRevision,results:c.results,acknowledgedRoles:c.acknowledgedRoles,operationIds:c.receipts.map(x=>x.operationId),operationHashes:c.receipts.map(x=>x.commandHash),baseRevisions:c.receipts.map(x=>x.baseRevision),actorRoles:c.receipts.map(x=>x.actorRole),activeSessionId:sid,updatedAt:0,updatedByDeviceId:deviceId};
 }else{
  const p=data.latestHistory;
  const dataValue={connectionState:'closed',managerSlots:p.managerSlots.map(s=>({...s,entitlementState:'active'})),authorizedAccountIds:p.managerSlots.map(s=>s.accountId),terminalClose:F.closed(p).terminalWitness,terminalProgress:{schemaVersion:1,runtimeRevision:'1.9.1-r18',totalSeasons:total,acceptedThroughSeason:total,managerTotals:{playerOne:p.managerRecords.playerOne.totalPoints,playerTwo:p.managerRecords.playerTwo.totalPoints},closedSessionRevision:4}};
  const canonical=v=>v&&typeof v==='object'?Array.isArray(v)?v.map(canonical):Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
  const contentHash='sha256:'+createHash('sha256').update(JSON.stringify(canonical({objectType:'rivalry',objectId:rid,revision:9,data:dataValue}))).digest('hex');
  snap.docs[`rivalries/${rid}`]={schemaVersion:1,objectType:'rivalry',objectId:rid,revision:9,lifecycleState:'live',contentHash,data:dataValue,tombstone:null};
  snap.expected=p;
 }
}
async function run(){
 const original=path.join(root,'tests/contracts/full-gameplay-lifecycle-contracts.cjs');
 let source=fs.readFileSync(original,'utf8');source=source.slice(0,source.indexOf('(async()=>{\n  const summaries=[];'));
 source=source.replace('const rivalryId=`pair_${"a".repeat(64)}`;','let rivalryId;');
 source=source.replace('const setup=setupFor(totalSeasons);','rivalryId="pair_"+totalSeasons.toString(16).repeat(64);const setup=await buildSetup(totalSeasons,managerSlots);');
 source=source.replace('const raw=seasonResults(seasonNumber);','const raw=[3,10].includes(totalSeasons)?areaResults(seasonNumber,totalSeasons):seasonResults(seasonNumber);');
 source=source.replace('sources.push({','capture("season",{totalSeasons,seasonNumber,resultState,commitState});\n    sources.push({');
 source=source.replace('assert.deepEqual(latestHistory.managerRecords.playerOne.club,"SC Freiburg");','assert.deepEqual(latestHistory.managerRecords.playerOne.club,setup.clubs.playerOne);');
 source=source.replace('assert.deepEqual(latestHistory.managerRecords.playerTwo.club,"Hertha BSC");','assert.deepEqual(latestHistory.managerRecords.playerTwo.club,setup.clubs.playerTwo);');
 source=source.replace('  return {\n    totalSeasons,','  capture("finish",{totalSeasons,latestHistory});\n  return {\n    totalSeasons,');
 const neutral=more=>({leaguePosition:5,leaguePoints:60,leagueGoals:55,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...more});
 const perfect=neutral({leaguePosition:1,leaguePoints:100,leagueGoals:100,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true});
 const areaResults=(n,total)=>({playerOne:total===3&&n===2||total===10&&n===10?perfect:neutral({}),playerTwo:total===3&&n===3?perfect:neutral({leaguePosition:total===3&&n===1?4:5})});
 const play=new Function('require','capture','buildSetup','areaResults',source+'\nreturn runOnePlan;')(createRequire(original),capture,buildSetup,areaResults);
 for(const total of [1,3,5,10]){
  await play(total);
  // Reopen only saved records, with none of the gameplay state left in memory.
  const snap=snapshots[total],docs=JSON.parse(JSON.stringify(snap.docs));
  const read=async role=>Reader.readCompletedShowdown({firestore:{},firebaseSdk:{doc:(_, ...p)=>p.join('/'),getDoc:async p=>({exists:()=>Object.hasOwn(docs,p),data:()=>docs[p]})},user:{uid:snap.expected.managerSlots.find(s=>s.slotId===role).accountId},rivalryId:rid,cryptoImpl:webcrypto});
  const a=await read('playerOne'),b=await read('playerTwo');
  assert.equal(a.status,'completed',JSON.stringify(a));assert.equal(b.status,'completed',JSON.stringify(b));
  assert.deepEqual(a.projection,snap.expected);assert.deepEqual(a.projection,b.projection);
  const model=Career.buildCareerModel(Adapter.buildClosedCareerInput({index:{status:'ready',rivalryIds:[rid]},reads:{[rid]:a},current:{indexStatus:'ready',showdowns:[],currentShowdownOnly:true}}));
  assert.equal(model.history.showdowns[0].seasons.length,total);assert.equal(model.managers.daniel.careerPoints,snap.expected.managerRecords.playerOne.totalPoints);
  console.log('PASS saved '+total+'-season Showdown reopened identically for Daniel and Nik '+JSON.stringify(a.final));
 }

}
module.exports={run,snapshots};
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
