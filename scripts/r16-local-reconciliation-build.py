from pathlib import Path
import json

PROTOCOL = r'''(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedLocalReconciliation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const RUNTIME_REVISION="1.9.1-r16";
  const RIVALRY=/^pair_[0-9a-f]{64}$/;
  const SAVE=/^save_[0-9a-f]{24}$/;
  const PROFILE=/^profile_[0-9a-f]{24}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const ROLES=new Set(["playerOne","playerTwo"]);
  const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  function freeze(v){if(v&&typeof v==="object"&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
  function validBinding(v){return Boolean(v&&SAVE.test(String(v.saveId||""))&&PROFILE.test(String(v.profileId||""))&&ROLES.has(v.managerRole));}
  function observed(v){return Boolean(v&&Number.isInteger(v.revision)&&v.revision>=0&&HASH.test(String(v.contentHash||""))&&v.lifecycleState==="live");}
  function base(phase,extra={}){return freeze({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase,canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,...extra});}
  function project({sharedActive=false,history=null,connected=null,online=true}={}){
    if(!sharedActive)return base("INACTIVE",{previewAllowed:false,applyAllowed:false,reason:"local-journey"});
    if(!history||history.authoritative!==true||history.phase!=="HISTORY_CONVERGED"||!RIVALRY.test(String(history.rivalryId||"")))return base("BLOCKED",{previewAllowed:false,applyAllowed:false,reason:"history-not-authoritative"});
    if(!connected||connected.connected!==true||connected.attached!==true||String(connected.rivalryId||"")!==String(history.rivalryId)||!validBinding(connected.binding))return base("BLOCKED",{previewAllowed:false,applyAllowed:false,reason:"connected-rivalry-not-exact"});
    const binding=freeze(clone(connected.binding));
    const envelope=connected.observedEnvelope;
    if(connected.status==="reconciliation-applied"&&Number.isInteger(connected.localCommitRevision)&&HASH.test(String(connected.localCommitContentHash||""))&&connected.localCommitSaveId===binding.saveId){
      return base("APPLIED",{previewAllowed:Boolean(observed(envelope)),applyAllowed:false,reason:null,binding,remoteRevision:connected.localCommitRevision,remoteContentHash:connected.localCommitContentHash});
    }
    if(connected.reconciliationPreviewReady===true&&Number.isInteger(connected.previewRevision)&&HASH.test(String(connected.previewContentHash||""))&&connected.previewSaveId===binding.saveId){
      return base(online?"PREVIEW_READY":"OFFLINE_FALLBACK",{previewAllowed:Boolean(observed(envelope)),applyAllowed:Boolean(online),reason:online?null:"offline-apply-denied",binding,remoteRevision:connected.previewRevision,remoteContentHash:connected.previewContentHash});
    }
    if(observed(envelope))return base(online?"REMOTE_OBSERVED":"OFFLINE_FALLBACK",{previewAllowed:true,applyAllowed:false,reason:online?null:"offline-preview-only",binding,remoteRevision:envelope.revision,remoteContentHash:envelope.contentHash});
    return base(online?"WAITING_REMOTE":"OFFLINE_FALLBACK",{previewAllowed:false,applyAllowed:false,reason:online?"remote-not-observed":"offline-no-observed-remote",binding,remoteRevision:null,remoteContentHash:null});
  }
  return Object.freeze({contractVersion:1,feature:"ssjr-shared-local-reconciliation",runtimeRevision:RUNTIME_REVISION,project,canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true});
});
'''

