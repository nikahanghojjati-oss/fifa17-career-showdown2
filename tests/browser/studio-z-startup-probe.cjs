"use strict";
// Studio Z probe (diagnostic, not a product test): cold-start identity race, Settings surface, and the one-strike offline flag.
const fs=require("node:fs"),path=require("node:path"),{spawn}=require("node:child_process");
const {chromium}=require("playwright");const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
const ROOT=path.resolve(__dirname,"../..");const APP_PORT=Number(process.env.CMS_TEST_PORT||4173);
const OUT=process.env.ZOUT||"/tmp/claude-0/sz/startup";fs.mkdirSync(OUT,{recursive:true});
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js"),SDK_DIR=path.join(ROOT,"node_modules/firebase");
const url=user=>`http://127.0.0.1:${APP_PORT}/?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=9199&cmsFirestorePort=8181`;
async function ctx(browser,viewport,{delayLoader=0,failProbe=false,blockIdentity=false}={}){
  const context=await browser.newContext({viewport,serviceWorkers:"allow"});
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,r=>r.fulfill({path:path.join(SDK_DIR,r.request().url().match(/(firebase-[a-z-]+\.js)$/)[1]),contentType:"text/javascript"}));
  if(delayLoader)await context.route(/js\/optionalModules\.js/,async r=>{await new Promise(x=>setTimeout(x,delayLoader));await r.continue();});
  if(blockIdentity)await context.route(/js\/onlinePlayerIdentity\.js/,r=>r.abort());
  if(failProbe)await context.route(/network-probe=/,r=>r.abort());
  await context.addInitScript({path:SWITCH});
  const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
  return {context,page,errors};
}
const state=page=>page.evaluate(()=>({identityApi:Boolean(window.CareerModeOnlinePlayerIdentity),identity:window.CareerModeOnlinePlayerIdentity?.getState?.()?.status||null,badge:document.getElementById("onlinePlayerIdentityBadge")?.textContent||null,offline:window.getOfflineAppDiagnostics?.()?.connectivity||null,verified:window.getOfflineAppDiagnostics?.()?.connectivityVerified??null,screens:[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id).join(","),overlay:document.getElementById("onlinePlayerIdentityOverlay")?.innerText?.replace(/\s+/g," ").slice(0,200)||null}));
async function openSettings(page,name){await page.locator("#settingsButton").click();await page.waitForTimeout(1500);await page.screenshot({path:path.join(OUT,name)});const text=await page.evaluate(()=>{const p=[...document.querySelectorAll("#settingsContent .settingsPanel, #settingsContent section")].filter(e=>e.offsetParent!==null).map(e=>(e.querySelector("h3,h2,strong")?.textContent||e.id||"").trim());return p;});await page.keyboard.press("Escape").catch(()=>{});await page.locator("#settingsClose").click().catch(()=>{});return text;}
(async()=>{
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});
  await new Promise(r=>setTimeout(r,800));
  const rt=await resolveChromiumRuntime();const browser=await chromium.launch({executablePath:rt.executablePath,headless:true,args:rt.args});
  const result={};
  try{
    if(process.env.ZBLOCK){const m=await ctx(browser,{width:1920,height:910},{blockIdentity:true});await m.page.goto(url("daniel"),{waitUntil:"domcontentloaded"});await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});await m.page.waitForTimeout(9000);result.blocked={settingsPanels:await openSettings(m.page,"blocked-identity-settings.png")};await m.context.close();console.log(JSON.stringify(result));return;}
    for(const [label,vp] of [["chromebook",{width:1920,height:910}],["phone",{width:393,height:660}]]){
      for(const delay of [0,1500]){
        console.error("ctx",label,delay);const m=await ctx(browser,vp,{delayLoader:delay});console.error("ctx ok");
        await m.page.goto(url("daniel"),{waitUntil:"domcontentloaded"});
        await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
        await m.page.waitForTimeout(4000);
        const key=`${label}-delay${delay}`;console.error("step",key);
        result[key]={home:await state(m.page)};
        await m.page.screenshot({path:path.join(OUT,`${key}-home.png`)});
        result[key].settingsPanels=await openSettings(m.page,`${key}-settings.png`);
        result[key].afterSettings=await state(m.page);
        result[key].errors=m.errors;
        await m.context.close();
      }
    }
    const m=await ctx(browser,{width:393,height:660},{failProbe:true});
    await m.page.goto(url("daniel"),{waitUntil:"domcontentloaded"});
    await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
    await m.page.waitForTimeout(8000);
    result.failProbe={first:await state(m.page)};
    await m.page.context().unroute(/network-probe=/);
    await m.page.waitForTimeout(20000);
    result.failProbe.after20sNetworkBack=await state(m.page);
    await m.page.locator("#newShowdown").click().catch(()=>{});await m.page.waitForTimeout(1500);
    result.failProbe.afterTap=await state(m.page);
    await m.page.screenshot({path:path.join(OUT,`failprobe-tap.png`)});
  }finally{await browser.close();server.kill();}
  console.log(JSON.stringify(result,null,1));
})().catch(e=>{console.error(e);process.exit(1);});
