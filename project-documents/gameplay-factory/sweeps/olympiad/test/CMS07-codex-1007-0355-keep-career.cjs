// Run from any directory after npm ci. The test starts its own local game server.
// Saved career examples skip entry setup and exercise the real Settings buttons.
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../../../../..');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require(path.join(root,'tests/support/chromium-runtime.cjs'));
const foundation=require(path.join(root,'js/saveLibraryFoundation.js'));
const evidence=path.join(root,'work','codex-1007-0355');
const testPort=20000+(process.pid%20000);
const baseUrl=process.env.CMS_BASE_URL||`http://127.0.0.1:${testPort}/`;
let server;
const at='2026-10-06T20:00:00.000Z';
function player(i,zero=false){return {leaguePosition:zero?5:1,leaguePoints:zero?70:100,leagueGoals:zero?65:100,domesticCup:!zero,championsLeague:!zero,topScorer:!zero,topAssist:!zero};}
function season(i,zero=false){const one=player(i,zero),two={...one};const total=zero?0:11;for(const p of [one,two])p.scoring={championsLeague:zero?0:5,leagueTitle:zero?0:3,domesticCup:zero?0:1,performanceBonus:zero?0:1,individualAwardsBonus:zero?0:1,awardsBonus:zero?0:1,total,triggers:{hundredLeaguePoints:!zero,hundredLeagueGoals:!zero,topScorer:!zero,topAssist:!zero}};return {roundNumber:i,completedAt:at,transferChallengeSeason:i,playerOne:one,playerTwo:two,winner:'draw'};}
function career(id,{total=3,completed=1,zero=false,draft=false}={}){const done=total===completed;const rounds=Array.from({length:completed},(_,i)=>season(i+1,zero));const score=rounds.reduce((n,r)=>n+r.playerOne.scoring.total,0);return {schemaVersion:2,id,name:'Daniel vs Nik '+id,managers:{playerOne:'Daniel',playerTwo:'Nik'},totalRounds:total,currentRound:done?total:completed+1,status:done?'Completed':'Ready',selectedLeague:{id:'bundesliga',name:'Bundesliga'},clubs:{playerOne:'SC Freiburg',playerTwo:'Hertha BSC'},score:{playerOne:score,playerTwo:score},transferChallenges:Array.from({length:completed},(_,i)=>({seasonNumber:i+1,status:'completed',completedAt:at,signings:{playerOne:[],playerTwo:[]},guesses:{playerOne:[],playerTwo:[]},verdicts:{playerOne:[],playerTwo:[]},releases:{playerOne:[],playerTwo:[]}})),rounds,integrityWarnings:[],createdAt:at,updatedAt:at,completedAt:done?at:null,archivedAt:done?at:null,...(draft?{seasonDraft:{seasonNumber:completed+1,playerOne:{leaguePosition:2,leaguePoints:86,leagueGoals:75},playerTwo:{leaguePosition:3,leaguePoints:80,leagueGoals:70}}}:{})};}


