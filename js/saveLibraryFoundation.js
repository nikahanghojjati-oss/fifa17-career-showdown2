(function initializeSaveLibraryFoundation(root){
    "use strict";

    const SAVE_LIBRARY_SCHEMA_VERSION = 1;
    const SHOWDOWN_IDENTITY_SCHEMA_VERSION = 1;
    const PROFILE_SCHEMA_VERSION = 1;
    const SAVE_LIBRARY_STORAGE_KEY = "careerModeShowdown.saveLibrary";
    const LEGACY_ACTIVE_STORAGE_KEY = "careerModeShowdown.activeShowdown";
    const LEGACY_STORAGE_KEY = "careerModeShowdown.legacyShowdowns";
    const PREFERENCES_STORAGE_KEY = "careerModeShowdown.preferences";
    const ID_HEX_LENGTH = 24;

    function saveLibraryOwn(object, key){
        return Object.prototype.hasOwnProperty.call(object, key);
    }

    function saveLibraryIsPlainObject(value){
        return Boolean(value && typeof value === "object" && !Array.isArray(value)
            && Object.prototype.toString.call(value) === "[object Object]");
    }

    function cloneSaveLibraryValue(value){
        if(value === undefined){ return undefined; }
        if(value === null){ return null; }
        if(typeof structuredClone === "function"){
            try{ return structuredClone(value); }catch(error){ /* JSON fallback below. */ }
        }
        return JSON.parse(JSON.stringify(value));
    }

    function canonicalizeSaveLibraryValue(value){
        if(Array.isArray(value)){ return value.map(canonicalizeSaveLibraryValue); }
        if(value && typeof value === "object"){
            return Object.keys(value).sort().reduce((result, key) => {
                result[key] = canonicalizeSaveLibraryValue(value[key]);
                return result;
            }, Object.create(null));
        }
        return value;
    }

    function canonicalSaveLibraryString(value){
        return JSON.stringify(canonicalizeSaveLibraryValue(value));
    }

    function getSaveLibraryCrypto(){
        if(root && root.crypto && root.crypto.subtle){ return root.crypto; }
        if(typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle){ return globalThis.crypto; }
        return null;
    }

    async function sha256SaveLibraryHex(value){
        const cryptoApi = getSaveLibraryCrypto();
        if(!cryptoApi || !cryptoApi.subtle || typeof TextEncoder !== "function"){
            throw new Error("Stable identity migration requires the browser SHA-256 API.");
        }
        const bytes = new TextEncoder().encode(String(value));
        const digest = await cryptoApi.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    }

    async function deriveStableLibraryId(kind, seed){
        const digest = await sha256SaveLibraryHex(`career-mode-showdown:${kind}:v1:${String(seed)}`);
        return `${kind}_${digest.slice(0, ID_HEX_LENGTH)}`;
    }

    function getExistingLibrarySaveId(showdown){
        const identity = showdown && saveLibraryIsPlainObject(showdown.identity) ? showdown.identity : null;
        const candidate = identity && typeof identity.saveId === "string" ? identity.saveId.trim() : "";
        return candidate || "";
    }

    async function getOrDeriveLibrarySaveId(showdown){
        const existing = getExistingLibrarySaveId(showdown);
        if(existing){ return existing; }
        if(!showdown || showdown.id === null || showdown.id === undefined || String(showdown.id).trim() === ""){
            throw new Error("Cannot migrate a Showdown without its existing stable record ID.");
        }
        return deriveStableLibraryId("save", `legacy-id:${String(showdown.id)}`);
    }

    async function buildLibrarySeasonIdentities(showdown, saveId){
        const rounds = Array.isArray(showdown.rounds) ? showdown.rounds : [];
        const seenRoundNumbers = new Set();
        const output = [];
        for(let index = 0; index < rounds.length; index += 1){
            const round = cloneSaveLibraryValue(rounds[index]);
            if(!saveLibraryIsPlainObject(round)){
                throw new Error(`Season ${index + 1} is not a valid record.`);
            }
            const roundNumber = Number(round.roundNumber);
            if(!Number.isInteger(roundNumber) || roundNumber < 1){
                throw new Error(`Season ${index + 1} has an invalid round number.`);
            }
            if(seenRoundNumbers.has(roundNumber)){
                throw new Error(`Showdown ${String(showdown.id)} contains duplicate Season ${roundNumber} records.`);
            }
            seenRoundNumbers.add(roundNumber);
            if(typeof round.seasonId !== "string" || !round.seasonId.trim()){
                round.seasonId = await deriveStableLibraryId("season", `${saveId}:round:${roundNumber}`);
            }
            output.push(round);
        }
        return output;
    }

    async function migrateLibraryShowdownIdentity(showdown, managerProfileIds = null){
        if(!saveLibraryIsPlainObject(showdown)){
            throw new Error("Showdown record is not an object.");
        }
        const migrated = cloneSaveLibraryValue(showdown);
        const saveId = await getOrDeriveLibrarySaveId(migrated);
        const existingIdentity = saveLibraryIsPlainObject(migrated.identity) ? migrated.identity : {};
        const existingProfiles = saveLibraryIsPlainObject(existingIdentity.managerProfileIds)
            ? existingIdentity.managerProfileIds
            : {};
        migrated.identity = {
            ...existingIdentity,
            schemaVersion: SHOWDOWN_IDENTITY_SCHEMA_VERSION,
            saveId,
            managerProfileIds: {
                playerOne: managerProfileIds && managerProfileIds.playerOne
                    ? managerProfileIds.playerOne
                    : (typeof existingProfiles.playerOne === "string" && existingProfiles.playerOne.trim() ? existingProfiles.playerOne : null),
                playerTwo: managerProfileIds && managerProfileIds.playerTwo
                    ? managerProfileIds.playerTwo
                    : (typeof existingProfiles.playerTwo === "string" && existingProfiles.playerTwo.trim() ? existingProfiles.playerTwo : null)
            }
        };
        migrated.rounds = await buildLibrarySeasonIdentities(migrated, saveId);
        return migrated;
    }

    async function createMigrationActiveProfiles(showdown, saveId){
        const managers = saveLibraryIsPlainObject(showdown.managers) ? showdown.managers : {};
        const profiles = [];
        const refs = {};
        for(const role of ["playerOne", "playerTwo"]){
            const displayName = typeof managers[role] === "string" && managers[role].trim()
                ? managers[role].trim()
                : (role === "playerOne" ? "Manager 1" : "Manager 2");
            const profileId = await deriveStableLibraryId("profile", `${saveId}:${role}`);
            refs[role] = profileId;
            profiles.push({
                schemaVersion: PROFILE_SCHEMA_VERSION,
                profileId,
                displayName,
                source: { kind: "singleton-active-migration", saveId, role }
            });
        }
        return { profiles, refs };
    }

    function validateLegacyMigrationInput(legacyShowdowns){
        if(!Array.isArray(legacyShowdowns)){
            return { ok: false, error: "Legacy history must be an array." };
        }
        const byId = new Map();
        const unique = [];
        let exactDuplicatesRemoved = 0;
        for(let index = 0; index < legacyShowdowns.length; index += 1){
            const record = legacyShowdowns[index];
            if(!saveLibraryIsPlainObject(record)){
                return { ok: false, error: `Legacy record ${index + 1} is not an object.` };
            }
            if(record.id === null || record.id === undefined || String(record.id).trim() === ""){
                return { ok: false, error: `Legacy record ${index + 1} has no Showdown ID.` };
            }
            const id = String(record.id);
            const signature = canonicalSaveLibraryString(record);
            if(byId.has(id)){
                if(byId.get(id) !== signature){
                    return { ok: false, error: `Legacy contains conflicting records with Showdown ID ${id}.`, conflictId: id };
                }
                exactDuplicatesRemoved += 1;
                continue;
            }
            byId.set(id, signature);
            unique.push(record);
        }
        return { ok: true, unique, exactDuplicatesRemoved };
    }

    async function buildSingletonSaveLibraryMigrationPlan(input){
        const source = input && typeof input === "object" ? input : {};
        const active = source.activeShowdown == null ? null : source.activeShowdown;
        const legacy = Array.isArray(source.legacyShowdowns) ? source.legacyShowdowns : [];
        const legacyCheck = validateLegacyMigrationInput(legacy);
        if(!legacyCheck.ok){
            return { ok: false, status: "legacy-conflict", errors: [legacyCheck.error], conflictId: legacyCheck.conflictId || null };
        }
        if(active !== null && !saveLibraryIsPlainObject(active)){
            return { ok: false, status: "active-invalid", errors: ["Active Showdown is not an object."] };
        }

        let activeSaveId = null;
        let profiles = [];
        let activeProfileRefs = null;
        let migratedActive = null;
        if(active){
            activeSaveId = await getOrDeriveLibrarySaveId(active);
            const activeProfiles = await createMigrationActiveProfiles(active, activeSaveId);
            profiles = activeProfiles.profiles;
            activeProfileRefs = activeProfiles.refs;
            migratedActive = await migrateLibraryShowdownIdentity(active, activeProfileRefs);
        }

        const migratedLegacy = [];
        const mappingRequired = [];
        for(let index = 0; index < legacyCheck.unique.length; index += 1){
            const record = legacyCheck.unique[index];
            const recordSaveId = await getOrDeriveLibrarySaveId(record);
            const sameAsActiveIdentity = Boolean(active && String(record.id) === String(active.id));
            const refs = sameAsActiveIdentity ? activeProfileRefs : null;
            const migrated = await migrateLibraryShowdownIdentity(record, refs);
            migratedLegacy.push(migrated);
            if(!sameAsActiveIdentity){
                const names = saveLibraryIsPlainObject(record.managers) ? record.managers : {};
                mappingRequired.push({
                    legacyIndex: index,
                    saveId: recordSaveId,
                    playerOne: typeof names.playerOne === "string" ? names.playerOne : "Manager 1",
                    playerTwo: typeof names.playerTwo === "string" ? names.playerTwo : "Manager 2"
                });
            }
        }

        const library = {
            schemaVersion: SAVE_LIBRARY_SCHEMA_VERSION,
            activeSaveId,
            profiles,
            saves: migratedActive ? [{ saveId: activeSaveId, showdown: migratedActive }] : [],
            migration: {
                source: "singleton-active-showdown",
                exactLegacyDuplicatesRemoved: legacyCheck.exactDuplicatesRemoved,
                legacyIdentityMappingRequired: mappingRequired.length
            }
        };

        return {
            ok: true,
            status: "ready",
            library,
            legacyShowdowns: migratedLegacy,
            mappingRequired,
            relationships: {
                activeMatchesLegacy: Boolean(active && legacyCheck.unique.some(record => String(record.id) === String(active.id)))
            }
        };
    }

    function parseSaveLibraryRawJson(raw, label, expected){
        if(raw === null){ return { ok: true, value: expected === "array" ? [] : null }; }
        try{
            const value = JSON.parse(raw);
            if(expected === "object" && !saveLibraryIsPlainObject(value)){
                return { ok: false, error: `${label} does not contain an object.` };
            }
            if(expected === "array" && !Array.isArray(value)){
                return { ok: false, error: `${label} does not contain an array.` };
            }
            return { ok: true, value };
        }catch(error){
            return { ok: false, error: `${label} contains unreadable JSON.` };
        }
    }

    function validateLocalSaveLibrary(library){
        const errors = [];
        if(!saveLibraryIsPlainObject(library)){ return ["Save Library is not an object."]; }
        if(Number(library.schemaVersion) !== SAVE_LIBRARY_SCHEMA_VERSION){ errors.push(`Save Library schema must be v${SAVE_LIBRARY_SCHEMA_VERSION}.`); }
        if(library.activeSaveId !== null && typeof library.activeSaveId !== "string"){ errors.push("Save Library activeSaveId must be a string or null."); }
        if(!Array.isArray(library.profiles)){ errors.push("Save Library profiles must be an array."); }
        if(!Array.isArray(library.saves)){ errors.push("Save Library saves must be an array."); }
        if(Array.isArray(library.profiles)){
            const seenProfiles = new Set();
            library.profiles.forEach((profile, index) => {
                if(!saveLibraryIsPlainObject(profile) || typeof profile.profileId !== "string" || !profile.profileId.trim()){
                    errors.push(`Profile ${index + 1} has an invalid profileId.`);
                    return;
                }
                if(seenProfiles.has(profile.profileId)){ errors.push(`Duplicate profileId ${profile.profileId}.`); }
                seenProfiles.add(profile.profileId);
                if(typeof profile.displayName !== "string" || !profile.displayName.trim()){ errors.push(`Profile ${index + 1} has no display name.`); }
            });
        }
        if(Array.isArray(library.saves)){
            const seenSaves = new Set();
            const knownProfiles = new Set(Array.isArray(library.profiles)
                ? library.profiles.filter(saveLibraryIsPlainObject).map(profile => profile.profileId)
                : []);
            library.saves.forEach((entry, index) => {
                if(!saveLibraryIsPlainObject(entry) || typeof entry.saveId !== "string" || !entry.saveId.trim()){
                    errors.push(`Save ${index + 1} has an invalid saveId.`);
                    return;
                }
                if(seenSaves.has(entry.saveId)){ errors.push(`Duplicate saveId ${entry.saveId}.`); }
                seenSaves.add(entry.saveId);
                if(!saveLibraryIsPlainObject(entry.showdown)){ errors.push(`Save ${index + 1} has no Showdown record.`); return; }
                if(!saveLibraryIsPlainObject(entry.showdown.identity) || entry.showdown.identity.saveId !== entry.saveId){
                    errors.push(`Save ${index + 1} identity does not match its registry saveId.`);
                    return;
                }
                const refs = saveLibraryIsPlainObject(entry.showdown.identity.managerProfileIds)
                    ? entry.showdown.identity.managerProfileIds
                    : {};
                for(const role of ["playerOne", "playerTwo"]){
                    const profileId = refs[role];
                    if(profileId !== null && profileId !== undefined && !knownProfiles.has(profileId)){
                        errors.push(`Save ${index + 1} ${role} profile reference is not present in the Save Library.`);
                    }
                }
                const seenSeasons = new Set();
                for(const round of Array.isArray(entry.showdown.rounds) ? entry.showdown.rounds : []){
                    if(!saveLibraryIsPlainObject(round) || typeof round.seasonId !== "string" || !round.seasonId.trim()){
                        errors.push(`Save ${index + 1} contains a Season without a stable seasonId.`);
                        continue;
                    }
                    if(seenSeasons.has(round.seasonId)){ errors.push(`Save ${index + 1} contains duplicate seasonId ${round.seasonId}.`); }
                    seenSeasons.add(round.seasonId);
                }
            });
            if(library.activeSaveId !== null && !seenSaves.has(library.activeSaveId)){
                errors.push("Save Library activeSaveId does not identify a stored save.");
            }
        }
        return errors;
    }

    async function buildRawSingletonSaveLibraryMigrationPlan(rawInput){
        const raw = rawInput && typeof rawInput === "object" ? rawInput : {};
        if(saveLibraryOwn(raw, "saveLibrary") && raw.saveLibrary !== null){
            const existing = parseSaveLibraryRawJson(raw.saveLibrary, "Save Library storage", "object");
            if(!existing.ok){
                return { ok: false, status: "existing-library-corrupt", errors: [existing.error], candidateRaw: {} };
            }
            const errors = validateLocalSaveLibrary(existing.value);
            return errors.length
                ? { ok: false, status: "existing-library-invalid", errors, candidateRaw: {} }
                : { ok: true, status: "already-migrated", library: existing.value, candidateRaw: {}, expectedRaw: cloneSaveLibraryValue(raw) };
        }

        const active = parseSaveLibraryRawJson(raw.activeShowdown ?? null, "Active Showdown storage", "object");
        if(!active.ok){ return { ok: false, status: "source-corrupt", errors: [active.error], candidateRaw: {} }; }
        const legacy = parseSaveLibraryRawJson(raw.legacyShowdowns ?? null, "Legacy storage", "array");
        if(!legacy.ok){ return { ok: false, status: "source-corrupt", errors: [legacy.error], candidateRaw: {} }; }
        let plan;
        try{
            plan = await buildSingletonSaveLibraryMigrationPlan({ activeShowdown: active.value, legacyShowdowns: legacy.value });
        }catch(error){
            return {
                ok: false,
                status: "identity-migration-unavailable",
                errors: [error && error.message ? error.message : String(error)],
                candidateRaw: {}
            };
        }
        if(!plan.ok){ return { ...plan, candidateRaw: {} }; }
        const validationErrors = validateLocalSaveLibrary(plan.library);
        if(validationErrors.length){
            return { ok: false, status: "candidate-invalid", errors: validationErrors, candidateRaw: {} };
        }
        const candidateRaw = {
            saveLibrary: JSON.stringify(plan.library),
            legacyShowdowns: JSON.stringify(plan.legacyShowdowns),
            activeShowdown: null
        };
        return {
            ...plan,
            status: "ready",
            candidateRaw,
            expectedRaw: {
                saveLibrary: raw.saveLibrary ?? null,
                activeShowdown: raw.activeShowdown ?? null,
                legacyShowdowns: raw.legacyShowdowns ?? null,
                preferences: raw.preferences ?? null
            }
        };
    }

    const api = Object.freeze({
        SAVE_LIBRARY_SCHEMA_VERSION,
        SHOWDOWN_IDENTITY_SCHEMA_VERSION,
        PROFILE_SCHEMA_VERSION,
        SAVE_LIBRARY_STORAGE_KEY,
        LEGACY_ACTIVE_STORAGE_KEY,
        LEGACY_STORAGE_KEY,
        PREFERENCES_STORAGE_KEY,
        deriveStableId: deriveStableLibraryId,
        migrateShowdownIdentity: migrateLibraryShowdownIdentity,
        buildSingletonMigrationPlan: buildSingletonSaveLibraryMigrationPlan,
        buildRawSingletonMigrationPlan: buildRawSingletonSaveLibraryMigrationPlan,
        validateSaveLibrary: validateLocalSaveLibrary,
        canonicalString: canonicalSaveLibraryString
    });

    if(root){ root.CareerModeSaveLibraryFoundation = api; }
    if(typeof module !== "undefined" && module.exports){ module.exports = api; }
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
