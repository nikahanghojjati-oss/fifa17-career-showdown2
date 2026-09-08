const A = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const html = read('index.html');
const app = read('js/app.js');
const optional = read('js/optionalModules.js');
const offlineApp = read('js/offlineApp.js');
const worker = read('service-worker.js');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const guards = JSON.parse(read('CURRENT_PRODUCT_GUARDS.json'));

const version = (app.match(/const APP_VERSION = "([^"]+)"/) || [])[1];
const revision = (html.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
const footer = (html.match(/<footer>[\s\S]*?v([^<\s]+)\s*·\s*(?:Stable|Product Deepening|Private Connected Account Foundation|Registered Devices & Private Pairing|Connected Rivalry|Private Remote Joining)/i) || [])[1];
const gen = Number((revision.match(/-r(\d+)$/) || [])[1]);

A.equal(guards.provider.billingEnabled, false);
A.equal(guards.provider.firebasePlan, 'Spark');
A.equal(guards.provider.cloudRunAllowed, false);
A.equal(guards.provider.cloudFunctionsAllowed, false);
A.equal(pkg.version, version);
A.equal(lock.version, version);
A.equal(lock.packages?.['']?.version, version);
A.equal(pkg.devDependencies['@sparticuz/chromium'], '149.0.0');
A.equal(footer, version);
A.match(revision, new RegExp(`^${version.replace(/\./g, '\\.')}\\-r[1-9]\\d*$`));

const releasePath = gen === 1 ? `RELEASE_V${version}.md` : `RELEASE_V${version}_R${gen}.md`;
A.ok(fs.existsSync(path.join(root, releasePath)), 'Current whole-shell release record must exist.');
const release = read(releasePath);
A.ok(release.includes(`Runtime asset revision: \`${revision}\``), 'Release record must carry the exact current runtime revision.');
if(/Status:\s*RELEASE CANDIDATE/i.test(release)){
    const previous = (release.match(/Previous known-good runtime:\s*`([^`]+)`/i) || [])[1];
    A.ok(previous && previous !== revision, 'A release candidate must preserve a distinct previous known-good whole-shell recovery target.');
    const workerPrevious = (worker.match(/const PREVIOUS_RUNTIME_REVISION = "([^"]+)";/) || [])[1];
    A.equal(workerPrevious, previous, 'Service Worker recovery authority must match the release candidate recovery target.');
}

A.ok(optional.includes('getApplicationAssetRevision()'));
A.ok(app.includes(`css/visual-fidelity-r3.css?v=${revision}`));
A.ok(app.includes('contentScriptData\\.init_ts') && app.includes('isFirstPartyRuntimeError') && app.includes('suppressedExternalRuntimeErrors'));

// Protect the shipped offline capability itself, never a milestone phrase in handoff files.
A.ok(fs.existsSync(path.join(root, 'manifest.webmanifest')), 'Installable offline app manifest must remain shipped.');
A.ok(worker.includes('"manifest.webmanifest"') && worker.includes('"js/offlineApp.js"') && worker.includes('"css/offline.css"'), 'Service worker shell must retain install/offline runtime assets.');
A.equal((worker.match(/const RUNTIME_REVISION = "([^"]+)"/) || [])[1], revision, 'Service worker cache revision must match the current runtime shell.');
A.ok(offlineApp.includes('function registerOfflineApplication()') && offlineApp.includes('navigator.serviceWorker'), 'Offline application module must retain real service-worker registration behavior.');

const refs = [...html.matchAll(/(?:src|href)="((?:css|js|data|assets)\/[^"?]+)(?:\?v=([^"]+))?"/g)];
A.ok(refs.length >= 9);
A.deepEqual(refs.filter(match => match[2] !== revision).map(match => match[1]), []);

// Raw storage corruption and quota failures must remain fail-closed and non-destructive.
const values = new Map();
const notes = [];
const ls = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem(key, value){ values.set(key, String(value)); },
    removeItem: key => values.delete(key)
};
const ctx = {
    console: { error(){}, warn(){}, log(){} },
    currentShowdown: null,
    localStorage: ls,
    structuredClone,
    setTimeout,
    clearTimeout,
    CustomEvent: class {},
    document: { documentElement: { dataset: {} }, addEventListener(){}, visibilityState: 'visible' },
    matchMedia(){ return { matches: false, addEventListener(){}, addListener(){} }; },
    addEventListener(){},
    dispatchEvent(){},
    showAppNotice: message => notes.push(message)
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(`${read('js/storage.js')}\n;globalThis.__s={loadSavedShowdown,hasSavedShowdown,saveCurrentShowdown,loadLegacyShowdowns,loadApplicationPreferences,STORAGE_KEY,LEGACY_STORAGE_KEY,APPLICATION_PREFERENCES_KEY};`, ctx);

const s = ctx.__s;
values.set(s.STORAGE_KEY, '{bad');
A.equal(s.loadSavedShowdown(), null);
A.equal(s.hasSavedShowdown(), false);
A.equal(values.get(s.STORAGE_KEY), '{bad');
A.ok(notes.some(message => /parse the active showdown/i.test(message)));
values.set(s.LEGACY_STORAGE_KEY, '{bad');
A.deepEqual(Array.from(s.loadLegacyShowdowns()), []);
A.equal(values.get(s.LEGACY_STORAGE_KEY), '{bad');
values.set(s.APPLICATION_PREFERENCES_KEY, '[]');
A.deepEqual({ ...s.loadApplicationPreferences() }, { schemaVersion: 2, reducedMotion: false, menuFeedback: true });
ctx.currentShowdown = { id: 7, updatedAt: 'preserved' };
const set = ls.setItem;
ls.setItem = function(key, value){
    if(key === s.STORAGE_KEY){ throw new DOMException('quota', 'QuotaExceededError'); }
    return set.call(this, key, value);
};
A.equal(s.saveCurrentShowdown(), false);
A.equal(ctx.currentShowdown.updatedAt, 'preserved');

// Preserve current CI ownership and deployed release proof without coupling to exact workflow counts.
const stability = read('.github/workflows/validate-stability-lane.yml');
for(const command of [
    'npm run test:contracts',
    'npm run test:runtime-boundary',
    'npm run test:home-visual',
    'npm run test:football-visual',
    'npm run test:backup-browser',
    'npm run test:import-browser',
    'npm run test:restore-browser',
    'npm run test:browser',
    'npm run verify:deployment'
]){
    A.ok(stability.includes(command), command);
}
A.doesNotMatch(stability, /trusted-runtime\/Dockerfile|firebaseAdminProvider|career-mode-showdown-trusted-runtime/, 'Dormant trusted Cloud Run architecture must not consume current Stability CI.');
A.ok(/canonical-stability-/.test(stability) && /stability-audit-\*\.json/.test(stability));

const b = read('.github/workflows/validate-import-analysis.yml');
const c = read('.github/workflows/validate-atomic-restore.yml');
A.ok(/candidate-b-import-analysis-/.test(b) && /candidate-b-import-\*\.png/.test(b));
A.ok(/candidate-c-atomic-restore-/.test(c) && /candidate-c-restore-\*\.png/.test(c));

const burn = read('.github/workflows/validate-v110-release-burnin.yml');
const burnScript = read('tests/support/run-release-burnin-pass.sh');
A.ok(/Validate Release Integration Burn-In/.test(burn) && /pass:\s*\[1, 2\]/.test(burn));
A.ok(burnScript.includes('npm run test:browser') && !burnScript.includes('npm run test:restore-browser'));

for(const file of fs.readdirSync(path.join(root, '.github/workflows')).filter(file => /\.ya?ml$/i.test(file))){
    const workflow = read('.github/workflows/' + file);
    A.ok(!workflow.includes('actions/checkout@v4') && !workflow.includes('actions/setup-node@v4'), file);
}

console.log(`Stability contracts passed for v${version}/${revision}; executable release identity, raw storage failures, workflow ownership and deployed product proof remain protected without handoff/WEC/RJR narration coupling.`);
