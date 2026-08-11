from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one exact match, found {count}")
    return text.replace(old, new, 1)


# ---------------------------------------------------------------------------
# js/storage.js — Candidate A read-only snapshot authority + two corruption fixes
# ---------------------------------------------------------------------------
storage = read("js/storage.js")

storage_helpers_anchor = '''function removeStorageValue(key){
    try{
        localStorage.removeItem(key);
        return true;
    }catch(error){
        reportStorageError("Unable to remove local save data", error);
        return false;
    }
}
'''

storage_helpers = storage_helpers_anchor + '''
function isPlainStorageObject(value){
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function inspectRawStorageRecord(key, validator, label){
    const raw = readStorageValue(key);
    if(raw === null){
        return { state: "missing", raw: null, value: null, warning: null };
    }

    try{
        const value = JSON.parse(raw);
        if(typeof validator === "function" && !validator(value)){
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

function validateActiveShowdownStorage(value){
    return isPlainStorageObject(value);
}

function validateLegacyStorage(value){
    return Array.isArray(value)
        && value.every(item => isPlainStorageObject(item));
}

function validatePreferencesStorage(value){
    return isPlainStorageObject(value);
}

function captureCareerModeBackupSnapshot(){
    const activeRecord = inspectRawStorageRecord(STORAGE_KEY, validateActiveShowdownStorage, "Active Showdown storage");
    const legacyRecord = inspectRawStorageRecord(LEGACY_STORAGE_KEY, validateLegacyStorage, "Legacy storage");
    const preferencesRecord = inspectRawStorageRecord(APPLICATION_PREFERENCES_KEY, validatePreferencesStorage, "Preferences storage");
    const warnings = [];
    const recovery = {};

    [
        ["activeShowdown", STORAGE_KEY, activeRecord],
        ["legacyShowdowns", LEGACY_STORAGE_KEY, legacyRecord],
        ["preferences", APPLICATION_PREFERENCES_KEY, preferencesRecord]
    ].forEach(([name, storageKey, record]) => {
        if(record.state === "corrupt"){
            warnings.push(record.warning);
            recovery[name] = {
                storageKey,
                raw: record.raw,
                reason: record.warning
            };
        }
    });

    let activeShowdown = activeRecord.state === "valid" ? cloneForStorage(activeRecord.value) : null;
    let activeSource = activeRecord.state === "valid" ? "storage" : "none";

    if(typeof currentShowdown !== "undefined" && currentShowdown && isPlainStorageObject(currentShowdown)){
        try{
            activeShowdown = cloneForStorage(currentShowdown);
            activeSource = "runtime";
        }catch(error){
            warnings.push(`The in-memory active Showdown could not be cloned; persisted storage was used instead: ${error.message || String(error)}`);
        }
    }

    const legacyShowdowns = legacyRecord.state === "valid" ? cloneForStorage(legacyRecord.value) : null;
    const preferences = preferencesRecord.state === "valid" ? cloneForStorage(preferencesRecord.value) : null;
    const matchingLegacyIndex = activeShowdown && Array.isArray(legacyShowdowns)
        ? legacyShowdowns.findIndex(item => String(item.id) === String(activeShowdown.id))
        : -1;

    return {
        payload: {
            activeShowdown,
            legacyShowdowns,
            preferences
        },
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
'''
storage = replace_once(storage, storage_helpers_anchor, storage_helpers, "storage helper insertion")

old_has_saved = '''function hasSavedShowdown(){
    if(activeSavePresenceKnown){
        return activeSavePresent;
    }

    const present = Boolean(readStorageValue(STORAGE_KEY));
    activeSavePresenceKnown = true;
    activeSavePresent = present;
    return present;
}
'''
new_has_saved = '''function hasSavedShowdown(){
    if(activeSavePresenceKnown){
        return activeSavePresent;
    }

    const record = inspectRawStorageRecord(STORAGE_KEY, validateActiveShowdownStorage, "Active Showdown storage");
    activeSavePresenceKnown = true;
    activeSavePresent = record.state === "valid";
    if(record.state === "corrupt"){
        reportStorageError("Unable to use the stored active showdown", new Error(record.warning));
    }
    return activeSavePresent;
}
'''
storage = replace_once(storage, old_has_saved, new_has_saved, "corrupt active-save false-positive fix")

