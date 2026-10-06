// Expected to fail until the Rule Book explains final accumulated points and DRAW.
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const {webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'../../../../..');
const {resolveChromiumRuntime}=require(path.join(root,'tests/support/chromium-runtime.cjs'));
const F=require(path.join(root,'tests/support/active-showdown-fixtures.cjs'));
const Final=require(path.join(root,'js/sharedFinalReconciliation.js'));
const History=require(path.join(root,'js/sharedHistoryConvergence.js'));
const Scoring=require(path.join(root,'js/sharedCanonicalScoring.js'));
let server,browser;
(async()=>{
 const port=4187,url=process.env.CMS_BASE_URL||`http://127.0.0.1:${port}/`;
 if(!process.env.CMS_BASE_URL){server=spawn(process.execPath,['tests/support/static-server.cjs'],{cwd:root,env:{...process.env,CMS_TEST_PORT:String(port)},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`Local server stopped: ${code}`)));});}
 const rawSeasons=Array.from({length:10},(_,i)=>[
  F.result({leaguePosition:2,leaguePoints:60,leagueGoals:50,championsLeague:i===0}),
  F.result({leaguePosition:3,leaguePoints:59,leagueGoals:90,championsLeague:i===1})
 ]);
 const scoring=await Scoring.createProtocol({teamCount:20,cryptoImpl:webcrypto});
 const rivalryId='pair_'+'1'.repeat(64);
 const managerSlots=['playerOne','playerTwo'].map((slotId,i)=>({slotId,accountId:'game-test-'+slotId,profileId:'profile_'+String(i+1).repeat(24),saveId:'save_'+String(i+3).repeat(24),entitlementState:'active'}));
 const p=History.buildProjection({rivalryId,setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:10,leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'}},managerSlots,seasons:rawSeasons.map(([playerOne,playerTwo],i)=>{
  const scored=scoring.scoreAuthoritativeResults({playerOne,playerTwo}),resultsContentHash='sha256:'+String(i+1).padStart(64,'0');
  const breakdown=r=>Object.fromEntries(['championsLeague','leagueTitle','domesticCup','performanceBonus','individualAwardsBonus','total'].map(k=>[k,r[k]]));
  return {commit:{ok:true,committed:true,phase:'ACKNOWLEDGED',revision:3,resultsRevision:2,resultsContentHash,seasonNumber:i+1,results:{playerOne,playerTwo}},scoring:{ok:true,authoritative:true,phase:'SCORING_RECONCILED',revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash,seasonNumber:i+1,scoring:{playerOne:breakdown(scored.scoring.playerOne),playerTwo:breakdown(scored.scoring.playerTwo)},winner:scored.winner}};
 })});
 const local={phase:'REMOTE_OBSERVED',canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{managerRole:'playerOne',profileId:p.managerSlots[0].profileId,saveId:p.managerSlots[0].saveId}};
 const final=Final.reconcile({sharedActive:true,multiSeason:F.multiFor(p),history:F.history(p),localReconciliation:local});
 assert.deepEqual(final.managerTotals,{playerOne:5,playerTwo:5});assert.equal(final.winner,'draw');
 const seasonWins={Daniel:p.managerRecords.playerOne.seasonWins,Nik:p.managerRecords.playerTwo.seasonWins};
 assert.ok(seasonWins.Daniel>seasonWins.Nik,'Use a tied total with unequal season wins so the final rule is unambiguous.');
 const runtime=await resolveChromiumRuntime();browser=await chromium.launch({...runtime,args:runtime.args.filter(arg=>arg!=='--single-process'),headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await page.goto(url);await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:15000});
 await page.locator('#ruleBookButton').click();await page.locator('#ruleBook').waitFor({state:'visible'});
 const ruleSections=await page.locator('#ruleBook .ruleSection').allTextContents();
 const book=ruleSections.filter(s=>!s.includes('CONNECTION & RECOVERY')).join('\n');
 await page.evaluate(async({p,final,terminal})=>{
  await ensureGameplayModules();
  CareerModeProductionSharedFinalReconciliation={getState:()=>final};
  CareerModeProductionSharedTerminalClose={getState:()=>terminal};
  CareerModeProductionSharedHistoryConvergence={getState:()=>({authoritative:true,phase:'HISTORY_CONVERGED',rivalryId:p.rivalryId,projection:p})};
  await loadRuntimeScript('rulebook-final-view','js/seasonFinalV10.js',()=>window.CareerModeSeasonFinalV10);
  await CareerModeSeasonFinalV10.install();
  // Mount the actual final screen with its verified ten-season history, without any game writes.
  document.querySelectorAll('.screen').forEach(n=>n.classList.add('hidden'));
  document.getElementById('seasonEntry').classList.remove('hidden');
  await CareerModeV10Screens.show('seasonEntry');
 },{p,final,terminal:F.closed(p)});
 await page.locator('.v10FinalStage').waitFor({state:'visible',timeout:15000});
 assert.match(await page.locator('.v10FinalStage').innerText(),/DRAW/);
 console.log('Season 10 of 10: final points Daniel 5, Nik 5; season wins '+JSON.stringify(seasonWins)+'.');
 console.log('Existing final rule: points are added across seasons; equal totals produce DRAW even with unequal season wins.');
 console.log('Actual final screen: DRAW. Rule Book: only season tiebreak rules; no final points rule or tied-total DRAW.');
 const finalRulePresent=/\b(?:final|overall|entire|whole|accumulated|across (?:all )?seasons)\b/i.test(book)&&/\b(?:draw|finishes level|tied total|equal total)\b/i.test(book);
 assert.equal(finalRulePresent,true,'Rule Book must state that the highest accumulated points win the Showdown and a tied total is DRAW.');
})().catch(error=>{console.error('PROOF RESULT:',error.message.split('\n')[0]);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
