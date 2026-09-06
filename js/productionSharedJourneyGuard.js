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
  const CLICK_TARGETS=Object.freeze({spinLeague:"league selection",openClubPack:"club assignment",continueClubAssignment:"local rivalry confirmation"});
  const WRAPPED=Symbol("ssjrSharedJourneyGuard");
  const LOADER_WRAPPED=Symbol("ssjrSharedJourneyGuardLoader");
  let timer=null,eventGateInstalled=false;

  function persistedPending(){
    try{
      const runtime=root.CareerModeSaveLibraryRuntime;
      if(!runtime||typeof runtime.isReady!=="function"||!runtime.isReady()||typeof runtime.getLibrarySnapshot!=="function")return false;
      const library=runtime.getLibrarySnapshot();
      if(!library||!library.activeSaveId||!Array.isArray(library.saves))return false;
      const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
      const marker=entry&&entry.showdown&&entry.showdown.sharedJourney;
      return Boolean(marker&&marker.mode==="shared"&&marker.setupPending===true);
    }catch(_error){return false;}
  }
  function pending(){
    if(persistedPending())return true;
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
  function blockLocalDraw(name){if(!pending())return false;deny(name);return true;}
  function wrap(name){
    const original=root[name];
    if(typeof original!=="function"||original[WRAPPED])return false;
    function guarded(...args){
      if(blockLocalDraw(name))return false;
      return original.apply(this,args);
    }
    Object.defineProperty(guarded,WRAPPED,{value:true});
    Object.defineProperty(guarded,"ssjrOriginal",{value:original});
    root[name]=guarded;
    return true;
  }
  function installEventGate(){
    if(eventGateInstalled||!root.document||typeof root.document.addEventListener!=="function")return false;
    root.document.addEventListener("click",event=>{
      const source=event&&event.target;
      const target=source&&typeof source.closest==="function"?source.closest("#spinLeague,#openClubPack,#continueClubAssignment"):null;
      if(!target||!blockLocalDraw(CLICK_TARGETS[target.id]||target.id))return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },true);
    eventGateInstalled=true;return true;
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
    installEventGate();hookRuntimeLoader();GUARDED.forEach(wrap);
    if(timer===null&&typeof root.setInterval==="function"){
      let attempts=0;
      timer=root.setInterval(()=>{
        installEventGate();hookRuntimeLoader();GUARDED.forEach(wrap);
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
    capturesActualDrawClicks:true,
    usesPersistedSaveMarker:true,
    canonicalLocalStorageMutation:false,
    billingRequired:false,
    isSharedJourneyPending:pending,
    blockLocalDraw,
    install
  });
  root.CareerModeProductionSharedJourneyGuard=api;
  install();
})(typeof globalThis!=="undefined"?globalThis:this);