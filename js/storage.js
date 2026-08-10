/* Career Mode Showdown v1.0.1 */

const STORAGE_KEY = "careerModeShowdown.activeShowdown";
const LEGACY_STORAGE_KEY = "careerModeShowdown.legacyShowdowns";
const APPLICATION_PREFERENCES_KEY = "careerModeShowdown.preferences";
const APPLICATION_PREFERENCES_SCHEMA_VERSION = 2;
const DEFAULT_DRAFT_SAVE_DELAY = 420;

let pendingCurrentSaveTimer = null;
let storageLifecycleBound = false;
let activeSavePresenceKnown = false;
let activeSavePresent = false;
let legacyCache = null;
let legacyStorageRevision = 0;
let applicationPreferencesCache = null;
let motionPreferenceMediaQuery = null;
let motionPreferenceMediaBound = false;

function reportStorageError(context, error){
    console.error(`[Career Mode Showdown] ${context}:`, error);
    if(typeof window.showAppNotice === "function"){
        window.showAppNotice(`${context}. Your browser may not have saved the latest change.`, "error", 10000);
    }
}

function readStorageValue(key){
    try{
        return localStorage.getItem(key);
    }catch(error){
        reportStorageError("Unable to read local save data", error);
        return null;
    }
}

function writeStorageValue(key, value){
    try{
        localStorage.setItem(key, value);
        return true;
    }catch(error){
        reportStorageError("Unable to write local save data", error);
        return false;
    }
}

function removeStorageValue(key){
    try{
        localStorage.removeItem(key);
        return true;
    }catch(error){
        reportStorageError("Unable to remove local save data", error);
        return false;
    }
}

function createDefaultApplicationPreferences(){
    return {
        schemaVersion: APPLICATION_PREFERENCES_SCHEMA_VERSION,
        reducedMotion: false,
        menuFeedback: true
    };
}

function normalizeApplicationPreferences(value){
    return {
        schemaVersion: APPLICATION_PREFERENCES_SCHEMA_VERSION,
        reducedMotion: Boolean(value && value.reducedMotion),
        menuFeedback: !value || value.menuFeedback !== false
    };
}

function loadApplicationPreferences(){
    if(applicationPreferencesCache){
        return { ...applicationPreferencesCache };
    }

    const raw = readStorageValue(APPLICATION_PREFERENCES_KEY);
    if(!raw){
        applicationPreferencesCache = createDefaultApplicationPreferences();
        return { ...applicationPreferencesCache };
    }

    try{
        const parsed = JSON.parse(raw);
        if(!parsed || typeof parsed !== "object" || Array.isArray(parsed)){
            throw new Error("Application preferences are not a valid object.");
        }
        applicationPreferencesCache = normalizeApplicationPreferences(parsed);
    }catch(error){
        reportStorageError("Unable to parse application preferences", error);
        applicationPreferencesCache = createDefaultApplicationPreferences();
    }

    return { ...applicationPreferencesCache };
}

function saveApplicationPreferences(preferences){
    const normalized = normalizeApplicationPreferences(preferences);

    try{
        const serialized = JSON.stringify(normalized);
        if(!writeStorageValue(APPLICATION_PREFERENCES_KEY, serialized)){
            return false;
        }
        applicationPreferencesCache = normalized;
        return true;
    }catch(error){
        reportStorageError("Unable to serialize application preferences", error);
        return false;
    }
}

function getMotionPreferenceMediaQuery(){
    if(motionPreferenceMediaQuery){
        return motionPreferenceMediaQuery;
    }
    if(typeof window.matchMedia !== "function"){
        return null;
    }
    motionPreferenceMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    return motionPreferenceMediaQuery;
}

function isSystemReducedMotionPreferred(){
    const query = getMotionPreferenceMediaQuery();
    return Boolean(query && query.matches);
}

function isReducedMotionPreferred(){
    const preferences = loadApplicationPreferences();
    return Boolean(preferences.reducedMotion || isSystemReducedMotionPreferred());
}

