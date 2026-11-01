#!/usr/bin/env node
'use strict';
// r87 round 3 (career pages toward 10/10): finish and readability on the desktop career pages; nothing moves.
//   R3-1  data words (labels, table heads, tabs, counts) are at least 11px and no word is cut by its box
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

// The data words a reader needs on the desktop career pages (labels, table heads, tabs, counts) are at least 11px.
// The wide-tracked eyebrow and tagline lines are Team V's decorative type and are not data.
const DATA={
  stats:['.compareLabel','.leaderLabel','.careerTable th','.headlineTogether','.headlineLabel'],
  trophy:['.trophyTab','.managerCounts span','.recordItem small','.recordItem span','.recordRibbonHeading','.careerRank small'],
  legacy:['.legacyCardFooter'],
};
const SMALL=([sels,min])=>{const out=[];for(const sel of sels)for(const el of document.querySelectorAll(sel)){const r=el.getBoundingClientRect();if(!r.width||!el.textContent.trim())continue;let p=el,hid=false;while(p){if(getComputedStyle(p).display==='none'){hid=true;break;}p=p.parentElement;}if(hid)continue;
  const fs=parseFloat(getComputedStyle(el).fontSize);if(fs<min-0.05)out.push(`${sel} "${el.textContent.trim().slice(0,22)}" ${fs.toFixed(1)}px`);}return [...new Set(out)];};
const CLIP=()=>{const out=[];const root=document.querySelector('#app .screen:not(.hidden)')||document.getElementById('app');
  for(const el of root.querySelectorAll('*')){if(el.children.length||!el.textContent.trim()||el.closest('.sd-visually-hidden,.visually-hidden,.sr-only'))continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||cs.textOverflow==='ellipsis')continue;
    const rg=document.createRange();rg.selectNodeContents(el);const r=rg.getBoundingClientRect();if(r.width<2||r.height<2)continue;
    // the nearest box that clips (overflow hidden or clip) must hold every line of the words; a panel that scrolls lets them be reached
    for(let p=el;p&&p!==root;p=p.parentElement){const ps=getComputedStyle(p);if(ps.display==='none'){break;}if(/auto|scroll/.test(ps.overflowX+ps.overflowY))break;if(/hidden|clip/.test(ps.overflowX+ps.overflowY)){const q=p.getBoundingClientRect();
      if(r.left<q.left-1||r.right>q.right+1||r.top<q.top-1||r.bottom>q.bottom+1)out.push(`"${el.textContent.trim().slice(0,24)}" cut (${Math.round(r.bottom)}>${Math.round(q.bottom)}) by ${p.tagName.toLowerCase()}${p.id?'#'+p.id:''}.${String(p.className).trim().split(/\s+/)[0]}`);break;}}}
  return [...new Set(out)];};

let finished=false;
process.on('exit',code=>{if(!finished&&!code){console.error('r87 career visuals r3 browser contracts ended before their last check.');process.exitCode=1;}});
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
    const OPEN={
      stats:async page=>{await page.evaluate(async model=>{await window.openOptionalModule('statistics');window.openCareerStatistics({model});},BIG);await page.waitForFunction(()=>document.querySelector('#careerStatistics.careerScreenV10 .compareLabel')&&!document.getElementById('careerStatistics').hasAttribute('data-v10-pending'),null,{timeout:30000});},
      trophy:async page=>{await page.evaluate(async model=>{await window.openOptionalModule('trophyRoom');window.openTrophyRoom({model});},BIG);await page.waitForFunction(()=>document.querySelector('#trophyRoom.careerScreenV10 .trophyTab')&&!document.getElementById('trophyRoom').hasAttribute('data-v10-pending'),null,{timeout:30000});},
      legacy:async page=>{await page.evaluate(async model=>{await window.openOptionalModule('legacy');window.renderLegacy({model});},CLUBS);await page.waitForFunction(()=>document.querySelector('#legacyCardGrid .legacyCard')&&!document.getElementById('legacy').hasAttribute('data-v10-pending'),null,{timeout:30000});},
    };
    for(const size of [[1280,720],[1366,768],[1440,900],[1920,1080]]){
      const {context,page,errors}=await boot(browser,base,size);
      try{
        for(const key of Object.keys(OPEN)){
          await OPEN[key](page);await page.evaluate(()=>document.fonts&&document.fonts.ready);await page.waitForTimeout(500);
          const where=`${key} ${size.join('x')}`;
          assert.deepEqual(await page.evaluate(SMALL,[DATA[key],11]),[],`${where}: data words are at least 11px`);
          assert.deepEqual(await page.evaluate(CLIP),[],`${where}: no word is cut by its box`);
        }
        assert.deepEqual(errors,[]);
      }finally{await context.close();}
    }
    groups.push('R3-1 Career Statistics, Trophy Room and Legacy data words are at least 11px and uncut on desktop (1280x720, 1366x768, 1440x900, 1920x1080)');

    // Phones: the Trophy Room tabs and counts are at least 10px (a narrow screen, so one step under desktop).
    const PHONE={trophy:['.trophyTab','.managerCounts span','.trophyCard h3','.heroPlinth span']};
    for(const size of [[390,844],[360,640]]){
      const {context,page,errors}=await boot(browser,base,size);
      try{
        await OPEN.trophy(page);await page.evaluate(()=>document.fonts&&document.fonts.ready);await page.waitForTimeout(500);
        assert.deepEqual(await page.evaluate(SMALL,[PHONE.trophy,10]),[],`trophy ${size.join('x')}: tabs and counts are at least 10px`);
        assert.deepEqual(await page.evaluate(CLIP),[],`trophy ${size.join('x')}: no word is cut by its box`);
        assert.deepEqual(errors,[]);
      }finally{await context.close();}
    }
    groups.push('R3-2 Trophy Room tabs, card titles and counts are at least 10px and uncut on phones (390x844, 360x640)');
    for(const name of groups)console.log(`ok - ${name}`);
    console.log(`r87 career visuals r3 browser contracts: ${groups.length} groups passed`);
    finished=true;
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
