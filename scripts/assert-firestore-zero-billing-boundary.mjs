import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const STRICT_FRAGMENT_FILES = Object.freeze([
  'firestore.shared-setup-production.fragment.rules',
  'firestore.career-start-production.fragment.rules',
  'firestore.transfer-challenge-production.fragment.rules',
  'firestore.season-results-production.fragment.rules',
  'firestore.season-commit-production.fragment.rules'
]);

export const TERMINAL_FRAGMENT_FILE = 'firestore.terminal-close-production.fragment.rules';

const STRICT_FORBIDDEN = Object.freeze([
  ['Cloud Run', /cloud[\s_-]*run/i],
  ['Cloud Functions', /cloud[\s_-]*functions/i],
  ['billing token', /billing/i],
  ['Blaze', /blaze/i],
  ['payment', /payment/i],
  ['purchased credits', /purchased[\s_-]*credits/i]
]);

const TERMINAL_FORBIDDEN = Object.freeze([
  ['Cloud Run', /cloud[\s_-]*run/i],
  ['Cloud Functions', /cloud[\s_-]*functions/i],
  ['Cloud Billing', /cloud[\s_-]*billing/i],
  ['Blaze', /blaze/i],
  ['payment', /payment/i],
  ['purchased credits', /purchased[\s_-]*credits/i],
  ['billing enablement/linkage', /billing[\s_-]*(?:enable|enabled|api|account|project|plan|link|linked|linkage)/i],
  ['billingRequired true', /billingRequired\s*==\s*true/i]
]);

function boundaryFailure(label, detail) {
  const error = new Error(`${label}: permanent zero-billing boundary violated: ${detail}`);
  error.code = 'ZERO_BILLING_BOUNDARY';
  return error;
}

function assertNoForbiddenPatterns(source, label, patterns) {
  if (typeof source !== 'string') throw new TypeError(`${label}: Rules source must be a string`);
  for (const [name, pattern] of patterns) {
    if (pattern.test(source)) throw boundaryFailure(label, `forbidden ${name} pattern`);
  }
}

export function assertStrictZeroBillingSource(source, label = 'Firestore Rules fragment') {
  assertNoForbiddenPatterns(source, label, STRICT_FORBIDDEN);
  return true;
}

export function assertTerminalCloseZeroBillingSource(source, label = 'Terminal Close Rules fragment') {
  if (typeof source !== 'string') throw new TypeError(`${label}: Rules source must be a string`);
  if (!/intent\.billingRequired\s*==\s*false/.test(source)) {
    throw boundaryFailure(label, 'missing explicit intent.billingRequired == false proof');
  }
  assertNoForbiddenPatterns(source, label, TERMINAL_FORBIDDEN);
  return true;
}

function resolveSourcePath(root, candidate) {
  return path.isAbsolute(candidate) ? candidate : path.join(root, candidate);
}

export function assertRepositoryZeroBillingBoundary({
  root = process.cwd(),
  terminalFile = TERMINAL_FRAGMENT_FILE,
  strictFiles = STRICT_FRAGMENT_FILES
} = {}) {
  for (const relativePath of strictFiles) {
    const sourcePath = resolveSourcePath(root, relativePath);
    assertStrictZeroBillingSource(fs.readFileSync(sourcePath, 'utf8'), relativePath);
  }

  const terminalPath = resolveSourcePath(root, terminalFile);
  assertTerminalCloseZeroBillingSource(fs.readFileSync(terminalPath, 'utf8'), terminalFile);
  return true;
}

function main() {
  const terminalOverride = process.argv[2] || TERMINAL_FRAGMENT_FILE;
  assertRepositoryZeroBillingBoundary({ terminalFile: terminalOverride });
  console.log(`PASS permanent zero-billing Firestore fragment boundary (${terminalOverride})`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error?.stack || String(error));
    process.exitCode = 1;
  }
}
