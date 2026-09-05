import fs from "node:fs";

const path="REMOTE_JOINING_READINESS.json";
const ledger=JSON.parse(fs.readFileSync(path,"utf8"));
if(ledger.modelVersion!=="RJR-1"||ledger.denominator!==100)throw new Error("Unexpected RJR model.");
if(ledger.currentScore===100){process.stdout.write("RJR100 already reconciled.\n");process.exit(0);}
if(ledger.currentScore!==91)throw new Error(`Expected fixed RJR91 entry boundary, found ${ledger.currentScore}.`);
const device=ledger.domains.find(item=>item.id==="devices-pairing-connected-rivalry-remote-join");
const hardening=ledger.domains.find(item=>item.id==="real-device-hardening-release");
if(!device||device.earned!==22||device.weight!==30)throw new Error("Unexpected Remote Joining domain boundary.");
if(!hardening||hardening.earned!==9||hardening.weight!==10)throw new Error("Unexpected hardening domain boundary.");

const physicalEvidence="2026-09-05 accepted sanitized Stage 5I production evidence on v1.9.1 / 1.9.1-r2 proves the previously uncredited physical Remote Joining boundary across a Chromebook host on Home WiFi and an iPhone peer on independent cellular data: one private session fingerprint spans both physical devices; both converge to ACTIVE revision 1; the participating iPhone records a real ordered browser-offline then browser-online transition and returns to the same ACTIVE revision 1 session without a replacement or duplicate session; both then converge to terminal CLOSED revision 2 and remain closed through later reads with no resurrection. The two sanitized evidence artifacts exclude raw session capability/account/device/rivalry authority, use page-memory-only recorder state and zero recorder network writes. This closes the remaining fixed Remote Joining physical capability cluster without double-counting Host, Join, refresh, offline, online or Close as separate arbitrary points.";
const stableEvidence="2026-09-05 final stable Remote Joining release acceptance combines the accepted two-physical-device/two-independent-network production evidence with unchanged production v1.9.1 / 1.9.1-r2 and post-merge main 264237056896d2b9d84f69c908da5b14e2b8e97d proof: all 15 main-push workflow families pass, Release Integration Burn-In 33980841831 passes both independent complete journeys, and Stability 33980841859 passes contracts, Chromium Stability, deployed runtime-byte verification and the complete deployed-site journey. This closes the final fixed stable-release hardening point; PRs, CI volume, merge, deployment, validator tooling, documentation, WEC and SNS themselves receive zero credit.";

device.earned=30;
const staleDeviceIndex=device.evidence.findIndex(text=>text.includes("Remote Joining-specific two-physical-device/two-network reconnect and adverse-network hardening remains uncredited"));
if(staleDeviceIndex>=0){
  device.evidence[staleDeviceIndex]=device.evidence[staleDeviceIndex].replace("Remote Joining-specific two-physical-device/two-network reconnect and adverse-network hardening remains uncredited.","Remote Joining-specific two-physical-device/two-network reconnect and adverse-network hardening was the remaining uncredited capability before the accepted 2026-09-05 physical run.");
}
device.evidence.push(physicalEvidence);

hardening.earned=10;
const staleHardeningIndex=hardening.evidence.findIndex(text=>text.includes("Remote Joining-specific two-network and real-device token-lifecycle/reconnect testing and final stable Remote Joining release acceptance remain incomplete"));
if(staleHardeningIndex>=0)hardening.evidence[staleHardeningIndex]=stableEvidence;
else hardening.evidence.push(stableEvidence);

const last=ledger.evidenceHistory.at(-1);
if(!last||last.score!==91)throw new Error("Unexpected latest RJR history score.");
ledger.evidenceHistory.push({
  recordedAt:"2026-09-05T17:08:06.674Z",
  eventId:"production-rjr-physical-two-device-two-network-acceptance",
  score:99,
  delta:8,
  domainId:"devices-pairing-connected-rivalry-remote-join",
  reason:"Accepted sanitized Stage 5I evidence from a Chromebook host on Home WiFi and iPhone peer on independent cellular proves the entire previously uncredited physical Remote Joining capability cluster: one same private session across two physical devices, both ACTIVE revision 1, a real participating-device offline -> online recovery back to that same session without duplicate/replacement authority, both CLOSED revision 2, and no resurrection. The +8 is exactly the remaining capacity of the fixed 30-point domain and is awarded once for closure of that capability cluster, not as separate points for Host, Join, refresh, offline, online or Close. The evidence files are sanitized and authority-safe; PR #197, validator correction, source, tests, CI, review, merge, deployment, WEC and SNS receive zero credit."
});
ledger.evidenceHistory.push({
  recordedAt:"2026-09-05T17:34:00.000Z",
  eventId:"production-rjr-final-stable-release-acceptance",
  score:100,
  delta:1,
  domainId:"real-device-hardening-release",
  reason:"After the physical capability is accepted, the unchanged v1.9.1 / 1.9.1-r2 production release is sealed by post-merge main 264237056896d2b9d84f69c908da5b14e2b8e97d: all 15 push workflow families pass, Release Integration Burn-In 33980841831 passes two independent complete journeys, and Stability 33980841859 passes contracts, Chromium, deployed runtime-byte verification and the complete deployed-site journey. Exactly +1 closes the final fixed hardening/stable-release capacity. The workflow executions themselves receive no independent readiness credit."
});
ledger.currentScore=ledger.domains.reduce((sum,item)=>sum+item.earned,0);
if(ledger.currentScore!==100)throw new Error(`Reconciliation did not reach fixed RJR100: ${ledger.currentScore}.`);
fs.writeFileSync(path,`${JSON.stringify(ledger,null,2)}\n`);
process.stdout.write("Reconciled fixed RJR-1 to 100/100 from accepted physical and stable-release evidence.\n");
