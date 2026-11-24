"use strict";
// POS1M Ring 1 stand-in Firestore: the part of the Firebase modular SDK the game's providers use (doc, getDoc,
// setDoc, updateDoc, deleteDoc, onSnapshot, runTransaction, writeBatch, serverTimestamp, deleteField, Timestamp),
// running in plain Node on a Sim (tests/pos1m/sim.cjs).
//
// It must be AT LEAST AS HARSH as Firestore. A stand-in kinder than Firestore would let POS1M pass what production
// fails. Each rule below names the Firestore behaviour it copies; where the stand-in is harsher on purpose it says so.
//
// Transactions (firebase-js-sdk TransactionRunner + Transaction):
//  - optimistic: each tx.get is a separate server read at that moment (no snapshot isolation). The commit carries a
//    precondition on every document read (its update time, or "does not exist"). A rival commit in between fails it.
//  - the update function is re-run on aborted / failed-precondition / already-exists and on every non-permanent code
//    (unavailable, deadline-exceeded, resource-exhausted, internal, unknown, cancelled, unauthenticated), up to
//    maxAttempts (default 5) with exponential backoff; permanent codes and non-Firestore errors surface at once.
//  - a read after a write in the same transaction throws invalid-argument; a document read twice at two versions
//    throws aborted; tx.update of a document read as missing throws invalid-argument.
//  - CONTENTION_DENIED: production answers some raced transactional writes with permission-denied instead of a retried
//    abort, because the Rules see the rival's newer document at commit time (js/sparkSharedSeasonCommit.js:100-104).
//    The stand-in does the same for a share of failed preconditions (permission-denied is never retried).
//  - PHANTOM_ABORT: Firestore can abort under lock contention without a version change; injected at a low rate.
// Network (memory-only cache, as the game runs it: js/productionFirebaseRuntime.js):
//  - every call is a request delivery then a response delivery, each picked by the Sim, so calls interleave freely.
//  - any call can fail with unavailable, deadline-exceeded or resource-exhausted before it reaches the server.
//  - LANDED BUT LOST: a write or commit can land on the server and still answer the phone with an error. Inside a
//    transaction the SDK then re-runs the update function, which must recognise its own landed write as a replay.
//  - offline: transaction and getDoc reads fail with unavailable (getDoc answers from a listener's cached copy, marked
//    fromCache, when one is live); setDoc/updateDoc queue in memory and send on reconnect; a killed tab loses them.
//  - a killed tab never hears back: its pending calls neither resolve nor reject, its listeners stop. A request
//    already in flight may or may not land.
// Time: serverTimestamp() resolves at commit to server time. Each phone's own clock is skewed (client.now()).
// Listeners:
//  - the first snapshot arrives asynchronously; later updates arrive late (virtual delay), merged (only the newest
//    version is delivered), never older than the last one delivered for that document, and in any order across
//    documents. A listener can stall (no updates until healed) or die (error callback, no more updates).
//  - a phone's own setDoc/updateDoc shows first as a local snapshot with hasPendingWrites and serverTimestamp fields
//    as null (the SDK default), then the acknowledged snapshot. Transactions raise no local snapshot.
// Data: undefined values, nested arrays, functions, class instances, serverTimestamp inside arrays, deleteField outside
//  an update or merge and documents over 1 MiB are refused with invalid-argument, as the SDK does. A Date is stored and
//  read back as a Timestamp. Every read returns a fresh copy.
// Ring 1 cannot run the Rules. Every write that lands is kept in server.writeLog so Ring 2 can replay it against the
// real composed Rules; a write the stand-in allowed and the Rules refuse is the red "kinder stand-in" alarm.

const RETRY_NON_PERMANENT=new Set(["cancelled","unknown","deadline-exceeded","resource-exhausted","internal","unavailable","unauthenticated"]);
const RETRY_TRANSACTION=new Set(["aborted","failed-precondition","already-exists",...RETRY_NON_PERMANENT]);
const NETWORK_CODES=["unavailable","deadline-exceeded","resource-exhausted"];
const LOST_ACK_CODES=["unavailable","deadline-exceeded"];
const LISTENER_DEATH_CODES=["resource-exhausted","internal","unavailable"];
const MAX_DOC_BYTES=1_048_487;
const MAX_DEPTH=20;

