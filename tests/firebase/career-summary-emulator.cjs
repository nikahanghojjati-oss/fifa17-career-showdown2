"use strict";
// r86 career summaries against the COMPOSED production Rules (firestore.spark.generated.rules, built by BOTH scripts).
// accounts/{uid}/careerSummary/{rivalryId}: owner-only exact get; one create, checked against the closed rivalry root
// (completed: totals, winner and length equal the Terminal Close witness; abandoned / never-started: no witness, no totals);
// never updated, listed or deleted. E cases drive the real loader + js/careerSummaryStore.js end to end on a saved game.
// Run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-career-summary \
//        "node tests/firebase/career-summary-emulator.cjs"
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const firestoreSdk = require("firebase/firestore");
const { Timestamp, collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } = firestoreSdk;
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");

global.window = globalThis;
require("../../data/transferOptions.js");
const Reader = require("../../js/sparkCompletedShowdownReader.js");
const Loader = require("../../js/sparkClosedShowdownCareerLoader.js");
const Store = require("../../js/careerSummaryStore.js");

const ROOT = path.resolve(__dirname, "../..");
const PROJECT_ID = process.env.GCLOUD_PROJECT || "demo-cms-career-summary";
let checks = 0;
const ok = (id, label) => { checks += 1; process.stdout.write(`ok ${checks} ${id} ${label}\n`); };

function decodeValue(value) {
  const kind = Object.keys(value)[0];
  switch (kind) {
    case "nullValue": return null;
    case "booleanValue": return value.booleanValue;
    case "stringValue": return value.stringValue;
    case "integerValue": return Number(value.integerValue);
    case "doubleValue": return value.doubleValue;
    case "timestampValue": {
      const m = /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d{1,9}))?Z$/.exec(value.timestampValue);
      return new Timestamp(Date.parse(`${m[1]}Z`) / 1000, Number((m[2] || "").padEnd(9, "0")));
    }
    case "arrayValue": return (value.arrayValue.values || []).map(decodeValue);
    case "mapValue": return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, decodeValue(v)]));
    default: throw new Error(`fixture value type ${kind}`);
  }
}
function buildComposedRules() {
  for (const script of ["build-production-firestore-rules.mjs", "build-production-firestore-rules-with-persistent-pair.mjs"]) {
    const built = spawnSync(process.execPath, [path.join(ROOT, "scripts", script)], { cwd: ROOT, encoding: "utf8" });
    assert.equal(built.status, 0, `${script} failed: ${built.stderr}`);
  }
  const rules = fs.readFileSync(path.join(ROOT, "firestore.spark.generated.rules"), "utf8");
  assert.match(rules, /match \/accounts\/\{accountId\}\/careerSummary\/\{rivalryId\}/, "composed Rules must contain the career summary match");
  return rules;
}
const sha = (text) => "sha256:" + crypto.createHash("sha256").update(text).digest("hex");
function countingSdk(log) {
  return { ...firestoreSdk, getDoc: (ref) => { log.push(ref.path); return getDoc(ref); } };
}

