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
  "tests/contracts/identity-safe-career-analytics-contracts.cjs",
  "tests/contracts/handoff-immediate-next-task-contracts.cjs",
  "tests/contracts/work-environment-continuity-contracts.cjs",
  "tests/contracts/github-cli-bootstrap-contracts.cjs",
  "tests/contracts/backup-contracts.cjs",
  "tests/contracts/import-analysis-contracts.cjs",
  "tests/contracts/restore-storage-contracts.cjs",
  "tests/contracts/restore-plan-contracts.cjs",
  "tests/contracts/restore-stale-state-contracts.cjs",
  "tests/contracts/restore-maintenance-contracts.cjs",
  "tests/contracts/save-library-foundation-contracts.cjs",
  "tests/contracts/save-library-persistence-contracts.cjs",
  "tests/contracts/save-library-runtime-contracts.cjs",
  "tests/contracts/save-library-product-contracts.cjs",
  "tests/contracts/manager-identity-linkage-contracts.cjs",
  "tests/contracts/cloud-foundation-contracts.cjs",
  "tests/contracts/cloud-sync-readiness-phase1-contracts.cjs",
  "tests/contracts/remote-data-privacy-retention-contracts.cjs",
  "tests/contracts/cloud-sync-remote-contracts.cjs",
  "tests/contracts/cloud-sync-two-device-harness-contracts.cjs",
  "tests/contracts/cloud-sync-phase1f-contracts.cjs",
  "tests/contracts/private-account-auth-stage2a-boundary-contracts.cjs",
  "tests/contracts/private-account-auth-stage2a-contracts.cjs",
  "tests/contracts/private-account-auth-stage2b-contracts.cjs",
  "tests/contracts/private-account-auth-stage2c-policy-contracts.cjs",
  "tests/contracts/private-account-auth-stage2d-contracts.cjs",
  "tests/contracts/private-account-auth-stage2e-contracts.cjs",
  "tests/contracts/private-account-auth-stage2f-contracts.cjs",
  "tests/contracts/private-account-auth-stage2g-contracts.cjs",
  "tests/contracts/private-account-auth-stage2h-contracts.cjs",
  "tests/contracts/private-account-auth-stage2i-boundary-contracts.cjs",
  "tests/contracts/private-account-auth-stage2i-contracts.cjs",
  "tests/contracts/offline-hotfix-contracts.cjs",
  "tests/contracts/v13-offline-lifecycle-contracts.cjs",
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
