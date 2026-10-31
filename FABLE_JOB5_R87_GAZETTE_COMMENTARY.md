# Fable job 5: r87 Touchline Gazette and Commentary bug hunt (Career Mode Showdown 2.0.0)

Code snapshot: gameplay/r87 @ 73713d75b, repo nikahanghojjati-oss/fifa17-career-showdown2. The full source of every code file in scope is below this brief; the three big copy files are shown as excerpts (their row shapes are complete). You cannot run code here, so reason carefully and show your trace.

## The product
A private two-player FIFA 17 Career Mode competition web app (vanilla JS, Firebase Firestore on the free Spark plan, GitHub Pages, a service worker). Two managers, Daniel (playerOne) and Nik (playerTwo), each on his own phone or laptop, play a "Showdown" of 1, 3, 5 or 10 seasons. Each season each manager scores 0-11 Showdown points: Champions League +5 or Europa League +3 (never both in the same season), league title +3, domestic cup +1, one shared +1 for 100 league points and/or 100 league goals (performance bonus), one shared +1 for Top Scorer and/or Top Assist (awards bonus). Equal season scores are a DRAW; equal Showdown totals are level. **No tiebreak anywhere; league position never decides a winner.** A **Golden Showdown** is 110 points in a 10-season Showdown (the maximum). Each manager has one **Special Player** (always called "Special Player" or "SP" on screen, never "Marquee").

