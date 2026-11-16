"use strict";
// R94-05 scratch preload: before a suite clears its emulator project, total the stored documents (count and JSON bytes
// per collection group) and keep the largest snapshot. Run: node -r this suite.cjs under emulators:exec.
const fs=require("node:fs");const rut=require("@firebase/rules-unit-testing");
const HOST=process.env.FIRESTORE_EMULATOR_HOST,OUT=process.env.STORAGE_OUT;
let best=null;
async function rest(url,options={}){const r=await fetch(url,{...options,headers:{Authorization:"Bearer owner","Content-Type":"application/json",...(options.headers||{})}});if(!r.ok)throw new Error(`${r.status} ${await r.text()}`);return r.json();}
async function total(projectId){
  const base=`http://${HOST}/v1/projects/${projectId}/databases/(default)/documents`;const groups={};let docs=0,bytes=0;
  async function walk(parent){
    const ids=(await rest(`${base}${parent}:listCollectionIds`,{method:"POST",body:"{}"})).collectionIds||[];
    for(const id of ids){let token="";do{const page=await rest(`${base}${parent}/${id}?pageSize=300${token?`&pageToken=${token}`:""}`);for(const d of page.documents||[]){const rel=d.name.split("/documents")[1];const size=JSON.stringify(d.fields||{}).length;const g=rel.split("/").filter((_,i)=>i%2===1).join("/");groups[g]=groups[g]||{docs:0,bytes:0,max:0};groups[g].docs++;groups[g].bytes+=size;groups[g].max=Math.max(groups[g].max,size);docs++;bytes+=size;await walk(rel);}token=page.nextPageToken||"";}while(token);}
  }
  await walk("");return {projectId,docs,bytes,groups};
}
const real=rut.initializeTestEnvironment;
rut.initializeTestEnvironment=async function(config){const env=await real.call(this,config);const clear=env.clearFirestore.bind(env);
  env.clearFirestore=async()=>{try{const t=await total(env.projectId);if(!best||t.bytes>best.bytes){best=t;fs.writeFileSync(OUT,JSON.stringify(best,null,1));}}catch(e){fs.appendFileSync(OUT+".err",String(e)+"\n");}return clear();};const cleanup=env.cleanup.bind(env);env.cleanup=async()=>{try{const t=await total(env.projectId);if(!best||t.bytes>best.bytes){best=t;fs.writeFileSync(OUT,JSON.stringify(best,null,1));}}catch(e){fs.appendFileSync(OUT+".err",String(e)+"\n");}return cleanup();};return env;};
