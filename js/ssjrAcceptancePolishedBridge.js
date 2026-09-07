(function(root){
  "use strict";

  const enabled=!!(root.location&&new URLSearchParams(root.location.search).get("ssjr-acceptance")==="1");
  const PROPERTY="CareerModeProductionSharedShowdownSetup";
  const WRAPPED=Symbol("ssjrAcceptancePolishedSetupBridge");
  let installed=false;

  async function ssjrabPolishedOpen(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
    if(!root.CareerModeProductionSharedShowdownPresentation){
      if(typeof root.loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");
      await root.loadRuntimeScript("ssjr-polished-presentation","js/productionSharedShowdownPresentation.js",()=>root.CareerModeProductionSharedShowdownPresentation);
    }
    const presentation=root.CareerModeProductionSharedShowdownPresentation;
    if(!presentation||typeof presentation.activate!=="function")throw new Error("Shared Showdown polished presentation is unavailable.");
    const engineering=root.document&&root.document.getElementById("productionSharedSetupOverlay");
    if(engineering)engineering.classList.add("hidden");
    return presentation.activate();
  }

  function ssjrabWrap(api){
    if(!api||typeof api!=="object"||api[WRAPPED])return api;
    const wrapper={...api,openEngineeringPanel:typeof api.openPanel==="function"?api.openPanel.bind(api):null,openPanel:ssjrabPolishedOpen};
    Object.defineProperty(wrapper,WRAPPED,{value:true});
    return Object.freeze(wrapper);
  }

  function ssjrabInstall(){
    if(installed||!enabled)return true;
    installed=true;
    const descriptor=Object.getOwnPropertyDescriptor(root,PROPERTY);
    if(root[PROPERTY]){
      try{root[PROPERTY]=ssjrabWrap(root[PROPERTY]);return true;}catch(_error){}
    }
    if(!descriptor||descriptor.configurable!==false){
      let current=descriptor&&typeof descriptor.get==="function"?descriptor.get.call(root):descriptor&&Object.hasOwn(descriptor,"value")?descriptor.value:null;
      current=ssjrabWrap(current);
      Object.defineProperty(root,PROPERTY,{configurable:true,enumerable:true,get(){return current;},set(value){current=ssjrabWrap(value);}});
      return true;
    }
    return false;
  }

  const api=Object.freeze({contractVersion:1,feature:"ssjr-acceptance-polished-presentation-bridge",acceptanceOnly:true,engineeringPanelPlayerFacing:false,usesLeagueWheelScreen:true,usesClubPackRevealScreen:true,bothManagerRoles:true,billingRequired:false,install:ssjrabInstall,openPolishedSharedSetup:ssjrabPolishedOpen});
  root.CareerModeSSJRAcceptancePolishedBridge=api;
  ssjrabInstall();
})(typeof globalThis!=="undefined"?globalThis:this);
