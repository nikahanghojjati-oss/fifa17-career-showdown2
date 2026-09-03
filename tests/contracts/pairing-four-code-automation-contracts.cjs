const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const pairing=require("../../js/sparkPrivatePairing.js");
const connected=require("../../js/sparkConnectedRivalry.js");

class FakeTimestamp{
  constructor(ms){this.ms=ms;}
  toMillis(){return this.ms;}
  static fromMillis(ms){return new FakeTimestamp(ms);}
}
const snapshot=value=>({exists:()=>value!==undefined,data:()=>value});
function harness(){
  const docs=new Map();
  const firestore={name:"memory"};
  const sdk={
    Timestamp:FakeTimestamp,
    doc(_firestore,...parts){return {path:parts.join("/")};},
    async runTransaction(_firestore,callback){
      const staged=new Map();
      const tx={
        async get(ref){return snapshot(staged.has(ref.path)?staged.get(ref.path):docs.get(ref.path));},
        set(ref,value){staged.set(ref.path,value);}
      };
      const result=await callback(tx);
      for(const [path,value] of staged)docs.set(path,value);
      return result;
    }
  };
  return {docs,firestore,sdk};
}
function identity(hex){return {schemaVersion:1,installationId:`installation_${hex.repeat(32).slice(0,32)}`,deviceId:`device_${hex.repeat(32).slice(0,32)}`,createdAtEpochMs:1700000000000};}
function binding(role,hex,label){return {saveId:`save_${hex.repeat(24).slice(0,24)}`,profileId:`profile_${hex.repeat(24).slice(0,24)}`,managerRole:role,displayLabel:label};}

