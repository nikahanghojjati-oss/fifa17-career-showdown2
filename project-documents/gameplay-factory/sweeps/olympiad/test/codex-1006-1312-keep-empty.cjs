/* Starts a temporary local server and Chromium.
   Run: node project-documents/gameplay-factory/sweeps/olympiad/test/codex-1006-1312-keep-empty.cjs
   Career fixtures use Daniel/Nik and the game's own score and save helpers.
   The backup download, review choices and Apply clicks use the real screens.
   No game source is changed; the browser has its own temporary game saves. */
"use strict";
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {chromium}=require('playwright');
async function boot(browser){const p=await browser.newPage({viewport:{width:1440,height:1000}});await p.goto(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');await p.locator('#loadingScreen').waitFor({state:'hidden'});await p.locator('#settingsButton').click();await p.locator('#settingsClose').click();return p;}
async function ready(p){await p.evaluate(async()=>{await window.ensureSaveLibraryRuntimeAuthority();await window.ensureGameplayModules();});}
async function seed(p,id,total=3,count=0,{cup=false,completeTransfer=true,completed=false}={}){return p.evaluate(async({id,total,count,cup,completeTransfer,completed})=>{const now='2026-10-06T12:00:00.000Z',result={leaguePosition:5,leaguePoints:65,leagueGoals:70,championsLeague:false,domesticCup:cup,topScorer:false,topAssist:false};const rounds=Array.from({length:count},(_,i)=>buildSeasonRecord(i+1,{...result},{...result},now));const n=Math.min(count+1,total),transfers=Array.from({length:completeTransfer?n:count},(_,i)=>({seasonNumber:i+1,status:'completed',phase:'completed',durationSeconds:900,startedAt:now,deadlineAt:now,endedAt:now,completedAt:now,endedEarly:false,signings:{playerOne:[],playerTwo:[]},guesses:{againstPlayerOne:[],againstPlayerTwo:[]}}));let candidate={schemaVersion:2,id,name:'Daniel vs Nik',managers:{playerOne:'Daniel',playerTwo:'Nik'},totalRounds:total,currentRound:n,status:completed?'Completed':'Ready',selectedLeague:{id:leagues[0].id,name:leagues[0].name},clubs:{playerOne:getClubsForLeague(leagues[0].id)[0],playerTwo:getClubsForLeague(leagues[0].id)[1]},score:{playerOne:cup?count:0,playerTwo:cup?count:0},transferChallenges:transfers,rounds,integrityWarnings:[],createdAt:now,updatedAt:now,completedAt:completed?now:null,archivedAt:null};currentShowdown=await window.CareerModeSaveLibraryRuntime.createShowdown(candidate);const saved=saveCurrentShowdown();if(!saved)throw Error('Fixture did not save');return structuredClone(currentShowdown);},{id,total,count,cup,completeTransfer,completed});}
async function tools(p){await p.evaluate(()=>showScreen('mainMenu',false));await p.locator('#settingsButton').click();await p.locator('.settingsDataButton').click();await p.locator('#careerModeRestorePanel').waitFor({state:'visible'});}
async function snap(p){return p.evaluate(()=>({saveLibrary:localStorage.getItem('careerModeShowdown.saveLibrary'),activeShowdown:localStorage.getItem('careerModeShowdown.activeShowdown'),legacyShowdowns:localStorage.getItem('careerModeShowdown.legacyShowdowns'),preferences:localStorage.getItem('careerModeShowdown.preferences')}));}
async function backup(p){const before=await snap(p);const dlPromise=p.waitForEvent('download');await p.getByRole('button',{name:'EXPORT BACKUP',exact:true}).click();const dl=await dlPromise;const value=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));assert.deepEqual(await snap(p),before,'export changes no career or settings');assert.equal(await p.evaluate(e=>verifyCareerModeBackupEnvelopeChecksum(e),value),true);return value;}
async function review(p,envelope,choices){await p.locator('#careerModeRestorePanel input[type=file]').setInputFiles({name:'career-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(envelope))});await p.getByRole('button',{name:'REVIEW RESTORE',exact:true}).click();await p.locator('select[name=restore-active]').waitFor();for(const [k,v]of Object.entries(choices))await p.locator(`select[name=restore-${k}]`).selectOption(v);return p.locator('.careerRestorePlanHost').innerText();}
async function apply(p){p.once('dialog',d=>d.accept());await p.locator('.careerRestoreApply').click();await p.waitForFunction(()=>document.querySelector('.careerRestoreApply')?.getAttribute('aria-busy')!=='true');return snap(p);}
const keep={active:'keep-current',legacy:'keep-current',preferences:'keep-current',saveLibrary:'keep-current'};

const repo=path.resolve(__dirname,'../../../../..');
const {resolveChromiumRuntime}=require(path.join(repo,'tests/support/chromium-runtime.cjs'));
let localServer=null;
async function startLocalServer(){
 if(process.env.CMS_BASE_URL)return;
 const net=require('node:net');const reservation=net.createServer();
 await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));
 const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
 localServer=require('node:child_process').spawn(process.execPath,['tests/support/static-server.cjs'],{cwd:repo,env:{...process.env,CMS_TEST_PORT:String(port)},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{localServer.stdout.on('data',chunk=>{if(String(chunk).includes('listening'))resolve()});localServer.once('error',reject);localServer.once('exit',code=>reject(Error('Local server stopped: '+code)));});
 process.env.CMS_BASE_URL='http://127.0.0.1:'+port+'/';
}
async function launch(){
 await startLocalServer();
 const runtime=process.env.CMS_CHROMIUM_PATH?{executablePath:process.env.CMS_CHROMIUM_PATH,args:['--no-sandbox']}:fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:await resolveChromiumRuntime();
 return chromium.launch({executablePath:runtime.executablePath,args:runtime.args,headless:true});
}
(async()=>{const browser=await launch();try{
 const source=await boot(browser);await ready(source);await seed(source,1780000000201,3,1);await tools(source);const old=await backup(source);
 const p=await boot(browser);await tools(p);const before=await snap(p);
 assert.equal(before.saveLibrary,null,'Destination starts with no games');
 const preview=await review(p,old,keep);console.log('Selected: Keep current in Active Showdown, Legacy History, Preferences and Save Library.');
 console.log('Preview: '+preview.replace(/\n/g,' | '));
 await apply(p);const after=await snap(p);const library=after.saveLibrary&&JSON.parse(after.saveLibrary);
 console.log('Expected: the empty game stays empty.');
 console.log('Actual: '+JSON.stringify({gamesRestored:library?.saves.length||0,activeSaveId:library?.activeSaveId||null}));
 assert.equal(after.saveLibrary===before.saveLibrary,true,'Explicit keep-current choices must not bring games back after reset');
}finally{await browser.close();localServer?.kill()}})().catch(e=>{console.error(e.stack);localServer?.kill();process.exitCode=1});
