(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedShowdownSetup=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PANEL_ID="productionSharedSetupOverlay";
  const CANONICAL_KEYS=Object.freeze([
    "careerModeShowdown.saveLibrary",
    "careerModeShowdown.legacyShowdowns",
    "careerModeShowdown.preferences"
  ]);
  const LENGTHS=Object.freeze([1,3,5,10]);
  const DEPENDENCIES=Object.freeze([
    ["production-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime],
    ["connected-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount],
    ["private-pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing],
    ["connected-rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry],
    ["remote-joining","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining],
    ["shared-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup],
    ["shared-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog],
    ["spark-shared-setup","js/sparkSharedShowdownSetup.js",()=>root.CareerModeSparkSharedShowdownSetup]
  ]);
  const scriptPromises=new Map();
  const listeners=new Set();
  let state=freeze({
    status:"idle",open:false,busy:false,ready:false,revision:0,phase:null,
    rivalryId:null,sessionId:null,accountId:null,deviceId:null,managerRole:null,
    setup:null,message:"Shared Setup is locked until the exact paired rivalry has an ACTIVE private session."
  });

  function freeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);Object.values(value).forEach(freeze);return value;
  }
  function fail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function revision(){
    if(!root.document)return "1.9.1-r2";
    const meta=root.document.querySelector('meta[name="app-asset-revision"]');
    return meta&&meta.content?meta.content.trim()||"1.9.1-r2":"1.9.1-r2";
  }
  function versionedUrl(path){
    if(!root.document||!root.location)return path;
    const url=new URL(path,root.document.baseURI||root.location.href);url.searchParams.set("v",revision());return url.href;
  }
  function loadScript(key,path,ready){
    const current=ready();if(current)return Promise.resolve(current);
    if(scriptPromises.has(key))return scriptPromises.get(key);
    if(!root.document)return Promise.reject(fail("SHARED_SETUP_DEPENDENCY_UNAVAILABLE"));
    const promise=new Promise((resolve,reject)=>{
      const script=root.document.createElement("script");script.src=versionedUrl(path);script.async=false;script.dataset.sharedSetupDependency=key;
      script.addEventListener("load",()=>{const api=ready();api?resolve(api):reject(Object.assign(new Error(`${path} did not expose its expected API.`),{code:"SHARED_SETUP_DEPENDENCY_UNAVAILABLE"}));},{once:true});
      script.addEventListener("error",()=>reject(Object.assign(new Error(`Unable to load ${path}.`),{code:"SHARED_SETUP_DEPENDENCY_UNAVAILABLE"})),{once:true});
      root.document.head.appendChild(script);
    }).finally(()=>scriptPromises.delete(key));
    scriptPromises.set(key,promise);return promise;
  }
  async function dependencies(){
    const resolved={};
    for(const [key,path,ready] of DEPENDENCIES)resolved[key]=await loadScript(key,path,ready);
    return Object.freeze(resolved);
  }
  function setState(next){
    state=freeze({...state,...next});for(const listener of listeners){try{listener(state);}catch(_error){}}render();return state;
  }
  function storageSnapshot(){
    if(typeof root.captureCareerModeRawBackupInputs!=="function")return null;
    const raw=root.captureCareerModeRawBackupInputs();
    return {
      [CANONICAL_KEYS[0]]:raw.saveLibrary,
      [CANONICAL_KEYS[1]]:raw.legacyShowdowns,
      [CANONICAL_KEYS[2]]:raw.preferences
    };
  }
  function assertStorageUnchanged(before){
    if(!before)return true;
    const after=storageSnapshot();
    if(!after)fail("SHARED_SETUP_STORAGE_AUTHORITY_UNAVAILABLE","Canonical storage authority became unavailable during Shared Setup.");
    for(const key of CANONICAL_KEYS){if(after[key]!==before[key])fail("SHARED_SETUP_LOCAL_SAVE_MUTATION","Shared Setup must never mutate canonical local saves.");}
    return true;
  }
  function randomOperationId(){
    if(!root.crypto||typeof root.crypto.getRandomValues!=="function")fail("SHARED_SETUP_CRYPTO_UNAVAILABLE","Secure browser randomness is unavailable.");
    const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);
    return `setup_op_${Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("")}`;
  }
  function safeError(error,fallback){return error&&typeof error.code==="string"?error.code:fallback;}
  function title(value){return String(value||"").replace(/_/g," ").replace(/\b\w/g,char=>char.toUpperCase());}

  async function resolveContext(){
    const deps=await dependencies();
    const runtime=deps["production-runtime"],account=deps["connected-account"],pairing=deps["private-pairing"],rivalry=deps["connected-rivalry"],remote=deps["remote-joining"],adapter=deps["spark-shared-setup"];
    if(!runtime||typeof runtime.ensureAccountServices!=="function")fail("SHARED_SETUP_RUNTIME_UNAVAILABLE","Private Firebase runtime is unavailable.");
    if(!account||typeof account.initialize!=="function"||typeof account.getState!=="function")fail("SHARED_SETUP_ACCOUNT_UNAVAILABLE","Connected Account is unavailable.");
    await account.initialize();const accountState=account.getState();
    if(!accountState||accountState.connected!==true||!accountState.accountId)fail("SHARED_SETUP_AUTH_REQUIRED","Sign in with Google before Shared Setup.");
    if(!pairing||typeof pairing.initialize!=="function"||typeof pairing.getState!=="function")fail("SHARED_SETUP_DEVICE_UNAVAILABLE","Registered browser authority is unavailable.");
    await pairing.initialize();const pairingState=pairing.getState();
    if(!pairingState||pairingState.registered!==true||!pairingState.deviceId)fail("SHARED_SETUP_DEVICE_REQUIRED","Register this browser before Shared Setup.");
    if(!rivalry||typeof rivalry.initialize!=="function"||typeof rivalry.getState!=="function")fail("SHARED_SETUP_RIVALRY_UNAVAILABLE","Connected Rivalry authority is unavailable.");
    await rivalry.initialize();const rivalryState=rivalry.getState();
    if(!rivalryState||rivalryState.attached!==true||!rivalryState.rivalryId||!rivalryState.binding)fail("SHARED_SETUP_RIVALRY_REQUIRED","Attach the exact paired Connected Rivalry before Shared Setup.");
    const remoteState=remote&&typeof remote.getState==="function"?remote.getState():null;
    if(!remoteState||remoteState.sessionState!=="active"||!remoteState.sessionId||remoteState.pendingAction)fail("SHARED_SETUP_ACTIVE_SESSION_REQUIRED","An exact ACTIVE private session is required before league or club selection.");
    if(Number.isFinite(remoteState.expiresAtEpochMs)&&Date.now()>=remoteState.expiresAtEpochMs)fail("SHARED_SETUP_ACTIVE_SESSION_REQUIRED","The private session has expired. Open a fresh ACTIVE session for this rivalry to resume Shared Setup.");
    if(remoteState.rivalryId!==rivalryState.rivalryId||remoteState.accountId!==accountState.accountId||remoteState.deviceId!==pairingState.deviceId)fail("SHARED_SETUP_AUTHORITY_MISMATCH","The ACTIVE private session no longer matches the exact account, browser and Connected Rivalry authority.");
    if(rivalryState.accountId&&rivalryState.accountId!==accountState.accountId)fail("SHARED_SETUP_AUTHORITY_MISMATCH");
    if(rivalryState.deviceId&&rivalryState.deviceId!==pairingState.deviceId)fail("SHARED_SETUP_AUTHORITY_MISMATCH");
    const managerRole=rivalryState.binding.managerRole;
    if(managerRole!=="playerOne"&&managerRole!=="playerTwo")fail("SHARED_SETUP_BINDING_INVALID","The attached rivalry does not expose a valid manager role.");
    const services=await runtime.ensureAccountServices();
    if(!services||services.ok!==true||!services.auth||!services.firestore||!services.firestoreSdk)fail("SHARED_SETUP_PROVIDER_UNAVAILABLE","Private Firebase services are unavailable.");
    const user=services.auth.currentUser;
    if(!user||user.uid!==accountState.accountId)fail("SHARED_SETUP_AUTH_MISMATCH","The current Google account no longer matches Connected Account authority.");
    if(!adapter||typeof adapter.read!=="function"||typeof adapter.mutate!=="function")fail("SHARED_SETUP_PROVIDER_UNAVAILABLE","Shared Setup transaction authority is unavailable.");
    return Object.freeze({adapter,services,user,rivalryId:rivalryState.rivalryId,sessionId:remoteState.sessionId,accountId:user.uid,deviceId:pairingState.deviceId,managerRole,remoteRole:remoteState.role});
  }
  function providerOptions(context){
    return {firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,user:context.user,rivalryId:context.rivalryId,sessionId:context.sessionId,deviceId:context.deviceId,nowEpochMs:Date.now(),cryptoImpl:root.crypto};
  }
  function accept(result,context,message){
    if(!result||result.ok!==true)fail(result&&result.code||"SHARED_SETUP_PROVIDER_FAILED");
    return setState({status:"ready",busy:false,ready:true,revision:result.revision||0,phase:result.state&&result.state.phase||null,rivalryId:context.rivalryId,sessionId:context.sessionId,accountId:context.accountId,deviceId:context.deviceId,managerRole:context.managerRole,setup:result.state||null,message});
  }
  async function refresh(){
    const before=storageSnapshot();setState({status:"reading",busy:true,message:"Reading the authoritative Shared Setup for this exact ACTIVE session…"});
    try{
      const context=await resolveContext();const result=await context.adapter.read(providerOptions(context));assertStorageUnchanged(before);
      if(!result||result.ok!==true)fail(result&&result.code||"SHARED_SETUP_READ_FAILED");
      return accept(result,context,result.status==="empty"?"The paired managers have reached an empty Shared Setup. The session host may open it now.":"Authoritative Shared Setup resumed without reset or redraw.");
    }catch(error){
      try{assertStorageUnchanged(before);}catch(storageError){error=storageError;}
      return setState({status:"locked",busy:false,ready:false,message:error&&error.message&&error.message!==error.code?error.message:String(safeError(error,"SHARED_SETUP_UNAVAILABLE")).replace(/_/g," ")});
    }
  }
  async function mutate(type,extra={}){
    if(state.busy)return Object.freeze({ok:false,code:"SHARED_SETUP_BUSY"});
    const before=storageSnapshot();setState({status:`writing-${type}`,busy:true,message:"Submitting one authoritative Shared Setup transition…"});
    try{
      const context=await resolveContext();
      const current=await context.adapter.read(providerOptions(context));
      if(!current||current.ok!==true)fail(current&&current.code||"SHARED_SETUP_READ_FAILED");
      const result=await context.adapter.mutate({...providerOptions(context),type,operationId:randomOperationId(),baseRevision:current.revision||0,...extra});
      assertStorageUnchanged(before);
      if(!result||result.ok!==true)fail(result&&result.code||"SHARED_SETUP_MUTATION_FAILED");
      return accept(result,context,result.replayed?"The original Shared Setup operation was recovered without a duplicate draw.":"Both managers can now read the same authoritative Shared Setup state.");
    }catch(error){
      try{assertStorageUnchanged(before);}catch(storageError){error=storageError;}
      setState({status:"error",busy:false,message:String(safeError(error,"SHARED_SETUP_MUTATION_FAILED")).replace(/_/g," ")});
      return Object.freeze({ok:false,code:safeError(error,"SHARED_SETUP_MUTATION_FAILED")});
    }
  }
  function create(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=String(text);return element;}
  function action(label,handler,disabled=false){const button=create("button","compactButton",label);button.type="button";button.disabled=disabled;button.addEventListener("click",handler);return button;}
  function renderSetup(body){
    const setup=state.setup;
    const summary=create("section","remoteJoiningCurrent");summary.append(create("span","remoteJoiningEyebrow","AUTHORITATIVE SHARED SETUP"));
    if(!setup){
      summary.append(create("strong","remoteJoiningState","EMPTY · REV 0"),create("p","remoteJoiningMeta","Pairing and the exact ACTIVE session are proven. No league or club has been drawn yet."));
      const actions=create("div","remoteJoiningActions");
      if(state.ready)actions.append(action("OPEN SHARED SETUP",()=>void mutate("open"),state.busy));
      actions.append(action("REFRESH",()=>void refresh(),state.busy));summary.append(actions);body.append(summary);return;
    }
    summary.append(create("strong","remoteJoiningState",`${setup.phase} · REV ${setup.revision}`));
    const facts=create("div","settingsInfoGrid");
    const rows=[
      ["COORDINATOR",title(setup.coordinatorRole)],
      ["LEAGUE",setup.leagueId?title(setup.leagueId):"Not drawn"],
      ["PLAYER ONE CLUB",setup.clubs?setup.clubs.playerOne:"Not drawn"],
      ["PLAYER TWO CLUB",setup.clubs?setup.clubs.playerTwo:"Not drawn"],
      ["SEASONS",setup.totalSeasons||"Not committed"],
      ["CONFIRMED",setup.confirmedRoles&&setup.confirmedRoles.length?setup.confirmedRoles.map(title).join(" + "):"None"]
    ];
    for(const [label,value] of rows){const row=create("div","settingsInfoRow");row.append(create("span","",label),create("strong","",value));facts.append(row);}summary.append(facts);
    const actions=create("div","remoteJoiningActions");
    const coordinator=state.managerRole===setup.coordinatorRole;
    if(setup.phase==="SHARED_SETUP_OPEN"&&coordinator)actions.append(action("DRAW AUTHORITATIVE LEAGUE",()=>void mutate("commit-league"),state.busy));
    if(setup.phase==="LEAGUE_WHEEL_COMMITTED"&&coordinator)actions.append(action("DRAW DISTINCT CLUBS",()=>void mutate("commit-clubs"),state.busy));
    if(setup.phase==="CLUB_ASSIGNMENTS_COMMITTED"&&coordinator){
      for(const seasons of LENGTHS)actions.append(action(`${seasons} SEASON${seasons===1?"":"S"}`,()=>void mutate("commit-length",{totalSeasons:seasons}),state.busy));
    }
    if(setup.phase==="SEASON_LENGTH_COMMITTED"&&state.managerRole&&!setup.confirmedRoles.includes(state.managerRole))actions.append(action("CONFIRM IDENTICAL SETUP",()=>void mutate("confirm"),state.busy));
    actions.append(action("REFRESH",()=>void refresh(),state.busy));summary.append(actions);body.append(summary);
  }
  function render(){
    if(!root.document)return null;const overlay=root.document.getElementById(PANEL_ID);if(!overlay)return null;
    const body=overlay.querySelector(".remoteJoiningBody");if(!body)return overlay;body.replaceChildren();
    body.append(create("span","remoteJoiningEyebrow","PAIRED FIRST · ACTIVE SESSION ONLY"),create("h2","","SHARED SHOWDOWN SETUP"),create("p","","One authoritative league, two distinct permanent clubs from that league, and one 1 / 3 / 5 / 10 season length. A fresh ACTIVE session for the same rivalry resumes this state and never redraws it."));
    if(state.ready)renderSetup(body);else{
      const locked=create("section","remoteJoiningCurrent");locked.append(create("strong","remoteJoiningState","LOCKED"),create("p","remoteJoiningMeta",state.message));locked.append(action("CHECK ACTIVE SESSION",()=>void refresh(),state.busy));body.append(locked);
    }
    const note=create("p","remoteJoiningStatus",state.message);note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.append(note);return overlay;
  }
  async function openPanel(){
    if(!root.document)return false;let overlay=root.document.getElementById(PANEL_ID);
    if(!overlay){overlay=create("div","remoteJoiningOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Shared Showdown Setup");const shell=create("div","remoteJoiningShell");const header=create("div","remoteJoiningHeader");header.append(create("strong","","CAREER MODE SHOWDOWN // 17"));const dismiss=create("button","remoteJoiningDismiss","×");dismiss.type="button";dismiss.setAttribute("aria-label","Close Shared Showdown Setup");dismiss.addEventListener("click",closePanel);header.append(dismiss);const body=create("div","remoteJoiningBody");shell.append(header,body);overlay.append(shell);root.document.body.append(overlay);}
    overlay.classList.remove("hidden");setState({open:true});await refresh();const focus=overlay.querySelector("button");if(focus)focus();return true;
  }
  function closePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay)overlay.classList.add("hidden");state=freeze({...state,open:false});return true;}
  function subscribe(listener){if(typeof listener!=="function")return()=>{};listeners.add(listener);return()=>listeners.delete(listener);}

  return freeze({
    contractVersion:1,
    feature:"ssjr-production-paired-first-shared-setup",
    productionEnabled:true,
    productionRulesRequired:true,
    providerPath:"rivalries/{rivalryId}/sharedSetup/authoritative",
    pairingRequired:true,
    exactActiveSessionRequired:true,
    freshActiveSessionResumes:true,
    deterministicRepositoryCatalog:true,
    directLeagueClubInput:false,
    canonicalStorageMutation:false,
    canonicalStorageKeys:CANONICAL_KEYS,
    billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,appCheckEnforcementRequired:false,persistentFirestoreCache:false,
    refresh,mutate,openPanel,closePanel,subscribe,getState:()=>state
  });
});