(async () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/fixtures/saved-showdowns/r79-1season-win.json"), "utf8"));
  const RID = fixture.rivalryId;
  const rootItem = fixture.documents.find((d) => d.path === `rivalries/${RID}`);
  const rivalry = decodeValue({ mapValue: { fields: rootItem.fields } });
  const uid = {};
  for (const slot of rivalry.data.managerSlots) uid[slot.slotId] = slot.accountId;
  const D = uid.playerOne, N = uid.playerTwo, S = "acct_stranger_summary";
  const ABANDONED = "pair_" + "a".repeat(64), OPEN = "pair_" + "b".repeat(64);
  const env = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules: buildComposedRules() } });
  try {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (c) => {
      const db = c.firestore();
      for (const item of fixture.documents) await setDoc(doc(db, ...item.path.split("/")), decodeValue({ mapValue: { fields: item.fields } }));
      const bare = { ...rivalry.data };
      delete bare.terminalClose; delete bare.terminalProgress;
      await setDoc(doc(db, "rivalries", ABANDONED), { ...rivalry, objectId: ABANDONED, data: { ...bare, connectionState: "closed" } });
      await setDoc(doc(db, "rivalries", OPEN), { ...rivalry, objectId: OPEN, data: { ...bare, connectionState: "active" } });
    });
    const as = (id) => env.authenticatedContext(id).firestore();
    const read = await Reader.readCompletedShowdown({ firestore: as(D), firebaseSdk: firestoreSdk, user: { uid: D }, rivalryId: RID, cryptoImpl: crypto.webcrypto });
    assert.equal(read.status, "completed", `reader ${read.code}`);
    const payload = JSON.stringify(read), good = Store.documentFor(read, payload, sha(payload));
    const ref = (db, owner, id = RID) => doc(db, "accounts", owner, "careerSummary", id);

    const statusDoc = (id, status) => { const p = JSON.stringify({ status, rivalryId: id, ended: { endedAt: null, seasonsPlayed: 0 } }); return { schemaVersion: 1, objectType: "careerSummary", rivalryId: id, status, totalSeasons: null, managerTotals: null, winner: null, payload: p, payloadHash: sha(p) }; };
    // ---- R: the Rules ----
    const bad = (patch) => ({ ...good, ...patch });
    await assertFails(setDoc(ref(as(D), D), bad({ managerTotals: { playerOne: good.managerTotals.playerOne + 1, playerTwo: good.managerTotals.playerTwo } })));
    await assertFails(setDoc(ref(as(D), D), bad({ winner: good.winner === "playerOne" ? "playerTwo" : "playerOne" })));
    await assertFails(setDoc(ref(as(D), D), bad({ totalSeasons: good.totalSeasons + 1 })));
    await assertFails(setDoc(ref(as(D), D), bad({ status: "abandoned", totalSeasons: null, managerTotals: null, winner: null })));
    ok("R1", "a completed summary whose totals, winner, length or status disagree with the Terminal Close witness is refused");
    await assertFails(setDoc(ref(as(D), D), { ...good, extra: 1 }));
    await assertFails(setDoc(ref(as(D), D), bad({ payload: "x".repeat(262145) })));
    await assertFails(setDoc(ref(as(D), D), bad({ payloadHash: "sha256:nothex" })));
    await assertFails(setDoc(ref(as(D), D), bad({ rivalryId: ABANDONED })));
    await assertFails(setDoc(ref(as(D), D, "pair_short"), bad({ rivalryId: "pair_short" })));
    ok("R2", "extra keys, an oversized payload, a malformed hash or a mismatched / malformed id are refused");
    await assertFails(setDoc(ref(as(D), N), good));
    await assertFails(setDoc(ref(as(S), S), good));
    await assertFails(setDoc(ref(env.unauthenticatedContext().firestore(), D), good));
    ok("R3", "nobody writes another account's summary; an account outside the Showdown or signed out cannot write one");
    await assertSucceeds(setDoc(ref(as(D), D), good));
    await assertFails(setDoc(ref(as(D), D), good));
    await assertFails(updateDoc(ref(as(D), D), { winner: "draw" }));
    await assertFails(deleteDoc(ref(as(D), D)));
    await assertFails(getDocs(collection(as(D), "accounts", D, "careerSummary")));
    ok("R4", "the owner creates it once; a second create, an update, a delete and a list are refused");
    await assertSucceeds(getDoc(ref(as(D), D)));
    await assertFails(getDoc(ref(as(N), D)));
    await assertFails(getDoc(ref(as(S), D)));
    ok("R5", "only the owner can read a summary");
    const accountRef = (c, id) => doc(c.firestore(), "accounts", id);
    let liveAccount;
    await env.withSecurityRulesDisabled(async (c) => { liveAccount = (await getDoc(accountRef(c, D))).data(); await setDoc(accountRef(c, D), { ...liveAccount, data: { ...liveAccount.data, status: "disabled" } }); });
    await assertFails(getDoc(ref(as(D), D)));
    await assertFails(setDoc(ref(as(D), D, ABANDONED), statusDoc(ABANDONED, "abandoned")));
    await env.withSecurityRulesDisabled(async (c) => { await setDoc(accountRef(c, D), liveAccount); });
    await assertSucceeds(getDoc(ref(as(D), D)));
    ok("R5b", "a disabled account can neither read nor write its summaries; re-enabled, it reads them again");
    await assertFails(setDoc(ref(as(D), D, ABANDONED), { ...good, rivalryId: ABANDONED }));
    await assertFails(setDoc(ref(as(D), D, OPEN), statusDoc(OPEN, "abandoned")));
    await assertFails(setDoc(ref(as(D), D, ABANDONED), { ...statusDoc(ABANDONED, "abandoned"), winner: "playerOne" }));
    await assertFails(setDoc(ref(as(D), D, ABANDONED), statusDoc(ABANDONED, "hidden")));
    await assertSucceeds(setDoc(ref(as(D), D, ABANDONED), statusDoc(ABANDONED, "abandoned")));
    await assertSucceeds(setDoc(ref(as(N), N, ABANDONED), statusDoc(ABANDONED, "never-started")));
    ok("R6", "a closed root without a witness takes only a status summary with no totals; an open root takes none");

    // ---- E: the real loader on a saved game ----
    await env.withSecurityRulesDisabled(async (c) => { await deleteDoc(doc(c.firestore(), "accounts", D, "careerSummary", RID)); await deleteDoc(doc(c.firestore(), "accounts", D, "careerSummary", ABANDONED)); });
    for (const [manager, id] of [["daniel", D], ["nik", N]]) {
      Loader.clearClosedShowdownCache(); Store.forgetPhoneCopies();
      const coldLog = [], cold = await Loader.loadClosedShowdownCareer({ firestore: as(id), firebaseSdk: countingSdk(coldLog), user: { uid: id }, cryptoImpl: crypto.webcrypto });
      assert.equal(cold.status, "ready", `${manager}: cold ${cold.status}`);
      await Store.writesSettled();
      assert.ok(coldLog.includes(`rivalries/${RID}`) && coldLog.length >= 7, `${manager}: the first r86 open reads the game in full (${coldLog.length})`);
      const written = await getDoc(ref(as(id), id));
      assert.ok(written.exists(), `${manager}: the full read wrote the summary`);
      assert.equal(written.data().status, "completed");
      Loader.clearClosedShowdownCache(); Store.forgetPhoneCopies();
      const warmLog = [], warm = await Loader.loadClosedShowdownCareer({ firestore: as(id), firebaseSdk: countingSdk(warmLog), user: { uid: id }, cryptoImpl: crypto.webcrypto });
      assert.deepEqual(warmLog, [`accounts/${id}/careerIndex/current`, `accounts/${id}/careerSummary/${RID}`], `${manager}: a fresh page reads only the index and the summary`);
      assert.equal(JSON.stringify(warm.model), JSON.stringify(cold.model), `${manager}: the career from the summary equals the full read`);
      ok(`E1.${manager}`, `first r86 open: ${coldLog.length} gets and one summary write; a fresh page after it: 2 gets, identical career`);
    }
    // A summary the Rules would refuse (e.g. Rules not deployed yet) never hides the game: the full read still answers.
    await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), "accounts", D, "careerSummary", RID), { ...good, payloadHash: sha("tampered") }); });
    Loader.clearClosedShowdownCache(); Store.forgetPhoneCopies();
    const fallbackLog = [], fallback = await Loader.loadClosedShowdownCareer({ firestore: as(D), firebaseSdk: countingSdk(fallbackLog), user: { uid: D }, cryptoImpl: crypto.webcrypto });
    assert.equal(fallback.status, "ready");
    assert.ok(fallbackLog.includes(`rivalries/${RID}`), "a summary that fails its hash is ignored and the game is read in full");
    ok("E2", "a summary that fails its hash check is ignored: the game is read in full and still shows");
    console.log(`PASS career summary emulator: ${checks} checks (create-only owner summaries checked against the Terminal Close witness; first open writes, later opens read 1 per game).`);
  } finally {
    await env.cleanup();
  }
})().catch((error) => { console.error(error); process.exit(1); });
