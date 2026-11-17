"use strict";

// R94-02 PR 1: the club draw "spin and stop" protocol (draw 2), and the golden proof that every Showdown saved
// before it (no `stops` key) still replays to exactly the same league, clubs and hashes.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..");
const Setup = require("../../js/sharedShowdownSetup.js");
const CATALOG = require("../../js/sharedShowdownCatalog.js").catalog;
const GOLDEN = require("../fixtures/club-draw-golden/old-draw-vectors.json");

let checks = 0;
function ok(label) { checks += 1; process.stdout.write(`ok ${checks} ${label}\n`); }

const TYPES = ["open", "commit-league", "commit-clubs", "commit-length", "confirm", "confirm"];
function authority(rivalryId, slots, role, hostRole) {
  const actor = slots.find(slot => slot.slotId === role), host = slots.find(slot => slot.slotId === hostRole);
  return {
    rivalryId, connectionState: "active",
    managerSlots: slots.map(slot => ({slotId: slot.slotId, accountId: slot.accountId, profileId: slot.profileId, saveId: slot.saveId, accountState: "active", entitlementState: "active"})),
    actor: {accountId: actor.accountId, deviceId: "device_" + "0".repeat(32), deviceState: "active", managerRole: role, profileId: actor.profileId, saveId: actor.saveId},
    session: {sessionId: "session_" + "1".repeat(64), rivalryId, state: "active", hostAccountId: host.accountId, memberAccountIds: slots.map(slot => slot.accountId), expiresAtEpochMs: Number.MAX_SAFE_INTEGER},
    nowEpochMs: 0
  };
}
// Replays a stored ledger through the ONE shared command builder, exactly as the four readers do.
async function replay(protocol, ledger, rivalryId, slots) {
  let state = null;
  for (let index = 0; index < ledger.revision; index += 1) {
    const command = await protocol.ledgerCommand({state, ledger, index});
    const applied = await protocol.apply({state, authority: authority(rivalryId, slots, ledger.actorRoles[index], ledger.coordinatorRole), command});
    if (!applied.ok) throw Object.assign(new Error(applied.code), {code: applied.code});
    state = applied.state;
  }
  return state;
}
let seed = 0x94020001;
function rnd() { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed; }
function hex(n) { let s = ""; while (s.length < n) s += rnd().toString(16).padStart(8, "0"); return s.slice(0, n); }
function freshRivalry() {
  return {
    rivalryId: "pair_" + hex(64),
    slots: [
      {slotId: "playerOne", accountId: "acct" + hex(20), profileId: "profile_" + hex(24), saveId: "save_" + hex(24)},
      {slotId: "playerTwo", accountId: "acct" + hex(20), profileId: "profile_" + hex(24), saveId: "save_" + hex(24)}
    ]
  };
}
// Plays a whole draw 2 setup live (as the adapter would) and returns the live states plus the stored ledger.
async function playDraw2(protocol, {rivalryId, slots}, {coordinatorRole = "playerOne", order = ["playerOne", "playerTwo"], stops = [10, 250], totalSeasons = 3} = {}) {
  const roles = [coordinatorRole, coordinatorRole, coordinatorRole, coordinatorRole, ...order];
  const operationIds = Array.from({length: 6}, () => "setup_op_" + hex(32));
  let state = null; const states = [];
  for (let index = 0; index < 6; index += 1) {
    const type = TYPES[index], operationId = operationIds[index];
    let command;
    if (type === "open") command = {type, operationId, baseRevision: 0, draw: 2};
    else if (type === "commit-league" || type === "commit-clubs") command = await protocol.prepareDraw({state, type, operationId});
    else if (type === "commit-length") command = {type, operationId, baseRevision: index, totalSeasons};
    else command = {type, operationId, baseRevision: index, setupHash: await protocol.confirmationHash(state), stop: stops[index - 4]};
    const applied = await protocol.apply({state, authority: authority(rivalryId, slots, roles[index], coordinatorRole), command});
    assert.equal(applied.ok, true, JSON.stringify(applied));
    state = applied.state; states.push(state);
  }
  const ledger = {
    schemaVersion: 1, objectType: "sharedSetupLedger", rivalryId, revision: 6, phase: "SHOWDOWN_CONFIRMED", coordinatorRole,
    operationIds, operationTypes: [...TYPES], baseRevisions: [0, 1, 2, 3, 4, 5], actorRoles: roles, totalSeasons,
    confirmedRoles: [...order], activeSessionId: "session_" + "1".repeat(64), updatedAt: null, updatedByDeviceId: "device_" + "0".repeat(32),
    stops: [...stops]
  };
  return {state, states, ledger, roles, operationIds};
}

