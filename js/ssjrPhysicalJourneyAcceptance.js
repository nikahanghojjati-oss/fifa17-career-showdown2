(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSSJRPhysicalJourneyAcceptance=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PARAM="ssjr-physical";
  const PANEL_ID="ssjrPhysicalJourneyAcceptance";
  const SAFE_STORE_KEY="careerModeShowdown.ssjrPhysicalJourney.safe.v1";
  const POLL_MS=1000;
  const MAX_MILESTONES=96;
  const CORE_STAGES=Object.freeze([
    "remote-active","setup-confirmed","career-start-ready","transfer-completed","results-ready",
    "season-acknowledged","scoring-reconciled","history-converged",
    "local-reconciliation-safe","final-season-reconciled","terminal-closed"
  ]);
  const enabled=!!(root.location&&new URLSearchParams(root.location.search).get("ssjr-acceptance")==="1"&&new URLSearchParams(root.location.search).get(PARAM)==="1");
  let installed=false,pollTimer=null,queue=Promise.resolve(),conflictProbePromise=null;

  function now(){return new Date().toISOString();}
  function revision(){const meta=root.document&&root.document.querySelector('meta[name="app-asset-revision"]');return meta&&meta.content?meta.content.trim():"unknown";}
  function appVersion(){return typeof root.APP_VERSION==="string"?root.APP_VERSION:(root.document&&root.document.querySelector("footer")?.textContent.match(/v(\d+\.\d+\.\d+)/)?.[1]||"unknown");}
  function plain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));return value;}
  async function sha256(value){if(!root.crypto?.subtle||typeof TextEncoder==="undefined")throw new Error("Secure hashing is unavailable.");const digest=await root.crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(value)));return `sha256:${Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("")}`;}
  function randomHex(bytes=16){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")throw new Error("Secure randomness is unavailable.");const data=new Uint8Array(bytes);root.crypto.getRandomValues(data);return Array.from(data,b=>b.toString(16).padStart(2,"0")).join("");}
  function deviceFacts(){const nav=root.navigator||{},screen=root.screen||{};return {userAgent:String(nav.userAgent||""),platform:String(nav.platform||""),maxTouchPoints:Number(nav.maxTouchPoints||0),screenWidth:Number(screen.width||0),screenHeight:Number(screen.height||0)};}
  function template(){return {schemaVersion:1,runtimeRevision:revision(),appVersion:appVersion(),startedAt:now(),startupCount:0,deviceLabel:"",networkLabel:"",managerRole:null,remoteRole:null,accountFingerprint:null,deviceFingerprint:null,rivalryFingerprint:null,sessionFingerprints:[],canonicalStorageBeforeHash:null,canonicalStorageAfterHash:null,canonicalStorageViolation:false,candidateCApplied:false,offlineObserved:false,onlineRecovered:false,reloadResumed:false,terminalReloadVerified:false,conflictGuardProven:false,terminalClosedStartupCount:null,milestones:[],sequence:0};}
  function loadSafe(){try{const current=template(),raw=root.sessionStorage?.getItem(SAFE_STORE_KEY);if(!raw)return current;const parsed=JSON.parse(raw);if(!plain(parsed)||parsed.schemaVersion!==1||parsed.runtimeRevision!==current.runtimeRevision){root.sessionStorage?.removeItem(SAFE_STORE_KEY);return current;}return {...current,...parsed,milestones:Array.isArray(parsed.milestones)?parsed.milestones.slice(-MAX_MILESTONES):[],sessionFingerprints:Array.isArray(parsed.sessionFingerprints)?parsed.sessionFingerprints.slice(0,12):[]};}catch(_error){return template();}}
  let safe=loadSafe();
  function persist(){try{root.sessionStorage?.setItem(SAFE_STORE_KEY,JSON.stringify(safe));}catch(_error){}render();return safe;}
  function canonicalSnapshot(){if(typeof root.captureCareerModeRawBackupInputs!=="function")return null;const raw=root.captureCareerModeRawBackupInputs();return {saveLibrary:raw&&Object.hasOwn(raw,"saveLibrary")?raw.saveLibrary:null,legacyShowdowns:raw&&Object.hasOwn(raw,"legacyShowdowns")?raw.legacyShowdowns:null,preferences:raw&&Object.hasOwn(raw,"preferences")?raw.preferences:null};}
  async function canonicalHash(){const snapshot=canonicalSnapshot();return snapshot===null?null:sha256(JSON.stringify(stable(snapshot)));}
  async function ensureCanonicalBaseline(){if(safe.canonicalStorageBeforeHash)return safe.canonicalStorageBeforeHash;const hash=await canonicalHash();if(hash){safe.canonicalStorageBeforeHash=hash;persist();}return safe.canonicalStorageBeforeHash;}
  function apiState(name){try{const api=root[name];return api&&typeof api.getState==="function"?api.getState():null;}catch(_error){return null;}}
  function nestedPhase(value){if(!value||typeof value!=="object")return null;for(const candidate of [value.phase,value.state?.phase,value.projection?.phase,value.setup?.phase])if(typeof candidate==="string"&&candidate)return candidate;return null;}
  function nestedRevision(value){for(const candidate of [value?.revision,value?.state?.revision,value?.projection?.revision,value?.setup?.revision])if(Number.isInteger(candidate))return candidate;return null;}
  function nestedSeason(value){for(const candidate of [value?.seasonNumber,value?.state?.seasonNumber,value?.projection?.acceptedSeasons,value?.throughSeason])if(Number.isInteger(candidate))return candidate;return null;}
  function milestone(stage,phase=null,extra={}){if(!enabled)return null;const exists=safe.milestones.some(item=>item.stage===stage&&(!phase||item.phase===phase));if(exists)return null;const item={sequence:++safe.sequence,at:now(),stage,phase:phase||null,online:root.navigator?root.navigator.onLine!==false:true,...extra};safe.milestones.push(item);if(safe.milestones.length>MAX_MILESTONES)safe.milestones.splice(0,safe.milestones.length-MAX_MILESTONES);persist();return item;}
  function setLabels(device,network){safe.deviceLabel=String(device||"").trim().slice(0,80);safe.networkLabel=String(network||"").trim().slice(0,80);persist();return {deviceLabel:safe.deviceLabel,networkLabel:safe.networkLabel};}
  async function bindIdentity(){
    const setup=apiState("CareerModeProductionSharedShowdownSetup"),remote=apiState("CareerModeSparkRemoteJoining"),connected=apiState("CareerModeSparkConnectedRivalry"),account=apiState("CareerModeSparkConnectedAccount"),device=apiState("CareerModeSparkPrivatePairing");
    const managerRole=setup?.managerRole||connected?.binding?.managerRole||null,remoteRole=setup?.remoteRole||remote?.role||null;
    const accountId=setup?.accountId||remote?.accountId||account?.accountId||connected?.accountId||null;
    const deviceId=setup?.deviceId||remote?.deviceId||device?.deviceId||connected?.deviceId||null;
    const rivalryId=setup?.rivalryId||remote?.rivalryId||connected?.rivalryId||null;
    const sessionId=setup?.sessionId||remote?.sessionId||null;
    if(managerRole&&managerRole!==safe.managerRole){if(safe.managerRole)throw new Error("Manager role changed during physical acceptance.");safe.managerRole=managerRole;}
    if(remoteRole&&remoteRole!==safe.remoteRole){if(safe.remoteRole)throw new Error("Remote role changed during physical acceptance.");safe.remoteRole=remoteRole;}
    for(const [field,raw] of [["accountFingerprint",accountId],["deviceFingerprint",deviceId],["rivalryFingerprint",rivalryId]])if(raw){const fingerprint=await sha256(raw);if(safe[field]&&safe[field]!==fingerprint)throw new Error(`${field} changed during physical acceptance.`);safe[field]=fingerprint;}
    if(sessionId){const fingerprint=await sha256(sessionId);if(!safe.sessionFingerprints.includes(fingerprint)){safe.sessionFingerprints.push(fingerprint);safe.sessionFingerprints=safe.sessionFingerprints.slice(-12);}}
    persist();return {setup,remote,connected,account,device,managerRole,remoteRole,accountId,deviceId,rivalryId,sessionId};
  }
  async function safeConflictProbe(identity){
    if(safe.conflictGuardProven||conflictProbePromise||!identity?.accountId||!identity?.deviceId||!identity?.rivalryId||!identity?.sessionId||!identity?.managerRole)return safe.conflictGuardProven;
    const remote=identity.remote;if(!remote||remote.sessionState!=="active"||remote.pendingAction!=null)return false;
    conflictProbePromise=(async()=>{
      if(!root.CareerModeSharedJourneyConflicts){if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript("ssjr-journey-conflicts-protocol","js/sharedJourneyConflicts.js",()=>root.CareerModeSharedJourneyConflicts);}
      const factory=root.CareerModeSharedJourneyConflicts;if(!factory||typeof factory.createGuard!=="function")return false;
      const guard=factory.createGuard({cryptoImpl:root.crypto,receiptTtlMs:120000}),operationId=`setup_op_${randomHex(16)}`,authority={accountId:identity.accountId,deviceId:identity.deviceId,rivalryId:identity.rivalryId,sessionId:identity.sessionId,managerRole:identity.managerRole};
      const base={surface:"shared-setup",action:"open",operationId,authority,intent:{physicalAcceptanceProbe:true},nowEpochMs:Date.now()};
      await guard.execute({...base,baseRevision:0},async()=>({ok:false,code:"SETUP_STALE_BASE_REVISION"}));
      const stale=guard.getLastReceipt();if(stale?.classification!=="STALE")throw new Error("Physical acceptance conflict guard did not classify stale input.");
      await guard.execute({...base,baseRevision:1,nowEpochMs:Date.now()+1},async()=>({ok:true}));
      const recovered=guard.getLastReceipt();if(recovered?.classification!=="ACCEPTED"||recovered.retryCount!==1)throw new Error("Physical acceptance conflict guard did not perform one bounded stale retry.");
      let altered=false;try{await guard.execute({...base,baseRevision:1,intent:{physicalAcceptanceProbe:"altered"},nowEpochMs:Date.now()+2},async()=>({ok:true}));}catch(_error){altered=guard.getLastReceipt()?.classification==="REPLAY_ALTERED";}
      if(!altered)throw new Error("Physical acceptance conflict guard did not reject altered replay pre-provider.");
      safe.conflictGuardProven=true;milestone("conflict-guard-proven","STALE_RETRY_AND_REPLAY_DENIAL",{providerWrite:false});persist();return true;
    })().catch(error=>{root.console?.warn?.("[Career Mode Showdown] Physical conflict guard probe unavailable.",error);return false;}).finally(()=>{conflictProbePromise=null;});
    return conflictProbePromise;
  }
  function observeMilestones(identity){
    const remote=identity.remote,setup=identity.setup,career=apiState("CareerModeProductionSharedCareerStart"),transfer=apiState("CareerModeProductionSharedTransferChallenge"),results=apiState("CareerModeProductionSharedSeasonResults"),commit=apiState("CareerModeProductionSharedSeasonCommit"),scoring=apiState("CareerModeProductionSharedCanonicalScoring"),history=apiState("CareerModeProductionSharedHistoryConvergence"),reconnect=apiState("CareerModeProductionSharedJourneyReconnect"),local=apiState("CareerModeProductionSharedLocalReconciliation"),finalState=apiState("CareerModeProductionSharedFinalReconciliation"),terminal=apiState("CareerModeProductionSharedTerminalClose");
    if(remote?.sessionState==="active"&&remote?.pendingAction==null)milestone("remote-active","ACTIVE",{revision:Number.isInteger(remote.revision)?remote.revision:null});
    if(setup?.setup?.phase==="SHOWDOWN_CONFIRMED"&&setup.setup.revision===6)milestone("setup-confirmed","SHOWDOWN_CONFIRMED",{revision:6,totalSeasons:Number(setup.setup.totalSeasons)||null});
    if(nestedPhase(career)==="CAREER_START_READY")milestone("career-start-ready","CAREER_START_READY",{revision:nestedRevision(career)});
    if(nestedPhase(transfer)==="COMPLETED")milestone("transfer-completed","COMPLETED",{revision:nestedRevision(transfer),seasonNumber:nestedSeason(transfer)});
    if(nestedPhase(results)==="RESULTS_READY")milestone("results-ready","RESULTS_READY",{revision:nestedRevision(results),seasonNumber:nestedSeason(results)});
    if(nestedPhase(commit)==="ACKNOWLEDGED")milestone("season-acknowledged","ACKNOWLEDGED",{revision:nestedRevision(commit),seasonNumber:nestedSeason(commit)});
    if(nestedPhase(scoring)==="SCORING_RECONCILED")milestone("scoring-reconciled","SCORING_RECONCILED",{revision:nestedRevision(scoring),seasonNumber:nestedSeason(scoring)});
    if(nestedPhase(history)==="HISTORY_CONVERGED")milestone("history-converged","HISTORY_CONVERGED",{revision:nestedRevision(history),seasonNumber:nestedSeason(history)});
    if(reconnect?.phase==="ACTIVE_RECOVERED"||reconnect?.phase==="TERMINAL_RECOVERED"){if(safe.offlineObserved){safe.onlineRecovered=true;milestone("reconnect-recovered",reconnect.phase,{seasonNumber:Number.isInteger(reconnect.activeSeason)?reconnect.activeSeason:null});persist();}}
    const terminalSeen=safe.milestones.some(item=>item.stage==="terminal-closed"),recoveredSeen=safe.milestones.some(item=>item.stage==="reconnect-recovered");
    if(!terminalSeen&&recoveredSeen&&safe.startupCount>1&&safe.rivalryFingerprint&&!safe.reloadResumed){safe.reloadResumed=true;milestone("reload-resumed","SAME_SANITIZED_AUTHORITY");persist();}
    if(local&&["REMOTE_OBSERVED","PREVIEW_READY","APPLIED"].includes(local.phase)){if(local.phase==="APPLIED")safe.candidateCApplied=true;milestone("local-reconciliation-safe",local.phase,{providerWrite:false});persist();}
    if(finalState?.phase==="FINAL_SEASON_RECONCILED"&&finalState.finalSeasonReconciled===true)milestone("final-season-reconciled","FINAL_SEASON_RECONCILED",{seasonNumber:Number(finalState.completedSeason)||null});
    if(terminal?.phase==="CLOSED"&&terminal.terminal===true){
      if(safe.terminalClosedStartupCount===null)safe.terminalClosedStartupCount=safe.startupCount;
      milestone("terminal-closed","CLOSED",{revision:Number.isInteger(terminal.rivalryRevision)?terminal.rivalryRevision:null});
      if(safe.startupCount>safe.terminalClosedStartupCount){safe.terminalReloadVerified=true;milestone("terminal-reload-verified","CLOSED_AFTER_RELOAD");}
      persist();
    }
  }
  async function observe(){if(!enabled)return false;return queue=queue.then(async()=>{await ensureCanonicalBaseline();const identity=await bindIdentity();observeMilestones(identity);await safeConflictProbe(identity);render();return true;}).catch(error=>{root.console?.warn?.("[Career Mode Showdown] Physical Journey recorder observation failed.",error);render(String(error?.message||error));return false;});}
  function onOffline(){if(!enabled)return;safe.offlineObserved=true;milestone("network-offline","OFFLINE");persist();}
  function onOnline(){if(!enabled)return;milestone("network-online","ONLINE");persist();void observe();}
  function completed(){const stages=new Set(safe.milestones.map(item=>item.stage));return CORE_STAGES.every(stage=>stages.has(stage))&&stages.has("conflict-guard-proven")&&safe.offlineObserved&&safe.onlineRecovered&&safe.reloadResumed&&safe.terminalReloadVerified&&safe.conflictGuardProven&&safe.candidateCApplied===false&&safe.canonicalStorageViolation!==true;}
  async function evidence(){await queue;await observe();safe.canonicalStorageAfterHash=await canonicalHash();safe.canonicalStorageViolation=Boolean(safe.canonicalStorageBeforeHash&&safe.canonicalStorageAfterHash&&safe.canonicalStorageBeforeHash!==safe.canonicalStorageAfterHash&&!safe.candidateCApplied);persist();return Object.freeze({schema:"career-mode-showdown.physical-journey-acceptance.v1",generatedAt:now(),appVersion:appVersion(),runtimeRevision:revision(),acceptanceMode:true,physicalJourneyMode:true,sanitizedSessionStorageOnly:true,recorderNetworkRequests:false,rawAuthorityIncluded:false,canonicalRawIncluded:false,device:deviceFacts(),deviceLabel:safe.deviceLabel||null,networkLabel:safe.networkLabel||null,managerRole:safe.managerRole,remoteRole:safe.remoteRole,accountFingerprint:safe.accountFingerprint,deviceFingerprint:safe.deviceFingerprint,rivalryFingerprint:safe.rivalryFingerprint,sessionFingerprints:[...safe.sessionFingerprints],canonicalStorageBeforeHash:safe.canonicalStorageBeforeHash,canonicalStorageAfterHash:safe.canonicalStorageAfterHash,canonicalStorageViolation:safe.canonicalStorageViolation,candidateCApplied:safe.candidateCApplied,offlineObserved:safe.offlineObserved,onlineRecovered:safe.onlineRecovered,reloadResumed:safe.reloadResumed,terminalReloadVerified:safe.terminalReloadVerified,conflictGuardProven:safe.conflictGuardProven,startupCount:safe.startupCount,milestones:safe.milestones.map(item=>({...item})),completed:completed()});}
  async function copyEvidence(){const text=JSON.stringify(await evidence(),null,2);if(root.navigator?.clipboard?.writeText){await root.navigator.clipboard.writeText(text);return true;}return false;}
  async function downloadEvidence(){if(!root.document||typeof Blob==="undefined"||!root.URL?.createObjectURL)return false;const text=JSON.stringify(await evidence(),null,2),blob=new Blob([text],{type:"application/json"}),url=root.URL.createObjectURL(blob),link=root.document.createElement("a");link.href=url;link.download=`physical-journey-${safe.managerRole||"manager"}-${Date.now()}.json`;link.rel="noopener";root.document.body.appendChild(link);link.click();link.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),1000);return true;}
  function reset(){safe=template();safe.startupCount=1;try{root.sessionStorage?.removeItem(SAFE_STORE_KEY);}catch(_error){}persist();void observe();return true;}
  function create(tag,className,text){const node=root.document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function rows(){const stages=new Set(safe.milestones.map(item=>item.stage));return [
    ["ACTIVE",stages.has("remote-active")],["SETUP",stages.has("setup-confirmed")],["CAREER",stages.has("career-start-ready")],["TRANSFER",stages.has("transfer-completed")],["RESULTS",stages.has("results-ready")],["COMMIT",stages.has("season-acknowledged")],["SCORING",stages.has("scoring-reconciled")],["HISTORY",stages.has("history-converged")],["CONFLICT",stages.has("conflict-guard-proven")],["OFFLINE RECOVERY",safe.offlineObserved&&safe.onlineRecovered],["RELOAD",safe.reloadResumed],["LOCAL RECON",stages.has("local-reconciliation-safe")],["FINAL",stages.has("final-season-reconciled")],["CLOSED",stages.has("terminal-closed")],["CLOSED AFTER RELOAD",safe.terminalReloadVerified]
  ];}
  function ensurePanel(){
    if(!enabled||!root.document)return null;let panel=root.document.getElementById(PANEL_ID);if(panel)return panel;
    panel=create("section","ssjrPhysicalJourneyAcceptance");panel.id=PANEL_ID;panel.setAttribute("aria-label","Physical Journey acceptance recorder");panel.style.cssText="margin:12px 0 0;padding:12px;border:1px solid #a88f52;border-radius:8px;background:#15120b;color:#fff;font:13px/1.35 system-ui";
    panel.append(create("strong","","MDP PHYSICAL JOURNEY"),create("p","","Acceptance-only observer. It records sanitized fingerprints and milestones; it does not write provider state or canonical saves."));
    const labels=create("div","ssjrPhysicalLabels"),device=create("input"),network=create("input");device.placeholder="Device label (Chromebook / iPhone)";network.placeholder="Network label (Home Wi-Fi / cellular)";device.value=safe.deviceLabel;network.value=safe.networkLabel;for(const input of [device,network])input.style.cssText="box-sizing:border-box;width:100%;margin:4px 0;padding:8px";labels.append(device,network);panel.append(labels);
    const save=create("button","","SAVE LABELS");save.type="button";save.addEventListener("click",()=>setLabels(device.value,network.value));
    const copy=create("button","","COPY EVIDENCE");copy.type="button";copy.addEventListener("click",async()=>{copy.textContent=await copyEvidence()?"COPIED":"COPY UNAVAILABLE";root.setTimeout(()=>copy.textContent="COPY EVIDENCE",1200);});
    const download=create("button","","DOWNLOAD JSON");download.type="button";download.addEventListener("click",()=>void downloadEvidence());
    const refresh=create("button","","CHECK NOW");refresh.type="button";refresh.addEventListener("click",()=>void observe());
    const clear=create("button","","RESET RECORDER");clear.type="button";clear.addEventListener("click",()=>{if(root.confirm?.("Reset only sanitized Physical Journey evidence for this browser?"))reset();});
    const actions=create("div","ssjrPhysicalActions");actions.style.cssText="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0";for(const button of [save,refresh,copy,download,clear]){button.style.cssText="padding:7px 9px;font-weight:700";actions.append(button);}panel.append(actions);
    panel.append(create("div","ssjrPhysicalStatus"));
    const host=root.document.getElementById("ssjrProductionAcceptanceRecorder")||root.document.body;host.appendChild(panel);return panel;
  }
  function render(error=""){
    const panel=ensurePanel();if(!panel)return false;const status=panel.querySelector(".ssjrPhysicalStatus");if(!status)return false;
    status.replaceChildren();for(const [label,passed] of rows()){const row=create("div","",`${passed?"✓":"○"} ${label}`);row.dataset.passed=String(passed);status.append(row);}const meta=create("p","",`ROLE: ${safe.managerRole||"—"} · STARTUPS: ${safe.startupCount} · RECORDS: ${safe.milestones.length} · ${completed()?"READY TO EXPORT":"IN PROGRESS"}`);status.append(meta);if(error)status.append(create("p","",`RECORDER NOTE: ${error}`));return true;
  }
  function install(){if(!enabled||installed)return enabled;installed=true;safe.startupCount=Number(safe.startupCount||0)+1;persist();root.addEventListener?.("offline",onOffline);root.addEventListener?.("online",onOnline);for(const event of ["career-mode-shared-setup-state-change","career-mode-shared-season-commit-state-change","career-mode-shared-canonical-scoring-state-change","career-mode-shared-history-convergence-state-change","career-mode-shared-multi-season-state-change","career-mode-shared-journey-reconnect-state-change","career-mode-shared-journey-conflict-state-change","career-mode-shared-local-reconciliation-state-change","career-mode-shared-final-reconciliation-state-change","career-mode-shared-terminal-close-state-change","career-mode-connected-account-state-change"])root.addEventListener?.(event,()=>void observe());root.document?.addEventListener?.("visibilitychange",()=>{if(root.document.visibilityState==="visible")void observe();});if(typeof root.setInterval==="function")pollTimer=root.setInterval(()=>void observe(),POLL_MS);ensurePanel();void observe();return true;}
  function destroy(){if(pollTimer!==null&&typeof root.clearInterval==="function")root.clearInterval(pollTimer);pollTimer=null;root.removeEventListener?.("offline",onOffline);root.removeEventListener?.("online",onOnline);root.document?.getElementById(PANEL_ID)?.remove();installed=false;return true;}

  return Object.freeze({contractVersion:1,feature:"mdp-physical-journey-acceptance-recorder",enabled,acceptanceOnly:true,productionObserver:true,runtimeRevision:"1.9.1-r19",pollIntervalMs:POLL_MS,sanitizedSessionStorageOnly:true,rawAuthorityPersistence:false,providerWriteRequired:false,recorderNetworkRequests:false,canonicalStorageMutation:false,candidateCAutomaticApply:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,install,destroy,observe,setLabels,runConflictGuardProbe:async()=>safeConflictProbe(await bindIdentity()),getEvidence:evidence,copyEvidence,downloadEvidence,reset,getState:()=>Object.freeze({enabled,installed,completed:completed(),startupCount:safe.startupCount,managerRole:safe.managerRole,milestones:safe.milestones.length,offlineObserved:safe.offlineObserved,onlineRecovered:safe.onlineRecovered,reloadResumed:safe.reloadResumed,terminalReloadVerified:safe.terminalReloadVerified,conflictGuardProven:safe.conflictGuardProven})});
});