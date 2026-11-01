"use strict";
// R88 Prime Pack stand-in page (workstream C; redesign G Lead 2026-11-01 10:30 UTC, plain look for Team V 10:44 UTC HO-051),
// driven with its test clock (__ig) in a phone-sized Chromium: the plain PRIME PACK fades out and the card slides up (no flip,
// no flash, no pack art, nothing dimmed or covered), the #name plate empty until the result fills it, the four
// stages come from round.stages (Nik's rule, G Lead 11:08 UTC: position + 1 stat, then +1 stat each, flag and overall ?? in play;
// the result shows the last stats, the flag, the overall and the name; a right guess jumps straight there), each with a Stage N · pts label and a
// timer of that stage's guessMs; the name only on the result; one box each with two tokens, both always on screen, typing only
// in your own; the game <-> page messages in a frame (embed=1, a reload mid-stage lands on the current state with nothing
// replayed); reduced motion; a short (keyboard-open) viewport; a real-time run at ?fast=1; no network outside the page's origin.
// CMS_GALLERY_SHOTS=<dir> saves phone shots of each state.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),http=require("node:http");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
const ROOT=path.resolve(__dirname,"../..");
const Guess=require(path.join(ROOT,"js/iconGuess.js"));
const PAGE="visual-assets/v10_1/icon-guess/index.html";
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".woff2":"font/woff2"};
const SHOTS=process.env.CMS_GALLERY_SHOTS||"";
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// The game's one table, as the step sends it with the round (js/iconGuessStep.js igsRound: stages:guess.stages).
const STAGES=JSON.parse(JSON.stringify(Guess.stages));
const sec=ms=>ms/1000;
// The preview timeline (frozen clock from 0): the other manager arrives at 1 s, stage 1 starts at 1.5 s, each stage runs
// revealMs + guessMs, the result follows the last timer.
const START=[];{let at=1.5;for(const s of STAGES){START.push(at);at+=sec(s.revealMs+s.guessMs);}START.push(at);}
const PREVIEW_ORDER=["DRI","PAC","PHY","PAS","DEF","SHO"];
// The round the game sends: made-up numbers only (never real card data in tests).
const ROUND={position:"ST",statOrder:["SHO","PHY","PAC","DEF","DRI","PAS"],stats:{PAC:81,SHO:92,PAS:74,DRI:85,DEF:38,PHY:83},stages:STAGES,
  nation:"BR",name:"Test Legend",overall:93,source:"PRIME ICON · TEST CARD",me:"playerOne",names:{playerOne:"Daniel",playerTwo:"Nik"},stagePoints:[...Guess.stagePoints]};
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
const advance=(p,s)=>p.evaluate(x=>window.__ig.advance(x),s);
// the page clock in seconds, and stepping it to a moment of the preview that started at t0 (seconds)
const clock=async(p)=>(await p.evaluate(()=>window.__ig.now()))/1000;
const advanceTo=async(p,t0,x)=>advance(p,t0+x-await clock(p));
const restart=async(p)=>{await p.evaluate(()=>window.__ig.preview(true));return clock(p);};
async function shot(p,name){if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await p.screenshot({path:path.join(SHOTS,`r88-icon-${name}.png`)});}}
async function type(p,text){await p.fill("#guess",text);}
// frame -> game messages arrive asynchronously: wait for the one expected, then read them all
async function gotAfter(p,type){await p.waitForFunction(t=>window.__got.some(m=>m.type===t),type,{timeout:5000});await p.waitForTimeout(50);return p.evaluate(()=>window.__got);}
async function inView(p){
  return p.evaluate(()=>{const H=(window.visualViewport?visualViewport.height:innerHeight),W=innerWidth,out=[];
    for(const id of ["card","guess","go","other","boxOne","boxTwo","chipsOne","chipsTwo"]){const el=document.getElementById(id);if(!el||el.closest("[hidden]"))continue;const r=el.getBoundingClientRect();
      if(r.top<-1||r.left<-1||r.bottom>H+1||r.right>W+1||r.height<1)out.push(`${id} ${Math.round(r.top)}..${Math.round(r.bottom)} of ${H}`);}
    return out;});
}
// nothing over the card, and no turned or dimmed tile: the card's own content is what is under its centre, every tile's
// value face is upright (2D transform at most), the card is at full opacity; no pack art; the name element empty in play
async function lookCheck(p,where){
  const r=await p.evaluate(()=>{const card=document.getElementById("card"),rc=card.getBoundingClientRect();
    const top=document.elementFromPoint(rc.left+rc.width*.62,rc.top+rc.height*.3);
    const turned=[...document.querySelectorAll(".tile .f,.tile .b,.card")].map(el=>getComputedStyle(el).transform).filter(t=>/matrix3d/.test(t));
    const dims=[...document.querySelectorAll("*")].filter(el=>{const cs=getComputedStyle(el);return /brightness|grayscale|invert/.test(cs.filter)||cs.backdropFilter&&cs.backdropFilter!=="none";}).map(el=>el.id||el.className);
    return {onCard:card.contains(top),cardOpacity:Number(getComputedStyle(card).opacity),turned,dims,art:["rays","glow","shards","crack"].filter(id=>{const el=document.getElementById(id),r=el.getBoundingClientRect();return el.textContent.trim()||r.width*r.height>0||getComputedStyle(el).backgroundImage!=="none";}),
      anims:document.getAnimations().map(a=>a.animationName||"js").filter(n=>!["pop","fade"].includes(n)),
      name:document.getElementById("name").textContent,noExtra:!document.getElementById("prime-card-name"),result:Boolean(window.__ig.state().result)};});
  assert.equal(r.onCard,true,`${where}: nothing covers the card`);assert.equal(r.cardOpacity,1,`${where}: the card is not dimmed`);
  assert.deepEqual(r.turned,[],`${where}: no 3D turn (no flip)`);assert.deepEqual(r.dims,[],`${where}: no dimming filter`);
  assert.deepEqual(r.art,[],`${where}: the art hooks (rays, glow, pieces, crack) are empty: no drawn pack art`);assert.equal(r.noExtra,true,`${where}: no the #name plate`);assert.deepEqual(r.anims,[],`${where}: no running CSS animation but the result line`);
  if(!r.result)assert.equal(r.name,"",`${where}: the #name plate is empty`);
}
const statsUp=s=>Object.entries(s.stats).filter(([,v])=>v!==null).map(([k])=>k).sort();

