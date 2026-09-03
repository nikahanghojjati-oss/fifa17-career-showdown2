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
  assert.equal(typeof connected.nextPairingActivationRetryDelay,"function","Connected Rivalry must expose deterministic bounded pending-pair retry timing for regression proof.");
  assert.ok(Array.isArray(connected.pairingActivationRetryDelaysMs),"Pending-pair retries must use a finite immutable schedule.");
  assert.equal(connected.pairingActivationRetryDelaysMs.length,16,"Creator activation retry must remain strictly bounded.");
  assert.equal(connected.pairingActivationRetryDelaysMs[0],1000,"The first creator recheck should happen quickly after the initial pending result.");
  assert.ok(connected.pairingActivationRetryDelaysMs.every(delay=>Number.isInteger(delay)&&delay>0&&delay<=120000),"Every retry delay must be positive and capped at two minutes.");
  assert.ok(connected.pairingActivationRetryDelaysMs.reduce((sum,delay)=>sum+delay,0)>=15*60*1000,"The finite schedule must be able to cover the existing 15-minute pairing window while expiry remains the hard stop.");
  assert.equal(connected.nextPairingActivationRetryDelay(0,1000,2000),1000);
  assert.equal(connected.nextPairingActivationRetryDelay(0,1000,1500),500,"Pairing expiry must clamp the next provider check rather than extend authority.");
  assert.equal(connected.nextPairingActivationRetryDelay(16,1000,5000),null,"No retry may exist beyond the finite schedule.");
  assert.equal(connected.nextPairingActivationRetryDelay(0,5000,5000),null,"Expired pairing must never schedule another check.");

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
  const playerTwoBindingKey=pairingRuntime.bindingKey(playerTwo);
  const pairingCandidate=connected.resolvePairingCandidate({
    capability:pairingCapability,
    selectedBindingKey:playerTwoBindingKey
  },[playerOne,playerTwo],pairingRuntime);
  assert.equal(pairingCandidate.rivalryId,pairingCapability,"The exact one-use pairing capability must become the exact Connected Rivalry ID without copy/paste transformation.");
  assert.equal(pairingCandidate.binding.managerRole,"playerTwo","The automatic handoff must preserve the manager binding chosen during pairing.");

  const creatorCandidate=connected.resolvePairingCandidate({
    capability:pairingCapability,
    selectedBindingKey:pairingRuntime.bindingKey(playerOne)
  },[playerOne,playerTwo],pairingRuntime);
  assert.equal(creatorCandidate.binding.managerRole,"playerOne","Creator auto-link must preserve Player One rather than drifting to Player Two.");
  assert.equal(creatorCandidate.rivalryId,pairingCapability,"Creator and joiner must converge on the exact same pair_ rivalry ID.");

  assert.equal(connected.resolvePairingCandidate({capability:pairingCapability,selectedBindingKey:"playerTwo:wrong:wrong"},[playerOne,playerTwo],pairingRuntime),null,"An unmatched local manager binding must never fabricate Connected Rivalry authority.");
  assert.equal(connected.resolvePairingCandidate({capability:"pair_short",selectedBindingKey:playerTwoBindingKey},[playerOne,playerTwo],pairingRuntime),null,"An invalid pairing capability must never be auto-attached.");
  assert.equal(connected.resolvePairingCandidate({capability:null,selectedBindingKey:playerTwoBindingKey},[playerOne,playerTwo],pairingRuntime),null,"A reload that discarded an unverified page-memory capability must not fabricate Connected Rivalry authority.");
  assert.equal(connected.resolvePairingCandidate({capability:pairingCapability,selectedBindingKey:null},[playerOne,playerTwo],pairingRuntime),null,"A capability without a captured local manager binding must fail closed.");

  const source=fs.readFileSync("js/sparkConnectedRivalry.js","utf8");
  const pairingSource=fs.readFileSync("js/sparkPrivatePairing.js","utf8");
  const storageSource=fs.readFileSync("js/storage.js","utf8");

  assert.doesNotMatch(source,/const binding=bindings\[0\]\|\|null;\s*const pointer=binding\?await crLoadSavedPointerForBinding/,"Initialization must never restore only the first local manager binding.");
  assert.match(source,/crResolveSavedPointer\(context\.accountId,context\.deviceId,bindings,\{preferredBinding:crState\.binding\}\)/,"Initialization must resolve the durable pointer across all local manager bindings.");
  assert.match(source,/const pairingCandidate=crResolvePairingCandidate\(context\.pairingState,bindings/,"Initialization must evaluate the current pairing candidate even when a durable pointer exists so a newer provider-verified pairing can converge automatically.");
  assert.match(source,/if\(pairingCandidate\)\{[\s\S]*pairingDiffersFromDurable=Boolean\([\s\S]*pointer\.rivalryId!==pairingCandidate\.rivalryId[\s\S]*!crSameBinding\(binding,pairingCandidate\.binding\)/,"A stale durable pointer must remain a fallback while a different current pairing candidate is evaluated.");
  assert.match(source,/if\(pairingDiffersFromDurable\)\{\s*autoAttachResult=await crAttachRivalry\(\{/,"A different current pairing candidate must pass through the existing provider-authorized attach transaction before it may replace the durable pointer.");
  assert.match(source,/if\(!pointer\)binding=pairingCandidate\.binding;/,"A failed or pending current pairing candidate must not displace the binding of an existing durable pointer.");
  assert.match(source,/autoAttachResult=await crAttachRivalry\(\{/,"The handoff must reuse the existing verified Connected Rivalry attachment authority instead of introducing a parallel path.");
  assert.match(source,/if\(autoAttachResult&&autoAttachResult\.ok===true\)\{\s*crClearPairingActivationRetry\(\);\s*binding=pairingCandidate\.binding;\s*pointer=autoAttachResult\.pointer;\s*autoAttached=true;/,"Only a successful provider-verified attach may replace the durable binding and Connected Rivalry pointer, and success must cancel pending retries.");
  assert.match(source,/autoAttachResult&&autoAttachResult\.code==="CONNECTED_RIVALRY_NOT_ACTIVE"\)crSchedulePairingActivationRetry\(context,pairingCandidate\)/,"Only the exact pending-active transition may schedule creator automatic rechecks.");
  assert.match(source,/else crClearPairingActivationRetry\(\)/,"Authorization, identity, device, expiry and other failures must not be retried as if they were a normal pending pairing.");
  assert.match(source,/crPairingActivationRetryKeyFor\(context,pairingCandidate\)/,"Retries must stay bound to the exact account, device, rivalry and manager binding candidate.");
  assert.match(source,/crResolvePairingCandidate\(currentPairingState,crBindingOptions\(\),pairingRuntime\)/,"Every delayed recheck must confirm the same page-memory pairing candidate still exists before provider verification.");
  assert.match(source,/crPairingActivationRetryAttempt\+=1;[\s\S]*void crInitialize\(\)/,"A bounded delayed recheck must return through normal initialization and the same provider-authorized attach path.");
  assert.match(source,/The previous Connected Rivalry remains safely attached while the new private pairing waits for Player Two/,"The creator UI must explicitly preserve old durable authority while pending B is non-authoritative.");
  assert.match(source,/no manual Verify\/Reattach is required/,"The repaired normal flow must state that manual reattach is not part of convergence.");
  assert.match(source,/capabilityChanged/);
  assert.match(source,/code\.value=crState\.rivalryId\|\|"";\s*if\(!code\.value&&crState\.prefillRivalryId\)code\.value=crState\.prefillRivalryId;/,"The Connected Rivalry input must visibly prefill from the pairing handoff without changing attachment authority.");
  assert.match(source,/crState\.attached\?"VERIFY \/ REATTACH":crState\.prefillRivalryId\?"VERIFY AUTO LINK":"ATTACH CONNECTED RIVALRY"/,"Manual attach/verify must remain a fallback surface rather than the normal pairing handoff.");

  assert.match(pairingSource,/status:"paired",busy:false,capability:result\.capability,expiresAtEpochMs:null/,"Player Two must retain the redeemed exact rivalry ID in page memory so Connected Rivalry can attach automatically.");
  assert.match(pairingSource,/Connected Rivalry below is prefilled automatically on this browser/,"Player One must be told the generated pairing ID is handed to Connected Rivalry automatically.");
  assert.match(pairingSource,/do not manually attach in the normal flow: return to Save Library or open Private Remote Joining/,"Player One normal flow must explicitly avoid unnecessary manual reattach after Player Two joins.");
  assert.match(pairingSource,/no second copy, paste, or manual Attach is required in the normal flow/,"Player Two normal flow must explicitly confirm automatic Connected Rivalry handoff.");
  assert.match(pairingSource,/select\.disabled=select\.disabled\|\|pairingState\.busy\|\|Boolean\(pairingState\.capability\)/,"Manager selection must lock as soon as CREATE/JOIN begins and remain locked while a pairing capability is live.");
  assert.match(pairingSource,/if\(pairingState\.busy\|\|pairingState\.capability\)\{if\(selectedEntry\)select\.value=selectedEntry\.key;return;\}/,"A late dropdown change event must be rejected and restored to the captured manager selection.");
  assert.match(pairingSource,/setState\(\{status:"creating-pair",busy:true,selectedBindingKey:bindingKey\(binding\),capability:null/,"CREATE must capture the manager binding before provider work begins.");
  assert.match(pairingSource,/setState\(\{status:"joining-pair",busy:true,selectedBindingKey:bindingKey\(binding\)/,"JOIN must capture the manager binding before provider redemption begins.");

  assert.doesNotMatch(source,/\bsetInterval\s*\(/,"The creator convergence repair must never create unbounded interval polling.");
  assert.doesNotMatch(pairingSource,/\bsetInterval\s*\(/,"Private pairing must not add polling to make auto-link work.");
  assert.doesNotMatch(source,/\blocalStorage\b/,"The automatic handoff must not create a new canonical or convenience localStorage key.");
  assert.doesNotMatch(pairingSource,/\blocalStorage\b/,"Pairing auto-link must stay page-memory plus existing IndexedDB, never localStorage.");
  for(const canonicalKey of ["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"]){
    assert.match(storageSource,new RegExp(canonicalKey.replace(/\./g,"\\.")),`Canonical storage authority must still include ${canonicalKey}.`);
  }
  assert.doesNotMatch(pairingSource,/careerModeShowdown\.connectedRivalry/,"Private pairing itself must not create or mutate the durable Connected Rivalry pointer store.");

  process.stdout.write("PASS Stage 4 Connected Rivalry restore + pairing QoL ultra-regression: creator/joiner exact-id handoff, bounded creator pending-to-active retries, Player One/Player Two binding isolation, dropdown-race lock, durable-pointer precedence, fail-closed prefill and zero-manual-reattach normal flow are protected without new storage, listing or authority\n");
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});