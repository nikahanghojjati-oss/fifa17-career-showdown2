const assert=require("node:assert/strict");
const fs=require("node:fs");
const {webcrypto}=require("node:crypto");
const scoringModule=require("../../js/sharedCanonicalScoring.js");
const commitModule=require("../../js/sharedSeasonCommit.js");
const providerModule=require("../../js/sparkSharedCanonicalScoring.js");

(async()=>{
  const calls=[];
  const committed={ok:true,committed:true,ready:true,coordinatorRole:"playerOne",schemaVersion:1,runtimeRevision:"1.9.1-r10",seasonNumber:1,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:"sha256:"+("a".repeat(64)),results:{playerOne:{leaguePosition:1,leaguePoints:101,leagueGoals:100,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true},playerTwo:{leaguePosition:2,leaguePoints:99,leagueGoals:99,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false}},managerRole:"playerTwo",ownAcknowledged:true,acknowledgedRoles:["playerOne","playerTwo"]};
  const seasonCommitProvider={read:async options=>{calls.push(options);return committed;}};
  const provider=providerModule.createProvider({seasonCommitProvider,scoringModule,seasonCommitModule:commitModule});
  const options={user:{uid:"account-a"},firestore:{id:"db"},firebaseSdk:{id:"sdk"},rivalryId:"pair_"+("1".repeat(64)),sessionId:"session_"+("2".repeat(64)),deviceId:"device_"+("3".repeat(32)),seasonNumber:1,teamCount:20,cryptoImpl:webcrypto,nowEpochMs:12345};
  const result=await provider.read(options);
  assert.equal(result.ok,true);assert.equal(result.authoritative,true);assert.equal(result.phase,"SCORING_RECONCILED");assert.equal(result.revision,1);assert.equal(result.seasonCommitRevision,3);assert.equal(result.resultsRevision,2);assert.equal(result.resultsContentHash,committed.resultsContentHash);assert.equal(result.managerRole,"playerTwo");
  assert.equal(result.scoring.playerOne.total,11);assert.equal(result.scoring.playerOne.performanceBonus,1);assert.equal(result.scoring.playerOne.individualAwardsBonus,1);assert.equal(result.scoring.playerTwo.total,0);assert.equal(result.winner,"playerOne");
  assert.equal(calls.length,1);assert.equal(calls[0],options,"provider must delegate the exact account/device/rivalry/ACTIVE-session context to the proven r10 Season Commit provider");
  assert.equal(provider.readOnlyDerivedProjection,true);assert.equal(provider.providerEnforcedSource,true);assert.equal(provider.authoritativeScoring,true);assert.equal(provider.trustsSubmittedTotals,false);assert.equal(provider.canonicalStorageMutation,false);assert.equal(provider.billingRequired,false);assert.equal(provider.blazeRequired,false);assert.equal(provider.cloudRunRequired,false);assert.equal(provider.cloudFunctionsRequired,false);

  for(const bad of [
    {...committed,phase:"COMMITTED",revision:2},
    {...committed,committed:false},
    {...committed,results:null},
    {...committed,managerRole:"spectator"}
  ]){
    const rejected=providerModule.createProvider({seasonCommitProvider:{read:async()=>bad},scoringModule,seasonCommitModule:commitModule});
    const value=await rejected.read(options);assert.equal(value.ok,false);assert.equal(value.code,"CANONICAL_SCORING_SEASON_COMMIT_NOT_ACKNOWLEDGED");
  }
  const upstreamFailure=providerModule.createProvider({seasonCommitProvider:{read:async()=>({ok:false,code:"SEASON_COMMIT_ACTIVE_SESSION_REQUIRED"})},scoringModule,seasonCommitModule:commitModule});
  assert.deepEqual(await upstreamFailure.read(options),{ok:false,code:"SEASON_COMMIT_ACTIVE_SESSION_REQUIRED"});
  const invalidTeamCount=await provider.read({...options,teamCount:21});assert.equal(invalidTeamCount.ok,false);assert.equal(invalidTeamCount.code,"CANONICAL_SCORING_TEAM_COUNT_INVALID");

  const source=fs.readFileSync("js/sparkSharedCanonicalScoring.js","utf8");
  assert.match(source,/seasonCommitProvider\.read\(options\)/);assert.match(source,/phase!=="ACKNOWLEDGED"/);assert.match(source,/commit\.revision!==3/);assert.match(source,/scoreAuthoritativeResults\(commit\.results\)/);
  assert.match(source,/readOnlyDerivedProjection:true/);assert.match(source,/providerEnforcedSource:true/);assert.match(source,/billingRequired:false/);assert.match(source,/blazeRequired:false/);assert.match(source,/cloudRunRequired:false/);assert.match(source,/cloudFunctionsRequired:false/);
  assert.doesNotMatch(source,/runTransaction|\.set\(|localStorage|saveCurrentShowdown|persistCompletedSeason/);
  process.stdout.write("PASS Shared Canonical Scoring Spark provider: the proven r10 Season Commit provider remains the sole active-account/device/two-manager/ACTIVE-session source, only terminal ACKNOWLEDGED revision 3 is scored, canonical totals are derived read-only from authoritative raw results, upstream denials propagate fail-closed, and Spark/zero-billing/local-save constraints remain intact.\n");
})().catch(error=>{console.error(error);process.exitCode=1;});
