// Expected to fail until the Rule Book explains the existing early-end rule.
// Run with node; Chromium opens the unchanged game on a temporary local server.
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {webcrypto}=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../..');
const {resolveChromiumRuntime}=require(path.join(root,'tests/support/chromium-runtime.cjs'));
const Transfer=require(path.join(root,'js/sharedTransferChallenge.js'));
const setup={phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:3,clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},confirmedRoles:['playerOne','playerTwo']};
const career={phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']};
const rivalryId='pair_'+'a'.repeat(64),sessionId='session_'+'b'.repeat(64);
let server,browser,state=null;
(async()=>{
 const port=4186,url=process.env.CMS_BASE_URL||`http://127.0.0.1:${port}/`;
 if(!process.env.CMS_BASE_URL){
  server=spawn(process.execPath,['tests/support/static-server.cjs'],{cwd:root,env:{...process.env,CMS_TEST_PORT:String(port)},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`Local server stopped: ${code}`)));});
 }
 const protocol=await Transfer.createProtocol({leagueIds:['england-premier-league'],nationalityIds:['brazil'],cryptoImpl:webcrypto});
 const started=Date.now();
 let serial=0;
 const read=role=>{
  const p=state?protocol.projectForRole(state,role):null;
  return {ok:true,revision:state?.revision||0,seasonNumber:1,managerRole:role,rivalryId,state:state?{phase:state.phase,revision:state.revision,startedAtEpochMs:state.startedAtEpochMs,endedAtEpochMs:state.endedAtEpochMs,endRequestedRoles:state.endRequestedRoles,guessLockedRoles:state.guessLockedRoles,signingLockedRoles:state.signingLockedRoles}:null,ownInputs:p?.inputs[role]||null,opponentInputs:state?.phase==='COMPLETED'?p.inputs[role==='playerOne'?'playerTwo':'playerOne']:null,verdicts:p?.verdicts||null};
 };
 async function apply(role,type,options={}){
  const command={type,operationId:options.operationId||'transfer_op_'+(++serial).toString(16).padStart(32,'0'),baseRevision:options.baseRevision??(state?.revision||0)};
  state=(await protocol.apply({state,setup,careerStart:career,seasonNumber:1,actorRole:role,nowEpochMs:Date.now(),command})).state;
  return read(role);
 }
 const runtime=await resolveChromiumRuntime();
 browser=await chromium.launch({...runtime,args:runtime.args.filter(arg=>arg!=='--single-process'),headless:true});
 const pages=[];
 let book='';
 for(const role of ['playerOne','playerTwo']){
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});pages.push(page);
  await page.exposeFunction('__readWindow',()=>read(role));
  await page.exposeFunction('__changeWindow',({type,options})=>apply(role,type,options));
  await page.goto(url);await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:15000});
  await page.locator('#ruleBookButton').click();await page.locator('#ruleBook').waitFor({state:'visible'});
  book=await page.locator('#ruleBook').innerText();
  await page.evaluate(async({role,setup,career,rivalryId,sessionId,started})=>{
   await ensureGameplayModules();
   const publicSetup={ready:true,revision:6,rivalryId,sessionId,deviceId:'device_'+(role==='playerOne'?'1':'2').repeat(32),managerRole:role,setup};
   currentShowdown={id:'rulebook-window',currentRound:1,totalRounds:3,status:'Ready',sharedJourney:{mode:'shared',rivalryId},managers:{playerOne:'Daniel',playerTwo:'Nik'},selectedLeague:leagues.find(x=>x.id==='premier_league'),clubs:setup.clubs,transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}};
   CareerModeProductionSharedShowdownSetup={getState:()=>publicSetup,refresh:async()=>publicSetup};
   CareerModeProductionSharedCareerStart={getState:()=>({state:career}),refresh:async()=>({state:career})};
   CareerModeSharedTransferChallenge={runtimeRevision:'1.9.1-r8'};
   const mutate=type=>options=>window.__changeWindow({type,options:{operationId:options.operationId,baseRevision:options.baseRevision}});
   CareerModeSparkSharedTransferChallenge={read:()=>window.__readWindow(),startWindow:mutate('start-window'),requestEndWindow:mutate('request-end-window'),advanceExpiredWindow:mutate('advance-expired-window'),lockGuesses:mutate('lock-guesses'),lockSignings:mutate('lock-signings')};
   CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:role,getIdTokenResult:async()=>({issuedAtTime:new Date(started).toISOString()})}},firestore:{},firestoreSdk:{}})};
   await loadRuntimeScript('rulebook-window-adapter','js/productionSharedTransferChallenge.js',()=>window.CareerModeProductionSharedTransferChallenge);
   CareerModeProductionSharedTransferChallenge.install();await CareerModeProductionSharedTransferChallenge.open();
  },{role,setup,career,rivalryId,sessionId,started});
 }
 await pages[0].locator('#startTransferTimer').click();
 await pages[0].waitForFunction(()=>CareerModeProductionSharedTransferChallenge.getState()?.state?.phase==='WINDOW_OPEN');
 await pages[1].evaluate(()=>CareerModeProductionSharedTransferChallenge.refresh());
 await pages[0].locator('#endTransferTimer').click();
 await pages[0].waitForFunction(()=>CareerModeProductionSharedTransferChallenge.getState()?.state?.endRequestedRoles?.length===1);
 assert.equal(state.phase,'WINDOW_OPEN','One manager alone must not end the shared window.');
 await pages[1].evaluate(()=>CareerModeProductionSharedTransferChallenge.refresh());
 await pages[1].locator('#endTransferTimer').click();
 await pages[1].waitForFunction(()=>CareerModeProductionSharedTransferChallenge.getState()?.state?.phase==='GUESS_ENTRY');
 await pages[0].evaluate(()=>CareerModeProductionSharedTransferChallenge.refresh());
 assert.equal(state.phase,'GUESS_ENTRY');assert.ok(state.endedAtEpochMs-state.startedAtEpochMs<900000);
 assert.match(await pages[1].locator('#transferPhaseIntro').innerText(),/Private Guess Entry/);
 console.log('Rule Book: "'+book.split('\n').find(s=>s.includes('challenge lasts'))+'"');
 console.log('Game screens: Daniel requests early end; window stays open. Nik requests early end; both reach Guess Entry before 15 minutes.');
 console.log('Existing shared rule correctly requires both managers. The Rule Book does not mention that exception.');
 assert.match(book,/both managers.*(?:end|finish).*early|(?:end|finish).*early.*both managers/i,'Rule Book must explain the existing rule that both managers may agree to end the window early.');
})().catch(error=>{console.error('PROOF RESULT:',error.message.split('\n')[0]);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
