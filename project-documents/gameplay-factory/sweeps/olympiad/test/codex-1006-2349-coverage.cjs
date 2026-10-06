'use strict';
// Area 01 coverage only. Later-season results are legal fixtures, not a claim
// that a full Showdown was played here. Real draw, history and season rules run.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {root,game,launch,attach,boot,snapshot,Catalog,Fixture}=require('./codex-1006-2349-harness.cjs');
const History=require(path.join(root,'js/sharedHistoryConvergence.js'));
const Progression=require(path.join(root,'js/sharedMultiSeasonProgression.js')).createProtocol();
const {score,winner,result}=require(path.join(root,'tests/support/career-fixture-helpers.cjs'));
async function confirm(g){for(const [role,type,extra] of [['playerOne','open'],['playerOne','commit-league'],['playerOne','commit-clubs'],['playerOne','commit-length',{totalSeasons:g.total}],['playerTwo','confirm'],['playerOne','confirm']])assert.equal((await g.mutate(role,type,extra)).ok,true);}
function history(g,count,{nonzeroTie=false}={}){
  return History.buildProjection({rivalryId:g.rivalryId,setup:g.read(),managerSlots:g.authority('playerOne').managerSlots,seasons:Array.from({length:count},(_,i)=>{
    const n=i+1,h='sha256:'+String(n).padStart(64,'0'),a=result({domesticCup:nonzeroTie&&n%2===1}),b=result({domesticCup:nonzeroTie&&n%2===1});
    return {commit:{ok:true,committed:true,phase:'ACKNOWLEDGED',revision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,results:{playerOne:a,playerTwo:b}},scoring:{ok:true,authoritative:true,phase:'SCORING_RECONCILED',revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,scoring:{playerOne:score(a),playerTwo:score(b)},winner:winner(a,b)}};
  })});
}
function view(g,h=null){const state=Progression.derive({rivalryId:g.rivalryId,setup:g.read(),history:h}),last=h?.seasonHistory.at(-1);return {ok:true,authoritative:true,runtimeRevision:'1.9.1-r13',phase:state.phase,revision:state.revision,rivalryId:g.rivalryId,managerRole:'playerOne',state,dashboard:{acceptedSeasons:state.acceptedSeasons,managerTotals:{playerOne:h?.managerRecords.playerOne.totalPoints||0,playerTwo:h?.managerRecords.playerTwo.totalPoints||0},lastSeason:last?{seasonNumber:last.roundNumber,winner:last.winner,playerOne:{leaguePosition:last.playerOne.leaguePosition,score:last.playerOne.scoring.total},playerTwo:{leaguePosition:last.playerTwo.leaguePosition,score:last.playerTwo.scoring.total}}:null}};}
async function installProgression(page,g,h){
  await page.evaluate(async({projection,result})=>{
    CareerModeProductionSharedShowdownPresentation.deactivate();
    window.CareerModeProductionSharedJourneyEntry={isPending:()=>false};
    sessionStorage.removeItem('careerModeShowdown.sharedJourneyPending.v1');
    const setupApi=CareerModeProductionSharedShowdownSetup,setup=setupApi.getState().setup;
    currentShowdown.selectedLeague=getLeagueById(setup.leagueId);currentShowdown.clubs={...setup.clubs};currentShowdown.status='Ready';currentShowdown.sharedJourney.setupPending=false;
    const historyView=projection?{authoritative:true,phase:'HISTORY_CONVERGED',throughSeason:projection.acceptedSeasons,projection}:null;
    window.CareerModeProductionSharedHistoryConvergence={getState:()=>historyView,refresh:async()=>historyView};
    window.CareerModeSparkSharedMultiSeasonProgression={read:async()=>result};
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:setupApi.getState().accountId}},firestore:{},firestoreSdk:{}})};
    await loadRuntimeScript('qa01-progression','js/productionSharedMultiSeasonProgression.js',()=>window.CareerModeProductionSharedMultiSeasonProgression);
    CareerModeProductionSharedMultiSeasonProgression.install();
    const resumed=await CareerModeProductionSharedMultiSeasonProgression.resumeFromAuthority();if(!resumed)throw Error('Legal season fixture could not be resumed');
    for(const el of document.querySelectorAll('main > .screen'))el.classList.toggle('hidden',el.id!=='dashboard');
    CareerModeProductionSharedMultiSeasonProgression.decorateDashboard();
  },{projection:h,result:view(g,h)});
}
async function dashboard(page){return page.evaluate(()=>{const t=id=>document.getElementById(id)?.textContent;return {round:t('dashboardRound'),league:t('dashboardLeague'),clubs:[t('dashboardClubOne'),t('dashboardClubTwo')],managers:[t('dashboardManagerOne'),t('dashboardManagerTwo')],scores:[t('dashboardScoreOne'),t('dashboardScoreTwo')],lastSeason:t('dashboardLastSeasonResult'),level:t('dashboardSeriesStatus')};});}
(async()=>{
  // Both league catalogs agree, with FIFA 17's 18-club Bundesliga.
  const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'data/clubs.js'),'utf8')+';globalThis.catalog=clubsByLeague;',c);
  assert.deepEqual(JSON.parse(JSON.stringify(c.catalog)),Catalog);
  assert.deepEqual(Object.values(Catalog).map(x=>x.length),[20,20,18,20,20]);
  const seen=new Map(Object.keys(Catalog).map(id=>[id,new Set()]));
  for(let i=1;i<=600;i++){
    const g=await game([1,3,5,10][i%4],i.toString(16));
    assert.equal((await g.mutate('playerOne','open')).ok,true);
    const d1=await g.protocol.prepareDraw({state:g.read(),type:'commit-league',operationId:Fixture.command('commit-league',1,1001).operationId});
    const d2=await g.protocol.prepareDraw({state:JSON.parse(JSON.stringify(g.read())),type:'commit-league',operationId:Fixture.command('commit-league',1,1002).operationId});
    assert.equal(d1.leagueId,d2.leagueId);
    assert.equal((await g.mutate('playerOne','commit-league')).ok,true);
    const p1=await g.protocol.prepareDraw({state:g.read(),type:'commit-clubs',operationId:Fixture.command('commit-clubs',2,1003).operationId});
    const p2=await g.protocol.prepareDraw({state:JSON.parse(JSON.stringify(g.read())),type:'commit-clubs',operationId:Fixture.command('commit-clubs',2,1004).operationId});
    assert.deepEqual(p1.clubs,p2.clubs);
    assert.equal((await g.mutate('playerOne','commit-clubs')).ok,true);
    const s=g.read();assert.notEqual(s.clubs.playerOne,s.clubs.playerTwo);
    for(const club of Object.values(s.clubs)){assert.ok(Catalog[s.leagueId].includes(club));seen.get(s.leagueId).add(club);}
  }
  console.log('PASS 600 legal draws; two distinct eligible clubs; repeated reads keep each pick. Seen clubs '+JSON.stringify(Object.fromEntries([...seen].map(([id,s])=>[id,s.size]))));
  for(const [id,s] of seen)assert.equal(s.size,Catalog[id].length,'Every catalog club should be reached by this fixed draw sample.');
  for(const total of [1,3,5,10]){
    const g=await game(total,'2');await confirm(g);let previous=Progression.derive({rivalryId:g.rivalryId,setup:g.read()});
    for(let n=1;n<=total;n++){
      const h=history(g,n,{nonzeroTie:true});History.verifyProjection(h);
      const restored=History.verifyProjection(JSON.parse(JSON.stringify(h)));
      assert.equal(restored.managerRecords.playerOne.club,g.read().clubs.playerOne);assert.equal(restored.managerRecords.playerTwo.club,g.read().clubs.playerTwo);
      const state=Progression.observe({previous,rivalryId:g.rivalryId,setup:g.read(),history:restored});
      assert.deepEqual(state.fixedClubs,g.read().clubs);assert.equal(state.leagueId,g.read().leagueId);assert.equal(state.activeSeason,n===total?null:n+1);previous=state;
      assert.equal(h.managerRecords.playerOne.totalPoints,h.managerRecords.playerTwo.totalPoints);
    }
  }
  console.log('PASS 1, 3, 5 and 10 season histories preserve league and clubs through every season, including tied totals and JSON reload.');
  const browser=await launch();try{
    const g=await game(3,'1');const pages=[];
    for(const [role,viewport] of [['playerOne',{width:1366,height:900}],['playerTwo',{width:390,height:844}]]){const page=await browser.newPage({viewport,isMobile:role==='playerTwo'});await attach(page,g,role);await boot(page,g,role);pages.push(page);}
    const [daniel,nik]=pages;
    // One ordinary click followed by a repeat tap during the in-flight action.
    await daniel.locator('#spinLeague').click({noWaitAfter:true});
    await daniel.locator('#spinLeague').click({force:true,noWaitAfter:true});
    await daniel.waitForFunction(()=>CareerModeProductionSharedShowdownPresentation.getState().phase==='LEAGUE_WHEEL_COMMITTED');
    await nik.evaluate(()=>CareerModeProductionSharedShowdownPresentation.refresh());
    for(const page of pages)await page.locator('#clubWheelScreen').waitFor({state:'visible'});
    const league=g.read().leagueId;for(const page of pages){const s=await snapshot(page);assert.deepEqual(s.clubs,['?','?']);assert.equal(s.presentation.leagueWitnessed,league);}
    await daniel.locator('#openClubPack').click();
    await daniel.waitForFunction(()=>document.getElementById('clubWheelScreen').dataset.clubRevealStage==='manager-one');
    const original=g.read().clubs;
    await boot(daniel,g,'playerOne');
    for(const page of pages){await page.locator('#clubWheelScreen').waitFor({state:'visible'});await page.waitForFunction(()=>CareerModeProductionSharedShowdownPresentation.getState().clubRevealComplete);const s=await snapshot(page);assert.deepEqual(s.clubs,Object.values(original));assert.equal(s.confirmDisabled,false);}
    await nik.locator('#continueClubAssignment').click();await daniel.evaluate(()=>CareerModeProductionSharedShowdownPresentation.refresh());await daniel.locator('#continueClubAssignment').click();await nik.evaluate(()=>CareerModeProductionSharedShowdownPresentation.refresh());
    for(const page of pages){await page.waitForFunction(()=>window.__careerOpened===1);assert.deepEqual((await snapshot(page)).clubs,Object.values(original));}
    assert.equal(g.actions.filter(a=>a.type==='commit-league').length,1);assert.equal(g.actions.filter(a=>a.type==='commit-clubs').length,1);
    console.log('PASS desktop Daniel + phone Nik: spin, sealed packs, open, reload after pack 1, same clubs, both confirmations; one league draw and one club draw.');
    await installProgression(daniel,g,null);const first=await dashboard(daniel);assert.equal(first.round,'Season 1 of 3');assert.deepEqual(first.clubs,Object.values(original));console.log('PASS season 1 of 3 '+JSON.stringify(first));
    // Season score 0-0, with no trophies or bonuses; the same picks survive history.
    const zero=history(g,1);assert.equal(zero.seasonHistory[0].playerOne.scoring.total,0);assert.equal(zero.seasonHistory[0].playerTwo.scoring.total,0);
    const zeroPage=await browser.newPage({viewport:{width:1366,height:900}});await attach(zeroPage,g,'playerOne');await boot(zeroPage,g,'playerOne',{reduced:true});await installProgression(zeroPage,g,zero);const zeroScreen=await dashboard(zeroPage);assert.deepEqual(zeroScreen.clubs,Object.values(original));assert.match(zeroScreen.lastSeason,/Daniel 0 - Nik 0 · DRAW/);console.log('PASS 0-0 season '+JSON.stringify(zeroScreen));
    const ten=await game(10,'3');await confirm(ten);const h9=history(ten,9,{nonzeroTie:true}),h10=history(ten,10,{nonzeroTie:true});
    for(const [label,h] of [['season 10 of 10',h9],['tied final total',h10]]){const p=await browser.newPage({viewport:{width:1366,height:900}});await attach(p,ten,'playerOne');await boot(p,ten,'playerOne',{reduced:true});await installProgression(p,ten,h);const shown=await dashboard(p);assert.equal(shown.round,h===h9?'Season 10 of 10':'All 10 seasons complete');assert.deepEqual(shown.clubs,Object.values(ten.read().clubs));assert.deepEqual(shown.scores,['5','5']);assert.equal(shown.level,'LEVEL');await p.screenshot({path:'/tmp/codex-1006-2349-'+label.replaceAll(' ','-')+'.png'});console.log('PASS '+label+' '+JSON.stringify(shown));}
  }finally{await browser.close();}
  console.log('PASS area 01 coverage. The separate sealed-club script records the retained problem.');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
