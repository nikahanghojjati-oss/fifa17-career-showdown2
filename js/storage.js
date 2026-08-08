/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.12.0
   High-Performance Local Storage and Legacy Persistence
===================================================== */

const STORAGE_KEY = "careerModeShowdown.activeShowdown";
const LEGACY_STORAGE_KEY = "careerModeShowdown.legacyShowdowns";
const DEFAULT_DRAFT_SAVE_DELAY = 420;

let pendingCurrentSaveTimer = null;
let storageLifecycleBound = false;

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

/*
   Full normalization is intentionally reserved for migration/archive boundaries.
   Running it on every save caused scoring recalculation and integrity repair while
   the user was typing. Runtime state is already normalized when created/resumed.
*/
function normalizeBeforeStorage(showdown){
    if(!showdown){
        return null;
    }

    if(typeof normalizeShowdown === "function"){
        return normalizeShowdown(showdown);
    }

    return showdown;
}

function cancelScheduledCurrentShowdownSave(){
    if(pendingCurrentSaveTimer){
        window.clearTimeout(pendingCurrentSaveTimer);
        pendingCurrentSaveTimer = null;
    }
}

function saveCurrentShowdown(){
    if(!currentShowdown){
        return false;
    }

    cancelScheduledCurrentShowdownSave();

    try{
        currentShowdown.updatedAt = new Date().toISOString();
        return writeStorageValue(STORAGE_KEY, JSON.stringify(currentShowdown));
    }catch(error){
        reportStorageError("Unable to serialize the active showdown", error);
        return false;
    }
}

function scheduleCurrentShowdownSave(delay = DEFAULT_DRAFT_SAVE_DELAY){
    if(!currentShowdown){
        return false;
    }

    cancelScheduledCurrentShowdownSave();

    pendingCurrentSaveTimer = window.setTimeout(() => {
        pendingCurrentSaveTimer = null;
        saveCurrentShowdown();
    }, Math.max(0, Number(delay) || 0));

    return true;
}

function flushScheduledCurrentShowdownSave(){
    if(!pendingCurrentSaveTimer){
        return true;
    }

    cancelScheduledCurrentShowdownSave();
    return saveCurrentShowdown();
}

function flushPendingApplicationWrites(){
    let transferFlushed = true;

    if(typeof window.flushTransferDraftSave === "function"){
        transferFlushed = window.flushTransferDraftSave();
    }

    const storageFlushed = flushScheduledCurrentShowdownSave();
    return transferFlushed !== false && storageFlushed !== false;
}

function initializeStorageLifecycle(){
    if(storageLifecycleBound){
        return;
    }

    storageLifecycleBound = true;

    window.addEventListener("pagehide", flushPendingApplicationWrites);
    document.addEventListener("visibilitychange", () => {
        if(document.visibilityState === "hidden"){
            flushPendingApplicationWrites();
        }
    });
}

function loadSavedShowdown(){
    const raw = readStorageValue(STORAGE_KEY);

    if(!raw){
        return null;
    }

    try{
        const parsed = JSON.parse(raw);
        if(!parsed || typeof parsed !== "object" || Array.isArray(parsed)){
            throw new Error("Active save data is not a valid showdown object.");
        }
        return parsed;
    }catch(error){
        reportStorageError("Unable to parse the active showdown", error);
        return null;
    }
}

function clearSavedShowdown(){
    cancelScheduledCurrentShowdownSave();
    return removeStorageValue(STORAGE_KEY);
}

function hasSavedShowdown(){
    return Boolean(readStorageValue(STORAGE_KEY));
}

function loadLegacyShowdowns(){
    const raw = readStorageValue(LEGACY_STORAGE_KEY);

    if(!raw){
        return [];
    }

    try{
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed.filter(item => item && typeof item === "object" && !Array.isArray(item))
            : [];
    }catch(error){
        reportStorageError("Unable to parse Legacy history", error);
        return [];
    }
}

function saveLegacyShowdowns(showdowns){
    const safeShowdowns = Array.isArray(showdowns) ? showdowns : [];

    try{
        return writeStorageValue(LEGACY_STORAGE_KEY, JSON.stringify(safeShowdowns));
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
        let snapshot = cloneForStorage(showdown);
        snapshot = normalizeBeforeStorage(snapshot);
        snapshot.archivedAt = snapshot.archivedAt || new Date().toISOString();

        const existingIndex = history.findIndex(
            item => String(item.id) === String(snapshot.id)
        );

        if(existingIndex >= 0){
            const originalArchivedAt = history[existingIndex].archivedAt;
            snapshot.archivedAt = originalArchivedAt || snapshot.archivedAt;
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
    const nextHistory = history.filter(
        item => String(item.id) !== String(showdownId)
    );

    if(nextHistory.length === history.length){
        return false;
    }

    return saveLegacyShowdowns(nextHistory);
}

function clearLegacyHistory(){
    return removeStorageValue(LEGACY_STORAGE_KEY);
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
