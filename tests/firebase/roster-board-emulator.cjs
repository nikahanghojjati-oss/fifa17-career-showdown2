"use strict";
// r87 Roster Russian Roulette boards against the COMPOSED production Rules (firestore.spark.generated.rules, built by BOTH
// scripts). rivalries/{id}/rosterBoards/season_N_<role>: from season 2 each manager saves the board he holds for his spin
// once (create-only, own role only, Showdown under way, shared write authority); both managers read both; never updated,
// listed or deleted. E cases drive js/rosterBoardStore.js end to end.
// Run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-roster-board \
//        "node tests/firebase/roster-board-emulator.cjs"
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const firestoreSdk = require("firebase/firestore");
const { Timestamp, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } = firestoreSdk;
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");

global.window = globalThis;
require("../../data/transferOptions.js");
const Setup = require("../../js/sparkSharedShowdownSetup.js");
const Career = require("../../js/sparkSharedCareerStart.js");
const RRR = require("../../js/rosterRoulette.js");
const Store = require("../../js/rosterBoardStore.js");

const ROOT = path.resolve(__dirname, "../..");
const PROJECT_ID = process.env.GCLOUD_PROJECT || "demo-cms-roster-board";
const A = "acct_roster_daniel", B = "acct_roster_nik", STRANGER = "acct_roster_stranger";
const R = `pair_${"5".repeat(64)}`;
const S = `session_${"3".repeat(64)}`;
const DA = `device_${"a".repeat(32)}`, DB = `device_${"b".repeat(32)}`;
const PA = `profile_${"1".repeat(24)}`, PB = `profile_${"2".repeat(24)}`;
const SA = `save_${"3".repeat(24)}`, SB = `save_${"4".repeat(24)}`;
let checks = 0;
const ok = (id, label) => { checks += 1; process.stdout.write(`ok ${checks} ${id} ${label}\n`); };

function buildComposedRules() {
  for (const script of ["build-production-firestore-rules.mjs", "build-production-firestore-rules-with-persistent-pair.mjs"]) {
    const built = spawnSync(process.execPath, [path.join(ROOT, "scripts", script)], { cwd: ROOT, encoding: "utf8" });
    assert.equal(built.status, 0, `${script} failed: ${built.stderr}`);
  }
  const rules = fs.readFileSync(path.join(ROOT, "firestore.spark.generated.rules"), "utf8");
  assert.match(rules, /match \/rivalries\/\{rivalryId\}\/rosterBoards\/\{boardId\}/, "composed Rules must contain the roster board match");
  return rules;
}
function sdk() { return { Timestamp, doc, runTransaction: firestoreSdk.runTransaction, serverTimestamp }; }
function account(id, status = "active") { return { objectType: "account", objectId: id, lifecycleState: "live", data: { status } }; }
function device(id, state = "active") { return { objectType: "device", objectId: id, lifecycleState: "live", data: { deviceId: id, state } }; }
function rivalry() {
  return { objectType: "rivalry", objectId: R, lifecycleState: "live", data: { connectionState: "active", authorizedAccountIds: [A, B], managerSlots: [
    { slotId: "playerOne", accountId: A, profileId: PA, saveId: SA, entitlementState: "active" },
    { slotId: "playerTwo", accountId: B, profileId: PB, saveId: SB, entitlementState: "active" }
  ] } };
}
function session(now, state = "active") {
  const createdAt = Timestamp.fromMillis(now - 60_000), lastActivityAt = Timestamp.fromMillis(now - 1_000), expiresAt = Timestamp.fromMillis(now + 4 * 60 * 60 * 1000);
  return { schemaVersion: 1, objectType: "session", objectId: S, revision: 1, parentRevision: 0, lifecycleState: "live", contentHash: `sha256:${"0".repeat(64)}`, priorContentHash: `sha256:${"1".repeat(64)}`, updatedAt: lastActivityAt, updatedByAccountId: A, updatedByDeviceId: DA, data: { rivalryId: R, state, hostAccountId: A, memberAccountIds: [A, B], createdAt, expiresAt, lastActivityAt, revokedAt: null }, tombstone: null };
}
const op = (prefix, n) => prefix + Number(n).toString(16).padStart(32, "0");

