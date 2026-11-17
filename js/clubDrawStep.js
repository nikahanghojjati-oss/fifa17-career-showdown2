(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeClubDrawStep=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // R94-02 PR 3: the Club Assignment "spin and stop" step on #clubWheelScreen, for a shared Setup opened with draw 2
  // (its ledger carries `stops`). js/productionSharedShowdownPresentation.js owns every write and calls this module to show
  // the draw: one ball per manager (js/clubDrawScene3d.js; a flat stand-in where WebGL2 cannot run), STOP on the
  // manager's own device, the club named under a ball only once that ball rests.
  //
  // Integrity (merge conditions, brief R94_02):
  // - The stop is computed ONCE, at the tap, from the ball as it turns now, and saved on this phone before the confirm is
  //   sent: the device storage through js/storage.js, one slot per rivalry and manager, bound to this setup's open operation and
  //   its six candidates. The presentation resends the same stop until Firebase holds it, so a reload, a closed tab, a
  //   second tab, a double tap, a lost reply or an update mid-screen never draws again. On reopen the ledger is read
  //   first: a stop Firebase already holds wins, and only then is a saved one sent again.
  // - The ball never rests before Firebase holds the stop: the scene keeps it rolling until accept(). When Firebase holds a
  //   different stop (the other tab of the same manager won), that stored stop is what the ball rests on.
  // - Both phones show the same picture: the rest pose is a fixed function of the stored integer (clubDrawScene3d poseOf).
  // - This module never writes to Firebase and never decides a club: the club is candidates[role][floor(stop / 120)], the
  //   same rule js/sharedShowdownSetup.js applies when both have stopped.
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const SECTION=120;
  const PENDING_KEY="careerModeShowdown.clubDrawStop.v1";
  const STAGE_ID="clubDrawStage";
  const SCENE_JS="js/clubDrawScene3d.js";
  const STYLE_CSS="css/clubDraw.css";
  // HO-094: the club lounge behind the draw. The same two media rules as css/clubDraw.css pick the file, so the one the page
  // paints is the one decoded here before the Reus Gate opens the screen. Loaded on demand, never precached.
  const PLATE_DIR="visual-assets/v10_1/plates-hc/";
  const CD_PLATE_PHONE_MEDIA="(max-width: 760px) and (orientation: portrait)";
  const CD_PLATE_SIDE_MEDIA="(orientation: landscape) and (max-height: 500px)";
  // The upright and sideways phone plates (HO-095), named here and in the stylesheet (W6 checks they agree; side null would
  // mean the desktop plate).
  const PLATE_FILES=Object.freeze({phone:"ENV_CLUB_PHONE_HC_V4.webp",side:"ENV_CLUB_SIDEWAYS_HC_V4.webp"});
  const CD_PLATE_2X_MEDIA="(min-width: 1537px), (min-resolution: 1.5dppx)";
  const PLATE_WAIT_MS=8000;

  let scene=null,sceneKey="",mounting=null,listeners=new Set(),landed=[false,false],started=false,flat=null,lastState=["",""];

  function cdsDoc(){return root.document||null;}
  function cdsValidStop(value){return Number.isInteger(value)&&value>=0&&value<360;}
  function cdsIsDraw(setup){return Boolean(setup&&typeof setup==="object"&&Object.hasOwn(setup,"stops"));}
  function cdsCandidates(setup){
    const c=setup&&setup.candidates;
    return c&&ROLES.every(role=>Array.isArray(c[role])&&c[role].length===3&&c[role].every(name=>typeof name==="string"&&name))?c:null;
  }
  function cdsDigest(setup){const c=cdsCandidates(setup);return c?`${setup.leagueId}|${c.playerOne.join(",")}|${c.playerTwo.join(",")}`:"";}
  function cdsClubFor(setup,role,stop){const c=cdsCandidates(setup);return c&&cdsValidStop(stop)?c[role][Math.floor(stop/SECTION)]:null;}
  // The stop each manager has in Firebase (confirmedRoles and stops are in the same order).
  function cdsStoredStops(setup){
    const out={playerOne:null,playerTwo:null};
    if(!cdsIsDraw(setup)||!Array.isArray(setup.confirmedRoles)||!Array.isArray(setup.stops))return out;
    setup.confirmedRoles.forEach((role,index)=>{if(ROLES.includes(role)&&cdsValidStop(setup.stops[index]))out[role]=setup.stops[index];});
    return out;
  }

  // ---- the stop saved on this phone between the tap and Firebase holding it ----
  // The device storage (js/storage.js helpers, the one place that touches it), so a tab closed between the tap and Firebase holding
  // the stop cannot let the manager spin again; this page's memory only where those helpers are missing.
  function cdsStore(){
    const read=root.readStorageValue,write=root.writeStorageValue,remove=root.removeStorageValue;
    return typeof read==="function"&&typeof write==="function"&&typeof remove==="function"?{read,write,remove}:null;
  }
  function cdsSlot(ctx){return `${PENDING_KEY}:${String(ctx&&ctx.rivalryId||"")}:${String(ctx&&ctx.role||"")}`;}
  // This setup's open operation (its first receipt; the binding hash where receipts are not shown) and its six candidates.
  function cdsSetupOp(setup){const r=setup&&Array.isArray(setup.receipts)&&setup.receipts[0];return String(r&&r.operationHash||setup&&setup.bindingHash||"");}
  function cdsPendingKey(ctx,setup){return `${String(ctx&&ctx.rivalryId||"")}|${String(ctx&&ctx.role||"")}|${cdsSetupOp(setup)}|${cdsDigest(setup)}`;}
  // The stop is kept in the device storage (written and read back) so a closed tab finds it. If storage refuses it, the stop
  // stays in memory as this phone's only stop (STOP cannot be tapped again) and is still sent and resent while the screen is
  // open: a playable game comes first; only a reload before Firebase accepts it is then unprotected (the ledger still wins).
  let memoryPending=null;
  function cdsWriteDurable(ctx,value){
    const store=cdsStore();if(!store||!ctx)return false;
    try{const text=JSON.stringify({key:value.key,stop:value.stop});return store.write(cdsSlot(ctx),text)!==false&&store.read(cdsSlot(ctx))===text;}catch(_error){return false;}
  }
  function cdsPending(ctx,setup){
    const key=cdsPendingKey(ctx,setup);
    if(memoryPending&&memoryPending.key===key)return memoryPending.stop;
    const store=cdsStore();if(!store)return null;
    try{const value=JSON.parse(store.read(cdsSlot(ctx))||"null");if(value&&value.key===key&&cdsValidStop(value.stop)){memoryPending={key,stop:value.stop,saved:true};return value.stop;}}catch(_error){}
    return null;
  }
  // The pending stop to send (and send again): a failed save is tried again here first; it is sent either way.
  function cdsSendable(ctx,setup){
    const stop=cdsPending(ctx,setup);if(stop===null)return null;
    if(!memoryPending.saved)memoryPending.saved=cdsWriteDurable(ctx,memoryPending);
    return stop;
  }
  function cdsUnsaved(ctx,setup){return cdsPending(ctx,setup)!==null&&!memoryPending.saved;}
  function cdsSavePending(ctx,setup,stop){
    const value={key:cdsPendingKey(ctx,setup),stop,saved:false};memoryPending=value;
    value.saved=cdsWriteDurable(ctx,value);
    return value.saved;
  }
  function cdsClearPending(ctx){
    memoryPending=null;const store=cdsStore();if(!store||!ctx)return;
    try{if(store.read(cdsSlot(ctx))!==null)store.remove(cdsSlot(ctx));}catch(_error){}
  }

  // ---- the flat stand-in (no WebGL2, or the 3D scene failed): the three crests per manager, the lit one cycling fast ----
  // Same contract as the scene: a tap computes the stop once (uniform: there is no ball to time), the lit crest keeps
  // cycling until accept(), then it settles on the stored third.
  function cdsFlat(host,opts){
    const d=cdsDoc(),rows=[],timers=[],emitters=new Set(),reduced=Boolean(opts.reducedMotion);
    const balls=opts.balls.map((b,i)=>({i,clubs:b.clubs,state:"idle",stop:null,accepted:false,front:i*40,pick:-1,queued:null,queuedPending:false}));
    const wrap=d.createElement("div");wrap.className="clubDrawFlat";
    balls.forEach(b=>{
      const row=d.createElement("div");row.className="clubDrawFlatBall";row.dataset.ball=String(b.i);
      b.cells=b.clubs.map(name=>{const cell=d.createElement("span");cell.className="clubDrawFlatClub";const crest=d.createElement("span");crest.className="clubDrawFlatCrest";
        try{if(typeof root.getClubCrestMarkup==="function")crest.innerHTML=root.getClubCrestMarkup(name,"list");else if(typeof root.getClubCrestSvg==="function")crest.innerHTML=root.getClubCrestSvg(name);}catch(_error){}
        cell.append(crest);row.append(cell);return cell;});
      rows.push(row);wrap.append(row);
    });
    host.append(wrap);
    const emit=(type,b)=>{for(const fn of emitters)try{fn({type,ball:b.i,state:b.state,stop:b.stop,section:b.pick});}catch(_error){}};
    const set=(b,state)=>{if(b.state!==state){b.state=state;emit("state",b);}};
    const paint=b=>{const lit=b.state==="landed"?b.pick:Math.floor(((b.front%360)+360)%360/SECTION);b.cells.forEach((cell,k)=>{cell.classList.toggle("is-lit",k===lit);cell.classList.toggle("is-picked",b.state==="landed"&&k===b.pick);});};
    const land=b=>{b.pick=Math.floor(b.stop/SECTION);set(b,"landed");paint(b);emit("landed",b);};
    let tick=null;
    const run=()=>{if(tick)return;tick=root.setInterval(()=>{balls.forEach(b=>{
      if(b.state==="spin"||b.state==="await")b.front+=reduced?0:47;
      if(b.state==="spin"&&b.queued!==null){b.stop=b.queued;b.accepted=!b.queuedPending;b.queued=null;set(b,"await");}
      if(b.state==="await"&&b.accepted){land(b);}
      paint(b);});},90);timers.push(tick);};
    const api={contractVersion:1,flat:true,level:-1,reduced,
      start(){balls.forEach(b=>{if(b.state==="idle"){set(b,"spin");}});run();},
      state(i){return balls[i===1?1:0].state;},
      canStop(i){const b=balls[i===1?1:0];return b.stop===null&&b.state==="spin";},
      tap(i,rand01){const b=balls[i===1?1:0];if(!api.canStop(i))return null;const r=Number.isFinite(rand01)?rand01:cdsRandom();b.stop=Math.floor(r*360)%360;b.accepted=false;set(b,"await");return b.stop;},
      accept(i,stored){const b=balls[i===1?1:0];if(cdsValidStop(stored))b.stop=stored;b.accepted=true;if(b.state!=="landed"&&b.stop!==null){b.state==="await"?land(b):set(b,"await");}},
      restOn(i,stop,o){const b=balls[i===1?1:0],pend=Boolean(o&&o.pending);if(!cdsValidStop(stop))return false;if(b.state==="landed"&&b.stop===stop)return true;
        if(b.state==="idle"&&!pend||o&&o.immediate){b.stop=stop;b.accepted=true;land(b);return true;}
        if(b.state==="idle"){b.queued=stop;b.queuedPending=pend;return true;}
        b.stop=stop;b.accepted=!pend;if(b.state==="spin")set(b,"await");return true;},
      on(fn){emitters.add(fn);return ()=>emitters.delete(fn);},
      anchor(){return null;},
      probe(){return {flat:true,balls:balls.map(b=>({state:b.state,stop:b.stop,section:b.pick,accepted:b.accepted}))};},
      dispose(){timers.forEach(t=>root.clearInterval(t));tick=null;wrap.remove();emitters.clear();api.alive=false;},
      alive:true};
    return api;
  }
  function cdsRandom(){try{const a=new Uint32Array(1);root.crypto.getRandomValues(a);return a[0]/4294967296;}catch(_error){return Math.random();}}

  // ---- mount ----
  function cdsReduced(){try{return typeof root.isReducedMotionPreferred==="function"?Boolean(root.isReducedMotionPreferred()):Boolean(root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches);}catch(_error){return false;}}
  function cdsSound(){try{if(typeof root.isMenuFeedbackEnabled==="function"&&!root.isMenuFeedbackEnabled())return false;if(typeof root.isMenuMediaPlaying==="function"&&root.isMenuMediaPlaying())return false;return true;}catch(_error){return false;}}
  function cdsStage(){
    const d=cdsDoc();if(!d)return null;let stage=d.getElementById(STAGE_ID);if(stage)return stage;
    const area=d.querySelector("#clubWheelScreen .clubRevealArena");if(!area)return null;
    stage=d.createElement("div");stage.id=STAGE_ID;stage.className="clubDrawStage";stage.setAttribute("aria-hidden","true");area.insertBefore(stage,area.firstChild);return stage;
  }
  // The size the stage will have once the Club screen shows (css/clubDraw.css): the scene is built while it is hidden.
  function cdsStageSize(){const w=Math.max(320,Math.min(root.innerWidth||1280,1180)),phone=(root.innerWidth||1280)<=760&&(root.innerHeight||800)>(root.innerWidth||1280);return {w:phone?Math.min(w,root.innerWidth||w):w,h:phone?Math.round(Math.min(520,Math.max(240,(root.innerHeight||800)-395))):Math.round(Math.min(620,Math.max(300,(root.innerHeight||800)-491)))};}
  async function cdsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")throw new Error("Runtime loader unavailable.");await root.loadRuntimeScript(key,path,ready);return ready();}
  function cdsStyle(){try{if(typeof root.loadRuntimeStyle==="function")return Promise.resolve(root.loadRuntimeStyle("club-draw",STYLE_CSS)).then(()=>true,()=>true);}catch(_error){}return Promise.resolve(true);}
  // The engine and the scene code download during the league reveal, before the candidates exist.
  function cdsPreload(){
    void cdsStyle();void cdsPlate();
    return cdsLoad("club-draw-3d",SCENE_JS,()=>Boolean(root.CareerModeClubDraw3d)).then(()=>root.CareerModeClubDraw3d.preload()).catch(()=>false);
  }
  // The crest table (js/visualIdentity.js) is in before any ball is drawn: the game loads it with the gameplay files, and
  // the draw makes sure of it here too, so the Reus Gate never opens on a ball without its crests.
  let identityPromise=null;
  function cdsIdentity(){
    const ready=()=>typeof root.getClubIdentity==="function"&&typeof root.loadClubCrestImage==="function";
    if(ready())return Promise.resolve(true);
    if(!identityPromise)identityPromise=cdsLoad("visual-identity","js/visualIdentity.js",ready).catch(()=>false).then(ok=>{if(!ok)identityPromise=null;return ok;});
    return identityPromise;
  }
  // r94 gallery: each club's third wears its 2016-17 kit (js/kits17.js, the one kit table). Loaded beside the identity table,
  // behind the loading screen; if it cannot load, the balls fall back to the identity colours (never a blank ball).
  let kitsPromise=null;
  function cdsKits(){
    const ready=()=>Boolean(root.CareerModeKits17);
    if(ready())return Promise.resolve(true);
    if(!kitsPromise)kitsPromise=cdsLoad("kits17","js/kits17.js",ready).catch(()=>false).then(ok=>{if(!ok)kitsPromise=null;return ok;})
      // r95: shirt lettering is canvas text: wait (bounded) for the one family before the first draw
      .then(ok=>ok&&root.CareerModeKits17&&root.CareerModeKits17.fontReady?Promise.race([root.CareerModeKits17.fontReady,new Promise(r=>root.setTimeout(r,1500))]).then(()=>ok):ok);
    return kitsPromise;
  }
  function cdsPlateFile(){
    const mq=query=>{try{return Boolean(root.matchMedia&&root.matchMedia(query).matches);}catch(_error){return false;}};
    if(mq(CD_PLATE_PHONE_MEDIA))return PLATE_DIR+PLATE_FILES.phone;
    if(PLATE_FILES.side&&mq(CD_PLATE_SIDE_MEDIA))return PLATE_DIR+PLATE_FILES.side;
    const doc=cdsDoc(),lightest=Boolean(doc&&doc.documentElement&&doc.documentElement.dataset.assets==="0");
    return `${PLATE_DIR}ENV_CLUB_PLATE_HC_V3_${!lightest&&mq(CD_PLATE_2X_MEDIA)?"2X":"1X"}.webp`;
  }
  // Resolves once the plate is decoded (or after PLATE_WAIT_MS, or on an error: the house marble then shows under it), so
  // the screen never opens on a half-painted room.
  const plateDone=new Set();
  function cdsPlate(){
    const file=cdsPlateFile();
    if(plateDone.has(file)||typeof root.Image!=="function")return Promise.resolve(true);
    return new Promise(resolve=>{
      let done=false;const finish=ok=>{if(done)return;done=true;if(ok)plateDone.add(file);resolve(ok);};
      const timer=root.setTimeout?root.setTimeout(()=>finish(false),PLATE_WAIT_MS):null;
      const end=ok=>{if(timer&&root.clearTimeout)root.clearTimeout(timer);finish(ok);};
      try{
        const img=new root.Image();img.decoding="async";
        img.onload=()=>{if(typeof img.decode==="function")img.decode().then(()=>end(true),()=>end(true));else end(true);};
        img.onerror=()=>end(false);img.src=file;
      }catch(_error){end(false);}
    });
  }
  function cdsClubInfo(name){
    // The R94-01 image crest on the ball (the "ball" slot falls back to the largest file there is), the drawn crest otherwise.
    return Promise.all([cdsIdentity(),cdsKits()]).then(()=>typeof root.loadClubCrestImage==="function"?root.loadClubCrestImage(name,"ball"):null).catch(()=>null).then(image=>{
      let id=null;try{id=typeof root.getClubIdentity==="function"?root.getClubIdentity(name):null;}catch(_error){}
      return {primary:id&&id.primary||"#d8b55a",secondary:id&&id.secondary||"#101010",crest:image||(id&&id.crest)||null};
    });
  }
  // Builds the draw for this Setup (both phones build the same balls from the same candidates). Resolves true once the
  // scene (or the flat stand-in) is ready to show: the Club screen opens only then (Reus Gate).
  function cdsPrepare(setup,ctx){
    const digest=cdsDigest(setup),key=`${digest}|${ctx&&ctx.role}`;
    if(!digest)return Promise.resolve(false);
    if(scene&&sceneKey===key&&scene.alive!==false)return Promise.resolve(true);
    if(mounting&&mounting.key===key)return mounting.promise;
    cdsDispose();
    const c=cdsCandidates(setup),me=ROLES.indexOf(ctx&&ctx.role),stage=cdsStage();
    if(!stage)return Promise.resolve(false);
    const opts={balls:ROLES.map(role=>({clubs:c[role].slice()})),me:me<0?0:me,clubInfo:cdsClubInfo,sound:cdsSound,reducedMotion:cdsReduced(),size:cdsStageSize};
    const promise=(async()=>{
      const plate=cdsPlate();
      await cdsStyle();
      let built=null;
      try{if(await cdsLoad("club-draw-3d",SCENE_JS,()=>Boolean(root.CareerModeClubDraw3d)))built=await root.CareerModeClubDraw3d.mount(stage,opts);}catch(_error){built=null;}
      await plate;
      if(!mounting||mounting.key!==key){if(built)built.dispose();return false;}
      if(!built){built=cdsFlat(stage,opts);flat=true;}else flat=false;
      scene=built;sceneKey=key;landed=[false,false];started=false;lastState=["",""];
      stage.dataset.drawKind=flat?"flat":"3d";
      scene.on(event=>{if(event.type==="landed")landed[event.ball]=true;if(event.type==="state")lastState[event.ball]=event.state;for(const fn of listeners)try{fn(event);}catch(_error){}});
      return true;
    })().finally(()=>{if(mounting&&mounting.key===key)mounting=null;});
    mounting={key,promise};
    return promise;
  }
  function cdsIsReady(setup,ctx){return Boolean(scene&&scene.alive!==false&&sceneKey===`${cdsDigest(setup)}|${ctx&&ctx.role}`);}

  // ---- what the presentation reads and does ----
  // Called on every render of the draw: starts the balls once the screen shows, and puts each stored stop on its ball.
  // A stop Firebase holds rests the ball (rival: played out; own after a reload: played out too, or at rest when the
  // Setup is already confirmed). A stop only saved on this phone rolls the own ball toward it, never resting.
  function cdsSync(setup,ctx){
    if(!cdsIsReady(setup,ctx))return false;
    const me=ROLES.indexOf(ctx.role),stored=cdsStoredStops(setup),visible=Boolean(ctx.visible);
    if(visible&&!started){started=true;scene.start();}
    const done=setup.phase==="SHOWDOWN_CONFIRMED";
    ROLES.forEach((role,index)=>{
      const stop=stored[role];
      if(stop!==null){
        if(index===me){const at=scene.state(index);if(!started)scene.restOn(index,stop,{immediate:done});else if(["idle","rest","show","kick","spin","spin-still"].includes(at))scene.restOn(index,stop);else scene.accept(index,stop);}
        else scene.restOn(index,stop,{immediate:!started});
      }else if(index===me){const saved=cdsPending(ctx,setup);if(saved!==null&&started)scene.restOn(index,saved,{pending:true});}
    });
    return true;
  }
  function cdsCanStop(setup,ctx){
    if(!cdsIsReady(setup,ctx)||!started)return false;
    const me=ROLES.indexOf(ctx.role);if(me<0)return false;
    if(cdsStoredStops(setup)[ctx.role]!==null||cdsPending(ctx,setup)!==null)return false;
    return scene.canStop(me);
  }
  // The tap: the stop, computed once and saved on this phone before anything is sent (kept in memory if storage refuses
  // it). null when STOP is not allowed now.
  function cdsTap(setup,ctx){
    if(!cdsCanStop(setup,ctx))return null;
    const me=ROLES.indexOf(ctx.role),stop=scene.tap(me);
    if(!cdsValidStop(stop))return null;
    cdsSavePending(ctx,setup,stop);
    return stop;
  }
  // Firebase holds this manager's stop (the reply of his confirm, or a re-read): the ball may rest on the stored one.
  function cdsAccepted(setup,ctx){
    const stop=cdsStoredStops(setup)[ctx.role];if(stop===null)return false;
    cdsClearPending(ctx);if(cdsIsReady(setup,ctx))scene.accept(ROLES.indexOf(ctx.role),stop);return true;
  }
  function cdsPhaseOf(setup,ctx,index){return cdsIsReady(setup,ctx)?scene.state(index):"";}
  function cdsHasLanded(index){return Boolean(landed[index===1?1:0]);}
  function cdsBothLanded(){return landed[0]&&landed[1];}
  function cdsOn(fn){if(typeof fn!=="function")return ()=>{};listeners.add(fn);return ()=>listeners.delete(fn);}
  function cdsDispose(){
    mounting=null;
    if(scene){try{scene.dispose();}catch(_error){}}
    scene=null;sceneKey="";landed=[false,false];started=false;flat=null;lastState=["",""];
    const stage=cdsDoc()&&cdsDoc().getElementById(STAGE_ID);if(stage){stage.replaceChildren();delete stage.dataset.drawKind;}
    return true;
  }
  function cdsProbe(){return scene&&typeof scene.probe==="function"?{flat:Boolean(flat),started,landed:landed.slice(),...scene.probe()}:null;}

  return Object.freeze({contractVersion:1,feature:"cms-club-draw-step",PENDING_KEY,STAGE_ID,
    isDraw:cdsIsDraw,candidates:cdsCandidates,digest:cdsDigest,clubFor:cdsClubFor,storedStops:cdsStoredStops,
    preload:cdsPreload,prepare:cdsPrepare,isReady:cdsIsReady,sync:cdsSync,canStop:cdsCanStop,tap:cdsTap,accepted:cdsAccepted,pending:cdsPending,sendable:cdsSendable,unsaved:cdsUnsaved,clearPending:cdsClearPending,phaseOf:cdsPhaseOf,hasLanded:cdsHasLanded,bothLanded:cdsBothLanded,on:cdsOn,dispose:cdsDispose,probe:cdsProbe});
});
