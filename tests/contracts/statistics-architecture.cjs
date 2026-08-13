const fs = require('node:fs');
const assert = require('node:assert');

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');
const optional = fs.readFileSync('js/optionalModules.js', 'utf8');
const screens = fs.readFileSync('js/screens.js', 'utf8');
const statistics = fs.readFileSync('js/statistics.js', 'utf8');
const trophy = fs.readFileSync('js/trophyRoom.js', 'utf8');
const diagnostics = fs.readFileSync('js/diagnostics.js', 'utf8');

assert.ok(html.includes('id="careerStatisticsButton"'), 'Home Statistics tile is missing.');
assert.ok(html.includes('<span class="menuTileLabel">STATISTICS</span>'), 'Home tile is not labelled Statistics.');
assert.ok(!html.includes('id="trophyRoomButton"'), 'Trophy Room must not remain a competing top-level Home tile.');
const appVersion = (app.match(/const APP_VERSION = "([^"]+)"/) || [])[1];
const revision = (html.match(/<meta\s+name="app-asset-revision"\s+content="([^"]+)"/i) || [])[1] || '';
assert.ok(appVersion, 'APP_VERSION is missing.');
assert.match(revision, new RegExp(`^${appVersion.replace(/\./g, '\\.')}\\-r[1-9]\\d*$`), 'Statistics shell cache identity must be a numbered runtime revision for APP_VERSION.');

const localRefs = [...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)/g)].map(match => match[1]);
const initialJs = localRefs.filter(ref => ref.startsWith('js/'));
const initialCss = localRefs.filter(ref => ref.startsWith('css/'));
assert.strictEqual(initialJs.length, 7, 'Statistics alignment must not add startup JavaScript.');
assert.deepStrictEqual(initialCss, ['css/app.css'], 'Statistics alignment must not add startup CSS.');
['js/analytics.js', 'js/statistics.js', 'js/trophyRoom.js', 'css/analytics.css'].forEach(asset => {
  assert.ok(!localRefs.includes(asset), `${asset} must remain lazy.`);
});

assert.ok(optional.includes('document.getElementById("careerStatisticsButton"), "careerStatistics", "careerStatisticsBound"'), 'Home Statistics tile is not owned by the optional-module loader.');
assert.ok(optional.includes('window.openCareerStatistics()'), 'Career Statistics open path is missing.');
assert.ok(optional.includes('window.openTrophyRoom()'), 'Trophy Room destination was lost.');
const statisticsLoader = optional.slice(
  optional.indexOf('async function ensureStatisticsModule'),
  optional.indexOf('async function ensureTrophyRoomModule')
);
assert.ok(statisticsLoader && !statisticsLoader.includes('ensureGameplayModules'), 'Career Statistics must not wake the full gameplay runtime.');

assert.ok(statistics.includes('section.id = "careerStatistics"'), 'Career Statistics screen is missing.');
assert.ok(statistics.includes('buildCareerAnalytics()'), 'Career Statistics must reuse the established analytics engine.');
assert.ok(statistics.includes('createCareerStandingsTable'), 'Career Statistics career table is missing.');
assert.ok(statistics.includes('MANAGER COMPARISON'), 'Career manager comparison is missing.');
assert.ok(statistics.includes('CAREER LEADERS'), 'Career leader summary is missing.');
assert.ok(statistics.includes('CURRENT RIVALRY STATISTICS'), 'Current-rivalry bridge is missing.');
assert.ok(statistics.includes('OPEN TROPHY ROOM'), 'Trophy Room bridge is missing.');
assert.ok(statistics.includes('window.openCareerStatistics = openCareerStatistics'), 'Career Statistics API export is missing.');
assert.ok(statistics.includes('window.openRivalryStatistics = openRivalryStatistics'), 'Existing Rivalry Statistics API was lost.');

assert.ok(trophy.includes('createCareerStandingsTable(analytics.managers)'), 'Trophy Room must reuse the shared career-table renderer.');
assert.ok(!trophy.includes('function createCareerStandingsTable('), 'Trophy Room must not duplicate the career-table renderer.');
assert.ok(trophy.includes('MANAGER CABINETS'), 'Trophy Room cabinets were lost.');
assert.ok(trophy.includes('ALL-TIME RECORDS'), 'Trophy Room records were lost.');

assert.ok(screens.includes('"careerStatistics"'), 'Career Statistics is not registered with central navigation.');
assert.ok(screens.includes('careerStatistics: ["mainMenu"]'), 'Career Statistics Back policy must return to Home.');
assert.ok(screens.includes('trophyRoom: ["dashboard", "careerStatistics", "mainMenu"]'), 'Trophy Room contextual Back policy is missing.');
const gameplaySet = screens.slice(screens.indexOf('const GAMEPLAY_SCREENS'), screens.indexOf('const SAFE_BACK_TARGETS'));
assert.ok(!gameplaySet.includes('"statistics"'), 'Read-only analytics screens must not be classified as gameplay-runtime routes.');
assert.ok(!gameplaySet.includes('"careerStatistics"'), 'Career Statistics must remain a lightweight non-gameplay route.');

assert.ok(diagnostics.includes('"careerStatisticsButton"'), 'Runtime diagnostics do not verify the Home Statistics entry.');
assert.ok(diagnostics.includes('["careerStatisticsButton", "careerStatisticsBound"]'), 'Runtime diagnostics do not verify Statistics binding.');

const analyticsNamedFiles = fs.readdirSync('js').filter(file => /analytics/i.test(file)).sort();
assert.deepStrictEqual(analyticsNamedFiles, ['analytics.js'], 'Workstream 4 must not create a second analytics engine.');

console.log(`Main Menu Statistics alignment, lazy loading, shared analytics, Trophy Room reuse, route contracts, and ${revision} shell identity passed.`);
