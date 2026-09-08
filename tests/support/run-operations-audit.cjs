const { spawnSync } = require("node:child_process");

const files = [
  "tests/contracts/project-operating-system-v3-contracts.cjs",
  "tests/contracts/pos3-session-operations-contracts.cjs"
];

for (const file of files) {
  const result = spawnSync(process.execPath, [file], { encoding: "utf8" });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status || 1);
}

process.stdout.write(`PASS POS v3 operations audit (${files.length} files)\n`);
