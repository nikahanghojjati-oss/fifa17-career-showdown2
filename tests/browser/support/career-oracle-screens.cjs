"use strict";
// r87 W3-3 career-screen number oracle: opens the real app against the emulators in a FRESH browser (empty storage, so every
// figure comes from Firebase), signs in as Daniel or Nik, opens every career screen the way a player does and reads every figure
// off the screen. Screen reading follows tests/browser/ce2pg-journey.cjs (same buttons, same text), extended for Europa League,
// Golden Showdown, every History card and History & Backup. Emulator only (the emulator switch is localhost + cmsEmulator=1).
const path=require("node:path");
const gazette=require("./touchline-gazette.cjs");
const {installMarbleConfirmAnswers}=require("./marble-confirm.cjs");

const ROOT=path.resolve(__dirname,"../../..");
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const FORBIDDEN_HOSTS=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck|content-firebaseappcheck)\.googleapis\.com$/;
const norm=s=>String(s||"").replace(/\s+/g," ").trim();
const LOADING_TEXT=/Loading (career history|your showdown history|standings|rivalry statistics)|LOADING CAREER HISTORY|Loading career history|Loading your career/i;

async function openFresh(browser,{base,ports,account,viewport,label}){
  const context=await browser.newContext({viewport});
  const log={pageErrors:[],consoleErrors:[],forbidden:[]};
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{
    const name=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];
    return route.fulfill({path:path.join(SDK_DIR,name),contentType:"text/javascript; charset=utf-8"});
  });
  await context.addInitScript({path:SWITCH});
  const page=await context.newPage();
  page.on("pageerror",e=>log.pageErrors.push(e.message.slice(0,300)));
  page.on("console",msg=>{if(msg.type()==="error"&&!/Failed to load resource/.test(msg.text()))log.consoleErrors.push(msg.text().slice(0,300));});
  page.on("request",r=>{try{if(FORBIDDEN_HOSTS.test(new URL(r.url()).hostname))log.forbidden.push(new URL(r.url()).hostname);}catch(_e){}});
  page.on("dialog",d=>{void d.accept().catch(()=>{});});
  await installMarbleConfirmAnswers(page,{answer:false});
  await page.goto(`${base}?cmsEmulator=1&cmsEmulatorUser=${account}&cmsAuthPort=${ports.auth}&cmsFirestorePort=${ports.firestore}`,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  return {page,context,log,account,label,viewport};
}

async function backToShowdownHome(m){
  const deadline=Date.now()+20000;
  while(Date.now()<deadline){
    if(await m.page.locator("#mainMenu").isVisible().catch(()=>false))return true;
    if(await gazette.tapGazetteIfShown(m.page)){await m.page.waitForTimeout(500);continue;}
    if(await m.page.locator("#settingsOverlay").isVisible().catch(()=>false)){await m.page.locator(".settingsFooter .menuButton").click().catch(()=>{});await m.page.waitForTimeout(400);continue;}
    for(const label of [/^\s*(SHOWDOWN HOME|BACK TO HOME|BACK TO MAIN MENU|BACK TO SHOWDOWN HOME)\s*$/i,/^\s*HOME\s*$/i,/^\s*BACK\s*$/i]){
      const back=m.page.locator("button:visible").filter({hasText:label}).first();
      if(await back.count()){await back.click({timeout:5000}).catch(()=>{});break;}
    }
    await m.page.waitForTimeout(500);
  }
  return false;
}

// Same Google account in a fresh browser (as CE2PG's end.fresh check).
async function signInFresh(m,name){
  await m.page.locator("#newShowdown").click();
  await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
  const choose=m.page.getByRole("button",{name:new RegExp(`^${name} · PLAYER`,"i")});
  const by=Date.now()+40000;
  while(await m.page.evaluate(()=>document.getElementById("onlinePlayerIdentityBadge")?.textContent||"")!==name.toUpperCase()){
    if(Date.now()>by)throw new Error(`${m.label}: the fresh browser never named the player ${name}`);
    if(await choose.isVisible().catch(()=>false))await choose.click({timeout:3000}).catch(()=>{});
    await m.page.waitForTimeout(500);
  }
  await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
  await backToShowdownHome(m);
}

