"use strict";
// r88 LOCK refusals (Nik 2026-11-03). The Transfer War LOCK refuses, for the manager concerned only:
//   - a player the roulette shot on his board in any season up to this one (club player or signing): he can never come back;
//   - his own signing the rival guessed in an earlier season: he can never be signed again by him (the rival may sign him).
// A refused name is exactly a name js/rosterRoulette.js would keep off his next board (plan.skipped reason "shot" /
// "guessed"), and every other name is accepted (no false refusal). It refuses on a fresh browser that kept nothing too:
// what is missing is read once with the roulette's own plain gets, then kept (the next LOCK reads nothing), and a phone that
// ran the roulette reads nothing at all.
//   LR1  oracle: 160 random 6-season careers with forced and random shots and guesses, both managers, every season:
//        refusal set == the engine's next-board exclusion (shot/guessed) for every candidate name
//   LR2  shot club player: refused as a signing, the same season and later; his board namesake rows untouched
//   LR3  shot signing: refused when entered again
//   LR4  guessed: refused for his manager, the rival may sign him (rival-can-sign); a club player with the guessed
//        signing's name stays on the board and an unrelated own-club name or kept signing is not refused
//   LR5  LOCK wiring: pstcBuildSignings refuses with the plain words (even for a hyphenated name), shot wins over guessed,
//        the error is a form mistake (shown, not reported), nothing locks
//   LR6  fresh browser: nothing kept -> reads (3 gets per earlier season, 1 for this season's record), refuses; second LOCK
//        and a phone that ran the roulette: 0 reads; a failed read refuses the LOCK with TRY AGAIN words (never accepts)
//   LR7  Showdowns from before Roster Roulette: nothing refused, nothing read; no listener anywhere in the new code
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const R=require(path.join(ROOT,"js/rosterRoulette.js"));
const P=require(path.join(ROOT,"data/fifa17Players.js"));
const SQ=require(path.join(ROOT,"data/rosterSquads.js")).squads;
const FILE=path.join(ROOT,"js/productionSharedTransferChallenge.js");
const source=fs.readFileSync(FILE,"utf8");
const api=require(FILE);
const ROLES=["playerOne","playerTwo"],other=r=>r==="playerOne"?"playerTwo":"playerOne";
let checks=0;
function check(id,label,fn){fn();checks+=1;process.stdout.write(`ok ${checks} ${id} ${label}\n`);}
const key=n=>String(n||"").normalize("NFD").replace(/[̀-ͯ]/g,"").trim().toLowerCase();

// ---- deterministic random ----
function rng(seed){let a=seed>>>0;return ()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};}
const hexOf=rand=>Array.from({length:64},()=>"0123456789abcdef"[Math.floor(rand()*16)]).join("");
const CLUBS=Object.keys(SQ).filter(c=>P.clubs[c]&&R.board(c));
const POS=["GK","RB","CB","LB","CDM","CM","CAM","RM","LM","RW","LW","ST"];

// The engine's verdict for one candidate name signed by role in window s, from the engine itself: the next season's board is
// built (history[s] holds the candidates, kept, release false; hits[s] the saved spin) by a copy of js/rosterRoulette.js whose
// only change is a probe after the history loop that asks its own rrExcluded about each candidate as a window-s signing.
// plan.skipped must agree too (it lists the shot/guessed ones it saw; a name already signed in an earlier window is not
// re-listed, so it is a subset).
const ENGINE_SOURCE=fs.readFileSync(path.join(ROOT,"js/rosterRoulette.js"),"utf8"),PROBE_AT="      const board=state.board;\n";
assert.equal(ENGINE_SOURCE.split(PROBE_AT).length,2,"one probe point in the engine");
const probe=(()=>{const ctx={module:{exports:{}},require:p=>require(path.resolve(ROOT,"js",p)),console};ctx.globalThis=ctx;vm.createContext(ctx);
  vm.runInContext(ENGINE_SOURCE.replace(PROBE_AT,PROBE_AT+"      if(root.__probe)root.__probe(role,p=>rrExcluded(state,p),p=>rrKey(p));\n"),ctx,{filename:"rosterRoulette.js"});return {R:ctx.module.exports,ctx};})();