old_legacy_load = '''    try{
        const parsed = JSON.parse(raw);
        legacyCache = Array.isArray(parsed)
            ? parsed.filter(item => item && typeof item === "object" && !Array.isArray(item))
            : [];
        return legacyCache.slice();
    }catch(error){
        reportStorageError("Unable to parse Legacy history", error);
        legacyCache = [];
        return [];
    }
'''
new_legacy_load = '''    try{
        const parsed = JSON.parse(raw);
        if(!Array.isArray(parsed)){
            throw new Error("Legacy history is not a valid array.");
        }
        if(parsed.some(item => !isPlainStorageObject(item))){
            throw new Error("Legacy history contains an invalid record shape.");
        }
        legacyCache = parsed.slice();
        return legacyCache.slice();
    }catch(error){
        reportStorageError("Unable to parse Legacy history", error);
        legacyCache = [];
        return [];
    }
'''
storage = replace_once(storage, old_legacy_load, new_legacy_load, "Legacy malformed-shape fix")

storage_export_anchor = '''window.initializeStorageLifecycle = initializeStorageLifecycle;
'''
storage_exports = '''window.captureCareerModeBackupSnapshot = captureCareerModeBackupSnapshot;
window.getCareerModeStorageKeys = () => ({
    activeShowdown: STORAGE_KEY,
    legacyShowdowns: LEGACY_STORAGE_KEY,
    preferences: APPLICATION_PREFERENCES_KEY
});
''' + storage_export_anchor
storage = replace_once(storage, storage_export_anchor, storage_exports, "storage backup API export")
write("js/storage.js", storage)


# ---------------------------------------------------------------------------
# js/backup.js — Candidate A envelope/checksum/download helper (no storage writes)
# ---------------------------------------------------------------------------
backup_js = r'''/* =====================================================
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
'''
write("js/backup.js", backup_js)


# ---------------------------------------------------------------------------
# js/optionalModules.js — load backup helper only with Legacy/Data Management
# ---------------------------------------------------------------------------
optional = read("js/optionalModules.js")
optional = optional.replace('return revision || "1.0.2-r1";', 'return revision || "1.1.0-r1";')
old_legacy_module = '''async function ensureLegacyModule(){
    const stylePromise = loadRuntimeStyle("legacy-ui", "css/legacy.css");
    await loadRuntimeScript(
        "legacy-ui",
        "js/legacy.js",
        () => typeof window.renderLegacy === "function"
    );
    await stylePromise;
}
'''
new_legacy_module = '''async function ensureLegacyModule(){
    const stylePromise = loadRuntimeStyle("legacy-ui", "css/legacy.css");
    await loadRuntimeScript(
        "backup-engine",
        "js/backup.js",
        () => typeof window.createCareerModeBackupEnvelope === "function"
            && typeof window.verifyCareerModeBackupEnvelopeChecksum === "function"
            && typeof window.exportCareerModeBackup === "function"
    );
    await loadRuntimeScript(
        "legacy-ui",
        "js/legacy.js",
        () => typeof window.renderLegacy === "function"
    );
    await stylePromise;
}
'''
optional = replace_once(optional, old_legacy_module, new_legacy_module, "Legacy optional backup loader")
write("js/optionalModules.js", optional)


# ---------------------------------------------------------------------------
# js/settings.js — correct fallback identity and describe backup capability
# ---------------------------------------------------------------------------
settings = read("js/settings.js")
settings = settings.replace("Career Mode Showdown v1.0.1", "Career Mode Showdown v1.1.0", 1)
settings = settings.replace('return typeof APP_VERSION === "string" ? APP_VERSION : "1.0.1";', 'return typeof APP_VERSION === "string" ? APP_VERSION : "1.1.0";', 1)
settings = settings.replace(
    '"Showdown deletion and full-reset actions stay centralized in Legacy, where the existing confirmations and rollback protections remain authoritative."',
    '"Backup export, Showdown deletion and full-reset actions stay centralized in Legacy. Export is read-only; destructive actions keep the existing confirmations and rollback protections."'
)
settings = settings.replace(
    '"Reset All Showdown Data removes active and Legacy competition data but intentionally keeps application preferences. Destructive actions always require confirmation."',
    '"Export Backup downloads active Showdown, Legacy and application preferences without changing local data. Reset All Showdown Data removes active and Legacy competition data but intentionally keeps application preferences."'
)
write("js/settings.js", settings)


# ---------------------------------------------------------------------------
# js/legacy.js — accessible export UI, single-flight guard, success feedback
# ---------------------------------------------------------------------------
legacy = read("js/legacy.js")
legacy = legacy.replace("   v0.16.0", "   v1.1.0", 1)
legacy = legacy.replace("let lastLegacyRenderedRevision = null;", "let lastLegacyRenderedRevision = null;\nlet backupExportInProgress = false;", 1)

