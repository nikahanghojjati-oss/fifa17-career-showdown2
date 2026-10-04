(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRivalryLegacyV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // JOB-28: pure, read-only frames for Team V's current rivalry and completed History.
  const node=typeof module!=="undefined"&&module.exports;
  const seam=()=>node?require("./careerScreenSeam.js"):root.CareerModeCareerScreenSeam;
  const BASE="visual-assets/v10_1/",ORDER=["daniel","nik"],STATES=["loading","empty","unavailable","partial","ready"];
  const FIELDS=["seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","bestSeasonScore"];
  const finite=x=>typeof x==="number"&&Number.isFinite(x);
  const pair=x=>x&&ORDER.every(k=>finite(x[k]));
  const copy=x=>JSON.parse(JSON.stringify(x));
  function freeze(x){if(x&&typeof x==="object"&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
  function bare(status){return {status,managerOrder:ORDER.slice()};}
  function validSeason(s){return s&&Number.isInteger(s.season)&&["daniel","nik","draw"].includes(s.winner)&&["score","leaguePosition","leaguePoints","leagueGoals"].every(k=>pair(s[k]));}
  function validRow(r){return r&&Number.isInteger(r.number)&&typeof r.leagueId==="string"&&r.clubs&&ORDER.every(k=>typeof r.clubs[k]==="string")&&finite(r.seasonsPlayed)&&finite(r.totalSeasons)&&pair(r.totals)&&["daniel","nik","draw"].includes(r.winner)&&Array.isArray(r.seasons)&&r.seasons.every(validSeason);}
  function historyFrame(model){
    const status=seam().careerScreenView("legacy",model).status;
    if(status==="loading"||status==="unavailable")return bare(status);
    const rows=model?.history?.showdowns;
    if(!Array.isArray(rows))return bare("unavailable");
    const completed=rows.filter(r=>r.status==="completed");
    if(!completed.every(validRow))return bare("unavailable");
    const frame={...bare(status==="ready"&&!completed.length?"empty":status),showdowns:completed.map(r=>({number:r.number,status:"completed",leagueId:r.leagueId,clubs:copy(r.clubs),seasonsPlayed:r.seasonsPlayed,totalSeasons:r.totalSeasons,totals:copy(r.totals),winner:r.winner,seasons:copy(r.seasons)})),ui:{page:1,pageSize:4,selectedShowdown:completed[0]?.number??null}};
    if(status==="partial")frame.coverage=copy(model.coverage);
    // Current-only projections are never offered as an archive or backfilled.
    if(model.interimLabel){frame.status="unavailable";return bare("unavailable");}
    return frame;
  }
  function rivalryFrame(model){
    let status,source,lifecycle=null;
    if(model?.history){
      status=seam().careerScreenView("rivalryStatistics",model).status;
      if(status==="loading"||status==="unavailable")return bare(status);
      const row=model.history.showdowns[0];
      if(!row||["abandoned","unavailable"].includes(row.status))return bare(status==="empty"?"empty":"unavailable");
      source={status,leagueId:row.leagueId,clubs:row.clubs,score:row.totals,totalSeasons:row.totalSeasons,seasons:row.seasons,managers:model.managers};lifecycle=row.status;
    }else{source=model;status=STATES.includes(source?.status)?source.status:"unavailable";lifecycle=source?.lifecycle??null;}
    if(status==="loading"||status==="unavailable")return bare(status);
    if(status==="empty"&&!source.managers)return {...bare("empty"),seasons:[],transfers:{status:"unavailable"}};
    if(!source.managers||!ORDER.every(k=>source.managers[k]&&FIELDS.every(f=>finite(source.managers[k][f])||(f==="bestSeasonScore"&&source.managers[k][f]===null))))return bare("unavailable");
    if(!Array.isArray(source.seasons)||!source.seasons.every(validSeason))return bare("unavailable");
    if(status!=="empty"&&(!pair(source.score)||!finite(source.totalSeasons)||!source.clubs||!ORDER.every(k=>typeof source.clubs[k]==="string")))return bare("unavailable");
    const frame={...bare(status),leagueId:source.leagueId??null,clubs:source.clubs?{daniel:source.clubs.daniel,nik:source.clubs.nik}:null,totalSeasons:source.totalSeasons??null,score:source.score?{daniel:source.score.daniel,nik:source.score.nik}:null,managerRecords:Object.fromEntries(ORDER.map(k=>[k,Object.fromEntries(FIELDS.map(f=>[f,source.managers[k][f]]))])),seasons:copy(source.seasons),transfers:{status:"unavailable"},ui:{lifecycle}};
    if(status==="partial"){
      if(!source.coverage||!Number.isInteger(source.coverage.readable)||!Number.isInteger(source.coverage.indexed))return bare("unavailable");
      frame.coverage=copy(source.coverage);
    }
    return frame;
  }
  function toV10Frame(model,screen){
    if(!["legacy","rivalryStatistics"].includes(screen))throw new TypeError("RIVALRY_LEGACY_V10_UNKNOWN");
    return freeze(screen==="legacy"?historyFrame(model):rivalryFrame(model));
  }
  return freeze({toV10Frame});
});