function getApplicationMotionPreferenceState(){
    const preferences = loadApplicationPreferences();
    const systemReduced = isSystemReducedMotionPreferred();
    return {
        reducedMotionOverride: Boolean(preferences.reducedMotion),
        systemReduced,
        effectiveReduced: Boolean(preferences.reducedMotion || systemReduced)
    };
}

function applyApplicationMotionPreference(){
    const root = document.documentElement;
    if(!root){
        return getApplicationMotionPreferenceState();
    }

    const state = getApplicationMotionPreferenceState();
    root.dataset.motionPreference = state.reducedMotionOverride ? "reduced" : "system";
    root.dataset.motionReduced = state.effectiveReduced ? "true" : "false";
    return state;
}

function notifyApplicationPreferencesChanged(source = "application"){
    if(typeof window.CustomEvent !== "function"){
        return;
    }
    window.dispatchEvent(new CustomEvent("career-mode-preferences-change", {
        detail: {
            source,
            preferences: loadApplicationPreferences(),
            motion: getApplicationMotionPreferenceState()
        }
    }));
}

function setApplicationReducedMotionPreference(enabled){
    const current = loadApplicationPreferences();
    const nextValue = Boolean(enabled);

    if(current.reducedMotion === nextValue){
        applyApplicationMotionPreference();
        return true;
    }

    if(!saveApplicationPreferences({ ...current, reducedMotion: nextValue })){
        return false;
    }

    applyApplicationMotionPreference();
    notifyApplicationPreferencesChanged("user");
    return true;
}

function isMenuFeedbackEnabled(){
    return loadApplicationPreferences().menuFeedback !== false;
}

function setApplicationMenuFeedbackPreference(enabled){
    const current = loadApplicationPreferences();
    const nextValue = Boolean(enabled);

    if(current.menuFeedback === nextValue){
        return true;
    }

    if(!saveApplicationPreferences({ ...current, menuFeedback: nextValue })){
        return false;
    }

    notifyApplicationPreferencesChanged("menu-feedback");
    return true;
}

function initializeMotionPreferenceLifecycle(){
    applyApplicationMotionPreference();

    if(motionPreferenceMediaBound){
        return;
    }

    const query = getMotionPreferenceMediaQuery();
    if(!query){
        return;
    }

    const handleChange = () => {
        applyApplicationMotionPreference();
        notifyApplicationPreferencesChanged("system");
    };

    if(typeof query.addEventListener === "function"){
        query.addEventListener("change", handleChange);
    }else if(typeof query.addListener === "function"){
        query.addListener(handleChange);
    }

    motionPreferenceMediaBound = true;
}

function normalizeBeforeStorage(showdown){
    if(!showdown){ return null; }
    return typeof normalizeShowdown === "function" ? normalizeShowdown(showdown) : showdown;
}

function cancelScheduledCurrentShowdownSave(){
    if(pendingCurrentSaveTimer){
        window.clearTimeout(pendingCurrentSaveTimer);
        pendingCurrentSaveTimer = null;
    }
}

function invalidateActiveSavePresence(){
    activeSavePresenceKnown = false;
    activeSavePresent = false;
}

function saveCurrentShowdown(){
    if(!currentShowdown){ return false; }
    cancelScheduledCurrentShowdownSave();

    const previousUpdatedAt = currentShowdown.updatedAt || null;

    try{
        currentShowdown.updatedAt = new Date().toISOString();
        const serialized = JSON.stringify(currentShowdown);

        if(!writeStorageValue(STORAGE_KEY, serialized)){
            currentShowdown.updatedAt = previousUpdatedAt;
            return false;
        }

        activeSavePresenceKnown = true;
        activeSavePresent = true;
        return true;
    }catch(error){
        currentShowdown.updatedAt = previousUpdatedAt;
        reportStorageError("Unable to serialize the active showdown", error);
        return false;
    }
}

