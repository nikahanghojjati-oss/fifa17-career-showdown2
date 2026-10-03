"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");

const runtime=fs.readFileSync("js/productionSharedTerminalClose.js","utf8");
const bootstrap=fs.readFileSync("js/ssjr.js","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");

for(const required of [
  'feature:"ssjr-production-shared-terminal-close"',
  'runtimeRevision:"1.9.1-r18"',
  'requiresFinalReconciliation:true',
  'requiresExactActiveSessionToClose:true',
  'sameWitnessRetry:true',
  'terminalReadAfterReload:true',
  'terminalSessionResurrection:false',
  'canonicalStorageMutation:false',
  'listPermissionRequired:false',
  'billingRequired:false',
  'blazeRequired:false',
  'cloudRunRequired:false',
  'cloudFunctionsRequired:false',
  'CareerModeProductionSharedFinalReconciliation',
  'CareerModeSharedTerminalClose',
  'CareerModeSparkTerminalClose',
  'CareerModeSparkRemoteJoining',
  'CareerModeSparkConnectedAccount',
  'CareerModeSparkPrivatePairing',
  'CareerModeSparkConnectedRivalry',
  'provider.read',
  'provider.close',
  'protocol.prepare(final,{sessionId:remote.sessionId})',
  'protocol.closeResult(intent,result)',
  'TERMINAL_CLOSE_ACTIVE_SESSION_REQUIRED',
  'RECOVERY_PENDING',
  'RETRY SAME TERMINAL CLOSE',
  'remoteApi?.forgetSession?.()',
  'career-mode-shared-terminal-close-state-change'
])assert.ok(runtime.includes(required),required);

assert.doesNotMatch(runtime,/localStorage|sessionStorage|\.setItem\(|\.removeItem\(/,"Terminal Close production runtime must not write canonical or auxiliary browser storage");
assert.doesNotMatch(runtime,/collection\(|getDocs\(|query\(|where\(/,"Terminal Close runtime must use exact document authority only");
assert.doesNotMatch(runtime,/firebase-admin|googleapis|https:\/\/run\.googleapis\.com|https:\/\/cloudfunctions\.googleapis\.com/i,"Terminal Close runtime must not import or call paid/server compute surfaces");
assert.match(runtime,/remote\.sessionState==="active"/);
assert.match(runtime,/remote\.pendingAction==null/);
assert.doesNotMatch(runtime,/now<expiry/,"Terminal Close must not reject an otherwise ACTIVE Showdown only because its original session TTL passed.");
assert.match(runtime,/terminalRead\?\.ok===true&&terminalRead\.terminal===true/);
assert.match(runtime,/protocol\.sameWitness\(terminalRead\.terminalWitness,intent\)/);
assert.match(runtime,/stateContextKey!==request\.key/);

const finalIndex=bootstrap.indexOf('const finalReconciliation=(async()=>');
const terminalIndex=bootstrap.indexOf('const terminalClose=(async()=>');
assert.ok(finalIndex>=0&&terminalIndex>finalIndex,"Terminal Close bootstrap must be sequenced after Final Reconciliation");
assert.match(bootstrap,/const terminalClose=\(async\(\)=>\{\s*await finalReconciliation;/);
assert.match(bootstrap,/\["ssjr-terminal-close-protocol","js\/sharedTerminalClose\.js","CareerModeSharedTerminalClose"\]/);
assert.match(bootstrap,/\["ssjr-terminal-close-provider","js\/sparkTerminalClose\.js","CareerModeSparkTerminalClose"\]/);
assert.match(bootstrap,/install\("ssjr-production-terminal-close","js\/productionSharedTerminalClose\.js","CareerModeProductionSharedTerminalClose"\)/);
assert.match(bootstrap,/finalReconciliation,terminalClose/);

for(const asset of ["js/sharedTerminalClose.js","js/sparkTerminalClose.js","js/productionSharedTerminalClose.js"]){assert.ok(worker.includes(`"${asset}"`),`service worker shell missing ${asset}`);}

// sparkTerminalClose.js captures CareerModeSparkPrivateSession when it loads, so the session protocol must load first,
// otherwise every real close returns TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE (found by the two-manager browser journey).
const sessionLoad=bootstrap.indexOf('["private-session","js/sparkPrivateSession.js","CareerModeSparkPrivateSession"]'),providerLoad=bootstrap.indexOf('["ssjr-terminal-close-provider","js/sparkTerminalClose.js"');
assert.ok(sessionLoad>0&&providerLoad>sessionLoad,"the SSJR bootstrap must load the private-session protocol before the Terminal Close provider");
const providerSource=fs.readFileSync("js/sparkTerminalClose.js","utf8");assert.match(providerSource,/root\.CareerModeSparkPrivateSession;/,"provider still binds the session protocol at load time");

// After Terminal Close the session is closed, so Shared Setup is no longer ready; the same save must keep the rivalry it
// already resolved or the other manager's page never reaches CLOSED (found by the two-manager browser journey, J10).
assert.match(runtime,/rememberedRequest&&rememberedRequest\.saveId===saveId&&rememberedRequest\.playerOneProfileId===playerOneProfileId&&rememberedRequest\.playerTwoProfileId===playerTwoProfileId\?rememberedRequest\.rivalryId:""/,"only the same save and manager pair reuse a remembered rivalry");
assert.match(runtime,/showdown\.sharedJourney\?\.rivalryId\|\|ptcConfirmedSetupRivalry\(\)\|\|remembered\|\|""/,"the journey marker and confirmed Setup still win over the remembered rivalry");
assert.ok(runtime.indexOf("rememberedRequest=Object.freeze(")>runtime.indexOf("!/^pair_[0-9a-f]{64}$/.test(rivalryId)"),"only a fully validated request is remembered");
// Active-journey refreshers lose read access once the rivalry closes; their failures stay quiet only after a verified CLOSED read.
assert.match(runtime,/reportUnlessClosed:ptcReportUnlessClosed/);
assert.match(runtime,/if\(current\?\.phase!=="CLOSED"&&ptcRequest\(\)\)current=await ptcRefresh\(\);if\(current&&current\.phase==="CLOSED"\)return false;/);
assert.match(runtime,/\}catch\(_error\)\{\}\s*ptcReport\(context,error\);return true;/,"any other failure is still reported");
for(const [file,prefix] of [["js/productionSharedCanonicalScoring.js","pcsc"],["js/productionSharedHistoryConvergence.js","phc"],["js/productionSharedMultiSeasonProgression.js","pmsp"],["js/productionSharedSeasonCommit.js","pssc"],["js/productionSharedTransferChallenge.js","pstc"],["js/productionSharedSeasonResults.js","pssr"]]){
  const source=fs.readFileSync(file,"utf8");
  assert.ok(source.includes(`function ${prefix}Report(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);`),`${file} routes its errors through Terminal Close`);
}

console.log("PASS r18 production Terminal Close contracts: exact r17 final authority + exact ACTIVE session gate the sole terminal mutation; ambiguous outcomes retain one exact witness for retry; closed rivalry recovers by exact read after reload; storage/list/billing/compute authority remains absent; bootstrap and offline shell ordering are explicit.");
