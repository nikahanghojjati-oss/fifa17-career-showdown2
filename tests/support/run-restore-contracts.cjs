const { spawnSync } = require("node:child_process");

const files = [
  "tests/contracts/restore-storage-contracts.cjs",
  "tests/contracts/restore-plan-contracts.cjs",
  "tests/contracts/restore-stale-state-contracts.cjs",
  "tests/contracts/restore-maintenance-contracts.cjs"
];
function escapeAnnotation(value){
  return String(value || "").replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").slice(0, 4000);
}
for(const file of files){
  const result = spawnSync(process.execPath, [file], { encoding: "utf8" });
  if(result.stdout) process.stdout.write(result.stdout);
  if(result.stderr) process.stderr.write(result.stderr);
  if(result.status !== 0){
    const detail = `${result.stderr || ""}\n${result.stdout || ""}`.trim();
    console.log(`::error file=${file},title=Restore contract failed::${escapeAnnotation(detail || `Exit code ${result.status}`)}`);
    process.exit(result.status || 1);
  }
}
process.stdout.write("PASS  complete Candidate C restore contract suite\n");
