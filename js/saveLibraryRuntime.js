(function initializeSaveLibraryRuntime(root){
    "use strict";

    const SAVE_LIBRARY_KEY = "careerModeShowdown.saveLibrary";
    const SINGLETON_KEY = "careerModeShowdown.activeShowdown";
    const LEGACY_KEY = "careerModeShowdown.legacyShowdowns";
    const PREFERENCES_KEY = "careerModeShowdown.preferences";
    const RUNTIME_ORDER = Object.freeze(["saveLibrary", "activeShowdown"]);
    const ARCHIVE_ORDER = Object.freeze(["legacyShowdowns", "saveLibrary", "activeShowdown"]);
    const CLEAR_ORDER = Object.freeze(["legacyShowdowns", "saveLibrary", "preferences", "activeShowdown"]);

    let authorityReady = false;
    let activationPromise = null;
    let ownedLibraryRaw = null;
    let seasonIdentityByRound = new Map();
    let storageListenerBound = false;

    const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

    function clone(value){
        if(value === undefined){ return undefined; }
        if(value === null){ return null; }
        if(typeof structuredClone === "function"){
            try{ return structuredClone(value); }catch(error){ /* JSON fallback below. */ }
        }
        return JSON.parse(JSON.stringify(value));
    }

    function getFoundation(){
        const foundation = root && root.CareerModeSaveLibraryFoundation;
        if(!foundation
            || typeof foundation.buildSingletonMigrationPlan !== "function"
            || typeof foundation.migrateShowdownIdentity !== "function"
            || typeof foundation.validateSaveLibrary !== "function"){
            throw new Error("Save Library identity foundation is unavailable.");
        }
        return foundation;
    }

    function getPersistence(){
        const persistence = root && root.CareerModeSaveLibraryPersistence;
        if(!persistence || typeof persistence.migrate !== "function"){
            throw new Error("Save Library persistence transition authority is unavailable.");
        }
        return persistence;
    }

    function captureExactRaw(){
        if(typeof root.captureCareerModeRawSaveLibraryMigrationSnapshot !== "function"){
            throw new Error("Exact Save Library raw snapshot authority is unavailable.");
        }
        const snapshot = root.captureCareerModeRawSaveLibraryMigrationSnapshot();
        if(!snapshot || snapshot.ok !== true || !snapshot.raw){
            const failed = snapshot && Array.isArray(snapshot.failedKeys) ? snapshot.failedKeys.join(", ") : "unknown storage";
            throw new Error(`Exact Save Library raw snapshot failed: ${failed}.`);
        }
        return snapshot.raw;
    }

    function parseLibrary(raw){
        if(raw === null){ throw new Error("Save Library storage is absent."); }
        let library;
        try{ library = JSON.parse(raw); }
        catch(error){ throw new Error("Save Library storage contains unreadable JSON."); }
        const errors = getFoundation().validateSaveLibrary(library);
        if(errors.length){ throw new Error(`Save Library storage is invalid: ${errors.join(" ")}`); }
        return library;
    }

    function parseLegacy(raw){
        if(raw === null){ return []; }
        let history;
        try{ history = JSON.parse(raw); }
        catch(error){ throw new Error("Legacy storage contains unreadable JSON."); }
        if(!Array.isArray(history) || history.some(item => !item || typeof item !== "object" || Array.isArray(item))){
            throw new Error("Legacy storage is not a valid Showdown array.");
        }
        return history;
    }

    function getActiveEntry(library){
        if(!library || library.activeSaveId === null){ return null; }
        const matches = library.saves.filter(entry => entry && entry.saveId === library.activeSaveId);
        if(matches.length !== 1){ throw new Error("Save Library active identity does not resolve to exactly one save."); }
        const entry = matches[0];
        if(!entry.showdown || !entry.showdown.identity || entry.showdown.identity.saveId !== entry.saveId){
            throw new Error("Save Library active Showdown identity is inconsistent.");
        }
        return entry;
    }

    function getCurrentShowdownReference(){
        return typeof currentShowdown !== "undefined" ? currentShowdown : null;
    }

    function setCurrentShowdownReference(value){
        if(typeof currentShowdown !== "undefined"){ currentShowdown = value; }
    }

    function invalidateAuthority(){
        authorityReady = false;
        ownedLibraryRaw = null;
        seasonIdentityByRound = new Map();
    }

    function authorityRawSnapshot(){
        if(!authorityReady || ownedLibraryRaw === null){ throw new Error("Save Library runtime authority is not active."); }
        if(typeof root.isCareerModeCriticalRecoveryLocked === "function" && root.isCareerModeCriticalRecoveryLocked()){
            invalidateAuthority();
            throw new Error("Canonical storage is locked for critical recovery.");
        }
        const raw = captureExactRaw();
        if(raw.activeShowdown !== null){
            invalidateAuthority();
            throw new Error("Singleton active storage reappeared after Save Library cutover. Runtime writes are blocked.");
        }
        if(raw.saveLibrary !== ownedLibraryRaw){
            invalidateAuthority();
            throw new Error("Save Library changed in another tab or operation. Reload before writing again.");
        }
        return raw;
    }

    async function primeSeasonIdentities(showdown){
        seasonIdentityByRound = new Map();
        if(!showdown || !showdown.identity || typeof showdown.identity.saveId !== "string"){ return; }
        const probe = clone(showdown);
        probe.rounds = Array.from({ length: 10 }, (_, index) => ({ roundNumber: index + 1 }));
        const refs = showdown.identity.managerProfileIds && typeof showdown.identity.managerProfileIds === "object"
            ? showdown.identity.managerProfileIds
            : null;
        const migrated = await getFoundation().migrateShowdownIdentity(probe, refs);
        for(const round of migrated.rounds){
            if(round && typeof round.seasonId === "string" && round.seasonId){
                seasonIdentityByRound.set(Number(round.roundNumber), round.seasonId);
            }
        }
    }

    function ensureSeasonIdentities(showdown){
        if(!showdown || !Array.isArray(showdown.rounds)){ return true; }
        for(const round of showdown.rounds){
            if(!round || typeof round !== "object"){ return false; }
            const number = Number(round.roundNumber);
            if(typeof round.seasonId === "string" && round.seasonId){ continue; }
            const seasonId = seasonIdentityByRound.get(number);
            if(!seasonId){ return false; }
            round.seasonId = seasonId;
        }
        return true;
    }

    function reportRuntimeSaveFailure(message, error){
        console.error(`[Career Mode Showdown] ${message}:`, error);
        if(typeof root.showAppNotice === "function"){
            root.showAppNotice(`${message}. ${error && error.message ? error.message : "No data was accepted as saved."}`, "error", 10000);
        }
    }

    function applyRuntimeTransaction(candidateRaw, expectedRaw, order){
        if(typeof root.applyCareerModeRawStorageTransaction !== "function"){
            return { ok: false, status: "transaction-unavailable" };
        }
        return root.applyCareerModeRawStorageTransaction(
            candidateRaw,
            expectedRaw,
            { order: order.slice(), guardRequestedBeforeEachWrite: true }
        );
    }

    function commitLibrary(library){
        const raw = authorityRawSnapshot();
        const errors = getFoundation().validateSaveLibrary(library);
        if(errors.length){ throw new Error(`Runtime Save Library candidate is invalid: ${errors.join(" ")}`); }
        const nextRaw = JSON.stringify(library);
        const result = applyRuntimeTransaction(
            { saveLibrary: nextRaw, activeShowdown: null },
            raw,
            RUNTIME_ORDER
        );
        if(!result || result.ok !== true){
            if(result && (result.failurePhase === "precondition" || result.status === "rollback-failed-critical")){
                invalidateAuthority();
            }
            throw new Error(`Save Library transaction failed${result && result.status ? ` (${result.status})` : ""}.`);
        }
        ownedLibraryRaw = nextRaw;
        return true;
    }

    function saveCurrent(){
        const showdown = getCurrentShowdownReference();
        if(!showdown){ return false; }
        const previousUpdatedAt = showdown.updatedAt || null;
        try{
            const raw = authorityRawSnapshot();
            const library = parseLibrary(raw.saveLibrary);
            const entry = getActiveEntry(library);
            const saveId = showdown.identity && typeof showdown.identity.saveId === "string" ? showdown.identity.saveId : "";
            if(!entry || !saveId || entry.saveId !== saveId || library.activeSaveId !== saveId){
                throw new Error("In-memory Showdown identity does not own the authoritative active save.");
            }
            if(!ensureSeasonIdentities(showdown)){
                throw new Error("A completed Season is missing its stable Save Library identity.");
            }
            showdown.updatedAt = new Date().toISOString();
            const index = library.saves.findIndex(item => item && item.saveId === saveId);
            library.saves[index] = { saveId, showdown: clone(showdown) };
            commitLibrary(library);
            return true;
        }catch(error){
            showdown.updatedAt = previousUpdatedAt;
            reportRuntimeSaveFailure("The active Showdown could not be saved under Save Library authority", error);
            return false;
        }
    }

    function loadActive(){
        try{
            const raw = authorityRawSnapshot();
            const library = parseLibrary(raw.saveLibrary);
            const entry = getActiveEntry(library);
            return entry ? clone(entry.showdown) : null;
        }catch(error){
            reportRuntimeSaveFailure("The authoritative Save Library could not be loaded", error);
            return null;
        }
    }

    function hasSaved(){
        return loadActive() !== null;
    }

    function hasStoredActiveData(){
        try{
            const raw = authorityRawSnapshot();
            const library = parseLibrary(raw.saveLibrary);
            return library.activeSaveId !== null;
        }catch(error){
            return true;
        }
    }

    function clearActive(){
        try{
            const raw = authorityRawSnapshot();
            const library = parseLibrary(raw.saveLibrary);
            library.activeSaveId = null;
            library.profiles = [];
            library.saves = [];
            commitLibrary(library);
            seasonIdentityByRound = new Map();
            return true;
        }catch(error){
            reportRuntimeSaveFailure("The active Save Library entry could not be cleared", error);
            return false;
        }
    }

    async function createShowdown(candidate){
        if(!candidate || typeof candidate !== "object" || Array.isArray(candidate)){
            throw new Error("New Showdown candidate is invalid.");
        }
        const raw = authorityRawSnapshot();
        const currentLibrary = parseLibrary(raw.saveLibrary);
        if(currentLibrary.saves.length > 1){
            throw new Error("This runtime cannot safely replace a Save Library that already contains multiple saves without the future visible Save Library workflow.");
        }
        const planned = await getFoundation().buildSingletonMigrationPlan({ activeShowdown: candidate, legacyShowdowns: [] });
        if(!planned || planned.ok !== true || !planned.library || planned.library.saves.length !== 1){
            throw new Error("Stable Save Library identity could not be prepared for the new Showdown.");
        }
        const prepared = planned.library.saves[0].showdown;
        const newSaveId = planned.library.activeSaveId;
        if(currentLibrary.saves.some(entry => entry && entry.saveId === newSaveId)){
            throw new Error("A Save Library entry with the new Showdown identity already exists.");
        }
        const nextLibrary = {
            ...currentLibrary,
            schemaVersion: planned.library.schemaVersion,
            activeSaveId: newSaveId,
            profiles: planned.library.profiles,
            saves: planned.library.saves
        };
        await primeSeasonIdentities(prepared);
        if(captureExactRaw().saveLibrary !== raw.saveLibrary || captureExactRaw().activeShowdown !== null){
            invalidateAuthority();
            throw new Error("Save Library changed while the new Showdown identity was being prepared.");
        }
        commitLibrary(nextLibrary);
        return clone(prepared);
    }

    function archive(showdown){
        if(!showdown || showdown.status !== "Completed"){ return false; }
        try{
            const raw = authorityRawSnapshot();
            const library = parseLibrary(raw.saveLibrary);
            const saveId = showdown.identity && showdown.identity.saveId;
            const active = getActiveEntry(library);
            if(!active || active.saveId !== saveId){ throw new Error("Completed Showdown no longer owns the active Save Library entry."); }
            if(!ensureSeasonIdentities(showdown)){ throw new Error("Completed Showdown contains a Season without stable identity."); }
            const history = parseLegacy(raw.legacyShowdowns);
            const existingIndex = history.findIndex(item => String(item.id) === String(showdown.id));
            if(existingIndex >= 0){
                const existing = history[existingIndex];
                const sameRevision = String(existing.updatedAt || "") === String(showdown.updatedAt || "")
                    && String(existing.completedAt || "") === String(showdown.completedAt || "");
                if(sameRevision){ return true; }
            }
            const stored = clone(showdown);
            stored.archivedAt = stored.archivedAt || new Date().toISOString();
            if(existingIndex >= 0){
                stored.archivedAt = history[existingIndex].archivedAt || stored.archivedAt;
                history[existingIndex] = stored;
            }else{
                history.unshift(stored);
            }
            const result = applyRuntimeTransaction(
                {
                    legacyShowdowns: JSON.stringify(history),
                    saveLibrary: raw.saveLibrary,
                    activeShowdown: null
                },
                raw,
                ARCHIVE_ORDER
            );
            if(!result || result.ok !== true){
                if(result && (result.failurePhase === "precondition" || result.status === "rollback-failed-critical")){
                    invalidateAuthority();
                }
                throw new Error(`Legacy archive transaction failed${result && result.status ? ` (${result.status})` : ""}.`);
            }
            return true;
        }catch(error){
            reportRuntimeSaveFailure("The completed Showdown could not be archived safely", error);
            return false;
        }
    }

    function createBackupProjection(){
        const raw = captureExactRaw();
        const warnings = [];
        const recovery = {};
        let projectedActiveRaw = raw.activeShowdown;

        if(raw.saveLibrary !== null){
            if(raw.activeShowdown !== null){
                warnings.push("Save Library and singleton active storage both exist. No active Showdown was selected for backup because authority is ambiguous.");
                recovery.saveLibrary = { storageKey: SAVE_LIBRARY_KEY, raw: raw.saveLibrary, reason: warnings[warnings.length - 1] };
                recovery.activeShowdown = { storageKey: SINGLETON_KEY, raw: raw.activeShowdown, reason: warnings[warnings.length - 1] };
                projectedActiveRaw = null;
            }else{
                try{
                    const library = parseLibrary(raw.saveLibrary);
                    const entry = getActiveEntry(library);
                    projectedActiveRaw = entry ? JSON.stringify(entry.showdown) : null;
                }catch(error){
                    const reason = `Save Library storage could not be safely interpreted: ${error.message || String(error)}`;
                    warnings.push(reason);
                    recovery.saveLibrary = { storageKey: SAVE_LIBRARY_KEY, raw: raw.saveLibrary, reason };
                    projectedActiveRaw = null;
                }
            }
        }

        return {
            ok: true,
            raw: {
                activeShowdown: projectedActiveRaw,
                legacyShowdowns: raw.legacyShowdowns,
                preferences: raw.preferences
            },
            warnings,
            recovery: Object.keys(recovery).length ? recovery : null,
            sourceRaw: clone(raw)
        };
    }

    async function prepareRestoreLibraryRaw(activeShowdown, currentLibraryRaw){
        const currentLibrary = parseLibrary(currentLibraryRaw);
        let nextLibrary;
        if(activeShowdown === null){
            nextLibrary = { ...currentLibrary, activeSaveId: null, profiles: [], saves: [] };
        }else{
            const planned = await getFoundation().buildSingletonMigrationPlan({ activeShowdown, legacyShowdowns: [] });
            if(!planned || planned.ok !== true || !planned.library || planned.library.saves.length !== 1){
                throw new Error("Backup active Showdown could not be converted to Save Library authority.");
            }
            nextLibrary = {
                ...currentLibrary,
                schemaVersion: planned.library.schemaVersion,
                activeSaveId: planned.library.activeSaveId,
                profiles: planned.library.profiles,
                saves: planned.library.saves
            };
        }
        const errors = getFoundation().validateSaveLibrary(nextLibrary);
        if(errors.length){ throw new Error(`Restored Save Library candidate is invalid: ${errors.join(" ")}`); }
        return JSON.stringify(nextLibrary);
    }

    function clearAllData(){
        try{
            const raw = captureExactRaw();
            const result = applyRuntimeTransaction(
                {
                    legacyShowdowns: null,
                    saveLibrary: null,
                    preferences: raw.preferences,
                    activeShowdown: null
                },
                raw,
                CLEAR_ORDER
            );
            if(!result || result.ok !== true){ throw new Error(`Full reset transaction failed${result && result.status ? ` (${result.status})` : ""}.`); }
            invalidateAuthority();
            setCurrentShowdownReference(null);
            return true;
        }catch(error){
            reportRuntimeSaveFailure("Showdown data could not be reset safely", error);
            return false;
        }
    }

    function installAuthorityOverrides(){
        root.saveCurrentShowdown = saveCurrent;
        root.loadSavedShowdown = loadActive;
        root.clearSavedShowdown = clearActive;
        root.hasSavedShowdown = hasSaved;
        root.hasStoredActiveShowdownData = hasStoredActiveData;
        root.archiveShowdown = archive;
        root.getCareerModeStorageKeys = () => ({ saveLibrary: SAVE_LIBRARY_KEY, legacyShowdowns: LEGACY_KEY, preferences: PREFERENCES_KEY });
    }

    function bindStorageListener(){
        if(storageListenerBound || !root || typeof root.addEventListener !== "function"){ return; }
        storageListenerBound = true;
        root.addEventListener("storage", event => {
            if(!authorityReady){ return; }
            if(event && (event.key === SAVE_LIBRARY_KEY || event.key === SINGLETON_KEY)){
                invalidateAuthority();
                if(typeof root.showAppNotice === "function"){
                    root.showAppNotice("Save data changed in another tab. Reload or Continue again before making more changes.", "error", 10000);
                }
            }
        });
    }

    async function activate(){
        if(authorityReady){ return { ok: true, status: "ready" }; }
        if(activationPromise){ return activationPromise; }
        activationPromise = (async () => {
            if(typeof root.isCareerModeCriticalRecoveryLocked === "function" && root.isCareerModeCriticalRecoveryLocked()){
                throw new Error("Canonical storage is locked for critical recovery.");
            }
            const migration = await getPersistence().migrate();
            if(!migration || migration.ok !== true){
                const details = migration && Array.isArray(migration.errors) ? migration.errors.join(" ") : "Migration did not complete.";
                throw new Error(`Save Library activation failed${migration && migration.status ? ` (${migration.status})` : ""}. ${details}`);
            }
            const firstRaw = captureExactRaw();
            if(firstRaw.activeShowdown !== null){ throw new Error("Singleton active storage was not retired at the Save Library activation boundary."); }
            const library = parseLibrary(firstRaw.saveLibrary);
            const entry = getActiveEntry(library);
            await primeSeasonIdentities(entry ? entry.showdown : null);
            const finalRaw = captureExactRaw();
            if(finalRaw.activeShowdown !== null || finalRaw.saveLibrary !== firstRaw.saveLibrary){
                throw new Error("Canonical storage changed while Save Library runtime authority was activating.");
            }
            ownedLibraryRaw = finalRaw.saveLibrary;
            authorityReady = true;
            installAuthorityOverrides();
            bindStorageListener();
            return { ok: true, status: migration.status || "ready", migration };
        })();
        try{ return await activationPromise; }
        catch(error){ invalidateAuthority(); throw error; }
        finally{ activationPromise = null; }
    }

    root.clearAllCareerModeData = clearAllData;

    const api = Object.freeze({
        activate,
        isReady: () => authorityReady,
        invalidateAuthority,
        createShowdown,
        saveCurrentShowdown: saveCurrent,
        loadActiveShowdown: loadActive,
        archiveShowdown: archive,
        createBackupProjection,
        prepareRestoreLibraryRaw,
        clearAllData
    });

    if(root){ root.CareerModeSaveLibraryRuntime = api; }
    if(typeof module !== "undefined" && module.exports){ module.exports = api; }
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
