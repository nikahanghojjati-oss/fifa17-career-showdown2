const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const rootDir=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(rootDir,"js/sparkRemoteJoining.js"),"utf8");

for(const forbidden of ["sessionStorage","indexedDB","getDocs(","collection(","enableIndexedDbPersistence","enableMultiTabIndexedDbPersistence"]){
  assert.equal(source.includes(forbidden),false,`Stage 5G runtime must not introduce ${forbidden}.`);
}
assert.match(source,/sameCapabilityReconnect:true/);
assert.match(source,/unresolvedCapabilityCopyBlocked:true/);
assert.match(source,/onlineRetryBounded:true/);
assert.match(source,/retryPendingOperation:srjRetryPendingOperation/);
assert.match(source,/REMOTE_JOINING_RECOVERY_CONTEXT_CHANGED/);

function unavailable(message="simulated acknowledgement loss"){
  const error=new Error(message);
  error.code="firestore/unavailable";
  return error;
}

function makeProvider(){
  const sessions=new Map();
  const counts={generated:0,open:0,join:0,close:0};
  let loseOpenAck=true;
  let loseJoinAck=true;
  let loseCloseAck=true;
  const protocol={
    generateSessionId(){counts.generated+=1;return "session_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";},
    normalizeSessionId(value){
      const normalized=String(value||"").trim().toLowerCase();
      if(!/^session_[a-f0-9]{64}$/.test(normalized)){const error=new Error("bad capability");error.code="PRIVATE_SESSION_ID_INVALID";throw error;}
      return normalized;
    },
    async openSession(options){
      counts.open+=1;
      let session=sessions.get(options.sessionId);
      if(!session){session={sessionId:options.sessionId,rivalryId:options.rivalryId,state:"open",revision:0,hostAccountId:options.user.uid,hostDeviceId:options.deviceId,peerAccountId:null,expiresAtEpochMs:options.nowEpochMs+900000};sessions.set(options.sessionId,session);}
      const result={ok:true,...session,replayed:counts.open>1};
      if(loseOpenAck){loseOpenAck=false;throw unavailable("host committed but acknowledgement was lost");}
      return result;
    },
    async joinSession(options){
      counts.join+=1;
      const session=sessions.get(options.sessionId);
      assert.ok(session,"join must target the exact existing capability");
      if(session.state==="open"){session.state="active";session.revision=1;session.peerAccountId=options.user.uid;session.peerDeviceId=options.deviceId;}
      const result={ok:true,...session,replayed:counts.join>1};
      if(loseJoinAck){loseJoinAck=false;throw unavailable("join committed but acknowledgement was lost");}
      return result;
    },
    async closeSession(options){
      counts.close+=1;
      const session=sessions.get(options.sessionId);
      assert.ok(session,"close must target the exact existing capability");
      if(session.state==="active"){session.state="closed";session.revision=2;}
      const result={ok:true,...session,replayed:counts.close>1};
      if(loseCloseAck){loseCloseAck=false;throw unavailable("close committed but acknowledgement was lost");}
      return result;
    },
    async readSession(options){const session=sessions.get(options.sessionId);return session?{ok:true,...session}:{ok:false,code:"not-found"};},
    async revokeSession(options){const session=sessions.get(options.sessionId);if(session&&session.state==="open"){session.state="revoked";session.revision+=1;}return {ok:true,...session};}
  };
  return {protocol,sessions,counts};
}

function makeRuntime({accountId,deviceId,rivalryId,provider,accountState,pairingState}){
  const online=[];
  const context={
    console,
    setTimeout,
    clearTimeout,
    URL,
    crypto:{},
    navigator:{clipboard:{async writeText(){throw new Error("clipboard should not be needed in contract proof");}}},
    addEventListener(type,listener){if(type==="online")online.push(listener);},
    CareerModeProductionFirebaseRuntime:{async ensureAccountServices(){return {ok:true,auth:{currentUser:{uid:accountState?accountState.accountId:accountId}},firestore:{},firestoreSdk:{}};}},
    CareerModeSparkConnectedAccount:{async initialize(){},getState(){return {connected:true,accountId:accountState?accountState.accountId:accountId};}},
    CareerModeSparkPrivatePairing:{async initialize(){},getState(){return {registered:true,deviceId:pairingState?pairingState.deviceId:deviceId};}},
    CareerModeSparkConnectedRivalry:{async initialize(){},getState(){return {attached:true,rivalryId,accountId:accountState?accountState.accountId:accountId,deviceId:pairingState?pairingState.deviceId:deviceId};}},
    CareerModeSparkPrivateSession:provider.protocol,
    CareerModeSparkStandardAuthPrivateSession:provider.protocol
  };
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context,{filename:"sparkRemoteJoining.js"});
  return {api:context.CareerModeSparkRemoteJoining,online};
}