(async()=>{
  const source=fs.readFileSync("js/sparkPrivatePairing.js","utf8");
  assert.match(source,/PRIVATE PAIRING CODE · COPY ONCE:/,"Player One generated capability must be clearly labeled for a single copy action.");
  assert.match(source,/COPY PAIRING CODE/,"Player One must have an explicit pairing-code copy button.");
  assert.match(source,/navigator\.clipboard\.writeText\(capability\)/,"The copy button must copy the exact immutable full capability.");
  assert.match(source,/fallbackCopy\.value=capability/);
  assert.match(source,/fallbackCopy\.setSelectionRange\(0,capability\.length\)/);
  assert.match(source,/capabilityText=createElement\("code","",pairingState\.capability\)/,"The full generated pairing capability must be visibly rendered without truncation.");
  assert.match(source,/pairingState\.status==="paired"&&pairingState\.capability\)\{codeInput\.value=pairingState\.capability;codeInput\.readOnly=true/,"After Player Two succeeds, the one pasted code must remain visibly retained and immutable.");
  assert.doesNotMatch(source,/codeInput\.value="";setState\(\{status:"paired"/,"Successful join must not erase the only pasted capability before four-way equality can be confirmed.");
  assert.match(source,/The one code pasted above is retained as the exact Connected Rivalry ID/);
  assert.match(source,/no second copy, paste, or manual Attach is required in the normal flow/);
  const connectedSource=fs.readFileSync("js/sparkConnectedRivalry.js","utf8");
  assert.match(connectedSource,/const pairingCandidate=crResolvePairingCandidate\(context\.pairingState,bindings/,"Initialization must evaluate current pairing B even with durable A.");
  assert.match(connectedSource,/pairingDiffersFromDurable/,"Initialization must distinguish pairing B from durable A.");
  assert.match(connectedSource,/if\(autoAttachResult&&autoAttachResult\.ok===true\)\{\s*binding=pairingCandidate\.binding;\s*pointer=autoAttachResult\.pointer;/,"Durable A can change only after provider-verified attach accepts B.");

  const pairingRuntime={bindingKey:pairing.bindingKey};
  const rounds=25;
  for(let index=0;index<rounds;index+=1){
    const h=harness();
    const digit=(index%10).toString(16);
    const other=((index+5)%16).toString(16);
    const aUser={uid:`acct_four_code_a_${index}`};
    const bUser={uid:`acct_four_code_b_${index}`};
    const aIdentity=identity(digit);
    const bIdentity=identity(other);
    const aBinding=binding("playerOne",digit,"Player One");
    const bBinding=binding("playerTwo",other,"Player Two");
    const now=1700200000000+index*10000;
    await pairing.registerDevice({user:aUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:aIdentity,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
    await pairing.registerDevice({user:bUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:bIdentity,cryptoImpl:crypto.webcrypto,nowEpochMs:now});

    const capability=`pair_${index.toString(16).padStart(2,"0").repeat(32)}`;
    const created=await pairing.createPairing({user:aUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:aIdentity,binding:aBinding,capability,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
    assert.equal(created.ok,true,`round ${index}: creator failed`);
    const playerOneGenerated=created.capability;
    assert.equal(playerOneGenerated,capability,`round ${index}: generated capability drifted`);

    const playerOneCandidate=connected.resolvePairingCandidate({capability:playerOneGenerated,selectedBindingKey:pairing.bindingKey(aBinding)},[aBinding,bBinding],pairingRuntime);
    assert.ok(playerOneCandidate,`round ${index}: Player One Connected Rivalry prefill missing`);
    const playerOneConnectedRivalry=playerOneCandidate.rivalryId;

    let pasteActions=0;
    const pasteOnce=value=>{pasteActions+=1;return value;};
    const playerTwoJoinInput=pasteOnce(playerOneGenerated);
    const joined=await pairing.redeemPairing({user:bUser,firestore:h.firestore,firebaseSdk:h.sdk,identity:bIdentity,binding:bBinding,capability:playerTwoJoinInput,cryptoImpl:crypto.webcrypto,nowEpochMs:now+1000});
    assert.equal(joined.ok,true,`round ${index}: Player Two join failed`);
    assert.equal(pasteActions,1,`round ${index}: Player Two required more than one paste action`);

    const playerTwoCandidate=connected.resolvePairingCandidate({capability:joined.capability,selectedBindingKey:pairing.bindingKey(bBinding)},[aBinding,bBinding],pairingRuntime);
    assert.ok(playerTwoCandidate,`round ${index}: Player Two Connected Rivalry handoff missing`);
    const playerTwoConnectedRivalry=playerTwoCandidate.rivalryId;

    assert.deepEqual(
      [playerOneGenerated,playerOneConnectedRivalry,playerTwoJoinInput,playerTwoConnectedRivalry],
      [capability,capability,capability,capability],
      `round ${index}: the four capability representations were not byte-for-byte identical`
    );

    const root=h.docs.get(`rivalries/${capability}`);
    assert.equal(root.data.connectionState,"active",`round ${index}: pairing did not become active`);
    assert.deepEqual(root.data.authorizedAccountIds,[aUser.uid,bUser.uid],`round ${index}: active rivalry authority drifted`);

    const p1AutoAttach=await connected.attachRivalry({user:aUser,firestore:h.firestore,firebaseSdk:h.sdk,deviceId:aIdentity.deviceId,binding:aBinding,rivalryId:playerOneConnectedRivalry,persistPointer:false});
    assert.equal(p1AutoAttach.ok,true,`round ${index}: Player One could not verify/attach through the normal Connected Rivalry authority after Player Two joined`);
    assert.equal(p1AutoAttach.rivalryId,capability);
    const p2AutoAttach=await connected.attachRivalry({user:bUser,firestore:h.firestore,firebaseSdk:h.sdk,deviceId:bIdentity.deviceId,binding:bBinding,rivalryId:playerTwoConnectedRivalry,persistPointer:false});
    assert.equal(p2AutoAttach.ok,true,`round ${index}: Player Two could not auto-attach the redeemed rivalry`);
    assert.equal(p2AutoAttach.rivalryId,capability);
  }

  process.stdout.write(`PASS pairing four-code automation ultra-contract: ${rounds} deterministic two-account rounds, exact P1-generated/P1-Connected/P2-one-paste/P2-Connected equality, active-rivalry verification, and zero second-paste requirement\n`);
})().catch(error=>{console.error(error);process.exit(1);});