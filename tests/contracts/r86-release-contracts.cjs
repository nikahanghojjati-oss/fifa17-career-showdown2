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

// RR3 (red team #5, moved on by 2.0.0, 2.1.0, 2.2.0, 2.3.0, 2.4.0, 2.5.0, the 2.5.1 hotfix and again by 2.6.0): PREVIOUS is the live
// 2.5.1-r92, so the retained shell is exactly 2.5.1's own 293 paths (tests/fixtures/shell-paths/2.5.1-r92.json, main 23bdd439): this
// release's shell minus what 2.6.0 added, plus what it removed. tests/contracts/r87-upgrade-rollback-list-contracts.cjs names any drift.
{
  // 2.5.1 (R93-07 hotfix): only the Firestore Rules, tests and version strings changed, so its shell is 2.5.0's (293 paths).
  // 2.6.0 (r93) HO-079 (flat logo V4 + live-text titles): the V4 loading logo and the Cormorant SC Bold file with its licence are
  // added, the V3 loading logo is dropped (the V3 Home files were never precached). Nothing else in r93 touches the shell.
  const R93_ADDED=["assets/loading/LOGO_CM17_WORDMARK_V4_640.webp","visual-assets/v10_1/shared/fonts/CormorantSC-Bold-latin.woff2","visual-assets/v10_1/shared/fonts/OFL_CormorantSC.txt"];
  const R93_REMOVED=["assets/loading/LOGO_CM17_WORDMARK_V3_640.webp"];
  // r94 R94-02 (before r94 moves PREVIOUS to 2.6.0): the Club Assignment spin and stop adds its step, 3D scene and CSS.
  const R94_ADDED=["js/clubDrawStep.js","js/clubDrawScene3d.js","css/clubDraw.css"];
  const sw=read('service-worker.js');
  assert.match(sw,/const RUNTIME_REVISION = "2\.6\.0-r93";\nconst PREVIOUS_RUNTIME_REVISION = "2\.5\.1-r92";/);
  const set=name=>JSON.parse('['+new RegExp(`const ${name} = new Set\\(\\[([^\\]]*)\\]\\);`).exec(sw)[1]+']');
  const added=set('SHELL_PATHS_ADDED_SINCE_PREVIOUS'),removed=set('SHELL_PATHS_REMOVED_SINCE_PREVIOUS');
  const r92=JSON.parse(read('tests/fixtures/shell-paths/2.5.1-r92.json')).paths;
  const shell=JSON.parse(/const SHELL_PATHS\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/.exec(sw)[1]);
  assert.equal(r92.length,293);
  assert.deepEqual(added,shell.filter(p=>!r92.includes(p)),'the added list is this shell minus 2.5.1\'s');
  assert.deepEqual(added,[...R94_ADDED,...R93_ADDED],'r94 adds the club draw files; r93 adds the V4 logo, the title font and its licence');
  assert.deepEqual(removed,R93_REMOVED,'r93 drops only the V3 loading logo');
  assert.deepEqual(r92.filter(p=>!shell.includes(p)),removed,'every 2.5.1 shell path is still precached');
  assert.equal(shell.length,293-removed.length+added.length);
  for(const p of ['js/gfxTier.js','js/chamberMenStep.js','js/chamberMenScene3d.js','js/chamberMenStadium3d.js','js/kits17.js','data/gazetteSacked.js','visual-assets/v10_1/roulette/vendor/three-r187.min.js','visual-assets/v10_1/chamber-men/vendor/meshopt_decoder-0.22.0.js','js/iconGuessStep.js','js/touchlineGazette.js','js/rosterRouletteStep.js','js/squadScreen.js','js/playerSearch.js'])assert.ok(r92.includes(p)&&!added.includes(p),`${p} is in r92's own list`);
  assert.ok(!shell.some(p=>/^data\/fifa17\/players-/.test(p)),'the Transfer War player list is fetched on demand, never precached');
  assert.ok(!shell.some(p=>p.startsWith('visual-assets/v10_1/icon-guess/')&&/\.(webp|png|jpe?g)$/.test(p)),'Prime Pack pictures stay runtime-cached (V10_IMAGE_PATH)');
  assert.ok(!shell.some(p=>p.startsWith('chronicle/')),'the STORY site (chronicle/) is never precached');
  assert.ok(!shell.some(p=>p.startsWith('device-check')||p.startsWith('assets/level-guide/')),'the Device check pages are never precached');
  ok('RR3','the retained 2.5.1-r92 shell is verified against its own 293 paths');
}

