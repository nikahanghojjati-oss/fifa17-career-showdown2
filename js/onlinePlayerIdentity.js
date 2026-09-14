(function(root){
  "use strict";

  const CORE_PATH="js/onlinePlayerIdentityCore.js";
  const PAIR_PATH="js/persistentNikDanielPair.js";
  const placeholderState=Object.freeze({status:"loading",initialized:false,busy:true,online:!root.navigator||root.navigator.onLine!==false,accountId:null,managerId:null,managerLabel:null,deviceId:null,registered:false,message:"Preparing online identity…"});
  const managers=Object.freeze({nik:Object.freeze({id:"nik",label:"Nik",role:"playerOne"}),daniel:Object.freeze({id:"daniel",label:"Daniel",role:"playerTwo"})});
  let corePromise=null;
  let pairPromise=null;
  let coreApi=null;
  let enhancedApi=null;

  function assetRevision(){
    const meta=root.document?.querySelector?.('meta[name="app-asset-revision"]');
    return meta?.content?.trim()||"1.9.1-r20";
  }

  function assetUrl(path){
    if(!root.document||!root.location)return path;
    const url=new URL(path,root.document.baseURI||root.location.href);
    url.searchParams.set("v",assetRevision());
    return url.href;
  }

  function loadScript(path,marker,ready){
    if(ready())return Promise.resolve(ready());
    return new Promise((resolve,reject)=>{
      const script=root.document.createElement("script");
      script.src=assetUrl(path);
      script.async=false;
      script.dataset[marker]="true";
      script.addEventListener("load",()=>{const value=ready();if(value)resolve(value);else reject(new Error(`${path} loaded without its expected API.`));},{once:true});
      script.addEventListener("error",()=>reject(new Error(`Unable to load ${path}.`)),{once:true});
      root.document.head.appendChild(script);
    });
  }

  async function ensurePair(){
    if(root.CareerModePersistentNikDanielPair)return root.CareerModePersistentNikDanielPair;
    if(pairPromise)return pairPromise;
    pairPromise=loadScript(PAIR_PATH,"persistentNikDanielPair",()=>root.CareerModePersistentNikDanielPair||null).finally(()=>{pairPromise=null;});
    return pairPromise;
  }

  async function refreshPersistentPair(){
    if(!coreApi)return null;
    try{
      const pair=await ensurePair();
      let pairState=await pair.initialize({force:true});
      const identityState=coreApi.getState?.();
      if(
        pairState?.accountId
        && pairState?.managerId
        && identityState?.accountId===pairState.accountId
        && identityState?.managerId!==pairState.managerId
        && typeof coreApi.chooseManager==="function"
      ){
        await coreApi.chooseManager(pairState.managerId);
        pairState=await pair.initialize({force:true,migrate:false});
      }
      pair.render?.();
      return pairState;
    }catch(error){
      root.console?.warn?.("[Career Mode Showdown] Persistent Nik/Daniel pair could not be refreshed; the proven online identity path remains available.",error);
      return null;
    }
  }

  function enhanceCore(core){
    if(enhancedApi)return enhancedApi;
    const wrap=method=>async(...args)=>{
      const result=await core[method](...args);
      await refreshPersistentPair();
      return result;
    };
    enhancedApi=Object.freeze({
      ...core,
      initialize:wrap("initialize"),
      signIn:wrap("signIn"),
      chooseManager:wrap("chooseManager"),
      forgetThisDevice:wrap("forgetThisDevice"),
      refreshPersistentPair,
      persistentPairEnabled:true
    });
    root.CareerModeOnlinePlayerIdentity=enhancedApi;
    return enhancedApi;
  }

  async function ensureCore(){
    if(coreApi)return enhanceCore(coreApi);
    if(corePromise)return corePromise;
    if(!root.document)throw new Error("Online identity requires a browser document.");
    corePromise=(async()=>{
      const proxy=root.CareerModeOnlinePlayerIdentity;
      await loadScript(CORE_PATH,"onlinePlayerIdentityCore",()=>{
        const value=root.CareerModeOnlinePlayerIdentity;
        return value&&value!==proxy&&typeof value.initialize==="function"?value:null;
      });
      coreApi=root.CareerModeOnlinePlayerIdentity;
      return enhanceCore(coreApi);
    })().finally(()=>{corePromise=null;});
    return corePromise;
  }

  const proxy=Object.freeze({
    contractVersion:1,
    mode:"online-only",
    managers,
    gameplayRequiresIdentity:true,
    browseAndRecoveryWithoutIdentity:true,
    persistentPairEnabled:true,
    initialize:async(...args)=>(await ensureCore()).initialize(...args),
    signIn:async(...args)=>(await ensureCore()).signIn(...args),
    chooseManager:async(...args)=>(await ensureCore()).chooseManager(...args),
    openGate:async(...args)=>(await ensureCore()).openGate(...args),
    forgetThisDevice:async(...args)=>(await ensureCore()).forgetThisDevice(...args),
    readRole:async(...args)=>(await ensureCore()).readRole(...args),
    clearRole:async(...args)=>(await ensureCore()).clearRole(...args),
    subscribe:(listener)=>{let unsubscribe=()=>{};void ensureCore().then(api=>{unsubscribe=api.subscribe(listener);});return()=>unsubscribe();},
    refreshPersistentPair:async()=>{await ensureCore();return refreshPersistentPair();},
    getState:()=>coreApi?.getState?.()||placeholderState
  });

  root.CareerModeOnlinePlayerIdentity=proxy;
})(typeof globalThis!=="undefined"?globalThis:this);
