/* Report-only QA repro. Run from repo root: node project-documents/gameplay-factory/sweeps/repro/hunt-1018.cjs
 * Expected invariants deliberately fail on the audited source. No network or production writes.
 * Real source is evaluated unchanged; the provider, identity, clock and timers are controlled doubles.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const root = path.resolve(__dirname, '../../../..');
const rivalryId = 'pair_' + '1'.repeat(64), deviceId = 'device_' + 'a'.repeat(32);
const sessionId = 'session_' + 'b'.repeat(64);
const failures = [];
function check(id, actual, expected, detail) {
  try { assert.deepEqual(actual, expected); console.log(id + ' PASS'); }
  catch (_) { failures.push(id); console.log(id + ' FAIL ' + detail); }
}
function load(context, name) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js', name), 'utf8'), context, { filename: name });
}
function environment() {
  let now = 1800000000000, counter = 0;
  const timers = new Map(), events = new Map(), docs = new Map();
  class Clock extends Date { static now() { return now; } }
  class Timestamp { constructor(ms) { this.ms = ms; } toMillis() { return this.ms; } static fromMillis(ms) { return new Timestamp(ms); } }
  let serial = Promise.resolve();
  const sdk = { Timestamp, doc: (_db, ...p) => p.join('/'), runTransaction: (_db, fn) => {
    const run = serial.then(async () => {
      const writes = [];
      const result = await fn({ get: async ref => ({ exists: () => docs.has(ref), data: () => docs.get(ref) }), set: (ref, value) => writes.push([ref, value]) });
      for (const [ref, value] of writes) docs.set(ref, value);
      return result;
    });
    serial = run.catch(() => {}); return run;
  } };
  const envelope = (type, id, data) => ({ schemaVersion: 1, objectType: type, objectId: id, revision: 0, lifecycleState: 'live', contentHash: 'sha256:' + '0'.repeat(64), data, tombstone: null });
  for (const uid of ['daniel', 'nik']) {
    docs.set('accounts/' + uid, envelope('account', uid, { status: 'active' }));
    docs.set('accounts/' + uid + '/devices/' + deviceId, envelope('device', deviceId, { deviceId, state: 'active' }));
  }
  docs.set('rivalries/' + rivalryId, envelope('rivalry', rivalryId, { connectionState: 'active', authorizedAccountIds: ['daniel', 'nik'], managerSlots: ['daniel', 'nik'].map((accountId, i) => ({ accountId, slotId: i ? 'playerTwo' : 'playerOne', entitlementState: 'active' })) }));
  const authState = { connected: true, accountId: 'daniel' };
  const account = { initialize: async () => {}, getState: () => authState };
  const pairing = { initialize: async () => {}, getState: () => ({ registered: true, deviceId }) };
  const rivalry = { initialize: async () => {}, getState: () => ({ attached: true, rivalryId, accountId: 'daniel', deviceId, binding: { managerRole: 'playerOne' } }) };
  const services = { ok: true, auth: { currentUser: { uid: 'daniel' } }, firestore: {}, firestoreSdk: sdk };
  const context = vm.createContext({ console, Date: Clock, TextEncoder, Uint8Array, URL, crypto: webcrypto,
    navigator: { onLine: true }, document: { visibilityState: 'visible', getElementById: () => null, addEventListener: () => {} },
    setTimeout: fn => { const id = ++counter; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id), setInterval: () => 0,
    addEventListener: (name, fn) => { if (!events.has(name)) events.set(name, []); events.get(name).push(fn); },
    dispatchEvent: () => {}, CustomEvent: class {}, reportApplicationError: () => {},
    CareerModeProductionFirebaseRuntime: { ensureAccountServices: async () => services },
    CareerModeSparkConnectedAccount: account, CareerModeSparkPrivatePairing: pairing, CareerModeSparkConnectedRivalry: rivalry,
    currentShowdown: { sharedJourney: { mode: 'shared', rivalryId }, managers: { playerOne: 'Daniel', playerTwo: 'Nik' } }
  });
  load(context, 'sparkPrivateSession.js'); load(context, 'sparkStandardAuthPrivateSession.js'); load(context, 'sparkRemoteJoining.js');
  const protocol = context.CareerModeSparkStandardAuthPrivateSession;
  const options = (uid, id) => ({ firestore: services.firestore, firebaseSdk: sdk, user: { uid }, deviceId, rivalryId, sessionId: id, nowEpochMs: now, cryptoImpl: webcrypto });
  return { context, timers, events, docs, authState, services, protocol, options, now: () => now, advance: ms => { now += ms; }, remote: context.CareerModeSparkRemoteJoining };
}
async function activate(e) {
  const hosted = await e.remote.hostSession(); assert.equal(hosted.ok, true);
  assert.equal((await e.protocol.joinSession(e.options('nik', hosted.sessionId))).ok, true);
  assert.equal((await e.remote.refreshSession()).state, 'active');
  return hosted.sessionId;
}
async function replacementRace() {
  const e = environment(); await activate(e);
  const first = e.remote.hostSession({ replaceCurrent: true });
  const stillEnabled = !e.remote.getState().busy;
  const second = e.remote.hostSession({ replaceCurrent: true });
  const results = await Promise.all([first, second]);
  const opened = [...e.docs].filter(([ref, value]) => ref.includes('/sessions/') && value.data.state === 'open').length;
  check('H1018-1', opened, 1, `replacement busy initially=${!stillEnabled}; successful hosts=${results.filter(r => r.ok).length}; OPEN provider sessions=${opened}`);
}
async function replacementWatcher() {
  const e = environment(); const old = await e.remote.hostSession(); assert.equal(old.ok, true);
  assert.equal(e.timers.size, 1);
  const fresh = await e.remote.hostSession({ replaceCurrent: true }); assert.equal(fresh.ok, true);
  assert.equal((await e.protocol.joinSession(e.options('nik', fresh.sessionId))).ok, true);
  const pending = [...e.timers]; e.timers.clear(); for (const [, fn] of pending) await fn();
  check('H1018-2', e.remote.getState().sessionState, 'active', `provider fresh=active; host=${e.remote.getState().sessionState}; remaining watcher timers=${e.timers.size}`);
}
function prepareReconnect(e) {
  const c = e.context;
  c.CareerModeSharedHistoryConvergence = { verifyProjection: value => value };
  load(c, 'sharedMultiSeasonProgression.js'); load(c, 'sharedJourneyReconnect.js');
  const setup = { rivalryId, revision: 6, phase: 'SHOWDOWN_CONFIRMED', totalSeasons: 10, leagueId: 'premier_league', clubs: { playerOne: 'Arsenal', playerTwo: 'Chelsea' } };
  const progression = c.CareerModeSharedMultiSeasonProgression.createProtocol().derive({ rivalryId, setup });
  const control = { setupRefresh: async () => true, progressionRefresh: async () => true, remote: null };
  const setupView = { ready: true, rivalryId, sessionId, setup };
  c.CareerModeProductionSharedShowdownSetup = { refresh: () => control.setupRefresh(), getState: () => setupView };
  c.CareerModeProductionSharedMultiSeasonProgression = { refresh: () => control.progressionRefresh(), getState: () => ({ authoritative: true, rivalryId, state: progression }) };
  c.CareerModeSparkRemoteJoining = { getState: () => control.remote, subscribe: () => () => {} };
  load(c, 'productionSharedJourneyReconnect.js');
  const remote = { sessionId, rivalryId, accountId: 'daniel', deviceId, sessionState: 'active', pendingAction: null, expiresAtEpochMs: e.now() + 60000 };
  return { control, remote, reconnect: c.CareerModeProductionSharedJourneyReconnect };
}
async function recovered(e, r) {
  await r.reconnect.refresh(); assert.equal(r.reconnect.getState().phase, 'FRESH_SESSION_REQUIRED');
  r.control.remote = r.remote; await r.reconnect.refresh(); assert.equal(r.reconnect.isRecovered(), true);
}
async function logoutRetainsAuthority() {
  const e = environment(), r = prepareReconnect(e); await recovered(e, r);
  e.authState.connected = false; e.services.auth.currentUser = null;
  await r.reconnect.refresh(); await r.reconnect.refresh();
  check('H1018-3', r.reconnect.isRecovered(), false, `account connected=false; phase=${r.reconnect.getState().phase}; activeAuthorization=${r.reconnect.getState().activeAuthorization}`);
}
async function offlineDuringRead() {
  const e = environment(), r = prepareReconnect(e); await recovered(e, r); r.reconnect.install();
  await r.reconnect.refresh();
  let release, entered;
  const waiting = new Promise(resolve => { entered = resolve; });
  r.control.setupRefresh = () => { entered(); return new Promise(resolve => { release = resolve; }); };
  const refresh = r.reconnect.refresh(); await waiting;
  e.context.navigator.onLine = false; for (const fn of e.events.get('offline') || []) fn();
  assert.equal(r.reconnect.getState().phase, 'OFFLINE_HOLD'); release(true); await refresh;
  check('H1018-4', r.reconnect.isRecovered(), false, `navigator.onLine=false; phase=${r.reconnect.getState().phase}; networkOnline=${r.reconnect.getState().networkOnline}`);
}
async function expiryDuringRead() {
  const e = environment(), r = prepareReconnect(e); await recovered(e, r);
  r.control.progressionRefresh = async () => { e.advance(60001); return true; };
  await r.reconnect.refresh();
  check('H1018-5', r.reconnect.isRecovered(), false, `now>=expiry=${e.now() >= r.remote.expiresAtEpochMs}; phase=${r.reconnect.getState().phase}; activeAuthorization=${r.reconnect.getState().activeAuthorization}`);
}
(async () => {
  for (const run of [replacementRace, replacementWatcher, logoutRetainsAuthority, offlineDuringRead, expiryDuringRead]) await run();
  console.log(`Confirmed invariant failures: ${failures.length}/5`);
  process.exitCode = failures.length ? 1 : 0;
})().catch(error => { console.error('REPRO HARNESS ERROR', error); process.exitCode = 2; });
