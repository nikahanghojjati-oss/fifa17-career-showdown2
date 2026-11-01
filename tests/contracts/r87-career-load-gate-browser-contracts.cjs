#!/usr/bin/env node
'use strict';
// r87 H4 (Nik 2026-11-01: push the career pages toward 10): every career page (History, Career Statistics, Trophy Room)
// under a slow read, offline, a reload mid-load, two tabs and TRY AGAIN. The real app over the local static server in the
// pinned Chromium; only the provider edge is faked: the signed-in account, the career start marker and the closed-Showdown
// loader (which answers with a real verified career model after a delay, or "unavailable"). Each animation frame records
// what the player sees: Reus (the loading screen), a covered page (the screen held, no Reus), or the drawn screen and the
// status of the frame it was drawn with.
//   G-01  a slow read (6 s) keeps Reus up until the career arrives, then one reveal with the numbers (no LOADING frame,
//         no second boot, never a covered page longer than the gate's grace)
//   G-02  offline: one reveal of the unavailable state with TRY AGAIN, no LOADING frame first
//   G-03  TRY AGAIN keeps the unavailable screen covered by Reus while the read runs, then one reveal with the numbers
//   G-04  the connection coming back retries the unavailable screen the same way (Reus, one reveal)
//   G-05  a reload mid-load leaves no gate behind: Home shows, Reus is down, and the page opens the career again cleanly
//   G-06  two tabs open the career at once: each reads once and draws once
//   G-07  no open costs more than its one career read (a warm reopen: its one refresh read, as before)
//   G-08  a read past the 14 s cap leaves Reus for the loading frame (with its progress), never the app's own page
const assert=require('node:assert/strict');
const path=require('node:path');
const net=require('node:net');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const History=require(path.join(ROOT,'js/sharedHistoryConvergence.js'));
const Career=require(path.join(ROOT,'js/sharedCareerAnalytics.js'));
const {score,winner,result}=require(path.join(ROOT,'tests/support/career-fixture-helpers.cjs'));

const hash=n=>'sha256:'+String(n).padStart(64,'0');
function projectionFor(rivalryId,{leagueId,clubs,seasons}){
  return History.buildProjection({rivalryId,setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:seasons.length,leagueId,clubs:{playerOne:clubs[0],playerTwo:clubs[1]}},
    managerSlots:[{slotId:'playerOne',accountId:'acct_daniel',profileId:'profile_'+'a'.repeat(24),saveId:'save_'+'a'.repeat(24),entitlementState:'active'},{slotId:'playerTwo',accountId:'acct_nik',profileId:'profile_'+'b'.repeat(24),saveId:'save_'+'b'.repeat(24),entitlementState:'active'}],
    seasons:seasons.map(([p1,p2],i)=>{const n=i+1,h=hash(n);return {commit:{ok:true,committed:true,phase:'ACKNOWLEDGED',revision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,results:{playerOne:p1,playerTwo:p2}},scoring:{ok:true,authoritative:true,phase:'SCORING_RECONCILED',revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,scoring:{playerOne:score(p1),playerTwo:score(p2)},winner:winner(p1,p2)}};})});
}
const P=result({leaguePosition:1,leaguePoints:100,leagueGoals:100,championsLeague:true,domesticCup:true,topScorer:true,topAssist:true});
const E=result({europaLeague:true,domesticCup:true}),CL=result({championsLeague:true}),Z=result();
const idFor=n=>'pair_'+(0xf0000+n).toString(16).padStart(8,'0')+crypto.createHash('sha256').update('h4'+n).digest('hex').slice(0,56);
function entry(n,clubs,seasons,leagueId='bundesliga'){const rivalryId=idFor(n),p=projectionFor(rivalryId,{leagueId,clubs,seasons});const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
  return {rivalryId,classification:'completed',projection:p,final:{totals:{playerOne:a,playerTwo:b},winner:a>b?'playerOne':b>a?'playerTwo':'draw'},setupConfirmedAt:Date.parse('2026-10-31T10:00:00Z')};}
const MODEL=Career.buildCareerModel({indexStatus:'ready',showdowns:[entry(1,['Eintracht Frankfurt','Borussia Dortmund'],[[Z,CL],[E,CL],[P,Z]]),entry(2,['FC Bayern München','Borussia Dortmund'],[[CL,P]]),entry(3,['Real Madrid','FC Barcelona'],[[E,Z],[Z,E],[CL,CL]],'laliga')]});
const UNAVAILABLE_MODEL=Career.buildCareerModel({indexStatus:'unavailable',showdowns:[]});

