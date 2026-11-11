"use strict";
// r90: the never-run App Check bootstrap (js/productionAppCheckBootstrap.js) is deleted. This contract keeps guarding what it
// guarded on the live runtime: Spark only, App Check enforcement OFF and never initialised, deployment config outside the
// offline shell, and Firestore started only on demand with a memory-only cache.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=file=>fs.readFileSync(file,"utf8");
const guards=JSON.parse(read("CURRENT_PRODUCT_GUARDS.json"));
const runtimeApi=require("../../js/productionFirebaseRuntime.js");
const runtime=read("js/productionFirebaseRuntime.js");
const index=read("index.html");
const optional=read("js/optionalModules.js");
const worker=read("service-worker.js");

assert.equal(guards.provider.billingEnabled,false);
assert.equal(guards.provider.firebasePlan,"Spark");
assert.equal(guards.provider.appCheckEnforcement,false);
assert.equal(guards.provider.firestoreBrowserPersistence,"memory-only");
assert.equal(guards.provider.cloudRunAllowed,false);
assert.equal(guards.provider.cloudFunctionsAllowed,false);

// The bootstrap stays deleted and nothing names it.
assert.equal(fs.existsSync("js/productionAppCheckBootstrap.js"),false,"the App Check bootstrap stays deleted");
for(const [name,source] of [["index.html",index],["js/optionalModules.js",optional],["service-worker.js",worker],["js/productionFirebaseRuntime.js",runtime]]){
  assert.doesNotMatch(source,/productionAppCheckBootstrap/,`${name} names no App Check bootstrap`);
}
// The runtime never starts App Check: no App Check module, no initializeAppCheck, enforcement and billing off.
assert.equal(runtimeApi.firebaseAppCheckModule,null);
assert.equal(runtimeApi.enforcementEnabled,false);
assert.equal(runtimeApi.billingRequired,false);
assert.equal(runtimeApi.blazeRequired,false);
assert.equal(runtimeApi.cloudRunRequired,false);
assert.equal(runtimeApi.cloudFunctionsRequired,false);
assert.equal(runtimeApi.persistentFirestoreCache,false);
assert.doesNotMatch(runtime,/initializeAppCheck|firebase-app-check\.js|ReCaptchaEnterpriseProvider|DebugAppCheckProvider|FIREBASE_APPCHECK_DEBUG_TOKEN/);
assert.match(runtime,/appCheckDisabled:true/);
// Deployment-only Firebase config stays outside the offline shell and passes through the worker.
const shellStart=worker.indexOf("const SHELL_PATHS");
const shellEnd=worker.indexOf("]);",shellStart);
assert.ok(shellStart>=0&&shellEnd>shellStart,"Service worker keeps an explicit SHELL_PATHS boundary.");
assert.doesNotMatch(worker.slice(shellStart,shellEnd),/firebase\.runtime-config\.json/);
assert.match(worker,/const RUNTIME_CONFIG_PATH = "firebase\.runtime-config\.json";/);
assert.match(worker,/if\(path===RUNTIME_CONFIG_PATH\)\{return;\}/);
assert.match(runtime,/fetchImpl\(url,\{cache:"force-cache",credentials:"same-origin"\}\)/);
// The base start initialises the Firebase app only; Firestore starts on demand with a memory-only cache.
const baseStart=runtime.indexOf("async function initializeProductionFirebaseRuntime");
const baseEnd=runtime.indexOf("async function ensureSparkAccountServices");
assert.ok(baseStart>=0&&baseEnd>baseStart,"separate base and Spark account start functions");
assert.doesNotMatch(runtime.slice(baseStart,baseEnd),/initializeFirestore|getFirestore|firebase\/firestore/i,"the base start never initialises Firestore");
assert.match(runtime,/async function ensureSparkAccountServices[\s\S]+initializeFirestore[\s\S]+memoryLocalCache/,"Firestore starts only on demand with memory-local cache");
assert.doesNotMatch(runtime,/AIza[0-9A-Za-z_-]{35}/);

process.stdout.write("PASS live Firebase runtime guard: Spark only, App Check never started (bootstrap deleted), deployment config outside the offline shell, Firestore on demand and memory-only.\n");
