'use strict';
// r86 release (1.9.10-r86) items from the red team (2026-10-29), carried into 2.0.0 (r87, RR3-RR6): the Special Player starts at the release, the Rules go live
// before the site, and the retained r85 shell is checked against r85's own list.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// RR1 (red team #3): MARQUEE_FROM_MS is the r86 release time, not the 2026-10-28 build date. Showdowns confirmed before it
// (all of them played on r85) get no Special Player; a later one always does.
{
  const source=read('js/marqueePlayer.js'),MP=require('../../js/marqueePlayer.js');
  const literal=/const MARQUEE_FROM_MS=Date\.parse\("(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)"\);/.exec(source);
  assert.ok(literal,'MARQUEE_FROM_MS is one fixed UTC time');
  assert.equal(MP.fromMs,Date.parse(literal[1]));
  assert.ok(MP.fromMs>=Date.parse('2026-10-30T00:00:00Z'),'MARQUEE_FROM_MS is the r86 release time');
  ok('RR1','the Special Player starts at the r86 release time');
}

// RR2 (red team #4): the site waits for this commit's Rules deploy and is not deployed when that deploy fails.
{
  const pages=read('.github/workflows/deploy-github-pages.yml');
  assert.match(pages,/\n  rules-first:\n/);
  assert.match(pages,/\n  build:\n    needs: rules-first\n/,'the site build waits for rules-first');
  assert.match(pages,/actions\/workflows\/deploy-firestore-rules-zero-billing\.yml\/runs\?head_sha=\$SHA&event=push/);
  assert.match(pages,/"\$conclusion" == "success"[^\n]*exit 0/);
  assert.match(pages,/the site is not deployed ahead of its Rules\."\n\s+exit 1/);
  assert.ok(fs.existsSync(path.join(ROOT,'.github/workflows/deploy-firestore-rules-zero-billing.yml')));
  // r87: a push without a Rules change ships the site only after the last Rules deploy on main succeeded.
  assert.match(pages,/runs\?branch=main&event=push&status=completed&per_page=1/);
  assert.match(pages,/"\$last" == "success" \|\| "\$last" == "none"[^\n]*exit 0/);
  assert.match(pages,/Re-run it first; the site is not deployed ahead of its Rules\."\n\s+exit 1/);
  ok('RR2','the site deploy waits for the same commit\'s Rules deploy, or for the last one on main to have succeeded');
}

// RR3 (red team #5, moved on by 2.0.0, 2.1.0 and again by 2.2.0): PREVIOUS is the live 2.1.0-r88, so the retained shell is
// exactly r88's own 270 paths (tests/fixtures/shell-paths/2.1.0-r88.json): this release's shell minus what r89 added, plus
// what it removed. tests/contracts/r87-upgrade-rollback-list-contracts.cjs names any drift. R89_ADDED and R89_REMOVED are
// re-derived at the r89 freeze.
{
  const R89_ADDED=['visual-assets/v10_1/roulette/vendor/three-r187.min.js','visual-assets/v10_1/roulette/assets/ENV_LOUNGE_V1.exr','js/kits17.js','js/gfxTier.js','data/gazetteSacked.js','js/chamberMenScene3d.js','js/chamberMenStadium3d.js'],R89_REMOVED=['assets/fonts/barlow-condensed-latin-600-normal.woff2','assets/fonts/barlow-condensed-latin-700-normal.woff2','js/analytics.js','visual-assets/v10_1/roulette/vendor/three-r128.min.js']; // r90 dead-code cut: js/analytics.js leaves the shell
  const sw=read('service-worker.js');
  assert.match(sw,/const RUNTIME_REVISION = "2\.2\.0-r89";\nconst PREVIOUS_RUNTIME_REVISION = "2\.1\.0-r88";/);
  const set=name=>JSON.parse('['+new RegExp(`const ${name} = new Set\\(\\[([^\\]]*)\\]\\);`).exec(sw)[1]+']');
  const added=set('SHELL_PATHS_ADDED_SINCE_PREVIOUS'),removed=set('SHELL_PATHS_REMOVED_SINCE_PREVIOUS');
  const r88=JSON.parse(read('tests/fixtures/shell-paths/2.1.0-r88.json')).paths;
  const shell=JSON.parse(/const SHELL_PATHS\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/.exec(sw)[1]);
  assert.equal(r88.length,270);
  assert.deepEqual(added,shell.filter(p=>!r88.includes(p)),'the added list is this shell minus r88\'s');
  // r90 M8 (#1285): the Special Player page's self-hosted faces (and the roulette's Rye title face, #1290), added on top of r89's list until the r90 freeze re-derives it.
  const R90_ADDED=['visual-assets/v10_1/shared/fonts/barlow-condensed-latin-500-normal.woff2','visual-assets/v10_1/shared/fonts/barlow-condensed-latin-800-normal.woff2','visual-assets/v10_1/shared/fonts/barlow-condensed-latin-600-italic.woff2','visual-assets/v10_1/shared/fonts/barlow-condensed-latin-ext-500-normal.woff2','visual-assets/v10_1/shared/fonts/barlow-condensed-latin-ext-600-normal.woff2','visual-assets/v10_1/shared/fonts/barlow-condensed-latin-ext-700-normal.woff2','visual-assets/v10_1/shared/fonts/barlow-condensed-latin-ext-800-normal.woff2','visual-assets/v10_1/shared/fonts/barlow-condensed-latin-ext-600-italic.woff2','visual-assets/v10_1/shared/fonts/big-shoulders-display-latin-700-normal.woff2','visual-assets/v10_1/shared/fonts/big-shoulders-display-latin-ext-700-normal.woff2','visual-assets/v10_1/shared/fonts/big-shoulders-display-latin-800-normal.woff2','visual-assets/v10_1/shared/fonts/big-shoulders-display-latin-ext-800-normal.woff2','visual-assets/v10_1/shared/fonts/big-shoulders-display-latin-900-normal.woff2','visual-assets/v10_1/shared/fonts/big-shoulders-display-latin-ext-900-normal.woff2','visual-assets/v10_1/shared/fonts/rye-latin-400-normal.woff2'];
  assert.deepEqual(added,[...R89_ADDED,...R90_ADDED],'2.2.0 adds exactly the r89 shell files, plus the r90 SP faces');
  assert.deepEqual(removed,R89_REMOVED,'2.2.0 removes exactly the r88 shell files r89 drops');
  assert.deepEqual(r88.filter(p=>!shell.includes(p)),removed,'every r88 shell path is still precached');
  assert.equal(shell.length,270-removed.length+added.length);
  for(const p of ['js/chamberMenStep.js','js/chamberMen.js','css/chamberMen.css','js/iconGuessStep.js','js/commentaryV3.js','js/touchlineGazette.js','js/rosterRouletteStep.js'])assert.ok(r88.includes(p)&&!added.includes(p),`r88's ${p} is in r88's own list`);
  assert.ok(!shell.some(p=>p.startsWith('visual-assets/v10_1/icon-guess/')&&/\.(webp|png|jpe?g)$/.test(p)),'Prime Pack pictures stay runtime-cached (V10_IMAGE_PATH)');
  assert.ok(!shell.some(p=>p.startsWith('chronicle/')),'the STORY site (chronicle/) is never precached');
  ok('RR3','the retained 2.1.0-r88 shell is verified against its own 270 paths');
}

// RR4 (2.2.0): one version everywhere it is pinned: package files, APP_VERSION (Settings and backups show it), the footer, the
// asset revision, every ?v= on Home's own files and the manifest icons, and the service worker.
{
  const html=read('index.html'),app=read('js/app.js'),sw=read('service-worker.js'),manifest=read('manifest.webmanifest');
  assert.equal(JSON.parse(read('package.json')).version,'2.2.0');
  const lock=JSON.parse(read('package-lock.json'));assert.equal(lock.version,'2.2.0');assert.equal(lock.packages[''].version,'2.2.0');
  assert.match(app,/^const APP_VERSION = "2\.2\.0";/);
  assert.match(html,/<meta name="app-asset-revision" content="2\.2\.0-r89">/);
  assert.match(html,/<footer>Career Mode Showdown<br>v2\.2\.0<\/footer>/);
  const pins=[...html.matchAll(/\?v=([0-9][^"&]*)/g),...manifest.matchAll(/\?v=([0-9][^"&]*)/g),...app.matchAll(/\?v=([0-9][^"&]*)/g),...read('js/menuExperience.js').matchAll(/\?v=([0-9][^"&]*)/g)].map(m=>m[1]);
  assert.ok(pins.length>=17,`${pins.length} pins`);assert.deepEqual([...new Set(pins)],['2.2.0-r89'],'every pinned asset revision is 2.2.0-r89');
  assert.match(sw,/^const RUNTIME_REVISION = "2\.2\.0-r89";/);
  for(const file of ['index.html','js/app.js','js/menuExperience.js','manifest.webmanifest','service-worker.js'])for(const old of ['1.9.9-r85','1.9.10-r86','2.0.0-r87'])assert.ok(!read(file).includes(old),`${file} has no ${old} pin`);
  for(const file of ['index.html','js/app.js','js/menuExperience.js','manifest.webmanifest'])assert.ok(!read(file).includes('2.1.0-r88'),`${file} has no r88 pin`);
  ok('RR4','2.2.0-r89 is the one version pinned everywhere');
}

// RR5 (red team R87-C-07): the roulette starts at the 2.0.0 release time. Every start constant that must equal it is set by
// tools/set-release-time.cjs and they all hold the same fixed UTC time, after r86's release.
{
  const {read:readTimes,RELEASE_TIME_CONSTANTS,R88_RELEASE_TIME_CONSTANTS=[],R89_RELEASE_TIME_CONSTANTS=[],NOT_RELEASE_TIME}=require('../../tools/set-release-time.cjs');
  const times=readTimes();
  assert.equal(times.length,RELEASE_TIME_CONSTANTS.length);assert.ok(times.length>=10,'roulette, Prime Pack and own-club boundaries');
  // Every *_FROM_MS=Date.parse("...") start literal in js/ is either a release-time constant or a named older boundary.
  // r88's own start constants (Chamber Men) are set by the same tool's --r88 list (tests/contracts/r88-chamber-men-contracts.cjs checks them).
  const listed=new Set([...RELEASE_TIME_CONSTANTS,...R88_RELEASE_TIME_CONSTANTS,...R89_RELEASE_TIME_CONSTANTS].map(c=>`${c.file}:${c.name}`));
  for(const file of require('node:fs').readdirSync(require('node:path').join(__dirname,'../../js')).filter(f=>f.endsWith('.js')).map(f=>`js/${f}`))
    for(const m of read(file).matchAll(/\b([A-Z][A-Z0-9_]*_FROM_MS)=Date\.parse\(/g))
      assert.ok(listed.has(`${file}:${m[1]}`)||NOT_RELEASE_TIME.includes(m[1]),`${file} ${m[1]} is not set by tools/set-release-time.cjs`);
  assert.deepEqual([...new Set(times.map(t=>t.value))].length,1,`the release-time constants differ: ${times.map(t=>`${t.name}=${t.value}`).join(', ')}`);
  const at=Date.parse(times[0].value);
  assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(times[0].value)&&Number.isFinite(at));
  assert.ok(at>Date.parse('2026-10-30T03:00:00Z'),'after the r86 release (MARQUEE_FROM_MS)');
  const Step=require('../../js/rosterRouletteStep.js');
  if(Step&&Number.isFinite(Step.fromMs))assert.equal(Step.fromMs,at,'the roulette step exports the release time');
  ok('RR5',`the roulette, Prime Pack and own-club SP start at the release time ${times[0].value} (${times.map(t=>t.name).join(' = ')})`);
}

// RR6 (arch audit D1): the seven acceptance-only scripts are not precached; a request for one is answered from the shell of the
// revision that asks (a page rolled back to an older build keeps its own copy), else the network, never a hard miss. From 2.1.0
// they are ACCEPTANCE_ONLY_SCRIPT_PATHS (no longer SHELL_PATHS_REMOVED_SINCE_PREVIOUS: r87's shell never had them).
{
  const sw=read('service-worker.js');
  const fetchBlock=/self\.addEventListener\("fetch"[\s\S]*?\n\}\);/.exec(sw)[0];
  const at=fetchBlock.indexOf('ACCEPTANCE_ONLY_SCRIPT_PATHS.has(path)');
  assert.ok(at>0&&at<fetchBlock.indexOf('const requestedRevision='),'the removed-path rule runs before the versioned shell lookup');
  assert.match(fetchBlock,/ACCEPTANCE_ONLY_SCRIPT_PATHS\.has\(path\)\)\{ const asked=url\.searchParams\.get\("v"\)\|\|""; event\.respondWith\(\(async\(\)=>\{ const cached=asked&&asked!==RUNTIME_REVISION\?await cachedShellResponse\(path,asked\):null; return cached\|\|fetch\(networkOnlyRequest\(request\)\); \}\)\(\)\); return; \}/);
  const acceptance=JSON.parse('['+/const ACCEPTANCE_ONLY_SCRIPT_PATHS = new Set\(\[([^\]]*)\]\);/.exec(sw)[1]+']');
  assert.deepEqual(acceptance,['js/ssjrProductionAcceptanceRecorder.js','js/ssjrProductionNegativeProbeRunner.js','js/ssjrProductionNegativeEvidence.js','js/stage5fProductionAuthenticatedNegatives.js','js/ssjrAcceptancePolishedBridge.js','js/ssjrPhysicalJourneyAcceptance.js','js/remoteJoiningAcceptance.js']);
  const shell=JSON.parse(/const SHELL_PATHS\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/.exec(sw)[1]);
  assert.deepEqual(acceptance.filter(p=>shell.includes(p)),[],'none of them is precached');
  for(const loader of [['js/ssjr.js','js/ssjrPhysicalJourneyAcceptance.js'],['js/offlineApp.js','js/remoteJoiningAcceptance.js']])assert.ok(read(loader[0]).includes(loader[1]),`${loader[0]} still loads ${loader[1]} on demand`);
  ok('RR6','the acceptance-only scripts load on demand outside the precache');
}

