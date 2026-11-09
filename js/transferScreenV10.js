(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTransferScreenV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-27 (G-13 part 2d): Team V's Transfer War skin (visual-assets/v10_1/tr2/slice-02-plate, pinned 5e05a1f)
  // on the shared Transfer Challenge screen. Skin, don't rewire:
  // - js/productionSharedTransferChallenge.js keeps rendering into its own elements. While the skin is mounted those
  //   very elements (same ids, classes, data-* hooks, text and listeners) are moved into Team V's layout, and they
  //   go back to their original place when the skin unmounts or redraws. The status line is drawn by Team V's sign
  //   from production's own status text.
  // - Team V's own copies of those elements are dropped; Team V elements that only label things keep a "tw-" id.
  // - The frame is built from the production view the module already exposes (getState) and from the text it already
  //   rendered. The rival's guesses and signings are read only when the provider has revealed them (COMPLETED).
  const SCREEN="transferChallenge";
  const DIR="tr2/slice-02-plate/";
  const FILES=Object.freeze({
    css:Object.freeze([DIR+"plate.css","../../css/v10Transfer.css"]),
    script:Object.freeze(["v10-transfer-plate",DIR+"plate.js",()=>Boolean(root.TWPlate&&typeof root.TWPlate.render==="function")]),
    platemap:DIR+"platemap.json"
  });
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const LAYOUTS=Object.freeze({window:"WINDOW_OPEN",guess_entry:"GUESS_ENTRY",signing_entry:"SIGNING_ENTRY",completed:"COMPLETED"});
  // Team V's approved copy (fixtures.json "strings" at 5e05a1f, f1Action as factory/v1-wtt5ye 273115c) for the labels Team V draws itself. Production keeps
  // every text it renders (status, buttons, timer, lock summary, errors): those elements are the production ones.
  const STRINGS=Object.freeze({
    title:"SEASON {season} · TRANSFER WAR",back:"HOME",refresh:"REFRESH",rail:Object.freeze(["Window","Guesses","Signings","Verdicts"]),railAriaLabel:"Transfer War progress",
    f1Intro:"Ends early only if you both agree.",f1RulesLine:"15 MIN · 3 SIGNINGS · 3 GUESSES",f1Action:"REQUEST EARLY END",f1ActionRequested:"EARLY END REQUESTED ✓",
    ruleNote:"Guess a league or nationality. A matching signing must be released.",
    guessHeading:"Guess {RIVAL}'s signings",privacyNote:"Hidden from {RIVAL} until you both lock.",
    selectPlaceholder:"Guess type",selectLeague:"League",selectNationality:"Nationality",valuePlaceholder:"Pick a type first",primary:"LOCK GUESSES",
    signWindowClosed:"WINDOW CLOSED",tagYou:"YOU",tagSealed:"SEALED",tagPrivate:"PRIVATE",
    signingPrimary:"LOCK MY SIGNINGS",signingInvalid:"Complete signing {n} with player name, position, overall (30-99), previous league and nationality.",
    signingPlaceholderName:"Player name",signingPlaceholderLeague:"Previous league",signingPlaceholderNationality:"Nationality",signingPlaceholderOverall:"OVR",signingPlaceholderPosition:"POS",
    verdictHeading:"{MANAGER} · {CLUB}",verdictEmpty:"No signings were entered.",verdictRelease:"RELEASE · MATCHED BY RIVAL GUESS",verdictKeep:"KEEP · NO RIVAL GUESS MATCH",
    continueLabel:"SEASON RESULTS NEXT",guessRevealHeading:"{GUESSER} guesses {OWNER}'s signings"
  });
  const tfNode=typeof module!=="undefined"&&module.exports;

  function tfFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(tfFreeze);Object.freeze(value);}return value;}
  const tfText=value=>String(value??"").trim();
  const tfOther=role=>role==="playerOne"?"playerTwo":"playerOne";
  function tfLabel(label,kind,id){
    const value=tfText(id);if(!value)return "";
    try{const option=typeof label==="function"?label(kind,value):null;if(option&&tfText(option.label))return tfText(option.label);}catch(_error){}
    return value;
  }
  function tfSigningRows(rows,label){
    return (Array.isArray(rows)?rows:[]).filter(row=>row&&Number.isInteger(row.slot)).map(row=>({slot:row.slot,name:tfText(row.name),league:tfLabel(label,"league",row.leagueId),nationality:tfLabel(label,"nationality",row.nationalityId),overall:Number.isInteger(row.overall)?row.overall:null,position:typeof row.position==="string"?row.position:null})).sort((a,b)=>a.slot-b.slot);
  }
  function tfGuessRows(rows,label){
    return (Array.isArray(rows)?rows:[]).filter(row=>row&&(row.type==="league"||row.type==="nationality")).slice().sort((a,b)=>(a.slot||0)-(b.slot||0)).map(row=>({type:row.type,value:tfLabel(label,row.type,row.valueId)}));
  }

  // Pure: the production view plus what production already rendered -> the frame Team V's layout is drawn from.
  // input: {active, view, step (#transferChallenge data-transfer-phase), replay (data-shared-transfer-replay), status,
  //         managers {playerOne, playerTwo}, clubs {playerOne, playerTwo}, label(kind, id) -> {label}}
  // Returns null (keep the app's own screen) when the shared challenge has no view or role yet.
  function toTransferFrame(input){
    const source=input||{},view=source.view;
    if(source.active!==true||!view||typeof view!=="object")return null;
    const role=view.managerRole;
    if(!ROLES.includes(role))return null;
    const phase=LAYOUTS[source.step];
    if(!phase)return null;
    const state=view.state&&typeof view.state==="object"?view.state:null,actual=state&&state.phase?String(state.phase):"NOT_STARTED";
    const replay=Boolean(source.replay),season=Number(view.seasonNumber);
    if(!Number.isInteger(season)||season<1)return null;
    const managers={},clubs={};
    for(const r of ROLES){managers[r]=tfText(source.managers&&source.managers[r])||(r==="playerOne"?"Manager 1":"Manager 2");clubs[r]=tfText(source.clubs&&source.clubs[r])||"Club";}
    const frame={screen:SCREEN,phase,viewer:role,replay,actualPhase:actual,season,managers,clubs,status:tfText(source.status),
      windowLive:phase==="WINDOW_OPEN"&&actual==="WINDOW_OPEN"&&!replay,
      endRequested:phase==="WINDOW_OPEN"&&actual==="WINDOW_OPEN"&&!replay&&Array.isArray(state&&state.endRequestedRoles)&&state.endRequestedRoles.includes(role),
      guessesLocked:phase==="GUESS_ENTRY"&&(replay||(Array.isArray(state&&state.guessLockedRoles)&&state.guessLockedRoles.includes(role))),
      // A historical replay keeps production's own (read-only, disabled by production) signing fields in the rows.
      signingsLocked:phase==="SIGNING_ENTRY"&&!replay&&Array.isArray(state&&state.signingLockedRoles)&&state.signingLockedRoles.includes(role),
      ownSignings:[],verdicts:null};
    // Own committed signings read back when they are locked (own data only).
    if(frame.signingsLocked)frame.ownSignings=tfSigningRows(view.ownInputs&&view.ownInputs.signings,source.label);
    // Both sides only after the provider revealed them: COMPLETED, not a replay, with provider verdicts.
    if(phase==="COMPLETED"&&actual==="COMPLETED"&&!replay&&view.verdicts&&typeof view.verdicts==="object"){
      const guessesBy={},verdicts={};
      guessesBy[role]=tfGuessRows(view.ownInputs&&view.ownInputs.guesses,source.label);
      guessesBy[tfOther(role)]=tfGuessRows(view.opponentInputs&&view.opponentInputs.guesses,source.label);
      for(const r of ROLES){
        verdicts[r]=(Array.isArray(view.verdicts[r])?view.verdicts[r]:[]).filter(row=>row&&Number.isInteger(row.slot)).map(row=>({slot:row.slot,release:row.release===true,
          name:tfText(row.name),league:tfLabel(source.label,"league",row.leagueId),nationality:tfLabel(source.label,"nationality",row.nationalityId)})).sort((a,b)=>a.slot-b.slot);
      }
      // guessesAgainst[r]: the rival's guesses against r's signings (why a signing is released).
      frame.verdicts={rows:verdicts,guessesAgainst:{playerOne:guessesBy.playerTwo,playerTwo:guessesBy.playerOne}};
    }
    frame.key=JSON.stringify([frame.phase,frame.viewer,frame.replay,frame.actualPhase,frame.season,managers,clubs,frame.status,frame.windowLive,frame.endRequested,frame.guessesLocked,frame.signingsLocked,frame.ownSignings,frame.verdicts]);
    return tfFreeze(frame);
  }

  // Pure: frame -> the fixtures shape Team V's plate.js renders (one frame, "LIVE"). No fixture data is used.
  function toPlateFixtures(frame){
    if(!frame)throw new TypeError("TRANSFER_V10_FRAME");
    const rival=tfOther(frame.viewer),fill=(text,map)=>Object.keys(map).reduce((out,key)=>out.split(`{${key}}`).join(map[key]),text);
    const strings={...STRINGS,rail:STRINGS.rail.slice(),
      title:fill(STRINGS.title,{season:String(frame.season)}),
      f1Intro:frame.windowLive?STRINGS.f1Intro:"",
      // plate.js picks the Nik-viewer string when Nik views and the Daniel-viewer string when Daniel views.
      guessHeadingNikViewer:fill(STRINGS.guessHeading,{RIVAL:frame.managers.playerOne}),guessHeadingDanielViewer:fill(STRINGS.guessHeading,{RIVAL:frame.managers.playerTwo}),
      privacyNoteNikViewer:fill(STRINGS.privacyNote,{RIVAL:frame.managers.playerOne}),privacyNoteDanielViewer:fill(STRINGS.privacyNote,{RIVAL:frame.managers.playerTwo}),
      nameplateOne:frame.managers.playerOne.toUpperCase(),nameplateTwo:frame.managers.playerTwo.toUpperCase(),
      // Status lines: exactly the text production shows in #transferPhaseStatus.
      f1Status:frame.status,guessStatus:frame.status,signingStatus:frame.status,signingStatusLocked:frame.status,completedStatus:frame.status,
      signingLockSummary:""};
    const inputs={playerOne:{signings:[],guessesAgainstRival:[]},playerTwo:{signings:[],guessesAgainstRival:[]}},results={live:{playerOne:[],playerTwo:[]}};
    if(frame.signingsLocked)inputs[frame.viewer].signings=frame.ownSignings.map(row=>({...row}));
    if(frame.verdicts){
      for(const r of ROLES){
        inputs[r].signings=frame.verdicts.rows[r].map(row=>({slot:row.slot,name:row.name,league:row.league,nationality:row.nationality}));
        results.live[r]=frame.verdicts.rows[r].map(row=>({slot:row.slot,release:row.release}));
        // plate.js reads the guesses against r from inputs[rival(r)].guessesAgainstRival.
        inputs[tfOther(r)].guessesAgainstRival=frame.verdicts.guessesAgainst[r].map(row=>({...row}));
      }
    }
    const cfg={viewer:frame.viewer,phase:frame.phase,timerSeconds:0,endRequested:frame.endRequested,signingsLocked:frame.signingsLocked,result:"live"};
    return {managers:{...frame.managers},clubs:{...frame.clubs},seasonNumber:frame.season,frames:{LIVE:cfg},strings,inputs,results,rival};
  }

  // Which production elements go into Team V's layout for a frame. Own fields only, by the production prefixes:
  // signings p1 = Daniel (playerOne) / p2 = Nik; guesses are named after the manager they target.
  function adoptionPlan(frame){
    const own=frame.viewer==="playerOne"?"p1":"p2",guess=frame.viewer==="playerOne"?"p2":"p1",ids=["transferChallengeError","refreshSharedTransferChallenge"];
    const extras=[];
    if(frame.phase==="WINDOW_OPEN"){ids.push("transferTimerDisplay","endTransferTimer");extras.push("startTransferTimer","continueFromTransfers");}
    else if(frame.phase==="GUESS_ENTRY"){for(let i=1;i<=3;i+=1)ids.push(`${guess}Guess${i}Type`,`${guess}Guess${i}Value`);ids.push("completeTransferChallenge");extras.push("continueFromTransfers");}
    else if(frame.phase==="SIGNING_ENTRY"){
      if(!frame.signingsLocked){for(let i=1;i<=3;i+=1)ids.push(`${own}Signing${i}Name`,`${own}Signing${i}Position`,`${own}Signing${i}Overall`,`${own}Signing${i}League`,`${own}Signing${i}Nationality`);ids.push("completeTransferChallenge");}
      ids.push("transferPhaseLockSummary");extras.push("continueFromTransfers");
    }else ids.push("continueFromTransfers");
    return tfFreeze({ids,extras});
  }

  // ---- Browser binding (lazy; never runs in Node) ----
  const BASE="visual-assets/v10_1/";
  const ASSET_BASE=BASE+DIR;
  const ACTION_CLASSES=Object.freeze({start:"btn-end sd-btn sd-btn--secondary",continueReplay:"btn-continue sd-btn sd-btn--secondary",error:"error-line"});
  let wordmarkClear=null,cameraWatch=null,nameCells=[],installed=false,registered=null,platemap=null,cached=null,mountedFrame=null,stage=null,adopted=[],cardSwaps=[],pending=false,timerNode=null,statusNode=null,stageSize=null,reframe=null,desktopLayout=null;
  const v10Screens=()=>root.CareerModeV10Screens;
  const tfDoc=()=>root.document||null;
  function tfWarn(context,error){if(root.console&&typeof root.console.warn==="function")root.console.warn(`[Career Mode Showdown] ${context}`,error);}
  // Absolute URLs: plate.js puts some of them in CSS custom properties, which plate.css would otherwise resolve
  // against its own folder.
  function tfAbsolute(path){try{return new root.URL(path,root.document.baseURI).href;}catch(_error){return path;}}
  function tfTransfer(){return root.CareerModeProductionSharedTransferChallenge||null;}
  function tfSection(){const doc=tfDoc();return doc?doc.getElementById(SCREEN):null;}
  function tfDomText(id){const doc=tfDoc(),node=doc&&doc.getElementById(id);return node?node.textContent:"";}
  function tfLive(){
    const transfer=tfTransfer(),section=tfSection();
    if(!transfer||!section||typeof transfer.getState!=="function")return null;
    let active=false,view=null;
    try{active=typeof transfer.isActive==="function"&&transfer.isActive()===true;view=transfer.getState();}catch(_error){return null;}
    return toTransferFrame({active,view,step:section.dataset.transferPhase,replay:section.dataset.sharedTransferReplay,status:tfDomText("transferPhaseStatus"),
      managers:{playerOne:tfDomText("transferManagerOne"),playerTwo:tfDomText("transferManagerTwo")},clubs:{playerOne:tfDomText("transferClubOne"),playerTwo:tfDomText("transferClubTwo")},
      label:typeof root.resolveFifa17TransferOption==="function"?root.resolveFifa17TransferOption:null});
  }
  // The loader compares frames by identity, so an unchanged view returns the same frame object.
  function tfFrame(){const next=tfLive();if(!next){cached=null;return null;}if(cached&&cached.key===next.key)return cached;cached=next;return cached;}

  // ---- adopting production elements into Team V's layout ----
  // A selector-enhanced field lives in its .transferCombobox wrapper (js/transferSelector.js); the wrapper moves with it.
  function tfUnit(node){const parent=node&&node.parentElement;return parent&&parent.classList.contains("transferCombobox")?parent:node;}
  function tfProduction(id){const doc=tfDoc();for(const node of doc.querySelectorAll(`[id="${id}"]`))if(!stage||!stage.contains(node))return node;return null;}
  function tfAdopt(node,place,mode,classes){
    // mode: "replace" (Team V's element) | "before" | "append"
    if(!node||!place)return false;
    const doc=tfDoc(),unit=tfUnit(node),marker=doc.createComment(`v10-transfer:${node.id||node.className}`);
    unit.parentNode.insertBefore(marker,unit);
    const record={node,marker,classes:[],style:node.getAttribute("style")};
    const add=classes!==undefined?String(classes).split(/\s+/).filter(Boolean):mode==="replace"?Array.from(place.classList):[];
    for(const name of add)if(!node.classList.contains(name)){node.classList.add(name);record.classes.push(name);}
    const style=mode==="replace"?place.getAttribute("style"):null;
    if(style)node.setAttribute("style",record.style?`${record.style};${style}`:style);
    if(mode==="replace")place.replaceWith(unit);else if(mode==="before")place.parentNode.insertBefore(unit,place);else place.appendChild(unit);
    adopted.push(record);
    return true;
  }
  // r87 (Nik 2026-10-30): the signing's position and overall have no slot in Team V's plate. They join the adopted
  // player name in one name cell (name, POS, OVR), so each breakpoint's four-column row keeps its shape
  // (css/v10Transfer.css). Own signings only.
  function tfOverallCells(plan){
    const doc=tfDoc();
    for(const id of plan.ids){
      if(!/Signing\dOverall$/.test(id))continue;
      const node=tfProduction(id),name=stage.querySelector(`[id="${id.replace(/Overall$/,"Name")}"]`),pos=tfProduction(id.replace(/Overall$/,"Position"));
      if(!node||!name||!tfIsAdopted(name)||!name.parentNode)continue;
      const cell=doc.createElement("div");cell.className="signing-name-cell";
      name.parentNode.insertBefore(cell,name);cell.appendChild(name);nameCells.push(cell);
      if(pos)tfAdopt(pos,cell,"append");
      tfAdopt(node,cell,"append");
    }
  }
  function tfRestore(){
    for(const {card,name,className} of cardSwaps.splice(0)){
      const now=card.getAttribute("class")||"";
      if(now===className.split(/\s+/).filter(part=>part!==name).join(" "))card.setAttribute("class",className);else card.classList.add(name);
    }
    for(const record of adopted.splice(0).reverse()){
      const {node,marker}=record;
      for(const name of record.classes)node.classList.remove(name);
      if(record.style===null)node.removeAttribute("style");else node.setAttribute("style",record.style);
      if(node.id==="transferTimerDisplay"){const clock=node.querySelector(".timer-clock");if(clock)clock.remove();}
      if(marker.parentNode){marker.parentNode.insertBefore(tfUnit(node),marker);marker.remove();}
    }
    for(const cell of nameCells.splice(0))cell.remove();
  }
  // A production node, or anything inside one (e.g. the selector's listbox inside its .transferCombobox wrapper).
  const tfIsAdopted=node=>adopted.some(record=>record.node===node||(record.node.contains&&record.node.contains(node)));
  // Team V's labelling elements keep their place under a "tw-" id, so no id exists twice.
  function tfRenameIds(){
    const renamed=new Map();
    for(const node of stage.querySelectorAll("[id]")){if(tfIsAdopted(node)||node.id.startsWith("tw-"))continue;const next=`tw-${node.id}`;renamed.set(node.id,next);node.id=next;}
    for(const node of stage.querySelectorAll("[aria-labelledby]")){const value=node.getAttribute("aria-labelledby").split(/\s+/).map(id=>renamed.get(id)||id).join(" ");node.setAttribute("aria-labelledby",value);}
  }
  function tfPlace(id){for(const node of stage.querySelectorAll(`[id="${id}"]`))if(!tfIsAdopted(node))return node;return null;}
  // Decorative second hand beside the live clock; the clock text itself is production's.
  function tfSyncClock(){
    const node=timerNode;if(!node||!tfIsAdopted(node))return;
    const text=Array.from(node.childNodes).filter(child=>child.nodeType===3).map(child=>child.nodeValue).join("").trim();
    // Team V's phone status band repeats the live clock (data-clock); the band text is production's status line.
    const band=stage&&stage.querySelector(".sign-status");if(band&&band.dataset.clock!==text)band.dataset.clock=text;
    let clock=node.querySelector(".timer-clock");
    if(!clock){const doc=tfDoc();clock=doc.createElement("span");clock.className="timer-clock";clock.setAttribute("aria-hidden","true");const hand=doc.createElement("span");hand.className="timer-hand";hand.setAttribute("aria-hidden","true");clock.appendChild(hand);node.appendChild(clock);}
    const match=/^(\d{1,2}):(\d{2})$/.exec(text),hand=clock.firstChild;
    if(hand&&match){const angle=(Number(match[2])%60)*6;hand.style.transform=`translate(-50%, -100%) rotate(${angle}deg)`;}
    tfDeadline(text);
  }
  // r87 Deadline Day (js/deadlineDay.js): the last minute of a live window, from this same clock text. Loaded with the skin.
  function tfDeadline(text){
    const deadline=root.CareerModeDeadlineDay;
    if(!deadline||typeof deadline.sync!=="function"||!stage)return;
    try{deadline.sync(stage,mountedFrame,text);}catch(error){tfWarn("Deadline Day strip skipped.",error);}
  }
  function tfAdoptAll(frame,section){
    const plan=adoptionPlan(frame);
    // Production finds the viewer's own guess / signing card with closest(".transferGuessCard" / ".transferManagerCard")
    // to enable and show its fields, so the Team V block that holds them carries that card class (its card look is
    // reset in css/v10Transfer.css).
    const guessCols=stage.querySelector(".panel.own .guess-cols"),signingRows=stage.querySelector(".panel.own .signing-rows");
    if(guessCols&&frame.phase==="GUESS_ENTRY")guessCols.classList.add("transferGuessCard");
    if(signingRows&&frame.phase==="SIGNING_ENTRY"&&!frame.signingsLocked)signingRows.classList.add("transferManagerCard");
    for(const id of plan.ids){
      const node=tfProduction(id),place=tfPlace(id);
      if(node&&place)tfAdopt(node,place,"replace");
    }
    tfOverallCells(plan);
    // The production card whose fields moved hands its card class to the Team V block while they are there, so one card
    // per manager carries it (production's own/rival lookups and the replay's one-visible-card guard stay exact).
    for(const name of ["transferGuessCard","transferManagerCard"]){
      if(!stage.querySelector(`.panel.own .${name}`))continue;
      for(const record of adopted){
        const parent=record.marker.parentNode,card=parent&&parent.closest?parent.closest(`.${name}`):null;
        if(card&&!stage.contains(card)&&!cardSwaps.some(swap=>swap.card===card)){cardSwaps.push({card,name,className:card.getAttribute("class")||""});card.classList.remove(name);}
      }
    }
    // HOME: the screen's own smart-back control (delegated by its .backButton class in js/screens.js).
    const home=section.querySelector(":scope > .seasonEntryActions .backButton"),homePlace=tfPlace("backToShowdownHome");
    if(home&&homePlace&&!stage.contains(home))tfAdopt(home,homePlace,"replace");
    // Production controls Team V has no slot for in this phase: next to the frame's own action, still hidden by
    // production until it shows them (the coordinator's start, the replay continue).
    const anchor=stage.querySelector(".panel.own .end-row, .panel.own .action-row")||stage.querySelector(".rules-inner");
    for(const id of plan.extras){
      const node=tfProduction(id);if(!node||!anchor)continue;
      tfAdopt(node,anchor,"append",id==="startTransferTimer"?ACTION_CLASSES.start:ACTION_CLASSES.continueReplay);
    }
    // Errors always stay on screen (the verdict layout has no error line of its own).
    // Signing entry: beside LOCK MY SIGNINGS, since laptops hide the status card then (css/v10Transfer.css, Nik 2026-10-30).
    const error=tfProduction("transferChallengeError"),rules=(frame.phase==="SIGNING_ENTRY"&&!frame.signingsLocked&&stage.querySelector(".panel.own .action-row"))||stage.querySelector(".rules-inner")||stage;
    if(error&&!tfIsAdopted(error))tfAdopt(error,rules,"append",ACTION_CLASSES.error);
    // Guess entry: production's status has two parts (phase · privacy line) where Team V's guess sign has room for the
    // phase name only, so the sign uses Team V's own signing-phase status board for it (css/v10Transfer.css: band).
    const band=stage.querySelector(".sign-status"),board=stage.querySelector(".sign-screen");
    if(frame.phase==="GUESS_ENTRY"&&band&&board&&frame.status.includes(" · ")){
      board.classList.add("status-board");band.classList.add("full");if(frame.status.split(" · ")[0].length<=14)band.classList.add("lead");
    }
    tfRenameIds();
    tfSyncClock();
  }
  // The refresh button is created by production on its first render; adopt it if it appeared later.
  function tfAdoptLate(){
    if(!stage||!mountedFrame)return;
    const place=stage.querySelector(`[id="tw-refreshSharedTransferChallenge"]`),node=tfProduction("refreshSharedTransferChallenge");
    if(place&&node&&!stage.contains(node))tfAdopt(node,place,"replace");
  }
  function tfHostMarkup(){
    const media="(max-width: 760px) and (orientation: portrait)",a=ASSET_BASE+"assets/";
    const pic=(cls,file,enter,size)=>`<picture class="${cls}"${enter?` data-sd-enter="${enter}"`:""}><source media="${media}" srcset="${file.includes("/")?BASE+file:a+file}" type="image/webp"><img alt=""${size||""} decoding="async"></picture>`;
    // r78 HO-031: the phone plate is Team V's ENV_TRANSFER_PHONE_V2 with both managers painted in (css/v10Transfer.css),
    // so the phone cut-outs (OVL_TRANSFER_*_PHONE_V2) are gone. HO-068: it is now the V2 office room (590W on Light or Save-Data).
    return `<div class="phone-hero-art" aria-hidden="true" data-sd-enter="scene">${pic("phone-hero-bg","plates-hc/ENV_OFFICE_PHONE_HC_V2"+(root.document?.documentElement?.dataset?.assets==="0"?"_590W":"")+".webp","",' width="1179" height="2096"')}</div><div class="stage" data-phone-contract="cinematic" role="region" aria-label="Transfer War"></div>`;
  }
  // JOB-1699: on desktop the entry and verdict phases need more room than Team V's painted frames give them.
  // Only those phases move the existing panels (same nodes, ids, copy and listeners) as one ordered group beside the
  // frozen plate camera, so the cards can grow; every other phase keeps the plate's own painted layout.
  // The group is aligned to the plate by the world's real rectangle (plate pixels x k), so the cards cover the painted
  // frames instead of leaving them showing underneath. Rotation and teardown restore the original world children.
  function tfFlowWanted(frame){
    if(!frame)return false;
    if(frame.phase==="COMPLETED")return Boolean(frame.verdicts);
    if(frame.phase==="GUESS_ENTRY")return !frame.guessesLocked;
    if(frame.phase==="SIGNING_ENTRY")return !frame.signingsLocked;
    return false;
  }
  function tfFlowDesktop(frame){
    if(!stage||typeof root.matchMedia!=="function"||!tfFlowWanted(frame))return;
    const world=stage.querySelector(".world"),footer=stage.querySelector(".hud-footer");
    if(!world||!footer)return;
    const media=root.matchMedia("(min-width: 1101px)");
    let group=null,places=[],frameRequest=null;
    const PLATE_W=1672;
    const restore=()=>{
      for(const {node,marker} of places){if(marker.parentNode){marker.parentNode.insertBefore(node,marker);marker.remove();}}
      places=[];if(group)group.remove();group=null;
    };
    // Plate pixel size, world offset and the painted frames' bottom edge, as the group's CSS custom properties.
    const measure=()=>{
      frameRequest=null;
      if(!group||!world.isConnected)return;
      const box=world.getBoundingClientRect(),host=stage.getBoundingClientRect();
      if(!box.width||!host.height)return;
      const k=box.width/PLATE_W;
      group.style.setProperty("--tw-k",`${k.toFixed(4)}px`);
      group.style.setProperty("--tw-x0",`${Math.round(box.left-host.left)}px`);
      group.style.setProperty("--tw-pb",`${Math.max(56,Math.round(host.height-(box.top-host.top)-792*k))}px`);
    };
    const schedule=()=>{if(frameRequest===null&&typeof root.requestAnimationFrame==="function")frameRequest=root.requestAnimationFrame(measure);};
    const sync=()=>{
      if(!media.matches){restore();return;}
      if(group)return;
      group=tfDoc().createElement("div");group.className="tw-desktop-content";
      footer.parentNode.insertBefore(group,footer);
      for(const node of Array.from(world.children).filter(node=>node.matches(".panel, .rules-card"))){
        const marker=tfDoc().createComment("v10-transfer:desktop-panel");
        node.parentNode.insertBefore(marker,node);places.push({node,marker});group.appendChild(node);
      }
      measure();schedule();
    };
    if(typeof media.addEventListener==="function")media.addEventListener("change",sync);else if(typeof media.addListener==="function")media.addListener(sync);
    if(typeof root.addEventListener==="function")root.addEventListener("resize",schedule);
    desktopLayout={dispose:()=>{
      if(typeof media.removeEventListener==="function")media.removeEventListener("change",sync);else if(typeof media.removeListener==="function")media.removeListener(sync);
      if(typeof root.removeEventListener==="function")root.removeEventListener("resize",schedule);
      if(frameRequest!==null&&typeof root.cancelAnimationFrame==="function")root.cancelAnimationFrame(frameRequest);
      frameRequest=null;restore();
    }};
    sync();
  }
  // r90 LOOK L33: on wide windows (1920x906, 2560x1000) Team V's plate camera crops the top of the plate, and the live
  // TRANSFER WAR title (plate y 62) slid under the top bar or off the window. Keep its place; drop it only by the pixels
  // it needs to clear the bar (8 px gap), and shrink it by as much as it drops (down to 70 %) so "WAR" stays off Daniel's
  // hair, which leans in under the title's right end. Runs after the plate's own re-frame on every resize.
  // HO-068 (Nik: nothing may touch a face): Team V's desktop camera covers the window and keeps the panels in view, so on
  // wide windows (1920x866, 2560x1000) it cropped the men's hair under the top bar and at 3440x1080 Daniel's whole face off
  // the window. In the office room their hair starts at plate row 65; when rows 60 to the panels' bottom do not fit, the
  // world is scaled down as one piece with the same "fit" look Team V's camera uses on short screens (the plate blurred in
  // the side bands). The camera's own result stands everywhere else, and plate.js stays Team V's.
  const TF_KEEP_TOP=60;
  function tfCameraClear(){
    const world=stage&&stage.querySelector(".world"),kv=platemap&&platemap.keepVisible;
    if(!world||!kv||stage.dataset.mode!=="desktop"||stage.classList.contains("short"))return;
    const vw=stage.clientWidth,vh=stage.clientHeight,k=+stage.dataset.k;
    if(!vw||!vh||!k)return;
    const footer=36,content=Math.max(kv.panelBottom,kv.contentBottom||0,+(stage.dataset.contentBottom||0));
    const s=Math.min(1,(vh-footer-6)/((content-TF_KEEP_TOP)*k));
    if(s>=1)return;
    const Ws=1672*k*s,Hs=941*k*s,offY=Math.max(0,Math.min(Hs-vh,content*k*s+footer+6-vh));
    const left=Ws<vw?(vw-Ws)/2:-Math.max(0,Math.min(Ws-vw,(kv.x[0]+kv.x[1])/2*k*s-vw/2)),top=-offY;
    const now=/scale\(([\d.]+)\)/.exec(world.style.transform||"");
    if(now&&Math.abs(+now[1]-s)<1e-4&&Math.abs(parseFloat(world.style.left)-left)<.5&&Math.abs(parseFloat(world.style.top)-top)<.5)return;
    world.style.transform=`scale(${s.toFixed(5)})`;world.style.transformOrigin="0 0";
    world.style.left=`${left.toFixed(1)}px`;world.style.top=`${top.toFixed(1)}px`;
    stage.classList.toggle("fit",Ws<vw-1);stage.dataset.scale=s.toFixed(4);stage.dataset.offY=String(Math.round(offY));
  }
  function tfWordmarkClear(){
    tfCameraClear();
    const world=stage&&stage.querySelector(".world"),mark=world&&world.querySelector(":scope > .transfer-wordmark");
    if(!mark)return;
    mark.style.removeProperty("--tw-wm-drop");mark.style.removeProperty("--tw-wm-scale");mark.style.removeProperty("--tw-wm-left");
    const view=mark.ownerDocument&&mark.ownerDocument.defaultView;
    if(!view||view.getComputedStyle(mark).position!=="absolute"||!world.offsetHeight)return;// phones: the title is in flow
    const bar=mark.ownerDocument.querySelector(".sd-nav-top"),barBox=bar&&bar.getBoundingClientRect();
    const barBottom=barBox&&barBox.height>0?barBox.bottom:0,box=world.getBoundingClientRect(),scale=box.height/world.offsetHeight||1;
    // r90 LOOK L35: a narrow window (4:3, 5:4) crops the plate's sides. The title then starts 16 px inside the window and
    // keeps clear of Daniel's hair and of the clock board: it either ends 10 plate px left of his hair as the plate places
    // it, shrinking a little, or, when that would leave it under 75 %, rises to 8 px under the top bar and ends 6 plate px
    // above his hair, as wide as the board allows. HO-068: in Team V's office room his hair starts at x 441, y 65 of these
    // 1672 units (x 405, y 60 of the 1536 plate), higher than on the old plate (x 446, y 103), so the title rode on it.
    const k=world.offsetWidth/1672,ppx=k*scale,leftPlate=Math.max(36,(16-box.left)/ppx);
    let fit=1;
    if(leftPlate>36){
      const ratio=mark.offsetHeight/Math.max(1,mark.offsetWidth)||.21,topPlate=Math.max(0,(barBottom+8-box.top)/ppx);
      // the board's gold frame reaches 79 plate px left of the clock box (css/v10Transfer.css .sign-screen::before)
      const sign=stage.querySelector(".sign-screen"),signBox=sign&&sign.getBoundingClientRect();
      const boardLeft=signBox&&signBox.width>0?(signBox.left-box.left)/ppx-79:690;
      const beside=(431-leftPlate)/400,above=Math.min(1,(boardLeft-16-leftPlate)/400,(59-topPlate)/(400*ratio));
      mark.style.setProperty("--tw-wm-left",`${(leftPlate*k).toFixed(1)}px`);
      if(beside<.75&&above>beside){fit=above;mark.style.setProperty("--tw-wm-drop",`${((topPlate-62)*k).toFixed(1)}px`);}
      else fit=Math.min(1,beside);
      mark.style.setProperty("--tw-wm-scale",fit.toFixed(3));
      if(fit!==Math.min(1,beside))return;// raised under the bar already
    }
    const need=barBottom+8-(box.top+mark.offsetTop*scale);
    if(need<=0)return;
    const drop=Math.ceil(need/scale),platePx=drop/(world.offsetWidth/1672);
    mark.style.setProperty("--tw-wm-drop",`${drop}px`);
    mark.style.setProperty("--tw-wm-scale",Math.min(fit,Math.max(.7,1-platePx/400)).toFixed(3));
  }
  function tfTeardown(section){
    try{root.CareerModeDeadlineDay?.detach?.();}catch(_error){}
    if(desktopLayout){desktopLayout.dispose();desktopLayout=null;}
    tfRestore();
    if(stage&&stage.__tw&&typeof stage.__tw.dispose==="function"){try{stage.__tw.dispose();}catch(_error){}}
    const host=section&&section.querySelector(":scope > .tw-host");
    if(stageSize){stageSize.disconnect();stageSize=null;}
    if(reframe!==null){root.cancelAnimationFrame(reframe);reframe=null;}
    if(wordmarkClear){root.removeEventListener("resize",wordmarkClear);wordmarkClear=null;}
    if(cameraWatch){cameraWatch.disconnect();cameraWatch=null;}
    if(host)host.remove();
    if(section)section.classList.remove("tw-on");
    stage=null;mountedFrame=null;
  }
  function tfMount(frame,section){
    tfTeardown(section);
    try{
      const doc=tfDoc(),host=doc.createElement("div");
      host.className="tw-host";host.innerHTML=tfHostMarkup();
      section.appendChild(host);section.classList.add("tw-on");
      stage=host.querySelector(".stage");mountedFrame=frame;
      const drawn=root.TWPlate.render(stage,toPlateFixtures(frame),platemap,"LIVE",{webpOnly:true,freeze:true});
      // Team V's desktop camera is computed at render, but the screen's own styles switch on only after mount (js/v10Screens.js),
      // so the stage is still the tall unstyled section then and the panels and actions land below the screen. The plate
      // re-frames on window resize only, so tell it whenever the observer reports a stage size, the first report included:
      // when the styles apply before the observer's first report, that report is already the styled size and is the only
      // one. The resize goes out on the next frame, never inside the observer callback: re-framing there resizes the
      // still-unstyled stage again in the same delivery, and Chromium then reports "ResizeObserver loop completed with
      // undelivered notifications", which the app's error boundary shows as a 10 s error toast over the phone HUD's REFRESH.
      if(typeof root.ResizeObserver==="function"&&typeof root.requestAnimationFrame==="function"){let last="";stageSize=new root.ResizeObserver(entries=>{const box=entries[0]&&entries[0].contentRect;const size=box?`${Math.round(box.width)}x${Math.round(box.height)}`:"";if(!size||size===last)return;last=size;if(reframe===null&&typeof root.dispatchEvent==="function"&&typeof root.Event==="function")reframe=root.requestAnimationFrame(()=>{reframe=null;root.dispatchEvent(new root.Event("resize"));});});stageSize.observe(stage);}
      tfAdoptAll(frame,section);
      tfFlowDesktop(frame);
      // HO-068: the title was sometimes placed while the top bar was still hidden behind Loading (html[data-nav="none"],
      // so the bar measured 0px) and kept that drop once the bar showed: at 1920x866 and 2560x1000 it then sat under the top
      // bar. The camera also moves without a resize (the stage's first styled size), and the title image can load late.
      // Whenever the bar shows or hides, the camera writes the world's place or the title image loads, the title is placed
      // again on the next frame.
      const world=stage.querySelector(".world");
      if(world&&typeof root.MutationObserver==="function"&&typeof root.requestAnimationFrame==="function"){
        let queued=false;
        const again=()=>{if(queued)return;queued=true;root.requestAnimationFrame(()=>{queued=false;if(wordmarkClear)tfWordmarkClear();});};
        cameraWatch=new root.MutationObserver(again);
        cameraWatch.observe(world,{attributes:true,attributeFilter:["style"]});
        if(doc.documentElement)cameraWatch.observe(doc.documentElement,{attributes:true,attributeFilter:["data-nav"]});
        const markImg=world.querySelector(":scope > .transfer-wordmark img, :scope > img.transfer-wordmark");
        if(markImg&&!markImg.complete)markImg.addEventListener("load",again,{once:true});
      }
      // after the plate's resize listener (registered by render above), so it reads the new camera
      if(typeof root.addEventListener==="function"){wordmarkClear=()=>tfWordmarkClear();root.addEventListener("resize",wordmarkClear);}
      tfWordmarkClear();
      if(drawn&&typeof drawn.catch==="function")drawn.catch(error=>tfWarn("Transfer War motion skipped.",error));
    }catch(error){
      // Any failure leaves the app's own screen exactly as production rendered it.
      tfTeardown(section);
      tfWarn("Transfer War visuals unavailable; showing the standard screen.",error);
    }
  }
  function tfSchedule(){
    if(pending)return;pending=true;
    Promise.resolve().then(()=>{
      pending=false;
      const screens=v10Screens();
      if(!screens||!registered)return;
      tfAdoptLate();
      screens.show(SCREEN).catch(error=>tfWarn("Transfer War visuals could not update.",error));
    });
  }
  function tfObserve(){
    const section=tfSection();
    if(!section||typeof root.MutationObserver!=="function")return;
    new root.MutationObserver(tfSchedule).observe(section,{attributes:true,attributeFilter:["data-transfer-phase","data-shared-transfer-replay"]});
    // index.html's own status and clock elements; production never replaces them.
    statusNode=root.document.getElementById("transferPhaseStatus");timerNode=root.document.getElementById("transferTimerDisplay");
    // Team V's sign draws production's status text (frame.status), so a new status line redraws the frame.
    if(statusNode)new root.MutationObserver(tfSchedule).observe(statusNode,{childList:true,characterData:true,subtree:true});
    if(timerNode)new root.MutationObserver(tfSyncClock).observe(timerNode,{childList:true,characterData:true,subtree:true});
    // Managers/clubs/title are rewritten on each production render (cheap: an unchanged frame does nothing).
    for(const id of ["transferManagerOne","transferManagerTwo","transferClubOne","transferClubTwo"]){const node=root.document.getElementById(id);if(node)new root.MutationObserver(tfSchedule).observe(node,{childList:true,characterData:true,subtree:true});}
  }
  async function tfPlatemap(){
    if(platemap)return platemap;
    const response=await root.fetch(typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(BASE+FILES.platemap):BASE+FILES.platemap);
    if(!response.ok)throw new Error("TRANSFER_V10_PLATEMAP");
    const map=await response.json();
    // Overlay and glass paths are relative to Team V's folder; the app page is elsewhere.
    const fingertip=map.overlays&&map.overlays.nikFingertip;
    if(fingertip&&fingertip.files)for(const size of Object.keys(fingertip.files))fingertip.files[size]=tfAbsolute(ASSET_BASE+fingertip.files[size]);
    if(map.mobile&&map.mobile.glass&&map.mobile.glass.file)map.mobile.glass.file=tfAbsolute(ASSET_BASE+map.mobile.glass.file);
    platemap=map;
    return platemap;
  }
  function tfInstall(){
    if(installed||tfNode||!root.document)return registered||Promise.resolve(null);
    installed=true;
    // Read by plate.js when it loads: no self-start, and asset paths from the app page.
    root.TRANSFER_WAR_APP=true;root.TRANSFER_WAR_BASE=tfAbsolute(ASSET_BASE);
    registered=root.loadRuntimeScript("v10-screens","js/v10Screens.js",()=>Boolean(root.CareerModeV10Screens)).then(()=>{
      const screens=v10Screens().install();
      screens.register(SCREEN,{
        css:FILES.css.slice(),
        js:[FILES.script.slice()],
        prepare:()=>tfPlatemap(),
        frame:()=>tfFrame(),
        mount:(frame,host)=>tfMount(frame,host),
        unmount:host=>tfTeardown(host)
      });
      tfObserve();
      // r87 Deadline Day: a small static script, fetched with the skin (no Firebase); the clock drives it.
      Promise.resolve(root.loadRuntimeScript("deadline-day","js/deadlineDay.js",()=>Boolean(root.CareerModeDeadlineDay))).catch(error=>tfWarn("Deadline Day strip unavailable.",error));
      if(typeof root.getActiveScreenName==="function"&&root.getActiveScreenName()===SCREEN)tfSchedule();
      return screens;
    }).catch(error=>{registered=null;installed=false;tfWarn("Transfer War visuals unavailable.",error);return null;});
    return registered;
  }

  return Object.freeze({contractVersion:1,SCREEN,DIR,FILES,STRINGS,toTransferFrame,toPlateFixtures,adoptionPlan,install:tfInstall,
    isMounted:()=>Boolean(mountedFrame)});
});
