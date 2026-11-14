(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCommentaryV3=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // Commentary v3 (r87) adds to v2 (js/commentaryEngine.js, one stock line for the most specific true situation) a two-voice booth: the COMMENTARY line (a checked v2 line) tells the story; the BY THE NUMBERS line is built here from the Showdown's own numbers (exact decider maths, lead changes, streaks, Showdown records, trophy and season counts).
  // The lead line follows the season's biggest story and the numbers line never repeats its topic. No line repeats in a Showdown: earlier seasons' lines are re-derived from the same verified history (nothing stored), so both phones show the same words. The last season's bar carries the Showdown verdict (comeback, wire to wire, Golden Showdown, drawn).
  // Printed in the Touchline Gazette (r91, "From the commentary box": each season paper carries its season's call, the final paper the Showdown's), built from the converged Shared History the paper is built from. Pure: no Firebase read, write or storage, no DOM.
  // Rules: a season is 0 to 11 Showdown points (0 to 15 in a Showdown that plays r87 Prime Pack: 11 + up to 4); equal points is a draw (no tiebreak: league position, league points and goals never decide anything between the two managers).

  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const LENGTHS=Object.freeze([1,3,5,10]);
  const PACK_MAX=15;
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

  // ---------- the season maximum ----------
  // GC-01 (consistency check 2026-11-01): every "decided", "draw-only", "points still to win", "final-late" and Golden line
  // uses this Showdown's own season maximum, the same rule as js/commentaryEngine.js and js/careerScreenSeam.js: 15 in a
  // Showdown that plays Prime Pack, 11 before it. facts.primePack (true/false) decides when given; otherwise a season over 11
  // or with Prime Pack points can only be Prime Pack, and the career seam (when loaded) knows the live Showdown's boundary.
  // Nik 2026-11-01 18:32 UTC: one season maximum, 15, in every Showdown (no 11 anywhere).
  function cvSeasonMax(_facts){return PACK_MAX;}

  // ---------- facts ----------
  // facts = {showdownId, seasons (1|3|5|10), clubs:{playerOne,playerTwo}, league, teamCount, history:[row...]}
  // row = one accepted season as Shared History stores it: {playerOne:{leaguePosition, leaguePoints, leagueGoals,
  // championsLeague, europaLeague?, domesticCup, topScorer, topAssist, scoring:{total,...}}, playerTwo:{...}, winner}.
  function cvRows(facts){
    if(!plain(facts)||!LENGTHS.includes(facts.seasons)||!Array.isArray(facts.history))return null;
    if(facts.history.length<1||facts.history.length>facts.seasons)return null;
    const rows=[],max=cvSeasonMax(facts);
    for(const row of facts.history){
      if(!plain(row))return null;
      const out={};
      for(const role of ROLES){
        const r=row[role],total=r?.scoring?.total;
        if(!plain(r)||!int(total,0,max)||!int(r.leaguePosition,1,40)||!int(r.leaguePoints,0,200)||!int(r.leagueGoals,0,300))return null;
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
  function seasonNumbers(rows,s,N,clubs,MAX){
    const totals=cvTotals(rows),row=rows[s-1],after=totals[s-1],before=s>1?totals[s-2]:{playerOne:0,playerTwo:0};
    const left=N-s,leader=leaderOf(after),gap=leader?after[leader]-after[other(leader)]:0,W=row.winner==="draw"?null:row.winner;
    const L=leader?NAMES[leader]:null,T=leader?NAMES[other(leader)]:null,out=[],add=(id,topic,text)=>out.push({id,topic,text});
    const seasonsLeft=count(left,"season","seasons");
    // The clock: what is still possible. Most a season can swing the gap is the season maximum (11 to 0, or 15 to 0 with Prime Pack).
    if(leader&&left>0&&gap>MAX*left)add("decided","clock",`${L} leads by ${gap} with ${seasonsLeft} to play, and the most ${T} can win back is ${MAX*left}. The Showdown is decided.`);
    else if(leader&&left>0&&gap===MAX*left)add("draw-only","clock",`${T} can no longer win it. The best left is a level Showdown, and only by winning ${left===1?"the last season":"every season left"} ${MAX} to 0.`);
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
    // Seasons won never sits beside level totals: it would read as a tiebreak (there is none).
    if(s>1&&after.playerOne!==after.playerTwo)add("season-count","tally",`Seasons won: ${both(tally.playerOne,tally.playerTwo)}${tally.draws?`, with ${count(tally.draws,"draw","draws")}`:""}. Overall: ${both(after.playerOne,after.playerTwo)}.`);
    if(left>0)add("clock","clock",`${seasonsLeft[0].toUpperCase()+seasonsLeft.slice(1)} to go, with up to ${MAX*left} points each still to win. Overall: ${both(after.playerOne,after.playerTwo)}.`);
    return out;
  }

  // ---------- BY THE NUMBERS: the whole Showdown (its last season) ----------
  function finalNumbers(rows,N,MAX){
    const totals=cvTotals(rows),end=totals[N-1],W=leaderOf(end),tally=cvTally(rows),out=[],add=(id,topic,text)=>out.push({id,topic,text});
    if(!W){
      // 150 each in a 10-season Showdown: level, and a Golden Showdown for both (the Rule Book's total is per manager).
      if(N===10&&end.playerOne===MAX*N)add("final-golden-both","golden",`${MAX*N} each: both managers won ${MAX} points in every season, a Golden Showdown for both, and the Showdown is drawn.`);
      add("final-level","level",`Level on ${end.playerOne} after ${count(N,"season","seasons")}, so the Showdown is drawn.`);
      return out;
    }
    const Lr=other(W),w=NAMES[W],l=NAMES[Lr],score=`${w} ${end[W]}, ${l} ${end[Lr]}`;
    if(N===10&&end[W]===MAX*N)add("final-golden","golden",`${MAX*N} out of ${MAX*N} for ${w}: every season won ${MAX} points, the Golden Showdown.`);
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
      seasons:facts.seasons,season,primePack:cvSeasonMax(facts)===PACK_MAX,results:facts.history.slice(0,season).map(row=>({...row,teamCount:facts.teamCount}))};
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
    const max=cvSeasonMax(facts),pool=last?finalNumbers(rows.slice(0,N),N,max):seasonNumbers(rows.slice(0,season),season,N,facts.clubs,max);
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

  // ---------- a Showdown that ended early (r89 Sacked) ----------
  // r91 (Nik 2026-11-11 picked the commentary in the Touchline Gazette): a sacking ends the Showdown after `played` of its
  // planned seasons. The stock final lines speak of "the N-season Showdown" and "one season left", which a sacked Showdown
  // never had, so its paper gets this numbers line only, true for a Showdown that stopped early. Drawn: no "Seasons won".
  function sackedNumbers(facts){
    const rows=cvRows(facts);if(!rows)return null;
    const n=rows.length,N=facts.seasons,end=cvTotals(rows)[n-1],W=leaderOf(end),tally=cvTally(rows);
    if(!W)return Object.freeze({id:"final-sacked-level",topic:"level",text:`Level on ${end.playerOne} after ${n} of ${N} seasons, so the Showdown is drawn.`});
    const Lr=other(W);
    return Object.freeze({id:"final-sacked",topic:"tally",text:`Full time after ${n} of ${N} seasons: ${NAMES[W]} ${end[W]}, ${NAMES[Lr]} ${end[Lr]}. Seasons won: ${both(tally.playerOne,tally.playerTwo)}${tally.draws?`, with ${count(tally.draws,"draw","draws")}`:""}.`});
  }

  // r91: the booth's words print in the Touchline Gazette ("From the commentary box", js/touchlineGazette.js), which builds
  // them from the same verified history on both phones. The Season Results bar and the FULL TIME bar under Final Winner are
  // gone (Nik picked the paper over an on-screen box: the bar crowded the SEASON SCORE box and FULL TIME sat off screen).
  return Object.freeze({contractVersion:4,feature:"cms-commentary-v3",names:NAMES,leadFirst:LEAD_FIRST,call,seasonNumbers:(facts,season)=>{const rows=cvRows(facts);return rows&&int(season,1,rows.length)?seasonNumbers(rows.slice(0,season),season,facts.seasons,facts.clubs,cvSeasonMax(facts)):null;},
    finalNumbers:facts=>{const rows=cvRows(facts);return rows&&rows.length===facts.seasons?finalNumbers(rows,facts.seasons,cvSeasonMax(facts)):null;},topicOf,sackedNumbers});
});
