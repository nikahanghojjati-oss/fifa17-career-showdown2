"use strict";

// R95-01 PR 1 (Ball Game, draw 3): six clubs per ball. Old Showdowns (draw 1, draw 2) replay byte for byte from frozen
// golden vectors; draw 3 deals twelve distinct clubs, the stop picks a 60 degree slice, the ledger carries one more
// key (`draw`, always 3), and every reader keeps using the one shared replay builder.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..");
const Setup = require("../../js/sharedShowdownSetup.js");
const CATALOG = require("../../js/sharedShowdownCatalog.js").catalog;
const DRAW2 = require("../fixtures/club-draw-golden/draw2-vectors.json");
const DRAW3 = require("../fixtures/club-draw-golden/draw3-vectors.json");

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
function storedLedger(vector, draw) {
  const ledger = {
    schemaVersion: 1, objectType: "sharedSetupLedger", rivalryId: vector.rivalryId, revision: 6, phase: "SHOWDOWN_CONFIRMED",
    coordinatorRole: vector.coordinatorRole, operationIds: vector.operationIds, operationTypes: [...TYPES], baseRevisions: [0, 1, 2, 3, 4, 5],
    actorRoles: vector.actorRoles, totalSeasons: vector.totalSeasons, confirmedRoles: vector.actorRoles.slice(4),
    activeSessionId: "session_" + "1".repeat(64), updatedAt: null, updatedByDeviceId: "device_" + "0".repeat(32), stops: [...vector.stops]
  };
  if (draw === 3) ledger.draw = 3;
  return ledger;
}
let seed = 0x95010001;
function rnd() { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed; }
function hex(n) { let s = ""; while (s.length < n) s += rnd().toString(16).padStart(8, "0"); return s.slice(0, n); }
function freshRivalry() {
  return {rivalryId: "pair_" + hex(64), slots: [
    {slotId: "playerOne", accountId: "acct" + hex(20), profileId: "profile_" + hex(24), saveId: "save_" + hex(24)},
    {slotId: "playerTwo", accountId: "acct" + hex(20), profileId: "profile_" + hex(24), saveId: "save_" + hex(24)}]};
}
async function play(protocol, {rivalryId, slots}, draw, stops = [10, 250]) {
  const roles = ["playerOne", "playerOne", "playerOne", "playerOne", "playerOne", "playerTwo"];
  const operationIds = Array.from({length: 6}, () => "setup_op_" + hex(32));
  let state = null;
  for (let index = 0; index < 6; index += 1) {
    const type = TYPES[index], operationId = operationIds[index];
    let command;
    if (type === "open") command = {type, operationId, baseRevision: 0, draw};
    else if (type === "commit-league" || type === "commit-clubs") command = await protocol.prepareDraw({state, type, operationId});
    else if (type === "commit-length") command = {type, operationId, baseRevision: index, totalSeasons: 3};
    else command = {type, operationId, baseRevision: index, setupHash: await protocol.confirmationHash(state), stop: stops[index - 4]};
    const applied = await protocol.apply({state, authority: authority(rivalryId, slots, roles[index], "playerOne"), command});
    assert.equal(applied.ok, true, JSON.stringify(applied));
    state = applied.state;
  }
  const ledger = storedLedger({rivalryId, coordinatorRole: "playerOne", operationIds, actorRoles: roles, totalSeasons: 3, stops}, draw);
  return {state, ledger};
}

