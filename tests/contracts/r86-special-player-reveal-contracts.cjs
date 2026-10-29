'use strict';
// r86 Special Player reveal (Nik 2026-10-27, look = Team V HO-035): which manager sees it and when, that Team V's page shows
// the same players the draw gives, the game <-> page messages, where it sits in Career Start, the offline shell, and the
// Firebase confirm time it is keyed on (carried from the existing Setup read: no new read, no new write).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const List=require('../../data/marqueePlayers.js');
const MP=require('../../js/marqueePlayer.js');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

const revealSource=read('js/specialPlayerReveal.js');
function revealWorld(){
  const store=new Map();
  const root={CareerModeMarqueePlayer:MP,CareerModeMarqueePlayers:List,readStorageValue:key=>store.has(key)?store.get(key):null,writeStorageValue:(key,value)=>{store.set(key,value);return true;},setTimeout,clearTimeout};
  const sandbox={globalThis:root};vm.runInNewContext(revealSource,sandbox);
  return {root,store,api:root.CareerModeSpecialPlayerReveal};
}
const RIVALRY='pair_'+'3a'.repeat(32);
const confirmed=(extra={})=>({ready:true,rivalryId:RIVALRY,managerRole:'playerOne',setup:{phase:'SHOWDOWN_CONFIRMED',revision:6},setupUpdatedAtMs:MP.fromMs+60000,...extra});

// R1 who sees it
{
  const {root,store,api}=revealWorld();
  const pick=api.decide(confirmed());
  const picks=MP.picks(RIVALRY,List.players.length);
  assert.deepEqual({...pick},{key:`${RIVALRY}|playerOne`,d:picks.playerOne,n:picks.playerTwo},'Daniel (playerOne) left, Nik (playerTwo) right, from the shared draw');
  assert.deepEqual(MP.forShowdown(RIVALRY,MP.fromMs+60000).playerOne.name,List.players[pick.d].name,'the reveal shows the pair the career screens show');
  assert.equal(api.decide(confirmed({setupUpdatedAtMs:MP.fromMs-1})),null,'a Showdown confirmed before r86 has no reveal');
  assert.equal(api.decide(confirmed({setupUpdatedAtMs:null})),null,'no confirm time, no reveal');
  assert.equal(api.decide(confirmed({setup:{phase:'CLUBS_COMMITTED',revision:5}})),null,'only a confirmed Setup');
  assert.equal(api.decide(confirmed({ready:false})),null);
  assert.equal(api.decide(confirmed({rivalryId:'pair_short'})),null,'an id the draw cannot read');
  store.set(api.seenKey,JSON.stringify([`${RIVALRY}|playerOne`]));
  assert.equal(api.decide(confirmed()),null,'once per manager per Showdown');
  assert.ok(api.decide(confirmed({managerRole:'playerTwo'})),'the other manager on the same browser still sees it');
  store.clear();root.CMS_SPECIAL_PLAYER_REVEAL='off';
  assert.equal(api.decide(confirmed()),null,'emulator journeys switch it off');
  assert.equal(api.minLoadingMs,1000);assert.equal(api.maxLoadingMs,15000);
  ok('R1','only a Showdown confirmed on r86 or later, once per manager, Daniel left and Nik right from the shared draw; the loading screen holds 1-15 s');
}

// R2 Team V's page lists the same players in the same order
const page=read(api_page());
function api_page(){return revealWorld().api.page;}
{
  const match=/const MP_LIST=(\[[\s\S]*?\]\]\]);/.exec(page);assert.ok(match,'MP_LIST in the page');
  const rows=JSON.parse(match[1]);
  assert.equal(rows.length,List.players.length);
  rows.forEach((row,i)=>{const p=List.players[i];
    assert.deepEqual(row.slice(0,8),[p.rank,p.name,p.club,p.overall,p.potential,p.number,p.nationCode,p.position],`page row ${i}`);
    assert.deepEqual(Object.fromEntries(row[8]),p.stats,`page row ${i} stats`);});
  ok('R2',`Team V's page carries the ${rows.length} players of data/marqueePlayers.js in list order, so ?d=&n= are the draw's rows`);
}

