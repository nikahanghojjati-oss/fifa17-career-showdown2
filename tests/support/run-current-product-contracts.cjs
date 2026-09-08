const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

const manifest = JSON.parse(fs.readFileSync("CURRENT_PRODUCT_TEST_MANIFEST.json", "utf8"));
if (!Number.isInteger(manifest.schemaVersion) || manifest.schemaVersion < 1 || !Array.isArray(manifest.tests) || !manifest.tests.length) {
  throw new Error("Current product test manifest is invalid.");
}

const timeoutMs = Number.parseInt(process.env.CMS_CONTRACT_TIMEOUT_MS || "120000", 10);
if (!Number.isInteger(timeoutMs) || timeoutMs < 1000) throw new Error("CMS_CONTRACT_TIMEOUT_MS must be an integer >= 1000.");

const failures = [];
const seen = new Set();
for (const file of manifest.tests) {
  if (seen.has(file)) { failures.push({ file, detail: "Duplicate current product test." }); continue; }
  seen.add(file);
  if (!fs.existsSync(file)) { failures.push({ file, detail: "Current product test is missing." }); continue; }
  const result = spawnSync(process.execPath, [file], { encoding: "utf8", timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0 || result.error) {
    const detail = [result.error ? `${result.error.name}: ${result.error.message}` : "", result.signal ? `signal=${result.signal}` : "", result.stderr || "", result.stdout || ""].filter(Boolean).join("\n").trim();
    failures.push({ file, detail });
    const escaped = String(detail || `Exit code ${result.status}`).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").slice(0, 7000);
    console.log(`::error file=${file},title=current product contract failed::${escaped}`);
  }
}

if (failures.length) {
  console.error(`FC-2 FAILURE CENSUS: ${failures.length} of ${manifest.tests.length} current product contracts failed.`);
  for (const failure of failures) console.error(`- ${failure.file}`);
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS FC-2 current product contract census (${manifest.tests.length} tests, 0 failures)\n`);
}
