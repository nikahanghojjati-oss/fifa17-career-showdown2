"use strict";
// Hunt 1017 H1017-4 / hunt 1019 H1019-3 (JOB-1026): a new shared season (or manager role) opens Season Results with all seven
// facts empty for both managers, while same-context polls keep what the player typed.
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const SUFFIXES=["LeaguePosition","LeaguePoints","LeagueGoals","DomesticCup","ChampionsLeague","TopScorer","TopAssist"];
function node(){const classes=new Set();return {value:"",checked:false,disabled:false,textContent:"",dataset:{},classList:{toggle:(k,on)=>on?classes.add(k):classes.delete(k),contains:k=>classes.has(k)},setAttribute(){},append(){},replaceChildren(){},closest(){return null;},focus(){}};}
const PAIR="pair_"+"a".repeat(64);
const FACT={leaguePosition:1,leaguePoints:100,leagueGoals:99,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
const RIVAL={leaguePosition:3,leaguePoints:70,leagueGoals:60,domesticCup:false,championsLeague:true,topScorer:false,topAssist:true};
function harness(){
  const nodes=new Map(),field=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
  const env={season:1,role:"playerOne",reads:{},publishes:[],saveId:"local",listeners:{}};
  const setup=()=>({ready:true,rivalryId:PAIR,sessionId:"session_"+"b".repeat(64),deviceId:"device_"+"c".repeat(32),managerRole:env.role,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,totalSeasons:3,leagueId:"premier_league"}});
  const ctx=vm.createContext({console,TextEncoder,crypto:require("node:crypto").webcrypto,
    currentShowdown:{id:"local",currentRound:1,sharedJourney:{mode:"shared",rivalryId:PAIR}},
    document:{getElementById:field,querySelector:()=>null,createElement:node,createDocumentFragment:node,addEventListener(){}},
    CareerModeProductionSharedMultiSeasonProgression:{resolveSeason:()=>env.season},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>setup(),getState:setup},
    CareerModeProductionSharedTransferChallenge:{refresh:async()=>null,getState:()=>({seasonNumber:env.season,state:{phase:"COMPLETED"}})},
    CareerModeSharedShowdownCatalog:{catalog:{premier_league:Array(20).fill("club")}},
    CareerModeSharedShowdownSetup:{},CareerModeSharedSeasonResults:{},
    CareerModeSparkSharedSeasonResults:{publishResult:async o=>{env.publishes.push(o);return {ok:false,code:"SEASON_RESULTS_TEST_REJECTED"};},read:async()=>({ok:true,managerRole:env.role,seasonNumber:env.season,revision:0,state:null,ownResult:null,opponentResult:null,...(env.reads[`${env.season}|${env.role}`]||{})})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({auth:{currentUser:{uid:"daniel"}},firestore:{},firestoreSdk:{}})},
    navigateTo:async()=>true,loadRuntimeScript:async()=>{},
    addEventListener:(type,fn)=>{(env.listeners[type]=env.listeners[type]||[]).push(fn);}
  });
  vm.runInContext(fs.readFileSync(path.join(root,"js/productionSharedSeasonResults.js"),"utf8"),ctx,{filename:"productionSharedSeasonResults.js"});
  return {api:ctx.CareerModeProductionSharedSeasonResults,field,env,ctx};
}
const values=(field,prefix)=>SUFFIXES.map((s,i)=>i<3?field(prefix+s).value:field(prefix+s).checked);
const EMPTY=["","","",false,false,false,false];
const type=(field,prefix,r)=>{field(prefix+"LeaguePosition").value=String(r.leaguePosition);field(prefix+"LeaguePoints").value=String(r.leaguePoints);field(prefix+"LeagueGoals").value=String(r.leagueGoals);field(prefix+"DomesticCup").checked=r.domesticCup;field(prefix+"ChampionsLeague").checked=r.championsLeague;field(prefix+"TopScorer").checked=r.topScorer;field(prefix+"TopAssist").checked=r.topAssist;};

