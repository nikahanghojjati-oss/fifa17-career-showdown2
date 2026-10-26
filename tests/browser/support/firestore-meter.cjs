"use strict";
// Firestore reads/writes meter for emulator browser audits (test-only, never served by the game).
// Method: the JOB-1824 meter (branch tools/firestore-meter, tools/firestore-meter/firestore-wrapper.js), which r76 used for
// "about 404 reads and 124 writes per season". Each browser context is served a wrapper in place of the Firebase Firestore
// SDK module (https://www.gstatic.com/firebasejs/<v>/firebase-firestore.js). The wrapper re-exports the real SDK and shadows
// the functions the app calls, so every document read and write the app asks for is reported to Node:
//   reads   getDoc / getDocFromServer = 1, getDocs = max(1, docs returned), transaction.get = 1 per attempt (a retried
//           transaction reads again, as the server bills it)
//   listen  each listener delivery from the server that carries new data: a document listener counts 1 for its first server
//           snapshot and 1 for every later snapshot whose data changed; a query listener counts its changed documents
//           (at least 1 for its first server snapshot). Metadata-only and from-cache snapshots count 0. (JOB-1824's wrapper
//           counted listener attaches only, so this is the stricter number.)
//   writes  each document a committed setDoc / updateDoc / deleteDoc / addDoc / writeBatch / transaction writes (1 per
//           document); failed transactions write nothing.
// This is a client-side count of what the app asks Firestore for. It is not the billed count (billed-meter.cjs adds that): Security Rules get()/exists()
// lookups are billed on top on the real service and are not visible here (see gameplay/r76 JOB-1825 for that model).
const fs=require("node:fs");
const path=require("node:path");

