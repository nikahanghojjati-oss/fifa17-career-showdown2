(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeIconGuessStep=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Prime Pack, the season step (Nik 2026-10-31, renamed and moved to r87 on 2026-11-01; spec
  // project-documents/r88-icon-guess/R88_ICON_GUESS_FEATURE_SPEC.md). Once a season, right after Roster Roulette and before the
  // Transfer Challenge opens, both phones show one masked Icon card (the stand-in page visual-assets/v10_1/icon-guess, Team V's
  // art later) and reveal it in four stages (Nik 2026-11-01): the position and one seeded stat, then one more stat per stage.
  // Each manager has two guesses; the first right one the server records wins 4, 3, 2 or 1 Showdown points by its stage (the
  // sparse primePack result key, season maximum 15). Nobody by the end of stage 4 is a draw and the whole card is shown.
  // Old Showdowns never play it (js/iconGuess.js eligible, the same boundary as Roster Roulette).
  //
  // What the phones share is one small record, rivalries/{rid}/primePackRounds/season_N (Rules: the season-results fragment):
  // each arrival (server time), each manager's used guesses and namedBy (the winner). The start is the later arrival + 3 s, so both
  // phones count in together and every stage follows from the server clock the Transfer Challenge already keeps (a reload
  // lands on the current stage). Fair first guess: guesses are transactions on this one record, so the server orders them;
  // the first right one to commit sets namedBy and every later write is refused. Its stage, and so its points, comes from
  // that write's server time (updatedAt), never from a phone clock, and the Rules check the result against it. Which icon it is comes from the Showdown id (no read, never stored); whether a guess is
  // right is decided here, and the record only says who won. Wrong guesses are never stored: the other phone sees only
  // the chip count drop.
  //
  // Reads: one listener on the round record while the screen is open (each change is one read: two arrivals, up to four
  // guesses), one transaction read per write. A Showdown the game does not apply to costs nothing.
  //
  // The file names keep the working name (iconGuess*, icon-guess) so the three reviewed parts stay where they were reviewed;
  // everything a player sees says Prime Pack.
  const PAGE="visual-assets/v10_1/icon-guess/index.html";
  const STAGE_ID="igStage",PANEL_ID="igStepPanel",COLLECTION="primePackRounds";
  const DONE_KEY="careerModeShowdown.primePackDone.v1",KEYS_MAX=60;
  const LOAD_WAIT_MS=10000,READY_WAIT_MS=10000,TICK_MS=200,POLL_MS=2500,REJOIN_MS=3000;
  const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const wonMemo=new Map();
  // wentHome: the last run ended because the manager chose Showdown Home (not a fault), so the caller shows no error.
  let running=null,wentHome=false;

  function igsDoc(){return root.document||null;}
  function igsWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
  function igsOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function igsKey(ctx){return `${ctx.rivalryId}|${ctx.season}|${ctx.managerRole}`;}
  function igsSeasonId(season){return `season_${season}`;}
  function igsList(key){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(key)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];}catch(_error){return [];}}
  function igsMark(key,item){try{const list=igsList(key).filter(value=>value!==item);list.push(item);if(typeof root.writeStorageValue==="function")root.writeStorageValue(key,JSON.stringify(list.slice(-KEYS_MAX)));}catch(_error){}}
  async function igsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
  // The round logic, the matcher and the list. false when any of them cannot load in time.
  async function igsEnsure(){
    const loads=Promise.all([
      igsLoad("icon-guess","js/iconGuess.js",()=>Boolean(root.CareerModeIconGuess)),
      igsLoad("icon-list","data/icons.js",()=>Boolean(root.CareerModeIcons)),
      igsLoad("icon-names","js/iconNames.js",()=>Boolean(root.CareerModeIconNames))
    ]).then(list=>list.every(Boolean),()=>false);
    return Promise.race([loads,igsWait(LOAD_WAIT_MS).then(()=>false)]);
  }
  function igsGuess(){return root.CareerModeIconGuess||(typeof require==="function"?require("./iconGuess.js"):null);}

  // ctx = {rivalryId, managerRole, season, confirmedAtMs}. Does this Showdown play Prime Pack this season? It needs
  // js/iconGuess.js: a browser caller awaits ensure() first (before it, the answer is always false).
  function igsApplies(ctx){
    if(root.CMS_PRIME_PACK==="off"||!ctx)return false;
    if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
    if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
    const guess=igsGuess();
    return Boolean(guess&&guess.eligible(ctx.rivalryId,ctx.confirmedAtMs));
  }

  // ---------- the record: Firestore <-> js/iconGuess.js ----------
  function igsMillis(value){if(value&&typeof value.toMillis==="function"){const ms=value.toMillis();return Number.isFinite(ms)?ms:null;}return null;}
  // The stored document as the round logic's record. The winner's beat and time come from the winning write (no later write
  // is allowed once there is a winner, so updatedAt is that write's server time).
  function igsRecord(data,season){
    const guess=igsGuess();
    if(!data||data.objectType!=="sharedPrimePackRound"||data.seasonNumber!==season)return null;
    const arrived={playerOne:igsMillis(data.arrived?.playerOne),playerTwo:igsMillis(data.arrived?.playerTwo)};
    let winner=null;
    if(ROLES.includes(data.namedBy)){
      const atMs=igsMillis(data.updatedAt),startMs=arrived.playerOne&&arrived.playerTwo?Math.max(arrived.playerOne,arrived.playerTwo)+guess.leadMs:null;
      const at=startMs&&atMs?guess.beatAt(startMs,atMs):null;
      winner={role:data.namedBy,beat:at&&at.beat>=0?Math.min(at.beat,guess.lastBeat):0,atMs:atMs||1};
    }
    const record={v:1,season,arrived,chipsUsed:{playerOne:data.chipsUsed?.playerOne,playerTwo:data.chipsUsed?.playerTwo},winner};
    return guess.outcome(record,0)?record:null;
  }
  function igsRef(io,season){return io.sdk.doc(io.firestore,"rivalries",io.rivalryId,COLLECTION,igsSeasonId(season));}
  function igsStamp(io){return {activeSessionId:io.sessionId,updatedByDeviceId:io.deviceId,updatedAt:io.sdk.serverTimestamp()};}
  // This manager is on the screen: his arrival is written once (the first one stands; a reload never moves the start).
  async function igsArrive(io,ctx){
    const ref=igsRef(io,ctx.season),me=ctx.managerRole;
    return io.sdk.runTransaction(io.firestore,async tx=>{
      const snap=await tx.get(ref),data=snap.exists()?snap.data():null;
      if(!data){
        tx.set(ref,{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:io.rivalryId,seasonNumber:ctx.season,
          arrived:{[me]:io.sdk.serverTimestamp(),[igsOther(me)]:null},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:1,...igsStamp(io)});
        return "created";
      }
      if(data.arrived&&data.arrived[me]===null&&data.namedBy===null){tx.update(ref,{[`arrived.${me}`]:io.sdk.serverTimestamp(),revision:data.revision+1,...igsStamp(io)});return "arrived";}
      return "already";
    });
  }
  // Leaving (BACK, or the phone hidden) before the other manager has arrived withdraws this arrival (Fable F12-02), so the
  // round can never start while this manager is away; coming back arrives again. Once both have arrived it stays.
  async function igsLeave(io,ctx){
    const ref=igsRef(io,ctx.season),me=ctx.managerRole;
    return io.sdk.runTransaction(io.firestore,async tx=>{
      const snap=await tx.get(ref),data=snap.exists()?snap.data():null;
      if(data&&data.arrived&&data.arrived[me]!=null&&data.arrived[igsOther(me)]===null&&data.namedBy===null){tx.update(ref,{[`arrived.${me}`]:null,revision:data.revision+1,...igsStamp(io)});return "left";}
      return "stays";
    });
  }
  // Arrive and leave run one after the other, in the order they were asked for (a quick hide and show never leaves a
  // withdrawn arrival behind).
  let igsPresenceChain=Promise.resolve();
  function igsPresence(task){const run=igsPresenceChain.then(task,task);igsPresenceChain=run.catch(()=>{});return run;}
  // One matched guess: this manager's used guesses +1, and the winner when it is right, on the latest record.
  async function igsApplyGuess(io,ctx,correct){
    const ref=igsRef(io,ctx.season),guess=igsGuess();
    return io.sdk.runTransaction(io.firestore,async tx=>{
      const snap=await tx.get(ref),data=snap.exists()?snap.data():null,record=igsRecord(data,ctx.season);
      if(!record)return {ok:false,reason:"BAD_RECORD"};
      const next=guess.applyGuess(record,{role:ctx.managerRole,correct,atMs:io.now()});
      if(!next.ok)return next;
      tx.update(ref,{[`chipsUsed.${ctx.managerRole}`]:next.record.chipsUsed[ctx.managerRole],namedBy:correct?ctx.managerRole:null,revision:data.revision+1,...igsStamp(io)});
      return next;
    });
  }
  // The listener on the round record (counted by the read meter); a timed transaction read when no listener is available.
  async function igsSnapshotApi(io){
    const meter=root.CareerModeFirestoreBudget?.meterSdk||(s=>s);
    if(typeof io.sdk.onSnapshot==="function")return meter(io.sdk);
    const url=root.CareerModeProductionFirebaseRuntime?.firebaseFirestoreModule;
    if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url))return null;
    try{const module=await import(url);return module&&typeof module.onSnapshot==="function"&&typeof module.doc==="function"?meter(module):null;}catch(_error){return null;}
  }
  async function igsWatch(io,ctx,onData,onError){
    const api=await igsSnapshotApi(io),ref=igsRef(io,ctx.season);
    if(api){
      const listenRef=api===io.sdk?ref:api.doc(io.firestore,"rivalries",io.rivalryId,COLLECTION,igsSeasonId(ctx.season));
      return api.onSnapshot(listenRef,{includeMetadataChanges:true},snap=>{if(snap.metadata?.hasPendingWrites||snap.metadata?.fromCache)return;onData(snap.exists()?snap.data():null);},onError);
    }
    let stopped=false;
    const poll=async()=>{while(!stopped){try{const data=await io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;});if(!stopped)onData(data);}catch(error){if(!stopped)onError(error);return;}await igsWait(POLL_MS);}};
    void poll();
    return ()=>{stopped=true;};
  }

  // How many Prime Pack points this manager won this season (0, or 4 to 1 by stage). Read by the season results before they
  // are published, so the points go in as primePack:N (the Rules check N against the round record). io = {firestore, sdk,
  // rivalryId}. One read, once per season, only for a Showdown the game applies to.
  async function igsPointsFor(io,ctx){
    if(!igsApplies(ctx))return 0;
    const key=igsKey(ctx);if(wonMemo.has(key))return wonMemo.get(key);
    const ref=igsRef(io,ctx.season);
    const data=await io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;});
    const record=igsRecord(data,ctx.season);
    const points=record&&record.winner?igsGuess().points(record)[ctx.managerRole]:0;
    if(record&&record.winner)wonMemo.set(key,points);
    return points;
  }

  // ---------- the screen ----------
  function igsEl(tag,className,text){const node=igsDoc().createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function igsRemove(id){const node=igsDoc()?.getElementById(id);if(node)node.remove();}
  function igsClose(){igsRemove(PANEL_ID);igsRemove(STAGE_ID);}
  // A plain choice card over the stage (the same look as the roulette's step panel when its styles are loaded).
  function igsAsk({heading,lines=[],buttons}){
    return new Promise(resolve=>{
      igsRemove(PANEL_ID);
      const overlay=igsEl("div","remoteJoiningOverlay rrStepOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label",heading);
      overlay.style.cssText="position:fixed;inset:0;z-index:96;display:flex;align-items:center;justify-content:center;background:#050403;padding:16px";
      const shell=igsEl("div","remoteJoiningShell rrStepShell");shell.style.cssText="max-width:420px;width:100%;background:#15130f;color:#f3ead7;border:1px solid #6b5a33;border-radius:12px;padding:20px";
      shell.append(igsEl("strong","","PRIME PACK"),igsEl("h2","rrStepTitle",heading));
      for(const line of lines)shell.append(igsEl("p","rrStepLine",line));
      const row=igsEl("div","rrStepActions");row.style.cssText="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px";
      for(const b of buttons){const button=igsEl("button",b.primary?"menuButton rrStepPrimary":"backButton",b.label);button.type="button";button.addEventListener("click",()=>{igsRemove(PANEL_ID);resolve(b.id);});row.append(button);}
      shell.append(row);overlay.append(shell);igsDoc().body.append(overlay);row.querySelector("button")?.focus();
    });
  }
  function igsStage(){
    const doc=igsDoc();igsRemove(STAGE_ID);
    const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Prime Pack");
    stage.style.cssText="position:fixed;inset:0;z-index:95;background:#050403";
    const frame=doc.createElement("iframe");frame.title="Prime Pack";
    const base=typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(PAGE):PAGE;
    frame.src=`${base}${base.includes("?")?"&":"?"}embed=1`;
    frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#050403";
    // Leaving while the other manager has not arrived (the window then stays shut; tapping the button again comes back here).
    const back=doc.createElement("button");back.type="button";back.className="backButton";back.textContent="BACK TO SHOWDOWN HOME";back.hidden=true;
    back.style.cssText="position:absolute;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2";
    stage.append(frame,back);doc.body.append(stage);
    // The roulette's result panel (z-index 96) stays over this stage until the Prime Pack page is ready (Reus Gate, Fable
    // F13-07: a slow page never shows a plain dark screen); igsPlay closes it on cms-ig-ready, or when the step fails.
    return {stage,frame,back};
  }
  function igsPost(frame,type,data={}){try{frame.contentWindow?.postMessage({type,...data},root.location?.origin||"*");}catch(_error){}}
  // What the page needs for this season's card. The name and overall go with it (the page never shows them before the
  // result: N2); the manager names are fixed, Daniel is playerOne.
  function igsRound(ctx){
    const guess=igsGuess(),list=root.CareerModeIcons,players=list&&list.players;
    const draw=players&&guess.draw(ctx.rivalryId,ctx.season,players.length,list.listVersion);
    const icon=draw&&players[draw.index];
    if(!icon)return null;
    const source=`${String(icon.cardVersion||"").toUpperCase()} · ${icon.game}`;
    return {answerId:icon.id,round:{me:ctx.managerRole,names:{...NAMES},stages:guess.stages,position:icon.position,overall:icon.overall,name:icon.name,
      stats:{...icon.stats},statOrder:[...draw.statOrder],stagePoints:[...guess.stagePoints],nation:icon.nationCode,source}};
  }
  // A suggestion shows the card name, or the full name when two icons share that card name (typing it alone is ambiguous).
  function igsSuggestions(index,text){
    const names=root.CareerModeIconNames;
    return names.suggest(index,text).map(s=>{const m=names.match(index,s.name);return m.status==="ambiguous"?s.fullName:s.name;});
  }

  // Runs this season's Prime Pack for this manager. io = {firestore, sdk (doc, runTransaction, serverTimestamp, onSnapshot?),
  // rivalryId, sessionId, deviceId, now() (server time)}. Resolves true when the Transfer Challenge may open (the round is over
  // and this manager pressed Continue, or the game does not apply), false when he went back to Showdown Home or the step
  // could not run (the window then stays shut and the dashboard says why; tapping again retries).
  async function igsRun(ctx,io){
    if(running)return running;
    wentHome=false;
    // On true the stage stays up until the Transfer Challenge is on screen (the caller closes it), so nothing flashes between.
    running=igsRunNow(ctx,io).then(go=>{if(!go)igsClose();return go;},error=>{igsClose();throw error;}).finally(()=>{running=null;});
    return running;
  }
  async function igsRunNow(ctx,io){
    if(!igsApplies(ctx))return true;
    if(!await igsEnsure())return false;
    // This phone already saw this season's result and pressed Continue: straight on to the Transfer Challenge.
    if(igsList(DONE_KEY).includes(igsKey(ctx)))return true;
    const index=root.CareerModeIconNames.defaultIndex(),pick=igsRound(ctx),guess=igsGuess();
    if(!index||!pick)return false;
    for(;;){
      const result=await igsPlay(ctx,io,{index,pick,guess});
      if(result==="continue"){igsMark(DONE_KEY,igsKey(ctx));return true;}
      if(result==="back"){wentHome=true;return false;}
      const choice=await igsAsk({heading:"Prime Pack could not load",lines:[root.CareerModeFirestoreBudget?.quotaMessage?.(result)||"Check the connection and try again."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
      if(choice==="back"){wentHome=true;return false;}
    }
  }
  // One screen session: "continue", "back", or an error object.
  function igsPlay(ctx,io,{index,pick,guess}){
    return new Promise(resolve=>{
      const me=ctx.managerRole,other=igsOther(me);
      const {frame,back}=igsStage();
      // resultShown: the result on screen as "winner:points" (or "draw:0"); it follows the server's record, so a winner that
      // lands after a shown draw (the Rules' 2 s slack) replaces it (Fable F12-03).
      let record=null,ready=false,stop=null,timer=null,shownBeat=-2,finished=false,resultShown="",sentChips={playerOne:null,playerTwo:null};
      // After this phone's right guess: the round record as the server stamped it (its updatedAt gives the stage and points).
      const readBack=()=>io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(igsRef(io,ctx.season));return snap.exists()?snap.data():null;}).then(data=>onData(data),()=>{});
      const end=value=>{if(finished)return;finished=true;root.clearInterval(timer);root.removeEventListener("message",onMessage);igsDoc().removeEventListener?.("visibilitychange",onVisibility);try{stop&&stop();}catch(_error){}resolve(value);};
      // Away while the other manager has not arrived: withdraw (igsLeave); back on screen: arrive again.
      // rejoinedAt: when this phone last sent its arrival again (Fable F13-02), at most once every REJOIN_MS.
      let away=false,rejoinedAt=-Infinity;
      const leave=()=>igsPresence(()=>igsLeave(io,ctx)).catch(error=>{root.CareerModeFirestoreBudget?.noteError?.(error);});
      const closeRoulette=()=>{try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}};
      // Fable F13-03: back on screen after a lock, the phone's clock may have stood still: take a fresh server time and send
      // the current stage and chips again, so the page never shows stage 2 while the server scores stage 3.
      const resend=()=>{shownBeat=-2;sentChips={playerOne:null,playerTwo:null};render();};
      const onVisibility=()=>{
        if(finished)return;
        if(igsDoc().visibilityState==="hidden"){if(record&&!record.winner&&record.arrived[other]===null){away=true;leave();}return;}
        resend();
        Promise.resolve().then(()=>io.resync?.()).catch(()=>{}).then(()=>{if(!finished)resend();});
        if(away){away=false;rejoinedAt=Date.now();igsPresence(()=>igsArrive(io,ctx)).catch(fail);}
      };
      // Fable F13-01: a fault withdraws this manager's arrival (if the other has not arrived), so nobody plays alone for 4.
      const fail=error=>{if(finished)return;root.CareerModeFirestoreBudget?.noteError?.(error);closeRoulette();if(ready&&!(record&&record.arrived[other]!==null))leave();end(error||{code:"PRIME_PACK_FAILED"});};
      const render=()=>{
        if(!ready||!record||finished)return;
        let now;try{now=io.now();}catch(error){return fail(error);}
        const out=guess.outcome(record,now);if(!out)return;
        for(const role of ROLES){if(sentChips[role]!==out.chips[role]){sentChips[role]=out.chips[role];igsPost(frame,"cms-ig-chips",{role,count:out.chips[role]});}}
        if(out.state==="won"||out.state==="draw"){
          const points=out.winner?guess.points(record)[out.winner]:0,shown=`${out.winner||"draw"}:${points}`;
          if(resultShown!==shown&&!(out.state==="draw"&&resultShown)){
            resultShown=shown;back.hidden=true;
            igsPost(frame,"cms-ig-result",{winner:out.winner||"draw",points});
            if(out.winner)for(const role of ROLES)wonMemo.set(igsKey({...ctx,managerRole:role}),role===out.winner?points:0);
          }
          return;
        }
        if(out.state==="waiting"){
          // Fable F13-02: BACK always shows while waiting. This phone is on screen but its arrival is missing (a withdraw that
          // landed late, a lost write): it arrives again, at most once every REJOIN_MS.
          const waitingFor=record.arrived[other]===null?other:me;back.hidden=false;
          if(record.arrived[me]===null&&!away&&igsDoc().visibilityState!=="hidden"&&Date.now()-rejoinedAt>=REJOIN_MS){rejoinedAt=Date.now();igsPresence(()=>igsArrive(io,ctx)).catch(fail);}
          if(shownBeat!==-1){shownBeat=-1;igsPost(frame,"cms-ig-waiting",{role:waitingFor});}
          return;
        }
        back.hidden=true;
        const at=guess.beatAt(guess.startMs(record),now);
        if(at.phase==="waiting"){if(shownBeat!==-1.5){shownBeat=-1.5;igsPost(frame,"cms-ig-waiting",{role:null});}return;}
        if(at.beat!==shownBeat){shownBeat=at.beat;igsPost(frame,"cms-ig-reveal",{index:at.beat,phase:at.phase,remainingMs:at.stageMsLeft,revealMsLeft:at.phase==="reveal"?at.msLeft:0});}
      };
      const onData=data=>{
        const next=igsRecord(data,ctx.season);
        if(!next)return;
        record=next;render();
      };
      const onMessage=event=>{
        if(event.source!==frame.contentWindow||!event.data||typeof event.data.type!=="string")return;
        const m=event.data;
        if(m.type==="cms-ig-ready"){
          if(ready)return;ready=true;
          igsPost(frame,"cms-ig-start",{round:pick.round,waitingFor:other});shownBeat=-2;sentChips={playerOne:null,playerTwo:null};
          // The page is up: the roulette panel goes (F13-07), and only now does this manager arrive, so a slow page never
          // spends its own stage 1 (Fable F13-01).
          closeRoulette();join();
          render();
        }else if(m.type==="cms-ig-input"){
          igsPost(frame,"cms-ig-suggestions",{names:igsSuggestions(index,String(m.text||""))});
        }else if(m.type==="cms-ig-guess"){
          const check=root.CareerModeIconNames.check(index,String(m.text||""),pick.answerId);
          if(check.status==="empty"||check.status==="not-in-list")return igsPost(frame,"cms-ig-feedback",{kind:"not-in-list"});
          if(check.status==="ambiguous")return igsPost(frame,"cms-ig-feedback",{kind:"ambiguous"});
          igsApplyGuess(io,ctx,check.correct).then(next=>{
            if(!next.ok)return igsPost(frame,"cms-ig-feedback",{kind:next.reason==="NO_CHIPS"?"used":"late"});
            // A right guess: its stage, and so its points, is the SERVER time of the write (updatedAt), never this phone's clock
            // when the transaction read ran (Fable F12-01: a commit landing past a stage edge scores the later stage). Only the
            // stamped record is shown or remembered, so both phones and the season result agree with the Rules.
            if(check.correct)return readBack();
            record=next.record;igsPost(frame,"cms-ig-feedback",{kind:"wrong"});render();
          },error=>{root.CareerModeFirestoreBudget?.noteError?.(error);igsPost(frame,"cms-ig-feedback",{kind:/permission/.test(String(error&&error.code))?"late":"error"});});
        }else if(m.type==="cms-ig-continue"){
          if(resultShown)end("continue");
        }else if(m.type==="cms-ig-error"){
          // A page fault never decides the round: it is reported and the round carries on with the server's record.
          root.CareerModeFirestoreBudget?.noteError?.({code:"PRIME_PACK_PAGE",message:String(m.message||"")});
        }
      };
      back.addEventListener("click",()=>{if(finished)return;leave();end("back");});
      igsDoc().addEventListener?.("visibilitychange",onVisibility);
      root.addEventListener("message",onMessage);
      timer=root.setInterval(render,TICK_MS);
      root.setTimeout(()=>{if(!ready&&!finished)fail({code:"PRIME_PACK_PAGE_TIMEOUT"});},READY_WAIT_MS);
      const join=()=>Promise.resolve().then(async()=>{
        rejoinedAt=Date.now();
        await igsPresence(()=>igsArrive(io,ctx));
        if(finished)return;
        const unsubscribe=await igsWatch(io,ctx,onData,fail);
        if(finished){try{unsubscribe();}catch(_error){}return;}
        stop=unsubscribe;
      }).catch(fail);
    });
  }

  return Object.freeze({contractVersion:1,feature:"cms-prime-pack-step",page:PAGE,stageId:STAGE_ID,panelId:PANEL_ID,collection:COLLECTION,doneKey:DONE_KEY,
    applies:igsApplies,record:igsRecord,round:igsRound,suggestions:igsSuggestions,pointsFor:igsPointsFor,arrive:igsArrive,leave:igsLeave,applyGuess:igsApplyGuess,run:igsRun,close:igsClose,wentHome:()=>wentHome,ensure:igsEnsure});
});
