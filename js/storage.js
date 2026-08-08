/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.10.1
   Hardened Local Storage and Legacy Persistence
===================================================== */

const STORAGE_KEY = "careerModeShowdown.activeShowdown";
const LEGACY_STORAGE_KEY = "careerModeShowdown.legacyShowdowns";

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

function saveCurrentShowdown(){
    if(!currentShowdown){
        return false;
    }

    currentShowdown.updatedAt = new Date().toISOString();

    try{
        return writeStorageValue(STORAGE_KEY, JSON.stringify(currentShowdown));
    }catch(error){
        reportStorageError("Unable to serialize the active showdown", error);
        return false;
    }
}

function loadSavedShowdown(){
    const raw = readStorageValue(STORAGE_KEY);

    if(!raw){
        return null;
    }

    try{
        return JSON.parse(raw);
    }catch(error){
        reportStorageError("Unable to parse the active showdown", error);
        return null;
    }
}

function clearSavedShowdown(){
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
        return Array.isArray(parsed) ? parsed : [];
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
        const snapshot = cloneForStorage(showdown);
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
    const activeCleared = clearSavedShowdown();
    const legacyCleared = clearLegacyHistory();
    return activeCleared && legacyCleared;
}
