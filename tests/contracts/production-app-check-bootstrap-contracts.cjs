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
assert.equal(bootstrap.productionRuntimeConnected,false,"The bootstrap module itself grants no production service/runtime authority; the reviewed r2 loader owns optional client connection.");
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

// Production metadata continues to describe currently verified live provider state until r2 is deployed and traffic-proven.
assert.equal(manifest.activation.appCheck,"provider-verified-registered");
assert.equal(manifest.activation.appCheckProvider,"recaptcha-enterprise");
assert.equal(manifest.activation.appCheckWebAppId,bootstrap.productionAppId);
assert.equal(manifest.activation.appCheckProductionHost,"nikahanghojjati-oss.github.io");
assert.equal(manifest.activation.appCheckTokenTtlSeconds,bootstrap.appCheckTokenTtlSeconds);
assert.equal(manifest.activation.appCheckRiskThreshold,bootstrap.appCheckRiskThreshold);
assert.equal(manifest.activation.appCheckEnforcement,false);
assert.equal(manifest.activation.appCheckRuntimeBootstrapConnected,false);
assert.equal(manifest.activation.runtimeConnected,false);
assert.equal(manifest.activation.trustedRuntimeIam,"not-activated-yet");
assert.match(manifest.activation.appCheckProviderVerificationEvidence,/2026-08-20[\s\S]+reCAPTCHA Enterprise[\s\S]+nikahanghojjati-oss\.github\.io[\s\S]+one-hour TTL[\s\S]+0\.5/i);

const validConfig={
  apiKey:"controlled-public-web-config-injection",
  authDomain:"fifa17-career-showdown-prod.firebaseapp.com",
  projectId:"fifa17-career-showdown-prod",
  storageBucket:"fifa17-career-showdown-prod.firebasestorage.app",
  messagingSenderId:"409396353288",
  appId:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd"
};
const validInput={
  origin:"https://nikahanghojjati-oss.github.io",
  firebaseConfig:validConfig,
  recaptchaEnterpriseSiteKey:"controlled-public-site-key-injection",
  debug:false,
  enforcement:false
};

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
class EnterpriseProvider{
  constructor(siteKey){this.siteKey=siteKey;calls.push(["provider",siteKey]);}
}
const sdk={
  initializeApp(config){calls.push(["initializeApp",config]);return {name:"production-app"};},
  ReCaptchaEnterpriseProvider:EnterpriseProvider,
  initializeAppCheck(app,options){calls.push(["initializeAppCheck",app,options]);return {name:"app-check"};}
};
const initialized=bootstrap.initialize({...validInput,firebaseSdk:sdk});
assert.equal(initialized.ok,true);
assert.equal(initialized.tokenAutoRefresh,true);
assert.equal(initialized.enforcement,false);
assert.equal(initialized.browserFirestoreWrites,"deny-all");
assert.deepEqual(calls.map(call=>call[0]),["initializeApp","provider","initializeAppCheck"],"Firebase App initialization must precede App Check initialization, with no Firestore connection.");
assert.equal(calls[2][2].isTokenAutoRefreshEnabled,true,"Production App Check tokens must auto-refresh.");
assert.equal(calls[1][1],validInput.recaptchaEnterpriseSiteKey);

assert.ok(!index.includes("productionAppCheckBootstrap.js"),"index.html must not eagerly load the App Check bootstrap before local startup.");
assert.ok(!optional.includes("productionAppCheckBootstrap.js"),"optionalModules.js must not own the production App Check bootstrap.");
assert.ok(worker.includes("js/productionAppCheckBootstrap.js"),"The reviewed r2 shell must cache the immutable bootstrap code for rollback/offline coherence without caching mutable runtime config.");
assert.ok(runtime.includes("productionAppCheckBootstrap.js"),"The reviewed production Firebase runtime must lazily load the bootstrap after production-origin/config checks.");
assert.doesNotMatch(worker,/firebase\.runtime-config\.json/,"Mutable deployment-injected runtime config must not be frozen into the Service Worker shell.");
assert.doesNotMatch(source,/DebugAppCheckProvider|self\.FIREBASE_APPCHECK_DEBUG_TOKEN/i,"Production bootstrap must not contain a debug-provider path.");
assert.doesNotMatch(source,/initializeFirestore|getFirestore|firebase\/firestore/i,"App Check bootstrap must not silently initialize Firestore.");
assert.doesNotMatch(runtime,/initializeFirestore|getFirestore|firebase\/firestore/i,"The r2 App Check runtime must not silently initialize Firestore.");
assert.doesNotMatch(source,/AIza[0-9A-Za-z_-]{35}/,"Concrete Firebase Browser API key must remain outside committed bootstrap source.");
assert.equal(manifest.securityLocks.applicationClientFirestoreWrites,"deny-all");
assert.equal(manifest.securityLocks.trustedMutationGatewayAuthorizedFromBrowser,false);

process.stdout.write("PASS provider-verified production App Check registration and reviewed lazy r2 exact-origin/exact-app bootstrap with controlled public-config injection, token auto-refresh, no debug/enforcement, no Firestore connection and deny-all browser writes\n");