"use strict";
// r87 upgrade: the service worker's rollback list must be the real shell of the revision it rolls back to.
// The worker keeps PREVIOUS_RUNTIME_REVISION's cache and verifies it against PREVIOUS_SHELL_PATHS (SHELL_PATHS minus
// SHELL_PATHS_ADDED_SINCE_PREVIOUS). If that list differs from the files the previous build really precached, a rollback
// either refuses a whole cache (a path the old build never had) or serves a shell with holes (a path the old build needs
// but the check skips). tests/fixtures/shell-paths/<revision>.json holds the exact SHELL_PATHS each live build shipped
// (1.9.10-r86 = main 5b4337fd, the build live since 2026-10-30; 2.0.0-r87 = main 00ae2b72, live since 2026-11-02; 2.1.0-r88 =
// main e6485d7d, live since 2026-11-04; 2.2.0-r89 = main 2fe8d2f5, live since 2026-11-06; 2.3.0-r90 = main a85d286a, live since
// 2026-11-11). 2.4.0 moves PREVIOUS to 2.3.0-r90: the added set must be exactly the paths r91 adds to r90's 289; this test names
// them if it is not.
// Run: node tests/contracts/r87-upgrade-rollback-list-contracts.cjs
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const FIXTURES=path.join(ROOT,"tests/fixtures/shell-paths");
function worker(){
  const source=fs.readFileSync(path.join(ROOT,"service-worker.js"),"utf8");
  const sandbox={self:{addEventListener(){},location:{href:"https://example.test/"},registration:{scope:"https://example.test/"}},URL,console,Response:function(){},caches:{},fetch(){},setTimeout,clearTimeout};
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n;globalThis.__w={revision:RUNTIME_REVISION,previous:PREVIOUS_RUNTIME_REVISION,shell:[...SHELL_PATHS],added:[...SHELL_PATHS_ADDED_SINCE_PREVIOUS],removed:typeof SHELL_PATHS_REMOVED_SINCE_PREVIOUS==="undefined"?[]:[...SHELL_PATHS_REMOVED_SINCE_PREVIOUS],previousShell:[...PREVIOUS_SHELL_PATHS]};`,sandbox);
  return JSON.parse(JSON.stringify(sandbox.__w));
}
function fixture(revision){
  const file=path.join(FIXTURES,`${revision}.json`);
  assert.ok(fs.existsSync(file),`no shell-path fixture for the rollback revision ${revision}: add tests/fixtures/shell-paths/${revision}.json from that build's SHELL_PATHS`);
  const value=JSON.parse(fs.readFileSync(file,"utf8"));
  assert.equal(value.revision,revision);assert.ok(Array.isArray(value.paths)&&value.paths.length>200);
  return value.paths;
}
const w=worker();
let passed=0;
function test(name,fn){fn();passed+=1;console.log(`ok ${name}`);}

test("UR1 the fixtures are the live builds' lists (r86 = r85's 222 + its six)",()=>{
  const r86=fixture("1.9.10-r86"),r85=fixture("1.9.9-r85");
  assert.equal(r86.length,228);assert.equal(r85.length,222);
  assert.deepEqual(r86.filter(p=>!r85.includes(p)),["js/careerSummaryStore.js","js/specialPlayerReveal.js","visual-assets/v10_1/special-player/index.html","js/marqueePlayer.js","data/marqueePlayers.js","js/specialPlayerChip.js"].filter(p=>r86.includes(p)).sort((a,b)=>r86.indexOf(a)-r86.indexOf(b)));
  assert.equal(r85.filter(p=>!r86.includes(p)).length,0);
});

test("UR2 the rollback list equals the previous revision's real shell, path for path",()=>{
  assert.ok(w.previous,"PREVIOUS_RUNTIME_REVISION is empty: nothing to roll back to");
  const real=fixture(w.previous),listed=new Set(w.previousShell);
  const missing=real.filter(p=>!listed.has(p)),extra=w.previousShell.filter(p=>!real.includes(p));
  assert.deepEqual({missing,extra},{missing:[],extra:[]},`rollback list for ${w.previous} is wrong; SHELL_PATHS_ADDED_SINCE_PREVIOUS should be exactly: ${JSON.stringify(w.shell.filter(p=>!real.includes(p)))}`);
});

