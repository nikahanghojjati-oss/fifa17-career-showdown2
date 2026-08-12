(function(){
  const ORDER=Object.freeze(["activeShowdown","legacyShowdowns","preferences"]);
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  function base(status,extra={}){
    return Object.assign({
      ok:false,status,affectedKeys:[],failedKey:null,failurePhase:null,
      rollbackAttempted:false,rollbackVerified:null,rollbackFailures:[],
      rollbackVerificationMismatches:[],verificationMismatches:[]
    },extra);
  }
  function runCareerModeRawStorageTransaction(candidateRaw,io){
    if(!candidateRaw||typeof candidateRaw!=="object"||Array.isArray(candidateRaw)||!io||typeof io.read!=="function"||typeof io.write!=="function"){
      return base("invalid-plan",{failurePhase:"plan"});
    }
    const requested=ORDER.filter(name=>has(candidateRaw,name));
    for(const name of requested){
      const value=candidateRaw[name];
      if(value!==null&&typeof value!=="string"){
        return base("invalid-plan",{affectedKeys:requested.slice(),failedKey:name,failurePhase:"plan"});
      }
    }
    if(!requested.length){return Object.assign(base("no-op"),{ok:true});}
    const snapshot=Object.create(null);
    for(const name of requested){
      const read=io.read(name,"snapshot");
      if(!read||read.ok!==true){
        return base("snapshot-failed",{affectedKeys:requested.slice(),failedKey:name,failurePhase:"snapshot"});
      }
      snapshot[name]=read.value;
    }
    const affected=requested.filter(name=>snapshot[name]!==candidateRaw[name]);
    if(!affected.length){return Object.assign(base("no-op"),{ok:true});}
    let failedKey=null;
    let failurePhase=null;
    const verificationMismatches=[];
    for(const name of affected){
      if(io.write(name,candidateRaw[name],"commit")!==true){
        failedKey=name;
        failurePhase="write";
        break;
      }
    }
    if(!failurePhase){
      for(const name of affected){
        const read=io.read(name,"verify");
        if(!read||read.ok!==true||read.value!==candidateRaw[name]){
          failedKey=name;
          failurePhase="verify";
          verificationMismatches.push(name);
          break;
        }
      }
    }
    if(failurePhase){
      const rollbackFailures=[];
      const rollbackVerificationMismatches=[];
      for(const name of affected){
        if(io.write(name,snapshot[name],"rollback")!==true){rollbackFailures.push(name);}
      }
      for(const name of affected){
        const read=io.read(name,"rollback-verify");
        if(!read||read.ok!==true||read.value!==snapshot[name]){rollbackVerificationMismatches.push(name);}
      }
      const rollbackVerified=!rollbackFailures.length&&!rollbackVerificationMismatches.length;
      return base(rollbackVerified?"rolled-back":"rollback-failed-critical",{
        affectedKeys:affected.slice(),failedKey,failurePhase,rollbackAttempted:true,rollbackVerified,
        rollbackFailures,rollbackVerificationMismatches,verificationMismatches
      });
    }
    return Object.assign(base("success",{affectedKeys:affected.slice()}),{ok:true});
  }
  window.runCareerModeRawStorageTransaction=runCareerModeRawStorageTransaction;
})();
