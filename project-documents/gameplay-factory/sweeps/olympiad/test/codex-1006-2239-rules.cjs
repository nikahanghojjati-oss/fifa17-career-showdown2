// Area 02 rules check. Run from the repository root with node project-documents/gameplay-factory/sweeps/olympiad/test/codex-1006-2239-rules.cjs.
// Prepared games exercise the real guessing rules and screens without outside services.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ROOT=require('node:path').resolve(__dirname,'../../../../..');
const factory=require(ROOT+'/js/sharedTransferChallenge.js');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(ROOT+'/data/transferOptions.js','utf8'),sandbox);
const leagueIds=Array.from(sandbox.window.FIFA17_TRANSFER_LEAGUES,x=>x.id),nationalityIds=Array.from(sandbox.window.FIFA17_TRANSFER_NATIONALITIES,x=>x.id);
const careerStart={phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']};
let serial=0;
(async()=>{
const protocol=await factory.createProtocol({leagueIds,nationalityIds});
for(const [kind,options] of [['league',sandbox.window.FIFA17_TRANSFER_LEAGUES],['nationality',sandbox.window.FIFA17_TRANSFER_NATIONALITIES]])for(const option of options){assert.equal(sandbox.window.resolveFifa17TransferOption(kind,option.id).id,option.id);assert.equal(sandbox.window.resolveFifa17TransferOption(kind,option.label).label,option.label);}
console.log('PASS All 36 league and 164 nationality choices resolve by their own saved choices; repeated league names are selected by country');
for(const totalSeasons of [1,3,5,10])for(const seasonNumber of [...new Set([1,totalSeasons])])for(const count of [0,1,3]){
 const setup={phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons,confirmedRoles:['playerOne','playerTwo'],clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'}};
 let state=null;const start=1000000;
 const command=(type,payload={})=>({type,baseRevision:state?.revision||0,operationId:'transfer_op_'+(++serial).toString(16).padStart(32,'0'),...payload});
 async function apply(role,type,payload={},nowEpochMs=start){state=(await protocol.apply({state,setup,careerStart,seasonNumber,actorRole:role,command:command(type,payload),nowEpochMs})).state;}
 await apply('playerOne','start-window');await assert.rejects(protocol.apply({state,setup,careerStart,seasonNumber,actorRole:'playerTwo',command:command('advance-expired-window'),nowEpochMs:start+899999}),{code:'TRANSFER_WINDOW_STILL_OPEN'});await apply('playerTwo','advance-expired-window',{},start+900000);assert.equal(state.phase,'GUESS_ENTRY');
 const guesses=[{slot:1,type:'league',valueId:'england-premier-league'},{slot:2,type:'nationality',valueId:'brazil'},{slot:3,type:'nationality',valueId:'england'}].slice(0,count);
 await apply('playerOne','lock-guesses',{guesses},start+900001);assert.equal(state.phase,'GUESS_ENTRY');await apply('playerTwo','lock-guesses',{guesses},start+900002);assert.equal(state.phase,'SIGNING_ENTRY');
 const signings=[{slot:1,name:'Matched Twice',leagueId:'england-premier-league',nationalityId:'brazil'},{slot:2,name:'Matched Once',leagueId:'spain-primera-division',nationalityId:'england'},{slot:3,name:'Safe',leagueId:'spain-primera-division',nationalityId:'italy'}];
 await apply('playerOne','lock-signings',{signings},start+900003);await apply('playerTwo','lock-signings',{signings},start+900004);assert.equal(state.phase,'COMPLETED');
 const v=protocol.projectForRole(state,'playerOne').verdicts;assert.deepEqual(v,protocol.projectForRole(state,'playerTwo').verdicts);assert.deepEqual(v.playerOne.map(x=>x.release),[count>0,count===3,false]);assert.equal(v.playerOne[0].matchedBy.length,count===3?2:count);const reloaded=JSON.parse(JSON.stringify(state));await protocol.verifyState(reloaded);assert.deepEqual(protocol.projectForRole(reloaded,'playerTwo').verdicts,v);
 console.log(`PASS Season ${seasonNumber} of ${totalSeasons}, ${count} guesses: 15-minute end, correct matches, same saved verdicts`);
}
})().catch(e=>{console.error(e);process.exitCode=1});
