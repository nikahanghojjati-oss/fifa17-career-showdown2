(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedShowdownPresentation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PHASE_INDEX=Object.freeze({SHARED_SETUP_OPEN:0,LEAGUE_WHEEL_COMMITTED:1,CLUB_ASSIGNMENTS_COMMITTED:2,SEASON_LENGTH_COMMITTED:3,SHOWDOWN_CONFIRMED:4});
  const LENGTHS=Object.freeze([1,3,5,10]);
  const HANDLED=new Set(["spinLeague","openClubPack","continueClubAssignment"]);
  const SEASON_PANEL_ID="sharedShowdownSeasonChoice";
  const STATUS_ID="sharedShowdownPresentationStatus";
  const POLL_MS=2500;
  let installed=false,active=false,setupApi=null,unsubscribe=null,state=null,busy=false,pollBusy=false,pollTimer=null;
  let timers=[];
  let witnessedLeagueId=null;
  let witnessedClubDigest=null;
  let clubRevealComplete=false;

  function ssjpPending(){
    const entry=root.CareerModeProductionSharedJourneyEntry;
    if(entry&&typeof entry.isPending==="function")return entry.isPending();
    try{return root.sessionStorage&&root.sessionStorage.getItem("careerModeShowdown.sharedJourneyPending.v1")==="1";}catch(_error){return false;}
  }
  function ssjpShell(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function ssjpManagers(){const current=ssjpShell();return current&&current.managers?current.managers:{playerOne:"PLAYER ONE",playerTwo:"PLAYER TWO"};}
  function ssjpPhaseAtLeast(phase){return Boolean(state&&state.setup&&Object.hasOwn(PHASE_INDEX,state.setup.phase)&&PHASE_INDEX[state.setup.phase]>=PHASE_INDEX[phase]);}
  function ssjpCoordinator(){return Boolean(state&&state.setup&&state.managerRole===state.setup.coordinatorRole);}
  function ssjpLeagueRecord(id){
    try{if(typeof root.getLeagueById==="function")return root.getLeagueById(id);}catch(_error){}
    try{if(typeof getLeagueById==="function")return getLeagueById(id);}catch(_error){}
    return id?{id,name:String(id).replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}:null;
  }
  function ssjpText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function ssjpClearTimers(){for(const timer of timers)root.clearTimeout(timer);timers=[];}
  function ssjpLater(fn,ms){const id=root.setTimeout(()=>{timers=timers.filter(item=>item!==id);fn();},ms);timers.push(id);return id;}
  async function ssjpLoadScript(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");await root.loadRuntimeScript(key,path,ready);return ready();}
  async function ssjpEnsureSetup(){
    if(setupApi)return setupApi;
    await ssjpLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    setupApi=root.CareerModeProductionSharedShowdownSetup;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.mutate!=="function"||typeof setupApi.subscribe!=="function")throw new Error("Authoritative Shared Setup is unavailable.");
    if(!unsubscribe)unsubscribe=setupApi.subscribe(next=>{state=next;void ssjpRenderCurrent();});
    state=setupApi.getState();
    return setupApi;
  }
  async function ssjpEnsureGameplay(){if(typeof root.ensureGameplayModules!=="function")throw new Error("Gameplay presentation loader is unavailable.");await root.ensureGameplayModules();if(typeof root.ensureRequiredFootballVisualExperience==="function")await root.ensureRequiredFootballVisualExperience();}
  function ssjpActiveScreen(){
    try{if(typeof root.getActiveScreenName==="function")return root.getActiveScreenName();}catch(_error){}
    return ["leagueWheelScreen","clubWheelScreen"].find(id=>{const el=root.document&&root.document.getElementById(id);return el&&!el.classList.contains("hidden");})||null;
  }
  function ssjpForceScreen(id){
    if(!root.document)return false;const target=root.document.getElementById(id);if(!target)return false;
    for(const candidate of ["mainMenu","createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary","statistics","careerStatistics","trophyRoom","legacy","ruleBook"]){const el=root.document.getElementById(candidate);if(!el)continue;const show=candidate===id;el.classList.toggle("hidden",!show);el.setAttribute("aria-hidden",show?"false":"true");}
    const heading=target.querySelector("h2");if(heading){if(!heading.id)heading.id=`${id}ScreenTitle`;heading.setAttribute("tabindex","-1");target.setAttribute("aria-labelledby",heading.id);try{heading.focus({preventScroll:true});}catch(_error){}}
    const main=root.document.querySelector("main");if(main)main.scrollTop=0;if(typeof root.prepareFootballVisualScreen==="function")root.prepareFootballVisualScreen(id);return true;
  }
  function ssjpSetSharedStatus(message){
    let node=root.document&&root.document.getElementById(STATUS_ID);const screen=root.document&&root.document.getElementById(ssjpActiveScreen());if(!screen)return;
    if(!node){node=root.document.createElement("p");node.id=STATUS_ID;node.className="stateNote";node.setAttribute("role","status");node.setAttribute("aria-live","polite");const container=screen.querySelector(".wheelContainer")||screen.querySelector(".clubAssignmentStage")||screen;container.insertBefore(node,container.firstChild);}ssjpText(node,message);
  }
  function ssjpRemoveForeignStatus(){const node=root.document&&root.document.getElementById(STATUS_ID);if(node&&node.closest(`#${ssjpActiveScreen()}`)==null)node.remove();}
  function ssjpSetControl(button,{label,disabled=false,hidden=false}={}){if(!button)return;button.disabled=Boolean(disabled);button.classList.toggle("hidden",Boolean(hidden));button.setAttribute("aria-disabled",String(Boolean(disabled)));if(label)ssjpText(button,label);delete button.dataset.sharedJourneyLocked;button.removeAttribute("title");}
  function ssjpClubDigest(setup){return setup&&setup.clubs?`${setup.leagueId}|${setup.clubs.playerOne}|${setup.clubs.playerTwo}`:null;}

  function ssjpRenderLeague(){
    if(!root.document||!ssjpPending())return false;ssjpRemoveForeignStatus();
    const screen=root.document.getElementById("leagueWheelScreen"),result=root.document.getElementById("selectedLeague"),button=root.document.getElementById("spinLeague"),note=root.document.getElementById("leagueStateNote"),wheel=root.document.getElementById("leagueWheel"),track=wheel&&wheel.querySelector(".wheelTrack");
    if(!screen||!button||!result)return false;screen.dataset.sharedPresentationRole=state&&state.managerRole||"unresolved";
    const ready=Boolean(state&&state.ready);
    if(!ready){ssjpText(result,"Pair managers to unlock the league wheel");ssjpSetControl(button,{label:"PAIR + ACTIVATE SESSION FIRST",disabled:true});if(note){ssjpText(note,state&&state.message||"Exact pairing and an ACTIVE private session are required before the wheel can spin.");note.classList.remove("hidden");}return true;}
    if(!state.setup){ssjpText(result,"Shared league wheel ready");ssjpSetControl(button,{label:state.remoteRole==="host"?"SPIN SHARED LEAGUE WHEEL":"WAITING FOR HOST",disabled:state.remoteRole!=="host"});ssjpSetSharedStatus(state.remoteRole==="host"?"PAIRING + ACTIVE SESSION VERIFIED · Spin the league wheel. The provider owns the result.":"PAIRING + ACTIVE SESSION VERIFIED · Waiting for the host. This screen will update automatically.");return true;}
    if(state.setup.phase==="SHARED_SETUP_OPEN"){ssjpText(result,"Spin to reveal the shared league");ssjpSetControl(button,{label:ssjpCoordinator()?"SPIN SHARED LEAGUE WHEEL":"WAITING FOR HOST SPIN",disabled:!ssjpCoordinator()});ssjpSetSharedStatus(ssjpCoordinator()?"AUTHORITATIVE SHARED SETUP OPEN · Spin the real league wheel.":"AUTHORITATIVE SHARED SETUP OPEN · Waiting for the host spin. This screen will update automatically.");return true;}
    const league=ssjpLeagueRecord(state.setup.leagueId);ssjpText(result,league&&league.name||state.setup.leagueId);
    if(witnessedLeagueId!==state.setup.leagueId){
      witnessedLeagueId=state.setup.leagueId;screen.dataset.sharedLeagueWitnessed=state.setup.leagueId;
      if(track){const rotation=typeof root.getLeagueRotation==="function"?root.getLeagueRotation(state.setup.leagueId,6):(typeof getLeagueRotation==="function"?getLeagueRotation(state.setup.leagueId,6):0);if(typeof root.setLeagueWheelTransition==="function")root.setLeagueWheelTransition(track,4000);else track.style.transition="transform 4000ms cubic-bezier(.16,.76,.16,1)";track.style.transform=`rotate(${rotation}deg)`;track.dataset.sharedLeagueId=state.setup.leagueId;ssjpLater(()=>{const finalRotation=typeof root.getLeagueRotation==="function"?root.getLeagueRotation(state.setup.leagueId,0):(typeof getLeagueRotation==="function"?getLeagueRotation(state.setup.leagueId,0):rotation);if(typeof root.setLeagueWheelTransition==="function")root.setLeagueWheelTransition(track,0);else track.style.transition="none";track.style.transform=`rotate(${finalRotation}deg)`;},4100);}
    }
    ssjpSetControl(button,{label:"CONTINUE TO CLUB PACKS",disabled:false});if(note){ssjpText(note,`${league&&league.name||state.setup.leagueId} is authoritative and locked for both managers.`);note.classList.remove("hidden");}ssjpSetSharedStatus("LEAGUE REVEALED ON THIS DEVICE · Continue to the original club-pack screen. No reroll.");return true;
  }

  function ssjpResetPackCards(){if(typeof root.resetClubRevealCards==="function")root.resetClubRevealCards();else for(const [cardId,nameId,stateId] of [["clubCardOne","clubNameOne","clubCardStateOne"],["clubCardTwo","clubNameTwo","clubCardStateTwo"]]){const card=root.document.getElementById(cardId),name=root.document.getElementById(nameId),stateNode=root.document.getElementById(stateId);if(card)card.classList.remove("is-revealed");ssjpText(name,"?");ssjpText(stateNode,"SEALED");}}
  function ssjpRevealCard(which,name){const card=root.document.getElementById(which===1?"clubCardOne":"clubCardTwo"),nameNode=root.document.getElementById(which===1?"clubNameOne":"clubNameTwo"),stateNode=root.document.getElementById(which===1?"clubCardStateOne":"clubCardStateTwo");if(typeof root.applyClubRevealCard==="function")root.applyClubRevealCard(card,nameNode,stateNode,name);else{ssjpText(nameNode,name);ssjpText(stateNode,"REVEALED");if(card)card.classList.add("is-revealed");if(typeof root.applyClubIdentity==="function")root.applyClubIdentity(nameNode,name);}}
  function ssjpEnsureSeasonPanel(){
    const screen=root.document&&root.document.getElementById("clubWheelScreen");if(!screen)return null;let panel=root.document.getElementById(SEASON_PANEL_ID);if(panel)return panel;
    panel=root.document.createElement("section");panel.id=SEASON_PANEL_ID;panel.className="clubRivalryConfirmation sharedShowdownSeasonPanel";const eyebrow=root.document.createElement("span");eyebrow.className="screenEyebrow";eyebrow.textContent="SHARED SHOWDOWN · FINAL SETUP";const heading=root.document.createElement("h3");heading.textContent="CHOOSE SEASON LENGTH";const copy=root.document.createElement("p");copy.className="stateNote";copy.dataset.sharedSeasonCopy="true";const choices=root.document.createElement("div");choices.className="sharedSeasonChoices";
    for(const seasons of LENGTHS){const button=root.document.createElement("button");button.type="button";button.className="compactButton";button.dataset.sharedSeason=String(seasons);button.textContent=`${seasons} SEASON${seasons===1?"":"S"}`;button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();void ssjpChooseSeason(seasons);});choices.append(button);}panel.append(eyebrow,heading,copy,choices);const confirmation=root.document.getElementById("clubRivalryConfirmation");if(confirmation)confirmation.insertAdjacentElement("afterend",panel);else screen.append(panel);return panel;
  }
  function ssjpFillConfirmation(setup){const m=ssjpManagers(),league=ssjpLeagueRecord(setup.leagueId),confirmation=root.document.getElementById("clubRivalryConfirmation");if(confirmation)confirmation.classList.remove("hidden");ssjpText(root.document.getElementById("clubConfirmationShowdown"),(ssjpShell()&&ssjpShell().name)||"SHARED SHOWDOWN");ssjpText(root.document.getElementById("clubConfirmationMeta"),`${league&&league.name||setup.leagueId}${setup.totalSeasons?` · ${setup.totalSeasons} season${setup.totalSeasons===1?"":"s"}`:""} · SHARED`);ssjpText(root.document.getElementById("clubConfirmationManagerOne"),m.playerOne||"PLAYER ONE");ssjpText(root.document.getElementById("clubConfirmationManagerTwo"),m.playerTwo||"PLAYER TWO");ssjpText(root.document.getElementById("clubConfirmationClubOne"),setup.clubs&&setup.clubs.playerOne||"?");ssjpText(root.document.getElementById("clubConfirmationClubTwo"),setup.clubs&&setup.clubs.playerTwo||"?");if(typeof root.applyClubIdentity==="function"&&setup.clubs){root.applyClubIdentity(root.document.getElementById("clubConfirmationClubOne"),setup.clubs.playerOne);root.applyClubIdentity(root.document.getElementById("clubConfirmationClubTwo"),setup.clubs.playerTwo);}}
  function ssjpCompletePackWitness(setup){const digest=ssjpClubDigest(setup);witnessedClubDigest=digest;clubRevealComplete=true;const screen=root.document&&root.document.getElementById("clubWheelScreen");if(screen)screen.dataset.sharedClubPacksWitnessed=digest||"true";ssjpFillConfirmation(setup);void ssjpRenderClub();}
  function ssjpAnimatePacks(setup){
    if(!setup||!setup.clubs)return;const screen=root.document.getElementById("clubWheelScreen");if(!screen)return;const digest=ssjpClubDigest(setup);
    if(witnessedClubDigest===digest&&clubRevealComplete){ssjpRevealCard(1,setup.clubs.playerOne);ssjpRevealCard(2,setup.clubs.playerTwo);ssjpFillConfirmation(setup);return;}
    ssjpClearTimers();clubRevealComplete=false;screen.dataset.sharedPackDigest=digest;ssjpResetPackCards();if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("opening");ssjpText(root.document.getElementById("clubPackStatus"),"AUTHORITATIVE CLUB DRAW LOCKED · OPENING PACK 01");const reduced=typeof root.isReducedClubMotionPreferred==="function"&&root.isReducedClubMotionPreferred();
    if(reduced){ssjpRevealCard(1,setup.clubs.playerOne);ssjpRevealCard(2,setup.clubs.playerTwo);if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("confirmation");ssjpCompletePackWitness(setup);return;}
    ssjpLater(()=>{ssjpRevealCard(1,setup.clubs.playerOne);if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("manager-one");ssjpText(root.document.getElementById("clubPackStatus"),`${String(ssjpManagers().playerOne||"PLAYER ONE").toUpperCase()} · PACK 01 OPEN`);},650);
    ssjpLater(()=>{ssjpRevealCard(2,setup.clubs.playerTwo);if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("manager-two");ssjpText(root.document.getElementById("clubPackStatus"),`${String(ssjpManagers().playerTwo||"PLAYER TWO").toUpperCase()} · PACK 02 OPEN`);},1750);
    ssjpLater(()=>{if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("confirmation");ssjpText(root.document.getElementById("clubPackStatus"),"BOTH CLUBS REVEALED · SHARED RIVALRY LOCKED");ssjpCompletePackWitness(setup);},3000);
  }
  function ssjpRenderSeasonControls(setup){const panel=ssjpEnsureSeasonPanel();if(!panel)return;const copy=panel.querySelector("[data-shared-season-copy]"),choices=Array.from(panel.querySelectorAll("[data-shared-season]"));if(!clubRevealComplete){panel.classList.add("hidden");return;}if(setup.phase==="CLUB_ASSIGNMENTS_COMMITTED"){panel.classList.remove("hidden");ssjpText(copy,ssjpCoordinator()?"Choose how many seasons this shared rivalry will run. This locks for both managers.":"Waiting for the coordinator to choose 1, 3, 5, or 10 seasons.");for(const button of choices){button.classList.remove("hidden");button.disabled=!ssjpCoordinator()||busy;}return;}if(ssjpPhaseAtLeast("SEASON_LENGTH_COMMITTED")){panel.classList.remove("hidden");ssjpText(panel.querySelector("h3"),`${setup.totalSeasons} SEASON${setup.totalSeasons===1?"":"S"} LOCKED`);ssjpText(copy,"Season length is authoritative and identical for both managers.");for(const button of choices)button.classList.add("hidden");return;}panel.classList.add("hidden");}
  function ssjpRenderConfirmButton(setup){const button=root.document.getElementById("continueClubAssignment");if(!button)return;if(!clubRevealComplete){ssjpSetControl(button,{label:"WATCH BOTH PACK REVEALS",disabled:true,hidden:true});return;}if(setup.phase==="SEASON_LENGTH_COMMITTED"){const confirmed=setup.confirmedRoles.includes(state.managerRole);ssjpSetControl(button,{label:confirmed?"CONFIRMED · WAITING FOR RIVAL":"CONFIRM SHARED SHOWDOWN",disabled:confirmed||busy,hidden:false});return;}if(setup.phase==="SHOWDOWN_CONFIRMED"){ssjpSetControl(button,{label:"SHARED SHOWDOWN READY ✓",disabled:true,hidden:false});return;}ssjpSetControl(button,{label:"CONFIRM SHARED SHOWDOWN",disabled:true,hidden:true});}
  function ssjpRenderClub(){
    if(!root.document||!ssjpPending())return false;ssjpRemoveForeignStatus();const setup=state&&state.setup;if(!setup||!ssjpPhaseAtLeast("LEAGUE_WHEEL_COMMITTED"))return false;if(witnessedLeagueId!==setup.leagueId){ssjpForceScreen("leagueWheelScreen");return ssjpRenderLeague();}
    const screen=root.document.getElementById("clubWheelScreen"),league=ssjpLeagueRecord(setup.leagueId),m=ssjpManagers();if(!screen)return false;screen.dataset.sharedPresentationRole=state&&state.managerRole||"unresolved";ssjpText(root.document.getElementById("clubAssignmentLeague"),league&&league.name||setup.leagueId);ssjpText(root.document.getElementById("clubPlayerOne"),m.playerOne||"PLAYER ONE");ssjpText(root.document.getElementById("clubPlayerTwo"),m.playerTwo||"PLAYER TWO");const open=root.document.getElementById("openClubPack"),back=root.document.getElementById("clubAssignmentBack");if(back){back.disabled=true;back.classList.add("hidden");}
    if(setup.phase==="LEAGUE_WHEEL_COMMITTED"){clubRevealComplete=false;witnessedClubDigest=null;ssjpResetPackCards();const confirmation=root.document.getElementById("clubRivalryConfirmation");if(confirmation)confirmation.classList.add("hidden");const panel=root.document.getElementById(SEASON_PANEL_ID);if(panel)panel.classList.add("hidden");ssjpText(root.document.getElementById("clubPackStatus"),"LEAGUE LOCKED · TWO SHARED CLUB PACKS READY");ssjpSetControl(open,{label:ssjpCoordinator()?"OPEN SHOWDOWN PACKS":"WAITING FOR HOST PACK REVEAL",disabled:!ssjpCoordinator()||busy,hidden:false});ssjpRenderConfirmButton(setup);ssjpSetSharedStatus(ssjpCoordinator()?"AUTHORITATIVE CLUB PACKS · Open the original two-pack reveal.":"AUTHORITATIVE CLUB PACKS · Waiting for the host. These packs will open automatically when the provider commits the clubs.");return true;}
    ssjpSetControl(open,{label:"PACKS OPENED",disabled:true,hidden:true});ssjpAnimatePacks(setup);ssjpFillConfirmation(setup);ssjpRenderSeasonControls(setup);ssjpRenderConfirmButton(setup);if(setup.phase==="SHOWDOWN_CONFIRMED")ssjpSetSharedStatus(clubRevealComplete?"SHARED SETUP COMPLETE · Both managers witnessed the league wheel and club packs on this device.":"SHARED SETUP COMPLETE IN AUTHORITY · Finish watching both pack reveals on this device.");else if(setup.phase==="SEASON_LENGTH_COMMITTED")ssjpSetSharedStatus(clubRevealComplete?"FINAL CONFIRMATION · Each manager confirms on their own device.":"WATCH BOTH CLUB PACK REVEALS · Confirmation unlocks after this device witnesses them.");else ssjpSetSharedStatus(clubRevealComplete?"CLUBS REVEALED · Choose the shared season length below.":"OPENING AUTHORITATIVE CLUB PACKS · Both managers see the same two reveals.");return true;
  }

  async function ssjpRenderCurrent(){if(!active||!ssjpPending())return false;const screen=ssjpActiveScreen();if(screen==="leagueWheelScreen")return ssjpRenderLeague();if(screen==="clubWheelScreen")return ssjpRenderClub();return false;}
  async function ssjpRefresh(){const api=await ssjpEnsureSetup(),result=await api.refresh();state=api.getState();await ssjpRenderCurrent();return result;}
  async function ssjpPoll(){if(!active||!ssjpPending()||busy||pollBusy||root.document&&root.document.visibilityState==="hidden")return;pollBusy=true;try{await ssjpRefresh();}catch(_error){}finally{pollBusy=false;}}
  function ssjpStartPolling(){if(pollTimer!==null||typeof root.setInterval!=="function")return;pollTimer=root.setInterval(()=>void ssjpPoll(),POLL_MS);}
  function ssjpStopPolling(){if(pollTimer!==null){root.clearInterval(pollTimer);pollTimer=null;}}
  async function ssjpMutate(type,extra){if(busy)return false;busy=true;try{const api=await ssjpEnsureSetup(),result=await api.mutate(type,extra||{});state=api.getState();await ssjpRenderCurrent();return result&&result.ok===true;}finally{busy=false;await ssjpRenderCurrent();}}
  async function ssjpChooseSeason(seasons){if(!active||!ssjpPending()||!clubRevealComplete||!ssjpCoordinator()||!state.setup||state.setup.phase!=="CLUB_ASSIGNMENTS_COMMITTED")return false;return ssjpMutate("commit-length",{totalSeasons:Number(seasons)});}
  function ssjpHandlesControl(id){return active&&ssjpPending()&&HANDLED.has(id);}
  async function ssjpHandleControlClick(id){
    if(!ssjpHandlesControl(id))return false;await ssjpEnsureSetup();
    if(id==="spinLeague"){
      if(!state.ready){await ssjpRefresh();return true;}
      if(!state.setup){if(state.remoteRole!=="host"){await ssjpRefresh();return true;}if(!await ssjpMutate("open"))return true;}
      if(state.setup&&state.setup.phase==="SHARED_SETUP_OPEN"){if(ssjpCoordinator())await ssjpMutate("commit-league");else await ssjpRefresh();return true;}
      if(state.setup&&ssjpPhaseAtLeast("LEAGUE_WHEEL_COMMITTED")){if(witnessedLeagueId!==state.setup.leagueId){await ssjpRenderLeague();return true;}ssjpForceScreen("clubWheelScreen");await ssjpRenderClub();return true;}return true;
    }
    if(id==="openClubPack"){if(state.setup&&state.setup.phase==="LEAGUE_WHEEL_COMMITTED"){if(ssjpCoordinator())await ssjpMutate("commit-clubs");else await ssjpRefresh();return true;}await ssjpRefresh();return true;}
    if(id==="continueClubAssignment"){if(!clubRevealComplete)return true;if(state.setup&&state.setup.phase==="SEASON_LENGTH_COMMITTED"&&!state.setup.confirmedRoles.includes(state.managerRole)){await ssjpMutate("confirm");return true;}await ssjpRefresh();return true;}
    return false;
  }
  async function ssjpActivate(){active=true;await ssjpEnsureGameplay();await ssjpEnsureSetup();await ssjpRefresh();const plain=root.document&&root.document.getElementById("productionSharedSetupOverlay");if(plain)plain.classList.add("hidden");ssjpForceScreen("leagueWheelScreen");await ssjpRenderLeague();ssjpStartPolling();return true;}
  function ssjpDeactivate(){active=false;ssjpStopPolling();ssjpClearTimers();const panel=root.document&&root.document.getElementById(SEASON_PANEL_ID);if(panel)panel.remove();const note=root.document&&root.document.getElementById(STATUS_ID);if(note)note.remove();return true;}
  function ssjpInstall(){if(installed)return true;installed=true;return true;}

  return Object.freeze({contractVersion:2,feature:"ssjr-production-shared-showdown-polished-presentation",productionEnabled:true,pairingRequired:true,exactActiveSessionRequired:true,providerOwnsDrawAuthority:true,bothManagerRolesWitnessLeagueWheel:true,bothManagerRolesWitnessClubPacks:true,peerAutoRefreshesAuthority:true,usesLeagueWheelScreen:true,usesClubPackRevealScreen:true,engineeringSetupPanelPlayerFacing:false,localRandomLeagueAuthority:false,localRandomClubAuthority:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,appCheckEnforcementRequired:false,install:ssjpInstall,activate:ssjpActivate,deactivate:ssjpDeactivate,refresh:ssjpRefresh,handleControlClick:ssjpHandleControlClick,handlesControl:ssjpHandlesControl,renderCurrent:ssjpRenderCurrent,isPresentationActive:()=>active&&ssjpPending(),getState:()=>Object.freeze({active:active&&ssjpPending(),phase:state&&state.setup&&state.setup.phase||null,revision:state&&state.setup&&state.setup.revision||0,managerRole:state&&state.managerRole||null,route:ssjpActiveScreen(),leagueWitnessed:witnessedLeagueId,clubPacksWitnessed:witnessedClubDigest,clubRevealComplete})});
});
