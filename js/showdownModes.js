(function(root,factory){const api=factory(root);if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CareerModeShowdownModes=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){"use strict";
// r79 PR4: real and test modes (Nik, 2026-10-17). Lazy: the identity sidecar loads it after the pair read; never at startup.
// REAL: the account holds accounts/{uid}/careerStart/current (a partner record proves it too: the Rules need the marker to
// write one, so even an unpaired record counts). Every Showdown counts, the pairing with the other manager is permanent, there is no FORGET THIS DEVICE.
// TEST: no marker. Only Settings > START TEST RUN (Daniel) starts one; it never counts (the first real START hides every
// earlier Showdown for good) and its screens say TEST RUN · nothing counts. Every Home START is real: on a test account the
// seasons screen shows the one-time START REAL CAREER checkmark and that START writes the marker first.
// Reads: none of its own. The mode comes from the pair module's memo (the partner record, once per page) and, only for an
// account without a partner record, the marker module's memo (one exact get per page). The one-sided UNPAIR check is
// the pair module's partner-side read (once per page, only while this account's record is active). No timers, no polling.
const TEST_LABEL="TEST RUN · nothing counts",BADGE_SUFFIX=" · TEST RUN · NOTHING COUNTS";
const LAYER_NOTE_ID="cmsConnectTestRunNote",ROW_ID="cmsRealCareerRow",CHECK_ID="cmsRealCareerCheck",NOTE_ID="cmsTestRunNote",MESSAGE_ID="cmsSeasonsStartMessage",SETTINGS_ID="cmsModeSettings";
const GAMEPLAY=Object.freeze(["createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary"]);
const LABELS=Object.freeze({daniel:"Daniel",nik:"Nik"});
let installed=false,armed=false,joinArming=false,busy=false,settingsMessage="",settingsTone="",settingsMessageWhileLive=false,seasonsMessage="",markerView=Object.freeze({status:"unknown",accountId:null}),markerPromise=null;
const smDoc=()=>root.document||null;
function smIdentity(){try{const s=root.CareerModeOnlinePlayerIdentity?.getState?.();return s&&s.status==="ready"&&s.registered&&s.accountId&&LABELS[s.managerId]?s:null;}catch(_){return null;}}
const smPair=()=>root.CareerModePersistentNikDanielPair||null;
const smOther=managerId=>managerId==="daniel"?"Nik":"Daniel";
// Pure: the mode and the pairing row from what the page already knows.
function smDecideMode({accountId,partner,side,marker}={}){
  const mine=partner&&partner.accountId===accountId&&partner.status==="ready"?partner.record:null;
  const markerKnown=marker&&marker.accountId===accountId?marker.status:"unknown";
  // Any partner record of this account, even one turned off by UNPAIR, proves the marker (the Rules need it to write one).
  const mode=mine?"real":markerKnown==="ready"?"real":markerKnown==="none"?"test":"unknown";
  let pairing=null;
  if(mode==="real"){
    if(mine&&mine.active===true)pairing=side&&side.accountId===accountId&&side.status==="unpaired"?"partner-unpaired":"paired";
    else pairing=partner&&partner.accountId===accountId&&(partner.status==="none"||partner.status==="ready")?"unpaired":"unknown";
  }
  return Object.freeze({mode,pairing});
}
function smView(){
  const id=smIdentity();if(!id)return Object.freeze({mode:"none",pairing:null,managerId:null,partnerLabel:null});
  const pair=smPair(),decided=smDecideMode({accountId:id.accountId,partner:pair?.getPartnerState?.()||null,side:pair?.getPartnerSideState?.()||null,marker:markerView});
  return Object.freeze({...decided,managerId:id.managerId,partnerLabel:smOther(id.managerId)});
}
function smLiveShowdown(){try{const p=smPair()?.getState?.();return Boolean(p&&p.rivalryId&&(p.connectionState==="active"||p.connectionState==="pending-pair"));}catch(_){return false;}}
function smScreen(){try{return typeof root.getActiveScreenName==="function"?root.getActiveScreenName()||"mainMenu":"mainMenu";}catch(_){return "mainMenu";}}
// The badge on the header chip (every screen) carries the label while a test run is on screen: the seasons screen opened by
// START TEST RUN, a test Showdown that is live, or any later gameplay screen of a test account. Never on an idle test Home
// or the seasons screen Home START opened, where START is real.
function smLayerOpen(){const l=smDoc()?.getElementById("connectPlayersScreen");return Boolean(l&&!l.hidden&&!l.classList.contains("hidden"));}
function smTestRunShown(view=smView()){if(view.mode!=="test")return false;/* Nik's JOIN TEST RUN counts while it opens and while its layer is up (the layer's close sends no event) */if(armed&&(view.managerId!=="nik"||joinArming||smLayerOpen()))return true;if(smLiveShowdown())return true;const screen=smScreen();return screen!=="createShowdown"&&GAMEPLAY.includes(screen);}
// Connect Players (Daniel's WAITING of a test run, Nik's JOIN TEST RUN code box) is a full layer over the header, so it
// carries the label itself, above the pair panel, whenever this account is in test mode.
function smRenderLayerLabel(){
  const d=smDoc();if(!d)return;const slot=d.getElementById("connectPlayersPairSlot");if(!slot)return;
  let note=d.getElementById(LAYER_NOTE_ID);
  if(!note){note=smEl("p","stateNote locked cmsTestRunNote",TEST_LABEL);note.id=LAYER_NOTE_ID;}
  if(note.parentNode!==slot)slot.prepend(note);
  /* r79 gallery: the strip follows the same rule as the badge, so a test account's real first JOIN (Home) never wears it */
  note.hidden=!smTestRunShown();
}
function smBadgeSuffix(){return smTestRunShown()?BADGE_SUFFIX:"";}
async function smLoad(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("The career service is unavailable.");await root.loadRuntimeScript(key,path,()=>Boolean(ready()));return ready();}
// The marker memo for this account (one exact get per page in js/careerStartMarker.js). A failed read is kept as
// "unavailable" here and asked again only on the next user action (Settings, START).
function smReadMarker(accountId,options={}){
  if(options.fresh!==true&&markerView.accountId===accountId&&(markerView.status==="ready"||markerView.status==="none"))return Promise.resolve(markerView);
  if(markerPromise&&markerPromise.accountId===accountId)return markerPromise.promise;
  const promise=(async()=>{try{const api=await smLoad("career-start-marker","js/careerStartMarker.js",()=>root.CareerModeCareerStartMarker);/* Codex #908: fresh asks the server again (another browser of this account may have started the real career) */if(options.fresh===true)api.clearCache?.();const marker=await api.readCurrentMarker();/* only a real answer decides: an unknown marker is unavailable, never test */markerView=Object.freeze({status:marker&&(marker.status==="ready"||marker.status==="none")?marker.status:"unavailable",accountId});}catch(_){markerView=Object.freeze({status:"unavailable",accountId});}return markerView;})().finally(()=>{if(markerPromise&&markerPromise.promise===promise)markerPromise=null;});
  markerPromise={accountId,promise};return promise;
}
// Page load, Settings open and START ask the same memoised questions; nothing here reads twice.
async function smResolve(){
  const id=smIdentity();if(!id)return smView();
  const pair=smPair();
  if(pair&&typeof pair.readPartnerRecord==="function"){const partner=await pair.readPartnerRecord();if(partner&&partner.accountId===id.accountId&&partner.status==="ready"&&partner.record){if(partner.record.active===true)await pair.readPartnerSide?.();smRefresh();return smView();}}
  await smReadMarker(id.accountId);smRefresh();return smView();
}

// ---------- Settings: the ACCOUNT panel's mode rows (the identity panel's own grid and action row, so its marble look) ----------
function smEl(tag,className,text){const e=smDoc().createElement(tag);if(className)e.className=className;if(text!=null)e.textContent=String(text);return e;}
function smInfoRow(label,value,mode){const row=smEl("div","settingsInfoRow"),a=smEl("span","",label),v=smEl("strong","",value);row.dataset.modeRow=mode;row.append(a,v);return row;}
function smButton(text,fn,className="menuButton"){const b=smEl("button",className,text);b.type="button";b.disabled=busy;b.dataset.modeRow="action";b.addEventListener("click",fn);return b;}
// Gallery #5/#6: UNPAIR is refused while a Showdown is being played, so the note says so on both managers' pages before any
// tap, and the refusal (kept only while that Showdown is live) goes away by itself once it is finished or deleted.
function smUnpairBlocked(){try{return smPair()?.getState?.()?.connectionState==="active";}catch(_){return false;}}
function smMessage(){if(settingsMessageWhileLive&&!smLiveShowdown()){settingsMessage="";settingsTone="";settingsMessageWhileLive=false;}return settingsMessage;}
function smSignature(){const v=smView();return [v.mode,v.pairing,busy,smMessage(),settingsTone,smUnpairBlocked()].join("|");}
function smDecorateSettingsPanel(panel){
  if(!panel||!smDoc())return panel;
  const v=smView(),grid=panel.querySelector(".settingsInfoGrid"),actions=panel.querySelector(".settingsConnectedAccountActions");
  panel.querySelectorAll("[data-mode-row]").forEach(n=>n.remove());panel.querySelector(`#${SETTINGS_ID}`)?.remove();
  panel.dataset.showdownMode=v.mode;if(v.mode==="none"||!grid||!actions)return panel;
  const modeText=v.mode==="real"?"REAL CAREER · every Showdown counts":v.mode==="test"?TEST_LABEL:"Checking your career…";
  grid.append(smInfoRow("MODE",modeText,"mode"));
  if(v.mode==="real"){
    const partnerText=v.pairing==="paired"?`Paired with ${v.partnerLabel}`:v.pairing==="partner-unpaired"?`${v.partnerLabel} is no longer paired with you`:v.pairing==="unpaired"?"Not paired":"Checking…";
    grid.append(smInfoRow("PARTNER",partnerText,"partner"));
    if(v.pairing==="paired")actions.append(smButton("UNPAIR",()=>void smUnpairFromSettings(),"menuButton settingsUnpairButton"));
    else if(v.pairing==="partner-unpaired")actions.append(smButton("PAIR AGAIN",()=>void smPairAgainFromSettings(),"menuButton settingsPairAgainButton"));
    else if(v.pairing==="unpaired")actions.append(smButton(`PAIR WITH ${v.partnerLabel.toUpperCase()}`,()=>void smPairWithFromSettings(),"menuButton settingsPairWithButton"));
  }else if(v.mode==="test"){
    actions.append(smButton(v.managerId==="daniel"?"START TEST RUN":"JOIN TEST RUN",()=>void smStartTestRun(),"menuButton settingsStartTestRun"));
    actions.append(smButton("FORGET THIS DEVICE",()=>void root.CareerModeOnlinePlayerIdentity?.forgetThisDevice?.(),"menuButton settingsForgetDevice"));
  }
  const note=smEl("p","settingsOfflineNote settingsModeNote",smMessage()||(v.mode==="test"?"Test runs never count in any history. Your first Home START becomes your real career.":v.mode==="real"?(v.pairing==="paired"&&smUnpairBlocked()?RULE:"Every Showdown counts in your career."):""));
  note.id=SETTINGS_ID;note.setAttribute("role","status");note.setAttribute("aria-live","polite");if(settingsTone)note.dataset.tone=settingsTone;
  if(note.textContent)actions.after(note);
  return panel;
}
function smSetSettingsMessage(text,tone="",whileLive=false){settingsMessage=text||"";settingsTone=tone;settingsMessageWhileLive=Boolean(text)&&whileLive;smRefresh();}
function smAskConfirm(message,tone){return typeof root.askShowdownConfirm==="function"?root.askShowdownConfirm(message,{tone}):typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof root.askShowdownConfirm==="function").then(()=>root.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}
const RULE="Finish or delete the current Showdown before you unpair.",BLOCKED=`${RULE} Nothing was changed.`;
function smPlain(error){return error&&error.code==="PERMANENT_PARTNER_UNPAIR_BLOCKED"?BLOCKED:`Nothing was changed. ${error&&error.message?error.message:"Try again."}`;}
// UNPAIR: a Showdown that is being played is caught here without a read; the pair module's unpair() is the fail-closed check
// (an ACTIVE rivalry, or a pending one whose code is still open, refuses inside its transaction).
async function smRunUnpair(){
  const pair=smPair();if(!pair||typeof pair.unpair!=="function")throw new Error("The connection service is unavailable.");
  try{if(pair.getState?.()?.connectionState==="active"&&pair.getState().rivalryId)return{ok:false,blocked:true};await pair.unpair();return{ok:true};}
  catch(error){return{ok:false,blocked:error&&error.code==="PERMANENT_PARTNER_UNPAIR_BLOCKED",error};}
}
async function smUnpairFromSettings(){
  if(busy)return false;const v=smView();
  if(smUnpairBlocked()){smSetSettingsMessage(BLOCKED,"error",true);return false;}
  const ok=await smAskConfirm(`Unpair from ${v.partnerLabel}? Your Showdowns stay saved. To play again you pair again with a new code.`,"danger");
  if(ok!==true)return false;
  busy=true;smSetSettingsMessage("Unpairing…");
  const result=await smRunUnpair();busy=false;
  smSetSettingsMessage(result.ok?`Unpaired from ${v.partnerLabel}.`:result.blocked?BLOCKED:smPlain(result.error),result.ok?"success":"error",!result.ok&&result.blocked);
  return result.ok;
}
// PAIR AGAIN: this account's own stale record goes inactive (the same fail-closed unpair), then the existing first real pairing.
async function smUnpairForPairAgain(){
  if(busy)return Object.freeze({ok:false,message:"Unpairing is already in progress."});busy=true;smRefresh();
  const result=await smRunUnpair();busy=false;
  if(!result.ok){const message=result.blocked?BLOCKED:smPlain(result.error);smSetSettingsMessage(message,"error",result.blocked);return Object.freeze({ok:false,message});}
  settingsMessage="";settingsMessageWhileLive=false;smRefresh();return Object.freeze({ok:true});
}
async function smPairAgainFromSettings(){const result=await smUnpairForPairAgain();if(!result||result.ok!==true)return false;return smPairWithFromSettings();}
async function smPairWithFromSettings(){root.closeSettings?.(false);const identity=root.CareerModeOnlinePlayerIdentity;if(smView().managerId==="nik")return identity?.openJoin?.();return identity?.openStart?.();}
// START TEST RUN (Daniel): the seasons screen in test mode (no checkmark, the label). JOIN TEST RUN (Nik): the code box.
async function smStartTestRun(){
  const v=smView();if(v.mode!=="test")return false;
  root.closeSettings?.(false);const identity=root.CareerModeOnlinePlayerIdentity;
  /* Nik's JOIN TEST RUN is a test run too (the strip on his code box). Opening the layer passes through Home first, so that
     step keeps it armed (Codex #917); a later Home, or the next JOIN from Home, ends it. */
  armed=true;
  if(v.managerId==="nik"){joinArming=true;smRefresh();try{return await identity?.openJoin?.();}finally{joinArming=false;smRefresh();}}
  smRefresh();
  /* Codex #908: a launch that does not reach the seasons screen (refused, failed, or it continued a live Showdown) disarms,
     so the next Home START is real again and a real Showdown never wears the TEST RUN label. */
  let opened=null;try{opened=await identity?.openStart?.();}finally{if(!opened||smScreen()!=="createShowdown"){armed=false;smRefresh();}}
  return opened;
}

// ---------- the seasons screen: the one-time checkmark, or the test-run label ----------
function smRenderSeasons(){
  const d=smDoc();if(!d)return;const box=d.querySelector("#createShowdown .setupBox"),start=d.getElementById("startShowdown");if(!box||!start)return;
  const v=smView(),daniel=v.managerId==="daniel";
  let row=d.getElementById(ROW_ID),note=d.getElementById(NOTE_ID),message=d.getElementById(MESSAGE_ID);
  if(!row){row=smEl("div","stateNote cmsRealCareerRow");row.id=ROW_ID;const input=smEl("input");input.type="checkbox";input.id=CHECK_ID;input.checked=true;const label=smEl("label","","START REAL CAREER");label.htmlFor=CHECK_ID;const small=smEl("small","","This Showdown counts. Old test games stay stored and are never shown.");row.append(input,label,small);}
  if(!note){note=smEl("p","stateNote locked cmsTestRunNote",TEST_LABEL);note.id=NOTE_ID;}
  if(!message){message=smEl("p","stateNote cmsSeasonsStartMessage");message.id=MESSAGE_ID;message.setAttribute("role","status");message.setAttribute("aria-live","polite");}
  for(const n of [row,note,message])if(n.parentNode!==box)start.before(n);
  row.hidden=!(daniel&&v.mode==="test"&&!armed);note.hidden=!(daniel&&armed&&v.mode==="test");
  if(message.textContent!==seasonsMessage)message.textContent=seasonsMessage;message.hidden=!seasonsMessage;
}
function smSetSeasonsMessage(text){seasonsMessage=text||"";smRenderSeasons();}
// The seasons START asks this before any shell is made (js/productionSharedJourneyEntry.js, once whichShowdownIsLive says new).
async function smBeforeSeasonsStart(){
  const id=smIdentity();if(!id||id.managerId!=="daniel")return true;
  smSetSeasonsMessage("");
  const v=await smResolve();
  if(armed&&v.mode==="test"){
    /* Codex #908: a test run is checked against the server once more just before it is made (one read per test START): if this
       account's real career started meanwhile on another browser, the game would count, so it is refused instead. */
    const fresh=await smReadMarker(id.accountId,{fresh:true});
    if(fresh.status==="none")return true;
    armed=false;smRefresh();
    smSetSeasonsMessage(fresh.status==="ready"?"Your real career has started on another device, so this cannot be a test run. Press START again for a Showdown that counts.":"Your career could not be checked. Check your connection, then press START again.");
    return false;
  }
  if(v.mode==="real")return true;
  if(v.mode!=="test"){smSetSeasonsMessage("Your career could not be checked. Check your connection, then press START again.");return false;}
  const check=smDoc()?.getElementById(CHECK_ID);
  if(!check||check.checked!==true){smSetSeasonsMessage("Home START always starts your real career. Tick START REAL CAREER, or use Settings > START TEST RUN for a game that does not count.");return false;}
  try{
    const api=await smLoad("career-start-marker","js/careerStartMarker.js",()=>root.CareerModeCareerStartMarker);
    const marker=await api.startRealCareer();
    markerView=Object.freeze({status:marker&&marker.status==="ready"?"ready":"none",accountId:id.accountId});
    if(markerView.status!=="ready")throw new Error("Try again.");
  }catch(error){smSetSeasonsMessage(`Your real career could not be started. ${error&&error.message?error.message:"Try again."}`);smRefresh();return false;}
  smRefresh();return true;
}

function smRefresh(){
  try{smRenderSeasons();}catch(_){}
  try{smRenderLayerLabel();}catch(_){}
  try{root.CareerModeOnlinePlayerIdentity?.refreshBadge?.();}catch(_){}
  try{root.CareerModeOnlinePlayerIdentity?.renderSettings?.();}catch(_){}
}
function smInstall(){
  if(installed)return api;installed=true;
  const d=smDoc();
  /* Codex #917: the layer's close ends Nik's JOIN TEST RUN; reopening it from Home (already on Home) sends no screen change */if(d&&d.addEventListener)d.addEventListener("career-mode-connect-players-closed",()=>{if(armed&&!joinArming&&smIdentity()?.managerId==="nik"){armed=false;smRefresh();}});
  if(d&&d.addEventListener)d.addEventListener("career-mode-screen-shown",event=>{const screen=event&&event.detail&&event.detail.screen;if(screen==="mainMenu"&&armed&&!joinArming&&!smLayerOpen()){armed=false;}if(seasonsMessage&&screen!=="createShowdown")seasonsMessage="";smRefresh();});
  try{smPair()?.subscribe?.(()=>smRefresh());}catch(_){}
  if(root.addEventListener){root.addEventListener("career-mode-permanent-pair-change",()=>smRefresh());root.addEventListener("career-mode-career-start-change",event=>{const s=event&&event.detail;if(s&&s.accountId&&s.status)markerView=Object.freeze({status:s.status==="ready"?"ready":"none",accountId:s.accountId});smRefresh();});}
  smRefresh();return api;
}
const api=Object.freeze({contractVersion:1,feature:"r79-real-and-test-modes",testLabel:TEST_LABEL,badgeSuffixText:BADGE_SUFFIX,install:smInstall,resolve:smResolve,decideMode:smDecideMode,getView:smView,signature:smSignature,decorateSettingsPanel:smDecorateSettingsPanel,badgeSuffix:smBadgeSuffix,isTestRunShown:()=>smTestRunShown(),isTestRunArmed:()=>armed,beforeSeasonsStart:smBeforeSeasonsStart,unpairForPairAgain:smUnpairForPairAgain,startTestRun:smStartTestRun,unpairFromSettings:smUnpairFromSettings,pairAgainFromSettings:smPairAgainFromSettings,pairWithFromSettings:smPairWithFromSettings,renderSeasons:smRenderSeasons});
return api;});