function engineSkips(id,clubs,season,history,hits,role,names,specialNames=new Set()){
  const rows=names.map((name,i)=>({slot:i+1,name,overall:70,position:"ST",release:false}));
  const h=history.slice(0,season);h[season]={[role]:rows,[other(role)]:[]};
  let excluded=null;probe.ctx.__probe=(r,fn)=>{if(r===role)excluded=fn;};
  const plan=probe.R.forSeason(id,clubs,season+1,{history:h,hits});probe.ctx.__probe=null;
  assert.ok(plan&&excluded,`no plan for season ${season+1}`);
  const skipped=new Map();for(const s of plan.skipped[role])if(s.season===season)skipped.set(key(s.name),s.reason);
  const out=new Map();
  for(const name of names){const k=key(name.trim());if(specialNames.has(k)||!excluded({name:name.trim(),number:null,signedSeason:season}))continue;out.set(k,skipped.get(k)||"excluded");}
  for(const [k,reason] of skipped)if(reason==="shot"||reason==="guessed")assert.ok(out.has(k),`engine skipped ${k} as ${reason} but rrExcluded says no`);
  return out;
}
// One career: random guesses and signings each season, shots from the seeded spins plus forced ones (club players and
// signings), every outcome saved like the phones save it. Calls visit(season, history, hits, plan) before window `season`.
function career(seed,seasons,visit){
  const rand=rng(seed),id=`pair_${hexOf(rand)}`;
  const a=CLUBS[Math.floor(rand()*CLUBS.length)];let b=CLUBS[Math.floor(rand()*CLUBS.length)];if(b===a)b=CLUBS[(CLUBS.indexOf(a)+1)%CLUBS.length];
  const clubs={playerOne:a,playerTwo:b},history=[null],hits={};
  const pool=[...P.clubs[a].players.map(p=>p[0]),...P.clubs[b].players.map(p=>p[0]),"Renato Sanches","N. Kanté","Dele Alli","Pierre-Emerick Aubameyang"];
  for(let s=1;s<=seasons;s+=1){
    let plan=R.forSeason(id,clubs,s,{history,hits});assert.ok(plan,`career ${seed}: no plan s${s}`);
    hits[s]={};
    for(const role of ROLES){
      const turn=plan.turns.find(t=>t.role===role);
      // forced: about a third of the spins hit a random filled slot (signings included), the rest keep the seeded result
      if(rand()<0.35){const board=plan.boards[role],filled=board.map((p,i)=>p.name?i:-1).filter(i=>i>=0),slot=filled[Math.floor(rand()*filled.length)],p=board[slot];
        hits[s][role]={fired:true,hitName:p.name,hitNumber:Number.isInteger(p.number)?p.number:null,hitSlot:slot,hitSignedSeason:p.signedSeason??null,version:"v"};}
      else hits[s][role]=R.outcome(plan,role,"v");
      void turn;
    }
    plan=R.forSeason(id,clubs,s,{history,hits});
    visit&&visit({id,clubs,season:s,history,hits,plan,pool,rand});
    const rows={};
    for(const role of ROLES){
      rows[role]=[];const n=1+Math.floor(rand()*3);
      for(let i=1;i<=n;i+=1){const name=rand()<0.5?pool[Math.floor(rand()*pool.length)]:`Signing ${seed}-${s}-${role}-${i}`;rows[role].push({slot:i,name,overall:55+Math.floor(rand()*35),position:POS[Math.floor(rand()*POS.length)],release:rand()<0.4});}
    }
    history.push(rows);
  }
  return {id,clubs};
}

