const { spawnSync } = require("node:child_process");

const files = [
  "tests/contracts/handoff-immediate-next-task-contracts.cjs",
  "tests/contracts/work-environment-continuity-contracts.cjs",
  "tests/contracts/owner-progress-reporting-contracts.cjs",
  "tests/contracts/sle-handoff-packaging-contracts.cjs",
  "tests/contracts/next-developer-prompt-contracts.cjs",
  "tests/contracts/work-environment-interruption-resilience-contracts.cjs",
  "tests/contracts/work-environment-forward-progress-contracts.cjs",
  "tests/contracts/stage5-activation-authority-contracts.cjs",
  "tests/contracts/firebase-permanent-control-plane-contracts.cjs",
  "tests/contracts/release-authority-coherence.cjs"
];

for(const file of files){
  const result = spawnSync(process.execPath, [file], { encoding: "utf8" });
  if(result.stdout) process.stdout.write(result.stdout);
  if(result.stderr) process.stderr.write(result.stderr);
  if(result.status !== 0) process.exit(result.status || 1);
}
process.stdout.write(`PASS handoff preflight (${files.length} authority/continuity contracts)\n`);