PRODUCTION = r'''(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedLocalReconciliation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const POLL_MS=15000;
  let installed=false,state=null,unsubscribe=null,timer=null;
  function showdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function sharedActive(){const s=showdown();return Boolean(s&&s.sharedJourney&&s.sharedJourney.mode==="shared");}
  function online(){return !(root.navigator&&root.navigator.onLine===false);}
  function protocol(){return root.CareerModeSharedLocalReconciliation||null;}
  function history(){try{return root.CareerModeProductionSharedHistoryConvergence?.getState?.()||null;}catch(_error){return null;}}
  function connected(){return root.CareerModeSparkConnectedRivalry||null;}
  function dispatch(){try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-local-reconciliation-state-change",{detail:state}));}catch(_error){}return state;}
  function refresh(){
    const p=protocol();if(!p||typeof p.project!=="function"){state=null;return null;}
    let c=null;try{c=connected()?.getState?.()||null;}catch(_error){}
    state=p.project({sharedActive:sharedActive(),history:history(),connected:c,online:online()});
    return dispatch();
  }
  async function ensureConnected(){
    if(!connected()&&typeof root.loadRuntimeScript==="function")await root.loadRuntimeScript("spark-connected-rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry);
    const api=connected();
    if(!api||typeof api.getState!=="function"||typeof api.previewLocalReconciliation!=="function"||typeof api.applyLocalReconciliation!=="function")throw Object.assign(new Error("Connected Rivalry reconciliation authority is unavailable."),{code:"LOCAL_RECONCILIATION_AUTHORITY_UNAVAILABLE"});
    if(typeof api.initialize==="function")await api.initialize();
    return api;
  }
  async function preview(){
    const api=await ensureConnected();let before=refresh();
    if(!before||before.previewAllowed!==true)return {ok:false,code:"LOCAL_RECONCILIATION_PREVIEW_BLOCKED",state:before};
    await api.previewLocalReconciliation(before.binding);
    const after=refresh();
    if(!after||!(after.phase==="PREVIEW_READY"||after.phase==="OFFLINE_FALLBACK"))return {ok:false,code:"LOCAL_RECONCILIATION_PREVIEW_FAILED",state:after};
    return {ok:true,state:after};
  }
  async function apply({confirmed=false}={}){
    if(confirmed!==true)return {ok:false,code:"LOCAL_RECONCILIATION_CONFIRMATION_REQUIRED",state:refresh()};
    if(!online())return {ok:false,code:"LOCAL_RECONCILIATION_OFFLINE_APPLY_DENIED",state:refresh()};
    const api=await ensureConnected();const before=refresh();
    if(!before||before.phase!=="PREVIEW_READY"||before.applyAllowed!==true)return {ok:false,code:"LOCAL_RECONCILIATION_APPLY_BLOCKED",state:before};
    await api.applyLocalReconciliation(before.binding);
    const after=refresh();
    if(!after||after.phase!=="APPLIED")return {ok:false,code:"LOCAL_RECONCILIATION_APPLY_FAILED",state:after};
    return {ok:true,state:after};
  }
  function install(){
    if(installed)return true;installed=true;
    const c=connected();if(c&&typeof c.subscribe==="function")unsubscribe=c.subscribe(refresh);
    root.addEventListener?.("online",refresh);root.addEventListener?.("offline",refresh);
    for(const event of ["career-mode-shared-history-convergence-state-change","career-mode-shared-season-cursor-change","career-mode-showdown-state-change"])root.addEventListener?.(event,refresh);
    if(typeof root.setInterval==="function")timer=root.setInterval(refresh,POLL_MS);
    refresh();return true;
  }
  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-local-reconciliation",productionEnabled:true,runtimeRevision:"1.9.1-r16",pollIntervalMs:POLL_MS,install,refresh,preview,apply,getState:()=>state,isActive:sharedActive,canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true});
});
'''

CONTRACT = r'''const assert=require("node:assert/strict");
const protocol=require("../../js/sharedLocalReconciliation.js");
const rivalryId=`pair_${"a".repeat(64)}`;
const saveId=`save_${"b".repeat(24)}`;
const profileId=`profile_${"c".repeat(24)}`;
const hash=`sha256:${"d".repeat(64)}`;
const history={authoritative:true,phase:"HISTORY_CONVERGED",rivalryId};
const connected={connected:true,attached:true,rivalryId,binding:{saveId,profileId,managerRole:"playerOne"},observedEnvelope:{revision:7,contentHash:hash,lifecycleState:"live"},status:"attached",reconciliationPreviewReady:false};
let state=protocol.project({sharedActive:true,history,connected,online:true});
assert.equal(state.phase,"REMOTE_OBSERVED");assert.equal(state.previewAllowed,true);assert.equal(state.applyAllowed,false);assert.equal(state.canonicalStorageMutation,false);assert.equal(state.providerWriteRequired,false);assert.equal(state.automaticLocalApply,false);assert.equal(state.candidateCOnly,true);
state=protocol.project({sharedActive:true,history,connected,online:false});assert.equal(state.phase,"OFFLINE_FALLBACK");assert.equal(state.previewAllowed,true);assert.equal(state.applyAllowed,false);assert.equal(state.reason,"offline-preview-only");
const preview={...connected,status:"reconciliation-preview-ready",reconciliationPreviewReady:true,previewRevision:7,previewContentHash:hash,previewSaveId:saveId};
state=protocol.project({sharedActive:true,history,connected:preview,online:true});assert.equal(state.phase,"PREVIEW_READY");assert.equal(state.applyAllowed,true);
state=protocol.project({sharedActive:true,history,connected:preview,online:false});assert.equal(state.phase,"OFFLINE_FALLBACK");assert.equal(state.applyAllowed,false);assert.equal(state.remoteRevision,7);
const applied={...preview,status:"reconciliation-applied",reconciliationPreviewReady:false,localCommitRevision:7,localCommitContentHash:hash,localCommitSaveId:saveId};
state=protocol.project({sharedActive:true,history,connected:applied,online:true});assert.equal(state.phase,"APPLIED");assert.equal(state.applyAllowed,false);
assert.equal(protocol.project({sharedActive:true,history:null,connected,online:true}).phase,"BLOCKED");
assert.equal(protocol.project({sharedActive:false,history,connected,online:true}).phase,"INACTIVE");
assert.equal(protocol.project({sharedActive:true,history,connected:{...connected,rivalryId:`pair_${"e".repeat(64)}`},online:true}).phase,"BLOCKED");
process.stdout.write("PASS Shared Local Reconciliation deterministic phases, offline fallback and Candidate C-only authority\n");
'''

