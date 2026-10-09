(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedShowdownPresentation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PHASE_INDEX=Object.freeze({SHARED_SETUP_OPEN:0,LEAGUE_WHEEL_COMMITTED:1,CLUB_ASSIGNMENTS_COMMITTED:2,SEASON_LENGTH_COMMITTED:3,SHOWDOWN_CONFIRMED:4});
  const LENGTHS=Object.freeze([1,3,5,10]);
  const SEASON_BY_CAPABILITY_NIBBLE=Object.freeze({1:1,3:3,5:5,a:10});
  const HANDLED=new Set(["spinLeague","openClubPack","continueClubAssignment"]);
  const SEASON_PANEL_ID="sharedShowdownSeasonChoice";
  const STATUS_ID="sharedShowdownPresentationStatus";
  const POLL_MS=2500;
  let installed=false,active=false,setupApi=null,unsubscribe=null,state=null,busy=false,pollBusy=false,pollTimer=null,preparedSeasonCommitPromise=null,actionPromise=null,presentationContextKey="",mutationPromise=null,lastMutationCode="",lastMutationMessage="",workingControlId="",tapFailure="",tapFailureCode="",tapFailureSignature="";
  let timers=[];
  let witnessedLeagueId=null;
  let witnessedClubDigest=null;
  let revealingClubDigest=null;
  let clubRevealComplete=false;
  let revealedSummaryClubs=0;
  const confirmationClubBaselines=new WeakMap();
  // Job 33: R3 the league reveal moves on to the club packs by itself after the 4.1 s wheel; R4a the first confirmer
  // opens Career Start by itself once the rival confirms. Both are navigation only (no provider write).
  const LEAGUE_AUTO_FORWARD_MS=4200;
  let autoCareerStartKey="";
  let leagueForwardWaiter=null;

  function ssjpPending(){
    const entry=root.CareerModeProductionSharedJourneyEntry;
    if(entry&&typeof entry.isPending==="function")return entry.isPending();
    try{return root.sessionStorage&&root.sessionStorage.getItem("careerModeShowdown.sharedJourneyPending.v1")==="1";}catch(_error){return false;}
  }
  function ssjpShell(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function ssjpManagers(){const current=ssjpShell();return current&&current.managers?current.managers:{playerOne:"PLAYER ONE",playerTwo:"PLAYER TWO"};}
  function ssjpPhaseAtLeast(phase){return Boolean(state&&state.setup&&Object.hasOwn(PHASE_INDEX,state.setup.phase)&&PHASE_INDEX[state.setup.phase]>=PHASE_INDEX[phase]);}
  function ssjpCoordinator(){return Boolean(state&&state.setup&&state.managerRole===state.setup.coordinatorRole);}
  function ssjpBoundSeasonLength(){
    const rivalryId=String(state?.rivalryId||"").trim(),match=/^pair_([0-9a-f])[0-9a-f]{63}$/i.exec(rivalryId);
    return match?SEASON_BY_CAPABILITY_NIBBLE[match[1].toLowerCase()]||null:null;
  }
  function ssjpLocalSeasonLength(){const seasons=Number(ssjpShell()?.totalRounds);return LENGTHS.includes(seasons)?seasons:null;}
  function ssjpPreparedSeasonLength(){const local=ssjpLocalSeasonLength(),bound=ssjpBoundSeasonLength();return local&&bound&&local===bound?local:null;}
  function ssjpSeasonMatchesPrepared(setup){const seasons=ssjpPreparedSeasonLength();return Boolean(seasons&&setup&&setup.totalSeasons===seasons);}
  function ssjpLeagueRecord(id){
    try{if(typeof root.getLeagueById==="function")return root.getLeagueById(id);}catch(_error){}
    try{if(typeof getLeagueById==="function")return getLeagueById(id);}catch(_error){}
    return id?{id,name:String(id).replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}:null;
  }
  function ssjpText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function ssjpClearTimers(){for(const timer of timers)root.clearTimeout(timer);timers=[];}
  function ssjpLater(fn,ms){const id=root.setTimeout(()=>{timers=timers.filter(item=>item!==id);fn();},ms);timers.push(id);return id;}
  function ssjpContextKey(next=state){const shell=ssjpShell();return `${String(next?.rivalryId||"").trim()}|${String(shell?.id||shell?.saveId||"").trim()}`;}
  function ssjpResetWitnesses(){
    ssjpClearTimers();ssjpClearLeagueForwardWaiter();witnessedLeagueId=null;witnessedClubDigest=null;revealingClubDigest=null;clubRevealComplete=false;revealedSummaryClubs=0;preparedSeasonCommitPromise=null;autoCareerStartKey="";
    const league=root.document&&root.document.getElementById("leagueWheelScreen"),club=root.document&&root.document.getElementById("clubWheelScreen");
    if(league)delete league.dataset.sharedLeagueWitnessed;
    if(club){delete club.dataset.sharedClubPacksWitnessed;delete club.dataset.sharedPackDigest;}
  }
  function ssjpAdoptState(next){
    const nextKey=ssjpContextKey(next);
    if(presentationContextKey&&nextKey&&nextKey!==presentationContextKey)ssjpResetWitnesses();
    presentationContextKey=nextKey||presentationContextKey;state=next;return state;
  }
  function ssjpActionBusy(){return Boolean(actionPromise)||busy;}

  async function ssjpLoadScript(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");await root.loadRuntimeScript(key,path,ready);return ready();}
  async function ssjpEnsureSetup(){
    if(setupApi)return setupApi;
    await ssjpLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    setupApi=root.CareerModeProductionSharedShowdownSetup;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.mutate!=="function"||typeof setupApi.subscribe!=="function")throw new Error("Authoritative Shared Setup is unavailable.");
    if(!unsubscribe)unsubscribe=setupApi.subscribe(next=>{ssjpAdoptState(next);void ssjpRenderCurrent();});
    ssjpAdoptState(setupApi.getState());
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
    if(!node){node=root.document.createElement("p");node.id=STATUS_ID;node.className="stateNote";node.setAttribute("role","status");node.setAttribute("aria-live","polite");const container=screen.querySelector(".wheelContainer")||screen.querySelector(".clubAssignmentStage")||screen;container.insertBefore(node,container.firstChild);}if(tapFailure&&tapFailureSignature!==ssjpStateSignature()){tapFailure="";tapFailureCode="";tapFailureSignature="";}ssjpText(node,tapFailure?`${tapFailure}${tapFailureCode?` · Ref ${ssjpFailureRef(tapFailureCode)}`:""} · ${message}`:message);if(tapFailure&&tapFailureCode)node.setAttribute("data-failure-code",tapFailureCode);else node.removeAttribute("data-failure-code");
  }
  function ssjpRemoveForeignStatus(){const node=root.document&&root.document.getElementById(STATUS_ID);if(node&&node.closest(`#${ssjpActiveScreen()}`)==null)node.remove();}
  function ssjpSetControl(button,{label,disabled=false,hidden=false}={}){if(!button)return;if(workingControlId&&button.id===workingControlId&&!hidden){label="WORKING…";disabled=true;}button.disabled=Boolean(disabled);button.classList.toggle("hidden",Boolean(hidden));button.setAttribute("aria-disabled",String(Boolean(disabled)));if(label)ssjpText(button,label);delete button.dataset.sharedJourneyLocked;button.removeAttribute("title");}
  function ssjpClubDigest(setup){return setup&&setup.clubs?`${setup.leagueId}|${setup.clubs.playerOne}|${setup.clubs.playerTwo}`:null;}

  function ssjpRenderLeague(){
    if(!root.document||!ssjpPending())return false;ssjpRemoveForeignStatus();
    const screen=root.document.getElementById("leagueWheelScreen"),result=root.document.getElementById("selectedLeague"),button=root.document.getElementById("spinLeague"),note=root.document.getElementById("leagueStateNote"),wheel=root.document.getElementById("leagueWheel"),track=wheel&&wheel.querySelector(".wheelTrack");
    if(!screen||!button||!result)return false;screen.dataset.sharedPresentationRole=state&&state.managerRole||"unresolved";
    const ready=Boolean(state&&state.ready);
    if(!ready){ssjpText(result,"Pair managers to unlock the league wheel");ssjpSetControl(button,{label:"PAIR + ACTIVATE SESSION FIRST",disabled:true});if(note){ssjpText(note,state&&state.message||"Both players must be connected before the wheel can spin.");note.classList.remove("hidden");}return true;}
    if(!state.setup){ssjpText(result,"Shared league wheel ready");ssjpSetControl(button,{label:state.remoteRole==="host"?"SPIN SHARED LEAGUE WHEEL":"WAITING FOR HOST",disabled:state.remoteRole!=="host"||ssjpActionBusy()});ssjpSetSharedStatus(state.remoteRole==="host"?"BOTH PLAYERS CONNECTED · Spin the league wheel.":"PAIRING + ACTIVE SESSION VERIFIED · Waiting for the host. This screen will update automatically.");return true;}
    if(state.setup.phase==="SHARED_SETUP_OPEN"){ssjpText(result,"Spin to reveal the shared league");ssjpSetControl(button,{label:ssjpCoordinator()?"SPIN SHARED LEAGUE WHEEL":"WAITING FOR HOST SPIN",disabled:!ssjpCoordinator()||ssjpActionBusy()});ssjpSetSharedStatus(ssjpCoordinator()?"SHARED SETUP OPEN · Spin the league wheel.":"SHARED SETUP OPEN · Waiting for the host to spin. This screen will update automatically.");return true;}
    const league=ssjpLeagueRecord(state.setup.leagueId);ssjpText(result,league&&league.name||state.setup.leagueId);
    if(witnessedLeagueId!==state.setup.leagueId){
      witnessedLeagueId=state.setup.leagueId;screen.dataset.sharedLeagueWitnessed=state.setup.leagueId;
      if(track){const rotation=typeof root.getLeagueRotation==="function"?root.getLeagueRotation(state.setup.leagueId,6):(typeof getLeagueRotation==="function"?getLeagueRotation(state.setup.leagueId,6):0);if(typeof root.setLeagueWheelTransition==="function")root.setLeagueWheelTransition(track,4000);else track.style.transition="transform 4000ms cubic-bezier(.16,.76,.16,1)";track.style.transform=`rotate(${rotation}deg)`;track.dataset.sharedLeagueId=state.setup.leagueId;ssjpLater(()=>{const finalRotation=typeof root.getLeagueRotation==="function"?root.getLeagueRotation(state.setup.leagueId,0):(typeof getLeagueRotation==="function"?getLeagueRotation(state.setup.leagueId,0):rotation);if(typeof root.setLeagueWheelTransition==="function")root.setLeagueWheelTransition(track,0);else track.style.transition="none";track.style.transform=`rotate(${finalRotation}deg)`;},4100);}
      ssjpLater(ssjpAutoForwardToClubs,LEAGUE_AUTO_FORWARD_MS);
    }
    ssjpSetControl(button,{label:"CONTINUE TO CLUB PACKS",disabled:ssjpActionBusy()});if(note){ssjpText(note,`${league&&league.name||state.setup.leagueId} is locked for both managers.`);note.classList.remove("hidden");}ssjpSetSharedStatus("LEAGUE REVEALED ON THIS DEVICE · Continue to the original club-pack screen. No reroll.");return true;
  }

  function ssjpAutoForwardToClubs(){
    if(!active||!ssjpPending()||!state?.setup||!ssjpPhaseAtLeast("LEAGUE_WHEEL_COMMITTED")||witnessedLeagueId!==state.setup.leagueId||ssjpActiveScreen()!=="leagueWheelScreen")return false;
    // Codex P1 on #358: never move on (and start the pack reveals) while this tab is hidden; wait until the manager is back,
    // then show the revealed league for the full forward delay first.
    if(root.document?.visibilityState==="hidden"){ssjpDeferLeagueForward(state.setup.leagueId);return false;}
    ssjpForceScreen("clubWheelScreen");void ssjpRenderClub();return true;
  }
  function ssjpClearLeagueForwardWaiter(){if(leagueForwardWaiter&&root.document?.removeEventListener)root.document.removeEventListener("visibilitychange",leagueForwardWaiter);leagueForwardWaiter=null;}
  function ssjpDeferLeagueForward(leagueId){
    if(leagueForwardWaiter||typeof root.document?.addEventListener!=="function")return false;
    leagueForwardWaiter=()=>{if(root.document.visibilityState==="hidden")return;ssjpClearLeagueForwardWaiter();if(active&&witnessedLeagueId===leagueId)ssjpLater(ssjpAutoForwardToClubs,LEAGUE_AUTO_FORWARD_MS);};
    root.document.addEventListener("visibilitychange",leagueForwardWaiter);return true;
  }
  function ssjpMaybeAutoOpenCareerStart(setup){
    if(!active||!ssjpPending()||busy||actionPromise||state?.ready!==true||!setup||setup.phase!=="SHOWDOWN_CONFIRMED"||!clubRevealComplete)return false;
    if(!Array.isArray(setup.confirmedRoles)||!setup.confirmedRoles.includes(state.managerRole)||!ssjpSeasonMatchesPrepared(setup))return false;
    const key=`${presentationContextKey}|${setup.revision}`;if(autoCareerStartKey===key)return false;autoCareerStartKey=key;
    void ssjpOpenCareerStart().catch(()=>{});return true;
  }
  function ssjpResetPackCards(){revealedSummaryClubs=0;if(typeof root.resetClubRevealCards==="function")root.resetClubRevealCards();else for(const [cardId,nameId,stateId] of [["clubCardOne","clubNameOne","clubCardStateOne"],["clubCardTwo","clubNameTwo","clubCardStateTwo"]]){const card=root.document.getElementById(cardId),name=root.document.getElementById(nameId),stateNode=root.document.getElementById(stateId);if(card)card.classList.remove("is-revealed");ssjpText(name,"?");ssjpText(stateNode,"SEALED");}}
  function ssjpConfirmationClubNode(which){return root.document.getElementById(which===1?"clubConfirmationClubOne":"clubConfirmationClubTwo");}
  function ssjpSaveConfirmationBaseline(node){if(node&&!confirmationClubBaselines.has(node))confirmationClubBaselines.set(node,Array.from(node.attributes,attr=>[attr.name,attr.value]));}
  function ssjpSealConfirmationClub(node){
    if(!node)return;ssjpSaveConfirmationBaseline(node);
    const original=new Map(confirmationClubBaselines.get(node));
    for(const attr of Array.from(node.attributes))if(!original.has(attr.name))node.removeAttribute(attr.name);
    for(const [name,value] of original)if(node.getAttribute(name)!==value)node.setAttribute(name,value);
    ssjpText(node,"?");
  }
  function ssjpSetConfirmationClub(which,name){
    const node=ssjpConfirmationClubNode(which);if(!node)return;
    ssjpSaveConfirmationBaseline(node);ssjpText(node,name);
    if(typeof root.applyClubIdentity==="function")root.applyClubIdentity(node,name);
  }
  function ssjpRevealCard(which,name){const card=root.document.getElementById(which===1?"clubCardOne":"clubCardTwo"),nameNode=root.document.getElementById(which===1?"clubNameOne":"clubNameTwo"),stateNode=root.document.getElementById(which===1?"clubCardStateOne":"clubCardStateTwo");if(typeof root.applyClubRevealCard==="function")root.applyClubRevealCard(card,nameNode,stateNode,name);else{ssjpText(nameNode,name);ssjpText(stateNode,"REVEALED");if(card)card.classList.add("is-revealed");if(typeof root.applyClubIdentity==="function")root.applyClubIdentity(nameNode,name);revealedSummaryClubs|=which===1?1:2;ssjpSetConfirmationClub(which,name);}}
  function ssjpEnsureSeasonPanel(){
    const screen=root.document&&root.document.getElementById("clubWheelScreen");if(!screen)return null;let panel=root.document.getElementById(SEASON_PANEL_ID);if(panel)return panel;
    panel=root.document.createElement("section");panel.id=SEASON_PANEL_ID;panel.className="clubRivalryConfirmation sharedShowdownSeasonPanel";const eyebrow=root.document.createElement("span");eyebrow.className="screenEyebrow";eyebrow.textContent="SHARED SHOWDOWN · FINAL SETUP";const heading=root.document.createElement("h3");heading.textContent="CHOOSE SEASON LENGTH";const copy=root.document.createElement("p");copy.className="stateNote";copy.dataset.sharedSeasonCopy="true";const choices=root.document.createElement("div");choices.className="sharedSeasonChoices";
    for(const seasons of LENGTHS){const button=root.document.createElement("button");button.type="button";button.className="compactButton";button.dataset.sharedSeason=String(seasons);button.textContent=`${seasons} SEASON${seasons===1?"":"S"}`;button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();void ssjpChooseSeason(seasons);});choices.append(button);}panel.append(eyebrow,heading,copy,choices);const confirmation=root.document.getElementById("clubRivalryConfirmation");if(confirmation)confirmation.insertAdjacentElement("afterend",panel);else screen.append(panel);return panel;
  }
  function ssjpFillConfirmation(setup){
    const m=ssjpManagers(),league=ssjpLeagueRecord(setup.leagueId),confirmation=root.document.getElementById("clubRivalryConfirmation");
    if(confirmation)confirmation.classList.remove("hidden");
    ssjpText(root.document.getElementById("clubConfirmationShowdown"),(ssjpShell()&&ssjpShell().name)||"SHARED SHOWDOWN");
    ssjpText(root.document.getElementById("clubConfirmationMeta"),`${league&&league.name||setup.leagueId}${setup.totalSeasons?` · ${setup.totalSeasons} season${setup.totalSeasons===1?"":"s"}`:""} · SHARED`);
    ssjpText(root.document.getElementById("clubConfirmationManagerOne"),m.playerOne||"PLAYER ONE");
    ssjpText(root.document.getElementById("clubConfirmationManagerTwo"),m.playerTwo||"PLAYER TWO");
    for(const [which,role,bit] of [[1,"playerOne",1],[2,"playerTwo",2]]){
      if((revealedSummaryClubs&bit)&&setup.clubs?.[role])ssjpSetConfirmationClub(which,setup.clubs[role]);
      else ssjpSealConfirmationClub(ssjpConfirmationClubNode(which));
    }
  }
  function ssjpCompletePackWitness(setup){const digest=ssjpClubDigest(setup);revealingClubDigest=null;witnessedClubDigest=digest;clubRevealComplete=true;const screen=root.document&&root.document.getElementById("clubWheelScreen");if(screen)screen.dataset.sharedClubPacksWitnessed=digest||"true";ssjpFillConfirmation(setup);void ssjpRenderClub();}
  function ssjpAnimatePacks(setup){
    if(!setup||!setup.clubs)return;const screen=root.document.getElementById("clubWheelScreen");if(!screen)return;const digest=ssjpClubDigest(setup);
    if(witnessedClubDigest===digest&&clubRevealComplete){ssjpRevealCard(1,setup.clubs.playerOne);ssjpRevealCard(2,setup.clubs.playerTwo);ssjpFillConfirmation(setup);return;}
    if(revealingClubDigest===digest&&!clubRevealComplete)return;
    revealingClubDigest=digest;ssjpClearTimers();clubRevealComplete=false;screen.dataset.sharedPackDigest=digest;ssjpResetPackCards();if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("opening");ssjpText(root.document.getElementById("clubPackStatus"),"CLUB DRAW LOCKED · OPENING PACK 01");const reduced=typeof root.isReducedClubMotionPreferred==="function"&&root.isReducedClubMotionPreferred();
    if(reduced){ssjpRevealCard(1,setup.clubs.playerOne);ssjpRevealCard(2,setup.clubs.playerTwo);if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("confirmation");ssjpCompletePackWitness(setup);return;}
    ssjpLater(()=>{ssjpRevealCard(1,setup.clubs.playerOne);if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("manager-one");ssjpText(root.document.getElementById("clubPackStatus"),`${String(ssjpManagers().playerOne||"PLAYER ONE").toUpperCase()} · PACK 01 OPEN`);},650);
    ssjpLater(()=>{ssjpRevealCard(2,setup.clubs.playerTwo);if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("manager-two");ssjpText(root.document.getElementById("clubPackStatus"),`${String(ssjpManagers().playerTwo||"PLAYER TWO").toUpperCase()} · PACK 02 OPEN`);},1750);
    ssjpLater(()=>{if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("confirmation");ssjpText(root.document.getElementById("clubPackStatus"),"BOTH CLUBS REVEALED · SHARED RIVALRY LOCKED");ssjpCompletePackWitness(setup);},3000);
  }
  function ssjpRenderSeasonControls(setup){
    const panel=ssjpEnsureSeasonPanel();if(!panel)return;
    const copy=panel.querySelector("[data-shared-season-copy]"),choices=Array.from(panel.querySelectorAll("[data-shared-season]")),prepared=ssjpPreparedSeasonLength();
    for(const button of choices)button.classList.add("hidden");
    if(!clubRevealComplete){panel.classList.add("hidden");return;}
    if(setup.phase==="CLUB_ASSIGNMENTS_COMMITTED"){
      panel.classList.remove("hidden");
      const local=ssjpLocalSeasonLength(),bound=ssjpBoundSeasonLength(),mismatch=Boolean(local&&bound&&local!==bound);
      ssjpText(panel.querySelector("h3"),prepared?`${prepared} SEASON${prepared===1?"":"S"} SELECTED`:mismatch?"SEASON PLAN MISMATCH":"SEASON PLAN UNAVAILABLE");
      ssjpText(copy,prepared?(ssjpCoordinator()?"Using the season length Daniel selected when this Showdown started. Locking it for both managers now.":"Using Daniel's original season choice. Waiting for the host to lock the same plan."):mismatch?"This device's local season plan does not match Daniel's paired Showdown code. Use Showdown recovery before continuing.":"The original season choice could not be recovered from paired authority. Return to Showdown recovery instead of choosing a second season length.");
      return;
    }
    if(ssjpPhaseAtLeast("SEASON_LENGTH_COMMITTED")){
      panel.classList.remove("hidden");
      const matches=ssjpSeasonMatchesPrepared(setup);
      ssjpText(panel.querySelector("h3"),matches?`${setup.totalSeasons} SEASON${setup.totalSeasons===1?"":"S"} LOCKED`:"SEASON PLAN MISMATCH");
      ssjpText(copy,matches?"Daniel's original season choice is locked and matches this device.":"This device does not match the shared season plan. Use Showdown recovery before confirming.");
      return;
    }
    panel.classList.add("hidden");
  }
  function ssjpRenderConfirmButton(setup){const button=root.document.getElementById("continueClubAssignment");if(!button)return;if(!clubRevealComplete){ssjpSetControl(button,{label:"WATCH BOTH PACK REVEALS",disabled:true,hidden:true});return;}if(setup.phase==="SEASON_LENGTH_COMMITTED"){if(!ssjpSeasonMatchesPrepared(setup)){ssjpSetControl(button,{label:"SEASON PLAN MISMATCH · RECOVERY REQUIRED",disabled:true,hidden:false});return;}const confirmed=setup.confirmedRoles.includes(state.managerRole);ssjpSetControl(button,{label:confirmed?"CONFIRMED · WAITING FOR RIVAL":"CONFIRM SHARED SHOWDOWN",disabled:confirmed||ssjpActionBusy(),hidden:false});return;}if(setup.phase==="SHOWDOWN_CONFIRMED"){const matches=ssjpSeasonMatchesPrepared(setup),authorityReady=state?.ready===true;ssjpSetControl(button,{label:!matches?"SEASON PLAN MISMATCH · RECOVERY REQUIRED":authorityReady?"CONTINUE TO CAREER START":"RECONNECT PLAYERS TO CONTINUE",disabled:!matches||!authorityReady||ssjpActionBusy(),hidden:false});return;}ssjpSetControl(button,{label:"CONFIRM SHARED SHOWDOWN",disabled:true,hidden:true});}
  function ssjpRenderClub(){
    if(!root.document||!ssjpPending())return false;ssjpRemoveForeignStatus();const setup=state&&state.setup;if(!setup||!ssjpPhaseAtLeast("LEAGUE_WHEEL_COMMITTED"))return false;if(witnessedLeagueId!==setup.leagueId){ssjpForceScreen("leagueWheelScreen");return ssjpRenderLeague();}
    const screen=root.document.getElementById("clubWheelScreen"),league=ssjpLeagueRecord(setup.leagueId),m=ssjpManagers();if(!screen)return false;screen.dataset.sharedPresentationRole=state&&state.managerRole||"unresolved";ssjpText(root.document.getElementById("clubAssignmentLeague"),league&&league.name||setup.leagueId);ssjpText(root.document.getElementById("clubPlayerOne"),m.playerOne||"PLAYER ONE");ssjpText(root.document.getElementById("clubPlayerTwo"),m.playerTwo||"PLAYER TWO");const open=root.document.getElementById("openClubPack"),back=root.document.getElementById("clubAssignmentBack");if(back){back.disabled=true;back.classList.add("hidden");}
    if(setup.phase==="LEAGUE_WHEEL_COMMITTED"){clubRevealComplete=false;witnessedClubDigest=null;revealingClubDigest=null;ssjpResetPackCards();const confirmation=root.document.getElementById("clubRivalryConfirmation");if(confirmation)confirmation.classList.add("hidden");const panel=root.document.getElementById(SEASON_PANEL_ID);if(panel)panel.classList.add("hidden");ssjpText(root.document.getElementById("clubPackStatus"),"LEAGUE LOCKED · TWO SHARED CLUB PACKS READY");ssjpSetControl(open,{label:ssjpCoordinator()?"OPEN SHOWDOWN PACKS":"WAITING FOR HOST PACK REVEAL",disabled:!ssjpCoordinator()||ssjpActionBusy(),hidden:false});ssjpRenderConfirmButton(setup);ssjpSetSharedStatus(ssjpCoordinator()?"SHARED CLUB PACKS · Open the original two-pack reveal.":"SHARED CLUB PACKS · Waiting for the host. These packs will open automatically when the clubs are locked.");return true;}
    ssjpSetControl(open,{label:"PACKS OPENED",disabled:true,hidden:true});ssjpAnimatePacks(setup);ssjpFillConfirmation(setup);if(setup.phase==="CLUB_ASSIGNMENTS_COMMITTED"&&ssjpCoordinator())void ssjpCommitPreparedSeasonLength();ssjpRenderSeasonControls(setup);ssjpRenderConfirmButton(setup);if(setup.phase==="SHOWDOWN_CONFIRMED")ssjpMaybeAutoOpenCareerStart(setup);if(setup.phase==="SHOWDOWN_CONFIRMED")ssjpSetSharedStatus(state?.ready!==true?"SESSION CONNECTION REQUIRED · Reconnect both players before Career Start.":clubRevealComplete?"SHARED SETUP COMPLETE · Both managers saw the league wheel and club packs on this device.":"SHARED SETUP COMPLETE IN AUTHORITY · Finish watching both pack reveals on this device.");else if(setup.phase==="SEASON_LENGTH_COMMITTED")ssjpSetSharedStatus(clubRevealComplete?"FINAL CONFIRMATION · Each manager confirms on their own device.":"WATCH BOTH CLUB PACK REVEALS · Confirmation unlocks after both packs open on this device.");else ssjpSetSharedStatus(clubRevealComplete?"CLUBS REVEALED · Locking Daniel's season choice from Showdown start.":"OPENING SHARED CLUB PACKS · Both managers see the same two reveals.");return true;
  }

  async function ssjpRenderCurrent(){if(!active||!ssjpPending())return false;const screen=ssjpActiveScreen();if(screen==="leagueWheelScreen")return ssjpRenderLeague();if(screen==="clubWheelScreen")return ssjpRenderClub();return false;}
  async function ssjpRefresh(){const api=await ssjpEnsureSetup(),result=await api.refresh();ssjpAdoptState(api.getState());await ssjpRenderCurrent();return result;}
  async function ssjpPoll(){if(!active||!ssjpPending()||busy||pollBusy||root.document&&root.document.visibilityState==="hidden")return;pollBusy=true;try{await ssjpRefresh();}catch(_error){}finally{pollBusy=false;}}
  function ssjpStartPolling(){if(pollTimer!==null||typeof root.setInterval!=="function")return;pollTimer=root.setInterval(()=>void ssjpPoll(),POLL_MS);}
  function ssjpStopPolling(){if(pollTimer!==null){root.clearInterval(pollTimer);pollTimer=null;}}
  async function ssjpMutate(type,extra){if(busy){lastMutationCode="SHARED_SETUP_BUSY";lastMutationMessage="";return Promise.resolve(false);}busy=true;lastMutationCode="";lastMutationMessage="";const run=(async()=>{try{const api=await ssjpEnsureSetup(),result=await api.mutate(type,extra||{});ssjpAdoptState(api.getState());await ssjpRenderCurrent();lastMutationCode=result&&result.ok===true?"":String(result&&result.code||"SHARED_SETUP_MUTATION_FAILED");lastMutationMessage=result&&result.ok===true?"":String(result&&result.message||"");return result&&result.ok===true;}finally{busy=false;await ssjpRenderCurrent();}})();mutationPromise=run;run.finally(()=>{if(mutationPromise===run)mutationPromise=null;}).catch(()=>{});return run;}
  function ssjpStateSignature(){return state?`${state.ready?1:0}|${state.remoteRole||""}|${state.setup?.phase||""}|${state.setup?.revision||0}`:"";}
  async function ssjpAwaitIdle(){for(let attempt=0;attempt<3&&mutationPromise;attempt+=1){try{await mutationPromise;}catch(_error){}}}
  async function ssjpCommitPreparedSeasonLength(){
    if(preparedSeasonCommitPromise)return preparedSeasonCommitPromise;
    const seasons=ssjpPreparedSeasonLength();
    if(!active||!ssjpPending()||!ssjpCoordinator()||!state?.setup||state.setup.phase!=="CLUB_ASSIGNMENTS_COMMITTED"||!seasons)return false;
    preparedSeasonCommitPromise=ssjpMutate("commit-length",{totalSeasons:seasons}).finally(()=>{preparedSeasonCommitPromise=null;});
    return preparedSeasonCommitPromise;
  }
  async function ssjpChooseSeason(seasons){if(Number(seasons)!==ssjpPreparedSeasonLength())return false;return ssjpCommitPreparedSeasonLength();}
  async function ssjpOpenCareerStart(){
    if(!active||!ssjpPending()||busy||state?.ready!==true||!state?.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||!ssjpSeasonMatchesPrepared(state.setup))return false;
    autoCareerStartKey=`${presentationContextKey}|${state.setup.revision}`;busy=true;
    try{
      await ssjpLoadScript("ssjr-production-career-start","js/productionSharedCareerStart.js",()=>root.CareerModeProductionSharedCareerStart);
      const career=root.CareerModeProductionSharedCareerStart;
      if(!career||typeof career.openPanel!=="function")throw new Error("Career Start is unavailable.");
      if(typeof career.install==="function")career.install();
      await career.openPanel();
      return true;
    }finally{
      busy=false;
      await ssjpRenderCurrent();
    }
  }
  function ssjpHandlesControl(id){return active&&ssjpPending()&&HANDLED.has(id);}
  // r50: one tap must do one thing. A tap decides from the latest authoritative Setup state; when the
  // state was stale or the write was rejected, the tap re-reads authority once and acts on the fresh
  // state instead of silently needing a second tap. Phase-guarded provider transitions keep this from
  // ever duplicating a draw: a write that already landed is seen as the next phase on the re-read.
  async function ssjpDecideControl(id){
    if(!state)return "stale";
    if(id==="spinLeague"){
      if(!state.ready)return "stale";
      if(!state.setup){if(state.remoteRole!=="host")return "stale";if(!await ssjpMutate("open"))return "failed";}
      if(state.setup&&state.setup.phase==="SHARED_SETUP_OPEN"){if(!ssjpCoordinator())return "stale";return await ssjpMutate("commit-league")?"done":"failed";}
      if(state.setup&&ssjpPhaseAtLeast("LEAGUE_WHEEL_COMMITTED")){if(witnessedLeagueId!==state.setup.leagueId){await ssjpRenderLeague();return "done";}ssjpForceScreen("clubWheelScreen");await ssjpRenderClub();return "done";}return "stale";
    }
    if(id==="openClubPack"){if(state.setup&&state.setup.phase==="LEAGUE_WHEEL_COMMITTED"&&ssjpCoordinator())return await ssjpMutate("commit-clubs")?"done":"failed";return "stale";}
    if(id==="continueClubAssignment"){
      if(!clubRevealComplete){await ssjpRenderClub();return "done";}
      if(state.setup&&state.setup.phase==="SEASON_LENGTH_COMMITTED"&&!state.setup.confirmedRoles.includes(state.managerRole)){
        const confirmed=await ssjpMutate("confirm");
        if(confirmed&&state?.setup?.phase==="SHOWDOWN_CONFIRMED"&&state?.ready===true)await ssjpOpenCareerStart();
        return confirmed?"done":"failed";
      }
      if(state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"&&state.ready===true)return await ssjpOpenCareerStart()?"done":"stale";
      return "stale";
    }
    return "done";
  }
  // BUG-1: the player reads a plain sentence first. The code follows only as a short "Ref" so a failed tap is never
  // mistaken for an ignored one (POS10 proof SHARED_POLISHED_PRESENTATION_BROWSER), and stays in data-failure-code.
  function ssjpFailureRef(code){return String(code).split("_").join(" ");}
  function ssjpDescribeFailure(code,message){
    const failureCode=String(code||"SHARED_SETUP_MUTATION_FAILED");
    if(setupApi&&typeof setupApi.describeFailure==="function")return setupApi.describeFailure({code:failureCode,message});
    return {code:failureCode,kind:"generic",text:"That didn't go through. Tap again.",tapDetail:"Tap again."};
  }
  async function ssjpHandleControlClickNow(id){
    if(!ssjpHandlesControl(id))return false;await ssjpEnsureSetup();await ssjpAwaitIdle();
    tapFailure="";tapFailureCode="";tapFailureSignature="";
    const first=await ssjpDecideControl(id);if(first==="done")return true;
    const before=ssjpStateSignature();
    try{await ssjpRefresh();}catch(_error){}
    if(first==="stale"&&ssjpStateSignature()===before)return true;
    const second=await ssjpDecideControl(id);
    if(second==="failed"){const failure=ssjpDescribeFailure(lastMutationCode,lastMutationMessage);tapFailure=`THAT TAP DID NOT GO THROUGH · ${failure.tapDetail}`;tapFailureCode=failure.code;tapFailureSignature=ssjpStateSignature();}
    return true;
  }
  function ssjpHandleControlClick(id){
    if(!ssjpHandlesControl(id))return Promise.resolve(false);
    if(actionPromise)return actionPromise;
    const button=root.document&&root.document.getElementById(id);
    workingControlId=id;
    if(button){button.disabled=true;button.setAttribute("aria-disabled","true");button.setAttribute("aria-busy","true");ssjpText(button,"WORKING…");}
    const current=Promise.resolve().then(()=>ssjpHandleControlClickNow(id)).finally(async()=>{
      if(actionPromise===current)actionPromise=null;
      if(workingControlId===id&&!actionPromise)workingControlId="";
      if(button)button.removeAttribute("aria-busy");
      await ssjpRenderCurrent();
    });
    actionPromise=current;
    return current;
  }
  async function ssjpActivate(){active=true;await ssjpEnsureGameplay();await ssjpEnsureSetup();await ssjpRefresh();const plain=root.document&&root.document.getElementById("productionSharedSetupOverlay");if(plain)plain.classList.add("hidden");ssjpForceScreen("leagueWheelScreen");await ssjpRenderLeague();ssjpStartPolling();return true;}
  function ssjpDeactivate(){active=false;ssjpStopPolling();ssjpResetWitnesses();presentationContextKey="";actionPromise=null;workingControlId="";tapFailure="";tapFailureCode="";tapFailureSignature="";const panel=root.document&&root.document.getElementById(SEASON_PANEL_ID);if(panel)panel.remove();const note=root.document&&root.document.getElementById(STATUS_ID);if(note)note.remove();return true;}
  function ssjpInstall(){if(installed)return true;installed=true;return true;}

  return Object.freeze({contractVersion:2,feature:"ssjr-production-shared-showdown-polished-presentation",productionEnabled:true,pairingRequired:true,exactActiveSessionRequired:true,providerOwnsDrawAuthority:true,bothManagerRolesWitnessLeagueWheel:true,bothManagerRolesWitnessClubPacks:true,peerAutoRefreshesAuthority:true,singleClickActionSerialization:true,contextScopedRevealWitnesses:true,oneClickFinalConfirmationHandoff:true,leagueRevealAutoForwardsToClubPacks:true,firstConfirmerAutoOpensCareerStart:true,usesLeagueWheelScreen:true,usesClubPackRevealScreen:true,engineeringSetupPanelPlayerFacing:false,localRandomLeagueAuthority:false,localRandomClubAuthority:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,appCheckEnforcementRequired:false,install:ssjpInstall,activate:ssjpActivate,deactivate:ssjpDeactivate,refresh:ssjpRefresh,handleControlClick:ssjpHandleControlClick,handlesControl:ssjpHandlesControl,renderCurrent:ssjpRenderCurrent,isPresentationActive:()=>active&&ssjpPending(),getState:()=>Object.freeze({active:active&&ssjpPending(),phase:state&&state.setup&&state.setup.phase||null,revision:state&&state.setup&&state.setup.revision||0,managerRole:state&&state.managerRole||null,route:ssjpActiveScreen(),leagueWitnessed:witnessedLeagueId,clubPacksWitnessed:witnessedClubDigest,clubRevealComplete})});
});