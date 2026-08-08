/* =====================================================
   FIFA 17 Career Mode Showdown
   v0.6.1

   Local Storage Persistence
===================================================== */

const STORAGE_KEY = "careerModeShowdown.activeShowdown";

function saveCurrentShowdown(){
    if(!currentShowdown){
        return false;
    }

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(currentShowdown)
    );

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
