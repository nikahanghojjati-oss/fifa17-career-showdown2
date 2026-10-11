// JOB-1648: report-only inventory. No CSS source is changed or removed by the audit.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { resolveChromiumRuntime } = require('../tests/support/chromium-runtime.cjs');
const F = require('../tests/support/active-showdown-fixtures.cjs');
const Career = require('../js/sharedCareerAnalytics.js');
const Active = require('../js/sharedActiveShowdownAdapter.js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportPath = path.join(root, 'project-documents/gameplay-factory/reports/OLD_CSS_LIVENESS.md');
const files = ['app.css', 'analytics.css', 'legacy.css', 'rulebook.css', 'settings.css', 'season.css',
    'transfer.css', 'restore.css', 'offline.css', 'saveLibrary.css', 'remoteJoining.css',
    ...fs.readdirSync(path.join(root, 'css')).filter(file => /^footballVisuals.*\.css$/.test(file)).sort(), 'visual-fidelity-r3.css'];
const css = files.map(file => ({ file, source: fs.readFileSync(path.join(root, 'css', file), 'utf8') }));
const viewports = [{ width: 393, height: 660 }, { width: 1280, height: 800 }];
const requiredScreens = ['mainMenu', 'createShowdown', 'leagueWheelScreen', 'clubWheelScreen', 'dashboard',
    'transferChallenge', 'seasonEntry', 'seasonSummary', 'statistics', 'careerStatistics', 'trophyRoom', 'legacy', 'ruleBook', 'standings'];
const p = F.projection({ totalSeasons: 3, seasons: [[F.result({ leaguePosition: 1, championsLeague: true }), F.result()]] });
const completed = F.projection({ totalSeasons: 1, seasons: [[F.result({ leaguePosition: 1, championsLeague: true }), F.result()]] });
const fixture = { identity: F.identity(), pair: F.pair(p.rivalryId), multi: F.multiFor(p), history: F.history(p),
    career: Career.buildCareerModel({ indexStatus: 'ready', showdowns: [{ rivalryId: completed.rivalryId,
        classification: 'completed', projection: completed, final: F.finalFor(completed) }] }),
    rivalry: Active.rivalryView({ identity: F.identity(), pair: F.pair(p.rivalryId),
        multiSeason: F.multiFor(p), history: F.history(p) }),
    completed: { multi: F.multiFor(completed), history: F.history(completed), final: F.finalReconciliation(completed), closed: F.closed(completed) },
    results: F.seasonResults({ rivalryId: p.rivalryId, seasonNumber: 2, phase: 'RESULTS_READY',
        published: ['playerOne', 'playerTwo'], own: F.result({ leaguePosition: 1 }), opponent: F.result() }) };
let server, browser;
const base = new URL(process.env.CMS_BASE_URL || 'http://127.0.0.1:4184/');
const observations = [];
const pageErrors = [], failedRequests = new Set();

// CSSOM parses comments, nested @media/@supports and declaration strings correctly. Walk style rules
// only: @keyframes steps and @font-face descriptors are not DOM selectors. Keep conditional rules even
// outside their media range: this is markup liveness, not cascade/declaration coverage.
async function inventory(page) {
    return page.evaluate(sources => {
        function split(text) {
            const out = []; let start = 0, depth = 0, quote = '', escaped = false;
            for (let i = 0; i < text.length; i++) {
                const c = text[i];
                if (escaped) { escaped = false; continue; }
                if (c === '\\') { escaped = true; continue; }
                if (quote) { if (c === quote) quote = ''; continue; }
                if (c === '"' || c === "'") { quote = c; continue; }
                if (c === '(' || c === '[') depth++;
                if (c === ')' || c === ']') depth--;
                if (c === ',' && depth === 0) { out.push(text.slice(start, i).trim()); start = i + 1; }
            }
            out.push(text.slice(start).trim()); return out.filter(Boolean);
        }
        return sources.map(({ file, source }) => {
            const sheet = new CSSStyleSheet(); sheet.replaceSync(source);
            const selectors = new Set(); let occurrences = 0, keyframes = 0;
            function walk(rules) {
                for (const rule of rules) {
                    if (rule.type === CSSRule.KEYFRAMES_RULE) { keyframes++; continue; }
                    if (rule.type === CSSRule.STYLE_RULE) {
                        const parts = split(rule.selectorText); occurrences += parts.length;
                        for (const selector of parts) selectors.add(selector);
                    }
                    if (rule.cssRules) walk(rule.cssRules);
                }
            }
            walk(sheet.cssRules);
            return { file, selectors: [...selectors], occurrences, keyframes };
        });
    }, css);
}

async function sample(page, sheets, screen, hosts, viewport) {
    const result = await page.evaluate(({ sheets, hosts }) => {
        const roots = hosts.map(id => document.getElementById(id)).filter(Boolean);
        const chrome = [document.documentElement, document.body, document.getElementById('app'),
            document.querySelector('#app main'), document.getElementById('topHeader'), document.querySelector('#app > footer')].filter(Boolean);
        const onScreen = node => roots.some(host => host === node || host.contains(node)) ||
            chrome.some(host => host === node || (host.id === 'topHeader' || host.tagName === 'FOOTER') && host.contains(node)) ||
            Boolean(node.closest('#appRuntimeNotice,.sd-nav-top,.sd-nav-bottom'));
        // querySelector cannot return pseudo-elements. Count their originating elements; keep the
        // original selector in the report. Strip only pseudo-elements, never :not/:is list contents.
        const origin = selector => selector.replace(/::[\w-]+(?:\([^)]*\))?|:(?:before|after|first-letter|first-line)\b/g, '');
        return sheets.map(({ file, selectors }) => {
            const live = [], hidden = [], errors = [];
            for (const selector of selectors) {
                try {
                    const nodes = [...document.querySelectorAll(origin(selector) || '*')];
                    if (nodes.some(onScreen)) live.push(selector);
                    else if (nodes.length) hidden.push(selector);
                } catch (error) { errors.push({ selector, message: error.message }); }
            }
            return { file, live, hidden, errors };
        });
    }, { sheets, hosts });
    observations.push({ screen, viewport: `${viewport.width}x${viewport.height}`, hosts, result });
    console.log(`VISITED ${viewport.width}x${viewport.height} ${screen}`);
}

