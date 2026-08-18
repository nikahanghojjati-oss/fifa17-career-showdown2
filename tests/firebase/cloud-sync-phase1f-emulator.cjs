const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} = require("@firebase/rules-unit-testing");
const {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc
} = require("firebase/firestore");

const PROJECT_ID = "demo-career-mode-showdown-phase1f";
const RULES = fs.readFileSync("firestore.rules", "utf8");
const hash = value => `sha256:${crypto.createHash("sha256").update(String(value)).digest("hex")}`;
const keyHash = value => crypto.createHash("sha256").update(String(value)).digest("hex");
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const stableStringify = value => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
};
const requestFingerprint = (actorAccountId, request) => hash(stableStringify({
  actorAccountId,
  operation: request.operation,
  objectType: request.objectType,
  objectId: request.objectId,
  deviceId: request.deviceId,
  installationId: request.installationId ?? null,
  baseRevision: request.baseRevision,
  payload: hasOwn(request, "payload") ? request.payload : null
}));

function envelope(objectType, objectId, data, revision = 0, extra = {}) {
  return Object.assign({
    schemaVersion: 1,
    objectType,
    objectId,
    revision,
    parentRevision: revision === 0 ? null : revision - 1,
    lifecycleState: "live",
    contentHash: hash(`${objectType}:${objectId}:${revision}`),
    priorContentHash: null,
    updatedAt: Timestamp.fromMillis(1_700_000_000_000 + revision),
    updatedByAccountId: "acct_a",
    updatedByDeviceId: "device_a",
    data,
    tombstone: null
  }, extra);
}

function sharedEnvelope(revision, value = "seed") {
  return envelope("sharedState", "rivalry_1", {
    saveId: "save_1",
    managerBindings: [
      { slotId: "manager-1", profileId: "profile_a" },
      { slotId: "manager-2", profileId: "profile_b" }
    ],
    seasonIds: ["season_1"],
    activeSeasonId: "season_1",
    payloadFormatVersion: 1,
    payload: { value }
  }, revision, {
    contentHash: hash(`shared:${revision}:${value}`)
  });
}

function activeRivalry() {
  return envelope("rivalry", "rivalry_1", {
    connectionState: "active",
    connectionStateBeforeDeletion: null,
    managerSlots: [
      { slotId: "manager-1", accountId: "acct_a", profileId: "profile_a", displayLabel: "Manager A", entitlementState: "active", deletionConsent: false },
      { slotId: "manager-2", accountId: "acct_b", profileId: "profile_b", displayLabel: "Manager B", entitlementState: "active", deletionConsent: false }
    ],
    authorizedAccountIds: ["acct_a", "acct_b"],
    createdByAccountId: "acct_a",
    createdAt: Timestamp.fromMillis(1_700_000_000_000)
  });
}

function idempotencyEnvelope(hashId, data) {
  return envelope("idempotency", hashId, data, 0, {
    contentHash: null,
    updatedByAccountId: data.actorAccountId,
    updatedByDeviceId: data.deviceId
  });
}

function mutationFailure(status, extra = {}) {
  return Object.assign({ ok: false, status }, extra);
}

