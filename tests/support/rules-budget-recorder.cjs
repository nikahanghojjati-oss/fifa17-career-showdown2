"use strict";

// R93-08 Rules budget sweep, recorder half. Preloaded with `node -r` into an emulator suite that plays real flows (see
// tests/firebase/rules-budget-sweep-emulator.cjs). It never changes what the suite does or what it asserts:
//   - every write the suite makes through the Firebase SDK (runTransaction, writeBatch, setDoc, updateDoc, deleteDoc, addDoc)
//     as a signed-in or signed-out client, on an emulator project that loaded the COMPOSED production Rules, is measured;
//   - before the write runs, the whole emulator project is copied (owner REST, rules bypassed) and the same write is replayed
//     on copies whose Rules carry a calibrated pad: one extra document in the same request whose rule is a chain of `true`
//     terms. Firestore counts the 1,000-expression limit per request, so the largest pad that still passes gives the
//     headroom of the write without a per-validator needle;
//   - writes from rules-disabled contexts (seeding) and writes the composed Rules refuse are not measured;
//   - one JSON line per measured write goes to RULES_BUDGET_SWEEP_OUT; the suite then carries on with its real write.
//   - R94-06: the same write is also replayed to count its Rules lookups (get/exists/getAfter/existsAfter) against the
//     10-per-document and 20-per-request caps (see "Rules lookups per request" below).
// The padded copies are never deployed. Nothing here talks to anything but the local emulator.

const Module=require("node:module");
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");

const OUT=process.env.RULES_BUDGET_SWEEP_OUT;
const SUITE=process.env.RULES_BUDGET_SWEEP_SUITE||path.basename(process.argv[1]||"suite");
const HOST=process.env.FIRESTORE_EMULATOR_HOST;
assert.ok(OUT,"RULES_BUDGET_SWEEP_OUT must name the output file");
assert.ok(HOST,"FIRESTORE_EMULATOR_HOST must be set (run under firebase emulators:exec)");
const ROOT=path.resolve(__dirname,"../..");
const SHIPPED=fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8");
// RULES_BUDGET_SWEEP_MUTATE (diagnosis only): JSON [[find, replace], ...] applied to the padded replay copies, to see what
// part of a validator costs what. The suite itself always runs on the shipped Rules.
const COMPOSED=(()=>{let rules=SHIPPED;for(const [find,replace] of JSON.parse(process.env.RULES_BUDGET_SWEEP_MUTATE||"[]")){assert.equal(rules.split(find).length,2,`mutation needle must exist once: ${find}`);rules=rules.replace(find,replace);}return rules;})();
const LIMIT=/maximum of 1000 expressions/;
const PAD_COLLECTION="rulesBudgetPad";
const PAD_HOME="    match /{document=**} {";
assert.equal(COMPOSED.split(PAD_HOME).length,2,"the documents-level catch-all must exist exactly once");

const realLoad=Module._load;
const realFirestore=realLoad("firebase/firestore",module,false);
const realRut=realLoad("@firebase/rules-unit-testing",module,false);
realFirestore.setLogLevel("silent");

const identities=new WeakMap(); // Firestore instance -> {projectId, uid, token, composed}
const projects=new Map(); // projectId -> composed Rules loaded?

