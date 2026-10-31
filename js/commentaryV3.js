(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCommentaryV3=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Commentary v3 (Nik 2026-10-31: "a huge jump from commentary v2 ... only in selected screens that make sense ...
  // must fit very nice in the UI and never cover any faces or any button, field or game function ... from data only").
  //
  // What v3 adds over v2 (js/commentaryEngine.js picks one stock line for the most specific true situation):
  //   1. A two-voice TV booth. The COMMENTARY line (a checked v2 line) tells the story; the BY THE NUMBERS line underneath
  //      is written here from the Showdown's own numbers: exact decider maths ("needs to win the final season by 4 or
  //      more; by exactly 3 it ends level"), lead changes, streaks, Showdown records, trophy and season counts.
  //   2. Story-aware choice. The lead line follows the biggest story of the season (a decided Showdown, a new leader, a
  //      perfect season) and the numbers line never repeats the lead line's topic.
  //   3. No repeats in a Showdown, the same on both phones. The lines used in earlier seasons are re-derived from the same
  //      verified history (nothing stored), so no line is said twice in one Showdown and both phones show the same words.
  //   4. The last season tells the whole Showdown: its bar carries the Showdown verdict (comeback, wire to wire, the
  //      Golden Showdown, a drawn Showdown).
  //
  // Where: one Team V TV bar (visual-assets/v10_1/content/content.css .cmx-bar, Nik's FIFA 17 presentation bar) inside the
  // SEASON SCORE box of Season Results, in the normal layout flow under the season winner line. Nothing overlays the
  // screen, nothing dims, nothing is tappable. Shown only once the season is committed and its score is reconciled.
  // Data: only what the screen already holds (Shared Setup, the acknowledged Season Commit, the reconciled canonical
  // score and the converged Shared History). No Firebase read, no write, no storage.
  // Rules: a season is 0 to 11 Showdown points; equal points is a draw (no tiebreak: league position, league points and
  // goals never decide anything between the two managers).

  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const LENGTHS=Object.freeze([1,3,5,10]);
  const MAX=11;
  const node=typeof module!=="undefined"&&module.exports;
  const other=role=>role==="playerOne"?"playerTwo":"playerOne";
  const int=(x,lo,hi)=>Number.isInteger(x)&&x>=lo&&x<=hi;
  const plain=x=>Boolean(x)&&typeof x==="object"&&!Array.isArray(x);
  function engine(){return root.CareerModeCommentaryEngine||(node?require("./commentaryEngine.js"):null);}

  // ---------- words ----------
  const WORDS=["zero","one","two","three","four","five","six","seven","eight","nine","ten"];
  function count(n,one,many){return `${n<=10?WORDS[n]:n} ${n===1?one:many}`;}
  function ordinal(n){const tens=n%100;if(tens>=11&&tens<=13)return `${n}th`;return `${n}${({1:"st",2:"nd",3:"rd"})[n%10]||"th"}`;}
  const ORDINAL_WORDS=["","first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth"];
  function nth(n){return ORDINAL_WORDS[n]||ordinal(n);}

  // ---------- facts ----------
  // facts = {showdownId, seasons (1|3|5|10), clubs:{playerOne,playerTwo}, league, teamCount, history:[row...]}
  // row = one accepted season as Shared History stores it: {playerOne:{leaguePosition, leaguePoints, leagueGoals,
  // championsLeague, europaLeague?, domesticCup, topScorer, topAssist, scoring:{total,...}}, playerTwo:{...}, winner}.
  function cvRows(facts){
    if(!plain(facts)||!LENGTHS.includes(facts.seasons)||!Array.isArray(facts.history))return null;
    if(facts.history.length<1||facts.history.length>facts.seasons)return null;
    const rows=[];
    for(const row of facts.history){
      if(!plain(row))return null;
      const out={};
      for(const role of ROLES){
        const r=row[role],total=r?.scoring?.total;
        if(!plain(r)||!int(total,0,MAX)||!int(r.leaguePosition,1,40)||!int(r.leaguePoints,0,200)||!int(r.leagueGoals,0,300))return null;
        out[role]={points:total,position:r.leaguePosition,leaguePoints:r.leaguePoints,leagueGoals:r.leagueGoals,
          trophies:(r.leaguePosition===1?1:0)+(r.championsLeague===true?1:0)+(r.europaLeague===true?1:0)+(r.domesticCup===true?1:0)};
      }
      const a=out.playerOne.points,b=out.playerTwo.points,winner=a>b?"playerOne":b>a?"playerTwo":"draw";
      if(row.winner!==undefined&&row.winner!==winner)return null;
      out.winner=winner;rows.push(out);
    }
    return rows;
  }
  function cvTotals(rows){let a=0,b=0;return rows.map(r=>{a+=r.playerOne.points;b+=r.playerTwo.points;return {playerOne:a,playerTwo:b};});}
  function leaderOf(pair){return pair.playerOne>pair.playerTwo?"playerOne":pair.playerTwo>pair.playerOne?"playerTwo":null;}
  // Lead changes after each season: the overall leader differs from the last manager who led (a level spell in between
  // does not reset it).
  function cvLeadChanges(totals){
    let last=null,changes=0;const out=[];
    for(const pair of totals){const leader=leaderOf(pair);if(leader&&last&&leader!==last)changes+=1;if(leader)last=leader;out.push(changes);}
    return out;
  }
  function cvRun(rows,end,role){let n=0;for(let k=end;k>=0&&rows[k].winner===role;k-=1)n+=1;return n;}
  function cvTally(rows){
    const t={playerOne:0,playerTwo:0,draws:0,trophies:{playerOne:0,playerTwo:0}};
    for(const r of rows){if(r.winner==="draw")t.draws+=1;else t[r.winner]+=1;for(const role of ROLES)t.trophies[role]+=r[role].trophies;}
    return t;
  }
  function both(a,b,unit){return `${NAMES.playerOne} ${a}, ${NAMES.playerTwo} ${b}${unit||""}`;}

  // ---------- BY THE NUMBERS: season ----------
  // Every candidate is true for this season by construction; the first one whose topic the lead line does not already
  // cover is shown. `topic` lets the booth avoid saying the same thing twice.
  function seasonNumbers(rows,s,N,clubs){
    const totals=cvTotals(rows),row=rows[s-1],after=totals[s-1],before=s>1?totals[s-2]:{playerOne:0,playerTwo:0};
    const left=N-s,leader=leaderOf(after),gap=leader?after[leader]-after[other(leader)]:0,W=row.winner==="draw"?null:row.winner;
    const L=leader?NAMES[leader]:null,T=leader?NAMES[other(leader)]:null,out=[],add=(id,topic,text)=>out.push({id,topic,text});
    const seasonsLeft=count(left,"season","seasons");
    // The clock: what is still possible. Most a season can swing the gap is 11 (11 to 0).
    if(leader&&left>0&&gap>MAX*left)add("decided","math",`${L} leads by ${gap} with ${seasonsLeft} to play, and the most ${T} can win back is ${MAX*left}. The Showdown is decided.`);
    else if(leader&&left>0&&gap===MAX*left)add("draw-only","math",`${T} can no longer win it. The best left is a level Showdown, and only by winning ${left===1?"the last season":"every season left"} 11 to 0.`);
    else if(left===1&&leader)add("decider","math",`One season left, ${L} ${after[leader]}, ${T} ${after[other(leader)]}. ${T} must win it by ${gap+1} or more to take the Showdown; by exactly ${gap}, it ends level.`);
    else if(left===1&&!leader)add("decider-level","math",`Level on ${after.playerOne} with one season left: whoever wins the final season wins the Showdown, and a drawn season means a drawn Showdown.`);
    // The lead.
    const changes=cvLeadChanges(totals),leaderBefore=leaderOf(before);
    const changedNow=s>1&&changes[s-1]>changes[s-2];
    if(changedNow&&changes[s-1]>=2)add("lead-change","overall",`That is the ${nth(changes[s-1])} change of lead in this Showdown. ${L} now leads ${after[leader]} to ${after[other(leader)]}.`);
    // Runs.
    if(s>1&&rows[s-2].winner!=="draw"&&W===other(rows[s-2].winner)){const ended=cvRun(rows,s-2,rows[s-2].winner);if(ended>=3)add("run-ended","streak",`${NAMES[W]} ends ${NAMES[rows[s-2].winner]}'s run of ${ended} straight season wins.`);}
    if(W){const run=cvRun(rows,s-1,W);if(run>=3)add("run","streak",`${NAMES[W]} has now won ${run} seasons in a row.`);}
    // Showdown records (only once there are two earlier seasons to beat, so a record means something).
    if(s>2){
      const earlier=rows.slice(0,s-1);
      const margin=Math.abs(row.playerOne.points-row.playerTwo.points),prevMargin=Math.max(...earlier.map(r=>Math.abs(r.playerOne.points-r.playerTwo.points)));
      if(W&&prevMargin>0&&margin>prevMargin)add("record-margin","margin",`A ${margin}-point margin: the biggest season win of this Showdown so far.`);
      const best=Math.max(row.playerOne.points,row.playerTwo.points),prevBest=Math.max(...earlier.flatMap(r=>[r.playerOne.points,r.playerTwo.points]));
      if(best>prevBest&&best>0){const who=ROLES.filter(role=>row[role].points===best);add("record-score","record",who.length===2?`Both managers scored ${best}, the best season score of this Showdown so far.`:`${NAMES[who[0]]}'s ${best} is the best season score of this Showdown so far.`);}
      for(const [key,label] of [["leaguePoints","league points"],["leagueGoals","league goals"]]){
        const top=Math.max(row.playerOne[key],row.playerTwo[key]),prev=Math.max(...earlier.flatMap(r=>[r.playerOne[key],r.playerTwo[key]])),who=ROLES.filter(role=>row[role][key]===top);
        if(top>prev&&who.length===1){const club=plain(clubs)&&typeof clubs[who[0]]==="string"?clubs[who[0]]:null;add(`record-${key}`,"record",`${NAMES[who[0]]}'s ${top} ${label}${club?` with ${club}`:""} are the most by either manager in this Showdown.`);}
      }
    }
    if(s>1){
      if(leader&&leaderBefore!==leader&&!totals.slice(0,s-1).some(pair=>leaderOf(pair)===leader))add("first-lead","overall",`${L} leads the Showdown for the first time, ${after[leader]} to ${after[other(leader)]}.`);
      if(W&&cvRun(rows,s-1,W)===2)add("back-to-back","streak",`Back-to-back season wins for ${NAMES[W]}. Overall: ${both(after.playerOne,after.playerTwo)}.`);
    }
    // Counts.
    const tally=cvTally(rows.slice(0,s));
    if(s>1&&(row.playerOne.trophies>0||row.playerTwo.trophies>0))add("trophy-count","trophy",`Trophies in this Showdown: ${both(tally.trophies.playerOne,tally.trophies.playerTwo)}.`);
    if(s>1)add("season-count","tally",`Seasons won: ${both(tally.playerOne,tally.playerTwo)}${tally.draws?`, with ${count(tally.draws,"draw","draws")}`:""}. Overall: ${both(after.playerOne,after.playerTwo)}.`);
    if(left>0)add("clock","clock",`${seasonsLeft[0].toUpperCase()+seasonsLeft.slice(1)} to go, with up to ${MAX*left} points each still to win. Overall: ${both(after.playerOne,after.playerTwo)}.`);
    return out;
  }

  // ---------- BY THE NUMBERS: the whole Showdown (its last season) ----------
  function finalNumbers(rows,N){
    const totals=cvTotals(rows),end=totals[N-1],W=leaderOf(end),tally=cvTally(rows),out=[],add=(id,topic,text)=>out.push({id,topic,text});
    if(!W){
      // 110 each in a 10-season Showdown: level, and a Golden Showdown for both (the Rule Book's 110 is per manager).
      if(N===10&&end.playerOne===MAX*N)add("final-golden-both","golden",`110 each: both managers won 11 points in every season, a Golden Showdown for both, and the Showdown is drawn.`);
      add("final-level","level",`Level on ${end.playerOne} after ${count(N,"season","seasons")}, so the Showdown is drawn. Seasons won: ${both(tally.playerOne,tally.playerTwo)}.`);
      return out;
    }
    const Lr=other(W),w=NAMES[W],l=NAMES[Lr],score=`${w} ${end[W]}, ${l} ${end[Lr]}`;
    if(N===10&&end[W]===MAX*N)add("final-golden","golden",`110 out of 110 for ${w}: every season won 11 points, the Golden Showdown.`);
    const behind=totals.filter(pair=>pair[W]<pair[Lr]).length;
    if(behind>0)add("final-comeback","comeback",`${w} was behind after ${count(behind,"season","seasons")} of ${N} and still won the Showdown, ${end[W]} to ${end[Lr]}.`);
    if(N>=3&&totals.every(pair=>pair[W]>pair[Lr]))add("final-wire","wire",`${w} led after every one of the ${N} seasons and finishes ${end[W]} to ${end[Lr]}.`);
    if(N>=2){const pre=totals[N-2];if(pre[W]-pre[Lr]<MAX)add("final-late","clock",`${both(pre.playerOne,pre.playerTwo)} with one season left; ${score} at full time.`);}
    if(N>=2)add("final-count","tally",`Full time: ${score}. Seasons won: ${both(tally.playerOne,tally.playerTwo)}${tally.draws?`, with ${count(tally.draws,"draw","draws")}`:""}.`);
    if(N===1)add("final-sprint","tally",`One season, one verdict: ${w} ${end[W]}, ${l} ${end[Lr]}. Trophies: ${both(tally.trophies.playerOne,tally.trophies.playerTwo)}.`);
    return out;
  }

  // ---------- the lead line (COMMENTARY) ----------
  // v2 ranks by how specific a situation is; the booth leads with the biggest story first, then keeps v2's order.
  const LEAD_FIRST=Object.freeze({
    "season-result":Object.freeze(["clock-clinched","clock-dead-rubber","season-perfect","overall-lead-taken","trophy-treble","record-centurion-double","streak-broken","streak-long","clock-final-open"]),
    "final":Object.freeze(["final-golden","final-last-season-swing","final-comeback","final-wire-to-wire","final-drawn","final-sprint"])
  });
  // Career situations need every earlier Showdown; the booth has only this one, so it never claims them. "Led from start to
  // finish" means nothing in a one-season Showdown.
  const NEEDS_CAREER=/^career-/;
  function topicOf(situation){
    if(/^clock-/.test(situation))return "clock";
    if(/^overall-/.test(situation))return "overall";
    if(/^streak-|^unbeaten-run$/.test(situation))return "streak";
    if(/^record-/.test(situation))return "record";
    if(/^trophy-|^both-league-titles$|^both-european$/.test(situation))return "trophy";
    if(/^season-win-by-|^season-shutout$/.test(situation))return "margin";
    if(situation==="final-golden")return "golden";
    if(situation==="final-comeback"||situation==="final-last-season-swing")return "comeback";
    if(situation==="final-wire-to-wire")return "wire";
    if(situation==="final-drawn")return "tally";
    return "other";
  }
  // A 1-0 or 2-0 "shutout" is a quiet season, not a headline: it keeps v2's place only when the winner scored 5 or more.
  function ordered(moment,entries,avoid){
    const first=LEAD_FIRST[moment]||[],quiet=e=>e.situation==="season-shutout"&&!(Number(e.slots.winnerPoints)>=5);
    const rank=e=>{if(quiet(e))return first.length+1;const i=first.indexOf(e.situation);return i<0?first.length:i;};
    return entries.filter(e=>!NEEDS_CAREER.test(e.situation)&&!(e.situation==="final-wire-to-wire"&&Number(e.slots.seasons)<3)).map((e,i)=>({e,i})).sort((x,y)=>(avoid.has(x.e.situation)-avoid.has(y.e.situation))||rank(x.e)-rank(y.e)||x.i-y.i).map(x=>x.e);
  }
  function v2Facts(facts,season){
    const league=typeof facts.league==="string"?facts.league:null,clubs=plain(facts.clubs)?facts.clubs:{};
    return {managers:{playerOne:{name:NAMES.playerOne,club:clubs.playerOne||null,league},playerTwo:{name:NAMES.playerTwo,club:clubs.playerTwo||null,league}},
      seasons:facts.seasons,season,results:facts.history.slice(0,season).map(row=>({...row,teamCount:facts.teamCount}))};
  }
  // Stock lines were written for any number; "1 points" reads wrong on air, so the booth says "1 point".
  function grammar(value){return String(value).replace(/(^|[^\d.])1 (Showdown |league )?points\b/g,"$11 $2point");}
  function linesOf(lines){return Array.isArray(lines)?lines:Array.isArray(lines?.results)?lines.results:[];}

  // One booth call per season: {season, moment, lead:{id,situation,text}|null, numbers:{id,topic,text}|null}.
  // Earlier seasons' lead lines are re-derived first so this season never repeats one (the same on both phones).
  function cvCall(facts,season,lines,memo){
    const E=engine(),rows=cvRows(facts),N=facts?.seasons;
    if(!E||!rows||!int(season,1,rows.length)||!int(facts.teamCount,2,40))return null;
    const used=memo?.used||new Set(),last=season===N,moment=last?"final":"season-result";
    let entries;
    try{entries=last?E.situationsFor("final",{...v2Facts(facts,season),history:[]}):E.situationsFor("season-result",v2Facts(facts,season));}catch(_){return null;}
    const avoid=new Set(memo?.lastSituation?[memo.lastSituation]:[]);
    const picked=E.pick(ordered(moment,entries,avoid),linesOf(lines),E.seedFor(String(facts.showdownId||""),"v3-"+moment,season),used);
    const lead=picked?Object.freeze({...picked,text:grammar(picked.text)}):null;
    const pool=last?finalNumbers(rows.slice(0,N),N):seasonNumbers(rows.slice(0,season),season,N,facts.clubs);
    const leadTopic=lead?topicOf(lead.situation):null;
    const numbers=pool.find(item=>item.topic!==leadTopic)||null;
    return Object.freeze({season,moment,lead,numbers});
  }
  function call(facts,season,lines){
    if(!plain(facts)||!int(season,1,10))return null;
    const used=new Set();let lastSituation=null,result=null;
    for(let s=1;s<=season;s+=1){
      result=cvCall(facts,s,lines,{used,lastSituation});
      if(!result)return null;
      if(result.lead){used.add(result.lead.id);lastSituation=result.lead.situation;}
    }
    return result;
  }

  // ---------- browser: Season Results ----------
  const BAR_ID="commentaryV3Bar";
  let installed=false,scheduled=false,observer=null,assets=null,typing=null;
  function state(name){try{return root[name]?.getState?.()||null;}catch(_){return null;}}
  function cvLiveFacts(){
    const setupState=state("CareerModeProductionSharedShowdownSetup"),setup=setupState?.setup;
    if(!setupState||setupState.ready!==true||setup?.phase!=="SHOWDOWN_CONFIRMED"||!setupState.rivalryId)return null;
    const rivalryId=String(setupState.rivalryId),N=setup.totalSeasons;if(!LENGTHS.includes(N))return null;
    const scoring=state("CareerModeProductionSharedCanonicalScoring");
    if(!scoring||scoring.authoritative!==true||scoring.phase!=="SCORING_RECONCILED"||!int(scoring.seasonNumber,1,N))return null;
    const s=scoring.seasonNumber,commit=state("CareerModeProductionSharedSeasonCommit");
    if(!commit||commit.committed!==true||commit.seasonNumber!==s||!plain(commit.results)||(commit.rivalryId&&String(commit.rivalryId)!==rivalryId))return null;
    const history=state("CareerModeProductionSharedHistoryConvergence"),p=history?.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&String(history.rivalryId)===rivalryId?history.projection:null;
    const accepted=Array.isArray(p?.seasonHistory)?p.seasonHistory:[];
    const rows=[];
    for(let k=1;k<s;k+=1){const row=accepted[k-1];if(!row||row.roundNumber!==k)return null;rows.push(row);}
    const own=accepted[s-1]&&accepted[s-1].roundNumber===s?accepted[s-1]:{playerOne:{...commit.results.playerOne,scoring:scoring.scoring?.playerOne},playerTwo:{...commit.results.playerTwo,scoring:scoring.scoring?.playerTwo},winner:scoring.winner};
    rows.push(own);
    const teams=root.CareerModeSharedShowdownCatalog?.catalog?.[setup.leagueId];
    return {showdownId:rivalryId,seasons:N,league:setup.leagueId,clubs:setup.clubs,teamCount:Array.isArray(teams)?teams.length:null,history:rows,season:s};
  }
  function cvLoadAssets(){
    if(assets)return assets;
    const load=root.loadRuntimeScript,style=root.loadRuntimeStyle;
    if(typeof load!=="function")return Promise.reject(new Error("COMMENTARY_LOADER_UNAVAILABLE"));
    assets=Promise.all([
      typeof style==="function"?style("gazette-content","visual-assets/v10_1/content/content.css").catch(()=>null):null,
      load("commentary-engine","js/commentaryEngine.js",()=>Boolean(root.CareerModeCommentaryEngine)),
      load("commentary-lines","data/commentaryLines.js",()=>Boolean(root.CareerModeCommentaryLines))
    ]).then(()=>true);
    assets.catch(()=>{assets=null;});
    return assets;
  }
  const MIC='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a4 4 0 0 0 4-4V5a4 4 0 1 0-8 0v6a4 4 0 0 0 4 4zm7-4a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-3.08A7 7 0 0 0 19 11z"/></svg>';
  function cvRule(doc){
    if(doc.getElementById("commentaryV3Rule"))return;
    const style=doc.createElement("style");style.id="commentaryV3Rule";
    // Booth layout inside Team V's bar: lead line + a smaller gold BY THE NUMBERS line. In flow, never on top of anything.
    style.textContent=`
#${BAR_ID}{display:block;margin:14px 0 2px;pointer-events:none;user-select:text}
#${BAR_ID} .cmx-bar{margin-top:18px}
#${BAR_ID} .cmx-bar__slab{flex-direction:column;align-items:stretch;justify-content:center;gap:5px;padding:10px 44px 10px 30px}
#${BAR_ID} .cmv3-line{position:relative;margin:0}
#${BAR_ID} .cmv3-lead{color:#f6f2e8;font:600 18px/1.22 var(--sd-font-condensed,"Barlow Condensed","Arial Narrow",sans-serif);letter-spacing:.015em;text-shadow:0 1px 2px rgba(0,0,0,.9);text-wrap:pretty}
#${BAR_ID} .cmv3-numbers{color:#ffd34d;font:600 13px/1.25 var(--sd-font-condensed,"Barlow Condensed","Arial Narrow",sans-serif);letter-spacing:.03em;text-wrap:pretty}
#${BAR_ID} .cmv3-numbers b{display:inline-block;margin-right:7px;padding:1px 6px 0;background:#e0ae3a;color:#07080a;font-weight:700;font-size:10px;letter-spacing:.18em;line-height:15px;vertical-align:1px}
#${BAR_ID} .cmv3-ghost{color:transparent;text-shadow:none}
#${BAR_ID} .cmv3-typed{position:absolute;inset:0}
#${BAR_ID} .cmv3-numbers.is-waiting{opacity:0}
#${BAR_ID} .cmv3-numbers.is-in{transition:opacity .45s ease}
/* Desktop: the bar sits beside the score lines in the same box, so the box barely grows and CONTINUE stays on the first view. */
@media (min-width:901px){
  #sharedCanonicalScoringPanel.cmv3-has{display:grid;grid-template-columns:fit-content(56%) minmax(0,1fr);grid-template-rows:auto auto auto auto 1fr;column-gap:16px}
  #sharedCanonicalScoringPanel.cmv3-has>:not(#${BAR_ID}){grid-column:1}
  #sharedCanonicalScoringPanel.cmv3-has>#${BAR_ID}{grid-column:2;grid-row:1/span 5;align-self:center;margin:0}
  #sharedCanonicalScoringPanel.cmv3-has>#${BAR_ID} .cmx-bar{margin-top:0;min-height:0}
  #sharedCanonicalScoringPanel.cmv3-has>#${BAR_ID} .cmx-bar__tab{display:none}
  #sharedCanonicalScoringPanel.cmv3-has>#${BAR_ID} .cmx-bar__accent{width:46px}
  #sharedCanonicalScoringPanel.cmv3-has>#${BAR_ID} .cmx-bar__accent svg{width:18px;height:18px;margin-right:8px}
  #sharedCanonicalScoringPanel.cmv3-has>#${BAR_ID} .cmx-bar__slab{padding:7px 34px 7px 24px;gap:3px}
  #sharedCanonicalScoringPanel.cmv3-has>#${BAR_ID} .cmx-bar__end{width:30px;clip-path:polygon(20px 0,100% 0,100% 100%,0 100%)}
  #${BAR_ID} .cmv3-lead{font-size:15px;line-height:1.18}
  #${BAR_ID} .cmv3-numbers{font-size:12px;line-height:1.2}
}
@media (max-width:600px){
  #${BAR_ID}{margin:10px 0 0}
  #${BAR_ID} .cmx-bar{margin-top:0}
  #${BAR_ID} .cmx-bar__slab{padding:8px 26px 8px 20px;gap:4px}
  #${BAR_ID} .cmv3-lead{font-size:15px;line-height:1.2}
  #${BAR_ID} .cmv3-numbers{font-size:12px}
}
@media (prefers-reduced-motion:reduce){#${BAR_ID} .cmx-bar.is-in{animation:none}#${BAR_ID} .cmv3-numbers.is-in{transition:none}}
`;
    doc.head.appendChild(style);
  }
  function text(doc,tag,cls,value){const el=doc.createElement(tag);el.className=cls;if(value!==undefined)el.textContent=value;return el;}
  function cvBuildBar(doc,result){
    const wrap=doc.createElement("div");wrap.id=BAR_ID;wrap.className="cmx cmv3";wrap.setAttribute("role","note");wrap.setAttribute("aria-label","Commentary");
    const bar=text(doc,"div","cmx-bar is-in");
    bar.appendChild(text(doc,"span","cmx-bar__tab",result.moment==="final"?"FULL TIME":"COMMENTARY"));
    const accent=text(doc,"span","cmx-bar__accent");accent.innerHTML=MIC;bar.appendChild(accent);
    const slab=text(doc,"div","cmx-bar__slab");
    let typed=null;
    if(result.lead){
      const lead=text(doc,"div","cmv3-line cmv3-lead");
      // The full line is laid out once (transparent) so typing never moves anything, and screen readers read it whole.
      lead.appendChild(text(doc,"span","cmv3-ghost",result.lead.text));
      typed=text(doc,"span","cmv3-typed");typed.setAttribute("aria-hidden","true");lead.appendChild(typed);
      slab.appendChild(lead);
    }
    let numbers=null;
    if(result.numbers){numbers=text(doc,"div","cmv3-line cmv3-numbers");numbers.appendChild(text(doc,"b","",result.moment==="final"?"THE SHOWDOWN":"BY THE NUMBERS"));numbers.appendChild(doc.createTextNode(result.numbers.text));slab.appendChild(numbers);}
    bar.appendChild(slab);bar.appendChild(text(doc,"span","cmx-bar__end"));wrap.appendChild(bar);
    return {wrap,typed,numbers,full:result.lead?.text||""};
  }
  function cvStopTyping(){if(typing){root.clearInterval?.(typing);typing=null;}}
  function cvPlay(parts){
    cvStopTyping();
    const reduce=root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const finish=()=>{if(parts.typed){parts.typed.textContent=parts.full;}if(parts.numbers){parts.numbers.classList.remove("is-waiting");parts.numbers.classList.add("is-in");}};
    if(reduce||!parts.typed||typeof root.setInterval!=="function"){finish();return;}
    if(parts.numbers)parts.numbers.classList.add("is-waiting");
    let shown=0;const step=Math.max(1,Math.round(parts.full.length/70));
    typing=root.setInterval(()=>{shown=Math.min(parts.full.length,shown+step);parts.typed.textContent=parts.full.slice(0,shown);if(shown>=parts.full.length){cvStopTyping();finish();}},24);
  }
  function cvRemove(){cvStopTyping();const bar=root.document?.getElementById(BAR_ID);if(bar){bar.parentNode?.classList?.remove("cmv3-has");bar.remove();}}
  // Final Winner (lead request 2026-10-31): Team V's stage fills the window and has no free slot, so the Showdown verdict
  // sits BELOW the stage in the page flow (main scrolls to it). Nothing on the stage moves or is covered. Facts come from the
  // same verified history Final Winner itself was drawn from (CareerModeSeasonFinalV10.gazetteHistory), checked against the
  // totals the stage shows.
  const FINAL_ID="commentaryV3Final";
  function cvFinalFacts(){
    const host=root.document?.getElementById("seasonEntry");
    if(!host||host.classList.contains("hidden")||!host.classList.contains("v10FinalMode")||!host.querySelector(".v10FinalStage"))return null;
    const history=root.CareerModeSeasonFinalV10?.gazetteHistory?.(),p=history?.projection;
    if(!p||!Array.isArray(p.seasonHistory)||!LENGTHS.includes(p.totalSeasons)||p.seasonHistory.length!==p.totalSeasons)return null;
    if(p.seasonHistory.some((row,i)=>row?.roundNumber!==i+1))return null;
    const frame=root.FINAL_WINNER_FIXTURES?.frames?.LIVE;
    let a=0,b=0;for(const row of p.seasonHistory){a+=row.playerOne?.scoring?.total;b+=row.playerTwo?.scoring?.total;}
    if(!frame||frame.totals?.daniel!==a||frame.totals?.nik!==b)return null;
    const teams=root.CareerModeSharedShowdownCatalog?.catalog?.[p.leagueId];
    return {showdownId:String(p.rivalryId||history.rivalryId||""),seasons:p.totalSeasons,league:p.leagueId,clubs:{playerOne:p.managerRecords?.playerOne?.club,playerTwo:p.managerRecords?.playerTwo?.club},
      teamCount:Array.isArray(teams)?teams.length:null,history:p.seasonHistory,season:p.totalSeasons};
  }
  function cvFinalRule(doc){
    if(doc.getElementById("commentaryV3FinalRule"))return;
    const style=doc.createElement("style");style.id="commentaryV3FinalRule";
    style.textContent=`
#${FINAL_ID}{display:block;box-sizing:border-box;width:min(1040px,100%);margin:0 auto;padding:22px 16px 28px;pointer-events:none;user-select:text}
#${FINAL_ID} .cmx-bar__slab{flex-direction:column;align-items:stretch;justify-content:center;gap:5px;padding:10px 44px 10px 30px}
#${FINAL_ID} .cmv3-line{position:relative;margin:0}
#${FINAL_ID} .cmv3-lead{color:#f6f2e8;font:600 18px/1.22 var(--sd-font-condensed,"Barlow Condensed","Arial Narrow",sans-serif);letter-spacing:.015em;text-shadow:0 1px 2px rgba(0,0,0,.9);text-wrap:pretty}
#${FINAL_ID} .cmv3-numbers{color:#ffd34d;font:600 13px/1.25 var(--sd-font-condensed,"Barlow Condensed","Arial Narrow",sans-serif);letter-spacing:.03em;text-wrap:pretty}
#${FINAL_ID} .cmv3-numbers b{display:inline-block;margin-right:7px;padding:1px 6px 0;background:#e0ae3a;color:#07080a;font-weight:700;font-size:10px;letter-spacing:.18em;line-height:15px;vertical-align:1px}
#${FINAL_ID} .cmv3-ghost{color:transparent;text-shadow:none}
#${FINAL_ID} .cmv3-typed{position:absolute;inset:0}
@media (max-width:600px){
  #${FINAL_ID}{padding:16px 16px 22px}
  #${FINAL_ID} .cmx-bar{margin-top:0}
  #${FINAL_ID} .cmx-bar__slab{padding:8px 26px 8px 20px;gap:4px}
  #${FINAL_ID} .cmv3-lead{font-size:15px;line-height:1.2}
  #${FINAL_ID} .cmv3-numbers{font-size:12px}
}
@media (prefers-reduced-motion:reduce){#${FINAL_ID} .cmx-bar.is-in{animation:none}}
`;
    doc.head.appendChild(style);
  }
  function cvRemoveFinal(){root.document?.getElementById(FINAL_ID)?.remove();}
  function cvRenderFinal(doc){
    const facts=cvFinalFacts();if(!facts||!facts.teamCount){cvRemoveFinal();return;}
    const key=`${facts.showdownId}|final|${facts.history.map(r=>`${r.playerOne?.scoring?.total}-${r.playerTwo?.scoring?.total}`).join(",")}`;
    const host=doc.getElementById("seasonEntry"),existing=doc.getElementById(FINAL_ID);
    if(existing&&existing.dataset.key===key&&existing.previousElementSibling===host)return;
    if(!root.CareerModeCommentaryEngine||!root.CareerModeCommentaryLines){cvLoadAssets().then(cvSchedule,()=>{});return;}
    const result=call(facts,facts.season,root.CareerModeCommentaryLines);
    cvRemoveFinal();if(!result||(!result.lead&&!result.numbers))return;
    cvRule(doc);cvFinalRule(doc);
    const parts=cvBuildBar(doc,result);parts.wrap.id=FINAL_ID;parts.wrap.dataset.key=key;
    host.after(parts.wrap);
    // Below the stage it is read after a scroll, so it is shown whole (no typing).
    if(parts.typed)parts.typed.textContent=parts.full;if(parts.numbers)parts.numbers.classList.add("is-in");
  }
  function cvRender(){
    const doc=root.document;if(!doc)return;
    const finalMode=doc.getElementById("seasonEntry")?.classList.contains("v10FinalMode")&&root.getActiveScreenName?.()==="seasonEntry";
    if(finalMode){cvRemove();cvRenderFinal(doc);return;}
    cvRemoveFinal();
    const panel=doc.getElementById("sharedCanonicalScoringPanel"),winner=doc.getElementById("sharedCanonicalScoringWinner");
    if(!panel||!winner||panel.classList.contains("hidden")||panel.hidden){cvRemove();return;}
    const facts=cvLiveFacts();if(!facts||!facts.teamCount){cvRemove();return;}
    const key=`${facts.showdownId}|${facts.season}|${facts.history.map(r=>`${r.playerOne?.scoring?.total}-${r.playerTwo?.scoring?.total}`).join(",")}`;
    const existing=doc.getElementById(BAR_ID);
    if(existing&&existing.dataset.key===key&&existing.parentNode===panel)return;
    if(!root.CareerModeCommentaryEngine||!root.CareerModeCommentaryLines){cvLoadAssets().then(cvSchedule,()=>{});return;}
    const result=call(facts,facts.season,root.CareerModeCommentaryLines);
    if(!result||(!result.lead&&!result.numbers)){cvRemove();return;}
    cvRemove();cvRule(doc);
    const parts=cvBuildBar(doc,result);parts.wrap.dataset.key=key;
    panel.appendChild(parts.wrap);panel.classList.add("cmv3-has");
    cvPlay(parts);
  }
  function cvSchedule(){if(scheduled)return;scheduled=true;root.setTimeout(()=>{scheduled=false;try{cvRender();}catch(error){root.console?.warn?.("[Career Mode Showdown] Commentary unavailable.",error);cvRemove();}},0);}
  function cvWatch(){
    if(observer||typeof root.MutationObserver!=="function")return;
    const host=root.document?.getElementById("seasonEntry");if(!host)return;
    observer=new root.MutationObserver(list=>{const bar=root.document.getElementById(BAR_ID);if(list.every(m=>bar&&bar.contains(m.target)))return;cvSchedule();});
    observer.observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:["class","hidden"]});
  }
  function cvInstall(){
    if(installed)return true;installed=true;
    for(const e of ["career-mode-shared-history-convergence-state-change","career-mode-shared-canonical-scoring-state-change","career-mode-shared-season-commit-state-change"])root.addEventListener?.(e,cvSchedule);
    root.document?.addEventListener?.("career-mode-screen-shown",()=>{cvWatch();if(root.getActiveScreenName?.()==="seasonEntry")cvLoadAssets().then(cvSchedule,()=>{});else{cvRemove();cvRemoveFinal();}});
    cvWatch();cvSchedule();
    return true;
  }

  return Object.freeze({contractVersion:3,feature:"cms-commentary-v3",names:NAMES,leadFirst:LEAD_FIRST,call,seasonNumbers:(facts,season)=>{const rows=cvRows(facts);return rows&&int(season,1,rows.length)?seasonNumbers(rows.slice(0,season),season,facts.seasons,facts.clubs):null;},
    finalNumbers:facts=>{const rows=cvRows(facts);return rows&&rows.length===facts.seasons?finalNumbers(rows,facts.seasons):null;},topicOf,install:cvInstall,_liveFacts:cvLiveFacts,_render:cvRender,_finalFacts:cvFinalFacts});
});
