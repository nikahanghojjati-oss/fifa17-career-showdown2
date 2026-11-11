"use strict";
// r91 Transfer War name autocomplete in the real game, loaded with NODE_OPTIONS (no edit to the harness):
//   CE2PG_AC_SHOTS_DIR=<dir> NODE_OPTIONS="--require ./tests/browser/support/ce2pg-autocomplete-shots.cjs" \
//     CE2PG_PLAN=single CE2PG_SEASONS=3 node tests/browser/ce2pg-journey.cjs
// Inert unless CE2PG_AC_SHOTS_DIR is set, and only in the CE2PG run inside the emulators.
// Before each manager's real LOCK MY SIGNINGS tap it uses the EMPTY signing row 2 (the harness only fills row 1):
//  1. types "paulinho" key by key, waits for the list, checks the three Paulinhos (free agent first), screenshots at a desktop,
//     the Chromebook window (1920x866), a non-fullscreen Chromebook window (1280x650) and two phones;
//  2. taps the BK Häcken row and reads what was filled: season 1 = name, POS, OVR, league, nationality; later seasons = name,
//     POS, nationality only (OVR and league stay as they were);
//  3. types a custom name and presses Enter: the text must stay exactly as typed, with no player id;
//  4. if the page's own refusal list (the one LOCK uses) has a name, types it and checks the row says "Can't be signed";
//  5. empties row 2 again, so the harness's own LOCK goes on unchanged.
// It also records every request for data/fifa17/ with the screen showing at that moment: the list must never load on Home.
// Lines start with "AC-SHOTS"; a line with PROBLEM is a failure.
const fs=require("node:fs");
const path=require("node:path");
const DIR=process.env.CE2PG_AC_SHOTS_DIR;
const isCe2pg=Boolean(DIR)&&Boolean(process.env.FIRESTORE_EMULATOR_HOST)&&/ce2pg-journey\.cjs$/.test(process.argv[1]||"");
if(isCe2pg)install();

