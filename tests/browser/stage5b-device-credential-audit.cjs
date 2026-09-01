const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const deviceId=`device_${"5".repeat(32)}`;

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:1365,height:768},locale:"en-US"});
  const page=await context.newPage();
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  try{
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.addScriptTag({url:new URL("js/sparkDeviceCredential.js",baseUrl).href});
    const first=await page.evaluate(async currentDeviceId=>{
      const api=window.CareerModeSparkDeviceCredential;
      const before={};
      for(let index=0;index<localStorage.length;index+=1){
        const key=localStorage.key(index);
        before[key]=localStorage.getItem(key);
      }
      const one=await api.getOrCreateCredential(currentDeviceId);
      const two=await api.getOrCreateCredential(currentDeviceId);
      let privateExportBlocked=false;
      try{await crypto.subtle.exportKey("jwk",one.privateKey);}catch(_error){privateExportBlocked=true;}
      const challenge={
        protocol:api.protocol,
        purpose:api.purpose,
        challengeId:`credential_challenge_${"a".repeat(64)}`,
        challengeNonce:"A".repeat(43),
        accountId:"acct_stage5b_browser",
        deviceId:currentDeviceId,
        publicKeyFingerprint:one.publicKeyFingerprint,
        expiresAtEpochMs:Date.now()+120000
      };
      const proof=await api.signChallenge(one,challenge);
      const standard=proof.signature.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-proof.signature.length%4)%4);
      const signature=Uint8Array.from(atob(standard),character=>character.charCodeAt(0));
      const publicKey=await crypto.subtle.importKey(
        "jwk",
        {...one.publicKeyJwk,key_ops:["verify"],ext:true},
        {name:"ECDSA",namedCurve:"P-256"},
        false,
        ["verify"]
      );
      const verified=await crypto.subtle.verify(
        {name:"ECDSA",hash:"SHA-256"},
        publicKey,
        signature,
        new TextEncoder().encode(api.canonicalChallengePayload(challenge))
      );
      const after={};
      for(let index=0;index<localStorage.length;index+=1){
        const key=localStorage.key(index);
        after[key]=localStorage.getItem(key);
      }
      const databases=typeof indexedDB.databases==="function"?await indexedDB.databases():[];
      return {
        one:{
          schemaVersion:one.schemaVersion,
          deviceId:one.deviceId,
          publicKeyJwk:one.publicKeyJwk,
          publicKeyFingerprint:one.publicKeyFingerprint,
          createdAtEpochMs:one.createdAtEpochMs,
          privateKeyType:one.privateKey.type,
          privateKeyExtractable:one.privateKey.extractable,
          privateKeyUsages:[...one.privateKey.usages]
        },
        twoFingerprint:two.publicKeyFingerprint,
        privateExportBlocked,
        signatureLength:signature.length,
        verified,
        before,
        after,
        databaseNames:databases.map(item=>item&&item.name).filter(Boolean)
      };
    },deviceId);

    assert.equal(first.one.schemaVersion,1);
    assert.equal(first.one.deviceId,deviceId);
    assert.equal(first.one.privateKeyType,"private");
    assert.equal(first.one.privateKeyExtractable,false);
    assert.deepEqual(first.one.privateKeyUsages,["sign"]);
    assert.match(first.one.publicKeyFingerprint,/^sha256:[0-9a-f]{64}$/);
    assert.deepEqual(first.twoFingerprint,first.one.publicKeyFingerprint);
    assert.equal(first.privateExportBlocked,true,"The browser allowed export of the device private key.");
    assert.equal(first.signatureLength,64);
    assert.equal(first.verified,true);
    assert.deepEqual(first.after,first.before,"Stage 5B device credential storage mutated localStorage.");
    assert.ok(first.databaseNames.includes("careerModeShowdown.deviceCredential"));

    await page.reload({waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.addScriptTag({url:new URL("js/sparkDeviceCredential.js",baseUrl).href});
    const afterReload=await page.evaluate(async currentDeviceId=>{
      const credential=await window.CareerModeSparkDeviceCredential.getOrCreateCredential(currentDeviceId);
      return {
        publicKeyFingerprint:credential.publicKeyFingerprint,
        publicKeyJwk:credential.publicKeyJwk,
        privateKeyExtractable:credential.privateKey.extractable
      };
    },deviceId);
    assert.equal(afterReload.publicKeyFingerprint,first.one.publicKeyFingerprint,"Reload changed the device credential key.");
    assert.deepEqual(afterReload.publicKeyJwk,first.one.publicKeyJwk);
    assert.equal(afterReload.privateKeyExtractable,false);

    await context.setOffline(true);
    const offlineFingerprint=await page.evaluate(currentDeviceId=>window.CareerModeSparkDeviceCredential.getOrCreateCredential(currentDeviceId).then(value=>value.publicKeyFingerprint),deviceId);
    await context.setOffline(false);
    assert.equal(offlineFingerprint,first.one.publicKeyFingerprint,"Offline access changed or blocked the local device credential.");

    const conflictCode=await page.evaluate(async()=>{
      try{await window.CareerModeSparkDeviceCredential.getOrCreateCredential(`device_${"6".repeat(32)}`);return null;}
      catch(error){return error&&error.code;}
    });
    assert.equal(conflictCode,"DEVICE_CREDENTIAL_STORAGE_CONFLICT","A different device ID reused the stored private key.");
    assert.deepEqual(pageErrors,[]);
    process.stdout.write("PASS Stage 5B browser non-extractable IndexedDB key persistence, signed proof, reload, offline and storage isolation\n");
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{
  process.stderr.write(`STAGE 5B DEVICE CREDENTIAL BROWSER AUDIT FAILED\n${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});