// The provider edge, installed before any career file loads (loadRuntimeScript skips a file whose global is already there).
// window.__h4.next is how the next career read answers: {ms, model} or {ms, unavailable:true}.
const FAKES=({model,unavailable,uid})=>{
  const h4=window.__h4={reads:0,next:{ms:0,model},model,unavailable,timeline:[],boots:{}};
  const identity={registered:true,managerId:'nik',accountId:uid,status:'ready'};
  window.CareerModeOnlinePlayerIdentity={...(window.CareerModeOnlinePlayerIdentity||{}),getState:()=>identity};
  window.CareerModeSparkConnectedAccount={...(window.CareerModeSparkConnectedAccount||{}),getState:()=>({connected:true,accountId:uid})};
  const sdk={doc:(_db,...parts)=>({path:parts.join('/')}),getDoc:async()=>({exists:()=>false,data:()=>undefined}),setDoc:async()=>{}};
  window.CareerModeProductionFirebaseRuntime={...(window.CareerModeProductionFirebaseRuntime||{}),ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid}},firestore:{},firestoreSdk:sdk})};
  window.CareerModeCareerStartMarker={readMarker:async()=>({status:'ready',hiddenRivalryIds:[]}),hiddenRivalryIds:()=>[],careerHiddenRivalryIds:async()=>[],epoch:()=>0};
  window.CareerModeSparkClosedShowdownCareerLoader={loadClosedShowdownCareer:async options=>{
    h4.reads+=1;const next=h4.next;
    // Like the real loader, a long read reports progress (one Showdown about every 2 s), which keeps History's inactivity
    // deadline alive.
    const total=Math.max(1,Math.ceil((next.ms||0)/2000));let done=0;
    const beat=setInterval(()=>{done=Math.min(total,done+1);try{options?.onProgress?.({done,total});}catch(_){}},2000);
    try{await new Promise(resolve=>setTimeout(resolve,next.ms||0));}finally{clearInterval(beat);}
    return {status:next.unavailable?'unavailable':'ready',model:next.unavailable?h4.unavailable:next.model};
  },clearClosedShowdownCache(){}};
  // One sample per frame: what the player sees.
  const HOSTS={legacy:'legacy',careerStatistics:'careerStatistics',trophyRoom:'trophyRoom'};
  const BOOTS={legacy:['ShowdownLegacyBoot',()=>window.LEGACY_BOOT?.fixtures?.frames?.LIVE?.status],careerStatistics:['ShowdownCareerStatisticsBoot',()=>window.CAREER_STATISTICS_FIXTURES?.frames?.LIVE?.status],trophyRoom:['ShowdownTrophyRoomBoot',()=>window.TROPHY_ROOM_FIXTURES?.frames?.LIVE?.status]};
  const drawn={};
  // Each Team V boot is wrapped the moment its file defines it, so every draw is counted with the status it drew.
  for(const [screen,[name,status]] of Object.entries(BOOTS)){
    const wrap=fn=>{if(typeof fn!=='function'||fn.h4)return fn;const wrapped=function(){const s=status();drawn[screen]=s;(h4.boots[screen]=h4.boots[screen]||[]).push(s);return fn.apply(this,arguments);};wrapped.h4=true;return wrapped;};
    let current=wrap(window[name]);
    Object.defineProperty(window,name,{configurable:true,get:()=>current,set:value=>{current=wrap(value);}});
  }
  const sample=()=>{
    const el=document.getElementById('loadingScreen');
    const reus=Boolean(el&&!el.hidden&&!el.classList.contains('hidden')&&Number(getComputedStyle(el).opacity)>0.5);
    const screen=typeof window.getActiveScreenName==='function'?window.getActiveScreenName():null;
    let seen;
    if(reus)seen='reus';
    else if(HOSTS[screen]){
      const host=document.getElementById(HOSTS[screen]);
      seen=host?.hasAttribute('data-v10-pending')?'covered':'shown:'+(drawn[screen]??'app');
    }else seen='screen:'+screen;
    h4.timeline.push([Math.round(performance.now()),screen,seen]);
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
};

