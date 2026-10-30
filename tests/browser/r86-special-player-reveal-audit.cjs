"use strict";
// r86 Special Player reveal in the real app (Team V page in its frame): the loading screen holds until the page has drawn,
// the reveal plays, Continue hands back to Career Start, it is shown once, and a page that fails is skipped quickly.
// Desktop runs with the service worker (the frame navigation must get the Special Player page, never index.html).
// The page loads three.js r128 from cdnjs; CMS_THREE_JS=<path to three.min.js> serves a local copy instead.
// CMS_GALLERY_SHOTS=<dir> saves a desktop and a phone shot.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),http=require("node:http");
const {chromium}=require("playwright");
const ROOT=path.resolve(__dirname,"../..");
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json",".webmanifest":"application/manifest+json",".webp":"image/webp",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",".woff2":"font/woff2",".mp3":"audio/mpeg"};
const THREE_URL="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const RIVALRY="pair_"+"5c".repeat(32);

function serve(){
  const server=http.createServer((request,response)=>{
    const url=new URL(request.url,"http://x");let file=path.join(ROOT,decodeURIComponent(url.pathname));
    if(!file.startsWith(ROOT)){response.statusCode=403;response.end();return;}
    if(url.pathname==="/")file=path.join(ROOT,"index.html");
    fs.readFile(file,(error,body)=>{if(error){response.statusCode=404;response.end("missing");return;}response.setHeader("content-type",TYPES[path.extname(file).toLowerCase()]||"application/octet-stream");response.end(body);});
  });
  return new Promise(resolve=>server.listen(0,"127.0.0.1",()=>resolve(server)));
}
async function routeOutside(context,base,{failPage=false}={}){
  const three=process.env.CMS_THREE_JS?fs.readFileSync(process.env.CMS_THREE_JS):null;
  await context.route("**/*",route=>{
    const url=route.request().url();
    if(failPage&&url.includes("/visual-assets/v10_1/special-player/index.html"))return route.fulfill({status:404,body:"missing"});
    if(url===THREE_URL&&three)return route.fulfill({status:200,contentType:"text/javascript",body:three});
    if(url.startsWith(base)||url===THREE_URL)return route.continue();
    return route.abort();
  });
}
async function openApp(page,base,{worker}){
  await page.goto(base+"index.html",{waitUntil:"domcontentloaded"});
  if(worker){
    await page.waitForFunction(()=>navigator.serviceWorker&&navigator.serviceWorker.controller||false,null,{timeout:60000}).catch(async()=>{await page.reload({waitUntil:"domcontentloaded"});});
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:60000});
  }
  await page.waitForFunction(()=>{const el=document.getElementById("loadingScreen");return el&&el.hidden;},null,{timeout:30000});
  await page.evaluate(()=>window.loadRuntimeScript("special-player-reveal","js/specialPlayerReveal.js",()=>window.CareerModeSpecialPlayerReveal));
}
function start(page,rivalryId,role="playerOne"){
  return page.evaluate(([rivalryId,role])=>{
    const state={ready:true,rivalryId,managerRole:role,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6},setupUpdatedAtMs:Date.now()};
    window.__spStartedAt=performance.now();window.__spResult=undefined;
    window.__spRun=window.CareerModeSpecialPlayerReveal.runBeforeCareerStart({getState:()=>state,refresh:async()=>state}).then(handle=>{window.__spResult=handle?"stage":"none";window.__spHandle=handle;return window.__spResult;});
  },[rivalryId,role]);
}
// The loading screen comes back once the draw is known (an older Showdown shows none), with the stage hidden under it.
function loadingUp(page){
  return page.waitForFunction(()=>{const el=document.getElementById("loadingScreen"),stage=document.getElementById("specialPlayerStage");
    return el&&!el.hidden&&!el.classList.contains("is-exiting")&&getComputedStyle(el).opacity==="1"&&stage&&getComputedStyle(stage).visibility==="hidden"?document.getElementById("loadingText").textContent:false;},null,{timeout:8000,polling:"raf"}).then(h=>h.jsonValue(),async error=>{
    const seen=await page.evaluate(()=>{const el=document.getElementById("loadingScreen"),stage=document.getElementById("specialPlayerStage");return {result:window.__spResult,hidden:el.hidden,cls:el.className,opacity:getComputedStyle(el).opacity,stage:stage?getComputedStyle(stage).visibility:null,after:Math.round(performance.now()-window.__spStartedAt)};});
    throw new Error(`loading screen not up: ${JSON.stringify(seen)} (${error.message})`);});
}

