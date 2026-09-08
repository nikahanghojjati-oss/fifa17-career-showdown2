import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const model = "DRF-1";
export const maxBytes = 4096;
const text = value => typeof value === "string" && value.trim() ? value.trim() : "unknown";
const list = value => Array.isArray(value) && value.length ? value.map(v => `- ${text(v)}`).join("\n") : "- none";

export function buildDeveloperRelayFile(input = {}) {
  const output = `# Career Mode Showdown Developer Relay File DRF-1\n\nGenerated: ${text(input.generatedAt || new Date().toISOString())}\n\n## Authority\nThis file is orientation only. Independently verify live main, active PR, exact head/checks/reviews, provider state and deployment before editing. Never combine CI across heads.\n\n## Repository\nRepository: ${text(input.repository)}\nBranch: ${text(input.branch)}\nActive PR: ${input.pr ?? "none"}\nRecorded head: ${text(input.head)}\n\n## Current lane\n${text(input.lane)}\n\n## Last safe checkpoint\n${text(input.lastSafeCheckpoint)}\n\n## Unresolved root hypotheses\n${list(input.rootHypotheses)}\n\n## Exact next action\n${text(input.nextAction)}\n\n## Minimum live revalidation\n${list(input.revalidate || ["main", "active PR/head/checks/reviews", "deployment/provider authority"])}\n\n## Permanent locks\nBilling OFF. Firebase Spark only. Pairing plus exact ACTIVE before league/club authority. Exactly two private managers. Candidate C sole destructive remote-to-local Apply authority. No public discovery/community/rankings.\n\n## Minimum historical references\n${list(input.references)}\n\n## Startup\nRead PROJECT_OPERATING_SYSTEM_V5.md, CURRENT_PRODUCT_GUARDS.json and NEXT_TASK.md after this file. Load older history only if the live blocker requires it.\n`;
  if (Buffer.byteLength(output, "utf8") > maxBytes) throw new Error(`DRF-1 exceeds ${maxBytes} bytes; replace copied history with references.`);
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const arg = process.argv[2];
    if (!arg) throw new Error("Usage: node scripts/build-developer-relay-file.mjs <input.json>");
    const input = JSON.parse(fs.readFileSync(path.resolve(arg), "utf8"));
    process.stdout.write(buildDeveloperRelayFile(input));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