function scheduleCurrentShowdownSave(delay = DEFAULT_DRAFT_SAVE_DELAY){
    if(!currentShowdown){ return false; }
    cancelScheduledCurrentShowdownSave();

    pendingCurrentSaveTimer = window.setTimeout(() => {
        pendingCurrentSaveTimer = null;
        saveCurrentShowdown();
    }, Math.max(0, Number(delay) || 0));

    return true;
}

function flushScheduledCurrentShowdownSave(){
    if(!pendingCurrentSaveTimer){ return true; }
    cancelScheduledCurrentShowdownSave();
    return saveCurrentShowdown();
}

function flushPendingApplicationWrites(){
    const transferFlushed = typeof window.flushTransferDraftSave === "function"
        ? window.flushTransferDraftSave()
        : true;
    const storageFlushed = flushScheduledCurrentShowdownSave();
    return transferFlushed !== false && storageFlushed !== false;
}

function initializeStorageLifecycle(){
    if(storageLifecycleBound){ return; }
    storageLifecycleBound = true;

    initializeMotionPreferenceLifecycle();

    window.addEventListener("pagehide", flushPendingApplicationWrites);
    document.addEventListener("visibilitychange", () => {
        if(document.visibilityState === "hidden"){
            flushPendingApplicationWrites();
        }
    });

    window.addEventListener("storage", event => {
        if(event.key === STORAGE_KEY){
            invalidateActiveSavePresence();
        }
        if(event.key === LEGACY_STORAGE_KEY){
            invalidateLegacyCache();
        }
        if(event.key === APPLICATION_PREFERENCES_KEY){
            applicationPreferencesCache = null;
            applyApplicationMotionPreference();
            notifyApplicationPreferencesChanged("storage");
        }
    });
}

function loadSavedShowdown(){
    const raw = readStorageValue(STORAGE_KEY);
    if(!raw){
        activeSavePresenceKnown = true;
        activeSavePresent = false;
        return null;
    }

    try{
        const parsed = JSON.parse(raw);
        if(!parsed || typeof parsed !== "object" || Array.isArray(parsed)){
            throw new Error("Active save data is not a valid showdown object.");
        }

        activeSavePresenceKnown = true;
        activeSavePresent = true;
        return parsed;
    }catch(error){
        invalidateActiveSavePresence();
        reportStorageError("Unable to parse the active showdown", error);
        return null;
    }
}

function clearSavedShowdown(){
    cancelScheduledCurrentShowdownSave();
    const removed = removeStorageValue(STORAGE_KEY);

    if(removed){
        activeSavePresenceKnown = true;
        activeSavePresent = false;
    }

    return removed;
}

function hasSavedShowdown(){
    if(activeSavePresenceKnown){
        return activeSavePresent;
    }

    const present = Boolean(readStorageValue(STORAGE_KEY));
    activeSavePresenceKnown = true;
    activeSavePresent = present;
    return present;
}

function invalidateLegacyCache(){
    legacyCache = null;
    legacyStorageRevision += 1;
}

function getLegacyStorageRevision(){
    return legacyStorageRevision;
}

function loadLegacyShowdowns(){
    if(legacyCache){
        return legacyCache.slice();
    }

    const raw = readStorageValue(LEGACY_STORAGE_KEY);
    if(!raw){
        legacyCache = [];
        return [];
    }

    try{
        const parsed = JSON.parse(raw);
        legacyCache = Array.isArray(parsed)
            ? parsed.filter(item => item && typeof item === "object" && !Array.isArray(item))
            : [];
        return legacyCache.slice();
    }catch(error){
        reportStorageError("Unable to parse Legacy history", error);
        legacyCache = [];
        return [];
    }
}

function saveLegacyShowdowns(showdowns){
    const safeShowdowns = Array.isArray(showdowns) ? showdowns : [];

    try{
        const serialized = JSON.stringify(safeShowdowns);
        if(!writeStorageValue(LEGACY_STORAGE_KEY, serialized)){
            return false;
        }

        legacyCache = safeShowdowns.slice();
        legacyStorageRevision += 1;
        return true;
    }catch(error){
        reportStorageError("Unable to serialize Legacy history", error);
        return false;
    }
}

