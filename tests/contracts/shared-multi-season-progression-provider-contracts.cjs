const assert=require("node:assert/strict");
const fs=require("node:fs");
const providerModule=require("../../js/sparkSharedMultiSeasonProgression.js");
const progression=require("../../js/sharedMultiSeasonProgression.js");
const history=require("../../js/sharedHistoryConvergence.js");

const rivalryId=`pair_${"a".repeat(64)}`;
const sessionId=`session_${"b".repeat(64)}`;
const deviceId=`device_${"c".repeat(32)}`;
const user={uid:"uid-one"};
const managerSlots=[
  {slotId:"playerOne",accountId:"uid-one",profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"3".repeat(24)}`,entitlementState:"active"},
  {slotId:"playerTwo",accountId:"uid-two",profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"4".repeat(24)}`,entitlementState:"active"}
];
const setupFor=totalSeasons=>({schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},totalSeasons});
const p1={leaguePosition:1,leaguePoints:90,leagueGoals:90,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const p2={leaguePosition:2,leaguePoints:80,leagueGoals:80,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const scoring=result=>({championsLeague:0,leagueTitle:result.leaguePosition===1?3:0,domesticCup:0,performanceBonus:0,individualAwardsBonus:0,total:result.leaguePosition===1?3:0});
const hex="123456789a";
const source=seasonNumber=>{const results={playerOne:{...p1},playerTwo:{...p2}},hash=`sha256:${hex[seasonNumber-1].repeat(64)}`;return {commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber,rivalryId,results},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber,rivalryId,scoring:{playerOne:scoring(results.playerOne),playerTwo:scoring(results.playerTwo)},winner:"playerOne"}};};
const historyFor=(totalSeasons,acceptedSeasons)=>acceptedSeasons===0?null:history.buildProjection({rivalryId,setup:setupFor(totalSeasons),managerSlots,seasons:Array.from({length:acceptedSeasons},(_,index)=>source(index+1))});
const firebaseSdk={doc(){},runTransaction(){}};
const options={firestore:{},firebaseSdk,user,rivalryId,sessionId,deviceId,nowEpochMs:1000};

assert.equal(providerModule.feature,"ssjr-spark-shared-multi-season-progression");
assert.equal(providerModule.runtimeRevision,"1.9.1-r13");
assert.equal(providerModule.exactSeasonAddressing,true);
assert.equal(providerModule.derivesFromAcceptedPrefix,true);
assert.equal(providerModule.fixedClubs,true);
assert.equal(providerModule.canonicalStorageMutation,false);
assert.equal(providerModule.providerWriteRequired,false);
assert.equal(providerModule.listPermissionRequired,false);
assert.equal(providerModule.billingRequired,false);
assert.equal(providerModule.blazeRequired,false);
assert.equal(providerModule.cloudRunRequired,false);
assert.equal(providerModule.cloudFunctionsRequired,false);

