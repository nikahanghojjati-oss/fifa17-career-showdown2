(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkClosedShowdownCareerLoader=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-09 (G-9): thin loader. Walks the signed-in account's career index (pages, then head; JOB-07),
  // reads each Showdown with the session-free reader (JOB-08), and hands everything to the pure adapter
  // and the career model. Exact gets only, through those two modules; no session, no write, no list.
  // Terminal results (completed, abandoned) are cached in memory per signed-in account only.
  const cclNode=typeof module!=="undefined"&&module.exports;
  const cclModule=(file,key)=>cclNode?require(file):root[key];
  const cclModules={
    get pair(){return cclModule("./persistentNikDanielPair.js","CareerModePersistentNikDanielPair");},
    get reader(){return cclModule("./sparkCompletedShowdownReader.js","CareerModeSparkCompletedShowdownReader");},
    get adapter(){return cclModule("./sharedClosedShowdownAdapter.js","CareerModeSharedClosedShowdownAdapter");},
    get career(){return cclModule("./sharedCareerAnalytics.js","CareerModeSharedCareerAnalytics");}
  };
  const TERMINAL=Object.freeze(["completed","abandoned"]);
  let cclCacheAccount=null;
  const cclCache=new Map();

  function cclFreeze(value,borrowed){if(borrowed&&borrowed.has(value))return value;if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(item=>cclFreeze(item,borrowed));Object.freeze(value);}return value;}
  function cclClear(){cclCache.clear();cclCacheAccount=null;}
  function cclResult(accountId,careerInput,entries){
    const model=cclModules.career.buildCareerModel(careerInput);
    return cclFreeze({status:model.status,accountId,careerInput,model,entries},new Set([careerInput,model,entries]));
  }
  function cclUnavailable(accountId,code){
    const careerInput=cclModules.adapter.buildClosedCareerInput({index:{status:"unavailable",code}});
    return cclResult(accountId,careerInput,Object.freeze([Object.freeze({rivalryId:null,source:"index",classification:"unavailable",code})]));
  }
  async function cclRead(reader,options,uid,rivalryId){
    const key=rivalryId;
    if(cclCache.has(key))return cclCache.get(key);
    let read;
    try{read=await reader.readCompletedShowdown({firestore:options.firestore,firebaseSdk:options.firebaseSdk,user:{uid},rivalryId,cryptoImpl:options.cryptoImpl});}
    catch(_error){read=null;}
    if(read&&read.rivalryId===rivalryId&&TERMINAL.includes(read.status)&&cclCacheAccount===uid)cclCache.set(key,read);
    return read;
  }
  async function cclLoad(options={}){
    let uid=null;
    try{
      const o=options&&typeof options==="object"?options:{};
      uid=o.user&&typeof o.user.uid==="string"?o.user.uid.trim():"";
      if(!uid){uid=null;return cclUnavailable(null,"CLOSED_AUTH_REQUIRED");}
      if(!o.firestore||!o.firebaseSdk||typeof o.firebaseSdk.doc!=="function"||typeof o.firebaseSdk.getDoc!=="function")return cclUnavailable(uid,"CLOSED_PROVIDER_UNAVAILABLE");
      const pair=cclModules.pair,reader=cclModules.reader;
      if(!pair||typeof pair.readCareerIndex!=="function"||!reader||typeof reader.readCompletedShowdown!=="function")return cclUnavailable(uid,"CLOSED_PROVIDER_UNAVAILABLE");
      // A different signed-in account never sees the previous account's cached Showdowns.
      if(cclCacheAccount!==uid){cclCache.clear();cclCacheAccount=uid;}
      let index;
      try{index=await pair.readCareerIndex({firestore:o.firestore,firebaseSdk:o.firebaseSdk,accountId:uid});}catch(_error){index={status:"unavailable",code:"CAREER_INDEX_UNAVAILABLE"};}
      const reads={};
      if(index&&index.status==="ready"&&Array.isArray(index.rivalryIds)){
        for(const rivalryId of index.rivalryIds){if(typeof rivalryId==="string"&&!Object.hasOwn(reads,rivalryId))reads[rivalryId]=await cclRead(reader,o,uid,rivalryId);}
      }
      const input={index,reads,current:o.current};
      return cclResult(uid,cclModules.adapter.buildClosedCareerInput(input),cclModules.adapter.describeClosedCareer(input));
    }catch(_error){
      try{return cclUnavailable(uid,"CLOSED_LOADER_FAILED");}catch(_inner){return Object.freeze({status:"unavailable",accountId:uid,careerInput:null,model:null,entries:Object.freeze([])});}
    }
  }
  return Object.freeze({contractVersion:1,feature:"cms-closed-showdown-career-loader",loadClosedShowdownCareer:cclLoad,clearClosedShowdownCache:cclClear,closedShowdownCacheSize:()=>cclCache.size,sessionRequired:false,deviceRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false});
});
