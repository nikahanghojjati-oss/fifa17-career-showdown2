"use strict";

const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");

async function installMediaStub(page){
  await page.addInitScript(()=>{
    const states=new WeakMap();
    const stateFor=element=>{
      if(!states.has(element))states.set(element,{paused:true,ended:false});
      return states.get(element);
    };
    try{
      Object.defineProperty(HTMLMediaElement.prototype,"paused",{configurable:true,get(){return stateFor(this).paused;}});
      Object.defineProperty(HTMLMediaElement.prototype,"ended",{configurable:true,get(){return stateFor(this).ended;}});
    }catch(_error){}
    HTMLMediaElement.prototype.play=function(){
      const state=stateFor(this);state.paused=false;state.ended=false;
      queueMicrotask(()=>this.dispatchEvent(new Event("play")));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause=function(){
      const state=stateFor(this);
      if(state.paused)return;
      state.paused=true;
      queueMicrotask(()=>this.dispatchEvent(new Event("pause")));
    };
    HTMLMediaElement.prototype.load=function(){};
  });
}

async function runCase(browser,{name,viewport,isMobile=false}){
  const context=await browser.newContext({viewport,isMobile,hasTouch:isMobile,locale:"en-US"});
  const page=await context.newPage();
  const audiusRequests=[];
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.message));
  await installMediaStub(page);
  await page.route("https://api.audius.co/v1/**",async route=>{
    const url=route.request().url();
    audiusRequests.push(url);
    if(/\/tracks\/XNN7jYJ(?:\?|$)/.test(url)){
      await route.fulfill({
        status:200,
        contentType:"application/json",
        body:JSON.stringify({data:{id:"XNN7jYJ",title:"What You Got",user:{name:"Valentino Khan & NITTI"},artwork:null}})
      });
      return;
    }
    await route.abort();
  });

  try{
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.locator('[data-menu-media-source="audius"]').waitFor({state:"visible",timeout:8000});

    assert.equal(audiusRequests.length,0,`${name}: Audius network must remain dormant before selection/play.`);
    assert.equal(await page.locator('script[data-runtime-script="audius-player"]').count(),0,`${name}: Audius JS must not load eagerly.`);
    assert.equal(await page.locator('link[data-audius-player-style="true"]').count(),0,`${name}: Audius CSS must not load eagerly.`);
    assert.equal(await page.locator(".audiusMenuPlayer").count(),0,`${name}: Audius player must not mount on startup.`);

    await page.locator('[data-menu-media-source="audius"]').click();
    await page.locator(".audiusMenuPlayer").waitFor({state:"visible",timeout:8000});
    await page.waitForFunction(()=>document.querySelector('link[data-audius-player-style="true"]')?.sheet!==null,null,{timeout:8000});

    assert.equal(await page.locator('script[data-runtime-script="audius-player"]').count(),1,`${name}: exactly one lazy Audius runtime is allowed.`);
    assert.equal(await page.locator('link[data-audius-player-style="true"]').count(),1,`${name}: exactly one lazy Audius stylesheet is allowed.`);
    assert.equal(await page.locator("#menuMusicPlayer iframe").count(),0,`${name}: Audius must not use the YouTube iframe.`);
    assert.equal(await page.locator("#menuMusicPlayer audio.audiusAudioElement").count(),1,`${name}: Audius must own exactly one hidden audio element.`);
    assert.equal((await page.locator(".menuMusicSource").textContent()).trim(),"AUDIUS");
    assert.equal(await page.locator(".menuMusicTile").getAttribute("data-media-provider"),"audius");
    assert.equal((await page.locator("#menuMusicToggle").textContent()).trim(),"PLAY TRACK");
    assert.equal(await page.locator("#menuMusicMute").isDisabled(),false);
    assert.match((await page.locator("#menuMusicStatus").textContent()).trim(),/READY/);
    assert.equal(audiusRequests.length,0,`${name}: selecting Audius may mount UI but must not fetch metadata or stream before Play.`);

    await page.locator("#menuMusicToggle").click();
    await page.waitForFunction(()=>document.getElementById("menuMusicToggle")?.textContent?.trim()==="PAUSE TRACK",null,{timeout:5000});
    assert.match((await page.locator("#menuMusicStatus").textContent()).trim(),/^PLAYING/);
    await page.waitForFunction(()=>document.querySelector(".audiusTrackTitle")?.textContent==="What You Got",null,{timeout:5000});
    assert.ok(audiusRequests.some(url=>/\/tracks\/XNN7jYJ(?:\?|$)/.test(url)),`${name}: first Play must request Audius metadata lazily.`);

    await page.locator("#menuMusicMute").click();
    assert.equal((await page.locator("#menuMusicMute").textContent()).trim(),"UNMUTE");
    assert.equal((await page.locator("#menuMusicStatus").textContent()).trim(),"PLAYING · MUTED");

    await page.locator("#menuMusicToggle").click();
    await page.waitForFunction(()=>document.getElementById("menuMusicToggle")?.textContent?.trim()==="PLAY TRACK",null,{timeout:5000});
    assert.equal((await page.locator("#menuMusicStatus").textContent()).trim(),"PAUSED");

    const geometry=await page.evaluate(()=>{
      const play=document.getElementById("menuMusicToggle"),mute=document.getElementById("menuMusicMute"),tile=document.querySelector(".menuMusicTile");
      return {
        scrollWidth:document.documentElement.scrollWidth,
        clientWidth:document.documentElement.clientWidth,
        playHeight:play.getBoundingClientRect().height,
        muteHeight:mute.getBoundingClientRect().height,
        tileWidth:tile.getBoundingClientRect().width,
        viewportWidth:innerWidth
      };
    });
    assert.ok(geometry.scrollWidth<=geometry.clientWidth+1,`${name}: Audius Home causes horizontal document overflow.`);
    assert.ok(geometry.tileWidth<=geometry.viewportWidth+1,`${name}: Audius card exceeds the viewport.`);
    if(isMobile){
      assert.ok(geometry.playHeight>=43.5,`${name}: Audius Play target is below 44px.`);
      assert.ok(geometry.muteHeight>=43.5,`${name}: Audius Mute target is below 44px.`);
    }

    await page.locator('[data-menu-media-source="music"]').click();
    await page.waitForFunction(()=>!document.querySelector(".audiusMenuPlayer"),null,{timeout:5000});
    assert.equal(await page.locator("#menuMusicPlayer audio").count(),0,`${name}: switching source must destroy Audius audio ownership.`);
    assert.equal((await page.locator(".menuMusicSource").textContent()).trim(),"YOUTUBE");
    assert.equal(await page.locator("#menuMusicMute").isDisabled(),true,`${name}: unloaded YouTube source must restore disabled Mute.`);
    assert.equal(await page.locator("#menuMusicToggle").count(),1);
    assert.equal(await page.locator("#menuMusicMute").count(),1);
    assert.deepEqual(pageErrors,[],`${name}: Audius audit emitted page errors.`);
  }finally{
    await context.close();
  }
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  try{
    await runCase(browser,{name:"Chromebook",viewport:{width:1366,height:768}});
    await runCase(browser,{name:"iPhone-size",viewport:{width:390,height:844},isMobile:true});
    console.log("PASS R9 Audius Home player: Audius stays dormant until selected, mounts inside the one existing soundtrack card, uses existing Play/Mute controls, starts network only after Play, supports pause/mute/source teardown, and keeps 1366x768 plus 390x844 geometry within bounds.");
  }finally{
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
