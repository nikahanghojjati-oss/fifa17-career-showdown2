(function(root){
  "use strict";

  const PENDING_KEY="careerModeShowdown.sharedJourneyPending.v1";
  const GUARDED=Object.freeze([
    "handleLeagueWheelAction",
    "spinLeagueWheel",
    "confirmLeagueSelectionAndContinue",
    "prepareClubAssignment",
    "assignClubs",
    "continueToShowdownHome"
  ]);
  const WRAPPED=Symbol("ssjrSharedJourneyGuard");
  const LOADER_WRAPPED=Symbol("ssjrSharedJourneyGuardLoader");
  let timer=null;

  function pending(){
    try{return Boolean(root.sessionStorage&&root.sessionStorage.getItem(PENDING_KEY)==="1");}
    catch(_error){return false;}
  }
  function deny(name){
    if(typeof root.showAppNotice==="function"){
      root.showAppNotice(
        `Shared Showdown blocks local ${name}. Exact pairing, the exact ACTIVE private session and authoritative Shared Setup own league and club selection.`,
        "error",
        9000
      );
    }
    return false;
  }
  function wrap(name){
    const original=root[name];
    if(typeof original!=="function"||original[WRAPPED])return false;
    function guarded(...args){
      if(pending())return deny(name);
      return original.apply(this,args);
    }
    Object.defineProperty(guarded,WRAPPED,{value:true});
    Object.defineProperty(guarded,"ssjrOriginal",{value:original});
    root[name]=guarded;
    return true;
  }
  function hookRuntimeLoader(){
    const original=root.loadRuntimeScript;
    if(typeof original!=="function"||original[LOADER_WRAPPED])return false;
    function guardedRuntimeLoader(...args){
      return Promise.resolve(original.apply(this,args)).then(value=>{
        install();
        return value;
      });
    }
    Object.defineProperty(guardedRuntimeLoader,LOADER_WRAPPED,{value:true});
    Object.defineProperty(guardedRuntimeLoader,"ssjrOriginal",{value:original});
    root.loadRuntimeScript=guardedRuntimeLoader;
    return true;
  }
  function install(){
    hookRuntimeLoader();
    GUARDED.forEach(wrap);
    if(timer===null&&typeof root.setInterval==="function"){
      let attempts=0;
      timer=root.setInterval(()=>{
        hookRuntimeLoader();
        GUARDED.forEach(wrap);
        attempts+=1;
        if(attempts>=120){root.clearInterval(timer);timer=null;}
      },250);
    }
    return true;
  }

  const api=Object.freeze({
    contractVersion:1,
    feature:"ssjr-local-draw-bypass-guard",
    guardedFunctions:GUARDED,
    hooksLazyRuntimeLoader:true,
    usesSessionStorageOnly:true,
    canonicalLocalStorageMutation:false,
    billingRequired:false,
    isSharedJourneyPending:pending,
    install
  });
  root.CareerModeProductionSharedJourneyGuard=api;
  install();
})(typeof globalThis!=="undefined"?globalThis:this);