async function settle(page, host, mounted = false) {
    await page.locator(`#${host}`).waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForFunction(({ host, mounted }) => {
        const el = document.getElementById(host);
        return el && !el.hasAttribute('data-v10-pending') && (!mounted || window.CareerModeV10Screens?.isMounted(host));
    }, { host, mounted }, { timeout: 15000 });
    await page.waitForTimeout(250);
}

async function installFixture(page) {
    await page.evaluate(async data => {
        await ensureGameplayModules();
        window.__oldCssFixture = data;
        const getter = (name, value) => { window[name] = { ...window[name], getState: () => value }; };
        getter('CareerModeOnlinePlayerIdentity', data.identity);
        getter('CareerModePersistentNikDanielPair', data.pair);
        getter('CareerModeProductionSharedMultiSeasonProgression', data.multi);
        getter('CareerModeProductionSharedHistoryConvergence', data.history);
        getter('CareerModeProductionSharedFinalReconciliation', null);
        getter('CareerModeProductionSharedTerminalClose', null);
        currentShowdown = { id: 'old_css_audit', name: 'Daniel vs Nik', currentRound: 2, totalRounds: 3, status: 'Ready',
            managers: { playerOne: 'Daniel', playerTwo: 'Nik' }, selectedLeague: { id: 'premier_league', name: 'Premier League' },
            clubs: { playerOne: 'Arsenal', playerTwo: 'Liverpool' }, rounds: [], transferChallenges: [],
            score: { playerOne: 8, playerTwo: 0 }, sharedJourney: { mode: 'shared', rivalryId: data.pair.rivalryId } };
        const setup = { ready: true, status: 'ready', revision: 6, rivalryId: data.pair.rivalryId,
            sessionId: 'session_' + 'c'.repeat(64), deviceId: data.identity.deviceId, managerRole: 'playerOne',
            setup: { phase: 'SHOWDOWN_CONFIRMED', revision: 6, coordinatorRole: 'playerOne', leagueId: 'premier_league',
                totalSeasons: 3, clubs: { playerOne: 'Arsenal', playerTwo: 'Liverpool' } } };
        window.CareerModeProductionSharedShowdownSetup = { getState: () => setup, refresh: async () => setup };
        window.__oldCssTransfer = { ok: true, rivalryId: data.pair.rivalryId, seasonNumber: 2, managerRole: 'playerOne',
            setup: setup.setup, state: { phase: 'COMPLETED', revision: 7, guessLockedRoles: ['playerOne', 'playerTwo'], signingLockedRoles: ['playerOne', 'playerTwo'] } };
        window.CareerModeProductionSharedTransferChallenge = { getState: () => window.__oldCssTransfer,
            refresh: async () => window.__oldCssTransfer, isActive: () => true, canRoute: () => true, install: () => true };
        window.CareerModeSparkSharedSeasonResults = { read: async () => data.results,
            publishResult: async () => { throw new Error('Liveness audit must never publish'); } };
        window.CareerModeProductionFirebaseRuntime = { ensureAccountServices: async () => ({ ok: true,
            auth: { currentUser: { uid: 'acct_daniel' } }, firestore: {}, firestoreSdk: {} }) };
    }, fixture);
}

