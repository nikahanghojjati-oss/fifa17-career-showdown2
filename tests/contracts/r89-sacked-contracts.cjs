"use strict";
// r89 Sacked (Nik 2026-11-03): on Season Results either manager may tick "I was sacked" for himself (with a confirm step).
// Any sacking ends the Showdown after that season; the points so far decide (equal = DRAW, being sacked is not losing); it
// counts on every career screen as a COMPLETED Showdown, never the hidden "ended early" kind. A sacking in the planned last
// season is a full-length Showdown (Golden still possible). Only Showdowns confirmed from SACKED_FROM_MS (the r89 release,
// set with tools/set-release-time.cjs --r89) show the tick. The Rules side is proven in tests/firebase/sacked-rules-emulator.cjs.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const H=require("../support/career-fixture-helpers.cjs");
const History=require("../../js/sharedHistoryConvergence.js");
const Multi=require("../../js/sharedMultiSeasonProgression.js").createProtocol();
const Final=require("../../js/sharedFinalReconciliation.js");
const Terminal=require("../../js/sharedTerminalClose.js");
const Seam=require("../../js/careerScreenSeam.js");
const Gazette=require("../../js/touchlineGazette.js");

let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const r=H.result;
const setupOf=p=>({phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:p.totalSeasons,leagueId:p.leagueId,clubs:{playerOne:"club_a",playerTwo:"club_b"}});
const derive=p=>Multi.derive({rivalryId:p.rivalryId,setup:setupOf(p),history:p});
function finalOf(p){
  const state=derive(p);
  const slot=role=>({saveId:(role==="playerOne"?"save_"+"a".repeat(24):"save_"+"b".repeat(24)),profileId:(role==="playerOne"?"profile_"+"a".repeat(24):"profile_"+"b".repeat(24)),managerRole:role});
  return Final.reconcile({sharedActive:true,multiSeason:{ok:true,authoritative:true,phase:state.phase,rivalryId:p.rivalryId,state},history:{ok:true,authoritative:true,phase:"HISTORY_CONVERGED",rivalryId:p.rivalryId,projection:p},localReconciliation:{phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:slot("playerOne")}});
}
const SESSION="session_"+"c".repeat(64);

// S1 history: the sparse key is kept, scores nothing, and a sacked season is the last one.
{
  const p=H.projection({seed:"3",totalSeasons:3,seasons:[[r({leaguePosition:1}),r()],[r({domesticCup:true}),r({sacked:true})]]});
  assert.equal(p.seasonHistory[1].playerTwo.sacked,true);assert.equal("sacked" in p.seasonHistory[1].playerOne,false);
  assert.equal(p.seasonHistory[1].playerTwo.scoring.total,0,"being sacked scores nothing and costs nothing");
  assert.deepEqual(History.showdownEnd.ofProjection(p),{finalSeason:2,endedBy:"sacked",sackedSeason:2,sacked:{playerOne:false,playerTwo:true},fullLength:false});
  assert.throws(()=>H.projection({seed:"4",totalSeasons:3,seasons:[[r({sacked:true}),r()],[r(),r()]]}),/HISTORY_CONVERGENCE_SEASONS_INVALID/,"no season after a sacked one");
  for(const bad of [false,"true",1,null])assert.throws(()=>H.projection({seed:"5",totalSeasons:1,seasons:[[r({sacked:bad}),r()]]}),/INVALID/,`sacked ${JSON.stringify(bad)} is refused`);
  const full=H.projection({seed:"6",totalSeasons:3,seasons:[[r(),r()],[r(),r()],[r(),r()]]});
  assert.deepEqual(History.showdownEnd.ofProjection(full),{finalSeason:3,endedBy:"full",sackedSeason:null,sacked:{playerOne:false,playerTwo:false},fullLength:true});
  ok("S1","history keeps sacked:true (scores 0), refuses any season after a sacked one and any other value; a normal Showdown ends full length");
}