const hostText=(m,hostId)=>m.page.evaluate(id=>{const h=document.getElementById(id);if(!h||h.classList.contains("hidden"))return "";const hide=document.createElement("style");hide.textContent="[data-sp-chip]{display:none!important}";document.head.appendChild(hide);try{return (h.innerText||"").replace(/\s+/g," ").trim();}finally{hide.remove();}},hostId);
async function stableHostText(m,hostId,quietMs=1800,maxMs=40000){
  let text=await hostText(m,hostId),since=Date.now();const end=Date.now()+maxMs;
  while(Date.now()<end&&(Date.now()-since<quietMs||!text||LOADING_TEXT.test(text))){await m.page.waitForTimeout(300);const next=await hostText(m,hostId);if(next!==text){text=next;since=Date.now();}}
  return text;
}
async function clickTab(m,hostId,name){
  const re=new RegExp(`^\\s*${name.replace(/-/g,"[-‐-―]?")}\\s*$`,"i");
  let b=m.page.locator(`#${hostId} button:visible, #${hostId} [role=tab]:visible, #${hostId} label:visible`).filter({hasText:re}).first();
  if(!(await b.count()))b=m.page.locator(`#${hostId}`).getByText(re).first();
  if(!(await b.count()))return false;
  await b.click({timeout:5000}).catch(()=>{});
  await m.page.waitForTimeout(1000);
  return true;
}
const TABS={careerStatistics:["TABLE","COMPARE","LEADERS"],standings:["THIS SHOWDOWN","CAREER"],legacy:[],trophyRoom:[],statistics:["TOTALS","HEAD TO HEAD","SEASONS","TROPHIES"]};
async function openPage(m,hostId){
  await backToShowdownHome(m);
  const t0=Date.now();
  if(hostId==="standings"){await m.page.locator("button.sd-nav-tab[data-nav-key=standings]:visible").first().click({timeout:8000});}
  else if(hostId==="careerStatistics")await m.page.locator("#careerStatisticsButton").click({timeout:20000});
  else if(hostId==="legacy")await m.page.locator("#legacyButton").click({timeout:20000});
  else if(hostId==="trophyRoom"){await m.page.locator("#careerStatisticsButton").click({timeout:20000});await m.page.locator("#trophyRoomButton").click({timeout:20000});}
  else if(hostId==="statistics"){
    await m.page.locator("#careerStatisticsButton").click({timeout:20000});
    await m.page.waitForTimeout(1500);
    const rv=m.page.locator("#careerStatisticsRivalryButton");
    if(await rv.isVisible().catch(()=>false))await rv.click({timeout:8000});
    else await m.page.evaluate(()=>{try{window.openRivalryStatistics();}catch(e){}});
  }
  await m.page.locator(`#${hostId}`).waitFor({state:"visible",timeout:15000}).catch(()=>{});
  return t0;
}
async function capturePage(m,hostId,shot){
  const out={};
  const t0=await openPage(m,hostId);
  out.default=await stableHostText(m,hostId);
  out.ms=Date.now()-t0;
  for(const tab of TABS[hostId]||[]){if(await clickTab(m,hostId,tab))out[tab]=await stableHostText(m,hostId,1200,15000);}
  if(hostId==="trophyRoom"){
    out.dom=await m.page.evaluate(()=>{const h=document.getElementById("trophyRoom");if(!h)return "";const copy=h.cloneNode(true);copy.querySelectorAll("[data-sp-chip]").forEach(chip=>chip.remove());return (copy.textContent||"").replace(/\s+/g," ").trim();});
    // Phone: the ranking and the all-time records sit behind MORE (as CE2PG reads them).
    const more=m.page.locator("#trophyRoom label.trophyPhoneMoreButton");
    if(await more.isVisible().catch(()=>false)){await more.click({timeout:5000}).catch(()=>{});await m.page.waitForTimeout(1200);out.MORE=await hostText(m,"trophyRoom");if(shot)await shot("trophyRoom-more");await more.click({timeout:5000}).catch(()=>{});}
    out.cards=await m.page.evaluate(()=>[...document.querySelectorAll("#trophyRoom .trophyCard")].map(card=>({trophy:card.dataset.trophy||"",sides:Object.fromEntries([...card.querySelectorAll("[data-side]")].map(side=>[side.dataset.side,(side.querySelector("strong")?.dataset.countValue)||(side.querySelector("strong")?.textContent||"").trim()]))})));
  }
  if(hostId==="legacy"){
    // Every card, in DOM order, and which one is on show when History opens (desktop shows a page, a phone one card).
    // Desktop shows a page of cards (all geometrically visible ones count); a phone shows one card, the selected one
    // (.legacyVisibleCard; on desktop that class only marks the selection, not what is on show: Codex P2 on #1121).
    const phone=(m.viewport?.width||1366)<700;
    const readCards=()=>m.page.evaluate(phoneLayout=>{
      const shown=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);const grid=el.parentElement?.getBoundingClientRect();const inGrid=!grid||(r.left<grid.right-1&&r.right>grid.left+1);return r.width>0&&r.height>0&&s.visibility!=="hidden"&&s.display!=="none"&&inGrid;};
      return [...document.querySelectorAll("#legacy .legacyCard")].map(c=>({status:c.dataset.status||"",number:c.dataset.showdown||"",visible:phoneLayout?c.classList.contains("legacyVisibleCard"):shown(c),text:(c.textContent||"").replace(/\s+/g," ").trim()}));
    },phone);
    // What is on show when History opens; then every page (desktop pages of cards; a phone keeps every card in the DOM),
    // walking ‹ to the oldest and › to the newest with the player's own buttons, timed.
    const first=await readCards();
    out.onOpen=first.filter(c=>c.visible).map(c=>Number(c.number));
    const all=new Map(first.map(c=>[c.number,{...c,visible:out.onOpen.includes(Number(c.number))}]));
    const pager=dir=>m.page.locator(`#legacyPager [data-direction="${dir}"]`).first();
    const enabled=async dir=>(await pager(dir).count())&&await pager(dir).isEnabled().catch(()=>false)&&await pager(dir).isVisible().catch(()=>false);
    const navStart=Date.now();let steps=0;
    while(await enabled(-1)&&steps<2000){await pager(-1).click({timeout:5000}).catch(()=>{});steps++;}
    for(const c of await readCards())if(!all.has(c.number))all.set(c.number,{...c,visible:false});
    while(await enabled(1)&&steps<4000){await pager(1).click({timeout:5000}).catch(()=>{});steps++;for(const c of await readCards())if(!all.has(c.number))all.set(c.number,{...c,visible:false});}
    out.navigation={steps,ms:Date.now()-navStart};
    out.cards=[...all.values()].sort((a,b)=>Number(a.number)-Number(b.number));
    // Back to where it opened (the newest is the last page/card) for VIEW SEASON HISTORY below.
    const hist=m.page.locator("#legacy button").filter({hasText:/VIEW SEASON HISTORY/i}).first();
    if(await hist.count()&&await hist.isVisible().catch(()=>false)){
      // The Showdown VIEW SEASON HISTORY opens is the History controller's selection (the button sits outside the cards:
      // Codex P2 on #1121), else the selected card.
      const which=await m.page.evaluate(()=>{const n=window.LegacyFixture?.selectedShowdown;if(Number.isInteger(Number(n))&&n!==null)return String(n);return document.querySelector("#legacy .legacyCard[data-selected=true]")?.dataset.showdown||document.querySelector("#legacy .legacyVisibleCard")?.dataset.showdown||null;});
      await hist.click({timeout:10000}).catch(()=>{});await m.page.waitForTimeout(2500);
      out.seasonHistory=norm(await m.page.evaluate(()=>[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.innerText).join(" | ")));
      out.seasonHistoryFor=which;
      if(shot)await shot(`${hostId}-season-history`);
    }
  }
  if(shot)await shot(hostId);
  return out;
}
async function captureSettings(m,shot){
  await backToShowdownHome(m);
  if(await m.page.locator("#settingsButton").isVisible().catch(()=>false))await m.page.locator("#settingsButton").click({timeout:30000});
  else await m.page.locator("#onlinePlayerIdentityBadge").click({timeout:30000});
  await m.page.locator("#settingsOverlay").waitFor({state:"visible",timeout:15000});
  await m.page.waitForFunction(()=>![...document.querySelectorAll("#settingsOverlay .settingsInfoRow strong")].some(v=>/Loading/.test(v.textContent||"")),null,{timeout:30000}).catch(()=>{});
  const s=await m.page.evaluate(()=>{const rows={};for(const r of document.querySelectorAll("#settingsOverlay .settingsInfoRow")){const k=(r.querySelector("span")?.textContent||"").trim();const v=(r.querySelector("strong")?.textContent||"").trim();if(k)rows[k]=v;}return {rows};});
  if(shot)await shot("settings");
  // History & Backup (r87 B1): the online career's completed count and each manager's career points.
  const open=m.page.locator("#settingsOverlay button").filter({hasText:/OPEN HISTORY & BACKUP/i}).first();
  if(await open.isVisible().catch(()=>false)){
    await open.click({timeout:10000}).catch(()=>{});
    await m.page.waitForTimeout(1500);
    const until=Date.now()+30000;let text="";
    while(Date.now()<until){text=norm(await m.page.evaluate(()=>[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.innerText).join(" | ")));if(!/Loading/i.test(text))break;await m.page.waitForTimeout(500);}
    s.backup=text;
    if(shot)await shot("history-backup");
  }
  await backToShowdownHome(m);
  return s;
}
async function captureAll(m,shot){
  const raw={};
  raw.standingsFirst=await capturePage(m,"standings",null);
  for(const host of ["legacy","careerStatistics","trophyRoom","statistics","standings"])raw[host]=await capturePage(m,host,shot);
  raw.settings=await captureSettings(m,shot);
  return raw;
}

