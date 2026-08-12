(function(){
  "use strict";
  let file=null,analysis=null,busy=false,observer=null;
  let choices={active:"",legacy:"",preferences:"",legacyConflicts:{}};
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const panel=()=>document.getElementById("careerModeRestorePanel");
  const status=message=>{const n=panel()&&panel().querySelector(".careerRestoreStatus");if(n)n.textContent=message;};
  const resetChoices=()=>{choices={active:"",legacy:"",preferences:"",legacyConflicts:{}};};
  const describeActive=value=>value&&value.name?value.name:"No active Showdown in backup";

  function selectControl(key,label,options){
    const wrap=make("label","careerRestoreChoiceGroup");
    wrap.appendChild(make("span","careerRestoreLabel",label));
    const select=make("select","careerRestoreSelect");
    select.name=`restore-${key}`;
    select.appendChild(new Option("Choose…",""));
    options.forEach(([value,text])=>select.appendChild(new Option(text,value)));
    select.value=choices[key]||"";
    select.addEventListener("change",()=>{
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
      select.addEventListener("change",()=>{choices.legacyConflicts[String(conflict.id)]=select.value;refreshPlan();});
      card.appendChild(select);box.appendChild(card);
    });
    host.appendChild(box);
  }

  function refreshPlan(){
    const root=panel();if(!root||!analysis||!analysis.ok)return null;
    const planHost=root.querySelector(".careerRestorePlanHost"),conflictHost=root.querySelector(".careerRestoreConflictHost"),recoveryHost=root.querySelector(".careerRestoreRecoveryHost"),apply=root.querySelector(".careerRestoreApply");
    const raw=typeof window.captureCareerModeRawBackupInputs==="function"?window.captureCareerModeRawBackupInputs():null;
    const plan=window.createCareerModeRestorePlan(analysis,raw,choices);
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
    if(busy||!file)return;busy=true;const button=panel().querySelector(".careerRestoreReviewButton");button.disabled=true;button.textContent="VERIFYING…";status("Verifying checksum, schemas, migrations and current-state comparison in memory. Nothing is being changed.");
    try{analysis=await window.analyzeCareerModeBackupFile(file);resetChoices();renderReview();status(analysis.ok?"Backup verified. Choose how each data area should be resolved.":"Backup cannot be restored because verification found blocking problems.");}
    catch(error){analysis=null;renderReview();status(`Restore review failed safely: ${error&&error.message?error.message:String(error)}`);}
    finally{busy=false;button.textContent="REVIEW RESTORE";button.disabled=!file;}
  }

  async function afterSuccess(result){
    const affected=result.transaction&&Array.isArray(result.transaction.affectedKeys)?result.transaction.affectedKeys:[];
    if(affected.includes("activeShowdown")&&typeof loadSavedShowdown==="function"&&typeof currentShowdown!=="undefined")currentShowdown=loadSavedShowdown();
    if(typeof window.resetNavigationState==="function")window.resetNavigationState();
    if(typeof window.refreshMainMenuExperience==="function")window.refreshMainMenuExperience();
    if(typeof window.showAppNotice==="function")window.showAppNotice("Backup restore completed and verified successfully.","success",6000);
    const route=typeof window.resolveCanonicalShowdownRoute==="function"?window.resolveCanonicalShowdownRoute():"mainMenu";
    if(typeof window.navigateTo==="function")await window.navigateTo(route,{addToHistory:false,allowCanonicalFallback:true});
  }

  async function applyRestore(){
    if(busy||!file||!analysis)return;const plan=refreshPlan();if(!plan||!plan.ok)return;
    if(!window.confirm("Apply this restore plan? The backup and current state will be verified again first. Export Backup above now if you want an extra current-state recovery copy."))return;
    busy=true;const button=panel().querySelector(".careerRestoreApply");button.disabled=true;button.setAttribute("aria-busy","true");button.textContent="REVALIDATING & APPLYING…";status("Freshly revalidating the file and current state before the atomic transaction…");
    try{
      const result=await window.applyCareerModeRestore(file,choices);
      if(result.ok){status("Restore committed and verified. Refreshing the application from canonical state…");await afterSuccess(result);return;}
      if(result.analysis)analysis=result.analysis;
      if(["conflict-choice-required","choice-required","choice-blocked"].includes(result.status)){renderReview();status("Current data changed or a conflict needs an explicit choice. Nothing was written. Review the refreshed plan and apply again.");return;}
      const recovery=panel().querySelector(".careerRestoreRecoveryHost");if(recovery)recovery.replaceChildren();
      if(result.status==="rolled-back"){
        const box=make("div","careerRestoreRecovery");box.append(make("strong","","RESTORE ROLLED BACK"),make("span","","A write or verification failed. Every affected key was restored and rollback was verified byte-for-byte. Nothing from this restore was kept."));if(recovery)recovery.appendChild(box);status("Restore failed safely and previous browser data was verified restored.");return;
      }
      if(result.status==="rollback-failed-critical"){
        const box=make("div","careerRestoreRecovery critical");box.append(make("strong","","CRITICAL RECOVERY STATE"),make("span","","Rollback could not be proven byte-for-byte. Do not continue changing this save. Export the current recovery state, then refresh before deciding what to restore next."));if(recovery)recovery.appendChild(box);status("Critical recovery state: no navigation was performed.");return;
      }
      renderReview();status((result.errors&&result.errors[0])||"Restore was blocked safely before a verified commit.");
    }catch(error){status(`Restore failed safely: ${error&&error.message?error.message:String(error)}`);}
    finally{busy=false;if(document.contains(button)){button.removeAttribute("aria-busy");button.textContent="APPLY RESTORE";refreshPlan();}}
  }

  function mountCareerModeRestorePanel(){
    const controls=document.querySelector("#legacy .legacyDataControls");if(!controls||controls.querySelector("#careerModeRestorePanel"))return false;
    const root=make("section","careerRestorePanel");root.id="careerModeRestorePanel";
    root.append(make("span","careerRestoreEyebrow","CANDIDATE C · VERIFIED APPLY"),make("h4","","ATOMIC RESTORE & RECOVERY"),make("p","careerRestoreIntro","Choose a backup to review restore choices. Apply revalidates the actual file and current browser state, snapshots exact raw bytes, verifies the complete commit and rolls every affected key back if any write or verification fails."));
    const picker=make("div","careerRestorePicker"),input=document.createElement("input"),reviewButton=make("button","compactButton careerRestoreReviewButton","REVIEW RESTORE");
    input.type="file";input.accept=".json,application/json";input.setAttribute("aria-label","Backup file for restore");reviewButton.type="button";reviewButton.disabled=!file;
    input.addEventListener("change",()=>{file=input.files&&input.files[0]?input.files[0]:null;analysis=null;resetChoices();renderReview();reviewButton.disabled=!file;status(file?`${file.name||"backup.json"} selected. Review is read-only until Apply.`:"No restore file selected.");});
    reviewButton.addEventListener("click",review);picker.append(input,reviewButton);
    const live=make("p","careerRestoreStatus",file?`${file.name||"backup.json"} remains selected. Review again before applying.`:"No restore file selected. Export Backup above first if you want an extra recovery copy.");live.setAttribute("role","status");live.setAttribute("aria-live","polite");
    root.append(picker,live,make("div","careerRestoreReview"));controls.appendChild(root);renderReview();return true;
  }

  function initializeCareerModeRestoreUI(){
    mountCareerModeRestorePanel();
    if(observer||typeof MutationObserver!=="function")return;
    const legacy=document.getElementById("legacy");if(!legacy)return;
    observer=new MutationObserver(()=>mountCareerModeRestorePanel());observer.observe(legacy,{childList:true,subtree:true});
  }
  window.mountCareerModeRestorePanel=mountCareerModeRestorePanel;
  window.initializeCareerModeRestoreUI=initializeCareerModeRestoreUI;
})();
