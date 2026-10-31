(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTouchlineGazette=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Touchline Gazette (Nik 2026-10-31: "the Gazette is part of r87"). Team V's HO-041 newspaper
  // (visual-assets/v10_1/content/frontpage.js) on its own page:
  //   SEASON edition: after a season's Season Results, when the player taps CONTINUE TO SEASON N+1. Its one CONTINUE then
  //     runs exactly what that tap ran (js/productionSharedMultiSeasonProgression.js continueToNextSeason).
  //   FINAL edition: after Final Winner, when the player leaves it (BACK TO SHOWDOWN HOME or REMATCH). Its CONTINUE then
  //     runs that same button (the same click, let through untouched).
  //   The last season of a Showdown has no CONTINUE TO SEASON tap (Final Winner follows by itself), so it is told by the
  //   FINAL edition, whose table carries every season.
  // Every word comes from what the screen already holds (the converged Shared History projection, the Final Winner frame
  // and the Special Player chip): no Firebase read, no write, nothing sent. Each phone builds its own copy; nothing waits for
  // the partner. The text is chosen by a hash of the Showdown id, the edition and the season, never by who is looking, so
  // both phones print the same paper. Equal points are a DRAW (no tiebreak) and the copy is picked only from the situations
  // that are true (a 1-point win is never a big win, a draw is never a win). Screen words say "Special Player" or "SP".
  // A paper already shown on this phone is not shown again (one small local list, careerModeShowdown.gazetteSeen.v1). If its
  // files cannot load within a few seconds the tap simply goes on as before, so the Gazette can never hold anyone up.
  const node=typeof module!=="undefined"&&module.exports;
  const NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const OTHER=Object.freeze({playerOne:"playerTwo",playerTwo:"playerOne"});
  const LENGTHS=Object.freeze([1,3,5,10]);
  const GOLDEN=Object.freeze({seasons:10,points:110});
  const TROPHY_ART=Object.freeze({"champions-league":"TRO_CONTINENTAL","europa-league":"TRO_EUROPA","league-title":"TRO_LEAGUE_TITLE","domestic-cup":"TRO_DOMESTIC_CUP"});
  // A headline, story, quote or caption that talks about silverware is not printed for a winner whose season had no
  // trophy (a 1 or 2 point win from the bonuses alone); final pages never print "next season" lines.
  const SILVER=/silver|trophy|trophies|cabinet|shelf|shelves|title|cup\b|cups\b|crown|medal|engrav|plaque|display case|glass case/i;
  // Screen words say "Special Player" or "SP": the one pack row that uses the old word (h1-461) is never printed.
  const BANNED=/marquee/i;
  const WINNER_TAKES_ALL=/whoever wins it|whoever finishes the closing season ahead/i;
  const FUTURE=/next season|new season|season ahead|next year|next few evenings/i;

  const plain=x=>Boolean(x)&&typeof x==="object"&&!Array.isArray(x);
  const int=(x,lo,hi)=>Number.isInteger(x)&&x>=lo&&x<=hi;
  function tgCopy(){return root.CareerModeGazetteCopy||(node?require("../data/gazetteCopy.js"):null);}
  function tgPages(){return root.CareerModeFrontPages||(node?require("../data/frontPages.js"):null);}
  // FNV-1a: a small stable hash, the same on every phone and every browser
  // (with a final mix, so the low bits used by "% n" vary too)
  function tgHash(text){
    let h=0x811c9dc5;const s=String(text);for(let i=0;i<s.length;i+=1){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
    h^=h>>>16;h=Math.imul(h,0x85ebca6b)>>>0;h^=h>>>13;h=Math.imul(h,0xc2b2ae35)>>>0;h^=h>>>16;return h>>>0;
  }
  // Rows are picked by situation, never by id. Each slot of each Showdown walks its own fixed shuffle of the rows (seeded by
  // the Showdown id, the edition and the slot), starting at the season's place in it: the same paper on both phones, and
  // no row repeated from one season of a Showdown to the next while the situation still has unused rows.
  function shuffled(seed,list){
    const out=list.slice();let h=tgHash(seed)||1;
    for(let i=out.length-1;i>0;i-=1){h=Math.imul(h^(h>>>15),0x2c1b3c6d)>>>0;h=(h^(h>>>12))>>>0;const j=h%(i+1);const t=out[i];out[i]=out[j];out[j]=t;}
    return out;
  }
  // `used` holds the rows earlier papers of the same Showdown printed: they are passed over while an unused row fits.
  const rowKey=row=>plain(row)?String(row.id||row.text||row.head||""):null;
  function walker(rivalryId,kind,start,used){
    const taken={};
    const walk=(slot,list,make)=>{
      if(!list||!list.length)return null;
      const order=shuffled(`${rivalryId}|${kind}|${slot}`,list);
      for(const fresh of [true,false]){
        for(let k=0;k<order.length;k+=1){
          const row=order[(start+k)%order.length];
          if(plain(row)&&BANNED.test(words(row)))continue;
          if(fresh&&used&&used.has(rowKey(row)))continue;
          const out=make?make(row):row;if(out){taken[slot]=rowKey(row);return out;}
        }
        if(!used)break;
      }
      return null;
    };
    walk.keep=slots=>{if(used)for(const slot of slots)if(taken[slot])used.add(taken[slot]);};
    return walk;
  }
  // Fills {placeholders}; a row naming a value this paper does not have is refused (null), never printed with braces.
  function fill(text,vals){
    let missing=false;
    const out=String(text??"").replace(/\{(\w+)\}/g,(match,key)=>{if(vals[key]===undefined||vals[key]===null||vals[key]===""){missing=true;return match;}return String(vals[key]);});
    return missing?null:out.replace(/\b1 points\b/g,"1 point");
  }
  function fillRow(row,keys,vals){const out={...row};for(const k of keys){if(row[k]===undefined)continue;const t=fill(row[k],vals);if(t===null)return null;out[k]=t;}return out;}
  function fillStory(row,vals){
    if(!row)return null;const paragraphs=[];
    for(const p of row.paragraphs){const t=fill(p,vals);if(t===null)return null;paragraphs.push(t);}
    const standfirst=row.standfirst?fill(row.standfirst,vals):null;if(row.standfirst&&standfirst===null)return null;
    return {id:row.id,byline:row.byline,standfirst,paragraphs};
  }
  const words=row=>[row.headline,row.subhead,row.kicker,row.standfirst,row.pullquote,row.text,row.head,...(row.paragraphs||[])].filter(Boolean).join(" ");

  // ---------- the facts, read from the converged Shared History projection ----------
  function seasonItems(result){
    const s=result.scoring||{};
    return {
      "champions-league":result.championsLeague===true,"europa-league":result.europaLeague===true,"league-title":result.leaguePosition===1,"domestic-cup":result.domesticCup===true,
      "performance-bonus":s.performanceBonus===1,"awards-bonus":s.individualAwardsBonus===1,
      points:{championsLeague:s.championsLeague||0,europaLeague:s.europaLeague||0,leagueTitle:s.leagueTitle||0,domesticCup:s.domesticCup||0,performance:s.performanceBonus||0,awards:s.individualAwardsBonus||0,total:s.total}
    };
  }
  const trophyCount=items=>["champions-league","europa-league","league-title","domestic-cup"].filter(k=>items[k]).length;
  // Every accepted season up to `through`, checked: scores 0-11, and the stored winner is the one the scores give (equal is a draw).
  function readHistory(projection,through){
    if(!plain(projection)||!Array.isArray(projection.seasonHistory)||!LENGTHS.includes(projection.totalSeasons)||!plain(projection.managerRecords))return null;
    const T=projection.totalSeasons;if(!int(through,1,T)||projection.seasonHistory.length<through)return null;
    const clubs={};for(const role of ROLES){const club=projection.managerRecords[role]?.club;if(typeof club!=="string"||!club.trim())return null;clubs[role]=club;}
    const seasons=[];
    for(let i=0;i<through;i+=1){
      const row=projection.seasonHistory[i];if(!plain(row)||row.roundNumber!==i+1||!plain(row.playerOne)||!plain(row.playerTwo))return null;
      const a=row.playerOne.scoring?.total,b=row.playerTwo.scoring?.total;if(!int(a,0,11)||!int(b,0,11))return null;
      const winner=a>b?"playerOne":b>a?"playerTwo":"draw";if(row.winner!==winner)return null;
      seasons.push({number:i+1,score:{playerOne:a,playerTwo:b},winner,items:{playerOne:seasonItems(row.playerOne),playerTwo:seasonItems(row.playerTwo)}});
    }
    return {rivalryId:String(projection.rivalryId||""),totalSeasons:T,clubs,seasons};
  }
  const totalsOf=seasons=>seasons.reduce((t,s)=>({playerOne:t.playerOne+s.score.playerOne,playerTwo:t.playerTwo+s.score.playerTwo}),{playerOne:0,playerTwo:0});
  function spOf(sp){return plain(sp)&&plain(sp.daniel)&&plain(sp.nik)&&typeof sp.daniel.name==="string"&&sp.daniel.name&&typeof sp.nik.name==="string"&&sp.nik.name?{daniel:sp.daniel.name,nik:sp.nik.name}:null;}

  // ---------- the Gazette desk (2.0.0): plain facts worked out from the seasons, never from copy ----------
  // THE RACE: where the Showdown stands after this paper's season, with what is still possible (a season is worth at most
  // 11 to each manager, so a lead bigger than 11 x the seasons left cannot be caught; a lead of exactly that can only be
  // levelled, and level is a draw: no tiebreak). The RECORD BOOK: seasons won, trophies, best season, streaks, perfect seasons.
  const plural=(n,word)=>`${n} ${word}${n===1?"":"s"}`;
  const both=list=>list.length===2?`${list[0]} and ${list[1]}`:list[0];
  function recordsOf(seasons){
    const rec={};
    for(const role of ROLES){
      const r={wins:0,trophies:0,perfect:0,best:0};
      for(const s of seasons){const it=s.items[role];r.wins+=s.winner===role?1:0;r.trophies+=trophyCount(it);r.perfect+=s.score[role]===11?1:0;r.best=Math.max(r.best,s.score[role]);}
      rec[role]=r;
    }
    let streak=null;
    const last=seasons[seasons.length-1];
    if(last&&last.winner!=="draw"){let n=0;for(let i=seasons.length-1;i>=0&&seasons[i].winner===last.winner;i-=1)n+=1;if(n>=2)streak={role:last.winner,n};}
    let biggest=null;
    for(const s of seasons){if(s.winner==="draw")continue;const m=Math.abs(s.score.playerOne-s.score.playerTwo);if(!biggest||m>biggest.margin)biggest={margin:m,role:s.winner,season:s.number,score:s.score};}
    return {...rec,draws:seasons.filter(s=>s.winner==="draw").length,streak,biggest};
  }
  function raceFor(facts,N,final){
    const T=facts.totalSeasons,seasons=facts.seasons.slice(0,N),totals=totalsOf(seasons);
    const gap=Math.abs(totals.playerOne-totals.playerTwo),leader=totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":null;
    const left=T-N,pointsLeft=left*11;
    let line;
    if(final){
      line=leader?`${NAMES[leader]} wins the Showdown ${totals[leader]} to ${totals[OTHER[leader]]}, by ${plural(gap,"point")}.`
        :totals.playerOne>=GOLDEN.points&&T===GOLDEN.seasons?`Level on ${totals.playerOne} points each after ${plural(T,"season")}: a drawn Showdown, and a Golden Showdown for both.`
        :`Level on ${plural(totals.playerOne,"point")} each after ${plural(T,"season")}: a drawn Showdown, honours even.`;
    }else if(!leader){
      line=`All square on ${plural(totals.playerOne,"point")} each. ${plural(left,"season")} to go, ${pointsLeft} points still to play for on each side.`;
    }else if(gap>pointsLeft){
      line=`${NAMES[leader]} is ${gap} clear with only ${pointsLeft} points left to play for: the Showdown can no longer be caught.`;
    }else if(gap===pointsLeft){
      line=`${NAMES[leader]} leads by ${gap}. ${NAMES[OTHER[leader]]} can still draw level, but only with every one of the last ${pointsLeft} points while ${NAMES[leader]} scores none.`;
    }else{
      line=`${NAMES[leader]} leads by ${plural(gap,"point")}. ${plural(left,"season")} to go, ${pointsLeft} points still to play for on each side.`;
    }
    const chips=seasons.map(s=>({label:`S${s.number}`,left:s.score.playerOne,right:s.score.playerTwo,winner:s.winner==="draw"?"draw":s.winner==="playerOne"?"left":"right"}));
    return {title:final?"How it was won":"The race",line,chips,totals,leader:leader?NAMES[leader]:null,seasonsLeft:left,pointsLeft};
  }
  // One line each, most telling first; only facts that are true for this Showdown so far are printed.
  function recordBook(facts,N,final){
    const seasons=facts.seasons.slice(0,N),r=recordsOf(seasons),out=[];
    // (never beside level totals, where a seasons-won count could read as a tiebreak: level is a draw)
    const lvl=totalsOf(seasons);
    if(N>=2&&lvl.playerOne!==lvl.playerTwo)out.push(`Seasons won: ${NAMES.playerOne} ${r.playerOne.wins} · ${NAMES.playerTwo} ${r.playerTwo.wins}${r.draws?` · drawn ${r.draws}`:""}`);
    out.push(`Trophies${final?"":" so far"}: ${NAMES.playerOne} ${r.playerOne.trophies} · ${NAMES.playerTwo} ${r.playerTwo.trophies}`);
    if(r.streak)out.push(r.streak.n===N&&N>=3?`${NAMES[r.streak.role]} has won every season${final?"":" so far"}`:`${NAMES[r.streak.role]} has won ${r.streak.n} seasons in a row`);
    if(N>=2){const best=Math.max(r.playerOne.best,r.playerTwo.best);if(best>0)out.push(`Best season${final?"":" so far"}: ${best} points, ${both(ROLES.filter(x=>r[x].best===best).map(x=>NAMES[x]))}`);}
    if(N>=2&&r.biggest&&r.biggest.margin>=3)out.push(`Biggest season win: ${NAMES[r.biggest.role]} ${r.biggest.score[r.biggest.role]}–${r.biggest.score[OTHER[r.biggest.role]]} in season ${r.biggest.season}`);
    const perfect=ROLES.filter(x=>r[x].perfect>0);
    if(perfect.length)out.push(`Perfect 11s: ${perfect.map(x=>`${NAMES[x]} ${r[x].perfect}`).join(" · ")}`);
    // the Golden Showdown (110 over ten seasons) needs 11 in every season: it is "on" only while a manager has dropped nothing
    if(!final&&facts.totalSeasons===GOLDEN.seasons){const alive=ROLES.filter(x=>r[x].perfect===N);if(alive.length)out.push(`Golden watch: ${both(alive.map(x=>NAMES[x]))} still perfect`);}
    return out;
  }

  // Trophy desk: each manager's biggest item of the season (or of the Showdown on a final page). Team V's briefs cover the
  // Champions League, the Europa League and the league title; the smaller items get one plain line of fact.
  const BRIEF_ORDER=["champions-league","europa-league","league-title","domestic-cup","performance-bonus","awards-bonus"];
  function briefFor(walk,slot,role,items,clubs,final){
    const C=tgCopy(),topic=BRIEF_ORDER.find(k=>items[k])||"none",club=clubs[role],name=NAMES[role],span=final?"in this Showdown":"this season";
    const rows=C.small.briefs.filter(b=>b.situation===topic);
    if(rows.length){const row=walk(slot,rows,r=>final&&FUTURE.test(r.text)?null:r);if(row)return {head:row.head,text:row.text,trophy:TROPHY_ART[topic],club,id:`brief:${topic}:${C.small.briefs.indexOf(row)}`};}
    const plainLine={
      "domestic-cup":{head:"Cup for "+club,text:`${name} and ${club} won the domestic cup ${span}.`},
      "performance-bonus":{head:"Bonus point",text:`${name} earned the performance bonus with ${club} ${span}.`},
      "awards-bonus":{head:"Awards night",text:`${name} took the individual awards bonus with ${club} ${span}.`},
      none:{head:"Nothing on the shelf",text:`No trophy and no bonus point for ${name} and ${club} ${span}.`}
    }[topic];
    return {...plainLine,trophy:TROPHY_ART[topic]||null,club,id:`brief:${topic}`};
  }
  function earsFor(walk){const C=tgCopy(),first=walk("ear1",C.small.ears);const second=walk("ear2",C.small.ears.filter(e=>e!==first));return [first?.text||"",second?.text||""];}
  // The pull quote: a winner or runner-up line (a draw: either manager), said by that manager.
  function quoteFor(walk,side,vals,keep){
    const C=tgCopy(),who=side==="draw"?null:side==="winner"?"{winner}":"{loser}";
    const rows=C.small.quotes.filter(q=>side==="draw"?q.situation==="draw":q.situation==="win"&&q.who===who);
    const row=walk("quote",rows,r=>keep(r)?fillRow(r,["who","text"],vals):null);
    return row?{text:row.text,who:row.who}:null;
  }
  function captionFor(walk,draw,vals,keep){
    const C=tgCopy(),rows=C.small.captions.filter(c=>c.photo===(draw?"lead-draw":"lead-season"));
    return walk("caption",rows,r=>keep(r)?fillRow(r,["text"],vals):null);
  }

  // ---------- SEASON edition ----------
  // Only the situations that are true are offered (pick by situation, never by id). A drawn season is told only by the
  // drawn pages; level totals only by the level pages; a 1-point win is never a big win.
  function seasonSituations(facts,N){
    const T=facts.totalSeasons,season=facts.seasons[N-1],W=season.winner;
    const before=totalsOf(facts.seasons.slice(0,N-1)),after=totalsOf(facts.seasons.slice(0,N));
    const level=after.playerOne===after.playerTwo,gap=Math.abs(after.playerOne-after.playerTwo);
    const list=[];
    if(W==="draw")list.push("draw");
    else{
      const L=OTHER[W],margin=Math.abs(season.score.playerOne-season.score.playerTwo),gapBefore=before[W]-before[L],gapAfter=after[W]-after[L];
      list.push(margin>=6?"big-win":margin>=3?"comfortable-win":"narrow-win");
      if(N>=2&&gapBefore<0&&gapAfter<0)list.push("comeback");
      if(N>=2&&gapBefore>0)list.push("lead-extended");
      let streak=0;for(let i=N-1;i>=0&&facts.seasons[i].winner===W;i-=1)streak+=1;
      if(streak>=3)list.push("winning-streak");
      const wi=season.items[W],li=season.items[L];
      if(wi["champions-league"]&&!li["champions-league"])list.push("champions-league");
      if(wi["europa-league"]&&!li["europa-league"])list.push("europa-league");
      if(wi["league-title"]&&!li["league-title"])list.push("league-title");
    }
    if(N>=2&&level)list.push("level-overall");
    // shown on the paper before the last season, while the last season can still settle it (a season is worth at most 11)
    if(T>=3&&N===T-1&&gap<=11)list.push("final-season-decider");
    return list;
  }
  // Each paper is built after the papers of the Showdown's earlier seasons (the same rows on both phones), so it can pass
  // over the rows they printed.
  function seasonEdition({projection,seasonNumber,specialPlayers=null}={}){
    const C=tgCopy(),P=tgPages();if(!C||!P)return null;
    const N=seasonNumber,facts=readHistory(projection,N);if(!facts||N>=facts.totalSeasons)return null;
    const used=new Set();let edition=null;
    for(let k=1;k<=N;k+=1)edition=buildSeason({...facts,seasons:facts.seasons.slice(0,k)},k,k===N?specialPlayers:null,used);
    return edition;
  }
  function buildSeason(facts,N,specialPlayers,used){
    const C=tgCopy(),P=tgPages();
    const T=facts.totalSeasons,season=facts.seasons[N-1],W=season.winner,draw=W==="draw",L=draw?null:OTHER[W];
    const key=`${facts.rivalryId}|season|${N}`,walk=walker(facts.rivalryId,"season",N-1,used);
    const after=totalsOf(facts.seasons),leader=after.playerOne>after.playerTwo?"playerOne":after.playerTwo>after.playerOne?"playerTwo":null;
    const margin=Math.abs(season.score.playerOne-season.score.playerTwo);
    const base={seasonNo:N,seasonsTotal:T,managerA:NAMES.playerOne,managerB:NAMES.playerTwo,clubA:facts.clubs.playerOne,clubB:facts.clubs.playerTwo};
    if(!draw)Object.assign(base,{winner:NAMES[W],loser:NAMES[L],winnerClub:facts.clubs[W],loserClub:facts.clubs[L],winnerPoints:season.score[W],loserPoints:season.score[L],margin});
    if(leader)Object.assign(base,{leader:NAMES[leader],trailer:NAMES[OTHER[leader]]});
    // {points}: the season points each on a drawn season, the overall total each when the totals are level
    const valsFor=situation=>situation==="level-overall"?{...base,points:after.playerOne}:situation==="draw"?{...base,points:season.score.playerOne}:base;
    const noSilver=!draw&&trophyCount(season.items[W])===0;
    // "whoever wins the last season takes the Showdown" is only true while the totals are level
    const keep=row=>!(noSilver&&SILVER.test(words(row)))&&!(leader&&WINNER_TAKES_ALL.test(words(row)));
    const options=seasonSituations(facts,N).map(situation=>{
      const vals=valsFor(situation);
      const heads=P.season.filter(r=>r.situation===situation),stories=C.stories.filter(s=>s.edition==="season"&&s.situation===situation);
      const head=walk(`headline:${situation}`,heads,r=>keep(r)?fillRow(r,["headline","subhead","kicker"],vals):null);
      const story=walk(`story:${situation}`,stories,r=>keep(r)?fillStory(r,vals):null);
      return head&&story?{situation,head,story,vals}:null;
    }).filter(Boolean);
    if(!options.length)return null;
    const chosen=options[tgHash(`${key}|situation`)%options.length],{head,story}=chosen,vals=valsFor(draw?"draw":"");
    const side=draw?"draw":walk("quote-side",["winner","runner-up"]);
    const quote=quoteFor(walk,side,vals,keep);
    const photo=draw?"GZ_LEAD_DRAW":walk("photo",["GZ_LEAD_SEASON","GZ_LEAD_PRESS"]);
    const caption=captionFor(walk,draw,vals,keep);
    let portrait=null;
    if(!draw){
      const think=walk("portrait",["winner","thinker"])==="thinker",role=think?L:W;
      portrait={name:`GZ_${think?"THINK":"WIN"}_${role==="playerOne"?"DANIEL":"NIK"}`,caption:think?`${NAMES[L]} and ${facts.clubs[L]} regroup after season ${N}.`:`${NAMES[W]}, season ${N} winner with ${facts.clubs[W]}.`};
    }
    const i1=season.items.playerOne,i2=season.items.playerTwo,rows=[{label:"Champions League",k:"championsLeague"}];
    if(i1["europa-league"]||i2["europa-league"])rows.push({label:"Europa League",k:"europaLeague"});
    rows.push({label:"League title",k:"leagueTitle"},{label:"Domestic cup",k:"domesticCup"},{label:"Performance",k:"performance"},{label:"Awards",k:"awards"});
    const numbers=rows.map(r=>({label:r.label,left:i1.points[r.k],right:i2.points[r.k]}));
    numbers.push({label:"Season points",left:season.score.playerOne,right:season.score.playerTwo,total:true});
    if(N>1)numbers.push({label:"Showdown total",left:after.playerOne,right:after.playerTwo});
    const briefs=ROLES.map((role,i)=>briefFor(walk,"brief"+i,role,season.items[role],facts.clubs,false));
    const ears=earsFor(walk);
    walk.keep([`headline:${chosen.situation}`,`story:${chosen.situation}`,"quote","caption","brief0","brief1","ear1","ear2"]);
    return Object.freeze({
      kind:"season",key,rivalryId:facts.rivalryId,seasonNumber:N,totalSeasons:T,situation:chosen.situation,winner:draw?"draw":NAMES[W],
      paper:{
        variant:draw?"draw":"season",kicker:draw?"DRAWN":head.kicker||`${NAMES[W].toUpperCase()} WINS`,headline:head.headline,subhead:head.subhead,
        season:`Season ${N} of ${T}`,dateline:"Season review",edition:"Price: one point",issue:`Vol. I · No. ${N}`,ears,
        left:{name:NAMES.playerOne,club:facts.clubs.playerOne,score:season.score.playerOne},right:{name:NAMES.playerTwo,club:facts.clubs.playerTwo,score:season.score.playerTwo},
        photo:{name:photo,caption:caption?caption.text:"",credit:"Gazette photo"},
        story:{byline:story.byline,paragraphs:story.paragraphs},
        numbersTitle:"Season in numbers",numbers,quote:quote?{text:quote.text,who:quote.who}:null,portrait,briefs,
        race:raceFor(facts,N,false),inside:recordBook(facts,N,false),specialPlayers:spOf(specialPlayers)
      },
      ids:{headline:head.id,story:story.id,briefs:briefs.map(b=>b.id)}
    });
  }

  // ---------- FINAL edition ----------
  function finalEdition({projection,final=null,specialPlayers=null}={}){
    const C=tgCopy(),P=tgPages();if(!C||!P||!plain(projection))return null;
    const T=projection.totalSeasons,facts=readHistory(projection,T);if(!facts||facts.seasons.length!==T)return null;
    const totals=totalsOf(facts.seasons),W=totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":"draw";
    // The Final Winner frame, when given, must say the same (it reads the reconciled winner; the paper never disagrees with it).
    if(final){const fw={daniel:"playerOne",nik:"playerTwo",draw:"draw"}[final.winner];if(fw!==W)return null;if(plain(final.totals)&&(final.totals.daniel!==totals.playerOne||final.totals.nik!==totals.playerTwo))return null;}
    const draw=W==="draw",L=draw?null:OTHER[W],margin=Math.abs(totals.playerOne-totals.playerTwo);
    // A Golden Showdown is a manager on 110 over ten seasons: the winner, or both managers on a 110-110 draw (still a draw,
    // no tiebreak; the paper is the gold edition with the drawn copy).
    const goldenRoles=T===GOLDEN.seasons?ROLES.filter(role=>totals[role]>=GOLDEN.points):[];
    const golden=goldenRoles.length>0;
    const used=new Set();for(let k=1;k<T;k+=1)buildSeason({...facts,seasons:facts.seasons.slice(0,k)},k,null,used);
    const key=`${facts.rivalryId}|final|${T}`,walk=walker(facts.rivalryId,"final",0,used);
    const vals={seasonsTotal:T,managerA:NAMES.playerOne,managerB:NAMES.playerTwo,clubA:facts.clubs.playerOne,clubB:facts.clubs.playerTwo};
    if(draw)vals.points=totals.playerOne;
    else Object.assign(vals,{winner:NAMES[W],loser:NAMES[L],winnerClub:facts.clubs[W],loserClub:facts.clubs[L],winnerPoints:totals[W],loserPoints:totals[L],margin,leader:NAMES[W],trailer:NAMES[L]});
    // Situations: a draw only the drawn pages; the Golden Showdown (first to 110 over ten seasons); otherwise the Showdown's
    // length (ten seasons read as the long, five-season pages), decided in its last season (the winner did not lead before
    // it), or a dominant win (already out of reach before the last season: a season is worth at most 11 points).
    let situations;
    if(draw)situations=["showdown-drawn"];
    else if(golden)situations=["golden-showdown-won"];
    else{
      situations=[T===1?"showdown-won-1-season":T===3?"showdown-won-3-seasons":"showdown-won-5-seasons"];
      if(T>=3){const before=totalsOf(facts.seasons.slice(0,T-1));if(before[W]<=before[L])situations.push("won-on-the-final-day");if(before[W]-before[L]>11)situations.push("dominant-win");}
    }
    const keep=row=>!FUTURE.test(words(row));
    const options=situations.map(situation=>{
      const head=walk(`headline:${situation}`,P.final.filter(r=>r.situation===situation),r=>keep(r)?fillRow(r,["headline","subhead","kicker"],vals):null);
      const story=walk(`story:${situation}`,C.stories.filter(s=>s.edition==="final"&&s.situation===situation),r=>keep(r)?fillStory(r,vals):null);
      return head&&story?{situation,head,story}:null;
    }).filter(Boolean);
    if(!options.length)return null;
    const chosen=options[tgHash(`${key}|situation`)%options.length],{head,story}=chosen;
    const side=draw?"draw":walk("quote-side",["winner","runner-up"]);
    const quote=quoteFor(walk,side,vals,keep);
    const photo=golden?"GZ_LEAD_GOLD":draw?"GZ_LEAD_DRAW":"GZ_LEAD_FINAL";
    const caption=captionFor(walk,draw,vals,row=>keep(row)&&!/\bseason/i.test(row.text));
    const portrait=draw?null:{name:`GZ_WIN_${W==="playerOne"?"DANIEL":"NIK"}`,caption:`${NAMES[W]}, Showdown ${golden?"Golden champion":"champion"} with ${facts.clubs[W]}.`};
    // The Showdown in numbers: every season (up to five), or the trophy count over ten seasons.
    let numbers;
    const rec=role=>{const r={cl:0,el:0,league:0,cup:0,wins:0,best:0};for(const s of facts.seasons){const it=s.items[role];r.cl+=it["champions-league"]?1:0;r.el+=it["europa-league"]?1:0;r.league+=it["league-title"]?1:0;r.cup+=it["domestic-cup"]?1:0;r.wins+=s.winner===role?1:0;r.best=Math.max(r.best,s.score[role]);}return r;};
    const r1=rec("playerOne"),r2=rec("playerTwo");
    if(T<=5)numbers=facts.seasons.map(s=>({label:`Season ${s.number}`,left:s.score.playerOne,right:s.score.playerTwo}));
    else{numbers=[{label:"Champions Leagues",left:r1.cl,right:r2.cl}];if(r1.el||r2.el)numbers.push({label:"Europa Leagues",left:r1.el,right:r2.el});numbers.push({label:"League titles",left:r1.league,right:r2.league},{label:"Domestic cups",left:r1.cup,right:r2.cup});if(!draw)numbers.push({label:"Seasons won",left:r1.wins,right:r2.wins});numbers.push({label:"Best season",left:r1.best,right:r2.best});}
    numbers.push({label:"Overall",left:totals.playerOne,right:totals.playerTwo,total:true});
    // Trophy desk: the Showdown trophy for the winner (none on a draw), and each other manager's biggest prize of the Showdown.
    const showdownItems=role=>{const r=rec(role);return {"champions-league":r.cl>0,"europa-league":r.el>0,"league-title":r.league>0,"domestic-cup":r.cup>0,"performance-bonus":facts.seasons.some(s=>s.items[role]["performance-bonus"]),"awards-bonus":facts.seasons.some(s=>s.items[role]["awards-bonus"])};};
    const briefs=draw&&golden?ROLES.map(role=>({head:"Golden Showdown",text:`${NAMES[role]} reaches ${GOLDEN.points} points over ${T} seasons: a Golden Showdown, shared.`,trophy:"TRO_SHOWDOWN_CHAMPION",club:facts.clubs[role],id:`golden-shared:${role}`}))
      :draw?ROLES.map((role,i)=>briefFor(walk,"brief"+i,role,showdownItems(role),facts.clubs,true))
      :[{head:golden?"Golden Showdown won":"The Showdown trophy",text:golden?`${NAMES[W]} reaches ${GOLDEN.points} points, the target that wins the Golden Showdown.`:`${NAMES[W]}'s name goes on the trophy that outranks every cup in either cabinet.`,trophy:"TRO_SHOWDOWN_CHAMPION",club:facts.clubs[W],id:"showdown-trophy"},briefFor(walk,"brief1",L,showdownItems(L),facts.clubs,true)];
    return Object.freeze({
      kind:"final",key,rivalryId:facts.rivalryId,seasonNumber:T,totalSeasons:T,situation:chosen.situation,winner:draw?"draw":NAMES[W],golden,
      paper:{
        variant:golden?"gold":draw?"draw":"season",kicker:draw?"DRAWN":head.kicker||"SHOWDOWN WINNER",headline:head.headline,subhead:head.subhead,
        season:`${T} season${T===1?"":"s"}`,dateline:golden?"Golden edition":"Final edition",edition:golden?"Commemorative edition":"Price: one point",issue:golden?"Vol. I · Golden edition":"Vol. I · Final edition",ears:earsFor(walk),
        left:{name:NAMES.playerOne,club:facts.clubs.playerOne,score:totals.playerOne},right:{name:NAMES.playerTwo,club:facts.clubs.playerTwo,score:totals.playerTwo},
        photo:{name:photo,caption:caption?caption.text:"",credit:"Gazette photo"},
        story:{byline:story.byline,paragraphs:story.paragraphs},
        numbersTitle:golden?"The Golden Showdown":"The Showdown in numbers",numbers,quote:quote?{text:quote.text,who:quote.who}:null,portrait,briefs,
        race:raceFor(facts,T,true),inside:recordBook(facts,T,true),specialPlayers:spOf(specialPlayers)
      },
      ids:{headline:head.id,story:story.id,briefs:briefs.map(b=>b.id)}
    });
  }

  // Every word a paper prints (for the contracts: no braces, no "Marquee", the same on both phones).
  function paperText(edition){
    const p=edition?.paper;if(!p)return "";
    return [p.kicker,p.headline,p.subhead,p.season,p.dateline,p.edition,p.issue,...p.ears,p.left.name,p.left.club,p.right.name,p.right.club,p.photo.caption,p.photo.credit,p.story.byline,...p.story.paragraphs,p.numbersTitle,...p.numbers.map(n=>`${n.label} ${n.left} ${n.right}`),p.quote?.text,p.quote?.who,p.portrait?.caption,...p.briefs.map(b=>`${b.head} ${b.text}`),p.race?`${p.race.title} ${p.race.line} ${p.race.chips.map(c=>`${c.label} ${c.left} ${c.right}`).join(" ")}`:"",...p.inside,p.specialPlayers?`Special Players ${p.specialPlayers.daniel} ${p.specialPlayers.nik}`:""].filter(x=>x!==null&&x!==undefined).join("\n");
  }

  // ---------- the inputs, read from what this screen already holds (no read, no write) ----------
  function tgState(name){try{return root[name]?.getState?.()??null;}catch(_error){return null;}}
  function tgSpecial(rivalryId){try{const chip=root.CareerModeSpecialPlayerChip;return chip&&typeof chip.liveFor==="function"?chip.liveFor(rivalryId):null;}catch(_error){return null;}}
  // SEASON: the season this phone's CONTINUE TO SEASON N+1 belongs to (Shared History converged through it).
  function seasonInput(states){
    const history=states?.history,projection=history?.projection;
    if(history?.authoritative!==true||history.phase!=="HISTORY_CONVERGED"||!plain(projection))return null;
    const N=Number(history.throughSeason);if(!Number.isInteger(N)||projection.acceptedSeasons!==N)return null;
    return {projection,seasonNumber:N,specialPlayers:states.specialPlayers||null};
  }
  // FINAL: the Final Winner frame on screen and the verified history it was drawn from (js/seasonFinalV10.js).
  function finalInput(states){
    const final=states?.final,history=states?.history,projection=history?.projection;
    if(!plain(final)||!final.winner||!plain(projection)||history?.phase!=="HISTORY_CONVERGED")return null;
    if(Number.isInteger(final.seasonsPlayed)&&final.seasonsPlayed!==projection.totalSeasons)return null;
    return {projection,final,specialPlayers:final.specialPlayers||states.specialPlayers||null};
  }

  // ---------- the page (browser only) ----------
  const SEEN_KEY="careerModeShowdown.gazetteSeen.v1",SEEN_MAX=60;
  const ASSET_CAP_MS=4000,FINAL_SAFETY_MS=2500,SEASON_SAFETY_MS=9000;
  const BASE="visual-assets/v10_1/content/";
  const FONTS=Object.freeze([["Gazette Mast","normal",400,"unifrakturmaguntia-latin-400-normal"],["Gazette Head","normal",700,"playfair-display-latin-700-normal"],["Gazette Head","normal",900,"playfair-display-latin-900-normal"],["Gazette Head","italic",400,"playfair-display-latin-400-italic"],["Gazette Body","normal",400,"old-standard-tt-latin-400-normal"],["Gazette Body","italic",400,"old-standard-tt-latin-400-italic"],["Gazette Body","normal",700,"old-standard-tt-latin-700-normal"]]);
  const FONT_FILES=Object.freeze(FONTS.map(f=>`${BASE}gazette/fonts/${f[3]}.woff2`));
  let installed=false,opening=null,current=null,passing=false,assetsPromise=null;
  // (through js/storage.js, the app's one door to the browser's local storage)
  function seenList(){try{const raw=typeof root.readStorageValue==="function"?root.readStorageValue(SEEN_KEY):null;const v=JSON.parse(raw||"[]");return Array.isArray(v)?v.filter(x=>typeof x==="string"):[];}catch(_error){return [];}}
  function seen(key){return seenList().includes(key);}
  function markSeen(key){try{const list=seenList().filter(k=>k!==key);list.push(key);if(typeof root.writeStorageValue==="function")root.writeStorageValue(SEEN_KEY,JSON.stringify(list.slice(-SEEN_MAX)));}catch(_error){}}
  const assetUrl=path=>typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(path):path;
  const activeScreen=()=>{try{return typeof root.getActiveScreenName==="function"?root.getActiveScreenName():null;}catch(_error){return null;}};
  const within=(promise,ms)=>Promise.race([Promise.resolve(promise).then(()=>true,()=>false),new Promise(resolve=>root.setTimeout(()=>resolve(false),ms))]);
  // The page's own files: Team V's sheet and paper, this page's sheet and the copy. The fonts are declared with the shell's
  // versioned urls (service-worker.js precaches them), so a phone that has played once prints the paper offline too.
  function tgFontRule(doc){
    if(doc.getElementById("tgzFontFaces"))return;
    const style=doc.createElement("style");style.id="tgzFontFaces";
    style.textContent=FONTS.map((f,i)=>`@font-face{font-family:"${f[0]}";font-style:${f[1]};font-weight:${f[2]};font-display:swap;src:url("${assetUrl(FONT_FILES[i])}") format("woff2")}`).join("\n");
    doc.head.appendChild(style);
  }
  function loadAssets(){
    if(assetsPromise)return assetsPromise;
    const load=root.loadRuntimeScript,style=root.loadRuntimeStyle;
    if(typeof load!=="function"||typeof style!=="function")return Promise.reject(new Error("GAZETTE_LOADER_UNAVAILABLE"));
    const doc=root.document;
    assetsPromise=Promise.all([
      style("gazette-content",BASE+"content.css"),style("gazette-page","css/v10Gazette.css"),
      load("gazette-frontpage",BASE+"frontpage.js",()=>Boolean(root.ShowdownContent?.frontPage)),
      load("gazette-copy","data/gazetteCopy.js",()=>Boolean(root.CareerModeGazetteCopy)),
      load("gazette-headlines","data/frontPages.js",()=>Boolean(root.CareerModeFrontPages)),
      load("visual-identity","js/visualIdentity.js",()=>typeof root.getClubCrestSvg==="function").catch(()=>null)
    ]).then(()=>{tgFontRule(doc);return doc.fonts&&typeof doc.fonts.load==="function"?Promise.all(FONTS.map(f=>doc.fonts.load(`${f[1]} ${f[2]} 16px "${f[0]}"`).catch(()=>null))):null;}).then(()=>true);
    assetsPromise.catch(()=>{assetsPromise=null;});
    return assetsPromise;
  }
  const art=name=>root.ShowdownContent?.frontPage?.art?root.ShowdownContent.frontPage.art(name):`${BASE}gazette/${name}.webp`;
  function edPictures(edition){const p=edition.paper;return [p.photo?.name,p.portrait?.name,...p.briefs.map(b=>b.trophy)].filter(Boolean).map(art);}
  function decode(url){return new Promise(resolve=>{const img=new root.Image();img.decoding="async";img.onload=img.onerror=()=>resolve();img.src=url;if(typeof img.decode==="function")img.decode().then(resolve,resolve);});}
  function tgPrepare(edition){return loadAssets().then(()=>Promise.all(edPictures(edition).map(decode)));}
  function compactNow(){try{return root.matchMedia?.("(max-width: 700px), (max-height: 520px) and (max-width: 1000px)")?.matches===true;}catch(_error){return false;}}
  function paperFor(edition,compact){
    const p={...edition.paper,compact:compact?(edition.kind==="final"?"short":true):false};
    p.photo={...p.photo,src:art(p.photo.name)};
    if(p.portrait)p.portrait={...p.portrait,src:art(p.portrait.name)};
    p.briefs=p.briefs.map(b=>({...b,trophy:b.trophy?art(b.trophy):null}));
    if(!p.quote)delete p.quote;
    return p;
  }
  function eyebrowFor(edition){return edition.kind==="final"?(edition.golden?"Golden Showdown · front page":"Final front page"):`Season ${edition.seasonNumber} of ${edition.totalSeasons} · front page`;}
  // The Special Players line, under the score strip (phone and desktop): "SP" with each manager's player.
  function addSpecialPlayers(paper,sp,doc){
    if(!sp)return;const strip=paper.querySelector(".cmx-paper__photo");if(!strip)return;
    const line=doc.createElement("p");line.className="tgz-sp";
    const label=doc.createElement("b");label.textContent="Special Players";
    const a=doc.createElement("span");a.textContent=`${NAMES.playerOne}: ${sp.daniel}`;
    const b=doc.createElement("span");b.textContent=`${NAMES.playerTwo}: ${sp.nik}`;
    line.append(label,a,b);strip.after(line);
  }
  // THE RACE strip (desktop and phone), above the trophy desk: where the Showdown stands, then every season's score with
  // its winner in bold (a drawn season in plain type).
  function addRace(paper,race,doc){
    if(!race)return;
    const box=doc.createElement("section");box.className="tgz-race";
    const h=doc.createElement("h4");h.textContent=race.title;
    const line=doc.createElement("p");line.className="tgz-race__line";line.textContent=race.line;
    const list=doc.createElement("ol");list.className="tgz-race__chips";list.setAttribute("aria-label","Season by season, Daniel first");
    for(const c of race.chips){
      const li=doc.createElement("li");li.className=`is-${c.winner}`;
      const b=doc.createElement("b");b.textContent=c.label;
      const l=doc.createElement("span");l.textContent=String(c.left);
      const r=doc.createElement("span");r.textContent=String(c.right);
      const dash=doc.createElement("i");dash.textContent="–";
      li.append(b,l,dash,r);list.appendChild(li);
    }
    box.append(h,line,list);
    const desk=paper.querySelector(".cmx-gz__desk");
    if(desk)desk.before(box);else paper.appendChild(box);
  }
  // The whole paper and its CONTINUE fit the window: the paper is scaled down a little on short windows (never below 72% on
  // desktop or 82% for the phone edition), after which the page scrolls as usual. CONTINUE itself is never scaled.
  function fit(){
    const state=current;if(!state||!state.page.isConnected)return;
    const compact=compactNow();
    if(compact!==state.compact){tgRender(state.plan,state);return;}
    const desk=state.page.querySelector(".cmx-fp-screen__desk");if(!desk)return;
    desk.style.zoom="";
    const screen=state.page.querySelector(".cmx-fp-screen"),paper=desk.firstElementChild;if(!screen||!paper)return;
    const top=state.page.getBoundingClientRect().top,avail=root.innerHeight-Math.max(0,top);
    const over=screen.scrollHeight-avail;if(over<=0)return;
    const k=Math.max(compact?0.82:0.72,Math.min(1,(paper.offsetHeight-over)/paper.offsetHeight));desk.style.zoom=String(Math.round(k*1000)/1000);
  }
  function tgClose(){
    const state=current;current=null;if(!state)return;
    root.removeEventListener?.("resize",state.onResize);root.clearTimeout(state.safety);
    state.page.remove();
    if(state.host?.dataset?.gazette)delete state.host.dataset.gazette;
    if(root.document?.documentElement?.dataset?.gazette)delete root.document.documentElement.dataset.gazette;
  }
  function tgRender(plan,previous=null){
    const doc=root.document,host=doc.getElementById("seasonEntry");if(!host)return false;
    if(previous&&previous.page.isConnected)previous.page.remove();
    const page=doc.createElement("div");page.id="touchlineGazette";page.className=`tgzPage tgzPage--${plan.kind}`;page.setAttribute("role","region");page.setAttribute("aria-label","The Touchline Gazette");
    page.dataset.gazetteKey=plan.edition.key;
    // the plate the screen just showed (Season Results or Final Winner), with the shell's own urls: already in the cache
    const plate=plan.kind==="final"?"FINAL_WINNER":"SEASON_RESULTS",dir="visual-assets/v10_1/plates-v2/ENV_"+plate;
    // (absolute: a url() inside a custom property resolves against the stylesheet that uses it, css/)
    const abs=path=>{const url=assetUrl(path);try{return new URL(url,doc.baseURI).href;}catch(error){return url;}};
    page.style.setProperty("--tgz-plate-desktop",`image-set(url("${abs(dir+"_PLATE_V2_1X.webp")}") 1x,url("${abs(dir+"_PLATE_V2_2X.webp")}") 2x)`);
    page.style.setProperty("--tgz-plate-phone",`url("${abs(dir+"_PHONE_V2.webp")}")`);
    host.appendChild(page);
    const compact=compactNow();
    root.ShowdownContent.frontPage.screen(page,paperFor(plan.edition,compact),()=>proceed(),{eyebrow:eyebrowFor(plan.edition),title:"Read all about it",button:"Continue",still:Boolean(previous)});
    page.querySelector(".cmx-fp-screen__title")?.remove();
    const paper=page.querySelector(".cmx-paper");if(paper){addSpecialPlayers(paper,plan.edition.paper.specialPlayers,doc);try{addRace(paper,plan.edition.paper.race,doc);}catch(_error){}}
    const button=page.querySelector(".cmx-continue");if(button)button.id="touchlineGazetteContinue";
    host.dataset.gazette=plan.kind;doc.documentElement.dataset.gazette=plan.kind;
    const state=previous||{plan,host,onResize:null,safety:null,leaving:false};
    state.page=page;state.compact=compact;state.host=host;
    if(!previous){state.onResize=()=>fit();root.addEventListener?.("resize",state.onResize);}
    current=state;
    if(!previous){const main=host.closest("main");if(main)main.scrollTop=0;root.scrollTo?.(0,0);button?.focus?.({preventScroll:true});}
    fit();if(doc.fonts?.ready)doc.fonts.ready.then(()=>fit());
    return true;
  }
  // CONTINUE: the same step the tapped button ran. If it does not leave this screen (it could not go on), the paper closes
  // and the screen the player came from is back with its own button, so nobody is ever left on the paper.
  function proceed(){
    const state=current;if(!state||state.leaving)return;state.leaving=true;
    const button=state.page.querySelector(".cmx-continue");if(button){button.disabled=true;button.setAttribute("aria-busy","true");}
    state.safety=root.setTimeout(()=>{if(current===state)tgClose();},state.plan.kind==="final"?FINAL_SAFETY_MS:SEASON_SAFETY_MS);
    let result;try{result=state.plan.proceed();}catch(_error){result=false;}
    Promise.resolve(result).then(value=>{if(value===false&&current===state)tgClose();},()=>{if(current===state)tgClose();});
  }
  // The tapped button, let through once exactly as it was tapped (its own listeners run; this page does not touch it).
  function clickThrough(find){
    const target=find();if(!target||target.disabled||!target.isConnected)return false;
    passing=true;try{target.click();}finally{passing=false;}
    return true;
  }
  // Whether a tap is due a paper is decided from the screen and the verified history alone (no copy needed), so a tap made
  // before the paper's files have arrived is still held for its paper: the files load after the tap (within ASSET_CAP_MS)
  // and the paper is built then. Only if they cannot load, or the paper cannot be built, does the tap simply go on.
  function seasonKey(input){const facts=input&&readHistory(input.projection,input.seasonNumber);return facts&&input.seasonNumber<facts.totalSeasons?`${facts.rivalryId}|season|${input.seasonNumber}`:null;}
  function finalKey(input){
    if(!input)return null;const T=input.projection.totalSeasons,facts=readHistory(input.projection,T);if(!facts||facts.seasons.length!==T)return null;
    const totals=totalsOf(facts.seasons),W=totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":"draw",final=input.final;
    if(plain(final)){if({daniel:"playerOne",nik:"playerTwo",draw:"draw"}[final.winner]!==W)return null;if(plain(final.totals)&&(final.totals.daniel!==totals.playerOne||final.totals.nik!==totals.playerTwo))return null;}
    return `${facts.rivalryId}|final|${T}`;
  }
  function planFor(button){
    if(activeScreen()!=="seasonEntry")return null;
    const host=root.document.getElementById("seasonEntry");if(!host||host.classList.contains("hidden")||!host.contains(button))return null;
    if(button.id==="sharedMultiSeasonContinueAction"){
      const progression=root.CareerModeProductionSharedMultiSeasonProgression;
      if(button.disabled||!progression||typeof progression.canContinue!=="function"||!progression.canContinue())return null;
      const history=tgState("CareerModeProductionSharedHistoryConvergence"),rivalryId=history?.rivalryId||history?.projection?.rivalryId;
      const input=seasonInput({history,specialPlayers:tgSpecial(rivalryId)}),key=seasonKey(input);if(!key||seen(key))return null;
      return {kind:"season",key,button,build:()=>seasonEdition(input),proceed:()=>typeof progression.continueToNextSeason==="function"?progression.continueToNextSeason():clickThrough(()=>root.document.getElementById("sharedMultiSeasonContinueAction"))};
    }
    const finalStage=button.closest(".v10FinalStage");
    if(finalStage&&host.classList.contains("v10FinalMode")&&!button.disabled&&(button.id==="finalWinnerRematch"||button.classList.contains("backButton"))){
      const final=root.FINAL_WINNER_FIXTURES?.frames?.LIVE||null,history=root.CareerModeSeasonFinalV10?.gazetteHistory?.()||null;
      const input=finalInput({final,history}),key=finalKey(input);if(!key||seen(key))return null;
      const rematch=button.id==="finalWinnerRematch";
      return {kind:"final",key,button,build:()=>finalEdition(input),proceed:()=>clickThrough(()=>rematch?root.document.getElementById("finalWinnerRematch"):(button.isConnected?button:root.document.querySelector("#seasonEntry .seasonEntryActions .backButton")))};
    }
    return null;
  }
  // The files, then the paper, then its pictures, all inside the cap: resolves true only when the paper is ready to show.
  function tgReady(plan){
    const work=loadAssets().then(()=>{const edition=plan.build();if(!edition||edition.key!==plan.key)return false;plan.edition=edition;return Promise.all(edPictures(edition).map(decode)).then(()=>true);}).then(value=>value===true,()=>false);
    return Promise.race([work,new Promise(resolve=>root.setTimeout(()=>resolve(false),ASSET_CAP_MS))]);
  }
  function onClick(event){
    if(passing)return;
    const button=event.target?.closest?.("button");if(!button)return;
    if(current&&current.page.contains(button))return;
    if(opening){if(button===opening.button){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();}return;}
    if(current)return;
    let plan=null;try{plan=planFor(button);}catch(_error){plan=null;}
    if(!plan)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
    opening=plan;
    tgReady(plan).then(ready=>{
      opening=null;
      // The player went somewhere else meanwhile: nothing happens. Files or paper not ready: the tap goes on as before.
      if(activeScreen()!=="seasonEntry"||!plan.button.isConnected&&plan.kind==="season")return;
      if(!ready||!plan.edition||!root.ShowdownContent?.frontPage){void Promise.resolve().then(()=>plan.proceed()).catch(()=>{});return;}
      let shown=false;try{shown=tgRender(plan);}catch(_error){shown=false;tgClose();}
      if(shown)markSeen(plan.key);else void Promise.resolve().then(()=>plan.proceed()).catch(()=>{});
    });
  }
  function onScreen(event){const screen=event?.detail?.screen??activeScreen();if(current&&screen!=="seasonEntry")tgClose();}
  // Warm the page's files while Season Results or Final Winner is up, so the paper is ready the moment it is tapped.
  let warmTimer=null;
  function warm(){
    if(warmTimer||activeScreen()!=="seasonEntry")return;
    warmTimer=root.setTimeout(()=>{warmTimer=null;if(activeScreen()!=="seasonEntry")return;
      const history=tgState("CareerModeProductionSharedHistoryConvergence");
      if(history?.phase==="HISTORY_CONVERGED"||root.document?.getElementById("seasonEntry")?.classList.contains("v10FinalMode"))loadAssets().catch(()=>{});
    },400);
  }
  function tgInstall(){
    if(installed||!root.document||typeof root.addEventListener!=="function")return installed;
    installed=true;
    // Window capture runs before the game's own document listeners, so the tap reaches the Gazette first.
    root.addEventListener("click",onClick,true);
    root.document.addEventListener("career-mode-screen-shown",onScreen);
    for(const e of ["career-mode-shared-history-convergence-state-change","career-mode-shared-final-reconciliation-state-change","career-mode-shared-terminal-close-state-change"])root.addEventListener(e,warm);
    root.document.addEventListener("career-mode-screen-shown",warm);
    return true;
  }
  // Proof and test hook: draws an edition on the current Season Results screen exactly as a tap would.
  function showForProof(edition,proceedFn){return within(tgPrepare(edition),ASSET_CAP_MS).then(ready=>ready&&tgRender({kind:edition.kind,edition,button:null,proceed:proceedFn||(()=>false)}));}

  return Object.freeze({contractVersion:1,feature:"r87-touchline-gazette",firestoreReads:0,firestoreWrites:0,SEEN_KEY,FONT_FILES,hash:tgHash,fill,seasonSituations:(projection,N)=>{const f=readHistory(projection,N);return f?seasonSituations(f,N):null;},seasonEdition,finalEdition,seasonInput,finalInput,paperText,planFor,install:tgInstall,showForProof,isOpen:()=>Boolean(current),close:tgClose});
});
