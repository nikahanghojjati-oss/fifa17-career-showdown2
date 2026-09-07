const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

const manifest = JSON.parse(fs.readFileSync("DORMANT_ARCHITECTURE_TEST_MANIFEST.json", "utf8"));
if (
  manifest.operatingSystem !== "POS-2" ||
  manifest.classification !== "HISTORICAL_DORMANT_ARCHITECTURE" ||
  manifest.automaticCI !== false ||
  !Array.isArray(manifest.tests) ||
  !manifest.tests.length
) {
  throw new Error("POS-2 dormant architecture manifest is invalid.");
}

const seen = new Set();
for (const file of manifest.tests) {
  if (seen.has(file)) throw new Error(`Duplicate dormant architecture test: ${file}`);
  seen.add(file);
  if (!fs.existsSync(file)) throw new Error(`Dormant architecture test is missing: ${file}`);

  const result = spawnSync(process.execPath, [file], { encoding: "utf8" });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    const detail = `${result.stderr || ""}\n${result.stdout || ""}`.trim();
    const escaped = String(detail || `Exit code ${result.status}`)
      .replace(/%/g, "%25")
      .replace(/\r/g, "%0D")
      .replace(/\n/g, "%0A")
      .slice(0, 7000);
    console.log(`::error file=${file},title=dormant architecture audit failed::${escaped}`);
    process.exit(result.status || 1);
  }
}

process.stdout.write(`PASS POS-2 dormant architecture audit (${manifest.tests.length} historical tests)\n`);
