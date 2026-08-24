const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const runLabel=(process.env.CMS_AUDIT_RUN||"local").replace(/[^a-z0-9_-]+/gi,"-").toLowerCase();
const resultsDir=path.resolve("test-results");
fs.mkdirSync(resultsDir,{recursive:true});

const ids={
  localSave:"save_222222222222222222222222",
  otherSave:"save_999999999999999999999999",
  sharedSave:"save_111111111111111111111111",
  localP1:"profile_aaaaaaaaaaaaaaaaaaaaaaaa",
  localP2:"profile_bbbbbbbbbbbbbbbbbbbbbbbb",
  remoteP1:"profile_cccccccccccccccccccccccc",
  localSeason:"season_aaaaaaaaaaaaaaaaaaaaaaaa",
  otherSeason:"season_999999999999999999999999",
  remoteSeason:"season_cccccccccccccccccccccccc",
  rivalryId:`pair_${"d".repeat(64)}`,
  deviceId:`device_${"a".repeat(32)}`
};

function showdown({id,name,saveId,p1,p2,seasonId,score}){
  return {
    schemaVersion:2,id,name,managers:{playerOne:"Hawk",playerTwo:"Rival"},totalRounds:3,currentRound:1,status:"In Progress",
    selectedLeague:{id:"england-premier-league"},clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},score:{playerOne:score,playerTwo:0},
    transferChallenges:[],rounds:[{roundNumber:1,seasonId,playerOne:{points:score},playerTwo:{points:0},winner:score?"playerOne":null}],integrityWarnings:[],
    createdAt:"2026-08-20T10:00:00.000Z",updatedAt:"2026-08-24T10:00:00.000Z",completedAt:null,archivedAt:null,
    identity:{schemaVersion:1,saveId,managerProfileIds:{playerOne:p1,playerTwo:p2}}
  };
}

const localTarget=showdown({id:"local-target",name:"Local Before",saveId:ids.localSave,p1:ids.localP1,p2:ids.localP2,seasonId:ids.localSeason,score:1});
const localOther=showdown({id:"other-save",name:"Other Save",saveId:ids.otherSave,p1:ids.localP1,p2:ids.localP2,seasonId:ids.otherSeason,score:7});
const library={schemaVersion:1,activeSaveId:ids.localSave,profiles:[
  {schemaVersion:1,profileId:ids.localP1,displayName:"Hawk"},
  {schemaVersion:1,profileId:ids.localP2,displayName:"Rival"}
],saves:[{saveId:ids.localSave,showdown:localTarget},{saveId:ids.otherSave,showdown:localOther}]};
const rawSeed={
  saveLibrary:JSON.stringify(library),
  legacyShowdowns:'[{"id":"legacy-preserved"}]',
  preferences:'{"schemaVersion":2,"reducedMotion":false,"menuFeedback":true}'
};

