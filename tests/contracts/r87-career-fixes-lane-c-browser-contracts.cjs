#!/usr/bin/env node
'use strict';
// r87 career fixes, red team lane C layout (2026-10-31). The real app over the local static server in the pinned Chromium;
// the screens are drawn from a verified career model (real History verifier + real career model), so no Firebase.
//   C-03  Career Statistics totals with 4 digits each (8 in a pair) stay whole inside their tile, desktop and phone
//   C-06  the Career Table never cuts the career leader's row (a table that still runs long scrolls inside its panel) and
//         a Special Player name breaks only between words
//   C-07  a long club name on a desktop History card never runs under the result label
//   LK-1  opening career pages again and again keeps one live stage (no ResizeObserver / orientationchange leak)
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
// The first two ids draw the long Special Player names ("A. Oxlade-Chamberlain", "V. Nilsson Lindelöf").
const LONG_IDS=['pair_fbe558eda8523034918228af6f26d085e8a01aca773118b3ccba3de52d71e3c8','pair_445629d75038df88a98fa21d5f8ddfe1aa85d009bebd29ad5878b384a2f78658'];
const idFor=n=>n<=LONG_IDS.length?LONG_IDS[n-1]:'pair_'+(0xe0000+n).toString(16).padStart(8,'0')+crypto.createHash('sha256').update('c'+n).digest('hex').slice(0,56);
function entry(n,clubs,seasons,leagueId='bundesliga'){const rivalryId=idFor(n),p=projectionFor(rivalryId,{leagueId,clubs,seasons});const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
  return {rivalryId,classification:'completed',projection:p,final:{totals:{playerOne:a,playerTwo:b},winner:a>b?'playerOne':b>a?'playerTwo':'draw'},setupConfirmedAt:Date.parse('2026-10-31T10:00:00Z')};}
// The red team's career (about 100 Showdowns): both managers past 1,000 career points, Nik ahead, two Golden Showdowns
// so the Golden line sits in the table too.
const BIG=Career.buildCareerModel({indexStatus:'ready',showdowns:Array.from({length:62},(_,i)=>i<2?entry(i+1,['Borussia Mönchengladbach','Eintracht Frankfurt'],Array.from({length:10},()=>[P,P])):entry(i+1,['Deportivo La Coruña','Atlético Madrid'],[[E,P],[CL,P],[P,CL]],'laliga'))});
const CLUBS=Career.buildCareerModel({indexStatus:'ready',showdowns:[entry(1,['Eintracht Frankfurt','Borussia Mönchengladbach'],[[Z,CL],[E,CL],[Z,P]]),entry(2,['Borussia Mönchengladbach','Eintracht Frankfurt'],[[Z,CL],[Z,P],[E,CL]]),entry(3,['Deportivo La Coruña','Atlético Madrid'],[[CL,Z]],'laliga'),entry(4,['West Bromwich Albion','Tottenham Hotspur'],[[Z,CL]],'premier_league')]});

function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const socket=net.connect(port,'127.0.0.1',()=>{socket.end();resolve(true);});socket.on('error',()=>resolve(false));});if(ok)return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error('static server did not start');}
async function boot(browser,base,[w,h]){
  const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,reducedMotion:'reduce',hasTouch:w<900});
  await context.route(url=>!url.href.startsWith(base),route=>route.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:60000});
  await page.waitForFunction(()=>window.CareerModeV10Screens&&window.getActiveScreenName()==='mainMenu',null,{timeout:60000});
  await page.evaluate(async()=>{await window.ensureGameplayModules();await loadRuntimeScript('career-screen-seam','js/careerScreenSeam.js',()=>Boolean(window.CareerModeCareerScreenSeam));});
  return {context,page,errors};
}
const STATS=()=>{
  const out={tiles:[],rows:[],breaks:[]};
  for(const p of document.querySelectorAll('#careerStatistics .headlinePair'))if(p.scrollWidth>p.clientWidth+1)out.tiles.push(p.textContent.replace(/\s+/g,' ').trim());
  const panel=document.getElementById('careerTablePanel');
  panel.scrollTop=panel.scrollHeight;const pr=panel.getBoundingClientRect();
  for(const tr of panel.querySelectorAll('tbody tr')){const r=tr.getBoundingClientRect();if(r.bottom>pr.bottom+1||r.top<pr.top-1)out.rows.push(tr.textContent.replace(/\s+/g,' ').trim().slice(0,40));}
  // a line change between two letters of one word is a mid-word break
  for(const n of panel.querySelectorAll('.spChipName')){const t=n.firstChild;if(!t||t.nodeType!==3)continue;const s=t.textContent;let prev=null;
    for(let i=0;i<s.length;i++){const rg=document.createRange();rg.setStart(t,i);rg.setEnd(t,i+1);const r=rg.getClientRects()[0];if(!r)continue;
      if(prev&&r.top>prev.top+2&&/[\p{L}]/u.test(s[i])&&/[\p{L}]/u.test(s[i-1]))out.breaks.push(s.slice(0,i)+'|'+s.slice(i));prev=r;}}
  panel.scrollTop=0;return out;
};

