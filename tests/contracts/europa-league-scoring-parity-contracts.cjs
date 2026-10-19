"use strict";
// r80 Europa League, one scoring rule in every JS copy (R80_EUROPA_PLAN section 7, "Scoring exists in 6 copies").
// Nik's rule: per manager and season, only winning scores: Champions League +5, Europa League +3, league title +3, domestic cup +1,
// 100 league points and/or 100 league goals +1, top scorer and/or top assist +1. One manager's season is CL or EL, never both; the
// two managers play different FIFA saves, so both may win the CL, both the EL, both the league and both the cup in one season.
// A season can score at most 11 (a CL winner); an EL winner at most 9.
//
// Every JS copy of the scorer runs the same matrix here, so none can drift:
//   1. js/sharedCanonicalScoring.js        scoreAuthoritativeResults (the authoritative breakdown and winner)
//   2. js/sharedHistoryConvergence.js      hcExpectedScore (the history's own re-check) and buildProjection (refuses any mismatch)
//   3. js/sparkTerminalClose.js            stcScoreResult (the Terminal Close progress totals the Rules re-check)
//   4. js/scoring.js                       calculatePlayerSeasonScore (local legacy mode, analytics.js and legacy.js read it)
//   5. visual-assets/v10_1/season-results/season-results.js  scoreResult and normalizeLegacyPreview (fixture harness preview)
//   6. tests/support/career-fixture-helpers.cjs              score (the fixture generator's helper)
// The Rules mirror (ssjrTerminalScore in firestore.terminal-close-production.fragment.rules) is proved by the Rules emulator tests.
// Internal functions are lifted from the shipped source text (no test hooks in product code) and run in an isolated vm context.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.join(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const Scoring=require(path.join(ROOT,"js/sharedCanonicalScoring.js"));
const History=require(path.join(ROOT,"js/sharedHistoryConvergence.js"));
const Commit=require(path.join(ROOT,"js/sharedSeasonCommit.js"));
const Helpers=require(path.join(ROOT,"tests/support/career-fixture-helpers.cjs"));

let checks=0;
function check(name,fn){try{fn();checks+=1;}catch(error){console.error("FAIL "+name+": "+error.message);throw error;}}

// Lift `function name(...){...}` (balanced braces) or a one-line `const NAME=...;` out of a source file.
function lift(src,name,file){
  const fnAt=src.indexOf(`function ${name}(`);
  if(fnAt>=0){
    const open=src.indexOf("{",src.indexOf(")",fnAt));let depth=0;
    for(let i=open;i<src.length;i+=1){const c=src[i];if(c==="{")depth+=1;else if(c==="}"){depth-=1;if(depth===0)return src.slice(fnAt,i+1);}}
  }
  const constMatch=new RegExp(`const ${name}=[^;]*;`).exec(src);
  if(constMatch)return constMatch[0];
  throw new Error(`${file}: ${name} not found`);
}
function liftAll(file,names,expose){
  const src=read(file);
  const code=names.map(name=>lift(src,name,file)).join("\n")+`\n;(${expose})`;
  return vm.runInNewContext(code,{Object,Number,Boolean,Error,Array,JSON});
}

const terminalScore=liftAll("js/sparkTerminalClose.js",["RESULT_KEYS","stpFail","stcExactObject","stcEuropaLeague","stcScoreResult"],"stcScoreResult");
const historyScore=liftAll("js/sharedHistoryConvergence.js",["hcExpectedScore"],"hcExpectedScore");
const localScore=vm.runInNewContext(read("js/scoring.js")+"\n;calculatePlayerSeasonScore",{Object,Number,Boolean});
const previewScore=liftAll("visual-assets/v10_1/season-results/season-results.js",["scoreResult"],"scoreResult");
const previewNormalize=liftAll("visual-assets/v10_1/season-results/season-results.js",["scoreResult","normalizeLegacyPreview"],"normalizeLegacyPreview");

// The matrix: every combination of the scoring inputs, with the continental competition as none, CL or EL.
const CONTINENTAL={none:{championsLeague:false},cl:{championsLeague:true},el:{championsLeague:false,europaLeague:true}};
const cases=[];
for(const leaguePosition of [1,2])for(const leaguePoints of [99,100])for(const leagueGoals of [99,100])for(const domesticCup of [false,true])
  for(const continental of Object.keys(CONTINENTAL))for(const topScorer of [false,true])for(const topAssist of [false,true]){
    const result={leaguePosition,leaguePoints,leagueGoals,domesticCup,championsLeague:false,topScorer,topAssist};
    Object.assign(result,CONTINENTAL[continental]);
    const expected={championsLeague:continental==="cl"?5:0,europaLeague:continental==="el"?3:0,leagueTitle:leaguePosition===1?3:0,domesticCup:domesticCup?1:0,performanceBonus:leaguePoints>=100||leagueGoals>=100?1:0,individualAwardsBonus:topScorer||topAssist?1:0};
    expected.total=Object.values(expected).reduce((a,b)=>a+b,0);
    cases.push({result,continental,expected});
  }
