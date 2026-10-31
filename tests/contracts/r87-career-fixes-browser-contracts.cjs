#!/usr/bin/env node
'use strict';
// r87 career fixes, the layout half (red team lane A and Nik's long-career ask, 2026-10-31). The real app over the local static
// server in the pinned Chromium; History is drawn from a verified career model (real History verifier + real career model),
// so no Firebase and no network.
//   A-01  a 3-digit total never overlaps a crest or a name on desktop, 1024 to 1920 wide
//   A-07  Special Player names on History cards are never cut short on desktop
//   A-06  on phones VIEW SEASON HISTORY never covers the pager (360x740, 390x844, 393x660)
//   Long careers: History opens on the newest Showdown; more than ten positions use "‹ n / N ›", « » jumps, a scrubber,
//   ← → / Home / End on desktop and a sideways swipe on a phone.
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
function projectionFor(rivalryId,{leagueId='premier_league',clubs=['Arsenal','Liverpool'],totalSeasons,seasons}){
  return History.buildProjection({rivalryId,setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons,leagueId,clubs:{playerOne:clubs[0],playerTwo:clubs[1]}},
    managerSlots:[{slotId:'playerOne',accountId:'acct_daniel',profileId:'profile_'+'a'.repeat(24),saveId:'save_'+'a'.repeat(24),entitlementState:'active'},{slotId:'playerTwo',accountId:'acct_nik',profileId:'profile_'+'b'.repeat(24),saveId:'save_'+'b'.repeat(24),entitlementState:'active'}],
    seasons:seasons.map(([p1,p2],i)=>{const n=i+1,h=hash(n);return {commit:{ok:true,committed:true,phase:'ACKNOWLEDGED',revision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,results:{playerOne:p1,playerTwo:p2}},scoring:{ok:true,authoritative:true,phase:'SCORING_RECONCILED',revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,scoring:{playerOne:score(p1),playerTwo:score(p2)},winner:winner(p1,p2)}};})});
}
const finalFor=p=>{const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;return {totals:{playerOne:a,playerTwo:b},winner:a>b?'playerOne':b>a?'playerTwo':'draw'};};
const P=result({leaguePosition:1,leaguePoints:100,leagueGoals:100,championsLeague:true,domesticCup:true,topScorer:true,topAssist:true});
const E=result({europaLeague:true,domesticCup:true}),CL=result({championsLeague:true}),Z=result();
// Rivalry ids whose Special Players have long names (the red team's cards: "A. Oxlade-Chamberlain", "V. Nilsson Lindelöf").
const LONG_IDS=['pair_fbe558eda8523034918228af6f26d085e8a01aca773118b3ccba3de52d71e3c8','pair_445629d75038df88a98fa21d5f8ddfe1aa85d009bebd29ad5878b384a2f78658','pair_20423019c92871b5d06d993d4bf865c884b163051f1905cfb1fb5100d5592a8a'];
const idFor=n=>n<=LONG_IDS.length?LONG_IDS[n-1]:'pair_'+(0xd0000+n).toString(16).padStart(8,'0')+crypto.createHash('sha256').update('g'+n).digest('hex').slice(0,56);
const CONFIRMED=Date.parse('2026-10-31T10:00:00Z');
function entry(n,kind){
  const rivalryId=idFor(n);let spec;
  if(kind==='golden')spec={leagueId:'bundesliga',clubs:['Borussia Mönchengladbach','Eintracht Frankfurt'],totalSeasons:10,seasons:Array.from({length:10},()=>[P,P])};
  else if(kind==='draw10')spec={leagueId:'laliga',clubs:['Deportivo La Coruña','Atlético Madrid'],totalSeasons:10,seasons:[[P,P],[E,CL],[CL,E],[Z,Z],[E,E],[CL,Z],[Z,CL],[Z,Z],[P,P],[E,E]]};
  else if(kind==='el3')spec={leagueId:'ligue_1',clubs:['Paris Saint-Germain','Saint-Étienne'],totalSeasons:3,seasons:[[E,CL],[CL,E],[E,Z]]};
  else spec={leagueId:'premier_league',clubs:['West Bromwich Albion','Manchester United'],totalSeasons:1,seasons:[[CL,Z]]};
  const p=projectionFor(rivalryId,spec);
  return {rivalryId,classification:'completed',projection:p,final:finalFor(p),setupConfirmedAt:CONFIRMED};
}
const career=kinds=>Career.buildCareerModel({indexStatus:'ready',showdowns:kinds.map((k,i)=>entry(i+1,k))});
const many=n=>career(Array.from({length:n},(_,i)=>i%3===0?'el3':'win1'));