// S2 progression: the sacked season is terminal; old states verify unchanged.
{
  const p=H.projection({seed:"7",totalSeasons:5,seasons:[[r(),r()],[r({sacked:true}),r()]]});
  const state=derive(p);
  assert.equal(state.phase,"SHOWDOWN_COMPLETE");assert.equal(state.terminal,true);assert.equal(state.activeSeason,null);
  assert.equal(state.sackedSeason,2);assert.equal(state.acceptedSeasons,2);assert.equal(state.totalSeasons,5,"totalSeasons keeps the planned length");
  assert.deepEqual(Multi.verifyState(state),state);
  assert.throws(()=>Multi.verifyState({...state,sackedSeason:1}),/MULTI_SEASON_STATE_INVALID/);
  const plain=derive(H.projection({seed:"8",totalSeasons:5,seasons:[[r(),r()],[r(),r()]]}));
  assert.equal("sackedSeason" in plain,false);assert.equal(plain.terminal,false);assert.equal(plain.activeSeason,3);
  ok("S2","a sacking in season 2 of 5 makes the state SHOWDOWN_COMPLETE (sackedSeason 2, planned length kept); a state without the key is the unchanged shape");
}

// S3 final + terminal witness: points so far decide, equal = DRAW, completedSeason = the seasons played.
{
  const p=H.projection({seed:"9",totalSeasons:3,seasons:[[r({championsLeague:true}),r()],[r(),r({leaguePosition:1,sacked:true})]]});
  const final=finalOf(p);
  assert.equal(final.phase,"FINAL_SEASON_RECONCILED");assert.equal(final.completedSeason,2);assert.equal(final.acceptedSeasons,2);assert.equal(final.totalSeasons,3);
  assert.equal(final.endedBy,"sacked");assert.deepEqual(final.sacked,{playerOne:false,playerTwo:true});
  assert.deepEqual(final.managerTotals,{playerOne:5,playerTwo:3});assert.equal(final.winner,"playerOne");
  const intent=Terminal.prepare(final,{sessionId:SESSION});
  assert.equal(intent.completedSeason,2);assert.equal(intent.endedBy,"sacked");assert.deepEqual(intent.sacked,{playerOne:false,playerTwo:true});
  for(const bad of [{...intent,sacked:{playerOne:false,playerTwo:false}},{...intent,completedSeason:4},(()=>{const {sacked:_s,...rest}=intent;return rest;})(),{...intent,endedBy:"quit"},{...intent,sacked:{playerOne:false}}])assert.throws(()=>Terminal.verifyIntent(bad),/TERMINAL_CLOSE/);
  const level=finalOf(H.projection({seed:"a",totalSeasons:10,seasons:[[r({domesticCup:true}),r({topScorer:true,sacked:true})]]}));
  assert.equal(level.winner,"draw","equal points after a sacking are a DRAW, never a tiebreak");assert.equal(level.completedSeason,1);
  const fullFinal=finalOf(H.projection({seed:"b",totalSeasons:1,seasons:[[r(),r({leaguePosition:1})]]}));
  assert.equal("endedBy" in fullFinal,false);assert.equal("endedBy" in Terminal.prepare(fullFinal,{sessionId:SESSION}),false);
  ok("S3","the final and the Terminal Close witness end after season 2 of 3 (endedBy sacked, the exact map); the sacked manager is not the loser by rule; equal = DRAW; a full-length witness has no new keys");
}

