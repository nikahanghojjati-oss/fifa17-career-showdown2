const { spawnSync } = require("node:child_process");

const files = [
  "tests/contracts/stability-contracts.cjs",
  "tests/contracts/final-polish-transition.cjs",
  "tests/contracts/final-polish-feedback.cjs",
  "tests/contracts/final-polish-presentation.cjs",
  "tests/contracts/licensed-football-visuals-contract.cjs",
  "tests/contracts/season-review-snapshot.cjs",
  "tests/contracts/season-review-architecture.cjs",
  "tests/contracts/statistics-fixtures.cjs",
  "tests/contracts/statistics-architecture.cjs",
  "tests/contracts/backup-contracts.cjs",
  "tests/contracts/import-analysis-contracts.cjs",
  "tests/contracts/restore-storage-contracts.cjs",
  "tests/contracts/restore-plan-contracts.cjs",
  "tests/contracts/restore-stale-state-contracts.cjs",
  "tests/contracts/restore-maintenance-contracts.cjs",
  "tests/contracts/cloud-foundation-contracts.cjs",
  "tests/contracts/offline-shell-v3-contracts.cjs",
  "tests/contracts/release-authority-coherence.cjs",
  "tests/contracts/ci-orchestration-contracts.cjs",
  "tests/contracts/final-release-hardening.cjs"
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
    console.log(`::error file=${file},title=Repository contract failed::${escape(detail||`Exit code ${result.status}`)}`);
    process.exit(result.status||1);
  }
}
process.stdout.write(`PASS  repository contract suite (${files.length} files after explicit static release contract)\n`);