"use strict";
// Pure, read-only JOB-1010 diagnostic: no browser, Firebase, network or game writes.
const path = require("node:path"), { webcrypto } = require("node:crypto");
const load = name => require(path.resolve(__dirname, "../../../js", name + ".js"));
const resultsModule = load("sharedSeasonResults"), commitModule = load("sharedSeasonCommit");
const scoringModule = load("sharedCanonicalScoring"), historyModule = load("sharedHistoryConvergence");
const finalModule = load("sharedFinalReconciliation"), progression = load("sharedMultiSeasonProgression").createProtocol();
const roles = ["playerOne", "playerTwo"], clone = value => JSON.parse(JSON.stringify(value));
const rivalryId = "pair_" + "a".repeat(64), setup = { phase: "SHOWDOWN_CONFIRMED", revision: 6,
  coordinatorRole: "playerOne", confirmedRoles: roles, totalSeasons: 10, leagueId: "premier_league",
  clubs: { playerOne: "Arsenal", playerTwo: "Chelsea" } };
const managerSlots = roles.map((slotId, i) => ({ slotId, accountId: ["daniel", "nik"][i],
  profileId: "profile_" + String(i + 1).repeat(24), saveId: "save_" + String(i + 3).repeat(24), entitlementState: "active" }));
const zero = overrides => ({ leaguePosition: 20, leaguePoints: 0, leagueGoals: 0, domesticCup: false,
  championsLeague: false, topScorer: false, topAssist: false, ...overrides });
const max = () => zero({ leaguePosition: 1, leaguePoints: 114, leagueGoals: 300,
  domesticCup: true, championsLeague: true, topScorer: true, topAssist: true });
const pair = (playerOne, playerTwo, a, b, winner) => ({ results: { playerOne, playerTwo }, expected: { a, b, winner } });
const repeat = fn => Array.from({ length: 10 }, (_, i) => fn(i));
const cases = [
  ["all zeros", repeat(() => pair(zero(), zero(), 0, 0, "draw"))],
  ["Daniel maximum every season (110)", repeat(() => pair(max(), zero(), 11, 0, "playerOne"))],
  ["alternating wins", repeat(i => i % 2 ? pair(zero(), max(), 0, 11, "playerTwo") : pair(max(), zero(), 11, 0, "playerOne"))],
  ["points tied, split by league position", repeat(i => i % 2 ? pair(zero({ leaguePosition: 4 }), zero({ leaguePosition: 2 }), 0, 0, "playerTwo") : pair(zero({ leaguePosition: 2 }), zero({ leaguePosition: 4 }), 0, 0, "playerOne"))],
  ["final total tie despite unequal season wins", repeat(i => i < 5 ? pair(zero({ domesticCup: true }), zero(), 1, 0, "playerOne") : i === 5 ? pair(zero(), zero({ championsLeague: true }), 0, 5, "playerTwo") : pair(zero(), zero(), 0, 0, "draw"))],
  ["both bonus triggers claimed twice in season 5", repeat(i => i === 4 ? pair(zero({ leaguePoints: 100, leagueGoals: 100, topScorer: true, topAssist: true }), zero({ leagueGoals: 100 }), 2, 1, "playerOne") : pair(zero(), zero(), 0, 0, "draw"))],
  ["Nik missing season 5 entry", repeat(i => i === 4 ? pair(max(), null, null, null, "incomplete") : pair(max(), zero(), 11, 0, "playerOne"))],
  ["Nik maximum every season (110)", repeat(() => pair(zero(), max(), 0, 11, "playerTwo"))],
  ["equal position, league-points tiebreak", repeat(i => i % 2 ? pair(zero({ leaguePoints: 40 }), zero({ leaguePoints: 60 }), 0, 0, "playerTwo") : pair(zero({ leaguePoints: 60 }), zero({ leaguePoints: 40 }), 0, 0, "playerOne"))]
];
const boundaries = [[zero({ leaguePoints: 99, leagueGoals: 99 }), 0], [zero({ championsLeague: true }), 5],
  [zero({ leaguePosition: 1 }), 3], [zero({ domesticCup: true }), 1], [zero({ leaguePoints: 100 }), 1],
  [zero({ leagueGoals: 100 }), 1], [zero({ topScorer: true }), 1], [zero({ topAssist: true }), 1],
  [zero({ leaguePoints: 100, leagueGoals: 100, topScorer: true, topAssist: true }), 2], [max(), 11]];