test("UR3 the previous build's paths are all still precached, except the ones listed as removed (2.4.0: the History & Backup and Save Library files and the flat Reus loading pictures)",()=>{
  const real=fixture(w.previous),shell=new Set(w.shell);
  assert.deepEqual(real.filter(p=>!shell.has(p)),w.removed,"a path the previous build precached left SHELL_PATHS without being listed in SHELL_PATHS_REMOVED_SINCE_PREVIOUS");
  assert.deepEqual(w.removed.filter(p=>shell.has(p)),[],"a removed path is still in SHELL_PATHS");
});

test("UR4 every added path is a current shell path, listed once",()=>{
  const shell=new Set(w.shell);
  assert.deepEqual(w.added.filter(p=>!shell.has(p)),[]);
  assert.equal(new Set(w.added).size,w.added.length);
  assert.equal(new Set(w.shell).size,w.shell.length,"SHELL_PATHS lists a path twice");
});

test("UR5 a 2.4.0 worker rolls back to the live 2.3.0 build",()=>{
  assert.equal(w.revision,"2.4.0-r91");
  assert.equal(w.previous,"2.3.0-r90");
});

test("UR6 the r87 fixture is r86's list plus what 2.0.0 added, minus the seven acceptance-only scripts",()=>{
  const r87=fixture("2.0.0-r87"),r86=fixture("1.9.10-r86");
  assert.equal(r87.length,267);
  assert.deepEqual(r86.filter(p=>!r87.includes(p)),["js/ssjrProductionAcceptanceRecorder.js","js/ssjrProductionNegativeProbeRunner.js","js/ssjrProductionNegativeEvidence.js","js/stage5fProductionAuthenticatedNegatives.js","js/ssjrAcceptancePolishedBridge.js","js/ssjrPhysicalJourneyAcceptance.js","js/remoteJoiningAcceptance.js"]);
  assert.ok(["js/rosterRouletteStep.js","js/touchlineGazette.js","js/iconGuessStep.js"].every(p=>r87.includes(p)&&!r86.includes(p)));
});

test("UR7 the r88 fixture is r87's list plus Chamber Men's step, rules and styles, removing none",()=>{
  const r88=fixture("2.1.0-r88"),r87=fixture("2.0.0-r87");
  assert.equal(r88.length,270);
  assert.deepEqual(r87.filter(p=>!r88.includes(p)),[]);
  assert.deepEqual(r88.filter(p=>!r87.includes(p)),["js/chamberMenStep.js","js/chamberMen.js","css/chamberMen.css"]);
});

test("UR8 the r89 fixture is r88's list plus r89's 3D engine, Kits 17, Sacked lines and Chamber Men 3D, minus three.js r128",()=>{
  const r89=fixture("2.2.0-r89"),r88=fixture("2.1.0-r88");
  assert.equal(r89.length,275);
  assert.deepEqual(r88.filter(p=>!r89.includes(p)),["visual-assets/v10_1/roulette/vendor/three-r128.min.js"]);
  assert.deepEqual(r89.filter(p=>!r88.includes(p)).sort(),["data/gazetteSacked.js","js/chamberMenScene3d.js","js/chamberMenStadium3d.js","js/kits17.js","visual-assets/v10_1/roulette/assets/ENV_LOUNGE_V1.exr","visual-assets/v10_1/roulette/vendor/three-r187.min.js"]);
});

test("UR9 the r90 fixture is r89's list plus r90's quality module, shared faces and meshopt decoder, minus the old Barlow copies and analytics",()=>{
  const r90=fixture("2.3.0-r90"),r89=fixture("2.2.0-r89");
  assert.equal(r90.length,289);
  assert.deepEqual(r89.filter(p=>!r90.includes(p)),["assets/fonts/barlow-condensed-latin-600-normal.woff2","assets/fonts/barlow-condensed-latin-700-normal.woff2","js/analytics.js"]);
  const added=r90.filter(p=>!r89.includes(p));
  assert.equal(added.length,17);assert.ok(added.includes("js/gfxTier.js")&&added.includes("visual-assets/v10_1/chamber-men/vendor/meshopt_decoder-0.22.0.js"));
  assert.deepEqual(added.filter(p=>p!=="js/gfxTier.js"&&p!=="visual-assets/v10_1/chamber-men/vendor/meshopt_decoder-0.22.0.js"&&!p.startsWith("visual-assets/v10_1/shared/fonts/")),[]);
});

console.log(`r87 upgrade rollback-list contracts: ${passed} passed (revision ${w.revision}, previous ${w.previous}, ${w.added.length} added since it)`);
