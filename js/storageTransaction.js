(function(){
  const ORDER=Object.freeze(["activeShowdown","legacyShowdowns","preferences"]);
  const has=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  function base(status,extra={}){
    return Object.assign({
      ok:false,status,affectedKeys:[],committedKeys:[],failedKey:null,failurePhase:null,
      preconditionMismatches:[],verificationMismatches:[],
      rollbackAttempted:false,rollbackVerified:null,rollbackKeys:[],rollbackFailures:[],
      rollbackOwnershipConflicts:[],rollbackVerificationMismatches:[]
    },extra);
  }
  function readValue(io,name,phase){
    const result=io.read(name,phase);
    return result&&result.ok===true?result:null;
  }
  function runCareerModeRawStorageTransaction(candidateRaw,io,expectedRaw=null){
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
    if(!requested.length)return Object.assign(base("no-op"),{ok:true});

    const snapshot=Object.create(null);
    for(const name of requested){
      const read=readValue(io,name,"snapshot");
      if(!read){
        return base("snapshot-failed",{affectedKeys:requested.slice(),failedKey:name,failurePhase:"snapshot"});
      }
      snapshot[name]=read.value;
    }

    const expectedProvided=expectedRaw&&typeof expectedRaw==="object"&&!Array.isArray(expectedRaw);
    const initialPreconditionMismatches=expectedProvided
      ? requested.filter(name=>has(expectedRaw,name)&&snapshot[name]!==expectedRaw[name])
      : [];
    if(initialPreconditionMismatches.length){
      return base("stale-precondition",{
        affectedKeys:requested.slice(),failedKey:initialPreconditionMismatches[0],failurePhase:"precondition",
        preconditionMismatches:initialPreconditionMismatches
      });
    }

    const affected=requested.filter(name=>snapshot[name]!==candidateRaw[name]);
    if(!affected.length)return Object.assign(base("no-op"),{ok:true});

    const committedKeys=[];
    const preconditionMismatches=[];
    const verificationMismatches=[];
    let failedKey=null;
    let failurePhase=null;

    for(const name of affected){
      const prewrite=readValue(io,name,"prewrite");
      if(!prewrite||prewrite.value!==snapshot[name]){
        failedKey=name;
        failurePhase="precondition";
        preconditionMismatches.push(name);
        break;
      }
      if(io.write(name,candidateRaw[name],"commit")!==true){
        failedKey=name;
        failurePhase="write";
        break;
      }
      committedKeys.push(name);
    }

    if(!failurePhase){
      for(const name of affected){
        const read=readValue(io,name,"verify");
        if(!read||read.value!==candidateRaw[name]){
          failedKey=name;
          failurePhase="verify";
          verificationMismatches.push(name);
          break;
        }
      }
    }

    if(!failurePhase){
      return Object.assign(base("success",{affectedKeys:affected.slice(),committedKeys:committedKeys.slice()}),{ok:true});
    }

    const rollbackKeys=committedKeys.slice().reverse();
    if(!rollbackKeys.length){
      const status=failurePhase==="precondition"?"stale-precondition":"write-failed-clean";
      return base(status,{
        affectedKeys:affected.slice(),committedKeys:[],failedKey,failurePhase,
        preconditionMismatches,verificationMismatches,
        rollbackAttempted:false,rollbackVerified:true,rollbackKeys:[]
      });
    }

    const rollbackFailures=[];
    const rollbackOwnershipConflicts=[];
    const rollbackVerificationMismatches=[];
    for(const name of rollbackKeys){
      const ownership=readValue(io,name,"rollback-owner-check");
      if(!ownership){
        rollbackOwnershipConflicts.push(name);
        continue;
      }
      if(ownership.value===snapshot[name])continue;
      if(ownership.value!==candidateRaw[name]){
        rollbackOwnershipConflicts.push(name);
        continue;
      }
      if(io.write(name,snapshot[name],"rollback")!==true)rollbackFailures.push(name);
    }
    for(const name of rollbackKeys){
      const read=readValue(io,name,"rollback-verify");
      if(!read||read.value!==snapshot[name])rollbackVerificationMismatches.push(name);
    }
    const rollbackVerified=!rollbackFailures.length&&!rollbackOwnershipConflicts.length&&!rollbackVerificationMismatches.length;
    return base(rollbackVerified?"rolled-back":"rollback-failed-critical",{
      affectedKeys:affected.slice(),committedKeys:committedKeys.slice(),failedKey,failurePhase,
      preconditionMismatches,verificationMismatches,
      rollbackAttempted:true,rollbackVerified,rollbackKeys,
      rollbackFailures,rollbackOwnershipConflicts,rollbackVerificationMismatches
    });
  }
  window.runCareerModeRawStorageTransaction=runCareerModeRawStorageTransaction;
})();
