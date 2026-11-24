"use strict";
// r100 W4 (plan PR 8; Nik 2026-11-24 13:31 UTC: "The phone remembers sign in"): Google sign-in is remembered on the device with
// Firebase Auth's own persistence (IndexedDB, or the browser's local storage only where there is no IndexedDB), set explicitly
// before any popup and failing closed when it cannot be set. SIGN OUT ends it on that device. Popup only, no extra scopes,
// Firestore memory-only: unchanged. This replaces the session-only sign-in (browserSessionPersistence).
// Real modules: js/productionFirebaseRuntime.js and js/sparkConnectedAccount.js; only the Firebase SDK and the phone's
// remembered sign-in store are fakes (the store behaves as Firebase's: a LOCAL persistence keeps the user, signOut clears it).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {test}=require("node:test");
const read=file=>fs.readFileSync(file,"utf8");
const NEW_GUARD="remembered-on-device-popup-only-no-extra-scopes";
const fresh=file=>{const path=require.resolve(`../../js/${file}`);delete require.cache[path];return require(path);};

global.CareerModeSparkAccountBootstrap={async bootstrap(input){return {ok:true,action:"created",accountId:input.user.uid,revision:0,status:"active"};}};

// One phone: what Firebase keeps for it between page loads.
function phone(){return {stored:null,mode:null,popups:0};}
// The services a page load gets on that phone (as js/productionFirebaseRuntime.js hands them over).
function pageServices(device,{remembered={type:"LOCAL"},setFails=false}={}){
  const auth={currentUser:device.mode==="LOCAL"?device.stored:null},calls=[];
  class GoogleAuthProvider{getScopes(){return [];}}
  const authSdk={GoogleAuthProvider,rememberedPersistence:remembered,
    async setPersistence(target,persistence){assert.equal(target,auth);calls.push(["setPersistence",persistence?.type]);if(setFails)throw new Error("persistence unavailable");device.mode=persistence.type;},
    onAuthStateChanged(){calls.push(["onAuthStateChanged"]);return()=>{};},
    async signInWithPopup(target,provider){assert.equal(target,auth);assert.ok(provider instanceof GoogleAuthProvider);calls.push(["signInWithPopup"]);device.popups+=1;
      const user={uid:"acct_w4_nik",displayName:"Nik",email:"nik@example.test"};auth.currentUser=user;if(device.mode==="LOCAL")device.stored=user;return {user};},
    async signOut(target){assert.equal(target,auth);calls.push(["signOut"]);auth.currentUser=null;device.stored=null;}};
  return {calls,runtime:{async ensureAccountServices(){calls.push(["ensureAccountServices"]);return {ok:true,auth,firestore:{},authSdk,firestoreSdk:{}};}}};
}
async function openApp(device,options){const page=pageServices(device,options),account=fresh("sparkConnectedAccount.js");const state=await account.initialize({runtime:page.runtime});return {account,state,calls:page.calls};}

test("W4-1: the sign-in is set to the remembered persistence before any popup, and a cold start comes back signed in with no tap",async()=>{
  const device=phone();
  const first=await openApp(device);
  assert.equal(first.state.status,"signed-out");
  assert.deepEqual(first.calls.slice(0,3).map(c=>c[0]),["ensureAccountServices","setPersistence","onAuthStateChanged"]);
  assert.equal(first.calls[1][1],"LOCAL","remembered (LOCAL) persistence, never session-only");
  const signedIn=await first.account.signIn();
  assert.equal(signedIn.status,"ready");assert.equal(signedIn.signedIn,true);assert.equal(device.popups,1);
  assert.ok(first.calls.findIndex(c=>c[0]==="setPersistence")<first.calls.findIndex(c=>c[0]==="signInWithPopup"),"set before the popup");
  // The tab is closed and the game opened again (browser restart, Home Screen app relaunch): same phone, new page.
  const again=await openApp(device);
  assert.equal(again.state.status,"ready","the phone remembers the sign-in");assert.equal(again.state.signedIn,true);
  assert.equal(again.state.accountId,"acct_w4_nik","the same Google account");
  assert.equal(device.popups,1,"no second Google popup");assert.equal(again.calls.some(c=>c[0]==="signInWithPopup"),false);
});