(async()=>{
  const server=await serve(),base=`http://127.0.0.1:${server.address().port}/`;
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({headless:true,executablePath:runtime.executablePath,args:runtime.args.filter(a=>a!=="--single-process")});
  const outside=[];
  const newPage=async(opts={})=>{const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true,...opts});
    await ctx.route("**/*",route=>{const u=route.request().url();if(u.startsWith(base))return route.continue();outside.push(u);return route.abort();});
    const p=await ctx.newPage();const errors=[];p.on("pageerror",e=>errors.push(String(e)));p.errors=errors;return p;};
  try{
    // I1 preview: waiting by the closed PRIME PACK, the count-in, the pack opens and the card rises, then stages 2-4 from the
    // stages table, then nobody: 0 points, then the name
    {
      const p=await newPage();await p.goto(base+PAGE+"?still=1");await p.waitForFunction(()=>window.__ig&&window.PrimePackPage);
      await p.evaluate(()=>document.fonts.ready);
      assert.deepEqual(JSON.parse(JSON.stringify(await p.evaluate(()=>window.PrimePackPage.stages))),STAGES,"the preview plays the game's stages table");
      let s=await state(p);
      assert.equal(s.waitingFor,"playerOne");assert.equal(s.beat,-1);assert.equal(s.position,null);assert.equal(s.canGuess,false);
      assert.equal(s.packShown,true);assert.equal(s.cardUp,false);assert.match(s.waitingText,/Waiting for Daniel/);
      assert.match((await p.textContent("#pack")).replace(/\s+/g," "),/PRIME ?PACK/,"the pack says PRIME PACK");
      for(const role of ["playerOne","playerTwo"]){assert.equal(s.boxes[role].visible,true,`${role}'s box is on screen`);assert.equal(s.boxes[role].tokens,2,`${role}: 2 tokens`);assert.equal(s.boxes[role].tokensLeft,2);}
      assert.equal(s.boxes.playerTwo.mine,true);assert.equal(s.boxes.playerTwo.typeable,true,"the viewing manager (Nik here) types in their own box");
      assert.equal(s.boxes.playerOne.typeable,false,"the other box is read only");assert.equal(s.boxes.playerOne.text,"Not here yet");
      await shot(p,"0-waiting");
      await advance(p,1);s=await state(p);assert.equal(s.waitingFor,null);assert.match(s.waitingText,/Both here/);assert.equal(s.beat,-1);
      // stage 1: the pack charges, opens, the card rises, then the position and one stat
      const s1=STAGES[0];await advance(p,.5);s=await state(p);
      assert.equal(s.beat,0);assert.equal(s.label,`Stage 1 · ${s1.points} pts`);assert.equal(s.revealing,true);assert.equal(s.packShown,true);assert.equal(s.position,null);
      assert.equal(s.secondsLeft,sec(s1.guessMs),"the timer shows the stage's whole guessing time while the reveal plays");assert.equal(s.secondsLeft,25,"stage 1: a 25 s timer, no clamp");
      assert.equal(await p.textContent("#ringNum"),"25");
      assert.equal(s.namePlate,"","the name element is empty and hidden");
      await advance(p,sec(s1.revealMs)*.15);s=await state(p);assert.equal(s.packShown,true,"the pack opens first");await shot(p,"1-opening");
      const mid=await p.evaluate(()=>Number(document.getElementById("pack").style.opacity));assert.ok(mid>0&&mid<1,`the pack fades out (${mid})`);
      await advance(p,sec(s1.revealMs)*.35);s=await state(p);assert.equal(s.packShown,false,"then the pack is gone");assert.equal(s.cardUp,false,"and the card is still rising");assert.equal(s.position,null);await shot(p,"2-rising");
      await advance(p,sec(s1.revealMs)*.5);s=await state(p);
      assert.equal(s.revealing,false);assert.equal(s.cardUp,true,"the card has risen");assert.equal(s.position,"CAM");
      assert.deepEqual(statsUp(s),PREVIEW_ORDER.slice(0,s1.stats).sort(),"stage 1: the position and one stat");assert.equal(s.flag,false);assert.equal(s.overall,null);assert.equal(s.name,null);
      assert.equal(s.secondsLeft,sec(s1.guessMs));await lookCheck(p,"stage 1");await shot(p,"3-stage1");
      await advance(p,10);s=await state(p);assert.equal(s.secondsLeft,sec(s1.guessMs)-10,"the timer counts the stage's guessMs");
      assert.deepEqual(STAGES.map(x=>x.stats),[1,2,3,4],"the game's table: one stat, then one more each stage");
      for(let b=1;b<4;b++){
        const st=STAGES[b];await advanceTo(p,0,START[b]+.001);s=await state(p);
        assert.equal(s.beat,b);assert.equal(s.label,`Stage ${b+1} · ${st.points} pt${st.points===1?"":"s"}`);assert.equal(s.stagePoints,st.points);
        await advance(p,sec(st.revealMs));s=await state(p);
        assert.deepEqual(statsUp(s),PREVIEW_ORDER.slice(0,st.stats).sort(),`stage ${b+1}: ${st.stats} stats in the round's order`);
        assert.equal(s.flag,st.flag,`stage ${b+1}: flag`);assert.equal(s.overall,st.overall?"94":null,`stage ${b+1}: overall`);assert.equal(s.name,null,`stage ${b+1}: no name`);assert.equal(s.namePlate,"",`stage ${b+1}: the #name plate empty`);
        assert.equal(s.secondsLeft,sec(st.guessMs));assert.equal(s.boxes.playerOne.visible&&s.boxes.playerTwo.visible,true);
        await lookCheck(p,`stage ${b+1}`);await shot(p,`4-stage${b+1}`);
      }
      assert.equal(statsUp(s).length,4,"stage 4: four stats");assert.equal(s.flag,false,"stage 4: flag still ??");assert.equal(s.overall,null,"stage 4: overall still ??");
      assert.equal(s.chips.playerOne,1,"the other manager's wrong guess shows only as a token count");assert.equal(s.boxes.playerOne.tokensLeft,1);
      await advanceTo(p,0,START[4]+.001);s=await state(p);
      assert.equal(s.result,"draw");assert.equal(s.banner,"Nobody got him · 0 points");assert.equal(s.points,0);assert.equal(s.name,null,"the name comes after the result line");
      assert.equal(s.namePlate,"Sample Icon","nobody after stage 4: guessing has ended, the #name plate gets the name");
      assert.equal(s.overall,"94");assert.equal(s.flag,true);assert.equal(s.source,"PRIME ICON · SAMPLE CARD");
      assert.deepEqual(statsUp(s),[...PREVIEW_ORDER].sort(),"the result turns up the last two stats");
      await advance(p,1);s=await state(p);assert.equal(s.name,"Sample Icon","then the name");
      assert.equal(s.cta,true);assert.equal(s.boxes.playerOne.visible&&s.boxes.playerTwo.visible,true,"both boxes stay on screen at the result");
      await lookCheck(p,"result");await shot(p,"5-draw");
      assert.deepEqual(p.errors,[]);
      ok("I1","waiting by the plain PRIME PACK; stage 1 fades it out and the card slides up (no art, flip, cover or dimming); the #name plate empty in every stage; stages 2-4 add one stat each (4 at most; flag and overall ??) from round.stages with their labels and timers; nobody: 0 points, the last stats, flag, overall, then the name");
      // I2 the own box: suggestions after two letters, text not in the list costs nothing, a wrong guess is shown only here
      let t0=await restart(p);await advanceTo(p,t0,START[2]+2);
      s=await state(p);assert.equal(s.beat,2);
      await type(p,"s");assert.equal(await p.isHidden("#suggest"),true,"no suggestions under two letters");
      await type(p,"samp");assert.equal(await p.isVisible("#suggest"),true);assert.ok((await p.$$("#suggest li")).length>=2);
      s=await state(p);assert.equal(s.boxes.playerOne.visible&&s.boxes.playerTwo.visible,true,"the suggestions leave both boxes on screen");
      const boxTop=await p.evaluate(()=>[document.getElementById("suggest").getBoundingClientRect().bottom,document.getElementById("boxOne").getBoundingClientRect().top]);
      assert.ok(boxTop[0]<=boxTop[1]+1,"the suggestions open above both boxes");await shot(p,"6-suggestions");
      await p.evaluate(()=>{window.__sent=[];addEventListener("cms-ig",e=>window.__sent.push(e.detail));});
      await type(p,"Nobody At All");await p.click("#go");s=await state(p);
      assert.equal(await p.textContent("#note"),"Not an icon in the list");assert.equal(s.chips.playerTwo,2,"text that matches no icon costs no token");
      await type(p,"Sample Striker");await p.click("#go");s=await state(p);
      assert.equal(s.chips.playerTwo,1);assert.equal(s.boxes.playerTwo.tokensLeft,1);assert.equal(await p.textContent("#note"),"Not him.");assert.equal(await p.inputValue("#guess"),"");
      assert.doesNotMatch(await p.textContent("#other"),/Striker/,"the other box never shows typed text");
      const guesses=await p.evaluate(()=>window.__sent.filter(m=>m.type==="cms-ig-guess"));
      assert.deepEqual(guesses.map(g=>[g.text,g.beat,g.role]),[["Nobody At All",2,"playerTwo"],["Sample Striker",2,"playerTwo"]],"the page sends text out; it never decides");
      await advanceTo(p,t0,START[3]+.5);s=await state(p);assert.equal(s.beat,3);
      s=await state(p);assert.equal(s.namePlate,"","still empty in stage 4");
      await type(p,"Sample I");await p.click("#suggest li");s=await state(p);
      assert.equal(s.result,"playerTwo");assert.equal(s.banner,"Nik +1 Showdown point");assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById("banner")).textTransform),"uppercase");
      assert.equal(s.boxes.playerTwo.won,true);assert.equal(s.name,null);assert.equal(s.namePlate,"Sample Icon","a right guess ends guessing: the #name plate gets the name");await advance(p,1);s=await state(p);assert.equal(s.name,"Sample Icon");assert.equal(s.overall,"94");await shot(p,"7-win");
      await p.click("#cta");await p.click("#cta",{force:true}).catch(()=>{});
      assert.equal(await p.evaluate(()=>window.__sent.filter(m=>m.type==="cms-ig-continue").length),1,"Continue is sent once");
      ok("I2","own box: suggestions from two letters above both boxes, a non-icon costs no token, a wrong guess uses a token and shows only here, a right one in stage 4 shows NIK +1 SHOWDOWN POINT then the name, Continue once");
      // I3 two guesses for the whole round, then the box is shut but stays on screen
      t0=await restart(p);await advanceTo(p,t0,START[0]+sec(STAGES[0].revealMs)+1);
      for(const wrong of ["Sample Striker","Sample Winger"]){await type(p,wrong);await p.click("#go");}
      s=await state(p);assert.equal(s.chips.playerTwo,0);assert.equal(s.boxes.playerTwo.tokensLeft,0);assert.equal(s.boxes.playerTwo.out,true);assert.equal(s.canGuess,false);
      assert.equal(await p.isDisabled("#guess"),true);assert.equal(await p.isDisabled("#go"),true);assert.equal(s.boxes.playerTwo.visible,true);
      await advanceTo(p,t0,START[1]+.1);s=await state(p);assert.equal(s.beat,1,"a manager out of tokens still watches the stages");
      // a right guess in stage 1 jumps straight to the full reveal: every stat, the flag, the overall, then the name
      t0=await restart(p);await advanceTo(p,t0,START[0]+sec(STAGES[0].revealMs)+2);s=await state(p);
      assert.equal(s.beat,0);assert.equal(statsUp(s).length,1);assert.equal(s.flag,false);assert.equal(s.overall,null);
      await type(p,"Sample Icon");await p.click("#go");s=await state(p);
      assert.equal(s.result,"playerTwo");assert.equal(s.banner,"Nik +4 Showdown points");assert.equal(s.position,"CAM");
      assert.deepEqual(s.stats,{PAC:88,SHO:86,PAS:90,DRI:93,DEF:41,PHY:72},"all six stats at once");assert.equal(s.flag,true);assert.equal(s.overall,"94");
      assert.equal(s.namePlate,"Sample Icon");assert.equal(s.secondsLeft,null,"no more guessing");
      await advance(p,1);s=await state(p);assert.equal(s.name,"Sample Icon");await lookCheck(p,"early win");await shot(p,"7b-early-win");
      ok("I3","two tokens each for the whole round: with both used, the box is shut but stays on screen and the stages go on; a right guess in stage 1 jumps straight to the full reveal (6 stats, flag, overall, name)");
      await p.context().close();
    }
    // I4 the frame: ready, start, both boxes, count-in, reload mid-stage (nothing replayed), tokens, feedback, result, errors
    {
      const p=await newPage({viewport:{width:390,height:844}});await p.goto(base+"__parent.html");
      await p.waitForFunction(()=>window.__got.some(m=>m.type==="cms-ig-ready"));
      const f=p.frame({url:/icon-guess/}),fstate=()=>f.evaluate(()=>window.__ig.state()),fadvance=s=>f.evaluate(x=>window.__ig.advance(x),s);
      const ready=(await p.evaluate(()=>window.__got)).find(m=>m.type==="cms-ig-ready");
      assert.deepEqual(Object.keys(ready).sort(),["reduced","type"],"ready carries no timing of the page's own");
      assert.equal((await fstate()).beat,-1,"the frame plays nothing until the game starts it");
      await f.evaluate(()=>window.postMessage({type:"cms-ig-start",round:{position:"GK"}},location.origin));
      assert.equal((await fstate()).position,null,"a message from anything but the game is ignored");
      await p.evaluate(r=>window.send({type:"cms-ig-start",round:r,waitingFor:"playerTwo"}),ROUND);
      let s=await fstate();assert.equal(s.waitingFor,"playerTwo");assert.equal(s.me,"playerOne");
      assert.equal(s.boxes.playerOne.typeable,true,"Daniel's phone: Daniel types in Daniel's box");assert.equal(s.boxes.playerTwo.typeable,false);assert.equal(s.boxes.playerTwo.text,"Not here yet");
      await p.evaluate(()=>window.send({type:"cms-ig-waiting",role:null}));s=await fstate();assert.match(s.waitingText,/Both here/);
      // a phone that reloads in stage 3's guessing window: stages 1-3 face up at once, the card up, 12 s of guessing left
      await p.evaluate(()=>window.send({type:"cms-ig-reveal",index:2,phase:"window",remainingMs:12000,revealMsLeft:0}));
      s=await fstate();
      assert.equal(s.beat,2);assert.equal(s.waitingFor,null);assert.equal(s.position,"ST");assert.equal(s.secondsLeft,12);assert.equal(s.revealing,false);
      assert.equal(s.packShown,false);assert.equal(s.cardUp,true,"no pack opening replayed");
      assert.deepEqual(s.stats,{PAC:81,SHO:92,PAS:null,DRI:null,DEF:null,PHY:83},"stage 3 shows three stats, the round's first three, with its own values");assert.equal(s.flag,false);assert.equal(s.overall,null);assert.equal(s.name,null);
      assert.equal(s.namePlate,"","a reload mid-round never fills the name");
      assert.equal(await f.evaluate(()=>document.body.textContent.includes("Test Legend")),false,"the name is nowhere on the page in play");
      await p.evaluate(()=>window.send({type:"cms-ig-chips",role:"playerTwo",count:1}));
      s=await fstate();assert.deepEqual(s.chips,{playerOne:2,playerTwo:1});assert.equal(s.boxes.playerTwo.tokensLeft,1);
      assert.equal(await f.textContent("#note"),"","the other manager's guess shows nothing but the count");
      await p.evaluate(()=>window.send({type:"cms-ig-chips",role:"playerTwo",count:0}));
      s=await fstate();assert.equal(s.boxes.playerTwo.out,true);assert.equal(s.boxes.playerTwo.text,"Out of guesses");
      await f.fill("#guess","Test");
      await p.evaluate(()=>window.send({type:"cms-ig-suggestions",names:["Test Legend","<b>x</b>"]}));
      assert.deepEqual(await f.$$eval("#suggest li",l=>l.map(x=>x.textContent)),["Test Legend","<b>x</b>"],"suggestions are text, never markup");
      await f.click("#suggest li");
      let got=await gotAfter(p,"cms-ig-guess");
      assert.deepEqual(got.filter(m=>m.type==="cms-ig-input").map(m=>m.text),["Test"]);
      assert.deepEqual(got.filter(m=>m.type==="cms-ig-guess").map(m=>[m.text,m.beat,m.role]),[["Test Legend",2,"playerOne"]]);
      assert.equal((await fstate()).pending,true,"one guess at a time until the game answers");
      await p.evaluate(()=>window.send({type:"cms-ig-result",winner:"playerOne",points:2}));
      s=await fstate();assert.equal(s.result,"playerOne");assert.equal(s.banner,"Daniel +2 Showdown points");assert.equal(s.flag,true);assert.equal(s.overall,"93");assert.equal(s.name,null);
      assert.deepEqual(s.stats,{PAC:81,SHO:92,PAS:74,DRI:85,DEF:38,PHY:83},"a win in stage 3 turns up the other three stats");
      assert.equal(s.namePlate,"Test Legend","the result fills the #name plate");
      await fadvance(1);s=await fstate();assert.equal(s.name,"Test Legend");assert.equal(s.boxes.playerOne.won,true);assert.equal(s.boxes.playerTwo.visible,true);
      await f.click("#cta");got=await gotAfter(p,"cms-ig-continue");assert.equal(got.filter(m=>m.type==="cms-ig-continue").length,1);
      // a phone that reloads during stage 1's opening: only what is left of it plays
      await p.evaluate(r=>window.send({type:"cms-ig-start",round:r}),ROUND);
      const s1=STAGES[0];
      await p.evaluate(m=>window.send(m),{type:"cms-ig-reveal",index:0,phase:"reveal",remainingMs:s1.guessMs+1000,revealMsLeft:1000});
      s=await fstate();assert.equal(s.packShown,false,"past its fade: the pack is already open");assert.equal(s.namePlate,"","a new round empties the name");assert.equal(s.cardUp,false);assert.equal(s.revealing,true);assert.equal(s.secondsLeft,sec(s1.guessMs));
      await fadvance(1);s=await fstate();assert.equal(s.cardUp,true);assert.equal(s.position,"ST");assert.deepEqual(statsUp(s),ROUND.statOrder.slice(0,s1.stats).sort());
      // stage 4 straight from the game: four stats, the flag and the overall still ??
      await p.evaluate(()=>window.send({type:"cms-ig-reveal",index:3,phase:"window",remainingMs:5000,revealMsLeft:0}));
      s=await fstate();assert.equal(s.flag,false);assert.equal(s.overall,null);assert.equal(s.name,null);assert.equal(s.label,"Stage 4 · 1 pt");assert.equal(s.secondsLeft,5);
      assert.deepEqual(statsUp(s),ROUND.statOrder.slice(0,4).sort(),"stage 4: the round's first four stats");
      assert.equal(s.namePlate,"","stage 4: still empty");
      await p.evaluate(()=>window.send({type:"cms-ig-result",winner:"draw",points:0}));
      s=await fstate();assert.equal(s.banner,"Nobody got him · 0 points");assert.equal(s.namePlate,"Test Legend","nobody after stage 4: the name is filled");
      assert.deepEqual(statsUp(s),[...ROUND.statOrder].sort(),"and the last two stats");assert.equal(s.flag,true);assert.equal(s.overall,"93");
      await p.evaluate(()=>window.send({type:"cms-ig-start",round:{position:"ST"}}));
      got=await gotAfter(p,"cms-ig-error");assert.ok(got.some(m=>m.type==="cms-ig-error"&&/round/.test(m.message)),"a bad round is reported to the game, not drawn");
      await p.evaluate(()=>{window.__got=[];});
      await p.evaluate(r=>window.send({type:"cms-ig-start",round:{...r,stages:undefined}}),ROUND);
      got=await gotAfter(p,"cms-ig-error");assert.ok(got.some(m=>/stages/.test(m.message)),"a round without its stages is refused: the page has no timings of its own");
      ok("I4","in the frame: ready, then nothing until start; round.me types in their own box, the other is read only with its tokens and 'out'; a reload lands on the current stage (earlier stages up, no replay, the timer = remainingMs - revealMsLeft); the #name plate empty through a reload and filled by the result (a win and nobody); bad input is an error");
      await p.context().close();
    }
    // I5 reduced motion and a short (keyboard-open) screen
    {
      const p=await newPage({reducedMotion:"reduce"});await p.goto(base+PAGE+"?still=1");await p.waitForFunction(()=>window.__ig);
      let s=await state(p);assert.equal(s.reduced,true);
      assert.equal(await p.evaluate(()=>document.documentElement.classList.contains("rm")),true);
      await advance(p,START[0]+sec(STAGES[0].revealMs)*.6);
      const mid=await p.evaluate(()=>({card:document.getElementById("card").style.transform,opacity:Number(document.getElementById("card").style.opacity)}));
      assert.equal(mid.card,"none","the card fades in, no slide");assert.ok(mid.opacity>0&&mid.opacity<1,"mid-fade");
      await p.evaluate(()=>document.documentElement.classList.remove("still"));
      const tile=await p.evaluate(()=>{const f=document.querySelector(".stat .f"),cs=getComputedStyle(f);return {dur:cs.transitionDuration,transform:cs.transform};});
      assert.match(tile.dur,/0\.22s/);assert.equal(tile.transform,"none","reduced motion: fades");
      ok("I5","reduced motion: the card and the values only fade, briefly");
      for(const size of [{width:390,height:844},{width:375,height:667},{width:390,height:430},{width:844,height:390}]){
        await p.setViewportSize(size);await p.waitForFunction(()=>Math.abs(document.getElementById("app").getBoundingClientRect().height-visualViewport.height)<1);
        await p.evaluate(x=>{window.__ig.preview(true);window.__ig.advance(x);},START[0]+sec(STAGES[0].revealMs)+.5);await p.focus("#guess");
        assert.deepEqual(await inView(p),[],`${size.width}x${size.height}: card, both boxes, the input, the button and both token rows on screen`);
        if(size.height===430)await shot(p,"8-keyboard-height");
      }
      ok("I6","at 390x844, 375x667, a 390x430 keyboard-open height and 844x390 landscape the card, both boxes and both token rows stay on screen");
      await p.context().close();
    }
    // I7 real time at ?fast=1 (all times a tenth): the opening and the stages play on the real clock with no errors
    {
      const p=await newPage();await p.goto(base+PAGE+"?fast=1");await p.waitForFunction(()=>window.__ig);
      assert.equal(await p.evaluate(()=>window.PrimePackPage.fast),.1);
      await p.waitForFunction(()=>window.__ig.state().beat===1,null,{timeout:8000});
      const s=await state(p);assert.equal(s.cardUp,true);assert.equal(s.position,"CAM");assert.ok(statsUp(s).length>=1);assert.equal(s.name,null);
      await p.waitForFunction(()=>window.__ig.state().result==="draw",null,{timeout:15000});
      await p.waitForFunction(()=>window.__ig.state().name==="Sample Icon",null,{timeout:3000});
      assert.deepEqual(p.errors,[]);
      ok("I7","?fast=1 plays the whole preview on the real clock: the pack fades out, the card slides up, four stages, the result, then the name, with no page errors");
      await p.context().close();
    }
    assert.deepEqual(outside,[],"the page loads nothing from outside its own origin");
    ok("I8","no request leaves the page's own origin (no CDN, no fonts service, no Firebase)");
  }finally{await browser.close();server.close();}
  console.log(`PASS r88 Prime Pack page audit: ${checks} numbered checks.`);
})().catch(error=>{console.error(error);process.exit(1);});
