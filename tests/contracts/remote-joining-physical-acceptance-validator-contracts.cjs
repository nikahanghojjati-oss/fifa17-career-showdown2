const assert=require("node:assert/strict");
const fs=require("node:fs");

const fingerprint="a".repeat(64);
const otherFingerprint="b".repeat(64);

function record(sequence,type,{role=null,state=null,revision=null,online=true,fp=null}={}){
  return {sequence,at:new Date(Date.UTC(2026,8,5,7,sequence,0)).toISOString(),type,online,deviceLabel:null,networkLabel:null,capabilityFingerprint:fp,status:"ready",role,sessionState:state,revision,pendingAction:null,capabilityPresent:!!fp,capabilityCopyAllowed:state!=="closed",busy:false};
}
function evidence({role,deviceLabel,networkLabel,device,interrupt=false,fp=fingerprint}){
  const records=[
    record(1,"recorder-started"),
    record(2,"remote-state",{role,state:"open",revision:0,fp}),
    record(3,"remote-state",{role,state:"active",revision:1,fp})
  ];
  if(interrupt){
    records.push(record(4,"browser-offline",{role,state:"active",revision:1,online:false,fp}));
    records.push(record(5,"browser-online",{role,state:"active",revision:1,online:true,fp}));
  }
  const next=records.length+1;
  records.push(record(next,"remote-state",{role,state:"closed",revision:2,fp}));
  records.push(record(next+1,"export-checkpoint",{role,state:"closed",revision:2,fp}));
  return {schema:"career-mode-showdown.remote-joining-physical-acceptance.v1",generatedAt:"2026-09-05T07:10:00.000Z",appVersion:"1.9.1",runtimeRevision:"1.9.1-r2",acceptanceMode:true,recorderStorage:"page-memory-only",recorderNetworkRequests:false,rawCapabilityIncluded:false,rawAccountIdIncluded:false,rawDeviceIdIncluded:false,rawRivalryIdIncluded:false,device,deviceLabel,networkLabel,records};
}

