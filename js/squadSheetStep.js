(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSquadSheetStep=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r91 / 2.4.0 Squad Management step (Nik 2026-11-11; rules js/squadSheet.js, screen js/squadScreen.js). Twice a season:
  // "pre" after Chamber Men (its XI + subs 1-4 are that season's Russian Roulette board) and "post" after the Transfer War
  // (kept signings arrive, the Roulette's shot has left). Each manager sets his own squad and locks it; nobody sees the
  // rival's squad here (Nik 00:26 UTC: only on the Roulette board).
  // Store: rivalries/{rid}/squadSheets/season_N_<stage>_<role>, one create-only document per manager per screen (Rules:
  // season-results fragment). Its lists are cumulative (departures, reported overalls), so one document rebuilds the
  // sheet with the club data and the Transfer War history this phone already keeps (js/squadSheet.js replay): no read of
  // the earlier ones. Locked documents are kept on this phone, so a screen it already saw costs no read.
  // Reads per screen: one transaction read of this manager's own document (is it locked already, on another device?),
  // plus, before the Roulette, a listener on the rival's "pre" document until it arrives. Writes: one create at LOCK.
  // No timer (Nik 00:26 UTC): a manager is never locked in by the other phone.
  const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const STAGE_ID="sqStage",COLLECTION="squadSheets",OBJECT_TYPE="sharedSquadSheet",SCHEMA=1;
  const KEPT_KEY="careerModeShowdown.squadSheets.v1",KEPT_MAX=48,DONE_KEY="careerModeShowdown.squadDone.v1",DONE_MAX=60;
  const DRAFT_KEY="careerModeShowdown.squadDraft.v1",DRAFT_MAX=4,LOAD_WAIT_MS=12000,POLL_MS=4000;
  const STAGE_WORD=Object.freeze({pre:"Before the Russian Roulette",post:"After the Transfer War"});
  const NEXT_WORD=Object.freeze({pre:"GO TO THE RUSSIAN ROULETTE",post:"GO TO SEASON RESULTS"});
  const LIST_MAX=Object.freeze({names:18,out:100,ov:150});
  let running=null,wentHome=false;
  const boardsMemo=new Map();// `${rid}|${season}` -> {playerOne:{formation,board}, playerTwo:{...}}

  function sqsDoc(){return root.document||null;}
  function sqsOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function sqsEngine(){return root.CareerModeSquadSheet||(typeof require==="function"?require("./squadSheet.js"):null);}
  function sqsDocId(season,stage,role){return `season_${season}_${stage}_${role}`;}
  function sqsPointKey(ctx,role,season,stage){return `${ctx.rivalryId}|${role}|${season}_${stage}`;}
  function sqsRead(key){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(key)||"[]");return Array.isArray(value)?value:[];}catch(_error){return [];}}
  function sqsWrite(key,list,max){try{if(typeof root.writeStorageValue==="function")root.writeStorageValue(key,JSON.stringify(list.slice(-max)));}catch(_error){}}
  function sqsWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}

  // ctx = {rivalryId, managerRole, season, stage, clubs, special, seasons, verdicts(k)}: does this screen run?
  function sqsApplies(ctx){
    if(!ctx)return false;
    if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
    if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10||!["pre","post"].includes(ctx.stage))return false;
    // The last season's "post" screen would set a squad no later screen uses.
    if(ctx.stage==="post"&&Number.isInteger(ctx.seasons)&&ctx.season>=ctx.seasons)return false;
    return Boolean(ctx.clubs&&ctx.clubs.playerOne&&ctx.clubs.playerTwo);
  }
  function sqsDoneKey(ctx){return `${ctx.rivalryId}|${ctx.season}|${ctx.stage}|${ctx.managerRole}`;}
  function sqsIsDone(ctx){return sqsRead(DONE_KEY).includes(sqsDoneKey(ctx));}
  function sqsMarkDone(ctx){sqsWrite(DONE_KEY,[...sqsRead(DONE_KEY).filter(item=>item!==sqsDoneKey(ctx)),sqsDoneKey(ctx)],DONE_MAX);return true;}

  async function sqsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
  // The rules, the screen, the club data, the shirts and crests, and the styles. false when they cannot load in time.
  async function sqsEnsure(){
    const loads=Promise.all([
      sqsLoad("fifa17-players","data/fifa17Players.js",()=>Boolean(root.CareerModeFifa17Players)),
      sqsLoad("roster-squads","data/rosterSquads.js",()=>Boolean(root.CareerModeRosterSquads)),
      sqsLoad("squad-sheet","js/squadSheet.js",()=>Boolean(root.CareerModeSquadSheet)),
      sqsLoad("squad-screen","js/squadScreen.js",()=>Boolean(root.CareerModeSquadScreen)),
      sqsLoad("visual-identity","js/visualIdentity.js",()=>typeof root.getClubCrestSvg==="function"),
      sqsLoad("kits17","js/kits17.js",()=>Boolean(root.CareerModeKits17)),
      typeof root.loadRuntimeStyle==="function"?Promise.resolve(root.loadRuntimeStyle("squad-screen","css/squadScreen.css")).then(()=>true,()=>true):true
    ]).then(list=>list.slice(0,4).every(Boolean),()=>false);// the shirts and crests are dressing: the screen works without them
    return Promise.race([loads,sqsWait(LOAD_WAIT_MS).then(()=>false)]);
  }

  // ---------- the stored document ----------
  const isInt=value=>Number.isInteger(value);
  const isList=(value,max,test)=>Array.isArray(value)&&value.length<=max&&value.every(test);
  // A stored document as this build reads it, or null. The Rules hold the shape; this is the same check on the client side,
  // so a document it cannot use is named, never half-used.
  function sqsParse(data,season,stage,role){
    if(!data||data.schemaVersion!==SCHEMA||data.objectType!==OBJECT_TYPE||data.seasonNumber!==season||data.stage!==stage||data.role!==role)return null;
    if(typeof data.formation!=="string"||!isList(data.names,LIST_MAX.names,v=>typeof v==="string")||data.names.length!==LIST_MAX.names)return null;
    if(!isList(data.numbers,LIST_MAX.names,isInt)||data.numbers.length!==LIST_MAX.names||!isList(data.signed,LIST_MAX.names,isInt)||data.signed.length!==LIST_MAX.names)return null;
    const outN=Array.isArray(data.outNames)?data.outNames.length:-1,ovN=Array.isArray(data.ovNames)?data.ovNames.length:-1;
    if(outN<0||outN>LIST_MAX.out||!["outNames","outReasons"].every(k=>isList(data[k],LIST_MAX.out,v=>typeof v==="string")&&data[k].length===outN)||!["outNumbers","outSigned","outSeasons"].every(k=>isList(data[k],LIST_MAX.out,isInt)&&data[k].length===outN))return null;
    if(ovN<0||ovN>LIST_MAX.ov||!isList(data.ovNames,LIST_MAX.ov,v=>typeof v==="string")||!["ovNumbers","ovSigned","ovValues"].every(k=>isList(data[k],LIST_MAX.ov,isInt)&&data[k].length===ovN))return null;
    const keep=["schemaVersion","objectType","rivalryId","seasonNumber","stage","role","formation","names","numbers","signed","outNames","outNumbers","outSigned","outReasons","outSeasons","ovNames","ovNumbers","ovSigned","ovValues","engine"];
    return Object.fromEntries(keep.map(k=>[k,Array.isArray(data[k])?data[k].slice():data[k]]));
  }
  // Kept documents: [key, data] (a locked screen) or [key, 0] (no document at a screen this manager already went past).
  function sqsKept(key){const found=sqsRead(KEPT_KEY).find(item=>Array.isArray(item)&&item[0]===key);return found?found[1]:undefined;}
  function sqsKeep(key,data){sqsWrite(KEPT_KEY,[...sqsRead(KEPT_KEY).filter(item=>!(Array.isArray(item)&&item[0]===key)),[key,data||0]],KEPT_MAX);}
  function sqsRef(io,season,stage,role){return io.sdk.doc(io.firestore,"rivalries",io.rivalryId,COLLECTION,sqsDocId(season,stage,role));}
  // One manager's document for one screen: the kept copy, else one transaction read (the production SDK has no getDoc).
  // {ok:true, data|null} or {ok:false, error}. past: a screen before the one on now (an empty answer is kept, it can't change).
  async function sqsGet(io,ctx,role,season,stage,past){
    const key=sqsPointKey(ctx,role,season,stage),kept=sqsKept(key);
    if(kept)return {ok:true,data:kept};
    if(kept===0&&past)return {ok:true,data:null};
    try{
      const ref=sqsRef(io,season,stage,role);
      const raw=await io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;});
      if(!raw){if(past)sqsKeep(key,0);return {ok:true,data:null};}
      const data=sqsParse(raw,season,stage,role);
      if(!data)return {ok:false,error:{code:"SQUAD_BAD_DOCUMENT"}};
      sqsKeep(key,data);return {ok:true,data};
    }catch(error){return {ok:false,error};}
  }
  // LOCK: one create. A document already there (this manager locked on another device, or the answer to an earlier tap was
  // lost) is read back and used: the tap is idempotent and nothing is overwritten (the Rules refuse updates anyway).
  async function sqsCreate(io,ctx,doc){
    const ref=sqsRef(io,ctx.season,ctx.stage,ctx.managerRole);
    const answer=await io.sdk.runTransaction(io.firestore,async tx=>{
      const snap=await tx.get(ref);
      if(snap.exists())return {existing:snap.data()};
      tx.set(ref,{...doc,lockedAt:io.sdk.serverTimestamp()});
      return {created:doc};
    });
    const data=answer.existing?sqsParse(answer.existing,ctx.season,ctx.stage,ctx.managerRole):answer.created;
    if(!data)return {ok:false,code:"SQUAD_BAD_DOCUMENT"};
    sqsKeep(sqsPointKey(ctx,ctx.managerRole,ctx.season,ctx.stage),data);
    return {ok:true,data,existing:Boolean(answer.existing)};
  }
  async function sqsSnapshotApi(io){
    const meter=root.CareerModeFirestoreBudget?.meterSdk||(s=>s);
    if(typeof io.sdk.onSnapshot==="function")return meter(io.sdk);
    const url=root.CareerModeProductionFirebaseRuntime?.firebaseFirestoreModule;
    if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url))return null;
    try{const module=await import(url);return module&&typeof module.onSnapshot==="function"&&typeof module.doc==="function"?meter(module):null;}catch(_error){return null;}
  }
  // Waits for the rival's locked "pre" document: a listener (a timed read when none is available), stopped while the page is
  // hidden and as soon as the document is in. onDoc(data) once; onError(error) on a refused or failed read.
  async function sqsWatch(io,ctx,onDoc,onError){
    const role=sqsOther(ctx.managerRole),key=sqsPointKey(ctx,role,ctx.season,"pre"),kept=sqsKept(key);
    if(kept){onDoc(kept);return ()=>{};}
    let stopped=false,stop=()=>{};
    const take=raw=>{if(stopped||!raw)return;const data=sqsParse(raw,ctx.season,"pre",role);if(!data){onError({code:"SQUAD_BAD_DOCUMENT"});return;}sqsKeep(key,data);stopped=true;try{stop();}catch(_error){}onDoc(data);};
    const api=await sqsSnapshotApi(io);
    if(api){
      const ref=api===io.sdk?sqsRef(io,ctx.season,"pre",role):api.doc(io.firestore,"rivalries",io.rivalryId,COLLECTION,sqsDocId(ctx.season,"pre",role));
      stop=api.onSnapshot(ref,{includeMetadataChanges:true},snap=>{if(snap.metadata?.fromCache)return;if(snap.exists())take(snap.data());},error=>{if(!stopped)onError(error);});
      return ()=>{stopped=true;try{stop();}catch(_error){}};
    }
    const doc=sqsDoc();
    void (async()=>{
      while(!stopped){
        if(!doc||doc.visibilityState!=="hidden"){
          const read=await sqsGet(io,ctx,role,ctx.season,"pre",false);
          if(stopped)return;
          if(!read.ok){onError(read.error);return;}
          if(read.data){take(read.data);return;}
        }
        await sqsWait(POLL_MS);
      }
    })();
    return ()=>{stopped=true;};
  }

  // ---------- the chain: events from the Transfer War history, then js/squadSheet.js replay ----------
  // Season k's events for one manager: his Roulette shot (the saved spin outcome), his signings the rival guessed, his kept
  // signings ({name, overall, position}).
  function sqsEvents(result,role){
    const rows=result&&result.verdicts&&Array.isArray(result.verdicts[role])?result.verdicts[role]:null;
    if(!rows)return null;
    const hit=result.hits&&result.hits[role];
    const shot=hit&&hit.fired===true&&typeof hit.hitName==="string"&&hit.hitName.trim()?{name:hit.hitName.trim(),number:isInt(hit.hitNumber)?hit.hitNumber:null,signedSeason:isInt(hit.hitSignedSeason)&&hit.hitSignedSeason>=1&&hit.hitSignedSeason<=10?hit.hitSignedSeason:null}:null;
    return {
      shot,
      released:rows.filter(r=>r&&r.release===true&&typeof r.name==="string"&&r.name.trim()).map(r=>r.name.trim()),
      kept:rows.filter(r=>r&&r.release===false&&typeof r.name==="string"&&r.name.trim()&&isInt(r.overall)).map(r=>({name:r.name.trim(),overall:r.overall,position:typeof r.position==="string"?r.position:null}))
    };
  }
  // Every season's events this screen's chain passes through: seasons before this one, and this one for "post".
  async function sqsHistory(ctx){
    const last=ctx.stage==="post"?ctx.season:ctx.season-1,results=[null];
    for(let k=1;k<=last;k+=1){
      let result=null;try{result=await ctx.verdicts(k);}catch(_error){result=null;}
      if(!result||result.ok!==true||!result.verdicts)return {ok:false,season:k};
      // A season whose spin mark lost its outcome (the mark is there, the shot is not): the shot is replayed from that
      // season's two locked squads and its Chamber Men cylinders (ctx.replayHits, the roulette engine), never guessed.
      const missing=ROLES.filter(role=>!result.hits||!result.hits[role]);
      if(missing.length){
        let replayed=null;try{replayed=typeof ctx.replayHits==="function"?await ctx.replayHits(k):null;}catch(_error){replayed=null;}
        if(!replayed||missing.some(role=>!replayed[role]))return {ok:false,season:k,reason:"SHOT"};
        result={...result,hits:{...(result.hits||{}),...Object.fromEntries(missing.map(role=>[role,replayed[role]]))}};
      }
      results.push(result);
    }
    return {ok:true,results};
  }
  // The screens before (season, stage), latest first.
  function sqsEarlier(season,stage){
    const out=[];
    let k=season,s=stage;
    for(;;){
      if(s==="post")s="pre";else{k-=1;s="post";}
      if(k<1)return out;
      out.push([k,s]);
    }
  }
  // One manager's sheet for one screen: the latest of his stored documents at or before it (kept or read), then the replay.
  // {ok:true, proposal, sheet, auto} (sheet: the locked one, else null) or {ok:false, reason, season}.
  async function sqsBuild(ctx,io,role,history){
    const S=sqsEngine(),events=history.results.map(r=>r?sqsEvents(r,role):null);
    if(events.slice(1).some(e=>!e))return {ok:false,reason:"VERDICTS"};
    const docs={};
    const here=await sqsGet(io,ctx,role,ctx.season,ctx.stage,false);
    if(!here.ok)return {ok:false,reason:"READ",error:here.error};
    if(here.data)docs[`${ctx.season}_${ctx.stage}`]=here.data;
    else for(const [k,s] of sqsEarlier(ctx.season,ctx.stage)){
      const read=await sqsGet(io,ctx,role,k,s,true);
      if(!read.ok)return {ok:false,reason:"READ",error:read.error};
      if(read.data){docs[`${k}_${s}`]=read.data;break;}
    }
    const out=S.replay({club:ctx.clubs[role],special:ctx.special,season:ctx.season,stage:ctx.stage,events,docs});
    if(out.error)return {ok:false,reason:out.error,season:out.season};
    return {ok:true,proposal:out.proposal,sheet:out.sheet,doc:here.data||null,auto:out.auto};
  }
  function sqsBoardOf(sheet){return {formation:sheet.formation,board:sqsEngine().board(sheet).map(row=>({...row,positions:row.positions.slice()}))};}
  // The rival's Roulette board from his locked "pre" document: rebuilt in full when this build can, else straight from the
  // document's names (the document is the authority: both phones read the same one).
  function sqsRivalBoard(ctx,history,data){
    const S=sqsEngine(),role=sqsOther(ctx.managerRole),events=history.results.map(r=>r?sqsEvents(r,role):null);
    const out=S.replay({club:ctx.clubs[role],special:ctx.special,season:ctx.season,stage:"pre",events,docs:{[`${ctx.season}_pre`]:data}});
    if(out.sheet)return sqsBoardOf(out.sheet);
    const rows=S.boardFromDoc(data,out.auto||null);
    return rows?{formation:data.formation,board:rows.map(row=>({...row,positions:row.positions.slice()}))}:null;
  }

  // ---------- the stage ----------
  function sqsEl(tag,className,text){const node=sqsDoc().createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function sqsRemove(){const node=sqsDoc()?.getElementById(STAGE_ID);if(node)node.remove();}
  let loading=null;
  function sqsLoadingOn(){
    const doc=sqsDoc(),el=doc&&doc.getElementById("loadingScreen");if(!el||loading)return;
    const text=doc.getElementById("loadingText"),prior=text?text.textContent:"";
    el.classList.remove("is-exiting","hidden");el.hidden=false;el.removeAttribute("aria-hidden");el.setAttribute("aria-busy","true");
    if(text)text.textContent="LOADING YOUR SQUAD";
    loading={el,text,prior};
  }
  function sqsLoadingOff(){
    const shown=loading;loading=null;if(!shown)return;
    shown.el.setAttribute("aria-hidden","true");shown.el.setAttribute("aria-busy","false");shown.el.classList.add("is-exiting");
    root.setTimeout(()=>{if(loading)return;shown.el.hidden=true;shown.el.classList.add("hidden");if(shown.text)shown.text.textContent=shown.prior;},240);
  }
  function sqsClose(){sqsRemove();sqsLoadingOff();return true;}
  // The back button is .sqBack, never .backButton: the app's smart back (js/screens.js) takes every .backButton click first.
  function sqsShell(ctx,label){
    const doc=sqsDoc();sqsRemove();
    const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label",label);stage.dataset.stage=ctx.stage;
    const shell=sqsEl("div","sqShell"),header=sqsEl("div","sqHeader");
    header.append(sqsEl("span","",`Season ${ctx.season}`),sqsEl("h2","sqTitle","Squad Management"),sqsEl("span","sqWhen",STAGE_WORD[ctx.stage]));
    const status=sqsEl("p","sqStatus");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
    shell.append(header,status);stage.append(shell);
    return {stage,shell,status};
  }
  // A fault: TRY AGAIN or Showdown Home, on the stage itself.
  function sqsAsk(ctx,lines){
    return new Promise(resolve=>{
      sqsLoadingOff();
      const {stage,shell,status}=sqsShell(ctx,"Squad Management could not load");
      const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(lines.error);
      status.textContent=quota||lines.text;
      const actions=sqsEl("div","sqActions");
      const retry=sqsEl("button","menuButton sqRetry","TRY AGAIN");retry.type="button";retry.addEventListener("click",()=>{retry.disabled=true;resolve("retry");});
      const back=sqsEl("button","sqBack","BACK TO SHOWDOWN HOME");back.type="button";back.addEventListener("click",()=>{back.disabled=true;resolve("back");});
      actions.append(retry,back);shell.append(actions);sqsDoc().body.append(stage);
    });
  }
  function sqsReadText(built){
    if(built.reason==="SHOT")return `Season ${built.season||""}'s roulette shot was not saved and could not be replayed from that season's squads and Chamber Men. Check the connection and try again.`.replace("  "," ");
    if(built.reason==="VERDICTS")return `Season ${built.season||""} Transfer War verdicts could not be read, and your squad is built from them. Check the connection and try again.`.replace("  "," ");
    if(built.reason==="READ")return "Your squad could not be read. Check the connection and try again. Nothing was changed.";
    return "Your squad could not be built from what is saved. Nothing was changed. Try again, or go back to Showdown Home.";
  }

  // The draft: this phone's moves on this screen until LOCK (the sheet is rebuilt from the proposal and these moves).
  function sqsDraftKey(ctx){return `${ctx.rivalryId}|${ctx.managerRole}|${ctx.season}_${ctx.stage}`;}
  function sqsDraft(ctx){
    const key=sqsDraftKey(ctx);
    return {
      read(){const found=sqsRead(DRAFT_KEY).find(item=>Array.isArray(item)&&item[0]===key);return found&&Array.isArray(found[1])?found[1]:[];},
      write(ops){sqsWrite(DRAFT_KEY,[...sqsRead(DRAFT_KEY).filter(item=>!(Array.isArray(item)&&item[0]===key)),[key,ops]],DRAFT_MAX);}
    };
  }
  function sqsDropDraft(ctx){const key=sqsDraftKey(ctx);sqsWrite(DRAFT_KEY,sqsRead(DRAFT_KEY).filter(item=>!(Array.isArray(item)&&item[0]===key)),DRAFT_MAX);}

  // The screen: editable until LOCK, then (before the Roulette) waiting for the rival's lock; NEXT goes on.
  // Resolves "next", "back" or {retry, text, error} (a fault after the screen showed: the caller asks TRY AGAIN).
  function sqsScreen(ctx,io,history,built){
    return new Promise(resolve=>{
      const S=sqsEngine(),Screen=root.CareerModeSquadScreen,rival=sqsOther(ctx.managerRole),rivalName=NAMES[rival];
      const {stage,shell,status}=sqsShell(ctx,"Squad Management");
      const host=sqsEl("div","sqHost"),actions=sqsEl("div","sqActions");
      const next=sqsEl("button","menuButton sqNext",NEXT_WORD[ctx.stage]);next.type="button";next.hidden=true;next.disabled=true;
      const back=sqsEl("button","sqBack","BACK TO SHOWDOWN HOME");back.type="button";
      actions.append(next,back);shell.append(host,actions);
      let stopWatch=null,done=false;
      const finish=answer=>{if(done)return;done=true;try{stopWatch?.();}catch(_error){}resolve(answer);};
      back.addEventListener("click",()=>{back.disabled=true;finish("back");});
      // After NEXT the stage stays up (no flash) until the next screen is on top of it; it says so to assistive tech and tests.
      next.addEventListener("click",()=>{if(next.disabled)return;next.disabled=true;stage.dataset.state="leaving";stage.setAttribute("aria-hidden","true");finish("next");});
      const say=text=>{status.textContent=text;};
      const ready=sheets=>{
        if(sheets)boardsMemo.set(`${ctx.rivalryId}|${ctx.season}`,sheets);
        next.hidden=false;next.disabled=false;
        // The way on sits under the squad: bring it into view (the page scrolls; nothing is hidden).
        try{next.scrollIntoView({block:"nearest",behavior:"smooth"});}catch(_error){}
        say(ctx.stage==="pre"?`Both squads are locked. ${rivalName}'s squad shows on the Russian Roulette board.`:"Your squad is locked for next season.");
      };
      const afterLock=data=>{
        sqsDropDraft(ctx);
        if(ctx.stage!=="pre"){ready(null);return;}
        say(`Your squad is locked. Waiting for ${rivalName} to lock his squad.`);
        void sqsWatch(io,ctx,rivalData=>{
          if(done)return;
          const own=sqsBuildLocked(ctx,history,data),theirs=sqsRivalBoard(ctx,history,rivalData);
          if(!own||!theirs){finish({retry:true,text:"The two squads could not be put on the Roulette board. Nothing was spun. Try again."});return;}
          ready({[ctx.managerRole]:own,[rival]:theirs});
        },error=>{if(!done)finish({retry:true,text:`${rivalName}'s squad could not be read. Check the connection and try again.`,error});}).then(stop=>{if(done)stop();else stopWatch=stop;});
      };
      const sheet=built.sheet||built.proposal;
      const mounted=Screen.mount(host,{sheet,club:ctx.clubs[ctx.managerRole],rival:ctx.clubs[rival],locked:Boolean(built.sheet),draft:built.sheet?null:sqsDraft(ctx),
        onLock:async locked=>{
          const doc={...S.toDoc(locked),schemaVersion:SCHEMA,objectType:OBJECT_TYPE,rivalryId:ctx.rivalryId,seasonNumber:ctx.season,stage:ctx.stage,role:ctx.managerRole};
          let result;
          try{result=await sqsCreate(io,ctx,doc);}catch(error){result={ok:false,error};}
          if(!result.ok){const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(result.error);return {ok:false,reason:quota||"Couldn't save your squad. Check the connection and try again."};}
          // Locked on another device first: that squad stands, and the screen shows it.
          if(result.existing){finish({reload:true});return {ok:true,reason:"Your squad was already locked on another device."};}
          afterLock(result.data);
          return {ok:true,reason:"Squad locked."};
        }});
      if(!mounted){finish({retry:true,text:"The squad screen could not load. Try again."});return;}
      sqsDoc().body.append(stage);sqsLoadingOff();
      if(built.sheet)afterLock(built.doc);
      else say(ctx.stage==="pre"?`Set your squad for Season ${ctx.season}, then lock it. Your XI and subs 1-4 go on the Russian Roulette board. ${rivalName} can't see it here.`:"Your kept signings are in and the Roulette's shot has left. Set your squad, then lock it.");
    });
  }
  // This manager's own Roulette board from his locked document (the same rebuild the rival's phone makes of it).
  function sqsBuildLocked(ctx,history,data){
    const S=sqsEngine(),role=ctx.managerRole,events=history.results.map(r=>r?sqsEvents(r,role):null);
    const out=S.replay({club:ctx.clubs[role],special:ctx.special,season:ctx.season,stage:ctx.stage,events,docs:{[`${ctx.season}_${ctx.stage}`]:data}});
    if(out.sheet)return sqsBoardOf(out.sheet);
    const rows=S.boardFromDoc(data,out.auto||null);
    return rows?{formation:data.formation,board:rows.map(row=>({...row,positions:row.positions.slice()}))}:null;
  }

  // r91: the Transfer War's player list (js/playerSearch.js fetches and parses it at idle, the worker keeps it) starts loading
  // while the managers set their squads, so the name search is ready when the Transfer War opens. Nothing waits on it.
  function sqsWarmPlayerList(){try{if(typeof root.ensureTransferPlayerList==="function")root.ensureTransferPlayerList(null);}catch(error){}}
  async function sqsRunNow(ctx,io){
    if(!sqsApplies(ctx))return true;
    // Seen to the end on this phone (locked, and before the Roulette both locked): straight on. The Roulette still gets both
    // boards from the kept documents (boards()).
    if(sqsIsDone(ctx))return true;
    for(;;){
      sqsLoadingOn();
      let answer;
      if(!await sqsEnsure())answer={retry:true,text:"The squad screen could not load. Check the connection and try again."};
      else{
        const history=await sqsHistory(ctx);
        const built=history.ok?await sqsBuild(ctx,io,ctx.managerRole,history):{ok:false,reason:history.reason==="SHOT"?"SHOT":"VERDICTS",season:history.season};
        if(!built.ok)answer={retry:true,text:sqsReadText(built),error:built.error};
        // After the Transfer War nobody waits for anyone: a squad already locked (on another device) is simply kept.
        else if(built.sheet&&ctx.stage==="post"){sqsMarkDone(ctx);return true;}
        else{if(ctx.stage==="pre")sqsWarmPlayerList();answer=await sqsScreen(ctx,io,history,built);}
      }
      if(answer==="next"){sqsMarkDone(ctx);return true;}
      if(answer==="back"){wentHome=true;return false;}
      if(answer&&answer.reload)continue;
      const choice=await sqsAsk(ctx,answer||{text:"Something went wrong. Try again."});
      if(choice==="back"){wentHome=true;return false;}
    }
  }
  // Resolves true when the next screen may open, false when the manager went back to Showdown Home (the caller then keeps the
  // next screen shut). Never rejects. The stage stays up until close(), so nothing flashes between it and the next screen.
  function sqsRun(ctx,io){
    if(running)return running;
    wentHome=false;
    running=sqsRunNow(ctx,io).catch(()=>false).then(go=>{
      if(!go){sqsClose();if(wentHome&&typeof root.navigateTo==="function")return Promise.resolve().then(()=>root.navigateTo("mainMenu")).catch(()=>{}).then(()=>go);}
      return go;
    }).finally(()=>{running=null;});
    return running;
  }
  // Both locked "pre" boards for this season's Roulette: {ok:true, sheets} from this phone's memory or kept documents, else
  // reads; {ok:false, reason} when either manager has not locked yet (the Roulette never spins on a guessed board).
  async function sqsBoards(ctx,io){
    const memo=boardsMemo.get(`${ctx.rivalryId}|${ctx.season}`);if(memo)return {ok:true,sheets:memo};
    if(!await sqsEnsure())return {ok:false,reason:"NOT_LOADED"};
    const pre={...ctx,stage:"pre"},history=await sqsHistory(pre);
    if(!history.ok)return {ok:false,reason:history.reason==="SHOT"?"SHOT":"VERDICTS"};
    const sheets={};
    for(const role of ROLES){
      const read=await sqsGet(io,pre,role,ctx.season,"pre",false);
      if(!read.ok)return {ok:false,reason:"READ",error:read.error};
      if(!read.data)return {ok:false,reason:"NOT_LOCKED",role};
      const board=role===ctx.managerRole?sqsBuildLocked(pre,history,read.data):sqsRivalBoard(pre,history,read.data);
      if(!board)return {ok:false,reason:"BAD_DOCUMENT",role};
      sheets[role]=board;
    }
    boardsMemo.set(`${ctx.rivalryId}|${ctx.season}`,sheets);
    return {ok:true,sheets};
  }

  // ---------- the Touchline Gazette's squad news (Nik 2026-11-11: reported overalls and departures feed the Gazette) ----------
  // Season N's paper tells what changed in both managers' squads since the paper before: season N's two "pre" sheets against
  // season N-1's (the cumulative lists, so a departure or overall set on the post screen after the last Transfer War is told
  // here too). Only "pre" sheets: both are on both phones before the Russian Roulette, so both papers say the same; the
  // rival's "post" sheet may not exist yet when the paper prints. Read from this phone's kept copies only (no read, no
  // write): null when one is missing. The paper asks gazetteEnsure (below) first, so a phone that lacks one has it read
  // before it prints. Season 1 has none (no departures).
  function sqsIdOf(name,number,signed){return `${name}|${isInt(number)&&number>=0?number:""}|${isInt(signed)&&signed>0?signed:""}`;}
  function sqsSheetFacts(data){
    const out=new Map(),ov=new Map();
    for(let i=0;i<data.outNames.length;i+=1)out.set(sqsIdOf(data.outNames[i],data.outNumbers[i],data.outSigned[i]),{name:data.outNames[i],reason:data.outReasons[i],season:data.outSeasons[i]});
    for(let i=0;i<data.ovNames.length;i+=1)ov.set(sqsIdOf(data.ovNames[i],data.ovNumbers[i],data.ovSigned[i]),{name:data.ovNames[i],value:data.ovValues[i]});
    return {out,ov};
  }
  function sqsGazetteNews({rivalryId,season}={}){
    if(typeof rivalryId!=="string"||!rivalryId||!isInt(season)||season<2||season>10)return null;
    const ctx={rivalryId},news={};
    for(const role of ROLES){
      const now=sqsKept(sqsPointKey(ctx,role,season,"pre")),before=sqsKept(sqsPointKey(ctx,role,season-1,"pre"));
      if(!now||!before)return null;
      const a=sqsSheetFacts(now),b=sqsSheetFacts(before);
      // a loan that ended comes back (its old entry stays in the list): only departures new since the last paper
      const left=[...a.out].filter(([id])=>!b.out.has(id)).map(([,o])=>({name:o.name,reason:o.reason}));
      const gone=new Set([...a.out].filter(([,o])=>o.reason!=="loaned"||o.season===season).map(([id])=>id));
      const rated=[...a.ov].filter(([id,o])=>!gone.has(id)&&(!b.ov.has(id)||b.ov.get(id).value!==o.value)).map(([,o])=>({name:o.name,value:o.value}));
      news[role]={left,rated};
    }
    return Object.freeze(news);
  }
  // Keeps the sheets the paper needs on this phone (season N-1 and N "pre", both managers): a kept copy costs nothing, so
  // this reads only on a phone that never saw one (a new device mid-Showdown). Never holds up or fails a screen.
  // Review of #1390 (Nik: "not synced"): the paper itself asks for the sheets it needs (season N-1 and N "pre", both managers)
  // before it prints, so a phone that never kept one (a new device, cleared storage, a lost warm above) tells the same squad
  // news as the other phone. Kept copies cost nothing: a phone that has them reads nothing; one that lacks them reads the
  // missing ones once (at most 4 transaction reads, each kept, an empty answer too: both "pre" screens are long past when a
  // paper prints). true when this phone now has what the other phone has, false when a read could not be made.
  async function sqsGazetteEnsure({rivalryId,season}={}){
    if(typeof rivalryId!=="string"||!/^pair_[0-9a-f]{64}$/.test(rivalryId)||!isInt(season)||season<2||season>10)return true;
    const ctx={rivalryId},need=[];
    for(const k of [season-1,season])for(const role of ROLES)if(sqsKept(sqsPointKey(ctx,role,k,"pre"))===undefined)need.push([k,role]);
    if(!need.length)return true;
    try{
      const runtime=root.CareerModeProductionFirebaseRuntime;
      if(!runtime||typeof runtime.ensureAccountServices!=="function")return false;
      const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
      if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)return false;
      const io={firestore:services.firestore,sdk:services.firestoreSdk,rivalryId};
      // G1 (2.4.0 hunt): the missing sheets are read at the same time, not one after another, so a phone that lost its kept
      // copies fits the paper's 4 s wait (js/touchlineGazette.js SQUAD_CAP_MS) like the other phone. Same reads, same count.
      const reads=await Promise.all(need.map(([k,role])=>sqsGet(io,ctx,role,k,"pre",true)));
      return reads.every(read=>read.ok);
    }catch(_error){return false;}
  }
  async function sqsGazetteWarm(ctx,io){
    try{
      for(const k of [ctx.season-1,ctx.season])if(k>=1)for(const role of ROLES)await sqsGet(io,{rivalryId:ctx.rivalryId},role,k,"pre",true);
    }catch(_error){}
    return true;
  }

  return Object.freeze({contractVersion:1,feature:"cms-squad-management-step",stageId:STAGE_ID,collection:COLLECTION,keptKey:KEPT_KEY,doneKey:DONE_KEY,
    applies:sqsApplies,ensure:sqsEnsure,run:sqsRun,boards:sqsBoards,history:sqsHistory,close:sqsClose,isDone:sqsIsDone,markDone:sqsMarkDone,wentHome:()=>wentHome,
    events:sqsEvents,parse:sqsParse,gazetteNews:sqsGazetteNews,gazetteWarm:sqsGazetteWarm,gazetteEnsure:sqsGazetteEnsure,docId:sqsDocId,store:Object.freeze({get:sqsGet,create:sqsCreate,watch:sqsWatch})});
});