PRODUCTION_CONTRACT = r'''const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const protocol=read("js/sharedLocalReconciliation.js");
const production=read("js/productionSharedLocalReconciliation.js");
const connected=read("js/sparkConnectedRivalry.js");
const restore=read("js/restore.js");
const shell=read("service-worker.js");
const ssjr=read("js/ssjr.js");
assert.match(protocol,/automaticLocalApply:false/);assert.match(protocol,/candidateCOnly:true/);assert.match(protocol,/OFFLINE_FALLBACK/);
assert.match(production,/previewLocalReconciliation/);assert.match(production,/applyLocalReconciliation/);assert.match(production,/confirmed!==true/);assert.match(production,/LOCAL_RECONCILIATION_OFFLINE_APPLY_DENIED/);assert.match(production,/canonicalStorageMutation:false/);assert.doesNotMatch(production,/localStorage\.setItem|sessionStorage\.setItem|runTransaction\(|setDoc\(|updateDoc\(/);
assert.match(connected,/previewLocalReconciliation:crHandleReconciliationPreview/);assert.match(connected,/applyLocalReconciliation:crHandleReconciliationApply/);assert.match(connected,/prepareCareerModeRemoteReconciliationIntent/);assert.match(connected,/applyCareerModeRemoteReconciliation/);
for(const token of ["createCareerModeBackupEnvelope","verifyCareerModeBackupEnvelopeChecksum","downloadCareerModeBackupEnvelope","applyCareerModeRawStorageTransaction","remote-stale","stale-state"])assert.match(restore,new RegExp(token));
for(const asset of ["js/sharedLocalReconciliation.js","js/productionSharedLocalReconciliation.js"])assert.ok(shell.includes(`\"${asset}\"`),`${asset} must be service-worker shell-owned`);
assert.match(ssjr,/ssjr-local-reconciliation-protocol/);assert.match(ssjr,/ssjr-production-local-reconciliation/);
process.stdout.write("PASS r16 production Local Reconciliation delegates to existing Candidate B/C authority with shell/reload safety and no new provider/storage writer\n");
'''

