"use strict";
// r87 upgrade: the service worker's rollback list must be the real shell of the revision it rolls back to.
// The worker keeps PREVIOUS_RUNTIME_REVISION's cache and verifies it against PREVIOUS_SHELL_PATHS (SHELL_PATHS minus
// SHELL_PATHS_ADDED_SINCE_PREVIOUS). If that list differs from the files the previous build really precached, a rollback
// either refuses a whole cache (a path the old build never had) or serves a shell with holes (a path the old build needs
// but the check skips). tests/fixtures/shell-paths/<revision>.json holds the exact SHELL_PATHS each live build shipped
// (1.9.10-r86 = main 5b4337fd, the build live since 2026-10-30). When 2.0.0 moves PREVIOUS to 1.9.10-r86 the added set
// must be exactly the paths r87 adds to r86's 228; this test names them if it is not.
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
  vm.runInContext(`${source}\n;globalThis.__w={revision:RUNTIME_REVISION,previous:PREVIOUS_RUNTIME_REVISION,shell:[...SHELL_PATHS],added:[...SHELL_PATHS_ADDED_SINCE_PREVIOUS],previousShell:[...PREVIOUS_SHELL_PATHS]};`,sandbox);
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

test("UR3 nothing the previous build precached was dropped from SHELL_PATHS (the derived list could not hold it)",()=>{
  const real=fixture(w.previous),shell=new Set(w.shell);
  assert.deepEqual(real.filter(p=>!shell.has(p)),[]);
});

test("UR4 every added path is a current shell path, listed once",()=>{
  const shell=new Set(w.shell);
  assert.deepEqual(w.added.filter(p=>!shell.has(p)),[]);
  assert.equal(new Set(w.added).size,w.added.length);
  assert.equal(new Set(w.shell).size,w.shell.length,"SHELL_PATHS lists a path twice");
});

test("UR5 a 2.0.0 worker rolls back to the live 1.9.10 build",()=>{
  if(!/^2\.0\.0-/.test(w.revision)){console.log(`   (revision ${w.revision}: checked when the release PR moves it to 2.0.0)`);return;}
  assert.equal(w.previous,"1.9.10-r86");
});

console.log(`r87 upgrade rollback-list contracts: ${passed} passed (revision ${w.revision}, previous ${w.previous}, ${w.added.length} added since it)`);
