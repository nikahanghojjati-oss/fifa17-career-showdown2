// JOB-1586: report-only measurements. Run from any directory after starting
// node tests/support/static-server.cjs. No game or existing audit file is edited.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../../..');
const { chromium } = require(path.join(root, 'node_modules/playwright'));
const { resolveChromiumRuntime } = require(path.join(root, 'tests/support/chromium-runtime.cjs'));
const baseUrl = new URL(process.env.CMS_BASE_URL || 'http://127.0.0.1:4173/');
const evidenceDir = path.resolve(process.env.CMS_CLUB_EVIDENCE || '/tmp/cms-job-1586');
const sizes = [[360,640],[390,844],[430,932],[844,390],[932,430],[768,1024],[1280,650],[1366,768],[1920,1080],[2560,1080]];
// The fixture below is reused from shared-showdown-polished-presentation-audit.cjs:
// real app/module boot, identity overlay isolation, synthetic in-memory provider,
// real presentation activation, real league/pack controls. It is not account proof.
function setupState({phase,revision,leagueId=null,clubs=null,totalSeasons=null,confirmedRoles=[]}={}){
  return {schemaVersion:1,bindingHash:"sha256:"+"1".repeat(64),catalogHash:"sha256:"+"2".repeat(64),coordinatorRole:"playerOne",phase,revision,leagueId,clubs,totalSeasons,confirmedRoles,receipts:[],contentHash:"sha256:"+"3".repeat(64)};
}

async function prepare(page,{managerRole,remoteRole,initialSetup,reducedMotion=true,totalRounds=5,providerDelayMs=0}){
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==="function"&&typeof window.loadRuntimeScript==="function",null,{timeout:12000});
  // This proof owns the already-authorized Shared Showdown presentation subsystem, not the new
  // normal-play sign-in gate. Let online identity finish booting, then remove only its visual
  // gate so the fixture below can exercise the presentation contract in isolation.
  await page.waitForFunction(()=>window.CareerModeOnlinePlayerIdentity&&window.CareerModeOnlinePlayerIdentity.getState().initialized===true,null,{timeout:12000}).catch(()=>{});
  await page.evaluate(()=>document.getElementById("onlinePlayerIdentityOverlay")?.remove());
  await page.evaluate(async({managerRole,remoteRole,initialSetup,reducedMotion,totalRounds,providerDelayMs})=>{
    sessionStorage.setItem("careerModeShowdown.sharedJourneyPending.v1","1");
    window.CareerModeProductionSharedJourneyEntry={isPending:()=>true};
    window.isReducedClubMotionPreferred=()=>reducedMotion;
    await ensureGameplayModules();
    currentShowdown={name:"Daniel vs Nik",managers:{playerOne:"Daniel",playerTwo:"Nik"},totalRounds,currentRound:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],sharedJourney:{contractVersion:1,mode:"shared",setupPending:true}};
    let serverSetup=initialSetup;
    window.__sharedMutationCounts={open:0,"commit-league":0,"commit-clubs":0,"commit-length":0,confirm:0};
    window.__getSharedMutationCounts=()=>structuredClone(window.__sharedMutationCounts);
    window.__getSharedServerSetup=()=>serverSetup;
    window.__careerStartOpenCount=0;
    window.__careerStartInstallCount=0;
    window.CareerModeProductionSharedCareerStart={
      install(){window.__careerStartInstallCount+=1;return true;},
      async openPanel(){window.__careerStartOpenCount+=1;return true;}
    };
    let current={status:"ready",open:false,busy:false,ready:true,revision:serverSetup?serverSetup.revision:0,phase:serverSetup?serverSetup.phase:null,rivalryId:"pair_5"+"a".repeat(63),sessionId:"session_"+"b".repeat(64),accountId:managerRole==="playerOne"?"account_one":"account_two",deviceId:managerRole==="playerOne"?"device_"+"1".repeat(32):"device_"+"2".repeat(32),managerRole,remoteRole,setup:serverSetup,message:"ready"};
    const listeners=new Set();
    const emit=()=>{current={...current,revision:serverSetup?serverSetup.revision:0,phase:serverSetup?serverSetup.phase:null,setup:serverSetup};for(const listener of listeners)listener(current);};
    window.__setSharedServerSetup=value=>{serverSetup=value;};window.__setSharedReady=value=>{current={...current,ready:Boolean(value)};};window.__setSharedRivalryId=value=>{current={...current,rivalryId:String(value)};};
    window.CareerModeProductionSharedShowdownSetup={
      getState:()=>current,
      subscribe(listener){listeners.add(listener);listener(current);return()=>listeners.delete(listener);},
      async refresh(){emit();return {ok:true};},
      async mutate(type,extra={}){
        window.__sharedMutationCounts[type]=(window.__sharedMutationCounts[type]||0)+1;
        if(providerDelayMs>0)await new Promise(resolve=>setTimeout(resolve,providerDelayMs));
        // A held write stays in flight until the proof has delivered its repeat taps (see the pack-tap proof below).
        if(window.__holdWrite&&window.__holdWrite[type])await window.__holdWrite[type];
        // r50 fixtures: a write can be rejected (transient failure, or authority already moved on).
        if(window.__failNext&&window.__failNext[type]>0){window.__failNext[type]-=1;return {ok:false,code:"SHARED_SETUP_TRANSIENT_WRITE_FAILURE"};}
        if(type==="open"&&serverSetup)return {ok:false,code:"SHARED_SETUP_ALREADY_OPEN"};
        if(type==="open")serverSetup={schemaVersion:1,bindingHash:"sha256:"+"1".repeat(64),catalogHash:"sha256:"+"2".repeat(64),coordinatorRole:"playerOne",phase:"SHARED_SETUP_OPEN",revision:1,leagueId:null,clubs:null,totalSeasons:null,confirmedRoles:[],receipts:[],contentHash:"sha256:"+"3".repeat(64)};
        else if(type==="commit-league")serverSetup={...serverSetup,phase:"LEAGUE_WHEEL_COMMITTED",revision:2,leagueId:"laliga"};
        else if(type==="commit-clubs")serverSetup={...serverSetup,phase:"CLUB_ASSIGNMENTS_COMMITTED",revision:3,clubs:{playerOne:"Osasuna",playerTwo:"Espanyol"}};
        else if(type==="commit-length")serverSetup={...serverSetup,phase:"SEASON_LENGTH_COMMITTED",revision:4,totalSeasons:extra.totalSeasons};
        else if(type==="confirm"){const roles=[...(serverSetup.confirmedRoles||[])];if(!roles.includes(managerRole))roles.push(managerRole);serverSetup={...serverSetup,phase:roles.length===2?"SHOWDOWN_CONFIRMED":"SEASON_LENGTH_COMMITTED",revision:4+roles.length,confirmedRoles:roles};}
        emit();return {ok:true};
      },
      openPanel(){throw new Error("Engineering panel must not be player-facing in polished audit.");}
    };
    await loadRuntimeScript("ssjr-polished-presentation-audit","js/productionSharedShowdownPresentation.js",()=>window.CareerModeProductionSharedShowdownPresentation);
    CareerModeProductionSharedShowdownPresentation.install();
    await CareerModeProductionSharedShowdownPresentation.activate();
  },{managerRole,remoteRole,initialSetup,reducedMotion,totalRounds,providerDelayMs});
}


