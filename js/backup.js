/* =====================================================
   Career Mode Showdown v1.1.0
   Candidate A — Versioned Backup Envelope + Non-Mutating Export
===================================================== */

const CAREER_MODE_BACKUP_FORMAT_ID = "career-mode-showdown-backup";
const CAREER_MODE_BACKUP_FORMAT_VERSION = 1;
const CAREER_MODE_BACKUP_CHECKSUM_ALGORITHM = "SHA-256";

function getBackupApplicationVersion(){
    return typeof APP_VERSION === "string" ? APP_VERSION : "1.1.0";
}

function getBackupRuntimeRevision(){
    const meta = document.querySelector('meta[name="app-asset-revision"]');
    return meta && meta.content ? meta.content.trim() : "unknown";
}

function canonicalizeBackupValue(value){
    if(Array.isArray(value)){
        return value.map(canonicalizeBackupValue);
    }
    if(value && typeof value === "object"){
        return Object.keys(value).sort().reduce((result, key) => {
            result[key] = canonicalizeBackupValue(value[key]);
            return result;
        }, {});
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
    if(typeof window.captureCareerModeBackupSnapshot !== "function"){
        throw new Error("The storage snapshot authority is unavailable.");
    }

    const snapshot = window.captureCareerModeBackupSnapshot();
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
    if(envelope.formatVersion !== CAREER_MODE_BACKUP_FORMAT_VERSION){
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
