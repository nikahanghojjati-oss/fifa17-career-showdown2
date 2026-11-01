"use strict";
// r87 shared reads meter (B2) against the COMPOSED production Rules (firestore.spark.generated.rules, built by BOTH scripts).
// rivalries/{rid}/meters/{managerRole}: get for members of the live paired rivalry; create/update only of the signed-in manager's
// OWN role document, exact keys, bounded whole numbers, at most three season costs, updatedAt == request.time; never list or delete.
//   R1-R4  allowed: own role create and update, both members read both documents.
//   D1-D9  denied: the partner's role, a stranger, signed out, list, delete, a closed rivalry, an unknown role.
//   S1-S9  denied shapes: extra or missing key, wrong types and bounds, a client clock, another rivalry or role in the data.
//   C1     the REAL budget layer of two pages (js/sparkPrivatePairing.js) writes each phone's document and reads the partner's
//          through these Rules, and both pages then show the same total, cost per season and seasons left.
// Run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-reads-meter \
//        "node tests/firebase/shared-reads-meter-emulator.cjs"
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const firestoreSdk = require("firebase/firestore");
const { Timestamp, collection, deleteDoc, doc, getDoc, getDocs, setDoc, serverTimestamp } = firestoreSdk;
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");

const ROOT = path.resolve(__dirname, "../..");
const PROJECT_ID = process.env.GCLOUD_PROJECT || "demo-cms-reads-meter";
const A = "acct_meter_daniel", B = "acct_meter_nik", C = "acct_meter_stranger";
const R = `pair_${"3".repeat(64)}`, CLOSED = `pair_${"4".repeat(64)}`;
const PA = `profile_${"5".repeat(24)}`, PB = `profile_${"6".repeat(24)}`, SA = `save_${"7".repeat(24)}`, SB = `save_${"8".repeat(24)}`;
let checks = 0;
const ok = (id, label) => { checks += 1; process.stdout.write(`ok ${checks} ${id} ${label}\n`); };

function buildComposedRules() {
  for (const script of ["build-production-firestore-rules.mjs", "build-production-firestore-rules-with-persistent-pair.mjs"]) {
    const built = spawnSync(process.execPath, [path.join(ROOT, "scripts", script)], { cwd: ROOT, encoding: "utf8" });
    assert.equal(built.status, 0, `${script} failed: ${built.stderr}`);
  }
  const rules = fs.readFileSync(path.join(ROOT, "firestore.spark.generated.rules"), "utf8");
  assert.match(rules, /match \/meters\/\{managerRole\}/, "composed Rules must contain the shared reads meter match");
  return rules;
}
function account(id) { return { objectType: "account", objectId: id, lifecycleState: "live", data: { status: "active" } }; }
function rivalry(id, connectionState = "active") {
  return { objectType: "rivalry", objectId: id, lifecycleState: "live", data: { connectionState, authorizedAccountIds: [A, B], managerSlots: [
    { slotId: "playerOne", accountId: A, profileId: PA, saveId: SA, entitlementState: "active" },
    { slotId: "playerTwo", accountId: B, profileId: PB, saveId: SB, entitlementState: "active" }
  ] } };
}
function pacificDay(at = Date.now()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(at)); }
function meter(role, extra = {}) {
  return { schemaVersion: 1, objectType: "readsMeter", rivalryId: R, role, day: pacificDay(), season: 2, game: 1234, career: 56, costs: [320, 311], updatedAt: serverTimestamp(), ...extra };
}
const BUDGET_SOURCE = (() => { const source = fs.readFileSync(path.join(ROOT, "js/sparkPrivatePairing.js"), "utf8"); return source.slice(source.indexOf("// Firestore budget layer (r75).")); })();

