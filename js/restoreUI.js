(function(){
  "use strict";
  let file=null,analysis=null,reviewedRaw=null,busy=false,observer=null,fileGeneration=0;
  let choices={active:"",legacy:"",preferences:"",legacyConflicts:{}};
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const panel=()=>document.getElementById("careerModeRestorePanel");
  const status=message=>{const n=panel()&&panel().querySelector(".careerRestoreStatus");if(n)n.textContent=message;};
  const resetChoices=()=>{choices={active:"",legacy:"",preferences:"",legacyConflicts:{}};};
  const cloneValue=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const describeActive=value=>value&&value.name?value.name:"No active Showdown in backup";

  function setRestoreControlsLocked(root,locked,{keepApplyEnabled=false}={}){
    if(!root)return;
    root.dataset.transactionBusy=locked?"true":"false";
    root.querySelectorAll("input,select,.careerRestoreReviewButton,.careerRestoreApply").forEach(control=>{
      if(root.dataset.criticalRecovery==="true"){control.disabled=true;return;}
      if(!locked&&control.classList.contains("careerRestoreApply")&&keepApplyEnabled){control.disabled=false;return;}
      control.disabled=Boolean(locked);
    });
    const reviewButton=root.querySelector(".careerRestoreReviewButton");
    if(!locked&&reviewButton)reviewButton.disabled=!file;
  }

  function captureReviewedRaw(){
    if(typeof window.captureCareerModeRawRestoreSnapshot!=="function")return null;
    const restoreSnapshot=window.captureCareerModeRawRestoreSnapshot();
    if(!restoreSnapshot||restoreSnapshot.ok!==true||!restoreSnapshot.raw)return null;
    if(typeof window.captureCareerModeRawSaveLibraryMigrationSnapshot!=="function")return restoreSnapshot;
    const librarySnapshot=window.captureCareerModeRawSaveLibraryMigrationSnapshot();
    if(!librarySnapshot||librarySnapshot.ok!==true||!librarySnapshot.raw)return null;
    if(["activeShowdown","legacyShowdowns","preferences"].some(name=>restoreSnapshot.raw[name]!==librarySnapshot.raw[name]))return null;
    return {ok:true,raw:{...restoreSnapshot.raw,saveLibrary:librarySnapshot.raw.saveLibrary},failedKeys:[]};
  }

  function syncCandidateBStatusCopy(){
    const target=document.querySelector("#legacyImportAnalysis .legacyImportStatus");
    if(!target)return;
    if(/Restore is intentionally unavailable in Candidate B\.?/i.test(target.textContent||"")){
      target.textContent="Analysis is read-only. Use Atomic Restore & Recovery below when you are ready to choose and apply a restore plan.";
    }else if(/Candidate C restore remains unavailable\.?/i.test(target.textContent||"")){
      target.textContent="Preview complete. No browser data was changed. Use Atomic Restore & Recovery below when you are ready to choose and apply a restore plan.";
    }
  }

  function selectControl(key,label,options){
    const wrap=make("label","careerRestoreChoiceGroup");
    wrap.appendChild(make("span","careerRestoreLabel",label));
    const select=make("select","careerRestoreSelect");
    select.name=`restore-${key}`;
    select.appendChild(new Option("Choose…",""));
    options.forEach(([value,text])=>select.appendChild(new Option(text,value)));
    select.value=choices[key]||"";
    select.addEventListener("change",()=>{
      if(busy)return;
      choices[key]=select.value;
      if(key==="legacy"&&select.value!=="merge")choices.legacyConflicts={};
      refreshPlan();
    });
    wrap.appendChild(select);
    return wrap;
  }

  function snapshotCards(){
    const payload=analysis.migratedPayload||{};
    const grid=make("div","careerRestoreSnapshot");
    const active=make("article");
    active.append(make("span","","BACKUP ACTIVE"),make("strong","",describeActive(payload.activeShowdown)),make("small","",payload.activeShowdown?`ID ${String(payload.activeShowdown.id)}`:"Backup active slot is empty"));
    const legacy=make("article");
    const count=Array.isArray(payload.legacyShowdowns)?payload.legacyShowdowns.length:0;
    legacy.append(make("span","","BACKUP LEGACY"),make("strong","",`${count} record${count===1?"":"s"}`),make("small","","Merge preserves local-only history; replace matches the backup archive."));
    const prefs=make("article");
    prefs.append(make("span","","BACKUP PREFERENCES"),make("strong","",payload.preferences?"Available":"Empty"),make("small","",payload.preferences?`${payload.preferences.reducedMotion?"Reduced motion on":"System motion"} · ${payload.preferences.menuFeedback===false?"Menu feedback off":"Menu feedback on"}`:"Backup has no saved preferences"));
    grid.append(active,legacy,prefs);return grid;
  }

  function renderConflicts(host,conflicts){
    host.replaceChildren();
    if(!conflicts||!conflicts.length)return;
    const box=make("div","careerRestoreConflicts");
    box.appendChild(make("strong","","LEGACY CONFLICT CHOICES REQUIRED"));
    conflicts.forEach(conflict=>{
      const card=make("section","careerRestoreConflict");
      const local=conflict.local&&conflict.local[0];
      card.append(make("h5","",`Showdown ID ${String(conflict.id)}`),make("p","",`Local: ${describeActive(local)} · Backup: ${describeActive(conflict.backup)}`));
      const select=make("select","careerRestoreSelect");
      select.append(new Option("Choose conflict result…",""),new Option("Keep local record","keep-local"),new Option("Use backup record","use-backup"));
      select.value=choices.legacyConflicts[String(conflict.id)]||"";
      select.addEventListener("change",()=>{if(busy)return;choices.legacyConflicts[String(conflict.id)]=select.value;refreshPlan();});
      card.appendChild(select);box.appendChild(card);
    });
    host.appendChild(box);
  }

  function refreshPlan(){
    const root=panel();if(!root||root.dataset.criticalRecovery==="true"||!analysis||!analysis.ok)return null;
    const planHost=root.querySelector(".careerRestorePlanHost"),conflictHost=root.querySelector(".careerRestoreConflictHost"),recoveryHost=root.querySelector(".careerRestoreRecoveryHost"),apply=root.querySelector(".careerRestoreApply");
    const snapshot=captureReviewedRaw();
    if(!snapshot||snapshot.ok!==true){
      if(planHost){planHost.replaceChildren();const box=make("div","careerRestorePlan blocked");box.append(make("strong","","EXACT STORAGE SNAPSHOT UNAVAILABLE"),make("span","","Browser storage could not be read without ambiguity. Nothing can be applied until a complete exact snapshot succeeds."));planHost.appendChild(box);}
      if(conflictHost)conflictHost.replaceChildren();
      if(recoveryHost)recoveryHost.replaceChildren();
      if(apply)apply.disabled=true;
      return null;
    }
    const plan=window.createCareerModeRestorePlan(analysis,snapshot.raw,choices);
    planHost.replaceChildren();
    const box=make("div",`careerRestorePlan ${plan.ok?"ready":"blocked"}`);
    box.appendChild(make("strong","",plan.ok?"RESTORE PLAN READY":"RESTORE PLAN INCOMPLETE"));
    if(plan.ok){
      const s=plan.summary,parts=[s.active==="use-backup"?"active matches backup":"active stays local",s.legacy==="merge"?`Legacy merge adds ${s.legacyAdded.length} and replaces ${s.legacyReplaced.length}`:s.legacy==="replace-with-backup"?"Legacy matches backup":"Legacy stays local",s.preferences==="use-backup"?"preferences match backup":"preferences stay local"];
      if(!Object.keys(plan.candidateRaw).length)parts.push("no storage rewrite currently required");
      box.appendChild(make("span","",`${parts.join(" · ")}.`));
    }else (plan.errors||[]).slice(0,6).forEach(message=>box.appendChild(make("span","",message)));
    planHost.appendChild(box);
    renderConflicts(conflictHost,plan.conflicts||[]);
    recoveryHost.replaceChildren();
    if(plan.ok&&(choices.active==="use-backup"||choices.legacy==="replace-with-backup"||choices.preferences==="use-backup"||(plan.warnings||[]).length)){
      const recovery=make("div","careerRestoreRecovery");
      recovery.append(make("strong","","RECOVERY CHECKPOINT"),make("span","","Use Export Backup above first if you want an extra copy of the current browser data before applying replacement choices."));
      (plan.warnings||[]).forEach(message=>recovery.appendChild(make("span","",message)));
      recoveryHost.appendChild(recovery);
    }
    apply.disabled=!plan.ok||busy;return plan;
  }

  function renderReview(){
    const root=panel();if(!root)return;
    const host=root.querySelector(".careerRestoreReview");host.replaceChildren();
    if(!analysis)return;
    if(!analysis.ok){
      const box=make("div","careerRestorePlan blocked");box.appendChild(make("strong","","BACKUP BLOCKED"));
      (analysis.errors||["Backup analysis failed."]).slice(0,8).forEach(message=>box.appendChild(make("span","",message)));host.appendChild(box);return;
    }
    host.appendChild(snapshotCards());
    const controls=make("div","careerRestoreChoices");
    controls.append(
      selectControl("active","ACTIVE SHOWDOWN",[["keep-current","Keep current active state"],["use-backup",analysis.migratedPayload.activeShowdown?"Use backup active Showdown":"Match backup: remove current active Showdown"]]),
      selectControl("legacy","LEGACY HISTORY",[["keep-current","Keep current Legacy only"],["merge","Merge backup into current Legacy"],["replace-with-backup","Replace current Legacy with backup"]]),
      selectControl("preferences","PREFERENCES",[["keep-current","Keep current preferences"],["use-backup",analysis.migratedPayload.preferences?"Use backup preferences":"Match backup: remove saved preferences"]])
    );
    const apply=make("button","compactButton primaryDataButton careerRestoreApply","APPLY RESTORE");apply.type="button";apply.disabled=true;apply.addEventListener("click",applyRestore);
    const actions=make("div","careerRestoreActions");actions.appendChild(apply);
    host.append(controls,make("div","careerRestorePlanHost"),make("div","careerRestoreConflictHost"),make("div","careerRestoreRecoveryHost"),actions);
    refreshPlan();
  }

  async function review(){
    if(busy||!file)return;
    const root=panel(),button=root&&root.querySelector(".careerRestoreReviewButton"),reviewFile=file,reviewGeneration=fileGeneration;
    busy=true;setRestoreControlsLocked(root,true);if(button)button.textContent="VERIFYING…";status("Verifying checksum, schemas, migrations and an exact current-state snapshot in memory. Nothing is being changed.");
    try{
      const nextAnalysis=await window.analyzeCareerModeBackupFile(reviewFile);
      if(reviewGeneration!==fileGeneration||reviewFile!==file){status("The selected restore file changed while verification was running. The stale review was discarded. Review the currently selected file again.");return;}
      const snapshot=nextAnalysis&&nextAnalysis.ok?captureReviewedRaw():null;
      analysis=nextAnalysis;
      reviewedRaw=snapshot&&snapshot.ok?cloneValue(snapshot.raw):null;
      resetChoices();renderReview();
      if(nextAnalysis.ok&&reviewedRaw)status("Backup verified against an exact browser-state snapshot. Choose how each data area should be resolved.");
      else if(nextAnalysis.ok)status("Backup verified, but exact browser storage could not be snapshotted safely. Nothing can be applied until Review succeeds with a complete snapshot.");
      else status("Backup cannot be restored because verification found blocking problems.");
    }catch(error){analysis=null;reviewedRaw=null;renderReview();status(`Restore review failed safely: ${error&&error.message?error.message:String(error)}`);}
    finally{busy=false;if(button)button.textContent="REVIEW RESTORE";setRestoreControlsLocked(root,false);if(analysis&&analysis.ok)refreshPlan();}
  }

  async function afterSuccess(result){
    const affected=result.transaction&&Array.isArray(result.transaction.affectedKeys)?result.transaction.affectedKeys:[];
    if((affected.includes("activeShowdown")||affected.includes("saveLibrary"))&&typeof loadSavedShowdown==="function"&&typeof currentShowdown!=="undefined")currentShowdown=loadSavedShowdown();
    if(typeof window.resetNavigationState==="function")window.resetNavigationState();
    if(typeof window.refreshMainMenuExperience==="function")window.refreshMainMenuExperience();
    if(typeof window.showAppNotice==="function")window.showAppNotice("Backup restore completed and verified successfully.","success",6000);
    const route=typeof window.resolveCanonicalShowdownRoute==="function"?window.resolveCanonicalShowdownRoute():"mainMenu";
    if(typeof window.navigateTo==="function")await window.navigateTo(route,{addToHistory:false,allowCanonicalFallback:true});
  }

  function lockCriticalRecoveryState(root){
    if(!root)return;
    root.dataset.criticalRecovery="true";
    root.querySelectorAll("input,select,button").forEach(control=>{control.disabled=true;});
  }

  async function applyRestore(){
    if(busy||!file||!analysis||!reviewedRaw)return;
    const root=panel();
    if(!root||root.dataset.criticalRecovery==="true")return;
    const confirmedFile=file,confirmedGeneration=fileGeneration,confirmedChoices=cloneValue(choices),confirmedRaw=cloneValue(reviewedRaw);
    const plan=window.createCareerModeRestorePlan(analysis,confirmedRaw,confirmedChoices);
    if(!plan||!plan.ok){refreshPlan();return;}
    if(!window.confirm("Apply this exact restore plan? The selected file and browser data will be verified again before any write. Export Backup above now if you want an extra current-state recovery copy."))return;
    if(confirmedGeneration!==fileGeneration||confirmedFile!==file){status("The selected file changed before Apply could start. Nothing was written. Review the current file again.");return;}
    busy=true;setRestoreControlsLocked(root,true);const button=root.querySelector(".careerRestoreApply");if(button){button.setAttribute("aria-busy","true");button.textContent="REVALIDATING & APPLYING…";}status("Confirmed choices are locked. Revalidating the exact selected file and browser bytes before any write…");
    let preserveRecovery=false;
    let criticalRecovery=false;
    try{
      const result=await window.applyCareerModeRestore(confirmedFile,confirmedChoices,{expectedRaw:confirmedRaw});
      if(result.ok){status("Restore committed and verified. Refreshing the application from canonical state…");await afterSuccess(result);return;}
      if(result.analysis)analysis=result.analysis;
      if(result.status==="stale-state"){
        reviewedRaw=result.currentRaw||null;
        resetChoices();
        renderReview();
        status(`Current data changed after review (${(result.changedKeys||[]).join(", ")||"canonical storage"}). Nothing unverified was kept. Recheck the refreshed state and make new restore choices.`);
        return;
      }
      if(result.status==="snapshot-unavailable"){
        reviewedRaw=null;renderReview();status("Exact browser storage could not be read safely. Nothing was written. Review again after storage access is available.");return;
      }
      if(["conflict-choice-required","choice-required","choice-blocked"].includes(result.status)){renderReview();status("Current data changed or a conflict needs an explicit choice. Nothing was written. Review the refreshed plan and apply again.");return;}
      if(result.status==="analysis-blocked"){
        reviewedRaw=null;
        renderReview();
        status("Fresh verification found blocking problems. Nothing was written. Review the selected backup again before trying another restore.");
        return;
      }
      const recovery=root.querySelector(".careerRestoreRecoveryHost");if(recovery)recovery.replaceChildren();
      if(result.status==="write-failed-clean"){
        preserveRecovery=true;
        const box=make("div","careerRestoreRecovery");box.append(make("strong","","RESTORE NOT STARTED"),make("span","","The first required storage write failed before this transaction changed any canonical key. No rollback write was necessary and the previous browser bytes remain authoritative."));if(recovery)recovery.appendChild(box);status("Restore could not start writing. Existing browser data was left unchanged.");return;
      }
      if(result.status==="rolled-back"){
        preserveRecovery=true;
        const box=make("div","careerRestoreRecovery");box.append(make("strong","","RESTORE ROLLED BACK"),make("span","","A write or verification failed. Only keys this transaction had actually changed were rolled back, in reverse order, and every owned rollback was verified byte-for-byte."));if(recovery)recovery.appendChild(box);status("Restore failed safely and transaction-owned browser changes were verified restored.");return;
      }
      if(result.status==="rollback-failed-critical"){
        preserveRecovery=true;
        criticalRecovery=true;
        const ownership=result.transaction&&Array.isArray(result.transaction.rollbackOwnershipConflicts)&&result.transaction.rollbackOwnershipConflicts.length?` Ownership changed for: ${result.transaction.rollbackOwnershipConflicts.join(", ")}.`:"";
        const box=make("div","careerRestoreRecovery critical");box.append(make("strong","","CRITICAL RECOVERY STATE"),make("span","",`Rollback could not be proven byte-for-byte. Candidate C refused to overwrite bytes it could no longer prove it owned.${ownership} Do not continue changing this save. Export the current recovery state above, then refresh before deciding what to restore next.`));if(recovery)recovery.appendChild(box);status("Critical recovery state: canonical bytes are uncertain and restore controls are locked until refresh.");lockCriticalRecoveryState(root);return;
      }
      renderReview();
      status(`Restore verification was blocked before a verified commit. ${(result.errors&&result.errors[0])||"Review the restore state before trying again."}`);
    }catch(error){status(`Restore failed safely: ${error&&error.message?error.message:String(error)}`);}
    finally{
      busy=false;
      if(root&&root.dataset.criticalRecovery!=="true")setRestoreControlsLocked(root,false,{keepApplyEnabled:preserveRecovery});
      if(button&&document.contains(button)){
        button.removeAttribute("aria-busy");
        button.textContent="APPLY RESTORE";
        if(criticalRecovery)button.disabled=true;
        else if(preserveRecovery)button.disabled=false;
        else refreshPlan();
      }
    }
  }

  function mountCareerModeRestorePanel(){
    const controls=document.querySelector("#legacy .legacyDataControls");if(!controls||controls.querySelector("#careerModeRestorePanel")){syncCandidateBStatusCopy();return false;}
    const root=make("section","careerRestorePanel");root.id="careerModeRestorePanel";
    root.append(make("span","careerRestoreEyebrow","CANDIDATE C · VERIFIED APPLY"),make("h4","","ATOMIC RESTORE & RECOVERY"),make("p","careerRestoreIntro","Choose a backup to review restore choices. Apply locks the exact confirmed file and choices, revalidates browser state, snapshots exact raw bytes, verifies the complete commit and rolls back only transaction-owned mutations if any write or verification fails."));
    const picker=make("div","careerRestorePicker"),input=document.createElement("input"),reviewButton=make("button","compactButton careerRestoreReviewButton","REVIEW RESTORE");
    input.type="file";input.accept=".json,application/json";input.setAttribute("aria-label","Backup file for restore");reviewButton.type="button";reviewButton.disabled=!file;
    input.addEventListener("change",()=>{
      if(busy)return;
      fileGeneration+=1;
      file=input.files&&input.files[0]?input.files[0]:null;analysis=null;reviewedRaw=null;resetChoices();renderReview();reviewButton.disabled=!file;status(file?`${file.name||"backup.json"} selected. Review is read-only until Apply.`:"No restore file selected.");
    });
    reviewButton.addEventListener("click",review);picker.append(input,reviewButton);
    const live=make("p","careerRestoreStatus",file?`${file.name||"backup.json"} remains selected. Review again before applying.`:"No restore file selected. Export Backup above first if you want an extra recovery copy.");live.setAttribute("role","status");live.setAttribute("aria-live","polite");
    root.append(picker,live,make("div","careerRestoreReview"));controls.appendChild(root);renderReview();syncCandidateBStatusCopy();return true;
  }

  function initializeCareerModeRestoreUI(){
    mountCareerModeRestorePanel();
    if(observer||typeof MutationObserver!=="function")return;
    const legacy=document.getElementById("legacy");if(!legacy)return;
    observer=new MutationObserver(()=>{mountCareerModeRestorePanel();syncCandidateBStatusCopy();});
    observer.observe(legacy,{childList:true,subtree:true});
  }
  window.mountCareerModeRestorePanel=mountCareerModeRestorePanel;
  window.initializeCareerModeRestoreUI=initializeCareerModeRestoreUI;
})();