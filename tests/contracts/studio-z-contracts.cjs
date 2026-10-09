"use strict";
// Studio Z (Problem Z, Daniel and Nik's physical test of 2026-10-08): connection, sign-in, refresh, old modules, tablet
// Transfer layout and league names. Static and small runtime checks; the emulator journey proves the flows end to end.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let n=0;
const check=(id,label,fn)=>{fn();n+=1;process.stdout.write(`ok ${n} ${id} ${label}\n`);};

check("Z1","the identity surface retries when the lazy loader is slow instead of leaving Home without a badge",()=>{
  const src=read("js/showdown.js");
  assert.match(src,/ensureOnlinePlayerIdentitySurface\(\);\}catch\(error\)\{if\(n\+\+<4\)return setTimeout\(start,n\*1500\)/);
});

check("Z2","one failed probe does not lock the game offline; it keeps re-checking and TRY AGAIN re-checks first",()=>{
  const offline=read("js/offlineApp.js"),identity=read("js/onlinePlayerIdentity.js");
  assert.match(offline,/probeFailures/);
  assert.match(offline,/OFFLINE_RECHECK_MS/);
  assert.match(offline,/window\.recheckOfflineConnectivity=verifyNetworkConnectivity/);
  assert.match(identity,/recheckOfflineConnectivity\?\.\(\)/);
});

check("Z3","a refresh rejoins through the pair pointer; Remote Joining never stores the session",()=>{
  const remote=read("js/sparkRemoteJoining.js"),entry=read("js/productionSharedJourneyEntry.js"),identity=read("js/onlinePlayerIdentity.js");
  assert.equal(remote.includes("sessionStorage"),false);
  assert.match(entry,/LIVE_GAME_KEY="careerModeShowdown\.liveGame\.v1"/);
  assert.match(entry,/setItem\(LIVE_GAME_KEY,"1"\)/,"only a one-bit flag is kept");
  assert.doesNotMatch(entry,/setItem\(LIVE_GAME_KEY,[^"]/);
  assert.match(identity,/pair\.status!=="paired"/,"a finished Showdown never auto-continues");
});

check("Z4","the session pointer is host-written, pair-read, never listed or deleted",()=>{
  const rules=read("firestore.spark.rules");
  const match=rules.slice(rules.indexOf("match /sessionOffers/{offerId}"));
  assert.match(match,/allow get: if offerId == "current" && activeActor\(\) && activePairedRivalry\(rivalryId\) && currentlyEntitled\(rivalryId\);/);
  assert.match(match,/allow create, update: if validSessionOfferWrite\(rivalryId, offerId\);/);
  assert.match(match,/allow list, delete: if false;/);
  assert.match(rules,/offer\.hostAccountId == request\.auth\.uid/);
  assert.match(rules,/session\.hostAccountId == request\.auth\.uid/);
  assert.match(rules,/session\.expiresAt == offer\.expiresAt/);
  assert.equal(read("firestore.stage5c.rules"),rules,"Stage 5C candidate stays the promoted production source");
  const remote=read("js/sparkRemoteJoining.js");
  assert.match(remote,/autoConnect:srjAutoConnect/);
  assert.match(remote,/USE A SESSION CODE/,"the manual code stays reachable");
});

check("Z5","a waiting update applies by itself only on a safe Home screen",()=>{
  const src=read("js/offlineApp.js");
  assert.match(src,/scheduleAutoApplyUpdate/);
  assert.match(src,/getUpdateBoundaryStatus\(\)/);
  assert.match(src,/activateWaitingUpdate\(\{quiet:true\}\)/);
});

check("Z9","Settings never shows the old engineering panels, even if the identity module starts late or not at all",()=>{
  assert.match(read("css/rulesSettingsV10.css"),/#settingsOverlay #settingsContent :is\(#sparkConnectedAccountPanel, #sparkPrivatePairingPanel, #sparkConnectedRivalryPanel, #saveLibraryProductPanel, .settingsOfflinePanel\):not\(\[data-test-surface="internal-audit"\]\) \{ display:none !important; \}/);
});

check("Z6","a stuck or cancelled Google sign-in returns to SIGN IN WITH GOOGLE",()=>{
  const src=read("js/onlinePlayerIdentity.js");
  assert.match(src,/SIGN_IN_WAIT_MS=20000/);
  assert.match(src,/signInAttempt/);
});

check("Z7","upright touch tablets use the phone layout; sideways phones keep a usable player-name field",()=>{
  const src=read("js/onlinePlayerIdentity.js");
  const block=src.slice(src.indexOf("// Studio Z7"));
  const make=({w,h,coarse,portrait})=>{
    const meta={content:"width=device-width, initial-scale=1.0",setAttribute(_k,v){this.content=v;}};
    const root={document:{querySelector:()=>meta},screen:{width:w,height:h},matchMedia:q=>({matches:q.includes("pointer")?coarse:portrait,addEventListener(){}})};
    vm.runInNewContext(block.replace("(globalThis)","(root)"),{root});
    return meta.content;
  };
  assert.equal(make({w:800,h:1280,coarse:true,portrait:true}),"width=760","upright tablet");
  assert.equal(make({w:1280,h:800,coarse:true,portrait:false}),"width=device-width, initial-scale=1.0","sideways tablet");
  assert.equal(make({w:393,h:852,coarse:true,portrait:true}),"width=device-width, initial-scale=1.0","phone");
  assert.equal(make({w:1366,h:768,coarse:false,portrait:false}),"width=device-width, initial-scale=1.0","Chromebook");
  const tcss=read("css/v10Transfer.css");
  assert.match(tcss,/grid-template-columns: calc\(var\(--k\) \* 16px\) minmax\(min\(72px, 26%\), 1\.22fr\) minmax\(100px, 1\.1fr\) minmax\(100px, 0\.92fr\);/,"desktop: the name keeps 72px beside the two 100px selectors");
  assert.match(tcss,/@media \(pointer: coarse\) \{\s*#transferChallenge \.tw-host \.signing-row\.signingRow:not\(\.is-readonly\) \{\s*grid-template-columns: calc\(var\(--k\) \* 16px\) minmax\(26%, 1\.22fr\) minmax\(min\(100px, 28%\), 1\.1fr\) minmax\(min\(100px, 28%\), 0\.92fr\);/,"touch: every field keeps a share of the row");
});

check("Z8","a league name two countries share waits for an explicit choice",()=>{
  const ctx={window:{}};vm.createContext(ctx);
  vm.runInContext(`${read("data/transferOptions.js")};this.resolve=resolveFifa17TransferOption;`,ctx);
  assert.equal(ctx.resolve("league","Primera División"),null);
  assert.equal(ctx.resolve("league","Serie A"),null);
  assert.equal(ctx.resolve("league","La Liga").id,"spain-primera-division");
  assert.equal(ctx.resolve("league","Argentina Primera Division").id,"argentina-primera-division");
  assert.equal(ctx.resolve("league","spain-primera-division").id,"spain-primera-division");
  assert.equal(ctx.resolve("league","TIM Serie A").id,"italy-serie-a");
  assert.equal(ctx.resolve("league","Premier League").id,"england-premier-league");
});

console.log(`PASS Studio Z contracts: ${n} checks (startup retry, offline recheck, refresh rejoin, session pointer, auto update, sign-in watchdog, tablet layout, shared league names, old Settings panels).`);
