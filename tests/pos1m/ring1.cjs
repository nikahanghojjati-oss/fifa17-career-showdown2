"use strict";
// POS1M Ring 1: one story = one fair two-phone Showdown played by two manager actors against the real providers
// (js/spark*.js and the protocol modules they load) on the stand-in database, with faults as moves, on a seeded Sim.
//
// Actors only make LEGAL moves, chosen from what the shared record says the step is (the same reads the game makes).
// Fault moves: kill the tab (a fresh tab resumes from the shared record, its tap memory gone), go offline and back,
// swap to the manager's other device, open a second tab that plays at the same time, repeat the last tap exactly
// (same operation id), skew the phone clock. The Sim decides who moves next and in which order every network leg
// lands, so a rival's commit can land between this phone's transaction read and its commit.
//
// Ring 1 cannot see the Rules or the screens. Its writes are kept in server.writeLog for Ring 2.
const path=require("node:path");
const {Sim}=require("./sim.cjs");
const W=require("./world.cjs");
const laws=require("./laws.cjs");

const P=name=>require(path.join(W.ROOT,"js",name));
const Setup=P("sparkSharedShowdownSetup.js"),Career=P("sparkSharedCareerStart.js"),Transfer=P("sparkSharedTransferChallenge.js"),Results=P("sparkSharedSeasonResults.js"),Commit=P("sparkSharedSeasonCommit.js"),Scoring=P("sparkSharedCanonicalScoring.js"),History=P("sparkSharedHistoryConvergence.js"),Multi=P("sparkSharedMultiSeasonProgression.js");
const PROVIDERS={Setup,Career,Transfer,Results,Commit,Scoring,History,Multi};

const LENGTHS=[1,3,5,10];
const NETWORK=new Set(["unavailable","deadline-exceeded","resource-exhausted","aborted","failed-precondition","internal","unknown","cancelled","permission-denied"]);
const LEAGUES=["england-premier-league","spain-primera-division","germany-bundesliga","italy-serie-a","france-ligue-1","brazil-serie-a","argentina-primera-division"];
const NATIONS=["brazil","germany","england","spain","france","argentina","albania","sudan","kyrgyzstan"];
const POSITIONS=["ST","CB","LW","RW","CM","GK","LB","RB","CAM","CDM"];

