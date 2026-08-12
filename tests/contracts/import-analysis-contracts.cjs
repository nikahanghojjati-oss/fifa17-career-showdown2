const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { performance } = require("node:perf_hooks");
const { webcrypto } = crypto;

const storageSource = fs.readFileSync("js/storage.js", "utf8");
const backupSource = fs.readFileSync("js/backup.js", "utf8");
const importSource = fs.readFileSync("js/importAnalysis.js", "utf8");
const schema1Showdown = JSON.parse(fs.readFileSync("tests/fixtures/import/showdown-schema1.json", "utf8"));
const schema2Showdown = JSON.parse(fs.readFileSync("tests/fixtures/import/showdown-schema2.json", "utf8"));
const schema1Preferences = JSON.parse(fs.readFileSync("tests/fixtures/import/preferences-schema1.json", "utf8"));
const schema2Preferences = JSON.parse(fs.readFileSync("tests/fixtures/import/preferences-schema2.json", "utf8"));

function canonicalize(value){
    if(Array.isArray(value)){ return value.map(canonicalize); }
    if(value && typeof value === "object"){
        return Object.keys(value).sort().reduce((result, key) => {
            result[key] = canonicalize(value[key]);
            return result;
        }, Object.create(null));
    }
    return value;
}

function signEnvelope(envelope){
    const copy = structuredClone(envelope);
    delete copy.checksum;
    envelope.checksum = crypto.createHash("sha256").update(JSON.stringify(canonicalize(copy))).digest("hex");
    return envelope;
}

function makeEnvelope({ active = null, legacy = [], preferences = null } = {}){
    return signEnvelope({
        formatId: "career-mode-showdown-backup",
        formatVersion: 1,
        appVersion: "1.1.1",
        runtimeRevision: "1.1.1-r1",
        exportedAt: "2026-08-11T12:00:00.000Z",
        checksumAlgorithm: "SHA-256",
        counts: {
            activeShowdowns: active ? 1 : 0,
            legacyShowdowns: Array.isArray(legacy) ? legacy.length : 0,
            preferenceRecords: preferences ? 1 : 0
        },
        relationships: { activeSource: active ? "storage" : "none", completedActiveMatchesLegacy: false, matchingLegacyIndex: -1 },
        storageState: { activeShowdown: active ? "valid" : "missing", legacyShowdowns: "valid", preferences: preferences ? "valid" : "missing" },
        payload: { activeShowdown: active, legacyShowdowns: legacy, preferences },
        warnings: [],
        recovery: null,
        checksum: ""
    });
}

function createRuntime(){
    const values = new Map();
    const counters = { set: 0, remove: 0 };
    const localStorage = {
        getItem(key){ return values.has(key) ? values.get(key) : null; },
        setItem(key, value){ counters.set += 1; values.set(key, String(value)); },
        removeItem(key){ counters.remove += 1; values.delete(key); }
    };
    const document = {
        documentElement: { dataset: {} },
        querySelector(selector){
            if(selector === 'meta[name="app-asset-revision"]'){ return { content: "1.1.3-r1" }; }
            return null;
        },
        getElementById(){ return null; },
        addEventListener(){},
        createElement(){ throw new Error("Contract analysis must not require Data Management DOM."); }
    };
    const CustomEvent = class CustomEvent { constructor(type, options = {}){ this.type = type; this.detail = options.detail; } };
    const window = {
        crypto: webcrypto,
        matchMedia(){ return { matches: false, addEventListener(){}, removeEventListener(){} }; },
        setTimeout,
        clearTimeout,
        addEventListener(){},
        dispatchEvent(){},
        showAppNotice(){},
        CustomEvent
    };
    window.window = window;
    const context = vm.createContext({
        console,
        localStorage,
        window,
        document,
        currentShowdown: null,
        structuredClone,
        CustomEvent,
        JSON,
        Date,
        TextEncoder,
        Blob,
        URL,
        Object,
        Array,
        Map,
        Set,
        Number,
        String,
        Boolean,
        RegExp,
        Error,
        setTimeout,
        clearTimeout
    });
    vm.runInContext(storageSource, context, { filename: "js/storage.js" });
    vm.runInContext(backupSource, context, { filename: "js/backup.js" });
    vm.runInContext(importSource, context, { filename: "js/importAnalysis.js" });
    return { context, window, values, counters };
}

