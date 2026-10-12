const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const { TextEncoder } = require("node:util");

const read = path => fs.readFileSync(path, "utf8");
const keys = {
  saveLibrary: "careerModeShowdown.saveLibrary",
  activeShowdown: "careerModeShowdown.activeShowdown",
  legacyShowdowns: "careerModeShowdown.legacyShowdowns",
  preferences: "careerModeShowdown.preferences"
};

function showdown(id) {
  return {
    schemaVersion: 2, integrityWarnings: [], id, name: "Daniel vs Nik",
    managers: { playerOne: "Daniel", playerTwo: "Nik" },
    totalRounds: 3, currentRound: 1, status: "Created",
    selectedLeague: null, clubs: { playerOne: null, playerTwo: null },
    score: { playerOne: 0, playerTwo: 0 },
    transferChallenges: [], rounds: [],
    createdAt: "2026-10-12T00:00:00.000Z",
    updatedAt: "2026-10-12T00:00:00.000Z",
    completedAt: null, archivedAt: null
  };
}

function createRuntime() {
  const values = new Map([
    [keys.legacyShowdowns, "[]"],
    [keys.preferences, JSON.stringify({ schemaVersion: 2, reducedMotion: false, menuFeedback: true })]
  ]);
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const context = {
    console: { error() {}, warn() {}, log() {} },
    currentShowdown: null, localStorage: storage,
    structuredClone, crypto: webcrypto, TextEncoder, setTimeout, clearTimeout,
    CustomEvent: class {},
    document: { documentElement: { dataset: {} }, addEventListener() {}, visibilityState: "visible" },
    matchMedia() { return { matches: false, addEventListener() {}, addListener() {} }; },
    addEventListener() {}, dispatchEvent() {}, showAppNotice() {}
  };
  context.window = context;
  vm.createContext(context);
  for (const file of [
    "js/saveLibraryFoundation.js", "js/storageTransaction.js",
    "js/storage.js", "js/saveLibraryPersistence.js", "js/saveLibraryRuntime.js"
  ]) vm.runInContext(read(file), context);
  return { context, api: context.CareerModeSaveLibraryRuntime, values };
}

(async () => {
  const { context, api, values } = createRuntime();
  assert.equal((await api.activate()).ok, true);
  const first = await api.createShowdown(showdown("career-one"));
  const second = await api.createShowdown(showdown("career-two"));
  context.currentShowdown = structuredClone(second);

  // Hold the active-save switch at its async season-identity preparation.
  const foundation = context.CareerModeSaveLibraryFoundation;
  let releasePreparation;
  const preparationGate = new Promise(resolve => { releasePreparation = resolve; });
  let signalStarted;
  const preparationStarted = new Promise(resolve => { signalStarted = resolve; });
  context.CareerModeSaveLibraryFoundation = {
    ...foundation,
    async migrateShowdownIdentity(...args) {
      signalStarted();
      await preparationGate;
      return foundation.migrateShowdownIdentity(...args);
    }
  };

  const switchInFlight = api.switchActiveSave(first.identity.saveId);
  await preparationStarted;
  context.currentShowdown.status = "League Selected";
  assert.equal(api.saveCurrentShowdown(), true, "A career save during preparation must succeed");
  releasePreparation();

  await assert.rejects(
    switchInFlight,
    /Save Library changed while selecting the active Showdown/,
    "A delayed switch must reject its old library snapshot rather than overwrite the newer save"
  );

  const library = JSON.parse(values.get(keys.saveLibrary));
  assert.equal(library.activeSaveId, second.identity.saveId, "The previous career must remain active");
  assert.equal(
    library.saves.find(entry => entry.saveId === second.identity.saveId).showdown.status,
    "League Selected",
    "The newest written career state must not be lost"
  );
  assert.equal(context.currentShowdown.identity.saveId, second.identity.saveId);
  assert.equal(api.isReady(), false, "A conflicting switch must require fresh authority before another write");
  console.log("PASS active career switch rejects a stale async snapshot after a newer save");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
