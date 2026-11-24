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

// firestore.shared-setup-production.fragment.rules 279-308 (R98-01 League Roulette): `drops` moves 0 -> 1 only with
// commit-league, and otherwise by exactly one per write, only on revision 2, touching only drops and the write stamp,
// and only by the manager whose ball it is (the coordinator drops the odd balls, his rival the even ones).
// js/sparkSharedShowdownSetup.js drop: "Only when that update is refused does one transaction read the ledger".
const SETUP=`${BASE}/sharedSetup/authoritative`;
function rouletteDrop({uid,before,after}){
  if(!before||!after)return null;
  const had=Object.prototype.hasOwnProperty.call(before,"drops"),has=Object.prototype.hasOwnProperty.call(after,"drops");
  if(had!==has)return "drops appeared or vanished";
  // Every allowed ledger update either steps the revision or drops one ball: a write that changes neither (a stale
  // phone's second drop of the same ball) matches no Rules branch and is refused.
  if(after.revision===before.revision&&(!has||after.drops===before.drops))return "a ledger write that is neither a step nor a ball";
  if(!has||after.drops===before.drops)return null;
  if(after.revision!==before.revision)return before.revision===1&&after.revision===2&&before.drops===0&&after.drops===1?null:"drops changed on a ledger step";
  if(after.revision!==2||![1,2,3].includes(before.drops)||after.drops!==before.drops+1)return `ball ${after.drops} after ${before.drops}`;
  const changed=Object.keys({...before,...after}).filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key]));
  if(changed.some(key=>!["drops","updatedAt","updatedByDeviceId","activeSessionId"].includes(key)))return `a ball drop also changed ${changed.join(",")}`;
  const role=ROLE_OF_UID[uid];
  if((before.drops%2===1)!==(role!==before.coordinatorRole))return `ball ${after.drops} is not ${role}'s`;
  return null;
}

function rules(write){
  if(TRANSFER.test(write.path))return spinMark(write);
  if(write.path===SETUP)return rouletteDrop(write);
  return null;
}
module.exports={rules};
