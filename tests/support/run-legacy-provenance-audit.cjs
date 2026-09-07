const { spawnSync } = require("node:child_process");

const files = [
  "tests/contracts/handoff-immediate-next-task-contracts.cjs",
  "tests/contracts/handoff-proximity-stage-contracts.cjs",
  "tests/contracts/owner-progress-reporting-contracts.cjs",
  "tests/contracts/sle-handoff-packaging-contracts.cjs",
  "tests/contracts/next-developer-prompt-contracts.cjs",
  "tests/contracts/github-cli-bootstrap-contracts.cjs",
  "tests/contracts/remote-data-privacy-retention-contracts.cjs",
  "tests/contracts/remote-joining-readiness-contracts.cjs",
  "tests/contracts/rjr-reporting-authority-contracts.cjs",
  "tests/contracts/remote-joining-physical-acceptance-validator-contracts.cjs",
  "tests/contracts/r2-production-proof-publication-contracts.cjs",
  "tests/contracts/remote-joining-physical-acceptance-real-recorder-null-contracts.cjs",
  "tests/contracts/cloud-foundation-contracts.cjs",
  "tests/contracts/cloud-sync-two-device-harness-contracts.cjs",
  "tests/contracts/work-environment-continuity-contracts.cjs",
  "tests/contracts/work-environment-interruption-resilience-contracts.cjs",
  "tests/contracts/work-environment-forward-progress-contracts.cjs"
];

function escape(value){
  return String(value || "").replace(/%/g,"%25").replace(/\r/g,"%0D").replace(/\n/g,"%0A").slice(0,7000);
}

for(const file of files){
  const result = spawnSync(process.execPath,[file],{encoding:"utf8"});
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  if(result.status!==0){
    const detail=`${result.stderr||""}\n${result.stdout||""}`.trim();
    console.log(`::error file=${file},title=legacy provenance audit failed::${escape(detail||`Exit code ${result.status}`)}`);
    process.exit(result.status||1);
  }
}

process.stdout.write(`PASS legacy provenance audit (${files.length} files)\n`);
