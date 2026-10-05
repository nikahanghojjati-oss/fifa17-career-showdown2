(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSeasonFinalV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const BASE="visual-assets/v10_1/",ROLES={playerOne:"daniel",playerTwo:"nik",draw:"draw"};
  const COUNT_FIELDS=["seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies"];
  const number=x=>typeof x==="number"&&Number.isFinite(x);
  const freeze=x=>{if(x&&typeof x==="object"){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
  // Reads an already-authorized reconciliation snapshot. The view never computes a winner.
  // After close, its verified terminal witness retains that exact reconciliation winner.
  function finalFrame(reconciliation,terminal=null,history=null){
    const closed=terminal?.phase==="CLOSED"&&terminal.terminal===true;
    const r=reconciliation?.phase==="FINAL_SEASON_RECONCILED"&&reconciliation.finalSeasonReconciled===true?reconciliation:closed?terminal.terminalWitness:null;
    if(!r||!ROLES[r.winner]||!number(r.managerTotals?.playerOne)||!number(r.managerTotals?.playerTwo))return freeze({status:"unavailable"});
    const completed=closed&&terminal.rivalryId===r.rivalryId&&terminal.terminalWitness?.winner===r.winner;
    const frame={status:"partial",state:completed?"completed":"completion-pending",winner:ROLES[r.winner],totals:{daniel:r.managerTotals.playerOne,nik:r.managerTotals.playerTwo},margin:Math.abs(r.managerTotals.playerOne-r.managerTotals.playerTwo),seasonsPlayed:r.acceptedSeasons??r.totalSeasons,completionMark:completed?"":"Completion pending",presentation:{spotlight:r.winner==="draw"?"neutral":ROLES[r.winner]},heading:completed?"SHARED SHOWDOWN CLOSED":"SHOWDOWN FINAL RECONCILED",outcomeHeadline:r.winner==="draw"?"DRAW":(r.winner==="playerOne"?"Daniel":"Nik")+" WINS",resultText:r.winner==="draw"?"The showdown finishes level":"",previewLabel:"",message:"Trophy attribution is unavailable right now."};
    const p=history?.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&history.rivalryId===r.rivalryId?history.projection:null;
    if(p&&p.acceptedRevisionKey===r.acceptedRevisionKey&&p.acceptedSeasons===frame.seasonsPlayed&&p.managerRecords?.playerOne?.totalPoints===frame.totals.daniel&&p.managerRecords?.playerTwo?.totalPoints===frame.totals.nik){
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
  function currentCareer(){try{return typeof careerStatisticsModel!=="undefined"?careerStatisticsModel:null;}catch(_){return null;}}
  function element(folder){const holder=root.document.createElement("div");holder.innerHTML=templates[folder];return holder.firstElementChild;}
  const fail=error=>root.console?.warn?.("[Career Mode Showdown] Season visual unavailable",error);
  async function prepare(folder){
    if(!templates[folder]){const r=await root.fetch(BASE+folder+"/app-shell.html");if(!r.ok)throw new Error("V10_RESULTS_TEMPLATE");templates[folder]=await r.text();}
    if(folder!=="season-results"&&!strings[folder]){const r=await root.fetch(BASE+folder+"/app-strings.json");if(!r.ok)throw new Error("V10_RESULTS_STRINGS");strings[folder]=(await r.json()).strings;strings[folder].previewLabel="";}
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
    final=element("final-winner");final.classList.add("v10FinalStage");host.appendChild(final);
    for(const [id,slot] of [["sharedTerminalClosePanel","v10TerminalSlot"],["sharedFinalReconciliationPanel","v10ReconciliationSlot"]]){const live=root.document.getElementById(id);if(live)final.querySelector("#"+slot).appendChild(live);}
    const actions=root.document.getElementById("completeSeason")?.closest(".seasonEntryActions");if(actions)final.querySelector("#v10ExitSlot").appendChild(actions);
    const season=host.querySelector(".v10SeasonStage");if(season)season.hidden=true;host.classList.add("v10FinalMode");
    root.FINAL_WINNER_ROOT=final;root.FINAL_WINNER_FIXTURES={strings:strings["final-winner"],frames:{LIVE:frame}};root.ShowdownFinalWinnerBoot();
  }
  function renderSeason(frame,host){
    if(typeof root.ensureSeasonReviewUI==="function")root.ensureSeasonReviewUI();
    let stage=host.querySelector(".v10SeasonStage");
    if(!stage){stage=skinSeason(host,element("season-results"));if(stage)root.ShowdownSeasonResultsBoot(stage);}
    if(!stage)return;
    const role=state("CareerModeProductionSharedSeasonResults")?.managerRole;
    if(role){const tab=stage.querySelector(role==="playerTwo"?"#season-phone-tab-nik":"#season-phone-tab-daniel");if(tab&&!stage.dataset.ownerSet){tab.checked=true;stage.dataset.ownerSet=role;}}
    renderFinal(host,frame.final);
  }
  function renderStandings(frame,host){
    const selected=host.querySelector('#sdgViewCareer')?.getAttribute("aria-selected")==="true"?"CAREER":"SHOWDOWN";
    host.firstElementChild?.v10StageHandle?.destroy();host.replaceChildren(element("standings"));host.classList.add("standingsScreenV10");
    root.STANDINGS_ROOT=host.firstElementChild;root.STANDINGS_QS="frame="+selected;root.STANDINGS_FIXTURES={strings:strings.standings,frames:frame};root.ShowdownStandingsBoot();
  }
  // Register the new optional route lazily. Startup files and existing gameplay gates do not change.
  function installStandingsRoute(){
    try{if(typeof screens!=="undefined"&&!screens.includes("standings"))screens.push("standings");}catch(_){}
    const valid=root.isRouteStateValid;
    if(typeof valid==="function"&&!valid.v10Standings){const wrapped=function(id){return id==="standings"||valid.apply(this,arguments);};wrapped.v10Standings=true;wrapped.original=valid;root.isRouteStateValid=wrapped;}
    root.CareerModeV10Screens.setNavRoute("standings",async app=>{let host=root.document.getElementById("standings");if(!host){host=root.document.createElement("section");host.id="standings";host.className="screen hidden";host.setAttribute("aria-label","Standings");root.document.querySelector("#app main").appendChild(host);}return app.navigateTo("standings");});
  }
  function seasonSource(){const s=sfSnapshot();return {final:finalFrame(s.finalReconciliation,s.terminalClose,s.history)};}
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
    loader.register("seasonEntry",{auto:false,css:["season-results/season-results.css","final-winner/final-winner.css","season-results/app.css"],js:[["v10-season-results","season-results/season-results.js",()=>typeof root.ShowdownSeasonResultsBoot==="function"],["v10-final-winner","final-winner/final-winner.js",()=>typeof root.ShowdownFinalWinnerBoot==="function"]],prepare:()=>Promise.all([prepare("season-results"),prepare("final-winner")]),frame:seasonSource,mount:renderSeason,unmount:restoreFinal});
    loader.register("standings",{auto:false,css:["standings/standings.css","season-results/app.css"],js:[["v10-standings","standings/standings.js",()=>typeof root.ShowdownStandingsBoot==="function"]],prepare:()=>Promise.all([prepare("standings"),standingsModules()]),frame:()=>standingsFrames(currentRivalry(),currentCareer()),mount:renderStandings,unmount(host){host.firstElementChild?.v10StageHandle?.destroy();host.replaceChildren();}});
    installStandingsRoute();
    for(const e of ["career-mode-shared-final-reconciliation-state-change","career-mode-shared-terminal-close-state-change","career-mode-shared-history-convergence-state-change","career-mode-shared-multi-season-state-change","career-mode-online-identity-change","career-mode-active-save-changed","career-mode-showdown-state-change"])root.addEventListener?.(e,wake);
    root.document.addEventListener("career-mode-screen-shown",()=>{signature="";followPair();wake();});
    followPair();
    wake();return true;
  }
  return Object.freeze({finalFrame,standingsFrames,skinSeason,install:installResults});
});
