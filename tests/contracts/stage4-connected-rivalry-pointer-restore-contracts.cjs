const assert=require("node:assert/strict");
const fs=require("node:fs");
const connected=require("../../js/sparkConnectedRivalry.js");

function binding(managerRole,profileHex){
  return Object.freeze({
    saveId:"save_111111111111111111111111",
    profileId:`profile_${profileHex.repeat(24)}`,
    managerRole,
    displayLabel:managerRole==="playerOne"?"Hui":"TBY"
  });
}

function pointer(accountId,deviceId,bindingValue,rivalryHex,attachedAtEpochMs){
  return Object.freeze({
    schemaVersion:1,
    accountId,
    rivalryId:`pair_${rivalryHex.repeat(64)}`,
    saveId:bindingValue.saveId,
    profileId:bindingValue.profileId,
    managerRole:bindingValue.managerRole,
    deviceId,
    attachedAtEpochMs
  });
}

(async()=>{
  assert.equal(typeof connected.resolveSavedPointer,"function","Connected Rivalry must expose deterministic pointer restoration for regression proof.");

  const accountId="acct_player_two";
  const deviceId=`device_${"b".repeat(32)}`;
  const playerOne=binding("playerOne","a");
  const playerTwo=binding("playerTwo","b");
  const playerTwoPointer=pointer(accountId,deviceId,playerTwo,"c",2000);

  const restoredSecondBinding=await connected.resolveSavedPointer(accountId,deviceId,[playerOne,playerTwo],{
    pointerLoader:async(_account,_device,current)=>current.managerRole==="playerTwo"?playerTwoPointer:null
  });
  assert.equal(restoredSecondBinding.binding.managerRole,"playerTwo","A saved Player Two pointer must survive initialization even when Player One is the first local binding.");
  assert.equal(restoredSecondBinding.pointer.rivalryId,playerTwoPointer.rivalryId);

  const playerOnePointer=pointer(accountId,deviceId,playerOne,"d",1000);
  const newestWins=await connected.resolveSavedPointer(accountId,deviceId,[playerOne,playerTwo],{
    pointerLoader:async(_account,_device,current)=>current.managerRole==="playerOne"?playerOnePointer:playerTwoPointer
  });
  assert.equal(newestWins.binding.managerRole,"playerTwo","Without an in-memory preference, the most recently attached durable pointer must win instead of binding order.");

  const preferredWins=await connected.resolveSavedPointer(accountId,deviceId,[playerOne,playerTwo],{
    preferredBinding:playerOne,
    pointerLoader:async(_account,_device,current)=>current.managerRole==="playerOne"?playerOnePointer:playerTwoPointer
  });
  assert.equal(preferredWins.binding.managerRole,"playerOne","An already active in-memory binding must remain stable when its durable pointer still exists.");

  const none=await connected.resolveSavedPointer(accountId,deviceId,[playerOne,playerTwo],{
    preferredBinding:playerTwo,
    pointerLoader:async()=>null
  });
  assert.equal(none.pointer,null);
  assert.equal(none.binding.managerRole,"playerTwo","No-pointer initialization may retain the current binding without fabricating attachment authority.");

  const source=fs.readFileSync("js/sparkConnectedRivalry.js","utf8");
  assert.doesNotMatch(source,/const binding=bindings\[0\]\|\|null;\s*const pointer=binding\?await crLoadSavedPointerForBinding/,"Initialization must never restore only the first local manager binding.");
  assert.match(source,/crResolveSavedPointer\(context\.accountId,context\.deviceId,bindings,\{preferredBinding:crState\.binding\}\)/,"Initialization must resolve the durable pointer across all local manager bindings.");

  process.stdout.write("PASS Stage 4 Connected Rivalry pointer restore regression: Player Two durable attachment survives Settings reopen and Remote Joining reinitialization even when Player One is the first local binding\n");
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});
