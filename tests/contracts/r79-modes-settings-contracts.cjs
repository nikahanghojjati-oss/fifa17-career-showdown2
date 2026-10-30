"use strict";
// Real-only Settings retain pairing, UNPAIR, END and lazy-service guarantees.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),crypto=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const MODES_SOURCE=read("js/showdownModes.js");
const sha=text=>crypto.createHash("sha256").update(text).digest("hex");

// ---------- a small DOM (only what js/showdownModes.js touches) ----------
const {page,sandboxOpenJoin,ACTIVE_NIK,ACTIVE_DANIEL,OFF,settle}=require("../support/showdown-settings-fixture.cjs");
const results=[];
async function check(id,label,fn){await fn();results.push(id);console.log(`ok ${results.length} ${id} ${label}`);}
(async()=>{
  await check("M1","all known accounts play real Showdowns, with the historic marker tracked separately",async()=>{
    const {decideMode}=page().modes,a="acct_daniel";
    for(const status of ["ready","none"]){const v=decideMode({accountId:a,partner:{accountId:a,status:"none"},marker:{accountId:a,status}});assert.equal(v.mode,"real");assert.equal(v.careerStarted,status==="ready");}
    assert.equal(decideMode({accountId:a,marker:{accountId:a,status:"unavailable"}}).mode,"unknown");
    assert.equal(decideMode({accountId:a,marker:{accountId:"other",status:"ready"}}).mode,"unknown");
    const real=page({partner:ACTIVE_NIK});await real.modes.resolve();assert.deepEqual(real.calls,["readPartnerRecord","readPartnerSide"]);
  });
  await check("M2","REAL Settings: Paired with <partner> and UNPAIR; no FORGET THIS DEVICE, no CONNECT PLAYERS, no test run",async()=>{
    for(const [managerId,record,other] of [["daniel",ACTIVE_NIK,"Nik"],["nik",ACTIVE_DANIEL,"Daniel"]]){
      const p=page({managerId,partner:record,side:"mutual"});await p.modes.resolve();const s=p.settings();
      assert.equal(s.rows.mode,"REAL CAREER · every Showdown counts");assert.equal(s.rows.partner,`Paired with ${other}`);
      assert.deepEqual(s.buttons,["UNPAIR"],`${managerId}: UNPAIR is the only pairing action`);
      assert.equal(p.dom.panel.dataset.showdownMode,"real");
    }
    const identity=read("js/onlinePlayerIdentity.js"),panelSource=identity.slice(identity.indexOf("function renderOnlineSettings("),identity.indexOf("\n",identity.indexOf("function renderOnlineSettings(")));
    assert.ok(panelSource.length>200);assert.doesNotMatch(panelSource.replace(/\/\*[\s\S]*?\*\//g,""),/FORGET THIS DEVICE|CONNECT PLAYERS|forgetOnlineDevice\(/,"the identity Settings panel draws neither row any more");
    assert.match(panelSource,/modes\?\.decorateSettingsPanel\?\.\(panel\)/);
    assert.doesNotMatch(MODES_SOURCE,/FORGET THIS DEVICE|startTestRun|isTestRunArmed/);
  });
  await check("M3","REAL, not paired: PAIR WITH <PARTNER> closes Settings and opens the existing first real pairing",async()=>{
    for(const [managerId,record,label,route] of [["daniel",OFF(ACTIVE_NIK),"PAIR WITH NIK","openStart"],["nik",null,"PAIR WITH DANIEL","openJoin"]]){
      const p=page({managerId,partner:record,marker:{hiddenRivalryIds:[],active:true}});await p.modes.resolve();const s=p.settings();
      assert.equal(s.rows.partner,"Not paired");assert.deepEqual(s.buttons,[label]);
      s.button(label).click();await settle();
      assert.deepEqual(p.calls.slice(-2),["closeSettings",route],`${managerId} goes to ${route}`);
      assert.ok(!p.calls.includes("startRealCareer")&&!p.calls.includes("unpair"));
    }
  });
  await check("M4","UNPAIR is blocked while a Showdown is in progress (reason shown, nothing else); with none it asks once and unpairs once",async()=>{
    const blocked=page({partner:ACTIVE_NIK,side:"mutual",pairState:{rivalryId:"r1",connectionState:"active"}});await blocked.modes.resolve();
    blocked.settings().button("UNPAIR").click();await settle();
    assert.equal(blocked.settings().note,"Finish or end the current Showdown before you unpair. Nothing was changed.");
    assert.ok(!blocked.calls.includes("unpair"),"unpair() is never called");assert.ok(!blocked.calls.some(c=>Array.isArray(c)&&c[0]==="confirm"),"no confirm box either");
    assert.deepEqual(blocked.settings().buttons,["UNPAIR"],"the pairing is unchanged");
    // A pending Showdown whose code is still open: the pair module's fail-closed unpair() refuses inside its transaction.
    const refused=page({partner:ACTIVE_NIK,side:"mutual",pairState:{rivalryId:"r1",connectionState:"pending-pair"},unpairError:Object.assign(new Error("in progress"),{code:"PERMANENT_PARTNER_UNPAIR_BLOCKED"})});await refused.modes.resolve();
    refused.settings().button("UNPAIR").click();await settle();
    assert.equal(refused.settings().note,"Finish or end the current Showdown before you unpair. Nothing was changed.");assert.deepEqual(refused.settings().buttons,["UNPAIR"]);
    const cancelled=page({partner:ACTIVE_NIK,side:"mutual",confirm:false});await cancelled.modes.resolve();
    cancelled.settings().button("UNPAIR").click();await settle();assert.ok(!cancelled.calls.includes("unpair"),"cancel changes nothing");
    const ok=page({partner:ACTIVE_NIK,side:"mutual"});await ok.modes.resolve();
    ok.settings().button("UNPAIR").click();await settle();
    const asked=ok.calls.filter(c=>Array.isArray(c)&&c[0]==="confirm");
    assert.equal(asked.length,1);assert.equal(asked[0][2],"danger");assert.match(asked[0][1],/^Unpair from Nik\?/);
    assert.equal(ok.calls.filter(c=>c==="unpair").length,1);
    const after=ok.settings();assert.equal(after.note,"Unpaired from Nik.");assert.equal(after.rows.partner,"Not paired");assert.deepEqual(after.buttons,["PAIR WITH NIK"]);
    assert.match(MODES_SOURCE,/await pair\.unpair\(\)/,"UNPAIR uses the pair module's fail-closed unpair()");
  });
  await check("M5","one-sided UNPAIR: Settings, Home and START say the partner unpaired and offer PAIR AGAIN",async()=>{
    for(const [managerId,record,other,route] of [["daniel",ACTIVE_NIK,"Nik","openStart"],["nik",ACTIVE_DANIEL,"Daniel","openJoin"]]){
      const p=page({managerId,partner:record,side:"unpaired"});await p.modes.resolve();const s=p.settings();
      assert.equal(s.rows.partner,`${other} is no longer paired with you`);assert.deepEqual(s.buttons,["PAIR AGAIN"]);
      s.button("PAIR AGAIN").click();await settle();
      assert.deepEqual(p.calls.slice(-3),["unpair","closeSettings",route],"PAIR AGAIN resets this side, then the first real pairing");
    }
    const blocked=page({partner:ACTIVE_NIK,side:"unpaired",pairState:{rivalryId:"r1",connectionState:"active"}});await blocked.modes.resolve();
    blocked.settings().button("PAIR AGAIN").click();await settle();
    assert.ok(!blocked.calls.includes("unpair")&&!blocked.calls.includes("openStart"));assert.match(blocked.settings().note,/^Finish or end the current Showdown/);
    const which=require(path.join(ROOT,"js/whichShowdownIsLive.js"));
    const idlePair={initialized:true,status:"paired",rivalryId:null,connectionState:"none"};
    for(const role of ["playerOne","playerTwo"]){
      assert.equal(which.decide({role,pair:idlePair,partnerSide:"unpaired",nowEpochMs:1}).action,"pair-again",`${role}: START offers PAIR AGAIN`);
      assert.notEqual(which.decide({role,pair:idlePair,partnerSide:"mutual",nowEpochMs:1}).action,"pair-again");
    }
    const live={initialized:true,status:"paired",rivalryId:"pair_1"+"a".repeat(63),connectionState:"pending-pair",managerRole:"playerOne"};
    assert.equal(which.decide({role:"playerOne",pair:live,partnerSide:"unpaired",nowEpochMs:1}).action,"resume-waiting","a Showdown already under way comes first");
    const identity=read("js/onlinePlayerIdentity.js");
    assert.match(identity,/function pairAgainTile\(\)\{[^\n]*side\.status!=="unpaired"[^\n]*return\["PAIR",`PAIR AGAIN WITH \$\{other\.toUpperCase\(\)\}`,`\$\{other\} is no longer paired with you\. Tap to pair again\.`\];\}/,"Home says it plainly");
    assert.match(identity,/const nik=isNik\?nikHomeTile\(\):current\?\.status==="ready"\?liveHomeTile\(\)\|\|pairAgainTile\(\):null;/,"Daniel's Home START tile too");
    assert.match(identity,/if\(decision\.action==="pair-again"\)\{await pairAgainFirst\(\);decision=await which\.read\(root\);\}/,"START: reset, then decide again");
    const pairSource=read("js/persistentNikDanielPair.js");
    assert.match(pairSource,/if\(!mine\|\|mine\.active!==true\)\{[^\n]*return partnerSideState;\}/,"the partner side is read only while this account's own record is active");
  });
  await check("M10","Settings has no START REAL CAREER row or SHOW TEST SHOWDOWNS AGAIN switch; old test games stay stored and hidden",async()=>{
    const code=file=>read(file).replace(/\/\*[\s\S]*?\*\//g,"").replace(/^\s*\/\/.*$/gm,"");
    const settings=code("js/settings.js");
    for(const banned of [/START REAL CAREER/,/SHOW TEST SHOWDOWNS AGAIN/,/settingsCareerStart/,/createSettingsCareerStartRow/,/setActive\(/])assert.doesNotMatch(settings,banned,String(banned));
    assert.doesNotMatch(read("css/rulesSettingsV10.css"),/settingsStartRealCareer/);
    for(const file of ["js/onlinePlayerIdentity.js","js/showdownModes.js"])assert.doesNotMatch(code(file),/SHOW TEST SHOWDOWNS AGAIN|setActive\(/,file);
    const Marker=require(path.join(ROOT,"js/careerStartMarker.js"));
    assert.equal(Marker.hiddenWhateverActive,true);
    assert.deepEqual(Marker.hiddenRivalryIds({status:"ready",hiddenRivalryIds:["r1","r2"],active:false}),["r1","r2"],"a marker the old switch turned off still hides");
    assert.deepEqual(Marker.hiddenRivalryIds({status:"ready",hiddenRivalryIds:["r1"],active:true}),["r1"]);
    assert.deepEqual(Marker.hiddenRivalryIds(null),[]);
    assert.doesNotMatch(read("js/careerStartMarker.js"),/deleteDoc|transaction\.delete\(|writeBatch/,"test games are never deleted");
  });
  await check("M11","END SHOWDOWN (r80, was DELETE CURRENT SHOWDOWN) is byte-identical to its reviewed r80 form",async()=>{
    const s=read("js/settings.js");
    assert.doesNotMatch(s,/DELETE CURRENT SHOWDOWN|deleteSettingsCurrentShowdown/,"no separate DELETE");
    const i=s.indexOf("async function runSettingsEndShowdown(");assert.ok(i>=0);
    assert.equal(sha(s.slice(i,s.indexOf("\n}\n",i)+3)),"3b073e5f40fb84023e74e442d395bf3d086fede5f2e773b21816b44602664231");// r80 wording sweep: "it could not be closed here"
    const a=s.indexOf("    if(active){\n        const endCurrent"),end="actions.appendChild(endCurrent);\n    }\n",b=s.indexOf(end,a)+end.length;
    assert.ok(a>=0);assert.equal(sha(s.slice(a,b)),"8a4f90656a5d2eec26a478bc84dff8dcf59e66b46f3c0b2eb36e501abbcc1820");
    assert.doesNotMatch(MODES_SOURCE,/DELETE CURRENT SHOWDOWN|END SHOWDOWN|deleteSettingsCurrentShowdown|endSettingsCurrentShowdown/);
  });
  await check("M12","lazy (never at startup), cached by the service worker without a runtime bump, no timers or polling",async()=>{
    assert.doesNotMatch(read("index.html"),/showdownModes/);
    const sw=read("service-worker.js");
    const list=name=>{const i=sw.indexOf(`const ${name} = `);return sw.slice(i,sw.indexOf("]);",i));};
    assert.match(list("SHELL_PATHS"),/"js\/showdownModes\.js"/);assert.doesNotMatch(list("SHELL_PATHS_ADDED_SINCE_PREVIOUS"),/"js\/showdownModes\.js"/,"r80: the retained r79 shell already carries it");
    assert.match(sw,/const RUNTIME_REVISION = "1\.9\.10-r86";/,"RUNTIME_REVISION is the r86 release (1.9.10-r86)");
    for(const banned of [/setTimeout|setInterval|requestAnimationFrame/,/onSnapshot|getDocs|collection\(|query\(/,/runTransaction|getDoc\(/,/localStorage|sessionStorage|indexedDB/])assert.doesNotMatch(MODES_SOURCE,banned,String(banned));
    assert.match(read("js/onlinePlayerIdentity.js"),/loadOnlineDependency\("showdown-modes","js\/showdownModes\.js"/);
    assert.ok(Buffer.byteLength(read("js/whichShowdownIsLive.js"))<7000);
  });
  await check("M13","gallery #5/#6: both managers read the same UNPAIR note for the same state, and a refusal goes away once the Showdown is deleted",async()=>{
    const RULE="Finish or end the current Showdown before you unpair.",IDLE="Every Showdown counts in your career.";
    const live={rivalryId:"r1",connectionState:"active"},gone={rivalryId:null,connectionState:"none"};
    for(const [managerId,record] of [["daniel",ACTIVE_NIK],["nik",ACTIVE_DANIEL]]){
      const p=page({managerId,partner:record,side:"mutual",pairState:live});await p.modes.resolve();
      assert.equal(p.settings().note,RULE,`${managerId}: a Showdown in play says why UNPAIR waits, before any tap`);
      p.setPairState(gone);assert.equal(p.settings().note,IDLE,`${managerId}: nothing in play`);
    }
    // Daniel taps UNPAIR while the Showdown is live, then deletes it: the refusal does not outlive the Showdown.
    const d=page({partner:ACTIVE_NIK,side:"mutual",pairState:live});await d.modes.resolve();
    const before=d.modes.signature();
    d.settings().button("UNPAIR").click();await settle();
    assert.equal(d.settings().note,`${RULE} Nothing was changed.`);
    d.setPairState(gone);
    assert.notEqual(d.modes.signature(),before,"the Settings panel is redrawn when the Showdown ends");
    assert.equal(d.settings().note,IDLE,"after DELETE the stale refusal is gone");
    assert.deepEqual(d.settings().buttons,["UNPAIR"],"and UNPAIR is offered");
    d.setPairState(live);assert.equal(d.settings().note,RULE,"a later Showdown shows the rule, not the old refusal");
    // The fail-closed refusal of a pending Showdown also clears once it is gone.
    const pending=page({partner:ACTIVE_NIK,side:"mutual",pairState:{rivalryId:"r1",connectionState:"pending-pair"},unpairError:Object.assign(new Error("in progress"),{code:"PERMANENT_PARTNER_UNPAIR_BLOCKED"})});await pending.modes.resolve();
    pending.settings().button("UNPAIR").click();await settle();
    assert.equal(pending.settings().note,`${RULE} Nothing was changed.`);
    pending.setPairState(gone);assert.equal(pending.settings().note,IDLE);
    // Other messages are not tied to the Showdown (the result of an UNPAIR stays).
    const ok=page({partner:ACTIVE_NIK,side:"mutual"});await ok.modes.resolve();ok.settings().button("UNPAIR").click();await settle();
    ok.setPairState(gone);assert.equal(ok.settings().note,"Unpaired from Nik.");
  });
  await check("M14","seasons, waiting and gameplay contain no retired mode rows or warning strips",async()=>{
    for(const managerId of ["daniel","nik"]){const p=page({managerId});p.modes.install();await p.modes.resolve();assert.equal(p.dom.doc.getElementById("cmsRealCareerCheck"),null);assert.equal(p.dom.doc.getElementById("cmsTestRunNote"),null);assert.equal(p.dom.doc.getElementById("cmsConnectTestRunNote"),null);}
  });
  console.log(`PASS real-only Settings contracts: ${results.length} checks (real play, permanent pairing, fail-closed UNPAIR, PAIR AGAIN, hidden historical data, unchanged END, lazy reads and no test controls).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
