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
  const CAREER_SLOTS=Object.freeze(["winner","loser","careerLeader","careerTrailer","careerWins","careerLosses"]);
  const CONDITIONAL_SLOTS=Object.freeze({
    "preview-first-season":["leader","trailer","gap"],"preview-leader":[],"preview-level":["leader","trailer","gap"],"preview-final-season":["leader","trailer","gap"],"preview-golden":["leader","trailer","gap"],
    "streak-two":LEADER_SLOTS,"streak-long":LEADER_SLOTS,"streak-broken":LEADER_SLOTS,
    "clock-halfway":LEADER_SLOTS,"clock-penultimate":LEADER_SLOTS,"clock-final-open":LEADER_SLOTS,
    "clubs-different-leagues":["league"],
    "special-same-nation":["mpPosition"],"special-same-position":["mpNation"],"special-rank-gap":["mpNation","mpPosition"],"special-both-elite":["mpNation","mpPosition"],
    "career-first-showdown":CAREER_SLOTS,"career-revenge":["careerLeader","careerTrailer","careerWins","careerLosses"]
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

  function ceSpecialTier(rank){return rank<=3?"special-top-3":rank<=10?"special-top-10":rank<=20?"special-top-20":rank<=50?"special-top-50":"special-rest";}
  function ceCatalogClub(name){return typeof name==="string"?(CLUB_ALIASES[name]||name):null;}
  function ceSpecialPlayer(facts){
    const m=ceManagers(facts),picks=facts.specialPlayers;
    if(!picks||!picks.playerOne||!picks.playerTwo)return [];
    const mp={};
    for(const role of ROLES){const row=picks[role];if(!Number.isInteger(row.rank)||row.rank<1||typeof row.name!=="string"||!row.name)ceFail("COMMENTARY_SPECIAL_PLAYER_INVALID");mp[role]=row;}
    const out=[];
    for(const role of ROLES){
      const row=mp[role],values={manager:m[role].name,club:m[role].club,rival:m[ceOther(role)].name,mpName:row.name,mpClub:row.club,mpPosition:row.position,mpNation:row.nation,mpRank:row.rank};
      out.push(ceEntry(ceSpecialTier(row.rank),values));
      if(m[role].club&&ceCatalogClub(row.club)===m[role].club)out.push(ceEntry("special-own-club",values));
    }
    const a=mp.playerOne,b=mp.playerTwo,sameNation=!!a.nation&&a.nation===b.nation,samePosition=!!a.position&&a.position===b.position;
    const values={managerA:m.playerOne.name,managerB:m.playerTwo.name,mpNameA:a.name,mpNameB:b.name,mpClubA:a.club,mpClubB:b.club,mpRankA:a.rank,mpRankB:b.rank,mpNation:sameNation?a.nation:null,mpPosition:samePosition?a.position:null};
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
    const out=[];
    if(s===1)out.push(ceEntry("preview-first-season",values));
    if(s===1&&sd.length===10)out.push(ceEntry("preview-golden",values));
    if(s===sd.length)out.push(ceEntry("preview-final-season",values));
    if(s>1&&leader)out.push(ceEntry("preview-leader",values));
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
      if(N===10)out.push(ceEntry("final-golden",values));
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
    if(history.length===0)out.push(ceEntry("career-first-showdown",values));
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
        return Object.freeze({id:line.id,situation:item.situation,text:line.text.replace(/\{(\w+)\}/g,(_,key)=>item.slots[key])});
      }
    }
    return null;
  }

  return Object.freeze({contractVersion:1,feature:"cms-commentary-engine",roles:ROLES,moments:MOMENTS,order:ORDER,situations:SLOTS,codeOf:CODE_OF,
    conditionalSlots:CONDITIONAL_SLOTS,leagues:LEAGUES,clubAliases:CLUB_ALIASES,ordinal:ceOrdinal,situationsFor:ceSituationsFor,pick:cePick,seedFor:ceSeedFor,drawOnEqualTotals:true,tiebreak:false});
});
