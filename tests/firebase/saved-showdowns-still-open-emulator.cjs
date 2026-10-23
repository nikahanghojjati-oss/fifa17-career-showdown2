"use strict";
// JOB-1841 "old games still open": a release check for saved Showdowns.
//
// Every fixture in tests/fixtures/saved-showdowns/ is the real database content of ONE finished 1-season Showdown, played in the
// browser on the Firebase emulator by an earlier release (r75, r76, r79; see the README next to the fixtures). This test loads each fixture
// into a fresh emulator with the COMPOSED production Rules (firestore.spark.generated.rules, built by BOTH build scripts), signs in as each
// manager, and runs the CURRENT code path that opens a saved Showdown:
//   PersistentPair.readCareerIndex -> CompletedShowdownReader.readCompletedShowdown -> ClosedShowdownCareerLoader.loadClosedShowdownCareer
//   (-> SharedClosedShowdownAdapter -> SharedCareerAnalytics.buildCareerModel).
// It then asserts the values written in the README (status, winner, season scores, trophy counts, totals).
// If a later release stops opening an older release's Showdown, or opens it with different numbers, this fails.
// It also fails if a fixture is missing, unreadable, or has no expected values here.
//
// Seeding: the fixture documents are written with the emulator's Rules-disabled owner path (withSecurityRulesDisabled), as the other
// emulator tests do. All reads are done as the signed-in managers under the real Rules. Demo project only; never a real Firebase project.
//
// Run: npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-saved-showdowns-open "node tests/firebase/saved-showdowns-still-open-emulator.cjs"
//      (or: npm run -s test:saved-showdowns-still-open)

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const firestoreSdk = require("firebase/firestore");
const { Timestamp, doc, getDoc, setDoc } = firestoreSdk;
const { initializeTestEnvironment, assertFails } = require("@firebase/rules-unit-testing");

global.window = globalThis;
require("../../data/transferOptions.js");

const PersistentPair = require("../../js/persistentNikDanielPair.js");
const Reader = require("../../js/sparkCompletedShowdownReader.js");
const Loader = require("../../js/sparkClosedShowdownCareerLoader.js");

const ROOT = path.resolve(__dirname, "../..");
const FIXTURE_DIR = path.join(ROOT, "tests/fixtures/saved-showdowns");
const PROJECT_ID = process.env.GCLOUD_PROJECT || "demo-cms-saved-showdowns-open";