async function tour(page, sheets, viewport) {
    await page.goto(base.href, { waitUntil: 'domcontentloaded' });
    await page.locator('#loadingScreen').waitFor({ state: 'visible' });
    await sample(page, sheets, 'loadingScreen', ['loadingScreen'], viewport);
    await page.locator('#loadingScreen').waitFor({ state: 'hidden', timeout: 15000 });
    await page.waitForFunction(() => window.CareerModeSeasonFinalV10 && window.CareerModeV10Setup &&
        window.CareerModeClubScreenV10 && window.CareerModeTransferScreenV10 && window.CareerModeProductionSharedTerminalClose);
    await settle(page, 'mainMenu', true);
    await sample(page, sheets, 'mainMenu-empty', ['mainMenu'], viewport);
    // Native signed-out connection dialog, before injecting provider snapshots.
    await page.evaluate(async () => {
        await loadRuntimeScript('old-css-connect', 'js/connectPlayersScreenV10.js', () => window.CareerModeConnectPlayersScreenV10);
        await CareerModeConnectPlayersScreenV10.open({ sync: false });
    });
    await settle(page, 'connectPlayersScreen');
    await sample(page, sheets, 'connectPlayersScreen', ['mainMenu', 'connectPlayersScreen'], viewport);
    await page.evaluate(() => CareerModeConnectPlayersScreenV10.close());
    await installFixture(page);
    const navigate = async host => {
        assert.equal(await page.evaluate(host => navigateTo(host, { allowCanonicalFallback: false }), host), true, `${host} route rejected`);
        await settle(page, host);
        await sample(page, sheets, host, [host], viewport);
    };
    await navigate('mainMenu');
    await navigate('createShowdown');
    await page.evaluate(() => { currentShowdown.selectedLeague = null; currentShowdown.clubs = { playerOne: null, playerTwo: null }; });
    await navigate('leagueWheelScreen');
    await page.evaluate(() => { currentShowdown.selectedLeague = { id: 'premier_league', name: 'Premier League' }; currentShowdown.status = 'League Confirmed'; });
    await navigate('clubWheelScreen');
    await page.evaluate(() => { currentShowdown.clubs = { playerOne: 'Arsenal', playerTwo: 'Liverpool' }; currentShowdown.status = 'Ready'; });
    await navigate('dashboard');
    for (const phase of ['WINDOW_OPEN', 'GUESS_ENTRY', 'SIGNING_ENTRY', 'COMPLETED']) {
        await page.evaluate(phase => {
            window.__oldCssTransfer.state.phase = phase;
            const host = document.getElementById('transferChallenge');
            host.dataset.transferPhase = { WINDOW_OPEN: 'window', GUESS_ENTRY: 'guess_entry', SIGNING_ENTRY: 'signing_entry', COMPLETED: 'completed' }[phase];
            CareerModeV10Screens.invalidate('transferChallenge');
        }, phase);
        assert.equal(await page.evaluate(() => navigateTo('transferChallenge', { allowCanonicalFallback: false })), true);
        await page.evaluate(() => CareerModeV10Screens.show('transferChallenge'));
        await settle(page, 'transferChallenge', true);
        await sample(page, sheets, `transferChallenge-${phase}`, ['transferChallenge'], viewport);
    }
    assert.equal(await page.evaluate(() => CareerModeProductionSharedSeasonResults.open()), true, 'Results fixture route rejected');
    await page.evaluate(() => CareerModeV10Screens.show('seasonEntry'));
    await settle(page, 'seasonEntry', true);
    await sample(page, sheets, 'seasonEntry', ['seasonEntry'], viewport);
    // Completed fixture uses the real Final Winner mount within seasonEntry (not a separate route).
    await page.evaluate(() => {
        const end = __oldCssFixture.completed;
        for (const [name, value] of [['CareerModeProductionSharedMultiSeasonProgression', end.multi],
            ['CareerModeProductionSharedHistoryConvergence', end.history], ['CareerModeProductionSharedFinalReconciliation', end.final],
            ['CareerModeProductionSharedTerminalClose', end.closed]]) window[name] = { ...window[name], getState: () => value };
        CareerModeV10Screens.invalidate('seasonEntry');
    });
    await page.evaluate(() => CareerModeV10Screens.show('seasonEntry'));
    await page.locator('.v10FinalStage').waitFor({ state: 'visible', timeout: 15000 });
    await sample(page, sheets, 'finalWinner', ['seasonEntry'], viewport);
    await installFixture(page);
    await page.evaluate(() => {
        const record = { roundNumber: 1, winner: 'playerOne', playerOne: { leaguePosition: 1, leaguePoints: 90, leagueGoals: 80,
            trophies: { domesticCup: false, championsLeague: true }, awards: { topScorer: false, topAssist: false },
            scoring: { championsLeague: 5, leagueTitle: 3, domesticCup: 0, performanceBonus: 0, individualAwardsBonus: 0, total: 8 } },
            playerTwo: { leaguePosition: 5, leaguePoints: 60, leagueGoals: 55, trophies: {}, awards: {}, scoring: { total: 0 } } };
        currentShowdown.rounds = [record]; renderSeasonSummary(record);
    });
    await navigate('seasonSummary');
    for (const name of ['statistics', 'careerStatistics', 'trophyRoom', 'legacy', 'ruleBook']) {
        await page.evaluate(() => navigateTo('mainMenu'));
        assert.equal(await page.evaluate(name => openOptionalModule(name), name), true, `${name} failed to open`);
        await settle(page, name, true);
        await sample(page, sheets, name, [name], viewport);
        if (['statistics', 'careerStatistics', 'trophyRoom', 'legacy'].includes(name)) {
            await page.evaluate(async name => {
                const data = __oldCssFixture;
                if (name === 'statistics' || name === 'legacy') {
                    await CareerModeRivalryLegacyV10.mount(name === 'statistics' ? 'rivalryStatistics' : 'legacy',
                        () => name === 'statistics' ? data.rivalry : data.career);
                } else {
                    careerStatisticsModel = data.career;
                    await CareerModeCareerScreensV10.mount(name, () => data.career);
                }
            }, name);
            await settle(page, name, true);
            await sample(page, sheets, `${name}-ready`, [name], viewport);
        }
    }
    await page.evaluate(() => CareerModeV10Screens.navigate('standings'));
    await settle(page, 'standings', true);
    await sample(page, sheets, 'standings', ['standings'], viewport);
    await page.evaluate(() => navigateTo('mainMenu'));
    await page.evaluate(() => document.getElementById('settingsButton').click());
    await settle(page, 'settingsOverlay', true);
    await page.waitForFunction(() => document.getElementById('saveLibraryProductPanel'));
    await sample(page, sheets, 'settingsOverlay', ['mainMenu', 'settingsOverlay'], viewport);
    await page.evaluate(() => closeSettings());
    // Live Legacy's explicit data-management mode retains the restore and maintenance UI.
    await page.evaluate(async () => {
        window.careerModeLegacyDataTools = true;
        await CareerModeRivalryLegacyV10.mount('legacy', () => null);
        await openOptionalModule('legacy');
    });
    await settle(page, 'legacy');
    await page.waitForFunction(() => document.getElementById('careerModeRestorePanel'));
    await sample(page, sheets, 'legacy-data-tools', ['legacy'], viewport);
    await page.evaluate(async () => {
        await loadRuntimeStyle('rj', 'css/remoteJoining.css');
        await loadRuntimeScript('rj', 'js/sparkRemoteJoining.js', () => window.CareerModeSparkRemoteJoining);
        CareerModeSparkRemoteJoining.openPanel();
    });
    await settle(page, 'sparkRemoteJoiningOverlay');
    await sample(page, sheets, 'remoteJoiningOverlay', ['legacy', 'sparkRemoteJoiningOverlay'], viewport);
    const seen = observations.filter(row => row.viewport === `${viewport.width}x${viewport.height}`).map(row => row.screen);
    for (const screen of requiredScreens) assert(seen.some(name => name === screen || name.startsWith(screen + '-')), `Missing ${screen}`);
}

