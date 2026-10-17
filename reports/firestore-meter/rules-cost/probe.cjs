'use strict';
// Replay representative, synthetic emulator RPCs against the unchanged Rules.
// Raw inputs/output stay local. No production URL is accepted.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const M=require('./model.cjs');
const raw=JSON.parse(fs.readFileSync(process.argv[2])),rules=fs.readFileSync(process.argv[3],'utf8');
const port=Number(process.env.RULES_PROBE_PORT||9511),origin=`http://127.0.0.1:${port}`,project='demo-cms-browser-journey';
const root=`${origin}/v1/projects/${project}/databases/(default)/documents`,admin={Authorization:'Bearer owner','Content-Type':'application/json'};
if(!process.env.RULES_PROBE_JAR)throw Error('Set RULES_PROBE_JAR to the local emulator JAR');
const proc=process.env.RULES_PROBE_EXTERNAL==='1'?null:spawn('java',['-Xmx2g','-jar',process.env.RULES_PROBE_JAR,'--host','127.0.0.1','--port',String(port),'--project_id',project],{stdio:['ignore','ignore',fs.openSync('work/rules-cost/probe-emulator.log','w')]});
const done=proc?new Promise(resolve=>proc.once('exit',resolve)):Promise.resolve();
async function json(url,options={}){const r=await fetch(url,{...options,signal:AbortSignal.timeout(120000)});return{status:r.status,value:await r.json()};}
async function cov(){return M.coverage((await json(`${origin}/emulator/v1/projects/${project}:ruleCoverage`)).value);}
M.annotate(raw);
const all=raw.rpc.filter(e=>e.status!==undefined),commits=all.filter(e=>M.body(e).writes&&e.status===200).sort((a,b)=>b.t-a.t);
const stamp=s=>String(s).replace(/\.(\d+)Z$/,(_,f)=>'.'+f.padEnd(9,'0')+'Z');
const versions=new Map();for(const r of all)for(const x of [...(Array.isArray(r.response)?r.response:[]),...(r.before||[])])if(x.found)versions.set(x.found.name+'@'+stamp(x.found.updateTime),x.found);
const final=new Map((raw.finalDocuments||[]).filter(x=>x.found).map(x=>[x.found.name,x.found]));
function state(e){const s=new Map(final);for(const c of commits){if(c.t<e.t)break;for(const x of c.before||[]){if(x.found)s.set(x.found.name,x.found);if(x.missing)s.delete(x.missing);}}
 const b=M.body(e);if(e.status===409)for(const w of b.writes||[]){const name=w.update?.name||w.verify||w.delete||w.transform?.document;if(w.currentDocument?.exists===false)s.delete(name);else if(w.currentDocument?.updateTime){const doc=versions.get(name+'@'+stamp(w.currentDocument.updateTime));if(doc)s.set(name,doc);}}if(b.documents)for(const x of Array.isArray(e.response)?e.response:[]){if(x.found)s.set(x.found.name,x.found);if(x.missing)s.delete(x.missing);}return s;}
