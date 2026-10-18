"use strict";
// r79 PR4: real and test modes, and the Settings pairing rows (Nik's decisions, 2026-10-17). Plain node:assert, no
// Firebase: js/showdownModes.js runs in a vm sandbox against a small DOM and stubbed pair / marker / identity modules.
// The reads are counted in tests/contracts/firestore-budget-contracts.cjs (FB12); the browser states are proved in
// tests/browser/r79-modes-settings-audit.cjs; the UNPAIR transaction itself in tests/firebase/permanent-partner-emulator.cjs.
// M1  REAL = the account has accounts/{uid}/careerStart/current (or an active partner record, which needs it); else TEST.
// M2  REAL Settings: MODE "REAL CAREER", "Paired with <partner>" + UNPAIR; no FORGET THIS DEVICE, no CONNECT PLAYERS.
// M3  REAL, not paired: PAIR WITH <PARTNER> goes to the existing first real pairing (Nik: the code box; Daniel: START).
// M4  UNPAIR is blocked while a Showdown is in progress: the reason is shown, nothing else happens (no confirm, no unpair);
//     the fail-closed refusal of unpair() shows the same reason; with no Showdown the confirmed UNPAIR unpairs once.
// M5  One-sided UNPAIR: the partner's record is off, so Settings and Home say so and offer PAIR AGAIN (which resets this
//     side with the same fail-closed unpair, then the first real pairing); START decides pair-again too.
// M6  TEST Settings: the label "TEST RUN · nothing counts", START TEST RUN (Daniel) / JOIN TEST RUN (Nik, who never
//     starts), FORGET THIS DEVICE only here.
// M7  Every Home START is real: on a test account the seasons screen shows the START REAL CAREER checkmark (ticked) and
//     START writes the marker first; unticked refuses with the reason; only Settings > START TEST RUN skips the marker.
// M8  The checkmark is one-time: it never shows once the account is real, nor to Nik, nor during a test run.
// M9  Test-run screens say so: the header badge suffix on a test run and the Connect Players note; never on a real
//     account, never on an idle test Home (where START is real).
// M10 Settings no longer has the START REAL CAREER row or the SHOW TEST SHOWDOWNS AGAIN switch; old test games stay stored
//     and stay hidden, whatever the old switch left in the marker.
// M11 DELETE CURRENT SHOWDOWN is exactly as it was (byte-identical function and button).
// M12 Lazy, cached, no timers: not in index.html, in the service-worker shell list (runtime version untouched), no polling.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),crypto=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const MODES_SOURCE=read("js/showdownModes.js");
const sha=text=>crypto.createHash("sha256").update(text).digest("hex");