const REAL_MODULE="__cms-real-firebase-firestore.js";
const WRAPPER_SOURCE=`// Firestore meter wrapper (tests/browser/support/firestore-meter.cjs). Test-only.
import * as R from "./${REAL_MODULE}";
export * from "./${REAL_MODULE}";
try{Error.stackTraceLimit=60;}catch(_){}
// st: the calling js/ frames (module:line), so a read can be attributed to the game module that asked for it. req: one id per commit
// (a batch or a transaction), so the Rules lookups of its writes are billed once per distinct document per request.
const stk=()=>{try{return String(new Error().stack).split("\\n").filter(l=>/\\/js\\//.test(l)).map(l=>{const m=/(async )?(?:at )?([^\\s(]*)\\s*\\(?[^()]*\\/js\\/([^:/?]+\\.js)[^:]*:(\\d+):(\\d+)/.exec(l);return m?(m[3]+":"+m[4]+":"+m[5]+(m[2]?"("+m[2]+")":"")):l.trim();}).slice(0,10).join(" < ");}catch(_){return "";}};
let reqSeq=0;
const emit=e=>{try{if(typeof globalThis.__cmsMeterEvent==="function")globalThis.__cmsMeterEvent({t:Date.now(),st:e.st!==undefined?e.st:stk(),...e});}catch(_){}};
const pathOf=ref=>{try{return ref&&ref.path?ref.path:(ref&&ref._query&&ref._query.path?"QUERY:"+ref._query.path.canonicalString():"?");}catch(_){return "?";}};
export async function getDoc(ref){emit({k:"read",op:"getDoc",path:pathOf(ref),n:1});return R.getDoc(ref);}
export async function getDocFromServer(ref){emit({k:"read",op:"getDocFromServer",path:pathOf(ref),n:1});return R.getDocFromServer(ref);}
export async function getDocs(q){const st=stk();const snap=await R.getDocs(q);emit({k:"read",op:"getDocs",path:pathOf(q),n:Math.max(1,snap.size),st});return snap;}
export function onSnapshot(...args){
  const target=pathOf(args[0]);
  emit({k:"listener",op:"onSnapshot",path:target,n:0});
  let first=true,last;
  const count=snap=>{try{
    if(!snap||!snap.metadata)return;
    if(snap.metadata.fromCache){emit({k:"listenCache",op:"listen",path:target,n:0});return;}
    if(typeof snap.docChanges==="function"){const n=snap.docChanges().length;const billed=first?Math.max(1,n):n;first=false;if(billed)emit({k:"read",op:"listen",path:target,n:billed});return;}
    const sig=typeof snap.exists==="function"&&snap.exists()?JSON.stringify(snap.data()):"null";
    if(first||sig!==last)emit({k:"read",op:"listen",path:target,n:1});
    first=false;last=sig;
  }catch(_){}};
  const out=args.slice();
  const at=out.findIndex((a,i)=>i>0&&(typeof a==="function"||(a&&typeof a==="object"&&typeof a.next==="function")));
  if(at>0){const a=out[at];
    if(typeof a==="function")out[at]=snap=>{count(snap);return a(snap);};
    else out[at]={...a,next:snap=>{count(snap);return a.next(snap);}};
  }
  return R.onSnapshot(...out);
}
export async function setDoc(ref,...rest){const r=await R.setDoc(ref,...rest);emit({k:"write",op:"setDoc",path:pathOf(ref),n:1});return r;}
export async function updateDoc(ref,...rest){const r=await R.updateDoc(ref,...rest);emit({k:"write",op:"updateDoc",path:pathOf(ref),n:1});return r;}
export async function deleteDoc(ref){const r=await R.deleteDoc(ref);emit({k:"write",op:"deleteDoc",path:pathOf(ref),n:1});return r;}
export async function addDoc(ref,data){const r=await R.addDoc(ref,data);emit({k:"write",op:"addDoc",path:pathOf(ref),n:1});return r;}
export function writeBatch(db){
  const b=R.writeBatch(db),paths=[];
  const proxy=new Proxy(b,{get(t,p){
    if(p==="set"||p==="update"||p==="delete")return (ref,...a)=>{paths.push(pathOf(ref));t[p](ref,...a);return proxy;};
    if(p==="commit")return async()=>{const st=stk();const r=await t.commit();const req=++reqSeq;for(const x of paths)emit({k:"write",op:"batch",path:x,n:1,req,st});return r;};
    const v=t[p];return typeof v==="function"?v.bind(t):v;
  }});
  return proxy;
}
export function runTransaction(db,updateFn,options){
  let pending=[];const txst=stk();
  return R.runTransaction(db,async transaction=>{
    pending=[];
    const proxy={
      get:ref=>{emit({k:"read",op:"tx.get",path:pathOf(ref),n:1,st:txst});return transaction.get(ref);},
      set:(ref,...a)=>{pending.push({op:"tx.set",path:pathOf(ref)});transaction.set(ref,...a);return proxy;},
      update:(ref,...a)=>{pending.push({op:"tx.update",path:pathOf(ref)});transaction.update(ref,...a);return proxy;},
      delete:ref=>{pending.push({op:"tx.delete",path:pathOf(ref)});transaction.delete(ref);return proxy;}
    };
    return updateFn(proxy);
  },options).then(res=>{const req=++reqSeq;for(const w of pending)emit({k:"write",op:w.op,path:w.path,n:1,req,st:txst});emit({k:"tx",ok:true});return res;},
    err=>{emit({k:"tx",ok:false,code:err&&err.code||null,msg:String(err&&err.message||err).slice(0,120)});throw err;});
}
`;

