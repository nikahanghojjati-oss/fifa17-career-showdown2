#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { catalog: SHARED_CATALOG } = require('../js/sharedShowdownCatalog.js');

const EVIDENCE_TYPE = 'SSJR-1.1-production-shared-setup';
const EXPECTED_RUNTIME_REVISION = '1.9.1-r3';
const FINAL_PHASE = 'SHOWDOWN_CONFIRMED';
const FINAL_REVISION = 6;
const ALLOWED_SEASONS = new Set([1, 3, 5, 10]);
const REQUIRED_NEGATIVES = [
  'wrongSession', 'expiredSession', 'unrelatedAccount', 'revokedIdentity',
  'staleRevision', 'replayConflict', 'directFieldSubstitution', 'coordinatorBypass'
];
const REQUIRED_CHECKPOINTS = [
  'paired-active-before-setup',
  'authoritative-setup-observed',
  'identical-final-setup',
  'reload-resume',
  'fresh-active-session-resume'
];
const ROOT_FIELDS = new Set([
  'schemaVersion', 'evidenceType', 'capturedAt', 'runtimeRevision', 'managerRole', 'remoteRole',
  'accountFingerprint', 'deviceFingerprint', 'rivalryFingerprint', 'canonicalStorageBeforeHash',
  'canonicalStorageAfterHash', 'checkpoints', 'negatives', 'finalSetup'
]);
const FINAL_SETUP_FIELDS = new Set(['leagueId', 'clubs', 'clubLeagueIds', 'totalSeasons', 'confirmedRoles', 'phase', 'revision', 'digest']);
const CLUB_FIELDS = new Set(['playerOne', 'playerTwo']);
const NEGATIVE_FIELDS = new Set(REQUIRED_NEGATIVES);
const CHECKPOINT_FIELDS = Object.freeze({
  'paired-active-before-setup': new Set(['name', 'at', 'paired', 'sessionState', 'setupMutationSeen', 'sessionFingerprint']),
  'authoritative-setup-observed': new Set(['name', 'at', 'revision', 'setupDigest']),
  'identical-final-setup': new Set(['name', 'at', 'setupDigest']),
  'reload-resume': new Set(['name', 'at', 'setupDigest', 'resetOrRedraw']),
  'fresh-active-session-resume': new Set(['name', 'at', 'setupDigest', 'resetOrRedraw', 'sessionFingerprint'])
});
const FORBIDDEN_AUTHORITY_KEYS = new Set(['accountid', 'deviceid', 'rivalryid', 'sessionid', 'capability', 'capabilitytoken', 'pairingcode']);
const RAW_AUTHORITY_VALUE = /\b(?:pair|session)_[a-f0-9]{64}\b|\bdevice_[a-f0-9]{32}\b|\b(?:profile|save)_[a-f0-9]{24}\b/i;

