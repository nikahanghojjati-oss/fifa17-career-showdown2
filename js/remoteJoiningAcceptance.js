(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRemoteJoiningAcceptance=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PARAM="rjr-acceptance";
  const PANEL_ID="remoteJoiningAcceptanceRecorder";
  const MAX_RECORDS=160;
  const enabled=!!(root.location&&new URLSearchParams(root.location.search).get(PARAM)==="1");
  const records=[];
  let sequence=0;
  let initialized=false;
  let remoteUnsubscribe=null;
  let remoteApi=null;
  let queue=Promise.resolve();
  let deviceLabel="";
  let networkLabel="";

  function revision(){const meta=root.document&&root.document.querySelector('meta[name="app-asset-revision"]');return meta&&meta.content?meta.content.trim():"unknown";}
  function appVersion(){return typeof root.APP_VERSION==="string"?root.APP_VERSION:(root.document&&root.document.querySelector("footer")?.textContent.match(/v(\d+\.\d+\.\d+)/)?.[1]||"unknown");}
  function now(){return new Date().toISOString();}
  async function fingerprint(value){
    if(typeof value!=="string"||!value)return null;
    if(!root.crypto||!root.crypto.subtle||typeof TextEncoder==="undefined")return null;
    const digest=await root.crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");
  }
  function safeRemoteFields(state){
    return {
      status:state&&state.status||null,
      role:state&&state.role||null,
      sessionState:state&&state.sessionState||null,
      revision:Number.isInteger(state&&state.revision)?state.revision:null,
      pendingAction:state&&state.pendingAction||null,
      capabilityPresent:!!(state&&state.sessionId),
      capabilityCopyAllowed:state&&state.capabilityCopyAllowed===true,
      busy:state&&state.busy===true
    };
  }
  function deviceFacts(){
    const nav=root.navigator||{};
    const screen=root.screen||{};
    return {
      userAgent:String(nav.userAgent||""),
      platform:String(nav.platform||""),
      maxTouchPoints:Number(nav.maxTouchPoints||0),
      screenWidth:Number(screen.width||0),
      screenHeight:Number(screen.height||0)
    };
  }
  function pushRecord(record){records.push(Object.freeze(record));if(records.length>MAX_RECORDS)records.splice(0,records.length-MAX_RECORDS);render();return record;}
  function record(type,state,extra={}){
    if(!enabled)return Promise.resolve(null);
    const captured=state||remoteApi&&typeof remoteApi.getState==="function"?state||remoteApi.getState():null;
    const order=++sequence;
    const capturedSessionId=captured&&typeof captured.sessionId==="string"?captured.sessionId:null;
    queue=queue.then(async()=>pushRecord(Object.freeze({
      sequence:order,
      at:now(),
      type:String(type||"checkpoint"),
      online:root.navigator?root.navigator.onLine!==false:true,
      deviceLabel:deviceLabel||null,
      networkLabel:networkLabel||null,
      capabilityFingerprint:await fingerprint(capturedSessionId),
      ...safeRemoteFields(captured),
      ...extra
    }))).catch(()=>null);
    return queue;
  }
  function setLabels(nextDevice,nextNetwork){deviceLabel=String(nextDevice||"").trim().slice(0,80);networkLabel=String(nextNetwork||"").trim().slice(0,80);void record("labels-updated",null);return {deviceLabel,networkLabel};}
  function currentRemote(){return remoteApi&&typeof remoteApi.getState==="function"?remoteApi.getState():null;}
  function evidenceSkeleton(){return {
    schema:"career-mode-showdown.remote-joining-physical-acceptance.v1",
    generatedAt:now(),
    appVersion:appVersion(),
    runtimeRevision:revision(),
    acceptanceMode:true,
    recorderStorage:"page-memory-only",
    recorderNetworkRequests:false,
    rawCapabilityIncluded:false,
    rawAccountIdIncluded:false,
    rawDeviceIdIncluded:false,
    rawRivalryIdIncluded:false,
    device:deviceFacts(),
    deviceLabel:deviceLabel||null,
    networkLabel:networkLabel||null,
    records:records.map(item=>({...item}))
  };}
  async function getEvidence(){await queue;const state=currentRemote();if(state&&state.sessionId){await record("export-checkpoint",state);}await queue;return evidenceSkeleton();}
  async function evidenceText(){return JSON.stringify(await getEvidence(),null,2);}
  async function copyEvidence(){const text=await evidenceText();if(root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.writeText==="function"){await root.navigator.clipboard.writeText(text);return true;}return false;}
  async function downloadEvidence(){
    const text=await evidenceText();
    if(!root.document||typeof Blob==="undefined"||!root.URL||typeof root.URL.createObjectURL!=="function")return false;
    const blob=new Blob([text],{type:"application/json"});
    const url=root.URL.createObjectURL(blob);const link=root.document.createElement("a");
    link.href=url;link.download=`remote-joining-acceptance-${Date.now()}.json`;link.rel="noopener";root.document.body.appendChild(link);link.click();link.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),1000);return true;
  }
  function create(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=String(text);return element;}
  function ensureStyle(){
    if(!root.document||root.document.getElementById("remoteJoiningAcceptanceStyle"))return;
    const style=create("style");style.id="remoteJoiningAcceptanceStyle";style.textContent=`
#${PANEL_ID}{position:fixed;right:12px;bottom:12px;z-index:2147483000;width:min(390px,calc(100vw - 24px));max-height:72vh;overflow:auto;background:#0d1520;color:#f4f7fa;border:1px solid rgba(255,255,255,.22);border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.45);font:14px/1.35 system-ui,sans-serif;padding:14px}
#${PANEL_ID} h2{font-size:16px;margin:0 0 4px}#${PANEL_ID} p{margin:5px 0 10px;color:#c9d2dc}#${PANEL_ID} label{display:block;margin:7px 0 3px;font-size:12px;color:#d8e0e8}#${PANEL_ID} input{box-sizing:border-box;width:100%;padding:8px;border-radius:7px;border:1px solid #52606d;background:#111c28;color:#fff}#${PANEL_ID} .rjrAcceptanceButtons{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}#${PANEL_ID} button{border:0;border-radius:7px;padding:8px 10px;font-weight:700;cursor:pointer}#${PANEL_ID} .rjrAcceptanceState{margin-top:9px;padding:8px;border-radius:7px;background:#172332;font-family:ui-monospace,SFMono-Regular,monospace;font-size:12px;white-space:pre-wrap}#${PANEL_ID} .rjrAcceptancePrivacy{font-size:11px;color:#9eb0c1}#${PANEL_ID}[data-collapsed="true"]>*:not(.rjrAcceptanceTop){display:none}#${PANEL_ID} .rjrAcceptanceTop{display:flex;align-items:center;justify-content:space-between;gap:8px}#${PANEL_ID} .rjrAcceptanceTop button{padding:5px 8px}`;root.document.head.appendChild(style);
  }
  function render(){
    if(!enabled||!root.document)return null;
    let panel=root.document.getElementById(PANEL_ID);if(!panel)return createPanel();
    const state=currentRemote();const status=panel.querySelector(".rjrAcceptanceState");
    if(status)status.textContent=`ONLINE: ${root.navigator&&root.navigator.onLine!==false?"YES":"NO"}\nREMOTE: ${state?`${state.status||"?"} / ${state.sessionState||"?"} / rev ${Number.isInteger(state.revision)?state.revision:"—"}`:"not loaded"}\nPENDING: ${state&&state.pendingAction||"none"}\nRECORDS: ${records.length}`;
    return panel;
  }
  async function ensureRemoteJoining(){
    if(remoteApi)return remoteApi;
    if(root.CareerModeSparkRemoteJoining)remoteApi=root.CareerModeSparkRemoteJoining;
    else{
      if(typeof root.loadRuntimeStyle==="function")await root.loadRuntimeStyle("rj","css/remoteJoining.css");
      if(typeof root.loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");
      await root.loadRuntimeScript("rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining);
      remoteApi=root.CareerModeSparkRemoteJoining;
    }
    if(!remoteApi||typeof remoteApi.subscribe!=="function"||typeof remoteApi.getState!=="function")throw new Error("Private Remote Joining runtime is unavailable.");
    if(!remoteUnsubscribe)remoteUnsubscribe=remoteApi.subscribe(state=>{void record("remote-state",state);});
    void record("remote-loaded",remoteApi.getState());render();return remoteApi;
  }
  async function openRemoteJoining(){const api=await ensureRemoteJoining();api.openPanel();void record("remote-panel-opened",api.getState());return true;}
  function createPanel(){
    if(!enabled||!root.document)return null;ensureStyle();
    const panel=create("aside");panel.id=PANEL_ID;panel.dataset.collapsed="false";panel.setAttribute("aria-label","Remote Joining physical acceptance recorder");
    const top=create("div","rjrAcceptanceTop");top.append(create("h2","","RJR PHYSICAL ACCEPTANCE"));const collapse=create("button","","MINIMIZE");collapse.type="button";collapse.addEventListener("click",()=>{const next=panel.dataset.collapsed!=="true";panel.dataset.collapsed=String(next);collapse.textContent=next?"OPEN":"MINIMIZE";});top.appendChild(collapse);panel.appendChild(top);
    panel.append(create("p","","Private acceptance mode. Evidence stays in page memory until you copy or download it."));
    const deviceInput=create("input");deviceInput.placeholder="e.g. Chromebook host";deviceInput.value=deviceLabel;const networkInput=create("input");networkInput.placeholder="e.g. Home Wi-Fi / iPhone cellular";networkInput.value=networkLabel;
    panel.append(create("label","","DEVICE LABEL"),deviceInput,create("label","","NETWORK LABEL"),networkInput);
    const apply=create("button","","SAVE LABELS");apply.type="button";apply.addEventListener("click",()=>setLabels(deviceInput.value,networkInput.value));
    const open=create("button","","OPEN REMOTE JOINING");open.type="button";open.addEventListener("click",()=>{void openRemoteJoining().catch(error=>{void record("recorder-error",null,{errorCode:String(error&&error.code||"RECORDER_OPEN_FAILED")});});});
    const checkpoint=create("button","","RECORD CHECKPOINT");checkpoint.type="button";checkpoint.addEventListener("click",()=>{void record("manual-checkpoint",currentRemote());});
    const copy=create("button","","COPY EVIDENCE");copy.type="button";copy.addEventListener("click",async()=>{copy.textContent=await copyEvidence()?"COPIED":"COPY UNAVAILABLE";root.setTimeout(()=>{copy.textContent="COPY EVIDENCE";},1400);});
    const download=create("button","","DOWNLOAD JSON");download.type="button";download.addEventListener("click",()=>{void downloadEvidence();});
    const buttons=create("div","rjrAcceptanceButtons");buttons.append(apply,open,checkpoint,copy,download);panel.appendChild(buttons);
    const state=create("div","rjrAcceptanceState");panel.appendChild(state);
    panel.append(create("p","rjrAcceptancePrivacy","Recorder export never includes the raw session capability, account ID, device ID or rivalry ID. The session is correlated only by a SHA-256 fingerprint of its 256-bit capability."));
    root.document.body.appendChild(panel);render();return panel;
  }
  function onOnline(){void record("browser-online",currentRemote());}
  function onOffline(){void record("browser-offline",currentRemote());}
  function initialize(){
    if(!enabled||initialized)return enabled;initialized=true;if(!root.document)return false;
    createPanel();root.addEventListener("online",onOnline);root.addEventListener("offline",onOffline);void record("recorder-started",null,{runtimeRevision:revision()});return true;
  }
  function destroy(){if(remoteUnsubscribe){remoteUnsubscribe();remoteUnsubscribe=null;}root.removeEventListener("online",onOnline);root.removeEventListener("offline",onOffline);const panel=root.document&&root.document.getElementById(PANEL_ID);if(panel)panel.remove();initialized=false;}

  return Object.freeze({
    contractVersion:1,
    feature:"stage5i-physical-acceptance-recorder",
    enabled,
    pageMemoryOnly:true,
    rawCapabilityExported:false,
    rawAuthorityIdsExported:false,
    networkRequests:false,
    initialize,
    destroy,
    ensureRemoteJoining,
    openRemoteJoining,
    recordCheckpoint:()=>record("manual-checkpoint",currentRemote()),
    setLabels,
    getEvidence,
    copyEvidence,
    downloadEvidence,
    getState:()=>Object.freeze({enabled,initialized,records:records.length,deviceLabel,networkLabel,remoteLoaded:!!remoteApi})
  });
});
