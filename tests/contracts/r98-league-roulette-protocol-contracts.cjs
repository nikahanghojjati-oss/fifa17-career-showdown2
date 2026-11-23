"use strict";

// R98-01 PR 1 (League Roulette, Nik 2026-11-20 option A): Daniel and Nik each drop their own two balls, taking turns.
// The four balls live in the shared setup ledger as one small counter, `drops`, next to the draw 3 keys:
//   - only a draw 3 ledger opened for the roulette carries it: 0 at open, 1 with commit-league (Daniel's first ball is the
//     league draw itself), then 2, 3, 4 as three small plain updates, each by the manager whose ball it is (the coordinator
//     drops balls 1 and 3, the rival balls 2 and 4); commit-clubs waits for 4 and it stays 4 after;
//   - `drops` never changes WHAT is drawn: the same ledger without it replays to the same league, clubs and hashes, so
//     the surviving league is always the shared draw and every reader of 2.10.0 still reads every older Showdown;
//   - the Rules accept exactly that (pins below; the emulator proof is tests/firebase/r98-league-roulette-rules-emulator.cjs).
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..");
const Setup = require("../../js/sharedShowdownSetup.js");
const CATALOG = require("../../js/sharedShowdownCatalog.js").catalog;
const DRAW3 = require("../fixtures/club-draw-golden/draw3-vectors.json");
const RULES = fs.readFileSync(path.join(ROOT, "firestore.shared-setup-production.fragment.rules"), "utf8");
const PROVIDER = fs.readFileSync(path.join(ROOT, "js/sparkSharedShowdownSetup.js"), "utf8");

let checks = 0;
function ok(label) { checks += 1; process.stdout.write(`ok ${checks} ${label}\n`); }
const TYPES = ["open", "commit-league", "commit-clubs", "commit-length", "confirm", "confirm"];
const PHASES = ["SHARED_SETUP_OPEN", "LEAGUE_WHEEL_COMMITTED", "CLUB_ASSIGNMENTS_COMMITTED", "SEASON_LENGTH_COMMITTED", "SEASON_LENGTH_COMMITTED", "SHOWDOWN_CONFIRMED"];
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
// The stored ledger after `revision` steps of a frozen draw 3 vector, with or without the roulette counter.
function ledgerAt(vector, revision, drops) {
  const ledger = {
    schemaVersion: 1, objectType: "sharedSetupLedger", rivalryId: vector.rivalryId, revision, phase: PHASES[revision - 1],
    coordinatorRole: vector.coordinatorRole, operationIds: vector.operationIds.slice(0, revision), operationTypes: TYPES.slice(0, revision),
    baseRevisions: Array.from({length: revision}, (_, i) => i), actorRoles: vector.actorRoles.slice(0, revision),
    totalSeasons: revision >= 4 ? vector.totalSeasons : null, confirmedRoles: vector.actorRoles.slice(4, revision),
    activeSessionId: "session_" + "1".repeat(64), updatedAt: null, updatedByDeviceId: "device_" + "0".repeat(32),
    stops: revision >= 5 ? vector.stops.slice(0, revision - 4) : [], draw: 3
  };
  if (drops !== undefined) ledger.drops = drops;
  return ledger;
}

