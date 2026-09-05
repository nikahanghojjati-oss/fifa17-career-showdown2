const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const capability="session_cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
const sessions=new Map();
const counts={open:0,join:0,close:0,read:0};

function providerCall(accountId,deviceId,rivalryId,action,sessionId){
  assert.equal(sessionId,capability,"Stage 5H must retain the exact one page-memory capability.");
  let session=sessions.get(sessionId);
  if(action==="open"){
    counts.open+=1;
    if(!session){
      session={sessionId,rivalryId,state:"open",revision:0,hostAccountId:accountId,hostDeviceId:deviceId,peerAccountId:null,peerDeviceId:null,expiresAtEpochMs:Date.now()+900000};
      sessions.set(sessionId,session);
    }
    return {ok:true,...session,replayed:counts.open>1};
  }
  if(action==="join"){
    counts.join+=1;
    assert.ok(session,"Join must target the one existing host session.");
    if(session.state==="open"){
      session.state="active";
      session.revision=1;
      session.peerAccountId=accountId;
      session.peerDeviceId=deviceId;
    }
    return {ok:true,...session,replayed:counts.join>1};
  }
  if(action==="close"){
    counts.close+=1;
    assert.ok(session,"Close must target the one active session.");
    if(session.state==="active"){
      session.state="closed";
      session.revision=2;
    }
    return {ok:true,...session,replayed:counts.close>1};
  }
  if(action==="read"){
    counts.read+=1;
    return session?{ok:true,...session}:{ok:false,code:"not-found"};
  }
  throw new Error(`Unexpected Stage 5H provider action ${action}`);
}