// A three-season Showdown driven through the real providers: Setup confirmed by both and (unless careerStart is false)
// Career Start acknowledged by both, so the Showdown is under way.
async function prepare(env, { careerStart = true } = {}) {
  await env.clearFirestore();
  Store.forgetPhoneCopies();
  const now = Date.now();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "accounts", A), account(A)); await setDoc(doc(db, "accounts", B), account(B));
    await setDoc(doc(db, "accounts", A, "devices", DA), device(DA)); await setDoc(doc(db, "accounts", B, "devices", DB), device(DB));
    await setDoc(doc(db, "rivalries", R), rivalry()); await setDoc(doc(db, "rivalries", R, "sessions", S), session(now));
  });
  const dbA = env.authenticatedContext(A).firestore(), dbB = env.authenticatedContext(B).firestore();
  const base = (db, uid, deviceId, t) => ({ user: { uid }, firestore: db, firebaseSdk: sdk(), rivalryId: R, sessionId: S, deviceId, nowEpochMs: now + t, cryptoImpl: crypto.webcrypto });
  const a = (t) => base(dbA, A, DA, t), b = (t) => base(dbB, B, DB, t);
  const expectOk = (value, label) => { assert.equal(value.ok, true, `${label} failed: ${JSON.stringify(value)}`); return value; };
  for (const [type, baseRevision, n, extra] of [["open", 0, 1, {}], ["commit-league", 1, 2, {}], ["commit-clubs", 2, 3, {}], ["commit-length", 3, 4, { totalSeasons: 3 }]])
    expectOk(await Setup.mutate({ ...a(n * 10), type, baseRevision, operationId: op("setup_op_", n), ...extra }), `Setup ${type}`);
  expectOk(await Setup.mutate({ ...a(50), type: "confirm", baseRevision: 4, operationId: op("setup_op_", 5) }), "Setup confirm A");
  assert.equal(expectOk(await Setup.mutate({ ...b(60), type: "confirm", baseRevision: 5, operationId: op("setup_op_", 6) }), "Setup confirm B").state.phase, "SHOWDOWN_CONFIRMED");
  if (careerStart) {
    expectOk(await Career.acknowledge({ ...a(70), operationId: op("career_start_op_", 1), baseRevision: 0 }), "Career A");
    expectOk(await Career.acknowledge({ ...b(80), operationId: op("career_start_op_", 2), baseRevision: 1 }), "Career B");
  }
  return { dbA, dbB };
}

// A real board: the draft for season 2 (launch board minus the player shot in season 1) with the empty slot filled.
function boardRows(role, season = 2) {
  const draft = RRR.draft(R, { playerOne: "Liverpool", playerTwo: "Real Madrid" }, season, role, null)
    || RRR.board(role === "playerOne" ? "Liverpool" : "Real Madrid").map((p) => ({ pos: p.pos, name: p.name }));
  return draft.map((p) => ({ pos: p.pos, name: p.name || `New Signing ${p.slot}` }));
}
// The stored shape: 11 XI positions and 15 names (XI then subs), as js/rosterBoardStore.js writes it.
const flat = (rows) => ({ positions: rows.slice(0, 11).map((r) => r.pos), names: rows.map((r) => r.name) });
function raw(role, season, patch = {}) {
  return { schemaVersion: 1, objectType: "rosterBoard", rivalryId: R, seasonNumber: season, managerRole: role, ...flat(boardRows(role)), createdAt: serverTimestamp(), activeSessionId: S, updatedByDeviceId: role === "playerOne" ? DA : DB, ...patch };
}
const boardRef = (db, id) => doc(db, "rivalries", R, "rosterBoards", id);
const store = (db, uid, deviceId) => ({ firestore: db, firebaseSdk: sdk(), user: { uid }, rivalryId: R, sessionId: S, deviceId });

