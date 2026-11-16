"use strict";
// R94-05 Firebase limits study (scratch tool, not shipped). Lookup-cap recorder: the R93-08 recorder with the pad changed
// from expressions to Rules document-access calls. Firestore refuses a write whose Rules evaluation makes more than 10
// distinct get()/exists()/getAfter() calls for one written document, or more than 20 for the whole batch/transaction.
// For every write a suite makes on the composed production Rules this measures, on padded copies:
//   - request total: two extra documents are added to the batch whose rule makes k extra distinct exists() calls (k from
//     the token); the largest k that passes gives total = 20 - k;
//   - per document: the write rule of one written document (token claim lkTarget) gets k extra distinct exists() calls in
//     front (one Rules copy per k); the largest k that passes gives used = 10 - k (or the request total binds first).
const Module=require("node:module");
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const OUT=process.env.RULES_BUDGET_SWEEP_OUT;
const SUITE=process.env.RULES_BUDGET_SWEEP_SUITE||path.basename(process.argv[1]||"suite");
const HOST=process.env.FIRESTORE_EMULATOR_HOST;
assert.ok(OUT);assert.ok(HOST);
const ROOT=process.env.REPO_ROOT||process.cwd();
const SHIPPED=fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8");
const COMPOSED=SHIPPED;
const LIMIT=/maximum of 1000 expressions/;
const LOOKUP=/Service call error/;
const PAD_HOME="    match /{document=**} {";
assert.equal(COMPOSED.split(PAD_HOME).length,2);
const realLoad=Module._load;
const realFirestore=realLoad("firebase/firestore",module,false);
const realRut=realLoad("@firebase/rules-unit-testing",module,false);
realFirestore.setLogLevel("silent");
const identities=new WeakMap();
const projects=new Map();
function scanBlocks(rules){
  // Returns the allow statements with their enclosing match block start, skipping string literals and comments.
  const statements=[],stack=[];let i=0;
  const allow=/allow\s+([a-z,\s]+?)\s*:\s*if\b/y;
  while(i<rules.length){
    const ch=rules[i];
    if(ch==="/"&&rules[i+1]==="/"){const end=rules.indexOf("\n",i);i=end<0?rules.length:end;continue;}
    if(ch==="'"||ch==='"'){let j=i+1;while(j<rules.length&&rules[j]!==ch){if(rules[j]==="\\")j++;j++;}i=j+1;continue;}
    if(ch==="{"){stack.push(i);i++;continue;}
    if(ch==="}"){stack.pop();i++;continue;}
    allow.lastIndex=i;
    const m=(rules[i]==="a"&&(i===0||/\s/.test(rules[i-1])))?allow.exec(rules):null;
    if(m){
      let j=allow.lastIndex;
      while(j<rules.length&&rules[j]!==";"){
        if(rules[j]==="/"&&rules[j+1]==="/"){const end=rules.indexOf("\n",j);j=end<0?rules.length:end;continue;}
        if(rules[j]==="'"||rules[j]==='"'){const q=rules[j];j++;while(j<rules.length&&rules[j]!==q){if(rules[j]==="\\")j++;j++;}}
        j++;
      }
      statements.push({start:i,end:j+1,block:stack[stack.length-1],methods:m[1].split(",").map(x=>x.trim()).filter(Boolean),condition:rules.slice(allow.lastIndex,j).trim()});
      i=j+1;continue;
    }
    i++;
  }
  return statements;
}
const WRITE_METHODS=["create","update","delete"];
function padOnce(rules,padExpression,blockFilter){
  const statements=scanBlocks(rules);
  const blocks=new Map();
  for(const st of statements){if(!blocks.has(st.block))blocks.set(st.block,[]);blocks.get(st.block).push(st);}
  const edits=[];let padded=0;
  for(const [blockStart,list] of blocks){
    const header=rules.slice(rules.lastIndexOf("match ",blockStart),blockStart);
    const padHere=!blockFilter||header.includes(blockFilter);
    const byMethod={create:[],update:[],delete:[]};
    for(const st of list){
      const writes=st.methods.flatMap(m=>m==="write"?WRITE_METHODS:(WRITE_METHODS.includes(m)?[m]:[]));
      const reads=st.methods.filter(m=>!WRITE_METHODS.includes(m)&&m!=="write");
      if(!writes.length)continue;
      if(st.condition!=="false")for(const m of new Set(writes))byMethod[m].push(st.condition);
      edits.push({start:st.start,end:st.end,text:reads.length?`allow ${reads.join(", ")}: if ${st.condition};`:""});
    }
    const combined=WRITE_METHODS.filter(m=>byMethod[m].length).map(m=>`allow ${m}: if ${padHere?padExpression:"true"} && (${byMethod[m].map(c=>`(${c})`).join(" || ")});`);
    padded+=combined.length;
    if(combined.length){const last=edits[edits.length-1];last.text=`${last.text}${last.text?" ":""}${combined.join(" ")}`;}
  }
  edits.sort((x,y)=>y.start-x.start);
  let out=rules;for(const e of edits)out=out.slice(0,e.start)+e.text+out.slice(e.end);
  return {rules:out,padded};
}

