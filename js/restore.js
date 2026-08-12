(function(){
  let restoreInFlight=false;
  const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  function canonical(value){
    if(value===null||typeof value!=="object")return JSON.stringify(value);
    if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  function clone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
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
      result.forEach((record,index)=>{if(String(record&&record.id??"")===id)matches.push(index);});
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
    if(activeChoice==="use-backup")candidateRaw.activeShowdown=payload.activeShowdown===null?null:JSON.stringify(payload.activeShowdown);
    if(preferencesChoice==="use-backup")candidateRaw.preferences=payload.preferences===null?null:JSON.stringify(payload.preferences);

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
      }else{
        const merged=mergeLegacy(localLegacy.value,backupLegacy,choices.legacyConflicts||{});
        conflicts=merged.conflicts;
        if(!merged.ok)errors.push(...merged.errors);
        else{
          candidateRaw.legacyShowdowns=JSON.stringify(merged.records);
          summary.legacyAdded=merged.added;
          summary.legacySkipped=merged.skipped;
          summary.legacyReplaced=merged.replaced;
        }
      }
    }

    if(errors.length)return {ok:false,status:conflicts.length?"conflict-choice-required":"choice-blocked",errors,warnings,candidateRaw:{},summary,conflicts};
    return {ok:true,status:"ready",errors,warnings,candidateRaw,summary,conflicts:[]};
  }
  async function applyCareerModeRestore(file,choices={}){
    if(restoreInFlight)return {ok:false,status:"busy",errors:["A restore transaction is already in progress."]};
    restoreInFlight=true;
    try{
      if(typeof window.flushPendingApplicationWrites!=="function"||window.flushPendingApplicationWrites()===false){
        return {ok:false,status:"flush-failed",errors:["Pending application writes could not be flushed safely."]};
      }
      if(typeof window.analyzeCareerModeBackupFile!=="function")return {ok:false,status:"analysis-unavailable",errors:["Candidate B analysis authority is unavailable."]};
      const analysis=await window.analyzeCareerModeBackupFile(file);
      if(!analysis||analysis.ok!==true)return {ok:false,status:"analysis-blocked",analysis,errors:(analysis&&analysis.errors)||["Fresh backup analysis was blocked."]};
      if(typeof window.captureCareerModeRawBackupInputs!=="function")return {ok:false,status:"snapshot-unavailable",analysis,errors:["Storage snapshot authority is unavailable."]};
      const currentRaw=window.captureCareerModeRawBackupInputs();
      const plan=createCareerModeRestorePlan(analysis,currentRaw,choices);
      if(!plan.ok)return {ok:false,status:plan.status,analysis,plan,errors:plan.errors,warnings:plan.warnings};
      if(typeof window.applyCareerModeRawStorageTransaction!=="function")return {ok:false,status:"transaction-unavailable",analysis,plan,errors:["Storage transaction authority is unavailable."]};
      const transaction=window.applyCareerModeRawStorageTransaction(plan.candidateRaw);
      return {
        ok:Boolean(transaction&&transaction.ok),
        status:transaction&&transaction.ok?"success":(transaction&&transaction.status)||"transaction-failed",
        analysis,plan,transaction,
        errors:transaction&&transaction.ok?[]:["Restore did not commit successfully."],
        warnings:plan.warnings
      };
    }catch(error){
      return {ok:false,status:"restore-error",errors:[error&&error.message?error.message:String(error)]};
    }finally{restoreInFlight=false;}
  }
  window.createCareerModeRestorePlan=createCareerModeRestorePlan;
  window.applyCareerModeRestore=applyCareerModeRestore;
  window.isCareerModeRestoreInFlight=()=>restoreInFlight;
})();