// S4 a sacking in the planned last season is full length (Golden possible); earlier it never is.
{
  const max={leaguePosition:1,leaguePoints:104,leagueGoals:101,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true,primePack:4};
  const last=H.projection({seed:"c",totalSeasons:10,seasons:Array.from({length:10},(_,i)=>i===9?[max,r({sacked:true})]:[max,r()])});
  const end=History.showdownEnd.ofProjection(last);assert.equal(end.fullLength,true);assert.equal(end.finalSeason,10);
  const edition=Gazette.finalEdition({projection:last});
  assert.equal(edition.golden,true,"150 over ten seasons is Golden even with a sacking in season 10");assert.equal(edition.paper.season,"10 seasons");
  const early=H.projection({seed:"d",totalSeasons:10,seasons:Array.from({length:9},(_,i)=>i===8?[max,r({sacked:true})]:[max,r()])});
  const short=Gazette.finalEdition({projection:early});
  assert.equal(short.golden,false,"135 over nine seasons is never Golden");assert.equal(short.seasonNumber,9);assert.equal(short.totalSeasons,10);
  assert.deepEqual(short.sacked,["Nik"]);assert.equal(short.situation,"sacked-one-loser");assert.equal(short.paper.season,"9 of 10 seasons · sacked");
  const both=Gazette.finalEdition({projection:H.projection({seed:"e",totalSeasons:3,seasons:[[r({sacked:true}),r({sacked:true})]]})});
  assert.equal(both.situation,"sacked-both-draw");assert.deepEqual(both.sacked,["Daniel","Nik"]);
  ok("S4","a sacking in season 10 of 10 is a full-length Golden Showdown; a sacking in season 9 is never Golden and the Final Gazette prints the sacked edition (9 of 10 seasons · sacked)");
}

// S5 career screens: a sacked Showdown is completed, with its own label (never the ended-early text).
{
  const row={status:"completed",endedBy:"sacked",sackedSeason:4,totalSeasons:10,sacked:{daniel:false,nik:true}};
  assert.equal(Seam.sackedText(row),"Ended — sacked in season 4 of 10 (Nik)");
  assert.equal(Seam.sackedText({...row,sacked:{daniel:true,nik:true}}),"Ended — sacked in season 4 of 10 (Daniel and Nik)");
  assert.equal(Seam.sackedText({status:"completed",totalSeasons:10}),"");
  assert.ok(!Seam.sackedText(row).includes(Seam.TEXT.historyStatus.abandoned),"never the ended-early wording");
  const analytics=read("js/sharedCareerAnalytics.js");
  assert.match(analytics,/endedBy/);assert.match(analytics,/sackedSeason/);
  for(const file of ["js/rivalryLegacyV10.js","visual-assets/v10_1/legacy/legacy.js","visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js","js/seasonFinalV10.js"])assert.match(read(file),/SACKED|sacked/i,`${file} shows the sacked mark`);
  ok("S5","career rows say \"Ended — sacked in season X of N (Name)\" on a completed Showdown; History, Legacy, Rivalry Statistics and Final Winner carry the SACKED mark");
}

// S6 the Season Results tick: own card only, confirm step, release-gated.
{
  const html=read("index.html");
  for(const id of ["p1Sacked","p2Sacked"])assert.match(html,new RegExp(`<input id="${id}" type="checkbox">`),`${id} tick`);
  assert.match(html,/I was sacked this season/);
  const src=read("js/productionSharedSeasonResults.js");
  assert.match(src,/const SACKED_FROM_MS=Date\.parse\("[0-9TZ:.-]+"\);/);
  assert.match(src,/CMS_SACKED/);assert.match(src,/PUBLISH · I WAS SACKED/);assert.match(src,/YES, I WAS SACKED · PUBLISH/);
  assert.match(src,/THIS SHOWDOWN ENDS AFTER SEASON/);
  const times=require("../../tools/set-release-time.cjs");
  assert.deepEqual(times.R89_RELEASE_TIME_CONSTANTS.map(c=>`${c.file}:${c.name}`),["js/productionSharedSeasonResults.js:SACKED_FROM_MS"]);
  assert.match(read("tools/set-release-time.cjs"),/--r89/);
  ok("S6","each card has its own \"I was sacked this season\" tick; PUBLISH needs a second tap to confirm; only Showdowns confirmed from SACKED_FROM_MS (set by --r89) show it");
}

