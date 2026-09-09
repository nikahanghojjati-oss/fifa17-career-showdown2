(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedSeasonResultsRoute=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  let installed=false,observer=null;
  function routeShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function routeShared(){const showdown=routeShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function routeButton(){return root.document&&root.document.getElementById("continueFromTransfers");}
  function routeTransfer(){return root.CareerModeProductionSharedTransferChallenge||null;}
  function routeReady(){const button=routeButton(),transfer=routeTransfer(),view=transfer&&typeof transfer.getState==="function"?transfer.getState():null,screen=root.document&&root.document.getElementById("transferChallenge");return Boolean(routeShared()&&button&&view&&view.state&&view.state.phase==="COMPLETED"&&screen&&!screen.dataset.sharedTransferReplay);}
  function routeDecorate(){
    const button=routeButton();if(!button||!routeReady())return false;
    if(button.textContent!=="CONTINUE TO SHARED SEASON RESULTS")button.textContent="CONTINUE TO SHARED SEASON RESULTS";
    if(button.disabled)button.disabled=false;
    if(button.getAttribute("aria-disabled")==="true")button.setAttribute("aria-disabled","false");
    if(button.classList.contains("hidden"))button.classList.remove("hidden");
    button.dataset.sharedSeasonResultsRoute="true";
    return true;
  }
  async function routeOpen(){
    if(!routeReady())return false;
    if(typeof root.loadRuntimeScript!=="function")throw new Error("Shared Season Results runtime loader is unavailable.");
    await root.loadRuntimeScript("ssjr-production-season-results","js/productionSharedSeasonResults.js",()=>root.CareerModeProductionSharedSeasonResults);
    const api=root.CareerModeProductionSharedSeasonResults;if(!api||typeof api.install!=="function"||typeof api.open!=="function")throw new Error("Shared Season Results production adapter is unavailable.");
    api.install();return api.open();
  }
  function routeCapture(event){
    const target=event.target&&event.target.closest&&event.target.closest("button");
    if(!target||target.id!=="continueFromTransfers"||!routeReady())return;
    event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();
    void routeOpen().catch(error=>{if(typeof root.reportApplicationError==="function")root.reportApplicationError("Unable to open Shared Season Results",error);else root.console?.error?.(error);});
  }
  function routeInstall(){
    if(installed)return true;installed=true;
    if(root.document){
      root.document.addEventListener("click",routeCapture,true);
      const button=routeButton();if(button&&typeof root.MutationObserver==="function"){observer=new root.MutationObserver(()=>routeDecorate());observer.observe(button,{attributes:true,childList:true,subtree:true,attributeFilter:["disabled","class","aria-disabled"]});}
      routeDecorate();
    }
    return true;
  }
  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-results-route",productionEnabled:true,preservesTransferRuntime:true,requiresCompletedSharedTransfer:true,canonicalStorageMutation:false,authoritativeScoring:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,install:routeInstall,decorate:routeDecorate,open:routeOpen,canRoute:routeReady});
});