// ---------------------------------------------------------------------------------------------------------------------------
// Expected values. They are written by hand from the inputs typed into each real game (see the README in the fixture folder),
// never taken from the fixture file, so a changed or re-generated fixture cannot silently change what the check expects.
// Scoring: Champions League 5, league title 3, domestic cup 1, 100 league points or 100 league goals 1, top scorer / top assist 1 (once).
// ---------------------------------------------------------------------------------------------------------------------------
// WIN game (both releases, same typed inputs): Daniel wins 6-5. Daniel: league 5th, 48 points, 119 goals, Champions League
// = 5 + 1 (100 goals) = 6. Nik: league title, 100 points, 61 goals, domestic cup = 3 + 1 + 1 (100 points) = 5.
const WIN_SEASONS = [{ season: 1, score: { daniel: 6, nik: 5 }, winner: "daniel", tiebreak: "none", leaguePosition: { daniel: 5, nik: 1 }, leaguePoints: { daniel: 48, nik: 100 }, leagueGoals: { daniel: 119, nik: 61 } }];
const WIN_MANAGERS = {
  daniel: { seasons: 1, careerPoints: 6, seasonWins: 1, seasonDraws: 0, seasonLosses: 0, championsLeagues: 1, leagueTitles: 0, domesticCups: 0, totalTrophies: 1, showdowns: { completed: 1, wins: 1, draws: 0, losses: 0 } },
  nik: { seasons: 1, careerPoints: 5, seasonWins: 0, seasonDraws: 0, seasonLosses: 1, championsLeagues: 0, leagueTitles: 1, domesticCups: 1, totalTrophies: 2, showdowns: { completed: 1, wins: 0, draws: 0, losses: 1 } }
};
// DRAW game (both releases, same typed inputs): 8-8. Both: Champions League + domestic cup + 100 points/goals + an individual award
// = 5 + 1 + 1 + 1 = 8. The season is level, so the game's own tie-break (better league position: Nik 8th v Daniel 9th) names Nik the
// season winner, while the Showdown itself is a draw (equal totals).
const DRAW_SEASONS = [{ season: 1, score: { daniel: 8, nik: 8 }, winner: "draw", tiebreak: "draw", leaguePosition: { daniel: 9, nik: 8 }, leaguePoints: { daniel: 53, nik: 102 }, leagueGoals: { daniel: 135, nik: 45 } }];
const DRAW_MANAGERS = {
  daniel: { seasons: 1, careerPoints: 8, seasonWins: 0, seasonDraws: 1, seasonLosses: 0, championsLeagues: 1, leagueTitles: 0, domesticCups: 1, totalTrophies: 2, showdowns: { completed: 1, wins: 0, draws: 1, losses: 0 } },
  nik: { seasons: 1, careerPoints: 8, seasonWins: 0, seasonDraws: 1, seasonLosses: 0, championsLeagues: 1, leagueTitles: 0, domesticCups: 1, totalTrophies: 2, showdowns: { completed: 1, wins: 0, draws: 1, losses: 0 } }
};
// r79 WIN game (Paris Saint-Germain v Metz, Ligue 1; typed by the CE2PG harness on live main 1.9.3-r79): Daniel wins 5-1. Daniel: league
// title, 92 points, 108 goals, top scorer = 3 + 1 (100 goals) + 1 (top scorer) = 5. Nik: 12th, 24 points, 30 goals, domestic cup = 1.
// r80 adds the Europa League counter; an r79 Showdown never has one (0), and its trophy totals are unchanged.
const R79_WIN_SEASONS = [{ season: 1, score: { daniel: 5, nik: 1 }, winner: "daniel", tiebreak: "none", leaguePosition: { daniel: 1, nik: 12 }, leaguePoints: { daniel: 92, nik: 24 }, leagueGoals: { daniel: 108, nik: 30 } }];
const R79_WIN_MANAGERS = {
  daniel: { seasons: 1, careerPoints: 5, seasonWins: 1, seasonDraws: 0, seasonLosses: 0, championsLeagues: 0, europaLeagues: 0, leagueTitles: 1, domesticCups: 0, totalTrophies: 1, showdowns: { completed: 1, wins: 1, draws: 0, losses: 0 } },
  nik: { seasons: 1, careerPoints: 1, seasonWins: 0, seasonDraws: 0, seasonLosses: 1, championsLeagues: 0, europaLeagues: 0, leagueTitles: 0, domesticCups: 1, totalTrophies: 1, showdowns: { completed: 1, wins: 0, draws: 0, losses: 1 } }
};

const EXPECTED = {
  "r75-1season-win": { release: "1.9.1-r75", leagueId: "bundesliga", clubs: { daniel: "Borussia Mönchengladbach", nik: "Hoffenheim" }, totalSeasons: 1, totals: { daniel: 6, nik: 5 }, winner: "daniel", seasons: WIN_SEASONS, managers: WIN_MANAGERS },
  "r75-1season-draw": { release: "1.9.1-r75", leagueId: "laliga", clubs: { daniel: "Leganés", nik: "Málaga" }, totalSeasons: 1, totals: { daniel: 8, nik: 8 }, winner: "draw", seasons: DRAW_SEASONS, managers: DRAW_MANAGERS },
  "r76-1season-win": { release: "1.9.1-r76", leagueId: "bundesliga", clubs: { daniel: "Eintracht Frankfurt", nik: "RB Leipzig" }, totalSeasons: 1, totals: { daniel: 6, nik: 5 }, winner: "daniel", seasons: WIN_SEASONS, managers: WIN_MANAGERS },
  "r76-1season-draw": { release: "1.9.1-r76", leagueId: "premier_league", clubs: { daniel: "West Ham United", nik: "Watford" }, totalSeasons: 1, totals: { daniel: 8, nik: 8 }, winner: "draw", seasons: DRAW_SEASONS, managers: DRAW_MANAGERS },
  "r79-1season-win": { release: "1.9.3-r79", leagueId: "ligue_1", clubs: { daniel: "Paris Saint-Germain", nik: "Metz" }, totalSeasons: 1, totals: { daniel: 5, nik: 1 }, winner: "daniel", seasons: R79_WIN_SEASONS, managers: R79_WIN_MANAGERS }
};

