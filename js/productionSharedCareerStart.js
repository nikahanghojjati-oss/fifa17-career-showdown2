(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedCareerStart=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PANEL_ID="productionSharedCareerStartOverlay";
  const CONTROL_ID="continueClubAssignment";
  const POLL_MS=1800;
  let installed=false,busy=false,pollTimer=null,setupApi=null,provider=null,view=null;

  function create(tag,className,text){const node=root.document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function report(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  async function loadScript(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");await root.loadRuntimeScript(key,path,ready);return ready();}
  async function ensureDependencies(){
    if(typeof root.loadRuntimeStyle==="function")await root.loadRuntimeStyle("ssjr-career-start","css/remoteJoining.css");
    await loadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await loadScript("ssjr-career-start-protocol","js/sharedCareerStart.js",()=>root.CareerModeSharedCareerStart);
    await loadScript("ssjr-career-start-provider","js/sparkSharedCareerStart.js",()=>root.CareerModeSparkSharedCareerStart);
    await loadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;provider=root.CareerModeSparkSharedCareerStart;
    if(!setupApi||typeof setupApi.getState!=="function"||typeof setupApi.refresh!=="function")throw new Error("Shared Setup authority is unavailable for Career Start.");
    if(!provider||typeof provider.read!=="function"||typeof provider.acknowledge!=="function")throw new Error("Shared Career Start provider is unavailable.");
  }
  function setupState(){try{return setupApi&&setupApi.getState?setupApi.getState():root.CareerModeProductionSharedShowdownSetup?.getState?.()||null;}catch(_error){return null;}}
  function confirmed(){const state=setupState();return Boolean(state&&state.ready===true&&state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"&&state.setup.revision===6&&state.managerRole&&state.rivalryId&&state.sessionId&&state.deviceId);}
  function leagueName(id){try{const item=typeof root.getLeagueById==="function"&&root.getLeagueById(id);if(item&&item.name)return item.name;}catch(_error){}return String(id||"").replaceAll("_"," ").replace(/\b\w/g,char=>char.toUpperCase());}
  function randomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")throw new Error("Secure randomness is unavailable.");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `career_start_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  async function providerOptions(){
    await ensureDependencies();await setupApi.refresh();const state=setupApi.getState();if(!state||state.ready!==true||!state.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||state.setup.revision!==6)throw new Error("Both managers must finish Shared Setup before Career Start.");
    const runtime=root.CareerModeProductionFirebaseRuntime,services=await runtime.ensureAccountServices();
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)throw new Error("Connected account services are unavailable.");
    return {state,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:state.rivalryId,sessionId:state.sessionId,deviceId:state.deviceId,cryptoImpl:root.crypto}};
  }
  async function refresh(){
    const ctx=await providerOptions(),result=await provider.read(ctx.options);if(!result||result.ok!==true)throw Object.assign(new Error("Career Start could not be read."),{code:result&&result.code});view={...result,setup:ctx.state.setup};render();decorateControl();return view;
  }
  async function acknowledge(){
    if(busy)return false;busy=true;render();try{const ctx=await providerOptions();const current=await provider.read(ctx.options);if(!current||current.ok!==true)throw Object.assign(new Error("Career Start could not be read."),{code:current&&current.code});const result=await provider.acknowledge({...ctx.options,operationId:randomOperationId(),baseRevision:current.revision||0});if(!result||result.ok!==true)throw Object.assign(new Error("Career Start acknowledgement was rejected."),{code:result&&result.code});view={...result,setup:ctx.state.setup};render();decorateControl();return true;}catch(error){report("Unable to acknowledge Shared Career Start",error);const status=root.document?.querySelector(`#${PANEL_ID} [data-career-status]`);if(status)status.textContent=`NOT RECORDED · ${error.code||error.message||"Try again."}`;return false;}finally{busy=false;render();}}
  function managerLabel(role){try{const showdown=typeof currentShowdown!=="undefined"?currentShowdown:null;const name=showdown&&showdown.managers&&showdown.managers[role];if(name)return name;}catch(_error){}return role==="playerOne"?"PLAYER ONE":"PLAYER TWO";}
  function row(label,value,state){const item=create("div","settingsInfoRow");item.dataset.careerRow=state||"";item.append(create("span","",label),create("strong","",value));return item;}
  function render(){
    const overlay=root.document&&root.document.getElementById(PANEL_ID);if(!overlay)return;const body=overlay.querySelector(".remoteJoiningBody");if(!body)return;body.replaceChildren();
    const setup=view&&view.setup||setupState()?.setup,role=view&&view.managerRole||setupState()?.managerRole,career=view&&view.state||null,acknowledged=new Set(career&&career.acknowledgedRoles||[]);if(!setup||!role){body.append(create("h2","","CAREER START"),create("p","","Resolving the confirmed Shared Showdown…"));return;}
    const ownClub=setup.clubs[role],otherRole=role==="playerOne"?"playerTwo":"playerOne",otherClub=setup.clubs[otherRole],ready=career&&career.phase==="CAREER_START_READY",mine=acknowledged.has(role);
    body.append(create("span","remoteJoiningEyebrow","SHARED SHOWDOWN · CAREER START"),create("h2","","START YOUR FIFA 17 CAREER"),create("p","",`Your permanent club is ${ownClub}. Start or load a FIFA 17 Career Mode save with that club. This website cannot inspect FIFA 17, so your acknowledgement is the shared record that you reached your matching career.`));
    const grid=create("div","settingsInfoGrid");grid.append(row("YOU",`${managerLabel(role)} · ${ownClub}`,mine?"ready":"pending"),row("RIVAL",`${managerLabel(otherRole)} · ${otherClub}`,acknowledged.has(otherRole)?"ready":"pending"),row("LEAGUE",leagueName(setup.leagueId)),row("SHOWDOWN LENGTH",`${setup.totalSeasons} SEASON${setup.totalSeasons===1?"":"S"}`));body.append(grid);
    const status=create("p","remoteJoiningStatus",ready?"BOTH MANAGERS STARTED ✓ · Career Start is shared and ready for the next Showdown step.":mine?"YOUR CAREER IS ACKNOWLEDGED · Waiting for your rival to start their assigned career.":"When your FIFA 17 career is created or loaded at the assigned club, confirm below.");status.dataset.careerStatus="true";status.setAttribute("role","status");status.setAttribute("aria-live","polite");body.append(status);
    const actions=create("div","remoteJoiningActions");const confirm=create("button","compactButton",ready?"BOTH MANAGERS READY ✓":mine?"MY CAREER STARTED ✓":`I STARTED AT ${String(ownClub).toUpperCase()}`);confirm.type="button";confirm.disabled=busy||mine||ready;confirm.addEventListener("click",()=>void acknowledge());actions.append(confirm);const refreshButton=create("button","compactButton","REFRESH");refreshButton.type="button";refreshButton.disabled=busy;refreshButton.addEventListener("click",()=>void refresh().catch(error=>report("Unable to refresh Shared Career Start",error)));actions.append(refreshButton);body.append(actions);
  }
  async function openPanel(){
    await ensureDependencies();let overlay=root.document.getElementById(PANEL_ID);if(!overlay){overlay=create("div","remoteJoiningOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Shared Career Start");const shell=create("div","remoteJoiningShell"),header=create("div","remoteJoiningHeader");header.append(create("strong","","CAREER MODE SHOWDOWN // 17"));const close=create("button","remoteJoiningDismiss","×");close.type="button";close.setAttribute("aria-label","Close Career Start");close.addEventListener("click",closePanel);header.append(close);const body=create("div","remoteJoiningBody");shell.append(header,body);overlay.append(shell);root.document.body.append(overlay);}overlay.classList.remove("hidden");render();await refresh();return true;
  }
  function closePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay)overlay.classList.add("hidden");return true;}
  function decorateControl(){const button=root.document&&root.document.getElementById(CONTROL_ID);if(!button)return false;if(!confirmed())return false;button.textContent="CONTINUE TO CAREER START";button.disabled=false;button.classList.remove("hidden");button.setAttribute("aria-disabled","false");button.dataset.sharedCareerStart="true";return true;}
  function capture(event){const button=event.target&&event.target.closest&&event.target.closest(`#${CONTROL_ID}`);if(!button||button.dataset.sharedCareerStart!=="true"||!confirmed())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();void openPanel().catch(error=>report("Unable to open Shared Career Start",error));}
  async function tick(){try{if(!setupApi&&root.CareerModeProductionSharedShowdownSetup)setupApi=root.CareerModeProductionSharedShowdownSetup;decorateControl();const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay&&!overlay.classList.contains("hidden")&&confirmed()&&!busy)await refresh();}catch(_error){}}
  function install(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",capture,true);const observer=new MutationObserver(()=>decorateControl());observer.observe(root.document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["disabled","class"]});}if(typeof root.setInterval==="function")pollTimer=root.setInterval(()=>void tick(),POLL_MS);void ensureDependencies().then(()=>tick()).catch(()=>{});return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-career-start",productionEnabled:true,requiresConfirmedSharedSetup:true,requiresExactActiveSession:true,twoManagerAcknowledgement:true,canonicalStorageMutation:false,billingRequired:false,install,openPanel,closePanel,refresh,getState:()=>view});
});