// R3 game <-> page messages
{
  assert.match(page,/var EMBED=\/\[\?&\]embed=1/,'the error box knows it is in the game');
  assert.match(page,/if\(EMBED\)\{ try\{ parent\.postMessage\(\{type:"cms-sp-error"/,'errors go to the game, not a red box');
  assert.match(page,/toGame\("cms-sp-ready"\)/);
  assert.match(page,/e\.source!==parent\|\|e\.origin!==location\.origin\|\|!e\.data\|\|e\.data\.type!=="cms-sp-start"/,'the page starts only on the game\'s start message');
  assert.match(page,/if\(EMBED\)\{ if\(cta\.dataset\.sent\) return; cta\.dataset\.sent="1"; cta\.disabled=true; cta\.textContent="Opening Career Start…"; toGame\("cms-sp-continue"\)/,'Continue tells the game once');
  assert.match(page,/else requestAnimationFrame\(frame\); \}\);/,'the preview (no embed) still plays at once');
  assert.match(revealSource,/event\.source!==frame\.contentWindow\|\|event\.origin!==origin/,'the game listens only to its own frame');
  assert.match(revealSource,/frame\.contentWindow\.postMessage\(\{type:"cms-sp-start"\},root\.location\.origin\)/);
  assert.match(revealSource,/if\(outcome!=="ready"\)throw/);assert.match(revealSource,/catch\(_error\)\{if\(channel\)channel\.stop\(\);spMarkSeen\(pick\.key\);spRemoveStage\(\);loading\.hide\(\);return null;\}/,'a failed page is skipped and kept as seen, so a reload never re-runs it over the live game (red team #1)');
  assert.match(revealSource,/frame\.contentWindow\.postMessage\(\{type:"cms-sp-start"\},root\.location\.origin\);\s*spMarkSeen\(pick\.key\);/,'seen is kept as soon as the reveal is shown, not at Continue (red team #1)');
  assert.ok(!/failedHere/.test(revealSource),'no page-only skip list');
  assert.match(page,/function loadPano\(\)\{ return new Promise\(\(res,rej\)=>[^\n]*,undefined,\(\)=>rej\(/,'a failed stadium image ends the page at once (red team #2)');
  assert.match(revealSource,/event\.data\.type==="cms-sp-error"\)\{onReady\("error"\);onContinue\("error"\);\}/,'an error after ready also ends the Continue wait (Codex P2 on #1035)');
  assert.match(revealSource,/if\(end==="error"\)\{spRemoveStage\(\);return null;\}/,'so the broken stage is removed and Career Start opens');
  assert.match(revealSource,/stage\.style\.visibility="visible";\s*frame\.contentWindow\.postMessage/,'the stage is shown before the loading screen fades');
  assert.match(revealSource,/z-index:95/,'above Settings (90), under the loading screen (100) and confirm dialogs (120)');
  ok('R3','ready / start / continue / error messages are origin- and frame-checked; failure skips the reveal; the loading screen fades onto a drawn first frame');
}

// R4 where it sits in Career Start
{
  const pcst=read('js/productionSharedCareerStart.js');
  assert.match(pcst,/const run=pcstSpecialPlayerFirst\(\)\.then\(stage=>\{revealStage=stage;return pcstWithTimeout\(pcstOpenPanelNow\);\}\)\.finally\(pcstCloseReveal\);openPromise=run;/,'the reveal runs before, and outside, the 25 s Career Start timeout');
  const first=/async function pcstSpecialPlayerFirst\(\)\{([\s\S]*?)\n  \}/.exec(pcst)[1];
  assert.ok(!first.includes('pcstEnsureDependencies'),'the reveal waits on no Career Start dependency');
  assert.match(first,/if\(!api\|\|!pcstConfirmed\(\)\|\|pcstReadyHere\(\)\)return null;/,'a Career Start already READY here goes straight on');
  assert.match(first,/catch\(_error\)\{return null;\}/);
  assert.match(pcst,/overlay\.classList\.remove\("hidden"\);pcstRender\(\);pcstCloseReveal\(\);await request\.wait\(pcstRefresh/,'the stage closes only once Career Start is up under it');
  assert.match(pcst,/pcstReadyHere\(\)&&await request\.wait\(pcstOpenTransferChallenge\(\)\)\)return pcstCloseReveal\(\);/);
  assert.match(revealSource,/function runBeforeCareerStart\(setupApi\)\{\s*if\(running\)return running;/,'one reveal at a time');
  assert.match(revealSource,/\.catch\(\(\)=>\{spRemoveStage\(\);return null;\}\)/,'never rejects');
  ok('R4','Career Start opens after the reveal, outside its timeout, and the stage leaves only when Career Start is up');
}

// R5 offline shell
{
  const sw=read('service-worker.js');
  for(const file of ['js/specialPlayerReveal.js','visual-assets/v10_1/special-player/index.html','js/marqueePlayer.js','data/marqueePlayers.js']){
    assert.ok(new RegExp(`^\\s+"${file.replace(/[.\/]/g,m=>'\\'+m)}",?$`,'m').test(sw),`${file} is shell-cached`);
    assert.ok(/const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set\(\[([^\]]*)\]\);/.exec(sw)[1].includes(`"${file}"`),`${file} is new since the rollback shell`);
  }
  assert.match(sw,/const SHELL_FRAME_NAVIGATION_PATHS = new Set\(\[\s*"visual-assets\/v10_1\/special-player\/index\.html"\s*\]\);/);
  assert.match(sw,/if\(SHELL_FRAME_NAVIGATION_PATHS\.has\(path\)\)\{ event\.respondWith\(\(async\(\)=>\{ const selected=await chooseNavigationRuntime\(\); const cached=selected\?await cachedShellResponse\(path,selected\.revision\):null; return cached\|\|fetch\(request\); \}\)\(\)\); return; \}/,'the frame gets its own page, never index.html');
  for(const image of fs.readdirSync(path.join(ROOT,'visual-assets/v10_1/special-player/assets')))assert.match(`visual-assets/v10_1/special-player/assets/${image}`,new RegExp(/const V10_IMAGE_PATH = \/(.+)\/i;/.exec(sw)[1],'i'),`${image} uses the Team V image cache`);
  ok('R5','the reveal scripts and page are shell-cached for the release (and listed as new for rollback); the frame navigation is served its own page; its art uses the Team V image cache');
}

// R6 the confirm time comes with the existing Setup read
{
  const spark=read('js/sparkSharedShowdownSetup.js'),prod=read('js/productionSharedShowdownSetup.js');
  assert.match(spark,/const updatedAtMs=ssrpTimestampMillis\(ctx\.ledger\.updatedAt\);\s*return Object\.freeze\(\{ok:true,status:"live",revision:ctx\.ledger\.revision,state,updatedAtMs:Number\.isFinite\(updatedAtMs\)\?updatedAtMs:null\}\);/);
  assert.match(prod,/setupUpdatedAtMs:Number\.isFinite\(result\.updatedAtMs\)\?result\.updatedAtMs:null/);
  assert.match(revealSource,/!Number\.isFinite\(state\.setupUpdatedAtMs\)&&typeof setupApi\.refresh==="function"/,'a manager whose last Setup state came from their own tap reads it once');
  assert.ok(!/firestore|getDoc|setDoc|runTransaction/i.test(revealSource.replace(/\/\/.*$/gm,'')),'the reveal itself does no Firebase IO');
  ok('R6','the shared Setup read carries its updatedAt (the Rules pin it at confirm) to the reveal: no new read or write');
}

// R7 emulator journeys
{
  const sw=read('tests/browser/support/emulator-runtime-switch.js');
  assert.match(sw,/get\("cmsSpecialPlayer"\)!=="1"\)root\.CMS_SPECIAL_PLAYER_REVEAL="off"/);
  ok('R7','emulator journeys skip the reveal unless they ask for it (cmsSpecialPlayer=1); its own browser audit covers it');
}

console.log(`PASS r86 Special Player reveal contracts: ${checks} numbered checks (who, same players, messages, Career Start order, offline shell, confirm time, journeys).`);