(async () => {
  const env = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules: buildComposedRules() } });
  try {
    // ---- R: the Rules ----
    let { dbA, dbB } = await prepare(env);
    const good = raw("playerOne", 2), gk = good.positions.indexOf("GK"), outfield = gk === 0 ? 1 : 0;
    const pos = (i, value) => ({ positions: good.positions.map((p, j) => (j === i ? value : p)) });
    const name = (i, value) => ({ names: good.names.map((n, j) => (j === i ? value : n)) });
    const shapes = [
      ["10 positions", { positions: good.positions.slice(0, 10) }],
      ["12 positions", { positions: [...good.positions, "ST"] }],
      ["14 names", { names: good.names.slice(0, 14) }],
      ["16 names", { names: [...good.names, "Extra Man"] }],
      ["no goalkeeper", pos(gk, "ST")],
      ["two goalkeepers", pos(outfield, "GK")],
      ["a starter marked SUB", pos(outfield, "SUB")],
      ["an unknown position", pos(outfield, "XX")],
      ["a position that is not text", pos(outfield, 7)],
      ["a 41-character name", name(3, "x".repeat(41))],
      ["a name with an outer space", name(3, ` ${good.names[3]}`)],
      ["a name ending in a new line", name(3, `${good.names[3]}\n`)],
      ["an empty name", name(3, "")],
      ["a name that is not text", name(3, 9)],
      ["the same player twice", name(11, good.names[12])],
      ["rows instead of the two lists", { rows: [] }],
      ["an extra document key", { extra: true }],
      ["a client clock", { createdAt: Timestamp.fromMillis(Date.now()) }],
      ["another object type", { objectType: "careerSummary" }]
    ];
    for (const [, patch] of shapes) await assertFails(setDoc(boardRef(dbA, "season_2_playerOne"), { ...good, ...patch }));
    ok("R1", `a board that is not 11 positions with one goalkeeper + 15 clean, different names is refused (${shapes.length} shapes)`);
    await assertFails(setDoc(boardRef(dbA, "season_2_playerTwo"), raw("playerTwo", 2, { updatedByDeviceId: DA })));
    await assertFails(setDoc(boardRef(dbA, "season_2_playerTwo"), raw("playerOne", 2)));
    await assertFails(setDoc(boardRef(dbB, "season_2_playerOne"), raw("playerOne", 2, { updatedByDeviceId: DB })));
    await assertFails(setDoc(boardRef(dbA, "season_3_playerOne"), raw("playerOne", 2)));
    await assertFails(setDoc(boardRef(env.authenticatedContext(STRANGER).firestore(), "season_2_playerOne"), raw("playerOne", 2)));
    await assertFails(setDoc(boardRef(env.unauthenticatedContext().firestore(), "season_2_playerOne"), raw("playerOne", 2)));
    ok("R2", "a manager writes only his own board under its own id; the rival, a stranger or a signed-out page cannot");
    for (const season of [1, 4, 11]) await assertFails(setDoc(boardRef(dbA, `season_${season}_playerOne`), raw("playerOne", season)));
    await assertFails(setDoc(boardRef(dbA, "season_2_playerOne"), raw("playerOne", "2")));
    ok("R3", "season 1 (launch board), a season past the Showdown's 3 and a non-number season are refused");
    await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), "accounts", A, "devices", DA), device(DA, "revoked")); });
    await assertFails(setDoc(boardRef(dbA, "season_2_playerOne"), good));
    await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), "accounts", A, "devices", DA), device(DA)); await setDoc(doc(c.firestore(), "rivalries", R, "sessions", S), session(Date.now(), "closed")); });
    await assertFails(setDoc(boardRef(dbA, "season_2_playerOne"), good));
    await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), "rivalries", R, "sessions", S), session(Date.now())); });
    await assertFails(setDoc(boardRef(dbA, "season_2_playerOne"), { ...good, updatedByDeviceId: DB }));
    ok("R4", "a revoked device, a closed Session or the partner's device cannot save a board (shared write authority)");
    await assertSucceeds(setDoc(boardRef(dbA, "season_2_playerOne"), good));
    await assertFails(setDoc(boardRef(dbA, "season_2_playerOne"), good));
    await assertFails(updateDoc(boardRef(dbA, "season_2_playerOne"), name(3, "Changed Mind")));
    await assertFails(deleteDoc(boardRef(dbA, "season_2_playerOne")));
    await assertFails(getDocs(collection(dbA, "rivalries", R, "rosterBoards")));
    await assertSucceeds(setDoc(boardRef(dbB, "season_3_playerTwo"), raw("playerTwo", 3, { names: raw("playerTwo", 3).names.map((n, j) => (j === 0 ? "Ö".repeat(40) : n)) })));
    ok("R5", "the owner saves his board once (a 40-character name is fine); a second save, an edit, a delete and a list are refused");
    await assertSucceeds(getDoc(boardRef(dbA, "season_2_playerOne")));
    await assertSucceeds(getDoc(boardRef(dbB, "season_2_playerOne")));
    await assertSucceeds(getDoc(boardRef(dbB, "season_3_playerOne")));
    await assertFails(getDoc(boardRef(env.authenticatedContext(STRANGER).firestore(), "season_2_playerOne")));
    ok("R6", "both managers read both boards (a board not saved yet reads as missing); a stranger cannot");
    ({ dbA } = await prepare(env, { careerStart: false }));
    await assertFails(setDoc(boardRef(dbA, "season_2_playerOne"), raw("playerOne", 2)));
    ok("R7", "before both managers acknowledged Career Start no board can be saved");

    // ---- E: js/rosterBoardStore.js end to end ----
    ({ dbA, dbB } = await prepare(env));
    const missing = await Store.read({ ...store(dbA, A, DA), season: 2, role: "playerTwo" });
    assert.deepEqual([missing.ok, missing.rows], [true, null]);
    const nikRows = boardRows("playerTwo");
    const saved = await Store.save({ ...store(dbB, B, DB), season: 2, role: "playerTwo", rows: nikRows });
    assert.equal(saved.ok, true, JSON.stringify(saved)); assert.equal(saved.created, true);
    const again = await Store.save({ ...store(dbB, B, DB), season: 2, role: "playerTwo", rows: nikRows.map((r, i) => (i === 3 ? { ...r, name: "Changed Mind" } : r)) });
    assert.equal(again.ok, true); assert.equal(again.created, false); assert.deepEqual(again.rows, nikRows);
    Store.forgetPhoneCopies();
    const retry = await Store.save({ ...store(dbB, B, DB), season: 2, role: "playerTwo", rows: nikRows.map((r, i) => (i === 3 ? { ...r, name: "Changed Mind" } : r)) });
    assert.equal(retry.created, false); assert.deepEqual(retry.rows, nikRows, "the server copy wins over a changed second save");
    ok("E1", "Nik saves his season-2 board once; a second save (same page or a fresh one) keeps the locked board");
    Store.forgetPhoneCopies();
    const fromServer = await Store.read({ ...store(dbA, A, DA), season: 2, role: "playerTwo" });
    assert.equal(fromServer.source, "server"); assert.deepEqual(fromServer.rows, nikRows);
    const fromPhone = await Store.read({ ...store(dbA, A, DA), season: 2, role: "playerTwo" });
    assert.equal(fromPhone.source, "phone"); assert.deepEqual(fromPhone.rows, nikRows);
    const view = RRR.forSeason(R, { playerOne: "Liverpool", playerTwo: "Real Madrid" }, 2, { playerTwo: fromServer.rows });
    const nikTurn = view.turns.find((t) => t.role === "playerTwo");
    if (nikTurn.fired) assert.equal(nikTurn.player.name, nikRows[nikTurn.hitSlot].name);
    ok("E2", "Daniel reads Nik's board once from the server, then from the phone copy; the engine names Nik's hit from it");
    const wrongRole = await Store.save({ ...store(dbA, A, DA), season: 3, role: "playerTwo", rows: nikRows });
    assert.deepEqual([wrongRole.ok, wrongRole.code], [false, "permission-denied"]);
    const bad = await Store.save({ ...store(dbA, A, DA), season: 2, role: "playerOne", rows: nikRows.slice(0, 14) });
    assert.deepEqual([bad.ok, bad.code], [false, "ROSTER_BOARD_INVALID"]);
    const seasonOne = await Store.save({ ...store(dbA, A, DA), season: 1, role: "playerOne", rows: boardRows("playerOne") });
    assert.deepEqual([seasonOne.ok, seasonOne.code], [false, "ROSTER_SEASON_INVALID"]);
    ok("E3", "the store refuses a board that is not 11 + 4, season 1 and (with the Rules) the rival's board");
    console.log(`PASS roster board emulator: ${checks} checks (create-only per-manager boards from season 2; both managers read; Store saves once and keeps a phone copy).`);
  } finally {
    await env.cleanup();
  }
})().catch((error) => { console.error(error); process.exit(1); });
