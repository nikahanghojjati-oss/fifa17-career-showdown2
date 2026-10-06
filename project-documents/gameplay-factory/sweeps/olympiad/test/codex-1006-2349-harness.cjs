'use strict';
// This local fixture starts with Daniel and Nik ready to play. It uses the real
// league/club draw rules and real screens. Sign-in and service setup are excluded.
const path=require('node:path');
const root=path.resolve(__dirname,'../../../../..');
const {chromium}=require(path.join(root,'node_modules/playwright'));
const Protocol=require(path.join(root,'js/sharedShowdownSetup.js'));
const Catalog=require(path.join(root,'js/sharedShowdownCatalog.js')).catalog;
const Fixture=require(path.join(root,'tests/fixtures/shared-showdown-setup.cjs'));
const clone=x=>JSON.parse(JSON.stringify(x));
async function game(total=3,seed='1'){
  const nibble=total===10?'a':String(total);
  const rivalryId='pair_'+nibble+seed.padStart(63,'0').slice(-63);
  const base=Fixture.authority();
  const authority=role=>Fixture.authority(role,{rivalryId,session:{...base.session,rivalryId}});
  const protocol=await Protocol.createProtocol({catalog:Catalog});
  let setup=null,sequence=0;const actions=[];
  async function mutate(role,type,extra={}){
    let command=Fixture.command(type,setup?.revision||0,++sequence,extra);
    if(['commit-league','commit-clubs'].includes(type))command=await protocol.prepareDraw({state:setup,type,operationId:command.operationId});
    if(type==='confirm')command.setupHash=await protocol.confirmationHash(setup);
    const result=await protocol.apply({state:setup,command,authority:authority(role)});
    actions.push({role,type,ok:result.ok});if(result.ok)setup=result.state;
    return {ok:result.ok,code:result.code,setup:clone(setup)};
  }
  return {total,rivalryId,authority,protocol,actions,mutate,read:()=>setup?clone(setup):null};
}
async function launch(){return chromium.launch({executablePath:process.env.CMS_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});}
async function attach(page,game,role){
  await page.exposeFunction('qaRead',game.read);
  await page.exposeFunction('qaMutate',(type,extra)=>game.mutate(role,type,extra));
  page.setDefaultTimeout(15000);
}
async function boot(page,game,role,{reduced=false}={}){
  await page.goto(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden'});
  await page.evaluate(async({role,rivalryId,total,reduced})=>{
    await ensureGameplayModules();document.getElementById('onlinePlayerIdentityOverlay')?.remove();
    sessionStorage.setItem('careerModeShowdown.sharedJourneyPending.v1','1');
    window.CareerModeProductionSharedJourneyEntry={isPending:()=>true};
    window.isReducedClubMotionPreferred=()=>reduced;
    currentShowdown={id:'qa-area01',name:'Daniel vs Nik',managers:{playerOne:'Daniel',playerTwo:'Nik'},totalRounds:total,currentRound:1,status:'Created',selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],sharedJourney:{mode:'shared',rivalryId,setupPending:true}};
    const listeners=new Set();
    let state={ready:true,busy:false,setup:null,phase:null,revision:0,managerRole:role,remoteRole:role==='playerOne'?'host':'peer',rivalryId,sessionId:'session_'+'d'.repeat(64),accountId:'qa_'+role,deviceId:'device_'+(role==='playerOne'?'a':'b').repeat(32)};
    const emit=setup=>{state={...state,setup,phase:setup?.phase||null,revision:setup?.revision||0};for(const l of listeners)l(state);};
    window.CareerModeProductionSharedShowdownSetup={getState:()=>state,subscribe(l){listeners.add(l);l(state);return()=>listeners.delete(l)},async refresh(){emit(await window.qaRead());return {ok:true}},async mutate(type,extra){const r=await window.qaMutate(type,extra);emit(r.setup);return r}};
    window.__careerOpened=0;
    window.CareerModeProductionSharedCareerStart={install(){return true},async openPanel(){window.__careerOpened++;return true}};
    await loadRuntimeScript('qa01-shared-presentation','js/productionSharedShowdownPresentation.js',()=>window.CareerModeProductionSharedShowdownPresentation);
    CareerModeProductionSharedShowdownPresentation.install();await CareerModeProductionSharedShowdownPresentation.activate();
  },{role,rivalryId:game.rivalryId,total:game.total,reduced});
}
async function snapshot(page){return page.evaluate(()=>{
  const text=id=>document.getElementById(id)?.textContent;
  const visible=id=>{const el=document.getElementById(id);return el&&getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().height>0;};
  return {screen:getActiveScreenName(),league:text('selectedLeague'),stage:document.getElementById('clubWheelScreen').dataset.clubRevealStage,clubs:[text('clubNameOne'),text('clubNameTwo')],sealed:[!document.getElementById('clubCardOne').classList.contains('is-revealed'),!document.getElementById('clubCardTwo').classList.contains('is-revealed')],summaryClubs:[text('clubConfirmationClubOne'),text('clubConfirmationClubTwo')],summaryVisible:visible('clubRivalryConfirmation'),confirm:text('continueClubAssignment'),confirmDisabled:document.getElementById('continueClubAssignment').disabled,confirmVisible:visible('continueClubAssignment'),careerOpened:window.__careerOpened,presentation:CareerModeProductionSharedShowdownPresentation.getState()};
});}
module.exports={root,game,launch,attach,boot,snapshot,Catalog,Fixture};
