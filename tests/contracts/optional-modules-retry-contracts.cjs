const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const source=fs.readFileSync(path.resolve(__dirname,"../../js/optionalModules.js"),"utf8");
const calls={showdown:0,wheel:0,club:0,transfer:0,season:0};
const window={
  initializeShowdownUI(){calls.showdown+=1;},
  initializeLeagueWheel(){
    calls.wheel+=1;
    if(calls.wheel===1){throw new Error("temporary second starter failure");}
  },
  initializeClubAssignment(){calls.club+=1;},
  initializeTransferChallenge(){calls.transfer+=1;},
  initializeSeasonEngine(){calls.season+=1;}
};
const sandbox={window,document:{querySelector:()=>null},console};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:"js/optionalModules.js"});
// The scripts are already present. Exercise the public gameplay loading retry.
vm.runInContext("loadGameplayRuntimeFiles = async () => {};",sandbox);

(async()=>{
  await assert.rejects(window.ensureGameplayModules(),/temporary second starter failure/);
  assert.equal(window.getGameplayModuleState(),"error");
  assert.deepEqual(calls,{showdown:1,wheel:1,club:0,transfer:0,season:0},
    "a failed second starter must leave the first starter completed");

  assert.equal(await window.ensureGameplayModules(),true);
  assert.equal(window.getGameplayModuleState(),"ready");
  assert.deepEqual(calls,{showdown:1,wheel:2,club:1,transfer:1,season:1},
    "retry must skip successful starters, retry the failed starter, then finish the rest");

  assert.equal(await window.ensureGameplayModules(),true);
  assert.deepEqual(calls,{showdown:1,wheel:2,club:1,transfer:1,season:1},
    "ready gameplay must not run starters again");
  console.log("PASS optional gameplay modules retry starts completed modules once");
})().catch(error=>{console.error(error);process.exitCode=1;});