// The pad size comes from a custom claim of the replaying user's token (sweepPad), so the padded Rules load once. The pad is
// a sum of power-of-two blocks of `true` terms; a block runs only when its bit of sweepPad is set.
const PAD_BITS=[512,256,128,64,32,16,8,4,2,1];
function padBlock(k,prefix){
  const functions=[];let leaves=[];
  for(let left=k,i=0;left>0;left-=10,i++){const m=Math.min(10,left);functions.push(`    function ${prefix}L${i}() { return ${Array.from({length:m},()=>"true").join(" && ")}; }`);leaves.push(`${prefix}L${i}()`);}
  for(let depth=0;leaves.length>1;depth++){const next=[];for(let j=0;j<leaves.length;j+=10){const name=`${prefix}N${depth}x${j}`;functions.push(`    function ${name}() { return ${leaves.slice(j,j+10).join(" && ")}; }`);next.push(`${name}()`);}leaves=next;}
  return {functions,call:leaves[0]};
}
const PAD_FUNCTIONS=(()=>{
  const functions=[],terms=[];
  for(const bit of PAD_BITS){const block=padBlock(bit,`sweepPad${bit}`);functions.push(...block.functions);terms.push(`(n % ${bit*2} < ${bit} || ${block.call})`);}
  functions.push(`    function sweepPadOf(n) { return ${terms.join(" && ")}; }`);
  // sweepTarget (diagnosis only, RULES_BUDGET_SWEEP_PER_DOC=1): pad just the one written document at that path.
  functions.push(`    function sweepPad() { return request.auth == null || (request.auth.token.get('sweepTarget', '') != '' && request.path != path(request.auth.token.get('sweepTarget', ''))) || sweepPadOf(request.auth.token.get('sweepPad', 0)); }`);
  return functions.join("\n");
})();
// Firestore counts the 1,000 expressions per written document across ALL the allow statements it evaluates for it: a
// statement that comes out false still spends its expressions, and the first true one ends the evaluation (checked on the
// emulator). So the padded copies rewrite each match block's write statements into one statement per method,
//   allow update: if PAD && ((first condition) || (second condition) || ...);
// in source order, which pays the pad exactly once and spends at least what the separate statements spend. Read parts
// (get, list, read) are left as they were; `if false` write parts are dropped (they grant nothing).
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
const PADDED=(()=>{
  const {rules,padded}=padOnce(COMPOSED,"sweepPad()");
  assert.ok(padded>=40,`the sweep must pad every write method of every match block (padded ${padded})`);
  return rules.replace(PAD_HOME,`${PAD_FUNCTIONS}\n${PAD_HOME}`);
})();
if(process.env.RULES_BUDGET_SWEEP_DUMP)fs.writeFileSync(process.env.RULES_BUDGET_SWEEP_DUMP,PADDED);

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

// ---- padded replay project (Rules loaded once; cleared and re-seeded for every replay) ------------------------------
const hostName=HOST.split(":")[0],hostPort=Number(HOST.split(":")[1]);
let replayProject=null;
async function replayEnv(){
  if(!replayProject)replayProject=realRut.initializeTestEnvironment({projectId:`demo-rules-budget-sweep-${process.pid}`,firestore:{rules:PADDED,host:hostName,port:hostPort}});
  return replayProject;
}
let calibration=null;
async function calibrationPad(){
  if(calibration!==null)return calibration;
  const env=await realRut.initializeTestEnvironment({projectId:`demo-rules-budget-calibrate-${process.pid}`,firestore:{host:hostName,port:hostPort,
    rules:`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n${PAD_FUNCTIONS}\n    match /${PAD_COLLECTION}/{id} { allow create: if sweepPad() && true; }\n  }\n}\n`}});
  try{
    const attempt=async pad=>{
      await env.clearFirestore();
      const db=env.authenticatedContext("sweep_calibration",{sweepPad:pad}).firestore();
      try{await realFirestore.setDoc(realFirestore.doc(db,PAD_COLLECTION,"probe"),{});return true;}catch(error){if(!LIMIT.test(String(error.message)))throw error;return false;}
    };
    assert.ok(await attempt(0),"the calibration document must pass with no pad");
    let low=0,high=1023;
    while(low<high){const mid=Math.ceil((low+high)/2);if(await attempt(mid))low=mid;else high=mid-1;}
    calibration={gated:low};
  }finally{await env.cleanup();}
  // How many expressions one pad term is worth: the plain chain alone on a one-line rule (the Sacked and Europa League
  // meters' calibration). A write that passes with pad p used about (gated - p) terms of the gated calibration.
  const attempt=async pad=>{
    const block=padBlock(pad,"calibrationPad");
    const env=await realRut.initializeTestEnvironment({projectId:`demo-rules-budget-plain-${process.pid}-${pad}`,firestore:{host:hostName,port:hostPort,
      rules:`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n${block.functions.join("\n")}\n    match /${PAD_COLLECTION}/{id} { allow create: if ${block.call||"true"}; }\n  }\n}\n`}});
    try{await realFirestore.setDoc(realFirestore.doc(env.unauthenticatedContext().firestore(),PAD_COLLECTION,"probe"),{});return true;}
    catch(error){if(!LIMIT.test(String(error.message)))throw error;return false;}
    finally{await env.cleanup();}
  };
  let low=0,high=1000;
  while(low<high){const mid=Math.ceil((low+high)/2);if(await attempt(mid))low=mid;else high=mid-1;}
  calibration.plain=low;
  return calibration;
}

