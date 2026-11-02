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
  // Sol/Astra r5 R5-02: a manual run checks the Rules too (last Rules deploy succeeded, none running, same Rules source).
  assert.match(pages,/name: Require live Rules for this commit \(manual run\)\n        if: github\.event_name != 'push'\n/,'a manual Pages run must check its Rules');
  assert.match(pages,/runs\?branch=main&status=completed&per_page=1/);
  assert.match(pages,/select\(\.status != "completed"\)/);
  assert.match(pages,/git diff --quiet "\$rules_sha" "\$SHA" -- "\$\{rules_paths\[@\]\}"/);
  assert.match(pages,/fetch-depth: 0/);
  assert.match(pages,/"\$last" == "success" \|\| "\$last" == "none"[^\n]*exit 0/);
  assert.match(pages,/Re-run it first; the site is not deployed ahead of its Rules\."\n\s+exit 1/);
  ok('RR2','the site deploy waits for the same commit\'s Rules deploy, or for the last one on main to have succeeded');
}

// RR3 (red team #5, moved on by 2.0.0): PREVIOUS is the live 1.9.10-r86, so the retained shell is exactly r86's own 228 paths
// (tests/fixtures/shell-paths/1.9.10-r86.json): this release's shell minus what it added, plus the seven acceptance-only
// scripts it no longer precaches (arch audit D1). tests/contracts/r87-upgrade-rollback-list-contracts.cjs names any drift.
{
  const sw=read('service-worker.js');
  assert.match(sw,/const RUNTIME_REVISION = "2\.0\.0-r87";\nconst PREVIOUS_RUNTIME_REVISION = "1\.9\.10-r86";/);
  const set=name=>JSON.parse('['+new RegExp(`const ${name} = new Set\\(\\[([^\\]]*)\\]\\);`).exec(sw)[1]+']');
  const added=set('SHELL_PATHS_ADDED_SINCE_PREVIOUS'),removed=set('SHELL_PATHS_REMOVED_SINCE_PREVIOUS');
  const r86=JSON.parse(read('tests/fixtures/shell-paths/1.9.10-r86.json')).paths;
  const shell=JSON.parse(/const SHELL_PATHS\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/.exec(sw)[1]);
  assert.equal(r86.length,228);
  assert.deepEqual(added,shell.filter(p=>!r86.includes(p)),'the added list is this shell minus r86\'s');
  assert.deepEqual(removed,['js/ssjrProductionAcceptanceRecorder.js','js/ssjrProductionNegativeProbeRunner.js','js/ssjrProductionNegativeEvidence.js','js/stage5fProductionAuthenticatedNegatives.js','js/ssjrAcceptancePolishedBridge.js','js/ssjrPhysicalJourneyAcceptance.js','js/remoteJoiningAcceptance.js']);
  assert.deepEqual(r86.filter(p=>!shell.includes(p)),removed,'only the seven acceptance-only scripts left the shell');
  assert.equal(shell.length,228-removed.length+added.length);
  assert.ok(added.includes('js/commentaryV3.js')&&added.includes('js/touchlineGazette.js')&&added.includes('js/rosterRouletteStep.js'));
  for(const p of ['js/iconGuessStep.js','js/iconGuess.js','js/iconNames.js','data/icons.js','visual-assets/v10_1/icon-guess/index.html'])assert.ok(added.includes(p),`Prime Pack's ${p} is precached`);
  assert.ok(!shell.some(p=>p.startsWith('visual-assets/v10_1/icon-guess/')&&/\.(webp|png|jpe?g)$/.test(p)),'Prime Pack pictures stay runtime-cached (V10_IMAGE_PATH)');
  assert.ok(!added.includes('js/careerSummaryStore.js'),'r86\'s own files are in r86\'s list');
  ok('RR3','the retained 1.9.10-r86 shell is verified against its own 228 paths');
}

