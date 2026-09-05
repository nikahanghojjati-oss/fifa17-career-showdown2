const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const source=read("js/sparkRemoteJoining.js"),html=read("index.html"),app=read("js/app.js"),worker=read("service-worker.js"),runtime=read("js/productionFirebaseRuntime.js"),readiness=JSON.parse(read("REMOTE_JOINING_READINESS.json"));
for(const forbidden of ["localStorage","sessionStorage","indexedDB","getDocs(","collection(","enableIndexedDbPersistence","persistentLocalCache","Cloud Run","Blaze upgrade"])assert.equal(source.includes(forbidden),false,`Stage 5E runtime must not contain ${forbidden}`);
for(const required of ["stage5e-production-private-remote-joining-runtime","page-memory-only","productionRulesPublished:true","publicDiscovery:false","collectionListing:false","exactlyTwoAccounts:true","canonicalStorageMutation:false","gameplayMutation:false","billingRequired:false","hostJoinUxExposed:true"])assert.ok(source.includes(required),`Missing Stage 5E lock: ${required}`);
assert.equal(/<script[^>]+src=["\'][^"\']*sparkRemoteJoining\.js/i.test(html),false,"Remote Joining runtime must not load from ordinary HTML startup.");
assert.ok(html.includes('id="remoteJoiningButton"')&&html.includes("loadRuntimeScript('rj','js/sparkRemoteJoining.js'")&&html.includes("loadRuntimeStyle('rj','css/remoteJoining.css'"));
assert.ok(worker.includes('"js/sparkRemoteJoining.js"')&&worker.includes('"css/remoteJoining.css"')&&worker.includes('"js/sparkPrivateSession.js"')&&worker.includes('"js/sparkStandardAuthPrivateSession.js"'));
assert.ok(runtime.includes('const FALLBACK_RUNTIME_REVISION="1.9.0-r1";'));
assert.equal(readiness.currentScore,100,"Stage 5E source/runtime wiring itself earns no RJR credit; current RJR100 must come from separate provider/owner capability evidence, including Stage 5F production negatives, genuine physical acceptance and final stable-release acceptance.");
const stage5eLifecycleEvidence=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-stage5e-r3-provider-live-remote-joining-lifecycle");
assert.equal(stage5eLifecycleEvidence?.score,88);
assert.equal(stage5eLifecycleEvidence?.delta,1);
assert.equal(stage5eLifecycleEvidence?.domainId,"devices-pairing-connected-rivalry-remote-join");
assert.match(stage5eLifecycleEvidence?.reason||"",/actual Remote Joining session capability end to end/i);
assert.match(stage5eLifecycleEvidence?.reason||"",/zero credit[\s\S]+zero-manual-reattach/i);
const r5ConvergenceEvidence=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-r5-one-paste-zero-manual-reattach-convergence");
assert.equal(r5ConvergenceEvidence?.score,89);
assert.equal(r5ConvergenceEvidence?.delta,1);
assert.equal(r5ConvergenceEvidence?.domainId,"devices-pairing-connected-rivalry-remote-join");
assert.match(r5ConvergenceEvidence?.reason||"",/ONE PASTE CONFIRMED/i);
assert.match(r5ConvergenceEvidence?.reason||"",/Zero manual Connected Rivalry Verify\/Reattach/i);
assert.match(r5ConvergenceEvidence?.reason||"",/No credit is awarded for PR #187[\s\S]+source[\s\S]+CI[\s\S]+deployment/i);
const stage5fEvidence=readiness.evidenceHistory?.filter(entry=>entry.score===90||entry.score===91)||[];
assert.equal(stage5fEvidence.length,2,"Exactly two Stage 5F production-negative evidence events must advance RJR 89 to 91.");
assert.ok(stage5fEvidence.every(entry=>entry.delta===1&&entry.domainId==="identity-auth-trust"));
assert.match(stage5fEvidence.map(entry=>entry.reason||"").join("\n"),/revoked-device/i);
assert.match(stage5fEvidence.map(entry=>entry.reason||"").join("\n"),/third account|third-account|non-participant|unrelated/i);
const physicalAcceptance=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-rjr-physical-two-device-two-network-acceptance");
const stableReleaseAcceptance=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-rjr-final-stable-release-acceptance");
assert.equal(physicalAcceptance?.score,99);
assert.equal(physicalAcceptance?.delta,8);
assert.equal(physicalAcceptance?.domainId,"devices-pairing-connected-rivalry-remote-join");
assert.equal(stableReleaseAcceptance?.score,100);
assert.equal(stableReleaseAcceptance?.delta,1);
assert.equal(stableReleaseAcceptance?.domainId,"real-device-hardening-release");
assert.deepEqual(readiness.domains.map(d=>[d.id,d.earned]),[["deterministic-sync-recovery",20],["identity-auth-trust",20],["production-cloud-security",20],["devices-pairing-connected-rivalry-remote-join",30],["real-device-hardening-release",10]]);

const calls={services:0,account:0,pairing:0,rivalry:0,open:[],join:[],read:[],revoke:[],close:[]};
const sessionA=`session_${"a".repeat(64)}`,sessionB=`session_${"b".repeat(64)}`,rivalryId=`pair_${"c".repeat(64)}`,deviceId=`device_${"d".repeat(32)}`;
const user={uid:"account-one"},firestore={},firestoreSdk={};
const protocol={
  generateSessionId:()=>sessionA,
  normalizeSessionId:value=>{const v=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(v))throw Object.assign(new Error("invalid session"),{code:"PRIVATE_SESSION_ID_INVALID"});return v;},
  openSession:async options=>{calls.open.push(options);return {ok:true,sessionId:options.sessionId,state:"open",revision:0,expiresAtEpochMs:Date.now()+900000};},
  joinSession:async options=>{calls.join.push(options);return {ok:true,sessionId:options.sessionId,state:"active",revision:1,expiresAtEpochMs:Date.now()+800000};},
  readSession:async options=>{calls.read.push(options);return {ok:true,sessionId:options.sessionId,state:"active",revision:1,expiresAtEpochMs:Date.now()+700000,expiredByClock:false};},
  revokeSession:async options=>{calls.revoke.push(options);return {ok:true,sessionId:options.sessionId,state:"revoked",revision:1,expiresAtEpochMs:Date.now()+650000};},
  closeSession:async options=>{calls.close.push(options);return {ok:true,sessionId:options.sessionId,state:"closed",revision:2,expiresAtEpochMs:Date.now()+600000};}
};
const context={console,URL,Date,TextEncoder,crypto:require("node:crypto").webcrypto,setTimeout,clearTimeout,navigator:{},location:{href:"https://example.test/",origin:"https://example.test",pathname:"/"},CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>{calls.services++;return {ok:true,auth:{currentUser:user},firestore,firestoreSdk};}},CareerModeSparkConnectedAccount:{initialize:async()=>{calls.account++;},getState:()=>({connected:true,accountId:user.uid})},CareerModeSparkPrivatePairing:{initialize:async()=>{calls.pairing++;},getState:()=>({registered:true,deviceId})},CareerModeSparkConnectedRivalry:{initialize:async()=>{calls.rivalry++;},getState:()=>({attached:true,rivalryId,accountId:user.uid,deviceId})},CareerModeSparkPrivateSession:{},CareerModeSparkStandardAuthPrivateSession:protocol};
context.globalThis=context;context.window=context;vm.createContext(context);vm.runInContext(`${source}\n;globalThis.__stage5e=CareerModeSparkRemoteJoining;`,context);const api=context.__stage5e;
assert.equal(api.openPanel(),false,"No-document open must remain inert.");assert.equal(calls.services,0,"Opening UI without an action must not initialize Firebase services.");
(async()=>{
  let result=await api.hostSession();assert.equal(result.ok,true);assert.equal(calls.open.length,1);assert.equal(calls.open[0].sessionId,sessionA);assert.equal(calls.open[0].rivalryId,rivalryId);assert.equal(calls.open[0].deviceId,deviceId);assert.equal(api.getState().sessionId,sessionA);assert.equal(api.getState().role,"host");
  result=await api.hostSession();assert.equal(result.ok,false);assert.equal(result.code,"REMOTE_JOINING_SESSION_ALREADY_HELD");assert.equal(calls.open.length,1,"Hosting over a live capability must not open a second provider session.");
  result=await api.joinSession(sessionB);assert.equal(result.ok,false);assert.equal(result.code,"REMOTE_JOINING_SESSION_ALREADY_HELD");assert.equal(calls.join.length,0,"Joining while a live host capability is held must not orphan the host session.");
  result=await api.revokeSession();assert.equal(result.ok,true);assert.equal(calls.revoke.length,1);assert.equal(calls.revoke[0].sessionId,sessionA);assert.equal(api.getState().sessionState,"revoked");
  api.forgetSession();assert.equal(api.getState().sessionId,null);
  result=await api.joinSession(sessionB.toUpperCase());assert.equal(result.ok,true);assert.equal(calls.join.length,1);assert.equal(calls.join[0].sessionId,sessionB);assert.equal(api.getState().role,"peer");
  result=await api.refreshSession();assert.equal(result.ok,true);assert.equal(calls.read.length,1);assert.equal(calls.read[0].sessionId,sessionB);
  result=await api.closeSession();assert.equal(result.ok,true);assert.equal(calls.close.length,1);assert.equal(api.getState().sessionState,"closed");
  api.forgetSession();assert.equal(api.getState().sessionId,null);assert.ok(calls.services>=4&&calls.account>=4&&calls.pairing>=4&&calls.rivalry>=4);
  assert.deepEqual(Array.from(api.canonicalStorageKeys),["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"]);
  console.log("PASS Stage 5E production Remote Joining runtime contracts: lazy action authority, non-orphaning host/join/revoke/read/close lifecycle and memory-only capability remain protected; current fixed RJR100 comes only from separately proven provider/owner/physical capability evidence and final stable-release acceptance, while Stage 5E source/runtime wiring earns zero duplicate credit.");
})().catch(error=>{console.error(error);process.exit(1);});