// RR7 (2.2.0): r89's own start time. Every r89 boundary (the Sacked tick, SACKED_FROM_MS; grep *_FROM_MS on the merged tree
// at freeze) is set by  node tools/set-release-time.cjs --r89 <UTC>  and they all hold one fixed UTC time, after r88's.
{
  const tool=require('../../tools/set-release-time.cjs');
  assert.ok(Array.isArray(tool.R89_RELEASE_TIME_CONSTANTS)&&tool.R89_RELEASE_TIME_CONSTANTS.length>=1,'set-release-time has an --r89 list');
  assert.match(read('tools/set-release-time.cjs'),/args\.includes\("--r89"\)/);
  assert.ok(tool.R89_RELEASE_TIME_CONSTANTS.some(c=>c.name==='SACKED_FROM_MS'),'the Sacked tick starts at the r89 release time');
  const times=tool.read(tool.R89_RELEASE_TIME_CONSTANTS),r89=times[0].value,r88=tool.read(tool.R88_RELEASE_TIME_CONSTANTS)[0].value,r87=tool.read()[0].value;
  assert.deepEqual([...new Set(times.map(t=>t.value))].length,1,`the r89 release-time constants differ: ${times.map(t=>`${t.file} ${t.name}=${t.value}`).join(', ')}`);
  assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(r89)&&Number.isFinite(Date.parse(r89)));
  assert.ok(Date.parse(r89)>Date.parse(r88)&&Date.parse(r88)>Date.parse(r87),'r89 starts after r88, which starts after 2.0.0');
  const all=[...tool.RELEASE_TIME_CONSTANTS,...tool.R88_RELEASE_TIME_CONSTANTS,...tool.R89_RELEASE_TIME_CONSTANTS].map(c=>`${c.file}:${c.name}`);
  assert.equal(new Set(all).size,all.length,'no constant is in two release lists');
  ok('RR7',`r89's boundaries start at ${r89} (${times.map(t=>t.name).join(' = ')})`);
}

console.log(`PASS r86 release contracts: ${checks} checks.`);