let finished=false;
process.on('exit',code=>{if(!finished&&!code){console.error('r87 career fixes lane C browser contracts ended before their last check.');process.exitCode=1;}});
(async()=>{
  const {chromium}=require('playwright');
  const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');
  const port=await freePort();
  const server=spawn(process.execPath,[path.join(ROOT,'tests/support/static-server.cjs')],{cwd:ROOT,stdio:'ignore',env:{...process.env,CMS_TEST_PORT:String(port)}});
  let browser=null;
  try{
    await waitForServer(port);
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args.filter(arg=>arg!=='--single-process')});
    const base=`http://127.0.0.1:${port}/`;const groups=[];
    const D=BIG.managers.daniel.careerPoints,N=BIG.managers.nik.careerPoints;
    assert.ok(D>=1000&&N>=1000&&D!==N,`a four-digit career on both sides (${D} / ${N})`);
    for(const size of [[1280,720],[1366,768],[1440,900],[390,844],[360,780]]){
      const {context,page,errors}=await boot(browser,base,size);
      try{
        await page.evaluate(async model=>{await window.openOptionalModule('statistics');window.openCareerStatistics({model});},BIG);
        await page.waitForFunction(()=>document.querySelector('#careerStatistics.careerScreenV10 .headlinePair')&&!document.getElementById('careerStatistics').hasAttribute('data-v10-pending'),null,{timeout:30000});
        await page.evaluate(()=>document.fonts&&document.fonts.ready);await page.waitForTimeout(600);
        const where=size.join('x');
        const points=await page.evaluate(()=>[...document.querySelectorAll('#careerStatistics .headlinePair')].map(p=>p.textContent.replace(/\s+/g,'')));
        assert.ok(points.includes(`D${D}/N${N}`),`${where}: CAREER POINTS shows both totals (${points.join(' | ')})`);
        const s=await page.evaluate(STATS);
        assert.deepEqual(s.tiles,[],`${where}: no total is cut by its tile`);
        assert.deepEqual(s.rows,[],`${where}: both Career Table rows can be seen inside the panel`);
        assert.deepEqual(s.breaks,[],`${where}: Special Player names break only between words`);
        assert.deepEqual(errors,[]);
      }finally{await context.close();}
    }
    groups.push('C-03 four-digit totals stay whole and C-06 the Career Table keeps both rows and whole words (1280x720, 1366x768, 1440x900, 390x844, 360x780)');
    for(const size of [[1024,768],[1280,720],[1440,900]]){
      const {context,page,errors}=await boot(browser,base,size);
      try{
        await page.evaluate(async model=>{await window.openOptionalModule('legacy');window.renderLegacy({model});},CLUBS);
        await page.waitForFunction(()=>document.querySelector('#legacyCardGrid .legacyCard')&&!document.getElementById('legacy').hasAttribute('data-v10-pending'),null,{timeout:30000});
        await page.evaluate(()=>document.fonts&&document.fonts.ready);await page.waitForTimeout(600);
        const under=await page.evaluate(()=>{const out=[];for(const c of document.querySelectorAll('#legacyCardGrid .legacyCard')){const res=c.querySelector('.legacyWinner');if(!res)continue;const rr=res.getBoundingClientRect();
          for(const n of c.querySelectorAll('.legacyClubName')){const rg=document.createRange();rg.selectNodeContents(n);for(const x of rg.getClientRects())if(Math.min(x.right,rr.right)-Math.max(x.left,rr.left)>1&&Math.min(x.bottom,rr.bottom)-Math.max(x.top,rr.top)>1)out.push(`#${c.dataset.showdown} ${n.textContent}`);}}return out;});
        assert.deepEqual(under,[],`${size.join('x')}: no club name runs under "♛ … WINS"`);
        assert.deepEqual(errors,[]);
      }finally{await context.close();}
    }
    groups.push('C-07 "Borussia Mönchengladbach" stays clear of "♛ NIK WINS" on desktop History cards (1024, 1280, 1440)');
    {
      const {context,page,errors}=await boot(browser,base,[1366,768]);
      try{
        await page.evaluate(()=>{
          const live=window.__liveStages={observers:0,orientation:0};const RO=window.ResizeObserver;
          window.ResizeObserver=class extends RO{constructor(cb){super(cb);this.__on=false;}observe(...a){if(!this.__on){this.__on=true;live.observers++;}return super.observe(...a);}disconnect(){if(this.__on){this.__on=false;live.observers--;}return super.disconnect();}};
          const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window),seen=new Set();
          window.addEventListener=(type,fn,o)=>{if(type==='orientationchange'&&!seen.has(fn)){seen.add(fn);live.orientation++;}return add(type,fn,o);};
          window.removeEventListener=(type,fn,o)=>{if(type==='orientationchange'&&seen.delete(fn))live.orientation--;return remove(type,fn,o);};
        });
        const open=async(kind)=>{
          await page.evaluate(async({kind,model})=>{if(kind==='stats'){await window.openOptionalModule('statistics');window.openCareerStatistics({model});}else{await window.openOptionalModule('trophyRoom');window.openTrophyRoom({model});}},{kind,model:CLUBS});
          const id=kind==='stats'?'careerStatistics':'trophyRoom';
          await page.waitForFunction(id=>{const h=document.getElementById(id);return h&&h.classList.contains('careerScreenV10')&&!h.hasAttribute('data-v10-pending')&&h.querySelector('.sd-stage[data-sd-ready="1"], [data-sd-ready="1"]');},id,{timeout:30000});
          await page.waitForTimeout(300);
          return page.evaluate(()=>({...window.__liveStages}));
        };
        const first=await open('stats');
        await open('trophy');await open('stats');await open('trophy');const last=await open('stats');
        assert.ok(first.orientation>=1,'the stage listens for orientation changes');
        assert.deepEqual(last,first,`four more opens leave the same live stage count (${JSON.stringify(first)} -> ${JSON.stringify(last)})`);
        assert.deepEqual(errors,[]);
      }finally{await context.close();}
    }
    groups.push('LK-1 Career Statistics and Trophy Room opened five times keep one live stage (no ResizeObserver or orientationchange leak)');
    for(const name of groups)console.log(`ok - ${name}`);
    console.log(`r87 career fixes lane C browser contracts: ${groups.length} groups passed`);
    finished=true;
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
