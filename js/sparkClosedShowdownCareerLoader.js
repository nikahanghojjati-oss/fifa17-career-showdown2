(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkClosedShowdownCareerLoader=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-09 (G-9): thin loader. Walks the signed-in account's career index (pages, then head; JOB-07),
  // reads each Showdown with the session-free reader (JOB-08), and hands everything to the pure adapter
  // and the career model. Exact gets only, through those two modules; no session, no write, no list.
  // Terminal results (including closed unused codes) are cached in memory per signed-in account only.
  const cclNode=typeof module!=="undefined"&&module.exports;
  const cclModule=(file,key)=>cclNode?require(file):root[key];
  const cclModules={
    get pair(){return cclModule("./persistentNikDanielPair.js","CareerModePersistentNikDanielPair");},
    get reader(){return cclModule("./sparkCompletedShowdownReader.js","CareerModeSparkCompletedShowdownReader");},
    get adapter(){return cclModule("./sharedClosedShowdownAdapter.js","CareerModeSharedClosedShowdownAdapter");},
    get career(){return cclModule("./sharedCareerAnalytics.js","CareerModeSharedCareerAnalytics");}
  };
  const TERMINAL=Object.freeze(["completed","abandoned","hidden"]);
  const COLD_READ_LIMIT=3;
  let cclScope=null;
  function cclNewScope(uid){return {uid,cache:new Map(),pending:new Map(),queue:[],active:0};}
  function cclPump(scope){
    while(scope.active<COLD_READ_LIMIT&&scope.queue.length){
      const run=scope.queue.shift();scope.active++;
      void run().finally(()=>{scope.active--;cclPump(scope);});
    }
  }

  function cclFreeze(value,borrowed){if(borrowed&&borrowed.has(value))return value;if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(item=>cclFreeze(item,borrowed));Object.freeze(value);}return value;}
  function cclClear(){cclScope=null;}
  function cclResult(accountId,careerInput,entries){
    const model=cclModules.career.buildCareerModel(careerInput);
    return cclFreeze({status:model.status,accountId,careerInput,model,entries},new Set([careerInput,model,entries]));
  }
  function cclUnavailable(accountId,code){
    const careerInput=cclModules.adapter.buildClosedCareerInput({index:{status:"unavailable",code}});
    return cclResult(accountId,careerInput,Object.freeze([Object.freeze({rivalryId:null,source:"index",classification:"unavailable",code})]));
  }
  function cclRead(reader,options,scope,rivalryId,interested){
    if(scope.cache.has(rivalryId))return Promise.resolve(scope.cache.get(rivalryId));
    let flight=scope.pending.get(rivalryId);
    // A new screen arriving while an abandoned batch drains retries after that batch settles.
    if(flight?.cancelled)return flight.promise.then(()=>interested()?cclRead(reader,options,scope,rivalryId,interested):null);
    if(!flight){
      flight={consumers:new Set(),promise:null};
      flight.promise=new Promise(resolve=>scope.queue.push(async()=>{
        let read=null;
        const live=()=>cclScope===scope&&[...flight.consumers].some(check=>check());
        try{
          // Each exact get checks that at least one screen still needs this record. Already sent gets
          // cannot be cancelled; no later season or queued record is read after the last consumer leaves.
          const sdk={...options.firebaseSdk,getDoc:ref=>{
            if(!live()){flight.cancelled=true;throw Object.assign(new Error("CLOSED_LOAD_CANCELLED"),{code:"CLOSED_LOAD_CANCELLED"});}
            return options.firebaseSdk.getDoc(ref);
          }};
          if(!live())flight.cancelled=true;
          else read=await reader.readCompletedShowdown({firestore:options.firestore,firebaseSdk:sdk,user:{uid:scope.uid},rivalryId,cryptoImpl:options.cryptoImpl});
          if(read&&read.rivalryId===rivalryId&&(TERMINAL.includes(read.status)||read.status==="never-started"&&read.ended!=null)&&cclScope===scope)scope.cache.set(rivalryId,read);
        }catch(_error){}finally{scope.pending.delete(rivalryId);resolve(read);}
      }));
      scope.pending.set(rivalryId,flight);
    }
    flight.consumers.add(interested);cclPump(scope);
    return flight.promise.finally(()=>flight.consumers.delete(interested));
  }
  async function cclLoad(options={},shouldContinue=options?.shouldContinue){
    let uid=null;
    try{
      const o=options&&typeof options==="object"?options:{};
      uid=o.user&&typeof o.user.uid==="string"?o.user.uid.trim():"";
      if(!uid){uid=null;return cclUnavailable(null,"CLOSED_AUTH_REQUIRED");}
      if(!o.firestore||!o.firebaseSdk||typeof o.firebaseSdk.doc!=="function"||typeof o.firebaseSdk.getDoc!=="function")return cclUnavailable(uid,"CLOSED_PROVIDER_UNAVAILABLE");
      const pair=cclModules.pair,reader=cclModules.reader;
      if(!pair||typeof pair.readCareerIndex!=="function"||!reader||typeof reader.readCompletedShowdown!=="function")return cclUnavailable(uid,"CLOSED_PROVIDER_UNAVAILABLE");
      // A different signed-in account never sees the previous account's cached Showdowns.
      if(!cclScope||cclScope.uid!==uid)cclScope=cclNewScope(uid);
      const scope=cclScope;
      const interested=()=>cclScope===scope&&(typeof shouldContinue!=="function"||shouldContinue());
      let index;
      // r80 (real vs test): an account whose real career has not started holds only test runs; its career is empty and
      // nothing is read (a live test Showdown outside the index is dropped by the adapter as well).
      if(o.testRunsOnly===true)index={status:"ready",rivalryIds:[]};
      else try{index=await pair.readCareerIndex({firestore:o.firestore,firebaseSdk:o.firebaseSdk,accountId:uid});}catch(_error){index={status:"unavailable",code:"CAREER_INDEX_UNAVAILABLE"};}
      // Career start marker: the caller may name Showdowns to leave out (the account's test Showdowns before its real
      // career). They are dropped from the index before any read, so they get no read and never reach the model.
      // Absent, empty or malformed: nothing changes.
      const hidden=Array.isArray(o.hiddenRivalryIds)?new Set(o.hiddenRivalryIds.filter(id=>typeof id==="string")):null;
      if(hidden&&hidden.size&&index&&index.status==="ready"&&Array.isArray(index.rivalryIds))index={...index,rivalryIds:index.rivalryIds.filter(id=>!hidden.has(id))};
      const reads={};
      if(index&&index.status==="ready"&&Array.isArray(index.rivalryIds)){
        const ids=[...new Set(index.rivalryIds.filter(id=>typeof id==="string"))];
        let next=0;
        const worker=async()=>{
          while(next<ids.length&&interested()){
            const rivalryId=ids[next++];reads[rivalryId]=await cclRead(reader,o,scope,rivalryId,interested);
          }
        };
        await Promise.all(Array.from({length:Math.min(COLD_READ_LIMIT,ids.length)},worker));
      }
      const input={index,reads,current:o.current};
      return cclResult(uid,cclModules.adapter.buildClosedCareerInput(input),cclModules.adapter.describeClosedCareer(input));
    }catch(_error){
      try{return cclUnavailable(uid,"CLOSED_LOADER_FAILED");}catch(_inner){return Object.freeze({status:"unavailable",accountId:uid,careerInput:null,model:null,entries:Object.freeze([])});}
    }
  }
  return Object.freeze({contractVersion:1,feature:"cms-closed-showdown-career-loader",loadClosedShowdownCareer:cclLoad,clearClosedShowdownCache:cclClear,closedShowdownCacheSize:()=>cclScope?.cache.size||0,sessionRequired:false,deviceRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false});
});