test("W4-2: SIGN OUT ends it on that phone: after a reload or cold start the phone is signed out",async()=>{
  const device=phone();
  const first=await openApp(device);await first.account.signIn();
  const out=await first.account.signOut();
  assert.equal(out.status,"signed-out");assert.equal(out.signedIn,false);assert.equal(out.accountId,null);
  assert.equal(device.stored,null,"nothing of the sign-in is left on the phone");
  const again=await openApp(device);
  assert.equal(again.state.status,"signed-out","signed out after reopening");assert.equal(again.state.signedIn,false);
  assert.equal(device.popups,1,"reopening never signs in by itself");
});

test("W4-3: a remembered sign-in the browser lost (iPhone Safari after about a week unused) falls back to today's SIGN IN",async()=>{
  const device=phone();
  const first=await openApp(device);await first.account.signIn();
  device.stored=null;device.mode=null;/* the browser cleared the site's storage */
  const again=await openApp(device);
  assert.equal(again.state.status,"signed-out","plain signed-out Home, no error");assert.equal(again.state.signedIn,false);
  const signedIn=await again.account.signIn();assert.equal(signedIn.status,"ready","one SIGN IN WITH GOOGLE tap, as before");
  assert.equal(device.popups,2);
});

test("W4-4: fails closed: no remembered persistence offered, or it cannot be set, means no popup and the old local-mode state",async()=>{
  for(const [options,status] of [[{remembered:null},"persistence-policy-unavailable"],[{setFails:true},"persistence-policy-failed"]]){
    const device=phone();const app=await openApp(device,options);
    assert.equal(app.state.status,status);assert.equal(app.state.signedIn,false);
    const tried=await app.account.signIn();assert.equal(tried.status,status,"SIGN IN does nothing more");
    assert.equal(device.popups,0,"no Google popup without the agreed persistence");assert.equal(app.calls.some(c=>c[0]==="signInWithPopup"),false);
  }
});

