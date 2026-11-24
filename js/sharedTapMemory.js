(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedTapMemory=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // Phoenix 3.0 W3 (B3): one shared tap memory. A manager's shared tap (publish, LOCK & CONFIRM, CONFIRM, I STARTED AT, LOCK MY
  // GUESSES, LOCK MY SIGNINGS) is noted on this phone before it is sent, with the Showdown, the season, the step, his role and
  // a note id. If the tab is reloaded or killed before the write is answered, the reopened screen asks here once, after it has
  // read the shared record: when that record still shows the step pending for this manager, the same tap is made again, once.
  // Season Results and Career Start send it with the same operationId (a landed write is bound to it); Season Commit and the
  // Transfer War locks read first and never write a step already done, so their repeat is a replay (their note id is only the
  // note's own id, never carried by the write). A note is cleared as soon as its tap gets any answer on the page that made it
  // (landed, refused or failed) and when the manager edits what he tapped: it only ever serves a tab that died mid-write.
  // A note dies when its Showdown or its season moves on: a note from season N is never handed out in season N+1, nor once its
  // Showdown is closed. Storage only (js/storage.js helpers), no read, no write to Firebase. Firestore stays memory-only.
  // If this file fails to load, every screen works exactly as before (the manager taps again): nothing waits on it.
  const KEY="cms.tapMemory.v1",MAX=12,MAX_AGE_MS=4*60*60*1000;// a play session lives 4 hours at most (js/sparkPrivateSession.js)
  const STEPS=Object.freeze(["careerStart","transferGuess","transferSigning","seasonPublish","seasonCommit","seasonAck"]);
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RIVALRY=/^pair_[0-9a-f]{64}$/,OPERATION=/^[A-Za-z0-9_-]{8,96}$/;
  // This page load. A note is handed out only on a later page (after a reload or a killed tab): on the page that made the tap,
  // its own answer (success, or the error it shows) stands and the manager's button still works, so nothing is sent behind it.
  const PAGE=`${Date.now().toString(36)}_${Math.random().toString(36).slice(2,12)}`;

  function now(){return Date.now();}
  function scopeOk(scope){
    return Boolean(scope)&&RIVALRY.test(String(scope.rivalryId||""))&&Number.isInteger(scope.season)&&scope.season>=1&&scope.season<=10&&STEPS.includes(scope.step)&&ROLES.includes(scope.role);
  }
  function same(a,b){return a.rivalryId===b.rivalryId&&a.season===b.season&&a.step===b.step&&a.role===b.role;}
  function readAll(){
    try{
      const raw=typeof root.readStorageValue==="function"?root.readStorageValue(KEY):null;if(!raw)return [];
      const list=JSON.parse(raw);if(!Array.isArray(list))return [];
      const t=now();
      return list.filter(item=>item&&typeof item==="object"&&scopeOk(item)&&OPERATION.test(String(item.operationId||""))&&Number.isFinite(item.notedAtMs)&&t-item.notedAtMs<=MAX_AGE_MS&&item.notedAtMs<=t+60000);
    }catch(_error){return [];}
  }
  function writeAll(list){
    try{
      if(!list.length){if(typeof root.removeStorageValue==="function")root.removeStorageValue(KEY);return true;}
      if(typeof root.writeStorageValue!=="function")return false;
      return root.writeStorageValue(KEY,JSON.stringify(list.slice(-MAX)))!==false;
    }catch(_error){return false;}
  }
  function tapScopeOf(scope){return {rivalryId:String(scope.rivalryId),season:Number(scope.season),step:String(scope.step),role:String(scope.role)};}

  // Before the write: note the tap. Notes of any other Showdown, and of earlier seasons of this one, are dropped here.
  function note(scope,{operationId,payload=null}={}){
    if(!scopeOk(scope)||!OPERATION.test(String(operationId||"")))return false;
    let text;try{text=payload===null?null:JSON.parse(JSON.stringify(payload));}catch(_error){return false;}
    const s=tapScopeOf(scope);
    const list=readAll().filter(item=>item.rivalryId===s.rivalryId&&item.season>=s.season&&!same(item,s));
    list.push({...s,operationId:String(operationId),payload:text,notedAtMs:now(),resent:false,page:PAGE});
    return writeAll(list);
  }
  // The note for exactly this tap, or null (any other season or Showdown never matches).
  function peek(scope){if(!scopeOk(scope))return null;const s=tapScopeOf(scope);const found=readAll().find(item=>same(item,s));return found?JSON.parse(JSON.stringify(found)):null;}
  // The write is known to have landed (or was refused for good): forget it.
  function clear(scope){if(!scopeOk(scope))return false;const s=tapScopeOf(scope);const list=readAll();const kept=list.filter(item=>!same(item,s));return kept.length===list.length?true:writeAll(kept);}
  // After a reload: the screen read the shared record. pending = that record still shows this step open for this manager. Hands
  // the note out once (it is marked resent first, so a second reload does not send it a third time) and only while the record
  // still says pending; otherwise the note is dropped. live = {rivalryId, season} the shared record is on now; closed = the
  // Showdown is over. A note from an earlier season or another Showdown is never handed out and is dropped.
  function takeForResend(scope,{pending,live=null,closed=false}={}){
    if(!scopeOk(scope))return null;
    const s=tapScopeOf(scope);
    if(closed===true){forgetShowdown(s.rivalryId);return null;}
    if(live&&(String(live.rivalryId||"")!==s.rivalryId||Number(live.season)!==s.season)){moveOn(live);clear(s);return null;}
    const list=readAll(),index=list.findIndex(item=>same(item,s));if(index<0)return null;
    const found=list[index];
    if(pending!==true||found.resent===true){list.splice(index,1);writeAll(list);return null;}
    if(found.page===PAGE)return null;// the tap was made on this page: its own answer stands, the note waits for a reload
    list[index]={...found,resent:true};
    if(!writeAll(list))return null;// unable to mark it: never risk sending it twice from here
    return JSON.parse(JSON.stringify(found));
  }
  // The shared record moved on: keep only notes of this Showdown's live season (or later).
  function moveOn(live){
    if(!live||!RIVALRY.test(String(live.rivalryId||"")))return false;
    const season=Number(live.season),list=readAll();
    const kept=list.filter(item=>item.rivalryId===live.rivalryId&&Number.isInteger(season)&&item.season>=season);
    return kept.length===list.length?true:writeAll(kept);
  }
  function forgetShowdown(rivalryId){const list=readAll();const kept=list.filter(item=>item.rivalryId!==rivalryId);return kept.length===list.length?true:writeAll(kept);}
  function forgetAll(){return writeAll([]);}

  return Object.freeze({contractVersion:1,feature:"cms-shared-tap-memory",storageKey:KEY,steps:STEPS,maxAgeMs:MAX_AGE_MS,
    note,peek,clear,takeForResend,moveOn,forgetShowdown,forgetAll,
    firestoreWrites:false,firestoreReads:false,offlineQueue:false});
});
