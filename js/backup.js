/* =====================================================
   Career Mode Showdown v1.1.0
   Candidate A — Versioned Backup Envelope + Non-Mutating Export
===================================================== */

const CAREER_MODE_BACKUP_FORMAT_ID = "career-mode-showdown-backup";
const CAREER_MODE_BACKUP_FORMAT_VERSION = 2;
const CAREER_MODE_BACKUP_CHECKSUM_ALGORITHM = "SHA-256";

function getBackupRuntimeRevision(){
    const meta = document.querySelector('meta[name="app-asset-revision"]');
    return meta && meta.content ? meta.content.trim() : "unknown";
}

function getBackupApplicationVersion(){
    if(typeof APP_VERSION === "string" && APP_VERSION.trim()){ return APP_VERSION.trim(); }
    const match = getBackupRuntimeRevision().match(/^(\d+\.\d+\.\d+)-r\d+$/);
    return match ? match[1] : "unknown";
}

function isBackupObject(value){
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cloneBackupValue(value){
    if(value === null || value === undefined){ return value ?? null; }
    if(typeof structuredClone === "function"){
        try{ return structuredClone(value); }catch(error){ /* JSON fallback below. */ }
    }
    return JSON.parse(JSON.stringify(value));
}

function inspectBackupRecord(raw, validator, label){
    if(raw === null || raw === undefined){ return { state: "missing", raw: null, value: null, warning: null }; }
    try{
        const value = JSON.parse(raw);
        if(!validator(value)){ throw new Error(`${label} has an unsupported shape.`); }
        return { state: "valid", raw, value, warning: null };
    }catch(error){
        return { state: "corrupt", raw, value: null, warning: `${label} could not be safely interpreted: ${error.message || String(error)}` };
    }
}

function captureBackupRawProjection(){
    if(window.CareerModeSaveLibraryRuntime && typeof window.CareerModeSaveLibraryRuntime.createBackupProjection === "function"){
        const projected = window.CareerModeSaveLibraryRuntime.createBackupProjection();
        if(!projected || projected.ok !== true || !projected.raw){
            throw new Error("Backup cancelled because Save Library authority could not be projected exactly.");
        }
        return {
            raw: projected.raw,
            warnings: Array.isArray(projected.warnings) ? projected.warnings.slice() : [],
            recovery: projected.recovery && typeof projected.recovery === "object" ? cloneBackupValue(projected.recovery) : null,
            activeSource: projected.sourceRaw && projected.sourceRaw.saveLibrary !== null ? "save-library" : null
        };
    }
    if(typeof window.captureCareerModeRawRestoreSnapshot !== "function"){
        throw new Error("The exact storage snapshot authority is unavailable.");
    }
    const exactSnapshot = window.captureCareerModeRawRestoreSnapshot();
    if(!exactSnapshot || exactSnapshot.ok !== true || !exactSnapshot.raw){
        const failedKeys = Array.isArray(exactSnapshot?.failedKeys) && exactSnapshot.failedKeys.length
            ? exactSnapshot.failedKeys.join(", ")
            : "unknown canonical storage";
        throw new Error(`Backup cancelled because canonical storage could not be read exactly: ${failedKeys}.`);
    }
    return { raw: exactSnapshot.raw, warnings: [], recovery: null, activeSource: null };
}

function buildCareerModeBackupSnapshot(){
    const projection = captureBackupRawProjection();
    const raw = projection.raw;
    const saveLibraryRecord = inspectBackupRecord(raw.saveLibrary, isBackupObject, "Save Library storage");
    const activeRecord = inspectBackupRecord(raw.activeShowdown, isBackupObject, "Active Showdown storage");
    const legacyRecord = inspectBackupRecord(raw.legacyShowdowns, value => Array.isArray(value) && value.every(isBackupObject), "Legacy storage");
    const preferencesRecord = inspectBackupRecord(raw.preferences, isBackupObject, "Preferences storage");
    const keys = typeof window.getCareerModeStorageKeys === "function" ? window.getCareerModeStorageKeys() : {};
    const warnings = projection.warnings.slice();
    const recovery = projection.recovery ? cloneBackupValue(projection.recovery) : {};

    [
        ["saveLibrary", keys.saveLibrary || "careerModeShowdown.saveLibrary", saveLibraryRecord],
        ["activeShowdown", keys.activeShowdown || "careerModeShowdown.activeShowdown", activeRecord],
        ["legacyShowdowns", keys.legacyShowdowns, legacyRecord],
        ["preferences", keys.preferences, preferencesRecord]
    ].forEach(([name, storageKey, record]) => {
        if(record.state !== "corrupt"){ return; }
        warnings.push(record.warning);
        recovery[name] = { storageKey: storageKey || name, raw: record.raw, reason: record.warning };
    });

    let activeShowdown = activeRecord.state === "valid" ? cloneBackupValue(activeRecord.value) : null;
    let activeSource = activeRecord.state === "valid" ? (projection.activeSource || "storage") : "none";
    if(!projection.activeSource && typeof currentShowdown !== "undefined" && isBackupObject(currentShowdown)){
        try{
            activeShowdown = cloneBackupValue(currentShowdown);
            activeSource = "runtime";
        }catch(error){
            warnings.push(`The in-memory active Showdown could not be cloned; persisted storage was used instead: ${error.message || String(error)}`);
        }
    }

    const saveLibrary = saveLibraryRecord.state === "valid" ? cloneBackupValue(saveLibraryRecord.value) : null;
    const legacyShowdowns = legacyRecord.state === "valid" ? cloneBackupValue(legacyRecord.value) : null;
    const preferences = preferencesRecord.state === "valid" ? cloneBackupValue(preferencesRecord.value) : null;
    const matchingLegacyIndex = activeShowdown && Array.isArray(legacyShowdowns)
        ? legacyShowdowns.findIndex(item => String(item.id) === String(activeShowdown.id))
        : -1;

    return {
        payload: { saveLibrary, activeShowdown, legacyShowdowns, preferences },
        counts: {
            activeShowdowns: activeShowdown ? 1 : 0,
            legacyShowdowns: Array.isArray(legacyShowdowns) ? legacyShowdowns.length : 0,
            preferenceRecords: preferences ? 1 : 0,
            saveLibrarySaves: saveLibrary && Array.isArray(saveLibrary.saves) ? saveLibrary.saves.length : 0,
            saveLibraryProfiles: saveLibrary && Array.isArray(saveLibrary.profiles) ? saveLibrary.profiles.length : 0
        },
        relationships: {
            activeSource,
            completedActiveMatchesLegacy: Boolean(activeShowdown && activeShowdown.status === "Completed" && matchingLegacyIndex >= 0),
            matchingLegacyIndex
        },
        storageState: {
            saveLibrary: saveLibraryRecord.state,
            activeShowdown: activeRecord.state,
            legacyShowdowns: legacyRecord.state,
            preferences: preferencesRecord.state
        },
        warnings,
        recovery: Object.keys(recovery).length ? recovery : null
    };
}

function canonicalizeBackupValue(value){
    if(Array.isArray(value)){
        return value.map(canonicalizeBackupValue);
    }
    if(value && typeof value === "object"){
        return Object.keys(value).sort().reduce((result, key) => {
            result[key] = canonicalizeBackupValue(value[key]);
            return result;
        }, Object.create(null));
    }
    return value;
}

function canonicalBackupString(value){
    return JSON.stringify(canonicalizeBackupValue(value));
}

async function sha256Hex(value){
    if(!window.crypto || !window.crypto.subtle || typeof TextEncoder !== "function"){
        throw new Error("This browser does not provide the secure SHA-256 API required for backup verification.");
    }
    const bytes = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function checksumInputForEnvelope(envelope){
    const copy = { ...envelope };
    delete copy.checksum;
    return canonicalBackupString(copy);
}

async function createCareerModeBackupEnvelope(){
    const snapshot = buildCareerModeBackupSnapshot();
    const envelope = {
        formatId: CAREER_MODE_BACKUP_FORMAT_ID,
        formatVersion: CAREER_MODE_BACKUP_FORMAT_VERSION,
        appVersion: getBackupApplicationVersion(),
        runtimeRevision: getBackupRuntimeRevision(),
        exportedAt: new Date().toISOString(),
        checksumAlgorithm: CAREER_MODE_BACKUP_CHECKSUM_ALGORITHM,
        counts: snapshot.counts,
        relationships: snapshot.relationships,
        storageState: snapshot.storageState,
        payload: snapshot.payload,
        warnings: snapshot.warnings,
        recovery: snapshot.recovery,
        checksum: ""
    };

    envelope.checksum = await sha256Hex(checksumInputForEnvelope(envelope));
    return envelope;
}

async function verifyCareerModeBackupEnvelopeChecksum(envelope){
    if(!envelope || envelope.formatId !== CAREER_MODE_BACKUP_FORMAT_ID){
        return false;
    }
    // Accept current formatVersion and legacy v1 so older backups remain readable
    if(envelope.formatVersion !== CAREER_MODE_BACKUP_FORMAT_VERSION && envelope.formatVersion !== 1){
        return false;
    }
    if(envelope.checksumAlgorithm !== CAREER_MODE_BACKUP_CHECKSUM_ALGORITHM || !envelope.checksum){
        return false;
    }
    const expected = await sha256Hex(checksumInputForEnvelope(envelope));
    return expected === envelope.checksum;
}

function serializeCareerModeBackupEnvelope(envelope){
    return `${JSON.stringify(envelope, null, 2)}\n`;
}

function createBackupFilename(exportedAt){
    const safeTimestamp = String(exportedAt || new Date().toISOString())
        .replace(/\.\d{3}Z$/, "Z")
        .replace(/:/g, "-");
    return `career-mode-showdown-backup-${safeTimestamp}.json`;
}

function downloadCareerModeBackupEnvelope(envelope){
    const serialized = serializeCareerModeBackupEnvelope(envelope);
    const blob = new Blob([serialized], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = createBackupFilename(envelope.exportedAt);
    link.hidden = true;
    document.body.appendChild(link);
    try{
        link.click();
    }finally{
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
    return envelope;
}

async function exportCareerModeBackup(){
    const envelope = await createCareerModeBackupEnvelope();
    return downloadCareerModeBackupEnvelope(envelope);
}

window.CAREER_MODE_BACKUP_FORMAT_ID = CAREER_MODE_BACKUP_FORMAT_ID;
window.CAREER_MODE_BACKUP_FORMAT_VERSION = CAREER_MODE_BACKUP_FORMAT_VERSION;
window.createCareerModeBackupEnvelope = createCareerModeBackupEnvelope;
window.verifyCareerModeBackupEnvelopeChecksum = verifyCareerModeBackupEnvelopeChecksum;
window.serializeCareerModeBackupEnvelope = serializeCareerModeBackupEnvelope;
window.downloadCareerModeBackupEnvelope = downloadCareerModeBackupEnvelope;
window.exportCareerModeBackup = exportCareerModeBackup;
