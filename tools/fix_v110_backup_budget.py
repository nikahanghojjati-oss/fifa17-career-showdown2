from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, text):
    (ROOT / path).write_text(text, encoding="utf-8")


# Keep storage.js as the only canonical browser-storage reader, but move
# backup-only parsing/validation into the lazy backup module so startup stays lean.
storage = read("js/storage.js")
start = storage.index("function isPlainStorageObject")
end = storage.index("function createDefaultApplicationPreferences")
compact_snapshot = '''function captureCareerModeBackupSnapshot(){
    return {
        activeShowdown: readStorageValue(STORAGE_KEY),
        legacyShowdowns: readStorageValue(LEGACY_STORAGE_KEY),
        preferences: readStorageValue(APPLICATION_PREFERENCES_KEY)
    };
}

'''
storage = storage[:start] + compact_snapshot + storage[end:]
write("js/storage.js", storage)

backup = r'''/* =====================================================
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

function isBackupRecordObject(value){
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function inspectBackupRecord(raw, validator, label){
    if(raw === null){
        return { state: "missing", raw: null, value: null, warning: null };
    }

    try{
        const value = JSON.parse(raw);
        if(!validator(value)){
            throw new Error(`${label} has an unsupported shape.`);
        }
        return { state: "valid", raw, value, warning: null };
    }catch(error){
        return {
            state: "corrupt",
            raw,
            value: null,
            warning: `${label} could not be safely interpreted: ${error.message || String(error)}`
        };
    }
}

function cloneBackupValue(value){
    if(typeof structuredClone === "function"){
        try{ return structuredClone(value); }catch(error){ /* JSON fallback below. */ }
    }
    return JSON.parse(JSON.stringify(value));
}

function buildCareerModeBackupSnapshot(rawSnapshot){
    if(!rawSnapshot || typeof window.getCareerModeStorageKeys !== "function"){
        throw new Error("The storage snapshot authority is unavailable.");
    }

    const keys = window.getCareerModeStorageKeys();
    const activeRecord = inspectBackupRecord(rawSnapshot.activeShowdown, isBackupRecordObject, "Active Showdown storage");
    const legacyRecord = inspectBackupRecord(
        rawSnapshot.legacyShowdowns,
        value => Array.isArray(value) && value.every(isBackupRecordObject),
        "Legacy storage"
    );
    const preferencesRecord = inspectBackupRecord(rawSnapshot.preferences, isBackupRecordObject, "Preferences storage");
    const warnings = [];
    const recovery = {};

    [
        ["activeShowdown", keys.activeShowdown, activeRecord],
        ["legacyShowdowns", keys.legacyShowdowns, legacyRecord],
        ["preferences", keys.preferences, preferencesRecord]
    ].forEach(([name, storageKey, record]) => {
        if(record.state === "corrupt"){
            warnings.push(record.warning);
            recovery[name] = { storageKey, raw: record.raw, reason: record.warning };
        }
    });

    let activeShowdown = activeRecord.state === "valid" ? activeRecord.value : null;
    let activeSource = activeRecord.state === "valid" ? "storage" : "none";

    if(typeof currentShowdown !== "undefined" && currentShowdown && isBackupRecordObject(currentShowdown)){
        try{
            activeShowdown = cloneBackupValue(currentShowdown);
            activeSource = "runtime";
        }catch(error){
            warnings.push(`The in-memory active Showdown could not be cloned; persisted storage was used instead: ${error.message || String(error)}`);
        }
    }

    const legacyShowdowns = legacyRecord.state === "valid" ? legacyRecord.value : null;
    const preferences = preferencesRecord.state === "valid" ? preferencesRecord.value : null;
    const matchingLegacyIndex = activeShowdown && Array.isArray(legacyShowdowns)
        ? legacyShowdowns.findIndex(item => String(item.id) === String(activeShowdown.id))
        : -1;

    return {
        payload: { activeShowdown, legacyShowdowns, preferences },
        counts: {
            activeShowdowns: activeShowdown ? 1 : 0,
            legacyShowdowns: Array.isArray(legacyShowdowns) ? legacyShowdowns.length : 0,
            preferenceRecords: preferences ? 1 : 0
        },
        relationships: {
            activeSource,
            completedActiveMatchesLegacy: Boolean(
                activeShowdown
                && activeShowdown.status === "Completed"
                && matchingLegacyIndex >= 0
            ),
            matchingLegacyIndex
        },
        storageState: {
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

    const snapshot = buildCareerModeBackupSnapshot(window.captureCareerModeBackupSnapshot());
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
    if(!envelope || envelope.formatId !== CAREER_MODE_BACKUP_FORMAT_ID){ return false; }
    if(envelope.formatVersion !== CAREER_MODE_BACKUP_FORMAT_VERSION){ return false; }
    if(envelope.checksumAlgorithm !== CAREER_MODE_BACKUP_CHECKSUM_ALGORITHM || !envelope.checksum){ return false; }
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
'''
write("js/backup.js", backup)

browser = read("tests/browser/backup-export-audit.cjs")
old_open = '''async function openLegacy(page){
    await page.evaluate(() => window.openOptionalModule("legacy"));
    await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
    const exportButton = page.getByRole("button", { name: "EXPORT BACKUP" });
    await exportButton.waitFor({ state: "visible" });
    return exportButton;
}
'''
new_open = '''async function openLegacy(page){
    await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });
    const opened = await page.evaluate(async () => window.openOptionalModule("legacy"));
    assert.equal(opened, true, "Legacy/Data Management must open from a stable Home route.");
    await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
    const exportButton = page.getByRole("button", { name: "EXPORT BACKUP" });
    await exportButton.waitFor({ state: "visible" });
    return exportButton;
}
'''
if browser.count(old_open) != 1:
    raise RuntimeError("Backup browser openLegacy helper did not match exactly once")
browser = browser.replace(old_open, new_open, 1)
write("tests/browser/backup-export-audit.cjs", browser)

handoff = read("CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_V1.1.0_CANDIDATE_A.md")
checkpoint = '''

## CI repair checkpoint — startup budget and browser route stability

The first clean-head v1.1.0 CI pass proved the backup/storage contracts, licensed football visuals, Transfer, League Confirmation, Settings, Season Review, Statistics, Home Bootstrap and visual-immersion contracts independently. Two Candidate A integration defects remained and were corrected without weakening gates:

- Candidate A backup parsing/validation moved from eager `js/storage.js` into lazy `js/backup.js`; `js/storage.js` remains the sole canonical browser-storage reader and now exposes only a compact read-only raw snapshot. This restores the existing 165,000-byte startup ceiling instead of raising it.
- The backup browser audit now waits for a stable visible Home route before opening lazy Legacy/Data Management and asserts that the route-sensitive optional-module open succeeds, removing a startup-navigation race rather than increasing the timeout.

No Candidate B import analysis or Candidate C restore writes were introduced.
'''
if "## CI repair checkpoint — startup budget and browser route stability" not in handoff:
    handoff += checkpoint
write("CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_V1.1.0_CANDIDATE_A.md", handoff)

print("v1.1.0 backup startup-budget repair generated")
