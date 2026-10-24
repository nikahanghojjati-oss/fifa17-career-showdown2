"use strict";
const assert=require("node:assert/strict");

// Restore the account state old releases left behind. Current UI starts are always real;
// only emulator admin can arrange markerless historical fixtures for migration/recovery audits.
async function restoreHistoricalMarkerlessAccounts(managers,{firestorePort=8181}={}){
  for(const m of managers){
    const uid=await m.page.evaluate(()=>window.CareerModeSparkConnectedAccount.getState().accountId);
    assert.ok(uid,"historical fixture requires a signed-in emulator account");
    const url=new URL(m.page.url());
    assert.ok(["127.0.0.1","localhost"].includes(url.hostname)&&url.searchParams.get("cmsEmulator")==="1","historical fixture is emulator-only");
    for(const path of ["careerStart/current","partner/current","partnerInbox/current"]){
      const response=await fetch(`http://127.0.0.1:${firestorePort}/v1/projects/demo-cms-browser-journey/databases/(default)/documents/accounts/${uid}/${path}`,{method:"DELETE",headers:{Authorization:"Bearer owner"}});
      assert.ok(response.ok||response.status===404,`restore historical ${path}: ${response.status}`);
    }
    await m.page.evaluate(accountId=>{
      window.CareerModeCareerStartMarker?.clearCache?.();
      window.dispatchEvent(new CustomEvent("career-mode-career-start-change",{detail:{accountId,status:"none"}}));
    },uid);
  }
}
module.exports={restoreHistoricalMarkerlessAccounts};
