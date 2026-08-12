const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const zlib = require("node:zlib");

const root = path.resolve(__dirname, "../..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = relativePath => fs.existsSync(path.join(root, relativePath));
const html = read("index.html");
const app = read("js/app.js");
const appCss = read("css/app.css");
const optional = read("js/optionalModules.js");
const screens = read("js/screens.js");
const showdownUI = read("js/showdownUI.js");
const clubAssignment = read("js/clubAssignment.js");
const ruleBook = read("js/ruleBook.js");
const statistics = read("js/statistics.js");
const trophyRoom = read("js/trophyRoom.js");
const identitySource = read("js/visualIdentity.js");
const packageJson = JSON.parse(read("package.json"));
const packageLock = JSON.parse(read("package-lock.json"));

const appVersion = (app.match(/const APP_VERSION = "([^"]+)"/) || [])[1];
const revision = (html.match(/<meta\s+name="app-asset-revision"\s+content="([^"]+)"/i) || [])[1];
assert.ok(appVersion, "APP_VERSION is missing.");
assert.equal(packageJson.version, appVersion, "package.json and APP_VERSION must remain release-coherent.");
assert.equal(packageLock.version, appVersion, "package-lock.json top-level version is stale.");
assert.equal(packageLock.packages?.[""]?.version, appVersion, "package-lock.json root-package version is stale.");
assert.equal(revision, `${appVersion}-r1`, "The current v1.1.x release must use its fresh r1 cache identity.");
assert.ok(html.includes(`v${appVersion} · Stable`), "The visible footer is not aligned with APP_VERSION.");
assert.ok(!html.includes("V1 Visual Immersion Candidate"), "Obsolete candidate shell copy returned.");
assert.ok(app.includes(`css/visual-fidelity-r3.css?v=${revision}`), "The lazy visual-fidelity stylesheet has a stale revision.");
assert.ok(optional.includes("const OPTIONAL_ASSET_REVISION = getApplicationAssetRevision()"), "Optional assets must derive cache identity from the shell.");
assert.ok(packageJson.scripts?.["test:contracts"]?.includes("static-app-release-contracts.cjs"), "Dynamic release contracts must remain inside the repository-wide contract suite.");

const releaseRecordPath = `RELEASE_V${appVersion}.md`;
assert.ok(exists(releaseRecordPath), `Current release record is missing: ${releaseRecordPath}`);
const releaseRecord = read(releaseRecordPath);
assert.ok(releaseRecord.includes(`Release tag: \`v${appVersion}\``), "Current release record tag is stale.");
assert.ok(releaseRecord.includes(`Runtime asset revision: \`${revision}\``), "Current release record runtime revision is stale.");
for(const [file, historicalRevision] of [
    ["RELEASE_V1.1.3.md", "1.1.3-r1"],
    ["RELEASE_V1.1.2.md", "1.1.2-r1"],
    ["RELEASE_V1.1.1.md", "1.1.1-r1"],
    ["RELEASE_V1.1.0.md", "1.1.0-r1"],
    ["RELEASE_V1.0.2.md", "1.0.2-r1"]
]){
    assert.ok(read(file).includes(historicalRevision), `${file} no longer preserves its immutable historical revision.`);
}

function loadFunctions(filePath, exportExpression, initial = {}){
    const context = { console, structuredClone, ...initial };
    context.window = context;
    vm.createContext(context);
    const source = read(filePath);
    vm.runInContext(`${source}\n;globalThis.__testExports = ${exportExpression};`, context, { filename: filePath });
    return { context, api: context.__testExports };
}

const scoring = loadFunctions("js/scoring.js", "{ calculatePlayerSeasonScore, determineSeasonWinner }").api;
const perfect = scoring.calculatePlayerSeasonScore({
    leaguePosition: 1,
    leaguePoints: 100,
    leagueGoals: 100,
    championsLeague: true,
    domesticCup: true,
    topScorer: true,
    topAssist: true
});
assert.equal(perfect.total, 11, "Perfect season must remain capped at 11.");
assert.equal(perfect.performanceBonus, 1, "100 league points + 100 league goals must share one point.");
assert.equal(perfect.individualAwardsBonus, 1, "Top Scorer + Top Assist must share one point.");
assert.equal(
    scoring.determineSeasonWinner(
        { scoring: { total: 5 }, leaguePosition: 1, leaguePoints: 100 },
        { scoring: { total: 5 }, leaguePosition: 20, leaguePoints: 1 }
    ),
    "draw",
    "Equal non-zero season scores must remain a draw."
);
assert.equal(
    scoring.determineSeasonWinner(
        { scoring: { total: 0 }, leaguePosition: 2, leaguePoints: 90 },
        { scoring: { total: 0 }, leaguePosition: 1, leaguePoints: 10 }
    ),
    "playerTwo",
    "A 0-0 score must use league position first."
);
assert.equal(
    scoring.determineSeasonWinner(
        { scoring: { total: 0 }, leaguePosition: 3, leaguePoints: 84 },
        { scoring: { total: 0 }, leaguePosition: 3, leaguePoints: 80 }
    ),
    "playerOne",
    "A 0-0 score with equal league position must use league points."
);

const navigation = loadFunctions(
    "js/screens.js",
    "{ resolveCanonicalShowdownRoute, isRouteStateValid, isLeagueConfirmationPending, getLegalBackTargets }",
    { currentShowdown: null }
);
const baseShowdown = () => ({
    id: 1,
    status: "Created",
    currentRound: 1,
    totalRounds: 1,
    selectedLeague: null,
    clubs: { playerOne: null, playerTwo: null },
    transferChallenges: [],
    rounds: []
});
navigation.context.currentShowdown = null;
assert.equal(navigation.api.resolveCanonicalShowdownRoute(), "mainMenu");
assert.equal(navigation.api.isRouteStateValid("careerStatistics"), true);
assert.equal(navigation.api.isRouteStateValid("statistics"), false);
const noLeague = baseShowdown();
navigation.context.currentShowdown = noLeague;
assert.equal(navigation.api.resolveCanonicalShowdownRoute(), "leagueWheelScreen");
const selected = baseShowdown();
selected.selectedLeague = { id: "premier-league", name: "Premier League" };
selected.status = "League Selected";
navigation.context.currentShowdown = selected;
assert.equal(navigation.api.isLeagueConfirmationPending(), true);
assert.equal(navigation.api.resolveCanonicalShowdownRoute(), "leagueWheelScreen");
assert.equal(navigation.api.isRouteStateValid("clubWheelScreen"), false);
const confirmed = structuredClone(selected);
confirmed.status = "League Confirmed";
navigation.context.currentShowdown = confirmed;
assert.equal(navigation.api.resolveCanonicalShowdownRoute(), "clubWheelScreen");
const assigned = structuredClone(confirmed);
assigned.status = "Clubs Assigned";
assigned.clubs = { playerOne: "Arsenal", playerTwo: "Chelsea" };
navigation.context.currentShowdown = assigned;
assert.equal(navigation.api.resolveCanonicalShowdownRoute(), "clubWheelScreen");
assert.equal(navigation.api.isRouteStateValid("leagueWheelScreen"), false);
assert.equal(navigation.api.isRouteStateValid("dashboard"), false);
const ready = structuredClone(assigned);
ready.status = "Ready";
navigation.context.currentShowdown = ready;
assert.equal(navigation.api.resolveCanonicalShowdownRoute(), "dashboard");
assert.equal(navigation.api.isRouteStateValid("statistics"), true);
const transfer = structuredClone(ready);
transfer.status = "Transfer Window Active";
transfer.transferChallenges = [{ seasonNumber: 1, status: "active" }];
navigation.context.currentShowdown = transfer;
assert.equal(navigation.api.resolveCanonicalShowdownRoute(), "transferChallenge");
const transferComplete = structuredClone(ready);
transferComplete.transferChallenges = [{ seasonNumber: 1, status: "completed" }];
navigation.context.currentShowdown = transferComplete;
assert.equal(navigation.api.isRouteStateValid("seasonEntry"), true);
const completed = structuredClone(ready);
completed.status = "Completed";
completed.rounds = [{ roundNumber: 1 }];
navigation.context.currentShowdown = completed;
assert.equal(navigation.api.resolveCanonicalShowdownRoute(), "dashboard");
assert.equal(navigation.api.isRouteStateValid("seasonEntry"), false);
assert.deepEqual(Array.from(navigation.api.getLegalBackTargets("seasonSummary")), ["dashboard", "mainMenu"]);
assert.deepEqual(Array.from(navigation.api.getLegalBackTargets("legacy")), ["dashboard", "mainMenu"]);
assert.deepEqual(Array.from(navigation.api.getLegalBackTargets("careerStatistics")), ["mainMenu"]);
assert.deepEqual(Array.from(navigation.api.getLegalBackTargets("trophyRoom")), ["dashboard", "careerStatistics", "mainMenu"]);
assert.ok(screens.includes('status === "Clubs Assigned"') && screens.includes("isClubConfirmationPending"), "Club confirmation route checkpoint is missing.");
assert.ok(screens.includes("isLeagueConfirmationPending") && screens.includes('"League Confirmed"'), "League confirmation route checkpoint is missing.");

const clubData = loadFunctions("data/clubs.js", "{ clubsByLeague }").api;
const identity = loadFunctions("js/visualIdentity.js", "{ getClubIdentity, CLUB_IDENTITY_PALETTES }").api;
const clubs = Object.values(clubData.clubsByLeague).flat();
assert.equal(clubs.length, 98, "Locked five-league Showdown pool must contain 98 clubs.");
assert.equal(new Set(clubs).size, clubs.length, "Club database must not contain duplicate names.");
assert.deepEqual(clubs.filter(name => !identity.CLUB_IDENTITY_PALETTES[name]), [], "Every Showdown club needs an original identity palette.");
const crests = clubs.map(name => {
    const current = identity.getClubIdentity(name);
    assert.ok(current.primary && current.secondary && current.accent, `${name} identity is incomplete.`);
    assert.ok(current.crest.startsWith('url("data:image/svg+xml,'), `${name} crest must remain an inline original SVG.`);
    return current.crest;
});
assert.equal(new Set(crests).size, clubs.length, "Each Showdown club must render a distinct crest.");
assert.ok(!/<image\b/i.test(identitySource), "Custom crests must not embed external badge images.");
assert.ok(!/assets\/logos\//i.test(identitySource), "Official badge assets must not return.");
const timing = clubAssignment.match(/managerOne:\s*(\d+)[\s\S]*?managerTwo:\s*(\d+)[\s\S]*?versus:\s*(\d+)[\s\S]*?confirmation:\s*(\d+)/);
assert.ok(timing, "Club reveal timing contract is missing.");
const revealTimes = timing.slice(1).map(Number);
assert.ok(revealTimes[0] < revealTimes[1] && revealTimes[1] < revealTimes[2] && revealTimes[2] < revealTimes[3]);
assert.ok(revealTimes[3] <= 4500, "Club reveal must remain finite.");
assert.ok(clubAssignment.includes("isReducedClubMotionPreferred"), "Reduced-motion Club Reveal fast path is missing.");
assert.ok(clubAssignment.includes('currentShowdown.status = "Clubs Assigned"'));
assert.ok(clubAssignment.includes('currentShowdown.status = "Ready"'));
assert.ok(!clubAssignment.includes('createElement("style")'), "Club Assignment must not inject CSS from JavaScript.");

for(const file of fs.readdirSync(path.join(root, "css")).filter(file => file.endsWith(".css"))){
    const css = read(path.join("css", file));
    assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length, `${file} has unbalanced braces.`);
}

assert.ok(html.includes("family=Barlow+Condensed:wght@600;700;800&display=swap"));
assert.ok(appCss.includes('--f17-display:"Barlow Condensed"'));
assert.equal((html.match(/class="clubPackDoor"/g) || []).length, 2);
assert.ok(appCss.includes("--club-crest-image"));
assert.ok(appCss.includes("@media(prefers-reduced-motion:reduce)"));
assert.ok(appCss.includes("grid-template-rows:repeat(2,minmax(132px,1fr)) minmax(118px,auto);grid-auto-rows:auto"), "Desktop Home rows lost the accepted proportional layout.");
assert.ok(!appCss.includes("grid-auto-rows:108px"), "Fixed Home rows reintroduced the old overlap risk.");
assert.ok(appCss.includes(".menuMusicTile{grid-column:1/-1;grid-row:3;"), "Home media rail must remain below navigation.");
assert.ok(appCss.includes("@media(min-width:901px) and (max-height:800px)"));
assert.ok(appCss.includes("@media(max-width:700px)"));
assert.ok(appCss.includes("--safe-width:1510px"));
assert.ok(appCss.includes(".startupAthleteFrame") && appCss.includes(".startupIdentity"));
assert.ok(app.includes("STARTUP_SPLASH_MINIMUM_MS = 2700"), "Normal cinematic startup minimum must remain 2700 ms.");
assert.ok(app.includes("STARTUP_SPLASH_REDUCED_MS = 220"), "Reduced-motion startup minimum must remain 220 ms.");
assert.ok(app.includes("app.inert = true") && app.includes("app.inert = false"));

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual([...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))], [], "Duplicate HTML IDs returned.");
const requiredIds = [
    "mainMenu", "createShowdown", "leagueWheelScreen", "clubWheelScreen", "dashboard",
    "transferChallenge", "seasonEntry", "seasonSummary", "legacy", "newShowdown",
    "continueCareer", "legacyButton", "careerStatisticsButton", "ruleBookButton", "settingsButton",
    "startShowdown", "spinLeague", "openClubPack", "continueClubAssignment",
    "clubRivalryConfirmation", "seasonPrimaryAction", "completeTransferChallenge", "completeSeason"
];
assert.deepEqual(requiredIds.filter(id => !ids.includes(id)), [], "Critical shell ID missing.");

