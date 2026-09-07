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
  let installed=false,active=false,setupApi=null,unsubscribe=null,state=null,busy=false;
  let timers=[];

  function pending(){
    const entry=root.CareerModeProductionSharedJourneyEntry;
    if(entry&&typeof entry.isPending==="function")return entry.isPending();
    try{return root.sessionStorage&&root.sessionStorage.getItem("careerModeShowdown.sharedJourneyPending.v1")==="1";}catch(_error){return false;}
  }
  function shell(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function managers(){const current=shell();return current&&current.managers?current.managers:{playerOne:"PLAYER ONE",playerTwo:"PLAYER TWO"};}
  function phaseAtLeast(phase){return Boolean(state&&state.setup&&Object.hasOwn(PHASE_INDEX,state.setup.phase)&&PHASE_INDEX[state.setup.phase]>=PHASE_INDEX[phase]);}
  function coordinator(){return Boolean(state&&state.setup&&state.managerRole===state.setup.coordinatorRole);}
  function leagueRecord(id){
    try{if(typeof root.getLeagueById==="function")return root.getLeagueById(id);}catch(_error){}
    try{if(typeof getLeagueById==="function")return getLeagueById(id);}catch(_error){}
    return id?{id,name:String(id).replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}:null;
  }
  function text(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function clearTimers(){for(const timer of timers)root.clearTimeout(timer);timers=[];}
  function later(fn,ms){const id=root.setTimeout(()=>{timers=timers.filter(item=>item!==id);fn();},ms);timers.push(id);return id;}
  async function loadScript(key,path,ready){
    if(ready())return ready();
    if(typeof root.loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");
    await root.loadRuntimeScript(key,path,ready);return ready();
  }
  async function ensureSetup(){
    if(setupApi)return setupApi;
    await loadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    setupApi=root.CareerModeProductionSharedShowdownSetup;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.mutate!=="function"||typeof setupApi.subscribe!=="function")throw new Error("Authoritative Shared Setup is unavailable.");
    if(!unsubscribe)unsubscribe=setupApi.subscribe(next=>{state=next;void renderCurrent();});
    state=setupApi.getState();
    return setupApi;
  }
  async function ensureGameplay(){
    if(typeof root.ensureGameplayModules!=="function")throw new Error("Gameplay presentation loader is unavailable.");
    await root.ensureGameplayModules();
    if(typeof root.ensureRequiredFootballVisualExperience==="function")await root.ensureRequiredFootballVisualExperience();
  }
  function activeScreen(){
    try{if(typeof root.getActiveScreenName==="function")return root.getActiveScreenName();}catch(_error){}
    return ["leagueWheelScreen","clubWheelScreen"].find(id=>{const el=root.document&&root.document.getElementById(id);return el&&!el.classList.contains("hidden");})||null;
  }
  function forceScreen(id){
    if(!root.document)return false;
    const target=root.document.getElementById(id);if(!target)return false;
    for(const candidate of ["mainMenu","createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary","statistics","careerStatistics","trophyRoom","legacy","ruleBook"]){
      const el=root.document.getElementById(candidate);if(!el)continue;
      const show=candidate===id;el.classList.toggle("hidden",!show);el.setAttribute("aria-hidden",show?"false":"true");
    }
    const heading=target.querySelector("h2");if(heading){if(!heading.id)heading.id=`${id}ScreenTitle`;heading.setAttribute("tabindex","-1");target.setAttribute("aria-labelledby",heading.id);try{heading.focus({preventScroll:true});}catch(_error){}}
    const main=root.document.querySelector("main");if(main)main.scrollTop=0;
    if(typeof root.prepareFootballVisualScreen==="function")root.prepareFootballVisualScreen(id);
    return true;
  }
  function setSharedStatus(message){
    let node=root.document&&root.document.getElementById(STATUS_ID);
    const screen=root.document&&root.document.getElementById(activeScreen());
    if(!screen)return;
    if(!node){node=root.document.createElement("p");node.id=STATUS_ID;node.className="stateNote";node.setAttribute("role","status");node.setAttribute("aria-live","polite");const container=screen.querySelector(".wheelContainer")||screen.querySelector(".clubAssignmentStage")||screen;container.insertBefore(node,container.firstChild);}
    text(node,message);
  }
  function removeForeignStatus(){const node=root.document&&root.document.getElementById(STATUS_ID);if(node&&node.closest(`#${activeScreen()}`)==null)node.remove();}
  function setControl(button,{label,disabled=false,hidden=false}={}){if(!button)return;button.disabled=Boolean(disabled);button.classList.toggle("hidden",Boolean(hidden));button.setAttribute("aria-disabled",String(Boolean(disabled)));if(label)text(button,label);delete button.dataset.sharedJourneyLocked;button.removeAttribute("title");}
  function renderLeague(){
    if(!root.document||!pending())return false;removeForeignStatus();
    const result=root.document.getElementById("selectedLeague"),button=root.document.getElementById("spinLeague"),note=root.document.getElementById("leagueStateNote"),wheel=root.document.getElementById("leagueWheel"),track=wheel&&wheel.querySelector(".wheelTrack");
    if(!button||!result)return false;
    const ready=Boolean(state&&state.ready);
    if(!ready){text(result,"Pair managers to unlock the league wheel");setControl(button,{label:"PAIR + ACTIVATE SESSION FIRST",disabled:true});if(note){text(note,state&&state.message||"Exact pairing and an ACTIVE private session are required before the wheel can spin.");note.classList.remove("hidden");}return true;}
    if(!state.setup){text(result,"Shared league wheel ready");setControl(button,{label:state.remoteRole==="host"?"SPIN SHARED LEAGUE WHEEL":"WAITING FOR HOST",disabled:state.remoteRole!=="host"});setSharedStatus(state.remoteRole==="host"?"PAIRING + ACTIVE SESSION VERIFIED · Spin the real league wheel to open the shared setup and draw one authoritative league.":"PAIRING + ACTIVE SESSION VERIFIED · Waiting for the host to spin the shared league wheel.");return true;}
    if(state.setup.phase==="SHARED_SETUP_OPEN"){text(result,"Spin to reveal the shared league");setControl(button,{label:coordinator()?"SPIN SHARED LEAGUE WHEEL":"WAITING FOR HOST SPIN",disabled:!coordinator()});setSharedStatus("AUTHORITATIVE SHARED SETUP OPEN · The next wheel spin is provider-owned and identical for both managers.");return true;}
    const league=leagueRecord(state.setup.leagueId);text(result,league&&league.name||state.setup.leagueId);
    if(track&&track.dataset.sharedLeagueId!==state.setup.leagueId){
      const rotation=typeof root.getLeagueRotation==="function"?root.getLeagueRotation(state.setup.leagueId,6):(typeof getLeagueRotation==="function"?getLeagueRotation(state.setup.leagueId,6):0);
      if(typeof root.setLeagueWheelTransition==="function")root.setLeagueWheelTransition(track,4000);else track.style.transition="transform 4000ms cubic-bezier(.16,.76,.16,1)";
      track.style.transform=`rotate(${rotation}deg)`;track.dataset.sharedLeagueId=state.setup.leagueId;
      later(()=>{const finalRotation=typeof root.getLeagueRotation==="function"?root.getLeagueRotation(state.setup.leagueId,0):(typeof getLeagueRotation==="function"?getLeagueRotation(state.setup.leagueId,0):rotation);if(typeof root.setLeagueWheelTransition==="function")root.setLeagueWheelTransition(track,0);else track.style.transition="none";track.style.transform=`rotate(${finalRotation}deg)`;},4100);
    }
    setControl(button,{label:"CONTINUE TO CLUB PACKS",disabled:false});
    if(note){text(note,`${league&&league.name||state.setup.leagueId} is authoritative and locked for both managers. Continue to the club-pack reveal.`);note.classList.remove("hidden");}
    setSharedStatus("LEAGUE LOCKED FOR BOTH MANAGERS · No reroll. Continue to the original two-pack club reveal.");return true;
  }
  function resetPackCards(){
    if(typeof root.resetClubRevealCards==="function")root.resetClubRevealCards();
    else for(const [cardId,nameId,stateId] of [["clubCardOne","clubNameOne","clubCardStateOne"],["clubCardTwo","clubNameTwo","clubCardStateTwo"]]){const card=root.document.getElementById(cardId),name=root.document.getElementById(nameId),stateNode=root.document.getElementById(stateId);if(card)card.classList.remove("is-revealed");text(name,"?");text(stateNode,"SEALED");}
  }
  function revealCard(which,name){
    const card=root.document.getElementById(which===1?"clubCardOne":"clubCardTwo"),nameNode=root.document.getElementById(which===1?"clubNameOne":"clubNameTwo"),stateNode=root.document.getElementById(which===1?"clubCardStateOne":"clubCardStateTwo");
    if(typeof root.applyClubRevealCard==="function")root.applyClubRevealCard(card,nameNode,stateNode,name);
    else{text(nameNode,name);text(stateNode,"REVEALED");if(card)card.classList.add("is-revealed");if(typeof root.applyClubIdentity==="function")root.applyClubIdentity(nameNode,name);}
  }
  function ensureSeasonPanel(){
    const screen=root.document&&root.document.getElementById("clubWheelScreen");if(!screen)return null;
    let panel=root.document.getElementById(SEASON_PANEL_ID);if(panel)return panel;
    panel=root.document.createElement("section");panel.id=SEASON_PANEL_ID;panel.className="clubRivalryConfirmation sharedShowdownSeasonPanel";
    const eyebrow=root.document.createElement("span");eyebrow.className="screenEyebrow";eyebrow.textContent="SHARED SHOWDOWN · FINAL SETUP";
    const heading=root.document.createElement("h3");heading.textContent="CHOOSE SEASON LENGTH";
    const copy=root.document.createElement("p");copy.className="stateNote";copy.dataset.sharedSeasonCopy="true";
    const choices=root.document.createElement("div");choices.className="sharedSeasonChoices";
    for(const seasons of LENGTHS){const button=root.document.createElement("button");button.type="button";button.className="compactButton";button.dataset.sharedSeason=String(seasons);button.textContent=`${seasons} SEASON${seasons===1?"":"S"}`;button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();void chooseSeason(seasons);});choices.append(button);}
    panel.append(eyebrow,heading,copy,choices);const confirmation=root.document.getElementById("clubRivalryConfirmation");if(confirmation)confirmation.insertAdjacentElement("afterend",panel);else screen.append(panel);return panel;
  }
  function fillConfirmation(setup){
    const m=managers(),league=leagueRecord(setup.leagueId),confirmation=root.document.getElementById("clubRivalryConfirmation");if(confirmation)confirmation.classList.remove("hidden");
    text(root.document.getElementById("clubConfirmationShowdown"),(shell()&&shell().name)||"SHARED SHOWDOWN");
    text(root.document.getElementById("clubConfirmationMeta"),`${league&&league.name||setup.leagueId}${setup.totalSeasons?` · ${setup.totalSeasons} season${setup.totalSeasons===1?"":"s"}`:""} · SHARED`);
    text(root.document.getElementById("clubConfirmationManagerOne"),m.playerOne||"PLAYER ONE");text(root.document.getElementById("clubConfirmationManagerTwo"),m.playerTwo||"PLAYER TWO");
    text(root.document.getElementById("clubConfirmationClubOne"),setup.clubs&&setup.clubs.playerOne||"?");text(root.document.getElementById("clubConfirmationClubTwo"),setup.clubs&&setup.clubs.playerTwo||"?");
    if(typeof root.applyClubIdentity==="function"&&setup.clubs){root.applyClubIdentity(root.document.getElementById("clubConfirmationClubOne"),setup.clubs.playerOne);root.applyClubIdentity(root.document.getElementById("clubConfirmationClubTwo"),setup.clubs.playerTwo);}
  }
  function animatePacks(setup){
    if(!setup||!setup.clubs)return;const screen=root.document.getElementById("clubWheelScreen");if(!screen)return;
    if(screen.dataset.sharedPackDigest===`${setup.clubs.playerOne}|${setup.clubs.playerTwo}`){revealCard(1,setup.clubs.playerOne);revealCard(2,setup.clubs.playerTwo);return;}
    clearTimers();screen.dataset.sharedPackDigest=`${setup.clubs.playerOne}|${setup.clubs.playerTwo}`;resetPackCards();if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("opening");text(root.document.getElementById("clubPackStatus"),"AUTHORITATIVE CLUB DRAW LOCKED · OPENING PACK 01");
    const reduced=typeof root.isReducedClubMotionPreferred==="function"&&root.isReducedClubMotionPreferred();
    if(reduced){revealCard(1,setup.clubs.playerOne);revealCard(2,setup.clubs.playerTwo);if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("confirmation");fillConfirmation(setup);return;}
    later(()=>{revealCard(1,setup.clubs.playerOne);if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("manager-one");text(root.document.getElementById("clubPackStatus"),`${String(managers().playerOne||"PLAYER ONE").toUpperCase()} · PACK 01 OPEN`);},650);
    later(()=>{revealCard(2,setup.clubs.playerTwo);if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("manager-two");text(root.document.getElementById("clubPackStatus"),`${String(managers().playerTwo||"PLAYER TWO").toUpperCase()} · PACK 02 OPEN`);},1750);
    later(()=>{if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("confirmation");fillConfirmation(setup);text(root.document.getElementById("clubPackStatus"),"BOTH CLUBS REVEALED · SHARED RIVALRY LOCKED");renderClub();},3000);
  }
  function renderSeasonControls(setup){
    const panel=ensureSeasonPanel();if(!panel)return;const copy=panel.querySelector("[data-shared-season-copy]"),choices=Array.from(panel.querySelectorAll("[data-shared-season]"));
    if(setup.phase==="CLUB_ASSIGNMENTS_COMMITTED"){panel.classList.remove("hidden");text(copy,coordinator()?"Choose how many seasons this shared rivalry will run. This choice locks for both managers.":"Waiting for the coordinator to choose 1, 3, 5, or 10 seasons.");for(const button of choices){button.classList.remove("hidden");button.disabled=!coordinator()||busy;}return;}
    if(phaseAtLeast("SEASON_LENGTH_COMMITTED")){panel.classList.remove("hidden");text(panel.querySelector("h3"),`${setup.totalSeasons} SEASON${setup.totalSeasons===1?"":"S"} LOCKED`);text(copy,"Season length is authoritative and identical for both managers.");for(const button of choices)button.classList.add("hidden");return;}
    panel.classList.add("hidden");
  }
  function renderConfirmButton(setup){
    const button=root.document.getElementById("continueClubAssignment");if(!button)return;
    if(setup.phase==="SEASON_LENGTH_COMMITTED"){const confirmed=setup.confirmedRoles.includes(state.managerRole);setControl(button,{label:confirmed?"CONFIRMED · WAITING FOR RIVAL":"CONFIRM SHARED SHOWDOWN",disabled:confirmed||busy,hidden:false});return;}
    if(setup.phase==="SHOWDOWN_CONFIRMED"){setControl(button,{label:"SHARED SHOWDOWN READY ✓",disabled:true,hidden:false});return;}
    setControl(button,{label:"CONFIRM SHARED SHOWDOWN",disabled:true,hidden:true});
  }
  function renderClub(){
    if(!root.document||!pending())return false;removeForeignStatus();const setup=state&&state.setup;if(!setup||!phaseAtLeast("LEAGUE_WHEEL_COMMITTED"))return false;
    const league=leagueRecord(setup.leagueId),m=managers();text(root.document.getElementById("clubAssignmentLeague"),league&&league.name||setup.leagueId);text(root.document.getElementById("clubPlayerOne"),m.playerOne||"PLAYER ONE");text(root.document.getElementById("clubPlayerTwo"),m.playerTwo||"PLAYER TWO");
    const open=root.document.getElementById("openClubPack"),back=root.document.getElementById("clubAssignmentBack");if(back){back.disabled=true;back.classList.add("hidden");}
    if(setup.phase==="LEAGUE_WHEEL_COMMITTED"){resetPackCards();const confirmation=root.document.getElementById("clubRivalryConfirmation");if(confirmation)confirmation.classList.add("hidden");const panel=root.document.getElementById(SEASON_PANEL_ID);if(panel)panel.classList.add("hidden");text(root.document.getElementById("clubPackStatus"),"LEAGUE LOCKED · TWO SHARED CLUB PACKS READY");setControl(open,{label:coordinator()?"OPEN SHOWDOWN PACKS":"WAITING FOR HOST PACK REVEAL",disabled:!coordinator()||busy,hidden:false});renderConfirmButton(setup);setSharedStatus("AUTHORITATIVE CLUB PACKS · The provider owns the club pair; these are the original reveal cards, not a replacement menu.");return true;}
    setControl(open,{label:"PACKS OPENED",disabled:true,hidden:true});animatePacks(setup);fillConfirmation(setup);renderSeasonControls(setup);renderConfirmButton(setup);
    if(setup.phase==="SHOWDOWN_CONFIRMED"){text(root.document.getElementById("clubPackStatus"),"SHARED SHOWDOWN CONFIRMED · BOTH MANAGERS READY");setSharedStatus("SHARED SETUP COMPLETE · League, clubs and season length are locked identically for both managers. No redraw or reroll.");}
    else if(setup.phase==="SEASON_LENGTH_COMMITTED")setSharedStatus("FINAL CONFIRMATION · Each manager confirms this exact rivalry on their own device.");
    else setSharedStatus("CLUBS LOCKED · Choose the shared season length below, then each manager confirms.");return true;
  }
  async function renderCurrent(){if(!active||!pending())return false;const screen=activeScreen();if(screen==="leagueWheelScreen")return renderLeague();if(screen==="clubWheelScreen")return renderClub();return false;}
  function routeForState(){return state&&state.setup&&phaseAtLeast("LEAGUE_WHEEL_COMMITTED")?"clubWheelScreen":"leagueWheelScreen";}
  async function route(){await ensureGameplay();forceScreen(routeForState());await renderCurrent();return true;}
  async function refresh(){const api=await ensureSetup(),result=await api.refresh();state=api.getState();await renderCurrent();return result;}
  async function mutate(type,extra){if(busy)return false;busy=true;try{const api=await ensureSetup(),result=await api.mutate(type,extra||{});state=api.getState();await route();return result&&result.ok===true;}finally{busy=false;await renderCurrent();}}
  async function chooseSeason(seasons){if(!active||!pending()||!coordinator()||!state.setup||state.setup.phase!=="CLUB_ASSIGNMENTS_COMMITTED")return false;return mutate("commit-length",{totalSeasons:Number(seasons)});}
  function handlesControl(id){return active&&pending()&&HANDLED.has(id);}
  async function handleControlClick(id){
    if(!handlesControl(id))return false;await ensureSetup();
    if(id==="spinLeague"){
      if(!state.ready){await refresh();return true;}
      if(!state.setup){if(state.remoteRole!=="host"){await refresh();return true;}if(!await mutate("open"))return true;}
      if(state.setup&&state.setup.phase==="SHARED_SETUP_OPEN"){if(coordinator())await mutate("commit-league");else await refresh();return true;}
      if(phaseAtLeast("LEAGUE_WHEEL_COMMITTED")){forceScreen("clubWheelScreen");await renderCurrent();return true;}return true;
    }
    if(id==="openClubPack"){if(state.setup&&state.setup.phase==="LEAGUE_WHEEL_COMMITTED"){if(coordinator())await mutate("commit-clubs");else await refresh();return true;}await refresh();return true;}
    if(id==="continueClubAssignment"){if(state.setup&&state.setup.phase==="SEASON_LENGTH_COMMITTED"&&!state.setup.confirmedRoles.includes(state.managerRole)){await mutate("confirm");return true;}await refresh();return true;}
    return false;
  }
  async function activate(){active=true;await ensureGameplay();await ensureSetup();await refresh();const plain=root.document&&root.document.getElementById("productionSharedSetupOverlay");if(plain)plain.classList.add("hidden");return route();}
  function deactivate(){active=false;clearTimers();const panel=root.document&&root.document.getElementById(SEASON_PANEL_ID);if(panel)panel.remove();const note=root.document&&root.document.getElementById(STATUS_ID);if(note)note.remove();return true;}
  function install(){if(installed)return true;installed=true;return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-showdown-polished-presentation",productionEnabled:true,pairingRequired:true,exactActiveSessionRequired:true,providerOwnsDrawAuthority:true,usesLeagueWheelScreen:true,usesClubPackRevealScreen:true,engineeringSetupPanelPlayerFacing:false,localRandomLeagueAuthority:false,localRandomClubAuthority:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,appCheckEnforcementRequired:false,install,activate,deactivate,refresh,handleControlClick,handlesControl,renderCurrent,isPresentationActive:()=>active&&pending(),getState:()=>Object.freeze({active:active&&pending(),phase:state&&state.setup&&state.setup.phase||null,revision:state&&state.setup&&state.setup.revision||0,managerRole:state&&state.managerRole||null,route:routeForState()})});
});