check("LR1","oracle: refusal set == engine exclusion (shot/guessed) for every candidate, both managers, 160 careers",()=>{
  let compared=0,refused=0,accepted=0,sawShot=0,sawGuess=0,sawClubShot=0;
  for(let seed=1;seed<=160;seed+=1){
    career(seed*7919,6,({id,clubs,season,history,hits,plan,pool,rand})=>{
      for(const role of ROLES){
        const blocked=api.rouletteBlocked(history,hits,season,role);
        // candidates: every refused name, typed differently, plus own club players, rival's guessed signings, earlier kept
        // signings, and fresh names
        const names=new Set();
        for(const v of blocked.values()){names.add(v.name);names.add(` ${v.name.toUpperCase()} `);}
        for(const p of plan.boards[role])if(p.name)names.add(p.name);
        for(let k=1;k<season;k+=1)for(const r of ROLES)for(const row of history[k][r])names.add(row.name);
        for(let i=0;i<6;i+=1)names.add(pool[Math.floor(rand()*pool.length)]);
        names.add(`Fresh Name ${season}`);
        const list=[...names],engine=engineSkips(id,clubs,season,history,hits,role,list);
        for(const name of list){
          const mine=blocked.get(api.nameKey(name));
          const want=engine.get(key(name.trim()));
          assert.equal(Boolean(mine),Boolean(want),`seed ${seed} s${season} ${role} "${name}": refusal ${mine&&mine.reason} vs engine ${want}`);
          if(mine&&want!=="excluded")assert.equal(mine.reason,want,`seed ${seed} s${season} ${role} "${name}": reason`);
          compared+=1;if(mine){refused+=1;if(mine.reason==="shot")sawShot+=1;else sawGuess+=1;}else accepted+=1;
        }
        for(let k=1;k<=season;k+=1){const h=hits[k][role];if(h&&h.fired&&h.hitSignedSeason===null)sawClubShot+=1;}
      }
    });
  }
  assert.ok(sawShot>200&&sawGuess>200&&sawClubShot>100&&accepted>5000,`coverage shot ${sawShot} guessed ${sawGuess} club shots ${sawClubShot} accepted ${accepted}`);
  process.stdout.write(`   ${compared} names compared: ${refused} refused (${sawShot} shot, ${sawGuess} guessed), ${accepted} accepted\n`);
});

// ---- named cases on one fixed Showdown ----
const ID=`pair_${"e".repeat(64)}`,CLUBS2={playerOne:"Arsenal",playerTwo:"Chelsea"};
function shotOf(name,season,history,hits,role="playerOne"){
  const plan=R.forSeason(ID,CLUBS2,season,{history,hits}),board=plan.boards[role],i=board.findIndex(p=>p.name===name);
  assert.ok(i>=0,`${name} not on the season ${season} board`);
  return {fired:true,hitName:name,hitNumber:Number.isInteger(board[i].number)?board[i].number:null,hitSlot:i,hitSignedSeason:board[i].signedSeason??null,version:"v"};
}
const safe={fired:false,hitName:null,hitNumber:null,hitSlot:null,hitSignedSeason:null,version:"v"};

