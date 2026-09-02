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
  assert.equal(typeof connected.resolvePairingCandidate,"function","Connected Rivalry must expose the non-authoritative page-memory pairing handoff for regression proof.");

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

  const pairingCapability=`pair_${"e".repeat(64)}`;
  const pairingRuntime={bindingKey:value=>`${value.managerRole}:${value.profileId}:${value.saveId}`};
  const pairingCandidate=connected.resolvePairingCandidate({
    capability:pairingCapability,
    selectedBindingKey:pairingRuntime.bindingKey(playerTwo)
  },[playerOne,playerTwo],pairingRuntime);
  assert.equal(pairingCandidate.rivalryId,pairingCapability,"The exact one-use pairing capability must become the exact Connected Rivalry ID without copy/paste transformation.");
  assert.equal(pairingCandidate.binding.managerRole,"playerTwo","The automatic handoff must preserve the manager binding chosen during pairing.");
  assert.equal(connected.resolvePairingCandidate({capability:pairingCapability,selectedBindingKey:"playerTwo:wrong:wrong"},[playerOne,playerTwo],pairingRuntime),null,"An unmatched local manager binding must never fabricate Connected Rivalry authority.");
  assert.equal(connected.resolvePairingCandidate({capability:"pair_short",selectedBindingKey:pairingRuntime.bindingKey(playerTwo)},[playerOne,playerTwo],pairingRuntime),null,"An invalid pairing capability must never be auto-attached.");

  const source=fs.readFileSync("js/sparkConnectedRivalry.js","utf8");
  const pairingSource=fs.readFileSync("js/sparkPrivatePairing.js","utf8");
  assert.doesNotMatch(source,/const binding=bindings\[0\]\|\|null;\s*const pointer=binding\?await crLoadSavedPointerForBinding/,"Initialization must never restore only the first local manager binding.");
  assert.match(source,/crResolveSavedPointer\(context\.accountId,context\.deviceId,bindings,\{preferredBinding:crState\.binding\}\)/,"Initialization must resolve the durable pointer across all local manager bindings.");
  assert.match(source,/pairingCandidate=crResolvePairingCandidate\(context\.pairingState,bindings/,"Connected Rivalry initialization must consume the exact current page-memory pairing handoff only when no durable pointer already exists.");
  assert.match(source,/autoAttachResult=await crAttachRivalry\(\{/,"The handoff must reuse the existing verified Connected Rivalry attachment authority instead of introducing a parallel path.");
  assert.match(source,/prefillRivalryId/);
  assert.match(source,/After the second manager joins, Connected Rivalry will attach automatically on the next Save Library or Remote Joining check/);
  assert.match(source,/capabilityChanged/);
  assert.match(source,/code\.value=crState\.rivalryId\|\|"";\s*if\(!code\.value&&crState\.prefillRivalryId\)code\.value=crState\.prefillRivalryId;/,"The Connected Rivalry input must visibly prefill from the pairing handoff without changing attachment authority.");
  assert.match(pairingSource,/status:"paired",busy:false,capability:result\.capability,expiresAtEpochMs:null/,"Player Two must retain the redeemed exact rivalry ID in page memory so Connected Rivalry can attach automatically.");
  assert.match(pairingSource,/Connected Rivalry below is prefilled automatically on this browser/,"Player One must be told the generated pairing ID is handed to Connected Rivalry automatically.");
  assert.doesNotMatch(source,/\bsetInterval\s*\(/,"The quality-of-life handoff must not add provider polling infrastructure.");
  assert.doesNotMatch(source,/\blocalStorage\b/,"The automatic handoff must not create a new canonical or convenience localStorage key.");

  process.stdout.write("PASS Stage 4 Connected Rivalry restore + pairing QoL: Player Two durable attachment survives reinitialization, and the exact page-memory pairing ID prefills/auto-attaches through existing verified authority without new storage, polling or manual copy/paste\n");
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});