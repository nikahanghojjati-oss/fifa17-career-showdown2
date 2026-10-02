(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeStartJoinViewModel=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const CONFIRM=Object.freeze({
    abandon:"Abandon this Showdown? It closes the current Daniel vs Nik Showdown for both players. Abandoned Showdowns do not count toward career records.",
    startOver:"Delete the old Showdown and start over? This closes the old online Showdown for both players. Your player identity, registered device, Legacy history and app settings are kept.",
    discardStale:"Delete this old connection and start fresh? This closes the stale online test connection and removes only its unfinished local Showdown so Nik can join the new code Daniel creates.",
    forgetThisDevice:"Forget this device? This browser is signed out and must be set up again before it can play. Your Showdowns are not deleted.",
    revoke:"Revoke this open session code? The other player can no longer use it.",
    close:"Close this private session? Both players leave the session. Your Showdown is kept.",
    forget:"Forget this session code on this browser? Nothing online is changed."
  });
  const NAV_LOCK_TEXT="Finish this step first";
  const LOCKED_SCREENS=Object.freeze({transferChallenge:"transfer-window",seasonEntry:"season-entry",leagueWheelScreen:"setup",clubWheelScreen:"setup"});
  const sjScreenIds=Object.freeze(["mainMenu","createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary","statistics","careerStatistics","trophyRoom","legacy","ruleBook"]);
  const sjPairingNames=Object.freeze(["createCode","join","copyCode","newCode","checkStatus","retry"]);
  const sjSessionNames=Object.freeze(["host","join","refresh","revoke","close","forget"]);

  function sjFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(sjFreeze);Object.freeze(value);}return value;}
  function sjUnavailable(){return {available:false,enabled:false,provider:null,args:null,confirm:null,confirmedByProvider:false};}
  function sjAction(available,busy,provider,args=null,confirm=null,confirmedByProvider=false,enabledRule=true){
    if(!available)return sjUnavailable();
    return {available:true,enabled:enabledRule&&!busy,provider,args,confirm,confirmedByProvider};
  }
  function sjViewerRole(identity,pair){
    if(pair.managerRole==="playerOne")return "daniel";
    if(pair.managerRole==="playerTwo")return "nik";
    return identity.managerId==="daniel"||identity.managerId==="nik"?identity.managerId:null;
  }
  function sjPairingState(pair,viewerRole){
    if(pair.connectionState==="active")return "paired";
    if(pair.connectionState==="pending-pair"&&pair.managerRole==="playerOne"){
      return pair.capability&&viewerRole==="daniel"?"code-created":"waiting-for-nik";
    }
    return "none";
  }
  function sjSessionFacts(session,nowEpochMs){
    const hasId=Boolean(session.sessionId);
    const expiredByClock=hasId&&Number.isFinite(session.expiresAtEpochMs)&&Number.isFinite(nowEpochMs)&&nowEpochMs>=session.expiresAtEpochMs;
    const nonterminal=hasId&&(session.sessionState==="open"||session.sessionState==="active")&&!expiredByClock;
    const blocksStart=nonterminal||Boolean(session.pendingAction)||session.sessionState==="unresolved";
    let state=null;
    if(hasId&&session.sessionState!=="unresolved"){
      if(expiredByClock)state="expired";
      else if(["open","active","revoked","closed","expired"].includes(session.sessionState))state=session.sessionState;
    }
    return {hasId,expiredByClock,nonterminal,blocksStart,state};
  }
  function sjBuildPairingActions({status,ready,retryMode,freshStart,pairingState,viewerRole,pair,busy}){
    const actions=Object.fromEntries(sjPairingNames.map(name=>[name,sjUnavailable()]));
    if(!ready)return actions;
    if(retryMode){
      actions.retry=sjAction(true,busy,"pair.retryPairLink");
      return actions;
    }
    if(freshStart&&viewerRole==="daniel")actions.createCode=sjAction(true,busy,"pair.startPairing",{managerRole:"playerOne"});
    if(freshStart&&viewerRole==="nik")actions.join=sjAction(true,busy,"pair.joinPairing",{managerRole:"playerTwo"});
    if(pairingState==="code-created"&&viewerRole==="daniel"){
      actions.copyCode=sjAction(true,false,"clipboard.pairingCode");
      actions.newCode=sjAction(true,busy,"pair.startPairing",{managerRole:"playerOne"});
    }
    if(pair.connectionState==="pending-pair")actions.checkStatus=sjAction(true,busy,"pair.initialize",{force:true});
    return actions;
  }
  function sjBuildSessionActions({sessionLayer,session,facts,busy}){
    const actions=Object.fromEntries(sjSessionNames.map(name=>[name,sjUnavailable()]));
    if(!sessionLayer)return actions;
    actions.host=sjAction(true,busy,"session.hostSession",null,null,false,!facts.blocksStart);
    actions.join=sjAction(true,busy,"session.joinSession",null,null,false,!facts.blocksStart);
    if(facts.hasId){
      actions.refresh=sjAction(true,busy,"session.refreshSession",null,null,false,!session.pendingAction);
      actions.revoke=sjAction(true,busy,"session.revokeSession",null,CONFIRM.revoke,false,!facts.expiredByClock&&!session.pendingAction&&session.sessionState==="open");
      actions.close=sjAction(true,busy,"session.closeSession",null,CONFIRM.close,false,!facts.expiredByClock&&!session.pendingAction&&session.sessionState==="active");
      actions.forget=sjAction(true,busy,"session.forgetSession",null,CONFIRM.forget,false,!session.pendingAction&&!facts.nonterminal&&session.sessionState!=="unresolved");
    }
    return actions;
  }
  function sjAbandonAction({ready,pair,viewerRole,busy}){
    if(!ready)return sjUnavailable();
    if(pair.status==="recovery-required"&&pair.connectionState==="active")return sjAction(true,busy,"pair.startOver",null,CONFIRM.startOver,true);
    const staleNik=pair.connectionState==="pending-pair"&&pair.managerRole==="playerTwo"&&viewerRole==="nik";
    if(staleNik)return sjAction(true,busy,"pair.discardStalePendingConnection",null,CONFIRM.discardStale,true);
    if(pair.connectionState==="active"||pair.connectionState==="pending-pair")return sjAction(true,busy,"pair.abandonCurrentShowdown",null,CONFIRM.abandon,false);
    return sjUnavailable();
  }
  function sjPrimaryActions({retryMode,recoveryRequired,staleNik,pairingState,sessionLayer,facts,freshStart,viewerRole}){
    if(retryMode)return ["pairing.retry"];
    if(recoveryRequired)return ["abandonShowdown"];
    if(staleNik)return ["abandonShowdown","pairing.checkStatus"];
    if(pairingState==="code-created")return ["pairing.copyCode","pairing.checkStatus"];
    if(pairingState==="waiting-for-nik")return ["pairing.checkStatus"];
    if(sessionLayer&&(facts.nonterminal||facts.pendingAction))return ["session.refresh"];
    if(sessionLayer)return ["session.host","session.join"];
    if(freshStart)return [viewerRole==="daniel"?"pairing.createCode":"pairing.join"];
    return [];
  }
  function buildStartJoinViewModel({identity={},pair={},session=null,nowEpochMs}={}){
    identity=identity&&typeof identity==="object"?identity:{};
    pair=pair&&typeof pair==="object"?pair:{};
    session=session&&typeof session==="object"?session:{};
    const viewerRole=sjViewerRole(identity,pair);
    const busy=Boolean(identity.busy||pair.busy||session.busy);
    let status;
    if(identity.status!=="ready"||identity.registered!==true||viewerRole===null||pair.status==="unavailable"||pair.status==="signed-out")status="unavailable";
    else if(pair.initialized!==true||pair.status==="idle")status="loading";
    else status="ready";
    const ready=status==="ready";
    const pairingState=ready?sjPairingState(pair,viewerRole):"none";
    const pairingCode=ready&&pairingState==="code-created"&&viewerRole==="daniel"?pair.capability:null;
    const retryMode=ready&&pair.status==="pair-link-retry";
    const freshStart=ready&&!retryMode&&pair.connectionState!=="active"&&pair.connectionState!=="pending-pair"&&["unpaired","save-required","error"].includes(pair.status);
    const sessionLayer=ready&&pairingState==="paired"&&pair.status==="paired";
    const facts=sjSessionFacts(session,nowEpochMs);
    facts.pendingAction=Boolean(session.pendingAction);
    const pairingActions=sjBuildPairingActions({status,ready,retryMode,freshStart,pairingState,viewerRole,pair,busy});
    const sessionActions=sjBuildSessionActions({sessionLayer,session,facts,busy});
    const recoveryRequired=ready&&pair.status==="recovery-required"&&pair.connectionState==="active";
    const staleNik=ready&&pair.connectionState==="pending-pair"&&pair.managerRole==="playerTwo"&&viewerRole==="nik";
    const abandonShowdown=sjAbandonAction({ready,pair,viewerRole,busy});
    const forgetThisDevice=sjAction(identity.registered===true&&viewerRole!==null,busy,"identity.forgetThisDevice",null,CONFIRM.forgetThisDevice,false);
    const primaryActions=ready?sjPrimaryActions({retryMode,recoveryRequired,staleNik,pairingState,sessionLayer,facts,freshStart,viewerRole}):[];
    const moreActions=ready&&sessionLayer&&facts.hasId?["session.revoke","session.close","session.forget"]:[];
    return sjFreeze({
      status,
      viewerRole,
      busy,
      pairing:{state:pairingState,code:pairingCode,actions:pairingActions},
      session:{state:ready&&sessionLayer?facts.state:null,actions:sessionActions},
      abandonShowdown,
      forgetThisDevice,
      primaryActions,
      moreActions
    });
  }
  function navLockState(activeScreen){
    if(activeScreen===null||sjScreenIds.includes(activeScreen)){
      const reason=activeScreen===null?null:LOCKED_SCREENS[activeScreen]||null;
      return sjFreeze({locked:reason!==null,reason});
    }
    throw new TypeError("NAV_SCREEN_UNKNOWN");
  }

  return sjFreeze({buildStartJoinViewModel,navLockState,CONFIRM,NAV_LOCK_TEXT,LOCKED_SCREENS,contractVersion:1});
});
