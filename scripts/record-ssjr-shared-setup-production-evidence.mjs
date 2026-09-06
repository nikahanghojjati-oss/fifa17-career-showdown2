#!/usr/bin/env node
import crypto from 'node:crypto';

const EXPECTED_RUNTIME_REVISION = '1.9.1-r3';
const EVIDENCE_TYPE = 'SSJR-1.1-production-shared-setup';
const CANONICAL_STORAGE_KEYS = [
  'careerModeShowdown.saveLibrary',
  'careerModeShowdown.legacyShowdowns',
  'careerModeShowdown.preferences'
];
const REQUIRED_NEGATIVES = [
  'wrongSession', 'expiredSession', 'unrelatedAccount', 'revokedIdentity',
  'staleRevision', 'replayConflict', 'directFieldSubstitution', 'coordinatorBypass'
];
const OBSERVATION_FIELDS = new Set([
  'schemaVersion', 'capturedAt', 'runtimeRevision', 'managerRole', 'remoteRole',
  'privateIdentifiers', 'canonicalStorageBefore', 'canonicalStorageAfter',
  'pairedActiveBeforeSetup', 'authoritativeSetupObserved', 'identicalFinalSetup',
  'reloadResume', 'freshActiveSessionResume', 'negatives', 'finalSetup'
]);
const PRIVATE_FIELDS = new Set(['account', 'device', 'rivalry', 'initialSession', 'freshSession']);
const FIRST_FIELDS = new Set(['at', 'paired', 'sessionState', 'setupMutationSeen']);
const OBSERVED_FIELDS = new Set(['at', 'revision', 'setup']);
const FINAL_CHECKPOINT_FIELDS = new Set(['at']);
const RESUME_FIELDS = new Set(['at', 'resetOrRedraw']);
const FINAL_SETUP_FIELDS = new Set(['leagueId', 'clubs', 'clubLeagueIds', 'totalSeasons', 'confirmedRoles', 'phase', 'revision']);
const ROLE_FIELDS = new Set(['playerOne', 'playerTwo']);