(async () => {
  const protocol = await Setup.createProtocol({catalog: CATALOG, cryptoImpl: crypto.webcrypto});

  // ---- 1. Draw 2 Showdowns (2.7.0) replay byte for byte ---------------------------------------------------------------
  assert.equal(DRAW2.catalogHash, protocol.catalogHash); assert.equal(DRAW2.draw, 2); assert.equal(DRAW2.vectors.length, 120);
  for (const vector of DRAW2.vectors) {
    const ledger = storedLedger(vector, 2);
    assert.equal(Setup.ledgerKeys(ledger).length, 16); assert.equal(Setup.ledgerStopsValid(ledger), true);
    const state = await replay(protocol, ledger, vector.rivalryId, vector.managerSlots);
    assert.equal(state.leagueId, vector.leagueId); assert.deepEqual(state.candidates, vector.candidates); assert.deepEqual(state.clubs, vector.clubs);
    assert.equal(Object.hasOwn(state, "draw"), false, "a draw 2 state never gains the draw key");
    assert.equal(state.contentHash, vector.contentHash, `${vector.rivalryId}: a draw 2 state must hash exactly as in 2.7.0`);
    const before = await replay(protocol, {...ledger, revision: 4, phase: "SEASON_LENGTH_COMMITTED", operationIds: ledger.operationIds.slice(0, 4), operationTypes: TYPES.slice(0, 4), baseRevisions: [0, 1, 2, 3], actorRoles: ledger.actorRoles.slice(0, 4), confirmedRoles: [], stops: []}, vector.rivalryId, vector.managerSlots);
    assert.equal(await protocol.confirmationHash(before), vector.confirmationHash, "the draw 2 confirmation hash is unchanged");
  }
  ok("120 draw 2 Showdowns frozen from the 2.7.0 protocol replay to the same league, candidates, clubs, confirmation hash and contentHash");

  // ---- 2. Draw 3 golden ------------------------------------------------------------------------------------------------
  assert.equal(DRAW3.catalogHash, protocol.catalogHash); assert.equal(DRAW3.draw, 3); assert.equal(DRAW3.vectors.length, 120);
  for (const vector of DRAW3.vectors) {
    const ledger = storedLedger(vector, 3);
    assert.equal(Setup.ledgerKeys(ledger).length, 17); assert.ok(Setup.ledgerKeys(ledger).includes("draw"));
    const state = await replay(protocol, ledger, vector.rivalryId, vector.managerSlots);
    assert.equal(state.draw, 3); assert.deepEqual(state.candidates, vector.candidates); assert.deepEqual(state.clubs, vector.clubs);
    assert.equal(state.contentHash, vector.contentHash);
    for (const [index, role] of ledger.confirmedRoles.entries()) assert.equal(state.clubs[role], state.candidates[role][Math.floor(vector.stops[index] / 60)]);
  }
  ok("120 frozen draw 3 Showdowns replay to the same candidates, clubs and contentHash; each club is candidates[floor(stop/60)]");

  // ---- 3. Live draw 3: twelve distinct clubs, stable, every club reachable -----------------------------------------------
  const seen = {}; let draws = 0;
  for (let n = 0; n < 400; n += 1) {
    const rivalry = freshRivalry();
    const {state} = await play(protocol, rivalry, 3, [rnd() % 360, rnd() % 360]);
    const all = [...state.candidates.playerOne, ...state.candidates.playerTwo];
    assert.equal(state.candidates.playerOne.length, 6); assert.equal(new Set(all).size, 12);
    assert.ok(all.every(club => CATALOG[state.leagueId].includes(club)));
    assert.notEqual(state.clubs.playerOne, state.clubs.playerTwo, "the two managers never land on the same club");
    (seen[state.leagueId] ||= new Set()); all.forEach(club => seen[state.leagueId].add(club)); draws += 1;
    if (n < 20) {
      const two = await play(protocol, rivalry, 2);
      if (two.state.leagueId === state.leagueId) for (const role of ["playerOne", "playerTwo"]) assert.deepEqual(state.candidates[role].slice(0, 3), two.state.candidates[role], "draw 3 continues the draw 2 purposes");
    }
  }
  for (const [league, clubs] of Object.entries(seen)) assert.equal(clubs.size, CATALOG[league].length, `every ${league} club can be dealt`);
  assert.ok(Object.keys(seen).length === 5 && draws === 400);
  assert.ok(Math.min(...Object.values(CATALOG).map(clubs => clubs.length)) >= 12, "the smallest league (Bundesliga, 18) always holds twelve distinct clubs");
  ok("400 live draw 3 setups: 6 + 6 distinct clubs from the drawn league, every club of every league reachable");

  // ---- 3b. Hard rule (Nik 2026-11-17): the two balls never collide, every league, every seed -----------------------------
  // The protocol deals both managers from ONE pool without replacement (Setup.dealCandidates, the function boundDraw uses).
  // Every league x 10,000 seeds, with picks made the way boundIndex makes them (SHA-256, rejection sampled), for draw 3
  // and draw 2; then hostile picks (always first, always last, out of range) that still cannot produce a repeat.
  const pickFor = (league, seedNo) => (index, length) => {
    const bound = Math.floor(0x100000000 / length) * length;
    for (let counter = 0; ; counter += 1) {
      const value = crypto.createHash("sha256").update(`${league}|${seedNo}|candidate-${index}|${counter}`).digest().readUInt32BE(0);
      if (value < bound) return value % length;
    }
  };
  let deals = 0, collisions = 0;
  for (const [league, pool] of Object.entries(CATALOG)) {
    const reach = new Set();
    for (let seedNo = 0; seedNo < 10000; seedNo += 1) {
      for (const count of [Setup.draw3Candidates, Setup.drawCandidates]) {
        const deal = await Setup.dealCandidates(pool, count, pickFor(league, seedNo));
        const all = [...deal.playerOne, ...deal.playerTwo];
        if (deal.playerOne.length !== count || deal.playerTwo.length !== count || new Set(all).size !== 2 * count || !all.every(club => pool.includes(club))) collisions += 1;
        if (count === Setup.draw3Candidates) { all.forEach(club => reach.add(club)); if (deal.playerOne.some(club => deal.playerTwo.includes(club))) collisions += 1; }
        deals += 1;
      }
    }
    assert.equal(reach.size, pool.length, `every ${league} club is dealt somewhere in 10,000 seeds`);
  }
  assert.equal(collisions, 0, "zero collisions"); assert.equal(deals, Object.keys(CATALOG).length * 20000);
  const bundesliga = CATALOG.bundesliga; assert.equal(bundesliga.length, 18);
  for (const hostile of [() => 0, (index, length) => length - 1, (index, length) => index % length]) {
    const deal = await Setup.dealCandidates(bundesliga, 6, hostile);
    assert.equal(new Set([...deal.playerOne, ...deal.playerTwo]).size, 12, "even a constant pick deals twelve different clubs");
  }
  for (const bad of [() => 18, () => -1, () => 1.5, () => NaN]) await assert.rejects(Setup.dealCandidates(bundesliga, 6, bad), error => error.code === "SETUP_DRAW_NOT_AVAILABLE", "a pick outside the pool fails, never reuses a club");
  await assert.rejects(Setup.dealCandidates(bundesliga.slice(0, 11), 6, () => 0), error => error.code === "SETUP_DRAW_NOT_AVAILABLE", "a pool under twelve is refused");
  ok(`no collisions: ${Object.keys(CATALOG).length} leagues x 10,000 seeds x draws 3 and 2 (${deals} deals) = 12 (or 6) distinct clubs of the league every time, each ball disjoint; hostile picks cannot repeat a club`);

  // ---- 4. Slices -------------------------------------------------------------------------------------------------------
  const six = ["a", "b", "c", "d", "e", "f"];
  for (const [stop, club] of [[0, "a"], [59, "a"], [60, "b"], [119, "b"], [120, "c"], [179, "c"], [180, "d"], [239, "d"], [240, "e"], [299, "e"], [300, "f"], [359, "f"]]) assert.equal(Setup.clubForStop(six, stop), club, `stop ${stop}`);
  for (const [stop, club] of [[0, "a"], [119, "a"], [120, "b"], [239, "b"], [240, "c"], [359, "c"]]) assert.equal(Setup.clubForStop(["a", "b", "c"], stop), club, `draw 2 stop ${stop}`);
  for (const bad of [[...six, "g"], ["a", "b"], []]) assert.throws(() => Setup.clubForStop(bad, 10));
  assert.equal(Setup.draw3Candidates, 6); assert.equal(Setup.draw3SectionDegrees, 60);
  ok("draw 3 slices are 0-59 ... 300-359; draw 2 keeps 0-119/120-239/240-359; other candidate counts are refused");

  // ---- 5. Refusals -----------------------------------------------------------------------------------------------------
  const rivalry = freshRivalry(), A = role => authority(rivalry.rivalryId, rivalry.slots, role, "playerOne");
  const opened = await protocol.apply({state: null, authority: A("playerOne"), command: {type: "open", operationId: "setup_op_" + hex(32), baseRevision: 0, draw: 3}});
  assert.equal(opened.ok, true); assert.equal(opened.state.draw, 3);
  for (const draw of [4, 1, 0, "3", 3.5]) assert.equal((await protocol.apply({state: null, authority: A("playerOne"), command: {type: "open", operationId: "setup_op_" + hex(32), baseRevision: 0, draw}})).ok, false, `open draw ${draw}`);
  const league = await protocol.apply({state: opened.state, authority: A("playerOne"), command: await protocol.prepareDraw({state: opened.state, type: "commit-league", operationId: "setup_op_" + hex(32)})});
  const dealt = await protocol.prepareDraw({state: league.state, type: "commit-clubs", operationId: "setup_op_" + hex(32)});
  const three = {...dealt, candidates: {playerOne: dealt.candidates.playerOne.slice(0, 3), playerTwo: dealt.candidates.playerTwo.slice(0, 3)}};
  assert.equal((await protocol.apply({state: league.state, authority: A("playerOne"), command: three})).code, "SETUP_CLUBS_INVALID", "a draw 3 setup never takes three per ball");
  const turned = {...dealt, candidates: {playerOne: [...dealt.candidates.playerOne.slice(1), dealt.candidates.playerOne[0]], playerTwo: dealt.candidates.playerTwo}};
  assert.equal((await protocol.apply({state: league.state, authority: A("playerOne"), command: turned})).code, "SETUP_DRAW_MISMATCH", "the slices are the hash draw, not a client order");
  const shared = {...dealt, candidates: {playerOne: dealt.candidates.playerOne, playerTwo: [dealt.candidates.playerOne[2], ...dealt.candidates.playerTwo.slice(1)]}};
  assert.equal((await protocol.apply({state: league.state, authority: A("playerOne"), command: shared})).code, "SETUP_CLUBS_INVALID", "a deal where both balls carry one club is refused");
  const colliding = JSON.parse(JSON.stringify((await play(protocol, freshRivalry(), 3)).state)); colliding.candidates.playerTwo[4] = colliding.candidates.playerOne[0];
  await assert.rejects(protocol.verifyState(colliding), "a stored state whose balls share a club is not a state");
  const twoRivalry = freshRivalry(), two = await play(protocol, twoRivalry, 2);
  const twoLeague = await replay(protocol, {...two.ledger, revision: 2, phase: "LEAGUE_WHEEL_COMMITTED", operationIds: two.ledger.operationIds.slice(0, 2), operationTypes: TYPES.slice(0, 2), baseRevisions: [0, 1], actorRoles: two.ledger.actorRoles.slice(0, 2), confirmedRoles: [], totalSeasons: null, stops: []}, two.ledger.rivalryId, twoRivalry.slots);
  const sixOnTwo = await protocol.prepareDraw({state: {...twoLeague}, type: "commit-clubs", operationId: "setup_op_" + hex(32)});
  assert.equal(sixOnTwo.candidates.playerOne.length, 3, "a draw 2 setup deals three per ball");
  const forcedSix = {...sixOnTwo, candidates: {playerOne: [...sixOnTwo.candidates.playerOne, ...dealt.candidates.playerOne.slice(0, 3)], playerTwo: [...sixOnTwo.candidates.playerTwo, ...dealt.candidates.playerTwo.slice(0, 3)]}};
  assert.equal((await protocol.apply({state: twoLeague, authority: authority(twoRivalry.rivalryId, twoRivalry.slots, "playerOne", "playerOne"), command: forcedSix})).ok, false, "a draw 2 setup never takes six per ball");
  const liveRivalry = freshRivalry(), live = await play(protocol, liveRivalry, 3);
  await assert.rejects(protocol.verifyState({...JSON.parse(JSON.stringify(live.state)), draw: 2}), "a state with draw 2 is not a state");
  const tampered = JSON.parse(JSON.stringify(live.state)); tampered.stops = [70, 250]; await assert.rejects(protocol.verifyState(tampered));
  ok("refused: open draw 4/1/0/'3'/3.5, three per ball on draw 3, a reordered deal, a deal or stored state where both balls share a club, six per ball on draw 2, a draw 2 marker in a draw 3 state, tampered stops");

  // ---- 6. Stored ledger checks (readers) and mixed versions ---------------------------------------------------------------
  assert.equal(Setup.ledgerStopsValid(live.ledger), true);
  assert.equal(Setup.ledgerStopsValid({...live.ledger, draw: 2}), false);
  assert.equal(Setup.ledgerStopsValid({...live.ledger, draw: "3"}), false);
  const {stops, ...noStops} = live.ledger; assert.equal(Setup.ledgerStopsValid(noStops), false, "draw without stops");
  assert.deepEqual((await replay(protocol, live.ledger, live.ledger.rivalryId, liveRivalry.slots)).clubs, live.state.clubs, "the stored draw 3 ledger replays to the live clubs");
  await assert.rejects(replay(protocol, {...live.ledger, draw: 2}, live.ledger.rivalryId, liveRivalry.slots));
  const {draw, ...asDraw2} = live.ledger;
  const misread = await replay(protocol, asDraw2, asDraw2.rivalryId, liveRivalry.slots).catch(error => error);
  assert.ok(!(misread instanceof Error) && misread.candidates.playerOne.length === 3 && misread.contentHash !== live.state.contentHash, "without its key a draw 3 ledger is a different (draw 2) Showdown, so the key is what keeps six clubs");
  // A 2.7.0 phone checks a ledger with stops against the 16 draw 2 keys: the 17-key draw 3 ledger fails that exact check
  // (it says "update the app" instead of mis-reading six clubs as three).
  assert.notDeepEqual([...Setup.ledgerKeys(live.ledger)].sort(), [...Setup.ledgerKeys(asDraw2)].sort());
  assert.equal(Setup.ledgerKeys(asDraw2).includes("draw"), false);
  ok("readers refuse draw != 3 or draw without stops; a 2.7.0 phone's 16-key check refuses a draw 3 ledger instead of mis-reading it");

  // ---- 7. The adapter writes and replays draw 3 through the shared builder ----------------------------------------------------
  const adapter = fs.readFileSync(path.join(ROOT, "js/sparkSharedShowdownSetup.js"), "utf8");
  for (const needle of ['if(draw!==null&&(type!=="open"||(draw!==2&&draw!==3)))ssrpFail("SETUP_COMMAND_INVALID");', 'if(prior?Object.hasOwn(prior,"draw"):draw===3)ledger.draw=3;', '(Object.hasOwn(prior,"stops")?(Object.hasOwn(prior,"draw")?3:2):null)===draw']) assert.ok(adapter.includes(needle), needle);
  const rules = fs.readFileSync(path.join(ROOT, "firestore.shared-setup-production.fragment.rules"), "utf8");
  for (const needle of ["'stops','draw'", "(!('draw' in after) || ('stops' in after && after.draw == 3))", "after.get('draw', 3) == 3 && after.get('draw', 0) == before.get('draw', 0)"]) assert.ok(rules.includes(needle), needle);
  ok("the adapter opens and carries draw 3; the Rules take draw == 3 only at create beside stops and keep it unchanged");

  process.stdout.write(`PASS R95-01 Ball Game protocol: ${checks} checks (draw 2 and 3 golden, twelve distinct, 60 degree slices, refusals, readers).\n`);
})().catch(error => { console.error(error); process.exit(1); });
