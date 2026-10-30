(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCareerSummaryStore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r86 reads at scale (Nik 2026-10-27): a finished Showdown never changes, so after one full verified read its result is
  // kept as one summary in Firebase (accounts/{uid}/careerSummary/{rivalryId}, create-only, Rules check the totals against
  // the Terminal Close witness) and as a copy on this phone (IndexedDB). Firebase stays the only truth: a phone without its
  // copy reads the summaries, and a Showdown without a summary is read in full as before and then summarised (this also
  // backfills games finished before r86). Only results of a closed root are summarised: completed (Rules check the totals),
  // abandoned / Ended early and never-started codes (status only); the payload is the reader's own result, byte for byte.
  const CSS_STATUSES=Object.freeze(["completed","abandoned","never-started"]);
  const CSS_ID=/^pair_[0-9a-f]{64}$/;
  const CSS_HASH=/^sha256:[0-9a-f]{64}$/;
  const CSS_MAX_PAYLOAD=262144;
  const CSS_DB="cms-career-summaries",CSS_STORE="summaries";
  const CSS_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","status","totalSeasons","managerTotals","winner","payload","payloadHash"]);
  // The reader version this payload comes from (Sol r86 #11). The Firebase summary carries it as schemaVersion and the
  // phone copy as readerVersion; a copy from another version is not used. A future reader change bumps it and, since a
  // summary is never updated, the Rules then need the new schemaVersion and an update to a higher one.
  const CSS_READER_VERSION=1;
  const cssLocal=new Map();

  function cssFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(cssFreeze);Object.freeze(value);}return value;}
  async function cssDigest(text,cryptoImpl){
    const c=cryptoImpl||root.crypto;
    if(!c?.subtle||typeof TextEncoder==="undefined")return null;
    const bytes=new Uint8Array(await c.subtle.digest("SHA-256",new TextEncoder().encode(text)));
    return "sha256:"+Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
  }
  // A summary-worthy result: a closed root's terminal answer for exactly this Showdown.
  function cssSummarisable(state,rivalryId){
    if(!state||typeof state!=="object"||!CSS_STATUSES.includes(state.status)||state.rivalryId!==rivalryId)return false;
    if(state.status==="completed")return Boolean(state.projection&&typeof state.projection==="object"&&state.final&&state.terminalWitness?.managerTotals);
    return Boolean(state.ended&&typeof state.ended==="object");
  }
  // A payload is used only when it hashes to its recorded hash and holds such a result.
  async function cssParse(payload,payloadHash,rivalryId,cryptoImpl){
    if(typeof payload!=="string"||!payload||payload.length>CSS_MAX_PAYLOAD||typeof payloadHash!=="string"||!CSS_HASH.test(payloadHash))return null;
    if(await cssDigest(payload,cryptoImpl)!==payloadHash)return null;
    let state;try{state=JSON.parse(payload);}catch(_error){return null;}
    if(!cssSummarisable(state,rivalryId))return null;
    return cssFreeze(state);
  }

  // ---- phone copy (IndexedDB; absent or blocked storage simply means no copy) ----
  function cssOpen(phoneStorage){
    return new Promise(resolve=>{
      try{
        if(!phoneStorage?.open)return resolve(null);
        const request=phoneStorage.open(CSS_DB,1);
        request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(CSS_STORE))request.result.createObjectStore(CSS_STORE);};
        request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);request.onblocked=()=>resolve(null);
      }catch(_error){resolve(null);}
    });
  }
  // One cursor pass per account and page load; later lookups are in memory.
  function cssLocalFor(uid,phoneStorage){
    if(cssLocal.has(uid))return cssLocal.get(uid);
    const loading=(async()=>{
      const map=new Map(),db=await cssOpen(phoneStorage);
      if(!db)return {db:null,map};
      await new Promise(resolve=>{
        try{
          const range=root.IDBKeyRange?.bound?root.IDBKeyRange.bound(uid+"/",uid+"/￿"):null;
          const request=db.transaction(CSS_STORE,"readonly").objectStore(CSS_STORE).openCursor(range);
          request.onsuccess=()=>{const cursor=request.result;if(!cursor)return resolve();if(typeof cursor.key==="string"&&cursor.key.startsWith(uid+"/"))map.set(cursor.key.slice(uid.length+1),cursor.value);cursor.continue();};
          request.onerror=()=>resolve();
        }catch(_error){resolve();}
      });
      return {db,map};
    })();
    cssLocal.set(uid,loading);
    return loading;
  }
  async function cssPutLocal(uid,rivalryId,record,phoneStorage){
    try{
      const local=await cssLocalFor(uid,phoneStorage);local.map.set(rivalryId,record);
      if(!local.db)return;
      await new Promise(resolve=>{try{const tx=local.db.transaction(CSS_STORE,"readwrite");tx.objectStore(CSS_STORE).put(record,uid+"/"+rivalryId);tx.oncomplete=resolve;tx.onerror=resolve;tx.onabort=resolve;}catch(_error){resolve();}});
    }catch(_error){}
  }

  // ---- Firebase summary ----
  function cssDocument(state,payload,payloadHash){
    const w=state.status==="completed"?state.terminalWitness:null;
    return {schemaVersion:CSS_READER_VERSION,objectType:"careerSummary",rivalryId:state.rivalryId,status:state.status,totalSeasons:w?w.totalSeasons:null,managerTotals:w?{playerOne:w.managerTotals.playerOne,playerTwo:w.managerTotals.playerTwo}:null,winner:w?w.winner:null,payload,payloadHash};
  }
  function cssValidDocument(value,rivalryId){
    return Boolean(value)&&typeof value==="object"&&Object.keys(value).length===CSS_KEYS.length&&CSS_KEYS.every(key=>Object.hasOwn(value,key))
      &&value.schemaVersion===CSS_READER_VERSION&&value.objectType==="careerSummary"&&value.rivalryId===rivalryId&&CSS_STATUSES.includes(value.status);
  }

  // Phone copy first, then the Firebase summary (one exact get). null = read the Showdown in full.
  async function cssLoad({firestore,firebaseSdk,uid,rivalryId,cryptoImpl,phoneStorage=root.indexedDB,firebase=true}={}){
    if(typeof uid!=="string"||!uid||!CSS_ID.test(String(rivalryId)))return null;
    try{
      const local=await cssLocalFor(uid,phoneStorage),kept=local.map.get(rivalryId);
      if(kept&&kept.readerVersion===CSS_READER_VERSION){const state=await cssParse(kept.payload,kept.payloadHash,rivalryId,cryptoImpl);if(state)return {state,source:"phone"};local.map.delete(rivalryId);}
    }catch(_error){}
    if(!firebase||!firestore||typeof firebaseSdk?.doc!=="function"||typeof firebaseSdk?.getDoc!=="function")return null;
    let snapshot;
    // A failed get (offline, cancelled, denied) is not a missing summary: the caller decides (it does not read in full).
    snapshot=await firebaseSdk.getDoc(firebaseSdk.doc(firestore,"accounts",uid,"careerSummary",rivalryId));
    const value=snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;
    if(!cssValidDocument(value,rivalryId))return null;
    const state=await cssParse(value.payload,value.payloadHash,rivalryId,cryptoImpl);
    if(!state||state.status!==value.status)return null;
    await cssPutLocal(uid,rivalryId,{readerVersion:CSS_READER_VERSION,payload:value.payload,payloadHash:value.payloadHash},phoneStorage);
    return {state,source:"firebase"};
  }
  // After a full verified read: keep the phone copy, then start the summary write once (create-only; a summary the other
  // tab or a retry already wrote is refused by the Rules and is not an error). The write is never awaited: offline, a
  // Firestore write stays pending until the server answers, and History must not wait for it (Codex P2 on #1026).
  // Never throws: the career still shows without it. `written` settles to true or false.
  const cssWrites=new Set();
  async function cssSave({firestore,firebaseSdk,uid,state,cryptoImpl,phoneStorage=root.indexedDB,writeFirebase=true}={}){
    try{
      if(typeof uid!=="string"||!uid||!CSS_ID.test(String(state?.rivalryId))||!cssSummarisable(state,state.rivalryId))return {ok:false,written:Promise.resolve(false)};
      const payload=JSON.stringify(state);
      if(payload.length>CSS_MAX_PAYLOAD)return {ok:false,written:Promise.resolve(false)};
      const payloadHash=await cssDigest(payload,cryptoImpl);if(!payloadHash)return {ok:false,written:Promise.resolve(false)};
      await cssPutLocal(uid,state.rivalryId,{readerVersion:CSS_READER_VERSION,payload,payloadHash},phoneStorage);
      let written=Promise.resolve(false);
      if(writeFirebase&&firestore&&typeof firebaseSdk?.setDoc==="function"&&typeof firebaseSdk?.doc==="function"){
        try{written=Promise.resolve(firebaseSdk.setDoc(firebaseSdk.doc(firestore,"accounts",uid,"careerSummary",state.rivalryId),cssDocument(state,payload,payloadHash))).then(()=>true,()=>false);}catch(_error){written=Promise.resolve(false);}
        cssWrites.add(written);written.then(()=>cssWrites.delete(written));
      }
      return {ok:true,written};
    }catch(_error){return {ok:false,written:Promise.resolve(false)};}
  }
  // Tests and the gallery: wait until every started summary write has settled.
  function cssSettled(){return Promise.all([...cssWrites]).then(()=>undefined);}
  function cssForget(){cssLocal.clear();}

  return Object.freeze({contractVersion:1,feature:"cms-career-summary-store",readerVersion:CSS_READER_VERSION,statuses:CSS_STATUSES,summarisable:cssSummarisable,documentKeys:CSS_KEYS,maxPayload:CSS_MAX_PAYLOAD,loadSummary:cssLoad,saveSummary:cssSave,writesSettled:cssSettled,forgetPhoneCopies:cssForget,documentFor:cssDocument});
});
