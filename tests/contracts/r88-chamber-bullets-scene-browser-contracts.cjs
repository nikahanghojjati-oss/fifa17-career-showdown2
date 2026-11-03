#!/usr/bin/env node
'use strict';
// r88 Chamber Men bullets, end to end through the real code (owner 2026-11-03: the roulette's live chambers must EXACTLY
// match the shootout's goals). A finished turn-by-turn shootout (js/chamberMen.js) gives the two cylinders; the roulette
// engine (js/rosterRoulette.js) plans the spins with them; the real 3D scene (visual-assets/v10_1/roulette/index.html, in
// a browser with WebGL) gets the same setup js/rosterRouletteStep.js sends and draws it. For three shootouts (Daniel-Nik
// goals): 7-0 (Nik's cylinder full: a sure hit; Daniel's empty: never fires), 0-7 and a mixed 3-5:
//   SB1 each manager's live chambers are exactly the rival's goals (chamber k = the rival's k-th shot), and each spin fires
//       exactly when it stops on a live chamber: 0 goals never fires (the empty cylinder still spins), 7 goals always fires
//       (checked over 300 Showdown seeds too);
//   SB2 the scene names both counts on setup ("Daniel k bullets · Nik j bullets · Seven chambers"), draws each turn's live
//       rounds ("No live rounds" / "Red: k live rounds") and stops on a live round (bang) exactly when the plan fired.
// CE2PG's headless Chromium has no WebGL, so there the step shows its result card instead; the CE2PG observer
// (tests/browser/support/ce2pg-roulette-observer.cjs C1-C6) checks that card and the plan for every season on both phones.
const assert=require('node:assert/strict');
const net=require('node:net');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const CM=require('../../js/chamberMen.js');
const RR=require('../../js/rosterRoulette.js');
const Squads=require('../../data/rosterSquads.js');
let checks=0;const ok=(id,text)=>{checks+=1;console.log(`ok ${checks} ${id} ${text}`);};
let finished=false;
process.on('exit',code=>{if(!finished&&!code){console.error('r88 Chamber Men bullets scene contracts ended before their last check.');process.exitCode=1;}});
function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const up=await new Promise(resolve=>{const s=net.connect(port,'127.0.0.1',()=>{s.end();resolve(true);});s.on('error',()=>resolve(false));});if(up)return;await new Promise(r=>setTimeout(r,100));}throw new Error('static server did not start');}

// A full shootout in which Daniel scores dGoals of his 7 shots and Nik nGoals of his, kick by kick, turn by turn.
function shootout(dGoals,nGoals){
  let r=CM.record({playerOne:'',playerTwo:''});
  for(let n=1;n<=14;n+=1){
    const k=CM.kick(n),goals=k.shooter==='playerOne'?dGoals:nGoals,goal=k.shot<=goals;
    const shot=CM.sides[n%3],dive=goal?CM.sides[(n+1)%3]:shot;
    r=CM.send(r,k.shooter,shot);r=CM.send(r,k.keeper,dive);
  }
  assert.deepEqual({...CM.score(r)},{playerOne:dGoals,playerTwo:nGoals});
  return r;
}
const clubs=Object.keys(Squads.squads),pair={playerOne:clubs[0],playerTwo:clubs[1]};
const CASES=[[7,0],[0,7],[3,5]];

