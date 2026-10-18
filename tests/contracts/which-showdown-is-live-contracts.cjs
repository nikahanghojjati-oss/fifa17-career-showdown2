"use strict";
// r79 PR2: one start flow. js/whichShowdownIsLive.js is the single answer to "what does START do on this device?" and every
// START entry (Home tile, seasons-screen START, completed hub NEW SHOWDOWN, recovery START OVER, reload) follows it.
// Owner rules: only Daniel starts Showdowns (Nik never gets the seasons screen), START continues a live game by itself, START
// never offers to close a live Showdown, GET READY only for reload fallback and failures, one device never acts for the other.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const Which=require(path.join(ROOT,"js/whichShowdownIsLive.js"));
let passed=0;
async function check(name,fn){await fn();passed+=1;console.log(`ok ${passed} ${name}`);}

const R={1:`pair_1${"0".repeat(63)}`,3:`pair_3${"1".repeat(63)}`,5:`pair_5${"2".repeat(63)}`,10:`pair_a${"3".repeat(63)}`};
const OLD=`pair_3${"9".repeat(63)}`,OLD_SAVE=`save_${"8".repeat(24)}`,FRESH_SAVE=`save_${"7".repeat(24)}`;
const pair=(over={})=>({status:"unpaired",initialized:true,busy:false,rivalryId:null,connectionState:null,managerRole:null,closedRivalryId:null,...over});
const shell=(over={})=>({pending:true,untouched:true,totalSeasons:3,...over});
const decide=inputs=>Which.decide(inputs);
const NOW=1_800_000_000_000;

