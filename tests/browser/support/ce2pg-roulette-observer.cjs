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
// r88 Chamber Men (owner, 2026-11-03: the roulette's live chambers must EXACTLY match the shootout's goals), for every season
// on BOTH phones (a Showdown that plays Chamber Men, CMS_CHAMBER_MEN_NOW=1):
//   C1 the finished shootout record (each phone's kept copy) is the same on both phones and complete (14 kicks)
//   C2 the cylinders the roulette engine received (options.chambers[season]) are the ones js/chamberMen.js computes from it
//   C3 each manager's turn loads exactly the chambers of the rival's goals: live count == rival's goals, chamber k live ==
//      the rival's k-th shot went in
//   C4 the spin fires exactly when it stops on a live chamber (fired === live[stopChamber]): never on an empty one
//   C5 the scene got the same live chambers and fire for both turns, and drew that many live rounds ("Red: k live rounds" /
//      "No live rounds"), its stop line saying fired or safe as planned
//   C6 the two phones computed the same spins
// Any C problem fails the run (no strict flag needed). The per-season table goes to test-results/<tag>-bullets.md.
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
    // r88: inside the roulette scene's frame, record the setup it receives and what it draws (the result line), into the parent.
    if(/\/roulette\//.test(location.pathname)&&window.parent!==window){
      const log=entry=>{try{const o=window.parent.__rrObs;if(o){o.scene.push({t:Date.now(),...entry});if(o.scene.length>2000)o.scene.shift();}}catch(_e){}};
      addEventListener("message",e=>{const d=e.data;if(d&&d.type==="cms-rr-setup"&&Array.isArray(d.turns))log({kind:"setup",d:d.d,n:d.n,turns:d.turns.map(t=>({fire:t.fire,stopChamber:t.stopChamber,loadedChambers:t.loadedChambers}))});});
      const watch=()=>{const el=document.getElementById("result");if(!el){setTimeout(watch,100);return;}
        let last="";new MutationObserver(()=>{const v=`${el.className}|${el.textContent}`;if(v!==last){last=v;log({kind:"line",cls:el.className,text:el.textContent});}}).observe(el,{childList:true,characterData:true,subtree:true,attributes:true});};
      if(document.readyState==="loading")addEventListener("DOMContentLoaded",watch);else watch();
      return;
    }
    window.__rrObs={calls:[],samples:[],scene:[]};
    // The scene reports a browser without WebGL (CE2PG's headless Chromium); the step then shows its result card instead.
    addEventListener("message",e=>{const d=e.data;if(d&&d.type==="cms-rr-error")window.__rrObs.scene.push({t:Date.now(),kind:"error",message:String(d.message||"")});});
    let lastPanel="";
    setInterval(()=>{try{const el=document.getElementById("rrStepPanel");const text=el?el.innerText||el.textContent||"":"";if(text&&text!==lastPanel){lastPanel=text;window.__rrObs.scene.push({t:Date.now(),kind:"panel",text});}}catch(_e){}},250);
    let real;
    const wrap=api=>{
      if(!api||api.__obs||typeof api.forSeason!=="function")return api;
      const orig=api.forSeason;
      const copy=Object.freeze({...api,__obs:true,forSeason(id,clubs,season,options){
        const out=orig.apply(api,arguments);
        try{window.__rrObs.calls.push(JSON.parse(JSON.stringify({t:Date.now(),id,clubs,season,special:options&&options.special||null,history:options&&options.history||null,
          chambers:options&&options.chambers&&options.chambers[season]||null,chamberMen:Boolean(options&&options.chamberMen),
          result:out?{boards:out.boards,turns:out.turns.map(t=>({role:t.role,fired:t.fired,hitSlot:t.hitSlot,player:t.player?{name:t.player.name,number:t.player.number??null}:null,
            stopChamber:t.stopChamber,bulletChamber:t.bulletChamber,loadedChambers:t.loadedChambers??null}))}:null})));}catch(_e){}
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
      const log=await page.evaluate(()=>{const o=window.__rrObs||{calls:[],samples:[],scene:[]};const out={calls:o.calls.splice(0),samples:o.samples.splice(0),scene:(o.scene||[]).splice(0)};
        out.role=window.CareerModeProductionSharedTransferChallenge?.getState?.()?.managerRole??null;
        try{out.kept=JSON.parse(localStorage.getItem("careerModeShowdown.chamberMenKicks.v2")||"[]");}catch(_e){out.kept=[];}
        return out;});
      const rec=pages.get(page)||{role:null,calls:[],samples:[],scene:[],kept:new Map()};
      rec.role=rec.role||log.role||(log.samples.find(s=>s.role)||{}).role||null;
      rec.calls.push(...log.calls);rec.samples.push(...log.samples);rec.scene.push(...log.scene);
      for(const item of Array.isArray(log.kept)?log.kept:[])if(Array.isArray(item)&&typeof item[0]==="string")rec.kept.set(item[0],item[1]);
      pages.set(page,rec);
    }catch(_e){}
  };
  const orig=rr.waitForTransfer;
  rr.waitForTransfer=async(page,...rest)=>{
    // CE2PG passes one page or both managers' pages (an array); pull each one's log.
    try{return await orig(page,...rest);}finally{for(const p of [].concat(page).filter(Boolean)){await pull(p);
      if(!p.__rrObsClose&&typeof p.on==="function"){p.__rrObsClose=true;p.on("close",()=>{});}}}
  };
  process.on("exit",()=>{
    const problems=[],ok=[];
    const recs=[...pages.values()].filter(r=>r.calls.length||r.samples.length);
    const byRole={};recs.forEach((r,i)=>{const role=r.role||(r.samples.find(s=>s.role)||{}).role||`phone${i+1}`;(byRole[role]=byRole[role]||{calls:[],samples:[],scene:[],kept:new Map()});byRole[role].calls.push(...r.calls);byRole[role].samples.push(...r.samples);byRole[role].scene.push(...(r.scene||[]));for(const [k,v] of r.kept||[])byRole[role].kept.set(k,v);});
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
    const chamber=chamberChecks(byRole,showdownIds,seasonsTotal);
    for(const r of Object.values(byRole))r.kept=Object.fromEntries(r.kept);
    const report={roles,showdowns:[...showdownIds].length,calls:Object.fromEntries(Object.entries(byRole).map(([k,v])=>[k,v.calls.length])),phasesSeen:phases,ok,problems:[...new Set(problems)],chamber,byRole};
    const tag=(process.env.CE2PG_PLAN==="single"?`ce2pg-single-${seasonsTotal}-${process.env.CE2PG_RUN||1}${process.env.CE2PG_SCENARIO?`-${process.env.CE2PG_SCENARIO}`:""}`:`ce2pg-main-${process.env.CE2PG_RUN||1}`);
    try{fs.mkdirSync(path.join(ROOT,"test-results"),{recursive:true});fs.writeFileSync(path.join(ROOT,"test-results",`${tag}-roulette.json`),JSON.stringify(report,null,1));}catch(_e){}
    console.log(`RRR-OBSERVER roles=${roles.join(",")} showdowns=${report.showdowns} calls=${JSON.stringify(report.calls)} ok=${ok.length} problems=${report.problems.length}`);
    for(const p of report.problems.slice(0,40))console.log(`RRR-OBSERVER PROBLEM ${p}`);
    if(report.problems.length&&process.env.CE2PG_RRR_STRICT==="1")process.exitCode=1;
    if(chamber.applies){
      try{fs.writeFileSync(path.join(ROOT,"test-results",`${tag}-bullets.md`),chamber.table);}catch(_e){}
      console.log(`CHAMBER-BULLETS seasons=${chamber.seasons} rows=${chamber.rows.length} ok=${chamber.ok.length} problems=${chamber.problems.length} -> test-results/${tag}-bullets.md`);
      console.log(chamber.table);
      for(const p of chamber.problems.slice(0,60))console.log(`CHAMBER-BULLETS PROBLEM ${p}`);
      if(chamber.problems.length)process.exitCode=1;
    }
  });
  // r88 Chamber Men: C1-C6 (see the top of this file).
  function chamberChecks(byRole,showdownIds,seasonsTotal){
    const CM=require(path.join(ROOT,"js/chamberMen.js"));
    const NAMES={playerOne:"Daniel",playerTwo:"Nik"},OTHER={playerOne:"playerTwo",playerTwo:"playerOne"};
    const problems=[],ok=[],rows=[];
    const phones=Object.keys(byRole).filter(r=>r==="playerOne"||r==="playerTwo");
    const applies=process.env.CMS_CHAMBER_MEN_NOW==="1"||Object.values(byRole).some(r=>r.calls.some(c=>c.chamberMen));
    if(!applies)return {applies:false,problems,ok,rows,seasons:0,table:""};
    let seasons=0;
    for(const id of showdownIds){
      for(let s=1;s<=seasonsTotal;s+=1){
        seasons+=1;
        // C1: the finished record on each phone.
        const records={};
        for(const role of phones){const v=byRole[role].kept.get(`${id}|${s}`);records[role]=v?CM.record(v):null;}
        for(const role of phones){if(!records[role])problems.push(`C1 season ${s}: ${NAMES[role]}'s phone kept no finished Chamber Men record`);else if(!CM.progress(records[role]).complete)problems.push(`C1 season ${s}: ${NAMES[role]}'s record is not complete`);}
        const recs=phones.map(r=>records[r]).filter(Boolean);
        if(recs.length===2&&JSON.stringify(recs[0])!==JSON.stringify(recs[1]))problems.push(`C1 season ${s}: the two phones kept different records ${JSON.stringify(recs)}`);
        const record=recs[0];if(!record||!CM.progress(record).complete)continue;
        ok.push(`C1 season ${s}: the same finished record on both phones`);
        const kicks=CM.kicksOf(record),score=CM.score(record),cyl=CM.cylinders(record);
        const spins={};
        for(const phone of phones){
          const call=[...byRole[phone].calls].reverse().find(c=>c.id===id&&c.season===s&&c.result);
          if(!call){problems.push(`C2 season ${s}: no roulette spin recorded on ${NAMES[phone]}'s phone`);continue;}
          // C2
          const got=call.chambers&&{playerOne:call.chambers.playerOne,playerTwo:call.chambers.playerTwo};
          if(JSON.stringify(got)!==JSON.stringify({playerOne:[...cyl.playerOne],playerTwo:[...cyl.playerTwo]}))problems.push(`C2 season ${s} ${NAMES[phone]}'s phone: the roulette got cylinders ${JSON.stringify(call.chambers)}, the shootout gives ${JSON.stringify(cyl)}`);
          else ok.push(`C2 season ${s} ${NAMES[phone]}'s phone: cylinders from the shootout`);
          spins[phone]=call.result.turns;
          for(const turn of call.result.turns){
            const role=turn.role,rival=OTHER[role];
            const rivalShots=kicks.filter(k=>k.shooter===rival);
            const want=rivalShots.map((k,i)=>k.goal?i:-1).filter(i=>i>=0);
            const live=Array.isArray(turn.loadedChambers)?turn.loadedChambers:null;
            // C3
            if(!live||JSON.stringify(live)!==JSON.stringify(want)||live.length!==score[rival])problems.push(`C3 season ${s} ${NAMES[phone]}'s phone, ${NAMES[role]}'s turn: live chambers ${JSON.stringify(live)}, ${NAMES[rival]}'s goals give ${JSON.stringify(want)} (${score[rival]} goals)`);
            // C4
            const shouldFire=want.includes(turn.stopChamber);
            if(turn.fired!==shouldFire)problems.push(`C4 season ${s} ${NAMES[phone]}'s phone, ${NAMES[role]}'s turn: stopped on chamber ${turn.stopChamber} (${shouldFire?"live":"empty"}) and fired=${turn.fired}`);
            if(phone===role)rows.push({season:s,manager:NAMES[role],rivalGoals:score[rival],live:live?live.map(i=>i+1).join(" ")||"none":"?",liveCount:live?live.length:null,stop:turn.stopChamber+1,stopLive:shouldFire,fired:turn.fired,shots:rivalShots.map(k=>k.goal?"G":(k.shotSide==="-"?"-":"x")).join("")});
          }
          // C5: what this phone showed: the 3D scene (the setup it got and the lines it drew), or, in a browser without WebGL,
          // the step's result card ("Daniel's cylinder held k live rounds of 7", "lost ..." / "empty chamber").
          const scene=byRole[phone].scene,setups=scene.map((e,i)=>({e,i})).filter(x=>x.e.kind==="setup");
          const match=setups.filter(x=>JSON.stringify(x.e.turns.map(t=>t.loadedChambers))===JSON.stringify(call.result.turns.map(t=>t.loadedChambers))&&JSON.stringify(x.e.turns.map(t=>t.stopChamber))===JSON.stringify(call.result.turns.map(t=>t.stopChamber))).at(-1);
          const shown={};// role -> words for the table
          if(match){
            const fires=match.e.turns.map(t=>t.fire);
            if(JSON.stringify(fires)!==JSON.stringify(call.result.turns.map(t=>t.fired)))problems.push(`C5 season ${s} ${NAMES[phone]}'s phone: the scene was told fire=${JSON.stringify(fires)}`);
            const nextSetup=setups.find(x=>x.i>match.i),lines=scene.slice(match.i+1,nextSetup?nextSetup.i:undefined).filter(e=>e.kind==="line");
            const marks=lines.filter(e=>/live round|No live rounds/.test(e.text)&&/Gold: fires/.test(e.text)).map(e=>{const m=/Red: (\d+) live rounds/.exec(e.text);return /No live rounds/.test(e.text)?0:m?Number(m[1]):/Red: live round/.test(e.text)?1:null;});
            const stops=lines.filter(e=>/\bresult (bang|safe)\b/.test(e.cls)).map(e=>/bang/.test(e.cls)).slice(0,marks.length);
            const wantMarks=call.result.turns.map(t=>t.loadedChambers.length);
            if(!marks.length)problems.push(`C5 season ${s} ${NAMES[phone]}'s phone: the scene drew no live-round line`);
            else if(JSON.stringify(marks)!==JSON.stringify(wantMarks.slice(0,marks.length)))problems.push(`C5 season ${s} ${NAMES[phone]}'s phone: the scene drew ${JSON.stringify(marks)} live rounds, the cylinders hold ${JSON.stringify(wantMarks)}`);
            else if(JSON.stringify(stops)!==JSON.stringify(fires.slice(0,stops.length)))problems.push(`C5 season ${s} ${NAMES[phone]}'s phone: the scene's stop lines say ${JSON.stringify(stops)}, planned ${JSON.stringify(fires)}`);
            else ok.push(`C5 season ${s} ${NAMES[phone]}'s phone: the scene drew ${JSON.stringify(marks)} live rounds and stopped ${JSON.stringify(stops)}`);
            call.result.turns.forEach((t,i)=>{shown[t.role]=marks[i]!==undefined?`scene: ${marks[i]} live, ${stops[i]===undefined?"?":stops[i]?"fired":"safe"}`:"scene: not drawn";});
          }else{
            const noGl=scene.some(e=>e.kind==="error"&&/WebGL/i.test(e.message));
            const card=scene.filter(e=>e.kind==="panel"&&/cylinder held/.test(e.text)).map(e=>e.text);
            const text=card.filter(t=>new RegExp(`^\\s*SEASON ${s} `).test(t)).reverse().find(t=>call.result.turns.every(turn=>new RegExp(`${NAMES[turn.role]}'s cylinder held ${turn.loadedChambers.length} live`).test(t)));
            if(!text)problems.push(`C5 season ${s} ${NAMES[phone]}'s phone: neither the scene nor the result card showed this season's live rounds (${noGl?"no WebGL; ":""}card: ${JSON.stringify(card.slice(-1))})`);
            else{
              for(const turn of call.result.turns){
                const said=new RegExp(`${NAMES[turn.role]} lost `).test(text)?true:new RegExp(`${NAMES[turn.role]}: empty chamber`).test(text)?false:null;
                if(said!==turn.fired)problems.push(`C5 season ${s} ${NAMES[phone]}'s phone: the card says ${NAMES[turn.role]} ${said===null?"nothing":said?"lost a player":"was safe"}, the spin fired=${turn.fired}`);
                shown[turn.role]=`card${noGl?" (no WebGL)":""}: ${turn.loadedChambers.length} live, ${said?"lost a player":"safe"}`;
              }
              ok.push(`C5 season ${s} ${NAMES[phone]}'s phone: the result card names each cylinder's live rounds and outcome`);
            }
          }
          for(const r of rows.filter(r=>r.season===s&&r.manager===NAMES[phone]))r.scene=shown[phone==="playerOne"?"playerOne":"playerTwo"]||"?";
        }
        // C6
        if(phones.length===2&&spins.playerOne&&spins.playerTwo){
          const strip=t=>t.map(x=>({role:x.role,fired:x.fired,stopChamber:x.stopChamber,loadedChambers:x.loadedChambers}));
          if(JSON.stringify(strip(spins.playerOne))!==JSON.stringify(strip(spins.playerTwo)))problems.push(`C6 season ${s}: the two phones computed different spins`);
          else ok.push(`C6 season ${s}: the same spins on both phones`);
        }
      }
    }
    const head="| Season | Manager | Rival's goals (rival's 7 shots: G goal, x saved, - out of time) | Live chambers (1-7) | Stop chamber | Stop on live | Fired | Scene (this manager's phone) |\n|---|---|---|---|---|---|---|---|\n";
    const body=rows.sort((a,b)=>a.season-b.season||a.manager.localeCompare(b.manager)).map(r=>`| ${r.season} | ${r.manager} | ${r.rivalGoals} (${r.shots}) | ${r.live} | ${r.stop} | ${r.stopLive?"yes":"no"} | ${r.fired?"FIRED":"safe"} | ${r.scene||"?"} |`).join("\n");
    const table=`${head}${body}\n\nChecks: ${ok.length} ok, ${problems.length} problem(s).${problems.length?"\n"+problems.map(p=>`- ${p}`).join("\n"):""}\n`;
    return {applies:true,problems:[...new Set(problems)],ok,rows,seasons,table};
  }
}
