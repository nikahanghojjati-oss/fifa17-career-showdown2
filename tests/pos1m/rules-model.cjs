"use strict";
// POS1M Ring 1 Rules model. Ring 1 has no Rules engine, so a write the game expects the Rules to refuse would land on
// the stand-in and corrupt the story (a kinder stand-in). This file models ONLY those refusals the game code relies on,
// each copied from the production Rules with its line; everything else the Rules check is Ring 2's job (the emulator
// with the composed Rules). Each entry returns a reason string to refuse, or null.
//
// Add an entry only when the game code itself says "the Rules refuse this" (a comment or a permission-denied branch).
const W=require("./world.cjs");
const ROLE_OF_UID={[W.ACCOUNT.playerOne]:"playerOne",[W.ACCOUNT.playerTwo]:"playerTwo"};
const BASE=`rivalries/${W.RIVALRY}`;
const TRANSFER=new RegExp(`^${BASE}/transferChallenges/season_\\d+$`);

// firestore.transfer-challenge-production.fragment.rules 380-415 (R87 roulette marks): a spin mark is a NOT_STARTED
// document; a member writes only his own entry, once, and only before the window opens.
// js/sparkSharedTransferChallenge.js stspMarkSpun: "A window that already opened refuses it (permission-denied)".
function spinMark({uid,before,after}){
  if(!after||after.phase!=="NOT_STARTED")return null;
  const role=ROLE_OF_UID[uid];
  if(before&&before.phase!=="NOT_STARTED")return "spin mark after the Transfer War window opened";
  const beforeSpins=before&&before.spins||{},afterSpins=after.spins||{};
  if(role in beforeSpins)return "a second spin mark for the same manager";
  const changed=Object.keys({...beforeSpins,...afterSpins}).filter(key=>JSON.stringify(beforeSpins[key])!==JSON.stringify(afterSpins[key]));
  if(changed.some(key=>key!==role))return "a spin mark for the other manager";
  return null;
}

function rules(write){
  if(TRANSFER.test(write.path))return spinMark(write);
  return null;
}
module.exports={rules};