(async () => {
  const protocol = await Setup.createProtocol({catalog: CATALOG, cryptoImpl: crypto.webcrypto});
  assert.equal(DRAW3.catalogHash, protocol.catalogHash);

  // ---- 1. The ledger shape -------------------------------------------------------------------------------------------
  const vector = DRAW3.vectors[0];
  const keys = Setup.ledgerKeys(ledgerAt(vector, 6, 4));
  assert.equal(keys.length, 18); assert.equal(keys[keys.length - 1], "drops");
  assert.deepEqual(keys.slice(0, 17), [...Setup.ledgerKeys(ledgerAt(vector, 6))], "the roulette ledger is the draw 3 ledger plus drops");
  assert.equal(Setup.rouletteBalls, 4);
  // valid counter per revision: 0 at open, 1..4 while the league is drawn, 4 from commit-clubs on
  const valid = {1: [0], 2: [1, 2, 3, 4], 3: [4], 4: [4], 5: [4], 6: [4]};
  for (let revision = 1; revision <= 6; revision += 1) {
    for (const drops of [-1, 0, 1, 2, 3, 4, 5, 1.5, "1", null, true]) {
      assert.equal(Setup.ledgerStopsValid(ledgerAt(vector, revision, drops)), valid[revision].includes(drops), `revision ${revision} drops ${JSON.stringify(drops)}`);
    }
    assert.equal(Setup.ledgerStopsValid(ledgerAt(vector, revision)), true, "a draw 3 ledger without the roulette stays valid");
  }
  const noDraw = ledgerAt(vector, 2, 1); delete noDraw.draw;
  assert.equal(Setup.ledgerStopsValid(noDraw), false, "drops only rides on a draw 3 ledger");
  ok("ledger: 18 keys (draw 3 + drops); drops 0 at open, 1-4 while the league is drawn, 4 from commit-clubs; never without draw 3");

  // ---- 2. Turn order: Daniel (the coordinator) drops balls 1 and 3, the rival balls 2 and 4 ----------------------------
  for (const coordinator of ["playerOne", "playerTwo"]) {
    const other = coordinator === "playerOne" ? "playerTwo" : "playerOne";
    assert.deepEqual([1, 2, 3, 4].map(ball => Setup.rouletteDropRole(coordinator, ball)), [coordinator, other, coordinator, other]);
  }
  ok("turn order: coordinator, rival, coordinator, rival (Daniel, Nik, Daniel, Nik)");

  // ---- 3. drops never changes what is drawn: 120 frozen draw 3 Showdowns replay identically with it -------------------
  for (const v of DRAW3.vectors) {
    const plain = await replay(protocol, ledgerAt(v, 6), v.rivalryId, v.managerSlots);
    const roulette = await replay(protocol, ledgerAt(v, 6, 4), v.rivalryId, v.managerSlots);
    assert.equal(roulette.leagueId, v.leagueId); assert.deepEqual(roulette.clubs, v.clubs); assert.equal(roulette.contentHash, v.contentHash);
    assert.deepEqual(roulette, plain);
    for (const drops of [1, 2, 3, 4]) {
      const mid = await replay(protocol, ledgerAt(v, 2, drops), v.rivalryId, v.managerSlots);
      assert.equal(mid.leagueId, v.leagueId, "every ball of the roulette shows the same shared league");
    }
  }
  ok("120 frozen draw 3 Showdowns: with drops they replay to the same league, clubs and contentHash; the league is fixed from ball 1");

  // ---- 4. Rules pins ---------------------------------------------------------------------------------------------------
  assert.match(RULES, /'stops','draw','drops'\n/, "the exact-keys list allows drops");
  assert.match(RULES, /\(!\('drops' in after\) \|\| \('draw' in after && after\.drops == 0\)\)/, "create: drops only 0 and only with draw");
  assert.ok(RULES.includes("&& !after.diff(before).affectedKeys().hasAny(i == 1 ? ['draw'] : ['draw', 'drops'])"), "a step never touches draw, and drops only on commit-league");
  assert.ok(RULES.includes("&& (i > 2 || (i == 1 ? ('drops' in after) == ('drops' in before) && after.get('drops', -1) == before.get('drops', -1) * 2 + 1 : before.get('drops', 4) == 4))"), "commit-league moves drops 0 to 1 and never adds or removes the key; commit-clubs waits for all four balls");
  const dropFn = RULES.slice(RULES.indexOf("function ssjrValidDropLedger("), RULES.indexOf("}", RULES.indexOf("function ssjrValidDropLedger(")));
  for (const pin of ["after.revision == before.revision", "before.phase == 'LEAGUE_WHEEL_COMMITTED'", "before.get('drops', 0) in [1, 2, 3]",
    "after.drops == before.drops + 1", "after.diff(before).affectedKeys().hasOnly(['drops', 'updatedAt', 'updatedByDeviceId', 'activeSessionId'])",
    "(before.drops % 2 == 1) == (ssjrActorRole(rivalryId) != before.coordinatorRole)", "ssjrValidLedgerBase(after, rivalryId)"]) assert.ok(dropFn.includes(pin), pin);
  assert.match(RULES, /allow update: if ssjrValidUpdateLedger\(rivalryId\);/, "the update grant line is unchanged from 2.10.0");
  assert.match(RULES, /return after\.revision == before\.revision \+ 1\n\s*\? ssjrValidLedgerBase\(after, rivalryId\)[\s\S]*?&& ssjrTransitionShapeValid\(before, after\)\n\s*: ssjrValidDropLedger\(rivalryId\);/, "the revision alone picks a step or a ball; neither pays for the other");
  ok("Rules: drops in the exact keys, 0 at create, kept by every step, commit-clubs after 4, one ball at a time by the right manager touching only drops and the stamp, picked by the revision");

  // ---- 5. Provider pins: the plain path writes only the counter and the stamp ------------------------------------------
  const dropSrc = PROVIDER.slice(PROVIDER.indexOf("async function drop("));
  assert.ok(dropSrc.length > 0 && /updateDoc|update\(/.test(dropSrc));
  assert.match(PROVIDER, /drops:\s*ball,\s*updatedAt/, "the ball write carries drops then the stamp");
  assert.match(PROVIDER, /SETUP_ROULETTE_NOT_YOUR_BALL/); assert.match(PROVIDER, /SETUP_ROULETTE_NOT_OPEN/); assert.match(PROVIDER, /SETUP_ROULETTE_UNFINISHED/);
  ok("provider: a ball is one small update (drops + stamp); wrong manager, out of turn and early clubs are refused by name");

  process.stdout.write(`R98-01 League Roulette protocol contracts passed: ${checks} checks.\n`);
})().catch(error => { console.error(error.stack || error); process.exit(1); });