function renderReport(sheets) {
    const code = text => '`' + text.replaceAll('`', '&#96;') + '`';
    const direct = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const optional = fs.readFileSync(path.join(root, 'js/optionalModules.js'), 'utf8');
    const jsFiles = fs.readdirSync(path.join(root, 'js')).filter(file => file.endsWith('.js'));
    const sources = jsFiles.map(file => ({ file, text: fs.readFileSync(path.join(root, 'js', file), 'utf8') }));
    const totals = sheets.map(sheet => {
        const rows = observations.flatMap(row => row.result.filter(result => result.file === sheet.file));
        const live = new Set(rows.flatMap(row => row.live));
        const hidden = new Set(rows.flatMap(row => row.hidden).filter(selector => !live.has(selector)));
        const errors = new Set(rows.flatMap(row => row.errors.map(error => error.selector)));
        return { ...sheet, live, hidden, errors, verdict: live.size === 0 ? 'DEAD' : live.size === sheet.selectors.length ? 'LIVE' : 'PARTLY LIVE' };
    });
    assert(totals.every(sheet => sheet.errors.size === 0), 'Unqueryable selector: do not silently call it dead');
    const lines = ['# Old CSS liveness · JOB-1648', '',
        `Audited source checkout: ${code(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim())}.`, '',
        'Regenerate: `node scripts/old-css-liveness.mjs`. The script starts the existing static-site server automatically; `CMS_BASE_URL` can select an already served copy of the same checkout. This project ships index.html and runtime files directly; there is no build step.', '',
        `Headless Chromium ${browser.version()}; viewports **393×660** and **1280×800**. ${observations.length} screen/state observations; no skipped routes.`, '',
        '## Method and limits', '',
        '- Counts are unique, comma-separated selector branches per sheet; duplicate appearances across conditional blocks count once. All branches are inventoried below, including nonmatching branches. Keyframe steps and font-face descriptors are not DOM selectors.',
        '- CSSOM parses each source in a detached stylesheet, recursively including @media and @supports. Sheets are never force-loaded into the app for measurement. Conditional rules are included regardless of whether the condition currently applies.',
        '- A live match belongs to the active screen/overlay subtree or shared page chrome. Hidden descendants of that active subtree count conservatively (they can be revealed by UI controls); hidden *other* screens do not count. The hidden-only inventory separately lists selectors that match elsewhere in the document but never in an active surface.',
        '- Pseudo-elements are tested against their originating elements, with the original selector preserved. Interaction pseudo-classes such as :hover, :active and :focus remain intact; only naturally occurring focus/hover states are measured. Nonmatches are observations, not universal proof of deletion safety.',
        '- Matching markup does not prove that a declaration wins the cascade, paints visible pixels, or that its sheet was enabled. DEAD means zero active-surface matches in this tour, not authorization to archive a sheet. Media, account/error/recovery states and interaction states beyond this matrix still need targeted review before removal.',
        '- Gameplay uses tests/support/active-showdown-fixtures.cjs for paired identity, active history/progression, results, final reconciliation and CLOSED terminal witness. Provider responses are in-memory fixtures; no remote write, sign-in, audio play or reconciliation Apply is performed. Transfer samples supply each phase to the production view getter and phase attribute used by the real V10 mount. Season Results opens through its real production adapter with fixture reads. Season Summary uses its real renderer with a local round record. Rivalry, Career Statistics, Trophy Room and Legacy are sampled both before and after supplying populated fixture models through their existing V10 mount APIs; Standings receives that same career model.', '',
        '## Startup and loader inventory', '',
        'F10 in `tests/contracts/v10-foundation-contracts.cjs` pins `index.html` byte-for-byte to **r70 (1.9.1-r70)** and caps startup gzip at **37495 bytes**. These guards are unchanged.', '',
        '`index.html` loads `css/app.css` directly, plus the external Google Fonts Barlow Condensed sheet. The other audited sheets are runtime-loaded. `loadRuntimeStyle` is defined by optionalModules.js, but not every call originates there:', '',
        '| Sheet | Direct index.html | Loaded by optionalModules.js | Other source references (including comments/guards) |',
        '| --- | --- | --- | --- |'];
    for (const sheet of sheets) {
        const ref = 'css/' + sheet.file;
        const others = sources.filter(source => source.file !== 'optionalModules.js' && source.text.includes(ref)).map(source => code('js/' + source.file));
        lines.push(`| ${code(ref)} | ${direct.includes(ref) ? 'yes' : 'no'} | ${optional.includes(ref) ? 'yes' : 'no'} | ${others.join(', ') || '—'} |`);
    }
    lines.push('', '`offline.css` is loaded by offlineApp.js; `saveLibrary.css` by saveLibraryCutover.js; `remoteJoining.css` by its remote/acceptance loaders; `visual-fidelity-r3.css` by app.js. Their loader provenance must not be mistaken for direct index.html loading.', '',
        '## Coverage', '', '| Screen/state | 393×660 | 1280×800 |', '| --- | --- | --- |');
    for (const screen of [...new Set(observations.map(row => row.screen))]) lines.push(`| ${code(screen)} | ${viewports.map(vp => observations.some(row => row.screen === screen && row.viewport === `${vp.width}x${vp.height}`) ? 'visited' : 'MISSING').join(' | ')} |`);
    lines.push('', 'Final Winner is mounted within seasonEntry; Rivalry is the statistics route. Settings and Connect Players are overlays. Standings is registered dynamically. Legacy data tools and Remote Joining are supplemental surfaces, not extra canonical routes.', '',
        '## Per-sheet totals', '', '| Sheet | Unique selectors | Branch occurrences | Active matches | Hidden-only matches | Verdict |', '| --- | ---: | ---: | ---: | ---: | --- |');
    for (const sheet of totals) lines.push(`| ${code(sheet.file)} | ${sheet.selectors.length} | ${sheet.occurrences} | ${sheet.live.size} | ${sheet.hidden.size} | **${sheet.verdict}** |`);
    for (const sheet of totals) {
        lines.push('', `## ${sheet.file}`, '', `**${sheet.verdict}** — ${sheet.live.size}/${sheet.selectors.length} unique selectors matched active markup; ${sheet.occurrences} branch occurrences; ${sheet.keyframes} excluded keyframe blocks.`, '', '### Matching selectors, grouped by screen/state', '');
        for (const screen of [...new Set(observations.map(row => row.screen))]) {
            const rows = observations.filter(row => row.screen === screen);
            const matches = [...new Set(rows.flatMap(row => row.result.find(result => result.file === sheet.file).live))];
            if (!matches.length) continue;
            lines.push(`#### ${screen}`, '', '| Selector | Matching viewport(s) |', '| --- | --- |');
            for (const selector of matches) {
                const vps = rows.filter(row => row.result.find(result => result.file === sheet.file).live.includes(selector)).map(row => row.viewport);
                lines.push(`| ${code(selector).replaceAll('|', '&#124;')} | ${vps.join(', ')} |`);
            }
            lines.push('');
        }
        if (!sheet.live.size) lines.push('None.', '');
        for (const [heading, selectors] of [['Hidden-document-only selectors (never an active match)', [...sheet.hidden]],
            ['Selectors with no match anywhere in the sampled document', sheet.selectors.filter(selector => !sheet.live.has(selector) && !sheet.hidden.has(selector))]]) {
            lines.push(`### ${heading}`, '');
            if (!selectors.length) lines.push('None.');
            else for (const selector of selectors) lines.push('- ' + code(selector));
            lines.push('');
        }
    }
    lines.push('## Resource observations', '', `First-party failed HTTP responses: ${failedRequests.size ? [...failedRequests].join(', ') : 'none'}. Page errors: ${pageErrors.length}. External hosts were blocked by the audit to keep fixture execution local; external font availability is not CSS-selector evidence.`, '');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, lines.join('\n'));
    console.log(`OLD CSS LIVENESS: PASS (${sheets.length} sheets, ${observations.length} observations, ${totals.reduce((n, sheet) => n + sheet.live.size, 0)}/${totals.reduce((n, sheet) => n + sheet.selectors.length, 0)} active selectors)`);
    console.log('Report: ' + path.relative(root, reportPath));
}

