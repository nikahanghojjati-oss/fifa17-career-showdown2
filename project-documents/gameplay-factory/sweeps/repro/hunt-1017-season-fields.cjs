// Run: node --test project-documents/gameplay-factory/sweeps/repro/hunt-1017-season-fields.cjs
// Minimal DOM fake; only the real production adapter writes form values.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../../../..');
function node(){
  const classes=new Set();
  return {value:'',checked:false,disabled:false,textContent:'',dataset:{},
    classList:{toggle:(key,on)=>on?classes.add(key):classes.delete(key),contains:key=>classes.has(key)},
    setAttribute(){},append(){},replaceChildren(){},closest(){return null;},focus(){}};
}
test('H1017-4: new shared season clears the previous season facts',async()=>{
  const nodes=new Map(),field=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
  let season=1;
  const pair='pair_'+'a'.repeat(64),fact={leaguePosition:1,leaguePoints:100,leagueGoals:100,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
  const setup={ready:true,rivalryId:pair,sessionId:'session_'+'b'.repeat(64),deviceId:'device_'+'c'.repeat(32),managerRole:'playerOne',setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,totalSeasons:3,leagueId:'premier_league'}};
  const ctx=vm.createContext({console,TextEncoder,
    currentShowdown:{id:'local',currentRound:1,sharedJourney:{mode:'shared',rivalryId:pair}},
    document:{getElementById:field,querySelector:()=>null,createElement:node,createDocumentFragment:node},
    CareerModeProductionSharedMultiSeasonProgression:{resolveSeason:()=>season},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>setup,getState:()=>setup},
    CareerModeProductionSharedTransferChallenge:{refresh:async()=>null,getState:()=>({seasonNumber:season,state:{phase:'COMPLETED'}})},
    CareerModeSharedShowdownCatalog:{catalog:{premier_league:Array(20).fill('club')}},
    CareerModeSharedShowdownSetup:{},CareerModeSharedSeasonResults:{},
    CareerModeSparkSharedSeasonResults:{publishResult:async()=>null,read:async()=>({ok:true,managerRole:'playerOne',seasonNumber:season,revision:season===1?1:0,state:season===1?{phase:'COLLECTING'}:null,ownResult:season===1?fact:null,opponentResult:null})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({auth:{currentUser:{uid:'daniel'}},firestore:{},firestoreSdk:{}})}
  });
  vm.runInContext(fs.readFileSync(path.join(root,'js/productionSharedSeasonResults.js'),'utf8'),ctx);
  const api=ctx.CareerModeProductionSharedSeasonResults;
  await api.refresh();assert.equal(field('p1LeaguePosition').value,'1');
  season=2;await api.refresh();
  assert.equal(api.getState().seasonNumber,2);assert.equal(api.getState().ownResult,null);
  console.log('H1017-4: new season='+api.getState().seasonNumber+'; position='+field('p1LeaguePosition').value+'; ChampionsLeague='+field('p1ChampionsLeague').checked+'; editable='+!field('p1LeaguePosition').disabled);
  assert.equal(field('p1LeaguePosition').value,'','no result published for season 2: start with an empty form');
  assert.equal(field('p1ChampionsLeague').checked,false);
});
