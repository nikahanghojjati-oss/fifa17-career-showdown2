const assert = require("node:assert/strict");
const fs = require("node:fs");
const {webcrypto} = require("node:crypto");
const moduleApi = require("../../js/sharedShowdownSetup.js");
const fixture = require("../fixtures/shared-showdown-setup.cjs");
const clone = value => JSON.parse(JSON.stringify(value));

(async () => {
  const api = await moduleApi.createProtocol({catalog:fixture.catalog(), cryptoImpl:webcrypto});
  let checks = 0;
  async function apply(state, command, authority = fixture.authority()){
    const inputs = JSON.stringify({state, command, authority});
    const result = await api.apply({state, command, authority});
    assert.equal(JSON.stringify({state, command, authority}), inputs, "Protocol must not mutate caller state, intent or authority.");
    assert.ok(Object.isFrozen(result));
    checks++;
    return result;
  }
  async function deny(state, command, code, authority){
    assert.deepEqual(await apply(state, command, authority), {ok:false, code});
  }
  const open = fixture.command("open", 0, 1);
  const opened = await apply(null, open);
  assert.equal(opened.state.phase, "SHARED_SETUP_OPEN");
  assert.equal(opened.state.revision, 1);
  assert.equal((await apply(opened.state, open)).status, "replayed");
  await deny(null, open, "SETUP_COORDINATOR_REQUIRED", fixture.authority("playerTwo"));
  for(const state of ["open", "closed", "expired", "revoked"]){
    const context = fixture.authority(); context.session.state = state;
    await deny(null, open, "SETUP_ACTIVE_SESSION_REQUIRED", context);
    await deny(opened.state, open, "SETUP_ACTIVE_SESSION_REQUIRED", context);
  }
  for(const mutate of [a => a.nowEpochMs = a.session.expiresAtEpochMs, a => a.session.expiresAtEpochMs = NaN]){
    const context = fixture.authority(); mutate(context); await deny(null, open, "SETUP_ACTIVE_SESSION_REQUIRED", context);
  }
  for(const [mutate, code] of [
    [a => a.connectionState = "revoked", "SETUP_RIVALRY_INACTIVE"],
    [a => a.actor.accountId = "unrelated_third_account", "SETUP_ACTOR_NOT_ENTITLED"],
    [a => a.actor.managerRole = "playerTwo", "SETUP_ACTOR_NOT_ENTITLED"],
    [a => a.actor.profileId = `profile_${"f".repeat(24)}`, "SETUP_ACTOR_NOT_ENTITLED"],
    [a => a.actor.saveId = `save_${"f".repeat(24)}`, "SETUP_ACTOR_NOT_ENTITLED"],
    [a => a.actor.deviceState = "revoked", "SETUP_DEVICE_INACTIVE"],
    [a => a.managerSlots[1].accountState = "deletion-requested", "SETUP_MANAGER_INACTIVE"],
    [a => a.managerSlots[1].entitlementState = "revoked", "SETUP_MANAGER_INACTIVE"],
    [a => a.managerSlots[1].accountId = a.managerSlots[0].accountId, "SETUP_TWO_MANAGERS_REQUIRED"],
    [a => a.session.memberAccountIds[1] = "unrelated_third_account", "SETUP_SESSION_MEMBERS_MISMATCH"],
    [a => a.session.memberAccountIds.push("third"), "SETUP_SESSION_MEMBERS_MISMATCH"],
    [a => a.session.rivalryId = `pair_${"f".repeat(64)}`, "SETUP_SESSION_MISMATCH"],
    [a => a.actor.rawToken = "must_never_echo", "SETUP_ACTOR_INVALID"]
  ]){
    const context = fixture.authority(); mutate(context); await deny(null, open, code, context);
  }
  const league = fixture.command("commit-league", 1, 2, {leagueId:"premier_league"});
  await deny(opened.state, league, "SETUP_COORDINATOR_REQUIRED", fixture.authority("playerTwo"));
  const selected = await apply(opened.state, league);
  await deny(selected.state, {...league, leagueId:"laliga"}, "SETUP_IDEMPOTENCY_CONFLICT");
  await deny(selected.state, fixture.command("commit-league", 1, 3, {leagueId:"laliga"}), "SETUP_STALE_BASE_REVISION");
  await deny(selected.state, fixture.command("commit-league", 2, 3, {leagueId:"laliga"}), "SETUP_TRANSITION_INVALID");
  await deny(selected.state, league, "SETUP_IDEMPOTENCY_CONFLICT", fixture.authority("playerTwo"));
  await deny(selected.state, fixture.command("commit-length", 2, 3, {totalSeasons:3}), "SETUP_TRANSITION_INVALID");
  const clubs = fixture.command("commit-clubs", 2, 3, {clubs:{playerOne:"Arsenal", playerTwo:"Chelsea"}});
  await deny(selected.state, {...clubs, clubs:{playerOne:"Arsenal", playerTwo:"Arsenal"}}, "SETUP_CLUBS_INVALID");
  await deny(selected.state, {...clubs, clubs:{playerOne:"Arsenal", playerTwo:"Barcelona"}}, "SETUP_CLUBS_INVALID");
  const assigned = await apply(selected.state, clubs);
  for(const totalSeasons of [0,2,4,6,11,1.5,"3",null]) await deny(assigned.state, fixture.command("commit-length", 3, 4, {totalSeasons}), "SETUP_LENGTH_INVALID");
  for(const totalSeasons of [1,3,5,10]){
    const length = await apply(assigned.state, fixture.command("commit-length", 3, 4, {totalSeasons}));
    assert.equal(length.state.totalSeasons, totalSeasons);
  }
  const length = await apply(assigned.state, fixture.command("commit-length", 3, 4, {totalSeasons:10}));
  const setupHash = await api.confirmationHash(length.state);
  const confirmOne = fixture.command("confirm", 4, 5, {setupHash});
  await deny(length.state, {...confirmOne, setupHash:`sha256:${"f".repeat(64)}`}, "SETUP_CONFIRMATION_CHANGED");
  const firstConfirmed = await apply(length.state, confirmOne);
  assert.equal(firstConfirmed.state.phase, "SEASON_LENGTH_COMMITTED");
  await deny(firstConfirmed.state, fixture.command("confirm", 5, 7, {setupHash}), "SETUP_CONFIRMATION_NOT_AVAILABLE");
  await deny(firstConfirmed.state, fixture.command("confirm", 4, 6, {setupHash}), "SETUP_STALE_BASE_REVISION", fixture.authority("playerTwo"));
  const confirmed = await apply(firstConfirmed.state, fixture.command("confirm", 5, 6, {setupHash}), fixture.authority("playerTwo"));
  assert.equal(confirmed.state.phase, "SHOWDOWN_CONFIRMED");
  assert.equal(confirmed.state.revision, 6);
  assert.equal((await apply(confirmed.state, open)).acceptedRevision, 1, "Lost-ack replay reports original revision while returning current authority.");
  await deny(confirmed.state, fixture.command("open", 6, 99), "SETUP_ALREADY_CONFIRMED");
  await deny(confirmed.state, fixture.command("commit-length", 6, 99, {totalSeasons:1}), "SETUP_ALREADY_CONFIRMED");
  const newSession = fixture.authority(); newSession.session.sessionId = `session_${"e".repeat(64)}`;
  assert.equal((await apply(confirmed.state, open, newSession)).status, "replayed", "Fresh exact-rivalry session resumes existing setup; it does not reset it.");
  const swappedHost = fixture.authority("playerTwo"); swappedHost.session.hostAccountId = swappedHost.actor.accountId;
  await deny(opened.state, league, "SETUP_COORDINATOR_REQUIRED", swappedHost);
  const otherRivalry = fixture.authority(); otherRivalry.rivalryId = `pair_${"e".repeat(64)}`; otherRivalry.session.rivalryId = otherRivalry.rivalryId;
  await deny(opened.state, league, "SETUP_BINDING_CHANGED", otherRivalry);
  const changedBinding = fixture.authority(); changedBinding.managerSlots[1].saveId = `save_${"e".repeat(24)}`;
  await deny(opened.state, league, "SETUP_BINDING_CHANGED", changedBinding);
  const tampered = clone(selected.state); tampered.leagueId = "laliga";
  await deny(tampered, clubs, "SETUP_INTEGRITY_FAILED");
  const unknown = clone(selected.state); unknown.rawSessionCapability = fixture.authority().session.sessionId;
  await deny(unknown, clubs, "SETUP_STATE_INVALID");
  await deny(null, {...open, undocumented:true}, "SETUP_COMMAND_INVALID");
  await deny(null, {...open, type:"__proto__"}, "SETUP_COMMAND_INVALID");
  assert.doesNotMatch(JSON.stringify(confirmed.state), /session_|pair_|device_|synthetic_setup_|profile_|save_/);
  assert.ok(Object.isFrozen(confirmed.state.clubs));

  // Transaction contention simulation: commit iff the exact read version still
  // matches; retry the original command, never refresh its base or redraw.
  let shared = opened.state;
  async function transact(command){
    for(let attempt = 0; attempt < 3; attempt++){
      const observed = shared;
      const result = await api.apply({state:observed, authority:fixture.authority(), command});
      if(!result.ok) return result;
      if(shared !== observed) continue;
      shared = result.state; return result;
    }
    throw new Error("Test transaction contention did not settle");
  }
  const races = await Promise.all([transact(league), transact(fixture.command("commit-league", 1, 22, {leagueId:"laliga"}))]);
  assert.equal(races.filter(result => result.ok).length, 1);
  assert.equal(races.find(result => !result.ok).code, "SETUP_STALE_BASE_REVISION");
  assert.equal(shared.revision, 2);
  shared = opened.state;
  const retries = await Promise.all([transact(league), transact(league)]);
  assert.deepEqual(retries.map(result => result.status).sort(), ["accepted","replayed"]);
  assert.equal(shared.revision, 2);
  const draw = await api.prepareDraw({state:opened.state, type:"commit-league", operationId:fixture.command("open",0,55).operationId});
  assert.ok(moduleApi.leagueIds.includes(draw.leagueId));
  const clubDraw = await api.prepareDraw({state:selected.state, type:"commit-clubs", operationId:fixture.command("open",0,56).operationId});
  assert.notEqual(clubDraw.clubs.playerOne, clubDraw.clubs.playerTwo);
  assert.ok(fixture.catalog().premier_league.includes(clubDraw.clubs.playerTwo));
  await assert.rejects(api.prepareDraw({state:confirmed.state, type:"commit-league", operationId:draw.operationId}), /SETUP_DRAW_NOT_AVAILABLE/);
  const pendingState = clone(opened.state), pendingCommand = clone(league), pendingAuthority = fixture.authority();
  const pending = api.apply({state:pendingState, command:pendingCommand, authority:pendingAuthority});
  pendingState.phase = "SHOWDOWN_CONFIRMED"; pendingCommand.leagueId = "laliga"; pendingAuthority.actor.accountId = "third";
  assert.equal((await pending).state.leagueId, "premier_league", "Captured immutable intent survives caller mutation during hashing.");
  for(const source of ["index.html","js/optionalModules.js","service-worker.js"]) assert.equal(fs.readFileSync(source,"utf8").includes("sharedShowdownSetup.js"), false, "Candidate protocol must not activate production.");
  assert.equal(moduleApi.productionEnabled, false);
  process.stdout.write(`PASS Shared Showdown Setup: ${checks} accepted/rejected immutable transitions, concurrent CAS/replay, exact two-manager authority, one draw, dual confirmation and fresh-session continuity; candidate evidence only, SSJR credit 0.\n`);
})().catch(error => { console.error(error); process.exitCode = 1; });
