'use strict';
// Measurement-only preload: compile the unchanged 1824 harness with extra observers.
// Usage: NODE_OPTIONS='--require ./reports/firestore-meter/rules-cost/capture.cjs' ... node tests/browser/ce2pg-meter.cjs
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const original=Module.prototype._compile;
Module.prototype._compile=function(source,filename){
 if(!filename.endsWith('/tests/browser/ce2pg-meter.cjs'))return original.call(this,source,filename);
 if(process.env.RULES_COST_FIREBASE_CLI)source=source.replace('spawn("npx",["--yes","firebase-tools@15.28.1",', 'spawn(process.execPath,[process.env.RULES_COST_FIREBASE_CLI,');
 source=source.replace('const meter={events:', 'const meter={rpc:[],events:');
 source=source.replace('function stackChain() {\\n', 'function stackChain() {\\n  globalThis.__rulesCostStack=String(new Error().stack);\\n');
 source=source.replace('t: Date.now(), ...e','t: Date.now(), stack: String(new Error().stack), ...e');
 const marker='  const page=await context.newPage();';
 if(!source.includes(marker))throw new Error('Harness observer anchor changed');
 source=source.replace(marker,`
  await context.route(url=>url.origin===FIRESTORE&&url.pathname.startsWith('/v1/'),async route=>{
    const req=route.request(),body=req.postData();
    const entry={id:meter.rpc.length,t:Date.now(),manager:user,context:label,season:seasonNow,phase:currentPhase,window:idleWindow,url:req.url(),method:req.method(),body,authorization:req.headers().authorization};
    meter.rpc.push(entry);
    try{
      const payload=JSON.parse(body||'{}');
      if(payload.writes){
        const documents=payload.writes.map(w=>w.update?.name||w.delete||w.verify||w.transform?.document).filter(Boolean);
        const before=await fetch(FIRESTORE+'/v1/projects/'+PROJECT+'/databases/(default)/documents:batchGet',{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({documents})});
        entry.before=await before.json();
      }
    }catch(error){entry.captureError=error.message;}
    await route.continue();
  });
`+marker+`
  page.on('response',async response=>{
    if(!response.url().startsWith(FIRESTORE+'/v1/'))return;
    const req=response.request(),entry=[...meter.rpc].reverse().find(e=>e.context===label&&e.url===req.url()&&e.body===req.postData()&&e.status===undefined);
    if(!entry)return;
    entry.status=response.status();entry.end=Date.now();
    try{entry.response=await response.json();}catch(error){entry.responseError=error.message;}
  });
`);
 source=source.replace('const WRAPPER_SRC=', 'let WRAPPER_SRC=');
 // Direct snapshots remain observer events, outside all read/write counters.
 source=source.replace('const meter={rpc:',`WRAPPER_SRC=WRAPPER_SRC.replace('return transaction.get(ref);','return transaction.get(ref).then(snap=>{emit({k:"snapshot",path:pathOf(ref),data:snap.data()??null});return snap;});');
const meter={rpc:`);
 source=source.replace('await captureCoverage();',`const paths=[...new Set(meter.events.map(e=>e.path).filter(p=>p&&!p.startsWith('QUERY:')&&p!=='?'))];
    meter.finalDocuments=[];
    for(let i=0;i<paths.length;i+=50){const r=await fetch(FIRESTORE+'/v1/projects/'+PROJECT+'/databases/(default)/documents:batchGet',{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({documents:paths.slice(i,i+50).map(p=>'projects/'+PROJECT+'/databases/(default)/documents/'+p)})});meter.finalDocuments.push(...await r.json());}
    await captureCoverage();`);
 source=source.replace('main().catch(error=>',`const socketOutput=fs.createWriteStream(path.join(ROOT,'work/rules-cost',TAG+'.requests.jsonl'));
const requestSocket=new WebSocket('ws://127.0.0.1:'+PORTS.websocket+'/requests');
requestSocket.onmessage=e=>{const value=JSON.parse(e.data);for(const item of Array.isArray(value)?value:[value]){delete item.rules;socketOutput.write(JSON.stringify(item)+'\\n');}};
requestSocket.onerror=e=>console.error('RULES_COST_SOCKET_ERROR',e.message);
main().finally(()=>{requestSocket.close();socketOutput.end(()=>process.exit(process.exitCode||0));}).catch(error=>`);
 return original.call(this,source,filename);
};