const universe=new Set([...final.keys(),...all.flatMap(M.documents)]);
function shiftTimes(value,ms){if(Array.isArray(value))return value.map(v=>shiftTimes(v,ms));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==='timestampValue'?new Date(Date.parse(v)+ms).toISOString():shiftTimes(v,ms)]));return value;}
async function seed(s,ms=0){const writes=[...universe].filter(n=>!s.has(n)).map(n=>({delete:n}));for(const d of s.values())writes.push({update:{name:d.name,fields:shiftTimes(d.fields,ms)}});const times=new Map();for(let i=0;i<writes.length;i+=200){const part=writes.slice(i,i+200),r=await json(root+':commit',{method:'POST',headers:admin,body:JSON.stringify({writes:part})});if(r.status!==200)throw Error('Admin seed failed '+r.status);part.forEach((w,j)=>{if(w.update)times.set(w.update.name,r.value.writeResults[j].updateTime)});}return times;}
function replayBody(e,times,ms=0){const b=shiftTimes(M.body(e),ms);delete b.transaction;for(const w of b.writes||[]){const n=w.update?.name||w.verify||w.delete||w.transform?.document;if(w.currentDocument?.updateTime&&(e.status===200||e.status===403))w.currentDocument={updateTime:times.get(n)};}return b;}
async function listen(e){const {initializeApp,deleteApp}=require('firebase/app'),sdk=require('firebase/firestore');const app=initializeApp({projectId:project,apiKey:'demo-api-key'},'rules-cost-'+Math.random());const db=sdk.initializeFirestore(app,{localCache:sdk.memoryLocalCache()});sdk.connectFirestoreEmulator(db,'127.0.0.1',port,{mockUserToken:e.authorization.replace(/^Bearer /,'')});let stop;try{return await new Promise(resolve=>{const timer=setTimeout(()=>resolve({status:599,value:{error:{message:'Listener timeout'}}}),20000);stop=sdk.onSnapshot(sdk.doc(db,M.documents(e)[0].replace(M.prefix,'')),{includeMetadataChanges:true},snap=>{if(!snap.metadata.fromCache){clearTimeout(timer);resolve({status:200,value:{}});}},error=>{clearTimeout(timer);resolve({status:error.code==='permission-denied'?403:599,value:{error:{message:error.message}}});});});}finally{stop?.();await sdk.terminate(db);await deleteApp(app);}}
async function main(){
 const deadline=Date.now()+30000;while(Date.now()<deadline){try{await fetch(origin);break;}catch{await new Promise(r=>setTimeout(r,500));}}
 if(process.env.RULES_PROBE_EXTERNAL!=='1'||process.env.RULES_PROBE_UPLOAD==='1'){const put=await json(`${origin}/emulator/v1/projects/${project}:securityRules`,{method:'PUT',headers:admin,body:JSON.stringify({rules:{files:[{name:'firestore.rules',content:rules}]}})});if(put.status!==200)throw Error('Rules upload failed');}
 const kinds=new Map();for(const e of all){const key=M.signature(e);if(!kinds.has(key))kinds.set(key,e);}
 const output=process.env.RULES_PROBE_OUT||'work/rules-cost/probes.raw.json',sha=require('node:crypto').createHash('sha256').update(rules).digest('hex');const checkpoint=fs.existsSync(output)?JSON.parse(fs.readFileSync(output)):null;if(checkpoint&&checkpoint.rulesSha256!==sha)throw Error('Checkpoint Rules hash mismatch');const old=checkpoint?.results||[];const proven=new Map();for(const r of old){if(kinds.has(r.key)&&r.N===3&&r.statuses.every(s=>s===r.originalStatus)&&(r.originalStatus<400||r.timeRebased))proven.set(r.key,r);}
 if(process.env.RULES_PROBE_REUSE_FROM){const prior=JSON.parse(fs.readFileSync(process.env.RULES_PROBE_REUSE_FROM));if(prior.rulesSha256!==require('node:crypto').createHash('sha256').update(rules).digest('hex'))throw Error('Reuse Rules hash mismatch');for(const r of prior.results)if(kinds.has(r.key)&&r.N===3&&r.statuses.every(s=>s===r.originalStatus))proven.set(r.key,{...r,reusedFrom:'same signature, unchanged Rules, prior isolated N=3'});}
 const results=[];console.log('PROBE_KINDS',kinds.size,'REUSE',proven.size);
 let i=0;for(const [key,e]of kinds){if(proven.has(key)){results.push(proven.get(key));console.log(++i,'REUSED',key.slice(0,100));continue;}const snapshot=state(e);const before=await cov();const statuses=[],errors=[];const N=3;
  for(let n=0;n<N;n++){const shift=Date.now()-e.t;const times=await seed(snapshot,shift);const b=replayBody(e,times,shift);const url=origin+new URL(e.url).pathname;const r=e.probeTransport==='listen'?await listen(e):await json(url,{method:e.method,headers:{Authorization:e.authorization,'Content-Type':'application/json'},body:JSON.stringify(b)});statuses.push(r.status);errors.push(r.value?.error?.message||null);}
  const after=await cov(),lookup=M.delta(before,after);const result={key,representative:e.id,N,timeRebased:true,originalStatus:e.status,statuses,errors,lookup};results.push(result);
  console.log(++i,key.slice(0,110),JSON.stringify({statuses,evals:lookup.evaluations,distinct:lookup.distinct}));
  const checkpoint=new Map(proven);for(const r of results)checkpoint.set(r.key,r);fs.writeFileSync(process.env.RULES_PROBE_OUT||'work/rules-cost/probes.raw.json',JSON.stringify({rulesSha256:require('node:crypto').createHash('sha256').update(rules).digest('hex'),results:[...checkpoint.values()]},null,2));
 }
 fs.writeFileSync(output,JSON.stringify({rulesSha256:require('node:crypto').createHash('sha256').update(rules).digest('hex'),results},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(proc)proc.kill();await done;});
