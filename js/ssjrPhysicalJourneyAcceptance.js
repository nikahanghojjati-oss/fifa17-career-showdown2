(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSSJRPhysicalJourneyAcceptance=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r85 (Nik 2026-10-26: "Build ssjr test a lot easier and simpler panel that would be automated"): the SSJR test panel.
  // One link (?ssjr=1), no typing: the device label comes from the browser, the network is one tap, the offline and reload
  // checks happen during the game (season 2 of a longer run) and the panel says what to do next. The Showdown closes itself
  // after the last season (JOB-1038), so the closed Showdown is confirmed after one more reload by a read-only check of the
  // signed-in account's completed Showdown. The recorder never writes to Firebase and keeps only sanitized fingerprints.
  const PANEL_ID="ssjrPhysicalJourneyAcceptance";
  const SAFE_STORE_KEY="careerModeShowdown.ssjrPhysicalJourney.safe.v2";
  const POLL_MS=1000;
  const MAX_MILESTONES=96;
  const CORE_STAGES=Object.freeze([
    "remote-active","setup-confirmed","career-start-ready","transfer-completed","results-ready",
    "season-acknowledged","scoring-reconciled","history-converged","showdown-complete","terminal-closed"
  ]);
  // r51: every season of a 1/3/5/10 plan is recorded, so one longer run proves multi-season progression.
  const SEASON_STAGES=Object.freeze(["transfer-completed","results-ready","season-acknowledged","scoring-reconciled","history-converged"]);
  const PLAN_LENGTHS=Object.freeze([1,3,5,10]);
  const MANAGER_NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const NETWORKS=Object.freeze([["WI-FI","Wi-Fi"],["MOBILE DATA","Mobile data"]]);
  const params=root.location?new URLSearchParams(root.location.search):new URLSearchParams();
  const enabled=params.get("ssjr")==="1"||(params.get("ssjr-acceptance")==="1"&&params.get("ssjr-physical")==="1");
  let lastHint=null,panelPinned=false,installed=false,pollTimer=null,queue=Promise.resolve(),conflictProbePromise=null,previewAsked=false,closedCheck=null,rivalryThisStartup=false;

  function now(){return new Date().toISOString();}
  function revision(){const meta=root.document&&root.document.querySelector('meta[name="app-asset-revision"]');return meta&&meta.content?meta.content.trim():"unknown";}
  function appVersion(){return typeof root.APP_VERSION==="string"?root.APP_VERSION:(root.document&&root.document.querySelector("footer")?.textContent.match(/v(\d+\.\d+\.\d+)/)?.[1]||"unknown");}
  function plain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));return value;}
  async function sha256(value){if(!root.crypto?.subtle||typeof TextEncoder==="undefined")throw new Error("Secure hashing is unavailable.");const digest=await root.crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(value)));return `sha256:${Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("")}`;}
  function randomHex(bytes=16){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")throw new Error("Secure randomness is unavailable.");const data=new Uint8Array(bytes);root.crypto.getRandomValues(data);return Array.from(data,b=>b.toString(16).padStart(2,"0")).join("");}
  function deviceFacts(){const nav=root.navigator||{},screen=root.screen||{};return {userAgent:String(nav.userAgent||""),platform:String(nav.platform||""),maxTouchPoints:Number(nav.maxTouchPoints||0),screenWidth:Number(screen.width||0),screenHeight:Number(screen.height||0)};}
  function deviceKind(facts){const ua=facts.userAgent;if(/iPhone/i.test(ua))return "iPhone";if(/iPad/i.test(ua)||(/Macintosh/i.test(ua)&&facts.maxTouchPoints>1))return "iPad";if(/CrOS/i.test(ua))return "Chromebook";if(/Android/i.test(ua))return "Android";if(/Macintosh/i.test(ua))return "Mac";if(/Windows/i.test(ua))return "Windows";return "Browser";}
  // The device label is never typed: the manager, the kind of device and its screen. The validator separately requires
  // distinct device facts and registered-device fingerprints, so the label only names the device in Claude's statement.
  function autoDeviceLabel(){const facts=deviceFacts(),name=MANAGER_NAMES[safe.managerRole]||"Manager";return `${name} · ${deviceKind(facts)} ${facts.screenWidth}x${facts.screenHeight}`;}
  function template(){return {schemaVersion:2,runtimeRevision:revision(),appVersion:appVersion(),startedAt:now(),startupCount:0,networkLabel:"",managerRole:null,remoteRole:null,accountFingerprint:null,deviceFingerprint:null,rivalryFingerprint:null,sessionFingerprints:[],authorityViolation:false,canonicalStorageProofScope:"local-reconciliation-preview",canonicalStorageBeforeHash:null,canonicalStorageAfterHash:null,canonicalStorageViolation:false,candidateCApplied:false,offlineObserved:false,offlineHoldSeen:false,onlineRecovered:false,reconnectRecoveredStartupCount:null,reloadResumed:false,terminalReloadVerified:false,conflictGuardProven:false,terminalClosedStartupCount:null,milestones:[],sequence:0};}
  function loadSafe(){try{const current=template(),raw=root.sessionStorage?.getItem(SAFE_STORE_KEY);if(!raw)return current;const parsed=JSON.parse(raw);if(!plain(parsed)||parsed.schemaVersion!==2||parsed.runtimeRevision!==current.runtimeRevision){root.sessionStorage?.removeItem(SAFE_STORE_KEY);return current;}return {...current,...parsed,milestones:Array.isArray(parsed.milestones)?parsed.milestones.slice(-MAX_MILESTONES):[],sessionFingerprints:Array.isArray(parsed.sessionFingerprints)?parsed.sessionFingerprints.slice(0,12):[]};}catch(_error){return template();}}
  let safe=loadSafe();
  function persist(){try{root.sessionStorage?.setItem(SAFE_STORE_KEY,JSON.stringify(safe));}catch(_error){}render();return safe;}
  function authorityError(message){safe.authorityViolation=true;persist();throw new Error(message);}
  function canonicalSnapshot(){if(typeof root.captureCareerModeRawBackupInputs!=="function")return null;const raw=root.captureCareerModeRawBackupInputs();return {saveLibrary:raw&&Object.hasOwn(raw,"saveLibrary")?raw.saveLibrary:null,legacyShowdowns:raw&&Object.hasOwn(raw,"legacyShowdowns")?raw.legacyShowdowns:null,preferences:raw&&Object.hasOwn(raw,"preferences")?raw.preferences:null};}
  async function canonicalHash(){const snapshot=canonicalSnapshot();return snapshot===null?null:sha256(JSON.stringify(stable(snapshot)));}
  async function captureLocalReconciliationBaseline(){
    if(!enabled)return false;const hash=await canonicalHash();
    if(!hash){safe.canonicalStorageViolation=true;persist();return false;}
    if(safe.canonicalStorageBeforeHash&&safe.canonicalStorageBeforeHash!==hash){safe.canonicalStorageViolation=true;persist();return false;}
    safe.canonicalStorageBeforeHash=hash;safe.canonicalStorageAfterHash=null;milestone("local-reconciliation-storage-baseline","CAPTURED",{providerWrite:false});persist();return true;
  }
  async function verifyLocalReconciliationPreview(){
    if(!enabled)return false;const hash=await canonicalHash();safe.canonicalStorageAfterHash=hash;
    if(!safe.canonicalStorageBeforeHash||!hash||safe.canonicalStorageBeforeHash!==hash)safe.canonicalStorageViolation=true;
    milestone("local-reconciliation-storage-verified",safe.canonicalStorageViolation?"CHANGED":"UNCHANGED",{providerWrite:false});persist();return safe.canonicalStorageViolation!==true;
  }
  function apiState(name){try{const api=root[name];return api&&typeof api.getState==="function"?api.getState():null;}catch(_error){return null;}}
  function nestedPhase(value){if(!value||typeof value!=="object")return null;for(const candidate of [value.phase,value.state?.phase,value.projection?.phase,value.setup?.phase])if(typeof candidate==="string"&&candidate)return candidate;return null;}
  function nestedRevision(value){for(const candidate of [value?.revision,value?.state?.revision,value?.projection?.revision,value?.setup?.revision])if(Number.isInteger(candidate))return candidate;return null;}
  function nestedSeason(value){for(const candidate of [value?.seasonNumber,value?.state?.seasonNumber,value?.projection?.acceptedSeasons,value?.throughSeason])if(Number.isInteger(candidate))return candidate;return null;}
  function milestone(stage,phase=null,extra={}){if(!enabled)return null;const season=SEASON_STAGES.includes(stage)||stage==="showdown-complete"?(Number.isInteger(extra.seasonNumber)?extra.seasonNumber:null):undefined;const exists=safe.milestones.some(item=>item.stage===stage&&(!phase||item.phase===phase)&&(season===undefined||(item.seasonNumber??null)===season));if(exists)return null;const item={sequence:++safe.sequence,at:now(),stage,phase:phase||null,online:root.navigator?root.navigator.onLine!==false:true,...extra};safe.milestones.push(item);if(safe.milestones.length>MAX_MILESTONES)safe.milestones.splice(0,safe.milestones.length-MAX_MILESTONES);persist();if(stage!=="reconnect-recovered")noteProgress(item);return item;}
  function hasStage(stage){return safe.milestones.some(item=>item.stage===stage);}
  function setNetwork(label){const value=String(label||"").trim().slice(0,80);if(!value)return false;safe.networkLabel=value;persist();return true;}
  async function bindIdentity(){
    const setup=apiState("CareerModeProductionSharedShowdownSetup"),remote=apiState("CareerModeSparkRemoteJoining"),connected=apiState("CareerModeSparkConnectedRivalry"),account=apiState("CareerModeSparkConnectedAccount"),device=apiState("CareerModeSparkPrivatePairing");
    const managerRole=setup?.managerRole||connected?.binding?.managerRole||null,remoteRole=setup?.remoteRole||remote?.role||null;
    const accountId=setup?.accountId||remote?.accountId||account?.accountId||connected?.accountId||null;
    const deviceId=setup?.deviceId||remote?.deviceId||device?.deviceId||connected?.deviceId||null;
    const rivalryId=setup?.rivalryId||remote?.rivalryId||connected?.rivalryId||null;
    const sessionId=setup?.sessionId||remote?.sessionId||null;
    // Once the Showdown is closed it is no longer current, and Home is free to show a new one: authority stops binding there.
    let closed=hasStage("terminal-closed");
    // A closed run that did not pass is not the end of the test: when a new Showdown really starts on this page (its Shared
    // Setup is open again below the confirmed revision, which Home's post-close screen never shows), the record starts again.
    if(closed&&!completed()&&Number.isInteger(setup?.setup?.revision)&&setup.setup.revision>=1&&setup.setup.revision<6){restartRecord();closed=false;}
    // A different Showdown on this page before the recorded one closed is a new try (an earlier one was left unfinished):
    // the record starts again for it, with no reset button. Any other authority change mid-run is flagged.
    if(rivalryId&&!closed&&safe.rivalryFingerprint&&await sha256(rivalryId)!==safe.rivalryFingerprint)restartRecord();
    if(managerRole&&managerRole!==safe.managerRole){if(safe.managerRole){if(!closed)authorityError("Manager role changed during physical acceptance.");}else safe.managerRole=managerRole;}
    if(remoteRole&&remoteRole!==safe.remoteRole&&!closed){if(safe.remoteRole)authorityError("Remote role changed during physical acceptance.");safe.remoteRole=remoteRole;}
    for(const [field,raw] of [["rivalryFingerprint",rivalryId],["accountFingerprint",accountId],["deviceFingerprint",deviceId]])if(raw){const fingerprint=await sha256(raw);if(safe[field]&&safe[field]!==fingerprint){if(hasStage("terminal-closed"))continue;authorityError(`${field} changed during physical acceptance.`);}safe[field]=fingerprint;if(field==="rivalryFingerprint")rivalryThisStartup=true;}
    if(sessionId&&!closed){const fingerprint=await sha256(sessionId);if(!safe.sessionFingerprints.includes(fingerprint)){safe.sessionFingerprints.push(fingerprint);safe.sessionFingerprints=safe.sessionFingerprints.slice(-12);}}
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
  // Local Reconciliation runs its read-only final check on its own, throttled to its poll gap; the Showdown now closes itself
  // within seconds of the last season, so the recorder asks for that same read-only preview once, as soon as the plan completes.
  function askLocalPreview(local){
    if(previewAsked||!local||!["WAITING_REMOTE","REMOTE_OBSERVED"].includes(local.phase))return;
    const api=root.CareerModeProductionSharedLocalReconciliation;if(!api||typeof api.preview!=="function")return;
    previewAsked=true;Promise.resolve().then(()=>api.preview()).catch(()=>{previewAsked=false;});
  }
  function observeMilestones(identity){
    const multi=apiState("CareerModeProductionSharedMultiSeasonProgression");
    const remote=identity.remote,setup=identity.setup,career=apiState("CareerModeProductionSharedCareerStart"),transfer=apiState("CareerModeProductionSharedTransferChallenge"),results=apiState("CareerModeProductionSharedSeasonResults"),commit=apiState("CareerModeProductionSharedSeasonCommit"),scoring=apiState("CareerModeProductionSharedCanonicalScoring"),history=apiState("CareerModeProductionSharedHistoryConvergence"),reconnect=apiState("CareerModeProductionSharedJourneyReconnect"),local=apiState("CareerModeProductionSharedLocalReconciliation"),finalState=apiState("CareerModeProductionSharedFinalReconciliation"),terminal=apiState("CareerModeProductionSharedTerminalClose");
    const closedSeen=hasStage("terminal-closed");
    if(!closedSeen){
      if(remote?.sessionState==="active"&&remote?.pendingAction==null)milestone("remote-active","ACTIVE",{revision:Number.isInteger(remote.revision)?remote.revision:null});
      if(setup?.setup?.phase==="SHOWDOWN_CONFIRMED"&&setup.setup.revision===6)milestone("setup-confirmed","SHOWDOWN_CONFIRMED",{revision:6,totalSeasons:Number(setup.setup.totalSeasons)||null});
    }
    // r86 (real run 2026-10-29): after a restart the other modules can still hold the previous Showdown's states for a moment, so
    // no game stage counts before this Showdown's Shared Setup is confirmed (that is the order every real run follows).
    if(!hasStage("setup-confirmed")){persist();return;}
    if(!closedSeen){
      if(nestedPhase(career)==="CAREER_START_READY")milestone("career-start-ready","CAREER_START_READY",{revision:nestedRevision(career)});
      if(nestedPhase(transfer)==="COMPLETED")milestone("transfer-completed","COMPLETED",{revision:nestedRevision(transfer),seasonNumber:nestedSeason(transfer)});
      if(nestedPhase(results)==="RESULTS_READY")milestone("results-ready","RESULTS_READY",{revision:nestedRevision(results),seasonNumber:nestedSeason(results)});
      if(nestedPhase(commit)==="ACKNOWLEDGED")milestone("season-acknowledged","ACKNOWLEDGED",{revision:nestedRevision(commit),seasonNumber:nestedSeason(commit)});
      if(nestedPhase(scoring)==="SCORING_RECONCILED")milestone("scoring-reconciled","SCORING_RECONCILED",{revision:nestedRevision(scoring),seasonNumber:nestedSeason(scoring)});
      if(nestedPhase(history)==="HISTORY_CONVERGED")milestone("history-converged","HISTORY_CONVERGED",{revision:nestedRevision(history),seasonNumber:nestedSeason(history)});
      const plan=multi?.state;if(multi?.phase==="SHOWDOWN_COMPLETE"&&plan?.terminal===true&&Number.isInteger(plan.acceptedSeasons)&&plan.acceptedSeasons===plan.totalSeasons&&safe.milestones.some(item=>item.stage==="history-converged"&&item.seasonNumber===plan.acceptedSeasons))milestone("showdown-complete","SHOWDOWN_COMPLETE",{seasonNumber:plan.acceptedSeasons,totalSeasons:plan.totalSeasons});
      // r85: the Reconnect module only builds a state for a session that was already interrupted, so an ordinary active game
      // never reports OFFLINE_HOLD. Its recovery still counts when it does; otherwise noteProgress() counts the first shared step
      // the game completes after this page came back online (that step needs both players' data from the server).
      if(reconnect?.phase==="ACTIVE_RECOVERED"||reconnect?.phase==="TERMINAL_RECOVERED")noteRecovered(reconnect.phase,Number.isInteger(reconnect.activeSeason)?reconnect.activeSeason:null);
      // The reload check: a later startup of this page found the same Showdown again (same sanitized authority) before it closed.
      if(hasStage("reconnect-recovered")&&Number.isInteger(safe.reconnectRecoveredStartupCount)&&safe.startupCount>safe.reconnectRecoveredStartupCount&&rivalryThisStartup&&!safe.reloadResumed){safe.reloadResumed=true;milestone("reload-resumed","SAME_SANITIZED_AUTHORITY",{startupCount:safe.startupCount});persist();}
      if(hasStage("showdown-complete"))askLocalPreview(local);
      if(local&&["REMOTE_OBSERVED","PREVIEW_READY","APPLIED"].includes(local.phase)){if(local.phase==="APPLIED")safe.candidateCApplied=true;milestone("local-reconciliation-safe",local.phase,{providerWrite:false});persist();}
      if(finalState?.phase==="FINAL_SEASON_RECONCILED"&&finalState.finalSeasonReconciled===true)milestone("final-season-reconciled","FINAL_SEASON_RECONCILED",{seasonNumber:Number(finalState.completedSeason)||null});
    }
    if(terminal?.phase==="CLOSED"&&terminal.terminal===true&&!closedSeen){
      safe.terminalClosedStartupCount=safe.startupCount;
      milestone("terminal-closed","CLOSED",{revision:Number.isInteger(terminal.rivalryRevision)?terminal.rivalryRevision:null,startupCount:safe.startupCount});
      persist();
    }
    if(hasStage("terminal-closed")&&!safe.terminalReloadVerified&&Number.isInteger(safe.terminalClosedStartupCount)&&safe.startupCount>safe.terminalClosedStartupCount)void confirmClosedAfterReload();
  }
  // After a reload, the closed Showdown is no longer the current one, so the recorder confirms it from the account's own
  // career: one read of the career index and the session-free completed-Showdown reader (the same exact gets the History
  // screens make). Read-only; the raw ids stay in memory and only the stored fingerprint is compared.
  function confirmClosedAfterReload(){
    if(closedCheck)return closedCheck;
    closedCheck=(async()=>{
      const runtime=root.CareerModeProductionFirebaseRuntime;if(!runtime||typeof runtime.ensureAccountServices!=="function"||typeof root.loadRuntimeScript!=="function")return false;
      if(!root.CareerModePersistentNikDanielPair)await root.loadRuntimeScript("persistent-pair","js/persistentNikDanielPair.js",()=>Boolean(root.CareerModePersistentNikDanielPair));
      if(!root.CareerModeSparkCompletedShowdownReader)await root.loadRuntimeScript("career-completed-reader","js/sparkCompletedShowdownReader.js",()=>Boolean(root.CareerModeSparkCompletedShowdownReader));
      const services=(root.CareerModeFirestoreBudget?.services||(value=>value))(await runtime.ensureAccountServices()),user=services?.auth?.currentUser;
      if(!services?.ok||!user||!safe.accountFingerprint||await sha256(user.uid)!==safe.accountFingerprint)return false;
      // The production SDK object carries no getDoc, so both reads get it explicitly, as the closed-career loader does (Codex #1014),
      // and through the reads counter like every other direct read (audit F04).
      const sdk=services.firestoreSdk?.getDoc?services.firestoreSdk:await import(runtime.firebaseFirestoreModule),firebaseSdk=(root.CareerModeFirestoreBudget?.meterSdk||(s=>s))({...services.firestoreSdk,getDoc:sdk.getDoc});
      const index=await root.CareerModePersistentNikDanielPair.readCareerIndex({firestore:services.firestore,firebaseSdk,accountId:user.uid});if(index?.status!=="ready"||!Array.isArray(index.rivalryIds))return false;
      let rivalryId=null;for(const id of index.rivalryIds)if(typeof id==="string"&&await sha256(id)===safe.rivalryFingerprint){rivalryId=id;break;}
      if(!rivalryId)return false;
      const read=await root.CareerModeSparkCompletedShowdownReader.readCompletedShowdown({firestore:services.firestore,firebaseSdk,user,rivalryId});
      if(read?.status!=="completed")return false;
      safe.terminalReloadVerified=true;milestone("terminal-reload-verified","CLOSED_AFTER_RELOAD",{startupCount:safe.startupCount});persist();return true;
    })().catch(error=>{root.console?.warn?.("[Career Mode Showdown] SSJR closed-Showdown check unavailable.",error);return false;}).then(result=>{if(!result)root.setTimeout?.(()=>{closedCheck=null;},10000);return result;});
    return closedCheck;
  }
  async function observe(){if(!enabled)return false;return queue=queue.then(async()=>{const identity=await bindIdentity();observeMilestones(identity);await safeConflictProbe(identity);render();return true;}).catch(error=>{root.console?.warn?.("[Career Mode Showdown] Physical Journey recorder observation failed.",error);render(String(error?.message||error));return false;});}
  // The offline check counts from the moment the career has started until the Showdown closes (during the game, where a real
  // signal drop matters). The panel asks for it after season 1's history in a longer run.
  function recoveryWindowOpen(){return hasStage("career-start-ready")&&!hasStage("terminal-closed");}
  // A reconnect counts only after this page was seen offline, then online, and then the game moved on with the browser online.
  function noteRecovered(phase,seasonNumber){
    const browserOnline=!root.navigator||root.navigator.onLine!==false;
    if(!safe.offlineObserved||!hasStage("network-online")||!browserOnline||safe.onlineRecovered||!recoveryWindowOpen())return null;
    safe.onlineRecovered=true;
    const recorded=milestone("reconnect-recovered",phase,{seasonNumber,startupCount:safe.startupCount});
    if(recorded&&safe.reconnectRecoveredStartupCount===null)safe.reconnectRecoveredStartupCount=safe.startupCount;
    persist();return recorded;
  }
  const PROGRESS_STAGES=new Set(["transfer-completed","results-ready","season-acknowledged","scoring-reconciled","history-converged","showdown-complete"]);
  function noteProgress(item){if(item&&PROGRESS_STAGES.has(item.stage)&&item.online===true)noteRecovered("PROGRESS_AFTER_ONLINE",Number.isInteger(item.seasonNumber)?item.seasonNumber:null);}
  function onOffline(){if(!enabled||!recoveryWindowOpen()||safe.onlineRecovered)return;safe.offlineObserved=true;milestone("network-offline","OFFLINE");persist();void observe();}
  function onOnline(){if(!enabled||!recoveryWindowOpen()||!safe.offlineObserved||safe.onlineRecovered)return;milestone("network-online","ONLINE");persist();void observe();}
  function storageProofComplete(){return Boolean(safe.canonicalStorageBeforeHash&&safe.canonicalStorageAfterHash&&safe.canonicalStorageBeforeHash===safe.canonicalStorageAfterHash&&safe.canonicalStorageViolation!==true);}
  function planSeasons(){const setup=safe.milestones.find(item=>item.stage==="setup-confirmed"),count=Number(setup?.totalSeasons);return PLAN_LENGTHS.includes(count)?count:null;}
  function seasonsRecorded(){const total=planSeasons();let done=0;for(let season=1;total&&season<=total;season+=1){if(SEASON_STAGES.every(stage=>safe.milestones.some(item=>item.stage===stage&&item.seasonNumber===season)))done=season;else break;}return done;}
  function planComplete(){const total=planSeasons();return Boolean(total&&seasonsRecorded()===total&&safe.milestones.some(item=>item.stage==="showdown-complete"&&item.seasonNumber===total));}
  function recoveryDone(){return safe.offlineObserved&&safe.onlineRecovered&&safe.reloadResumed;}
  function completed(){const stages=new Set(safe.milestones.map(item=>item.stage)),previewSeen=stages.has("local-reconciliation-safe");return CORE_STAGES.every(stage=>stages.has(stage))&&planComplete()&&stages.has("conflict-guard-proven")&&recoveryDone()&&safe.terminalReloadVerified&&safe.conflictGuardProven&&safe.authorityViolation!==true&&safe.candidateCApplied===false&&safe.canonicalStorageViolation!==true&&(!previewSeen||!safe.canonicalStorageBeforeHash||storageProofComplete())&&Boolean(safe.networkLabel);}
  async function evidence(){await queue;await observe();persist();return Object.freeze({schema:"career-mode-showdown.physical-journey-acceptance.v2",generatedAt:now(),appVersion:appVersion(),runtimeRevision:revision(),acceptanceMode:true,physicalJourneyMode:true,sanitizedSessionStorageOnly:true,recorderNetworkWrites:false,recorderReads:["closed-showdown-check"],rawAuthorityIncluded:false,canonicalRawIncluded:false,device:deviceFacts(),deviceLabel:autoDeviceLabel(),networkLabel:safe.networkLabel||null,managerRole:safe.managerRole,remoteRole:safe.remoteRole,accountFingerprint:safe.accountFingerprint,deviceFingerprint:safe.deviceFingerprint,rivalryFingerprint:safe.rivalryFingerprint,sessionFingerprints:[...safe.sessionFingerprints],authorityViolation:safe.authorityViolation,canonicalStorageProofScope:safe.canonicalStorageProofScope,canonicalStorageBeforeHash:safe.canonicalStorageBeforeHash,canonicalStorageAfterHash:safe.canonicalStorageAfterHash,canonicalStorageViolation:safe.canonicalStorageViolation,candidateCApplied:safe.candidateCApplied,offlineObserved:safe.offlineObserved,onlineRecovered:safe.onlineRecovered,reloadResumed:safe.reloadResumed,terminalReloadVerified:safe.terminalReloadVerified,conflictGuardProven:safe.conflictGuardProven,startupCount:safe.startupCount,milestones:safe.milestones.map(item=>({...item})),completed:completed()});}
  async function exportText(){return JSON.stringify(await evidence(),null,2);}
  function fileName(){return `ssjr-${(MANAGER_NAMES[safe.managerRole]||"manager").toLowerCase()}-${new Date().toISOString().slice(0,10)}.json`;}
  async function copyEvidence(){const text=await exportText();if(root.navigator?.clipboard?.writeText){await root.navigator.clipboard.writeText(text);return true;}return false;}
  // One tap: the phone's share sheet when it can take a file (iPhone: Messages, Mail, Files), else a download.
  async function saveEvidence(){
    const text=await exportText(),name=fileName();
    try{if(typeof File==="function"&&root.navigator?.canShare&&typeof root.navigator.share==="function"){const file=new File([text],name,{type:"application/json"});if(root.navigator.canShare({files:[file]})){await root.navigator.share({files:[file],title:"SSJR test result"});return true;}}}catch(error){if(error?.name==="AbortError")return false;}
    return downloadEvidence(text,name);
  }
  async function downloadEvidence(text,name){if(!root.document||typeof Blob==="undefined"||!root.URL?.createObjectURL)return false;const body=typeof text==="string"?text:await exportText(),blob=new Blob([body],{type:"application/json"}),url=root.URL.createObjectURL(blob),link=root.document.createElement("a");link.href=url;link.download=name||fileName();link.rel="noopener";root.document.body.appendChild(link);link.click();link.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),1000);return true;}
  // A new Showdown started on this page after a finished test (or a stale earlier try) starts a fresh record: no reset button.
  function restartRecord(){const keep={startupCount:safe.startupCount,networkLabel:safe.networkLabel};safe={...template(),...keep};previewAsked=false;closedCheck=null;rivalryThisStartup=false;persist();}
  function reset(){safe=template();safe.startupCount=1;previewAsked=false;closedCheck=null;try{root.sessionStorage?.removeItem(SAFE_STORE_KEY);}catch(_error){}persist();void observe();return true;}
  function create(tag,className,text){const node=root.document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function steps(){
    const stages=new Set(safe.milestones.map(item=>item.stage)),total=planSeasons();
    return [
      ["Connected",stages.has("remote-active")&&stages.has("setup-confirmed")],
      ["Career started",stages.has("career-start-ready")],
      [`Seasons ${seasonsRecorded()}/${total||"?"}`,planComplete()],
      ["Offline check",safe.offlineObserved&&safe.onlineRecovered],
      ["Reload check",safe.reloadResumed],
      ["Showdown saved",stages.has("terminal-closed")],
      ["Saved after reload",safe.terminalReloadVerified]
    ];
  }
  function nextStep(){
    const stages=new Set(safe.milestones.map(item=>item.stage)),total=planSeasons(),done=seasonsRecorded();
    if(!safe.networkLabel)return "Tap how this device is online.";
    if(completed())return "Done. Tap SAVE RESULT FILE and send it to Claude.";
    if(safe.authorityViolation)return "This page switched player or Showdown. Send Claude a screenshot.";
    if(!stages.has("career-start-ready"))return "Play as normal: connect, pick the league and clubs, start the career.";
    if(!stages.has("terminal-closed")&&!recoveryDone()&&(done>=1||total===1)){
      if(!safe.offlineObserved)return "Now: turn the internet off on this device for 15 seconds, then back on.";
      if(!safe.onlineRecovered)return root.navigator?.onLine===false?"Offline. Turn the internet back on.":"Back online. Play on: the next saved step finishes this check.";
      return "Now: reload this page once (same tab).";
    }
    if(!stages.has("terminal-closed"))return total?`Play on: season ${Math.min(done+1,total)} of ${total}.`:"Play on.";
    if(!recoveryDone())return "The offline and reload checks were missed. Send Claude a screenshot.";
    return "Showdown saved. Reload this page once more.";
  }
  function ensurePanel(){
    if(!enabled||!root.document)return null;let panel=root.document.getElementById(PANEL_ID);if(panel)return panel;
    panel=create("section","ssjrTestPanel");panel.id=PANEL_ID;panel.setAttribute("aria-label","SSJR test");panel.setAttribute("role","status");
    // r85: the game screens are full-bleed layers, so a strip in the app column was hidden under them. The panel is a small
    // fixed pill in the top-left corner above every screen (only on ?ssjr=1 test runs); it opens by itself when the player
    // has something to do and closes on a tap, so it covers a corner only while it asks for something.
    const style=create("style");style.textContent=`#${PANEL_ID}{position:fixed;z-index:2147483000;left:8px;top:max(8px,env(safe-area-inset-top));max-width:min(330px,calc(100vw - 16px));box-sizing:border-box;padding:6px 10px;border:1px solid #c9a24a;border-radius:10px;background:#16120a;color:#f5ecd6;font:600 13px/1.35 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5)}
@media(min-width:901px){#${PANEL_ID}{top:60px}}
@media(max-width:900px){html[data-v10-screen="mainMenu"] #${PANEL_ID}{top:max(50px,calc(env(safe-area-inset-top) + 42px))}}
#${PANEL_ID}[data-open="false"] .ssjrTestBody{display:none}
#${PANEL_ID} .ssjrTestBody{max-height:60vh;overflow:auto}
#${PANEL_ID} button{min-height:36px}
#${PANEL_ID} :is(.ssjrTestNetwork,.ssjrTestActions) button{color:#16120a;-webkit-text-fill-color:#16120a;background:linear-gradient(180deg,#ffe9a6,#e8b33c);border:1px solid #f5d77a;text-shadow:none;opacity:1}`;
    panel.append(style);
    const head=create("button","ssjrTestHead");head.type="button";head.setAttribute("aria-expanded","true");
    head.style.cssText="display:flex;align-items:center;gap:8px;min-height:30px;padding:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer";
    const title=create("strong","","SSJR TEST");title.style.cssText="color:#e5c46b;letter-spacing:.06em";
    const count=create("span","ssjrTestCount");const caret=create("span","ssjrTestCaret","▾");
    head.append(title,count,caret);head.addEventListener("click",()=>{panel.dataset.open=String(panel.dataset.open==="false");panelPinned=true;render();});
    panel.append(head);
    const body=create("div","ssjrTestBody");panel.append(body);
    const next=create("p","ssjrTestNext");next.style.cssText="margin:4px 0 0";body.append(next);
    const network=create("div","ssjrTestNetwork");network.style.cssText="display:flex;gap:6px;margin-top:6px";
    for(const [text,label] of NETWORKS){const button=create("button","",text);button.type="button";button.style.cssText="padding:7px 12px;font-weight:800;border-radius:8px";button.addEventListener("click",()=>setNetwork(label));network.append(button);}
    body.append(network);
    const details=create("details","ssjrTestDetails"),summary=create("summary","","Checklist");summary.style.cssText="cursor:pointer;margin-top:4px;color:#cbb88a";details.append(summary,create("div","ssjrTestSteps"));body.append(details);
    const actions=create("div","ssjrTestActions");actions.style.cssText="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px";
    const save=create("button","ssjrTestSave","SAVE RESULT FILE");save.type="button";save.style.cssText="padding:8px 12px;font-weight:800;border-radius:8px";save.addEventListener("click",()=>void saveEvidence());
    const copy=create("button","ssjrTestCopy","COPY");copy.type="button";copy.style.cssText="padding:8px 12px;font-weight:800;border-radius:8px";copy.addEventListener("click",async()=>{copy.textContent=await copyEvidence()?"COPIED":"COPY UNAVAILABLE";root.setTimeout(()=>copy.textContent="COPY",1200);});
    actions.append(save,copy);body.append(actions,create("p","ssjrTestNote"));
    panel.dataset.open="true";root.document.body.appendChild(panel);return panel;
  }
  function render(error=""){
    const panel=ensurePanel();if(!panel)return false;
    const list=steps(),passed=list.filter(([,ok])=>ok).length,done=completed();
    panel.querySelector(".ssjrTestCount").textContent=`${passed}/${list.length}`;
    const hint=nextStep(),action=/^(Tap|Now:|Done|Showdown saved|Offline|This page|The offline)/.test(hint);
    // Opens by itself when the hint changes to something the player must do; between those it folds to the pill.
    if(hint!==lastHint){lastHint=hint;panelPinned=false;panel.dataset.open=String(action||!!error);}
    else if(!panelPinned&&error)panel.dataset.open="true";
    panel.querySelector(".ssjrTestNext").textContent=hint;
    panel.querySelector(".ssjrTestCaret").textContent=panel.dataset.open==="false"?"▸":"▾";
    panel.querySelector(".ssjrTestHead").setAttribute("aria-expanded",panel.dataset.open==="false"?"false":"true");
    panel.querySelector(".ssjrTestNetwork").style.display=safe.networkLabel?"none":"flex";
    panel.querySelector(".ssjrTestActions").style.display=done||safe.authorityViolation||hasStage("terminal-closed")?"flex":"none";
    const box=panel.querySelector(".ssjrTestSteps");box.replaceChildren();for(const [label,ok] of list){const row=create("div","",`${ok?"✓":"○"} ${label}`);row.dataset.passed=String(ok);box.append(row);}
    box.append(create("div","",`Device: ${autoDeviceLabel()}${safe.networkLabel?` · ${safe.networkLabel}`:""}`));
    panel.querySelector(".ssjrTestNote").textContent=error?`Note: ${error}`:"";panel.dataset.complete=String(done);return true;
  }
  function install(){if(!enabled||installed)return enabled;installed=true;safe.startupCount=Number(safe.startupCount||0)+1;persist();root.addEventListener?.("offline",onOffline);root.addEventListener?.("online",onOnline);for(const event of ["career-mode-shared-setup-state-change","career-mode-shared-season-commit-state-change","career-mode-shared-canonical-scoring-state-change","career-mode-shared-history-convergence-state-change","career-mode-shared-multi-season-state-change","career-mode-shared-journey-reconnect-state-change","career-mode-shared-journey-conflict-state-change","career-mode-shared-local-reconciliation-state-change","career-mode-shared-final-reconciliation-state-change","career-mode-shared-terminal-close-state-change","career-mode-connected-account-state-change"])root.addEventListener?.(event,()=>void observe());root.document?.addEventListener?.("visibilitychange",()=>{if(root.document.visibilityState==="visible")void observe();});if(typeof root.setInterval==="function")pollTimer=root.setInterval(()=>void observe(),POLL_MS);ensurePanel();void observe();return true;}
  function destroy(){if(pollTimer!==null&&typeof root.clearInterval==="function")root.clearInterval(pollTimer);pollTimer=null;root.removeEventListener?.("offline",onOffline);root.removeEventListener?.("online",onOnline);root.document?.getElementById(PANEL_ID)?.remove();installed=false;return true;}

  return Object.freeze({contractVersion:3,feature:"mdp-physical-journey-acceptance-recorder",enabled,acceptanceOnly:true,productionObserver:true,runtimeRevision:"1.9.1-r20",pollIntervalMs:POLL_MS,sanitizedSessionStorageOnly:true,rawAuthorityPersistence:false,providerWriteRequired:false,recorderNetworkWrites:false,recorderReads:Object.freeze(["closed-showdown-check"]),canonicalStorageMutation:false,canonicalStorageProofScope:"local-reconciliation-preview",candidateCAutomaticApply:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,install,destroy,observe,setNetwork,captureLocalReconciliationBaseline,verifyLocalReconciliationPreview,runConflictGuardProbe:async()=>safeConflictProbe(await bindIdentity()),confirmClosedAfterReload,getEvidence:evidence,copyEvidence,saveEvidence,downloadEvidence,reset,nextStep,getState:()=>Object.freeze({enabled,installed,completed:completed(),startupCount:safe.startupCount,managerRole:safe.managerRole,networkLabel:safe.networkLabel,milestones:safe.milestones.length,authorityViolation:safe.authorityViolation,offlineObserved:safe.offlineObserved,onlineRecovered:safe.onlineRecovered,reconnectRecoveredStartupCount:safe.reconnectRecoveredStartupCount,reloadResumed:safe.reloadResumed,terminalReloadVerified:safe.terminalReloadVerified,conflictGuardProven:safe.conflictGuardProven,canonicalStorageProofReady:storageProofComplete()})});
});
