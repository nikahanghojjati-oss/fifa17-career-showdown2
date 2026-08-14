(function initializeSaveLibraryPersistence(root){
    "use strict";

    const SAVE_LIBRARY_PERSISTENCE_RAW_NAMES = Object.freeze(["saveLibrary", "activeShowdown", "legacyShowdowns", "preferences"]);
    const SAVE_LIBRARY_PERSISTENCE_TRANSACTION_ORDER = Object.freeze(["legacyShowdowns", "saveLibrary", "preferences", "activeShowdown"]);
    let saveLibraryPersistenceInFlight = false;

    function saveLibraryPersistenceOwn(object, key){
        return Object.prototype.hasOwnProperty.call(object, key);
    }

    function cloneSaveLibraryPersistenceValue(value){
        if(value === undefined){ return undefined; }
        if(value === null){ return null; }
        if(typeof structuredClone === "function"){
            try{ return structuredClone(value); }catch(error){ /* JSON fallback below. */ }
        }
        return JSON.parse(JSON.stringify(value));
    }

    function validateSaveLibraryPersistenceRawSnapshot(raw){
        if(!raw || typeof raw !== "object" || Array.isArray(raw)){
            return ["Exact Save Library migration snapshot is unavailable."];
        }
        const errors = [];
        for(const name of SAVE_LIBRARY_PERSISTENCE_RAW_NAMES){
            if(!saveLibraryPersistenceOwn(raw, name)){
                errors.push(`Exact Save Library migration snapshot is missing ${name}.`);
                continue;
            }
            if(raw[name] !== null && typeof raw[name] !== "string"){
                errors.push(`Exact Save Library migration snapshot has an invalid ${name} raw value.`);
            }
        }
        return errors;
    }

    function parseSaveLibraryPersistenceRaw(raw, label, expected){
        if(raw === null){ return { ok: true, value: expected === "array" ? [] : null }; }
        try{
            const value = JSON.parse(raw);
            if(expected === "object" && (!value || typeof value !== "object" || Array.isArray(value))){
                throw new Error(`${label} is not an object.`);
            }
            if(expected === "array" && !Array.isArray(value)){
                throw new Error(`${label} is not an array.`);
            }
            return { ok: true, value };
        }catch(error){
            return { ok: false, error: error && error.message ? error.message : `${label} contains unreadable JSON.` };
        }
    }

    function getSaveLibraryPersistenceFoundation(){
        const foundation = root && root.CareerModeSaveLibraryFoundation;
        if(!foundation
            || typeof foundation.buildRawSingletonMigrationPlan !== "function"
            || typeof foundation.buildSingletonMigrationPlan !== "function"
            || typeof foundation.validateSaveLibrary !== "function"
            || typeof foundation.canonicalString !== "function"){
            return null;
        }
        return foundation;
    }

    function getSaveLibraryPersistenceCore(library){
        return {
            schemaVersion: library.schemaVersion,
            activeSaveId: library.activeSaveId,
            profiles: library.profiles,
            saves: library.saves
        };
    }

    async function buildInterruptedSaveLibraryPersistencePlan(raw, foundation){
        const existing = parseSaveLibraryPersistenceRaw(raw.saveLibrary, "Save Library storage", "object");
        const active = parseSaveLibraryPersistenceRaw(raw.activeShowdown, "Active Showdown storage", "object");
        const legacy = parseSaveLibraryPersistenceRaw(raw.legacyShowdowns, "Legacy storage", "array");
        if(!existing.ok || !active.ok || !legacy.ok){
            return {
                ok: false,
                status: "dual-authority-conflict",
                errors: [existing.error, active.error, legacy.error].filter(Boolean),
                candidateRaw: {},
                expectedRaw: cloneSaveLibraryPersistenceValue(raw)
            };
        }
        const existingErrors = foundation.validateSaveLibrary(existing.value);
        if(existingErrors.length){
            return { ok: false, status: "dual-authority-conflict", errors: existingErrors, candidateRaw: {}, expectedRaw: cloneSaveLibraryPersistenceValue(raw) };
        }
        let planned;
        try{
            planned = await foundation.buildSingletonMigrationPlan({ activeShowdown: active.value, legacyShowdowns: legacy.value });
        }catch(error){
            return {
                ok: false,
                status: "dual-authority-conflict",
                errors: [error && error.message ? error.message : String(error)],
                candidateRaw: {},
                expectedRaw: cloneSaveLibraryPersistenceValue(raw)
            };
        }
        if(!planned || planned.ok !== true){
            return {
                ok: false,
                status: "dual-authority-conflict",
                errors: planned && Array.isArray(planned.errors) ? planned.errors.slice() : ["Interrupted Save Library migration state could not be verified."],
                candidateRaw: {},
                expectedRaw: cloneSaveLibraryPersistenceValue(raw)
            };
        }
        const existingCore = foundation.canonicalString(getSaveLibraryPersistenceCore(existing.value));
        const plannedCore = foundation.canonicalString(getSaveLibraryPersistenceCore(planned.library));
        const plannedLegacyRaw = JSON.stringify(planned.legacyShowdowns);
        if(existingCore !== plannedCore || raw.legacyShowdowns !== plannedLegacyRaw){
            return {
                ok: false,
                status: "dual-authority-conflict",
                errors: ["Save Library and singleton active storage do not form a verified interrupted migration state."],
                candidateRaw: {},
                expectedRaw: cloneSaveLibraryPersistenceValue(raw)
            };
        }
        return {
            ok: true,
            status: "resume-ready",
            library: existing.value,
            candidateRaw: {
                saveLibrary: raw.saveLibrary,
                activeShowdown: null,
                legacyShowdowns: raw.legacyShowdowns,
                preferences: raw.preferences
            },
            expectedRaw: cloneSaveLibraryPersistenceValue(raw),
            transactionOrder: SAVE_LIBRARY_PERSISTENCE_TRANSACTION_ORDER.slice()
        };
    }

    async function planCareerModeSaveLibraryPersistenceTransition(rawInput){
        const raw = cloneSaveLibraryPersistenceValue(rawInput);
        const snapshotErrors = validateSaveLibraryPersistenceRawSnapshot(raw);
        if(snapshotErrors.length){
            return { ok: false, status: "snapshot-invalid", errors: snapshotErrors, candidateRaw: {}, expectedRaw: null };
        }
        const foundation = getSaveLibraryPersistenceFoundation();
        if(!foundation){
            return { ok: false, status: "foundation-unavailable", errors: ["Save Library identity foundation is unavailable."], candidateRaw: {}, expectedRaw: raw };
        }
        if(raw.saveLibrary !== null && raw.activeShowdown !== null){
            return buildInterruptedSaveLibraryPersistencePlan(raw, foundation);
        }
        const planned = await foundation.buildRawSingletonMigrationPlan(raw);
        if(!planned || planned.ok !== true){
            return {
                ...(planned && typeof planned === "object" ? planned : {}),
                ok: false,
                status: planned && planned.status ? planned.status : "planning-failed",
                errors: planned && Array.isArray(planned.errors) ? planned.errors.slice() : ["Save Library migration planning failed."],
                candidateRaw: {},
                expectedRaw: raw
            };
        }
        if(planned.status === "already-migrated"){
            return {
                ...planned,
                ok: true,
                status: "already-migrated",
                candidateRaw: {},
                expectedRaw: raw,
                transactionOrder: SAVE_LIBRARY_PERSISTENCE_TRANSACTION_ORDER.slice()
            };
        }
        if(planned.status !== "ready"){
            return { ok: false, status: "planning-failed", errors: ["Save Library migration planner did not produce a commit-ready candidate."], candidateRaw: {}, expectedRaw: raw };
        }
        return {
            ...planned,
            ok: true,
            status: "ready",
            candidateRaw: {
                saveLibrary: planned.candidateRaw.saveLibrary,
                activeShowdown: null,
                legacyShowdowns: planned.candidateRaw.legacyShowdowns,
                preferences: raw.preferences
            },
            expectedRaw: raw,
            transactionOrder: SAVE_LIBRARY_PERSISTENCE_TRANSACTION_ORDER.slice()
        };
    }

    async function migrateCareerModeSaveLibraryPersistence(){
        if(saveLibraryPersistenceInFlight){
            return { ok: false, status: "busy", errors: ["A Save Library persistence migration is already in progress."] };
        }
        saveLibraryPersistenceInFlight = true;
        try{
            if(typeof root.flushPendingApplicationWrites !== "function" || root.flushPendingApplicationWrites() === false){
                return { ok: false, status: "flush-failed", errors: ["Pending application writes could not be flushed safely."] };
            }
            if(typeof root.captureCareerModeRawSaveLibraryMigrationSnapshot !== "function"){
                return { ok: false, status: "snapshot-unavailable", errors: ["Exact Save Library migration snapshot authority is unavailable."] };
            }
            const snapshot = root.captureCareerModeRawSaveLibraryMigrationSnapshot();
            if(!snapshot || snapshot.ok !== true || !snapshot.raw){
                return {
                    ok: false,
                    status: "snapshot-unavailable",
                    failedKeys: snapshot && Array.isArray(snapshot.failedKeys) ? snapshot.failedKeys.slice() : SAVE_LIBRARY_PERSISTENCE_RAW_NAMES.slice(),
                    errors: ["Exact Save Library migration snapshot could not be captured. Nothing was written."]
                };
            }
            const plan = await planCareerModeSaveLibraryPersistenceTransition(snapshot.raw);
            if(!plan.ok || plan.status === "already-migrated"){
                return { ...plan, transaction: null };
            }
            if(typeof root.applyCareerModeRawStorageTransaction !== "function"){
                return { ok: false, status: "transaction-unavailable", plan, errors: ["Canonical storage transaction authority is unavailable."] };
            }
            const transaction = root.applyCareerModeRawStorageTransaction(
                plan.candidateRaw,
                plan.expectedRaw,
                { order: plan.transactionOrder, guardRequestedBeforeEachWrite: true }
            );
            if(transaction && transaction.ok === true){
                return {
                    ok: true,
                    status: plan.status === "resume-ready" ? "resumed" : "migrated",
                    plan,
                    transaction,
                    errors: []
                };
            }
            if(transaction && transaction.failurePhase === "precondition" && transaction.rollbackVerified !== false){
                return {
                    ok: false,
                    status: "stale-state",
                    plan,
                    transaction,
                    changedKeys: Array.isArray(transaction.preconditionMismatches) ? transaction.preconditionMismatches.slice() : [],
                    errors: ["Canonical storage changed at the Save Library migration boundary. No unverified migration result was accepted."]
                };
            }
            return {
                ok: false,
                status: transaction && transaction.status ? transaction.status : "transaction-failed",
                plan,
                transaction,
                errors: ["Save Library persistence migration did not commit successfully."]
            };
        }catch(error){
            return { ok: false, status: "migration-error", errors: [error && error.message ? error.message : String(error)] };
        }finally{
            saveLibraryPersistenceInFlight = false;
        }
    }

    const api = Object.freeze({
        rawNames: SAVE_LIBRARY_PERSISTENCE_RAW_NAMES,
        transactionOrder: SAVE_LIBRARY_PERSISTENCE_TRANSACTION_ORDER,
        planTransition: planCareerModeSaveLibraryPersistenceTransition,
        migrate: migrateCareerModeSaveLibraryPersistence,
        isInFlight: () => saveLibraryPersistenceInFlight
    });

    if(root){ root.CareerModeSaveLibraryPersistence = api; }
    if(typeof module !== "undefined" && module.exports){ module.exports = api; }
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