// ---------- a small DOM (only what js/showdownModes.js touches) ----------
class El{
  constructor(tag,doc){this.tagName=String(tag).toUpperCase();this.ownerDocument=doc;this.children=[];this.parentNode=null;this.dataset={};this.attributes={};this.className="";this.id="";this.hidden=false;this.ownText="";this.listeners={};this.disabled=false;this.checked=false;
    const self=this;this.classList={contains:c=>self.className.split(/\s+/).includes(c),add:c=>{if(!self.classList.contains(c))self.className=(self.className+" "+c).trim();},remove:c=>{self.className=self.className.split(/\s+/).filter(x=>x&&x!==c).join(" ");}};}
  get textContent(){return this.ownText+this.children.map(c=>c.textContent).join("");}
  set textContent(v){this.ownText=v==null?"":String(v);this.children=[];}
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return k in this.attributes?this.attributes[k]:null;}
  addEventListener(type,fn){(this.listeners[type]=this.listeners[type]||[]).push(fn);}
  click(){for(const fn of this.listeners.click||[])fn({type:"click",target:this});}
  detach(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(c=>c!==this);this.parentNode=null;}}
  append(...nodes){for(const n of nodes){n.detach();n.parentNode=this;this.children.push(n);}}
  prepend(n){n.detach();n.parentNode=this;this.children.unshift(n);}
  before(n){const p=this.parentNode;n.detach();n.parentNode=p;p.children.splice(p.children.indexOf(this),0,n);}
  after(n){const p=this.parentNode;n.detach();n.parentNode=p;p.children.splice(p.children.indexOf(this)+1,0,n);}
  remove(){this.detach();}
  all(){return this.children.flatMap(c=>[c,...c.all()]);}
  matches(sel){if(sel.startsWith("#"))return this.id===sel.slice(1);if(sel.startsWith("."))return this.classList.contains(sel.slice(1));const attr=/^\[data-([a-z-]+)\]$/.exec(sel);if(attr){const key=attr[1].replace(/-([a-z])/g,(_m,c)=>c.toUpperCase());return key in this.dataset;}return this.tagName===sel.toUpperCase();}
  query(sel){const parts=sel.trim().split(/\s+/);let scope=[this];for(const part of parts)scope=scope.flatMap(n=>n.all().filter(x=>x.matches(part)));return scope;}
  querySelector(sel){return this.query(sel)[0]||null;}
  querySelectorAll(sel){return this.query(sel);}
}
function createDocument(){
  const doc={listeners:{}};
  doc.createElement=tag=>new El(tag,doc);
  doc.body=new El("body",doc);
  doc.getElementById=id=>doc.body.all().find(n=>n.id===id)||null;
  doc.querySelector=sel=>doc.body.querySelector(sel);
  doc.querySelectorAll=sel=>doc.body.querySelectorAll(sel);
  doc.addEventListener=(type,fn)=>{(doc.listeners[type]=doc.listeners[type]||[]).push(fn);};
  doc.dispatch=event=>{for(const fn of doc.listeners[event.type]||[])fn(event);};
  const make=(tag,id,className="")=>{const n=doc.createElement(tag);n.id=id||"";n.className=className;return n;};
  // The identity Settings panel (its own grid and action row; js/onlinePlayerIdentity.js renderOnlineSettings).
  const panel=make("section","onlinePlayerIdentitySettingsPanel","settingsPanel settingsConnectedAccount");
  const grid=make("div","","settingsInfoGrid"),actions=make("div","","settingsOfflineActions settingsConnectedAccountActions");
  panel.append(grid,actions);doc.body.append(panel);
  // The seasons screen and the Connect Players layer.
  const create=make("section","createShowdown"),box=make("div","","setupBox"),start=make("button","startShowdown","menuButton");
  box.append(start);create.append(box);doc.body.append(create);
  const layer=make("section","connectPlayersScreen","hidden"),slot=make("div","connectPlayersPairSlot");layer.hidden=true;layer.append(slot);doc.body.append(layer);
  return {doc,panel,grid,actions,box,start,layer,slot};
}

// ---------- one page: the modes module with stubbed neighbours ----------
function page({managerId="daniel",partner=null,side=null,marker=null,pairState={rivalryId:null,connectionState:"none"},confirm=true,unpairError=null,screen="mainMenu"}={}){
  const dom=createDocument(),accountId="acct_"+managerId,calls=[];
  const partnerState={accountId,status:partner?"ready":"none",record:partner};
  let sideState=side?{accountId,status:side,partnerAccountId:"acct_other"}:{accountId,status:"unknown",partnerAccountId:null};
  let markerDoc=marker,currentScreen=screen;
  const pair={getPartnerState:()=>partnerState,getPartnerSideState:()=>sideState,getState:()=>pairState,
    readPartnerRecord:async()=>{calls.push("readPartnerRecord");return partnerState;},
    readPartnerSide:async()=>{calls.push("readPartnerSide");return sideState;},
    unpair:async()=>{calls.push("unpair");if(unpairError)throw unpairError;partnerState.record={...partnerState.record,active:false};sideState={accountId,status:"not-paired",partnerAccountId:null};return {ok:true};},
    subscribe:()=>()=>{}};
  const markerApi={readCurrentMarker:async()=>{calls.push("readMarker");return markerDoc?{status:"ready",...markerDoc}:{status:"none"};},
    startRealCareer:async()=>{calls.push("startRealCareer");markerDoc={hiddenRivalryIds:[],active:true};return {status:"ready",hiddenRivalryIds:[],active:true};}};
  const identity={getState:()=>({status:"ready",registered:true,accountId,managerId}),
    openStart:async()=>{calls.push("openStart");return true;},openJoin:async()=>{calls.push("openJoin");return true;},
    forgetThisDevice:async()=>{calls.push("forgetThisDevice");return true;},refreshBadge:()=>null,renderSettings:()=>null};
  const sandbox={console,document:dom.doc,CareerModePersistentNikDanielPair:pair,CareerModeCareerStartMarker:markerApi,CareerModeOnlinePlayerIdentity:identity,
    getActiveScreenName:()=>currentScreen,closeSettings:()=>calls.push("closeSettings"),
    askShowdownConfirm:async(message,options)=>{calls.push(["confirm",message,options&&options.tone]);return confirm;},
    loadRuntimeScript:async()=>{throw new Error("everything is preloaded");},addEventListener:()=>{}};
  sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext(MODES_SOURCE,sandbox,{filename:"js/showdownModes.js"});
  const modes=sandbox.CareerModeShowdownModes;
  const settings=()=>{modes.decorateSettingsPanel(dom.panel);const rows={};for(const r of dom.grid.querySelectorAll("[data-mode-row]"))rows[r.dataset.modeRow]=r.querySelector("strong").textContent;
    return {rows,buttons:dom.actions.children.map(b=>b.textContent),button:text=>dom.actions.children.find(b=>b.textContent===text)||null,note:dom.doc.getElementById("cmsModeSettings")?.textContent||""};};
  return {dom,modes,calls,settings,pair,marker:markerApi,setScreen:s=>{currentScreen=s;dom.doc.dispatch({type:"career-mode-screen-shown",detail:{screen:s}});},setPairState:s=>{pairState=s;}};
}
const ACTIVE_NIK={partnerAccountId:"acct_nik",myRole:"playerOne",active:true};
const ACTIVE_DANIEL={partnerAccountId:"acct_daniel",myRole:"playerTwo",active:true};
const OFF=record=>({...record,active:false});
const settle=async()=>{for(let i=0;i<10;i+=1)await new Promise(resolve=>setImmediate(resolve));};

