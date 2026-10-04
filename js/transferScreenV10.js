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
  // Team V's approved copy (fixtures.json "strings" at 5e05a1f) for the labels Team V draws itself. Production keeps
  // every text it renders (status, buttons, timer, lock summary, errors): those elements are the production ones.
  const STRINGS=Object.freeze({
    title:"SEASON {season} · TRANSFER CHALLENGE",back:"HOME",refresh:"REFRESH",rail:Object.freeze(["Window","Guesses","Signings","Verdicts"]),railAriaLabel:"Transfer Challenge progress",
    f1Intro:"Ends early only if you both agree.",f1RulesLine:"15 MIN · 3 SIGNINGS · 3 GUESSES",f1Action:"END EARLY",f1ActionRequested:"EARLY END REQUESTED ✓",
    ruleNote:"Guess a league or nationality. A matching signing must be released.",
    guessHeading:"Guess {RIVAL}'s signings",privacyNote:"Hidden from {RIVAL} until you both lock.",
    selectPlaceholder:"Guess type",selectLeague:"League",selectNationality:"Nationality",valuePlaceholder:"Pick a type first",primary:"LOCK GUESSES",
    signWindowClosed:"WINDOW CLOSED",tagYou:"YOU",tagSealed:"SEALED",tagPrivate:"PRIVATE",
    signingPrimary:"LOCK MY SIGNINGS",signingInvalid:"Complete signing {n} with player name, previous league and nationality.",
    signingPlaceholderName:"Player name",signingPlaceholderLeague:"Previous league",signingPlaceholderNationality:"Nationality",
    verdictHeading:"{MANAGER} · {CLUB}",verdictEmpty:"No signings were entered.",verdictRelease:"RELEASE · MATCHED BY RIVAL GUESS",verdictKeep:"KEEP · NO RIVAL GUESS MATCH",
    continueLabel:"SHARED SEASON RESULTS COMING NEXT",guessRevealHeading:"{GUESSER} guesses {OWNER}'s signings"
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
    return (Array.isArray(rows)?rows:[]).filter(row=>row&&Number.isInteger(row.slot)).map(row=>({slot:row.slot,name:tfText(row.name),league:tfLabel(label,"league",row.leagueId),nationality:tfLabel(label,"nationality",row.nationalityId)})).sort((a,b)=>a.slot-b.slot);
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
      signingsLocked:phase==="SIGNING_ENTRY"&&(replay||(Array.isArray(state&&state.signingLockedRoles)&&state.signingLockedRoles.includes(role))),
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
      if(!frame.signingsLocked){for(let i=1;i<=3;i+=1)ids.push(`${own}Signing${i}Name`,`${own}Signing${i}League`,`${own}Signing${i}Nationality`);ids.push("completeTransferChallenge");}
      ids.push("transferPhaseLockSummary");extras.push("continueFromTransfers");
    }else ids.push("continueFromTransfers");
    return tfFreeze({ids,extras});
  }

  // ---- Browser binding (lazy; never runs in Node) ----
  const BASE="visual-assets/v10_1/";
  const ASSET_BASE=BASE+DIR;
  const ACTION_CLASSES=Object.freeze({start:"btn-end sd-btn sd-btn--secondary",continueReplay:"btn-continue sd-btn sd-btn--secondary",error:"error-line"});
  let installed=false,registered=null,platemap=null,cached=null,mountedFrame=null,stage=null,adopted=[],pending=false,timerNode=null,statusNode=null;
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
  function tfRestore(){
    for(const record of adopted.splice(0).reverse()){
      const {node,marker}=record;
      for(const name of record.classes)node.classList.remove(name);
      if(record.style===null)node.removeAttribute("style");else node.setAttribute("style",record.style);
      if(node.id==="transferTimerDisplay"){const clock=node.querySelector(".timer-clock");if(clock)clock.remove();}
      if(marker.parentNode){marker.parentNode.insertBefore(tfUnit(node),marker);marker.remove();}
    }
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
    const error=tfProduction("transferChallengeError"),rules=stage.querySelector(".rules-inner")||stage;
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
    const pic=(cls,file,enter,size)=>`<picture class="${cls}"${enter?` data-sd-enter="${enter}"`:""}><source media="${media}" srcset="${a}${file}" type="image/webp"><img alt=""${size||""} decoding="async"></picture>`;
    return `<div class="phone-hero-art" aria-hidden="true" data-sd-enter="scene">${pic("phone-hero-bg","ENV_TRANSFER_PHONE_V1.webp","",' width="1179" height="2096"')}${pic("phone-hero phone-hero-daniel","OVL_TRANSFER_DANIEL_PHONE_V1.webp","character-left")}${pic("phone-hero phone-hero-nik","OVL_TRANSFER_NIK_PHONE_V1.webp","character-right")}</div><div class="stage" data-phone-contract="cinematic" role="region" aria-label="Transfer Challenge"></div>`;
  }
  function tfTeardown(section){
    tfRestore();
    if(stage&&stage.__tw&&typeof stage.__tw.dispose==="function"){try{stage.__tw.dispose();}catch(_error){}}
    const host=section&&section.querySelector(":scope > .tw-host");
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
      tfAdoptAll(frame,section);
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
  function install(){
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
      if(typeof root.getActiveScreenName==="function"&&root.getActiveScreenName()===SCREEN)tfSchedule();
      return screens;
    }).catch(error=>{registered=null;installed=false;tfWarn("Transfer War visuals unavailable.",error);return null;});
    return registered;
  }

  return Object.freeze({contractVersion:1,SCREEN,DIR,FILES,STRINGS,toTransferFrame,toPlateFixtures,adoptionPlan,install,
    isMounted:()=>Boolean(mountedFrame)});
});
