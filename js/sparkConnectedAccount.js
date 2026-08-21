(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkConnectedAccount=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const BOOTSTRAP_PATH="js/sparkAccountBootstrap.js";
  const SETTINGS_PANEL_ID="sparkConnectedAccountPanel";
  const SETTINGS_CONTENT_ID="settingsContent";
  const SETTINGS_OVERLAY_ID="settingsOverlay";

  let state=Object.freeze({
    status:"idle",
    initialized:false,
    signedIn:false,
    connected:false,
    busy:false,
    accountId:null,
    displayName:null,
    email:null,
    accountStatus:null,
    message:"Connected account is optional. Local Career Mode remains available without signing in."
  });
  let services=null;
  let initializePromise=null;
  let bootstrapScriptPromise=null;
  let authUnsubscribe=null;
  let bootstrapPromiseByUid=new Map();
  let settingsObserver=null;
  const listeners=new Set();

  function freeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

  function getRevision(){
    if(!root.document)return "1.5.0-r1";
    const meta=root.document.querySelector('meta[name="app-asset-revision"]');
    return meta&&meta.content?meta.content.trim()||"1.5.0-r1":"1.5.0-r1";
  }

  function versionedLocalUrl(path){
    if(!root.document||!root.location)return path;
    const url=new URL(path,root.document.baseURI||root.location.href);
    url.searchParams.set("v",getRevision());
    return url.href;
  }

  function setState(next){
    state=freeze({...state,...next});
    for(const listener of listeners){
      try{listener(state);}catch(_error){}
    }
    renderSettingsPanel();
    return state;
  }

  function publicIdentity(user){
    if(!user||typeof user.uid!=="string"||!user.uid.trim())return null;
    return {
      accountId:user.uid.trim(),
      displayName:typeof user.displayName==="string"&&user.displayName.trim()?user.displayName.trim():null,
      email:typeof user.email==="string"&&user.email.trim()?user.email.trim():null
    };
  }

  function localModeMessage(prefix){
    return `${prefix} Local Career Mode and local saves remain available.`;
  }

  function loadBootstrapScript(){
    if(root.CareerModeSparkAccountBootstrap)return Promise.resolve(root.CareerModeSparkAccountBootstrap);
    if(bootstrapScriptPromise)return bootstrapScriptPromise;
    if(!root.document)return Promise.resolve(null);
    bootstrapScriptPromise=new Promise(resolve=>{
      const script=root.document.createElement("script");
      script.src=versionedLocalUrl(BOOTSTRAP_PATH);
      script.async=false;
      script.dataset.sparkAccountBootstrap="true";
      script.addEventListener("load",()=>resolve(root.CareerModeSparkAccountBootstrap||null),{once:true});
      script.addEventListener("error",()=>resolve(null),{once:true});
      root.document.head.appendChild(script);
    }).finally(()=>{bootstrapScriptPromise=null;});
    return bootstrapScriptPromise;
  }

  async function bootstrapUser(user){
    const identity=publicIdentity(user);
    if(!identity)return {ok:false,code:"SPARK_ACCOUNT_AUTH_REQUIRED"};
    if(bootstrapPromiseByUid.has(identity.accountId))return bootstrapPromiseByUid.get(identity.accountId);
    const promise=(async()=>{
      const bootstrap=root.CareerModeSparkAccountBootstrap||await loadBootstrapScript();
      if(!bootstrap||typeof bootstrap.bootstrap!=="function")return {ok:false,code:"SPARK_ACCOUNT_BOOTSTRAP_UNAVAILABLE"};
      return bootstrap.bootstrap({
        user,
        firestore:services.firestore,
        firebaseSdk:services.firestoreSdk,
        cryptoImpl:root.crypto
      });
    })().finally(()=>{bootstrapPromiseByUid.delete(identity.accountId);});
    bootstrapPromiseByUid.set(identity.accountId,promise);
    return promise;
  }

  async function activateUser(user){
    const identity=publicIdentity(user);
    if(!identity){
      setState({
        status:"signed-out",
        initialized:true,
        signedIn:false,
        connected:false,
        busy:false,
        accountId:null,
        displayName:null,
        email:null,
        accountStatus:null,
        message:"Signed out. Local Career Mode continues normally."
      });
      return state;
    }

    setState({
      status:"bootstrapping",
      initialized:true,
      signedIn:true,
      connected:false,
      busy:true,
      accountId:identity.accountId,
      displayName:identity.displayName,
      email:identity.email,
      accountStatus:null,
      message:"Finishing private account setup…"
    });

    const result=await bootstrapUser(user);
    if(!result||result.ok!==true){
      return setState({
        status:"bootstrap-error",
        initialized:true,
        signedIn:true,
        connected:false,
        busy:false,
        accountStatus:null,
        message:localModeMessage("Signed in, but private account setup could not be completed.")
      });
    }

    const accountStatus=result.status||"active";
    const connected=accountStatus==="active";
    return setState({
      status:connected?"ready":"account-unavailable",
      initialized:true,
      signedIn:true,
      connected,
      busy:false,
      accountStatus,
      message:connected
        ? "Private account is ready. Remote Joining is still locked until later pairing and Connected Rivalry stages are proven."
        : localModeMessage(`This private account is ${accountStatus}.`)
    });
  }

  async function initialize(options={}){
    if(initializePromise)return initializePromise;
    if(state.initialized&&services)return state;
    initializePromise=(async()=>{
      setState({status:"connecting",busy:true,message:"Checking private account availability…"});
      const runtime=options.runtime||root.CareerModeProductionFirebaseRuntime;
      if(!runtime||typeof runtime.ensureAccountServices!=="function"){
        return setState({status:"runtime-unavailable",initialized:true,busy:false,message:localModeMessage("Connected account services are unavailable.")});
      }
      const resolved=await runtime.ensureAccountServices(options.runtimeOptions||{});
      if(!resolved||resolved.ok!==true){
        return setState({status:"runtime-unavailable",initialized:true,busy:false,message:localModeMessage("Connected account services are unavailable.")});
      }
      services=resolved;
      const authSdk=services.authSdk;
      if(!authSdk||typeof authSdk.setPersistence!=="function"||!authSdk.browserSessionPersistence){
        return setState({status:"persistence-policy-unavailable",initialized:true,busy:false,message:localModeMessage("Required session-only sign-in policy is unavailable.")});
      }
      try{
        await authSdk.setPersistence(services.auth,authSdk.browserSessionPersistence);
      }catch(_error){
        return setState({status:"persistence-policy-failed",initialized:true,busy:false,message:localModeMessage("Session-only sign-in could not be prepared.")});
      }

      await loadBootstrapScript();
      if(!authUnsubscribe){
        authUnsubscribe=authSdk.onAuthStateChanged(
          services.auth,
          user=>{void activateUser(user);},
          ()=>setState({status:"auth-state-error",initialized:true,busy:false,connected:false,message:localModeMessage("Authentication state could not be read.")})
        );
      }
      if(services.auth.currentUser)return activateUser(services.auth.currentUser);
      return setState({
        status:"signed-out",
        initialized:true,
        signedIn:false,
        connected:false,
        busy:false,
        accountId:null,
        displayName:null,
        email:null,
        accountStatus:null,
        message:"Sign in with Google only when you want future private connected features. Local play stays available without an account."
      });
    })().finally(()=>{initializePromise=null;});
    return initializePromise;
  }

  async function signIn(){
    await initialize();
    if(!services||state.status==="runtime-unavailable"||state.status==="persistence-policy-unavailable"||state.status==="persistence-policy-failed")return state;
    setState({status:"signing-in",busy:true,message:"Opening Google sign-in…"});
    try{
      const provider=new services.authSdk.GoogleAuthProvider();
      const result=await services.authSdk.signInWithPopup(services.auth,provider);
      if(!result||!result.user){
        return setState({status:"sign-in-failed",busy:false,connected:false,message:localModeMessage("Google sign-in did not return an authenticated account.")});
      }
      return activateUser(result.user);
    }catch(error){
      const code=error&&typeof error.code==="string"?error.code:"auth/unknown";
      const cancelled=code==="auth/popup-closed-by-user"||code==="auth/cancelled-popup-request";
      return setState({
        status:cancelled?"sign-in-cancelled":"sign-in-failed",
        busy:false,
        connected:false,
        message:cancelled
          ? "Google sign-in was cancelled. Local Career Mode is unchanged."
          : localModeMessage("Google sign-in could not be completed.")
      });
    }
  }

  async function signOutAccount(){
    await initialize();
    if(!services)return state;
    setState({status:"signing-out",busy:true,message:"Signing out…"});
    try{
      await services.authSdk.signOut(services.auth);
      return setState({
        status:"signed-out",
        initialized:true,
        signedIn:false,
        connected:false,
        busy:false,
        accountId:null,
        displayName:null,
        email:null,
        accountStatus:null,
        message:"Signed out. Local Career Mode and local saves remain available."
      });
    }catch(_error){
      return setState({status:"sign-out-failed",busy:false,message:localModeMessage("Sign-out could not be completed.")});
    }
  }

  function createElement(tag,className,text){
    const element=root.document.createElement(tag);
    if(className)element.className=className;
    if(text!==undefined&&text!==null)element.textContent=String(text);
    return element;
  }

  function accountLabel(){
    if(!state.signedIn)return "Not signed in";
    if(state.displayName)return state.displayName;
    if(state.email)return state.email;
    return "Google account";
  }

  function shortenedAccountId(){
    if(!state.accountId)return "—";
    if(state.accountId.length<=12)return state.accountId;
    return `${state.accountId.slice(0,8)}…${state.accountId.slice(-4)}`;
  }

  function renderSettingsPanel(){
    if(!root.document)return null;
    const content=root.document.getElementById(SETTINGS_CONTENT_ID);
    const overlay=root.document.getElementById(SETTINGS_OVERLAY_ID);
    if(!content||!overlay||overlay.classList.contains("hidden"))return null;

    let panel=root.document.getElementById(SETTINGS_PANEL_ID);
    if(!panel){
      panel=createElement("section","settingsPanel settingsConnectedAccountPanel");
      panel.id=SETTINGS_PANEL_ID;
      content.insertBefore(panel,content.firstChild||null);
    }
    panel.replaceChildren();

    const heading=createElement("div","settingsPanelHeading");
    heading.append(
      createElement("span","settingsPanelEyebrow","PRIVATE CONNECTION"),
      createElement("h3","","CONNECTED ACCOUNT"),
      createElement("p","","Optional Google sign-in for future private rivalry features. Your current saves remain local to this device.")
    );

    const info=createElement("div","settingsInfoGrid");
    const rows=[
      ["STATUS",state.connected?"Private account ready":state.signedIn?"Signed in · setup incomplete":"Local only"],
      ["ACCOUNT",accountLabel()],
      ["ACCOUNT ID",shortenedAccountId()],
      ["REMOTE JOINING","Locked · prerequisites still in progress"],
      ["INFRASTRUCTURE","Firebase Spark · no billing"]
    ];
    for(const [label,value] of rows){
      const row=createElement("div","settingsInfoRow");
      row.append(createElement("span","",label),createElement("strong","",value));
      info.appendChild(row);
    }

    const actions=createElement("div","settingsOfflineActions settingsConnectedAccountActions");
    const action=createElement("button","menuButton settingsConnectedAccountButton",state.signedIn?"SIGN OUT":"SIGN IN WITH GOOGLE");
    action.type="button";
    action.disabled=Boolean(state.busy);
    action.addEventListener("click",()=>{void(state.signedIn?signOutAccount():signIn());});
    actions.appendChild(action);

    const note=createElement("p","settingsDataNote",state.message);
    note.setAttribute("role","status");
    note.setAttribute("aria-live","polite");

    panel.append(heading,info,actions,note);
    return panel;
  }

  function ensureSettingsObserver(){
    if(settingsObserver||!root.document||typeof root.MutationObserver!=="function")return;
    const content=root.document.getElementById(SETTINGS_CONTENT_ID);
    if(!content)return;
    settingsObserver=new root.MutationObserver(()=>{
      const overlay=root.document.getElementById(SETTINGS_OVERLAY_ID);
      if(overlay&&!overlay.classList.contains("hidden")&&!root.document.getElementById(SETTINGS_PANEL_ID)){
        root.queueMicrotask?root.queueMicrotask(renderSettingsPanel):root.setTimeout(renderSettingsPanel,0);
      }
    });
    settingsObserver.observe(content,{childList:true});
  }

  function mountWhenSettingsReady(){
    if(!root.document)return Promise.resolve(false);
    return new Promise(resolve=>{
      let attempts=0;
      const tryMount=()=>{
        attempts+=1;
        const content=root.document.getElementById(SETTINGS_CONTENT_ID);
        const overlay=root.document.getElementById(SETTINGS_OVERLAY_ID);
        if(content&&overlay&&!overlay.classList.contains("hidden")){
          renderSettingsPanel();
          ensureSettingsObserver();
          void initialize();
          resolve(true);
          return;
        }
        if(attempts>=40){resolve(false);return;}
        root.setTimeout(tryMount,50);
      };
      tryMount();
    });
  }

  function subscribe(listener){
    if(typeof listener!=="function")return ()=>{};
    listeners.add(listener);
    return ()=>listeners.delete(listener);
  }

  function getState(){return state;}

  return freeze({
    contractVersion:1,
    provider:"google",
    signInFlow:"popup",
    authPersistence:"browserSessionPersistence",
    firestorePersistence:"memory-only",
    billingRequired:false,
    blazeRequired:false,
    cloudRunRequired:false,
    cloudFunctionsRequired:false,
    additionalGoogleScopes:0,
    writeScope:"self-account-create-only",
    initialize,
    signIn,
    signOut:signOutAccount,
    mountWhenSettingsReady,
    subscribe,
    getState
  });
});
