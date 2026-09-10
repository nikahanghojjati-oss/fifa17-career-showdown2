import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const target='tests/browser/ssjr-production-acceptance-recorder-audit.cjs';
const original=fs.readFileSync(target,'utf8');
let text=original;

const eventAnchor='  const pageErrors=[];page.on("pageerror",error=>pageErrors.push(error.stack||error.message));';
if(!text.includes(eventAnchor))throw new Error('r14 diagnostic page event anchor missing');
text=text.replace(eventAnchor,eventAnchor+'\n  page.on("console",message=>{if(message.type()==="warning"||message.type()==="error")console.log("R14_BROWSER_"+message.type().toUpperCase()+" "+message.text());});');

const reloadMarker='    await acceptance.page.evaluate(()=>window.__ssjrRecorderPrepareReload());';
const markerIndex=text.indexOf(reloadMarker);
if(markerIndex<0)throw new Error('r14 diagnostic reload marker missing');
const waitLine='    await acceptance.page.locator("#ssjrProductionAcceptanceRecorder").waitFor({state:"visible",timeout:7000});';
const waitIndex=text.indexOf(waitLine,markerIndex);
if(waitIndex<0)throw new Error('r14 diagnostic post-reload wait missing');

const diagnostic=`    await acceptance.page.waitForTimeout(5000);\n    const r14Diag=await acceptance.page.evaluate(()=>({\n      href:location.href,\n      readyState:document.readyState,\n      loadingHidden:document.querySelector("#loadingScreen")?.classList.contains("hidden")===true,\n      recorderPanel:Boolean(document.querySelector("#ssjrProductionAcceptanceRecorder")),\n      acceptanceParam:new URLSearchParams(location.search).get("ssjr-acceptance"),\n      apis:{\n        setup:Boolean(window.CareerModeProductionSharedShowdownSetup),\n        entry:Boolean(window.CareerModeProductionSharedJourneyEntry),\n        guard:Boolean(window.CareerModeProductionSharedJourneyGuard),\n        careerStart:Boolean(window.CareerModeProductionSharedCareerStart),\n        transfer:Boolean(window.CareerModeProductionSharedTransferChallenge),\n        results:Boolean(window.CareerModeProductionSharedSeasonResults),\n        commit:Boolean(window.CareerModeProductionSharedSeasonCommit),\n        scoring:Boolean(window.CareerModeProductionSharedCanonicalScoring),\n        history:Boolean(window.CareerModeProductionSharedHistoryConvergence),\n        multiProtocol:Boolean(window.CareerModeSharedMultiSeasonProgression),\n        multiProduction:Boolean(window.CareerModeProductionSharedMultiSeasonProgression),\n        reconnectProtocol:Boolean(window.CareerModeSharedJourneyReconnect),\n        reconnectProduction:Boolean(window.CareerModeProductionSharedJourneyReconnect),\n        polishedBridge:Boolean(window.CareerModeSSJRAcceptancePolishedBridge),\n        stage5f:Boolean(window.CareerModeStage5fProductionAuthenticatedNegatives),\n        negativeRunner:Boolean(window.CareerModeSSJRProductionNegativeProbeRunner),\n        negativeEvidence:Boolean(window.CareerModeSSJRProductionNegativeEvidence),\n        recorder:Boolean(window.CareerModeSSJRProductionAcceptanceRecorder),\n        actor:Boolean(window.CareerModeSSJRProductionActorEvidence)\n      },\n      scripts:Array.from(document.scripts).map(script=>script.src).filter(Boolean).map(src=>src.split("/").pop()).filter(name=>name&&["ssjr","shared","production","stage5f"].some(token=>name.toLowerCase().includes(token))).slice(-80),\n      resources:performance.getEntriesByType("resource").map(entry=>entry.name.split("/").pop()).filter(name=>name&&["ssjr","shared","production","stage5f"].some(token=>name.toLowerCase().includes(token))).slice(-80)\n    }));\n    console.log("R14_POST_RELOAD_DIAG "+JSON.stringify(r14Diag));\n`;
text=text.slice(0,waitIndex)+diagnostic+text.slice(waitIndex);

try{
  fs.writeFileSync(target,text);
  const result=spawnSync(process.execPath,[target],{stdio:'inherit',env:{...process.env,CMS_CHROMIUM_MULTI_CONTEXT:'1'}});
  process.exitCode=result.status??1;
} finally {
  fs.writeFileSync(target,original);
}
