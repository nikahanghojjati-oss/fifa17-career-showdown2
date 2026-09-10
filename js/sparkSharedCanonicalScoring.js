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

  function sc11pFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function sc11pFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(sc11pFreeze);Object.freeze(value);}return value;}
  function sc11pError(error){return sc11pFreeze({ok:false,code:error&&typeof error.code==="string"?error.code:"CANONICAL_SCORING_PROVIDER_FAILED"});}
  function sc11pTeamCount(value){const n=value===undefined?20:Number(value);if(!Number.isInteger(n)||n<2||n>20)sc11pFail("CANONICAL_SCORING_TEAM_COUNT_INVALID");return n;}

  function sc11pCreateProvider({seasonCommitProvider=defaultSeasonCommitProvider,scoringModule=defaultScoringModule,seasonCommitModule=defaultCommitModule}={}){
    if(!seasonCommitProvider||typeof seasonCommitProvider.read!=="function")sc11pFail("CANONICAL_SCORING_SEASON_COMMIT_PROVIDER_UNAVAILABLE");
    if(!scoringModule||typeof scoringModule.createProtocol!=="function")sc11pFail("CANONICAL_SCORING_PROTOCOL_UNAVAILABLE");
    if(!seasonCommitModule||typeof seasonCommitModule.createProtocol!=="function")sc11pFail("CANONICAL_SCORING_SEASON_COMMIT_PROTOCOL_UNAVAILABLE");
    async function sc11pRead(options={}){
      try{
        const commit=await seasonCommitProvider.read(options);
        if(!commit||commit.ok!==true)sc11pFail(commit?.code||"CANONICAL_SCORING_SEASON_COMMIT_UNAVAILABLE");
        if(commit.committed!==true||commit.phase!=="ACKNOWLEDGED"||commit.revision!==3||!ROLES.includes(commit.managerRole)||!commit.results?.playerOne||!commit.results?.playerTwo)sc11pFail("CANONICAL_SCORING_SEASON_COMMIT_NOT_ACKNOWLEDGED");
        const protocol=await scoringModule.createProtocol({teamCount:sc11pTeamCount(options.teamCount),cryptoImpl:options.cryptoImpl||root.crypto,seasonCommitModule});
        const projection=protocol.scoreAuthoritativeResults(commit.results);
        return sc11pFreeze({ok:true,authoritative:true,runtimeRevision:RUNTIME_REVISION,phase:"SCORING_RECONCILED",revision:1,seasonNumber:commit.seasonNumber,managerRole:commit.managerRole,seasonCommitRevision:commit.revision,resultsRevision:commit.resultsRevision,resultsContentHash:commit.resultsContentHash,scoring:projection.scoring,winner:projection.winner});
      }catch(error){return sc11pError(error);}
    }
    return sc11pFreeze({contractVersion:1,feature:"ssjr-spark-shared-canonical-scoring",runtimeRevision:RUNTIME_REVISION,read:sc11pRead,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false,authoritativeScoring:true,providerEnforcedSource:true,trustsSubmittedTotals:false,requiresAcknowledgedSeasonCommit:true,readOnlyDerivedProjection:true,sourceStoragePath:"rivalries/{rivalryId}/seasonCommits/{seasonId}"});
  }

  const provider=sc11pCreateProvider();
  return Object.freeze({...provider,createProvider:sc11pCreateProvider});
});