// What the player saw from `from` on: runs of the same view, with how long each lasted.
function runs(timeline,from=0){
  const out=[];
  for(const [t,screen,seen] of timeline){if(t<from)continue;const last=out.at(-1);if(last&&last.seen===seen&&last.screen===screen){last.end=t;}else out.push({screen,seen,start:t,end:t});}
  return out.map(r=>({...r,ms:r.end-r.start}));
}
const brief=list=>list.map(r=>`${r.seen}(${r.ms})`).join(' > ');
// The Reus Gate: from the open on, the screen is either under Reus, briefly covered (the gate's grace) or shown once, with
// its final frame.
function assertOneReveal(where,timeline,from,final,{grace=450,was=null}={}){
  // `was`: the frame on show when the press landed (the frames before the press reaches the page are not counted).
  let list=runs(timeline,from).filter(r=>r.seen!=='screen:mainMenu');
  if(was&&list[0]?.seen==='shown:'+was)list=list.slice(1);
  const shown=list.filter(r=>r.seen.startsWith('shown:'));
  assert.ok(shown.length>=1,`${where}: the screen was shown (${brief(list)})`);
  const first=list.findIndex(r=>r.seen.startsWith('shown:'));
  assert.deepEqual([...new Set(list.slice(first).map(r=>r.seen))],['shown:'+final],`${where}: once revealed, the screen shows only its ${final} frame (${brief(list)})`);
  for(const r of list.slice(0,first))if(r.seen==='covered')assert.ok(r.ms<=grace,`${where}: never a covered page longer than the gate's grace (${brief(list)})`);
}

