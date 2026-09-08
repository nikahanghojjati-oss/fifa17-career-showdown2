const assert=require("node:assert/strict");
const fs=require("node:fs");
const bootstrap=require("../../js/productionAppCheckBootstrap.js");

const read=file=>fs.readFileSync(file,"utf8");
const guards=JSON.parse(read("CURRENT_PRODUCT_GUARDS.json"));
const manifest=JSON.parse(read("firebase.production.environment.json"));
const source=read("js/productionAppCheckBootstrap.js");
const runtime=read("js/productionFirebaseRuntime.js");
const index=read("index.html");
const optional=read("js/optionalModules.js");
const worker=read("service-worker.js");

assert.equal(guards.operatingSystem,"POS-2");
assert.equal(guards.provider.billingEnabled,false);
assert.equal(guards.provider.firebasePlan,"Spark");
assert.equal(guards.provider.appCheckEnforcement,false);
assert.equal(guards.provider.firestoreBrowserPersistence,"memory-only");
assert.equal(guards.provider.cloudRunAllowed,false);
assert.equal(guards.provider.cloudFunctionsAllowed,false);

assert.equal(bootstrap.contractVersion,1);
assert.equal(bootstrap.productionRuntimeConnected,false,"The bootstrap module itself grants no production service/runtime authority; the reviewed loader owns optional client connection.");
assert.equal(bootstrap.productionOrigin,"https://nikahanghojjati-oss.github.io");
assert.equal(bootstrap.productionProjectId,"fifa17-career-showdown-prod");
assert.equal(bootstrap.productionAppId,manifest.firebaseWebConfig.appId);
assert.equal(bootstrap.appCheckProvider,"recaptcha-enterprise");
assert.equal(bootstrap.appCheckTokenTtlSeconds,3600);
assert.equal(bootstrap.appCheckRiskThreshold,0.5);
assert.equal(bootstrap.debugProviderProductionAllowed,false);
assert.equal(bootstrap.enforcementEnabled,guards.provider.appCheckEnforcement);
assert.equal(bootstrap.tokenAutoRefreshRequired,true);
assert.equal(bootstrap.trustedMutationAuthorityGranted,false);
assert.equal(manifest.projectId,bootstrap.productionProjectId);
assert.equal(manifest.activation.appCheckProvider,"recaptcha-enterprise");
assert.equal(manifest.activation.appCheckEnforcement,guards.provider.appCheckEnforcement);

const validConfig={apiKey:"controlled-public-web-config-injection",authDomain:"fifa17-career-showdown-prod.firebaseapp.com",projectId:"fifa17-career-showdown-prod",storageBucket:"fifa17-career-showdown-prod.firebasestorage.app",messagingSenderId:"409396353288",appId:bootstrap.productionAppId};
const validInput={origin:"https://nikahanghojjati-oss.github.io",firebaseConfig:validConfig,recaptchaEnterpriseSiteKey:"controlled-public-site-key-injection",debug:false,enforcement:false};

const plan=bootstrap.createPlan(validInput);
assert.equal(plan.ok,true);
assert.equal(plan.tokenAutoRefresh,true);
assert.equal(plan.enforcement,false);
assert.equal(plan.debug,false);
assert.equal(plan.trustedMutationAuthorityGranted,false);
assert.equal(bootstrap.createPlan({...validInput,origin:"http://localhost:8080"}).code,"APP_CHECK_PRODUCTION_ORIGIN_REQUIRED");
assert.equal(bootstrap.createPlan({...validInput,debug:true}).code,"APP_CHECK_DEBUG_FORBIDDEN_IN_PRODUCTION");
assert.equal(bootstrap.createPlan({...validInput,enforcement:true}).code,"APP_CHECK_PREMATURE_ENFORCEMENT_FORBIDDEN");
assert.equal(bootstrap.createPlan({...validInput,recaptchaEnterpriseSiteKey:""}).code,"APP_CHECK_RECAPTCHA_ENTERPRISE_SITE_KEY_REQUIRED");
assert.equal(bootstrap.createPlan({...validInput,firebaseConfig:{...validConfig,apiKey:""}}).code,"APP_CHECK_FIREBASE_API_KEY_REQUIRED");
assert.equal(bootstrap.createPlan({...validInput,firebaseConfig:{...validConfig,projectId:"wrong-project"}}).code,"APP_CHECK_PROJECT_ID_MISMATCH");
assert.equal(bootstrap.createPlan({...validInput,firebaseConfig:{...validConfig,appId:"wrong-app"}}).code,"APP_CHECK_APP_ID_MISMATCH");

