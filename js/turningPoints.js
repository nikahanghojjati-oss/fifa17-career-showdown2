(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTurningPoints=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // r100 Phoenix (B5, Turning Points): the three moments that decided a finished Showdown, shown on Final Winner.
  // A pure function over the verified shared history the Final Winner already holds (js/seasonFinalV10.js finalFrame):
  // no read, no write, no clock, no randomness. Both phones hold the same history, so both print the same lines.
  // Every line carries its facts, and tests/contracts/r100-turning-points-contracts.cjs recomputes each fact from the
  // record on its own (commentary rule: every line matches what happened). Equal points is a draw: a level Showdown is
  // told as level, and no line names a winner of it (no tiebreak anywhere). If anything does not add up, the answer is
  // null and Final Winner is drawn exactly as before.
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const OTHER=Object.freeze({playerOne:"playerTwo",playerTwo:"playerOne"});
  // The season items a manager can score, largest first where values tie (canonical breakdown keys, js/sharedCanonicalScoring.js).
  const ITEMS=Object.freeze([
    ["championsLeague","Champions League"],["europaLeague","Europa League"],["primePack","Prime Pack"],["leagueTitle","league title"],
    ["domesticCup","domestic cup"],["performanceBonus","performance bonus"],["individualAwardsBonus","awards bonus"]
  ]);
  const MAX_LINES=3;
  const int=x=>Number.isInteger(x);
  const plural=(n,word)=>`${n} ${word}${n===1?"":"s"}`;
  const freeze=x=>{if(x&&typeof x==="object"&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};

  // The finished record, read only. Returns null for anything that is not a complete, consistent history.
  function readRecord(projection){
    const list=projection?.seasonHistory;
    if(!Array.isArray(list)||!list.length||!int(projection.totalSeasons)||list.length>projection.totalSeasons)return null;
    const seasons=[];
    for(let i=0;i<list.length;i+=1){
      const s=list[i];if(!s||s.roundNumber!==i+1)return null;
      const row={season:i+1,points:{},items:{},sacked:{}};
      for(const role of ROLES){
        const sc=s[role]?.scoring;if(!sc||!int(sc.total)||sc.total<0||sc.total>15)return null;
        let sum=0;const items={};
        for(const [key] of ITEMS){const v=sc[key]===undefined?0:sc[key];if(!int(v)||v<0)return null;items[key]=v;sum+=v;}
        if(sum!==sc.total)return null;
        row.points[role]=sc.total;row.items[role]=items;row.sacked[role]=s[role].sacked===true;
      }
      const a=row.points.playerOne,b=row.points.playerTwo,expected=a>b?"playerOne":b>a?"playerTwo":"draw";
      if(s.winner!==expected)return null;
      row.winner=expected;seasons.push(row);
    }
    // A sacked season is always the last one (js/sharedHistoryConvergence.js sackedBeforeLast).
    if(seasons.slice(0,-1).some(r=>r.sacked.playerOne||r.sacked.playerTwo))return null;
    const totals={playerOne:0,playerTwo:0};
    for(const r of seasons){totals.playerOne+=r.points.playerOne;totals.playerTwo+=r.points.playerTwo;}
    const last=seasons[seasons.length-1],sackedEnd=last.sacked.playerOne||last.sacked.playerTwo;
    // Finished means every planned season was played, or a sacking ended it.
    if(!sackedEnd&&seasons.length!==projection.totalSeasons)return null;
    return {seasons,totals,totalSeasons:projection.totalSeasons,played:seasons.length,sackedEnd,
      winner:totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":"draw",
      margin:Math.abs(totals.playerOne-totals.playerTwo)};
  }

  // Running lead after each season, seen from one manager (positive = that manager ahead).
  function runningLead(rec,role){let lead=0;return rec.seasons.map(r=>(lead+=r.points[role]-r.points[OTHER[role]]));}
  function leaderAfter(lead){return lead>0?1:lead<0?-1:0;}

  // ---- candidate lines, each with the facts it was printed from ----
  function sackedLine(rec){
    if(!rec.sackedEnd)return null;
    const last=rec.seasons[rec.played-1],who=ROLES.filter(r=>last.sacked[r]);
    const names=who.length===2?"Daniel and Nik were both":`${NAMES[who[0]]} was`;
    const tail=rec.winner==="draw"?`with the points level at ${rec.totals.playerOne} each`:`with ${NAMES[rec.winner]} ${plural(rec.margin,"point")} ahead`;
    return {kind:"sacked-end",season:last.season,facts:{sacked:who,winner:rec.winner,margin:rec.margin,level:rec.winner==="draw"?rec.totals.playerOne:null},
      text:`${names} sacked, so the Showdown ended there, ${tail}.`};
  }
  function goldenLine(rec){
    if(rec.totalSeasons!==10||rec.played!==10)return null;
    const who=ROLES.filter(r=>rec.seasons.every(s=>s.points[r]===15));if(!who.length)return null;
    const names=who.length===2?"Daniel and Nik both":NAMES[who[0]];
    return {kind:"golden",season:null,facts:{managers:who},text:`${names} scored 15 in all 10 seasons: a Golden Showdown.`};
  }
  const rank=(x,margin)=>[x.value===margin?1:0,x.value,x.season];
  // true when rank a sorts before rank b (b is the better pick)
  function before(a,b){for(let i=0;i<a.length;i+=1){if(a[i]!==b[i])return a[i]<b[i];}return false;}
  // One item the winner scored in one season that the other manager did not, worth at least the whole final margin.
  function marginItemLine(rec){
    if(rec.winner==="draw")return null;
    const w=rec.winner,l=OTHER[w];let best=null;
    for(const r of rec.seasons){
      for(const [key,label] of ITEMS){
        const v=r.items[w][key];if(!(v>0)||r.items[l][key]>0||v<rec.margin)continue;
        const c={season:r.season,key,label,value:v};
        // the exact margin first, then the bigger item, then the later season
        if(!best||before(rank(best,rec.margin),rank(c,rec.margin)))best=c;
      }
    }
    if(!best)return null;
    const whole=best.value===rec.margin;
    return {kind:"margin-item",season:best.season,facts:{manager:w,item:best.key,value:best.value,margin:rec.margin,whole},
      text:whole?`${NAMES[w]}'s ${best.label} +${best.value} was the whole margin.`:`${NAMES[w]}'s ${best.label} +${best.value} was more than the ${rec.margin}-point margin.`};
  }
  // When no single item covers the margin: the two biggest items the winner scored in one season that the other did not,
  // together worth at least the whole margin.
  function marginPairLine(rec){
    if(rec.winner==="draw"||marginItemLine(rec))return null;
    const w=rec.winner,l=OTHER[w];let best=null;
    for(const r of rec.seasons){
      const own=ITEMS.filter(([key])=>r.items[w][key]>0&&!(r.items[l][key]>0)).map(([key,label])=>({key,label,value:r.items[w][key]}))
        .sort((a,b)=>b.value-a.value).slice(0,2);
      if(own.length!==2||own[0].value+own[1].value<rec.margin)continue;
      const c={season:r.season,items:own,value:own[0].value+own[1].value};
      if(!best||before(rank(best,rec.margin),rank(c,rec.margin)))best=c;
    }
    if(!best)return null;
    const whole=best.value===rec.margin,[a,b]=best.items;
    return {kind:"margin-pair",season:best.season,facts:{manager:w,items:[a.key,b.key],values:[a.value,b.value],margin:rec.margin,whole},
      text:`${NAMES[w]}'s ${a.label} +${a.value} and ${b.label} +${b.value} were ${whole?"the whole margin":`more than the ${rec.margin}-point margin`}.`};
  }
  // Prime Pack points across the Showdown, when the winner's extra Prime Pack points cover the whole margin.
  function primePackLine(rec){
    if(rec.winner==="draw")return null;
    const w=rec.winner,l=OTHER[w],pw=rec.seasons.reduce((n,r)=>n+r.items[w].primePack,0),pl=rec.seasons.reduce((n,r)=>n+r.items[l].primePack,0);
    if(pw-pl<rec.margin||pw<=pl)return null;
    return {kind:"prime-pack",season:null,facts:{manager:w,own:pw,other:pl,margin:rec.margin},
      text:`Prime Pack points made the difference: ${NAMES[w]} ${pw}, ${NAMES[l]} ${pl}.`};
  }
  // The season the winner went ahead for good (multi-season Showdowns only).
  function leadLine(rec){
    if(rec.winner==="draw"||rec.played<2)return null;
    const w=rec.winner,lead=runningLead(rec,w);let from=rec.played;
    while(from>1&&lead[from-2]>0)from-=1;
    const before=from>1?lead[from-2]:0,worst=Math.min(0,...lead);
    if(from===1)return {kind:"led-throughout",season:1,facts:{manager:w,from:1},text:`${NAMES[w]} led from Season 1 to the end.`};
    if(before<0)return {kind:"comeback",season:from,facts:{manager:w,from,behind:-before,worst:-worst},
      text:`${NAMES[w]} came from ${plural(-before,"point")} down and led from there to the end.`};
    return {kind:"went-ahead",season:from,facts:{manager:w,from},text:`Level going in, ${NAMES[w]} went ahead and stayed there.`};
  }
  // The biggest season gap (only when one season stands alone as the biggest).
  function swingLine(rec){
    const gaps=rec.seasons.map(r=>Math.abs(r.points.playerOne-r.points.playerTwo)),top=Math.max(...gaps);
    if(top<=0||gaps.filter(g=>g===top).length!==1)return null;
    const r=rec.seasons[gaps.indexOf(top)],w=r.winner,score=`${r.points[w]}-${r.points[OTHER[w]]}`;
    if(rec.played===1)return {kind:"season-score",season:r.season,facts:{manager:w,own:r.points[w],other:r.points[OTHER[w]]},text:`${NAMES[w]} took it ${score}.`};
    return {kind:"biggest-swing",season:r.season,facts:{manager:w,own:r.points[w],other:r.points[OTHER[w]],gap:top},
      text:`${NAMES[w]}'s ${score} was the biggest gap of any season.`};
  }
  // A level Showdown: the season that made it level at the end.
  function levellerLine(rec){
    if(rec.winner!=="draw"||rec.played<2)return null;
    const lead=runningLead(rec,"playerOne"),before=lead[rec.played-2];if(before===0)return null;
    const behind=before<0?"playerOne":"playerTwo",r=rec.seasons[rec.played-1];
    return {kind:"leveller",season:r.season,facts:{manager:behind,behind:Math.abs(before),own:r.points[behind],other:r.points[OTHER[behind]]},
      text:`${NAMES[behind]}'s ${r.points[behind]}-${r.points[OTHER[behind]]} closed the ${Math.abs(before)}-point gap to level it.`};
  }
  function levelLine(rec){
    if(rec.winner!=="draw")return null;
    return {kind:"level",season:null,facts:{points:rec.totals.playerOne,played:rec.played},
      text:`Level at ${plural(rec.totals.playerOne,"point")} each after ${plural(rec.played,"season")}: a draw.`};
  }
  // How often the lead changed hands (from one manager straight or through level to the other).
  function leadChangesLine(rec){
    if(rec.played<3)return null;
    let last=0,changes=0;for(const lead of runningLead(rec,"playerOne")){const now=leaderAfter(lead);if(now!==0){if(last!==0&&now!==last)changes+=1;last=now;}}
    if(changes<2)return null;
    return {kind:"lead-changes",season:null,facts:{changes},text:`The lead changed hands ${changes} times.`};
  }
  // The winner won fewer seasons than the loser but more points (never for a draw: no "seasons won" on a drawn result).
  function seasonsLine(rec){
    if(rec.winner==="draw"||rec.played<2)return null;
    const w=rec.winner,l=OTHER[w],ww=rec.seasons.filter(r=>r.winner===w).length,lw=rec.seasons.filter(r=>r.winner===l).length;
    if(lw>ww)return {kind:"fewer-seasons",season:null,facts:{manager:w,own:ww,other:lw},text:`${NAMES[l]} won more seasons, ${lw} to ${ww}, but ${NAMES[w]} scored more points.`};
    if(ww>=2)return {kind:"season-wins",season:null,facts:{manager:w,own:ww,played:rec.played},text:`${NAMES[w]} won ${ww} of the ${rec.played} seasons.`};
    return null;
  }
  function trophiesLine(rec){
    const count=role=>rec.seasons.reduce((n,r)=>n+(r.items[role].championsLeague>0?1:0)+(r.items[role].europaLeague>0?1:0)+(r.items[role].leagueTitle>0?1:0)+(r.items[role].domesticCup>0?1:0),0);
    const a=count("playerOne"),b=count("playerTwo");if(a===0&&b===0)return null;
    return {kind:"trophies",season:null,facts:{playerOne:a,playerTwo:b},text:`Trophies: Daniel ${a}, Nik ${b}.`};
  }

  const ORDER_DECIDED=[sackedLine,goldenLine,marginItemLine,marginPairLine,primePackLine,leadLine,swingLine,seasonsLine,leadChangesLine,trophiesLine];
  const ORDER_LEVEL=[levelLine,sackedLine,goldenLine,levellerLine,swingLine,leadChangesLine,trophiesLine];

  // projection: the verified shared history (HISTORY_CONVERGED projection). final (optional): {totals:{daniel,nik}} as the
  // Final Winner frame holds them; when given, the record must add up to exactly those totals or nothing is printed.
  function turningPoints(projection,final=null){
    const rec=readRecord(projection);if(!rec)return null;
    if(final&&(final.totals?.daniel!==rec.totals.playerOne||final.totals?.nik!==rec.totals.playerTwo))return null;
    const picked=[],seen=new Set(),spare=[];
    for(const make of rec.winner==="draw"?ORDER_LEVEL:ORDER_DECIDED){
      const line=make(rec);if(!line)continue;
      // A season gap line about a season another line already told waits as a spare (three different moments first).
      if((line.kind==="biggest-swing"||line.kind==="season-score")&&seen.has(line.season)){spare.push(line);continue;}
      if(picked.length<MAX_LINES){picked.push(line);if(line.season!==null)seen.add(line.season);}
    }
    for(const line of spare){if(picked.length>=MAX_LINES)break;picked.push(line);}
    if(!picked.length)return null;
    return freeze({winner:rec.winner==="draw"?"draw":NAMES[rec.winner].toLowerCase(),margin:rec.margin,played:rec.played,
      lines:picked.map(l=>({kind:l.kind,season:l.season,kicker:l.season===null?"THE SHOWDOWN":`SEASON ${l.season}`,text:l.text,facts:l.facts}))});
  }

  return Object.freeze({contractVersion:1,feature:"r100-turning-points",maxLines:MAX_LINES,turningPoints,readRecord,
    providerReadRequired:false,providerWriteRequired:false});
});
