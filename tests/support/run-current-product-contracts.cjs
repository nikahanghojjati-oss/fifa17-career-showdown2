const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

const manifest = JSON.parse(fs.readFileSync("CURRENT_PRODUCT_TEST_MANIFEST.json", "utf8"));
if (!Number.isInteger(manifest.schemaVersion) || manifest.schemaVersion < 1 || !Array.isArray(manifest.tests) || !manifest.tests.length) {
  throw new Error("Current product test manifest is invalid.");
}

const seen = new Set();
for (const file of manifest.tests) {
  if (seen.has(file)) throw new Error(`Duplicate current product test: ${file}`);
  seen.add(file);
  if (!fs.existsSync(file)) throw new Error(`Current product test is missing: ${file}`);
  const result = spawnSync(process.execPath, [file], { encoding: "utf8" });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    const detail = `${result.stderr || ""}\n${result.stdout || ""}`.trim();
    const escaped = String(detail || `Exit code ${result.status}`)
      .replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").slice(0, 7000);
    console.log(`::error file=${file},title=current product contract failed::${escaped}`);
    process.exit(result.status || 1);
  }
}

process.stdout.write(`PASS current product contract suite (${manifest.tests.length} tests)\n`);
