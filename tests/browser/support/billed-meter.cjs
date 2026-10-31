"use strict";
// Billed Firestore reads (test-only). BILLED = client document reads (the firestore-meter.cjs count) + Security Rules dependent
// lookups. Firebase bills every distinct document a rule evaluation reaches with get()/exists()/getAfter()/existsAfter() as a read,
// for reads and for writes alike, and the console Usage chart does not show them. The per-path lookup sets come from the composed
// production Rules (rules-lookups.cjs); billed-reads-table.json pins the Rules text they were reviewed against and lists the
// lookups a normal allowed request never evaluates.
//
// Pricing rules
//   getDoc / getDocFromServer / transaction.get   one request each: 1 read + that path's read lookups
//   listener                                       Rules are evaluated when the listen stream attaches and again each time its
//                                                  results update (Firebase pricing, "Listeners and rules"): lookups at attach and
//                                                  on every delivered change after the first result; each delivery is 1 read (the
//                                                  firestore-meter count). A stream the SDK re-opens after a network blip (a
//                                                  fromCache snapshot, then a server one) is a "reconnect" delivery: 1 read +
//                                                  lookups even when nothing changed (Sol r86 #02).
//   getDocs (a query)                              Rules evaluated once for the query: lookups once, not per returned document
//                                                  (every `allow list` in the production Rules is false, so none is expected)
//   writes                                         lookups of the path's create/update upper bound, once per distinct document per
//                                                  commit (batch/transaction = one request, a single setDoc/updateDoc = its own)
// Not modelled: reads Firebase bills that the SDK makes without the app asking (index/metadata), rules-evaluation retries. A lookup of the very document being read or written is counted (conservative);
// `selfLookups` says how many reads that was.
const path=require("node:path");
const fs=require("node:fs");
const R=require("./rules-lookups.cjs");

const ROOT=path.resolve(__dirname,"../../..");
const RULES_FILE=path.join(ROOT,"firestore.spark.generated.rules");
const TABLE_FILE=path.join(__dirname,"billed-reads-table.json");

