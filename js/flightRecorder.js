(function(root,factory){const api=factory(root);if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CareerModeFlightRecorder=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){"use strict";
// r100 Phoenix B5: the Flight Recorder and Phoenix Rebirth. Zero reads and zero writes to Firebase.
// The Firestore budget layer (js/sparkPrivatePairing.js, fsbTap) hands this module every server copy of a document the phone
// reads or a listener delivers anyway. observe() keeps only the PUBLIC step ledger of this Showdown's shared documents:
//   rivalries/{id}                                connectionState (active / closed) and its updatedAt
//   rivalries/{id}/sharedSetup/authoritative      operationTypes + actorRoles (open, league, clubs, seasons, two confirms)
//   rivalries/{id}/careerStart/authoritative      actorRoles (I STARTED AT)
//   rivalries/{id}/transferChallenges/season_N    operationTypes + actorRoles (window opened, guesses locked, signings locked...)
//   rivalries/{id}/seasonResults/season_N         actorRoles (each manager's publish)
//   rivalries/{id}/seasonCommits/season_N         actorRoles (LOCK & CONFIRM SEASON, CONFIRM SEASON)
// and each document's server updatedAt (startedAt/endedAt for the Transfer War). It never reads any other field: no
// guesses, signings, spins, results, scores, totals, clubs, leagues, ids or hashes, and never a per-manager document
// (.../roles/..., Prime Pack, sessions, accounts). So the journal cannot hold a rival's pick, guess, signing or score at any
// step, before or after a reveal. A step's time is exact when this phone saw the document at that step's own revision (the
// last step of a document carries its updatedAt); a step it only saw later is shown as "by" the later time.
// Phoenix Rebirth: while a shared Showdown is live this browser keeps one mark (its rivalry id). A page that starts with the
// mark already there (a reload, a closed tab opened again, an evicted page) and then sees that same live rivalry is a resume:
// a small gold phoenix rises once over the status line for about a second. A cold first open has no mark, so no phoenix.
// The close of the Showdown clears the mark. Nothing here is on a game step's path: every entry point is guarded.
const JOURNAL_KEY="careerModeShowdown.flightRecorder",MARK_KEY="careerModeShowdown.phoenixMark",MAX_STEPS=400,ARM_MS=15000;
const RIVALRY=/^pair_[0-9a-f]{64}$/,SEASON=/^season_([1-9]|10)$/;
const ROLES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
const SETUP_TYPES=Object.freeze(["open","commit-league","commit-clubs","commit-length","confirm"]);
const TRANSFER_TYPES=Object.freeze(["start-window","request-end-window","advance-expired-window","lock-guesses","lock-signings"]);
const KIND_ORDER=Object.freeze({setup:0,careerStart:1,transfer:2,results:3,commit:4,close:5});
const STEP_TEXT=Object.freeze({
  "setup:open":"Opened the Showdown","setup:commit-league":"Locked the league","setup:commit-clubs":"Locked the clubs",
  "setup:commit-length":"Locked the season count","setup:confirm":"Confirmed the Showdown",
  "careerStart:acknowledge":"Started the career",
  "transfer:start-window":"Opened the Transfer War","transfer:lock-guesses":"Locked guesses","transfer:lock-signings":"Locked signings",
  "transfer:request-end-window":"Asked to end the Transfer War","transfer:advance-expired-window":"Closed the Transfer War when the clock ran out",
  "results:publish":"Published the season's results","commit:commit":"Locked and confirmed the season","commit:acknowledge":"Confirmed the season",
  "close:close":"The Showdown closed"});

let journal=null,loaded=false,resumeMark=undefined,markHeld=null,phoenix={armed:false,rose:0,armedAt:0,rivalryId:null,timer:null};
const listeners=new Set();

// Saved through storage.js's helpers in their quiet form (quiet=true; storage.js is the only file that touches the browser's storage): a blocked or full
// storage never raises the "may not have saved" notice in the middle of a step. After a failed write the journal stays in
// memory only and no further write is tried on this page.
let storageBroken=false;
function readJson(key){if(typeof root.readStorageValue!=="function")return null;try{const raw=root.readStorageValue(key,true);return raw?JSON.parse(raw):null;}catch(_error){return null;}}
function writeJson(key,value){
  if(storageBroken||typeof root.writeStorageValue!=="function")return false;
  let ok=false;try{ok=root.writeStorageValue(key,JSON.stringify(value),true)===true;}catch(_error){ok=false;}
  if(!ok)storageBroken=true;
  return ok;
}

function millis(value){
  let ms=null;
  if(value&&typeof value.toMillis==="function"){try{ms=value.toMillis();}catch(_error){ms=null;}}
  else if(value&&typeof value==="object"&&Number.isFinite(value.seconds))ms=value.seconds*1000+Math.floor((Number(value.nanoseconds)||0)/1e6);
  return Number.isFinite(ms)&&ms>1577836800000&&ms<4102444800000?Math.floor(ms):null;
}
function roles(value,length){return Array.isArray(value)&&value.length===length&&value.every(role=>Object.hasOwn(ROLES,role))?value.slice():null;}
function types(value,length,allowed){return Array.isArray(value)&&value.length===length&&value.every(type=>allowed.includes(type))?value.slice():null;}

// path -> {rivalryId, kind, season}; null for every document the recorder does not keep (roles, sessions, accounts...).
function route(path){
  if(typeof path!=="string")return null;
  const parts=path.split("/");
  if(parts[0]!=="rivalries"||!RIVALRY.test(parts[1]||""))return null;
  const rivalryId=parts[1];
  if(parts.length===2)return {rivalryId,kind:"rivalry",season:null};
  if(parts.length!==4)return null;
  if(parts[2]==="sharedSetup"&&parts[3]==="authoritative")return {rivalryId,kind:"setup",season:null};
  if(parts[2]==="careerStart"&&parts[3]==="authoritative")return {rivalryId,kind:"careerStart",season:null};
  const season=SEASON.exec(parts[3]);
  if(!season)return null;
  const kind={transferChallenges:"transfer",seasonResults:"results",seasonCommits:"commit"}[parts[2]];
  return kind?{rivalryId,kind,season:Number(season[1])}:null;
}

// The whitelist: from a document's data only these fields are ever touched. Returns {ops:[{type,actor}], at, startedAt,
// endedAt} or {state} for the rivalry; null when the shape is not the one the shared modules write.
function extract(kind,data){
  if(!data||typeof data!=="object")return null;
  if(kind==="rivalry"){const state=data.data&&typeof data.data==="object"?data.data.connectionState:undefined;return state==="active"||state==="closed"?{state,at:millis(data.updatedAt)}:null;}
  const revision=data.revision;
  if(!Number.isInteger(revision)||revision<0||revision>64)return null;
  const actors=roles(data.actorRoles,revision);
  if(!actors)return null;
  let names;
  if(kind==="setup"){names=types(data.operationTypes,revision,SETUP_TYPES);}
  else if(kind==="transfer"){names=types(data.operationTypes,revision,TRANSFER_TYPES);}
  else if(kind==="careerStart"){names=actors.map(()=>"acknowledge");}
  else if(kind==="results"){names=actors.map(()=>"publish");}
  else if(kind==="commit"){names=actors.map((_role,index)=>index===0?"commit":"acknowledge");}
  if(!names)return null;
  return {ops:names.map((type,index)=>({type,actor:actors[index]})),at:millis(data.updatedAt),
    startedAt:kind==="transfer"?millis(data.startedAt):null};
}

function loadJournal(){
  if(loaded)return;
  loaded=true;
  const stored=readJson(JOURNAL_KEY);
  journal=stored&&stored.schemaVersion===1&&RIVALRY.test(stored.rivalryId||"")&&Array.isArray(stored.steps)?{schemaVersion:1,rivalryId:stored.rivalryId,steps:stored.steps.filter(validStep).slice(0,MAX_STEPS).map(({kind,season,index,type,actor,at,exact})=>({kind,season,index,type,actor,at,exact}))}:null;
  if(resumeMark===undefined){const mark=readJson(MARK_KEY);resumeMark=mark&&RIVALRY.test(mark.rivalryId||"")?mark.rivalryId:null;markHeld=resumeMark;}
}
function validStep(step){
  return step&&typeof step==="object"&&Object.hasOwn(KIND_ORDER,step.kind)&&(step.season===null||Number.isInteger(step.season)&&step.season>=1&&step.season<=10)&&
    Number.isInteger(step.index)&&step.index>=0&&step.index<64&&typeof step.type==="string"&&Object.hasOwn(STEP_TEXT,`${step.kind}:${step.type}`)&&
    (step.actor===null||Object.hasOwn(ROLES,step.actor))&&(step.at===null||Number.isInteger(step.at)&&step.at>1577836800000&&step.at<4102444800000)&&typeof step.exact==="boolean";
}
function save(){if(journal)writeJson(JOURNAL_KEY,journal);}
function notifyListeners(){for(const fn of listeners){try{fn();}catch(_error){}}}

function upsert(rivalryId,kind,season,index,type,actor,at,exact){
  if(!journal||journal.rivalryId!==rivalryId)return false;
  const found=journal.steps.find(step=>step.kind===kind&&step.season===season&&step.index===index);
  if(found){
    if(found.type!==type||found.actor!==actor){found.type=type;found.actor=actor;found.at=at;found.exact=exact;return true;}
    if(at===null||found.exact)return false;
    if(exact||found.at===null||at<found.at){found.at=at;found.exact=exact;return true;}
    return false;
  }
  if(journal.steps.length>=MAX_STEPS)return false;
  journal.steps.push({kind,season,index,type,actor,at,exact});
  return true;
}

// What this page has seen of each document (revision, or 0 when it saw the document missing) and of each rivalry (state):
// a step's time is exact only when its document's revision just grew in front of this page, and the close only when this page
// saw the rivalry live. A first look, or an envelope rewrite that moves updatedAt with no new step, gives "by" times.
const seenRevision=new Map(),seenState=new Map();
function observeData(path,data){
  loadJournal();
  const where=route(path);
  if(!where)return false;
  const facts=extract(where.kind,data);
  if(!facts)return false;
  let changed=false;
  if(where.kind==="rivalry"){
    // Only a live rivalry starts (or keeps) the journal: History reading an older, closed Showdown never replaces it.
    if(facts.state==="active"){
      if(!journal||journal.rivalryId!==where.rivalryId){journal={schemaVersion:1,rivalryId:where.rivalryId,steps:[]};changed=true;}
      markLive(where.rivalryId);armIfResumed(where.rivalryId);
    }else{changed=upsert(where.rivalryId,"close",null,0,"close",null,facts.at,facts.at!==null&&seenState.get(where.rivalryId)==="active");clearMark(where.rivalryId);}
    seenState.set(where.rivalryId,facts.state);
  }else{
    const last=facts.ops.length-1,before=seenRevision.get(path),grew=before!==undefined&&facts.ops.length>before;
    seenRevision.set(path,Math.max(before===undefined?0:before,facts.ops.length));
    facts.ops.forEach((op,index)=>{
      let at=facts.at,exact=grew&&index===last&&facts.at!==null;
      if(where.kind==="transfer"&&index===0&&op.type==="start-window"&&facts.startedAt!==null){at=facts.startedAt;exact=true;}
      if(upsert(where.rivalryId,where.kind,where.season,index,op.type,op.actor,at,exact))changed=true;
    });
  }
  if(changed){save();notifyListeners();}
  return changed;
}

// The budget layer's tap: a Firestore DocumentSnapshot (exists(), data(), metadata). A copy with this phone's own unsent
// write in it is skipped: only what the server holds is recorded.
function observe(path,snapshot){
  try{
    if(!route(path)||!snapshot||typeof snapshot!=="object")return false;
    if(snapshot.metadata&&snapshot.metadata.hasPendingWrites===true)return false;
    if(typeof snapshot.exists==="function"&&!snapshot.exists()){if(!seenRevision.has(path)&&route(path).kind!=="rivalry")seenRevision.set(path,0);return false;}
    const data=typeof snapshot.data==="function"?snapshot.data():null;
    return observeData(path,data);
  }catch(_error){return false;}
}

function steps(){
  loadJournal();
  if(!journal)return Object.freeze({rivalryId:null,steps:Object.freeze([])});
  const rank=step=>step.kind==="close"?99:step.season||0;
  const list=journal.steps.slice().sort((a,b)=>rank(a)-rank(b)||KIND_ORDER[a.kind]-KIND_ORDER[b.kind]||a.index-b.index).map(step=>Object.freeze({...step,
    who:step.actor?ROLES[step.actor]:"",text:STEP_TEXT[`${step.kind}:${step.type}`]}));
  return Object.freeze({rivalryId:journal.rivalryId,steps:Object.freeze(list)});
}

// ---------------------------------------------------------------------------------------------------------------------------
// The Flight Recorder view (Settings: SHOWDOWN DATA > FLIGHT RECORDER). Times are the server's, shown in this device's clock.
function el(document,tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined&&text!==null)node.textContent=String(text);return node;}
function timeText(ms){
  if(ms===null)return "";
  try{return new Date(ms).toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit",second:"2-digit"});}catch(_error){return "";}
}
function dayText(ms){
  try{return new Date(ms).toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"});}catch(_error){return "";}
}
function groupOf(step){return step.kind==="setup"||step.kind==="careerStart"?"SET-UP":step.kind==="close"?"THE END":`SEASON ${step.season}`;}
function render(container,options={}){
  const document=container&&container.ownerDocument;
  if(!document)return null;
  const view=steps();
  const wrap=el(document,"div","flightRecorder");
  wrap.dataset.flightRecorderSteps=String(view.steps.length);
  if(!view.steps.length){
    wrap.append(el(document,"p","flightRecorderEmpty","No steps yet. Each step of the Showdown appears here with its server time as it happens."));
    container.append(wrap);return wrap;
  }
  let group=null,list=null,day=null;
  for(const step of view.steps){
    const name=groupOf(step);
    if(name!==group){group=name;const section=el(document,"section","flightRecorderGroup");section.append(el(document,"h4","flightRecorderGroupHead",name));list=el(document,"ol","flightRecorderList");section.append(list);wrap.append(section);}
    const row=el(document,"li","flightRecorderStep");
    row.dataset.kind=step.kind;
    const when=el(document,"time","flightRecorderTime");
    if(step.at!==null){
      when.dateTime=new Date(step.at).toISOString();
      const today=dayText(step.at);
      when.textContent=(step.exact?"":"by ")+timeText(step.at);
      if(today!==day){day=today;row.append(el(document,"span","flightRecorderDay",today));}
    }else when.textContent="—";
    row.append(when,el(document,"b","flightRecorderWho",step.who),el(document,"span","flightRecorderWhat",step.text));
    list.append(row);
  }
  if(options.note!==false)wrap.append(el(document,"p","flightRecorderNote","Server times, shown in your local time. \"by\" marks a step that arrived a little later. Picks, guesses, signings and scores are never kept here."));
  container.append(wrap);
  return wrap;
}
function onChange(fn){if(typeof fn==="function"){listeners.add(fn);return()=>listeners.delete(fn);}return()=>{};}

// ---------------------------------------------------------------------------------------------------------------------------
// Phoenix Rebirth.
// The mark is read once (at load) and then held in memory: storage is touched only when it changes.
function markLive(rivalryId){if(markHeld===rivalryId)return;markHeld=rivalryId;writeJson(MARK_KEY,{schemaVersion:1,rivalryId});}
function clearMark(rivalryId){if(markHeld===rivalryId){markHeld=null;writeJson(MARK_KEY,{schemaVersion:1,rivalryId:null});}if(phoenix.rivalryId===rivalryId)disarm();}
function disarm(){phoenix.armed=false;if(phoenix.timer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(phoenix.timer);phoenix.timer=null;}
function armIfResumed(rivalryId){
  if(phoenix.rose||phoenix.armed||resumeMark!==rivalryId)return;
  phoenix.armed=true;phoenix.armedAt=Date.now();phoenix.rivalryId=rivalryId;
  watchStatusLine();
}
function statusLine(){
  const document=root.document;if(!document)return null;
  const chip=document.getElementById("seasonIndicator");
  if(!chip||!chip.isConnected||!/^(Season \d+ \/ \d+|Showdown Complete)$/.test((chip.textContent||"").trim()))return null;
  const box=chip.getBoundingClientRect();
  if(!(box.width>0&&box.height>0)||box.bottom<=0||box.top>=(root.innerHeight||0))return null;
  for(let node=chip;node&&node.nodeType===1;node=node.parentElement){const style=root.getComputedStyle(node);if(style.display==="none"||style.visibility==="hidden"||Number(style.opacity)===0)return null;}
  if(document.visibilityState==="hidden")return null;
  if(!onTop(chip,box))return null;
  return {chip,box};
}
// Nothing may be over the chip: no open overlay (Settings, a confirm, a reveal), and the chip itself is what is painted at its
// centre. The phoenix never draws over anything that is open.
function onTop(chip,box){
  const document=root.document;
  for(const open of document.querySelectorAll('#settingsOverlay:not(.hidden), dialog[open], [role="dialog"]:not([hidden]):not(.hidden), [aria-modal="true"]:not([hidden]):not(.hidden)')){
    const r=open.getBoundingClientRect();if(r.width>0&&r.height>0&&root.getComputedStyle(open).visibility!=="hidden")return false;  // drawn, so open
  }
  if(typeof document.elementFromPoint!=="function")return false;
  const hit=document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
  return Boolean(hit&&(hit===chip||chip.contains(hit)));
}
// The 15 s window starts when the loading screen has gone (a slow resume still gets its phoenix): while it shows, the clock waits.
function loadingShown(){
  const el=root.document&&root.document.getElementById("loadingScreen");
  if(!el||!el.isConnected||el.hidden||el.classList.contains("hidden"))return false;
  const style=root.getComputedStyle(el),box=el.getBoundingClientRect();
  return style.display!=="none"&&style.visibility!=="hidden"&&Number(style.opacity)>0&&box.width>0&&box.height>0;
}
function watchStatusLine(){
  if(!phoenix.armed||phoenix.rose)return;
  let loading=false;try{loading=loadingShown();}catch(_error){loading=false;}
  if(loading)phoenix.armedAt=Date.now();
  if(Date.now()-phoenix.armedAt>ARM_MS){disarm();return;}
  let line=null;try{line=statusLine();}catch(_error){line=null;}
  if(line){phoenix.armed=false;phoenix.timer=null;rise(line);return;}
  if(typeof root.setTimeout==="function")phoenix.timer=root.setTimeout(watchStatusLine,250);
}
const PHOENIX_SVG='<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><linearGradient id="phoenixRiseGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#e8c25a"/><stop offset="1" stop-color="#a8761e"/></linearGradient></defs><g fill="url(#phoenixRiseGold)"><path d="M31 29C25 21 17 16 6 6c4 10 7 17 13 23-6-2-10-2-16-4 6 7 14 11 23 11z"/><path d="M33 29c6-8 14-13 25-23-4 10-7 17-13 23 6-2 10-2 16-4-6 7-14 11-23 11z"/><path d="M32 21c3 4 4 10 2 18l-2 7-2-7c-2-8-1-14 2-18z"/><circle cx="32" cy="17.5" r="3.2"/><path d="M32 43c-2 6-6 10-11 15 6-1 9-3 11-6 2 3 5 5 11 6-5-5-9-9-11-15z"/></g></svg>';
function rise(line){
  const document=root.document;
  phoenix.rose+=1;
  try{document.documentElement.dataset.phoenixRose=String(phoenix.rose);}catch(_error){}
  try{
    const reduced=typeof root.isReducedMotionPreferred==="function"?Boolean(root.isReducedMotionPreferred()):Boolean(root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const size=Math.round(Math.max(22,Math.min(40,line.box.height*1.2)));
    const bird=document.createElement("span");
    bird.className="phoenixRise";bird.setAttribute("aria-hidden","true");bird.innerHTML=PHOENIX_SVG;
    Object.assign(bird.style,{position:"fixed",left:`${Math.round(line.box.left+line.box.width/2-size/2)}px`,top:`${Math.round(line.box.top+line.box.height/2-size/2)}px`,
      width:`${size}px`,height:`${size}px`,pointerEvents:"none",zIndex:"2147483000",opacity:"0",filter:"drop-shadow(0 0 6px rgba(240,200,90,.75))",contain:"strict"});
    document.body.appendChild(bird);
    const frames=reduced?[{opacity:0},{opacity:1,offset:.3},{opacity:1,offset:.7},{opacity:0}]:
      [{opacity:0,transform:"translateY(45%) scale(.8)"},{opacity:1,transform:"translateY(0) scale(1)",offset:.35},{opacity:1,transform:"translateY(-30%) scale(1.04)",offset:.7},{opacity:0,transform:"translateY(-70%) scale(1.06)"}];
    const done=()=>{bird.remove();try{delete document.documentElement.dataset.phoenixRising;}catch(_error){}};
    document.documentElement.dataset.phoenixRising="1";
    if(typeof bird.animate==="function"){const run=bird.animate(frames,{duration:1000,easing:"ease-out",fill:"forwards"});run.onfinish=done;run.oncancel=done;}
    // anything opened over the chip while it rises (Settings, a confirm, a reveal) takes the phoenix away at once (the bird
    // itself takes no pointer, so elementFromPoint looks through it)
    const guard=()=>{if(!bird.isConnected)return;let clear=false;try{clear=onTop(line.chip,line.chip.getBoundingClientRect());}catch(_error){clear=false;}
      if(!clear){done();return;}if(typeof root.requestAnimationFrame==="function")root.requestAnimationFrame(guard);};
    if(typeof root.requestAnimationFrame==="function")root.requestAnimationFrame(guard);
    if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(bird.isConnected)done();},1300);
  }catch(_error){}
}
function phoenixState(){loadJournal();return Object.freeze({resumeMark:resumeMark||null,armed:phoenix.armed,rose:phoenix.rose});}

return Object.freeze({contractVersion:1,feature:"r100-flight-recorder",providerReadRequired:false,providerWriteRequired:false,
  journalKey:JOURNAL_KEY,markKey:MARK_KEY,route,extract,observe,observeData,steps,render,onChange,phoenixState,
  _resetForTests(){journal=null;loaded=false;resumeMark=undefined;markHeld=null;storageBroken=false;seenRevision.clear();seenState.clear();disarm();phoenix={armed:false,rose:0,armedAt:0,rivalryId:null,timer:null};listeners.clear();}});
});
