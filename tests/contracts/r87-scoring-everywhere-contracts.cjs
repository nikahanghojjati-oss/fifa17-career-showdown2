"use strict";
// r87 scoring audit (2.0.0): one scoring story from the season scorer to every career screen, for every length Nik plays.
// Nik's rules: per manager and season only winning scores (CL +5, EL +3, league title +3, domestic cup +1, 100 league points
// and/or 100 league goals +1, top scorer and/or top assist +1), so a season is 0-11 and an EL season at most 9. One manager's
// season is CL or EL, never both (different seasons count both). More Showdown points wins; equal points (0-0 included) is a
// DRAW / level everywhere, and league position, points or goals never decide anything. Golden Showdown = 110 in a finished
// 10-season Showdown, judged per manager. Lengths are 1, 3, 5 and 10 only.
//
// Unlike the per-season parity matrix (europa-league-scoring-parity), this drives whole Showdowns through the shipped chain:
// canonical scorer -> History projection (rebuild-verified) -> career model -> Career Statistics / Trophy Room / Legacy /
// Rivalry frames -> Golden Showdown seam, plus the Terminal Close season scorer and the local scoring.js totals, and checks
// that every place tells the same totals, season W-D-L, Showdown result, level ranks and Golden Showdown.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const Scoring=require(path.join(ROOT,"js/sharedCanonicalScoring.js"));
const Commit=require(path.join(ROOT,"js/sharedSeasonCommit.js"));
const History=require(path.join(ROOT,"js/sharedHistoryConvergence.js"));
const Career=require(path.join(ROOT,"js/sharedCareerAnalytics.js"));
const CareerScreens=require(path.join(ROOT,"js/careerScreensV10.js"));
const RivalryLegacy=require(path.join(ROOT,"js/rivalryLegacyV10.js"));

function classic(file,name){const context={console};context.globalThis=context;context.window=context;vm.createContext(context);vm.runInContext(read(file),context,{filename:file});return name?context[name]:context;}
const Seam=classic("js/careerScreenSeam.js","CareerModeCareerScreenSeam");
const Local=classic("js/scoring.js");
// Terminal Close's own season scorer (the Rules re-check the totals it writes), lifted as the parity contract does.
function lift(src,name){const at=src.indexOf(`function ${name}(`);assert.ok(at>=0,name);const open=src.indexOf("{",src.indexOf(")",at));let depth=0;for(let i=open;i<src.length;i+=1){if(src[i]==="{")depth+=1;else if(src[i]==="}"&&--depth===0)return src.slice(at,i+1);}throw new Error(name);}
const stcSrc=read("js/sparkTerminalClose.js");
const stcScore=vm.runInNewContext(`const RESULT_KEYS=["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"];function stpFail(c){const e=new Error(c);e.code=c;throw e;}${["stcExactObject","stcEuropaLeague","stcScoreResult"].map(n=>lift(stcSrc,n)).join("\n")};stcScoreResult`);

const plain=value=>JSON.parse(JSON.stringify(value));
const MANAGERS=["daniel","nik"],ROLES=["playerOne","playerTwo"];
let checks=0;const ok=label=>{checks+=1;};

