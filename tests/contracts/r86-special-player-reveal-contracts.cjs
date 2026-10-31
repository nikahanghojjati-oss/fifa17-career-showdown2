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
  assert.match(revealSource,/if\(outcome!=="ready"\)throw/);assert.match(revealSource,/catch\(_error\)\{if\(channel\)channel\.stop\(\);spRemoveStage\(\);loading\.hide\(\);return null;\}/,'red team R87-SP-03 (replaces red team #1 here): a page that never started is skipped but NOT marked seen, so the reveal plays at the next Career Start once it can load');
  assert.ok(!/catch\(_error\)\{[^}]*spMarkSeen/.test(revealSource),'a failed page is never marked seen');
  assert.match(page,/<script src="\.\.\/roulette\/vendor\/three-r128\.min\.js"><\/script>/,'R87-SP-03: three.js from the shell-cached vendored copy');
  assert.ok(!/cdnjs\.cloudflare\.com/.test(page),'no CDN script on the reveal page');
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
  assert.match(sw,/const SHELL_FRAME_NAVIGATION_PATHS = new Set\(\[\s*"visual-assets\/v10_1\/special-player\/index\.html",\s*"visual-assets\/v10_1\/roulette\/index\.html"\s*\]\);/,"the Special Player page (and r87's roulette page) are frame navigations");
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

