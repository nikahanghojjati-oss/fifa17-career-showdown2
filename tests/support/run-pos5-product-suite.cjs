const { spawnSync } = require("node:child_process");
const files = [
  "tests/contracts/pos5-product-gate-purity-contracts.cjs",
  "tests/support/run-current-product-contracts.cjs",
  "tests/contracts/ssjr-production-shared-setup-evidence-recorder-contracts.cjs",
  "tests/contracts/ssjr-production-storage-observation-contracts.cjs",
  "tests/contracts/stage5g-remote-joining-reconnect-contracts.cjs"
];
const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, [file], { encoding: "utf8", timeout: 180000, maxBuffer: 8 * 1024 * 1024 });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0 || result.error) failures.push(file);
}
if (failures.length) {
  console.error(`POS-5 product suite failed in ${failures.length} independent entrypoint(s):`);
  failures.forEach(file => console.error(`- ${file}`));
  process.exitCode = 1;
} else console.log(`PASS POS v5 product suite (${files.length} entrypoints)`);