// Deterministic generator (no Math.random: a failure must replay).
function rng(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function randomResult(r){
  const europe=r()<0.15?"cl":r()<0.18?"el":"none";
  const out={leaguePosition:r()<0.25?1:1+Math.floor(r()*20),leaguePoints:Math.floor(r()*115),leagueGoals:Math.floor(r()*120),domesticCup:r()<0.25,championsLeague:europe==="cl",topScorer:r()<0.2,topAssist:r()<0.2};
  if(europe==="el")out.europaLeague=true;
  return out;
}
const perfect=()=>({leaguePosition:1,leaguePoints:101,leagueGoals:100,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true});
const zero=()=>({leaguePosition:20,leaguePoints:10,leagueGoals:12,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false});
const elBest=()=>({leaguePosition:1,leaguePoints:101,leagueGoals:100,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false,europaLeague:true});

async function main(){
  const protocol=await Scoring.createProtocol({teamCount:20,cryptoImpl:webcrypto,seasonCommitModule:Commit});
  const hash=n=>"sha256:"+String(n).padStart(64,"0");
  const slots=[{slotId:"playerOne",accountId:"acct_daniel",profileId:"profile_"+"a".repeat(24),saveId:"save_"+"a".repeat(24),entitlementState:"active"},{slotId:"playerTwo",accountId:"acct_nik",profileId:"profile_"+"b".repeat(24),saveId:"save_"+"b".repeat(24),entitlementState:"active"}];

  // One Showdown through the authoritative chain; scoring comes from the shipped canonical scorer, never a test copy.
  function showdown(seedChar,totalSeasons,seasons){
    const rivalryId="pair_"+seedChar.repeat(64);
    const p=History.buildProjection({rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons,leagueId:"premier_league",clubs:{playerOne:"club_a",playerTwo:"club_b"}},managerSlots:slots,
      seasons:seasons.map(([a,b],i)=>{const n=i+1,h=hash(n),scored=protocol.scoreAuthoritativeResults({playerOne:a,playerTwo:b});
        return {commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,results:{playerOne:a,playerTwo:b}},
          scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,scoring:plain(scored.scoring),winner:scored.winner}};})});
    History.verifyProjection(p);
    const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
    return {rivalryId,classification:"completed",projection:p,final:{totals:{playerOne:a,playerTwo:b},winner:a>b?"playerOne":b>a?"playerTwo":"draw"}};
  }

  // Everything one Showdown (or one career of Showdowns) must agree on.
  function verifyCareer(list,specs){
    const model=Career.buildCareerModel({indexStatus:"ready",showdowns:list});
    assert.equal(model.status,"ready","every Showdown reads");
    const expect={daniel:{points:0,w:0,d:0,l:0,sw:0,sd:0,sl:0,cl:0,el:0,lt:0,dc:0,perfect:0,golden:0},nik:{points:0,w:0,d:0,l:0,sw:0,sd:0,sl:0,cl:0,el:0,lt:0,dc:0,perfect:0,golden:0}};
    specs.forEach(({totalSeasons,seasons},index)=>{
      const totals={daniel:0,nik:0};
      const local={rounds:seasons.map(([a,b])=>({playerOne:{...a},playerTwo:{...b}}))};Local.recalculateShowdownScores(local);
      seasons.forEach(([a,b],i)=>{
        const scored=protocol.scoreAuthoritativeResults({playerOne:a,playerTwo:b});
        const pair={daniel:scored.scoring.playerOne.total,nik:scored.scoring.playerTwo.total};
        [a,b].forEach((r,k)=>{
          const t=pair[MANAGERS[k]];
          assert.ok(t>=0&&t<=11,"a season scores 0-11");
          if(r.europaLeague===true)assert.ok(t<=9,"a Europa League season scores at most 9");
          assert.equal(stcScore(r),t,"Terminal Close scores the season the same");
          assert.equal(local.rounds[i][ROLES[k]].scoring.total,t,"local scoring.js scores the season the same");
          const m=expect[MANAGERS[k]];if(r.championsLeague)m.cl+=1;if(r.europaLeague===true)m.el+=1;if(r.leaguePosition===1)m.lt+=1;if(r.domesticCup)m.dc+=1;if(t===11)m.perfect+=1;
        });
        // No tiebreak: only the two Showdown totals decide; equal totals are a draw whatever the league table says.
        const w=pair.daniel>pair.nik?"playerOne":pair.nik>pair.daniel?"playerTwo":"draw";
        assert.equal(scored.winner,w,"canonical season winner is totals-only");
        assert.equal(local.rounds[i].winner,w,"local season winner is totals-only");
        assert.equal(Career.seasonTiebreak({playerOne:{scoring:{total:pair.daniel}},playerTwo:{scoring:{total:pair.nik}}}),w==="draw"?"draw":"none");
        if(w==="draw"){expect.daniel.sd+=1;expect.nik.sd+=1;}else{const W=w==="playerOne"?"daniel":"nik",L=W==="daniel"?"nik":"daniel";expect[W].sw+=1;expect[L].sl+=1;}
        totals.daniel+=pair.daniel;totals.nik+=pair.nik;
      });
      assert.deepEqual(plain(local.score),{playerOne:totals.daniel,playerTwo:totals.nik},"local Showdown totals match");
      const row=model.history.showdowns[index];
      assert.deepEqual(plain(row.totals),totals,"History row totals match the season sum");
      assert.equal(row.seasons.length,totalSeasons);
      row.seasons.forEach((s,i)=>{const sum=s.score;assert.ok(Number.isInteger(sum.daniel)&&Number.isInteger(sum.nik));assert.equal(s.tiebreak,sum.daniel===sum.nik?"draw":"none");assert.equal(s.winner,sum.daniel>sum.nik?"daniel":sum.nik>sum.daniel?"nik":"draw",`season ${i+1} winner on the History row`);});
      const fw=totals.daniel>totals.nik?"daniel":totals.nik>totals.daniel?"nik":"draw";
      assert.equal(row.winner,fw,"Showdown winner is totals-only");
      if(fw==="draw"){expect.daniel.d+=1;expect.nik.d+=1;}else{expect[fw].w+=1;expect[fw==="daniel"?"nik":"daniel"].l+=1;}
      const golden=MANAGERS.filter(m=>totalSeasons===10&&totals[m]===110);
      assert.deepEqual(plain(Seam.goldenShowdownManagers(row)),golden,"Golden Showdown is exactly 110 in a finished 10-season Showdown, per manager");
      golden.forEach(m=>{expect[m].golden+=1;});
      expect.daniel.points+=totals.daniel;expect.nik.points+=totals.nik;
    });
    for(const m of MANAGERS){
      const rec=model.managers[m],e=expect[m];
      assert.equal(rec.careerPoints,e.points,`${m} career points`);
      assert.deepEqual([rec.seasonWins,rec.seasonDraws,rec.seasonLosses],[e.sw,e.sd,e.sl],`${m} season W-D-L`);
      assert.equal(rec.seasonWins+rec.seasonDraws+rec.seasonLosses,rec.seasons);
      assert.deepEqual(plain(rec.showdowns),{completed:specs.length,wins:e.w,draws:e.d,losses:e.l},`${m} Showdown W-D-L`);
      assert.deepEqual([rec.championsLeagues,rec.europaLeagues,rec.leagueTitles,rec.domesticCups,rec.totalTrophies,rec.perfectSeasons],[e.cl,e.el,e.lt,e.dc,e.cl+e.el+e.lt+e.dc,e.perfect],`${m} cabinet`);
    }
    // Draws mirror; equal career points are level (#1 each), never broken by season wins or league position.
    assert.equal(model.managers.daniel.seasonDraws,model.managers.nik.seasonDraws);
    assert.equal(model.managers.daniel.seasonWins,model.managers.nik.seasonLosses);
    const level=expect.daniel.points===expect.nik.points;
    const tr=plain(CareerScreens.toV10Frame(model,"trophyRoom")),cs=plain(CareerScreens.toV10Frame(model,"careerStatistics"));
    assert.equal(tr.status,"ready");assert.equal(cs.status,"ready");
    const ranks=Object.fromEntries(tr.standings.map(r=>[r.manager,r.rank]));
    if(level)assert.deepEqual(ranks,{daniel:"#1",nik:"#1"},"equal career points are level in the Trophy Room");
    else{const lead=expect.daniel.points>expect.nik.points?"daniel":"nik";assert.equal(ranks[lead],"#1");assert.equal(ranks[lead==="daniel"?"nik":"daniel"],"#2");}
    const csRanks=Object.fromEntries(cs.expectedCareerTableRows.map(r=>[r.manager,r.rank]));
    if(level)assert.deepEqual(csRanks,{daniel:1,nik:1},"equal career points are level on Career Statistics");
    for(const m of MANAGERS){assert.equal(tr.managers[m].careerPoints,expect[m].points);assert.equal(tr.showdowns[m].wins,expect[m].w);}
    const goldenCounts={daniel:expect.daniel.golden,nik:expect.nik.golden};
    if(goldenCounts.daniel||goldenCounts.nik){assert.deepEqual(tr.goldenShowdowns,goldenCounts);assert.deepEqual(cs.goldenShowdowns,goldenCounts);}
    else{assert.equal(tr.goldenShowdowns,undefined);assert.equal(cs.goldenShowdowns,undefined);}
    const legacy=plain(RivalryLegacy.toV10Frame(model,"legacy"));
    legacy.showdowns.forEach(card=>{const row=model.history.showdowns.find(r=>r.number===card.number);assert.deepEqual(card.totals,plain(row.totals),"Legacy card totals");assert.equal(card.winner,row.winner,"Legacy card result");});
    return model;
  }

  // 1. Seeded random careers at every length.
  const seeds=[1,7,42,99,2026,1031,8000,31337];
  const chars="0123456789abcdef";
  for(const seed of seeds){
    const r=rng(seed),specs=[1,3,5,10].map(totalSeasons=>({totalSeasons,seasons:Array.from({length:totalSeasons},()=>[randomResult(r),randomResult(r)])}));
    verifyCareer(specs.map((s,i)=>showdown(chars[(seed+i)%16],s.totalSeasons,s.seasons)),specs);
  }
  ok("seeded careers of 1/3/5/10-season Showdowns agree on every screen");

  // 2. Draws: 0-0 seasons, every season level, a drawn Showdown that one manager led on league position.
  {
    const lowTable={...zero(),leaguePosition:2},highTable={...zero(),leaguePosition:19};
    const specs=[{totalSeasons:1,seasons:[[zero(),zero()]]},{totalSeasons:3,seasons:[[lowTable,highTable],[perfect(),perfect()],[elBest(),elBest()]]}];
    const model=verifyCareer(specs.map((s,i)=>showdown("cd"[i],s.totalSeasons,s.seasons)),specs);
    assert.deepEqual(model.history.showdowns.map(r=>r.winner),["draw","draw"]);
    assert.equal(model.managers.daniel.seasonDraws,4);
  }
  ok("0-0 and level seasons are draws; league position never decides");

  // 3. Europe: both win the CL in one season (separate saves), both the EL, and one manager CL one season and EL the next.
  {
    const cl={...zero(),championsLeague:true},el={...zero(),europaLeague:true};
    const specs=[{totalSeasons:3,seasons:[[cl,cl],[el,el],[cl,el]]}];
    const model=verifyCareer(specs.map(s=>showdown("e",s.totalSeasons,s.seasons)),specs);
    assert.deepEqual(model.history.showdowns[0].seasons.map(s=>[s.score.daniel,s.score.nik]),[[5,5],[3,3],[5,3]]);
    assert.deepEqual([model.managers.daniel.championsLeagues,model.managers.daniel.europaLeagues],[2,1]);
    assert.deepEqual([model.managers.nik.championsLeagues,model.managers.nik.europaLeagues],[1,2]);
    // One manager's season with both is refused by every scorer.
    const both={...zero(),championsLeague:true,europaLeague:true};
    assert.throws(()=>protocol.scoreAuthoritativeResults({playerOne:both,playerTwo:zero()}),/CANONICAL_SCORING_RESULTS_INVALID/);
    assert.throws(()=>stcScore(both),/TERMINAL_CLOSE_SEASON_COMMIT_INVALID/);
    assert.equal(Local.calculatePlayerSeasonScore(both).total,5,"local legacy mode never adds the EL to a CL season");
    assert.equal(protocol.scoreAuthoritativeResults({playerOne:elBest(),playerTwo:zero()}).scoring.playerOne.total,9,"best EL season is 9");
  }
  ok("CL +5 and EL +3 per manager, both managers may win either, never CL and EL in one manager's season");

  // 4. Golden Showdown edges: 110 for one, 110 for both (a drawn Showdown, gold for both), 109, and 11 every season of a 5.
  {
    const ten=()=>({...perfect(),topScorer:false,topAssist:false});
    const specs=[
      {totalSeasons:10,seasons:Array.from({length:10},()=>[zero(),perfect()])},
      {totalSeasons:10,seasons:Array.from({length:10},()=>[perfect(),perfect()])},
      {totalSeasons:10,seasons:Array.from({length:10},(_,i)=>[i===4?ten():perfect(),zero()])},
      {totalSeasons:5,seasons:Array.from({length:5},()=>[perfect(),zero()])}
    ];
    const model=verifyCareer(specs.map((s,i)=>showdown("f9a5"[i],s.totalSeasons,s.seasons)),specs);
    assert.deepEqual(model.history.showdowns.map(r=>plain(Seam.goldenShowdownManagers(r))),[["nik"],["daniel","nik"],[],[]]);
    assert.equal(model.history.showdowns[1].winner,"draw","110-110 is still a DRAW");
  }
  ok("Golden Showdown is 110 in a 10-season Showdown, per manager, draws included");

  console.log(`PASS r87 scoring everywhere: ${checks} checks (${seeds.length} seeded careers x lengths 1/3/5/10, draws, Europe, Golden Showdown) agree from the season scorer to every career screen.`);
}
main().catch(error=>{console.error(error);process.exit(1);});