// ---------------------------------------------------------------------------------------------------------------
// Story plan: everything a seed decides up front (so a replay can be cut down move by move later).
// ---------------------------------------------------------------------------------------------------------------
// One story in 20 is a whole Showdown; the rest are season chapters forked from a checkpoint that a calm story played
// through the real providers (never built by hand, so forking cannot make the stand-in kinder). The whole Showdowns
// rotate through every length and Sacked in the first, a middle and the last season.
const FULL_EVERY=20;
const FULL_ROTATION=[].concat(...LENGTHS.map(L=>[null,"first","middle","last"].map(sack=>({L,sack}))));
const CHECKPOINT_VARIANTS=4;
function planFor(seed,overrides={}){
  const sim=new Sim(seed^0x5eed);
  const r=()=>sim.random();
  let kind="chapter",totalSeasons,fromSeason=1,checkpointSeed=null,sackedSeason=null;
  const sackedRole=r()<0.5?"playerOne":"playerTwo";
  if(overrides.kind==="full"||(overrides.kind!=="chapter"&&seed%FULL_EVERY===0)){
    kind="full";
    const spec=FULL_ROTATION[Math.floor(seed/FULL_EVERY)%FULL_ROTATION.length];
    totalSeasons=overrides.totalSeasons||spec.L;
    const sack=overrides.sack!==undefined?overrides.sack:spec.sack;
    sackedSeason=sack==="first"?1:sack==="last"?totalSeasons:sack==="middle"?Math.max(1,Math.ceil(totalSeasons/2)):null;
  }else{
    totalSeasons=overrides.totalSeasons||(r()<0.3?1:r()<0.45?3:r()<0.6?5:10);
    fromSeason=overrides.fromSeason||1+Math.floor(r()*totalSeasons);
    checkpointSeed=fromSeason>1?(totalSeasons*1000+fromSeason*10+Math.floor(r()*CHECKPOINT_VARIANTS)):null;
    sackedSeason=r()<0.12?fromSeason:null;// a chapter can be the season a manager is sacked
  }
  const calm=r()<0.15;// some stories have no faults at all: the happy path must hold too
  const level=calm?0:r();
  const faults=calm?{contentionDenied:0.5}:{
    callError:0.02+0.10*level*r(),
    lostAck:0.02+0.12*level*r(),
    contentionDenied:0.5,
    phantomAbort:0.01*level,
    listenerDelayMs:Math.floor(5_000*r()),
    listenerStall:0.05*level,listenerDeath:0.03*level
  };
  const chaos=calm?{rate:0}:{
    rate:0.05+0.35*level,// chance per actor move that a fault move happens first
    budget:1+Math.floor(r()*16),// fault moves per story; then the faults stop and the game must reach the end (L11, L12)
    weights:{kill:3,offline:3,swap:1,secondTab:1,repeat:4,skew:1}
  };
  const skewMs={playerOne:calm?0:Math.round((r()-0.5)*600_000),playerTwo:calm?0:Math.round((r()-0.5)*600_000)};
  const expireWindow=r()<0.2;// the 15-minute Transfer War runs out instead of both ending early
  const stopAtSeason=kind==="chapter"&&fromSeason<totalSeasons?fromSeason+1:null;// a chapter plays one season
  return {seed,kind,totalSeasons,fromSeason,stopAtSeason,checkpointSeed,faults,chaos,skewMs,sackedSeason,sackedRole,expireWindow,...overrides};
}
// A calm prefix played through the real providers up to (not including) season `until`; cached per process.
const checkpoints=new Map();
async function checkpointFor(totalSeasons,until,variant){
  const key=`${totalSeasons}:${until}:${variant}`;
  if(checkpoints.has(key))return checkpoints.get(key);
  const plan={seed:variant,kind:"prefix",totalSeasons,fromSeason:1,stopAtSeason:until,checkpointSeed:null,faults:{contentionDenied:0.5},chaos:{rate:0},skewMs:{playerOne:0,playerTwo:0},sackedSeason:null,sackedRole:"playerOne",expireWindow:false};
  const story=new Story(plan);
  const summary=await story.run();
  if(summary.error||summary.violations.length)throw new Error(`checkpoint ${key} failed: ${summary.error||JSON.stringify(summary.violations)}`);
  const server=story.world.server;
  const cp=Object.freeze({key,docs:new Map(server.docs),version:server.version,autoSeq:server.autoSeq,now:story.sim.now+60_000,teamCount:story.teamCount});
  checkpoints.set(key,cp);
  return cp;
}

// The manager's intent for a season: fixed per (seed, role, season), so a fresh tab or swapped phone means the same.
function intentFor(story,role,season){
  const sim=new Sim((story.plan.seed*1_000_003)^(season*7919)^(role==="playerOne"?0x1111:0x2222));
  const r=()=>sim.random(),pick=list=>list[Math.floor(r()*list.length)];
  const teamCount=story.teamCount||18;
  const count=1+Math.floor(r()*3);
  const guesses=Array.from({length:count},(_,i)=>r()<0.5?{slot:i+1,type:"league",valueId:pick(LEAGUES)}:{slot:i+1,type:"nationality",valueId:pick(NATIONS)});
  const signings=Array.from({length:1+Math.floor(r()*3)},(_,i)=>({slot:i+1,name:`${role==="playerOne"?"Daniel":"Nik"} S${season} P${i+1}`,position:pick(POSITIONS),overall:60+Math.floor(r()*30),leagueId:pick(LEAGUES),nationalityId:pick(NATIONS)}));
  // Results: sometimes the same as the rival's shape so equal totals (draws) happen often enough to test.
  const position=1+Math.floor(r()*Math.min(teamCount,6));
  const cl=r()<0.2,el=!cl&&r()<0.2;
  const result={leaguePosition:position,leaguePoints:Math.min((teamCount-1)*6,30+Math.floor(r()*80)),leagueGoals:20+Math.floor(r()*90),domesticCup:r()<0.3,championsLeague:cl,topScorer:r()<0.2,topAssist:r()<0.2,...(el?{europaLeague:true}:{})};
  if(story.plan.sackedSeason===season&&story.plan.sackedRole===role)result.sacked=true;
  return {guesses,signings,result};
}