check("LR2","a shot club player is refused as a signing in the same window and later; engine agrees",()=>{
  const history=[null],hits={1:{playerOne:shotOf("T. Walcott",1,[null],{}),playerTwo:safe}};
  const now=api.rouletteBlocked(history,hits,1,"playerOne");
  assert.deepEqual({...now.get("t. walcott")},{name:"T. Walcott",reason:"shot",season:1});
  assert.equal(engineSkips(ID,CLUBS2,1,history,hits,"playerOne",["T. Walcott"]).get("t. walcott"),"shot");
  assert.equal(api.rouletteBlocked(history,hits,1,"playerTwo").size,0,"Nik is not blocked by Daniel's shot");
  history.push({playerOne:[{slot:1,name:"Other Guy",overall:70,position:"ST",release:false}],playerTwo:[]});hits[2]={playerOne:safe,playerTwo:safe};
  assert.equal(api.rouletteBlocked(history,hits,2,"playerOne").get("t. walcott").reason,"shot","still refused a season later");
  assert.equal(engineSkips(ID,CLUBS2,2,history,hits,"playerOne",["T. Walcott"]).get("t. walcott"),"shot");
});
check("LR3","a shot signing is refused when entered again; engine agrees",()=>{
  const history=[null,{playerOne:[{slot:1,name:"Big Striker",overall:92,position:"ST",release:false}],playerTwo:[]}];
  const hits={1:{playerOne:safe,playerTwo:safe}};
  hits[2]={playerOne:shotOf("Big Striker",2,history,hits),playerTwo:safe};
  assert.equal(hits[2].playerOne.hitSignedSeason,1);
  assert.equal(api.rouletteBlocked(history,hits,2,"playerOne").get("big striker").reason,"shot");
  assert.equal(engineSkips(ID,CLUBS2,2,history,hits,"playerOne",["Big Striker"]).get("big striker"),"shot");
});
check("LR4","guessed: refused for his manager only; rival may sign him; no false refusal of namesakes or kept signings",()=>{
  const history=[null,{playerOne:[{slot:1,name:"O. Giroud",overall:80,position:"ST",release:true},{slot:2,name:"Renato Sanches",overall:78,position:"CM",release:true},{slot:3,name:"Kept Mid",overall:75,position:"CM",release:false}],playerTwo:[{slot:1,name:"Dele Alli",overall:80,position:"CAM",release:true}]}];
  const hits={1:{playerOne:safe,playerTwo:safe},2:{playerOne:safe,playerTwo:safe}};
  const daniel=api.rouletteBlocked(history,hits,2,"playerOne"),nik=api.rouletteBlocked(history,hits,2,"playerTwo");
  for(const typed of ["Renato Sanches"," renato sanches ","RENATO SANCHES","Renáto Sanches"])assert.equal(daniel.get(api.nameKey(typed))?.reason,"guessed",typed);
  assert.equal(nik.has(api.nameKey("Renato Sanches")),false,"rival can sign him");
  assert.equal(nik.get(api.nameKey("Dele Alli"))?.reason,"guessed");assert.equal(daniel.has(api.nameKey("Dele Alli")),false);
  assert.equal(daniel.has(api.nameKey("Kept Mid")),false,"a kept signing is not refused");
  assert.equal(daniel.has(api.nameKey("Renato")),false,"whole names only");
  assert.equal(daniel.has(api.nameKey("A. Ramsey")),false,"an own club player's name is not refused");
  // Arsenal's own O. Giroud (club row) shares the guessed signing's name: he stays on the board (not blocked for guesses)
  const plan=R.forSeason(ID,CLUBS2,2,{history,hits});
  assert.ok(plan.boards.playerOne.some(p=>p.name==="O. Giroud"&&p.signedSeason===null),"club namesake of a guessed signing stays on the board");
  const engine=engineSkips(ID,CLUBS2,2,history,hits,"playerOne",["Renato Sanches","Kept Mid","A. Ramsey","Dele Alli"]);
  assert.equal(engine.get("renato sanches"),"guessed");assert.equal(engine.has("kept mid"),false);assert.equal(engine.has("a. ramsey"),false);assert.equal(engine.has("dele alli"),false);
  assert.equal(engineSkips(ID,CLUBS2,2,history,hits,"playerTwo",["Renato Sanches"]).has("renato sanches"),false,"engine lets the rival sign him");
  // and a club player shot later blocks his name although he was never a signing
  hits[2]={playerOne:shotOf("A. Ramsey",2,history,{1:hits[1]}),playerTwo:safe};
  assert.equal(api.rouletteBlocked(history,hits,2,"playerOne").get("a. ramsey").reason,"shot");
});

// ---- the screen: LOCK wiring and the reads, in a sandbox with this module's own code ----
const marker='  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-transfer-challenge"';
assert.equal(source.split(marker).length,2,"one injection point");
function sandbox({storage={},provider,fields={},confirmedAtMs=Date.parse("2026-11-03T10:00:00Z"),seasonNumber=3}){
  const store=new Map(Object.entries(storage));
  const els={};
  const field=(id,value,canonical)=>({id,value,dataset:canonical?{canonicalId:canonical}:{},setAttribute(){}});
  for(const [id,v] of Object.entries(fields))els[id]=Array.isArray(v)?field(id,v[0],v[1]):field(id,v);
  const ctx={console,Date,Promise,Map,Set,JSON,Math,Object,Array,String,Number,Boolean,Error,setTimeout,clearTimeout,
    document:{getElementById:id=>els[id]||null,querySelector:()=>null},
    currentShowdown:{managers:{playerOne:"Daniel",playerTwo:"Nik"}},
    readStorageValue:k=>store.has(k)?store.get(k):null,writeStorageValue:(k,v)=>{store.set(k,v);},
    CareerModeProductionSharedShowdownSetup:{refresh(){},getState:()=>({rivalryId:ID,setupUpdatedAtMs:confirmedAtMs,managerRole:"playerOne"})},
    CareerModeProductionSharedCareerStart:{refresh(){},getState:()=>null},CareerModeSharedTransferChallenge:{},CareerModeSparkSharedTransferChallenge:provider,
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"u"}},firestore:{},firestoreSdk:{getDoc(){}}})}};
  ctx.globalThis=ctx;ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(source.replace(marker,'  globalThis.__lr={load:pstcLoadBlocked,now:pstcBlockedNow,build:pstcBuildSignings,errorText:pstcErrorText,formMistake:pstcFormMistake,use:(p,v)=>{provider=p;view=v;}};\n'+marker),ctx,{filename:"productionSharedTransferChallenge.js"});
  ctx.__lr.use(provider,{managerRole:"playerOne",rivalryId:ID,seasonNumber});
  return {lr:ctx.__lr,store,request:{key:`${ID}|${seasonNumber}|k`,rivalryId:ID,seasonNumber}};
}
// Season 1: Daniel's "Renato Sanches" guessed; season 2: Daniel's club player T. Walcott shot; season 3 (now): Daniel's
// signing "Big Striker" (season 2) shot in this season's spin.
const V={1:{playerOne:[{slot:1,name:"Renato Sanches",overall:78,position:"CM",release:true}],playerTwo:[{slot:1,name:"Dele Alli",overall:80,position:"CAM",release:true}]},
  2:{playerOne:[{slot:1,name:"Big Striker",overall:92,position:"ST",release:false}],playerTwo:[]}};
