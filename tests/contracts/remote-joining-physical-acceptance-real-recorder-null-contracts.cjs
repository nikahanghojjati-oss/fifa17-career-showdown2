const assert=require("node:assert/strict");

const fingerprint="c".repeat(64);
function record(sequence,type,{role=null,state=null,revision=null,online=true,fp=null,status=null,copy=null,busy=null}={}){
  return {sequence,at:new Date(Date.UTC(2026,8,5,17,sequence,0)).toISOString(),type,online,deviceLabel:null,networkLabel:null,capabilityFingerprint:fp,status,role,sessionState:state,revision,pendingAction:null,capabilityPresent:!!fp,capabilityCopyAllowed:copy,busy};
}
function evidence({role,deviceLabel,networkLabel,device,interrupt=false}){
  const records=[
    record(1,"recorder-started"),
    record(2,"labels-updated"),
    record(3,"remote-state",{role,state:"active",revision:1,fp:fingerprint,status:"ready",copy:true,busy:false})
  ];
  if(interrupt){
    records.push(record(4,"browser-offline",{role,state:"active",revision:1,online:false,fp:fingerprint,status:"ready",copy:true,busy:false}));
    records.push(record(5,"browser-online",{role,state:"active",revision:1,online:true,fp:fingerprint,status:"ready",copy:true,busy:false}));
  }
  const next=records.length+1;
  records.push(record(next,"remote-state",{role,state:"closed",revision:2,fp:fingerprint,status:"ready",copy:true,busy:false}));
  records.push(record(next+1,"export-checkpoint",{role,state:"closed",revision:2,fp:fingerprint,status:"ready",copy:true,busy:false}));
  return {schema:"career-mode-showdown.remote-joining-physical-acceptance.v1",generatedAt:"2026-09-05T17:10:00.000Z",appVersion:"1.9.1",runtimeRevision:"1.9.1-r2",acceptanceMode:true,recorderStorage:"page-memory-only",recorderNetworkRequests:false,rawCapabilityIncluded:false,rawAccountIdIncluded:false,rawDeviceIdIncluded:false,rawRivalryIdIncluded:false,device,deviceLabel,networkLabel,records};
}

(async()=>{
  const {validatePhysicalAcceptancePair}=await import("../../scripts/validate-remote-joining-physical-acceptance.mjs");
  const host=evidence({role:"host",deviceLabel:"Chromebook host",networkLabel:"Home WiFi",device:{userAgent:"ChromeOS Chrome",platform:"Linux x86_64",maxTouchPoints:0,screenWidth:1920,screenHeight:1080}});
  const peer=evidence({role:"peer",deviceLabel:"iPhone peer",networkLabel:"iPhone cellular",interrupt:true,device:{userAgent:"Mobile Safari",platform:"iPhone",maxTouchPoints:5,screenWidth:440,screenHeight:956}});
  const valid=validatePhysicalAcceptancePair(host,peer);
  assert.equal(valid.passed,true,"Real Stage 5I pre-runtime records use null for capabilityCopyAllowed and busy and must validate without normalizing the exported evidence.");
  assert.equal(valid.checks.privacySafe,true);
  assert.equal(valid.checks.orderedOfflineOnlineRecovery,true);

  const activeNull=structuredClone(peer);
  activeNull.records[2].capabilityCopyAllowed=null;
  activeNull.records[2].busy=null;
  const activeRejected=validatePhysicalAcceptancePair(host,activeNull);
  assert.equal(activeRejected.passed,false,"Nullable remote flags must not be accepted after a Remote Joining state exists.");
  assert.ok(activeRejected.issues.some(item=>item.code==="NULL_REMOTE_FLAG_CONTEXT_INVALID"));

  const mixedNull=structuredClone(peer);
  mixedNull.records[0].capabilityCopyAllowed=null;
  mixedNull.records[0].busy=false;
  const mixedRejected=validatePhysicalAcceptancePair(host,mixedNull);
  assert.equal(mixedRejected.passed,false,"Pre-runtime recorder flags must be both null or both booleans, never mixed.");
  assert.ok(mixedRejected.issues.some(item=>item.code==="NULL_REMOTE_FLAG_CONTEXT_INVALID"));

  process.stdout.write("PASS physical acceptance validator accepts recorder-owned paired pre-runtime null flags only before Remote Joining state exists.\n");
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
