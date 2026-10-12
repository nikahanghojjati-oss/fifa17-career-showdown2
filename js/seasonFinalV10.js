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
  /*SG-START*/
  // JOB-1701: Standings presentation rules (Team V's stage CSS stays frozen). Added once, after Team V's sheet.
  function sfStandingsRule(doc){
    const parent=doc?.head||doc?.documentElement;if(!parent||typeof doc.createElement!=="function"||doc.getElementById?.("v10StandingsRule"))return;
    const style=doc.createElement("style");style.id="v10StandingsRule";
    style.textContent=`
/* JOB-1701 Standings adapter. Team V's stage CSS is frozen; these rules are scoped by media query and loaded after it. */
html[data-v10-screen="standings"] #app > main:has(> #standings.standingsScreenV10:not(.hidden)){position:fixed;inset:0;z-index:30;display:block;box-sizing:border-box;width:100%;height:100svh;max-height:100svh;margin:0;padding:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;background:#07080a}
html[data-v10-screen="standings"] #app #standings.standingsScreenV10{position:relative;inset:auto;z-index:auto;width:100%;height:auto;min-height:100svh;margin:0;padding:0;contain:none}
#app #standings.standingsScreenV10 .sdg-toggle button:active{filter:brightness(.82)}
#app #standings.standingsScreenV10 :is(.sdg-toggle button,.sdg-state):focus-visible{outline:2px solid #ffe36c;outline-offset:-3px}

/* Phones and tablets upright: the heroes take what the title, board and bottom bar leave; all seven rows stay in view. */
@media (max-width:900px) and (orientation:portrait){
  #app #standings.standingsScreenV10{
    --sg-nav:calc(56px + env(safe-area-inset-bottom));--sg-row:clamp(18px,3svh,28px);--sg-title:clamp(62px,10svh,84px);--sg-board:calc(205px + 7 * var(--sg-row));
    --sg-hero:max(48px,calc(100svh - var(--sg-nav) - var(--sg-title) - var(--sg-board) - 32px));
  }
  #app #standings.standingsScreenV10 .sdg-stage{position:relative;width:100%;height:auto;min-height:100svh;overflow:visible}
  #app #standings.standingsScreenV10 .sdg-phoneArt{inset:0}
  #app #standings.standingsScreenV10 .sdg-phoneBg img{object-position:50% 0}
  #app #standings.standingsScreenV10 .sdg-phoneArt::after{inset:calc(var(--sg-hero) * .5) 0 0}
  #app #standings.standingsScreenV10 .sdg-phoneHero{top:0;height:calc(var(--sg-hero) + 64px);max-height:none}
  #app #standings.standingsScreenV10 .sdg-phoneHero--daniel{left:-3%;right:auto}
  #app #standings.standingsScreenV10 .sdg-phoneHero--nik{left:auto;right:-3%}
  #app #standings.standingsScreenV10 .sdg-phoneHero img{height:100%;width:auto}
  #app #standings.standingsScreenV10 .sd-stage__layer--ui{position:relative;inset:auto!important;top:auto!important;min-height:100svh;box-sizing:border-box;display:flex;flex-direction:column;justify-content:flex-start;gap:6px;padding:0 12px calc(var(--sg-nav) + 8px)}
  #app #standings.standingsScreenV10 .nav-reserve{display:none}
  #app #standings.standingsScreenV10 .sdg-header{margin-top:auto;min-height:var(--sg-title);display:flex;flex-direction:column;justify-content:center;gap:2px}
  #app #standings.standingsScreenV10 .sdg-header .sd-eyebrow{font-size:10px;letter-spacing:.25em;line-height:12px}
  #app #standings.standingsScreenV10 .sdg-wordmark{width:85%}
  #app #standings.standingsScreenV10 .sdg-wordmark img{max-height:clamp(34px,6svh,52px);width:auto;max-width:100%;margin:0 auto}
  #app #standings.standingsScreenV10 .sdg-header .sd-tagline{font-size:10px;letter-spacing:.24em;line-height:12px}
  #app #standings.standingsScreenV10 .sdg-main{margin:0}
  #app #standings.standingsScreenV10 .sdg-board{height:auto;overflow:visible;padding:0 12px 8px;border-width:2px}
  #app #standings.standingsScreenV10 .sdg-toggle{margin-top:6px}
  #app #standings.standingsScreenV10 .sdg-toggle button{min-height:44px;font-size:clamp(13px,4.2vw,17px);letter-spacing:.03em}
  #app #standings.standingsScreenV10 .sdg-section{margin:6px 0 0;font-size:clamp(15px,5vw,20px);line-height:1.1;letter-spacing:.1em}
  #app #standings.standingsScreenV10 .sdg-progress{margin:2px 0 0;font-size:12px;line-height:15px}
  #app #standings.standingsScreenV10 .sdg-scoreboard{grid-template-columns:1fr 1.6fr 1fr;gap:4px;margin-top:6px}
  #app #standings.standingsScreenV10 .sdg-crest{width:32px;height:38px}
  #app #standings.standingsScreenV10 .sdg-side strong{font-size:clamp(15px,5vw,19px)}
  #app #standings.standingsScreenV10 .sdg-scoreLabel{font-size:11px;letter-spacing:.09em;white-space:nowrap}
  #app #standings.standingsScreenV10 .sdg-scoreNumbers{gap:9px}
  #app #standings.standingsScreenV10 .sdg-scoreNumbers b{font-size:clamp(34px,7.5svh,50px)}
  #app #standings.standingsScreenV10 .sdg-scoreNumbers i{font-size:clamp(20px,4.4svh,29px)}
  #app #standings.standingsScreenV10 .sdg-leader{font-size:14px;min-height:16px;line-height:16px}
  #app #standings.standingsScreenV10 .sdg-rows{margin:4px 0 0;grid-template-rows:none;grid-auto-rows:var(--sg-row);height:auto;overflow:visible;background:none;flex:0 0 auto}
  #app #standings.standingsScreenV10 .sdg-val{font-size:clamp(15px,calc(var(--sg-row) * .85),20px);line-height:1}
  #app #standings.standingsScreenV10 .sdg-label{font-size:clamp(11px,calc(var(--sg-row) * .6),14px);line-height:1;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
  #app #standings.standingsScreenV10 .sdg-row{border-top-color:rgba(214,176,70,.6)}
  #app #standings.standingsScreenV10 .sdg-state{margin:8px 0;padding:10px;font-size:13px}
}

/* Upright tablets (adopted 1259): broad board, tablet type, 56px scope controls. */
@media (min-width:601px) and (max-width:900px) and (orientation:portrait){
  #app #standings.standingsScreenV10{--sg-row:clamp(34px,4.4svh,48px);--sg-title:clamp(104px,13svh,150px);--sg-board:calc(296px + 7 * var(--sg-row))}
  #app #standings.standingsScreenV10 .sdg-header .sd-eyebrow{font-size:15px;line-height:18px;letter-spacing:.29em}
  #app #standings.standingsScreenV10 .sdg-wordmark{width:min(78%,520px)}
  #app #standings.standingsScreenV10 .sdg-wordmark img{max-height:none;width:100%}
  #app #standings.standingsScreenV10 .sdg-header .sd-tagline{font-size:15px;line-height:18px;letter-spacing:.22em}
  #app #standings.standingsScreenV10 .sdg-board{padding:0 24px 12px}
  #app #standings.standingsScreenV10 .sdg-toggle{margin-top:10px}
  #app #standings.standingsScreenV10 .sdg-toggle button{min-height:56px;font-size:22px;letter-spacing:.08em}
  #app #standings.standingsScreenV10 .sdg-section{margin-top:10px;font-size:25px}
  #app #standings.standingsScreenV10 .sdg-progress{font-size:17px;line-height:20px;margin-top:3px}
  #app #standings.standingsScreenV10 .sdg-scoreboard{grid-template-columns:1fr 1.25fr 1fr;margin-top:12px;gap:10px}
  #app #standings.standingsScreenV10 .sdg-crest{width:50px;height:60px}
  #app #standings.standingsScreenV10 .sdg-side strong{font-size:25px}
  #app #standings.standingsScreenV10 .sdg-side span{display:block;font-size:15px}
  #app #standings.standingsScreenV10 .sdg-scoreLabel{font-size:15px}
  #app #standings.standingsScreenV10 .sdg-scoreNumbers{gap:15px}
  #app #standings.standingsScreenV10 .sdg-scoreNumbers b{font-size:clamp(52px,7.2svh,74px)}
  #app #standings.standingsScreenV10 .sdg-scoreNumbers i{font-size:clamp(32px,4.4svh,45px)}
  #app #standings.standingsScreenV10 .sdg-leader{font-size:18px;min-height:22px;line-height:22px}
  #app #standings.standingsScreenV10 .sdg-rows{margin-top:10px}
  #app #standings.standingsScreenV10 .sdg-val{font-size:clamp(20px,2.4svh,25px)}
  #app #standings.standingsScreenV10 .sdg-label{font-size:clamp(14px,1.8svh,18px)}
  #app #standings.standingsScreenV10 .sdg-state{font-size:16px;padding:16px}
}

/* Sideways phones: nothing is cut or nested-scrolled. Heroes frame the title; the board follows and main scrolls once. */
@media (max-width:900px) and (orientation:landscape){
  #app #standings.standingsScreenV10{--sg-nav:calc(56px + env(safe-area-inset-bottom))}
  #app #standings.standingsScreenV10 .sdg-stage{position:relative;width:100%;height:auto;min-height:100svh;overflow:visible}
  #app #standings.standingsScreenV10 .sdg-phoneArt{inset:0}
  #app #standings.standingsScreenV10 .sdg-phoneBg img{object-position:50% 20%}
  #app #standings.standingsScreenV10 .sdg-phoneArt::after{inset:96px 0 0}
  #app #standings.standingsScreenV10 .sdg-phoneHero{top:0;height:150px;max-height:none}
  #app #standings.standingsScreenV10 .sdg-phoneHero--daniel{left:3%;right:auto}
  #app #standings.standingsScreenV10 .sdg-phoneHero--nik{left:auto;right:3%}
  #app #standings.standingsScreenV10 .sdg-phoneHero img{height:100%;width:auto}
  #app #standings.standingsScreenV10 .sd-stage__layer--ui{position:relative;inset:auto!important;top:auto!important;min-height:100svh;box-sizing:border-box;display:flex;flex-direction:column;justify-content:flex-start;gap:6px;padding:6px 16px calc(var(--sg-nav) + 10px)}
  #app #standings.standingsScreenV10 .nav-reserve{display:none}
  #app #standings.standingsScreenV10 .sdg-header{width:min(46%,380px);margin:0 auto;display:flex;flex-direction:column;gap:2px}
  #app #standings.standingsScreenV10 .sdg-header .sd-eyebrow{font-size:9px;letter-spacing:.25em;line-height:11px}
  #app #standings.standingsScreenV10 .sdg-wordmark{width:70%}
  #app #standings.standingsScreenV10 .sdg-wordmark img{max-height:40px;width:auto;max-width:100%;margin:0 auto}
  #app #standings.standingsScreenV10 .sdg-header .sd-tagline{font-size:9px;letter-spacing:.24em;line-height:11px}
  #app #standings.standingsScreenV10 .sdg-main{width:min(100%,680px);margin:0 auto}
  #app #standings.standingsScreenV10 .sdg-board{width:100%;height:auto;overflow:visible;padding:0 14px 8px;border-width:2px}
  #app #standings.standingsScreenV10 .sdg-toggle{margin-top:6px}
  #app #standings.standingsScreenV10 .sdg-toggle button{min-height:44px;font-size:14px}
  #app #standings.standingsScreenV10 .sdg-section{margin:6px 0 0;font-size:15px}
  #app #standings.standingsScreenV10 .sdg-scoreboard{margin-top:6px}
  #app #standings.standingsScreenV10 .sdg-crest{width:32px;height:38px}
  #app #standings.standingsScreenV10 .sdg-scoreNumbers b{font-size:44px}
  #app #standings.standingsScreenV10 .sdg-rows{margin:4px 0 0;grid-template-rows:none;grid-auto-rows:28px;height:auto;overflow:visible;background:none;flex:0 0 auto}
  #app #standings.standingsScreenV10 .sdg-val{font-size:17px;line-height:1}
  #app #standings.standingsScreenV10 .sdg-label{font-size:12px;line-height:1;text-transform:uppercase;letter-spacing:.05em}
}

/* Desktop and laptops: NEXT_STANDINGS framing (full gold frame, filled active scope, gold row rules). Board geometry stays Team V's. */
@media (min-width:901px){
  #app #standings.standingsScreenV10 .sdg-board.sd-panel{border:2px solid #ddb747;box-shadow:inset 0 0 0 2px #6a4c13,inset 0 0 22px rgba(215,161,28,.12),0 12px 32px rgba(0,0,0,.5),0 0 10px rgba(231,185,67,.2)}
  #app #standings.standingsScreenV10 .sdg-toggle button[aria-selected="true"]{background:linear-gradient(180deg,#ffe38a,#c99420);color:#15110a;box-shadow:inset 0 0 0 1px #ffe9a0}
  #app #standings.standingsScreenV10 .sdg-toggle button:not([aria-selected="true"]):hover{background:rgba(242,196,91,.12)}
  #app #standings.standingsScreenV10 .sdg-row{border-top-color:rgba(214,176,70,.55)}
  #app #standings.standingsScreenV10 .sdg-label{font-size:clamp(13px,1.05vw,17px);color:#d9d4c6}
  #app #standings.standingsScreenV10 .sdg-rows{margin-bottom:14px}
}
/* 1366x768 and similar: the crest block, score and toggle pushed the last row onto the board edge. */
@media (min-width:901px) and (max-height:860px){
  #app #standings.standingsScreenV10 .sdg-board{overflow:hidden}
  #app #standings.standingsScreenV10 .sdg-toggle{margin-top:10px}
  #app #standings.standingsScreenV10 .sdg-toggle button{min-height:34px}
  #app #standings.standingsScreenV10 .sdg-section{margin-top:6px}
  #app #standings.standingsScreenV10 .sdg-scoreboard{margin-top:6px;gap:12px}
  #app #standings.standingsScreenV10 .sdg-crest{width:42px;height:50px}
  #app #standings.standingsScreenV10 .sdg-scoreNumbers b{font-size:clamp(42px,6.6svh,76px)}
  #app #standings.standingsScreenV10 .sdg-scoreNumbers i{font-size:clamp(24px,3.4svh,40px)}
  #app #standings.standingsScreenV10 .sdg-rows{margin-top:6px;margin-bottom:10px}
  #app #standings.standingsScreenV10 .sdg-val{font-size:clamp(15px,2.2svh,20px);line-height:1}
}
`;parent.appendChild(style);
  }
  /*SG-END*/
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
    // Decorative phone composition only; the legacy form and its controls stay intact.
    const scene=doc.createElement("div");scene.className="v10SeasonPhoneScene";scene.setAttribute("aria-hidden","true");
    layout.prepend(scene);
    // JOB-1599: sealed presentation copies existing tab words, never rival fields.
    for(const manager of ["daniel","nik"]){
      const tab=stage.querySelector('label[for="season-phone-tab-'+manager+'"]');
      if(!tab)continue;
      const sealed=doc.createElement("div");sealed.className="v10SeasonTabletSealed v10SeasonTabletSealed--"+manager;
      sealed.setAttribute("aria-hidden","true");
      sealed.textContent=Array.from(tab.childNodes||tab.children||[]).map(node=>String(node.textContent||"").trim()).filter(Boolean).join("\n");
      grid.appendChild(sealed);
    }
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
/* JOB-1206/1207/1208: upright 360x640, 390x844 and 430x932 entry + review; main remains the only scroll owner. */
@media (min-width:340px) and (max-width:370px) and (min-height:600px) and (max-height:680px) and (orientation:portrait),
       (min-width:380px) and (max-width:400px) and (min-height:810px) and (max-height:870px) and (orientation:portrait),
       (min-width:420px) and (max-width:440px) and (min-height:900px) and (max-height:960px) and (orientation:portrait) {
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-layout { min-width:0; box-sizing:border-box; }
 /* Side-by-side fields + two honours columns squeeze labels at 360px. Stack the sections. */
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard {
  min-width:0; width:100%; grid-template-columns:minmax(0,1fr);
  grid-template-areas:"head" "f1" "f2" "f3" "checks"; row-gap:4px; overflow:visible;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard>label { min-width:0; min-height:44px; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard .achievementChecks {
  min-width:0; grid-template-columns:repeat(2,minmax(0,1fr)); gap:4px 8px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard .achievementChecks label {
  min-width:0; min-height:44px; flex-direction:row-reverse; align-items:center;
  justify-content:flex-end; gap:6px; white-space:normal; overflow-wrap:anywhere;
 }
 /* A long club, warning or action label must wrap inside the phone, never widen it. */
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel .seasonReviewGrid {
  min-width:0; grid-template-columns:minmax(0,1fr);
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel .seasonSummaryCard {
  min-width:0; overflow-wrap:anywhere;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(.season-review-panel .seasonReviewActions button,.season-action-row button) {
  min-width:0; min-height:44px; white-space:normal; overflow-wrap:anywhere;
 }
}
/* JOB-1210: the 932x430 landscape range also matches desktop entry controls.
   Keep the phone's single page scroll and restore 44px targets at this size only. */
@media (min-width:910px) and (max-width:950px) and (min-height:410px) and (max-height:450px) and (orientation:landscape) {
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard>label,
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard .achievementChecks label {
  min-height:44px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard>label input[type=number] {
  min-height:44px; height:44px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard input[type=checkbox] {
  width:44px; height:44px; min-width:44px; min-height:44px; flex-basis:44px;
 }
}

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


#app #seasonEntry .v10SeasonPhoneScene { display:none; }
/* JOB-1597: adopted 1226 entry layout, limited to the upright phone range.
   Existing nodes, labels, badges, input values and event handlers remain authoritative.
   Review/error content may grow; main is the only scroll owner. */
@media (min-width:340px) and (max-width:440px) and (min-height:520px) and (max-height:960px) and (orientation:portrait) {
 #app main:has(#seasonEntry.seasonScreenV10:not(.hidden):not(.v10FinalMode)) { overflow-y:auto; overflow-x:hidden; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) { min-width:0; padding:0; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage:not([hidden]) {
  min-width:0; min-height:100%; position:relative; box-sizing:border-box;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-layout {
  position:relative; min-width:0; width:100%; max-width:430px; margin:0 auto;
  min-height:100%; box-sizing:border-box; padding:0 10px max(10px,env(safe-area-inset-bottom));
  display:grid; grid-template-columns:minmax(0,1fr);
  grid-template-rows:auto 44px auto auto 56px; gap:6px;
  background:#090b0e;
 }

 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene { background-image:url("${assetUrl(BASE+"season-results/assets/ENV_SR_PHONE_V1.webp")}"); }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::before { background-image:url("${assetUrl(BASE+"season-results/assets/OVL_SR_DANIEL_PHONE_V1.webp")}"),url("${assetUrl(BASE+"season-results/assets/OVL_SR_NIK_PHONE_V1.webp")}"); }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::after { background-image:url("${assetUrl(BASE+"season-results/assets/TITLE_SR_PHONE_V1.webp")}"); }

 /* Leave 430px for the live card, tabs, actions, gaps and bottom inset. */
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene {
  display:block; grid-column:1; grid-row:1; min-height:80px; height:clamp(80px,calc(100svh - 430px - env(safe-area-inset-bottom)),270px);
  position:relative; margin:0 -10px; overflow:hidden; pointer-events:none;
  background-position:center; background-size:cover;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::before,
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::after {
  content:""; position:absolute; pointer-events:none; background-repeat:no-repeat;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::before {
  inset:0; background-position:left bottom 16%,right bottom 16%;
  background-size:55% 82%,55% 82%;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::after {
  inset:68% 2% 0; background-position:center; background-size:contain;
 }
 /* FIX ROUND 1: remove the original hero from layout, regardless of asset filenames. */
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(img.season-phone-bg,.season-phone-hero--daniel,.season-phone-hero--nik,img.season-title-wordmark) { display:none!important; }
 /* Claude lane: the scene replaces the old hero band, so none of its reserved space stays in flow. */
 #app #seasonEntry.seasonScreenV10>.v10SeasonStage.v10SeasonStage { --sr-hero:0px; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(.sd-stage__layer--plate,.sd-stage__layer--cutout,.sd-stage__layer--light,.sd-stage__layer--atmosphere) { display:none!important; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(img.season-phone-bg,.season-phone-hero,img.season-phone-title,img.season-title-wordmark) { display:none!important; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-title-block { margin:0; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .sd-stage__layer--ui { padding-top:0; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-layout> :has(label[for="season-phone-tab-daniel"]) {
  grid-column:1; grid-row:2; min-width:0; min-height:44px; margin:0;
  display:grid; grid-template-columns:1fr 1fr 1.1fr; border:1px solid #f2c45b;
  border-radius:5px; background:#07090deb;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage label:is([for="season-phone-tab-daniel"],[for="season-phone-tab-nik"]) {
  min-width:0; min-height:44px; box-sizing:border-box; padding:3px;
  display:flex; align-items:center; justify-content:center; flex-direction:column;
  font-size:11px; line-height:1.2; letter-spacing:.6px; border:1px solid #ad8739;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-layout> :has(label[for="season-phone-tab-daniel"]) :is(button,label):not([for="season-phone-tab-daniel"]):not([for="season-phone-tab-nik"]) {
  min-width:0; min-height:44px; white-space:normal; padding:3px; font-size:10px; line-height:1.2;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonEntryGrid {
  grid-column:1; grid-row:3; min-width:0; width:100%; margin:0;
  display:grid; grid-template-columns:minmax(0,1fr); gap:0;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard {
  box-sizing:border-box; min-width:0; width:100%; min-height:232px; margin:0; padding:10px;
  grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);
  grid-template-areas:"head head" "f1 checks" "f2 checks" "f3 checks";
  grid-template-rows:auto repeat(3,minmax(44px,auto)); gap:8px 12px;
  border:1px solid #f2c45b; border-radius:8px; overflow:visible;
  background:linear-gradient(125deg,#080b0df5 65%,#73552270);
  box-shadow:inset 0 0 0 3px #ad873922,0 6px 22px #0008;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonManagerHeader {
  grid-area:head; min-width:0; min-height:38px; margin:0; padding:0 0 6px;
  border-bottom:1px solid #f2c45b; gap:8px; flex-wrap:wrap;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonManagerHeader :is(h2,h3) { font-size:23px; margin:0; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonManagerHeader img { max-width:28px; max-height:28px; object-fit:contain; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard>label {
  display:flex; justify-content:space-between; align-items:center; min-width:0;
  min-height:44px; gap:6px; font-size:10px; line-height:1.2; letter-spacing:.5px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard>label input[type=number] {
  box-sizing:border-box; width:54px; min-width:44px; height:44px; min-height:44px;
  flex:0 0 54px; padding:6px; font-size:20px; border:1px solid #f2c45b; border-radius:4px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard .achievementChecks {
  grid-area:checks; min-width:0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
  grid-template-rows:repeat(2,minmax(68px,auto)); gap:7px; padding-left:9px; border-left:1px solid #ad873955;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard .achievementChecks label {
  min-width:0; min-height:68px; display:flex; flex-direction:column;
  align-items:flex-start; justify-content:space-between; gap:3px; font-size:10px;
  line-height:1.3; white-space:normal; overflow-wrap:normal; word-break:normal;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard .achievementChecks input[type=checkbox] {
  width:44px; height:44px; min-width:44px; min-height:44px; margin:0; flex:0 0 44px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel {
  grid-column:1; grid-row:4; min-width:0; margin:0; overflow:visible;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-action-row {
  grid-column:1; grid-row:5; min-width:0; margin:0; display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr)); align-items:center; gap:8px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-action-row button {
  box-sizing:border-box; min-width:0; min-height:48px; width:100%; margin:0; padding:8px;
  white-space:normal; overflow-wrap:anywhere; font-size:10px; line-height:1.3;
  border:1px solid #f2c45b; border-radius:4px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(input,button,label):focus-visible {
  outline:2px solid white; outline-offset:2px;
 }
}

/* JOB-1598: adopted 1229 sideways composition only (740x360 and 844x390).
   Reuse the live form in document order. Review/errors expand in main's flow. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape) {
 #app main:has(#seasonEntry.seasonScreenV10:not(.hidden):not(.v10FinalMode)) {
  overflow-y:auto; overflow-x:hidden;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) { min-width:0; padding:0; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage:not([hidden]) {
  min-width:0; min-height:100%; height:auto; position:relative; box-sizing:border-box; overflow:visible;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-layout {
  position:relative; box-sizing:border-box; width:100%; max-width:880px; margin:0 auto;
  min-width:0; min-height:max(100svh,356px); height:auto; padding:10px;
  display:grid; grid-template-columns:minmax(240px,.8fr) minmax(340px,1.2fr);
  grid-template-rows:44px minmax(224px,1fr) auto 44px; gap:8px 14px;
  overflow:visible; background:#090b0e;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene {
  display:block; grid-column:1; grid-row:1/5; align-self:stretch;
  position:relative; z-index:1; min-width:0; min-height:0; margin:0;
  overflow:hidden; border-radius:5px; pointer-events:none;
  background:#05070955 url("${assetUrl(BASE+"season-results/assets/ENV_SR_PHONE_V1.webp")}") center/cover;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::before,
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::after {
  content:""; position:absolute; pointer-events:none; background-repeat:no-repeat;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::before {
  inset:0; background-image:url("${assetUrl(BASE+"season-results/assets/OVL_SR_DANIEL_PHONE_V1.webp")}"),url("${assetUrl(BASE+"season-results/assets/OVL_SR_NIK_PHONE_V1.webp")}");
  background-position:left bottom 24%,right bottom 24%; background-size:55% 70%,55% 70%;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::after {
  inset:73% 2% 4%; background:url("${assetUrl(BASE+"season-results/assets/TITLE_SR_PHONE_V1.webp")}") center/contain no-repeat;
 }
 /* Claude lane: the scene replaces the old hero band, so none of its reserved space stays in flow. */
 #app #seasonEntry.seasonScreenV10>.v10SeasonStage.v10SeasonStage { --sr-hero:0px; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(.sd-stage__layer--plate,.sd-stage__layer--cutout,.sd-stage__layer--light,.sd-stage__layer--atmosphere) { display:none!important; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(img.season-phone-bg,.season-phone-hero,img.season-phone-title,img.season-title-wordmark) { display:none!important; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-title-block { margin:0; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .sd-stage__layer--ui { padding-top:0; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-layout> :has(label[for="season-phone-tab-daniel"]) {
  grid-column:2; grid-row:1; position:relative; z-index:2; min-width:0; min-height:44px; margin:0;
  display:grid; grid-template-columns:1fr 1fr 1.1fr; border:1px solid #f2c45b;
  border-radius:5px; background:#07090deb;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage label:is([for="season-phone-tab-daniel"],[for="season-phone-tab-nik"]) {
  box-sizing:border-box; min-width:0; min-height:44px; padding:3px;
  display:flex; align-items:center; justify-content:center; flex-direction:column;
  font-size:11px; line-height:1.2; letter-spacing:.6px; border:1px solid #ad8739;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-layout> :has(label[for="season-phone-tab-daniel"]) :is(button,label):not([for="season-phone-tab-daniel"]):not([for="season-phone-tab-nik"]) {
  min-width:0; min-height:44px; white-space:normal; padding:3px; font-size:10px; line-height:1.2;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonEntryGrid {
  grid-column:2; grid-row:2; position:relative; z-index:2;
  min-width:0; width:100%; margin:0; display:grid; grid-template-columns:minmax(0,1fr); gap:0;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard {
  box-sizing:border-box; min-width:0; width:100%; min-height:224px; margin:0; padding:9px;
  grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);
  grid-template-areas:"head head" "f1 checks" "f2 checks" "f3 checks";
  grid-template-rows:auto repeat(3,minmax(44px,auto)); gap:6px 12px; overflow:visible;
  border:1px solid #f2c45b; border-radius:5px;
  background:linear-gradient(125deg,#080b0dfc 65%,#292211f5);
  box-shadow:inset 0 0 0 3px #ad873922,0 6px 22px #0008;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonManagerHeader {
  grid-area:head; min-width:0; min-height:30px; margin:0; padding:0 0 6px;
  border-bottom:1px solid #f2c45b; gap:8px; flex-wrap:wrap;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonManagerHeader :is(h2,h3) { font-size:24px; margin:0; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonManagerHeader img { max-width:28px; max-height:28px; object-fit:contain; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard>label {
  display:flex; justify-content:space-between; align-items:center; min-width:0; min-height:44px;
  gap:6px; font-size:11px; line-height:1.2; letter-spacing:.5px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard>label input[type=number] {
  box-sizing:border-box; width:62px; min-width:44px; height:44px; min-height:44px;
  flex:0 0 62px; padding:6px; font-size:20px; border:1px solid #f2c45b; border-radius:4px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .achievementChecks {
  grid-area:checks; min-width:0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
  grid-template-rows:repeat(2,minmax(68px,auto)); gap:7px;
  padding-left:9px; border-left:1px solid #ad873955;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .achievementChecks label {
  min-width:0; min-height:68px; display:flex; flex-direction:column;
  align-items:flex-start; justify-content:space-between; gap:3px; font-size:11px;
  line-height:1.3; white-space:normal; overflow-wrap:anywhere;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .achievementChecks input[type=checkbox] {
  width:44px; height:44px; min-width:44px; min-height:44px; margin:0; flex:0 0 44px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel {
  grid-column:2; grid-row:3; position:relative; z-index:2; min-width:0; margin:0; overflow:visible;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel .seasonReviewGrid {
  min-width:0; grid-template-columns:minmax(0,1fr);
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel .seasonSummaryCard {
  min-width:0; overflow-wrap:anywhere;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-action-row {
  grid-column:2; grid-row:4; position:relative; z-index:2; min-width:0; margin:0;
  display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); align-items:center; gap:8px; background:#090b0e;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-action-row button {
  box-sizing:border-box; min-width:0; min-height:44px; width:100%; margin:0; padding:6px;
  white-space:normal; overflow-wrap:anywhere; font-size:10px; line-height:1.3;
  border:1px solid #f2c45b; border-radius:4px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel .seasonReviewActions button {
  min-width:0; min-height:44px; white-space:normal; overflow-wrap:anywhere;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(input,button,label):focus-visible {
  outline:2px solid white; outline-offset:2px;
 }
}


/* Claude lane, JOB-1598 at 740x360: the empty error line keeps a 20px placeholder that pushed the actions
   16px below the fold. It collapses only while empty; an error still shows and scrolls in main. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:375px) and (orientation:landscape) {
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage #seasonEntryError:empty { min-height:0; height:0; padding:0; margin:0; }
}

/* JOB-1599: adopted tablet 1230. Only upright 700-900px by 960-1240px.
   Live controls/words and DOM tap order stay intact; provider-hidden fields stay hidden. */
#app #seasonEntry .v10SeasonTabletSealed { display:none; }
@media (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
 #app main:has(#seasonEntry.seasonScreenV10:not(.hidden):not(.v10FinalMode)) { overflow-y:auto; overflow-x:hidden; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) { min-width:0; padding:0; overflow:visible; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage:not([hidden]) { box-sizing:border-box; min-width:0; min-height:100%; height:auto; position:relative; overflow:visible; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-layout {
  box-sizing:border-box; position:relative; min-width:0; width:100%;
  max-width:1000px; min-height:100%; height:auto; margin:0 auto;
  padding:0 18px max(18px,env(safe-area-inset-bottom)); display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); grid-template-rows:minmax(160px,1fr) 56px auto auto 64px;
  gap:12px; overflow:visible; background:#090b0e;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene {
  display:block; grid-column:1/-1; grid-row:1; position:relative;
  min-width:0; height:clamp(160px,calc(100svh - 740px),440px); min-height:160px; margin:0 -18px;
  overflow:hidden; pointer-events:none; background:#090b0e url("${assetUrl(BASE+"season-results/assets/ENV_SR_PHONE_V1.webp")}") center/cover;
 }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::before { content:""; position:absolute; pointer-events:none; background-repeat:no-repeat; }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::after { content:""; position:absolute; pointer-events:none; background-repeat:no-repeat; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::before {
  inset:0; background-image:url("${assetUrl(BASE+"season-results/assets/OVL_SR_DANIEL_PHONE_V1.webp")}"),url("${assetUrl(BASE+"season-results/assets/OVL_SR_NIK_PHONE_V1.webp")}"); background-position:left bottom 13%,right bottom 13%; background-size:49% 85%,49% 85%;
 }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::after { inset:73% 5% 3%; background:url("${assetUrl(BASE+"season-results/assets/TITLE_SR_PHONE_V1.webp")}") center/contain no-repeat; }
 /* Claude lane: the scene replaces the old hero band, so none of its reserved space stays in flow. */
 #app #seasonEntry.seasonScreenV10>.v10SeasonStage.v10SeasonStage { --sr-hero:0px; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(.sd-stage__layer--plate,.sd-stage__layer--cutout,.sd-stage__layer--light,.sd-stage__layer--atmosphere) { display:none!important; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(img.season-phone-bg,.season-phone-hero,img.season-phone-title,img.season-title-wordmark) { display:none!important; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-title-block { margin:0; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .sd-stage__layer--ui { padding-top:0; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-layout> :has(label[for="season-phone-tab-daniel"]) {
  grid-column:1/-1; grid-row:2; position:relative; min-width:0;
  min-height:56px; margin:0; display:grid; grid-template-columns:1fr 1fr 1.1fr;
  border:1px solid #f2c45b; border-radius:5px; background:#07090deb;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage label:is([for="season-phone-tab-daniel"],[for="season-phone-tab-nik"]) {
  box-sizing:border-box; min-width:0; min-height:56px; padding:4px;
  display:flex; align-items:center; justify-content:center; flex-direction:column;
  font-size:15px; line-height:1.2; letter-spacing:.6px; border:1px solid #ad8739;
 }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage label:is([for="season-phone-tab-daniel"],[for="season-phone-tab-nik"]) small { font-size:11px; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-layout> :has(label[for="season-phone-tab-daniel"]) :is(button,label):not([for="season-phone-tab-daniel"]):not([for="season-phone-tab-nik"]) {
  box-sizing:border-box; min-width:0; min-height:56px; padding:4px;
  font-size:14px; line-height:1.2; white-space:normal;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonEntryGrid {
  grid-column:1/-1; grid-row:3; min-width:0; width:100%;
  margin:0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px;
  overflow:visible;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard:not(.hidden) {
  display:grid!important; box-sizing:border-box; position:relative; min-width:0;
  width:100%; min-height:460px; height:auto; margin:0;
  padding:16px; overflow:visible; grid-template-columns:minmax(0,1fr); grid-template-areas:"head" "f1" "f2" "f3" "checks";
  grid-template-rows:auto repeat(3,minmax(52px,auto)) minmax(160px,auto); gap:10px; border:1px solid #f2c45b; border-radius:5px;
  background:linear-gradient(125deg,#080b0dfc 65%,#292211f5); box-shadow:inset 0 0 0 3px #ad873922,0 6px 22px #0008;
 }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(#daniel-entry-panel,.v10SeasonTabletSealed--daniel) { grid-column:1; grid-row:1; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonEntryGrid:has(#daniel-entry-panel.hidden) .v10SeasonTabletSealed--daniel {
  display:flex; flex-direction:column; box-sizing:border-box; min-width:0; min-height:460px;
  padding:16px; align-items:center; justify-content:center; gap:4px; text-align:center;
  white-space:pre-line; overflow-wrap:normal; word-break:normal;
  font:800 34px/1.15 var(--f17-display,"Barlow Condensed","Arial Narrow",sans-serif); letter-spacing:1.4px;
  color:#c9c2b0; border:1px solid #ad8739; border-radius:5px;
  background:linear-gradient(125deg,#080b0dfc 65%,#292211f5); box-shadow:inset 0 0 0 3px #ad873922,0 6px 22px #0008;
 }
 /* The screen's own sealed word (the tab's ::after for the same hidden-panel state); no new DOM text. */
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonEntryGrid:has(#daniel-entry-panel.hidden) .v10SeasonTabletSealed--daniel::after {
  content:"SEALED"; display:block; font:800 22px/1.2 var(--f17-display,"Barlow Condensed","Arial Narrow",sans-serif); letter-spacing:2px; color:#ad8739;
 }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage:has(#season-phone-tab-daniel:checked) .v10SeasonTabletSealed--daniel { color:#f2c45b; border-color:#f2c45b; }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(#nik-entry-panel,.v10SeasonTabletSealed--nik) { grid-column:2; grid-row:1; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonEntryGrid:has(#nik-entry-panel.hidden) .v10SeasonTabletSealed--nik {
  display:flex; flex-direction:column; box-sizing:border-box; min-width:0; min-height:460px;
  padding:16px; align-items:center; justify-content:center; gap:4px; text-align:center;
  white-space:pre-line; overflow-wrap:normal; word-break:normal;
  font:800 34px/1.15 var(--f17-display,"Barlow Condensed","Arial Narrow",sans-serif); letter-spacing:1.4px;
  color:#c9c2b0; border:1px solid #ad8739; border-radius:5px;
  background:linear-gradient(125deg,#080b0dfc 65%,#292211f5); box-shadow:inset 0 0 0 3px #ad873922,0 6px 22px #0008;
 }
 /* The screen's own sealed word (the tab's ::after for the same hidden-panel state); no new DOM text. */
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonEntryGrid:has(#nik-entry-panel.hidden) .v10SeasonTabletSealed--nik::after {
  content:"SEALED"; display:block; font:800 22px/1.2 var(--f17-display,"Barlow Condensed","Arial Narrow",sans-serif); letter-spacing:2px; color:#ad8739;
 }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage:has(#season-phone-tab-nik:checked) .v10SeasonTabletSealed--nik { color:#f2c45b; border-color:#f2c45b; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonManagerHeader {
  grid-area:head; min-width:0; min-height:48px; margin:0 0 4px;
  padding:0 0 10px; border-bottom:1px solid #f2c45b; gap:8px; flex-wrap:wrap;
 }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonManagerHeader :is(h2,h3) { font-size:27px; margin:0; }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonManagerHeader img { max-width:30px; max-height:30px; object-fit:contain; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard>label {
  display:flex; align-items:center; justify-content:space-between; min-width:0;
  min-height:52px; gap:8px; font-size:13px; line-height:1.3;
  letter-spacing:.5px; white-space:normal;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard>label input[type=number] {
  box-sizing:border-box; width:90px; min-width:44px; height:52px;
  min-height:52px; flex:0 0 90px; padding:6px; font-size:24px;
  border:1px solid #f2c45b; border-radius:4px;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .achievementChecks {
  grid-area:checks; min-width:0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
  gap:10px 14px; border-left:0; border-top:1px solid #ad873955; padding:12px 0 0;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .achievementChecks label {
  min-width:0; min-height:74px; display:flex; flex-direction:column;
  align-items:flex-start; justify-content:space-between; gap:4px; font-size:12px;
  line-height:1.3; white-space:normal; overflow-wrap:anywhere;
 }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .achievementChecks input[type=checkbox] { width:44px; height:44px; min-width:44px; min-height:44px; margin:0; flex:0 0 44px; }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel { grid-column:1/-1; grid-row:4; position:relative; min-width:0; margin:0; overflow:visible; }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel .seasonReviewGrid { min-width:0; grid-template-columns:repeat(2,minmax(0,1fr)); }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel .seasonSummaryCard { min-width:0; overflow-wrap:anywhere; }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-action-row {
  grid-column:1/-1; grid-row:5; position:sticky; bottom:0;
  z-index:3; min-width:0; margin:0; display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr)); align-items:center; gap:12px; background:#090b0e;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-action-row button {
  box-sizing:border-box; min-width:0; min-height:56px; width:100%;
  margin:0; padding:8px; white-space:normal; overflow-wrap:anywhere;
  font-size:13px; line-height:1.3; border:1px solid #f2c45b; border-radius:4px;
 }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel .seasonReviewActions button { min-width:0; min-height:44px; white-space:normal; overflow-wrap:anywhere; }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage :is(input,button,label):focus-visible { outline:2px solid white; outline-offset:2px; }
}

/* JOB-1213: 1366x768 Chromebook Season Results.
   Keep Team V's art and title tied to the first viewport, but let the app's
   main element be the only vertical scroller. No changes at 1920 or phone. */
@media (min-width:1340px) and (max-width:1390px) and (min-height:740px) and (max-height:790px) {
 html[data-v10-screen="seasonEntry"] #app main:has(#seasonEntry.seasonScreenV10:not(.v10FinalMode)) {
  position:fixed;inset:0;height:100dvh;padding:0;overflow-x:hidden;overflow-y:auto;
  overscroll-behavior-y:contain;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) {
  position:relative;inset:auto;height:auto;min-height:100dvh;margin:0;overflow:visible;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode)>.v10SeasonStage {
  position:relative;inset:auto;height:auto;min-height:100dvh;max-height:none;overflow:visible;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage :is(.sd-stage__layer--plate,.sd-stage__layer--atmosphere,.sd-stage__layer--cutout,.sd-stage__layer--light) {
  height:100dvh;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .sd-stage__registered {
  left:0!important;top:calc((100dvh - 56.25vw)/2)!important;
  width:100%!important;height:56.25vw!important;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage :is(.sd-stage__layer--ui,#season-results-screen) {
  position:relative;inset:auto;min-height:100dvh;overflow:visible;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-title-block {
  height:100dvh;bottom:auto;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-layout {
  position:relative;inset:auto;display:flex;flex-direction:column;align-items:stretch;
  gap:10px;min-height:100dvh;box-sizing:border-box;padding:31.6dvh 0 16px;
  overflow:visible;pointer-events:auto;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .scoring-panel {
  position:relative;inset:auto;width:44.47%;height:auto;min-height:19.44dvh;
  margin:0 auto;overflow:visible;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid:not(.hidden) {
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;
  width:72.66%;margin:0 auto;min-width:0;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid .entry-panel {
  position:relative;inset:auto;left:auto!important;top:auto;
  width:100%!important;height:auto;min-height:31.94dvh;max-height:none;
  overflow:visible;box-sizing:border-box;
  grid-template-rows:auto repeat(3,minmax(44px,auto));
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid:has(.entry-panel.hidden) .entry-panel:not(.hidden) {
  grid-column:1/-1;justify-self:center;max-width:500px;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonResultCard>label,
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonResultCard .achievementChecks label {
  min-height:44px;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonResultCard input[type=number] {
  min-height:44px;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel:not(.hidden) {
  position:relative;inset:auto;left:auto;top:auto;bottom:auto;
  width:44.47%;height:auto;max-height:none;margin:0 auto;
  padding:10px 14px;overflow:visible;overscroll-behavior:auto;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonReviewGrid {
  min-width:0;grid-template-columns:repeat(2,minmax(0,1fr));
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonSummaryCard {
  min-width:0;overflow-wrap:anywhere;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonReviewActions {
  position:static;inset:auto;max-width:100%;background:none;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonReviewActions button {
  min-height:44px;max-width:100%;white-space:normal;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-action-row {
  position:relative;inset:auto;top:auto;height:auto;min-height:44px;
  width:72.66%;margin:2px auto 0;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage #seasonEntryError {
  position:relative;inset:auto;top:auto;width:60%;margin:0 auto;max-width:100%;
 }
 #app #seasonEntry:not(.v10FinalMode):has(.season-review-panel:not(.hidden)) .v10SeasonStage .season-layout {
  padding-top:31.2dvh;
 }
}

/* JOB-1214: Full-HD Season Results. The registered first viewport still frames
   the artwork/title, while <main> owns the ONLY scroll. Review content and
   action rows must grow in normal flow, not inside fixed-height clipped cards. */
@media (min-width:1880px) and (max-width:1960px) and (min-height:1040px) and (max-height:1120px) {
 html[data-v10-screen="seasonEntry"] #app main:has(#seasonEntry.seasonScreenV10:not(.v10FinalMode)) {
  position:fixed;inset:0;height:100dvh;padding:0;
  overflow-x:hidden;overflow-y:auto;overscroll-behavior-y:contain;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) {
  position:relative;inset:auto;height:auto;min-height:100dvh;
  margin:0;overflow:visible;background:#050605;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode)>.v10SeasonStage {
  position:relative;inset:auto;height:auto;min-height:100dvh;
  max-height:none;overflow:visible;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage :is(.sd-stage__layer--plate,.sd-stage__layer--atmosphere,.sd-stage__layer--cutout,.sd-stage__layer--light) {
  height:100dvh;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .sd-stage__registered {
  left:0!important;top:calc((100dvh - 56.25vw)/2)!important;
  width:100%!important;height:56.25vw!important;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage :is(.sd-stage__layer--ui,#season-results-screen) {
  position:relative;inset:auto;height:auto;min-height:100dvh;overflow:visible;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-title-block {
  height:100dvh;bottom:auto;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-layout {
  position:relative;inset:auto;display:flex;flex-direction:column;
  align-items:stretch;gap:14px;min-height:100dvh;box-sizing:border-box;
  padding:31.6dvh 0 20px;overflow:visible;pointer-events:auto;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .scoring-panel {
  position:relative;inset:auto;width:44.47%;height:auto;min-height:19.44dvh;
  margin:0 auto;overflow:visible;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid:not(.hidden) {
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
  gap:14px;width:72.66%;min-width:0;margin:0 auto;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid .entry-panel {
  position:relative;inset:auto;left:auto!important;top:auto;
  width:100%!important;height:auto;min-height:31.94dvh;max-height:none;
  grid-template-rows:auto repeat(3,minmax(44px,auto));
  box-sizing:border-box;overflow:visible;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid:has(.entry-panel.hidden) .entry-panel:not(.hidden) {
  grid-column:1/-1;justify-self:center;max-width:640px;padding-left:20px;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonResultCard>label,
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonResultCard .achievementChecks label {
  min-height:44px;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonResultCard input[type=number] {
  min-height:44px;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel:not(.hidden) {
  position:relative;inset:auto;left:auto;top:auto;bottom:auto;
  width:72.66%;height:auto;max-height:none;margin:0 auto;
  padding:10px 1.8vw 12px 6.8vw;overflow:visible;overscroll-behavior:auto;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonReviewGrid {
  min-width:0;grid-template-columns:repeat(2,minmax(0,1fr));
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonSummaryCard {
  min-width:0;overflow-wrap:anywhere;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonReviewActions {
  position:static;inset:auto;max-width:100%;background:none;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonReviewActions button {
  min-height:44px;max-width:100%;white-space:normal;overflow-wrap:anywhere;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-action-row {
  position:relative;inset:auto;top:auto;height:auto;min-height:44px;
  width:72.66%;margin:2px auto 0;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage #seasonEntryError {
  position:relative;inset:auto;top:auto;width:60%;max-width:100%;
  margin:0 auto;overflow-wrap:anywhere;
 }
 #app #seasonEntry:not(.v10FinalMode):has(.season-review-panel:not(.hidden)) .v10SeasonStage .season-layout {
  padding-top:31.2dvh;
 }
}

/* JOB-1215: Season Results at 2560x1080 only. Keep Team V's artwork and
   title in the first viewport; main alone scrolls the full live content. */
@media (min-width:2500px) and (max-width:2620px) and (min-height:1040px) and (max-height:1120px) {
 html[data-v10-screen="seasonEntry"] #app main:has(#seasonEntry.seasonScreenV10:not(.v10FinalMode)) {
  position:fixed;inset:0;height:100dvh;padding:0;
  overflow-x:hidden;overflow-y:auto;overscroll-behavior-y:contain;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) {
  position:relative;inset:auto;width:100%;height:auto;min-height:100dvh;
  margin:0;overflow:visible;background:#050605;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode)>.v10SeasonStage {
  position:relative;inset:auto;height:auto;min-height:100dvh;
  max-height:none;overflow:visible;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage :is(.sd-stage__layer--plate,.sd-stage__layer--atmosphere,.sd-stage__layer--cutout,.sd-stage__layer--light) {
  height:100dvh;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage :is(.sd-stage__layer--ui,#season-results-screen) {
  position:relative;inset:auto;height:auto;min-height:100dvh;overflow:visible;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-title-block {
  height:100dvh;bottom:auto;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-layout {
  position:relative;inset:auto;display:flex;flex-direction:column;align-items:stretch;
  gap:14px;min-height:100dvh;box-sizing:border-box;padding:31.6dvh 0 24px;
  overflow:visible;pointer-events:auto;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .scoring-panel {
  position:relative;inset:auto;width:44.47%;height:auto;min-height:19.44dvh;
  margin:0 auto;overflow:visible;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid:not(.hidden) {
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
  gap:16px;width:72.66%;min-width:0;margin:0 auto;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid .entry-panel {
  position:relative;inset:auto;left:auto!important;top:auto;
  width:100%!important;height:auto;min-height:31.94dvh;max-height:none;
  grid-template-rows:auto repeat(3,minmax(44px,auto));
  box-sizing:border-box;overflow:visible;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid:has(.entry-panel.hidden) .entry-panel:not(.hidden) {
  grid-column:1/-1;justify-self:center;max-width:780px;padding-left:20px;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonResultCard>label,
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonResultCard .achievementChecks label {
  min-height:44px;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonResultCard input[type=number] {
  min-height:44px;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel:not(.hidden) {
  position:relative;inset:auto;left:auto;top:auto;bottom:auto;
  width:72.66%;height:auto;max-height:none;margin:0 auto;
  padding:12px 1.8vw 14px 6.8vw;overflow:visible;overscroll-behavior:auto;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonReviewGrid {
  width:auto;min-width:0;grid-template-columns:repeat(2,minmax(0,1fr));
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonSummaryCard {
  min-width:0;overflow-wrap:anywhere;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonReviewActions {
  position:static;inset:auto;max-width:100%;background:none;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonReviewActions button {
  min-height:44px;max-width:100%;white-space:normal;overflow-wrap:anywhere;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-action-row {
  position:relative;inset:auto;top:auto;height:auto;min-height:44px;
  width:72.66%;max-width:100%;margin:2px auto 0;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage #seasonEntryError {
  position:relative;inset:auto;top:auto;width:60%;max-width:100%;
  margin:0 auto;overflow-wrap:anywhere;
 }
 #app #seasonEntry:not(.v10FinalMode):has(.season-review-panel:not(.hidden)) .v10SeasonStage .season-layout {
  padding-top:31.2dvh;
 }
}
/* JOB-1216: Full-HD mockup typography and manager ink, adapter only.
   Keep the live form/review in normal flow; phones and Final Winner are excluded. */
@media (min-width:1880px) and (max-width:1960px) and (min-height:1040px) and (max-height:1120px) {
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-eyebrow {
  top:10.9dvh;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage #screen-title {
  top:16.78dvh;left:27.99%;width:43.49%;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .season-tagline {
  top:calc(16.78dvh + 6.44vw + 4px);
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage #scoring-heading {
  font-size:clamp(28px,1.95vw,30px);
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .scoring-rule {
  font-size:clamp(16px,.91vw,18px);line-height:1.2;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .scoring-trophy {
  max-height:16.2dvh;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid:not(.hidden) {
  gap:1.3vw;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .seasonResultCard .seasonManagerHeader h3 {
  font-size:clamp(36px,2.6vw,40px);line-height:1;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .entry-panel--nik input[type=number] {
  border-color:rgb(216 221 229 / .55);
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .entry-panel--nik input[type=checkbox] {
  background:linear-gradient(#06080a 0 0) center/16px 16px no-repeat,
   linear-gradient(#d8dde5 0 0) center/20px 20px no-repeat;
 }
 #app #seasonEntry:not(.v10FinalMode) .v10SeasonStage .entry-panel--nik input[type=checkbox]:checked {
  background:linear-gradient(#f2c45b 0 0) center/20px 20px no-repeat;
 }
}


/* JOB-1217: long manager/club identities and three-digit values stay inside the
   existing Season Results cards; Team V's art, tap order and phone flow are unchanged. */
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .manager-card-header {
  min-width:0;
  grid-template-columns:auto minmax(0,1fr);
}
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .manager-card-header :is(.manager-name,.manager-club) {
  min-width:0; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonManagerHeader { min-width:0; }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonManagerHeader :is(h2,h3) {
  min-width:0; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .seasonResultCard>label,
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .field-row { min-width:0; }
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .field-row :is(label,span) {
  min-width:0; overflow-wrap:anywhere;
}
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .field-row input[type=number] {
  box-sizing:border-box; max-width:100%;
}
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel :is(.seasonReviewGrid,.seasonSummaryCard,.summaryClub,.summaryLine) {
  min-width:0; overflow-wrap:anywhere;
}
#app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-action-row button {
  max-width:100%; white-space:normal; overflow-wrap:anywhere;
}


/* JOB-1218: Season Results touch hit boxes and neighbouring control spacing only.
   Fine-pointer desktop and Final Winner are unchanged; visual source stays frozen. */
@media (max-width:760px), (pointer:coarse) {
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(button,a[href],[role="button"],.season-phone-tab,.season-phone-scoring-open,.season-phone-sheet-close) {
  box-sizing:border-box;min-width:44px;min-height:44px;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-phone-toolbar,
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout > :has(label[for="season-phone-tab-daniel"]) {
  column-gap:8px;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(.season-action-row,.seasonReviewActions) {
  gap:8px;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(.achievementChecks,.manager-fields) {
  gap:8px;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .achievementChecks label {
  min-height:44px;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .achievementChecks input[type=checkbox] {
  box-sizing:border-box;min-width:44px;min-height:44px;width:44px;height:44px;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .field-row input[type=number] {
  box-sizing:border-box;min-width:44px;min-height:44px;
 }
}


/* JOB-1219: explicit keyboard ring for every live Season Results control.
   The hidden phone radio toggles show their focus on the matching visual label. */
#app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(button,a[href],input:not([type="hidden"]),select,textarea,summary,[role="button"],[tabindex]):focus-visible {
 outline:3px solid #fff3c2 !important;outline-offset:3px !important;
 box-shadow:0 0 0 2px #07080a;
}
#app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage #season-phone-tab-daniel:focus-visible ~ .season-phone-toolbar .season-phone-tab--daniel,
#app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage #season-phone-tab-nik:focus-visible ~ .season-phone-toolbar .season-phone-tab--nik,
#app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage #season-phone-scoring-toggle:focus-visible ~ .season-phone-toolbar .season-phone-scoring-open {
 outline:3px solid #fff3c2 !important;outline-offset:3px !important;
}
/* Respect system and in-game reduced-motion preferences without clearing
   transform-based positioning. Native WAAPI feedback is already reduced in Team V JS. */
@media (prefers-reduced-motion: reduce) {
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage,
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage *,
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage *::before,
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage *::after {
  animation-duration:.01ms !important;animation-delay:0ms !important;
  animation-iteration-count:1 !important;
  transition-duration:.01ms !important;transition-delay:0ms !important;
  scroll-behavior:auto !important;
 }
}
html[data-motion-reduced="true"] #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage,
html[data-motion-reduced="true"] #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage *,
html[data-motion-reduced="true"] #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage *::before,
html[data-motion-reduced="true"] #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage *::after {
 animation-duration:.01ms !important;animation-delay:0ms !important;
 animation-iteration-count:1 !important;
 transition-duration:.01ms !important;transition-delay:0ms !important;
 scroll-behavior:auto !important;
}


/* JOB-1700: finish the adopted entry compositions, using the live nodes only.
   Entry fits the first view; review, scoring and error states grow in main. */
@media (min-width:340px) and (max-width:440px) and (min-height:520px) and (max-height:960px) and (orientation:portrait),
       (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
 html[data-v10-screen="seasonEntry"] #app main:has(#seasonEntry.seasonScreenV10:not(.hidden):not(.v10FinalMode)) {
  position:fixed;inset:0;height:100svh;padding:0;overflow-x:hidden;overflow-y:auto;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) { position:relative;inset:auto;height:auto;min-height:100svh;margin:0; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode)>.v10SeasonStage {
  --sr-hero:0px;position:relative;inset:auto;height:auto;min-height:100svh;max-height:none;overflow:visible;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(.sd-stage__layer--ui,#season-results-screen) {
  position:relative;inset:auto;height:auto;min-height:100svh;padding-top:0;overflow:visible;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-title-block { margin:0;height:0; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout {
  min-height:100svh;align-content:start;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonManagerHeader {
  display:flex;align-items:center;flex-wrap:nowrap;font-family:var(--sd-font-condensed,"Barlow Condensed",sans-serif);
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonManagerHeader h3 { flex:0 0 auto;font-family:inherit; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonManagerHeader p { min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(.field-row,.achievementChecks label,.season-action-row button,.season-phone-tab,.season-phone-scoring-open) {
  overflow-wrap:normal;word-break:normal;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonResultCard .achievementChecks { gap:8px; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-action-row { position:relative;bottom:auto; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage #seasonEntryError {
  position:relative;inset:auto;grid-column:1/-1;grid-row:6;min-width:0;width:auto;margin:0;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage #seasonEntryError:empty {
  display:none;min-height:0;height:0;padding:0;margin:0;
 }
 /* Scoring is an in-flow disclosure: no clipped sheet or second scroll. */
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .scoring-panel {
  position:relative;inset:auto;grid-column:1/-1;grid-row:7;width:auto;height:auto;max-height:none;
  min-height:0;padding:52px 12px 12px;overflow:visible;box-shadow:none;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .scoring-grid { grid-template-columns:1fr; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .scoring-rule { font-size:12px;line-height:1.3; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-review-panel:not(.hidden) {
  position:relative;inset:auto;width:auto;height:auto;max-height:none;overflow:visible;
 }
}
/* Remove the empty review track, rather than compressing fields or actions. */
@media (min-width:340px) and (max-width:440px) and (min-height:520px) and (max-height:960px) and (orientation:portrait) {
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout:has(.season-review-panel.hidden) {
  grid-template-rows:minmax(clamp(110px,30svh,200px),1fr) 44px auto 56px;gap:6px;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout:not(:has(.season-review-panel.hidden)) {
  grid-template-rows:clamp(110px,30svh,200px) 44px auto auto 56px;
 }
 /* The hero takes the slack; managers keep their own proportions instead of being stretched. */
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .v10SeasonPhoneScene { height:auto;max-height:none; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .v10SeasonPhoneScene::before {
  background-size:auto min(100%,80vw),auto min(100%,80vw);background-position:left bottom 14%,right bottom 14%;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout:has(.season-review-panel.hidden) .season-action-row { grid-row:4;padding:0; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonResultCard { min-height:232px; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-action-row button { letter-spacing:.5px;line-height:1.3; }
}
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape) {
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout:has(.season-review-panel.hidden) {
  grid-template-rows:44px minmax(224px,1fr) 44px;gap:8px 14px;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout:has(.season-review-panel.hidden) .season-action-row { grid-row:3;padding:0; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .v10SeasonPhoneScene { grid-row:1/4; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .scoring-panel { grid-column:2; }
 /* While reviewing, the hidden entry card must not keep its 224px track open. */
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout:not(:has(.season-review-panel.hidden)) { grid-template-rows:44px auto auto; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout:not(:has(.season-review-panel.hidden)) .season-review-panel { grid-row:2; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout:not(:has(.season-review-panel.hidden)) .season-action-row { grid-row:3; }
 /* Expanded review, scoring and error content scrolls in main; the managers stay beside it. */
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .v10SeasonPhoneScene {
  align-self:start;position:sticky;top:10px;height:calc(100svh - 20px);min-height:0;
 }
}
@media (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout:has(.season-review-panel.hidden) {
  grid-template-rows:minmax(160px,1fr) 56px auto 64px;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout:has(.season-review-panel.hidden) .season-action-row { grid-row:4;padding:0; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .scoring-panel { grid-template-columns:20% 1fr; }
 /* The hero takes the slack and the managers keep their own proportions. */
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .v10SeasonPhoneScene { height:auto;max-height:none; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .v10SeasonPhoneScene::before { background-size:auto min(100%,66vw),auto min(100%,66vw);background-position:left bottom 10%,right bottom 10%; }
 /* At 761px and wider the inherited registration offsets the cards; the tablet grid places them. */
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid .entry-panel { inset:auto;transform:none; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout> :is(:has(label[for="season-phone-tab-daniel"]),.season-action-row) { inset:auto auto auto auto;left:auto;top:auto;transform:none; }
}

/* Approved NEXT_SEASON_RESULTS: central scoring/card/actions, responsive to
   the viewport height. Retain the registered Team V plate, trophy and badge. */
@media (min-width:1240px) and (max-width:1400px) and (min-height:620px) and (max-height:800px),
       (min-width:1880px) and (max-width:2620px) and (min-height:1040px) and (max-height:1120px) {
 html[data-v10-screen="seasonEntry"] #app main:has(#seasonEntry.seasonScreenV10:not(.hidden):not(.v10FinalMode)) {
  position:fixed;inset:0;height:100svh;padding:0;overflow-x:hidden;overflow-y:auto;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) { position:relative;inset:auto;height:auto;min-height:100svh;overflow:visible; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode)>.v10SeasonStage {
  --sru:min(1vw,1.77778svh);position:relative;inset:auto;height:auto;min-height:100svh;max-height:none;overflow:visible;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(.sd-stage__layer--plate,.sd-stage__layer--atmosphere,.sd-stage__layer--cutout,.sd-stage__layer--light) { height:100svh; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .sd-stage__registered {
  left:50%!important;top:calc((100svh - min(56.25vw,100svh))/2)!important;
  width:min(100vw,177.77778svh)!important;height:min(56.25vw,100svh)!important;transform:translateX(-50%);
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .sd-stage__layer--ui {
  position:relative;inset:auto;width:min(100%,177.77778svh);height:auto;min-height:100svh;margin:0 auto;overflow:visible;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage #season-results-screen { position:relative;inset:auto;min-height:100svh;overflow:visible; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-title-block { position:absolute;inset:0;height:100svh;margin:0; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-eyebrow { top:9%; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage #screen-title { top:14%;left:27.99%;width:43.49%; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-tagline { top:26%; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout {
  position:relative;inset:auto;display:flex;flex-direction:column;gap:clamp(8px,1.3svh,14px);
  min-height:100svh;box-sizing:border-box;padding:30.5svh 0 16px;overflow:visible;pointer-events:auto;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .scoring-panel {
  position:relative;inset:auto;width:44.47%;height:auto;min-height:20svh;max-height:none;margin:0 auto;
  padding:clamp(8px,1svh,12px) 2.1%;overflow:visible;border:2px solid #e8c465;border-radius:7px;
  box-shadow:inset 0 0 0 2px #83602780,0 8px 22px #0008;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage #scoring-heading { font-size:clamp(17px,calc(var(--sru)*1.6),30px);margin:0 0 6px; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .scoring-rule { font-size:clamp(12px,calc(var(--sru)*.9),17px);line-height:1.25; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .scoring-trophy { max-height:16svh; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid:not(.hidden) {
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.3%;width:72.66%;min-width:0;margin:0 auto;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid .entry-panel {
  position:relative;inset:auto;left:auto!important;width:100%!important;min-width:0;height:auto;min-height:max(220px,32svh);
  max-height:none;overflow:visible;box-sizing:border-box;padding:12px 18px;
  grid-template-rows:auto repeat(3,minmax(44px,1fr));gap:6px 16px;
  border:2px solid var(--manager-accent);border-radius:7px;
  box-shadow:inset 0 0 0 2px #83602780,0 8px 22px #0008;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid:has(.entry-panel.hidden) .entry-panel:not(.hidden) {
  grid-column:1/-1;justify-self:center;width:50%!important;max-width:none;padding:12px 18px;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonManagerHeader { display:flex;align-items:center;flex-wrap:nowrap;gap:12px;padding-bottom:8px;margin:0; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonManagerHeader h3 { font:800 clamp(24px,calc(var(--sru)*2.1),40px)/1 var(--sd-font-condensed,"Barlow Condensed",sans-serif);flex:0 0 auto; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonManagerHeader p { min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonResultCard>label { min-height:44px;overflow-wrap:normal;word-break:normal; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .achievementChecks label { min-height:44px;overflow-wrap:normal;word-break:normal; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonResultCard input[type=number] { height:44px;min-height:44px; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-action-row {
  position:relative;inset:auto;width:39%;height:auto;min-height:44px;margin:0 auto;gap:12px;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-action-row button {
  flex:1 1 0;min-width:0;min-height:clamp(44px,5.2svh,60px);padding:8px 12px;white-space:normal;
  overflow-wrap:normal;word-break:normal;line-height:1.3;border:2px solid #e8c465;border-radius:4px;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-action-row #completeSeason { background:linear-gradient(115deg,#bf8527,#ffe69a,#d99e37);color:#12100b; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage #seasonEntryError { position:relative;inset:auto;width:60%;margin:0 auto; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage #seasonEntryError:empty { display:none;min-height:0;padding:0;margin:0; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-review-panel:not(.hidden) {
  position:relative;inset:auto;width:56%;height:auto;max-height:none;padding:12px 18px;margin:0 auto;overflow:visible;overscroll-behavior:auto;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode):has(.season-review-panel:not(.hidden)) .v10SeasonStage .season-layout { padding-top:30.5svh; }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonReviewActions {
  position:static;inset:auto;flex-wrap:wrap;max-width:100%;background:none;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-review-panel .seasonReviewActions button { min-width:0;min-height:44px;max-width:100%;white-space:normal;overflow-wrap:normal; }
}
@media (min-width:340px) and (max-width:440px) and (min-height:520px) and (max-height:960px) and (orientation:portrait),
       (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait),
       (min-width:1240px) and (max-width:1400px) and (min-height:620px) and (max-height:800px),
       (min-width:1880px) and (max-width:2620px) and (min-height:1040px) and (max-height:1120px) {
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(button,.season-phone-tab,.season-phone-scoring-open,.season-phone-sheet-close):active {
  filter:brightness(.88);box-shadow:inset 0 2px 4px #0008;
 }
}

/* JOB-1289: desktop Final Winner, built from Team V's adopted study desktop-a-1289 and NEXT_FINAL_WINNER.
   Desktop only (1200x700 and up); phone, sideways and tablet keep Team V's own rules. One unit (--fwu) is 1/100 of the
   stage width, shrunk on a short stage; positions are fractions of the stage so nothing scrolls. Words, taps and order are the live ones. */
@media (min-width:1200px) and (min-height:700px) {
 #app #seasonEntry .v10FinalStage { container-type:size; --fwu:min(1cqw,1.89cqh); --sd-z-ui:5; }
 #app #seasonEntry .v10FinalStage #finalWinnerScreen { inset:0; width:100%; max-width:none; margin:0; padding:0; }
 #app #seasonEntry .v10FinalStage .sd-stage__plate { filter:contrast(1.06) saturate(.92); }
 #app #seasonEntry .v10FinalStage .sd-stage__layer--plate::after { content:""; position:absolute; inset:0; pointer-events:none; background:linear-gradient(180deg,#03030370,transparent 24%,transparent 64%,#02020290),radial-gradient(ellipse at 50% 32%,transparent 15%,#05050520 62%); }
 #app #seasonEntry .v10FinalStage .finalWinnerTitleBlock { left:50%; top:7%; width:34%; transform:translateX(-50%); row-gap:0; }
 #app #seasonEntry .v10FinalStage .finalWinnerEyebrow { font-size:max(10px,calc(var(--fwu)*1.05)); line-height:1; letter-spacing:.38em; padding-inline-start:.38em; }
 #app #seasonEntry .v10FinalStage .finalWinnerWordmark { width:calc(var(--fwu)*29.2); max-width:100%; margin:calc(var(--fwu)*.7) auto 0; }
 #app #seasonEntry .v10FinalStage .finalWinnerTagline { margin:calc(var(--fwu)*.3) 0 0; font-size:max(10px,calc(var(--fwu)*1.1)); line-height:1; letter-spacing:.3em; padding-inline-start:.3em; }
 #app #seasonEntry .v10FinalStage .finalWinnerCrown--daniel,
 #app #seasonEntry .v10FinalStage .finalWinnerCrown--nik { left:50%; top:3.2%; width:calc(var(--fwu)*1.9); height:calc(var(--fwu)*1.5); }
 #app #seasonEntry .v10FinalStage .finalWinnerHeroCopySlot { left:50%; top:max(23.6%,calc(7% + var(--fwu)*9)); width:27.2%; height:auto; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:0; }
 #app #seasonEntry .v10FinalStage .finalWinnerStateHeading { font-size:max(9px,calc(var(--fwu)*.75)); line-height:1; letter-spacing:.36em; padding-inline-start:.36em; }
 #app #seasonEntry .v10FinalStage .finalWinnerOutcome { margin:calc(var(--fwu)*.8) 0 0; font-size:max(24px,calc(var(--fwu)*2.7)); line-height:1; letter-spacing:.075em; }
 #app #seasonEntry .v10FinalStage .finalWinnerTotals { width:100%; margin-top:calc(var(--fwu)*.8); grid-template-columns:1fr 0 1fr; align-items:center; }
 #app #seasonEntry .v10FinalStage .finalWinnerManager small { font-size:max(10px,calc(var(--fwu)*.8)); letter-spacing:.16em; }
 #app #seasonEntry .v10FinalStage .finalWinnerManager .sd-number { font-size:max(30px,calc(var(--fwu)*4.1)); line-height:1.05; }
 #app #seasonEntry .v10FinalStage .finalWinnerScoreDash { padding:0; }
 #app #seasonEntry .v10FinalStage .winnerTrophySlot { left:50%; top:32.5%; width:calc(var(--fwu)*16); height:44%; transform:translateX(-50%); translate:none; scale:none; overflow:visible; }
 #app #seasonEntry .v10FinalStage .finalWinnerResultsPanel { left:20.4%; width:59.3%; top:72.4%; bottom:auto; height:max(16.8%,112px); grid-template-columns:34% 1fr; border:2px solid #e8c465; background:linear-gradient(115deg,#111110f2,#060706ed); box-shadow:inset 0 0 0 3px #574119,inset 0 0 0 5px #e4c56a50; clip-path:polygon(1.2% 0,98.8% 0,100% 8%,100% 92%,98.8% 100%,1.2% 100%,0 92%,0 8%); }
 #app #seasonEntry .v10FinalStage .finalWinnerMetaStrip { grid-template-columns:1.5fr 1fr 1fr; background:none; border-right:1px solid #b38d414d; }
 #app #seasonEntry .v10FinalStage .finalWinnerMetaCell { padding:calc(var(--fwu)*.25); }
 #app #seasonEntry .v10FinalStage .finalWinnerMetaCell span,
 #app #seasonEntry .v10FinalStage .finalWinnerMetaCell small { font-size:max(8.5px,calc(var(--fwu)*.66)); letter-spacing:.06em; color:#eee7d4; }
 #app #seasonEntry .v10FinalStage .finalWinnerMetaCell strong { font-size:max(24px,calc(var(--fwu)*2.3)); line-height:1.1; }
 #app #seasonEntry .v10FinalStage .finalWinnerHonours { padding:calc(var(--fwu)*.5) calc(var(--fwu)*.65) calc(var(--fwu)*.25); grid-template-rows:auto repeat(4,1fr); }
 #app #seasonEntry .v10FinalStage .finalWinnerHonoursHead { padding-bottom:calc(var(--fwu)*.25); font-size:max(8.5px,calc(var(--fwu)*.73)); letter-spacing:.09em; }
 #app #seasonEntry .v10FinalStage .finalWinnerTrophyMetric { font-size:max(8.5px,calc(var(--fwu)*.75)); letter-spacing:.075em; border-bottom:0; border-top:1px solid #c49d4944; }
 #app #seasonEntry .v10FinalStage .finalWinnerTrophyMetric--total { border-top-color:#e1b65077; }
 #app #seasonEntry .v10FinalStage .finalWinnerTrophyMetric img { width:max(12px,calc(var(--fwu)*.95)); height:max(14px,calc(var(--fwu)*1.15)); }
 #app #seasonEntry .v10FinalStage .finalWinnerMetricValue { font-size:max(15px,calc(var(--fwu)*1.5)); }
 #app #seasonEntry .v10FinalStage .finalWinnerActionsSlot { display:block; left:35.4%; width:29.2%; top:auto; bottom:3%; height:auto; max-height:28vh; padding:4px 6px; box-sizing:border-box; }
 #app #seasonEntry .v10FinalStage .finalWinnerActionsSlot .v10FinalExit { width:100%; }
 #app #seasonEntry .v10FinalStage .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions { width:100%; margin:0; gap:calc(var(--fwu)*1.6); }
 #app #seasonEntry .v10FinalStage .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions button { flex:1 1 0; min-width:0; min-height:max(44px,calc(var(--fwu)*2.9)); padding:0 6px; white-space:nowrap; border:2px solid #e8c267; border-radius:0; background:linear-gradient(#161616,#080908); color:#f5eacb; font:700 max(10.5px,calc(var(--fwu)*.85))/1 var(--sd-font-condensed); letter-spacing:.08em; box-shadow:inset 0 0 0 2px #88642b55; clip-path:polygon(3% 0,97% 0,100% 13%,100% 87%,97% 100%,3% 100%,0 87%,0 13%); }
 #app #seasonEntry .v10FinalStage .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions .backButton { flex-grow:1.12; background:linear-gradient(#fff0b0,#e4b94b 65%,#a47723); color:#17130a; box-shadow:none; }
 #app #seasonEntry .v10FinalStage .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions button:hover { filter:brightness(1.15); }
 #app #seasonEntry .v10FinalStage .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions button:focus-visible { outline:3px solid #fff5c4; outline-offset:-6px; }
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
    sfStandingsRule(root.document);
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
    for(const [key,p,api] of [["career-history","js/sharedHistoryConvergence.js","CareerModeSharedHistoryConvergence"],["career-analytics","js/sharedCareerAnalytics.js","CareerModeSharedCareerAnalytics"],["career-terminal","js/sharedTerminalClose.js","CareerModeSharedTerminalClose"],["career-final","js/sharedFinalReconciliation.js","CareerModeSharedFinalReconciliation"],["career-active-adapter","js/sharedActiveShowdownAdapter.js","CareerModeSharedActiveShowdownAdapter"],["visual-identity","js/visualIdentity.js","getClubCrestSvg"]])await load(key,p,()=>Boolean(root[api]));
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
