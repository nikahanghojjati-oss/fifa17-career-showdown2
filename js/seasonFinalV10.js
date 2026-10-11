(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSeasonFinalV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // Shell-cached Team V files live under the runtime ?v= URL, so fetch them the same way (offline first launch).
  const assetUrl=path=>typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(path):path;
  const BASE="visual-assets/v10_1/",ROLES={playerOne:"daniel",playerTwo:"nik",draw:"draw"};
  const COUNT_FIELDS=["seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies"];
  const number=x=>typeof x==="number"&&Number.isFinite(x);
  const freeze=x=>{if(x&&typeof x==="object"){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
  // H1017-3: the terminal witness schema is frozen and carries no acceptedRevisionKey, so after close the history binding is
  // re-established from the history itself: the history protocol must rebuild the projection exactly (tamper check), and it must
  // be the complete accepted history (every season of the witness's fixed length) of the same rivalry. Accepted seasons are
  // immutable, so a complete verified history is the one the closed reconciliation was built from. Unavailable protocol fails closed.
  function closedHistoryBound(p,r){
    if(typeof p.acceptedRevisionKey!=="string"||!p.acceptedRevisionKey||p.rivalryId!==r.rivalryId||p.totalSeasons!==r.totalSeasons||r.completedSeason!==r.totalSeasons||p.acceptedSeasons!==r.totalSeasons||!Array.isArray(p.seasonHistory)||p.seasonHistory.length!==r.totalSeasons)return false;
    const api=root.CareerModeSharedHistoryConvergence||(typeof module!=="undefined"&&module.exports&&typeof require==="function"?require("./sharedHistoryConvergence.js"):null);
    try{return typeof api?.verifyProjection==="function"&&api.verifyProjection(p)===p;}catch(_){return false;}
  }
  // Reads an already-authorized reconciliation snapshot. The view never computes a winner.
  // After close, its verified terminal witness retains that exact reconciliation winner.
  function finalFrame(reconciliation,terminal=null,history=null){
    const closed=terminal?.phase==="CLOSED"&&terminal.terminal===true;
    const r=reconciliation?.phase==="FINAL_SEASON_RECONCILED"&&reconciliation.finalSeasonReconciled===true?reconciliation:closed?terminal.terminalWitness:null;
    if(!r||!ROLES[r.winner]||!number(r.managerTotals?.playerOne)||!number(r.managerTotals?.playerTwo))return freeze({status:"unavailable"});
    const completed=closed&&terminal.rivalryId===r.rivalryId&&terminal.terminalWitness?.winner===r.winner;
    const frame={status:"partial",state:completed?"completed":"completion-pending",winner:ROLES[r.winner],totals:{daniel:r.managerTotals.playerOne,nik:r.managerTotals.playerTwo},margin:Math.abs(r.managerTotals.playerOne-r.managerTotals.playerTwo),seasonsPlayed:r.acceptedSeasons??r.totalSeasons,completionMark:completed?"":terminal?.automaticCloseFailed&&!terminal?.automaticSaving?"Saving failed. Try CLOSE SHARED SHOWDOWN again.":"Saving this Showdown to your career…",presentation:{spotlight:r.winner==="draw"?"neutral":ROLES[r.winner]},heading:completed?"SHARED SHOWDOWN CLOSED":"SHOWDOWN FINAL RESULT",outcomeHeadline:r.winner==="draw"?"DRAW":(r.winner==="playerOne"?"Daniel":"Nik")+" WINS",resultText:r.winner==="draw"?"The showdown finishes level":"",previewLabel:"",message:"Trophy attribution is unavailable right now."};
    const p=history?.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&history.rivalryId===r.rivalryId?history.projection:null;
    if(p&&(r===reconciliation?p.acceptedRevisionKey===r.acceptedRevisionKey:closedHistoryBound(p,r))&&p.acceptedSeasons===frame.seasonsPlayed&&p.managerRecords?.playerOne?.totalPoints===frame.totals.daniel&&p.managerRecords?.playerTwo?.totalPoints===frame.totals.nik){
      // JOB-1005: the last accepted season of the verified history. Points and winner are read as the record stores them; nothing is computed.
      const last=p.seasonHistory[p.seasonHistory.length-1],lp=last?.playerOne?.scoring?.total,ln=last?.playerTwo?.scoring?.total;
      if(last&&last.roundNumber===frame.seasonsPlayed&&number(lp)&&number(ln)&&lp>=0&&lp<=11&&ln>=0&&ln<=11&&ROLES[last.winner])frame.lastSeason={season:last.roundNumber,daniel:lp,nik:ln,winner:ROLES[last.winner]};
      const trophies={};
      for(const [role,m] of [["playerOne","daniel"],["playerTwo","nik"]]){const rec=p.managerRecords[role];if(!["championsLeagues","leagueTitles","domesticCups","totalTrophies"].every(k=>number(rec[k])))return freeze(frame);trophies[m]={championsLeague:rec.championsLeagues,leagueTitles:rec.leagueTitles,domesticCups:rec.domesticCups,total:rec.totalTrophies};}
      frame.trophies=trophies;frame.status="ready";frame.message="";
    }
    return freeze(frame);
  }
  function standingsFrames(rivalry,career){
    const scope=rivalry&&["loading","empty","unavailable","partial","ready"].includes(rivalry.status)?rivalry:{status:"unavailable"};
    let current={status:scope.status};
    if(["ready","partial","empty"].includes(scope.status)&&scope.score&&scope.managers){
      if(!["daniel","nik"].every(m=>number(scope.score[m])&&scope.managers[m]&&COUNT_FIELDS.every(k=>number(scope.managers[m][k]))))current={status:"unavailable"};
      else {current.score={...scope.score};current.managerRecords=Object.fromEntries(["daniel","nik"].map(m=>[m,Object.fromEntries(COUNT_FIELDS.map(k=>[k,scope.managers[m][k]]))]));}
      for(const k of ["season","totalSeasons","clubs","coverage"])if(scope[k]!=null)current[k]=scope[k];
    }
    if(["ready","partial"].includes(current.status)&&!current.managerRecords)current={status:"unavailable"};
    let all={status:career&&["loading","empty","unavailable","partial","ready"].includes(career.status)&&!career.interimLabel?career.status:"unavailable"};
    if(["ready","partial"].includes(all.status)&&career.managers&&Array.isArray(career.trophyRoom?.standings)){
      const standings={};
      for(const m of ["daniel","nik"]){const row=career.trophyRoom.standings.find(r=>r.manager===m),rec=career.managers[m];if(!row||!rec||!["careerPoints","seasonWins"].every(k=>number(row[k]))||!COUNT_FIELDS.every(k=>number(rec[k]))){all={status:"unavailable"};break;}standings[m]={...Object.fromEntries(COUNT_FIELDS.map(k=>[k,rec[k]])),careerPoints:row.careerPoints,seasonWins:row.seasonWins};}
      if(all.status!=="unavailable"){all.standings=standings;if(all.status==="partial")all.coverage=career.coverage;}
    }
    if(["ready","partial"].includes(all.status)&&!all.standings)all={status:"unavailable"};
    return freeze({SHOWDOWN:{view:"this-showdown",previewLabel:"",model:current},CAREER:{view:"career",previewLabel:"",model:all}});
  }
  // Reparent original nodes, including the entire review shell. No clone, value write,
  // button label change, visibility reset or listener replacement happens here.
  function skinSeason(host,stage){
    if(host.querySelector(".v10SeasonStage"))return host.querySelector(".v10SeasonStage");
    const doc=host.ownerDocument,original=[...host.children];
    const title=doc.getElementById("seasonEntryTitle"),grid=host.querySelector(".seasonEntryGrid"),review=doc.getElementById("seasonReviewPanel"),actions=doc.getElementById("completeSeason")?.closest(".seasonEntryActions");
    if(!grid||!actions||!review)return null;
    stage.classList.add("v10SeasonStage");
    const cards=grid.querySelectorAll(".seasonResultCard");
    cards.forEach((card,i)=>{card.id=i===0?"daniel-entry-panel":"nik-entry-panel";card.classList.add("entry-panel",i===0?"entry-panel--daniel":"entry-panel--nik","sd-panel");card.dataset.manager=i===0?"daniel":"nik";card.querySelector(".seasonManagerHeader")?.classList.add("manager-card-header");card.querySelector(".achievementChecks")?.classList.add("achievement-fields");card.querySelectorAll("label").forEach(label=>label.classList.add("field-row"));});
    stage.querySelector("#v10EntrySlot").replaceWith(grid);stage.querySelector("#v10UnusedEntrySlot").remove();
    review.classList.add("season-review-panel","sd-panel");stage.querySelector("#v10ReviewSlot").replaceWith(review);
    actions.classList.add("season-action-row");stage.querySelector("#v10EntryActionsSlot").replaceWith(actions);
    if(title){title.classList.add("sd-visually-hidden");stage.querySelector("#season-semantic-title").replaceWith(title);}
    const layout=stage.querySelector(".season-layout");
    for(const node of original)if(node.parentNode===host)layout.appendChild(node);
    host.appendChild(stage);host.classList.add("seasonScreenV10");
    return stage;
  }
  const templates={},strings={};let installed=false,scheduled=false,signature="";
  const state=name=>{try{return root[name]?.getState?.()||null;}catch(_){return null;}};
  function sfSnapshot(){return {identity:state("CareerModeOnlinePlayerIdentity"),pair:state("CareerModePersistentNikDanielPair"),multiSeason:state("CareerModeProductionSharedMultiSeasonProgression"),history:state("CareerModeProductionSharedHistoryConvergence"),finalReconciliation:state("CareerModeProductionSharedFinalReconciliation"),terminalClose:state("CareerModeProductionSharedTerminalClose")};}
  function currentRivalry(){return root.CareerModeSharedActiveShowdownAdapter?.rivalryView(sfSnapshot())||{status:"unavailable"};}
  // A supplied model first, then the provider-backed career model Stats, Trophy Room or History last read
  // for this account and pair. Standings itself adds no provider read.
  function currentCareer(){try{const supplied=typeof careerStatisticsModel!=="undefined"?careerStatisticsModel:null;return supplied??root.CareerModeRivalryLegacyV10?.cachedCareerModel?.()??null;}catch(_){return null;}}
  function stageElement(folder){const holder=root.document.createElement("div");holder.innerHTML=templates[folder];return holder.firstElementChild;}
  const fail=error=>root.console?.warn?.("[Career Mode Showdown] Season visual unavailable",error);
  async function prepare(folder){
    if(!templates[folder]){const r=await root.fetch(assetUrl(BASE+folder+"/app-shell.html"));if(!r.ok)throw new Error("V10_RESULTS_TEMPLATE");templates[folder]=await r.text();}
    if(folder!=="season-results"&&!strings[folder]){const r=await root.fetch(assetUrl(BASE+folder+"/app-strings.json"));if(!r.ok)throw new Error("V10_RESULTS_STRINGS");strings[folder]=(await r.json()).strings;strings[folder].previewLabel="";}
  }
  // The skin mounts after the legacy form is live and reparents it (and the action row). Moving a focused
  // field blurs it, so a value typed at that moment would land on <body>; put focus back on the same field.
  function sfKeepFocus(work){
    const doc=root.document,active=doc?.activeElement;
    try{return work();}finally{if(active&&active!==doc.body&&active.isConnected&&doc.activeElement!==active&&typeof active.focus==="function")active.focus({preventScroll:true});}
  }
  function restoreFinal(host){
    const final=host.querySelector(".v10FinalStage"),review=root.document.getElementById("seasonReviewPanel"),season=host.querySelector(".v10SeasonStage");
    if(final){for(const id of ["sharedTerminalClosePanel","sharedFinalReconciliationPanel"]){const n=root.document.getElementById(id);if(n&&review)review.appendChild(n);}const actions=root.document.getElementById("completeSeason")?.closest(".seasonEntryActions");if(actions&&season)season.querySelector(".season-layout").appendChild(actions);final.v10StageHandle?.destroy();final.remove();}
    if(season)season.hidden=false;
    host.classList.remove("v10FinalMode");
  }
  function renderFinal(host,frame){
    if(!frame.winner){restoreFinal(host);return;}
    let final=host.querySelector(".v10FinalStage");
    // A changed frame rebuilds supplementary art only. Live protocol panels move intact.
    if(final)restoreFinal(host);
    final=stageElement("final-winner");final.classList.add("v10FinalStage");host.appendChild(final);
    for(const [id,slot] of [["sharedTerminalClosePanel","v10TerminalSlot"],["sharedFinalReconciliationPanel","v10ReconciliationSlot"]]){const live=root.document.getElementById(id);if(live)final.querySelector("#"+slot).appendChild(live);}
    const actions=root.document.getElementById("completeSeason")?.closest(".seasonEntryActions");if(actions)final.querySelector("#v10ExitSlot").appendChild(actions);
    const season=host.querySelector(".v10SeasonStage");if(season)season.hidden=true;host.classList.add("v10FinalMode");
    root.FINAL_WINNER_ROOT=final;root.FINAL_WINNER_FIXTURES={strings:strings["final-winner"],frames:{LIVE:frame}};root.ShowdownFinalWinnerBoot();
  }
  // Open the phone tab on the signed-in manager's own card. The provider view can load after the skin mounts,
  // so fall back to the one card the provider left visible, and re-check whenever a card's class changes.
  function sfOwnerTab(stage){
    if(stage.dataset.ownerSet)return;
    let role=state("CareerModeProductionSharedSeasonResults")?.managerRole;
    if(!role){const open=[...stage.querySelectorAll("#daniel-entry-panel,#nik-entry-panel")].filter(card=>!card.classList.contains("hidden"));if(open.length===1)role=open[0].id==="nik-entry-panel"?"playerTwo":"playerOne";}
    if(role!=="playerOne"&&role!=="playerTwo")return;
    const tab=stage.querySelector(role==="playerTwo"?"#season-phone-tab-nik":"#season-phone-tab-daniel");if(tab){tab.checked=true;stage.dataset.ownerSet=role;}
  }
  // The loader stops waiting for a slow stylesheet after a timeout, and Team V's phone rules hide re-classed entry
  // cards. Keep the one rule that decides whether a manager's own card shows inline, so it never waits on a download.
  function sfCardRule(doc){
    const parent=doc?.head||doc?.documentElement;if(!parent||typeof doc.createElement!=="function"||doc.getElementById?.("v10SeasonCardRule"))return;
    const style=doc.createElement("style");style.id="v10SeasonCardRule";
    style.textContent="@media(max-width:900px){#app #seasonEntry.seasonScreenV10>.v10SeasonStage :is(#daniel-entry-panel,#nik-entry-panel):not(.hidden){display:grid!important}}" + `
/* JOB-1211: 768x1024 upright tablet falls above the existing 760px flow layout.
   Apply the same main-only scrolling and normal-flow panels in this tablet range. */
@media(min-width:750px) and (max-width:790px) and (min-height:1000px) and (max-height:1050px) and (orientation:portrait){
 /* 1. One scroll: the app's <main>. The screen grows with its content instead of clipping at 100%. */
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode){height:auto;overflow:visible}
 #app #seasonEntry.seasonScreenV10>.v10SeasonStage{--sr-hero:min(28svh,180px);position:relative;inset:auto;height:auto;min-height:100%;max-height:none;overflow:visible}
 /* 2. Hero capped: art layers are a fixed band at the top; UI flows below it. */
 #app #seasonEntry .v10SeasonStage :is(.sd-stage__layer--plate,.sd-stage__layer--atmosphere,.sd-stage__layer--cutout,.sd-stage__layer--light){height:var(--sr-hero)}
 #app #seasonEntry .v10SeasonStage .sd-stage__layer--ui{position:relative;inset:auto;padding-top:var(--sr-hero)}
 #app #seasonEntry .v10SeasonStage :is(#season-results-screen,.season-layout){position:static;inset:auto;overflow:visible}
 #app #seasonEntry .v10SeasonStage .season-layout{display:flex;flex-direction:column;gap:8px;padding:8px 12px 12px;pointer-events:auto}
 #app #seasonEntry .v10SeasonStage :is(.season-phone-toolbar,.entry-panel,.season-review-panel,.scoring-panel,.season-action-row,#seasonEntryError){position:relative;inset:auto;width:auto;height:auto;max-height:none;margin:0}
 #app #seasonEntry .v10SeasonStage :is(.season-phone-tab-input,.season-phone-sheet-toggle){top:var(--sr-hero)}
 /* 3. Panels show all their content; no inner scroll, no centring. */
 #app #seasonEntry.seasonScreenV10 :is(.seasonResultCard,.season-review-panel:not(.hidden)){overflow:visible;align-content:start}
 #app #seasonEntry.seasonScreenV10 .season-review-panel:not(.hidden){display:flex!important;flex-direction:column;gap:6px}
 /* 4. Result cards full width, stacked: Daniel (seasonReviewOne) then Nik (seasonReviewTwo). */
 #app #seasonEntry.seasonScreenV10 .season-review-panel .seasonReviewGrid{width:auto;grid-template-columns:1fr;margin:0}
 /* 5. Status lines sit together as one block just above the buttons; buttons last and not sticky. */
 #app #seasonEntry.seasonScreenV10 .season-review-panel>:is(.seasonReviewWarning,.seasonReviewError){order:8;margin:0}
 #app #seasonEntry.seasonScreenV10 .season-review-panel>.seasonReviewWarning:not(.hidden)~.seasonReviewWarning{margin-top:-6px;border-top:1px solid rgb(242 196 91 / .16)}
 #app #seasonEntry.seasonScreenV10 .season-review-panel>.seasonReviewActions{order:9}
 #app #seasonEntry.seasonScreenV10 .season-review-panel .seasonReviewActions{position:static;width:auto;margin:0;padding:0;background:none}
 /* 6. Local Reconciliation in the black-and-gold kit, readable size. */
 #app #seasonEntry.seasonScreenV10 .sharedLocalReconciliationPanel h3{margin:0;color:#f2c45b;font:800 13px/1.2 var(--f17-display,inherit);letter-spacing:1.2px}
 #app #seasonEntry.seasonScreenV10 .sharedLocalReconciliationPanel p{margin:4px 0;font-size:12px;line-height:1.4;color:#c9c2b0}
 #app #seasonEntry.seasonScreenV10 .sharedLocalReconciliationPanel .stateNote{width:auto;color:#efe7d2;background:rgb(5 7 9 / .82);border-left:3px solid #f2c45b}
 /* 7. Entry actions (REVIEW / BACK) follow the results. */
 #app #seasonEntry .v10SeasonStage .season-action-row{position:relative;inset:auto;order:10}

 /* Keep the sole scroll owner as tall as Safari's viewport (r64 Signing Entry). */
 html[data-v10-screen="seasonEntry"] #app main:has(#seasonEntry.seasonScreenV10:not(.v10FinalMode)){
  position:fixed;inset:0;height:100svh;height:100dvh;padding:0;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode){position:relative;inset:auto;height:auto;min-height:0;margin:0;z-index:0}
 #app #seasonEntry.seasonScreenV10>.v10SeasonStage{min-height:100svh;min-height:100dvh}
 #app #seasonEntry .v10SeasonStage .sd-stage__registered{display:none}
 /* A normal-flow title gets its own row above the tabs, independent of the art camera's mode. */
 #app #seasonEntry .v10SeasonStage .season-phone-title{display:none}
 #app #seasonEntry .v10SeasonStage .season-title-block{position:relative;inset:auto;margin:8px 12px}
 #app #seasonEntry .v10SeasonStage #screen-title{position:relative;inset:auto;width:min(78vw,310px);height:auto;margin:0 auto;overflow:hidden;clip:auto;clip-path:none;white-space:normal}
 #app #seasonEntry .v10SeasonStage .season-title-wordmark{display:block}
 #app #seasonEntry .v10SeasonStage :is(.season-eyebrow,.season-tagline){display:none}
 /* Both photos have identical boxes, inset equally from the two sides. */
 #app #seasonEntry .v10SeasonStage .season-phone-hero{top:8px;width:34%;height:calc(var(--sr-hero) - 16px);object-fit:contain;object-position:center bottom}
 #app #seasonEntry .v10SeasonStage .season-phone-hero--daniel{left:8%;right:auto}
 #app #seasonEntry .v10SeasonStage .season-phone-hero--nik{left:auto;right:8%}
 #app #seasonEntry .v10SeasonStage .season-phone-toolbar{display:grid;grid-template-columns:1fr 1fr minmax(112px,auto);height:auto;min-height:46px;gap:2px;border:1px solid rgb(242 196 91 / .34);background:#090b0e}
 #app #seasonEntry .v10SeasonStage :is(.season-phone-tab,.season-phone-scoring-open){display:flex;align-items:center;justify-content:center;min-height:44px;padding:6px;color:#f2c45b;font:800 11px/1.2 var(--f17-display,inherit);cursor:pointer}
 #app #seasonEntry .v10SeasonStage :is(.season-phone-tab-input,.season-phone-sheet-toggle){position:absolute;display:block;width:1px;height:1px;opacity:0;pointer-events:none}
 #app #seasonEntry .v10SeasonStage .season-review-panel:not(.hidden){position:relative;inset:auto;width:auto;height:auto;max-height:none;padding:10px 12px;overflow:visible;overscroll-behavior:auto}
 #app #seasonEntry.seasonScreenV10 :is(#seasonReviewOne,#seasonReviewTwo){grid-column:auto}
 #app #seasonEntry.seasonScreenV10 .season-review-panel .seasonReviewActions{position:static;inset:auto;display:flex;flex-wrap:wrap}
 #app #seasonEntry.seasonScreenV10 .season-review-panel .seasonReviewActions button{max-width:100%;min-height:44px;white-space:normal}
 #app #seasonEntry .v10SeasonStage .season-action-row{position:relative;inset:auto;padding-bottom:max(8px,env(safe-area-inset-bottom))}
 #app #seasonEntry .v10SeasonStage .scoring-panel{display:none!important;min-height:0}
 #app #seasonEntry .v10SeasonStage #season-phone-scoring-toggle:checked~.scoring-panel{display:grid!important}
 #app #seasonEntry .v10SeasonStage .season-phone-sheet-close{position:absolute;top:6px;right:6px;display:flex;align-items:center;justify-content:center;width:44px;height:44px;color:#f2c45b;background:#090b0e;border:1px solid #f2c45b;cursor:pointer}
 #app #seasonEntry .v10SeasonStage #season-phone-tab-daniel:checked~.season-phone-toolbar .season-phone-tab--daniel,
 #app #seasonEntry .v10SeasonStage #season-phone-tab-nik:checked~.season-phone-toolbar .season-phone-tab--nik{color:#111;background:#f2c45b}
 #app #seasonEntry .v10SeasonStage :is(.season-phone-tab-input,.season-phone-sheet-toggle):focus-visible~.season-phone-toolbar{outline:3px solid #f2c45b;outline-offset:2px}
}
/* JOB-1212: 1280x650 laptop review grows into the main page scroll instead of
   an inner scroll box. Keep the existing desktop art/title registered to the viewport. */
@media(min-width:1240px) and (max-width:1320px) and (min-height:620px) and (max-height:680px) {
 html[data-v10-screen="seasonEntry"] #app main:has(#seasonEntry.seasonScreenV10:not(.v10FinalMode)){
  position:fixed; inset:0; height:100dvh; padding:0; overflow-x:hidden; overflow-y:auto;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode){
  position:relative; inset:auto; height:auto; min-height:100dvh; overflow:visible;
 }
 #app #seasonEntry.seasonScreenV10>.v10SeasonStage{
  position:relative; inset:auto; height:auto; min-height:100dvh; max-height:none; overflow:visible;
 }
 #app #seasonEntry .v10SeasonStage :is(.sd-stage__layer--plate,.sd-stage__layer--atmosphere,.sd-stage__layer--cutout,.sd-stage__layer--light){
  height:100dvh;
 }
 #app #seasonEntry .v10SeasonStage .sd-stage__registered{
  left:0!important; width:100%!important; height:56.25vw!important; top:calc((100dvh - 56.25vw) / 2)!important;
 }
 #app #seasonEntry .v10SeasonStage .sd-stage__layer--ui,
 #app #seasonEntry .v10SeasonStage #season-results-screen{
  position:relative; inset:auto; min-height:100dvh; overflow:visible;
 }
 #app #seasonEntry .v10SeasonStage .season-title-block{height:100dvh; bottom:auto}
 #app #seasonEntry .v10SeasonStage .season-layout:has(.season-review-panel:not(.hidden)){
  position:relative; inset:auto; min-height:100dvh; box-sizing:border-box; padding:31.2dvh 0 16px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel:not(.hidden){
  position:relative; inset:auto; height:auto; max-height:none; margin:0 auto; overflow:visible; overscroll-behavior:auto;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel .seasonReviewActions{
  position:static; inset:auto;
 }
 #app #seasonEntry.seasonScreenV10:has(.season-review-panel:not(.hidden)) .v10SeasonStage .season-action-row{
  position:relative; inset:auto; margin:12px auto 0; height:auto;
 }
 #app #seasonEntry.seasonScreenV10:has(.season-review-panel:not(.hidden)) #seasonEntryError{
  position:relative; inset:auto; width:60%; margin:8px auto 0;
 }
}

`;
    parent.appendChild(style);
  }
  function renderSeason(frame,host){
    if(typeof root.ensureSeasonReviewUI==="function")root.ensureSeasonReviewUI();
    let stage=host.querySelector(".v10SeasonStage");
    if(!stage)sfCardRule(root.document);
    if(!stage){stage=skinSeason(host,stageElement("season-results"));if(stage){root.ShowdownSeasonResultsBoot(stage);if(typeof root.MutationObserver==="function"){const watch=new root.MutationObserver(()=>{if(stage.dataset.ownerSet)watch.disconnect();else sfOwnerTab(stage);});stage.querySelectorAll("#daniel-entry-panel,#nik-entry-panel").forEach(card=>watch.observe(card,{attributes:true,attributeFilter:["class"]}));}}}
    if(!stage)return;
    sfOwnerTab(stage);
    renderFinal(host,frame.final);
  }
  function renderStandings(frame,host){
    const selected=host.querySelector('#sdgViewCareer')?.getAttribute("aria-selected")==="true"?"CAREER":"SHOWDOWN";
    host.firstElementChild?.v10StageHandle?.destroy();host.replaceChildren(stageElement("standings"));host.classList.add("standingsScreenV10");
    root.STANDINGS_ROOT=host.firstElementChild;root.STANDINGS_QS="frame="+selected;root.STANDINGS_FIXTURES={strings:strings.standings,frames:frame};root.ShowdownStandingsBoot();
  }
  // Register the new optional route lazily. Startup files and existing gameplay gates do not change.
  function installStandingsRoute(){
    try{if(typeof screens!=="undefined"&&!screens.includes("standings"))screens.push("standings");}catch(_){}
    const valid=root.isRouteStateValid;
    if(typeof valid==="function"&&!valid.v10Standings){const wrapped=function(id){return id==="standings"||valid.apply(this,arguments);};wrapped.v10Standings=true;wrapped.original=valid;root.isRouteStateValid=wrapped;}
    root.CareerModeV10Screens.setNavRoute("standings",async app=>{let host=root.document.getElementById("standings");if(!host){host=root.document.createElement("section");host.id="standings";host.className="screen hidden";host.setAttribute("aria-label","Standings");root.document.querySelector("#app main").appendChild(host);}return app.navigateTo("standings");});
  }
  // JOB-1038: Terminal Close forgets the session, which clears the live history view. The last converged view of the same
  // rivalry is kept so the closed Final Winner still shows the final season and trophies; finalFrame re-verifies it.
  let retainedHistory=null;
  function sfRetainHistory(history){if(history?.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&history.projection)retainedHistory=history;return history;}
  // JOB-1042: the rival can close before this phone's live history converges. Reuse the session-free,
  // completed-only reader once per closed rivalry; the partial Final Winner stays visible during the read.
  const closedHistoryReads=new Map();
  const sfConverged=(history,rivalryId)=>history?.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&history.rivalryId===rivalryId&&history.projection;
  function sfClosedHistory(rivalryId){
    if(!closedHistoryReads.has(rivalryId)){
      const entry={history:null,promise:null};closedHistoryReads.set(rivalryId,entry);
      entry.promise=Promise.resolve().then(async()=>{
        if(!root.CareerModeSparkCompletedShowdownReader)await root.loadRuntimeScript("career-completed-reader","js/sparkCompletedShowdownReader.js",()=>Boolean(root.CareerModeSparkCompletedShowdownReader));
        const runtime=root.CareerModeProductionFirebaseRuntime,account=state("CareerModeSparkConnectedAccount");
        if(!account?.connected||!runtime)return;
        const services=await runtime.ensureAccountServices(),user=services?.auth?.currentUser;
        if(!services?.ok||!user||user.uid!==account.accountId)return;
        const sdk=services.firestoreSdk?.getDoc?services.firestoreSdk:await import(runtime.firebaseFirestoreModule);
        const result=await root.CareerModeSparkCompletedShowdownReader.readCompletedShowdown({firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc:sdk.getDoc},user,rivalryId});
        if(result?.status==="completed"&&result.rivalryId===rivalryId&&result.projection)entry.history={authoritative:true,phase:"HISTORY_CONVERGED",rivalryId,projection:result.projection};
      }).catch(()=>{}).then(()=>wake());
    }
    return closedHistoryReads.get(rivalryId).history;
  }
  function seasonSource(){
    const s=sfSnapshot(),live=sfRetainHistory(s.history),closed=s.terminalClose?.phase==="CLOSED"?s.terminalClose:null;
    const history=closed?.terminal===true?(sfConverged(live,closed.rivalryId)?live:sfConverged(retainedHistory,closed.rivalryId)?retainedHistory:sfClosedHistory(closed.rivalryId)):live;
    return {final:finalFrame(s.finalReconciliation,s.terminalClose,history)};
  }
  // The pair module notifies only its own subscribers (no window event), so Standings follows pairing
  // and closure through it. It may load after this file, so each screen change retries once until bound.
  let pairBound=false;
  function followPair(){if(pairBound)return;try{const api=root.CareerModePersistentNikDanielPair;if(typeof api?.subscribe==="function"){api.subscribe(()=>wake());pairBound=true;}}catch(_){}}
  function wake(){
    if(scheduled)return;scheduled=true;root.setTimeout(()=>{scheduled=false;const screen=root.getActiveScreenName?.();if(!["seasonEntry","standings"].includes(screen))return;
      const source=screen==="seasonEntry"?seasonSource():standingsFrames(currentRivalry(),currentCareer());
      const next=screen+JSON.stringify(source);if(next===signature)return;signature=next;root.CareerModeV10Screens.invalidate(screen);root.CareerModeV10Screens.show(screen).catch(fail);
    },0);
  }
  // Use the existing active adapter for acknowledged public counters. No provider read is added.
  // Loaded only when Standings opens: these files are not in the offline shell, and a failed load at
  // install would also leave Season Results without its listeners.
  async function standingsModules(){
    const load=root.loadRuntimeScript;
    for(const [key,p,api] of [["career-history","js/sharedHistoryConvergence.js","CareerModeSharedHistoryConvergence"],["career-analytics","js/sharedCareerAnalytics.js","CareerModeSharedCareerAnalytics"],["career-terminal","js/sharedTerminalClose.js","CareerModeSharedTerminalClose"],["career-final","js/sharedFinalReconciliation.js","CareerModeSharedFinalReconciliation"],["career-active-adapter","js/sharedActiveShowdownAdapter.js","CareerModeSharedActiveShowdownAdapter"]])await load(key,p,()=>Boolean(root[api]));
  }
  async function installResults(){
    if(installed)return true;installed=true;
    root.SEASON_RESULTS_APP=true;root.FINAL_WINNER_APP=true;root.STANDINGS_APP=true;
    const loader=root.CareerModeV10Screens.install();
    loader.register("seasonEntry",{auto:false,css:["season-results/season-results.css","final-winner/final-winner.css","season-results/app.css"],js:[["v10-season-results","season-results/season-results.js",()=>typeof root.ShowdownSeasonResultsBoot==="function"],["v10-final-winner","final-winner/final-winner.js",()=>typeof root.ShowdownFinalWinnerBoot==="function"]],prepare:()=>Promise.all([prepare("season-results"),prepare("final-winner")]),frame:seasonSource,mount:(frame,host)=>sfKeepFocus(()=>renderSeason(frame,host)),unmount:host=>sfKeepFocus(()=>restoreFinal(host))});
    loader.register("standings",{auto:false,css:["standings/standings.css","season-results/app.css"],js:[["v10-standings","standings/standings.js",()=>typeof root.ShowdownStandingsBoot==="function"]],prepare:()=>Promise.all([prepare("standings"),standingsModules()]),frame:()=>standingsFrames(currentRivalry(),currentCareer()),mount:renderStandings,unmount(host){host.firstElementChild?.v10StageHandle?.destroy();host.replaceChildren();}});
    installStandingsRoute();
    // Warm Season Results' kit, scripts and templates now (show() loads, then returns false while the screen is hidden),
    // so the skin mounts in the same tick the screen opens instead of after the form is already being filled in.
    if(typeof loader.show==="function")Promise.resolve(loader.show("seasonEntry")).catch(fail);
    for(const e of ["career-mode-shared-final-reconciliation-state-change","career-mode-shared-terminal-close-state-change","career-mode-shared-history-convergence-state-change","career-mode-shared-multi-season-state-change","career-mode-online-identity-change","career-mode-active-save-changed","career-mode-showdown-state-change","career-mode-online-career-model-change"])root.addEventListener?.(e,wake);
    root.addEventListener?.("career-mode-shared-history-convergence-state-change",()=>sfRetainHistory(state("CareerModeProductionSharedHistoryConvergence")));
    root.document.addEventListener("career-mode-screen-shown",()=>{signature="";followPair();wake();});
    followPair();
    wake();return true;
  }
  return Object.freeze({finalFrame,standingsFrames,skinSeason,install:installResults});
});