const results=[];
async function check(id,label,fn){await fn();results.push(id);console.log(`ok ${results.length} ${id} ${label}`);}
(async()=>{
  await check("M1","REAL means the account has its career-start marker (or an active partner record, which the Rules only allow with one); no marker is TEST",async()=>{
    const {decideMode}=page().modes,a="acct_daniel";
    assert.equal(decideMode({accountId:a,partner:{accountId:a,status:"none"},marker:{accountId:a,status:"ready"}}).mode,"real");
    assert.equal(decideMode({accountId:a,partner:{accountId:a,status:"none"},marker:{accountId:a,status:"none"}}).mode,"test");
    assert.equal(decideMode({accountId:a,partner:{accountId:a,status:"ready",record:ACTIVE_NIK},marker:{accountId:a,status:"unknown"}}).mode,"real");
    assert.equal(decideMode({accountId:a,partner:{accountId:a,status:"none"},marker:{accountId:a,status:"unavailable"}}).mode,"unknown","a failed marker read is never guessed as test");
    assert.equal(decideMode({accountId:a,partner:{accountId:a,status:"none"},marker:{accountId:"acct_other",status:"ready"}}).mode,"unknown","another account's marker never counts");
    const real=page({partner:ACTIVE_NIK});await real.modes.resolve();
    assert.deepEqual(real.calls,["readPartnerRecord","readPartnerSide"],"an active partner record proves REAL without reading the marker");
    const test=page();await test.modes.resolve();
    assert.deepEqual(test.calls,["readPartnerRecord","readMarker"]);assert.equal(test.modes.getView().mode,"test");
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
    assert.equal((MODES_SOURCE.match(/"FORGET THIS DEVICE"/g)||[]).length,1);
    assert.match(MODES_SOURCE,/\}else if\(v\.mode==="test"\)\{[^}]*"FORGET THIS DEVICE"[^}]*\n  \}\n/,"FORGET THIS DEVICE is drawn only in the test branch");
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
    assert.equal(blocked.settings().note,"Finish or delete the current Showdown before you unpair. Nothing was changed.");
    assert.ok(!blocked.calls.includes("unpair"),"unpair() is never called");assert.ok(!blocked.calls.some(c=>Array.isArray(c)&&c[0]==="confirm"),"no confirm box either");
    assert.deepEqual(blocked.settings().buttons,["UNPAIR"],"the pairing is unchanged");
    // A pending Showdown whose code is still open: the pair module's fail-closed unpair() refuses inside its transaction.
    const refused=page({partner:ACTIVE_NIK,side:"mutual",pairState:{rivalryId:"r1",connectionState:"pending-pair"},unpairError:Object.assign(new Error("in progress"),{code:"PERMANENT_PARTNER_UNPAIR_BLOCKED"})});await refused.modes.resolve();
    refused.settings().button("UNPAIR").click();await settle();
    assert.equal(refused.settings().note,"Finish or delete the current Showdown before you unpair. Nothing was changed.");assert.deepEqual(refused.settings().buttons,["UNPAIR"]);
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
    assert.ok(!blocked.calls.includes("unpair")&&!blocked.calls.includes("openStart"));assert.match(blocked.settings().note,/^Finish or delete the current Showdown/);
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
    assert.match(identity,/const nik=isNik\?nikHomeTile\(\):current\?\.status==="ready"\?pairAgainTile\(\):null;/,"Daniel's Home START tile too");
    assert.match(identity,/if\(decision\.action==="pair-again"\)\{await pairAgainFirst\(\);decision=await which\.read\(root\);\}/,"START: reset, then decide again");
    const pairSource=read("js/persistentNikDanielPair.js");
    assert.match(pairSource,/if\(!mine\|\|mine\.active!==true\)\{[^\n]*return partnerSideState;\}/,"the partner side is read only while this account's own record is active");
  });
  await check("M6","TEST Settings: the TEST RUN label, START TEST RUN for Daniel, JOIN TEST RUN for Nik, FORGET THIS DEVICE",async()=>{
    const d=page();await d.modes.resolve();const s=d.settings();
    assert.equal(s.rows.mode,"TEST RUN · nothing counts");assert.equal(s.rows.partner,undefined,"no partner row in test mode");
    assert.deepEqual(s.buttons,["START TEST RUN","FORGET THIS DEVICE"]);
    s.button("FORGET THIS DEVICE").click();await settle();assert.ok(d.calls.includes("forgetThisDevice"));
    s.button("START TEST RUN").click();await settle();
    assert.deepEqual(d.calls.slice(-2),["closeSettings","openStart"]);assert.equal(d.modes.isTestRunArmed(),true);
    const n=page({managerId:"nik"});await n.modes.resolve();const ns=n.settings();
    assert.deepEqual(ns.buttons,["JOIN TEST RUN","FORGET THIS DEVICE"],"only Daniel starts Showdowns");
    ns.button("JOIN TEST RUN").click();await settle();
    assert.deepEqual(n.calls.slice(-2),["closeSettings","openJoin"]);assert.ok(!n.calls.includes("openStart"));
  });
  await check("M7","every Home START is real: ticked checkmark writes the marker before the game; unticked refuses; only START TEST RUN skips it",async()=>{
    const home=page();await home.modes.resolve();home.modes.renderSeasons();
    const box=home.dom.doc.getElementById("cmsRealCareerCheck");assert.equal(box.checked,true,"ticked by default: fewer taps");
    assert.equal(await home.modes.beforeSeasonsStart(),true);assert.equal(home.calls.filter(c=>c==="startRealCareer").length,1,"the marker is written before the shell");
    assert.equal(home.modes.getView().mode,"real");
    const unticked=page();await unticked.modes.resolve();unticked.modes.renderSeasons();unticked.dom.doc.getElementById("cmsRealCareerCheck").checked=false;
    assert.equal(await unticked.modes.beforeSeasonsStart(),false);assert.ok(!unticked.calls.includes("startRealCareer"));
    assert.match(unticked.dom.doc.getElementById("cmsSeasonsStartMessage").textContent,/^Home START always starts your real career\./);
    const testRun=page();await testRun.modes.resolve();await testRun.modes.startTestRun();
    assert.equal(await testRun.modes.beforeSeasonsStart(),true);assert.ok(!testRun.calls.includes("startRealCareer"),"a test run never writes the marker");
    const unknown=page();unknown.marker.readCurrentMarker=async()=>{throw new Error("offline");};
    assert.equal(await unknown.modes.beforeSeasonsStart(),false,"a career that cannot be checked never starts (and never as a test)");
    assert.ok(!unknown.calls.includes("startRealCareer"));assert.match(unknown.dom.doc.getElementById("cmsSeasonsStartMessage").textContent,/^Your career could not be checked\./);
    const real=page({partner:ACTIVE_NIK,side:"mutual"});assert.equal(await real.modes.beforeSeasonsStart(),true);assert.ok(!real.calls.includes("startRealCareer"));
    const entry=read("js/productionSharedJourneyEntry.js");
    assert.match(entry,/if\(decision\.action!=="new"\)[^\n]*\n(?:\s*\/\/[^\n]*\n)*\s*if\(options&&typeof options\.beforeCreate==="function"&&await options\.beforeCreate\(\)!==true\)return false;\n\s*setPending\(true\);/,"the gate runs once START is really making a new Showdown, before the shell");
    assert.match(read("js/onlinePlayerIdentity.js"),/beforeCreate:[^\n]*modes[^\n]*beforeSeasonsStart\(\)/);
  });
  await check("M8","the START REAL CAREER checkmark is one-time: Daniel's test account only, never once real, never to Nik, never on a test run",async()=>{
    const row=p=>p.dom.doc.getElementById("cmsRealCareerRow");
    const d=page();await d.modes.resolve();d.modes.renderSeasons();assert.equal(row(d).hidden,false);
    await d.modes.beforeSeasonsStart();d.modes.renderSeasons();assert.equal(row(d).hidden,true,"gone after the first real START");
    const real=page({marker:{hiddenRivalryIds:["r_old"],active:false}});await real.modes.resolve();real.modes.renderSeasons();assert.equal(row(real).hidden,true);
    const nik=page({managerId:"nik"});await nik.modes.resolve();nik.modes.renderSeasons();assert.equal(row(nik).hidden,true);
    const run=page();await run.modes.resolve();await run.modes.startTestRun();run.modes.renderSeasons();
    assert.equal(row(run).hidden,true);assert.equal(run.dom.doc.getElementById("cmsTestRunNote").hidden,false);
    assert.equal(run.dom.doc.getElementById("cmsTestRunNote").textContent,"TEST RUN · nothing counts");
  });
  await check("M9","test-run screens carry the label (badge suffix, Connect Players note); a real account and an idle test Home never do",async()=>{
    const idle=page();await idle.modes.resolve();assert.equal(idle.modes.badgeSuffix(),"","idle test Home: START there is real");
    await idle.modes.startTestRun();assert.equal(idle.modes.badgeSuffix()," · TEST RUN · NOTHING COUNTS");
    idle.modes.install();idle.setScreen("mainMenu");assert.equal(idle.modes.isTestRunArmed(),false,"back on Home the test run is over");
    idle.setScreen("createShowdown");assert.equal(idle.modes.badgeSuffix(),"","the seasons screen Home START opened is real");
    idle.setScreen("dashboard");assert.equal(idle.modes.badgeSuffix()," · TEST RUN · NOTHING COUNTS","a test account's gameplay screens say so");
    const note=idle.dom.doc.getElementById("cmsConnectTestRunNote");assert.ok(note&&note.parentNode===idle.dom.slot&&note.hidden===false);
    const real=page({partner:ACTIVE_NIK,side:"mutual",screen:"dashboard"});await real.modes.resolve();real.modes.install();
    assert.equal(real.modes.badgeSuffix(),"");assert.equal(real.dom.doc.getElementById("cmsConnectTestRunNote").hidden,true);
    assert.match(read("js/onlinePlayerIdentity.js"),/badgeSuffix/,"the header badge carries the suffix");
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
  await check("M11","DELETE CURRENT SHOWDOWN is byte-identical to r79 PR3",async()=>{
    const s=read("js/settings.js");
    const i=s.indexOf("async function deleteSettingsCurrentShowdown(");assert.ok(i>=0);
    assert.equal(sha(s.slice(i,s.indexOf("\n}\n",i)+3)),"9b130e490dff72b84aaa816800ecd075a9ad0216f00f736bc73b062f11f5c667");
    const a=s.indexOf("    if(active){\n        const deleteCurrent"),end="actions.appendChild(deleteCurrent);\n    }\n",b=s.indexOf(end,a)+end.length;
    assert.ok(a>=0);assert.equal(sha(s.slice(a,b)),"86e03e1e8b935443dce308c24695367e0b04f74158ea1c0d2d257ad20e284823");
    assert.doesNotMatch(MODES_SOURCE,/DELETE CURRENT SHOWDOWN|deleteSettingsCurrentShowdown/);
  });
  await check("M12","lazy (never at startup), cached by the service worker without a runtime bump, no timers or polling",async()=>{
    assert.doesNotMatch(read("index.html"),/showdownModes/);
    const sw=read("service-worker.js");
    const list=name=>{const i=sw.indexOf(`const ${name} = `);return sw.slice(i,sw.indexOf("]);",i));};
    assert.match(list("SHELL_PATHS"),/"js\/showdownModes\.js"/);assert.match(list("SHELL_PATHS_ADDED_SINCE_PREVIOUS"),/"js\/showdownModes\.js"/);
    assert.match(sw,/const RUNTIME_REVISION = "1\.9\.2-r78";/,"the runtime version is not bumped in this PR");
    for(const banned of [/setTimeout|setInterval|requestAnimationFrame/,/onSnapshot|getDocs|collection\(|query\(/,/runTransaction|getDoc\(/,/localStorage|sessionStorage|indexedDB/])assert.doesNotMatch(MODES_SOURCE,banned,String(banned));
    assert.match(read("js/onlinePlayerIdentity.js"),/loadOnlineDependency\("showdown-modes","js\/showdownModes\.js"/);
    assert.ok(Buffer.byteLength(read("js/whichShowdownIsLive.js"))<7000);
  });
  console.log(`PASS r79 modes and Settings contracts: ${results.length} checks (REAL = marker; Settings pairing rows; UNPAIR blocked while in progress; one-sided PAIR AGAIN; TEST RUN label, START TEST RUN, FORGET THIS DEVICE only in test; every Home START real; one-time checkmark; DELETE CURRENT SHOWDOWN unchanged; lazy, no timers).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
