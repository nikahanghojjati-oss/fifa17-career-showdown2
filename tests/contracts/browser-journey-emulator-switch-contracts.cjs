"use strict";
// G-2b contract: the localhost-only emulator switch can never reach production.
// No Firebase, no emulator, no browser. Runs in npm run test:contracts through the POS20 registry entry.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const zlib=require("node:zlib");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const SWITCH_PATH="tests/browser/support/emulator-runtime-switch.js";
const Switch=require(path.join(root,SWITCH_PATH));
const loc=(href)=>{const u=new URL(href);return {protocol:u.protocol,hostname:u.hostname,search:u.search};};

// 1. decide(): active only for http + exact localhost/127.0.0.1 + cmsEmulator=1 + a known test user.
const ON="?cmsEmulator=1&cmsEmulatorUser=daniel&cmsAuthPort=9199&cmsFirestorePort=8181";
assert.equal(Switch.decide(loc(`http://127.0.0.1:4173/${ON}`)).active,true,"1a localhost IP with flag activates");
assert.equal(Switch.decide(loc(`http://localhost:4173/${ON}`)).active,true,"1b localhost with flag activates");
const denied=[
  `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/${ON}`,
  `http://nikahanghojjati-oss.github.io/fifa17-career-showdown2/${ON}`,
  `https://localhost:4173/${ON}`,
  `http://localhost.evil.test/${ON}`,
  `http://127.0.0.2:4173/${ON}`,
  `http://[::1]:4173/${ON}`,
  `http://0.0.0.0:4173/${ON}`,
  "http://127.0.0.1:4173/",
  "http://127.0.0.1:4173/?cmsEmulator=1",
  "http://127.0.0.1:4173/?cmsEmulator=true&cmsEmulatorUser=daniel",
  "http://127.0.0.1:4173/?cmsEmulator=1&cmsEmulatorUser=admin",
  "http://127.0.0.1:4173/?cmsEmulatorUser=daniel",
  `http://127.0.0.1:4173/#${ON.slice(1)}`
];
for(const href of denied)assert.equal(Switch.decide(loc(href)).active,false,`1c denied: ${href}`);
assert.equal(Switch.decide(null).active,false,"1d no location");
const ports=Switch.decide(loc("http://127.0.0.1:4173/?cmsEmulator=1&cmsEmulatorUser=nik&cmsAuthPort=80&cmsFirestorePort=abc"));
assert.deepEqual([ports.authPort,ports.firestorePort],[9099,8080],"1e invalid ports fall back to emulator defaults");

// 2. install(): no-op when inactive; never replaces an existing runtime; installs a demo- project runtime when active.
{const r=Switch.install(loc("https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/"+ON));assert.equal(r.active,false);assert.equal(globalThis.CareerModeProductionFirebaseRuntime,undefined,"2a production origin installs nothing");}
assert.match(Switch.projectId,/^demo-/,"2b emulator project id starts with demo-");
const src=read(SWITCH_PATH);
assert.ok(src.includes('const EMULATOR_HOST="127.0.0.1"'),"2c emulator host is fixed to 127.0.0.1, never configurable");
assert.ok(!/fifa17-career-showdown-prod/.test(src),"2d the switch never names the production project");

// 3. The production runtime is untouched: no emulator hook anywhere in js/ or index.html, and no file references the switch.
const jsFiles=fs.readdirSync(path.join(root,"js")).filter(f=>f.endsWith(".js"));
for(const f of jsFiles){
  const text=read(`js/${f}`);
  assert.ok(!/connect(Auth|Firestore)Emulator|cmsEmulator|emulator-runtime-switch/.test(text),`3a js/${f} has no emulator hook`);
}
for(const f of ["index.html","service-worker.js","manifest.webmanifest"]){
  if(fs.existsSync(path.join(root,f)))assert.ok(!/cmsEmulator|emulator-runtime-switch|connect(Auth|Firestore)Emulator/.test(read(f)),`3b ${f} has no emulator hook`);
}
const runtime=read("js/productionFirebaseRuntime.js");
assert.ok(runtime.includes('const PRODUCTION_ORIGIN="https://nikahanghojjati-oss.github.io"'),"3c production origin gate unchanged");
assert.ok(runtime.includes("signInWithPopup:sdk.signInWithPopup")&&runtime.includes("browserSessionPersistence:sdk.browserSessionPersistence"),"3d production keeps Google popup + session persistence");
assert.ok(runtime.includes("additionalGoogleScopes:0")&&runtime.includes("enforcement:false"),"3e no extra scopes, App Check enforcement off");

// 4. The Pages artifact never contains tests/ (deploy copies an explicit list).
const deploy=read(".github/workflows/deploy-github-pages.yml");
assert.ok(/cp -R acceptance assets css data js \.pages-artifact\//.test(deploy),"4a deploy copies an explicit folder list");
assert.ok(!/cp[^\n]*\btests\b/.test(deploy),"4b deploy never copies tests/");

// 5. The startup bundle is unchanged in size class: the seven startup scripts still fit 37,500 gzip bytes.
const html=read("index.html");
const startup=[...html.matchAll(/<script defer src="(js\/[^"?]+)/g)].map(m=>m[1]);
assert.equal(startup.length,7,"5a seven startup scripts");
assert.ok(!startup.some(p=>/emulator|test/i.test(p)),"5b no test file in the startup bundle");
const refs=[...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)/g)].map(m=>m[1]);
const gz=refs.reduce((n,p)=>n+zlib.gzipSync(fs.readFileSync(path.join(root,p)),{level:9}).length,0);
assert.ok(gz<=37500,`5c startup gzip ${gz} <= 37500`);

