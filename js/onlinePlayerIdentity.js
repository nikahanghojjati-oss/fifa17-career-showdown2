(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeOnlinePlayerIdentity=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const ROLE_DB_NAME="careerModeShowdown.onlinePlayerIdentity";
  const ROLE_DB_VERSION=1;
  const ROLE_STORE="identity";
  const ROLE_KEY="current";
  const PRIVATE_DEVICE_DB_NAME="careerModeShowdown.privateDevice";
  const PRIVATE_DEVICE_DB_VERSION=1;
  const PRIVATE_DEVICE_STORE="identity";
  const PRIVATE_DEVICE_KEY="primary";
  const OVERLAY_ID="onlinePlayerIdentityOverlay";
  const BADGE_ID="onlinePlayerIdentityBadge";
  const SETTINGS_PANEL_ID="onlinePlayerIdentitySettingsPanel";
  const MANAGERS=Object.freeze({nik:Object.freeze({id:"nik",label:"Nik",role:"playerOne"}),daniel:Object.freeze({id:"daniel",label:"Daniel",role:"playerTwo"})});
  const INTERNAL_SETTINGS_PANEL_IDS=Object.freeze(["sparkConnectedAccountPanel","sparkPrivatePairingPanel","sparkConnectedRivalryPanel"]);
  let state=Object.freeze({status:"idle",initialized:false,busy:false,online:root.navigator?root.navigator.onLine!==false:true,accountId:null,managerId:null,managerLabel:null,deviceId:null,registered:false,message:"Preparing online identity…"});
  let initPromise=null;
  let settingsObserver=null;
  const listeners=new Set();

  function freeze(value){if(!value||typeof value!=="object"||Object.isFrozen(value))return value;Object.freeze(value);Object.values(value).forEach(freeze);return value;}
  function setState(next){state=freeze({...state,...next});for(const listener of listeners){try{listener(state);}catch(_error){}}render();return state;}
  function manager(value){const key=String(value||"").trim().toLowerCase();return MANAGERS[key]||null;}
  function openDatabase(name,version,storeName){
    return new Promise((resolve,reject)=>{
      if(!root.indexedDB||typeof root.indexedDB.open!=="function"){reject(new Error("IndexedDB is unavailable."));return;}
      const request=root.indexedDB.open(name,version);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(storeName))request.result.createObjectStore(storeName);};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error("Device identity storage could not be opened."));
      request.onblocked=()=>reject(new Error("Device identity storage is blocked by another tab."));
    });
  }
  async function readRole(){
    let db;try{db=await openDatabase(ROLE_DB_NAME,ROLE_DB_VERSION,ROLE_STORE);return await new Promise((resolve,reject)=>{const tx=db.transaction(ROLE_STORE,"readonly"),request=tx.objectStore(ROLE_STORE).get(ROLE_KEY);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error||new Error("Player identity could not be read."));});}finally{if(db)db.close();}
  }
  async function writeRole(accountId,managerId){
    const selected=manager(managerId);if(!selected)throw new Error("Choose Nik or Daniel.");
    const record={schemaVersion:1,accountId:String(accountId||""),managerId:selected.id,updatedAtEpochMs:Date.now()};
    let db;try{db=await openDatabase(ROLE_DB_NAME,ROLE_DB_VERSION,ROLE_STORE);await new Promise((resolve,reject)=>{const tx=db.transaction(ROLE_STORE,"readwrite");tx.objectStore(ROLE_STORE).put(record,ROLE_KEY);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error("Player identity could not be saved."));tx.onabort=()=>reject(tx.error||new Error("Player identity save was aborted."));});return record;}finally{if(db)db.close();}
  }
  async function clearRole(){
    let db;try{db=await openDatabase(ROLE_DB_NAME,ROLE_DB_VERSION,ROLE_STORE);await new Promise((resolve,reject)=>{const tx=db.transaction(ROLE_STORE,"readwrite");tx.objectStore(ROLE_STORE).delete(ROLE_KEY);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error("Player identity could not be forgotten."));tx.onabort=()=>reject(tx.error||new Error("Player identity reset was aborted."));});}finally{if(db)db.close();}
  }
  async function clearPrivateDeviceIdentity(){
    let db;try{db=await openDatabase(PRIVATE_DEVICE_DB_NAME,PRIVATE_DEVICE_DB_VERSION,PRIVATE_DEVICE_STORE);await new Promise((resolve,reject)=>{const tx=db.transaction(PRIVATE_DEVICE_STORE,"readwrite");tx.objectStore(PRIVATE_DEVICE_STORE).delete(PRIVATE_DEVICE_KEY);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error("Private device identity could not be cleared."));tx.onabort=()=>reject(tx.error||new Error("Private device reset was aborted."));});}finally{if(db)db.close();}
  }
  function versioned(path){const revision=root.document?.querySelector('meta[name="app-asset-revision"]')?.content||"1.9.1-r20";const url=new URL(path,root.document?.baseURI||root.location?.href);url.searchParams.set("v",revision);return url.href;}
  function loadScript(key,path,ready){
    if(ready())return Promise.resolve(ready());
    if(typeof root.loadRuntimeScript==="function")return root.loadRuntimeScript(`online-${key}`,path,ready).then(()=>ready());
    return new Promise((resolve,reject)=>{const script=root.document.createElement("script");script.src=versioned(path);script.async=false;script.addEventListener("load",()=>ready()?resolve(ready()):reject(new Error(`${path} did not expose its API.`)),{once:true});script.addEventListener("error",()=>reject(new Error(`Unable to load ${path}.`)),{once:true});root.document.head.appendChild(script);});
  }
  async function dependencies(){
    await loadScript("production-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    await loadScript("connected-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount);
    await loadScript("private-pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing);
    return {runtime:root.CareerModeProductionFirebaseRuntime,account:root.CareerModeSparkConnectedAccount,pairing:root.CareerModeSparkPrivatePairing};
  }
  function ensureOverlay(){
    if(!root.document)return null;
    let overlay=root.document.getElementById(OVERLAY_ID);if(overlay)return overlay;
    overlay=root.document.createElement("div");overlay.id=OVERLAY_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-labelledby","onlinePlayerIdentityTitle");
    Object.assign(overlay.style,{position:"fixed",inset:"0",zIndex:"10000",display:"grid",placeItems:"center",padding:"20px",background:"rgba(3,8,15,.92)",backdropFilter:"blur(10px)"});
    root.document.body.appendChild(overlay);return overlay;
  }
  function button(text,handler){const element=root.document.createElement("button");element.type="button";element.className="menuButton";element.textContent=text;element.disabled=state.busy;element.addEventListener("click",handler);return element;}
  function renderOverlay(){
    const overlay=ensureOverlay();if(!overlay)return;
    if(state.status==="ready"){overlay.remove();return;}
    overlay.replaceChildren();
    const card=root.document.createElement("section");Object.assign(card.style,{width:"min(560px,100%)",padding:"28px",background:"#111820",border:"1px solid rgba(255,255,255,.18)",boxShadow:"0 24px 80px rgba(0,0,0,.45)"});
    const eyebrow=root.document.createElement("p");eyebrow.textContent="ONLINE SHOWDOWN";eyebrow.style.letterSpacing=".14em";
    const title=root.document.createElement("h2");title.id="onlinePlayerIdentityTitle";
    const copy=root.document.createElement("p");copy.textContent=state.message;
    card.append(eyebrow,title,copy);
    if(state.online===false){title.textContent="CONNECTION REQUIRED";card.append(button("TRY AGAIN",()=>{void initialize(true);}));}
    else if(state.status==="signed-out"){title.textContent="SIGN IN";card.append(button("SIGN IN WITH GOOGLE",()=>{void signIn();}));}
    else if(state.status==="choose-manager"){title.textContent="WHO ARE YOU?";const actions=root.document.createElement("div");actions.style.display="grid";actions.style.gridTemplateColumns="1fr 1fr";actions.style.gap="12px";actions.append(button("I'M NIK",()=>{void chooseManager("nik");}),button("I'M DANIEL",()=>{void chooseManager("daniel");}));card.append(actions);}
    else{title.textContent="CONNECTING";}
    overlay.appendChild(card);
  }
  function ensureBadge(){
    if(!root.document||state.status!=="ready")return null;
    let badge=root.document.getElementById(BADGE_ID);if(!badge){badge=root.document.createElement("button");badge.id=BADGE_ID;badge.type="button";badge.style.marginLeft="auto";badge.style.marginRight="12px";badge.style.padding="8px 12px";badge.style.border="1px solid rgba(255,255,255,.25)";badge.style.background="rgba(0,0,0,.25)";badge.style.color="inherit";badge.style.font="inherit";const header=root.document.getElementById("topHeader");const season=root.document.getElementById("seasonIndicator");if(header)header.insertBefore(badge,season||null);badge.addEventListener("click",()=>{const settings=root.document.getElementById("settingsButton");if(settings)settings.click();});}
    badge.textContent=`WELCOME ${String(state.managerLabel||"").toUpperCase()}`;badge.setAttribute("aria-label",`Welcome ${state.managerLabel}. Open account and device settings.`);return badge;
  }
  function hideInternalSettingsPanels(){for(const id of INTERNAL_SETTINGS_PANEL_IDS){const panel=root.document?.getElementById(id);if(panel)panel.hidden=true;}}
  function renderSettingsPanel(){
    if(!root.document)return null;const content=root.document.getElementById("settingsContent"),overlay=root.document.getElementById("settingsOverlay");if(!content||!overlay||overlay.classList.contains("hidden"))return null;
    hideInternalSettingsPanels();let panel=root.document.getElementById(SETTINGS_PANEL_ID);if(!panel){panel=root.document.createElement("section");panel.id=SETTINGS_PANEL_ID;panel.className="settingsPanel settingsConnectedAccountPanel";content.insertBefore(panel,content.firstChild||null);}panel.replaceChildren();
    const heading=root.document.createElement("div");heading.className="settingsPanelHeading";heading.innerHTML=`<span class="settingsPanelEyebrow">THIS DEVICE</span><h3>${state.managerLabel?`WELCOME ${state.managerLabel.toUpperCase()}`:"ONLINE ACCOUNT"}</h3><p>This browser is remembered for the Nik/Daniel online Showdown. Forget it when this is only a temporary test device.</p>`;
    const info=root.document.createElement("div");info.className="settingsInfoGrid";[["PLAYER",state.managerLabel||"Not selected"],["DEVICE",state.registered?"Registered":"Not registered"],["MODE","Online only"],["INFRASTRUCTURE","Firebase Spark · billing off"]].forEach(([label,value])=>{const row=root.document.createElement("div");row.className="settingsInfoRow";const left=root.document.createElement("span"),right=root.document.createElement("strong");left.textContent=label;right.textContent=value;row.append(left,right);info.appendChild(row);});
    const actions=root.document.createElement("div");actions.className="settingsOfflineActions settingsConnectedAccountActions";if(state.registered)actions.append(button("FORGET THIS DEVICE",()=>{void forgetThisDevice();}));
    panel.append(heading,info,actions);return panel;
  }
  function observeSettings(){if(settingsObserver||!root.document||typeof root.MutationObserver!=="function")return;settingsObserver=new root.MutationObserver(()=>{renderSettingsPanel();hideInternalSettingsPanels();});settingsObserver.observe(root.document.body,{childList:true,subtree:true});}
  function render(){renderOverlay();if(state.status==="ready")ensureBadge();else root.document?.getElementById(BADGE_ID)?.remove();renderSettingsPanel();}
  async function resolveSignedIn(){
    const deps=await dependencies();await deps.account.initialize();const accountState=deps.account.getState();if(!accountState?.connected||!accountState.accountId)return {deps,accountState:null};await deps.pairing.initialize();const pairingState=deps.pairing.getState();return {deps,accountState,pairingState};
  }
  async function initialize(force=false){
    if(initPromise&&!force)return initPromise;
    initPromise=(async()=>{
      const online=!root.navigator||root.navigator.onLine!==false;if(!online)return setState({status:"offline",initialized:true,busy:false,online:false,accountId:null,managerId:null,managerLabel:null,registered:false,message:"Career Mode Showdown is online-only. Reconnect to continue."});
      setState({status:"connecting",busy:true,online:true,message:"Connecting your private online Showdown…"});
      try{
        const {accountState,pairingState}=await resolveSignedIn();
        if(!accountState)return setState({status:"signed-out",initialized:true,busy:false,online:true,accountId:null,managerId:null,managerLabel:null,deviceId:null,registered:false,message:"Sign in with Google to continue. This is the only normal play mode."});
        if(!pairingState?.registered)return setState({status:"device-error",initialized:true,busy:false,online:true,accountId:accountState.accountId,managerId:null,managerLabel:null,deviceId:pairingState?.deviceId||null,registered:false,message:pairingState?.message||"This browser could not be registered."});
        const stored=await readRole();const selected=stored&&stored.accountId===accountState.accountId?manager(stored.managerId):null;
        if(!selected)return setState({status:"choose-manager",initialized:true,busy:false,online:true,accountId:accountState.accountId,managerId:null,managerLabel:null,deviceId:pairingState.deviceId,registered:true,message:"Choose this device's player identity once. You can forget the device later, including after a temporary Daniel test."});
        observeSettings();return setState({status:"ready",initialized:true,busy:false,online:true,accountId:accountState.accountId,managerId:selected.id,managerLabel:selected.label,deviceId:pairingState.deviceId,registered:true,message:`Welcome ${selected.label}.`});
      }catch(error){return setState({status:"error",initialized:true,busy:false,online:true,message:error?.message||"Online identity could not be prepared."});}
    })().finally(()=>{initPromise=null;});return initPromise;
  }
  async function signIn(){
    setState({status:"signing-in",busy:true,message:"Opening Google sign-in…"});try{const deps=await dependencies();await deps.account.signIn();return initialize(true);}catch(error){return setState({status:"signed-out",busy:false,message:error?.message||"Google sign-in could not be completed."});}
  }
  async function chooseManager(managerId){
    const selected=manager(managerId);if(!selected||!state.accountId)return state;setState({status:"saving-manager",busy:true,message:`Remembering this device as ${selected.label}…`});try{await writeRole(state.accountId,selected.id);observeSettings();return setState({status:"ready",busy:false,managerId:selected.id,managerLabel:selected.label,message:`Welcome ${selected.label}.`});}catch(error){return setState({status:"choose-manager",busy:false,message:error?.message||"Player identity could not be remembered."});}
  }
  async function forgetThisDevice(){
    if(!state.accountId||!state.registered||state.busy)return state;setState({status:"forgetting",busy:true,message:"Forgetting this device…"});
    try{
      const {runtime,account,pairing}=await dependencies();const services=await runtime.ensureAccountServices();const user=services?.auth?.currentUser;if(!services?.ok||!user||user.uid!==state.accountId)throw new Error("The signed-in account is no longer available.");const identity=await pairing.getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});const result=await pairing.revokeDevice({user,firestore:services.firestore,firebaseSdk:services.firestoreSdk,identity,targetDeviceId:identity.deviceId,cryptoImpl:root.crypto});if(!result?.ok)throw new Error(result?.message||"This device could not be revoked.");await clearRole();await clearPrivateDeviceIdentity();await account.signOut();root.document?.getElementById(BADGE_ID)?.remove();return setState({status:"signed-out",initialized:true,busy:false,online:true,accountId:null,managerId:null,managerLabel:null,deviceId:null,registered:false,message:"This device was forgotten. Sign in again whenever you want to register it as Nik or Daniel."});
    }catch(error){return setState({status:"ready",busy:false,message:error?.message||"This device could not be forgotten safely."});}
  }
  function subscribe(listener){if(typeof listener!=="function")return()=>{};listeners.add(listener);return()=>listeners.delete(listener);}
  if(root.addEventListener){root.addEventListener("online",()=>{if(state.status==="offline")void initialize(true);});root.addEventListener("offline",()=>setState({status:"offline",busy:false,online:false,message:"Career Mode Showdown is online-only. Reconnect to continue."}));}
  return freeze({contractVersion:1,mode:"online-only",managers:MANAGERS,initialize,signIn,chooseManager,forgetThisDevice,readRole,clearRole,subscribe,getState:()=>state});
});