(async()=>{
  // 1. Season 1 shows both published results; season 2 (nothing published) starts empty for both managers and is editable.
  {
    const {api,field,env}=harness();
    env.reads["1|playerOne"]={revision:2,state:{phase:"RESULTS_READY"},ownResult:FACT,opponentResult:RIVAL,allResults:{playerOne:FACT,playerTwo:RIVAL}};
    await api.refresh();
    assert.deepEqual(values(field,"p1"),["1","100","99",true,true,true,true],"season 1 shows its published facts");
    assert.deepEqual(values(field,"p2"),["3","70","60",false,true,false,true],"season 1 shows the rival's facts once both published");
    env.season=2;await api.refresh();
    assert.equal(api.getState().seasonNumber,2);
    assert.deepEqual(values(field,"p1"),EMPTY,"new season: own seven facts cleared");
    assert.deepEqual(values(field,"p2"),EMPTY,"new season: rival seven facts cleared");
    assert.equal(field("p1LeaguePosition").disabled,false,"own fields editable");
    // 2. Same-context polls never clear typed input.
    field("p1LeaguePosition").value="5";field("p1LeaguePoints").value="61";field("p1DomesticCup").checked=true;
    for(let i=0;i<3;i+=1)await api.refresh();
    assert.deepEqual(values(field,"p1"),["5","61","",true,false,false,false],"same season polls keep typed input");
    // 3. A published own result for the new season still renders after the clear.
    env.season=3;env.reads["3|playerOne"]={revision:1,state:{phase:"COLLECTING"},ownResult:{...FACT,leaguePosition:2,championsLeague:false}};
    await api.refresh();
    assert.deepEqual(values(field,"p1"),["2","100","99",true,false,true,true],"own published season-3 facts are shown");
    assert.deepEqual(values(field,"p2"),EMPTY,"rival facts stay hidden and empty before both publish");
  }
  // 4. Unpublished season 2 never republishes season 1 facts (H1019-3): the review tap needs newly typed facts.
  {
    const {api,field,env}=harness();
    env.reads["1|playerOne"]={revision:1,state:{phase:"COLLECTING"},ownResult:FACT};
    await api.open();assert.equal(field("p1LeaguePoints").value,"100");
    env.season=2;await api.open();
    assert.deepEqual(values(field,"p1"),EMPTY,"open() for season 2 starts empty");
    type(field,"p1",{...FACT,leaguePoints:44,championsLeague:false});
    for(let i=0;i<2;i+=1)await api.refresh();
    assert.equal(field("p1LeaguePoints").value,"44","typed season-2 input kept across polls");
  }
  // 5. A changed manager role in the same season also starts from an empty form.
  {
    const {api,field,env}=harness();
    env.reads["1|playerOne"]={revision:1,state:{phase:"COLLECTING"},ownResult:FACT};
    await api.refresh();assert.equal(field("p1LeaguePosition").value,"1");
    env.role="playerTwo";await api.refresh();
    assert.deepEqual(values(field,"p1"),EMPTY,"role change clears the other role's previous facts");
    assert.deepEqual(values(field,"p2"),EMPTY,"role change starts the new role empty");
  }
  // 6. The cursor-change tick path (which resets the adapter's context) also clears on the new season.
  {
    const {api,field,env}=harness();api.install();
    env.reads["1|playerOne"]={revision:1,state:{phase:"COLLECTING"},ownResult:FACT};
    await api.refresh();assert.equal(field("p1LeagueGoals").value,"99");
    env.season=2;for(const fn of env.listeners["career-mode-shared-season-cursor-change"]||[])fn();
    for(let i=0;i<40;i+=1)await new Promise(resolve=>setImmediate(resolve));
    assert.equal(api.getState()?.seasonNumber,2,"tick refreshed season 2");
    assert.deepEqual(values(field,"p1"),EMPTY,"tick path: season 2 starts empty");
  }
  // 7. The first shared render on a page keeps what is already in the form (nothing to inherit yet).
  {
    const {api,field}=harness();field("p1LeaguePosition").value="7";field("p1TopScorer").checked=true;
    await api.refresh();
    assert.equal(field("p1LeaguePosition").value,"7");assert.equal(field("p1TopScorer").checked,true);
  }
  const source=fs.readFileSync(path.join(root,"js/productionSharedSeasonResults.js"),"utf8");
  assert.match(source,/if\(formContextKey&&formContextKey!==formKey\)\{draft=null;pssrClearForm\(\);\}formContextKey=formKey;pssrRenderEntry\(\);/,"the clear runs only when the rendered form context changes");
  console.log("PASS hunt 1017 season fields reset contracts: a new shared season or role clears all seven facts for both managers, same-context polls keep typed input, published facts still render, season 2 cannot inherit season 1 trophies.");
})().catch(error=>{console.error(error);process.exit(1);});
