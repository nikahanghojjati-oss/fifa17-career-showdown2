"use strict";
// r90 (Nik 2026-11-07, "auto delete the old code"): dead code stays deleted. Every file under js/ must be reachable from a page
// the game serves: index.html, a frame page under visual-assets/, or a listed standalone acceptance page, either directly by
// <script src> or through a live file that names it (loader lists, loadRuntimeScript paths, frame boot scripts). The service
// worker is not a root: a file that is only precached is still never run. Tests and tools are not roots either.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const ROOT=path.resolve(__dirname,"..","..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const walk=dir=>fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true}).flatMap(entry=>{
  const rel=`${dir}/${entry.name}`;
  return entry.isDirectory()?walk(rel):[rel];
});

// Standalone pages outside the game that still ship and load their own scripts. Each needs a reason.
const STANDALONE_ROOTS={
  "production-authorization-acceptance.html":"Stage 5F production acceptance page (manual, outside the game); it is also the network-only update entry that serves js/appUpdateBootstrap.js to old r29 service workers."
};
// js/ files allowed to exist without a page loading them. Keep empty unless a file truly has no page; give the reason.
const ALLOWED_UNLOADED={};

const pageRoots=["index.html",...walk("visual-assets").filter(file=>file.endsWith(".html")),...Object.keys(STANDALONE_ROOTS)];
const frameScripts=walk("visual-assets").filter(file=>file.endsWith(".js")&&!/\/vendor\//.test(file));
const jsFiles=walk("js").filter(file=>file.endsWith(".js"));
const jsSet=new Set(jsFiles);
// any "js/<path>.js" string (script src, loader path, optional-module table, importScripts); ?v= and ./ prefixes are fine
const named=source=>[...source.matchAll(/(?:^|[^A-Za-z0-9_/.-])(?:\.\/|\.\.\/)*(js\/[A-Za-z0-9_./-]+?\.js)(?![A-Za-z0-9_])/g)].map(match=>match[1]);

const reached=new Set();
const queue=[];
for(const file of [...pageRoots,...frameScripts]){
  for(const ref of named(read(file)))if(jsSet.has(ref)&&!reached.has(ref)){reached.add(ref);queue.push(ref);}
}
while(queue.length){
  const file=queue.shift();
  for(const ref of named(read(file)))if(jsSet.has(ref)&&!reached.has(ref)){reached.add(ref);queue.push(ref);}
}

let passed=0;
const check=(name,fn)=>{fn();passed+=1;console.log(`ok ${passed} ${name}`);};

check("D1 every js/ file is loaded by index.html, a frame page or a listed standalone page",()=>{
  const dead=jsFiles.filter(file=>!reached.has(file)&&!Object.hasOwn(ALLOWED_UNLOADED,file));
  assert.deepEqual(dead,[],`never-loaded js files (delete them, or add a reason to ALLOWED_UNLOADED): ${dead.join(", ")}`);
});

check("D2 every standalone root and allow-list entry exists, has a reason and is still needed",()=>{
  for(const [file,reason] of Object.entries(STANDALONE_ROOTS)){
    assert.ok(fs.existsSync(path.join(ROOT,file)),`${file} is listed but gone`);
    assert.ok(reason.length>20,`${file} needs a reason`);
  }
  for(const [file,reason] of Object.entries(ALLOWED_UNLOADED)){
    assert.ok(jsSet.has(file),`${file} is allowed but gone: drop it from ALLOWED_UNLOADED`);
    assert.ok(reason.length>20,`${file} needs a reason`);
    assert.equal(reached.has(file),false,`${file} is loaded now: drop it from ALLOWED_UNLOADED`);
  }
});

check("D3 the service worker precaches no js file that nothing loads",()=>{
  const worker=read("service-worker.js");
  const shell=(worker.match(/const SHELL_PATHS = Object\.freeze\(\[([\s\S]*?)\]\);/)||[])[1]||"";
  const listed=[...shell.matchAll(/"(js\/[^"]+\.js)"/g)].map(match=>match[1]);
  assert.ok(listed.length>20,"the shell list was found");
  const stale=listed.filter(file=>!jsSet.has(file)||!reached.has(file));
  assert.deepEqual(stale,[],`shell paths for missing or never-loaded js: ${stale.join(", ")}`);
});

check("D4 the files deleted in r90 stay deleted",()=>{
  for(const file of ["cloudSyncTwoDeviceHarness","trustedDeviceCredentialIssuance","sparkCompletedTransferHistoryReader","sparkDeviceCredential","cloudSyncRemoteContract","trustedSharedMutationGateway","trustedExecutionRuntimeIamPolicy","trustedConnectedDataAccountExport","trustedAccountDeletionExecution","cloudSyncRevisionModel","firebaseProductionPreflight","trustedAppAttestationRequest","trustedAccountBootstrapExecution","trustedAccountBootstrap","trustedRequestAuthentication","analytics","productionAppCheckBootstrap"]){
    assert.equal(fs.existsSync(path.join(ROOT,"js",`${file}.js`)),false,`js/${file}.js came back`);
  }
  assert.equal(fs.existsSync(path.join(ROOT,"trusted-runtime")),false,"the trusted-runtime scaffold came back");
});

console.log(`PASS r90 no dead js contracts: ${passed} checks (${jsFiles.length} js files, all loaded from ${pageRoots.length} pages and ${frameScripts.length} frame scripts).`);
