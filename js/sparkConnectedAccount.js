(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkConnectedAccount=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const SPARK_CONNECTED_BOOTSTRAP_PATH="js/sparkAccountBootstrap.js";
  const SPARK_CONNECTED_SETTINGS_PANEL_ID="sparkConnectedAccountPanel";
  const SPARK_CONNECTED_SETTINGS_CONTENT_ID="settingsContent";
  const SPARK_CONNECTED_SETTINGS_OVERLAY_ID="settingsOverlay";

  let sparkConnectedState=Object.freeze({status:"idle",initialized:false,signedIn:false,connected:false,busy:false,accountId:null,displayName:null,email:null,accountStatus:null,message:"Connected account is optional. Local Career Mode remains available without signing in."});
  let sparkConnectedServices=null;
  let sparkConnectedInitializePromise=null;
  let sparkConnectedBootstrapScriptPromise=null;
  let sparkConnectedAuthUnsubscribe=null;
  const sparkConnectedBootstrapPromiseByUid=new Map();
  let sparkConnectedSettingsObserver=null;
  const sparkConnectedListeners=new Set();

  function sparkConnectedFreeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(sparkConnectedFreeze);
    return value;
  }

  function sparkConnectedGetRevision(){
    if(!root.document)return "1.5.0-r1";
    const meta=root.document.querySelector('meta[name="app-asset-revision"]');
    return meta&&meta.content?meta.content.trim()||"1.5.0-r1":"1.5.0-r1";
  }

  function sparkConnectedVersionedLocalUrl(path){
    if(!root.document||!root.location)return path;
    const url=new URL(path,root.document.baseURI||root.location.href);
    url.searchParams.set("v",sparkConnectedGetRevision());
    return url.href;
  }

  function sparkConnectedSetState(next){
    sparkConnectedState=sparkConnectedFreeze({...sparkConnectedState,...next});
    for(const listener of sparkConnectedListeners){try{listener(sparkConnectedState);}catch(_error){}}
    sparkConnectedRenderSettingsPanel();
    return sparkConnectedState;
  }

  function sparkConnectedPublicIdentity(user){
    if(!user||typeof user.uid!=="string"||!user.uid.trim())return null;
    return {accountId:user.uid.trim(),displayName:typeof user.displayName==="string"&&user.displayName.trim()?user.displayName.trim():null,email:typeof user.email==="string"&&user.email.trim()?user.email.trim():null};
  }

  function sparkConnectedLocalModeMessage(prefix){
    return `${prefix} Local Career Mode and local saves remain available.`;
  }

  function sparkConnectedLoadBootstrapScript(){
    if(root.CareerModeSparkAccountBootstrap)return Promise.resolve(root.CareerModeSparkAccountBootstrap);
    if(sparkConnectedBootstrapScriptPromise)return sparkConnectedBootstrapScriptPromise;
    if(!root.document)return Promise.resolve(null);
    sparkConnectedBootstrapScriptPromise=new Promise(resolve=>{
      const script=root.document.createElement("script");
      script.src=sparkConnectedVersionedLocalUrl(SPARK_CONNECTED_BOOTSTRAP_PATH);
      script.async=false;
      script.dataset.sparkAccountBootstrap="true";
      script.addEventListener("load",()=>resolve(root.CareerModeSparkAccountBootstrap||null),{once:true});
      script.addEventListener("error",()=>resolve(null),{once:true});
      root.document.head.appendChild(script);
    }).finally(()=>{sparkConnectedBootstrapScriptPromise=null;});
    return sparkConnectedBootstrapScriptPromise;
  }

  async function sparkConnectedBootstrapUser(user){
    const identity=sparkConnectedPublicIdentity(user);
    if(!identity)return {ok:false,code:"SPARK_ACCOUNT_AUTH_REQUIRED"};
    if(sparkConnectedBootstrapPromiseByUid.has(identity.accountId))return sparkConnectedBootstrapPromiseByUid.get(identity.accountId);
    const promise=(async()=>{
      const bootstrap=root.CareerModeSparkAccountBootstrap||await sparkConnectedLoadBootstrapScript();
      if(!bootstrap||typeof bootstrap.bootstrap!=="function")return {ok:false,code:"SPARK_ACCOUNT_BOOTSTRAP_UNAVAILABLE"};
      return bootstrap.bootstrap({user,firestore:sparkConnectedServices.firestore,firebaseSdk:sparkConnectedServices.firestoreSdk,cryptoImpl:root.crypto});
    })().finally(()=>{sparkConnectedBootstrapPromiseByUid.delete(identity.accountId);});
    sparkConnectedBootstrapPromiseByUid.set(identity.accountId,promise);
    return promise;
  }

  async function sparkConnectedActivateUser(user){
    const identity=sparkConnectedPublicIdentity(user);
    if(!identity){
      return sparkConnectedSetState({status:"signed-out",initialized:true,signedIn:false,connected:false,busy:false,accountId:null,displayName:null,email:null,accountStatus:null,message:"Signed out. Local Career Mode continues normally."});
    }
    sparkConnectedSetState({status:"bootstrapping",initialized:true,signedIn:true,connected:false,busy:true,accountId:identity.accountId,displayName:identity.displayName,email:identity.email,accountStatus:null,message:"Finishing private account setup…"});
    const result=await sparkConnectedBootstrapUser(user);
    if(!result||result.ok!==true){
      return sparkConnectedSetState({status:"bootstrap-error",initialized:true,signedIn:true,connected:false,busy:false,accountStatus:null,message:sparkConnectedLocalModeMessage("Signed in, but private account setup could not be completed.")});
    }
    const accountStatus=result.status||"active";
    const connected=accountStatus==="active";
    return sparkConnectedSetState({status:connected?"ready":"account-unavailable",initialized:true,signedIn:true,connected,busy:false,accountStatus,message:connected?"Private account is ready. Remote Joining is still locked until later pairing and Connected Rivalry stages are proven.":sparkConnectedLocalModeMessage(`This private account is ${accountStatus}.`)});
  }

  async function sparkConnectedInitialize(options={}){
    if(sparkConnectedInitializePromise)return sparkConnectedInitializePromise;
    if(sparkConnectedState.initialized&&sparkConnectedServices)return sparkConnectedState;
    sparkConnectedInitializePromise=(async()=>{
      sparkConnectedSetState({status:"connecting",busy:true,message:"Checking private account availability…"});
      const runtime=options.runtime||root.CareerModeProductionFirebaseRuntime;
      if(!runtime||typeof runtime.ensureAccountServices!=="function")return sparkConnectedSetState({status:"runtime-unavailable",initialized:true,busy:false,message:sparkConnectedLocalModeMessage("Connected account services are unavailable.")});
      const resolved=await runtime.ensureAccountServices(options.runtimeOptions||{});
      if(!resolved||resolved.ok!==true)return sparkConnectedSetState({status:"runtime-unavailable",initialized:true,busy:false,message:sparkConnectedLocalModeMessage("Connected account services are unavailable.")});
      sparkConnectedServices=resolved;
      const authSdk=sparkConnectedServices.authSdk;
      if(!authSdk||typeof authSdk.setPersistence!=="function"||!authSdk.browserSessionPersistence)return sparkConnectedSetState({status:"persistence-policy-unavailable",initialized:true,busy:false,message:sparkConnectedLocalModeMessage("Required session-only sign-in policy is unavailable.")});
      try{await authSdk.setPersistence(sparkConnectedServices.auth,authSdk.browserSessionPersistence);}catch(_error){return sparkConnectedSetState({status:"persistence-policy-failed",initialized:true,busy:false,message:sparkConnectedLocalModeMessage("Session-only sign-in could not be prepared.")});}
      await sparkConnectedLoadBootstrapScript();
      if(!sparkConnectedAuthUnsubscribe){
        sparkConnectedAuthUnsubscribe=authSdk.onAuthStateChanged(sparkConnectedServices.auth,user=>{void sparkConnectedActivateUser(user);},()=>sparkConnectedSetState({status:"auth-state-error",initialized:true,busy:false,connected:false,message:sparkConnectedLocalModeMessage("Authentication state could not be read.")}));
      }
      if(sparkConnectedServices.auth.currentUser)return sparkConnectedActivateUser(sparkConnectedServices.auth.currentUser);
      return sparkConnectedSetState({status:"signed-out",initialized:true,signedIn:false,connected:false,busy:false,accountId:null,displayName:null,email:null,accountStatus:null,message:"Sign in with Google only when you want future private connected features. Local play stays available without an account."});
    })().finally(()=>{sparkConnectedInitializePromise=null;});
    return sparkConnectedInitializePromise;
  }

  async function sparkConnectedSignIn(){
    await sparkConnectedInitialize();
    if(!sparkConnectedServices||["runtime-unavailable","persistence-policy-unavailable","persistence-policy-failed"].includes(sparkConnectedState.status))return sparkConnectedState;
    sparkConnectedSetState({status:"signing-in",busy:true,message:"Opening Google sign-in…"});
    try{
      const provider=new sparkConnectedServices.authSdk.GoogleAuthProvider();
      const result=await sparkConnectedServices.authSdk.signInWithPopup(sparkConnectedServices.auth,provider);
      if(!result||!result.user)return sparkConnectedSetState({status:"sign-in-failed",busy:false,connected:false,message:sparkConnectedLocalModeMessage("Google sign-in did not return an authenticated account.")});
      return sparkConnectedActivateUser(result.user);
    }catch(error){
      const code=error&&typeof error.code==="string"?error.code:"auth/unknown";
      const cancelled=code==="auth/popup-closed-by-user"||code==="auth/cancelled-popup-request";
      return sparkConnectedSetState({status:cancelled?"sign-in-cancelled":"sign-in-failed",busy:false,connected:false,message:cancelled?"Google sign-in was cancelled. Local Career Mode is unchanged.":sparkConnectedLocalModeMessage("Google sign-in could not be completed.")});
    }
  }

  async function sparkConnectedSignOut(){
    await sparkConnectedInitialize();
    if(!sparkConnectedServices)return sparkConnectedState;
    sparkConnectedSetState({status:"signing-out",busy:true,message:"Signing out…"});
    try{
      await sparkConnectedServices.authSdk.signOut(sparkConnectedServices.auth);
      return sparkConnectedSetState({status:"signed-out",initialized:true,signedIn:false,connected:false,busy:false,accountId:null,displayName:null,email:null,accountStatus:null,message:"Signed out. Local Career Mode and local saves remain available."});
    }catch(_error){
      return sparkConnectedSetState({status:"sign-out-failed",busy:false,message:sparkConnectedLocalModeMessage("Sign-out could not be completed.")});
    }
  }

  function sparkConnectedCreateElement(tag,className,text){
    const element=root.document.createElement(tag);
    if(className)element.className=className;
    if(text!==undefined&&text!==null)element.textContent=String(text);
    return element;
  }

  function sparkConnectedAccountLabel(){
    if(!sparkConnectedState.signedIn)return "Not signed in";
    if(sparkConnectedState.displayName)return sparkConnectedState.displayName;
    if(sparkConnectedState.email)return sparkConnectedState.email;
    return "Google account";
  }

  function sparkConnectedShortAccountId(){
    if(!sparkConnectedState.accountId)return "—";
    if(sparkConnectedState.accountId.length<=12)return sparkConnectedState.accountId;
    return `${sparkConnectedState.accountId.slice(0,8)}…${sparkConnectedState.accountId.slice(-4)}`;
  }

  function sparkConnectedRenderSettingsPanel(){
    if(!root.document)return null;
    const content=root.document.getElementById(SPARK_CONNECTED_SETTINGS_CONTENT_ID);
    const overlay=root.document.getElementById(SPARK_CONNECTED_SETTINGS_OVERLAY_ID);
    if(!content||!overlay||overlay.classList.contains("hidden"))return null;
    let panel=root.document.getElementById(SPARK_CONNECTED_SETTINGS_PANEL_ID);
    if(!panel){panel=sparkConnectedCreateElement("section","settingsPanel settingsConnectedAccountPanel");panel.id=SPARK_CONNECTED_SETTINGS_PANEL_ID;content.insertBefore(panel,content.firstChild||null);}
    panel.replaceChildren();
    const heading=sparkConnectedCreateElement("div","settingsPanelHeading");
    heading.append(sparkConnectedCreateElement("span","settingsPanelEyebrow","PRIVATE CONNECTION"),sparkConnectedCreateElement("h3","","CONNECTED ACCOUNT"),sparkConnectedCreateElement("p","","Optional Google sign-in for future private rivalry features. Your current saves remain local to this device."));
    const info=sparkConnectedCreateElement("div","settingsInfoGrid");
    for(const [label,value] of [["STATUS",sparkConnectedState.connected?"Private account ready":sparkConnectedState.signedIn?"Signed in · setup incomplete":"Local only"],["ACCOUNT",sparkConnectedAccountLabel()],["ACCOUNT ID",sparkConnectedShortAccountId()],["REMOTE JOINING","Locked · prerequisites still in progress"],["INFRASTRUCTURE","Firebase Spark · no billing"]]){
      const row=sparkConnectedCreateElement("div","settingsInfoRow");
      row.append(sparkConnectedCreateElement("span","",label),sparkConnectedCreateElement("strong","",value));
      info.appendChild(row);
    }
    const actions=sparkConnectedCreateElement("div","settingsOfflineActions settingsConnectedAccountActions");
    const action=sparkConnectedCreateElement("button","menuButton settingsConnectedAccountButton",sparkConnectedState.signedIn?"SIGN OUT":"SIGN IN WITH GOOGLE");
    action.type="button";action.disabled=Boolean(sparkConnectedState.busy);action.addEventListener("click",()=>{void(sparkConnectedState.signedIn?sparkConnectedSignOut():sparkConnectedSignIn());});actions.appendChild(action);
    const note=sparkConnectedCreateElement("p","settingsDataNote",sparkConnectedState.message);note.setAttribute("role","status");note.setAttribute("aria-live","polite");
    panel.append(heading,info,actions,note);
    return panel;
  }

  function sparkConnectedEnsureSettingsObserver(){
    if(sparkConnectedSettingsObserver||!root.document||typeof root.MutationObserver!=="function")return;
    const content=root.document.getElementById(SPARK_CONNECTED_SETTINGS_CONTENT_ID);
    if(!content)return;
    sparkConnectedSettingsObserver=new root.MutationObserver(()=>{
      const overlay=root.document.getElementById(SPARK_CONNECTED_SETTINGS_OVERLAY_ID);
      if(overlay&&!overlay.classList.contains("hidden")&&!root.document.getElementById(SPARK_CONNECTED_SETTINGS_PANEL_ID)){
        root.queueMicrotask?root.queueMicrotask(sparkConnectedRenderSettingsPanel):root.setTimeout(sparkConnectedRenderSettingsPanel,0);
      }
    });
    sparkConnectedSettingsObserver.observe(content,{childList:true});
  }

  function sparkConnectedMountWhenSettingsReady(){
    if(!root.document)return Promise.resolve(false);
    return new Promise(resolve=>{
      let attempts=0;
      const tryMount=()=>{
        attempts+=1;
        const content=root.document.getElementById(SPARK_CONNECTED_SETTINGS_CONTENT_ID);
        const overlay=root.document.getElementById(SPARK_CONNECTED_SETTINGS_OVERLAY_ID);
        if(content&&overlay&&!overlay.classList.contains("hidden")){sparkConnectedRenderSettingsPanel();sparkConnectedEnsureSettingsObserver();void sparkConnectedInitialize();resolve(true);return;}
        if(attempts>=40){resolve(false);return;}
        root.setTimeout(tryMount,50);
      };
      tryMount();
    });
  }

  function sparkConnectedSubscribe(listener){
    if(typeof listener!=="function")return ()=>{};
    sparkConnectedListeners.add(listener);
    return ()=>sparkConnectedListeners.delete(listener);
  }

  function sparkConnectedGetState(){return sparkConnectedState;}

  return sparkConnectedFreeze({contractVersion:1,provider:"google",signInFlow:"popup",authPersistence:"browserSessionPersistence",firestorePersistence:"memory-only",billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,additionalGoogleScopes:0,writeScope:"self-account-create-only",initialize:sparkConnectedInitialize,signIn:sparkConnectedSignIn,signOut:sparkConnectedSignOut,mountWhenSettingsReady:sparkConnectedMountWhenSettingsReady,subscribe:sparkConnectedSubscribe,getState:sparkConnectedGetState});
});
