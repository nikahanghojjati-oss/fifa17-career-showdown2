(function(){
  let restoreInFlight=false;
  const RAW_NAMES=Object.freeze(["activeShowdown","legacyShowdowns","preferences"]);
  const SAVE_LIBRARY_RAW_NAMES=Object.freeze(["saveLibrary","activeShowdown","legacyShowdowns","preferences"]);
  const SAVE_LIBRARY_RESTORE_ORDER=Object.freeze(["activeShowdown","legacyShowdowns","preferences","saveLibrary"]);
  const REMOTE_RECONCILIATION_KIND="connected-rivalry-remote-to-local";
  const REMOTE_RECONCILIATION_SCHEMA_VERSION=1;
  const REMOTE_RECONCILIATION_MAX_PAYLOAD_BYTES=900*1024;
  const REMOTE_RECONCILIATION_ROLES=Object.freeze(["playerOne","playerTwo"]);
  const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  function canonical(value){
    if(value===null||typeof value!=="object")return JSON.stringify(value);
    if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  function clone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
  function plainObject(value){return Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&Object.prototype.toString.call(value)==="[object Object]");}
  function freezeRemoteReconciliationValue(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(freezeRemoteReconciliationValue);
    return value;
  }
  function byteLength(value){
    const serialized=typeof value==="string"?value:JSON.stringify(value);
    return typeof TextEncoder==="function"?new TextEncoder().encode(serialized).byteLength:new Blob([serialized]).size;
  }
  async function sha256Canonical(value){
    if(!window.crypto||!window.crypto.subtle||typeof window.crypto.subtle.digest!=="function"||typeof TextEncoder!=="function"){
      throw new Error("Secure SHA-256 support is unavailable.");
    }
    const digest=await window.crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));
    return `sha256:${Array.from(new Uint8Array(digest),part=>part.toString(16).padStart(2,"0")).join("")}`;
  }
  function exactRawChanges(expected,current){
    return SAVE_LIBRARY_RAW_NAMES.filter(name=>!expected||!current||expected[name]!==current[name]);
  }
  function reconciliationFailure(status,message,extra={}){
    return {ok:false,status,errors:[message],...extra};
  }
  function captureStrictRaw(){
    if(typeof window.captureCareerModeRawRestoreSnapshot!=="function"){
      return {ok:false,raw:null,failedKeys:RAW_NAMES.slice()};
    }
    const snapshot=window.captureCareerModeRawRestoreSnapshot();
    if(snapshot&&snapshot.ok===true&&snapshot.raw&&typeof snapshot.raw==="object")return snapshot;
    return {ok:false,raw:null,failedKeys:snapshot&&Array.isArray(snapshot.failedKeys)?snapshot.failedKeys:RAW_NAMES.slice()};
  }
  function captureStrictSaveLibraryRaw(){
    if(typeof window.captureCareerModeRawSaveLibraryMigrationSnapshot!=="function")return {ok:true,raw:null,failedKeys:[],unavailable:true};
    const snapshot=window.captureCareerModeRawSaveLibraryMigrationSnapshot();
    if(snapshot&&snapshot.ok===true&&snapshot.raw&&typeof snapshot.raw==="object")return {...snapshot,unavailable:false};
    return {ok:false,raw:null,failedKeys:snapshot&&Array.isArray(snapshot.failedKeys)?snapshot.failedKeys:SAVE_LIBRARY_RAW_NAMES.slice(),unavailable:false};
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
    const payload=analysis.migratedPayload;
    const hasBackupLibrary=Boolean(
      payload&&payload.saveLibrary&&typeof payload.saveLibrary==="object"&&
      Array.isArray(payload.saveLibrary.saves)&&Array.isArray(payload.saveLibrary.profiles)
    );
    // saveLibrary choice: key omitted → keep-current (safe default for contracts + classic path).
    // Key present but empty/invalid → require explicit choice only when backup carries a complete library
    // (UI shows the SAVE LIBRARY control). Classic v1 envelopes have no library control.
    const hasSaveLibraryKey=Object.prototype.hasOwnProperty.call(choices,"saveLibrary");
    const rawSaveLibraryChoice=hasSaveLibraryKey?choices.saveLibrary:"";
    const saveLibraryChoice=(rawSaveLibraryChoice==="keep-current"||rawSaveLibraryChoice==="use-backup")
      ?rawSaveLibraryChoice
      :"keep-current";
    if(activeChoice!=="keep-current"&&activeChoice!=="use-backup")errors.push("Choose whether to keep the current active Showdown or use the backup active state.");
    if(legacyChoice!=="keep-current"&&legacyChoice!=="merge"&&legacyChoice!=="replace-with-backup")errors.push("Choose whether to keep, merge, or replace Legacy history.");
    if(preferencesChoice!=="keep-current"&&preferencesChoice!=="use-backup")errors.push("Choose whether to keep current application preferences or use backup preferences.");
    if(hasBackupLibrary&&hasSaveLibraryKey&&rawSaveLibraryChoice!=="keep-current"&&rawSaveLibraryChoice!=="use-backup"){
      errors.push("Choose whether to keep the current complete Save Library or replace it entirely with the backup library.");
    }
    if(errors.length)return {ok:false,status:"choice-required",errors,warnings,candidateRaw:{},summary:null,conflicts:[]};
    const destinationIsClean=(currentRaw.saveLibrary==null||currentRaw.saveLibrary===undefined)&&
      (currentRaw.activeShowdown==null||currentRaw.activeShowdown===undefined);

    const candidateRaw={};
    const summary={
      active:activeChoice,
      legacy:legacyChoice,
      preferences:preferencesChoice,
      saveLibrary:"keep-current",
      legacyAdded:[],
      legacySkipped:[],
      legacyReplaced:[]
    };

    // Full-library path (formatVersion 2): explicit clean restore or existing-data replace-all under Candidate C
    if(hasBackupLibrary&&(saveLibraryChoice==="use-backup"||destinationIsClean)){
      if(destinationIsClean){
        summary.saveLibrary="full-restore-clean";
      }else{
        summary.saveLibrary="replace-all";
        if(parseRaw(currentRaw.saveLibrary,"saveLibrary").state==="corrupt"){
          warnings.push("Unreadable current Save Library bytes will be replaced only because explicit full-library replacement was selected.");
        }
      }
      candidateRaw.saveLibrary=JSON.stringify(payload.saveLibrary);
      // Full library restore owns active selection via activeSaveId; clear singleton activeShowdown
      candidateRaw.activeShowdown=null;
      summary.active="use-backup";
    }else if(hasBackupLibrary&&saveLibraryChoice==="keep-current"){
      summary.saveLibrary="keep-current";
      // do not put saveLibrary into candidateRaw
    }

    // Classic active / preferences / legacy path (still required for v1 compatibility and mixed choices)
    if(!(hasBackupLibrary&&(saveLibraryChoice==="use-backup"||destinationIsClean))){
      if(activeChoice==="use-backup"){
        if(parseRaw(currentRaw.activeShowdown,"active").state==="corrupt")warnings.push("Unreadable current active Showdown bytes will be replaced only because backup active state was explicitly selected.");
        candidateRaw.activeShowdown=payload.activeShowdown===null?null:JSON.stringify(payload.activeShowdown);
      }
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
      const saveLibraryAvailable=saveLibrarySnapshot.unavailable!==true;
      const completeRaw=saveLibraryAvailable?saveLibrarySnapshot.raw:currentRaw;
      if(saveLibraryAvailable&&!rawViewsAgree(currentRaw,completeRaw)){
        return {ok:false,status:"stale-state",analysis,currentRaw:completeRaw,changedKeys:RAW_NAMES.slice(),errors:["Canonical storage changed between the mandatory restore snapshot and the Save Library authority snapshot. Nothing was written."]};
      }
      const reviewState=compareReviewedRawState(confirmedExpectedRaw,currentRaw);
      const libraryReviewState=saveLibraryAvailable?compareReviewedSaveLibraryState(confirmedExpectedRaw,completeRaw):{checked:false,changedKeys:[]};
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
      const planHasFullLibrary=Boolean(
        plan.summary&&(plan.summary.saveLibrary==="full-restore-clean"||plan.summary.saveLibrary==="replace-all")&&
        own(plan.candidateRaw,"saveLibrary")
      );
      // Enter Save Library transaction when destination already has a library OR the plan is restoring a complete registry
      const saveLibraryMode=saveLibraryAvailable&&(completeRaw.saveLibrary!==null||planHasFullLibrary);
      if(saveLibraryMode){
        if(planHasFullLibrary){
          // Candidate C path: plan already owns exact candidateRaw including saveLibrary + cleared activeShowdown
          candidateRaw=Object.assign({},plan.candidateRaw);
          if(!own(candidateRaw,"activeShowdown"))candidateRaw.activeShowdown=null;
          expectedRaw=completeRaw;
          transactionOptions={order:SAVE_LIBRARY_RESTORE_ORDER.slice(),guardRequestedBeforeEachWrite:true};
        }else{
          const prepared=await buildSaveLibraryRestoreCandidate(plan,analysis,completeRaw);
          if(!prepared.ok)return {ok:false,status:prepared.status,analysis,plan,currentRaw:completeRaw,errors:prepared.errors,warnings:plan.warnings};
          candidateRaw=prepared.candidateRaw;
          expectedRaw=prepared.expectedRaw;
          transactionOptions=prepared.options;
        }
        if(window.CareerModeSaveLibraryRuntime&&typeof window.CareerModeSaveLibraryRuntime.invalidateAuthority==="function")window.CareerModeSaveLibraryRuntime.invalidateAuthority();
      }

      const transaction=saveLibraryMode
        ?window.applyCareerModeRawStorageTransaction(candidateRaw,expectedRaw,transactionOptions)
        :window.applyCareerModeRawStorageTransaction(plan.candidateRaw,currentRaw);
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

  function inspectRemoteReconciliationStructure(value){
    const forbidden=new Set(["__proto__","prototype","constructor"]);
    const stack=[{value,path:"$",depth:0}];
    let visited=0;
    while(stack.length){
      const current=stack.pop();
      visited+=1;
      if(visited>250000)return "Remote gameplay state contains too many nested values to inspect safely.";
      if(current.depth>48)return `Remote gameplay state exceeds the supported nesting depth near ${current.path}.`;
      if(!current.value||typeof current.value!=="object")continue;
      for(const key of Object.keys(current.value)){
        if(forbidden.has(key))return `Remote gameplay state contains a forbidden object key at ${current.path}.${key}.`;
        const child=current.value[key];
        if(child&&typeof child==="object")stack.push({value:child,path:`${current.path}.${key}`,depth:current.depth+1});
      }
    }
    return null;
  }

  function normalizeRemoteReconciliationTarget(target){
    const source=plainObject(target)?target:{};
    const saveId=typeof source.saveId==="string"?source.saveId.trim():"";
    const profileId=typeof source.profileId==="string"?source.profileId.trim():"";
    const managerRole=typeof source.managerRole==="string"?source.managerRole.trim():"";
    if(!/^save_[0-9a-f]{24}$/.test(saveId))return reconciliationFailure("target-invalid","The exact local Save target is invalid.");
    if(!/^profile_[0-9a-f]{24}$/.test(profileId))return reconciliationFailure("target-invalid","The exact local Profile target is invalid.");
    if(!REMOTE_RECONCILIATION_ROLES.includes(managerRole))return reconciliationFailure("target-invalid","The exact local manager role is invalid.");
    return {ok:true,target:{saveId,profileId,managerRole}};
  }

  function captureRemoteReconciliationRaw(){
    const strictSnapshot=captureStrictRaw();
    if(!strictSnapshot.ok){
      return reconciliationFailure("snapshot-unavailable",`Exact browser storage could not be read safely${strictSnapshot.failedKeys.length?`: ${strictSnapshot.failedKeys.join(", ")}`:""}. Nothing was written.`,{failedKeys:strictSnapshot.failedKeys});
    }
    const saveLibrarySnapshot=captureStrictSaveLibraryRaw();
    if(!saveLibrarySnapshot.ok||saveLibrarySnapshot.unavailable===true||!saveLibrarySnapshot.raw){
      const failed=saveLibrarySnapshot&&Array.isArray(saveLibrarySnapshot.failedKeys)?saveLibrarySnapshot.failedKeys:SAVE_LIBRARY_RAW_NAMES;
      return reconciliationFailure("snapshot-unavailable",`Exact Save Library storage could not be read safely${failed.length?`: ${failed.join(", ")}`:""}. Nothing was written.`,{failedKeys:failed});
    }
    if(!rawViewsAgree(strictSnapshot.raw,saveLibrarySnapshot.raw)){
      return reconciliationFailure("stale-state","Canonical storage changed between mandatory exact snapshots. Nothing was written.",{changedKeys:RAW_NAMES.slice()});
    }
    const raw=saveLibrarySnapshot.raw;
    if(SAVE_LIBRARY_RAW_NAMES.some(name=>!own(raw,name)||(raw[name]!==null&&typeof raw[name]!=="string"))){
      return reconciliationFailure("snapshot-unavailable","The exact four-slot browser storage snapshot is incomplete. Nothing was written.");
    }
    if(raw.activeShowdown!==null){
      return reconciliationFailure("dual-authority-conflict","Singleton active storage reappeared beside Save Library authority. Remote Apply is blocked.");
    }
    if(raw.saveLibrary===null)return reconciliationFailure("save-library-unavailable","A valid Save Library is required before remote gameplay can be previewed.");
    let library;
    try{library=JSON.parse(raw.saveLibrary);}catch(_error){return reconciliationFailure("save-library-invalid","Save Library storage contains unreadable JSON. Nothing was written.");}
    const foundation=window.CareerModeSaveLibraryFoundation;
    if(!foundation||typeof foundation.validateSaveLibrary!=="function")return reconciliationFailure("save-library-unavailable","Save Library validation authority is unavailable. Nothing was written.");
    const errors=foundation.validateSaveLibrary(library);
    if(errors.length)return reconciliationFailure("save-library-invalid",`Save Library storage is invalid: ${errors.join(" ")}`);
    return {ok:true,status:"snapshot-ready",raw:clone(raw),library:clone(library)};
  }

  async function validateRemoteReconciliationEnvelope(envelope,rivalryId,target){
    if(typeof rivalryId!=="string"||!/^pair_[0-9a-f]{64}$/.test(rivalryId))return reconciliationFailure("remote-invalid","The exact Connected Rivalry identity is invalid.");
    if(!plainObject(envelope)||envelope.schemaVersion!==1||envelope.objectType!=="sharedState"||envelope.objectId!==rivalryId||envelope.lifecycleState!=="live"||!Number.isInteger(envelope.revision)||envelope.revision<0){
      return reconciliationFailure("remote-invalid","The observed remote shared-state envelope is invalid or not live.");
    }
    if(typeof envelope.contentHash!=="string"||!/^sha256:[0-9a-f]{64}$/.test(envelope.contentHash))return reconciliationFailure("remote-invalid","The observed remote content hash is invalid.");
    if(!plainObject(envelope.data))return reconciliationFailure("remote-invalid","The observed remote gameplay projection is missing.");
    const computedHash=await sha256Canonical({objectType:"sharedState",objectId:rivalryId,revision:envelope.revision,data:envelope.data});
    if(computedHash!==envelope.contentHash)return reconciliationFailure("remote-integrity-failed","The observed remote gameplay projection does not match its SHA-256 content hash.");
    const data=envelope.data;
    if(data.payloadFormatVersion!==1||!plainObject(data.payload))return reconciliationFailure("remote-format-unsupported","This remote gameplay payload format is not supported by the current app.");
    if(byteLength(data.payload)>REMOTE_RECONCILIATION_MAX_PAYLOAD_BYTES)return reconciliationFailure("remote-too-large","The remote gameplay payload is too large to apply safely.");
    const structureProblem=inspectRemoteReconciliationStructure(data.payload);
    if(structureProblem)return reconciliationFailure("remote-structure-invalid",structureProblem);
    if(!/^save_[0-9a-f]{24}$/.test(data.saveId||""))return reconciliationFailure("remote-invalid","The remote shared Save identity is invalid.");
    if(!Array.isArray(data.managerBindings)||data.managerBindings.length!==2)return reconciliationFailure("remote-invalid","The remote gameplay projection must contain exactly two manager bindings.");
    const managerProfileIds={};
    for(let index=0;index<REMOTE_RECONCILIATION_ROLES.length;index+=1){
      const role=REMOTE_RECONCILIATION_ROLES[index];
      const binding=data.managerBindings[index];
      if(!plainObject(binding)||binding.slotId!==role||!/^profile_[0-9a-f]{24}$/.test(binding.profileId||""))return reconciliationFailure("remote-invalid","The remote manager bindings are invalid.");
      managerProfileIds[role]=binding.profileId;
    }
    if(managerProfileIds[target.managerRole]!==target.profileId)return reconciliationFailure("remote-target-mismatch","The observed remote state is not bound to the selected local manager identity.");
    const payloadIdentity=data.payload.identity;
    if(!plainObject(payloadIdentity)||payloadIdentity.saveId!==data.saveId||!plainObject(payloadIdentity.managerProfileIds)||REMOTE_RECONCILIATION_ROLES.some(role=>payloadIdentity.managerProfileIds[role]!==managerProfileIds[role])){
      return reconciliationFailure("remote-invalid","The remote gameplay identity does not match its authoritative projection metadata.");
    }
    if(!Array.isArray(data.seasonIds)||data.seasonIds.length>10||data.seasonIds.some(value=>!/^season_[0-9a-f]{24}$/.test(value))||new Set(data.seasonIds).size!==data.seasonIds.length){
      return reconciliationFailure("remote-invalid","The remote Season identity list is invalid.");
    }
    const rounds=Array.isArray(data.payload.rounds)?data.payload.rounds:[];
    const payloadSeasonIds=rounds.map(round=>round&&typeof round.seasonId==="string"?round.seasonId:"");
    if(payloadSeasonIds.some(value=>!/^season_[0-9a-f]{24}$/.test(value))||canonical(payloadSeasonIds)!==canonical(data.seasonIds))return reconciliationFailure("remote-invalid","The remote Season identities do not match the gameplay payload.");
    const activeRound=rounds.find(round=>round&&Number(round.roundNumber)===Number(data.payload.currentRound));
    const expectedActiveSeasonId=activeRound?activeRound.seasonId:null;
    if(data.activeSeasonId!==expectedActiveSeasonId)return reconciliationFailure("remote-invalid","The remote active Season identity does not match the gameplay payload.");
    const receipt=data.mutationReceipt;
    const expectedBase=envelope.revision===0?0:envelope.revision-1;
    if(!plainObject(receipt)||!coreReceiptValid(receipt,expectedBase))return reconciliationFailure("remote-invalid","The remote mutation receipt is invalid for the observed revision.");
    if(typeof window.validateCareerModeImportShowdownRecord!=="function")return reconciliationFailure("analysis-unavailable","Read-only Showdown validation authority is unavailable. Nothing was written.");
    const analysis=window.validateCareerModeImportShowdownRecord(data.payload);
    if(!analysis||analysis.ok!==true)return reconciliationFailure("remote-schema-invalid",`The remote Showdown failed read-only schema validation${analysis&&Array.isArray(analysis.errors)&&analysis.errors.length?`: ${analysis.errors.join(" ")}`:""}.`);
    if(analysis.sourceVersion!==analysis.targetVersion||analysis.steps.length)return reconciliationFailure("remote-format-unsupported","Remote reconciliation requires the current Showdown schema without implicit migration.");
    return {ok:true,status:"remote-valid",revision:envelope.revision,contentHash:envelope.contentHash,payload:clone(analysis.value),data:clone(data)};
  }

  function coreReceiptValid(receipt,expectedBase){
    return typeof receipt.idempotencyKeyHash==="string"&&/^[0-9a-f]{64}$/.test(receipt.idempotencyKeyHash)
      &&typeof receipt.requestFingerprint==="string"&&/^sha256:[0-9a-f]{64}$/.test(receipt.requestFingerprint)
      &&receipt.baseRevision===expectedBase;
  }

  function resolveRemoteReconciliationTarget(library,target){
    if(library.activeSaveId!==target.saveId)return reconciliationFailure("target-stale","The selected local Save is no longer the active Save Library target.");
    const matchingSaves=library.saves.filter(entry=>entry&&entry.saveId===target.saveId);
    if(matchingSaves.length!==1)return reconciliationFailure("target-invalid","The exact local Save target does not resolve to one Save Library entry.");
    const matchingProfiles=library.profiles.filter(profile=>profile&&profile.profileId===target.profileId);
    if(matchingProfiles.length!==1)return reconciliationFailure("target-invalid","The exact local Profile target does not resolve to one Save Library profile.");
    const entry=matchingSaves[0];
    const refs=entry.showdown&&entry.showdown.identity&&entry.showdown.identity.managerProfileIds;
    if(!plainObject(refs)||refs[target.managerRole]!==target.profileId)return reconciliationFailure("target-stale","The selected manager no longer owns the exact local Save role reviewed for Apply.");
    return {ok:true,entry,index:library.saves.findIndex(item=>item&&item.saveId===target.saveId)};
  }

  function buildRemoteReconciliationCandidate(remote,target,raw,library){
    const resolved=resolveRemoteReconciliationTarget(library,target);
    if(!resolved.ok)return resolved;
    const localShowdown=resolved.entry.showdown;
    const nextShowdown=clone(remote.payload);
    nextShowdown.id=localShowdown.id;
    nextShowdown.identity=clone(localShowdown.identity);
    const localSeasonIds=new Map((Array.isArray(localShowdown.rounds)?localShowdown.rounds:[])
      .filter(round=>round&&Number.isInteger(Number(round.roundNumber))&&typeof round.seasonId==="string"&&/^season_[0-9a-f]{24}$/.test(round.seasonId))
      .map(round=>[Number(round.roundNumber),round.seasonId]));
    nextShowdown.rounds=(Array.isArray(nextShowdown.rounds)?nextShowdown.rounds:[]).map(round=>{
      const copy=clone(round);
      const preserved=localSeasonIds.get(Number(copy.roundNumber));
      if(preserved)copy.seasonId=preserved;
      return copy;
    });
    const showdownAnalysis=window.validateCareerModeImportShowdownRecord(nextShowdown);
    if(!showdownAnalysis||showdownAnalysis.ok!==true)return reconciliationFailure("candidate-invalid",`The identity-safe local Showdown candidate is invalid${showdownAnalysis&&Array.isArray(showdownAnalysis.errors)&&showdownAnalysis.errors.length?`: ${showdownAnalysis.errors.join(" ")}`:""}.`);
    const nextLibrary=clone(library);
    nextLibrary.saves[resolved.index]={saveId:target.saveId,showdown:clone(showdownAnalysis.value)};
    const foundation=window.CareerModeSaveLibraryFoundation;
    const validationErrors=foundation.validateSaveLibrary(nextLibrary);
    if(validationErrors.length)return reconciliationFailure("candidate-invalid",`The remote reconciliation candidate violates Save Library identity: ${validationErrors.join(" ")}`);
    const candidateRaw={
      activeShowdown:null,
      legacyShowdowns:raw.legacyShowdowns,
      preferences:raw.preferences,
      saveLibrary:JSON.stringify(nextLibrary)
    };
    return {
      ok:true,
      status:"candidate-ready",
      candidateRaw,
      nextLibrary,
      localShowdownId:String(localShowdown.id),
      changed:candidateRaw.saveLibrary!==raw.saveLibrary
    };
  }

  function remoteReconciliationIntentCore(intent){
    return {
      schemaVersion:intent.schemaVersion,
      kind:intent.kind,
      rivalryId:intent.rivalryId,
      remote:clone(intent.remote),
      target:clone(intent.target),
      expectedRaw:clone(intent.expectedRaw),
      candidateRaw:clone(intent.candidateRaw),
      localShowdownId:intent.localShowdownId,
      changesLocalSave:Boolean(intent.changesLocalSave)
    };
  }

  function remoteReconciliationConfirmationText(core){
    return `I confirm remote revision ${core.remote.revision}, its full content hash shown above, and local Save ${core.target.saveId} for the manager role and profile shown above. Candidate C may replace only that Save's gameplay after completing a backup.`;
  }

  async function createRemoteReconciliationIntent({rivalryId,remote,target,snapshot,candidate}){
    const core={
      schemaVersion:REMOTE_RECONCILIATION_SCHEMA_VERSION,
      kind:REMOTE_RECONCILIATION_KIND,
      rivalryId,
      remote:{revision:remote.revision,contentHash:remote.contentHash,payloadFormatVersion:1},
      target:clone(target),
      expectedRaw:clone(snapshot.raw),
      candidateRaw:clone(candidate.candidateRaw),
      localShowdownId:candidate.localShowdownId,
      changesLocalSave:Boolean(candidate.changed)
    };
    const intentFingerprint=await sha256Canonical(core);
    return freezeRemoteReconciliationValue({
      ...core,
      intentFingerprint,
      confirmationFingerprint:intentFingerprint,
      confirmationText:remoteReconciliationConfirmationText(core,intentFingerprint)
    });
  }

  async function validateRemoteReconciliationIntent(intent){
    if(!plainObject(intent)||intent.schemaVersion!==REMOTE_RECONCILIATION_SCHEMA_VERSION||intent.kind!==REMOTE_RECONCILIATION_KIND){
      return reconciliationFailure("intent-invalid","The remote reconciliation intent is invalid.");
    }
    const targetResult=normalizeRemoteReconciliationTarget(intent.target);
    if(!targetResult.ok)return targetResult;
    if(typeof intent.rivalryId!=="string"||!/^pair_[0-9a-f]{64}$/.test(intent.rivalryId)||!plainObject(intent.remote)||!Number.isInteger(intent.remote.revision)||intent.remote.revision<0||!/^sha256:[0-9a-f]{64}$/.test(intent.remote.contentHash||"")||intent.remote.payloadFormatVersion!==1){
      return reconciliationFailure("intent-invalid","The intent does not bind a valid immutable remote revision and content hash.");
    }
    if(!plainObject(intent.expectedRaw)||!plainObject(intent.candidateRaw)||SAVE_LIBRARY_RAW_NAMES.some(name=>!own(intent.expectedRaw,name)||!own(intent.candidateRaw,name))){
      return reconciliationFailure("intent-invalid","The intent does not contain a complete exact four-slot storage review.");
    }
    for(const name of SAVE_LIBRARY_RAW_NAMES){
      if((intent.expectedRaw[name]!==null&&typeof intent.expectedRaw[name]!=="string")||(intent.candidateRaw[name]!==null&&typeof intent.candidateRaw[name]!=="string"))return reconciliationFailure("intent-invalid","The intent contains invalid raw storage values.");
    }
    if(intent.expectedRaw.activeShowdown!==null||intent.candidateRaw.activeShowdown!==null||intent.candidateRaw.legacyShowdowns!==intent.expectedRaw.legacyShowdowns||intent.candidateRaw.preferences!==intent.expectedRaw.preferences){
      return reconciliationFailure("intent-invalid","The intent attempts to broaden beyond the exact local Save Library target.");
    }
    const core=remoteReconciliationIntentCore(intent);
    const expectedFingerprint=await sha256Canonical(core);
    if(intent.intentFingerprint!==expectedFingerprint||intent.confirmationFingerprint!==expectedFingerprint||intent.confirmationText!==remoteReconciliationConfirmationText(core,expectedFingerprint)){
      return reconciliationFailure("intent-invalid","The immutable remote reconciliation intent fingerprint is invalid.");
    }
    let library;
    try{library=JSON.parse(intent.candidateRaw.saveLibrary);}catch(_error){return reconciliationFailure("intent-invalid","The intent Save Library candidate contains unreadable JSON.");}
    const foundation=window.CareerModeSaveLibraryFoundation;
    if(!foundation||typeof foundation.validateSaveLibrary!=="function")return reconciliationFailure("save-library-unavailable","Save Library validation authority is unavailable.");
    const errors=foundation.validateSaveLibrary(library);
    if(errors.length)return reconciliationFailure("intent-invalid",`The intent Save Library candidate is invalid: ${errors.join(" ")}`);
    const targetCheck=resolveRemoteReconciliationTarget(library,targetResult.target);
    if(!targetCheck.ok)return reconciliationFailure("intent-invalid",targetCheck.errors[0]);
    return {ok:true,status:"intent-valid",target:targetResult.target,core};
  }

  async function prepareCareerModeRemoteReconciliationIntent(options={}){
    try{
      const targetResult=normalizeRemoteReconciliationTarget(options.target||options.binding);
      if(!targetResult.ok)return targetResult;
      const snapshot=captureRemoteReconciliationRaw();
      if(!snapshot.ok)return snapshot;
      const rivalryId=typeof options.rivalryId==="string"?options.rivalryId.trim().toLowerCase():"";
      const remote=await validateRemoteReconciliationEnvelope(options.envelope,rivalryId,targetResult.target);
      if(!remote.ok)return remote;
      const candidate=buildRemoteReconciliationCandidate(remote,targetResult.target,snapshot.raw,snapshot.library);
      if(!candidate.ok)return candidate;
      const intent=await createRemoteReconciliationIntent({rivalryId,remote,target:targetResult.target,snapshot,candidate});
      return {
        ok:true,
        status:"preview-ready",
        intent,
        preview:freezeRemoteReconciliationValue({
          remoteRevision:remote.revision,
          remoteContentHash:remote.contentHash,
          localSaveId:targetResult.target.saveId,
          localProfileId:targetResult.target.profileId,
          localManagerRole:targetResult.target.managerRole,
          localShowdownId:candidate.localShowdownId,
          changesLocalSave:candidate.changed,
          mutating:false
        })
      };
    }catch(error){
      return reconciliationFailure("preview-error",error&&error.message?error.message:String(error));
    }
  }

  async function verifyRemoteReconciliationAtApply(intent,target,verifyRemote,phase){
    let observed;
    try{observed=await verifyRemote(phase);}catch(error){return reconciliationFailure("remote-verification-failed",error&&error.message?error.message:"The authoritative remote state could not be verified.");}
    if(!observed||observed.ok!==true||observed.exists!==true||observed.tombstoned===true||!observed.envelope){
      return reconciliationFailure("remote-stale","The authoritative remote state is no longer the live revision reviewed for Apply.");
    }
    const validated=await validateRemoteReconciliationEnvelope(observed.envelope,intent.rivalryId,target);
    if(!validated.ok)return validated;
    if(validated.revision!==intent.remote.revision||validated.contentHash!==intent.remote.contentHash){
      return reconciliationFailure("remote-stale",`Remote state changed after preview. Reviewed revision ${intent.remote.revision} was not applied.`,{observedRevision:validated.revision,observedContentHash:validated.contentHash});
    }
    return validated;
  }

  function rebuiltCandidateMatchesIntent(remote,target,snapshot,intent){
    const rebuilt=buildRemoteReconciliationCandidate(remote,target,snapshot.raw,snapshot.library);
    if(!rebuilt.ok)return rebuilt;
    if(canonical(rebuilt.candidateRaw)!==canonical(intent.candidateRaw))return reconciliationFailure("intent-stale","The reviewed remote-to-local candidate no longer derives exactly from the verified remote and local states.");
    return rebuilt;
  }

  function backupMatchesReviewedLibrary(backup,expectedRaw){
    if(!backup||!plainObject(backup.payload)||!plainObject(backup.payload.saveLibrary)||expectedRaw.saveLibrary===null)return false;
    try{return canonical(backup.payload.saveLibrary)===canonical(JSON.parse(expectedRaw.saveLibrary));}catch(_error){return false;}
  }

  async function reactivateSaveLibraryAfterReconciliation(target,critical){
    if(critical)return null;
    const runtime=window.CareerModeSaveLibraryRuntime;
    if(!runtime||typeof runtime.activate!=="function")return "Save Library runtime reactivation is unavailable; reload before continuing.";
    try{
      await runtime.activate();
      if(typeof runtime.switchActiveSave==="function")await runtime.switchActiveSave(target.saveId);
      return null;
    }catch(error){return error&&error.message?error.message:String(error);}
  }

  async function applyCareerModeRemoteReconciliation(intent,options={}){
    if(restoreInFlight)return reconciliationFailure("busy","A Candidate C storage transaction is already in progress.");
    restoreInFlight=true;
    let backupMetadata=null;
    let runtimeInvalidated=false;
    try{
      const validatedIntent=await validateRemoteReconciliationIntent(intent);
      if(!validatedIntent.ok)return validatedIntent;
      if(options.confirmed!==true||options.confirmationFingerprint!==intent.confirmationFingerprint){
        return reconciliationFailure("confirmation-required","Explicit confirmation of this exact remote revision, content hash and local target is required.");
      }
      if(typeof options.verifyRemote!=="function")return reconciliationFailure("remote-verification-required","Fresh authoritative remote verification is required immediately before local Apply.");
      if(typeof window.flushPendingApplicationWrites!=="function"||window.flushPendingApplicationWrites()===false){
        return reconciliationFailure("flush-failed","Pending application writes could not be flushed safely. Nothing was applied.");
      }
      let snapshot=captureRemoteReconciliationRaw();
      if(!snapshot.ok)return snapshot;
      let changedKeys=exactRawChanges(intent.expectedRaw,snapshot.raw);
      if(changedKeys.length)return reconciliationFailure("stale-state",`Local browser data changed after preview: ${changedKeys.join(", ")}. Review again before Apply.`,{changedKeys,currentRaw:snapshot.raw});

      const beforeBackupRemote=await verifyRemoteReconciliationAtApply(intent,validatedIntent.target,options.verifyRemote,"before-backup");
      if(!beforeBackupRemote.ok)return beforeBackupRemote;
      const beforeBackupCandidate=rebuiltCandidateMatchesIntent(beforeBackupRemote,validatedIntent.target,snapshot,intent);
      if(!beforeBackupCandidate.ok)return beforeBackupCandidate;

      if(typeof window.createCareerModeBackupEnvelope!=="function"||typeof window.verifyCareerModeBackupEnvelopeChecksum!=="function"||typeof window.downloadCareerModeBackupEnvelope!=="function"){
        return reconciliationFailure("backup-unavailable","Canonical Candidate A backup authority is unavailable. Nothing was applied.");
      }
      let backup;
      try{
        backup=await window.createCareerModeBackupEnvelope();
        const verified=await window.verifyCareerModeBackupEnvelopeChecksum(backup);
        if(verified!==true||!backupMatchesReviewedLibrary(backup,intent.expectedRaw))throw new Error("The canonical backup did not verify against the reviewed Save Library.");
        window.downloadCareerModeBackupEnvelope(backup);
        backupMetadata={checksum:backup.checksum,exportedAt:backup.exportedAt,runtimeRevision:backup.runtimeRevision,formatVersion:backup.formatVersion};
      }catch(error){
        return reconciliationFailure("backup-failed",`Canonical backup could not be completed before Apply: ${error&&error.message?error.message:String(error)}`);
      }

      snapshot=captureRemoteReconciliationRaw();
      if(!snapshot.ok)return {...snapshot,backup:backupMetadata};
      changedKeys=exactRawChanges(intent.expectedRaw,snapshot.raw);
      if(changedKeys.length)return reconciliationFailure("stale-state",`Local browser data changed while the canonical backup was being completed: ${changedKeys.join(", ")}. Nothing was applied.`,{changedKeys,currentRaw:snapshot.raw,backup:backupMetadata});

      const finalRemote=await verifyRemoteReconciliationAtApply(intent,validatedIntent.target,options.verifyRemote,"after-backup");
      if(!finalRemote.ok)return {...finalRemote,backup:backupMetadata};
      const afterBackupCandidate=rebuiltCandidateMatchesIntent(finalRemote,validatedIntent.target,snapshot,intent);
      if(!afterBackupCandidate.ok)return {...afterBackupCandidate,backup:backupMetadata};

      snapshot=captureRemoteReconciliationRaw();
      if(!snapshot.ok)return {...snapshot,backup:backupMetadata};
      changedKeys=exactRawChanges(intent.expectedRaw,snapshot.raw);
      if(changedKeys.length)return reconciliationFailure("stale-state",`Local browser data changed at the final Apply boundary: ${changedKeys.join(", ")}. Nothing was applied.`,{changedKeys,currentRaw:snapshot.raw,backup:backupMetadata});
      const finalCandidate=rebuiltCandidateMatchesIntent(finalRemote,validatedIntent.target,snapshot,intent);
      if(!finalCandidate.ok)return {...finalCandidate,backup:backupMetadata};
      if(typeof window.applyCareerModeRawStorageTransaction!=="function")return reconciliationFailure("transaction-unavailable","Candidate C storage transaction authority is unavailable. Nothing was applied.",{backup:backupMetadata});

      const runtime=window.CareerModeSaveLibraryRuntime;
      if(runtime&&typeof runtime.invalidateAuthority==="function"){
        runtime.invalidateAuthority();
        runtimeInvalidated=true;
      }
      const transaction=window.applyCareerModeRawStorageTransaction(intent.candidateRaw,intent.expectedRaw,{order:SAVE_LIBRARY_RESTORE_ORDER.slice(),guardRequestedBeforeEachWrite:true});
      const critical=Boolean(transaction&&transaction.status==="rollback-failed-critical");
      const reactivationError=runtimeInvalidated?await reactivateSaveLibraryAfterReconciliation(validatedIntent.target,critical):null;
      if(transaction&&transaction.ok===true){
        return {
          ok:true,
          status:transaction.status==="no-op"?"already-current":"success",
          remoteRevision:intent.remote.revision,
          remoteContentHash:intent.remote.contentHash,
          localSaveId:validatedIntent.target.saveId,
          localProfileId:validatedIntent.target.profileId,
          localManagerRole:validatedIntent.target.managerRole,
          backup:backupMetadata,
          transaction,
          errors:[],
          warnings:reactivationError?[`Local commit succeeded, but Save Library runtime reactivation requires a reload: ${reactivationError}`]:[]
        };
      }
      const stale=transaction&&transaction.failurePhase==="precondition"&&transaction.rollbackVerified!==false;
      return reconciliationFailure(
        stale?"stale-state":(transaction&&transaction.status)||"transaction-failed",
        stale?"Local browser data changed at the transaction boundary. The reviewed remote revision was not applied.":critical?"Local Apply could not verify exact recovery and the app is locked for critical recovery.":"Remote gameplay did not commit to the local Save Library.",
        {backup:backupMetadata,transaction,warnings:reactivationError?[`Save Library runtime reactivation requires a reload: ${reactivationError}`]:[]}
      );
    }catch(error){
      return reconciliationFailure("reconciliation-error",error&&error.message?error.message:String(error),backupMetadata?{backup:backupMetadata}:{});
    }finally{restoreInFlight=false;}
  }
  window.createCareerModeRestorePlan=createCareerModeRestorePlan;
  window.applyCareerModeRestore=applyCareerModeRestore;
  window.prepareCareerModeRemoteReconciliationIntent=prepareCareerModeRemoteReconciliationIntent;
  window.applyCareerModeRemoteReconciliation=applyCareerModeRemoteReconciliation;
  window.isCareerModeRestoreInFlight=()=>restoreInFlight;
})();
