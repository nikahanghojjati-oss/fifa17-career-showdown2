(function(root,factory){
  const node=typeof module!=="undefined"&&module.exports;
  const api=factory(node?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence,node?require("./sharedCareerAnalytics.js"):root.CareerModeSharedCareerAnalytics,node?require("./sharedTerminalClose.js"):root.CareerModeSharedTerminalClose,node?require("./sharedFinalReconciliation.js"):root.CareerModeSharedFinalReconciliation);
  if(node)module.exports=api;else root.CareerModeSharedActiveShowdownAdapter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(History,Career,Terminal,Final){
  "use strict";
  const ROLES=Object.freeze(["playerOne","playerTwo"]),MANAGERS=Object.freeze(["daniel","nik"]);
  const COUNTERS=Object.freeze(["seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","bestSeasonScore"]);
  const INPUTS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const TRANSIENT=Object.freeze(["idle","starting","joining","continuing","retrying-link","abandoning","pair-link-retry"]);
  const FAILED=Object.freeze(["signed-out","unavailable","error","save-required"]);
  const COUNTED=Object.freeze(["active","completion-pending","completed"]);
  function asdPlain(x){return Boolean(x)&&typeof x==="object"&&!Array.isArray(x);}
  // The projection is borrowed by identity. Freeze only objects this adapter owns.
  function asdFreeze(value,borrowed=null){if(value===borrowed)return value;if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(v=>asdFreeze(v,borrowed));Object.freeze(value);}return value;}
  function manager(role){return role==="playerOne"?"daniel":role==="playerTwo"?"nik":role==="draw"?"draw":null;}
  function managerId(id){return MANAGERS.includes(id)?id:null;}
  function pairValues(a,b){return {daniel:a,nik:b};}
  function finalFor(p){const playerOne=p.managerRecords.playerOne.totalPoints,playerTwo=p.managerRecords.playerTwo.totalPoints;return {totals:{playerOne,playerTwo},winner:playerOne>playerTwo?"playerOne":playerTwo>playerOne?"playerTwo":"draw"};}
  function inspect(snapshot){
    const s=asdPlain(snapshot)?snapshot:{},pair=asdPlain(s.pair)?s.pair:null,identity=asdPlain(s.identity)?s.identity:null;
    const close=asdPlain(s.terminalClose)?s.terminalClose:null;
    const rid=typeof pair?.rivalryId==="string"?pair.rivalryId:close?.phase==="CLOSED"&&typeof close.rivalryId==="string"?close.rivalryId:null;
    const viewer=identity?.status==="ready"&&managerId(identity.managerId)||managerId(pair?.managerId);
    const multi=asdPlain(s.multiSeason)&&s.multiSeason.ok===true&&s.multiSeason.authoritative===true&&s.multiSeason.rivalryId===rid&&asdPlain(s.multiSeason.state)?s.multiSeason:null;
    const history=asdPlain(s.history)&&s.history.rivalryId===rid?s.history:null;
    let p=null,invalid=false,witness=null,zero=false;
    if(history){
      try{
        if(history.ok!==true||history.authoritative!==true||history.phase!=="HISTORY_CONVERGED")throw new Error("HISTORY_NOT_AUTHORITATIVE");
        const candidate=History.verifyProjection(history.projection);
        if(candidate.rivalryId!==rid)throw new Error("HISTORY_RIVALRY_MISMATCH");
        if(!multi||candidate.acceptedSeasons===multi.state.acceptedSeasons){
          if(multi&&(candidate.acceptedRevisionKey!==multi.state.acceptedRevisionKey||candidate.leagueId!==multi.state.leagueId||candidate.totalSeasons!==multi.state.totalSeasons||candidate.managerRecords.playerOne.club!==multi.state.fixedClubs?.playerOne||candidate.managerRecords.playerTwo.club!==multi.state.fixedClubs?.playerTwo))throw new Error("HISTORY_AUTHORITY_MISMATCH");
          p=candidate;
        }
      }catch(_error){invalid=true;}
    }
    let classification;
    if(close?.phase==="CLOSED"&&close.rivalryId===rid){
      try{
        if(close.terminal!==true||invalid)throw new Error("CLOSE_INVALID");
        witness=Terminal.verifyIntent(close.terminalWitness);
        if(witness.rivalryId!==rid||(p&&(p.acceptedSeasons!==witness.totalSeasons||p.totalSeasons!==witness.totalSeasons||p.managerRecords.playerOne.totalPoints!==witness.managerTotals.playerOne||p.managerRecords.playerTwo.totalPoints!==witness.managerTotals.playerTwo)))throw new Error("CLOSE_AUTHORITY_MISMATCH");
        classification="completed";
      }catch(_error){witness=null;classification="unavailable";}
    }else if(!pair||pair.initialized!==true||TRANSIENT.includes(pair.status))classification="loading";
    else if(FAILED.includes(pair.status)||(identity?.status==="ready"&&pair.managerId!=null&&identity.managerId!==pair.managerId))classification="unavailable";
    else if(pair.rivalryId!=null&&typeof pair.rivalryId!=="string")classification="unavailable";
    else if(pair.status==="unpaired"||rid===null)classification="none";
    else if(pair.connectionState==="pending-pair")classification="pending";
    else if(pair.connectionState==="closed")classification="abandoned";
    else if(pair.connectionState!=="active")classification="unavailable";
    else if(invalid)classification="unavailable";
    else if(p&&p.acceptedSeasons===p.totalSeasons&&(!multi||multi.phase==="SHOWDOWN_COMPLETE")){
      classification="completion-pending";
      const final=s.finalReconciliation;
      if(asdPlain(final)&&final.rivalryId===rid&&final.phase==="FINAL_SEASON_RECONCILED"){
        try{
          const verified=Final.verifyProjection(final),expected=finalFor(p);
          if(verified.acceptedRevisionKey!==p.acceptedRevisionKey||verified.managerTotals.playerOne!==expected.totals.playerOne||verified.managerTotals.playerTwo!==expected.totals.playerTwo||verified.winner!==expected.winner)throw new Error("FINAL_AUTHORITY_MISMATCH");
        }catch(_error){classification="unavailable";}
      }
    }else if(p)classification="active";
    else if(!history&&multi?.state.acceptedSeasons===0){classification="active";zero=true;}
    else classification="loading";
    return {s,pair,rid,viewer,multi,p,witness,classification,zero};
  }
  function home(c){
    const {pair,viewer,multi,p,classification,zero}=c;
    // A closed rivalry is no live pair (live pairReadPairLink returns null for it, so Home offers a fresh start).
    const state=pair?.connectionState==="closed"?"unpaired":["paired","waiting","recovery-required","unpaired"].includes(pair?.status)?pair.status:null;
    const m=["paired","recovery-required"].includes(state)?multi?.state:null;
    const text=x=>typeof x==="string"?x:null,num=x=>Number.isInteger(x)?x:null;
    return {status:classification==="loading"?"loading":classification==="unavailable"?"unavailable":"ready",viewerRole:viewer,continue:{state,leagueId:text(m?.leagueId),clubs:m&&typeof m.fixedClubs?.playerOne==="string"&&typeof m.fixedClubs?.playerTwo==="string"?pairValues(m.fixedClubs.playerOne,m.fixedClubs.playerTwo):null,season:num(m?.activeSeason??(m?.terminal?m.totalSeasons:null)),totalSeasons:num(m?.totalSeasons),score:COUNTED.includes(classification)&&p?pairValues(p.managerRecords.playerOne.totalPoints,p.managerRecords.playerTwo.totalPoints):zero?pairValues(0,0):null}};
  }
  function rivalry(c){
    const {classification,p,multi,zero}=c;
    const ready=COUNTED.includes(classification)&&p,empty=["none","pending","abandoned"].includes(classification)||zero;
    const status=ready?"ready":empty?"empty":classification==="loading"?"loading":"unavailable";
    const v={status,leagueId:null,clubs:null,season:null,totalSeasons:null,score:null,managers:null,seasons:[],transfers:{status:"unavailable"}};
    if(ready){
      v.leagueId=p.leagueId;v.clubs=pairValues(p.managerRecords.playerOne.club,p.managerRecords.playerTwo.club);v.totalSeasons=p.totalSeasons;
      v.season=classification==="completed"||p.acceptedSeasons===p.totalSeasons?p.totalSeasons:multi?.state.activeSeason??p.acceptedSeasons+1;
      v.score=pairValues(p.managerRecords.playerOne.totalPoints,p.managerRecords.playerTwo.totalPoints);
      v.managers=Object.fromEntries(ROLES.map((role,i)=>[MANAGERS[i],Object.fromEntries(COUNTERS.map(key=>[key,p.managerRecords[role][key]]))]));
      v.seasons=p.seasonHistory.map(item=>({season:item.roundNumber,score:pairValues(item.playerOne.scoring.total,item.playerTwo.scoring.total),winner:manager(item.winner),leaguePosition:pairValues(item.playerOne.leaguePosition,item.playerTwo.leaguePosition),leaguePoints:pairValues(item.playerOne.leaguePoints,item.playerTwo.leaguePoints),leagueGoals:pairValues(item.playerOne.leagueGoals,item.playerTwo.leagueGoals)}));
    }else if(empty){
      v.managers=Object.fromEntries(MANAGERS.map(id=>[id,Object.fromEntries(COUNTERS.map(key=>[key,key==="bestSeasonScore"?null:0]))]));
      if(zero){const m=multi.state;v.leagueId=typeof m.leagueId==="string"?m.leagueId:null;v.clubs=typeof m.fixedClubs?.playerOne==="string"&&typeof m.fixedClubs?.playerTwo==="string"?pairValues(m.fixedClubs.playerOne,m.fixedClubs.playerTwo):null;v.season=Number.isInteger(m.activeSeason)?m.activeSeason:null;v.totalSeasons=Number.isInteger(m.totalSeasons)?m.totalSeasons:null;v.score=pairValues(0,0);}
    }
    return v;
  }
  function inputs(result){
    if(!asdPlain(result))return null;
    if(INPUTS.slice(0,3).some(key=>!Number.isInteger(result[key]))||INPUTS.slice(3).some(key=>typeof result[key]!=="boolean"))return null;
    return Object.fromEntries(INPUTS.map(key=>[key,result[key]]));
  }
  function breakdown(result){const s=result.scoring;return {championsLeague:s.championsLeague,leagueTitle:s.leagueTitle,domesticCup:s.domesticCup,performanceBonus:s.performanceBonus,awardsBonus:s.individualAwardsBonus,total:s.total};}
  function results(c,options){
    const source=asdPlain(c.s.seasonResults)&&c.s.seasonResults.rivalryId===c.rid?c.s.seasonResults:null;
    const requested=asdPlain(options)?options.season:null;
    const season=requested??source?.seasonNumber??c.multi?.state.activeSeason??null;
    const v={status:"loading",season:Number.isInteger(season)?season:null,phase:null,viewerRole:c.viewer,inputs:{daniel:null,nik:null},breakdown:null,winner:null,tiebreak:null};
    const role=c.pair?.managerRole;
    if(c.classification==="unavailable"||(source&&(!ROLES.includes(role)||source.managerRole!==role))){return {status:"unavailable",season:null,phase:null,viewerRole:null,inputs:null,breakdown:null,winner:null,tiebreak:null};}
    if(!COUNTED.includes(c.classification)&&c.classification!=="loading")return v;
    if(c.classification==="loading"&&c.pair?.connectionState!=="active")return v;
    const committed=c.p?.seasonHistory.find(item=>item.roundNumber===season);
    if(committed){v.phase="committed";v.inputs=pairValues(inputs(committed.playerOne),inputs(committed.playerTwo));v.breakdown=pairValues(breakdown(committed.playerOne),breakdown(committed.playerTwo));v.winner=manager(committed.winner);v.tiebreak=Career.seasonTiebreak(committed);}
    else if(source&&source.seasonNumber===season&&source.ok===true&&ROLES.includes(role)){
      const state=source.state;
      if(state?.phase==="RESULTS_READY"&&inputs(source.allResults?.playerOne)&&inputs(source.allResults?.playerTwo)){
        v.phase="results-ready";v.inputs=pairValues(inputs(source.allResults.playerOne),inputs(source.allResults.playerTwo));
      }else if(state?.phase==="COLLECTING"&&Array.isArray(state.publishedRoles)&&state.publishedRoles.includes(role)){
        v.phase="waiting-for-rival";v.inputs[manager(role)]=inputs(source.ownResult);
      }else v.phase="entering";
    }
    if(v.phase)v.status="ready";
    return v;
  }
  function winner(c){
    const {classification,p,witness}=c;
    const v={status:["none","pending","active","abandoned"].includes(classification)?"empty":classification==="loading"?"loading":"unavailable",state:null,totals:null,winner:null,margin:null,seasonsPlayed:null,trophies:null};
    if(!["completion-pending","completed"].includes(classification))return v;
    const totals=classification==="completed"?witness.managerTotals:finalFor(p).totals;
    v.status=p?"ready":"partial";v.state=classification;v.totals=pairValues(totals.playerOne,totals.playerTwo);v.winner=totals.playerOne>totals.playerTwo?"daniel":totals.playerTwo>totals.playerOne?"nik":"draw";v.margin=Math.abs(totals.playerOne-totals.playerTwo);v.seasonsPlayed=p?p.acceptedSeasons:witness.totalSeasons;
    if(p)v.trophies=Object.fromEntries(ROLES.map((role,i)=>{const r=p.managerRecords[role];return [MANAGERS[i],{championsLeague:r.championsLeagues,leagueTitles:r.leagueTitles,domesticCups:r.domesticCups,total:r.totalTrophies}];}));
    return v;
  }
  function career(c){
    const {classification,rid,p,zero}=c;
    const indexStatus=["loading","unavailable"].includes(classification)?classification:"ready",showdowns=[];
    if(indexStatus==="ready"&&classification!=="none"&&!zero){
      if(classification==="completed"&&!p)showdowns.push({rivalryId:rid,classification:"unavailable",projection:null,final:null});
      else showdowns.push({rivalryId:rid,classification,projection:COUNTED.includes(classification)?p:null,final:["completion-pending","completed"].includes(classification)?finalFor(p):null});
    }
    // Keep the current identity even when its projection has not loaded, so career
    // history can isolate that uncertainty from other indexed Showdowns.
    return {indexStatus,showdowns,currentShowdownOnly:true,...(indexStatus!=="ready"&&rid?{currentRivalryId:rid}:{})};
  }
  function fallback(){return {s:{},pair:null,rid:null,viewer:null,multi:null,p:null,witness:null,classification:"unavailable",zero:false};}
  function asdContext(s){try{return inspect(s);}catch(_error){return fallback();}}
  function buildActiveShowdownViews(s){const c=asdContext(s);try{return asdFreeze({classification:c.classification,home:home(c),rivalry:rivalry(c),seasonResults:results(c),finalWinner:winner(c),careerInput:career(c)},c.p);}catch(_error){const f=fallback();return asdFreeze({classification:f.classification,home:home(f),rivalry:rivalry(f),seasonResults:results(f),finalWinner:winner(f),careerInput:career(f)});}}
  function classifyCurrentShowdown(s){return asdContext(s).classification;}
  function homeView(s){return buildActiveShowdownViews(s).home;}
  function rivalryView(s){return buildActiveShowdownViews(s).rivalry;}
  function finalWinnerView(s){return buildActiveShowdownViews(s).finalWinner;}
  function careerInput(s){return buildActiveShowdownViews(s).careerInput;}
  function seasonResultsView(s,options={}){const c=asdContext(s);try{return asdFreeze(results(c,options));}catch(_error){return asdFreeze(results(fallback()));}}
  return Object.freeze({buildActiveShowdownViews,classifyCurrentShowdown,homeView,rivalryView,seasonResultsView,finalWinnerView,careerInput});
});
