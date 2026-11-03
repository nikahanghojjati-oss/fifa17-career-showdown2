(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeChamberMenStep=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r88 Chamber Men, the season step (Nik 2026-11-02; design https://claude.ai/artifact/KzN1uypy5EZhLx8C4AiQMK; rules in
  // js/chamberMen.js). Every season of a Showdown confirmed from the r88 release on, before Roster Russian Roulette, both
  // phones play a 7-round shootout, turn by turn (Nik 2026-11-03: "No one does both at the same time"). Each round has two
  // kicks: kick A Daniel shoots and Nik keeps, kick B Nik shoots and Daniel keeps. On each kick the shooter's phone shows
  // only YOU SHOOT and "Pick your shot", the keeper's only YOU KEEP and "Pick your dive" (Left, Middle, Right); each locks
  // in; once both are in, both phones show that kick (the shot, the dive, GOAL or SAVED), then the next kick. Each manager
  // takes exactly 7 shots. His k-th shot fills chamber k of the rival's cylinder (goal = live round). The roulette then
  // spins with those cylinders (js/rosterRoulette.js loaded chambers).
  //
  // What the phones share is one small record, rivalries/{rid}/chamberMenRounds/season_N (Rules: the season-results
  // fragment): each manager's pick string, one letter per kick (his shot on a kick he takes, his dive on a kick he keeps),
  // which only ever grows by his own letter for the kick on now, and only while he is not ahead of the other manager. A
  // kick shows only once both letters are in, so nobody sees the other's pick first. One phone never sends the other
  // manager's pick: when this manager's own clock runs out, his own phone sends "-" for that kick, even
  // when a side was chosen but not locked in (Codex #1232): a "-" shot misses, a "-" dive stays in the middle.
  // Clock: 10 s on the Transfer Challenge's server clock, started on a manager's phone when the rival has locked in for that
  // kick (and that phone has finished showing the last kick), so nobody is timed out while the other is still on his way.
  // The deadline is tied to the rival's lock-in time on the server, so reopening the screen never resets it.
  //
  // Reads: one listener on the round record while the screen is open (each of the 28 letters is one delivery per phone),
  // one transaction read per letter this phone sends (14 a season). A finished shootout is kept on this phone, so the
  // roulette needs no read for it.
  const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const STAGE_ID="cmStage",COLLECTION="chamberMenRounds",OBJECT_TYPE="sharedChamberMenRound";
  const DONE_KEY="careerModeShowdown.chamberMenDone.v2",KEPT_KEY="careerModeShowdown.chamberMenKicks.v2",KEYS_MAX=60,SCHEMA=2;
  const PICK_MS=10000,KICK_MS=2600,TICK_MS=200,POLL_MS=2500,LOAD_WAIT_MS=10000,SEND_RETRY_MS=1500,NOTICE_MS=2500;
  const SIDE_WORD=Object.freeze({L:"LEFT",M:"MIDDLE",R:"RIGHT"});
  const memo=new Map();// `${rid}|${season}` -> finished {playerOne, playerTwo} pick strings
  let running=null,wentHome=false;

  function cmsDoc(){return root.document||null;}
  function cmsOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function cmsKey(ctx){return `${ctx.rivalryId}|${ctx.season}|${ctx.managerRole}`;}
  function cmsSeasonKey(ctx){return `${ctx.rivalryId}|${ctx.season}`;}
  function cmsSeasonId(season){return `season_${season}`;}
  function cmsEngine(){return root.CareerModeChamberMen||(typeof require==="function"?require("./chamberMen.js"):null);}
  function cmsRead(key){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(key)||"[]");return Array.isArray(value)?value:[];}catch(_error){return [];}}
  function cmsWrite(key,list){try{if(typeof root.writeStorageValue==="function")root.writeStorageValue(key,JSON.stringify(list.slice(-KEYS_MAX)));}catch(_error){}}
  function cmsIsDone(ctx){return cmsRead(DONE_KEY).includes(cmsKey(ctx));}
  function cmsMarkDone(ctx){cmsWrite(DONE_KEY,[...cmsRead(DONE_KEY).filter(item=>item!==cmsKey(ctx)),cmsKey(ctx)]);return true;}
  // A finished shootout (all 14 kicks) is kept here, so the roulette never reads it again on this phone.
  function cmsKeep(ctx,record){
    const key=cmsSeasonKey(ctx);memo.set(key,record);
    cmsWrite(KEPT_KEY,[...cmsRead(KEPT_KEY).filter(item=>!(Array.isArray(item)&&item[0]===key)),[key,{playerOne:record.playerOne,playerTwo:record.playerTwo}]]);
  }
  function cmsKept(ctx){
    const key=cmsSeasonKey(ctx),engine=cmsEngine();
    if(memo.has(key))return memo.get(key);
    const found=cmsRead(KEPT_KEY).find(item=>Array.isArray(item)&&item[0]===key),record=found&&engine?engine.record(found[1]):null;
    return record&&engine.progress(record).complete?record:null;
  }
  async function cmsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
  function cmsWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
  // The rules file and the screen's styles. false when they cannot load in time.
  async function cmsEnsure(){
    const loads=Promise.all([
      cmsLoad("chamber-men","js/chamberMen.js",()=>Boolean(root.CareerModeChamberMen)),
      typeof root.loadRuntimeStyle==="function"?Promise.resolve(root.loadRuntimeStyle("chamber-men-step","css/chamberMen.css")).then(()=>true,()=>true):true
    ]).then(list=>list.every(Boolean),()=>false);
    return Promise.race([loads,cmsWait(LOAD_WAIT_MS).then(()=>false)]);
  }
  // ctx = {rivalryId, managerRole, season, confirmedAtMs}. Does this Showdown play Chamber Men this season? Needs
  // js/chamberMen.js (a browser caller awaits ensure() first). The kill switch (CMS_CHAMBER_MEN="off") turns the screen off;
  // the roulette then spins one bullet for a season with no finished shootout.
  function cmsApplies(ctx){
    if(root.CMS_CHAMBER_MEN==="off"||!ctx)return false;
    if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
    if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
    const engine=cmsEngine();
    return Boolean(engine&&engine.eligible(ctx.rivalryId,ctx.confirmedAtMs));
  }

  // ---------- the record: Firestore <-> js/chamberMen.js ----------
  // Server time of a record's last write (Firestore Timestamp, {seconds,nanoseconds}, Date or millis), or null.
  function cmsMillis(value){if(!value)return null;if(typeof value==="number")return value;if(typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();if(Number.isFinite(value.seconds))return value.seconds*1000+Math.floor((value.nanoseconds||0)/1e6);return null;}
  function cmsRecord(data,season){
    if(!data||data.schemaVersion!==SCHEMA||data.objectType!==OBJECT_TYPE||data.seasonNumber!==season||!data.kicks)return null;
    return cmsEngine().record({playerOne:data.kicks.playerOne,playerTwo:data.kicks.playerTwo});
  }
  function cmsRef(io,season){return io.sdk.doc(io.firestore,"rivalries",io.rivalryId,COLLECTION,cmsSeasonId(season));}
  function cmsStamp(io){return {activeSessionId:io.sessionId,updatedByDeviceId:io.deviceId,updatedAt:io.sdk.serverTimestamp()};}
  // This manager's letter for kick n, on the latest record: created with the first letter of all, or his string grown by
  // one letter. {ok:true, record} once written; {ok:false, reason} when the record does not allow it (already sent, waiting
  // for the rival: the listener then shows the true state). kick: the kick this letter was picked for (Codex #1205): a send
  // that reaches the server after that kick is already in (a second tab, a transaction retry) is refused, never stored as
  // the next kick, so a shot never lands as a dive or the other way round.
  // Both managers locking in at the same moment write the same record at once. The Rules see the second write against the
  // record the first one just changed (kick 1: both create it; later kicks: a stale revision) and refuse it before the
  // transaction can retry, so a refused send is tried once more, on the record as it is now (one more transaction read,
  // only in that race). A second refusal is passed on (the clock or LOCK IN tries again).
  async function cmsSend(io,ctx,letter,kick){
    try{return await cmsSendOnce(io,ctx,letter,kick);}
    catch(error){
      if(!/permission/i.test(String(error&&error.code||"")))throw error;
      return cmsSendOnce(io,ctx,letter,kick);
    }
  }
  async function cmsSendOnce(io,ctx,letter,kick){
    const ref=cmsRef(io,ctx.season),me=ctx.managerRole,engine=cmsEngine();
    return io.sdk.runTransaction(io.firestore,async tx=>{
      const snap=await tx.get(ref),data=snap.exists()?snap.data():null;
      if(!data){
        if(kick!==1)return {ok:false,reason:"NOT_THIS_KICK"};
        const next=engine.send({playerOne:"",playerTwo:""},me,letter);
        if(!next)return {ok:false,reason:"BAD_PICK"};
        tx.set(ref,{schemaVersion:SCHEMA,objectType:OBJECT_TYPE,rivalryId:io.rivalryId,seasonNumber:ctx.season,kicks:{playerOne:next.playerOne,playerTwo:next.playerTwo},revision:1,...cmsStamp(io)});
        return {ok:true,record:next};
      }
      const record=cmsRecord(data,ctx.season);
      if(!record)return {ok:false,reason:"BAD_RECORD"};
      if(!Number.isInteger(kick)||record[me].length!==kick-1)return {ok:false,reason:"NOT_THIS_KICK",record};
      const next=engine.send(record,me,letter);
      if(!next)return {ok:false,reason:"NOT_YOUR_KICK",record};
      tx.update(ref,{[`kicks.${me}`]:next[me],revision:data.revision+1,...cmsStamp(io)});
      return {ok:true,record:next};
    });
  }
  // One plain read of the record (the roulette on a phone that did not keep the finished shootout).
  async function cmsReadRecord(io,season){
    const ref=cmsRef(io,season);
    const data=await io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;});
    return data?cmsRecord(data,season):cmsEngine().record({playerOne:"",playerTwo:""});
  }
  async function cmsSnapshotApi(io){
    const meter=root.CareerModeFirestoreBudget?.meterSdk||(s=>s);
    if(typeof io.sdk.onSnapshot==="function")return meter(io.sdk);
    const url=root.CareerModeProductionFirebaseRuntime?.firebaseFirestoreModule;
    if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url))return null;
    try{const module=await import(url);return module&&typeof module.onSnapshot==="function"&&typeof module.doc==="function"?meter(module):null;}catch(_error){return null;}
  }
  // The listener on the round record; a timed transaction read when no listener is available. onData(null) = no record yet.
  async function cmsWatch(io,ctx,onData,onError){
    const api=await cmsSnapshotApi(io),ref=cmsRef(io,ctx.season);
    if(api){
      const listenRef=api===io.sdk?ref:api.doc(io.firestore,"rivalries",io.rivalryId,COLLECTION,cmsSeasonId(ctx.season));
      return api.onSnapshot(listenRef,{includeMetadataChanges:true},snap=>{if(snap.metadata?.hasPendingWrites||snap.metadata?.fromCache)return;onData(snap.exists()?snap.data():null);},onError);
    }
    let stopped=false;
    const poll=async()=>{while(!stopped){try{const data=await io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;});if(!stopped)onData(data);}catch(error){if(!stopped)onError(error);return;}await cmsWait(POLL_MS);}};
    void poll();
    return ()=>{stopped=true;};
  }
  // The two cylinders for the roulette: {ok:true, chambers:{playerOne, playerTwo}, score} once all 14 kicks are in, from this
  // phone's kept copy or one read; {ok:false, reason} otherwise (the roulette then stays shut: it never spins on a part).
  async function cmsCylinders(ctx,io){
    const engine=cmsEngine();if(!engine)return {ok:false,reason:"NOT_LOADED"};
    let record=cmsKept(ctx);
    if(!record){
      try{record=await cmsReadRecord(io,ctx.season);}catch(error){return {ok:false,reason:"READ_FAILED",error};}
      if(!record)return {ok:false,reason:"BAD_RECORD"};
      if(!engine.progress(record).complete)return {ok:false,reason:"NOT_FINISHED"};
      cmsKeep(ctx,record);
    }
    return {ok:true,chambers:engine.cylinders(record),score:engine.score(record),record};
  }

  // ---------- the screen ----------
  const SVG_NS="http://www.w3.org/2000/svg";
  const ZONE_X=Object.freeze({L:62,M:150,R:238});
  function cmsEl(tag,className,text){const node=cmsDoc().createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function cmsSvg(tag,attrs){const node=cmsDoc().createElementNS(SVG_NS,tag);for(const [k,v] of Object.entries(attrs||{}))node.setAttribute(k,String(v));return node;}
  function cmsRemove(){const node=cmsDoc()?.getElementById(STAGE_ID);if(node)node.remove();}
  function cmsClose(){cmsRemove();cmsLoadingOff();return true;}
  // The app's loading screen (Reus Gate) until the first record arrives, so a dark half-built screen never shows.
  let loading=null;
  function cmsLoadingOn(){
    const doc=cmsDoc(),el=doc&&doc.getElementById("loadingScreen");if(!el||loading)return;
    const text=doc.getElementById("loadingText"),prior=text?text.textContent:"";
    el.classList.remove("is-exiting","hidden");el.hidden=false;el.removeAttribute("aria-hidden");el.setAttribute("aria-busy","true");
    if(text)text.textContent="LOADING CHAMBER MEN";
    loading={el,text,prior};
  }
  function cmsLoadingOff(){
    const shown=loading;loading=null;if(!shown)return;
    shown.el.setAttribute("aria-hidden","true");shown.el.setAttribute("aria-busy","false");shown.el.classList.add("is-exiting");
    root.setTimeout(()=>{if(loading)return;shown.el.hidden=true;shown.el.classList.add("hidden");if(shown.text)shown.text.textContent=shown.prior;},240);
  }
  // r88 Team V scene (Chamber Men art): a marble-and-gold goal mouth drawn in code (no picture, no face, no real crest).
  // The keeper is a faceless gold figure with four poses: ready, and a dive LEFT, MIDDLE or RIGHT (data-pose on .cmKeeper,
  // css/chamberMen.css shows one). .cmNet bulges where the ball hits on a goal (.cmGoal.is-goal, --cm-hit-x/--cm-hit-y).
  // Same coordinates as the stand-in: zones at ZONE_X, the keeper stands at y 92, the ball sits on the spot at y 132.
  const CM_GOAL_ART=`<defs>
<linearGradient id="cmGoldV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a5612"/><stop offset=".28" stop-color="#ffe9a3"/><stop offset=".5" stop-color="#f2c45b"/><stop offset=".78" stop-color="#b8861f"/><stop offset="1" stop-color="#5c400d"/></linearGradient>
<linearGradient id="cmGoldH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5612"/><stop offset=".3" stop-color="#ffe9a3"/><stop offset=".55" stop-color="#f2c45b"/><stop offset="1" stop-color="#6b4a12"/></linearGradient>
<linearGradient id="cmMouth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14100a"/><stop offset="1" stop-color="#0b0906"/></linearGradient>
<linearGradient id="cmTurf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d3a1f"/><stop offset="1" stop-color="#0d1d0f"/></linearGradient>
<linearGradient id="cmKit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".35" stop-color="#f2c45b"/><stop offset=".75" stop-color="#c8922f"/><stop offset="1" stop-color="#7a5612"/></linearGradient>
<radialGradient id="cmBallG" cx=".38" cy=".34" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f2ebdd"/><stop offset="1" stop-color="#b9ae98"/></radialGradient>
<g id="cmFig"><path d="M-6 2 L-10 23 M6 2 L10 23" stroke="#d9a83a" stroke-width="6.5" stroke-linecap="round" fill="none"/><path d="M-14 24.5 h7 M7 24.5 h7" stroke="#14100a" stroke-width="3.4" stroke-linecap="round"/><rect x="-10.5" y="-24" width="21" height="29" rx="8" fill="url(#cmKit)" stroke="#5c400d" stroke-width=".9"/><path d="M-10 -7 H10" stroke="#14100a" stroke-width="2.2"/><circle cx="0" cy="-32" r="6.6" fill="url(#cmKit)" stroke="#5c400d" stroke-width=".9"/></g>
</defs>
<rect x="18" y="16" width="264" height="102" fill="url(#cmMouth)"/>
<g class="cmNet">
<path class="cmNetBack" d="M34 28 H266 V108 H34 Z"/>
<path class="cmNetMesh" d="M18 16 L34 28 M282 16 L266 28 M18 118 L34 108 M282 118 L266 108 M54 28 V108 M74 28 V108 M94 28 V108 M114 28 V108 M134 28 V108 M150 28 V108 M166 28 V108 M186 28 V108 M206 28 V108 M226 28 V108 M246 28 V108 M34 41 H266 M34 54 H266 M34 68 H266 M34 81 H266 M34 95 H266 M18 40 L34 49 M18 64 L34 70 M18 90 L34 89 M282 40 L266 49 M282 64 L266 70 M282 90 L266 89 M54 16 L54 28 M94 16 L94 28 M134 16 L134 28 M166 16 L166 28 M206 16 L206 28 M246 16 L246 28"/>
</g>
<rect x="0" y="118" width="300" height="20" fill="url(#cmTurf)"/>
<path d="M0 118.5 H300" stroke="#f2ebdd" stroke-width="1.6"/>
<path d="M60 138 Q150 126 240 138" fill="none" stroke="#f2ebdd" stroke-width="1.2"/>
<circle cx="150" cy="132" r="1.6" fill="#f2ebdd"/>
<g class="cmFrame">
<rect x="12" y="10" width="9" height="110" rx="2" fill="url(#cmGoldV)" stroke="#4a3309" stroke-width=".8"/>
<rect x="279" y="10" width="9" height="110" rx="2" fill="url(#cmGoldV)" stroke="#4a3309" stroke-width=".8"/>
<rect x="12" y="10" width="276" height="9" rx="2" fill="url(#cmGoldH)" stroke="#4a3309" stroke-width=".8"/>
<path d="M15 12.4 H285 M14.6 13 V117 M281.6 13 V117" stroke="#fff6d2" stroke-width=".9"/>
<rect x="9" y="117" width="15" height="5" rx="1.5" fill="#1a150d" stroke="#d4a017" stroke-width=".8"/>
<rect x="276" y="117" width="15" height="5" rx="1.5" fill="#1a150d" stroke="#d4a017" stroke-width=".8"/>
</g>
<circle class="cmHit" cx="0" cy="0" r="10"/>`;
  const CM_KEEPER_ART=`<ellipse class="cmShadow" cx="0" cy="26" rx="15" ry="2.6"/>
<g class="cmPose" data-for="ready"><path class="cmLimb" d="M-9 -18 L-23 -6 M9 -18 L23 -6"/><circle class="cmGlove" cx="-24" cy="-5" r="4.4"/><circle class="cmGlove" cx="24" cy="-5" r="4.4"/><use href="#cmFig"/></g>
<g class="cmPose" data-for="M" transform="translate(0 -9)"><path class="cmLimb" d="M-8 -20 L-17 -46 M8 -20 L17 -46"/><circle class="cmGlove" cx="-18" cy="-48" r="4.6"/><circle class="cmGlove" cx="18" cy="-48" r="4.6"/><use href="#cmFig"/></g>
<g class="cmPose" data-for="L" transform="translate(6 -4) rotate(-64)"><path class="cmLimb" d="M-5 -21 L-9 -50 M5 -21 L7 -50"/><circle class="cmGlove" cx="-9.5" cy="-52" r="4.6"/><circle class="cmGlove" cx="7.5" cy="-52" r="4.6"/><use href="#cmFig"/></g>
<g class="cmPose" data-for="R" transform="translate(-6 -4) rotate(64)"><path class="cmLimb" d="M5 -21 L9 -50 M-5 -21 L-7 -50"/><circle class="cmGlove" cx="9.5" cy="-52" r="4.6"/><circle class="cmGlove" cx="-7.5" cy="-52" r="4.6"/><use href="#cmFig"/></g>`;
  const CM_BALL_ART=`<g class="cmBallArt"><circle r="7.6" fill="url(#cmBallG)" stroke="#2a2418" stroke-width=".9"/><path d="M0 -2.8 L2.7 -.9 L1.7 2.3 H-1.7 L-2.7 -.9 Z" fill="#1a150d"/><path d="M0 -2.8 V-7.4 M2.7 -.9 L7.1 -2.2 M1.7 2.3 L4.4 6 M-1.7 2.3 L-4.4 6 M-2.7 -.9 L-7.1 -2.2" stroke="#1a150d" stroke-width=".9" fill="none"/><path d="M-1.6 -7.3 L1.6 -7.3 L0 -6 Z M6.4 -3.8 L7.5 -.6 L6 -1.4 Z M-6.4 -3.8 L-7.5 -.6 L-6 -1.4 Z M3.2 6.7 L5.6 4.6 L4 4.9 Z M-3.2 6.7 L-5.6 4.6 L-4 4.9 Z" fill="#1a150d"/></g>`;
  function cmsGoal(){
    const svg=cmsSvg("svg",{class:"cmGoal",viewBox:"0 0 300 160",role:"img","aria-label":"The goal: left, middle and right"});
    svg.innerHTML=CM_GOAL_ART;
    for(const [side,x] of Object.entries(ZONE_X)){const t=cmsSvg("text",{class:"cmZone",x,y:153,"text-anchor":"middle"});t.textContent=SIDE_WORD[side];svg.append(t);}
    const keeper=cmsSvg("g",{class:"cmKeeper","data-pose":"ready"});keeper.innerHTML=CM_KEEPER_ART;
    const ball=cmsSvg("g",{class:"cmBall"});ball.innerHTML=CM_BALL_ART;
    svg.append(keeper,ball);
    return {svg,keeper,ball,hit:svg.querySelector(".cmHit")};
  }
  // Before a kick: keeper back in the middle and ready, ball on the spot, the net still.
  function cmsReset(goal){
    goal.svg.classList.remove("is-goal","is-save","is-flying");goal.keeper.dataset.pose="ready";
    cmsPlace(goal.keeper,ZONE_X.M,92,false);cmsPlace(goal.ball,ZONE_X.M,132,false);
  }
  function cmsPlace(node,x,y,animate){node.style.transition=animate?"transform 900ms cubic-bezier(.2,.8,.2,1)":"none";node.setAttribute("transform",`translate(${x} ${y})`);node.style.transform=`translate(${x}px, ${y}px)`;}
  // The back buttons are .cmBack, never .backButton: the app's smart back (js/screens.js) takes every .backButton click
  // before the button hears it, and this button must leave the step itself.
  function cmsBuild(ctx){
    const doc=cmsDoc();cmsRemove();
    const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Chamber Men");stage.style.visibility="hidden";
    const shell=cmsEl("div","cmShell");
    // The kick counter: "Round 3 of 7 · Daniel shoots".
    const header=cmsEl("div","cmHeader");header.append(cmsEl("span","",`Season ${ctx.season}`),cmsEl("span","cmRound","Round 1 of 7 · Daniel shoots"));
    const title=cmsEl("h2","cmTitle","Chamber Men");
    const board=cmsEl("div","cmBoard"),sides={};
    for(const role of ROLES){
      const side=cmsEl("div","cmSide"),goals=cmsEl("div","cmGoals","0"),cyl=cmsEl("div","cmCylinder"),chambers=[];
      for(let i=0;i<7;i+=1){const c=cmsEl("span","cmChamber");c.setAttribute("aria-hidden","true");chambers.push(c);cyl.append(c);}
      const label=cmsEl("div","cmCylLabel","Cylinder: 0 live");label.setAttribute("aria-label",`${NAMES[role]}'s cylinder: 0 live`);
      side.append(cmsEl("div","cmName",NAMES[role]),goals,cyl,label);sides[role]={side,goals,chambers,label};
    }
    board.append(sides.playerOne.side,cmsEl("div","cmVs","GOALS"),sides.playerTwo.side);
    const goal=cmsGoal(),status=cmsEl("p","cmStatus","");status.setAttribute("aria-live","polite");
    // Whose turn it is, in big letters: YOU SHOOT / YOU KEEP (GOAL, SAVED or MISSED while a kick is shown), the rival's part
    // and the kick counter. data-turn is shoot, keep, reveal or done.
    const turn=cmsEl("div","cmTurn"),turnHead=cmsEl("div","cmTurnHead","YOU SHOOT"),turnSub=cmsEl("div","cmTurnSub",""),turnCount=cmsEl("div","cmTurnCount","");
    turn.append(turnHead,turnSub,turnCount);turn.dataset.turn="shoot";
    // Only the row of this manager's part is shown: "Pick your shot" when he shoots, "Pick your dive" when he keeps.
    const picks=cmsEl("div","cmPicks"),rows={};
    for(const [kind,label] of [["shot","Pick your shot"],["dive","Pick your dive"]]){
      const row=cmsEl("div","cmRow"),choices=cmsEl("div","cmChoices"),buttons={};row.dataset.kind=kind;
      for(const side of ["L","M","R"]){const b=cmsEl("button","cmChoice",SIDE_WORD[side]);b.type="button";b.setAttribute("aria-pressed","false");b.dataset.kind=kind;b.dataset.side=side;buttons[side]=b;choices.append(b);}
      row.append(cmsEl("div","cmRowLabel",label),choices);rows[kind]={row,buttons};picks.append(row);
    }
    rows.dive.row.hidden=true;
    const clock=cmsEl("div","cmClock","");
    const actions=cmsEl("div","cmActions");
    const lock=cmsEl("button","menuButton cmLock","LOCK IN");lock.type="button";
    const next=cmsEl("button","menuButton cmNext","SPIN THE CYLINDER");next.type="button";next.hidden=true;
    const back=cmsEl("button","cmBack","BACK TO SHOWDOWN HOME");back.type="button";
    actions.append(lock,next,back);
    const lines=cmsEl("ul","cmLines");lines.hidden=true;
    // Fable F17-07: the pitch (score and goal) and the controls (turn, status, clock, picks, LOCK IN) are two columns on a
    // wide screen, so the 10-second clock and LOCK IN are on screen from the first view at 1280x800 and 1366x768.
    const play=cmsEl("div","cmPlay"),pitch=cmsEl("div","cmPitch"),controls=cmsEl("div","cmControls");
    pitch.append(board,goal.svg);controls.append(turn,status,clock,picks,lines,actions);play.append(pitch,controls);
    shell.append(header,title,play);stage.append(shell);doc.body.append(stage);
    cmsReset(goal);
    return {stage,round:header.querySelector(".cmRound"),sides,goal,status,turn,turnHead,turnSub,turnCount,picks,rows,clock,lock,next,back,lines};
  }

  // On true the screen stays (SPIN THE CYLINDER held down) until the caller has the roulette on screen and closes it, so the
  // dashboard never shows in between; the roulette's loading screen and stage stand above it.
  // Runs this season's Chamber Men for this manager. io = {firestore, sdk (doc, runTransaction, serverTimestamp, onSnapshot?),
  // rivalryId, sessionId, deviceId, now() (server time), resync?}. Resolves true when the roulette may run (all 14 kicks are in
  // and this manager pressed SPIN THE CYLINDER, or the game does not apply), false when he went back to Showdown Home or the
  // step could not run (the window stays shut and the dashboard says why; tapping again comes back here).
  function cmsRun(ctx,io){
    if(running)return running;
    wentHome=false;
    // BACK TO SHOWDOWN HOME opens Showdown Home, as the roulette's does (rrsRunBeforeTransfers). Closing the stage alone left the
    // screen underneath (Club Assignment in season 1, from Career Start) with HOME locked, so CONTINUE CAREER was out of reach.
    running=cmsRunNow(ctx,io).then(go=>{if(!go)cmsClose();return go;},error=>{cmsClose();throw error;}).then(go=>{if(!go&&wentHome&&typeof root.navigateTo==="function")return Promise.resolve().then(()=>root.navigateTo("mainMenu")).catch(()=>{}).then(()=>go);return go;}).finally(()=>{running=null;});
    return running;
  }
  async function cmsRunNow(ctx,io){
    if(!cmsApplies(ctx))return true;
    if(!await cmsEnsure())return false;
    // This phone already saw this season's result and went on: straight to the roulette.
    if(cmsIsDone(ctx))return true;
    for(;;){
      const result=await cmsPlay(ctx,io);
      if(result==="continue"){cmsMarkDone(ctx);return true;}
      if(result==="back"){wentHome=true;return false;}
      const go=await cmsAskRetry(result);
      if(!go){wentHome=true;return false;}
    }
  }
  // A fault: TRY AGAIN or Showdown Home, on the stage itself (no card over anything).
  function cmsAskRetry(error){
    return new Promise(resolve=>{
      const doc=cmsDoc();cmsRemove();cmsLoadingOff();
      const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Chamber Men could not load");
      const shell=cmsEl("div","cmShell"),actions=cmsEl("div","cmActions");
      const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(error);
      shell.append(cmsEl("div","cmHeader","Chamber Men"),cmsEl("h2","cmTitle","Chamber Men could not load"),cmsEl("p","cmStatus",quota||"Check the connection and try again. Every pick already sent is kept."));
      const retry=cmsEl("button","menuButton","TRY AGAIN");retry.type="button";retry.addEventListener("click",()=>{retry.disabled=true;resolve(true);});
      const back=cmsEl("button","cmBack","BACK TO SHOWDOWN HOME");back.type="button";back.addEventListener("click",()=>{back.disabled=true;resolve(false);});
      actions.append(retry,back);shell.append(actions);stage.append(shell);doc.body.append(stage);retry.focus();
    });
  }
  // One screen session: "continue", "back", or an error object.
  function cmsPlay(ctx,io){
    return new Promise(resolve=>{
      const engine=cmsEngine(),me=ctx.managerRole,other=cmsOther(me),KICKS=engine.kicks;
      cmsLoadingOn();
      const ui=cmsBuild(ctx);
      // record: the latest from the server. shown: how many kicks are shown (drawn or replayed) on screen. clock: {kick,
      // deadline} in server ms. sel: this manager's choice for the kick on now. revealUntil: the server time the kick on
      // screen stops being shown.
      let record=null,lastWriteMs=null,shown=0,clock=null,selKick=0,sel=null,revealUntil=0,revealing=null,sending=false,lastSendFail=0,notice=null,finished=false,stop=null,first=true,resultShown=false;
      const now=()=>{try{return io.now();}catch(_error){return Date.now();}};
      const end=value=>{if(finished)return;finished=true;root.clearInterval(timer);root.clearTimeout(revealing);cmsDoc().removeEventListener?.("visibilitychange",onVisibility);try{stop&&stop();}catch(_error){}resolve(value);};
      const fail=error=>{if(finished)return;root.CareerModeFirestoreBudget?.noteError?.(error);end(error||{code:"CHAMBER_MEN_FAILED"});};
      // ---- drawing ----
      // The first upTo kicks drawn: goals, and each shot's chamber in the rival's cylinder (a manager's k-th shot is chamber k).
      const drawBoard=upTo=>{
        const kicks=(engine.kicksOf(record)||[]).slice(0,upTo),score={playerOne:0,playerTwo:0};
        for(const role of ROLES)for(const c of ui.sides[role].chambers)c.className="cmChamber";
        for(const kick of kicks){if(kick.goal)score[kick.shooter]+=1;ui.sides[kick.keeper].chambers[kick.shot-1].className=`cmChamber ${kick.goal?"is-live":"is-empty"}`;}
        for(const role of ROLES){
          ui.sides[role].goals.textContent=String(score[role]);
          // A manager's own cylinder is loaded by the rival's goals.
          const live=score[cmsOther(role)];
          ui.sides[role].label.textContent=`Cylinder: ${live} live`;ui.sides[role].label.setAttribute("aria-label",`${NAMES[role]}'s cylinder: ${live} live`);
        }
        return score;
      };
      const counter=n=>{const k=engine.kick(n);return `Round ${k.round} of 7 · ${NAMES[k.shooter]} shoots`;};
      const setTurn=(mode,head,sub,count)=>{ui.turn.dataset.turn=mode;ui.turnHead.textContent=head;ui.turnSub.textContent=sub;ui.turnCount.textContent=count;};
      const kickWords=kick=>{
        const where=kick.shotSide===engine.timeout?`${NAMES[kick.shooter]} ran out of time`:`${NAMES[kick.shooter]} shoots ${SIDE_WORD[kick.shotSide]}`;
        const keeperWords=kick.dive===engine.timeout?`${NAMES[kick.keeper]} stays in the middle`:`${NAMES[kick.keeper]} dives ${SIDE_WORD[kick.dive]}`;
        const result=kick.shotSide===engine.timeout?"Missed":kick.goal?"Goal":"Saved";
        return {line:`${where} · ${keeperWords}`,result};
      };
      const showKick=(kick,animate)=>{
        const shot=kick.shotSide,dive=engine.dive(kick.dive),g=ui.goal;
        const ballX=shot===engine.timeout?150:ZONE_X[shot],ballY=shot===engine.timeout?6:kick.goal?44:70;
        // Team V scene: reset, a short run-up, then the dive and the shot together; the net takes a goal.
        const strike=()=>{
          if(finished)return;
          g.keeper.dataset.pose=dive;cmsPlace(g.keeper,ZONE_X[dive],92,animate);cmsPlace(g.ball,ballX,ballY,animate);
          g.svg.style.setProperty("--cm-hit-x",`${ballX}px`);g.svg.style.setProperty("--cm-hit-y",`${ballY}px`);
          g.hit.setAttribute("cx",String(ballX));g.hit.setAttribute("cy",String(ballY));
          g.svg.classList.toggle("is-flying",animate);g.svg.classList.toggle("is-goal",Boolean(kick.goal));g.svg.classList.toggle("is-save",!kick.goal);
        };
        cmsReset(g);
        if(animate){void g.svg.getBoundingClientRect?.();root.setTimeout(strike,320);}else strike();
        const words=kickWords(kick);
        ui.round.textContent=counter(kick.kick);
        const mine=kick.shooter===me;
        setTurn("reveal",words.result.toUpperCase(),mine?(kick.goal?"You scored":`${NAMES[other]} kept it out`):(kick.goal?`${NAMES[other]} scored`:"You kept it out"),`Kick ${kick.kick} of ${KICKS} · ${NAMES[kick.shooter]}'s shot ${kick.shot} of 7`);
        ui.status.className=`cmStatus ${kick.goal?"is-goal":"is-save"}`;ui.status.textContent=`${words.line} · ${words.result}`;
        // The row of this manager's part on that kick, his own pick pressed, nothing to tap.
        showRow(mine?"shot":"dive");setChoices(false,mine?kick.shotSide:kick.dive);
      };
      // Shows the newly finished kicks one after the other, then carries on.
      const revealFrom=(from,kicks)=>{
        if(from>=kicks.length){revealing=null;render();return;}
        drawBoard(from+1);showKick(kicks[from],true);
        revealing=root.setTimeout(()=>{if(finished)return;shown=from+1;revealFrom(from+1,kicks);},KICK_MS);
      };
      const showRow=kind=>{for(const k of ["shot","dive"])ui.rows[k].row.hidden=k!==kind;};
      const setChoices=(enabled,picked)=>{
        for(const kind of ["shot","dive"])for(const [side,b] of Object.entries(ui.rows[kind].buttons)){
          b.setAttribute("aria-pressed",picked===side?"true":"false");b.disabled=!enabled;
        }
        ui.lock.disabled=!enabled||!sel;
      };
      const showResult=()=>{
        if(resultShown)return;resultShown=true;
        const score=drawBoard(KICKS),chambers=engine.cylinders(record);
        cmsKeep(ctx,record);
        ui.round.textContent="Full time";ui.picks.hidden=true;ui.clock.hidden=true;ui.lock.hidden=true;ui.next.hidden=false;
        setTurn("done","FULL TIME","7 shots each","");
        // Fable F17-06: one shape for every full time, like the GOALS board (names and goals, no tiebreak).
        const line=`${NAMES.playerOne} ${score.playerOne} · ${NAMES.playerTwo} ${score.playerTwo}`;
        ui.status.className="cmStatus";ui.status.textContent=score.playerOne===score.playerTwo?`Level · ${line}`:line;
        ui.lines.replaceChildren(...ROLES.map(role=>cmsEl("li","",`${NAMES[role]}'s cylinder holds ${engine.bullets(chambers[role])} live ${engine.bullets(chambers[role])===1?"round":"rounds"} of 7: ${NAMES[cmsOther(role)]} scored ${score[cmsOther(role)]}.`)));
        ui.lines.hidden=false;ui.next.focus();
      };
      // ---- the state machine ----
      const render=()=>{
        if(finished||!record||revealing)return;
        const progress=engine.progress(record),kicks=engine.kicksOf(record);
        if(shown<progress.done){
          // Kicks that finished before this screen opened are drawn at once; only kicks that finish while it is open are shown.
          if(first){shown=progress.done;}
          else{revealUntil=now()+KICK_MS*(progress.done-shown);revealFrom(shown,kicks);return;}
        }
        first=false;
        drawBoard(shown);
        if(progress.complete){showResult();return;}
        const n=progress.done+1,kick=engine.kick(n),part=engine.roleOn(n,me),shooting=part==="shot";
        const mineSent=progress.sent[me],theirsSent=progress.sent[other];
        ui.round.textContent=counter(n);
        if(ui.status.dataset.kick!==String(n)){ui.status.dataset.kick=String(n);cmsReset(ui.goal);}
        setTurn(shooting?"shoot":"keep",shooting?"YOU SHOOT":"YOU KEEP",shooting?`${NAMES[other]} is in goal`:`${NAMES[other]} shoots at you`,`Kick ${n} of ${KICKS} · ${shooting?"your":`${NAMES[other]}'s`} shot ${kick.shot} of 7`);
        showRow(part);
        if(mineSent>=n){
          // Locked in: his own pick stays pressed, hidden from the rival until the rival's is in.
          clock=null;ui.clock.textContent="";
          const letter=record[me][n-1];
          setChoices(false,letter);
          ui.status.className="cmStatus";
          ui.status.textContent=letter===engine.timeout?`Time is up. Waiting for ${NAMES[other]}.`:`Locked in: ${shooting?"you shoot":"you dive"} ${SIDE_WORD[letter]}. Waiting for ${NAMES[other]}.`;
          return;
        }
        // A new kick clears the choice. The clock starts once the rival has locked in for this kick (and the last kick has
        // been shown on this phone); a screen opened mid-kick starts its clock now.
        if(selKick!==n){selKick=n;sel=null;clock=null;}
        // Codex #1232: the clock runs from the rival's lock-in on the server (the record's updatedAt: while he is one kick ahead,
        // the last write is his), so leaving and reopening the screen never restarts it. The last kick's reveal on this phone
        // still gets its time, never more than KICK_MS on top of the shared deadline.
        if(!clock&&theirsSent>=n){const local=Math.max(now(),revealUntil)+PICK_MS;clock={kick:n,deadline:Number.isFinite(lastWriteMs)?Math.min(local,lastWriteMs+PICK_MS+KICK_MS):local};}
        setChoices(!sending,sel);
        ui.status.className="cmStatus";
        // Fable F17-02: a failed send's notice stays up for NOTICE_MS instead of being written over by the next tick. Fable
        // F17-03: no clock until the rival locks in, and it says so.
        const theirPart=shooting?"dive":"shot";
        ui.status.textContent=notice&&Date.now()<notice.until?notice.text:theirsSent>=n?`${NAMES[other]} has picked his ${theirPart}. Lock in your ${part}.`:`Pick your ${part}, then lock in. No clock until ${NAMES[other]} locks in his ${theirPart}.`;
        if(clock){
          const left=Math.max(0,clock.deadline-now());
          ui.clock.textContent=`0:${String(Math.ceil(left/1000)).padStart(2,"0")}`;
          if(left<=0)send(true);
        }else ui.clock.textContent="";
      };
      const send=timedOut=>{
        if(sending||finished||Date.now()-lastSendFail<SEND_RETRY_MS)return;
        const kick=engine.progress(record).done+1;
        if(engine.nextKick(record,me)!==kick)return;
        if(!timedOut&&!sel)return;
        sending=true;setChoices(false,sel);
        cmsSend(io,ctx,engine.pick(timedOut?null:sel),kick).then(result=>{
          sending=false;
          if(result&&result.ok){notice=null;record=result.record;render();return;}
          if(result&&result.record){record=result.record;}
          render();
        },error=>{
          sending=false;lastSendFail=Date.now();root.CareerModeFirestoreBudget?.noteError?.(error);
          // A refused write means the record moved (the listener brings it); anything else is shown and retried by the clock.
          if(!/permission|aborted|failed-precondition/i.test(String(error&&error.code||"")))notice={text:"The pick did not go through. Tap LOCK IN again.",until:Date.now()+NOTICE_MS};
          render();
        });
      };
      const onData=data=>{
        const next=data?cmsRecord(data,ctx.season):engine.record({playerOne:"",playerTwo:""});
        if(!next)return fail({code:"CHAMBER_MEN_BAD_RECORD"});
        // Never step back: a late delivery older than what this phone already wrote is ignored.
        if(record&&(next.playerOne.length<record.playerOne.length||next.playerTwo.length<record.playerTwo.length))return;
        record=next;lastWriteMs=cmsMillis(data&&data.updatedAt);
        if(ui.stage.style.visibility==="hidden"){ui.stage.style.visibility="visible";cmsLoadingOff();try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}}
        render();
      };
      const onVisibility=()=>{if(finished||cmsDoc().visibilityState==="hidden")return;Promise.resolve().then(()=>io.resync?.()).catch(()=>{}).then(()=>{if(!finished)render();});};
      // ---- input ----
      for(const kind of ["shot","dive"])for(const b of Object.values(ui.rows[kind].buttons))b.addEventListener("click",()=>{if(b.disabled||ui.rows[kind].row.hidden)return;sel=b.dataset.side;setChoices(true,sel);});
      ui.lock.addEventListener("click",()=>send(false));
      ui.next.addEventListener("click",()=>{if(resultShown){ui.next.disabled=true;end("continue");}});
      ui.back.addEventListener("click",()=>end("back"));
      cmsDoc().addEventListener?.("visibilitychange",onVisibility);
      const timer=root.setInterval(render,TICK_MS);
      root.setTimeout(()=>{if(!record&&!finished)fail({code:"CHAMBER_MEN_TIMEOUT"});},LOAD_WAIT_MS);
      Promise.resolve().then(async()=>{
        const unsubscribe=await cmsWatch(io,ctx,onData,fail);
        if(finished){try{unsubscribe();}catch(_error){}return;}
        stop=unsubscribe;
      }).catch(fail);
    });
  }
  function cmsActive(){return Boolean(running);}

  return Object.freeze({contractVersion:1,feature:"cms-chamber-men-step",stageId:STAGE_ID,collection:COLLECTION,objectType:OBJECT_TYPE,doneKey:DONE_KEY,keptKey:KEPT_KEY,
    pickMs:PICK_MS,kickMs:KICK_MS,applies:cmsApplies,ensure:cmsEnsure,record:cmsRecord,send:cmsSend,readRecord:cmsReadRecord,cylinders:cmsCylinders,
    run:cmsRun,close:cmsClose,active:cmsActive,wentHome:()=>wentHome,markDone:cmsMarkDone,isDone:cmsIsDone});
});
