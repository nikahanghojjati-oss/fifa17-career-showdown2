// JOB-1583: report only. Run with the unchanged `npm run serve:test` server.
// node project-documents/gameplay-factory/queue/results/measure-home.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
process.env.CMS_CHROMIUM_MULTI_CONTEXT = '1';
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../../..');
const { resolveChromiumRuntime } = require(path.join(root, 'tests/support/chromium-runtime.cjs'));
const baseUrl = process.env.CMS_BASE_URL || 'http://127.0.0.1:4173/';
const sizes = [[360,640],[390,844],[430,932],[844,390],[932,430],[768,1024],[1280,650],[1366,768],[1920,1080],[2560,1080]];
const scratch = path.resolve(process.env.CMS_MEASURE_ARTIFACTS || path.join(root, 'work/job-1583'));
fs.mkdirSync(scratch, { recursive: true });
// Reuse the exact canonical save/history fixture without executing its audit.
const fixtureSource = fs.readFileSync(path.join(root, 'tests/browser/identity-safe-career-analytics-audit.cjs'), 'utf8');
const seed = vm.runInNewContext(fixtureSource.slice(fixtureSource.indexOf('const ids='), fixtureSource.indexOf('function collectErrors')) + '\nseededState();');
const records = [], failures = [], runtimeErrors = [];
let browserVersion;

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.race([
      Promise.all([...document.images].filter(img => img.getClientRects().length && img.getAttribute('src')).map(img => img.decode().catch(() => {}))),
      new Promise(resolve => setTimeout(resolve, 3000))
    ]);
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
}
async function home(page) {
  // tests/browser/home-visual-audit.cjs: navigation, loading dismissal, art decode.
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('#loadingScreen').waitFor({ state: 'hidden', timeout: 15000 });
  await page.locator('#continueCareer .tileArt').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => {
    const art = document.querySelector('#continueCareer .tileArt');
    return art && art.complete && art.naturalWidth > 0;
  });
  await settle(page);
}
async function measure(page, size, screen, scope, primary, touch) {
  await settle(page);
  const data = await page.evaluate(({ scope, primary, touch }) => {
    const host = document.querySelector(scope);
    if (!host) throw new Error(`Missing scope ${scope}`);
    const visible = el => {
      if (!el.getClientRects().length) return false;
      for (let n = el; n && n instanceof Element; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0 || n.hidden) return false;
      }
      return el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
    };
    const selector = el => {
      if (el.id) return '#' + CSS.escape(el.id);
      const parts = [];
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        if (n.id) { parts.unshift('#' + CSS.escape(n.id)); break; }
        parts.unshift(n.tagName.toLowerCase() + ':nth-child(' + ([...n.parentElement.children].indexOf(n) + 1) + ')');
      }
      return (parts[0]?.startsWith('#') ? '' : 'body > ') + parts.join(' > ');
    };
    const round = n => Math.round(n * 100) / 100;
    const rect = el => { const r = el.getBoundingClientRect(); return Object.fromEntries(['left','top','right','bottom','width','height'].map(k => [k, round(r[k])])); };
    const shell = scope === '#loadingScreen' ? [] : [...document.querySelectorAll('body > .sd-nav, body > .sd-nav *, #appRuntimeNotice, #appRuntimeNotice *')];
    const nodes = [...new Set([host, ...host.querySelectorAll('*'), ...shell])].filter(visible);
    const findings = [];
    const doc = document.documentElement, style = getComputedStyle(doc), bodyStyle = getComputedStyle(document.body);
    const scrollWidth = Math.max(doc.scrollWidth, document.body.scrollWidth);
    const overflow = scrollWidth > doc.clientWidth;
    const scrollbar = overflow && !['hidden','clip'].includes(style.overflowX) && !(style.overflowX === 'visible' && ['hidden','clip'].includes(bodyStyle.overflowX));
    const controls = nodes.filter(el => el.matches('button, input:not([type="hidden"]), select, textarea, a[href], [role="button"]') || (el.matches('label') && (el.control?.matches('input[type="checkbox"], input[type="radio"]') || el.querySelector('input[type="checkbox"], input[type="radio"]'))));
    const undersized = [];
      for (const el of nodes) {
      const r = rect(el), decorative = Boolean(el.closest('[aria-hidden="true"]'));
      const art = decorative || el.matches('.sd-stage__registered, .sd-stage__cutout, .sd-stage__rim');
      if (r.width > innerWidth + 0.5) findings.push({problem: 'element wider than window' + (art ? ' (decorative)' : ''), selector: selector(el), value: `width=${r.width}; viewport=${innerWidth}; left=${r.left}; right=${r.right}`});
      if (r.width > 2 && el.clientWidth > 0 && [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()) && el.scrollWidth > el.clientWidth) {
        findings.push({problem: 'text width overflow' + (decorative ? ' (decorative)' : ''), selector: selector(el), value: `scrollWidth=${el.scrollWidth} > clientWidth=${el.clientWidth}; overflowX=${getComputedStyle(el).overflowX}; text=${el.textContent.trim().replace(/\s+/g,' ').slice(0,90)}`});
      }
      // Additional evidence: glyph rectangles cut by a non-scrollable clipping ancestor.
      if (r.width > 2 && !el.matches('svg, svg *')) {
        const textNodes=[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
        const ranges=textNodes.flatMap(n=>{const range=document.createRange();range.selectNodeContents(n);return [...range.getClientRects()];});
        let scrollableAncestor=null;
        for(let parent=el; ranges.length && parent && parent!==document.body; parent=parent.parentElement) {
          const style=getComputedStyle(parent), clip=parent.getBoundingClientRect();
          if ((['auto','scroll'].includes(style.overflowY)&&parent.scrollHeight>parent.clientHeight)||(['auto','scroll'].includes(style.overflowX)&&parent.scrollWidth>parent.clientWidth)) scrollableAncestor=selector(parent);
          const clipX=['hidden','clip'].includes(style.overflowX),clipY=['hidden','clip'].includes(style.overflowY);
          const cut=ranges.find(line=>(clipX&&(line.left<clip.left-1||line.right>clip.right+1))||(clipY&&(line.top<clip.top-1||line.bottom>clip.bottom+1)));
          if(cut) { findings.push({problem:scrollableAncestor?'text outside scrollable viewport':'text clipped by ancestor' + (decorative ? ' (decorative)' : ''),selector:selector(el),value:`clip=${selector(parent)}; glyph=${JSON.stringify(Object.fromEntries(['left','top','right','bottom'].map(k=>[k,round(cut[k])])))}; box=${JSON.stringify(rect(parent))}; overflow=${style.overflowX}/${style.overflowY}${scrollableAncestor?'; scrollable ancestor='+scrollableAncestor:''}`});break; }
        }
      }
    }
    // Visually hidden radio/checkbox inputs are represented by their visible labels.
    for (const el of controls) {
      const r = rect(el);
      if (el.matches('input') && (r.width <= 2 || r.height <= 2) && el.labels?.length) continue;
      if (touch && (r.width < 44 || r.height < 44)) {
        const hit = el.closest('label') || el;
        const h = rect(hit);
        if (h.width >= 44 && h.height >= 44) continue;
        undersized.push(selector(hit));
        findings.push({problem:'touch control below 44px' + (el.disabled ? ' (disabled)' : ''), selector:selector(hit), value:`${h.width}x${h.height} CSS px; enabled=${!el.disabled}`});
      }
    }
    const button = primary ? host.querySelector(primary) : null;
    let action = { selector: primary || 'none', inside: null, value:'N/A: no main action in this state' };
    if (primary) {
      if (!button || !visible(button)) action = { selector:primary, inside:false, value:'missing or hidden' };
      else {
        const r = rect(button);
        const pointX = Math.max(0, Math.min(innerWidth - 1, r.left + r.width / 2));
        const pointY = Math.max(0, Math.min(innerHeight - 1, r.top + r.height / 2));
        const hit = document.elementFromPoint(pointX, pointY);
        const inside = r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5;
        action = {selector:selector(button), inside, value:`${inside ? 'yes' : 'no'}; top=${r.top}; bottom=${r.bottom}; height=${innerHeight}; enabled=${!button.disabled}; centreUncovered=${Boolean(hit && button.contains(hit))}`};
      }
    }
    // Home tile collisions and clipped/off-screen tile content, as in home-visual-audit.
    if (scope === '#mainMenu') {
      const tiles = nodes.filter(el => el.matches('.fifaMenuGrid .menuTile'));
      const obstacles = nodes.filter(el => el.matches('.menuMusicTile, .homeLockup'));
      const overlap = (a,b) => Math.min(a.right,b.right) - Math.max(a.left,b.left) > 1 && Math.min(a.bottom,b.bottom) - Math.max(a.top,b.top) > 1;
      for (let i = 0; i < tiles.length; i++) {
        const el = tiles[i], r = rect(el);
        if (r.left < -0.5 || r.top < -0.5 || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5) findings.push({problem:'home tile outside first screenful',selector:selector(el),value:JSON.stringify(r)});
        for (const other of [...tiles.slice(i+1), ...obstacles]) if (overlap(r,rect(other))) findings.push({problem:'home tile overlap',selector:selector(el)+' / '+selector(other),value:`tile=${JSON.stringify(r)}; other=${JSON.stringify(rect(other))}`});
      }
    }
    return {innerWidth,innerHeight,clientWidth:doc.clientWidth,scrollWidth,overflow,scrollbar,rootOverflowX:style.overflowX,bodyOverflowX:bodyStyle.overflowX,elementCount:nodes.length,controlCount:controls.length,undersized:[...new Set(undersized)].length,action,findings};
  }, { scope, primary, touch });
  records.push({size,screen,scope,touch,...data});
  if (process.env.CMS_MEASURE_SCREENSHOTS === '1') await page.screenshot({ path:path.join(scratch, `${size}-${screen}.png`), fullPage:true });
  process.stdout.write(`${size} ${screen}: ${data.findings.length} findings; horizontal scrollbar=${data.scrollbar}; action=${data.action.inside}\n`);
}
async function attempt(page, size, screen, scope, primary, touch, open) {
  try {
    if (open) await open();
    await page.locator(scope).waitFor({state:'visible',timeout:8000});
    await measure(page,size,screen,scope,primary,touch);
  } catch (error) {
    const visibleState=await page.evaluate(()=>[...document.querySelectorAll('.screen:not(.hidden), [role="dialog"], #appRuntimeNotice')].filter(el=>el.getClientRects().length&&getComputedStyle(el).display!=='none').map(el=>`${el.id}: ${el.innerText.slice(0,180).replace(/\s+/g,' ')}`).join('; ')).catch(()=>'');
    failures.push({size,screen,error:error.message.split('\n')[0]+'; visible state: '+visibleState});
    process.stdout.write(`UNREACHED ${size} ${screen}: ${error.message.split('\n')[0]}\n`);
  }
}
async function installIdentity(page) {
  // Same local-only Daniel identity seam as stability-audit.cjs; no real sign-in.
  await page.evaluate(async () => {
    if (!window.CareerModeOnlinePlayerIdentity?.initialize) await window.loadRuntimeScript('stability-online-player-identity','js/onlinePlayerIdentity.js',()=>window.CareerModeOnlinePlayerIdentity);
    const accountId='account_stability_fixture',deviceId='device_stability_fixture';
    window.CareerModeProductionFirebaseRuntime ||= {};
    window.CareerModeSparkConnectedAccount={initialize:async()=>({connected:true,accountId}),getState:()=>({connected:true,accountId}),signIn:async()=>({connected:true,accountId}),signOut:async()=>({connected:false,accountId:null})};
    window.CareerModeSparkPrivatePairing={initialize:async()=>({registered:true,deviceId}),getState:()=>({registered:true,deviceId,message:'Ready'}),getOrCreateDeviceIdentity:async()=>({deviceId})};
    window.CareerModePersistentNikDanielPair={initialize:async()=>({accountId,managerId:'daniel',connectionState:'idle',rivalryId:null}),render:()=>null};
    const identity=window.CareerModeOnlinePlayerIdentity;
    let state=await identity.initialize(true);
    if(state?.status==='choose-manager') state=await identity.chooseManager('daniel');
    if(state?.status!=='ready') throw new Error('Daniel fixture did not reach ready');
    document.getElementById('onlinePlayerIdentityOverlay')?.remove();
  });
}