// Firestore REST typed values (saved-showdown fixtures) -> plain values.
function decodeValue(value) {
  const kind = Object.keys(value)[0];
  switch (kind) {
    case "nullValue": return null;
    case "booleanValue": return value.booleanValue;
    case "stringValue": return value.stringValue;
    case "integerValue": return Number(value.integerValue);
    case "doubleValue": return value.doubleValue;
    case "timestampValue": return value.timestampValue;
    case "arrayValue": return (value.arrayValue.values || []).map(decodeValue);
    case "mapValue": return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decodeValue(item)]));
    default: throw new Error(`fixture value type ${kind}`);
  }
}

(async () => {
  const protocol = await Setup.createProtocol({catalog: CATALOG, cryptoImpl: crypto.webcrypto});

  // ---- 1. Golden: Showdowns saved before R94-02 replay byte for byte -------------------------------------------------
  assert.equal(GOLDEN.catalogHash, protocol.catalogHash, "the catalog the golden vectors were frozen on must still be the catalog");
  assert.equal(GOLDEN.vectors.length, 120);
  for (const vector of GOLDEN.vectors) {
    const ledger = {
      schemaVersion: 1, objectType: "sharedSetupLedger", rivalryId: vector.rivalryId, revision: 6, phase: "SHOWDOWN_CONFIRMED",
      coordinatorRole: vector.coordinatorRole, operationIds: vector.operationIds, operationTypes: [...TYPES], baseRevisions: [0, 1, 2, 3, 4, 5],
      actorRoles: vector.actorRoles, totalSeasons: vector.totalSeasons, confirmedRoles: vector.actorRoles.slice(4),
      activeSessionId: "session_" + "1".repeat(64), updatedAt: null, updatedByDeviceId: "device_" + "0".repeat(32)
    };
    assert.deepEqual(Setup.ledgerKeys(ledger).length, 15);
    const state = await replay(protocol, ledger, vector.rivalryId, vector.managerSlots);
    assert.equal(state.leagueId, vector.leagueId, vector.rivalryId);
    assert.deepEqual(state.clubs, vector.clubs, vector.rivalryId);
    assert.equal(state.contentHash, vector.contentHash, `${vector.rivalryId}: the replayed protocol state must hash exactly as before R94-02`);
    assert.equal(await protocol.confirmationHash(state), vector.confirmationHash, vector.rivalryId);
    assert.equal(Object.hasOwn(state, "stops") || Object.hasOwn(state, "candidates"), false, "an old Showdown never grows draw 2 keys");
  }
  ok("120 golden pre-R94-02 setups replay to the same league, clubs, state hash and confirmation hash");

  // Real saved games (emulator exports of earlier releases): hand-written league and clubs (README of the fixtures).
  const SAVED = {
    "saved-showdowns/r75-1season-win.json": ["bundesliga", "Borussia Mönchengladbach", "Hoffenheim"],
    "saved-showdowns/r75-1season-draw.json": ["laliga", "Leganés", "Málaga"],
    "saved-showdowns/r76-1season-win.json": ["bundesliga", "Eintracht Frankfurt", "RB Leipzig"],
    "saved-showdowns/r76-1season-draw.json": ["premier_league", "West Ham United", "Watford"],
    "saved-showdowns/r79-1season-win.json": ["ligue_1", "Paris Saint-Germain", "Metz"],
    "saved-showdowns-in-progress/r79-3season-inprogress.json": null
  };
  for (const [file, expected] of Object.entries(SAVED)) {
    const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/fixtures", file), "utf8"));
    const find = suffix => decodeValue({mapValue: {fields: fixture.documents.find(item => item.path === `rivalries/${fixture.rivalryId}${suffix}`).fields}});
    const rivalry = find(""), ledger = find("/sharedSetup/authoritative");
    assert.equal(Object.hasOwn(ledger, "stops"), false);
    assert.deepEqual(Object.keys(ledger).sort(), [...Setup.ledgerKeys(ledger)].sort(), `${file}: the saved ledger has exactly the 15 pre-R94-02 keys`);
    const slots = ["playerOne", "playerTwo"].map(role => rivalry.data.managerSlots.find(slot => slot.slotId === role));
    const state = await replay(protocol, ledger, fixture.rivalryId, slots);
    const daniel = ledger.coordinatorRole, nik = daniel === "playerOne" ? "playerTwo" : "playerOne";
    if (expected) {
      assert.equal(state.leagueId, expected[0], file);
      assert.equal(state.clubs[daniel], expected[1], `${file}: Daniel's club`);
      assert.equal(state.clubs[nik], expected[2], `${file}: Nik's club`);
    } else {
      assert.equal(state.phase, "SHOWDOWN_CONFIRMED");
      assert.ok(CATALOG[state.leagueId].includes(state.clubs.playerOne) && CATALOG[state.leagueId].includes(state.clubs.playerTwo));
    }
  }
  ok("six saved games of r75/r76/r79 replay to their recorded league and clubs through the shared command builder");

  // ---- 2. Draw 2: six distinct candidates from the drawn league, the same on both phones ------------------------------
  const seen = {};
  for (let run = 0; run < 400; run += 1) {
    const rivalry = freshRivalry();
    const {states} = await playDraw2(protocol, rivalry, {stops: [rnd() % 360, rnd() % 360], order: run % 2 ? ["playerTwo", "playerOne"] : ["playerOne", "playerTwo"], coordinatorRole: run % 3 ? "playerOne" : "playerTwo"});
    const [opened, league, clubs] = states;
    assert.equal(opened.candidates, null); assert.deepEqual(opened.stops, []); assert.equal(opened.clubs, null);
    assert.equal(league.candidates, null); assert.equal(league.clubs, null);
    const all = [...clubs.candidates.playerOne, ...clubs.candidates.playerTwo];
    assert.equal(clubs.candidates.playerOne.length, 3); assert.equal(clubs.candidates.playerTwo.length, 3);
    assert.equal(new Set(all).size, 6, "six distinct candidates");
    assert.ok(all.every(club => CATALOG[clubs.leagueId].includes(club)), "all from the drawn league");
    assert.equal(clubs.clubs, null, "no club is fixed before both managers stop");
    // The same commit-clubs command is derived again (other phone, later replay).
    const again = await protocol.prepareDraw({state: league, type: "commit-clubs", operationId: "setup_op_" + "e".repeat(32)});
    assert.deepEqual(again.candidates, clubs.candidates);
    // The old purposes are untouched: draw 2 candidates never come from the club-player-one/two hashes.
    for (const club of all) seen[`${clubs.leagueId}|${club}`] = (seen[`${clubs.leagueId}|${club}`] || 0) + 1;
  }
  const perLeague = {};
  for (const [key, count] of Object.entries(seen)) { const league = key.split("|")[0]; (perLeague[league] = perLeague[league] || []).push(count); }
  for (const [league, counts] of Object.entries(perLeague)) {
    assert.equal(counts.length, CATALOG[league].length, `${league}: every club can be a candidate`);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    assert.ok(Math.max(...counts) < mean * 2.2 && Math.min(...counts) > mean * 0.25, `${league}: candidates spread over the whole league (${counts.join(",")})`);
  }
  ok("400 draw 2 setups: 3 + 3 distinct candidates from the drawn league, same on re-derivation, every club reachable");

  // ---- 3. The stop decides the club; both phones agree from the stored integers ---------------------------------------
  assert.equal(Setup.clubForStop(["A", "B", "C"], 0), "A"); assert.equal(Setup.clubForStop(["A", "B", "C"], 119), "A");
  assert.equal(Setup.clubForStop(["A", "B", "C"], 120), "B"); assert.equal(Setup.clubForStop(["A", "B", "C"], 239), "B");
  assert.equal(Setup.clubForStop(["A", "B", "C"], 240), "C"); assert.equal(Setup.clubForStop(["A", "B", "C"], 359), "C");
  for (const bad of [360, -1, 1.5, "5", null]) assert.throws(() => Setup.clubForStop(["A", "B", "C"], bad));
  for (const [stops, order] of [[[0, 359], ["playerOne", "playerTwo"]], [[119, 120], ["playerTwo", "playerOne"]], [[240, 239], ["playerOne", "playerTwo"]]]) {
    const rivalry = freshRivalry();
    const live = await playDraw2(protocol, rivalry, {stops, order});
    const [first, second] = order;
    assert.deepEqual(live.states[4].stops, [stops[0]]); assert.equal(live.states[4].clubs, null, "one stop does not fix the pair yet");
    assert.equal(live.state.clubs[first], live.state.candidates[first][Math.floor(stops[0] / 120)]);
    assert.equal(live.state.clubs[second], live.state.candidates[second][Math.floor(stops[1] / 120)]);
    assert.notEqual(live.state.clubs.playerOne, live.state.clubs.playerTwo);
    const replayed = await replay(protocol, live.ledger, rivalry.rivalryId, rivalry.slots);
    assert.deepEqual(replayed, live.state, "a stored draw 2 ledger replays to the exact live state");
    assert.deepEqual(Setup.ledgerKeys(live.ledger).length, 16);
    assert.equal(Setup.ledgerStopsValid(live.ledger), true);
  }
  ok("the stop picks candidates[role][floor(stop/120)], sections 0-119/120-239/240-359; replay equals the live state");

  // ---- 4. Refusals: shapes that must never be accepted ------------------------------------------------------------
  {
    const rivalry = freshRivalry();
    const live = await playDraw2(protocol, rivalry, {stops: [10, 250]});
    const lengthState = live.states[3], firstStop = live.states[4];
    const auth = role => authority(rivalry.rivalryId, rivalry.slots, role, "playerOne");
    const confirm = async (state, role, extra) => protocol.apply({state, authority: auth(role), command: {type: "confirm", operationId: "setup_op_" + hex(32), baseRevision: state.revision, setupHash: await protocol.confirmationHash(state), ...extra}});
    for (const stop of [360, -1, 1.5, "12", null]) assert.equal((await confirm(lengthState, "playerOne", {stop})).code, "SETUP_STOP_INVALID", `stop ${stop}`);
    assert.equal((await confirm(lengthState, "playerOne", {})).code, "SETUP_DRAW_VERSION_MISMATCH", "a draw 2 confirm must carry the stop");
    assert.equal((await confirm(firstStop, "playerOne", {stop: 5})).code, "SETUP_CONFIRMATION_NOT_AVAILABLE", "the same manager cannot stop twice");
    const second = await confirm(firstStop, "playerTwo", {stop: 5});
    assert.equal(second.ok, true); assert.deepEqual(second.state.stops, [10, 5], "the first stop is kept, the second appended");
    assert.equal((await confirm(second.state, "playerOne", {stop: 5})).code, "SETUP_ALREADY_CONFIRMED", "nothing after both stops");
    // Old commit-clubs shape on a draw 2 setup, and draw 2 shapes on an old setup.
    const leagueState = live.states[1];
    const oldClubs = {type: "commit-clubs", operationId: "setup_op_" + hex(32), baseRevision: 2, clubs: {playerOne: CATALOG[leagueState.leagueId][0], playerTwo: CATALOG[leagueState.leagueId][1]}};
    assert.equal((await protocol.apply({state: leagueState, authority: auth("playerOne"), command: oldClubs})).code, "SETUP_DRAW_VERSION_MISMATCH");
    const forged = await protocol.prepareDraw({state: leagueState, type: "commit-clubs", operationId: "setup_op_" + hex(32)});
    const swapped = {...forged, candidates: {playerOne: forged.candidates.playerTwo, playerTwo: forged.candidates.playerOne}};
    assert.equal((await protocol.apply({state: leagueState, authority: auth("playerOne"), command: swapped})).code, "SETUP_DRAW_MISMATCH", "candidates are the hash draw, not a client choice");
    const vector = GOLDEN.vectors[0];
    let oldState = null;
    for (let index = 0; index < 4; index += 1) {
      const ledger = {operationTypes: TYPES, operationIds: vector.operationIds, baseRevisions: [0, 1, 2, 3, 4, 5], totalSeasons: vector.totalSeasons};
      const applied = await protocol.apply({state: oldState, authority: authority(vector.rivalryId, vector.managerSlots, vector.coordinatorRole, vector.coordinatorRole), command: await protocol.ledgerCommand({state: oldState, ledger, index})});
      oldState = applied.state;
    }
    const oldConfirm = await protocol.apply({state: oldState, authority: authority(vector.rivalryId, vector.managerSlots, "playerOne", vector.coordinatorRole), command: {type: "confirm", operationId: "setup_op_" + hex(32), baseRevision: 4, setupHash: await protocol.confirmationHash(oldState), stop: 30}});
    assert.equal(oldConfirm.code, "SETUP_DRAW_VERSION_MISMATCH", "an old setup never takes a stop");
    const oldCandidates = await protocol.apply({state: null, authority: auth("playerOne"), command: {type: "open", operationId: "setup_op_" + hex(32), baseRevision: 0, draw: 4}});
    assert.equal(oldCandidates.ok, false, "only draws 2 and 3 exist (R95-01 added draw 3, contract r95-ball-game-protocol)");
    // verifyState refuses a tampered draw 2 state (clubs not matching the stops).
    const tampered = JSON.parse(JSON.stringify(live.state)); tampered.stops = [130, 250];
    await assert.rejects(protocol.verifyState(tampered));
    const noKey = JSON.parse(JSON.stringify(live.state)); delete noKey.candidates;
    await assert.rejects(protocol.verifyState(noKey));
    // Stored ledger checks.
    assert.equal(Setup.ledgerStopsValid({...live.ledger, stops: [10]}), false, "one stop per confirmed manager");
    assert.equal(Setup.ledgerStopsValid({...live.ledger, stops: [10, 360]}), false);
    assert.equal(Setup.ledgerStopsValid({...live.ledger, stops: "10,250"}), false);
    assert.equal(Setup.ledgerStopsValid({...live.ledger, confirmedRoles: [], stops: []}), true);
    await assert.rejects(replay(protocol, {...live.ledger, stops: [10, 360]}, rivalry.rivalryId, rivalry.slots));
  }
  ok("refused: stop out of range or missing, second stop, stop after both, old shapes on draw 2, draw 2 shapes on old setups, swapped candidates, tampered state");

  // ---- 5. The four readers and the setup adapter all use the one command builder ------------------------------------
  const readers = {
    "js/sparkSharedShowdownSetup.js": ["ledgerKeyList(value)", "ledgerStopsValid"],
    "js/sparkCompletedShowdownReader.js": ["setup.ledgerKeys(value)", "setup.ledgerStopsValid(value)"],
    "js/sparkSharedSeasonCommit.js": ["setup.ledgerKeys(value)", "setup.ledgerStopsValid(value)"],
    "js/sparkSharedSeasonResults.js": ["setupModule.ledgerKeys(value)", "setupModule.ledgerStopsValid(value)"]
  };
  for (const [file, needles] of Object.entries(readers)) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    assert.equal((source.match(/\.ledgerCommand\(\{state,ledger,index\}\)/g) || []).length, 1, `${file} replays through ledgerCommand exactly once`);
    assert.equal(/setupHash:await (setupProtocol|protocol)\.confirmationHash\(state\)/.test(source), false, `${file} has no private copy of the replay loop`);
    for (const needle of needles) assert.ok(source.includes(needle), `${file} checks the stored ledger with ${needle}`);
  }
  ok("the setup adapter, Season Results, Season Commit and History all replay through protocol.ledgerCommand");

  process.stdout.write(`PASS R94-02 club draw protocol: ${checks} checks (golden old draw, draw 2 candidates and stops, refusals, one shared replay builder).\n`);
})().catch(error => { console.error(error); process.exit(1); });
