const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

const presentation=read("js/productionSharedShowdownPresentation.js");
const entry=read("js/productionSharedJourneyEntry.js");
const guard=read("js/productionSharedJourneyGuard.js");
const bridge=read("js/ssjrAcceptancePolishedBridge.js");
const recorder=read("js/ssjrProductionAcceptanceRecorder.js");
const bootstrap=read("js/ssjr.js");

assert.match(presentation,/usesLeagueWheelScreen:true/);
assert.match(presentation,/usesClubPackRevealScreen:true/);
assert.match(presentation,/bothManagerRolesWitnessLeagueWheel:true/);
assert.match(presentation,/bothManagerRolesWitnessClubPacks:true/);
assert.match(presentation,/peerAutoRefreshesAuthority:true/);
assert.match(presentation,/providerOwnsDrawAuthority:true/);
assert.match(presentation,/localRandomLeagueAuthority:false/);
assert.match(presentation,/localRandomClubAuthority:false/);
assert.match(presentation,/canonicalStorageMutation:false/);
assert.match(presentation,/dataset\.sharedLeagueWitnessed/);
assert.match(presentation,/dataset\.sharedClubPacksWitnessed/);
assert.match(presentation,/setInterval\(\(\)=>void ssjpPoll\(\),POLL_MS\)/);
assert.match(presentation,/if\(witnessedLeagueId!==setup\.leagueId\)\{ssjpForceScreen\("leagueWheelScreen"\);return ssjpRenderLeague\(\);\}/);

assert.match(entry,/CONTINUE TO LEAGUE WHEEL/);
assert.match(entry,/productionSharedShowdownPresentation\.js/);
assert.match(entry,/engineeringSetupPanelPlayerFacing:false/);
assert.doesNotMatch(entry,/OPEN AUTHORITATIVE SHARED SETUP/);
assert.match(guard,/routesPolishedPresentationClicks:true/);

assert.match(bridge,/acceptanceOnly:true/);
assert.match(bridge,/engineeringPanelPlayerFacing:false/);
assert.match(bridge,/bothManagerRoles:true/);
assert.match(bridge,/openPanel:ssjrabPolishedOpen/);
assert.match(bridge,/productionSharedShowdownPresentation\.js/);
assert.match(recorder,/async function openSetup\(\)\{const api=await ensureSetup\(\);return api\.openPanel\(\);\}/);
assert.ok(bootstrap.indexOf("ssjr-acceptance-polished-bridge")<bootstrap.indexOf("ssjr-production-acceptance-recorder"),"Acceptance bridge must load before the guided recorder.");

for(const source of [presentation,entry,guard,bridge]){
  assert.doesNotMatch(source,/Blaze|Cloud Run|Cloud Functions/i);
}
assert.match(presentation,/billingRequired:false/);
assert.match(bridge,/billingRequired:false/);

process.stdout.write("PASS Shared Showdown polished presentation contracts: both manager roles must witness the real league wheel and club packs, peer authority auto-refreshes, provider draw authority remains sole, and the acceptance recorder is bridged away from the engineering panel.\n");
