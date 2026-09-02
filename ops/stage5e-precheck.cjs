const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,v)=>fs.writeFileSync(path.join(root,p),v);
const appPath=path.join(root,'js/app.js');
let app=fs.readFileSync(appPath,'utf8');
const start='let remoteJoiningSurfacePromise=null;function getRemoteJoiningAssetRevision()';
const end='function sa(){';
const i=app.indexOf(start),j=app.indexOf(end,i);
if(i<0||j<0)throw new Error('Generated Stage 5E launcher boundary not found.');
app=app.slice(0,i)+app.slice(j);
const added='["initializeOptionalModules",window.initializeOptionalModules],["initializeRemoteJoiningLauncher",installRemoteJoiningLauncher],["initializePerformanceLifecycle",ipl]';
const original='["initializeOptionalModules",window.initializeOptionalModules],["initializePerformanceLifecycle",ipl]';
if(!app.includes(added))throw new Error('Generated Stage 5E initializer boundary not found.');
app=app.replace(added,original);
fs.writeFileSync(appPath,app);
const htmlPath=path.join(root,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
const action='<button class="menuButton" id="seasonPrimaryAction" type="button">START SEASON 1 TRANSFER CHALLENGE</button>';
const handler="Promise.all([loadRuntimeStyle('rj','css/remoteJoining.css'),loadRuntimeScript('rj','js/sparkRemoteJoining.js',()=>window.CareerModeSparkRemoteJoining)]).then(()=>window.CareerModeSparkRemoteJoining.openPanel()).catch(error=>window.reportApplicationError?window.reportApplicationError('Unable to open Private Remote Joining',error):console.error(error))";
const remote=`<button class="menuButton" id="remoteJoiningButton" type="button" onclick="${handler}">PRIVATE REMOTE JOINING</button>`;
if(!html.includes(action))throw new Error('Dashboard primary action marker not found.');
html=html.replace(action,action+'\n'+remote);
fs.writeFileSync(htmlPath,html);
const contractPath=path.join(root,'tests/contracts/stage5e-production-remote-joining-runtime-contracts.cjs');
let contract=fs.readFileSync(contractPath,'utf8');
contract=contract.replace('assert.equal(html.includes("sparkRemoteJoining.js"),false,"Remote Joining runtime must not load from ordinary HTML startup.");','assert.equal(/<script[^>]+src=["\\\'][^"\\\']*sparkRemoteJoining\\.js/i.test(html),false,"Remote Joining runtime must not load from ordinary HTML startup.");');
contract=contract.replace('assert.ok(app.includes(\'id="remoteJoiningButton"\')||app.includes(\'button.id="remoteJoiningButton"\'));\nassert.ok(app.includes("loadRemoteJoiningSurface"));','assert.ok(html.includes(\'id="remoteJoiningButton"\')&&html.includes("loadRuntimeScript(\'rj\',\'js/sparkRemoteJoining.js\'")&&html.includes("loadRuntimeStyle(\'rj\',\'css/remoteJoining.css\'"));');
fs.writeFileSync(contractPath,contract);
const auditPath=path.join(root,'tests/browser/stage5e-remote-joining-audit.cjs');
let audit=fs.readFileSync(auditPath,'utf8');
audit=audit.replaceAll('script[data-remote-joining-runtime="true"]','script[data-runtime-script="rj"]');
fs.writeFileSync(auditPath,audit);

// Reconcile the historical Stage 5A pre-publication boundary with the now-authorized
// Stage 5D -> Stage 5E activation sequence. Precaching is not execution: Stage 5A
// must still never be directly bootstrapped by HTML, app.js or Connected Account.
let stage5a=read('tests/contracts/stage5a-private-session-contracts.cjs');
const oldStage5aBoundary=`  for(const runtimeOwner of ["js/app.js","js/sparkConnectedAccount.js","service-worker.js"]){\n    assert.doesNotMatch(fs.readFileSync(runtimeOwner,"utf8"),/sparkPrivateSession\\.js/,\`${'${runtimeOwner}'} must not expose the pre-publication Stage 5A candidate.\`);\n  }`;
const newStage5aBoundary=`  for(const runtimeOwner of ["js/app.js","js/sparkConnectedAccount.js"]){\n    assert.doesNotMatch(fs.readFileSync(runtimeOwner,"utf8"),/sparkPrivateSession\\.js/,\`${'${runtimeOwner}'} must not directly bootstrap the historical Stage 5A protocol.\`);\n  }\n  const stage5eHtml=fs.readFileSync("index.html","utf8");\n  const stage5eWorker=fs.readFileSync("service-worker.js","utf8");\n  assert.doesNotMatch(stage5eHtml,/<script[^>]+src=["'][^"']*sparkPrivateSession\\.js/i,"Stage 5E must not execute the historical Stage 5A protocol during ordinary HTML startup.");\n  assert.match(stage5eWorker,/"js\\/sparkPrivateSession\\.js"/,"After Stage 5D production Rules publication, Stage 5E may precache the protocol as a lazy rollback-complete asset without executing it at startup.");`;
if(!stage5a.includes(oldStage5aBoundary))throw new Error('Historical Stage 5A runtime-owner boundary not found.');
stage5a=stage5a.replace(oldStage5aBoundary,newStage5aBoundary);
write('tests/contracts/stage5a-private-session-contracts.cjs',stage5a);

// Reconcile current release authority surfaces for the new legitimate milestone.
let stability=read('tests/contracts/stability-contracts.cjs');
stability=stability.replace('Registered Devices & Private Pairing|Connected Rivalry)','Registered Devices & Private Pairing|Connected Rivalry|Private Remote Joining)');
write('tests/contracts/stability-contracts.cjs',stability);
let visuals=read('tests/contracts/licensed-football-visuals-contract.cjs');
visuals=visuals.replace('html.includes(`v${appVersion} · Connected Rivalry`)', 'html.includes(`v${appVersion} · Connected Rivalry`) || html.includes(`v${appVersion} · Private Remote Joining`)');
write('tests/contracts/licensed-football-visuals-contract.cjs',visuals);
let release=read('RELEASE_V1.9.0.md');
if(!/Status:\s*RELEASE CANDIDATE/i.test(release))release=release.replace('# Career Mode Showdown v1.9.0 — Private Remote Joining\n','# Career Mode Showdown v1.9.0 — Private Remote Joining\n\nStatus: RELEASE CANDIDATE\n');
write('RELEASE_V1.9.0.md',release);
const stateOverride=`## CURRENT OVERRIDE — STAGE 5E PRIVATE REMOTE JOINING RUNTIME CANDIDATE — 2026-09-02 UTC\n\nCurrent source candidate is \`v1.9.0 / 1.9.0-r1\` on the bounded Stage 5E branch. Previous production-proven whole-shell recovery target remains \`v1.8.1 / 1.8.1-r5\`. Stage 5E exposes explicit private Host, Join, Refresh/Read and Close UX only after the user opens Remote Joining; provider/account/device/rivalry dependencies resolve only on an explicit session action.\n\nFirebase remains Spark with billing disabled, Firestore memory-only and App Check enforcement OFF. No Cloud Run, Functions, paid service, public discovery, collection listing, lobby, matchmaking, canonical gameplay storage mutation or Candidate C bypass is introduced. Fixed RJR-1 remains \`87/100\`; source, CI, review, merge and deployment mechanics earn zero readiness credit.\n\nProvider-session production acceptance remains a later evidence gate. The next genuine RJR movement requires production-live two-account/two-device Remote Joining evidence, followed by stable real-device release acceptance.\n\n---\n\n`;
let state=read('PROJECT_STATE.md');if(!state.startsWith('## CURRENT OVERRIDE — STAGE 5E PRIVATE REMOTE JOINING'))write('PROJECT_STATE.md',stateOverride+state);
const nextOverride=`# CURRENT OVERRIDE — STAGE 5E PRIVATE REMOTE JOINING RUNTIME CANDIDATE — 2026-09-02 UTC\n\nCurrent candidate: \`v1.9.0 / 1.9.0-r1\`. Previous production-proven whole-shell recovery target: \`v1.8.1 / 1.8.1-r5\`. RJR remains \`87/100\` until genuine provider-live two-account/two-device capability evidence closes a fixed-domain gap.\n\n## IMMEDIATE NEXT TASK AFTER FULL STUDY\n\nFinish exact-head Stage 5E validation, review, merge and deployment without billing or provider Rules mutation. Then perform the smallest production-live private Remote Joining acceptance that proves exact two-account Host → Join → Read/Refresh → Close across real registered devices and preserves local-first/canonical-storage/Candidate C locks. Stable real-device release acceptance is the final distinct RJR domain gap.\n\nBilling remains permanently forbidden. Firebase stays Spark; Firestore stays memory-only; App Check enforcement stays OFF; no public discovery/listing/matchmaking is authorized.\n\n---\n\n`;
let next=read('NEXT_TASK.md');if(!next.startsWith('# CURRENT OVERRIDE — STAGE 5E PRIVATE REMOTE JOINING'))write('NEXT_TASK.md',nextOverride+next);
const readmeOverride=`# CURRENT RELEASE CANDIDATE — v1.9.0 Private Remote Joining\n\nCurrent source candidate: \`v1.9.0 / 1.9.0-r1\`. Previous production-proven whole-shell recovery target: \`v1.8.1 / 1.8.1-r5\`. Stage 5E adds lazy, exact-capability private Host/Join/Read/Close UX while preserving Firebase Spark, zero billing, memory-only Firestore, App Check enforcement OFF, local-first startup and Candidate C authority. RJR remains \`87/100\` until genuine production capability evidence.\n\n`;
let readme=read('README.md');if(!readme.startsWith('# CURRENT RELEASE CANDIDATE — v1.9.0'))write('README.md',readmeOverride+readme);
const bootstrap=JSON.parse(read('SESSION_BOOTSTRAP.json'));
bootstrap.runtime={...(bootstrap.runtime||{}),applicationVersion:'1.9.0'};
bootstrap.recordedAt='2026-09-02T02:02:00.000Z';
bootstrap.currentLane='Stage 5E source candidate v1.9.0 / 1.9.0-r1 is under exact-head validation. Production remains 1.8.1-r5 until merge/deploy; fixed RJR remains 87 pending genuine two-account/two-device Remote Joining evidence.';
write('SESSION_BOOTSTRAP.json',JSON.stringify(bootstrap,null,2)+'\n');

const refs=[...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)(?:\?v=([^"#]+))?"/g)].map(m=>m[1]);
const raw=refs.reduce((n,p)=>n+fs.statSync(path.join(root,p)).size,0);
const gz=refs.reduce((n,p)=>n+zlib.gzipSync(fs.readFileSync(path.join(root,p)),{level:9}).length,0);
console.log(`STAGE5E_STARTUP_BUDGET raw=${raw}/165000 gzip=${gz}/37500 binding=html-only`);
if(raw>165000||gz>37500)throw new Error(`Stage 5E HTML-bound launcher still exceeds startup budget: ${raw}/${gz}`);
