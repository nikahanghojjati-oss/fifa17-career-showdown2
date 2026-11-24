"use strict";
// POS1M Ring 3 meter (test-only): what a Showdown costs in time and in Firebase, per step, measured on the real game in CE2PG.
// The page side records, on each phone, every trusted tap and every change of (active screen, Reus Gate loading screen shown)
// with the wall clock (both phones run on this machine, so their clocks agree). summarize() turns that into:
//   tapToReady   a tap that moves the phone to another screen -> that screen shown with the loading screen gone, per step,
//                at its full duration however long it takes
//   reusHold     how long the loading screen (Reus Gate) stays up each time it shows, per screen it opens onto
//   rivalToScreen  a phone moves to a new screen after the rival's tap, not its own (the rival's move carried it) -> time
//                  since that tap, per screen
// The timings, like the Firebase figures, cover only the seasons' play windows (CE2PG meterEntry); the raw samples stay in
// report.ring3.samples.
//   seasons      minutes per season outside FIFA (the harness types the FIFA results at once, so FIFA time is stubbed out),
//                billed reads (documents + Rules lookups) and writes per season, both phones, from the CE2PG meter
//   steps        billed reads and writes per step (screen), both phones, per season played
// No game code reads it; the recorder only listens. CE2PG_RING3=0 turns it off.
const ENABLED=process.env.CE2PG_RING3!=="0";

async function install(context,user,sink){
  if(!ENABLED)return;
  await context.exposeBinding("__cmsRing3",(_source,event)=>{sink.push({...event,user});});
  await context.addInitScript(()=>{
    const send=e=>{try{if(typeof window.__cmsRing3==="function")void window.__cmsRing3(e);}catch(_e){}};
    const loadingShown=()=>{const n=document.getElementById("loadingScreen");if(!n||n.hidden||n.classList.contains("hidden"))return false;const st=getComputedStyle(n);return st.display!=="none"&&st.visibility!=="hidden"&&Number(st.opacity)>0.01;};
    // The step: the active screen, plus the top open game dialog on it (Prime Pack, Roulette, Chamber Men, a marble confirm).
    const baseScreen=()=>{try{if(typeof window.getActiveScreenName==="function"){const s=window.getActiveScreenName();if(s)return String(s);}}catch(_e){}const s=document.querySelector(".screen:not(.hidden)");return s?s.id:"";};
    const screenNow=()=>{const base=baseScreen();const open=[...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].filter(d=>!d.hidden&&d.getClientRects().length>0&&getComputedStyle(d).visibility!=="hidden");const top=open[open.length-1];return top?`${base}/${top.id||top.getAttribute("aria-label")||"dialog"}`:base;};
    let last=null,queued=false;
    const sample=()=>{queued=false;const state={screen:screenNow(),loading:loadingShown()};if(!last||state.screen!==last.screen||state.loading!==last.loading){last=state;send({k:"state",t:Date.now(),...state});}};
    const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(sample);};
    send({k:"boot",t:Date.now()});
    const start=()=>{try{new MutationObserver(queue).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:["class","hidden","style","aria-hidden"],childList:true});}catch(_e){}sample();setInterval(sample,250);};
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
    window.addEventListener("click",event=>{if(!event.isTrusted)return;const b=event.target&&event.target.closest&&event.target.closest("button,.menuTile,[role=button],a");if(!b)return;send({k:"tap",t:Date.now(),id:b.id||"",screen:last?last.screen:screenNow()});},true);
  });
}

const stat=values=>{
  const v=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!v.length)return null;
  const q=p=>v[Math.min(v.length-1,Math.floor(p*(v.length-1)+0.5))];
  return {n:v.length,median:q(0.5),p90:q(0.9),max:v[v.length-1]};
};
const group=(rows,key,val)=>{const out={};for(const r of rows)(out[key(r)]||(out[key(r)]=[])).push(val(r));const res={};for(const k of Object.keys(out).sort())res[k]=stat(out[k]);return res;};
const baseUser=u=>String(u||"").replace(/-fresh$/,"");