const refs = [...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)(?:\?v=([^"#]+))?"/g)]
    .map(match => ({ path: match[1], revision: match[2] || "" }));
assert.ok(refs.length, "No local startup refs were found.");
assert.deepEqual(refs.filter(ref => ref.revision !== revision), [], "The initial shell contains mixed or missing cache revisions.");
const styleRefs = refs.filter(ref => ref.path.startsWith("css/"));
const scriptRefs = refs.filter(ref => ref.path.startsWith("js/"));
assert.deepEqual(styleRefs.map(ref => ref.path), ["css/app.css"], "Startup must remain exactly one local stylesheet.");
assert.equal(scriptRefs.length, 7, "Startup must remain exactly seven local scripts.");
const eagerForbidden = new Set([
    "js/showdownUI.js", "js/visualIdentity.js", "js/leagueWheel.js", "js/clubAssignment.js",
    "js/transferChallenge.js", "js/seasonEngine.js", "js/analytics.js", "js/statistics.js",
    "js/trophyRoom.js", "js/settings.js", "js/backup.js", "js/importAnalysis.js", "js/storageTransaction.js",
    "js/restore.js", "js/restoreUI.js", "js/legacy.js", "data/leagues.js", "data/clubs.js"
]);
assert.deepEqual(refs.filter(ref => eagerForbidden.has(ref.path)), [], "A lazy module returned to the startup path.");

const maximumInitialAssetBytes = 165000;
const maximumCompressedInitialAssetBytes = 37500;
const codeBytes = refs.reduce((total, ref) => {
    assert.ok(exists(ref.path), `Startup asset is missing: ${ref.path}`);
    return total + fs.statSync(path.join(root, ref.path)).size;
}, 0);
const gzipBytes = refs.reduce((total, ref) => total + zlib.gzipSync(fs.readFileSync(path.join(root, ref.path)), { level: 9 }).length, 0);
assert.ok(codeBytes <= maximumInitialAssetBytes, `Startup budget exceeded: ${codeBytes} > ${maximumInitialAssetBytes}.`);
assert.ok(gzipBytes <= maximumCompressedInitialAssetBytes, `Compressed startup budget exceeded: ${gzipBytes} > ${maximumCompressedInitialAssetBytes}.`);
const portraitMatch = html.match(/id="startupAthlete"[^>]+src="(assets\/[^"?]+)\?v=([^"]+)"/i);
assert.ok(portraitMatch, "Startup Marco Reus portrait must remain a versioned local asset.");
assert.equal(portraitMatch[2], revision);
const portraitBytes = fs.statSync(path.join(root, portraitMatch[1])).size;
assert.ok(portraitBytes <= 95000, "Startup portrait exceeds 95 KB.");
assert.ok(codeBytes + portraitBytes <= 260000, "Combined first-party startup payload exceeds 260 KB.");

assert.ok(!/\bdata-back=/.test(html), "Legacy data-back navigation returned.");
assert.ok(/\bdata-smart-back\b/.test(html), "Smart Back controls are missing.");
assert.ok(screens.includes("const SAFE_BACK_TARGETS"));
assert.ok(screens.includes("smartBackDelegationBound") && screens.includes("stopImmediatePropagation"));
const routeLeaks = fs.readdirSync(path.join(root, "js"))
    .filter(file => file.endsWith(".js") && file !== "screens.js")
    .filter(file => /\bscreenHistory\b/.test(read(path.join("js", file))));
assert.deepEqual(routeLeaks, [], `Route history leaked outside screens.js: ${routeLeaks.join(", ")}`);
const storageLeaks = fs.readdirSync(path.join(root, "js"))
    .filter(file => file.endsWith(".js") && !["storage.js", "diagnostics.js"].includes(file))
    .filter(file => /\blocalStorage\b/.test(read(path.join("js", file))));
assert.deepEqual(storageLeaks, [], `Direct localStorage access leaked outside storage authority: ${storageLeaks.join(", ")}`);

const namedFunctions = new Map();
const combinedRuntime = [];
for(const file of fs.readdirSync(path.join(root, "js")).filter(file => file.endsWith(".js")).sort()){
    const source = read(path.join("js", file));
    combinedRuntime.push(`\n/* ${file} */\n${source}`);
    for(const match of source.matchAll(/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)){
        const locations = namedFunctions.get(match[1]) || [];
        locations.push(file);
        namedFunctions.set(match[1], locations);
    }
}
assert.doesNotThrow(() => new vm.Script(combinedRuntime.join("\n"), { filename: "combined-runtime.js" }), "Combined classic-script runtime has a syntax/top-level collision.");
assert.deepEqual(
    [...namedFunctions].filter(([, locations]) => locations.length > 1).map(([name, locations]) => `${name}: ${locations.join(", ")}`),
    [],
    "Cross-module global function collisions returned."
);

assert.ok(!optional.includes("trophyRoomButton"), "Removed Home Trophy Room fallback returned to the optional loader.");
assert.ok(!trophyRoom.includes("initializeTrophyRoom") && !statistics.includes("initializeStatistics") && !ruleBook.includes("initializeRuleBook"), "Dead direct-binding optional initializers returned.");
assert.ok(!ruleBook.includes("back.addEventListener"), "Rule Book Back must remain under centralized Smart Back authority.");
assert.ok(showdownUI.includes("VIEW FINAL SEASON SUMMARY"), "Completed-showdown recovery action is missing.");
assert.ok(showdownUI.includes("Active save retained · Legacy sync pending"), "Legacy sync failure state is not surfaced accurately.");
assert.ok(showdownUI.includes('completedSeasonCount === 1 ? "season" : "seasons"'), "Completed Showdown Home singular/plural grammar regressed.");
for(const dead of ["data/rules.js", "js/router.js", "js/scoreboard.js", "js/ui.js", "js/wheels.js"]){
    assert.equal(exists(dead), false, `Dead prototype architecture returned: ${dead}`);
}
assert.ok(optional.includes('"restore-transaction","js/storageTransaction.js"'), "Candidate C transaction engine must remain lazy-loaded through Legacy.");
assert.ok(optional.includes('"restore-engine"') && optional.includes('"js/restore.js"'), "Candidate C restore planner must remain lazy-loaded through Legacy.");
assert.ok(optional.includes('"restore-ui"') && optional.includes('"js/restoreUI.js"'), "Candidate C restore UI must remain lazy-loaded through Legacy.");
assert.ok(optional.includes('loadRuntimeStyle("restore-ui", "css/restore.css")'), "Candidate C restore CSS must remain lazy-loaded with Data Management.");

process.stdout.write(
    `PASS  Dynamic static release contracts v${appVersion} / ${revision}: scoring, navigation, 98-club identity, startup shape, budgets ${codeBytes}/${gzipBytes}, route/storage authority, completed-showdown recovery, Candidate C lazy loading and historical release protection.\n`
);
