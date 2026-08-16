/**
 * Multi-Save Portability Contracts
 * Sealed fixture seeds and formatVersion 2 path assertions [2026-08-16].
 * Expanded with deterministic plan-level clean full-library restore of locked fixtures.
 * Full storage-transaction + Chromium round-trip remains the next step.
 */
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const storageSource = fs.readFileSync(path.join("js", "storage.js"), "utf8");
const backupSource = fs.readFileSync(path.join("js", "backup.js"), "utf8");
const runtimeSource = fs.readFileSync(path.join("js", "saveLibraryRuntime.js"), "utf8");
const restoreSource = fs.readFileSync(path.join("js", "restore.js"), "utf8");
const importSource = fs.readFileSync(path.join("js", "importAnalysis.js"), "utf8");

// ---------------------------------------------------------------------------
// Locked fixture seeds (must remain stable across implementation)
// ---------------------------------------------------------------------------

const PROFILE_ALEX_A = {
  schemaVersion: 1,
  profileId: "profile_aaaaaaaaaaaaaaaaaaaaaaaa",
  displayName: "Alex",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const PROFILE_ALEX_B = {
  schemaVersion: 1,
  profileId: "profile_bbbbbbbbbbbbbbbbbbbbbbbb",
  displayName: "Alex", // same display name, distinct ID
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z"
};

const PROFILE_REUSED = {
  schemaVersion: 1,
  profileId: "profile_cccccccccccccccccccccccc",
  displayName: "Shared Manager",
  createdAt: "2026-01-03T00:00:00.000Z",
  updatedAt: "2026-01-03T00:00:00.000Z"
};

const SAVE_ONE = {
  schemaVersion: 1,
  saveId: "save_111111111111111111111111",
  showdown: {
    id: 1700000000001,
    name: "Save One",
    status: "Active",
    identity: {
      saveId: "save_111111111111111111111111",
      managerProfileIds: {
        playerOne: "profile_aaaaaaaaaaaaaaaaaaaaaaaa",
        playerTwo: "profile_cccccccccccccccccccccccc" // explicit reuse
      }
    },
    managers: { playerOne: "Alex", playerTwo: "Shared Manager" },
    updatedAt: "2026-08-01T12:00:00.000Z"
  }
};

const SAVE_TWO = {
  schemaVersion: 1,
  saveId: "save_222222222222222222222222",
  showdown: {
    id: 1700000000002,
    name: "Save Two",
    status: "Active",
    identity: {
      saveId: "save_222222222222222222222222",
      managerProfileIds: {
        playerOne: "profile_bbbbbbbbbbbbbbbbbbbbbbbb", // same-name distinct
        playerTwo: null // unresolved historical role
      }
    },
    managers: { playerOne: "Alex", playerTwo: "Unknown" },
    updatedAt: "2026-08-02T12:00:00.000Z"
  }
};

const FULL_LIBRARY = {
  schemaVersion: 1,
  activeSaveId: "save_111111111111111111111111",
  profiles: [PROFILE_ALEX_A, PROFILE_ALEX_B, PROFILE_REUSED],
  saves: [SAVE_ONE, SAVE_TWO]
};

const LEGACY_SHOWDOWNS = [
  {
    id: 1600000000000,
    name: "Legacy Archive",
    status: "Completed",
    completedAt: "2026-07-01T00:00:00.000Z"
  }
];

const PREFERENCES = {
  motion: "system",
  theme: "dark"
};

// ---------------------------------------------------------------------------
// Source-gap / formatVersion 2 export path assertions
// ---------------------------------------------------------------------------

(function assertFormatVersion2ExportPath() {
  assert.ok(
    storageSource.includes("function captureCareerModeRawBackupInputs()"),
    "captureCareerModeRawBackupInputs must exist"
  );
  assert.ok(
    /captureCareerModeRawBackupInputs\(\)\s*\{\s*return\s*\{\s*saveLibrary:/.test(storageSource.replace(/\s+/g, " ")),
    "captureCareerModeRawBackupInputs must include saveLibrary for formatVersion 2"
  );

  assert.ok(
    runtimeSource.includes("function runtimeCreateBackupProjection()"),
    "runtimeCreateBackupProjection must exist"
  );
  assert.ok(
    /raw:\s*\{\s*saveLibrary:\s*raw\.saveLibrary/.test(runtimeSource.replace(/\s+/g, " ")),
    "runtimeCreateBackupProjection must project full saveLibrary into the returned raw"
  );

  assert.ok(
    /CAREER_MODE_BACKUP_FORMAT_VERSION\s*=\s*2/.test(backupSource),
    "CAREER_MODE_BACKUP_FORMAT_VERSION must be 2"
  );

  assert.ok(
    backupSource.includes("payload: { saveLibrary, activeShowdown, legacyShowdowns, preferences }") ||
    backupSource.includes("payload: {saveLibrary, activeShowdown, legacyShowdowns, preferences}"),
    "buildCareerModeBackupSnapshot must emit saveLibrary in the payload"
  );

  console.log("multi-save-portability formatVersion 2 export path: PASS");
})();

// ---------------------------------------------------------------------------
// Fixture identity invariants (locked seeds)
// ---------------------------------------------------------------------------

(function assertFixtureSeeds() {
  assert.equal(FULL_LIBRARY.saves.length, 2, "exactly two distinct Saves");
  assert.equal(FULL_LIBRARY.profiles.length, 3, "three profiles including same-name distinct and reuse");
  assert.equal(FULL_LIBRARY.activeSaveId, "save_111111111111111111111111");

  const alexProfiles = FULL_LIBRARY.profiles.filter(p => p.displayName === "Alex");
  assert.equal(alexProfiles.length, 2, "same-name distinct profiles (Alex appears twice)");
  assert.notEqual(alexProfiles[0].profileId, alexProfiles[1].profileId);

  assert.equal(
    SAVE_ONE.showdown.identity.managerProfileIds.playerTwo,
    PROFILE_REUSED.profileId,
    "explicit profile reuse across Saves"
  );
  assert.equal(
    SAVE_TWO.showdown.identity.managerProfileIds.playerTwo,
    null,
    "unresolved historical role (null managerProfileId)"
  );

  assert.ok(Array.isArray(LEGACY_SHOWDOWNS) && LEGACY_SHOWDOWNS.length === 1);
  assert.ok(PREFERENCES && typeof PREFERENCES === "object");

  console.log("multi-save-portability fixture seeds: PASS (locked)");
})();

// ---------------------------------------------------------------------------
// Analysis + restore path presence (formatVersion 2 readiness)
// ---------------------------------------------------------------------------

(function assertAnalysisAndRestorePath() {
  assert.ok(importSource.includes("function analyzeSaveLibraryRecord"), "importAnalysis must validate payload.saveLibrary");
  assert.ok(importSource.includes("saveLibrary: importedSaveLibrary"), "migratedPayload must carry saveLibrary");
  assert.ok(
    /formatVersion !== 1 && formatVersion !== expectedFormatVersion/.test(importSource.replace(/\s+/g, " ")) ||
    importSource.includes("formatVersion !== 1 && formatVersion !== expectedFormatVersion"),
    "analysis must accept v1 and v2"
  );

  assert.ok(restoreSource.includes("hasBackupLibrary"), "restore plan must detect complete library in payload");
  assert.ok(restoreSource.includes("destinationIsClean"), "restore plan must detect clean destination");
  assert.ok(
    restoreSource.includes("full-restore-clean") || restoreSource.includes("planHasFullLibrary"),
    "clean full-restore path must exist"
  );
  assert.ok(restoreSource.includes("planHasFullLibrary"), "apply must enter saveLibrary transaction when plan carries full registry");

  console.log("multi-save-portability analysis+restore path: PASS");
})();

// ---------------------------------------------------------------------------
// Deterministic plan-level clean full-library restore of locked fixtures
// ---------------------------------------------------------------------------

(function assertCleanFullLibraryRestorePlan() {
  // Minimal context that only needs createCareerModeRestorePlan
  const context = vm.createContext({
    console,
    window: {},
    Object,
    Array,
    JSON,
    Boolean,
    String,
    Number,
    Error,
    Map,
    Set,
    Date,
    Math,
    parseInt,
    isNaN,
    structuredClone: typeof structuredClone === "function" ? structuredClone : (v) => JSON.parse(JSON.stringify(v))
  });
  context.window = context;

  vm.runInContext(restoreSource, context, { filename: "js/restore.js" });

  assert.equal(typeof context.window.createCareerModeRestorePlan, "function", "createCareerModeRestorePlan must be exported");

  // Simulated verified analysis carrying the locked full library (formatVersion 2 shape)
  const analysis = {
    ok: true,
    checksum: { verified: true },
    formatVersion: 2,
    migratedPayload: {
      saveLibrary: FULL_LIBRARY,
      activeShowdown: SAVE_ONE.showdown, // projected compatibility aid only
      legacyShowdowns: LEGACY_SHOWDOWNS,
      preferences: PREFERENCES
    }
  };

  // Clean destination: no saveLibrary and no activeShowdown
  const cleanRaw = {
    saveLibrary: null,
    activeShowdown: null,
    legacyShowdowns: null,
    preferences: null
  };

  const cleanChoices = {
    active: "use-backup",
    legacy: "replace-with-backup",
    preferences: "use-backup",
    saveLibrary: "use-backup" // for clean this is optional but explicit is fine
  };

  const plan = context.window.createCareerModeRestorePlan(analysis, cleanRaw, cleanChoices);

  assert.equal(plan.ok, true, `clean plan must be ready: ${JSON.stringify(plan.errors || [])}`);
  assert.equal(plan.status, "ready");
  assert.ok(plan.candidateRaw && typeof plan.candidateRaw.saveLibrary === "string", "candidateRaw must carry saveLibrary string");
  assert.equal(plan.summary.saveLibrary, "full-restore-clean", "clean destination must select full-restore-clean");
  assert.equal(plan.candidateRaw.activeShowdown, null, "full library restore clears singleton activeShowdown");

  const restoredLibrary = JSON.parse(plan.candidateRaw.saveLibrary);
  assert.equal(restoredLibrary.activeSaveId, FULL_LIBRARY.activeSaveId, "activeSaveId preserved");
  assert.equal(restoredLibrary.saves.length, 2, "both Saves restored");
  assert.equal(restoredLibrary.profiles.length, 3, "all profiles restored");

  // Identity preservation invariants
  const alexProfiles = restoredLibrary.profiles.filter(p => p.displayName === "Alex");
  assert.equal(alexProfiles.length, 2, "same-name distinct Alex profiles preserved");
  assert.notEqual(alexProfiles[0].profileId, alexProfiles[1].profileId);

  const saveOne = restoredLibrary.saves.find(s => s.saveId === "save_111111111111111111111111");
  const saveTwo = restoredLibrary.saves.find(s => s.saveId === "save_222222222222222222222222");
  assert.ok(saveOne, "Save One identity preserved");
  assert.ok(saveTwo, "Save Two identity preserved");
  assert.equal(
    saveOne.showdown.identity.managerProfileIds.playerTwo,
    "profile_cccccccccccccccccccccccc",
    "explicit cross-Save profile reuse preserved"
  );
  assert.equal(
    saveTwo.showdown.identity.managerProfileIds.playerTwo,
    null,
    "unresolved historical role remains null"
  );

  // Existing-data without explicit use-backup must keep-current (no silent overwrite)
  const existingRaw = {
    saveLibrary: JSON.stringify({ schemaVersion: 1, activeSaveId: "save_existing", profiles: [], saves: [] }),
    activeShowdown: null,
    legacyShowdowns: null,
    preferences: null
  };
  const keepChoices = {
    active: "keep-current",
    legacy: "keep-current",
    preferences: "keep-current",
    saveLibrary: "keep-current"
  };
  const keepPlan = context.window.createCareerModeRestorePlan(analysis, existingRaw, keepChoices);
  assert.equal(keepPlan.ok, true);
  assert.equal(keepPlan.summary.saveLibrary, "keep-current", "existing data with keep-current must not replace library");
  assert.ok(!Object.prototype.hasOwnProperty.call(keepPlan.candidateRaw, "saveLibrary") || keepPlan.candidateRaw.saveLibrary === undefined,
    "keep-current must not put saveLibrary into candidateRaw");

  // Existing-data with explicit use-backup must select replace-all
  const replaceChoices = {
    active: "use-backup",
    legacy: "replace-with-backup",
    preferences: "use-backup",
    saveLibrary: "use-backup"
  };
  const replacePlan = context.window.createCareerModeRestorePlan(analysis, existingRaw, replaceChoices);
  assert.equal(replacePlan.ok, true);
  assert.equal(replacePlan.summary.saveLibrary, "replace-all", "existing data with explicit use-backup must be replace-all");
  assert.ok(typeof replacePlan.candidateRaw.saveLibrary === "string");
  const replaced = JSON.parse(replacePlan.candidateRaw.saveLibrary);
  assert.equal(replaced.activeSaveId, FULL_LIBRARY.activeSaveId);
  assert.equal(replaced.saves.length, 2);

  // Omitted saveLibrary choice defaults to keep-current (safe default; UI must still present explicit choice)
  const omittedChoicePlan = context.window.createCareerModeRestorePlan(analysis, existingRaw, {
    active: "use-backup",
    legacy: "keep-current",
    preferences: "use-backup"
    // saveLibrary omitted → defaults to keep-current per plan implementation
  });
  assert.equal(omittedChoicePlan.ok, true, "omitted saveLibrary defaults safely to keep-current");
  assert.equal(omittedChoicePlan.summary.saveLibrary, "keep-current");

  // Invalid saveLibrary choice value must require a real choice
  const invalidChoicePlan = context.window.createCareerModeRestorePlan(analysis, existingRaw, {
    active: "use-backup",
    legacy: "keep-current",
    preferences: "use-backup",
    saveLibrary: "merge" // not a legal value
  });
  assert.equal(invalidChoicePlan.ok, false);
  assert.equal(invalidChoicePlan.status, "choice-required");
  assert.ok(
    invalidChoicePlan.errors.some(e => /complete Save Library|replace it entirely/i.test(e)),
    "invalid saveLibrary choice must surface the explicit replace-or-keep requirement"
  );

  console.log("multi-save-portability clean full-library restore plan (locked fixtures): PASS");
})();

// ---------------------------------------------------------------------------
// Deterministic storage-transaction clean full-library round-trip
// Seed locked library → plan clean restore → Candidate C transaction apply → assert identities
// ---------------------------------------------------------------------------

(function assertCleanFullLibraryTransactionRoundTrip() {
  const { webcrypto } = require("node:crypto");
  const { TextEncoder } = require("node:util");

  const KEYS = {
    saveLibrary: "careerModeShowdown.saveLibrary",
    activeShowdown: "careerModeShowdown.activeShowdown",
    legacyShowdowns: "careerModeShowdown.legacyShowdowns",
    preferences: "careerModeShowdown.preferences"
  };

  function createStorageRuntime() {
    const values = new Map();
    const writes = [];
    const localStorage = {
      getItem(key) { return values.has(key) ? values.get(key) : null; },
      setItem(key, value) {
        const text = String(value);
        writes.push({ type: "set", key, value: text });
        values.set(key, text);
      },
      removeItem(key) {
        writes.push({ type: "remove", key });
        values.delete(key);
      }
    };
    const context = {
      console: { log() {}, warn() {}, error() {} },
      localStorage,
      window: null,
      document: { documentElement: { dataset: {} }, visibilityState: "visible", addEventListener() {}, querySelector() { return null; } },
      currentShowdown: null,
      structuredClone: typeof structuredClone === "function" ? structuredClone : (v) => JSON.parse(JSON.stringify(v)),
      crypto: webcrypto,
      TextEncoder,
      setTimeout,
      clearTimeout,
      CustomEvent: class CustomEvent { constructor(type, opts = {}) { this.type = type; this.detail = opts.detail; } },
      JSON, Date, Object, Array, Map, Set, Number, String, Boolean, Error, Math, parseInt, isNaN
    };
    context.window = context;
    context.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {}, removeEventListener() {}, removeListener() {} });
    context.addEventListener = () => {};
    context.dispatchEvent = () => true;
    context.showAppNotice = () => {};

    vm.createContext(context);
    // Load order matches save-library runtime contracts: foundation → transaction → storage → persistence → runtime → restore
    vm.runInContext(fs.readFileSync(path.join("js", "saveLibraryFoundation.js"), "utf8"), context, { filename: "js/saveLibraryFoundation.js" });
    vm.runInContext(fs.readFileSync(path.join("js", "storageTransaction.js"), "utf8"), context, { filename: "js/storageTransaction.js" });
    vm.runInContext(fs.readFileSync(path.join("js", "storage.js"), "utf8"), context, { filename: "js/storage.js" });
    vm.runInContext(fs.readFileSync(path.join("js", "saveLibraryPersistence.js"), "utf8"), context, { filename: "js/saveLibraryPersistence.js" });
    vm.runInContext(fs.readFileSync(path.join("js", "saveLibraryRuntime.js"), "utf8"), context, { filename: "js/saveLibraryRuntime.js" });
    vm.runInContext(restoreSource, context, { filename: "js/restore.js" });

    return {
      context,
      values,
      writes,
      snapshot() {
        return {
          saveLibrary: values.has(KEYS.saveLibrary) ? values.get(KEYS.saveLibrary) : null,
          activeShowdown: values.has(KEYS.activeShowdown) ? values.get(KEYS.activeShowdown) : null,
          legacyShowdowns: values.has(KEYS.legacyShowdowns) ? values.get(KEYS.legacyShowdowns) : null,
          preferences: values.has(KEYS.preferences) ? values.get(KEYS.preferences) : null
        };
      },
      clear() {
        values.clear();
        writes.length = 0;
      },
      seedLibrary(library, legacy, preferences) {
        values.set(KEYS.saveLibrary, JSON.stringify(library));
        if (legacy != null) values.set(KEYS.legacyShowdowns, JSON.stringify(legacy));
        if (preferences != null) values.set(KEYS.preferences, JSON.stringify(preferences));
        // no activeShowdown singleton — clean library authority
      }
    };
  }

  const runtime = createStorageRuntime();
  assert.equal(typeof runtime.context.createCareerModeRestorePlan, "function");
  assert.equal(typeof runtime.context.applyCareerModeRawStorageTransaction, "function");
  assert.equal(typeof runtime.context.captureCareerModeRawRestoreSnapshot, "function");

  // --- Seed locked multi-Save library on "source" device ---
  runtime.seedLibrary(FULL_LIBRARY, LEGACY_SHOWDOWNS, PREFERENCES);
  const sourceSnap = runtime.snapshot();
  assert.ok(sourceSnap.saveLibrary, "source must hold saveLibrary");
  const sourceLibrary = JSON.parse(sourceSnap.saveLibrary);
  assert.equal(sourceLibrary.saves.length, 2);
  assert.equal(sourceLibrary.activeSaveId, FULL_LIBRARY.activeSaveId);

  // --- Build restore plan as if a formatVersion 2 backup was analyzed ---
  const analysis = {
    ok: true,
    checksum: { verified: true },
    formatVersion: 2,
    migratedPayload: {
      saveLibrary: FULL_LIBRARY,
      activeShowdown: SAVE_ONE.showdown,
      legacyShowdowns: LEGACY_SHOWDOWNS,
      preferences: PREFERENCES
    }
  };

  // --- Clean destination: wipe storage ---
  runtime.clear();
  const cleanRaw = runtime.snapshot();
  assert.equal(cleanRaw.saveLibrary, null);
  assert.equal(cleanRaw.activeShowdown, null);

  const cleanChoices = {
    active: "use-backup",
    legacy: "replace-with-backup",
    preferences: "use-backup",
    saveLibrary: "use-backup"
  };
  const plan = runtime.context.createCareerModeRestorePlan(analysis, cleanRaw, cleanChoices);
  assert.equal(plan.ok, true, `clean plan failed: ${(plan.errors || []).join("; ")}`);
  assert.equal(plan.summary.saveLibrary, "full-restore-clean");
  assert.ok(typeof plan.candidateRaw.saveLibrary === "string");
  assert.equal(plan.candidateRaw.activeShowdown, null);

  // --- Candidate C transaction apply (exact expectedRaw = clean empty) ---
  const expectedRaw = {
    saveLibrary: null,
    activeShowdown: null,
    legacyShowdowns: null,
    preferences: null
  };
  // candidateRaw may only carry the keys being written
  const candidateRaw = {
    saveLibrary: plan.candidateRaw.saveLibrary,
    activeShowdown: null,
    legacyShowdowns: plan.candidateRaw.legacyShowdowns != null ? plan.candidateRaw.legacyShowdowns : JSON.stringify(LEGACY_SHOWDOWNS),
    preferences: plan.candidateRaw.preferences != null ? plan.candidateRaw.preferences : JSON.stringify(PREFERENCES)
  };

  const tx = runtime.context.applyCareerModeRawStorageTransaction(candidateRaw, expectedRaw);
  assert.equal(tx.ok, true, `transaction failed: status=${tx && tx.status} errors=${JSON.stringify(tx && tx.errors)}`);
  assert.ok(tx.status === "success" || tx.status === "no-op", `unexpected tx status: ${tx.status}`);

  // --- Assert restored identities on clean device ---
  const after = runtime.snapshot();
  assert.ok(after.saveLibrary, "saveLibrary must be restored on clean device");
  assert.equal(after.activeShowdown, null, "singleton activeShowdown must stay null after full-library restore");

  const restored = JSON.parse(after.saveLibrary);
  assert.equal(restored.activeSaveId, FULL_LIBRARY.activeSaveId, "activeSaveId preserved across round-trip");
  assert.equal(restored.saves.length, 2, "both Saves restored");
  assert.equal(restored.profiles.length, 3, "all profiles restored");

  const alex = restored.profiles.filter(p => p.displayName === "Alex");
  assert.equal(alex.length, 2, "same-name distinct Alex profiles survive round-trip");
  assert.notEqual(alex[0].profileId, alex[1].profileId);

  const s1 = restored.saves.find(s => s.saveId === "save_111111111111111111111111");
  const s2 = restored.saves.find(s => s.saveId === "save_222222222222222222222222");
  assert.ok(s1 && s2, "stable save_* IDs preserved");
  assert.equal(s1.showdown.identity.managerProfileIds.playerTwo, "profile_cccccccccccccccccccccccc", "explicit profile reuse preserved");
  assert.equal(s2.showdown.identity.managerProfileIds.playerTwo, null, "unresolved historical role remains null");

  // Legacy + preferences also landed
  assert.ok(after.legacyShowdowns, "legacy restored");
  assert.ok(after.preferences, "preferences restored");

  // --- Idempotent retry: applying the same candidate against the now-current expected must succeed or no-op without corruption ---
  const afterExpected = {
    saveLibrary: after.saveLibrary,
    activeShowdown: after.activeShowdown,
    legacyShowdowns: after.legacyShowdowns,
    preferences: after.preferences
  };
  const retry = runtime.context.applyCareerModeRawStorageTransaction(candidateRaw, afterExpected);
  assert.equal(retry.ok, true, `retry must not fail: ${retry && retry.status}`);
  const afterRetry = runtime.snapshot();
  assert.deepEqual(JSON.parse(afterRetry.saveLibrary).activeSaveId, FULL_LIBRARY.activeSaveId, "retry preserves identity");
  assert.equal(JSON.parse(afterRetry.saveLibrary).saves.length, 2);

  console.log("multi-save-portability clean full-library storage-transaction round-trip: PASS");
})();

// ---------------------------------------------------------------------------
// Existing-data explicit replace-all under Candidate C + corrupt refusal
// ---------------------------------------------------------------------------

(function assertExistingDataReplaceAndCorruptRefusal() {
  const { webcrypto } = require("node:crypto");
  const { TextEncoder } = require("node:util");

  const KEYS = {
    saveLibrary: "careerModeShowdown.saveLibrary",
    activeShowdown: "careerModeShowdown.activeShowdown",
    legacyShowdowns: "careerModeShowdown.legacyShowdowns",
    preferences: "careerModeShowdown.preferences"
  };

  function createStorageRuntime() {
    const values = new Map();
    const writes = [];
    const localStorage = {
      getItem(key) { return values.has(key) ? values.get(key) : null; },
      setItem(key, value) {
        const text = String(value);
        writes.push({ type: "set", key, value: text });
        values.set(key, text);
      },
      removeItem(key) {
        writes.push({ type: "remove", key });
        values.delete(key);
      }
    };
    const context = {
      console: { log() {}, warn() {}, error() {} },
      localStorage,
      window: null,
      document: { documentElement: { dataset: {} }, visibilityState: "visible", addEventListener() {}, querySelector() { return null; } },
      currentShowdown: null,
      structuredClone: typeof structuredClone === "function" ? structuredClone : (v) => JSON.parse(JSON.stringify(v)),
      crypto: webcrypto,
      TextEncoder,
      setTimeout,
      clearTimeout,
      CustomEvent: class CustomEvent { constructor(type, opts = {}) { this.type = type; this.detail = opts.detail; } },
      JSON, Date, Object, Array, Map, Set, Number, String, Boolean, Error, Math, parseInt, isNaN
    };
    context.window = context;
    context.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {}, removeEventListener() {}, removeListener() {} });
    context.addEventListener = () => {};
    context.dispatchEvent = () => true;
    context.showAppNotice = () => {};

    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join("js", "saveLibraryFoundation.js"), "utf8"), context);
    vm.runInContext(fs.readFileSync(path.join("js", "storageTransaction.js"), "utf8"), context);
    vm.runInContext(fs.readFileSync(path.join("js", "storage.js"), "utf8"), context);
    vm.runInContext(fs.readFileSync(path.join("js", "saveLibraryPersistence.js"), "utf8"), context);
    vm.runInContext(fs.readFileSync(path.join("js", "saveLibraryRuntime.js"), "utf8"), context);
    vm.runInContext(restoreSource, context);

    return {
      context,
      values,
      writes,
      snapshot() {
        return {
          saveLibrary: values.has(KEYS.saveLibrary) ? values.get(KEYS.saveLibrary) : null,
          activeShowdown: values.has(KEYS.activeShowdown) ? values.get(KEYS.activeShowdown) : null,
          legacyShowdowns: values.has(KEYS.legacyShowdowns) ? values.get(KEYS.legacyShowdowns) : null,
          preferences: values.has(KEYS.preferences) ? values.get(KEYS.preferences) : null
        };
      }
    };
  }

  const analysis = {
    ok: true,
    checksum: { verified: true },
    formatVersion: 2,
    migratedPayload: {
      saveLibrary: FULL_LIBRARY,
      activeShowdown: SAVE_ONE.showdown,
      legacyShowdowns: LEGACY_SHOWDOWNS,
      preferences: PREFERENCES
    }
  };

  // --- Existing-data with keep-current: transaction must not touch saveLibrary ---
  {
    const runtime = createStorageRuntime();
    const existingLibrary = {
      schemaVersion: 1,
      activeSaveId: "save_existing_xxxxxxxxxxxxxxxx",
      profiles: [{ schemaVersion: 1, profileId: "profile_existing_xxxxxxxxxxxxxxx", displayName: "Existing", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }],
      saves: [{ schemaVersion: 1, saveId: "save_existing_xxxxxxxxxxxxxxxx", showdown: { id: 1, name: "Existing Save", status: "Active" } }]
    };
    runtime.values.set(KEYS.saveLibrary, JSON.stringify(existingLibrary));
    runtime.values.set(KEYS.preferences, JSON.stringify({ motion: "reduce" }));
    const existingRaw = runtime.snapshot();

    const keepPlan = runtime.context.createCareerModeRestorePlan(analysis, existingRaw, {
      active: "keep-current",
      legacy: "keep-current",
      preferences: "keep-current",
      saveLibrary: "keep-current"
    });
    assert.equal(keepPlan.ok, true);
    assert.equal(keepPlan.summary.saveLibrary, "keep-current");
    // No saveLibrary in candidate → nothing to apply for library
    assert.ok(!Object.prototype.hasOwnProperty.call(keepPlan.candidateRaw, "saveLibrary") || keepPlan.candidateRaw.saveLibrary === undefined);

    // Apply only what the plan selected (empty candidate for library keys)
    if (Object.keys(keepPlan.candidateRaw).length > 0) {
      const tx = runtime.context.applyCareerModeRawStorageTransaction(keepPlan.candidateRaw, existingRaw);
      assert.equal(tx.ok, true);
    }
    const afterKeep = runtime.snapshot();
    const kept = JSON.parse(afterKeep.saveLibrary);
    assert.equal(kept.activeSaveId, "save_existing_xxxxxxxxxxxxxxxx", "keep-current must leave existing library untouched");
  }

  // --- Existing-data with explicit use-backup: full replace under Candidate C ---
  {
    const runtime = createStorageRuntime();
    const existingLibrary = {
      schemaVersion: 1,
      activeSaveId: "save_existing_xxxxxxxxxxxxxxxx",
      profiles: [{ schemaVersion: 1, profileId: "profile_existing_xxxxxxxxxxxxxxx", displayName: "Existing", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }],
      saves: [{ schemaVersion: 1, saveId: "save_existing_xxxxxxxxxxxxxxxx", showdown: { id: 1, name: "Existing Save", status: "Active" } }]
    };
    runtime.values.set(KEYS.saveLibrary, JSON.stringify(existingLibrary));
    runtime.values.set(KEYS.preferences, JSON.stringify({ motion: "reduce" }));
    const existingRaw = runtime.snapshot();

    const replacePlan = runtime.context.createCareerModeRestorePlan(analysis, existingRaw, {
      active: "use-backup",
      legacy: "replace-with-backup",
      preferences: "use-backup",
      saveLibrary: "use-backup"
    });
    assert.equal(replacePlan.ok, true);
    assert.equal(replacePlan.summary.saveLibrary, "replace-all");

    const candidateRaw = {
      saveLibrary: replacePlan.candidateRaw.saveLibrary,
      activeShowdown: null,
      legacyShowdowns: replacePlan.candidateRaw.legacyShowdowns != null ? replacePlan.candidateRaw.legacyShowdowns : JSON.stringify(LEGACY_SHOWDOWNS),
      preferences: replacePlan.candidateRaw.preferences != null ? replacePlan.candidateRaw.preferences : JSON.stringify(PREFERENCES)
    };
    const tx = runtime.context.applyCareerModeRawStorageTransaction(candidateRaw, existingRaw);
    assert.equal(tx.ok, true, `replace-all transaction failed: ${tx && tx.status}`);

    const after = runtime.snapshot();
    const restored = JSON.parse(after.saveLibrary);
    assert.equal(restored.activeSaveId, FULL_LIBRARY.activeSaveId, "replace-all restores backup activeSaveId");
    assert.equal(restored.saves.length, 2, "replace-all restores both backup Saves");
    assert.equal(restored.profiles.length, 3);
    assert.equal(after.activeShowdown, null);

    // Existing library must be gone
    assert.ok(!restored.saves.some(s => s.saveId === "save_existing_xxxxxxxxxxxxxxxx"), "old existing save must not survive replace-all");
  }

  // --- Corrupt / unverified analysis must refuse before mutation ---
  {
    const runtime = createStorageRuntime();
    runtime.values.set(KEYS.saveLibrary, JSON.stringify(FULL_LIBRARY));
    const before = runtime.snapshot();

    const blockedAnalysis = {
      ok: false,
      checksum: { verified: false },
      formatVersion: 2,
      migratedPayload: { saveLibrary: FULL_LIBRARY }
    };
    const blockedPlan = runtime.context.createCareerModeRestorePlan(blockedAnalysis, before, {
      active: "use-backup",
      legacy: "replace-with-backup",
      preferences: "use-backup",
      saveLibrary: "use-backup"
    });
    assert.equal(blockedPlan.ok, false);
    assert.equal(blockedPlan.status, "analysis-blocked");
    // Storage untouched
    assert.deepEqual(runtime.snapshot(), before, "blocked analysis must not mutate storage");
  }

  // --- Truncated / missing payload library with verified checksum still requires valid migrated payload ---
  {
    const runtime = createStorageRuntime();
    const before = runtime.snapshot();
    const badPayload = {
      ok: true,
      checksum: { verified: true },
      formatVersion: 2,
      migratedPayload: null
    };
    const badPlan = runtime.context.createCareerModeRestorePlan(badPayload, before, {
      active: "use-backup",
      legacy: "keep-current",
      preferences: "use-backup",
      saveLibrary: "use-backup"
    });
    assert.equal(badPlan.ok, false);
    assert.equal(badPlan.status, "analysis-blocked");
    assert.deepEqual(runtime.snapshot(), before);
  }

  console.log("multi-save-portability existing-data replace + corrupt refusal: PASS");
})();

