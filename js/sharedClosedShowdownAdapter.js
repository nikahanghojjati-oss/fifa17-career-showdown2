(function(root,factory){
  const node=typeof module!=="undefined"&&module.exports;
  const api=factory(node?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence,node?require("./sharedTerminalClose.js"):root.CareerModeSharedTerminalClose);
  if(node)module.exports=api;else root.CareerModeSharedClosedShowdownAdapter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(History,Terminal){
  "use strict";

  // JOB-09 (G-9): pure adapter. Career index + session-free reader results (+ the current Showdown's
  // careerInput from the active adapter) -> exactly the input of sharedCareerAnalytics.buildCareerModel.
  // No reads, no writes, no storage, no globals: everything arrives as one argument.
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const READ_STATUSES=Object.freeze(["completed","abandoned","not-closed","unavailable","never-started"]);
  const CURRENT_CLASSES=Object.freeze(["pending","active","completion-pending","completed","abandoned","unavailable"]);
  const INDEX_STATUSES=Object.freeze(["loading","unavailable","ready"]);

  function cadPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  // Projections are borrowed by identity (already frozen by their producer); freeze only what this adapter owns.
  function cadFreeze(value,borrowed){if(borrowed&&borrowed.has(value))return value;if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(item=>cadFreeze(item,borrowed));Object.freeze(value);}return value;}
  function cadWinner(a,b){return a>b?"playerOne":b>a?"playerTwo":"draw";}
  function cadEntry(rivalryId,classification,projection=null,final=null){return {rivalryId,classification,projection,final};}
  function cadNote(rivalryId,source,classification,code=null){return {rivalryId,source,classification,code};}

  function cadIndex(index){
    if(!cadPlain(index)||!INDEX_STATUSES.includes(index.status))return {status:"unavailable",ids:[],code:"CLOSED_INDEX_INVALID"};
    if(index.status!=="ready")return {status:index.status,ids:[],code:index.status==="unavailable"?(typeof index.code==="string"&&index.code?index.code:"CLOSED_INDEX_UNAVAILABLE"):null};
    const ids=index.rivalryIds;
    if(!Array.isArray(ids)||ids.some(id=>typeof id!=="string"||!RIVALRY_ID.test(id))||new Set(ids).size!==ids.length)return {status:"unavailable",ids:[],code:"CLOSED_INDEX_INVALID"};
    return {status:"ready",ids:[...ids],code:null};
  }
  // current = sharedActiveShowdownAdapter.careerInput(snapshot): indexStatus, showdowns,
  // currentShowdownOnly and (when loading/unavailable) an optional currentRivalryId.
  function cadCurrent(current){
    if(!cadPlain(current)||current.currentShowdownOnly!==true||!INDEX_STATUSES.includes(current.indexStatus)||!Array.isArray(current.showdowns))return {status:"unknown",entry:null};
    if(current.indexStatus!=="ready")return {status:current.indexStatus==="loading"?"loading":"unknown",entry:null,rivalryId:typeof current.currentRivalryId==="string"&&RIVALRY_ID.test(current.currentRivalryId)?current.currentRivalryId:null};
    if(current.showdowns.length===0)return {status:"known",entry:null};
    const entry=current.showdowns[0];
    if(current.showdowns.length!==1||!cadPlain(entry)||typeof entry.rivalryId!=="string"||!RIVALRY_ID.test(entry.rivalryId)||!CURRENT_CLASSES.includes(entry.classification))return {status:"unknown",entry:null};
    return {status:"known",entry,rivalryId:entry.rivalryId};
  }
  // A completed read counts only if the rebuilt projection, the reader's final and the Terminal Close witness all agree.
  function cadCompleted(read,rivalryId){
    const witness=Terminal.verifyIntent(read.terminalWitness);
    const projection=History.verifyProjection(read.projection);
    const totals=witness.managerTotals,final=read.final;
    if(witness.rivalryId!==rivalryId||projection.rivalryId!==rivalryId)throw new Error("CLOSED_RIVALRY_MISMATCH");
    if(projection.totalSeasons!==witness.totalSeasons||projection.acceptedSeasons!==witness.totalSeasons||projection.seasonHistory.length!==witness.totalSeasons)throw new Error("CLOSED_COVERAGE_MISMATCH");
    if(projection.managerRecords.playerOne.totalPoints!==totals.playerOne||projection.managerRecords.playerTwo.totalPoints!==totals.playerTwo)throw new Error("CLOSED_TOTALS_MISMATCH");
    if(!cadPlain(final)||!cadPlain(final.totals)||final.totals.playerOne!==totals.playerOne||final.totals.playerTwo!==totals.playerTwo||final.winner!==witness.winner||final.winner!==cadWinner(totals.playerOne,totals.playerTwo)||final.margin!==Math.abs(totals.playerOne-totals.playerTwo)||final.seasonsPlayed!==witness.totalSeasons)throw new Error("CLOSED_FINAL_MISMATCH");
    return cadEntry(rivalryId,"completed",read.projection,{totals:{playerOne:totals.playerOne,playerTwo:totals.playerTwo},winner:witness.winner});
  }
  function cadClassify(rivalryId,read,current){
    if(!cadPlain(read))return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable","CLOSED_READ_MISSING")];
    if(!READ_STATUSES.includes(read.status)||read.rivalryId!==rivalryId)return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable","CLOSED_READ_INVALID")];
    if(read.status==="unavailable")return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable",typeof read.code==="string"&&read.code?read.code:"CLOSED_READ_UNAVAILABLE")];
    if(!ROLES.includes(read.managerRole))return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable","CLOSED_READ_INVALID")];
    if(read.status==="never-started")return [null,cadNote(rivalryId,"excluded","never-started")];
    const live=current.entry&&current.entry.rivalryId===rivalryId?current.entry:null;
    if(read.status==="completed"){
      let entry;
      try{entry=cadCompleted(read,rivalryId);}catch(_error){return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable","CLOSED_COMPLETED_INVALID")];}
      // The reader verified the root's own Terminal Close witness and rebuilt every season, so it wins over a live
      // view that is still catching up (active, completion-pending, or a reloaded "closed" pair with no local witness).
      // Two verified witnesses that disagree are an integrity failure: never pick a side.
      if(live&&live.classification==="completed"&&(live.final?.totals?.playerOne!==entry.final.totals.playerOne||live.final?.totals?.playerTwo!==entry.final.totals.playerTwo||live.final?.winner!==entry.final.winner))return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable","CLOSED_STATE_CONFLICT")];
      return [entry,cadNote(rivalryId,"reader","completed")];
    }
    if(read.status==="abandoned"){
      if(live&&live.classification==="completed")return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"reader","unavailable","CLOSED_STATE_CONFLICT")];
      // Abandoned: status row only; any seasons shown before are dropped (rebuild, never subtract).
      return [cadEntry(rivalryId,"abandoned"),cadNote(rivalryId,"reader","abandoned")];
    }
    // not-closed: the root is active or pending-pair. Only the live Showdown can say which, and what it holds.
    if(current.status!=="known"&&current.rivalryId===rivalryId){
      if(current.status==="loading")return [cadEntry(rivalryId,"pending"),cadNote(rivalryId,"current","pending","CLOSED_CURRENT_LOADING")];
      return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"current","unavailable","CLOSED_CURRENT_UNKNOWN")];
    }
    if(!live)return [cadEntry(rivalryId,"pending"),cadNote(rivalryId,"excluded","pending","CLOSED_NOT_CURRENT")];
    if(live.classification==="completed"||live.classification==="abandoned")return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"current","unavailable","CLOSED_STATE_CONFLICT")];
    if(live.classification==="unavailable")return [cadEntry(rivalryId,"unavailable"),cadNote(rivalryId,"current","unavailable","CLOSED_CURRENT_UNAVAILABLE")];
    return [cadEntry(rivalryId,live.classification,live.projection??null,live.final??null),cadNote(rivalryId,"current",live.classification)];
  }
  function cadPlan(options){
    const o=cadPlain(options)?options:{},index=cadIndex(o.index),current=cadCurrent(o.current),reads=cadPlain(o.reads)?o.reads:{};
    if(index.status==="loading")return {indexStatus:"loading",showdowns:[],notes:[]};
    if(index.status!=="ready")return {indexStatus:"unavailable",showdowns:[],notes:[cadNote(null,"index","unavailable",index.code)]};
    // A lone open root can identify the unknown current row after a reload.
    // With several open roots and no current id, do not spread uncertainty to all of them.
    if(current.status!=="known"&&!current.rivalryId){
      const open=index.ids.filter(id=>reads[id]?.rivalryId===id&&reads[id]?.status==="not-closed");
      if(open.length===1)current.rivalryId=open[0];
    }
    const showdowns=[],notes=[];
    for(const id of index.ids){const [entry,note]=cadClassify(id,Object.hasOwn(reads,id)?reads[id]:null,current);if(entry)showdowns.push(entry);notes.push(note);}
    // No backfill: a live Showdown that is not in the career index never enters career history.
    if(current.entry&&!index.ids.includes(current.entry.rivalryId))notes.push(cadNote(current.entry.rivalryId,"outside-index",current.entry.classification,"CLOSED_NOT_INDEXED"));
    return {indexStatus:"ready",showdowns,notes};
  }
  function cadBorrowed(showdowns){return new Set(showdowns.map(entry=>entry.projection).filter(Boolean));}
  function buildClosedCareerInput(options){
    try{const plan=cadPlan(options);return cadFreeze({indexStatus:plan.indexStatus,showdowns:plan.showdowns,currentShowdownOnly:false},cadBorrowed(plan.showdowns));}
    catch(_error){return cadFreeze({indexStatus:"unavailable",showdowns:[],currentShowdownOnly:false});}
  }
  function describeClosedCareer(options){
    try{return cadFreeze(cadPlan(options).notes.map(note=>({...note})));}
    catch(_error){return cadFreeze([cadNote(null,"index","unavailable","CLOSED_ADAPTER_FAILED")]);}
  }
  return Object.freeze({contractVersion:1,feature:"cms-closed-showdown-adapter",readStatuses:READ_STATUSES,buildClosedCareerInput,describeClosedCareer,sessionRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false});
});