(async () => {
  const env = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules: buildComposedRules() } });
  try {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      for (const id of [A, B, C]) await setDoc(doc(db, "accounts", id), account(id));
      await setDoc(doc(db, "rivalries", R), rivalry(R));
      await setDoc(doc(db, "rivalries", CLOSED), rivalry(CLOSED, "closed"));
      await setDoc(doc(db, "rivalries", CLOSED, "meters", "playerOne"), { ...meter("playerOne"), rivalryId: CLOSED, updatedAt: Timestamp.now() });
    });
    const as = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
    const ref = (db, role, rid = R) => doc(db, "rivalries", rid, "meters", role);

    await assertSucceeds(setDoc(ref(as(A), "playerOne"), meter("playerOne")));
    ok("R1", "playerOne creates his own role's meter document");
    await assertSucceeds(setDoc(ref(as(A), "playerOne"), meter("playerOne", { season: 3, game: 1600, costs: [320, 311, 330] })));
    ok("R2", "and overwrites it the next season (update)");
    await assertSucceeds(setDoc(ref(as(B), "playerTwo"), meter("playerTwo", { costs: [] })));
    ok("R3", "playerTwo writes his own (no season cost yet is allowed)");
    await assertSucceeds(getDoc(ref(as(A), "playerTwo")));
    await assertSucceeds(getDoc(ref(as(B), "playerOne")));
    ok("R4", "each member reads the partner's document");

    await assertFails(setDoc(ref(as(A), "playerTwo"), meter("playerTwo")));
    await assertFails(setDoc(ref(as(B), "playerOne"), meter("playerOne")));
    ok("D1", "nobody writes the partner's role document, even with the partner's role in the data");
    await assertFails(getDoc(ref(as(C), "playerOne")));
    await assertFails(setDoc(ref(as(C), "playerOne"), meter("playerOne")));
    ok("D2", "a signed-in stranger can neither read nor write");
    await assertFails(getDoc(ref(as(null), "playerOne")));
    await assertFails(setDoc(ref(as(null), "playerOne"), meter("playerOne")));
    ok("D3", "signed out: denied");
    await assertFails(getDocs(collection(as(A), "rivalries", R, "meters")));
    ok("D4", "list is never allowed");
    await assertFails(deleteDoc(ref(as(A), "playerOne")));
    ok("D5", "delete is never allowed, not even the own document");
    await assertFails(getDoc(ref(as(A), "playerOne", CLOSED)));
    await assertFails(setDoc(ref(as(A), "playerOne", CLOSED), { ...meter("playerOne"), rivalryId: CLOSED }));
    ok("D6", "a closed rivalry: no read, no write");
    await assertFails(setDoc(ref(as(A), "playerThree"), meter("playerThree")));
    await assertFails(setDoc(ref(as(A), "current"), meter("playerOne")));
    ok("D7", "only the two role ids exist");
    await assertFails(setDoc(ref(as(A), "playerOne", `pair_${"9".repeat(64)}`), { ...meter("playerOne"), rivalryId: `pair_${"9".repeat(64)}` }));
    ok("D8", "a rivalry that does not exist: denied");
    await assertFails(setDoc(doc(as(A), "rivalries", R, "meters", "playerOne", "extra", "x"), { a: 1 }));
    ok("D9", "nothing below a meter document");

    const bad = async (id, label, data) => { await assertFails(setDoc(ref(as(A), "playerOne"), data)); ok(id, label); };
    await bad("S1", "an extra key is refused", meter("playerOne", { note: "x" }));
    { const missing = meter("playerOne"); delete missing.career; await bad("S2", "a missing key is refused", missing); }
    await bad("S3", "another rivalry or role in the data is refused", meter("playerOne", { rivalryId: CLOSED }));
    await assertFails(setDoc(ref(as(A), "playerOne"), meter("playerOne", { role: "playerTwo" })));
    await bad("S4", "a wrong objectType or schemaVersion is refused", meter("playerOne", { objectType: "readsMeterV2" }));
    await assertFails(setDoc(ref(as(A), "playerOne"), meter("playerOne", { schemaVersion: 2 })));
    for (const day of ["2026-13-01", "2026-1-01", "yesterday", "x".repeat(2000), 20261031]) await assertFails(setDoc(ref(as(A), "playerOne"), meter("playerOne", { day })));
    ok("S5", "day must be YYYY-MM-DD (bounded, no free text)");
    for (const season of [0, 11, 2.5, "2"]) await assertFails(setDoc(ref(as(A), "playerOne"), meter("playerOne", { season })));
    ok("S6", "season is a whole number 1-10");
    for (const game of [-1, 1000001, 12.5, "100"]) await assertFails(setDoc(ref(as(A), "playerOne"), meter("playerOne", { game })));
    await assertFails(setDoc(ref(as(A), "playerOne"), meter("playerOne", { career: -3 })));
    ok("S7", "game and career are whole numbers 0-1,000,000");
    for (const costs of [[1, 2, 3, 4], [0], [100001], [320.5], ["320"], "320", { a: 1 }]) await assertFails(setDoc(ref(as(A), "playerOne"), meter("playerOne", { costs })));
    ok("S8", "costs: at most three whole numbers 1-100,000");
    await bad("S9", "updatedAt must be the server time (request.time), never the phone's clock", meter("playerOne", { updatedAt: Timestamp.fromMillis(Date.now() - 60000) }));

    // ---- C1: the real budget layer of both phones, through these Rules ----
    await env.withSecurityRulesDisabled(async (context) => { for (const role of ["playerOne", "playerTwo"]) await deleteDoc(doc(context.firestore(), "rivalries", R, "meters", role)); });
    const page = (uid, role, bill) => {
      const storage = new Map([["careerModeFirestoreReadsDay", JSON.stringify({ day: pacificDay(), reads: 0, markReads: 0, seasons: [], costs: [], lastCost: 0, bill: { role, ...bill } })]]);
      // Timers run 40 times faster (8 s -> 200 ms, 45 s -> 1.1 s), in the same order; the contract test covers the real waits.
      const sandbox = { console, document: { visibilityState: "visible", documentElement: { dataset: {} }, addEventListener() {} }, addEventListener() {}, dispatchEvent() { return true; },
        CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
        setTimeout: (fn, ms) => setTimeout(fn, Math.round((Number(ms) || 0) / 40)), clearTimeout,
        readStorageValue: (key) => (storage.has(key) ? storage.get(key) : null), writeStorageValue: (key, value) => { storage.set(key, String(value)); return true; } };
      sandbox.globalThis = sandbox;
      vm.createContext(sandbox);
      vm.runInContext(BUDGET_SOURCE, sandbox, { filename: "sparkPrivatePairing.js#budget" });
      const db = as(uid), budget = sandbox.CareerModeFirestoreBudget;
      // The SDK checks plain objects by prototype; the page runs in its own vm realm here (in the browser it is one realm), so the
      // document is copied into this realm before it is written.
      const setHere = (target, data) => setDoc(target, { ...data, costs: Array.from(data.costs) });
      budget.services({ ok: true, firestore: db, auth: { currentUser: { uid } }, firestoreSdk: { doc, getDoc, setDoc: setHere, serverTimestamp, runTransaction: firestoreSdk.runTransaction } });
      return { budget, db, done: (season) => budget.noteSeasonDone(`${R}|${season}`, true, { role, season, rivalryId: R, firestore: db }) };
    };
    const daniel = page(A, "playerOne", { game: 1716, career: 12, markGame: 1390, costs: [323, 317], lastCost: 0 });
    const nik = page(B, "playerTwo", { game: 1301, career: 141, markGame: 1010, costs: [288, 292], lastCost: 0 });
    nik.done(3); await new Promise((resolve) => setTimeout(resolve, 300)); daniel.done(3);
    const settled = async () => { for (let i = 0; i < 200; i += 1) { if (!daniel.budget.readsToday().estimated && !nik.budget.readsToday().estimated) return; await new Promise((resolve) => setTimeout(resolve, 25)); } };
    await settled();
    const a = daniel.budget.seasonsLeftToday(), b = nik.budget.seasonsLeftToday();
    assert.equal(a.basis, "shared", `Daniel's page uses both documents (${JSON.stringify(daniel.budget.meterDocuments())})`);
    assert.equal(b.basis, "shared", "Nik's page uses both documents");
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), "both pages show the same seasons left and cost per season");
    assert.equal(daniel.budget.readsToday().billedEstimate, nik.budget.readsToday().billedEstimate, "and the same total");
    assert.equal(daniel.budget.meterDocuments().off, false, "the composed Rules accepted the real document");
    let stored = null;
    await env.withSecurityRulesDisabled(async (context) => { stored = (await getDoc(doc(context.firestore(), "rivalries", R, "meters", "playerTwo"))).data(); });
    assert.equal(stored.role, "playerTwo"); assert.equal(stored.season, 3); assert.ok(stored.updatedAt instanceof Timestamp);
    ok("C1", `the real budget layer of both phones writes and reads through these Rules: both show ${a.seasons} seasons left at ${a.billedPerSeason} a season`);

    console.log(`PASS shared reads meter emulator: ${checks} checks (member-only get, own-role bounded write, never list or delete; real budget layer end to end).`);
  } finally {
    await env.cleanup();
  }
})().catch((error) => { console.error(error); process.exit(1); });
