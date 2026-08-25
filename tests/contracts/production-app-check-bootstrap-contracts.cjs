const assert=require("node:assert/strict");
const fs=require("node:fs");
const bootstrap=require("../../js/productionAppCheckBootstrap.js");

const read=file=>fs.readFileSync(file,"utf8");
const manifest=JSON.parse(read("firebase.production.environment.json"));
const source=read("js/productionAppCheckBootstrap.js");
const runtime=read("js/productionFirebaseRuntime.js");
const index=read("index.html");
const optional=read("js/optionalModules.js");
const worker=read("service-worker.js");

assert.equal(bootstrap.contractVersion,1);
assert.equal(bootstrap.productionRuntimeConnected,false,"The bootstrap module itself grants no production service/runtime authority; the reviewed loader owns optional client connection.");
assert.equal(bootstrap.productionOrigin,"https://nikahanghojjati-oss.github.io");
assert.equal(bootstrap.productionProjectId,"fifa17-career-showdown-prod");
assert.equal(bootstrap.productionAppId,"1:409396353288:web:1d3a2a5d6921de6ccbb4bd");
assert.equal(bootstrap.appCheckProvider,"recaptcha-enterprise");
assert.equal(bootstrap.appCheckTokenTtlSeconds,3600);
assert.equal(bootstrap.appCheckRiskThreshold,0.5);
assert.equal(bootstrap.debugProviderProductionAllowed,false);
assert.equal(bootstrap.enforcementEnabled,false);
assert.equal(bootstrap.tokenAutoRefreshRequired,true);
assert.equal(bootstrap.browserFirestoreWrites,"deny-all");
assert.equal(bootstrap.trustedMutationAuthorityGranted,false);

