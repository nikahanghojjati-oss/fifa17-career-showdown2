/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.14.1
   High-Performance Local Storage and Legacy Persistence
===================================================== */

const STORAGE_KEY = "careerModeShowdown.activeShowdown";
const LEGACY_STORAGE_KEY = "careerModeShowdown.legacyShowdowns";
const DEFAULT_DRAFT_SAVE_DELAY = 420;

let pendingCurrentSaveTimer = null;
let storageLifecycleBound = false;
let activeShowdownCache = null;
let activeShowdownCacheKnown = false;
let legacyCache = null;
let legacyStorageRevision = 0;

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

function invalidateActiveShowdownCache(){
    activeShowdownCache = null;
    activeShowdownCacheKnown = false;
}

function saveCurrentShowdown(){
    if(!currentShowdown){ return false; }
    cancelScheduledCurrentShowdownSave();

    try{
        currentShowdown.updatedAt = new Date().toISOString();
        const serialized = JSON.stringify(currentShowdown);
        if(!writeStorageValue(STORAGE_KEY, serialized)){
            return false;
        }
        activeShowdownCache = currentShowdown;
        activeShowdownCacheKnown = true;
        return true;
    }catch(error){
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

    window.addEventListener("pagehide", flushPendingApplicationWrites);
    document.addEventListener("visibilitychange", () => {
        if(document.visibilityState === "hidden"){
            flushPendingApplicationWrites();
        }
    });

    window.addEventListener("storage", event => {
        if(event.key === STORAGE_KEY){
            invalidateActiveShowdownCache();
        }
        if(event.key === LEGACY_STORAGE_KEY){
            invalidateLegacyCache();
        }
    });
}

function loadSavedShowdown(){
    if(activeShowdownCacheKnown){
        return activeShowdownCache;
    }

    const raw = readStorageValue(STORAGE_KEY);
    if(!raw){
        activeShowdownCache = null;
        activeShowdownCacheKnown = true;
        return null;
    }

    try{
        const parsed = JSON.parse(raw);
        if(!parsed || typeof parsed !== "object" || Array.isArray(parsed)){
            throw new Error("Active save data is not a valid showdown object.");
        }
        activeShowdownCache = parsed;
        activeShowdownCacheKnown = true;
        return parsed;
    }catch(error){
        invalidateActiveShowdownCache();
        reportStorageError("Unable to parse the active showdown", error);
        return null;
    }
}

function clearSavedShowdown(){
    cancelScheduledCurrentShowdownSave();
    const removed = removeStorageValue(STORAGE_KEY);
    if(removed){
        activeShowdownCache = null;
        activeShowdownCacheKnown = true;
    }
    return removed;
}

function hasSavedShowdown(){
    if(activeShowdownCacheKnown){
        return Boolean(activeShowdownCache);
    }
    return Boolean(readStorageValue(STORAGE_KEY));
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
        if(!writeStorageValue(LEGACY_STORAGE_KEY, JSON.stringify(safeShowdowns))){
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

function clearAllCareerModeData(){
    cancelScheduledCurrentShowdownSave();
    const activeCleared = clearSavedShowdown();
    const legacyCleared = clearLegacyHistory();
    return activeCleared && legacyCleared;
}

window.initializeStorageLifecycle = initializeStorageLifecycle;
window.scheduleCurrentShowdownSave = scheduleCurrentShowdownSave;
window.flushScheduledCurrentShowdownSave = flushScheduledCurrentShowdownSave;
window.flushPendingApplicationWrites = flushPendingApplicationWrites;
window.getLegacyStorageRevision = getLegacyStorageRevision;