const DEFAULT_FAULTS=Object.freeze({
  callError:0,          // a call fails before it reaches the server
  lostAck:0,            // a write/commit lands, the phone hears an error
  contentionDenied:0.5, // share of failed transaction preconditions answered permission-denied (see header)
  phantomAbort:0,       // a commit aborts without any version change
  listenerDelayMs:0,    // max extra virtual delay before a listener update is delivered
  listenerStall:0,      // chance per update that the listener stalls until healed
  listenerDeath:0,      // chance per update that the listener dies with an error
  latencyMs:[5,120],    // virtual network latency per leg [min,max]
  backoffMs:1000        // first transaction retry backoff (SDK: 1000 ms, x1.5)
});

class FirestoreError extends Error{
  constructor(code,message){super(message||code);this.name="FirebaseError";this.code=code;}
}
function fail(code,message){throw new FirestoreError(code,message);}

// ---------------------------------------------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------------------------------------------
class Timestamp{
  constructor(seconds,nanoseconds){
    if(!Number.isInteger(seconds)||!Number.isInteger(nanoseconds)||nanoseconds<0||nanoseconds>999_999_999)fail("invalid-argument",`Timestamp(${seconds},${nanoseconds}) is invalid`);
    this.seconds=seconds;this.nanoseconds=nanoseconds;Object.freeze(this);
  }
  static fromMillis(ms){if(!Number.isFinite(ms))fail("invalid-argument","Timestamp.fromMillis needs a finite number");const seconds=Math.floor(ms/1000);return new Timestamp(seconds,Math.round((ms-seconds*1000)*1e6));}
  static fromDate(date){return Timestamp.fromMillis(date.getTime());}
  static now(){return Timestamp.fromMillis(Date.now());}
  toMillis(){return this.seconds*1000+Math.floor(this.nanoseconds/1e6);}
  toDate(){return new Date(this.toMillis());}
  isEqual(other){return other instanceof Timestamp&&other.seconds===this.seconds&&other.nanoseconds===this.nanoseconds;}
  valueOf(){return `${String(this.seconds+1e12).padStart(13,"0")}.${String(this.nanoseconds).padStart(9,"0")}`;}
  toJSON(){return {seconds:this.seconds,nanoseconds:this.nanoseconds,type:"firestore/timestamp/1.0"};}
  toString(){return `Timestamp(seconds=${this.seconds}, nanoseconds=${this.nanoseconds})`;}
}
class FieldValue{constructor(kind){this._methodName=kind;Object.freeze(this);}isEqual(other){return other instanceof FieldValue&&other._methodName===this._methodName;}}
const SERVER_TIMESTAMP=new FieldValue("serverTimestamp");
const DELETE_FIELD=new FieldValue("deleteField");
function serverTimestamp(){return SERVER_TIMESTAMP;}
function deleteField(){return DELETE_FIELD;}