try {
    if (!process.env.CMS_BASE_URL) {
        server = spawn(process.execPath, ['tests/support/static-server.cjs'], { cwd: root,
            env: { ...process.env, CMS_TEST_PORT: String(base.port) }, stdio: ['ignore', 'ignore', 'pipe'] });
        let ready = false;
        for (let i = 0; i < 50; i++) {
            if (server.exitCode !== null) throw new Error('Audit static server exited');
            try { const response = await fetch(base); if (response.ok) { ready = true; break; } } catch {}
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        assert(ready, 'Static server did not become ready');
    }
    process.env.CMS_CHROMIUM_MULTI_CONTEXT = '1';
    const runtime = await resolveChromiumRuntime();
    browser = await chromium.launch({ headless: true, executablePath: runtime.executablePath, args: runtime.args });
    const inventoryPage = await browser.newPage();
    const sheets = await inventory(inventoryPage);
    await inventoryPage.close();
    for (const viewport of viewports) {
        const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
        await context.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
        const page = await context.newPage();
        page.on('pageerror', error => pageErrors.push(`${viewport.width}x${viewport.height}: ${error.message}`));
        page.on('response', response => { if (response.url().startsWith(base.origin) && response.status() >= 400) failedRequests.add(new URL(response.url()).pathname); });
        await tour(page, sheets, viewport);
        await context.close();
    }
    assert.deepEqual(pageErrors, [], 'Page errors invalidate the tour');
    assert.equal(failedRequests.size, 0, 'Missing first-party resources invalidate the tour');
    renderReport(sheets);
} finally {
    if (browser) await browser.close();
    if (server) server.kill('SIGTERM');
}