const ex=(tag,i)=>`!exists(/databases/$(database)/documents/lkPadProbe/${tag}${i})`;
// total mode: composed Rules + two pad documents
const TOTAL_RULES=COMPOSED.replace(PAD_HOME,`    function lkPadOf(tag, n) { return ${Array.from({length:10},(_,i)=>`(n < ${i+1} || !exists(/databases/$(database)/documents/lkPadProbe/$(tag + '${i}')))`).join(" && ")}; }
    match /lkPadDocs/{id} { allow write: if lkPadOf(id, request.auth.token.get(id, 0)); }
${PAD_HOME}`);
// per-document mode: k distinct exists() in front of the write rules of the targeted document
function docRules(k){
  const chain=Array.from({length:k},(_,i)=>ex("d",i)).join(" && ")||"true";
  const fn=`    function lkDocPad() { return request.auth == null || request.path != path(request.auth.token.get('lkTarget', '/databases/(default)/documents/none/none')) || (${chain}); }`;
  return padOnce(COMPOSED,"lkDocPad()").rules.replace(PAD_HOME,`${fn}\n${PAD_HOME}`);
}
if(process.env.LK_DUMP){fs.writeFileSync(process.env.LK_DUMP+".total.rules",TOTAL_RULES);fs.writeFileSync(process.env.LK_DUMP+".doc3.rules",docRules(3));}
const hostName=HOST.split(":")[0],hostPort=Number(HOST.split(":")[1]);
const envs=new Map();
function envFor(key,rules){
  if(!envs.has(key))envs.set(key,realRut.initializeTestEnvironment({projectId:`demo-lk-${key}-${process.pid}`,firestore:{rules:rules(),host:hostName,port:hostPort}}));
  return envs.get(key);
}
let replays=0;
function build(db,ops){
  const batch=realFirestore.writeBatch(db);
  for(const op of ops){
    const ref=realFirestore.doc(db,op.path);
    if(op.type==="set")op.options?batch.set(ref,op.data,op.options):batch.set(ref,op.data);
    else if(op.type==="update")batch.update(ref,...op.args);
    else batch.delete(ref);
  }
  return batch;
}
// returns "pass", "lookup" (refused by the access-call cap), "expr" (refused by the 1,000-expression limit); throws otherwise
async function attempt(env,claims,identity,docs,ops,extra){
  replays+=1;
  await env.clearFirestore();
  await restore(env.projectId,docs);
  const db=env.authenticatedContext(identity.uid,{...(identity.token||{}),...claims}).firestore();
  const batch=build(db,ops);
  for(const id of extra||[])batch.set(realFirestore.doc(db,"lkPadDocs",id),{v:1});
  try{await batch.commit();return "pass";}
  catch(error){const m=String(error.message);if(LIMIT.test(m))return "expr";if(LOOKUP.test(m))return "lookup";error.replayRefusal=true;throw error;}
}
async function totalAttempt(k,identity,docs,ops){
  const env=await envFor("total",()=>TOTAL_RULES);
  const a=Math.min(10,k),b=Math.max(0,k-10);
  return attempt(env,{A:a,B:b},identity,docs,ops,k>0?(b>0?["A","B"]:["A"]):[]);
}
async function docAttempt(k,target,identity,docs,ops){
  const env=await envFor(`doc${k}`,()=>docRules(k));
  return attempt(env,{lkTarget:`/databases/(default)/documents/${target}`},identity,docs,ops);
}
async function largest(fn,high){
  // largest k in [0,high] with fn(k)==="pass"; also reports whether an expression refusal got in the way
  let exprAt=null;
  const first=await fn(0);
  if(first!=="pass")return {k:-1,why:first};
  let low=0,top=high;
  while(low<top){const mid=Math.ceil((low+top)/2);const r=await fn(mid);if(r==="pass")low=mid;else{if(r==="expr")exprAt=mid;top=mid-1;}}
  return {k:low,exprAt};
}
// ---- owner REST copy of a project -------------------------------------------------------------------------------------
const base=projectId=>`http://${HOST}/v1/projects/${projectId}/databases/(default)/documents`;
async function rest(url,options={}){
  const response=await fetch(url,{...options,headers:{Authorization:"Bearer owner","Content-Type":"application/json",...(options.headers||{})}});
  const text=await response.text();
  if(!response.ok)throw new Error(`emulator REST ${response.status} ${url}: ${text.slice(0,300)}`);
  return text?JSON.parse(text):{};
}
async function collectionIds(projectId,parent){
  const out=[];let pageToken;
  do{const body=await rest(`${base(projectId)}${parent?`/${parent}`:""}:listCollectionIds`,{method:"POST",body:JSON.stringify({pageSize:300,pageToken})});out.push(...(body.collectionIds||[]));pageToken=body.nextPageToken;}while(pageToken);
  return out;
}
async function dump(projectId){
  const docs=[];
  async function walk(parent){
    for(const id of await collectionIds(projectId,parent)){
      const collection=parent?`${parent}/${id}`:id;let pageToken;
      do{
        const body=await rest(`${base(projectId)}/${collection}?pageSize=300&showMissing=true${pageToken?`&pageToken=${encodeURIComponent(pageToken)}`:""}`);
        for(const document of body.documents||[]){
          const relative=document.name.split("/documents/")[1];
          if(document.fields||document.createTime)docs.push({path:relative,fields:document.fields||{}});
          await walk(relative);
        }
        pageToken=body.nextPageToken;
      }while(pageToken);
    }
  }
  await walk("");
  return docs;
}
async function restore(projectId,docs){
  for(let i=0;i<docs.length;i+=400){
    const writes=docs.slice(i,i+400).map(item=>({update:{name:`projects/${projectId}/databases/(default)/documents/${item.path}`,fields:item.fields}}));
    await rest(`${base(projectId)}:commit`,{method:"POST",body:JSON.stringify({writes})});
  }
}

