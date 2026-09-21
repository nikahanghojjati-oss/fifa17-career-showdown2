const assert=require("node:assert/strict");
const fs=require("node:fs");
const source=fs.readFileSync("js/productionFirebaseRuntime.js","utf8");
function freshRuntime(){const path=require.resolve("../../js/productionFirebaseRuntime.js");delete require.cache[path];return require(path);}
(async()=>{
  assert.doesNotMatch(source,/importImpl\(FIREBASE_APP_CHECK_MODULE\)/);
  assert.doesNotMatch(source,/setInterval|tokenRefreshTimer|refreshInterval/i);
  const runtime=freshRuntime();
  const eligible={origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true};
  const config={schemaVersion:1,configured:true,firebaseConfig:{apiKey:"controlled-public-web-config-injection",authDomain:"fifa17-career-showdown-prod.firebaseapp.com",projectId:"fifa17-career-showdown-prod",storageBucket:"fifa17-career-showdown-prod.firebasestorage.app",messagingSenderId:"409396353288",appId:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd"}};
  const state=await runtime.initialize({context:eligible,runtimeConfig:config,firebaseSdk:{initializeApp(){return {name:"production-app"};}}});
  assert.equal(state.connected,true);
  assert.equal(state.appCheckDisabled,true);
  assert.equal(state.tokenObserved,false);
  assert.equal(state.tokenRefreshAttempted,false);
  const result=await runtime.refreshAppCheckToken({context:eligible});
  assert.equal(result.ok,false);
  assert.equal(result.code,"app-check-disabled");
  assert.equal(result.state.connected,true);
  console.log("PASS Stage 4 token lifecycle retired from live runtime: App Check/reCAPTCHA token acquisition and refresh are disabled while Firebase connectivity remains available.");
})().catch(error=>{console.error(error?.stack||error);process.exit(1);});