old_delete_success = '''        if(deleteLegacyShowdownTransaction(showdown)){
            lastLegacyRenderedRevision = null;
            renderLegacy();
        }
'''
new_delete_success = '''        if(deleteLegacyShowdownTransaction(showdown)){
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(`Deleted "${showdown.name}" from local Legacy history.`, "success", 4200);
            }
            lastLegacyRenderedRevision = null;
            renderLegacy();
        }
'''
legacy = replace_once(legacy, old_delete_success, new_delete_success, "single Legacy delete success notice")

pattern = re.compile(r"function createLegacyDataControls\(history\)\{.*?\n\}\n\nfunction renderLegacy\(\)\{", re.S)
match = pattern.search(legacy)
if not match:
    raise RuntimeError("createLegacyDataControls function not found")

new_controls = r'''function createLegacyDataControls(history){
    const controls = document.createElement("section");
    controls.className = "legacyDataControls";
    const heading = document.createElement("h3");
    heading.textContent = "DATA MANAGEMENT";
    const description = document.createElement("p");
    description.textContent = "Download a checksum-protected local backup before destructive maintenance. Export is read-only: it does not change your active Showdown, Legacy history or application preferences.";

    const backupSummary = document.createElement("div");
    backupSummary.className = "legacyBackupSummary";
    const backupTitle = document.createElement("strong");
    backupTitle.textContent = "LOCAL BACKUP";
    const backupText = document.createElement("span");
    backupText.textContent = "Human-readable JSON · format v1 · SHA-256 corruption check · malformed current bytes preserved in recovery data";
    backupSummary.append(backupTitle, backupText);

    const buttons = document.createElement("div");
    buttons.className = "legacyControlButtons";

    const status = document.createElement("p");
    status.className = "legacyDataStatus";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = "Backup export is ready.";

    const exportBackup = document.createElement("button");
    exportBackup.type = "button";
    exportBackup.className = "compactButton primaryDataButton";
    exportBackup.textContent = "EXPORT BACKUP";
    exportBackup.addEventListener("click", async () => {
        if(backupExportInProgress){ return; }
        if(typeof window.exportCareerModeBackup !== "function"){
            status.textContent = "Backup export is unavailable in this browser session.";
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(status.textContent, "error", 9000);
            }
            return;
        }

        backupExportInProgress = true;
        exportBackup.disabled = true;
        exportBackup.setAttribute("aria-busy", "true");
        exportBackup.textContent = "BUILDING BACKUP…";
        status.textContent = "Building a read-only backup and verifying its checksum…";

        try{
            const envelope = await window.exportCareerModeBackup();
            const warningCount = Array.isArray(envelope && envelope.warnings) ? envelope.warnings.length : 0;
            status.textContent = warningCount
                ? `Backup downloaded with ${warningCount} recovery warning${warningCount === 1 ? "" : "s"}. Your stored bytes were not changed.`
                : "Backup downloaded successfully. Your stored bytes were not changed.";
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(status.textContent, "success", warningCount ? 7000 : 4200);
            }
        }catch(error){
            status.textContent = `Backup could not be created: ${error && error.message ? error.message : String(error)}`;
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(status.textContent, "error", 10000);
            }
        }finally{
            backupExportInProgress = false;
            exportBackup.disabled = false;
            exportBackup.removeAttribute("aria-busy");
            exportBackup.textContent = "EXPORT BACKUP";
        }
    });

    const deleteHistory = document.createElement("button");
    deleteHistory.type = "button";
    deleteHistory.className = "compactButton dangerButton";
    deleteHistory.textContent = "DELETE ALL LEGACY HISTORY";
    deleteHistory.addEventListener("click", () => {
        const active = currentShowdown || loadSavedShowdown();
        const completedActiveWillBeRemoved = Boolean(
            active && active.status === "Completed" && history.some(item => String(item.id) === String(active.id))
        );
        const warning = completedActiveWillBeRemoved
            ? "Delete every archived showdown from Legacy? The active copy of the completed showdown will also be removed so it cannot immediately re-archive. Unfinished active saves are not affected. This cannot be undone."
            : "Delete every archived showdown from Legacy? Your unfinished active showdown, if any, will remain. This cannot be undone.";

        if(!window.confirm(warning)){ return; }
        if(deleteAllLegacyHistoryTransaction(history)){
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice("Legacy history was deleted successfully.", "success", 4200);
            }
            lastLegacyRenderedRevision = null;
            renderLegacy();
        }
    });

    const resetAll = document.createElement("button");
    resetAll.type = "button";
    resetAll.className = "compactButton dangerButton";
    resetAll.textContent = "RESET ALL SHOWDOWN DATA";
    resetAll.addEventListener("click", () => {
        if(!window.confirm("Reset ALL Career Mode Showdown data? This deletes the active showdown and every Legacy record. This cannot be undone.")){
            return;
        }

        if(!clearAllCareerModeData()){
            currentShowdown = loadSavedShowdown();
            if(typeof window.showAppNotice === "function"){
                window.showAppNotice(
                    "The full reset did not complete. The interface has reloaded the data that is still available; refresh before trying again.",
                    "error",
                    12000
                );
            }
            lastLegacyRenderedRevision = null;
            renderLegacy();
            return;
        }

        currentShowdown = null;
        if(typeof window.resetNavigationState === "function"){
            window.resetNavigationState();
        }
        if(typeof window.refreshMainMenuExperience === "function"){
            window.refreshMainMenuExperience();
        }
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("All active and Legacy Showdown data was reset successfully. Application preferences were kept.", "success", 5200);
        }
        lastLegacyRenderedRevision = null;
        showScreen("mainMenu", false);
    });

    buttons.append(exportBackup, deleteHistory, resetAll);
    controls.append(heading, description, backupSummary, buttons, status);
    return controls;
}

function renderLegacy(){'''
legacy = legacy[:match.start()] + new_controls + legacy[match.end():]
write("js/legacy.js", legacy)