// R8-R12 Special Player hype ideas (2026-10-29, Team G r86): the guarantees that can be read in the page source.
const one=(re,label)=>{const m=re.exec(page);assert.ok(m,`${label} in the page`);return m[0];};
const pageCode=(...parts)=>vm.runInNewContext(parts.join('\n')+';({TIER_ORDER,tierLevel,LADDER_T0,LADDER_DT,LADDER,ladderStep,ENCORE,ENCORE_TAIL,encoreFor,scoutInFor,GUARD_TIERS})',{});
const hype=pageCode(
  one(/const TIER_ORDER=\[[^\n]*/,'tier scale'),one(/const LADDER_T0=[^\n]*/,'ladder timing'),one(/const LADDER=\[[^\n]*/,'ladder colours'),one(/const ladderStep=[^\n]*/,'ladder step'),
  one(/const SCOUT_IN_BASE=[^\n]*/,'hold times'),one(/const scoutInFor=[^\n]*/,'hold time by tier'),one(/const ENCORE=\{[^\n]*/,'encore list'),one(/const encoreFor=[^\n]*/,'encore by tier'),
  one(/const GUARD_TIERS=\{[^}]*\}/,'skip guard tiers'));
const TIERS=['bronze','silver','gold','blue-gold','black-blue-gold'];
// R8 the pack's colour ladder never shows a higher tier than the real one, and climbs to it before the pack bursts (3.7 s)
{
  assert.deepEqual([...hype.TIER_ORDER],TIERS,'one tier scale, rank 51+ (bronze) up to top 3');
  const power=/const TIER = \{([\s\S]*?)\n\};/.exec(page)[1];const powers=TIERS.map(t=>Number(new RegExp(`"${t}":\\s*\\{[^\\n]*power:([\\d.]+)`).exec(power)[1]));
  assert.deepEqual(powers,[...powers].sort((a,b)=>a-b),'the scale follows the card power');
  assert.equal(hype.LADDER.length,5,'bronze, silver, gold, blue, black-blue-gold');
  for(const tier of TIERS){const lvl=hype.tierLevel(tier),p={tier};
    for(let tt=0;tt<=12;tt+=.005)assert.ok(hype.ladderStep(p,tt)<=lvl,`${tier}: ladder step at ${tt.toFixed(3)} s never above the real tier`);
    assert.equal(hype.ladderStep(p,3.69),lvl,`${tier}: the ladder has reached the real tier before the burst`);
    assert.equal(hype.ladderStep(p,hype.LADDER_T0-.01),-1,'no step before the ladder starts');}
  assert.match(page,/const lad=ladderColor\(p,tt\), ladA=ladderAccent\(p,tt\);\s*for\(let i=0;i<=lvl;i\+\+\)/,'the pack colour and the step ticks come from the ladder, up to the real tier only');
  ok('R8','the pack colour ladder stops at the real tier (rank 51+ bronze, top 3 all five) and never shows a higher one');
}
// R9 skip guard tiers, card tap, Replay
{
  assert.deepEqual(Object.keys(hype.GUARD_TIERS).sort(),['black-blue-gold','blue-gold','gold'],'top 3, top 10 and top 20 need a second tap');
  assert.match(page,/const guarded=\(\)=>vtt<LADDER_T0\+2\*LADDER_DT\|\|Boolean\(GUARD_TIERS\[cur\(\)\.tier\]\);/,'until the ladder reaches gold every reveal asks twice, so the hint never tells a tier early');
  assert.match(page,/if\(phase==="settled"\)\{ if\(onCard\(e\.clientX,e\.clientY\)\) toScout\(\); return; \}\s*guardedSkip\(\); \}\);/,'a tap on the held card goes to the report; any other tap follows the skip rules');
  assert.match(page,/Math\.hypot\(e\.clientX-downAt\[0\],e\.clientY-downAt\[1\]\)>12\)\{ downAt=null; return; \}/,'a tilt drag is never a tap');
  const replay=one(/function replay\(\)\{[^\n]*\}/,'Replay');
  assert.ok(!/toGame|postMessage|fetch|XMLHttpRequest/.test(replay),'Replay sends nothing to the game and makes no request');
  assert.match(page,/\$\("again"\)\.addEventListener\("click",e=>\{ e\.stopPropagation\(\); replay\(\); \}\);/);
  assert.match(page,/if\(idx===1\)\{ bothShown=true; if\(!cta\.dataset\.sent\)\{ cta\.disabled=false;/,'a Continue already sent is never armed again by a replay');
  assert.equal((page.match(/toGame\("cms-sp-continue"\)/g)||[]).length,1,'one place sends Continue');
  ok('R9','top 3-20 reveals need a second tap to skip (top 50 and rank 51+ one), a tap on the held card opens the report, Replay stays local');
}
// R10 encore volleys per tier, all before the scouting report
{
  assert.deepEqual(TIERS.map(t=>hype.encoreFor(t).length),[0,0,1,2,3],'top 3 three volleys, top 10 two, top 20 one, top 50 and rank 51+ none');
  for(const tier of TIERS)for(const t of hype.encoreFor(tier))assert.ok(t+hype.ENCORE_TAIL<hype.scoutInFor(tier),`${tier}: the volley at ${t} s ends before the report`);
  assert.deepEqual(TIERS.map(t=>hype.scoutInFor(t)),[3,4.5,6,7.5,9],'hold times unchanged (x2..x6 of 1.5 s)');
  assert.match(page,/if\(k>=t&&!fired\["enc"\+i\]\)\{ fired\["enc"\+i\]=1; if\(k-t<\.3&&k<SCOUT_IN-ENCORE_TAIL\) encore\(cur\(\),i\); \}/,'a volley made late by a jump to the report is dropped');
  assert.match(page,/confettiRain\(natCols\(p\.nation\)\.concat\(\[0xf1c35a,0xfff3c4\]\),Math\.round\(110\*PK\),-6,6,3,4\);/,'encore confetti falls behind the card plane (z -9 to -3)');
  ok('R10','encore volleys: top 3 three, top 10 two, top 20 one, none below; behind the card and over before the scouting report');
}
// R11 vibration: feature-detected, guarded, silent when muted
{
  const buzz=one(/function buzz\(pattern\)\{[^\n]*\}/,'buzz');
  assert.match(page,/const CAN_BUZZ=typeof navigator!=="undefined"&&typeof navigator\.vibrate==="function";/);
  assert.match(buzz,/if\(!CAN_BUZZ\|\|!SFX\.on\|\|REDUCED\) return; try\{ navigator\.vibrate\(pattern\); \}catch\(e\)\{\}/,'no buzz without vibrate, with the speaker off, or under reduced motion; never throws');
  assert.equal((page.match(/navigator\.vibrate\(/g)||[]).length,1,'buzz() is the only place that vibrates');
  ok('R11','phone vibration is feature-detected, wrapped, and off whenever the speaker is off');
}
// R12 no dimming anywhere, Special Player wording, reduced motion
{
  assert.equal((page.match(/brightness\(/g)||[]).length,1,'the only brightness() is the disabled Continue button (HO-027: no dimming)');
  assert.ok((page.match(/rgba\(0,0,0,/g)||[]).length<=38,'no new black overlays (38 before the hype pass)');
  assert.ok(!/vignette/i.test(page),'no vignette');
  assert.ok(!/exposure\.value\s*=/.test(page),'the exposure is never lowered');
  for(const m of page.matchAll(/strength\.value=([^;]*);/g))assert.match(m[1],/^\.3(\+|$)/,'bloom only rises from its .3 base');
  const visible=page.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ');
  assert.ok(!/marquee|\bMP\b/i.test(visible),'visible text says Special Player, never Marquee/MP');
  assert.ok(!/\b(fetch|XMLHttpRequest|firestore|sendBeacon)\b/i.test(page),'no network calls or Firebase in the page');
  assert.match(page,/function aimTilt\(x,y\)\{ if\(REDUCED\|\|phase!=="settled"\) return;/,'reduced motion: no tilt');
  assert.match(page,/const slowAt=\(t\)=>REDUCED\?1:/,'reduced motion: no slow motion');
  ok('R12','no dimming, vignette or lowered exposure; Special Player wording; no network; reduced motion keeps no tilt or slow motion');
}

console.log(`PASS r86 Special Player reveal contracts: ${checks} numbered checks (who, same players, messages, Career Start order, offline shell, confirm time, journeys, hype ladder, skip guard, encore, vibration, no dimming).`);