const H={1:{playerOne:safe,playerTwo:safe},2:{playerOne:{fired:true,hitName:"T. Walcott",hitNumber:14,hitSlot:7,hitSignedSeason:null,version:"v"},playerTwo:safe},
  3:{playerOne:{fired:true,hitName:"Big Striker",hitNumber:null,hitSlot:9,hitSignedSeason:2,version:"v"},playerTwo:safe}};
function fakeProvider(){
  const p={gets:0,calls:[],rouletteFromMs:Date.parse("2026-11-02T05:00:00Z"),outcomeValid:v=>Boolean(v&&typeof v.fired==="boolean"&&typeof v.version==="string"),
    async readRouletteSeason(o){p.calls.push({season:o.seasonNumber,verdicts:o.verdicts!==false});p.gets+=o.verdicts===false?1:3;
      return o.verdicts===false?{ok:true,hits:H[o.seasonNumber]}:{ok:true,verdicts:V[o.seasonNumber],hits:H[o.seasonNumber]};},
    read(){},startWindow(){},requestEndWindow(){},advanceExpiredWindow(){},lockGuesses(){},lockSignings(){}};
  return p;
}
const lockFields=(name)=>({p1Signing1Name:name,p1Signing1Overall:"80",p1Signing1Position:"ST",p1Signing1League:["Premier League","gb1"],p1Signing1Nationality:["England","england"]});
function refusal(lr,blocked,name){try{lr.build("playerOne",blocked);return null;}catch(error){return error;}}

check("LR5","LOCK refuses with plain words (also hyphenated names), shot wins, a form mistake, nothing locks",()=>{
  const provider=fakeProvider();
  const blocked=api.rouletteBlocked([null,V[1],V[2]],H,3,"playerOne");
  const cases=[["Big Striker","TRANSFER_SIGNING_SHOT","Big Striker was shot in the roulette. He can't come back."],
    ["t. walcott","TRANSFER_SIGNING_SHOT","t. walcott was shot in the roulette. He can't come back."],
    ["Renato Sanches","TRANSFER_SIGNING_GUESSED_BEFORE","Renato Sanches was guessed by Nik. You can't sign him again."]];
  for(const [name,code,words] of cases){
    const {lr}=sandbox({provider,fields:lockFields(name)});
    const error=refusal(lr,blocked,name);
    assert.ok(error,`${name} refused`);assert.equal(error.code,code);
    assert.equal(error.message,words);
    assert.equal(lr.errorText(error,"generic"),error.message,"shown word for word");
    assert.equal(lr.formMistake(error),true,"a form mistake, not a reported failure");
  }
  const hy=new Map([[api.nameKey("Pierre-Emerick Aubameyang"),{name:"Pierre-Emerick Aubameyang",reason:"shot",season:1}]]);
  const {lr}=sandbox({provider,fields:lockFields("Pierre-Emerick Aubameyang")});
  const e=refusal(lr,hy);assert.equal(lr.errorText(e,"generic"),"Pierre-Emerick Aubameyang was shot in the roulette. He can't come back.","a hyphenated name keeps the plain words");
  const both=api.rouletteBlocked([null,{playerOne:[{slot:1,name:"T. Walcott",release:true}],playerTwo:[]}],{1:{playerOne:safe},2:{playerOne:H[2].playerOne}},2,"playerOne");
  assert.equal(both.get("t. walcott").reason,"shot","shot wins over guessed (the engine's own order)");
  const ok=sandbox({provider,fields:lockFields("Kept Mid")}).lr.build("playerOne",blocked);
  assert.equal(ok.length,1,"an unblocked name builds its row");
  // the handler awaits the check before building, and builds with it
  assert.ok(source.includes('if(phase==="SIGNING_ENTRY"){const signings=pstcBuildSignings(role,await pstcBlockedNow(pstcRequestContext(),role));'));
  assert.ok(/You can't sign him again\./.test(source)&&/He can't come back\./.test(source));
});