// Historical 1.4.0-r2 production proof remains authoritative for the App Check milestone itself.
assert.equal(manifest.activation.appCheck,"production-runtime-proven");
assert.equal(manifest.activation.appCheckProvider,"recaptcha-enterprise");
assert.equal(manifest.activation.appCheckWebAppId,bootstrap.productionAppId);
assert.equal(manifest.activation.appCheckProductionHost,"nikahanghojjati-oss.github.io");
assert.equal(manifest.activation.appCheckTokenTtlSeconds,bootstrap.appCheckTokenTtlSeconds);
assert.equal(manifest.activation.appCheckRiskThreshold,bootstrap.appCheckRiskThreshold);
assert.equal(manifest.activation.appCheckEnforcement,false);
assert.equal(manifest.activation.appCheckRuntimeBootstrapConnected,true);
assert.equal(manifest.activation.appCheckLegitimateProductionTrafficProven,true);
assert.equal(manifest.activation.runtimeConnected,true);
assert.equal(manifest.activation.trustedRuntimeIam,"not-activated-yet");
assert.match(manifest.activation.appCheckProviderVerificationEvidence,/2026-08-20[\s\S]+reCAPTCHA Enterprise[\s\S]+nikahanghojjati-oss\.github\.io[\s\S]+one-hour TTL[\s\S]+0\.5/i);
assert.match(manifest.activation.appCheckRuntimeVerificationEvidence,/Validate Stability Lane #1230[\s\S]+32439162225[\s\S]+real production[\s\S]+App Check token path/i);

const validConfig={apiKey:"controlled-public-web-config-injection",authDomain:"fifa17-career-showdown-prod.firebaseapp.com",projectId:"fifa17-career-showdown-prod",storageBucket:"fifa17-career-showdown-prod.firebasestorage.app",messagingSenderId:"409396353288",appId:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd"};
const validInput={origin:"https://nikahanghojjati-oss.github.io",firebaseConfig:validConfig,recaptchaEnterpriseSiteKey:"controlled-public-site-key-injection",debug:false,enforcement:false};

const plan=bootstrap.createPlan(validInput);
assert.equal(plan.ok,true);
assert.equal(plan.tokenAutoRefresh,true);
assert.equal(plan.enforcement,false);
assert.equal(plan.debug,false);
assert.equal(plan.browserFirestoreWrites,"deny-all");
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
assert.equal(initialized.browserFirestoreWrites,"deny-all");
assert.deepEqual(calls.map(call=>call[0]),["initializeApp","provider","initializeAppCheck"],"Firebase App initialization must precede App Check initialization, with no Firestore connection from the bootstrap itself.");
assert.equal(calls[2][2].isTokenAutoRefreshEnabled,true);
assert.equal(calls[1][1],validInput.recaptchaEnterpriseSiteKey);

assert.ok(!index.includes("productionAppCheckBootstrap.js"),"index.html must not eagerly load the App Check bootstrap before local startup.");
assert.ok(!optional.includes("productionAppCheckBootstrap.js"),"optionalModules.js must not own the production App Check bootstrap.");
assert.ok(!worker.includes("productionAppCheckBootstrap.js"),"The optional App Check bootstrap must stay outside the offline startup dependency.");
assert.ok(runtime.includes("productionAppCheckBootstrap.js"),"The production Firebase runtime must lazily load the bootstrap after production-origin/config checks.");
assert.match(runtime,/classifyRuntimeContext[\s\S]+readRuntimeConfig[\s\S]+loadBootstrapScript/);
const shellStart=worker.indexOf("const SHELL_PATHS");
const shellEnd=worker.indexOf("]);",shellStart);
assert.ok(shellStart>=0&&shellEnd>shellStart,"Service worker must retain an explicit immutable SHELL_PATHS boundary.");
const shellSource=worker.slice(shellStart,shellEnd);
assert.doesNotMatch(shellSource,/firebase\.runtime-config\.json/,"Deployment-only Firebase config must stay outside the offline shell cache.");
assert.match(worker,/const RUNTIME_CONFIG_PATH = "firebase\.runtime-config\.json";/,"Service worker must identify the public production runtime config separately from the offline shell.");
assert.match(worker,/if\(path===RUNTIME_CONFIG_PATH\)\{return;\}/,"The public revisioned runtime config must bypass shell-only service-worker interception so browser/network caching can serve it.");
assert.match(runtime,/fetch\(url,\{cache:"force-cache",credentials:"same-origin"\}\)/,"Revisioned public runtime config should be reusable across reload/back-forward recovery instead of forcing a fresh request for every document.");
assert.doesNotMatch(source,/DebugAppCheckProvider|self\.FIREBASE_APPCHECK_DEBUG_TOKEN/i);
assert.doesNotMatch(source,/initializeFirestore|getFirestore|firebase\/firestore/i,"App Check bootstrap must not initialize Firestore.");
const baseStart=runtime.indexOf("async function initializeProductionFirebaseRuntime");
const baseEnd=runtime.indexOf("async function ensureSparkAccountServices");
assert.ok(baseStart>=0&&baseEnd>baseStart,"Production runtime must expose separate base App Check and Spark account initialization functions.");
const appCheckOnlyRuntime=runtime.slice(baseStart,baseEnd);
assert.doesNotMatch(appCheckOnlyRuntime,/initializeFirestore|getFirestore|firebase\/firestore/i,"The base App Check initialization path must remain free of Firestore initialization.");
assert.match(runtime,/async function ensureSparkAccountServices[\s\S]+initializeFirestore[\s\S]+memoryLocalCache/,"The separately reviewed Spark account path may initialize memory-only Firestore on demand.");
assert.doesNotMatch(source,/AIza[0-9A-Za-z_-]{35}/);
assert.equal(manifest.securityLocks.applicationClientFirestoreWrites,"deny-all","Historical 1.4.0-r2 production authority remains deny-all until the new Spark rules are actually published.");
assert.equal(manifest.securityLocks.trustedMutationGatewayAuthorizedFromBrowser,false);
assert.equal(manifest.securityLocks.clientAuthInitialized,false);
assert.equal(manifest.securityLocks.clientFirestoreInitialized,false);
assert.equal(manifest.securityLocks.clientStorageInitialized,false);
assert.equal(manifest.securityLocks.clientFunctionsInitialized,false);

process.stdout.write("PASS historical App Check proof remains isolated while the separately reviewed zero-billing Spark account path may lazily initialize Auth and memory-only Firestore\n");