// ---- reading the figures (CE2PG's patterns, plus Europa League, Golden Showdown, every History card, History & Backup) ----
const corpus=(raw,host)=>Object.entries(raw?.[host]||{}).filter(([k,v])=>typeof v==="string"&&!["ms","via"].includes(k)).map(([,v])=>v).join(" ");
function extract(raw){
  const cs=corpus(raw,"careerStatistics"),tr=`${corpus(raw,"trophyRoom")} ${raw?.trophyRoom?.dom||""}`;
  const pair=(text,re)=>{const r=new RegExp(re.source,"i").exec(text);return r?[r[1],r[2]]:null;};
  const lead=(text,re)=>{const r=new RegExp(re.source,"i").exec(text);return r?[r[1].trim(),r[2]]:null;};
  const o={};
  o.summary=(/COMPLETED SHOWDOWNS\s+(\d+).*?SEASONS PLAYED D (\d+) \/ N (\d+) CAREER POINTS D (\d+) \/ N (\d+) TROPHIES WON D (\d+) \/ N (\d+)/i.exec(cs)||[]).slice(1);
  o.noRecord=/No completed record yet/i.test(cs);
  for(const u of ["daniel","nik"]){const row=new RegExp(`${u==="daniel"?"Daniel":"Nik"}\\s+(\\d+)\\s+(\\d+)-(\\d+)-(\\d+)\\s+(\\d+)\\s+(\\d+)`).exec(cs.slice(Math.max(0,cs.indexOf("CAREER TABLE"))));o[`table_${u}`]=row?row.slice(1):null;}
  o.compareTitles=pair(cs,/(\d+)\s+LEAGUE TITLES\s+(\d+)/);o.compareCups=pair(cs,/(\d+)\s+DOMESTIC CUPS\s+(\d+)/);o.compareCl=pair(cs,/(\d+)\s+CHAMPIONS LEAGUE WINS\s+(\d+)/);o.compareEl=pair(cs,/(\d+)\s+EUROPA LEAGUE WINS\s+(\d+)/);o.compareWins=pair(cs,/(\d+)\s+SEASON WINS\s+(\d+)/);
  o.compareAvgPoints=pair(cs,/([\d.]+)\s+AVERAGE LEAGUE POINTS\s+([\d.]+)/);o.compareAvgGoals=pair(cs,/([\d.]+)\s+AVERAGE LEAGUE GOALS\s+([\d.]+)/);
  o.leadWins=lead(cs,/MOST SEASON WINS\s+(Level · Daniel \+ Nik|Daniel|Nik)\s+(\d+)\s+wins?/);o.leadTrophies=lead(cs,/MOST TROPHIES\s+(Level · Daniel \+ Nik|Daniel|Nik)\s+(\d+)\s+troph/);
  o.leadPoints=lead(cs,/MOST CAREER POINTS\s+(Level · Daniel \+ Nik|Daniel|Nik)\s+(\d+)\s+pts/);o.leadBest=lead(cs,/BEST SEASON SCORE\s+(Level · Daniel \+ Nik|Daniel|Nik)\s+(\d+)\s+pts/);
  o.csGolden=/GOLDEN SHOWDOWN/i.test(cs);
  const standings=text=>{const s={};s.points=pair(text,/CAREER POINTS\s+(\d+)\s*:\s*(\d+)/);for(const [word,key] of [["Season Wins","W"],["Season Draws","D"],["Season Losses","L"],["Champions Leagues","cl"],["Europa Leagues","el"],["League Titles","league"],["Domestic Cups","cup"],["Total Trophies","trophies"]])s[key]=pair(text,new RegExp(`(\\d+)\\s+${word}\\s+(\\d+)`));return s;};
  o.standings=standings(raw?.standings?.CAREER||"");o.standingsFirst=standings(raw?.standingsFirst?.CAREER||"");
  o.standingsText=raw?.standings?.CAREER||"";o.standingsFirstText=raw?.standingsFirst?.CAREER||"";
  o.thisShowdownText=raw?.standings?.["THIS SHOWDOWN"]||"";
  const rv=corpus(raw,"statistics");
  o.rivalry={completed:pair(rv,/(\d+) \/ (\d+) SEASONS COMPLETED/),points:pair(rv,/(\d+)\s+\S\s+SHOWDOWN POINTS\s+(\d+)/),W:pair(rv,/(\d+)\s+\S\s+Season Wins\s+(\d+)/),trophies:pair(rv,/(\d+)\s+\S\s+Total Trophies\s+(\d+)/),cl:pair(rv,/(\d+)\s+\S\s+Champions Leagues\s+(\d+)/),league:pair(rv,/(\d+)\s+\S\s+League Titles\s+(\d+)/),cup:pair(rv,/(\d+)\s+\S\s+Domestic Cups\s+(\d+)/)};
  o.rivalryText=rv;
  o.rankDaniel=(/#(\d)\s*DANIEL\s+(\d+) CAREER POINTS · (\d+) SEASON WINS/i.exec(tr)||[]).slice(1);o.rankNik=(/#(\d)\s*NIK\s+(\d+) CAREER POINTS · (\d+) SEASON WINS/i.exec(tr)||[]).slice(1);
  const rec=re=>{const r=new RegExp(re.source,"i").exec(tr);return r?[r[1],r[2].toUpperCase()]:null;};
  o.recSeason=rec(/HIGHEST SEASON SCORE\s+(\d+)\s+(DANIEL|NIK|SHARED)/);o.recPoints=rec(/HIGHEST LEAGUE POINTS\s+(\d+)\s+(DANIEL|NIK|SHARED)/);o.recGoals=rec(/HIGHEST LEAGUE GOALS\s+(\d+)\s+(DANIEL|NIK|SHARED)/);o.recPerfect=rec(/MOST PERFECT SEASONS\s+(\d+)\s+(DANIEL|NIK|SHARED)/);o.recBiggest=rec(/BIGGEST SHOWDOWN WIN\s+(\d+)\s+(DANIEL|NIK|SHARED)/);
  const cards=Object.fromEntries((raw?.trophyRoom?.cards||[]).map(c=>[c.trophy,[c.sides.daniel??null,c.sides.nik??null]]));
  o.cabChampion=cards.showdown||null;o.cabLeague=cards.leagueTitles||null;o.cabCup=cards.domesticCups||null;o.cabCl=cards.championsLeague||null;o.cabEl=cards.europaLeague||null;o.cabGolden=cards.goldenShowdown||null;
  o.historyCards=(raw?.legacy?.cards||[]);
  o.seasonHistory=raw?.legacy?.seasonHistory||"";o.seasonHistoryFor=raw?.legacy?.seasonHistoryFor||null;
  o.settings=raw?.settings||null;
  o.backup=raw?.settings?.backup||"";
  o.backupFigures={completed:(/SHOWDOWNS COMPLETED(?: \(AT LEAST\))?\s+(\d+)/i.exec(o.backup)||[])[1]||null,daniel:(/DANIEL · CAREER POINTS\s+(\d+)/i.exec(o.backup)||[])[1]||null,nik:(/NIK · CAREER POINTS\s+(\d+)/i.exec(o.backup)||[])[1]||null};
  o.historyNav=raw?.legacy?.navigation||null;
  o.openMs=Object.fromEntries(["legacy","careerStatistics","trophyRoom","statistics","standings"].map(h=>[h,raw?.[h]?.ms??null]));
  return o;
}

module.exports={openFresh,signInFresh,backToShowdownHome,captureAll,extract,norm};
