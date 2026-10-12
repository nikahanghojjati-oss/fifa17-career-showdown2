const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

// A rejected start may be retried, but an unchanged NOT_STARTED view is not a success.
const source=fs.readFileSync(path.join(__dirname,"../../js/productionSharedTransferChallenge.js"),"utf8");
const marker='  const SIGNING_NAME_MAX=80;';
assert.equal(source.split(marker).length,2,"expected a single outcome-check injection point");
const sandbox={};
vm.runInNewContext(source.replace(marker,'  globalThis.__auditOutcomeShown=pstcOutcomeShown;\n'+marker),sandbox,{filename:"productionSharedTransferChallenge.js"});
const outcome=sandbox.__auditOutcomeShown;
assert.equal(typeof outcome,"function");
assert.equal(outcome("startWindow",{state:{phase:"NOT_STARTED"}}),false,"a still-closed transfer window must not be treated as successfully started");
assert.equal(outcome("startWindow",{state:{phase:"WINDOW_OPEN"}}),true,"an opened window satisfies the start");
assert.equal(outcome("startWindow",{state:{phase:"GUESS_ENTRY"}}),true,"a window already finished by both managers satisfies an earlier start");
assert.equal(outcome("startWindow",{}),false,"missing authority cannot prove a start");
console.log("PASS: shared transfer start retry only reports success once the window advanced");