// RR4 (2.6.0): one version everywhere it is pinned: package files, APP_VERSION (Settings and backups show it), the footer, the
// asset revision, every ?v= on Home's own files and the manifest icons, and the service worker.
{
  const html=read('index.html'),app=read('js/app.js'),sw=read('service-worker.js'),manifest=read('manifest.webmanifest');
  assert.equal(JSON.parse(read('package.json')).version,'2.6.0');
  const lock=JSON.parse(read('package-lock.json'));assert.equal(lock.version,'2.6.0');assert.equal(lock.packages[''].version,'2.6.0');
  assert.match(app,/^const APP_VERSION = "2\.6\.0";/);
  assert.match(html,/<meta name="app-asset-revision" content="2\.6\.0-r93">/);
  assert.match(html,/<footer>Career Mode Showdown<br>v2\.6\.0<\/footer>/);
  const pins=[...html.matchAll(/\?v=([0-9][^"&]*)/g),...manifest.matchAll(/\?v=([0-9][^"&]*)/g),...app.matchAll(/\?v=([0-9][^"&]*)/g),...read('js/menuExperience.js').matchAll(/\?v=([0-9][^"&]*)/g)].map(m=>m[1]);
  assert.ok(pins.length>=17,`${pins.length} pins`);assert.deepEqual([...new Set(pins)],['2.6.0-r93'],'every pinned asset revision is 2.6.0-r93');
  assert.match(sw,/^const RUNTIME_REVISION = "2\.6\.0-r93";/);
  for(const file of ['index.html','js/app.js','js/menuExperience.js','manifest.webmanifest','service-worker.js'])for(const old of ['1.9.9-r85','1.9.10-r86','2.0.0-r87','2.1.0-r88','2.2.0-r89','2.3.0-r90','2.4.0-r91','2.5.0-r92'])assert.ok(!read(file).includes(old),`${file} has no ${old} pin`);
  for(const file of ['index.html','js/app.js','js/menuExperience.js','manifest.webmanifest'])assert.ok(!read(file).includes('2.5.1-r92'),`${file} has no 2.5.1-r92 pin`);
  ok('RR4','2.6.0-r93 is the one version pinned everywhere');
}

// RR5 (old-era cut): there are no "live from date X" release gates. The only *_FROM_MS=Date.parse literal left in js/ is
// MARQUEE_FROM_MS, a historical fact (a Showdown confirmed before r86 never had a Special Player), and nothing sets release times.
{
  const fs=require('node:fs'),path=require('node:path');
  const found=[];
  for(const file of fs.readdirSync(path.join(__dirname,'../../js')).filter(f=>f.endsWith('.js')).map(f=>`js/${f}`))
    for(const m of read(file).matchAll(/\b([A-Z][A-Z0-9_]*_FROM_MS)=Date\.parse\(/g))found.push(`${file}:${m[1]}`);
  assert.deepEqual(found,['js/marqueePlayer.js:MARQUEE_FROM_MS'],'only the historical Special Player boundary remains');
  assert.ok(!fs.existsSync(path.join(__dirname,'../../tools/set-release-time.cjs')),'the release-time tool is gone');
  ok('RR5','no release-time gates remain: MARQUEE_FROM_MS is the one historical boundary');
}

// RR6 (arch audit D1): the acceptance-only script is not precached (r91 cut the six other acceptance scripts); a request for one is answered from the shell of the
// revision that asks (a page rolled back to an older build keeps its own copy), else the network, never a hard miss. From 2.1.0
// they are ACCEPTANCE_ONLY_SCRIPT_PATHS (no longer SHELL_PATHS_REMOVED_SINCE_PREVIOUS: r87's shell never had them).
{
  const sw=read('service-worker.js');
  const fetchBlock=/self\.addEventListener\("fetch"[\s\S]*?\n\}\);/.exec(sw)[0];
  const at=fetchBlock.indexOf('ACCEPTANCE_ONLY_SCRIPT_PATHS.has(path)');
  assert.ok(at>0&&at<fetchBlock.indexOf('const requestedRevision='),'the removed-path rule runs before the versioned shell lookup');
  assert.match(fetchBlock,/ACCEPTANCE_ONLY_SCRIPT_PATHS\.has\(path\)\)\{ const asked=url\.searchParams\.get\("v"\)\|\|""; event\.respondWith\(\(async\(\)=>\{ const cached=asked&&asked!==RUNTIME_REVISION\?await cachedShellResponse\(path,asked\):null; return cached\|\|fetch\(networkOnlyRequest\(request\)\); \}\)\(\)\); return; \}/);
  const acceptance=JSON.parse('['+/const ACCEPTANCE_ONLY_SCRIPT_PATHS = new Set\(\[([^\]]*)\]\);/.exec(sw)[1]+']');
  assert.deepEqual(acceptance,['js/ssjrPhysicalJourneyAcceptance.js']);
  const shell=JSON.parse(/const SHELL_PATHS\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/.exec(sw)[1]);
  assert.deepEqual(acceptance.filter(p=>shell.includes(p)),[],'none of them is precached');
  for(const loader of [['js/ssjr.js','js/ssjrPhysicalJourneyAcceptance.js']])assert.ok(read(loader[0]).includes(loader[1]),`${loader[0]} still loads ${loader[1]} on demand`);
  ok('RR6','the acceptance-only scripts load on demand outside the precache');
}

console.log(`PASS r86 release contracts: ${checks} checks.`);