(async()=>{
  const chromiumRuntime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:chromiumRuntime.executablePath,args:chromiumRuntime.args,headless:true});
  const context=await browser.newContext({viewport:{width:430,height:900},deviceScaleFactor:1.5,isMobile:true,hasTouch:true,locale:"en-US",acceptDownloads:true});
  const page=await context.newPage();
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  try{
    await page.addInitScript(({rawSeed,ids})=>{
      localStorage.setItem("careerModeShowdown.saveLibrary",rawSeed.saveLibrary);
      localStorage.removeItem("careerModeShowdown.activeShowdown");
      localStorage.setItem("careerModeShowdown.legacyShowdowns",rawSeed.legacyShowdowns);
      localStorage.setItem("careerModeShowdown.preferences",rawSeed.preferences);
      const accountState={status:"connected",initialized:true,signedIn:true,connected:true,busy:false,accountId:"acct_browser",displayName:"Browser Manager",email:null,accountStatus:"active",message:"Connected."};
      const pairingState={status:"registered",initialized:true,registered:true,busy:false,deviceId:ids.deviceId};
      const binding={saveId:ids.localSave,profileId:ids.localP2,managerRole:"playerTwo",displayLabel:"Rival"};
      window.CareerModeSparkConnectedAccount={getState:()=>accountState,initialize:async()=>accountState,subscribe:()=>()=>{},mountWhenSettingsReady:async()=>true};
      window.CareerModeSparkPrivatePairing={getState:()=>pairingState,initialize:async()=>pairingState,subscribe:()=>()=>{},localBindingOptions:()=>[binding]};
    },{rawSeed,ids});

    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:15000});
    await page.locator("#settingsButton").click();
    await page.locator("#settingsOverlay").waitFor({state:"visible",timeout:15000});
    await page.waitForFunction(()=>window.CareerModeSaveLibraryRuntime&&window.CareerModeSaveLibraryRuntime.isReady()===true,null,{timeout:15000});
    await page.waitForFunction(()=>window.CareerModeProductionFirebaseRuntime,null,{timeout:15000});

    await page.evaluate(async ids=>{
      function canonical(value){
        if(value===undefined||value===null)return value===undefined?"null":"null";
        if(typeof value!=="object")return JSON.stringify(value);
        if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
        return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
      }
      async function hash(value){
        const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));
        return `sha256:${Array.from(new Uint8Array(digest),part=>part.toString(16).padStart(2,"0")).join("")}`;
      }
      const remotePayload={
        schemaVersion:2,id:"remote-record",name:"Remote Authoritative",managers:{playerOne:"Hawk",playerTwo:"Rival"},totalRounds:3,currentRound:1,status:"In Progress",
        selectedLeague:{id:"england-premier-league"},clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},score:{playerOne:5,playerTwo:0},transferChallenges:[],
        rounds:[{roundNumber:1,seasonId:ids.remoteSeason,playerOne:{points:5},playerTwo:{points:0},winner:"playerOne"}],integrityWarnings:[],
        createdAt:"2026-08-20T10:00:00.000Z",updatedAt:"2026-08-24T12:00:00.000Z",completedAt:null,archivedAt:null,
        identity:{schemaVersion:1,saveId:ids.sharedSave,managerProfileIds:{playerOne:ids.remoteP1,playerTwo:ids.localP2}}
      };
      const stateData={
        saveId:ids.sharedSave,
        managerBindings:[{slotId:"playerOne",profileId:ids.remoteP1},{slotId:"playerTwo",profileId:ids.localP2}],
        seasonIds:[ids.remoteSeason],activeSeasonId:ids.remoteSeason,payloadFormatVersion:1,payload:remotePayload,
        mutationReceipt:{idempotencyKeyHash:"e".repeat(64),requestFingerprint:`sha256:${"f".repeat(64)}`,baseRevision:0}
      };
      const sharedState={
        schemaVersion:1,objectType:"sharedState",objectId:ids.rivalryId,revision:1,parentRevision:0,lifecycleState:"live",contentHash:null,
        priorContentHash:`sha256:${"0".repeat(64)}`,updatedAt:null,updatedByAccountId:"acct_peer",updatedByDeviceId:`device_${"b".repeat(32)}`,data:stateData,tombstone:null
      };
      sharedState.contentHash=await hash({objectType:"sharedState",objectId:ids.rivalryId,revision:1,data:stateData});
      const device={schemaVersion:1,objectType:"device",objectId:ids.deviceId,revision:0,lifecycleState:"live",data:{deviceId:ids.deviceId,state:"active"}};
      const rivalry={
        schemaVersion:1,objectType:"rivalry",objectId:ids.rivalryId,revision:1,lifecycleState:"live",
        data:{connectionState:"active",authorizedAccountIds:["acct_peer","acct_browser"],createdByAccountId:"acct_peer",managerSlots:[
          {slotId:"playerOne",accountId:"acct_peer",profileId:ids.remoteP1,saveId:ids.sharedSave,entitlementState:"active"},
          {slotId:"playerTwo",accountId:"acct_browser",profileId:ids.localP2,saveId:ids.localSave,entitlementState:"active"}
        ]}
      };
      const values=new Map([
        [`accounts/acct_browser/devices/${ids.deviceId}`,device],
        [`rivalries/${ids.rivalryId}`,rivalry],
        [`rivalries/${ids.rivalryId}/state/authoritative`,sharedState]
      ]);
      const sdk={
        Timestamp:{fromMillis:value=>({toMillis:()=>value})},
        doc:(_firestore,...segments)=>segments.join("/"),
        runTransaction:async(_firestore,callback)=>callback({
          get:async reference=>({exists:()=>values.has(reference),data:()=>structuredClone(values.get(reference))}),
          set:()=>{throw new Error("The browser reconciliation audit must not publish remote state.");}
        })
      };
      const services={ok:true,auth:{currentUser:{uid:"acct_browser"}},firestore:{kind:"mock"},firestoreSdk:sdk};
      window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>services};
      window.__stage4RemoteEnvelope=sharedState;
    },ids);

    await page.addScriptTag({url:new URL("js/sparkConnectedRivalry.js",baseUrl).href});
    await page.evaluate(async()=>{
      await window.CareerModeSparkConnectedRivalry.initialize();
      await window.CareerModeSparkConnectedRivalry.mountWhenSettingsReady();
    });
    const panel=page.locator("#sparkConnectedRivalryPanel");
    await panel.waitFor({state:"visible",timeout:15000});
    assert.match(await panel.innerText(),/OBSERVE REMOTE · COMMIT LOCAL EXPLICITLY/);
    assert.match(await panel.innerText(),/REMOTE JOINING\s+Stage 5 · still locked/i);

    await panel.locator('input[aria-label="Exact private rivalry code for Connected Rivalry"]').fill(ids.rivalryId);
    await panel.getByRole("button",{name:/ATTACH CONNECTED RIVALRY/}).click();
    await assert.doesNotReject(()=>panel.getByText(/attached privately/i).waitFor({state:"visible",timeout:15000}));
    await panel.getByRole("button",{name:"REFRESH SHARED STATE"}).click();
    await panel.getByText(/Authoritative shared state refreshed at revision 1/i).waitFor({state:"visible",timeout:15000});
    assert.match(await panel.locator(".settingsInfoRow").filter({hasText:"REMOTE OBSERVED"}).innerText(),/Revision 1/);
    assert.match(await panel.locator(".settingsInfoRow").filter({hasText:"LOCAL COMMIT"}).innerText(),/Not applied this session/);

    const beforePreview=await page.evaluate(()=>({
      saveLibrary:localStorage.getItem("careerModeShowdown.saveLibrary"),
      legacyShowdowns:localStorage.getItem("careerModeShowdown.legacyShowdowns"),
      preferences:localStorage.getItem("careerModeShowdown.preferences"),
      activeShowdown:localStorage.getItem("careerModeShowdown.activeShowdown")
    }));
    await panel.getByRole("button",{name:"PREVIEW REMOTE → LOCAL"}).click();
    const confirmation=panel.locator(".settingsConnectedRivalryConfirmation");
    await confirmation.waitFor({state:"visible",timeout:15000});
    assert.match(await confirmation.innerText(),new RegExp(`Remote observed: revision 1`));
    assert.match(await confirmation.innerText(),new RegExp(ids.localSave));
    assert.deepEqual(await page.evaluate(()=>({
      saveLibrary:localStorage.getItem("careerModeShowdown.saveLibrary"),
      legacyShowdowns:localStorage.getItem("careerModeShowdown.legacyShowdowns"),
      preferences:localStorage.getItem("careerModeShowdown.preferences"),
      activeShowdown:localStorage.getItem("careerModeShowdown.activeShowdown")
    })),beforePreview,"Remote preview must remain non-mutating in a real browser.");
    await confirmation.screenshot({path:path.join(resultsDir,`stage4-remote-local-preview-${runLabel}.png`)});

    const applyButton=confirmation.getByRole("button",{name:"BACK UP + APPLY EXACT REVISION"});
    assert.equal(await applyButton.isDisabled(),true);
    await confirmation.locator('input[type="checkbox"]').check();
    assert.equal(await applyButton.isEnabled(),true);
    const downloadPromise=page.waitForEvent("download",{timeout:15000});
    await applyButton.click();
    const download=await downloadPromise;
    assert.match(download.suggestedFilename(),/^career-mode-showdown-backup-/);
    await panel.getByText(/Local commit complete: remote revision 1/i).waitFor({state:"visible",timeout:20000});
    assert.match(await panel.locator(".settingsInfoRow").filter({hasText:"REMOTE OBSERVED"}).innerText(),/Revision 1/);
    assert.match(await panel.locator(".settingsInfoRow").filter({hasText:"LOCAL COMMIT"}).innerText(),/Revision 1/);
    await panel.screenshot({path:path.join(resultsDir,`stage4-remote-local-committed-${runLabel}.png`)});

    const after=await page.evaluate(()=>({
      saveLibrary:JSON.parse(localStorage.getItem("careerModeShowdown.saveLibrary")),
      legacyShowdowns:localStorage.getItem("careerModeShowdown.legacyShowdowns"),
      preferences:localStorage.getItem("careerModeShowdown.preferences"),
      activeShowdown:localStorage.getItem("careerModeShowdown.activeShowdown")
    }));
    const target=after.saveLibrary.saves.find(entry=>entry.saveId===ids.localSave).showdown;
    const other=after.saveLibrary.saves.find(entry=>entry.saveId===ids.otherSave).showdown;
    assert.equal(target.name,"Remote Authoritative");
    assert.equal(target.score.playerOne,5);
    assert.equal(target.id,"local-target");
    assert.equal(target.identity.saveId,ids.localSave);
    assert.deepEqual(target.identity.managerProfileIds,{playerOne:ids.localP1,playerTwo:ids.localP2});
    assert.equal(target.rounds[0].seasonId,ids.localSeason);
    assert.deepEqual(other,localOther);
    assert.equal(after.legacyShowdowns,rawSeed.legacyShowdowns);
    assert.equal(after.preferences,rawSeed.preferences);
    assert.equal(after.activeShowdown,null);
    assert.deepEqual(pageErrors,[],"Stage 4 reconciliation browser audit emitted page errors.");
    process.stdout.write(`PASS Stage 4 browser reconciliation preview, explicit confirmation, backup download, identity-safe local commit and observed/committed UI at ${baseUrl.href}\n`);
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{
  console.error("STAGE 4 REMOTE-TO-LOCAL RECONCILIATION BROWSER AUDIT FAILED");
  console.error(error.stack||error);
  process.exit(1);
});