// ---------------------------------------------------------------------------------------------------------------
// Manager actor
// ---------------------------------------------------------------------------------------------------------------
class Manager{
  constructor(story,role){
    this.story=story;this.role=role;this.tabs=0;this.opSeq=0;this.moves=0;this.done=false;this.loops=new Set();
    this.deviceId=W.DEVICE[role];this.skewMs=story.plan.skewMs[role];this.wakers=new Set();
  }
  newTab(){
    this.tabs+=1;
    const client=this.story.world.server.client({uid:W.ACCOUNT[this.role],label:`${this.role}#${this.tabs}`,skewMs:this.skewMs});
    return {client,memory:new Map(),gen:this.tabs,alive:true,role:this.role,deviceId:this.deviceId};
  }
  nextOp(prefix){this.opSeq+=1;const roleBit=this.role==="playerOne"?1:2;return prefix+(roleBit*0x10000000+this.story.plan.seed%0x1000000*0x10+this.opSeq).toString(16).padStart(32,"0").slice(-32);}
  start(){const tab=this.newTab();this.loops.add(tab);this.loop(tab).catch(error=>this.story.crash(error,this.role));return tab;}
  opts(tab,extra={}){return W.providerOptions(this.story.world,{role:this.role,deviceId:tab.deviceId,client:tab.client},extra);}
  async call(tab,provider,fn,extra,label){
    // A phone that just moved already holds the new state from its own answer; it reads again only after that.
    if(fn==="read"&&tab.fresh&&tab.fresh.key===`${provider}:${extra.seasonNumber||0}`){const fresh=tab.fresh.value;tab.fresh=null;return fresh;}
    const result=await PROVIDERS[provider][fn](this.opts(tab,extra));
    if(fn!=="read"&&result&&result.ok&&result.state&&["Transfer","Results","Setup"].includes(provider)&&!result.replayed){
      tab.fresh={key:`${provider}:${extra.seasonNumber||0}`,value:{...result,revision:result.state.revision,...(provider==="Transfer"?{spunRoles:["playerOne","playerTwo"]}:{})}};
    }
    this.story.observe(this.role,tab,provider,fn,extra,result);
    return result;
  }
  async sleep(ms){await new Promise(resolve=>setTimeout(resolve,ms));}
  // Wait for the rival: wakes on the poll timer or earlier when the rival's move reaches this phone (the listener).
  async wait(ms){await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;this.wakers.delete(finish);resolve();};this.wakers.add(finish);setTimeout(finish,ms);});}
  nudge(){for(const wake of [...this.wakers])wake();}
  // A move with tap memory: the same intent on the same tab re-sends the same command (operation id and base).
  async mutate(tab,key,provider,fn,base,payload,prefix){
    let entry=tab.memory.get(key);
    if(!entry||entry.base!==base){entry={operationId:this.nextOp(prefix),base};tab.memory.set(key,entry);}
    const extra={...payload,operationId:entry.operationId,baseRevision:base};
    const result=await this.call(tab,provider,fn,extra,key);
    this.story.recordMove(this.role,tab,key,provider,fn,extra,result);
    if(result&&result.ok&&this.story.chaosRoll("repeat")){// a repeated tap: exactly the same command again
      this.story.faultMoves+=1;
      const again=await this.call(tab,provider,fn,extra,`${key}:repeat`);
      this.story.recordRepeat(this.role,key,provider,fn,extra,result,again);
    }
    return result;
  }
  async loop(tab){
    let idle=0;
    while(tab.alive&&!this.story.over){
      await this.story.maybeChaos(this,tab);
      if(!tab.alive||this.story.over)return;
      const acted=await this.step(tab);
      this.moves+=1;
      if(acted===true){idle=0;continue;}
      if(acted==="terminal"){this.done=true;this.story.managerDone(this.role);return;}
      idle+=1;
      await this.wait(Math.min(60_000,10_000*idle));// slow fallback polls; the rival's move (listener) wakes it sooner
    }
  }
  // One look at the shared record and at most one move. Returns true (moved), false (waiting) or "terminal".
  async step(tab){
    // What this tab already knows stays in memory (a real phone does the same); a fresh tab knows nothing.
    const role=this.role,plan=this.story.plan,k=tab.known||(tab.known={});
    if(!k.setup){
      const setup=await this.call(tab,"Setup","read",{});
      if(!setup.ok)return false;
      const s=setup.state;
      if(s&&s.phase==="SHOWDOWN_CONFIRMED"){k.setup=s;this.story.teamCountFor(s);}
      else{
        const rev=setup.revision||0,coordinator=role==="playerOne",phase=s?s.phase:null;
        if(coordinator&&!s)return this.moved(await this.mutate(tab,"setup:open","Setup","mutate",rev,{type:"open"},"setup_op_"));
        if(coordinator&&phase==="SHARED_SETUP_OPEN")return this.moved(await this.mutate(tab,"setup:league","Setup","mutate",rev,{type:"commit-league"},"setup_op_"));
        if(coordinator&&phase==="LEAGUE_WHEEL_COMMITTED")return this.moved(await this.mutate(tab,"setup:clubs","Setup","mutate",rev,{type:"commit-clubs"},"setup_op_"));
        if(coordinator&&phase==="CLUB_ASSIGNMENTS_COMMITTED")return this.moved(await this.mutate(tab,"setup:length","Setup","mutate",rev,{type:"commit-length",totalSeasons:plan.totalSeasons},"setup_op_"));
        if(phase==="SEASON_LENGTH_COMMITTED"&&!s.confirmedRoles.includes(role))return this.moved(await this.mutate(tab,"setup:confirm","Setup","mutate",rev,{type:"confirm"},"setup_op_"));
        return false;
      }
    }
    if(!k.career){
      const career=await this.call(tab,"Career","read",{});
      if(!career.ok)return false;
      const cs=career.state;
      if(!cs||!cs.acknowledgedRoles.includes(role))return this.moved(await this.mutate(tab,"career:ack","Career","acknowledge",career.revision||0,{},"career_start_op_"));
      if(cs.phase!=="CAREER_START_READY")return false;
      k.career=true;
    }
    if(!k.season){
      const multi=await this.call(tab,"Multi","read",{});
      if(!multi.ok)return false;
      if(multi.state.terminal)return "terminal";
      if(plan.stopAtSeason&&multi.state.activeSeason>=plan.stopAtSeason)return "terminal";
      k.season=multi.state.activeSeason;k.stage="transfer";
    }
    const season=k.season,intent=intentFor(this.story,role,season);
    if(k.stage==="transfer"){
      const transfer=await this.call(tab,"Transfer","read",{seasonNumber:season});
      if(!transfer.ok)return false;
      const t=transfer.state;
      if(!t){
        if(!transfer.spunRoles.includes(role)){const mark=await this.call(tab,"Transfer","markSpun",{seasonNumber:season,managerRole:role});return this.moved(mark);}
        if(role==="playerOne"&&transfer.spunRoles.includes("playerTwo"))return this.moved(await this.mutate(tab,`transfer:start:${season}`,"Transfer","startWindow",0,{seasonNumber:season},"transfer_op_"));
        return false;
      }
      const base=t.revision;
      if(t.phase==="WINDOW_OPEN"){
        if(plan.expireWindow){
          const due=t.startedAtEpochMs+15*60_000+2_000,now=tab.client.now();
          if(now<due){await this.sleep(Math.min(5*60_000,due-now));return true;}
          return this.moved(await this.mutate(tab,`transfer:expire:${season}`,"Transfer","advanceExpiredWindow",base,{seasonNumber:season},"transfer_op_"));
        }
        if(!t.endRequestedRoles.includes(role))return this.moved(await this.mutate(tab,`transfer:end:${season}`,"Transfer","requestEndWindow",base,{seasonNumber:season},"transfer_op_"));
        return false;
      }
      if(t.phase==="GUESS_ENTRY"){
        if(!t.guessLockedRoles.includes(role))return this.moved(await this.mutate(tab,`transfer:guess:${season}`,"Transfer","lockGuesses",base,{seasonNumber:season,guesses:intent.guesses},"transfer_op_"));
        return false;
      }
      if(t.phase==="SIGNING_ENTRY"){
        if(!t.signingLockedRoles.includes(role))return this.moved(await this.mutate(tab,`transfer:sign:${season}`,"Transfer","lockSignings",base,{seasonNumber:season,signings:intent.signings},"transfer_op_"));
        return false;
      }
      if(t.phase!=="COMPLETED")return false;
      k.stage="results";
    }
    if(k.stage==="results"){
      const results=await this.call(tab,"Results","read",{seasonNumber:season});
      if(!results.ok)return false;
      const rs=results.state;
      const published=rs&&Array.isArray(rs.publishedRoles)&&rs.publishedRoles.includes(role);
      if(!published){
        const teamCount=this.story.teamCount;
        const result={...intent.result,leaguePosition:Math.min(intent.result.leaguePosition,teamCount),leaguePoints:Math.min(intent.result.leaguePoints,(teamCount-1)*6)};
        return this.moved(await this.mutate(tab,`results:publish:${season}`,"Results","publishResult",results.revision||0,{seasonNumber:season,result},"season_result_op_"));
      }
      if(!rs||rs.phase!=="RESULTS_READY")return false;
      k.stage="commit";
    }
    const commit=await this.call(tab,"Commit","read",{seasonNumber:season});
    if(!commit.ok)return false;
    if(!commit.committed){
      if(role==="playerOne")return this.moved(await this.mutate(tab,`commit:${season}`,"Commit","commitSeason",0,{seasonNumber:season},"season_commit_op_"));
      return false;
    }
    const acknowledged=Array.isArray(commit.acknowledgedRoles)?commit.acknowledgedRoles:[];
    if(!acknowledged.includes(role))return this.moved(await this.mutate(tab,`ack:${season}`,"Commit","acknowledgeSeason",commit.revision,{seasonNumber:season},"season_commit_op_"));
    if(commit.phase==="ACKNOWLEDGED"||acknowledged.length===2){k.season=null;return true;}
    return false;
  }
  moved(result){const ok=Boolean(result&&result.ok);if(ok)this.story.moveLanded(this.role);return ok;}
}

