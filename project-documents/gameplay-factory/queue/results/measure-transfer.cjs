// JOB-1584: report only. Run from the repository root with the existing static server.
// npm run serve:test (in another terminal), then node project-documents/gameplay-factory/queue/results/measure-transfer.cjs
// Fixture copied from tests/browser/shared-transfer-challenge-replay-audit.cjs; existing audits remain unchanged.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../../../../tests/support/chromium-runtime.cjs');
const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const rivalryA='pair_'+('a'.repeat(64));
const rivalryB='pair_'+('b'.repeat(64));
const sessionId='session_'+('c'.repeat(64));
async function prepare(page,{managerRole,saveId}){
  await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==='function'&&typeof window.loadRuntimeScript==='function',null,{timeout:12000});
  await page.evaluate(async({managerRole,saveId,rivalryA,rivalryB,sessionId})=>{
    await ensureGameplayModules();
    const roleOther=managerRole==='playerOne'?'playerTwo':'playerOne';
    const managers={playerOne:'Daniel',playerTwo:'Nik'};
    const clubs={playerOne:'Arsenal',playerTwo:'Liverpool'};
    const serverEpoch=Date.now();
    let tokenEpoch=serverEpoch;
    let tokenReads=0;
    currentShowdown={id:saveId,currentRound:1,status:'Ready',sharedJourney:{mode:'shared',rivalryId:rivalryA},managers};

    let activeRivalry=rivalryA;
    let serverPhase='COMPLETED';
    let reads=0;
    let mutations=0;
    let raceMode=false;
    let raceStage=0;
    let releaseRaceA=null;
    let releaseRaceB=null;
    const setupValue=()=>({
      status:'ready',ready:true,open:false,busy:false,revision:6,phase:'SHOWDOWN_CONFIRMED',
      rivalryId:activeRivalry,sessionId,deviceId:'device_'+(managerRole==='playerOne'?'1':'2').repeat(32),managerRole,
      setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:3,confirmedRoles:['playerOne','playerTwo'],clubs}
    });
    window.CareerModeProductionSharedShowdownSetup={getState:setupValue,refresh:async()=>({ok:true})};
    window.CareerModeProductionSharedCareerStart={getState:()=>({state:{phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']}}),refresh:async()=>({ok:true})};
    window.CareerModeSharedTransferChallenge={runtimeRevision:'1.9.1-r8'};
    const completedInputs=role=>({
      guesses:[{slot:1,type:'league',valueId:'england-premier-league'}],
      signings:[{slot:1,name:role==='playerOne'?'Player A':'Player B',leagueId:'spain-primera-division',nationalityId:'england'}]
    });
    const makeView=()=>{
      if(serverPhase==='WINDOW_OPEN')return {ok:true,revision:1,seasonNumber:1,managerRole,rivalryId:activeRivalry,state:{phase:'WINDOW_OPEN',revision:1,startedAtEpochMs:serverEpoch,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[]},ownInputs:{guesses:null,signings:null},opponentInputs:null,verdicts:null};
      if(serverPhase==='GUESS_ENTRY')return {ok:true,revision:3,seasonNumber:1,managerRole,rivalryId:activeRivalry,state:{phase:'GUESS_ENTRY',revision:3,startedAtEpochMs:serverEpoch-900000,endedAtEpochMs:serverEpoch-1,endRequestedRoles:['playerOne','playerTwo'],guessLockedRoles:[],signingLockedRoles:[]},ownInputs:{guesses:null,signings:null},opponentInputs:null,verdicts:null};
      if(serverPhase==='SIGNING_ENTRY')return {ok:true,revision:5,seasonNumber:1,managerRole,rivalryId:activeRivalry,state:{phase:'SIGNING_ENTRY',revision:5,startedAtEpochMs:serverEpoch-900000,endedAtEpochMs:serverEpoch-1,endRequestedRoles:['playerOne','playerTwo'],guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:[]},ownInputs:{guesses:[{slot:1,type:'league',valueId:'england-premier-league'}],signings:null},opponentInputs:null,verdicts:null};
      return {ok:true,revision:7,seasonNumber:1,managerRole,rivalryId:activeRivalry,state:{phase:'COMPLETED',revision:7,startedAtEpochMs:serverEpoch-900000,endedAtEpochMs:serverEpoch-1,endRequestedRoles:['playerOne','playerTwo'],guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne','playerTwo']},ownInputs:completedInputs(managerRole),opponentInputs:completedInputs(roleOther),verdicts:{playerOne:[],playerTwo:[]}};
    };
    const rejectMutation=async()=>{mutations+=1;return {ok:false,code:'AUDIT_MUTATION_FORBIDDEN'};};
    window.CareerModeSparkSharedTransferChallenge={
      read:async()=>{
        reads+=1;
        const snapshot=makeView();
        snapshot.setup={coordinatorRole:'playerOne'};
        Object.assign(snapshot.state,window.__measureFlags||{});
        if(serverPhase==='NOT_STARTED'){snapshot.state={phase:'NOT_STARTED',revision:0,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[]};snapshot.ownInputs={guesses:null,signings:null};snapshot.opponentInputs=null;snapshot.verdicts=null;}
        if(raceMode){
          raceStage+=1;
          if(raceStage===1)await new Promise(resolve=>{releaseRaceA=resolve;});
          else if(raceStage===2)await new Promise(resolve=>{releaseRaceB=resolve;});
        }
        return snapshot;
      },
      startWindow:rejectMutation,requestEndWindow:rejectMutation,advanceExpiredWindow:rejectMutation,lockGuesses:rejectMutation,lockSignings:rejectMutation
    };
    const currentUser={uid:managerRole==='playerOne'?'account_one':'account_two',getIdTokenResult:async()=>{tokenReads+=1;return {issuedAtTime:new Date(tokenEpoch).toISOString()};}};
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser},firestore:{},firestoreSdk:{}})};

    await loadRuntimeScript('ssjr-transfer-replay-audit','js/productionSharedTransferChallenge.js',()=>window.CareerModeProductionSharedTransferChallenge);
    CareerModeProductionSharedTransferChallenge.install();
    const switchSave=()=>{
      activeRivalry=rivalryB;serverPhase='WINDOW_OPEN';
      currentShowdown={...currentShowdown,id:`${saveId}_switched`,currentRound:1,sharedJourney:{mode:'shared',rivalryId:rivalryB}};
    };
    window.__transferAudit={
      counts:()=>({reads,mutations,tokenReads}),
      setTokenEpoch(value){tokenEpoch=Number(value);},
      serverEpoch,
      switchSave,
      async setPhase(phase){serverPhase=phase;await CareerModeProductionSharedTransferChallenge.refresh();return CareerModeProductionSharedTransferChallenge.getState()?.state?.phase||null;},
      beginRaceA(){raceMode=true;raceStage=0;releaseRaceA=null;releaseRaceB=null;window.__raceA=CareerModeProductionSharedTransferChallenge.refresh();},
      switchAndBeginRaceB(){switchSave();window.__raceB=CareerModeProductionSharedTransferChallenge.refresh();},
      raceStatus:()=>({raceStage,hasReleaseA:typeof releaseRaceA==='function',hasReleaseB:typeof releaseRaceB==='function'}),
      releaseA(){if(releaseRaceA){const release=releaseRaceA;releaseRaceA=null;release();}},
      releaseB(){if(releaseRaceB){const release=releaseRaceB;releaseRaceB=null;release();}},
      async finishRace(){const results=await Promise.all([window.__raceA,window.__raceB]);raceMode=false;return results.map(Boolean);},
      rivalryB
    };
    await CareerModeProductionSharedTransferChallenge.open();
  },{managerRole,saveId,rivalryA,rivalryB,sessionId});
}