(async()=>{
  for(const totalSeasons of [1,3,5,10]){
    for(let acceptedSeasons=0;acceptedSeasons<=totalSeasons;acceptedSeasons+=1){
      const setup=setupFor(totalSeasons),projection=historyFor(totalSeasons,acceptedSeasons),historyReads=[];
      const provider=providerModule.createProvider({
        progressionModule:progression,
        authorityReader:async(received,uid,id,sid,did,now)=>{
          assert.equal(received.rivalryId,rivalryId);assert.equal(uid,user.uid);assert.equal(id,rivalryId);assert.equal(sid,sessionId);assert.equal(did,deviceId);assert.equal(now,1000);
          return {setup,managerRole:"playerOne",acceptedSeasons,commitPhases:Array.from({length:totalSeasons},(_,index)=>index<acceptedSeasons?"accepted":"missing")};
        },
        historyProvider:{read:async received=>{historyReads.push(received);return {ok:true,authoritative:true,phase:"HISTORY_CONVERGED",projection};}}
      });
      const result=await provider.read(options);
      assert.equal(result.ok,true);
      assert.equal(result.authoritative,true);
      assert.equal(result.managerRole,"playerOne");
      assert.equal(result.state.acceptedSeasons,acceptedSeasons);
      assert.equal(result.state.totalSeasons,totalSeasons);
      assert.deepEqual(result.state.fixedClubs,setup.clubs);
      assert.equal(result.state.activeSeason,acceptedSeasons===totalSeasons?null:acceptedSeasons+1);
      assert.equal(result.state.terminal,acceptedSeasons===totalSeasons);
      assert.equal(historyReads.length,acceptedSeasons===0?0:1,"history provider is unnecessary before the first accepted season");
      if(acceptedSeasons>0){assert.equal(historyReads[0].throughSeason,acceptedSeasons);assert.equal(historyReads[0].rivalryId,rivalryId);assert.equal(historyReads[0].sessionId,sessionId);assert.equal(historyReads[0].deviceId,deviceId);}
    }
  }

  const denied=providerModule.createProvider({progressionModule:progression,authorityReader:async()=>{const error=new Error("denied");error.code="MULTI_SEASON_ACTIVE_SESSION_REQUIRED";throw error;},historyProvider:{read:async()=>({ok:false})}});
  assert.deepEqual(await denied.read(options),{ok:false,code:"MULTI_SEASON_ACTIVE_SESSION_REQUIRED"});

  const historyDenied=providerModule.createProvider({progressionModule:progression,authorityReader:async()=>({setup:setupFor(3),managerRole:"playerOne",acceptedSeasons:1}),historyProvider:{read:async()=>({ok:false,code:"HISTORY_CONVERGENCE_ACTIVE_SESSION_REQUIRED"})}});
  assert.deepEqual(await historyDenied.read(options),{ok:false,code:"HISTORY_CONVERGENCE_ACTIVE_SESSION_REQUIRED"},"r12 history denial must propagate fail-closed");

  const mismatched=providerModule.createProvider({progressionModule:progression,authorityReader:async()=>({setup:setupFor(3),managerRole:"playerOne",acceptedSeasons:2}),historyProvider:{read:async()=>({ok:true,authoritative:true,phase:"HISTORY_CONVERGED",projection:historyFor(3,1)})}});
  assert.deepEqual(await mismatched.read(options),{ok:false,code:"MULTI_SEASON_ACCEPTED_PREFIX_MISMATCH"});

  const sourceText=fs.readFileSync("js/sparkSharedMultiSeasonProgression.js","utf8");
  assert.match(sourceText,/for\(let seasonNumber=1;seasonNumber<=setup\.totalSeasons;seasonNumber\+=1\)/,"provider must probe every bounded exact season address");
  assert.match(sourceText,/"seasonCommits",`season_\$\{seasonNumber\}`/);
  assert.match(sourceText,/phase==="ACKNOWLEDGED"&&value\.revision!==3/);
  assert.match(sourceText,/MULTI_SEASON_HISTORY_GAP/);
  assert.match(sourceText,/historyProvider\.read\(\{\.\.\.options,rivalryId,sessionId,deviceId,throughSeason:authority\.acceptedSeasons\}\)/);
  assert.doesNotMatch(sourceText,/\bcollection\s*\(|\bgetDocs\s*\(|\bquery\s*\(/,"r13 must use exact season addressing, never collection listing");
  assert.doesNotMatch(sourceText,/\bsetDoc\s*\(|\bupdateDoc\s*\(|\bdeleteDoc\s*\(|tx\.set\s*\(|tx\.update\s*\(|tx\.delete\s*\(/,"r13 progression provider must remain read-only");
  assert.equal(providerModule.sourceAuthorityPaths.includes("rivalries/{rivalryId}/seasonCommits/season_{N}"),true);

  console.log("PASS Shared Multi Season Progression provider: exact account/device/rivalry/session/setup authority probes every bounded season commit by exact path, accepts only the contiguous ACKNOWLEDGED rev3 prefix, rejects history gaps, reuses r12 History Convergence for accepted-season proof, derives the next active season for all 1/3/5/10 plans, propagates upstream denial, and adds no list/write/billing authority.");
})().catch(error=>{console.error(error);process.exitCode=1;});