// ---- kinds -----------------------------------------------------------------------------------------------------------
const LITERAL_IDS=/^(playerOne|playerTwo|authoritative|current|summary|marker|index|public|private)$/;
function pattern(docPath){
  return docPath.split("/").map((segment,i)=>i%2===0?segment:(LITERAL_IDS.test(segment)?segment:(/^season_\d+$/.test(segment)?"season_N":"*"))).join("/");
}
function phaseOf(data){
  if(!data||typeof data!=="object")return null;
  if(typeof data.phase==="string")return data.phase;
  if(data.data&&typeof data.data==="object"&&typeof data.data.phase==="string")return data.data.phase;
  if(data.data&&typeof data.data==="object"&&typeof data.data.state==="string")return `state:${data.data.state}`;
  if(typeof data.state==="string")return `state:${data.state}`;
  return null;
}
function lastOperation(data){
  if(data&&Array.isArray(data.operationTypes)&&data.operationTypes.length)return data.operationTypes[data.operationTypes.length-1];
  return null;
}
function kindOf(ops,existing){
  return ops.map(op=>{
    const verb=op.type==="set"?(existing.has(op.path)?"update":"create"):op.type;
    const phase=op.type==="set"?phaseOf(op.data):null;
    const operation=op.type==="set"?lastOperation(op.data):null;
    return `${verb} ${pattern(op.path)}${phase?` [${phase}]`:""}${operation?` {${operation}}`:""}`;
  }).sort().join(" + ");
}