async function trustedMutate(db, actorAccountId, request, hooks = {}) {
  if (!request || typeof request !== "object" || Array.isArray(request)) return mutationFailure("invalid-request");
  if (hasOwn(request, "accountId")) return mutationFailure("untrusted-account-field");
  if (!["put", "delete", "restore"].includes(request.operation)) return mutationFailure("invalid-request");
  if (request.objectType !== "sharedState" || request.objectId !== "rivalry_1") return mutationFailure("invalid-request");
  if (typeof request.deviceId !== "string" || !request.deviceId || typeof request.idempotencyKey !== "string" || !request.idempotencyKey) return mutationFailure("invalid-request");
  if (!Number.isInteger(request.baseRevision) || request.baseRevision < 0) return mutationFailure("invalid-request");
  if ((request.operation === "put" || request.operation === "restore") && (!request.payload || typeof request.payload !== "object" || Array.isArray(request.payload))) return mutationFailure("invalid-request");

  const originalBaseRevision = request.baseRevision;
  const fingerprint = requestFingerprint(actorAccountId, request);
  const hashedIdempotencyKey = keyHash(request.idempotencyKey);
  const accountRef = doc(db, "accounts", actorAccountId);
  const deviceRef = doc(db, "accounts", actorAccountId, "devices", request.deviceId);
  const rivalryRef = doc(db, "rivalries", "rivalry_1");
  const stateRef = doc(db, "rivalries", "rivalry_1", "state", "authoritative");
  const replayRef = doc(db, "rivalries", "rivalry_1", "state", "authoritative", "idempotency", hashedIdempotencyKey);
  let attempts = 0;

  const outcome = await runTransaction(db, async transaction => {
    attempts += 1;
    const accountSnap = await transaction.get(accountRef);
    const deviceSnap = await transaction.get(deviceRef);
    const rivalrySnap = await transaction.get(rivalryRef);
    const stateSnap = await transaction.get(stateRef);
    const replaySnap = await transaction.get(replayRef);

    if (!accountSnap.exists() || accountSnap.data().data.status !== "active") return mutationFailure("account-disabled");
    if (!deviceSnap.exists() || deviceSnap.data().data.state !== "active") return mutationFailure("device-revoked");
    if (!rivalrySnap.exists() || !stateSnap.exists()) return mutationFailure("forbidden");

    const rivalry = rivalrySnap.data().data;
    if (rivalry.connectionState !== "active") return mutationFailure("relationship-revoked");
    if (!Array.isArray(rivalry.managerSlots) || rivalry.managerSlots.length !== 2) return mutationFailure("forbidden");
    if (!Array.isArray(rivalry.authorizedAccountIds) || !rivalry.authorizedAccountIds.includes(actorAccountId)) return mutationFailure("forbidden");
    if (rivalry.managerSlots.some(slot => slot.entitlementState !== "active" || typeof slot.accountId !== "string" || !slot.accountId)) {
      return mutationFailure("relationship-revoked", { code: "RIVALRY_MUTATION_FROZEN" });
    }

    const peerAccountRefs = rivalry.managerSlots.map(slot => doc(db, "accounts", slot.accountId));
    const peerAccountSnaps = [];
    for (const peerRef of peerAccountRefs) peerAccountSnaps.push(await transaction.get(peerRef));
    if (peerAccountSnaps.some(peer => !peer.exists() || peer.data().data.status !== "active")) {
      return mutationFailure("forbidden", { code: "REQUIRED_ACCOUNT_NOT_ACTIVE" });
    }

    if (replaySnap.exists()) {
      const replay = replaySnap.data().data;
      if (replay.requestFingerprint !== fingerprint) {
        return mutationFailure("idempotency-conflict", { acceptedRevision: replay.acceptedRevision, originalBaseRevision });
      }
      return {
        ok: true,
        status: "replayed",
        replayed: true,
        acceptedRevision: replay.acceptedRevision,
        contentHash: replay.resultContentHash ?? null,
        tombstone: Boolean(replay.resultTombstone),
        originalBaseRevision
      };
    }

    if (typeof hooks.afterAuthoritativeRead === "function") {
      await hooks.afterAuthoritativeRead({ attempt: attempts, db, stateRef, authoritative: clone(stateSnap.data()), originalBaseRevision });
    }

    const authority = stateSnap.data();
    if (authority.revision !== originalBaseRevision) {
      return mutationFailure("conflict", {
        code: "STALE_BASE_REVISION",
        baseRevision: originalBaseRevision,
        authoritative: {
          objectType: authority.objectType,
          objectId: authority.objectId,
          revision: authority.revision,
          contentHash: authority.contentHash ?? null,
          tombstone: authority.lifecycleState === "tombstoned"
        }
      });
    }

    if (authority.lifecycleState === "tombstoned" && request.operation === "put") return mutationFailure("tombstone-restore-required");
    if (authority.lifecycleState !== "tombstoned" && request.operation === "restore") return mutationFailure("restore-live-object");
    if (authority.lifecycleState === "tombstoned" && request.operation === "delete") return mutationFailure("already-deleted");

    const nextRevision = authority.revision + 1;
    let nextState;
    if (request.operation === "delete") {
      nextState = Object.assign({}, authority, {
        revision: nextRevision,
        parentRevision: authority.revision,
        lifecycleState: "tombstoned",
        priorContentHash: authority.contentHash ?? authority.priorContentHash ?? null,
        contentHash: null,
        updatedAt: Timestamp.fromMillis(1_700_000_100_000 + nextRevision),
        updatedByAccountId: actorAccountId,
        updatedByDeviceId: request.deviceId,
        data: null,
        tombstone: {
          deletedAt: Timestamp.fromMillis(1_700_000_100_000 + nextRevision),
          deletedByAccountId: actorAccountId,
          reasonCode: "USER_REQUEST",
          restorableByAccountIds: clone(rivalry.authorizedAccountIds)
        }
      });
    } else {
      nextState = Object.assign({}, authority, {
        revision: nextRevision,
        parentRevision: authority.revision,
        lifecycleState: "live",
        contentHash: hash(stableStringify(request.payload)),
        priorContentHash: null,
        updatedAt: Timestamp.fromMillis(1_700_000_100_000 + nextRevision),
        updatedByAccountId: actorAccountId,
        updatedByDeviceId: request.deviceId,
        data: clone(request.payload),
        tombstone: null
      });
    }

    const replayData = {
      requestFingerprint: fingerprint,
      baseRevision: originalBaseRevision,
      acceptedRevision: nextRevision,
      resultStatus: "accepted",
      resultContentHash: nextState.contentHash,
      resultTombstone: nextState.lifecycleState === "tombstoned",
      actorAccountId,
      deviceId: request.deviceId,
      createdAt: Timestamp.fromMillis(1_700_000_100_000 + nextRevision),
      expiresAt: Timestamp.fromMillis(1_700_604_900_000 + nextRevision)
    };

    transaction.set(stateRef, nextState);
    transaction.set(replayRef, idempotencyEnvelope(hashedIdempotencyKey, replayData));
    return {
      ok: true,
      status: "accepted",
      replayed: false,
      acceptedRevision: nextRevision,
      contentHash: nextState.contentHash,
      tombstone: nextState.lifecycleState === "tombstoned",
      originalBaseRevision
    };
  });

  return Object.assign({ attempts, idempotencyKeyHash: hashedIdempotencyKey }, outcome);
}

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES }
  });

  try {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      const future = Timestamp.fromMillis(Date.now() + 60 * 60 * 1000);
      const past = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);
      await Promise.all([
        setDoc(doc(db, "accounts", "acct_a"), envelope("account", "acct_a", { status: "active", createdAt: future, deletionRequestedAt: null })),
        setDoc(doc(db, "accounts", "acct_b"), envelope("account", "acct_b", { status: "active", createdAt: future, deletionRequestedAt: null })),
        setDoc(doc(db, "accounts", "acct_c"), envelope("account", "acct_c", { status: "active", createdAt: future, deletionRequestedAt: null })),
        setDoc(doc(db, "accounts", "acct_a", "profileLinks", "profile_a"), envelope("profileLink", "profile_a", { profileId: "profile_a", displayLabel: "Manager A", linkState: "active", createdAt: future })),
        setDoc(doc(db, "accounts", "acct_a", "devices", "device_a"), envelope("device", "device_a", { deviceId: "device_a", installationId: "installation_a", displayLabel: null, state: "active", registeredAt: future, lastSeenAt: null, revokedAt: null })),
        setDoc(doc(db, "accounts", "acct_b", "devices", "device_b"), envelope("device", "device_b", { deviceId: "device_b", installationId: "installation_b", displayLabel: null, state: "active", registeredAt: future, lastSeenAt: null, revokedAt: null })),
        setDoc(doc(db, "rivalries", "rivalry_1"), activeRivalry()),
        setDoc(doc(db, "rivalries", "rivalry_1", "state", "authoritative"), sharedEnvelope(0)),
        setDoc(doc(db, "rivalries", "rivalry_1", "invites", "capability_open_0123456789abcdef0123456789abcdef"), envelope("invite", "invite_open", { purpose: "rivalry-pairing", slotId: "manager-2", createdByAccountId: "acct_a", createdAt: future, expiresAt: future, state: "open", redeemedByAccountId: null, redeemedAt: null, revokedAt: null })),
        setDoc(doc(db, "rivalries", "rivalry_1", "invites", "capability_expired_0123456789abcdef0123456789abcdef"), envelope("invite", "invite_expired", { purpose: "rivalry-pairing", slotId: "manager-2", createdByAccountId: "acct_a", createdAt: past, expiresAt: past, state: "expired", redeemedByAccountId: null, redeemedAt: null, revokedAt: null })),
        setDoc(doc(db, "rivalries", "rivalry_1", "sessions", "session_1"), envelope("session", "session_1", { rivalryId: "rivalry_1", hostAccountId: "acct_a", memberAccountIds: ["acct_a", "acct_b"], state: "active", createdAt: future, expiresAt: future, lastActivityAt: null, revokedAt: null }))
      ]);
    });

    const dbA = testEnv.authenticatedContext("acct_a").firestore();
    const dbB = testEnv.authenticatedContext("acct_b").firestore();
    const dbC = testEnv.authenticatedContext("acct_c").firestore();
    const dbAnon = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(getDoc(doc(dbA, "accounts", "acct_a")));
    await assertFails(getDoc(doc(dbA, "accounts", "acct_b")));
    await assertFails(getDoc(doc(dbAnon, "accounts", "acct_a")));
    await assertSucceeds(getDoc(doc(dbA, "accounts", "acct_a", "devices", "device_a")));
    await assertFails(getDoc(doc(dbB, "accounts", "acct_a", "devices", "device_a")));

    await assertSucceeds(getDoc(doc(dbA, "rivalries", "rivalry_1")));
    await assertSucceeds(getDoc(doc(dbB, "rivalries", "rivalry_1")));
    await assertFails(getDoc(doc(dbC, "rivalries", "rivalry_1")));
    await assertFails(getDocs(collection(dbA, "rivalries")));
    await assertSucceeds(getDoc(doc(dbA, "rivalries", "rivalry_1", "state", "authoritative")));
    await assertFails(getDoc(doc(dbC, "rivalries", "rivalry_1", "state", "authoritative")));

    const openInviteRef = doc(dbC, "rivalries", "rivalry_1", "invites", "capability_open_0123456789abcdef0123456789abcdef");
    const openInvite = await assertSucceeds(getDoc(openInviteRef));
    assert.equal(openInvite.data().data.inviteId, undefined, "Raw invite capability must exist only in the opaque path, never document data.");
    await assertFails(getDocs(collection(dbC, "rivalries", "rivalry_1", "invites")));
    await assertFails(getDoc(doc(dbC, "rivalries", "rivalry_1", "invites", "capability_expired_0123456789abcdef0123456789abcdef")));
    await assertFails(getDoc(doc(dbAnon, "rivalries", "rivalry_1", "invites", "capability_open_0123456789abcdef0123456789abcdef")));

    await assertSucceeds(getDoc(doc(dbB, "rivalries", "rivalry_1", "sessions", "session_1")));
    await assertFails(getDoc(doc(dbC, "rivalries", "rivalry_1", "sessions", "session_1")));

    await assertFails(setDoc(doc(dbA, "rivalries", "rivalry_1", "state", "authoritative"), sharedEnvelope(1, "forged")));
    await assertFails(updateDoc(doc(dbA, "accounts", "acct_a", "devices", "device_a"), { "data.state": "revoked" }));
    await assertFails(setDoc(doc(dbA, "rivalries", "rivalry_1", "invites", "forged_capability"), envelope("invite", "forged", {})));

    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      const forgedAccount = await trustedMutate(db, "acct_a", { operation: "put", objectType: "sharedState", objectId: "rivalry_1", deviceId: "device_a", baseRevision: 0, idempotencyKey: "forged-account", accountId: "acct_b", payload: sharedEnvelope(1, "bad").data });
      assert.equal(forgedAccount.status, "untrusted-account-field");

      const firstRequest = { operation: "put", objectType: "sharedState", objectId: "rivalry_1", deviceId: "device_a", baseRevision: 0, idempotencyKey: "idem-1", payload: sharedEnvelope(1, "first").data };
      const accepted = await trustedMutate(db, "acct_a", firstRequest);
      assert.equal(accepted.status, "accepted");
      assert.equal(accepted.acceptedRevision, 1);
      assert.equal(accepted.originalBaseRevision, 0);
      const stateRef = doc(db, "rivalries", "rivalry_1", "state", "authoritative");
      assert.equal((await getDoc(stateRef)).data().revision, 1);

      const replay = await trustedMutate(db, "acct_a", firstRequest);
      assert.equal(replay.status, "replayed");
      assert.equal(replay.acceptedRevision, 1);
      assert.equal((await getDoc(stateRef)).data().revision, 1, "Exact accepted replay must not increment revision.");

      const changedReplay = await trustedMutate(db, "acct_a", Object.assign({}, firstRequest, { payload: sharedEnvelope(1, "changed").data }));
      assert.equal(changedReplay.status, "idempotency-conflict");
      assert.equal((await getDoc(stateRef)).data().revision, 1);

      const idempotencyDoc = await getDoc(doc(db, "rivalries", "rivalry_1", "state", "authoritative", "idempotency", accepted.idempotencyKeyHash));
      assert.equal(idempotencyDoc.exists(), true);
      assert.equal(idempotencyDoc.data().data.actorAccountId, "acct_a");
      assert.equal(JSON.stringify(idempotencyDoc.data()).includes("idem-1"), false, "Raw idempotency key must never be stored.");

      const stale = await trustedMutate(db, "acct_b", { operation: "put", objectType: "sharedState", objectId: "rivalry_1", deviceId: "device_b", baseRevision: 0, idempotencyKey: "stale", payload: sharedEnvelope(2, "stale").data });
      assert.equal(stale.status, "conflict");
      assert.equal(stale.baseRevision, 0);
      assert.equal(stale.authoritative.revision, 1);

      let injected = false;
      const retryRequest = { operation: "put", objectType: "sharedState", objectId: "rivalry_1", deviceId: "device_a", baseRevision: 1, idempotencyKey: "retry-original", payload: sharedEnvelope(2, "retry-original").data };
      const retryResult = await trustedMutate(db, "acct_a", retryRequest, {
        afterAuthoritativeRead: async ({ attempt, stateRef: concurrentRef, authoritative }) => {
          if (attempt !== 1 || injected) return;
          injected = true;
          const intervening = Object.assign({}, authoritative, {
            revision: 2,
            parentRevision: authoritative.revision,
            contentHash: hash("intervening"),
            updatedAt: Timestamp.fromMillis(1_700_000_200_002),
            updatedByAccountId: "acct_b",
            updatedByDeviceId: "device_b",
            data: sharedEnvelope(2, "intervening").data
          });
          await setDoc(concurrentRef, intervening);
        }
      });
      assert.ok(retryResult.attempts >= 2, "Firestore must rerun the transaction callback after the concurrently read authority changes.");
      assert.equal(retryResult.status, "conflict");
      assert.equal(retryResult.baseRevision, 1);
      assert.equal(retryResult.authoritative.revision, 2);
      assert.equal(retryRequest.baseRevision, 1, "Provider retry must never rewrite the original client baseRevision.");
      assert.equal((await getDoc(stateRef)).data().revision, 2);

      const deleteRequest = { operation: "delete", objectType: "sharedState", objectId: "rivalry_1", deviceId: "device_b", baseRevision: 2, idempotencyKey: "delete-1", payload: null };
      const deleted = await trustedMutate(db, "acct_b", deleteRequest);
      assert.equal(deleted.status, "accepted");
      assert.equal(deleted.acceptedRevision, 3);
      const tombstone = (await getDoc(stateRef)).data();
      assert.equal(tombstone.lifecycleState, "tombstoned");
      assert.equal(tombstone.data, null);
      assert.equal(tombstone.contentHash, null);
      assert.equal(tombstone.tombstone.deletedByAccountId, "acct_b");

      const staleResurrection = await trustedMutate(db, "acct_a", { operation: "put", objectType: "sharedState", objectId: "rivalry_1", deviceId: "device_a", baseRevision: 2, idempotencyKey: "stale-resurrection", payload: sharedEnvelope(4, "stale-live").data });
      assert.equal(staleResurrection.status, "conflict");
      assert.equal(staleResurrection.authoritative.tombstone, true);
      assert.equal((await getDoc(stateRef)).data().lifecycleState, "tombstoned");

      const implicitRestore = await trustedMutate(db, "acct_a", { operation: "put", objectType: "sharedState", objectId: "rivalry_1", deviceId: "device_a", baseRevision: 3, idempotencyKey: "implicit-restore", payload: sharedEnvelope(4, "implicit").data });
      assert.equal(implicitRestore.status, "tombstone-restore-required");

      const restored = await trustedMutate(db, "acct_a", { operation: "restore", objectType: "sharedState", objectId: "rivalry_1", deviceId: "device_a", baseRevision: 3, idempotencyKey: "restore-1", payload: sharedEnvelope(4, "restored").data });
      assert.equal(restored.status, "accepted");
      assert.equal(restored.acceptedRevision, 4);
      assert.equal((await getDoc(stateRef)).data().lifecycleState, "live");

      const deviceARef = doc(db, "accounts", "acct_a", "devices", "device_a");
      const activeDeviceA = (await getDoc(deviceARef)).data();
      await setDoc(deviceARef, Object.assign({}, activeDeviceA, { data: Object.assign({}, activeDeviceA.data, { state: "revoked", revokedAt: Timestamp.fromMillis(1_700_000_300_000) }) }));
      const revoked = await trustedMutate(db, "acct_a", { operation: "put", objectType: "sharedState", objectId: "rivalry_1", deviceId: "device_a", baseRevision: 4, idempotencyKey: "revoked", payload: sharedEnvelope(5, "revoked").data });
      assert.equal(revoked.status, "device-revoked");
      await setDoc(deviceARef, activeDeviceA);

      const accountBRef = doc(db, "accounts", "acct_b");
      const activeAccountB = (await getDoc(accountBRef)).data();
      await setDoc(accountBRef, Object.assign({}, activeAccountB, { data: Object.assign({}, activeAccountB.data, { status: "disabled" }) }));
      const peerDisabled = await trustedMutate(db, "acct_a", { operation: "put", objectType: "sharedState", objectId: "rivalry_1", deviceId: "device_a", baseRevision: 4, idempotencyKey: "peer-disabled", payload: sharedEnvelope(5, "peer-disabled").data });
      assert.equal(peerDisabled.status, "forbidden");
      assert.equal(peerDisabled.code, "REQUIRED_ACCOUNT_NOT_ACTIVE");
      await setDoc(accountBRef, activeAccountB);

      const rivalryRef = doc(db, "rivalries", "rivalry_1");
      const rivalryDoc = (await getDoc(rivalryRef)).data();
      const retained = clone(rivalryDoc);
      retained.data.managerSlots[1].entitlementState = "retained";
      await setDoc(rivalryRef, retained);
      const peerRetained = await trustedMutate(db, "acct_a", { operation: "put", objectType: "sharedState", objectId: "rivalry_1", deviceId: "device_a", baseRevision: 4, idempotencyKey: "peer-retained", payload: sharedEnvelope(5, "peer-retained").data });
      assert.equal(peerRetained.status, "relationship-revoked");
      assert.equal(peerRetained.code, "RIVALRY_MUTATION_FROZEN");
      await setDoc(rivalryRef, rivalryDoc);

      const currentState = (await getDoc(stateRef)).data();
      assert.equal(currentState.revision, 4, "Rejected authority cases must not mutate provider state.");
    });

    const replayPath = keyHash("idem-1");
    await assertSucceeds(getDoc(doc(dbA, "rivalries", "rivalry_1", "state", "authoritative", "idempotency", replayPath)));
    await assertFails(getDoc(doc(dbB, "rivalries", "rivalry_1", "state", "authoritative", "idempotency", replayPath)));
    await assertFails(getDocs(collection(dbA, "rivalries", "rivalry_1", "state", "authoritative", "idempotency")));

    process.stdout.write("PASS Phase 1F Firebase Emulator deny-by-default rules and trusted transaction semantics\n");
  } finally {
    await testEnv.cleanup();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
