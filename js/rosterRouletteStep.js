(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRosterRouletteStep=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Russian Roster Roulette, the season step (Nik 2026-10-28/29/30; look = Team V HO-040, approved 29 Oct). Every season,
  // before this manager's Transfer Challenge opens, both spins play in Team V's page in a full-screen frame, Daniel first, with
  // the outcome from js/rosterRoulette.js (the Showdown id decides, so both phones agree; HO040-M1); then he confirms the
  // release in his FIFA 17 save. The app never releases anyone itself. The boards build themselves (Nik 2026-10-30): the
  // FIFA 17 launch board excluding the Special Player, then each season's shot player out and kept signings in by position and overall, from
  // last seasons' Transfer War verdicts and saved shots (kept on this phone when they were shown; otherwise plain reads of
  // both verdict documents and the saved spins per missing season, all seasons at once; F2-12). No board is saved anywhere and nobody types one.
  // Shown once per manager per season on this browser (the watched spin is not replayed); never for a Showdown confirmed
  // before r87. A page that fails to load skips only the animation: the result and the release still show. Anything else that
  // fails (engine, data, an error) keeps the Transfer Challenge closed behind TRY AGAIN / BACK (red team R87-B-02): the seeded
  // shot still counts on later boards, so a manager must never reach the window without being told about it.
  const PAGE="visual-assets/v10_1/roulette/index.html";
  const STAGE_ID="rrStage",PANEL_ID="rrStepPanel";
  const DONE_KEY="careerModeShowdown.rouletteDone.v1",WATCHED_KEY="careerModeShowdown.rouletteWatched.v1",KEYS_MAX=60;
  // RRR_FROM_MS is the 2.0.0 release time (red team R87-C-07): a Showdown confirmed before it (played on 1.9.10) gets no
  // roulette. It and js/sparkSharedTransferChallenge.js ROULETTE_FROM_MS are one value, set only by
  // `node tools/set-release-time.cjs <UTC time>` (release contract r86-release RR5 checks they match).
  const RRR_FROM_MS=Date.parse("2026-11-02T04:00:00Z");
  const MIN_LOADING_MS=1000,MAX_LOADING_MS=15000,LOAD_WAIT_MS=10000,ARMED_WAIT_MS=5000;
  const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const sceneFailedHere=new Set();
  // holding (Fable F2-17): from START until close() (or the way back to Home), so the screens that open the Transfer Challenge
  // keep counting the roulette as on screen while its release is saved and the window is navigated to. loading: the Reus Gate
  // loading screen, held from START until a card or the scene is ready (Fable F2-13).
  let running=null,leftForHome=false,holding=false,loading=null,loadingShows=0,loadingPrior=null;

  function rrsDoc(){return root.document||null;}
  function rrsWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
  function rrsOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function rrsKey(ctx){return `${ctx.rivalryId}|${ctx.season}|${ctx.managerRole}`;}
  // Both lists go through the app's storage helpers (js/storage.js), like every other browser-kept value.
  function rrsList(key){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(key)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];}catch(_error){return [];}}
  function rrsHas(key,item){return rrsList(key).includes(item);}
  function rrsMark(key,item){try{const list=rrsList(key).filter(value=>value!==item);list.push(item);if(typeof root.writeStorageValue==="function")root.writeStorageValue(key,JSON.stringify(list.slice(-KEYS_MAX)));}catch(_error){}}
  async function rrsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
  // The Special Player draw (data/marqueePlayers.js + js/marqueePlayer.js), also wanted by the Transfer War signing form
  // (R87-SP-02) when this season's roulette is already done on this browser (Fable F2-06).
  // Fable F6-05: the load wait counts only time the page is on screen (rrsVisibleWait), so a phone locked on a cold cache
  // does not come back to "The roulette could not load".
  function rrsLoadWait(loads){let stop=()=>{};const timeout=new Promise(resolve=>{stop=rrsVisibleWait(LOAD_WAIT_MS,()=>resolve(false));});return Promise.race([loads,timeout]).finally(()=>stop());}
  function rrsEnsureDraw(){
    const loads=Promise.all([
      rrsLoad("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers)),
      rrsLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer))
    ]).then(list=>list.every(Boolean),()=>false);
    return rrsLoadWait(loads);
  }
  async function rrsEnsure(){
    const loads=Promise.all([
      rrsLoad("fifa17-players","data/fifa17Players.js",()=>Boolean(root.CareerModeFifa17Players)),
      rrsLoad("roster-squads","data/rosterSquads.js",()=>Boolean(root.CareerModeRosterSquads)),
      rrsLoad("roster-roulette","js/rosterRoulette.js",()=>Boolean(root.CareerModeRosterRoulette)),
      rrsLoad("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers)),
      rrsLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer)),
      typeof root.loadRuntimeStyle==="function"?Promise.resolve(root.loadRuntimeStyle("roulette-step","css/v10Roulette.css")).then(()=>true,()=>true):true
    ]).then(list=>list.every(Boolean),()=>false);
    return rrsLoadWait(loads);
  }

  // ctx = {rivalryId, managerRole, season, clubs:{playerOne,playerTwo}, confirmedAtMs, phase, verdicts(k)} from the Transfer
  // Challenge. True when this manager still has this season's roulette to do on this browser.
  function rrsDecide(ctx){
    if(root.CMS_ROSTER_ROULETTE==="off"||!ctx)return false;
    if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
    if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
    if(!ctx.clubs||!ctx.clubs.playerOne||!ctx.clubs.playerTwo||ctx.phase==="COMPLETED")return false;
    if(!Number.isFinite(ctx.confirmedAtMs)||ctx.confirmedAtMs<RRR_FROM_MS)return false;
    const key=rrsKey(ctx);
    return !rrsHas(DONE_KEY,key);
  }

  // ---------- the panel (marble, like Career Start; no scrim: it sits on the scene or the page as an opaque card) ----------
  function rrsEl(tag,className,text){const node=rrsDoc().createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function rrsButton(label,className,onClick){const button=rrsEl("button",className,label);button.type="button";button.addEventListener("click",onClick);return button;}
  function rrsRemovePanel(){const panel=rrsDoc()?.getElementById(PANEL_ID);if(panel)panel.remove();}
  function rrsPanel(ctx,heading,label){
    rrsRemovePanel();
    const overlay=rrsEl("div","remoteJoiningOverlay rrStepOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label",label);
    const shell=rrsEl("div","remoteJoiningShell rrStepShell"),header=rrsEl("div","remoteJoiningHeader");
    header.append(rrsEl("strong","",`SEASON ${ctx.season} · RUSSIAN ROSTER ROULETTE`));
    const body=rrsEl("div","rrStepBody");body.append(rrsEl("h2","rrStepTitle",heading));
    // No finished scene behind the card (WebGL missing, scene seen before a reload, history retry): stand it in the room, never on the page below.
    if(!rrsDoc().getElementById(STAGE_ID))overlay.classList.add("rrStepRoom");
    shell.append(header,body);overlay.append(shell);rrsDoc().body.append(overlay);
    return {overlay,body};
  }
  // A choice panel: resolves with the id of the button pressed. The card takes over from the loading screen; TRY AGAIN brings
  // the loading screen back over the card until the next card or the scene is ready (Reus Gate, Fable F2-13).
  function rrsAsk(ctx,{heading,label,lines=[],note="",buttons}){
    return new Promise(resolve=>{
      const {body}=rrsPanel(ctx,heading,label);rrsLoadingOff();
      for(const line of lines)body.append(rrsEl("p","rrStepLine",line));
      if(note)body.append(rrsEl("p","rrStepNote",note));
      const row=rrsEl("div","rrStepActions");
      // Fable F11-12: one answer per card; the buttons go quiet at once (saving the spin can take a few seconds after GO).
      const pressed=[];
      for(const b of buttons){const button=rrsButton(b.label,b.primary?"menuButton rrStepPrimary":"backButton",()=>{for(const other of pressed)other.disabled=true;if(b.id==="retry")rrsLoadingOn();resolve(b.id);});pressed.push(button);row.append(button);}
      body.append(row);row.querySelector("button")?.focus();
    });
  }

  // ---------- season 2+: this manager's board ----------
  // The same rules as the engine and the Rules (js/rosterRoulette.js normalizeBoard), with a reason a person can act on.
  // Fable F2-09: the true reason for each answer; "the connection" only when it was the connection.
  function rrsReadError(result,season){
    const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(result);if(quota)return quota;
    const code=String(result&&result.code||"");
    if(/permission/i.test(code))return `Season ${season}'s Transfer War could not be read: the Showdown is not open here. Go back to Showdown Home and open it again.`;
    if(code==="TRANSFER_NOT_COMPLETED")return `Season ${season}'s Transfer War never reached its verdicts, and this season's boards are built from them. Nothing was spun or saved.`;
    if(/STALE|MISMATCH/.test(code))return `This Showdown moved on while this screen was open, so Season ${season}'s Transfer War no longer matches it. Go back to Showdown Home and open it again.`;
    if(!code||/unavailable|deadline|offline|network|aborted|timeout|PROVIDER_FAILED/i.test(code))return `Season ${season}'s Transfer War could not be reached: the connection dropped. Try again when it is back.`;
    return `Season ${season}'s Transfer War could not be read (${code}). Nothing was spun or saved.`;
  }
  // The Special Players both phones drew for this Showdown (js/marqueePlayer.js): {role:{name, overall, number,
  // sourceName}}, or null for a Showdown confirmed before the Special Player. The engine excludes BOTH from both boards
  // (red team R87-C-01) by his own squad database row: name + shirt number (R87-C-05), under the database name when it
  // differs from the display name (R87-D-01, data/marqueePlayers.js sourceNames).
  function rrsSpecial(ctx){
    const draw=root.CareerModeMarqueePlayer,picks=draw&&draw.forShowdown(ctx.rivalryId,ctx.confirmedAtMs,{clubs:ctx.clubs});
    const sourceNames=(root.CareerModeMarqueePlayers&&root.CareerModeMarqueePlayers.sourceNames)||{};
    return picks?Object.fromEntries(ROLES.map(role=>[role,{name:picks[role].name,overall:picks[role].overall,number:picks[role].number,
      sourceName:Object.prototype.hasOwnProperty.call(sourceNames,picks[role].name)?sourceNames[picks[role].name]:null}])):null;
  }
  /* rrsSpecial end */
  // A cosmetic seed for the scene (red team R87-C-06): from the Showdown id and the season, the same on both phones.
  function rrsSeed(ctx){return (parseInt(String(ctx.rivalryId).slice(-8),16)^Math.imul(ctx.season,0x9E3779B1))>>>0;}
  // history[k] = both managers' Transfer War verdicts of season k, for every season before this one; null when the
  // manager leaves.
  // F2-02: also the outcomes each season's spin marks saved (hits[k], or null when that season has none): the engine replays
  // them as the authority. F2-12: all missing seasons are asked for at once; TRY AGAIN asks again only for those that failed.
  async function rrsHistory(ctx,hits){
    const history=[null];
    const first=new Map();for(let k=1;k<ctx.season;k+=1)first.set(k,Promise.resolve(ctx.verdicts(k)).catch(()=>null));
    for(let k=1;k<ctx.season;k+=1){
      for(let attempt=0;;attempt+=1){
        const result=attempt===0?await first.get(k):await ctx.verdicts(k);
        if(result&&result.ok){history.push(result.verdicts);hits[k]=result.hits||null;break;}
        const choice=await rrsAsk(ctx,{heading:"Building the boards",label:"Building the boards",lines:[rrsReadError(result,k)],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
        if(choice==="back")return null;
      }
    }
    return history;
  }

  // ---------- the spins (Team V's page in a frame) ----------
  function rrsShowLoading(){
    const doc=rrsDoc(),el=doc&&doc.getElementById("loadingScreen");if(!el)return {hide(){}};
    // A show during the previous fade keeps the words from before the roulette, not its own.
    const text=doc.getElementById("loadingText"),fading=Boolean(loadingPrior&&el.classList.contains("is-exiting")&&!el.hidden);
    const priorText=fading?loadingPrior.text:text?text.textContent:"",priorLabel=fading?loadingPrior.label:el.getAttribute("aria-label");loadingPrior={text:priorText,label:priorLabel};
    el.style.transition="none";el.classList.remove("is-exiting","hidden");el.hidden=false;el.removeAttribute("aria-hidden");el.setAttribute("aria-busy","true");el.setAttribute("aria-label","Loading the revolver");
    if(text)text.textContent="LOADING THE REVOLVER";
    void el.offsetWidth;el.style.transition="";
    const shows=++loadingShows;let hidden=false;
    return {hide(){
      if(hidden)return;hidden=true;el.setAttribute("aria-hidden","true");el.setAttribute("aria-busy","false");el.classList.add("is-exiting");
      root.setTimeout(()=>{if(shows!==loadingShows)return;/* shown again (TRY AGAIN) during the fade */el.hidden=true;el.classList.add("hidden");if(text)text.textContent=priorText;if(priorLabel!==null)el.setAttribute("aria-label",priorLabel);},240);
    }};
  }
  function rrsLoadingOn(){if(!loading)loading=rrsShowLoading();}
  function rrsLoadingOff(){const shown=loading;loading=null;if(shown)shown.hide();}
  // A wait that only counts time the page was on screen (Fable F2-07): a phone locked or switched away while the scene loads
  // does not use up the wait, so a scene that would have worked is not skipped the moment the manager comes back.
  function rrsVisibleWait(ms,onTimeout){
    const doc=rrsDoc();let timer=null,stopped=false,away=false;
    const hidden=()=>Boolean(doc&&doc.visibilityState==="hidden");
    const onVisibility=()=>{if(hidden())away=true;};
    const arm=()=>{timer=root.setTimeout(()=>{if(stopped)return;if(away||hidden()){away=hidden();arm();return;}stop();onTimeout();},ms);};
    const stop=()=>{stopped=true;root.clearTimeout(timer);doc?.removeEventListener?.("visibilitychange",onVisibility);};
    doc?.addEventListener?.("visibilitychange",onVisibility);arm();
    return stop;
  }
  function rrsRemoveStage(){const stage=rrsDoc()?.getElementById(STAGE_ID);if(stage)stage.remove();}
  function rrsCreateStage(ctx){
    const doc=rrsDoc();rrsRemoveStage();
    const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Russian Roster Roulette");
    stage.style.cssText="position:fixed;inset:0;z-index:95;background:#050403;visibility:hidden";
    const frame=doc.createElement("iframe");frame.title="Russian Roster Roulette";
    const base=typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(PAGE):PAGE;
    frame.src=`${base}${base.includes("?")?"&":"?"}embed=1&d=${encodeURIComponent(ctx.clubs.playerOne)}&n=${encodeURIComponent(ctx.clubs.playerTwo)}`;
    frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#050403";
    stage.append(frame);doc.body.append(stage);
    return {stage,frame};
  }
  function rrsListen(frame){
    const origin=root.location&&root.location.origin;let onReady,onDone,onArmed;
    const ready=new Promise(resolve=>{onReady=resolve;}),done=new Promise(resolve=>{onDone=resolve;}),armed=new Promise(resolve=>{onArmed=resolve;});
    const handler=event=>{
      if(event.source!==frame.contentWindow||event.origin!==origin||!event.data)return;
      if(event.data.type==="cms-rr-ready")onReady("ready");
      else if(event.data.type==="cms-rr-armed")onArmed("armed");
      else if(event.data.type==="cms-rr-error"){onReady("error");onArmed("error");onDone("error");}
      else if(event.data.type==="cms-rr-continue")onDone("continue");
    };
    root.addEventListener("message",handler);
    // A page that loads without its 3D library, or not at all, is dropped at once instead of after the full wait.
    frame.addEventListener("load",()=>{try{const view=frame.contentWindow;if(view&&String(view.location.href)==="about:blank")return;if(!view||!view.THREE)onReady("error");}catch(_error){onReady("error");}});
    frame.addEventListener("error",()=>onReady("error"));
    const stopWait=rrsVisibleWait(MAX_LOADING_MS,()=>onReady("timeout"));
    return {ready:ready.finally(stopWait),armed,done,stop(){root.removeEventListener("message",handler);stopWait();}};
  }
  // "watched" when both spins played to the end, "skipped" when the page could not run (the result still shows).
  async function rrsScene(ctx,plan){
    // The loading screen (held since START) covers a card left from a TRY AGAIN; the card goes now, so it can never stand over
    // the scene with dead buttons (Fable F2-03).
    rrsLoadingOn();rrsRemovePanel();
    const shownAt=Date.now();let channel=null,stage=null,frame=null;
    try{
      ({stage,frame}=rrsCreateStage(ctx));channel=rrsListen(frame);
      if(await channel.ready!=="ready")throw new Error("Roulette page did not start.");
      const boardOf=role=>plan.boards[role].map(p=>({pos:p.pos,position:p.positions[0]||null,name:p.name||"EMPTY SLOT",special:p.special===true,rating:p.name&&p.rating>0?p.rating:null,number:p.name&&Number.isInteger(p.number)?p.number:null}));
      // The whole spin plan (red team R87-C-06): the scene loads bulletChamber, stops on stopChamber and aims at hitSlot
      // (a safe turn at aimSlot), so both phones show the same chambers and the same player.
      const turns=plan.turns.map(turn=>({fire:turn.fired,target:turn.player?turn.player.name:null,targetLabel:turn.player?rrsPlayerLabel(turn.player):null,targetNumber:turn.player?rrsPlayerFacts(turn.player).number:null,targetPosition:turn.player?rrsPlayerFacts(turn.player).position:null,targetRating:turn.player?rrsPlayerFacts(turn.player).rating:null,bulletChamber:turn.bulletChamber,stopChamber:turn.stopChamber,hitSlot:turn.hitSlot,aimSlot:turn.aimSlot}));
      frame.contentWindow.postMessage({type:"cms-rr-setup",d:ctx.clubs.playerOne,n:ctx.clubs.playerTwo,boards:{D:boardOf("playerOne"),N:boardOf("playerTwo")},formations:{D:plan.formations.playerOne,N:plan.formations.playerTwo},turns,seed:rrsSeed(ctx)},root.location.origin);
      // Red team RT5-FLOW-01: the stage stays hidden until the page says it took the setup ("cms-rr-armed"). A page that
      // drops it (its squads file failed) or never answers is removed after ARMED_WAIT_MS and the result panel shows.
      let stopArmed=()=>{};
      const armed=await Promise.race([channel.armed,new Promise(resolve=>{stopArmed=rrsVisibleWait(ARMED_WAIT_MS,()=>resolve("timeout"));})]);
      stopArmed();
      if(armed!=="armed")throw new Error("Roulette page did not take the spins.");
      const left=MIN_LOADING_MS-(Date.now()-shownAt);if(left>0)await rrsWait(left);
      stage.style.visibility="visible";
    }catch(_error){if(channel)channel.stop();sceneFailedHere.add(rrsKey(ctx));rrsRemoveStage();return "skipped";}// the result card takes over from the loading screen
    rrsLoadingOff();
    try{frame.focus();}catch(_error){}
    const end=await channel.done;channel.stop();
    if(end!=="continue"){sceneFailedHere.add(rrsKey(ctx));rrsRemoveStage();return "skipped";}// F11-11: never a dead frame under the card
    return "watched";
  }

  // ---------- the result and the release ----------
  // Codex C2-01: a name alone does not tell namesakes apart (Alavés has a Manu García #19 and #26), so the release names the
  // shirt number (when the squad lists one), the position and the overall.
  function rrsPlayerFacts(p){
    const number=Number.isInteger(p&&p.number)?p.number:null,position=(p&&Array.isArray(p.positions)&&p.positions[0])||(p&&p.pos&&p.pos!=="SUB"?p.pos:null),rating=p&&Number.isInteger(p.rating)&&p.rating>0?p.rating:null;
    return {number,position,rating};
  }
  function rrsPlayerLabel(p){
    const f=rrsPlayerFacts(p),parts=[f.number!==null?`#${f.number}`:null,f.position,f.rating!==null?`${f.rating} overall`:null].filter(Boolean);
    return parts.length?`${p.name} (${parts.join(", ")})`:String(p.name);
  }
  function rrsOutcomeLine(turn){return turn.fired?`${NAMES[turn.role]} lost ${rrsPlayerLabel(turn.player)}.`:`${NAMES[turn.role]}: empty chamber. Squad safe.`;}
  // F2-19 (Fable job 2): a kept signing the board rules keep off is said in one line, never dropped silently. Signings are known
  // by name only, so a name the roulette shot, a Special Player's, or a guessed and released signing's keeps him off the board.
  const RRS_SKIP_WHY=Object.freeze({
    shot:name=>`the roulette shot a ${name}, and a shot player never comes back.`,
    special:name=>`${name} is a Special Player's name, and a Special Player is never on a board.`,
    guessed:name=>`a ${name} was guessed and released in the Transfer War, and a released player stays off the board.`,
    reserve:name=>`${name} waits in your reserves: every starter in his line and every sub has a higher overall.`});
  function rrsSkippedLines(plan,role){
    const list=plan&&plan.skipped&&Array.isArray(plan.skipped[role])?plan.skipped[role]:[];
    return list.filter(item=>item&&typeof item.name==="string"&&RRS_SKIP_WHY[item.reason]).map(item=>`${item.name} (signed in season ${item.season}) is not on your board: ${RRS_SKIP_WHY[item.reason](item.name)}`);
  }
  async function rrsResult(ctx,plan){
    const mine=plan.turns.find(turn=>turn.role===ctx.managerRole);
    const lines=[...plan.turns.map(rrsOutcomeLine),...rrsSkippedLines(plan,ctx.managerRole)];
    const choice=mine.fired
      ?await rrsAsk(ctx,{heading:`Release ${mine.player.name}${Number.isInteger(mine.player.number)?` #${mine.player.number}`:""}`,label:"Release your player",lines,
        note:`Release ${rrsPlayerLabel(mine.player)} in your FIFA 17 save now, before the transfer window. The game can't do it for you.`,
        buttons:[{id:"go",label:"I'VE RELEASED HIM",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]})
      :await rrsAsk(ctx,{heading:"Your squad is safe",label:"Your squad is safe",lines,note:"Your squad stays as it is this season.",
        buttons:[{id:"go",label:"GO TO THE TRANSFER WINDOW",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
    return choice==="go";
  }

  // ---------- F2-02 / F2-10: the spin marks on the server ----------
  // ctx.marks = this season's marks as the Transfer Challenge read them ({playerOne, playerTwo}: true, an outcome, or null), or
  // null once the window opened (both managers had spun: START needs both marks). An outcome is {fired, hitName, hitNumber,
  // hitSlot, hitSignedSeason, version}.
  function rrsOutcomeOf(entry){return entry&&typeof entry==="object"&&typeof entry.fired==="boolean"&&typeof entry.version==="string"?entry:null;}
  function rrsSpunOnServer(ctx){return ctx.windowStarted===true||Boolean(ctx.marks&&ctx.marks[ctx.managerRole]);}
  // F2-02: the partner spun this season on a different version of the game (another build, or other squad data), so the two
  // phones could show different players. Said plainly, never a silent desync. TRY AGAIN reads the marks again (after either
  // phone was updated); the partner's saved spin stands for him either way, so CONTINUE goes on with it as the authority.
  async function rrsVersionStop(ctx,version){
    for(;;){
      const partner=rrsOutcomeOf(ctx.marks&&ctx.marks[rrsOther(ctx.managerRole)]);
      if(!version||!partner||partner.version===version||rrsSpunOnServer(ctx)&&ctx.marks&&ctx.marks[ctx.managerRole])return true;
      const name=NAMES[rrsOther(ctx.managerRole)];
      const choice=await rrsAsk(ctx,{heading:"Update the game on the other phone",label:"Update the game on the other phone",
        lines:[`${name} spun this season's roulette on a different version of the game, so the two phones could show different players.`,`Update the game on ${name}'s phone: close it fully and open it again. If yours is the one behind, do the same on yours. Then tap TRY AGAIN.`],
        note:`Your version: ${version} · ${name}'s spin: ${partner.version}. ${name}'s saved spin stands for him either way.`,
        buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"continue",label:`CONTINUE WITH ${name.toUpperCase()}'S SAVED SPIN`},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
      if(choice==="back")return false;
      if(choice==="continue")return true;
      if(typeof ctx.refreshMarks==="function"){try{const next=await ctx.refreshMarks();if(next&&typeof next==="object"){ctx.marks=next.marks===undefined?ctx.marks:next.marks;ctx.windowStarted=next.windowStarted===true;}}catch(_error){}}
    }
  }

  // Fable F2-04: why no plan could be built, in words a manager can act on (the engine only answers null).
  function rrsNoPlanReason(ctx,engine,history){
    for(const role of ROLES){
      const club=ctx.clubs[role];
      if(!engine.board(club)||!root.CareerModeFifa17Players?.clubs?.[club])return `There is no FIFA 17 squad for ${club} in this version of the app, so this season's boards cannot be built. Nothing was spun or saved.`;
    }
    for(let k=1;k<ctx.season;k+=1)if(!history[k]||!ROLES.every(role=>Array.isArray(history[k][role])))return `Season ${k}'s Transfer War verdicts could not be used to build this season's boards. Nothing was spun or saved.`;
    return "This season's boards could not be built. Nothing was spun or saved.";
  }
  async function rrsRun(ctx){
    if(!rrsDecide(ctx)||!rrsDoc())return true;
    rrsLoadingOn();
    while(!await rrsEnsure()){
      const choice=await rrsAsk(ctx,{heading:"Loading the roulette",label:"Loading the roulette",lines:["The roulette could not load. Check the connection and try again."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
      if(choice==="back")return false;
    }
    const engine=root.CareerModeRosterRoulette,key=rrsKey(ctx),special=rrsSpecial(ctx);
    const version=typeof engine.version==="function"?engine.version(ctx.clubs,{special}):null;
    if(!await rrsVersionStop(ctx,version))return false;
    const hits={};
    const history=ctx.season>1?await rrsHistory(ctx,hits):[null];if(!history)return false;
    // This season: a saved mark (this manager's own on a second browser, the partner's always) is the authority for that turn.
    hits[ctx.season]=Object.fromEntries(ROLES.map(role=>[role,rrsOutcomeOf(ctx.marks&&ctx.marks[role])]));
    // Never skipped (Nik 2026-10-31): a short squad shows empty slots and the bullet only hits a real player. A club the data
    // does not know is named before the engine runs (Fable S4); no plan is never marked done (Fable F2-04): the window stays
    // shut and the card says why, with the way back to Showdown Home.
    const known=ROLES.every(role=>engine.board(ctx.clubs[role])&&root.CareerModeFifa17Players?.clubs?.[ctx.clubs[role]]);
    const plan=known?engine.forSeason(ctx.rivalryId,ctx.clubs,ctx.season,{special,history,hits}):null;
    if(!plan||plan.turns.some(turn=>turn.fired&&!turn.player)){
      const reason=plan?"This season's spin could not find the player it hit. Nothing was spun or saved.":rrsNoPlanReason(ctx,engine,history);
      await rrsAsk(ctx,{heading:"No roulette board",label:"No roulette board",lines:[reason],note:"The transfer window stays shut until this season's roulette can run.",buttons:[{id:"back",label:"BACK TO SHOWDOWN HOME",primary:true}]});
      return false;
    }
    // F2-10: the server already holds this manager's spin for this season (another browser or tab, or cleared storage): the
    // result card shows it at once, with no second spin.
    const spun=rrsSpunOnServer(ctx);
    if(spun)rrsMark(WATCHED_KEY,key);
    if(!spun&&!rrsHas(WATCHED_KEY,key)&&!sceneFailedHere.has(key)){
      const scene=await rrsScene(ctx,plan);
      if(scene==="watched")rrsMark(WATCHED_KEY,key);
    }
    const go=await rrsResult(ctx,plan);
    if(!go)return false;
    // F2-02: the outcome this manager's mark records (only while the server has none for him this season).
    if(!spun&&typeof ctx.remember==="function"&&typeof engine.outcome==="function"){try{ctx.remember(engine.outcome(plan,ctx.managerRole,version));}catch(_error){}}
    rrsMark(DONE_KEY,key);
    return true;
  }
  // An unexpected error asks TRY AGAIN / BACK; the same seeded plan is rebuilt on retry and nothing is marked done.
  async function rrsRunGuarded(ctx){
    for(;;){
      try{return await rrsRun(ctx);}
      catch(_error){
        rrsRemoveStage();
        const choice=await rrsAsk(ctx,{heading:"The roulette hit a problem",label:"The roulette hit a problem",lines:["This season's spins could not be built. Nothing was spun or saved."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
        if(choice==="back")return false;
      }
    }
  }
  // Resolves true when the Transfer Challenge may open, false when the manager went back to Showdown Home (or the step could
  // not even show its panel). Never rejects, and never opens the Transfer Challenge without this season's result.
  // The panel and the stage stay up until close() so nothing shows between them and the next screen.
  function rrsRunBeforeTransfers(ctx){
    if(running)return running;
    leftForHome=false;holding=true;
    const run=Promise.resolve().then(()=>rrsRunGuarded(ctx)).catch(()=>false).then(go=>{
      // Fable F11-08 (Reus Gate): the roulette and the loading screen stay up until Showdown Home is on screen, so Career Start
      // or the Club screen never flashes in between. A new run started meanwhile keeps its own panel and stage.
      if(go===false){leftForHome=true;holding=false;rrsLoadingOn();const tear=()=>{if((running&&running!==run)||holding)return;rrsRemovePanel();rrsRemoveStage();rrsLoadingOff();};
        if(typeof root.navigateTo==="function")void Promise.resolve().then(()=>root.navigateTo("mainMenu")).catch(()=>{}).finally(tear);else tear();}
      return go!==false;
    }).finally(()=>{if(running===run)running=null;});
    running=run;return run;
  }
  function rrsClose(){holding=false;rrsRemovePanel();rrsRemoveStage();rrsLoadingOff();return true;}
  // Red team R87-SP-02: for the Transfer War signing form, is a typed name this manager's own Special Player? The draw is
  // loaded before every window opens (ensureDraw, also when the roulette is already done here: Fable F2-06); false when the
  // Showdown has none.
  function rrsIsOwnSpecial(rivalryId,confirmedAtMs,role,name,clubs){
    const draw=root.CareerModeMarqueePlayer;
    try{return Boolean(draw&&typeof draw.isOwnSpecial==="function"&&draw.isOwnSpecial(rivalryId,confirmedAtMs,role,name,clubs));}catch(_error){return false;}
  }
  // For the screens that open the Transfer Challenge: a roulette is on screen (its pace is the manager's, so no load timeout
  // may end it), and whether the last one ended with the manager going back to Showdown Home (not a failure).
  function rrsActive(){return Boolean(running)||holding;}
  function rrsWentHome(){return leftForHome;}
  // Fable F2-11: a new open forgets an earlier BACK, so a later failure that never reached the roulette is not read as one.
  function rrsForgetHome(){leftForHome=false;return true;}

  return Object.freeze({contractVersion:1,feature:"cms-roster-roulette-step",page:PAGE,stageId:STAGE_ID,panelId:PANEL_ID,doneKey:DONE_KEY,watchedKey:WATCHED_KEY,fromMs:RRR_FROM_MS,decide:rrsDecide,runBeforeTransfers:rrsRunBeforeTransfers,close:rrsClose,active:rrsActive,wentHome:rrsWentHome,forgetHome:rrsForgetHome,ensureDraw:rrsEnsureDraw,isOwnSpecial:rrsIsOwnSpecial});
});