# ---------------------------------------------------------------------------
# css/legacy.css — Candidate A Data Management presentation
# ---------------------------------------------------------------------------
legacy_css = read("css/legacy.css")
legacy_css = legacy_css.replace("   v1.0.1", "   v1.1.0", 1)
insert_before = '''#deleteActiveShowdown{
    margin-top:8px;
}
'''
backup_styles = r'''
.legacyBackupSummary{
    display:grid;
    grid-template-columns:auto minmax(0,1fr);
    gap:10px 14px;
    align-items:center;
    margin:0 0 14px;
    padding:12px 13px;
    color:#dfe9ed;
    background:linear-gradient(112deg,#24323b,#20506b);
    border-left:4px solid var(--f17-cyan);
}

.legacyBackupSummary strong{
    color:var(--f17-yellow);
    font:900 12px/1 var(--f17-display);
    letter-spacing:1.2px;
}

.legacyBackupSummary span{
    min-width:0;
    font-size:11px;
    line-height:1.45;
}

.primaryDataButton{
    color:#17242c;
    background:var(--f17-yellow);
    border-color:#b7a900;
}

.primaryDataButton:hover,
.primaryDataButton:focus-visible{
    color:#101b21;
    background:#fff238;
    border-color:var(--f17-blue);
}

.primaryDataButton[aria-busy="true"],
.primaryDataButton:disabled{
    cursor:wait;
    opacity:.72;
}

.legacyDataStatus{
    min-height:18px;
    margin:12px 0 0!important;
    color:#425762!important;
    font-size:11px!important;
    font-weight:700;
}

'''
legacy_css = replace_once(legacy_css, insert_before, backup_styles + insert_before, "Legacy backup CSS insertion")
legacy_css = legacy_css.replace(
    '    .legacyControlButtons .dangerButton{width:100%;}',
    '    .legacyControlButtons .dangerButton,\n    .legacyControlButtons .primaryDataButton{width:100%;}\n    .legacyBackupSummary{grid-template-columns:1fr;}'
)
write("css/legacy.css", legacy_css)


# ---------------------------------------------------------------------------
# Footballer line retune — face-safe lower-body accent rails
# ---------------------------------------------------------------------------
football_css = read("css/footballVisuals.css")
football_css = football_css.replace("Career Mode Showdown v1.0.2", "Career Mode Showdown v1.1.0", 1)
accent_anchor = '''.footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualIdentity{
    text-shadow:none;
}
'''
accent_css = r'''
/* v1.1 owner retune: the FIFA-era diagonals return, but only inside a bounded
   lower-body accent zone. They may cross torso/background pixels, never the
   protected head/face zone. */
.footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame::after{
    content:"";
    position:absolute;
    z-index:3;
    left:0;
    right:0;
    top:60%;
    bottom:0;
    pointer-events:none;
    background:
        linear-gradient(126deg,transparent 0 56%,rgba(66,185,218,.36) 56% 59%,transparent 59% 67%,rgba(240,217,0,.32) 67% 69%,transparent 69% 100%);
}

.footballVisualHeroSetup[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame::after{
    top:64%;
    background:
        linear-gradient(126deg,transparent 0 63%,rgba(66,185,218,.30) 63% 66%,transparent 66% 74%,rgba(240,217,0,.32) 74% 76%,transparent 76% 100%);
}

.footballVisualHeroTransfer .footballVisualPanel[data-photo-treatment="clean-anchor"] .footballVisualMediaFrame::after{
    top:58%;
}

'''
football_css = replace_once(football_css, accent_anchor, accent_css + accent_anchor, "face-safe football accent insertion")
write("css/footballVisuals.css", football_css)