function seedLocal(runtime, keys, { active, legacy, preferences }){
    runtime.values.clear();
    runtime.context.currentShowdown = null;
    if(active !== undefined){ runtime.values.set(keys.activeShowdown, typeof active === "string" ? active : JSON.stringify(active)); }
    if(legacy !== undefined){ runtime.values.set(keys.legacyShowdowns, typeof legacy === "string" ? legacy : JSON.stringify(legacy)); }
    if(preferences !== undefined){ runtime.values.set(keys.preferences, typeof preferences === "string" ? preferences : JSON.stringify(preferences)); }
}

(async () => {
    assert.ok(!importSource.includes("localStorage.setItem"), "Candidate B source must not own localStorage writes.");
    assert.ok(!importSource.includes("localStorage.removeItem"), "Candidate B source must not own localStorage removals.");
    assert.ok(!/\bfetch\s*\(/.test(importSource), "Candidate B analysis must not make network requests.");
    assert.ok(!/XMLHttpRequest/.test(importSource), "Candidate B analysis must not create network fallbacks.");

    const runtime = createRuntime();
    const keys = runtime.window.getCareerModeStorageKeys();
    seedLocal(runtime, keys, {
        active: { ...schema2Showdown, id: "active-local", name: "Current Active", updatedAt: "2026-08-11T12:00:00.000Z" },
        legacy: [
            { ...schema2Showdown, id: "legacy-exact", name: "Exact", updatedAt: "2026-08-10T12:00:00.000Z" },
            { ...schema2Showdown, id: "legacy-same-revision", name: "Local Same Revision", updatedAt: "2026-08-09T12:00:00.000Z" },
            { ...schema2Showdown, id: "legacy-different", name: "Local Different", updatedAt: "2026-08-08T12:00:00.000Z" }
        ],
        preferences: schema2Preferences
    });

    const migratedShowdown = runtime.window.migrateCareerModeImportRecord("showdown", schema1Showdown);
    assert.equal(migratedShowdown.ok, true);
    assert.equal(migratedShowdown.sourceVersion, 1);
    assert.equal(migratedShowdown.targetVersion, 2);
    assert.deepEqual(Array.from(migratedShowdown.steps), ["showdown-schema-1-to-2"]);
    assert.equal(migratedShowdown.value.schemaVersion, 2);
    assert.deepEqual(Array.from(migratedShowdown.value.integrityWarnings), []);
    const migratedAgain = runtime.window.migrateCareerModeImportRecord("showdown", migratedShowdown.value);
    assert.equal(migratedAgain.ok, true);
    assert.deepEqual(Array.from(migratedAgain.steps), []);
    assert.deepEqual(JSON.parse(JSON.stringify(migratedAgain.value)), JSON.parse(JSON.stringify(migratedShowdown.value)), "Showdown migration must be idempotent.");

    const migratedPreferences = runtime.window.migrateCareerModeImportRecord("preferences", schema1Preferences);
    assert.equal(migratedPreferences.ok, true);
    assert.deepEqual(Array.from(migratedPreferences.steps), ["preferences-schema-1-to-2"]);
    assert.deepEqual(JSON.parse(JSON.stringify(migratedPreferences.value)), { schemaVersion: 2, reducedMotion: true, menuFeedback: true });
    const preferencesAgain = runtime.window.migrateCareerModeImportRecord("preferences", migratedPreferences.value);
    assert.deepEqual(Array.from(preferencesAgain.steps), []);
    assert.deepEqual(JSON.parse(JSON.stringify(preferencesAgain.value)), JSON.parse(JSON.stringify(migratedPreferences.value)));

    const exact = { ...schema2Showdown, id: "legacy-exact", name: "Exact", updatedAt: "2026-08-10T12:00:00.000Z" };
    const sameRevision = { ...schema2Showdown, id: "legacy-same-revision", name: "Imported Same Revision", updatedAt: "2026-08-09T12:00:00.000Z" };
    const differentRevision = { ...schema2Showdown, id: "legacy-different", name: "Imported Newer", updatedAt: "2026-08-11T15:00:00.000Z" };
    const newRecord = { ...schema2Showdown, id: "legacy-new", name: "New Record", updatedAt: "2026-08-11T16:00:00.000Z" };
    const replacementActive = { ...schema1Showdown, id: "backup-active", name: "Imported Active" };
    const envelope = makeEnvelope({
        active: replacementActive,
        legacy: [exact, sameRevision, differentRevision, newRecord],
        preferences: { ...schema1Preferences, reducedMotion: true }
    });
    const envelopeBefore = JSON.stringify(envelope);
    const writesBefore = { ...runtime.counters };
    const analysis = await runtime.window.analyzeCareerModeBackupEnvelope(envelope, { sourceName: "matrix.json", sourceSize: 1200 });
    assert.equal(analysis.ok, true, analysis.errors.join(" | "));
    assert.equal(analysis.status, "ready");
    assert.equal(analysis.readyForRestore, false, "Candidate B must never claim to be the restore stage.");
    assert.equal(analysis.checksum.verified, true);
    assert.equal(analysis.preview.active.kind, "replace");
    assert.equal(analysis.preview.legacy.newRecords, 1);
    assert.equal(analysis.preview.legacy.exactDuplicates, 1);
    assert.equal(analysis.preview.legacy.sameEffectiveRevision, 1);
    assert.equal(analysis.preview.legacy.differentRevision, 1);
    assert.equal(analysis.preview.legacy.malformedUnresolvable, 0);
    assert.equal(analysis.preview.preferences.kind, "change");
    assert.equal(analysis.migrations.length, 2, "Schema-1 active and preferences should preview two migration operations.");
    assert.equal(JSON.stringify(envelope), envelopeBefore, "Candidate B must not mutate caller-owned parsed backup objects.");
    assert.equal(runtime.counters.set, writesBefore.set, "Candidate B analysis must not write localStorage.");
    assert.equal(runtime.counters.remove, writesBefore.remove, "Candidate B analysis must not remove localStorage data.");

    const text = JSON.stringify(envelope, null, 2);
    const textBefore = { ...runtime.counters };
    const textAnalysis = await runtime.window.analyzeCareerModeBackupText(text, { sourceName: "round-trip.json" });
    assert.equal(textAnalysis.ok, true);
    assert.equal(runtime.counters.set, textBefore.set);
    assert.equal(runtime.counters.remove, textBefore.remove);

    const tampered = structuredClone(envelope);
    tampered.payload.activeShowdown.name = "Changed without checksum";
    const tamperedAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(tampered);
    assert.equal(tamperedAnalysis.ok, false);
    assert.match(tamperedAnalysis.errors.join(" "), /checksum does not match/i);

    const futureFormat = structuredClone(envelope);
    futureFormat.formatVersion = 2;
    const futureFormatAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(futureFormat);
    assert.equal(futureFormatAnalysis.ok, false);
    assert.match(futureFormatAnalysis.errors.join(" "), /newer than this app supports/i);

    const futureSchema = makeEnvelope({ active: { ...schema2Showdown, schemaVersion: 3, id: "future" }, legacy: [], preferences: schema2Preferences });
    const futureSchemaAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(futureSchema);
    assert.equal(futureSchemaAnalysis.ok, false);
    assert.match(futureSchemaAnalysis.errors.join(" "), /schema v3 is newer/i);

    const wrongCounts = makeEnvelope({ active: schema2Showdown, legacy: [], preferences: schema2Preferences });
    wrongCounts.counts.legacyShowdowns = 99;
    signEnvelope(wrongCounts);
    const wrongCountsAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(wrongCounts);
    assert.equal(wrongCountsAnalysis.ok, false);
    assert.match(wrongCountsAnalysis.errors.join(" "), /counts metadata/i);

    const malformedJson = await runtime.window.analyzeCareerModeBackupText("{not-json", { sourceName: "broken.json" });
    assert.equal(malformedJson.ok, false);
    assert.match(malformedJson.errors.join(" "), /not valid JSON/i);

    let oversizedReads = 0;
    const oversized = await runtime.window.analyzeCareerModeBackupFile({
        name: "oversized.json",
        size: runtime.window.CAREER_MODE_IMPORT_MAX_BYTES + 1,
        async text(){ oversizedReads += 1; return "{}"; }
    });
    assert.equal(oversized.ok, false);
    assert.equal(oversizedReads, 0, "Oversized File objects must be rejected before File.text() is called.");
    assert.match(oversized.errors.join(" "), /too large/i);

    const dangerous = JSON.parse('{"formatId":"career-mode-showdown-backup","formatVersion":1,"checksumAlgorithm":"SHA-256","checksum":"' + '0'.repeat(64) + '","payload":{"__proto__":{"polluted":true}}}');
    const dangerousAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(dangerous);
    assert.equal(dangerousAnalysis.ok, false);
    assert.match(dangerousAnalysis.errors.join(" "), /forbidden object key/i);
    assert.equal({}.polluted, undefined, "Host Object prototype must remain unpolluted.");

    const duplicateExact = { ...schema2Showdown, id: "duplicate-inside", name: "Duplicate Inside" };
    const duplicateConflict = { ...duplicateExact, name: "Conflicting Duplicate", updatedAt: "2026-08-11T19:00:00.000Z" };
    const duplicateEnvelope = makeEnvelope({ legacy: [duplicateExact, structuredClone(duplicateExact), duplicateConflict], preferences: schema2Preferences });
    const duplicateAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(duplicateEnvelope);
    assert.equal(duplicateAnalysis.ok, false, "Same-ID different-content records inside one backup must block Candidate B readiness.");
    assert.match(duplicateAnalysis.errors.join(" "), /conflicting records with the same Showdown ID/i);

    seedLocal(runtime, keys, { active: "{broken-active", legacy: "{broken-legacy", preferences: "{broken-preferences" });
    const corruptLocalBefore = new Map(runtime.values);
    const corruptLocalAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(makeEnvelope({ active: schema2Showdown, legacy: [], preferences: schema2Preferences }));
    assert.equal(corruptLocalAnalysis.ok, true, "Unreadable current local bytes should not corrupt a valid imported backup analysis.");
    assert.ok(corruptLocalAnalysis.warnings.length >= 3, "Unreadable current local records must be visible in preview warnings.");
    assert.deepEqual([...runtime.values.entries()], [...corruptLocalBefore.entries()], "Local corrupt bytes must remain exactly untouched.");

    const largeLegacy = Array.from({ length: 1500 }, (_, index) => ({
        ...schema2Showdown,
        id: `large-${index}`,
        name: `Large Fixture ${index}`,
        updatedAt: new Date(1700000000000 + index * 1000).toISOString()
    }));
    seedLocal(runtime, keys, { legacy: [], preferences: schema2Preferences });
    const largeEnvelope = makeEnvelope({ legacy: largeLegacy, preferences: schema2Preferences });
    const largeStarted = performance.now();
    const largeAnalysis = await runtime.window.analyzeCareerModeBackupEnvelope(largeEnvelope);
    const largeElapsed = performance.now() - largeStarted;
    assert.equal(largeAnalysis.ok, true, largeAnalysis.errors.join(" | "));
    assert.equal(largeAnalysis.preview.legacy.newRecords, 1500);
    assert.ok(largeElapsed < 2500, `1,500-record Candidate B analysis should remain responsive in contracts; took ${largeElapsed.toFixed(1)}ms.`);

    process.stdout.write("PASS  Candidate B import-analysis contracts on v1.1.3\n");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