const captures = [];
const unreachable = [];
const errors = [];
const keepDetails = process.env.CMS_CLUB_KEEP_DETAILS === '1';
const rerunSizes = (process.env.CMS_CLUB_RERUN_SIZES || '').split(',').filter(Boolean);
if (rerunSizes.length) {
  const previous = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'measurements.json')));
  captures.push(...previous.captures.filter(c=>!rerunSizes.includes(c.size)&&(keepDetails||!c.screen.endsWith('confirmation-overlap-detail'))));
  unreachable.push(...previous.unreachable.filter(c=>!rerunSizes.includes(c.size)));
  errors.push(...previous.errors.filter(c=>!rerunSizes.includes(c.size)));
}
async function measure(page, size, screen, touch, transient = false) {
  // Keep the first screenful independent of Playwright's click auto-scroll.
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll('#clubWheelScreen, #clubWheelScreen *').forEach(el => {
      if (el.scrollTop) el.scrollTop = 0;
      if (el.scrollLeft) el.scrollLeft = 0;
    });
  });
  await page.waitForTimeout(transient ? 90 : 350);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const result = await page.evaluate(({touch}) => {
    const root = document.querySelector('#clubWheelScreen');
    if (!root || root.classList.contains('hidden')) throw new Error('Club screen is not shown');
    const r = n => Math.round(n * 10) / 10;
    const rect = el => {const b = el.getBoundingClientRect(); return {left:r(b.left),right:r(b.right),top:r(b.top),bottom:r(b.bottom),width:r(b.width),height:r(b.height)};};
    const selector = el => {
      if(el===document.documentElement)return 'html';
      if(el===document.body)return 'body';
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      while (el && el !== root) {
        if (el.id) {parts.unshift(`#${CSS.escape(el.id)}`);break;}
        let part = el.tagName.toLowerCase();
        if (el.classList.length) part += [...el.classList].map(c => `.${CSS.escape(c)}`).join('');
        const siblings = [...(el.parentElement?.children || [])].filter(n => n.tagName === el.tagName);
        if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(el)+1})`;
        parts.unshift(part);if(!el.parentElement)break;el = el.parentElement;
      }
      return parts[0]?.startsWith('#') ? parts.join(' > ') : '#clubWheelScreen > '+parts.join(' > ');
    };
    const shown = el => {
      const b = el.getBoundingClientRect();
      if (b.width <= 1 || b.height <= 1) return false;
      for (let n = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0 || n.hidden) return false;
        if (s.clip !== 'auto' || s.clipPath === 'inset(50%)') return false;
      }
      return true;
    };
    const decorative = el => !!el.closest('[aria-hidden="true"], [data-cl-decor], .plateClip, .phoneHeroStage');
    const header = document.getElementById('topHeader');
    const nodes = [root, ...root.querySelectorAll('*'), ...(header ? [header,...header.querySelectorAll('*')] : [])].filter(shown);
    const over = nodes.filter(el => el.getBoundingClientRect().width > innerWidth + 1).map(el => ({selector:selector(el),...rect(el),decorative:decorative(el)}));
    const controls = nodes.filter(el => el.matches('button, input:not([type=hidden]), select, textarea, a[href], [role=button]')).map(el => ({selector:selector(el),...rect(el),disabled:!!el.disabled}));
    const short = touch ? controls.filter(b => b.width < 44 || b.height < 44) : [];
    // Direct text nodes, including button labels, avoid labeling every container as clipped text.
    const text = nodes.filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).filter(el => el.scrollWidth > el.clientWidth).map(el => ({selector:selector(el),text:el.textContent.trim().replace(/\s+/g,' ').slice(0,110),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,...rect(el),overflowX:getComputedStyle(el).overflowX,decorative:decorative(el), glyphsEscape: [...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).some(n=>{const range=document.createRange();range.selectNodeContents(n);const t=range.getBoundingClientRect(),b=el.getBoundingClientRect();return t.right>b.right+1||t.left<b.left-1;})}));
    const cut = nodes.filter(el => !decorative(el) && (el.matches('button') || [...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))).flatMap(el => {
      const b = el.getBoundingClientRect();
      const reasons = [];
      if (b.left < -1 || b.right > innerWidth+1 || b.top < -1 || b.bottom > innerHeight+1) reasons.push('outside first viewport');
      for (let n = el.parentElement; n; n = n.parentElement) {
        const s = getComputedStyle(n), a = n.getBoundingClientRect();
        if (/hidden|clip/.test(s.overflowX) && (b.left<a.left-1 || b.right>a.right+1)) reasons.push(`x clipped by ${selector(n)}`);
        if (/hidden|clip/.test(s.overflowY) && (b.top<a.top-1 || b.bottom>a.bottom+1)) reasons.push(`y clipped by ${selector(n)}`);
      }
      return reasons.length ? [{selector:selector(el),...rect(el),reasons}] : [];
    });
    const primary = ['#continueClubAssignment','#openClubPack'].map(s=>document.querySelector(s)).find(el=>el&&shown(el));
    const b = primary && primary.getBoundingClientRect();
    const primaryResult = primary ? {selector:selector(primary),text:primary.textContent.trim(),...rect(primary),disabled:primary.disabled,inside: b.left>=0 && b.top>=0 && b.right<=innerWidth && b.bottom<=innerHeight && !cut.some(c=>c.selector===selector(primary)&&c.reasons.some(v=>v.includes('clipped')))} : null;
    const notices = [...document.querySelectorAll('.appNotice, .applicationErrorNotice, [role=alert]')].filter(shown).map(el=>({selector:selector(el),text:el.textContent.trim().slice(0,200),...rect(el)}));
    if (primaryResult) { const x=(b.left+b.right)/2,y=(b.top+b.bottom)/2; const hit=document.elementFromPoint(x,y); primaryResult.centerUnobscured=!!hit&&(hit===primary||primary.contains(hit)); }
    const doc = document.documentElement, body = document.body;
    const extent = Math.max(doc.scrollWidth, body.scrollWidth);
    const overflowX = getComputedStyle(doc).overflowX;
    const bodyOverflowX = getComputedStyle(body).overflowX;
    const scrollbar = extent > doc.clientWidth && !/hidden|clip/.test(overflowX) && (overflowX !== 'visible' || !/hidden|clip/.test(bodyOverflowX));
    const pairs = [['#clubNameOne','#clubNameTwo'],['#clubCardOne','#clubCardTwo'],['#sharedShowdownSeasonChoice','#continueClubAssignment'],['#sharedShowdownPresentationStatus','#continueClubAssignment'],['.clubRivalryLockNote','#continueClubAssignment'],['.clubRivalryLockNote','#sharedShowdownSeasonChoice']];
    const overlap = pairs.flatMap(([a,b])=>{const x=document.querySelector(a),y=document.querySelector(b);if(!x||!y||!shown(x)||!shown(y))return [];const u=x.getBoundingClientRect(),v=y.getBoundingClientRect();const w=Math.min(u.right,v.right)-Math.max(u.left,v.left),h=Math.min(u.bottom,v.bottom)-Math.max(u.top,v.top);return w>1&&h>1?[{selector:`${a} / ${b}`,width:r(w),height:r(h)}]:[];});
    return {viewport:{width:innerWidth,height:innerHeight},stage:root.dataset.clubRevealStage,mounted:!!window.CareerModeClubScreenV10?.isMounted(),doc:{scrollWidth:extent,clientWidth:doc.clientWidth,overflowX,bodyOverflowX,scrollbar},over,short,text,cut,overlap,notices,primary:primaryResult,controlCount:controls.length};
  }, {touch});
  const expectedStage=screen.match(/-(opening|manager-one|manager-two)$/)?.[1];
  if(expectedStage && result.stage!==expectedStage)throw new Error(`Skipped ${expectedStage} phase; captured ${result.stage}`);
  if (result.viewport.width !== size[0] || result.viewport.height !== size[1]) throw new Error(`Wrong viewport: ${JSON.stringify(result.viewport)}`);
  const id = `${size.join('x')}-${screen}`;
  if (!transient) await page.screenshot({path:path.join(evidenceDir, id+'.png')});
  captures.push({size:size.join('x'),screen,touch,...result});
  fs.writeFileSync(path.join(evidenceDir,'measurements.json'), JSON.stringify({captures,unreachable,errors},null,2));
  console.log(id, JSON.stringify({stage:result.stage,mounted:result.mounted,short:result.short.length,text:result.text.length,primary:result.primary?.inside}));
}
async function routeClub(page) {
  await page.waitForFunction(()=>document.getElementById('leagueWheelScreen')?.dataset.sharedLeagueWitnessed==='laliga',null,{timeout:7000});
  await page.locator('#spinLeague').click();
  await page.locator('#clubWheelScreen').waitFor({state:'visible',timeout:7000});
  await page.waitForFunction(()=>window.CareerModeClubScreenV10?.isMounted(),null,{timeout:10000});
  await page.evaluate(()=>document.fonts.ready);
}
async function setSetup(page, patch, ready) {
  await page.evaluate(async({patch,ready})=>{
    const value=window.__getSharedServerSetup();
    window.__setSharedServerSetup({...value,...patch});
    if(ready!==undefined)window.__setSharedReady(ready);
    await window.CareerModeProductionSharedShowdownPresentation.refresh();
  },{patch,ready});
}
async function runRole(browser, size, role) {
  const touch = sizes.indexOf(size) < 6;
  const context = await browser.newContext({viewport:{width:size[0],height:size[1]},isMobile:touch && size[0] !== 768,hasTouch:touch,deviceScaleFactor:1});
  const page = await context.newPage();
  page.on('pageerror',e=>errors.push({size:size.join('x'),role,error:e.message}));
  try {
    await prepare(page,{managerRole:role,remoteRole:role==='playerOne'?'host':'peer',initialSetup:setupState({phase:'LEAGUE_WHEEL_COMMITTED',revision:2,leagueId:'laliga'}),reducedMotion:false});
    await routeClub(page);
    const capture = (state,transient=false)=>measure(page,size,role+'-'+state,touch,transient);
    await capture('sealed');
    // Hold only the three known shared reveal phase callbacks in this fixture.
    // CSS animations still run; measurement/screenshot latency cannot skip a phase.
    await page.evaluate(()=>{
      const native=window.setTimeout.bind(window);
      window.__clubPhaseCallbacks=new Map();
      window.__restoreClubPhaseTimers=()=>{window.setTimeout=native;};
      let id=-1000;
      window.setTimeout=(fn,delay,...args)=>{
        if([650,1750,3000].includes(delay)) {
          window.__clubPhaseCallbacks.set(delay,()=>fn(...args));return id--;
        }
        return native(fn,delay,...args);
      };
    });
    if(role==='playerOne') {
      await page.evaluate(()=>{window.__holdWrite={'commit-clubs':new Promise(resolve=>{window.__releaseClubWrite=resolve;})};});
      await page.locator('#openClubPack').click({noWaitAfter:true});
      await page.waitForFunction(()=>document.getElementById('openClubPack').getAttribute('aria-busy')==='true');
      await capture('provider-working');
      // Persistently rejected fixture write exercises the real visible recovery notice.
      await page.evaluate(()=>{window.__failNext={'commit-clubs':2};delete window.__holdWrite;window.__releaseClubWrite();});
      await page.waitForFunction(()=>/THAT TAP DID NOT GO THROUGH/.test(document.getElementById('sharedShowdownPresentationStatus')?.textContent||''));
      await capture('pack-write-failure');
      await page.locator('#openClubPack').click({noWaitAfter:true});
    } else {
      await setSetup(page,{phase:'CLUB_ASSIGNMENTS_COMMITTED',revision:3,clubs:{playerOne:'Osasuna',playerTwo:'Espanyol'}});
    }
    for(const stage of ['opening','manager-one','manager-two']) {
      if(stage!=='opening')await page.evaluate(delay=>window.__clubPhaseCallbacks.get(delay)?.(),stage==='manager-one'?650:1750);
      await page.waitForFunction(stage=>document.getElementById('clubWheelScreen').dataset.clubRevealStage===stage,stage,{timeout:5000});
      await capture(stage,true);
    }
    await page.evaluate(()=>{window.__clubPhaseCallbacks.get(3000)?.();window.__restoreClubPhaseTimers();});
    await page.waitForFunction(()=>window.CareerModeProductionSharedShowdownPresentation.getState().clubRevealComplete,null,{timeout:6500});
    if(role==='playerTwo')await capture('clubs-locked-awaiting-season');
    await setSetup(page,{phase:'SEASON_LENGTH_COMMITTED',revision:4,totalSeasons:5,confirmedRoles:[]});
    await capture('confirm');
    await page.evaluate(()=>{window.__failNext={confirm:2};});
    await page.locator('#continueClubAssignment').click();
    await page.waitForFunction(()=>/THAT TAP DID NOT GO THROUGH/.test(document.getElementById('sharedShowdownPresentationStatus')?.textContent||''));
    await capture('confirm-write-failure');
    await page.locator('#continueClubAssignment').click();
    await page.waitForFunction(role=>window.__getSharedServerSetup().confirmedRoles.includes(role),role);
    await capture('waiting-rival');
    await setSetup(page,{phase:'SHOWDOWN_CONFIRMED',revision:6,confirmedRoles:['playerOne','playerTwo']},false);
    await capture('reconnect');
    await setSetup(page,{},true);
    await capture('career-start-ready');
    await page.evaluate(async()=>{currentShowdown.totalRounds=3;await CareerModeProductionSharedShowdownPresentation.refresh();});
    await capture('season-mismatch');
    // Exercise genuine catalog long names on the existing render path, not fabricated CSS.
    await page.evaluate(async()=>{
      currentShowdown.totalRounds=5;window.isReducedClubMotionPreferred=()=>true;
      const setup=window.__getSharedServerSetup();
      window.__setSharedServerSetup({...setup,phase:'SEASON_LENGTH_COMMITTED',revision:7,confirmedRoles:[],clubs:{playerOne:'Deportivo La Coruña',playerTwo:'Borussia Mönchengladbach'}});
      await CareerModeProductionSharedShowdownPresentation.refresh();
    });
    await capture('long-club-names');
    if(role==='playerOne') {
      // Local renderer is isolated as in visual audits; no random draw/storage write.
      await page.evaluate(()=>{
        CareerModeProductionSharedShowdownPresentation.deactivate();
        delete document.getElementById('clubWheelScreen').dataset.sharedPresentationRole;
        currentShowdown.sharedJourney=null;
        currentShowdown.selectedLeague={id:'laliga',name:'LaLiga'};
        currentShowdown.clubs={playerOne:'Osasuna',playerTwo:'Espanyol'};
      });
      for(const stage of ['ready','opening','manager-one','manager-two','versus','confirmation']) {
        await page.evaluate(stage=>stage==='ready'?renderReadyAssignmentState():renderClubRevealStage(stage),stage);
        await capture('local-'+stage);
      }
    }
  } catch(e) {
    unreachable.push({size:size.join('x'),role,error:e.message});
    console.error('UNREACHED',size.join('x'),role,e.message);
  } finally {await context.close();}
}
async function runDetail(browser,size,role) {
  const touch=sizes.indexOf(size)<6;
  const context=await browser.newContext({viewport:{width:size[0],height:size[1]},isMobile:touch&&size[0]!==768,hasTouch:touch});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({size:size.join('x'),role,error:e.message}));
  try {
    await prepare(page,{managerRole:role,remoteRole:role==='playerOne'?'host':'peer',initialSetup:setupState({phase:'SEASON_LENGTH_COMMITTED',revision:4,leagueId:'laliga',clubs:{playerOne:'Osasuna',playerTwo:'Espanyol'},totalSeasons:5}),reducedMotion:true});
    await routeClub(page);
    await page.waitForFunction(()=>window.CareerModeProductionSharedShowdownPresentation.getState().clubRevealComplete);
    await measure(page,size,role+'-confirmation-overlap-detail',touch);
    const c=captures[captures.length-1];
    const extra=await page.evaluate(()=>{
      const action=document.getElementById('continueClubAssignment'),b=action.getBoundingClientRect();
      const out=[];
      for(const id of ['clubNameOne','clubNameTwo','clubPackStatus','clubConfirmationShowdown','clubConfirmationMeta']) {
        const el=document.getElementById(id),a=el.getBoundingClientRect();
        if(!a.width||!a.height||getComputedStyle(el).visibility==='hidden')continue;
        const width=Math.min(a.right,b.right)-Math.max(a.left,b.left),height=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
        if(width>1&&height>1)out.push({selector:'#'+id+' / #continueClubAssignment',width:Math.round(width*10)/10,height:Math.round(height*10)/10});
      }
      return out;
    });
    c.overlap.push(...extra);
  } catch(e) {unreachable.push({size:size.join('x'),role,error:'confirmation detail: '+e.message});}
  finally {await context.close();}
}
function report() {
  captures.sort((a,b)=>sizes.findIndex(s=>s.join('x')===a.size)-sizes.findIndex(s=>s.join('x')===b.size));
  const lines = [
    '# JOB-1586 · Club screen measurements', '',
    `Measured ${new Date().toISOString()} on gameplay/bug-list-1 source ${execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()}. Chromium ${JSON.parse(fs.readFileSync(path.join(evidenceDir,'metadata.json'))).browser}; Node ${process.version}.`, '',
    `Captured ${captures.length} screen/window states at all ten requested CSS-pixel viewports. The script reuses the fixture from tests/browser/shared-showdown-polished-presentation-audit.cjs, boots the real app, activates its real shared presentation, and routes through League Wheel. Synthetic in-memory provider data isolates layout; it is not production/two-account proof. No game or existing audit file changed.`, '',
    'Measurements cover club content and the shared app header where visible. Touch checks apply to the first six sizes (phones in either orientation and 768×1024 tablet); desktop rows say N/A. DPR 1, default CSS motion for shared reveal stages; the reproducible fixture holds the shared 650/1750/3000 ms phase callbacks until each capture completes. Earlier accepted phone/landscape captures used natural phase timers; all stage labels are verified against the actual DOM stage. Tablet uses a desktop viewport with touch enabled to keep the requested CSS dimensions; portrait phones use mobile emulation. Desktop sizes have touch disabled. Stable states wait 350 ms, timed reveal stages 90 ms plus two animation frames. Long-name stress uses reduced motion and two catalog names from different leagues to stress width only; this pair is synthetic, not a legal league draw. Local stages invoke the real local renderer without drawing/persisting a career. Fonts and the V10 club mount are awaited. Stable-state screenshots and raw geometry are external artifacts; timed stages omit screenshots so screenshot latency cannot skip the next reveal phase. Supplementary confirmation-overlap-detail captures use reduced motion and check the primary button against club names, status and confirmation text.', '',
    'Reproduce: start `node tests/support/static-server.cjs`, then run `CMS_CHROMIUM_MULTI_CONTEXT=1 node project-documents/gameplay-factory/queue/results/measure-club.cjs`. Optional: CMS_BASE_URL, CMS_CLUB_EVIDENCE (default /tmp/cms-job-1586). CMS_CLUB_RERUN_SIZES is an optional comma-separated list (e.g. 768x1024,1280x650) that replaces those sizes in the existing JSON and refreshes all overlap-detail captures. CMS_CLUB_KEEP_DETAILS=1 keeps previously completed overlap-detail captures at other sizes. CMS_CLUB_REPORT_ONLY=1 regenerates the report from existing JSON without opening a browser. Only this report is overwritten. Raw JSON and viewport screenshots go to CMS_CLUB_EVIDENCE.', '',
    'Coverage: both roles’ sealed/waiting packs, opening/one-pack/two-pack reveal, locked clubs waiting for season authority, confirmation, failed confirmation, waiting for rival, reconnect, Career Start ready, season mismatch, and long catalog names; host also provider-working and pack-write-failure; local renderer ready/opening/one-pack/two-pack/versus/confirmation. Shared flow has no separate versus stage. The Career Start panel is stubbed exactly as the source audit does; its screen is outside club scope.', '',
    'Measurement rules: visible controls include disabled waiting/working buttons. Each dimension must be ≥44 px. Text candidates have direct nonempty text nodes and scrollWidth > clientWidth. The table also records whether DOM Range glyph bounds escape the text element: hidden-overflow + escaping glyphs is a clipping finding; other candidates need pseudo-element inspection. Numeric scrollWidth overflow alone is not proof of clipped text. Semantic-only hidden text is excluded. Oversized aria-hidden scenery is recorded separately as decoration. First-screenful requires the full primary-button rectangle within the viewport and no overflow-hidden/clip ancestor cutting it. Center hit-testing is recorded separately for occlusion; it does not affect geometric containment. A missing primary action is N/A (e.g. local versus). Key independent cards, season panel, lock note, status and primary button are checked for rectangle overlap. Horizontal scrollbar yes/no considers document extent and html/body overflow policy; hidden overflow can cut content without a scrollbar.', '',
    '## Most important five', '',
    '<!-- PRIORITIES -->', '',
    `Horizontal scrollbars: ${captures.filter(c=>c.doc.scrollbar).length} captures. Primary action outside/cropped from the first screenful: ${captures.filter(c=>c.primary&&!c.primary.inside).length} captures. Application page errors: ${errors.length}. Unreached scheduled sequences: ${unreachable.length}.`,
    ...unreachable.map(x=>`- ${x.size}, ${x.role}: ${x.error.replace(/\n/g,' ')}`), '',
    '## Measurements', '',
    '| Size | Screen | Problem / check | Selector | Measured value |',
    '| --- | --- | --- | --- | --- |'
  ];
  const row = (c,p,s,v)=>lines.push(`| ${c.size} | ${c.screen} | ${p} | ${String(s).replace(/\|/g,'\\|')} | ${String(v).replace(/\|/g,'\\|').replace(/\n/g,' ')} |`);
  for(const c of captures) {
    row(c,'Horizontal scrollbar', 'html / body',`${c.doc.scrollbar?'yes':'no'}; scroll/client ${c.doc.scrollWidth}/${c.doc.clientWidth}px; overflow ${c.doc.overflowX}/${c.doc.bodyOverflowX}`);
    row(c,'Element wider than window', '#clubWheelScreen',`${c.over.filter(x=>!x.decorative).length} content; ${c.over.filter(x=>x.decorative).length} decoration`);
    for(const x of c.over)row(c,x.decorative?'Oversized decoration (crop candidate)':'Wider than window',x.selector,`${x.width}px; left/right ${x.left}/${x.right}px`);
    row(c,'Touch control <44px', '#clubWheelScreen',c.touch?`${c.short.length} of ${c.controlCount} visible controls`:'N/A desktop');
    for(const x of c.short)row(c,'Touch target <44px',x.selector,`${x.width}×${x.height}px${x.disabled?'; disabled':''}`);
    row(c,'Text scrollWidth > clientWidth','#clubWheelScreen',`${c.text.length} candidates`);
    for(const x of c.text)row(c,x.decorative?'Decorative text width overflow':/hidden|clip/.test(x.overflowX)&&x.glyphsEscape?'Text clipped (glyph range)':'Text width flag (verify glyphs/pseudo-elements)',x.selector,`${x.scrollWidth}>${x.clientWidth}px; overflow-x ${x.overflowX}; glyph range outside ${x.glyphsEscape?'yes':'no'}; ${x.text}`);
    for(const x of c.cut)row(c,'Content outside viewport / ancestor crop',x.selector,`top/bottom ${x.top}/${x.bottom}; left/right ${x.left}/${x.right}px; ${x.reasons.join('; ')}`);
    for(const x of c.notices)row(c,'Global alert/notice',x.selector,`${x.text}; top/bottom ${x.top}/${x.bottom}px`);
    for(const x of c.overlap)row(c,'Overlap',x.selector,`${x.width}×${x.height}px intersection`);
    row(c,'Primary action in first screenful',c.primary?.selector||'none',c.primary?`${c.primary.inside?'yes':'no'}; ${c.primary.width}×${c.primary.height}px; top/bottom ${c.primary.top}/${c.primary.bottom}px; ${c.primary.text}${c.primary.disabled?'; disabled':''}; center unobscured ${c.primary.centerUnobscured?'yes':'no'}`:'N/A no visible action');
  }
  const priorities = priorityList();
  lines[lines.indexOf('<!-- PRIORITIES -->')] = priorities;
  fs.writeFileSync(path.join(__dirname,'measure-club.md'),lines.join('\n')+'\n');
}
function priorityList() {
  const tablet=captures.find(c=>c.size==='768x1024'&&c.screen==='playerOne-confirm');
  const crop=tablet?.cut.find(x=>x.selector==='#clubNameOne');
  const action=captures.find(c=>c.size==='768x1024'&&c.screen==='playerOne-sealed')?.primary;
  const target=size=>captures.find(c=>c.size===size&&c.screen==='playerOne-confirm')?.short.find(x=>x.selector==='#continueClubAssignment');
  const nameOverlaps=captures.filter(c=>c.screen==='playerOne-confirmation-overlap-detail').flatMap(c=>c.overlap.filter(x=>x.selector.startsWith('#clubName')).map(x=>`${c.size} ${x.selector}: ${x.width}×${x.height}px`));
  const note=captures.find(c=>c.size==='360x640'&&c.screen==='playerOne-confirm')?.overlap.find(x=>x.selector==='.clubRivalryLockNote / #continueClubAssignment');
  const long=captures.find(c=>c.size==='360x640'&&c.screen==='playerOne-long-club-names')?.text.find(x=>x.selector==='#clubNameTwo');
  return [
    `1. **Tablet crops core content and the opening action.** At 768×1024 the confirmation-stage #clubNameOne rectangle is ${crop?`${crop.left}…${crop.right}px horizontally`:'unmeasured'}; the other manager/club row also escapes the right edge. In the host sealed and pack-write-failure states, #openClubPack starts at ${action?.left??'unmeasured'}px, so its left edge is cut off even though its vertical position fits. Overflow-hidden prevents a horizontal scrollbar.`,
    `2. **Landscape controls are too short for touch.** #continueClubAssignment is ${target('844x390')?.height??'unmeasured'}px high at 844×390 and ${target('932x430')?.height??'unmeasured'}px at 932×430. Open Packs and local Back share those heights; the visible identity badge at 932×430 is 28px high. These fail the 44px threshold.`,
    `3. **Landscape confirmation crosses the club names.** Reduced-motion confirmation detail: ${nameOverlaps.join('; ')||'none measured'}. The 844×390 screenshot visibly shows the action covering part of the club-name row. These are rectangle intersections, not a claim that every pixel of both words is hidden.`,
    `4. **The smallest phone's lock note runs behind the action.** At 360×640 .clubRivalryLockNote intersects #continueClubAssignment by ${note?`${note.width}×${note.height}px`:'unmeasured'} and also touches the season panel. This repeats through confirmation, waiting/reconnect and recovery states; the main button itself fits.`,
    `5. **Long-name stress clips on the smallest phone.** At 360×640 #clubNameTwo (Borussia Mönchengladbach) measures ${long?`${long.scrollWidth}>${long.clientWidth}px`:'unmeasured'}, with hidden overflow and escaping glyph bounds. The cross-league fixture tests width only. By contrast, ordinary Osasuna/Espanyol width flags come from the animated brush pseudo-element: their glyphs fit. Decorative progress-dot flags also need visual inspection.`
  ].join('\n');
}
(async()=>{
  fs.mkdirSync(evidenceDir,{recursive:true});
  if(process.env.CMS_CLUB_REPORT_ONLY==='1') {
    const previous=JSON.parse(fs.readFileSync(path.join(evidenceDir,'measurements.json')));
    captures.push(...previous.captures);unreachable.push(...previous.unreachable);errors.push(...previous.errors);report();return;
  }
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,args:runtime.args,headless:true});
  fs.writeFileSync(path.join(evidenceDir,'metadata.json'),JSON.stringify({browser:browser.version(),node:process.version,sizes},null,2));
  try {
    for(const size of sizes.filter(size=>!rerunSizes.length||rerunSizes.includes(size.join('x'))))for(const role of ['playerOne','playerTwo'])await runRole(browser,size,role);
    for(const size of sizes.filter(size=>!keepDetails||!rerunSizes.length||rerunSizes.includes(size.join('x'))))for(const role of ['playerOne','playerTwo'])await runDetail(browser,size,role);
  } finally {
    await browser.close();report();
    fs.writeFileSync(path.join(evidenceDir,'measurements.json'),JSON.stringify({captures,unreachable,errors},null,2));
  }
  if(unreachable.length||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