// RR4 (2.0.0): one version everywhere it is pinned: package files, APP_VERSION (Settings and backups show it), the footer, the
// asset revision, every ?v= on Home's own files and the manifest icons, and the service worker.
{
  const html=read('index.html'),app=read('js/app.js'),sw=read('service-worker.js'),manifest=read('manifest.webmanifest');
  assert.equal(JSON.parse(read('package.json')).version,'2.0.0');
  const lock=JSON.parse(read('package-lock.json'));assert.equal(lock.version,'2.0.0');assert.equal(lock.packages[''].version,'2.0.0');
  assert.match(app,/^const APP_VERSION = "2\.0\.0";/);
  assert.match(html,/<meta name="app-asset-revision" content="2\.0\.0-r87">/);
  assert.match(html,/<footer>Career Mode Showdown<br>v2\.0\.0<\/footer>/);
  const pins=[...html.matchAll(/\?v=([0-9][^"&]*)/g),...manifest.matchAll(/\?v=([0-9][^"&]*)/g),...app.matchAll(/\?v=([0-9][^"&]*)/g),...read('js/menuExperience.js').matchAll(/\?v=([0-9][^"&]*)/g)].map(m=>m[1]);
  assert.ok(pins.length>=17,`${pins.length} pins`);assert.deepEqual([...new Set(pins)],['2.0.0-r87'],'every pinned asset revision is 2.0.0-r87');
  assert.match(sw,/^const RUNTIME_REVISION = "2\.0\.0-r87";/);
  for(const file of ['index.html','js/app.js','js/menuExperience.js','manifest.webmanifest','service-worker.js'])assert.ok(!read(file).includes('1.9.9-r85'),`${file} has no r85 pin`);
  ok('RR4','2.0.0-r87 is the one version pinned everywhere');
}

// RR5 (red team R87-C-07): the roulette starts at the 2.0.0 release time. Every start constant that must equal it is set by
// tools/set-release-time.cjs and they all hold the same fixed UTC time, after r86's release.
{
  const {read:readTimes,RELEASE_TIME_CONSTANTS,NOT_RELEASE_TIME}=require('../../tools/set-release-time.cjs');
  const times=readTimes();
  assert.equal(times.length,RELEASE_TIME_CONSTANTS.length);assert.ok(times.length>=10,'roulette, Prime Pack and own-club boundaries');
  // Every *_FROM_MS=Date.parse("...") start literal in js/ is either a release-time constant or a named older boundary.
  const listed=new Set(RELEASE_TIME_CONSTANTS.map(c=>`${c.file}:${c.name}`));
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
// revision that asks (a page rolled back to 1.9.10 keeps its own copy), else the network, never a hard miss.
{
  const sw=read('service-worker.js');
  const fetchBlock=/self\.addEventListener\("fetch"[\s\S]*?\n\}\);/.exec(sw)[0];
  const at=fetchBlock.indexOf('SHELL_PATHS_REMOVED_SINCE_PREVIOUS.has(path)');
  assert.ok(at>0&&at<fetchBlock.indexOf('const requestedRevision='),'the removed-path rule runs before the versioned shell lookup');
  assert.match(fetchBlock,/SHELL_PATHS_REMOVED_SINCE_PREVIOUS\.has\(path\)\)\{ const asked=url\.searchParams\.get\("v"\)\|\|""; event\.respondWith\(\(async\(\)=>\{ const cached=asked&&asked!==RUNTIME_REVISION\?await cachedShellResponse\(path,asked\):null; return cached\|\|fetch\(networkOnlyRequest\(request\)\); \}\)\(\)\); return; \}/);
  for(const loader of [['js/ssjr.js','js/ssjrPhysicalJourneyAcceptance.js'],['js/offlineApp.js','js/remoteJoiningAcceptance.js']])assert.ok(read(loader[0]).includes(loader[1]),`${loader[0]} still loads ${loader[1]} on demand`);
  ok('RR6','the acceptance-only scripts load on demand outside the precache');
}

console.log(`PASS r86 release contracts: ${checks} checks.`);