function install(){
  fs.mkdirSync(DIR,{recursive:true});
  const results=[],shot=new Set();
  const log=line=>{console.log(`AC-SHOTS ${line}`);results.push(line);};
  const SIZES=[{width:1440,height:900},{width:1920,height:866},{width:1280,height:650},{width:390,height:844},{width:360,height:640}];
  // A resize rebuilds Team V's layout (the name box moves, so it loses focus and its list closes, as any re-layout does):
  // after each resize the box is focused again and, when a query is given, typed again.
  async function snap(page,name,input=null,query=""){
    if(shot.has(name))return;shot.add(name);
    const before=page.viewportSize();
    for(const size of SIZES){
      await page.setViewportSize(size);await page.waitForTimeout(1200);
      if(input&&query){await input.focus();await input.fill("");await input.pressSequentially(query,{delay:15});await page.waitForTimeout(400);}
      await page.locator(":focus").evaluate(n=>{const list=n.closest(".transferCombobox")?.querySelector(".transferComboboxList");(list||n).scrollIntoView({block:"center"});}).catch(()=>{});
      await page.waitForTimeout(150);
      const file=path.join(DIR,`${name}-${size.width}x${size.height}.png`);await page.screenshot({path:file});
      const cover=await page.evaluate(()=>{const list=document.querySelector(".transferComboboxList:not(.hidden)");if(!list)return "no list";const r=list.getBoundingClientRect();const hits=[...document.querySelectorAll("#transferChallenge img, #transferChallenge .face, #transferChallenge [class*='portrait'], #completeTransferChallenge")].filter(n=>{const b=n.getBoundingClientRect();if(b.width*b.height>0.5*innerWidth*innerHeight)return false;return b.width>0&&b.height>0&&getComputedStyle(n).visibility!=="hidden"&&!(b.right<=r.left||b.left>=r.right||b.bottom<=r.top||b.top>=r.bottom);}).map(n=>n.id||n.className||n.tagName);return hits.length?`covers ${JSON.stringify(hits.slice(0,4))}`:"covers nothing";});
      log(`screenshot ${file} (${cover})`);
      if(/^covers \[/.test(cover))log(`PROBLEM ${name} ${size.width}x${size.height}: the open list ${cover}`);
    }
    if(before)await page.setViewportSize(before);
    if(input&&query){await page.waitForTimeout(1200);await input.focus();await input.fill("");await input.pressSequentially(query,{delay:15});await page.waitForTimeout(400);}
  }
  // A real tap; if something lies over the row, say what, then tap through so the run can go on.
  async function tap(page,locator,tag){
    try{await locator.click({timeout:5000});}
    catch(error){log(`PROBLEM ${tag}: a real tap on the row failed: ${String(error.message).split("\n").filter(l=>/intercepts|not visible|outside/.test(l)).slice(0,1).join("")||String(error.message).split("\n")[0]}`);await locator.dispatchEvent("click");}
  }
  async function clearRow(page,prefix){
    await page.evaluate(p=>{const f=id=>document.getElementById(`${p}Signing2${id}`);const name=f("Name");name.value="";delete name.dataset.playerId;f("Overall").value="";f("Position").value="";
      window.setTransferSelectorValue(f("League"),"league","");window.setTransferSelectorValue(f("Nationality"),"nationality","");name.dispatchEvent(new Event("change",{bubbles:true}));
      if(typeof window.closeAllTransferSelectors==="function")window.closeAllTransferSelectors();},prefix);
  }
  async function demo(page){
    try{
      const state=await page.evaluate(()=>{const v=window.CareerModeProductionSharedTransferChallenge?.getState?.();return {role:v?.managerRole,season:v?.seasonNumber,phase:v?.state?.phase};});
      if(state.phase!=="SIGNING_ENTRY")return;
      const prefix=state.role==="playerTwo"?"p2":"p1",tag=`s${state.season}-${prefix}`,name=page.locator(`#${prefix}Signing2Name`);
      const kind=await name.getAttribute("data-selector-kind");if(kind!=="player"){log(`PROBLEM ${tag}: the name box is not a player search (kind ${kind})`);return;}
      await name.click();await name.fill("");await name.pressSequentially("paulinho",{delay:40});
      try{await page.waitForFunction(p=>document.querySelectorAll(`#${p}Signing2Name-listbox .transferComboboxPlayer`).length>0,prefix,{timeout:30000});}
      catch(error){
        const diag=await page.evaluate(p=>{const n=document.getElementById(`${p}Signing2Name`),l=document.getElementById(`${p}Signing2Name-listbox`);return {value:n&&n.value,active:document.activeElement&&document.activeElement.id,status:window.CareerModePlayerSearch?window.CareerModePlayerSearch.status():"no search code",lists:document.querySelectorAll(`[id="${p}Signing2Name-listbox"]`).length,list:l?l.outerHTML.slice(0,300):"none",wrapperList:(n&&n.parentElement.querySelector(".transferComboboxList")||{outerHTML:"none"}).outerHTML.slice(0,300),parent:n&&n.parentElement&&n.parentElement.className};},prefix);
        log(`PROBLEM ${tag}: no player rows: ${JSON.stringify(diag)}`);await clearRow(page,prefix);return;
      }
      const rows=await page.$$eval(`#${prefix}Signing2Name-listbox .transferComboboxPlayer`,nodes=>nodes.map(n=>n.innerText.replace(/\s+/g," ").trim()));
      log(`${tag}: "paulinho" lists ${JSON.stringify(rows)}`);
      if(!/Paulinho CM 81 · Free agent/.test(rows[0]||""))log(`PROBLEM ${tag}: the free agent Paulinho (81) is not first`);
      if(state.season===1&&prefix==="p1")await snap(page,"list-open",name,"paulinho");
      await tap(page,page.locator(`#${prefix}Signing2Name-listbox .transferComboboxPlayer`,{hasText:"BK Häcken"}),tag);
      const filled=await page.evaluate(p=>{const f=id=>document.getElementById(`${p}Signing2${id}`);return {name:f("Name").value,id:f("Name").dataset.playerId||"",pos:f("Position").value,ovr:f("Overall").value,league:f("League").dataset.canonicalId||"",nat:f("Nationality").dataset.canonicalId||""};},prefix);
      log(`${tag}: picked BK Häcken Paulinho -> ${JSON.stringify(filled)}`);
      const want=state.season===1?{name:"Paulinho",pos:"LW",ovr:"72",league:"sweden-allsvenskan",nat:"brazil"}:{name:"Paulinho",pos:"LW",ovr:"",league:"",nat:"brazil"};
      for(const [k,v] of Object.entries(want))if(filled[k]!==v)log(`PROBLEM ${tag}: ${k} is "${filled[k]}", expected "${v}"`);
      if(!/^\d+$/.test(filled.id))log(`PROBLEM ${tag}: the pick kept no SoFIFA id`);
      if(state.season===1&&prefix==="p1")await snap(page,"after-pick");
      await clearRow(page,prefix);
      await name.click();await name.pressSequentially("Paulinho Custom",{delay:20});await name.press("Enter");
      const custom=await page.evaluate(p=>{const n=document.getElementById(`${p}Signing2Name`);return {value:n.value,id:n.dataset.playerId||""};},prefix);
      log(`${tag}: typed "Paulinho Custom" + Enter -> ${JSON.stringify(custom)}`);
      if(custom.value!=="Paulinho Custom"||custom.id)log(`PROBLEM ${tag}: Enter changed a custom name`);
      if(state.season===1&&prefix==="p1")await snap(page,"custom-name",name,"Zzqx Nobody");
      const blocked=await page.evaluate(async()=>{try{return await window.CareerModeProductionSharedTransferChallenge.blockedSignings();}catch(error){return [];}});
      const target=blocked.find(entry=>entry&&entry.name);
      if(target){
        await clearRow(page,prefix);await name.click();await name.pressSequentially(target.name,{delay:20});
        await page.waitForFunction(p=>document.querySelectorAll(`#${p}Signing2Name-listbox .transferComboboxPlayer`).length>0,prefix,{timeout:15000}).catch(()=>{});
        const marked=await page.$$eval(`#${prefix}Signing2Name-listbox .transferComboboxPlayer`,nodes=>nodes.map(n=>({text:n.innerText.replace(/\s+/g," ").trim(),blocked:n.classList.contains("is-blocked")})));
        const hit=marked.find(r=>r.blocked);
        log(`${tag}: refusal list ${JSON.stringify(blocked)}; typed "${target.name}" -> ${JSON.stringify(marked.slice(0,3))}`);
        if(marked.length&&!hit)log(`PROBLEM ${tag}: ${target.reason} player ${target.name} is listed without "Can't be signed"`);
        if(hit){await snap(page,`blocked-${target.reason}`,name,target.name);await page.locator(`#${prefix}Signing2Name-listbox .transferComboboxPlayer.is-blocked`).first().click({force:true,timeout:5000});
          const notice=await page.locator(`#${prefix}Signing2Name-listbox .transferComboboxNotice`).innerText().catch(()=>"");const after=await name.inputValue();
          log(`${tag}: tapping him shows "${notice}"; the box still reads "${after}"`);
          if(!/can't|don't/i.test(notice))log(`PROBLEM ${tag}: no refusal words in the list`);
        }
      }
      await clearRow(page,prefix);
    }catch(error){log(`PROBLEM demo failed: ${error&&error.message||error}`);try{const p=await page.evaluate(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.managerRole==="playerTwo"?"p2":"p1");await clearRow(page,p);}catch(_e){}}
  }
  const wrapPage=page=>{
    if(page.__acShots)return page;page.__acShots=true;
    page.on("request",request=>{if(!/\/data\/fifa17\//.test(request.url()))return;page.evaluate(()=>[...document.querySelectorAll("section.screen:not(.hidden), .screen.active")].map(n=>n.id).join(",")||document.querySelector("#transferChallenge:not(.hidden)")?.id||"?").then(screen=>{log(`list request ${request.url().replace(/^.*?\/data\//,"data/")} while showing [${screen}]`);if(/home/i.test(screen)&&!/transferChallenge/.test(screen))log("PROBLEM the list loaded on Home");}).catch(()=>{});});
    const getByRole=page.getByRole.bind(page);
    page.getByRole=(role,options)=>{
      const locator=getByRole(role,options),name=options&&options.name;
      if(role!=="button"||name!=="LOCK MY SIGNINGS")return locator;
      return new Proxy(locator,{get(target,prop){
        if(prop==="click")return async(...args)=>{await demo(page);return target.click(...args);};
        const value=target[prop];return typeof value==="function"?value.bind(target):value;
      }});
    };
    return page;
  };
  const pw=require("playwright");
  const launch=pw.chromium.launch.bind(pw.chromium);
  pw.chromium.launch=async(...args)=>{
    const browser=await launch(...args);
    const newContext=browser.newContext.bind(browser);
    browser.newContext=async(...cargs)=>{const ctx=await newContext(...cargs);const newPage=ctx.newPage.bind(ctx);ctx.newPage=async(...p)=>wrapPage(await newPage(...p));return ctx;};
    return browser;
  };
  process.on("exit",()=>{try{fs.writeFileSync(path.join(DIR,"ac-shots.log"),results.join("\n")+"\n");}catch(_e){}});
}
