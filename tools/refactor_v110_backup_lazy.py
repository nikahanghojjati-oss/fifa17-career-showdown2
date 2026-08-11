from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def write(path,text): (ROOT/path).write_text(text,encoding='utf-8')
def one(text,old,new,label):
    count=text.count(old)
    if count != 1: raise RuntimeError(f'{label}: expected 1 match, found {count}')
    return text.replace(old,new,1)

storage=read('js/storage.js')
start=storage.index('function isPlainStorageObject(value){')
end=storage.index('function createDefaultApplicationPreferences(){')
bridge='''function captureCareerModeRawBackupInputs(){\n    return {\n        activeShowdown: readStorageValue(STORAGE_KEY),\n        legacyShowdowns: readStorageValue(LEGACY_STORAGE_KEY),\n        preferences: readStorageValue(APPLICATION_PREFERENCES_KEY)\n    };\n}\n\n'''
storage=storage[:start]+bridge+storage[end:]

old_has='''function hasSavedShowdown(){\n    if(activeSavePresenceKnown){\n        return activeSavePresent;\n    }\n\n    const record = inspectRawStorageRecord(STORAGE_KEY, validateActiveShowdownStorage, "Active Showdown storage");\n    activeSavePresenceKnown = true;\n    activeSavePresent = record.state === "valid";\n    if(record.state === "corrupt"){\n        reportStorageError("Unable to use the stored active showdown", new Error(record.warning));\n    }\n    return activeSavePresent;\n}\n'''
new_has='''function hasSavedShowdown(){\n    if(activeSavePresenceKnown){ return activeSavePresent; }\n    const raw = readStorageValue(STORAGE_KEY);\n    if(!raw){\n        activeSavePresenceKnown = true;\n        activeSavePresent = false;\n        return false;\n    }\n    try{\n        const parsed = JSON.parse(raw);\n        if(!parsed || typeof parsed !== "object" || Array.isArray(parsed)){\n            throw new Error("Active save data is not a valid showdown object.");\n        }\n        activeSavePresenceKnown = true;\n        activeSavePresent = true;\n    }catch(error){\n        activeSavePresenceKnown = true;\n        activeSavePresent = false;\n        reportStorageError("Unable to use the stored active showdown", error);\n    }\n    return activeSavePresent;\n}\n'''
storage=one(storage,old_has,new_has,'compact corrupt-save check')
storage=one(storage,'if(parsed.some(item => !isPlainStorageObject(item))){','if(parsed.some(item => !item || typeof item !== "object" || Array.isArray(item))){','compact Legacy shape check')
storage=one(storage,'window.captureCareerModeBackupSnapshot = captureCareerModeBackupSnapshot;','window.captureCareerModeRawBackupInputs = captureCareerModeRawBackupInputs;','raw backup bridge export')
write('js/storage.js',storage)

backup=read('js/backup.js')
insert_after='''function getBackupRuntimeRevision(){\n    const meta = document.querySelector('meta[name="app-asset-revision"]');\n    return meta && meta.content ? meta.content.trim() : "unknown";\n}\n'''
lazy_helpers=r'''

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
    if(raw === null){ return { state: "missing", raw: null, value: null, warning: null }; }
    try{
        const value = JSON.parse(raw);
        if(!validator(value)){ throw new Error(`${label} has an unsupported shape.`); }
        return { state: "valid", raw, value, warning: null };
    }catch(error){
        return { state: "corrupt", raw, value: null, warning: `${label} could not be safely interpreted: ${error.message || String(error)}` };
    }
}

function buildCareerModeBackupSnapshot(){
    if(typeof window.captureCareerModeRawBackupInputs !== "function"){
        throw new Error("The storage snapshot authority is unavailable.");
    }
    const raw = window.captureCareerModeRawBackupInputs();
    const activeRecord = inspectBackupRecord(raw.activeShowdown, isBackupObject, "Active Showdown storage");
    const legacyRecord = inspectBackupRecord(raw.legacyShowdowns, value => Array.isArray(value) && value.every(isBackupObject), "Legacy storage");
    const preferencesRecord = inspectBackupRecord(raw.preferences, isBackupObject, "Preferences storage");
    const keys = typeof window.getCareerModeStorageKeys === "function" ? window.getCareerModeStorageKeys() : {};
    const warnings = [];
    const recovery = {};

    [
        ["activeShowdown", keys.activeShowdown, activeRecord],
        ["legacyShowdowns", keys.legacyShowdowns, legacyRecord],
        ["preferences", keys.preferences, preferencesRecord]
    ].forEach(([name, storageKey, record]) => {
        if(record.state !== "corrupt"){ return; }
        warnings.push(record.warning);
        recovery[name] = { storageKey: storageKey || name, raw: record.raw, reason: record.warning };
    });

    let activeShowdown = activeRecord.state === "valid" ? cloneBackupValue(activeRecord.value) : null;
    let activeSource = activeRecord.state === "valid" ? "storage" : "none";
    if(typeof currentShowdown !== "undefined" && isBackupObject(currentShowdown)){
        try{
            activeShowdown = cloneBackupValue(currentShowdown);
            activeSource = "runtime";
        }catch(error){
            warnings.push(`The in-memory active Showdown could not be cloned; persisted storage was used instead: ${error.message || String(error)}`);
        }
    }

    const legacyShowdowns = legacyRecord.state === "valid" ? cloneBackupValue(legacyRecord.value) : null;
    const preferences = preferencesRecord.state === "valid" ? cloneBackupValue(preferencesRecord.value) : null;
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
            completedActiveMatchesLegacy: Boolean(activeShowdown && activeShowdown.status === "Completed" && matchingLegacyIndex >= 0),
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
backup=one(backup,insert_after,insert_after+lazy_helpers,'lazy backup helpers')
backup=one(backup,'''async function createCareerModeBackupEnvelope(){\n    if(typeof window.captureCareerModeBackupSnapshot !== "function"){\n        throw new Error("The storage snapshot authority is unavailable.");\n    }\n\n    const snapshot = window.captureCareerModeBackupSnapshot();''','''async function createCareerModeBackupEnvelope(){\n    const snapshot = buildCareerModeBackupSnapshot();''','lazy snapshot use')
write('js/backup.js',backup)

browser=read('tests/browser/backup-export-audit.cjs')
old='''async function openLegacy(page){\n    await page.evaluate(() => window.openOptionalModule("legacy"));\n    await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });\n'''
new='''async function openLegacy(page){\n    await page.evaluate(async () => {\n        await window.openOptionalModule("legacy");\n        showScreen("legacy", false);\n    });\n    await page.locator("#legacy").waitFor({ state: "visible", timeout: 12000 });\n'''
browser=one(browser,old,new,'real Legacy route in backup browser audit')
write('tests/browser/backup-export-audit.cjs',browser)

print('Candidate A lazy-backup refactor generated')
