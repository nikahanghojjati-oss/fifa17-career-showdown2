"use strict";
// R88 Icon Unmasked stand-in page (workstream C), driven with its test clock (__ig) in a phone-sized Chromium:
// the reveal order, the guess window, chips both phones see, wrong guesses kept on the guesser's phone, the overall switch,
// the result and Continue, the game <-> page messages in a frame (embed=1, rejoin at the current beat), reduced motion,
// a short (keyboard-open) viewport, and no network outside the page's own origin.
// CMS_GALLERY_SHOTS=<dir> saves phone shots of each state.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),http=require("node:http");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
const ROOT=path.resolve(__dirname,"../..");
const PAGE="visual-assets/v10_1/icon-guess/index.html";
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".woff2":"font/woff2"};
const SHOTS=process.env.CMS_GALLERY_SHOTS||"";
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// The round the game sends: made-up numbers only (never real card data in tests).
const ROUND={position:"ST",statOrder:["SHO","PHY","PAC","DEF","DRI","PAS"],stats:{PAC:81,SHO:92,PAS:74,DRI:85,DEF:38,PHY:83},
  nation:"BR",name:"Test Legend",overall:93,source:"PRIME ICON · TEST CARD",me:"playerOne",names:{playerOne:"Daniel",playerTwo:"Nik"},windowMs:6000};
const PARENT=`<!doctype html><meta charset="utf-8"><body style="margin:0"><iframe id="f" src="/${PAGE}?embed=1&still=1" style="border:0;width:390px;height:844px"></iframe>
<script>window.__got=[];addEventListener("message",e=>{if(e.source===document.getElementById("f").contentWindow&&e.origin===location.origin)window.__got.push(e.data);});
window.send=(m)=>document.getElementById("f").contentWindow.postMessage(m,location.origin);</script>`;

function serve(){
  const server=http.createServer((request,response)=>{
    const url=new URL(request.url,"http://x");
    if(url.pathname==="/__parent.html"){response.setHeader("content-type",TYPES[".html"]);response.end(PARENT);return;}
    const file=path.join(ROOT,decodeURIComponent(url.pathname));
    if(!file.startsWith(ROOT)){response.statusCode=403;response.end();return;}
    fs.readFile(file,(error,body)=>{if(error){response.statusCode=404;response.end("missing");return;}response.setHeader("content-type",TYPES[path.extname(file).toLowerCase()]||"application/octet-stream");response.end(body);});
  });
  return new Promise(resolve=>server.listen(0,"127.0.0.1",()=>resolve(server)));
}
const state=(p)=>p.evaluate(()=>window.__ig.state());
const advance=(p,sec)=>p.evaluate(s=>window.__ig.advance(s),sec);
async function shot(p,name){if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await p.screenshot({path:path.join(SHOTS,`r88-icon-${name}.png`)});}}
async function type(p,text){await p.fill("#guess",text);}
// frame -> game messages arrive asynchronously: wait for the one expected, then read them all
async function gotAfter(p,type){await p.waitForFunction(t=>window.__got.some(m=>m.type===t),type,{timeout:5000});await p.waitForTimeout(50);return p.evaluate(()=>window.__got);}
async function inView(p){
  return p.evaluate(()=>{const H=(window.visualViewport?visualViewport.height:innerHeight),W=innerWidth,out=[];
    for(const id of ["card","guess","go","chipsOne","chipsTwo"]){const el=document.getElementById(id);if(!el||el.closest("[hidden]"))continue;const r=el.getBoundingClientRect();
      if(r.top<-1||r.left<-1||r.bottom>H+1||r.right>W+1||r.height<1)out.push(`${id} ${Math.round(r.top)}..${Math.round(r.bottom)} of ${H}`);}
    return out;});
}