(async()=>{
  // SB1 engine side.
  const plans=[];
  for(const [d,n] of CASES){
    const record=shootout(d,n),cyl=CM.cylinders(record),kicks=CM.kicksOf(record);
    for(const role of ['playerOne','playerTwo']){
      const rival=role==='playerOne'?'playerTwo':'playerOne',rivalShots=kicks.filter(k=>k.shooter===rival);
      assert.deepEqual([...cyl[role]],rivalShots.map(k=>k.goal),'chamber k = the rival\'s k-th shot');
    }
    let fires={playerOne:0,playerTwo:0};
    for(let i=0;i<300;i+=1){
      const rid=`pair_${crypto.createHash('sha256').update(`sb-${d}-${n}-${i}`).digest('hex')}`;
      const plan=RR.forSeason(rid,pair,1,{chamberMen:true,chambers:{1:cyl}});
      for(const turn of plan.turns){
        const live=cyl[turn.role].map((on,j)=>on?j:-1).filter(j=>j>=0);
        assert.deepEqual([...turn.loadedChambers],live);
        assert.equal(turn.fired,cyl[turn.role][turn.stopChamber],'fires exactly on a live chamber');
        if(turn.fired)fires[turn.role]+=1;
      }
      if(i===0)plans.push({d,n,rid,plan});
    }
    // Daniel's cylinder holds Nik's goals, Nik's holds Daniel's.
    if(n===0)assert.equal(fires.playerOne,0,'0 rival goals: never fires in 300 spins');
    if(n===7)assert.equal(fires.playerOne,300,'7 rival goals: fires every time');
    if(d===0)assert.equal(fires.playerTwo,0);
    if(d===7)assert.equal(fires.playerTwo,300);
  }
  ok('SB1','live chambers are exactly the rival\'s goals; a spin fires only on a live chamber; 0 goals never fires, 7 always does (300 seeds each)');

  // SB2 the real scene.
  const {chromium}=require('playwright');
  const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');
  const port=await freePort();
  const server=spawn(process.execPath,[path.join(ROOT,'tests/support/static-server.cjs')],{cwd:ROOT,stdio:'ignore',env:{...process.env,CMS_TEST_PORT:String(port)}});
  let browser=null;
  try{
    await waitForServer(port);
    const runtime=await resolveChromiumRuntime();
    // WebGL through SwiftShader (the bundled runtime switches WebGL off for the app journeys). The page itself composites
    // and rasters in software: with SwiftShader doing that too, the scene takes over a minute to load instead of seconds.
    const args=runtime.args.filter(a=>a!=='--single-process'&&!/^--(disable-webgl|disable-gpu|use-gl|use-angle)/.test(a)).concat(['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-compositing','--disable-gpu-rasterization']);
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args});
    const base=`http://127.0.0.1:${port}/`;
    const seen=[],T0=Date.now();
    for(const {d,n,rid,plan} of plans){
      const context=await browser.newContext({viewport:{width:480,height:300},serviceWorkers:'block',reducedMotion:'reduce'});
      const page=await context.newPage();
      const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>errors.push('failed '+r.url()));
      await page.route(url=>!String(url).startsWith(base),route=>route.abort());
      await page.goto(`${base}404-not-a-page`,{waitUntil:'load'}).catch(()=>{});
      const boardOf=role=>plan.boards[role].map(p=>({pos:p.pos,position:p.positions[0]||null,name:p.name||'EMPTY SLOT',special:p.special===true,rating:p.name&&p.rating>0?p.rating:null,number:p.name&&Number.isInteger(p.number)?p.number:null}));
      const turns=plan.turns.map(t=>({fire:t.fired,target:t.player?t.player.name:null,targetLabel:null,targetNumber:null,targetPosition:null,targetRating:null,bulletChamber:t.bulletChamber,stopChamber:t.stopChamber,hitSlot:t.hitSlot,aimSlot:t.aimSlot,loadedChambers:[...t.loadedChambers]}));
      const setup={type:'cms-rr-setup',d:pair.playerOne,n:pair.playerTwo,boards:{D:boardOf('playerOne'),N:boardOf('playerTwo')},formations:{D:plan.formations.playerOne,N:plan.formations.playerTwo},turns,seed:(parseInt(rid.slice(-8),16)^Math.imul(1,0x9E3779B1))>>>0};
      const out=await page.evaluate(async({src,setup})=>{
        document.body.innerHTML='';const msgs=[];addEventListener('message',e=>{if(e.data&&e.data.type)msgs.push(e.data.type);});
        const f=document.createElement('iframe');f.style.cssText='width:480px;height:300px;border:0';f.src=src;document.body.append(f);
        const T=[],t00=Date.now();const until=async(fn,ms,what)=>{const t0=Date.now();for(;;){const v=fn();if(v){T.push(what+':'+(Date.now()-t00));return v;}if(Date.now()-t0>ms)throw new Error(`timed out: ${what} (messages ${msgs.join(',')})`);await new Promise(r=>setTimeout(r,50));}};
        await until(()=>f.contentWindow&&f.contentWindow.__rrReady,120000,'scene ready');
        const w=f.contentWindow,doc=w.document,result=doc.getElementById('result'),cta=doc.getElementById('cta'),lines=[];
        new w.MutationObserver(()=>{const v={cls:result.className,text:result.textContent};const last=lines[lines.length-1];if(!last||last.cls!==v.cls||last.text!==v.text)lines.push(v);}).observe(result,{childList:true,characterData:true,subtree:true,attributes:true});
        await until(()=>msgs.includes('cms-rr-ready')||msgs.includes('cms-rr-error'),60000,'scene loaded');
        if(msgs.includes('cms-rr-error'))throw new Error('scene error');
        w.postMessage(setup,location.origin);
        await until(()=>msgs.includes('cms-rr-armed')||msgs.includes('cms-rr-error'),15000,'armed');
        const caption=result.textContent,stops=[],marks=[],drum=[];
        for(let i=0;i<2;i+=1){
          await until(()=>!cta.disabled&&/spins/.test(cta.textContent),30000,`turn ${i+1} ready`);
          const from=lines.length,z0=w.__rr.cylZ;cta.click();w.__rr.advance(0.5);const zStart=w.__rr.cylZ;
          // Software WebGL draws a frame in well over 0.25 s, and the scene pauses its turn clock across such gaps (F11-01), so
          // the turn is stepped on the scene's own test clock (window.__rr.advance, 30 ticks a second, drawing the last one).
          for(let s=0;s<200&&msgs.filter(m=>m==='cms-rr-end').length<=i;s+=1){const seen=lines.slice(from).some(l=>/live round/.test(l.text));w.__rr.advance(seen?2:0.5);await new Promise(r=>setTimeout(r,0));}
          await until(()=>msgs.filter(m=>m==='cms-rr-end').length>i,10000,`turn ${i+1} end`);
          const mine=lines.slice(from),mark=mine.find(l=>/No live rounds|Red: (\d+ )?live round/.test(l.text)),stop=mine.filter(l=>/\bresult (bang|safe)\b/.test(l.cls)&&!/live round/.test(l.text)).pop();
          drum.push({z0,zStart,zEnd:w.__rr.cylZ});marks.push(mark?/No live rounds/.test(mark.text)?0:/Red: (\d+) live rounds/.test(mark.text)?Number(/Red: (\d+)/.exec(mark.text)[1]):1:null);stops.push(stop?/bang/.test(stop.cls):null);
        }
        return {caption,lines,msgs,stops,marks,drum,T};
      },{src:`${base}visual-assets/v10_1/roulette/index.html?embed=1&d=${encodeURIComponent(pair.playerOne)}&n=${encodeURIComponent(pair.playerTwo)}`,setup}).catch(e=>{throw new Error(`${e.message} :: ${errors.slice(0,8).join(' | ')}`);});
      await context.close();
      const marks=out.marks;
      const stops=out.stops;
      const word=k=>k===1?'1 bullet':`${k} bullets`;
      // Daniel's cylinder holds Nik's goals (n), Nik's holds Daniel's (d).
      assert.equal(out.caption,`Daniel ${word(n)} · Nik ${word(d)} · Seven chambers`,`${d}-${n}: setup caption`);
      assert.deepEqual(marks,[n,d],`${d}-${n}: the scene drew the live rounds of each cylinder (${JSON.stringify(out.lines)})`);
      // Nik 2026-11-03: the drum starts where it rested (no jump onto the stop hole) and runs down to the plan's stop chamber.
      const TAU=Math.PI*2,same=(a,b)=>{const d=(((a-b)%TAU)+TAU)%TAU;return d<1e-3||TAU-d<1e-3;};
      out.drum.forEach((r,i)=>{assert.ok(same(r.zStart,r.z0),`${d}-${n} turn ${i+1}: the drum starts from where it rested`);assert.ok(same(r.zEnd,-plan.turns[i].stopChamber*TAU/7),`${d}-${n} turn ${i+1}: the drum stops on chamber ${plan.turns[i].stopChamber}`);});
      assert.deepEqual(stops,plan.turns.map(t=>t.fired),`${d}-${n}: the scene stopped on a live round exactly when the plan fired`);
      if(n===0)assert.equal(stops[0],false,'0 goals: the empty cylinder spins and never fires');
      if(n===7)assert.equal(stops[0],true,'7 goals: a sure hit');
      if(d===0)assert.equal(stops[1],false);if(d===7)assert.equal(stops[1],true);
      if(process.env.SB_TIME)console.log('case',d,n,Date.now()-T0,out.T.join(' '));seen.push(`${d}-${n}: drew ${JSON.stringify(marks)} live, stopped ${JSON.stringify(stops.map(b=>b?'bang':'safe'))}`);
    }
    ok('SB2',`the real 3D scene draws each cylinder's live rounds and fires exactly as planned: ${seen.join('; ')}`);
    finished=true;
    console.log(`PASS r88 Chamber Men bullets scene contracts: ${checks} checks.`);
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