(async()=>{
await check("W1 the decision table: continue, close-then-new, resume-waiting, new, join, wait-for-daniel and pair-first",()=>{
  assert.deepEqual([...Which.actions],["continue","close-then-new","resume-waiting","new","join","wait-for-daniel","pair-first"]);
  // a live game continues for both managers, with the rivalry and its season length
  for(const role of ["playerOne","playerTwo"]){
    const live=decide({role,pair:pair({status:"paired",rivalryId:R[5],connectionState:"active",managerRole:role})});
    assert.deepEqual({...live},{action:"continue",rivalryId:R[5],totalSeasons:5,reason:"continue"});
  }
  // Daniel's code is out: WAITING again (never a second rivalry)
  assert.deepEqual({...decide({role:"playerOne",pair:pair({status:"waiting",rivalryId:R[10],connectionState:"pending-pair",managerRole:"playerOne"})})},{action:"resume-waiting",rivalryId:R[10],totalSeasons:10,reason:"resume-waiting"});
  // Daniel chose seasons on this browser but the code was never made (failure or reload): WAITING, the code is made from that shell
  assert.deepEqual({...decide({role:"playerOne",pair:pair(),shell:shell({totalSeasons:3})})},{action:"resume-waiting",rivalryId:null,totalSeasons:3,reason:"shell-without-code"});
  // nothing live: Daniel chooses seasons; Nik with no JOIN note known joins with a pasted code
  assert.equal(decide({role:"playerOne",pair:pair(),shell:{pending:false}}).action,"new");
  assert.deepEqual({...decide({role:"playerTwo",pair:pair()})},{action:"join",rivalryId:null,totalSeasons:null,reason:"paste-code"});
  // r79 PR3: an unexpired JOIN note carries the rivalry; a checked-and-empty inbox means wait for Daniel
  assert.deepEqual({...decide({role:"playerTwo",pair:pair(),note:{rivalryId:R[3],expiresAtEpochMs:NOW+60000},nowEpochMs:NOW})},{action:"join",rivalryId:R[3],totalSeasons:3,reason:"note"});
  assert.equal(decide({role:"playerTwo",pair:pair(),noteChecked:true}).action,"wait-for-daniel");
  // the connection itself needs attention first
  assert.equal(decide({role:null,pair:pair()}).reason,"no-player");
  for(const unknown of [null,pair({initialized:false}),pair({status:"unavailable"}),pair({status:"signed-out"}),pair({status:"idle"})])assert.deepEqual([decide({role:"playerOne",pair:unknown}).action,decide({role:"playerOne",pair:unknown}).reason],["pair-first","pair-unknown"]);
  assert.equal(decide({role:"playerOne",pair:pair({status:"pair-link-retry",rivalryId:R[1],connectionState:"pending-pair",managerRole:"playerOne"})}).reason,"link-retry");
  assert.equal(decide({role:"playerOne",pair:pair({status:"recovery-required",rivalryId:R[1],connectionState:"active",managerRole:"playerOne"})}).reason,"recovery");
  assert.equal(decide({role:"playerTwo",pair:pair({status:"waiting",rivalryId:R[1],connectionState:"pending-pair",managerRole:"playerTwo"})}).reason,"stale-join");
  assert.equal(decide({role:"playerOne",pair:pair({status:"paired",rivalryId:R[1],connectionState:"active",managerRole:"playerTwo"})}).reason,"identity-mismatch");
  // a closed rivalry is not live
  assert.equal(decide({role:"playerOne",pair:pair({connectionState:"closed",rivalryId:OLD}),shell:{pending:false}}).action,"new");
  assert.equal(decide({role:"playerTwo",pair:pair({connectionState:"closed",rivalryId:OLD})}).action,"join");
});

await check("W2 one device never invents the other's action: Nik never starts, Daniel never joins",()=>{
  const statuses=["unpaired","waiting","paired","recovery-required","pair-link-retry","save-required","error","unavailable"];
  const states=[null,"pending-pair","active","closed"],roles=[null,"playerOne","playerTwo"],ids=[null,R[3]];
  const shells=[{pending:false},shell(),shell({untouched:false}),shell({totalSeasons:7})];
  let n=0;
  for(const status of statuses)for(const connectionState of states)for(const managerRole of roles)for(const rivalryId of ids)for(const s of shells)for(const closedRivalryId of [null,OLD]){
    const p=pair({status,connectionState,managerRole,rivalryId,closedRivalryId});
    const nik=decide({role:"playerTwo",pair:p,shell:s}),daniel=decide({role:"playerOne",pair:p,shell:s});
    assert.ok(!["new","resume-waiting","close-then-new"].includes(nik.action),`Nik never starts (${JSON.stringify(p)})`);
    assert.ok(!["join","wait-for-daniel"].includes(daniel.action),`Daniel never joins (${JSON.stringify(p)})`);
    assert.ok(Which.actions.includes(nik.action)&&Which.actions.includes(daniel.action));
    assert.ok(Object.isFrozen(nik)&&Object.isFrozen(daniel));
    n+=1;
  }
  assert.equal(n,1536,"the whole matrix ran");
  // a touched shell (league drawn) or an unsupported season length never resumes; the shell bound to a closed Showdown never resumes
  assert.equal(decide({role:"playerOne",pair:pair(),shell:shell({untouched:false})}).action,"new");
  assert.equal(decide({role:"playerOne",pair:pair(),shell:shell({totalSeasons:7})}).action,"new");
  assert.equal(decide({role:"playerOne",pair:pair({closedRivalryId:OLD,closedProviderSaveId:OLD_SAVE}),shell:shell({saveId:OLD_SAVE})}).action,"new");
});

await check("W3 read() reuses the identity sidecar's own pair read (one bounded retry, none when a fresh state is handed in)",async()=>{
  let syncs=0;const results=[{status:"unavailable"},pair({status:"paired",rivalryId:R[3],connectionState:"active",managerRole:"playerOne"})];
  const library={activeSaveId:"save_1",saves:[{saveId:"save_1",showdown:{sharedJourney:{mode:"shared",setupPending:true},totalRounds:3,clubs:{},rounds:[]}}]};
  const world={CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",managerId:"daniel"}),syncPair:async()=>results[syncs++]},CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>library}};
  const first=await Which.read(world);
  assert.equal(syncs,2,"an unavailable read is retried exactly once");assert.equal(first.action,"continue");assert.equal(first.pair.rivalryId,R[3]);
  const handed=await Which.read(world,{pair:pair()});
  assert.equal(syncs,2,"a pair state START already read costs no second read");
  assert.equal(handed.action,"resume-waiting","the local untouched shell is read from the Save Library");
  assert.deepEqual(Which.localShell(world),{pending:true,untouched:true,totalSeasons:3,saveId:null,completed:false});
  assert.equal((await Which.read({CareerModeOnlinePlayerIdentity:{getState:()=>({status:"signed-out"}),syncPair:async()=>{syncs+=1;return null;}}})).reason,"no-player");
  assert.equal(syncs,2,"no player, no read");
  const source=read("js/whichShowdownIsLive.js");
  assert.doesNotMatch(source,/firestore|getDoc|onSnapshot|runTransaction|fetch\(/i,"the module itself never reads Firebase");
  assert.ok(Buffer.byteLength(source)<7000,"the module stays tiny (7000 since the ended-not-closed signal; r79 PR3's note check fits inside it)");
});

await check("W4 every START entry routes through the one canonical START",()=>{
  const identity=read("js/onlinePlayerIdentity.js"),entry=read("js/productionSharedJourneyEntry.js"),pairSource=read("js/persistentNikDanielPair.js"),hub=read("js/showdownUI.js");
  assert.match(identity,/if\(gameplay\.id==="newShowdown"&&!gameplay\.disabled\)\{e\.preventDefault\(\);e\.stopImmediatePropagation\(\);void openHomeStart\(\);return;\}/,"Home tile (both managers)");assert.match(identity,/function openHomeStart\(\)\{if\(canonicalStartFlowPromise\)return canonicalStartFlowPromise;homeStartChecking=true;applyHomeStartChecking\(\);const flow=openCanonicalStart\(\);/,"Codex #904: the Home tile shows its busy state, then runs that same canonical START");
  assert.equal((identity.match(/gameplay\.id==="newShowdown"/g)||[]).length,1,"one Home tile route");
  assert.match(identity,/openStart:openCanonicalStart,openJoin:openCanonicalShowdownJoin/);
  assert.match(identity,/async function openCanonicalStart\(\)\{if\(canonicalStartFlowPromise\)return canonicalStartFlowPromise;/,"a double tap on the Home tile shares one flow");
  assert.match(hub,/"NEW SHOWDOWN", \(\) => typeof window\.CareerModeOnlinePlayerIdentity\?\.openStart === "function"\s*\? window\.CareerModeOnlinePlayerIdentity\.openStart\(\)/,"completed hub NEW SHOWDOWN");
  assert.match(pairSource,/async function pairOpenCanonicalStart\(\)\{[\s\S]*identity\.openStart\(\)/,"recovery START OVER");
  assert.equal((pairSource.match(/await pairOpenCanonicalStart\(\)/g)||[]).length,2,"both START OVER exits");
  assert.match(entry,/const decision=await whichShowdownIsLive\(\);\s*if\(decision\.action!=="new"\)\{await followStartDecision\(decision\);return false;\}/,"seasons-screen START");
  assert.match(entry,/\["resume-waiting","join","wait-for-daniel"\]\.includes\(decision\.action\)\)return followStartDecision\(decision\);\s*return openPanel\(\);/,"reload: WAITING / JOIN, GET READY only as the fallback");
  assert.match(read("js/connectPlayersScreenV10.js"),/async function chooseSeasons\(\)\{[\s\S]*managerId==="nik"\)return false;/,"Nik's device never opens the seasons screen from Connect Players");
});

await check("W5 no bounce: WAITING stays on the league wheel, no reverse trip to seasons, league BACK goes Home",()=>{
  const layer=read("js/connectPlayersScreenV10.js"),pairSource=read("js/persistentNikDanielPair.js"),screens=read("js/screens.js");
  assert.match(layer,/if\(options\.stayOnScreen!==true\)\{\s*const home=typeof root\.navigateTo==="function"/,"stayOnScreen skips the Home re-navigation");
  const ensure=pairSource.slice(pairSource.indexOf("async function pairEnsurePreparedBinding"),pairSource.indexOf("async function pairAttachRecoveryPointer"));
  assert.doesNotMatch(ensure,/showScreen|navigateTo/,"the pair controls never send Daniel back to the seasons screen");
  assert.match(pairSource,/role==="playerOne"&&pairPreparedTotalRounds\(\)===null\)[\s\S]*?"CHOOSE SEASONS"/,"without chosen seasons the panel offers CHOOSE SEASONS");
  assert.match(screens,/if\(screenName === "leagueWheelScreen" && currentShowdown\?\.sharedJourney\?\.setupPending === true\)\{ return \["mainMenu"\]; \}/,"league wheel BACK -> Home while the marker is set");
});

await check("W6 auto-continue after connect keeps START CAREER as the fallback and the createdShell rollback",()=>{
  const pairSource=read("js/persistentNikDanielPair.js");
  const tick=pairSource.match(/async function pairWaitingPollTick\(\)\{[\s\S]*?\n  \}/)[0];
  assert.match(tick,/await pairInitialize\(\{force:true\}\);[\s\S]*state\.connectionState==="active"&&state\.status==="paired"&&`\$\{state\.accountId\}\|\$\{state\.rivalryId\}`===key\)\{[^}]*\*\/const recording=pairRecordRealPairing\(state\.rivalryId,"playerOne"\);await pairAutoContinueAfterConnect\(\);await recording;\}/,"Daniel continues only for the rivalry he was waiting on (r79 PR3: a real first pairing is recorded alongside)");
  assert.match(pairSource,/async function pairJoinAndContinue\(capability,options=\{\}\)\{const wasActive=state\.connectionState==="active",joined=await pairJoinPairing\(capability,options\);if\(!wasActive&&options\.autoContinue!==false&&joined\?\.status==="paired"&&joined\.connectionState==="active"\)await pairAutoContinueAfterConnect\(\);return joined;\}/,"Nik continues after his own successful JOIN");
  assert.match(pairSource,/pairSyncWaitingPoll\(\);pairContinueAfterWaitEnded\(\);return state;\}/,"every settled state change can continue, not only the poll");
  assert.match(pairSource,/if\(!key\)\{if\(pairWaitKey\)pairWaitEndedKey=pairWaitKey;/,"the waited-on rivalry is remembered when the wait ends");
  assert.match(pairSource,/function pairContinueAfterWaitEnded\(\)\{if\(!pairWaitEndedKey\|\|state\.busy\)return;const key=pairWaitEndedKey;pairWaitEndedKey="";if\(state\.connectionState==="active"&&state\.status==="paired"&&`\$\{state\.accountId\}\|\$\{state\.rivalryId\}`===key\)/,"CHECK STATUS or a refresh continues only for the rivalry Daniel was waiting on");
  assert.match(pairSource,/joinPairing:pairJoinAndContinue/);
  assert.match(pairSource,/void pairJoinAndContinue\(input\.value,\{managerRole:"playerTwo"\}\)/,"the JOIN button");
  assert.match(pairSource,/if\(createdShell&&committed\.checked&&pairJoinFailureIsDefinitive\(error\)\)\{try\{await pairDeleteExactPreparedShell\(context,role,createdShell\.saveId,createdShell\.profileId\);/,"createdShell rollback unchanged");
  const auto=pairSource.slice(pairSource.indexOf("function pairAutoContinueAfterConnect"),pairSource.indexOf("async function pairJoinAndContinue"));
  assert.match(auto,/if\(pairAutoContinuePromise\)return pairAutoContinuePromise;/,"single flight");
  assert.match(auto,/const next=await pairContinueOnlineShowdown\(\);if\(next\?\.status!=="paired"\)\{try\{await layer\?\.open\?\.\(\{sync:false,stayOnScreen:true\}\);/,"a failed continue reopens Connect Players with START CAREER / TRY CONTINUE AGAIN");
  assert.doesNotMatch(auto,/createPairing|redeemPairing|hostSession|joinSession|startPairing/,"auto-continue never creates, redeems or hosts anything");
  assert.match(pairSource,/state\.status==="error"\?"TRY CONTINUE AGAIN":"START CAREER"/,"START CAREER stays");
});

await check("W8 PR #901 P1: an older closed Showdown never turns a fresh, code-less shell into a second shell",()=>{
  // syncPair keeps the last closed rivalry (closedRivalryId) after Daniel creates a fresh shell; if code creation fails or the
  // page reloads before the new pair is saved, START must re-make the code on THAT shell, never append a second one.
  const fresh=decide({role:"playerOne",pair:pair({closedRivalryId:OLD,closedProviderSaveId:OLD_SAVE}),shell:shell({saveId:FRESH_SAVE})});
  assert.deepEqual({...fresh},{action:"resume-waiting",rivalryId:null,totalSeasons:3,reason:"shell-without-code"},"closed old rivalry + fresh untouched shell -> WAITING on the same shell");
  assert.equal(decide({role:"playerOne",pair:pair({closedRivalryId:OLD}),shell:shell({saveId:FRESH_SAVE})}).action,"resume-waiting","a closed rivalry with no known save never blocks a fresh shell");
  assert.equal(decide({role:"playerOne",pair:pair({closedRivalryId:OLD,closedProviderSaveId:OLD_SAVE}),shell:shell({saveId:OLD_SAVE})}).action,"new","only the closed Showdown's own shell counts as closed");
  const pairSource=read("js/persistentNikDanielPair.js");
  assert.match(pairSource,/pairLastClosedRivalryId=link\.rivalryId;pairLastClosedProviderSaveId=pairValidSaveId\(slot\.saveId\)\?slot\.saveId:null;/,"the closed rivalry's own save (this account's manager slot) is remembered with it");
  assert.match(pairSource,/closedRivalryId:pairLastClosedRivalryId,closedProviderSaveId:pairLastClosedProviderSaveId,/);
  assert.match(read("js/whichShowdownIsLive.js"),/const closedHere=Boolean\(rid\(pair\.closedRivalryId\)&&wslSave\(pair\.closedProviderSaveId\)&&pair\.closedProviderSaveId===shell\.saveId\);/);
});

await check("W9 Nik's call (2026-10-17): an ENDED but never CLOSED Showdown is closed by Daniel's START, then seasons",async()=>{
  const live=over=>pair({status:"paired",rivalryId:R[3],connectionState:"active",managerRole:"playerOne",providerSaveId:OLD_SAVE,...over});
  const ended={pending:false,untouched:false,totalSeasons:3,saveId:OLD_SAVE,completed:true};
  assert.deepEqual({...decide({role:"playerOne",pair:live(),shell:ended})},{action:"close-then-new",rivalryId:R[3],totalSeasons:3,reason:"ended-not-closed"});
  assert.equal(decide({role:"playerOne",pair:live(),shell:{...ended,completed:false}}).action,"continue","a Showdown still in progress keeps continuing");
  assert.equal(decide({role:"playerOne",pair:live(),shell:{...ended,saveId:FRESH_SAVE}}).action,"continue","only the live rivalry's own save counts as ended");
  assert.equal(decide({role:"playerTwo",pair:live({managerRole:"playerTwo"}),shell:ended}).action,"continue","Nik's START never closes or starts anything");
  assert.equal(decide({role:"playerOne",pair:live({status:"recovery-required"}),shell:ended}).action,"pair-first","recovery first, never a close");
  const world={CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>({activeSaveId:OLD_SAVE,saves:[{saveId:OLD_SAVE,showdown:{status:"Ready",totalRounds:3,rounds:[{},{},{}],sharedJourney:{mode:"shared"},clubs:{}}}]})}};
  assert.equal(Which.localShell(world).completed,true,"all seasons recorded counts as ended");
  // a shared Showdown's local save stays "Created": read() takes "ended" from this page's own final reconciliation / terminal close
  const created={CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>({activeSaveId:OLD_SAVE,saves:[{saveId:OLD_SAVE,showdown:{status:"Created",totalRounds:3,rounds:[],sharedJourney:{mode:"shared",setupPending:true},clubs:{}}}]})},
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",managerId:"daniel"})}};
  const endedBy=async extra=>(await Which.read({...created,...extra},{pair:live()})).action;
  assert.equal(await endedBy({}),"continue","nothing known to have ended: continue");
  assert.equal(await endedBy({CareerModeProductionSharedFinalReconciliation:{getState:()=>({phase:"FINAL_SEASON_RECONCILED",rivalryId:R[3]})}}),"close-then-new","final reconciled for the live rivalry");
  for(const phase of ["READY","BLOCKED","RECOVERY_PENDING","CLOSED"])assert.equal(await endedBy({CareerModeProductionSharedTerminalClose:{getState:()=>({phase,rivalryId:R[3]})}}),"close-then-new",phase);
  assert.equal(await endedBy({CareerModeProductionSharedFinalReconciliation:{getState:()=>({phase:"FINAL_SEASON_RECONCILED",rivalryId:R[5]})}}),"continue","another rivalry's final never counts");
  assert.equal(await endedBy({CareerModeProductionSharedFinalReconciliation:{getState:()=>({phase:"SEASON_RECONCILED",rivalryId:R[3]})}}),"continue","mid-Showdown keeps continuing");
  assert.doesNotMatch(read("js/whichShowdownIsLive.js").slice(read("js/whichShowdownIsLive.js").indexOf("function wslEnded")),/refresh\(|close\(|retry\(/,"ended is read from page memory only (no new read)");
  // the entry follows it through the final-screen terminal close only; nothing is created unless that close succeeded
  const entry=read("js/productionSharedJourneyEntry.js"),identity=read("js/onlinePlayerIdentity.js");
  const close=entry.slice(entry.indexOf("function closeEndedThenNew()"),entry.indexOf("async function followStartDecision"));
  assert.match(close,/loadScript\("ssjr-production-terminal-close","js\/productionSharedTerminalClose\.js",\(\)=>root\.CareerModeProductionSharedTerminalClose\)/,"the same terminal close module the final screen uses");
  assert.match(close,/if\(state&&state\.phase==="READY"\)result=await close\.close\(\);\s*else if\(state&&state\.phase==="RECOVERY_PENDING"&&typeof close\.retry==="function"\)result=await close\.retry\(\);/,"READY closes, RECOVERY_PENDING retries the same witness");
  assert.match(close,/catch\(error\)\{report\("Unable to close the ended Showdown",error\);await openPersistentPairControls\(\);return false;\}\s*const opened=[^;]*navigateTo\("createShowdown"\)/,"seasons only after the close; a failed close stops on Connect Players");
  assert.doesNotMatch(close,/createShowdown\(\)|startPairing|abandonCurrentShowdown|continuePair/,"the close path itself never creates, pairs, abandons or continues");
  assert.match(entry,/if\(decision\.action==="close-then-new"\)return closeEndedThenNew\(\);/);
  assert.match(identity,/decision\.action!=="close-then-new"\)\{await openCanonicalShowdownJoin/,"Home START hands close-then-new to the entry, not to JOIN");
});

await check("W10 r79 PR3: Daniel's JOIN note routes Nik to JOIN only while it is valid; otherwise Waiting for Daniel",async()=>{
  const note=(over={})=>({rivalryId:R[5],totalSeasons:5,fromAccountId:"uid_daniel",expiresAtEpochMs:NOW+5*60000,...over});
  const nik=(over={})=>decide({role:"playerTwo",pair:pair(),noteChecked:true,nowEpochMs:NOW,...over});
  assert.deepEqual({...nik({note:note()})},{action:"join",rivalryId:R[5],totalSeasons:5,reason:"note"},"a valid note -> JOIN on Home with its rivalry");
  assert.equal(nik({note:note({expiresAtEpochMs:NOW})}).action,"wait-for-daniel","an expired note -> Waiting for Daniel");
  assert.equal(nik({note:note({expiresAtEpochMs:undefined})}).action,"wait-for-daniel","a note without an expiry never counts");
  assert.equal(nik({note:note(),nowEpochMs:undefined}).action,"wait-for-daniel","no clock, no note");
  assert.equal(nik({note:note({rivalryId:"pair_bad"})}).action,"wait-for-daniel","a malformed rivalry never counts");
  assert.equal(nik({note:note({rivalryId:OLD}),pair:pair({closedRivalryId:OLD})}).action,"wait-for-daniel","the note of the Showdown Nik already finished never reopens it");
  assert.equal(nik({note:null}).action,"wait-for-daniel");
  assert.deepEqual({...nik({note:null,noteChecked:false})},{action:"join",rivalryId:null,totalSeasons:null,reason:"paste-code"},"inbox not checked (no partner, read failed): paste a code");
  // a live pair always wins over a note: continue an ACTIVE game, never redeem the note
  assert.equal(nik({note:note(),pair:pair({status:"paired",rivalryId:R[3],connectionState:"active",managerRole:"playerTwo"})}).action,"continue");
  // Daniel never reads or acts on a note
  assert.equal(decide({role:"playerOne",pair:pair(),note:note(),noteChecked:true,nowEpochMs:NOW,shell:{pending:false}}).action,"new");
  // read() takes the note from the pair module's memo (no read of its own); noteChecked needs an active partner record
  const memo={status:"ready",checked:true,partnerActive:true,note:note({expiresAtEpochMs:Date.now()+60000})};
  const world=view=>({CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",managerId:"nik"})},CareerModePersistentNikDanielPair:{getJoinNoteState:()=>view}});
  assert.deepEqual([(await Which.read(world(memo),{pair:pair()})).action,(await Which.read(world(memo),{pair:pair()})).rivalryId],["join",R[5]]);
  assert.equal((await Which.read(world({...memo,note:null}),{pair:pair()})).action,"wait-for-daniel");
  assert.equal((await Which.read(world({...memo,note:null,partnerActive:false}),{pair:pair()})).reason,"paste-code","no active partner: the paste-code path");
  assert.equal((await Which.read(world({...memo,note:null,checked:false}),{pair:pair()})).reason,"paste-code","an unread inbox never claims Waiting for Daniel");
  const danielWorld={...world(memo),CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",managerId:"daniel"})}};
  assert.equal((await Which.read(danielWorld,{pair:pair()})).action,"new","Daniel's read ignores any note");
  // Home's JOIN redeems through the existing joinPairing (auto-continue) with the note's rivalry; a failure opens the code box
  const identity=read("js/onlinePlayerIdentity.js");
  assert.match(identity,/const decision=await which\.read\(root\);if\(decision\.action==="join"&&decision\.rivalryId\)\{await openCanonicalNoteJoin\(decision\);return decision;\}/);
  // The entry's other START paths (reload recovery, locked-wheel CONTINUE) hand their decision over, so a note JOIN redeems there too;
  // the fallback to the paste panel passes no decision, so it cannot loop.
  assert.match(identity,/async function openCanonicalShowdownJoin\(options=\{\}\)\{\/\*[^*]*\*\/if\(options&&options\.decision&&options\.decision\.action==="join"&&options\.decision\.rivalryId\)return openCanonicalNoteJoin\(options\.decision\);/);
  assert.match(fs.readFileSync(path.join(ROOT,"js/productionSharedJourneyEntry.js"),"utf8"),/identity\.openJoin\(\{pair:decision\.pair\|\|null,decision\}\)/);
  assert.match(identity,/async function openCanonicalNoteJoin\(decision\)\{[^\n]*joined=await pair\.joinPairing\(pair\.buildPlayerJoinCode\(decision\.rivalryId\),\{managerRole:"playerTwo"\}\);[^\n]*if\(!joined\|\|joined\.connectionState!=="active"\)await openCanonicalShowdownJoin\(/);
  assert.match(identity,/if\(decision\.action!=="continue"&&decision\.action!=="resume-waiting"&&decision\.action!=="close-then-new"\)\{await openCanonicalShowdownJoin\(/,"wait-for-daniel (the tile is the PASTE A CODE backup) opens the code box");
});

await check("W7 the module is precached, lazy (not a startup file) and registered",()=>{
  const sw=read("service-worker.js"),html=read("index.html");
  assert.ok(sw.includes('"js/whichShowdownIsLive.js",'),"precached in SHELL_PATHS");
  const added=sw.slice(sw.indexOf("const SHELL_PATHS_ADDED_SINCE_PREVIOUS"),sw.indexOf("const PREVIOUS_SHELL_PATHS"));
  assert.ok(added.includes('"js/whichShowdownIsLive.js"'),"listed as added since the retained previous shell");
  assert.ok(!html.includes("whichShowdownIsLive"),"not a startup script (startup budget)");
  assert.match(read("js/onlinePlayerIdentity.js"),/loadOnlineDependency\("which-showdown","js\/whichShowdownIsLive\.js",\(\)=>root\.CareerModeWhichShowdownIsLive\)/);
  assert.match(read("js/productionSharedJourneyEntry.js"),/loadScript\("which-showdown","js\/whichShowdownIsLive\.js",\(\)=>root\.CareerModeWhichShowdownIsLive\)/);
  const registry=JSON.parse(read("POS20_SUPPLEMENTAL_PRODUCT_TESTS.json"));
  assert.ok(registry.tests.some(entry=>entry.path==="tests/contracts/which-showdown-is-live-contracts.cjs"));
});

console.log(`PASS whichShowdownIsLive one start flow contracts: ${passed} checks.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
