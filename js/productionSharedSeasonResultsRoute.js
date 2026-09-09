(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedSeasonResultsRoute=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const CONTROL_IDS=Object.freeze(["continueFromTransfers","seasonPrimaryAction"]);
  let installed=false,observer=null;
  function routeShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function routeShared(){const showdown=routeShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function routeButton(id){return root.document&&root.document.getElementById(id);}
  function routeTransfer(){return root.CareerModeProductionSharedTransferChallenge||null;}
  function routeResults(){return root.CareerModeProductionSharedSeasonResults||null;}
  function routeReady(){const transfer=routeTransfer(),view=transfer&&typeof transfer.getState==="function"?transfer.getState():null,screen=root.document&&root.document.getElementById("transferChallenge");return Boolean(routeShared()&&view&&view.state&&view.state.phase==="COMPLETED"&&screen&&!screen.dataset.sharedTransferReplay);}
  function routeInstallEscapeStyle(){
    if(!root.document||root.document.getElementById("sharedSeasonResultsRouteStyle"))return false;
    const style=root.document.createElement("style");style.id="sharedSeasonResultsRouteStyle";
    style.textContent='#seasonEntry[data-shared-season-results="review"] .seasonEntryActions{display:flex!important}#seasonEntry[data-shared-season-results="review"] #completeSeason{display:none!important}';
    root.document.head.appendChild(style);return true;
  }
  function routeSetText(node,value){if(node&&node.textContent!==value)node.textContent=value;}
  function routeEnable(node){if(!node)return;if(node.disabled)node.disabled=false;if(node.getAttribute("aria-disabled")==="true")node.setAttribute("aria-disabled","false");}
  function routeDecorate(){
    if(!routeReady())return false;
    const continueButton=routeButton("continueFromTransfers");
    if(continueButton){routeSetText(continueButton,"CONTINUE TO SHARED SEASON RESULTS");routeEnable(continueButton);if(continueButton.classList.contains("hidden"))continueButton.classList.remove("hidden");continueButton.dataset.sharedSeasonResultsRoute="true";}
    const dashboardButton=routeButton("seasonPrimaryAction"),status=routeButton("dashboardTransferStatus"),results=routeResults(),resultView=results&&typeof results.getState==="function"?results.getState():null;
    if(dashboardButton){const label=resultView?.state?.phase==="RESULTS_READY"?"VIEW SHARED SEASON RESULTS":resultView?.ownResult?"VIEW MY PUBLISHED RESULT":"ENTER SHARED SEASON RESULTS";routeSetText(dashboardButton,label);routeEnable(dashboardButton);dashboardButton.dataset.sharedSeasonResultsRoute="true";}
    if(status){const label=resultView?.state?.phase==="RESULTS_READY"?"Shared season results: both published":resultView?.ownResult?"Shared season results: waiting for rival":"Shared transfer challenge: complete · season results ready";routeSetText(status,label);}
    return true;
  }
  async function routeOpen(){
    if(!routeReady())return false;
    if(typeof root.loadRuntimeScript!=="function")throw new Error("Shared Season Results runtime loader is unavailable.");
    await root.loadRuntimeScript("ssjr-production-season-results","js/productionSharedSeasonResults.js",()=>root.CareerModeProductionSharedSeasonResults);
    const api=root.CareerModeProductionSharedSeasonResults;if(!api||typeof api.install!=="function"||typeof api.open!=="function")throw new Error("Shared Season Results production adapter is unavailable.");
    api.install();const opened=await api.open();routeDecorate();return opened;
  }
  function routeCapture(event){
    const target=event.target&&event.target.closest&&event.target.closest("button");
    if(!target||!CONTROL_IDS.includes(target.id)||!routeReady())return;
    event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();
    void routeOpen().catch(error=>{if(typeof root.reportApplicationError==="function")root.reportApplicationError("Unable to open Shared Season Results",error);else root.console?.error?.(error);});
  }
  function routeInstall(){
    if(installed)return true;installed=true;
    if(root.document){
      routeInstallEscapeStyle();root.document.addEventListener("click",routeCapture,true);
      if(typeof root.MutationObserver==="function"){
        observer=new root.MutationObserver(()=>routeDecorate());
        for(const id of CONTROL_IDS){const button=routeButton(id);if(button)observer.observe(button,{attributes:true,childList:true,subtree:true,attributeFilter:["disabled","class","aria-disabled"]});}
      }
      routeDecorate();
    }
    return true;
  }
  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-results-route",productionEnabled:true,preservesTransferRuntime:true,requiresCompletedSharedTransfer:true,directDashboardRoute:true,sharedReviewEscape:true,idempotentDecoration:true,canonicalStorageMutation:false,authoritativeScoring:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,install:routeInstall,decorate:routeDecorate,open:routeOpen,canRoute:routeReady});
});