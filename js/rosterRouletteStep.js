(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRosterRouletteStep=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Russian Roster Roulette, the season step (Nik 2026-10-28/29; look = Team V HO-040, approved 29 Oct). Every season,
  // before this manager's Transfer Challenge opens: from season 2 he locks his board (his real XI + 4 subs, js/rosterBoardStore.js,
  // 1 write) and waits for the rival's (1 read per check); then both spins play in Team V's page in a full-screen frame, Daniel
  // first, with the outcome from js/rosterRoulette.js (the Showdown id decides, so both phones agree; HO040-M1); then he confirms
  // the release in his FIFA 17 save. The app never releases anyone itself. Season 1 uses the FIFA 17 launch boards: no edit.
  // Shown once per manager per season on this browser (the watched spin is not replayed); never for a Showdown confirmed
  // before r87. A page that fails to load skips only the animation: the result and the release still show.
  const PAGE="visual-assets/v10_1/roulette/index.html";
  const STAGE_ID="rrStage",PANEL_ID="rrStepPanel";
  const DONE_KEY="careerModeShowdown.rouletteDone.v1",WATCHED_KEY="careerModeShowdown.rouletteWatched.v1",KEYS_MAX=60;
  // RRR_FROM_MS is set to the r87 release time in the release PR.
  const RRR_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
  const MIN_LOADING_MS=1000,MAX_LOADING_MS=15000,LOAD_WAIT_MS=10000;
  const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const XI=11,BOARD=15,NAME_MAX=40;
  const failedHere=new Set(),sceneFailedHere=new Set();
  let running=null,leftForHome=false;

  function rrsDoc(){return root.document||null;}
  function rrsWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
  function rrsOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function rrsKey(ctx){return `${ctx.rivalryId}|${ctx.season}|${ctx.managerRole}`;}
  // Both lists go through the app's storage helpers (js/storage.js), like every other browser-kept value.
  function rrsList(key){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(key)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];}catch(_error){return [];}}
  function rrsHas(key,item){return rrsList(key).includes(item);}
  function rrsMark(key,item){try{const list=rrsList(key).filter(value=>value!==item);list.push(item);if(typeof root.writeStorageValue==="function")root.writeStorageValue(key,JSON.stringify(list.slice(-KEYS_MAX)));}catch(_error){}}
  async function rrsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
  async function rrsEnsure(){
    const loads=Promise.all([
      rrsLoad("roster-squads","data/rosterSquads.js",()=>Boolean(root.CareerModeRosterSquads)),
      rrsLoad("roster-roulette","js/rosterRoulette.js",()=>Boolean(root.CareerModeRosterRoulette)),
      rrsLoad("roster-board-store","js/rosterBoardStore.js",()=>Boolean(root.CareerModeRosterBoardStore)),
      typeof root.loadRuntimeStyle==="function"?Promise.resolve(root.loadRuntimeStyle("roulette-step","css/v10Roulette.css")).then(()=>true,()=>true):true
    ]).then(list=>list.every(Boolean),()=>false);
    return Promise.race([loads,rrsWait(LOAD_WAIT_MS).then(()=>false)]);
  }

  // ctx = {rivalryId, managerRole, season, clubs:{playerOne,playerTwo}, confirmedAtMs, phase, services()} from the Transfer
  // Challenge. True when this manager still has this season's roulette to do on this browser.
  function rrsDecide(ctx){
    if(root.CMS_ROSTER_ROULETTE==="off"||!ctx)return false;
    if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
    if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
    if(!ctx.clubs||!ctx.clubs.playerOne||!ctx.clubs.playerTwo||ctx.phase==="COMPLETED")return false;
    if(!Number.isFinite(ctx.confirmedAtMs)||ctx.confirmedAtMs<RRR_FROM_MS)return false;
    const key=rrsKey(ctx);
    return !failedHere.has(key)&&!rrsHas(DONE_KEY,key);
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
    shell.append(header,body);overlay.append(shell);rrsDoc().body.append(overlay);
    return {overlay,body};
  }
  // A choice panel: resolves with the id of the button pressed.
  function rrsAsk(ctx,{heading,label,lines=[],note="",buttons}){
    return new Promise(resolve=>{
      const {body}=rrsPanel(ctx,heading,label);
      for(const line of lines)body.append(rrsEl("p","rrStepLine",line));
      if(note)body.append(rrsEl("p","rrStepNote",note));
      const row=rrsEl("div","rrStepActions");
      for(const b of buttons)row.append(rrsButton(b.label,b.primary?"menuButton rrStepPrimary":"backButton",()=>resolve(b.id)));
      body.append(row);row.querySelector("button")?.focus();
    });
  }

  // ---------- season 2+: this manager's board ----------
  // The same rules as the engine and the Rules (js/rosterRoulette.js normalizeBoard), with a reason a person can act on.
  function rrsBoardProblem(rows,engine){
    const gk=rows.slice(0,XI).filter(row=>row.pos==="GK").length;
    for(let i=0;i<BOARD;i+=1){if(!rows[i].name)return `Fill in every player. ${i<XI?`Starting XI row ${i+1}`:`Sub ${i-XI+1}`} is empty.`;}
    for(const row of rows)if(row.name.length>NAME_MAX)return `"${row.name.slice(0,20)}…" is too long. Names can be ${NAME_MAX} characters at most.`;
    if(gk!==1)return gk?"Your starting XI has more than one goalkeeper. Keep exactly one GK.":"Your starting XI needs a goalkeeper. Set one position to GK.";
    const seen=new Map();
    for(const row of rows){const k=row.name.toLowerCase();if(seen.has(k))return `${row.name} is on your board twice. If two players share a name, add the shirt number, for example "${row.name} 13".`;seen.set(k,true);}
    return engine.normalizeBoard(rows)?"":"Check the board: every XI player needs a position and every name must be filled in.";
  }
  function rrsEditor(ctx,draft,engine){
    return new Promise(resolve=>{
      const {body}=rrsPanel(ctx,"Lock your squad board","Your squad board");
      body.append(rrsEl("p","rrStepLine","Set the board to your real FIFA 17 squad before the spin: your starting XI and your 4 highest-rated subs."));
      const shot=draft.find(row=>row.shotLastSeason);
      if(shot)body.append(rrsEl("p","rrStepNote",`${shot.pos!=="SUB"?`The ${shot.pos} slot`:"One sub slot"} is empty: last season's bullet took that player. Put in who plays there now.`));
      const form=rrsEl("form","rrBoardForm");form.noValidate=true;
      const xiBox=rrsEl("fieldset","rrBoardGroup"),subBox=rrsEl("fieldset","rrBoardGroup");
      xiBox.append(rrsEl("legend","","STARTING XI"));subBox.append(rrsEl("legend","","SUBS (4 HIGHEST-RATED)"));
      const inputs=[];
      draft.forEach((row,i)=>{
        const line=rrsEl("div","rrBoardRow"+(row.shotLastSeason?" rrBoardRowShot":""));
        let posInput=null;
        if(i<XI){
          posInput=rrsEl("select","rrBoardPos");posInput.id=`rrPos${i}`;posInput.setAttribute("aria-label",`Starting XI row ${i+1} position`);
          for(const pos of engine.positions.filter(p=>p!=="SUB")){const opt=rrsEl("option","",pos);opt.value=pos;if(pos===row.pos)opt.selected=true;posInput.append(opt);}
          line.append(posInput);
        }else line.append(rrsEl("span","rrBoardPos rrBoardSub","SUB"));
        const name=rrsEl("input","rrBoardName");name.id=`rrName${i}`;name.type="text";name.maxLength=NAME_MAX;name.autocomplete="off";name.spellcheck=false;name.value=row.name;
        name.placeholder=row.shotLastSeason?"Who replaced him?":"Player name";name.setAttribute("aria-label",i<XI?`Starting XI row ${i+1} player`:`Sub ${i-XI+1} player`);
        line.append(name);(i<XI?xiBox:subBox).append(line);inputs.push({pos:posInput,name});
      });
      const error=rrsEl("p","rrStepError");error.setAttribute("role","alert");
      const row=rrsEl("div","rrStepActions"),lock=rrsEl("button","menuButton rrStepPrimary","LOCK MY BOARD");lock.type="submit";
      row.append(lock,rrsButton("BACK TO SHOWDOWN HOME","backButton",()=>resolve(null)));
      form.append(xiBox,subBox,rrsEl("p","rrStepNote","A locked board can't be changed this season. The spin only uses your board, never your ratings."),error,row);
      form.addEventListener("submit",event=>{
        event.preventDefault();
        const rows=inputs.map((input,i)=>({pos:i<XI?input.pos.value:"SUB",name:input.name.value.trim().replace(/\s+/g," ")}));
        const problem=rrsBoardProblem(rows,engine);
        if(problem){error.textContent=problem;return;}
        error.textContent="";resolve(rows);
      });
      body.append(form);
      (inputs.find(input=>!input.name.value)||inputs[0]).name.focus();
    });
  }
  function rrsStoreError(result){
    const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(result);if(quota)return quota;
    if(result&&/permission/.test(String(result.code)))return "The board could not be saved: the Showdown is not open here. Go back to Showdown Home and open it again.";
    return "The board could not be reached. Check the connection and try again.";
  }
  // Returns {playerOne:rows, playerTwo:rows} once both boards for this season are locked, or null when the manager leaves.
  async function rrsBoards(ctx,engine,store){
    const me=ctx.managerRole,rival=rrsOther(me);
    const services=await ctx.services();
    const base={firestore:services.firestore,firebaseSdk:services.firebaseSdk,rivalryId:ctx.rivalryId,season:ctx.season};
    const retry=async(task,heading)=>{
      for(;;){const result=await task();if(result.ok)return result;
        const choice=await rrsAsk(ctx,{heading,label:heading,lines:[rrsStoreError(result)],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
        if(choice==="back")return null;}
    };
    let mine=await retry(()=>store.read({...base,role:me}),"Your board");if(!mine)return null;
    if(!mine.rows){
      let previous=null;
      if(ctx.season>2){const last=await retry(()=>store.read({...base,season:ctx.season-1,role:me}),"Last season's board");if(!last)return null;previous=last.rows;}
      // No board kept from last season (it was never locked): start from the launch board, nothing marked as shot.
      const draft=engine.draft(ctx.rivalryId,ctx.clubs,ctx.season,me,previous)||engine.board(ctx.clubs[me]).map(p=>({slot:p.slot,pos:p.pos,name:p.name,shotLastSeason:false}));
      const rows=await rrsEditor(ctx,draft,engine);if(!rows)return null;
      mine=await retry(()=>store.save({...base,role:me,rows,sessionId:services.sessionId,deviceId:services.deviceId}),"Your board");if(!mine)return null;
    }
    let theirs=await retry(()=>store.read({...base,role:rival}),`${NAMES[rival]}'s board`);if(!theirs)return null;
    while(!theirs.rows){
      const choice=await rrsWaitForRival(ctx,rival);
      if(choice==="back")return null;
      theirs=await retry(()=>store.read({...base,role:rival}),`${NAMES[rival]}'s board`);if(!theirs)return null;
    }
    return {[me]:mine.rows,[rival]:theirs.rows};
  }
  // Waiting for the rival's board: one read per CHECK AGAIN, and one when this page comes back into view (no timer).
  function rrsWaitForRival(ctx,rival){
    return new Promise(resolve=>{
      const doc=rrsDoc();let done=false;
      const finish=id=>{if(done)return;done=true;doc.removeEventListener("visibilitychange",onVisible);resolve(id);};
      const onVisible=()=>{if(doc.visibilityState==="visible")finish("check");};
      doc.addEventListener("visibilitychange",onVisible);
      rrsAsk(ctx,{heading:`Waiting for ${NAMES[rival]}'s board`,label:`Waiting for ${NAMES[rival]}`,
        lines:[`Your board is locked. The spin starts once ${NAMES[rival]} locks his board for season ${ctx.season} too.`],
        buttons:[{id:"check",label:"CHECK AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]}).then(finish);
    });
  }

  // ---------- the spins (Team V's page in a frame) ----------
  function rrsShowLoading(){
    const doc=rrsDoc(),el=doc&&doc.getElementById("loadingScreen");if(!el)return {hide(){}};
    const text=doc.getElementById("loadingText"),priorText=text?text.textContent:"",priorLabel=el.getAttribute("aria-label");
    el.style.transition="none";el.classList.remove("is-exiting","hidden");el.hidden=false;el.removeAttribute("aria-hidden");el.setAttribute("aria-busy","true");el.setAttribute("aria-label","Loading the revolver");
    if(text)text.textContent="LOADING THE REVOLVER";
    void el.offsetWidth;el.style.transition="";
    let hidden=false;
    return {hide(){
      if(hidden)return;hidden=true;el.setAttribute("aria-hidden","true");el.setAttribute("aria-busy","false");el.classList.add("is-exiting");
      root.setTimeout(()=>{el.hidden=true;el.classList.add("hidden");if(text)text.textContent=priorText;if(priorLabel!==null)el.setAttribute("aria-label",priorLabel);},240);
    }};
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
    const origin=root.location&&root.location.origin;let onReady,onDone;
    const ready=new Promise(resolve=>{onReady=resolve;}),done=new Promise(resolve=>{onDone=resolve;});
    const handler=event=>{
      if(event.source!==frame.contentWindow||event.origin!==origin||!event.data)return;
      if(event.data.type==="cms-rr-ready")onReady("ready");
      else if(event.data.type==="cms-rr-error"){onReady("error");onDone("error");}
      else if(event.data.type==="cms-rr-continue")onDone("continue");
    };
    root.addEventListener("message",handler);
    // A page that loads without its 3D library, or not at all, is dropped at once instead of after the full wait.
    frame.addEventListener("load",()=>{try{const view=frame.contentWindow;if(view&&String(view.location.href)==="about:blank")return;if(!view||!view.THREE)onReady("error");}catch(_error){onReady("error");}});
    frame.addEventListener("error",()=>onReady("error"));
    const timer=root.setTimeout(()=>onReady("timeout"),MAX_LOADING_MS);
    return {ready:ready.finally(()=>root.clearTimeout(timer)),done,stop(){root.removeEventListener("message",handler);root.clearTimeout(timer);}};
  }
  // "watched" when both spins played to the end, "skipped" when the page could not run (the result still shows).
  async function rrsScene(ctx,plan){
    const loading=rrsShowLoading(),shownAt=Date.now();let channel=null,stage=null,frame=null;
    try{
      ({stage,frame}=rrsCreateStage(ctx));channel=rrsListen(frame);
      if(await channel.ready!=="ready")throw new Error("Roulette page did not start.");
      const boardOf=role=>plan.boards[role].map(p=>({pos:p.pos,name:p.name}));
      const turns=plan.turns.map(turn=>({fire:turn.fired,target:turn.player?turn.player.name:null}));
      frame.contentWindow.postMessage({type:"cms-rr-setup",d:ctx.clubs.playerOne,n:ctx.clubs.playerTwo,boards:{D:boardOf("playerOne"),N:boardOf("playerTwo")},turns},root.location.origin);
      const left=MIN_LOADING_MS-(Date.now()-shownAt);if(left>0)await rrsWait(left);
      stage.style.visibility="visible";
    }catch(_error){if(channel)channel.stop();sceneFailedHere.add(rrsKey(ctx));rrsRemoveStage();loading.hide();return "skipped";}
    loading.hide();
    try{frame.focus();}catch(_error){}
    const end=await channel.done;channel.stop();
    if(end!=="continue"){sceneFailedHere.add(rrsKey(ctx));return "skipped";}
    return "watched";
  }

  // ---------- the result and the release ----------
  function rrsOutcomeLine(turn){return turn.fired?`${NAMES[turn.role]} lost ${turn.player.name}.`:`${NAMES[turn.role]}: empty chamber. Squad safe.`;}
  async function rrsResult(ctx,plan){
    const mine=plan.turns.find(turn=>turn.role===ctx.managerRole);
    const lines=plan.turns.map(rrsOutcomeLine);
    const choice=mine.fired
      ?await rrsAsk(ctx,{heading:`Release ${mine.player.name}`,label:"Release your player",lines,
        note:`Release ${mine.player.name} in your FIFA 17 save now, before the transfer window. The game can't do it for you.`,
        buttons:[{id:"go",label:"I'VE RELEASED HIM",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]})
      :await rrsAsk(ctx,{heading:"Empty chamber",label:"Your squad is safe",lines,note:"Your squad stays as it is this season.",
        buttons:[{id:"go",label:"GO TO THE TRANSFER WINDOW",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
    return choice==="go";
  }

  async function rrsRun(ctx){
    if(!rrsDecide(ctx)||!rrsDoc())return true;
    if(!await rrsEnsure())return true;
    const engine=root.CareerModeRosterRoulette,store=root.CareerModeRosterBoardStore,key=rrsKey(ctx);
    let edited=null;
    if(ctx.season>=2){edited=await rrsBoards(ctx,engine,store);if(!edited)return false;}
    const plan=engine.forSeason(ctx.rivalryId,ctx.clubs,ctx.season,edited);
    if(!plan||plan.turns.some(turn=>turn.fired&&!turn.player)){rrsMark(DONE_KEY,key);return true;}
    if(!rrsHas(WATCHED_KEY,key)&&!sceneFailedHere.has(key)){
      const scene=await rrsScene(ctx,plan);
      if(scene==="watched")rrsMark(WATCHED_KEY,key);
    }
    const go=await rrsResult(ctx,plan);
    if(!go)return false;
    rrsMark(DONE_KEY,key);
    return true;
  }
  // Resolves true when the Transfer Challenge may open, false when the manager went back to Showdown Home. Never rejects:
  // a failure before the result skips the roulette for this page load (the Transfer Challenge opens as before).
  // The panel and the stage stay up until close() so nothing shows between them and the next screen.
  function rrsRunBeforeTransfers(ctx){
    if(running)return running;
    leftForHome=false;
    const run=Promise.resolve().then(()=>rrsRun(ctx)).catch(()=>{if(ctx)failedHere.add(rrsKey(ctx));return true;}).then(go=>{
      if(go===false){leftForHome=true;rrsRemovePanel();rrsRemoveStage();if(typeof root.navigateTo==="function")void Promise.resolve(root.navigateTo("mainMenu")).catch(()=>{});}
      return go!==false;
    }).finally(()=>{if(running===run)running=null;});
    running=run;return run;
  }
  function rrsClose(){rrsRemovePanel();rrsRemoveStage();return true;}
  // For the screens that open the Transfer Challenge: a roulette is on screen (its pace is the manager's, so no load timeout
  // may end it), and whether the last one ended with the manager going back to Showdown Home (not a failure).
  function rrsActive(){return Boolean(running);}
  function rrsWentHome(){return leftForHome;}

  return Object.freeze({contractVersion:1,feature:"cms-roster-roulette-step",page:PAGE,stageId:STAGE_ID,panelId:PANEL_ID,doneKey:DONE_KEY,watchedKey:WATCHED_KEY,fromMs:RRR_FROM_MS,decide:rrsDecide,boardProblem:rrsBoardProblem,runBeforeTransfers:rrsRunBeforeTransfers,close:rrsClose,active:rrsActive,wentHome:rrsWentHome});
});