// Install on a browser context BEFORE its own firebase-*.js route: Playwright runs the most recently registered matching
// route first, so call this after the SDK route is registered.
// Network cross-check (as JOB-1824's attachNet): the REST calls each context sends to the Firestore emulator. A transaction's
// reads go out as :batchGet (documents asked for) and its writes as one :commit whose entries are update / delete (written
// documents) or verify (a read-only document's precondition, not a billed write). Listen streams are not parsed.
async function installFirestoreMeter(context,{sdkDir,user,sink,firestoreOrigin}){
  await context.exposeBinding("__cmsMeterEvent",(_source,event)=>{sink.push({...event,user});});
  if(firestoreOrigin)context.on("request",request=>{
    const url=request.url();if(!url.startsWith(firestoreOrigin))return;
    try{
      const body=request.postData(),json=body?JSON.parse(body):null;
      if(/:commit(\?|$)/.test(url)&&json&&Array.isArray(json.writes)){let written=0,verify=0;for(const w of json.writes){if(w.verify)verify+=1;else written+=1;}sink.push({t:Date.now(),user,k:"net",op:"commit",written,verify});}
      else if(/:batchGet(\?|$)/.test(url)&&json&&Array.isArray(json.documents))sink.push({t:Date.now(),user,k:"net",op:"batchGet",docs:json.documents.length});
    }catch(_error){}
  });
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/,route=>route.fulfill({body:WRAPPER_SOURCE,contentType:"text/javascript; charset=utf-8"}));
  await context.route(new RegExp(`^https:\\/\\/www\\.gstatic\\.com\\/firebasejs\\/[\\d.]+\\/${REAL_MODULE.replace(/[.-]/g,"\\$&")}$`),route=>route.fulfill({path:path.join(sdkDir,"firebase-firestore.js"),contentType:"text/javascript; charset=utf-8"}));
}

function createMeter(){
  const events=[],marks=[];
  const mark=label=>{marks.push({label,t:Date.now()});};
  // Totals for [from,to) (milliseconds), per user and both together.
  function window(from,to){
    const inside=events.filter(e=>e.t>=from&&e.t<to);
    const sum=(list,k,op)=>list.filter(e=>e.k===k&&(!op||op(e))).reduce((a,e)=>a+(Number(e.n)||0),0);
    const part=list=>({sdkReads:sum(list,"read",e=>e.op!=="listen"),listenReads:sum(list,"read",e=>e.op==="listen"),reads:sum(list,"read"),writes:sum(list,"write"),
      failedTransactions:list.filter(e=>e.k==="tx"&&!e.ok).length,listenerAttaches:list.filter(e=>e.k==="listener").length,
      net:{commits:list.filter(e=>e.k==="net"&&e.op==="commit").length,committedDocs:list.filter(e=>e.k==="net"&&e.op==="commit").reduce((a,e)=>a+e.written,0),
        verifies:list.filter(e=>e.k==="net"&&e.op==="commit").reduce((a,e)=>a+e.verify,0),batchGetDocs:list.filter(e=>e.k==="net"&&e.op==="batchGet").reduce((a,e)=>a+e.docs,0)}});
    const byUser={};for(const user of [...new Set(inside.map(e=>e.user))])byUser[user]=part(inside.filter(e=>e.user===user));
    const top={};for(const e of inside)if(e.k==="read"||e.k==="write"){const key=`${e.k} ${e.op==="listen"?"listen":e.op.startsWith("tx.")?"tx":e.op} ${normalize(e.path)}`;top[key]=(top[key]||0)+(Number(e.n)||0);}
    return {ms:to-from,...part(inside),byUser,top:Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,15)};
  }
  const between=(a,b)=>{const from=marks.find(m=>m.label===a),to=marks.find(m=>m.label===b);if(!from||!to)throw new Error(`meter marks ${a} -> ${b} missing`);return window(from.t,to.t);};
  const write=file=>{try{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify({marks,events},null,0));}catch(_error){}};
  return {events,marks,mark,window,between,write};
}
function normalize(p){
  return String(p).split("/").map((seg,i)=>/^season_\d+$/.test(seg)?"season_N":(i%2===1&&seg.length>12&&/[0-9a-f]{8,}|_/.test(seg)&&!["current","authoritative"].includes(seg))?"{id}":seg).join("/");
}

module.exports={installFirestoreMeter,createMeter,WRAPPER_SOURCE};