cases.push(["individual awards and 99/100 boundaries", boundaries.map(([r, n], i) => pair(r, zero(i === 0 ? { leaguePoints: 99, leagueGoals: 99 } : {}), n, 0, n ? "playerOne" : "draw"))]);
let comparisons = 0, operation = 0; const bugs = [];
function check(label, expected, actual, source) {
  comparisons++; const pass = JSON.stringify(expected) === JSON.stringify(actual);
  console.log(`${pass ? "PASS" : "BUG"} ${label}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)} source=${source}`);
  if (!pass) bugs.push({ label, expected, actual, source });
}
async function rejected(fn) { try { await fn(); return "ACCEPTED"; } catch (error) { if (!error.code) throw error; return error.code; } }
const op = prefix => prefix + (++operation).toString(16).padStart(32, "0");
const totals = p => roles.map(role => p.managerRecords[role].totalPoints);
function terminalArgs(projection, state, role) {
  return { sharedActive: true, multiSeason: { ok: true, authoritative: true, phase: state.phase, rivalryId, state },
    history: { authoritative: true, phase: "HISTORY_CONVERGED", rivalryId, projection },
    localReconciliation: { phase: "REMOTE_OBSERVED", canonicalStorageMutation: false, providerWriteRequired: false,
      automaticLocalApply: false, candidateCOnly: true, binding: { managerRole: role,
        profileId: managerSlots[roles.indexOf(role)].profileId, saveId: managerSlots[roles.indexOf(role)].saveId } } };
}
async function main() {
  console.log("JOB-1010: 10-season pure shared Showdown sweep; Daniel=playerOne, Nik=playerTwo");
  console.log("Rules: CL 5, league 3, cup 1, performance OR 1, awards OR 1; season max 11; final equal totals DRAW.");
  console.log("Browser/provider lifecycle APIs and legacy unexported js/scoring.js functions are not invoked.");
  const options = { teamCount: 20, cryptoImpl: webcrypto }, resultsApi = await resultsModule.createProtocol(options);
  const commitApi = await commitModule.createProtocol(options), scoringApi = await scoringModule.createProtocol(options);
  async function publishOne(state, seasonNumber, role, result) {
    return (await resultsApi.apply({ state, setup, careerStart: { phase: "CAREER_START_READY", revision: 2, acknowledgedRoles: roles },
      transferChallenge: { phase: "COMPLETED", seasonNumber, revision: 1 }, seasonNumber, actorRole: role,
      command: { type: "publish-result", operationId: op("season_result_op_"), baseRevision: state?.revision || 0, result } })).state;
  }
  for (const [name, fixtures] of cases) {
    console.log(`\nCASE ${name}`); const sources = [], expectedTotals = [0, 0]; let projection = null, gap = false;
    let state = progression.derive({ rivalryId, setup }), prefix = null;
    for (const [index, fixture] of fixtures.entries()) {
      const seasonNumber = index + 1, label = `${name} / season ${seasonNumber}`;
      let published = await publishOne(null, seasonNumber, "playerOne", fixture.results.playerOne);
      if (fixture.results.playerTwo === null) {
        gap = true; check(label + " collecting", "COLLECTING", published.phase, "js/sharedSeasonResults.js:68-69");
        check(label + " commit rejected", "SEASON_COMMIT_RESULTS_NOT_READY", await rejected(() => commitApi.apply({ setup, seasonResults: published, seasonNumber, actorRole: "playerOne", command: { type: "commit-season", operationId: op("season_commit_op_"), baseRevision: 0 } })), "js/sharedSeasonCommit.js:35-39");
        check(label + " missing scoring rejected (no zero)", "CANONICAL_SCORING_RESULTS_INVALID", await rejected(() => scoringApi.scoreAuthoritativeResults(fixture.results)), "js/sharedCanonicalScoring.js:19,25,36");
        console.log(`PASS ${label}: expected=incomplete actual=no scored season; final cannot include the missing entry`); continue;
      }
      published = await publishOne(published, seasonNumber, "playerTwo", fixture.results.playerTwo);
      let committed = null;
      for (const [type, actorRole] of [["commit-season", "playerOne"], ["acknowledge-season", "playerOne"], ["acknowledge-season", "playerTwo"]]) {
        committed = (await commitApi.apply({ state: committed, setup, seasonResults: published, seasonNumber, actorRole,
          command: { type, operationId: op("season_commit_op_"), baseRevision: committed?.revision || 0 } })).state;
      }
      const canonical = await scoringApi.reconcile({ seasonCommit: committed }); await scoringApi.verifyState(canonical, { seasonCommit: committed });
      const expected = [fixture.expected.a, fixture.expected.b, fixture.expected.winner];
      check(label + " points/winner", expected, [canonical.scoring.playerOne.total, canonical.scoring.playerTwo.total, canonical.winner], "js/sharedCanonicalScoring.js:26-31,39");
      check(label + " direct calculation", expected, (() => { const v = scoringApi.scoreAuthoritativeResults(fixture.results); return [v.scoring.playerOne.total, v.scoring.playerTwo.total, v.winner]; })(), "js/sharedCanonicalScoring.js:36");
      for (const role of roles) check(label + ` ${role} bonus caps`, [fixture.results[role].leaguePoints >= 100 || fixture.results[role].leagueGoals >= 100 ? 1 : 0, fixture.results[role].topScorer || fixture.results[role].topAssist ? 1 : 0], [canonical.scoring[role].performanceBonus, canonical.scoring[role].individualAwardsBonus], "js/sharedCanonicalScoring.js:28");
      // Adapt real protocol projections to the documented read-only provider envelope shape.
      const commit = { ok: true, committed: true, ...commitApi.projectForRole(committed, "playerOne") };
      const scoring = { ok: true, authoritative: true, ...scoringApi.projectForRole(canonical, "playerOne"), resultsRevision: committed.resultsRevision, resultsContentHash: committed.resultsContentHash };
      sources.push({ commit, scoring }); if (gap) continue;
      expectedTotals[0] += fixture.expected.a; expectedTotals[1] += fixture.expected.b;
      projection = historyModule.buildProjection({ rivalryId, setup, managerSlots, seasons: sources }); historyModule.verifyProjection(projection);
      check(label + " history/totals", [seasonNumber, ...expectedTotals, fixture.expected.winner], [projection.seasonHistory.length, ...totals(projection), projection.seasonHistory.at(-1).winner], "js/sharedHistoryConvergence.js:88-109");
      state = progression.observe({ previous: state, rivalryId, setup, history: projection }); progression.verifyState(state); prefix = projection;
    }
    if (gap) {
      check(name + " / season 5 history missing manager rejected", "HISTORY_CONVERGENCE_RESULTS_INVALID", await rejected(() => { const bad = clone(sources); bad[4].commit.seasonNumber = 5; bad[4].commit.results.playerTwo = null; return historyModule.buildProjection({ rivalryId, setup, managerSlots, seasons: bad }); }), "js/sharedHistoryConvergence.js:25-26,72-76");
      check(name + " / final before gap", [4, 44, 0, "BLOCKED", "multi-season-not-terminal"], [prefix.acceptedSeasons, ...totals(prefix), finalModule.reconcile(terminalArgs(prefix, state, "playerOne")).phase, finalModule.reconcile(terminalArgs(prefix, state, "playerOne")).reason], "js/sharedHistoryConvergence.js:98-103; js/sharedFinalReconciliation.js:40");
      const forced = { ...state, phase: "SHOWDOWN_COMPLETE", terminal: true, acceptedSeasons: 10, completedSeason: 10, activeSeason: null };
      check(name + " / final incomplete history rejected", "FINAL_RECONCILIATION_HISTORY_INCOMPLETE", await rejected(() => finalModule.reconcile(terminalArgs(prefix, forced, "playerOne"))), "js/sharedFinalReconciliation.js:25"); continue;
    }
    for (const role of roles) {
      const final = finalModule.reconcile(terminalArgs(projection, state, role)); finalModule.verifyProjection(final);
      const winner = expectedTotals[0] > expectedTotals[1] ? "playerOne" : expectedTotals[1] > expectedTotals[0] ? "playerTwo" : "DRAW";
      check(name + ` / final (${role})`, [...expectedTotals, winner, 10, true, null, false], [final.managerTotals.playerOne, final.managerTotals.playerTwo, final.winner === "draw" ? "DRAW" : final.winner, final.acceptedSeasons, final.terminal, final.nextSeason, final.extraSeasonAllowed], "js/sharedFinalReconciliation.js:47-49");
    }
    for (const role of roles) check(name + ` / final ${role} history W/L/D`, [fixtures.filter(f => f.expected.winner === role).length, fixtures.filter(f => f.expected.winner !== role && f.expected.winner !== "draw").length, fixtures.filter(f => f.expected.winner === "draw").length], [projection.managerRecords[role].seasonWins, projection.managerRecords[role].seasonLosses, projection.managerRecords[role].seasonDraws], "js/sharedHistoryConvergence.js:90");
  }
  console.log(`\nSUMMARY: ${cases.length} ten-season cases; ${comparisons} comparisons; ${bugs.length} bugs found.`);
  for (const bug of bugs) console.log("BUG DETAIL " + JSON.stringify(bug));
  if (bugs.length) process.exitCode = 1;
}
main().catch(error => { console.error("HARNESS ERROR:", error.stack); process.exitCode = 2; });
