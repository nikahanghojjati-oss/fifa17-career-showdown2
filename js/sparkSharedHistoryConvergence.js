(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedHistoryConvergence=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r12";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const DEVICE_ID=/^device_[0-9a-f]{32}$/;
  const PROFILE_ID=/^profile_[0-9a-f]{24}$/;
  const SAVE_ID=/^save_[0-9a-f]{24}$/;
  const defaultHistoryModule=typeof require==="function"?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence;
  const defaultCommitProvider=typeof require==="function"?require("./sparkSharedSeasonCommit.js"):root.CareerModeSparkSharedSeasonCommit;
  const defaultScoringProvider=typeof require==="function"?require("./sparkSharedCanonicalScoring.js"):root.CareerModeSparkSharedCanonicalScoring;

  function hcpFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function hcpFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(hcpFreeze);Object.freeze(value);}return value;}
  function hcpError(error){return hcpFreeze({ok:false,code:error&&typeof error.code==="string"?error.code:"HISTORY_CONVERGENCE_PROVIDER_FAILED"});}
  function hcpRivalry(value){const id=String(value||"").trim().toLowerCase();if(!RIVALRY_ID.test(id))hcpFail("HISTORY_CONVERGENCE_RIVALRY_INVALID");return id;}
  function hcpDevice(value){const id=String(value||"").trim().toLowerCase();if(!DEVICE_ID.test(id))hcpFail("HISTORY_CONVERGENCE_DEVICE_INVALID");return id;}
  function hcpSession(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))hcpFail("HISTORY_CONVERGENCE_SESSION_INVALID");return id;}
  function hcpUid(user){const uid=user&&typeof user.uid==="string"?user.uid.trim():"";if(!uid)hcpFail("HISTORY_CONVERGENCE_AUTH_REQUIRED");return uid;}
  function hcpThroughSeason(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>10)hcpFail("HISTORY_CONVERGENCE_SEASON_INVALID");return n;}
  function hcpSdk(options){if(!options.firestore)hcpFail("HISTORY_CONVERGENCE_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")hcpFail("HISTORY_CONVERGENCE_PROVIDER_UNAVAILABLE");}return options.firebaseSdk;}
  function hcpSnapshot(snapshot){return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;}
  function hcpPath(sdk,db,...parts){return sdk.doc(db,...parts);}
  function hcpValidSlots(value,uid){
    const slots=value?.data?.managerSlots,authorized=value?.data?.authorizedAccountIds;
    if(!value||value.objectType!=="rivalry"||value.lifecycleState!=="live"||value.data?.connectionState!=="active"||!Array.isArray(slots)||slots.length!==2||!Array.isArray(authorized)||authorized.length!==2||new Set(authorized).size!==2||!authorized.includes(uid))hcpFail("HISTORY_CONVERGENCE_RIVALRY_INACTIVE");
    const ordered=ROLES.map(role=>slots.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string"||!slot.accountId.trim()||!PROFILE_ID.test(String(slot.profileId||""))||!SAVE_ID.test(String(slot.saveId||"")))||ordered[0].accountId===ordered[1].accountId||ordered[0].profileId===ordered[1].profileId||!ordered.every(slot=>authorized.includes(slot.accountId)))hcpFail("HISTORY_CONVERGENCE_BINDING_INVALID");
    return ordered.map(slot=>({slotId:slot.slotId,accountId:slot.accountId,profileId:slot.profileId,saveId:slot.saveId,entitlementState:"active"}));
  }
  function hcpValidSetup(value,rivalryId,throughSeason){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons)||throughSeason>value.totalSeasons||typeof value.leagueId!=="string"||!value.leagueId.trim()||!value.clubs||typeof value.clubs.playerOne!=="string"||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerOne.trim()||!value.clubs.playerTwo.trim()||value.clubs.playerOne===value.clubs.playerTwo)hcpFail("HISTORY_CONVERGENCE_SETUP_INVALID");
    return value;
  }
  async function hcpReadAuthority(options,uid,rivalryId,throughSeason){
    const sdk=hcpSdk(options),db=options.firestore;
    return sdk.runTransaction(db,async tx=>{
      const rivalryRef=hcpPath(sdk,db,"rivalries",rivalryId),setupRef=hcpPath(sdk,db,"rivalries",rivalryId,"sharedSetup","authoritative");
      const rivalry=hcpSnapshot(await tx.get(rivalryRef)),setup=hcpSnapshot(await tx.get(setupRef));
      return hcpFreeze({managerSlots:hcpValidSlots(rivalry,uid),setup:hcpValidSetup(setup,rivalryId,throughSeason)});
    });
  }
  function hcpCreateProvider({historyModule=defaultHistoryModule,commitProvider=defaultCommitProvider,scoringProvider=defaultScoringProvider,authorityReader=hcpReadAuthority}={}){
    if(!historyModule||typeof historyModule.buildProjection!=="function"||typeof historyModule.verifyProjection!=="function")hcpFail("HISTORY_CONVERGENCE_PROTOCOL_UNAVAILABLE");
    if(!commitProvider||typeof commitProvider.read!=="function")hcpFail("HISTORY_CONVERGENCE_COMMIT_PROVIDER_UNAVAILABLE");
    if(!scoringProvider||typeof scoringProvider.read!=="function")hcpFail("HISTORY_CONVERGENCE_SCORING_PROVIDER_UNAVAILABLE");
    if(typeof authorityReader!=="function")hcpFail("HISTORY_CONVERGENCE_AUTHORITY_READER_UNAVAILABLE");
    async function hcpRead(options={}){
      try{
        const rivalryId=hcpRivalry(options.rivalryId),sessionId=hcpSession(options.sessionId),deviceId=hcpDevice(options.deviceId),uid=hcpUid(options.user),throughSeason=hcpThroughSeason(options.throughSeason);
        hcpSdk(options);
        const authority=await authorityReader(options,uid,rivalryId,throughSeason);
        if(!authority||!Array.isArray(authority.managerSlots)||!authority.setup)hcpFail("HISTORY_CONVERGENCE_AUTHORITY_INVALID");
        const actor=authority.managerSlots.find(slot=>slot.accountId===uid);if(!actor)hcpFail("HISTORY_CONVERGENCE_ACTOR_NOT_ENTITLED");
        const seasons=[];
        for(let seasonNumber=1;seasonNumber<=throughSeason;seasonNumber+=1){
          const shared={...options,rivalryId,sessionId,deviceId,seasonNumber,teamCount:20};delete shared.throughSeason;
          const commit=await commitProvider.read(shared);if(!commit||commit.ok!==true||commit.committed!==true||commit.phase!=="ACKNOWLEDGED"||commit.revision!==3)hcpFail(commit?.code||"HISTORY_CONVERGENCE_COMMIT_NOT_ACKNOWLEDGED");
          const scoring=await scoringProvider.read(shared);if(!scoring||scoring.ok!==true||scoring.authoritative!==true||scoring.phase!=="SCORING_RECONCILED")hcpFail(scoring?.code||"HISTORY_CONVERGENCE_SCORING_INVALID");
          seasons.push({commit:{...commit,rivalryId},scoring:{...scoring,rivalryId}});
        }
        const projection=historyModule.buildProjection({rivalryId,setup:authority.setup,managerSlots:authority.managerSlots,seasons});historyModule.verifyProjection(projection);
        return hcpFreeze({ok:true,authoritative:true,runtimeRevision:RUNTIME_REVISION,phase:"HISTORY_CONVERGED",revision:1,rivalryId,managerRole:actor.slotId,throughSeason,acceptedRevisionKey:projection.acceptedRevisionKey,projection});
      }catch(error){return hcpError(error);}
    }
    return hcpFreeze({contractVersion:1,feature:"ssjr-spark-shared-history-convergence",runtimeRevision:RUNTIME_REVISION,read:hcpRead,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,requiresCanonicalScoring:true,sourceAuthorityPaths:Object.freeze(["rivalries/{rivalryId}","rivalries/{rivalryId}/sharedSetup/authoritative","rivalries/{rivalryId}/seasonCommits/season_{N}"])});
  }

  const provider=hcpCreateProvider();
  return Object.freeze({...provider,createProvider:hcpCreateProvider});
});