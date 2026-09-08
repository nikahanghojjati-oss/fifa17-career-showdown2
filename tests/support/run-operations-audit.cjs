const { spawnSync } = require("node:child_process");
const files = [
  "tests/contracts/project-operating-system-v5-contracts.cjs",
  "tests/contracts/pos5-session-operations-contracts.cjs",
  "tests/contracts/pos5-product-gate-purity-contracts.cjs"
];
const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, [file], { encoding: "utf8", timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0 || result.error) failures.push(file);
}
if (failures.length) {
  console.error(`POS-5 operations census failed in ${failures.length} file(s):`);
  failures.forEach(file => console.error(`- ${file}`));
  process.exitCode = 1;
} else console.log(`PASS POS v5 operations audit (${files.length} files)`);
