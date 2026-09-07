(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSSJRProductionAcceptanceRecorder=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PARAM="ssjr-acceptance";
  const PANEL_ID="ssjrProductionAcceptanceRecorder";
  const SAFE_STORE_KEY="careerModeShowdown.ssjrAcceptance.safe.v1";
  const CANONICAL_KEYS=Object.freeze([
    "careerModeShowdown.saveLibrary",
    "careerModeShowdown.legacyShowdowns",
    "careerModeShowdown.preferences"
  ]);
  const ALLOWED_SEASONS=new Set([1,3,5,10]);
  const enabled=!!(root.location&&new URLSearchParams(root.location.search).get(PARAM)==="1");
  let initialized=false;
  let setupApi=null;
  let setupUnsubscribe=null;
  let pollTimer=null;
  let queue=Promise.resolve();
  let runtimeError=null;
  let latestSetupState=null;
  let safe=loadSafe();

  function now(){return new Date().toISOString();}
  function revision(){
    const meta=root.document&&root.document.querySelector('meta[name="app-asset-revision"]');
    return meta&&meta.content?meta.content.trim():"unknown";
  }
  function plain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function stable(value){
    if(Array.isArray(value))return value.map(stable);
    if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
    return value;
  }
  async function sha256Text(value){
    if(!root.crypto||!root.crypto.subtle||typeof TextEncoder==="undefined")throw new Error("Secure browser hashing is unavailable.");
    const digest=await root.crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(value)));
    return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;
  }
  function safeTemplate(){return {
    schemaVersion:1,
    runtimeRevision:revision(),
    startedAt:now(),
    managerRole:null,
    remoteRole:null,
    accountFingerprint:null,
    deviceFingerprint:null,
    rivalryFingerprint:null,
    canonicalStorageBeforeHash:null,
    canonicalStorageAfterHash:null,
    canonicalStorageViolation:false,
    pairedActiveBeforeSetup:null,
    authoritativeSetupObserved:null,
    identicalFinalSetup:null,
    reloadArmed:false,
    reloadResume:null,
    freshActiveSessionResume:null,
    finalSetup:null,
    completed:false
  };}
  function loadSafe(){
    try{
      const raw=root.sessionStorage&&root.sessionStorage.getItem(SAFE_STORE_KEY);
      if(!raw)return safeTemplate();
      const parsed=JSON.parse(raw);
      return plain(parsed)&&parsed.schemaVersion===1?{...safeTemplate(),...parsed}:safeTemplate();
    }catch(_error){return safeTemplate();}
  }
  function persistSafe(){
    try{if(root.sessionStorage)root.sessionStorage.setItem(SAFE_STORE_KEY,JSON.stringify(safe));}catch(_error){}
  }
  function clearSafe(){
    safe=safeTemplate();runtimeError=null;
    try{if(root.sessionStorage)root.sessionStorage.removeItem(SAFE_STORE_KEY);}catch(_error){}
    render();
    return true;
  }
  function canonicalSnapshot(){
    if(typeof root.captureCareerModeRawBackupInputs!=="function")throw new Error("Canonical storage read authority is unavailable.");
    const raw=root.captureCareerModeRawBackupInputs();
    return {
      [CANONICAL_KEYS[0]]:raw&&Object.hasOwn(raw,"saveLibrary")?raw.saveLibrary:null,
      [CANONICAL_KEYS[1]]:raw&&Object.hasOwn(raw,"legacyShowdowns")?raw.legacyShowdowns:null,
      [CANONICAL_KEYS[2]]:raw&&Object.hasOwn(raw,"preferences")?raw.preferences:null
    };
  }
  async function canonicalHash(){return sha256Text(JSON.stringify(stable(canonicalSnapshot())));}
  async function setupDigest(setup){return sha256Text(JSON.stringify(stable(setup)));}
  function canonicalFinalSetup(setup){
    if(!plain(setup))return null;
    return {
      leagueId:setup.leagueId||null,
      clubs:{
        playerOne:setup.clubs&&setup.clubs.playerOne||null,
        playerTwo:setup.clubs&&setup.clubs.playerTwo||null
      },
      clubLeagueIds:{
        playerOne:setup.clubLeagueIds&&setup.clubLeagueIds.playerOne||null,
        playerTwo:setup.clubLeagueIds&&setup.clubLeagueIds.playerTwo||null
      },
      totalSeasons:setup.totalSeasons||null,
      confirmedRoles:Array.isArray(setup.confirmedRoles)?[...setup.confirmedRoles].sort():[],
      phase:setup.phase||null,
      revision:Number.isInteger(setup.revision)?setup.revision:null
    };
  }
  function assertObservedFinalSetup(finalSetup){
    if(!finalSetup||typeof finalSetup.leagueId!=="string"||!finalSetup.leagueId)throw new Error("Final Shared Setup did not expose an observed league.");
    if(typeof finalSetup.clubs.playerOne!=="string"||!finalSetup.clubs.playerOne||typeof finalSetup.clubs.playerTwo!=="string"||!finalSetup.clubs.playerTwo)throw new Error("Final Shared Setup did not expose both observed clubs.");
    if(finalSetup.clubs.playerOne===finalSetup.clubs.playerTwo)throw new Error("Final Shared Setup exposed duplicate permanent clubs.");
    if(finalSetup.clubLeagueIds.playerOne!==finalSetup.leagueId||finalSetup.clubLeagueIds.playerTwo!==finalSetup.leagueId)throw new Error("Observed club league identities do not match the authoritative league.");
    if(!ALLOWED_SEASONS.has(finalSetup.totalSeasons))throw new Error("Observed Shared Setup has an unsupported season length.");
    if(finalSetup.phase!=="SHOWDOWN_CONFIRMED"||finalSetup.revision!==6)throw new Error("Observed Shared Setup is not exact SHOWDOWN_CONFIRMED revision 6.");
    if(finalSetup.confirmedRoles.length!==2||finalSetup.confirmedRoles[0]!=="playerOne"||finalSetup.confirmedRoles[1]!=="playerTwo")throw new Error("Both distinct manager roles have not confirmed the observed Shared Setup.");
    return finalSetup;
  }
  async function finalDigest(finalSetup){return sha256Text(JSON.stringify(stable(finalSetup)));}
  function updateSafe(next){safe={...safe,...next};persistSafe();render();return safe;}
  function requireStableIdentity(label,prior,next){if(prior&&prior!==next)throw new Error(`${label} changed during one SSJR acceptance run.`);}
  function remoteProgress(){
    const remote=root.CareerModeSparkRemoteJoining;
    if(!remote||typeof remote.getState!=="function")return Object.freeze({active:false});
    try{
      const state=remote.getState();
      return Object.freeze({active:Boolean(state&&state.sessionState==="active"&&state.sessionId&&!state.pendingAction)});
    }catch(_error){return Object.freeze({active:false});}
  }
  function setupBlocker(){
    let current=latestSetupState;
    if(!current&&setupApi&&typeof setupApi.getState==="function"){
      try{current=setupApi.getState();}catch(_error){}
    }
    if(!current||current.ready===true||(current.status!=="locked"&&current.status!=="error"))return "";
    const message=typeof current.message==="string"?current.message.trim():"";
    return message||"Shared Setup authority has not resolved yet.";
  }

  async function observe(state){
    if(!enabled||!state)return;
    latestSetupState=state;
    queue=queue.then(async()=>{
      const next={};
      const hasAuthority=state.ready===true&&state.accountId&&state.deviceId&&state.rivalryId&&state.sessionId&&state.managerRole&&state.remoteRole;
      if(hasAuthority){
        const accountFingerprint=await sha256Text(state.accountId);
        const deviceFingerprint=await sha256Text(state.deviceId);
        const rivalryFingerprint=await sha256Text(state.rivalryId);
        requireStableIdentity("Manager role",safe.managerRole,state.managerRole);
        requireStableIdentity("Remote role",safe.remoteRole,state.remoteRole);
        requireStableIdentity("Account authority",safe.accountFingerprint,accountFingerprint);
        requireStableIdentity("Registered browser authority",safe.deviceFingerprint,deviceFingerprint);
        requireStableIdentity("Connected Rivalry authority",safe.rivalryFingerprint,rivalryFingerprint);
        next.managerRole=state.managerRole;
        next.remoteRole=state.remoteRole;
        next.accountFingerprint=accountFingerprint;
        next.deviceFingerprint=deviceFingerprint;
        next.rivalryFingerprint=rivalryFingerprint;
      }

      if(hasAuthority&&!safe.pairedActiveBeforeSetup&&(!state.setup||state.revision===0)){
        const sessionFingerprint=await sha256Text(state.sessionId);
        next.canonicalStorageBeforeHash=await canonicalHash();
        next.pairedActiveBeforeSetup={
          at:now(),paired:true,sessionState:"active",setupMutationSeen:false,sessionFingerprint
        };
      }

      if(hasAuthority&&state.setup&&state.revision===4&&state.setup.phase==="SEASON_LENGTH_COMMITTED"&&!safe.authoritativeSetupObserved){
        next.authoritativeSetupObserved={at:now(),revision:4,setupDigest:await setupDigest(state.setup)};
      }

      if(hasAuthority&&state.setup&&state.revision===6&&state.setup.phase==="SHOWDOWN_CONFIRMED"){
        const finalSetup=assertObservedFinalSetup(canonicalFinalSetup(state.setup));
        const digest=await finalDigest(finalSetup);
        finalSetup.digest=digest;
        const afterHash=await canonicalHash();
        next.finalSetup=finalSetup;
        next.canonicalStorageAfterHash=afterHash;
        next.canonicalStorageViolation=safe.canonicalStorageViolation===true||Boolean(safe.canonicalStorageBeforeHash&&afterHash!==safe.canonicalStorageBeforeHash);
        if(!safe.identicalFinalSetup)next.identicalFinalSetup={at:now(),setupDigest:digest};
        else if(safe.identicalFinalSetup.setupDigest!==digest)throw new Error("Final Shared Setup changed after it was confirmed.");

        if(safe.reloadArmed&&!safe.reloadResume&&safe.identicalFinalSetup&&safe.identicalFinalSetup.setupDigest===digest){
          next.reloadArmed=false;
          next.reloadResume={at:now(),setupDigest:digest,resetOrRedraw:false};
        }

        if(safe.pairedActiveBeforeSetup&&safe.pairedActiveBeforeSetup.sessionFingerprint){
          const currentSessionFingerprint=await sha256Text(state.sessionId);
          if(currentSessionFingerprint!==safe.pairedActiveBeforeSetup.sessionFingerprint&&safe.reloadResume&&!safe.freshActiveSessionResume){
            next.freshActiveSessionResume={at:now(),setupDigest:digest,resetOrRedraw:false,sessionFingerprint:currentSessionFingerprint};
          }
        }
      }

      const merged={...safe,...next};
      merged.completed=Boolean(
        merged.pairedActiveBeforeSetup&&merged.authoritativeSetupObserved&&merged.identicalFinalSetup&&
        merged.reloadResume&&merged.freshActiveSessionResume&&merged.finalSetup&&
        merged.canonicalStorageBeforeHash&&merged.canonicalStorageAfterHash&&
        merged.canonicalStorageViolation!==true&&
        merged.canonicalStorageBeforeHash===merged.canonicalStorageAfterHash
      );
      safe=merged;persistSafe();render();
    }).catch(error=>{runtimeError=error;render();});
    return queue;
  }

  async function ensureSetup(){
    if(setupApi)return setupApi;
    if(root.CareerModeProductionSharedShowdownSetup)setupApi=root.CareerModeProductionSharedShowdownSetup;
    else{
      if(typeof root.loadRuntimeStyle==="function")await root.loadRuntimeStyle("rj","css/remoteJoining.css");
      if(typeof root.loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");
      await root.loadRuntimeScript("ssjr-production-setup-recorder","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
      setupApi=root.CareerModeProductionSharedShowdownSetup;
    }
    if(!setupApi||typeof setupApi.getState!=="function"||typeof setupApi.refresh!=="function"||typeof setupApi.subscribe!=="function")throw new Error("Production Shared Setup API is unavailable.");
    if(!setupUnsubscribe)setupUnsubscribe=setupApi.subscribe(state=>{void observe(state);});
    await observe(setupApi.getState());
    return setupApi;
  }
  async function checkNow(){
    const api=await ensureSetup();
    const result=await api.refresh();
    await observe(api.getState());
    return result;
  }
  async function openSetup(){const api=await ensureSetup();return api.openPanel();}
  async function openRemoteJoining(){
    if(!root.CareerModeSparkRemoteJoining){
      if(typeof root.loadRuntimeStyle==="function")await root.loadRuntimeStyle("rj","css/remoteJoining.css");
      if(typeof root.loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");
      await root.loadRuntimeScript("rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining);
    }
    if(!root.CareerModeSparkRemoteJoining||typeof root.CareerModeSparkRemoteJoining.openPanel!=="function")throw new Error("Private Remote Joining is unavailable.");
    return root.CareerModeSparkRemoteJoining.openPanel();
  }
  function armReload(reloadNow=true){
    if(!safe.identicalFinalSetup)throw new Error("Reach SHOWDOWN_CONFIRMED · REV 6 before the reload proof.");
    updateSafe({reloadArmed:true});
    if(reloadNow&&root.location&&typeof root.location.reload==="function")root.location.reload();
    return true;
  }
  function getDraftEvidence(){
    const result={...safe};
    delete result.reloadArmed;
    delete result.completed;
    return Object.freeze({
      evidenceType:"SSJR-1.1-production-shared-setup-guided-positive-draft",
      privacySafe:true,
      rawAuthorityIncluded:false,
      canonicalStorageRawIncluded:false,
      generatedAt:now(),
      ...result
    });
  }
  async function copyDraft(){
    await queue;
    const text=JSON.stringify(getDraftEvidence(),null,2);
    if(root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.writeText==="function"){
      await root.navigator.clipboard.writeText(text);return true;
    }
    return false;
  }
  async function downloadDraft(){
    await queue;
    if(!root.document||typeof Blob==="undefined"||!root.URL||typeof root.URL.createObjectURL!=="function")return false;
    const text=JSON.stringify(getDraftEvidence(),null,2);
    const blob=new Blob([text],{type:"application/json"});
    const url=root.URL.createObjectURL(blob);const link=root.document.createElement("a");
    link.href=url;link.download=`ssjr-shared-setup-positive-${safe.managerRole||"manager"}-${Date.now()}.json`;link.rel="noopener";
    root.document.body.appendChild(link);link.click();link.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),1000);return true;
  }

  function statusRows(){
    const preserved=Boolean(safe.canonicalStorageBeforeHash&&safe.canonicalStorageAfterHash&&safe.canonicalStorageViolation!==true&&safe.canonicalStorageBeforeHash===safe.canonicalStorageAfterHash);
    return [
      ["1 · PAIRED + ACTIVE BEFORE SETUP",!!safe.pairedActiveBeforeSetup],
      ["2 · AUTHORITATIVE SETUP REV 4",!!safe.authoritativeSetupObserved],
      ["3 · IDENTICAL FINAL SETUP REV 6",!!safe.identicalFinalSetup],
      ["4 · CANONICAL SAVE UNCHANGED",preserved],
      ["5 · RELOAD + RESUME",!!safe.reloadResume],
      ["6 · FRESH ACTIVE SESSION + RESUME",!!safe.freshActiveSessionResume]
    ];
  }
  function hasCanonicalViolation(){return safe.canonicalStorageViolation===true||Boolean(safe.canonicalStorageBeforeHash&&safe.canonicalStorageAfterHash&&safe.canonicalStorageBeforeHash!==safe.canonicalStorageAfterHash);}
  function primaryActionLabel(){
    if(runtimeError)return "CHECK AGAIN";
    if(!safe.pairedActiveBeforeSetup)return remoteProgress().active?"NEXT STEP · CHECK SHARED SETUP":"NEXT STEP · OPEN PRIVATE SESSION";
    if(!safe.authoritativeSetupObserved||!safe.identicalFinalSetup)return "NEXT STEP · OPEN SHARED SETUP";
    if(hasCanonicalViolation())return "STOP · SHOW RECORDER ERROR";
    if(!safe.reloadResume)return "NEXT STEP · RELOAD & VERIFY";
    if(!safe.freshActiveSessionResume)return "NEXT STEP · OPEN FRESH SESSION";
    return "FINISH · DOWNLOAD SAFE RESULT";
  }
  async function runPrimaryAction(){
    runtimeError=null;
    if(!safe.pairedActiveBeforeSetup)return remoteProgress().active?openSetup():openRemoteJoining();
    if(!safe.authoritativeSetupObserved||!safe.identicalFinalSetup)return openSetup();
    if(hasCanonicalViolation())return false;
    if(!safe.reloadResume)return armReload(true);
    if(!safe.freshActiveSessionResume)return openRemoteJoining();
    return downloadDraft();
  }
  function nextInstruction(){
    if(!safe.pairedActiveBeforeSetup){
      if(remoteProgress().active){
        const blocker=setupBlocker();
        return blocker?`Private session is ACTIVE. Shared Setup has not resolved yet: ${blocker} Press the big NEXT STEP button to inspect Shared Setup. Do not host another session.`:"Private session is ACTIVE. Press the big NEXT STEP button to check Shared Setup. Do not host another session.";
      }
      return "Pair the two managers and make the same private session ACTIVE on both devices. The recorder checks automatically; use the big NEXT STEP button to open the session controls.";
    }
    if(!safe.authoritativeSetupObserved)return "Use the big NEXT STEP button. Draw one league, two different clubs, and choose 1/3/5/10 seasons. Pause when both recorders mark step 2 PASS.";
    if(!safe.identicalFinalSetup)return "Each manager confirms on their own device. The recorder automatically detects SHOWDOWN_CONFIRMED · REV 6.";
    if(hasCanonicalViolation())return "STOP: canonical local gameplay storage changed. Send me only a screenshot of this recorder panel; do not continue.";
    if(!safe.reloadResume)return safe.reloadArmed?"Reload is armed. Rejoin the SAME session if needed; the recorder will verify the resume automatically.":"Press the big NEXT STEP button. It will arm the proof and reload this device automatically.";
    if(!safe.freshActiveSessionResume)return "Press the big NEXT STEP button, create one FRESH private session for the SAME rivalry, and join it on the other device. No league or club should redraw.";
    return "Done on this device. Press the big FINISH button to download the privacy-safe result. No raw IDs or screenshots are needed unless the recorder reports an error.";
  }
  function create(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=String(text);return element;}
  function ensureStyle(){
    if(!root.document||root.document.getElementById("ssjrProductionAcceptanceRecorderStyle"))return;
    const style=create("style");style.id="ssjrProductionAcceptanceRecorderStyle";style.textContent=`
#${PANEL_ID}{position:fixed;right:12px;bottom:12px;z-index:2147483001;width:min(430px,calc(100vw - 24px));max-height:78vh;overflow:auto;background:#0d1520;color:#f4f7fa;border:1px solid rgba(255,255,255,.24);border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.48);font:14px/1.35 system-ui,sans-serif;padding:14px}#${PANEL_ID} h2{font-size:17px;margin:0}#${PANEL_ID} p{margin:7px 0;color:#c9d2dc}#${PANEL_ID} .ssjrTop{display:flex;align-items:center;justify-content:space-between;gap:8px}#${PANEL_ID} .ssjrTop button{padding:5px 8px}#${PANEL_ID} button{border:0;border-radius:7px;padding:8px 10px;font-weight:750;cursor:pointer}#${PANEL_ID} .ssjrPrimary{display:block;width:100%;margin:10px 0;padding:12px 14px;background:#f4f7fa;color:#0d1520;font-size:15px}#${PANEL_ID} .ssjrAdvanced{margin:8px 0;color:#c9d2dc}#${PANEL_ID} .ssjrAdvanced summary{cursor:pointer;font-weight:700}#${PANEL_ID} .ssjrButtons{display:flex;flex-wrap:wrap;gap:7px;margin:9px 0}#${PANEL_ID} .ssjrRow{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.1)}#${PANEL_ID} .ssjrRow strong{font-size:12px}#${PANEL_ID} .ssjrNext{background:#172332;border-radius:8px;padding:9px;margin-top:10px}#${PANEL_ID} .ssjrPrivacy{font-size:11px;color:#9eb0c1}#${PANEL_ID}[data-collapsed="true"]>*:not(.ssjrTop){display:none}`;root.document.head.appendChild(style);
  }
  function render(){
    if(!enabled||!root.document)return null;
    let panel=root.document.getElementById(PANEL_ID);if(!panel)return createPanel();
    const list=panel.querySelector(".ssjrStatus");if(list){list.replaceChildren();for(const [label,passed] of statusRows()){const row=create("div","ssjrRow");row.append(create("span","",label),create("strong","",passed?"PASS":"PENDING"));list.append(row);}}
    const primary=panel.querySelector(".ssjrPrimary");if(primary){primary.textContent=primaryActionLabel();primary.disabled=hasCanonicalViolation();}
    const next=panel.querySelector(".ssjrNext");if(next)next.textContent=runtimeError?`RECORDER ERROR: ${runtimeError.message||runtimeError}`:nextInstruction();
    const meta=panel.querySelector(".ssjrMeta");if(meta)meta.textContent=`ROLE: ${safe.managerRole||"not resolved"} · REMOTE: ${safe.remoteRole||"not resolved"} · SESSION: ${remoteProgress().active?"ACTIVE":"not resolved"} · RUNTIME: ${safe.runtimeRevision||revision()}`;
    return panel;
  }
  function createPanel(){
    if(!enabled||!root.document)return null;ensureStyle();
    const panel=create("aside");panel.id=PANEL_ID;panel.dataset.collapsed="false";panel.setAttribute("aria-label","SSJR production acceptance recorder");
    const top=create("div","ssjrTop");top.append(create("h2","","SSJR GUIDED RECORDER"));const collapse=create("button","","MINIMIZE");collapse.type="button";collapse.addEventListener("click",()=>{const next=panel.dataset.collapsed!=="true";panel.dataset.collapsed=String(next);collapse.textContent=next?"OPEN":"MINIMIZE";});top.append(collapse);panel.append(top);
    panel.append(create("p","","Simple mode: follow the one big NEXT STEP button. The recorder watches the real test and marks proof automatically."));
    panel.append(create("p","ssjrMeta",""));
    panel.append(create("div","ssjrStatus"));
    const primary=create("button","ssjrPrimary",primaryActionLabel());primary.type="button";primary.addEventListener("click",()=>void runPrimaryAction().catch(error=>{runtimeError=error;render();}));panel.append(primary);
    const advanced=create("details","ssjrAdvanced");advanced.append(create("summary","","MORE CONTROLS — only if needed"));
    const buttons=create("div","ssjrButtons");
    const check=create("button","","CHECK NOW");check.type="button";check.addEventListener("click",()=>void checkNow().catch(error=>{runtimeError=error;render();}));
    const setup=create("button","","OPEN SHARED SETUP");setup.type="button";setup.addEventListener("click",()=>void openSetup().catch(error=>{runtimeError=error;render();}));
    const remote=create("button","","OPEN PRIVATE SESSION");remote.type="button";remote.addEventListener("click",()=>void openRemoteJoining().catch(error=>{runtimeError=error;render();}));
    const reload=create("button","","ARM + RELOAD");reload.type="button";reload.addEventListener("click",()=>{try{armReload(true);}catch(error){runtimeError=error;render();}});
    const copy=create("button","","COPY SAFE DRAFT");copy.type="button";copy.addEventListener("click",async()=>{try{copy.textContent=await copyDraft()?"COPIED":"COPY UNAVAILABLE";}catch(error){runtimeError=error;}root.setTimeout(()=>{copy.textContent="COPY SAFE DRAFT";render();},1400);});
    const download=create("button","","DOWNLOAD SAFE DRAFT");download.type="button";download.addEventListener("click",()=>void downloadDraft().catch(error=>{runtimeError=error;render();}));
    const reset=create("button","","RESET RECORDER");reset.type="button";reset.addEventListener("click",clearSafe);
    buttons.append(check,setup,remote,reload,copy,download,reset);advanced.append(buttons);panel.append(advanced);
    panel.append(create("p","ssjrNext",""));
    panel.append(create("p","ssjrPrivacy","Only SHA-256 fingerprints and Shared Setup facts survive reload. Raw account, device, rivalry, session capability and canonical storage values are never exported or written to recorder storage. Firebase remains Spark; this recorder cannot enable billing, Blaze, Cloud Run, Cloud Functions or App Check enforcement."));
    root.document.body.append(panel);render();return panel;
  }
  function startPolling(){
    if(pollTimer||!enabled)return;
    let checks=0;
    const tick=()=>{
      if(!initialized||checks>=90){pollTimer=null;return;}
      checks+=1;
      if(!root.document||root.document.visibilityState!=="hidden")void checkNow().catch(()=>{});
      pollTimer=root.setTimeout(tick,4000);
    };
    pollTimer=root.setTimeout(tick,600);
  }
  async function install(){
    if(!enabled||initialized)return enabled;
    initialized=true;createPanel();
    try{await ensureSetup();startPolling();}catch(error){runtimeError=error;render();}
    return true;
  }
  function destroy(){
    initialized=false;if(setupUnsubscribe){setupUnsubscribe();setupUnsubscribe=null;}if(pollTimer){root.clearTimeout(pollTimer);pollTimer=null;}
    const panel=root.document&&root.document.getElementById(PANEL_ID);if(panel)panel.remove();return true;
  }

  return Object.freeze({
    contractVersion:1,
    feature:"ssjr-production-guided-positive-acceptance-recorder",
    enabled,
    productionEnabled:true,
    pageRawAuthorityPersistence:false,
    sanitizedSessionStorageOnly:true,
    canonicalStorageMutation:false,
    billingRequired:false,
    blazeRequired:false,
    cloudRunRequired:false,
    cloudFunctionsRequired:false,
    appCheckEnforcementRequired:false,
    install,destroy,checkNow,openSetup,openRemoteJoining,armReload,runPrimaryAction,clearSafe,
    getDraftEvidence,copyDraft,downloadDraft,
    getState:()=>Object.freeze({enabled,initialized,completed:safe.completed,managerRole:safe.managerRole,remoteRole:safe.remoteRole,remoteSessionActive:remoteProgress().active,primaryActionLabel:primaryActionLabel(),statusRows:statusRows().map(([label,passed])=>({label,passed}))})
  });
});