// ---------------------------------------------------------------------------------------------------------------
// Story
// ---------------------------------------------------------------------------------------------------------------
class Story{
  constructor(plan,{trace=false,mutant=null}={}){
    this.plan=plan;this.mutant=mutant;
    this.sim=new Sim(plan.seed);this.sim.traceOn=trace;this.traceOn=trace;
    this.over=false;this.error=null;this.violations=[];this.moves=[];this.repeats=[];this.observations=[];
    this.finished=new Set();this.teamCount=null;this.faultMoves=0;
    this.coverage=new Set();
  }
  teamCountFor(setupState){
    if(this.teamCount)return this.teamCount;
    const catalog=require(path.join(W.ROOT,"js/sharedShowdownCatalog.js")).catalog;
    this.teamCount=catalog[setupState.leagueId].length;return this.teamCount;
  }
  chaosRoll(kind){const chaos=this.plan.chaos;if(!chaos.rate||this.faultMoves>=chaos.budget)return false;const total=Object.values(chaos.weights).reduce((a,b)=>a+b,0);return this.sim.chance(chaos.rate*chaos.weights[kind]/total);}
  async maybeChaos(manager,tab){
    const chaos=this.plan.chaos;if(!chaos.rate||this.faultsStopped||this.faultMoves>=chaos.budget)return;
    if(!this.sim.chance(chaos.rate))return;
    this.faultMoves+=1;
    const weights=chaos.weights,kinds=Object.keys(weights).filter(k=>k!=="repeat"),total=kinds.reduce((a,k)=>a+weights[k],0);
    let roll=this.sim.random()*total,kind=kinds[0];
    for(const k of kinds){roll-=weights[k];if(roll<=0){kind=k;break;}}
    this.fault(manager,tab,kind);
  }
  fault(manager,tab,kind){
    const sim=this.sim;
    this.cell(`fault:${kind}`);
    sim.log(`FAULT ${kind} ${manager.role}`);
    if(kind==="kill"){
      tab.alive=false;manager.loops.delete(tab);tab.client.kill();
      sim.setTimer(()=>{if(!this.over)manager.start();},1_000+sim.int(30_000));
    }else if(kind==="offline"){
      tab.client.goOffline();
      sim.setTimer(()=>tab.client.goOnline(),2_000+sim.int(120_000));
    }else if(kind==="swap"){
      tab.alive=false;manager.loops.delete(tab);tab.client.kill({inFlightLands:true});
      manager.deviceId=manager.deviceId===W.DEVICE[manager.role]?W.SWAP_DEVICE[manager.role]:W.DEVICE[manager.role];
      sim.setTimer(()=>{if(!this.over)manager.start();},5_000+sim.int(60_000));
    }else if(kind==="secondTab"){
      if(manager.loops.size<2)manager.start();
    }else if(kind==="skew"){
      manager.skewMs=Math.round((sim.random()-0.5)*600_000);tab.client.skewMs=manager.skewMs;
    }
  }
  cell(key){this.coverage.add(key);}
  observe(role,tab,provider,fn,extra,result){
    this.cell(`${provider}.${fn}:${result&&result.ok?"ok":result&&result.code}`);
    laws.onObserve(this,role,provider,fn,extra,result);
  }
  recordMove(role,tab,key,provider,fn,extra,result){
    this.moves.push({t:this.sim.now-this.sim.epochMs,role,tab:tab.gen,key,fn,op:extra.operationId,base:extra.baseRevision,ok:Boolean(result&&result.ok),code:result&&result.code||null,replayed:Boolean(result&&result.replayed)});
    laws.afterMove(this);
  }
  recordRepeat(role,key,provider,fn,extra,first,again){this.repeats.push({role,key,fn,first,again});laws.onRepeat(this,role,key,provider,fn,extra,first,again);}
  // The rival hears about a move through its listener: usually within seconds, sometimes only by its next poll.
  moveLanded(role){const rival=this.managers[W.other(role)];if(this.sim.chance(0.15))return;this.sim.setTimer(()=>rival.nudge(),50+this.sim.int(5_000));}
  managerDone(role){this.finished.add(role);if(this.finished.size===2)this.over=true;}
  crash(error,role){this.error=error;this.errorRole=role;this.over=true;}
  violation(law,detail){if(this.violations.some(v=>v.law===law))return;this.violations.push({law,detail,t:this.sim.now-this.sim.epochMs,moves:this.moves.length});}
  async run(){
    let cp=null;
    if(this.plan.checkpointSeed!==null&&this.plan.fromSeason>1)cp=await checkpointFor(this.plan.totalSeasons,this.plan.fromSeason,this.plan.checkpointSeed%CHECKPOINT_VARIANTS);
    if(cp){this.sim=new Sim(this.plan.seed,{epochMs:cp.now});this.sim.traceOn=this.traceOn;}
    const sim=this.sim;
    sim.install();
    try{
      this.world=W.makeWorld(sim,{faults:this.plan.faults,checkpoint:cp});
      if(cp){this.teamCount=cp.teamCount;laws.fromCheckpoint(this);}
      if(this.mutant&&this.mutant.install)this.mutant.install(this);
      this.managers={playerOne:new Manager(this,"playerOne"),playerTwo:new Manager(this,"playerTwo")};
      this.managers.playerOne.start();this.managers.playerTwo.start();
      // Liveness budget: generous virtual time per season (a Transfer War can take 15 minutes plus waits).
      const budgetMs=(2+this.plan.totalSeasons-this.plan.fromSeason+1)*3*60*60*1000;
      const status=await sim.run(()=>this.over,{untilMs:sim.epochMs+budgetMs});
      this.status=status;
      if(!this.error&&status!=="done")this.violation("L12_LIVENESS",`story did not reach the end in ${budgetMs/3600000} virtual hours (${status}); finished: ${[...this.finished].join(",")||"none"}`);
      if(!this.error)await this.finalChecks();
    }finally{sim.uninstall();}
    return this.summary();
  }
  // Faults stop, fresh tabs on both phones read everything; both must agree (L11) and the record must hold (L1-L10).
  async finalChecks(){
    const sim=this.sim;
    this.faultsStopped=true;this.over=true;
    for(const client of this.world.server.clients){client.alive=false;}
    this.world.server.faults={...this.world.server.faults,callError:0,lostAck:0,phantomAbort:0,listenerStall:0,listenerDeath:0};
    const views={};
    let done=false,error=null;
    (async()=>{
      for(const role of W.ROLES){
        const client=this.world.server.client({uid:W.ACCOUNT[role],label:`${role}#final`,skewMs:0,faults:{callError:0,lostAck:0,phantomAbort:0}});
        const o=extra=>W.providerOptions(this.world,{role,deviceId:W.DEVICE[role],client},extra);
        const multi=await Multi.read(o());
        const accepted=multi.ok?multi.state.acceptedSeasons:0;
        const history=accepted?await History.read(o({throughSeason:accepted})):null;
        const scoring=[];
        for(let season=1;season<=accepted;season+=1)scoring.push(await Scoring.read(o({seasonNumber:season,teamCount:this.teamCount||20})));
        views[role]={multi,history,scoring};
      }
    })().then(()=>{done=true;},e=>{error=e;done=true;});
    await sim.run(()=>done);
    if(error)throw error;
    laws.final(this,views);
  }
  summary(){
    const server=this.world&&this.world.server;
    return {seed:this.plan.seed,totalSeasons:this.plan.totalSeasons,status:this.status,error:this.error?String(this.error.stack||this.error):null,violations:this.violations,moves:this.moves.length,repeats:this.repeats.length,tabs:this.managers?this.managers.playerOne.tabs+this.managers.playerTwo.tabs:0,virtualMs:this.sim.now-this.sim.epochMs,meter:server?server.meter:null,writes:server?server.writeLog.length:0,coverage:[...this.coverage]};
  }
}