visual_css = read("css/visual-fidelity-r3.css")
visual_css = visual_css.replace("Career Mode Showdown v1.0.2", "Career Mode Showdown v1.1.0", 1)
old_reus_after = '''.menuCoverAthlete::after{
    z-index:1;
    background:none;
    box-shadow:inset 18px 0 24px -24px rgba(8,17,22,.9),inset 0 -1px rgba(16,36,47,.08);
    pointer-events:none;
}
'''
new_reus_after = '''.menuCoverAthlete::after{
    z-index:3;
    inset:auto 0 0 0;
    height:34%;
    background:
        linear-gradient(126deg,transparent 0 62%,rgba(66,185,218,.28) 62% 65%,transparent 65% 73%,rgba(240,217,0,.28) 73% 75%,transparent 75% 100%);
    box-shadow:inset 18px 0 24px -24px rgba(8,17,22,.9),inset 0 -1px rgba(16,36,47,.08);
    pointer-events:none;
}
'''
visual_css = replace_once(visual_css, old_reus_after, new_reus_after, "Reus lower-body accent retune")
# Keep mobile accent bounded as well, without touching startup/loading selectors.
visual_css = visual_css.replace(
    '''    .menuCoverAthlete img{\n        object-position:50% 7%;''',
    '''    .menuCoverAthlete::after{\n        inset:auto 0 0 0;\n        height:30%;\n    }\n    .menuCoverAthlete img{\n        object-position:50% 7%;'''
)
write("css/visual-fidelity-r3.css", visual_css)


# ---------------------------------------------------------------------------
# Version/cache identity
# ---------------------------------------------------------------------------
app = read("js/app.js")
app = app.replace('const APP_VERSION = "1.0.2";', 'const APP_VERSION = "1.1.0";', 1)
app = app.replace('css/visual-fidelity-r3.css?v=1.0.2-r1', 'css/visual-fidelity-r3.css?v=1.1.0-r1', 1)
write("js/app.js", app)

index = read("index.html")
index = index.replace("1.0.2-r1", "1.1.0-r1")
index = index.replace("v1.0.2 · Stable", "v1.1.0 · Candidate A")
write("index.html", index)

package = json.loads(read("package.json"))
package["version"] = "1.1.0"
package["scripts"]["test:contracts"] = "node tests/contracts/stability-contracts.cjs && node tests/contracts/backup-contracts.cjs"
package["scripts"]["test:backup-browser"] = "node tests/browser/backup-export-audit.cjs"
write("package.json", json.dumps(package, indent=2) + "\n")

lock = json.loads(read("package-lock.json"))
lock["version"] = "1.1.0"
if isinstance(lock.get("packages"), dict) and isinstance(lock["packages"].get(""), dict):
    lock["packages"][""]["version"] = "1.1.0"
write("package-lock.json", json.dumps(lock, indent=2) + "\n")