function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const socket=net.connect(port,'127.0.0.1',()=>{socket.end();resolve(true);});socket.on('error',()=>resolve(false));});if(ok)return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error('static server did not start');}

async function openHistory(browser,base,[w,h],model){
  const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,reducedMotion:'reduce',hasTouch:w<900});
  await context.route(url=>!url.href.startsWith(base),route=>route.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:60000});
  await page.waitForFunction(()=>window.CareerModeV10Screens&&window.getActiveScreenName()==='mainMenu',null,{timeout:60000});
  await page.evaluate(async model=>{await window.ensureGameplayModules();await loadRuntimeScript('career-screen-seam','js/careerScreenSeam.js',()=>Boolean(window.CareerModeCareerScreenSeam));await window.openOptionalModule('legacy');window.renderLegacy({model});},model);
  await page.waitForFunction(()=>document.querySelector('#legacyCardGrid .legacyCard')&&!document.getElementById('legacy').hasAttribute('data-v10-pending'),null,{timeout:30000});
  await page.evaluate(()=>document.fonts&&document.fonts.ready);await page.waitForTimeout(800);
  return {context,page,errors};
}
// Draws another career into an open History (the same path a fresh model takes) and waits for its cards.
async function redraw(page,model){
  await page.evaluate(model=>{window.renderLegacy({model});},model);
  await page.waitForFunction(n=>{const cards=document.querySelectorAll('#legacyCardGrid .legacyCard');return cards.length&&Number(cards[cards.length-1].dataset.showdown)===n&&!document.getElementById('legacy').hasAttribute('data-v10-pending');},model.history.showdowns.length,{timeout:30000});
  await page.waitForTimeout(500);
}
// Text boxes of shown cards that run into one another, out of their card, or are cut by their own box.
const CARD_PROBLEMS=()=>{
  const out=[];
  for(const c of [...document.querySelectorAll('#legacyCardGrid .legacyCard')].filter(c=>c.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&c.getBoundingClientRect().width>2)){
    const cr=c.getBoundingClientRect();
    const els=[...c.querySelectorAll('*')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}));
    const rects=els.map(e=>{const r=document.createRange();r.selectNodeContents(e);return {e,rs:[...r.getClientRects()].filter(x=>x.width>1&&x.height>1),text:e.textContent.trim().slice(0,30)};});
    for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
      if(rects[i].e.contains(rects[j].e)||rects[j].e.contains(rects[i].e))continue;
      for(const a of rects[i].rs)for(const b of rects[j].rs){const iw=Math.min(a.right,b.right)-Math.max(a.left,b.left),ih=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(iw>1&&ih>2)out.push(`#${c.dataset.showdown} "${rects[i].text}" x "${rects[j].text}"`);}
    }
    // the crest is a box without text: a score or name running over it counts too
    for(const crest of c.querySelectorAll('.legacyCrest')){const k=crest.getBoundingClientRect();for(const {rs,text} of rects)for(const r of rs){const iw=Math.min(r.right,k.right)-Math.max(r.left,k.left),ih=Math.min(r.bottom,k.bottom)-Math.max(r.top,k.top);if(iw>1&&ih>2)out.push(`#${c.dataset.showdown} "${text}" over a crest`);}}
    for(const {e,rs,text} of rects){
      for(const r of rs)if(r.right>cr.right+1||r.left<cr.left-1||r.bottom>cr.bottom+1)out.push(`#${c.dataset.showdown} "${text}" outside its card`);
      if(e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflowX!=='visible')out.push(`#${c.dataset.showdown} "${text}" cut short`);
    }
  }
  return out;
};
const HIT=()=>{
  const hit=el=>{if(!el)return 'missing';const r=el.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;if(y<0||y>innerHeight)return 'offscreen';const top=document.elementFromPoint(x,y);return top===el||el.contains(top)?'hit':'covered by '+(top?.id||String(top?.className).split(' ')[0]||top?.tagName);};
  const pager=document.getElementById('legacyPager');
  return {prev:hit(pager.querySelector('[data-direction="-1"]')),next:hit(pager.querySelector('[data-direction="1"]')),
    dots:[...pager.querySelectorAll('.legacyPageDot')].map(hit).filter(x=>x!=='hit'),counter:pager.querySelector('.legacyPageCounter')?hit(pager.querySelector('.legacyPageCounter')):'none',
    scrub:pager.querySelector('.legacyPageScrub')?hit(pager.querySelector('.legacyPageScrub')):'none',button:hit(document.getElementById('viewSeasonHistory'))};
};
const STATE=()=>({selected:window.LegacyFixture?.selectedShowdown??null,cards:[...document.querySelectorAll('#legacyCardGrid .legacyCard')].filter(c=>c.checkVisibility()).map(c=>Number(c.dataset.showdown)),
  counter:document.querySelector('#legacyPager .legacyPageCounter')?.textContent??null,dots:document.querySelectorAll('#legacyPager .legacyPageDot').length,
  scrub:document.querySelector('#legacyPager .legacyPageScrub')?.value??null});