(async()=>{
  const provider=makeProvider();
  const host=makeRuntime({accountId:"host-account",deviceId:"device-host",rivalryId:"rivalry-stage5g",provider});

  const hostFirst=await host.api.hostSession();
  assert.equal(hostFirst.ok,false);
  assert.equal(hostFirst.recoverable,true);
  assert.equal(host.api.getState().pendingAction,"host");
  assert.equal(host.api.getState().sessionState,"unresolved");
  assert.equal(host.api.getState().capabilityCopyAllowed,false,"unresolved host capability must not be copyable");
  assert.equal(provider.counts.generated,1,"lost Host acknowledgement generated more than one capability");
  assert.equal(provider.sessions.size,1,"lost Host acknowledgement created more than one provider session");

  const blockedReplacement=await host.api.hostSession();
  assert.equal(blockedReplacement.code,"REMOTE_JOINING_SESSION_ALREADY_HELD","unresolved Host allowed a replacement capability");
  assert.equal(provider.counts.generated,1);

  const hostRetry=await host.api.retryPendingOperation();
  assert.equal(hostRetry.ok,true);
  assert.equal(hostRetry.replayed,true);
  assert.equal(host.api.getState().pendingAction,null);
  assert.equal(host.api.getState().sessionState,"open");
  assert.equal(host.api.getState().capabilityCopyAllowed,true);
  assert.equal(provider.counts.generated,1);
  assert.equal(provider.sessions.size,1);
  const capability=host.api.getState().sessionId;

  const peer=makeRuntime({accountId:"peer-account",deviceId:"device-peer",rivalryId:"rivalry-stage5g",provider});
  const joinFirst=await peer.api.joinSession(capability);
  assert.equal(joinFirst.ok,false);
  assert.equal(joinFirst.recoverable,true);
  assert.equal(peer.api.getState().pendingAction,"join");
  assert.equal(peer.api.getState().sessionState,"unresolved");
  assert.equal(peer.api.getState().capabilityCopyAllowed,false);
  assert.equal(provider.sessions.get(capability).state,"active","simulated lost Join acknowledgement did not commit provider state");

  const joinRetry=await peer.api.retryPendingOperation();
  assert.equal(joinRetry.ok,true);
  assert.equal(joinRetry.replayed,true);
  assert.equal(peer.api.getState().sessionState,"active");
  assert.equal(peer.api.getState().revision,1);
  assert.equal(provider.sessions.size,1,"Join recovery duplicated the provider session");

  await host.api.refreshSession();
  assert.equal(host.api.getState().sessionState,"active");
  assert.equal(host.api.getState().revision,1,"two contexts did not converge on the same active revision");

  const closeFirst=await peer.api.closeSession();
  assert.equal(closeFirst.ok,false);
  assert.equal(closeFirst.recoverable,true);
  assert.equal(peer.api.getState().pendingAction,"close");
  assert.equal(peer.api.getState().capabilityCopyAllowed,false);
  assert.equal(provider.sessions.get(capability).state,"closed","simulated lost Close acknowledgement did not commit terminal state");

  assert.equal(peer.online.length,1,"Stage 5G runtime must register exactly one bounded online recovery hook per page runtime");
  peer.online[0]();
  for(let i=0;i<20&&peer.api.getState().pendingAction;i+=1)await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(peer.api.getState().pendingAction,null,"online recovery did not settle the exact pending Close");
  assert.equal(peer.api.getState().sessionState,"closed");
  assert.equal(peer.api.getState().revision,2);
  assert.equal(provider.counts.close,2,"online recovery must perform one exact Close retry after one lost acknowledgement");
  assert.equal(provider.sessions.size,1);

  await host.api.refreshSession();
  assert.equal(host.api.getState().sessionState,"closed","other context did not converge on terminal Close");
  assert.equal(host.api.getState().revision,2);

  const denialProvider=makeProvider();
  denialProvider.protocol.openSession=async()=>({ok:false,code:"permission-denied",message:"denied"});
  const denied=makeRuntime({accountId:"denied-account",deviceId:"device-denied",rivalryId:"rivalry-denied",provider:denialProvider});
  const deniedResult=await denied.api.hostSession();
  assert.equal(deniedResult.ok,false);
  assert.equal(deniedResult.recoverable,false);
  assert.equal(denied.api.getState().sessionId,null,"definitive Host denial retained an unresolved capability");
  assert.equal(denied.api.getState().capabilityCopyAllowed,false);

  const contextProvider=makeProvider();
  const mutableAccount={accountId:"context-host"};
  const mutableDevice={deviceId:"device-context-a"};
  const guarded=makeRuntime({accountId:mutableAccount.accountId,deviceId:mutableDevice.deviceId,rivalryId:"rivalry-context",provider:contextProvider,accountState:mutableAccount,pairingState:mutableDevice});
  await guarded.api.hostSession();
  assert.equal(guarded.api.getState().pendingAction,"host");
  mutableDevice.deviceId="device-context-b";
  const changed=await guarded.api.retryPendingOperation();
  assert.equal(changed.code,"REMOTE_JOINING_RECOVERY_CONTEXT_CHANGED");
  assert.equal(contextProvider.counts.open,1,"authority-context mismatch retried the provider mutation");
  assert.equal(guarded.api.getState().pendingAction,"host","authority-context mismatch discarded unresolved recovery authority");
  assert.equal(guarded.api.getState().capabilityCopyAllowed,false);

  assert.deepEqual(host.api.canonicalStorageKeys,["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"]);
  assert.equal(host.api.canonicalStorageMutation,false);
  assert.equal(host.api.billingRequired,false);
  assert.equal(host.api.blazeRequired,false);
  assert.equal(host.api.cloudRunRequired,false);
  assert.equal(host.api.cloudFunctionsRequired,false);
  assert.equal(host.api.appCheckEnforcementRequired,false);
  assert.equal(host.api.publicDiscovery,false);
  assert.equal(host.api.exactlyTwoAccounts,true);

  console.log("PASS Stage 5G Remote Joining same-capability reconnect contracts");
})().catch(error=>{console.error("STAGE 5G REMOTE JOINING RECONNECT CONTRACTS FAILED");console.error(error.stack||error);process.exit(1);});