function isPlainObject(value){if(!value||typeof value!=="object")return false;const proto=Object.getPrototypeOf(value);return proto===Object.prototype||proto===null;}
// Validate and convert caller data into the stored form. allowDelete: top level of update / merge set only.
function encode(value,where,{inArray=false,depth=0,allowDelete=false}={}){
  if(depth>MAX_DEPTH)fail("invalid-argument",`${where}: data nested deeper than ${MAX_DEPTH} levels`);
  if(value===undefined)fail("invalid-argument",`${where}: Unsupported field value: undefined`);
  if(value===null||typeof value==="boolean"||typeof value==="string")return value;
  if(typeof value==="number")return value;
  if(typeof value==="function"||typeof value==="symbol"||typeof value==="bigint")fail("invalid-argument",`${where}: Unsupported field value: a ${typeof value}`);
  if(value instanceof Timestamp)return value;
  if(value instanceof Date){if(Number.isNaN(value.getTime()))fail("invalid-argument",`${where}: invalid Date`);return Timestamp.fromDate(value);}
  if(value instanceof FieldValue){
    if(value===SERVER_TIMESTAMP){if(inArray)fail("invalid-argument",`${where}: serverTimestamp() is not currently supported inside arrays`);return value;}
    if(value===DELETE_FIELD){if(!allowDelete)fail("invalid-argument",`${where}: deleteField() can only be used with update() and set() with {merge:true}`);return value;}
  }
  if(Array.isArray(value)){
    if(inArray)fail("invalid-argument",`${where}: Nested arrays are not supported`);
    return value.map((item,index)=>encode(item,`${where}[${index}]`,{inArray:true,depth:depth+1}));
  }
  if(isPlainObject(value)){
    const out={};
    for(const key of Object.keys(value)){
      if(key==="")fail("invalid-argument",`${where}: empty field name`);
      if(/^__.*__$/.test(key))fail("invalid-argument",`${where}: field name ${key} is reserved`);
      out[key]=encode(value[key],`${where}.${key}`,{inArray,depth:depth+1,allowDelete:allowDelete&&depth===0});
    }
    return out;
  }
  fail("invalid-argument",`${where}: Unsupported field value: a custom ${value&&value.constructor&&value.constructor.name||"object"} object`);
}
function hasSentinel(value){if(value===SERVER_TIMESTAMP)return true;if(Array.isArray(value))return value.some(hasSentinel);if(isPlainObject(value))return Object.values(value).some(hasSentinel);return false;}
// Resolve serverTimestamp sentinels: with a Timestamp (server commit) or null (a phone's pending local copy).
function resolveSentinels(value,stamp){
  if(value===SERVER_TIMESTAMP)return stamp;
  if(Array.isArray(value))return value.map(item=>resolveSentinels(item,stamp));
  if(isPlainObject(value)){const out={};for(const [key,item] of Object.entries(value))out[key]=resolveSentinels(item,stamp);return out;}
  return value;
}
function copyOut(value){
  if(value instanceof Timestamp)return new Timestamp(value.seconds,value.nanoseconds);
  if(Array.isArray(value))return value.map(copyOut);
  if(isPlainObject(value)){const out={};for(const [key,item] of Object.entries(value))out[key]=copyOut(item);return out;}
  return value;
}
function canonical(value){
  if(value instanceof Timestamp)return `T${value.seconds}.${value.nanoseconds}`;
  if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
  if(isPlainObject(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function sizeOf(value){return canonical(value).length;}
function mergeInto(target,patch){
  const out={...target};
  for(const [key,value] of Object.entries(patch)){
    if(value===DELETE_FIELD){delete out[key];continue;}
    if(isPlainObject(value)&&isPlainObject(out[key]))out[key]=mergeInto(out[key],value);
    else out[key]=value;
  }
  return out;
}
function applyUpdatePaths(target,patch){
  const doc=cloneStored(target);
  for(const [path,value] of Object.entries(patch)){
    const parts=path.split(".");
    if(parts.some(part=>part===""))fail("invalid-argument",`update(): invalid field path ${path}`);
    let node=doc;
    for(let i=0;i<parts.length-1;i+=1){if(!isPlainObject(node[parts[i]]))node[parts[i]]={};else node[parts[i]]={...node[parts[i]]};node=node[parts[i]];}
    const last=parts[parts.length-1];
    if(value===DELETE_FIELD)delete node[last];else node[last]=value;
  }
  return doc;
}
function cloneStored(value){
  if(value instanceof Timestamp||value instanceof FieldValue)return value;
  if(Array.isArray(value))return value.map(cloneStored);
  if(isPlainObject(value)){const out={};for(const [key,item] of Object.entries(value))out[key]=cloneStored(item);return out;}
  return value;
}

// ---------------------------------------------------------------------------------------------------------------
// References and snapshots
// ---------------------------------------------------------------------------------------------------------------
function checkSegments(segments){
  for(const segment of segments){
    if(segment===""||segment==="."||segment==="..")fail("invalid-argument",`Invalid path segment "${segment}"`);
    if(/^__.*__$/.test(segment))fail("invalid-argument",`Invalid path segment "${segment}" (reserved)`);
  }
  return segments;
}
function split(parts){
  const out=[];
  for(const part of parts){if(typeof part!=="string")fail("invalid-argument",`Path segments must be strings, got ${typeof part}`);out.push(...part.split("/"));}
  return checkSegments(out);
}
class DocumentReference{
  constructor(firestore,segments){this.type="document";this.firestore=firestore;this._segments=segments;this.path=segments.join("/");this.id=segments[segments.length-1];}
  get parent(){return new CollectionReference(this.firestore,this._segments.slice(0,-1));}
  withConverter(){fail("unimplemented","POS1M stand-in has no converters");}
  isEqual(other){return other instanceof DocumentReference&&other.firestore===this.firestore&&other.path===this.path;}
}
class CollectionReference{
  constructor(firestore,segments){this.type="collection";this.firestore=firestore;this._segments=segments;this.path=segments.join("/");this.id=segments[segments.length-1];}
}
function firestoreOf(base){if(base instanceof Client)return base;if(base instanceof DocumentReference||base instanceof CollectionReference)return base.firestore;fail("invalid-argument","Expected a Firestore instance or reference");}
function doc(base,...parts){
  const db=firestoreOf(base);
  let segments=base instanceof Client?[]:[...base._segments];
  if(base instanceof CollectionReference&&parts.length===0)segments.push(db.server.autoId());
  segments=[...segments,...split(parts)];
  if(segments.length===0||segments.length%2!==0)fail("invalid-argument",`Invalid document reference. Document references must have an even number of segments, but ${segments.join("/")} has ${segments.length}.`);
  return new DocumentReference(db,segments);
}
function collection(base,...parts){
  const db=firestoreOf(base);
  const segments=[...(base instanceof Client?[]:base._segments),...split(parts)];
  if(segments.length%2!==1)fail("invalid-argument",`Invalid collection reference. Collection references must have an odd number of segments, but ${segments.join("/")} has ${segments.length}.`);
  return new CollectionReference(db,segments);
}
class DocumentSnapshot{
  constructor(ref,stored,{fromCache=false,hasPendingWrites=false}={}){
    this.ref=ref;this.id=ref.id;this._stored=stored;// stored: {data,version} or null
    this.metadata=Object.freeze({fromCache,hasPendingWrites,isEqual(other){return other&&other.fromCache===fromCache&&other.hasPendingWrites===hasPendingWrites;}});
  }
  exists(){return this._stored!==null&&this._stored.data!==null;}
  data(){return this.exists()?copyOut(this._stored.data):undefined;}
  get(field){if(!this.exists())return undefined;let node=this._stored.data;for(const part of String(field).split(".")){if(!isPlainObject(node))return undefined;node=node[part];}return node===undefined?undefined:copyOut(node);}
}

// ---------------------------------------------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------------------------------------------
class Server{
  constructor(sim,faults={}){
    this.sim=sim;
    this.faults={...DEFAULT_FAULTS,...faults};
    this.docs=new Map();// path -> {data,version,updateTime}
    this.version=0;
    this.clients=new Set();
    this.writeLog=[];
    this.meter={reads:0,writes:0,deletes:0,listenerReads:0,transactions:0,transactionAttempts:0,retries:0,lostAcks:0,callErrors:0,contentionDenied:0,phantomAborts:0};
    this.autoSeq=0;
  }
  autoId(){this.autoSeq+=1;return `auto${String(this.autoSeq).padStart(16,"0")}`;}
  client(options={}){const client=new Client(this,options);this.clients.add(client);return client;}
  read(path){const entry=this.docs.get(path);return entry?{data:entry.data,version:entry.version,updateTime:entry.updateTime}:{data:null,version:0,updateTime:null};}
  // Apply writes atomically at one server time. writes: [{path,kind:"set"|"merge"|"update"|"delete",data}]
  applyWrites(writes,{actor,via}){
    const stamp=Timestamp.fromMillis(this.sim.now);
    this.version+=1;
    const version=this.version,changed=[];
    for(const write of writes){
      const before=this.docs.get(write.path)||null;
      let after;
      if(write.kind==="delete")after=null;
      else if(write.kind==="set")after=resolveSentinels(write.data,stamp);
      else if(write.kind==="merge")after=resolveSentinels(mergeInto(before?before.data:{},write.data),stamp);
      else if(write.kind==="update"){if(!before)fail("not-found",`No document to update: ${write.path}`);after=resolveSentinels(applyUpdatePaths(before.data,write.data),stamp);}
      else fail("internal",`unknown write kind ${write.kind}`);
      if(after!==null&&sizeOf(after)>MAX_DOC_BYTES)fail("invalid-argument",`Document ${write.path} exceeds the maximum allowed size of 1,048,576 bytes`);
      changed.push({path:write.path,before,after});
    }
    for(const change of changed){
      if(change.after===null){this.docs.delete(change.path);this.meter.deletes+=1;}
      else{this.docs.set(change.path,{data:change.after,version,updateTime:this.sim.now});this.meter.writes+=1;}
      this.writeLog.push({seq:this.writeLog.length+1,at:this.sim.now,uid:actor.uid,client:actor.label,via,path:change.path,before:change.before?change.before.data:null,after:change.after});
    }
    for(const change of changed)for(const client of this.clients)client.serverChanged(change.path);
    return version;
  }
  // Test-only seeding (Rules disabled, no faults); listeners still hear it.
  adminSet(path,data){const encoded=encode(data,`admin set ${path}`);this.applyWrites([{path,kind:"set",data:encoded}],{actor:{uid:"admin",label:"admin"},via:"admin"});}
  adminGet(path){const entry=this.docs.get(path);return entry?copyOut(entry.data):null;}
  snapshot(){const out={};for(const path of [...this.docs.keys()].sort())out[path]=copyOut(this.docs.get(path).data);return out;}
}

// ---------------------------------------------------------------------------------------------------------------
// Client: one phone's Firestore instance (one tab). Killed tabs are replaced with a new Client.
// ---------------------------------------------------------------------------------------------------------------
class Client{
  constructor(server,{uid,label="phone",skewMs=0,faults={}}={}){
    this.server=server;this.sim=server.sim;this.uid=uid;this.label=label;this.skewMs=skewMs;
    this.faults={...server.faults,...faults};
    this.online=true;this.alive=true;
    this.listeners=new Set();
    this.offlineQueue=[];
    this.app={name:`pos1m-${label}`};
    this.type="firestore";
  }
  now(){return this.sim.now+this.skewMs;}
  latency(){const [min,max]=this.faults.latencyMs;return min+this.sim.int(Math.max(1,max-min+1));}
  // A network round trip: request leg, server work, response leg. work() runs on the server and may throw.
  // landed(work) tells whether the request reached the server, for LANDED BUT LOST.
  call(kind,work,{write=false}={}){
    return new Promise((resolve,reject)=>{
      if(!this.alive)return;// a killed tab never hears back
      const sim=this.sim;
      const answer=(fn)=>{sim.setTimer(()=>sim.defer(`${this.label} ${kind} answer`,()=>{if(this.alive)fn();}),this.latency());};
      sim.setTimer(()=>sim.defer(`${this.label} ${kind} request`,()=>{
        if(!this.alive&&!this.inFlightLands)return;
        if(!this.online){answer(()=>reject(new FirestoreError("unavailable",`Failed to ${kind} because the client is offline.`)));return;}
        if(sim.chance(this.faults.callError)){this.server.meter.callErrors+=1;const code=sim.pick(NETWORK_CODES);answer(()=>reject(new FirestoreError(code,`${kind}: injected ${code}`)));return;}
        let result,error=null;
        try{result=work();}catch(caught){error=caught;}
        if(!error&&write&&sim.chance(this.faults.lostAck)){this.server.meter.lostAcks+=1;const code=sim.pick(LOST_ACK_CODES);answer(()=>reject(new FirestoreError(code,`${kind}: landed, answer lost (${code})`)));return;}
        answer(()=>error?reject(error):resolve(result));
      }),this.latency());
    });
  }
  // Fault controls used by the story runner.
  goOffline(){if(!this.online)return;this.online=false;for(const listener of this.listeners)listener.offline();}
  goOnline(){if(this.online)return;this.online=true;for(const listener of this.listeners)listener.online();const queued=this.offlineQueue.splice(0);for(const item of queued)item.send();}
  // A killed tab: nothing more is heard. inFlight: whether requests already on the wire still land.
  kill({inFlightLands=this.sim.chance(0.5)}={}){this.alive=false;this.inFlightLands=inFlightLands;this.offlineQueue.length=0;for(const listener of this.listeners)listener.stop();this.listeners.clear();}
  healListeners(){for(const listener of this.listeners)listener.heal();}
  serverChanged(path){if(!this.alive)return;for(const listener of this.listeners)if(listener.ref.path===path)listener.serverChanged();}
  cachedFor(path){for(const listener of this.listeners){if(listener.ref.path===path&&listener.known)return listener.known;}return null;}
}

// ---------------------------------------------------------------------------------------------------------------
// Listener
// ---------------------------------------------------------------------------------------------------------------
class Listener{
  constructor(client,ref,{includeMetadataChanges=false},onNext,onError){
    this.client=client;this.ref=ref;this.includeMetadata=includeMetadataChanges;this.onNext=onNext;this.onError=onError;
    this.active=true;this.stalled=false;this.lastVersion=-1;this.lastKey=null;this.known=null;this.scheduled=false;this.pending=null;// pending local {data}
    this.fromCache=false;
    client.listeners.add(this);
    this.schedule(true);
  }
  emit(snapshot,key){
    if(!this.active)return;
    const metaKey=`${snapshot.metadata.fromCache}|${snapshot.metadata.hasPendingWrites}`;
    const dataKey=snapshot.exists()?canonical(snapshot._stored.data):"<missing>";
    if(this.lastKey!==null&&this.lastKey.dataKey===dataKey&&(this.lastKey.metaKey===metaKey||!this.includeMetadata))return;
    this.lastKey={dataKey,metaKey};
    try{this.onNext(snapshot);}catch(_error){}
    void key;
  }
  schedule(initial=false){
    if(this.scheduled||!this.active)return;
    const client=this.client,sim=client.sim,faults=client.faults;
    this.scheduled=true;
    const delay=client.latency()+(initial?0:sim.int(Math.max(1,faults.listenerDelayMs+1)));
    sim.setTimer(()=>sim.defer(`${client.label} listen ${this.ref.path}`,()=>{
      this.scheduled=false;
      if(!this.active||!client.alive)return;
      if(!client.online){if(initial&&!this.known){this.fromCache=true;this.emit(new DocumentSnapshot(this.ref,null,{fromCache:true}));}return;}
      if(!initial&&sim.chance(faults.listenerDeath)){this.die(sim.pick(LISTENER_DEATH_CODES));return;}
      if(!initial&&sim.chance(faults.listenerStall)){this.stalled=true;return;}
      if(this.stalled)return;
      const stored=client.server.read(this.ref.path);
      if(stored.version<=this.lastVersion&&!this.fromCache)return;// never older, never the same twice
      if(stored.version>this.lastVersion){client.server.meter.listenerReads+=1;client.server.meter.reads+=1;}
      this.lastVersion=stored.version;this.fromCache=false;
      this.known=stored.data===null?null:stored;
      if(this.pending&&this.pending.acked)this.pending=null;
      if(this.pending)return;// a newer local write still waits: the SDK shows the local copy until it is acknowledged
      this.emit(new DocumentSnapshot(this.ref,stored.data===null?null:stored,{fromCache:false,hasPendingWrites:false}));
    }),delay);
  }
  serverChanged(){this.schedule(false);}
  localWrite(data){// latency compensation for this phone's own setDoc/updateDoc
    this.pending={data,acked:false};
    this.emit(new DocumentSnapshot(this.ref,data===null?null:{data,version:this.lastVersion},{fromCache:!this.client.online,hasPendingWrites:true}));
  }
  localAcked(){if(this.pending)this.pending.acked=true;this.schedule(false);}
  localFailed(){this.pending=null;this.schedule(false);}
  offline(){if(!this.active)return;this.fromCache=true;if(this.includeMetadata&&this.known)this.emit(new DocumentSnapshot(this.ref,this.known,{fromCache:true}));}
  online(){if(!this.active)return;this.schedule(false);}
  heal(){if(!this.active)return;this.stalled=false;this.schedule(false);}
  die(code){if(!this.active)return;this.active=false;this.client.listeners.delete(this);if(this.onError){try{this.onError(new FirestoreError(code,`listen ${this.ref.path}: ${code}`));}catch(_error){}}}
  stop(){this.active=false;}
}

// ---------------------------------------------------------------------------------------------------------------
// SDK surface
// ---------------------------------------------------------------------------------------------------------------
function asRef(ref,fn){if(!(ref instanceof DocumentReference))fail("invalid-argument",`${fn}() expects a DocumentReference`);return ref;}
async function getDoc(ref){
  asRef(ref,"getDoc");const client=ref.firestore;
  if(!client.online){const cached=client.cachedFor(ref.path);if(cached)return new DocumentSnapshot(ref,cached,{fromCache:true});}
  return client.call("get document",()=>{const stored=client.server.read(ref.path);client.server.meter.reads+=1;return new DocumentSnapshot(ref,stored.data===null?null:stored);});
}
function localPreview(client,path,kind,data){
  const listener=[...client.listeners].find(item=>item.ref.path===path);
  const base=listener&&listener.known?listener.known.data:null;
  if(kind==="delete")return null;
  if(kind==="set")return resolveSentinels(data,null);
  if(kind==="merge")return resolveSentinels(mergeInto(base||{},data),null);
  if(!base)return null;
  return resolveSentinels(applyUpdatePaths(base,data),null);
}
function plainWrite(ref,kind,data,fn){
  asRef(ref,fn);const client=ref.firestore;
  const preview=localPreview(client,ref.path,kind,data);
  const mine=[...client.listeners].filter(item=>item.ref.path===ref.path);
  for(const listener of mine)listener.localWrite(preview);
  const send=()=>client.call(fn,()=>client.server.applyWrites([{path:ref.path,kind,data}],{actor:client,via:fn}),{write:true});
  const settleListeners=ok=>{for(const listener of mine)ok?listener.localAcked():listener.localFailed();};
  if(!client.online){
    return new Promise((resolve,reject)=>{client.offlineQueue.push({send:()=>send().then(value=>{settleListeners(true);resolve(value);},error=>{settleListeners(false);reject(error);})});});
  }
  return send().then(()=>{settleListeners(true);},error=>{settleListeners(false);throw error;});
}
function setDoc(ref,data,options){
  const merge=Boolean(options&&options.merge);
  if(options&&options.mergeFields)fail("unimplemented","POS1M stand-in: setDoc mergeFields");
  const encoded=encode(data,`setDoc() ${ref&&ref.path}`,{allowDelete:merge});
  return plainWrite(ref,merge?"merge":"set",encoded,"setDoc").then(()=>undefined);
}
function updatePatch(args,where){
  let patch;
  if(args.length===1){if(!isPlainObject(args[0]))fail("invalid-argument",`${where}: data must be an object`);patch=args[0];}
  else{if(args.length%2!==0)fail("invalid-argument",`${where}: field/value pairs`);patch={};for(let i=0;i<args.length;i+=2)patch[String(args[i])]=args[i+1];}
  const out={};
  for(const [path,value] of Object.entries(patch))out[path]=encode(value,`${where}.${path}`,{allowDelete:true,depth:0});
  return out;
}
function updateDoc(ref,...args){const patch=updatePatch(args,`updateDoc() ${ref&&ref.path}`);return plainWrite(ref,"update",patch,"updateDoc").then(()=>undefined);}
function deleteDoc(ref){return plainWrite(ref,"delete",null,"deleteDoc").then(()=>undefined);}
function onSnapshot(ref,...args){
  asRef(ref,"onSnapshot");
  let options={},onNext,onError;
  if(args[0]&&typeof args[0]==="object"&&typeof args[0].next!=="function"&&typeof args[0]!=="function"){options=args.shift();}
  if(args[0]&&typeof args[0]==="object"&&typeof args[0].next==="function"){onNext=args[0].next.bind(args[0]);onError=args[0].error?args[0].error.bind(args[0]):null;}
  else{onNext=args[0];onError=typeof args[1]==="function"?args[1]:null;}
  if(typeof onNext!=="function")fail("invalid-argument","onSnapshot() needs a callback");
  const client=ref.firestore;
  if(!client.alive)return ()=>{};
  const listener=new Listener(client,ref,options,onNext,onError);
  return ()=>{listener.stop();client.listeners.delete(listener);};
}

class Transaction{
  constructor(client){this.client=client;this.reads=new Map();this.writes=[];this.finished=false;}
  async get(ref){
    asRef(ref,"Transaction.get");
    if(this.writes.length)fail("invalid-argument","Firestore transactions require all reads to be executed before all writes.");
    const client=this.client;
    const stored=await client.call("transaction read",()=>{client.server.meter.reads+=1;return client.server.read(ref.path);});
    if(this.writes.length)fail("invalid-argument","Firestore transactions require all reads to be executed before all writes.");
    const seen=this.reads.get(ref.path);
    if(seen!==undefined&&seen!==stored.version)fail("aborted","Document version changed between two reads.");
    this.reads.set(ref.path,stored.version);
    return new DocumentSnapshot(ref,stored.data===null?null:stored);
  }
  set(ref,data,options){asRef(ref,"Transaction.set");const merge=Boolean(options&&options.merge);this.writes.push({path:ref.path,kind:merge?"merge":"set",data:encode(data,`Transaction.set() ${ref.path}`,{allowDelete:merge})});return this;}
  update(ref,...args){
    asRef(ref,"Transaction.update");
    if(this.reads.has(ref.path)&&this.reads.get(ref.path)===0)fail("invalid-argument","Can't update a document that doesn't exist.");
    this.writes.push({path:ref.path,kind:"update",data:updatePatch(args,`Transaction.update() ${ref.path}`)});return this;
  }
  delete(ref){asRef(ref,"Transaction.delete");this.writes.push({path:ref.path,kind:"delete",data:null});return this;}
  commit(){
    const client=this.client,server=client.server,sim=client.sim,reads=new Map(this.reads),writes=this.writes.slice();
    return client.call("transaction commit",()=>{
      if(sim.chance(client.faults.phantomAbort)){server.meter.phantomAborts+=1;fail("aborted","Transaction aborted (lock contention).");}
      for(const [path,version] of reads){
        if(server.read(path).version!==version){
          if(writes.length&&sim.chance(client.faults.contentionDenied)){server.meter.contentionDenied+=1;fail("permission-denied","Missing or insufficient permissions. (contended write, Rules saw the newer document)");}
          fail("failed-precondition","the stored version does not match the required base version");
        }
      }
      for(const write of writes){if(write.kind==="update"&&!reads.has(write.path)&&server.read(write.path).data===null)fail("not-found",`No document to update: ${write.path}`);}
      if(writes.length)server.applyWrites(writes,{actor:client,via:"transaction"});
      return true;
    },{write:writes.length>0});
  }
}
async function runTransaction(db,updateFunction,options={}){
  if(!(db instanceof Client))fail("invalid-argument","runTransaction() expects a Firestore instance");
  const maxAttempts=options&&options.maxAttempts!==undefined?options.maxAttempts:5;
  if(!Number.isInteger(maxAttempts)||maxAttempts<1)fail("invalid-argument","maxAttempts must be a positive integer");
  const server=db.server,sim=db.sim;
  server.meter.transactions+=1;
  let backoff=0;
  for(let attempt=1;;attempt+=1){
    server.meter.transactionAttempts+=1;
    if(attempt>1)server.meter.retries+=1;
    const tx=new Transaction(db);
    let result,error=null;
    try{result=await updateFunction(tx);}catch(caught){error=caught;}
    if(!error){try{await tx.commit();return result;}catch(caught){error=caught;}}
    const retryable=error&&error.name==="FirebaseError"&&RETRY_TRANSACTION.has(error.code);
    if(!retryable||attempt>=maxAttempts)throw error;
    backoff=backoff?Math.min(60_000,backoff*1.5):db.faults.backoffMs;
    const jitter=backoff*(sim.random()-0.5);
    await new Promise(resolve=>sim.setTimer(resolve,backoff+jitter));
    if(!db.alive)return new Promise(()=>{});
  }
}
class WriteBatch{
  constructor(db){this.db=db;this.writes=[];this.done=false;}
  set(ref,data,options){asRef(ref,"WriteBatch.set");const merge=Boolean(options&&options.merge);this.writes.push({path:ref.path,kind:merge?"merge":"set",data:encode(data,`WriteBatch.set() ${ref.path}`,{allowDelete:merge})});return this;}
  update(ref,...args){asRef(ref,"WriteBatch.update");this.writes.push({path:ref.path,kind:"update",data:updatePatch(args,`WriteBatch.update() ${ref.path}`)});return this;}
  delete(ref){asRef(ref,"WriteBatch.delete");this.writes.push({path:ref.path,kind:"delete",data:null});return this;}
  commit(){if(this.done)fail("failed-precondition","A write batch can no longer be used after commit() has been called.");this.done=true;const client=this.db,writes=this.writes.slice();return client.call("batch commit",()=>{for(const write of writes){if(write.kind==="update"&&client.server.read(write.path).data===null)fail("not-found",`No document to update: ${write.path}`);}client.server.applyWrites(writes,{actor:client,via:"batch"});return undefined;},{write:true});}
}
function writeBatch(db){return new WriteBatch(db);}

// The object the game's providers receive as options.firebaseSdk.
const sdk=Object.freeze({doc,collection,getDoc,setDoc,updateDoc,deleteDoc,onSnapshot,runTransaction,writeBatch,serverTimestamp,deleteField,Timestamp,FieldValue,FirestoreError});

module.exports={Server,Client,sdk,Timestamp,FieldValue,FirestoreError,DocumentReference,DocumentSnapshot,serverTimestamp,deleteField,canonical,copyOut,DEFAULT_FAULTS,RETRY_TRANSACTION};