BROWSER = r'''const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const rivalryId=`pair_${"a".repeat(64)}`,saveId=`save_${"b".repeat(24)}`,profileId=`profile_${"c".repeat(24)}`,hash=`sha256:${"d".repeat(64)}`;
const listeners=new Map();let previewCalls=0,applyCalls=0;
let connectedState={connected:true,attached:true,rivalryId,binding:{saveId,profileId,managerRole:"playerOne"},observedEnvelope:{revision:4,contentHash:hash,lifecycleState:"live"},status:"attached",reconciliationPreviewReady:false,previewRevision:null,previewContentHash:null,previewSaveId:null,localCommitRevision:null,localCommitContentHash:null,localCommitSaveId:null};
const localWrites=[];
const context={console,navigator:{onLine:true},currentShowdown:{sharedJourney:{mode:"shared",rivalryId}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},dispatchEvent(){},addEventListener(type,fn){listeners.set(type,fn);},setInterval(){return 1;},clearInterval(){},localStorage:{setItem(...args){localWrites.push(args);}},CareerModeProductionSharedHistoryConvergence:{getState:()=>({authoritative:true,phase:"HISTORY_CONVERGED",rivalryId})},CareerModeSparkConnectedRivalry:{getState:()=>connectedState,subscribe(){return ()=>{};},async initialize(){return true;},async previewLocalReconciliation(binding){previewCalls++;assert.deepEqual(JSON.parse(JSON.stringify(binding)),{saveId,profileId,managerRole:"playerOne"});connectedState={...connectedState,status:"reconciliation-preview-ready",reconciliationPreviewReady:true,previewRevision:4,previewContentHash:hash,previewSaveId:saveId};},async applyLocalReconciliation(binding){applyCalls++;assert.equal(binding.saveId,saveId);connectedState={...connectedState,status:"reconciliation-applied",reconciliationPreviewReady:false,localCommitRevision:4,localCommitContentHash:hash,localCommitSaveId:saveId};}}};
context.window=context;context.globalThis=context;vm.createContext(context);
vm.runInContext(fs.readFileSync("js/sharedLocalReconciliation.js","utf8"),context,{filename:"sharedLocalReconciliation.js"});
vm.runInContext(fs.readFileSync("js/productionSharedLocalReconciliation.js","utf8"),context,{filename:"productionSharedLocalReconciliation.js"});
(async()=>{const api=context.CareerModeProductionSharedLocalReconciliation;assert.ok(api);api.install();assert.equal(api.getState().phase,"REMOTE_OBSERVED");
context.navigator.onLine=false;api.refresh();assert.equal(api.getState().phase,"OFFLINE_FALLBACK");let result=await api.preview();assert.equal(result.ok,true);assert.equal(previewCalls,1);assert.equal(api.getState().phase,"OFFLINE_FALLBACK");result=await api.apply({confirmed:true});assert.equal(result.ok,false);assert.equal(result.code,"LOCAL_RECONCILIATION_OFFLINE_APPLY_DENIED");assert.equal(applyCalls,0);
context.navigator.onLine=true;api.refresh();assert.equal(api.getState().phase,"PREVIEW_READY");result=await api.apply();assert.equal(result.code,"LOCAL_RECONCILIATION_CONFIRMATION_REQUIRED");assert.equal(applyCalls,0);result=await api.apply({confirmed:true});assert.equal(result.ok,true);assert.equal(applyCalls,1);assert.equal(api.getState().phase,"APPLIED");assert.deepEqual(localWrites,[],"Shared Journey adapter must never write canonical storage directly.");process.stdout.write("PASS r16 Local Reconciliation controlled-browser adapter: offline preview, explicit confirmation, Candidate C delegation and zero direct local writes\n");})().catch(e=>{console.error(e);process.exit(1);});
'''

CANDIDATE = '''# r16 Local Reconciliation candidate\n\nStarting authority: main `928f8c9e945f57ee1044debcc81ed4400712f605`; MDP 86.50/100; SSJR 0/100.\n\nFrozen capability: `local-reconciliation`, weight 5. This candidate integrates Shared Journey state with the existing Connected Rivalry Candidate B/C reconciliation authority. It adds no new Firestore collection, list authority, provider mutation path or direct canonical-storage writer. Read-only preview may use the already-observed exact remote envelope while offline; Apply is explicitly denied offline and requires user confirmation online. Candidate C remains the sole destructive local Apply authority, including backup, exact remote freshness guards, stale-local guard, guarded raw transaction and rollback.\n\nCandidate lifecycle credit remains unawarded until exact-head POS20 proves the final candidate. Product-integration credit remains unawarded until coherent r16 publication, final publication-head POS20, expected-head merge, Pages deployment, exact-main POS20 and two-pass Release Integration Burn-In. MDP stays 86.50 until separate post-integration accounting.\n'''

Path("js/sharedLocalReconciliation.js").write_text(PROTOCOL)
Path("js/productionSharedLocalReconciliation.js").write_text(PRODUCTION)
Path("tests/contracts/shared-local-reconciliation-contracts.cjs").write_text(CONTRACT)
Path("tests/contracts/shared-local-reconciliation-production-contracts.cjs").write_text(PRODUCTION_CONTRACT)
Path("tests/browser/shared-local-reconciliation-audit.cjs").write_text(BROWSER)
Path("R16_LOCAL_RECONCILIATION_CANDIDATE.md").write_text(CANDIDATE)

# Expose only the already-existing reconciliation handlers; they still own Candidate B/C authority.
p=Path("js/sparkConnectedRivalry.js");s=p.read_text();anchor="    publishSharedState:crPublishSharedState,\n    verifyLiveSharedStateIntegrity:crAssertLiveSharedStateIntegrity,"
if s.count(anchor)!=1: raise SystemExit("sparkConnectedRivalry API anchor mismatch")
s=s.replace(anchor,"    publishSharedState:crPublishSharedState,\n    previewLocalReconciliation:crHandleReconciliationPreview,\n    applyLocalReconciliation:crHandleReconciliationApply,\n    verifyLiveSharedStateIntegrity:crAssertLiveSharedStateIntegrity,",1);p.write_text(s)

