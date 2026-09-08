const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

const runnerPath = "tests/support/run-current-product-contracts.cjs";
const manifest = JSON.parse(fs.readFileSync("CURRENT_PRODUCT_TEST_MANIFEST.json", "utf8"));
if (!Number.isInteger(manifest.schemaVersion) || manifest.schemaVersion < 3) {
  throw new Error("Current product test manifest must use POS6 schemaVersion >= 3.");
}
if (manifest.operatingSystem !== "POS-6") throw new Error("Current product test manifest must name POS-6.");
if (manifest.automaticOwner !== runnerPath) throw new Error(`Current product automatic owner must be ${runnerPath}.`);
if (!Array.isArray(manifest.tests) || !manifest.tests.length) throw new Error("Current product test manifest has no tests.");

const timeoutMs = Number.parseInt(process.env.CMS_CONTRACT_TIMEOUT_MS || "120000", 10);
if (!Number.isInteger(timeoutMs) || timeoutMs < 1000) throw new Error("CMS_CONTRACT_TIMEOUT_MS must be an integer >= 1000.");

const failures = [];
const seen = new Set();
for (const file of manifest.tests) {
  if (typeof file !== "string" || !file.startsWith("tests/contracts/")) {
    failures.push({ file: String(file), kind: "MANIFEST", detail: "Current product entries must be contract-test paths." });
    continue;
  }
  if (/pos[0-9]|operating-system|continuity|handoff|provenance|dormant/i.test(file)) {
    failures.push({ file, kind: "MANIFEST", detail: "Operations/provenance/dormant tests cannot enter the automatic product census." });
    continue;
  }
  if (seen.has(file)) { failures.push({ file, kind: "MANIFEST", detail: "Duplicate current product test." }); continue; }
  seen.add(file);
  if (!fs.existsSync(file)) { failures.push({ file, kind: "MANIFEST", detail: "Current product test is missing." }); continue; }

  const result = spawnSync(process.execPath, [file], { encoding: "utf8", timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0 || result.error) {
    const kind = result.error?.code === "ETIMEDOUT" ? "TIMEOUT" : "CONTRACT";
    const detail = [result.error ? `${result.error.name}: ${result.error.message}` : "", result.signal ? `signal=${result.signal}` : "", result.stderr || "", result.stdout || ""].filter(Boolean).join("\n").trim();
    failures.push({ file, kind, detail });
    const escaped = String(detail || `Exit code ${result.status}`).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").slice(0, 7000);
    console.log(`::error file=${file},title=current product contract failed::${escaped}`);
  }
}

if (failures.length) {
  console.error(`FC-2 FAILURE CENSUS: ${failures.length} of ${manifest.tests.length} current product contracts failed.`);
  for (const failure of failures) console.error(`- [${failure.kind}] ${failure.file}`);
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS POS6 current product contract census (${manifest.tests.length} tests, one automatic owner, 0 failures)\n`);
}