(async()=>{
  const server=await serve(),base=`http://127.0.0.1:${server.address().port}/`;
  // The page is WebGL (three.js): Playwright's own Chromium with SwiftShader, not the Gate's single-process runtime.
  const browser=await chromium.launch({headless:true,...(process.env.CMS_CHROMIUM_PATH?{executablePath:process.env.CMS_CHROMIUM_PATH}:{}),args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
  const shots=process.env.CMS_GALLERY_SHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
  try{
    for(const [label,width,height,worker] of [["desktop",1366,768,true],["phone",393,852,false]]){
      const context=await browser.newContext({viewport:{width,height},isMobile:width<900,hasTouch:width<900,serviceWorkers:worker?"allow":"block"});
      await routeOutside(context,base);
      const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
      await openApp(page,base,{worker});
      await start(page,RIVALRY);
      assert.equal(await loadingUp(page),"PREPARING YOUR SPECIAL PLAYERS",`${label}: the loading screen comes back over a hidden stage`);
      await page.waitForFunction(()=>getComputedStyle(document.getElementById("specialPlayerStage")||document.body).visibility==="visible"&&document.getElementById("specialPlayerStage"),null,{timeout:20000});
      const held=await page.evaluate(()=>performance.now()-window.__spStartedAt);
      assert.ok(held>=990,`${label}: loading held ${Math.round(held)} ms (Reus Gate minimum 1 s)`);
      const frame=page.frameLocator("#specialPlayerStage iframe");
      const frameUrl=await page.locator("#specialPlayerStage iframe").evaluate(el=>el.contentWindow.location.pathname+"|"+el.contentDocument.title);
      assert.equal(frameUrl,"/visual-assets/v10_1/special-player/index.html|Special Player Big Jump",`${label}: the frame got the Special Player page`);
      await page.waitForFunction(()=>document.getElementById("loadingScreen").hidden,null,{timeout:10000});
      const names=await page.evaluate(rivalry=>{const p=window.CareerModeMarqueePlayer.forShowdown(rivalry,Date.now());return [p.playerOne.name,p.playerTwo.name];},RIVALRY);
      await page.waitForTimeout(2500);
      if(shots)await page.screenshot({path:path.join(shots,`special-player-${label}-reveal.png`)});
      // Software WebGL here draws a few frames a second, so the walkout runs slow: tap the pitch to skip each reveal, as a
      // player may. Continue opens once both players are out.
      for(const end=Date.now()+120000;await frame.locator("#cta[disabled]").count()&&Date.now()<end;){
        await page.locator("#specialPlayerStage iframe").evaluate(el=>el.contentDocument.getElementById("stage").click());await page.waitForTimeout(1500);
      }
      await frame.locator("#cta:not([disabled])").waitFor({timeout:5000});
      await page.waitForTimeout(1200);
      const ctaHit=await page.locator("#specialPlayerStage iframe").evaluate(el=>{const d=el.contentDocument,c=d.getElementById("cta"),r=c.getBoundingClientRect();const hit=d.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {inside:r.top>=0&&r.bottom<=el.clientHeight&&r.left>=0&&r.right<=el.clientWidth,hit:Boolean(hit&&(hit===c||c.contains(hit)))};});
      assert.deepEqual(ctaHit,{inside:true,hit:true},`${label}: Continue is on screen and not covered`);
      if(shots)await page.screenshot({path:path.join(shots,`special-player-${label}-done.png`)});
      const shown=await page.locator("#specialPlayerStage iframe").evaluate(el=>el.contentDocument.body.innerText);
      for(const name of names)assert.ok(shown.includes(name.toUpperCase())||shown.includes(name),`${label}: ${name} named on the page`);
      assert.equal(await page.evaluate(()=>window.__spResult),undefined,"the reveal waits for Continue");
      await frame.locator("#cta").click();
      assert.equal(await page.evaluate(()=>window.__spRun),"stage");
      assert.equal(await frame.locator("#cta").textContent(),"Opening Career Start…");
      assert.equal(await page.locator("#specialPlayerStage").count(),1,"the stage stays until Career Start is up");
      await page.evaluate(()=>window.__spHandle.close());
      assert.equal(await page.locator("#specialPlayerStage").count(),0);
      const seen=await page.evaluate(()=>JSON.parse(localStorage.getItem("careerModeShowdown.specialPlayerSeen.v1")));
      assert.deepEqual(seen,[`${RIVALRY}|playerOne`]);
      await start(page,RIVALRY);
      assert.equal(await page.evaluate(()=>window.__spRun),"none","shown once per manager per Showdown");
      assert.equal(await page.evaluate(()=>document.getElementById("loadingScreen").hidden),true,"a second open shows no loading screen");
      assert.deepEqual(errors,[],`${label}: no page errors`);
      console.log(`ok ${label} ${width}x${height}: loading held ${Math.round(held)} ms, ${names.join(" / ")}, Continue hands back, shown once${worker?", service worker served the frame":""}`);
      await context.close();
    }
    {
      const context=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:"block"});
      await routeOutside(context,base,{failPage:true});
      const page=await context.newPage();await openApp(page,base,{worker:false});
      const t0=Date.now();await start(page,RIVALRY);await loadingUp(page);
      assert.equal(await page.evaluate(()=>window.__spRun),"none");
      const took=Date.now()-t0;assert.ok(took<5000,`a missing page is skipped in ${took} ms`);
      await page.waitForFunction(()=>document.getElementById("loadingScreen").hidden,null,{timeout:2000});
      assert.equal(await page.locator("#specialPlayerStage").count(),0);
      // r86 (red team #1): a skipped reveal is kept as seen, so a reload in season 1 never runs it again over the live game.
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem("careerModeShowdown.specialPlayerSeen.v1"))),[`${RIVALRY}|playerOne`],"a skipped reveal is kept as seen");
      console.log(`ok failure: a page that does not load is skipped in ${took} ms, loading screen gone, kept as seen`);
      await context.close();
    }
    {
      // Codex P2 on #1035: the page failing AFTER it said ready (the animation, before Continue) removes the stage and hands
      // back to Career Start instead of leaving the manager on a broken reveal.
      const context=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:"block"});
      await routeOutside(context,base);
      const page=await context.newPage();await openApp(page,base,{worker:false});
      await start(page,RIVALRY);await loadingUp(page);
      await page.waitForFunction(()=>{const s=document.getElementById("specialPlayerStage");return s&&getComputedStyle(s).visibility==="visible";},null,{timeout:20000});
      const inner=page.frames().find(f=>f.url().includes("/special-player/index.html"));
      await inner.evaluate(()=>parent.postMessage({type:"cms-sp-error",message:"test"},location.origin));
      assert.equal(await page.evaluate(()=>Promise.race([window.__spRun,new Promise(resolve=>setTimeout(()=>resolve("stuck"),3000))])),"none","an error after ready ends the reveal");
      assert.equal(await page.locator("#specialPlayerStage").count(),0,"the broken stage is removed");
      assert.equal(await page.evaluate(()=>document.getElementById("loadingScreen").hidden),true);
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem("careerModeShowdown.specialPlayerSeen.v1"))),[`${RIVALRY}|playerOne`],"seen from the moment it was shown");
      console.log("ok late failure: an error after ready removes the stage at once and hands back, kept as seen");
      await context.close();
    }
    console.log("PASS r86 Special Player reveal audit");
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exit(1);});