const label=c=>JSON.stringify(c.result);

(async()=>{
  const scoring=await Scoring.createProtocol({teamCount:20,cryptoImpl:webcrypto,seasonCommitModule:Commit});
  const opponent={leaguePosition:20,leaguePoints:0,leagueGoals:0,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};

  check("matrix size",()=>assert.equal(cases.length,192));
  check("canonical scoring (authoritative)",()=>{for(const c of cases){
    const scored=scoring.scoreAuthoritativeResults({playerOne:c.result,playerTwo:opponent}),b=scored.scoring.playerOne;
    assert.equal(b.total,c.expected.total,label(c));
    for(const key of ["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus"])assert.equal(b[key],c.expected[key],`${label(c)} ${key}`);
    // Sparse: europaLeague:3 only for an EL winner; otherwise the breakdown is the r79 shape.
    assert.equal(Object.hasOwn(b,"europaLeague"),c.continental==="el",label(c));if(c.continental==="el")assert.equal(b.europaLeague,3);
    assert.equal(Object.hasOwn(scored.results.playerOne,"europaLeague"),c.continental==="el",label(c));
  }});
  check("history re-check (hcExpectedScore)",()=>{for(const c of cases){const h=historyScore(c.result);assert.equal(h.total,c.expected.total,label(c));assert.equal(h.europaLeague||0,c.expected.europaLeague,label(c));assert.equal(Object.hasOwn(h,"europaLeague"),c.continental==="el",label(c));}});
  check("terminal close progress (stcScoreResult)",()=>{for(const c of cases)assert.equal(terminalScore(c.result),c.expected.total,label(c));});
  check("local legacy mode (calculatePlayerSeasonScore)",()=>{for(const c of cases){const s=localScore(c.result);assert.equal(s.total,c.expected.total,label(c));assert.equal(s.europaLeague||0,c.expected.europaLeague,label(c));}});
  check("season results preview (scoreResult)",()=>{for(const c of cases)assert.equal(previewScore(c.result),c.expected.total,label(c));});
  check("season results preview (normalizeLegacyPreview)",()=>{for(const c of cases){const frame={previewLabel:"Preview data",phase:"committed",scoringState:null,managers:{daniel:c.result,nik:opponent}};previewNormalize(frame);assert.equal(frame.breakdown.daniel.total,c.expected.total,label(c));assert.equal(frame.breakdown.daniel.europaLeague||0,c.expected.europaLeague,label(c));}});
  check("fixture helper (score)",()=>{for(const c of cases){const s=Helpers.score(c.result);assert.equal(s.total,c.expected.total,label(c));assert.deepEqual(s,{...Object.fromEntries(Object.entries(scoring.scoreAuthoritativeResults({playerOne:c.result,playerTwo:opponent}).scoring.playerOne).filter(([k])=>k!=="triggers"))},label(c));}});

  check("maximum season: CL 11, EL 9",()=>{
    const best=k=>Math.max(...cases.filter(c=>c.continental===k).map(c=>scoring.scoreAuthoritativeResults({playerOne:c.result,playerTwo:opponent}).scoring.playerOne.total));
    assert.equal(best("cl"),11);assert.equal(best("el"),9);assert.equal(best("none"),6);
  });

  // One manager's season with both CL and EL is the only impossible case; every authoritative copy refuses it.
  const both={leaguePosition:1,leaguePoints:100,leagueGoals:100,domesticCup:true,championsLeague:true,europaLeague:true,topScorer:true,topAssist:true};
  check("one manager CL + EL is refused",()=>{
    assert.throws(()=>scoring.scoreAuthoritativeResults({playerOne:both,playerTwo:opponent}),{code:"CANONICAL_SCORING_RESULTS_INVALID"});
    assert.throws(()=>scoring.scoreAuthoritativeResults({playerOne:opponent,playerTwo:both}),{code:"CANONICAL_SCORING_RESULTS_INVALID"});
    assert.throws(()=>terminalScore(both),{code:"TERMINAL_CLOSE_SEASON_COMMIT_INVALID"});
    // The local copies (no validation) never let both count: the season still caps at 11.
    assert.equal(localScore(both).total,11);assert.equal(previewScore(both),11);
  });
  check("europaLeague must be exactly true",()=>{for(const bad of [false,"true",1,0,null]){const r={...opponent,europaLeague:bad};assert.throws(()=>scoring.scoreAuthoritativeResults({playerOne:r,playerTwo:opponent}),{code:"CANONICAL_SCORING_RESULTS_INVALID"});assert.throws(()=>terminalScore(r),{code:"TERMINAL_CLOSE_SEASON_COMMIT_INVALID"});}});

  // Different FIFA saves: both managers may win the same competition in the same season. Never a clash, never refused.
  const elWinner={leaguePosition:1,leaguePoints:90,leagueGoals:80,domesticCup:true,championsLeague:false,europaLeague:true,topScorer:false,topAssist:false};
  const clWinner={leaguePosition:1,leaguePoints:90,leagueGoals:80,domesticCup:true,championsLeague:true,topScorer:false,topAssist:false};
  check("both managers may win the EL, the CL, the league and the cup in one season",()=>{
    let s=scoring.scoreAuthoritativeResults({playerOne:elWinner,playerTwo:{...elWinner,leaguePoints:89}});
    assert.equal(s.scoring.playerOne.total,7);assert.equal(s.scoring.playerTwo.total,7);assert.equal(s.winner,"playerOne","the tie-break (league points) is unchanged");
    s=scoring.scoreAuthoritativeResults({playerOne:clWinner,playerTwo:clWinner});assert.equal(s.scoring.playerOne.total,9);assert.equal(s.winner,"draw");
    s=scoring.scoreAuthoritativeResults({playerOne:clWinner,playerTwo:elWinner});assert.equal(s.scoring.playerOne.total-s.scoring.playerTwo.total,2);assert.equal(s.winner,"playerOne");
    assert.equal(terminalScore(elWinner),7);assert.equal(terminalScore(clWinner),9);
  });

  // The history accepts the canonical breakdown of an EL season (it refuses any mismatch) and counts it as a trophy.
  check("history counts Europa League wins and trophies",()=>{
    const p=Helpers.projection({seed:"e",totalSeasons:3,seasons:[[elWinner,{...elWinner,leaguePoints:70}],[clWinner,elWinner],[opponent,opponent]]});
    History.verifyProjection(p);
    assert.equal(p.managerRecords.playerOne.europaLeagues,1);assert.equal(p.managerRecords.playerTwo.europaLeagues,2);
    assert.equal(p.managerRecords.playerOne.championsLeagues,1);assert.equal(p.managerRecords.playerTwo.championsLeagues,0);
    assert.equal(p.managerRecords.playerOne.totalTrophies,1+1+2+2,"CL 1 + EL 1 + league titles 2 + cups 2");
    assert.equal(p.managerRecords.playerTwo.totalTrophies,2+2+2,"EL 2 + league titles 2 + cups 2");
    assert.equal(p.trophyAttribution.playerTwo.europaLeagues,2);
    assert.equal(p.managerRecords.playerOne.totalPoints,7+9+0);assert.equal(p.managerRecords.playerTwo.totalPoints,7+7+0);
    assert.equal(p.managerRecords.playerOne.perfectSeasons,0,"a perfect (11-point) season stays Champions League only");
    assert.deepEqual(Object.keys(p.seasonHistory[0].playerOne).filter(k=>k!=="scoring"),["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist","europaLeague"]);
    assert.equal(Object.hasOwn(p.seasonHistory[2].playerOne,"europaLeague"),false,"a season without the win stays 7 keys");
    // Tampering with the key or its points is caught by the rebuild.
    const tampered=JSON.parse(JSON.stringify(p));tampered.seasonHistory[0].playerOne.scoring.europaLeague=5;
    assert.throws(()=>History.verifyProjection(tampered),/HISTORY_CONVERGENCE/);
    const dropped=JSON.parse(JSON.stringify(p));delete dropped.seasonHistory[0].playerOne.europaLeague;
    assert.throws(()=>History.verifyProjection(dropped),/HISTORY_CONVERGENCE/);
  });
  console.log(`PASS europa-league-scoring-parity: ${checks} checks; ${cases.length} cases agree in 6 JS scorers (canonical, history, terminal close, local, preview, fixture helper).`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
