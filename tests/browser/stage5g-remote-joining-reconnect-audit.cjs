const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const capability="session_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const sessions=new Map();
const counts={open:0,join:0,close:0};

function providerCall(accountId,deviceId,rivalryId,action,sessionId){
  if(sessionId!==capability)throw new Error("Stage 5G browser audit received an unexpected capability.");
  let session=sessions.get(sessionId);
  if(action==="open"){
    counts.open+=1;
    if(!session){session={sessionId,rivalryId,state:"open",revision:0,hostAccountId:accountId,hostDeviceId:deviceId,peerAccountId:null,expiresAtEpochMs:Date.now()+900000};sessions.set(sessionId,session);}
    const result={ok:true,...session,replayed:counts.open>1};
    return counts.open===1?{transportError:"firestore/unavailable"}:result;
  }
  if(action==="join"){
    counts.join+=1;
    assert.ok(session,"Join must target the one existing host session.");
    if(session.state==="open"){session.state="active";session.revision=1;session.peerAccountId=accountId;session.peerDeviceId=deviceId;}
    const result={ok:true,...session,replayed:counts.join>1};
    return counts.join===1?{transportError:"firestore/unavailable"}:result;
  }
  if(action==="close"){
    counts.close+=1;
    assert.ok(session,"Close must target the one active session.");
    if(session.state==="active"){session.state="closed";session.revision=2;}
    const result={ok:true,...session,replayed:counts.close>1};
    return counts.close===1?{transportError:"firestore/unavailable"}:result;
  }
  if(action==="read")return session?{ok:true,...session}:{ok:false,code:"not-found"};
  throw new Error(`Unexpected Stage 5G provider action ${action}`);
}