// ---------------------------------------------------------------------------------------------------------------------------
let checks = 0;
function ok(id, label) { checks += 1; process.stdout.write(`ok ${checks} ${id} ${label}\n`); }

// Firestore REST typed values -> SDK values (Timestamps keep their exact seconds + nanoseconds so content hashes still verify).
function decodeValue(value) {
  const kind = Object.keys(value)[0];
  switch (kind) {
    case "nullValue": return null;
    case "booleanValue": return value.booleanValue;
    case "stringValue": return value.stringValue;
    case "integerValue": { const n = Number(value.integerValue); assert.ok(Number.isSafeInteger(n), "fixture integer out of range"); return n; }
    case "doubleValue": return value.doubleValue;
    case "timestampValue": {
      const m = /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d{1,9}))?Z$/.exec(value.timestampValue);
      assert.ok(m, `fixture timestamp ${value.timestampValue}`);
      return new Timestamp(Date.parse(`${m[1]}Z`) / 1000, Number((m[2] || "").padEnd(9, "0")));
    }
    case "arrayValue": return (value.arrayValue.values || []).map(decodeValue);
    case "mapValue": return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decodeValue(item)]));
    default: throw new Error(`fixture value type ${kind} is not supported`);
  }
}
const decodeDocument = (fields) => decodeValue({ mapValue: { fields } });

function buildComposedRules() {
  // Same two scripts, same order, as the other composed-Rules tests and CI. The output file is git-ignored.
  for (const script of ["build-production-firestore-rules.mjs", "build-production-firestore-rules-with-persistent-pair.mjs"]) {
    const built = spawnSync(process.execPath, [path.join(ROOT, "scripts", script)], { cwd: ROOT, encoding: "utf8" });
    assert.equal(built.status, 0, `${script} failed: ${built.stderr}`);
  }
  const rules = fs.readFileSync(path.join(ROOT, "firestore.spark.generated.rules"), "utf8");
  assert.match(rules, /function cmsCompletedShowdownReadable\(rivalryId\)/, "composed Rules must contain the completed-Showdown read grant");
  assert.match(rules, /match \/accounts\/\{accountId\}\/careerIndex\/\{indexId\}/, "composed Rules must contain the career index");
  assert.match(rules, /match \/accounts\/\{accountId\}\/pairLinks\/\{pairId\}/, "composed Rules must contain the persistent pair fragment");
  return rules;
}

function loadFixture(name) {
  const file = path.join(FIXTURE_DIR, `${name}.json`);
  assert.ok(fs.existsSync(file), `MISSING FIXTURE ${path.relative(ROOT, file)}: every saved Showdown fixture must stay in the repo`);
  let fixture;
  try { fixture = JSON.parse(fs.readFileSync(file, "utf8")); } catch (error) { assert.fail(`fixture ${name} is not valid JSON: ${error.message}`); }
  assert.equal(fixture.fixtureVersion, 1, `${name}: fixtureVersion`);
  assert.equal(fixture.name, name, `${name}: fixture name`);
  assert.ok(Array.isArray(fixture.documents) && fixture.documents.length > 0, `${name}: documents`);
  assert.ok(!/(idtoken|refreshtoken|accesstoken|bearer|apikey|api_key|secret)/i.test(JSON.stringify(fixture)), `${name}: a fixture must not contain auth tokens`);
  return fixture;
}

async function seed(env, fixture) {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const item of fixture.documents) await setDoc(doc(db, ...item.path.split("/")), decodeDocument(item.fields));
  });
}

const sdkFor = () => firestoreSdk;