// ---- measurement ----
const seen=new Map(); // kind -> {count, total, perDoc}
let sequence=0;
const FULL=Number(process.env.LK_FULL_PER_KIND||2);
async function measure(identity,ops){
  if(!ops.length||!identity.uid)return null;
  const seq=++sequence,started=Date.now(),before=replays;
  const docs=await dump(identity.projectId);
  const existing=new Set(docs.map(item=>item.path));
  const kind=kindOf(ops,existing);
  const record={suite:SUITE,seq,kind,uid:identity.uid,paths:ops.map(op=>op.path),docs:docs.length,nOps:ops.length};
  const known=seen.get(kind);
  try{
    if(known&&known.count>=FULL){
      // cheap check: not worse than the worst instance seen (same pads still pass)
      let same=true;
      const t=await totalAttempt(20-known.total,identity,docs,ops);
      if(t!=="pass")same=false;
      if(same)for(const op of ops){const p=pattern(op.path);const u=known.perDoc[p];if(u===undefined||typeof u!=="number"){same=false;break;}
        const cap=Math.min(10-u,20-known.total);const r=await docAttempt(cap,op.path,identity,docs,ops);if(r!=="pass"){same=false;break;}}
      if(same){record.notWorse=true;record.total=known.total;record.perDoc=known.perDoc;record.replays=replays-before;record.ms=Date.now()-started;known.count++;return record;}
    }
    const t=await largest(k=>totalAttempt(k,identity,docs,ops),20);
    record.total=t.k<0?`>20 (${t.why})`:20-t.k;if(t.exprAt!==null)record.totalExprAt=t.exprAt;
    record.perDoc={};
    for(const op of ops){
      const d=await largest(k=>docAttempt(k,op.path,identity,docs,ops),10);
      const p=pattern(op.path);
      let v=d.k<0?`refused(${d.why})`:10-d.k;
      if(typeof v==="number"&&typeof record.total==="number"&&d.k===20-record.total&&d.k<10)record.totalBinds=true;
      if(d.exprAt!==null){record.exprLimited=record.exprLimited||{};record.exprLimited[p]=d.exprAt;}
      record.perDoc[p]=typeof record.perDoc[p]==="number"&&typeof v==="number"?Math.max(record.perDoc[p],v):v;
    }
    const prev=seen.get(kind)||{count:0,total:0,perDoc:{}};
    prev.count++;
    if(typeof record.total==="number")prev.total=Math.max(prev.total,record.total);
    for(const [p,v] of Object.entries(record.perDoc))if(typeof v==="number")prev.perDoc[p]=Math.max(prev.perDoc[p]??0,v);else prev.perDoc[p]=v;
    seen.set(kind,prev);
  }catch(error){
    if(!error.replayRefusal)throw error;
    record.replayRefused=String(error.message).slice(-400);
  }
  record.replays=replays-before;record.ms=Date.now()-started;
  return record;
}
// The record is written after the suite's own write ran, with its outcome: a write the composed Rules refuse in the suite
// (a negative test) is kept out of the sweep's results.
async function settle(record,write){
  try{const result=await write();if(record)fs.appendFileSync(OUT,`${JSON.stringify({...record,inSuite:"accepted"})}\n`);return result;}
  catch(error){if(record)fs.appendFileSync(OUT,`${JSON.stringify({...record,inSuite:"refused",inSuiteCode:String(error&&error.code||error&&error.message||error).slice(0,120)})}\n`);throw error;}
}

// A real write: measure first, then run it exactly as the suite asked. A measurement problem fails the suite loudly.
function composedIdentity(db){const identity=db&&identities.get(db);return identity&&identity.composed&&!identity.admin?identity:null;}
// A measured write runs as one piece: record (dry run), copy, replay, then the real write. Two writes the suite fires at
// the same moment (the race suites) therefore run one after the other, which is one of the orders a real race can take;
// otherwise the copy taken for one write could already hold the other's result and the replay would be refused.
let queue=Promise.resolve();
function exclusive(task){const run=queue.then(task,task);queue=run.catch(()=>{});return run;}
const measureOnce=measure;