// S7 the rest of the release: Rule Book card, shell path, quiet booth, Rules builder needles, no new listener.
{
  assert.match(read("js/ruleBook.js"),/createRuleSection\("10", "SACKED"/);
  const sw=read("service-worker.js");assert.match(sw,/"data\/gazetteSacked\.js",/);
  assert.match(read("js/commentaryV3.js"),/sacked===true\)return null;/);
  const builder=read("scripts/build-production-firestore-rules.mjs");
  for(const needle of ["ssjrTerminalSackedMatches","ssjrTransferPreviousSeasonOpen","'sacked'"])assert.ok(builder.includes(needle),`builder needle ${needle}`);
  // Expression budget (1,000 per request): a Showdown nobody was sacked in pays only the key tests on the progress write,
  // the full map check runs only when the new record carries 'sacked', and the prior record's key list (no 'sacked') is
  // what refuses a season after a sacked one. Measured on the emulator: season-10 progress ~929 against ~904 without Sacked.
  const terminal=read("firestore.terminal-close-production.fragment.rules");
  assert.equal(terminal.split("&& (('sacked' in progress) ? ssjrTerminalSackedMatches(progress, commit) : (!('sacked' in commit.results.playerOne) && !('sacked' in commit.results.playerTwo)))").length,3,"both progress paths guard the Sacked check on the record's own key");
  assert.ok(/return ssjrTerminalProgressShape\(prior, \['schemaVersion','runtimeRevision','totalSeasons','acceptedThroughSeason','managerTotals','closedSessionRevision'\]\)/.test(terminal),"the prior record may not hold 'sacked'");
  const sacked=require("../../data/gazetteSacked.js");
  assert.ok(sacked.stories.length>=20&&sacked.headlines.length>=10&&sacked.banter.length>=20,"the sacked Gazette lines are loaded");
  for(const file of ["js/productionSharedSeasonResults.js","js/seasonFinalV10.js","js/touchlineGazette.js","js/careerScreenSeam.js"])assert.doesNotMatch(read(file).split("SACKED")[1]||"",/onSnapshot\(/,`${file}: no new listener for Sacked`);
  ok("S7","Rule Book card 10 SACKED, the Gazette sacked lines precached, the booth stays quiet on a sacked season, the Rules builder pins the sacked rules, no new listener");
}

// S8 Codex C3: a sacked Showdown is never ended early, and the 2.2.0 phone that published a sacking says how a 2.1.0 rival updates.
{
  const pair=read("firestore.persistent-pair-production.fragment.rules");
  const abandon=pair.slice(pair.indexOf("function cmsPersistentPairAbandonValid("),pair.indexOf("function cmsPersistentPairEndedEarlyValid("));
  assert.ok(abandon.includes("&& (!('terminalProgress' in before.data) || !('sacked' in before.data.terminalProgress))"),"END SHOWDOWN is refused once a sacked season is accepted");
  assert.match(read("js/persistentNikDanielPair.js"),/Object\.hasOwn\(rivalryValue\.data\.terminalProgress,"sacked"\)\)throw pairErrorWithCode\("PERSISTENT_PAIR_SACKED_FINISHED"/);
  const settings=read("js/settings.js");
  assert.match(settings,/error\.code === "PERSISTENT_PAIR_SACKED_FINISHED"\)\{ return finishSettingsSackedShowdown\(name\); \}/);
  assert.match(settings,/async function finishSettingsSackedShowdown\(name\)\{[\s\S]*?close\.refresh\(\)[\s\S]*?close\.retry\(\)/);
  const results=read("js/productionSharedSeasonResults.js"),commit=read("js/productionSharedSeasonCommit.js");
  assert.ok(results.includes("BOTH PHONES NEED VERSION 2.2.0"),"the sacked confirm step names the version both phones need");
  assert.ok(results.includes("opens Settings and taps UPDATE TO LATEST VERSION (2.2.0)"),"the published sacked result names the Settings button");
  assert.ok(read("js/settings.js").includes('"UPDATE TO LATEST VERSION"'),"the Settings button label the hint names exists");
  assert.equal((commit.match(/\$\{sackedHint\}/g)||[]).length,2,"both commit wait lines carry the update hint");
  ok("S8","END SHOWDOWN never ends a sacked Showdown early (Rules + pair provider + Settings hands it to Terminal Close); the update hint names the rival and the Settings button");
}

console.log(`PASS r89 Sacked contracts: ${checks} numbered checks (history, progression, final and witness, Golden, career labels, the tick, release wiring).`);