const keys={saveLibrary:'careerModeShowdown.saveLibrary',activeShowdown:'careerModeShowdown.activeShowdown',legacyShowdowns:'careerModeShowdown.legacyShowdowns',preferences:'careerModeShowdown.preferences'};
const prefs={schemaVersion:2,reducedMotion:true,menuFeedback:false};
async function data(active,history=[]){const m=await foundation.buildSingletonMigrationPlan({activeShowdown:active,legacyShowdowns:history});assert.equal(m.ok,true,JSON.stringify(m.errors));return {saveLibrary:JSON.stringify(m.library),activeShowdown:null,legacyShowdowns:JSON.stringify(m.legacyShowdowns),preferences:JSON.stringify(prefs)};}
async function seed(p,raw){await p.goto(baseUrl);await p.locator('#loadingScreen').waitFor({state:'hidden',timeout:20000});await p.evaluate(({keys,raw})=>{for(const [k,key]of Object.entries(keys))raw[k]===null?localStorage.removeItem(key):localStorage.setItem(key,raw[k]);},{keys,raw});await p.reload();await p.locator('#loadingScreen').waitFor({state:'hidden',timeout:20000});}
async function open(p){await p.locator('#settingsButton').click();await p.getByRole('button',{name:'OPEN HISTORY & BACKUP',exact:true}).click();await p.locator('#legacy').waitFor({state:'visible'});await p.locator('#careerModeRestorePanel').waitFor({state:'visible'});}
async function snap(p){return p.evaluate(keys=>Object.fromEntries(Object.entries(keys).map(([n,k])=>[n,localStorage.getItem(k)])),keys);}
async function backup(p){const before=await snap(p);const [d]=await Promise.all([p.waitForEvent('download'),p.getByRole('button',{name:'EXPORT BACKUP',exact:true}).click()]);const e=JSON.parse(await fs.readFile(await d.path(),'utf8'));assert.deepEqual(await snap(p),before);return e;}
async function review(p,e,choices){const before=await snap(p);await p.locator('#careerModeRestorePanel input').setInputFiles({name:'fair-play-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(e))});await p.getByRole('button',{name:'REVIEW RESTORE',exact:true}).click();await p.locator('.careerRestoreChoices').waitFor();for(const [k,v]of Object.entries(choices))await p.locator(`select[name="restore-${k}"]`).selectOption(v);assert.deepEqual(await snap(p),before);console.log('PREVIEW',await p.locator('.careerRestorePlan').innerText());return before;}
async function apply(p){p.once('dialog',d=>d.accept());await p.getByRole('button',{name:'APPLY RESTORE',exact:true}).click();await p.waitForFunction(()=>!document.querySelector('.careerRestoreApply')?.hasAttribute('aria-busy'));await p.waitForTimeout(450);return snap(p);}
(async()=>{
await fs.mkdir(evidence,{recursive:true});
if(!process.env.CMS_BASE_URL){
 server=spawn(process.execPath,[path.join(root,'tests/support/static-server.cjs')],{cwd:root,env:{...process.env,CMS_TEST_PORT:String(testPort)},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error('Game server stopped: '+code)));});
}
const b=await chromium.launch({...await resolveChromiumRuntime(),headless:true});const p=await b.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>console.log('PAGEERROR',e.message));
try{
 const samples=[['season-1-of-3',career(7001,{total:3,completed:1})],['season-10-of-10',career(7002,{total:10,completed:10})],['zero-zero',career(7003,{total:3,completed:1,zero:true})]];
 const exports=[];
 for(const [label,c]of samples){await seed(p,await data(c));await open(p);const e=await backup(p);assert.equal(e.payload.activeShowdown.rounds.length,c.rounds.length);assert.deepEqual(e.payload.activeShowdown.score,c.score);assert.equal(e.payload.activeShowdown.totalRounds,c.totalRounds);console.log('PASS export',label,JSON.stringify(c.score));exports.push(e);}
 const half=await snap(p);
 await review(p,exports[0],{active:'keep-current',legacy:'keep-current',preferences:'keep-current',saveLibrary:'keep-current'});
 await p.reload();await p.locator('#loadingScreen').waitFor({state:'hidden'});await open(p);
 assert.deepEqual(await snap(p),half);assert.equal(await p.locator('.careerRestoreChoices').count(),0);
 console.log('PASS reload halfway through a restore review keeps the career and discards unconfirmed choices');
 const source=exports[0];await seed(p,await data(career(7999,{total:10,completed:9}),[career(7988,{total:3,completed:3,zero:true})]));await open(p);const before=await review(p,source,{active:'keep-current',legacy:'keep-current',preferences:'keep-current',saveLibrary:'keep-current'});await p.locator('.careerRestoreReview').screenshot({path:path.join(evidence,'keep-review.png')});const after=await apply(p);console.log('KEEP_ALL',JSON.stringify({same:before.saveLibrary===after.saveLibrary,beforeId:JSON.parse(before.saveLibrary).saves[0].showdown.id,afterId:JSON.parse(after.saveLibrary).saves[0].showdown.id,historyKept:before.legacyShowdowns===after.legacyShowdowns,preferencesKept:before.preferences===after.preferences}));await p.screenshot({path:path.join(evidence,'keep-after.png'),fullPage:true});
const actualKeep=before.saveLibrary===after.saveLibrary;

 // Exact replacement and halfway reload, followed by reset and clean restore.
 await p.goto(baseUrl);await p.locator('#loadingScreen').waitFor({state:'hidden'});await open(p);const e=await backup(p);assert.equal(e.payload.activeShowdown.id,7001);console.log('PASS reload preserves restored season and score');
 await seed(p,await data(career(7955,{total:3,completed:1}),[career(7966,{total:3,completed:3,zero:true})]));await open(p);
 const historyBefore=await snap(p);p.once('dialog',d=>d.dismiss());await p.getByRole('button',{name:'DELETE ALL LEGACY HISTORY',exact:true}).click();assert.deepEqual(await snap(p),historyBefore);
 p.once('dialog',d=>d.accept());await p.getByRole('button',{name:'DELETE ALL LEGACY HISTORY',exact:true}).click();const historyAfter=await snap(p);assert.equal(historyAfter.legacyShowdowns,null);assert.equal(historyAfter.saveLibrary,historyBefore.saveLibrary);console.log('PASS cancel history deletion keeps everything; confirmed history deletion keeps the unfinished career');
 p.once('dialog',d=>d.dismiss());const resetBefore=await snap(p);await p.getByRole('button',{name:'RESET ALL SHOWDOWN DATA',exact:true}).click();assert.deepEqual(await snap(p),resetBefore);console.log('PASS cancelled reset');
 p.once('dialog',d=>d.accept());await p.getByRole('button',{name:'RESET ALL SHOWDOWN DATA',exact:true}).click();await p.locator('#mainMenu').waitFor({state:'visible'});const cleared=await snap(p);assert.equal(cleared.saveLibrary,null);assert.equal(cleared.activeShowdown,null);assert.equal(cleared.legacyShowdowns,null);assert.equal(cleared.preferences,resetBefore.preferences);console.log('PASS reset clears careers and history, keeps preferences');
 await open(p);await review(p,exports[1],{active:'use-backup',legacy:'replace-with-backup',preferences:'use-backup',saveLibrary:'use-backup'});const restored=await apply(p);const lib=JSON.parse(restored.saveLibrary),active=lib.saves.find(s=>s.saveId===lib.activeSaveId).showdown;assert.equal(active.rounds.length,10);assert.deepEqual(active.score,{playerOne:110,playerTwo:110});assert.equal(active.status,'Completed');console.log('PASS clean restore final tied total 110-110, ten seasons');
 await p.goto(baseUrl);await p.locator('#loadingScreen').waitFor({state:'hidden'});await open(p);await p.locator('.legacyShowdownCard').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('.legacyShowdownCard')?.innerText.includes('SHOWDOWN FINISHES LEVEL'));assert.match(await p.locator('.legacyShowdownCard').innerText(),/SHOWDOWN FINISHES LEVEL/);await p.locator('.legacyDetails summary').click();await p.waitForFunction(()=>document.querySelectorAll('.legacySeasonRow').length===10);assert.equal(await p.locator('.legacySeasonRow').count(),10);console.log('PASS restored tied career has ten saved season rows and finishes level');
 await p.getByRole('button',{name:'BACK TO MAIN MENU',exact:true}).click();await open(p);
 p.once('dialog',d=>d.accept());await p.getByRole('button',{name:'DELETE ALL LEGACY HISTORY',exact:true}).click();
 assert.equal((await snap(p)).legacyShowdowns,null);assert.equal(await p.evaluate(()=>loadSavedShowdown()),null);
 await p.reload();await p.locator('#loadingScreen').waitFor({state:'hidden'});await open(p);assert.equal((await snap(p)).legacyShowdowns,null);console.log('PASS deleting completed history removes its current copy and does not return after reload');
 await review(p,exports[2],{active:'use-backup',legacy:'replace-with-backup',preferences:'use-backup',saveLibrary:'use-backup'});const zeroRestored=await apply(p);const zeroLib=JSON.parse(zeroRestored.saveLibrary);const zeroActive=zeroLib.saves.find(s=>s.saveId===zeroLib.activeSaveId).showdown;assert.deepEqual(zeroActive.score,{playerOne:0,playerTwo:0});assert.equal(zeroActive.rounds.length,1);console.log('PASS 0-0 saved season restores without losing the season');
 await fs.writeFile(path.join(evidence,'results.json'),JSON.stringify({exports,keep:{before,after},final:await snap(p)},null,2));
 console.log('EXPECTED current career 7999, nine saved seasons; ACTUAL backup career 7001, one saved season');
 assert.equal(actualKeep,true,'Keep current active state and Keep current Save Library must keep the current career; restore replaced it with the backup.');
}finally{await b.close();if(server)server.kill('SIGTERM');}})().catch(e=>{if(server)server.kill('SIGTERM');console.error(e);process.exitCode=1});
