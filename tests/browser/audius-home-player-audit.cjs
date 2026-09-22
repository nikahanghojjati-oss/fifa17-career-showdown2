"use strict";

const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const metadata={
  XNN7jYJ:{title:"What You Got",artist:"Valentino Khan & NITTI"},
  X9wlA0b:{title:"snow globe",artist:"Hadji Gaviota"}
};

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
      const state=stateFor(this);if(state.paused)return;state.paused=true;
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
    const match=url.match(/\/tracks\/([^/?]+)(?:\?|$)/);
    const id=match?.[1];
    if(id&&metadata[id]&&!/\/stream(?:\?|$)/.test(url)){
      await route.fulfill({
        status:200,contentType:"application/json",
        body:JSON.stringify({data:{id,title:metadata[id].title,user:{name:metadata[id].artist},artwork:null}})
      });
      return;
    }
    await route.abort();
  });

  try{
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.locator(".audiusMenuPlayer").waitFor({state:"visible",timeout:8000});
    await page.waitForFunction(()=>Boolean(document.querySelector('link[data-audius-player-style="true"]')?.sheet),null,{timeout:8000});

    assert.equal(audiusRequests.length,0,`${name}: mounting the main Audius player must not fetch metadata or stream before Play.`);
    assert.equal(await page.locator('script[data-runtime-script="audius-player"]').count(),1,`${name}: exactly one lazy Audius runtime is allowed.`);
    assert.equal(await page.locator('link[data-audius-player-style="true"]').count(),1,`${name}: exactly one lazy Audius stylesheet is allowed.`);
    assert.equal(await page.locator("#menuMusicPlayer iframe").count(),0,`${name}: Audius-only Home must contain no YouTube iframe.`);
    assert.equal(await page.locator("#menuMusicPlayer audio.audiusAudioElement").count(),1,`${name}: Audius must own exactly one audio element.`);
    assert.equal((await page.locator(".menuMusicSource").textContent()).trim(),"AUDIUS");
    assert.equal(await page.locator(".menuMusicTile").getAttribute("data-media-provider"),"audius");
    assert.equal((await page.locator("#menuMusicToggle").textContent()).trim(),"PLAY TRACK");
    assert.equal(await page.locator("#menuMusicMute").isDisabled(),false);
    assert.match((await page.locator("#menuMusicStatus").textContent()).trim(),/READY/);

    const choices=page.locator("[data-menu-media-source]");
    assert.equal(await choices.count(),4,`${name}: Audius-only soundtrack should expose four curated tracks.`);
    assert.deepEqual(await choices.evaluateAll(nodes=>nodes.map(n=>n.dataset.menuMediaSource)),["audius","snowglobe","nasty","alwaysright"]);
    assert.equal(await page.locator('[data-menu-media-source="audius"]').getAttribute("aria-pressed"),"true");

    await page.locator("#menuMusicToggle").click();
    await page.waitForFunction(()=>document.getElementById("menuMusicToggle")?.textContent?.trim()==="PAUSE TRACK",null,{timeout:5000});
    assert.match((await page.locator("#menuMusicStatus").textContent()).trim(),/^PLAYING/);
    await page.waitForFunction(()=>document.querySelector(".audiusTrackTitle")?.textContent==="What You Got",null,{timeout:5000});
    assert.ok(audiusRequests.some(url=>/\/tracks\/XNN7jYJ(?:\?|$)/.test(url)),`${name}: first Play must request current Audius metadata lazily.`);

    await page.locator("#menuMusicMute").click();
    assert.equal((await page.locator("#menuMusicMute").textContent()).trim(),"UNMUTE");
    assert.equal((await page.locator("#menuMusicStatus").textContent()).trim(),"PLAYING · MUTED");

    await page.locator("#menuMusicToggle").click();
    await page.waitForFunction(()=>document.getElementById("menuMusicToggle")?.textContent?.trim()==="PLAY TRACK",null,{timeout:5000});
    assert.equal((await page.locator("#menuMusicStatus").textContent()).trim(),"PAUSED");

    const beforeSecond=audiusRequests.length;
    await page.locator('[data-menu-media-source="snowglobe"]').click();
    await page.waitForFunction(()=>document.querySelector(".audiusTrackTitle")?.textContent==="SNOW GLOBE",null,{timeout:5000});
    assert.equal(audiusRequests.length,beforeSecond,`${name}: changing Audius tracks must stay network-dormant until Play.`);
    assert.equal(await page.locator("#menuMusicPlayer audio.audiusAudioElement").count(),1,`${name}: changing tracks must replace, not duplicate, audio ownership.`);
    assert.match(await page.locator("#menuMusicPlayer audio").getAttribute("src"),/X9wlA0b/);
    assert.equal((await page.locator(".menuMusicSource").textContent()).trim(),"AUDIUS");
    assert.equal(await page.locator('[data-menu-media-source="snowglobe"]').getAttribute("aria-pressed"),"true");
    assert.equal(await page.locator("#menuMusicPlayer iframe").count(),0);

    await page.locator("#menuMusicToggle").click();
    await page.waitForFunction(()=>document.querySelector(".audiusTrackTitle")?.textContent==="snow globe",null,{timeout:5000});
    assert.ok(audiusRequests.some(url=>/\/tracks\/X9wlA0b(?:\?|$)/.test(url)),`${name}: second track metadata must also load only after Play.`);

    const geometry=await page.evaluate(()=>{
      const play=document.getElementById("menuMusicToggle"),mute=document.getElementById("menuMusicMute"),tile=document.querySelector(".menuMusicTile");
      return{
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
    console.log("PASS R9 Audius-only Home player: the main Home soundtrack player mounts from the lazy Audius runtime, performs no Audius network request before Play, exposes only Audius tracks, reuses one Play/Mute control set and one audio owner across track changes, and preserves 1366x768 plus 390x844 geometry.");
  }finally{
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