// ---- SDK wrappers ----------------------------------------------------------------------------------------------------
const wrappedFirestore=Object.assign({},realFirestore);
// The recorded write set of a transaction is known only after its update function ran. The function is run once against
// a dry transaction that records and does nothing (its reads go through the real store), the write is measured, then the
// real transaction runs the function again. Providers' update functions are pure in reads, so both runs agree.
wrappedFirestore.runTransaction=function(db,updateFunction,options){
  const identity=composedIdentity(db);
  if(!identity)return realFirestore.runTransaction(db,updateFunction,options);
  return exclusive(async()=>{
    let ops=[];
    try{
      await realFirestore.runTransaction(db,async transaction=>{
        ops=[];
        const recorder=new Proxy(transaction,{get(target,key){
          if(key==="set")return (ref,data,setOptions)=>{ops.push({type:"set",path:ref.path,data,options:setOptions});return recorder;};
          if(key==="update")return (ref,...args)=>{ops.push({type:"update",path:ref.path,args});return recorder;};
          if(key==="delete")return ref=>{ops.push({type:"delete",path:ref.path});return recorder;};
          const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;
        }});
        await updateFunction(recorder);
        throw DRY_RUN;
      },options);
    }catch(error){if(error!==DRY_RUN)ops=null;}
    const record=ops&&ops.length?await measureOnce(identity,ops):null;
    return settle(record,()=>realFirestore.runTransaction(db,updateFunction,options));
  });
};
const DRY_RUN=new Error("rules budget sweep dry run");
wrappedFirestore.writeBatch=function(db){
  const identity=composedIdentity(db);
  const batch=realFirestore.writeBatch(db);
  if(!identity)return batch;
  const ops=[];
  const proxy=new Proxy(batch,{get(target,key){
    if(key==="set")return (ref,data,options)=>{ops.push({type:"set",path:ref.path,data,options});options?target.set(ref,data,options):target.set(ref,data);return proxy;};
    if(key==="update")return (ref,...args)=>{ops.push({type:"update",path:ref.path,args});target.update(ref,...args);return proxy;};
    if(key==="delete")return ref=>{ops.push({type:"delete",path:ref.path});target.delete(ref);return proxy;};
    if(key==="commit")return ()=>exclusive(async()=>{const record=await measureOnce(identity,ops);return settle(record,()=>target.commit());});
    const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;
  }});
  return proxy;
};
function single(type,build){
  return function(ref,...rest){
    const identity=composedIdentity(ref&&ref.firestore);
    if(!identity)return realFirestore[type](ref,...rest);
    return exclusive(async()=>{const record=await measureOnce(identity,[build(ref,rest)]);return settle(record,()=>realFirestore[type](ref,...rest));});
  };
}
wrappedFirestore.setDoc=single("setDoc",(ref,[data,options])=>({type:"set",path:ref.path,data,options}));
wrappedFirestore.updateDoc=single("updateDoc",(ref,args)=>({type:"update",path:ref.path,args}));
wrappedFirestore.deleteDoc=single("deleteDoc",ref=>({type:"delete",path:ref.path}));
wrappedFirestore.addDoc=function(collectionRef,data){
  const identity=composedIdentity(collectionRef&&collectionRef.firestore);
  if(!identity)return realFirestore.addDoc(collectionRef,data);
  const ref=realFirestore.doc(collectionRef);
  return exclusive(async()=>{const record=await measureOnce(identity,[{type:"set",path:ref.path,data}]);await settle(record,()=>realFirestore.setDoc(ref,data));return ref;});
};

// ---- test environment wrapper: who is each Firestore instance? -------------------------------------------------------
const wrappedRut=Object.assign({},realRut);
wrappedRut.initializeTestEnvironment=async function(config){
  const env=await realRut.initializeTestEnvironment(config);
  const rules=config&&config.firestore&&config.firestore.rules;
  const composed=rules===SHIPPED;
  const projectId=env.projectId;
  projects.set(projectId,composed);
  const register=(context,uid,token,admin)=>{
    const original=context.firestore.bind(context);
    context.firestore=(...args)=>{const db=original(...args);identities.set(db,{projectId,uid,token,composed:projects.get(projectId),admin});return db;};
    return context;
  };
  const authenticatedContext=env.authenticatedContext.bind(env);
  const unauthenticatedContext=env.unauthenticatedContext.bind(env);
  const withSecurityRulesDisabled=env.withSecurityRulesDisabled.bind(env);
  env.authenticatedContext=(uid,token)=>register(authenticatedContext(uid,token),uid,token,false);
  env.unauthenticatedContext=()=>register(unauthenticatedContext(),null,undefined,false);
  env.withSecurityRulesDisabled=callback=>withSecurityRulesDisabled(context=>callback(register(context,null,undefined,true)));
  return env;
};

Module._load=function(request,parent,isMain){
  if(request==="firebase/firestore")return wrappedFirestore;
  if(request==="@firebase/rules-unit-testing")return wrappedRut;
  return realLoad.apply(this,arguments);
};