const calls=[];
class EnterpriseProvider{constructor(siteKey){this.siteKey=siteKey;calls.push(["provider",siteKey]);}}
const sdk={initializeApp(config){calls.push(["initializeApp",config]);return {name:"production-app"};},ReCaptchaEnterpriseProvider:EnterpriseProvider,initializeAppCheck(app,options){calls.push(["initializeAppCheck",app,options]);return {name:"app-check"};}};
const initialized=bootstrap.initialize({...validInput,firebaseSdk:sdk});
assert.equal(initialized.ok,true);
assert.equal(initialized.tokenAutoRefresh,true);
assert.equal(initialized.enforcement,false);
assert.deepEqual(calls.map(call=>call[0]),["initializeApp","provider","initializeAppCheck"],"Firebase App initialization must precede App Check initialization, with no Firestore connection from the bootstrap itself.");
assert.equal(calls[2][2].isTokenAutoRefreshEnabled,true);
assert.equal(calls[1][1],validInput.recaptchaEnterpriseSiteKey);

assert.ok(!index.includes("productionAppCheckBootstrap.js"),"index.html must not eagerly load the App Check bootstrap before local startup.");
assert.ok(!optional.includes("productionAppCheckBootstrap.js"),"optionalModules.js must not own the production App Check bootstrap.");
assert.ok(runtime.includes("productionAppCheckBootstrap.js"),"The production Firebase runtime must lazily load the bootstrap after production-origin/config checks.");
assert.match(runtime,/classifyRuntimeContext[\s\S]+readRuntimeConfig[\s\S]+loadBootstrapScript/);
const shellStart=worker.indexOf("const SHELL_PATHS");
const shellEnd=worker.indexOf("]);",shellStart);
assert.ok(shellStart>=0&&shellEnd>shellStart,"Service worker must retain an explicit immutable SHELL_PATHS boundary.");
const shellSource=worker.slice(shellStart,shellEnd);
assert.doesNotMatch(shellSource,/firebase\.runtime-config\.json/,"Deployment-only Firebase config must stay outside the offline shell cache.");
assert.doesNotMatch(shellSource,/productionAppCheckBootstrap\.js/,"The optional App Check bootstrap must stay outside the offline startup shell dependency.");
assert.match(worker,/const RUNTIME_CONFIG_PATH = "firebase\.runtime-config\.json";/);
assert.match(worker,/if\(path===RUNTIME_CONFIG_PATH\)\{return;\}/);
assert.match(worker,/const APP_CHECK_BOOTSTRAP_PATH = "js\/productionAppCheckBootstrap\.js";/);
assert.match(worker,/if\(path===APP_CHECK_BOOTSTRAP_PATH\)\{return;\}/);
assert.match(runtime,/fetchImpl\(url,\{cache:"force-cache",credentials:"same-origin"\}\)/);
assert.doesNotMatch(source,/DebugAppCheckProvider|self\.FIREBASE_APPCHECK_DEBUG_TOKEN/i);
assert.doesNotMatch(source,/initializeFirestore|getFirestore|firebase\/firestore/i,"App Check bootstrap must not initialize Firestore.");
const baseStart=runtime.indexOf("async function initializeProductionFirebaseRuntime");
const baseEnd=runtime.indexOf("async function ensureSparkAccountServices");
assert.ok(baseStart>=0&&baseEnd>baseStart,"Production runtime must expose separate base App Check and Spark account initialization functions.");
const appCheckOnlyRuntime=runtime.slice(baseStart,baseEnd);
assert.doesNotMatch(appCheckOnlyRuntime,/initializeFirestore|getFirestore|firebase\/firestore/i,"The base App Check initialization path must remain free of Firestore initialization.");
assert.match(runtime,/async function ensureSparkAccountServices[\s\S]+initializeFirestore[\s\S]+memoryLocalCache/,"The current Spark account path must initialize Firestore only on demand with memory-local cache.");
assert.doesNotMatch(source,/AIza[0-9A-Za-z_-]{35}/);

process.stdout.write("PASS current App Check bootstrap: production-only lazy attestation, enforcement OFF, no debug/secret/trusted-mutation authority, offline-shell isolation and separate memory-only Spark Firestore initialization remain protected without historical proof-run coupling.\n");
