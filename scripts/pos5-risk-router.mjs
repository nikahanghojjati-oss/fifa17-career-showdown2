import path from "node:path";
import { fileURLToPath } from "node:url";

export const model = "RR-1";
const unique = values => [...new Set(values)];

export function classifyChangedPaths(paths = []) {
  if (!Array.isArray(paths) || !paths.length) return { model, domains: ["BROAD_RELEASE"], lane: "CANDIDATE", specialists: ["stability"] };
  const domains = [];
  for (const raw of paths) {
    const file = String(raw).replace(/\\/g, "/");
    if (/^(PROJECT_OPERATING_SYSTEM_V5\.|scripts\/pos5-|scripts\/build-(developer-relay-file|recovery-beacon)|tests\/contracts\/pos5-|tests\/support\/run-operations-audit)/.test(file)) domains.push("OPS_ONLY");
    else if (/^\.github\/workflows\/|CURRENT_PRODUCT_TEST_MANIFEST|tests\/support\/run-current-product-contracts|package\.json$/.test(file)) domains.push("TEST_INFRA");
    else if (/firestore|firebase|auth|provider|security|app-check|pairing|session-rules/i.test(file)) domains.push("SECURITY_PROVIDER");
    else if (/restore|save-library|storage|reconciliation|rollback|snapshot/i.test(file)) domains.push("DATA_RECOVERY");
    else if (/shared-showdown|remote-joining|connected-rivalry|pairing|session/i.test(file)) domains.push("SHARED_SESSION");
    else if (/\.html$|\.css$|js\/|visual|screen|menu|league|season|statistics/i.test(file)) domains.push("UI_RUNTIME");
    else domains.push("BROAD_RELEASE");
  }
  const d = unique(domains);
  const onlyOps = d.length === 1 && d[0] === "OPS_ONLY";
  const broad = d.some(x => ["TEST_INFRA", "SECURITY_PROVIDER", "DATA_RECOVERY", "BROAD_RELEASE"].includes(x));
  const lane = onlyOps ? "TARGETED" : broad ? "CANDIDATE" : "TARGETED";
  const specialists = [];
  if (d.includes("SECURITY_PROVIDER")) specialists.push("private-remote-foundation", "stage5f-authenticated-negatives");
  if (d.includes("DATA_RECOVERY")) specialists.push("candidate-c-atomic-restore");
  if (d.includes("SHARED_SESSION")) specialists.push("stage3-private-pairing", "stability");
  if (d.includes("UI_RUNTIME")) specialists.push("static-app");
  if (d.includes("TEST_INFRA") || d.includes("BROAD_RELEASE")) specialists.push("stability");
  if (onlyOps) specialists.push("operations-audit");
  return { model, domains: d, lane, specialists: unique(specialists) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length) process.stdout.write(`${JSON.stringify(classifyChangedPaths(args), null, 2)}\n`);
}
