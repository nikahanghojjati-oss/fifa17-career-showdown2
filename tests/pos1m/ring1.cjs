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
const Guess=require(path.join(W.ROOT,"js","iconGuess.js"));
const {freshModule}=require("./fresh.cjs");
const ProductionTransfer=require(path.join(W.ROOT,"js","productionSharedTransferChallenge.js"));
const SetupProtocol=require(path.join(W.ROOT,"js","sharedShowdownSetup.js"));
// The documents that ARE each provider's action (a side write such as sharedSetup/leagueProjection is not the action).
const ACTION_DOCS={Setup:/\/sharedSetup\/authoritative$/,Career:/\/careerStart\/authoritative$/,Transfer:/\/transferChallenges\/season_\d+(\/roles\/\w+)?$/,Results:/\/seasonResults\/season_\d+(\/roles\/\w+)?$/,Commit:/\/seasonCommits\/season_\d+$/};

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
  // A calm prefix that breaks a law is itself a finding: every story forked from it reports that law (never a crash).
  if(summary.error||summary.violations.length){const failed=Object.freeze({key,failed:true,error:summary.error,violations:summary.violations});checkpoints.set(key,failed);return failed;}
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
  // Signings come from a small pool of men per manager, so a man can be wanted again in a later window (the same man:
  // same league and nation). A man the rival guessed earlier may not be signed again: the LOCK check refuses him.
  const who=role==="playerOne"?"Daniel":"Nik",pool=[0,1,2,3,4,5].sort(()=>r()-0.5),count2=1+Math.floor(r()*3);
  const man=n=>{const m=new Sim((story.plan.seed*13_001)^(n*977)^(role==="playerOne"?0x51:0x52));return {name:`${who} Target ${n+1}`,position:m.pick(POSITIONS),overall:60+m.int(30),leagueId:m.pick(LEAGUES),nationalityId:m.pick(NATIONS)};};
  const signings=pool.slice(0,count2).map((n,i)=>({slot:i+1,...man(n)}));
  // Results: sometimes the same as the rival's shape so equal totals (draws) happen often enough to test.
  const position=1+Math.floor(r()*Math.min(teamCount,6));
  const cl=r()<0.2,el=!cl&&r()<0.2;
  const result={leaguePosition:position,leaguePoints:Math.min((teamCount-1)*6,30+Math.floor(r()*80)),leagueGoals:20+Math.floor(r()*90),domesticCup:r()<0.3,championsLeague:cl,topScorer:r()<0.2,topAssist:r()<0.2,...(el?{europaLeague:true}:{})};
  if(story.plan.sackedSeason===season&&story.plan.sackedRole===role)result.sacked=true;
  return {guesses,signings,result};
}

