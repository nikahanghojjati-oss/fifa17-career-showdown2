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
assert.match(presentation,/singleClickActionSerialization:true/);
assert.match(presentation,/contextScopedRevealWitnesses:true/);
assert.match(presentation,/oneClickFinalConfirmationHandoff:true/);
assert.match(presentation,/if\(actionPromise\)return actionPromise;/,"Shared setup controls must coalesce repeat taps while one authoritative action is in flight.");
assert.match(presentation,/button\.setAttribute\("aria-busy","true"\)/,"Shared setup controls must expose immediate busy state on the first tap.");
assert.match(presentation,/confirmed&&state\?\.setup\?\.phase==="SHOWDOWN_CONFIRMED"[\s\S]*ssjpOpenCareerStart\(\)/,"The second manager's final confirmation must hand off to Career Start in the same click.");
assert.match(presentation,/function ssjpResetWitnesses\(\)[\s\S]*witnessedLeagueId=null[\s\S]*clubRevealComplete=false/,"Reveal witnesses must be scoped to one rivalry and reset before a fresh one.");

assert.match(presentation,/providerOwnsDrawAuthority:true/);
assert.match(presentation,/localRandomLeagueAuthority:false/);
assert.match(presentation,/localRandomClubAuthority:false/);
assert.match(presentation,/canonicalStorageMutation:false/);
assert.match(presentation,/dataset\.sharedLeagueWitnessed/);
assert.match(presentation,/dataset\.sharedClubPacksWitnessed/);
assert.match(presentation,/setInterval\(\(\)=>void ssjpPoll\(\),POLL_MS\)/);
assert.match(presentation,/if\(witnessedLeagueId!==setup\.leagueId\)\{ssjpForceScreen\("leagueWheelScreen"\);return ssjpRenderLeague\(\);\}/);
assert.match(presentation,/if\(revealingClubDigest===digest&&!clubRevealComplete\)return;/,"A provider poll must preserve an in-progress club-pack reveal for the same authoritative digest.");

assert.match(entry,/"CONTINUE CAREER"/,'The player-facing paired-first resume action must use the single-product Career language.');
assert.doesNotMatch(entry,/CONTINUE TO LEAGUE WHEEL|START SHARED SHOWDOWN/,'Retired engineering-oriented entry labels must not return.');
assert.match(entry,/productionSharedShowdownPresentation\.js/);
assert.match(entry,/engineeringSetupPanelPlayerFacing:false/);
assert.match(entry,/singleProductEntry:true/);
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
  assert.doesNotMatch(source,/billingRequired\s*:\s*true/i);
  assert.doesNotMatch(source,/blazeRequired\s*:\s*true/i);
  assert.doesNotMatch(source,/cloudRunRequired\s*:\s*true/i);
  assert.doesNotMatch(source,/cloudFunctionsRequired\s*:\s*true/i);
  assert.doesNotMatch(source,/appCheckEnforcementRequired\s*:\s*true/i);
}
assert.match(presentation,/billingRequired:false/);
assert.match(presentation,/blazeRequired:false/);
assert.match(presentation,/cloudRunRequired:false/);
assert.match(presentation,/cloudFunctionsRequired:false/);
assert.match(presentation,/appCheckEnforcementRequired:false/);
assert.match(bridge,/billingRequired:false/);

process.stdout.write("PASS Shared Showdown polished presentation contracts: both manager roles witness the real league wheel and club packs; first taps become busy immediately, repeat taps coalesce, final confirmation can hand off to Career Start in one click, reveal witnesses reset per rivalry, provider draw authority remains sole, and the acceptance recorder stays bridged away from the engineering panel.\n");