async function preparePage(browser,identity){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",error=>errors.push(error.stack||error.message));
  await page.exposeFunction("__stage5hProviderCall",(action,sessionId)=>providerCall(identity.accountId,identity.deviceId,identity.rivalryId,action,sessionId));
  await page.addInitScript(()=>{
    window.requestIdleCallback=()=>1;
    window.cancelIdleCallback=()=>{};
    window.__stage5hOnlineEvents=0;
    window.__stage5hOfflineEvents=0;
    window.addEventListener("online",()=>{window.__stage5hOnlineEvents+=1;});
    window.addEventListener("offline",()=>{window.__stage5hOfflineEvents+=1;});
  });
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  const before=await page.evaluate(()=>["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"].map(key=>[key,localStorage.getItem(key)]));
  await page.evaluate(async identity=>{
    function offlineError(action){const error=new Error(`simulated real-browser offline ${action}`);error.code="network-request-failed";return error;}
    const protocol={
      generateSessionId(){window.__stage5hGenerateCount=(window.__stage5hGenerateCount||0)+1;return "session_cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";},
      normalizeSessionId(value){const normalized=String(value||"").trim().toLowerCase();if(!/^session_[a-f0-9]{64}$/.test(normalized)){const error=new Error("invalid capability");error.code="PRIVATE_SESSION_ID_INVALID";throw error;}return normalized;},
      async openSession(options){if(!navigator.onLine)throw offlineError("Host");return window.__stage5hProviderCall("open",options.sessionId);},
      async joinSession(options){if(!navigator.onLine)throw offlineError("Join");return window.__stage5hProviderCall("join",options.sessionId);},
      async closeSession(options){if(!navigator.onLine)throw offlineError("Close");return window.__stage5hProviderCall("close",options.sessionId);},
      async readSession(options){if(!navigator.onLine)throw offlineError("Read");return window.__stage5hProviderCall("read",options.sessionId);},
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

async function setOffline(entry,value){
  await entry.context.setOffline(value);
  await entry.page.waitForFunction(expected=>navigator.onLine===expected,!value,{timeout:5000});
}

async function waitRecovered(entry,expectedState,expectedRevision){
  await entry.page.waitForFunction(({expectedState,expectedRevision})=>{
    const state=window.CareerModeSparkRemoteJoining.getState();
    return state.pendingAction===null&&state.busy===false&&state.sessionState===expectedState&&state.revision===expectedRevision;
  },{expectedState,expectedRevision},{timeout:5000});
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const host=await preparePage(browser,{accountId:"host-stage5h-account",deviceId:"device-stage5h-host",rivalryId:"rivalry-stage5h-browser"});
  const peer=await preparePage(browser,{accountId:"peer-stage5h-account",deviceId:"device-stage5h-peer",rivalryId:"rivalry-stage5h-browser"});
  try{
    await setOffline(host,true);
    const hostOffline=await host.page.evaluate(()=>window.CareerModeSparkRemoteJoining.hostSession());
    assert.equal(hostOffline.ok,false);
    assert.equal(hostOffline.recoverable,true);
    assert.equal(hostOffline.pendingAction,"host");
    assert.equal(counts.open,0,"offline Host must not mutate the provider");
    assert.equal(sessions.size,0);
    assert.deepEqual(await host.page.evaluate(()=>{const s=window.CareerModeSparkRemoteJoining.getState();return {pendingAction:s.pendingAction,sessionState:s.sessionState,copy:s.capabilityCopyAllowed,generated:window.__stage5hGenerateCount||0};}),{pendingAction:"host",sessionState:"unresolved",copy:false,generated:1});
    await setOffline(host,false);
    await waitRecovered(host,"open",0);
    assert.equal(counts.open,1,"one real online transition must issue exactly one Host provider mutation");
    assert.equal(sessions.size,1);
    assert.equal(await host.page.evaluate(()=>window.__stage5hOnlineEvents>=1),true,"Host context must observe a browser online event");
    console.log("PASS Stage 5H real browser offline Host recovered on online event with one capability and one provider mutation");

    await setOffline(peer,true);
    const peerOffline=await peer.page.evaluate(code=>window.CareerModeSparkRemoteJoining.joinSession(code),capability);
    assert.equal(peerOffline.ok,false);
    assert.equal(peerOffline.recoverable,true);
    assert.equal(peerOffline.pendingAction,"join");
    assert.equal(counts.join,0,"offline Join must not mutate the provider");
    assert.equal(sessions.get(capability).state,"open");
    assert.equal(await peer.page.evaluate(()=>window.CareerModeSparkRemoteJoining.getState().capabilityCopyAllowed),false);
    await setOffline(peer,false);
    await waitRecovered(peer,"active",1);
    assert.equal(counts.join,1,"one real online transition must issue exactly one Join provider mutation");
    assert.equal(sessions.size,1);
    await host.page.evaluate(()=>window.CareerModeSparkRemoteJoining.refreshSession());
    assert.deepEqual(await host.page.evaluate(()=>{const s=window.CareerModeSparkRemoteJoining.getState();return [s.sessionState,s.revision];}),["active",1]);
    assert.equal(await peer.page.evaluate(()=>window.__stage5hOnlineEvents>=1),true,"Peer context must observe a browser online event");
    console.log("PASS Stage 5H independently-offline peer recovered Join and both contexts converged at revision 1");

    await setOffline(host,true);
    const closeOffline=await host.page.evaluate(()=>window.CareerModeSparkRemoteJoining.closeSession());
    assert.equal(closeOffline.ok,false);
    assert.equal(closeOffline.recoverable,true);
    assert.equal(closeOffline.pendingAction,"close");
    assert.equal(counts.close,0,"offline Close must not mutate the provider");
    assert.equal(sessions.get(capability).state,"active");
    assert.equal(await host.page.evaluate(()=>window.CareerModeSparkRemoteJoining.getState().capabilityCopyAllowed),false);
    await setOffline(host,false);
    await waitRecovered(host,"closed",2);
    assert.equal(counts.close,1,"one real online transition must issue exactly one terminal Close mutation");
    await peer.page.evaluate(()=>window.CareerModeSparkRemoteJoining.refreshSession());
    assert.deepEqual(await peer.page.evaluate(()=>{const s=window.CareerModeSparkRemoteJoining.getState();return [s.sessionState,s.revision];}),["closed",2]);
    assert.equal(sessions.size,1);
    console.log("PASS Stage 5H real browser offline Close recovered terminally and both contexts converged at revision 2");

    await host.page.evaluate(()=>{window.dispatchEvent(new Event("online"));window.dispatchEvent(new Event("online"));});
    await host.page.waitForTimeout(100);
    assert.deepEqual({open:counts.open,join:counts.join,close:counts.close},{open:1,join:1,close:1},"extra online events after resolution must not duplicate provider mutations");

    for(const entry of [host,peer]){
      const after=await entry.page.evaluate(()=>["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"].map(key=>[key,localStorage.getItem(key)]));
      assert.deepEqual(after,entry.before,"Stage 5H adverse-network automation mutated canonical local save storage");
      assert.deepEqual(entry.errors,[],"Stage 5H adverse-network audit emitted page errors");
      const events=await entry.page.evaluate(()=>({online:window.__stage5hOnlineEvents,offline:window.__stage5hOfflineEvents}));
      assert.ok(events.online>=1&&events.offline>=1,"each independent browser context must observe real offline/online lifecycle events");
    }
    assert.equal(await host.page.evaluate(()=>window.CareerModeSparkRemoteJoining.billingRequired),false);
    assert.equal(await host.page.evaluate(()=>window.CareerModeSparkRemoteJoining.blazeRequired),false);
    assert.equal(await host.page.evaluate(()=>window.CareerModeSparkRemoteJoining.cloudRunRequired),false);
    assert.equal(await host.page.evaluate(()=>window.CareerModeSparkRemoteJoining.cloudFunctionsRequired),false);
    console.log(`PASS Stage 5H two-context real-browser adverse-network recovery audit at ${baseUrl.href}`);
  }finally{
    await Promise.allSettled([host.context.close(),peer.context.close()]);
    if(browser.isConnected())await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error("STAGE 5H REMOTE JOINING ADVERSE-NETWORK AUDIT FAILED");console.error(error.stack||error);process.exit(1);});