// The Prime Pack plan for a season, shared by both managers (one story decides who knows the Icon): a winner and his
// stage, or nobody; each manager's wrong guesses before that; sometimes the loser also names it a moment too late (the
// race the server must settle with one winner).
function packPlanFor(story,season){
  const sim=new Sim((story.plan.seed*7_000_003)^(season*104_729));
  const winner=sim.chance(0.7)?sim.pick(W.ROLES):null,stage=1+sim.int(4);
  const guesses={playerOne:[],playerTwo:[]};
  for(const role of W.ROLES){
    const last=winner?stage:4;
    const wrongs=Math.min(role===winner?1:2,sim.int(3));
    for(let i=0;i<wrongs;i+=1)guesses[role].push({stage:1+sim.int(last),correct:false});
    if(role===winner)guesses[role].push({stage,correct:true});
    else if(winner&&sim.chance(0.15))guesses[role].push({stage,correct:true,late:true});
    guesses[role].sort((a,b)=>a.stage-b.stage||(a.correct?1:0)-(b.correct?1:0));
    guesses[role]=guesses[role].slice(0,2);// two chips
  }
  return {winner,stage,guesses};
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
  // Clocks as production passes them: Transfer War uses the server time measured from a fresh sign-in token
  // (js/productionSharedTransferChallenge.js pstcAuthoritativeNow), within about a second and a half; every other
  // provider gets the phone's own clock (Date.now()), which can be minutes off.
  opts(tab,extra={},provider=null){
    const o=W.providerOptions(this.story.world,{role:this.role,deviceId:tab.deviceId,client:tab.client},extra);
    if(provider==="Transfer"){if(tab.serverEstimateMs===undefined)tab.serverEstimateMs=this.story.sim.int(3_001)-1_500;o.nowEpochMs=this.story.sim.now+tab.serverEstimateMs;}
    return o;
  }
  async call(tab,provider,fn,extra,label){
    // A phone that just moved already holds the new state from its own answer; it reads again only after that.
    if(fn==="read"&&tab.fresh&&tab.fresh.key===`${provider}:${extra.seasonNumber||0}`){const fresh=tab.fresh.value;tab.fresh=null;return fresh;}
    tab.client.activeCall=`${provider}.${fn}`;// which tap a write came from (L14: a read never writes)
    const log=this.story.world.server.writeLog,mark=log.length;
    const result=await PROVIDERS[provider][fn](this.opts(tab,extra,provider));
    // L13: a tap whose write landed (its answer lost, the SDK ran it again) is answered with what it did, never a refusal.
    if(result&&!result.ok&&laws.GAME_CODE.test(result.code||"")){
      for(let i=mark;i<log.length;i+=1)if(log[i].client===tab.client.label&&log[i].call===`${provider}.${fn}`&&ACTION_DOCS[provider]&&ACTION_DOCS[provider].test(log[i].path)){this.story.violation("L13_REPEAT_ONCE",`${this.role} ${provider}.${fn} ${extra.operationId}: its write ${log[i].path.split("/").slice(2).join("/")} (seq ${log[i].seq}) landed but the tap was answered ${result.code}`);break;}
    }
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
        // The live 2.12.0 flow: open as draw 3 with the League Roulette; the coordinator's first ball is the league, then
        // balls 2-4 turn by turn (js/sharedShowdownSetup.js rouletteDropRole); clubs only after ball 4; each confirm
        // carries the manager's own wheel stop.
        if(coordinator&&!s)return this.moved(await this.mutate(tab,"setup:open","Setup","mutate",rev,{type:"open",draw:3,roulette:true},"setup_op_"));
        if(coordinator&&phase==="SHARED_SETUP_OPEN")return this.moved(await this.mutate(tab,"setup:league","Setup","mutate",rev,{type:"commit-league"},"setup_op_"));
        if(phase==="LEAGUE_WHEEL_COMMITTED"&&Number.isInteger(setup.drops)&&setup.drops<4){
          const ball=setup.drops+1;
          if(SetupProtocol.rouletteDropRole(s.coordinatorRole,ball)!==role){
            // An early clubs tap while the rival still has a ball to drop: must be refused (R98-01).
            if(coordinator&&!k.earlyClubs&&this.story.sim.chance(0.3)){k.earlyClubs=true;await this.mutate(tab,`setup:early-clubs:${tab.gen}`,"Setup","mutate",rev,{type:"commit-clubs"},"setup_op_");return true;}
            return false;
          }
          const known=this.story.sim.chance(0.8)?{drops:setup.drops,revision:setup.revision,coordinatorRole:s.coordinatorRole}:null;
          const dropped=await this.call(tab,"Setup","drop",{ball,managerRole:role,known});
          if(dropped&&dropped.ok&&this.story.chaosRoll("repeat")){this.story.faultMoves+=1;const again=await this.call(tab,"Setup","drop",{ball,managerRole:role,known});this.story.recordRepeat(role,`setup:drop:${ball}`,"Setup","drop",{ball},dropped,again);}
          return this.moved(dropped);
        }
        if(coordinator&&phase==="LEAGUE_WHEEL_COMMITTED")return this.moved(await this.mutate(tab,"setup:clubs","Setup","mutate",rev,{type:"commit-clubs"},"setup_op_"));
        if(coordinator&&phase==="CLUB_ASSIGNMENTS_COMMITTED")return this.moved(await this.mutate(tab,"setup:length","Setup","mutate",rev,{type:"commit-length",totalSeasons:plan.totalSeasons},"setup_op_"));
        if(phase==="SEASON_LENGTH_COMMITTED"&&!s.confirmedRoles.includes(role))return this.moved(await this.mutate(tab,"setup:confirm","Setup","mutate",rev,{type:"confirm",stop:new Sim(plan.seed^(role==="playerOne"?0xa1:0xb2)).int(360)},"setup_op_"));
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
      if(!t&&!transfer.spunRoles.includes(role)){const mark=await this.call(tab,"Transfer","markSpun",{seasonNumber:season,managerRole:role});return this.moved(mark);}
      // An early START from a stale screen while the rival is still on his roulette: must be refused (RT5-FLOW-02).
      if(!t&&role==="playerOne"&&!transfer.spunRoles.includes("playerTwo")&&!k.earlyStart&&this.story.sim.chance(0.4)){k.earlyStart=true;await this.mutate(tab,`transfer:early-start:${season}:${tab.gen}`,"Transfer","startWindow",0,{seasonNumber:season},"transfer_op_");return true;}
      // Roster Roulette -> Prime Pack -> Transfer War: this phone plays the Prime Pack before its Transfer War screen.
      if(!k.pack||k.pack.season!==season)k.pack={season,done:false,points:0,arrived:false,next:0};
      if(!k.pack.done)return this.primePack(tab,k.pack,season);
      if(!t){
        if(role==="playerOne"&&transfer.spunRoles.includes("playerTwo"))return this.moved(await this.mutate(tab,`transfer:start:${season}`,"Transfer","startWindow",0,{seasonNumber:season},"transfer_op_"));
        return false;
      }
      const base=t.revision;
      if(t.phase==="WINDOW_OPEN"){
        if(plan.expireWindow){
          const due=t.startedAtEpochMs+15*60_000+2_000,now=this.opts(tab,{},"Transfer").nowEpochMs;
          if(now<due){
            // An early tap on the expiry (a stale screen or a retry): the server must refuse it while the window is open.
            if(!k.early)k.early=0;
            if(k.early<2&&this.story.sim.chance(0.35)){k.early+=1;await this.mutate(tab,`transfer:early:${season}:${tab.gen}:${k.early}`,"Transfer","advanceExpiredWindow",base,{seasonNumber:season},"transfer_op_");return true;}
            await this.sleep(Math.min(5*60_000,due-now));return true;
          }
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
        if(!t.signingLockedRoles.includes(role)){
          const signings=await this.allowedSignings(tab,k,season,intent.signings);
          if(!signings)return false;
          return this.moved(await this.mutate(tab,`transfer:sign:${season}`,"Transfer","lockSignings",base,{seasonNumber:season,signings},"transfer_op_"));
        }
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
        // The results screen adds the Prime Pack points this phone's step module reads from the round (never typed).
        if(!k.pack||k.pack.season!==season||!k.pack.done){k.stage="transfer";return true;}
        if(k.pack.points>0)result.primePack=k.pack.points;
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
  // The Transfer War LOCK check the screen runs (js/productionSharedTransferChallenge.js rouletteBlocked + blockedFor, the real
  // functions): earlier windows' verdicts, read once per tab like the screen; a refused man is swapped for a new one.
  async allowedSignings(tab,k,season,wanted){
    k.verdicts=k.verdicts||{};
    for(let s=1;s<season;s+=1){
      if(k.verdicts[s])continue;
      const earlier=await this.call(tab,"Transfer","read",{seasonNumber:s});
      if(!earlier.ok||!earlier.verdicts)return null;
      k.verdicts[s]=earlier.verdicts;
    }
    const map=ProductionTransfer.rouletteBlocked([null,...Array.from({length:season-1},(_,i)=>k.verdicts[i+1])],[null],season,this.role);
    return wanted.map(row=>{
      if(!ProductionTransfer.blockedFor(map,row.name,null))return row;
      this.story.cell("Transfer.lock:refused-guessed");
      return {...row,name:`${row.name} (new S${season})`};
    });
  }
  serverEstimate(tab){if(tab.serverEstimateMs===undefined)tab.serverEstimateMs=this.story.sim.int(3_001)-1_500;return this.story.sim.now+tab.serverEstimateMs;}
  // The Prime Pack through the real step module (js/iconGuessStep.js: arrive, applyGuess, pointsFor, record), one fresh copy
  // per tab. The screen's timers are this actor's sleeps; its listener is the rival's nudge plus a re-read.
  async primePack(tab,pack,season){
    const story=this.story,role=this.role,step=tab.packStep||(tab.packStep=freshModule("js/iconGuessStep.js"));
    const ctx={rivalryId:W.RIVALRY,managerRole:role,season,confirmedAtMs:story.confirmedAtMs()};
    if(!step.applies(ctx)){pack.done=true;story.cell("Pack:skipped");return true;}
    const io={firestore:tab.client,sdk:story.world.sdk,rivalryId:W.RIVALRY,sessionId:W.SESSION,deviceId:tab.deviceId,now:()=>this.serverEstimate(tab)};
    const attempt=async(label,fn)=>{tab.client.activeCall=`Pack.${label}`;try{const value=await fn();story.cell(`Pack.${label}:ok`);return {ok:true,value};}catch(error){story.cell(`Pack.${label}:${error.code||"error"}`);return {ok:false,error};}};
    if(!pack.arrived){const r=await attempt("arrive",()=>step.arrive(io,ctx));if(!r.ok)return false;pack.arrived=true;this.moved({ok:true});return true;}
    const ref=story.world.sdk.doc(tab.client,"rivalries",W.RIVALRY,"primePackRounds",`season_${season}`);
    const read=await attempt("read",()=>story.world.sdk.runTransaction(tab.client,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;}));
    if(!read.ok)return false;
    const record=step.record(read.value,season);
    if(!record){if(!read.value){pack.arrived=false;return true;}story.violation("L6_PRIME_PACK",`season ${season} round record is unreadable: ${JSON.stringify(read.value).slice(0,200)}`);pack.done=true;return true;}
    const now=this.serverEstimate(tab),outcome=Guess.outcome(record,now);
    if(outcome.state==="waiting"){if(record.arrived[role]===null){pack.arrived=false;return true;}await this.wait(5_000);return true;}
    if(outcome.state==="won"||outcome.state==="draw"){
      const points=await attempt("pointsFor",()=>step.pointsFor(io,ctx));
      if(!points.ok)return false;
      pack.points=points.value;pack.done=true;return true;
    }
    const start=Guess.startMs(record),at=Guess.beatAt(start,now),plan=packPlanFor(story,season).guesses[role];
    const g=plan[pack.next];
    if(!g||at.phase==="over"){await this.sleep(Math.max(500,Guess.endsAt(start)+Guess.drawSlackMs+500-now));return true;}
    const windowStart=start+Guess.stageStarts[g.stage-1]+Guess.stages[g.stage-1].revealMs;
    if(at.beat<g.stage-1||at.phase!=="window"){await this.wait(Math.max(200,windowStart-now)+(g.late?1_500:story.sim.int(8_000)));return true;}
    pack.next+=1;
    const guess=await attempt("guess",()=>step.applyGuess(io,ctx,g.correct));
    if(guess.ok&&guess.value&&guess.value.ok)this.moved({ok:true});
    return true;
  }
  moved(result){const ok=Boolean(result&&result.ok);if(ok)this.story.moveLanded(this.role);return ok;}
}

// ---------------------------------------------------------------------------------------------------------------
// Story
// ---------------------------------------------------------------------------------------------------------------
class Story{
  constructor(plan,{trace=process.env.POS1M_TRACE==="1",mutant=null}={}){
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
  confirmedAtMs(){const setup=this.world.server.docs.get(`rivalries/${W.RIVALRY}/sharedSetup/authoritative`);const at=setup&&setup.data.updatedAt;return at&&typeof at.toMillis==="function"?at.toMillis():this.sim.now;}
  managerDone(role){this.finished.add(role);if(this.finished.size===2)this.over=true;}
  crash(error,role){this.error=error;this.errorRole=role;this.over=true;}
  violation(law,detail){if(this.violations.some(v=>v.law===law))return;this.violations.push({law,detail,t:this.sim.now-this.sim.epochMs,moves:this.moves.length});}
  async run(){
    let cp=null;
    if(this.plan.checkpointSeed!==null&&this.plan.fromSeason>1)cp=await checkpointFor(this.plan.totalSeasons,this.plan.fromSeason,this.plan.checkpointSeed%CHECKPOINT_VARIANTS);
    if(cp&&cp.failed){
      return {seed:this.plan.seed,totalSeasons:this.plan.totalSeasons,status:"checkpoint-failed",error:cp.error?`calm checkpoint ${cp.key}: ${cp.error}`:null,violations:cp.violations.map(v=>({...v,detail:`calm checkpoint ${cp.key}: ${v.detail}`})),moves:0,repeats:0,tabs:0,virtualMs:0,meter:null,writes:0,coverage:[]};
    }
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
        const transfers=[];
        for(let season=1;season<=accepted;season+=1)transfers.push(await Transfer.read(o({seasonNumber:season})));
        views[role]={multi,history,scoring,transfers};
      }
    })().then(()=>{done=true;},e=>{error=e;done=true;});
    await sim.run(()=>done,{untilMs:sim.now+6*60*60*1000});
    if(error)throw error;
    if(!done||!views.playerOne||!views.playerTwo){this.violation("L12_LIVENESS","the final no-fault reads never answered");return;}
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
