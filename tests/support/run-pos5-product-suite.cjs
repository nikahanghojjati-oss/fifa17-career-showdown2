const { spawnSync } = require("node:child_process");

const files = [
  "tests/support/run-operations-audit.cjs",
  "tests/contracts/static-app-release-contracts.cjs",
  "tests/contracts/shared-showdown-polished-presentation-contracts.cjs",
  "tests/contracts/milestone-delivery-progress-contracts.cjs",
  "tests/contracts/shared-showdown-dual-full-screen-contracts.cjs",
  "tests/support/run-current-product-contracts.cjs",
  "tests/contracts/ssjr-production-shared-setup-evidence-recorder-contracts.cjs",
  "tests/contracts/ssjr-production-storage-observation-contracts.cjs",
  "tests/contracts/stage5g-remote-joining-reconnect-contracts.cjs"
];

const timeoutMs=Number.parseInt(process.env.CMS_SUITE_ENTRY_TIMEOUT_MS||"240000",10);
if(!Number.isInteger(timeoutMs)||timeoutMs<1000)throw new Error("CMS_SUITE_ENTRY_TIMEOUT_MS must be an integer >= 1000.");
const failures=[];
for(const file of files){
  const result=spawnSync(process.execPath,[file],{encoding:"utf8",timeout:timeoutMs,maxBuffer:16*1024*1024});
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  if(result.status!==0||result.error)failures.push({file,status:result.status,signal:result.signal,error:result.error?.message||null});
}
if(failures.length){
  console.error(`FC-2 repository census failed in ${failures.length} suite entrypoint(s):`);
  for(const failure of failures)console.error(`- ${failure.file}${failure.signal?` signal=${failure.signal}`:""}${failure.error?` error=${failure.error}`:""}`);
  process.exitCode=1;
}else console.log(`PASS FC-2 repository current-product census (${files.length} entrypoints)`);
