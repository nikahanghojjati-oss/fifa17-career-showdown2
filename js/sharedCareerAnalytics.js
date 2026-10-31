(function(root,factory){
  const api=factory(typeof module!=="undefined"&&module.exports?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedCareerAnalytics=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(History){
  "use strict";

  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const MANAGERS=Object.freeze(["daniel","nik"]);
  const COUNTERS=Object.freeze(["careerPoints","seasons","seasonWins","seasonDraws","seasonLosses","championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","performanceBonuses","awardsBonuses"]);
  const BESTS=Object.freeze(["bestSeasonScore","bestLeaguePoints","bestLeagueGoals","bestLeaguePosition"]);
  const AVERAGES=Object.freeze(["averageSeasonScore","averageLeaguePoints","averageLeagueGoals"]);
  const CABINET=Object.freeze(["championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies"]);
  const LABELS=Object.freeze(["Highest season score","Highest league points","Highest league goals","Biggest Showdown win","Most perfect seasons"]);

  function caFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(caFreeze);Object.freeze(value);}return value;}
  function managerBase(unknown){
    return {...Object.fromEntries(COUNTERS.map(key=>[key,unknown?null:0])),...Object.fromEntries([...BESTS,...AVERAGES].map(key=>[key,null])),showdowns:{completed:unknown?null:0,wins:unknown?null:0,draws:unknown?null:0,losses:unknown?null:0}};
  }
  function managerFor(role){return role==="playerOne"?"daniel":role==="playerTwo"?"nik":role==="draw"?"draw":null;}
  function seasonTiebreak(season){
    const a=season.playerOne,b=season.playerTwo;
    // r83: no tiebreak. Equal Showdown points is a draw, whatever the league table says.
    return a.scoring.total!==b.scoring.total?"none":"draw";
  }
  function caCanonical(value){
    if(Array.isArray(value))return "["+value.map(caCanonical).join(",")+"]";
    if(value&&typeof value==="object")return "{"+Object.keys(value).sort().map(key=>JSON.stringify(key)+":"+caCanonical(value[key])).join(",")+"}";
    return JSON.stringify(value);
  }
  function verified(entry){
    const classification=entry.classification;
    if(classification==="abandoned"||classification==="unavailable")return {rivalryId:entry.rivalryId,classification,projection:null,final:null,...(classification==="abandoned"&&entry.ended&&typeof entry.ended==="object"?{ended:endedOf(entry.ended)}:{})};
    if(!["active","completion-pending","completed"].includes(classification))return {rivalryId:entry.rivalryId,classification:"unavailable",projection:null,final:null};
    try{
      const p=History.verifyProjection(entry.projection);
      if(p.rivalryId!==entry.rivalryId)throw new Error("CAREER_RIVALRY_MISMATCH");
      let final=null;
      if(classification!=="active"){
        const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
        const winner=a>b?"playerOne":b>a?"playerTwo":"draw";
        if(entry.final?.totals?.playerOne!==a||entry.final?.totals?.playerTwo!==b||entry.final?.winner!==winner)throw new Error("CAREER_FINAL_MISMATCH");
        final={totals:{playerOne:a,playerTwo:b},winner};
      }
      // r86 (red team #13): the Setup confirm time rides along, so a row can say whether this Showdown has Special Players.
      return {rivalryId:entry.rivalryId,classification,projection:p,final,setupConfirmedAt:Number.isFinite(entry.setupConfirmedAt)?entry.setupConfirmedAt:null};
    }catch(_error){return {rivalryId:entry.rivalryId,classification:"unavailable",projection:null,final:null};}
  }
  function uniqueEntries(showdowns){
    const entries=[],positions=new Map(),fingerprints=new Map();
    for(const source of showdowns){
      if(source.classification==="pending")continue;
      const entry=verified(source),id=entry.rivalryId;
      // Lifecycle and setup disagreements are also integrity failures; never choose a side.
      const fingerprint=caCanonical({classification:source.classification,projection:source.projection??null,final:source.final??null});
      if(!positions.has(id)){
        positions.set(id,entries.length);fingerprints.set(id,fingerprint);entries.push(entry);
      }else if(fingerprints.get(id)!==fingerprint||entry.classification==="unavailable"){
        entries[positions.get(id)]={rivalryId:id,classification:"unavailable",projection:null,final:null};
      }
    }
    return entries;
  }
  // r80 Ended early: an abandoned row read from its closed root also carries its close time and seasons played (null when
  // unknown); it never counts.
  function endedOf(ended){const at=ended?.endedAt,played=ended?.seasonsPlayed;return {endedAt:Number.isFinite(at)&&at>0?at:null,seasonsPlayed:Number.isInteger(played)&&played>=0&&played<=10?played:null};}
  function statusRow(entry,number){const ended=entry.ended||null;return {number,rivalryId:entry.rivalryId,status:entry.classification,leagueId:null,clubs:null,seasonsPlayed:ended?ended.seasonsPlayed:null,totalSeasons:null,totals:null,winner:null,seasons:[],setupConfirmedAt:null,...(ended?{endedAt:ended.endedAt}:{})};}
  function seasonRow(season){
    const pair=field=>({daniel:season.playerOne[field],nik:season.playerTwo[field]});
    // r80: a season with a Europa League win also names who won it (History shows it); other seasons keep the r79 row shape.
    const europaLeague=season.playerOne.europaLeague===true||season.playerTwo.europaLeague===true?{europaLeague:{daniel:season.playerOne.europaLeague===true,nik:season.playerTwo.europaLeague===true}}:{};
    return {season:season.roundNumber,score:{daniel:season.playerOne.scoring.total,nik:season.playerTwo.scoring.total},winner:managerFor(season.winner),tiebreak:seasonTiebreak(season),leaguePosition:pair("leaguePosition"),leaguePoints:pair("leaguePoints"),leagueGoals:pair("leagueGoals"),...europaLeague};
  }
  function accumulate(record,season,role,sums){
    const r=season[role],score=r.scoring.total;
    record.seasons+=1;record.careerPoints+=score;
    sums.points+=r.leaguePoints;sums.goals+=r.leagueGoals;
    if(season.winner===role)record.seasonWins+=1;else if(season.winner==="draw")record.seasonDraws+=1;else record.seasonLosses+=1;
    if(r.championsLeague)record.championsLeagues+=1;
    if(r.europaLeague===true)record.europaLeagues+=1;
    if(r.leaguePosition===1)record.leagueTitles+=1;
    if(r.domesticCup)record.domesticCups+=1;
    if(r.leaguePoints>=100)record.hundredPointSeasons+=1;
    if(r.leagueGoals>=100)record.hundredGoalSeasons+=1;
    if(r.topScorer)record.topScorerSeasons+=1;
    if(r.topAssist)record.topAssistSeasons+=1;
    if(score===11)record.perfectSeasons+=1;
    record.performanceBonuses+=r.scoring.performanceBonus;
    record.awardsBonuses+=r.scoring.individualAwardsBonus;
    for(const [key,value] of [["bestSeasonScore",score],["bestLeaguePoints",r.leaguePoints],["bestLeagueGoals",r.leagueGoals],["bestLeaguePosition",r.leaguePosition]]){
      record[key]=record[key]===null?value:key==="bestLeaguePosition"?Math.min(record[key],value):Math.max(record[key],value);
    }
  }
  function bestRecord(label,candidates){
    if(!candidates.length)return {label,manager:"shared",value:null,ref:null};
    const value=Math.max(...candidates.map(candidate=>candidate.value));
    // r87 career fixes (B5): a best of 0 (no perfect season, a 0-0 season) is a record nobody holds, never "0 Shared".
    if(!(value>0))return {label,manager:"shared",value:null,ref:null};
    const tied=candidates.filter(candidate=>candidate.value===value);
    const managers=new Set(tied.map(candidate=>candidate.manager));
    const places=new Set(tied.map(candidate=>caCanonical(candidate.ref)));
    return {label,manager:managers.size===1?tied[0].manager:"shared",value,ref:places.size===1&&tied[0].ref?{...tied[0].ref}:null};
  }
  function trophyRoom(managers,records,unknown){
    const cabinet=Object.fromEntries(MANAGERS.map(manager=>[manager,Object.fromEntries(CABINET.map(key=>[key,managers[manager][key]]))]));
    const standings=unknown?[]:MANAGERS.map(manager=>({manager,careerPoints:managers[manager].careerPoints,seasonWins:managers[manager].seasonWins}));
    // r83 (Nik 2026-10-23): equal career points are level, as a tied Showdown total is a DRAW. Season wins are a stat, never
    // a tiebreak for the crown or #1, so Legacy's DRAW and the career ranks always tell the same story.
    standings.sort((a,b)=>b.careerPoints-a.careerPoints);
    if(standings.length&&standings[0].careerPoints===standings[1].careerPoints)standings.forEach(row=>{row.level=true;});
    return {cabinet,standings,records};
  }
  function buildCareerModel({indexStatus,showdowns=[],...options}={}){
    const interimLabel=options["current"+"ShowdownOnly"]===true?"Current Showdown only. Career history is not yet available.":null;
    const unknown=indexStatus!=="ready";
    const managers={daniel:managerBase(unknown),nik:managerBase(unknown)};
    if(unknown)return caFreeze({status:indexStatus==="loading"?"loading":"unavailable",interimLabel,coverage:{readable:null,indexed:null},managers,biggestShowdownWin:null,trophyRoom:trophyRoom(managers,[],true),history:{showdowns:[]}});

    const entries=uniqueEntries(showdowns),rows=[],sums={daniel:{points:0,goals:0},nik:{points:0,goals:0}};
    const candidates=[[],[],[],[],[]];
    let readable=0,biggestShowdownWin=null;
    for(const entry of entries){
      const {projection:p,classification}=entry;
      if(classification==="unavailable"||classification==="abandoned"){
        if(classification==="abandoned")readable+=1;
        rows.push(statusRow(entry,rows.length+1));continue;
      }
      readable+=1;
      // r83 (JOB-4 F1): career totals, cabinets, ranks and records count finished Showdowns only, so every career screen
      // agrees with History/Legacy and never depends on whether this page holds the live History. An unfinished Showdown
      // keeps its row and shows on THIS SHOWDOWN / Rivalry Statistics. The labelled current-only view (interimLabel) is that
      // live Showdown on its own, so it still counts it.
      if(classification==="completed"||interimLabel!==null)for(const season of p.seasonHistory){
        for(let i=0;i<ROLES.length;i+=1){
          const role=ROLES[i],manager=MANAGERS[i],r=season[role];
          accumulate(managers[manager],season,role,sums[manager]);
          const ref={rivalryId:entry.rivalryId,season:season.roundNumber};
          for(const [index,value] of [r.scoring.total,r.leaguePoints,r.leagueGoals].entries())candidates[index].push({manager,value,ref});
        }
      }
      const totals={daniel:p.managerRecords.playerOne.totalPoints,nik:p.managerRecords.playerTwo.totalPoints};
      const finalWinner=classification==="active"?null:managerFor(entry.final.winner);
      rows.push({number:rows.length+1,rivalryId:entry.rivalryId,status:classification==="active"?"in-progress":classification,leagueId:p.leagueId,clubs:{daniel:p.managerRecords.playerOne.club,nik:p.managerRecords.playerTwo.club},seasonsPlayed:p.acceptedSeasons,totalSeasons:p.totalSeasons,totals,winner:finalWinner,seasons:p.seasonHistory.map(seasonRow),setupConfirmedAt:Number.isFinite(entry.setupConfirmedAt)?entry.setupConfirmedAt:null});
      if(classification==="completed"){
        for(const manager of MANAGERS){
          const outcomes=managers[manager].showdowns;outcomes.completed+=1;
          if(finalWinner==="draw")outcomes.draws+=1;else if(finalWinner===manager)outcomes.wins+=1;else outcomes.losses+=1;
        }
        if(finalWinner!=="draw"){
          const margin=Math.abs(totals.daniel-totals.nik);
          const win={manager:finalWinner,margin,showdownRef:entry.rivalryId};
          // Equal biggest wins keep the first career-order witness; the record reports shared ties.
          if(biggestShowdownWin===null||margin>biggestShowdownWin.margin)biggestShowdownWin=win;
          candidates[3].push({manager:finalWinner,value:margin,ref:{rivalryId:entry.rivalryId}});
        }
      }
    }
    for(const manager of MANAGERS){
      const record=managers[manager];record.totalTrophies=record.championsLeagues+record.europaLeagues+record.leagueTitles+record.domesticCups;
      if(record.seasons){
        record.averageSeasonScore=record.careerPoints/record.seasons;
        record.averageLeaguePoints=sums[manager].points/record.seasons;
        record.averageLeagueGoals=sums[manager].goals/record.seasons;
        candidates[4].push({manager,value:record.perfectSeasons,ref:null});
      }
    }
    const records=LABELS.map((label,index)=>bestRecord(label,candidates[index]));
    // A cross-manager tie for the biggest win is shared, as in the Trophy Room record.
    if(biggestShowdownWin&&records[3].manager==="shared")biggestShowdownWin={manager:"shared",margin:biggestShowdownWin.margin,showdownRef:null};
    // r87 career fixes (A-05): the coverage line counts finished Showdowns only. The live (or completion-pending) Showdown is
    // read but History never lists it, so "Showing 3 of 4" above 2 cards counted a game that is not there. The labelled
    // current-only view is that live Showdown, so it keeps counting it. The status is unchanged (the same entry leaves both).
    const live=interimLabel!==null?0:rows.filter(row=>!["completed","abandoned","unavailable"].includes(row.status)).length;
    return caFreeze({status:entries.length===0?"empty":readable<entries.length?"partial":"ready",interimLabel,coverage:{readable:readable-live,indexed:entries.length-live},managers,biggestShowdownWin,trophyRoom:trophyRoom(managers,records,false),history:{showdowns:rows}});
  }
  return Object.freeze({buildCareerModel,seasonTiebreak});
});
