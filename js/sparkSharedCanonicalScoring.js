(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedCanonicalScoring=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r11";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const defaultScoringModule=typeof require==="function"?require("./sharedCanonicalScoring.js"):root.CareerModeSharedCanonicalScoring;
  const defaultCommitModule=typeof require==="function"?require("./sharedSeasonCommit.js"):root.CareerModeSharedSeasonCommit;
  const defaultSeasonCommitProvider=typeof require==="function"?require("./sparkSharedSeasonCommit.js"):root.CareerModeSparkSharedSeasonCommit;

  function scspFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function scspFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(scspFreeze);Object.freeze(value);}return value;}
  function scspError(error){return scspFreeze({ok:false,code:error&&typeof error.code==="string"?error.code:"CANONICAL_SCORING_PROVIDER_FAILED"});}
  function scspTeamCount(value){const n=value===undefined?20:Number(value);if(!Number.isInteger(n)||n<2||n>20)scspFail("CANONICAL_SCORING_TEAM_COUNT_INVALID");return n;}

  function scspCreateProvider({seasonCommitProvider=defaultSeasonCommitProvider,scoringModule=defaultScoringModule,seasonCommitModule=defaultCommitModule}={}){
    if(!seasonCommitProvider||typeof seasonCommitProvider.read!=="function")scspFail("CANONICAL_SCORING_SEASON_COMMIT_PROVIDER_UNAVAILABLE");
    if(!scoringModule||typeof scoringModule.createProtocol!=="function")scspFail("CANONICAL_SCORING_PROTOCOL_UNAVAILABLE");
    if(!seasonCommitModule||typeof seasonCommitModule.createProtocol!=="function")scspFail("CANONICAL_SCORING_SEASON_COMMIT_PROTOCOL_UNAVAILABLE");
    async function scspRead(options={}){
      try{
        const commit=await seasonCommitProvider.read(options);
        if(!commit||commit.ok!==true)scspFail(commit?.code||"CANONICAL_SCORING_SEASON_COMMIT_UNAVAILABLE");
        if(commit.committed!==true||commit.phase!=="ACKNOWLEDGED"||commit.revision!==3||!ROLES.includes(commit.managerRole)||!commit.results?.playerOne||!commit.results?.playerTwo)scspFail("CANONICAL_SCORING_SEASON_COMMIT_NOT_ACKNOWLEDGED");
        const protocol=await scoringModule.createProtocol({teamCount:scspTeamCount(options.teamCount),cryptoImpl:options.cryptoImpl||root.crypto,seasonCommitModule});
        const projection=protocol.scoreAuthoritativeResults(commit.results);
        return scspFreeze({ok:true,authoritative:true,runtimeRevision:RUNTIME_REVISION,phase:"SCORING_RECONCILED",revision:1,seasonNumber:commit.seasonNumber,managerRole:commit.managerRole,seasonCommitRevision:commit.revision,resultsRevision:commit.resultsRevision,resultsContentHash:commit.resultsContentHash,scoring:projection.scoring,winner:projection.winner});
      }catch(error){return scspError(error);}
    }
    return scspFreeze({contractVersion:1,feature:"ssjr-spark-shared-canonical-scoring",runtimeRevision:RUNTIME_REVISION,read:scspRead,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false,authoritativeScoring:true,providerEnforcedSource:true,trustsSubmittedTotals:false,requiresAcknowledgedSeasonCommit:true,readOnlyDerivedProjection:true,sourceStoragePath:"rivalries/{rivalryId}/seasonCommits/{seasonId}"});
  }

  const provider=scspCreateProvider();
  return Object.freeze({...provider,createProvider:scspCreateProvider});
});