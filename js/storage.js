/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.9.0
   Local Storage and Legacy Persistence
===================================================== */

const STORAGE_KEY = "careerModeShowdown.activeShowdown";
const LEGACY_STORAGE_KEY = "careerModeShowdown.legacyShowdowns";

function saveCurrentShowdown(){
    if(!currentShowdown){
        return false;
    }

    currentShowdown.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentShowdown));
    return true;
}

function loadSavedShowdown(){
    const raw = localStorage.getItem(STORAGE_KEY);

    if(!raw){
        return null;
    }

    try{
        return JSON.parse(raw);
    }catch(error){
        console.error("Unable to load saved showdown:", error);
        return null;
    }
}

function clearSavedShowdown(){
    localStorage.removeItem(STORAGE_KEY);
}

function hasSavedShowdown(){
    return Boolean(localStorage.getItem(STORAGE_KEY));
}

function loadLegacyShowdowns(){
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);

    if(!raw){
        return [];
    }

    try{
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }catch(error){
        console.error("Unable to load Legacy history:", error);
        return [];
    }
}

function saveLegacyShowdowns(showdowns){
    const safeShowdowns = Array.isArray(showdowns) ? showdowns : [];
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(safeShowdowns));
    return true;
}

function cloneForStorage(value){
    return JSON.parse(JSON.stringify(value));
}

function archiveShowdown(showdown){
    if(!showdown || showdown.status !== "Completed"){
        return false;
    }

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

    saveLegacyShowdowns(history);
    return true;
}

function deleteLegacyShowdown(showdownId){
    const history = loadLegacyShowdowns();
    const nextHistory = history.filter(
        item => String(item.id) !== String(showdownId)
    );

    if(nextHistory.length === history.length){
        return false;
    }

    saveLegacyShowdowns(nextHistory);
    return true;
}

function clearLegacyHistory(){
    localStorage.removeItem(LEGACY_STORAGE_KEY);
}

function clearAllCareerModeData(){
    clearSavedShowdown();
    clearLegacyHistory();
}