# ---------------------------------------------------------------------------
# Contract test — storage snapshot + checksum + corruption safety + zero writes
# ---------------------------------------------------------------------------
backup_contract = r'''const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const storageSource = fs.readFileSync("js/storage.js", "utf8");
const backupSource = fs.readFileSync("js/backup.js", "utf8");

function createRuntime(){
    const values = new Map();
    const counters = { set: 0, remove: 0 };
    const localStorage = {
        getItem(key){ return values.has(key) ? values.get(key) : null; },
        setItem(key, value){ counters.set += 1; values.set(key, String(value)); },
        removeItem(key){ counters.remove += 1; values.delete(key); }
    };
    const document = {
        documentElement: null,
        querySelector(selector){
            return selector === 'meta[name="app-asset-revision"]' ? { content: "1.1.0-r1" } : null;
        },
        addEventListener(){},
        createElement(){ throw new Error("Download DOM should not be used by contract-only envelope tests."); }
    };
    const window = {
        crypto: webcrypto,
        matchMedia(){ return { matches: false, addEventListener(){} }; },
        setTimeout,
        clearTimeout,
        addEventListener(){},
        dispatchEvent(){},
        showAppNotice(){},
        CustomEvent: class CustomEvent {}
    };
    window.window = window;
    const context = vm.createContext({
        console,
        localStorage,
        window,
        document,
        currentShowdown: null,
        structuredClone,
        JSON,
        Date,
        TextEncoder,
        Blob,
        URL,
        setTimeout,
        clearTimeout
    });
    vm.runInContext(storageSource, context, { filename: "js/storage.js" });
    vm.runInContext(backupSource, context, { filename: "js/backup.js" });
    return { context, window, localStorage, values, counters };
}

(async () => {
    const runtime = createRuntime();
    const keys = runtime.window.getCareerModeStorageKeys();
    const active = { id: 1700000000000, name: "Backup Audit", status: "Active", updatedAt: "2026-08-11T12:00:00.000Z" };
    const legacy = [{ id: 1600000000000, name: "Archived Audit", status: "Completed", completedAt: "2026-08-10T12:00:00.000Z" }];
    const preferences = { schemaVersion: 2, reducedMotion: false, menuFeedback: true };

    runtime.values.set(keys.activeShowdown, JSON.stringify(active));
    runtime.values.set(keys.legacyShowdowns, JSON.stringify(legacy));
    runtime.values.set(keys.preferences, JSON.stringify(preferences));

    const writesBefore = { ...runtime.counters };
    const envelope = await runtime.window.createCareerModeBackupEnvelope();
    assert.equal(runtime.counters.set, writesBefore.set, "Backup envelope creation must not call localStorage.setItem().");
    assert.equal(runtime.counters.remove, writesBefore.remove, "Backup envelope creation must not call localStorage.removeItem().");
    assert.equal(envelope.formatId, "career-mode-showdown-backup");
    assert.equal(envelope.formatVersion, 1);
    assert.equal(envelope.appVersion, "1.1.0");
    assert.equal(envelope.runtimeRevision, "1.1.0-r1");
    assert.deepEqual(JSON.parse(JSON.stringify(envelope.payload.activeShowdown)), active);
    assert.deepEqual(JSON.parse(JSON.stringify(envelope.payload.legacyShowdowns)), legacy);
    assert.deepEqual(JSON.parse(JSON.stringify(envelope.payload.preferences)), preferences);
    assert.equal(await runtime.window.verifyCareerModeBackupEnvelopeChecksum(envelope), true, "Generated checksum must verify.");

    const mutated = structuredClone(envelope);
    mutated.payload.activeShowdown.name = "Tampered";
    assert.equal(await runtime.window.verifyCareerModeBackupEnvelopeChecksum(mutated), false, "Mutated backup content must fail checksum verification.");

    const readable = runtime.window.serializeCareerModeBackupEnvelope(envelope);
    assert.match(readable, /\n  "formatId":/);
    assert.ok(readable.endsWith("\n"), "Serialized backup should be human-readable and newline terminated.");

    runtime.values.set(keys.activeShowdown, "{broken-active");
    runtime.values.set(keys.legacyShowdowns, JSON.stringify({ not: "an array" }));
    runtime.values.set(keys.preferences, "{broken-preferences");
    runtime.context.currentShowdown = null;
    const corruptEnvelope = await runtime.window.createCareerModeBackupEnvelope();
    assert.equal(corruptEnvelope.counts.activeShowdowns, 0);
    assert.equal(corruptEnvelope.counts.legacyShowdowns, 0);
    assert.equal(corruptEnvelope.counts.preferenceRecords, 0);
    assert.equal(corruptEnvelope.warnings.length, 3, "All malformed current records must be surfaced as warnings.");
    assert.equal(corruptEnvelope.recovery.activeShowdown.raw, "{broken-active");
    assert.match(corruptEnvelope.recovery.legacyShowdowns.raw, /not/);
    assert.equal(corruptEnvelope.recovery.preferences.raw, "{broken-preferences");
    assert.equal(runtime.values.get(keys.activeShowdown), "{broken-active", "Corrupt active bytes must remain untouched.");
    assert.equal(await runtime.window.verifyCareerModeBackupEnvelopeChecksum(corruptEnvelope), true);

    // Bug 1: corrupt non-empty active data must not advertise a usable save.
    runtime.context.activeSavePresenceKnown = false;
    runtime.context.activeSavePresent = false;
    assert.equal(runtime.context.hasSavedShowdown(), false, "Corrupt raw active data must not produce a Continue Career false positive.");

    process.stdout.write("PASS  v1.1.0 Candidate A backup/storage contracts\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
'''
write("tests/contracts/backup-contracts.cjs", backup_contract)