function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const socket=net.connect(port,'127.0.0.1',()=>{socket.end();resolve(true);});socket.on('error',()=>resolve(false));});if(ok)return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error('static server did not start');}
async function home(page,base){
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:60000});
  await page.waitForFunction(()=>window.CareerModeV10Screens&&window.getActiveScreenName()==='mainMenu',null,{timeout:60000});
  await page.evaluate(FAKES,{model:MODEL,unavailable:UNAVAILABLE_MODEL,uid:'acct_nik'});
  await page.evaluate(async()=>{await window.ensureGameplayModules();});
}
async function newPage(browser,base,size=[1280,800],context=null){
  const own=!context;
  context=context||await browser.newContext({viewport:{width:size[0],height:size[1]},deviceScaleFactor:1,hasTouch:size[0]<900});
  if(own)await context.route(url=>!url.href.startsWith(base),route=>route.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await home(page,base);
  return {context,page,errors,own};
}
const OPEN={legacy:"window.openOptionalModule('legacy')",careerStatistics:"window.openOptionalModule('careerStatistics')",trophyRoom:"window.openOptionalModule('trophyRoom')"};
const FINAL_STATUS={legacy:'ready',careerStatistics:'ready',trophyRoom:'ready'};
async function open(page,screen,next){
  return page.evaluate(async([code,next])=>{window.__h4.next=next;const t=Math.round(performance.now());void eval(code);return t;},[OPEN[screen],next]);
}
async function settled(page,screen,status,timeout=30000){
  await page.waitForFunction(([screen,status])=>{
    const host=document.getElementById(screen),el=document.getElementById('loadingScreen');
    const boots=window.__h4.boots[screen]||[];
    return host&&!host.hasAttribute('data-v10-pending')&&boots.at(-1)===status&&el&&(el.hidden||el.classList.contains('hidden'));
  },[screen,status],{timeout});
  await page.waitForTimeout(700);
}
const timeline=page=>page.evaluate(()=>window.__h4.timeline.slice());
const reads=page=>page.evaluate(()=>window.__h4.reads);
const boots=(page,screen)=>page.evaluate(screen=>(window.__h4.boots[screen]||[]).slice(),screen);
const resetBoots=page=>page.evaluate(()=>{window.__h4.boots={};});

let finished=false;
process.on('exit',code=>{if(!finished&&!code){console.error('r87 career load gate browser contracts ended before their last check.');process.exitCode=1;}});
(async()=>{
  const {chromium}=require('playwright');
  const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');
  const port=await freePort();
  const server=spawn(process.execPath,[path.join(ROOT,'tests/support/static-server.cjs')],{cwd:ROOT,stdio:'ignore',env:{...process.env,CMS_TEST_PORT:String(port)}});
  let browser=null;const failures=[],groups=[];
  const check=async(name,run)=>{try{await run();groups.push(name);console.log('ok',name);}catch(error){failures.push(error);console.error('FAIL',name,'\n ',error.message);}};
  // Three runs, each inside the runner's 120 s per file: this file is "slow" (G-01, G-08); r87-career-load-gate-retry-contracts.cjs
  // and r87-career-load-gate-edges-contracts.cjs require it with PART "retry" (G-02, G-03, G-07) and "edges" (G-04, G-05, G-06).
  const PART=['retry','edges'].includes(global.R87_CAREER_LOAD_GATE_PART)?global.R87_CAREER_LOAD_GATE_PART:'slow';
  const PARTS={slow:['G-01','G-08'],retry:['G-02','G-03','G-07'],edges:['G-04','G-05','G-06']};
  const only=process.env.H4_ONLY?process.env.H4_ONLY.split(','):null;
  const want=id=>PARTS[PART].includes(id)&&(!only||only.includes(id));
  try{
    await waitForServer(port);
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args.filter(arg=>arg!=='--single-process')});
    const base=`http://127.0.0.1:${port}/`;
    for(const screen of ['legacy','careerStatistics','trophyRoom']){
      if(want('G-01'))await check(`G-01 ${screen}: a 6 s read stays under Reus, then one reveal with the numbers`,async()=>{
        const {context,page,errors}=await newPage(browser,base);
        try{
          const t=await open(page,screen,{ms:6000,model:MODEL});
          await settled(page,screen,FINAL_STATUS[screen],40000);
          assertOneReveal(`${screen} slow`,await timeline(page),t,FINAL_STATUS[screen]);
          assert.deepEqual(await boots(page,screen),[FINAL_STATUS[screen]],`${screen}: drawn once`);
          assert.equal(await reads(page),1,`${screen}: one career read`);
          assert.deepEqual(errors,[]);
        }finally{await context.close();}
      });
      if(want('G-02')||want('G-03')||want('G-07'))await check(`G-02/G-03/G-07 ${screen}: offline shows unavailable once; TRY AGAIN stays under Reus, then one reveal; a warm reopen costs at most one refresh read`,async()=>{
        const {context,page,errors}=await newPage(browser,base,[390,844]);
        try{
          let t=await open(page,screen,{ms:300,unavailable:true});
          await settled(page,screen,'unavailable');
          assertOneReveal(`${screen} offline`,await timeline(page),t,'unavailable');
          assert.equal(await reads(page),1,`${screen}: one read while offline`);
          // G-03 TRY AGAIN, a 2.5 s read
          await resetBoots(page);
          const retry={legacy:'#legacyStateBanner button',careerStatistics:'#careerRetryButton',trophyRoom:'#trophyRetryButton'}[screen];
          t=await page.evaluate(next=>{window.__h4.next=next;return Math.round(performance.now());},{ms:2500,model:MODEL});
          await page.locator(retry).click();
          await settled(page,screen,FINAL_STATUS[screen]);
          assertOneReveal(`${screen} TRY AGAIN`,await timeline(page),t,FINAL_STATUS[screen],{was:'unavailable'});
          assert.deepEqual(await boots(page,screen),[FINAL_STATUS[screen]],`${screen}: TRY AGAIN draws once`);
          assert.equal(await reads(page),2,`${screen}: TRY AGAIN reads once`);
          // G-07 warm reopen: Home, then the screen again: no read, at once
          await page.evaluate(()=>window.showScreen('mainMenu'));await page.waitForTimeout(400);
          await resetBoots(page);
          t=await open(page,screen,{ms:4000,model:MODEL});
          await settled(page,screen,FINAL_STATUS[screen]);
          assertOneReveal(`${screen} warm`,await timeline(page),t,FINAL_STATUS[screen]);
          // History reloads a warm career in the background (same career: no second boot); the stats pages read it again too.
          assert.equal(await reads(page),3,`${screen}: a warm reopen costs its one refresh read, as before`);
          assert.deepEqual(errors,[]);
        }finally{await context.close();}
      });
      if(want('G-04'))await check(`G-04 ${screen}: the connection coming back retries under Reus, then one reveal`,async()=>{
        const {context,page,errors}=await newPage(browser,base,[390,844]);
        try{
          await open(page,screen,{ms:200,unavailable:true});
          await settled(page,screen,'unavailable');
          await resetBoots(page);
          const t=await page.evaluate(next=>{window.__h4.next=next;window.dispatchEvent(new Event('online'));return Math.round(performance.now());},{ms:2500,model:MODEL});
          await settled(page,screen,FINAL_STATUS[screen]);
          assertOneReveal(`${screen} online`,await timeline(page),t,FINAL_STATUS[screen],{was:'unavailable'});
          assert.deepEqual(await boots(page,screen),[FINAL_STATUS[screen]],`${screen}: drawn once when the connection comes back`);
          assert.equal(await reads(page),2);
          assert.deepEqual(errors,[]);
        }finally{await context.close();}
      });
    }
    for(const screen of ['legacy','careerStatistics'])if(want('G-08'))await check(`G-08 ${screen}: a read past the cap (20 s) leaves Reus at about 14 s for the loading frame, never the app's own page`,async()=>{
      const {context,page,errors}=await newPage(browser,base);
      try{
        const t=await open(page,screen,{ms:20000,model:MODEL});
        await settled(page,screen,'ready',60000);
        const list=runs(await timeline(page),t).filter(r=>r.seen!=='screen:mainMenu');
        const seen=[...new Set(list.map(r=>r.seen))];
        assert.ok(!seen.includes('shown:app'),`${screen}: the app's own page never shows (${brief(list)})`);
        assert.deepEqual(seen.filter(x=>x.startsWith('shown:')),['shown:loading','shown:ready'],`${screen}: the loading frame, then the career (${brief(list)})`);
        const reus=list.filter(r=>r.seen==='reus').reduce((a,r)=>a+r.ms,0);
        assert.ok(reus>=12000&&reus<=15500,`${screen}: Reus held about 14 s (${reus} ms)`);
        assert.equal(await reads(page),1);
        assert.deepEqual(errors,[]);
      }finally{await context.close();}
    });
    if(want('G-05'))await check('G-05 a reload mid-load leaves no gate behind, and the career opens cleanly again',async()=>{
      const {context,page,errors}=await newPage(browser,base);
      try{
        await open(page,'legacy',{ms:8000,model:MODEL});
        await page.waitForTimeout(1500);
        await page.reload({waitUntil:'domcontentloaded'});
        await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:60000});
        await page.waitForFunction(()=>window.CareerModeV10Screens&&typeof window.getActiveScreenName==='function',null,{timeout:60000});
        await page.waitForTimeout(1200);
        const after=await page.evaluate(()=>({screen:window.getActiveScreenName(),pending:[...document.querySelectorAll('[data-v10-pending]')].map(e=>e.id),gate:document.getElementById('loadingScreen')?.dataset.v10Gate??null}));
        assert.deepEqual(after.pending,[],'no screen left held after the reload');
        assert.equal(after.gate,null,'no gate left raised after the reload');
        await page.evaluate(FAKES,{model:MODEL,unavailable:UNAVAILABLE_MODEL,uid:'acct_nik'});
        await page.evaluate(async()=>{if(window.getActiveScreenName()!=='mainMenu')window.showScreen('mainMenu');await window.ensureGameplayModules();});
        const t=await open(page,'legacy',{ms:1500,model:MODEL});
        await settled(page,'legacy','ready');
        assertOneReveal('legacy after reload',await timeline(page),t,'ready');
        assert.equal(await reads(page),1);
        assert.deepEqual(errors,[]);
      }finally{await context.close();}
    });
    if(want('G-06'))await check('G-06 two tabs open the career at once: each reads once and draws once',async()=>{
      const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
      await context.route(url=>!url.href.startsWith(base),route=>route.abort());
      try{
        const a=await newPage(browser,base,[1280,800],context),b=await newPage(browser,base,[1280,800],context);
        const [ta,tb]=await Promise.all([open(a.page,'careerStatistics',{ms:2500,model:MODEL}),open(b.page,'careerStatistics',{ms:2500,model:MODEL})]);
        await Promise.all([settled(a.page,'careerStatistics','ready'),settled(b.page,'careerStatistics','ready')]);
        assertOneReveal('tab A',await timeline(a.page),ta,'ready');assertOneReveal('tab B',await timeline(b.page),tb,'ready');
        assert.deepEqual([await reads(a.page),await reads(b.page)],[1,1]);
        assert.deepEqual([...a.errors,...b.errors],[]);
      }finally{await context.close();}
    });
  }finally{
    if(browser)await browser.close();
    server.kill();
  }
  if(failures.length){process.exitCode=1;console.error(`${failures.length} failing`);}
  else{finished=true;console.log(`PASS r87 career load gate browser contracts (${PART}): ${groups.length} groups\n- ${groups.join('\n- ')}`);}
  finished=true;
})().catch(error=>{console.error(error);process.exitCode=1;});