# Bootstrap r16 after conflicts/history without changing earlier ordering.
p=Path("js/ssjr.js");s=p.read_text();anchor='''    const journeyConflicts=(async()=>{\n      await journeyReconnect;\n      await prepare([\n        ["ssjr-journey-conflicts-protocol","js/sharedJourneyConflicts.js","CareerModeSharedJourneyConflicts"]\n      ]);\n      return install("ssjr-production-journey-conflicts","js/productionSharedJourneyConflicts.js","CareerModeProductionSharedJourneyConflicts");\n    })();\n'''
if s.count(anchor)!=1: raise SystemExit("ssjr journey conflicts anchor mismatch")
addition=anchor+'''    const localReconciliation=(async()=>{\n      await journeyConflicts;\n      await historyConvergence;\n      await prepare([\n        ["ssjr-local-reconciliation-protocol","js/sharedLocalReconciliation.js","CareerModeSharedLocalReconciliation"]\n      ]);\n      return install("ssjr-production-local-reconciliation","js/productionSharedLocalReconciliation.js","CareerModeProductionSharedLocalReconciliation");\n    })();\n'''
s=s.replace(anchor,addition,1)
anchor2='''      journeyReconnect,\n      journeyConflicts,\n'''
if s.count(anchor2)!=1: raise SystemExit("ssjr promise list anchor mismatch")
s=s.replace(anchor2,'''      journeyReconnect,\n      journeyConflicts,\n      localReconciliation,\n''',1);p.write_text(s)

# Cache candidate runtime assets now; release publication will advance shell revision r15 -> r16.
p=Path("service-worker.js");s=p.read_text();anchor='''    "js/sharedJourneyConflicts.js",\n    "js/productionSharedJourneyConflicts.js",\n'''
if s.count(anchor)!=1: raise SystemExit("service worker r15 anchor mismatch")
s=s.replace(anchor,anchor+'''    "js/sharedLocalReconciliation.js",\n    "js/productionSharedLocalReconciliation.js",\n''',1);p.write_text(s)

# Register scripts without changing the package version.
p=Path("package.json");pkg=json.loads(p.read_text());scripts=pkg["scripts"]
scripts["test:ssjr"] += " && node tests/contracts/shared-local-reconciliation-contracts.cjs && node tests/contracts/shared-local-reconciliation-production-contracts.cjs"
scripts["test:ssjr:browser"] += " && node tests/browser/shared-local-reconciliation-audit.cjs"
scripts["test:browser"] += " && node tests/browser/shared-local-reconciliation-audit.cjs"
scripts["test:ssjr:local-reconciliation"]="node tests/contracts/shared-local-reconciliation-contracts.cjs && node tests/contracts/shared-local-reconciliation-production-contracts.cjs && node tests/browser/shared-local-reconciliation-audit.cjs"
p.write_text(json.dumps(pkg,indent=2)+"\n")

# POS20 product selection: deterministic and production contracts are blocking for all r16 impact surfaces.
p=Path("POS20_SUPPLEMENTAL_PRODUCT_TESTS.json");obj=json.loads(p.read_text())
paths={x["path"] for x in obj["tests"]}
entries=[
 {"path":"tests/contracts/shared-local-reconciliation-contracts.cjs","patterns":["^js/sharedLocalReconciliation\\.js$","^tests/contracts/shared-local-reconciliation-contracts\\.cjs$","^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"]},
 {"path":"tests/contracts/shared-local-reconciliation-production-contracts.cjs","patterns":["^js/sharedLocalReconciliation\\.js$","^js/productionSharedLocalReconciliation\\.js$","^js/sparkConnectedRivalry\\.js$","^js/restore\\.js$","^js/ssjr\\.js$","^service-worker\\.js$","^tests/contracts/stage4-remote-local-reconciliation-contracts\\.cjs$","^tests/contracts/shared-local-reconciliation-contracts\\.cjs$","^tests/contracts/shared-local-reconciliation-production-contracts\\.cjs$","^tests/browser/shared-local-reconciliation-audit\\.cjs$","^package\\.json$","^POS20_SUPPLEMENTAL_PRODUCT_TESTS\\.json$"]}
]
for entry in entries:
    if entry["path"] in paths: raise SystemExit("r16 POS20 entry already exists")
    obj["tests"].append(entry)
p.write_text(json.dumps(obj,indent=2)+"\n")