function seasonMinutes(phases){
  // Minutes per season outside FIFA: the season's play phases, page checks left out. A season's own steps (Roulette, Prime Pack,
  // Chamber Men, the squad) run after the CONTINUE of the season before (season 1: after START, JOIN and setup), so
  // S<k>-continue counts for season k+1.
  const seasonMs={};
  for(const p of phases){
    let m,k=null;
    if((m=/^(.*)-S(\d+)-(transfers|results|commit)$/.exec(p.phase)))k=`${m[1]}/S${m[2]}`;
    else if((m=/^(.*)-S(\d+)-continue$/.exec(p.phase)))k=`${m[1]}/S${Number(m[2])+1}`;
    else if((m=/^(.*)-(setup|start|join)$/.exec(p.phase)))k=`${m[1]}/S1`;
    if(k)seasonMs[k]=(seasonMs[k]||0)+p.ms;
  }
  return Object.entries(seasonMs).map(([season,ms])=>({season,minutes:+(ms/60000).toFixed(2)}));
}

// events: the recorder's sink; meterEvents: the CE2PG meter's events; phases: report.timings.phases; meterEntries: report.meter;
// playWindows: the seasons' play windows [from,to) (CE2PG meterEntry); attribute(events, allEvents, keyFn) -> Map key ->
// {docs, rules, writes} (billed-meter.cjs attribute with the run's Rules model).
function summarize({events,meterEvents=[],phases=[],meterEntries=[],playWindows=null,attribute=null}){
  if(!ENABLED)return null;
  const byUser={};for(const e of events)(byUser[e.user]||(byUser[e.user]=[])).push(e);
  const taps=[],holds=[],rival=[],timed=[],intervals=[];
  const users=Object.keys(byUser);
  for(const user of users){
    const list=byUser[user].sort((a,b)=>a.t-b.t);
    let state=null,since=null,bootAt=-Infinity,loadingFrom=null,settled=null,regated=null;
    const changes=[];
    for(const e of list){
      if(e.k==="boot"){bootAt=e.t;if(state&&since!==null)intervals.push({user,screen:state.screen,from:since,to:e.t});state=null;since=null;loadingFrom=null;settled=null;regated=null;continue;}
      if(e.k!=="state")continue;
      if(e.loading&&loadingFrom===null)loadingFrom=e.t;
      if(!e.loading&&loadingFrom!==null){holds.push({user,t:e.t,screen:e.screen,ms:e.t-loadingFrom,boot:loadingFrom-bootAt<1000});loadingFrom=null;}
      if(state&&since!==null&&e.screen!==state.screen)intervals.push({user,screen:state.screen,from:since,to:e.t});
      if(!state||e.screen!==state.screen)since=e.t;
      // A step is ready when its screen shows with the Reus Gate down. A screen change made under the gate counts when the gate
      // clears; a screen that showed and then had the gate rise on it within 300 ms is ready only when that gate clears.
      if(e.loading){
        const last=changes[changes.length-1];
        if(last&&last.to===e.screen&&e.t-last.t<=300&&!regated){regated=changes.pop();settled=last.from;}
      }else{
        if(regated&&regated.to===e.screen){regated.t=e.t;changes.push(regated);settled=e.screen;}
        else if(settled!==null&&e.screen!==settled&&e.t-bootAt>2000){changes.push({t:e.t,from:settled,to:e.screen});settled=e.screen;}
        else settled=e.screen;
        regated=null;
      }
      state={screen:e.screen,loading:e.loading};
    }
    if(state&&since!==null)intervals.push({user,screen:state.screen,from:since,to:list.length?list[list.length-1].t:since});
    // Who moved this phone: each ready change is timed from the last tap before it, on either phone. The phone's own last tap
    // (with no rival tap after it) makes it tap -> ready at its full duration, however long; a rival's tap within 60 s makes it
    // rival move -> screen; anything else (a game timer, a reload) is counted as timed, not budgeted.
    const own=list.filter(e=>e.k==="tap");
    const rivals=users.filter(u=>baseUser(u)!==baseUser(user)).flatMap(u=>byUser[u].filter(e=>e.k==="tap"));
    let prev=-Infinity;
    for(const c of changes){
      const mine=own.filter(t=>t.t>prev&&t.t<c.t).pop()||null;
      const theirs=rivals.filter(t=>t.t<c.t).sort((a,b)=>a.t-b.t).pop()||null;
      if(mine&&!(theirs&&theirs.t>mine.t))taps.push({user,t:c.t,step:`${c.from||"?"} -> ${c.to||"?"}`,ms:c.t-mine.t});
      else if(theirs&&c.t-theirs.t<=60_000)rival.push({user,t:c.t,step:c.to||"?",ms:c.t-theirs.t});
      else timed.push({user,t:c.t,step:c.to||"?"});
      prev=c.t;
    }
  }
  const seasons=meterEntries.filter(e=>e.billed&&e.billed.measured).map(e=>({label:e.label,billed:e.billed.measured.billed,docReads:e.billed.measured.docReads,rulesLookups:e.billed.measured.rulesReads+(e.billed.measured.rulesOnWrites||0),writes:e.billed.measured.writes}));
  const minutes=seasonMinutes(phases);
  // Billed reads and writes per step (screen), both phones, averaged per season played: only the events inside the seasons'
  // play windows (the same ones the season totals use, so sign-in, page checks and the end checks are left out), priced in
  // time order with one listener state (billed-meter.cjs attribute), so a listener attached on one step and first delivered
  // on the next is priced once.
  let steps=null;
  if(attribute&&intervals.length){
    const n=Math.max(1,seasons.length);
    const all=meterEvents.filter(e=>e.k==="read"||e.k==="write"||e.k==="listener");
    const inPlay=e=>!playWindows||playWindows.some(([a,b])=>e.t>=a&&e.t<b);
    const ofUser={};for(const i of intervals.sort((a,b)=>a.from-b.from))(ofUser[i.user]||(ofUser[i.user]=[])).push(i);
    const stepOf=e=>{const list=ofUser[e.user];const i=list&&list.find(x=>e.t>=x.from&&e.t<x.to);return i?i.screen||"?":"(between screens)";};
    const out=attribute(all.filter(inPlay).sort((a,b)=>a.t-b.t),all,stepOf);
    steps=Object.fromEntries([...out.entries()].map(([k,v])=>[k,{billedPerSeason:+((v.docs+v.rules)/n).toFixed(1),writesPerSeason:+(v.writes/n).toFixed(1)}]).sort((a,b)=>b[1].billedPerSeason-a[1].billedPerSeason));
  }
  // The budgets cover the seasons' play only, like the season totals: samples outside the play windows (sign-in, the career
  // page checks, the end checks) are kept in the report but left out of every figure.
  const inWindow=x=>!playWindows||playWindows.some(([a,b])=>x.t>=a&&x.t<b);
  const T=taps.filter(inWindow),H=holds.filter(h=>!h.boot&&inWindow(h)),V=rival.filter(inWindow);
  return {
    schema:2,
    scope:playWindows?"season play windows":"whole run",
    tapToReady:group(T,r=>r.step,r=>r.ms),
    reusHold:group(H,r=>r.screen||"?",r=>r.ms),
    reusHoldAtBoot:stat(holds.filter(h=>h.boot).map(h=>h.ms)),
    rivalToScreen:group(V,r=>r.step,r=>r.ms),
    timedChanges:timed.filter(inWindow).length,
    seasons:{billed:seasons,minutesOutsideFifa:minutes},
    steps,
    all:{tapToReady:stat(T.map(r=>r.ms)),reusHold:stat(H.map(h=>h.ms)),rivalToScreen:stat(V.map(r=>r.ms))},
    samples:{tapToReady:taps,reusHold:holds,rivalToScreen:rival,timed}
  };
}

module.exports={install,summarize,seasonMinutes,enabled:ENABLED};