async function runStory(seed,options={}){
  const plan=planFor(seed,options.plan||{});
  const story=new Story(plan,options);
  const summary=await story.run();
  summary.plan=plan;
  if(options.keep)summary.story=story;
  return summary;
}

module.exports={runStory,planFor,intentFor,Story,Manager,PROVIDERS};

if(require.main===module){
  (async()=>{
    const count=Number(process.env.POS1M_STORIES||20),first=Number(process.env.POS1M_SEED||1);
    const started=process.hrtime.bigint();
    let failed=0,seasons=0;const cells=new Set();const meter={reads:0,writes:0};
    for(let i=0;i<count;i+=1){
      const summary=await runStory(first+i);
      seasons+=summary.totalSeasons;for(const c of summary.coverage)cells.add(c);
      meter.reads+=summary.meter.reads;meter.writes+=summary.meter.writes;
      if(summary.error||summary.violations.length){failed+=1;console.log(JSON.stringify({seed:summary.seed,seasons:summary.totalSeasons,error:summary.error&&summary.error.split("\n").slice(0,4).join(" | "),violations:summary.violations}));}
    }
    const ms=Number(process.hrtime.bigint()-started)/1e6;
    console.log(JSON.stringify({stories:count,failed,msPerStory:Number((ms/count).toFixed(1)),msPerSeason:Number((ms/seasons).toFixed(1)),avgSeasons:Number((seasons/count).toFixed(2)),coverageCells:cells.size,readsPerSeason:Math.round(meter.reads/seasons),writesPerSeason:Math.round(meter.writes/seasons)}));
    if(failed)process.exitCode=1;
  })().catch(error=>{console.error(error.stack||error);process.exit(1);});
}
