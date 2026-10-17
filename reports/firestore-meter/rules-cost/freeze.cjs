'use strict';
const fs=require('node:fs'),M=require('./model.cjs');
(async()=>{let raw;for(;;){raw=JSON.parse(fs.readFileSync(process.argv[2]));if(raw.events.some(e=>/^(rivalry-final|history-)/.test(e.phase)))break;await new Promise(r=>setTimeout(r,5000));}
raw.cutoffAt=Math.min(...raw.events.filter(e=>/^(rivalry-final|history-)/.test(e.phase)).map(e=>e.t));
raw.rpc=raw.rpc.filter(e=>!/^(rivalry-final|history-)/.test(e.phase));raw.events=raw.events.filter(e=>!/^(rivalry-final|history-)/.test(e.phase));
const paths=[...new Set(raw.events.map(e=>e.path).filter(p=>p&&p!=='?'&&!p.startsWith('QUERY:')))];raw.finalDocuments=[];
for(let i=0;i<paths.length;i+=50){const r=await fetch('http://127.0.0.1:9411/v1/projects/demo-cms-browser-journey/databases/(default)/documents:batchGet',{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({documents:paths.slice(i,i+50).map(p=>M.prefix+p)})});if(r.status!==200)throw Error('Snapshot failed');raw.finalDocuments.push(...await r.json());}
fs.writeFileSync(process.argv[3],JSON.stringify(raw));console.log('FROZEN',raw.rpc.length,raw.finalDocuments.length);})().catch(e=>{console.error(e);process.exitCode=1});