function fail(message) { throw new Error(message); }
function plain(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function rejectUnknown(value, allowed, label) {
  if (!plain(value)) fail(`${label} must be an object.`);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`${label}: unknown field ${key}.`);
}
function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) fail(`${label} is required.`);
  return value;
}
function requireIso(value, label) {
  if (!Number.isFinite(Date.parse(String(value || '')))) fail(`${label} must be an ISO timestamp.`);
  return value;
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
function hashString(value) {
  return `sha256:${crypto.createHash('sha256').update(String(value)).digest('hex')}`;
}
function digest(value) {
  return `sha256:${crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')}`;
}
function exactKeys(value, expected, label) {
  rejectUnknown(value, new Set(expected), label);
  for (const key of expected) if (!Object.hasOwn(value, key)) fail(`${label}.${key} is required.`);
}
function readStdin() {
  return new Promise((resolve, reject) => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { raw += chunk; });
    process.stdin.on('end', () => {
      if (!raw.trim()) return reject(new Error('One private observation JSON object is required on stdin.'));
      try { resolve(JSON.parse(raw)); } catch { reject(new Error('stdin must contain valid JSON.')); }
    });
    process.stdin.on('error', reject);
  });
}
function normalizeStorage(snapshot, label) {
  exactKeys(snapshot, CANONICAL_STORAGE_KEYS, label);
  return Object.fromEntries(CANONICAL_STORAGE_KEYS.map(key => [key, snapshot[key] ?? null]));
}
function normalizeFinalSetup(setup) {
  rejectUnknown(setup, FINAL_SETUP_FIELDS, 'finalSetup');
  rejectUnknown(setup.clubs, ROLE_FIELDS, 'finalSetup.clubs');
  rejectUnknown(setup.clubLeagueIds, ROLE_FIELDS, 'finalSetup.clubLeagueIds');
  const canonical = {
    leagueId: requireString(setup.leagueId, 'finalSetup.leagueId'),
    clubs: {
      playerOne: requireString(setup.clubs.playerOne, 'finalSetup.clubs.playerOne'),
      playerTwo: requireString(setup.clubs.playerTwo, 'finalSetup.clubs.playerTwo')
    },
    clubLeagueIds: {
      playerOne: requireString(setup.clubLeagueIds.playerOne, 'finalSetup.clubLeagueIds.playerOne'),
      playerTwo: requireString(setup.clubLeagueIds.playerTwo, 'finalSetup.clubLeagueIds.playerTwo')
    },
    totalSeasons: setup.totalSeasons,
    confirmedRoles: Array.isArray(setup.confirmedRoles) ? [...setup.confirmedRoles].sort() : setup.confirmedRoles,
    phase: setup.phase,
    revision: setup.revision
  };
  return { ...canonical, digest: digest(canonical) };
}
function compile(observation) {
  rejectUnknown(observation, OBSERVATION_FIELDS, 'observation');
  if (observation.schemaVersion !== 1) fail('observation.schemaVersion must be 1.');
  if (observation.runtimeRevision !== EXPECTED_RUNTIME_REVISION) fail(`observation.runtimeRevision must be ${EXPECTED_RUNTIME_REVISION}.`);
  if (!['playerOne', 'playerTwo'].includes(observation.managerRole)) fail('observation.managerRole must be playerOne or playerTwo.');
  if (!['host', 'peer'].includes(observation.remoteRole)) fail('observation.remoteRole must be host or peer.');
  requireIso(observation.capturedAt, 'observation.capturedAt');

  exactKeys(observation.privateIdentifiers, [...PRIVATE_FIELDS], 'observation.privateIdentifiers');
  const privateValues = Object.fromEntries([...PRIVATE_FIELDS].map(key => [key, requireString(observation.privateIdentifiers[key], `observation.privateIdentifiers.${key}`)]));
  if (privateValues.initialSession === privateValues.freshSession) fail('Fresh-session evidence must use a different raw session identity.');

  const storageBefore = normalizeStorage(observation.canonicalStorageBefore, 'observation.canonicalStorageBefore');
  const storageAfter = normalizeStorage(observation.canonicalStorageAfter, 'observation.canonicalStorageAfter');

  rejectUnknown(observation.pairedActiveBeforeSetup, FIRST_FIELDS, 'observation.pairedActiveBeforeSetup');
  requireIso(observation.pairedActiveBeforeSetup.at, 'observation.pairedActiveBeforeSetup.at');
  rejectUnknown(observation.authoritativeSetupObserved, OBSERVED_FIELDS, 'observation.authoritativeSetupObserved');
  requireIso(observation.authoritativeSetupObserved.at, 'observation.authoritativeSetupObserved.at');
  if (!plain(observation.authoritativeSetupObserved.setup)) fail('observation.authoritativeSetupObserved.setup must be an object.');
  rejectUnknown(observation.identicalFinalSetup, FINAL_CHECKPOINT_FIELDS, 'observation.identicalFinalSetup');
  requireIso(observation.identicalFinalSetup.at, 'observation.identicalFinalSetup.at');
  rejectUnknown(observation.reloadResume, RESUME_FIELDS, 'observation.reloadResume');
  requireIso(observation.reloadResume.at, 'observation.reloadResume.at');
  rejectUnknown(observation.freshActiveSessionResume, RESUME_FIELDS, 'observation.freshActiveSessionResume');
  requireIso(observation.freshActiveSessionResume.at, 'observation.freshActiveSessionResume.at');

  exactKeys(observation.negatives, REQUIRED_NEGATIVES, 'observation.negatives');
  const negatives = Object.fromEntries(REQUIRED_NEGATIVES.map(key => {
    if (observation.negatives[key] !== 'denied') fail(`observation.negatives.${key} must be denied.`);
    return [key, 'denied'];
  }));

  const finalSetup = normalizeFinalSetup(observation.finalSetup);
  return {
    schemaVersion: 1,
    evidenceType: EVIDENCE_TYPE,
    capturedAt: observation.capturedAt,
    runtimeRevision: EXPECTED_RUNTIME_REVISION,
    managerRole: observation.managerRole,
    remoteRole: observation.remoteRole,
    accountFingerprint: hashString(privateValues.account),
    deviceFingerprint: hashString(privateValues.device),
    rivalryFingerprint: hashString(privateValues.rivalry),
    canonicalStorageBeforeHash: digest(storageBefore),
    canonicalStorageAfterHash: digest(storageAfter),
    checkpoints: [
      {
        name: 'paired-active-before-setup',
        at: observation.pairedActiveBeforeSetup.at,
        paired: observation.pairedActiveBeforeSetup.paired,
        sessionState: observation.pairedActiveBeforeSetup.sessionState,
        setupMutationSeen: observation.pairedActiveBeforeSetup.setupMutationSeen,
        sessionFingerprint: hashString(privateValues.initialSession)
      },
      {
        name: 'authoritative-setup-observed',
        at: observation.authoritativeSetupObserved.at,
        revision: observation.authoritativeSetupObserved.revision,
        setupDigest: digest(observation.authoritativeSetupObserved.setup)
      },
      { name: 'identical-final-setup', at: observation.identicalFinalSetup.at, setupDigest: finalSetup.digest },
      { name: 'reload-resume', at: observation.reloadResume.at, setupDigest: finalSetup.digest, resetOrRedraw: observation.reloadResume.resetOrRedraw },
      { name: 'fresh-active-session-resume', at: observation.freshActiveSessionResume.at, setupDigest: finalSetup.digest, resetOrRedraw: observation.freshActiveSessionResume.resetOrRedraw, sessionFingerprint: hashString(privateValues.freshSession) }
    ],
    negatives,
    finalSetup
  };
}

try {
  const observation = await readStdin();
  const evidence = compile(observation);
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`SSJR_SHARED_SETUP_EVIDENCE_RECORD_INVALID ${error.message}\n`);
  process.exit(1);
}