// 7. Emulator config: loopback only, alternate ports, UI off, no rules file (the harness uploads the composed Rules and proves they are active).
const cfg=JSON.parse(read("tests/browser/support/firebase.browser-journey.json"));
assert.equal(cfg.firestore,undefined,"7a no rules entry; the harness uploads firestore.spark.generated.rules");
assert.deepEqual(Object.keys(cfg.emulators).sort(),["auth","firestore","hub","logging","singleProjectMode","ui"],"7b only auth + firestore (+hub, logging)");
for(const [k,p] of [["auth",9199],["firestore",8181],["hub",4411],["logging",4511]]){assert.equal(cfg.emulators[k].host,"127.0.0.1",`7c ${k} loopback`);assert.equal(cfg.emulators[k].port,p,`7d ${k} port ${p}`);}
assert.equal(cfg.emulators.ui.enabled,false,"7e emulator UI off");
assert.ok(!/functions|hosting|storage|database|pubsub|eventarc/.test(JSON.stringify(cfg)),"7f no Functions/Hosting/other emulators");

// 6. Services shape parity: the switch hands the app exactly the production services keys (no extra SDK helpers that could mask a production bug).
(async()=>{
  const prodApi=require(path.join(root,"js/productionFirebaseRuntime.js"));
  const fakeFn=()=>({});
  const accountSdk={getAuth:fakeFn,GoogleAuthProvider:function(){},signInWithPopup:fakeFn,signOut:fakeFn,onAuthStateChanged:fakeFn,setPersistence:fakeFn,browserSessionPersistence:{},initializeFirestore:fakeFn,memoryLocalCache:fakeFn,Timestamp:{},serverTimestamp:fakeFn,doc:fakeFn,runTransaction:fakeFn};
  const context={origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true};
  const prod=await prodApi.ensureAccountServices({context,accountSdk,baseRuntimeOptions:{context,runtimeConfig:{schemaVersion:1,configured:true,firebaseConfig:{projectId:"fifa17-career-showdown-prod"}},firebaseSdk:{initializeApp:()=>({})}}});
  assert.equal(prod.ok,true,"6a production services build with a fake SDK");
  const fakeModule={initializeApp:fakeFn,getAuth:fakeFn,connectAuthEmulator:fakeFn,GoogleAuthProvider:function(){},signInWithCredential:fakeFn,signOut:fakeFn,onAuthStateChanged:fakeFn,setPersistence:fakeFn,browserSessionPersistence:{},initializeFirestore:fakeFn,memoryLocalCache:fakeFn,connectFirestoreEmulator:fakeFn,Timestamp:{},serverTimestamp:fakeFn,doc:fakeFn,runTransaction:fakeFn};
  const shim=Switch.createRuntime(Switch.decide(loc(`http://127.0.0.1:4173/${ON}`)),async()=>fakeModule);
  const test=await shim.ensureAccountServices();
  assert.deepEqual(Object.keys(test).sort(),Object.keys(prod).sort(),"6b same top-level services keys");
  assert.deepEqual(Object.keys(test.authSdk).sort(),Object.keys(prod.authSdk).sort(),"6c same authSdk keys");
  assert.deepEqual(Object.keys(test.firestoreSdk).sort(),Object.keys(prod.firestoreSdk).sort(),"6d same firestoreSdk keys");
  for(const k of ["persistentFirestoreCache","authPersistence","provider","signInFlow","additionalGoogleScopes","writeScope","billingRequired","cloudFunctionsRequired"])assert.equal(test[k],prod[k],`6e ${k} matches production`);
  const apiKeys=Object.keys(prodApi).filter(k=>typeof prodApi[k]==="function");
  for(const k of ["initialize","ensureAccountServices","diagnostics","classifyContext","refreshAppCheckToken","loadConnectedAccount"])assert.ok(apiKeys.includes(k)&&typeof shim[k]==="function",`6f runtime method ${k} present on both`);
  // The journey must exercise the Firebase client the production runtime ships (Codex P2 on #337).
  const prodSdk=(read("js/productionFirebaseRuntime.js").match(/const FIREBASE_SDK_VERSION="([0-9.]+)";/)||[])[1];
  assert.ok(prodSdk,"production runtime pins a Firebase SDK version");
  assert.equal(Switch.sdkVersion,prodSdk,"emulator switch loads the production Firebase SDK version");
  const journeyJob=read(".github/workflows/validate-gameplay-fast.yml").split("- name: Two-manager browser journey")[0].split("npm install --no-save").pop();
  assert.ok(journeyJob.includes(`firebase@${prodSdk} `),"the browser journey CI job installs the production Firebase SDK version");
  console.log(`PASS browser journey emulator switch contracts: localhost+flag only, production runtime untouched, Pages excludes tests/, startup gzip ${gz}/37500, services parity.`);
})().catch(error=>{console.error(error);process.exit(1);});
