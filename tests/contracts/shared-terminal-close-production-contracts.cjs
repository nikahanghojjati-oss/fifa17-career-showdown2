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
assert.match(runtime,/now<expiry/);
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

console.log("PASS r18 production Terminal Close contracts: exact r17 final authority + exact unexpired ACTIVE session gate the sole terminal mutation; ambiguous outcomes retain one exact witness for retry; closed rivalry recovers by exact read after reload; storage/list/billing/compute authority remains absent; bootstrap and offline shell ordering are explicit.");