function fail(message) { throw new Error(message); }
function readJson(path) {
  if (!path) fail('Two evidence JSON paths are required.');
  const raw = fs.readFileSync(path, 'utf8');
  return { path, raw, value: JSON.parse(raw) };
}
function plain(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function normalizedKey(value) { return String(value || '').replace(/[^a-z0-9]/gi, '').toLowerCase(); }
function rejectUnknownFields(value, allowed, label) {
  if (!plain(value)) fail(`${label} must be an object.`);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`${label}: unknown evidence field is not allowed.`);
}
function inspectPrivacy(value, label = '$') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspectPrivacy(entry, `${label}[${index}]`));
    return;
  }
  if (plain(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (FORBIDDEN_AUTHORITY_KEYS.has(normalizedKey(key))) fail(`Forbidden raw authority field at ${label}.`);
      inspectPrivacy(entry, `${label}.field`);
    }
    return;
  }
  if (typeof value === 'string' && RAW_AUTHORITY_VALUE.test(value)) fail(`Raw private authority value appears at ${label}.`);
}
function isHash(value) { return /^sha256:[a-f0-9]{64}$/.test(String(value || '')); }
function validIso(value) { return Number.isFinite(Date.parse(String(value || ''))); }
function requireHash(value, label) { if (!isHash(value)) fail(`${label} must be a sha256:<64 hex> privacy-safe fingerprint.`); }
function requireString(value, label) { if (typeof value !== 'string' || !value.trim()) fail(`${label} is required.`); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
function digest(value) { return `sha256:${crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')}`; }
function checkpoint(bundle, name) { return bundle.checkpoints.find(item => item && item.name === name); }
function assertCheckpointOrder(bundle) {
  const names = bundle.checkpoints.map(item => item?.name);
  if (new Set(names).size !== names.length) fail(`${bundle.managerRole}: checkpoint names must be unique.`);
  if (names.length !== REQUIRED_CHECKPOINTS.length) fail(`${bundle.managerRole}: checkpoints must contain exactly the required journey checkpoints.`);
  for (let index = 0; index < REQUIRED_CHECKPOINTS.length; index += 1) {
    if (names[index] !== REQUIRED_CHECKPOINTS[index]) fail(`${bundle.managerRole}: checkpoints are not in required journey order.`);
  }
  let last = 0;
  for (const item of bundle.checkpoints) {
    rejectUnknownFields(item, CHECKPOINT_FIELDS[item.name] || new Set(), `${bundle.managerRole}.checkpoint`);
    if (!validIso(item?.at)) fail(`${bundle.managerRole}: checkpoint ${item?.name || '(unnamed)'} has invalid timestamp.`);
    const at = Date.parse(item.at);
    if (at < last) fail(`${bundle.managerRole}: checkpoint timestamps are not monotonic.`);
    last = at;
  }
}
function validateFinalSetup(setup, label) {
  rejectUnknownFields(setup, FINAL_SETUP_FIELDS, `${label}.finalSetup`);
  requireString(setup.leagueId, `${label}.finalSetup.leagueId`);
  if (!Object.hasOwn(SHARED_CATALOG, setup.leagueId)) fail(`${label}: finalSetup.leagueId is outside the authoritative catalog.`);
  rejectUnknownFields(setup.clubs, CLUB_FIELDS, `${label}.finalSetup.clubs`);
  requireString(setup.clubs.playerOne, `${label}.finalSetup.clubs.playerOne`);
  requireString(setup.clubs.playerTwo, `${label}.finalSetup.clubs.playerTwo`);
  if (setup.clubs.playerOne === setup.clubs.playerTwo) fail(`${label}: permanent clubs must be distinct.`);
  if (!SHARED_CATALOG[setup.leagueId].includes(setup.clubs.playerOne) || !SHARED_CATALOG[setup.leagueId].includes(setup.clubs.playerTwo)) fail(`${label}: both permanent clubs must belong to the shared league in the authoritative repository catalog.`);
  rejectUnknownFields(setup.clubLeagueIds, CLUB_FIELDS, `${label}.finalSetup.clubLeagueIds`);
  if (setup.clubLeagueIds.playerOne !== setup.leagueId || setup.clubLeagueIds.playerTwo !== setup.leagueId) fail(`${label}: clubLeagueIds must match the authoritative shared league.`);
  if (!ALLOWED_SEASONS.has(setup.totalSeasons)) fail(`${label}: totalSeasons must be 1, 3, 5, or 10.`);
  if (!Array.isArray(setup.confirmedRoles) || setup.confirmedRoles.length !== 2 || !setup.confirmedRoles.includes('playerOne') || !setup.confirmedRoles.includes('playerTwo') || new Set(setup.confirmedRoles).size !== 2) fail(`${label}: both distinct manager roles must confirm the setup.`);
  if (setup.phase !== FINAL_PHASE) fail(`${label}: finalSetup.phase must be ${FINAL_PHASE}.`);
  if (setup.revision !== FINAL_REVISION) fail(`${label}: finalSetup.revision must be exact production revision ${FINAL_REVISION}.`);
  requireHash(setup.digest, `${label}.finalSetup.digest`);
  const canonical = {
    leagueId: setup.leagueId,
    clubs: setup.clubs,
    clubLeagueIds: setup.clubLeagueIds,
    totalSeasons: setup.totalSeasons,
    confirmedRoles: [...setup.confirmedRoles].sort(),
    phase: setup.phase,
    revision: setup.revision
  };
  if (setup.digest !== digest(canonical)) fail(`${label}: finalSetup.digest does not match canonical setup content.`);
}
function validateBundle(bundle, label) {
  if (!plain(bundle)) fail(`${label}: evidence root must be an object.`);
  inspectPrivacy(bundle);
  rejectUnknownFields(bundle, ROOT_FIELDS, label);
  if (bundle.schemaVersion !== 1) fail(`${label}: schemaVersion must be 1.`);
  if (bundle.evidenceType !== EVIDENCE_TYPE) fail(`${label}: evidenceType must be ${EVIDENCE_TYPE}.`);
  if (!validIso(bundle.capturedAt)) fail(`${label}: capturedAt must be an ISO timestamp.`);
  if (bundle.runtimeRevision !== EXPECTED_RUNTIME_REVISION) fail(`${label}: runtimeRevision must be exact deployed production runtime ${EXPECTED_RUNTIME_REVISION}.`);
  if (!['playerOne', 'playerTwo'].includes(bundle.managerRole)) fail(`${label}: managerRole must be playerOne or playerTwo.`);
  if (!['host', 'peer'].includes(bundle.remoteRole)) fail(`${label}: remoteRole must be host or peer.`);
  for (const key of ['accountFingerprint', 'deviceFingerprint', 'rivalryFingerprint']) requireHash(bundle[key], `${label}.${key}`);
  requireHash(bundle.canonicalStorageBeforeHash, `${label}.canonicalStorageBeforeHash`);
  requireHash(bundle.canonicalStorageAfterHash, `${label}.canonicalStorageAfterHash`);
  if (bundle.canonicalStorageBeforeHash !== bundle.canonicalStorageAfterHash) fail(`${label}: Shared Setup mutated canonical local gameplay storage.`);
  if (!Array.isArray(bundle.checkpoints)) fail(`${label}: checkpoints are required.`);
  assertCheckpointOrder(bundle);
  const first = checkpoint(bundle, 'paired-active-before-setup');
  if (first.paired !== true || first.sessionState !== 'active' || first.setupMutationSeen === true) fail(`${label}: pairing + exact ACTIVE must precede every Shared Setup mutation.`);
  requireHash(first.sessionFingerprint, `${label}.paired-active-before-setup.sessionFingerprint`);
  const observed = checkpoint(bundle, 'authoritative-setup-observed');
  if (!Number.isInteger(observed.revision) || observed.revision < 1 || observed.revision >= FINAL_REVISION) fail(`${label}: authoritative setup seed revision is invalid.`);
  requireHash(observed.setupDigest, `${label}.authoritative-setup-observed.setupDigest`);
  const identical = checkpoint(bundle, 'identical-final-setup');
  requireHash(identical.setupDigest, `${label}.identical-final-setup.setupDigest`);
  const reload = checkpoint(bundle, 'reload-resume');
  const fresh = checkpoint(bundle, 'fresh-active-session-resume');
  if (reload.resetOrRedraw !== false || fresh.resetOrRedraw !== false) fail(`${label}: reload/reconnect or fresh-session resume reset/redrew Shared Setup or failed to prove no redraw.`);
  requireHash(reload.setupDigest, `${label}.reload-resume.setupDigest`);
  requireHash(fresh.setupDigest, `${label}.fresh-active-session-resume.setupDigest`);
  requireHash(fresh.sessionFingerprint, `${label}.fresh-active-session-resume.sessionFingerprint`);
  if (fresh.sessionFingerprint === first.sessionFingerprint) fail(`${label}: fresh ACTIVE session resume must use a fresh session fingerprint.`);
  rejectUnknownFields(bundle.negatives, NEGATIVE_FIELDS, `${label}.negatives`);
  for (const key of REQUIRED_NEGATIVES) if (bundle.negatives[key] !== 'denied') fail(`${label}: negative ${key} must be denied.`);
  validateFinalSetup(bundle.finalSetup, label);
  if (identical.setupDigest !== bundle.finalSetup.digest || reload.setupDigest !== bundle.finalSetup.digest || fresh.setupDigest !== bundle.finalSetup.digest) fail(`${label}: final, reload and fresh-session setup digests must remain identical.`);
  return bundle;
}
function validatePair(a, b) {
  validateBundle(a, 'source'); validateBundle(b, 'peer');
  if (a.runtimeRevision !== b.runtimeRevision) fail('Two-account evidence must use one exact runtime revision.');
  if (a.accountFingerprint === b.accountFingerprint) fail('Two legitimate private manager accounts must be distinct.');
  if (a.deviceFingerprint === b.deviceFingerprint) fail('Two independent registered browser identities must be distinct.');
  if (a.rivalryFingerprint !== b.rivalryFingerprint) fail('Both managers must prove the exact same Connected Rivalry.');
  if (a.managerRole === b.managerRole) fail('Manager roles must be distinct.');
  if (a.remoteRole === b.remoteRole) fail('ACTIVE session roles must be host + peer.');
  if (a.finalSetup.digest !== b.finalSetup.digest) fail('Both managers must converge on the identical final Shared Setup.');
  const aSeed = checkpoint(a, 'authoritative-setup-observed');
  const bSeed = checkpoint(b, 'authoritative-setup-observed');
  if (aSeed.setupDigest !== bSeed.setupDigest || aSeed.revision !== bSeed.revision) fail('Authoritative setup seed did not propagate identically to both managers.');
  const aFirst = checkpoint(a, 'paired-active-before-setup');
  const bFirst = checkpoint(b, 'paired-active-before-setup');
  if (aFirst.sessionFingerprint !== bFirst.sessionFingerprint) fail('Initial evidence must refer to the same exact ACTIVE private session.');
  const aFresh = checkpoint(a, 'fresh-active-session-resume');
  const bFresh = checkpoint(b, 'fresh-active-session-resume');
  if (aFresh.sessionFingerprint !== bFresh.sessionFingerprint) fail('Fresh resume evidence must refer to the same new ACTIVE private session.');
  return {
    ok: true,
    evidenceType: EVIDENCE_TYPE,
    runtimeRevision: a.runtimeRevision,
    rivalryFingerprint: a.rivalryFingerprint,
    finalSetupDigest: a.finalSetup.digest,
    finalRevision: a.finalSetup.revision,
    finalPhase: a.finalSetup.phase,
    managers: [a.managerRole, b.managerRole].sort(),
    negativesProvenPerManager: REQUIRED_NEGATIVES.length,
    canonicalStoragePreserved: true,
    authoritativeCatalogValidated: true,
    rawAuthorityRejected: true,
    reloadResumeProven: true,
    freshSessionResumeProven: true
  };
}

try {
  const [sourcePath, peerPath] = process.argv.slice(2);
  const source = readJson(sourcePath); const peer = readJson(peerPath);
  const result = validatePair(source.value, peer.value);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`SSJR_SHARED_SETUP_EVIDENCE_INVALID ${error.message}\n`);
  process.exit(1);
}
