const A = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const html = read('index.html');
const app = read('js/app.js');
const optional = read('js/optionalModules.js');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const state = read('PROJECT_STATE.md');
const next = read('NEXT_TASK.md');
const readme = read('README.md');
const changelog = read('CHANGELOG.md');
const gold = read('00_HANDOFF_GOLDEN_RULE.md');

const version = (app.match(/const APP_VERSION = "([^"]+)"/) || [])[1];
const revision = (html.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
const footer = (html.match(/<footer>[\s\S]*?v([^<\s]+)\s*·\s*(?:Stable|Product Deepening|Private Connected Account Foundation|Registered Devices & Private Pairing|Connected Rivalry|Private Remote Joining)/i) || [])[1];
const gen = Number((revision.match(/-r(\d+)$/) || [])[1]);

A.equal(pkg.version, version);
A.equal(lock.version, version);
A.equal(lock.packages?.['']?.version, version);
A.equal(pkg.devDependencies['@sparticuz/chromium'], '149.0.0');
A.equal(footer, version);
A.match(revision, new RegExp(`^${version.replace(/\./g, '\\.')}\\-r[1-9]\\d*$`));

const releasePath = gen === 1 ? `RELEASE_V${version}.md` : `RELEASE_V${version}_R${gen}.md`;
A.ok(fs.existsSync(path.join(root, releasePath)));
const release = read(releasePath);
const candidate = /Status:\s*RELEASE CANDIDATE/i.test(release);
A.ok(release.includes(`Runtime asset revision: \`${revision}\``));
A.ok(state.includes(`v${version}`) && state.includes(revision));
A.ok(next.includes(`v${version}`) && next.includes(revision));

if(candidate){
    const previous = (release.match(/Previous known-good runtime:\s*`([^`]+)`/i) || [])[1];
    A.ok(previous, 'A release candidate must name its previous known-good whole-runtime shell.');
    A.ok(readme.includes(previous) && /production-proven|production proven/i.test(readme));
    A.ok(changelog.includes(previous));
}else{
    A.ok(readme.includes(revision) && changelog.includes(revision));
}

A.ok(gold.includes('Every developer or ChatGPT session') && gold.includes('continuously'));
A.ok(optional.includes('getApplicationAssetRevision()'));
A.ok(app.includes(`css/visual-fidelity-r3.css?v=${revision}`));
A.ok(app.includes('contentScriptData\\.init_ts') && app.includes('isFirstPartyRuntimeError') && app.includes('suppressedExternalRuntimeErrors'));
A.ok(/Installable Offline App/i.test(state) && /Installable Offline App/i.test(next));

const refs = [...html.matchAll(/(?:src|href)="((?:css|js|data|assets)\/[^"?]+)(?:\?v=([^"]+))?"/g)];
A.ok(refs.length >= 9);
A.deepEqual(refs.filter(match => match[2] !== revision).map(match => match[1]), []);

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

console.log(`Stability contracts passed for v${version}/${revision}; raw storage failures, workflow ownership and publication truth remain protected.`);