async function lr6(){
  // fresh: nothing kept
  {
    const provider=fakeProvider(),{lr,store,request}=sandbox({provider});
    const blocked=await lr.now(request,"playerOne");
    assert.equal(blocked.get("renato sanches")?.reason,"guessed");assert.equal(blocked.get("t. walcott")?.reason,"shot");assert.equal(blocked.get("big striker")?.reason,"shot");
    assert.equal(blocked.has("dele alli"),false,"the rival's guessed signing stays signable");
    assert.deepEqual(provider.calls.map(c=>`${c.season}:${c.verdicts}`).sort(),["1:true","2:true","3:false"]);
    assert.equal(provider.gets,7,"3 gets per earlier season + this season's record");
    // a second LOCK on this page, and this browser after a reload, read nothing
    await lr.now(request,"playerOne");assert.equal(provider.gets,7);
    const again=fakeProvider(),reload=sandbox({provider:again,storage:Object.fromEntries(store)});
    const kept=await reload.lr.load(reload.request,"playerOne");
    assert.equal(again.gets,0,"kept after the first read");assert.equal(kept.get("big striker")?.reason,"shot");
  }
  // a phone that ran the roulette: verdicts and spins kept (as pstcRouletteVerdicts keeps them) and its own outcome remembered
  {
    const storage={"careerModeShowdown.rouletteVerdicts.v1":JSON.stringify([[`${ID}|1`,V[1]],[`${ID}|2`,V[2]]]),
      "careerModeShowdown.rouletteHits.v1":JSON.stringify([[`${ID}|1`,H[1]],[`${ID}|2`,H[2]]]),
      "careerModeShowdown.rouletteOutcome.v1":JSON.stringify([[`${ID}|3|playerOne`,H[3].playerOne]])};
    const provider=fakeProvider(),{lr,request}=sandbox({provider,storage});
    const blocked=await lr.load(request,"playerOne");
    assert.equal(provider.gets,0,"zero billed reads");assert.equal(blocked.get("big striker")?.reason,"shot");assert.equal(blocked.get("renato sanches")?.reason,"guessed");
  }
  // a failed read: LOCK is refused with the TRY AGAIN words, never accepted unchecked
  {
    const provider=fakeProvider();provider.readRouletteSeason=async()=>({ok:false,code:"unavailable"});
    const {lr,request}=sandbox({provider});
    await assert.rejects(lr.now(request,"playerOne"),e=>e.code==="TRANSFER_ROULETTE_CHECK_FAILED"&&/tap LOCK again/.test(e.message));
  }
  // before Roster Roulette: nothing read, nothing refused
  {
    const provider=fakeProvider(),{lr,request}=sandbox({provider,confirmedAtMs:Date.parse("2026-10-01T00:00:00Z")});
    const blocked=await lr.now(request,"playerOne");assert.equal(blocked.size,0);assert.equal(provider.gets,0);
  }
  checks+=1;process.stdout.write(`ok ${checks} LR6 fresh browser 7 gets once then 0; roulette phone 0; failed read refuses; old Showdown 0\n`);
  const fn=source.slice(source.indexOf("function pstcNameKey("),source.indexOf("function pstcRefuse("));
  assert.equal(/onSnapshot|addSnapshotListener|getDocs|setInterval/.test(fn),false,"no listener, no query");
  checks+=1;process.stdout.write(`ok ${checks} LR7 no listener or query in the new code\n`);
}
lr6().then(()=>console.log(`PASS r88 LOCK refusals contracts: ${checks} checks.`),error=>{console.error(error);process.exit(1);});
