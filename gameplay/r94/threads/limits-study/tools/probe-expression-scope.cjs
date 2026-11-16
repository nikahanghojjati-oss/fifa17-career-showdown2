"use strict";
// R94-05 probe: is the 1,000-expression limit counted per written document or per request?
const rut=require("@firebase/rules-unit-testing");const fs=require("firebase/firestore");fs.setLogLevel("silent");
const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(":");
function chain(n,prefix){const f=[];let leaves=[];for(let left=n,i=0;left>0;left-=10,i++){const m=Math.min(10,left);f.push(`function ${prefix}L${i}() { return ${Array.from({length:m},()=>"true").join(" && ")}; }`);leaves.push(`${prefix}L${i}()`);}
  for(let d=0;leaves.length>1;d++){const next=[];for(let j=0;j<leaves.length;j+=10){const name=`${prefix}N${d}x${j}`;f.push(`function ${name}() { return ${leaves.slice(j,j+10).join(" && ")}; }`);next.push(`${name}()`);}leaves=next;}return {f:f.join("\n"),call:leaves[0]};}
(async()=>{
  const sizes=[100,150,200,250,300,330];
  const blocks=sizes.map(n=>chain(n,"c"+n));
  const rules=`rules_version = '2';\nservice cloud.firestore {\n match /databases/{database}/documents {\n${blocks.map(b=>b.f).join("\n")}\n${sizes.map((n,i)=>`match /c${n}/{id} { allow write: if ${blocks[i].call}; }\nmatch /d${n}/{id} { allow write: if ${blocks[i].call}; }`).join("\n")}\n match /lk/{id} { allow write: if !exists(/databases/$(database)/documents/p/a) && !exists(/databases/$(database)/documents/p/b) && ${blocks[0].call}; }\n }\n}`;
  const env=await rut.initializeTestEnvironment({projectId:"demo-r94-05-expr",firestore:{rules,host,port:Number(port)}});
  const db=env.authenticatedContext("u").firestore();
  const t=async(name,fn)=>{try{await fn();console.log(`ALLOWED  ${name}`);}catch(e){console.log(`REFUSED  ${name} :: ${String(e.message).replace(/\s+/g," ").slice(-160)}`);}};
  const batch=async(...cols)=>{const b=fs.writeBatch(db);for(const c of cols)b.set(fs.doc(db,c,"x"+Math.random().toString(36).slice(2)),{v:1});await b.commit();};
  for(const n of sizes)await t(`single doc, chain of ${n} true terms`,()=>batch("c"+n));
  await t("batch: 200 + 200 (two docs)",()=>batch("c200","d200"));
  await t("batch: 250 + 250",()=>batch("c250","d250"));
  await t("batch: 300 + 300",()=>batch("c300","d300"));
  await t("batch: 300 + 300 + 250 + 250 + 200 + 200",()=>batch("c300","d300","c250","d250","c200","d200"));
  await t("batch: 330 + 100",()=>batch("c330","c100"));
  await t("transaction: 300 + 300",()=>fs.runTransaction(db,async x=>{x.set(fs.doc(db,"c300","t1"),{v:1});x.set(fs.doc(db,"d300","t2"),{v:1});}));
  await env.cleanup();
})().catch(e=>{console.error(e);process.exit(1);});
