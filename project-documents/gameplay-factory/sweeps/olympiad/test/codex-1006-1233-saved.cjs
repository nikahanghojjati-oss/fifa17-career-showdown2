'use strict';
// Saved-game examples made through the game's season rules; no game code changes.
const path=require('node:path'),ROOT=path.resolve(__dirname,'../../../../..');
process.chdir(ROOT);
const assert=require('node:assert/strict'),{webcrypto,createHash}=require('node:crypto');
const Setup=require(path.join(ROOT,"js/sharedShowdownSetup.js")),Catalog=require(path.join(ROOT,"js/sharedShowdownCatalog.js")).catalog;
const Results=require(path.join(ROOT,"js/sharedSeasonResults.js")),Commit=require(path.join(ROOT,"js/sharedSeasonCommit.js")),Score=require(path.join(ROOT,"js/sharedCanonicalScoring.js"));
const Reader=require(path.join(ROOT,"js/sparkCompletedShowdownReader.js")),History=require(path.join(ROOT,"js/sharedHistoryConvergence.js"));
const Pair=require(path.join(ROOT,"js/persistentNikDanielPair.js")),Closed=require(path.join(ROOT,"js/sharedClosedShowdownAdapter.js")),Career=require(path.join(ROOT,"js/sharedCareerAnalytics.js"));
const F=require(path.join(ROOT,"tests/support/active-showdown-fixtures.cjs"));
const base=require(path.join(ROOT,"tests/fixtures/shared-showdown-setup.cjs"));
const clone=x=>JSON.parse(JSON.stringify(x));
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const hash=x=>'sha256:'+createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
let seq=0;const op=prefix=>prefix+(++seq).toString(16).padStart(32,'0');
async function make(totalSeasons,seed='a',outcome='draw'){
 const rivalryId='pair_'+seed.repeat(64),authority=base.authority();authority.rivalryId=rivalryId;authority.session.rivalryId=rivalryId;
 const slots=authority.managerSlots.map(({accountState,...s})=>s),sessionId=authority.session.sessionId;
 const actor=role=>{const a=clone(authority);a.actor={...a.actor,managerRole:role,accountId:slots.find(s=>s.slotId===role).accountId,profileId:slots.find(s=>s.slotId===role).profileId,saveId:slots.find(s=>s.slotId===role).saveId};return a;};
 const protocol=await Setup.createProtocol({catalog:Catalog,cryptoImpl:webcrypto});let setup=null;const commands=[];
 for(const type of ['open','commit-league','commit-clubs','commit-length','confirm','confirm']){
  const role=commands.length===5?'playerTwo':'playerOne';let command={type,operationId:op('setup_op_'),baseRevision:commands.length};
  if(type==='commit-league'||type==='commit-clubs')command=await protocol.prepareDraw({state:setup,type,operationId:command.operationId});
  if(type==='commit-length')command.totalSeasons=totalSeasons;
  if(type==='confirm')command.setupHash=await protocol.confirmationHash(setup);
  const applied=await protocol.apply({state:setup,authority:actor(role),command});assert.ok(applied.ok,JSON.stringify(applied));setup=applied.state;commands.push({command,role});
 }
 const docs={};const root='rivalries/'+rivalryId;
 docs[root+'/sharedSetup/authoritative']={schemaVersion:1,objectType:'sharedSetupLedger',rivalryId,revision:6,phase:setup.phase,coordinatorRole:'playerOne',operationIds:commands.map(c=>c.command.operationId),operationTypes:commands.map(c=>c.command.type),baseRevisions:commands.map(c=>c.command.baseRevision),actorRoles:commands.map(c=>c.role),totalSeasons,confirmedRoles:['playerOne','playerTwo'],activeSessionId:sessionId,updatedAt:1,updatedByDeviceId:authority.actor.deviceId};
 const teamCount=Catalog[setup.leagueId].length;
 const resultP=await Results.createProtocol({teamCount,cryptoImpl:webcrypto}),commitP=await Commit.createProtocol({teamCount,cryptoImpl:webcrypto}),scoreP=await Score.createProtocol({teamCount,cryptoImpl:webcrypto});
 const seasons=[];const projections=[];
 for(let seasonNumber=1;seasonNumber<=totalSeasons;seasonNumber++){
  const inputs=seasonNumber===1?[F.result({leaguePosition:2,leaguePoints:80,leagueGoals:80}),F.result({leaguePosition:3,leaguePoints:79,leagueGoals:80})]:seasonNumber===2?[F.result({domesticCup:true}),F.result()]:seasonNumber===3?(outcome==='daniel'?[F.result({domesticCup:true}),F.result()]:[F.result(),F.result({domesticCup:true})]):[F.result({leaguePosition:2,leaguePoints:70}),F.result({leaguePosition:3,leaguePoints:69})];
  let ready=null;for(const [i,role] of ['playerOne','playerTwo'].entries()){
   ready=(await resultP.apply({state:ready,setup,careerStart:{phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']},transferChallenge:{phase:'COMPLETED',revision:7,seasonNumber},seasonNumber,actorRole:role,command:{type:'publish-result',operationId:op('season_result_op_'),baseRevision:i,result:inputs[i]}})).state;
  }
  let commit=null;for(const [i,role] of ['playerOne','playerTwo','playerOne'].entries())commit=(await commitP.apply({state:commit,setup,seasonResults:ready,seasonNumber,actorRole:role,command:{type:i===0?'commit-season':'acknowledge-season',operationId:op('season_commit_op_'),baseRevision:i}})).state;
  const sid='season_'+seasonNumber;
  docs[root+'/seasonResults/'+sid]={schemaVersion:1,objectType:'sharedSeasonResults',rivalryId,seasonNumber,runtimeRevision:'1.9.1-r9',phase:ready.phase,revision:2,teamCount,publishedRoles:ready.publishedRoles,operationIds:ready.receipts.map(r=>r.operationId),operationHashes:ready.receipts.map(r=>r.commandHash),baseRevisions:ready.receipts.map(r=>r.baseRevision),actorRoles:ready.receipts.map(r=>r.actorRole),activeSessionId:sessionId,updatedAt:1,updatedByDeviceId:authority.actor.deviceId};
  for(const r of ready.receipts)docs[root+'/seasonResults/'+sid+'/roles/'+r.actorRole]={schemaVersion:1,objectType:'sharedSeasonResultRole',rivalryId,seasonNumber,managerRole:r.actorRole,operationId:r.operationId,commandHash:r.commandHash,result:ready.results[r.actorRole]};
  docs[root+'/seasonCommits/'+sid]={schemaVersion:1,objectType:'sharedSeasonCommit',rivalryId,seasonNumber,runtimeRevision:commit.runtimeRevision,phase:commit.phase,revision:3,resultsRevision:2,results:commit.results,acknowledgedRoles:commit.acknowledgedRoles,operationIds:commit.receipts.map(r=>r.operationId),operationHashes:commit.receipts.map(r=>r.commandHash),baseRevisions:commit.receipts.map(r=>r.baseRevision),actorRoles:commit.receipts.map(r=>r.actorRole),activeSessionId:sessionId,updatedAt:1,updatedByDeviceId:authority.actor.deviceId};
  const scored=scoreP.scoreAuthoritativeResults(commit.results);
  seasons.push({commit:{ok:true,committed:true,phase:'ACKNOWLEDGED',revision:3,resultsRevision:2,resultsContentHash:commit.resultsContentHash,seasonNumber,results:commit.results},scoring:{ok:true,authoritative:true,phase:'SCORING_RECONCILED',revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:commit.resultsContentHash,seasonNumber,...scored}});
  projections.push(History.buildProjection({rivalryId,setup,managerSlots:slots,seasons}));
 }
 const p=projections.at(-1),intent=F.closed(p).terminalWitness;intent.sessionId=sessionId;
 const data={connectionState:'closed',connectionStateBeforeDeletion:null,managerSlots:slots,authorizedAccountIds:slots.map(s=>s.accountId),createdByAccountId:slots[0].accountId,createdAt:1,terminalClose:intent,terminalProgress:{schemaVersion:1,runtimeRevision:'1.9.1-r18',totalSeasons,acceptedThroughSeason:totalSeasons,managerTotals:intent.managerTotals,closedSessionRevision:3}};
 docs[root]={schemaVersion:1,objectType:'rivalry',objectId:rivalryId,revision:4,parentRevision:3,lifecycleState:'live',contentHash:hash({objectType:'rivalry',objectId:rivalryId,revision:4,data}),priorContentHash:'sha256:'+'0'.repeat(64),updatedAt:1,updatedByAccountId:slots[0].accountId,updatedByDeviceId:authority.actor.deviceId,data,tombstone:null};
 for(const slot of slots){const writes=await Pair.planCareerIndexAppend({accountId:slot.accountId,deviceId:authority.actor.deviceId,rivalryId,now:1,cryptoImpl:webcrypto});for(const w of writes)docs['accounts/'+slot.accountId+'/careerIndex/'+w.indexId]=w.value;}
 return {rivalryId,docs,projections:clone(projections),slots,setup:clone(setup),intent:clone(intent)};
}
function sdk(docs){return {doc:(_db,...parts)=>parts.join('/'),getDoc:async path=>({exists:()=>Object.hasOwn(docs,path),data:()=>clone(docs[path])})};}
async function check(game){const saved=clone(game.docs);for(const slot of game.slots){const read=await Reader.readCompletedShowdown({user:{uid:slot.accountId},firestore:{},firebaseSdk:sdk(saved),rivalryId:game.rivalryId,cryptoImpl:webcrypto});assert.equal(read.status,'completed',read.code);assert.deepEqual(read.projection.seasonHistory,game.projections.at(-1).seasonHistory);assert.equal(read.final.winner,game.intent.winner);const model=Career.buildCareerModel(Closed.buildClosedCareerInput({index:{status:'ready',rivalryIds:[game.rivalryId]},reads:{[game.rivalryId]:read},current:{indexStatus:'ready',currentShowdownOnly:true,showdowns:[]}}));assert.equal(model.history.showdowns.length,1);assert.equal(model.history.showdowns[0].seasons.length,game.setup.totalSeasons);console.log('PASS saved '+game.setup.totalSeasons+' seasons, '+slot.slotId+': '+read.final.totals.playerOne+'-'+read.final.totals.playerTwo+' '+read.final.winner);}}
module.exports={make,check,sdk};
if(require.main===module)(async()=>{for(const [n,s] of [[3,'a'],[10,'b']])await check(await make(n,s));})().catch(e=>{console.error(e);process.exitCode=1;});
