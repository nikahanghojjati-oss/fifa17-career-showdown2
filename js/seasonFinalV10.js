(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSeasonFinalV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // Shell-cached Team V files live under the runtime ?v= URL, so fetch them the same way (offline first launch).
  const assetUrl=path=>typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(path):path;
  const BASE="visual-assets/v10_1/",ROLES={playerOne:"daniel",playerTwo:"nik",draw:"draw"};
  const COUNT_FIELDS=["seasonWins","seasonDraws","seasonLosses","championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies"];
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
    const frame={status:"partial",state:completed?"completed":"completion-pending",winner:ROLES[r.winner],totals:{daniel:r.managerTotals.playerOne,nik:r.managerTotals.playerTwo},margin:Math.abs(r.managerTotals.playerOne-r.managerTotals.playerTwo),seasonsPlayed:r.acceptedSeasons??r.totalSeasons,completionMark:completed?"":terminal?.automaticCloseFailed&&!terminal?.automaticSaving?"Saving failed. Tap CLOSE SHOWDOWN again.":"Saving this Showdown to your career…",presentation:{spotlight:r.winner==="draw"?"neutral":ROLES[r.winner]},heading:completed?"SHOWDOWN CLOSED":"SHOWDOWN FINAL RESULT",outcomeHeadline:r.winner==="draw"?"DRAW":(r.winner==="playerOne"?"Daniel":"Nik")+" WINS",resultText:r.winner==="draw"?"The Showdown is a draw":"",previewLabel:"",message:"Trophy attribution is unavailable right now."};
    const p=history?.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&history.rivalryId===r.rivalryId?history.projection:null;
    if(p&&(r===reconciliation?p.acceptedRevisionKey===r.acceptedRevisionKey:closedHistoryBound(p,r))&&p.acceptedSeasons===frame.seasonsPlayed&&p.managerRecords?.playerOne?.totalPoints===frame.totals.daniel&&p.managerRecords?.playerTwo?.totalPoints===frame.totals.nik){
      // JOB-1005: the last accepted season of the verified history. Points and winner are read as the record stores them; nothing is computed.
      const last=p.seasonHistory[p.seasonHistory.length-1],lp=last?.playerOne?.scoring?.total,ln=last?.playerTwo?.scoring?.total;
      if(last&&last.roundNumber===frame.seasonsPlayed&&number(lp)&&number(ln)&&lp>=0&&lp<=11&&ln>=0&&ln<=11&&ROLES[last.winner])frame.lastSeason={season:last.roundNumber,daniel:lp,nik:ln,winner:ROLES[last.winner]};
      const trophies={};
      for(const [role,m] of [["playerOne","daniel"],["playerTwo","nik"]]){const rec=p.managerRecords[role];if(!["championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies"].every(k=>number(rec[k])))return freeze(frame);trophies[m]={championsLeague:rec.championsLeagues,europaLeague:rec.europaLeagues,leagueTitles:rec.leagueTitles,domesticCups:rec.domesticCups,total:rec.totalTrophies};}
      frame.trophies=trophies;frame.status="ready";frame.message="";
    }
    return freeze(frame);
  }
  // r87 one-tap Rematch (Nik's ask): offered only on a CLOSED Showdown's Final Winner, with the length the closed terminal
  // witness carries (1, 3, 5 or 10). Daniel (playerOne) starts it; Nik's button takes him Home, where his JOIN tile picks up
  // Daniel's code. Pure: reads only states this page already holds (no read, no write, no scoring).
  const REMATCH_LENGTHS=Object.freeze([1,3,5,10]);
  function rematchFrame(final,terminal,identity){
    if(final?.state!=="completed"||terminal?.phase!=="CLOSED"||terminal.terminal!==true||terminal.terminalWitness?.rivalryId!==terminal.rivalryId)return null;
    const seasons=terminal.terminalWitness.totalSeasons,manager=identity?.status==="ready"?identity.managerId:null;
    if(!REMATCH_LENGTHS.includes(seasons)||!["daniel","nik"].includes(manager))return null;
    return freeze({seasons,starter:manager==="daniel"});
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

/* Phones and tablets upright: the heroes take what the title, board and bottom bar leave; all eight rows stay in view. */
@media (max-width:900px) and (orientation:portrait){
  #app #standings.standingsScreenV10{
    --sg-nav:calc(56px + env(safe-area-inset-bottom));--sg-row:clamp(18px,3svh,28px);--sg-title:clamp(62px,10svh,84px);--sg-board:calc(205px + 8 * var(--sg-row));
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
  #app #standings.standingsScreenV10{--sg-row:clamp(34px,4.4svh,48px);--sg-title:clamp(104px,13svh,150px);--sg-board:calc(296px + 8 * var(--sg-row))}
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
/* r80 short screens: with the Europa League the board holds eight rows; at 1536x864 they no longer fit Team V's 52% board,
   so the board scrolled inside itself and TOTAL TROPHIES sat out of sight. On taller windows the board keeps 52% as its
   least height and grows down to fit every row (main stays the only scroller). */
@media (min-width:901px) and (min-height:861px){
  #app #standings.standingsScreenV10 .sdg-board{height:auto;min-height:52%}
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
/* STANDINGS-PLATE-V2 (ticket 1610P): desktop Standings on Team V's marble-suite plate (visual-assets/v10_1/plates-v2/), drawn
   to match NEXT_STANDINGS. Strictly the desktop picture range (wide landscape windows of at least 1200x600); phones, sideways
   phones and tablets keep their art. The plate carries Daniel, Nik, both banners and both name tags, so only the live title,
   board and rows are layered on it. It is the stage's own fixed plate layer, anchored to the top like the picture. The board
   keeps Team V's geometry and every word, id and tap order; only its frame and glass change. */
@media (min-width:1200px) and (min-height:600px) and (min-aspect-ratio:3/2) and (orientation:landscape){
  #app #standings.standingsScreenV10{--sg-bevel:linear-gradient(135deg,#fff1b8 0%,#e8b94a 15%,#8a6a12 36%,#f2c45b 56%,#fff1b8 73%,#b8862a 100%);--sgu:min(calc(100vw / 1536),calc(100svh / 864))}
  #app #standings.standingsScreenV10 .sd-stage__plate{background-image:image-set(url('visual-assets/v10_1/plates-v2/ENV_STANDINGS_PLATE_V2_1X.webp') 1x,url('visual-assets/v10_1/plates-v2/ENV_STANDINGS_PLATE_V2_2X.webp') 2x)}
  #app #standings.standingsScreenV10 .sd-stage__layer--plate .sd-stage__registered{top:0}
  #app #standings.standingsScreenV10 .sdg-board.sd-panel{
    clip-path:none;border:max(4px,calc(var(--sgu) * 8)) solid transparent;border-radius:calc(var(--sgu) * 22);
    /* HO-033 follow-up: the glow sits on opaque black-gold marble (HO-029 kit tile), not .96-.98 see-through glass (HO-027) */
    background:radial-gradient(ellipse 70% 40% at 50% 0,#ffe9a01c,transparent 70%) padding-box,url("css/r78-marble-tile.webp") 0 0/256px 256px repeat padding-box,var(--sg-bevel) border-box #110f0c;
    -webkit-backdrop-filter:none;backdrop-filter:none;
    box-shadow:inset 0 0 0 1px #050505,inset 0 0 0 calc(var(--sgu) * 3) #0a0907,inset 0 0 0 calc(var(--sgu) * 4) #d9aa3cb0,0 0 calc(var(--sgu) * 30) #f0c84b66,0 calc(var(--sgu) * 14) calc(var(--sgu) * 34) #000c;
  }
  #app #standings.standingsScreenV10 .sdg-toggle{border:2px solid #d9aa3c;border-radius:calc(var(--sgu) * 8);overflow:hidden;background:#07080a}
  #app #standings.standingsScreenV10 .sdg-toggle button[aria-selected="true"]{background:linear-gradient(180deg,#fff0a6 0,#f8d764 22%,#e4b032 56%,#f4cf58 82%,#c98f1c 100%);box-shadow:inset 0 1px 0 #fffbe0,inset 0 -2px 0 #a87a1288;color:#1a1305}
  #app #standings.standingsScreenV10 .sdg-row{border-top:1px solid #c9983a99}
  /* the plate paints its own crown above the title; the live crown would stack a second one (compact titles keep theirs) */
  @media (min-height:701px) and (max-aspect-ratio:2/1){#app #standings.standingsScreenV10 .sdg-header .sd-eyebrow::before{display:none}}
  #app #standings.standingsScreenV10 .sdg-label{color:#efe6cf}
  #app #standings.standingsScreenV10 .sdg-header .sd-eyebrow,#app #standings.standingsScreenV10 .sdg-header .sd-tagline{text-shadow:0 1px 3px #000,0 0 10px #000c}
}
/* r78 HO-031 v3 phone marble: upright phones up to 600px wide draw Team V's ENV_STANDINGS_PHONE_V3 (both managers painted
   in, moved down 35px so Nik clears the settings corner) in place of the old stadium and the two cut-outs (their picture
   sources no longer match there, standings/app-shell.html). The plate is sized as cover of the screen and pinned to the
   top; the managers' band keeps its height, so the title, board and rows stay where they were. No dark grade over the
   men. Upright tablets and sideways phones keep the old art: there the board or title would sit on the faces. */
@media (max-width:600px) and (orientation:portrait){
  #app #standings.standingsScreenV10 .sdg-phoneHero{display:none}
  #app #standings.standingsScreenV10 .sdg-phoneBg img{position:absolute;left:50%;top:0;width:max(100vw,calc(100svh * 1179 / 2096));height:auto;max-width:none;transform:translateX(-50%);object-fit:fill}
  #app #standings.standingsScreenV10 .sdg-phoneArt::after{content:none}
}
`;parent.appendChild(style);
  }
  /*SG-END*/
  // r86 Special Player chip (js/specialPlayerChip.js, loaded in each screen's prepare step so the chip is in the first frame).
  const sfChip=()=>typeof module!=="undefined"&&module.exports&&typeof require==="function"?require("./specialPlayerChip.js"):root.CareerModeSpecialPlayerChip;
  function sfSpecial(pick){try{const chip=sfChip(),sp=chip?pick(chip):null;return sp&&sp.daniel&&sp.nik?{daniel:sp.daniel,nik:sp.nik}:null;}catch(_){return null;}}
  function sfEnsureChip(){return Promise.resolve().then(()=>root.loadRuntimeScript("special-player-chip","js/specialPlayerChip.js",()=>Boolean(root.CareerModeSpecialPlayerChip))).then(()=>root.CareerModeSpecialPlayerChip.ensure()).catch(()=>false);}
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
    // r86 Special Player chip: THIS SHOWDOWN shows the live Showdown's, CAREER the most recently confirmed one's (none before r86).
    if(current.score){const sp=sfSpecial(chip=>chip.live());if(sp)current.specialPlayers=sp;}
    if(all.standings){const sp=sfSpecial(chip=>chip.latest(career.history&&career.history.showdowns));if(sp)all.specialPlayers=sp;}
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
  const templates={},strings={};let installed=false,scheduled=false,signature="",finalSeasonReview=false;
  const state=name=>{try{return root[name]?.getState?.()||null;}catch(_){return null;}};
  function sfSnapshot(){return {identity:state("CareerModeOnlinePlayerIdentity"),pair:state("CareerModePersistentNikDanielPair"),multiSeason:state("CareerModeProductionSharedMultiSeasonProgression"),history:state("CareerModeProductionSharedHistoryConvergence"),finalReconciliation:state("CareerModeProductionSharedFinalReconciliation"),terminalClose:state("CareerModeProductionSharedTerminalClose")};}
  // CE2PG: once the pair has let a finished Showdown go (Home was shown), it is no longer "this Showdown": the closed Terminal
  // Close kept in memory for the Final Winner screen made THIS SHOWDOWN show it until a reload, while every reloaded or new
  // browser said "No active showdown". Rivalry Statistics keeps showing the newest finished Showdown on every browser.
  function currentRivalry(){
    const snapshot=sfSnapshot(),pair=snapshot.pair;
    if(pair?.initialized===true&&pair.status==="unpaired"&&!pair.rivalryId&&snapshot.terminalClose?.phase==="CLOSED")snapshot.terminalClose=null;
    return root.CareerModeSharedActiveShowdownAdapter?.rivalryView(snapshot)||{status:"unavailable"};
  }
  // A supplied model first, then the provider-backed career model shared with Stats, Trophy Room and History.
  // CE2PG: Standings only reused the model another screen last read, so opened first it said "unavailable" and
  // after a newer Showdown closed it kept the older career. Each Standings open now refreshes that model once
  // (the same exact gets Career Statistics makes when it opens); Career says Loading until it lands.
  let standingsCareerLoad=null;
  function sfOnlineCareer(){const id=state("CareerModeOnlinePlayerIdentity");return id?.registered===true&&["daniel","nik"].includes(id.managerId);}
  function refreshStandingsCareer(){
    if(standingsCareerLoad||!sfOnlineCareer()||typeof root.loadRuntimeScript!=="function")return;
    const load=standingsCareerLoad=Promise.resolve().then(async()=>{
      if(!root.CareerModeRivalryLegacyV10)await root.loadRuntimeScript("rivalry-legacy-v10","js/rivalryLegacyV10.js",()=>Boolean(root.CareerModeRivalryLegacyV10));
      await root.CareerModeRivalryLegacyV10.loadCareerModel();
    }).catch(()=>{}).then(()=>{if(standingsCareerLoad===load)standingsCareerLoad=null;signature="";wake();});
  }
  function currentCareer(){try{const supplied=typeof careerStatisticsModel!=="undefined"?careerStatisticsModel:null;return supplied??(standingsCareerLoad?{status:"loading"}:root.CareerModeRivalryLegacyV10?.cachedCareerModel?.())??null;}catch(_){return null;}}
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
    if(final){root.document.getElementById(REMATCH_ID)?.remove();for(const id of ["sharedTerminalClosePanel","sharedFinalReconciliationPanel"]){const n=root.document.getElementById(id);if(n&&review)review.appendChild(n);}const actions=root.document.getElementById("completeSeason")?.closest(".seasonEntryActions");if(actions&&season)season.querySelector(".season-layout").appendChild(actions);final.v10StageHandle?.destroy();final.remove();}
    if(season)season.hidden=false;
    host.classList.remove("v10FinalMode");
  }
  // JOB-1807: return to the existing published-results review without changing provider or Save state.
  function reviewFinalSeason(){
    const host=root.document?.getElementById("seasonEntry");
    if(!host?.querySelector(".v10FinalStage"))return false;
    finalSeasonReview=true;restoreFinal(host);return true;
  }
  // r87 Rematch: one more button in the Final Winner's own exit row (same kit, same row, nothing moves or hides). Daniel's
  // runs the normal START (js/onlinePlayerIdentity.js openRematch: the same reads and writes as Home START) and opens the seasons
  // screen with the closed length picked; its START leads to the usual league wheel with WAITING, then clubs. Nik's goes Home.
  const REMATCH_ID="finalWinnerRematch";let rematchBusy=false;
  function sfRematchLabel(button,rematch){
    const length=`${rematch.seasons} SEASON${rematch.seasons===1?"":"S"}`,sub=rematch.starter?(rematchBusy?"STARTING…":length):"DANIEL STARTS IT";
    if(button.dataset.rematchLabel!==sub){
      const doc=root.document,main=doc.createElement("span"),small=doc.createElement("small");
      main.className="finalWinnerRematchMain";main.textContent="REMATCH";small.className="finalWinnerRematchSub";small.textContent=sub;
      button.replaceChildren(main,small);button.dataset.rematchLabel=sub;
    }
    button.setAttribute("aria-label",rematch.starter?`Rematch: a new Showdown with Nik, ${rematch.seasons} season${rematch.seasons===1?"":"s"} picked`:"Rematch: Daniel starts it. Go to Showdown Home to join his code");
    button.disabled=rematch.starter&&rematchBusy;if(rematchBusy&&rematch.starter)button.setAttribute("aria-busy","true");else button.removeAttribute("aria-busy");
  }
  function sfRematchButton(actions,rematch){
    root.document.getElementById(REMATCH_ID)?.remove();
    if(!actions||!rematch)return null;
    const button=root.document.createElement("button");button.type="button";button.id=REMATCH_ID;button.className="menuButton finalWinnerRematch";
    button.dataset.rematchSeasons=String(rematch.seasons);button.dataset.rematchStarter=rematch.starter?"true":"false";
    sfRematchLabel(button,rematch);
    button.addEventListener("click",event=>{
      event.preventDefault();
      if(!rematch.starter){if(typeof root.navigateTo==="function")void Promise.resolve(root.navigateTo("mainMenu")).catch(fail);return;}
      const identity=root.CareerModeOnlinePlayerIdentity;
      if(rematchBusy||typeof identity?.openRematch!=="function")return;
      rematchBusy=true;sfRematchLabel(button,rematch);
      Promise.resolve().then(()=>identity.openRematch(rematch.seasons)).catch(fail).finally(()=>{rematchBusy=false;if(button.isConnected)sfRematchLabel(button,rematch);});
    });
    const back=actions.querySelector(":scope > .backButton");actions.insertBefore(button,back||null);
    return button;
  }
  function renderFinal(host,frame,rematch=null){
    if(!frame.winner){restoreFinal(host);return;}
    let final=host.querySelector(".v10FinalStage");
    // A changed frame rebuilds supplementary art only. Live protocol panels move intact.
    if(final)restoreFinal(host);
    final=stageElement("final-winner");final.classList.add("v10FinalStage");host.appendChild(final);
    for(const [id,slot] of [["sharedTerminalClosePanel","v10TerminalSlot"],["sharedFinalReconciliationPanel","v10ReconciliationSlot"]]){const live=root.document.getElementById(id);if(live)final.querySelector("#"+slot).appendChild(live);}
    const actions=root.document.getElementById("completeSeason")?.closest(".seasonEntryActions");if(actions)final.querySelector("#v10ExitSlot").appendChild(actions);
    sfRematchButton(actions,rematch);
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
 /* 6. Shared result check in the black-and-gold kit, readable size. */
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
  grid-template-rows:repeat(3,minmax(68px,auto)); gap:7px; padding-left:9px; border-left:1px solid #ad873955;
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
  grid-template-rows:repeat(3,minmax(68px,auto)); gap:7px;
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
       (min-width:901px) and (max-width:1239px) and (min-height:501px) and (max-height:800px) and (orientation:landscape),
       (min-width:1401px) and (max-width:1879px) and (min-height:620px) and (max-height:1039px) and (orientation:landscape),
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
       (min-width:901px) and (max-width:1239px) and (min-height:501px) and (max-height:800px) and (orientation:landscape),
       (min-width:1401px) and (max-width:1879px) and (min-height:620px) and (max-height:1039px) and (orientation:landscape),
       (min-width:1880px) and (max-width:2620px) and (min-height:1040px) and (max-height:1120px) {
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(button,.season-phone-tab,.season-phone-scoring-open,.season-phone-sheet-close):active {
  filter:brightness(.88);box-shadow:inset 0 2px 4px #0008;
 }
}

/* JOB-1289: desktop Final Winner, built from Team V's adopted study desktop-a-1289 and NEXT_FINAL_WINNER.
   Desktop only (1200x600 and up since FINAL-WINNER-PLATE-V2, it was 700); phone, sideways and tablet keep Team V's own rules. One unit (--fwu) is 1/100 of the
   stage width, shrunk on a short stage; positions are fractions of the stage so nothing scrolls. Words, taps and order are the live ones. */
@media (min-width:1200px) and (min-height:600px) {
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
 /* r80: five honours rows with the Europa League. The panel keeps its old bottom edge (89.2%) and grows upward to at least 124px, so TOTAL TROPHIES clears the border at 1366x640. */
 #app #seasonEntry .v10FinalStage .finalWinnerResultsPanel { left:20.4%; width:59.3%; top:auto; bottom:10.8%; height:max(16.8%,124px); grid-template-columns:34% 1fr; border:2px solid #e8c465; background:linear-gradient(115deg,#111110f2,#060706ed); box-shadow:inset 0 0 0 3px #574119,inset 0 0 0 5px #e4c56a50; clip-path:polygon(1.2% 0,98.8% 0,100% 8%,100% 92%,98.8% 100%,1.2% 100%,0 92%,0 8%); }
 #app #seasonEntry .v10FinalStage .finalWinnerMetaStrip { grid-template-columns:1.5fr 1fr 1fr; background:none; border-right:1px solid #b38d414d; }
 #app #seasonEntry .v10FinalStage .finalWinnerMetaCell { padding:calc(var(--fwu)*.25); }
 #app #seasonEntry .v10FinalStage .finalWinnerMetaCell span,
 #app #seasonEntry .v10FinalStage .finalWinnerMetaCell small { font-size:max(8.5px,calc(var(--fwu)*.66)); letter-spacing:.06em; color:#eee7d4; }
 #app #seasonEntry .v10FinalStage .finalWinnerMetaCell strong { font-size:max(24px,calc(var(--fwu)*2.3)); line-height:1.1; }
 #app #seasonEntry .v10FinalStage .finalWinnerHonours { padding:calc(var(--fwu)*.5) calc(var(--fwu)*.65) calc(var(--fwu)*.25); grid-template-rows:auto repeat(5,1fr); }
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
/* JOB-1702: Final Winner at phone, sideways and tablet (adopted studies 1284, 1287, 1288 and PHONE_FINAL_WINNER).
   Desktop (the JOB-1289 block above) is untouched. main is the only scroll owner; the stage fits the first view,
   so Team V's 660px minimum and its inner stage scroll are reset here. Words, ids and tap order are the live ones. */
@media (min-width:340px) and (max-width:440px) and (min-height:520px) and (max-height:960px) and (orientation:portrait),
       (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:640px) and (max-width:1199px) and (min-height:340px) and (max-height:500px) and (orientation:landscape),
       (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
 html[data-v10-screen="seasonEntry"] #app main:has(#seasonEntry.seasonScreenV10.v10FinalMode:not(.hidden)) {
  position:fixed;inset:0;height:100svh;padding:0;overflow-x:hidden;overflow-y:auto;
 }
 #app #seasonEntry.seasonScreenV10.v10FinalMode { position:relative;inset:auto;height:100svh;min-height:0;margin:0;padding:0; }
 #app #seasonEntry.v10FinalMode #stage-root.v10FinalStage { position:absolute;inset:0;width:100%;height:100%;overflow:hidden; }
 #app #seasonEntry.v10FinalMode #stage-root.v10FinalStage #finalWinnerScreen {
  position:absolute;inset:0;width:100%;height:100%;max-width:none;margin:0;padding:0;
 }
 /* Two exits in Team V's black-and-gold kit: secondary outline, gold primary (BACK TO SHOWDOWN HOME). */
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit { width:100%;margin:0;padding:0; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions {
  display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;margin:0;padding:0;border:0;background:none;box-shadow:none;
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions button {
  box-sizing:border-box;width:100%;min-width:0;min-height:44px;margin:0;padding:6px 8px;
  border:1px solid #dfbd54;border-radius:0;background:linear-gradient(#141414,#070807);color:#f7cf60;
  font:800 11px/1.25 var(--sd-font-condensed,"Barlow Condensed",sans-serif);letter-spacing:.06em;text-transform:uppercase;
  white-space:normal;overflow-wrap:normal;word-break:normal;box-shadow:inset 0 0 0 2px #88642b44;
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions .backButton {
  background:linear-gradient(#fff1a1,#e8b73e 70%,#b98a2c);color:#0b0a07;box-shadow:0 0 12px #dfad3555;
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions button:active {
  filter:brightness(.86);box-shadow:inset 0 2px 5px #000a;
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions button:focus-visible {
  outline:3px solid #fff5c4;outline-offset:2px;
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerResultsPanel .finalWinnerPhoneTabs label:active { filter:brightness(1.2); }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerResultsPanel .finalWinnerTabInput:focus-visible~.finalWinnerPhoneTabs {
  outline:3px solid #fff5c4;outline-offset:-3px;
 }
}
/* Phone upright: Team V's phone composition on the full screen; the panel ends just above the exits. */
@media (min-width:340px) and (max-width:440px) and (min-height:520px) and (max-height:960px) and (orientation:portrait) {
 /* The crown sat over the gap between SHOWDOWN and CHAMPION. */
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerCrown { display:none; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot {
  left:4%;right:auto;width:92%;top:auto;bottom:max(12px,env(safe-area-inset-bottom));height:auto;max-height:none;padding:0;overflow:visible;
 }
}
/* Sideways and tablet: one phone-art composition on the whole screen (Team V's phone background and the two phone
   portraits, Daniel on the left). The desktop plate, rims, shades and spotlights are hidden by class, not by src. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:640px) and (max-width:1199px) and (min-height:340px) and (max-height:500px) and (orientation:landscape),
       (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
 #app #seasonEntry.v10FinalMode #stage-root :is(.sd-stage__layer--plate,.sd-stage__layer--cutout,.sd-stage__layer--light,.finalWinnerManagerShade,.finalWinnerManagerSpotlight,.finalWinnerCrown,.finalWinnerTopbar) { display:none; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneBackground { position:absolute;inset:0;z-index:1;display:block;overflow:hidden;pointer-events:none; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneBackground img { display:block;width:100%;height:100%;object-fit:cover;object-position:50% 50%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneVeil { position:absolute;inset:0;z-index:6;display:block;pointer-events:none; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneHero { position:absolute;z-index:9;display:block;width:auto;right:auto;bottom:auto;pointer-events:none;transform:none;opacity:1; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneHero img { display:block;width:auto;height:100%;max-width:none;filter:drop-shadow(0 11px 12px rgb(0 0 0 / .7)); }
 #app #seasonEntry.v10FinalMode #stage-root[data-spotlight] .finalWinnerPhoneHero { opacity:1;filter:brightness(1.08) saturate(1.04); }
 #app #seasonEntry.v10FinalMode #stage-root :is(.finalWinnerTitleBlock,.finalWinnerHeroCopySlot,.winnerTrophySlot,.finalWinnerResultsPanel,.finalWinnerActionsSlot) {
  position:absolute;right:auto;bottom:auto;height:auto;max-height:none;margin:0;box-sizing:border-box;
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerTitleBlock { z-index:13;display:grid;justify-items:center;row-gap:2px;transform:translateX(-50%);text-align:center; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerWordmark { width:100%;margin:0; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerWordmark img { display:block;width:100%;height:auto; }
 #app #seasonEntry.v10FinalMode #stage-root .winnerTrophySlot { z-index:10;width:auto;aspect-ratio:1;transform:translateX(-50%); }
 #app #seasonEntry.v10FinalMode #stage-root .winnerTrophySlot .winnerTrophyPicture { position:absolute;inset:0;display:block;width:100%;height:100%; }
 #app #seasonEntry.v10FinalMode #stage-root .winnerTrophySlot .winnerTrophyPicture img { display:block;width:100%;height:100%;object-fit:contain; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerHeroCopySlot { z-index:13;display:flex;flex-direction:column;align-items:center;gap:0;transform:translateX(-50%);text-align:center; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerOutcome { margin:2px 0 0;line-height:1; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerTotals { display:grid;grid-template-columns:1fr 1fr;width:100%;margin-top:2px; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerScoreDash { display:none; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerManager { display:grid;justify-items:center;gap:0; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerManager .sd-number { line-height:1; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerResultsPanel {
  z-index:11;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:44px minmax(0,1fr);overflow:hidden;
  border:1px solid #d9b64e;background:linear-gradient(115deg,#39271240,transparent 60%),#110f0c url("css/r78-marble-tile.webp") 0 0/256px 256px repeat;
  clip-path:polygon(2% 0,98% 0,100% 3%,100% 97%,98% 100%,2% 100%,0 97%,0 3%);
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerResultsPanel :is(.finalWinnerMetaStrip,.finalWinnerHonours) {
  position:relative;inset:auto;grid-column:1;grid-row:2;width:auto;height:auto;min-height:0;border:0;background:none;
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerMetaStrip { display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1.2fr 1fr; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerMetaCell { display:grid;place-content:center;justify-items:center;gap:2px;min-width:0;padding:4px;border:0;text-align:center; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerMetaCell--lastSeason { grid-column:1/-1;border-bottom:1px solid #d9b64e66; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerMetaCell--lastSeason~.finalWinnerMetaCell~.finalWinnerMetaCell { border-left:1px solid #d9b64e66; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerMetaCell :is(span,small) { white-space:nowrap; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerHonours { display:grid;grid-template-rows:auto repeat(5,minmax(0,1fr));align-content:stretch; }
 #app #seasonEntry.v10FinalMode #stage-root :is(.finalWinnerHonoursHead,.finalWinnerTrophyMetric) {
  display:grid;grid-template-columns:40px 22px minmax(0,1fr) 22px 40px;align-items:center;gap:4px;min-height:0;text-align:center;
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerHonoursHead>span { grid-column:2/5; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerTrophyMetric { border-top:1px solid #c49d4944; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerTrophyMetric img { width:100%;height:100%;max-height:30px;object-fit:contain; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot { z-index:14;display:block;padding:0;overflow:visible; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit { width:100%;margin:0;padding:0; }
}
/* Sideways (study 1287): managers, trophy and score on the left half; summary tabs and both exits on the right half. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:640px) and (max-width:1199px) and (min-height:340px) and (max-height:500px) and (orientation:landscape) {
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneVeil {
  background:linear-gradient(90deg,transparent 0 48%,rgb(3 5 7 / .55) 54%,rgb(3 5 7 / .82) 100%),linear-gradient(180deg,transparent 0 52%,rgb(3 5 7 / .7) 74%,#050607 100%);
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneHero { top:17%;height:66%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneHero--daniel { left:0; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneHero--nik { left:auto;right:51%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerTitleBlock { left:25%;top:3%;width:min(44%,330px); }
 #app #seasonEntry.v10FinalMode #stage-root :is(.finalWinnerEyebrow,.finalWinnerTagline) { display:block;visibility:visible;font-size:8px;letter-spacing:.24em;line-height:1.2; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerWordmark { width:86%; }
 #app #seasonEntry.v10FinalMode #stage-root .winnerTrophySlot { left:25%;top:25%;height:32%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerHeroCopySlot { left:25%;top:59%;width:min(36%,280px); }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerStateHeading { font-size:9px;letter-spacing:.2em; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerOutcome { font-size:clamp(22px,7svh,28px); }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerManager small { font-size:9px;letter-spacing:.14em; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerManager .sd-number { font-size:clamp(26px,8.5svh,34px); }
 #app #seasonEntry.v10FinalMode #stage-root :is(.finalWinnerResultText,.finalWinnerCompletion) { font-size:10px;margin-top:2px; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerResultsPanel { left:52%;width:45%;top:5%;bottom:calc(4% + 58px);height:auto; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot { left:52%;width:45%;top:auto;bottom:4%; }
 #app #seasonEntry.v10FinalMode #stage-root .v10FinalProof { left:52%;width:45%;top:auto;bottom:calc(4% + 52px);max-height:none; }
 #app #seasonEntry.v10FinalMode #stage-root:has(#v10ReconciliationSlot>:not(.hidden)) .finalWinnerResultsPanel { bottom:calc(4% + 96px); }
 /* Summary and Honours stay radio tabs here, also above 760px where Team V shows both. */
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerTabInput { display:block;position:absolute;width:1px;height:1px;margin:0;opacity:0;clip-path:inset(50%);pointer-events:none; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneTabs {
  position:relative;z-index:3;display:grid;grid-row:1;grid-template-columns:1fr 1fr;height:44px;border-bottom:1px solid #d9b64e;background:rgb(6 8 11 / .9);
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneTabs label {
  display:flex;align-items:center;justify-content:center;min-width:0;min-height:44px;color:var(--sd-text-secondary,#cfc6b0);
  font:700 11px/1 var(--sd-font-condensed,"Barlow Condensed",sans-serif);letter-spacing:.12em;border-bottom:2px solid transparent;cursor:pointer;user-select:none;
 }
 #app #seasonEntry.v10FinalMode #stage-root #finalWinnerTabSummary:checked~.finalWinnerPhoneTabs label[for="finalWinnerTabSummary"],
 #app #seasonEntry.v10FinalMode #stage-root #finalWinnerTabHonours:checked~.finalWinnerPhoneTabs label[for="finalWinnerTabHonours"] {
  color:var(--sd-gold-300,#f2c45b);border-bottom-color:var(--sd-gold-300,#f2c45b);background:linear-gradient(180deg,rgb(242 196 91 / .1),transparent);
 }
 #app #seasonEntry.v10FinalMode #stage-root #finalWinnerTabSummary:checked~.finalWinnerHonours,
 #app #seasonEntry.v10FinalMode #stage-root #finalWinnerTabHonours:checked~.finalWinnerMetaStrip { display:none; }
 #app #seasonEntry.v10FinalMode #stage-root:is([data-status="loading"],[data-status="empty"],[data-status="unavailable"]) .finalWinnerPhoneTabs { display:none; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerMetaCell :is(span,small) { font-size:9px;letter-spacing:.1em; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerMetaCell strong { margin:1px 0;font-size:clamp(22px,7svh,28px);line-height:1; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerHonours { padding:2px 8px 4px; }
 #app #seasonEntry.v10FinalMode #stage-root :is(.finalWinnerHonoursHead,.finalWinnerTrophyMetric) { font-size:9px;letter-spacing:.05em; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerHonoursHead { min-height:24px; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerMetricValue { font-size:17px; }
}
/* Tablet upright (study 1288): the phone ceremony scaled up; Summary and Honours side by side; exits clear. */
@media (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneVeil {
  background:linear-gradient(180deg,transparent 0 46%,rgb(3 5 7 / .72) 56%,rgb(3 5 7 / .96) 63%,#050607 100%);
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneHero { top:6%;height:52%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneHero--daniel { left:-2%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneHero--nik { left:auto;right:-2%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerTitleBlock { left:50%;top:3%;width:min(70%,560px);row-gap:6px; }
 #app #seasonEntry.v10FinalMode #stage-root :is(.finalWinnerEyebrow,.finalWinnerTagline) { font-size:13px;letter-spacing:.3em;line-height:1.2; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerWordmark { width:88%; }
 #app #seasonEntry.v10FinalMode #stage-root .winnerTrophySlot { left:50%;top:17%;height:27%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerHeroCopySlot { left:50%;top:45%;width:min(64%,520px); }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerStateHeading { font-size:14px;letter-spacing:.24em; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerOutcome { font-size:44px;margin-top:4px; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerManager small { font-size:14px;letter-spacing:.16em; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerManager .sd-number { font-size:54px; }
 #app #seasonEntry.v10FinalMode #stage-root :is(.finalWinnerResultText,.finalWinnerCompletion) { font-size:14px;margin-top:4px; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerResultsPanel {
  left:5%;width:90%;top:63%;bottom:calc(4% + 72px);height:auto;grid-template-columns:36% minmax(0,1fr);grid-template-rows:minmax(0,1fr);
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneTabs,
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerTabInput { display:none; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerResultsPanel :is(.finalWinnerMetaStrip,.finalWinnerHonours) { display:grid;grid-row:1; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerResultsPanel .finalWinnerMetaStrip { grid-column:1;border-right:1px solid #d9b64e66; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerResultsPanel .finalWinnerHonours { grid-column:2;padding:8px 18px; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerMetaCell :is(span,small) { font-size:12px;letter-spacing:.12em; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerMetaCell strong { margin:2px 0;font-size:40px;line-height:1; }
 #app #seasonEntry.v10FinalMode #stage-root :is(.finalWinnerHonoursHead,.finalWinnerTrophyMetric) { grid-template-columns:52px 30px minmax(0,1fr) 30px 52px;gap:8px;font-size:13px;letter-spacing:.06em; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerHonoursHead { min-height:34px; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerTrophyMetric img { max-height:34px; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerMetricValue { font-size:26px; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerTotalMark { font-size:18px; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot { left:8%;width:84%;top:auto;bottom:4%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions { gap:16px; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions button { min-height:56px;font-size:15px; }
 #app #seasonEntry.v10FinalMode #stage-root .v10FinalProof { left:5%;width:90%;top:auto;bottom:calc(4% + 64px);max-height:none; }
 #app #seasonEntry.v10FinalMode #stage-root:has(#v10ReconciliationSlot>:not(.hidden)) .finalWinnerResultsPanel { bottom:calc(4% + 120px); }
}

/* SEASON-PLATE-V2 (ticket 1610P): desktop Season Results on Team V's approved stadium-stand plate
   (visual-assets/v10_1/plates-v2/ENV_SEASON_RESULTS_PLATE_V2_*), with the cards and buttons in the picture's gold-bevel
   and polished-gold finish (NEXT_SEASON_RESULTS). Strictly the desktop picture range: wide landscape windows of at
   least 1200x600; phone, sideways and tablet keep their art and rules. The plate is the same 1536x864 as the old
   one, so the stage keeps registering it exactly as before; it loads with this screen, never with the startup bundle.
   Both managers' fists are painted on the plate, so the old registered fist overlays are not drawn on top of it.
   Looks only: every word, id and tap order stays as it was. */
@media (min-width:1200px) and (min-height:600px) and (min-aspect-ratio:3/2) and (orientation:landscape) {
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage {
  --sr-bevel:linear-gradient(135deg,#fff1b8 0%,#e8b94a 15%,#8a6a12 36%,#f2c45b 56%,#fff1b8 73%,#b8862a 100%);
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .sd-stage__plate {
  background-image:image-set(url("${assetUrl(BASE+"plates-v2/ENV_SEASON_RESULTS_PLATE_V2_1X.webp")}") 1x,url("${assetUrl(BASE+"plates-v2/ENV_SEASON_RESULTS_PLATE_V2_2X.webp")}") 2x);
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(.season-depth-picture,.season-rim-picture) { display:none; }
 /* a soft dark pool behind the eyebrow, title and line, so they read over the arena lights */
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-title-block::before {
  content:"";position:absolute;z-index:-1;left:26%;right:26%;top:7%;height:26%;pointer-events:none;
  background:radial-gradient(ellipse at 50% 50%,#050608a0,#05060860 48%,transparent 72%);
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-eyebrow,#app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-tagline { text-shadow:0 0 3px #000,0 1px 2px #000,0 0 12px #000,0 0 22px #000c; }
 /* the scoring card, the entry card and the review card: gold-bevel frame around a black face with a thin inner gold line */
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(.scoring-panel,.seasonEntryGrid .entry-panel,.season-review-panel) {
  clip-path:none;border:4px solid transparent;border-radius:9px;
  background:linear-gradient(180deg,#15130fF2 0,#0a0a0bF5 22%,#08080aF7 100%) padding-box,var(--sr-bevel) border-box;
  box-shadow:inset 0 0 0 2px #050505,inset 0 0 0 3px #d9aa3c99,inset 0 1px 0 4px #fff1b81c,0 0 28px #f0c84b38,0 14px 36px #000c;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonReviewCard { border-radius:6px; }
 /* REVIEW MY SEASON RESULT and COMMIT & ACKNOWLEDGE: polished gold */
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(.season-action-row #completeSeason,#sharedSeasonCommitAction,.seasonReviewActions .menuButton:not(:disabled)) {
  border:2px solid transparent;border-radius:4px;color:#17110a;
  background:linear-gradient(180deg,#fff0a6 0,#f8d764 20%,#e4b032 54%,#f4cf58 80%,#c98f1c 100%) padding-box,linear-gradient(135deg,#fff8d0,#d9a83a 40%,#fff1b8 70%,#a9781a) border-box;
  box-shadow:inset 0 1px 0 #fffbe0,inset 0 -3px 0 #a87a1288,0 0 0 1px #000a,0 0 22px #f5c51855,0 5px 18px #0009;
  text-shadow:0 1px 0 #fff2b588;
 }
 /* BACK TO SHOWDOWN HOME: black face, gold-bevel edge */
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-action-row .backButton {
  border:2px solid transparent;border-radius:4px;color:#fff1ae;
  background:linear-gradient(180deg,#141311,#070708) padding-box,var(--sr-bevel) border-box;
  box-shadow:inset 0 0 0 1px #050505,inset 0 1px 0 2px #fff1b81f,0 5px 16px #000a;
 }
}
/* short windows (1280x650): a slimmer frame and tighter card padding keep the whole screen, buttons included, on the page */
 @media (min-width:1200px) and (min-height:600px) and (max-height:700px) and (min-aspect-ratio:3/2) and (orientation:landscape) {
  #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage :is(.scoring-panel,.seasonEntryGrid .entry-panel,.season-review-panel) { border-width:3px; }
  #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .seasonEntryGrid .entry-panel { padding-top:6px;padding-bottom:6px; }
  #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-layout { padding-bottom:0;gap:6px; }
 }
 

/* FINAL-WINNER-PLATE-V2 (ticket 1610P): desktop Final Winner on Team V's black-marble champion-hall plate
   (visual-assets/v10_1/plates-v2/ENV_FINAL_WINNER_PLATE_V2_*), drawn to match NEXT_FINAL_WINNER. Strictly the desktop picture
   range: wide landscape windows of at least 1200x600; phones, sideways phones and tablets keep their art and rules. The plate
   is the background of the screen's own scroller (so it fills the window under the top bar, as in the picture), fitted to the
   window height and centred, with a darkened soft side fill on windows wider than 16:9, and loads with this screen, never
   with the startup bundle. It carries both managers, every banner, the name tags and an empty marble pedestal with a flat
   top: the live champion trophy is seated on it. The old plate layer and manager cut-outs are not drawn. Every slot is placed
   in plate units (--fw-k is one plate pixel) so it stays registered on every window shape. Looks only: every word, id and tap
   order stays as it was. */
@media (min-width:1200px) and (min-height:600px) and (min-aspect-ratio:3/2) and (orientation:landscape) {
 #app main:has(> #seasonEntry.seasonScreenV10.v10FinalMode:not(.hidden)) {
  --fw-k:calc(100svh / 864); --fw-top:calc(var(--sd-nav-top-h,52px) + 14px);
  --fw-edge:linear-gradient(90deg,#000b,#0000);
  background-color:#07080a;
  background-image:
   linear-gradient(270deg,#000b,#0000),linear-gradient(90deg,#000b,#0000),
   image-set(url("${assetUrl(BASE+"plates-v2/ENV_FINAL_WINNER_PLATE_V2_1X.webp")}") 1x,url("${assetUrl(BASE+"plates-v2/ENV_FINAL_WINNER_PLATE_V2_2X.webp")}") 2x),
   linear-gradient(#000b,#000b),
   image-set(url("${assetUrl(BASE+"plates-v2/ENV_FINAL_WINNER_PLATE_V2_1X.webp")}") 1x,url("${assetUrl(BASE+"plates-v2/ENV_FINAL_WINNER_PLATE_V2_2X.webp")}") 2x);
  background-repeat:no-repeat;
  background-size:calc(80 * var(--fw-k)) 100%,calc(80 * var(--fw-k)) 100%,auto 100svh,auto,cover;
  background-position:calc(50% + 728 * var(--fw-k)) 0,calc(50% - 728 * var(--fw-k)) 0,50% calc(0px - var(--sd-nav-top-h,52px)),0 0,50% 50%;
 }
 #app #seasonEntry.v10FinalMode,
 #app #seasonEntry .v10FinalStage { background:none; }
 #app #seasonEntry .v10FinalStage :is(.sd-stage__layer--plate,.sd-stage__layer--cutout,.sd-stage__layer--light) { display:none; }
 /* a soft dark pool behind the title lines, so they read over the bright arena lights */
 #app #seasonEntry .v10FinalStage .finalWinnerTitleBlock::before { content:""; position:absolute; z-index:-1; left:-12%; right:-12%; top:-8%; bottom:-30%; pointer-events:none; background:radial-gradient(ellipse at 50% 52%,#050608a0,#05060860 48%,transparent 72%); }
 #app #seasonEntry .v10FinalStage .finalWinnerTitleBlock { top:calc(108 * var(--fw-k) - var(--fw-top)); width:calc(522 * var(--fw-k)); }
 #app #seasonEntry .v10FinalStage :is(.finalWinnerCrown--daniel,.finalWinnerCrown--nik) { top:calc(80 * var(--fw-k) - var(--fw-top)); }
 #app #seasonEntry .v10FinalStage .finalWinnerHeroCopySlot { top:calc(238 * var(--fw-k) - var(--fw-top)); width:calc(418 * var(--fw-k)); }
 /* the champion trophy stands on the pedestal's flat top (plate y 575 to 600) */
 #app #seasonEntry .v10FinalStage .winnerTrophySlot { top:calc(291 * var(--fw-k) - var(--fw-top)); width:calc(210 * var(--fw-k)); height:calc(306 * var(--fw-k)); }
 /* the summary plaque and the two buttons sit where the picture has them (r80: at least 124px for the five honours rows with the Europa League;
    r80 short screens: 148 picture px, not 138, as TOTAL TROPHIES ran into the plaque's bottom border at 1920x1080, 1536x864 and 1366x768) */
 #app #seasonEntry .v10FinalStage .finalWinnerResultsPanel {
  left:50%; translate:-50% 0; width:max(calc(913 * var(--fw-k)),59.3%); top:calc(640 * var(--fw-k) - var(--fw-top)); height:max(calc(148 * var(--fw-k)),124px);
  border:3px solid transparent;
  background:linear-gradient(115deg,#111110f2,#060706f0) padding-box,linear-gradient(135deg,#fff1b8 0%,#e8b94a 15%,#8a6a12 36%,#f2c45b 56%,#fff1b8 73%,#b8862a 100%) border-box;
  box-shadow:inset 0 0 0 2px #050505,inset 0 0 0 3px #e4c56a70;
 }
 #app #seasonEntry .v10FinalStage .finalWinnerActionsSlot { left:calc(50vw - 223 * var(--fw-k)); width:calc(448 * var(--fw-k)); top:min(calc(784 * var(--fw-k) - var(--fw-top)),calc(100% - 56px)); bottom:auto; }
 #app #seasonEntry .v10FinalStage .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions button {
  border:2px solid transparent;
  background:linear-gradient(#171512,#070708) padding-box,linear-gradient(135deg,#fff1b8 0%,#e8b94a 15%,#8a6a12 36%,#f2c45b 56%,#fff1b8 73%,#b8862a 100%) border-box;
 }
 #app #seasonEntry .v10FinalStage .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions .backButton {
  background:linear-gradient(180deg,#fff0a6 0,#f8d764 20%,#e4b032 54%,#f4cf58 80%,#c98f1c 100%) padding-box,linear-gradient(135deg,#fff8d0,#d9a83a 40%,#fff1b8 70%,#a9781a) border-box;
  box-shadow:inset 0 1px 0 #fffbe0,inset 0 -3px 0 #a87a1288,0 0 20px #f5c51840;
 }
}
/* short windows (1280x650, 1366x768): the plaque rides a little higher so it clears the two buttons */
@media (min-width:1200px) and (min-height:600px) and (max-height:800px) and (min-aspect-ratio:3/2) and (orientation:landscape) {
 #app #seasonEntry .v10FinalStage .finalWinnerResultsPanel { top:calc(598 * var(--fw-k) - var(--fw-top)); }
}
/* r73 polish. Review: the projected overall bar is sized min(620px,92vw) by the old app sheet, wider than the review
   panel on phones, so it stops at the panel's inner edge; the review lines take the game's condensed face instead of the
   system font; the review heading is focused on open for screen readers only (tabindex -1), so it draws no ring. */
#app #seasonEntry.seasonScreenV10 .season-review-panel .overallScoreBox { max-width:100%; box-sizing:border-box; }
#app #seasonEntry.seasonScreenV10 .season-review-panel :is(.seasonReviewIntro,.summaryClub,.summaryLine) {
 font-family:var(--sd-font-condensed,"Barlow Condensed","Arial Narrow",sans-serif);
}
#app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage #seasonReviewHeading[tabindex="-1"]:focus { outline:none !important; box-shadow:none; }
/* r73 polish, Final Winner sideways: a little air between the DANIEL WINS line and the two manager labels under it. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:640px) and (max-width:1199px) and (min-height:340px) and (max-height:500px) and (orientation:landscape) {
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerTotals { margin-top:7px; }
}
/* Nik 2026-10-12 (live r73): after a real run the Shared Terminal Close panel sat in the actions slot above REVIEW SEASON
   and BACK TO SHOWDOWN HOME and pushed both buttons off the clipped stage, so the screen had no way out; on some windows
   the two buttons also covered the bottom row of the scoreboard. Rule now: the scoreboard, the close message and the two
   buttons stack and never overlap, on every window.
   CLOSED: the stage already says SHOWDOWN CLOSED, the winner and both totals, so the panel stays for screen readers
   only and takes no room. Any other phase (saving, CLOSE retry): the panel is a slim black-and-gold strip directly above
   the two buttons, and the scoreboard makes room for it (it moves up on desktop, it gives up height elsewhere). */
#app #seasonEntry.v10FinalMode #stage-root { --fw-th:0px; }
#app #seasonEntry.v10FinalMode #stage-root:has(#sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden)) { --fw-th:64px; }
#app #seasonEntry.v10FinalMode #stage-root #v10TerminalSlot { position:absolute; left:0; right:0; bottom:calc(100% + 8px); z-index:2; }
#app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot:has(#sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden)) { z-index:40; overflow:visible; clip-path:none; contain:none; max-height:none; }
#app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel[data-terminal="true"] {
 position:absolute !important; width:1px !important; height:1px !important; margin:-1px !important; padding:0 !important; border:0 !important;
 overflow:hidden !important; clip:rect(0 0 0 0) !important; clip-path:inset(50%) !important; white-space:nowrap !important;
}
#app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden) {
 display:grid; grid-template-columns:minmax(0,1fr) auto; grid-template-rows:auto auto; align-items:center; column-gap:14px; row-gap:2px;
 height:56px; margin:0; padding:5px 6px 5px 14px; box-sizing:border-box; overflow:hidden;
 border:1px solid transparent; border-radius:0; color:#f5eacb; text-align:left;
 background:linear-gradient(115deg,#141210f5,#060706f2) padding-box,linear-gradient(135deg,#fff1b8 0%,#e8b94a 15%,#8a6a12 36%,#f2c45b 56%,#fff1b8 73%,#b8862a 100%) border-box;
 box-shadow:inset 0 0 0 1px #050505,0 6px 18px #000a;
 font:600 12px/1.25 var(--sd-font-condensed,"Barlow Condensed",sans-serif); letter-spacing:.04em;
}
#app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden) :is(h3,p) { grid-column:1; min-width:0; margin:0; padding:0; border:0; background:none; box-shadow:none; font:inherit; color:inherit; }
#app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden) h3 { grid-row:1; align-self:end; color:#f2c45b; font-weight:800; letter-spacing:.14em; }
#app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden) .stateNote { grid-row:2; align-self:start; color:#d9cfb4; }
/* the winner and both totals are already on the stage: the summary line stays for screen readers only */
#app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden) #sharedTerminalCloseSummary {
 position:absolute; width:1px; height:1px; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap;
}
#app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden) .seasonReviewActions {
 grid-column:2; grid-row:1/3; display:flex; gap:8px; margin:0; padding:0; border:0; background:none; box-shadow:none;
}
#app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden) .seasonReviewActions button:not(.hidden) {
 min-width:0; min-height:44px; margin:0; padding:0 18px; box-sizing:border-box; border:2px solid transparent; border-radius:0;
 background:linear-gradient(#171512,#070708) padding-box,linear-gradient(135deg,#fff1b8 0%,#e8b94a 15%,#8a6a12 36%,#f2c45b 56%,#fff1b8 73%,#b8862a 100%) border-box;
 box-shadow:inset 0 0 0 1px #050505; color:#f7cf60; text-shadow:none; white-space:nowrap;
 font:800 12px/1.15 var(--sd-font-condensed,"Barlow Condensed",sans-serif); letter-spacing:.1em; text-transform:uppercase;
}
#app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden) .seasonReviewActions button:not(.hidden):active { filter:brightness(.86); }
#app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden) .seasonReviewActions button:focus-visible { outline:3px solid #fff5c4; outline-offset:-5px; }
/* desktop picture range: the plaque keeps its place in the picture unless the window is too short for plaque, strip and
   buttons; then it rides up just enough. The buttons always sit 6px under the plaque, never on it. */
@media (min-width:1200px) and (min-height:600px) and (min-aspect-ratio:3/2) and (orientation:landscape) {
 #app #seasonEntry .v10FinalStage {
  --fw-r0:calc(640 * var(--fw-k) - var(--fw-top)); --fw-rh:max(calc(148 * var(--fw-k)),124px); --fw-bh:calc(max(44px,var(--fwu) * 2.9) + 12px);
  --fw-rt:min(var(--fw-r0),calc(100% - var(--fw-rh) - var(--fw-bh) - var(--fw-th) - 6px));
 }
 #app #seasonEntry .v10FinalStage .finalWinnerResultsPanel { top:var(--fw-rt); }
 /* on a short window the trophy shrinks a little rather than stand behind the raised plaque */
 #app #seasonEntry .v10FinalStage .winnerTrophySlot { height:min(calc(306 * var(--fw-k)),calc(var(--fw-rt) - 291 * var(--fw-k) + var(--fw-top) - 4px)); }
 #app #seasonEntry .v10FinalStage .finalWinnerActionsSlot { top:calc(var(--fw-rt) + var(--fw-rh) + 6px + var(--fw-th)); bottom:auto; }
 #app #seasonEntry.v10FinalMode #stage-root #v10TerminalSlot { left:50%; right:auto; width:max(calc(913 * var(--fw-k)),59.3cqw); translate:-50% 0; }
}
@media (min-width:1200px) and (min-height:600px) and (max-height:800px) and (min-aspect-ratio:3/2) and (orientation:landscape) {
 #app #seasonEntry .v10FinalStage { --fw-r0:calc(598 * var(--fw-k) - var(--fw-top)); }
}
/* big sideways phones (iPhone Plus and Pro Max, 932x430) use the sideways layout; from 901px wide the game's top bar
   stays, so the screen starts under it */
@media (min-width:901px) and (max-width:1199px) and (min-height:340px) and (max-height:500px) and (orientation:landscape) {
 html[data-v10-screen="seasonEntry"] #app main:has(#seasonEntry.seasonScreenV10.v10FinalMode:not(.hidden)) { top:var(--sd-nav-top-h,52px); height:auto; }
 #app #seasonEntry.seasonScreenV10.v10FinalMode { height:calc(100svh - var(--sd-nav-top-h,52px)); }
}
/* phone upright, pending: one row of season facts so the summary fits the shorter panel */
@media (min-width:340px) and (max-width:440px) and (min-height:520px) and (max-height:960px) and (orientation:portrait) {
 #app #seasonEntry.v10FinalMode #stage-root:has(#sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden)) .finalWinnerMetaStrip { grid-template-columns:1.4fr 1fr 1fr; grid-template-rows:1fr; }
 #app #seasonEntry.v10FinalMode #stage-root:has(#sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden)) .finalWinnerMetaCell--lastSeason { grid-column:auto; border-bottom:0; }
 #app #seasonEntry.v10FinalMode #stage-root:has(#sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden)) .finalWinnerMetaCell~.finalWinnerMetaCell { border-left:1px solid #d9b64e66; }
}
@media (min-width:901px) and (max-width:1199px) and (min-height:501px),
       (min-width:761px) and (max-width:900px) and (min-height:501px) and (max-height:959px),
       (min-width:761px) and (max-width:900px) and (min-height:1241px) {
 /* small laptops and tablets on their side (1024x768, 1180x820): the two exits in the black-and-gold kit, not the old
    blue-and-white buttons; while the strip shows, the plaque moves up by its height */
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions {
  display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:0; padding:0; border:0; background:none; box-shadow:none;
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions button {
  box-sizing:border-box; width:100%; min-width:0; min-height:44px; margin:0; padding:6px 10px; border:2px solid transparent; border-radius:0;
  background:linear-gradient(#171512,#070708) padding-box,linear-gradient(135deg,#fff1b8 0%,#e8b94a 15%,#8a6a12 36%,#f2c45b 56%,#fff1b8 73%,#b8862a 100%) border-box;
  color:#f7cf60; text-shadow:none; box-shadow:inset 0 0 0 1px #050505;
  font:800 12px/1.2 var(--sd-font-condensed,"Barlow Condensed",sans-serif); letter-spacing:.08em; text-transform:uppercase; white-space:nowrap;
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions .backButton {
  background:linear-gradient(180deg,#fff0a6 0,#f8d764 20%,#e4b032 54%,#f4cf58 80%,#c98f1c 100%) padding-box,linear-gradient(135deg,#fff8d0,#d9a83a 40%,#fff1b8 70%,#a9781a) border-box;
  color:#17130a; box-shadow:inset 0 1px 0 #fffbe0,0 0 16px #f5c51840;
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions button:active { filter:brightness(.86); }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions button:focus-visible { outline:3px solid #fff5c4; outline-offset:2px; }
 #app #seasonEntry.v10FinalMode #stage-root #v10TerminalSlot { left:50%; right:auto; width:min(66vw,820px); translate:-50% 0; }
 #app #seasonEntry.v10FinalMode #stage-root:has(#sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden)) .finalWinnerResultsPanel { translate:0 calc(0px - var(--fw-th)); }
}
/* phone upright, sideways and tablet: the summary panel ends higher by the strip's height while the strip shows */
@media (min-width:340px) and (max-width:440px) and (min-height:520px) and (max-height:960px) and (orientation:portrait) {
 #app #seasonEntry.v10FinalMode #stage-root:has(#sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden)) { --fw-th:72px; }
 #app #seasonEntry.v10FinalMode #stage-root:has(#sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden)) .finalWinnerResultsPanel { bottom:calc(max(12px,env(safe-area-inset-bottom)) + 74px + var(--fw-th)); }
}
@media (max-width:760px), (max-height:500px) {
 #app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden) { height:64px; padding:4px 4px 4px 10px; column-gap:8px; font-size:11px; letter-spacing:.02em; }
 #app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden) h3 { letter-spacing:.1em; }
 #app #seasonEntry.v10FinalMode #stage-root #sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden) .seasonReviewActions button:not(.hidden) { width:9.5em; padding:0 8px; white-space:normal; font-size:11px; letter-spacing:.06em; }
}
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:640px) and (max-width:1199px) and (min-height:340px) and (max-height:500px) and (orientation:landscape) {
 #app #seasonEntry.v10FinalMode #stage-root:has(#sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden)) { --fw-th:72px; }
 #app #seasonEntry.v10FinalMode #stage-root:has(#sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden)) .finalWinnerResultsPanel { bottom:calc(4% + 58px + var(--fw-th)); }
}
@media (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
 #app #seasonEntry.v10FinalMode #stage-root:has(#sharedTerminalClosePanel:not([data-terminal="true"]):not(.hidden)) .finalWinnerResultsPanel { bottom:calc(4% + 72px + var(--fw-th)); }
}/* r78 phone marble: below the desktop picture range the Season Results tab bar and the action row are no longer glass
   (no backdrop blur); the row wears desktop's black-marble face. Looks only: size, place and order are unchanged. */
@media not all and (min-width: 1200px) and (min-height: 600px) and (min-aspect-ratio: 3/2) and (orientation: landscape) {
 #app #seasonEntry .v10SeasonStage .season-phone-toolbar { -webkit-backdrop-filter:none; backdrop-filter:none; }
 #app #seasonEntry .season-action-row { background:linear-gradient(180deg, rgba(26,24,20,.9) 0%, rgba(9,9,11,.94) 46%, rgba(4,4,6,.96) 100%); -webkit-backdrop-filter:none; backdrop-filter:none; }
}
/* r78 HO-031 phone marble: Season Results and Final Winner draw Team V's marble phone plates (both managers painted in)
   in place of the old phone backgrounds and the managers' cut-outs; no dark veils or spotlights over the men. Upright phones
   and tablets: the plate covers the whole screen from the top (the managers' band keeps its height, so every tab, card and
   button stays where it was). Sideways phones: Season Results keeps the plate in its left band. */
@media (min-width:340px) and (max-width:440px) and (min-height:520px) and (max-height:960px) and (orientation:portrait),
       (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-layout {
  background:#090b0e url("${assetUrl(BASE+"plates-v2/ENV_SEASON_RESULTS_PHONE_V2.webp")}") center top/max(100vw,calc(100svh * 1179 / 2096)) auto no-repeat;
 }
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene { background:none; }
}
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape) {
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene {
  background:#090b0e url("${assetUrl(BASE+"plates-v2/ENV_SEASON_RESULTS_PHONE_V2.webp")}") center top/cover no-repeat;
 }
}
@media (min-width:340px) and (max-width:440px) and (min-height:520px) and (max-height:960px) and (orientation:portrait),
       (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .v10SeasonPhoneScene::before { content:none; }
}
@media (max-width:760px),
       (min-width:640px) and (max-width:1199px) and (min-height:340px) and (max-height:500px) and (orientation:landscape),
       (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneBackground img { object-position:center top; }
 #app #seasonEntry.v10FinalMode #stage-root :is(.finalWinnerPhoneVeil,.finalWinnerManagerShade,.finalWinnerManagerSpotlight) { display:none; }
}
/* HO-033 item 5 · sideways phones (852x393): the upright phone plate ran the full width from its top, so both painted
   managers sat under the results panel with only their head tops showing. Here the plate fills the left half only (the
   panel and both exits own the right half), shown from just above the managers' heads, and the title, trophy and score
   form one narrow column between the two men, so no face is covered and nothing sits on the panel. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:640px) and (max-width:1199px) and (min-height:340px) and (max-height:500px) and (orientation:landscape) {
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneBackground { right:auto;width:50%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerPhoneBackground img { object-fit:cover;object-position:50% 30%; }
 #app #seasonEntry.v10FinalMode #stage-root :is(.finalWinnerTitleBlock,.finalWinnerHeroCopySlot) { left:25%;width:min(19%,200px); }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerTitleBlock { top:2%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerWordmark { width:100%; }
 #app #seasonEntry.v10FinalMode #stage-root .winnerTrophySlot { left:25%;top:25%;height:29%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerHeroCopySlot { top:57%; }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerOutcome { font-size:clamp(20px,6.4svh,26px); }
}
/* HO-033 item 4 · phones (393x660, 360x640 and sideways): REVIEW SEASON / BACK and, on the review stage, the review actions
   (CONFIRM & SAVE SEASON / EDIT RESULTS, or the shared commit) were 140-1300px down the page scroll. They now stay docked
   at the bottom of the screen on an opaque black-gold marble band (the same docked-action pattern as the Rule Book and
   Settings phones). The page still scrolls for the rest of the form and the review, and it ends with the band in its own
   place in the flow, so at the end of the scroll nothing sits under it. (:not(#seasonEntryError) only lifts the selector over
   the phone block's :is(...,#seasonEntryError) rule, which counts as an id.) */
@media (max-width:760px), (max-width:1000px) and (orientation:landscape) and (max-height:520px) {
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-action-row:not(.hidden):not(#seasonEntryError),
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-review-panel>.seasonReviewActions:has(>button:not(.hidden):not([hidden])) {
  position:sticky;bottom:0;z-index:8;align-self:stretch;box-sizing:border-box;
  margin-inline:-10px;padding:8px 10px max(8px,env(safe-area-inset-bottom));
  background:var(--r78-panel,#110f0c) url("css/r78-marble-tile.webp") 0 0/256px 256px repeat;
  border-top:1px solid #d4a017;box-shadow:0 -1px 0 #000;
 }
}
/* The upright phone grid (JOB-1597) keeps the entry action row in a fixed 56px track: the band's padding fits inside it. */
@media (min-width:340px) and (max-width:440px) and (min-height:520px) and (max-height:960px) and (orientation:portrait) {
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-action-row:not(.hidden):not(#seasonEntryError) { padding-top:4px;padding-bottom:max(4px,env(safe-area-inset-bottom)); }
}
/* HO-033 item 4 · Full-HD desktop (JOB-1214 range, 1920x1080): the review grows in the page scroll, which left CONFIRM &
   SAVE SEASON and EDIT RESULTS at y 1163-1266. The review's action row now docks at the bottom edge of the window on the
   same opaque band while the box is on screen; the layout, the scoring card and the box width stay as approved. */
@media (min-width:1880px) and (max-width:1960px) and (min-height:1040px) and (max-height:1120px) {
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-review-panel>.seasonReviewActions:has(>button:not(.hidden):not([hidden])) {
  position:sticky;bottom:0;z-index:8;align-self:stretch;width:auto;max-width:none;margin:6px 0 0;padding:10px 0 12px;
  display:flex;flex-flow:row wrap;justify-content:center;gap:16px;
  background:var(--r78-panel,#110f0c) url("css/r78-marble-tile.webp") 0 0/256px 256px repeat;
  border-top:1px solid #d4a017;box-shadow:0 -1px 0 #000;
 }
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-review-panel>.seasonReviewActions>button { flex:1 1 300px;width:auto;max-width:520px;margin:0; }
}
/* r83 gallery: keep the canonical score and both exits in flow. The docked row
   otherwise paints over the totals/result while the review is still at its top. */
#app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .season-review-panel:has(#sharedCanonicalScoringPanel:not(.hidden))>.seasonReviewActions {
 position:static;
}
/* Reclaim the card's generous row spacing at Full HD so the score and exits fit
   together on the first view. Other desktop sizes can grow in main's flow. */
@media (min-width:1880px) and (max-width:1960px) and (min-height:1040px) and (max-height:1120px) {
 #app #seasonEntry.seasonScreenV10 .v10SeasonStage .season-review-panel:has(#sharedCanonicalScoringPanel:not(.hidden))>.seasonReviewActions { gap:4px;padding-block:4px; }
 #app #seasonEntry.seasonScreenV10 #sharedCanonicalScoringPanel { padding:6px 14px; }
 #app #seasonEntry.seasonScreenV10 #sharedCanonicalScoringPanel p { margin:2px 0; }
 #app #seasonEntry.seasonScreenV10 .season-review-panel:has(.sharedCanonicalScoringPanel:not(.hidden)) .seasonSummaryCard { padding:4px 14px; }
 #app #seasonEntry.seasonScreenV10 .season-review-panel:has(.sharedCanonicalScoringPanel:not(.hidden)) .summaryLine { padding-block:1px; }
 #app #seasonEntry.seasonScreenV10 .season-review-panel:has(.sharedCanonicalScoringPanel:not(.hidden)) .seasonReviewAchievements { margin-block:2px;gap:3px; }
}
/* r80 gallery: the line that explains CONTINUE TO SEASON N ("SEASON 1 HISTORY IS READY · CONTINUE ONCE TO SEASON 2") is the
   first, full-width line of the action row, so it travels with the docked band on phones and at 1920x1080 and is never
   under it; on the other sizes it stays right above the buttons. */
#app #seasonEntry.seasonScreenV10 .season-review-panel .seasonReviewActions>.sharedMultiSeasonProgressionStatus:not(.hidden) {
 order:-1;flex:0 0 auto;width:100%;max-width:none;margin:0;box-sizing:border-box;
}
/* r80 short screens: Season Results at 901-1239px wide and up to 800px tall (1024x768, 1100x600, 1024x600) and at 1401-1879px
   wide (1536x864) used the fixed one-window stage, where the two forms ran under the scoring card and the action row (TOP
   SCORER and TOP ASSIST were cut, 1024x600 and 1100x600) and the review scrolled inside its own box, hiding CONFIRMATION IS
   FINAL (1024x768, 1536x864). Those windows now use the page-scroll layout 1366x768 and 1920x1080 already use (same cards,
   same order; main is the only scroller). Below 1240px the forms are wider than the gap between the two
   managers, so the cards stay in front of the cut-out and rim-light layers, as on the fixed stage. */
@media (min-width:901px) and (max-width:1239px) and (min-height:501px) and (max-height:800px) and (orientation:landscape) {
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .sd-stage__layer--ui { z-index:5; }
 /* the stadium plate fills the window from its top, as on the fixed stage (no black bands on 4:3 and 16:10 windows) */
 #app #seasonEntry.seasonScreenV10:not(.v10FinalMode) .v10SeasonStage .sd-stage__registered {
  top:0!important;width:max(100vw,177.77778svh)!important;height:max(56.25vw,100svh)!important;
 }
}
/* r80 short screens: the final season's result line ("DANIEL TAKES THE SEASON") wraps inside its own cell of the summary
   strip; it was kept on one line and ran into SEASONS PLAYED in the next cell (1024x768). */
#app #seasonEntry #finalWinnerLastSeason #panelLastSeasonResult { max-width:100%;white-space:normal;overflow-wrap:normal;text-align:center; }
/* r87 Rematch: a third exit in the same row and kit (black with a gold edge between REVIEW SEASON and the gold BACK TO
   SHOWDOWN HOME). Two short lines (REMATCH over the length, or DANIEL STARTS IT on Nik's phone) keep it as narrow as the
   others, so the row keeps its height and place at every size; phones split the row in three equal cells. */
#app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions:has(> #finalWinnerRematch) { grid-template-columns:repeat(3,minmax(0,1fr)); }
#app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions > #finalWinnerRematch {
 display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;flex:.78 1 0;line-height:1.05;white-space:nowrap;
}
#app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions > #finalWinnerRematch .finalWinnerRematchSub {
 display:block;font-size:max(9px,.74em);letter-spacing:.1em;color:#f2d68c;opacity:.9;
}
#app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions > #finalWinnerRematch[aria-busy="true"] { cursor:progress; }
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
    sfSeasonChips(stage,frame.specialPlayers);
    renderFinal(host,frame.final,frame.rematch);
  }
  // r86: each entry card's manager header shows that manager's Special Player under the name (none before r86). Only the chip
  // slot is added or replaced; the header's own name and club nodes stay as they are.
  function sfSeasonChips(stage,sp){
    const api=root.CareerModeSpecialPlayerChip;
    for(const [manager,id] of [["daniel","daniel-entry-panel"],["nik","nik-entry-panel"]]){
      const header=stage.querySelector?.("#"+id+" .seasonManagerHeader");if(!header)continue;
      header.querySelectorAll(".seasonSpecialPlayer").forEach(node=>node.remove());
      const chip=api&&sp&&sp[manager]?api.element(root.document,sp[manager]):null;if(!chip)continue;
      const slot=root.document.createElement("span");slot.className="seasonSpecialPlayer";slot.appendChild(chip);
      const name=header.querySelector("h3");if(name)name.after(slot);else header.appendChild(slot);
    }
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
  // r76: BACK TO SHOWDOWN HOME on the Showdown Champion screen is the shared smart back of #seasonEntry, whose legal
  // targets are dashboard then mainMenu. Once a season was entered from the dashboard (after a reload or a CONTINUE CAREER
  // from Home), the history walk found the dashboard first. In final mode the only target is Showdown Home. The other
  // #seasonEntry modes keep their targets; the startup screens.js stays unchanged (startup byte budget).
  function installChampionBack(app=root){
    const legal=app.getLegalBackTargets;
    if(typeof legal!=="function"||legal.v10Champion)return false;
    const wrapped=function(id){return id==="seasonEntry"&&app.document?.getElementById("seasonEntry")?.classList?.contains("v10FinalMode")?["mainMenu"]:legal.apply(this,arguments);};
    wrapped.v10Champion=true;wrapped.original=legal;app.getLegalBackTargets=wrapped;return true;
  }
  // JOB-1038: Terminal Close forgets the session, which clears the live history view. The last converged view of the same
  // rivalry is kept so the closed Final Winner still shows the final season and trophies; finalFrame re-verifies it.
  let retainedHistory=null;
  function sfRetainHistory(history){if(history?.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&history.projection)retainedHistory=history;return history;}
  // JOB-1042: the rival can close before this phone's live history converges. Reuse the session-free,
  // completed-only reader per closed rivalry; the partial Final Winner stays visible during the read.
  const closedHistoryReads=new Map(),CLOSED_HISTORY_MAX_ATTEMPTS=6;
  // JOB-1811: previous-season convergence must not suppress the completed read after the rival closes.
  const sfConverged=(history,closed)=>history?.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&history.rivalryId===closed.rivalryId&&history.projection&&closed.terminalWitness&&closedHistoryBound(history.projection,closed.terminalWitness);
  function sfClosedHistory(rivalryId){
    if(!closedHistoryReads.has(rivalryId))closedHistoryReads.set(rivalryId,{history:null,promise:null,retryAt:0,attempts:0,retryTimer:null});
    const entry=closedHistoryReads.get(rivalryId);
    // r86 (red team #7): a failure stored in the game itself stops the retries, and the rest stop after six attempts (about a
    // minute of backoff); the partial Final Winner stays on screen either way.
    if(!entry.history&&!entry.promise&&!entry.stopped&&Date.now()>=entry.retryAt&&(!entry.attempts||sfDetailsVisible())){
      entry.attempts++;
      entry.promise=Promise.resolve().then(async()=>{
        if(!root.CareerModeSparkCompletedShowdownReader)await root.loadRuntimeScript("career-completed-reader","js/sparkCompletedShowdownReader.js",()=>Boolean(root.CareerModeSparkCompletedShowdownReader));
        const runtime=root.CareerModeProductionFirebaseRuntime,account=state("CareerModeSparkConnectedAccount");
        if(!account?.connected||!runtime)return;
        const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices()),user=services?.auth?.currentUser;
        if(!services?.ok||!user||user.uid!==account.accountId)return;
        const sdk=(root.CareerModeFirestoreBudget?.meterSdk||(s=>s))(services.firestoreSdk?.getDoc?services.firestoreSdk:await import(runtime.firebaseFirestoreModule));
        const result=await root.CareerModeSparkCompletedShowdownReader.readCompletedShowdown({firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc:sdk.getDoc},user,rivalryId});
        if(result?.status==="completed"&&result.rivalryId===rivalryId&&result.projection)entry.history={authoritative:true,phase:"HISTORY_CONVERGED",rivalryId,projection:result.projection,setupConfirmedAt:Number.isFinite(result.setupConfirmedAt)?result.setupConfirmedAt:null};
        else if(root.CareerModeSparkCompletedShowdownReader.permanentFailure?.(result)===true)entry.stopped=true;
      }).catch(()=>{}).then(()=>{entry.promise=null;if(!entry.history&&entry.attempts>=CLOSED_HISTORY_MAX_ATTEMPTS)entry.stopped=true;entry.retryAt=Date.now()+Math.min(30000,1000*2**Math.min(entry.attempts-1,5));wake();});
    }
    return closedHistoryReads.get(rivalryId).history;
  }
  // A failed detail read is retryable. Coalesce reconnect/visible events, respect backoff even
  // when recovery arrives during the read, and keep successful immutable history for this page.
  const sfDetailsVisible=()=>root.document?.visibilityState!=="hidden"&&root.navigator?.onLine!==false&&root.getActiveScreenName?.()==="seasonEntry";
  async function sfRetryClosedHistory(){
    if(!sfDetailsVisible())return;
    const closed=state("CareerModeProductionSharedTerminalClose"),entry=closedHistoryReads.get(closed?.rivalryId);
    if(closed?.phase!=="CLOSED"||!entry)return;
    await entry.promise;
    if(entry.history||entry.stopped||entry.retryTimer!==null||!sfDetailsVisible())return;
    entry.retryTimer=root.setTimeout(()=>{entry.retryTimer=null;if(sfDetailsVisible()&&state("CareerModeProductionSharedTerminalClose")?.rivalryId===closed.rivalryId)wake();},Math.max(0,entry.retryAt-Date.now()));
  }
  function seasonSource(){
    const s=sfSnapshot(),live=sfRetainHistory(s.history),closed=s.terminalClose?.phase==="CLOSED"?s.terminalClose:null;
    const history=closed?.terminal===true?(sfConverged(live,closed)?live:sfConverged(retainedHistory,closed)?retainedHistory:sfClosedHistory(closed.rivalryId)):live;
    const final=finalSeasonReview?{status:"unavailable"}:finalFrame(s.finalReconciliation,s.terminalClose,history);
    const rematch=rematchFrame(final,closed,s.identity);
    // r86 Special Player chip: the live Setup's confirm time, or after close the finished Showdown's own (kept by its read).
    const rid=s.finalReconciliation?.rivalryId||closed?.rivalryId||null,read=closed?closedHistoryReads.get(closed.rivalryId)?.history:null;
    const sp=sfSpecial(chip=>chip.liveFor(rid)||(rid&&read&&Number.isFinite(read.setupConfirmedAt)?chip.forShowdown(rid,read.setupConfirmedAt):null));
    if(!sp)return {final,rematch};
    return {final:final.winner?freeze({...final,specialPlayers:sp}):final,specialPlayers:sp,rematch};
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
    loader.register("seasonEntry",{auto:false,hold:true,css:["season-results/season-results.css","final-winner/final-winner.css","season-results/app.css"],js:[["v10-season-results","season-results/season-results.js",()=>typeof root.ShowdownSeasonResultsBoot==="function"],["v10-final-winner","final-winner/final-winner.js",()=>typeof root.ShowdownFinalWinnerBoot==="function"]],prepare:()=>Promise.all([prepare("season-results"),prepare("final-winner"),sfEnsureChip()]),frame:seasonSource,mount:(frame,host)=>sfKeepFocus(()=>renderSeason(frame,host)),unmount:host=>sfKeepFocus(()=>{finalSeasonReview=false;restoreFinal(host);})});
    loader.register("standings",{auto:false,hold:true,css:["standings/standings.css","season-results/app.css"],js:[["v10-standings","standings/standings.js",()=>typeof root.ShowdownStandingsBoot==="function"]],prepare:()=>Promise.all([prepare("standings"),standingsModules(),sfEnsureChip()]),frame:()=>standingsFrames(currentRivalry(),currentCareer()),mount:renderStandings,unmount(host){host.firstElementChild?.v10StageHandle?.destroy();host.replaceChildren();}});
    installStandingsRoute();installChampionBack();
    // Warm Season Results' kit, scripts and templates now (show() loads, then returns false while the screen is hidden),
    // so the skin mounts in the same tick the screen opens instead of after the form is already being filled in.
    if(typeof loader.show==="function")Promise.resolve(loader.show("seasonEntry")).catch(fail);
    for(const e of ["career-mode-shared-final-reconciliation-state-change","career-mode-shared-terminal-close-state-change","career-mode-shared-history-convergence-state-change","career-mode-shared-multi-season-state-change","career-mode-online-identity-change","career-mode-active-save-changed","career-mode-showdown-state-change","career-mode-online-career-model-change"])root.addEventListener?.(e,wake);
    root.addEventListener?.("career-mode-shared-history-convergence-state-change",()=>sfRetainHistory(state("CareerModeProductionSharedHistoryConvergence")));
    root.addEventListener?.("online",sfRetryClosedHistory);
    root.document.addEventListener("visibilitychange",sfRetryClosedHistory);
    root.document.addEventListener("career-mode-screen-shown",()=>{signature="";followPair();if(root.getActiveScreenName?.()==="standings")refreshStandingsCareer();wake();});
    followPair();
    wake();return true;
  }
  return Object.freeze({finalFrame,rematchFrame,standingsFrames,skinSeason,reviewFinalSeason,installChampionBack,install:installResults});
});