async function runFixture(env, name, expected) {
  const fixture = loadFixture(name);
  assert.equal(fixture.release, expected.release, `${name}: fixture says it was made with ${fixture.release}`);
  const rivalryId = fixture.rivalryId;
  assert.match(rivalryId, /^pair_[0-9a-f]{64}$/, `${name}: rivalryId`);
  await seed(env, fixture);
  ok(`${name}.seed`, `${fixture.documents.length} documents loaded into a fresh emulator (composed Rules active)`);

  // The two managers, exactly as the saved rivalry names them.
  const rivalryDoc = fixture.documents.find((item) => item.path === `rivalries/${rivalryId}`);
  assert.ok(rivalryDoc, `${name}: the rivalry document is part of the fixture`);
  const rivalry = decodeDocument(rivalryDoc.fields);
  assert.equal(rivalry.data.connectionState, "closed", `${name}: saved rivalry is closed`);
  const uid = {};
  for (const slot of rivalry.data.managerSlots) uid[slot.slotId === "playerOne" ? "daniel" : "nik"] = slot.accountId;
  assert.ok(uid.daniel && uid.nik && uid.daniel !== uid.nik, `${name}: two different manager accounts`);

  for (const manager of ["daniel", "nik"]) {
    const id = uid[manager];
    const db = env.authenticatedContext(id).firestore();
    const tag = `${name}.${manager}`;

    // 1. The career index names this Showdown.
    const index = await PersistentPair.readCareerIndex({ firestore: db, firebaseSdk: sdkFor(), accountId: id });
    assert.equal(index.status, "ready", `${tag}: career index status ${JSON.stringify(index)}`);
    assert.deepEqual(index.rivalryIds, [rivalryId], `${tag}: career index lists exactly this Showdown`);
    ok(`${tag}.index`, "career index is ready and lists the saved Showdown");

    // 2. The session-free reader opens it and rebuilds every season.
    const read = await Reader.readCompletedShowdown({ firestore: db, firebaseSdk: sdkFor(), user: { uid: id }, rivalryId, cryptoImpl: crypto.webcrypto });
    assert.equal(read.status, "completed", `${tag}: reader status ${read.status} (${read.code})`);
    assert.equal(read.code, null, `${tag}: reader code`);
    assert.equal(read.managerRole, manager === "daniel" ? "playerOne" : "playerTwo", `${tag}: reader manager role`);
    assert.equal(read.final.seasonsPlayed, expected.totalSeasons, `${tag}: seasons played`);
    assert.deepEqual(read.final.totals, { playerOne: expected.totals.daniel, playerTwo: expected.totals.nik }, `${tag}: final totals`);
    assert.equal(read.final.winner, expected.winner === "draw" ? "draw" : expected.winner === "daniel" ? "playerOne" : "playerTwo", `${tag}: final winner`);
    assert.equal(read.final.margin, Math.abs(expected.totals.daniel - expected.totals.nik), `${tag}: final margin`);
    assert.equal(read.terminalWitness.totalSeasons, expected.totalSeasons, `${tag}: terminal witness seasons`);
    assert.deepEqual(read.terminalWitness.managerTotals, { playerOne: expected.totals.daniel, playerTwo: expected.totals.nik }, `${tag}: terminal witness totals`);
    assert.equal(read.projection.leagueId, expected.leagueId, `${tag}: league`);
    assert.equal(read.projection.acceptedSeasons, expected.totalSeasons, `${tag}: accepted seasons`);
    assert.equal(read.projection.seasonHistory.length, expected.totalSeasons, `${tag}: season history length`);
    for (const [i, season] of expected.seasons.entries()) {
      const got = read.projection.seasonHistory[i];
      assert.equal(got.roundNumber, season.season, `${tag}: season number`);
      assert.equal(got.playerOne.scoring.total, season.score.daniel, `${tag}: season ${season.season} Daniel score`);
      assert.equal(got.playerTwo.scoring.total, season.score.nik, `${tag}: season ${season.season} Nik score`);
      assert.equal(got.winner, season.winner === "draw" ? "draw" : season.winner === "daniel" ? "playerOne" : "playerTwo", `${tag}: season ${season.season} winner`);
    }
    ok(`${tag}.reader`, `reader opens it: completed, winner ${expected.winner}, totals ${expected.totals.daniel}-${expected.totals.nik}, ${expected.totalSeasons} season(s) rebuilt`);

    // 3. The career loader (index -> reader -> adapter -> career model) shows the same.
    Loader.clearClosedShowdownCache();
    const loaded = await Loader.loadClosedShowdownCareer({ firestore: db, firebaseSdk: sdkFor(), user: { uid: id }, cryptoImpl: crypto.webcrypto });
    assert.equal(loaded.status, "ready", `${tag}: career status ${loaded.status}`);
    assert.equal(loaded.entries.length, 1, `${tag}: one Showdown in the career`);
    assert.equal(loaded.entries[0].classification, "completed", `${tag}: entry classification ${loaded.entries[0].classification} (${loaded.entries[0].code})`);
    const model = loaded.model;
    assert.equal(model.status, "ready", `${tag}: model status`);
    assert.deepEqual(model.coverage, { readable: 1, indexed: 1 }, `${tag}: model coverage`);
    assert.equal(model.history.showdowns.length, 1, `${tag}: history rows`);
    const row = model.history.showdowns[0];
    assert.equal(row.rivalryId, rivalryId, `${tag}: history rivalry`);
    assert.equal(row.status, "completed", `${tag}: history status`);
    assert.equal(row.leagueId, expected.leagueId, `${tag}: history league`);
    assert.deepEqual(row.clubs, expected.clubs, `${tag}: history clubs`);
    assert.equal(row.seasonsPlayed, expected.totalSeasons, `${tag}: history seasons played`);
    assert.equal(row.totalSeasons, expected.totalSeasons, `${tag}: history total seasons`);
    assert.deepEqual(row.totals, expected.totals, `${tag}: history totals`);
    assert.equal(row.winner, expected.winner, `${tag}: history winner`);
    assert.deepEqual(row.seasons, expected.seasons, `${tag}: history season scores`);
    for (const who of ["daniel", "nik"]) {
      const got = model.managers[who];
      for (const [key, value] of Object.entries(expected.managers[who])) assert.deepEqual(got[key], value, `${tag}: ${who}.${key}`);
    }
    if (expected.winner === "draw") assert.equal(model.biggestShowdownWin, null, `${tag}: a drawn Showdown has no biggest win`);
    else assert.deepEqual({ manager: model.biggestShowdownWin.manager, margin: model.biggestShowdownWin.margin }, { manager: expected.winner, margin: Math.abs(expected.totals.daniel - expected.totals.nik) }, `${tag}: biggest Showdown win`);
    ok(`${tag}.career`, `career loader: ready, winner ${expected.winner}, trophies Daniel ${expected.managers.daniel.totalTrophies} / Nik ${expected.managers.nik.totalTrophies}, totals ${expected.totals.daniel}-${expected.totals.nik}`);
  }

  // 4. A signed-in stranger still cannot read it (the Rules, not just the client, protect the saved Showdown).
  const stranger = env.authenticatedContext("acct_stranger_not_in_fixture").firestore();
  // Every saved document is probed, so each path the completed reader uses (setup ledger, season results, role results,
  // career index) stays covered even if a later Rules change opens one of them on its own.
  for (const item of fixture.documents) await assertFails(getDoc(doc(stranger, ...item.path.split("/"))));
  ok(`${name}.stranger`, `a signed-in stranger is denied all ${fixture.documents.length} saved documents`);
}

