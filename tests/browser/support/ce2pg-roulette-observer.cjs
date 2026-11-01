"use strict";
// r87 Roster Russian Roulette + squad observer for CE2PG, loaded with NODE_OPTIONS (no edit to the harness):
//   NODE_OPTIONS="--require ./tests/browser/support/ce2pg-roulette-observer.cjs" CE2PG_PLAN=single CE2PG_SEASONS=3 node tests/browser/ce2pg-journey.cjs
// It is inert in every process except the CE2PG run inside the emulators. In each browser it wraps the game's own
// window.CareerModeRosterRoulette.forSeason (the one function both the board and the spins come from) and records every
// call, and it samples the Transfer Challenge state. After each rosterRoulette.waitForTransfer() it pulls that page's log.
// At exit it checks, for every season of the Showdown, on BOTH managers:
//   R1 the roulette ran for this season on this phone (forSeason called for season N)
//   R2 both phones computed the same turns (fired, hit slot, hit player) and the same boards
//   R3 every board is 15 rows: slots 0-10 the XI (bench=false), 11-14 the bench (bench=true, pos SUB), no blank names,
//      no person twice
//   R4 no Special Player (either manager's) on either board
//   R5 a player hit by the roulette never appears on that manager's board again
//   R6 a signing the rival guessed (release=true) never appears on that manager's board in a later season
//   R7 every board player comes from the manager's own club pool (launch XI/subs/reserves) or is one of his kept signings
//   R8 (see ce2pg-roulette-r8.cjs for the timing proof) the window never shows a running phase while spunRoles holds one manager
// Output: test-results/<tag>-roulette.json and "RRR-OBSERVER" lines. CE2PG_RRR_STRICT=1 makes a violation fail the run.
const path=require("node:path");
const fs=require("node:fs");
const isCe2pg=Boolean(process.env.FIRESTORE_EMULATOR_HOST)&&/ce2pg-journey\.cjs$/.test(process.argv[1]||"");
if(isCe2pg)install();