(async()=>{
  const source=fs.readFileSync("scripts/validate-remote-joining-physical-acceptance.mjs","utf8");
  const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
  const runner=fs.readFileSync("tests/support/run-contract-suite.cjs","utf8");
  const preflight=fs.readFileSync("tests/support/run-rjr-physical-preflight.sh","utf8");
  const next=fs.readFileSync("NEXT_TASK.md","utf8");
  const {validatePhysicalAcceptancePair,EVIDENCE_SCHEMA,RESULT_SCHEMA}=await import("../../scripts/validate-remote-joining-physical-acceptance.mjs");

  assert.equal(EVIDENCE_SCHEMA,"career-mode-showdown.remote-joining-physical-acceptance.v1");
  assert.equal(RESULT_SCHEMA,"career-mode-showdown.remote-joining-physical-acceptance-validation.v1");
  assert.equal(pkg.scripts["validate:rjr-physical"],"node scripts/validate-remote-joining-physical-acceptance.mjs");
  assert.equal(pkg.scripts["test:rjr-physical-preflight"],"npm run test:contracts && bash tests/support/run-rjr-physical-preflight.sh");
  assert.match(preflight,/node tests\/support\/static-server\.cjs/);
  assert.doesNotMatch(preflight,/npm run serve:test/);
  assert.match(preflight,/CMS_BASE_URL="\$base_url" npm run test:stage5h/);
  assert.match(preflight,/CMS_BASE_URL="\$base_url" npm run test:stage5i/);
  assert.match(preflight,/trap cleanup EXIT/);
  assert.match(runner,/remote-joining-physical-acceptance-validator-contracts\.cjs/);
  assert.match(next,/validate:rjr-physical/);
  assert.match(next,/test:rjr-physical-preflight/);
  assert.doesNotMatch(source,/setItem\(|addDoc\(|setDoc\(|updateDoc\(|deleteDoc\(|runTransaction\(/);

  const host=evidence({role:"host",deviceLabel:"Chromebook host",networkLabel:"Home Wi-Fi",interrupt:true,device:{userAgent:"ChromeOS Chrome",platform:"Linux x86_64",maxTouchPoints:0,screenWidth:1366,screenHeight:768}});
  const peer=evidence({role:"peer",deviceLabel:"iPhone peer",networkLabel:"iPhone cellular",device:{userAgent:"Mobile Safari",platform:"iPhone",maxTouchPoints:5,screenWidth:390,screenHeight:844}});
  const valid=validatePhysicalAcceptancePair(host,peer);
  assert.equal(valid.passed,true);
  assert.equal(valid.acceptanceEvidenceCandidate,true);
  assert.equal(valid.rjrLedgerMutated,false);
  assert.equal(valid.rjrCreditAwarded,0);
  assert.equal(valid.checks.sameSessionFingerprint,true);
  assert.equal(valid.checks.orderedOfflineOnlineRecovery,true);
  assert.equal(valid.checks.bothClosedRevisionTwo,true);
  assert.equal(valid.checks.noResurrection,true);
  assert.deepEqual([...valid.companionRuntimeProof],["npm run test:stage5h","npm run test:stage5i"]);

  const mismatch=validatePhysicalAcceptancePair(host,evidence({...peer,role:"peer",deviceLabel:"iPhone peer",networkLabel:"iPhone cellular",device:peer.device,fp:otherFingerprint}));
  assert.equal(mismatch.passed,false);assert.ok(mismatch.issues.some(item=>item.code==="CROSS_DEVICE_SESSION_MISMATCH"));

  const sameNetwork=structuredClone(peer);sameNetwork.networkLabel=host.networkLabel;
  const networkFailure=validatePhysicalAcceptancePair(host,sameNetwork);
  assert.equal(networkFailure.passed,false);assert.ok(networkFailure.issues.some(item=>item.code==="DISTINCT_NETWORK_LABELS_REQUIRED"));

  const noInterruption=validatePhysicalAcceptancePair(evidence({...host,role:"host",deviceLabel:"Chromebook host",networkLabel:"Home Wi-Fi",device:host.device,interrupt:false}),peer);
  assert.equal(noInterruption.passed,false);assert.ok(noInterruption.issues.some(item=>item.code==="ORDERED_NETWORK_RECOVERY_MISSING"));

  const resurrected=structuredClone(host);resurrected.records.push(record(8,"remote-state",{role:"host",state:"active",revision:1,fp:fingerprint}));
  const resurrectionFailure=validatePhysicalAcceptancePair(resurrected,peer);
  assert.equal(resurrectionFailure.passed,false);assert.ok(resurrectionFailure.issues.some(item=>item.code==="SESSION_RESURRECTED"));

  const leaked=structuredClone(peer);leaked.records[2].sessionId=`session_${"c".repeat(64)}`;
  const privacyFailure=validatePhysicalAcceptancePair(host,leaked);
  assert.equal(privacyFailure.passed,false);assert.ok(privacyFailure.issues.some(item=>item.code==="RAW_AUTHORITY_FIELD"));
  assert.equal(JSON.stringify(privacyFailure).includes(leaked.records[2].sessionId),false,"Validation results must not echo a raw capability.");

  const alternateAuthority=structuredClone(peer);alternateAuthority.records[2].account_id="raw-account-value";
  const alternateAuthorityFailure=validatePhysicalAcceptancePair(host,alternateAuthority);
  assert.equal(alternateAuthorityFailure.passed,false);assert.equal(alternateAuthorityFailure.checks.privacySafe,false);assert.ok(alternateAuthorityFailure.issues.some(item=>item.code==="RAW_AUTHORITY_FIELD"));assert.ok(alternateAuthorityFailure.issues.some(item=>item.code==="UNKNOWN_FIELD"));

  const unknownRoot=structuredClone(peer);unknownRoot.notes="unexpected evidence field";
  const unknownFieldFailure=validatePhysicalAcceptancePair(host,unknownRoot);
  assert.equal(unknownFieldFailure.passed,false);assert.equal(unknownFieldFailure.checks.privacySafe,false);assert.ok(unknownFieldFailure.issues.some(item=>item.code==="UNKNOWN_FIELD"));

  // A known field name must never turn into an unchecked container for private data.
  const scalarLocations=[
    ...Object.keys(peer).filter(key=>!["device","records"].includes(key)).map(key=>[key]),
    ...Object.keys(peer.device).map(key=>["device",key]),
    ...Object.keys(peer.records[2]).map(key=>["records",2,key]),
    ["records",2,"runtimeRevision"],["records",2,"errorCode"]
  ];
  for(const location of scalarLocations){
    for(const hidden of [{notes:"private-value-must-not-be-echoed"},["private-value-must-not-be-echoed"]]){
      const nested=structuredClone(peer);
      const container=location.slice(0,-1).reduce((value,key)=>value[key],nested);
      container[location.at(-1)]=hidden;
      const rejected=validatePhysicalAcceptancePair(host,nested);
      assert.equal(rejected.passed,false,`Nested data must fail at ${location.join(".")}`);
      assert.equal(rejected.checks.privacySafe,false,`Nested data must not be certified private at ${location.join(".")}`);
      assert.ok(rejected.issues.some(item=>item.code==="INVALID_FIELD_TYPE"));
      assert.equal(JSON.stringify(rejected).includes("private-value-must-not-be-echoed"),false);
    }
  }
  for(const [location,value] of [
    [["device","screenWidth"],"390"],[["device","maxTouchPoints"],-1],
    [["records",2,"status"],true],[["records",2,"capabilityCopyAllowed"],"true"],
    [["records",2,"at"],123],[["records",2,"revision"],1.5]
  ]){
    const malformed=structuredClone(peer);
    location.slice(0,-1).reduce((target,key)=>target[key],malformed)[location.at(-1)]=value;
    const rejected=validatePhysicalAcceptancePair(host,malformed);
    assert.equal(rejected.passed,false);
    assert.equal(rejected.checks.privacySafe,false);
    assert.ok(rejected.issues.some(item=>item.code==="INVALID_FIELD_TYPE"));
  }
  const untrustedPath=structuredClone(peer);
  untrustedPath["private-key-must-not-be-echoed"]={sessionId:`session_${"d".repeat(64)}`};
  const pathFailure=validatePhysicalAcceptancePair(host,untrustedPath);
  assert.equal(pathFailure.passed,false);assert.equal(pathFailure.checks.privacySafe,false);
  assert.equal(JSON.stringify(pathFailure).includes("private-key-must-not-be-echoed"),false);
  assert.equal(JSON.stringify(pathFailure).includes(untrustedPath["private-key-must-not-be-echoed"].sessionId),false);

  const wrongRuntime=structuredClone(peer);wrongRuntime.runtimeRevision="1.9.1-r1";
  const runtimeFailure=validatePhysicalAcceptancePair(host,wrongRuntime);
  assert.equal(runtimeFailure.passed,false);assert.ok(runtimeFailure.issues.some(item=>item.code==="RUNTIME_REVISION_MISMATCH"));

  process.stdout.write("PASS physical Remote Joining evidence validator enforces a closed privacy-safe schema and accepts only one host/peer session with distinct devices/networks, ordered offline recovery, terminal revision 2 and no resurrection; tooling awards zero RJR.\n");
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