function loadModel({rulesFile=RULES_FILE,tableFile=TABLE_FILE}={}){
  const rulesText=R.loadRules(rulesFile),table=JSON.parse(fs.readFileSync(tableFile,"utf8"));
  const analysis=R.analyze(rulesText);
  const readCache=new Map(),writeCache=new Map(),finishedAt=new Map();
  // live=true (the default): the Showdown is still being played, so the liveReadExclusions apply too (r86 reads accuracy).
  function readDocs(template,live=true){
    const key=`${live?"live":"finished"} ${template}`;
    if(readCache.has(key))return readCache.get(key);
    const ub=R.upperBound(analysis,template,"get")||[];
    const ex=new Set([...(table.readExclusions?.[template]?.exclude||[]),...(live?table.liveReadExclusions?.[template]?.exclude||[]:[])]);
    const docs=ub.filter(d=>!ex.has(d));readCache.set(key,docs);return docs;
  }
  // A Showdown's reads after its Terminal Close / END (the career pages) are priced at the full upper bound.
  function markFinished(rivalryId,at=Date.now()){if(rivalryId&&!finishedAt.has(rivalryId))finishedAt.set(rivalryId,at);}
  function liveAt(docPath,t){const m=/rivalries\/(pair_[0-9a-f]+)/.exec(String(docPath||""));if(!m||!finishedAt.has(m[1]))return true;return !(Number.isFinite(t)&&t>=finishedAt.get(m[1]));}
  function writeDocs(template){
    if(writeCache.has(template))return writeCache.get(template);
    const docs=writeRequestDocs([...(R.upperBound(analysis,template,"create")||[]),...(R.upperBound(analysis,template,"update")||[])]);
    writeCache.set(template,docs);return docs;
  }
  return {analysis,table,rulesSha256:R.hashRules(rulesText),readDocs,writeDocs,markFinished,liveAt,templateOf:p=>R.matchTemplate(analysis,p)};
}
// RE-08 (r87): a write request is billed each distinct DOCUMENT its Rules look up once. The create and update branches are analysed
// apart, so their union (and the union over the documents of one transaction) named some documents twice under two spellings:
//  - root.X and after.X are both request.resource.data.X (every `let root` that feeds a lookup is request.resource.data);
//  - rivalries/{after.rivalryId} is rivalries/{rivalryId}: every validator that looks it up first requires the written
//    document's rivalryId to equal the match's {rivalryId} (create) or the stored one (update, itself checked at create);
//  - the signed-in account is one of the pair's two accounts (foldAccounts, now also across branches and documents).
// before.* is NOT folded into after.*: an update that moves a pointer (pairLinks) can reach the old and the new rivalry.
// The client table (FSB_RULES_LOOKUPS in js/sparkPrivatePairing.js) is generated from this, and its fsbWriteLookups folds the
// accounts of one request the same way.
function canonicalWriteDoc(doc){return String(doc).replace(/\{root\./g,"{after.").replace(/^rivalries\/\{after\.rivalryId\}/,"rivalries/{rivalryId}");}
function writeRequestDocs(docs){return R.foldAccounts(new Set([...docs].map(canonicalWriteDoc)));}
function moduleOf(st){
  const frames=String(st||"").split(" < ").map(f=>{const m=/^([A-Za-z0-9_]+\.js):(\d+)/.exec(f);return m?`${m[1]}:${m[2]}`:null;}).filter(Boolean);
  return frames.find(f=>!/^sparkPrivatePairing\.js/.test(f))||frames[0]||"?";
}
function shortPath(p){
  return String(p).replace(/pair_[0-9a-f]{20,}/g,"{rid}").replace(/accounts\/[A-Za-z0-9]{20,}/g,"accounts/{uid}").replace(/device_[0-9a-f]+/g,"{dev}").replace(/session_[0-9a-f]+/g,"{sid}").replace(/season_\d+/g,"season_N").replace(/idempotency\/[0-9a-f]+/g,"idempotency/{h}");
}
function emptyTotals(){return {docReads:0,rulesReads:0,billed:0,writes:0,rulesOnWrites:0,selfLookups:0,unmatched:0,byPath:{},byModule:{}};}
function bump(map,key,docs,rules){const e=map[key]||(map[key]={docs:0,rules:0});e.docs+=docs;e.rules+=rules;}

// events: firestore-meter events inside the window (any users). Returns totals for reads+listens+writes among them.
function price(model,events,listenState={initial:new Set()}){
  const T=emptyTotals();
  const writeReq=new Map();// req id -> {docs:Set, mod, count}
  const add=(docs,rules,p,st,isWrite)=>{
    if(isWrite){T.writes+=docs;T.rulesOnWrites+=rules;}else{T.docReads+=docs;T.rulesReads+=rules;}
    bump(T.byPath,`${isWrite?"write":"read"} ${shortPath(p)}`,docs,rules);bump(T.byModule,`${isWrite?"write":"read"} ${moduleOf(st)}`,docs,rules);
  };
  // user|path whose first result is still to come (it is the attach's evaluation, already priced there)
  let single=0;const initial=listenState.initial;
  for(const e of events){
    if(e.k==="read"){
      const tpl=model.templateOf(e.path);
      if(e.op==="listen"){
        const key=`${e.user}|${e.path}`;if(initial.has(key)){initial.delete(key);add(e.n,0,e.path,e.st,false);continue;}
        const docs=tpl?model.readDocs(tpl,model.liveAt?model.liveAt(e.path,e.t):true):[];
        add(e.n,docs.length,e.path,e.st,false);continue;
      }
      const docs=tpl?model.readDocs(tpl,model.liveAt?model.liveAt(e.path,e.t):true):[];if(!tpl&&!/^QUERY:/.test(e.path))T.unmatched+=1;
      const perRequest=e.op==="getDocs"?1:e.n;
      const rules=docs.length*perRequest;
      if(tpl&&docs.includes(tpl.replace(/^\//,"")))T.selfLookups+=perRequest;
      add(e.n,rules,e.path,e.st,false);
    }else if(e.k==="listener"){
      initial.add(`${e.user}|${e.path}`);
      const tpl=model.templateOf(e.path);
      const docs=tpl?model.readDocs(tpl,model.liveAt?model.liveAt(e.path,e.t):true):[];
      if(!tpl&&!/^QUERY:/.test(e.path))T.unmatched+=1;
      if(tpl&&docs.includes(tpl.replace(/^\//,"")))T.selfLookups+=1;
      add(0,docs.length,e.path,e.st,false);
    }else if(e.k==="write"){
      const tpl=model.templateOf(e.path);
      if(!tpl)T.unmatched+=1;
      const key=e.req?`${e.user}#${e.req}`:`single#${++single}`;
      const r=writeReq.get(key)||{docs:new Set(),mod:e.st,path:e.path,count:0};
      for(const d of (tpl?model.writeDocs(tpl):[]))r.docs.add(d);
      r.count+=e.n||1;writeReq.set(key,r);
      T.writes+=e.n||1;bump(T.byPath,`write ${shortPath(e.path)}`,e.n||1,0);bump(T.byModule,`write ${moduleOf(e.st)}`,e.n||1,0);
    }
  }
  for(const r of writeReq.values()){const n=writeRequestDocs(r.docs).length;T.rulesOnWrites+=n;bump(T.byPath,`write rules-lookups ${shortPath(r.path)}`,0,n);bump(T.byModule,`write ${moduleOf(r.mod)}`,0,n);}
  T.billed=T.docReads+T.rulesReads+T.rulesOnWrites;
  return T;
}
// Billed reads, per-minute steady rate over [from,to).
function top(map,n=5){return Object.entries(map).map(([k,v])=>({key:k,docs:v.docs,rules:v.rules,billed:v.docs+v.rules})).filter(x=>x.billed>0).sort((a,b)=>b.billed-a.billed).slice(0,n);}

// Attribution: billed reads of `events`, grouped by keyFn(event) -> string. Every read/listener event is priced alone; the writes of one
// commit are priced together (their lookups are shared) and the commit's lookups are charged to its first write. A listener delivery has no
// js/ frame of its own, so it takes the stack of the attach of the same user and path (from `allEvents`).
function attribute(model,events,allEvents,keyFn){
  const attach=new Map();
  for(const e of allEvents)if(e.k==="listener"&&e.st)attach.set(`${e.user}|${e.path}`,e.st);
  const out=new Map();
  const add=(key,d,r,user,w)=>{const o=out.get(key)||{docs:0,rules:0,writes:0,byUser:{}};o.docs+=d;o.rules+=r;o.writes+=w;const u=o.byUser[user]||(o.byUser[user]={docs:0,rules:0});u.docs+=d;u.rules+=r;out.set(key,o);};
  const groups=new Map(),listenState={initial:new Set()};let single=0;
  for(const e of events){
    const st=e.k==="read"&&e.op==="listen"?(attach.get(`${e.user}|${e.path}`)||e.st):e.st;
    const ev={...e,st};
    if(e.k==="write"){const g=`${e.user}#${e.req||`s${++single}`}`;(groups.get(g)||groups.set(g,[]).get(g)).push(ev);continue;}
    const p=price(model,[ev],listenState);
    add(keyFn(ev),p.docReads,p.rulesReads,e.user,0);
  }
  for(const g of groups.values()){
    const p=price(model,g);
    add(keyFn(g[0]),0,p.rulesOnWrites,g[0].user,g.length);
    for(const e of g.slice(1))add(keyFn(e),0,0,e.user,1);
  }
  return out;
}
function callerOf(st){
  const frames=String(st||"").split(" < ").map(f=>{const m=/^([A-Za-z0-9_]+\.js):(\d+)/.exec(f);return m?`${m[1]}:${m[2]}`:null;}).filter(Boolean);
  const own=frames.find(f=>!/^sparkPrivatePairing\.js:(914|944|993)$/.test(f)&&!/^sparkPrivatePairing\.js/.test(f));
  const via=frames.find(f=>/^sparkPrivatePairing\.js/.test(f));
  return own?own+(via?` (via ${via})`:""):(via||"?");
}
module.exports={loadModel,price,attribute,callerOf,top,moduleOf,shortPath,writeRequestDocs,canonicalWriteDoc,RULES_FILE,TABLE_FILE};

// Lead/worker tool: node tests/browser/support/billed-meter.cjs --print-client-table prints the rows of the generated Rules lookup
// table in js/sparkPrivatePairing.js (FSB_RULES_LOOKUPS, between its BEGIN/END lines) and the Rules sha256 to pin as FSB_RULES_SHA256.
if(require.main===module){
  if(process.argv[2]!=="--print-client-table"){console.error("usage: --print-client-table");process.exit(2);}
  const model=loadModel();
  const rows=R.templates(model.analysis).filter(t=>!t.includes("=**")).map(t=>{
    const pattern=t.replace(/^\//,"").replace(/\{[^}]+\}/g,"*");
    return `      ${JSON.stringify([pattern,model.readDocs(t,true).length,model.readDocs(t,false).length,model.writeDocs(t)])}`.replace(/","/g,'","').replace(/,(\d)/g,",$1");
  });
  process.stdout.write(`FSB_RULES_SHA256 ${model.rulesSha256}\n${rows.join(",\n")}\n`);
}