# ---------------------------------------------------------------------------
# Browser audit — UI, single-flight, zero storage mutation, recovery, checksum
# ---------------------------------------------------------------------------
backup_browser = r'''const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { resolveChromiumRuntime } = require("../support/chromium-runtime.cjs");

const baseUrl = new URL(process.env.CMS_BASE_URL || "http://127.0.0.1:4173/");
const activeKey = "careerModeShowdown.activeShowdown";
const legacyKey = "careerModeShowdown.legacyShowdowns";
const preferencesKey = "careerModeShowdown.preferences";

async function waitForApp(page){
    await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
    await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });
    await page.locator("#mainMenu").waitFor({ state: "visible", timeout: 5000 });
}

(async () => {
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });
    try{
        const context = await browser.newContext({ viewport: { width: 940, height: 700 } });
        const page = await context.newPage();
        const pageErrors = [];
        page.on("pageerror", error => pageErrors.push(error.message));

        await waitForApp(page);
        await page.evaluate(({ activeKey, legacyKey, preferencesKey }) => {
            localStorage.setItem(activeKey, JSON.stringify({
                id: 1700000000000,
                name: "Browser Backup",
                status: "Completed",
                updatedAt: "2026-08-11T12:00:00.000Z",
                completedAt: "2026-08-11T12:00:00.000Z"
            }));
            localStorage.setItem(legacyKey, JSON.stringify([{
                id: 1700000000000,
                name: "Browser Backup",
                status: "Completed",
                updatedAt: "2026-08-11T12:00:00.000Z",
                completedAt: "2026-08-11T12:00:00.000Z"
            }]));
            localStorage.setItem(preferencesKey, JSON.stringify({ schemaVersion: 2, reducedMotion: false, menuFeedback: true }));
        }, { activeKey, legacyKey, preferencesKey });
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.locator("#loadingScreen").waitFor({ state: "hidden", timeout: 12000 });

        await page.evaluate(() => window.openOptionalModule("legacy"));
        await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });
        const exportButton = page.getByRole("button", { name: "EXPORT BACKUP" });
        await exportButton.waitFor({ state: "visible" });
        assert.ok(await exportButton.isEnabled(), "Export Backup must be keyboard/touch/mouse available.");

        await page.evaluate(() => {
            window.__backupAudit = { set: 0, remove: 0, downloads: 0 };
            const originalSet = Storage.prototype.setItem;
            const originalRemove = Storage.prototype.removeItem;
            const originalClick = HTMLAnchorElement.prototype.click;
            Storage.prototype.setItem = function(key, value){ window.__backupAudit.set += 1; return originalSet.call(this, key, value); };
            Storage.prototype.removeItem = function(key){ window.__backupAudit.remove += 1; return originalRemove.call(this, key); };
            HTMLAnchorElement.prototype.click = function(){ window.__backupAudit.downloads += 1; };
            window.__restoreBackupAudit = () => {
                Storage.prototype.setItem = originalSet;
                Storage.prototype.removeItem = originalRemove;
                HTMLAnchorElement.prototype.click = originalClick;
            };
        });

        // Bug 5: two rapid activations must still produce exactly one download.
        await page.evaluate(() => {
            const button = [...document.querySelectorAll("button")].find(item => item.textContent.trim() === "EXPORT BACKUP");
            button.click();
            button.click();
        });
        await page.waitForFunction(() => window.__backupAudit.downloads === 1, null, { timeout: 5000 });
        await page.waitForFunction(() => [...document.querySelectorAll("button")].some(item => item.textContent.trim() === "EXPORT BACKUP" && !item.disabled), null, { timeout: 5000 });
        const audit = await page.evaluate(() => ({ ...window.__backupAudit }));
        assert.equal(audit.set, 0, "Export UI must not write localStorage.");
        assert.equal(audit.remove, 0, "Export UI must not remove localStorage data.");
        assert.equal(audit.downloads, 1, "Rapid double activation must create one backup download.");

        const envelopeCheck = await page.evaluate(async () => {
            const envelope = await window.createCareerModeBackupEnvelope();
            const valid = await window.verifyCareerModeBackupEnvelopeChecksum(envelope);
            const mutated = structuredClone(envelope);
            mutated.payload.activeShowdown.name = "Changed after checksum";
            const mutatedValid = await window.verifyCareerModeBackupEnvelopeChecksum(mutated);
            return {
                valid,
                mutatedValid,
                relationship: envelope.relationships.completedActiveMatchesLegacy,
                formatted: window.serializeCareerModeBackupEnvelope(envelope).includes('\n  "formatId"')
            };
        });
        assert.equal(envelopeCheck.valid, true);
        assert.equal(envelopeCheck.mutatedValid, false);
        assert.equal(envelopeCheck.relationship, true, "Matching completed active/Legacy identity must be explicit.");
        assert.equal(envelopeCheck.formatted, true, "Backup JSON must be human-readable.");

        await page.evaluate(({ activeKey, legacyKey, preferencesKey }) => {
            window.__restoreBackupAudit();
            localStorage.setItem(activeKey, "{broken-active");
            localStorage.setItem(legacyKey, JSON.stringify({ wrong: "shape" }));
            localStorage.setItem(preferencesKey, "{broken-preferences");
            currentShowdown = null;
        }, { activeKey, legacyKey, preferencesKey });
        const corrupt = await page.evaluate(async () => {
            const before = [localStorage.getItem("careerModeShowdown.activeShowdown"), localStorage.getItem("careerModeShowdown.legacyShowdowns"), localStorage.getItem("careerModeShowdown.preferences")];
            const envelope = await window.createCareerModeBackupEnvelope();
            const after = [localStorage.getItem("careerModeShowdown.activeShowdown"), localStorage.getItem("careerModeShowdown.legacyShowdowns"), localStorage.getItem("careerModeShowdown.preferences")];
            return { warnings: envelope.warnings.length, recovery: Object.keys(envelope.recovery || {}).sort(), before, after };
        });
        assert.equal(corrupt.warnings, 3);
        assert.deepEqual(corrupt.recovery, ["activeShowdown", "legacyShowdowns", "preferences"]);
        assert.deepEqual(corrupt.after, corrupt.before, "Corrupt raw bytes must remain byte-for-byte unchanged by backup analysis.");
        assert.deepEqual(pageErrors, [], "Backup browser audit emitted page errors.");

        process.stdout.write("PASS  v1.1.0 Candidate A browser backup audit\n");
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
'''
write("tests/browser/backup-export-audit.cjs", backup_browser)


