(function(root,factory){const api=factory(root);if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CareerModeShowdownModes=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){"use strict";
// Real-only play. The marker still preserves the account's historic exclusion boundary.
// Pair/marker reads stay lazy and memoised; no timers or polling.
const MESSAGE_ID="cmsSeasonsStartMessage",SETTINGS_ID="cmsModeSettings";
const LABELS=Object.freeze({daniel:"Daniel",nik:"Nik"});
let installed=false,busy=false,settingsMessage="",settingsTone="",settingsMessageWhileLive=false,seasonsMessage="",markerView=Object.freeze({status:"unknown",accountId:null}),markerPromise=null;
const smDoc=()=>root.document||null;
function smIdentity(){try{const s=root.CareerModeOnlinePlayerIdentity?.getState?.();return s&&s.status==="ready"&&s.registered&&s.accountId&&LABELS[s.managerId]?s:null;}catch(_){return null;}}
const smPair=()=>root.CareerModePersistentNikDanielPair||null;
const smOther=managerId=>managerId==="daniel"?"Nik":"Daniel";
// Pure: the mode and the pairing row from what the page already knows.
function smDecideMode({accountId,partner,side,marker}={}){
  const mine=partner&&partner.accountId===accountId&&partner.status==="ready"?partner.record:null;
  const markerKnown=marker&&marker.accountId===accountId?marker.status:"unknown";
  // Any partner record of this account, even one turned off by UNPAIR, proves the marker (the Rules need it to write one).
  const mode=mine||markerKnown==="ready"||markerKnown==="none"?"real":"unknown";
  const careerStarted=mine||markerKnown==="ready"?true:markerKnown==="none"?false:null;
  let pairing=null;
  if(mode==="real"){
    if(mine&&mine.active===true)pairing=side&&side.accountId===accountId&&side.status==="unpaired"?"partner-unpaired":"paired";
    else pairing=partner&&partner.accountId===accountId&&(partner.status==="none"||partner.status==="ready")?"unpaired":"unknown";
  }
  return Object.freeze({mode,pairing,careerStarted});
}
function smView(){
  const id=smIdentity();if(!id)return Object.freeze({mode:"none",pairing:null,managerId:null,partnerLabel:null});
  const pair=smPair(),decided=smDecideMode({accountId:id.accountId,partner:pair?.getPartnerState?.()||null,side:pair?.getPartnerSideState?.()||null,marker:markerView});
  return Object.freeze({...decided,managerId:id.managerId,partnerLabel:smOther(id.managerId)});
}
function smLiveShowdown(){try{const p=smPair()?.getState?.();return Boolean(p&&p.rivalryId&&(p.connectionState==="active"||p.connectionState==="pending-pair"));}catch(_){return false;}}
async function smLoad(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("The career service is unavailable.");await root.loadRuntimeScript(key,path,()=>Boolean(ready()));return ready();}
// The marker memo for this account (one exact get per page in js/careerStartMarker.js). A failed read is kept as
// "unavailable" here and asked again only on the next user action (Settings, START).
function smReadMarker(accountId,options={}){
  if(options.fresh!==true&&markerView.accountId===accountId&&(markerView.status==="ready"||markerView.status==="none"))return Promise.resolve(markerView);
  if(markerPromise&&markerPromise.accountId===accountId)return markerPromise.promise;
  const promise=(async()=>{try{const api=await smLoad("career-start-marker","js/careerStartMarker.js",()=>root.CareerModeCareerStartMarker);/* Codex #908: fresh asks the server again (another browser of this account may have started the real career) */if(options.fresh===true)api.clearCache?.();const marker=await api.readCurrentMarker();/* only a real answer decides: an unknown marker is unavailable */markerView=Object.freeze({status:marker&&(marker.status==="ready"||marker.status==="none")?marker.status:"unavailable",accountId});}catch(_){markerView=Object.freeze({status:"unavailable",accountId});}return markerView;})().finally(()=>{if(markerPromise&&markerPromise.promise===promise)markerPromise=null;});
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
  // Polish pass (r87): test mode is gone (r83), so this row says where the career lives instead of naming a mode.
  const modeText=v.mode==="real"?"Saved online for both of you":"Checking your career…";
  grid.append(smInfoRow("CAREER",modeText,"mode"));
  if(v.mode==="real"){
    const partnerText=v.pairing==="paired"?`Paired with ${v.partnerLabel}`:v.pairing==="partner-unpaired"?`${v.partnerLabel} is no longer paired with you`:v.pairing==="unpaired"?"Not paired":"Checking…";
    grid.append(smInfoRow("PARTNER",partnerText,"partner"));
    if(v.pairing==="paired")actions.append(smButton("UNPAIR",()=>void smUnpairFromSettings(),"menuButton settingsUnpairButton"));
    else if(v.pairing==="partner-unpaired")actions.append(smButton("PAIR AGAIN",()=>void smPairAgainFromSettings(),"menuButton settingsPairAgainButton"));
    else if(v.pairing==="unpaired")actions.append(smButton(`PAIR WITH ${v.partnerLabel.toUpperCase()}`,()=>void smPairWithFromSettings(),"menuButton settingsPairWithButton"));
  }
  const note=smEl("p","settingsOfflineNote settingsModeNote",smMessage()||(v.mode==="real"?(v.pairing==="paired"&&smUnpairBlocked()?RULE:"Every finished Showdown counts in your career."):""));
  note.id=SETTINGS_ID;note.setAttribute("role","status");note.setAttribute("aria-live","polite");if(settingsTone)note.dataset.tone=settingsTone;
  if(note.textContent)actions.after(note);
  return panel;
}
function smSetSettingsMessage(text,tone="",whileLive=false){settingsMessage=text||"";settingsTone=tone;settingsMessageWhileLive=Boolean(text)&&whileLive;smRefresh();}
function smAskConfirm(message,tone){return typeof root.askShowdownConfirm==="function"?root.askShowdownConfirm(message,{tone}):typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof root.askShowdownConfirm==="function").then(()=>root.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}
const RULE="Finish or end the current Showdown before you unpair.",BLOCKED=`${RULE} Nothing was changed.`;
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
// START has one path; only a recoverable failure adds a message to the seasons screen.
function smRenderSeasons(){
  const d=smDoc();if(!d)return;const box=d.querySelector("#createShowdown .setupBox"),start=d.getElementById("startShowdown");if(!box||!start)return;
  let message=d.getElementById(MESSAGE_ID);
  if(!message&&seasonsMessage){message=smEl("p","stateNote cmsSeasonsStartMessage");message.id=MESSAGE_ID;message.setAttribute("role","status");message.setAttribute("aria-live","polite");start.before(message);}
  if(message){if(message.textContent!==seasonsMessage)message.textContent=seasonsMessage;message.hidden=!seasonsMessage;}
}
function smSetSeasonsMessage(text){seasonsMessage=text||"";smRenderSeasons();}
// The seasons START asks this before any shell is made (js/productionSharedJourneyEntry.js, once whichShowdownIsLive says new).
async function smBeforeSeasonsStart(){
  const id=smIdentity();if(!id||id.managerId!=="daniel")return true;
  smSetSeasonsMessage("");
  const v=await smResolve();
  if(v.careerStarted===true)return true;
  if(v.careerStarted!==false){smSetSeasonsMessage("Your career could not be checked. Check your connection, then press START again.");return false;}
  // A leftover markerless code predates real-only play. Close it before the marker can name it.
  const pending=smPair()?.getState?.();
  if(pending&&pending.connectionState==="pending-pair"&&pending.managerRole==="playerOne"&&pending.rivalryId){
    const fresh=await smReadMarker(id.accountId,{fresh:true});
    if(fresh.status!=="none"){smRefresh();smSetSeasonsMessage(fresh.status==="ready"?"Your real career has started on another device. Press START again.":"Your career could not be checked. Check your connection, then press START again.");return false;}
    try{const closed=await smPair().closeUnjoinedCode({expectedRivalryId:pending.rivalryId});if(!closed||closed.ok!==true)throw new Error("Your earlier code could not be closed.");}
    catch(error){smSetSeasonsMessage(`Your real career could not be started. ${error&&error.message?error.message:"Try again."}`);smRefresh();return false;}
  }
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
  try{root.CareerModeOnlinePlayerIdentity?.refreshBadge?.();}catch(_){}
  /* r80 resume (Home item 5): Home's START tile and season chip follow the mode, which can be learnt after Home was drawn */
  try{root.CareerModeOnlinePlayerIdentity?.refreshHome?.();}catch(_){}
  try{root.CareerModeOnlinePlayerIdentity?.renderSettings?.();}catch(_){}
}
function smInstall(){
  if(installed)return api;installed=true;
  const d=smDoc();
  if(d&&d.addEventListener)d.addEventListener("career-mode-screen-shown",event=>{const screen=event&&event.detail&&event.detail.screen;if(seasonsMessage&&screen!=="createShowdown")seasonsMessage="";smRefresh();});
  try{smPair()?.subscribe?.(()=>smRefresh());}catch(_){}
  if(root.addEventListener){root.addEventListener("career-mode-permanent-pair-change",()=>smRefresh());root.addEventListener("career-mode-career-start-change",event=>{const s=event&&event.detail;if(s&&s.accountId&&s.status)markerView=Object.freeze({status:s.status==="ready"?"ready":"none",accountId:s.accountId});smRefresh();});}
  smRefresh();return api;
}
const api=Object.freeze({contractVersion:1,feature:"real-career-pairing",install:smInstall,resolve:smResolve,decideMode:smDecideMode,getView:smView,signature:smSignature,decorateSettingsPanel:smDecorateSettingsPanel,beforeSeasonsStart:smBeforeSeasonsStart,unpairForPairAgain:smUnpairForPairAgain,unpairFromSettings:smUnpairFromSettings,pairAgainFromSettings:smPairAgainFromSettings,pairWithFromSettings:smPairWithFromSettings,renderSeasons:smRenderSeasons});
return api;});
