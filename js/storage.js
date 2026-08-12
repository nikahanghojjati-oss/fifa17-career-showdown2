const STORAGE_KEY="careerModeShowdown.activeShowdown";
const LEGACY_STORAGE_KEY="careerModeShowdown.legacyShowdowns";
const APPLICATION_PREFERENCES_KEY="careerModeShowdown.preferences";
const APPLICATION_PREFERENCES_SCHEMA_VERSION=2;
const DEFAULT_DRAFT_SAVE_DELAY=420;
let pendingCurrentSaveTimer=null;
let storageLifecycleBound=false;
let activeSavePresenceKnown=false;
let activeSavePresent=false;
let legacyCache=null;
let legacyStorageRevision=0;
let applicationPreferencesCache=null;
let motionPreferenceMediaQuery=null;
let motionPreferenceMediaBound=false;
let criticalRecoveryStorageState=false;
function reportStorageError(context,error){
  console.error(`[Career Mode Showdown] ${context}:`,error);
  if(typeof window.showAppNotice==="function") window.showAppNotice(`${context}. Your browser may not have saved the latest change.`,"error",10000);
}
function readStorageValue(key){
  try{return localStorage.getItem(key);}catch(error){reportStorageError("Unable to read local save data",error);return null;}
}
function writeStorageValue(key,value){
  try{localStorage.setItem(key,value);return true;}catch(error){reportStorageError("Unable to write local save data",error);return false;}
}
function removeStorageValue(key){
  try{localStorage.removeItem(key);return true;}catch(error){reportStorageError("Unable to remove local save data",error);return false;}
}
function captureCareerModeRawBackupInputs(){
  return {activeShowdown:readStorageValue(STORAGE_KEY),legacyShowdowns:readStorageValue(LEGACY_STORAGE_KEY),preferences:readStorageValue(APPLICATION_PREFERENCES_KEY)};
}
function captureCareerModeRawRestoreSnapshot(){
  const keys={activeShowdown:STORAGE_KEY,legacyShowdowns:LEGACY_STORAGE_KEY,preferences:APPLICATION_PREFERENCES_KEY};
  const raw={};
  const failedKeys=[];
  for(const [name,key] of Object.entries(keys)){
    try{raw[name]=localStorage.getItem(key);}catch(error){failedKeys.push(name);reportStorageError(`Unable to read ${name} for an exact restore snapshot`,error);}
  }
  return failedKeys.length?{ok:false,raw:null,failedKeys}:{ok:true,raw,failedKeys:[]};
}
function createDefaultApplicationPreferences(){return {schemaVersion:APPLICATION_PREFERENCES_SCHEMA_VERSION,reducedMotion:false,menuFeedback:true};}
function normalizeApplicationPreferences(value){
  return {schemaVersion:APPLICATION_PREFERENCES_SCHEMA_VERSION,reducedMotion:Boolean(value&&value.reducedMotion),menuFeedback:!value||value.menuFeedback!==false};
}
function loadApplicationPreferences(){
  if(applicationPreferencesCache) return {...applicationPreferencesCache};
  const raw=readStorageValue(APPLICATION_PREFERENCES_KEY);
  if(!raw){applicationPreferencesCache=createDefaultApplicationPreferences();return {...applicationPreferencesCache};}
  try{
    const parsed=JSON.parse(raw);
    if(!parsed||typeof parsed!=="object"||Array.isArray(parsed)) throw new Error("Application preferences are not a valid object.");
    applicationPreferencesCache=normalizeApplicationPreferences(parsed);
  }catch(error){reportStorageError("Unable to parse application preferences",error);applicationPreferencesCache=createDefaultApplicationPreferences();}
  return {...applicationPreferencesCache};
}
function saveApplicationPreferences(preferences){
  const normalized=normalizeApplicationPreferences(preferences);
  try{
    if(!writeStorageValue(APPLICATION_PREFERENCES_KEY,JSON.stringify(normalized))) return false;
    applicationPreferencesCache=normalized;return true;
  }catch(error){reportStorageError("Unable to serialize application preferences",error);return false;}
}
function getMotionPreferenceMediaQuery(){
  if(motionPreferenceMediaQuery) return motionPreferenceMediaQuery;
  if(typeof window.matchMedia!=="function") return null;
  motionPreferenceMediaQuery=window.matchMedia("(prefers-reduced-motion: reduce)");return motionPreferenceMediaQuery;
}
function isSystemReducedMotionPreferred(){const query=getMotionPreferenceMediaQuery();return Boolean(query&&query.matches);}
function isReducedMotionPreferred(){const preferences=loadApplicationPreferences();return Boolean(preferences.reducedMotion||isSystemReducedMotionPreferred());}
function getApplicationMotionPreferenceState(){
  const preferences=loadApplicationPreferences(),systemReduced=isSystemReducedMotionPreferred();
  return {reducedMotionOverride:Boolean(preferences.reducedMotion),systemReduced,effectiveReduced:Boolean(preferences.reducedMotion||systemReduced)};
}
function applyApplicationMotionPreference(){
  const root=document.documentElement;
  if(!root) return getApplicationMotionPreferenceState();
  const state=getApplicationMotionPreferenceState();
  root.dataset.motionPreference=state.reducedMotionOverride?"reduced":"system";
  root.dataset.motionReduced=state.effectiveReduced?"true":"false";return state;
}
function notifyApplicationPreferencesChanged(source="application"){
  if(typeof window.CustomEvent!=="function") return;
  window.dispatchEvent(new CustomEvent("career-mode-preferences-change",{detail:{source,preferences:loadApplicationPreferences(),motion:getApplicationMotionPreferenceState()}}));
}
function setApplicationReducedMotionPreference(enabled){
  const current=loadApplicationPreferences(),nextValue=Boolean(enabled);
  if(current.reducedMotion===nextValue){applyApplicationMotionPreference();return true;}
  if(!saveApplicationPreferences({...current,reducedMotion:nextValue})) return false;
  applyApplicationMotionPreference();notifyApplicationPreferencesChanged("user");return true;
}
function isMenuFeedbackEnabled(){return loadApplicationPreferences().menuFeedback!==false;}
function setApplicationMenuFeedbackPreference(enabled){
  const current=loadApplicationPreferences(),nextValue=Boolean(enabled);
  if(current.menuFeedback===nextValue) return true;
  if(!saveApplicationPreferences({...current,menuFeedback:nextValue})) return false;
  notifyApplicationPreferencesChanged("menu-feedback");return true;
}
function initializeMotionPreferenceLifecycle(){
  applyApplicationMotionPreference();if(motionPreferenceMediaBound) return;
  const query=getMotionPreferenceMediaQuery();if(!query) return;
  const handleChange=()=>{applyApplicationMotionPreference();notifyApplicationPreferencesChanged("system");};
  if(typeof query.addEventListener==="function") query.addEventListener("change",handleChange);else if(typeof query.addListener==="function") query.addListener(handleChange);
  motionPreferenceMediaBound=true;
}
function normalizeBeforeStorage(showdown){if(!showdown)return null;return typeof normalizeShowdown==="function"?normalizeShowdown(showdown):showdown;}
function cancelScheduledCurrentShowdownSave(){if(pendingCurrentSaveTimer){window.clearTimeout(pendingCurrentSaveTimer);pendingCurrentSaveTimer=null;}}
function invalidateActiveSavePresence(){activeSavePresenceKnown=false;activeSavePresent=false;}
function saveCurrentShowdown(){
  if(!currentShowdown)return false;cancelScheduledCurrentShowdownSave();
  const previousUpdatedAt=currentShowdown.updatedAt||null;
  try{
    currentShowdown.updatedAt=new Date().toISOString();
    if(!writeStorageValue(STORAGE_KEY,JSON.stringify(currentShowdown))){currentShowdown.updatedAt=previousUpdatedAt;return false;}
    activeSavePresenceKnown=true;activeSavePresent=true;return true;
  }catch(error){currentShowdown.updatedAt=previousUpdatedAt;reportStorageError("Unable to serialize the active showdown",error);return false;}
}
function scheduleCurrentShowdownSave(delay=DEFAULT_DRAFT_SAVE_DELAY){
  if(!currentShowdown)return false;cancelScheduledCurrentShowdownSave();
  pendingCurrentSaveTimer=window.setTimeout(()=>{pendingCurrentSaveTimer=null;saveCurrentShowdown();},Math.max(0,Number(delay)||0));return true;
}
function flushScheduledCurrentShowdownSave(){if(!pendingCurrentSaveTimer)return true;cancelScheduledCurrentShowdownSave();return saveCurrentShowdown();}
function flushPendingApplicationWrites(){
  const transferFlushed=typeof window.flushTransferDraftSave==="function"?window.flushTransferDraftSave():true;
  return transferFlushed!==false&&flushScheduledCurrentShowdownSave()!==false;
}
function initializeStorageLifecycle(){
  if(storageLifecycleBound)return;storageLifecycleBound=true;initializeMotionPreferenceLifecycle();
  window.addEventListener("pagehide",flushPendingApplicationWrites);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flushPendingApplicationWrites();});
  window.addEventListener("storage",event=>{
    if(event.key===STORAGE_KEY)invalidateActiveSavePresence();
    if(event.key===LEGACY_STORAGE_KEY)invalidateLegacyCache();
    if(event.key===APPLICATION_PREFERENCES_KEY){applicationPreferencesCache=null;applyApplicationMotionPreference();notifyApplicationPreferencesChanged("storage");}
  });
}
function loadSavedShowdown(){
  const raw=readStorageValue(STORAGE_KEY);
  if(!raw){activeSavePresenceKnown=true;activeSavePresent=false;return null;}
  try{
    const parsed=JSON.parse(raw);
    if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("Active save data is not a valid showdown object.");
    activeSavePresenceKnown=true;activeSavePresent=true;return parsed;
  }catch(error){invalidateActiveSavePresence();reportStorageError("Unable to parse the active showdown",error);return null;}
}
function clearSavedShowdown(){
  cancelScheduledCurrentShowdownSave();const removed=removeStorageValue(STORAGE_KEY);
  if(removed){activeSavePresenceKnown=true;activeSavePresent=false;}return removed;
}
function hasStoredActiveShowdownData(){return readStorageValue(STORAGE_KEY)!==null;}
function hasSavedShowdown(){
  if(activeSavePresenceKnown)return activeSavePresent;
  const raw=readStorageValue(STORAGE_KEY);
  if(!raw){activeSavePresenceKnown=true;activeSavePresent=false;return false;}
  try{
    const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("Active save data is not a valid showdown object.");
    activeSavePresenceKnown=true;activeSavePresent=true;
  }catch{activeSavePresenceKnown=true;activeSavePresent=false;}
  return activeSavePresent;
}
function invalidateLegacyCache(){legacyCache=null;legacyStorageRevision+=1;}
function getLegacyStorageRevision(){return legacyStorageRevision;}
function loadLegacyShowdowns(){
  if(legacyCache)return legacyCache.slice();
  const raw=readStorageValue(LEGACY_STORAGE_KEY);if(!raw){legacyCache=[];return [];}
  try{
    const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw new Error("Legacy history is not a valid array.");
    if(parsed.some(item=>!item||typeof item!=="object"||Array.isArray(item)))throw new Error("Legacy history contains an invalid record shape.");
    legacyCache=parsed.slice();return legacyCache.slice();
  }catch(error){reportStorageError("Unable to parse Legacy history",error);legacyCache=[];return [];}
}
function saveLegacyShowdowns(showdowns){
  const safeShowdowns=Array.isArray(showdowns)?showdowns:[];
  try{
    if(!writeStorageValue(LEGACY_STORAGE_KEY,JSON.stringify(safeShowdowns)))return false;
    legacyCache=safeShowdowns.slice();legacyStorageRevision+=1;return true;
  }catch(error){reportStorageError("Unable to serialize Legacy history",error);return false;}
}
function cloneForStorage(value){
  if(typeof structuredClone==="function"){try{return structuredClone(value);}catch(error){}}
  return JSON.parse(JSON.stringify(value));
}
function archiveShowdown(showdown){
  if(!showdown||showdown.status!=="Completed")return false;
  try{
    const history=loadLegacyShowdowns(),existingIndex=history.findIndex(item=>String(item.id)===String(showdown.id));
    if(existingIndex>=0){
      const existing=history[existingIndex],sameRevision=String(existing.updatedAt||"")===String(showdown.updatedAt||"")&&String(existing.completedAt||"")===String(showdown.completedAt||"");
      if(sameRevision)return true;
    }
    let snapshot=normalizeBeforeStorage(cloneForStorage(showdown));snapshot.archivedAt=snapshot.archivedAt||new Date().toISOString();
    if(existingIndex>=0){snapshot.archivedAt=history[existingIndex].archivedAt||snapshot.archivedAt;history[existingIndex]=snapshot;}else history.unshift(snapshot);
    return saveLegacyShowdowns(history);
  }catch(error){reportStorageError("Unable to archive the completed showdown",error);return false;}
}
function deleteLegacyShowdown(showdownId){
  const history=loadLegacyShowdowns(),nextHistory=history.filter(item=>String(item.id)!==String(showdownId));
  if(nextHistory.length===history.length)return false;return saveLegacyShowdowns(nextHistory);
}
function clearLegacyHistory(){const removed=removeStorageValue(LEGACY_STORAGE_KEY);if(removed){invalidateLegacyCache();legacyCache=[];}return removed;}
function restoreStorageSnapshot(key,value){return value===null?removeStorageValue(key):writeStorageValue(key,value);}
function invalidateRuntimeAfterCriticalRecovery(){
  criticalRecoveryStorageState=true;
  invalidateActiveSavePresence();
  invalidateLegacyCache();
  applicationPreferencesCache=null;
  if(typeof currentShowdown!=="undefined")currentShowdown=null;
}
function applyCareerModeRawStorageTransaction(plan,expectedRaw=null){
  if(typeof window.runCareerModeRawStorageTransaction!=="function")return {ok:false,status:"engine-unavailable"};
  const keys={activeShowdown:STORAGE_KEY,legacyShowdowns:LEGACY_STORAGE_KEY,preferences:APPLICATION_PREFERENCES_KEY};
  const result=window.runCareerModeRawStorageTransaction(plan,{
    read(name,phase){try{return {ok:true,value:localStorage.getItem(keys[name])};}catch(error){reportStorageError(`Unable to ${phase} ${name} during restore`,error);return {ok:false};}},
    write(name,value){return restoreStorageSnapshot(keys[name],value);}
  },expectedRaw);
  if(result.ok&&(result.status==="success"||result.status==="no-op")){
    criticalRecoveryStorageState=false;
    if(result.affectedKeys.includes("activeShowdown")){activeSavePresenceKnown=true;activeSavePresent=plan.activeShowdown!==null;}
    if(result.affectedKeys.includes("legacyShowdowns"))invalidateLegacyCache();
    if(result.affectedKeys.includes("preferences")){applicationPreferencesCache=null;applyApplicationMotionPreference();notifyApplicationPreferencesChanged("restore");}
  }else if(result.status==="rollback-failed-critical"){
    invalidateRuntimeAfterCriticalRecovery();
  }
  return result;
}
function clearAllCareerModeData(){
  cancelScheduledCurrentShowdownSave();const activeSnapshot=readStorageValue(STORAGE_KEY),legacySnapshot=readStorageValue(LEGACY_STORAGE_KEY);
  if(!removeStorageValue(STORAGE_KEY))return false;
  if(!removeStorageValue(LEGACY_STORAGE_KEY)){
    const activeRestored=restoreStorageSnapshot(STORAGE_KEY,activeSnapshot);activeSavePresenceKnown=activeRestored;activeSavePresent=activeRestored&&activeSnapshot!==null;
    if(!activeRestored)invalidateActiveSavePresence();return false;
  }
  activeSavePresenceKnown=true;activeSavePresent=false;invalidateLegacyCache();legacyCache=[];void legacySnapshot;return true;
}
window.captureCareerModeRawBackupInputs=captureCareerModeRawBackupInputs;
window.captureCareerModeRawRestoreSnapshot=captureCareerModeRawRestoreSnapshot;
window.getCareerModeStorageKeys=()=>({activeShowdown:STORAGE_KEY,legacyShowdowns:LEGACY_STORAGE_KEY,preferences:APPLICATION_PREFERENCES_KEY});
window.initializeStorageLifecycle=initializeStorageLifecycle;
window.scheduleCurrentShowdownSave=scheduleCurrentShowdownSave;
window.flushScheduledCurrentShowdownSave=flushScheduledCurrentShowdownSave;
window.flushPendingApplicationWrites=flushPendingApplicationWrites;
window.applyCareerModeRawStorageTransaction=applyCareerModeRawStorageTransaction;
window.isCareerModeCriticalRecoveryLocked=()=>criticalRecoveryStorageState;
window.getLegacyStorageRevision=getLegacyStorageRevision;
window.loadApplicationPreferences=loadApplicationPreferences;
window.getApplicationMotionPreferenceState=getApplicationMotionPreferenceState;
window.setApplicationReducedMotionPreference=setApplicationReducedMotionPreference;
window.isMenuFeedbackEnabled=isMenuFeedbackEnabled;
window.setApplicationMenuFeedbackPreference=setApplicationMenuFeedbackPreference;
window.isSystemReducedMotionPreferred=isSystemReducedMotionPreferred;
window.isReducedMotionPreferred=isReducedMotionPreferred;
window.applyApplicationMotionPreference=applyApplicationMotionPreference;