function cloneForStorage(value){
    if(typeof structuredClone === "function"){
        try{
            return structuredClone(value);
        }catch(error){
            /* JSON fallback preserves compatibility with older browsers/data. */
        }
    }

    return JSON.parse(JSON.stringify(value));
}

function archiveShowdown(showdown){
    if(!showdown || showdown.status !== "Completed"){
        return false;
    }

    try{
        const history = loadLegacyShowdowns();
        const existingIndex = history.findIndex(item => String(item.id) === String(showdown.id));

        if(existingIndex >= 0){
            const existing = history[existingIndex];
            const sameRevision = String(existing.updatedAt || "") === String(showdown.updatedAt || "")
                && String(existing.completedAt || "") === String(showdown.completedAt || "");
            if(sameRevision){
                return true;
            }
        }

        let snapshot = cloneForStorage(showdown);
        snapshot = normalizeBeforeStorage(snapshot);
        snapshot.archivedAt = snapshot.archivedAt || new Date().toISOString();

        if(existingIndex >= 0){
            snapshot.archivedAt = history[existingIndex].archivedAt || snapshot.archivedAt;
            history[existingIndex] = snapshot;
        }else{
            history.unshift(snapshot);
        }

        return saveLegacyShowdowns(history);
    }catch(error){
        reportStorageError("Unable to archive the completed showdown", error);
        return false;
    }
}

function deleteLegacyShowdown(showdownId){
    const history = loadLegacyShowdowns();
    const nextHistory = history.filter(item => String(item.id) !== String(showdownId));
    if(nextHistory.length === history.length){ return false; }
    return saveLegacyShowdowns(nextHistory);
}

function clearLegacyHistory(){
    const removed = removeStorageValue(LEGACY_STORAGE_KEY);
    if(removed){
        invalidateLegacyCache();
        legacyCache = [];
    }
    return removed;
}

function restoreStorageSnapshot(key, value){
    if(value === null){
        return removeStorageValue(key);
    }
    return writeStorageValue(key, value);
}

function clearAllCareerModeData(){
    cancelScheduledCurrentShowdownSave();

    const activeSnapshot = readStorageValue(STORAGE_KEY);
    const legacySnapshot = readStorageValue(LEGACY_STORAGE_KEY);

    if(!removeStorageValue(STORAGE_KEY)){
        return false;
    }

    if(!removeStorageValue(LEGACY_STORAGE_KEY)){
        const activeRestored = restoreStorageSnapshot(STORAGE_KEY, activeSnapshot);
        activeSavePresenceKnown = activeRestored;
        activeSavePresent = activeRestored && activeSnapshot !== null;
        if(!activeRestored){
            invalidateActiveSavePresence();
        }
        return false;
    }

    activeSavePresenceKnown = true;
    activeSavePresent = false;
    invalidateLegacyCache();
    legacyCache = [];

    /* Application preferences intentionally survive a Showdown-data reset. */
    void legacySnapshot;
    return true;
}

window.initializeStorageLifecycle = initializeStorageLifecycle;
window.scheduleCurrentShowdownSave = scheduleCurrentShowdownSave;
window.flushScheduledCurrentShowdownSave = flushScheduledCurrentShowdownSave;
window.flushPendingApplicationWrites = flushPendingApplicationWrites;
window.getLegacyStorageRevision = getLegacyStorageRevision;
window.loadApplicationPreferences = loadApplicationPreferences;
window.getApplicationMotionPreferenceState = getApplicationMotionPreferenceState;
window.setApplicationReducedMotionPreference = setApplicationReducedMotionPreference;
window.isMenuFeedbackEnabled = isMenuFeedbackEnabled;
window.setApplicationMenuFeedbackPreference = setApplicationMenuFeedbackPreference;
window.isSystemReducedMotionPreferred = isSystemReducedMotionPreferred;
window.isReducedMotionPreferred = isReducedMotionPreferred;
window.applyApplicationMotionPreference = applyApplicationMotionPreference;