# ---------------------------------------------------------------------------
# Strengthen football visual audit to require visible lower-body accent zones
# ---------------------------------------------------------------------------
football_test = read("tests/browser/football-visual-audit.cjs")
old_inspection = '''                const frameStyle = getComputedStyle(frame);
                const beforeStyle = getComputedStyle(panel, "::before");
                const afterStyle = getComputedStyle(panel, "::after");
'''
new_inspection = '''                const frameStyle = getComputedStyle(frame);
                const frameAccentStyle = getComputedStyle(frame, "::after");
                const beforeStyle = getComputedStyle(panel, "::before");
                const afterStyle = getComputedStyle(panel, "::after");
'''
football_test = replace_once(football_test, old_inspection, new_inspection, "football audit accent style capture")
old_result = '''                    frameZIndex: Number.parseInt(frameStyle.zIndex || "0", 10) || 0,
                    beforeZIndex: Number.parseInt(beforeStyle.zIndex || "0", 10) || 0,
                    afterZIndex: Number.parseInt(afterStyle.zIndex || "0", 10) || 0,
'''
new_result = '''                    frameZIndex: Number.parseInt(frameStyle.zIndex || "0", 10) || 0,
                    accentContent: frameAccentStyle.content,
                    accentTop: Number.parseFloat(frameAccentStyle.top || "0") || 0,
                    accentHeight: Number.parseFloat(frameAccentStyle.height || "0") || 0,
                    accentZIndex: Number.parseInt(frameAccentStyle.zIndex || "0", 10) || 0,
                    beforeZIndex: Number.parseInt(beforeStyle.zIndex || "0", 10) || 0,
                    afterZIndex: Number.parseInt(afterStyle.zIndex || "0", 10) || 0,
'''
football_test = replace_once(football_test, old_result, new_result, "football audit accent geometry result")
old_clean_assert = '''            assert.ok(
                panel.frameZIndex > panel.beforeZIndex && panel.frameZIndex > panel.afterZIndex,
                `${screenName}/${panel.asset}: decorative geometry is painted above the photograph; face-safe layering regressed.`
            );
            const horizontallySeparated = panel.copyRight <= panel.frameLeft + 2 || panel.copyLeft >= panel.frameRight - 2;
'''
new_clean_assert = '''            assert.ok(
                panel.frameZIndex > panel.beforeZIndex && panel.frameZIndex > panel.afterZIndex,
                `${screenName}/${panel.asset}: broad decorative geometry is painted above the photograph; face-safe layering regressed.`
            );
            assert.notEqual(panel.accentContent, "none", `${screenName}/${panel.asset}: owner-requested FIFA diagonal accent rail is missing.`);
            assert.ok(panel.accentHeight > 0, `${screenName}/${panel.asset}: accent rail has no rendered height.`);
            assert.ok(
                panel.accentTop >= panel.frameHeight * .54,
                `${screenName}/${panel.asset}: accent rail enters the protected head/face zone.`
            );
            assert.ok(panel.accentZIndex >= 3, `${screenName}/${panel.asset}: accent rail is not rendered as the intended bounded photo accent.`);
            const horizontallySeparated = panel.copyRight <= panel.frameLeft + 2 || panel.copyLeft >= panel.frameRight - 2;
'''
football_test = replace_once(football_test, old_clean_assert, new_clean_assert, "football face-safe accent assertions")
write("tests/browser/football-visual-audit.cjs", football_test)

print("v1.1.0 Candidate A runtime/test build complete")
'''