// Two runs, each well inside the runner's 120 s per file: this file checks the desktop cards (A-01, A-07);
// r87-career-fixes-browser-nav-contracts.cjs requires it with PART "nav" for the phone pager (A-06) and long-career navigation.
const PART=global.R87_CAREER_FIXES_PART==='nav'?'nav':'layout';
let finished=false;
process.on('exit',code=>{if(!finished&&!code){console.error('r87 career fixes browser contracts ended before their last check.');process.exitCode=1;}});
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
    const base=`http://127.0.0.1:${port}/`;
    const groups=[];

    if(PART==='layout'){
    // A-01 + A-07: desktop History cards, a Golden 110-110 card among long club and Special Player names.
    const golden=career(['draw10','el3','win1','golden']);
    for(const size of [[1024,768],[1100,600],[1280,650],[1366,768],[1536,864],[1920,1080]]){
      const {context,page,errors}=await openHistory(browser,base,size,golden);
      try{
        // the golden card is #4, on the first desktop page with #1-#3
        const state=await page.evaluate(STATE);
        assert.deepEqual(state.cards,[1,2,3,4],`${size.join('x')}: one page of four`);
        assert.deepEqual(await page.evaluate(CARD_PROBLEMS),[],`${size.join('x')}: no score, crest, name or Special Player overlaps or cuts`);
        const score=await page.evaluate(()=>document.querySelector('.legacyCard[data-showdown="4"] .legacyScore').textContent);
        assert.equal(score,'110 – 110');
        assert.deepEqual(errors,[]);
      }finally{await context.close();}
    }
    groups.push('A-01 a 3-digit total never overlaps a crest or a name, and A-07 Special Player names are whole, at every desktop width from 1024 to 1920');
    }else{

    // A-06: phones, the pager stays visible and tappable on first paint with a Golden first card and with 100 Showdowns.
    // one page per size (each boot costs seconds on a loaded runner); the next career is drawn into the same History
    for(const size of [[360,740],[390,844],[393,660]]){const models=[['golden',career(['el3','win1','golden'])],['100',many(100)],['3',career(['el3','win1','el3'])]];
      const {context,page,errors}=await openHistory(browser,base,size,models[0][1]);
      try{for(const [index,[label,model]] of models.entries()){
        if(index>0)await redraw(page,model);
        const hit=await page.evaluate(HIT);
        const where=`${size.join('x')} ${label}`;
        assert.equal(await page.evaluate(()=>document.getElementById('appRuntimeNotice')?.textContent??null),null,`${where}: no error notice`);
        assert.equal(hit.prev,'hit',`${where}: ‹ is tappable`);assert.equal(hit.next,'hit',`${where}: › is tappable`);
        assert.deepEqual(hit.dots,[],`${where}: no dot is covered`);
        assert.ok(['hit','none'].includes(hit.counter)&&['hit','none'].includes(hit.scrub),`${where}: counter and scrubber are uncovered (${hit.counter}, ${hit.scrub})`);
        assert.equal(hit.button,'hit',`${where}: VIEW SEASON HISTORY shows on first paint, above the tab bar`);
        assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('viewSeasonHistory')).position),'relative','the button is in its own row, not sticky over the pager');
        assert.deepEqual(errors,[]);
      }}finally{await context.close();}
    }
    groups.push('A-06 on phones VIEW SEASON HISTORY never covers ‹ › or the dots, and still shows on first paint (360x740, 390x844, 393x660)');

    // Long careers on desktop: opens on the newest page; counter, jumps, scrubber and keyboard.
    {
      const {context,page,errors}=await openHistory(browser,base,[1366,768],many(100));
      try{
        let s=await page.evaluate(STATE);
        assert.deepEqual(s.cards,[97,98,99,100],'desktop opens on the newest page');assert.equal(s.selected,100,'the newest Showdown is selected');
        assert.equal(s.dots,0,'no 25 dots');assert.equal(s.counter,'97–100 / 100');assert.equal(s.scrub,'25');
        await page.click('#legacyPager [data-jump="oldest"]');s=await page.evaluate(STATE);assert.deepEqual(s.cards,[1,2,3,4]);assert.equal(s.counter,'1–4 / 100');
        await page.keyboard.press('ArrowRight');s=await page.evaluate(STATE);assert.deepEqual(s.cards,[5,6,7,8],'→ steps one page');
        await page.keyboard.press('End');s=await page.evaluate(STATE);assert.deepEqual(s.cards,[97,98,99,100],'End jumps to the newest');
        await page.keyboard.press('ArrowLeft');s=await page.evaluate(STATE);assert.deepEqual(s.cards,[93,94,95,96],'← steps back');
        await page.keyboard.press('Home');s=await page.evaluate(STATE);assert.deepEqual(s.cards,[1,2,3,4],'Home jumps to the oldest');
        await page.$eval('#legacyPager .legacyPageScrub',el=>{el.value='10';el.dispatchEvent(new Event('input',{bubbles:true}));});
        s=await page.evaluate(STATE);assert.deepEqual(s.cards,[37,38,39,40],'the scrubber jumps straight to page 10');assert.equal(s.counter,'37–40 / 100');
        await page.click('#legacyPager [data-jump="newest"]');s=await page.evaluate(STATE);assert.deepEqual(s.cards,[97,98,99,100]);
        assert.equal(await page.$eval('#legacyPager [data-jump="newest"]',el=>el.disabled),true,'» is off on the newest page');
        // Codex #1103: one continuous drag of the scrubber runs through many pages, and its keyboard steps keep focus on it.
        await page.evaluate(()=>{window.__scrub=document.querySelector('#legacyPager .legacyPageScrub');});
        const box=await page.locator('#legacyPager .legacyPageScrub').boundingBox();const y=box.y+box.height/2;
        await page.mouse.move(box.x+box.width-4,y);await page.mouse.down();
        for(let i=1;i<=12;i++)await page.mouse.move(box.x+box.width-4-(box.width-8)*i/12*0.6,y);
        const during=await page.evaluate(()=>({same:window.__scrub===document.querySelector('#legacyPager .legacyPageScrub'),value:Number(window.__scrub.value)}));
        await page.mouse.up();
        s=await page.evaluate(STATE);
        assert.equal(during.same,true,'the scrubber is the same element through the drag');
        assert.ok(Number(s.scrub)<=12,'the drag ran on past the first page change (page '+s.scrub+')');
        assert.equal(s.cards[0],(Number(s.scrub)-1)*4+1,'the cards follow the scrubber');
        const before=Number(s.scrub);
        await page.focus('#legacyPager .legacyPageScrub');
        for(let i=0;i<3;i++)await page.keyboard.press('ArrowLeft');
        s=await page.evaluate(STATE);
        assert.equal(Number(s.scrub),before-3,'three keyboard steps on the scrubber move three pages');
        assert.equal(s.cards[0],(before-4)*4+1);
        assert.equal(await page.evaluate(()=>document.activeElement===window.__scrub),true,'focus stays on the scrubber');
        await page.click('#legacyPager [data-jump="newest"]');s=await page.evaluate(STATE);assert.deepEqual(s.cards,[97,98,99,100]);
        // the season list open: arrows belong to it, the archive stays put
        await page.click('#viewSeasonHistory');await page.waitForTimeout(200);
        await page.keyboard.press('Home');s=await page.evaluate(STATE);assert.deepEqual(s.cards.slice(-1),[100],'keys do not page while the season list is open');
        assert.deepEqual(await page.evaluate(HIT).then(h=>[h.prev,h.next]),['hit','hit']);
        assert.deepEqual(errors,[]);
      }finally{await context.close();}
      // a short career keeps its dots, still opening on the newest page
      const short=await openHistory(browser,base,[1366,768],many(30));
      try{const s=await short.page.evaluate(STATE);assert.deepEqual(s.cards,[29,30],'30 Showdowns open on page 8');assert.equal(s.dots,8,'8 pages keep their dots');assert.equal(s.counter,null);
      }finally{await short.context.close();}
    }
    groups.push('History opens on the newest Showdown; 100 Showdowns on desktop use "97–100 / 100", « », a scrubber and ← → Home End');

    // Long careers on a phone: newest card, counter, swipe, jumps.
    {
      const {context,page,errors}=await openHistory(browser,base,[390,844],many(100));
      try{
        let s=await page.evaluate(STATE);
        assert.equal(s.selected,100,'the phone opens on the newest Showdown');assert.equal(s.counter,'100 / 100');assert.equal(s.dots,0,'no 100 dots');
        const swipe=async dx=>{await page.evaluate(dx=>{const g=document.getElementById('legacyCardGrid'),r=g.getBoundingClientRect(),y=r.top+r.height/2,x0=r.left+r.width/2;
          const t=(x)=>new Touch({identifier:1,target:g,clientX:x,clientY:y});g.dispatchEvent(new TouchEvent('touchstart',{changedTouches:[t(x0)],touches:[t(x0)],bubbles:true}));g.dispatchEvent(new TouchEvent('touchend',{changedTouches:[t(x0+dx)],touches:[],bubbles:true}));},dx);await page.waitForTimeout(100);};
        await swipe(120);s=await page.evaluate(STATE);assert.equal(s.selected,99,'a swipe right shows the older Showdown');assert.equal(s.counter,'99 / 100');
        await swipe(-120);s=await page.evaluate(STATE);assert.equal(s.selected,100,'a swipe left comes back');
        await page.click('#legacyPager [data-jump="oldest"]');s=await page.evaluate(STATE);assert.equal(s.selected,1);assert.equal(s.counter,'1 / 100');
        await page.evaluate(()=>{window.__phoneScrub=document.querySelector('#legacyPager .legacyPageScrub');});
        await page.$eval('#legacyPager .legacyPageScrub',el=>{el.value='37';el.dispatchEvent(new Event('input',{bubbles:true}));});
        s=await page.evaluate(STATE);assert.equal(s.selected,37,'the scrubber jumps to Showdown 37');assert.equal(await page.evaluate(()=>window.__phoneScrub===document.querySelector('#legacyPager .legacyPageScrub')),true,'the phone scrubber is kept too');assert.equal(s.counter,'37 / 100');
        const hit=await page.evaluate(HIT);assert.equal(hit.counter,'hit');assert.equal(hit.scrub,'hit');assert.equal(hit.button,'hit');
        assert.deepEqual(errors,[]);
      }finally{await context.close();}
    }
    groups.push('a phone opens on the newest of 100 Showdowns with "100 / 100", swipes one at a time, and jumps with « » and the scrubber');
    }

    for(const name of groups)console.log(`ok - ${name}`);
    console.log(`r87 career fixes browser contracts (${PART}): ${groups.length} groups passed`);
    finished=true;
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
