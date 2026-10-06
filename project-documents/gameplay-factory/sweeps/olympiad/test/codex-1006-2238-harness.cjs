'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=process.cwd();
const {chromium}=require(path.join(root,'node_modules/playwright'));
const Transfer=require(path.join(root,'js/sharedTransferChallenge.js'));
const fixture=require(path.join(root,'tests/support/career-fixture-helpers.cjs'));
const catalogContext=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'data/transferOptions.js'),'utf8'),catalogContext);
const leagues=JSON.parse(vm.runInContext('JSON.stringify(FIFA17_TRANSFER_LEAGUES)',catalogContext));
const nationalities=JSON.parse(vm.runInContext('JSON.stringify(FIFA17_TRANSFER_NATIONALITIES)',catalogContext));
const copy=x=>JSON.parse(JSON.stringify(x));
async function createGame(totalSeasons=3,seasonNumber=1){
 const protocol=await Transfer.createProtocol({leagueIds:leagues.map(x=>x.id),nationalityIds:nationalities.map(x=>x.id)});
 const setup={phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons,confirmedRoles:['playerOne','playerTwo'],clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'}};
 const careerStart={phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']};
 let state=null,seq=0;
 const view=role=>{
  if(!state)return {ok:true,revision:0,state:null,managerRole:role,seasonNumber,ownInputs:null,opponentInputs:null,verdicts:null};
  const p=protocol.projectForRole(state,role),other=role==='playerOne'?'playerTwo':'playerOne';
  return copy({ok:true,revision:state.revision,state:p,managerRole:role,seasonNumber,ownInputs:p.inputs[role],opponentInputs:state.phase==='COMPLETED'?p.inputs[other]:null,verdicts:p.verdicts});
 };
 const apply=async(role,method,options={})=>{
  const types={startWindow:'start-window',requestEndWindow:'request-end-window',advanceExpiredWindow:'advance-expired-window',lockGuesses:'lock-guesses',lockSignings:'lock-signings'};
  const type=types[method],command={type,operationId:options.operationId||'transfer_op_'+(++seq).toString(16).padStart(32,'0'),baseRevision:options.baseRevision??state?.revision??0};
  if(type==='lock-guesses')command.guesses=copy(options.guesses);
  if(type==='lock-signings')command.signings=copy(options.signings);
  try{const r=await protocol.apply({state,setup,careerStart,seasonNumber,actorRole:role,command,nowEpochMs:options.nowEpochMs??Date.now()});state=r.state;return view(role)}catch(e){return {ok:false,code:e.code,message:e.message}}
 };
 return {view,apply,protocol,setup,totalSeasons,seasonNumber,get state(){return state}};
}
async function prepare(page,game,role,{reload=false}={}){
 if(!reload){await page.exposeFunction('__qaRead',()=>game.view(role));await page.exposeFunction('__qaApply',(method,opts)=>game.apply(role,method,opts));}
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
 await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:15000});
 await page.waitForFunction(()=>window.CareerModeProductionSharedTerminalClose&&window.CareerModeProductionSharedTransferChallenge&&window.CareerModeTransferScreenV10,null,{timeout:15000});
 await page.evaluate(async({role,total,season,setup})=>{
  await ensureGameplayModules();
  const rid='pair_'+'a'.repeat(64),sid='session_'+'c'.repeat(64);
  currentShowdown={id:123456,name:'Daniel vs Nik',schemaVersion:2,currentRound:season,totalRounds:total,status:'Ready',sharedJourney:{mode:'shared',rivalryId:rid},managers:{playerOne:'Daniel',playerTwo:'Nik'},selectedLeague:'Premier League',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},score:{playerOne:0,playerTwo:0},rounds:[],transferChallenges:[],integrityWarnings:[]};
  window.CareerModeProductionSharedShowdownSetup={getState:()=>({ready:true,rivalryId:rid,sessionId:sid,deviceId:'device_'+'d'.repeat(32),managerRole:role,setup}),refresh:async()=>({ok:true})};
  window.CareerModeProductionSharedCareerStart={getState:()=>({state:{phase:'CAREER_START_READY',revision:2}}),refresh:async()=>({ok:true})};
  window.CareerModeSparkSharedTransferChallenge={read:()=>window.__qaRead(),...Object.fromEntries(['startWindow','requestEndWindow','advanceExpiredWindow','lockGuesses','lockSignings'].map(method=>[method,opts=>window.__qaApply(method,{operationId:opts.operationId,baseRevision:opts.baseRevision,nowEpochMs:opts.nowEpochMs,...(opts.guesses?{guesses:opts.guesses}:{}),...(opts.signings?{signings:opts.signings}:{})})]))};
  window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{getIdTokenResult:async()=>({issuedAtTime:new Date().toISOString()})}},firestore:{},firestoreSdk:{}})};
  await loadRuntimeScript('qa-transfer-controller','js/productionSharedTransferChallenge.js',()=>window.CareerModeProductionSharedTransferChallenge);
  CareerModeProductionSharedTransferChallenge.install();
  await CareerModeProductionSharedTransferChallenge.open();
 },{role,total:game.totalSeasons,season:game.seasonNumber,setup:game.setup});
 await page.locator('#transferChallenge').waitFor({state:'visible'});
}
async function drainReplay(page){
 for(let i=0;i<4;i++){
  if(!await page.locator('#transferChallenge').getAttribute('data-shared-transfer-replay'))return;
  await page.locator('#continueFromTransfers').click();
 }
 assert.equal(await page.locator('#transferChallenge').getAttribute('data-shared-transfer-replay'),null);
}
async function refresh(page){await page.evaluate(()=>CareerModeProductionSharedTransferChallenge.refresh());await drainReplay(page)}
async function choose(page,id,valueId,kind){
 const option=(kind==='league'?leagues:nationalities).find(x=>x.id===valueId);assert.ok(option);
 const input=page.locator('#'+id);await input.fill(option.label);

 if(page.viewportSize().width<600){
  for(let i=0;i<14;i++){const active=await input.locator('..').locator('[role=option][aria-selected=true]').getAttribute('data-option-id');if(active===valueId)break;await input.press('ArrowDown')}
  await input.press('Enter');
 }else{await input.locator('..').locator('[data-option-id="'+valueId+'"]').click()}
 assert.equal(await input.getAttribute('data-canonical-id'),valueId);
}
async function guess(page,prefix,slot,kind,id){await page.locator(`#${prefix}Guess${slot}Type`).selectOption(kind);await choose(page,`${prefix}Guess${slot}Value`,id,kind)}
async function signing(page,prefix,row){await page.locator(`#${prefix}Signing${row.slot}Name`).fill(row.name);await choose(page,`${prefix}Signing${row.slot}League`,row.leagueId,'league');await choose(page,`${prefix}Signing${row.slot}Nationality`,row.nationalityId,'nationality')}
async function lock(page,game,role,stage){
 await page.locator('#completeTransferChallenge').click();
 await page.waitForFunction(()=>document.getElementById('completeTransferChallenge')?.getAttribute('aria-disabled')!=='true'||document.getElementById('transferPhaseStatus')?.textContent?.includes('LOCKED')||document.getElementById('transferPhaseStatus')?.textContent?.includes('COMPLETE'));
 const field=stage==='guesses'?'guessLockedRoles':'signingLockedRoles';
 for(let i=0;i<30&&!game.state?.[field]?.includes(role);i++)await page.waitForTimeout(100);
 assert.ok(game.state?.[field]?.includes(role),`${role} ${stage} failed: ${await page.locator('#transferChallengeError').textContent()}`);
}
async function beginPair(browser,total=3,season=1){
 const game=await createGame(total,season);
 const contexts=await Promise.all([browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'})]);
 const pages=await Promise.all(contexts.map(c=>c.newPage()));
 for(const page of pages)page.on('dialog',d=>d.accept());
 await prepare(pages[0],game,'playerOne');await prepare(pages[1],game,'playerTwo');
 await pages[0].locator('#startTransferTimer').click();
 for(let i=0;i<30&&!game.state;i++)await pages[0].waitForTimeout(100);
 assert.equal(game.state.phase,'WINDOW_OPEN');await refresh(pages[1]);
 await pages[0].locator('#endTransferTimer').click();
 for(let i=0;i<30&&!game.state.endRequestedRoles.includes('playerOne');i++)await pages[0].waitForTimeout(100);
 await pages[1].locator('#endTransferTimer').click();
 for(let i=0;i<30&&game.state.phase!=='GUESS_ENTRY';i++)await pages[0].waitForTimeout(100);
 assert.equal(game.state.phase,'GUESS_ENTRY');await refresh(pages[0]);await refresh(pages[1]);
 return {game,pages,contexts};
}
module.exports={root,assert,chromium,createGame,prepare,drainReplay,refresh,choose,guess,signing,lock,beginPair,fixture,leagues,nationalities,copy};
if(require.main===module)(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{const {game,pages,contexts}=await beginPair(b);console.log('READY',game.state.phase,await pages[0].locator('#transferPhaseStatus').textContent());await Promise.all(contexts.map(c=>c.close()))}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