async function main() {
  const rules = buildComposedRules();
  ok("I0", "composed production Rules built (both scripts) and contain the completed read grant, career index and pair fragment");

  // A fixture folder with a file that has no expected values here (or the reverse) is a broken release check.
  const present = fs.existsSync(FIXTURE_DIR) ? fs.readdirSync(FIXTURE_DIR).filter((file) => file.endsWith(".json")).map((file) => file.slice(0, -5)).sort() : [];
  const wanted = Object.keys(EXPECTED).sort();
  for (const name of wanted) assert.ok(present.includes(name), `MISSING FIXTURE tests/fixtures/saved-showdowns/${name}.json (the release check needs all of: ${wanted.join(", ")})`);
  assert.deepEqual(present, wanted, "fixtures without expected values in this test (add them here and to the README)");
  const readme = fs.existsSync(path.join(FIXTURE_DIR, "README.md")) ? fs.readFileSync(path.join(FIXTURE_DIR, "README.md"), "utf8") : "";
  for (const name of wanted) assert.ok(readme.includes(name), `README.md in the fixture folder must describe ${name}`);
  ok("I1", `all ${wanted.length} fixtures present and described in the README: ${wanted.join(", ")}`);

  const env = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules } });
  try {
    for (const name of wanted) await runFixture(env, name, EXPECTED[name]);
  } finally {
    await env.cleanup();
  }
  process.stdout.write(`PASS saved Showdowns still open: ${wanted.length} fixtures (${wanted.join(", ")}), ${checks} numbered checks.\n`);
}

main().catch((error) => { console.error(error && error.stack || error); process.exit(1); });