// Writes that cost more than the gated pad's own overhead allows (they fail the gated copy even with sweepPad=0) are
// measured on copies with a fixed plain chain in front of every write rule instead: one copy per pad size, cached.
const fixedEnvs=new Map();
function fixedRules(n){
  const block=padBlock(n,"sweepFixed");
  // RULES_BUDGET_SWEEP_FIXED_BLOCK (diagnosis only): pad just the match block whose header contains that text.
  return padOnce(COMPOSED,block.call||"true",process.env.RULES_BUDGET_SWEEP_FIXED_BLOCK).rules.replace(PAD_HOME,`${block.functions.join("\n")}\n${PAD_HOME}`);
}
async function fixedEnv(n){
  if(!fixedEnvs.has(n))fixedEnvs.set(n,realRut.initializeTestEnvironment({projectId:`demo-rules-budget-fixed-${process.pid}-${n}`,firestore:{rules:fixedRules(n),host:hostName,port:hostPort}}));
  return fixedEnvs.get(n);
}
let replays=0;
// Replays `ops` as the recorded identity on a padded copy seeded with `docs`: mode "gated" (sweepPad=pad in the token) or
// "fixed" (a plain chain of `pad` terms). Returns true (passed), false (refused by the expression limit) or throws with
// the refusal when anything else refused it.
async function replay(mode,pad,identity,docs,ops,target){
  replays+=1;
  const env=mode==="gated"?await replayEnv():await fixedEnv(pad);
  await env.clearFirestore();
  await restore(env.projectId,docs);
  const db=env.authenticatedContext(identity.uid,mode==="gated"?{...(identity.token||{}),sweepPad:pad,...(target?{sweepTarget:`/databases/(default)/documents/${target}`}:{})}:identity.token).firestore();
  const batch=realFirestore.writeBatch(db);
  for(const op of ops){
    const ref=realFirestore.doc(db,op.path);
    if(op.type==="set")op.options?batch.set(ref,op.data,op.options):batch.set(ref,op.data);
    else if(op.type==="update")batch.update(ref,...op.args);
    else batch.delete(ref);
  }
  try{await batch.commit();return true;}
  catch(error){if(LIMIT.test(String(error.message)))return false;error.replayRefusal=true;throw error;}
}
// Largest passing pad in [0, high], given that `high + 1` is not known to pass. `hint` (a pad that a cheaper instance of
// the same kind passed) is tried first and the search gallops down from it.
async function largestPad(attempt,high,hint){
  if(hint!==undefined&&hint<=high){
    if(await attempt(hint)){let low=hint,top=high;while(low<top){const mid=Math.ceil((low+top)/2);if(await attempt(mid))low=mid;else top=mid-1;}return low;}
    let top=hint-1,stepDown=1,low=-1;
    while(top>=0){const probe=Math.max(0,top-stepDown+1);if(await attempt(probe)){low=probe;break;}top=probe-1;stepDown*=2;}
    if(low<0)return -1;
    while(low<top){const mid=Math.ceil((low+top)/2);if(await attempt(mid))low=mid;else top=mid-1;}
    return low;
  }
  if(!await attempt(0))return -1;
  let low=0,top=high;
  while(low<top){const mid=Math.ceil((low+top)/2);if(await attempt(mid))low=mid;else top=mid-1;}
  return low;
}

