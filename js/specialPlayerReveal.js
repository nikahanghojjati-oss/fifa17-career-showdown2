(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSpecialPlayerReveal=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r86 Special Player reveal (Nik 2026-10-27, look = Team V HO-035): after Club Assignment, before Career Start, each
  // manager watches both Special Players come out of a pack, on Team V's page in a full-screen frame. The draw is
  // js/marqueePlayer.js (no read, no write). The loading screen stays up until the page has drawn its first frame (Reus
  // Gate: at least 1 s, at most 15 s); a page that fails or is too slow is skipped and Career Start opens as before.
  // Shown once per manager per Showdown on this browser; never for a Showdown confirmed before r86.
  // r86 (red team #1): "seen" is kept as soon as the reveal is shown, and a skipped reveal counts as seen too, both on this
  // browser's storage. Before, a reload in season 1 (before Continue, or after a skip) ran the reveal again over the live game.
  const PAGE="visual-assets/v10_1/special-player/index.html";
  const STAGE_ID="specialPlayerStage";
  const SEEN_KEY="careerModeShowdown.specialPlayerSeen.v1",SEEN_MAX=40;
  const MIN_LOADING_MS=1000,MAX_LOADING_MS=15000,REFRESH_WAIT_MS=5000;
  const LOADING_TEXT="PREPARING YOUR SPECIAL PLAYERS";
  let running=null;

  function spDoc(){return root.document||null;}
  function spWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
  function spKey(state){return `${state.rivalryId}|${state.managerRole}`;}
  // The seen list goes through the app's storage helpers (js/storage.js), like every other browser-kept value.
  function spSeenList(){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(SEEN_KEY)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];}catch(_error){return [];}}
  function spSeen(key){return spSeenList().includes(key);}
  function spMarkSeen(key){try{const list=spSeenList().filter(item=>item!==key);list.push(key);if(typeof root.writeStorageValue==="function")root.writeStorageValue(SEEN_KEY,JSON.stringify(list.slice(-SEEN_MAX)));}catch(_error){}}
  async function spLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
  async function spEnsureDraw(){
    return await spLoad("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers))&&await spLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer));
  }
  // {key, d, n} (Daniel's and Nik's rows in the list) when this manager should see the reveal now, else null.
  function spDecide(state){
    if(root.CMS_SPECIAL_PLAYER_REVEAL==="off")return null;
    if(!state||state.ready!==true||!state.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||!state.rivalryId||!state.managerRole)return null;
    const key=spKey(state);if(spSeen(key))return null;
    const draw=root.CareerModeMarqueePlayer,list=root.CareerModeMarqueePlayers;
    if(!draw||!list||!Array.isArray(list.players)||!Number.isFinite(state.setupUpdatedAtMs))return null;
    if(!draw.forShowdown(state.rivalryId,state.setupUpdatedAtMs))return null;
    const picks=draw.picks(state.rivalryId,list.players.length);
    return picks?{key,d:picks.playerOne,n:picks.playerTwo}:null;
  }
  // The confirm time comes with every Setup read; a manager whose last Setup state came from their own confirm tap has none yet.
  async function spSetupState(setupApi){
    let state=setupApi.getState();
    if(state&&state.ready===true&&!Number.isFinite(state.setupUpdatedAtMs)&&typeof setupApi.refresh==="function"){
      await Promise.race([Promise.resolve(setupApi.refresh()).catch(()=>null),spWait(REFRESH_WAIT_MS)]);state=setupApi.getState();
    }
    return state;
  }
  function spShowLoading(){
    const doc=spDoc(),el=doc&&doc.getElementById("loadingScreen");if(!el)return {hide(){}};
    const text=doc.getElementById("loadingText"),priorText=text?text.textContent:"",priorLabel=el.getAttribute("aria-label");
    el.style.transition="none";el.classList.remove("is-exiting","hidden");el.hidden=false;el.removeAttribute("aria-hidden");el.setAttribute("aria-busy","true");el.setAttribute("aria-label","Preparing your Special Players");
    if(text)text.textContent=LOADING_TEXT;
    void el.offsetWidth;el.style.transition="";
    let hidden=false;
    return {hide(){
      if(hidden)return;hidden=true;el.setAttribute("aria-hidden","true");el.setAttribute("aria-busy","false");el.classList.add("is-exiting");
      root.setTimeout(()=>{el.hidden=true;el.classList.add("hidden");if(text)text.textContent=priorText;if(priorLabel!==null)el.setAttribute("aria-label",priorLabel);},240);
    }};
  }
  function spRemoveStage(){const stage=spDoc()?.getElementById(STAGE_ID);if(stage)stage.remove();}
  function spCreateStage(pick){
    const doc=spDoc();spRemoveStage();
    const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Your Special Players");
    stage.style.cssText="position:fixed;inset:0;z-index:95;background:#050403;visibility:hidden";
    const frame=doc.createElement("iframe");frame.title="Special Player reveal";frame.allow="autoplay";
    const base=typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(PAGE):PAGE;
    frame.src=`${base}${base.includes("?")?"&":"?"}embed=1&d=${pick.d}&n=${pick.n}`;
    frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#050403";
    stage.append(frame);doc.body.append(stage);
    return {stage,frame};
  }
  // Resolves "ready", "error" or "timeout"; then waits for the Continue tap.
  function spListen(frame){
    const origin=root.location&&root.location.origin;let onReady,onContinue;
    const ready=new Promise(resolve=>{onReady=resolve;}),cont=new Promise(resolve=>{onContinue=resolve;});
    const handler=event=>{
      if(event.source!==frame.contentWindow||event.origin!==origin||!event.data)return;
      if(event.data.type==="cms-sp-ready")onReady("ready");
      // An error after "ready" (the animation failing before Continue) also ends the Continue wait, so the stage is removed
      // and Career Start opens instead of the manager being stuck on a broken reveal (Codex P2 on #1035).
      else if(event.data.type==="cms-sp-error"){onReady("error");onContinue("error");}
      else if(event.data.type==="cms-sp-continue")onContinue("continue");
    };
    root.addEventListener("message",handler);
    // A page that loads without its 3D library, or not at all, is skipped at once instead of after the full wait.
    frame.addEventListener("load",()=>{try{const view=frame.contentWindow;if(view&&String(view.location.href)==="about:blank")return;if(!view||!view.THREE)onReady("error");}catch(_error){onReady("error");}});
    frame.addEventListener("error",()=>onReady("error"));
    const timer=root.setTimeout(()=>onReady("timeout"),MAX_LOADING_MS);
    return {ready:ready.finally(()=>root.clearTimeout(timer)),cont,stop(){root.removeEventListener("message",handler);root.clearTimeout(timer);}};
  }
  async function spRun(setupApi){
    if(!setupApi||typeof setupApi.getState!=="function")return null;
    if(root.CMS_SPECIAL_PLAYER_REVEAL==="off"||!spDoc())return null;
    if(!await Promise.race([spEnsureDraw(),spWait(REFRESH_WAIT_MS*2).then(()=>false)]))return null;
    const pick=spDecide(await spSetupState(setupApi));if(!pick)return null;
    const loading=spShowLoading(),shownAt=Date.now();let channel=null,stage=null,frame=null;
    try{
      ({stage,frame}=spCreateStage(pick));channel=spListen(frame);
      const outcome=await channel.ready;
      if(outcome!=="ready")throw new Error(`Special Player page ${outcome}.`);
      const left=MIN_LOADING_MS-(Date.now()-shownAt);if(left>0)await spWait(left);
      stage.style.visibility="visible";
      frame.contentWindow.postMessage({type:"cms-sp-start"},root.location.origin);
      spMarkSeen(pick.key);
    }catch(_error){if(channel)channel.stop();spMarkSeen(pick.key);spRemoveStage();loading.hide();return null;}
    loading.hide();
    try{frame.focus();}catch(_error){}
    const end=await channel.cont;channel.stop();
    if(end==="error"){spRemoveStage();return null;}
    return Object.freeze({close(){spRemoveStage();return true;}});
  }
  // Never rejects: any failure means no reveal, and Career Start opens as before.
  function runBeforeCareerStart(setupApi){
    if(running)return running;
    const run=Promise.resolve().then(()=>spRun(setupApi)).catch(()=>{spRemoveStage();return null;}).finally(()=>{if(running===run)running=null;});
    running=run;return run;
  }

  return Object.freeze({contractVersion:1,feature:"cms-special-player-reveal",page:PAGE,stageId:STAGE_ID,seenKey:SEEN_KEY,minLoadingMs:MIN_LOADING_MS,maxLoadingMs:MAX_LOADING_MS,decide:spDecide,runBeforeCareerStart});
});