function install(){
  const ROOT=path.resolve(__dirname,"../../..");
  const rr=require("./roster-roulette.cjs");
  const players=require(path.join(ROOT,"data/fifa17Players.js"));
  const pages=new Map();// page -> {role, calls:[], samples:[]}
  const INIT=()=>{
    window.__rrObs={calls:[],samples:[]};
    let real;
    const wrap=api=>{
      if(!api||api.__obs||typeof api.forSeason!=="function")return api;
      const orig=api.forSeason;
      const copy=Object.freeze({...api,__obs:true,forSeason(id,clubs,season,options){
        const out=orig.apply(api,arguments);
        try{window.__rrObs.calls.push(JSON.parse(JSON.stringify({t:Date.now(),id,clubs,season,special:options&&options.special||null,history:options&&options.history||null,
          result:out?{boards:out.boards,turns:out.turns.map(t=>({role:t.role,fired:t.fired,hitSlot:t.hitSlot,player:t.player?{name:t.player.name,number:t.player.number??null}:null}))}:null})));}catch(_e){}
        return out;
      }});
      return copy;
    };
    Object.defineProperty(window,"CareerModeRosterRoulette",{configurable:true,get(){return real;},set(v){real=wrap(v);}});
    setInterval(()=>{
      try{
        const v=window.CareerModeProductionSharedTransferChallenge?.getState?.()||null,st=v&&v.state||null;
        const tc=document.getElementById("transferChallenge");
        const ind=/Season (\d+)/.exec(document.getElementById("seasonIndicator")?.textContent||"");
        const s={t:Date.now(),season:st?.seasonNumber??v?.seasonNumber??(ind?Number(ind[1]):null),phase:st?.phase??null,spunRoles:Array.isArray(v?.spunRoles)?v.spunRoles.slice():null,
          role:v?.managerRole??null,stage:Boolean(document.getElementById("rrStage")),panel:Boolean(document.getElementById("rrStepPanel")),tc:Boolean(tc&&!tc.classList.contains("hidden"))};
        const last=window.__rrObs.samples[window.__rrObs.samples.length-1];
        const key=JSON.stringify({...s,t:0});
        if(!last||last.key!==key){s.key=key;window.__rrObs.samples.push(s);if(window.__rrObs.samples.length>4000)window.__rrObs.samples.shift();}
      }catch(_e){}
    },250);
  };
  const pw=require("playwright");
  const launch=pw.chromium.launch.bind(pw.chromium);
  pw.chromium.launch=async(...args)=>{
    const browser=await launch(...args);
    const newContext=browser.newContext.bind(browser);
    browser.newContext=async(...cargs)=>{const ctx=await newContext(...cargs);await ctx.addInitScript(INIT);return ctx;};
    return browser;
  };
  const pull=async page=>{
    try{
      const log=await page.evaluate(()=>{const o=window.__rrObs||{calls:[],samples:[]};const out={calls:o.calls.splice(0),samples:o.samples.splice(0)};
        out.role=window.CareerModeProductionSharedTransferChallenge?.getState?.()?.managerRole??null;return out;});
      const rec=pages.get(page)||{role:null,calls:[],samples:[]};
      rec.role=rec.role||log.role||(log.samples.find(s=>s.role)||{}).role||null;
      rec.calls.push(...log.calls);rec.samples.push(...log.samples);pages.set(page,rec);
    }catch(_e){}
  };
  const orig=rr.waitForTransfer;
  rr.waitForTransfer=async(page,...rest)=>{
    try{return await orig(page,...rest);}finally{await pull(page);
      if(!page.__rrObsClose){page.__rrObsClose=true;page.on("close",()=>{});}}
  };
  process.on("exit",()=>{
    const problems=[],ok=[];
    const recs=[...pages.values()].filter(r=>r.calls.length||r.samples.length);
    const byRole={};recs.forEach((r,i)=>{const role=r.role||(r.samples.find(s=>s.role)||{}).role||`phone${i+1}`;(byRole[role]=byRole[role]||{calls:[],samples:[]});byRole[role].calls.push(...r.calls);byRole[role].samples.push(...r.samples);});
    const roles=Object.keys(byRole);
    const seasonsTotal=Number(process.env.CE2PG_SEASONS||1);
    const showdownIds=new Set();for(const r of Object.values(byRole))for(const c of r.calls)if(c.result)showdownIds.add(c.id);
    const key=p=>String(p&&p.name||"").normalize("NFD").replace(/[̀-ͯ]/g,"").trim().toLowerCase();
    for(const id of showdownIds){
      const last={};// role -> season -> last call
      for(const [role,r] of Object.entries(byRole))for(const c of r.calls)if(c.id===id&&c.result){(last[role]=last[role]||{})[c.season]=c;}
      const seasons=[...new Set(Object.values(last).flatMap(m=>Object.keys(m).map(Number)))].sort((a,b)=>a-b);
      const hits={playerOne:[],playerTwo:[]},guessed={playerOne:[],playerTwo:[]};
      for(let s=1;s<=Math.max(seasons.at(-1)||0,seasonsTotal);s+=1){
        for(const role of Object.keys(byRole)){if(!(last[role]&&last[role][s]))problems.push(`R1 season ${s}: roulette never ran on ${role}'s phone`);else ok.push(`R1 season ${s}: roulette ran on ${role}'s phone`);}
        if(Object.keys(byRole).length<2)problems.push(`R1 season ${s}: only ${Object.keys(byRole).length} phone(s) observed`);
        const calls=Object.values(last).map(m=>m[s]).filter(Boolean);if(!calls.length)continue;
        const a=calls[0];
        if(calls.length===2){
          const [x,y]=calls.map(c=>JSON.stringify(c.result));
          if(x!==y)problems.push(`R2 season ${s}: the two phones computed different boards/turns`);else ok.push(`R2 season ${s}: same boards and turns on both phones`);
        }
        const specials=a.special?Object.values(a.special).flatMap(p=>[p.name,p.sourceName].filter(Boolean).map(n=>key({name:n}))):[];
        for(const role of ["playerOne","playerTwo"]){
          const board=a.result.boards[role],club=a.clubs[role];
          if(!Array.isArray(board)||board.length!==15){problems.push(`R3 season ${s} ${role}: board has ${board&&board.length} rows`);continue;}
          board.forEach((row,i)=>{if(row.slot!==i||row.bench!==(i>=11)||(i>=11&&row.pos!=="SUB")||!String(row.name||"").trim())problems.push(`R3 season ${s} ${role}: bad row ${i} ${JSON.stringify(row)}`);});
          const ids=board.map(r=>key(r)+"#"+(r.number??""));if(new Set(ids).size!==15)problems.push(`R3 season ${s} ${role}: a player is on the board twice`);
          for(const row of board)if(specials.includes(key(row)))problems.push(`R4 season ${s} ${role}: Special Player ${row.name} is on the board`);
          for(const h of hits[role])if(board.some(r=>key(r)===key(h)&&(h.number==null||r.number==null||r.number===h.number)))problems.push(`R5 season ${s} ${role}: ${h.name} (hit in season ${h.season}) is back on the board`);
          for(const g of guessed[role])if(board.some(r=>key(r)===key(g)))problems.push(`R6 season ${s} ${role}: guessed signing ${g.name} (season ${g.season}) is on the board`);
          const pool=new Set(((players.clubs[club]||{}).players||[]).map(r=>key({name:r[0]})));
          const signed=new Set();for(let k=1;k<s;k+=1)for(const v of (a.history&&a.history[k]&&a.history[k][role])||[])if(v&&v.release===false)signed.add(key(v));
          for(const row of board)if(!pool.has(key(row))&&!signed.has(key(row)))problems.push(`R7 season ${s} ${role}: ${row.name} is neither a ${club} player nor a kept signing`);
          if(!problems.some(p=>p.startsWith(`R3 season ${s} ${role}`)||p.startsWith(`R4 season ${s} ${role}`)||p.startsWith(`R5 season ${s} ${role}`)||p.startsWith(`R6 season ${s} ${role}`)))ok.push(`R3-R6 season ${s} ${role}: 11 + 4, no SP, no hit or guessed player back`);
        }
        for(const t of a.result.turns)if(t.fired&&t.player)hits[t.role].push({...t.player,season:s});
        // Next season's history tells us this season's guesses; read them from the next call when there is one.
        const nextCall=Object.values(last).map(m=>m[s+1]).find(Boolean);
        if(nextCall&&nextCall.history&&nextCall.history[s])for(const role of ["playerOne","playerTwo"])for(const v of nextCall.history[s][role]||[])if(v&&v.release===true)guessed[role].push({name:v.name,season:s});
      }
    }
    // R8: in every phone's samples, the Transfer Challenge never shows a running window (phase past START) for a season whose
    // spunRoles (as that phone last saw it) did not hold both managers.
    for(const [role,r] of Object.entries(byRole)){
      const sorted=r.samples.slice().sort((a,b)=>a.t-b.t);
      let lastSpun={};
      for(const s of sorted){
        if(s.spunRoles)lastSpun[s.season]=s.spunRoles;
        const open=s.tc&&s.phase&&!/^(start|START|waiting|WAITING|not_started|NOT_STARTED|idle|IDLE|ready|READY)$/.test(String(s.phase))&&!s.stage&&!s.panel;
        if(open&&s.spunRoles&&s.spunRoles.length<2&&String(s.phase)!=="COMPLETED")problems.push(`R8 ${role} season ${s.season}: window phase ${s.phase} with spunRoles ${JSON.stringify(s.spunRoles)}`);
      }
    }
    const phases={};for(const r of Object.values(byRole))for(const s of r.samples)phases[s.phase]=(phases[s.phase]||0)+1;
    const report={roles,showdowns:[...showdownIds].length,calls:Object.fromEntries(Object.entries(byRole).map(([k,v])=>[k,v.calls.length])),phasesSeen:phases,ok,problems:[...new Set(problems)],byRole};
    const tag=(process.env.CE2PG_PLAN==="single"?`ce2pg-single-${seasonsTotal}-${process.env.CE2PG_RUN||1}${process.env.CE2PG_SCENARIO?`-${process.env.CE2PG_SCENARIO}`:""}`:`ce2pg-main-${process.env.CE2PG_RUN||1}`);
    try{fs.mkdirSync(path.join(ROOT,"test-results"),{recursive:true});fs.writeFileSync(path.join(ROOT,"test-results",`${tag}-roulette.json`),JSON.stringify(report,null,1));}catch(_e){}
    console.log(`RRR-OBSERVER roles=${roles.join(",")} showdowns=${report.showdowns} calls=${JSON.stringify(report.calls)} ok=${ok.length} problems=${report.problems.length}`);
    for(const p of report.problems.slice(0,40))console.log(`RRR-OBSERVER PROBLEM ${p}`);
    if(report.problems.length&&process.env.CE2PG_RRR_STRICT==="1")process.exitCode=1;
  });
}