// ---- R94-06: Rules lookups per request (get, exists, getAfter, existsAfter) -------------------------------------------
// Firestore also refuses a write whose Rules look up more than 10 distinct documents for one written document, or more than
// 20 for a whole batch or transaction (R94-05 probes on the emulator: the same path twice counts once, before and after of
// one path count twice, a path looked up by several documents of one request counts once). Measured here, on the same
// copied state as the expression replays:
//   - request total, exact: the write is replayed on the COMPOSED Rules unchanged plus a pad collection, with one or two
//     extra pad documents in the same batch whose rule looks up k more distinct (missing) documents, k from the token. The
//     largest k that still saves gives used = 20 - k. The pad documents spend no expressions of the written documents.
//   - per written document: one document never looks up more than its whole request, so this is only needed when a
//     multi-document request uses 9 or more. Then each written document's write rules get k distinct exists() calls in front
//     (one Rules copy per k) and 10 - the largest passing k is an upper bound (the pad also spends that document's
//     expressions; a refusal by the expression limit is counted as a lookup, never as headroom).
// A kind already measured in this process is first checked with one replay at its worst count so far (pass: not worse).
const LOOKUP_LIMIT=/Service call error/;
const LOOKUP_PAD_COLLECTION="rulesLookupPad",LOOKUP_PROBES="rulesLookupProbe",LOOKUP_REQUEST_CAP=20,LOOKUP_DOC_CAP=10,LOOKUP_PER_DOC_FROM=9;
const LOOKUP_TOTAL_RULES=COMPOSED.replace(PAD_HOME,`    function lookupPadOf(tag, n) { return ${Array.from({length:10},(_,i)=>`(n < ${i+1} || !exists(/databases/$(database)/documents/${LOOKUP_PROBES}/$(tag + '${i}')))`).join(" && ")}; }
    match /${LOOKUP_PAD_COLLECTION}/{id} { allow write: if lookupPadOf(id, request.auth.token.get(id, 0)); }
${PAD_HOME}`);
function lookupDocRules(k){
  const chain=Array.from({length:k},(_,i)=>`!exists(/databases/$(database)/documents/${LOOKUP_PROBES}/doc${i})`).join(" && ")||"true";
  const pad=`    function lookupDocPad() { return request.auth == null || request.path != path(request.auth.token.get('lookupTarget', '/databases/(default)/documents/none/none')) || (${chain}); }`;
  return padOnce(COMPOSED,"lookupDocPad()").rules.replace(PAD_HOME,`${pad}\n${PAD_HOME}`);
}
const lookupEnvs=new Map();
function lookupEnv(key,rules){
  if(!lookupEnvs.has(key))lookupEnvs.set(key,realRut.initializeTestEnvironment({projectId:`demo-rules-lookups-${key}-${process.pid}`,firestore:{rules:rules(),host:hostName,port:hostPort}}));
  return lookupEnvs.get(key);
}
// "pass", "lookup" (refused by the lookup cap) or "expression" (refused by the 1,000-expression limit); throws otherwise.
async function lookupReplay(env,claims,identity,docs,ops,padDocs){
  replays+=1;
  await env.clearFirestore();
  await restore(env.projectId,docs);
  const db=env.authenticatedContext(identity.uid,{...(identity.token||{}),...claims}).firestore();
  const batch=realFirestore.writeBatch(db);
  for(const op of ops){
    const ref=realFirestore.doc(db,op.path);
    if(op.type==="set")op.options?batch.set(ref,op.data,op.options):batch.set(ref,op.data);
    else if(op.type==="update")batch.update(ref,...op.args);
    else batch.delete(ref);
  }
  for(const id of padDocs)batch.set(realFirestore.doc(db,LOOKUP_PAD_COLLECTION,id),{pad:true});
  try{await batch.commit();return "pass";}
  catch(error){const message=String(error.message);if(LIMIT.test(message))return "expression";if(LOOKUP_LIMIT.test(message))return "lookup";error.replayRefusal=true;throw error;}
}
function lookupTotalAttempt(k,identity,docs,ops){
  const a=Math.min(10,k),b=k-a;
  return lookupEnv("total",()=>LOOKUP_TOTAL_RULES).then(env=>lookupReplay(env,{lookupA:a,lookupB:b},identity,docs,ops,b>0?["lookupA","lookupB"]:a>0?["lookupA"]:[]));
}
function lookupDocAttempt(k,target,identity,docs,ops){
  return lookupEnv(`doc${k}`,()=>lookupDocRules(k)).then(env=>lookupReplay(env,{lookupTarget:`/databases/(default)/documents/${target}`},identity,docs,ops,[]));
}
// Largest k in [0, high] that saves (-1 when k = 0 is refused), and whether the expression limit refused any k.
async function largestLookupPad(attempt,high){
  let expression=false;
  const pass=async k=>{const outcome=await attempt(k);if(outcome==="expression")expression=true;return outcome==="pass";};
  if(!await pass(0))return {k:-1,expression};
  let low=0,top=high;
  while(low<top){const mid=Math.ceil((low+top)/2);if(await pass(mid))low=mid;else top=mid-1;}
  return {k:low,expression};
}
const lookupBest=new Map(); // kind -> worst request total seen in this process
async function measureLookups(record,identity,docs,ops){
  const known=lookupBest.get(record.kind);
  if(known!==undefined&&await lookupTotalAttempt(LOOKUP_REQUEST_CAP-known,identity,docs,ops)==="pass")record.lookupsAtMost=known;
  else{
    const total=await largestLookupPad(k=>lookupTotalAttempt(k,identity,docs,ops),LOOKUP_REQUEST_CAP);
    record.lookups=total.k<0?LOOKUP_REQUEST_CAP+1:LOOKUP_REQUEST_CAP-total.k;
    if(total.k>=0&&(known===undefined||record.lookups>known))lookupBest.set(record.kind,record.lookups);
  }
  const used=record.lookups??record.lookupsAtMost;
  if(ops.length>1&&used>=LOOKUP_PER_DOC_FROM){
    record.lookupsPerDoc={};
    for(const op of ops){
      const one=await largestLookupPad(k=>lookupDocAttempt(k,op.path,identity,docs,ops),LOOKUP_DOC_CAP);
      const key=pattern(op.path),value=one.k<0?LOOKUP_DOC_CAP+1:LOOKUP_DOC_CAP-one.k;
      record.lookupsPerDoc[key]=Math.max(record.lookupsPerDoc[key]??0,value);
      if(one.expression)(record.lookupsExpressionBound||=[]).push(key);
    }
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

// ---- measurement -----------------------------------------------------------------------------------------------------
const best=new Map(); // kind -> {mode, pad} of the most expensive instance seen in this process
let sequence=0;
async function measure(identity,ops){
  if(!ops.length||!identity.uid)return null;
  const seq=++sequence,started=Date.now(),before=replays;
  const docs=await dump(identity.projectId);
  const existing=new Set(docs.map(item=>item.path));
  const kind=kindOf(ops,existing);
  const cal=await calibrationPad();
  const weight=1000/(cal.plain+1);
  const record={suite:SUITE,seq,kind,uid:identity.uid,paths:ops.map(op=>op.path),docs:docs.length,calibration:cal};
  const known=best.get(kind);
  try{
    let mode="gated",pad;
    let gatedZero;
    try{gatedZero=await replay("gated",0,identity,docs,ops);}
    catch(error){if(!error.replayRefusal)throw error;record.gatedRefused=String(error.message).slice(0,300);gatedZero=false;}
    if(gatedZero){
      if(known&&known.mode==="gated"&&await replay("gated",known.pad+1,identity,docs,ops)){record.mode="gated";record.notWorseThanUsed=Math.round((cal.gated-known.pad-1)*weight);}
      else pad=await largestPad(n=>replay("gated",n,identity,docs,ops),known&&known.mode==="gated"?known.pad:cal.gated,known&&known.mode==="gated"?known.pad:undefined);
    }else{
      mode="fixed";
      const cap=cal.plain-cal.gated+8;
      if(known&&known.mode==="fixed"&&await replay("fixed",known.pad+1,identity,docs,ops)){record.mode="fixed";record.notWorseThanUsed=Math.round((cal.plain-known.pad-1)*weight);}
      else pad=await largestPad(n=>replay("fixed",n,identity,docs,ops),known&&known.mode==="fixed"?known.pad:cap,known&&known.mode==="fixed"?known.pad:undefined);
    }
    if(pad!==undefined){
      record.mode=mode;record.pad=pad;
      record.used=pad<0?1001:Math.round(((mode==="gated"?cal.gated:cal.plain)-pad)*weight);
      const knownUsed=known?Math.round(((known.mode==="gated"?cal.gated:cal.plain)-known.pad)*weight):-1;
      if(record.used>knownUsed&&pad>=0)best.set(kind,{mode,pad});
    }
  }catch(error){
    if(!error.replayRefusal)throw error;
    record.replayRefused=String(error.message).slice(0,400);
  }
  if(process.env.RULES_BUDGET_SWEEP_PER_DOC==="1"&&ops.length>1&&record.pad!==undefined){
    // Diagnosis: the headroom of each written document alone (the gated pad on that path only; ~4 expressions high).
    record.perDoc={};
    for(const op of ops){
      try{const p=await largestPad(n=>replay("gated",n,identity,docs,ops,op.path),cal.gated,undefined);record.perDoc[pattern(op.path)]=p<0?">1000":Math.round((cal.gated-p)*weight);}
      catch(error){record.perDoc[pattern(op.path)]=`refused: ${String(error.message).slice(0,80)}`;}
    }
  }
  if(!record.replayRefused){
    const lookupStarted=Date.now();
    try{await measureLookups(record,identity,docs,ops);}
    catch(error){if(!error.replayRefusal)throw error;record.replayRefused=`lookup replay: ${String(error.message).slice(0,380)}`;}
    record.lookupMs=Date.now()-lookupStarted;
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
// R94-06: a few older suites drive real client saves (account bootstrap, device registration, the connected shared state)
// against the source file firestore.spark.rules. With RULES_BUDGET_SWEEP_COMPOSE=1 (set by the sweep for those suites only)
// they get the composed production Rules instead, so their saves are measured on what ships; their own checks still decide.
const SOURCE_RULES=(()=>{try{return fs.readFileSync(path.join(ROOT,"firestore.spark.rules"),"utf8");}catch(_error){return null;}})();
wrappedRut.initializeTestEnvironment=async function(config){
  if(process.env.RULES_BUDGET_SWEEP_COMPOSE==="1"&&config&&config.firestore&&config.firestore.rules===SOURCE_RULES)config={...config,firestore:{...config.firestore,rules:SHIPPED}};
  const env=await realRut.initializeTestEnvironment(config);
  const rules=config&&config.firestore&&config.firestore.rules;
  const composed=rules===SHIPPED;
  const projectId=env.projectId;
  projects.set(projectId,composed);
  const register=(context,uid,token,admin)=>{
    const original=context.firestore.bind(context);
    // R94-06: the test context hands out the compat Firestore; a modular doc(db, ...) reference carries the modular instance
    // inside it (db._delegate), so setDoc/updateDoc/deleteDoc/addDoc on such a reference are recognised too. Before this
    // only transactions and batches (called with db itself) were measured.
    context.firestore=(...args)=>{const db=original(...args);const identity={projectId,uid,token,composed:projects.get(projectId),admin};identities.set(db,identity);if(db&&db._delegate&&typeof db._delegate==="object")identities.set(db._delegate,identity);return db;};
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