(async()=>{
  const server=await serve(),base=`http://127.0.0.1:${server.address().port}/`;
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({headless:true,executablePath:runtime.executablePath,args:runtime.args.filter(a=>a!=="--single-process")});
  const outside=[];
  const newPage=async(opts={})=>{const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true,...opts});
    await ctx.route("**/*",route=>{const u=route.request().url();if(u.startsWith(base))return route.continue();outside.push(u);return route.abort();});
    const p=await ctx.newPage();const errors=[];p.on("pageerror",e=>errors.push(String(e)));p.errors=errors;return p;};
  try{
    // I1 preview: waiting, then the position, then one stat per beat in the round's order, then the flag
    {
      const p=await newPage();await p.goto(base+PAGE+"?still=1");await p.waitForFunction(()=>window.__ig&&window.IconUnmaskedPage);
      await p.evaluate(()=>document.fonts.ready);
      let s=await state(p);
      assert.equal(s.waitingFor,"playerOne");assert.equal(s.beat,-1);assert.equal(s.position,null);assert.equal(s.canGuess,false);
      assert.match(await p.textContent("#waiting"),/Waiting for Daniel/);await shot(p,"0-waiting");
      await advance(p,1.5);s=await state(p);
      assert.equal(s.beat,0);assert.equal(s.position,"CAM");assert.equal(s.flag,false);assert.equal(s.name,null);assert.equal(s.overall,null,"overall hidden by default");
      assert.ok(Object.values(s.stats).every(v=>v===null),"no stat before beat 1");assert.equal(s.secondsLeft,8);assert.equal(s.canGuess,true);
      await shot(p,"1-position");
      const order=["DRI","PAC","PHY","PAS","DEF","SHO"],step=8+0.7;
      for(let i=0;i<6;i++){await advance(p,step);s=await state(p);assert.equal(s.beat,i+1);
        for(const [k,v] of Object.entries(s.stats))assert.equal(v!==null,order.indexOf(k)<=i,`beat ${i+1}: ${k}`);
        assert.equal(s.overall,null,`overall still hidden at beat ${i+1}`);assert.equal(s.name,null);}
      await shot(p,"2-six-stats");
      assert.equal(s.chips.playerOne,1,"the other manager's wrong guess shows only as a chip count");
      await advance(p,step);s=await state(p);assert.equal(s.beat,7);assert.equal(s.flag,true);assert.match(await p.textContent("#beat"),/Last chance/i);
      await shot(p,"3-flag");
      await advance(p,step);s=await state(p);
      assert.equal(s.result,"draw");assert.match(s.banner,/Nobody got him/i);assert.equal(s.name,"Sample Icon");assert.equal(s.overall,"94");assert.equal(s.source,"PRIME ICON · SAMPLE CARD");
      assert.equal(s.cta,true);assert.equal(await p.isHidden("#guessbar"),true);await shot(p,"4-draw");
      assert.deepEqual(p.errors,[]);
      ok("I1","waiting, position, the six stats one per beat in the round's order, flag last, overall and name hidden until a draw shows the full card");
      // I2 the guess bar: suggestions after two letters, text not in the list costs nothing, a wrong guess is shown only here
      await p.evaluate(()=>window.__ig.preview(true));await advance(p,1.5+8.7*2+1);
      s=await state(p);assert.equal(s.beat,2);
      await type(p,"s");assert.equal(await p.isHidden("#suggest"),true,"no suggestions under two letters");
      await type(p,"samp");assert.equal(await p.isVisible("#suggest"),true);assert.ok((await p.$$("#suggest li")).length>=2);await shot(p,"5-suggestions");
      const sent=await p.evaluate(()=>{window.__sent=[];addEventListener("cms-ig",e=>window.__sent.push(e.detail));});
      await type(p,"Nobody At All");await p.click("#go");s=await state(p);
      assert.equal(await p.textContent("#note"),"Not an icon in the list");assert.equal(s.chips.playerTwo,2,"text that matches no icon costs no chip");
      await type(p,"Sample Striker");await p.click("#go");s=await state(p);
      assert.equal(s.chips.playerTwo,1);assert.equal(await p.textContent("#note"),"Not him.");assert.equal(await p.inputValue("#guess"),"");
      const guesses=await p.evaluate(()=>window.__sent.filter(m=>m.type==="cms-ig-guess"));
      assert.deepEqual(guesses.map(g=>[g.text,g.beat,g.role]),[["Nobody At All",2,"playerTwo"],["Sample Striker",2,"playerTwo"]],"the page sends text out; it never decides");
      await advance(p,9);s=await state(p);assert.equal(s.beat,3);
      await type(p,"Sample I");await p.click("#suggest li");s=await state(p);
      assert.equal(s.result,"playerTwo");assert.match(s.banner,/^Nik \+1 Showdown point$/);assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById("banner")).textTransform),"uppercase");
      assert.equal(s.name,"Sample Icon");assert.equal(s.overall,"94");await shot(p,"6-win");
      await p.click("#cta");await p.click("#cta",{force:true}).catch(()=>{});
      assert.equal(await p.evaluate(()=>window.__sent.filter(m=>m.type==="cms-ig-continue").length),1,"Continue is sent once");
      ok("I2","suggestions from two letters (tap one to guess), a non-icon costs no chip, a wrong guess uses a chip and shows only here, a right one shows NIK +1 SHOWDOWN POINT, Continue once");
      // I3 two guesses each, then the bar stays shut
      await p.evaluate(()=>window.__ig.preview(true));await advance(p,1.5+1);
      for(const wrong of ["Sample Striker","Sample Winger"]){await type(p,wrong);await p.click("#go");}
      s=await state(p);assert.equal(s.chips.playerTwo,0);assert.equal(s.canGuess,false);assert.equal(await p.isDisabled("#guess"),true);assert.equal(await p.isDisabled("#go"),true);
      await advance(p,8.7);s=await state(p);assert.equal(s.beat,1,"a manager out of chips still watches the reveals");
      ok("I3","two chips each: with both used, the bar is shut but the reveals go on");
      await p.context().close();
    }
    // I4 the frame: ready, start, rejoin at the current beat, chips, feedback, result, errors; foreign messages ignored
    {
      const p=await newPage({viewport:{width:390,height:844}});await p.goto(base+"__parent.html");
      await p.waitForFunction(()=>window.__got.some(m=>m.type==="cms-ig-ready"));
      const f=p.frame({url:/icon-guess/});
      const ready=(await p.evaluate(()=>window.__got)).find(m=>m.type==="cms-ig-ready");
      assert.ok(ready.revealMs<=2000,"each reveal beat is at most 2 s");
      assert.equal((await f.evaluate(()=>window.__ig.state())).beat,-1,"the frame plays nothing until the game starts it");
      await f.evaluate(()=>window.postMessage({type:"cms-ig-start",round:{position:"GK"}},location.origin));
      assert.equal((await f.evaluate(()=>window.__ig.state())).position,null,"a message from anything but the game is ignored");
      await p.evaluate(r=>window.send({type:"cms-ig-start",round:r,waitingFor:"playerTwo"}),ROUND);
      let s=await f.evaluate(()=>window.__ig.state());assert.equal(s.waitingFor,"playerTwo");assert.equal(s.me,"playerOne");
      await p.evaluate(()=>window.send({type:"cms-ig-reveal",index:4,remainingMs:3500}));
      s=await f.evaluate(()=>window.__ig.state());
      assert.equal(s.beat,4);assert.equal(s.waitingFor,null);assert.equal(s.position,"ST");assert.equal(s.secondsLeft,4);
      assert.deepEqual(s.stats,{PAC:81,SHO:92,PAS:null,DRI:null,DEF:38,PHY:83},"a phone that rejoins shows every beat up to the current one");
      await p.evaluate(()=>window.send({type:"cms-ig-chips",role:"playerTwo",count:1}));
      s=await f.evaluate(()=>window.__ig.state());assert.deepEqual(s.chips,{playerOne:2,playerTwo:1});
      assert.equal(await f.textContent("#note"),"","the other manager's guess shows nothing but the count");
      await f.fill("#guess","Test");
      await p.evaluate(()=>window.send({type:"cms-ig-suggestions",names:["Test Legend","<b>x</b>"]}));
      assert.deepEqual(await f.$$eval("#suggest li",l=>l.map(x=>x.textContent)),["Test Legend","<b>x</b>"],"suggestions are text, never markup");
      await f.click("#suggest li");
      let got=await gotAfter(p,"cms-ig-guess");
      assert.deepEqual(got.filter(m=>m.type==="cms-ig-input").map(m=>m.text),["Test"]);
      assert.deepEqual(got.filter(m=>m.type==="cms-ig-guess").map(m=>[m.text,m.beat,m.role]),[["Test Legend",4,"playerOne"]]);
      assert.equal((await f.evaluate(()=>window.__ig.state())).pending,true,"one guess at a time until the game answers");
      await p.evaluate(()=>window.send({type:"cms-ig-result",winner:"playerOne"}));
      s=await f.evaluate(()=>window.__ig.state());assert.equal(s.result,"playerOne");assert.match(s.banner,/^Daniel \+1 Showdown point$/);assert.equal(s.name,"Test Legend");assert.equal(s.overall,"93");assert.equal(s.flag,true);
      await f.click("#cta");got=await gotAfter(p,"cms-ig-continue");assert.equal(got.filter(m=>m.type==="cms-ig-continue").length,1);
      await p.evaluate(()=>window.send({type:"cms-ig-start",round:{position:"ST"}}));
      got=await gotAfter(p,"cms-ig-error");assert.ok(got.some(m=>m.type==="cms-ig-error"&&/round/.test(m.message)),"a bad round is reported to the game, not drawn");
      ok("I4","in the frame: ready, then nothing until start; rejoin shows beats 0..n at once; chips, suggestions and the result come from the game; guesses and Continue go out; bad input is an error; other senders are ignored");
      // I5 the overall switch: one round field can show it during play
      await p.evaluate(r=>window.send({type:"cms-ig-start",round:{...r,overallHidden:false}}),ROUND);await p.evaluate(()=>window.send({type:"cms-ig-reveal",index:0}));
      s=await f.evaluate(()=>window.__ig.state());assert.equal(s.overall,"93");
      assert.equal(await f.evaluate(()=>window.IconUnmaskedPage.overallHiddenUntilEnd),true,"the default stays hidden (Nik, 31 Oct)");
      ok("I5","the overall is hidden until the result by default; overallHidden:false shows it from the first beat");
      await p.context().close();
    }
    // I6 reduced motion and a short (keyboard-open) screen
    {
      const p=await newPage({reducedMotion:"reduce"});await p.goto(base+PAGE+"?still=1");await p.waitForFunction(()=>window.__ig);
      const s=await state(p);assert.equal(s.reduced,true);
      assert.equal(await p.evaluate(()=>window.IconUnmaskedPage.revealMs),220);
      assert.equal(await p.evaluate(()=>document.documentElement.classList.contains("rm")),true);
      await p.evaluate(()=>document.documentElement.classList.remove("still"));
      const flip=await p.evaluate(()=>{const f=document.querySelector(".stat .f"),cs=getComputedStyle(f);return {dur:cs.transitionDuration,transform:cs.transform};});
      assert.match(flip.dur,/0\.22s/);assert.equal(flip.transform,"none","reduced motion: fades, no flip");
      assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector(".card .face"),"::after").animationName),"none","no sheen");
      ok("I6","reduced motion: flips become short fades, beats shorten, the sheen stops");
      for(const size of [{width:390,height:844},{width:375,height:667},{width:390,height:430},{width:844,height:390}]){
        await p.setViewportSize(size);await p.waitForFunction(()=>Math.abs(document.getElementById("app").getBoundingClientRect().height-visualViewport.height)<1);await p.evaluate(()=>{window.__ig.preview(true);window.__ig.advance(1.6);});await p.focus("#guess");
        assert.deepEqual(await inView(p),[],`${size.width}x${size.height}: card, guess box, button and chips all on screen`);
        if(size.height===430)await shot(p,"7-keyboard-height");
      }
      ok("I7","at 390x844, 375x667, a 390x430 keyboard-open height and 844x390 landscape the card, the guess bar and both chip rows stay on screen");
      await p.context().close();
    }
    assert.deepEqual(outside,[],"the page loads nothing from outside its own origin");
    ok("I8","no request leaves the page's own origin (no CDN, no fonts service, no Firebase)");
  }finally{await browser.close();server.close();}
  console.log(`PASS r88 Icon Unmasked page audit: ${checks} numbered checks.`);
})().catch(error=>{console.error(error);process.exit(1);});
