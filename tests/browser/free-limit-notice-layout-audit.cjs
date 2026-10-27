"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
process.env.CMS_CHROMIUM_MULTI_CONTEXT="1";
const base=process.env.CMS_BASE_URL||"http://127.0.0.1:4511/";
const out=path.resolve(process.env.CMS_TEST_RESULTS||"test-results/free-limit-layout");
const sizes=[[360,640],[375,553],[390,844],[393,852],[430,932],[740,360],[844,390],[768,1024],[1280,800],[1920,1080]];
const TEXT="Today's free online limit is used up. It resets at 3 am Boston time. Your saved career is safe.";
fs.mkdirSync(out,{recursive:true});

async function inspect(page,screen){
  return page.evaluate(screen=>{
    const notice=document.getElementById("appRuntimeNotice"),errors=[],hits=[];
    const shown=e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&e.getBoundingClientRect().width>1&&e.getBoundingClientRect().height>1;
    const rect=e=>e.getBoundingClientRect(),inViewport=r=>r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight;
    const n=notice&&shown(notice)?rect(notice):null;
    if(screen==="connect"&&n&&inViewport(n))errors.push("Home notice remains painted on Connect Players");
    const scope=screen==="home"?"#mainMenu":"#connectPlayersScreen";
    const controls=[...document.querySelectorAll(`${scope} button,${scope} input,${scope} select,${scope} a[href],${scope} label[for],.sd-nav button,#onlinePlayerIdentityBadge`)];
    for(const e of controls){
      if(!shown(e)||notice?.contains(e))continue;
      const r=rect(e);if(!inViewport(r))continue;
      const id=e.id||e.textContent.trim()||e.className;
      if(n&&n.left<r.right&&n.right>r.left&&n.top<r.bottom&&n.bottom>r.top)errors.push(`notice overlaps ${id}`);
      const x=r.left+r.width/2,y=r.top+r.height/2;
      if(x<0||x>=innerWidth||y<0||y>=innerHeight)continue;
      // The native soundtrack checkbox is intentionally behind its visible TRACKS label.
      if(e.matches(".phoneSheetToggle")||e.closest("[inert]"))continue;
      const hit=document.elementFromPoint(x,y);
      if(screen==="connect"&&!e.closest("#connectPlayersScreen")&&hit?.closest("#connectPlayersScreen"))continue;
      if(screen==="home"&&["homeTrophyRoomButton","ruleBookButton","settingsButton"].includes(e.id)){
        // Include decorative layers: pointer-events:none can still paint over a usable button.
        const decorative=[...document.querySelectorAll("#mainMenu *")].filter(layer=>{
          const r=rect(layer);return shown(layer)&&getComputedStyle(layer).pointerEvents==="none"&&x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom;
        }).map(layer=>({layer,style:layer.getAttribute("style")}));
        let stack;
        try{
          for(const {layer} of decorative)layer.style.setProperty("pointer-events","auto","important");
          stack=document.elementsFromPoint(x,y);
        }finally{
          for(const {layer,style} of decorative)if(style===null)layer.removeAttribute("style");else layer.setAttribute("style",style);
        }
        const target=stack.findIndex(layer=>layer===e||e.contains(layer));
        const painted=layer=>{
          const style=getComputedStyle(layer);
          if(!shown(layer)||Number(style.opacity)===0)return false;
          return style.backgroundImage!=="none"||(style.backgroundColor!=="transparent"&&!/[ ,/]0\)$/.test(style.backgroundColor))||style.boxShadow!=="none"||["IMG","SVG","CANVAS","VIDEO"].includes(layer.tagName)||[...layer.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
        };
        const above=(target<0?stack:stack.slice(0,target)).filter(layer=>!layer.contains(e)&&painted(layer));
        hits.push({id,stack:stack.map(layer=>layer.id||layer.className||layer.tagName)});
        if(target<0||above.length)errors.push(`${id} centre covered by ${above.map(layer=>layer.id||layer.className||layer.tagName).join(", ")||"missing button"}`);
      }
      if(e.closest(".menuMusicTile,.sd-nav")){
        hits.push(id);
        if(hit!==e&&!e.contains(hit)&&!(e.matches("label[for]")&&hit?.id===e.htmlFor))errors.push(`${id} centre hits ${hit?.id||hit?.className||hit?.tagName}`);
      }
    }
    return {errors,hits,notice:n?.toJSON()||null,documentScroll:document.scrollingElement.scrollTop};
  },screen);
}