async function preparePage(browser,identity){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",error=>errors.push(error.stack||error.message));
  await page.exposeFunction("__stage5gProviderCall",(action,sessionId)=>providerCall(identity.accountId,identity.deviceId,identity.rivalryId,action,sessionId));
  await page.addInitScript(()=>{window.requestIdleCallback=()=>1;window.cancelIdleCallback=()=>{};});
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  const before=await page.evaluate(()=>["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"].map(key=>[key,localStorage.getItem(key)]));
  await page.evaluate(async identity=>{
    const protocol={
      generateSessionId(){window.__stage5gGenerateCount=(window.__stage5gGenerateCount||0)+1;return "session_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";},
      normalizeSessionId(value){const normalized=String(value||"").trim().toLowerCase();if(!/^session_[a-f0-9]{64}$/.test(normalized)){const error=new Error("invalid capability");error.code="PRIVATE_SESSION_ID_INVALID";throw error;}return normalized;},
      async openSession(options){const result=await window.__stage5gProviderCall("open",options.sessionId);if(result.transportError){const error=new Error("simulated Host acknowledgement loss");error.code=result.transportError;throw error;}return result;},
      async joinSession(options){const result=await window.__stage5gProviderCall("join",options.sessionId);if(result.transportError){const error=new Error("simulated Join acknowledgement loss");error.code=result.transportError;throw error;}return result;},
      async closeSession(options){const result=await window.__stage5gProviderCall("close",options.sessionId);if(result.transportError){const error=new Error("simulated Close acknowledgement loss");error.code=result.transportError;throw error;}return result;},
      async readSession(options){return window.__stage5gProviderCall("read",options.sessionId);},
      async revokeSession(){return {ok:false,code:"not-needed"};}
    };
    window.CareerModeProductionFirebaseRuntime={async ensureAccountServices(){return {ok:true,auth:{currentUser:{uid:identity.accountId}},firestore:{},firestoreSdk:{}};}};
    window.CareerModeSparkConnectedAccount={async initialize(){},getState(){return {connected:true,accountId:identity.accountId};}};
    window.CareerModeSparkPrivatePairing={async initialize(){},getState(){return {registered:true,deviceId:identity.deviceId};}};
    window.CareerModeSparkConnectedRivalry={async initialize(){},getState(){return {attached:true,rivalryId:identity.rivalryId,accountId:identity.accountId,deviceId:identity.deviceId};}};
    window.CareerModeSparkPrivateSession=protocol;
    window.CareerModeSparkStandardAuthPrivateSession=protocol;
    if(typeof loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");
    await loadRuntimeScript("rj","js/sparkRemoteJoining.js",()=>window.CareerModeSparkRemoteJoining);
  },identity);
  return {context,page,errors,before};
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const host=await preparePage(browser,{accountId:"host-browser-account",deviceId:"device-browser-host",rivalryId:"rivalry-stage5g-browser"});
  const peer=await preparePage(browser,{accountId:"peer-browser-account",deviceId:"device-browser-peer",rivalryId:"rivalry-stage5g-browser"});
  try{
    const hostFirst=await host.page.evaluate(()=>window.CareerModeSparkRemoteJoining.hostSession());
    const hostFirstState=await host.page.evaluate(()=>{const state=window.CareerModeSparkRemoteJoining.getState();return {status:state.status,pendingAction:state.pendingAction,sessionState:state.sessionState,generated:window.__stage5gGenerateCount||0};});
    console.log("Stage 5G Host first diagnostic",JSON.stringify({ok:hostFirst&&hostFirst.ok,code:hostFirst&&hostFirst.code||null,recoverable:hostFirst&&hostFirst.recoverable===true,message:hostFirst&&hostFirst.message||null,providerOpenCalls:counts.open,state:hostFirstState}));
    assert.equal(hostFirst.ok,false);
    assert.equal(hostFirst.recoverable,true);
    const hostPending=await host.page.evaluate(()=>{const api=window.CareerModeSparkRemoteJoining;api.openPanel();const state=api.getState();return {pendingAction:state.pendingAction,sessionState:state.sessionState,copy:state.capabilityCopyAllowed,fullVisible:document.getElementById("sparkRemoteJoiningOverlay").innerText.includes(state.sessionId),generated:window.__stage5gGenerateCount};});
    assert.deepEqual(hostPending,{pendingAction:"host",sessionState:"unresolved",copy:false,fullVisible:false,generated:1});
    assert.equal(sessions.size,1);
    console.log("PASS Stage 5G Host lost-acknowledgement state is unresolved and capability-hidden");

    const hostRetry=await host.page.evaluate(()=>window.CareerModeSparkRemoteJoining.retryPendingOperation());
    assert.equal(hostRetry.ok,true);
    assert.equal(hostRetry.replayed,true);
    assert.equal(counts.open,2);
    assert.equal(sessions.size,1);
    const hostReady=await host.page.evaluate(()=>{const state=window.CareerModeSparkRemoteJoining.getState();return {state:state.sessionState,revision:state.revision,copy:state.capabilityCopyAllowed,generated:window.__stage5gGenerateCount};});
    assert.deepEqual(hostReady,{state:"open",revision:0,copy:true,generated:1});
    console.log("PASS Stage 5G Host exact-capability retry recovered without duplicate session");

    const peerFirst=await peer.page.evaluate(code=>window.CareerModeSparkRemoteJoining.joinSession(code),capability);
    assert.equal(peerFirst.ok,false);
    assert.equal(peerFirst.recoverable,true);
    const peerPending=await peer.page.evaluate(()=>{const api=window.CareerModeSparkRemoteJoining;api.openPanel();const state=api.getState();return {pendingAction:state.pendingAction,sessionState:state.sessionState,copy:state.capabilityCopyAllowed,fullVisible:document.getElementById("sparkRemoteJoiningOverlay").innerText.includes(state.sessionId)};});
    assert.deepEqual(peerPending,{pendingAction:"join",sessionState:"unresolved",copy:false,fullVisible:false});
    assert.equal(sessions.get(capability).state,"active");
    console.log("PASS Stage 5G Join lost-acknowledgement state is unresolved and capability-hidden");

    const peerRetry=await peer.page.evaluate(()=>window.CareerModeSparkRemoteJoining.retryPendingOperation());
    assert.equal(peerRetry.ok,true);
    assert.equal(peerRetry.replayed,true);
    assert.equal(sessions.size,1);
    await host.page.evaluate(()=>window.CareerModeSparkRemoteJoining.refreshSession());
    assert.deepEqual(await host.page.evaluate(()=>{const state=window.CareerModeSparkRemoteJoining.getState();return [state.sessionState,state.revision];}),["active",1]);
    assert.deepEqual(await peer.page.evaluate(()=>{const state=window.CareerModeSparkRemoteJoining.getState();return [state.sessionState,state.revision];}),["active",1]);
    console.log("PASS Stage 5G both contexts converged to the one active session at revision 1");

    const closeFirst=await peer.page.evaluate(()=>window.CareerModeSparkRemoteJoining.closeSession());
    assert.equal(closeFirst.ok,false);
    assert.equal(closeFirst.recoverable,true);
    assert.equal(await peer.page.evaluate(()=>window.CareerModeSparkRemoteJoining.getState().capabilityCopyAllowed),false);
    assert.equal(sessions.get(capability).state,"closed");
    await peer.page.evaluate(()=>window.dispatchEvent(new Event("online")));
    await peer.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining.getState().pendingAction===null,null,{timeout:5000});
    assert.equal(counts.close,2,"one online event must produce exactly one same-capability Close retry");
    assert.equal(sessions.size,1);
    assert.deepEqual(await peer.page.evaluate(()=>{const state=window.CareerModeSparkRemoteJoining.getState();return [state.sessionState,state.revision];}),["closed",2]);
    await host.page.evaluate(()=>window.CareerModeSparkRemoteJoining.refreshSession());
    assert.deepEqual(await host.page.evaluate(()=>{const state=window.CareerModeSparkRemoteJoining.getState();return [state.sessionState,state.revision];}),["closed",2]);
    console.log("PASS Stage 5G bounded online retry converged both contexts to terminal revision 2");

    for(const entry of [host,peer]){
      const after=await entry.page.evaluate(()=>["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"].map(key=>[key,localStorage.getItem(key)]));
      assert.deepEqual(after,entry.before,"Stage 5G reconnect automation mutated canonical local save storage");
      assert.deepEqual(entry.errors,[],"Stage 5G two-context reconnect audit emitted page errors");
    }
    assert.equal(counts.open,2);
    assert.equal(counts.join,2);
    assert.equal(counts.close,2);
    console.log(`PASS Stage 5G two-context same-capability reconnect audit at ${baseUrl.href}`);
  }finally{
    await Promise.allSettled([host.context.close(),peer.context.close()]);
    if(browser.isConnected())await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error("STAGE 5G REMOTE JOINING RECONNECT AUDIT FAILED");console.error(error.stack||error);process.exit(1);});