const sizes=[[360,640],[390,844],[430,932],[844,390],[932,430],[768,1024],[1280,650],[1366,768],[1920,1080],[2560,1080]];
const output=__dirname;
const evidence=process.env.CMS_TEST_RESULTS||'/tmp/job1584-transfer-evidence';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const samples=[],unreachable=[],errors=[];
if(process.env.CMS_MEASURE_RESUME==='1'&&fs.existsSync(path.join(evidence,'measure-transfer.json'))){
  const prior=JSON.parse(fs.readFileSync(path.join(evidence,'measure-transfer.json'),'utf8'));
  if(prior.sha!==execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim())throw new Error('Resume evidence belongs to a different repository HEAD');
  for(const size of sizes)for(const role of ['playerOne','playerTwo']){const group=prior.samples.filter(s=>s.size===size.join('x')&&s.role===role);if(group.length===15)samples.push(...group);}
  errors.push(...prior.errors);
}
async function settle(page){
  await page.evaluate(()=>{window.scrollTo(0,0);document.querySelectorAll('#transferChallenge *').forEach(el=>{if(el.scrollTop)el.scrollTop=0;});});
  await page.waitForTimeout(450);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function measure(page,size,role,state){
  await settle(page);
  if(state.endsWith('-listbox') && await page.locator('#transferChallenge [role=listbox]:visible').count()===0)throw new Error('Listbox closed before measurement');
  const data=await page.evaluate(({touch})=>{
    const root=document.querySelector('#transferChallenge'),doc=document.documentElement;
    const vw=window.innerWidth,vh=window.innerHeight,round=n=>Math.round(n*100)/100;
    function selector(el){
      if(el.id)return '#'+CSS.escape(el.id);
      const parts=[];
      while(el&&el!==root){
        if(el.id){parts.unshift('#'+CSS.escape(el.id));break;}
        let p=el.tagName.toLowerCase();
        p+=':nth-of-type('+(1+[...el.parentElement.children].filter(s=>s.tagName===el.tagName).indexOf(el))+')';
        parts.unshift(p);el=el.parentElement;
      }
      return (parts[0]?.startsWith('#')?'':'#transferChallenge > ')+parts.join(' > ');
    }
    function rendered(el){
      if(!el.getClientRects().length)return false;
      for(let p=el;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}
      const r=el.getBoundingClientRect();return r.width>0&&r.height>0;
    }
    function visibleRect(el){
      let r=el.getBoundingClientRect(),box={left:r.left,right:r.right,top:r.top,bottom:r.bottom};
      for(let p=el.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();
        if(/hidden|clip|auto|scroll/.test(s.overflowX)){box.left=Math.max(box.left,b.left);box.right=Math.min(box.right,b.right);}
        if(/hidden|clip|auto|scroll/.test(s.overflowY)){box.top=Math.max(box.top,b.top);box.bottom=Math.min(box.bottom,b.bottom);}
      }
      return box;
    }
    const findings=[],elements=[root,...root.querySelectorAll('*')].filter(rendered);
    function add(problem,el,value){findings.push({problem,selector:selector(el),value});}
    const docWidth=Math.max(doc.scrollWidth,document.body.scrollWidth);
    const horizontal=docWidth>doc.clientWidth;
    findings.push({problem:'Horizontal scrollbar',selector:'html / body',value:`${horizontal?'YES':'NO'}; scrollWidth=${docWidth}, clientWidth=${doc.clientWidth}; overflowX=${getComputedStyle(doc).overflowX}/${getComputedStyle(document.body).overflowX}`});
    let wide=0,small=0,clipped=0;
    for(const el of elements){
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      if(r.width>vw+1){wide++;add('Element wider than window',el,`width=${round(r.width)}; window=${vw}; left=${round(r.left)}; right=${round(r.right)}; classes=${el.className}${el.matches('img,picture')?'; decorative/media geometry':''}`);}
      const control=el.matches('button,input:not([type=hidden]),select,textarea,a[href],[role=button],[role=option]');
      if(touch&&control&&(r.width<44||r.height<44)){small++;add('Touch control below 44 px',el,`${round(r.width)}x${round(r.height)}; ${el.disabled?'disabled':'enabled'}; label=${(el.getAttribute('aria-label')||el.textContent||el.getAttribute('placeholder')||'').trim().slice(0,100)}`);}
      const hasText=[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())||el.matches('input,select,textarea');
      if(hasText&&el.clientWidth>0&&el.scrollWidth>el.clientWidth){clipped++;add('Text scrollWidth > clientWidth',el,`scrollWidth=${el.scrollWidth}; clientWidth=${el.clientWidth}; overflowX=${s.overflowX}; ${r.width<=1&&r.height<=1?'intentional 1px assistive text; ':''}text=${(el.value||el.textContent||'').trim().slice(0,100)}`);}
    }
    for(const el of elements.filter(el=>el.matches('[role=listbox]'))){
      const r=el.getBoundingClientRect(),v=visibleRect(el);
      const width=Math.max(0,Math.min(v.right,vw)-Math.max(v.left,0)),height=Math.max(0,Math.min(v.bottom,vh)-Math.max(v.top,0));
      add('Open listbox visibility',el,`${width>=r.width-1&&height>=r.height-1?'FULL':'CLIPPED'}; box=${round(r.width)}x${round(r.height)}; left=${round(r.left)}; top=${round(r.top)}; bottom=${round(r.bottom)}; visibleWithinViewportAndAncestors=${round(width)}x${round(height)}; options=${el.querySelectorAll('[role=option]').length}; scrollHeight=${el.scrollHeight}; clientHeight=${el.clientHeight}`);
    }
    if(!wide)findings.push({problem:'Elements wider than window',selector:'#transferChallenge *',value:'NONE'});
    if(!small)findings.push({problem:'Touch controls below 44 px',selector:'#transferChallenge :is(button,input,select,textarea,a,[role=button],[role=option])',value:touch?'NONE':'N/A (desktop)'});
    if(!clipped)findings.push({problem:'Text scrollWidth > clientWidth',selector:'#transferChallenge *',value:'NONE'});
    const ids=root.dataset.sharedTransferReplay?['continueFromTransfers']:['startTransferTimer','endTransferTimer','completeTransferChallenge','continueFromTransfers'];
    const action=ids.map(id=>document.getElementById(id)).find(el=>el&&rendered(el));
    let firstScreen=null;
    if(action){const r=action.getBoundingClientRect(),v=visibleRect(action);firstScreen=r.left>=0&&r.right<=vw&&r.top>=0&&r.bottom<=vh&&v.left<=r.left+1&&v.right>=r.right-1&&v.top<=r.top+1&&v.bottom>=r.bottom-1;
      const cx=Math.max(0,Math.min(vw-1,r.left+r.width/2)),cy=Math.max(0,Math.min(vh-1,r.top+r.height/2));const hit=document.elementFromPoint(cx,cy);if(firstScreen&&hit&&!action.contains(hit))add('Main action occluded at center',action,`covered by ${selector(hit)}`);
      add('Main action in first screenful',action,`${firstScreen?'YES':'NO'}; left=${round(r.left)}; right=${round(r.right)}; top=${round(r.top)}; bottom=${round(r.bottom)}; viewport=${vw}x${vh}; ${action.disabled?'disabled':'enabled'}; text=${action.textContent.trim()}`);
    }else findings.push({problem:'Main action in first screenful',selector:'#transferChallenge',value:'N/A; no rendered main action in this waiting state (REFRESH is secondary)'});
    // Enabled control intersection uses transformed CSS boxes and ancestor clipping.
    const controls=elements.filter(el=>el.matches('button,input,select,textarea,a[href],[role=option]')&&!el.disabled);
    let overlaps=0;
    for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){
      const a=controls[i],b=controls[j];if(a.contains(b)||b.contains(a))continue;
      const x=visibleRect(a),y=visibleRect(b),w=Math.min(x.right,y.right)-Math.max(x.left,y.left),h=Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top);
      if(w>1&&h>1){overlaps++;add('Enabled controls overlap',a,`with ${selector(b)}; intersection=${round(w)}x${round(h)}`);}
    }
    return {viewport:`${vw}x${vh}`,horizontal,wide,small,clipped,firstScreen,overlaps,mounted:root.classList.contains('tw-on'),phase:root.dataset.transferPhase,replay:root.dataset.sharedTransferReplay||null,findings};
  },{touch:size[0]<=932});
  // The application's coarse-pointer portrait policy intentionally sets width=760 on tablets.
  // Keep the requested physical window and the observed CSS layout viewport as separate evidence.
  samples.push({size:size.join('x'),role,state,...data});
  await page.screenshot({path:path.join(evidence,`${size.join('x')}-${role}-${state}.png`),fullPage:true});
  console.log(`${size.join('x')} ${role} ${state}: mounted=${data.mounted} wide=${data.wide} small=${data.small} clipped=${data.clipped} action=${data.firstScreen}`);
}
async function runState(page,size,role,state,fn){
  try{await fn();await measure(page,size,role,state);}catch(error){unreachable.push({size:size.join('x'),role,state,error:error.message});console.error(`UNREACHED ${size} ${role} ${state}: ${error.message}`);}
}
async function setPhase(page,phase,flags={}){
  await page.evaluate(async({phase,flags})=>{window.__measureFlags=flags;
    if(phase==='GUESS_ENTRY'||phase==='SIGNING_ENTRY')document.querySelectorAll('#transferChallenge input,#transferChallenge select').forEach(el=>{el.value='';delete el.dataset.canonicalId;delete el.dataset.canonicalLabel;});
    await window.__transferAudit.setPhase(phase);},{phase,flags});
  const local={NOT_STARTED:'window',WINDOW_OPEN:'window',GUESS_ENTRY:'guess_entry',SIGNING_ENTRY:'signing_entry',COMPLETED:'completed'}[phase];
  await page.waitForFunction(phase=>document.querySelector('#transferChallenge')?.dataset.transferPhase===phase,local,{timeout:5000});
}
async function dropdown(page,kind){
  const card=page.locator('#transferChallenge .transferGuessCard:not(.hidden)');
  if(kind.startsWith('guess')){
    await card.locator('select').first().selectOption(kind==='guess-league'?'league':'nationality');
    await page.waitForTimeout(160);await card.locator('input').first().focus();await card.locator('input').first().fill(kind==='guess-league'?'Premier':'Eng');
  }else{
    const prefix=await page.evaluate(()=>CareerModeProductionSharedTransferChallenge.getState().managerRole==='playerOne'?'p1':'p2');
    const input=page.locator(`#${prefix}Signing1${kind==='signing-league'?'League':'Nationality'}`);
    await page.locator('body').click({position:{x:1,y:1}});await page.waitForTimeout(160);await input.focus();await input.fill(kind==='signing-league'?'Premier':'Eng');
  }
  await page.locator('#transferChallenge [role=listbox]:visible').first().waitFor({state:'visible',timeout:3000});
}
function writeReport(){
  samples.sort((a,b)=>sizes.findIndex(s=>s.join('x')===a.size)-sizes.findIndex(s=>s.join('x')===b.size)||a.role.localeCompare(b.role));
  const escape=s=>String(s).replace(/\|/g,'\\|').replace(/\n/g,' ');
  const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const lines=['# JOB-1584 — Transfer measurements','',`Measured ${new Date().toISOString()} against gameplay/bug-list-1 commit \`${sha}\`. Browser: Chromium with Playwright; local static server; synthetic private two-manager provider fixtures only. No game files or existing audits changed.`, '',
    'Run from the repository root: `npm run serve:test` in one terminal, then `node project-documents/gameplay-factory/queue/results/measure-transfer.cjs`. Screenshots and raw JSON go to `/tmp/job1584-transfer-evidence` (override with `CMS_TEST_RESULTS`).', '',
    'Method: reuse the existing shared-transfer-challenge-replay audit’s gameplay module loading, mocked private provider and production `open`/`refresh` route. Both manager roles are measured at every requested size. Replay advances with the actual Continue button. A blocked pointer click is recorded; keyboard Enter on that button is used to measure later states without concealing the pointer defect. Live provider fixtures cover ready, window, early-end requested, guesses, guesses locked, signings, signings locked and completed; guess and signing League/Nationality listboxes are opened through their controls. Fixture names/one completed signing match that audit; empty and populated states are identified below. Empty-entry fixtures clear leftover replay form values before the production refresh; open search lists use Premier/Eng queries.', '',
    'Touch means the first six requested windows (width ≤ 932), including phone landscape and tablet; 1280x650 and larger desktop windows use mouse contexts. The 768x1024 touch tablet retains the app’s intentional meta viewport width=760 policy (js/onlinePlayerIdentity.js); observed CSS layout dimensions are recorded separately from the requested window, without changing the app. All dimensions are CSS px; controls use transformed bounding boxes, including disabled controls. Text flags use scrollWidth > clientWidth on direct-text elements and inputs/selects; overflow:visible can be an overflow flag without literal clipping. Decorative image overscan is recorded separately in values. Horizontal scrollbar means document scrollWidth > clientWidth (Chromium overlay scrollbars may have no painted gutter). Main action must be wholly within the initial viewport and all clipping ancestors, after resetting page and internal vertical scroll; a disabled action is explicitly marked. One-pixel assistive text is explicitly labelled and excluded from the priority list. Open lists report their visible intersection with the viewport and clipping ancestors separately from internal scroll height. The completed primary is Continue; waiting states can have no primary. Dropdown focus may scroll the form; measurements reset it to the first screenful while keeping the list open. Enabled-control overlaps use rendered/clipped rectangles, excluding containing pairs. Native select popups, real remote error/busy states and arbitrary long custom names are outside this fixture evidence.', '',
    '## Most important five','',
    ...importantFive(), '', '## Coverage and per-state summary','',
    '| Window | CSS layout viewport | Screen (role/state) | V10 mounted | Horizontal scrollbar | Wider elements | Touch controls <44 | Text flags | Main action first screenful | Control overlaps |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'];
  for(const s of samples)lines.push(`| ${s.size} | ${s.viewport} | ${s.role}/${s.state} | ${s.mounted?'yes':'no'} | ${s.horizontal?'yes':'no'} | ${s.wide} | ${Number(s.size.split('x')[0])<=932?s.small:'N/A'} | ${s.clipped} | ${s.firstScreen===null?'N/A':s.firstScreen?'yes':'no'} | ${s.overlaps} |`);
  lines.push('','## Measurements','','| Size | Screen | Problem | Selector | Measured value |','| --- | --- | --- | --- | --- |');
  for(const s of samples){lines.push(`| ${s.size} | ${s.role}/${s.state} | CSS layout viewport | window / viewport meta | requested window=${s.size}; observed innerWidth x innerHeight=${s.viewport} |`);}
  for(const s of samples)for(const f of s.findings)lines.push(`| ${s.size} | ${s.role}/${s.state} | ${escape(f.problem)} | ${escape(f.selector)} | ${escape(f.value)} |`);
  lines.push('','## Unreachable states and runtime limits','');
  if(!unreachable.length)lines.push('All scripted states were reached at all ten sizes for both roles.');
  else for(const u of unreachable)lines.push(`- ${u.size} ${u.role}/${u.state}: ${escape(u.error)}`);
  lines.push('',`Page errors: ${errors.length}.`,...errors.map(e=>`- ${escape(e)}`),'',`Total measured states: ${samples.length}. Raw DOM records and screenshots: \`${evidence}\` (generated, not committed).`,'');
  fs.writeFileSync(path.join(output,'measure-transfer.md'),lines.join('\n'));
  fs.writeFileSync(path.join(evidence,'measure-transfer.json'),JSON.stringify({sha,samples,unreachable,errors},null,2));
}
function importantFive(){
  // Filled from measured samples, with concrete selectors/values and no invented defects.
  const categories=[['Main action outside first screenful',s=>s.findings.find(f=>f.problem==='Main action in first screenful'&&f.value.startsWith('NO'))],['Small enabled touch targets',s=>s.findings.find(f=>f.problem==='Touch control below 44 px'&&f.value.includes('; enabled;'))],['Text width flags',s=>s.findings.find(f=>f.problem==='Text scrollWidth > clientWidth'&&!f.value.includes('intentional 1px'))],['Enabled control overlaps',s=>s.findings.find(f=>f.problem==='Enabled controls overlap')],['Clipped search lists',s=>s.findings.find(f=>f.problem==='Open listbox visibility'&&f.value.startsWith('CLIPPED'))]];
  return categories.map(([label,pick],i)=>{const matches=samples.map(s=>({s,f:pick(s)})).filter(x=>x.f);const x=matches[0];return `${i+1}. **${label}**: ${matches.length} measured state${matches.length===1?'':'s'}${x?`; e.g. ${x.s.size} ${x.s.role}/${x.s.state}, \`${x.f.selector}\`: ${x.f.value}`: '; none found'}.`;});
}
(async()=>{
  fs.mkdirSync(evidence,{recursive:true});
  process.env.CMS_CHROMIUM_MULTI_CONTEXT='1';
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,args:runtime.args,headless:true});
  try{
    for(const size of sizes)for(const role of ['playerOne','playerTwo']){
      if(samples.filter(s=>s.size===size.join('x')&&s.role===role).length===15)continue;
      const touch=size[0]<=932;
      const context=await browser.newContext({viewport:{width:size[0],height:size[1]},hasTouch:touch,isMobile:touch,deviceScaleFactor:1,reducedMotion:'reduce'});
      const page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(`${size.join('x')} ${role}: ${e.message}`));
      try{
        await prepare(page,{managerRole:role,saveId:'measure_'+role});
        await page.locator('#transferChallenge').waitFor({state:'visible',timeout:5000});
        await page.waitForFunction(()=>document.querySelector('#transferChallenge.tw-on .stage'),null,{timeout:12000});
        for(const state of ['replay-window','replay-guesses','replay-signings']){
          await runState(page,size,role,state,async()=>{});
          try{await page.locator('#continueFromTransfers').click({timeout:1500});}
          catch(error){
            samples.at(-1)?.findings.push({problem:'Replay pointer activation blocked',selector:'#continueFromTransfers',value:'Pointer click timed out after 1500ms; '+(error.message.match(/<[^>]+>.*?intercepts pointer events/)?.[0]||error.message.split('\n')[0])+'; keyboard Enter used to reach next state'});
            // Preserve the pointer failure, then use the actual button's keyboard activation to reach later states.
            await page.locator('#continueFromTransfers').focus();await page.locator('#continueFromTransfers').press('Enter');
          }
        }
        await runState(page,size,role,'completed-populated',async()=>{});
        await runState(page,size,role,'ready',()=>setPhase(page,'NOT_STARTED'));
        await runState(page,size,role,'window',()=>setPhase(page,'WINDOW_OPEN'));
        await runState(page,size,role,'early-end-requested',()=>setPhase(page,'WINDOW_OPEN',{endRequestedRoles:[role]}));
        await runState(page,size,role,'guesses-empty',()=>setPhase(page,'GUESS_ENTRY'));
        for(const kind of ['guess-league','guess-nationality'])await runState(page,size,role,kind+'-listbox',()=>dropdown(page,kind));
        await page.keyboard.press('Escape');
        await runState(page,size,role,'guesses-locked',()=>setPhase(page,'GUESS_ENTRY',{guessLockedRoles:[role]}));
        await runState(page,size,role,'signings-empty',()=>setPhase(page,'SIGNING_ENTRY'));
        for(const kind of ['signing-league','signing-nationality'])await runState(page,size,role,kind+'-listbox',()=>dropdown(page,kind));
        await page.keyboard.press('Escape');
        await runState(page,size,role,'signings-locked',()=>setPhase(page,'SIGNING_ENTRY',{signingLockedRoles:[role]}));
      }catch(error){unreachable.push({size:size.join('x'),role,state:'fixture/remaining states',error:error.message});}
      finally{await context.close();writeReport();}
    }
  }finally{await browser.close();writeReport();}
  console.log(`Report saved: ${samples.length} states, ${unreachable.length} unreachable, ${errors.length} page errors`);
  if(samples.length===0)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
