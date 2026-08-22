const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert');

const manifest = JSON.parse(fs.readFileSync('assets/football/asset-manifest.json','utf8'));
const data = fs.readFileSync('data/footballVisuals.js','utf8');
const renderer = fs.readFileSync('js/footballVisuals.js','utf8');
const loader = fs.readFileSync('js/optionalModules.js','utf8');
const screens = fs.readFileSync('js/screens.js','utf8');
const notices = fs.readFileSync('THIRD_PARTY_NOTICES.md','utf8');
const baseCss = fs.readFileSync('css/footballVisuals.css','utf8');
const v113Css = fs.readFileSync('css/footballVisuals-v113.css','utf8');
const html = fs.readFileSync('index.html','utf8');
const app = fs.readFileSync('js/app.js','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const builder = fs.readFileSync('tools/build_r5_player_visuals.py','utf8');

const expected = new Map([
  ['james-rodriguez-world-cup-2014-v113','james-rodriguez-world-cup-2014-v113.webp'],
  ['marcus-rashford-chelsea-2017-v113','marcus-rashford-chelsea-2017-v113.webp'],
  ['anthony-martial-cska-2017-v113','anthony-martial-cska-2017-v113.webp'],
  ['lionel-messi-barcelona-2016-subject-r4','lionel-messi-barcelona-2016-subject-r4.webp'],
  ['philipp-lahm-world-cup-2014-focus-r4','philipp-lahm-world-cup-2014-focus-r4.webp'],
  ['cristiano-ronaldo-euro-2016-v113','cristiano-ronaldo-euro-2016-v113.webp'],
  ['paul-pogba-man-utd-2016-v113','paul-pogba-man-utd-2016-v113.webp'],
  ['zlatan-ibrahimovic-man-utd-2016-v113','zlatan-ibrahimovic-man-utd-2016-v113.webp'],
  ['antoine-griezmann-atletico-2016-v113','antoine-griezmann-atletico-2016-v113.webp'],
  ['neymar-brazil-olympic-gold-2016-v113','neymar-brazil-olympic-gold-2016-v113.webp'],
  ['mario-balotelli-euro-2012-celebration-v113','mario-balotelli-euro-2012-celebration-v113.webp'],
  ['radamel-falcao-europa-league-2012-v113','radamel-falcao-europa-league-2012-v113.webp']
]);
assert.strictEqual(manifest.generated_by, 'licensed-football-visual-builder-v1.1.3');
assert.strictEqual(manifest.assets.length, expected.size, 'Exactly 12 reviewed licensed visual derivatives must be active.');
assert.deepStrictEqual(new Set(manifest.assets.map(asset => asset.id)), new Set(expected.keys()), 'Active visual IDs drifted.');

let total = 0;
for(const asset of manifest.assets){
  assert.strictEqual(asset.output, expected.get(asset.id), `${asset.id}: output filename drifted.`);
  const path = `assets/football/${asset.output}`;
  assert.ok(fs.existsSync(path), `Missing licensed derivative ${path}`);
  const bytes = fs.readFileSync(path);
  assert.strictEqual(bytes.length, asset.output_bytes, `${asset.output}: manifest byte count stale.`);
  assert.ok(bytes.length <= 360000, `${asset.output}: per-image 360 KB ceiling exceeded (${bytes.length}).`);
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex'), asset.output_sha256, `${asset.output}: derivative SHA-256 mismatch.`);
  assert.ok(asset.output_dimensions[0] <= asset.source_dimensions[0] && asset.output_dimensions[1] <= asset.source_dimensions[1], `${asset.output}: upscaling is forbidden.`);
  assert.ok(asset.source_page.startsWith('https://commons.wikimedia.org/'), `${asset.output}: Commons provenance missing.`);
  assert.ok(/CC BY/.test(asset.license), `${asset.output}: explicit Creative Commons license missing.`);
  assert.ok(notices.includes(asset.output) && notices.includes(asset.author) && notices.includes(asset.license), `${asset.output}: third-party notice incomplete.`);
  total += bytes.length;
}
assert.ok(total <= 3000000, `12-image licensed archive exceeds 3 MB repository ceiling (${total}).`);

const forbidden = [
  'james-rodriguez-real-madrid-2016-smart-v111.webp',
  'james-rodriguez-real-madrid-2019-smart-r5.webp',
  'james-rodriguez-real-madrid-2016-r4.webp',
  'marcus-rashford-man-utd-2017-smart-r5.webp',
  'marcus-rashford-man-utd-2016-smart-r5.webp',
  'anthony-martial-man-utd-2016-smart-r5.webp',
  'anthony-martial-man-utd-2015-r4.webp'
];
for(const file of forbidden){
  assert.ok(!manifest.assets.some(asset => asset.output === file), `Rejected/replaced derivative remains active: ${file}`);
  assert.ok(!data.includes(file), `Runtime data still references rejected/replaced derivative: ${file}`);
  assert.ok(!fs.existsSync(`assets/football/${file}`), `Rejected/replaced derivative remains in runtime asset directory: ${file}`);
}

const james = manifest.assets.find(asset => asset.id === 'james-rodriguez-world-cup-2014-v113');
assert.strictEqual(james.source_file, 'James Rodríguez (cropped).jpg');
assert.strictEqual(james.author, 'Copa2014.gov.br');
assert.strictEqual(james.license, 'CC BY 3.0 BR');
assert.deepStrictEqual(james.source_dimensions, [1415,3062]);
assert.deepStrictEqual(james.crop_box_on_source, [0,0,1415,3062]);
assert.deepStrictEqual(james.output_dimensions, [508,1099]);
assert.strictEqual(james.output_sha256, '95b3d55df2117b619273f9e46378974836e785bb68e0c7ef4aecd1a15d6f9ee8');
assert.ok(james.source_page.includes('James_Rodríguez_(cropped).jpg'));
assert.ok(!data.includes('James Rodríguez in September 2016 - 02.jpg'), 'Rejected James interview source must not return to runtime data.');
assert.ok(notices.includes('owner explicitly rejected the previous v1.1.1 James interview still'), 'James rejection history must remain explicit.');

const rashford = manifest.assets.find(asset => asset.id === 'marcus-rashford-chelsea-2017-v113');
assert.strictEqual(rashford.source_file, 'Manchester United v Chelsea, 16 April 2017 (11).jpg');
assert.strictEqual(rashford.author, 'Ardfern');
assert.strictEqual(rashford.license, 'CC BY-SA 4.0');
assert.deepStrictEqual(rashford.source_dimensions, [4896,3672]);
assert.deepStrictEqual(rashford.output_dimensions, [1120,840]);
assert.strictEqual(rashford.output_sha256, '8ade8cb66393ea9d8cc8b4adc4a63a63e27d574777c1281740f45daeba0e0be7');

const martial = manifest.assets.find(asset => asset.id === 'anthony-martial-cska-2017-v113');
assert.strictEqual(martial.source_file, 'Anthony Martial 27 September 2017 cropped.jpg');
assert.strictEqual(martial.license, 'CC BY-SA 3.0');
assert.deepStrictEqual(martial.output_dimensions, [521,999]);
assert.strictEqual(martial.output_sha256, '92bef5c5be2f7a6c0ab36e28491254763f8b96bdd6c9a57c72abab3d9a82476b');

const messi = manifest.assets.find(asset => asset.id === 'lionel-messi-barcelona-2016-subject-r4');
const lahm = manifest.assets.find(asset => asset.id === 'philipp-lahm-world-cup-2014-focus-r4');
assert.strictEqual(messi.output_sha256, 'a84eba9c108bb4237bde989c36dd837114480bd0d1a823eeacf401955995d204', 'Protected Messi derivative changed.');
assert.strictEqual(lahm.output_sha256, 'c745c9dfd3619e384604890c6ed183dd4ff92db6cc1d4b93e1ce6edf5ebf6eb5', 'Protected Lahm derivative changed.');

const plannedScreens = ['createShowdown','leagueWheelScreen','clubWheelScreen','dashboard','transferChallenge','seasonEntry','seasonSummary','careerStatistics','trophyRoom','legacy','ruleBook'];
for(const screen of plannedScreens){
  assert.ok(data.includes(`${screen}: Object.freeze`), `Visual plan missing ${screen}.`);
  assert.ok(screens.includes(`"${screen}"`), `Required visual route ownership missing ${screen}.`);
}
assert.ok(data.includes('layout: "cinematic-band"'), 'Cinematic-band presentation plan missing.');
assert.ok(data.includes('treatment: "clean-anchor"'), 'Clean-anchor source treatment missing.');
assert.ok(data.includes('fit: "contain"'), 'Subject-safe contain policy missing.');
assert.ok(!data.includes('fit: "cover"'), 'Blind cover framing is forbidden.');

assert.ok(renderer.includes('function preloadFootballVisualAssets(assetKeys = [])'), 'Route-owned preload API missing.');
const initializeBody = renderer.match(/function initializeFootballVisuals\(\)\{([\s\S]*?)\n\}/);
assert.ok(initializeBody, 'Football visual initialize function missing.');
assert.ok(!initializeBody[1].includes('preloadFootballVisualAssets('), 'Football visual initialization must not globally preload the archive.');
assert.ok(renderer.includes('warmFootballVisualPlan(plan)'), 'Destination-owned asset warming missing.');
assert.ok(renderer.includes('preloadCount: footballVisualPreloads.size'), 'Visual preload diagnostics missing.');
assert.ok(renderer.includes('image.loading = "eager"'), 'Visible destination photographs must load eagerly once their route owns them.');

assert.ok(loader.includes('css/footballVisuals.css') && loader.includes('css/footballVisuals-v113.css'), 'Base + v1.1.3 visual CSS loading chain is incomplete.');
assert.ok(baseCss.includes('object-fit:var(--football-visual-fit,contain)'), 'Base subject-safe contain fallback missing.');
assert.ok(!baseCss.includes('object-fit:cover') && !v113Css.includes('object-fit:cover'), 'No visual stylesheet may reintroduce blind cover crop.');
assert.ok(v113Css.includes('.footballVisualCinematicBand'), 'v1.1.3 cinematic band layer missing.');
assert.ok(v113Css.includes('marcus-rashford-chelsea-2017-v113'), 'Reviewed Rashford transfer geometry missing.');
assert.ok(v113Css.includes('prefers-reduced-motion:reduce'), 'Reduced-motion visual treatment missing.');

const appVersion = (app.match(/const APP_VERSION = "([^"]+)"/) || [])[1];
const revision = (html.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
assert.ok(appVersion, 'APP_VERSION is missing.');
assert.strictEqual(pkg.version, appVersion, 'Package release identity must track APP_VERSION.');
assert.ok(revision && revision.startsWith(`${appVersion}-r`) && /^[1-9]\d*$/.test(revision.slice(`${appVersion}-r`.length)), 'HTML cache revision must be a numbered revision for APP_VERSION.');
assert.ok(html.includes(`v${appVersion} · Stable`) || html.includes(`v${appVersion} · Product Deepening`) || html.includes(`v${appVersion} · Private Connected Account Foundation`) || html.includes(`v${appVersion} · Registered Devices & Private Pairing`) || html.includes(`v${appVersion} · Connected Rivalry`), 'Footer release identity must track APP_VERSION.');
assert.ok(app.includes(`const APP_VERSION = "${appVersion}";`), 'Runtime APP_VERSION declaration is inconsistent.');
assert.ok(app.includes(`visual-fidelity-r3.css?v=${revision}`), 'Protected visual-fidelity cache revision must advance coherently.');
assert.ok(builder.includes('James Rodríguez (cropped).jpg') && builder.includes('Manchester United v Chelsea, 16 April 2017 (11).jpg') && builder.includes('Anthony Martial 27 September 2017 cropped.jpg'), 'Deterministic builder is not aligned with active player sources.');

console.log(`Licensed visual contracts passed for app v${appVersion} / ${revision}: immutable v1.1.3 archive has 12 assets / ${total} bytes / 11 route destinations.`);
