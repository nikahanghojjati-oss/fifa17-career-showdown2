const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
  const r=await import(pathToFileURL('scripts/pos6-risk-router.mjs'));
  assert.equal(r.routeFiles(['README.md']).profile,'DOC_ONLY');
  assert.equal(r.routeFiles(['PROJECT_OPERATING_SYSTEM_V6.md','scripts/pos6-continuity.mjs']).profile,'OPS_ONLY');
  const remote=r.routeFiles(['js/stage5eRemoteJoining.js']);
  assert.equal(remote.profile,'REMOTE'); assert.equal(remote.run.remoteEmulator,true); assert.equal(remote.run.browser,'REMOTE');
  const storage=r.routeFiles(['js/storage.js']);
  assert.equal(storage.profile,'STORAGE'); assert.equal(storage.run.storageBrowser,true); assert.equal(storage.run.remoteEmulator,false);
  const visual=r.routeFiles(['css/app.css']);
  assert.equal(visual.profile,'VISUAL'); assert.equal(visual.run.visualBrowser,true);
  const full=r.routeFiles(['package.json']);
  assert.equal(full.profile,'FULL_SEAL'); assert.equal(full.run.remoteEmulator,true); assert.equal(full.run.browser,'FULL');
  assert.equal(r.routeFiles([]).profile,'FULL_SEAL');
  console.log('PASS RACE-6 risk router: light changes stay light and unknown/cross-cutting changes fail closed to full seal.');
})().catch(e=>{console.error(e);process.exitCode=1;});