function writeReport() {
  // One-pixel screen-reader headings are deliberate, not visible text defects.
  for(const r of records) r.findings=r.findings.filter(f=>!(f.problem.startsWith('text clipped by ancestor')&&f.value.includes('"width":1,"height":1')));
  fs.writeFileSync(path.join(scratch,'measure-home.raw.json'), JSON.stringify({baseUrl,browserVersion,records,failures,runtimeErrors},null,2)+'\n');
  const esc = s => String(s).replace(/\|/g,'\\|').replace(/\n/g,' ');
  const row = (...cells) => '| '+cells.map(esc).join(' | ')+' |';
  const sourceHead = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  records.sort((a,b)=>sizes.findIndex(([w,h])=>`${w}x${h}`===a.size)-sizes.findIndex(([w,h])=>`${w}x${h}`===b.size));
  const lines = ['# JOB-1583 — Home measurements','',`Measured source: \`${sourceHead}\` (gameplay/bug-list-1). Browser: Chromium ${browserVersion}. URL: ${baseUrl}. Run: ${new Date().toISOString()}.`,'',
    '## Method and scope','',
    'All values are CSS pixels from real Chromium DOM geometry at window scroll position zero, after fonts, visible images and transitions settle. Each size uses fresh browser storage. Touch sizes are the three phone portraits, two phone landscapes and 768x1024 tablet; DPR 2 and hasTouch=true. Phone contexts also use isMobile=true; desktops use DPR 1. This is a Chromium measurement, not a Safari or physical-device claim.', '',
    'Reuses home-visual-audit.cjs startup and art-decode waits; identity-safe-career-analytics-audit.cjs canonical save/history fixture; stability-audit.cjs local Daniel identity seam for New Showdown; loading-visual-audit.cjs re-exposure of the completed splash. No existing audit or game file is edited. Any startup notice is recorded with Home, then dismissed via its actual button before visiting other states. The splash is re-exposed after startup, so intermediate loading/error animations are not measured.', '',
    'Scope includes the visible global header and bottom navigation alongside each state, empty/seeded/offline Home, soundtrack choices and long track text, all reachable Home tile destinations, Connect Players tabs and the season picker. Career Statistics phone tabs and Trophy Room categories are measured when visible. Local history cannot authorize provider-backed career data: Statistics and Trophy Room show unavailable; authenticated populated/partial career states and real connected/pairing/playing/error-stream states are not reached. These are explicitly unmeasured. Continue routing with a local save is attempted, without forging an ACTIVE paired session.', '',
    'Horizontal scrollbar means document overflow with an overflow mode that permits scrolling; width overflow is recorded separately even when CSS hides it. Element widths include decorative art, labelled separately. Text candidates have direct non-whitespace text and scrollWidth > clientWidth (strict comparison); this flags width overflow, including intentional ellipsis or scrollable content, rather than proving every glyph is lost. Deliberate one-pixel accessibility headings are excluded. Decorative text remains measured and is labelled separately. Additional rows report text Range rectangles cut by an overflow:hidden/clip ancestor, including possible vertical clipping; Range bounds are a geometric warning, not pixel proof of lost glyphs. Rows outside an auto/scroll container are labelled separately as scroll-position observations. Visually hidden radio/checkbox inputs use their visible label target. Disabled controls are counted and labelled. Main action means the specified primary control, or Back/Close on read-only states; containment requires its entire rectangle in the first screenful. Centre coverage is also recorded. Only Home tiles are checked for overlaps; no blanket claim about all-screen overlap is made.', '',
    'Reproduce: start `npm run serve:test`, then `node project-documents/gameplay-factory/queue/results/measure-home.cjs`. Optional `CMS_MEASURE_SCREENSHOTS=1` saves screenshots in `work/job-1583`; raw JSON is also saved there. `CMS_MEASURE_SIZES=360x640` selects a diagnostic subset; omit it for all ten sizes.', '',
    '## Coverage and required checks','',
    '| Size | Screen | Horizontal scrollbar | Document width / client width | Wider elements | Touch controls <44 | Text width overflow | Main action in first screenful |','| --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const r of records) lines.push(row(r.size,r.screen,r.scrollbar?'yes':'no',`${r.scrollWidth}/${r.clientWidth}; root/body overflowX=${r.rootOverflowX}/${r.bodyOverflowX}`,r.findings.filter(f=>f.problem.startsWith('element wider')).length,r.touch?r.undersized:'N/A (desktop)',r.findings.filter(f=>f.problem.startsWith('text width overflow')).length,`${r.action.selector}: ${r.action.value}`));
  lines.push('', '## Measurement table', '', '| Size | Screen | Problem | Selector | Measured value |','| --- | --- | --- | --- | --- |');
  for (const r of records) {
    if(r.overflow) lines.push(row(r.size,r.screen,r.scrollbar?'horizontal scrollbar':'horizontal overflow hidden by CSS','html / body',`${r.scrollWidth} > ${r.clientWidth}`));
    for (const f of r.findings) lines.push(row(r.size,r.screen,f.problem,f.selector,f.value));
    if(r.action.inside===false) lines.push(row(r.size,r.screen,'main action outside first screenful',r.action.selector,r.action.value));
    if(!r.findings.length && !r.overflow && r.action.inside!==false) lines.push(row(r.size,r.screen,'no measured problem',r.scope,`${r.elementCount} rendered elements; ${r.controlCount} control candidates`));
  }
  lines.push('', '## Unreached screens / runtime diagnostics','');
  if(failures.length) for(const f of failures) lines.push(`- ${f.size}, ${f.screen}: ${esc(f.error)}`);
  else lines.push('All attempted states were reached. Provider-only states excluded above remain unmeasured.');
  const errors=[...new Set(runtimeErrors.map(e=>`${e.screen}: ${e.error}`))];
  lines.push('',...(errors.length?errors.map(e=>'- '+esc(e)):['No page errors or unexpected console errors recorded.']));
  lines.push('', '## Most important five','');
  const groups=new Map();
  const priority=problem => problem==='main action outside first screenful'?100:problem==='home tile overlap'?95:problem==='home tile outside first screenful'?90:problem==='text width overflow'?80:problem==='text clipped by ancestor'?75:problem==='touch control below 44px'?65:problem.startsWith('element wider')?5:0;
  for(const r of records) {
    const findings=[...r.findings];
    if(r.action.inside===false) findings.push({problem:'main action outside first screenful',selector:r.action.selector,value:r.action.value});
    for(const f of findings) {
      if(priority(f.problem)<60)continue;
      const family=/^(home-|soundtrack-)/.test(r.screen)?'Home / soundtrack':r.screen;
      const key=family+'/'+f.problem;
      const group=groups.get(key)||{screen:family,problem:f.problem,sizes:new Set(),sample:f};
      group.sizes.add(r.size);groups.set(key,group);
    }
  }
  const top=[...groups.values()].sort((a,b)=>priority(b.problem)-priority(a.problem)||b.sizes.size-a.sizes.size).slice(0,5);
  top.forEach((g,i)=>lines.push(`${i+1}. **${g.screen}: ${g.problem}.** Sizes: ${[...g.sizes].join(', ')}. Example: \`${g.sample.selector}\`, ${g.sample.value}.`));
  const supplements=[
    `Coverage limit: Continue with the canonical local save does not reach Showdown Home without sign-in/paired authority (${failures.filter(f=>f.screen==='continue-local-save').length} sizes). The visible sign-in gate is measured separately. Provider-backed populated career states remain unmeasured.`,
    `Scrollable content: ${records.reduce((n,r)=>n+r.findings.filter(f=>f.problem==='text outside scrollable viewport').length,0)} text rectangles start outside their scrollable view. These rows are intentional scroll-position observations, not proof of irrecoverable clipping.`,
    `Document containment: ${records.filter(r=>r.scrollbar).length}/${records.length} measured states permit a horizontal document scrollbar. Oversized registered artwork is separately recorded; it can be an intentional crop.`
  ];
  for(let i=top.length;i<5;i++)lines.push(`${i+1}. ${supplements[(i-top.length)%supplements.length]}`);
  lines.push('');
  fs.writeFileSync(path.join(__dirname,'measure-home.md'),lines.join('\n'));
}

(async () => {
  if(process.env.CMS_MEASURE_REPORT_ONLY==='1') {
    const previous=JSON.parse(fs.readFileSync(path.join(scratch,'measure-home.raw.json'),'utf8'));
    records.push(...previous.records);failures.push(...previous.failures);runtimeErrors.push(...previous.runtimeErrors);browserVersion=previous.browserVersion;
    writeReport();return;
  }
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,args:runtime.args,headless:true});
  browserVersion=await browser.version();
  try {
    const runSize=async ([width,height]) => {
      const size=`${width}x${height}`;
      if(process.env.CMS_MEASURE_SIZES && !process.env.CMS_MEASURE_SIZES.split(',').includes(size)) return;
      const phone=Math.min(width,height)<=430, touch=phone||width===768;
      for(const mode of ['empty','seeded']) {
        const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:touch?2:1,isMobile:phone,hasTouch:touch,locale:'en-US',reducedMotion:'reduce'});
        if(mode==='seeded') await context.addInitScript(seed=>{
          localStorage.setItem('careerModeShowdown.saveLibrary',JSON.stringify(seed.library));
          localStorage.removeItem('careerModeShowdown.activeShowdown');
          localStorage.setItem('careerModeShowdown.legacyShowdowns',JSON.stringify(seed.legacy));
          localStorage.setItem('careerModeShowdown.preferences',JSON.stringify(seed.preferences));
        },seed);
        const page=await context.newPage();
        page.setDefaultTimeout(5000);
        page.on('console',msg=>{if(msg.type()==='error'&&!/^Failed to load resource/.test(msg.text()))runtimeErrors.push({size,screen:mode,error:msg.text()});});
        page.on('pageerror',error=>runtimeErrors.push({size,screen:mode,error:error.message}));
        try {
          await home(page);
          await attempt(page,size,`home-${mode}`,'#mainMenu',mode==='empty'?'#newShowdown':'#continueCareer',touch);
          const dismiss=page.locator('#appRuntimeNotice button');
          if(await dismiss.isVisible()) await dismiss.click();
          if(mode==='seeded') {
            await attempt(page,size,'continue-local-save','#dashboard','#seasonPrimaryAction',touch,()=>page.locator('#continueCareer').click({timeout:4000}));
            if(await page.locator('#onlinePlayerIdentityOverlay').isVisible()) await attempt(page,size,'continue-sign-in-gate','#onlinePlayerIdentityOverlay','button.menuButton',touch);
            continue;
          }
          await attempt(page,size,'soundtrack-choices','#mainMenu','#newShowdown',touch,async()=>{
            const label=page.locator('label.phoneTrackSheetOpen');
            if(await label.isVisible()) await page.locator('#phoneTrackSheetToggle').check();
            await page.locator('#menuAudiusSelector').waitFor({state:'visible',timeout:5000});
          });
          await attempt(page,size,'soundtrack-long-title','#mainMenu','#newShowdown',touch,async()=>{
            await page.locator('[data-soundtrack-track="shelterRemix"]').click({timeout:4000});
            const close=page.locator('label.phoneTrackSheetClose');
            if(await close.isVisible()) await close.click();
          });
          for(const [route,button,primary] of [['legacy','#legacyButton','.backButton'],['careerStatistics','#careerStatisticsButton','#trophyRoomButton'],['trophyRoom','#homeTrophyRoomButton','.backButton'],['ruleBook','#ruleBookButton','.backButton']]) {
            await home(page);
            await attempt(page,size,route,'#'+route,primary,touch,async()=>{
              await page.locator(button).click({timeout:4000});
              if(['careerStatistics','trophyRoom'].includes(route)) await page.waitForFunction(route=>document.documentElement.dataset.v10Screen===route,route,{timeout:8000});
            });
            if(route==='careerStatistics') for(const tab of ['careerPhoneCompare','careerPhoneLeaders']) {
              const label=page.locator(`label[for="${tab}"]`);
              if(await label.isVisible()) await attempt(page,size,route+'-'+tab,'#'+route,primary,touch,()=>label.click());
            }
            if(route==='trophyRoom') {
              const categories=await page.locator('#trophyRoom button[data-category]:not(:disabled)').count();
              // When data is unavailable the category controls may not be mounted.
              for(let i=1;i<categories;i++) await attempt(page,size,`trophyRoom-category-${i}`,'#trophyRoom',primary,touch,()=>page.locator('#trophyRoom button[data-category]:not(:disabled)').nth(i).click());
            }
          }
          await home(page);
          await attempt(page,size,'settings','#settingsOverlay','#settingsClose',touch,()=>page.locator('#settingsButton').click());
          await home(page);
          await attempt(page,size,'connect-players','#connectPlayersScreen','#connectPlayersSetup',touch,async()=>{await installIdentity(page);await page.locator('#newShowdown').click();});
          for(const tab of ['connectPlayersDanielTab','connectPlayersNikTab','connectPlayersConnectionTab']) {
            const label=page.locator(`label:has(#${tab})`);
            if(await label.isVisible()) await attempt(page,size,tab,'#connectPlayersScreen',tab==='connectPlayersDanielTab'?'#connectPlayersSetup':null,touch,()=>label.click());
          }
          await attempt(page,size,'choose-seasons','#createShowdown','#startShowdown',touch,async()=>{
            const label=page.locator('label:has(#connectPlayersDanielTab)');
            if(await label.isVisible()) await label.click();
            await page.locator('#connectPlayersSetup').click({timeout:4000});
          });
          await home(page);
          await context.setOffline(true);
          await attempt(page,size,'home-offline','#mainMenu','#newShowdown',touch);
          await context.setOffline(false);
          await home(page);
          await attempt(page,size,'loading-reexposed','#loadingScreen',null,touch,()=>page.evaluate(()=>{
            const loading=document.getElementById('loadingScreen');
            loading.hidden=false;loading.classList.remove('hidden','is-exiting');loading.style.opacity='1';loading.style.transform='none';
            for(const animation of document.getAnimations()) { const target=animation.effect?.target;if(target&&(target===loading||loading.contains(target)))try{animation.finish();}catch{} }
            document.getElementById('app').style.visibility='hidden';
          }));
        } catch(error) { failures.push({size,screen:mode,error:error.message}); }
        finally { await context.close(); }
        writeReport();
      }
    };
    for(let offset=0;offset<sizes.length;offset+=2) await Promise.all(sizes.slice(offset,offset+2).map(runSize));
  } finally { await browser.close();writeReport(); }
  process.stdout.write(`Measured ${records.length} states; ${failures.length} unreachable attempts. Report saved.\n`);
})().catch(error=>{console.error(error);process.exitCode=1;});