## The area you own (new in r87)
1. **Touchline Gazette** (js/touchlineGazette.js, Team V's newspaper renderer visual-assets/v10_1/content/frontpage.js, css/v10Gazette.css, copy in data/gazetteCopy.js and headlines in data/frontPages.js).
   - SEASON edition: after a season's Season Results, when the player taps CONTINUE TO SEASON N+1; the paper's own CONTINUE then runs exactly what that tap ran (js/productionSharedMultiSeasonProgression.js continueToNextSeason).
   - FINAL edition: after Final Winner, when the player leaves it (BACK TO SHOWDOWN HOME or REMATCH); its CONTINUE then lets that same click through.
   - It installs from js/seasonFinalV10.js. It reads nothing from Firebase and writes nothing: every word comes from the converged Shared History projection, the Final Winner frame and the Special Player chip. Text is chosen by a hash of the Showdown id, the edition and the season, so **both phones must print the identical paper**. A paper already shown on this phone is not shown again (local list careerModeShowdown.gazetteSeen.v1). If its files cannot load within a few seconds the tap goes on as before, so the Gazette can never hold anyone up.
2. **Commentary v2** (js/commentaryEngine.js, data/commentarySituations.json with 88 exact situations, ~5,100 lines in data/commentaryLines.js). The engine decides which situations are true for a season or a Showdown and fills the line's slots. Owner rule: **every line must match what happened.** Note: on this snapshot no screen loads commentaryEngine.js yet; judge the engine as it will be wired (a thin strip under the season scores on Season Results and one line on Final Winner), and say so in a separate note if you believe something the owner expects is missing.

## House rules (a break is a bug)
- No tiebreak; a draw is never told as a win, a 1-point win never as a big win, a season with no trophy never talks about silverware, a final page never talks about "next season".
- Never print a raw `{placeholder}`, "undefined", "NaN", "1 points", a wrong name, a wrong club, a wrong season number or a wrong total.
- Reus Gate: the loading screen stays until the next screen is ready; no half-drawn paper, no flash of an old design, no flash of the Season Results screen behind the paper. **Never dim the screen.** Nothing covers anything at any size (phone 360-430 px wide, sideways phones, tablets, desktop 1280-1920).
- Never skip, hide or reorder a needed screen; the Gazette must never block or replace the CONTINUE / BACK / REMATCH action it sits in front of, and must never let it run twice.

## Threat model
Normal play only: two honest players, reloads, phone locks (iPhone Safari evicts pages), offline/online, slow networks, two tabs, one phone a step ahead of the other, a service-worker upgrade with one phone a build behind, old Showdowns from earlier builds (r79-r86 saves, 1/3/5/10 seasons, early-ended Showdowns). Out of scope: a modified app, the console, direct database writes.

## Already known (do not re-report)
- "A fast tap is held for its paper; browser journeys tap through it" was fixed in 88b67ade7 (on this snapshot). Do report any remaining way the tap is lost, doubled or run before the paper is closed.
- The roulette, transfer window and career-screen numbers have their own hunts.

## Your job
Work as the senior engineer who owns "the paper and the commentary are always true, identical on both phones, and never get in the way". Read every file below in full.

Reply 1 (this message):
1. **Flow:** walk the SEASON edition for seasons 1, 2 and 9 of a 10-season Showdown and the FINAL edition for 1, 3, 5 and 10-season Showdowns (including an early-ended one and a Golden one), from both phones. At each step ask: what if this phone reloads here, locks, goes offline, is a step ahead or behind, opens a second tab, double-taps, or the assets load slowly or fail? Report any lost, doubled or blocked CONTINUE/BACK/REMATCH, any paper that differs between the phones, any paper shown twice or never, any stuck screen, flash or dimming.
2. **Truth:** for each situation the engine or the Gazette can pick, check that its trigger matches the words in the excerpt rows (margins, draws, trophies, EL vs CL, Golden, comebacks, leads, final vs season). Find any input where a false situation is picked, a true one is missed, a slot is filled with the wrong value or the wrong manager, or the totals/seasons on the paper disagree with the projection. Try edges: 0-0 seasons, 11-11, a draw season inside a won Showdown, a level Showdown, a 1-season Showdown, the last season of 10, Special Player missing, a club name with an apostrophe or accent.
3. **Layout and render:** anything in the renderer or CSS that can overflow, cover a control, cut text, or show an old design on a phone or desktop.

For each finding: ID (F5-NN), severity (P0 lost or doubled result / stuck screen, P1 wrong or different paper, wrong line, blocked tap a player will hit, P2 rare, P3 polish), file:line (quote the code so it can be found by text), exact steps on the two phones (or the exact input projection), expected vs actual, and your trace. Put anything you are not sure of in a separate "suspected" list. No style notes. End with the top 5 to fix first.

Keep the visible reply under about 60,000 characters.


## FILE: js/touchlineGazette.js
```javascript
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
        inside:[],specialPlayers:spOf(specialPlayers)
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
    const golden=!draw&&T===GOLDEN.seasons&&totals[W]>=GOLDEN.points;
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
    else{numbers=[{label:"Champions Leagues",left:r1.cl,right:r2.cl}];if(r1.el||r2.el)numbers.push({label:"Europa Leagues",left:r1.el,right:r2.el});numbers.push({label:"League titles",left:r1.league,right:r2.league},{label:"Domestic cups",left:r1.cup,right:r2.cup},{label:"Seasons won",left:r1.wins,right:r2.wins},{label:"Best season",left:r1.best,right:r2.best});}
    numbers.push({label:"Overall",left:totals.playerOne,right:totals.playerTwo,total:true});
    // Trophy desk: the Showdown trophy for the winner (none on a draw), and each other manager's biggest prize of the Showdown.
    const showdownItems=role=>{const r=rec(role);return {"champions-league":r.cl>0,"europa-league":r.el>0,"league-title":r.league>0,"domestic-cup":r.cup>0,"performance-bonus":facts.seasons.some(s=>s.items[role]["performance-bonus"]),"awards-bonus":facts.seasons.some(s=>s.items[role]["awards-bonus"])};};
    const briefs=draw?ROLES.map((role,i)=>briefFor(walk,"brief"+i,role,showdownItems(role),facts.clubs,true))
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
        inside:[],specialPlayers:spOf(specialPlayers)
      },
      ids:{headline:head.id,story:story.id,briefs:briefs.map(b=>b.id)}
    });
  }

  // Every word a paper prints (for the contracts: no braces, no "Marquee", the same on both phones).
  function paperText(edition){
    const p=edition?.paper;if(!p)return "";
    return [p.kicker,p.headline,p.subhead,p.season,p.dateline,p.edition,p.issue,...p.ears,p.left.name,p.left.club,p.right.name,p.right.club,p.photo.caption,p.photo.credit,p.story.byline,...p.story.paragraphs,p.numbersTitle,...p.numbers.map(n=>`${n.label} ${n.left} ${n.right}`),p.quote?.text,p.quote?.who,p.portrait?.caption,...p.briefs.map(b=>`${b.head} ${b.text}`),...p.inside,p.specialPlayers?`Special Players ${p.specialPlayers.daniel} ${p.specialPlayers.nik}`:""].filter(x=>x!==null&&x!==undefined).join("\n");
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
    const paper=page.querySelector(".cmx-paper");if(paper)addSpecialPlayers(paper,plan.edition.paper.specialPlayers,doc);
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

```


## FILE: visual-assets/v10_1/content/frontpage.js
```javascript
/* HO-036 front pages, Touchline Gazette full edition (HO-041). Skin only.
   ShowdownContent.frontPage.paper(p)  -> newspaper element
     p = {headline, subhead, kicker?, variant: "season"|"gold"|"draw", season, edition, dateline,
          left:{name, club, score}, right:{name, club, score}, caption,
          issue?, ears?:[left, right], photo?:{src, caption, credit}, story?:{byline, paragraphs:[]},
          numbers?:[{label, left, right}], quote?:{text, who}, portrait?:{src, caption},
          briefs?:[{head, text, trophy?}], inside?:[text], compact?: true|"short"}
     compact is the phone edition; "short" drops the lead photo for the trophy brief, for plates whose faces sit low (Final Winner).
     Every extra is optional: without them the paper is the round 2 front page.
   ShowdownContent.frontPage.screen(slot, p, onContinue) -> a front page on its own page (season or final), with Continue
   ShowdownContent.frontPage.art(name) -> url of a Gazette photo or trophy (GZ_LEAD_SEASON, TRO_LEAGUE_TITLE ...)
   The paper only lives on its own page: never on Legacy, never over a panel or a button.
   Photos are cut from the approved plates (gazette/), trophies are the shared trophy art; no player photos.
   Crests come from window.getClubCrestSvg (js/visualIdentity.js) when it is loaded. */
(function (root) {
  "use strict";
  var NS = root.ShowdownContent = root.ShowdownContent || {};
  var MAST = "The Touchline Gazette";
  var me = root.document && root.document.currentScript;
  var BASE = me && me.src ? me.src.replace(/[^/]*$/, "") : "";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var crest = function (club) {
    try { return root.getClubCrestSvg ? root.getClubCrestSvg(club) : ""; } catch (e) { return ""; }
  };
  var reduce = function () { return root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches; };

  function art(name) {
    return /^TRO_/.test(name) ? BASE + "../shared/trophies/" + name + "_V1_512.webp" : BASE + "gazette/" + name + ".webp";
  }

  function side(s, cls) {
    s = s || {};
    return '<div class="cmx-paper__side ' + cls + '"><span class="cmx-paper__crest">' + crest(s.club) + '</span>' +
      '<span class="cmx-paper__who">' + esc(s.name) + '<small>' + esc(s.club) + '</small></span></div>';
  }
  function img(src, cls, alt) { return src ? '<img class="' + cls + '" src="' + esc(src) + '" alt="' + esc(alt || "") + '" decoding="async">' : ""; }

  function scoreStrip(p) {
    var hasScore = p.left && p.right && p.left.score != null && p.right.score != null;
    return p.left && p.right ? '<div class="cmx-paper__photo">' + side(p.left, "cmx-paper__side--dan") +
      '<span class="cmx-paper__score">' + (hasScore ? esc(p.left.score) + " – " + esc(p.right.score) : "") + '</span>' +
      side(p.right, "cmx-paper__side--nik") + '</div>' : "";
  }

  function leadPhoto(p) {
    var ph = p.photo;
    if (!ph || !ph.src) return "";
    return '<figure class="cmx-gz__lead">' + img(ph.src, "cmx-gz__leadimg", ph.caption) + scoreStrip(p) +
      '<figcaption class="cmx-gz__cap">' + esc(ph.caption || p.caption || "") + '<span>' + esc(ph.credit || "Gazette photo") + '</span></figcaption></figure>';
  }

  function story(p) {
    var s = p.story;
    if (!s || !s.paragraphs || !s.paragraphs.length) return "";
    return '<div class="cmx-gz__story">' + (s.byline ? '<p class="cmx-gz__byline">' + esc(s.byline) + '</p>' : "") +
      '<div class="cmx-gz__text">' + s.paragraphs.map(function (t, i) { return '<p' + (i === 0 ? ' class="cmx-gz__first"' : "") + '>' + esc(t) + '</p>'; }).join("") + '</div></div>';
  }

  function side2(p) { // beside the lead photo: the numbers table, then the pull quote
    var out = "";
    if (p.numbers && p.numbers.length && p.left && p.right) {
      out += '<section class="cmx-gz__box"><h4>' + esc(p.numbersTitle || "Season in numbers") + '</h4><table class="cmx-gz__nums"><thead><tr><th></th><th>' + esc(p.left.name) + '</th><th>' + esc(p.right.name) + '</th></tr></thead><tbody>' +
        p.numbers.map(function (r) { return '<tr' + (r.total ? ' class="is-total"' : "") + '><td>' + esc(r.label) + '</td><td>' + esc(r.left) + '</td><td>' + esc(r.right) + '</td></tr>'; }).join("") + '</tbody></table></section>';
    }
    if (p.quote && p.quote.text) out += '<blockquote class="cmx-gz__quote"><p>“' + esc(p.quote.text) + '”</p><cite>' + esc(p.quote.who || "") + '</cite></blockquote>';
    return out ? '<aside class="cmx-gz__side">' + out + '</aside>' : "";
  }
  function portrait(p) {
    return p.portrait && p.portrait.src ? '<figure class="cmx-gz__portrait">' + img(p.portrait.src, "", p.portrait.caption) + '<figcaption>' + esc(p.portrait.caption || "") + '</figcaption></figure>' : "";
  }

  function briefs(p) {
    if (!p.briefs || !p.briefs.length) return "";
    return '<section class="cmx-gz__desk"><h4>' + esc(p.deskTitle || "Trophy desk") + '</h4><div class="cmx-gz__briefs">' +
      p.briefs.map(function (b) {
        return '<article class="cmx-gz__brief">' + (b.trophy ? img(b.trophy, "cmx-gz__tro", "") : '<span class="cmx-gz__tro cmx-gz__tro--crest">' + crest(b.club) + '</span>') +
          '<div><h5>' + esc(b.head) + '</h5><p>' + esc(b.text) + '</p></div></article>';
      }).join("") + '</div></section>';
  }

  function inside(p) {
    if (!p.inside || !p.inside.length) return "";
    return '<div class="cmx-gz__inside"><b>Inside today</b>' + p.inside.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join("") + '</div>';
  }

  function paper(p) {
    p = p || {};
    var el = document.createElement("article");
    var v = p.variant || "season";
    var full = !!(p.photo || p.story);
    el.className = "cmx cmx-paper" + (v === "gold" ? " cmx-paper--gold" : v === "draw" ? " cmx-paper--draw" : "") + (full ? " cmx-gz" : "") + (p.compact ? " cmx-gz--compact" : "") + (p.compact === "short" ? " cmx-gz--short" : "");
    var ears = p.ears && p.ears.length ? p.ears : null;
    var mast = '<h2 class="cmx-paper__masthead">' + esc(p.masthead || MAST) + '</h2>';
    var head =
      '<div class="cmx-paper__dateline"><span>' + esc(full ? (p.issue || p.dateline || "Showdown edition") : (p.dateline || "Showdown edition")) + '</span><span>' + esc(p.season || "") + '</span><span>' + esc(p.edition || "Price: one point") + '</span></div>' +
      (full && ears ? '<div class="cmx-gz__mastrow"><p class="cmx-gz__ear">' + esc(ears[0]) + '</p>' + mast + '<p class="cmx-gz__ear">' + esc(ears[1] || "") + '</p></div>' : mast) +
      '<div class="cmx-paper__rules"></div>' +
      (full ? '<p class="cmx-gz__edline">' + esc(p.dateline || "Showdown edition") + '</p>' : "");
    if (!full) {
      var cols = "";
      for (var c = 0; c < 3; c++) { cols += "<div>"; for (var r = 0; r < 6; r++) cols += "<i></i>"; cols += "</div>"; }
      el.innerHTML = head +
        (p.kicker ? '<span class="cmx-paper__kicker">' + esc(p.kicker) + '</span>' : "") +
        '<h3 class="cmx-paper__headline' + (p.headline.length > 24 ? ' cmx-paper__headline--long' : '') + '">' + esc(p.headline) + '</h3>' +
        '<p class="cmx-paper__subhead">' + esc(p.subhead) + '</p>' + scoreStrip(p) +
        (p.caption ? '<p class="cmx-paper__caption">' + esc(p.caption) + '</p>' : "") +
        '<div class="cmx-paper__cols" aria-hidden="true">' + cols + '</div>';
    } else {
      el.innerHTML = head +
        '<div class="cmx-gz__top">' + (p.kicker ? '<span class="cmx-paper__kicker">' + esc(p.kicker) + '</span>' : "") +
        '<h3 class="cmx-paper__headline' + (p.headline.length > 24 ? ' cmx-paper__headline--long' : '') + '">' + esc(p.headline) + '</h3>' +
        '<p class="cmx-paper__subhead">' + esc(p.subhead) + '</p></div>' +
        '<div class="cmx-gz__front">' + (p.photo && p.photo.src ? leadPhoto(p) : scoreStrip(p)) + side2(p) + '</div>' +
        '<div class="cmx-gz__body">' + story(p) + portrait(p) + '</div>' + briefs(p) + inside(p);
    }
    el.setAttribute("aria-label", (p.kicker ? p.kicker + ". " : "") + p.headline + ". " + p.subhead);
    return el;
  }

  function screen(slot, p, onContinue, opts) {
    opts = opts || {};
    slot.innerHTML =
      '<section class="cmx cmx-fp-screen"><p class="cmx-fp-screen__eyebrow">' + esc(opts.eyebrow || "Season front page") + '</p>' +
      '<h1 class="cmx-fp-screen__title">' + esc(opts.title || "Read all about it") + '</h1>' +
      '<div class="cmx-fp-screen__desk"></div>' +
      '<button type="button" class="cmx-continue">' + esc(opts.button || "Continue") + '</button></section>';
    var pp = paper(p);
    if (!reduce() && !opts.still) pp.classList.add("is-dropping");
    slot.querySelector(".cmx-fp-screen__desk").appendChild(pp);
    slot.querySelector(".cmx-continue").addEventListener("click", function () { if (onContinue) onContinue(); });
    return slot.firstChild;
  }

  NS.frontPage = { paper: paper, screen: screen, art: art };
})(typeof window !== "undefined" ? window : this);

```


## FILE: css/v10Gazette.css
```css
/* r87 Touchline Gazette page (js/touchlineGazette.js). Team V's newspaper (visual-assets/v10_1/content/content.css,
   HO-041) on its own page inside the Season Results screen: after a season's results (CONTINUE TO SEASON N+1) and
   after Final Winner. While it is up, the page replaces the screen's stage (nothing is laid over anything, no dimming),
   and it sits on the same black-and-gold plate the screen just showed (already loaded: no new plate download).
   Layout as Team V's frames FP1-FP3 and FW1-FW2: desktop paper 540px between the managers, phone edition under the
   faces, one CONTINUE below the paper. */

#app #seasonEntry[data-gazette] > :not(#touchlineGazette) { display: none !important; }
#app #seasonEntry[data-gazette] {
  position: relative !important; inset: auto !important; height: auto !important; min-height: 0 !important;
  padding: 0 !important; margin: 0 !important; background: #07080a !important;
}
/* the page is the window's own scroller at every size (as the Season Results screen is), whatever the Final Winner's
   desktop or phone frame had set on it */
html[data-gazette] #app main:has(#seasonEntry[data-gazette]:not(.hidden)) {
  position: fixed !important; inset: 0 !important; height: 100svh !important; height: 100dvh !important;
  padding: 0 !important; margin: 0 !important; overflow-x: hidden !important; overflow-y: auto !important;
  background: #07080a !important;
}

#touchlineGazette.tgzPage {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-height: 100svh;
  min-height: 100dvh;
  background-color: #07080a;
  background-image: var(--tgz-plate-desktop);
  background-repeat: no-repeat;
  background-position: 50% 50%;
  background-size: cover;
  overflow-x: clip;
}
#touchlineGazette .cmx-fp-screen {
  min-height: inherit;
  /* the top bar stays fixed over the page on desktop: the paper starts below it */
  padding: calc(var(--sd-nav-top-h, 52px) + 16px) 20px 28px;
  background: none;
  justify-content: flex-start;
}
#touchlineGazette .cmx-fp-screen__eyebrow {
  margin: 0 0 14px;
  padding: 6px 14px 5px;
  background: #07080a;
  box-shadow: inset 0 0 0 1px rgba(212, 160, 23, .55);
  text-align: center;
}
#touchlineGazette .cmx-fp-screen__desk { width: min(540px, 100%); }
#touchlineGazette .cmx-paper { width: 100%; will-change: transform; }
#touchlineGazette .cmx-continue { margin-top: 18px; min-width: 274px; min-height: 52px; }
#touchlineGazette .cmx-continue:disabled { cursor: progress; }
/* the paper is generous with box-shadow on its own; the desk shadow below it is plain paint, not a scrim */
#touchlineGazette .cmx-fp-screen__desk::after { z-index: 0; }

/* Special Players line under the score strip */
#touchlineGazette .tgz-sp {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px 10px;
  margin: 4px 0 0;
  font: 600 10.5px/1.25 var(--sd-font-condensed, "Barlow Condensed", sans-serif);
  letter-spacing: .04em;
  color: #2a241c;
}
#touchlineGazette .tgz-sp b { letter-spacing: .18em; text-transform: uppercase; }
#touchlineGazette .tgz-sp span + span::before { content: "·"; margin-right: 10px; }
#touchlineGazette .cmx-gz--compact .tgz-sp { font-size: 9.5px; margin-top: 3px; }

/* Phones and narrow windows: the phone plate, the phone edition starting under the managers' faces (Team V's face-safe
   lines: 168px of 393 on a season page, 258px of 393 on the final page, where the faces sit lower). */
@media (max-width: 700px), (max-height: 520px) and (max-width: 1000px) {
  #touchlineGazette.tgzPage {
    background-image: var(--tgz-plate-phone);
    background-position: 50% 0;
    background-size: 100% auto;
  }
  #touchlineGazette .cmx-fp-screen { padding: calc(100vw * 168 / 393) 10px 16px; }
  #touchlineGazette.tgzPage--final .cmx-fp-screen { padding-top: calc(100vw * 258 / 393); }
  #touchlineGazette .cmx-fp-screen__eyebrow { display: none; }
  #touchlineGazette .cmx-fp-screen__desk { width: 100%; }
  #touchlineGazette .cmx-continue { width: 100%; min-width: 0; margin-top: 14px; }
}
/* short phones (393x660, 360x640, 375x553): the paper starts just under the chins (not the shoulders) so the paper and
   CONTINUE stay on the screen without covering a face */
@media (max-width: 700px) and (max-height: 680px) {
  #touchlineGazette .cmx-fp-screen { padding-top: calc(100vw * 140 / 393); }
  #touchlineGazette.tgzPage--final .cmx-fp-screen { padding-top: calc(100vw * 236 / 393); }
}
@media (prefers-reduced-motion: reduce) {
  #touchlineGazette .cmx-paper { will-change: auto; }
}

```


## FILE: js/productionSharedMultiSeasonProgression.js
```javascript
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedMultiSeasonProgression=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  const ACTION_ID="sharedMultiSeasonContinueAction";
  const STATUS_ID="sharedMultiSeasonProgressionStatus";
  let installed=false,busy=false,provider=null,setupApi=null,historyApi=null,view=null,contextKey="",refreshPromise=null,exposedKey="",exposedSeason=0,dashboardObserver=null,wakePending=false,announcedKey="";
  let lastErrorCode="",lastErrorKey="",heldErrorKey="";

  function pmspFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pmspShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pmspSharedMarker(){const showdown=pmspShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pmspField(id){return root.document&&root.document.getElementById(id);}
  function pmspText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function pmspHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pmspDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
  function pmspReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pmspLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pmspEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await pmspLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pmspLoadScript("ssjr-production-history-convergence","js/productionSharedHistoryConvergence.js",()=>root.CareerModeProductionSharedHistoryConvergence);
    await pmspLoadScript("ssjr-multi-season-protocol","js/sharedMultiSeasonProgression.js",()=>root.CareerModeSharedMultiSeasonProgression);
    await pmspLoadScript("ssjr-multi-season-provider","js/sparkSharedMultiSeasonProgression.js",()=>root.CareerModeSparkSharedMultiSeasonProgression);
    await pmspLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;historyApi=root.CareerModeProductionSharedHistoryConvergence;provider=root.CareerModeSparkSharedMultiSeasonProgression;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pmspFail("MULTI_SEASON_SETUP_UNAVAILABLE");
    if(!historyApi||typeof historyApi.refresh!=="function"||typeof historyApi.getState!=="function")pmspFail("MULTI_SEASON_HISTORY_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function")pmspFail("MULTI_SEASON_PROVIDER_UNAVAILABLE");
  }
  function pmspSetupState(){try{return (setupApi||root.CareerModeProductionSharedShowdownSetup)?.getState?.()||null;}catch(_error){return null;}}
  function pmspConfirmedSetupRivalry(s){return s&&s.ready===true&&s.setup&&s.setup.phase==="SHOWDOWN_CONFIRMED"&&s.setup.revision===6&&s.rivalryId?String(s.rivalryId):"";}
  function pmspRivalryId(){const showdown=pmspShowdown(),setup=pmspSetupState();return String(showdown?.sharedJourney?.rivalryId||pmspConfirmedSetupRivalry(setup)||"").trim();}
  function pmspContextKey(rivalryId){const showdown=pmspShowdown(),saveId=String(showdown?.id||showdown?.saveId||"").trim();return `${saveId||"shared"}|${rivalryId}|multi-season`;}
  // r80: the season cursor and the provider view belong to one save shell AND one rivalry. Keyed by the rivalry alone, a new
  // Showdown's shell (its marker has no rivalry id yet) read the rivalry of the Setup still held in memory: on the phone that
  // tapped END SHOWDOWN that is the ended Showdown's confirmed Setup (nothing refreshes it), so the new Showdown got the ended
  // one's cursor and view and read "Season 2 / 3" before its first season. A new shell now always starts at season 1.
  function pmspEnsureCursor(){
    if(!pmspSharedMarker())return null;
    const rivalryId=pmspRivalryId();if(!rivalryId)return null;
    const key=pmspContextKey(rivalryId);
    if(exposedKey!==key){exposedKey=key;exposedSeason=1;view=null;contextKey="";}
    if(!Number.isInteger(exposedSeason)||exposedSeason<1)exposedSeason=1;
    return exposedSeason;
  }
  function pmspFallbackSeason(value){const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=10?n:null;}
  function pmspResolveSeason(fallback=null){
    const local=pmspFallbackSeason(fallback??pmspShowdown()?.currentRound);if(!pmspSharedMarker())return local;
    const rivalryId=pmspRivalryId();pmspEnsureCursor();const authoritative=Boolean(view&&view.ok===true&&view.authoritative===true&&view.state&&String(view.rivalryId||"")===rivalryId);
    return authoritative?(pmspEnsureCursor()||local):local;
  }
  function pmspRequest(){
    const rivalryId=pmspRivalryId();
    if(!pmspSharedMarker()||!rivalryId)return null;pmspEnsureCursor();return Object.freeze({rivalryId,key:pmspContextKey(rivalryId)});
  }
  function pmspContextMatches(request){const current=pmspRequest();return Boolean(request&&current&&request.key===current.key);}
  async function pmspProviderOptions(request){
    if(!request||!pmspContextMatches(request))pmspFail("MULTI_SEASON_CONTEXT_STALE");
    const setup=pmspSetupState();if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.rivalryId||!setup.sessionId||!setup.deviceId||!setup.accountId||!setup.managerRole)pmspFail("MULTI_SEASON_SETUP_NOT_CONFIRMED");
    if(String(setup.rivalryId)!==request.rivalryId)pmspFail("MULTI_SEASON_RIVALRY_MISMATCH");
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await root.CareerModeProductionFirebaseRuntime.ensureAccountServices());
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pmspFail("MULTI_SEASON_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    if(services.auth.currentUser.uid!==setup.accountId)pmspFail("MULTI_SEASON_AUTHORITY_MISMATCH");
    return Object.freeze({user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,nowEpochMs:Date.now()});
  }
  function pmspResult(result){if(result&&result.ok===true&&result.authoritative===true&&result.state)return result;const error=new Error("Shared Multi Season progression could not be verified.");error.code=result?.code||"MULTI_SEASON_PROVIDER_FAILED";throw error;}
  function pmspManagerName(role){const value=pmspShowdown()?.managers?.[role];return String(value||(role==="playerOne"?"Manager 1":"Manager 2"));}
  function pmspLeagueName(id){try{const league=typeof root.getLeagueById==="function"?root.getLeagueById(id):null;if(league?.name)return league.name;}catch(_error){}return String(id||"League").replaceAll("_"," ").replaceAll("-"," ").replace(/\b\w/g,char=>char.toUpperCase());}
  function pmspDashboardProjection(){
    const state=view?.state,dashboard=view?.dashboard;if(!state||!dashboard||!Number.isInteger(dashboard.acceptedSeasons)||dashboard.acceptedSeasons!==state.acceptedSeasons||!dashboard.managerTotals)return null;
    const p1=Number(dashboard.managerTotals.playerOne),p2=Number(dashboard.managerTotals.playerTwo);if(!Number.isInteger(p1)||p1<0||!Number.isInteger(p2)||p2<0)return null;
    if(dashboard.acceptedSeasons===0&&dashboard.lastSeason!==null)return null;
    if(dashboard.acceptedSeasons>0&&Number(dashboard.lastSeason?.seasonNumber)!==dashboard.acceptedSeasons)return null;
    return dashboard;
  }
  function pmspDecorateDashboard(){
    if(!pmspSharedMarker()||!pmspEnsureCursor()||!view?.authoritative||!view?.state)return false;
    const setup=pmspSetupState()?.setup,dashboard=pmspDashboardProjection(),state=view.state,screen=pmspField("dashboard");if(!setup||setup.phase!=="SHOWDOWN_CONFIRMED"||!dashboard||!screen)return false;
    const total=Number(state.totalSeasons),accepted=Number(state.acceptedSeasons),cursor=pmspEnsureCursor(),n1=pmspManagerName("playerOne"),n2=pmspManagerName("playerTwo"),p1=dashboard.managerTotals.playerOne,p2=dashboard.managerTotals.playerTwo;
    screen.dataset.sharedDashboardAuthority="true";
    pmspText(pmspField("dashboardShowdownName"),pmspShowdown()?.name||"Showdown");
    pmspText(pmspField("dashboardLeague"),pmspLeagueName(setup.leagueId));
    pmspText(pmspField("dashboardRound"),state.terminal?`All ${total} seasons complete`:`Season ${cursor} of ${total}`);
    pmspText(pmspField("seasonIndicator"),state.terminal?"Showdown Complete":`Season ${cursor} / ${total}`);
    pmspText(pmspField("dashboardStatus"),state.terminal?"SHOWDOWN COMPLETE":`${accepted} OF ${total} SEASONS PLAYED`);
    pmspText(pmspField("dashboardManagerOne"),n1);pmspText(pmspField("dashboardManagerTwo"),n2);
    pmspText(pmspField("dashboardClubOne"),setup.clubs?.playerOne||"Club");pmspText(pmspField("dashboardClubTwo"),setup.clubs?.playerTwo||"Club");
    try{if(typeof root.applyClubIdentity==="function"){root.applyClubIdentity(pmspField("dashboardClubOne"),setup.clubs?.playerOne);root.applyClubIdentity(pmspField("dashboardClubTwo"),setup.clubs?.playerTwo);}}catch(_error){}
    pmspText(pmspField("dashboardScoreOne"),p1);pmspText(pmspField("dashboardScoreTwo"),p2);
    const series=pmspField("dashboardSeriesStatus");if(series){series.classList.remove("series-lead-one","series-lead-two");const lead=p1===p2?"LEVEL":p1>p2?`${n1.toUpperCase()} +${p1-p2}`:`${n2.toUpperCase()} +${p2-p1}`;pmspText(series,lead);if(p1>p2)series.classList.add("series-lead-one");else if(p2>p1)series.classList.add("series-lead-two");}
    const summary=pmspField("dashboardLastSeasonSummary"),last=dashboard.lastSeason;
    if(last&&accepted>0){
      const winner=last.winner==="draw"?"DRAW":`${pmspManagerName(last.winner).toUpperCase()} WON`;
      pmspText(pmspField("dashboardLastSeasonLabel"),accepted===1?"LAST SEASON":`AFTER ${accepted} SEASONS`);
      pmspText(pmspField("dashboardLastSeasonResult"),`Season ${last.seasonNumber} · ${n1} ${last.playerOne.score} - ${n2} ${last.playerTwo.score} · ${winner}`);
      pmspText(pmspField("dashboardPositionOne"),`Last league finish: ${last.playerOne.leaguePosition}`);
      pmspText(pmspField("dashboardPositionTwo"),`Last league finish: ${last.playerTwo.leaguePosition}`);
      pmspHidden(summary,false);
    }else{
      pmspText(pmspField("dashboardPositionOne"),"No season completed");pmspText(pmspField("dashboardPositionTwo"),"No season completed");pmspText(pmspField("dashboardLastSeasonResult"),"—");pmspHidden(summary,true);
    }
    return true;
  }
  function pmspObserveDashboard(){
    if(dashboardObserver||!root.MutationObserver)return;const dashboard=pmspField("dashboard");if(!dashboard)return;
    dashboardObserver=new root.MutationObserver(()=>{if(!dashboard.classList.contains("hidden"))pmspDecorateDashboard();});dashboardObserver.observe(dashboard,{attributes:true,attributeFilter:["class"]});
  }
  function pmspScreenVisible(){const screen=pmspField("seasonEntry"),review=pmspField("seasonReviewPanel");return Boolean(screen&&!screen.classList.contains("hidden")&&review&&!review.classList.contains("hidden"));}
  function pmspHistoryWitnessed(){
    if(!pmspScreenVisible())return false;const season=pmspEnsureCursor(),history=historyApi?.getState?.(),panel=pmspField("sharedHistoryConvergencePanel");
    return Boolean(season&&history&&history.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&Number(history.throughSeason)===season&&history.projection?.acceptedSeasons===season&&panel&&!panel.classList.contains("hidden"));
  }
  function pmspCanContinue(){
    const season=pmspEnsureCursor(),state=view?.state;if(!season||!state||state.terminal||!pmspHistoryWitnessed())return false;
    return Number.isInteger(state.acceptedSeasons)&&state.acceptedSeasons>=season&&season<state.totalSeasons;
  }
  function pmspTerminalWitnessed(){const season=pmspEnsureCursor(),state=view?.state;return Boolean(season&&state?.terminal===true&&state.acceptedSeasons===state.totalSeasons&&season===state.totalSeasons&&pmspHistoryWitnessed());}
  function pmspEnsureUi(){
    const review=pmspField("seasonReviewPanel"),actions=review?.querySelector?.(".seasonReviewActions");if(!review||!actions)return null;
    // r80: the status line belongs to CONTINUE, so it sits inside the action row, first: on phones and at 1920x1080 that row
    // is the docked band, and a line just above the band was under it wherever the page scrolled. Moved only once.
    let status=pmspField(STATUS_ID);if(!status){status=root.document.createElement("p");status.id=STATUS_ID;status.className="seasonReviewWarning sharedMultiSeasonProgressionStatus hidden";}
    let action=pmspField(ACTION_ID);if(!action){action=root.document.createElement("button");action.id=ACTION_ID;action.className="menuButton hidden";action.type="button";actions.prepend(action);}
    if(status.parentNode!==actions)actions.prepend(status);
    return {status,action};
  }
  function pmspRender(){
    const ui=pmspEnsureUi();if(!ui)return false;const season=pmspEnsureCursor(),state=view?.state,visible=Boolean(pmspSharedMarker()&&season&&state&&pmspScreenVisible()&&Number.isInteger(state.acceptedSeasons)&&state.acceptedSeasons>=season);
    pmspHidden(ui.status,!visible);pmspHidden(ui.action,!visible);if(!visible)return false;
    if(pmspTerminalWitnessed()){
      pmspText(ui.status,`ALL ${state.totalSeasons} SEASONS PLAYED · FINAL RESULT NEXT`);pmspText(ui.action,"ALL SEASONS PLAYED ✓");pmspDisable(ui.action,true);return true;
    }
    if(pmspHistoryWitnessed()){
      const next=season+1;pmspText(ui.status,`SEASON ${season} SAVED · CONTINUE TO SEASON ${next}`);pmspText(ui.action,`CONTINUE TO SEASON ${next}`);pmspDisable(ui.action,!pmspCanContinue());return true;
    }
    // Job 33 (R8): the Shared Season Commit status already says SEASON COMMITTED · SCORE BELOW; do not repeat it.
    const commitStatus=pmspField("sharedSeasonCommitStatus"),duplicate=Boolean(commitStatus&&!commitStatus.classList.contains("hidden")&&commitStatus.textContent==="SEASON COMMITTED · SCORE BELOW");pmspHidden(ui.status,duplicate);
    pmspText(ui.status,`SEASON ${season} LOCKED · REVIEW IT BEFORE MOVING ON`);pmspText(ui.action,"WAITING FOR SEASON REVIEW");pmspDisable(ui.action,true);return true;
  }
  async function pmspRefreshNow(request=pmspRequest()){
    if(!request||!pmspSharedMarker())return null;await pmspEnsureDependencies();if(!pmspContextMatches(request))return null;
    await setupApi.refresh();if(!pmspContextMatches(request))return null;
    const result=pmspResult(await provider.read(await pmspProviderOptions(request)));if(!pmspContextMatches(request))return null;
    if(result.runtimeRevision!=="1.9.1-r13"||String(result.rivalryId)!==request.rivalryId||!["SEASON_READY","SHOWDOWN_COMPLETE"].includes(result.phase)||result.state.runtimeRevision!=="1.9.1-r13"||result.state.rivalryId!==request.rivalryId)pmspFail("MULTI_SEASON_PROJECTION_INVALID");
    view=result;contextKey=request.key;const cursor=pmspEnsureCursor();if(cursor>result.state.acceptedSeasons+1)pmspFail("MULTI_SEASON_CURSOR_AHEAD_OF_AUTHORITY");pmspRender();pmspDecorateDashboard();pmspAnnounce(request);return view;
  }
  // r75: once the accepted count or terminal state changes, ask Local Reconciliation to run its automatic final check now. It
  // used to learn about the last accepted season only from unrelated repeated events, which stopped once those cascades
  // were cut, so Final Winner waited for the next 15 s poll. Called once per change, never for an unchanged refresh.
  function pmspAnnounce(request){
    const state=view?.state;if(!state)return;
    const key=`${request.key}|${view.phase}|${state.acceptedSeasons}|${state.totalSeasons}|${state.terminal===true}`;
    if(key===announcedKey)return;announcedKey=key;
    const local=root.CareerModeProductionSharedLocalReconciliation;
    if(state.terminal===true&&local&&typeof local.autoCheck==="function"&&typeof root.setTimeout==="function")root.setTimeout(()=>{try{void local.autoCheck();}catch(_error){}},0);
  }
  function pmspRefresh(){const request=pmspRequest();if(!request)return Promise.resolve(null);if(refreshPromise&&contextKey===request.key)return refreshPromise;contextKey=request.key;busy=true;const current=pmspRefreshNow(request).then(value=>{if(pmspContextMatches(request)){lastErrorCode="";lastErrorKey="";heldErrorKey="";}return value;},error=>{const code=String(error?.code||"MULTI_SEASON_REFRESH_FAILED").replace(/[^A-Za-z0-9_-]/g,"").slice(0,80);if(!pmspContextMatches(request))return null;const key=`${request.key}|${code}`;lastErrorCode=code;if(key!==lastErrorKey&&key!==heldErrorKey){heldErrorKey=key;return null;}heldErrorKey="";if(key!==lastErrorKey)pmspReport("Unable to refresh Shared Multi Season progression",error);lastErrorCode=code;lastErrorKey=key;return null;}).finally(()=>{busy=false;if(refreshPromise===current)refreshPromise=null;pmspRender();if(wakePending){wakePending=false;root.setTimeout?.(pmspWake,0);}});refreshPromise=current;return current;}
  async function pmspAdvance(){
    if(busy&&refreshPromise){try{await refreshPromise;}catch(_error){}}
    if(busy||!pmspCanContinue())return false;const request=pmspRequest();if(!request)return false;const state=view.state,season=pmspEnsureCursor();
    if(season>=state.totalSeasons)return false;exposedSeason=season+1;pmspRender();
    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-season-cursor-change",{detail:{rivalryId:request.rivalryId,previousSeason:season,activeSeason:exposedSeason,acceptedSeasons:state.acceptedSeasons}}));}catch(_error){}
    if(typeof root.navigateTo==="function")await root.navigateTo("dashboard",{addToHistory:false});pmspDecorateDashboard();
    // Job 33 (R2): go straight on to the new season's Shared Transfer Challenge (the same open() the dashboard button runs).
    // Opening is a read plus navigation; Daniel still taps START SHARED 15-MINUTE WINDOW. On failure the dashboard button stays.
    try{const transfer=root.CareerModeProductionSharedTransferChallenge;if(transfer&&typeof transfer.open==="function"){if(typeof transfer.install==="function")transfer.install();await transfer.open();}}catch(_error){}
    return true;
  }
  // Job 19: a fresh runtime starts its page-memory cursor at season 1. After the exact ACTIVE session is
  // re-established, the entry resumes at the provider-authoritative active season (acceptedSeasons+1, or the
  // final season once all are accepted). The cursor only moves forward and never past provider authority.
  async function pmspResumeFromAuthority(){
    if(!pmspSharedMarker())return null;
    let result=await pmspRefresh();if(!result)result=await pmspRefresh();
    const request=pmspRequest(),state=view?.state;
    if(!result||!request||!view||view.authoritative!==true||!state||String(view.rivalryId||"")!==request.rivalryId)return null;
    const total=Number(state.totalSeasons),accepted=Number(state.acceptedSeasons),target=state.terminal===true?total:accepted+1;
    if(!Number.isInteger(total)||!Number.isInteger(accepted)||accepted<0||!Number.isInteger(target)||target<1||target>total)return null;
    const previous=pmspEnsureCursor();
    if(target>previous){
      exposedSeason=target;
      try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-season-cursor-change",{detail:{rivalryId:request.rivalryId,previousSeason:previous,activeSeason:exposedSeason,acceptedSeasons:accepted,resumed:true}}));}catch(_error){}
    }
    pmspRender();pmspDecorateDashboard();
    return Object.freeze({rivalryId:request.rivalryId,season:exposedSeason,acceptedSeasons:accepted,totalSeasons:total,terminal:state.terminal===true});
  }
  function pmspCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||target.id!==ACTION_ID||!pmspSharedMarker())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.disabled)return;void pmspAdvance();}
  // r75: a wake that arrives while a refresh is running (Shared History converging, setup changing) runs once more right
  // after it instead of being dropped until the 15 s poll; the final season reached Final Winner up to 10 s late without it.
  function pmspWake(){if(busy){wakePending=true;return;}if(!pmspSharedMarker()||root.document?.visibilityState==="hidden")return;void pmspRefresh();}
  function pmspInstall(){if(installed)return true;installed=true;if(root.document)root.document.addEventListener("click",pmspCapture,true);pmspObserveDashboard();for(const event of ["career-mode-shared-wait-context-change","career-mode-shared-history-convergence-state-change","career-mode-shared-setup-state-change","career-mode-connected-account-state-change","career-mode-app-check-state-change"]){root.addEventListener?.(event,pmspWake);}root.document?.addEventListener?.("visibilitychange",pmspWake);if(typeof root.setInterval==="function")root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())pmspWake();},POLL_MS);if(typeof root.setTimeout==="function")root.setTimeout(pmspWake,0);return true;}

  return Object.freeze({lastError:()=>lastErrorCode,contractVersion:1,feature:"ssjr-production-shared-multi-season-progression",productionEnabled:true,runtimeRevision:"1.9.1-r13",supportedLengths:Object.freeze([1,3,5,10]),requiresHistoryConvergence:true,requiresVisibleHistoryWitnessBeforeAdvance:true,exactOnceLocalCursor:true,replaysAcceptedSeasonsFromOneOnFreshRuntime:true,resumesAuthoritativeSeasonAfterFreshSession:true,fixedClubs:true,continueOpensNextTransferChallenge:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,install:pmspInstall,refresh:pmspRefresh,getState:()=>view,resolveSeason:pmspResolveSeason,decorateDashboard:pmspDecorateDashboard,canContinue:pmspCanContinue,continueToNextSeason:pmspAdvance,resumeFromAuthority:pmspResumeFromAuthority,isActive:pmspSharedMarker});
});

```


## FILE: js/seasonFinalV10.js
```javascript
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
/* r87 polish: desktop exits are three equal cells (they were 1 / .78 / 1.12 of the row, and BACK TO SHOWDOWN HOME ran past its
   gold edge at 1366x768 and 1920x1080). A label too long for its cell breaks onto two balanced lines, as REMATCH does. */
@media (min-width:1200px) and (min-height:600px) {
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions > button {
  flex:1 1 0;min-width:0;padding:0 10px;white-space:normal;text-wrap:balance;overflow-wrap:normal;word-break:normal;line-height:1.1;
 }
 #app #seasonEntry.v10FinalMode #stage-root .finalWinnerActionsSlot .v10FinalExit .seasonEntryActions > #finalWinnerRematch { flex:1 1 0;white-space:nowrap; }
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
  let sfGazetteHistory=null;
  function seasonSource(){
    const s=sfSnapshot(),live=sfRetainHistory(s.history),closed=s.terminalClose?.phase==="CLOSED"?s.terminalClose:null;
    const history=closed?.terminal===true?(sfConverged(live,closed)?live:sfConverged(retainedHistory,closed)?retainedHistory:sfClosedHistory(closed.rivalryId)):live;
    const final=finalSeasonReview?{status:"unavailable"}:finalFrame(s.finalReconciliation,s.terminalClose,history);
    // r87 Touchline Gazette: the FINAL edition prints from the same verified history this Final Winner was drawn from.
    sfGazetteHistory=final.status==="ready"?history:null;
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
    // r87 Touchline Gazette: its own page after Season Results (CONTINUE TO SEASON N+1) and after Final Winner (its exits).
    // Small and loaded here with the screens it follows; its paper, sheet and copy load only when a paper is due.
    Promise.resolve().then(()=>root.loadRuntimeScript("touchline-gazette","js/touchlineGazette.js",()=>Boolean(root.CareerModeTouchlineGazette))).then(()=>root.CareerModeTouchlineGazette?.install?.()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Touchline Gazette unavailable.",error));
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
  return Object.freeze({finalFrame,rematchFrame,standingsFrames,skinSeason,reviewFinalSeason,installChampionBack,gazetteHistory:()=>sfGazetteHistory,install:installResults});
});

```


## FILE: js/commentaryEngine.js
```javascript
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCommentaryEngine=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // Commentary v2 event detector (Nik 2026-10-28: "every line matches what happened"). Pure: no IO, no Firebase, no DOM,
  // no clock, no randomness. ceSituationsFor(moment, facts) lists every situation that is TRUE for one moment of a Showdown,
  // most specific first, each with exactly the slot values its lines may use; cePick() then chooses one unused line, the same
  // on both phones for the same seed. The situations and their slots are the contract in data/commentarySituations.json
  // (copied below as SPEC; tests/contracts/r86-commentary-engine-contracts.cjs pins the two together).
  // Season Showdown points are never computed here: each season carries the canonical breakdown from
  // js/sharedCanonicalScoring.js (scoreAuthoritativeResults) or js/scoring.js (calculatePlayerSeasonScore). Equal totals are
  // a draw everywhere: no tiebreak, and league position, points or goals never decide anything between the two managers.
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const SPEC=Object.freeze({
    "N1":{"season-win-by-1":["loser","loserClub","loserPoints","margin","season","seasons","winner","winnerClub","winnerPoints"],"season-win-by-2-3":["loser","loserClub","loserPoints","margin","season","seasons","winner","winnerClub","winnerPoints"],"season-win-by-4-6":["loser","loserClub","loserPoints","margin","season","seasons","winner","winnerClub","winnerPoints"],"season-win-by-7-plus":["loser","loserClub","loserPoints","margin","season","seasons","winner","winnerClub","winnerPoints"],"season-shutout":["loser","loserClub","loserPoints","margin","season","seasons","winner","winnerClub","winnerPoints"]},
    "N2":{"season-draw-nil":["clubA","clubB","managerA","managerB","points","season","seasons"],"season-draw-low":["clubA","clubB","managerA","managerB","points","season","seasons"],"season-draw-high":["clubA","clubB","managerA","managerB","points","season","seasons"],"season-both-big":["clubA","clubB","managerA","managerB","pointsA","pointsB","season"],"season-perfect":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"]},
    "N3":{"trophy-treble":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"trophy-cl-and-league":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"trophy-cl-only":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"trophy-el-and-league":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"trophy-el-only":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"trophy-domestic-double":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"]},
    "N4":{"trophy-league-only":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"trophy-cup-only":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"finish-runner-up":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"finish-top-four":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"finish-mid-table":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"]},
    "N5":{"finish-lower-half":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"finish-bottom-three":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"won-season-no-trophy":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"trophy-but-lost-season":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"zero-season":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"]},
    "N6":{"record-hundred-points":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"record-hundred-goals":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"record-centurion-double":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"award-top-scorer":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"award-top-assist":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"]},
    "N7":{"award-both":["club","leagueGoals","leaguePoints","manager","position","rival","rivalClub","season","seasonPoints"],"both-league-titles":["clubA","clubB","managerA","managerB","season"],"both-european":["clubA","clubB","managerA","managerB","season"],"both-trophyless":["clubA","clubB","managerA","managerB","season"],"both-same-haul":["clubA","clubB","managerA","managerB","points","season"]},
    "N8":{"overall-lead-taken":["gap","leader","leaderTotal","season","seasons","seasonsLeft","trailer","trailerTotal"],"overall-lead-extended":["gap","leader","leaderTotal","season","seasons","seasonsLeft","trailer","trailerTotal"],"overall-gap-closed":["gap","leader","leaderTotal","season","seasons","seasonsLeft","trailer","trailerTotal"],"overall-level":["managerA","managerB","season","seasons","seasonsLeft","total"],"overall-runaway":["gap","leader","leaderTotal","season","seasons","seasonsLeft","trailer","trailerTotal"]},
    "N9":{"streak-two":["gap","leader","leaderTotal","season","seasons","seasonsLeft","streak","trailer","trailerTotal"],"streak-long":["gap","leader","leaderTotal","season","seasons","seasonsLeft","streak","trailer","trailerTotal"],"streak-broken":["gap","leader","leaderTotal","season","seasons","seasonsLeft","streak","trailer","trailerTotal"],"unbeaten-run":["gap","leader","leaderTotal","season","seasons","seasonsLeft","trailer","trailerTotal"],"first-season-won":["loser","loserClub","loserPoints","margin","season","seasons","winner","winnerClub","winnerPoints"]},
    "N10":{"clock-halfway":["gap","leader","leaderTotal","season","seasons","seasonsLeft","trailer","trailerTotal"],"clock-penultimate":["gap","leader","leaderTotal","season","seasons","seasonsLeft","trailer","trailerTotal"],"clock-final-open":["gap","leader","leaderTotal","season","seasons","seasonsLeft","trailer","trailerTotal"],"clock-clinched":["gap","leader","leaderTotal","season","seasons","seasonsLeft","trailer","trailerTotal"],"clock-dead-rubber":["gap","leader","leaderTotal","season","seasons","seasonsLeft","trailer","trailerTotal"]},
    "N11":{"final-won-by-1":["loser","loserClub","loserTotal","margin","seasons","winner","winnerClub","winnerTotal"],"final-won-by-2-5":["loser","loserClub","loserTotal","margin","seasons","winner","winnerClub","winnerTotal"],"final-won-by-6-15":["loser","loserClub","loserTotal","margin","seasons","winner","winnerClub","winnerTotal"],"final-won-by-16-plus":["loser","loserClub","loserTotal","margin","seasons","winner","winnerClub","winnerTotal"],"final-drawn":["clubA","clubB","managerA","managerB","seasons","total"]},
    "N12":{"final-comeback":["loser","loserClub","loserTotal","margin","seasons","winner","winnerClub","winnerTotal"],"final-wire-to-wire":["loser","loserClub","loserTotal","margin","seasons","winner","winnerClub","winnerTotal"],"final-golden":["loser","loserClub","loserTotal","margin","seasons","winner","winnerClub","winnerTotal"],"final-sprint":["loser","loserClub","loserTotal","margin","seasons","winner","winnerClub","winnerTotal"],"final-last-season-swing":["loser","loserClub","loserTotal","margin","seasons","winner","winnerClub","winnerTotal"]},
    "N13":{"special-top-3":["club","manager","mpClub","mpName","mpNation","mpPosition","mpRank","rival"],"special-top-10":["club","manager","mpClub","mpName","mpNation","mpPosition","mpRank","rival"],"special-top-20":["club","manager","mpClub","mpName","mpNation","mpPosition","mpRank","rival"],"special-top-50":["club","manager","mpClub","mpName","mpNation","mpPosition","mpRank","rival"],"special-rest":["club","manager","mpClub","mpName","mpNation","mpPosition","mpRank","rival"]},
    "N14":{"special-own-club":["club","manager","mpClub","mpName","mpNation","mpPosition","mpRank","rival"],"special-same-nation":["managerA","managerB","mpClubA","mpClubB","mpNameA","mpNameB","mpNation","mpPosition","mpRankA","mpRankB"],"special-same-position":["managerA","managerB","mpClubA","mpClubB","mpNameA","mpNameB","mpNation","mpPosition","mpRankA","mpRankB"],"special-rank-gap":["managerA","managerB","mpClubA","mpClubB","mpNameA","mpNameB","mpNation","mpPosition","mpRankA","mpRankB"],"special-both-elite":["managerA","managerB","mpClubA","mpClubB","mpNameA","mpNameB","mpNation","mpPosition","mpRankA","mpRankB"]},
    "N15":{"clubs-same-league":["clubA","clubB","league","managerA","managerB"],"clubs-different-leagues":["clubA","clubB","league","managerA","managerB"],"club-premier-league":["club","manager","rival","rivalClub"],"club-laliga":["club","manager","rival","rivalClub"],"club-bundesliga":["club","manager","rival","rivalClub"],"club-serie-a":["club","manager","rival","rivalClub"],"club-ligue-1":["club","manager","rival","rivalClub"]},
    "N16":{"career-first-showdown":["careerLeader","careerLosses","careerTrailer","careerWins","draws","loser","showdowns","winner"],"career-lead-extended":["careerLeader","careerLosses","careerTrailer","careerWins","draws","loser","showdowns","winner"],"career-new-leader":["careerLeader","careerLosses","careerTrailer","careerWins","draws","loser","showdowns","winner"],"career-level":["careerWins","draws","managerA","managerB","showdowns"],"career-revenge":["careerLeader","careerLosses","careerTrailer","careerWins","draws","loser","showdowns","winner"]},
    "N17":{"preview-first-season":["clubA","clubB","gap","leader","managerA","managerB","season","seasons","seasonsLeft","trailer"],"preview-leader":["clubA","clubB","gap","leader","managerA","managerB","season","seasons","seasonsLeft","trailer"],"preview-level":["clubA","clubB","gap","leader","managerA","managerB","season","seasons","seasonsLeft","trailer"],"preview-final-season":["clubA","clubB","gap","leader","managerA","managerB","season","seasons","seasonsLeft","trailer"],"preview-golden":["clubA","clubB","gap","leader","managerA","managerB","season","seasons","seasonsLeft","trailer"]}
  });
  const SLOTS=Object.freeze(Object.fromEntries(Object.entries(SPEC).flatMap(([code,group])=>Object.entries(group).map(([situation,slots])=>[situation,Object.freeze(slots)]))));
  const CODE_OF=Object.freeze(Object.fromEntries(Object.entries(SPEC).flatMap(([code,group])=>Object.keys(group).map(situation=>[situation,code]))));
  // Most specific first, per moment. Per-manager situations keep playerOne before playerTwo within one situation.
  const ORDER=Object.freeze({
    "club-assignment":Object.freeze(["clubs-same-league","clubs-different-leagues","club-premier-league","club-laliga","club-bundesliga","club-serie-a","club-ligue-1"]),
    "special-player":Object.freeze(["special-own-club","special-top-3","special-both-elite","special-rank-gap","special-same-nation","special-same-position","special-top-10","special-top-20","special-top-50","special-rest"]),
    "season-preview":Object.freeze(["preview-golden","preview-first-season","preview-final-season","preview-level","preview-leader"]),
    "season-result":Object.freeze(["season-perfect","trophy-treble","record-centurion-double","award-both","season-shutout","season-draw-nil","season-win-by-7-plus","both-same-haul","season-draw-high","season-both-big","both-league-titles","both-european","trophy-cl-and-league","trophy-el-and-league","trophy-domestic-double","trophy-cl-only","trophy-el-only","overall-lead-taken","clock-dead-rubber","clock-clinched","streak-long","streak-broken","overall-runaway","clock-final-open","unbeaten-run","first-season-won","trophy-but-lost-season","won-season-no-trophy","zero-season","finish-bottom-three","record-hundred-points","record-hundred-goals","award-top-scorer","award-top-assist","trophy-league-only","trophy-cup-only","streak-two","overall-level","overall-gap-closed","overall-lead-extended","clock-halfway","clock-penultimate","season-win-by-4-6","season-win-by-2-3","season-win-by-1","season-draw-low","finish-runner-up","finish-top-four","finish-mid-table","finish-lower-half","both-trophyless"]),
    "final":Object.freeze(["final-last-season-swing","final-comeback","final-golden","final-sprint","final-wire-to-wire","final-drawn","final-won-by-16-plus","final-won-by-1","final-won-by-6-15","final-won-by-2-5","career-first-showdown","career-new-leader","career-revenge","career-level","career-lead-extended"])
  });
  const MOMENTS=Object.freeze(Object.keys(ORDER));
  const RANK=Object.freeze(Object.fromEntries(MOMENTS.flatMap(moment=>ORDER[moment].map((situation,index)=>[situation,index]))));
  // Slots a situation lists but can only fill when the fact exists (the prompts say "only if someone leads", "only in the
  // same-league situation", "only where the situation says they share it"). An entry leaves such a slot out, and cePick()
  // never chooses a line that uses a slot its entry does not carry.
  const LEADER_SLOTS=Object.freeze(["leader","trailer","leaderTotal","trailerTotal","gap"]);
  const CONDITIONAL_SLOTS=Object.freeze({
    "preview-first-season":["leader","trailer","gap"],"preview-leader":[],"preview-level":["leader","trailer","gap"],"preview-final-season":["leader","trailer","gap"],"preview-golden":["leader","trailer","gap"],
    "streak-two":LEADER_SLOTS,"streak-long":LEADER_SLOTS,"streak-broken":LEADER_SLOTS,
    "clock-halfway":LEADER_SLOTS,"clock-penultimate":LEADER_SLOTS,"clock-final-open":LEADER_SLOTS,
    "clubs-different-leagues":["league"],
    "special-same-nation":["mpPosition"],"special-same-position":["mpNation"],"special-rank-gap":["mpNation","mpPosition"],"special-both-elite":["mpNation","mpPosition"],
    "career-revenge":["careerLeader","careerTrailer","careerWins","careerLosses"]
  });
  const LEAGUES=Object.freeze({premier_league:["club-premier-league","Premier League"],laliga:["club-laliga","LaLiga"],bundesliga:["club-bundesliga","Bundesliga"],serie_a:["club-serie-a","Serie A"],ligue_1:["club-ligue-1","Ligue 1"]});
  // Special Player list club names (FIFA 17 launch data) for catalog clubs drawn under another name. Same table as
  // CLUB_IDENTITY_ALIASES in js/visualIdentity.js (the contract checks they match).
  const CLUB_ALIASES=Object.freeze({
    "FC Barcelona":"Barcelona","FC Bayern München":"Bayern Munich","Bayer 04 Leverkusen":"Bayer Leverkusen","Olympique Lyonnais":"Lyon",
    "Hamburger SV":"Hamburg","Athletic Club de Bilbao":"Athletic Club","Inter":"Inter Milan","AS Monaco":"Monaco","UD Las Palmas":"Las Palmas",
    "FC Schalke 04":"Schalke 04","VfL Wolfsburg":"Wolfsburg","Villarreal CF":"Villarreal","TSG 1899 Hoffenheim":"Hoffenheim","Valencia CF":"Valencia",
    "OGC Nice":"Nice","Sevilla FC":"Sevilla","Málaga CF":"Málaga","SD Eibar":"Eibar","RC Celta":"Celta Vigo","Toulouse Football Club":"Toulouse",
    "Granada CF":"Granada","AS Saint-Étienne":"Saint-Étienne","Stade Rennais FC":"Rennes"
  });
  const MAX_SEASON_POINTS=11;
  // {mpPosition} is read aloud, so it is the spoken position, never the list's code (Nik 2026-10-29). A code not listed here
  // leaves the slot out rather than reading a code.
  const POSITION_WORDS=Object.freeze({LW:"left winger",RW:"right winger",LM:"left midfielder",RM:"right midfielder",CM:"central midfielder",
    CAM:"attacking midfielder",CDM:"defensive midfielder",ST:"striker",CF:"centre-forward",CB:"centre-back",LB:"left-back",RB:"right-back",GK:"goalkeeper"});

  function ceFail(code){const error=new Error(code);error.code=code;throw error;}
  function ceOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function ceText(value){return String(value);}
  function ceOrdinal(n){const tens=n%100;if(tens>=11&&tens<=13)return `${n}th`;return `${n}${({1:"st",2:"nd",3:"rd"})[n%10]||"th"}`;}
  function ceCount(value,code){if(!Number.isInteger(value)||value<0)ceFail(code);return value;}

  // An entry carries only the slots its situation lists, every value a non-empty string.
  function ceEntry(situation,values){
    const slots={};
    for(const key of SLOTS[situation]){const value=values[key];if(value!==undefined&&value!==null&&value!=="")slots[key]=ceText(value);}
    return {situation,slots};
  }
  function ceSorted(entries){
    return entries.map((item,index)=>({item,index})).sort((a,b)=>RANK[a.item.situation]-RANK[b.item.situation]||a.index-b.index).map(({item})=>Object.freeze({situation:item.situation,slots:Object.freeze(item.slots)}));
  }

  // ---- facts ----
  function ceManagers(facts){
    const list=facts&&facts.managers;
    if(!list)ceFail("COMMENTARY_MANAGERS_MISSING");
    return Object.fromEntries(ROLES.map(role=>{
      const row=list[role];
      if(!row||typeof row.name!=="string"||!row.name)ceFail("COMMENTARY_MANAGERS_MISSING");
      return [role,{name:row.name,club:typeof row.club==="string"&&row.club?row.club:null,league:ceLeagueOf(row,facts.clubsByLeague)}];
    }));
  }
  function ceLeagueOf(row,clubsByLeague){
    if(typeof row.league==="string"&&Object.hasOwn(LEAGUES,row.league))return row.league;
    if(clubsByLeague&&row.club){for(const [key,clubs] of Object.entries(clubsByLeague)){if(Object.hasOwn(LEAGUES,key)&&Array.isArray(clubs)&&clubs.includes(row.club))return key;}}
    return null;
  }
  // One finished season: the canonical projection {results, scoring, winner?} (sharedCanonicalScoring) or a saved round
  // {playerOne:{...result, scoring}, playerTwo:{...}} (js/scoring.js). Without a breakdown the browser's own
  // calculatePlayerSeasonScore (js/scoring.js) is used; with neither, the facts are refused rather than re-scored here.
  function ceSeason(value,index){
    if(!value||typeof value!=="object")ceFail("COMMENTARY_SEASON_INVALID");
    const out={number:index+1,result:{},breakdown:{},points:{},teamCount:{}};
    for(const role of ROLES){
      const result=value.results?value.results[role]:value[role];
      if(!result||typeof result!=="object")ceFail("COMMENTARY_SEASON_INVALID");
      let breakdown=value.scoring?value.scoring[role]:result.scoring;
      if(!breakdown&&typeof root.calculatePlayerSeasonScore==="function")breakdown=root.calculatePlayerSeasonScore(result);
      if(!breakdown||typeof breakdown!=="object")ceFail("COMMENTARY_SCORING_MISSING");
      if(!Number.isInteger(breakdown.total)||breakdown.total<0||breakdown.total>MAX_SEASON_POINTS)ceFail("COMMENTARY_SCORING_INVALID");
      const teams=value.teamCounts&&Number.isInteger(value.teamCounts[role])?value.teamCounts[role]:value.teamCount;
      if(!Number.isInteger(teams)||teams<2)ceFail("COMMENTARY_TEAM_COUNT_INVALID");
      const position=Number(result.leaguePosition);
      if(!Number.isInteger(position)||position<1||position>teams)ceFail("COMMENTARY_SEASON_INVALID");
      const triggers=breakdown.triggers||{};
      out.result[role]={position,leaguePoints:ceCount(Number(result.leaguePoints),"COMMENTARY_SEASON_INVALID"),leagueGoals:ceCount(Number(result.leagueGoals),"COMMENTARY_SEASON_INVALID")};
      out.breakdown[role]={league:breakdown.leagueTitle>0,cl:breakdown.championsLeague>0,el:(breakdown.europaLeague||0)>0,cup:breakdown.domesticCup>0,
        performance:breakdown.performanceBonus>0,award:breakdown.individualAwardsBonus>0,
        hundredPoints:triggers.hundredLeaguePoints===true,hundredGoals:triggers.hundredLeagueGoals===true,topScorer:triggers.topScorer===true,topAssist:triggers.topAssist===true};
      out.points[role]=breakdown.total;
      out.teamCount[role]=teams;
    }
    const a=out.points.playerOne,b=out.points.playerTwo;
    out.winner=a>b?"playerOne":b>a?"playerTwo":"draw";
    if(value.winner!==undefined&&value.winner!==out.winner)ceFail("COMMENTARY_SEASON_WINNER_MISMATCH");
    return out;
  }
  function ceShowdown(facts,{needSeason=true}={}){
    const length=facts&&facts.seasons;
    if(!Number.isInteger(length)||length<1)ceFail("COMMENTARY_SHOWDOWN_LENGTH_INVALID");
    const list=Array.isArray(facts.results)?facts.results:[];
    if(list.length>length)ceFail("COMMENTARY_SEASON_INVALID");
    const seasons=list.map(ceSeason);
    const totals=[];let a=0,b=0;
    for(const row of seasons){a+=row.points.playerOne;b+=row.points.playerTwo;totals.push({playerOne:a,playerTwo:b});}
    let current=null;
    if(needSeason){current=facts.season;if(!Number.isInteger(current)||current<1||current>length)ceFail("COMMENTARY_SEASON_NUMBER_INVALID");}
    return {length,seasons,totals,current};
  }
  function ceLeaderOf(pair){return pair.playerOne>pair.playerTwo?"playerOne":pair.playerTwo>pair.playerOne?"playerTwo":null;}

  // ---- slot builders ----
  function ceOverallSlots(m,sd,afterSeason,extra){
    const totals=afterSeason>0?sd.totals[afterSeason-1]:{playerOne:0,playerTwo:0},leader=ceLeaderOf(totals),values={season:afterSeason,seasons:sd.length,seasonsLeft:sd.length-afterSeason,...extra};
    if(leader){const trailer=ceOther(leader);Object.assign(values,{leader:m[leader].name,trailer:m[trailer].name,leaderTotal:totals[leader],trailerTotal:totals[trailer],gap:totals[leader]-totals[trailer]});}
    return values;
  }
  function ceSeasonWinSlots(m,sd,row){
    const winner=row.winner,loser=ceOther(winner);
    return {winner:m[winner].name,loser:m[loser].name,winnerClub:m[winner].club,loserClub:m[loser].club,winnerPoints:row.points[winner],loserPoints:row.points[loser],margin:row.points[winner]-row.points[loser],season:row.number,seasons:sd.length};
  }
  function cePairSlots(m,extra){return {managerA:m.playerOne.name,managerB:m.playerTwo.name,clubA:m.playerOne.club,clubB:m.playerTwo.club,...extra};}
  function ceManagerSlots(m,row,role){
    const rival=ceOther(role),result=row.result[role];
    return {manager:m[role].name,club:m[role].club,rival:m[rival].name,rivalClub:m[rival].club,position:ceOrdinal(result.position),leaguePoints:result.leaguePoints,leagueGoals:result.leagueGoals,seasonPoints:row.points[role],season:row.number};
  }

  // ---- moments ----
  function ceClubAssignment(facts){
    const m=ceManagers(facts),out=[],[a,b]=[m.playerOne.league,m.playerTwo.league];
    if(a&&b){
      if(a===b)out.push(ceEntry("clubs-same-league",cePairSlots(m,{league:LEAGUES[a][1]})));
      else out.push(ceEntry("clubs-different-leagues",cePairSlots(m,{})));
    }
    for(const role of ROLES){
      const league=m[role].league;
      if(league&&m[role].club)out.push(ceEntry(LEAGUES[league][0],{manager:m[role].name,club:m[role].club,rival:m[ceOther(role)].name,rivalClub:m[ceOther(role)].club}));
    }
    return out;
  }

  function cePositionWords(code){return typeof code==="string"&&Object.hasOwn(POSITION_WORDS,code)?POSITION_WORDS[code]:null;}
  function ceSpecialTier(rank){return rank<=3?"special-top-3":rank<=10?"special-top-10":rank<=20?"special-top-20":rank<=50?"special-top-50":"special-rest";}
  function ceCatalogClub(name){return typeof name==="string"?(CLUB_ALIASES[name]||name):null;}
  function ceSpecialPlayer(facts){
    const m=ceManagers(facts),picks=facts.specialPlayers;
    if(!picks||!picks.playerOne||!picks.playerTwo)return [];
    const mp={};
    for(const role of ROLES){const row=picks[role];if(!Number.isInteger(row.rank)||row.rank<1||typeof row.name!=="string"||!row.name)ceFail("COMMENTARY_SPECIAL_PLAYER_INVALID");mp[role]=row;}
    const out=[];
    for(const role of ROLES){
      const row=mp[role],values={manager:m[role].name,club:m[role].club,rival:m[ceOther(role)].name,mpName:row.name,mpClub:row.club,mpPosition:cePositionWords(row.position),mpNation:row.nation,mpRank:row.rank};
      out.push(ceEntry(ceSpecialTier(row.rank),values));
      if(m[role].club&&ceCatalogClub(row.club)===m[role].club)out.push(ceEntry("special-own-club",values));
    }
    const a=mp.playerOne,b=mp.playerTwo,sameNation=!!a.nation&&a.nation===b.nation,samePosition=!!a.position&&a.position===b.position;
    const values={managerA:m.playerOne.name,managerB:m.playerTwo.name,mpNameA:a.name,mpNameB:b.name,mpClubA:a.club,mpClubB:b.club,mpRankA:a.rank,mpRankB:b.rank,mpNation:sameNation?a.nation:null,mpPosition:samePosition?cePositionWords(a.position):null};
    if(sameNation)out.push(ceEntry("special-same-nation",values));
    if(samePosition)out.push(ceEntry("special-same-position",values));
    if(Math.abs(a.rank-b.rank)>=100)out.push(ceEntry("special-rank-gap",values));
    if(a.rank<=20&&b.rank<=20)out.push(ceEntry("special-both-elite",values));
    return out;
  }

  function ceSeasonPreview(facts){
    const m=ceManagers(facts),sd=ceShowdown(facts),s=sd.current;
    if(sd.seasons.length<s-1)ceFail("COMMENTARY_SEASON_INVALID");
    const before=s>1?sd.totals[s-2]:{playerOne:0,playerTwo:0},leader=ceLeaderOf(before);
    // seasonsLeft counts the season about to start: 1 before the final season.
    const values=cePairSlots(m,{season:s,seasons:sd.length,seasonsLeft:sd.length-s+1});
    if(leader)Object.assign(values,{leader:m[leader].name,trailer:m[ceOther(leader)].name,gap:before[leader]-before[ceOther(leader)]});
    // Final-season and leader previews speak of a race both can still win: none once the trailer can no longer win
    // (the season result before already said so with clock-clinched / clock-dead-rubber).
    const open=!leader||values.gap<MAX_SEASON_POINTS*values.seasonsLeft,out=[];
    if(s===1)out.push(ceEntry("preview-first-season",values));
    if(s===1&&sd.length===10)out.push(ceEntry("preview-golden",values));
    if(s===sd.length&&open)out.push(ceEntry("preview-final-season",values));
    if(s>1&&leader&&open)out.push(ceEntry("preview-leader",values));
    if(s>1&&!leader)out.push(ceEntry("preview-level",values));
    return out;
  }

  function ceTrophies(bd){return bd.league||bd.cl||bd.el||bd.cup;}
  function ceSeasonResult(facts){
    const m=ceManagers(facts),sd=ceShowdown(facts),s=sd.current;
    if(sd.seasons.length<s)ceFail("COMMENTARY_SEASON_INVALID");
    const row=sd.seasons[s-1],out=[],pa=row.points.playerOne,pb=row.points.playerTwo,W=row.winner==="draw"?null:row.winner;
    // N1 margins, N2 draws and totals
    if(W){
      const margin=Math.abs(pa-pb),values=ceSeasonWinSlots(m,sd,row);
      out.push(ceEntry(margin===1?"season-win-by-1":margin<=3?"season-win-by-2-3":margin<=6?"season-win-by-4-6":"season-win-by-7-plus",values));
      if(row.points[ceOther(W)]===0)out.push(ceEntry("season-shutout",values));
      if(s===1)out.push(ceEntry("first-season-won",values));
    }else{
      out.push(ceEntry(pa===0?"season-draw-nil":pa<=4?"season-draw-low":"season-draw-high",cePairSlots(m,{points:pa,season:s,seasons:sd.length})));
    }
    if(pa>=8&&pb>=8)out.push(ceEntry("season-both-big",cePairSlots(m,{pointsA:pa,pointsB:pb,season:s})));
    // N3-N6 one manager's season
    for(const role of ROLES){
      const bd=row.breakdown[role],result=row.result[role],values=ceManagerSlots(m,row,role),won=ceTrophies(bd),teams=row.teamCount[role],add=situation=>out.push(ceEntry(situation,values));
      if(row.points[role]===MAX_SEASON_POINTS)add("season-perfect");
      if(bd.cl&&bd.league&&bd.cup)add("trophy-treble");
      if(bd.cl&&bd.league&&!bd.cup)add("trophy-cl-and-league");
      if(bd.cl&&!bd.league)add("trophy-cl-only");
      if(bd.el&&bd.league)add("trophy-el-and-league");
      if(bd.el&&!bd.league)add("trophy-el-only");
      if(bd.league&&bd.cup&&!bd.cl&&!bd.el)add("trophy-domestic-double");
      if(bd.league&&!bd.cup&&!bd.cl&&!bd.el)add("trophy-league-only");
      if(bd.cup&&!bd.league&&!bd.cl&&!bd.el)add("trophy-cup-only");
      if(!won&&result.position===2)add("finish-runner-up");
      if(!won&&result.position>=3&&result.position<=4)add("finish-top-four");
      if(!won&&result.position>=5&&result.position<=10)add("finish-mid-table");
      const bottomThree=result.position>teams-3;
      if(!won&&result.position>=11&&!bottomThree)add("finish-lower-half");
      if(bottomThree)add("finish-bottom-three");
      if(W===role&&!won)add("won-season-no-trophy");
      if(W===ceOther(role)&&won)add("trophy-but-lost-season");
      if(row.points[role]===0)add("zero-season");
      if(bd.hundredPoints)add("record-hundred-points");
      if(bd.hundredGoals)add("record-hundred-goals");
      if(bd.hundredPoints&&bd.hundredGoals)add("record-centurion-double");
      if(bd.topScorer&&!bd.topAssist)add("award-top-scorer");
      if(bd.topAssist&&!bd.topScorer)add("award-top-assist");
      if(bd.topScorer&&bd.topAssist)add("award-both");
    }
    // N7 both managers
    const A=row.breakdown.playerOne,B=row.breakdown.playerTwo,both=cePairSlots(m,{season:s});
    if(A.league&&B.league)out.push(ceEntry("both-league-titles",both));
    if((A.cl||A.el)&&(B.cl||B.el))out.push(ceEntry("both-european",both));
    if(!ceTrophies(A)&&!ceTrophies(B))out.push(ceEntry("both-trophyless",both));
    // Same scored items (trophies and bonuses as they score), so equal totals; an empty haul is a draw on nothing, not a "same haul".
    if(pa>0&&["league","cl","el","cup","performance","award"].every(key=>A[key]===B[key]))out.push(ceEntry("both-same-haul",cePairSlots(m,{points:pa,season:s})));
    // N8 the overall Showdown
    const after=sd.totals[s-1],before=s>1?sd.totals[s-2]:{playerOne:0,playerTwo:0},leader=ceLeaderOf(after),leaderBefore=ceLeaderOf(before),overall=ceOverallSlots(m,sd,s,{}),left=sd.length-s;
    const gap=leader?after[leader]-after[ceOther(leader)]:0;
    if(leader&&leaderBefore===ceOther(leader))out.push(ceEntry("overall-lead-taken",overall));
    if(leader&&leaderBefore===leader&&W===leader)out.push(ceEntry("overall-lead-extended",overall));
    if(leader&&leaderBefore===leader&&W===ceOther(leader))out.push(ceEntry("overall-gap-closed",overall));
    if(!leader)out.push(ceEntry("overall-level",cePairSlots(m,{season:s,seasons:sd.length,seasonsLeft:left,total:after.playerOne})));
    if(leader&&gap>=12&&left>0)out.push(ceEntry("overall-runaway",overall));
    // N9 streaks and runs
    const winners=sd.seasons.slice(0,s).map(item=>item.winner);
    const run=(end,role)=>{let n=0;for(let k=end;k>=0&&winners[k]===role;k-=1)n+=1;return n;};
    if(W){const streak=run(s-1,W);if(streak===2)out.push(ceEntry("streak-two",{...overall,streak}));if(streak>=3)out.push(ceEntry("streak-long",{...overall,streak}));}
    if(s>1&&winners[s-2]!=="draw"){const owner=winners[s-2],ended=run(s-2,owner);if(ended>=2&&W===ceOther(owner))out.push(ceEntry("streak-broken",{...overall,streak:ended}));}
    if(leader&&s>=3&&!winners.includes(ceOther(leader)))out.push(ceEntry("unbeaten-run",overall));
    // N10 the clock (after this season)
    if((sd.length===5||sd.length===10)&&s===Math.ceil(sd.length/2))out.push(ceEntry("clock-halfway",overall));
    if(left===1)out.push(ceEntry("clock-penultimate",overall));
    if(left===1&&gap<MAX_SEASON_POINTS)out.push(ceEntry("clock-final-open",overall));
    if(left>0&&gap>MAX_SEASON_POINTS*left)out.push(ceEntry("clock-clinched",overall));
    if(left===1&&gap>MAX_SEASON_POINTS)out.push(ceEntry("clock-dead-rubber",overall));
    return out;
  }

  function ceHistoryWinner(row){
    if(!row||typeof row!=="object")ceFail("COMMENTARY_HISTORY_INVALID");
    let winner=row.winner;
    if(row.totals&&Number.isInteger(row.totals.playerOne)&&Number.isInteger(row.totals.playerTwo)){const derived=ceLeaderOf(row.totals)||"draw";if(winner!==undefined&&winner!==derived)ceFail("COMMENTARY_HISTORY_INVALID");winner=derived;}
    if(!["playerOne","playerTwo","draw"].includes(winner))ceFail("COMMENTARY_HISTORY_INVALID");
    return winner;
  }
  function ceFinalMoment(facts){
    const m=ceManagers(facts),sd=ceShowdown(facts,{needSeason:false}),N=sd.length;
    if(sd.seasons.length!==N)ceFail("COMMENTARY_SHOWDOWN_NOT_FINISHED");
    const out=[],totals=sd.totals[N-1],W=ceLeaderOf(totals);
    if(W){
      const L=ceOther(W),margin=totals[W]-totals[L],values={winner:m[W].name,loser:m[L].name,winnerClub:m[W].club,loserClub:m[L].club,winnerTotal:totals[W],loserTotal:totals[L],margin,seasons:N};
      out.push(ceEntry(margin===1?"final-won-by-1":margin<=5?"final-won-by-2-5":margin<=15?"final-won-by-6-15":"final-won-by-16-plus",values));
      if(sd.totals.slice(0,N-1).some(pair=>pair[W]<pair[L]))out.push(ceEntry("final-comeback",values));
      if(sd.totals.every(pair=>pair[W]>pair[L]))out.push(ceEntry("final-wire-to-wire",values));
      // r86 (red team #12): the Golden Showdown is the Rule Book's 110 (11 in every season of a 10-season Showdown), not any 10-season win.
      if(N===10&&totals[W]===MAX_SEASON_POINTS*N)out.push(ceEntry("final-golden",values));
      if(N===1)out.push(ceEntry("final-sprint",values));
      if(N>=2&&ceLeaderOf(sd.totals[N-2])===L)out.push(ceEntry("final-last-season-swing",values));
    }else{
      out.push(ceEntry("final-drawn",cePairSlots(m,{seasons:N,total:totals.playerOne})));
    }
    // N16 career, from the earlier finished Showdowns (oldest first, this one not included) plus this result.
    const history=(Array.isArray(facts.history)?facts.history:[]).map(ceHistoryWinner),current=W||"draw",all=[...history,current];
    const tally=list=>({playerOne:list.filter(w=>w==="playerOne").length,playerTwo:list.filter(w=>w==="playerTwo").length,draws:list.filter(w=>w==="draw").length});
    const before=tally(history),after=tally(all),leaderBefore=ceLeaderOf(before),careerLeader=ceLeaderOf(after);
    const values={draws:after.draws,showdowns:all.length};
    if(W)Object.assign(values,{winner:m[W].name,loser:m[ceOther(W)].name});
    if(careerLeader)Object.assign(values,{careerLeader:m[careerLeader].name,careerTrailer:m[ceOther(careerLeader)].name,careerWins:after[careerLeader],careerLosses:after[ceOther(careerLeader)]});
    // The first Showdown counts only when someone won it: every first-Showdown line names its winner, and a drawn first
    // Showdown is career-level (0 wins each) and final-drawn instead.
    if(W&&history.length===0)out.push(ceEntry("career-first-showdown",values));
    if(W&&history.length>0&&leaderBefore===W&&careerLeader===W)out.push(ceEntry("career-lead-extended",values));
    if(W&&history.length>0&&leaderBefore!==W&&careerLeader===W)out.push(ceEntry("career-new-leader",values));
    if(!careerLeader)out.push(ceEntry("career-level",{managerA:m.playerOne.name,managerB:m.playerTwo.name,careerWins:after.playerOne,draws:after.draws,showdowns:all.length}));
    if(W&&history.length>0&&history[history.length-1]===ceOther(W))out.push(ceEntry("career-revenge",values));
    return out;
  }

  const DETECTORS=Object.freeze({"club-assignment":ceClubAssignment,"special-player":ceSpecialPlayer,"season-preview":ceSeasonPreview,"season-result":ceSeasonResult,"final":ceFinalMoment});

  // Every situation that is true for this moment, most specific first: [{situation, slots}].
  function ceSituationsFor(moment,facts){
    if(!Object.hasOwn(DETECTORS,moment))ceFail("COMMENTARY_MOMENT_INVALID");
    return Object.freeze(ceSorted(DETECTORS[moment](facts)));
  }

  // FNV-1a over the seed: both phones agree because the seed (seedFor) and the facts are the same on both.
  function ceHash(value){let h=2166136261;const s=String(value);for(let i=0;i<s.length;i+=1){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function ceSeedFor(showdownId,moment,season){return `${String(showdownId||"")}|${String(moment||"")}|${Number.isInteger(season)?season:0}`;}
  function cePlaceholders(textValue){return Array.from(String(textValue).matchAll(/\{(\w+)\}/g),match=>match[1]);}
  function ceGrouped(lines){
    if(Array.isArray(lines)){const out={};for(const row of lines){if(row&&typeof row.situation==="string")(out[row.situation]||(out[row.situation]=[])).push(row);}return out;}
    return lines&&typeof lines==="object"?lines:{};
  }
  // One line for the first entry that still has an unused line whose every placeholder the entry fills; null when none.
  // `used` (Set or array of line ids already shown in this Showdown) is read, never changed: add the returned id yourself.
  // Whether a filled value is spoken with a vowel sound, for "a" -> "an" right before a slot: letters by sound (a Uruguay
  // international, an hour), acronyms by the letter's name (an FC Porto side, a PSV player), numbers as spoken (an 8th, an 11th, an 18).
  function ceVowelSound(value){
    const textValue=String(value).trim(),word=textValue.split(/[\s-]/)[0].replace(/[.,;:!?]+$/,"");
    if(/^\d/.test(textValue))return /^8/.test(textValue)||/^(11|18)(?!\d)/.test(textValue)||/^(11|18)\d\d(?!\d)/.test(textValue);
    if(word.length>1&&/^[A-Z]+$/.test(word))return /^[AEFHILMNORSX]/.test(word);
    if(/^(uni|use|usu|uru|ukr|ure|uti|eu|one|once|ewe)/i.test(word))return false;
    if(/^(hour|honou?r|honest|heir)/i.test(word))return true;
    return /^[aeiouàáâäæèéêëìíîïòóôöøùúûü]/i.test(word);
  }
  // Fill every placeholder; the article "a" right before a slot becomes "an" when the value starts with a vowel sound.
  // Only an article written directly before a slot changes: the line's own words are never touched.
  function ceFill(textValue,slots){
    return textValue.replace(/(?<![\p{L}\p{N}'’-])([Aa]) (?=\{(\w+)\})/gu,(match,article,key)=>ceVowelSound(slots[key])?`${article}n `:match).replace(/\{(\w+)\}/g,(_,key)=>slots[key]);
  }
  function cePick(entries,linesBySituation,seed,used){
    const seen=used instanceof Set?used:new Set(Array.isArray(used)?used:[]),lines=ceGrouped(linesBySituation);
    for(let index=0;index<(entries||[]).length;index+=1){
      const item=entries[index],allowed=item&&SLOTS[item.situation],list=allowed&&lines[item.situation];
      if(!Array.isArray(list)||!list.length)continue;
      const start=ceHash(`${seed}|${item.situation}|${index}`)%list.length;
      for(let step=0;step<list.length;step+=1){
        const line=list[(start+step)%list.length];
        if(!line||typeof line.id!=="string"||typeof line.text!=="string"||seen.has(line.id))continue;
        const keys=cePlaceholders(line.text);
        if(!keys.every(key=>allowed.includes(key)&&Object.hasOwn(item.slots,key)))continue;
        return Object.freeze({id:line.id,situation:item.situation,text:ceFill(line.text,item.slots)});
      }
    }
    return null;
  }

  return Object.freeze({contractVersion:1,feature:"cms-commentary-engine",roles:ROLES,moments:MOMENTS,order:ORDER,situations:SLOTS,codeOf:CODE_OF,
    conditionalSlots:CONDITIONAL_SLOTS,leagues:LEAGUES,clubAliases:CLUB_ALIASES,positionWords:POSITION_WORDS,ordinal:ceOrdinal,vowelSound:ceVowelSound,situationsFor:ceSituationsFor,pick:cePick,seedFor:ceSeedFor,drawOnEqualTotals:true,tiebreak:false});
});

```


## FILE: data/commentarySituations.json
```json
{
 "N1": {
  "season-win-by-1": {
   "when": "one manager won the season by exactly 1 Showdown point",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserPoints",
    "margin",
    "season",
    "seasons",
    "winner",
    "winnerClub",
    "winnerPoints"
   ]
  },
  "season-win-by-2-3": {
   "when": "won the season by 2 or 3 points",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserPoints",
    "margin",
    "season",
    "seasons",
    "winner",
    "winnerClub",
    "winnerPoints"
   ]
  },
  "season-win-by-4-6": {
   "when": "won the season by 4 to 6 points",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserPoints",
    "margin",
    "season",
    "seasons",
    "winner",
    "winnerClub",
    "winnerPoints"
   ]
  },
  "season-win-by-7-plus": {
   "when": "won the season by 7 or more points (a rare, huge season gap)",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserPoints",
    "margin",
    "season",
    "seasons",
    "winner",
    "winnerClub",
    "winnerPoints"
   ]
  },
  "season-shutout": {
   "when": "won the season while the other manager scored 0 Showdown points that season",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserPoints",
    "margin",
    "season",
    "seasons",
    "winner",
    "winnerClub",
    "winnerPoints"
   ]
  }
 },
 "N2": {
  "season-draw-nil": {
   "when": "both managers scored 0 Showdown points: a draw on nothing",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "managerA",
    "managerB",
    "points",
    "season",
    "seasons"
   ]
  },
  "season-draw-low": {
   "when": "equal season totals of 1 to 4 points each: a draw",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "managerA",
    "managerB",
    "points",
    "season",
    "seasons"
   ]
  },
  "season-draw-high": {
   "when": "equal season totals of 5 or more points each: a draw between two big seasons",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "managerA",
    "managerB",
    "points",
    "season",
    "seasons"
   ]
  },
  "season-both-big": {
   "when": "both managers scored 8 or more points this season (one may still have won, or it may be a draw: do not say who won)",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "managerA",
    "managerB",
    "pointsA",
    "pointsB",
    "season"
   ]
  },
  "season-perfect": {
   "when": "a manager scored the maximum 11 points this season (league, Champions League, cup, 100+ points or goals, an award)",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  }
 },
 "N3": {
  "trophy-treble": {
   "when": "this manager won league, domestic cup and Champions League this season",
   "count": 50,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "trophy-cl-and-league": {
   "when": "won the Champions League and the league, not the cup",
   "count": 50,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "trophy-cl-only": {
   "when": "won the Champions League but not the league title",
   "count": 50,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "trophy-el-and-league": {
   "when": "won the Europa League and the league",
   "count": 50,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "trophy-el-only": {
   "when": "won the Europa League but not the league title",
   "count": 50,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "trophy-domestic-double": {
   "when": "won the league and the domestic cup, no European trophy",
   "count": 50,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  }
 },
 "N4": {
  "trophy-league-only": {
   "when": "won the league title, no cup, no European trophy",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "trophy-cup-only": {
   "when": "won the domestic cup, not the league, no European trophy",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "finish-runner-up": {
   "when": "finished 2nd in the league and won no trophy",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "finish-top-four": {
   "when": "finished 3rd or 4th and won no trophy",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "finish-mid-table": {
   "when": "finished between 5th and 10th and won no trophy",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  }
 },
 "N5": {
  "finish-lower-half": {
   "when": "finished 11th or lower, but not in the bottom three, and won no trophy",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "finish-bottom-three": {
   "when": "finished in the bottom three of the league (in the relegation places)",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "won-season-no-trophy": {
   "when": "won the season on Showdown points without winning any trophy (bonuses only)",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "trophy-but-lost-season": {
   "when": "won at least one trophy but still lost the season to the rival",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "zero-season": {
   "when": "scored 0 Showdown points this season",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  }
 },
 "N6": {
  "record-hundred-points": {
   "when": "reached 100 or more league points",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "record-hundred-goals": {
   "when": "scored 100 or more league goals",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "record-centurion-double": {
   "when": "100+ league points AND 100+ league goals in the same season",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "award-top-scorer": {
   "when": "their club had the league top scorer (award won, not top assist)",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "award-top-assist": {
   "when": "their club had the league top assist maker (not top scorer)",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  }
 },
 "N7": {
  "award-both": {
   "when": "top scorer AND top assist awards for the same manager this season",
   "count": 60,
   "slots": [
    "club",
    "leagueGoals",
    "leaguePoints",
    "manager",
    "position",
    "rival",
    "rivalClub",
    "season",
    "seasonPoints"
   ]
  },
  "both-league-titles": {
   "when": "both managers won their own league title this season",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "managerA",
    "managerB",
    "season"
   ]
  },
  "both-european": {
   "when": "both managers won a European trophy this season (Champions League or Europa League each)",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "managerA",
    "managerB",
    "season"
   ]
  },
  "both-trophyless": {
   "when": "neither manager won any trophy this season",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "managerA",
    "managerB",
    "season"
   ]
  },
  "both-same-haul": {
   "when": "both managers won exactly the same set of trophies and bonuses (so a draw)",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "managerA",
    "managerB",
    "points",
    "season"
   ]
  }
 },
 "N8": {
  "overall-lead-taken": {
   "when": "the overall lead changed hands this season: {leader} is now ahead, {trailer} was ahead before",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer",
    "trailerTotal"
   ]
  },
  "overall-lead-extended": {
   "when": "the overall leader won this season and is further ahead",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer",
    "trailerTotal"
   ]
  },
  "overall-gap-closed": {
   "when": "the overall trailer won this season and closed the gap but is still behind",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer",
    "trailerTotal"
   ]
  },
  "overall-level": {
   "when": "after this season the overall totals are equal (a level Showdown, not decided by anything else)",
   "count": 60,
   "slots": [
    "managerA",
    "managerB",
    "season",
    "seasons",
    "seasonsLeft",
    "total"
   ]
  },
  "overall-runaway": {
   "when": "the overall gap is now 12 points or more and the Showdown is not over",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer",
    "trailerTotal"
   ]
  }
 },
 "N9": {
  "streak-two": {
   "when": "the same manager has now won 2 seasons in a row",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "streak",
    "trailer",
    "trailerTotal"
   ]
  },
  "streak-long": {
   "when": "the same manager has now won {streak} seasons in a row ({streak} is 3 or more)",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "streak",
    "trailer",
    "trailerTotal"
   ]
  },
  "streak-broken": {
   "when": "a run of 2 or more season wins by the other manager just ended with this season",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "streak",
    "trailer",
    "trailerTotal"
   ]
  },
  "unbeaten-run": {
   "when": "the leader has not lost a single season of this Showdown, 3 or more seasons played (draws possible)",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer",
    "trailerTotal"
   ]
  },
  "first-season-won": {
   "when": "the first season of the Showdown has just been won",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserPoints",
    "margin",
    "season",
    "seasons",
    "winner",
    "winnerClub",
    "winnerPoints"
   ]
  }
 },
 "N10": {
  "clock-halfway": {
   "when": "the middle of a 5- or 10-season Showdown has just been reached",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer",
    "trailerTotal"
   ]
  },
  "clock-penultimate": {
   "when": "one season left after this one",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer",
    "trailerTotal"
   ]
  },
  "clock-final-open": {
   "when": "the last season is next and both managers can still win the Showdown",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer",
    "trailerTotal"
   ]
  },
  "clock-clinched": {
   "when": "the leader can no longer be caught (the gap is bigger than 11 points per season left), but seasons remain",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer",
    "trailerTotal"
   ]
  },
  "clock-dead-rubber": {
   "when": "the final season is about to be played and the Showdown is already decided",
   "count": 60,
   "slots": [
    "gap",
    "leader",
    "leaderTotal",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer",
    "trailerTotal"
   ]
  }
 },
 "N11": {
  "final-won-by-1": {
   "when": "Showdown over: won by exactly 1 point overall",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserTotal",
    "margin",
    "seasons",
    "winner",
    "winnerClub",
    "winnerTotal"
   ]
  },
  "final-won-by-2-5": {
   "when": "won by 2 to 5 points overall",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserTotal",
    "margin",
    "seasons",
    "winner",
    "winnerClub",
    "winnerTotal"
   ]
  },
  "final-won-by-6-15": {
   "when": "won by 6 to 15 points overall",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserTotal",
    "margin",
    "seasons",
    "winner",
    "winnerClub",
    "winnerTotal"
   ]
  },
  "final-won-by-16-plus": {
   "when": "won by 16 or more points overall",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserTotal",
    "margin",
    "seasons",
    "winner",
    "winnerClub",
    "winnerTotal"
   ]
  },
  "final-drawn": {
   "when": "Showdown over with equal totals: a drawn Showdown, nobody wins, no tiebreak",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "managerA",
    "managerB",
    "seasons",
    "total"
   ]
  }
 },
 "N12": {
  "final-comeback": {
   "when": "the winner was behind overall after at least one earlier season and still won",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserTotal",
    "margin",
    "seasons",
    "winner",
    "winnerClub",
    "winnerTotal"
   ]
  },
  "final-wire-to-wire": {
   "when": "the winner led overall after every single season",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserTotal",
    "margin",
    "seasons",
    "winner",
    "winnerClub",
    "winnerTotal"
   ]
  },
  "final-golden": {
   "when": "the winner won a 10-season Golden Showdown",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserTotal",
    "margin",
    "seasons",
    "winner",
    "winnerClub",
    "winnerTotal"
   ]
  },
  "final-sprint": {
   "when": "the winner won a 1-season Showdown",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserTotal",
    "margin",
    "seasons",
    "winner",
    "winnerClub",
    "winnerTotal"
   ]
  },
  "final-last-season-swing": {
   "when": "the overall lead changed hands in the very last season",
   "count": 60,
   "slots": [
    "loser",
    "loserClub",
    "loserTotal",
    "margin",
    "seasons",
    "winner",
    "winnerClub",
    "winnerTotal"
   ]
  }
 },
 "N13": {
  "special-top-3": {
   "when": "the player is ranked 1 to 3 in the list (black, blue and gold badge)",
   "count": 60,
   "slots": [
    "club",
    "manager",
    "mpClub",
    "mpName",
    "mpNation",
    "mpPosition",
    "mpRank",
    "rival"
   ]
  },
  "special-top-10": {
   "when": "ranked 4 to 10 (blue and gold badge)",
   "count": 60,
   "slots": [
    "club",
    "manager",
    "mpClub",
    "mpName",
    "mpNation",
    "mpPosition",
    "mpRank",
    "rival"
   ]
  },
  "special-top-20": {
   "when": "ranked 11 to 20 (gold badge)",
   "count": 60,
   "slots": [
    "club",
    "manager",
    "mpClub",
    "mpName",
    "mpNation",
    "mpPosition",
    "mpRank",
    "rival"
   ]
  },
  "special-top-50": {
   "when": "ranked 21 to 50 (silver badge)",
   "count": 60,
   "slots": [
    "club",
    "manager",
    "mpClub",
    "mpName",
    "mpNation",
    "mpPosition",
    "mpRank",
    "rival"
   ]
  },
  "special-rest": {
   "when": "ranked 51 or lower (bronze badge): a prospect, still a top-300 talent",
   "count": 60,
   "slots": [
    "club",
    "manager",
    "mpClub",
    "mpName",
    "mpNation",
    "mpPosition",
    "mpRank",
    "rival"
   ]
  }
 },
 "N14": {
  "special-own-club": {
   "when": "the Special Player's real club is the very club this manager was assigned",
   "count": 60,
   "slots": [
    "club",
    "manager",
    "mpClub",
    "mpName",
    "mpNation",
    "mpPosition",
    "mpRank",
    "rival"
   ]
  },
  "special-same-nation": {
   "when": "both Special Players come from the same nation",
   "count": 60,
   "slots": [
    "managerA",
    "managerB",
    "mpClubA",
    "mpClubB",
    "mpNameA",
    "mpNameB",
    "mpNation",
    "mpPosition",
    "mpRankA",
    "mpRankB"
   ]
  },
  "special-same-position": {
   "when": "both Special Players play the same position",
   "count": 60,
   "slots": [
    "managerA",
    "managerB",
    "mpClubA",
    "mpClubB",
    "mpNameA",
    "mpNameB",
    "mpNation",
    "mpPosition",
    "mpRankA",
    "mpRankB"
   ]
  },
  "special-rank-gap": {
   "when": "the two players are 100 or more ranks apart",
   "count": 60,
   "slots": [
    "managerA",
    "managerB",
    "mpClubA",
    "mpClubB",
    "mpNameA",
    "mpNameB",
    "mpNation",
    "mpPosition",
    "mpRankA",
    "mpRankB"
   ]
  },
  "special-both-elite": {
   "when": "both players are in the top 20",
   "count": 60,
   "slots": [
    "managerA",
    "managerB",
    "mpClubA",
    "mpClubB",
    "mpNameA",
    "mpNameB",
    "mpNation",
    "mpPosition",
    "mpRankA",
    "mpRankB"
   ]
  }
 },
 "N15": {
  "clubs-same-league": {
   "when": "both managers were given clubs in the same league ({league}): same table, different careers",
   "count": 75,
   "slots": [
    "clubA",
    "clubB",
    "league",
    "managerA",
    "managerB"
   ]
  },
  "clubs-different-leagues": {
   "when": "the two clubs play in different leagues",
   "count": 75,
   "slots": [
    "clubA",
    "clubB",
    "league",
    "managerA",
    "managerB"
   ]
  },
  "club-premier-league": {
   "when": "a manager was just given a Premier League club",
   "count": 30,
   "slots": [
    "club",
    "manager",
    "rival",
    "rivalClub"
   ]
  },
  "club-laliga": {
   "when": "a manager was just given a LaLiga club",
   "count": 30,
   "slots": [
    "club",
    "manager",
    "rival",
    "rivalClub"
   ]
  },
  "club-bundesliga": {
   "when": "a manager was just given a Bundesliga club",
   "count": 30,
   "slots": [
    "club",
    "manager",
    "rival",
    "rivalClub"
   ]
  },
  "club-serie-a": {
   "when": "a manager was just given a Serie A club",
   "count": 30,
   "slots": [
    "club",
    "manager",
    "rival",
    "rivalClub"
   ]
  },
  "club-ligue-1": {
   "when": "a manager was just given a Ligue 1 club",
   "count": 30,
   "slots": [
    "club",
    "manager",
    "rival",
    "rivalClub"
   ]
  }
 },
 "N16": {
  "career-first-showdown": {
   "when": "this was the very first finished Showdown between the two",
   "count": 60,
   "slots": [
    "careerLeader",
    "careerLosses",
    "careerTrailer",
    "careerWins",
    "draws",
    "loser",
    "showdowns",
    "winner"
   ]
  },
  "career-lead-extended": {
   "when": "the career leader just won another Showdown",
   "count": 60,
   "slots": [
    "careerLeader",
    "careerLosses",
    "careerTrailer",
    "careerWins",
    "draws",
    "loser",
    "showdowns",
    "winner"
   ]
  },
  "career-new-leader": {
   "when": "this result made a new career leader",
   "count": 60,
   "slots": [
    "careerLeader",
    "careerLosses",
    "careerTrailer",
    "careerWins",
    "draws",
    "loser",
    "showdowns",
    "winner"
   ]
  },
  "career-level": {
   "when": "career Showdown wins are now equal",
   "count": 60,
   "slots": [
    "careerWins",
    "draws",
    "managerA",
    "managerB",
    "showdowns"
   ]
  },
  "career-revenge": {
   "when": "this winner lost the previous Showdown",
   "count": 60,
   "slots": [
    "careerLeader",
    "careerLosses",
    "careerTrailer",
    "careerWins",
    "draws",
    "loser",
    "showdowns",
    "winner"
   ]
  }
 },
 "N17": {
  "preview-first-season": {
   "when": "season 1 is about to start",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "gap",
    "leader",
    "managerA",
    "managerB",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer"
   ]
  },
  "preview-leader": {
   "when": "a season is about to start and {leader} leads by {gap}",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "gap",
    "leader",
    "managerA",
    "managerB",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer"
   ]
  },
  "preview-level": {
   "when": "a season is about to start with the overall totals equal",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "gap",
    "leader",
    "managerA",
    "managerB",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer"
   ]
  },
  "preview-final-season": {
   "when": "the final season is about to start",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "gap",
    "leader",
    "managerA",
    "managerB",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer"
   ]
  },
  "preview-golden": {
   "when": "a 10-season Golden Showdown is about to begin",
   "count": 60,
   "slots": [
    "clubA",
    "clubB",
    "gap",
    "leader",
    "managerA",
    "managerB",
    "season",
    "seasons",
    "seasonsLeft",
    "trailer"
   ]
  }
 }
}
```


## FILE: data/gazetteCopy.js (EXCERPT: first 30000 bytes of 188215; the rest has the same row shape)
```javascript
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeGazetteCopy=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // HO-041 Touchline Gazette copy (built by gazette/copy/build_copy.py from the checked batches).
  // stories: front-page lead stories by situation and edition. duets: two-voice commentary (lead + co), show on a two-line bar.
  // small: briefs, captions (by photo), ears and quotes. Fill {placeholders} like frontPages.js.
  const freeze=list=>Object.freeze(list.map(row=>Object.freeze(row)));
  const STORIES=freeze([
    {"id":"s-001","situation":"big-win","edition":"season","byline":"From our touchline desk","standfirst":"{winner} did not so much win season {seasonNo} as finish it, and {loser} is left reading the table from the far end of the room.","paragraphs":["Some seasons are a fight. This one was a procession. {winnerClub} ended {margin} clear of {loserClub}, and the only suspense left was how politely anyone could mention it.","The tally of {winnerPoints} against {loserPoints} needs no adjectives. {loser} will treat it as a lesson rather than a verdict, and the Gazette suspects the revision timetable is already drawn up.","Season {seasonNo} of {seasonsTotal} is in the book. The rivalry, as ever, is not."],"pullquote":{"text":"That was not a gap. That was a different postcode.","who":"A Gazette columnist"}},
    {"id":"s-002","situation":"big-win","edition":"season","byline":"Our chief football correspondent","standfirst":"Rarely does a season name its winner so early and so plainly, and {winnerClub} wore the finish as though it had been tailored.","paragraphs":["The best campaigns settle their business early and spend the rest in celebration. {winner} guided {winnerClub} home {margin} clear of {loser} and {loserClub}, and the closing weeks felt like a lap of honour.","{loser} deserves a fair word, because chasing a lead this size takes nerve. Still, {winnerPoints} to {loserPoints} is a verdict that will be quoted for a good while.","Expect a response. Rivals who finish this far back tend to arrive early next time."],"pullquote":{"text":"They did not win the season. They moved into it.","who":"The press box"}},
    {"id":"s-003","situation":"big-win","edition":"season","byline":"Reported from the directors' box","standfirst":"From the directors' box the view was unmistakable, with {winner} high above the table and {loser} waving politely from below.","paragraphs":["Directors like a tidy season, and this one was spotless. {winnerClub} finished {margin} ahead, and the box agreed that {winner} had run the whole campaign like a well-kept ledger.","{loserClub} will not enjoy the arithmetic of {winnerPoints} against {loserPoints}. Yet {loser} has the temperament for a comeback, and the gap is a number, not a destiny.","Season {seasonNo} closes with one manager serene and the other sharpening a pencil."],"pullquote":{"text":"A lead like that is built in every week, never in a day.","who":"A veteran of the box"}},
    {"id":"s-004","situation":"big-win","edition":"season","byline":"From the press gallery","standfirst":"{winner} left season {seasonNo} with a lead so wide that {loser} might need a map and a good pair of boots to close it.","paragraphs":["Gaps like this do not happen by accident. {winner} ran {winnerClub} with a steady hand all year and finished {margin} ahead of {loserClub}, which is the sort of margin that makes pundits quiet.","There is no shame in being second to a season this assured. {loser} still took {loserPoints} and will carry plenty of material into the next chapter.","The gallery's advice is simple. Keep your eyes on the leader and your boots laced."],"pullquote":{"text":"Some leads are earned. This one was practically framed.","who":"A Gazette columnist"}},
    {"id":"s-005","situation":"big-win","edition":"season","byline":"Our rivalry correspondent","standfirst":"The rivalry has seen close finishes and bitter finishes, but season {seasonNo} was neither, since {winner} simply pulled away.","paragraphs":["Every rivalry needs a season like this to remind it how wide a table can open. {winnerClub} finished {margin} in front, and {loserClub} spent the final stretch looking up the standings with admiration.","The tally of {winnerPoints} points to {loserPoints} is the headline, but the story underneath is calmer. {winner} never let the pace drop, and {loser} could never quite close the distance.","Round {seasonsTotal} of the argument is a long way from over."],"pullquote":{"text":"A good rival makes the gap look bigger and the comeback sweeter.","who":"The rivalry desk"}},
    {"id":"s-006","situation":"big-win","edition":"season","byline":"From the statistician's corner","standfirst":"The statisticians reached for their widest column to record season {seasonNo}, where {winner} finished {margin} clear of {loser}.","paragraphs":["A table can lie about a close race, but it cannot hide a rout. {winnerClub} totalled {winnerPoints}, {loserClub} totalled {loserPoints}, and the subtraction left the corner in a respectful hush.","By any measure the season belonged to {winner}. The pace was steady, the results were firm and the gap grew without ceremony until it could no longer be ignored.","{loser} will study these figures closely. Good numbers can be rewritten, and the next season is already open."],"pullquote":{"text":"The figures do not argue. They just keep adding up.","who":"The scorers' table"}},
    {"id":"s-007","situation":"comfortable-win","edition":"season","byline":"From our touchline desk","standfirst":"Season {seasonNo} went to {winner} by a comfortable distance, with {loser} close enough to see the finish but never quite to touch it.","paragraphs":["There was no photo finish and no late drama. {winnerClub} finished {margin} ahead of {loserClub}, a lead built week by week and held without fuss.","{loser} made the pursuit honest, and {loserPoints} is a total that deserved better luck. But {winnerPoints} is simply a better number, and {winner} knew precisely how to protect it.","Season {seasonNo} of {seasonsTotal} is done. The next one begins with a fresh table and a short memory."],"pullquote":{"text":"Comfortable is the politest word for convincing.","who":"A Gazette columnist"}},
    {"id":"s-008","situation":"comfortable-win","edition":"season","byline":"By the Gazette football desk","standfirst":"Quiet authority carried {winner} through season {seasonNo}, and {loser} had to settle for a front-row view of the finish.","paragraphs":["Not every title needs fireworks. {winnerClub} won steadily, finished {margin} clear and never gave {loserClub} a real sniff of the lead in the closing stretch.","For {loser} the season was solid but not enough. The tally of {loserPoints} would have won in plenty of years, and that is the cruel charm of a rivalry with a strong opponent.","Everything now turns to the next campaign, where authority will be tested again."],"pullquote":{"text":"The best wins look easy, and never are.","who":"The football desk"}},
    {"id":"s-009","situation":"comfortable-win","edition":"season","byline":"Our rivalry correspondent","standfirst":"A lead of {margin} sounds modest on paper, but {winner} made it feel like a wall as season {seasonNo} closed.","paragraphs":["Rivalry reporters learn to read between the lines of a table. {winnerClub} stayed ahead of {loserClub} through the closing weeks, and {margin} was a gap {loser} could see but never bridge.","The tally of {winnerPoints} against {loserPoints} reads as a fair result. {winner} earned the lead and {loser} earned the respect, which in this contest is a currency of its own.","The ledger turns to season {seasonNo} plus one, and nothing is settled."],"pullquote":{"text":"Nobody ran away with it. They just kept walking faster.","who":"The rivalry desk"}},
    {"id":"s-010","situation":"comfortable-win","edition":"season","byline":"From the Gazette press gallery","standfirst":"With season {seasonNo} done, {winner} has the edge, and {loser} has a very good reason to start the next one early.","paragraphs":["The Gazette press gallery watched the closing weeks from the cheap seats, and the verdict was unanimous. {winnerClub} controlled the finish and ended {margin} in front of {loserClub}.","There were moments when {loser} threatened to narrow the gap. None lasted, and {winner} had an answer ready every time, which is what separates a good season from a winning one.","Next year's gallery will be full. Everyone wants to see the reply."],"pullquote":{"text":"You can feel a rival lean in. Then you feel them run out of road.","who":"A Gazette columnist"}},
    {"id":"s-011","situation":"comfortable-win","edition":"season","byline":"Gazette football desk","standfirst":"Calm hands won season {seasonNo} for {winner}, who steered {winnerClub} home {margin} ahead of a game and persistent {loser}.","paragraphs":["Calm is underrated in a rivalry. {winner} kept the pace sensible and the results steady, and the table rewarded {winnerClub} with {winnerPoints} and a healthy cushion.","{loserClub} finished on {loserPoints}, a total of real quality, and {loser} can hold their head high. The margin hurts only because the standard was so high.","Season {seasonNo} of {seasonsTotal} will be remembered as the one that stayed under control."],"pullquote":{"text":"Steady wins seasons, and showy wins applause.","who":"The Gazette desk"}},
    {"id":"s-012","situation":"comfortable-win","edition":"season","byline":"By our senior correspondent","standfirst":"Our senior correspondent has seen plenty of campaigns, and few have been settled as tidily as {winner} settled season {seasonNo}.","paragraphs":["The shape of the season was clear by the closing weeks. {winnerClub} led, {loserClub} chased, and the final table showed {winnerPoints} against {loserPoints}, a gap of {margin} that nobody could argue with.","{loser} produced a respectable campaign, and the Gazette does not for a moment suggest otherwise. It simply happened to meet a slightly better one.","The reply is next, and rivals of this temperament always have one."],"pullquote":{"text":"It was not a landslide. It was a very firm nudge.","who":"A senior columnist"}},
    {"id":"s-013","situation":"narrow-win","edition":"season","byline":"From our touchline desk","standfirst":"The margin was thin enough to read through, and {winner} edged season {seasonNo} by {margin} over a defiant {loser}.","paragraphs":["A season this close is decided in the margins, and the margins were kind to {winnerClub}. It ended {margin} ahead of {loserClub}, with {winnerPoints} against {loserPoints} on the board.","{loser} will replay a handful of moments for weeks. That is the lot of the runner-up in a race like this, and it is also the fuel for what comes next.","Season {seasonNo} of {seasonsTotal} ends with one very happy manager and one very close call."],"pullquote":{"text":"Thin margins make loud memories.","who":"A Gazette columnist"}},
    {"id":"s-014","situation":"narrow-win","edition":"season","byline":"By our senior correspondent","standfirst":"It took the very last pages of season {seasonNo} to settle things, and {winner} came through by {margin} to take the honours.","paragraphs":["Nerves were on show in both camps. In the end {winnerClub} held firm, finished {margin} ahead and left {loserClub} to wonder how a season so well fought could end so narrowly.","{loser} earned {loserPoints} and the full respect of the press box. Close results sting more, but they also tend to produce the best second acts.","The rematch is already circled in red. Season {seasonNo} was merely the opening round of a long argument."],"pullquote":{"text":"Close enough to touch. Far enough to hurt.","who":"The senior desk"}},
    {"id":"s-015","situation":"narrow-win","edition":"season","byline":"From the press box","standfirst":"From the press box it looked like a coin toss until the end, but {winner} called it right and finished season {seasonNo} ahead by {margin}.","paragraphs":["The whole box held its breath. {winnerClub} and {loserClub} traded the lead in spirit all year, and only the closing table showed that {winner} had held on by {margin}.","No one could call {loser} unlucky, only unrewarded. The tally of {loserPoints} is a total that would please most managers, and {winnerPoints} simply pleased one more.","That is how rivalries are kept honest."],"pullquote":{"text":"Next season, the coin gets tossed again.","who":"The press box"}},
    {"id":"s-016","situation":"narrow-win","edition":"season","byline":"Our chief football writer","standfirst":"Our chief football writer calls it the closest kind of victory, where {winner} held {loser} off by {margin} and not a point more.","paragraphs":["Narrow wins have a flavour of their own. {winnerClub} did not dominate, did not coast and did not flinch, and the result was a lead of {margin} that felt larger than it looked.","{loserClub} pushed to the last, and {loser} should be proud of a total of {loserPoints}. Little separated the sides, which is just how this rivalry likes it.","Season {seasonNo} has a winner, but the argument has no end."],"pullquote":{"text":"A narrow win still counts in full. That is the cruelty of arithmetic.","who":"A Gazette columnist"}},
    {"id":"s-017","situation":"narrow-win","edition":"season","byline":"From our rivalry desk","standfirst":"The rivalry desk has rarely seen a gap so slim hold so firm, as {winner} finished season {seasonNo} just {margin} ahead of {loser}.","paragraphs":["There is a particular tension in a season that could have gone either way. {winnerClub} edged it, {loserClub} pressed to the end, and the table shows {winnerPoints} against {loserPoints} with almost nothing between.","{winner} took the honours and {loser} took the notes. Both will be better for it, and the Gazette expects the next meeting to be as tight.","Season {seasonNo} of {seasonsTotal} proves once more that the rivalry is not for the faint-hearted."],"pullquote":{"text":"A season this close deserves two trophies and one engraver.","who":"The rivalry desk"}},
    {"id":"s-018","situation":"narrow-win","edition":"season","byline":"By our archive correspondent","standfirst":"The archive correspondent opened the old files and found few seasons as tight as this one, where {winner} won by just {margin}.","paragraphs":["Archives are full of comfortable winners. Rarer is a finish like this, with {winnerClub} ahead of {loserClub} by the slimmest of gaps and the outcome in doubt almost to the final tally.","The tally of {winnerPoints} against {loserPoints} will be filed with care. {loser} should know that the folder is labelled close, and that close is a respectable thing to be.","The archive has space for season {seasonNo} plus one. Come and fill it."],"pullquote":{"text":"History remembers the winners. It quietly respects the near misses.","who":"The archive"}},
    {"id":"s-019","situation":"draw","edition":"season","byline":"From our touchline desk","standfirst":"{managerA} and {managerB} finished season {seasonNo} on {points} points apiece, and the Gazette must report that the record holds no winner.","paragraphs":["Nothing separated {clubA} and {clubB} when season {seasonNo} closed. Both managers ended on {points} points, and the space for a victor's name now carries two names in equal type.","It is a rare result in a rivalry built on comparison. {managerA} cannot claim the better season and {managerB} cannot concede one, so honour stays intact and a grievance stays unjustified.","Season {seasonNo} of {seasonsTotal} goes into the archive as a shared page."],"pullquote":{"text":"A dead heat is the rival's way of saying maybe next time.","who":"A Gazette columnist"}},
    {"id":"s-020","situation":"draw","edition":"season","byline":"By our chief correspondent","standfirst":"Season {seasonNo} ends with {clubA} and {clubB} locked together on {points} points, a result the record books will list without a victor.","paragraphs":["The ledger closed on identical entries. {managerA} of {clubA} and {managerB} of {clubB} each collected {points} points, and the Gazette finds no champion to crown and nobody to console.","Rivalries are usually defined by who blinked first. Here neither blinked, and each manager can fairly say the other gave everything.","Across {seasonsTotal} seasons, a level year changes little on paper and a great deal in the mind."],"pullquote":{"text":"Neither blinked. The table just shrugged.","who":"The chief desk"}},
    {"id":"s-021","situation":"draw","edition":"season","byline":"From the press gallery","standfirst":"Mirror images in the standings, as {managerA} and {managerB} both finish season {seasonNo} on {points} points and neither can look down on the other.","paragraphs":["Hold the two seasons to the light and they match exactly. {clubA} brought {points} points to the finish and so did {clubB}, leaving {managerA} and {managerB} staring across an even page.","A draw asks more of the spectator than a decisive result. There is no hero to cheer and no villain to blame, only equal competitors and an unresolved argument between friends.","The argument resumes next season with no advantage claimed."],"pullquote":{"text":"You could lay a ruler across those seasons and it would sit flat.","who":"The press gallery"}},
    {"id":"s-022","situation":"draw","edition":"season","byline":"From our honours desk","standfirst":"No single name goes on top this time, because {managerA} and {managerB} finished season {seasonNo} with the same {points} points each.","paragraphs":["The honours board keeps room for a single name per season, and this year it has been asked to hold both. {clubA} and {clubB} ended level on {points} points, and the board will simply have to share.","Neither manager has a triumph to tell, and neither has a disappointment. Seasons of identical value, in a rivalry this keen, are their own kind of compliment.","The engraver can put down the chisel. Season {seasonNo} of {seasonsTotal} is complete."],"pullquote":{"text":"There was room on the board for a champion. Nobody asked for it.","who":"The honours desk"}},
    {"id":"s-023","situation":"draw","edition":"season","byline":"From our court correspondent","standfirst":"Patience is the lesson of season {seasonNo}, which ended with {clubA} and {clubB} on {points} points each and the argument adjourned.","paragraphs":["Judgement will have to wait. The season meant to separate {managerA} and {managerB} gave each of them {points} points instead, and both cases stand exactly where they began.","Adjourned is the right word. Nobody has been refused anything, because nobody was owed anything. The court of opinion needs another sitting.","That sitting is already booked in the form of next season."],"pullquote":{"text":"Case adjourned. Bring better evidence next time, both of you.","who":"The court desk"}},
    {"id":"s-024","situation":"draw","edition":"season","byline":"From the scorers' table","standfirst":"The scales settled flat in season {seasonNo}, with {managerA} and {managerB} each holding {points} points and neither pan dropping an inch.","paragraphs":["A pair of scales has a simple honesty, and this year it reads level. {clubA} placed {points} points on one side, {clubB} placed {points} on the other, and the beam did not tremble.","It makes for a fair account of the season. {managerA} can point to a campaign of real worth, and so can {managerB}, and nobody in good faith could call either lighter.","The scales will be loaded again next season, and the Gazette will watch the beam closely."],"pullquote":{"text":"Weigh them as carefully as you like. They come out the same.","who":"The scorers' table"}},
    {"id":"s-025","situation":"champions-league","edition":"season","byline":"From the European football desk","standfirst":"The Champions League belongs to {winner}, whose European triumph gives the season a distinction beyond the usual rivalry ledger.","paragraphs":["Some trophies reward a good campaign. The Champions League gives a campaign its defining sentence. With {winnerClub} crowned in Europe, {winner} has supplied this season of the Showdown with a result that needs no embellishment.","For {loser}, the achievement is formidable without being final in every sense. The rivalry still belongs to both managers, and other honours retain their value. Yet this is the distinction against which the season will primarily be measured.","A cabinet now has its centrepiece. Whatever comes after, this edition of the Gazette will remember who placed it there."],"pullquote":{"text":"There are honours you count, and honours that change how the counting feels.","who":"A Gazette columnist"}},
    {"id":"s-026","situation":"champions-league","edition":"season","byline":"From our rivalry correspondent","standfirst":"For all the attention on {winner}'s European crown, {loser} remains an essential part of what makes the achievement matter.","paragraphs":["An achievement acquires a different force when someone trusted is there to measure it. {winner} has won the Champions League, and the familiar comparison with {loser} turns that European honour into a particularly resonant Showdown moment.","It would be a mistake to treat {loser} as mere scenery for somebody else's success. A lasting rivalry is built on an opponent capable of giving every honour context, and on the understanding that admiration need not mean surrender.","For now, the recognition belongs with {winnerClub}. The respect that surrounds it belongs to a competition in which neither manager has become irrelevant."],"pullquote":{"text":"A worthy rival does not diminish a trophy. A worthy rival gives it depth.","who":"A Gazette columnist"}},
    {"id":"s-027","situation":"champions-league","edition":"season","byline":"From the editorial football desk","standfirst":"In a contest built on comparison, {winner} has earned a distinction that requires no reference to the other manager.","paragraphs":["Not every important sentence in a rivalry needs the rival's name. {winner} has led {winnerClub} to the Champions League, and the achievement stands on its own before it becomes a point of comparison with anything else.","This matters in a Showdown where the temptation is always to ask what {loser} did in return. That question has its place, but it should follow rather than interrupt recognition of a European title properly won.","The competition between friends will recover its familiar rhythm. For now, there is an honour to acknowledge without a qualification attached."],"pullquote":{"text":"Comparison gives the contest its shape. Achievement gives it something worth comparing.","who":"A Gazette columnist"}},
    {"id":"s-028","situation":"champions-league","edition":"season","byline":"Dispatch from the archive desk","standfirst":"The European title has supplied the Showdown archive with a clear landmark, attached permanently to {winner} and {winnerClub}.","paragraphs":["Open an old sporting archive and the details are often crowded, but the principal honours survive in the margins. This season has provided such an entry: {winner} has taken {winnerClub} to the Champions League crown.","The importance of the entry is not that it settles every debate with {loser}. It is that future readings of the rivalry will find a definite European achievement, rather than a claim dependent on opinion or nostalgia.","The ink is barely dry in the Gazette's imagined record book. Already, the most important line is unlikely to need revision."],"pullquote":{"text":"Memory can exaggerate a season. A European title requires no assistance from memory.","who":"The archive editor"}},
    {"id":"s-029","situation":"champions-league","edition":"season","byline":"The Touchline Gazette's lead writer","standfirst":"With the Champions League secured, {winner} has turned a question of ambition into a matter of established achievement.","paragraphs":["Ambition is easy to declare and difficult to file as evidence. {winner} has gone beyond aspiration by delivering the Champions League for {winnerClub}, placing a European title in a season that will be remembered for a concrete distinction.","The result also improves the quality of the rivalry's argument. {loser} is no longer being compared with a promise or a projection, but with an honour that has actually been secured and entered into the Showdown record.","That is the useful finality of silverware. The future can be contested, debated and imagined, while the trophy already belongs in the present tense."],"pullquote":{"text":"Promise is an attractive headline. Proof is the stronger story.","who":"A Gazette columnist"}},
    {"id":"s-030","situation":"champions-league","edition":"season","byline":"From the Gazette's closing column","standfirst":"For {winner}, the Champions League has supplied an enduring answer to football's simplest question: what was won?","paragraphs":["When the season is reduced to its essentials, {winner} will have a wonderfully direct answer. {winnerClub} won the Champions League. Much else may be said about the Showdown, but none of it can make that achievement less definite.","It is an answer that {loser} can acknowledge without conceding the value of a separate campaign. Both managers are linked by comparison, not obliged to regard every piece of the other's success as a personal defeat.","The Gazette closes its report with the trophy itself. No imagined speech is required, and no exaggerated promise about tomorrow could improve the final line."],"pullquote":{"text":"End the argument where the evidence is strongest: with the trophy.","who":"The closing desk"}},
    {"id":"s-031","situation":"europa-league","edition":"season","byline":"From the continental desk","standfirst":"European silverware has found its way to {winnerClub}, giving {winner} a lasting achievement in a season shared with a familiar rival.","paragraphs":["The Europa League trophy has a new home in this Showdown. {winner} has claimed it with {winnerClub}, placing a continental honour at the heart of a season that will now carry a European distinction of its own.","The result gives {loser} something substantial to answer, but it does not make the rival's efforts disposable. This contest is built on separate campaigns judged together, and a European title deserves its own place within that comparison.","Long after the season's figures have been filed, the achievement will remain straightforward: {winnerClub} finished this European competition as its champion."],"pullquote":{"text":"A European trophy needs no borrowed grandeur to justify its place.","who":"A Gazette columnist"}},
    {"id":"s-032","situation":"europa-league","edition":"season","byline":"Our correspondent on honours","standfirst":"The Europa League victory gives {winner} something more durable than an impressive entry in the seasonal points record.","paragraphs":["An entry in the Showdown ledger can be read in a moment. What stands behind this one is larger: {winner} has guided {winnerClub} to the Europa League title, a concrete honour rather than an interpretation of form.","For {loser}, the distinction matters because the rivalry measures accomplishments, not simply competing opinions about them. A trophy provides evidence that both managers can recognise, even as they continue to value their own seasons differently.","In the archive, the figures will sit beside the title. Neither needs exaggerating, and together they explain why this European success merits the front page."],"pullquote":{"text":"Figures record the contest. The cup tells us what one campaign achieved.","who":"The Gazette archive editor"}},
    {"id":"s-033","situation":"europa-league","edition":"season","byline":"The Gazette rivalry correspondent","standfirst":"{loser} has a European triumph to measure against, after {winner} turned this season into a title-winning campaign for {winnerClub}.","paragraphs":["Respect is easiest to recognise when the achievement belongs to somebody else. {loser} has watched a rival manager claim the Europa League with {winnerClub}, an outcome that commands attention even inside a competition designed for friendly argument.","That is the particular strength of this Showdown. The managers remain opponents, yet the honours have meaning beyond their contest. {winner} takes the European title, while {loserClub} continues to stand for a separate campaign and its own ambitions.","No tribute requires a concession about the future. This edition records a deserved title and leaves the next chapter free to belong to either manager."],"pullquote":{"text":"A proper rivalry can recognise a fine achievement without losing its appetite.","who":"The press box"}},
    {"id":"s-034","situation":"europa-league","edition":"season","byline":"Our writer on European football","standfirst":"{winnerClub} has secured the Europa League, an achievement that merits recognition on its own terms rather than by comparison with another trophy.","paragraphs":["There is no need to borrow prestige from a different competition. The Europa League offers a European title in its own right, and {winner} has won it with {winnerClub} during a season that now carries that distinction.","The temptation in a rivalry is to rank every honour before the congratulations are finished. Yet {loser} and {winner} are better served by an honest account: this is a significant continental achievement, whatever else the seasonal comparison contains.","When the Gazette returns to this campaign, it will not need a grander name for the cup. Winning the Europa League is enough."],"pullquote":{"text":"Call the competition by its name, then give the champions their due.","who":"The press box"}},
    {"id":"s-035","situation":"europa-league","edition":"season","byline":"The continental honours correspondent","standfirst":"The achievement of {win
...[excerpt ends]
```


## FILE: data/frontPages.js (EXCERPT: first 20000 bytes of 172669; the rest has the same row shape)
```javascript
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeFrontPages=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // HO-041 Touchline Gazette headlines (built by gazette/copy/build_copy.py from the checked batches; replaces r86).
  // season: the season front page after Season Results. final: the Final Winner front page.
  // {placeholders} are filled at show time; equal totals are always a draw.
  const freeze=list=>Object.freeze(list.map(row=>Object.freeze(row)));
  const SEASON=freeze([
    {"id":"h1-001","situation":"big-win","headline":"BUILT TO LAST","subhead":"{winner} took season {seasonNo} with {winnerPoints} points and finished {margin} clear of {loser}. A campaign made for keeping.","kicker":"SEASON REPORT"},
    {"id":"h1-002","situation":"big-win","headline":"EVERY NICHE FILLED","subhead":"Not a corner was left empty as {winner} ran up {winnerPoints} points and left {loser} {margin} behind.","kicker":"CABINET WATCH"},
    {"id":"h1-003","situation":"big-win","headline":"ENGRAVER WORKS OVERTIME","subhead":"The craftsman barely put his tools down as {winner} closed season {seasonNo} {margin} ahead of {loser}.","kicker":"TROPHY ROOM"},
    {"id":"h1-004","situation":"big-win","headline":"ONE FOR THE DISPLAY CASE","subhead":"{winnerClub} will want this one behind glass after {winner} outscored {loser} by {margin} in season {seasonNo}.","kicker":"SEASON REPORT"},
    {"id":"h1-005","situation":"big-win","headline":"MEDALS WEIGH HEAVY","subhead":"{winner} carries a hefty haul home after finishing {margin} clear of {loser}. A rematch will be welcomed.","kicker":"VERDICT"},
    {"id":"h1-006","situation":"big-win","headline":"THE LOCK, THE KEYS, THE LOT","subhead":"With {winnerPoints} points to {loserPoints} the lock and the story of season {seasonNo} are both in {winner}'s pocket.","kicker":"RUNAWAY"},
    {"id":"h1-007","situation":"big-win","headline":"SILVER SPEAKS LOUDEST","subhead":"No speeches were needed. {winner} let the haul do the talking and finished {margin} ahead of {loser}.","kicker":"STATEMENT"},
    {"id":"h1-008","situation":"big-win","headline":"PLINTHS IN SHORT SUPPLY","subhead":"{winnerClub} is running out of places to stand its prizes after {winner} cleared {loser} by {margin}.","kicker":"CABINET WATCH"},
    {"id":"h1-009","situation":"big-win","headline":"NEW WOOD FOR THE BOARD","subhead":"Fresh timber is on order at {winnerClub} as {winner} completes a season {margin} clear of a gallant {loser}.","kicker":"HONOURS"},
    {"id":"h1-010","situation":"big-win","headline":"VELVET LINING, IRON RESOLVE","subhead":"Soft on the shelf and hard on the pitch. {winner} finished season {seasonNo} on {winnerPoints} points against {loserPoints}.","kicker":"ANALYSIS"},
    {"id":"h1-011","situation":"big-win","headline":"A LUSTROUS LOPSIDED AFFAIR","subhead":"{winner} shone brightest by a distance and ended season {seasonNo} a commanding {margin} in front of {loser}.","kicker":"LOPSIDED"},
    {"id":"h1-012","situation":"big-win","headline":"MANTELPIECE OVERFLOWS","subhead":"There is simply no ledge left at {winnerClub} after {winner} raced {margin} clear of {loser}.","kicker":"TROPHY ROOM"},
    {"id":"h1-013","situation":"big-win","headline":"GLEAMING PROOF OF A RUNAWAY","subhead":"The evidence sits on the shelf. {winner} posted {winnerPoints} points while {loser} finished on {loserPoints}.","kicker":"FULL TIME"},
    {"id":"h1-014","situation":"big-win","headline":"HALLMARKS OF A MASTERCLASS","subhead":"Every stamp of quality was present as {winner} took season {seasonNo} by a towering {margin} over {loser}.","kicker":"ANALYSIS"},
    {"id":"h1-015","situation":"big-win","headline":"CURATOR'S BUSIEST YEAR","subhead":"Somebody at {winnerClub} has a lot of arranging to do after {winner} finished {margin} ahead of {loser}.","kicker":"HONOURS"},
    {"id":"h1-016","situation":"big-win","headline":"WALL SPACE AT A PREMIUM","subhead":"Hooks and frames are scarce at {winnerClub} after a season {winner} won by {margin} over {loser}.","kicker":"CABINET WATCH"},
    {"id":"h1-017","situation":"big-win","headline":"NOT A SPECK OF DOUBT","subhead":"Season {seasonNo} was settled long before the end. {winner} finished on {winnerPoints} and {loser} on {loserPoints}.","kicker":"VERDICT"},
    {"id":"h1-018","situation":"big-win","headline":"THE BRIGHTEST GLOW","subhead":"The brightest glow of season {seasonNo} came from {winnerClub}, who finished {margin} clear of {loserClub}.","kicker":"STATEMENT"},
    {"id":"h1-019","situation":"big-win","headline":"AN HEIRLOOM HAUL","subhead":"A season to pass down the generations. {winner} amassed {winnerPoints} points and left {loser} {margin} adrift.","kicker":"HONOURS"},
    {"id":"h1-020","situation":"big-win","headline":"NAMEPLATES IN BULK","subhead":"The brass shop near {winnerClub} is booming after {winner} beat {loser} by {margin} this season.","kicker":"TROPHY ROOM"},
    {"id":"h1-021","situation":"big-win","headline":"RAIDING THE VAULT","subhead":"{winner} walked off with the riches of season {seasonNo} and finished {margin} ahead of a game {loser}.","kicker":"BREAKING"},
    {"id":"h1-022","situation":"big-win","headline":"BRACKETS BUCKLE!","subhead":"The shelving at {winnerClub} is groaning under a season that ended {winnerPoints} points to {loserPoints} in their favour.","kicker":"EXCLUSIVE"},
    {"id":"h1-023","situation":"big-win","headline":"GLASS DOORS GROAN!","subhead":"The cabinet will barely close after {winner} stormed to a {margin}-point season win over {loser}.","kicker":"BREAKING"},
    {"id":"h1-024","situation":"big-win","headline":"POLISH PANIC!","subhead":"Supplies are running low at {winnerClub} after {winner} finished season {seasonNo} on {winnerPoints} points.","kicker":"LANDSLIDE"},
    {"id":"h1-025","situation":"big-win","headline":"HINGES SNAP UNDER STRAIN!","subhead":"Something had to give as {winner} piled up the prizes and ended {margin} ahead of {loser}.","kicker":"EXCLUSIVE"},
    {"id":"h1-026","situation":"big-win","headline":"NOBODY CATCHES THEM","subhead":"{loser} gave chase all season but {winner} pulled {margin} clear by the time season {seasonNo} closed.","kicker":"RUNAWAY"},
    {"id":"h1-027","situation":"big-win","headline":"LOCKSMITH CALLED IN","subhead":"Bigger locks are needed at {winnerClub} after {winner} secured season {seasonNo} by {margin} over {loser}.","kicker":"BREAKING"},
    {"id":"h1-028","situation":"big-win","headline":"DUSTERS SEIZED IN SWOOP","subhead":"Cleaning crews mobilise as {winner} returns with {winnerPoints} points and comfortably outpaces {loser} on {loserPoints}.","kicker":"EXCLUSIVE"},
    {"id":"h1-029","situation":"big-win","headline":"CARPENTERS ON STANDBY","subhead":"Extra shelving may be needed after {winner} finished season {seasonNo} a whopping {margin} clear of {loser}.","kicker":"LANDSLIDE"},
    {"id":"h1-030","situation":"big-win","headline":"SPOTLIGHT STOLEN","subhead":"Every lamp in the house turned toward {winner}, who ended season {seasonNo} {margin} ahead of {loser}.","kicker":"MISMATCH"},
    {"id":"h1-031","situation":"big-win","headline":"TROPHY ROOM BURSTS","subhead":"The walls of {winnerClub} can barely hold it all after {winner} beat {loser} by {margin}.","kicker":"LANDSLIDE"},
    {"id":"h1-032","situation":"big-win","headline":"SILVERWARE STAMPEDE","subhead":"The prizes came thick and fast for {winner}, who closed season {seasonNo} on {winnerPoints} points to {loserPoints}.","kicker":"SILVERWARE"},
    {"id":"h1-033","situation":"big-win","headline":"SIDEBOARD SWEPT BARE","subhead":"{winner} cleared the table of honours in season {seasonNo} and left {loser} {margin} behind and plotting a reply.","kicker":"MISMATCH"},
    {"id":"h1-034","situation":"big-win","headline":"BURNISHED AND UNSTOPPABLE","subhead":"{winner} buffed a brilliant season to a high finish and ended {margin} clear of {loser}.","kicker":"POLISHED"},
    {"id":"h1-035","situation":"big-win","headline":"SHEEN MACHINE ROLLS ON","subhead":"Season {seasonNo} of {seasonsTotal} belonged to {winner}, who ran up {winnerPoints} points while {loser} managed {loserPoints}.","kicker":"ONE WAY"},
    {"id":"h1-036","situation":"big-win","headline":"RIBBONS GALORE","subhead":"Every handle at {winnerClub} wears fresh colours after {winner} finished {margin} ahead of {loser}.","kicker":"SILVERWARE"},
    {"id":"h1-037","situation":"big-win","headline":"A GOLD RUSH, BANKED","subhead":"{winner} struck it rich in season {seasonNo} and banked {winnerPoints} points to open a {margin}-point gap on {loser}.","kicker":"BREAKING"},
    {"id":"h1-038","situation":"big-win","headline":"PEDESTAL PILE UP","subhead":"The prizes are queuing for a spot after {winner} took season {seasonNo} by {margin} over {loser}.","kicker":"ONE WAY"},
    {"id":"h1-039","situation":"big-win","headline":"CRATES KEEP COMING","subhead":"Deliveries roll in at {winnerClub} after {winner} won the season by {winnerPoints} points to {loserPoints}.","kicker":"EXCLUSIVE"},
    {"id":"h1-040","situation":"big-win","headline":"GLINT IN THEIR EYE","subhead":"{winner} looked hungry from the start and finished season {seasonNo} a sparkling {margin} ahead of {loser}.","kicker":"MISMATCH"},
    {"id":"h1-041","situation":"comfortable-win","headline":"POLISH BEFORE PLAUDITS","subhead":"A measured victory for {winner} gives the season a decisive shape without diminishing the challenge offered by {loser}.","kicker":"SPORTS EDITION"},
    {"id":"h1-042","situation":"comfortable-win","headline":"LABEL MAKES IT PLAIN","subhead":"When the final points were entered, {winner} had enough separation from {loser} to make the verdict straightforward.","kicker":"THE SEASON FILE"},
    {"id":"h1-043","situation":"comfortable-win","headline":"ENGRAVING THE ADVANTAGE","subhead":"The season's record leaves little room for dispute as {winner} finishes comfortably above {loser} in the points.","kicker":"FRONT PAGE"},
    {"id":"h1-044","situation":"comfortable-win","headline":"RIBBON OF DISTINCTION","subhead":"Measured in points, the latest victory belongs to {winner}, with {loser} finishing a distinct but not humiliating distance behind.","kicker":"COMPETITION FILE"},
    {"id":"h1-045","situation":"comfortable-win","headline":"AN EXHIBIT OF COMPOSURE","subhead":"A strong return from {winnerClub} delivers the season to {winner}, with {loser} unable to narrow the final gap.","kicker":"SATURDAY EDITION"},
    {"id":"h1-046","situation":"comfortable-win","headline":"A SHINE ABOVE THE REST","subhead":"Measured against {loser}, the stronger season belongs securely to {winner}, though the friendly competition is far from exhausted.","kicker":"RESULTS BUREAU"},
    {"id":"h1-047","situation":"comfortable-win","headline":"UNLOCK THE HONOURS!","subhead":"{winner} has made the season's verdict plain, gaining an unmistakable points advantage over an enduring rival in {loser}.","kicker":"LATE EDITION"},
    {"id":"h1-048","situation":"comfortable-win","headline":"PUT THE KEY AWAY!","subhead":"With {winner} comfortably in front on points, this season's argument is settled and {loser} must look forward.","kicker":"RIVALRY BULLETIN"},
    {"id":"h1-049","situation":"comfortable-win","headline":"MAKE ROOM FOR MERIT!","subhead":"{winner} has earned the leading place this season, leaving {loser} with a gap that is definite rather than devastating.","kicker":"CABINET ALERT"},
    {"id":"h1-050","situation":"comfortable-win","headline":"RAISE THE DISPLAY BAR!","subhead":"Without the excess of a rout, {winner} still sets an unmistakably stronger standard than {loser} in the completed season.","kicker":"PRESS ROOM"},
    {"id":"h1-051","situation":"comfortable-win","headline":"CLAIM THE PRIME SPOT","subhead":"There is a confident new name at the top of this season's comparison, and it belongs to {winner}.","kicker":"LATEST RESULT"},
    {"id":"h1-052","situation":"comfortable-win","headline":"GRAB THE GOLDEN HANDLE","subhead":"A clear advantage is enough for {winner} to carry the season, even if {loser} was far from an afterthought.","kicker":"THE WIRE"},
    {"id":"h1-053","situation":"comfortable-win","headline":"ETCH IT IN BRASS","subhead":"This is the kind of solid season victory {winner} can cherish while {loser} prepares a thoughtful answer.","kicker":"THE BIG READ"},
    {"id":"h1-054","situation":"comfortable-win","headline":"POLISHED AT THE POST","subhead":"The season's final comparison rewards {winner} with a comfortable lead, while {loser} remains keenly involved in the rivalry.","kicker":"FOOTBALL FILE"},
    {"id":"h1-055","situation":"comfortable-win","headline":"A CLEAN SHEET OF GLASS","subhead":"Through the finished points comparison, {winner}'s advantage over {loser} is plain to see, reassuringly strong and entirely deserved.","kicker":"FOOTBALL REVIEW"},
    {"id":"h1-056","situation":"comfortable-win","headline":"TOP FLIGHT, TOP SHELF","subhead":"A well earned advantage for {winner} places {loser} some distance back in the season's final assessment.","kicker":"LEAGUE DESK"},
    {"id":"h1-057","situation":"comfortable-win","headline":"EXTRA TIME FOR ENGRAVING","subhead":"There is no extra contest needed here, because {winner} has already earned a comfortable season victory over {loser}.","kicker":"FINAL WHISTLE"},
    {"id":"h1-058","situation":"comfortable-win","headline":"WHISTLE GETS A POLISH","subhead":"On the final evidence, {winner} deserves this comfortable victory, with {loser} still a meaningful challenger in the wider rivalry.","kicker":"TROPHY BULLETIN"},
    {"id":"h1-059","situation":"comfortable-win","headline":"GLASS GLEAMS, GAP GROWS","subhead":"{winner} secures this season's victory by a healthy amount, a result with substance rather than needless spectacle.","kicker":"THE MUSEUM FILE"},
    {"id":"h1-060","situation":"comfortable-win","headline":"KEYS CLICK, CASES CLOSE","subhead":"A comfortable finish places {winner} on top this season, and leaves {loser} to plan the next response.","kicker":"INSIDE THE GAME"},
    {"id":"h1-061","situation":"comfortable-win","headline":"SHOWCASE SHUTS ON SUSPENSE","subhead":"The final comparison falls decisively to {winner}, putting a comfortable gap between the managers for this season.","kicker":"RIVALS IN FOCUS"},
    {"id":"h1-062","situation":"comfortable-win","headline":"IS THE PLAQUE READY?","subhead":"There is a convincing seasonal winner in {winner}, though {loser} keeps the contest worth watching beyond this round.","kicker":"FROM THE DESK"},
    {"id":"h1-063","situation":"comfortable-win","headline":"CAN THE PLATE SAY MORE?","subhead":"Across the completed standings, {winner} enjoys a convincing season victory over {loser}, and the final separation speaks for itself.","kicker":"FOOTBALL QUESTIONS"},
    {"id":"h1-064","situation":"comfortable-win","headline":"ETCHED WITH EASE","subhead":"The latest outcome gives {winner} a reassuring cushion over {loser}, making for a calm and emphatic decision.","kicker":"THE ENGRAVING"},
    {"id":"h1-065","situation":"comfortable-win","headline":"NO DUST REQUIRED","subhead":"{winner}'s result remains fresh and impressive, with the season settled comfortably in their favour over {loser}.","kicker":"THE NEXT EDITION"},
    {"id":"h1-066","situation":"comfortable-win","headline":"GOLD WITHOUT GLOATING","subhead":"A reassuring seasonal advantage puts {winner} on top, with enough respect left in the rivalry for {loser}.","kicker":"THE FEATURE PAGE"},
    {"id":"h1-067","situation":"comfortable-win","headline":"MARGIN WITH MANNERS","subhead":"{winner} enjoys an assured win without making {loser} an afterthought, the mark of a pleasingly competitive showdown.","kicker":"THE SMALL PRINT"},
    {"id":"h1-068","situation":"comfortable-win","headline":"CURTAIN RISES ON COMMAND","subhead":"A measured advantage gave {winner} the season, leaving {loser} with ground to recover when the rivalry resumes.","kicker":"SEASON DESK"},
    {"id":"h1-069","situation":"comfortable-win","headline":"AN UNHURRIED FINALE","subhead":"There was room to breathe at the finish as {winner} claimed the season with a substantial but measured advantage.","kicker":"CULTURE PAGE"},
    {"id":"h1-070","situation":"comfortable-win","headline":"PLOT REVEALS A WINNER","subhead":"The latest installment ended decisively for {winner}, who put enough distance between the clubs to avoid a nervous verdict.","kicker":"SEASON REVIEW"},
    {"id":"h1-071","situation":"comfortable-win","headline":"COMPOSURE TAKES THE STAGE","subhead":"Rather than a last moment scramble, {winnerClub} delivered the steadier conclusion and finished comfortably above {loserClub} for the season.","kicker":"MAIN FEATURE"},
    {"id":"h1-072","situation":"comfortable-win","headline":"CREDITS ROLL ON A WIN","subhead":"When the season's figures were settled, {winnerClub} stood comfortably above {loserClub}, giving this edition its deserved lead story.","kicker":"FILM REVIEW"},
    {"id":"h1-073","situation":"comfortable-win","headline":"MATINEE OF AUTHORITY","subhead":"There was no cliffhanger in this result: {winner} earned a comfortable season victory while {loser} looks toward the next contest.","kicker":"SUNDAY REVIEW"},
    {"id":"h1-074","situation":"comfortable-win","headline":"ENDING LEAVES NO DOUBT","subhead":"A settled verdict puts {winner} above {loser} for the season, without deciding what the next installment may bring.","kicker":"SEASON SPECIAL"},
    {"id":"h1-075","situation":"comfortable-win","headline":"STEAL THE SPOTLIGHT","subhead":"With the seasonal totals complete, {winner} commands the headlines after a victory that never needed a razor thin margin.","kicker":"LATE BULLETIN"},
    {"id":"h1-076","situation":"comfortable-win","headline":"SEIZE THE SCENE","subhead":"An assured seasonal performance gave {winnerClub} the advantage over {loserClub}, and the paper has found its principal subject.","kicker":"PRESS GALLERY"},
    {"id":"h1-077","situation":"comfortable-win","headline":"OUTSHINE THE BILL","subhead":"Without diminishing {loser}'s campaign, {winnerClub} supplied the stronger season and earned a place above its rival.","kicker":"BILLING DESK"},
    {"id":"h1-078","situation":"comfortable-win","headline":"PUT THE RESULT ON AIR","subhead":"There is no need to keep the outcome offscreen, with {winner} finishing comfortably in front of {loser}.","kicker":"CLOSING NOTICE"},
    {"id":"h1-079","situation":"comfortable-win","headline":"NET RESULT, STAR QUALITY","subhead":"The difference between the managers was convincing, and {winner} deserves the leading credit for a well earned season success.","kicker":"SPORTS AND ARTS"},
    {"id":"h1-080","situation":"comfortable-win","headline":"DUGOUT DRAMA GETS CUT","subhead":"No late twist was needed to determine the stronger season, because {winner} had established a persuasive points advantage.","kicker":"DUGOUT FILE"},
    {"id":"h1-081","situation":"narrow-win","headline":"GLASS HOLDS A HAIRLINE","subhead":"Through the glass of a closely fought season, {winner} emerges just above {loser}, with scarcely any space between them.","kicker":"RESULTS DESK"},
    {"id":"h1-082","situation":"narrow-win","headline":"ENGRAVED TO A WHISPER","subhead":"Only the thinnest stroke separates the season totals, but it is enough to place {winner} above {loser}.","kicker":"SEASON EDITION"},
    {"id":"h1-083","situation":"narrow-win","headline":"HONOURS IN THE BALANCE","subhead":"The difference could fit on a tiny nameplate, but it gives {winner} the season over {loser}.","kicker":"SHOWCASE REPORT"},
    {"id":"h1-084","situation":"narrow-win","headline":"SPOTLIGHT BY A SLIVER","subhead":"Between {winner} and {loser} lies barely enough distance for a spotlight, but the final season order is unmistakable.","kicker":"BACK PAGE"},
    {"id":"h1-085","situation":"narrow-win","headline":"HOLD THE NAMEPL
...[excerpt ends]
```


## FILE: data/commentaryLines.js (EXCERPT: first 20000 bytes of 965864; the rest has the same row shape)
```javascript
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCommentaryLines=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // r86 commentator lines. results: commentary v2 (Nik 2026-10-28 "every line matches what happened"), 5,100 lines written in 17 runs
  // (N1-N17, source content/r86/<CODE>.json on branch content/r86-pack), lead-reviewed v2 2026-10-28 with the v2 checker. Each line is
  // keyed on one exact situation of data/commentarySituations.json and uses only that situation's slots; js/commentaryEngine.js decides
  // which situations are true and fills the slots. clubs: 5 club-history lines per catalog club (C6-C7, r86 2026-10-27), by mood
  // (win, draw, trophy, any). Equal totals are always a draw, never a tiebreak.
  const freeze=list=>Object.freeze(list.map(row=>Object.freeze(row)));
  const RESULTS=freeze([
    {"id":"n1-001","situation":"season-win-by-1","text":"{winner} takes season {season} of {seasons} by {margin} point, {winnerPoints} to {loserPoints}, and will happily take it."},
    {"id":"n1-002","situation":"season-win-by-1","text":"One point. That is all that separates {winner} from {loser} after season {season}, with {winnerPoints} against {loserPoints} on the board."},
    {"id":"n1-003","situation":"season-win-by-1","text":"Thin margins, big smiles at {winnerClub}: {winnerPoints} Showdown points to {loserPoints}, and the season belongs to {winner}."},
    {"id":"n1-004","situation":"season-win-by-1","text":"You could not slide a sheet of paper between them, but {winner} edges {loser} by {margin} point this season."},
    {"id":"n1-005","situation":"season-win-by-1","text":"Ask {loser} how it feels to lose a season by {margin} point and you may be met with a very long silence."},
    {"id":"n1-006","situation":"season-win-by-1","text":"{loserClub} came within a whisker, finishing on {loserPoints} while {winnerClub} sneaks home with {winnerPoints}."},
    {"id":"n1-007","situation":"season-win-by-1","text":"A photo finish, and the judges give it to {winner}: {winnerPoints} Showdown points against {loserPoints} for {loser}."},
    {"id":"n1-008","situation":"season-win-by-1","text":"What a nail-biter of a season! {winner} survives it, one point clear of {loser} when the dust settles."},
    {"id":"n1-009","situation":"season-win-by-1","text":"Somewhere {loser} is replaying every dropped chance, because {winnerClub} has won season {season} by the slimmest margin there is."},
    {"id":"n1-010","situation":"season-win-by-1","text":"Every point counts, and {winner} counted one more than {loser} this season. That is the whole story, and it is plenty."},
    {"id":"n1-011","situation":"season-win-by-1","text":"Season {season} of {seasons} goes to {winnerClub}, but only just. {loserClub} will feel this one for a while."},
    {"id":"n1-012","situation":"season-win-by-1","text":"By the barest of margins, {winner} comes out on top. {winnerPoints} for {winnerClub}, {loserPoints} for {loserClub}."},
    {"id":"n1-013","situation":"season-win-by-1","text":"Had {loser} found one more Showdown point anywhere, this would be a draw. Instead {winner} claims the season."},
    {"id":"n1-014","situation":"season-win-by-1","text":"If you blinked, you missed the gap: {margin} point between {winner} and {loser}, and it is {winnerClub} who holds it."},
    {"id":"n1-015","situation":"season-win-by-1","text":"Nobody is calling this a procession. {winner} wins by a single point, and {loser} is right behind, breathing down the neck."},
    {"id":"n1-016","situation":"season-win-by-1","text":"Wafer thin, as the comedian says. {winner} takes the season over {loser} with {winnerPoints} points to {loserPoints}."},
    {"id":"n1-017","situation":"season-win-by-1","text":"The gap is so small it deserves its own postcode, and {winner} lives at the right end of it."},
    {"id":"n1-018","situation":"season-win-by-1","text":"Pencil that in: {winner} wins by {margin} point. Pen would have been braver, but pencil is all the gap allows."},
    {"id":"n1-019","situation":"season-win-by-1","text":"For {winnerClub}, a lovely little victory. For {loserClub}, an agonising one-point miss. That is season {season} in a sentence."},
    {"id":"n1-020","situation":"season-win-by-1","text":"There is a fine line between winning and losing, and this season it was exactly one Showdown point wide."},
    {"id":"n1-021","situation":"season-win-by-1","text":"Hats off to {winner}, who gets over the line with {winnerPoints}, while {loser} has to settle for {loserPoints} and a lot of what-ifs."},
    {"id":"n1-022","situation":"season-win-by-1","text":"Imagine being {loser} right now: so close, {loserPoints} against {winnerPoints}, and still the wrong side of the result."},
    {"id":"n1-023","situation":"season-win-by-1","text":"A single point decides it. {winner} wins season {season}, and the smallest gap in the game feels like a mile to {loser}."},
    {"id":"n1-024","situation":"season-win-by-1","text":"Close enough to touch, but {loserClub} could not quite grab it. {winnerClub} finishes one point better."},
    {"id":"n1-025","situation":"season-win-by-1","text":"The scoreboard says {winnerPoints} to {loserPoints}, and the scoreboard does not care how narrow it was. {winner} wins the season."},
    {"id":"n1-026","situation":"season-win-by-1","text":"Tight, tense and settled by {margin} point. {winner} gets the nod in season {season}, and {loser} gets the sleepless night."},
    {"id":"n1-027","situation":"season-win-by-1","text":"They will argue about this one for weeks: {winner} ahead of {loser} by a single point, and nothing to spare."},
    {"id":"n1-028","situation":"season-win-by-1","text":"Credit to {loser}, who pushed {winnerClub} all the way, but {winner} still holds a one-point edge at the end of the season."},
    {"id":"n1-029","situation":"season-win-by-1","text":"Margins like this are why we keep score. {winnerPoints} to {loserPoints}, and {winner} takes the season by that one precious point."},
    {"id":"n1-030","situation":"season-win-by-1","text":"Nerves would be jangling at {winnerClub}, because {winner} only wins this season by {margin} point."},
    {"id":"n1-031","situation":"season-win-by-1","text":"Not a landslide, not a rout, just a lovely one-point win for {winner} in season {season} of {seasons}."},
    {"id":"n1-032","situation":"season-win-by-1","text":"Football is a game of inches, and this season between these two it was measured in a single Showdown point."},
    {"id":"n1-033","situation":"season-win-by-1","text":"{loser} will insist it was a draw in spirit. The record insists {winner} won by {margin} point, {winnerPoints} to {loserPoints}."},
    {"id":"n1-034","situation":"season-win-by-1","text":"Down to the wire it goes, and {winnerClub} has just enough. One point is the difference between {winner} and {loser}."},
    {"id":"n1-035","situation":"season-win-by-1","text":"Let the record show: {winner} won season {season}, {winnerPoints} to {loserPoints}, and the margin is as slim as it gets."},
    {"id":"n1-036","situation":"season-win-by-1","text":"This is the sort of result that makes a manager check the table twice. {winner} is ahead by {margin} point."},
    {"id":"n1-037","situation":"season-win-by-1","text":"A whisker, a hair, a gnat's eyelash: pick your measurement. {winner} beats {loser} to the season by that much."},
    {"id":"n1-038","situation":"season-win-by-1","text":"Only one point in it, but it is {winner}'s point, and {winnerClub} will frame it. Season {season} is theirs."},
    {"id":"n1-039","situation":"season-win-by-1","text":"Cool heads, warm hearts, and exactly one point of daylight. {winner} is the season winner, {loser} the unlucky runner."},
    {"id":"n1-040","situation":"season-win-by-1","text":"Take a bow, {winner}. You have edged season {season} by the minimum, and the minimum is still a win."},
    {"id":"n1-041","situation":"season-win-by-1","text":"In the end there was just one Showdown point between them: {winner} up, {loser} down, and season {season} decided."},
    {"id":"n1-042","situation":"season-win-by-1","text":"Even the neutrals are wincing for {loserClub}. {loserPoints} is a respectable return, but {winnerPoints} is exactly one better."},
    {"id":"n1-043","situation":"season-win-by-1","text":"Hold the champagne, or maybe just one glass: {winner} wins by {margin} point and still has plenty to be pleased about."},
    {"id":"n1-044","situation":"season-win-by-1","text":"Season {season} was a game of cat and mouse, and {winner} just about caught {loser} at the line, one point ahead."},
    {"id":"n1-045","situation":"season-win-by-1","text":"The margin is {margin}. The smile on {winner}'s face is considerably bigger than that, and fair enough too."},
    {"id":"n1-046","situation":"season-win-by-1","text":"If this were a boxing match, the judges would have needed a replay. As it is, {winner} wins by a point."},
    {"id":"n1-047","situation":"season-win-by-1","text":"Some seasons are won by miles. This one was won by an arm's length, and the arm belongs to {winnerClub}."},
    {"id":"n1-048","situation":"season-win-by-1","text":"Count it again if you like, but {winnerPoints} beats {loserPoints}, and {winner} wins the season over {loser}."},
    {"id":"n1-049","situation":"season-win-by-1","text":"A cruel, cruel margin for {loser}: {loserClub} fell short by one point in season {season} of {seasons}."},
    {"id":"n1-050","situation":"season-win-by-1","text":"Pure theatre. {winner} grabs the season with {winnerPoints}, leaving {loser} one point adrift on {loserPoints}."},
    {"id":"n1-051","situation":"season-win-by-1","text":"Lose by a goal and you can blame the referee. Lose by a point and you can only blame arithmetic, {loser}."},
    {"id":"n1-052","situation":"season-win-by-1","text":"The tiniest gap makes the sweetest win, says the old saying, and {winner} would surely agree after this one."},
    {"id":"n1-053","situation":"season-win-by-1","text":"Think of it as a very polite victory: {winner} takes the season, but only by one point, and without fuss."},
    {"id":"n1-054","situation":"season-win-by-1","text":"A season of fine detail ends with {winner} ahead on {winnerPoints}, {loser} second on {loserPoints}, and no room to breathe."},
    {"id":"n1-055","situation":"season-win-by-1","text":"It goes down as a win for {winner}, a heartbreaker for {loser}, and a lesson in what one point can weigh."},
    {"id":"n1-056","situation":"season-win-by-1","text":"Spare a thought for {loserClub}, who finished one Showdown point short, while {winnerClub} celebrates a very tight win."},
    {"id":"n1-057","situation":"season-win-by-1","text":"The ledger reads {winnerPoints} against {loserPoints}, and {winner} pockets season {season} without a single point to spare."},
    {"id":"n1-058","situation":"season-win-by-1","text":"Another wafer-thin result, then, as {winner} stays one step ahead of {loser}, by exactly {margin} point."},
    {"id":"n1-059","situation":"season-win-by-1","text":"And that, ladies and gentlemen, is how you win a season by a single point. Well played, {winner}."},
    {"id":"n1-060","situation":"season-win-by-1","text":"Plenty to celebrate for {winnerClub}, plenty to rue for {loserClub}, and exactly one point between the two of them."},
    {"id":"n1-061","situation":"season-win-by-2-3","text":"{winner} wins season {season} of {seasons} by {margin} points, {winnerPoints} against {loserPoints}, and {loser} has some catching up to do."},
    {"id":"n1-062","situation":"season-win-by-2-3","text":"A gap of {margin} points is not a canyon, but it is enough for {winnerClub} to claim the season over {loserClub}."},
    {"id":"n1-063","situation":"season-win-by-2-3","text":"Small but significant: {winner} finishes {margin} Showdown points clear of {loser}, {winnerPoints} to {loserPoints}."},
    {"id":"n1-064","situation":"season-win-by-2-3","text":"Somewhere between a squeak and a stroll, {winner} takes this season by {margin} points over {loser}."},
    {"id":"n1-065","situation":"season-win-by-2-3","text":"You can see daylight, if you squint. {winner} is {margin} points ahead of {loser} and takes season {season}."},
    {"id":"n1-066","situation":"season-win-by-2-3","text":"Credit where it is due: {winnerClub} has the better season, {winnerPoints} points to {loserPoints}, and the margin is {margin}."},
    {"id":"n1-067","situation":"season-win-by-2-3","text":"It is not a romp, but it is a clear result. {winner} beats {loser} to the season by {margin} points."},
    {"id":"n1-068","situation":"season-win-by-2-3","text":"A couple of points can feel like a lifetime, and {loser} is feeling every one of the {margin} that {winner} leads by."},
    {"id":"n1-069","situation":"season-win-by-2-3","text":"Here is the verdict: {winnerPoints} for {winner}, {loserPoints} for {loser}, and a gap of {margin} that nobody can argue with."},
    {"id":"n1-070","situation":"season-win-by-2-3","text":"Season {season} belongs to {winnerClub}, who finish {margin} Showdown points better than {loserClub}."},
    {"id":"n1-071","situation":"season-win-by-2-3","text":"Not a squeaker, not a whitewash. {winner} wins by {margin} points and gets to say it was always going to happen."},
    {"id":"n1-072","situation":"season-win-by-2-3","text":"Measured, modest, and still a victory: {winner} takes the season by {margin} points over a game {loser}."},
    {"id":"n1-073","situation":"season-win-by-2-3","text":"The scoreboard reads {winnerPoints} to {loserPoints}, and the maths is simple. {winner} is {margin} better this season."},
    {"id":"n1-074","situation":"season-win-by-2-3","text":"Make no mistake, that is a win. A gap of {margin} points means {winner} finished a clear step ahead of {loser}."},
    {"id":"n1-075","situation":"season-win-by-2-3","text":"Gentle applause for {winnerClub}, who clear {loserClub} by {margin} points in season {season} of {seasons}."},
    {"id":"n1-076","situation":"season-win-by-2-3","text":"There is a gap, and it is {margin} Showdown points wide. {winner} stands on the right side of it."},
    {"id":"n1-077","situation":"season-win-by-2-3","text":"{loser} gave it a go, {loserPoints} points is no disgrace, but {winner} found {margin} more and the season is decided."},
    {"id":"n1-078","situation":"season-win-by-2-3","text":"A tidy little advantage: {margin} points to {winner}, and a season win they can bank without breaking a sweat."},
    {"id":"n1-079","situation":"season-win-by-2-3","text":"Think of it as a firm handshake rather than a bear hug: {winner} wins by {margin} points, and {loser} nods respectfully."},
    {"id":"n1-080","situation":"season-win-by-2-3","text":"Call it a comfortable cushion, or a bit of breathing room: either way, {winner} leads {loser} by {margin} for the season."},
    {"id":"n1-081","situation":"season-win-by-2-3","text":"Well, the neighbours will certainly hear about this one. {winner} takes the season by {margin} points over {loser}."},
    {"id":"n1-082","situation":"season-win-by-2-3","text":"{winnerClub} edges clear, {loserClub} falls away slightly, and the season ends {winnerPoints} to {loserPoints} in favour of {winner}."},
    {"id":"n1-083","situation":"season-win-by-2-3","text":"In the end it was not close enough to be a thriller, nor wide enough to be a procession. {winner} by {margin}."},
    {"id":"n1-084","situation":"season-win-by-2-3","text":"Here is a win by {margin} Showdown points, and in this game that is a very respectable margin indeed."},
    {"id":"n1-085","situation":"season-win-by-2-3","text":"Pencil in a win for {winner}: {winnerPoints} points to {loserPoints}, and {loser} left looking for a few missing points somewhere."},
    {"id":"n1-086","situation":"season-win-by-2-3","text":"Good, honest work from {winner} this season, and a gap of {margin} points to show for it against {loser}."},
    {"id":"n1-087","situation":"season-win-by-2-3","text":"A decent chunk separates the pair, {margin} points to be exact, and {winnerClub} is the one with the smile."},
    {"id":"n1-088","situation":"season-win-by-2-3","text":"Let us not oversell it, but let us not undersell it either. {winner} wins season {season} by {margin} points."},
    {"id":"n1-089","situation":"season-win-by-2-3","text":"Few would call it a landslide, yet {winner} is quietly {margin} points ahead of {loser}, and that is all that matters."},
    {"id":"n1-090","situation":"season-win-by-2-3","text":"The gap is not huge, but the result is clear. {winner} wins season {season}, and {loserClub} will want a rematch."},
    {"id":"n1-091","situation":"season-win-by-2-3","text":"Mark it down: {winner} beats {loser} to the season by {margin} points, {winnerPoints} to {loserPoints}."},
    {"id":"n1-092","situation":"season-win-by-2-3","text":"You could say {loser} was knocking on the door, but {winner} had the door held shut by {margin} points."},
    {"id":"n1-093","situation":"season-win-by-2-3","text":"Tough on {loserClub}, who put in a solid shift, but {winnerClub} brought {margin} more points and takes the season."},
    {"id":"n1-094","situation":"season-win-by-2-3","text":"This one has a pleasing symmetry: {winnerPoints} against {loserPoints}, a gap of {margin}, and a worthy winner in {winner}."},
    {"id":"n1-095","situation":"season-win-by-2-3","text":"Fine margins turned slightly wider: {winner} finishes {margin} points above {loser} this season."},
    {"id":"n1-096","situation":"season-win-by-2-3","text":"Your honour, the evidence is clear: {winner} scored {winnerPoints}, {loser} scored {loserPoints}, and the season goes to {winnerClub}."},
    {"id":"n1-097","situation":"season-win-by-2-3","text":"A little breathing space for {winner}, who ends season {season} of {seasons} {margin} points ahead of {loser}."},
    {"id":"n1-098","situation":"season-win-by-2-3","text":"Everything in moderation, including the margin. {winner} wins by {margin} Showdown points, no more, no fewer."},
    {"id":"n1-099","situation":"season-win-by-2-3","text":"That is a good week at the office for {winnerClub}. {winnerPoints} points, a season win, and {margin} to spare over {loserClub}."},
    {"id":"n1-100","situation":"season-win-by-2-3","text":"{loserClub} will look at that gap of {margin} and think it can be closed. {winnerClub} will think it can be defended."},
    {"id":"n1-101","situation":"season-win-by-2-3","text":"Neat, controlled and sensible: {winner} claims the season by {margin} points and leaves {loser} to plot a response."},
    {"id":"n1-102","situation":"season-win-by-2-3","text":"If you wanted a classic nail-biter, look elsewhere. This is a solid {margin}-point result for {winner}, and fair enough."},
    {"id":"n1-103","situation":"season-win-by-2-3","text":"The tape measure comes out and reads {margin} points. {winner} wins season {season}, with {loser} chasing."},
    {"id":"n1-104","situation":"season-win-by-2-3","text":"Not many gaps are worth celebrating, but {margin} points over {loser} is one {winner} can certainly toast."},
    {"id":"n1-105","situation":"season-win-by-2-3","text":"{winner} ends up winning by {margin} points, {winnerPoints} to {loserPoints}, and the season is settled with a little room to spare."},
    {"id":"n1-106","situation":"season-win-by-2-3","text":"Respect to {loser} for hanging in there, but the numbers do not lie. {winner} is {margin} points better in season {season}."},
    {"id":"n1-107","situation":"season-win-by-2-3","text":"A lead of {margin} points can wobble, and it can hold. This season, for {winner}, it held firm."},
    {"id":"n1-108","situation":"season-win-by-2-3","text":"Clear win, cautious win, as {winner} finishes {margin} Showdown points clear of {loser}."},
    {"id":"n1-109","situation":"season-win-by-2-3","text":"Take a moment for {winnerClub}: {winnerPoints
...[excerpt ends]
```


## FILE: tests/contracts/r87-gazette-contracts.cjs
```javascript
'use strict';
// r87 Touchline Gazette (Nik 2026-10-31: a SEASON edition after each Season Results, a FINAL edition after Final Winner, each
// its own page with one CONTINUE). Team V's HO-041 newspaper with the HO-048 copy (approved by Nik 2026-10-31), filled by
// js/touchlineGazette.js from what the screen already holds. Pins: the same paper for the same Showdown and season on both
// phones, rows picked by situation from only the true situations (equal points are a DRAW, no tiebreak), no row repeated
// across one Showdown, every placeholder filled, no "Marquee", zero Firestore reads or writes, and CONTINUE running exactly
// the step the tapped button ran (the flow goes on to the same next screen, and a paper is never shown twice or in the way).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const G=require('../../js/touchlineGazette.js');
const Copy=require('../../data/gazetteCopy.js');
const Pages=require('../../data/frontPages.js');
const Season=require('../../js/seasonFinalV10.js');
const fx=require('../support/active-showdown-fixtures.cjs');
const {projection,result}=require('../support/career-fixture-helpers.cjs');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// Season results, by Showdown points: CL 5, EL 3, league title 3, cup 1, performance 1, awards 1 (11 at most).
const R={
  max:result({leaguePosition:1,leaguePoints:101,championsLeague:true,domesticCup:true,topScorer:true}), // 11
  clLeague:result({leaguePosition:1,championsLeague:true}), // 8
  cl:result({championsLeague:true}), // 5
  league:result({leaguePosition:1}), // 3
  cupAward:result({domesticCup:true,topScorer:true}), // 2
  cup:result({domesticCup:true}), // 1
  none:result({leaguePosition:9}) // 0
};
const proj=(seed,T,seasons)=>projection({seed,totalSeasons:T,seasons});
const sp={daniel:{name:'Lionel Messi'},nik:{name:'Cristiano Ronaldo'}};
const frame=p=>Season.finalFrame(fx.finalReconciliation(p),fx.closed(p),fx.history(p));
const DRAW_SITUATIONS=new Set(['draw','level-overall','final-season-decider']);

// G1 the same Showdown and season always print the same paper; the Showdown id steers the choice.
{
  const p=proj('a',3,[[R.clLeague,R.cupAward],[R.cl,R.cl]]);
  const a=G.seasonEdition({projection:p,seasonNumber:1,specialPlayers:sp}),b=G.seasonEdition({projection:JSON.parse(JSON.stringify(p)),seasonNumber:1,specialPlayers:sp});
  assert.ok(a&&Object.isFrozen(a));assert.equal(a.key,`${p.rivalryId}|season|1`);assert.equal(G.paperText(a),G.paperText(b));assert.deepEqual(a.ids,b.ids);
  assert.notEqual(G.paperText(a),G.paperText(G.seasonEdition({projection:p,seasonNumber:2})),'another season, another paper');
  const heads=new Set();for(const seed of '0123456789abcdef')heads.add(G.seasonEdition({projection:proj(seed,3,[[R.clLeague,R.cupAward]]),seasonNumber:1}).paper.headline);
  assert.ok(heads.size>=8,`the Showdown id steers the paper (${heads.size} headlines over 16 Showdowns with the same season)`);
  const f1=G.finalEdition({projection:proj('b',3,[[R.cl,R.none],[R.league,R.cup],[R.cup,R.none]])}),f2=G.finalEdition({projection:proj('b',3,[[R.cl,R.none],[R.league,R.cup],[R.cup,R.none]])});
  assert.equal(f1.key,`${'pair_'+'b'.repeat(64)}|final|3`);assert.equal(G.paperText(f1),G.paperText(f2));
  ok('G1','one paper per Showdown + season (+ edition), the same on every run, chosen by the Showdown id');
}

// G2 both phones print the same paper: nothing about who is looking reaches the choice.
{
  const p=proj('c',3,[[R.cl,R.league],[R.cupAward,R.max]]);
  const daniel={...fx.history(p),managerRole:'playerOne'},nik={...fx.history(p),managerRole:'playerTwo',runtimeRevision:'other'};
  const a=G.seasonEdition(G.seasonInput({history:daniel,specialPlayers:sp})),b=G.seasonEdition(G.seasonInput({history:nik,specialPlayers:sp}));
  assert.ok(a&&b);assert.equal(G.paperText(a),G.paperText(b));assert.equal(a.paper.left.name,'Daniel');assert.equal(a.paper.right.name,'Nik');
  const full=proj('c',3,[[R.cl,R.league],[R.cupAward,R.max],[R.none,R.cup]]),fr=frame(full);
  const fa=G.finalEdition(G.finalInput({final:fr,history:{...fx.history(full),managerRole:'playerOne'}})),fb=G.finalEdition(G.finalInput({final:fr,history:{...fx.history(full),managerRole:'playerTwo'}}));
  assert.ok(fa&&fb);assert.equal(G.paperText(fa),G.paperText(fb));
  const src=read('js/touchlineGazette.js');assert.ok(!/managerRole|managerId|CareerModeIdentity|getIdentity|accountId|deviceId/.test(src),'the Gazette never reads who is looking');
  ok('G2','Daniel\'s and Nik\'s phones print the same season and final papers (Daniel on the left, Nik on the right)');
}

// G3 equal points are a DRAW: drawn pages only, kicker DRAWN, never a winner, no tiebreak (seasons won do not count).
{
  const p=proj('d',3,[[R.cl,R.cl]]);const e=G.seasonEdition({projection:p,seasonNumber:1});
  assert.equal(e.winner,'draw');assert.equal(e.paper.kicker,'DRAWN');assert.equal(e.situation,'draw');assert.equal(e.paper.variant,'draw');assert.equal(e.paper.photo.name,'GZ_LEAD_DRAW');
  assert.deepEqual(G.seasonSituations(p,1),['draw']);
  assert.ok(!/\bwins\b|\bwinner\b|\bbeat\b/i.test([e.paper.kicker,e.paper.headline].join(' ')));
  for(const seed of '0123456789abcdef'){
    const d=G.seasonEdition({projection:proj(seed,3,[[R.league,R.cup],[R.cup,R.cup]]),seasonNumber:2});
    assert.equal(d.paper.kicker,'DRAWN');assert.ok(DRAW_SITUATIONS.has(d.situation),d.situation);
    assert.ok(Pages.season.find(r=>r.id===d.ids.headline).situation===d.situation);
    const row=Pages.season.find(r=>r.id===d.ids.headline),story=Copy.stories.find(s=>s.id===d.ids.story);
    assert.ok(!/\{(winner|loser)/.test(JSON.stringify([row,story])),'a drawn season never takes a winner row');
  }
  // Final: Daniel wins two of three seasons, Nik's one big season levels the totals: a drawn Showdown, no tiebreak.
  const level=proj('e',3,[[R.cup,R.none],[R.cup,R.none],[R.none,R.cupAward]]);
  assert.equal(level.managerRecords.playerOne.totalPoints,level.managerRecords.playerTwo.totalPoints);
  const f=G.finalEdition({projection:level,final:frame(level)});
  assert.equal(f.winner,'draw');assert.equal(f.situation,'showdown-drawn');assert.equal(f.paper.kicker,'DRAWN');assert.equal(f.paper.photo.name,'GZ_LEAD_DRAW');assert.equal(f.paper.portrait,null);
  assert.ok(!f.paper.briefs.some(b=>b.trophy==='TRO_SHOWDOWN_CHAMPION'),'nobody gets the Showdown trophy on a draw');
  assert.ok(!/tie-?break|goal difference|head[- ]to[- ]head|on goals|seasons won/i.test(G.paperText(f)));
  ok('G3','equal points print a DRAW (season and final), from the drawn pages only, with no winner, trophy or tiebreak');
}

// G4 only true situations are offered, and a paper never contradicts the screen.
{
  const sit=(seasons,N,T=3)=>G.seasonSituations(proj('f',T,seasons),N);
  assert.ok(sit([[R.cupAward,R.cup]],1).includes('narrow-win'));assert.ok(!sit([[R.cupAward,R.cup]],1).includes('big-win'),'a 1-point win is never a big win');
  assert.ok(sit([[R.clLeague,R.cupAward]],1).includes('big-win'));assert.ok(sit([[R.cl,R.cupAward]],1).includes('comfortable-win'));
  assert.ok(sit([[R.cl,R.league]],1).includes('champions-league'));assert.ok(!sit([[R.cl,R.cl]],1).includes('champions-league'));
  assert.ok(sit([[R.none,R.cl],[R.cl,R.none]],2).includes('level-overall'));
  assert.ok(sit([[R.none,R.max],[R.cl,R.none]],2).includes('comeback'));assert.ok(sit([[R.cl,R.none],[R.cl,R.none]],2).includes('lead-extended'));
  assert.ok(sit([[R.cl,R.none],[R.cl,R.none],[R.cl,R.none]],3,5).includes('winning-streak'));assert.ok(!sit([[R.cl,R.none],[R.cl,R.none]],2,5).includes('winning-streak'));
  assert.ok(sit([[R.cl,R.none],[R.cup,R.none]],2).includes('final-season-decider'),'shown before the last season');
  assert.ok(!sit([[R.max,R.none],[R.max,R.none]],2).includes('final-season-decider'),'not when the last season can no longer settle it');
  assert.ok(!sit([[R.cl,R.none]],1).includes('final-season-decider'));
  assert.equal(G.seasonEdition({projection:proj('f',3,[[R.cl,R.none],[R.cl,R.none],[R.cl,R.none]]),seasonNumber:3}),null,'the last season is told by the final edition');
  // a bonus-only win never prints silverware talk
  for(const seed of '0123456789abcdef'){const e=G.seasonEdition({projection:proj(seed,3,[[result({topScorer:true}),R.none]]),seasonNumber:1});assert.ok(!/silver|troph|cabinet|shelf|title|crown|medal|cup\b/i.test([e.paper.headline,e.paper.subhead,...e.paper.story.paragraphs,e.paper.quote?.text||''].join(' ')),e.paper.headline);}
  // final situations
  const fin=(seed,T,seasons)=>G.finalEdition({projection:proj(seed,T,seasons)});
  assert.equal(fin('1',1,[[R.cl,R.none]]).situation,'showdown-won-1-season');
  const ten=Array.from({length:10},()=>[R.max,R.clLeague]);const golden=fin('2',10,ten);
  assert.equal(golden.situation,'golden-showdown-won');assert.equal(golden.golden,true);assert.equal(golden.paper.variant,'gold');assert.equal(golden.paper.photo.name,'GZ_LEAD_GOLD');
  const tenPlain=fin('3',10,Array.from({length:10},(x,i)=>i%2?[R.cl,R.league]:[R.league,R.cup]));
  assert.ok(['showdown-won-5-seasons','dominant-win','won-on-the-final-day'].includes(tenPlain.situation),tenPlain.situation);assert.equal(tenPlain.golden,false);
  const lastDay=G.finalEdition({projection:proj('4',3,[[R.none,R.cl],[R.cup,R.none],[R.clLeague,R.none]])});
  const lastSits=new Set();for(const seed of '0123456789abcdef')lastSits.add(G.finalEdition({projection:proj(seed,3,[[R.none,R.cl],[R.cup,R.none],[R.clLeague,R.none]])}).situation);
  assert.ok([...lastSits].every(s=>['showdown-won-3-seasons','won-on-the-final-day'].includes(s))&&lastSits.has('won-on-the-final-day'),[...lastSits].join());
  assert.equal(lastDay.winner,'Daniel');
  const domSits=new Set();for(const seed of '0123456789abcdef')domSits.add(G.finalEdition({projection:proj(seed,3,[[R.max,R.none],[R.max,R.none],[R.none,R.cl]])}).situation);
  assert.ok([...domSits].every(s=>['showdown-won-3-seasons','dominant-win'].includes(s))&&domSits.has('dominant-win'),[...domSits].join());
  // the Final Winner frame and the paper never disagree
  const p=proj('5',3,[[R.cl,R.none],[R.cup,R.none],[R.none,R.cup]]),fr=frame(p);
  assert.ok(G.finalEdition({projection:p,final:fr}));assert.equal(G.finalEdition({projection:p,final:{...fr,winner:'nik'}}),null);assert.equal(G.finalEdition({projection:p,final:{...fr,totals:{daniel:1,nik:0}}}),null);
  ok('G4','situations are true to the scores (margins, trophies, overall table, streaks, last-season decider, golden, last-day, dominant) and agree with Final Winner');
}

// G5 every paper of hundreds of Showdowns: printed, placeholders filled, no "Marquee", no repeats inside one Showdown.
{
  let seed=11;const rnd=()=>(seed=(Math.imul(seed,1103515245)+12345)>>>0)/4294967296;
  const one=()=>rnd()<0.15?R.none:result({leaguePosition:rnd()<0.35?1:2+Math.floor(rnd()*8),...(rnd()<0.25?{championsLeague:true}:rnd()<0.2?{europaLeague:true}:{}),domesticCup:rnd()<0.3,topScorer:rnd()<0.2,topAssist:rnd()<0.15,leaguePoints:60+Math.floor(rnd()*45)});
  let papers=0;const seen=new Set();
  for(let n=0;n<400;n+=1){
    const T=[1,3,5,10][n%4],seasons=[];for(let i=0;i<T;i+=1)seasons.push(rnd()<0.12?(r=>[r,r])(one()):[one(),one()]);
    const p={...proj((n%16).toString(16),T,seasons),rivalryId:'pair_'+(n.toString(16)+'0'.repeat(64)).slice(0,64)};
    const heads=[],stories=[];
    for(let N=1;N<T;N+=1){
      const e=G.seasonEdition({projection:p,seasonNumber:N,specialPlayers:sp});assert.ok(e,`season ${N} of Showdown ${n}`);papers+=1;seen.add(e.situation);
      const t=G.paperText(e);assert.ok(!/[{}]/.test(t),`braces: ${n}/${N}`);assert.ok(!/marquee/i.test(t),`Marquee: ${n}/${N}`);
      assert.equal(e.paper.left.score===e.paper.right.score,e.winner==='draw');heads.push(e.ids.headline);stories.push(e.ids.story);
    }
    assert.equal(new Set(heads).size,heads.length,`a headline repeated in Showdown ${n}`);assert.equal(new Set(stories).size,stories.length,`a story repeated in Showdown ${n}`);
    const f=G.finalEdition({projection:p,specialPlayers:sp});assert.ok(f,`final of Showdown ${n}`);papers+=1;seen.add('F:'+f.situation);
    const t=G.paperText(f);assert.ok(!/[{}]/.test(t)&&!/marquee/i.test(t),`final ${n}`);assert.ok(!/next season|next year/i.test(t),`final ${n} looks ahead`);
  }
  for(const s of ['big-win','comfortable-win','narrow-win','draw','champions-league','europa-league','league-title','comeback','lead-extended','level-overall','winning-streak','final-season-decider','F:showdown-won-1-season','F:showdown-won-3-seasons','F:showdown-won-5-seasons','F:showdown-drawn','F:won-on-the-final-day','F:dominant-win'])assert.ok(seen.has(s),`never printed: ${s}`);
  assert.ok(!/marquee/i.test(read('js/touchlineGazette.js').replace(/\/\/.*$/gm,'').replace(/BANNED=\/marquee\/i/,'')),'screen words say Special Player or SP');
  ok('G5',`${papers} papers over 400 Showdowns: all printed, every placeholder filled, no "Marquee", no headline or story repeated within a Showdown, finals never look ahead`);
}

// G6 zero Firestore: the Gazette reads only what the screen already holds and writes nothing but one small local list.
{
  assert.equal(G.firestoreReads,0);assert.equal(G.firestoreWrites,0);
  for(const file of ['js/touchlineGazette.js','data/gazetteCopy.js','data/frontPages.js','visual-assets/v10_1/content/frontpage.js']){
    const src=read(file).replace(/^\s*\/\/.*$/gm,"").replace(/firestore(Reads|Writes):0/g,"");assert.ok(!/firebase|firestore|getDocs?\(|setDoc|updateDoc|onSnapshot|runTransaction|collection\(|fetch\(|XMLHttpRequest|sendBeacon|WebSocket/i.test(src),file);
  }
  assert.ok(/root\.writeStorageValue\(SEEN_KEY/.test(read('js/touchlineGazette.js'))&&!/\blocalStorage\b/.test(read('js/touchlineGazette.js')),'the seen list goes through js/storage.js');assert.equal(G.SEEN_KEY,'careerModeShowdown.gazetteSeen.v1');
  ok('G6','zero Firestore reads or writes: no Firebase, network or storage call besides the local seen list');
}

// ---------- a small page for the flow (just what js/touchlineGazette.js touches) ----------
function world({loadFails=false,lateFiles=false,proceedResult=true,final=null,history,managerRole='playerOne'}={}){
  const capture=[],docListeners={},store=new Map(),calls={continue:0,ownSeason:0,ownBack:0,shown:[],loads:[]};
  let screen='seasonEntry';
  class El{
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.parent=null;this.dataset={};this.attrs={};this.listeners={};this.classes=new Set();this.id='';this.disabled=false;this.textContent='';this.scrollTop=0;this.scrollHeight=0;this.offsetHeight=100;const self=this;this.style={setProperty(k,v){self.style[k]=v;}};this.classList={add:(...c)=>c.forEach(x=>this.classes.add(x)),remove:(...c)=>c.forEach(x=>this.classes.delete(x)),contains:c=>this.classes.has(c)};}
    set className(v){this.classes=new Set(String(v).split(/\s+/).filter(Boolean));}get className(){return [...this.classes].join(' ');}
    get firstElementChild(){return this.children[0]||null;}
    appendChild(c){c.remove();c.parent=this;this.children.push(c);return c;}append(...cs){cs.forEach(c=>this.appendChild(c));}
    after(c){const p=this.parent;c.remove();c.parent=p;p.children.splice(p.children.indexOf(this)+1,0,c);}
    remove(){if(this.parent){this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}}
    get isConnected(){let n=this;while(n.parent)n=n.parent;return n===doc.documentElement;}
    contains(n){while(n){if(n===this)return true;n=n.parent;}return false;}
    matches(sel){return sel.split(',').some(one=>{one=one.trim();if(/\s/.test(one))return false;const m=one.match(/^([a-z]+)?(#[\w-]+)?((?:\.[\w-]+)*)$/i);if(!m)return false;if(m[1]&&m[1].toUpperCase()!==this.tagName)return false;if(m[2]&&m[2].slice(1)!==this.id)return false;return (m[3]||'').split('.').filter(Boolean).every(c=>this.classes.has(c));});}
    closest(sel){let n=this;while(n){if(n.matches(sel))return n;n=n.parent;}return null;}
    querySelector(sel){for(const c of this.children){if(c.matches(sel))return c;const d=c.querySelector(sel);if(d)return d;}return null;}
    setAttribute(k,v){this.attrs[k]=String(v);}addEventListener(t,f){(this.listeners[t]=this.listeners[t]||[]).push(f);}
    getBoundingClientRect(){return {top:0,left:0,width:0,height:0};}focus(){}
    click(){dispatch(this);}
  }
  const doc={documentElement:new El('html'),createElement:t=>new El(t),baseURI:'http://localhost/',
    getElementById(id){const walk=n=>{if(n.id===id)return n;for(const c of n.children){const d=walk(c);if(d)return d;}return null;};return walk(doc.documentElement);},
    addEventListener(t,f){(docListeners[t]=docListeners[t]||[]).push(f);}};
  doc.head=doc.documentElement.appendChild(new El('head'));const body=doc.documentElement.appendChild(new El('body'));
  const main=body.appendChild(new El('main'));const host=main.appendChild(new El('section'));host.id='seasonEntry';
  function dispatch(target){
    const ev={target,stopped:false,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.stopped=true;}};
    for(const f of capture)f(ev);
    if(!ev.stopped)for(let n=target;n;n=n.parent)for(const f of n.listeners.click||[])f(ev);
    return ev;
  }
  const go=to=>{screen=to;for(const f of docListeners['career-mode-screen-shown']||[])f({detail:{screen:to}});};
  // the Season Results continue button (production: js/productionSharedMultiSeasonProgression.js) and Final Winner's exit
  const seasonButton=host.appendChild(new El('button'));seasonButton.id='sharedMultiSeasonContinueAction';
  seasonButton.addEventListener('click',()=>{calls.ownSeason+=1;sandbox.CareerModeProductionSharedMultiSeasonProgression.continueToNextSeason();});
  let back=null;
  if(final){
    host.classList.add('v10FinalMode');seasonButton.remove();
    const stage=host.appendChild(new El('div'));stage.className='v10FinalStage';const actions=stage.appendChild(new El('div'));actions.className='seasonEntryActions';
    back=actions.appendChild(new El('button'));back.className='backButton';back.addEventListener('click',()=>{calls.ownBack+=1;go('mainMenu');});
  }
  const sandbox={
    document:doc,console,Promise,URL,setTimeout,clearTimeout,innerHeight:900,
    addEventListener(t,f,cap){if(t==='click'&&cap)capture.push(f);},removeEventListener(){},scrollTo(){},
    matchMedia:()=>({matches:false}),
    readStorageValue:k=>store.has(k)?store.get(k):null,writeStorageValue:(k,v)=>{store.set(k,String(v));return true;},
    getActiveScreenName:()=>screen,optionalAssetUrl:p=>p+'?v=test',
    loadRuntimeScript:(key)=>loadFails?Promise.reject(new Error('offline')):lateFiles?new Promise(resolve=>setTimeout(()=>{if(late[key])sandbox[late[key][0]]=late[key][1];calls.loads.push(key);resolve(true);},60)):Promise.resolve(true),loadRuntimeStyle:()=>loadFails?Promise.reject(new Error('offline')):Promise.resolve(true),
    Image:class{set src(v){setTimeout(()=>this.onload&&this.onload(),0);}decode(){return Promise.resolve();}},
    ShowdownContent:{frontPage:{art:n=>`visual-assets/v10_1/content/gazette/${n}.webp`,screen(slot,p,onContinue){
      calls.shown.push(p);const s=slot.appendChild(new El('section'));s.className='cmx-fp-screen';const t=s.appendChild(new El('h2'));t.className='cmx-fp-screen__title';
      const desk=s.appendChild(new El('div'));desk.className='cmx-fp-screen__desk';const paper=desk.appendChild(new El('article'));paper.className='cmx-paper';const photo=paper.appendChild(new El('figure'));photo.className='cmx-paper__photo';
      const b=s.appendChild(new El('button'));b.className='cmx-continue';b.addEventListener('click',()=>{if(onContinue)onContinue();});}}},
    CareerModeGazetteCopy:Copy,CareerModeFrontPages:Pages,
    CareerModeProductionSharedHistoryConvergence:{getState:()=>({...history,managerRole})},
    CareerModeProductionSharedMultiSeasonProgression:{canContinue:()=>true,continueToNextSeason:()=>{calls.continue+=1;if(proceedResult)go('dashboard');return proceedResult;}},
    CareerModeSpecialPlayerChip:{liveFor:()=>sp},
    FINAL_WINNER_FIXTURES:final?{frames:{LIVE:final}}:undefined,CareerModeSeasonFinalV10:{gazetteHistory:()=>final?history:null}
  };
  // lateFiles: the paper, the copy and the headlines are not on the page yet when the player taps (a tap before warm() ends)
  const late={'gazette-frontpage':['ShowdownContent',sandbox.ShowdownContent],'gazette-copy':['CareerModeGazetteCopy',Copy],'gazette-headlines':['CareerModeFrontPages',Pages]};
  if(lateFiles)for(const [name] of Object.values(late))delete sandbox[name];
  vm.createContext(sandbox);vm.runInContext(read('js/touchlineGazette.js'),sandbox,{filename:'touchlineGazette.js'});
  const api=sandbox.CareerModeTouchlineGazette;api.install();
  return {api,calls,host,doc,seasonButton,back,dispatch,go,store,screen:()=>screen,page:()=>doc.getElementById('touchlineGazette'),continueButton:()=>doc.getElementById('touchlineGazetteContinue')};
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,30));

(async()=>{
  // G7 SEASON: CONTINUE TO SEASON N+1 opens the paper (its own page), and the paper's CONTINUE runs exactly that step, once.
  {
    const p=proj('6',3,[[R.clLeague,R.cupAward]]),history=fx.history(p);
    const w=world({history});
    const ev=w.dispatch(w.seasonButton);assert.equal(ev.defaultPrevented,true);assert.equal(w.calls.ownSeason,0,'the tap is held while the paper shows');
    await settle();
    assert.ok(w.page(),'the paper is up');assert.equal(w.page().parent,w.host,'inside Season Results, replacing its stage (css hides the rest)');
    assert.equal(w.host.dataset.gazette,'season');assert.equal(w.doc.documentElement.dataset.gazette,'season');assert.equal(w.calls.continue,0);
    const expected=G.seasonEdition({projection:p,seasonNumber:1,specialPlayers:sp});assert.equal(w.calls.shown[0].headline,expected.paper.headline,'the paper on screen is the pure edition');
    assert.ok(w.page().querySelector('.tgz-sp'),'the Special Players line');
    // Nik's phone prints the same paper
    const n=world({history,managerRole:'playerTwo'});n.dispatch(n.seasonButton);await settle();assert.deepEqual(JSON.parse(JSON.stringify(n.calls.shown[0])),JSON.parse(JSON.stringify(w.calls.shown[0])));
    w.dispatch(w.continueButton());await settle();
    assert.equal(w.calls.continue,1,'continueToNextSeason ran once');assert.equal(w.screen(),'dashboard','the flow went on to the same next screen');
    assert.equal(w.page(),null,'the paper closed with the screen');assert.equal(w.host.dataset.gazette,undefined);assert.equal(w.doc.documentElement.dataset.gazette,undefined);
    // replay / reload: the same season's tap goes straight on (the paper is shown once per phone)
    w.go('seasonEntry');const again=w.dispatch(w.seasonButton);await settle();
    assert.equal(again.defaultPrevented,false);assert.equal(w.page(),null);assert.equal(w.calls.ownSeason,1);assert.equal(w.calls.continue,2);
    assert.deepEqual(JSON.parse(w.store.get(G.SEEN_KEY)),[`${p.rivalryId}|season|1`]);
    ok('G7','SEASON edition: shown on CONTINUE TO SEASON N+1, its CONTINUE runs continueToNextSeason once and lands on the same next screen; shown once per phone; both phones print the same paper');
  }
  // G8 FINAL: leaving Final Winner shows the final paper; its CONTINUE lets the same button through, untouched, once.
  {
    const p=proj('7',3,[[R.cl,R.none],[R.cup,R.league],[R.none,R.cup]]),history=fx.history(p),fr=frame(p);
    const w=world({history,final:fr});
    const ev=w.dispatch(w.back);assert.equal(ev.defaultPrevented,true);assert.equal(w.calls.ownBack,0);
    await settle();assert.ok(w.page());assert.equal(w.host.dataset.gazette,'final');
    assert.equal(w.calls.shown[0].headline,G.finalEdition({projection:p,final:fr}).paper.headline);
    w.dispatch(w.continueButton());await settle();
    assert.equal(w.calls.ownBack,1,'BACK TO SHOWDOWN HOME ran once, by its own listener');assert.equal(w.screen(),'mainMenu');assert.equal(w.page(),null);
    w.go('seasonEntry');w.dispatch(w.back);await settle();assert.equal(w.calls.ownBack,2,'second time: straight through');assert.equal(w.page(),null);
    ok('G8','FINAL edition: shown when leaving Final Winner, its CONTINUE lets that same button through once, to the same screen; never twice');
  }
  // G9 never in the way: files that do not load let the tap go on at once; a step that cannot go on closes the paper.
  {
    const p=proj('8',3,[[R.cl,R.none]]),history=fx.history(p);
    const off=world({history,loadFails:true});const ev=off.dispatch(off.seasonButton);assert.equal(ev.defaultPrevented,true);await settle();
    assert.equal(off.page(),null);assert.equal(off.calls.continue,1,'offline: the tap simply went on');assert.equal(off.screen(),'dashboard');
    const stuck=world({history,proceedResult:false});stuck.dispatch(stuck.seasonButton);await settle();assert.ok(stuck.page());
    stuck.dispatch(stuck.continueButton());await settle();assert.equal(stuck.calls.continue,1);assert.equal(stuck.page(),null,'Season Results is back with its own button');assert.equal(stuck.host.dataset.gazette,undefined);
    const src=read('js/touchlineGazette.js');assert.match(src,/ASSET_CAP_MS=4000,FINAL_SAFETY_MS=2500,SEASON_SAFETY_MS=9000/);
    ok('G9','the Gazette never holds anyone up: no files means the tap goes on, a step that cannot go on closes the paper, safety timers close it regardless');
  }
  // G11 a fast tap: CONTINUE pressed before the paper's files are on the page (warm() not finished) is still held for its
  // paper; the files load after the tap, the paper is built and shown, and its CONTINUE runs the same step once (Codex P2).
  {
    const p=proj('9',3,[[R.clLeague,R.cupAward]]),history=fx.history(p);
    const w=world({history,lateFiles:true});
    const ev=w.dispatch(w.seasonButton);assert.equal(ev.defaultPrevented,true,'held although the copy is not loaded yet');assert.equal(w.calls.ownSeason,0);
    assert.equal(w.page(),null);await new Promise(resolve=>setTimeout(resolve,150));
    assert.deepEqual([...w.calls.loads].sort(),['gazette-copy','gazette-frontpage','gazette-headlines','visual-identity']);
    assert.ok(w.page(),'the paper came up once its files arrived');assert.equal(w.calls.shown[0].headline,G.seasonEdition({projection:p,seasonNumber:1,specialPlayers:sp}).paper.headline);
    w.dispatch(w.continueButton());await settle();assert.equal(w.calls.continue,1);assert.equal(w.screen(),'dashboard');assert.equal(w.page(),null);
    const q=proj('9',3,[[R.cl,R.none],[R.cup,R.league],[R.none,R.cup]]),fr=frame(q),f=world({history:fx.history(q),final:fr,lateFiles:true});
    assert.equal(f.dispatch(f.back).defaultPrevented,true);await new Promise(resolve=>setTimeout(resolve,150));
    assert.ok(f.page(),'final paper after a fast tap');f.dispatch(f.continueButton());await settle();assert.equal(f.calls.ownBack,1);assert.equal(f.screen(),'mainMenu');
    // a second tap while the files are still loading is held too (one paper, one step)
    const d=world({history,lateFiles:true});d.dispatch(d.seasonButton);assert.equal(d.dispatch(d.seasonButton).defaultPrevented,true);await new Promise(resolve=>setTimeout(resolve,150));
    assert.equal(d.calls.shown.length,1);assert.equal(d.calls.continue,0);
    ok('G11','a tap made before the paper\'s files arrive is still held for its paper (season and final), shown once, then the same step runs once');
  }
  // G10 the files: HO-048 copy byte for byte, shell-cached, fonts licensed, images on the V10 runtime cache, wired in once.
  {
    const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex');
    // Team V HO-048, origin/claude/project-thread-fyjnky 8fa67110 visual-assets/v10_1/content/{fixtures/gazetteCopy.js,fixtures/frontPages.js,frontpage.js,content.css}
    assert.equal(sha('data/gazetteCopy.js'),'3bc761e89b5e47c79e43df5b6da6d0585a021684c1b43870d492029cae52eb76');
    assert.equal(sha('data/frontPages.js'),'054c60cbfd2ecde8f506014cb8b8b4f99416fb5736200cca53fc5133dfaf0bfd');
    assert.equal(sha('visual-assets/v10_1/content/frontpage.js'),'a4b8ced9ac63123795bfe1d9ee2741027df7426466b5f5b5314c3bf55a58baf6');
    assert.equal(sha('visual-assets/v10_1/content/content.css'),'cfa7f1a4227673127ad34f59f5c0c4272248846cf3a456d2c814923ad0f6f7dc');
    assert.equal(Copy.stories.length,114);assert.equal(Copy.duets.length,288);for(const k of ['briefs','captions','ears','quotes'])assert.equal(Copy.small[k].length,30,k);
    assert.equal(Pages.contentVersion,2);assert.equal(Pages.season.length,477);assert.equal(Pages.final.length,258);
    const sw=read('service-worker.js'),added=new Set(JSON.parse(sw.match(/SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set\((\[[^\]]*\])\)/)[1]));
    const files=['js/touchlineGazette.js','data/gazetteCopy.js','data/frontPages.js','css/v10Gazette.css','visual-assets/v10_1/content/content.css','visual-assets/v10_1/content/frontpage.js',...G.FONT_FILES,...['unifrakturmaguntia','playfair-display','old-standard-tt'].map(f=>`visual-assets/v10_1/content/gazette/fonts/LICENSE-${f}.txt`)];
    for(const f of files){assert.ok(fs.existsSync(path.join(ROOT,f)),f);assert.ok(sw.includes(`  "${f}",`)&&added.has(f),`shell lists ${f} (and as added since r86)`);}
    assert.ok(!/content\/gazette\/GZ_[A-Z_]+\.webp/.test(sw),'press photos ride the V10 image runtime cache, not the shell');
    for(const f of G.FONT_FILES)assert.ok(/LICENSE|SIL Open Font License/i.test(read(`visual-assets/v10_1/content/gazette/fonts/LICENSE-${path.basename(f).split('-latin')[0]}.txt`)),f);
    assert.ok(!fs.readdirSync(path.join(ROOT,'visual-assets/v10_1/content')).some(f=>/\.(md|html|json)$/.test(f)),'reference files live in project-documents/r87/touchline-gazette');
    const sf=read('js/seasonFinalV10.js');
    assert.match(sf,/loadRuntimeScript\("touchline-gazette","js\/touchlineGazette\.js"/);assert.match(sf,/CareerModeTouchlineGazette\?\.install\?\.\(\)/);
    assert.match(sf,/sfGazetteHistory=final\.status==="ready"\?history:null;/);assert.match(sf,/gazetteHistory:\(\)=>sfGazetteHistory/);
    // Commentary v2 keeps its own 5,100 lines: HO-048's commentaryLines.js (24 different situations) is not swapped in.
    assert.equal(require('../../data/commentaryLines.js').results.length,5100);
    const css=read('css/v10Gazette.css');assert.ok(!/rgba\(0,\s*0,\s*0,\s*0?\.\d+\)\s*;?\s*\}?\s*$/m.test(css.replace(/box-shadow[^;]*;/g,'')),'no scrim');assert.ok(!/backdrop-filter|opacity:\s*0?\.\d/.test(css),'no dimming');
    ok('G10','HO-048 headlines, copy, paper and sheet byte for byte; every runtime file shell-cached with its font licence; photos on the image cache; wired from Season Results; Commentary v2 lines untouched; no scrim');
  }
  console.log(`PASS r87 Touchline Gazette contracts: ${checks} checks.`);
})().catch(error=>{console.error(error);process.exit(1);});

```