// ---------------------------------------------------------------------------
// Minimal user-facing saveLibrary choice surface (restoreUI)
// ---------------------------------------------------------------------------

(function assertRestoreUISaveLibraryChoice() {
  const restoreUISource = fs.readFileSync(path.join("js", "restoreUI.js"), "utf8");
  assert.ok(
    restoreUISource.includes('saveLibrary:""') || restoreUISource.includes('saveLibrary: ""') || /saveLibrary\s*:\s*""/.test(restoreUISource),
    "restoreUI choices must include saveLibrary"
  );
  assert.ok(
    restoreUISource.includes('selectControl("saveLibrary"'),
    "restoreUI must present a SAVE LIBRARY choice control for existing-data full-library backups"
  );
  assert.ok(
    restoreUISource.includes("Replace entire Save Library with backup"),
    "restoreUI must offer explicit replace-all wording for the full library"
  );
  assert.ok(
    restoreUISource.includes("full-restore-clean") || restoreUISource.includes("Save Library full restore"),
    "restoreUI plan summary must surface full-restore-clean"
  );
  console.log("multi-save-portability restoreUI saveLibrary choice surface: PASS");
})();

console.log("multi-save-portability-contracts: deterministic export + plan + clean/existing-data transaction round-trips + corrupt refusal + minimal UI choice surface green. Chromium coverage remains next.");