(async()=>{
  const browser=await chromium.launch({...await resolveChromiumRuntime(),headless:true});
  const report=[];
  try{
    for(const [width,height] of sizes){
      const context=await browser.newContext({viewport:{width,height},reducedMotion:"reduce",serviceWorkers:"block"});
      // No production Firebase or soundtrack request is needed for this local layout audit.
      await context.route("**/*",route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
      const page=await context.newPage();
      await page.goto(base,{waitUntil:"domcontentloaded"});
      await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:20000});
      // r85: desktop Home moved its music strip into the top-bar dock (inside .sd-nav, so inspect() still checks it); the
      // strip stays in the page but hidden there, so only its presence is awaited.
      await page.locator("#mainMenu.v10Home #menuMusicToggle").waitFor({state:"attached"});
      await page.waitForFunction(()=>window.CareerModeProductionSharedJourneyEntry);
      await page.evaluate(async()=>{
        await CareerModeHomeScreensV10.install();await document.fonts.ready;
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      });
      const unchanged=await page.evaluate(text=>{
        const controls=()=>[...document.querySelectorAll("#mainMenu button,.sd-nav button,#onlinePlayerIdentityBadge")].filter(e=>!e.closest("#appRuntimeNotice")).map(e=>({id:e.id||e.textContent.trim(),box:e.getBoundingClientRect().toJSON()}));
        const look=e=>Object.fromEntries(["color","backgroundColor","borderLeftColor","borderLeftWidth","fontFamily","fontSize","fontWeight","lineHeight","paddingTop","paddingRight","paddingBottom","paddingLeft"].map(key=>[key,getComputedStyle(e)[key]]));
        const layout=()=>({rows:getComputedStyle(document.getElementById("mainMenu")).gridTemplateRows,children:[...document.querySelector("#mainMenu").children].filter(e=>e.id!=="appRuntimeNotice").map(e=>({id:e.id||e.className,box:e.getBoundingClientRect().toJSON()}))});
        window.__layoutLook=look;window.__layoutControls=controls;window.__homeLayout=layout;
        showAppNotice(text,"error",0);
        const notice=document.getElementById("appRuntimeNotice"),style=look(notice);notice.remove();
        return {controls:controls(),style,layout:layout()};
      },TEXT);
      await page.evaluate(async()=>{
        if(!window.CareerModeFirestoreBudget)await loadRuntimeScript("layout-budget","js/sparkPrivatePairing.js",()=>Boolean(window.CareerModeFirestoreBudget));
        const services=CareerModeFirestoreBudget.services({ok:true,auth:{currentUser:{uid:"layout-audit"}},firestore:{},firestoreSdk:{async runTransaction(){throw Object.assign(new Error("Quota exceeded."),{code:"resource-exhausted"});}}});
        try{await services.firestoreSdk.runTransaction(services.firestore,async tx=>tx.get({path:"accounts/layout-audit"}));}catch(error){if(error.code!=="resource-exhausted")throw error;}
      });
      await page.waitForFunction(text=>document.querySelector("#appRuntimeNotice .runtimeNoticeText")?.textContent===text,TEXT);
      await page.evaluate(()=>document.fonts.ready);
      const home=await inspect(page,"home");
      const unchangedAfter=await page.evaluate(()=>({controls:__layoutControls(),style:__layoutLook(document.getElementById("appRuntimeNotice")),layout:__homeLayout()}));
      home.layoutBefore=unchanged.layout;home.layoutAfter=unchangedAfter.layout;
      try{assert.deepEqual(unchangedAfter.layout,unchanged.layout,"quota notice must preserve Home grid rows and every existing direct child rectangle");}
      catch(error){home.errors.push(error.message.split("\n")[0]);console.log(`LAYOUT CHANGES ${width}x${height} rows ${unchanged.layout.rows} -> ${unchangedAfter.layout.rows}`);}
      if(JSON.stringify(unchanged.controls)!==JSON.stringify(unchangedAfter.controls)){
        home.errors.push("quota notice moved existing controls");
        home.changedControls=unchanged.controls.map((before,i)=>({before,after:unchangedAfter.controls[i]})).filter(pair=>JSON.stringify(pair.before)!==JSON.stringify(pair.after));
        console.log("CONTROL CHANGES "+width+"x"+height+" "+JSON.stringify(home.changedControls));
      }
      if(JSON.stringify(unchanged.style)!==JSON.stringify(unchangedAfter.style))home.errors.push("quota notice changed its existing colours, font or padding");
      await page.screenshot({path:path.join(out,`home-free-limit-${width}x${height}.png`)});
      // Check the notice and controls again when reached through the app's only scroller.
      await page.locator("#appRuntimeNotice").scrollIntoViewIfNeeded();
      const reached=await inspect(page,"home");
      if(!reached.notice||reached.notice.top<0||reached.notice.bottom>height)home.errors.push("Home notice is not fully reachable");
      home.errors.push(...reached.errors);
      for(const id of ["menuMusicToggle","menuMusicMute"]){
        if(!await page.locator(`#${id}`).isVisible())continue;
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        home.errors.push(...(await inspect(page,"home")).errors);
      }
      await page.evaluate(async()=>{
        if(!window.CareerModeConnectPlayersScreenV10)await loadRuntimeScript("layout-connect","js/connectPlayersScreenV10.js",()=>Boolean(window.CareerModeConnectPlayersScreenV10));
        await CareerModeConnectPlayersScreenV10.open({sync:false});
      });
      await page.locator("#connectPlayersScreen").waitFor({state:"visible"});
      const connect=await inspect(page,"connect");
      await page.screenshot({path:path.join(out,`connect-players-free-limit-${width}x${height}.png`)});
      await page.evaluate(()=>CareerModeConnectPlayersScreenV10.close());
      assert.equal(await page.locator("#appRuntimeNotice .runtimeNoticeText").textContent(),TEXT,"returning Home preserves the quota message");
      await page.evaluate(()=>openOptionalModule("ruleBook"));
      await page.waitForFunction(()=>getActiveScreenName()==="ruleBook");
      if(await page.evaluate(()=>document.querySelector("#appRuntimeNotice .runtimeNoticeText")?.textContent)===TEXT)home.errors.push("Home notice survives leaving Home");
      await page.evaluate(()=>navigateTo("mainMenu"));
      await page.waitForFunction(text=>document.querySelector("#appRuntimeNotice .runtimeNoticeText")?.textContent===text,TEXT);
      await page.evaluate(()=>CareerModeFirestoreBudget.reset());
      assert.equal(await page.locator("#appRuntimeNotice").count(),0,"resume clears the quota notice");
      // Quota-only placement must not reparent or remove an unrelated runtime error.
      await page.evaluate(()=>showAppNotice("Unrelated existing status","error",0));
      assert.equal(await page.locator("#appRuntimeNotice").evaluate(e=>e.parentElement.tagName),"BODY");
      await page.evaluate(()=>CareerModeFirestoreBudget.reset());
      assert.equal(await page.locator("#appRuntimeNotice .runtimeNoticeText").textContent(),"Unrelated existing status");
      report.push({width,height,home,connect});
      const errors=[...new Set([...home.errors,...connect.errors])];
      console.log(`${errors.length?"FAIL":"PASS"} ${width}x${height} Home + Connect Players${errors.length?": "+errors.join("; "):""}`);
      await context.close();
    }
    fs.writeFileSync(path.join(out,"audit.json"),JSON.stringify(report,null,2));
    assert.equal(report.filter(r=>r.home.errors.length||r.connect.errors.length).length,0,"all ten sizes must keep the notice clear of controls and hidden on Connect Players");
    console.log("PASS free-limit notice layout audit: 10 sizes, Home and Connect Players, unchanged grid rows and direct child rectangles, painted-layer control hit tests, reachable notice, return and resume.");
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
