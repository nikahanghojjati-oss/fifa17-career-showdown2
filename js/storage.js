const STORAGE_KEY="careerModeShowdown.activeShowdown";
const LEGACY_STORAGE_KEY="careerModeShowdown.legacyShowdowns";
const APPLICATION_PREFERENCES_KEY="careerModeShowdown.preferences";
const SAVE_KEY="careerModeShowdown.saveLibrary";
const APPLICATION_PREFERENCES_SCHEMA_VERSION=2;
const DEFAULT_DRAFT_SAVE_DELAY=420;
let pendingCurrentSaveTimer=null;
let storageLifecycleBound=false;
let legacyCache=null;
let legacyStorageRevision=0;
let applicationPreferencesCache=null;
let motionPreferenceMediaQuery=null;
let motionPreferenceMediaBound=false;
let criticalRecoveryStorageState=false;
let saveLibraryAuthorityPromise=null;
let pendingLoadedShowdown=null;
function reportStorageError(context,error){
  console.error(`[Career Mode Showdown] ${context}:`,error);
  if(typeof window.showAppNotice==="function")window.showAppNotice(`${context}. Your browser may not have saved the latest change.`,"error",10000);
}
function readStorageValue(key){try{return localStorage.getItem(key);}catch(error){reportStorageError("Unable to read local save data",error);return null;}}
function writeStorageValue(key,value){try{localStorage.setItem(key,value);return true;}catch(error){reportStorageError("Unable to write local save data",error);return false;}}
function removeStorageValue(key){try{localStorage.removeItem(key);return true;}catch(error){reportStorageError("Unable to remove local save data",error);return false;}}
function captureCareerModeRawBackupInputs(){return {activeShowdown:readStorageValue(STORAGE_KEY),legacyShowdowns:readStorageValue(LEGACY_STORAGE_KEY),preferences:readStorageValue(APPLICATION_PREFERENCES_KEY)};}
function captureStorageSnapshot(keys){const raw={},failedKeys=[];for(const [name,key] of Object.entries(keys))try{raw[name]=localStorage.getItem(key);}catch(error){failedKeys.push(name);reportStorageError(`Unable to read ${name} for an exact raw snapshot`,error);}return failedKeys.length?{ok:false,raw:null,failedKeys}:{ok:true,raw,failedKeys:[]};}
function captureCareerModeRawRestoreSnapshot(){return captureStorageSnapshot({activeShowdown:STORAGE_KEY,legacyShowdowns:LEGACY_STORAGE_KEY,preferences:APPLICATION_PREFERENCES_KEY});}
function captureLibraryMigrationSnapshot(){return captureStorageSnapshot({saveLibrary:SAVE_KEY,activeShowdown:STORAGE_KEY,legacyShowdowns:LEGACY_STORAGE_KEY,preferences:APPLICATION_PREFERENCES_KEY});}
function createDefaultApplicationPreferences(){return {schemaVersion:APPLICATION_PREFERENCES_SCHEMA_VERSION,reducedMotion:false,menuFeedback:true};}
function normalizeApplicationPreferences(value){return {schemaVersion:APPLICATION_PREFERENCES_SCHEMA_VERSION,reducedMotion:Boolean(value&&value.reducedMotion),menuFeedback:!value||value.menuFeedback!==false};}
function loadApplicationPreferences(){
  if(applicationPreferencesCache)return {...applicationPreferencesCache};
  const raw=readStorageValue(APPLICATION_PREFERENCES_KEY);
  if(!raw){applicationPreferencesCache=createDefaultApplicationPreferences();return {...applicationPreferencesCache};}
  try{const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("Application preferences are not a valid object.");applicationPreferencesCache=normalizeApplicationPreferences(parsed);}
  catch(error){reportStorageError("Unable to parse application preferences",error);applicationPreferencesCache=createDefaultApplicationPreferences();}
  return {...applicationPreferencesCache};
}
function saveApplicationPreferences(preferences){const normalized=normalizeApplicationPreferences(preferences);try{if(!writeStorageValue(APPLICATION_PREFERENCES_KEY,JSON.stringify(normalized)))return false;applicationPreferencesCache=normalized;return true;}catch(error){reportStorageError("Unable to serialize application preferences",error);return false;}}
function getMotionPreferenceMediaQuery(){if(motionPreferenceMediaQuery)return motionPreferenceMediaQuery;if(typeof window.matchMedia!=="function")return null;motionPreferenceMediaQuery=window.matchMedia("(prefers-reduced-motion: reduce)");return motionPreferenceMediaQuery;}
function isSystemReducedMotionPreferred(){const query=getMotionPreferenceMediaQuery();return Boolean(query&&query.matches);}
function isReducedMotionPreferred(){const preferences=loadApplicationPreferences();return Boolean(preferences.reducedMotion||isSystemReducedMotionPreferred());}
function getApplicationMotionPreferenceState(){const preferences=loadApplicationPreferences(),systemReduced=isSystemReducedMotionPreferred();return {reducedMotionOverride:Boolean(preferences.reducedMotion),systemReduced,effectiveReduced:Boolean(preferences.reducedMotion||systemReduced)};}
function applyApplicationMotionPreference(){const root=document.documentElement;if(!root)return getApplicationMotionPreferenceState();const state=getApplicationMotionPreferenceState();root.dataset.motionPreference=state.reducedMotionOverride?"reduced":"system";root.dataset.motionReduced=state.effectiveReduced?"true":"false";return state;}
function notifyApplicationPreferencesChanged(source="application"){if(typeof window.CustomEvent!=="function")return;window.dispatchEvent(new CustomEvent("career-mode-preferences-change",{detail:{source,preferences:loadApplicationPreferences(),motion:getApplicationMotionPreferenceState()}}));}
function setApplicationReducedMotionPreference(enabled){const current=loadApplicationPreferences(),nextValue=Boolean(enabled);if(current.reducedMotion===nextValue){applyApplicationMotionPreference();return true;}if(!saveApplicationPreferences({...current,reducedMotion:nextValue}))return false;applyApplicationMotionPreference();notifyApplicationPreferencesChanged("user");return true;}
function isMenuFeedbackEnabled(){return loadApplicationPreferences().menuFeedback!==false;}
function setApplicationMenuFeedbackPreference(enabled){const current=loadApplicationPreferences(),nextValue=Boolean(enabled);if(current.menuFeedback===nextValue)return true;if(!saveApplicationPreferences({...current,menuFeedback:nextValue}))return false;notifyApplicationPreferencesChanged("menu-feedback");return true;}
function initializeMotionPreferenceLifecycle(){applyApplicationMotionPreference();if(motionPreferenceMediaBound)return;const query=getMotionPreferenceMediaQuery();if(!query)return;const handleChange=()=>{applyApplicationMotionPreference();notifyApplicationPreferencesChanged("system");};if(typeof query.addEventListener==="function")query.addEventListener("change",handleChange);else if(typeof query.addListener==="function")query.addListener(handleChange);motionPreferenceMediaBound=true;}
function replaceLoadedShowdown(target,source){if(!target||!source)return;for(const key of Object.keys(target))delete target[key];Object.assign(target,source);}
async function loadSaveLibraryAuthorityFiles(){
  if(typeof loadRuntimeScript!=="function")throw new Error("Optional runtime loader is unavailable.");
  await Promise.all([
    loadRuntimeScript("save-library-foundation","js/saveLibraryFoundation.js",()=>Boolean(window.CareerModeSaveLibraryFoundation)),
    loadRuntimeScript("restore-transaction","js/storageTransaction.js",()=>typeof window.runCareerModeRawStorageTransaction==="function")
  ]);
  await loadRuntimeScript("save-library-persistence","js/saveLibraryPersistence.js",()=>Boolean(window.CareerModeSaveLibraryPersistence));
  await loadRuntimeScript("save-library-runtime","js/saveLibraryRuntime.js",()=>Boolean(window.CareerModeSaveLibraryRuntime));
}
function ensureSaveLibraryRuntimeAuthority(){
  if(window.CareerModeSaveLibraryRuntime?.isReady())return Promise.resolve(true);
  if(saveLibraryAuthorityPromise)return saveLibraryAuthorityPromise;
  saveLibraryAuthorityPromise=(async()=>{
    await loadSaveLibraryAuthorityFiles();
    const result=await window.CareerModeSaveLibraryRuntime.activate();
    if(!result||result.ok!==true)throw new Error("Save Library runtime authority could not be activated.");
    if(pendingLoadedShowdown){const authoritative=window.CareerModeSaveLibraryRuntime.loadActiveShowdown();if(authoritative)replaceLoadedShowdown(pendingLoadedShowdown,authoritative);pendingLoadedShowdown=null;}
    return true;
  })().finally(()=>{saveLibraryAuthorityPromise=null;});
  return saveLibraryAuthorityPromise;
}
function installSaveLibraryAuthorityBoundaries(){
  const gameplay=window.ensureGameplayModules;
  if(typeof gameplay==="function"&&!gameplay.__saveLibraryAuthority){const wrapped=async()=>{await ensureSaveLibraryRuntimeAuthority();return gameplay();};wrapped.__saveLibraryAuthority=true;window.ensureGameplayModules=wrapped;}
  const optional=window.openOptionalModule;
  if(typeof optional==="function"&&!optional.__saveLibraryAuthority){const wrapped=async name=>{if(name==="legacy"||name==="settings")await ensureSaveLibraryRuntimeAuthority();return optional(name);};wrapped.__saveLibraryAuthority=true;window.openOptionalModule=wrapped;}
}
function cancelScheduledCurrentShowdownSave(){if(pendingCurrentSaveTimer){window.clearTimeout(pendingCurrentSaveTimer);pendingCurrentSaveTimer=null;}}
function saveCurrentShowdown(){cancelScheduledCurrentShowdownSave();return Boolean(window.CareerModeSaveLibraryRuntime?.isReady()&&window.CareerModeSaveLibraryRuntime.saveCurrentShowdown());}
function scheduleCurrentShowdownSave(delay=DEFAULT_DRAFT_SAVE_DELAY){if(!currentShowdown)return false;cancelScheduledCurrentShowdownSave();pendingCurrentSaveTimer=window.setTimeout(()=>{pendingCurrentSaveTimer=null;saveCurrentShowdown();},Math.max(0,Number(delay)||0));return true;}
function flushScheduledCurrentShowdownSave(){if(!pendingCurrentSaveTimer)return true;cancelScheduledCurrentShowdownSave();return saveCurrentShowdown();}
function flushPendingApplicationWrites(){const transferFlushed=typeof window.flushTransferDraftSave==="function"?window.flushTransferDraftSave():true;return transferFlushed!==false&&flushScheduledCurrentShowdownSave()!==false;}
function initializeStorageLifecycle(){
  if(storageLifecycleBound)return;storageLifecycleBound=true;initializeMotionPreferenceLifecycle();installSaveLibraryAuthorityBoundaries();
  window.addEventListener("pagehide",flushPendingApplicationWrites);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flushPendingApplicationWrites();});
  window.addEventListener("storage",event=>{if(event.key===LEGACY_STORAGE_KEY)invalidateLegacyCache();if(event.key===APPLICATION_PREFERENCES_KEY){applicationPreferencesCache=null;applyApplicationMotionPreference();notifyApplicationPreferencesChanged("storage");}});
}
function parseStoredShowdown(raw,context){try{const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("Active save data is not a valid showdown object.");return parsed;}catch(error){reportStorageError(context,error);return null;}}
function readSaveLibraryActive(){
  const raw=readStorageValue(SAVE_KEY);if(raw===null)return null;
  try{const library=JSON.parse(raw);if(!library||typeof library!=="object"||!Array.isArray(library.saves))throw new Error("Save Library is not a valid registry.");if(library.activeSaveId===null)return null;if(typeof library.activeSaveId!=="string")throw new Error("Save Library active identity is invalid.");const matches=library.saves.filter(entry=>entry&&entry.saveId===library.activeSaveId);if(matches.length!==1||!matches[0].showdown||matches[0].showdown.identity?.saveId!==matches[0].saveId)throw new Error("Save Library active entry is inconsistent.");return matches[0].showdown;}
  catch(error){reportStorageError("Unable to parse the Save Library active showdown",error);return null;}
}
function loadSavedShowdown(){const singleton=readStorageValue(STORAGE_KEY);const parsed=singleton!==null?parseStoredShowdown(singleton,"Unable to parse the active showdown"):readSaveLibraryActive();pendingLoadedShowdown=parsed;return parsed;}
function clearSavedShowdown(){cancelScheduledCurrentShowdownSave();return Boolean(window.CareerModeSaveLibraryRuntime?.isReady()&&window.CareerModeSaveLibraryRuntime.clearAllData());}
function hasStoredActiveShowdownData(){
  if(readStorageValue(STORAGE_KEY)!==null)return true;
  const raw=readStorageValue(SAVE_KEY);if(raw===null)return false;
  try{const library=JSON.parse(raw);return Boolean(library&&library.activeSaveId!==null);}catch{return true;}
}
function hasSavedShowdown(){return loadSavedShowdown()!==null;}
function invalidateLegacyCache(){legacyCache=null;legacyStorageRevision+=1;}
function getLegacyStorageRevision(){return legacyStorageRevision;}
function loadLegacyShowdowns(){if(legacyCache)return legacyCache.slice();const raw=readStorageValue(LEGACY_STORAGE_KEY);if(!raw){legacyCache=[];return [];}try{const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw new Error("Legacy history is not a valid array.");if(parsed.some(item=>!item||typeof item!=="object"||Array.isArray(item)))throw new Error("Legacy history contains an invalid record shape.");legacyCache=parsed.slice();return legacyCache.slice();}catch(error){reportStorageError("Unable to parse Legacy history",error);legacyCache=[];return [];}}
function saveLegacyShowdowns(showdowns){const safeShowdowns=Array.isArray(showdowns)?showdowns:[];try{if(!writeStorageValue(LEGACY_STORAGE_KEY,JSON.stringify(safeShowdowns)))return false;legacyCache=safeShowdowns.slice();legacyStorageRevision+=1;return true;}catch(error){reportStorageError("Unable to serialize Legacy history",error);return false;}}
function archiveShowdown(showdown){return Boolean(showdown&&showdown.status==="Completed"&&window.CareerModeSaveLibraryRuntime?.isReady()&&window.CareerModeSaveLibraryRuntime.archiveShowdown(showdown));}
function deleteLegacyShowdown(showdownId){const history=loadLegacyShowdowns(),nextHistory=history.filter(item=>String(item.id)!==String(showdownId));if(nextHistory.length===history.length)return false;return saveLegacyShowdowns(nextHistory);}
function clearLegacyHistory(){const removed=removeStorageValue(LEGACY_STORAGE_KEY);if(removed){invalidateLegacyCache();legacyCache=[];}return removed;}
function restoreStorageSnapshot(key,value){return value===null?removeStorageValue(key):writeStorageValue(key,value);}
function invalidateRuntimeAfterCriticalRecovery(){criticalRecoveryStorageState=true;invalidateLegacyCache();applicationPreferencesCache=null;pendingLoadedShowdown=null;if(typeof currentShowdown!=="undefined")currentShowdown=null;}
function applyCareerModeRawStorageTransaction(plan,expectedRaw=null){
  if(typeof window.runCareerModeRawStorageTransaction!=="function")return {ok:false,status:"engine-unavailable"};
  const keys={activeShowdown:STORAGE_KEY,legacyShowdowns:LEGACY_STORAGE_KEY,preferences:APPLICATION_PREFERENCES_KEY,saveLibrary:SAVE_KEY};
  const result=window.runCareerModeRawStorageTransaction(plan,{read(name,phase){try{return {ok:true,value:localStorage.getItem(keys[name])};}catch(error){reportStorageError(`Unable to ${phase} ${name} during restore`,error);return {ok:false};}},write(name,value){return restoreStorageSnapshot(keys[name],value);}},expectedRaw,arguments[2]||null);
  if(result.ok&&(result.status==="success"||result.status==="no-op")){criticalRecoveryStorageState=false;if(result.affectedKeys.includes("legacyShowdowns"))invalidateLegacyCache();if(result.affectedKeys.includes("preferences")){applicationPreferencesCache=null;applyApplicationMotionPreference();notifyApplicationPreferencesChanged("restore");}}
  else if(result.status==="rollback-failed-critical")invalidateRuntimeAfterCriticalRecovery();
  return result;
}
function clearAllCareerModeData(){cancelScheduledCurrentShowdownSave();return Boolean(window.CareerModeSaveLibraryRuntime?.isReady()&&window.CareerModeSaveLibraryRuntime.clearAllData());}
window.captureCareerModeRawBackupInputs=captureCareerModeRawBackupInputs;
window.captureCareerModeRawRestoreSnapshot=captureCareerModeRawRestoreSnapshot;
window.captureCareerModeRawSaveLibraryMigrationSnapshot=captureLibraryMigrationSnapshot;
window.getCareerModeStorageKeys=()=>({saveLibrary:SAVE_KEY,activeShowdown:STORAGE_KEY,legacyShowdowns:LEGACY_STORAGE_KEY,preferences:APPLICATION_PREFERENCES_KEY});
window.initializeStorageLifecycle=initializeStorageLifecycle;
window.ensureSaveLibraryRuntimeAuthority=ensureSaveLibraryRuntimeAuthority;
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
