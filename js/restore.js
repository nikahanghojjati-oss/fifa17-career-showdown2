(function(){
  let restoreInFlight=false;
  const RAW_NAMES=Object.freeze(["activeShowdown","legacyShowdowns","preferences"]);
  const SAVE_LIBRARY_RAW_NAMES=Object.freeze(["saveLibrary","activeShowdown","legacyShowdowns","preferences"]);
  const SAVE_LIBRARY_RESTORE_ORDER=Object.freeze(["activeShowdown","legacyShowdowns","preferences","saveLibrary"]);
  const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  function canonical(value){
    if(value===null||typeof value!=="object")return JSON.stringify(value);
    if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  function clone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
  function captureStrictRaw(){
    if(typeof window.captureCareerModeRawRestoreSnapshot!=="function"){
      return {ok:false,raw:null,failedKeys:RAW_NAMES.slice()};
    }
    const snapshot=window.captureCareerModeRawRestoreSnapshot();
    if(snapshot&&snapshot.ok===true&&snapshot.raw&&typeof snapshot.raw==="object")return snapshot;
    return {ok:false,raw:null,failedKeys:snapshot&&Array.isArray(snapshot.failedKeys)?snapshot.failedKeys:RAW_NAMES.slice()};
  }
  function captureStrictSaveLibraryRaw(){
    if(typeof window.captureCareerModeRawSaveLibraryMigrationSnapshot!=="function")return {ok:false,raw:null,failedKeys:SAVE_LIBRARY_RAW_NAMES.slice()};
    const snapshot=window.captureCareerModeRawSaveLibraryMigrationSnapshot();
    if(snapshot&&snapshot.ok===true&&snapshot.raw&&typeof snapshot.raw==="object")return snapshot;
    return {ok:false,raw:null,failedKeys:snapshot&&Array.isArray(snapshot.failedKeys)?snapshot.failedKeys:SAVE_LIBRARY_RAW_NAMES.slice()};
  }
  function rawViewsAgree(restoreRaw,libraryRaw){return RAW_NAMES.every(name=>restoreRaw[name]===libraryRaw[name]);}
  function parseRaw(raw,kind){
    if(raw===null)return {state:"absent",value:kind==="legacy"?[]:null};
    try{
      const value=JSON.parse(raw);
      if(kind==="legacy"&&!Array.isArray(value))throw new Error("Legacy value is not an array.");
      if(kind!=="legacy"&&(!value||typeof value!=="object"||Array.isArray(value)))throw new Error(`${kind} value is not an object.`);
      return {state:"valid",value};
    }catch(error){return {state:"corrupt",value:null,error};}
  }
  function dedupeBackupLegacy(records){
    const output=[];
    const seen=new Map();
    for(const record of Array.isArray(records)?records:[]){
      if(!record||typeof record!=="object"||Array.isArray(record))continue;
      const id=String(record.id??"");
      const signature=canonical(record);
      const previous=seen.get(id);
      if(previous===signature)continue;
      if(previous&&previous!==signature)return {ok:false,error:`Backup Legacy contains conflicting records with Showdown ID ${id}.`};
      seen.set(id,signature);
      output.push(clone(record));
    }
    return {ok:true,records:output};
  }
  function mergeLegacy(localRecords,backupRecords,decisions){
    const result=(Array.isArray(localRecords)?localRecords:[]).map(clone);
    const conflicts=[];
    const added=[];
    const skipped=[];
    const replaced=[];
    const backup=dedupeBackupLegacy(backupRecords);
    if(!backup.ok)return {ok:false,errors:[backup.error],conflicts,records:result,added,skipped,replaced};
    for(const imported of backup.records){
      const id=String(imported.id??"");
      const matches=[];
      result.forEach((record,index)=>{if(String((record&&record.id)??"")===id)matches.push(index);});
      if(!matches.length){result.push(imported);added.push(id);continue;}
      const importedSignature=canonical(imported);
      if(matches.some(index=>canonical(result[index])===importedSignature)){skipped.push(id);continue;}
      const choice=decisions&&decisions[id];
      if(choice!=="keep-local"&&choice!=="use-backup"){
        conflicts.push({id,backup:clone(imported),local:matches.map(index=>clone(result[index]))});
        continue;
      }
      if(choice==="keep-local"){skipped.push(id);continue;}
      const first=matches[0];
      for(let index=matches.length-1;index>=0;index-=1)result.splice(matches[index],1);
      result.splice(first,0,imported);
      replaced.push(id);
    }
    if(conflicts.length)return {ok:false,errors:["Explicit Legacy conflict choices are required."],conflicts,records:result,added,skipped,replaced};
    return {ok:true,errors:[],conflicts,records:result,added,skipped,replaced};
  }
  function createCareerModeRestorePlan(analysis,currentRaw,choices={}){
    const errors=[];
    const warnings=[];
    if(!analysis||analysis.ok!==true||!analysis.checksum||analysis.checksum.verified!==true){
      return {ok:false,status:"analysis-blocked",errors:["A freshly verified Candidate B analysis is required before restore."],warnings,candidateRaw:{},summary:null,conflicts:[]};
    }
    if(!analysis.migratedPayload||typeof analysis.migratedPayload!=="object"){
      return {ok:false,status:"analysis-blocked",errors:["Fresh analysis did not produce a migrated payload."],warnings,candidateRaw:{},summary:null,conflicts:[]};
    }
    if(!currentRaw||typeof currentRaw!=="object"){
      return {ok:false,status:"snapshot-unavailable",errors:["Current raw storage state is unavailable."],warnings,candidateRaw:{},summary:null,conflicts:[]};
    }
    const activeChoice=choices.active;
    const legacyChoice=choices.legacy;
    const preferencesChoice=choices.preferences;
    if(activeChoice!=="keep-current"&&activeChoice!=="use-backup")errors.push("Choose whether to keep the current active Showdown or use the backup active state.");
    if(legacyChoice!=="keep-current"&&legacyChoice!=="merge"&&legacyChoice!=="replace-with-backup")errors.push("Choose whether to keep, merge, or replace Legacy history.");
    if(preferencesChoice!=="keep-current"&&preferencesChoice!=="use-backup")errors.push("Choose whether to keep current application preferences or use backup preferences.");
    if(errors.length)return {ok:false,status:"choice-required",errors,warnings,candidateRaw:{},summary:null,conflicts:[]};

    const payload=analysis.migratedPayload;
    const candidateRaw={};
    const summary={active:activeChoice,legacy:legacyChoice,preferences:preferencesChoice,legacyAdded:[],legacySkipped:[],legacyReplaced:[]};
    if(activeChoice==="use-backup"){
      if(parseRaw(currentRaw.activeShowdown,"active").state==="corrupt")warnings.push("Unreadable current active Showdown bytes will be replaced only because backup active state was explicitly selected.");
      candidateRaw.activeShowdown=payload.activeShowdown===null?null:JSON.stringify(payload.activeShowdown);
    }
    if(preferencesChoice==="use-backup"){
      if(parseRaw(currentRaw.preferences,"preferences").state==="corrupt")warnings.push("Unreadable current preference bytes will be replaced only because backup preferences were explicitly selected.");
      candidateRaw.preferences=payload.preferences===null?null:JSON.stringify(payload.preferences);
    }

    let conflicts=[];
    if(legacyChoice!=="keep-current"){
      const localLegacy=parseRaw(currentRaw.legacyShowdowns,"legacy");
      const backupLegacy=payload.legacyShowdowns;
      if(legacyChoice==="replace-with-backup"){
        const deduped=dedupeBackupLegacy(backupLegacy);
        if(!deduped.ok)errors.push(deduped.error);
        else candidateRaw.legacyShowdowns=backupLegacy===null?null:JSON.stringify(deduped.records);
        if(localLegacy.state==="corrupt")warnings.push("Unreadable current Legacy bytes will be replaced only because explicit Legacy replacement was selected.");
      }else if(localLegacy.state==="corrupt"){
        errors.push("Current Legacy bytes are unreadable. Merge is unsafe; keep current bytes or explicitly replace them with the backup Legacy state.");
      }else if(backupLegacy!==null){
        const merged=mergeLegacy(localLegacy.value,backupLegacy,choices.legacyConflicts||{});
        conflicts=merged.conflicts;
        if(!merged.ok)errors.push(...merged.errors);
        else{
          if(merged.added.length||merged.replaced.length)candidateRaw.legacyShowdowns=JSON.stringify(merged.records);
          summary.legacyAdded=merged.added;
          summary.legacySkipped=merged.skipped;
          summary.legacyReplaced=merged.replaced;
        }
      }
    }

    if(errors.length)return {ok:false,status:conflicts.length?"conflict-choice-required":"choice-blocked",errors,warnings,candidateRaw:{},summary,conflicts};
    return {ok:true,status:"ready",errors,warnings,candidateRaw,summary,conflicts:[]};
  }
  function compareReviewedRawState(expectedRaw,currentRaw){
    if(!expectedRaw||typeof expectedRaw!=="object"||Array.isArray(expectedRaw))return {checked:false,changedKeys:[]};
    if(RAW_NAMES.some(name=>!own(expectedRaw,name)))return {checked:false,changedKeys:[]};
    return {checked:true,changedKeys:RAW_NAMES.filter(name=>expectedRaw[name]!==currentRaw[name])};
  }
  function compareReviewedSaveLibraryState(expectedRaw,currentRaw){
    if(!expectedRaw||!own(expectedRaw,"saveLibrary"))return {checked:false,changedKeys:[]};
    return {checked:true,changedKeys:expectedRaw.saveLibrary===currentRaw.saveLibrary?[]:["saveLibrary"]};
  }
  async function buildSaveLibraryRestoreCandidate(plan,analysis,raw){
    if(raw.activeShowdown!==null)return {ok:false,status:"dual-authority-conflict",errors:["Save Library and singleton active storage coexist at the restore boundary. Resolve the interrupted migration before applying a backup."]};
    const runtime=window.CareerModeSaveLibraryRuntime;
    if(!runtime||typeof runtime.prepareRestoreLibraryRaw!=="function")return {ok:false,status:"save-library-runtime-unavailable",errors:["Save Library restore compatibility is unavailable. Nothing was written."]};
    let nextLibrary=raw.saveLibrary;
    if(plan.summary.active==="use-backup")nextLibrary=await runtime.prepareRestoreLibraryRaw(analysis.migratedPayload.activeShowdown,raw.saveLibrary);
    return {
      ok:true,
      candidateRaw:{
        activeShowdown:null,
        legacyShowdowns:own(plan.candidateRaw,"legacyShowdowns")?plan.candidateRaw.legacyShowdowns:raw.legacyShowdowns,
        preferences:own(plan.candidateRaw,"preferences")?plan.candidateRaw.preferences:raw.preferences,
        saveLibrary:nextLibrary
      },
      expectedRaw:raw,
      options:{order:SAVE_LIBRARY_RESTORE_ORDER.slice(),guardRequestedBeforeEachWrite:true}
    };
  }
  async function applyCareerModeRestore(file,choices={},reviewContext={}){
    if(restoreInFlight)return {ok:false,status:"busy",errors:["A restore transaction is already in progress."]};
    const confirmedFile=file;
    const confirmedChoices=clone(choices&&typeof choices==="object"?choices:{})||{};
    const confirmedExpectedRaw=clone(reviewContext&&reviewContext.expectedRaw);
    restoreInFlight=true;
    try{
      if(typeof window.flushPendingApplicationWrites!=="function"||window.flushPendingApplicationWrites()===false){
        return {ok:false,status:"flush-failed",errors:["Pending application writes could not be flushed safely."]};
      }
      if(typeof window.analyzeCareerModeBackupFile!=="function")return {ok:false,status:"analysis-unavailable",errors:["Candidate B analysis authority is unavailable."]};
      const analysis=await window.analyzeCareerModeBackupFile(confirmedFile);
      if(!analysis||analysis.ok!==true)return {ok:false,status:"analysis-blocked",analysis,errors:(analysis&&analysis.errors)||["Fresh backup analysis was blocked."]};
      const strictSnapshot=captureStrictRaw();
      if(!strictSnapshot.ok){
        return {ok:false,status:"snapshot-unavailable",analysis,failedKeys:strictSnapshot.failedKeys,errors:[`Exact browser storage could not be read safely${strictSnapshot.failedKeys.length?`: ${strictSnapshot.failedKeys.join(", ")}`:""}. Nothing was written.`]};
      }
      const saveLibrarySnapshot=captureStrictSaveLibraryRaw();
      if(!saveLibrarySnapshot.ok){
        return {ok:false,status:"snapshot-unavailable",analysis,failedKeys:saveLibrarySnapshot.failedKeys,errors:[`Exact Save Library storage could not be read safely${saveLibrarySnapshot.failedKeys.length?`: ${saveLibrarySnapshot.failedKeys.join(", ")}`:""}. Nothing was written.`]};
      }
      const currentRaw=strictSnapshot.raw;
      const completeRaw=saveLibrarySnapshot.raw;
      if(!rawViewsAgree(currentRaw,completeRaw)){
        return {ok:false,status:"stale-state",analysis,currentRaw:completeRaw,changedKeys:RAW_NAMES.slice(),errors:["Canonical storage changed between the mandatory restore snapshot and the Save Library authority snapshot. Nothing was written."]};
      }
      const reviewState=compareReviewedRawState(confirmedExpectedRaw,currentRaw);
      const libraryReviewState=compareReviewedSaveLibraryState(confirmedExpectedRaw,completeRaw);
      const reviewedChanges=[...reviewState.changedKeys,...libraryReviewState.changedKeys];
      if((reviewState.checked||libraryReviewState.checked)&&reviewedChanges.length){
        return {
          ok:false,
          status:"stale-state",
          analysis,
          currentRaw:completeRaw,
          changedKeys:reviewedChanges,
          errors:[`Current browser data changed after review: ${reviewedChanges.join(", ")}. Review the refreshed state before applying.`]
        };
      }
      const plan=createCareerModeRestorePlan(analysis,currentRaw,confirmedChoices);
      if(!plan.ok)return {ok:false,status:plan.status,analysis,plan,currentRaw:completeRaw,errors:plan.errors,warnings:plan.warnings};
      if(typeof window.applyCareerModeRawStorageTransaction!=="function")return {ok:false,status:"transaction-unavailable",analysis,plan,currentRaw:completeRaw,errors:["Storage transaction authority is unavailable."]};

      let candidateRaw=plan.candidateRaw;
      let expectedRaw=currentRaw;
      let transactionOptions;
      const saveLibraryMode=completeRaw.saveLibrary!==null;
      if(saveLibraryMode){
        const prepared=await buildSaveLibraryRestoreCandidate(plan,analysis,completeRaw);
        if(!prepared.ok)return {ok:false,status:prepared.status,analysis,plan,currentRaw:completeRaw,errors:prepared.errors,warnings:plan.warnings};
        candidateRaw=prepared.candidateRaw;
        expectedRaw=prepared.expectedRaw;
        transactionOptions=prepared.options;
        if(window.CareerModeSaveLibraryRuntime&&typeof window.CareerModeSaveLibraryRuntime.invalidateAuthority==="function")window.CareerModeSaveLibraryRuntime.invalidateAuthority();
      }

      const transaction=window.applyCareerModeRawStorageTransaction(candidateRaw,expectedRaw,transactionOptions);
      if(transaction&&transaction.ok!==true&&transaction.failurePhase==="precondition"&&transaction.rollbackVerified!==false){
        const refreshed=saveLibraryMode?captureStrictSaveLibraryRaw():captureStrictRaw();
        const latestRaw=refreshed.ok?refreshed.raw:expectedRaw;
        return {
          ok:false,status:"stale-state",analysis,plan,currentRaw:latestRaw,transaction,
          changedKeys:Array.isArray(transaction.preconditionMismatches)?transaction.preconditionMismatches:[],
          errors:["Browser data changed at the transaction boundary. No unverified restore result was accepted. Review the current state again."],
          warnings:plan.warnings
        };
      }
      let runtimeReactivationError=null;
      if(saveLibraryMode&&transaction&&transaction.ok&&window.CareerModeSaveLibraryRuntime&&typeof window.CareerModeSaveLibraryRuntime.activate==="function"){
        try{await window.CareerModeSaveLibraryRuntime.activate();}
        catch(error){runtimeReactivationError=error&&error.message?error.message:String(error);}
      }
      return {
        ok:Boolean(transaction&&transaction.ok),
        status:transaction&&transaction.ok?"success":(transaction&&transaction.status)||"transaction-failed",
        analysis,plan,currentRaw:completeRaw,transaction,
        errors:transaction&&transaction.ok?[]:[transaction&&transaction.status==="write-failed-clean"?"Restore could not start writing. Canonical browser data was left unchanged.":"Restore did not commit successfully."],
        warnings:runtimeReactivationError?[...plan.warnings,`Restore committed, but Save Library runtime reactivation requires a reload: ${runtimeReactivationError}`]:plan.warnings
      };
    }catch(error){
      return {ok:false,status:"restore-error",errors:[error&&error.message?error.message:String(error)]};
    }finally{restoreInFlight=false;}
  }
  window.createCareerModeRestorePlan=createCareerModeRestorePlan;
  window.applyCareerModeRestore=applyCareerModeRestore;
  window.isCareerModeRestoreInFlight=()=>restoreInFlight;
})();