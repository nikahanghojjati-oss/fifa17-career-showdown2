(function(root,factory){const api=factory(root);if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CareerModeWhichShowdownIsLive=api;})(typeof globalThis!=="undefined"?globalThis:this,function(root){"use strict";
// r79: the one answer to "what does START do on this device?". decide() is pure; read() only gathers what the identity sidecar
// (syncPair, the same pair-link read as today; the memoised partner record and JOIN note), the remembered pair and the local
// Save Library already know. No new reads.
// Actions: continue (live game: open it) · resume-waiting (Daniel's code is out, or his seasons were chosen but no code yet) ·
// close-then-new (Daniel: this device's Showdown has ENDED but was never CLOSED; Nik's call 2026-10-17: close it through the
// final-screen terminal close, then choose seasons) · new (Daniel: choose seasons) · join (Nik: JOIN, a note's rivalry when one is known) · wait-for-daniel (Nik: an active partner, no unexpired note) ·
// pair-first (the connection itself needs attention first: no player, unreadable pair, recovery, stale code, link retry).
// One device never decides the other's action: Nik never gets new or resume-waiting, Daniel never gets join.
const ACTIONS=Object.freeze(["continue","close-then-new","resume-waiting","new","join","wait-for-daniel","pair-first"]),SEASONS=Object.freeze({1:1,3:3,5:5,a:10}),ROLE_BY_MANAGER=Object.freeze({daniel:"playerOne",nik:"playerTwo"});
const wslSave=v=>typeof v==="string"&&/^save_[0-9a-f]{24}$/.test(v);
const rid=v=>typeof v==="string"&&/^pair_[0-9a-f]{64}$/.test(v)?v:null;
function wslSeasonsOf(rivalryId){const id=rid(rivalryId);return id?SEASONS[id.charAt(5)]||null:null;}
function wslOut(action,rivalryId=null,totalSeasons=null,reason=action){return Object.freeze({action,rivalryId:rid(rivalryId),totalSeasons:[1,3,5,10].includes(Number(totalSeasons))?Number(totalSeasons):null,reason});}
function wslDecide(inputs={}){const role=inputs&&inputs.role,pair=inputs&&inputs.pair,shell=inputs&&inputs.shell||{},note=inputs&&inputs.note;
  if(role!=="playerOne"&&role!=="playerTwo")return wslOut("pair-first",null,null,"no-player");
  if(!pair||pair.initialized!==true||["idle","unavailable","signed-out"].includes(pair.status))return wslOut("pair-first",null,null,"pair-unknown");
  if(pair.status==="pair-link-retry")return wslOut("pair-first",pair.rivalryId,wslSeasonsOf(pair.rivalryId),"link-retry");
  const live=rid(pair.rivalryId);
  if(live&&pair.connectionState==="active"){if(pair.managerRole&&pair.managerRole!==role)return wslOut("pair-first",live,wslSeasonsOf(live),"identity-mismatch");if(pair.status==="paired"&&role==="playerOne"&&(inputs.ended===true||shell.completed===true&&wslSave(shell.saveId)&&shell.saveId===pair.providerSaveId))return wslOut("close-then-new",live,wslSeasonsOf(live),"ended-not-closed");return pair.status==="paired"?wslOut("continue",live,wslSeasonsOf(live)):wslOut("pair-first",live,wslSeasonsOf(live),"recovery");}
  if(live&&pair.connectionState==="pending-pair"){if(pair.managerRole==="playerOne"&&role==="playerOne")return wslOut("resume-waiting",live,wslSeasonsOf(live));return wslOut("pair-first",live,wslSeasonsOf(live),pair.managerRole==="playerTwo"?"stale-join":"identity-mismatch");}
  // r79 PR3: Daniel's JOIN note counts only while unexpired and not the Showdown this account already joined or closed.
  if(role==="playerTwo"){const n=note&&rid(note.rivalryId)&&Number(note.expiresAtEpochMs)>Number(inputs.nowEpochMs)&&note.rivalryId!==pair.closedRivalryId&&note.rivalryId!==pair.rivalryId?note:null;if(n)return wslOut("join",n.rivalryId,n.totalSeasons||wslSeasonsOf(n.rivalryId),"note");return inputs.noteChecked===true?wslOut("wait-for-daniel"):wslOut("join",null,null,"paste-code");}
  // Daniel, nothing live: seasons already chosen on this browser (START tapped, no code yet) resume instead of a second shell,
  // unless THAT shell belonged to a Showdown that has since closed. A closed rivalry only counts against the save it was bound to
  // (PR #901 P1): an older closed Showdown must not turn a fresh, code-less shell into "new" and a second shell.
  const closedHere=Boolean(rid(pair.closedRivalryId)&&wslSave(pair.closedProviderSaveId)&&pair.closedProviderSaveId===shell.saveId);
  if(shell.pending===true&&shell.untouched===true&&[1,3,5,10].includes(Number(shell.totalSeasons))&&!closedHere)return wslOut("resume-waiting",null,shell.totalSeasons,"shell-without-code");
  return wslOut("new");}
function wslLocalShell(r=root){try{const runtime=r.CareerModeSaveLibraryRuntime;if(!runtime||typeof runtime.isReady!=="function"||runtime.isReady()!==true)return{pending:false};const lib=runtime.getLibrarySnapshot?.(),s=lib&&Array.isArray(lib.saves)?lib.saves.find(e=>e&&e.saveId===lib.activeSaveId)?.showdown:null;if(!s)return{pending:false};const saveId=wslSave(lib.activeSaveId)?lib.activeSaveId:null,completed=s.status==="Completed"||(Array.isArray(s.rounds)&&[1,3,5,10].includes(Number(s.totalRounds))&&s.rounds.length>=Number(s.totalRounds)),pending=s.sharedJourney?.mode==="shared"&&s.sharedJourney?.setupPending===true,untouched=!s.selectedLeague&&!s.clubs?.playerOne&&!s.clubs?.playerTwo&&!(Array.isArray(s.rounds)&&s.rounds.length);return{pending,untouched,totalSeasons:Number(s.totalRounds)||null,saveId,completed};}catch(_){return{pending:false};}}
// Ended: a shared Showdown's local save stays "Created" (the seasons live in the shared modules), so "ended" is what this page's
// own final reconciliation / terminal close already hold for the live rivalry. No read is made for it.
function wslEnded(r,id){if(!rid(id))return false;try{const t=r.CareerModeProductionSharedTerminalClose?.getState?.(),f=r.CareerModeProductionSharedFinalReconciliation?.getState?.();return Boolean(t&&t.rivalryId===id&&["READY","RECOVERY_PENDING","BLOCKED","CLOSED"].includes(t.phase)||f&&f.rivalryId===id&&f.phase==="FINAL_SEASON_RECONCILED");}catch(_){return false;}}
async function wslRead(r=root,options={}){const identity=r.CareerModeOnlinePlayerIdentity,id=identity?.getState?.(),role=id&&id.status==="ready"?ROLE_BY_MANAGER[id.managerId]||null:null;let pair=options.pair||null;if(!pair&&role&&typeof identity.syncPair==="function"){const first=await identity.syncPair();pair=!first||first.status==="unavailable"?await identity.syncPair():first;}const j=role==="playerTwo"&&r.CareerModePersistentNikDanielPair?.getJoinNoteState?.()||null;return Object.freeze({...wslDecide({role,pair,shell:wslLocalShell(r),ended:wslEnded(r,pair&&pair.rivalryId),note:j&&j.note,noteChecked:Boolean(j&&j.checked&&j.partnerActive),nowEpochMs:Date.now()}),pair:pair||null});}
return Object.freeze({contractVersion:1,actions:ACTIONS,decide:wslDecide,read:wslRead,localShell:wslLocalShell,seasonsOf:wslSeasonsOf});});
