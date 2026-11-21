const BASEURL=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4391/');const baseUrl=BASEURL;const rivalryA='pair_'+('a'.repeat(64));const rivalryB='pair_'+('b'.repeat(64));const sessionId='session_'+('c'.repeat(64));
async function prepare(page,{managerRole,saveId}){
  await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:30000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==='function'&&typeof window.loadRuntimeScript==='function',null,{timeout:30000});
  await page.evaluate(async({managerRole,saveId,rivalryA,rivalryB,sessionId})=>{
    await ensureGameplayModules();
    const roleOther=managerRole==='playerOne'?'playerTwo':'playerOne';
    const managers={playerOne:'Daniel',playerTwo:'Nik'};
    const clubs={playerOne:'Arsenal',playerTwo:'Liverpool'};
    const serverEpoch=Date.now();
    let tokenEpoch=serverEpoch;
    let tokenReads=0;
    currentShowdown={id:saveId,currentRound:1,status:'Ready',sharedJourney:{mode:'shared',rivalryId:rivalryA},managers};

    let activeRivalry=rivalryA;
    let serverPhase='COMPLETED';
    let reads=0;
    let mutations=0;
    let raceMode=false;
    let raceStage=0;
    let releaseRaceA=null;
    let releaseRaceB=null;
    const setupValue=()=>({
      status:'ready',ready:true,open:false,busy:false,revision:6,phase:'SHOWDOWN_CONFIRMED',
      rivalryId:activeRivalry,sessionId,deviceId:'device_'+(managerRole==='playerOne'?'1':'2').repeat(32),managerRole,
      setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:3,confirmedRoles:['playerOne','playerTwo'],clubs}
    });
    window.CareerModeProductionSharedShowdownSetup={getState:setupValue,refresh:async()=>({ok:true})};
    window.CareerModeProductionSharedCareerStart={getState:()=>({state:{phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']}}),refresh:async()=>({ok:true})};
    window.CareerModeSharedTransferChallenge={runtimeRevision:'1.9.1-r8'};
    const completedInputs=role=>({
      guesses:[{slot:1,type:'league',valueId:'england-premier-league'}],
      signings:[{slot:1,name:role==='playerOne'?'Player A':'Player B',leagueId:'spain-primera-division',nationalityId:'england'}]
    });
    const makeView=()=>{
      if(serverPhase==='WINDOW_OPEN')return {ok:true,revision:1,seasonNumber:1,managerRole,rivalryId:activeRivalry,state:{phase:'WINDOW_OPEN',revision:1,startedAtEpochMs:serverEpoch,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[]},ownInputs:{guesses:null,signings:null},opponentInputs:null,verdicts:null};
      if(serverPhase==='GUESS_ENTRY')return {ok:true,revision:3,seasonNumber:1,managerRole,rivalryId:activeRivalry,state:{phase:'GUESS_ENTRY',revision:3,startedAtEpochMs:serverEpoch-900000,endedAtEpochMs:serverEpoch-1,endRequestedRoles:['playerOne','playerTwo'],guessLockedRoles:[],signingLockedRoles:[]},ownInputs:{guesses:null,signings:null},opponentInputs:null,verdicts:null};
      if(serverPhase==='SIGNING_ENTRY')return {ok:true,revision:5,seasonNumber:1,managerRole,rivalryId:activeRivalry,state:{phase:'SIGNING_ENTRY',revision:5,startedAtEpochMs:serverEpoch-900000,endedAtEpochMs:serverEpoch-1,endRequestedRoles:['playerOne','playerTwo'],guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:[]},ownInputs:{guesses:[{slot:1,type:'league',valueId:'england-premier-league'}],signings:null},opponentInputs:null,verdicts:null};
      return {ok:true,revision:7,seasonNumber:1,managerRole,rivalryId:activeRivalry,state:{phase:'COMPLETED',revision:7,startedAtEpochMs:serverEpoch-900000,endedAtEpochMs:serverEpoch-1,endRequestedRoles:['playerOne','playerTwo'],guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne','playerTwo']},ownInputs:completedInputs(managerRole),opponentInputs:completedInputs(roleOther),verdicts:{playerOne:[],playerTwo:[]}};
    };
    const rejectMutation=async()=>{mutations+=1;return {ok:false,code:'AUDIT_MUTATION_FORBIDDEN'};};
    window.CareerModeSparkSharedTransferChallenge={
      read:async()=>{
        reads+=1;
        const snapshot=makeView();
        if(raceMode){
          raceStage+=1;
          if(raceStage===1)await new Promise(resolve=>{releaseRaceA=resolve;});
          else if(raceStage===2)await new Promise(resolve=>{releaseRaceB=resolve;});
        }
        return snapshot;
      },
      startWindow:rejectMutation,requestEndWindow:rejectMutation,advanceExpiredWindow:rejectMutation,lockGuesses:rejectMutation,lockSignings:rejectMutation
    };
    const currentUser={uid:managerRole==='playerOne'?'account_one':'account_two',getIdTokenResult:async()=>{tokenReads+=1;return {issuedAtTime:new Date(tokenEpoch).toISOString()};}};
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser},firestore:{},firestoreSdk:{}})};

    await loadRuntimeScript('ssjr-transfer-replay-audit','js/productionSharedTransferChallenge.js',()=>window.CareerModeProductionSharedTransferChallenge);
    CareerModeProductionSharedTransferChallenge.install();
    const switchSave=()=>{
      activeRivalry=rivalryB;serverPhase='WINDOW_OPEN';
      currentShowdown={...currentShowdown,id:`${saveId}_switched`,currentRound:1,sharedJourney:{mode:'shared',rivalryId:rivalryB}};
    };
    window.__transferAudit={
      counts:()=>({reads,mutations,tokenReads}),
      setTokenEpoch(value){tokenEpoch=Number(value);},
      serverEpoch,
      switchSave,
      async setPhase(phase){serverPhase=phase;await CareerModeProductionSharedTransferChallenge.refresh();return CareerModeProductionSharedTransferChallenge.getState()?.state?.phase||null;},
      beginRaceA(){raceMode=true;raceStage=0;releaseRaceA=null;releaseRaceB=null;window.__raceA=CareerModeProductionSharedTransferChallenge.refresh();},
      switchAndBeginRaceB(){switchSave();window.__raceB=CareerModeProductionSharedTransferChallenge.refresh();},
      raceStatus:()=>({raceStage,hasReleaseA:typeof releaseRaceA==='function',hasReleaseB:typeof releaseRaceB==='function'}),
      releaseA(){if(releaseRaceA){const release=releaseRaceA;releaseRaceA=null;release();}},
      releaseB(){if(releaseRaceB){const release=releaseRaceB;releaseRaceB=null;release();}},
      async finishRace(){const results=await Promise.all([window.__raceA,window.__raceB]);raceMode=false;return results.map(Boolean);},
      rivalryB
    };
    await CareerModeProductionSharedTransferChallenge.open();
  },{managerRole,saveId,rivalryA,rivalryB,sessionId});
}
module.exports={prepare,rivalryA,rivalryB,sessionId};