test("W4-5: the runtime offers IndexedDB persistence, or local storage only where there is no IndexedDB; never session or memory",async()=>{
  const eligible={origin:"https://nikahanghojjati-oss.github.io",pathname:"/fifa17-career-showdown2/",online:true};
  const runtimeConfig={schemaVersion:1,configured:true,firebaseConfig:{apiKey:"controlled-public-web-config-injection",authDomain:"fifa17-career-showdown-prod.firebaseapp.com",projectId:"fifa17-career-showdown-prod",storageBucket:"fifa17-career-showdown-prod.firebasestorage.app",messagingSenderId:"409396353288",appId:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd"}};
  const IDB={type:"LOCAL",name:"indexedDB"},LOCAL={type:"LOCAL",name:"local"};
  const sdk=()=>({getAuth:()=>({name:"auth"}),GoogleAuthProvider:function(){},async signInWithPopup(){},async signOut(){},onAuthStateChanged(){return()=>{};},async setPersistence(){},
    indexedDBLocalPersistence:IDB,browserLocalPersistence:LOCAL,browserSessionPersistence:{type:"SESSION"},inMemoryPersistence:{type:"NONE"},
    initializeFirestore:(_app,options)=>({options}),memoryLocalCache:()=>({kind:"memory"}),Timestamp:{},serverTimestamp(){},doc(){},runTransaction(){}});
  const hadIdb=Object.prototype.hasOwnProperty.call(globalThis,"indexedDB"),oldIdb=globalThis.indexedDB;
  try{
    for(const [idb,expected] of [[{open(){}},IDB],[undefined,LOCAL]]){
      if(idb)globalThis.indexedDB=idb;else delete globalThis.indexedDB;
      const runtime=fresh("productionFirebaseRuntime.js");
      assert.equal((await runtime.initialize({context:eligible,runtimeConfig,firebaseSdk:{initializeApp:()=>({name:"app"})}})).status,"ready");
      const services=await runtime.ensureAccountServices({context:eligible,accountSdk:sdk()});
      assert.equal(services.ok,true);assert.equal(services.authPersistence,"remembered-on-device");
      assert.equal(services.authSdk.rememberedPersistence,expected,idb?"IndexedDB where the browser has it":"local storage only without IndexedDB");
      assert.equal("browserSessionPersistence" in services.authSdk,false,"session-only is no longer offered");
      assert.equal("inMemoryPersistence" in services.authSdk,false);
      assert.equal(services.persistentFirestoreCache,false);assert.equal(services.firestore.options.localCache.kind,"memory","Firestore stays memory-only");
      assert.equal(services.additionalGoogleScopes,0);assert.equal(services.signInFlow,"popup");
    }
    // An SDK without the remembered persistences is refused (local mode stays), never quietly weaker.
    const runtime=fresh("productionFirebaseRuntime.js");await runtime.initialize({context:eligible,runtimeConfig,firebaseSdk:{initializeApp:()=>({name:"app"})}});
    const partial=sdk();delete partial.indexedDBLocalPersistence;
    const origWarn=console.warn;console.warn=()=>{};
    try{assert.equal((await runtime.ensureAccountServices({context:eligible,accountSdk:partial})).ok,false);}finally{console.warn=origWarn;}
  }finally{if(hadIdb)globalThis.indexedDB=oldIdb;else delete globalThis.indexedDB;}
});

test("W4-6: the guards say the new truth and keep everything else: popup only, no extra scopes, Firestore memory-only, game code stores no sign-in",()=>{
  const guards=JSON.parse(read("CURRENT_PRODUCT_GUARDS.json")),bootstrap=JSON.parse(read("SESSION_BOOTSTRAP.json")),baseline=JSON.parse(read("POS10_PRODUCT_BASELINE.json"));
  assert.equal(guards.provider.googleAuthPersistence,NEW_GUARD);assert.equal(guards.provider.firestoreBrowserPersistence,"memory-only");
  assert.equal(bootstrap.runtime.googleAuthPersistence,NEW_GUARD);assert.equal(bootstrap.liveRuntime.googleAuthPersistence,NEW_GUARD);
  assert.match(JSON.stringify(baseline),new RegExp(NEW_GUARD));
  /* SHARED_SHOWDOWN_JOURNEY_MODEL.json is the frozen SSJR-1.1 model (byte-identical, tests/contracts/ssjr2-physical-run-credit-contracts.cjs): history, not a live guard */
  assert.match(read("AGENTS.md"),/Google Auth popup-only, remembered on the device \(indexedDBLocalPersistence, or browserLocalPersistence without IndexedDB; SIGN OUT ends it\), without extra scopes\./);
  const runtimeSource=read("js/productionFirebaseRuntime.js"),controller=read("js/sparkConnectedAccount.js");
  assert.doesNotMatch(runtimeSource,/browserSessionPersistence|inMemoryPersistence|signInWithRedirect|persistentLocalCache|enableIndexedDbPersistence/);
  assert.match(controller,/setPersistence\(sparkConnectedServices\.auth,rememberedPersistence\)/);
  assert.match(controller,/signInWithPopup\(sparkConnectedServices\.auth,provider\)/);
  assert.match(controller,/authSdk\.signOut\(sparkConnectedServices\.auth\)/,"SIGN OUT goes through Firebase's own signOut (which clears the remembered user)");
  const identity=read("js/onlinePlayerIdentity.js");
  assert.match(identity,/await deps\.account\.initialize\(\);watchAccountSignOut\(deps\.account\);/,"every tab watches the remembered account (Codex #1599)");
  assert.match(identity,/const out=next\.signedIn===false,other=Boolean\(next\.accountId\)&&next\.accountId!==state\.accountId;if\(!out&&!other\)return;accountSignOutReloading=true;[^}]*\}catch\(_\)\{\}root\.location\?\.reload\?\.\(\);/,"a tab whose account was signed out elsewhere starts again signed out");
  assert.doesNotMatch(controller,/addScope\(|signInWithRedirect|localStorage|sessionStorage|indexedDB|getIdToken|refreshToken/,"game code never stores or reads the sign-in itself");
});
