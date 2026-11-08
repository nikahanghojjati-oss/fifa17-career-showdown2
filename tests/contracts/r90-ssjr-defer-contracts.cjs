#!/usr/bin/env node
"use strict";
// r90 W8: the Shared Journey chain follows Home on a device with no unfinished online Showdown, and everything that needs it waits.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const ssjr=read("js/ssjr.js");let n=0;const ok=(id,msg)=>{n++;console.log(`ok ${n} ${id} ${msg}`);};
// D1 what still starts at once
{const at=name=>ssjr.indexOf(name);
  for(const id of ["firebase-runtime","ssjr-production-entry","ssjr-production-guard"])assert.ok(at(`"${id}"`)>=0&&at(`"${id}"`)<at("const sharedChain="),`${id} starts at once, before the deferred chain`);
  assert.match(ssjr,/const entry=install\("ssjr-production-entry"[^\n]*entryInstalled\(api\)/,"the entry still releases the pre-pair hold when it installs");
  ok("D1","the Firebase runtime, the sign-in entry and its local-draw guard start at once; the entry still releases the startup hold");}
// D2 when the whole chain still loads at startup
{const m=/const chainNow=([^;]+);/.exec(ssjr);assert.ok(m,"chainNow");
  for(const part of ["acceptanceEnabled","ssjrTestEnabled","pendingShell()","liveGameHeld()","unfinishedOnline()"])assert.ok(m[1].includes(part),`${part} loads the chain at startup`);
  assert.match(ssjr,/const unfinishedOnline=\(\)=>\{[^\n]*catch\(_error\)\{return true;\}\n\s*if\(s===undefined\)return true;return Boolean\(s&&s\.sharedJourney&&s\.sharedJourney\.mode==="shared"&&s\.status!=="Completed"\);\};/,"an unreadable save counts as unfinished (startup load, as before)");
  assert.match(ssjr,/if\(chainNow\)\{sharedChain\(\)\.catch\(chainWarn\);root\.CareerModeSharedJourneyReady=\(\)=>Promise\.resolve\(true\);\}/,"the startup path waits on nothing new");
  ok("D2","a pre-pair shell, a live game in this tab, an unfinished online Showdown, an unreadable save or a test page loads the chain at startup with nothing new waiting on it");}
// D3 deferred: after Home, and the gates
{assert.match(ssjr,/afterHome\(\(\)=>sharedChain\(\)\.catch\(chainWarn\)\);/,"otherwise it starts once Home is handed over");
  assert.match(ssjr,/const ready=\(\)=>settled\?Promise\.resolve\(true\):Promise\.race\(\[sharedChain\(\)\.catch\(\(\)=>false\),new Promise\(resolve=>root\.setTimeout\(\(\)=>resolve\(false\),15e3\)\)\]\);/,"a wait is bounded at 15 s");
  const game=/const GAME=new Set\((\[[^\]]+\])\)/.exec(ssjr);assert.ok(game);const screens=JSON.parse(game[1]);
  for(const s of ["createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary"])assert.ok(screens.includes(s),`${s} waits for the chain`);
  assert.match(ssjr,/root\.navigateTo=function\(screen,\.\.\.args\)\{return settled\|\|!GAME\.has\(screen\)\?nav\.call\(this,screen,\.\.\.args\):ready\(\)\.then\(\(\)=>nav\.call\(this,screen,\.\.\.args\)\);\};/);
  assert.match(read("js/whichShowdownIsLive.js"),/async function wslRead\(r=root,options=\{\}\)\{await r\.CareerModeSharedJourneyReady\?\.\(\);/,"the START/JOIN decision reads Terminal Close's state only once it is installed");
  assert.match(read("js/settings.js"),/async function finishSettingsSackedShowdown\(name\)\{\n    closeSettings\(false\);\n    await window\.CareerModeSharedJourneyReady\?\.\(\);/,"Settings' sacked close waits for Terminal Close");
  assert.match(ssjr,/if\(!acceptanceEnabled&&!ssjrTestEnabled\)return;\n    await sharedChain\(\);/,"the acceptance tail never starts the chain early");
  ok("D3","otherwise the chain starts after Home; game screens, the START/JOIN decision and Settings' sacked close wait for it (15 s bound)");}
console.log(`PASS r90 SSJR deferral contracts: ${n} numbered checks.`);
