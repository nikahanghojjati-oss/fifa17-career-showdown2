# Fable job 3: r87 Rules, reads and connectivity bug hunt (Career Mode Showdown 2.0.0)

Code snapshot: gameplay/r87 @ 73713d75b, repo nikahanghojjati-oss/fifa17-career-showdown2. The full source of every file in scope is below this brief. You cannot run code here, so reason carefully and show your trace.

## The product
A private two-player FIFA 17 Career Mode competition web app (vanilla JS, Firebase Auth + Firestore on the free **Spark** plan, GitHub Pages). Two managers, Daniel (playerOne) and Nik (playerTwo), each on his own phone or laptop, play a "Showdown" of 1, 3, 5 or 10 seasons. Each season: shared setup, Career Start, roulette, Transfer War window, results, a season commit both phones acknowledge, then scoring and history. Paired permanently; JOIN on Home; UNPAIR in Settings.

**Firestore reads are the scarcest resource**: 50,000 billed reads a day, and every Rules `get()`/`exists()` lookup is a billed read the Usage chart hides (on reads, writes and every listener update). Target: about 600-800 billed reads per season across both phones; the owner needs at least 14 seasons a day, aiming for 20-30. Settings shows a shared reads meter ("X of 50,000 · both phones", "About N seasons left") that both phones must agree on.

The composed production Rules = `firestore.spark.rules` with the `*-production.fragment.rules` files merged in (all below).

## House rules (a break is a bug)
- No tiebreak anywhere: equal scores = DRAW.
- Never lose or double a result; both phones always converge to the same state.
- Reus Gate: loading stays until the next screen is ready; no half-drawn screen, no old-design flash, never dim the screen.
- The roulette is never skipped and never run twice in a season.

## Threat model
Normal play only: two honest players, reloads, phone locks (iPhone Safari evicts pages), offline/online, slow networks, token expiry, two tabs, timing races between the phones, a service-worker upgrade with one phone a build behind, quota exhausted mid-season then the next day, old Showdowns from earlier builds. **Out of scope:** anything that needs a modified app, the console or direct database writes; report such things only as "hardening, out of scope".

## Already known or being fixed now (do not re-report)
- Roulette spin marks will gain the persisted hit + a version pin, and the history fetch for the roulette is being made cheaper (Fable job 2 F2-02/F2-12, in progress).
- Roulette step UI fixes (F2-01..19) in progress. Career screen fixes from a separate hunt in progress.
- The composed Rules for #1097 (shared meter) and #1101 (spin marks) are not deployed yet; they deploy before the 2.0.0 client.

## Your job
Work as the senior engineer who owns "the backend never breaks and never wastes reads". Read every file below in full.

Reply 1 (this message): a bug hunt across three lenses, for every write and read path in these files:
1. **Rules vs app:** a legitimate app write or read that the Rules refuse in some honest state (stale state after a reload, a race, a retry after a half-applied write, an old Showdown shape, the partner a step ahead), or an app path that assumes a field the Rules don't guarantee. Count each Rules lookup per operation.
2. **Reads:** every read, listener and Rules lookup per season per phone; find waste (re-reads, listeners left running, polling while hidden, full reads where a cached copy exists, retries without backoff, a quota-denied loop), and any place the Settings meter can disagree between the two phones or with reality by more than 5%.
3. **Connectivity:** drop the network, lock the phone, reload, or kill the tab at every write; resume after the daily quota resets. Find any lost, doubled or stuck result, any screen that never recovers by itself, and any spinner without a path out.

For each finding: ID (F3-NN), severity (P0 lost/doubled result or stuck Showdown, P1 refused honest action / wrong meter / big waste a player will hit, P2 rare, P3 polish), file:line (quote the code), exact steps on the two phones, expected vs actual, billed reads involved, and your trace. Put anything unsure in a separate "suspected" list. No style notes. End with the top 5 to fix first and your billed-reads-per-season estimate per phone.

Keep the visible reply under about 60,000 characters.


## FILE: firestore.spark.rules
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function validHash(value) {
      return value is string && value.matches('^sha256:[0-9a-f]{64}$');
    }

    function validIdempotencyKeyHash(value) {
      return value is string && value.matches('^[0-9a-f]{64}$');
    }

    function validEnvelopeShape(root, objectType, objectId) {
      return root.keys().hasOnly([
          "schemaVersion",
          "objectType",
          "objectId",
          "revision",
          "parentRevision",
          "lifecycleState",
          "contentHash",
          "priorContentHash",
          "updatedAt",
          "updatedByAccountId",
          "updatedByDeviceId",
          "data",
          "tombstone"
        ])
        && root.schemaVersion == 1
        && root.objectType == objectType
        && root.objectId == objectId
        && root.revision is int
        && root.revision >= 0
        && root.lifecycleState == "live"
        && validHash(root.contentHash)
        && root.updatedAt is timestamp
        && root.updatedByAccountId is string
        && root.data is map
        && root.tombstone == null;
    }

    function validCreateEnvelope(root, objectType, objectId) {
      return validEnvelopeShape(root, objectType, objectId)
        && root.revision == 0
        && root.parentRevision == null
        && root.priorContentHash == null;
    }

    function validCasEnvelope(before, after, objectType, objectId) {
      return validEnvelopeShape(after, objectType, objectId)
        && before.lifecycleState == "live"
        && after.revision == before.revision + 1
        && after.parentRevision == before.revision
        && after.priorContentHash == before.contentHash;
    }

    function validSelfAccountBootstrap(accountId) {
      let root = request.resource.data;
      let accountData = root.data;
      return signedIn()
        && request.auth.uid == accountId
        && validCreateEnvelope(root, "account", accountId)
        && root.updatedByAccountId == request.auth.uid
        && root.updatedByDeviceId == null
        && accountData.keys().hasOnly(["status", "createdAt", "deletionRequestedAt"])
        && accountData.status == "active"
        && accountData.createdAt is timestamp
        && accountData.deletionRequestedAt == null;
    }

    function activeAccount(accountId) {
      let account = get(/databases/$(database)/documents/accounts/$(accountId));
      return account.data.objectType == "account"
        && account.data.objectId == accountId
        && account.data.lifecycleState == "live"
        && account.data.data.status == "active";
    }

    function activeActor() {
      return signedIn() && activeAccount(request.auth.uid);
    }

    function activeDevice(deviceId) {
      let device = get(/databases/$(database)/documents/accounts/$(request.auth.uid)/devices/$(deviceId));
      return activeActor()
        && deviceId is string
        && deviceId.matches('^device_[0-9a-f]{32}$')
        && device.data.objectType == "device"
        && device.data.objectId == deviceId
        && device.data.lifecycleState == "live"
        && device.data.data.deviceId == deviceId
        && device.data.data.state == "active";
    }

    function activeOwnedDevice(deviceId) {
      let device = get(/databases/$(database)/documents/accounts/$(request.auth.uid)/devices/$(deviceId));
      return signedIn()
        && deviceId is string
        && deviceId.matches('^device_[0-9a-f]{32}$')
        && device.data.objectType == "device"
        && device.data.objectId == deviceId
        && device.data.lifecycleState == "live"
        && device.data.data.deviceId == deviceId
        && device.data.data.state == "active";
    }

    function validDeviceData(deviceId, deviceData) {
      return deviceData.keys().hasOnly([
          "deviceId",
          "installationId",
          "displayLabel",
          "state",
          "registeredAt",
          "lastSeenAt",
          "revokedAt"
        ])
        && deviceData.deviceId == deviceId
        && deviceData.installationId is string
        && deviceData.installationId.matches('^installation_[0-9a-f]{32}$')
        && (deviceData.displayLabel == null || (deviceData.displayLabel is string && deviceData.displayLabel.size() <= 80))
        && (deviceData.state == "active" || deviceData.state == "revoked")
        && deviceData.registeredAt is timestamp
        && deviceData.lastSeenAt is timestamp
        && (deviceData.revokedAt == null || deviceData.revokedAt is timestamp);
    }

    function validDeviceCreate(accountId, deviceId) {
      let root = request.resource.data;
      let deviceData = root.data;
      return activeActor()
        && request.auth.uid == accountId
        && validCreateEnvelope(root, "device", deviceId)
        && root.updatedByAccountId == request.auth.uid
        && root.updatedByDeviceId == deviceId
        && validDeviceData(deviceId, deviceData)
        && deviceData.state == "active"
        && deviceData.registeredAt == deviceData.lastSeenAt
        && deviceData.revokedAt == null;
    }

    function validDeviceRevoke(accountId, deviceId) {
      let before = resource.data;
      let after = request.resource.data;
      return signedIn()
        && request.auth.uid == accountId
        && activeDevice(after.updatedByDeviceId)
        && validCasEnvelope(before, after, "device", deviceId)
        && after.updatedByAccountId == request.auth.uid
        && validDeviceData(deviceId, after.data)
        && before.data.state == "active"
        && after.data.state == "revoked"
        && after.data.deviceId == before.data.deviceId
        && after.data.installationId == before.data.installationId
        && after.data.displayLabel == before.data.displayLabel
        && after.data.registeredAt == before.data.registeredAt
        && after.data.lastSeenAt == before.data.lastSeenAt
        && before.data.revokedAt == null
        && after.data.revokedAt is timestamp;
    }

    function validProfileId(value) {
      return value is string && value.matches('^profile_[0-9a-f]{24}$');
    }

    function validSaveId(value) {
      return value is string && value.matches('^save_[0-9a-f]{24}$');
    }

    function validSlotBase(slot, slotId) {
      return slot is map
        && slot.keys().hasOnly([
          "slotId",
          "accountId",
          "profileId",
          "saveId",
          "displayLabel",
          "entitlementState",
          "deletionConsent"
        ])
        && slot.slotId == slotId
        && (slot.displayLabel == null || (slot.displayLabel is string && slot.displayLabel.size() <= 80))
        && slot.deletionConsent == false;
    }

    function validCreatorSlot(slot, slotId, accountId) {
      return validSlotBase(slot, slotId)
        && slot.accountId == accountId
        && validProfileId(slot.profileId)
        && validSaveId(slot.saveId)
        && slot.entitlementState == "active";
    }

    function validOpenSlot(slot, slotId) {
      return validSlotBase(slot, slotId)
        && slot.accountId == null
        && slot.profileId == null
        && slot.saveId == null
        && slot.displayLabel == null
        && slot.entitlementState == "open";
    }

    function validInitialManagerSlots(slots, creatorId) {
      return slots is list
        && slots.size() == 2
        && (
          (validCreatorSlot(slots[0], "playerOne", creatorId) && validOpenSlot(slots[1], "playerTwo"))
          ||
          (validOpenSlot(slots[0], "playerOne") && validCreatorSlot(slots[1], "playerTwo", creatorId))
        );
    }

    function openSlotId(slots) {
      return slots[0].accountId == null ? "playerOne" : "playerTwo";
    }

    function validRedeemedManagerSlots(beforeSlots, afterSlots, creatorId, joinerId, joinSlotId) {
      return beforeSlots is list
        && afterSlots is list
        && beforeSlots.size() == 2
        && afterSlots.size() == 2
        && (
          (
            validCreatorSlot(beforeSlots[0], "playerOne", creatorId)
            && validOpenSlot(beforeSlots[1], "playerTwo")
            && beforeSlots[0] == afterSlots[0]
            && joinSlotId == "playerTwo"
            && validCreatorSlot(afterSlots[1], "playerTwo", joinerId)
          )
          ||
          (
            validOpenSlot(beforeSlots[0], "playerOne")
            && validCreatorSlot(beforeSlots[1], "playerTwo", creatorId)
            && joinSlotId == "playerOne"
            && validCreatorSlot(afterSlots[0], "playerOne", joinerId)
            && beforeSlots[1] == afterSlots[1]
          )
        );
    }

    function validRivalryData(rivalryData) {
      return rivalryData.keys().hasOnly([
          "connectionState",
          "connectionStateBeforeDeletion",
          "managerSlots",
          "authorizedAccountIds",
          "createdByAccountId",
          "createdAt"
        ])
        && rivalryData.connectionState is string
        && rivalryData.connectionStateBeforeDeletion == null
        && rivalryData.managerSlots is list
        && rivalryData.authorizedAccountIds is list
        && rivalryData.createdByAccountId is string
        && rivalryData.createdAt is timestamp;
    }

    function validInviteData(inviteData) {
      return inviteData.keys().hasOnly([
          "purpose",
          "slotId",
          "createdByAccountId",
          "createdAt",
          "expiresAt",
          "state",
          "redeemedByAccountId",
          "redeemedAt",
          "revokedAt"
        ])
        && inviteData.purpose == "rivalry-pairing"
        && (inviteData.slotId == "playerOne" || inviteData.slotId == "playerTwo")
        && inviteData.createdByAccountId is string
        && inviteData.createdAt is timestamp
        && inviteData.expiresAt is timestamp
        && inviteData.expiresAt > inviteData.createdAt
        && (inviteData.redeemedByAccountId == null || inviteData.redeemedByAccountId is string)
        && (inviteData.redeemedAt == null || inviteData.redeemedAt is timestamp)
        && (inviteData.revokedAt == null || inviteData.revokedAt is timestamp);
    }

    function validInitialRivalryCreate(rivalryId) {
      let root = request.resource.data;
      let data = root.data;
      let inviteAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/invites/$(rivalryId)).data;
      return activeDevice(root.updatedByDeviceId)
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && validCreateEnvelope(root, "rivalry", rivalryId)
        && root.updatedByAccountId == request.auth.uid
        && validRivalryData(data)
        && data.connectionState == "pending-pair"
        && data.createdByAccountId == request.auth.uid
        && data.authorizedAccountIds.size() == 1
        && data.authorizedAccountIds[0] == request.auth.uid
        && validInitialManagerSlots(data.managerSlots, request.auth.uid)
        && inviteAfter.objectType == "invite"
        && inviteAfter.objectId == rivalryId
        && inviteAfter.revision == 0
        && inviteAfter.updatedByAccountId == request.auth.uid
        && inviteAfter.updatedByDeviceId == root.updatedByDeviceId
        && inviteAfter.data.purpose == "rivalry-pairing"
        && inviteAfter.data.createdByAccountId == request.auth.uid
        && inviteAfter.data.slotId == openSlotId(data.managerSlots)
        && inviteAfter.data.state == "open"
        && inviteAfter.data.createdAt == data.createdAt
        && inviteAfter.data.expiresAt > request.time
        && inviteAfter.data.expiresAt <= request.time + duration.value(30, 'm')
        && inviteAfter.data.redeemedByAccountId == null
        && inviteAfter.data.redeemedAt == null
        && inviteAfter.data.revokedAt == null;
    }

    function validInitialInviteCreate(rivalryId, inviteId) {
      let root = request.resource.data;
      let data = root.data;
      let rivalryAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
      return activeDevice(root.updatedByDeviceId)
        && inviteId == rivalryId
        && inviteId.matches('^pair_[0-9a-f]{64}$')
        && validCreateEnvelope(root, "invite", inviteId)
        && root.updatedByAccountId == request.auth.uid
        && validInviteData(data)
        && data.createdByAccountId == request.auth.uid
        && data.state == "open"
        && data.expiresAt > request.time
        && data.expiresAt <= request.time + duration.value(30, 'm')
        && data.redeemedByAccountId == null
        && data.redeemedAt == null
        && data.revokedAt == null
        && rivalryAfter.objectType == "rivalry"
        && rivalryAfter.objectId == rivalryId
        && rivalryAfter.revision == 0
        && rivalryAfter.updatedByAccountId == request.auth.uid
        && rivalryAfter.updatedByDeviceId == root.updatedByDeviceId
        && rivalryAfter.data.connectionState == "pending-pair"
        && rivalryAfter.data.createdByAccountId == request.auth.uid
        && rivalryAfter.data.createdAt == data.createdAt
        && rivalryAfter.data.authorizedAccountIds.size() == 1
        && rivalryAfter.data.authorizedAccountIds[0] == request.auth.uid
        && data.slotId == openSlotId(rivalryAfter.data.managerSlots);
    }

    function validRivalryRedeem(rivalryId) {
      let before = resource.data;
      let after = request.resource.data;
      let inviteBefore = get(/databases/$(database)/documents/rivalries/$(rivalryId)/invites/$(rivalryId)).data;
      let inviteAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/invites/$(rivalryId)).data;
      return activeDevice(after.updatedByDeviceId)
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && validCasEnvelope(before, after, "rivalry", rivalryId)
        && after.updatedByAccountId == request.auth.uid
        && validRivalryData(after.data)
        && before.data.connectionState == "pending-pair"
        && after.data.connectionState == "active"
        && after.data.connectionStateBeforeDeletion == before.data.connectionStateBeforeDeletion
        && after.data.createdByAccountId == before.data.createdByAccountId
        && after.data.createdAt == before.data.createdAt
        && request.auth.uid != before.data.createdByAccountId
        && before.data.authorizedAccountIds.size() == 1
        && before.data.authorizedAccountIds[0] == before.data.createdByAccountId
        && after.data.authorizedAccountIds.size() == 2
        && after.data.authorizedAccountIds[0] == before.data.createdByAccountId
        && after.data.authorizedAccountIds[1] == request.auth.uid
        && inviteBefore.objectType == "invite"
        && inviteBefore.objectId == rivalryId
        && inviteBefore.data.purpose == "rivalry-pairing"
        && inviteBefore.data.state == "open"
        && inviteBefore.data.createdByAccountId == before.data.createdByAccountId
        && inviteBefore.data.expiresAt > request.time
        && validRedeemedManagerSlots(before.data.managerSlots, after.data.managerSlots, before.data.createdByAccountId, request.auth.uid, inviteBefore.data.slotId)
        && inviteAfter.objectType == "invite"
        && inviteAfter.objectId == rivalryId
        && inviteAfter.revision == inviteBefore.revision + 1
        && inviteAfter.parentRevision == inviteBefore.revision
        && inviteAfter.priorContentHash == inviteBefore.contentHash
        && inviteAfter.updatedByAccountId == request.auth.uid
        && inviteAfter.updatedByDeviceId == after.updatedByDeviceId
        && inviteAfter.data.state == "redeemed"
        && inviteAfter.data.redeemedByAccountId == request.auth.uid
        && inviteAfter.data.createdByAccountId == before.data.createdByAccountId
        && inviteAfter.data.slotId == inviteBefore.data.slotId;
    }

    function validInviteRedeem(rivalryId, inviteId) {
      let before = resource.data;
      let after = request.resource.data;
      let rivalryAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
      return activeDevice(after.updatedByDeviceId)
        && inviteId == rivalryId
        && validCasEnvelope(before, after, "invite", inviteId)
        && validInviteData(after.data)
        && before.data.purpose == "rivalry-pairing"
        && before.data.state == "open"
        && before.data.expiresAt > request.time
        && request.auth.uid != before.data.createdByAccountId
        && after.updatedByAccountId == request.auth.uid
        && after.data.purpose == before.data.purpose
        && after.data.slotId == before.data.slotId
        && after.data.createdByAccountId == before.data.createdByAccountId
        && after.data.createdAt == before.data.createdAt
        && after.data.expiresAt == before.data.expiresAt
        && after.data.state == "redeemed"
        && after.data.redeemedByAccountId == request.auth.uid
        && after.data.redeemedAt is timestamp
        && after.data.revokedAt == null
        && rivalryAfter.objectType == "rivalry"
        && rivalryAfter.objectId == rivalryId
        && rivalryAfter.revision is int
        && rivalryAfter.parentRevision is int
        && rivalryAfter.updatedByAccountId == request.auth.uid
        && rivalryAfter.updatedByDeviceId == after.updatedByDeviceId
        && rivalryAfter.data.connectionState == "active"
        && rivalryAfter.data.authorizedAccountIds.size() == 2
        && rivalryAfter.data.authorizedAccountIds[0] == before.data.createdByAccountId
        && rivalryAfter.data.authorizedAccountIds[1] == request.auth.uid;
    }

    function validInviteRevoke(inviteId) {
      let before = resource.data;
      let after = request.resource.data;
      return activeDevice(after.updatedByDeviceId)
        && validCasEnvelope(before, after, "invite", inviteId)
        && validInviteData(after.data)
        && before.data.purpose == "rivalry-pairing"
        && before.data.createdByAccountId == request.auth.uid
        && before.data.state == "open"
        && after.updatedByAccountId == request.auth.uid
        && after.data.purpose == before.data.purpose
        && after.data.slotId == before.data.slotId
        && after.data.createdByAccountId == before.data.createdByAccountId
        && after.data.createdAt == before.data.createdAt
        && after.data.expiresAt == before.data.expiresAt
        && after.data.state == "revoked"
        && after.data.redeemedByAccountId == null
        && after.data.redeemedAt == null
        && after.data.revokedAt is timestamp;
    }

    // r84 trim: reads check membership only (one lookup: the rivalry). The signed-in account document is not looked up on
    // every read: no client can change its status (account update is denied) and the Spark app ships no account deletion
    // flow, so it stays active in normal play. Account and device liveness are still checked when a Session starts.
    function currentlyEntitled(rivalryId) {
      let rivalry = get(/databases/$(database)/documents/rivalries/$(rivalryId));
      return signedIn()
        && rivalry.data.data.authorizedAccountIds is list
        && request.auth.uid in rivalry.data.data.authorizedAccountIds;
    }

    // r84 trim: activePairedRivalry without the two account lookups, for reads (one lookup: the rivalry).
    function livePairedRivalryMember(rivalryId) {
      let rivalry = get(/databases/$(database)/documents/rivalries/$(rivalryId));
      let data = rivalry.data.data;
      let ids = data.authorizedAccountIds;
      return signedIn()
        && rivalry.data.objectType == "rivalry"
        && rivalry.data.objectId == rivalryId
        && rivalry.data.lifecycleState == "live"
        && data.connectionState == "active"
        && ids is list
        && ids.size() == 2
        && ids[0] is string
        && ids[1] is string
        && ids[0] != ids[1]
        && request.auth.uid in ids;
    }

    function activePairedRivalry(rivalryId) {
      let rivalry = get(/databases/$(database)/documents/rivalries/$(rivalryId));
      let data = rivalry.data.data;
      let ids = data.authorizedAccountIds;
      return signedIn()
        && rivalry.data.objectType == "rivalry"
        && rivalry.data.objectId == rivalryId
        && rivalry.data.lifecycleState == "live"
        && data.connectionState == "active"
        && ids is list
        && ids.size() == 2
        && ids[0] is string
        && ids[1] is string
        && ids[0] != ids[1]
        && request.auth.uid in ids
        && activeAccount(ids[0])
        && activeAccount(ids[1]);
    }

    function validManagerBinding(binding, slot) {
      return binding is map
        && binding.keys().hasOnly(["slotId", "profileId"])
        && binding.slotId == slot.slotId
        && binding.profileId == slot.profileId;
    }

    function validMutationReceipt(receipt, baseRevision) {
      return receipt is map
        && receipt.keys().hasOnly(["idempotencyKeyHash", "requestFingerprint", "baseRevision"])
        && validIdempotencyKeyHash(receipt.idempotencyKeyHash)
        && validHash(receipt.requestFingerprint)
        && receipt.baseRevision is int
        && receipt.baseRevision >= 0
        && receipt.baseRevision == baseRevision;
    }

    function validSharedStateData(rivalryId, stateData, baseRevision) {
      let rivalry = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
      let r = rivalry.data;
      let slots = r.managerSlots;
      return stateData.keys().hasOnly([
          "saveId",
          "managerBindings",
          "seasonIds",
          "activeSeasonId",
          "payloadFormatVersion",
          "payload",
          "mutationReceipt"
        ])
        && validSaveId(stateData.saveId)
        && (
          (slots[0].accountId == r.createdByAccountId && stateData.saveId == slots[0].saveId)
          ||
          (slots[1].accountId == r.createdByAccountId && stateData.saveId == slots[1].saveId)
        )
        && stateData.managerBindings is list
        && stateData.managerBindings.size() == 2
        && validManagerBinding(stateData.managerBindings[0], slots[0])
        && validManagerBinding(stateData.managerBindings[1], slots[1])
        && stateData.seasonIds is list
        && stateData.seasonIds.size() <= 10
        && (stateData.activeSeasonId == null || stateData.activeSeasonId in stateData.seasonIds)
        && stateData.payloadFormatVersion == 1
        && stateData.payload is map
        && stateData.payload.rounds is list
        && stateData.payload.rounds.size() == stateData.seasonIds.size()
        && stateData.payload.rounds.size() <= 10
        && validMutationReceipt(stateData.mutationReceipt, baseRevision);
    }

    function stateReceiptMatchesIdempotency(rivalryId, stateRoot) {
      let receiptKey = stateRoot.data.mutationReceipt.idempotencyKeyHash;
      let receipt = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/state/authoritative/idempotency/$(receiptKey)).data;
      return !exists(/databases/$(database)/documents/rivalries/$(rivalryId)/state/authoritative/idempotency/$(receiptKey))
        && receipt.updatedByAccountId == request.auth.uid
        && receipt.updatedByDeviceId == stateRoot.updatedByDeviceId
        && receipt.data.requestFingerprint == stateRoot.data.mutationReceipt.requestFingerprint
        && receipt.data.baseRevision == stateRoot.data.mutationReceipt.baseRevision
        && receipt.data.acceptedRevision == stateRoot.revision
        && receipt.data.resultContentHash == stateRoot.contentHash;
    }

    function validSharedStateMutationTiming(before, after) {
      return before.revision < 2
        || (
          after.updatedAt == request.time
          && (
            before.revision == 2
            || request.time >= before.updatedAt + duration.value(2, 's')
          )
        );
    }

    function validSharedStateCreate(rivalryId) {
      let after = request.resource.data;
      return rivalryId.matches('^pair_[0-9a-f]{64}$')
        && activePairedRivalry(rivalryId)
        && activeOwnedDevice(after.updatedByDeviceId)
        && validCreateEnvelope(after, "sharedState", rivalryId)
        && after.updatedByAccountId == request.auth.uid
        && validSharedStateData(rivalryId, after.data, 0)
        && stateReceiptMatchesIdempotency(rivalryId, after);
    }

    function validSharedStateUpdate(rivalryId) {
      let before = resource.data;
      let after = request.resource.data;
      return rivalryId.matches('^pair_[0-9a-f]{64}$')
        && activePairedRivalry(rivalryId)
        && activeOwnedDevice(after.updatedByDeviceId)
        && before.lifecycleState == "live"
        && validCasEnvelope(before, after, "sharedState", rivalryId)
        && validSharedStateMutationTiming(before, after)
        && after.updatedByAccountId == request.auth.uid
        && after.data.saveId == before.data.saveId
        && after.data.managerBindings == before.data.managerBindings
        && validSharedStateData(rivalryId, after.data, before.revision)
        && stateReceiptMatchesIdempotency(rivalryId, after);
    }

    function validIdempotencyData(data, idempotencyKeyHash) {
      return data.keys().hasOnly([
          "requestFingerprint",
          "baseRevision",
          "acceptedRevision",
          "resultStatus",
          "resultContentHash",
          "resultTombstone",
          "actorAccountId",
          "deviceId",
          "createdAt",
          "expiresAt"
        ])
        && validHash(data.requestFingerprint)
        && data.baseRevision is int
        && data.baseRevision >= 0
        && data.acceptedRevision is int
        && data.acceptedRevision >= 0
        && data.resultStatus == "accepted"
        && validHash(data.resultContentHash)
        && data.resultTombstone == false
        && data.actorAccountId == request.auth.uid
        && data.deviceId is string
        && data.deviceId.matches('^device_[0-9a-f]{32}$')
        && data.createdAt is timestamp
        && data.expiresAt is timestamp
        && data.expiresAt > data.createdAt
        && data.expiresAt <= data.createdAt + duration.value(8, 'd')
        && validIdempotencyKeyHash(idempotencyKeyHash);
    }

    function idempotencyMatchesStateAfter(rivalryId, idempotencyKeyHash, receiptRoot) {
      let state = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/state/authoritative).data;
      return state.objectType == "sharedState"
        && state.objectId == rivalryId
        && state.lifecycleState == "live"
        && state.updatedByAccountId == request.auth.uid
        && state.updatedByDeviceId == receiptRoot.updatedByDeviceId
        && state.data.mutationReceipt.idempotencyKeyHash == idempotencyKeyHash
        && state.data.mutationReceipt.requestFingerprint == receiptRoot.data.requestFingerprint
        && state.data.mutationReceipt.baseRevision == receiptRoot.data.baseRevision
        && state.revision == receiptRoot.data.acceptedRevision
        && state.contentHash == receiptRoot.data.resultContentHash;
    }

    function validIdempotencyCreate(rivalryId, idempotencyKeyHash) {
      let root = request.resource.data;
      return activeDevice(root.updatedByDeviceId)
        && validCreateEnvelope(root, "idempotency", idempotencyKeyHash)
        && root.updatedByAccountId == request.auth.uid
        && validIdempotencyData(root.data, idempotencyKeyHash)
        && root.updatedByDeviceId == root.data.deviceId
        && root.updatedAt == root.data.createdAt
        && idempotencyMatchesStateAfter(rivalryId, idempotencyKeyHash, root);
    }

    // STAGE5C_CANDIDATE_SESSION_FUNCTIONS_BEGIN
    // r38 physical transfer recovery proof trigger: semantics unchanged; production provider/emulator gate must rerun.
    function registeredSessionDeviceMetadata(deviceId) {
      return deviceId is string
        && deviceId.matches('^device_[0-9a-f]{32}$')
        && activeDevice(deviceId);
    }

    function sessionWriteUsesRegisteredDeviceMetadata(root) {
      return signedIn()
        && root.updatedByAccountId == request.auth.uid
        && registeredSessionDeviceMetadata(root.updatedByDeviceId);
    }

    function validSessionId(sessionId) {
      return sessionId is string
        && sessionId.matches('^session_[0-9a-f]{64}$');
    }

    function validSessionBaseData(rivalryId, sessionData) {
      return sessionData.keys().hasOnly([
          "rivalryId",
          "hostAccountId",
          "memberAccountIds",
          "state",
          "createdAt",
          "expiresAt",
          "lastActivityAt",
          "revokedAt"
        ])
        && sessionData.rivalryId == rivalryId
        && sessionData.hostAccountId is string
        && sessionData.memberAccountIds is list
        && sessionData.memberAccountIds.size() >= 1
        && sessionData.memberAccountIds.size() <= 2
        && sessionData.hostAccountId in sessionData.memberAccountIds
        && sessionData.createdAt is timestamp
        && sessionData.expiresAt is timestamp
        && sessionData.expiresAt > sessionData.createdAt
        && (sessionData.lastActivityAt == null || sessionData.lastActivityAt is timestamp)
        && (sessionData.revokedAt == null || sessionData.revokedAt is timestamp);
    }

    function validSessionData(rivalryId, sessionData) {
      return validSessionBaseData(rivalryId, sessionData)
        && (
          (
            sessionData.state == "open"
            && sessionData.memberAccountIds.size() == 1
            && sessionData.memberAccountIds[0] == sessionData.hostAccountId
            && sessionData.lastActivityAt == null
            && sessionData.revokedAt == null
          )
          ||
          (
            sessionData.state == "active"
            && sessionData.memberAccountIds.size() == 2
            && sessionData.memberAccountIds[0] != sessionData.memberAccountIds[1]
            && sessionData.lastActivityAt is timestamp
            && sessionData.revokedAt == null
          )
          ||
          (
            sessionData.state == "revoked"
            && sessionData.lastActivityAt is timestamp
            && sessionData.revokedAt is timestamp
          )
          ||
          (
            (sessionData.state == "expired" || sessionData.state == "closed")
            && sessionData.lastActivityAt is timestamp
            && sessionData.revokedAt == null
          )
        );
    }

    function sessionMembersMatchRivalryPair(rivalryId, members) {
      let rivalry = get(/databases/$(database)/documents/rivalries/$(rivalryId));
      let ids = rivalry.data.data.authorizedAccountIds;
      return members is list
        && members.size() == 2
        && ids is list
        && ids.size() == 2
        && (
          (members[0] == ids[0] && members[1] == ids[1])
          ||
          (members[0] == ids[1] && members[1] == ids[0])
        );
    }

    function freshSessionActivity(value) {
      return value is timestamp
        && value >= request.time - duration.value(5, 'm')
        && value <= request.time + duration.value(1, 'm');
    }

    function validOpenSessionCreate(rivalryId, sessionId) {
      let after = request.resource.data;
      let data = after.data;
      return validSessionId(sessionId)
        && activePairedRivalry(rivalryId)
        && sessionWriteUsesRegisteredDeviceMetadata(after)
        && validCreateEnvelope(after, "session", sessionId)
        && after.updatedByAccountId == request.auth.uid
        && validSessionBaseData(rivalryId, data)
        && data.hostAccountId == request.auth.uid
        && data.memberAccountIds.size() == 1
        && data.memberAccountIds[0] == request.auth.uid
        && data.state == "open"
        && data.createdAt >= request.time - duration.value(5, 'm')
        && data.createdAt <= request.time + duration.value(1, 'm')
        && data.expiresAt > request.time
        && data.expiresAt <= request.time + duration.value(4, 'h')
        && data.lastActivityAt == null
        && data.revokedAt == null
        && after.updatedAt == data.createdAt;
    }

    function validSessionCasUpdate(rivalryId, sessionId) {
      let before = resource.data;
      let after = request.resource.data;
      return validSessionId(sessionId)
        && activePairedRivalry(rivalryId)
        && sessionWriteUsesRegisteredDeviceMetadata(after)
        && validCasEnvelope(before, after, "session", sessionId)
        && after.updatedByAccountId == request.auth.uid
        && validSessionBaseData(rivalryId, after.data)
        && after.data.rivalryId == before.data.rivalryId
        && after.data.hostAccountId == before.data.hostAccountId
        && after.data.createdAt == before.data.createdAt
        && after.data.expiresAt == before.data.expiresAt
        && after.updatedAt == after.data.lastActivityAt
        && freshSessionActivity(after.data.lastActivityAt);
    }

    function validSessionJoin(rivalryId, sessionId) {
      let before = resource.data;
      let after = request.resource.data;
      return validSessionCasUpdate(rivalryId, sessionId)
        && before.data.state == "open"
        && before.data.expiresAt > request.time
        && before.data.memberAccountIds.size() == 1
        && before.data.memberAccountIds[0] == before.data.hostAccountId
        && request.auth.uid != before.data.hostAccountId
        && after.data.state == "active"
        && sessionMembersMatchRivalryPair(rivalryId, after.data.memberAccountIds)
        && after.data.memberAccountIds[0] == before.data.hostAccountId
        && after.data.memberAccountIds[1] == request.auth.uid
        && after.data.revokedAt == null;
    }

    function validSessionRevoke(rivalryId, sessionId) {
      let before = resource.data;
      let after = request.resource.data;
      return validSessionCasUpdate(rivalryId, sessionId)
        && (before.data.state == "open" || before.data.state == "active")
        && before.data.expiresAt > request.time
        && request.auth.uid == before.data.hostAccountId
        && after.data.state == "revoked"
        && after.data.memberAccountIds == before.data.memberAccountIds
        && freshSessionActivity(after.data.revokedAt);
    }

    function validSessionClose(rivalryId, sessionId) {
      let before = resource.data;
      let after = request.resource.data;
      return validSessionCasUpdate(rivalryId, sessionId)
        && before.data.state == "active"
        && before.data.expiresAt > request.time
        && request.auth.uid in before.data.memberAccountIds
        && after.data.state == "closed"
        && after.data.memberAccountIds == before.data.memberAccountIds
        && after.data.revokedAt == null;
    }

    function validSessionExpire(rivalryId, sessionId) {
      let before = resource.data;
      let after = request.resource.data;
      return validSessionCasUpdate(rivalryId, sessionId)
        && (before.data.state == "open" || before.data.state == "active")
        && request.time >= before.data.expiresAt
        && request.auth.uid in before.data.memberAccountIds
        && after.data.state == "expired"
        && after.data.memberAccountIds == before.data.memberAccountIds
        && after.data.revokedAt == null;
    }

    function validSessionUpdate(rivalryId, sessionId) {
      return (
          request.resource.data.data.state == "active"
          && validSessionJoin(rivalryId, sessionId)
        )
        || (
          request.resource.data.data.state == "revoked"
          && validSessionRevoke(rivalryId, sessionId)
        )
        || (
          request.resource.data.data.state == "closed"
          && validSessionClose(rivalryId, sessionId)
        )
        || (
          request.resource.data.data.state == "expired"
          && validSessionExpire(rivalryId, sessionId)
        );
    }

    // r84 trim: two lookups (the rivalry and the reader's own account, so a disabled or deletion-pending account loses its
    // Session at once). The rival's account is checked when the Session starts; the session itself is resource (a missing
    // one is null), not a second exists().
    function sessionCanRead(rivalryId, sessionId) {
      let session = resource.data;
      return validSessionId(sessionId)
        && activeActor()
        && livePairedRivalryMember(rivalryId)
        && (
          resource == null
          || (
            validEnvelopeShape(session, "session", sessionId)
            && validSessionData(rivalryId, session.data)
            && (
              request.auth.uid in session.data.memberAccountIds
              || (
                session.data.state == "open"
                && session.data.expiresAt > request.time
              )
            )
          )
        );
    }
    // STAGE5C_CANDIDATE_SESSION_FUNCTIONS_END

    // Studio Z4: one shared pointer to the pair's current session, so the rival's phone joins without a typed code.
    // Only the two accounts of the live paired rivalry read it; only a session's own host may point it at that open or
    // active session, with the session's own expiry and a server write time. It is never listed or deleted.
    function validSessionOfferWrite(rivalryId, offerId) {
      let offer = request.resource.data;
      return offerId == "current"
        && activeActor()
        && activePairedRivalry(rivalryId)
        && currentlyEntitled(rivalryId)
        && offer.keys().hasOnly(["schemaVersion", "sessionId", "hostAccountId", "expiresAt", "updatedAt"])
        && offer.keys().hasAll(["schemaVersion", "sessionId", "hostAccountId", "expiresAt", "updatedAt"])
        && offer.schemaVersion == 1
        && validSessionId(offer.sessionId)
        && offer.hostAccountId == request.auth.uid
        && offer.updatedAt == request.time
        && offer.expiresAt is timestamp
        && offer.expiresAt > request.time
        && validSessionOfferTarget(rivalryId, offer);
    }

    function validSessionOfferTarget(rivalryId, offer) {
      let session = get(/databases/$(database)/documents/rivalries/$(rivalryId)/sessions/$(offer.sessionId)).data.data;
      return session.rivalryId == rivalryId
        && session.hostAccountId == request.auth.uid
        && (session.state == "open" || session.state == "active")
        && session.expiresAt == offer.expiresAt;
    }

    function capabilityCanReadPendingRivalry(rivalryId) {
      let invite = get(/databases/$(database)/documents/rivalries/$(rivalryId)/invites/$(rivalryId));
      return activeActor()
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && resource.data.data.connectionState == "pending-pair"
        && invite.data.data.purpose == "rivalry-pairing"
        && invite.data.data.state == "open"
        && invite.data.data.expiresAt > request.time;
    }

    match /accounts/{accountId} {
      allow get: if signedIn() && request.auth.uid == accountId;
      allow create: if validSelfAccountBootstrap(accountId);
      allow list, update, delete: if false;

      match /profileLinks/{profileId} {
        allow get: if signedIn() && request.auth.uid == accountId;
        allow list, create, update, delete: if false;
      }

      match /devices/{deviceId} {
        allow get: if signedIn() && request.auth.uid == accountId;
        allow create: if validDeviceCreate(accountId, deviceId);
        allow update: if validDeviceRevoke(accountId, deviceId);
        allow list, delete: if false;
      }

      match /securityEvents/{eventId} {
        allow get: if signedIn() && request.auth.uid == accountId;
        allow list, create, update, delete: if false;
      }
    }

    match /rivalries/{rivalryId} {
      allow get: if currentlyEntitled(rivalryId) || capabilityCanReadPendingRivalry(rivalryId);
      allow create: if validInitialRivalryCreate(rivalryId);
      allow update: if validRivalryRedeem(rivalryId);
      allow list, delete: if false;

      match /state/authoritative {
        allow get: if currentlyEntitled(rivalryId)
          || (
            activeActor()
            && resource.data.lifecycleState == "tombstoned"
            && resource.data.tombstone != null
            && resource.data.tombstone.restorableByAccountIds is list
            && request.auth.uid in resource.data.tombstone.restorableByAccountIds
          );
        allow create: if validSharedStateCreate(rivalryId);
        allow update: if validSharedStateUpdate(rivalryId);
        allow list, delete: if false;

        match /idempotency/{idempotencyKeyHash} {
          allow get: if currentlyEntitled(rivalryId)
            && validIdempotencyKeyHash(idempotencyKeyHash)
            && (
              !exists(/databases/$(database)/documents/rivalries/$(rivalryId)/state/authoritative/idempotency/$(idempotencyKeyHash))
              || resource.data.data.actorAccountId == request.auth.uid
            );
          allow create: if validIdempotencyCreate(rivalryId, idempotencyKeyHash);
          allow list, update, delete: if false;
        }
      }

      match /invites/{inviteId} {
        allow get: if activeActor()
          && inviteId == rivalryId
          && (
            resource.data.data.createdByAccountId == request.auth.uid
            || (
              resource.data.data.state == "open"
              && resource.data.data.expiresAt > request.time
            )
          );
        allow create: if validInitialInviteCreate(rivalryId, inviteId);
        allow update: if (
          request.resource.data.data.state == "redeemed"
          && validInviteRedeem(rivalryId, inviteId)
        ) || (
          request.resource.data.data.state == "revoked"
          && validInviteRevoke(inviteId)
        );
        allow list, delete: if false;
      }

      // STAGE5C_CANDIDATE_SESSION_MATCH_BEGIN
      match /sessions/{sessionId} {
        allow get: if sessionCanRead(rivalryId, sessionId);
        allow create: if validOpenSessionCreate(rivalryId, sessionId);
        allow update: if validSessionUpdate(rivalryId, sessionId);
        allow list, delete: if false;
      }
      // STAGE5C_CANDIDATE_SESSION_MATCH_END

      match /sessionOffers/{offerId} {
        allow get: if offerId == "current" && livePairedRivalryMember(rivalryId);
        allow create, update: if validSessionOfferWrite(rivalryId, offerId);
        allow list, delete: if false;
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}

```

## FILE: firestore.persistent-pair-production.fragment.rules
```text
// r41 production redeploy: authority unchanged; adversarial role-switch fixture corrected.
// CMS_PERSISTENT_PAIR_FUNCTIONS_BEGIN
    function cmsPersistentPairManagerValid(role, managerId) {
      return (role == 'playerOne' && managerId == 'daniel')
        || (role == 'playerTwo' && managerId == 'nik');
    }

    function cmsPersistentPairRivalryMembership(accountId, rivalryId, role) {
      let rivalry = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId));
      let data = rivalry.data.data;
      return rivalryId is string
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && rivalry.data.objectType == 'rivalry'
        && rivalry.data.objectId == rivalryId
        && rivalry.data.lifecycleState == 'live'
        && (data.connectionState == 'pending-pair' || data.connectionState == 'active')
        && data.managerSlots is list
        && data.managerSlots.size() == 2
        && (
          (
            data.managerSlots[0].slotId == role
            && data.managerSlots[0].accountId == accountId
            && data.managerSlots[0].entitlementState == 'active'
          )
          ||
          (
            data.managerSlots[1].slotId == role
            && data.managerSlots[1].accountId == accountId
            && data.managerSlots[1].entitlementState == 'active'
          )
        );
    }

    function cmsPersistentPairCreationWitnessValid(rivalryId) {
      let pair = getAfter(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current);
      let pairData = pair.data.data;
      return pair.data.objectType == 'pairLink'
        && pair.data.objectId == 'current'
        && pair.data.lifecycleState == 'live'
        && pair.data.updatedByAccountId == request.auth.uid
        && pairData.rivalryId == rivalryId
        && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId);
    }

    function cmsPersistentPairRedemptionWitnessValid(rivalryId, role) {
      let pairData = getAfter(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current).data.data;
      return pairData.rivalryId == rivalryId
        && pairData.managerRole == role
        && cmsPersistentPairManagerValid(role, pairData.managerId);
    }

    function cmsPersistentPairDataValid(accountId, pairData) {
      return pairData.keys().hasOnly([
          'rivalryId',
          'managerRole',
          'managerId',
          'linkedAt',
          'lastConfirmedAt'
        ])
        && pairData.rivalryId is string
        && pairData.rivalryId.matches('^pair_[0-9a-f]{64}$')
        && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId)
        && pairData.linkedAt is timestamp
        && pairData.lastConfirmedAt is timestamp
        && pairData.lastConfirmedAt >= pairData.linkedAt
        && cmsPersistentPairRivalryMembership(accountId, pairData.rivalryId, pairData.managerRole);
    }

    function cmsPersistentPairCanReplace(before, after) {
      let priorRivalry = get(/databases/$(database)/documents/rivalries/$(before.data.rivalryId));
      let priorInvite = get(/databases/$(database)/documents/rivalries/$(before.data.rivalryId)/invites/$(before.data.rivalryId));
      let sameManager = after.data.managerRole == before.data.managerRole
        && after.data.managerId == before.data.managerId;
      return (
          after.data.rivalryId == before.data.rivalryId
          && sameManager
        )
        || (
          priorRivalry.data.objectType == 'rivalry'
          && priorRivalry.data.data.connectionState == 'closed'
        )
        || (
          sameManager
          && priorRivalry.data.objectType == 'rivalry'
          && priorRivalry.data.data.connectionState == 'pending-pair'
          && priorInvite.data.objectType == 'invite'
          && (
            priorInvite.data.data.state != 'open'
            || priorInvite.data.data.expiresAt <= request.time
          )
        );
    }

    function cmsPersistentPairAbandonActorValid(before, rivalryId) {
      let pair = get(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current);
      let pairData = pair.data.data;
      let slots = before.data.managerSlots;
      return pair.data.objectType == 'pairLink'
        && pair.data.objectId == 'current'
        && pair.data.lifecycleState == 'live'
        && pairData.rivalryId == rivalryId
        && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId)
        && slots is list
        && slots.size() == 2
        && (
          (
            slots[0].slotId == pairData.managerRole
            && slots[0].accountId == request.auth.uid
            && slots[0].entitlementState == 'active'
          )
          ||
          (
            slots[1].slotId == pairData.managerRole
            && slots[1].accountId == request.auth.uid
            && slots[1].entitlementState == 'active'
          )
        );
    }

    function cmsPersistentPairAbandonValid(rivalryId) {
      let before = resource.data;
      let after = request.resource.data;
      return signedIn()
        && rivalryId is string
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && before.objectType == 'rivalry'
        && before.objectId == rivalryId
        && before.lifecycleState == 'live'
        && activeDevice(after.updatedByDeviceId)
        && validCasEnvelope(before, after, 'rivalry', rivalryId)
        && after.updatedByAccountId == request.auth.uid
        && cmsPersistentPairAbandonActorValid(before, rivalryId)
        && before.data.authorizedAccountIds is list
        && request.auth.uid in before.data.authorizedAccountIds
        && (before.data.connectionState == 'pending-pair' || before.data.connectionState == 'active')
        && after.data.connectionState == 'closed'
        && after.data.diff(before.data).affectedKeys().hasOnly(['connectionState', 'endedEarly'])
        && (!('endedEarly' in after.data) || cmsPersistentPairEndedEarlyValid(after.data.endedEarly));
    }

    // r80 END SHOWDOWN: the abandon write may carry the ended-early mark. seasonsPlayed is the
    // number of finished seasons (0..10), or null when the count could not be read.
    function cmsPersistentPairEndedEarlyValid(mark) {
      return mark is map
        && mark.keys().hasOnly(['seasonsPlayed'])
        && mark.keys().hasAll(['seasonsPlayed'])
        && (
          mark.seasonsPlayed == null
          || (mark.seasonsPlayed is int && mark.seasonsPlayed >= 0 && mark.seasonsPlayed <= 10)
        );
    }

    function cmsPersistentPairCreateValid(accountId, pairId) {
      let root = request.resource.data;
      return activeDevice(root.updatedByDeviceId)
        && request.auth.uid == accountId
        && pairId == 'current'
        && validCreateEnvelope(root, 'pairLink', pairId)
        && root.updatedByAccountId == accountId
        && cmsPersistentPairDataValid(accountId, root.data)
        && (!cmsCareerIndexEnforced() || cmsCareerIndexPairLinkCoupled(accountId, root.data.rivalryId));
    }

    function cmsPersistentPairUpdateValid(accountId, pairId) {
      let before = resource.data;
      let after = request.resource.data;
      return activeDevice(after.updatedByDeviceId)
        && request.auth.uid == accountId
        && pairId == 'current'
        && validCasEnvelope(before, after, 'pairLink', pairId)
        && after.updatedByAccountId == accountId
        && cmsPersistentPairDataValid(accountId, after.data)
        && after.data.linkedAt == before.data.linkedAt
        && cmsPersistentPairCanReplace(before, after)
        && (!cmsCareerIndexEnforced() || cmsCareerIndexPairLinkCoupled(accountId, after.data.rivalryId));
    }
    // CMS_CAREER_INDEX (D1, JOB-07): own-account, append-only, forward-only career index.
    function cmsCareerIndexPageCapacity() {
      return 500;
    }

    // Phase A admits legacy clients. Enable only after both managers receive the new shell.
    function cmsCareerIndexEnforced() {
      return false;
    }

    function cmsCareerIndexRecordsNewRivalry(accountId, rivalryId) {
      let ids = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data.data.rivalryIds;
      return ids is list
        && ids.size() >= 1
        && ids[ids.size() - 1] == rivalryId;
    }

    // Pair-link coupling (first creation AND replacement): when this commit makes the account a member of
    // the linked rivalry (creation by Daniel, redemption by Nik), the same commit must end the account's
    // career index with that rivalry. A link to a rivalry the account already belonged to before this
    // commit (reconfirm, Continue, recovery of a pre-deployment link) needs no index write and can never
    // add one.
    function cmsCareerIndexPairLinkCoupled(accountId, rivalryId) {
      let rivalryPath = /databases/$(database)/documents/rivalries/$(rivalryId);
      return (exists(rivalryPath) && accountId in get(rivalryPath).data.data.authorizedAccountIds)
        || cmsCareerIndexRecordsNewRivalry(accountId, rivalryId);
    }

    function cmsCareerIndexHeadDataValid(data) {
      return data.keys().hasOnly(['rivalryIds', 'sealedPageCount'])
        && data.keys().hasAll(['rivalryIds', 'sealedPageCount'])
        && data.rivalryIds is list
        && data.rivalryIds.size() >= 1
        && data.rivalryIds.size() <= cmsCareerIndexPageCapacity()
        && data.sealedPageCount is int
        && data.sealedPageCount >= 0;
    }

    function cmsCareerIndexCreationEligible(accountId, rivalryId) {
      let after = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
      return !exists(/databases/$(database)/documents/rivalries/$(rivalryId))
        && after.connectionState == 'pending-pair'
        && after.createdByAccountId == accountId
        && after.authorizedAccountIds == [accountId];
    }

    function cmsCareerIndexRedemptionEligible(accountId, rivalryId) {
      let before = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
      let after = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
      return before.connectionState == 'pending-pair'
        && after.connectionState == 'active'
        && before.authorizedAccountIds.size() == 1
        && !(accountId in before.authorizedAccountIds)
        && after.authorizedAccountIds == [before.createdByAccountId, accountId]
        && rivalryId in get(/databases/$(database)/documents/accounts/$(before.createdByAccountId)/careerIndex/current).data.data.rivalryIds;
    }

    function cmsCareerIndexAppendEligible(accountId, rivalryId) {
      let pair = getAfter(/databases/$(database)/documents/accounts/$(accountId)/pairLinks/current);
      return rivalryId is string
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && pair != null
        && pair.data is map
        && pair.data.data is map
        && pair.data.data.rivalryId == rivalryId
        && cmsPersistentPairManagerValid(pair.data.data.managerRole, pair.data.data.managerId)
        && cmsPersistentPairRivalryMembership(accountId, rivalryId, pair.data.data.managerRole)
        && (
          cmsCareerIndexCreationEligible(accountId, rivalryId)
          || (
            exists(/databases/$(database)/documents/rivalries/$(rivalryId))
            && cmsCareerIndexRedemptionEligible(accountId, rivalryId)
          )
        );
    }

    function cmsCareerIndexPageSealedFrom(accountId, pageNumber, ids) {
      let page = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/$('page_' + string(pageNumber))).data;
      return page.objectType == 'careerIndexPage'
        && page.data.pageNumber == pageNumber
        && page.data.rivalryIds == ids;
    }

    function cmsCareerIndexHeadCreateValid(accountId) {
      let root = request.resource.data;
      return signedIn()
        && request.auth.uid == accountId
        && activeDevice(root.updatedByDeviceId)
        && validCreateEnvelope(root, 'careerIndex', 'current')
        && root.updatedByAccountId == accountId
        && cmsCareerIndexHeadDataValid(root.data)
        && root.data.sealedPageCount == 0
        && root.data.rivalryIds.size() == 1
        && cmsCareerIndexAppendEligible(accountId, root.data.rivalryIds[0]);
    }

    function cmsCareerIndexHeadUpdateValid(accountId) {
      let before = resource.data;
      let after = request.resource.data;
      let prior = before.data.rivalryIds;
      let next = after.data.rivalryIds;
      return signedIn()
        && request.auth.uid == accountId
        && activeDevice(after.updatedByDeviceId)
        && validCasEnvelope(before, after, 'careerIndex', 'current')
        && after.updatedByAccountId == accountId
        && cmsCareerIndexHeadDataValid(after.data)
        && (
          (
            prior.size() < cmsCareerIndexPageCapacity()
            && after.data.sealedPageCount == before.data.sealedPageCount
            && next.size() == prior.size() + 1
            && next[0:prior.size()] == prior
            && !(next[prior.size()] in prior)
            && cmsCareerIndexAppendEligible(accountId, next[prior.size()])
          )
          ||
          (
            prior.size() == cmsCareerIndexPageCapacity()
            && after.data.sealedPageCount == before.data.sealedPageCount + 1
            && next.size() == 1
            && !(next[0] in prior)
            && cmsCareerIndexPageSealedFrom(accountId, after.data.sealedPageCount, prior)
            && cmsCareerIndexAppendEligible(accountId, next[0])
          )
        );
    }

    function cmsCareerIndexPageCreateValid(accountId, pageId) {
      let root = request.resource.data;
      let headBefore = get(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data;
      let headAfter = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data;
      return signedIn()
        && request.auth.uid == accountId
        && activeDevice(root.updatedByDeviceId)
        && validCreateEnvelope(root, 'careerIndexPage', pageId)
        && root.updatedByAccountId == accountId
        && root.data.keys().hasOnly(['pageNumber', 'rivalryIds'])
        && root.data.keys().hasAll(['pageNumber', 'rivalryIds'])
        && root.data.pageNumber is int
        && root.data.pageNumber == headBefore.data.sealedPageCount + 1
        && pageId == 'page_' + string(root.data.pageNumber)
        && headBefore.data.rivalryIds.size() == cmsCareerIndexPageCapacity()
        && root.data.rivalryIds == headBefore.data.rivalryIds
        && headAfter.revision == headBefore.revision + 1
        && headAfter.data.sealedPageCount == root.data.pageNumber;
    }

    // CMS_CAREER_START (owner decision): own-account "real career starts here" marker. Created once, active,
    // naming exactly the account's career index head ids (none when no index exists; never over sealed pages).
    // startedAt is the server time of the press. Afterwards only `active` may change, by CAS (so startedAt and the
    // list stay as written). Get, create and update only; no list, no delete.
    function cmsCareerStartDataValid(data) {
      return data.keys().hasOnly(['hiddenRivalryIds', 'active', 'startedAt'])
        && data.keys().hasAll(['hiddenRivalryIds', 'active', 'startedAt'])
        && data.hiddenRivalryIds is list
        && data.hiddenRivalryIds.size() <= cmsCareerIndexPageCapacity()
        && data.active is bool
        && data.startedAt is timestamp;
    }

    function cmsCareerStartMatchesIndex(accountId, ids) {
      let indexPath = /databases/$(database)/documents/accounts/$(accountId)/careerIndex/current;
      return (!exists(indexPath) && ids.size() == 0)
        || (exists(indexPath)
          && get(indexPath).data.data.sealedPageCount == 0
          && ids == get(indexPath).data.data.rivalryIds);
    }

    function cmsCareerStartCreateValid(accountId, startId) {
      let root = request.resource.data;
      return signedIn()
        && request.auth.uid == accountId
        && startId == 'current'
        && activeDevice(root.updatedByDeviceId)
        && validCreateEnvelope(root, 'careerStart', 'current')
        && root.updatedByAccountId == accountId
        && cmsCareerStartDataValid(root.data)
        && root.data.active == true
        && root.data.startedAt == request.time
        && cmsCareerStartMatchesIndex(accountId, root.data.hiddenRivalryIds);
    }

    function cmsCareerStartUpdateValid(accountId, startId) {
      let before = resource.data;
      let after = request.resource.data;
      return signedIn()
        && request.auth.uid == accountId
        && startId == 'current'
        && activeDevice(after.updatedByDeviceId)
        && validCasEnvelope(before, after, 'careerStart', 'current')
        && after.updatedByAccountId == accountId
        && cmsCareerStartDataValid(after.data)
        && after.data.diff(before.data).affectedKeys().hasOnly(['active']);
    }

    // CMS_PERMANENT_PARTNER (r79, owner decision 2026-10-17): each real account keeps one partner record naming the
    // account it paired with through a real (marker-holding) pairing. Written only by its owner, only while the named
    // rivalry has the owner and the partner in their slots. UNPAIR sets active false; re-pair needs active false.
    function cmsPartnerDataValid(data) {
      return data.keys().hasOnly(['schemaVersion', 'partnerAccountId', 'myRole', 'pairedViaRivalryId', 'pairedAt', 'active', 'updatedAt'])
        && data.keys().hasAll(['schemaVersion', 'partnerAccountId', 'myRole', 'pairedViaRivalryId', 'pairedAt', 'active', 'updatedAt'])
        && data.schemaVersion == 1
        && data.partnerAccountId is string
        && data.partnerAccountId != request.auth.uid
        && data.myRole in ['playerOne', 'playerTwo']
        && data.pairedViaRivalryId is string
        && data.pairedViaRivalryId.matches('^pair_[0-9a-f]{64}$')
        && data.pairedAt is timestamp
        && data.active is bool
        && data.updatedAt == request.time;
    }

    function cmsPartnerSlotsMatch(slots, myRole, partnerAccountId) {
      return slots is list
        && slots.size() == 2
        && slots[0].slotId == 'playerOne'
        && slots[1].slotId == 'playerTwo'
        && slots[0].entitlementState == 'active'
        && slots[1].entitlementState == 'active'
        && (
          (myRole == 'playerOne' && slots[0].accountId == request.auth.uid && slots[1].accountId == partnerAccountId)
          || (myRole == 'playerTwo' && slots[1].accountId == request.auth.uid && slots[0].accountId == partnerAccountId)
        );
    }

    // The pairing rivalry must belong to the real career: never one the account's career-start marker hid
    // (pre-career test games), and created after the marker (playerOne made it after pressing START REAL
    // CAREER; playerTwo writes its marker just before redeeming, so the rivalry is at most one invite
    // window, 30 min, older than that marker). rivalry.createdAt is the creating device's clock, so both
    // windows allow 5 min of clock skew. The marker's `active` flag only chooses whether test Showdowns are shown,
    // so it never affects pairing.
    function cmsPartnerPairingValid(accountId, data) {
      let rivalry = get(/databases/$(database)/documents/rivalries/$(data.pairedViaRivalryId)).data;
      let start = get(/databases/$(database)/documents/accounts/$(accountId)/careerStart/current).data.data;
      return cmsPartnerDataValid(data)
        && data.active == true
        && data.pairedAt == request.time
        && rivalry.objectType == 'rivalry'
        && rivalry.objectId == data.pairedViaRivalryId
        && rivalry.lifecycleState == 'live'
        && rivalry.data.connectionState in ['active', 'closed']
        && rivalry.data.authorizedAccountIds is list
        && rivalry.data.authorizedAccountIds.size() == 2
        && cmsPartnerSlotsMatch(rivalry.data.managerSlots, data.myRole, data.partnerAccountId)
        && !(data.pairedViaRivalryId in start.hiddenRivalryIds)
        && (
          (data.myRole == 'playerOne' && rivalry.data.createdAt >= start.startedAt - duration.value(5, 'm'))
          || (data.myRole == 'playerTwo' && rivalry.data.createdAt >= start.startedAt - duration.value(35, 'm'))
        );
    }

    function cmsPartnerCreateValid(accountId, partnerId) {
      return signedIn()
        && request.auth.uid == accountId
        && partnerId == 'current'
        && activeActor()
        && cmsPartnerPairingValid(accountId, request.resource.data);
    }

    function cmsPartnerUpdateValid(accountId, partnerId) {
      let before = resource.data;
      let after = request.resource.data;
      return signedIn()
        && request.auth.uid == accountId
        && partnerId == 'current'
        && activeActor()
        && (
          (
            before.active == true
            && cmsPartnerDataValid(after)
            && after.active == false
            && after.diff(before).affectedKeys().hasOnly(['active', 'updatedAt'])
          )
          || (
            before.active == false
            && cmsPartnerPairingValid(accountId, after)
          )
        );
    }

    // CMS_PARTNER_INBOX (r79): the private JOIN note. Daniel's START writes it into Nik's account; only Nik reads it.
    // Both partner records must be active and point at each other, the writer must be playerOne, and the note must
    // name the writer's own open pending rivalry with the invite's exact expiry and the season count in the id.
    // One doc, overwritten on each START, never listed or deleted; an expired note is useless because redeem checks
    // the invite's expiry. Re-writing the same rivalry is allowed only after 60 s (a safe client retry), so a retry loop
    // cannot burn the Spark quota.
    function cmsPartnerInboxSeasonsMatch(rivalryId, totalSeasons) {
      return (totalSeasons == 1 && rivalryId.matches('^pair_1[0-9a-f]{63}$'))
        || (totalSeasons == 3 && rivalryId.matches('^pair_3[0-9a-f]{63}$'))
        || (totalSeasons == 5 && rivalryId.matches('^pair_5[0-9a-f]{63}$'))
        || (totalSeasons == 10 && rivalryId.matches('^pair_a[0-9a-f]{63}$'));
    }

    function cmsPartnerInboxWriteValid(accountId, noteId) {
      let note = request.resource.data;
      let mine = get(/databases/$(database)/documents/accounts/$(request.auth.uid)/partner/current).data;
      let theirs = get(/databases/$(database)/documents/accounts/$(accountId)/partner/current).data;
      let rivalry = get(/databases/$(database)/documents/rivalries/$(note.rivalryId)).data;
      let invite = get(/databases/$(database)/documents/rivalries/$(note.rivalryId)/invites/$(note.rivalryId)).data;
      return signedIn()
        && noteId == 'current'
        && accountId != request.auth.uid
        && activeActor()
        && note.keys().hasOnly(['schemaVersion', 'rivalryId', 'totalSeasons', 'fromAccountId', 'createdAt', 'expiresAt'])
        && note.keys().hasAll(['schemaVersion', 'rivalryId', 'totalSeasons', 'fromAccountId', 'createdAt', 'expiresAt'])
        && note.schemaVersion == 1
        && note.fromAccountId == request.auth.uid
        && note.createdAt == request.time
        && note.rivalryId is string
        && note.rivalryId.matches('^pair_[0-9a-f]{64}$')
        && cmsPartnerInboxSeasonsMatch(note.rivalryId, note.totalSeasons)
        && mine.active == true
        && mine.myRole == 'playerOne'
        && mine.partnerAccountId == accountId
        && theirs.active == true
        && theirs.myRole == 'playerTwo'
        && theirs.partnerAccountId == request.auth.uid
        && rivalry.objectType == 'rivalry'
        && rivalry.lifecycleState == 'live'
        && rivalry.data.connectionState == 'pending-pair'
        && rivalry.data.createdByAccountId == request.auth.uid
        && invite.objectType == 'invite'
        && invite.data.purpose == 'rivalry-pairing'
        && invite.data.slotId == 'playerTwo'
        && invite.data.state == 'open'
        && invite.data.createdByAccountId == request.auth.uid
        && invite.data.expiresAt == note.expiresAt
        && note.expiresAt > request.time
        && (
          resource == null
          || resource.data.rivalryId != note.rivalryId
          || request.time > resource.data.createdAt + duration.value(60, 's')
        );
    }
    // r86 reads at scale (Nik 2026-10-27): one create-only career summary per finished Showdown under the reading
    // account. Reads are owner-only exact gets (no lookup); the one create checks the closed root and, for a completed
    // Showdown, that the summary's totals, winner and length equal the Terminal Close witness. Never updated or deleted.
    function cmsCareerSummaryCreateValid(accountId, rivalryId) {
      let s = request.resource.data;
      let root = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
      return signedIn()
        && request.auth.uid == accountId
        && activeAccount(request.auth.uid)
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && s.keys().hasOnly(['schemaVersion', 'objectType', 'rivalryId', 'status', 'totalSeasons', 'managerTotals', 'winner', 'payload', 'payloadHash'])
        && s.keys().hasAll(['schemaVersion', 'objectType', 'rivalryId', 'status', 'totalSeasons', 'managerTotals', 'winner', 'payload', 'payloadHash'])
        && s.schemaVersion == 1
        && s.objectType == 'careerSummary'
        && s.rivalryId == rivalryId
        && s.payload is string
        && s.payload.size() > 0
        && s.payload.size() <= 262144
        && s.payloadHash is string
        && s.payloadHash.matches('^sha256:[0-9a-f]{64}$')
        && root.connectionState == 'closed'
        && accountId in root.authorizedAccountIds
        && ((s.status == 'completed'
              && 'terminalClose' in root
              && root.terminalClose.rivalryId == rivalryId
              && s.totalSeasons == root.terminalClose.totalSeasons
              && s.managerTotals == root.terminalClose.managerTotals
              && s.winner == root.terminalClose.winner)
          || ((s.status == 'abandoned' || s.status == 'never-started')
              && !('terminalClose' in root)
              && s.totalSeasons == null
              && s.managerTotals == null
              && s.winner == null));
    }

    // CMS_COMPLETED_READ (D2, JOB-08): read-only grant for a Showdown closed by a verified
    // Terminal Close. Get only; no write, list or delete rule refers to these functions.
    function cmsCompletedShowdownReadable(rivalryId) {
      let root = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
      let data = root.data;
      let slots = data.managerSlots;
      let progress = data.terminalProgress;
      return signedIn()
        && rivalryId.matches('^pair_[0-9a-f]{64}$')
        && root.objectType == 'rivalry'
        && root.objectId == rivalryId
        && root.lifecycleState == 'live'
        && data.connectionState == 'closed'
        && data.authorizedAccountIds is list
        && data.authorizedAccountIds.size() == 2
        && data.authorizedAccountIds[0] != data.authorizedAccountIds[1]
        && request.auth.uid in data.authorizedAccountIds
        && slots is list
        && slots.size() == 2
        && slots[0].slotId == 'playerOne'
        && slots[1].slotId == 'playerTwo'
        && (slots[0].accountId == request.auth.uid || slots[1].accountId == request.auth.uid)
        && activeAccount(request.auth.uid)
        && 'terminalClose' in data
        && ssjrTerminalValidIntent(rivalryId, data.terminalClose)
        && ssjrTerminalProgressShape(progress)
        && progress.acceptedThroughSeason == progress.totalSeasons
        && progress.closedSessionRevision is int
        && data.terminalClose.totalSeasons == progress.totalSeasons
        && data.terminalClose.managerTotals == progress.managerTotals;
    }

    function cmsCompletedSeasonReadable(rivalryId, seasonId) {
      let total = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data.terminalProgress.totalSeasons;
      return cmsCompletedShowdownReadable(rivalryId)
        && seasonId in ['season_1','season_2','season_3','season_4','season_5','season_6','season_7','season_8','season_9','season_10'][0:total];
    }

    // CMS_COMPLETED_TRANSFER_READ (JOB-10): a transfer role of a Terminal-Closed Showdown, for season_1..season_N,
    // only when that season's challenge is publicly COMPLETED (both guesses and both signings locked).
    // Keeps the existing role/phase condition of ssjrTransferPrivateReadable. Get only.
    function cmsCompletedTransferRoleReadable(rivalryId, transferId) {
      let challenge = get(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)).data;
      return cmsCompletedSeasonReadable(rivalryId, transferId)
        && challenge.schemaVersion == 1
        && challenge.objectType == 'sharedTransferChallenge'
        && challenge.rivalryId == rivalryId
        && ssjrTransferSeasonMatches(transferId, challenge.seasonNumber)
        && challenge.phase == 'COMPLETED'
        && challenge.guessLockedRoles is list
        && challenge.guessLockedRoles.size() == 2
        && 'playerOne' in challenge.guessLockedRoles
        && 'playerTwo' in challenge.guessLockedRoles
        && challenge.signingLockedRoles is list
        && challenge.signingLockedRoles.size() == 2
        && 'playerOne' in challenge.signingLockedRoles
        && 'playerTwo' in challenge.signingLockedRoles;
    }

// CMS_PERSISTENT_PAIR_FUNCTIONS_END

// CMS_PERSISTENT_PAIR_MATCH_BEGIN
    match /accounts/{accountId}/pairLinks/{pairId} {
      allow get: if signedIn() && request.auth.uid == accountId && pairId == 'current';
      allow create: if cmsPersistentPairCreateValid(accountId, pairId);
      allow update: if cmsPersistentPairUpdateValid(accountId, pairId);
      allow list, delete: if false;
    }

    match /accounts/{accountId}/careerIndex/{indexId} {
      allow get: if signedIn()
        && request.auth.uid == accountId
        && (indexId == 'current' || indexId.matches('^page_[1-9][0-9]*$'));
      allow create: if (indexId == 'current' && cmsCareerIndexHeadCreateValid(accountId))
        || (indexId.matches('^page_[1-9][0-9]*$') && cmsCareerIndexPageCreateValid(accountId, indexId));
      allow update: if indexId == 'current' && cmsCareerIndexHeadUpdateValid(accountId);
      allow list, delete: if false;
    }

    match /accounts/{accountId}/careerStart/{startId} {
      allow get: if signedIn()
        && request.auth.uid == accountId
        && startId == 'current'
        && activeActor();
      allow create: if cmsCareerStartCreateValid(accountId, startId);
      allow update: if cmsCareerStartUpdateValid(accountId, startId);
      allow list, delete: if false;
    }
    match /accounts/{accountId}/partner/{partnerId} {
      allow get: if signedIn()
        && partnerId == 'current'
        && (request.auth.uid == accountId || resource.data.partnerAccountId == request.auth.uid);
      allow create: if cmsPartnerCreateValid(accountId, partnerId);
      allow update: if cmsPartnerUpdateValid(accountId, partnerId);
      allow list, delete: if false;
    }

    match /accounts/{accountId}/partnerInbox/{noteId} {
      allow get: if signedIn() && request.auth.uid == accountId && noteId == 'current';
      allow create, update: if cmsPartnerInboxWriteValid(accountId, noteId);
      allow list, delete: if false;
    }
    match /accounts/{accountId}/careerSummary/{rivalryId} {
      // A disabled or tombstoned account loses its summaries with the rest of the shared history (same boundary as
      // cmsCompletedShowdownReadable).
      allow get: if signedIn() && request.auth.uid == accountId && activeAccount(request.auth.uid);
      allow create: if cmsCareerSummaryCreateValid(accountId, rivalryId);
      allow update, list, delete: if false;
    }
// CMS_PERSISTENT_PAIR_MATCH_END
```

## FILE: firestore.shared-setup-production.fragment.rules
```text
// SSJR_SHARED_SETUP_FUNCTIONS_BEGIN
    function ssjrValidRivalryId(value) { return value is string && value.matches('^pair_[0-9a-f]{64}$'); }
    function ssjrValidDeviceId(value) { return value is string && value.matches('^device_[0-9a-f]{32}$'); }
    function ssjrValidOperationId(value) { return value is string && value.matches('^setup_op_[0-9a-f]{32}$'); }
    function ssjrRivalryData(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data; }
    function ssjrExactPairedRivalry(rivalryId) {
      let root = get(/databases/$(database)/documents/rivalries/$(rivalryId));
      let data = root.data.data;
      return ssjrValidRivalryId(rivalryId)
        && root.data.objectType == 'rivalry'
        && root.data.objectId == rivalryId
        && root.data.lifecycleState == 'live'
        && data.connectionState == 'active'
        && data.authorizedAccountIds is list
        && data.authorizedAccountIds.size() == 2
        && data.authorizedAccountIds[0] != data.authorizedAccountIds[1]
        && data.managerSlots is list
        && data.managerSlots.size() == 2
        && data.managerSlots[0].slotId == 'playerOne'
        && data.managerSlots[1].slotId == 'playerTwo'
        && data.managerSlots[0].accountId != data.managerSlots[1].accountId
        && validProfileId(data.managerSlots[0].profileId)
        && validProfileId(data.managerSlots[1].profileId)
        && validSaveId(data.managerSlots[0].saveId)
        && validSaveId(data.managerSlots[1].saveId)
        && data.managerSlots[0].entitlementState == 'active'
        && data.managerSlots[1].entitlementState == 'active'
        && data.managerSlots[0].accountId in data.authorizedAccountIds
        && data.managerSlots[1].accountId in data.authorizedAccountIds
        && activeAccount(data.managerSlots[0].accountId)
        && activeAccount(data.managerSlots[1].accountId);
    }
    // r84 trim: a shared read needs only the live paired rivalry that lists the signed-in account (one lookup). The two
    // account documents are not looked up again: no client can change their status (account update is denied) and the Spark
    // app ships no account deletion flow; Session start and Shared Setup open still check both (lazy enforcement).
    function ssjrEntitled(rivalryId) {
      return ssjrValidRivalryId(rivalryId) && livePairedRivalryMember(rivalryId);
    }
    function ssjrActorRole(rivalryId) {
      return ssjrRivalryData(rivalryId).managerSlots[0].accountId == request.auth.uid ? 'playerOne' : 'playerTwo';
    }

    // Shared write authority is evaluated once per write. Only the exact
    // account/device/rivalry/session facts required by these namespaced ledgers are
    // rechecked so the production Rules remain under Firestore's expression ceiling.
    // Audit R84 F01/F02 (r85): every shared write looks up four documents: the rivalry, the named Session, the ACTING account
    // and the acting device. The r84 trim (rivalry + session only) let a deletion-pending account, or a revoked or
    // unregistered device, keep writing through a direct request. The partner account is not looked up on every write (no
    // client can change account status and the app ships no deletion flow; both accounts are checked at Session start and
    // Shared Setup open). Reads stay membership-only (ssjrEntitled), by decision: a lookup on every listener read would cost
    // hundreds of billed reads a season on the Spark limit.
    // ssjrActorWriteAuthorityValid holds the actor/Session/device/account facts. Season Commit calls it directly because its
    // create validator already sits near the 1,000-expression ceiling; every other shared write calls ssjrWriteAuthorityValid,
    // which adds the manager-pair shape checks on the same rivalry document (no extra lookup).
    function ssjrActorWriteAuthorityValid(rivalryId, deviceId, sessionId) {
      let actor = request.auth.uid;
      let rivalryRoot = get(/databases/$(database)/documents/rivalries/$(rivalryId));
      let rivalry = rivalryRoot.data.data;
      let actorAccount = get(/databases/$(database)/documents/accounts/$(actor));
      let device = get(/databases/$(database)/documents/accounts/$(actor)/devices/$(deviceId));
      let session = get(/databases/$(database)/documents/rivalries/$(rivalryId)/sessions/$(sessionId));
      let sessionData = session.data.data;
      return signedIn()
        && ssjrValidRivalryId(rivalryId)
        && ssjrValidDeviceId(deviceId)
        && validSessionId(sessionId)
        && rivalryRoot.data.lifecycleState == 'live'
        && rivalry.connectionState == 'active'
        && actor in rivalry.authorizedAccountIds
        && actorAccount.data.data.status == 'active'
        && device.data.objectId == deviceId
        && device.data.data.state == 'active'
        && session.data.objectId == sessionId
        && sessionData.rivalryId == rivalryId
        && sessionData.state == 'active'
        && sessionData.memberAccountIds is list
        && sessionData.memberAccountIds.size() == 2
        && rivalry.authorizedAccountIds[0] in sessionData.memberAccountIds
        && rivalry.authorizedAccountIds[1] in sessionData.memberAccountIds
        && sessionData.expiresAt is timestamp;
    }
    function ssjrWriteAuthorityValid(rivalryId, deviceId, sessionId) {
      let rivalry = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
      let slot0AccountId = rivalry.managerSlots[0].accountId;
      let slot1AccountId = rivalry.managerSlots[1].accountId;
      return ssjrActorWriteAuthorityValid(rivalryId, deviceId, sessionId)
        && rivalry.authorizedAccountIds is list
        && rivalry.authorizedAccountIds.size() == 2
        && rivalry.authorizedAccountIds[0] != rivalry.authorizedAccountIds[1]
        && rivalry.managerSlots is list
        && rivalry.managerSlots.size() == 2
        && rivalry.managerSlots[0].slotId == 'playerOne'
        && rivalry.managerSlots[1].slotId == 'playerTwo'
        && slot0AccountId != slot1AccountId
        && rivalry.managerSlots[0].entitlementState == 'active'
        && rivalry.managerSlots[1].entitlementState == 'active'
        && slot0AccountId in rivalry.authorizedAccountIds
        && slot1AccountId in rivalry.authorizedAccountIds;
    }
    // r84 trim: both manager accounts are checked once per Showdown, when the Shared Setup is opened (plus at every Session
    // start), instead of on every save: a deleted or deletion-pending account cannot start a new Showdown.
    function ssjrBothAccountsActive(rivalryId) {
      let slots = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data.managerSlots;
      return get(/databases/$(database)/documents/accounts/$(slots[0].accountId)).data.data.status == 'active'
        && get(/databases/$(database)/documents/accounts/$(slots[1].accountId)).data.data.status == 'active';
    }
    function ssjrSessionHostIsActor(rivalryId, sessionId) {
      return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sessions/$(sessionId)).data.data.hostAccountId == request.auth.uid;
    }
    function ssjrSetupHexMod5(value) {
      return value in ['0','5','a','f'] ? 0
        : value in ['1','6','b'] ? 1
        : value in ['2','7','c'] ? 2
        : value in ['3','8','d'] ? 3
        : value in ['4','9','e'] ? 4
        : -1;
    }
    function ssjrSetupHex32Mod5(value) {
      return (ssjrSetupHexMod5(value[0])
        + ssjrSetupHexMod5(value[1])
        + ssjrSetupHexMod5(value[2])
        + ssjrSetupHexMod5(value[3])
        + ssjrSetupHexMod5(value[4])
        + ssjrSetupHexMod5(value[5])
        + ssjrSetupHexMod5(value[6])
        + ssjrSetupHexMod5(value[7])) % 5;
    }
    function ssjrSetupBindingCanonical(rivalryId) {
      let rivalry = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
      let slots = rivalry.managerSlots;
      return '{"managerSlots":[{"accountId":"' + slots[0].accountId
        + '","profileId":"' + slots[0].profileId
        + '","saveId":"' + slots[0].saveId
        + '","slotId":"' + slots[0].slotId
        + '"},{"accountId":"' + slots[1].accountId
        + '","profileId":"' + slots[1].profileId
        + '","saveId":"' + slots[1].saveId
        + '","slotId":"' + slots[1].slotId
        + '"}],"rivalryId":"' + rivalryId + '"}';
    }
    function ssjrSetupBindingHash(rivalryId) {
      return 'sha256:' + hashing.sha256(ssjrSetupBindingCanonical(rivalryId)).toHexString().lower();
    }
    function ssjrSetupLeagueDigest(rivalryId, counter) {
      let seed = '{"bindingHash":"' + ssjrSetupBindingHash(rivalryId)
        + '","catalogHash":"sha256:f68d0a20f13304ae5af9faa2fee0b731d3491375304f635fb52c68840484d2ce'
        + '","counter":' + string(counter)
        + ',"domain":"shared-showdown-draw-v1","leagueId":null,"purpose":"league"}';
      return hashing.sha256(seed).toHexString().lower();
    }
    function ssjrSetupLeagueIndex(rivalryId) {
      let first = ssjrSetupLeagueDigest(rivalryId, 0);
      let selected = first[0:8] == 'ffffffff' ? ssjrSetupLeagueDigest(rivalryId, 1) : first;
      return selected[0:8] == 'ffffffff' ? -1 : ssjrSetupHex32Mod5(selected);
    }
    function ssjrSetupTeamCount(rivalryId) {
      let index = ssjrSetupLeagueIndex(rivalryId);
      return index == 2 ? 18 : (index >= 0 && index <= 4 ? 20 : 0);
    }
    function ssjrLeagueProjectionCreateValid(rivalryId) {
      let after = request.resource.data;
      let setup = get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data;
      let rivalry = ssjrRivalryData(rivalryId);
      // Audit R84 F01 (r85): the acting account must be active (one lookup, once per Showdown); the team count itself is
      // derived by these Rules from the binding, so no device or Session field is carried.
      return activeActor()
        && after.keys().hasOnly(['schemaVersion','objectType','rivalryId','teamCount','createdAt'])
        && after.schemaVersion == 1
        && after.objectType == 'sharedLeagueProjection'
        && after.rivalryId == rivalryId
        && after.teamCount in [18,20]
        && after.teamCount == ssjrSetupTeamCount(rivalryId)
        && after.createdAt == request.time
        && request.auth.uid in rivalry.authorizedAccountIds
        && setup.schemaVersion == 1
        && setup.objectType == 'sharedSetupLedger'
        && setup.rivalryId == rivalryId
        && setup.revision == 6
        && setup.phase == 'SHOWDOWN_CONFIRMED';
    }
    function ssjrExactLedgerKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','revision','phase','coordinatorRole',
        'operationIds','operationTypes','baseRevisions','actorRoles','totalSeasons',
        'confirmedRoles','activeSessionId','updatedAt','updatedByDeviceId'
      ]);
    }
    function ssjrValidLedgerBase(root, rivalryId) {
      let historySize = root.operationIds.size();
      return ssjrExactLedgerKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedSetupLedger'
        && root.rivalryId == rivalryId
        && root.revision is int
        && root.revision >= 1
        && root.revision <= 6
        && (root.coordinatorRole == 'playerOne' || root.coordinatorRole == 'playerTwo')
        && root.operationIds is list
        && root.operationTypes is list
        && root.baseRevisions is list
        && root.actorRoles is list
        && historySize == root.revision
        && root.operationTypes.size() == historySize
        && root.baseRevisions.size() == historySize
        && root.actorRoles.size() == historySize
        && root.confirmedRoles is list
        && root.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
    }
    function ssjrValidCreateLedger(rivalryId) {
      let after = request.resource.data;
      return ssjrValidLedgerBase(after, rivalryId)
        && after.revision == 1
        && after.phase == 'SHARED_SETUP_OPEN'
        && after.coordinatorRole == ssjrActorRole(rivalryId)
        && ssjrValidOperationId(after.operationIds[0])
        && after.operationTypes[0] == 'open'
        && after.baseRevisions[0] == 0
        && after.actorRoles[0] == after.coordinatorRole
        && after.totalSeasons == null
        && after.confirmedRoles.size() == 0
        && ssjrSessionHostIsActor(rivalryId, after.activeSessionId)
        && ssjrBothAccountsActive(rivalryId);
    }
    function ssjrPrefixPreserved(before, after) {
      let n = before.revision;
      return after.operationIds[0:n] == before.operationIds
        && after.operationTypes[0:n] == before.operationTypes
        && after.baseRevisions[0:n] == before.baseRevisions
        && after.actorRoles[0:n] == before.actorRoles;
    }
    function ssjrNewOperationValid(before, after) {
      let index = before.revision;
      return ssjrValidOperationId(after.operationIds[index])
        && !(after.operationIds[index] in before.operationIds)
        && after.baseRevisions[index] == before.revision
        && after.actorRoles[index] == ssjrActorRole(after.rivalryId);
    }
    function ssjrTransitionShapeValid(before, after) {
      let i = before.revision;
      let nextTypes = ['unused','commit-league','commit-clubs','commit-length','confirm','confirm'];
      let nextPhases = ['unused','LEAGUE_WHEEL_COMMITTED','CLUB_ASSIGNMENTS_COMMITTED','SEASON_LENGTH_COMMITTED','SEASON_LENGTH_COMMITTED','SHOWDOWN_CONFIRMED'];
      return i >= 1
        && i <= 5
        && after.operationTypes[i] == nextTypes[i]
        && after.phase == nextPhases[i]
        && (i >= 4 || after.actorRoles[i] == before.coordinatorRole)
        && (
          (i <= 2 && before.totalSeasons == null && after.totalSeasons == null)
          || (i == 3 && before.totalSeasons == null && after.totalSeasons in [1,3,5,10])
          || (i >= 4 && after.totalSeasons == before.totalSeasons)
        )
        && (
          (i <= 3 && after.confirmedRoles.size() == 0)
          || (i == 4
            && before.confirmedRoles.size() == 0
            && after.confirmedRoles.size() == 1
            && after.confirmedRoles[0] == after.actorRoles[i])
          || (i == 5
            && before.confirmedRoles.size() == 1
            && after.confirmedRoles.size() == 2
            && after.confirmedRoles[0] == before.confirmedRoles[0]
            && after.confirmedRoles[1] == after.actorRoles[i]
            && after.confirmedRoles[1] != after.confirmedRoles[0])
        );
    }
    function ssjrValidUpdateLedger(rivalryId) {
      let before = resource.data;
      let after = request.resource.data;
      return ssjrValidLedgerBase(after, rivalryId)
        && after.revision == before.revision + 1
        && after.coordinatorRole == before.coordinatorRole
        && ssjrPrefixPreserved(before, after)
        && ssjrNewOperationValid(before, after)
        && ssjrTransitionShapeValid(before, after);
    }
// SSJR_SHARED_SETUP_FUNCTIONS_END

// SSJR_SHARED_SETUP_MATCH_BEGIN
      match /sharedSetup/authoritative {
        allow get: if ssjrEntitled(rivalryId);
        allow list, delete: if false;
        allow create: if ssjrValidCreateLedger(rivalryId);
        allow update: if ssjrValidUpdateLedger(rivalryId);
      }

      match /sharedSetup/leagueProjection {
        allow get: if ssjrEntitled(rivalryId);
        allow list, update, delete: if false;
        allow create: if ssjrLeagueProjectionCreateValid(rivalryId);
      }
// SSJR_SHARED_SETUP_MATCH_END
```

## FILE: firestore.career-start-production.fragment.rules
```text
// SSJR_CAREER_START_FUNCTIONS_BEGIN
    function ssjrCareerValidOperationId(value) { return value is string && value.matches('^career_start_op_[0-9a-f]{32}$'); }
    function ssjrCareerSetup(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative); }
    function ssjrCareerSetupConfirmed(rivalryId) {
      let setup = ssjrCareerSetup(rivalryId).data;
      return setup.schemaVersion == 1
        && setup.objectType == 'sharedSetupLedger'
        && setup.rivalryId == rivalryId
        && setup.revision == 6
        && setup.phase == 'SHOWDOWN_CONFIRMED'
        && setup.operationIds is list
        && setup.operationIds.size() == 6
        && setup.confirmedRoles is list
        && setup.confirmedRoles.size() == 2
        && 'playerOne' in setup.confirmedRoles
        && 'playerTwo' in setup.confirmedRoles
        && setup.totalSeasons in [1,3,5,10];
    }
    function ssjrCareerExactKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','revision','phase','setupRevision',
        'setupOperationIds','totalSeasons','acknowledgedRoles','operationIds',
        'baseRevisions','actorRoles','activeSessionId','updatedAt','updatedByDeviceId'
      ]);
    }
    function ssjrCareerShapeValid(root, rivalryId) {
      let setup = ssjrCareerSetup(rivalryId).data;
      return ssjrCareerExactKeys(root)
        && ssjrCareerSetupConfirmed(rivalryId)
        && root.schemaVersion == 1
        && root.objectType == 'sharedCareerStart'
        && root.rivalryId == rivalryId
        && root.revision is int
        && root.revision >= 1
        && root.revision <= 2
        && root.setupRevision == 6
        && root.setupOperationIds == setup.operationIds
        && root.totalSeasons == setup.totalSeasons
        && root.acknowledgedRoles is list
        && root.acknowledgedRoles.size() == root.revision
        && root.operationIds is list
        && root.operationIds.size() == root.revision
        && root.baseRevisions is list
        && root.baseRevisions.size() == root.revision
        && root.actorRoles is list
        && root.actorRoles.size() == root.revision;
    }
    function ssjrCareerWriteValid(root, rivalryId) {
      return ssjrCareerShapeValid(root, rivalryId)
        && root.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
    }
    function ssjrCareerValidCreate(rivalryId) {
      let after = request.resource.data;
      let actorRole = ssjrActorRole(rivalryId);
      return ssjrCareerWriteValid(after, rivalryId)
        && after.revision == 1
        && after.phase == 'ONE_MANAGER_ACKNOWLEDGED'
        && after.acknowledgedRoles[0] == actorRole
        && after.actorRoles[0] == actorRole
        && after.baseRevisions[0] == 0
        && ssjrCareerValidOperationId(after.operationIds[0]);
    }
    function ssjrCareerValidUpdate(rivalryId) {
      let before = resource.data;
      let after = request.resource.data;
      let actorRole = ssjrActorRole(rivalryId);
      return ssjrCareerExactKeys(after)
        && after.schemaVersion == before.schemaVersion
        && after.objectType == before.objectType
        && after.rivalryId == before.rivalryId
        && before.revision == 1
        && before.phase == 'ONE_MANAGER_ACKNOWLEDGED'
        && after.revision == 2
        && after.phase == 'CAREER_START_READY'
        && after.setupRevision == before.setupRevision
        && after.setupOperationIds == before.setupOperationIds
        && after.totalSeasons == before.totalSeasons
        && after.acknowledgedRoles == before.acknowledgedRoles.concat([actorRole])
        && after.actorRoles == before.actorRoles.concat([actorRole])
        && after.operationIds == before.operationIds.concat([after.operationIds[1]])
        && after.baseRevisions == before.baseRevisions.concat([1])
        && actorRole != before.acknowledgedRoles[0]
        && ssjrCareerValidOperationId(after.operationIds[1])
        && after.operationIds[1] != before.operationIds[0]
        && after.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId);
    }
// SSJR_CAREER_START_FUNCTIONS_END

// SSJR_CAREER_START_MATCH_BEGIN
      match /careerStart/authoritative {
        allow get: if ssjrEntitled(rivalryId);
        allow list, delete: if false;
        allow create: if ssjrCareerValidCreate(rivalryId);
        allow update: if ssjrCareerValidUpdate(rivalryId);
      }
// SSJR_CAREER_START_MATCH_END

```

## FILE: firestore.transfer-challenge-production.fragment.rules
```text
// SSJR_TRANSFER_CHALLENGE_FUNCTIONS_BEGIN
    function ssjrTransferValidOperationId(value) { return value is string && value.matches('^transfer_op_[0-9a-f]{32}$'); }
    function ssjrTransferValidHash(value) { return value is string && value.matches('^sha256:[0-9a-f]{64}$'); }
    function ssjrTransferValidRole(value) { return value == 'playerOne' || value == 'playerTwo'; }
    // JOB-1052: exactly the repository FIFA 17 catalog the game's reader accepts. One anchored alternation per catalog (and one over both), so each
    // id costs one regex match, not a list membership scan: the max-size 3-guess/3-signing transaction stays inside the evaluation budget.
    // The build script fills the placeholders from data/transferOptions.js; they are never hand-edited. A non-string value makes matches() error, which denies.
    function ssjrTransferValidOptionId(value) { return value.matches('__SSJR_TRANSFER_OPTION_ID_PATTERN__'); }
    function ssjrTransferCatalogLeagueId(value) { return value.matches('__SSJR_TRANSFER_LEAGUE_ID_PATTERN__'); }
    function ssjrTransferCatalogNationalityId(value) { return value.matches('__SSJR_TRANSFER_NATIONALITY_ID_PATTERN__'); }
    // JOB-1052: a signing name the reader accepts: 1 to 80 characters and unchanged by JavaScript String.trim() (no leading or trailing
    // white space or line terminator: TAB..CR, space, U+00A0, U+1680, U+2000..U+200A, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF).
    function ssjrTransferValidSigningName(value) {
      return value is string
        && value.size() >= 1
        && value.size() <= 80
        && value.matches('^[^\\t-\\r \\x{00A0}\\x{1680}\\x{2000}-\\x{200A}\\x{2028}\\x{2029}\\x{202F}\\x{205F}\\x{3000}\\x{FEFF}]([\\s\\S]*[^\\t-\\r \\x{00A0}\\x{1680}\\x{2000}-\\x{200A}\\x{2028}\\x{2029}\\x{202F}\\x{205F}\\x{3000}\\x{FEFF}])?$');
    }
    // JOB-1051: a lock salt is null (not set yet) or exactly 64 lowercase hex characters.
    function ssjrTransferValidSalt(value) { return value == null || (value is string && value.matches('^[0-9a-f]{64}$')); }
    function ssjrTransferSeasonMatches(transferId, seasonNumber) {
      return seasonNumber is int
        && seasonNumber >= 1
        && seasonNumber <= 10
        && transferId == 'season_' + string(seasonNumber);
    }
    function ssjrTransferSetup(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data; }
    function ssjrTransferCareer(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/careerStart/authoritative).data; }
    function ssjrTransferPrerequisites(rivalryId, seasonNumber) {
      let setup = ssjrTransferSetup(rivalryId);
      let career = ssjrTransferCareer(rivalryId);
      return setup.revision == 6
        && setup.phase == 'SHOWDOWN_CONFIRMED'
        && setup.totalSeasons in [1,3,5,10]
        && seasonNumber >= 1
        && seasonNumber <= setup.totalSeasons
        && career.setupRevision == 6
        && career.totalSeasons == setup.totalSeasons
        && career.revision == 2
        && career.phase == 'CAREER_START_READY'
        && career.acknowledgedRoles is list
        && career.acknowledgedRoles.size() == 2
        && 'playerOne' in career.acknowledgedRoles
        && 'playerTwo' in career.acknowledgedRoles;
    }
    function ssjrTransferRoleListValid(value) {
      return value is list
        && value.size() <= 2
        && value.toSet().size() == value.size()
        && value.toSet().hasOnly(['playerOne','playerTwo']);
    }
    function ssjrTransferPublicExactKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','seasonNumber','runtimeRevision','coordinatorRole','phase','revision',
        'startedAt','endedAt','endRequestedRoles','guessLockedRoles','signingLockedRoles',
        'operationIds','operationTypes','operationHashes','baseRevisions','actorRoles',
        'activeSessionId','updatedAt','updatedByDeviceId'
      ]);
    }
    function ssjrTransferPublicShape(root, rivalryId, transferId) {
      let setup = ssjrTransferSetup(rivalryId);
      let historySize = root.operationIds.size();
      return ssjrTransferPublicExactKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedTransferChallenge'
        && root.rivalryId == rivalryId
        && root.seasonNumber is int
        && ssjrTransferSeasonMatches(transferId, root.seasonNumber)
        && ssjrTransferPrerequisites(rivalryId, root.seasonNumber)
        && root.runtimeRevision == '1.9.1-r8'
        && root.coordinatorRole == setup.coordinatorRole
        && (root.phase == 'WINDOW_OPEN' || root.phase == 'GUESS_ENTRY' || root.phase == 'SIGNING_ENTRY' || root.phase == 'COMPLETED')
        && root.revision is int
        && root.revision >= 1
        && root.revision <= 7
        && root.startedAt is timestamp
        && (root.endedAt == null || root.endedAt is timestamp)
        && ssjrTransferRoleListValid(root.endRequestedRoles)
        && ssjrTransferRoleListValid(root.guessLockedRoles)
        && ssjrTransferRoleListValid(root.signingLockedRoles)
        && root.operationIds is list
        && root.operationTypes is list
        && root.operationHashes is list
        && root.baseRevisions is list
        && root.actorRoles is list
        && historySize == root.revision
        && root.operationTypes.size() == historySize
        && root.operationHashes.size() == historySize
        && root.baseRevisions.size() == historySize
        && root.actorRoles.size() == historySize
        && root.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
    }
    function ssjrTransferPublicPrefixPreserved(before, after) {
      let i = before.revision;
      return after.operationIds == before.operationIds.concat([after.operationIds[i]])
        && after.operationTypes == before.operationTypes.concat([after.operationTypes[i]])
        && after.operationHashes == before.operationHashes.concat([after.operationHashes[i]])
        && after.baseRevisions == before.baseRevisions.concat([after.baseRevisions[i]])
        && after.actorRoles == before.actorRoles.concat([after.actorRoles[i]]);
    }
    function ssjrTransferNewOperationValid(before, after) {
      let i = before.revision;
      return ssjrTransferValidOperationId(after.operationIds[i])
        && !(after.operationIds[i] in before.operationIds)
        && ssjrTransferValidHash(after.operationHashes[i])
        && after.baseRevisions[i] == before.revision
        && after.actorRoles[i] == ssjrActorRole(after.rivalryId);
    }
    function ssjrTransferOwnRoleAfter(rivalryId, transferId) {
      let role = ssjrActorRole(rivalryId);
      return getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)/roles/$(role)).data;
    }
    function ssjrTransferPrivatePayloadLinked(rivalryId, transferId, after, operationType) {
      let role = ssjrActorRole(rivalryId);
      let own = ssjrTransferOwnRoleAfter(rivalryId, transferId);
      return own.managerRole == role
        && own.activeSessionId == after.activeSessionId
        && own.updatedByDeviceId == after.updatedByDeviceId
        && own.updatedAt == request.time
        && (
          (operationType == 'lock-guesses' && own.guessLockedAt == request.time && own.signingLockedAt == null)
          || (operationType == 'lock-signings' && own.signingLockedAt == request.time)
        );
    }
    function ssjrTransferEndRequestTransition(before, after, actorRole) {
      let priorSize = before.endRequestedRoles.size();
      return before.phase == 'WINDOW_OPEN'
        && priorSize <= 1
        && !(actorRole in before.endRequestedRoles)
        && after.endRequestedRoles == before.endRequestedRoles.concat([actorRole])
        && after.guessLockedRoles == before.guessLockedRoles
        && after.signingLockedRoles == before.signingLockedRoles
        && (
          (priorSize == 0 && after.phase == 'WINDOW_OPEN' && after.endedAt == null)
          || (priorSize == 1 && after.phase == 'GUESS_ENTRY' && after.endedAt == request.time)
        );
    }
    function ssjrTransferExpiryTransition(before, after) {
      return before.phase == 'WINDOW_OPEN'
        && request.time >= before.startedAt + duration.value(15, 'm')
        && after.phase == 'GUESS_ENTRY'
        && after.endedAt == request.time
        && after.endRequestedRoles == before.endRequestedRoles
        && after.guessLockedRoles == before.guessLockedRoles
        && after.signingLockedRoles == before.signingLockedRoles;
    }
    function ssjrTransferGuessLockTransition(rivalryId, transferId, before, after, actorRole) {
      let priorSize = before.guessLockedRoles.size();
      return before.phase == 'GUESS_ENTRY'
        && priorSize <= 1
        && !(actorRole in before.guessLockedRoles)
        && after.guessLockedRoles == before.guessLockedRoles.concat([actorRole])
        && after.endRequestedRoles == before.endRequestedRoles
        && after.signingLockedRoles == before.signingLockedRoles
        && after.endedAt == before.endedAt
        && ((priorSize == 0 && after.phase == 'GUESS_ENTRY') || (priorSize == 1 && after.phase == 'SIGNING_ENTRY'))
        && ssjrTransferPrivatePayloadLinked(rivalryId, transferId, after, 'lock-guesses');
    }
    function ssjrTransferSigningLockTransition(rivalryId, transferId, before, after, actorRole) {
      let priorSize = before.signingLockedRoles.size();
      return before.phase == 'SIGNING_ENTRY'
        && priorSize <= 1
        && actorRole in before.guessLockedRoles
        && !(actorRole in before.signingLockedRoles)
        && after.signingLockedRoles == before.signingLockedRoles.concat([actorRole])
        && after.endRequestedRoles == before.endRequestedRoles
        && after.guessLockedRoles == before.guessLockedRoles
        && after.endedAt == before.endedAt
        && ((priorSize == 0 && after.phase == 'SIGNING_ENTRY') || (priorSize == 1 && after.phase == 'COMPLETED'))
        && ssjrTransferPrivatePayloadLinked(rivalryId, transferId, after, 'lock-signings');
    }
    function ssjrTransferValidCreate(rivalryId, transferId) {
      let after = request.resource.data;
      return after.phase == 'WINDOW_OPEN'
        && ssjrTransferPublicShape(after, rivalryId, transferId)
        && after.revision == 1
        && after.phase == 'WINDOW_OPEN'
        && after.startedAt == request.time
        && after.endedAt == null
        && after.endRequestedRoles.size() == 0
        && after.guessLockedRoles.size() == 0
        && after.signingLockedRoles.size() == 0
        && ssjrValidOperationId(after.operationIds[0]) == false
        && ssjrTransferValidOperationId(after.operationIds[0])
        && after.operationTypes[0] == 'start-window'
        && ssjrTransferValidHash(after.operationHashes[0])
        && after.baseRevisions[0] == 0
        && after.actorRoles[0] == after.coordinatorRole
        && after.coordinatorRole == ssjrActorRole(rivalryId);
    }
    // R87 roulette marks: a pre-window mark document (phase NOT_STARTED) is never a ledger to update (START from it is
    // ssjrTransferStartAfterSpins). The phase is tested before the ledger function's let bindings run: measured on the emulator,
    // START from a two-mark document was refused while those bindings ran against it.
    function ssjrTransferValidUpdate(rivalryId, transferId) {
      return resource.data.phase != 'NOT_STARTED' && ssjrTransferValidLedgerUpdate(rivalryId, transferId);
    }
    // Updates preserve the secured creation envelope and validate only the append-only transition delta.
    function ssjrTransferValidLedgerUpdate(rivalryId, transferId) {
      let before = resource.data;
      let after = request.resource.data;
      let i = before.revision;
      let type = after.operationTypes[i];
      let role = ssjrActorRole(rivalryId);
      return ssjrTransferPublicExactKeys(after)
        && after.schemaVersion == before.schemaVersion
        && after.objectType == before.objectType
        && after.rivalryId == before.rivalryId
        && after.seasonNumber == before.seasonNumber
        && after.runtimeRevision == before.runtimeRevision
        && after.coordinatorRole == before.coordinatorRole
        && after.startedAt == before.startedAt
        && after.revision == before.revision + 1
        && after.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)
        && ssjrTransferPublicPrefixPreserved(before, after)
        && ssjrTransferNewOperationValid(before, after)
        && (
          (type == 'request-end-window' && ssjrTransferEndRequestTransition(before, after, role))
          || (type == 'advance-expired-window' && ssjrTransferExpiryTransition(before, after))
          || (type == 'lock-guesses' && ssjrTransferGuessLockTransition(rivalryId, transferId, before, after, role))
          || (type == 'lock-signings' && ssjrTransferSigningLockTransition(rivalryId, transferId, before, after, role))
        );
    }
    function ssjrTransferGuessRowValid(value) {
      return value is map
        && value.keys().hasOnly(['slot','type','valueId'])
        && value.slot is int
        && value.slot >= 1
        && value.slot <= 3
        && (value.type == 'league' || value.type == 'nationality')
        && ssjrTransferValidOptionId(value.valueId)
        && ((value.type == 'league' && ssjrTransferCatalogLeagueId(value.valueId))
          || (value.type == 'nationality' && ssjrTransferCatalogNationalityId(value.valueId)));
    }
    function ssjrTransferSigningRowValid(value) {
      return value is map
        && value.keys().hasOnly(['slot','name','leagueId','nationalityId','overall','position'])
        && (!('overall' in value) || (value.overall is int && value.overall >= 30 && value.overall <= 99))
        && (!('position' in value) || value.position in ['GK','RB','RWB','CB','LB','LWB','CDM','CM','CAM','RM','LM','RW','LW','CF','ST'])
        && value.slot is int
        && value.slot >= 1
        && value.slot <= 3
        && ssjrTransferValidSigningName(value.name)
        && ssjrTransferValidOptionId(value.leagueId)
        && ssjrTransferCatalogLeagueId(value.leagueId)
        && ssjrTransferValidOptionId(value.nationalityId)
        && ssjrTransferCatalogNationalityId(value.nationalityId);
    }
    function ssjrTransferGuessesValid(value) {
      return value is list
        && value.size() <= 3
        && (value.size() < 1 || ssjrTransferGuessRowValid(value[0]))
        && (value.size() < 2 || (ssjrTransferGuessRowValid(value[1]) && value[1].slot != value[0].slot))
        && (value.size() < 3 || (ssjrTransferGuessRowValid(value[2]) && value[2].slot != value[0].slot && value[2].slot != value[1].slot));
    }
    function ssjrTransferSigningsValid(value) {
      return value is list
        && value.size() <= 3
        && (value.size() < 1 || ssjrTransferSigningRowValid(value[0]))
        && (value.size() < 2 || (ssjrTransferSigningRowValid(value[1]) && value[1].slot != value[0].slot))
        && (value.size() < 3 || (ssjrTransferSigningRowValid(value[2]) && value[2].slot != value[0].slot && value[2].slot != value[1].slot));
    }
    // JOB-1051: a role document written by r66 has no salt keys; a salted one has both (each null or 64 lowercase hex). Never only one.
    function ssjrTransferPrivateExactKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','seasonNumber','managerRole','guesses','signings',
        'guessLockedAt','signingLockedAt','activeSessionId','updatedAt','updatedByDeviceId',
        'guessSalt','signingSalt'
      ])
        && (root.keys().hasAll(['guessSalt','signingSalt']) || !root.keys().hasAny(['guessSalt','signingSalt']));
    }
    function ssjrTransferPrivateBase(root, rivalryId, transferId, managerRole) {
      return ssjrTransferPrivateExactKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedTransferChallengeRole'
        && root.rivalryId == rivalryId
        && ssjrTransferSeasonMatches(transferId, root.seasonNumber)
        && root.managerRole == managerRole
        && managerRole == ssjrActorRole(rivalryId)
        && ssjrTransferGuessesValid(root.guesses)
        && (root.signings == null || ssjrTransferSigningsValid(root.signings))
        && root.guessLockedAt is timestamp
        && (root.signingLockedAt == null || root.signingLockedAt is timestamp)
        && root.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
    }
    function ssjrTransferPublicAfter(rivalryId, transferId) {
      return getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)).data;
    }
    function ssjrTransferPrivateCreateValid(rivalryId, transferId, managerRole) {
      let after = request.resource.data;
      let public = ssjrTransferPublicAfter(rivalryId, transferId);
      let i = public.revision - 1;
      return ssjrTransferPrivateBase(after, rivalryId, transferId, managerRole)
        && after.signings == null
        && after.signingLockedAt == null
        && ssjrTransferValidSalt(after.get('guessSalt', null))
        && after.get('signingSalt', null) == null
        && after.guessLockedAt == request.time
        && public.operationTypes[i] == 'lock-guesses'
        && public.actorRoles[i] == managerRole
        && managerRole in public.guessLockedRoles
        && public.activeSessionId == after.activeSessionId
        && public.updatedByDeviceId == after.updatedByDeviceId
        && public.updatedAt == request.time;
    }
    function ssjrTransferPrivateUpdateValid(rivalryId, transferId, managerRole) {
      let before = resource.data;
      let after = request.resource.data;
      let public = ssjrTransferPublicAfter(rivalryId, transferId);
      let i = public.revision - 1;
      return ssjrTransferPrivateExactKeys(after)
        && after.schemaVersion == before.schemaVersion
        && after.objectType == before.objectType
        && after.rivalryId == before.rivalryId
        && after.seasonNumber == before.seasonNumber
        && after.managerRole == before.managerRole
        && managerRole == before.managerRole
        && managerRole == ssjrActorRole(rivalryId)
        && after.guesses == before.guesses
        && after.guessLockedAt == before.guessLockedAt
        && after.get('guessSalt', null) == before.get('guessSalt', null)
        && before.get('signingSalt', null) == null
        && ssjrTransferValidSalt(after.get('signingSalt', null))
        && before.signings == null
        && before.signingLockedAt == null
        && ssjrTransferSigningsValid(after.signings)
        && after.signingLockedAt == request.time
        && after.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)
        && public.operationTypes[i] == 'lock-signings'
        && public.actorRoles[i] == managerRole
        && managerRole in public.signingLockedRoles
        && public.activeSessionId == after.activeSessionId
        && public.updatedByDeviceId == after.updatedByDeviceId
        && public.updatedAt == request.time;
    }
    // R87 roulette marks (Nik 2026-10-31, red team RT5-FLOW-02): the shared window waits until both managers have spun this season's
    // Russian Roster Roulette. Before the window opens, transferChallenges/season_N may hold a small pre-window document whose
    // spins map has a true entry per manager who has spun. Each member writes only his own entry (one merge write, one lookup: the
    // rivalry, like the reads meter), never removes or changes the partner's, never removes his own, and never once the ledger has
    // started. START from that document needs both entries and writes the normal ledger in its place (exact keys as before).
    // A season with no marks (a Showdown from before the roulette) still starts by the create rule. Every branch first tests the
    // phase of the stored or new document, so a normal ledger write never evaluates these and looks up nothing more.
    function ssjrTransferSpinShape(root, rivalryId, transferId) {
      return root.keys().hasAll(['schemaVersion','objectType','rivalryId','seasonNumber','phase','spins','updatedAt'])
        && root.keys().hasOnly(['schemaVersion','objectType','rivalryId','seasonNumber','phase','spins','updatedAt'])
        && root.schemaVersion == 1
        && root.objectType == 'sharedTransferChallenge'
        && root.rivalryId == rivalryId
        && ssjrTransferSeasonMatches(transferId, root.seasonNumber)
        && root.phase == 'NOT_STARTED'
        && root.spins is map
        && root.spins.keys().hasOnly(['playerOne','playerTwo'])
        && root.updatedAt == request.time;
    }
    function ssjrTransferSpinCreate(rivalryId, transferId) {
      let after = request.resource.data;
      return after.phase == 'NOT_STARTED'
        && ssjrTransferSpinShape(after, rivalryId, transferId)
        && ssjrEntitled(rivalryId)
        && after.spins.keys().hasOnly([ssjrActorRole(rivalryId)])
        && after.spins[ssjrActorRole(rivalryId)] == true;
    }
    function ssjrTransferSpinUpdate(rivalryId, transferId) {
      let before = resource.data;
      let after = request.resource.data;
      return before.phase == 'NOT_STARTED'
        && after.phase == 'NOT_STARTED'
        && ssjrTransferSpinShape(after, rivalryId, transferId)
        && after.seasonNumber == before.seasonNumber
        && ssjrEntitled(rivalryId)
        && after.spins.diff(before.spins).affectedKeys().hasOnly([ssjrActorRole(rivalryId)])
        && after.spins[ssjrActorRole(rivalryId)] == true;
    }
    function ssjrTransferStartAfterSpins(rivalryId, transferId) {
      let before = resource.data;
      return before.phase == 'NOT_STARTED'
        && before.spins.get('playerOne', false) == true
        && before.spins.get('playerTwo', false) == true
        && ssjrTransferValidCreate(rivalryId, transferId);
    }
    function ssjrTransferPrivateReadable(rivalryId, transferId, managerRole) {
      let public = get(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)).data;
      return ssjrEntitled(rivalryId)
        && (managerRole == ssjrActorRole(rivalryId) || public.phase == 'COMPLETED');
    }
// SSJR_TRANSFER_CHALLENGE_FUNCTIONS_END

// SSJR_TRANSFER_CHALLENGE_MATCH_BEGIN
      match /transferChallenges/{transferId} {
        allow get: if ssjrEntitled(rivalryId);
        allow list, delete: if false;
        allow create: if ssjrTransferValidCreate(rivalryId, transferId);
        allow update: if ssjrTransferValidUpdate(rivalryId, transferId);
        // R87 roulette marks (RT5-FLOW-02): a member's own pre-window mark, and START from a document holding both marks.
        allow create: if ssjrTransferSpinCreate(rivalryId, transferId);
        allow update: if ssjrTransferSpinUpdate(rivalryId, transferId) || ssjrTransferStartAfterSpins(rivalryId, transferId);

        match /roles/{managerRole} {
          allow get: if ssjrTransferPrivateReadable(rivalryId, transferId, managerRole);
          allow list, delete: if false;
          allow create: if ssjrTransferPrivateCreateValid(rivalryId, transferId, managerRole);
          allow update: if ssjrTransferPrivateUpdateValid(rivalryId, transferId, managerRole);
        }
      }
// SSJR_TRANSFER_CHALLENGE_MATCH_END

```

## FILE: firestore.season-results-production.fragment.rules
```text
// SSJR_SEASON_RESULTS_FUNCTIONS_BEGIN
    function ssjrResultsValidOperationId(value) { return value is string && value.matches('^season_result_op_[0-9a-f]{32}$'); }
    function ssjrResultsValidHash(value) { return value is string && value.matches('^sha256:[0-9a-f]{64}$'); }
    function ssjrResultsValidRole(value) { return value == 'playerOne' || value == 'playerTwo'; }
    function ssjrResultsSeasonMatches(seasonId, seasonNumber) {
      return seasonNumber is int
        && seasonNumber >= 1
        && seasonNumber <= 10
        && seasonId == 'season_' + string(seasonNumber);
    }
    function ssjrResultsSetup(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data; }
    function ssjrResultsProjectedTeamCount(rivalryId) { return getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/leagueProjection).data.teamCount; }
    function ssjrResultsCareer(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/careerStart/authoritative).data; }
    function ssjrResultsTransfer(rivalryId, seasonId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(seasonId)).data; }
    function ssjrResultsPrerequisites(rivalryId, seasonId, seasonNumber) {
      let setup = ssjrResultsSetup(rivalryId);
      let career = ssjrResultsCareer(rivalryId);
      let transfer = ssjrResultsTransfer(rivalryId, seasonId);
      return setup.schemaVersion == 1
        && setup.objectType == 'sharedSetupLedger'
        && setup.rivalryId == rivalryId
        && setup.revision == 6
        && setup.phase == 'SHOWDOWN_CONFIRMED'
        && (setup.coordinatorRole == 'playerOne' || setup.coordinatorRole == 'playerTwo')
        && setup.operationIds is list
        && setup.operationIds.size() == 6
        && setup.totalSeasons in [1,3,5,10]
        && seasonNumber >= 1
        && seasonNumber <= setup.totalSeasons
        && career.schemaVersion == 1
        && career.objectType == 'sharedCareerStart'
        && career.rivalryId == rivalryId
        && career.setupRevision == 6
        && career.setupOperationIds is list
        && career.setupOperationIds == setup.operationIds
        && career.totalSeasons == setup.totalSeasons
        && career.revision == 2
        && career.phase == 'CAREER_START_READY'
        && career.acknowledgedRoles is list
        && career.acknowledgedRoles.size() == 2
        && 'playerOne' in career.acknowledgedRoles
        && 'playerTwo' in career.acknowledgedRoles
        && transfer.schemaVersion == 1
        && transfer.objectType == 'sharedTransferChallenge'
        && transfer.rivalryId == rivalryId
        && transfer.seasonNumber == seasonNumber
        && transfer.runtimeRevision == '1.9.1-r8'
        && transfer.coordinatorRole == setup.coordinatorRole
        && transfer.phase == 'COMPLETED'
        && (transfer.revision == 6 || transfer.revision == 7)
        && transfer.guessLockedRoles is list
        && transfer.guessLockedRoles.size() == 2
        && 'playerOne' in transfer.guessLockedRoles
        && 'playerTwo' in transfer.guessLockedRoles
        && transfer.signingLockedRoles is list
        && transfer.signingLockedRoles.size() == 2
        && 'playerOne' in transfer.signingLockedRoles
        && 'playerTwo' in transfer.signingLockedRoles;
    }
    function ssjrResultsRoleListValid(value) {
      return value is list
        && value.size() >= 1
        && value.size() <= 2
        && value.toSet().size() == value.size()
        && value.toSet().hasOnly(['playerOne','playerTwo']);
    }
    function ssjrResultsPublicExactKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','seasonNumber','runtimeRevision','phase','revision','teamCount','publishedRoles',
        'operationIds','operationHashes','baseRevisions','actorRoles','activeSessionId','updatedAt','updatedByDeviceId'
      ]);
    }
    function ssjrResultsPublicShape(root, rivalryId, seasonId) {
      let n = root.revision;
      return ssjrResultsPublicExactKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedSeasonResults'
        && root.rivalryId == rivalryId
        && root.seasonNumber is int
        && ssjrResultsSeasonMatches(seasonId, root.seasonNumber)
        && root.teamCount == ssjrResultsProjectedTeamCount(rivalryId)
        && ssjrEntitled(rivalryId)
        && root.runtimeRevision == '1.9.1-r9'
        && (root.phase == 'COLLECTING' || root.phase == 'RESULTS_READY')
        && root.revision is int
        && root.revision >= 1
        && root.revision <= 2
        && ssjrResultsRoleListValid(root.publishedRoles)
        && root.publishedRoles.size() == n
        && root.operationIds is list
        && root.operationHashes is list
        && root.baseRevisions is list
        && root.actorRoles is list
        && root.operationIds.size() == n
        && root.operationHashes.size() == n
        && root.baseRevisions.size() == n
        && root.actorRoles.size() == n
        && root.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId)
        && ((root.phase == 'COLLECTING' && n == 1) || (root.phase == 'RESULTS_READY' && n == 2));
    }
    function ssjrResultsPublicUpdateShape(root, rivalryId, seasonId) {
      return ssjrResultsPublicExactKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedSeasonResults'
        && root.rivalryId == rivalryId
        && root.seasonNumber is int
        && ssjrResultsSeasonMatches(seasonId, root.seasonNumber)
        && root.runtimeRevision == '1.9.1-r9'
        && root.teamCount is int
        && root.teamCount in [18,20]
        && root.teamCount == resource.data.teamCount
        && root.teamCount == ssjrResultsProjectedTeamCount(rivalryId)
        && root.phase == 'RESULTS_READY'
        && root.revision == 2
        && ssjrResultsRoleListValid(root.publishedRoles)
        && root.publishedRoles.size() == 2
        && root.operationIds is list
        && root.operationIds.size() == 2
        && root.operationHashes is list
        && root.operationHashes.size() == 2
        && root.baseRevisions is list
        && root.baseRevisions.size() == 2
        && root.actorRoles is list
        && root.actorRoles.size() == 2
        && root.updatedAt == request.time;
    }
    function ssjrResultsPublicPrefixPreserved(before, after) {
      return after.publishedRoles[0] == before.publishedRoles[0]
        && after.operationIds[0] == before.operationIds[0]
        && after.operationHashes[0] == before.operationHashes[0]
        && after.baseRevisions[0] == before.baseRevisions[0]
        && after.actorRoles[0] == before.actorRoles[0];
    }
    function ssjrResultsPrivateAfter(rivalryId, seasonId, managerRole) {
      return getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)/roles/$(managerRole)).data;
    }
    // r80 Europa League: 'europaLeague' is present only when that manager won the EL, and then it is exactly true
    // (false is refused, so there is one encoding per fact and old 7-key results are unchanged). One manager's season
    // never has CL and EL both true. Nothing compares the two managers' results: both may win the same trophy.
    function ssjrResultsResultShape(value, teamCount) {
      return teamCount >= 2
        && value is map
        && value.keys().hasOnly(['leaguePosition','leaguePoints','leagueGoals','domesticCup','championsLeague','topScorer','topAssist','europaLeague'])
        && value.leaguePosition is int
        && value.leaguePosition >= 1
        && value.leaguePosition <= teamCount
        && value.leaguePoints is int
        && value.leaguePoints >= 0
        && value.leaguePoints <= (teamCount - 1) * 6
        && value.leagueGoals is int
        && value.leagueGoals >= 0
        && value.leagueGoals <= 300
        && value.domesticCup is bool
        && value.championsLeague is bool
        && value.topScorer is bool
        && value.topAssist is bool
        && (!('europaLeague' in value) || (value.europaLeague == true && value.championsLeague == false));
    }
    function ssjrResultsPrivateExactKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','seasonNumber','managerRole','result','operationId','commandHash',
        'activeSessionId','publishedAt','updatedByDeviceId'
      ]);
    }
    function ssjrResultsPrivateBase(root, rivalryId, seasonId, managerRole, teamCount) {
      return ssjrResultsPrivateExactKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedSeasonResultRole'
        && root.rivalryId == rivalryId
        && root.seasonNumber is int
        && ssjrResultsSeasonMatches(seasonId, root.seasonNumber)
        && root.managerRole == managerRole
        && managerRole == ssjrActorRole(rivalryId)
        && ssjrResultsResultShape(root.result, teamCount)
        && ssjrResultsValidOperationId(root.operationId)
        && ssjrResultsValidHash(root.commandHash)
        && root.publishedAt == request.time
        && ssjrEntitled(rivalryId);
    }
    function ssjrResultsPrivateLinked(rivalryId, seasonId, publicAfter, managerRole) {
      let own = ssjrResultsPrivateAfter(rivalryId, seasonId, managerRole);
      let i = publicAfter.revision - 1;
      return own.operationId == publicAfter.operationIds[i]
        && publicAfter.actorRoles[i] == managerRole
        && publicAfter.publishedRoles[i] == managerRole
        && own.activeSessionId == publicAfter.activeSessionId
        && own.updatedByDeviceId == publicAfter.updatedByDeviceId
        && own.publishedAt == request.time;
    }
    function ssjrResultsValidCreate(rivalryId, seasonId) {
      let after = request.resource.data;
      let role = ssjrActorRole(rivalryId);
      return ssjrResultsPublicShape(after, rivalryId, seasonId)
        && after.revision == 1
        && ssjrResultsValidOperationId(after.operationIds[0])
        && ssjrResultsValidHash(after.operationHashes[0])
        && after.baseRevisions[0] == 0
        && ssjrResultsPrivateLinked(rivalryId, seasonId, after, role);
    }
    // Audit R84 F01 (r85): the second publish (revision 1 -> 2) now carries the same write authority as the first. Before,
    // it was bound only to rivalry membership (through the role-private document's ssjrEntitled).
    function ssjrResultsValidUpdate(rivalryId, seasonId) {
      let before = resource.data;
      let after = request.resource.data;
      let role = ssjrActorRole(rivalryId);
      let i = before.revision;
      return ssjrResultsPublicUpdateShape(after, rivalryId, seasonId)
        && before.revision == 1
        && ssjrResultsPublicPrefixPreserved(before, after)
        && ssjrResultsPrivateLinked(rivalryId, seasonId, after, role)
        && ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId);
    }
    function ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole) {
      let after = request.resource.data;
      let public = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)).data;
      let i = public.revision - 1;
      return ssjrResultsPrivateBase(after, rivalryId, seasonId, managerRole, public.teamCount)
        && public.schemaVersion == 1
        && public.objectType == 'sharedSeasonResults'
        && public.runtimeRevision == '1.9.1-r9'
        && public.seasonNumber == after.seasonNumber
        && public.operationIds[i] == after.operationId
        && (public.revision == 1 || public.operationIds[i] != public.operationIds[0])
        && ssjrResultsValidHash(public.operationHashes[i])
        && public.baseRevisions[i] == public.revision - 1
        && public.actorRoles[i] == managerRole
        && public.publishedRoles[i] == managerRole
        && public.activeSessionId == after.activeSessionId
        && public.updatedByDeviceId == after.updatedByDeviceId
        && public.updatedAt == request.time;
    }
    function ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole) {
      let public = get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)).data;
      return ssjrEntitled(rivalryId)
        && (managerRole == ssjrActorRole(rivalryId) || public.phase == 'RESULTS_READY');
    }
// SSJR_SEASON_RESULTS_FUNCTIONS_END

// SSJR_SEASON_RESULTS_MATCH_BEGIN
      match /seasonResults/{seasonId} {
        allow get: if ssjrEntitled(rivalryId);
        allow list, delete: if false;
        allow create: if ssjrResultsValidCreate(rivalryId, seasonId);
        allow update: if ssjrResultsValidUpdate(rivalryId, seasonId);

        match /roles/{managerRole} {
          allow get: if ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole);
          allow list, update, delete: if false;
          allow create: if ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole);
        }
      }
// SSJR_SEASON_RESULTS_MATCH_END

```

## FILE: firestore.season-commit-production.fragment.rules
```text
// SSJR_SEASON_COMMIT_FUNCTIONS_BEGIN
    function ssjrCommitValidOperationId(value) { return value is string && value.matches('^season_commit_op_[0-9a-f]{32}$'); }
    function ssjrCommitValidHash(value) { return value is string && value.matches('^sha256:[0-9a-f]{64}$'); }
    function ssjrCommitValidRole(value) { return value == 'playerOne' || value == 'playerTwo'; }
    function ssjrCommitSeasonMatches(seasonId, seasonNumber) {
      return seasonNumber is int
        && seasonNumber >= 1
        && seasonNumber <= 10
        && seasonId == 'season_' + string(seasonNumber);
    }
    function ssjrCommitSetup(rivalryId) {
      return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data;
    }
    function ssjrCommitPublicResults(rivalryId, seasonId) {
      return get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)).data;
    }
    function ssjrCommitPrivateResult(rivalryId, seasonId, managerRole) {
      return get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)/roles/$(managerRole)).data;
    }
    // r80 Europa League: 'europaLeague' is present only when that manager won the EL, and then it is exactly true
    // (false is refused, so there is one encoding per fact and old 7-key results are unchanged). One manager's season
    // never has CL and EL both true. Nothing compares the two managers' results: both may win the same trophy.
    function ssjrCommitResultShape(value, teamCount) {
      return teamCount >= 2
        && value is map
        && value.keys().hasOnly(['leaguePosition','leaguePoints','leagueGoals','domesticCup','championsLeague','topScorer','topAssist','europaLeague'])
        && value.leaguePosition is int
        && value.leaguePosition >= 1
        && value.leaguePosition <= teamCount
        && value.leaguePoints is int
        && value.leaguePoints >= 0
        && value.leaguePoints <= (teamCount - 1) * 6
        && value.leagueGoals is int
        && value.leagueGoals >= 0
        && value.leagueGoals <= 300
        && value.domesticCup is bool
        && value.championsLeague is bool
        && value.topScorer is bool
        && value.topAssist is bool
        && (!('europaLeague' in value) || (value.europaLeague == true && value.championsLeague == false));
    }
    function ssjrCommitExactKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','seasonNumber','runtimeRevision','phase','revision','resultsRevision','results',
        'acknowledgedRoles','operationIds','operationHashes','baseRevisions','actorRoles','activeSessionId','updatedAt','updatedByDeviceId'
      ]);
    }
    // Audit R84 F02 (r85): create and acknowledge both require the shared actor write authority (rivalry live and active
    // with the actor as a member, the named Session in this rivalry, state 'active' with both members, the acting account
    // active, the acting device registered to that account and active). It replaces ssjrEntitled here (same rivalry
    // document) to stay under the 1,000-expression ceiling. A Session still 'active' past its old expiresAt stays allowed:
    // ten-season play keeps one ACTIVE Session. The never-called ssjrCommitShape and its three helpers were removed.
    function ssjrCommitValidCreate(rivalryId, seasonId) {
      let after = request.resource.data;
      let setup = ssjrCommitSetup(rivalryId);
      let public = ssjrCommitPublicResults(rivalryId, seasonId);
      let p1 = ssjrCommitPrivateResult(rivalryId, seasonId, 'playerOne');
      let p2 = ssjrCommitPrivateResult(rivalryId, seasonId, 'playerTwo');
      let role = ssjrActorRole(rivalryId);
      return ssjrCommitExactKeys(after)
        && after.schemaVersion == 1
        && after.objectType == 'sharedSeasonCommit'
        && after.rivalryId == rivalryId
        && after.seasonNumber is int
        && ssjrCommitSeasonMatches(seasonId, after.seasonNumber)
        && setup.schemaVersion == 1
        && setup.objectType == 'sharedSetupLedger'
        && setup.rivalryId == rivalryId
        && setup.revision == 6
        && setup.phase == 'SHOWDOWN_CONFIRMED'
        && after.seasonNumber <= setup.totalSeasons
        && public.schemaVersion == 1
        && public.objectType == 'sharedSeasonResults'
        && public.rivalryId == rivalryId
        && public.seasonNumber == after.seasonNumber
        && public.runtimeRevision == '1.9.1-r9'
        && public.phase == 'RESULTS_READY'
        && public.revision == 2
        && public.teamCount in [18,20]
        && after.runtimeRevision == '1.9.1-r10'
        && after.revision == 1
        && after.phase == 'COMMITTED'
        && after.resultsRevision == 2
        && after.results is map
        && after.results.keys().hasOnly(['playerOne','playerTwo'])
        && ssjrCommitResultShape(after.results.playerOne, public.teamCount)
        && ssjrCommitResultShape(after.results.playerTwo, public.teamCount)
        && after.results.playerOne == p1.result
        && after.results.playerTwo == p2.result
        && after.acknowledgedRoles is list
        && after.acknowledgedRoles.size() == 0
        && after.operationIds is list
        && after.operationIds.size() == 1
        && after.operationHashes is list
        && after.operationHashes.size() == 1
        && after.baseRevisions is list
        && after.baseRevisions.size() == 1
        && after.actorRoles is list
        && after.actorRoles.size() == 1
        && ssjrCommitValidOperationId(after.operationIds[0])
        && ssjrCommitValidHash(after.operationHashes[0])
        && after.baseRevisions[0] == 0
        && role == setup.coordinatorRole
        && after.actorRoles[0] == role
        && after.updatedAt == request.time
        && ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId);
    }
    function ssjrCommitPrefixPreserved(before, after) {
      let i = before.revision;
      return after.operationIds == before.operationIds.concat([after.operationIds[i]])
        && after.operationHashes == before.operationHashes.concat([after.operationHashes[i]])
        && after.baseRevisions == before.baseRevisions.concat([after.baseRevisions[i]])
        && after.actorRoles == before.actorRoles.concat([after.actorRoles[i]])
        && after.acknowledgedRoles == before.acknowledgedRoles.concat([after.acknowledgedRoles[i - 1]]);
    }
    function ssjrCommitValidUpdate(rivalryId, seasonId) {
      let before = resource.data;
      let after = request.resource.data;
      let role = ssjrActorRole(rivalryId);
      let i = before.revision;
      return ssjrCommitExactKeys(after)
        && before.schemaVersion == 1
        && before.objectType == 'sharedSeasonCommit'
        && before.rivalryId == rivalryId
        && before.runtimeRevision == '1.9.1-r10'
        && before.phase == 'COMMITTED'
        && before.revision >= 1
        && before.revision <= 2
        && after.schemaVersion == 1
        && after.objectType == 'sharedSeasonCommit'
        && after.rivalryId == rivalryId
        && after.runtimeRevision == '1.9.1-r10'
        && after.seasonNumber == before.seasonNumber
        && ssjrCommitSeasonMatches(seasonId, after.seasonNumber)
        && after.resultsRevision == before.resultsRevision
        && after.results == before.results
        && after.revision == before.revision + 1
        && ((after.revision < 3 && after.phase == 'COMMITTED') || (after.revision == 3 && after.phase == 'ACKNOWLEDGED'))
        && after.operationIds is list
        && after.operationIds.size() == after.revision
        && after.operationHashes is list
        && after.operationHashes.size() == after.revision
        && after.baseRevisions is list
        && after.baseRevisions.size() == after.revision
        && after.actorRoles is list
        && after.actorRoles.size() == after.revision
        && after.acknowledgedRoles is list
        && after.acknowledgedRoles.size() == after.revision - 1
        && ssjrCommitPrefixPreserved(before, after)
        && !(role in before.acknowledgedRoles)
        && ssjrCommitValidOperationId(after.operationIds[i])
        && after.operationIds[i] != before.operationIds[0]
        && (i < 2 || after.operationIds[i] != before.operationIds[1])
        && ssjrCommitValidHash(after.operationHashes[i])
        && after.baseRevisions[i] == before.revision
        && after.actorRoles[i] == role
        && after.acknowledgedRoles[i - 1] == role
        && after.acknowledgedRoles.toSet().size() == after.acknowledgedRoles.size()
        && after.acknowledgedRoles.toSet().hasOnly(['playerOne','playerTwo'])
        && after.updatedAt == request.time
        && ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId);
    }
    // R87 shared reads meter (B2): each phone keeps ONE small document per rivalry, rivalries/{rid}/meters/{its role}, with the
    // Firebase reads it was billed today (documents + Rules lookups), written once a season when it sees the season commit
    // ACKNOWLEDGED; the partner phone reads it once, so both phones show the same "both phones" total and seasons left.
    // Members of the live paired rivalry only (one lookup: the rivalry, the same as every shared read), each phone writes only
    // its own role's document, exact keys, bounded whole numbers (at most three season costs), no list and no delete.
    // A phone on an older build never writes it; nothing else reads it.
    function ssjrMeterCount(value, max) { return value is int && value >= 0 && value <= max; }
    function ssjrMeterCost(costs, index) { return costs.size() <= index || (costs[index] is int && costs[index] > 0 && costs[index] <= 100000); }
    function ssjrMeterValidWrite(rivalryId, managerRole) {
      let meter = request.resource.data;
      return ssjrEntitled(rivalryId)
        && managerRole in ['playerOne', 'playerTwo']
        && ssjrRivalryData(rivalryId).managerSlots[managerRole == 'playerOne' ? 0 : 1].accountId == request.auth.uid
        && meter.keys().hasAll(['schemaVersion','objectType','rivalryId','role','day','season','game','career','costs','updatedAt'])
        && meter.keys().hasOnly(['schemaVersion','objectType','rivalryId','role','day','season','game','career','costs','updatedAt'])
        && meter.schemaVersion == 1
        && meter.objectType == 'readsMeter'
        && meter.rivalryId == rivalryId
        && meter.role == managerRole
        && meter.day is string
        && meter.day.matches('^20[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$')
        && meter.season is int
        && meter.season >= 1
        && meter.season <= 10
        && ssjrMeterCount(meter.game, 1000000)
        && ssjrMeterCount(meter.career, 1000000)
        && meter.costs is list
        && meter.costs.size() <= 3
        && ssjrMeterCost(meter.costs, 0)
        && ssjrMeterCost(meter.costs, 1)
        && ssjrMeterCost(meter.costs, 2)
        && meter.updatedAt == request.time;
    }
// SSJR_SEASON_COMMIT_FUNCTIONS_END

// SSJR_SEASON_COMMIT_MATCH_BEGIN
      match /seasonCommits/{seasonId} {
        allow get: if ssjrEntitled(rivalryId);
        allow list, delete: if false;
        allow create: if ssjrCommitValidCreate(rivalryId, seasonId);
        allow update: if ssjrCommitValidUpdate(rivalryId, seasonId);
      }
      match /meters/{managerRole} {
        allow get: if ssjrEntitled(rivalryId);
        allow list, delete: if false;
        allow create, update: if ssjrMeterValidWrite(rivalryId, managerRole);
      }
// SSJR_SEASON_COMMIT_MATCH_END

```

## FILE: firestore.terminal-close-production.fragment.rules
```text
// SSJR_TERMINAL_CLOSE_FUNCTIONS_BEGIN
    function ssjrTerminalValidWinner(intent) {
      return (intent.managerTotals.playerOne > intent.managerTotals.playerTwo && intent.winner == 'playerOne')
        || (intent.managerTotals.playerTwo > intent.managerTotals.playerOne && intent.winner == 'playerTwo')
        || (intent.managerTotals.playerOne == intent.managerTotals.playerTwo && intent.winner == 'draw');
    }
    function ssjrTerminalValidIntent(rivalryId, intent) {
      return intent is map
        && intent.keys().hasOnly([
          'schemaVersion','runtimeRevision','phase','rivalryId','sessionId','totalSeasons','completedSeason',
          'managerTotals','winner','terminal','finalSeasonReconciled','nextSeason','extraSeasonAllowed',
          'rivalryConnectionState','sessionTargetState','terminalReadAllowed','canonicalStorageMutation','providerWriteRequired',
          'listPermissionRequired','billingRequired'
        ])
        && intent.schemaVersion == 1
        && intent.runtimeRevision == '1.9.1-r18'
        && intent.phase == 'TERMINAL_CLOSE_READY'
        && intent.rivalryId == rivalryId
        && validSessionId(intent.sessionId)
        && intent.totalSeasons in [1,3,5,10]
        && intent.completedSeason == intent.totalSeasons
        && intent.managerTotals is map
        && intent.managerTotals.keys().hasOnly(['playerOne','playerTwo'])
        && intent.managerTotals.playerOne is int
        && intent.managerTotals.playerOne >= 0
        && intent.managerTotals.playerTwo is int
        && intent.managerTotals.playerTwo >= 0
        && ssjrTerminalValidWinner(intent)
        && intent.terminal == true
        && intent.finalSeasonReconciled == true
        && intent.nextSeason == null
        && intent.extraSeasonAllowed == false
        && intent.rivalryConnectionState == 'closed'
        && intent.sessionTargetState == 'closed'
        && intent.terminalReadAllowed == true
        && intent.canonicalStorageMutation == false
        && intent.providerWriteRequired == true
        && intent.listPermissionRequired == false
        && intent.billingRequired == false;
    }
    // Canonical season score: CL +5, EL +3 (r80; the key exists only when won), league title +3, cup +1,
    // 100 points or 100 goals +1, top scorer or top assist +1. A season stays at most 11 (an EL season at most 9).
    function ssjrTerminalScore(result) {
      return (result.championsLeague == true ? 5 : 0)
        + (result.get('europaLeague', false) == true ? 3 : 0)
        + (result.leaguePosition == 1 ? 3 : 0)
        + (result.domesticCup == true ? 1 : 0)
        + ((result.leaguePoints >= 100 || result.leagueGoals >= 100) ? 1 : 0)
        + ((result.topScorer == true || result.topAssist == true) ? 1 : 0);
    }
    function ssjrTerminalCommitAccepted(root, rivalryId, seasonNumber) {
      return root is map
        && root.schemaVersion == 1
        && root.objectType == 'sharedSeasonCommit'
        && root.rivalryId == rivalryId
        && root.seasonNumber == seasonNumber
        && root.runtimeRevision == '1.9.1-r10'
        && root.phase == 'ACKNOWLEDGED'
        && root.revision == 3
        && root.results is map
        && root.results.keys().hasOnly(['playerOne','playerTwo'])
        && root.results.playerOne is map
        && root.results.playerTwo is map;
    }
    function ssjrTerminalSeasonId(seasonNumber) {
      return 'season_' + string(seasonNumber);
    }
    function ssjrTerminalProgressShape(progress) {
      return progress is map
        && progress.keys().hasOnly(['schemaVersion','runtimeRevision','totalSeasons','acceptedThroughSeason','managerTotals','closedSessionRevision'])
        && progress.schemaVersion == 1
        && progress.runtimeRevision == '1.9.1-r18'
        && progress.totalSeasons in [1,3,5,10]
        && progress.acceptedThroughSeason is int
        && progress.acceptedThroughSeason >= 1
        && progress.acceptedThroughSeason <= progress.totalSeasons
        && progress.managerTotals is map
        && progress.managerTotals.keys().hasOnly(['playerOne','playerTwo'])
        && progress.managerTotals.playerOne is int
        && progress.managerTotals.playerOne >= 0
        && progress.managerTotals.playerOne <= progress.acceptedThroughSeason * 11
        && progress.managerTotals.playerTwo is int
        && progress.managerTotals.playerTwo >= 0
        && progress.managerTotals.playerTwo <= progress.acceptedThroughSeason * 11
        && (progress.closedSessionRevision == null || (progress.closedSessionRevision is int && progress.closedSessionRevision >= 1));
    }
    function ssjrTerminalBaseRivalryPreserved(before, after) {
      return after.data.connectionStateBeforeDeletion == before.data.connectionStateBeforeDeletion
        && after.data.managerSlots == before.data.managerSlots
        && after.data.authorizedAccountIds == before.data.authorizedAccountIds
        && after.data.createdByAccountId == before.data.createdByAccountId
        && after.data.createdAt == before.data.createdAt;
    }
    function ssjrTerminalProgressActorValid(before, after) {
      return signedIn()
        && activeDevice(after.updatedByDeviceId)
        && after.updatedByAccountId == request.auth.uid
        && before.data.authorizedAccountIds is list
        && before.data.authorizedAccountIds.size() == 2
        && before.data.authorizedAccountIds[0] != before.data.authorizedAccountIds[1]
        && request.auth.uid in before.data.authorizedAccountIds;
    }
    function ssjrTerminalInitialProgress(rivalryId, before, after) {
      let progress = after.data.terminalProgress;
      let setup = get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data;
      let commit = get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/season_1).data;
      return ssjrTerminalProgressShape(progress)
        && progress.acceptedThroughSeason == 1
        && progress.closedSessionRevision == null
        && setup.schemaVersion == 1
        && setup.objectType == 'sharedSetupLedger'
        && setup.rivalryId == rivalryId
        && setup.revision == 6
        && setup.phase == 'SHOWDOWN_CONFIRMED'
        && setup.totalSeasons == progress.totalSeasons
        && ssjrTerminalCommitAccepted(commit, rivalryId, 1)
        && progress.managerTotals.playerOne == ssjrTerminalScore(commit.results.playerOne)
        && progress.managerTotals.playerTwo == ssjrTerminalScore(commit.results.playerTwo);
    }
    function ssjrTerminalAdvanceProgress(rivalryId, before, after) {
      let prior = before.data.terminalProgress;
      let progress = after.data.terminalProgress;
      let nextSeason = prior.acceptedThroughSeason + 1;
      let seasonId = ssjrTerminalSeasonId(nextSeason);
      let commit = get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/$(seasonId)).data;
      return ssjrTerminalProgressShape(prior)
        && ssjrTerminalProgressShape(progress)
        && prior.closedSessionRevision == null
        && progress.closedSessionRevision == null
        && progress.totalSeasons == prior.totalSeasons
        && nextSeason <= prior.totalSeasons
        && progress.acceptedThroughSeason == nextSeason
        && ssjrTerminalCommitAccepted(commit, rivalryId, nextSeason)
        && progress.managerTotals.playerOne == prior.managerTotals.playerOne + ssjrTerminalScore(commit.results.playerOne)
        && progress.managerTotals.playerTwo == prior.managerTotals.playerTwo + ssjrTerminalScore(commit.results.playerTwo);
    }
    // Stale-write gate (both managers save the same Terminal Close step at once). After the cheap checks that every
    // other write path already fails on, the CAS revision step is the condition of a ternary: a write built on a
    // revision the document already left is refused right there, and an evaluation pass that cannot read the stored
    // document stops there too instead of running the whole check into the 1,000-expression limit. The step stays
    // required inside ssjrTerminalFinalEnvelopeCas, so no outcome changes; only the refusal comes sooner.
    function ssjrTerminalValidProgressUpdate(rivalryId) {
      let before = resource.data;
      let after = request.resource.data;
      return rivalryId.matches('^pair_[0-9a-f]{64}$')
        && before.data.connectionState == 'active'
        && after.data.connectionState == 'active'
        && ((after.revision == before.revision + 1) ? (ssjrTerminalFinalEnvelopeCas(before, after, 'rivalry', rivalryId)
        && after.data.diff(before.data).affectedKeys().hasOnly(['terminalProgress'])
        && ssjrTerminalProgressActorValid(before, after)
        && (
          (!('terminalProgress' in before.data) && ssjrTerminalInitialProgress(rivalryId, before, after))
          || ('terminalProgress' in before.data && ssjrTerminalAdvanceProgress(rivalryId, before, after))
        )) : false);
    }
    function ssjrTerminalFinalEnvelopeCas(before, after, objectType, objectId) {
      return before.objectType == objectType
        && before.objectId == objectId
        && before.lifecycleState == 'live'
        && after.schemaVersion == before.schemaVersion
        && after.objectType == objectType
        && after.objectId == objectId
        && after.lifecycleState == 'live'
        && after.revision == before.revision + 1
        && after.parentRevision == before.revision
        && after.priorContentHash == before.contentHash
        && validHash(after.contentHash)
        && after.tombstone == null
        && after.diff(before).affectedKeys().hasOnly([
          'revision','parentRevision','contentHash','priorContentHash','updatedAt','updatedByAccountId','updatedByDeviceId','data'
        ]);
    }
    function ssjrTerminalParentCloseRequested(rivalryId, sessionId) {
      let parentAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
      return parentAfter.data.connectionState == 'closed'
        && parentAfter.data.terminalClose.runtimeRevision == '1.9.1-r18'
        && parentAfter.data.terminalClose.sessionId == sessionId;
    }
    function ssjrTerminalValidAtomicSessionClose(rivalryId, sessionId) {
      let before = resource.data;
      let after = request.resource.data;
      let parentBefore = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
      let parentAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
      return after.data.state == 'closed'
        && ssjrTerminalParentCloseRequested(rivalryId, sessionId)
        && ((after.revision == before.revision + 1) ? (signedIn()
        && validSessionId(sessionId)
        && before.data.rivalryId == rivalryId
        && before.data.state == 'active'
        && request.auth.uid in before.data.memberAccountIds
        && ssjrTerminalFinalEnvelopeCas(before, after, 'session', sessionId)
        && after.updatedByAccountId == request.auth.uid
        && after.data.diff(before.data).affectedKeys().hasOnly(['state','lastActivityAt'])
        && after.data.state == 'closed'
        && after.data.lastActivityAt == after.updatedAt
        && freshSessionActivity(after.data.lastActivityAt)
        && parentBefore.data.connectionState == 'active'
        && parentAfter.data.connectionState == 'closed'
        && parentAfter.data.terminalClose.sessionId == sessionId
        && parentAfter.data.terminalProgress.closedSessionRevision == after.revision
        && parentAfter.updatedByAccountId == request.auth.uid
        && parentAfter.updatedByDeviceId == after.updatedByDeviceId) : false);
    }
    function ssjrTerminalValidCloseUpdate(rivalryId) {
      let before = resource.data;
      let after = request.resource.data;
      let priorProgress = before.data.terminalProgress;
      let progress = after.data.terminalProgress;
      let intent = after.data.terminalClose;
      let sessionAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/sessions/$(intent.sessionId)).data;
      return rivalryId.matches('^pair_[0-9a-f]{64}$')
        && signedIn()
        && before.data.connectionState == 'active'
        && after.data.connectionState == 'closed'
        && ((after.revision == before.revision + 1) ? (ssjrTerminalFinalEnvelopeCas(before, after, 'rivalry', rivalryId)
        && after.data.diff(before.data).affectedKeys().hasOnly(['connectionState','terminalProgress','terminalClose'])
        && before.data.authorizedAccountIds is list
        && before.data.authorizedAccountIds.size() == 2
        && before.data.authorizedAccountIds[0] != before.data.authorizedAccountIds[1]
        && request.auth.uid in before.data.authorizedAccountIds
        && activeDevice(after.updatedByDeviceId)
        && after.updatedByAccountId == request.auth.uid
        && priorProgress.runtimeRevision == '1.9.1-r18'
        && priorProgress.acceptedThroughSeason == priorProgress.totalSeasons
        && priorProgress.closedSessionRevision == null
        && progress.diff(priorProgress).affectedKeys().hasOnly(['closedSessionRevision'])
        && progress.closedSessionRevision is int
        && progress.closedSessionRevision == sessionAfter.revision
        && ssjrTerminalValidIntent(rivalryId, intent)
        && intent.totalSeasons == priorProgress.totalSeasons
        && intent.managerTotals == priorProgress.managerTotals
        && sessionAfter.objectType == 'session'
        && sessionAfter.objectId == intent.sessionId
        && sessionAfter.data.rivalryId == rivalryId
        && sessionAfter.data.state == 'closed'
        && sessionAfter.updatedByAccountId == request.auth.uid
        && sessionAfter.updatedByDeviceId == after.updatedByDeviceId) : false);
    }
    function ssjrTerminalValidRivalryUpdate(rivalryId) {
      return (request.resource.data.data.connectionState == 'active' && ssjrTerminalValidProgressUpdate(rivalryId))
        || (request.resource.data.data.connectionState == 'closed' && ssjrTerminalValidCloseUpdate(rivalryId));
    }
// SSJR_TERMINAL_CLOSE_FUNCTIONS_END
```

## FILE: js/sparkPrivatePairing.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkPrivatePairing=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const IDENTITY_DB_NAME="careerModeShowdown.privateDevice";
  const IDENTITY_DB_VERSION=1;
  const IDENTITY_STORE_NAME="identity";
  const IDENTITY_PRIMARY_KEY="primary";
  const IDENTITY_SCHEMA_VERSION=1;
  const DEVICE_ID_BYTES=16;
  const INSTALLATION_ID_BYTES=16;
  const PAIRING_CAPABILITY_BYTES=32;
  const PAIRING_TTL_MS=15*60*1000;
  const MAX_PAIRING_TTL_MS=30*60*1000;
  const PANEL_ID="sparkPrivatePairingPanel";
  const SETTINGS_CONTENT_ID="settingsContent";
  const SETTINGS_OVERLAY_ID="settingsOverlay";
  const MANAGER_ROLES=Object.freeze(["playerOne","playerTwo"]);
  const JOIN_INPUT_ID="sparkPrivatePairingCodeInput";

  let pairingState=Object.freeze({status:"idle",initialized:false,busy:false,connected:false,registered:false,accountId:null,deviceId:null,selectedBindingKey:null,message:"Private pairing is available after your private account and this device are ready.",capability:null,expiresAtEpochMs:null});
  let pairingServices=null;
  let pairingIdentity=null;
  let pairingInitializePromise=null;
  let pairingAccountUnsubscribe=null;
  let pairingJoinDraft="";
  let pairingJoinRenderDeferred=false;
  const DEVICE_REVERIFY_MS=10*60*1000;
  let deviceVerified=null;
  // r75: any denied Firestore read or write (the budget layer's event) ends the 10-minute trust, so a browser revoked from
  // another browser is re-verified on its next check.
  try{if(root&&typeof root.addEventListener==="function")root.addEventListener("career-mode-firestore-authority-denied",()=>{deviceVerified=null;});}catch(_error){}
  const pairingListeners=new Set();

  function freezeDeep(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(freezeDeep);
    return value;
  }

  function setState(next,options={}){
    pairingState=freezeDeep({...pairingState,...next});
    for(const listener of pairingListeners){try{listener(pairingState);}catch(_error){}}
    if(options.render!==false)renderPanel();
    return pairingState;
  }

  function errorWithCode(code,message){
    const error=new Error(message||code);
    error.code=code;
    return error;
  }

  function asResultError(error,fallbackCode){
    return {ok:false,code:error&&typeof error.code==="string"?error.code:fallbackCode,message:error&&error.message?error.message:"The private operation could not be completed."};
  }

  function hexFromBytes(bytes){
    return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");
  }

  function randomId(prefix,byteLength,cryptoImpl=root.crypto){
    if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function")throw errorWithCode("PRIVATE_CRYPTO_UNAVAILABLE","Secure browser randomness is unavailable.");
    const bytes=new Uint8Array(byteLength);
    cryptoImpl.getRandomValues(bytes);
    return `${prefix}${hexFromBytes(bytes)}`;
  }

  function generateDeviceIdentity(cryptoImpl=root.crypto,nowEpochMs=Date.now()){
    return Object.freeze({schemaVersion:IDENTITY_SCHEMA_VERSION,installationId:randomId("installation_",INSTALLATION_ID_BYTES,cryptoImpl),deviceId:randomId("device_",DEVICE_ID_BYTES,cryptoImpl),createdAtEpochMs:Number(nowEpochMs)});
  }

  function validDeviceIdentity(value){
    return Boolean(value&&value.schemaVersion===IDENTITY_SCHEMA_VERSION&&typeof value.installationId==="string"&&/^installation_[0-9a-f]{32}$/.test(value.installationId)&&typeof value.deviceId==="string"&&/^device_[0-9a-f]{32}$/.test(value.deviceId)&&Number.isFinite(value.createdAtEpochMs)&&value.createdAtEpochMs>0);
  }

  function openIdentityDatabase(indexedDBImpl=root.indexedDB){
    if(!indexedDBImpl||typeof indexedDBImpl.open!=="function")return Promise.reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity storage is unavailable in this browser."));
    return new Promise((resolve,reject)=>{
      const request=indexedDBImpl.open(IDENTITY_DB_NAME,IDENTITY_DB_VERSION);
      request.onupgradeneeded=()=>{const database=request.result;if(!database.objectStoreNames.contains(IDENTITY_STORE_NAME))database.createObjectStore(IDENTITY_STORE_NAME);};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity storage could not be opened."));
      request.onblocked=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity storage is blocked by another browser context."));
    });
  }

  async function getOrCreateDeviceIdentity(options={}){
    const indexedDBImpl=options.indexedDBImpl||root.indexedDB;
    const cryptoImpl=options.cryptoImpl||root.crypto;
    const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
    let database;
    try{
      database=await openIdentityDatabase(indexedDBImpl);
      return await new Promise((resolve,reject)=>{
        const transaction=database.transaction(IDENTITY_STORE_NAME,"readwrite");
        const store=transaction.objectStore(IDENTITY_STORE_NAME);
        const read=store.get(IDENTITY_PRIMARY_KEY);
        let resolvedIdentity=null;
        read.onsuccess=()=>{
          const existing=read.result;
          if(existing!==undefined){
            if(!validDeviceIdentity(existing)){try{transaction.abort();}catch(_error){}reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_CONFLICT","Stored private device identity is invalid. Remote pairing is disabled. Your Showdowns were not changed."));return;}
            resolvedIdentity=Object.freeze({...existing});
            return;
          }
          try{resolvedIdentity=generateDeviceIdentity(cryptoImpl,nowEpochMs);store.add({...resolvedIdentity},IDENTITY_PRIMARY_KEY);}catch(error){try{transaction.abort();}catch(_error){}reject(error);}
        };
        read.onerror=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity could not be read."));
        transaction.oncomplete=()=>resolve(resolvedIdentity);
        transaction.onerror=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity could not be committed."));
        transaction.onabort=()=>reject(errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","Private device identity transaction was aborted."));
      });
    }finally{if(database&&typeof database.close==="function")database.close();}
  }

  // Studio Z10: Forget device revokes the server record and deletes the local record, so the cached identity must go too.
  // The next sign-in then registers a fresh device; the revoked server document is untouched.
  function resetDeviceIdentityCache(){pairingIdentity=null;pairingServices=null;}
  function canonicalize(value){
    if(value===null||value===undefined)return value===undefined?null:value;
    if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};
    if(Array.isArray(value))return value.map(canonicalize);
    if(typeof value==="object"){const result={};for(const key of Object.keys(value).sort())result[key]=canonicalize(value[key]);return result;}
    return value;
  }

  async function sha256(value,cryptoImpl=root.crypto){
    if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function")throw errorWithCode("PRIVATE_CRYPTO_UNAVAILABLE","Secure browser hashing is unavailable.");
    const bytes=new TextEncoder().encode(JSON.stringify(canonicalize(value)));
    const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);
    return `sha256:${hexFromBytes(new Uint8Array(digest))}`;
  }

  async function buildEnvelope({objectType,objectId,revision,parentRevision,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,cryptoImpl=root.crypto}){
    const contentHash=await sha256({objectType,objectId,revision,data},cryptoImpl);
    return {schemaVersion:1,objectType,objectId,revision,parentRevision,lifecycleState:"live",contentHash,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,tombstone:null};
  }

  function timestampMillis(value){
    if(value&&typeof value.toMillis==="function")return value.toMillis();
    if(value instanceof Date)return value.getTime();
    return Number.NaN;
  }

  function normalizeAccountId(user){
    const uid=user&&typeof user.uid==="string"?user.uid.trim():"";
    if(!uid)throw errorWithCode("PRIVATE_AUTH_REQUIRED","A ready private account is required.");
    return uid;
  }

  function normalizeLocalBinding(binding){
    const source=binding&&typeof binding==="object"?binding:{};
    const saveId=typeof source.saveId==="string"?source.saveId.trim():"";
    const profileId=typeof source.profileId==="string"?source.profileId.trim():"";
    const managerRole=typeof source.managerRole==="string"?source.managerRole.trim():"";
    const displayLabel=typeof source.displayLabel==="string"?source.displayLabel.trim().slice(0,80):"";
    if(!/^save_[a-f0-9]{24}$/.test(saveId))throw errorWithCode("PRIVATE_SAVE_ID_REQUIRED","Choose a Showdown with a stable Save Library identity.");
    if(!/^profile_[a-f0-9]{24}$/.test(profileId))throw errorWithCode("PRIVATE_PROFILE_ID_REQUIRED","Choose a manager with a stable Local Profile identity.");
    if(!MANAGER_ROLES.includes(managerRole))throw errorWithCode("PRIVATE_MANAGER_ROLE_REQUIRED","Choose Player One or Player Two for this private rivalry.");
    return Object.freeze({saveId,profileId,managerRole,displayLabel:displayLabel||null});
  }

  function bindingKey(binding){
    const normalized=normalizeLocalBinding(binding);
    return `${normalized.managerRole}:${normalized.profileId}:${normalized.saveId}`;
  }

  function pairingJoinErrorMessage(error){
    const code=error&&typeof error.code==="string"?error.code.trim().toLowerCase():"";
    const message=error&&typeof error.message==="string"?error.message.trim():"";
    const opaqueCodes=new Set(["permission-denied","firestore/permission-denied","permission_denied","pairing_capability_not_found","pairing_scope_denied","pairing_capability_already_used","pairing_capability_expired","pairing_rivalry_not_joinable"]);
    if(opaqueCodes.has(code)||/missing or insufficient permissions/i.test(message))return "This one-use pairing code could not be joined. It may be expired, already used, or unavailable to this account. Create a new code on the other device. If Daniel and Nik are already connected, go Home and tap CONTINUE CAREER instead. Also check that Nik is signed in with a different Google account than Daniel.";
    return message||"Private pairing could not be joined.";
  }

  function normalizeCapability(value){
    const capability=typeof value==="string"?value.trim().toLowerCase():"";
    if(!/^pair_[0-9a-f]{64}$/.test(capability))throw errorWithCode("PAIRING_CAPABILITY_INVALID","The private pairing code is invalid.");
    return capability;
  }

  function oppositeManagerRole(role){
    if(role==="playerOne")return "playerTwo";
    if(role==="playerTwo")return "playerOne";
    throw errorWithCode("PRIVATE_MANAGER_ROLE_REQUIRED","A valid manager role is required.");
  }

  function validateFirestoreInputs({firestore,firebaseSdk}){
    if(!firestore)throw errorWithCode("PRIVATE_FIRESTORE_UNAVAILABLE","Private Firestore services are unavailable.");
    for(const name of ["doc","runTransaction"]){if(!firebaseSdk||typeof firebaseSdk[name]!=="function")throw errorWithCode("PRIVATE_FIRESTORE_UNAVAILABLE",`Private Firestore SDK method unavailable: ${name}.`);}
    if(!firebaseSdk.Timestamp||typeof firebaseSdk.Timestamp.fromMillis!=="function")throw errorWithCode("PRIVATE_FIRESTORE_UNAVAILABLE","Firestore Timestamp support is unavailable.");
  }

  function isEnvelope(snapshot,objectType,objectId){
    if(!snapshot||typeof snapshot.exists!=="function"||!snapshot.exists())return false;
    const value=snapshot.data();
    return Boolean(value&&value.schemaVersion===1&&value.objectType===objectType&&value.objectId===objectId&&value.lifecycleState==="live"&&Number.isInteger(value.revision)&&value.revision>=0&&typeof value.contentHash==="string");
  }

  function assertActiveDeviceSnapshot(snapshot,deviceId){
    if(!isEnvelope(snapshot,"device",deviceId))throw errorWithCode("PRIVATE_DEVICE_NOT_REGISTERED","This browser is not registered to the signed-in private account.");
    const value=snapshot.data();
    if(!value.data||value.data.deviceId!==deviceId)throw errorWithCode("PRIVATE_DEVICE_CONFLICT","Registered device identity does not match this browser.");
    if(value.data.state==="revoked")throw errorWithCode("PRIVATE_DEVICE_REVOKED","This registered device has been revoked.");
    if(value.data.state!=="active")throw errorWithCode("PRIVATE_DEVICE_CONFLICT","Registered device state is invalid.");
    return value;
  }

  async function registerDevice(options={}){
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable private device identity is required.");
      const sdk=options.firebaseSdk;
      const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
      const now=sdk.Timestamp.fromMillis(nowEpochMs);
      const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const result=await sdk.runTransaction(options.firestore,async transaction=>{
        const existing=await transaction.get(deviceReference);
        if(existing.exists()){
          const stored=assertActiveDeviceSnapshot(existing,identity.deviceId);
          if(stored.data.installationId!==identity.installationId)throw errorWithCode("PRIVATE_DEVICE_CONFLICT","Registered device belongs to a different private installation identity.");
          return {action:"existing",revision:stored.revision};
        }
        const data={deviceId:identity.deviceId,installationId:identity.installationId,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null};
        const envelope=await buildEnvelope({objectType:"device",objectId:identity.deviceId,revision:0,parentRevision:null,priorContentHash:null,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data,cryptoImpl:options.cryptoImpl||root.crypto});
        transaction.set(deviceReference,envelope);
        return {action:"created",revision:0};
      });
      return {ok:true,accountId,deviceId:identity.deviceId,installationId:identity.installationId,...result};
    }catch(error){return asResultError(error,"PRIVATE_DEVICE_REGISTRATION_FAILED");}
  }

  async function revokeRegisteredDevice(options={}){
    deviceVerified=null;
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable private device identity is required.");
      const targetDeviceId=typeof options.targetDeviceId==="string"?options.targetDeviceId.trim():identity.deviceId;
      if(!/^device_[0-9a-f]{32}$/.test(targetDeviceId))throw errorWithCode("PRIVATE_DEVICE_ID_INVALID","A valid registered device identity is required.");
      const sdk=options.firebaseSdk;
      const now=sdk.Timestamp.fromMillis(options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs));
      const actorReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const targetReference=sdk.doc(options.firestore,"accounts",accountId,"devices",targetDeviceId);
      const result=await sdk.runTransaction(options.firestore,async transaction=>{
        const actorSnapshot=await transaction.get(actorReference);
        assertActiveDeviceSnapshot(actorSnapshot,identity.deviceId);
        const targetSnapshot=targetDeviceId===identity.deviceId?actorSnapshot:await transaction.get(targetReference);
        const stored=assertActiveDeviceSnapshot(targetSnapshot,targetDeviceId);
        const data={...stored.data,state:"revoked",revokedAt:now,lastSeenAt:stored.data.lastSeenAt};
        const envelope=await buildEnvelope({objectType:"device",objectId:targetDeviceId,revision:stored.revision+1,parentRevision:stored.revision,priorContentHash:stored.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data,cryptoImpl:options.cryptoImpl||root.crypto});
        transaction.set(targetReference,envelope);
        return {revision:envelope.revision};
      });
      return {ok:true,accountId,targetDeviceId,...result};
    }catch(error){return asResultError(error,"PRIVATE_DEVICE_REVOCATION_FAILED");}
  }

  function buildManagerSlots(accountId,binding){
    const creatorRole=binding.managerRole;
    const invitedRole=oppositeManagerRole(creatorRole);
    const slotFor=role=>role===creatorRole?{slotId:role,accountId,profileId:binding.profileId,saveId:binding.saveId,displayLabel:binding.displayLabel,entitlementState:"active",deletionConsent:false}:{slotId:role,accountId:null,profileId:null,saveId:null,displayLabel:null,entitlementState:"open",deletionConsent:false};
    return {managerSlots:[slotFor("playerOne"),slotFor("playerTwo")],invitedRole};
  }

  async function createPairing(options={}){
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable registered device is required.");
      const binding=normalizeLocalBinding(options.binding);
      const durableWitness=options.durableWitness;
      if(durableWitness!==undefined&&durableWitness!==null&&typeof durableWitness!=="function")throw errorWithCode("PAIRING_DURABLE_WITNESS_INVALID","A valid durable pairing witness is required.");
      const ttlMs=options.ttlMs===undefined?PAIRING_TTL_MS:Number(options.ttlMs);
      if(!Number.isFinite(ttlMs)||ttlMs<=0||ttlMs>MAX_PAIRING_TTL_MS)throw errorWithCode("PAIRING_TTL_INVALID","Private pairing expiry must be within 30 minutes.");
      const capability=normalizeCapability(options.capability||randomId("pair_",PAIRING_CAPABILITY_BYTES,options.cryptoImpl||root.crypto));
      const sdk=options.firebaseSdk;
      const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
      const createdAt=sdk.Timestamp.fromMillis(nowEpochMs);
      const expiresAt=sdk.Timestamp.fromMillis(nowEpochMs+ttlMs);
      const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const rivalryReference=sdk.doc(options.firestore,"rivalries",capability);
      const inviteReference=sdk.doc(options.firestore,"rivalries",capability,"invites",capability);
      const {managerSlots,invitedRole}=buildManagerSlots(accountId,binding);
      const durableWitnessResult=await sdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceReference);
        assertActiveDeviceSnapshot(deviceSnapshot,identity.deviceId);
        const rivalryData={connectionState:"pending-pair",connectionStateBeforeDeletion:null,managerSlots,authorizedAccountIds:[accountId],createdByAccountId:accountId,createdAt};
        const inviteData={purpose:"rivalry-pairing",slotId:invitedRole,createdByAccountId:accountId,createdAt,expiresAt,state:"open",redeemedByAccountId:null,redeemedAt:null,revokedAt:null};
        const rivalryEnvelope=await buildEnvelope({objectType:"rivalry",objectId:capability,revision:0,parentRevision:null,priorContentHash:null,updatedAt:createdAt,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:rivalryData,cryptoImpl:options.cryptoImpl||root.crypto});
        const inviteEnvelope=await buildEnvelope({objectType:"invite",objectId:capability,revision:0,parentRevision:null,priorContentHash:null,updatedAt:createdAt,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:inviteData,cryptoImpl:options.cryptoImpl||root.crypto});
        let witness=null;
        if(durableWitness){
          witness=await durableWitness({transaction,binding,capability,accountId,deviceId:identity.deviceId,now:createdAt,nowEpochMs});
          if(!witness||witness.ok!==true)throw errorWithCode("PAIRING_DURABLE_WITNESS_FAILED","The durable creator pairing witness could not be committed.");
        }
        transaction.set(rivalryReference,rivalryEnvelope);
        transaction.set(inviteReference,inviteEnvelope);
        return witness;
      });
      return {ok:true,rivalryId:capability,inviteId:capability,capability,slotId:invitedRole,expiresAtEpochMs:nowEpochMs+ttlMs,creatorBinding:binding,durableWitness:durableWitnessResult};
    }catch(error){return asResultError(error,"PAIRING_CREATE_FAILED");}
  }

  function assertPairingDocuments(rivalrySnapshot,inviteSnapshot,capability,accountId,binding,nowEpochMs){
    if(!isEnvelope(rivalrySnapshot,"rivalry",capability)||!isEnvelope(inviteSnapshot,"invite",capability))throw errorWithCode("PAIRING_CAPABILITY_NOT_FOUND","The private pairing code was not found.");
    const rivalry=rivalrySnapshot.data();
    const invite=inviteSnapshot.data();
    if(!invite.data||invite.data.purpose!=="rivalry-pairing")throw errorWithCode("PAIRING_SCOPE_DENIED","This capability is not valid for private rivalry pairing.");
    if(invite.data.createdByAccountId===accountId)throw errorWithCode("PAIRING_CREATOR_CANNOT_REDEEM","This Google account made the code, so it cannot join it. Nik must sign in with a different Google account than Daniel, then paste the code again.");
    if(invite.data.state!=="open")throw errorWithCode("PAIRING_CAPABILITY_ALREADY_USED","This private pairing code is no longer open.");
    const expiresAt=timestampMillis(invite.data.expiresAt);
    if(!Number.isFinite(expiresAt)||expiresAt<=nowEpochMs)throw errorWithCode("PAIRING_CAPABILITY_EXPIRED","This private pairing code has expired.");
    if(invite.data.slotId!==binding.managerRole)throw errorWithCode("PAIRING_SLOT_MISMATCH",`This code is for ${invite.data.slotId==="playerOne"?"Daniel":"Nik"}. Choose ${invite.data.slotId==="playerOne"?"Daniel":"Nik"} for this phone on Home, then join again.`);
    const data=rivalry.data;
    if(!data||data.connectionState!=="pending-pair"||!Array.isArray(data.managerSlots)||data.managerSlots.length!==2)throw errorWithCode("PAIRING_RIVALRY_NOT_JOINABLE","This private rivalry is not waiting for exactly one manager.");
    if(!Array.isArray(data.authorizedAccountIds)||data.authorizedAccountIds.length!==1||data.authorizedAccountIds[0]!==invite.data.createdByAccountId)throw errorWithCode("PAIRING_RIVALRY_CONFLICT","Private rivalry ownership is inconsistent.");
    const target=data.managerSlots.find(slot=>slot&&slot.slotId===invite.data.slotId);
    const creator=data.managerSlots.find(slot=>slot&&slot.accountId===invite.data.createdByAccountId);
    if(!target||target.accountId!==null||target.profileId!==null||target.saveId!==null||target.entitlementState!=="open")throw errorWithCode("PAIRING_TWO_MANAGER_LIMIT","The second manager slot is no longer open.");
    if(!creator||creator.entitlementState!=="active"||typeof creator.profileId!=="string"||typeof creator.saveId!=="string")throw errorWithCode("PAIRING_RIVALRY_CONFLICT","The creator manager binding is invalid.");
    return {rivalry,invite,target};
  }

  async function redeemPairing(options={}){
  try{
    validateFirestoreInputs(options);
    const accountId=normalizeAccountId(options.user);
    const identity=options.identity;
    if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable registered device is required.");
    const binding=normalizeLocalBinding(options.binding);
    const capability=normalizeCapability(options.capability);
    const durableWitness=options.durableWitness;
    if(durableWitness!==undefined&&typeof durableWitness!=="function")throw errorWithCode("PAIRING_DURABLE_WITNESS_INVALID","The durable pairing witness is invalid.");
    const sdk=options.firebaseSdk;
    const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);
    const now=sdk.Timestamp.fromMillis(nowEpochMs);
    const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
    const rivalryReference=sdk.doc(options.firestore,"rivalries",capability);
    const inviteReference=sdk.doc(options.firestore,"rivalries",capability,"invites",capability);
    const result=await sdk.runTransaction(options.firestore,async transaction=>{
      const deviceSnapshot=await transaction.get(deviceReference);
      assertActiveDeviceSnapshot(deviceSnapshot,identity.deviceId);
      const rivalrySnapshot=await transaction.get(rivalryReference);
      const inviteSnapshot=await transaction.get(inviteReference);
      const {rivalry,invite}=assertPairingDocuments(rivalrySnapshot,inviteSnapshot,capability,accountId,binding,nowEpochMs);
      let durableWitnessResult=null;
      if(durableWitness){
        durableWitnessResult=await durableWitness({transaction,firestore:options.firestore,firebaseSdk:sdk,accountId,identity,binding,capability,now,nowEpochMs,rivalry,invite});
        if(!durableWitnessResult||durableWitnessResult.ok!==true)throw errorWithCode("PAIRING_DURABLE_WITNESS_FAILED","The account pairing witness could not be committed with redemption.");
      }
      const nextSlots=rivalry.data.managerSlots.map(slot=>slot.slotId===invite.data.slotId?{slotId:slot.slotId,accountId,profileId:binding.profileId,saveId:binding.saveId,displayLabel:binding.displayLabel,entitlementState:"active",deletionConsent:false}:{...slot});
      const rivalryData={...rivalry.data,connectionState:"active",managerSlots:nextSlots,authorizedAccountIds:[invite.data.createdByAccountId,accountId]};
      const inviteData={...invite.data,state:"redeemed",redeemedByAccountId:accountId,redeemedAt:now,revokedAt:null};
      const rivalryEnvelope=await buildEnvelope({objectType:"rivalry",objectId:capability,revision:rivalry.revision+1,parentRevision:rivalry.revision,priorContentHash:rivalry.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:rivalryData,cryptoImpl:options.cryptoImpl||root.crypto});
      const inviteEnvelope=await buildEnvelope({objectType:"invite",objectId:capability,revision:invite.revision+1,parentRevision:invite.revision,priorContentHash:invite.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:inviteData,cryptoImpl:options.cryptoImpl||root.crypto});
      transaction.set(rivalryReference,rivalryEnvelope);
      transaction.set(inviteReference,inviteEnvelope);
      return {revision:rivalryEnvelope.revision,slotId:invite.data.slotId,durableWitness:durableWitnessResult};
    });
    return {ok:true,rivalryId:capability,capability,accountId,binding,...result};
  }catch(error){return asResultError(error,"PAIRING_REDEEM_FAILED");}
}

async function revokePairing(options={}){
    try{
      validateFirestoreInputs(options);
      const accountId=normalizeAccountId(options.user);
      const identity=options.identity;
      if(!validDeviceIdentity(identity))throw errorWithCode("PRIVATE_DEVICE_IDENTITY_UNAVAILABLE","A stable registered device is required.");
      const capability=normalizeCapability(options.capability);
      const sdk=options.firebaseSdk;
      const now=sdk.Timestamp.fromMillis(options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs));
      const deviceReference=sdk.doc(options.firestore,"accounts",accountId,"devices",identity.deviceId);
      const inviteReference=sdk.doc(options.firestore,"rivalries",capability,"invites",capability);
      const result=await sdk.runTransaction(options.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceReference);
        assertActiveDeviceSnapshot(deviceSnapshot,identity.deviceId);
        const inviteSnapshot=await transaction.get(inviteReference);
        if(!isEnvelope(inviteSnapshot,"invite",capability))throw errorWithCode("PAIRING_CAPABILITY_NOT_FOUND","The private pairing code was not found.");
        const invite=inviteSnapshot.data();
        if(!invite.data||invite.data.createdByAccountId!==accountId)throw errorWithCode("PAIRING_REVOKE_DENIED","Only the account that created this pairing code can revoke it.");
        if(invite.data.state!=="open")throw errorWithCode("PAIRING_CAPABILITY_ALREADY_USED","This private pairing code is no longer open.");
        const inviteData={...invite.data,state:"revoked",revokedAt:now,redeemedByAccountId:null,redeemedAt:null};
        const envelope=await buildEnvelope({objectType:"invite",objectId:capability,revision:invite.revision+1,parentRevision:invite.revision,priorContentHash:invite.contentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:identity.deviceId,data:inviteData,cryptoImpl:options.cryptoImpl||root.crypto});
        transaction.set(inviteReference,envelope);
        return {revision:envelope.revision};
      });
      return {ok:true,capability,...result};
    }catch(error){return asResultError(error,"PAIRING_REVOKE_FAILED");}
  }

  function localBindingOptions(saveRuntime=root.CareerModeSaveLibraryRuntime){
    if(!saveRuntime||typeof saveRuntime.getLibrarySnapshot!=="function"||typeof saveRuntime.isReady!=="function"||saveRuntime.isReady()!==true)return [];
    const library=saveRuntime.getLibrarySnapshot();
    if(!library||typeof library.activeSaveId!=="string"||!Array.isArray(library.saves))return [];
    const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
    const refs=entry&&entry.showdown&&entry.showdown.identity&&entry.showdown.identity.managerProfileIds;
    if(!entry||!refs)return [];
    const profiles=Array.isArray(library.profiles)?library.profiles:[];
    return MANAGER_ROLES.flatMap(managerRole=>{
      const profileId=refs[managerRole];
      if(typeof profileId!=="string")return [];
      const profile=profiles.find(item=>item&&item.profileId===profileId);
      const displayLabel=profile&&typeof profile.displayName==="string"&&profile.displayName.trim()?profile.displayName.trim():managerRole==="playerOne"?"Player One":"Player Two";
      try{return [normalizeLocalBinding({saveId:entry.saveId,profileId,managerRole,displayLabel})];}catch(_error){return [];}
    });
  }

  async function resolveConnectedContext(){
    const account=root.CareerModeSparkConnectedAccount;
    const runtime=root.CareerModeProductionFirebaseRuntime;
    if(!account||typeof account.getState!=="function"||!runtime||typeof runtime.ensureAccountServices!=="function")throw errorWithCode("PRIVATE_ACCOUNT_UNAVAILABLE","Connected account runtime is unavailable.");
    const accountState=account.getState();
    if(!accountState||accountState.connected!==true||!accountState.accountId)throw errorWithCode("PRIVATE_AUTH_REQUIRED","Sign in to your private account first.");
    const services=pairingServices&&pairingServices.ok===true?pairingServices:(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    if(!services||services.ok!==true)throw errorWithCode("PRIVATE_FIRESTORE_UNAVAILABLE","Private Firestore services are unavailable.");
    pairingServices=services;
    if(!pairingIdentity)pairingIdentity=await getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto});
    return {accountState,services,user:services.auth.currentUser,identity:pairingIdentity};
  }

  async function registerCurrentDevice(){
    const preservePairingStateAtStart=["creating-pair","joining-pair","pair-open","paired"].includes(pairingState.status);
    if(!preservePairingStateAtStart)setState({status:"registering",busy:true,message:"Registering this browser privately…"});
    try{
      const context=await resolveConnectedContext();
      // r75: initialize() runs on many screens; once this page has verified this account+device, re-verify at most every
      // 10 minutes, after an account change or after any registration error, instead of a transaction on every call.
      const verifiedKey=`${context.accountState.accountId}|${context.identity.deviceId}`;
      const recentlyVerified=pairingState.registered===true&&deviceVerified&&deviceVerified.key===verifiedKey&&Date.now()-deviceVerified.at<DEVICE_REVERIFY_MS;
      if(!recentlyVerified){
        deviceVerified=null;
        const result=await registerDevice({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:context.identity,cryptoImpl:root.crypto});
        if(!result.ok)throw errorWithCode(result.code,result.message);
        deviceVerified={key:verifiedKey,at:Date.now()};
      }
      const preservePairingState=preservePairingStateAtStart||["creating-pair","joining-pair","pair-open","paired"].includes(pairingState.status);
      if(preservePairingState){
        // r75: a re-check that confirms what the panel already shows does not rebuild it (that only replaced the open
        // pairing code and its COPY button under the manager's finger); listeners are still told.
        const next={initialized:true,connected:true,registered:true,accountId:context.accountState.accountId,deviceId:context.identity.deviceId};
        const unchanged=Object.keys(next).every(key=>pairingState[key]===next[key]);
        return setState(next,unchanged?{render:false}:{});
      }
      return setState({status:"ready",initialized:true,busy:false,connected:true,registered:true,accountId:context.accountState.accountId,deviceId:context.identity.deviceId,message:"This browser is privately registered. Pairing only links the two manager identities; gameplay synchronization is still locked."});
    }catch(error){deviceVerified=null;return setState({status:error&&error.code==="PRIVATE_DEVICE_REVOKED"?"revoked":"device-error",initialized:true,busy:false,connected:true,registered:false,message:`${error&&error.message?error.message:"This browser could not be registered."}`});}
  }

  async function initialize(){
    if(pairingInitializePromise)return pairingInitializePromise;
    pairingInitializePromise=(async()=>{
      const account=root.CareerModeSparkConnectedAccount;
      if(!account||typeof account.getState!=="function")return setState({status:"account-unavailable",initialized:true,busy:false,connected:false,registered:false,message:"Private pairing is unavailable right now."});
      if(!pairingAccountUnsubscribe&&typeof account.subscribe==="function"){
        pairingAccountUnsubscribe=account.subscribe(next=>{
          if(!next||next.connected!==true){pairingServices=null;pairingJoinDraft="";setState({status:"signed-out",initialized:true,busy:false,connected:false,registered:false,accountId:null,selectedBindingKey:null,capability:null,expiresAtEpochMs:null,message:"Sign in above to register this browser and use private pairing."});}
          else if(pairingState.accountId!==next.accountId){pairingServices=null;pairingJoinDraft="";setState({selectedBindingKey:null,capability:null,expiresAtEpochMs:null});void registerCurrentDevice();}
          else if(pairingState.registered!==true){void registerCurrentDevice();}
        });
      }
      const current=account.getState();
      if(!current||current.connected!==true){pairingJoinDraft="";return setState({status:"signed-out",initialized:true,busy:false,connected:false,registered:false,accountId:null,message:"Sign in above to register this browser and use private pairing."});}
      return registerCurrentDevice();
    })().finally(()=>{pairingInitializePromise=null;});
    return pairingInitializePromise;
  }

  function createElement(tag,className,text){
    const element=root.document.createElement(tag);
    if(className)element.className=className;
    if(text!==undefined&&text!==null)element.textContent=String(text);
    return element;
  }

  function shortId(value){return typeof value!=="string"||!value?"—":value.length<=16?value:`${value.slice(0,10)}…${value.slice(-4)}`;}
  function bindingLabel(binding){return `${binding.managerRole==="playerOne"?"Player One":"Player Two"} · ${binding.displayLabel||shortId(binding.profileId)}`;}
  function joinEditorCanStayMounted(){
    const input=root.document&&root.document.getElementById(JOIN_INPUT_ID);
    if(!input||root.document.activeElement!==input||input.readOnly)return false;
    const account=root.CareerModeSparkConnectedAccount&&typeof root.CareerModeSparkConnectedAccount.getState==="function"?root.CareerModeSparkConnectedAccount.getState():null;
    if(!account||account.connected!==true||!account.accountId||account.accountId!==pairingState.accountId)return false;
    if(pairingState.registered!==true)return false;
    if(["paired","revoked","signed-out","account-unavailable","device-error"].includes(pairingState.status))return false;
    return true;
  }
  function flushDeferredJoinRender(){
    if(!pairingJoinRenderDeferred)return;
    pairingJoinRenderDeferred=false;
    root.setTimeout(()=>{
      const active=root.document&&root.document.activeElement;
      if(active&&active.id===JOIN_INPUT_ID)return;
      renderPanel();
    },0);
  }

  function renderPanel(){
    if(!root.document)return null;
    const content=root.document.getElementById(SETTINGS_CONTENT_ID);
    const overlay=root.document.getElementById(SETTINGS_OVERLAY_ID);
    if(!content||!overlay||overlay.classList.contains("hidden"))return null;
    let panel=root.document.getElementById(PANEL_ID);
    if(!panel){
      panel=createElement("section","settingsPanel settingsConnectedAccountPanel settingsPrivatePairingPanel");
      panel.id=PANEL_ID;
      const accountPanel=root.document.getElementById("sparkConnectedAccountPanel");
      if(accountPanel&&accountPanel.parentNode===content&&accountPanel.nextSibling)content.insertBefore(panel,accountPanel.nextSibling);else content.appendChild(panel);
    }
    if(joinEditorCanStayMounted()){
      const input=root.document.getElementById(JOIN_INPUT_ID);pairingJoinDraft=input?input.value:pairingJoinDraft;pairingJoinRenderDeferred=true;
      const liveStatus=panel.querySelector('[role="status"]');if(liveStatus)liveStatus.textContent=pairingState.message;
      return panel;
    }
    pairingJoinRenderDeferred=false;
    panel.replaceChildren();
    const heading=createElement("div","settingsPanelHeading");
    heading.append(createElement("span","settingsPanelEyebrow","PRIVATE RIVALRY"),createElement("h3","","REGISTERED DEVICE & PAIRING"),createElement("p","","Link exactly two private manager identities. This stage does not synchronize gameplay or start a Remote Joining session."));
    const info=createElement("div","settingsInfoGrid");
    for(const [label,value] of [["DEVICE",pairingState.registered?`Registered · ${shortId(pairingState.deviceId)}`:pairingState.connected?"Not registered":"Sign in required"],["PAIRING","One use · 15 minute private capability"],["MANAGERS","Exactly two stable account/profile/save identities"],["GAMEPLAY SYNC","Explicit actions only in Connected Rivalry below"],["BILLING","Firebase Spark · no billing"]]){
      const row=createElement("div","settingsInfoRow");row.append(createElement("span","",label),createElement("strong","",value));info.appendChild(row);
    }
    panel.append(heading,info);
    if(pairingState.registered){
      const bindings=localBindingOptions();
      const form=createElement("div","settingsOfflineActions settingsConnectedAccountActions");
      const select=createElement("select","menuButton settingsConnectedAccountButton");
      select.setAttribute("aria-label","Local manager identity for private pairing");
      const bindingEntries=bindings.map(binding=>({binding,key:bindingKey(binding)}));
      const selectedEntry=bindingEntries.find(entry=>entry.key===pairingState.selectedBindingKey)||bindingEntries[0]||null;
      if(!bindingEntries.length){const option=createElement("option","","No active Save Library manager identity");option.value="";select.appendChild(option);select.disabled=true;}
      else bindingEntries.forEach(entry=>{const option=createElement("option","",bindingLabel(entry.binding));option.value=entry.key;option.selected=entry.key===selectedEntry.key;select.appendChild(option);});
      select.disabled=select.disabled||pairingState.busy||Boolean(pairingState.capability);
      select.addEventListener("change",()=>{if(pairingState.busy||pairingState.capability){if(selectedEntry)select.value=selectedEntry.key;return;}if(bindingEntries.some(entry=>entry.key===select.value))setState({selectedBindingKey:select.value},{render:false});});
      const selectedBinding=()=>{const entry=bindingEntries.find(candidate=>candidate.key===select.value)||selectedEntry;return entry?entry.binding:null;};
      const createButton=createElement("button","menuButton settingsConnectedAccountButton","CREATE PAIRING CODE");createButton.type="button";createButton.disabled=pairingState.busy||!bindings.length;
      const codeInput=createElement("input","settingsConnectedAccountInput");codeInput.id=JOIN_INPUT_ID;codeInput.type="text";codeInput.placeholder="Paste private pairing code";codeInput.autocomplete="off";codeInput.spellcheck=false;codeInput.setAttribute("aria-label","Private pairing code");
      if(pairingState.status==="paired"&&pairingState.capability){codeInput.value=pairingState.capability;codeInput.readOnly=true;codeInput.setAttribute("aria-readonly","true");}
      else codeInput.value=pairingJoinDraft;
      codeInput.addEventListener("input",()=>{pairingJoinDraft=codeInput.value;});
      codeInput.addEventListener("blur",flushDeferredJoinRender);
      const joinButton=createElement("button","menuButton settingsConnectedAccountButton","JOIN PRIVATE PAIRING");joinButton.type="button";joinButton.disabled=pairingState.busy||!bindings.length||pairingState.status==="paired";
      createButton.addEventListener("click",async()=>{
        const binding=selectedBinding();if(!binding)return;
        setState({status:"creating-pair",busy:true,selectedBindingKey:bindingKey(binding),capability:null,expiresAtEpochMs:null,message:"Creating a private one-use pairing code…"});
        try{const context=await resolveConnectedContext();const result=await createPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:context.identity,binding,cryptoImpl:root.crypto});if(!result.ok)throw errorWithCode(result.code,result.message);setState({status:"pair-open",busy:false,capability:result.capability,expiresAtEpochMs:result.expiresAtEpochMs,message:"Pairing code created. Share it directly with your friend. Connected Rivalry below is prefilled automatically. After the second manager joins, do not manually attach in the normal flow: return to Save Library or open Private Remote Joining and the same rivalry will verify and attach automatically. The pairing code still expires in 15 minutes and can be used once."});}
        catch(error){setState({status:"pair-error",busy:false,message:`${error&&error.message?error.message:"Private pairing could not be created."} Your Showdowns were not changed.`});}
      });
      joinButton.addEventListener("click",async()=>{
        const binding=selectedBinding();if(!binding)return;
        pairingJoinDraft=codeInput.value;
        setState({status:"joining-pair",busy:true,selectedBindingKey:bindingKey(binding),message:"Redeeming the private one-use pairing code…"});
        try{const context=await resolveConnectedContext();const result=await redeemPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:context.identity,binding,capability:pairingJoinDraft,cryptoImpl:root.crypto});if(!result.ok)throw errorWithCode(result.code,result.message);pairingJoinDraft="";setState({status:"paired",busy:false,capability:result.capability,expiresAtEpochMs:null,message:"Private managers are paired. The one code pasted above is retained as the exact Connected Rivalry ID, and Connected Rivalry below uses that same value automatically; no second copy, paste, or manual Attach is required in the normal flow."});}
        catch(error){setState({status:"pair-error",busy:false,message:`${pairingJoinErrorMessage(error)} Your Showdowns were not changed.`});}
      });
      form.append(select,createButton,codeInput,joinButton);panel.appendChild(form);
      if(pairingState.capability){
        const capabilityBox=createElement("div","settingsDataNote");
        const capabilityText=createElement("code","",pairingState.capability);
        capabilityBox.append(createElement("strong","",pairingState.status==="paired"?"CONNECTED RIVALRY ID · ONE PASTE CONFIRMED: ":"PRIVATE PAIRING CODE · COPY ONCE: "),capabilityText);
        panel.appendChild(capabilityBox);
        if(pairingState.status==="pair-open"){
          const copyButton=createElement("button","menuButton settingsConnectedAccountButton","COPY PAIRING CODE");
          copyButton.type="button";
          copyButton.addEventListener("click",async()=>{
            const capability=pairingState.capability;
            if(!capability)return;
            let copied=false;
            if(root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.writeText==="function"){try{await root.navigator.clipboard.writeText(capability);copied=true;}catch(_error){copied=false;}}
            if(!copied){
              const fallbackCopy=createElement("textarea","settingsConnectedAccountInput");fallbackCopy.value=capability;fallbackCopy.readOnly=true;fallbackCopy.setAttribute("aria-hidden","true");fallbackCopy.style.position="fixed";fallbackCopy.style.opacity="0";fallbackCopy.style.pointerEvents="none";root.document.body.appendChild(fallbackCopy);fallbackCopy.focus();fallbackCopy.setSelectionRange(0,capability.length);try{copied=Boolean(root.document.execCommand&&root.document.execCommand("copy"));}catch(_error){copied=false;}fallbackCopy.remove();
            }
            if(copied){setState({message:"Pairing code copied. Paste it exactly once into Player Two's Join Private Pairing field; Player One and Player Two Connected Rivalry will use the same ID automatically."});return;}
            if(root.getSelection&&root.document.createRange){const selection=root.getSelection();const range=root.document.createRange();range.selectNodeContents(capabilityText);selection.removeAllRanges();selection.addRange(range);}
            const status=panel.querySelector('[role="status"]');if(status)status.textContent="Automatic clipboard copy was unavailable. The full pairing code is selected; use your browser Copy command. The code itself was not changed.";
          });
          panel.appendChild(copyButton);
        }
      }
    }
    const note=createElement("p","settingsDataNote",pairingState.message);note.setAttribute("role","status");note.setAttribute("aria-live","polite");panel.appendChild(note);
    return panel;
  }

  function mountWhenSettingsReady(){
    if(!root.document)return Promise.resolve(false);
    return new Promise(resolve=>{
      let attempts=0;
      const tryMount=()=>{
        attempts+=1;
        const content=root.document.getElementById(SETTINGS_CONTENT_ID);
        const overlay=root.document.getElementById(SETTINGS_OVERLAY_ID);
        if(content&&overlay&&!overlay.classList.contains("hidden")){renderPanel();void initialize();resolve(true);return;}
        if(attempts>=40){resolve(false);return;}
        root.setTimeout(tryMount,50);
      };
      tryMount();
    });
  }

  function subscribe(listener){if(typeof listener!=="function")return ()=>{};pairingListeners.add(listener);return ()=>pairingListeners.delete(listener);}

  return freezeDeep({
    contractVersion:1,
    feature:"registered-devices-private-pairing",
    identityStorage:"indexeddb-private-device-only",
    canonicalLocalStorageKeys:Object.freeze(["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"]),
    pairingCapabilityBits:PAIRING_CAPABILITY_BYTES*8,
    pairingTtlMs:PAIRING_TTL_MS,
    maxPairingTtlMs:MAX_PAIRING_TTL_MS,
    publicDiscovery:false,
    gameplaySync:false,
    remoteJoiningSessions:false,
    billingRequired:false,
    stableJoinEditor:true,
    generateDeviceIdentity,
    validDeviceIdentity,
    getOrCreateDeviceIdentity,
    resetDeviceIdentityCache,
    normalizeLocalBinding,
    bindingKey,
    pairingJoinErrorMessage,
    normalizeCapability,
    localBindingOptions,
    registerDevice,
    revokeRegisteredDevice,
    revokeDevice:revokeRegisteredDevice,
    createPairing,
    redeemPairing,
    revokePairing,
    initialize,
    mountWhenSettingsReady,
    subscribe,
    getState:()=>pairingState
  });
});
// Firestore budget layer (r75). Connected modules wrap the services they get from the runtime with
// CareerModeFirestoreBudget.services(...). Only firestoreSdk.runTransaction changes (plus read metering, r85); every poll keeps its cadence.
// 1. A transaction that only reads ends without a commit RPC, so it no longer sends one "verify" write per document it
//    read (the 2026-10-12 incident counted ~7K such writes in one hour). A transaction that writes commits exactly as before.
// 2. A read-only transaction first runs against recent reads. A document read in the last 2 s is reused, so a burst of
//    refreshes from several screens costs one read per document. When nobody waits (no tap in the last 5 s, no screen
//    waiting on the partner without a healthy listener, no fast check running) the background checks reuse documents for up
//    to 60 s. A check that sees a changed document re-runs on fresh reads only, so it never mixes old and new documents. This
//    account's own account and device documents (only this account can change them) are reused for 5 minutes. A document
//    this page wrote, a page that became visible again and any write all go to the server. Reads of the same document that
//    are in flight together share one request. If the transaction wants to write, it runs as a normal server transaction.
// 3. A "resource-exhausted" answer (the free daily limit) pauses all Firestore traffic from this page for 10 minutes
//    (then 20, 40, 60) and publishes one plain message for the screens that would otherwise show a misleading error.
(function(root){
  "use strict";
  if(!root||root.CareerModeFirestoreBudget)return;
  const FSB_QUOTA_MESSAGE="Today's free online limit is used up. It resets at 3 am Boston time. Your saved career is safe.";
  const FSB_PAUSE_STEPS_MS=Object.freeze([10,20,40,60].map(minutes=>minutes*60000));
  const FSB_COALESCE_MS=2000,FSB_OWN_ACCOUNT_MS=5*60000,FSB_MAX_ENTRIES=200;
  const FSB_LIVE_QUIET_MS=300000;
  // r84: while the only screens watching are open on their own turn (Transfer window/guesses/signings, Season Results entry),
  // and not waiting on the partner, their listener is trusted for 2 min between server checks (30 s while waiting on the partner).
  // A partner's move still arrives at once through the listener, whose delivery forgets every other copy; a tap still reads fresh.
  const FSB_RELAXED_CONFIRM_MS=120000;
  const FSB_QUIET_MS=60000,FSB_INPUT_FRESH_MS=5000,FSB_ASK_MS=7000,FSB_FAST_GAP_MS=6000,FSB_FAST_HOLD_MS=10000;
  // fsbServerNext: documents whose next read must reach the server (no copy, no read already in flight), set by readServerNext.
  const fsbServerNext=new Map();
  const fsbWrapped=new WeakMap(),fsbEntries=new Map(),fsbInflight=new Map(),fsbCadence=new Map(),fsbWaitAsks=new Map(),fsbFreshPaths=new Map();
  const fsbStats={immutableReuses:0,reusedReads:0,quietReuses:0,freshReruns:0,serverReads:0,serverTransactions:0,readOnlyWithoutCommit:0,quotaTrips:0,pausedRefusals:0,brakeTrips:0,brakeSince:0,listenersAttached:0,listenerDeliveries:0,listenerServed:0,listenerFallbacks:0,peekWrites:0,transactionKept:0,contextServed:0,directReads:0,directFailures:0,deniedRefusals:0};
  let fsbPause=null,fsbResumeTimer=null,fsbAccountId=null,fsbFirestore=null,fsbInputAt=0,fsbFreshAskAt=0,fsbChainAt=0;
  // After the listener sees the partner's move (or the page comes back from hidden) every screen re-checks in a short chain
  // (commit -> scoring -> history -> final result). A document read after that moment already reflects it, so for the next
  // 6 s the chain reuses it instead of reading it again for each screen.
  const FSB_CHAIN_MS=6000;
  // r84 read brake and daily count (Nik 2026-10-26: 25 seasons a day must be a real floor). Every server read and listener
  // delivery this page makes is counted, per minute and per Google day (Pacific, resets 3 am Boston). When nobody has
  // tapped for a minute and this page made 150+ reads in the last 5 minutes (normal waiting is 5-30), background checks
  // reuse every copy for at least 15 s until the next tap: an unknown loop costs at most a few reads a minute instead of the day's allowance.
  // Taps, writes, readServerNext and a healthy listener are untouched, so play stays instant; the brake lets go by itself.
  const FSB_BRAKE_WINDOW_MS=5*60000,FSB_BRAKE_READS=150,FSB_BRAKE_IDLE_MS=60000,FSB_BRAKE_REUSE_MS=15000;
  const FSB_DAY_KEY="careerModeFirestoreReadsDay",FSB_DAY_SAVE_EVERY=20,FSB_BILLED_PER_READ=2.8,FSB_FREE_READS_PER_DAY=50000,FSB_DAY_SEASONS=20,FSB_DEFAULT_SEASON_READS=135;
  // r86 reads accuracy (Nik 2026-10-28): what Google bills against the free 50,000 is every document read PLUS every document
  // the Security Rules look up (get()/exists()) to allow a read or a write. r84/r85 multiplied this phone's document reads by
  // 2.8; now each request is priced by its own path from this table, generated from the composed production Rules by
  // tests/browser/support/rules-lookups.cjs (the CE2PG billed meter prices with the same derivation, so phone and test agree):
  //   [path pattern, lookups of a read while the Showdown is live, lookups once it is finished, documents a write may look up].
  // A live Showdown's read stops at its first allow branch (the rivalry); a finished one also checks the signed-in account.
  // A listener's Rules are evaluated when it starts and again each time its results update or it comes back online (Firebase
  // pricing, "Listeners and rules"), so every server delivery is billed its document plus its lookups. A write is priced at
  // every document its create or update rule can reach, once per request (a transaction is one request): an upper bound.
  // tests/contracts/r86-billed-counter-contracts.cjs fails when the Rules change and this table is not regenerated.
  const FSB_RULES_SHA256="bffd4bff694d6fa91d97c0b943b1fd6c40f7e125db4acb53639684a31dd86e9e";
  // BEGIN generated Rules lookup table (paths are priced here, never read or written by this module).
  const FSB_RULES_LOOKUPS=Object.freeze([
      ["accounts/*",0,0,[]],
      ["accounts/*/profileLinks/*",0,0,[]],
      ["accounts/*/devices/*",0,0,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}"]],
      ["accounts/*/securityEvents/*",0,0,[]],
      ["accounts/*/pairLinks/*",0,0,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","accounts/{accountId}/careerIndex/current","rivalries/{after.data.rivalryId}","rivalries/{before.data.rivalryId}","rivalries/{before.data.rivalryId}/invites/{before.data.rivalryId}"]],
      ["accounts/*/careerIndex/*",0,0,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","accounts/{accountId}/careerIndex/current","accounts/{accountId}/careerIndex/{'page_'+stringafter.data.sealedPageCount}","accounts/{accountId}/pairLinks/current","accounts/{before.createdByAccountId}/careerIndex/current","rivalries/{@pair0}","rivalries/{next[prior.size]}"]],
      ["accounts/*/careerStart/*",1,1,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","accounts/{accountId}/careerIndex/current"]],
      ["accounts/*/partner/*",0,0,["accounts/{@self}","accounts/{accountId}/careerStart/current","rivalries/{after.pairedViaRivalryId}","rivalries/{request.resource.data.pairedViaRivalryId}"]],
      ["accounts/*/partnerInbox/*",0,0,["accounts/{@self}","accounts/{@self}/partner/current","accounts/{accountId}/partner/current","rivalries/{note.rivalryId}","rivalries/{note.rivalryId}/invites/{note.rivalryId}"]],
      ["accounts/*/careerSummary/*",1,1,["accounts/{@self}","rivalries/{rivalryId}"]],
      ["rivalries/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","accounts/{@self}/pairLinks/current","rivalries/{rivalryId}/invites/{rivalryId}","rivalries/{rivalryId}/seasonCommits/season_1","rivalries/{rivalryId}/seasonCommits/{seasonId}","rivalries/{rivalryId}/sessions/{intent.sessionId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
      ["rivalries/*/state/authoritative",1,2,["accounts/{@pair0}","accounts/{@pair1}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/state/authoritative/idempotency/{receiptKey}"]],
      ["rivalries/*/state/authoritative/idempotency/*",2,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}/state/authoritative"]],
      ["rivalries/*/invites/*",1,1,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}"]],
      ["rivalries/*/sharedSetup/authoritative",1,2,["accounts/{@pair0}","accounts/{@pair1}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}"]],
      ["rivalries/*/sharedSetup/leagueProjection",1,1,["accounts/{@self}","rivalries/{rivalryId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
      ["rivalries/*/careerStart/authoritative",1,1,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
      ["rivalries/*/transferChallenges/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/careerStart/authoritative","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/authoritative","rivalries/{rivalryId}/transferChallenges/{transferId}/roles/{role}"]],
      ["rivalries/*/transferChallenges/*/roles/*",2,3,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/transferChallenges/{transferId}"]],
      ["rivalries/*/seasonResults/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{role}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/leagueProjection"]],
      ["rivalries/*/seasonResults/*/roles/*",2,3,["rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}"]],
      ["rivalries/*/seasonCommits/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{'playerOne'}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{'playerTwo'}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
      ["rivalries/*/meters/*",1,2,["rivalries/{rivalryId}"]],
      ["rivalries/*/sessions/*",2,2,["accounts/{@pair0}","accounts/{@pair1}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}"]],
      ["rivalries/*/sessionOffers/*",1,1,["accounts/{@pair0}","accounts/{@pair1}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{offer.sessionId}"]]
  ].map(row=>Object.freeze([Object.freeze(row[0].split("/")),row[1],row[2],Object.freeze(row[3])])));
  // END generated Rules lookup table.
  // A query (no single document path) is priced at one lookup per request: the signed-in account.
  const FSB_QUERY_LOOKUPS=1;
  // One season on one phone, game screens only (career pages are counted apart), documents + lookups, waits included: the
  // CE2PG billed measurement (npm run test:budget, 2026-10-29, mid pace, listener lookups on every update) of a 3-season
  // Showdown was 991 + 614 + 773 billed for both phones (first season with Start and Setup, a middle one, the last with
  // Final): about 400 per phone per season. Used until a season has been played on this phone.
  const FSB_DEFAULT_SEASON_BILLED=400;
  const fsbLookupCache=new Map();
  function fsbLookupRow(path){
    if(typeof path!=="string"||!path)return null;
    if(fsbLookupCache.has(path))return fsbLookupCache.get(path);
    const parts=path.replace(/^\/+/,"").split("/");
    const row=FSB_RULES_LOOKUPS.find(([pattern])=>pattern.length===parts.length&&pattern.every((part,index)=>part==="*"||part===parts[index]))||null;
    fsbLookupCache.set(path,row);if(fsbLookupCache.size>FSB_MAX_ENTRIES)fsbLookupCache.delete(fsbLookupCache.keys().next().value);
    return row;
  }
  function fsbReadLookups(path,finished=false){const row=fsbLookupRow(path);return row?row[finished?2:1]:FSB_QUERY_LOOKUPS;}
  // RE-08 (r87): one request is billed each distinct document once. The table's templates are already canonical (root.* is after.*,
  // the written rivalryId is the match's); across the documents of one request the signed-in account is one of the pair's two.
  function fsbWriteLookups(paths){const docs=new Set();for(const path of paths){const row=fsbLookupRow(path);if(row)for(const doc of row[3])docs.add(doc);}if(docs.has("accounts/{@pair0}")||docs.has("accounts/{@pair1}")){docs.delete("accounts/{@self}");docs.delete("accounts/{accountId}");}else if(docs.has("accounts/{@self}"))docs.delete("accounts/{accountId}");return docs.size;}
  // Today's billed reads on this phone, kept apart: game screens (including every write's lookups) and career pages
  // (History, Legacy, Trophy Room, Statistics, Rivalry, Season Final history: the direct gets of finished Showdowns).
  function fsbBill(units,career=false){
    if(!(units>0))return;
    const bill=fsbDayState().bill;
    if(career)bill.career+=units;else bill.game+=units;
    fsbDayUnsaved+=1;if(fsbDayUnsaved>=FSB_DAY_SAVE_EVERY)fsbSaveDay();
  }
  function fsbBillCost(bill){const costs=bill&&Array.isArray(bill.costs)?bill.costs.slice(-3):[];return costs.length?Math.round(costs.reduce((sum,cost)=>sum+cost,0)/costs.length):0;}
  // A season that runs past the Google day keeps its billed reads from before the reset (the new mark starts below 0 by them).
  // r87 (B2): role is this phone's manager role (kept across days: Daniel is always playerOne); setupCosts are the billed game reads
  // before a Showdown's first season starts (RE-05); startKey is the season whose start mark was taken; own and partner are the
  // two shared meter documents of today (fsbShare*). The start mark of a season still being played crosses midnight with its reads
  // (markGame), so a season started before the Pacific reset and finished after it keeps its whole measured cost (PR #1097 review).
  function fsbBillNextDay(bill){return {game:0,career:0,markGame:-Math.max(0,bill.game-bill.markGame),costs:[],lastCost:fsbBillCost(bill)||bill.lastCost||0,role:fsbShareRole(bill.role),setupCosts:[],startKey:typeof bill.startKey==="string"&&bill.startKey?bill.startKey:null,own:null,partner:null};}
  function fsbBillFrom(saved,today){
    const old=saved&&saved.bill&&typeof saved.bill==="object"?saved.bill:null,whole=value=>Number.isFinite(value)?Math.floor(value):0;
    const costs=old&&Array.isArray(old.costs)?old.costs.filter(cost=>Number.isFinite(cost)&&cost>0).slice(-FSB_DAY_SEASONS):[];
    const lastCost=Math.max(0,whole(old&&old.lastCost)),role=fsbShareRole(old&&old.role);
    if(!saved)return {game:0,career:0,markGame:0,costs:[],lastCost:0,role:null,setupCosts:[],startKey:null,own:null,partner:null};
    if(saved.day!==today)return fsbBillNextDay({game:Math.max(0,whole(old&&old.game)),markGame:whole(old&&old.markGame),costs,lastCost,role,startKey:old&&old.startKey});
    // A day first counted before r86 holds document reads only: they stay priced at the old 2.8 until that day ends.
    const game=old?Math.max(0,whole(old.game)):Math.round(Math.max(0,whole(saved.reads))*FSB_BILLED_PER_READ);
    const setupCosts=old&&Array.isArray(old.setupCosts)?old.setupCosts.filter(cost=>Number.isFinite(cost)&&cost>0).slice(-FSB_DAY_SEASONS):[];
    const own=fsbShareClean(old&&old.own),partner=fsbShareClean(old&&old.partner);
    return {game,career:old?Math.max(0,whole(old.career)):0,markGame:old&&whole(old.markGame)<=game?whole(old.markGame):game,costs,lastCost,role,setupCosts,startKey:old&&typeof old.startKey==="string"?old.startKey:null,own:own&&own.day===today?own:null,partner:partner&&partner.day===today?partner:null};
  }
  const fsbReadTimes=[];let fsbDay=null,fsbDayUnsaved=0,fsbDayStoreBroken=false;
  function fsbPacificDay(at){try{return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(at));}catch(_error){return new Date(at-8*3600000).toISOString().slice(0,10);}}
  function fsbDayState(at=fsbNow()){
    const day=fsbPacificDay(at);
    if(!fsbDay){fsbDay={day,reads:0,markReads:0,seasons:[],costs:[],lastCost:0,bill:fsbBillFrom(null,day)};try{const saved=JSON.parse((typeof root.readStorageValue==="function"&&root.readStorageValue(FSB_DAY_KEY))||"null");fsbDay.bill=fsbBillFrom(saved,day);if(saved&&Number.isFinite(saved.lastCost)&&saved.lastCost>0)fsbDay.lastCost=Math.floor(saved.lastCost);if(saved&&saved.day!==day){if(fsbSeasonCost(saved))fsbDay.lastCost=fsbSeasonCost(saved);fsbDay.markReads=-fsbCarried(saved);}if(saved&&saved.day===day&&Number.isFinite(saved.reads)&&saved.reads>=0){fsbDay.reads=Math.floor(saved.reads);if(Number.isFinite(saved.markReads)&&saved.markReads<=fsbDay.reads)fsbDay.markReads=Math.floor(saved.markReads);if(Array.isArray(saved.seasons))fsbDay.seasons=saved.seasons.filter(key=>typeof key==="string").slice(-FSB_DAY_SEASONS);if(Array.isArray(saved.costs))fsbDay.costs=saved.costs.filter(cost=>Number.isFinite(cost)&&cost>0).slice(-FSB_DAY_SEASONS);}}catch(_error){}}
    if(fsbDay.day!==day){fsbDay={day,reads:0,markReads:-fsbCarried(fsbDay),seasons:[],costs:[],lastCost:fsbSeasonCost(fsbDay)||fsbDay.lastCost||0,bill:fsbBillNextDay(fsbDay.bill)};fsbDayUnsaved=1;}
    return fsbDay;
  }
  // Saved through storage.js (the only module that touches browser storage); a failed write stops further saves so a
  // private window never repeats the storage notice. The count is a per-device convenience, never game state.
  function fsbSaveDay(){if(!fsbDay||!fsbDayUnsaved||fsbDayStoreBroken||typeof root.writeStorageValue!=="function")return;fsbDayUnsaved=0;try{if(root.writeStorageValue(FSB_DAY_KEY,JSON.stringify(fsbDay))===false)fsbDayStoreBroken=true;}catch(_error){fsbDayStoreBroken=true;}}
  // brake=false: the read counts toward today's total only, not the 5-minute brake window (direct career-history gets, r85).
  // lookups: the Rules lookups this request is billed (fsbReadLookups); career: a career-page read (fsbBill).
  function fsbCountRead(count=1,brake=true,lookups=0,career=false){
    if(!(count>0))return;
    const at=fsbNow(),day=fsbDayState(at);
    if(brake)for(let index=0;index<count;index+=1)fsbReadTimes.push(at);
    while(fsbReadTimes.length&&at-fsbReadTimes[0]>FSB_BRAKE_WINDOW_MS)fsbReadTimes.shift();
    if(fsbReadTimes.length>FSB_BRAKE_READS*4)fsbReadTimes.splice(0,fsbReadTimes.length-FSB_BRAKE_READS*4);
    day.reads+=count;fsbDayUnsaved+=count;
    fsbBill(count+(lookups>0?lookups:0),career);
    if(fsbDayUnsaved>=FSB_DAY_SAVE_EVERY)fsbSaveDay();
  }
  function fsbBraking(at=fsbNow()){
    if(at-fsbInputAt<FSB_BRAKE_IDLE_MS){fsbStats.brakeSince=0;return false;}
    // Once on, the brake holds until someone taps, so a loop cannot burst again each time the 5-minute window drains.
    if(fsbStats.brakeSince&&fsbInputAt<fsbStats.brakeSince)return true;
    while(fsbReadTimes.length&&at-fsbReadTimes[0]>FSB_BRAKE_WINDOW_MS)fsbReadTimes.shift();
    const on=fsbReadTimes.length>=FSB_BRAKE_READS;
    if(on&&!fsbStats.brakeSince)fsbStats.brakeTrips+=1;
    fsbStats.brakeSince=on?(fsbStats.brakeSince||at):0;
    return on;
  }
  // r86: thisPhone, game and career are this phone's own billed reads (documents + Rules lookups); billedEstimate is both phones.
  // Red team #9: career pages are never scaled, since only the phone that opens History or Legacy pays for them.
  // r87 (B2): with both phones' meter documents of today for the same season, billedEstimate is their sum, exactly the same number
  // on both phones (shared: the two documents, this phone's and the partner's, as of that season's ACKNOWLEDGED); otherwise it is the
  // B1 role-share estimate (estimated: true): this phone's game reads over its role's share of a season plus its career pages.
  function fsbReadsToday(){
    const day=fsbDayState(),bill=day.bill,here=bill.game+bill.career,shared=fsbShareFrom(bill.own,bill.partner,day.day);
    const mine=shared&&bill.own?fsbShareUsed(bill.own):null,estimate=Math.round(bill.game/fsbRoleShare(bill.role)+bill.career);
    return Object.freeze({day:day.day,reads:day.reads,billedEstimate:shared?shared.used:estimate,estimated:!shared,role:bill.role,
      shared:shared?Object.freeze({used:shared.used,season:shared.season,thisPhone:mine,partner:shared.used-mine,sinceThisPhone:Math.max(0,Math.round(here)-mine)}):null,
      thisPhone:Math.round(here),game:Math.round(bill.game),career:Math.round(bill.career),freeReadsPerDay:FSB_FREE_READS_PER_DAY});
  }
  // r84: seasons left today. Each season this page sees ACKNOWLEDGED records the reads it made since the previous one, so
  // the cost per season follows the pace actually played (a slow season waits longer and costs more). The partner's device
  // is assumed to cost the same. Until a season is finished today, the last day's average (or the r84 measured cost) is used.
  // r85: that measured cost is the r84 check trim's (gameplay/r84/CHECK_TRIM_PLAN.md: about 720-770 billed reads per season for
  // both phones, so about 135 reads per device at the 2.8 billed-per-read rate the composed Rules still give). The pre-trim 450
  // made a fresh device show about a third of the real seasons left.
  // A season that runs past the Google day keeps its reads from before the reset: the new day's mark starts below 0 by them.
  function fsbCarried(day){const reads=Number(day&&day.reads),mark=Number(day&&day.markReads);return Number.isFinite(reads)&&reads>0?Math.max(0,Math.floor(reads-(Number.isFinite(mark)?mark:0))):0;}
  function fsbSeasonCost(day){const costs=day&&Array.isArray(day.costs)?day.costs.filter(cost=>Number.isFinite(cost)&&cost>0).slice(-3):[];return costs.length?Math.round(costs.reduce((sum,cost)=>sum+cost,0)/costs.length):0;}
  // r87 RE-05 / RS-07: a Showdown's first season starts when Career Start is ready on this phone (noteSeasonStart, key
  // "rivalryId|1"). What this phone billed before it (Home, the pair wait and JOIN, setup, Special Player, Career Start, the
  // previous Showdown's tail) goes to setupCosts and never into a season's cost.
  function fsbNoteSeasonStart(key){
    if(typeof key!=="string"||!key)return false;
    const day=fsbDayState(),bill=day.bill;
    if(bill.startKey===key||day.seasons.includes(key))return false;
    const setup=bill.game-bill.markGame;
    if(setup>0){bill.setupCosts.push(setup);if(bill.setupCosts.length>FSB_DAY_SEASONS)bill.setupCosts.shift();}
    bill.startKey=key;bill.markGame=bill.game;fsbDayUnsaved+=1;fsbSaveDay();
    return true;
  }
  // info (r87): {role, season, rivalryId, firestore} from Season Commit. role is kept for the B1 estimate; with firestore this phone
  // writes its meter document and reads the partner's (fsbShareSeason). Without info (an older caller) nothing is written.
  function fsbNoteSeasonDone(key,live,info){
    if(typeof key!=="string"||!key)return false;
    const day=fsbDayState();
    // Already noted (a reload keeps the season key): no new snapshot, but a meter document written before the reload whose partner
    // read never ran gets that bounded read now (fsbShareResume, once per page).
    if(day.seasons.includes(key)){try{if(info&&typeof info==="object")fsbShareResume(info.firestore);}catch(_error){}return false;}
    const cost=day.reads-day.markReads;
    day.seasons.push(key);if(day.seasons.length>FSB_DAY_SEASONS)day.seasons.shift();
    // A commit first seen already ACKNOWLEDGED (a reload, an older season) only moves the mark: its cost is unknown.
    if(live===true&&cost>0){day.costs.push(cost);if(day.costs.length>FSB_DAY_SEASONS)day.costs.shift();}
    const bill=day.bill,billed=bill.game-bill.markGame,role=fsbShareRole(info&&info.role);
    const season=Number.isInteger(info&&info.season)?info.season:Number(String(key).split("|").pop());
    if(role)bill.role=role;
    // Season 1 counts only from its start mark; without one (a reload during the season) it only moves the mark.
    const steady=season>1||bill.startKey===key;
    if(live===true&&billed>0&&steady){bill.costs.push(billed);if(bill.costs.length>FSB_DAY_SEASONS)bill.costs.shift();}
    bill.markGame=bill.game;bill.startKey=null;
    day.markReads=day.reads;fsbDayUnsaved+=1;fsbSaveDay();
    try{fsbShareSeason(info,season);}catch(_error){}
    return true;
  }
  // r86: a season's cost is this phone's billed GAME reads between two ACKNOWLEDGED seasons (career pages opened meanwhile are
  // not part of it); what is left is the 50,000 less today's use of both phones.
  // r87 (B2): from both phones' meter documents, a season costs the two phones' recent season costs added up (each phone's average
  // of its last three, fsbShareFrom), the same on both phones. Without them (estimated) it is this phone's cost over its role's share.
  function fsbSeasonsLeftToday(){
    const day=fsbDayState(),bill=day.bill,shared=fsbShareFrom(bill.own,bill.partner,day.day);
    if(shared)return Object.freeze({seasons:fsbPaused()?0:shared.seasons,basis:"shared",estimated:false,season:shared.season,billedPerSeason:shared.perSeason,billedLeft:shared.left,billedToday:shared.used});
    const share=fsbRoleShare(bill.role),measured=fsbBillCost(bill),perPhone=measured||bill.lastCost||FSB_DEFAULT_SEASON_BILLED;
    const perSeason=perPhone/share,used=bill.game/share+bill.career,left=Math.max(0,FSB_FREE_READS_PER_DAY-used);
    return Object.freeze({seasons:fsbPaused()?0:Math.floor(left/perSeason),basis:measured?"today":bill.lastCost?"earlier":"estimate",estimated:true,season:null,billedPerSeason:Math.round(perSeason),billedLeft:Math.round(left),billedToday:Math.round(used)});
  }

  // r87 shared reads meter (B2). Each phone writes ONE small document, rivalries/{rid}/meters/{its role}, once a season when it
  // sees the season commit ACKNOWLEDGED: today's billed game and career reads of this phone (cumulative, Pacific day) and its last
  // three season costs. It reads the partner's document once, 8 s later (the partner sees the same ACKNOWLEDGED within seconds),
  // and once more 45 s later only if that document is not yet at the same season. Both phones then hold the same two documents and
  // compute the same total, cost per season and seasons left from them (fsbShareFrom orders them by role). Cost: one write (1 Rules
  // lookup: the rivalry) and one read (1 document + 1 lookup; 2 once the Showdown is Terminal-Closed, when the final season's read
  // lands) per phone per season, billed as game reads here. A refused first write of the day (Rules not deployed yet) stops the
  // meter for the day; a refused read, or a write refused after one succeeded, skips only that season; the partner's document missing (an older build never writes it), from another day,
  // or behind this phone's season: the B1 estimate, marked estimated. Never part of a game write, never a reason for an error.
  // Reads of the partner's document: 8 s after this phone's write, again 45 s later; a partner whose document exists but is behind
  // (a phone that was locked when the season was acknowledged) is read again at +3 and +10 min, then not again that season. A
  // missing document (an older build, or Rules not deployed) is read twice only.
  // B1 shares of a season's reads, measured on the CE2PG harness (READS_ESTIMATE_CONSISTENCY.md): the coordinator (Daniel, playerOne)
  // starts, locks and commits, so his phone reads about 55%.
  const FSB_ROLE_SHARE=Object.freeze({playerOne:0.55,playerTwo:0.45});
  const FSB_SHARE_READS_MS=Object.freeze([8000,45000,180000,600000]),FSB_SHARE_MISSING_READS=2;
  let fsbShareTimer=null,fsbShareOffDay=null,fsbRawSdk=null,fsbShareStarted=null;
  function fsbShareRole(role){return role==="playerOne"||role==="playerTwo"?role:null;}
  function fsbRoleShare(role){return FSB_ROLE_SHARE[role]||0.5;}
  function fsbShareWhole(value,max){return Number.isInteger(value)&&value>=0&&value<=max;}
  // A meter document as the Rules allow it (updatedAt aside), or null.
  function fsbShareClean(value){
    if(!value||typeof value!=="object")return null;
    const out={schemaVersion:value.schemaVersion,objectType:value.objectType,rivalryId:value.rivalryId,role:value.role,day:value.day,season:value.season,game:value.game,career:value.career,costs:Array.isArray(value.costs)?value.costs.slice():null};
    if(out.schemaVersion!==1||out.objectType!=="readsMeter"||typeof out.rivalryId!=="string"||!/^pair_[0-9a-f]{64}$/.test(out.rivalryId)||!fsbShareRole(out.role))return null;
    if(typeof out.day!=="string"||!/^20\d{2}-\d{2}-\d{2}$/.test(out.day)||!Number.isInteger(out.season)||out.season<1||out.season>10)return null;
    if(!fsbShareWhole(out.game,1000000)||!fsbShareWhole(out.career,1000000)||!out.costs||out.costs.length>3||!out.costs.every(cost=>Number.isInteger(cost)&&cost>0&&cost<=100000))return null;
    return Object.freeze({...out,costs:Object.freeze(out.costs)});
  }
  function fsbShareUsed(doc){return doc.game+doc.career;}
  function fsbShareCost(doc){return doc.costs.length?Math.round(doc.costs.reduce((sum,cost)=>sum+cost,0)/doc.costs.length):FSB_DEFAULT_SEASON_BILLED;}
  // Pure: the both-phones figures from the two documents, or null when they are not today's documents of the two roles of one
  // rivalry at one season. Ordered by role, so either phone (and either argument order) gives the same answer.
  function fsbShareFrom(a,b,today){
    const x=fsbShareClean(a),y=fsbShareClean(b);
    if(!x||!y||x.role===y.role||x.day!==today||y.day!==today||x.rivalryId!==y.rivalryId||x.season!==y.season)return null;
    const one=x.role==="playerOne"?x:y,two=x.role==="playerOne"?y:x;
    const used=fsbShareUsed(one)+fsbShareUsed(two),perSeason=fsbShareCost(one)+fsbShareCost(two),left=Math.max(0,FSB_FREE_READS_PER_DAY-used);
    return Object.freeze({used,perSeason,left,seasons:Math.floor(left/perSeason),season:one.season,playerOne:fsbShareUsed(one),playerTwo:fsbShareUsed(two)});
  }
  // This phone's document now: its last three season costs, or the cost it carries from an earlier day when none is measured yet.
  function fsbShareDoc(bill,day,rivalryId,season,role){
    const costs=bill.costs.slice(-3).map(cost=>Math.min(100000,Math.round(cost))).filter(cost=>cost>0);
    if(!costs.length&&bill.lastCost>0)costs.push(Math.min(100000,Math.round(bill.lastCost)));
    return fsbShareClean({schemaVersion:1,objectType:"readsMeter",rivalryId,role,day,season,game:Math.min(1000000,Math.round(bill.game)),career:Math.min(1000000,Math.round(bill.career)),costs});
  }
  // The raw (unmetered) getDoc/setDoc: the runtime's SDK when it has them (tests), otherwise the Firestore module the listeners
  // load from the runtime's own URL (one SDK instance). Billed here by hand, as game reads.
  async function fsbShareApi(){
    const usable=api=>api&&typeof api.doc==="function"&&typeof api.getDoc==="function"&&typeof api.setDoc==="function"&&typeof api.serverTimestamp==="function"?api:null;
    if(usable(fsbRawSdk))return fsbRawSdk;
    if(!usable(fsbSnapshotApi))await fsbLoadSnapshotApi();
    return usable(fsbSnapshotApi);
  }
  function fsbShareSeason(info,season){
    if(!info||typeof info!=="object"||!info.firestore||typeof info.rivalryId!=="string")return;
    const day=fsbDayState(),bill=day.bill,role=fsbShareRole(info.role);
    if(!role||fsbShareOffDay===day.day||fsbPaused())return;
    const doc=fsbShareDoc(bill,day.day,info.rivalryId,season,role);
    if(!doc)return;
    void fsbShareWrite(info.firestore,doc).then(written=>{if(written)fsbShareLater(info.firestore,doc,0);},()=>{});
  }
  async function fsbShareWrite(db,doc){
    const api=await fsbShareApi();
    if(!api)return false;
    const path=`rivalries/${doc.rivalryId}/meters/${doc.role}`;
    try{await api.setDoc(api.doc(db,"rivalries",doc.rivalryId,"meters",doc.role),{...doc,costs:[...doc.costs],updatedAt:api.serverTimestamp()});}
    // Refused before any write succeeded today: the Rules are not deployed yet, so the meter is off for the day. Refused after one
    // succeeded (a Showdown closed under this write): only this season is skipped.
    catch(error){if(fsbMeterFailureUnits(error))fsbBill(fsbWriteLookups([path]));const now=fsbDayState();if(fsbIsDeniedError(error)&&!(now.day===doc.day&&now.bill.own))fsbShareOffDay=doc.day;if(fsbIsQuotaError(error))fsbTrip();return false;}
    fsbBill(fsbWriteLookups([path]));
    const day=fsbDayState();if(day.day===doc.day){day.bill.own=doc;fsbDayUnsaved+=1;fsbSaveDay();}
    fsbShareStarted=fsbShareKey(doc);
    return true;
  }
  function fsbShareKey(doc){return `${doc.day}|${doc.rivalryId}|${doc.season}`;}
  // PR #1097 review: a reload between this phone's meter write and the partner read loses the read's timer while the saved day keeps
  // the own document and the season key (so noteSeasonDone returns early). This restarts the same bounded read sequence for the
  // restored document, once per page, without writing it again; nothing when the partner's document already matches.
  function fsbShareResume(db){
    if(!db||fsbShareTimer!==null)return false;
    const day=fsbDayState(),own=day.bill.own,partner=day.bill.partner;
    if(!own||own.day!==day.day||fsbShareOffDay===day.day||fsbPaused())return false;
    if(partner&&partner.rivalryId===own.rivalryId&&partner.season>=own.season)return false;
    const key=fsbShareKey(own);
    if(fsbShareStarted===key)return false;
    fsbShareStarted=key;fsbShareLater(db,own,0);
    return true;
  }
  function fsbShareLater(db,own,attempt){
    if(fsbShareTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(fsbShareTimer);
    fsbShareTimer=null;
    if(typeof root.setTimeout!=="function"||attempt>=FSB_SHARE_READS_MS.length)return;
    fsbShareTimer=root.setTimeout(()=>{fsbShareTimer=null;void fsbShareRead(db,own).then(({doc,seen,stop})=>{
      if(stop||(doc&&doc.season===own.season&&doc.rivalryId===own.rivalryId))return;
      if(!seen&&attempt+1>=FSB_SHARE_MISSING_READS)return;
      fsbShareLater(db,own,attempt+1);
    },()=>{});},FSB_SHARE_READS_MS[attempt]);
  }
  async function fsbShareReadPartner(db,own){return (await fsbShareRead(db,own)).doc;}
  // {doc: today's partner document or null, seen: a partner document exists (any day), stop: nothing more to read this season}.
  async function fsbShareRead(db,own){
    const day=fsbDayState();
    if(fsbShareOffDay===day.day||fsbPaused()||!own||day.bill.own!==own)return {doc:null,seen:false,stop:true};
    const api=await fsbShareApi();
    if(!api)return {doc:null,seen:false,stop:true};
    const role=own.role==="playerOne"?"playerTwo":"playerOne",path=`rivalries/${own.rivalryId}/meters/${role}`,lookups=fsbReadLookups(path);
    let snapshot;
    try{snapshot=await api.getDoc(api.doc(db,"rivalries",own.rivalryId,"meters",role));}
    catch(error){fsbCountRead(fsbMeterFailureUnits(error),false,lookups);const denied=fsbIsDeniedError(error),quota=fsbIsQuotaError(error);if(quota)fsbTrip();return {doc:null,seen:false,stop:denied||quota};}
    const units=fsbMeterUnits(snapshot);fsbCountRead(units,false,units?lookups:0);
    let doc=null;try{doc=snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?fsbShareClean(snapshot.data()):null;}catch(_error){doc=null;}
    const now=fsbDayState(),seen=Boolean(doc&&doc.role===role&&doc.rivalryId===own.rivalryId);
    if(seen&&doc.day===now.day){now.bill.partner=doc;fsbDayUnsaved+=1;fsbSaveDay();return {doc,seen,stop:doc.season>own.season};}
    return {doc:null,seen,stop:false};
  }

  // r85 (audit F04): ONE read meter. Before, only this layer's transactions and listener deliveries were counted, while the
  // career marker, the career index, the finished-Showdown reader and the Season Final history called getDoc taken straight
  // from the SDK: a cold career visit of 100 finished Showdowns made 601 gets and left readsToday at 0. Now every route ends
  // in fsbMeterUnits/fsbMeterFailureUnits -> fsbCountRead:
  //  - transactions run through this layer: one per document the server returns to the transaction (unchanged);
  //  - direct getDoc/getDocs/getDocFromServer/getDocsFromServer: services(...) meters them when the runtime hands them out,
  //    and every module that takes them from the Firestore module itself passes them through meterSdk(...) first;
  //  - listeners: this layer's own (wait point, context) and the unowned ones (season-commit wait context, Home JOIN note,
  //    which pass their onSnapshot through meterSdk) count each delivery here.
  // What is counted is REQUESTED SERVER DOCUMENT READS, the unit of the free daily limit:
  //  - a document from the server: 1 (a missing document is still one read);
  //  - a query answer from the server: 1 per returned document, at least 1 (an empty answer is billed one read); a later
  //    delivery of a query listener: 1 per changed document;
  //  - a snapshot served from the local cache (metadata.fromCache) or a listener's echo of this page's own pending write: 0;
  //  - a request the server answered with an error (denied by Rules, invalid, not found...): 1, as Firestore bills it; one that
  //    never got an answer (offline/unavailable, cancelled, deadline, quota) or failed in the page before the SDK sent it: 0.
  // Each function is metered once (fsbMetered), so an SDK object handed through several screens never counts a read twice.
  // Direct gets count toward today's total but not the brake window, so a long cold career visit never slows the live checks.
  // The count stays a per-device estimate: Rules lookups (the 2.8 factor), the partner's phone and other devices are not seen.
  const FSB_ANSWERED_ERRORS=new Set(["permission-denied","unauthenticated","invalid-argument","not-found","failed-precondition","out-of-range","already-exists","internal","data-loss","unimplemented"]);
  const fsbMetered=new WeakSet(),fsbMeteredSdks=new WeakMap();
  function fsbMeterUnits(snapshot,listener=false,later=false){
    if(!snapshot||typeof snapshot!=="object")return 0;
    const meta=snapshot.metadata;
    if(meta&&meta.fromCache===true)return 0;
    if(listener&&meta&&meta.hasPendingWrites===true)return 0;
    if(Array.isArray(snapshot.docs)){
      if(later&&typeof snapshot.docChanges==="function"){try{return snapshot.docChanges().length;}catch(_error){return 0;}}
      return Math.max(1,snapshot.docs.length);
    }
    return 1;
  }
  function fsbMeterFailureUnits(error){
    if(!error||typeof error!=="object"||error.quotaPaused)return 0;
    return FSB_ANSWERED_ERRORS.has(String(error.code||"").toLowerCase().replace(/^firestore\//,"").replace(/_/g,"-"))?1:0;
  }
  // Red team R87-B-06: a direct get (career index, summaries) that hits the daily quota trips the same online-play pause as a
  // transaction, so Home shows the notice and nothing keeps asking.
  function fsbGetFailed(error,lookups){fsbStats.directFailures+=1;fsbCountRead(fsbMeterFailureUnits(error),false,lookups,true);if(fsbIsQuotaError(error))fsbTrip();}
  function fsbMeterGet(get){
    if(typeof get!=="function"||fsbMetered.has(get))return get;
    const metered=function(...args){
      let pending;
      const lookups=fsbReadLookups(fsbPathOf(args[0]),true);
      try{pending=get.apply(this,args);}catch(error){fsbGetFailed(error,lookups);throw error;}
      return Promise.resolve(pending).then(snapshot=>{const units=fsbMeterUnits(snapshot);fsbStats.directReads+=units;fsbCountRead(units,false,lookups,true);return snapshot;},error=>{fsbGetFailed(error,lookups);throw error;});
    };
    fsbMetered.add(metered);
    return metered;
  }
  // onSnapshot(ref, [options], observer | onNext, [onError], [onCompletion]): the callbacks are wrapped, the call is unchanged.
  function fsbMeterListen(listen){
    if(typeof listen!=="function"||fsbMetered.has(listen))return listen;
    const metered=function(ref,...rest){
      let served=false;const path=fsbPathOf(ref);
      const next=fn=>function(snapshot){const units=fsbMeterUnits(snapshot,true,served),first=!served;if(units||snapshot&&snapshot.metadata&&snapshot.metadata.fromCache===false)served=true;fsbCountRead(units,true,first||units?fsbReadLookups(path):0);return fn.apply(this,arguments);};
      const fail=fn=>function(error){fsbCountRead(fsbMeterFailureUnits(error),true,served?0:fsbReadLookups(path));return fn.apply(this,arguments);};
      let functions=0;
      const args=rest.map(arg=>{
        if(typeof arg==="function"){functions+=1;return functions===1?next(arg):functions===2?fail(arg):arg;}
        if(functions===0&&arg&&typeof arg==="object"&&(typeof arg.next==="function"||typeof arg.error==="function")){
          const observer={...arg};if(typeof arg.next==="function")observer.next=next(arg.next.bind(arg));if(typeof arg.error==="function")observer.error=fail(arg.error.bind(arg));if(typeof arg.complete==="function")observer.complete=arg.complete.bind(arg);
          functions=3;return observer;
        }
        return arg;
      });
      return listen.call(this,ref,...args);
    };
    fsbMetered.add(metered);
    return metered;
  }
  // r86: a single setDoc/updateDoc outside this layer's transactions (the career summary a career page saves) is one write
  // request; its Rules lookups count toward today's career-page reads.
  function fsbMeterWrite(write){
    if(typeof write!=="function"||fsbMetered.has(write))return write;
    const metered=function(ref,...rest){
      const path=fsbPathOf(ref);
      return Promise.resolve(write.call(this,ref,...rest)).then(value=>{fsbBill(fsbWriteLookups([path]),true);return value;},error=>{if(fsbMeterFailureUnits(error))fsbBill(fsbWriteLookups([path]),true);throw error;});
    };
    fsbMetered.add(metered);
    return metered;
  }
  const FSB_METERED_GETS=["getDoc","getDocs","getDocFromServer","getDocsFromServer"],FSB_METERED_WRITES=["setDoc","updateDoc"];
  function fsbMeterSdk(sdk){
    if(!sdk||typeof sdk!=="object"&&typeof sdk!=="function")return sdk;
    if(fsbMeteredSdks.has(sdk))return fsbMeteredSdks.get(sdk);
    const names=[...FSB_METERED_GETS,...FSB_METERED_WRITES,"onSnapshot"].filter(name=>typeof sdk[name]==="function"&&!fsbMetered.has(sdk[name]));
    if(!names.length)return sdk;
    const out={...sdk};
    for(const name of names)out[name]=name==="onSnapshot"?fsbMeterListen(sdk[name]):FSB_METERED_WRITES.includes(name)?fsbMeterWrite(sdk[name]):fsbMeterGet(sdk[name]);
    const frozen=Object.freeze(out);
    try{fsbMeteredSdks.set(sdk,frozen);fsbMeteredSdks.set(frozen,frozen);}catch(_error){}
    return frozen;
  }

  function fsbNow(){return Date.now();}
  function fsbPathOf(ref){return ref&&typeof ref.path==="string"?ref.path:"";}
  function fsbIsQuotaError(error){
    for(let item=error,depth=0;item&&typeof item==="object"&&depth<3;item=item.cause,depth+=1){
      const code=String(item.code||"").toLowerCase(),message=String(item.message||"");
      if(code==="resource-exhausted"||code==="resource_exhausted"||/resource[-_ ]exhausted|quota (?:has been )?exceeded/i.test(message))return true;
    }
    return false;
  }
  function fsbIsDeniedError(error){
    for(let item=error,depth=0;item&&typeof item==="object"&&depth<3;item=item.cause,depth+=1){
      const code=String(item.code||"").toLowerCase();
      if(code==="permission-denied"||code==="permission_denied"||code==="unauthenticated")return true;
    }
    return false;
  }
  // A denied read or write means this account or device may have lost its authority (revoked elsewhere): the pairing check
  // re-verifies the device on its next run instead of trusting its 10 minutes. A denied write, or a denied read of this
  // account, this device or the rivalry root, forgets everything this page kept. r86 red team #20: a denied read of any other
  // document (a Session after its Showdown closed, say) still forgets every shared copy and drops the context listeners, so
  // the next reads come from the server (Terminal Close's race check relies on a fresh rivalry read after a refused Session),
  // but keeps this account's and the settled copies, and backs off reading that document for 15 s, then 1 min, then 5 min
  // (a tap reads it again at once). Any shared document seen changed lifts every back-off, so a document the partner's move
  // makes readable is read at once. Before, one document that stayed refused sent every background check to the server on
  // every tick.
  const FSB_DENIED_STEPS_MS=[15000,60000,300000],fsbDenied=new Map();
  function fsbAuthorityPath(path){return !path||fsbOwnAccountPath(path)||/^rivalries\/[^/]+$/.test(path);}
  function fsbAuthorityDenied(error,path){
    if(!fsbIsDeniedError(error))return;
    if(fsbAuthorityPath(path)){fsbEntries.clear();fsbInflight.clear();fsbCtxDetach();}
    else{
      const at=fsbNow(),prev=fsbDenied.get(path),last=FSB_DENIED_STEPS_MS.length-1,step=prev&&at-prev.until<FSB_DENIED_STEPS_MS[last]?Math.min(prev.step+1,last):0;
      fsbDenied.delete(path);fsbDenied.set(path,{until:at+FSB_DENIED_STEPS_MS[step],step,error});
      if(fsbDenied.size>FSB_MAX_ENTRIES)fsbDenied.delete(fsbDenied.keys().next().value);
      fsbEntries.delete(path);if(fsbCtxWatches.has(path))fsbCtxDrop(path,true);
      for(const [other,entry] of fsbEntries)if(!fsbOwnAccountPath(other)&&!entry.immutable)entry.forgotten=true;
      fsbInflight.clear();fsbCtxDetach();
    }
    try{if(typeof root.dispatchEvent==="function"&&typeof root.CustomEvent==="function")root.dispatchEvent(new root.CustomEvent("career-mode-firestore-authority-denied"));}catch(_error){}
  }
  function fsbPaused(){return Boolean(fsbPause&&fsbNow()<fsbPause.until);}
  function fsbQuotaError(){fsbStats.pausedRefusals+=1;const error=new Error(FSB_QUOTA_MESSAGE);error.code="resource-exhausted";error.quotaPaused=true;return error;}
  function fsbQuotaMessage(error){return fsbPaused()||(error!==undefined&&fsbIsQuotaError(error))?FSB_QUOTA_MESSAGE:null;}
  function fsbState(){const paused=fsbPaused();return Object.freeze({paused,until:fsbPause?fsbPause.until:null,step:fsbPause?fsbPause.step:null,message:paused?FSB_QUOTA_MESSAGE:null});}
  function fsbPublish(){
    const state=fsbState();
    try{const html=root.document&&root.document.documentElement;if(html&&html.dataset){if(state.paused)html.dataset.firestoreQuota="paused";else delete html.dataset.firestoreQuota;}}catch(_error){}
    try{if(typeof root.dispatchEvent==="function"&&typeof root.CustomEvent==="function")root.dispatchEvent(new root.CustomEvent("career-mode-firestore-quota",{detail:state}));}catch(_error){}
  }
  function fsbTrip(){
    if(fsbPaused())return;
    const at=fsbNow(),recent=fsbPause&&at-fsbPause.until<2*60*60000;
    const step=recent?Math.min(fsbPause.step+1,FSB_PAUSE_STEPS_MS.length-1):0;
    fsbPause=Object.freeze({step,since:at,until:at+FSB_PAUSE_STEPS_MS[step]});
    fsbStats.quotaTrips+=1;
    fsbEntries.clear();
    fsbDetachWait();fsbCtxDetach();
    if(fsbResumeTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(fsbResumeTimer);
    // One timer per pause, only to tell the screens that online play may resume; it reads nothing itself.
    fsbResumeTimer=typeof root.setTimeout==="function"?root.setTimeout(()=>{fsbResumeTimer=null;fsbPublish();},FSB_PAUSE_STEPS_MS[step]+50):null;
    fsbPublish();
  }
  function fsbHidden(){return Boolean(root.document&&root.document.visibilityState==="hidden");}
  // Documents the Rules make immutable once settled are kept: a season's published results (revision 2) and each manager's
  // published result (create-only), and a season commit once ACKNOWLEDGED (revision 3). None of them can be updated or
  // deleted again, so the history of past seasons is read once per page instead of on every check.
  function fsbImmutable(path,snapshot){
    try{
      if(!snapshot||typeof snapshot.exists!=="function"||!snapshot.exists())return false;
      if(/^rivalries\/[^/]+\/seasonResults\/[^/]+\/roles\/[^/]+$/.test(path))return true;
      const value=snapshot.data();
      if(/^rivalries\/[^/]+\/seasonResults\/[^/]+$/.test(path))return Boolean(value&&value.revision===2);
      if(/^rivalries\/[^/]+\/seasonCommits\/[^/]+$/.test(path))return Boolean(value&&value.phase==="ACKNOWLEDGED"&&value.revision===3);
      // r84: a confirmed setup (revision 6 is the last) and a ready Career Start (revision 2 is the last) never change again.
      if(/^rivalries\/[^/]+\/sharedSetup\/authoritative$/.test(path))return Boolean(value&&value.schemaVersion===1&&value.objectType==="sharedSetupLedger"&&value.revision===6&&value.phase==="SHOWDOWN_CONFIRMED");
      if(/^rivalries\/[^/]+\/careerStart\/authoritative$/.test(path))return Boolean(value&&value.schemaVersion===1&&value.objectType==="sharedCareerStart"&&value.revision===2&&value.phase==="CAREER_START_READY");
      // r86 red team #18: the league projection is create-only, and a COMPLETED season transfer has no further transition
      // (every update needs WINDOW_OPEN, GUESS_ENTRY or SIGNING_ENTRY before it) and cannot be deleted.
      if(/^rivalries\/[^/]+\/sharedSetup\/leagueProjection$/.test(path))return true;
      if(/^rivalries\/[^/]+\/transferChallenges\/[^/]+$/.test(path))return Boolean(value&&value.phase==="COMPLETED");
    }catch(_error){}
    return false;
  }
  // r86 red team #18: this account's own documents (account, this device) keep their 5-minute reuse across a return: a revoked
  // device or account is refused by the Rules on the next shared read, which forgets everything (fsbAuthorityDenied).
  // Before, every phone unlock re-read both, once per module that checks them.
  function fsbForgetAll(){fsbDenied.clear();for(const [path,entry] of [...fsbEntries])if(!entry.immutable&&!fsbOwnAccountPath(path))fsbEntries.delete(path);}
  if(typeof root.addEventListener==="function"){
    try{
      root.addEventListener("online",fsbForgetAll);
      root.addEventListener("pageshow",fsbForgetAll);
      if(root.document&&typeof root.document.addEventListener==="function"){
        // Back from hidden: forget what this page had and wake once every screen that was waiting on the partner when it
        // was hidden, so it catches up with one check now instead of on its next timer (no new timer, no repeated reads).
        root.document.addEventListener("visibilitychange",()=>{if(fsbHidden()){if(fsbCtxWatches.size)fsbCtxReturn=[...fsbCtxWatches.keys()];fsbWaitReturn=fsbWait&&fsbWait.healthy?{path:fsbWait.path,owners:[...fsbWait.owners].map(([owner,info])=>({owner,wake:info.wake,relaxed:info.relaxed}))}:null;fsbDetachWait();fsbCtxDetach();fsbWasHidden=true;return;}fsbForgetAll();fsbChainAt=fsbNow();if(fsbWasHidden){fsbListenReturning();fsbCtxReturning();fsbWaitReturning();}fsbWasHidden=false;fsbWakeReturning();});
        // A tap or key press means someone is acting now: for the next 5 s every check reads fresh (2 s coalescing only).
        for(const type of ["pointerdown","touchstart","keydown"])root.document.addEventListener(type,()=>{fsbInputAt=fsbNow();},{capture:true,passive:true});
        root.document.addEventListener("visibilitychange",()=>{if(root.document.visibilityState==="hidden")fsbSaveDay();});root.addEventListener?.("pagehide",fsbSaveDay);
      }
    }catch(_error){}
  }
  function fsbOwnAccountPath(path){
    if(!fsbAccountId)return false;
    const prefix=`accounts/${fsbAccountId}`;
    return path===prefix||(path.startsWith(`${prefix}/devices/`)&&path.split("/").length===4);
  }
  // A document asked for again 2-6 s after the previous ask, twice in a row, belongs to a fast check (pairing, joining,
  // history...): it reads fresh for the next 10 s even if that check never told the budget layer it is waiting.
  function fsbNoteAsk(path,at){
    const cadence=fsbCadence.get(path)||{last:0,run:0,fastUntil:0};
    const gap=at-cadence.last;
    if(gap>=FSB_COALESCE_MS){cadence.run=gap<=FSB_FAST_GAP_MS?cadence.run+1:0;cadence.last=at;}
    if(cadence.run>=2)cadence.fastUntil=at+FSB_FAST_HOLD_MS;
    fsbCadence.delete(path);fsbCadence.set(path,cadence);
    if(fsbCadence.size>FSB_MAX_ENTRIES)fsbCadence.delete(fsbCadence.keys().next().value);
    return cadence.fastUntil>at;
  }
  // Quiet reuse is for a settled pair only: a rivalry root that is still pending (or in any state other than active or
  // closed) is read fresh, so a partner's pairing is seen as soon as the screen checks.
  function fsbSettled(path,snapshot){
    if(!/^rivalries\/[^/]+$/.test(path))return true;
    try{const value=snapshot&&snapshot.exists()?snapshot.data():null;const state=value&&value.data&&value.data.connectionState;return state==="active"||state==="closed";}catch(_error){return false;}
  }
  function fsbReuseLimit(path,at,fast,snapshot){
    const limit=fsbReuseLimitNormal(path,at,fast,snapshot);
    return limit<FSB_BRAKE_REUSE_MS&&fsbBraking(at)?FSB_BRAKE_REUSE_MS:limit;
  }
  function fsbReuseLimitNormal(path,at,fast,snapshot){
    if(fsbOwnAccountPath(path))return FSB_OWN_ACCOUNT_MS;
    if(at-fsbInputAt<FSB_INPUT_FRESH_MS||at-fsbFreshAskAt<FSB_ASK_MS||(fsbFreshPaths.get(path)||0)>at||!fsbSettled(path,snapshot))return FSB_COALESCE_MS;
    // A screen waiting on the partner reads its waited document fresh unless the healthy listener watches exactly it.
    // r84: only that document. Every other document keeps the quiet reuse below; a fresh read that shows the waited
    // document changed forgets them all (fsbRemember), as a listener delivery does. Before, a dead listener made every
    // background check read fresh: ~60 reads/min per device for as long as the wait lasted.
    const live=fsbWaitLive();
    for(const [owner,ask] of fsbWaitAsks){
      if(at-ask.at>=FSB_ASK_MS){fsbWaitAsks.delete(owner);continue;}
      if(ask.path===path&&!(live&&fsbWait&&ask.path===fsbWait.path))return FSB_COALESCE_MS;
    }
    // r84: while a healthy listener watches the screen's document, a partner's move reaches this page through it and its
    // delivery forgets every other copy (fsbRemember), so those copies are kept for 5 min instead of 1. Measured on the
    // Transfer screen waiting on the partner, a 2 min reuse re-read the whole context every 2 min: ~40 billed reads/min.
    if(live)return FSB_LIVE_QUIET_MS;
    return fast?FSB_COALESCE_MS:FSB_QUIET_MS;
  }
  // Returns {snapshot,old} or null. old: the copy is older than the 2 s burst window (see fsbProbe's fresh re-run).
  function fsbWaitAskedPath(path,at){for(const ask of fsbWaitAsks.values())if(ask.path===path&&at-ask.at<FSB_ASK_MS)return true;return false;}
  function fsbReusable(path){
    const at=fsbNow(),fast=path?fsbNoteAsk(path,at):false;
    // r80: a listener known to be behind a server read this page already made (lagUntil) never answers: the newer
    // server copy does (or the server). Otherwise a write's bounded stale retry re-read the older copy and failed again.
    if(fsbWait&&path===fsbWait.path&&fsbWaitLive()&&!fsbWait.lagUntil){if(!fsbWaitHealthy())return null;fsbStats.listenerServed+=1;return {snapshot:fsbWait.snapshot,old:false};}
    const watched=fsbCtxServe(path);if(watched){fsbStats.contextServed+=1;return {snapshot:watched,old:false};}
    const entry=fsbEntries.get(path);
    if(entry&&entry.immutable&&!entry.dirty){fsbStats.immutableReuses+=1;return {snapshot:entry.snapshot,old:false};}
    if(!entry||entry.dirty||entry.forgotten)return null;
    const age=at-entry.at;
    // A hidden page renders nothing, so its background checks reuse what it already has; becoming visible forgets it all.
    if(fsbHidden())return {snapshot:entry.snapshot,old:age>FSB_COALESCE_MS};
    // Not for a rivalry that is still pending its pair or close, nor for a document a screen asked to read fresh.
    const chained=fsbChainAt>0&&at-fsbChainAt<FSB_CHAIN_MS&&entry.at>=fsbChainAt&&!((fsbFreshPaths.get(path)||0)>at)&&fsbSettled(path,entry.snapshot);
    if(!chained&&age>fsbReuseLimit(path,at,fast,entry.snapshot))return null;
    const old=!chained&&age>FSB_COALESCE_MS&&!fsbOwnAccountPath(path);
    if(old)fsbStats.quietReuses+=1;
    return {snapshot:entry.snapshot,old};
  }
  function fsbRemember(db,ref,snapshot){
    if(db!==fsbFirestore)return;
    const path=fsbPathOf(ref);
    if(!path)return;
    const before=fsbEntries.get(path);
    fsbEntries.delete(path);
    const entry={snapshot,at:fsbNow(),dirty:false,immutable:fsbImmutable(path,snapshot)};
    fsbEntries.set(path,entry);
    if(before&&!fsbOwnAccountPath(path)&&fsbSerial(before.snapshot)!==fsbSerial(snapshot))fsbDenied.clear();
    if(fsbWait&&path===fsbWait.path)fsbWaitServerRead(snapshot);
    fsbCtxServerRead(path,snapshot);
    // r84: a waited document read fresh (no healthy listener on it) that changed is the partner's move: forget the other
    // copies and start the chain, exactly like fsbWaitDelivery, so no screen acts on a copy older than that move.
    if(before&&!before.dirty&&!(fsbWait&&path===fsbWait.path&&fsbWaitLive())&&fsbWaitAskedPath(path,entry.at)&&fsbSerial(before.snapshot)!==fsbSerial(snapshot)){fsbForgetContext();entry.forgotten=false;fsbChainAt=entry.at;}
    if(fsbEntries.size>FSB_MAX_ENTRIES)fsbEntries.delete(fsbEntries.keys().next().value);
  }
  function fsbMarkWritten(db,paths){if(db!==fsbFirestore)return;for(const path of paths){const entry=fsbEntries.get(path);if(entry)entry.dirty=true;if(fsbWait&&fsbWait.path===path)fsbWait.dirty=true;const watch=fsbCtxWatches.get(path);if(watch)watch.dirty=true;}}

  // r84 trim: context listeners. While a shared Showdown is open (watchContext(rivalryId), asked by Terminal Close), the rivalry
  // root and the Session document this page reads are each watched by one listener instead of being re-read by every check
  // and by the 45 s END SHOWDOWN poll. Both change only a few times per season (a season accepted, a close, a join or expiry),
  // so a change reaches this page at once and costs one read; a check reads them from the listener while the server confirmed
  // the copy in the last 3 min (a delivery or a server read with the same content confirms it), otherwise from the server as before.
  // Hidden page, quota pause, denied read, account or database change: the listeners stop and every read goes to the server.
  const FSB_CTX_CONFIRM_MS=180000,FSB_CTX_RETRY_MS=60000;
  const fsbCtxWatches=new Map(),fsbCtxFailed=new Map(),fsbExternal=new Set();
  let fsbCtxRivalry=null,fsbCtxReturn=[];
  function fsbCtxDrop(path,failed){const watch=fsbCtxWatches.get(path);fsbCtxWatches.delete(path);if(watch&&typeof watch.unsubscribe==="function"){try{watch.unsubscribe();}catch(_error){}}if(watch&&watch.returning)fsbListened(path,null);if(failed){fsbStats.listenerFallbacks+=1;fsbCtxFailed.set(path,fsbNow()+FSB_CTX_RETRY_MS);}}
  function fsbCtxDetach(){for(const path of [...fsbCtxWatches.keys()])fsbCtxDrop(path,false);}
  function fsbCtxWanted(path){
    const rivalryId=fsbCtxRivalry&&fsbCtxRivalry.rivalryId;
    if(!rivalryId||typeof path!=="string")return false;
    const parts=path.split("/");
    return path===`rivalries/${rivalryId}`||(parts.length===4&&parts[0]==="rivalries"&&parts[1]===rivalryId&&parts[2]==="sessions"&&Boolean(parts[3]));
  }
  function fsbCtxServe(path){
    const watch=fsbCtxWatches.get(path);
    if(!watch||!watch.healthy||watch.dirty||!watch.snapshot)return null;
    return fsbNow()-watch.confirmedAt<=FSB_CTX_CONFIRM_MS?watch.snapshot:null;
  }
  function fsbCtxServerRead(path,snapshot){
    const watch=fsbCtxWatches.get(path);
    if(watch){if(watch.healthy&&fsbSerial(snapshot)===watch.serial)watch.confirmedAt=fsbNow();else if(watch.healthy&&!watch.dirty)watch.healthy=false;return;}
    // r86 red team #18: a document a screen's own authority listener already delivers (Season Commit's wait context) gets no
    // second listener: that listener forgets the copies on any change. Before, each return paid for both listeners.
    if(fsbExternal.has(path))return;
    if(fsbCtxSessionPath(path)&&path!==fsbCtxCurrentSession())return;
    fsbCtxAttach(path);
  }
  // The Session to watch is the one this page read most recently: an older Session still in the copies (a new Session was
  // opened without a reload) is never re-attached, so the current Session listener is not dropped and re-made on each wake.
  function fsbCtxSessionPath(path){return typeof path==="string"&&path.split("/").length===4;}
  function fsbCtxCurrentSession(){
    let best=null,at=-1;
    for(const [path,entry] of fsbEntries)if(fsbCtxWanted(path)&&fsbCtxSessionPath(path)&&entry.at>at){best=path;at=entry.at;}
    return best;
  }
  function fsbCtxDelivery(watch,snapshot){
    if(fsbCtxWatches.get(watch.path)!==watch)return;
    if(!snapshot||!snapshot.metadata||snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites){watch.healthy=false;return;}
    const serial=fsbSerial(snapshot),known=fsbEntries.get(watch.path);
    const before=watch.serial!==null?watch.serial:(known?fsbSerial(known.snapshot):null);
    watch.snapshot=snapshot;watch.serial=serial;watch.healthy=true;watch.dirty=false;watch.confirmedAt=fsbNow();
    fsbStats.listenerDeliveries+=1;fsbCountRead(fsbMeterUnits(snapshot,true),true,fsbReadLookups(watch.path));watch.priced=true;
    fsbEntries.delete(watch.path);fsbEntries.set(watch.path,{snapshot,at:fsbNow(),dirty:false,immutable:false});
    if(watch.returning){watch.returning=false;const listen=fsbListens.get(watch.path);if(listen){fsbListens.delete(watch.path);fsbStats.listenerServed+=1;listen.resolve(snapshot);}}
    if(before!==null&&before!==serial){fsbDenied.clear();fsbChainAt=fsbNow();const wake=fsbCtxRivalry&&fsbCtxRivalry.wake;if(typeof wake==="function"&&typeof root.setTimeout==="function")root.setTimeout(()=>{try{wake(watch.path);}catch(_error){}},0);}
  }
  function fsbCtxAttach(path){
    // r86 red team #19: a document Season Commit's authority listeners watch (fsbReturnPaths) or deliver (fsbExternal) gets
    // no second listener. Measured on a reload: both listened to the rivalry and the Session, 2 documents + 4 lookups more.
    if(!fsbCtxWanted(path)||fsbCtxWatches.has(path)||fsbReturnPaths.includes(path)||fsbExternal.has(path))return;
    const at=fsbNow();
    if(fsbPaused()||fsbHidden()||!fsbFirestore||(fsbCtxFailed.get(path)||0)>at)return;
    const api=fsbSnapshotApi;
    if(!api){fsbLoadSnapshotApi();return;}
    // One Session listener: a newer Session replaces the older one.
    if(path.split("/").length===4)for(const other of [...fsbCtxWatches.keys()])if(other.split("/").length===4)fsbCtxDrop(other,false);
    const watch={path,snapshot:null,serial:null,healthy:false,dirty:false,confirmedAt:0,unsubscribe:null};
    fsbCtxWatches.set(path,watch);fsbStats.listenersAttached+=1;
    try{
      watch.unsubscribe=api.onSnapshot(api.doc(fsbFirestore,path),{includeMetadataChanges:true},snapshot=>fsbCtxDelivery(watch,snapshot),error=>{fsbCountRead(fsbMeterFailureUnits(error),true,watch.priced?0:fsbReadLookups(path));if(fsbCtxWatches.get(path)!==watch)return;fsbCtxDrop(path,true);if(fsbIsQuotaError(error))fsbTrip();});
    }catch(_error){fsbCtxDrop(path,true);}
  }
  // r86 red team #18: back from hidden, the context listeners this page had are attached again at once, and a read of their
  // documents waits up to 5 s for the first server delivery (one read each) instead of every module reading them from the
  // server and the listener then reading them once more. A document an authority listener will deliver (fsbReturnPaths) is left to it.
  // Terminal Close stops the context watch while the page is hidden and asks for it again on return, so the paths wait for
  // that ask (fsbWatchContext) when the context is not set yet.
  function fsbCtxReturning(){
    if(!fsbCtxRivalry||fsbHidden())return;
    const paths=fsbCtxReturn;fsbCtxReturn=[];
    for(const path of paths){
      if(!fsbCtxWanted(path)||fsbReturnPaths.includes(path)||fsbExternal.has(path)||fsbListens.has(path))continue;
      fsbCtxAttach(path);
      const watch=fsbCtxWatches.get(path);if(!watch)continue;
      watch.returning=true;
      const listen={};listen.promise=new Promise(resolve=>{listen.resolve=resolve;});fsbListens.set(path,listen);
      if(typeof root.setTimeout==="function")root.setTimeout(()=>fsbListened(path,null),5000);
    }
  }
  function fsbWatchContext(rivalryId,wake){
    const id=typeof rivalryId==="string"&&/^pair_[0-9a-f]{64}$/.test(rivalryId)?rivalryId:null;
    if(!id){if(!fsbHidden())fsbCtxReturn=[];else if(fsbCtxWatches.size)fsbCtxReturn=[...fsbCtxWatches.keys()];fsbCtxRivalry=null;fsbCtxDetach();return false;}
    if(!fsbCtxRivalry||fsbCtxRivalry.rivalryId!==id){fsbCtxDetach();fsbCtxRivalry={rivalryId:id,wake};}
    else fsbCtxRivalry.wake=wake;
    if(fsbCtxReturn.length)fsbCtxReturning();
    const rootPath=`rivalries/${id}`;if(fsbEntries.has(rootPath))fsbCtxAttach(rootPath);
    const session=fsbCtxCurrentSession();if(session)fsbCtxAttach(session);
    return Boolean(fsbCtxServe(`rivalries/${id}`));
  }

  // Wait-point listener (r75). While a screen waits on the partner it may watch the one shared document the partner's
  // move changes. One listener per page at most. It is dropped when the page is hidden, the screen stops waiting, online
  // play pauses, or the listener errors or falls behind; the screen's own 3 s check keeps running throughout and simply
  // reads from the server again whenever the listener is not healthy. A change seen by the listener wakes the screen at once.
  const FSB_WAIT_CONFIRM_MS=30000,FSB_WAIT_LAG_MS=5000,FSB_WAIT_RETRY_MS=60000,FSB_WAIT_OWNER_MS=4500;
  const fsbWaitFailed=new Map(),fsbReturnWakes=new Map();
  let fsbWaitReturn=null,fsbWait=null,fsbSnapshotApi=null,fsbSnapshotApiPromise=null;
  function fsbStable(value){
    if(value===null||typeof value!=="object")return JSON.stringify(value);
    if(typeof value.toJSON==="function")return fsbStable(value.toJSON());
    if(Array.isArray(value))return `[${value.map(fsbStable).join(",")}]`;
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${fsbStable(value[key])}`).join(",")}}`;
  }
  function fsbSerial(snapshot){try{return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?fsbStable(snapshot.data()):"null";}catch(_error){return null;}}
  function fsbVersion(snapshot){try{const time=snapshot&&snapshot._document&&snapshot._document.version&&snapshot._document.version.timestamp;return time&&Number.isFinite(time.seconds)&&Number.isFinite(time.nanoseconds)?[time.seconds,time.nanoseconds]:null;}catch(_error){return null;}}
  function fsbVersionCompare(a,b){if(!a||!b)return 0;return a[0]!==b[0]?a[0]-b[0]:a[1]-b[1];}
  function fsbLoadSnapshotApi(){
    if(fsbSnapshotApi||fsbSnapshotApiPromise)return fsbSnapshotApiPromise;
    const url=root.CareerModeProductionFirebaseRuntime&&root.CareerModeProductionFirebaseRuntime.firebaseFirestoreModule;
    if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url)||!root.document)return null;
    fsbSnapshotApiPromise=Promise.resolve().then(()=>import(url)).then(module=>{fsbSnapshotApi=module&&typeof module.onSnapshot==="function"&&typeof module.doc==="function"?module:null;},()=>{fsbSnapshotApi=null;});
    return fsbSnapshotApiPromise;
  }
  function fsbWaitLive(){
    const wait=fsbWait;
    if(!wait||!wait.healthy||wait.dirty)return false;
    if(wait.lagUntil&&fsbNow()>wait.lagUntil){fsbWaitFail(wait.path);return false;}
    return true;
  }
  // The watched document itself is served from the listener only if the server confirmed it in the last 30 s.
  function fsbWaitHealthy(){return fsbWaitLive()&&fsbNow()-fsbWait.confirmedAt<=(fsbWaitRelaxed()?FSB_RELAXED_CONFIRM_MS:FSB_WAIT_CONFIRM_MS);}
  function fsbWaitRelaxed(){return Boolean(fsbWait&&fsbWait.owners.size&&[...fsbWait.owners.values()].every(info=>info.relaxed===true));}
  function fsbWaitServerRead(snapshot){
    const wait=fsbWait;
    if(!wait||!wait.healthy)return;
    const version=fsbVersion(snapshot),serial=fsbSerial(snapshot);
    // RS-03 (r87): a server read that returns exactly the listener's copy proves the listener is current, so it may serve again
    // even when this page's own write (or a write that threw) left it dirty without a new delivery.
    if(serial===wait.serial||fsbVersionCompare(version,wait.version)<0){wait.confirmedAt=fsbNow();if(serial===wait.serial)wait.dirty=false;return;}
    // The server has a newer copy than the listener: give the listener a moment to deliver it, otherwise drop it.
    if(!wait.lagUntil){wait.lagUntil=fsbNow()+FSB_WAIT_LAG_MS;wait.lagVersion=version;wait.lagSerial=serial;}
  }
  function fsbDetachWait(){const wait=fsbWait;fsbWait=null;if(wait&&typeof wait.unsubscribe==="function"){try{wait.unsubscribe();}catch(_error){}}if(wait&&wait.returning)fsbListened(wait.path,null);}
  function fsbWaitFail(path){fsbDetachWait();fsbStats.listenerFallbacks+=1;fsbWaitFailed.set(path,fsbNow()+FSB_WAIT_RETRY_MS);}
  // Forgotten copies are never reused, but their content is kept for change detection: a document that is merely forgotten
  // (not changed) must not count as changed, or every later check would re-run on fresh reads and forget again.
  function fsbForgetContext(){fsbDenied.clear();for(const [path,entry] of fsbEntries)if(!fsbOwnAccountPath(path))entry.forgotten=true;}
  function fsbWakeOwners(wait){
    for(const info of wait.owners.values()){
      const wake=info.wake;
      if(typeof wake!=="function")continue;
      if(typeof root.setTimeout==="function")root.setTimeout(()=>{try{wake();}catch(_error){}},0);
      else{try{wake();}catch(_error){}}
    }
  }
  function fsbWakeReturning(){
    for(const wake of fsbReturnWakes.values()){if(typeof root.setTimeout==="function")root.setTimeout(()=>{try{wake();}catch(_error){}},0);}
  }
  function fsbRouletteMarkOnly(path,snapshot){
    try{return /^rivalries\/[^/]+\/transferChallenges\/season_\d+$/.test(String(path||""))&&Boolean(snapshot&&snapshot.exists&&snapshot.exists())&&snapshot.data().phase==="NOT_STARTED";}catch(_error){return false;}
  }
  function fsbWaitDelivery(wait,snapshot){
    if(fsbWait!==wait)return;
    if(!snapshot||!snapshot.metadata||snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites){wait.healthy=false;return;}
    const serial=fsbSerial(snapshot),version=fsbVersion(snapshot);
    const before=wait.serial!==null?wait.serial:fsbSerial(fsbEntries.get(wait.path)&&fsbEntries.get(wait.path).snapshot);
    const changed=before!==null&&before!==serial;
    wait.snapshot=snapshot;wait.serial=serial;wait.version=version;wait.healthy=true;wait.dirty=false;wait.confirmedAt=fsbNow();
    if(wait.lagUntil&&(fsbVersionCompare(version,wait.lagVersion)>=0&&version!==null||serial===wait.lagSerial)){wait.lagUntil=0;wait.lagVersion=null;wait.lagSerial=null;}
    fsbStats.listenerDeliveries+=1;fsbCountRead(fsbMeterUnits(snapshot,true),true,fsbReadLookups(wait.path));wait.priced=true;
    if(wait.returning){wait.returning=false;const listen=fsbListens.get(wait.path);if(listen){fsbListens.delete(wait.path);fsbStats.listenerServed+=1;listen.resolve(snapshot);}}
    // r84 trim: the delivered server copy also becomes this page's copy. Before, a copy marked dirty by this page's own save
    // stayed behind the listener, so the next 30 s server check of the waited document always looked "changed" and re-ran
    // the whole check on fresh reads (about 9 documents) after every lock.
    fsbEntries.delete(wait.path);fsbEntries.set(wait.path,{snapshot,at:fsbNow(),dirty:false,immutable:fsbImmutable(wait.path,snapshot)});
    // r87 RT5-FLOW-02: a partner's roulette mark only adds a role to the season's pre-window Transfer document; no other
    // document can have changed with it, so the waiting screen wakes on the listener's copy without forgetting (and re-reading)
    // the rest of its context. Anything else, including the window opening, forgets as before.
    if(changed){if(!fsbRouletteMarkOnly(wait.path,snapshot)){fsbForgetContext();fsbChainAt=fsbNow();}fsbWakeOwners(wait);}
  }
  // r86 red team #18: back from hidden, the wait listener the page had is attached again at once for the same screens, and a
  // read of its document waits up to 5 s for its first server delivery, instead of the screen reading it from the server and
  // its next 3 s check attaching the listener (a second read).
  function fsbWaitReturning(){
    const back=fsbWaitReturn;fsbWaitReturn=null;
    if(!back||fsbReturnPaths.includes(back.path)||fsbListens.has(back.path))return;
    for(const info of back.owners)fsbWatchWaitPoint(info.owner,back.path,info.wake,{relaxed:info.relaxed});
    if(!fsbWait||fsbWait.path!==back.path||fsbWait.snapshot)return;
    fsbWait.returning=true;
    const listen={};listen.promise=new Promise(resolve=>{listen.resolve=resolve;});fsbListens.set(back.path,listen);
    if(typeof root.setTimeout==="function")root.setTimeout(()=>fsbListened(back.path,null),5000);
  }
  function fsbWatchWaitPoint(owner,path,wake,options){
    const at=fsbNow(),relaxed=Boolean(options&&options.relaxed===true);
    if(fsbWait){for(const [key,info] of [...fsbWait.owners])if(key!==owner&&at-info.seen>FSB_WAIT_OWNER_MS)fsbWait.owners.delete(key);if(!fsbWait.owners.size)fsbDetachWait();}
    const release=()=>{if(fsbWait&&fsbWait.owners.delete(owner)&&!fsbWait.owners.size)fsbDetachWait();return false;};
    if(typeof path!=="string"||!/^rivalries\/[^/]+(?:\/[^/]+\/[^/]+)+$/.test(path)){fsbWaitAsks.delete(owner);if(!fsbHidden())fsbReturnWakes.delete(owner);return release();}
    fsbWaitAsks.set(owner,{path,at});if(typeof wake==="function")fsbReturnWakes.set(owner,wake);
    if(fsbPaused()||fsbHidden()||!fsbFirestore||(fsbWaitFailed.get(path)||0)>at)return release();
    if(fsbWait&&fsbWait.path===path){fsbWait.owners.set(owner,{wake,seen:at,relaxed});return fsbWaitLive();}
    if(fsbWait&&!(fsbWait.owners.size===1&&fsbWait.owners.has(owner)))return false;
    const api=fsbSnapshotApi;
    if(!api){fsbLoadSnapshotApi();return release();}
    fsbDetachWait();
    const wait={path,owners:new Map([[owner,{wake,seen:at,relaxed}]]),snapshot:null,serial:null,version:null,healthy:false,dirty:false,confirmedAt:0,lagUntil:0,lagVersion:null,lagSerial:null,unsubscribe:null};
    fsbWait=wait;fsbStats.listenersAttached+=1;
    try{
      wait.unsubscribe=api.onSnapshot(api.doc(fsbFirestore,path),{includeMetadataChanges:true},snapshot=>fsbWaitDelivery(wait,snapshot),error=>{fsbCountRead(fsbMeterFailureUnits(error),true,wait.priced?0:fsbReadLookups(path));if(fsbWait!==wait)return;fsbWaitFail(path);if(fsbIsQuotaError(error))fsbTrip();fsbAuthorityDenied(error,path);});
    }catch(_error){if(fsbWait===wait)fsbWaitFail(path);}
    return false;
  }

  // One document, read on the server inside a transaction that ends before commit (one BatchGetDocuments, no write).
  // r76: the waiting screen's authority listeners stop while the page is hidden and start again when it returns. A read
  // of one of their documents that starts before that listener's first server delivery waits for it instead of reading the
  // same document again, so a return costs one read per document. A listener that cannot deliver, or has not delivered within 5 s, hands the read back.
  let fsbReturnPaths=[],fsbWasHidden=false;const fsbListens=new Map();
  function fsbListenReturning(){for(const path of fsbReturnPaths)if(!fsbListens.has(path)){const listen={};listen.promise=new Promise(resolve=>{listen.resolve=resolve;});fsbListens.set(path,listen);if(typeof root.setTimeout==="function")root.setTimeout(()=>fsbListened(path,null),5000);}}
  // Called by Season Commit's authority listeners: their first server delivery of a path (snapshot), or none (no path) when
  // they stop. While they deliver a path, the context listener leaves it to them (fsbExternal).
  function fsbListened(path,snapshot){if(path===undefined){fsbExternal.clear();for(const key of [...fsbListens.keys()])fsbListened(key,null);return;}if(snapshot)fsbExternal.add(path);const listen=fsbListens.get(path);if(!listen)return;fsbListens.delete(path);if(snapshot){fsbStats.listenerServed+=1;fsbRemember(fsbFirestore,{path},snapshot);}listen.resolve(snapshot||null);}
  function fsbReturnListen(paths){fsbReturnPaths=Array.isArray(paths)?paths.filter(path=>typeof path==="string"):[];if(!fsbReturnPaths.length)fsbExternal.clear();for(const path of fsbReturnPaths){const watch=fsbCtxWatches.get(path);if(watch){watch.returning=false;fsbCtxDrop(path,false);}}for(const path of [...fsbListens.keys()])if(!fsbReturnPaths.includes(path))fsbListened(path,null);}
  function fsbTakeServerNext(path){const until=fsbServerNext.get(path)||0;if(until)fsbServerNext.delete(path);return until>fsbNow();}
  function fsbReadOne(sdk,db,ref,serverOnly=false){
    const listen=fsbListens.get(fsbPathOf(ref));if(listen)return listen.promise.then(snapshot=>snapshot||fsbReadOne(sdk,db,ref));
    // A read in flight is shared only within the account that started it; one that lands after a sign-in change is not kept.
    const path=fsbPathOf(ref),account=fsbAccountId,key=path?`${account||""}|${path}`:ref;
    const denied=path?fsbDenied.get(path):null;
    if(denied&&denied.until>fsbNow()&&fsbNow()-fsbInputAt>=FSB_INPUT_FRESH_MS){fsbStats.deniedRefusals+=1;return Promise.reject(denied.error);}
    const running=serverOnly?null:fsbInflight.get(key);
    if(running)return running;
    const found={};
    const request=Promise.resolve().then(()=>sdk.runTransaction(db,transaction=>Promise.resolve(transaction.get(ref)).then(snapshot=>{found.snapshot=snapshot;throw found;}))).then(()=>{throw new Error("Firestore read returned no snapshot.");},error=>{
      if(error===found){fsbStats.serverReads+=1;fsbCountRead(1,true,fsbReadLookups(path));fsbDenied.delete(path);if(fsbAccountId===account)fsbRemember(db,ref,found.snapshot);return found.snapshot;}
      if(fsbIsQuotaError(error))fsbTrip();
      fsbAuthorityDenied(error,path);
      throw error;
    }).finally(()=>{if(fsbInflight.get(key)===request)fsbInflight.delete(key);});
    fsbInflight.set(key,request);
    return request;
  }

  const FSB_PROBE_WRITE={fsbProbe:"write"};
  // fresh=true: no reuse at all (only in-flight sharing). A probe that used an old copy and also read a document that changed
  // (or was not known) runs once more on fresh reads, so a screen never acts on a mix of old and new documents.
  async function fsbProbe(sdk,db,updateFunction,fresh=false){
    // RS-02 (r87): a fresh re-run reads each document once per pass, and keeps what cannot have changed (immutable documents, this
    // account's own within 5 min: what a server transaction keeps too); every other document is still read from the server.
    let write=false,old=false,changed=false;const pass=new Map();
    const refuse=()=>{write=true;throw FSB_PROBE_WRITE;};
    const transaction={
      get:ref=>{
        if(write)return Promise.reject(FSB_PROBE_WRITE);
        if(fsbPaused())return Promise.reject(fsbQuotaError());
        const path=fsbPathOf(ref);
        if(fresh&&pass.has(path))return pass.get(path);
        const serverOnly=fsbTakeServerNext(path),reused=fresh||serverOnly?null:fsbReusable(path);
        if(reused){fsbStats.reusedReads+=1;if(reused.old)old=true;return Promise.resolve(reused.snapshot);}
        const known=fsbEntries.get(path),prior=known?fsbSerial(known.snapshot):null;
        if(fresh&&!serverOnly){const kept=fsbTransactionKept(db,path);if(kept){const reuse=Promise.resolve(kept);pass.set(path,reuse);return reuse;}}
        const read=fsbReadOne(sdk,db,ref,serverOnly).then(snapshot=>{if(prior===null||prior!==fsbSerial(snapshot))changed=true;return snapshot;});
        if(fresh)pass.set(path,read);
        return read;
      },
      set:refuse,update:refuse,delete:refuse
    };
    const again=()=>{fsbStats.freshReruns+=1;fsbForgetContext();return fsbProbe(sdk,db,updateFunction,true);};
    try{
      const value=await updateFunction(transaction);
      if(write)return null;
      if(old&&changed)return again();
      return {value};
    }catch(error){
      if(write)return null;
      if(old&&changed&&error!==FSB_PROBE_WRITE&&!(error&&error.quotaPaused))return again();
      throw error;
    }
  }

  // r84 trim: a save made right after a tap first runs its function once on the copies this page already has (no read at all). When it wants to write,
  // it goes straight to the server transaction, so a save no longer pays every document twice (once in the read-only probe,
  // once in the transaction). When it only reads, or a document has no copy yet, the probe below runs exactly as before.
  const FSB_PEEK_STOP={fsbPeek:"stop"};
  async function fsbPeekWrites(updateFunction){
    let write=false,miss=false;
    const stop=()=>Promise.reject(FSB_PEEK_STOP);
    const wants=()=>{write=true;throw FSB_PEEK_STOP;};
    const transaction={
      get:ref=>{
        if(write||miss)return stop();
        const path=fsbPathOf(ref),entry=path?fsbEntries.get(path):null;
        if(path&&fsbWait&&fsbWait.path===path&&fsbWaitLive()&&fsbWait.snapshot&&!fsbWait.dirty)return Promise.resolve(fsbWait.snapshot);
        if(!entry||entry.dirty){miss=true;return stop();}
        return Promise.resolve(entry.snapshot);
      },
      set:wants,update:wants,delete:wants
    };
    try{await updateFunction(transaction);}catch(_error){}
    if(write)fsbStats.peekWrites+=1;
    return write;
  }
  // r84 trim: inside a writing transaction, a document the Rules never let change again (fsbImmutable: a confirmed setup, a
  // ready Career Start, published results, an acknowledged commit) and this account's own account/device documents (no
  // client can change an account; only this account can change its devices) are taken from this page's copy instead of
  // being read again. Every other document (rivalry, session, the document being saved) is still read in the transaction.
  function fsbTransactionKept(db,path){
    if(db!==fsbFirestore||!path)return null;
    const entry=fsbEntries.get(path);
    if(!entry||entry.dirty)return null;
    if(entry.immutable)return entry.snapshot;
    if(fsbOwnAccountPath(path)&&fsbNow()-entry.at<=FSB_OWN_ACCOUNT_MS)return entry.snapshot;
    return null;
  }
  async function fsbServerTransaction(sdk,db,updateFunction,rest){
    if(fsbPaused())throw fsbQuotaError();
    fsbStats.serverTransactions+=1;
    let wrote=false,written=[];
    const done={};
    try{
      const value=await sdk.runTransaction(db,async transaction=>{
        wrote=false;written=[];
        const proxy={
          get:ref=>{const kept=fsbTransactionKept(db,fsbPathOf(ref));if(kept){fsbStats.transactionKept+=1;return Promise.resolve(kept);}return Promise.resolve(transaction.get(ref)).then(snapshot=>{fsbStats.serverReads+=1;fsbCountRead(1,true,fsbReadLookups(fsbPathOf(ref)));fsbRemember(db,ref,snapshot);return snapshot;});},
          set:(ref,...args)=>{wrote=true;written.push(fsbPathOf(ref));transaction.set(ref,...args);return proxy;},
          update:(ref,...args)=>{wrote=true;written.push(fsbPathOf(ref));transaction.update(ref,...args);return proxy;},
          delete:ref=>{wrote=true;written.push(fsbPathOf(ref));transaction.delete(ref);return proxy;}
        };
        const result=await updateFunction(proxy);
        if(!wrote){done.value=result;throw done;}
        return result;
      },...rest);
      fsbMarkWritten(db,written);fsbBill(fsbWriteLookups(written));
      return value;
    }catch(error){
      if(error===done){fsbStats.readOnlyWithoutCommit+=1;return done.value;}
      // r80: a write that failed (a rival's write may have landed first) is followed by a check of what is stored now:
      // the next read of each document it wrote goes to the server, even if the listener delivers an older copy meanwhile.
      if(wrote&&fsbMeterFailureUnits(error))fsbBill(fsbWriteLookups(written));
      if(wrote){fsbMarkWritten(db,written);for(const path of written)if(path){fsbServerNext.set(path,fsbNow()+FSB_ASK_MS);if(fsbServerNext.size>FSB_MAX_ENTRIES)fsbServerNext.delete(fsbServerNext.keys().next().value);}}
      if(fsbIsQuotaError(error))fsbTrip();
      fsbAuthorityDenied(error);
      throw error;
    }
  }

  async function fsbRunTransaction(services,db,updateFunction,rest){
    if(fsbPaused())throw fsbQuotaError();
    const sdk=services.firestoreSdk;
    if(typeof updateFunction!=="function")return sdk.runTransaction(db,updateFunction,...rest);
    if(db!==fsbFirestore){fsbEntries.clear();fsbCtxDetach();fsbFirestore=db;}
    const uid=services.auth&&services.auth.currentUser&&services.auth.currentUser.uid||null;
    if(uid!==fsbAccountId){fsbEntries.clear();fsbInflight.clear();fsbReturnListen([]);fsbCtxDetach();fsbExternal.clear();fsbCtxReturn=[];fsbWaitReturn=null;fsbDenied.clear();fsbAccountId=uid;}
    // Only within a few seconds of a tap, when a save is likely; a background check, or a later automatic save, keeps the probe
    // path and timing exactly as before (the server transaction still decides every write).
    if(fsbNow()-fsbInputAt<FSB_INPUT_FRESH_MS&&await fsbPeekWrites(updateFunction))return fsbServerTransaction(sdk,db,updateFunction,rest);
    const answer=await fsbProbe(sdk,db,updateFunction);
    if(answer)return answer.value;
    return fsbServerTransaction(sdk,db,updateFunction,rest);
  }

  function fsbWrapServices(services){
    if(!services||typeof services!=="object"||services.ok!==true||!services.firestoreSdk||typeof services.firestoreSdk.runTransaction!=="function")return services;
    if(services.firestoreBudget===true)return services;
    const existing=fsbWrapped.get(services);
    if(existing)return existing;
    const sdk=services.firestoreSdk;
    fsbRawSdk=sdk;
    try{fsbShareResume(services.firestore);}catch(_error){}
    // A runtime that already hands out onSnapshot (none does today; the contract test does) is used as is; otherwise the
    // listener API is loaded from the same Firestore module URL the runtime uses, so it shares one SDK instance.
    if(!fsbSnapshotApi&&typeof sdk.onSnapshot==="function"&&typeof sdk.doc==="function")fsbSnapshotApi=Object.freeze({onSnapshot:sdk.onSnapshot,doc:sdk.doc});
    const wrapped=Object.freeze({...services,firestoreBudget:true,firestoreSdk:Object.freeze({...fsbMeterSdk(sdk),runTransaction:(db,updateFunction,...rest)=>fsbRunTransaction(services,db,updateFunction,rest)})});
    fsbWrapped.set(services,wrapped);
    return wrapped;
  }

  root.CareerModeFirestoreBudget=Object.freeze({
    contractVersion:1,
    quotaMessageText:FSB_QUOTA_MESSAGE,
    pauseStepsMs:FSB_PAUSE_STEPS_MS,
    coalesceMs:FSB_COALESCE_MS,
    ownAccountReuseMs:FSB_OWN_ACCOUNT_MS,
    services:fsbWrapServices,
    watchWaitPoint:fsbWatchWaitPoint,
    forgetContext:fsbForgetContext,
    returnListen:fsbReturnListen,
    listened:fsbListened,
    // watchContext(rivalryId, wake): watch this rivalry's root and current Session while a shared Showdown is open (null stops);
    // wake(path) runs when either changes. contextHealthy(path): a confirmed context listener serves this document now.
    watchContext:fsbWatchContext,
    contextHealthy:path=>Boolean(fsbCtxServe(path)),
    // watchesHealthy(path): a healthy wait listener watches exactly this document, so a 15 s screen check need not re-read it.
    watchesHealthy:path=>Boolean(typeof path==="string"&&fsbWait&&fsbWait.path===path&&fsbWaitHealthy()),
    // countListenerRead(): a server delivery of a listener this layer does not own (season-commit wait context, Home JOIN note)
    // still counts toward today's reads and the brake window.
    countListenerRead:()=>fsbCountRead(),
    // r85 meterSdk(sdk): the same SDK functions, with getDoc/getDocs/getDocFromServer/getDocsFromServer/onSnapshot counted by
    // the one read meter above (idempotent: an already metered SDK or function is returned as is). meterGet(fn) and
    // meterListen(fn) do the same for a single function. readUnits(snapshot) is what one snapshot counts (contract tests).
    meterSdk:fsbMeterSdk,
    meterGet:fsbMeterGet,
    meterListen:fsbMeterListen,
    readUnits:(snapshot,listener)=>fsbMeterUnits(snapshot,listener===true),
    // r86: the Rules lookups a read (live or finished Showdown) or one write request of these paths is billed, and the Rules
    // text the table was generated from (contract tests).
    rulesLookups:Object.freeze({rulesSha256:FSB_RULES_SHA256,read:(path,finished)=>fsbReadLookups(path,finished===true),write:paths=>fsbWriteLookups(Array.isArray(paths)?paths:[paths])}),
    quietReuseMs:FSB_QUIET_MS,
    inputFreshMs:FSB_INPUT_FRESH_MS,
    // wantFresh(): every read of this page is fresh for the next 7 s; wantFresh(path): only that document.
    wantFresh(path){if(typeof path==="string"&&path){fsbFreshPaths.set(path,fsbNow()+FSB_ASK_MS);if(fsbFreshPaths.size>FSB_MAX_ENTRIES)fsbFreshPaths.delete(fsbFreshPaths.keys().next().value);}else fsbFreshAskAt=fsbNow();},
    // readServerNext(path): the next read of that document goes to the server, even inside the 2 s window (revocation checks).
    readServerNext(path){if(typeof path==="string"&&path){fsbServerNext.set(path,fsbNow()+FSB_ASK_MS);if(fsbServerNext.size>FSB_MAX_ENTRIES)fsbServerNext.delete(fsbServerNext.keys().next().value);}},
    isQuotaError:fsbIsQuotaError,
    paused:fsbPaused,
    quotaMessage:fsbQuotaMessage,
    noteError(error){if(fsbIsQuotaError(error))fsbTrip();return fsbQuotaMessage(error);},
    state:fsbState,
    readsToday:fsbReadsToday,
    noteSeasonStart:fsbNoteSeasonStart,
    noteSeasonDone:fsbNoteSeasonDone,
    seasonsLeftToday:fsbSeasonsLeftToday,
    // r87 shared reads meter: sharedEstimate(a, b, day) is the pure both-phones result from two meter documents (contract tests);
    // meterDocuments() the two documents this phone holds today; readPartnerMeter() reads the partner's now (tests).
    sharedEstimate:(a,b,day)=>fsbShareFrom(a,b,typeof day==="string"?day:fsbDayState().day),
    meterDocuments:()=>{const bill=fsbDayState().bill;return Object.freeze({own:bill.own,partner:bill.partner,off:fsbShareOffDay===fsbDayState().day});},
    readPartnerMeter:db=>{const bill=fsbDayState().bill;return bill.own?fsbShareReadPartner(db||fsbFirestore,bill.own):Promise.resolve(null);},
    roleShare:fsbRoleShare,
    braking:()=>fsbBraking(),
    stats:()=>Object.freeze({...fsbStats,remembered:fsbEntries.size,watching:fsbWait?fsbWait.path:null,watchHealthy:fsbWaitLive()}),
    reset(){fsbDetachWait();fsbCtxRivalry=null;fsbCtxDetach();fsbExternal.clear();fsbCtxReturn=[];fsbWaitReturn=null;fsbDenied.clear();fsbCtxFailed.clear();fsbReturnListen([]);fsbWaitFailed.clear();fsbReturnWakes.clear();fsbEntries.clear();fsbInflight.clear();fsbCadence.clear();fsbWaitAsks.clear();fsbFreshPaths.clear();fsbServerNext.clear();fsbPause=null;fsbInputAt=0;fsbFreshAskAt=0;fsbChainAt=0;fsbPublish();}
  });
})(typeof globalThis!=="undefined"?globalThis:this);

```

## FILE: js/persistentNikDanielPair.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModePersistentNikDanielPair=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PAIR_DOC_ID="current";
  const MANAGER_BY_ROLE=Object.freeze({
    playerOne:Object.freeze({id:"daniel",label:"Daniel"}),
    playerTwo:Object.freeze({id:"nik",label:"Nik"})
  });
  const ROLE_BY_MANAGER=Object.freeze({daniel:"playerOne",nik:"playerTwo"});
  const MANAGER_BY_ID=Object.freeze({daniel:MANAGER_BY_ROLE.playerOne,nik:MANAGER_BY_ROLE.playerTwo});
  const PANEL_ID="persistentNikDanielPairPanel";
  const CODE_INPUT_ID="persistentNikDanielPairCode";
  const CONNECTED_RIVALRY_PATH="js/sparkConnectedRivalry.js";
  const SHARED_ENTRY_PATH="js/productionSharedJourneyEntry.js";

  let state=Object.freeze({status:"idle",initialized:false,busy:false,accountId:null,deviceId:null,managerRole:null,managerId:null,rivalryId:null,connectionState:null,providerSaveId:null,providerProfileId:null,capability:null,closedRivalryId:null,message:"Getting your Showdown ready…"});
  // r79: rivalries Terminal Close announced as ended (DELETED by the other phone; CLOSED by a normal finish once Home is shown).
  // An ended rivalry never comes back, so any later publication of it as live (a busy action, an in-flight or overlapping pair
  // read) is held as closed instead (Codex #910). closedOnHomeRivalryId waits for Home.
  const endedRivalryIds=new Set();let closedOnHomeRivalryId=null,endedHeldNow=false;
  // Job 19: the remembered pair whose Showdown is CLOSED (terminal). Non-secret; lets Home tell a finished
  // Showdown apart from a never-paired shell after reload without another provider read.
  let pairLastClosedRivalryId=null;
  // r79 (PR #901 P1): the save that closed rivalry was bound to, so START only treats THAT shell as closed, never a fresh one.
  let pairLastClosedProviderSaveId=null;
  let pairInitializePromise=null;
  let pairDraftCode="";
  let pairConnectedRivalryLoadPromise=null;
  let pairSharedEntryLoadPromise=null;
  const pairListeners=new Set();
  // Job 33 (R1): while Daniel's code is shown and Nik has not joined yet, re-read the pair link every 4 s for at most
  // 3 minutes, then every 15 s, instead of waiting for a CHECK STATUS tap. Read-only; paused while the tab is hidden.
  const PAIR_WAIT_FAST_MS=4000,PAIR_WAIT_SLOW_MS=15000,PAIR_WAIT_WINDOW_MS=180000;
  let pairWaitTimer=null,pairWaitKey="",pairWaitSince=0,pairWaitEndedKey="";
  // BH-11 (#3): CREATE and JOIN are single-flight. A refresh from the online event or the identity sidecar waits for the
  // running action instead of clearing busy and re-enabling JOIN while the first redeem is still in flight.
  let pairBusyAction=null;
  function pairBeginBusyAction(){let release=()=>{};const action={refreshing:false,done:new Promise(resolve=>{release=resolve;})};action.release=()=>{if(pairBusyAction===action)pairBusyAction=null;release();};pairBusyAction=action;return action;}
  // BH-11 (#2): ask the browser once per page to keep this site's storage durable, so the local career copy is not
  // cleared after a few days without use. Best effort: no prompt loop, no retry, failures are ignored.
  let pairDurableStorageRequested=false;
  function pairRequestDurableStorage(){if(pairDurableStorageRequested)return false;pairDurableStorageRequested=true;try{const storage=root.navigator?.storage;if(!storage||typeof storage.persist!=="function")return false;const already=typeof storage.persisted==="function"?Promise.resolve().then(()=>storage.persisted()):Promise.resolve(false);void already.then(value=>value===true?true:storage.persist()).catch(()=>false);return true;}catch(_error){return false;}}
  // BH-11 (#6, #10): raw provider errors become plain sentences. Product errors (upper-case codes) keep their own text.
  const PAIR_AMBIGUOUS_PROVIDER_CODES=new Set(["unavailable","deadline-exceeded","aborted","internal","unknown","cancelled","network-request-failed"]);
  const PAIR_CLOCK_HINT=" Also check that your phone's date and time are set automatically; a phone clock that is several minutes off is refused.";
  function pairProviderCode(error){return String(error?.code||"").split("/").pop().trim().toLowerCase();}
  function pairIsProductError(error){return /^[A-Z][A-Z0-9_]+$/.test(String(error?.code||""))&&typeof error?.message==="string"&&error.message.trim().length>0;}
  function pairPlainProviderMessage(error,fallback,options={}){const quotaPaused=root.CareerModeFirestoreBudget?.quotaMessage?.();if(quotaPaused)return quotaPaused;if(pairIsProductError(error))return error.message;const code=pairProviderCode(error);if(code==="permission-denied")return`${options.permissionMessage||"This Google account was not allowed to do that right now."}${options.clockHint===true?PAIR_CLOCK_HINT:""}`;if(code==="resource-exhausted")return "The free online service has reached its limit for now. Your career is safe; try again later.";if(PAIR_AMBIGUOUS_PROVIDER_CODES.has(code)||root.navigator?.onLine===false)return "The connection dropped before your Showdown could be checked. Check your internet, then try again.";return fallback;}
  function pairJoinFailureIsDefinitive(error){const code=pairProviderCode(error);return Boolean(code)&&!PAIR_AMBIGUOUS_PROVIDER_CODES.has(code);}

  function pairFreezeDeep(value){if(!value||typeof value!=="object"||Object.isFrozen(value))return value;Object.freeze(value);Object.values(value).forEach(pairFreezeDeep);return value;}
  // r79 gallery: Home's chip and CONTINUE tile read whether this pair holds the active save as closed (js/menuExperience.js
  // isPairClosedSave), so they are redrawn when those inputs move. Nik's JOIN after a deleted Showdown reuses its empty shell
  // (no createShowdown, no Home on the way), so nothing else redrew them and his league wheel kept NO ACTIVE SHOWDOWN.
  let pairHomeKey=null;
  function pairRedrawHome(){const key=`${state.rivalryId||""}|${state.closedRivalryId||""}|${state.closedProviderSaveId||""}`;if(key===pairHomeKey)return;pairHomeKey=key;try{root.refreshMainMenuExperience?.();}catch(_error){}}
  function pairSetState(next){state=pairFreezeDeep(pairHeldIfEnded({...state,...next}));pairRememberActiveShell();for(const listener of pairListeners){try{listener(state);}catch(_error){}}pairRedrawHome();pairRender();pairSyncWaitingPoll();pairContinueAfterWaitEnded();if(endedHeldNow)pairAnnounceEnded();return state;}
  // r79 (PR #901, smoothness): once the pair is ACTIVE this device remembers, locally, that its shell is paired (only the saveId,
  // no rivalry or account data; through js/storage.js, the one owner of local storage), so a reload mid-Showdown never holds the
  // loading screen for a pre-pair recovery (js/ssjr.js).
  const PAIRED_SHELL_KEY="careerModeShowdown.pairedShell.v1";
  function pairRememberActiveShell(){if(state.status!=="paired"||state.connectionState!=="active"||!pairValidSaveId(state.providerSaveId))return;try{if(typeof root.readStorageValue==="function"&&typeof root.writeStorageValue==="function"&&root.readStorageValue(PAIRED_SHELL_KEY)!==state.providerSaveId)root.writeStorageValue(PAIRED_SHELL_KEY,state.providerSaveId);}catch(_error){}}
  function pairWaitingKey(){const staleNikPending=state.managerRole==="playerTwo"&&pairCurrentIdentityRole()==="playerTwo";return state.connectionState==="pending-pair"&&state.capability&&state.rivalryId&&state.accountId&&!staleNikPending?`${state.accountId}|${state.rivalryId}`:"";}
  function pairClearWaitingTimer(){if(pairWaitTimer!==null){root.clearTimeout?.(pairWaitTimer);pairWaitTimer=null;}}
  function pairSyncWaitingPoll(){
    const key=pairWaitingKey();if(!key){if(pairWaitKey)pairWaitEndedKey=pairWaitKey;pairWaitKey="";pairWaitSince=0;pairClearWaitingTimer();return;}
    if(key!==pairWaitKey){pairWaitKey=key;pairWaitSince=Date.now();}
    if(pairWaitTimer!==null||typeof root.setTimeout!=="function")return;
    const delay=Date.now()-pairWaitSince<PAIR_WAIT_WINDOW_MS?PAIR_WAIT_FAST_MS:PAIR_WAIT_SLOW_MS;
    pairWaitTimer=root.setTimeout(()=>{pairWaitTimer=null;void pairWaitingPollTick();},delay);pairWaitTimer?.unref?.();
  }
  // r79 (Codex #901): however this device learns that Nik joined the rivalry it was waiting on (the poll, CHECK STATUS,
  // an identity or online refresh), Daniel goes on into the Showdown by himself once the refresh settles. Any other
  // settled state (a different rivalry, an error, still pending) drops the remembered wait.
  function pairContinueAfterWaitEnded(){if(!pairWaitEndedKey||state.busy)return;const key=pairWaitEndedKey;pairWaitEndedKey="";if(state.connectionState==="active"&&state.status==="paired"&&`${state.accountId}|${state.rivalryId}`===key)void Promise.resolve().then(pairAutoContinueAfterConnect).catch(()=>{});}
  async function pairWaitingPollTick(){root.CareerModeFirestoreBudget?.wantFresh?.();
    try{
      const key=pairWaitingKey();
      if(key&&!state.busy&&!pairInitializePromise&&root.document?.visibilityState!=="hidden"&&root.CareerModeSparkPrivatePairing?.getState?.()?.registered===true){
        // Same read as CHECK STATUS (pair link + rivalry); the panel is only re-rendered when the connection changed.
        const context=await pairResolveContext(),link=await pairReadPairLink(context);
        if(pairWaitingKey()===key&&(!link||link.rivalryId!==state.rivalryId||link.connectionState!==state.connectionState)){
          await pairInitialize({force:true});
          // r79: Nik joined the very rivalry this device was waiting on, so Daniel goes on into the Showdown by himself.
          if(state.connectionState==="active"&&state.status==="paired"&&`${state.accountId}|${state.rivalryId}`===key){/* r79 PR3: a real first pairing: Daniel writes his partner record (this read just saw the rivalry ACTIVE with Nik in playerTwo; the write re-reads it) alongside the auto-continue, so the continue is never delayed by it. */const recording=pairRecordRealPairing(state.rivalryId,"playerOne");await pairAutoContinueAfterConnect();await recording;}
        }
      }
    }catch(_error){}
    pairSyncWaitingPoll();
  }

  function pairErrorWithCode(code,message){const error=new Error(message||code);error.code=code;return error;}
  function pairCanonicalize(value){if(value===null||value===undefined)return value===undefined?null:value;if(value&&typeof value.toMillis==="function")return{$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(pairCanonicalize);if(typeof value==="object"){const result={};for(const key of Object.keys(value).sort())result[key]=pairCanonicalize(value[key]);return result;}return value;}
  function pairHexFromBytes(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
  async function pairSha256(value,cryptoImpl=root.crypto){if(!cryptoImpl?.subtle||typeof cryptoImpl.subtle.digest!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_CRYPTO_UNAVAILABLE","Secure browser hashing is unavailable.");const bytes=new TextEncoder().encode(JSON.stringify(pairCanonicalize(value)));const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);return`sha256:${pairHexFromBytes(new Uint8Array(digest))}`;}
  async function pairBuildEnvelope({objectId=PAIR_DOC_ID,revision,parentRevision,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,cryptoImpl=root.crypto}){const contentHash=await pairSha256({objectType:"pairLink",objectId,revision,data},cryptoImpl);return{schemaVersion:1,objectType:"pairLink",objectId,revision,parentRevision,lifecycleState:"live",contentHash,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,tombstone:null};}
  async function pairBuildRivalryClosureEnvelope(value,context,updatedAt,cryptoImpl=root.crypto,endedEarly=null){const rivalryId=pairNormalizeRivalryId(value?.objectId),revision=value.revision+1,data={...value.data,connectionState:"closed",...(endedEarly?{endedEarly}:{})},contentHash=await pairSha256({objectType:"rivalry",objectId:rivalryId,revision,data},cryptoImpl);return{...value,revision,parentRevision:value.revision,contentHash,priorContentHash:value.contentHash,updatedAt,updatedByAccountId:context.accountId,updatedByDeviceId:context.deviceId,data,tombstone:null};}

  function pairNormalizeRivalryId(value){const id=typeof value==="string"?value.trim().toLowerCase():"";if(!/^pair_[0-9a-f]{64}$/.test(id))throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_INVALID","This Showdown connection is invalid.");return id;}
  function pairNormalizeManagerRole(value){const role=typeof value==="string"?value.trim():"";if(!MANAGER_BY_ROLE[role])throw pairErrorWithCode("PERSISTENT_PAIR_ROLE_INVALID","Choose Daniel or Nik before continuing.");return role;}
  function pairNormalizeManagerId(value){const id=typeof value==="string"?value.trim().toLowerCase():"";if(!MANAGER_BY_ID[id])throw pairErrorWithCode("PERSISTENT_PAIR_MANAGER_INVALID","Choose Daniel or Nik before continuing.");return id;}
  function pairManagerForRole(role){return MANAGER_BY_ROLE[pairNormalizeManagerRole(role)];}
  function pairManagerForId(id){return MANAGER_BY_ID[pairNormalizeManagerId(id)];}
  function pairAssertCanonicalIdentity(role,managerId){const normalizedRole=pairNormalizeManagerRole(role),normalizedManagerId=pairNormalizeManagerId(managerId),expected=pairManagerForRole(normalizedRole);if(expected.id!==normalizedManagerId)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH",`${expected.label} must use ${normalizedRole==="playerOne"?"Player One":"Player Two"}.`);return expected;}
  function pairCurrentIdentityManagerId(){const identity=root.CareerModeOnlinePlayerIdentity?.getState?.();return identity?.managerId&&MANAGER_BY_ID[identity.managerId]?identity.managerId:null;}
  function pairCurrentIdentityRole(){const managerId=pairCurrentIdentityManagerId();return managerId?ROLE_BY_MANAGER[managerId]:null;}
  function pairRequireCurrentIdentity(role){const normalizedRole=pairNormalizeManagerRole(role),managerId=pairCurrentIdentityManagerId();if(!managerId)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_REQUIRED","Choose Daniel or Nik before continuing.");pairAssertCanonicalIdentity(normalizedRole,managerId);return pairManagerForRole(normalizedRole);}
  function pairValidSaveId(value){return typeof value==="string"&&/^save_[a-f0-9]{24}$/.test(value);}
  function pairValidProfileId(value){return typeof value==="string"&&/^profile_[a-f0-9]{24}$/.test(value);}

  function pairLocalBindingForRole(pairing,role){const normalized=pairNormalizeManagerRole(role);const bindings=pairing&&typeof pairing.localBindingOptions==="function"?pairing.localBindingOptions():[];return(Array.isArray(bindings)?bindings:[]).find(binding=>binding&&binding.managerRole===normalized)||null;}
  function pairHasExactShowdownShell(role,saveId,profileId){const normalized=pairNormalizeManagerRole(role),runtime=root.CareerModeSaveLibraryRuntime;if(!pairValidSaveId(saveId)||!pairValidProfileId(profileId)||!runtime||typeof runtime.isReady!=="function"||runtime.isReady()!==true||typeof runtime.getLibrarySnapshot!=="function")return false;const library=runtime.getLibrarySnapshot();if(!library||!Array.isArray(library.saves))return false;const entry=library.saves.find(item=>item&&item.saveId===saveId),refs=entry?.showdown?.identity?.managerProfileIds;return Boolean(entry&&refs&&refs[normalized]===profileId);}
  async function pairExactLocalBindingForProviderSlot(pairing,role,saveId,profileId){const normalized=pairNormalizeManagerRole(role),runtime=root.CareerModeSaveLibraryRuntime;if(!pairHasExactShowdownShell(normalized,saveId,profileId)||!runtime)return null;if(typeof runtime.switchActiveSave!=="function")return null;await runtime.switchActiveSave(saveId);const library=runtime.getLibrarySnapshot();if(library?.activeSaveId!==saveId)return null;const binding=pairLocalBindingForRole(pairing,normalized);if(!binding||binding.saveId!==saveId||binding.profileId!==profileId||binding.managerRole!==normalized)return null;return binding;}
  function pairPreparedBindingForRole(pairing,role){const binding=pairLocalBindingForRole(pairing,role);if(!binding)return null;const runtime=root.CareerModeSaveLibraryRuntime;if(!runtime||typeof runtime.isReady!=="function"||runtime.isReady()!==true||typeof runtime.getLibrarySnapshot!=="function")return null;const library=runtime.getLibrarySnapshot();if(!library||library.activeSaveId!==binding.saveId||!Array.isArray(library.saves))return null;const entry=library.saves.find(item=>item&&item.saveId===binding.saveId),showdown=entry&&entry.showdown;if(!showdown||showdown.sharedJourney?.mode!=="shared"||showdown.sharedJourney?.setupPending!==true)return null;if(showdown.managers?.playerOne!=="Daniel"||showdown.managers?.playerTwo!=="Nik")return null;if(showdown.selectedLeague||showdown.clubs?.playerOne||showdown.clubs?.playerTwo||(Array.isArray(showdown.rounds)&&showdown.rounds.length))return null;return binding;}

  function pairLinkReference(context){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",context.accountId,"pairLinks",PAIR_DOC_ID);}
  function pairRivalryReference(context,rivalryId){return context.services.firestoreSdk.doc(context.services.firestore,"rivalries",rivalryId);}
  function pairDeviceReference(context){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",context.accountId,"devices",context.deviceId);}
  const CAREER_INDEX_HEAD_ID="current";
  const CAREER_INDEX_PAGE_CAPACITY=500;
  let careerIndexState=Object.freeze({status:"loading",accountId:null,rivalryIds:Object.freeze([]),sealedPageCount:0,code:null});
  function pairCareerIndexReference(context,indexId){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",context.accountId,"careerIndex",indexId);}
  function pairCareerIndexIdsValid(ids,min,max){return Array.isArray(ids)&&ids.length>=min&&ids.length<=max&&ids.every(id=>typeof id==="string"&&/^pair_[0-9a-f]{64}$/.test(id))&&new Set(ids).size===ids.length;}
  function pairParseCareerIndexHead(value){if(!pairIsEnvelopeValue(value,"careerIndex",CAREER_INDEX_HEAD_ID))throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");const data=value.data||{},keys=Object.keys(data).sort().join(",");if(keys!=="rivalryIds,sealedPageCount"||!pairCareerIndexIdsValid(data.rivalryIds,1,CAREER_INDEX_PAGE_CAPACITY)||!Number.isInteger(data.sealedPageCount)||data.sealedPageCount<0)throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");return{revision:value.revision,contentHash:value.contentHash,rivalryIds:[...data.rivalryIds],sealedPageCount:data.sealedPageCount};}
  function pairParseCareerIndexPage(value,pageNumber){const pageId=`page_${pageNumber}`;if(!pairIsEnvelopeValue(value,"careerIndexPage",pageId)||value.revision!==0)throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");const data=value.data||{},keys=Object.keys(data).sort().join(",");if(keys!=="pageNumber,rivalryIds"||data.pageNumber!==pageNumber||!pairCareerIndexIdsValid(data.rivalryIds,CAREER_INDEX_PAGE_CAPACITY,CAREER_INDEX_PAGE_CAPACITY))throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");return[...data.rivalryIds];}
  // Pure: the exact career index writes that record rivalryId for this account in the pairing commit.
  async function pairPlanCareerIndexAppend({headValue,rivalryId,accountId,deviceId,now,cryptoImpl=root.crypto}){const id=pairNormalizeRivalryId(rivalryId),head=headValue?pairParseCareerIndexHead(headValue):null;if(head&&head.rivalryIds.includes(id))return[];const writes=[];let revision=0,parentRevision=null,priorContentHash=null,data={rivalryIds:[id],sealedPageCount:0};if(head){revision=head.revision+1;parentRevision=head.revision;priorContentHash=head.contentHash;if(head.rivalryIds.length<CAREER_INDEX_PAGE_CAPACITY)data={rivalryIds:[...head.rivalryIds,id],sealedPageCount:head.sealedPageCount};else{const pageNumber=head.sealedPageCount+1,pageId=`page_${pageNumber}`,pageData={pageNumber,rivalryIds:[...head.rivalryIds]};writes.push({indexId:pageId,value:{schemaVersion:1,objectType:"careerIndexPage",objectId:pageId,revision:0,parentRevision:null,lifecycleState:"live",contentHash:await pairSha256({objectType:"careerIndexPage",objectId:pageId,revision:0,data:pageData},cryptoImpl),priorContentHash:null,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data:pageData,tombstone:null}});data={rivalryIds:[id],sealedPageCount:pageNumber};}}writes.push({indexId:CAREER_INDEX_HEAD_ID,value:{schemaVersion:1,objectType:"careerIndex",objectId:CAREER_INDEX_HEAD_ID,revision,parentRevision,lifecycleState:"live",contentHash:await pairSha256({objectType:"careerIndex",objectId:CAREER_INDEX_HEAD_ID,revision,data},cryptoImpl),priorContentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null}});return writes;}
  // Sealed pages are immutable. Keep only the current account/provider's pages in this runtime;
  // always read the mutable head so finishes and rollover on the other device remain discoverable.
  let careerIndexPages=null;
  async function pairReadCareerIndexWith({firestore,firebaseSdk,accountId}){
    if(!careerIndexPages||careerIndexPages.db!==firestore||careerIndexPages.accountId!==accountId)careerIndexPages={db:firestore,accountId,pages:new Map()};
    const cache=careerIndexPages.pages;
    const head=await firebaseSdk.getDoc(firebaseSdk.doc(firestore,"accounts",accountId,"careerIndex",CAREER_INDEX_HEAD_ID));
    if(!head.exists())return{rivalryIds:[],sealedPageCount:0};
    const parsed=pairParseCareerIndexHead(head.data()),ordered=[];
    for(let pageNumber=1;pageNumber<=parsed.sealedPageCount;pageNumber+=1){
      let ids=cache.get(pageNumber);
      if(!ids){
        const page=await firebaseSdk.getDoc(firebaseSdk.doc(firestore,"accounts",accountId,"careerIndex",`page_${pageNumber}`));
        if(!page.exists())throw pairErrorWithCode("CAREER_INDEX_PAGE_MISSING","Part of the career index is missing.");
        ids=Object.freeze(pairParseCareerIndexPage(page.data(),pageNumber));cache.set(pageNumber,ids);
      }
      ordered.push(...ids);
    }
    ordered.push(...parsed.rivalryIds);
    if(new Set(ordered).size!==ordered.length)throw pairErrorWithCode("CAREER_INDEX_INVALID","The career index is invalid.");
    return{rivalryIds:ordered,sealedPageCount:parsed.sealedPageCount};
  }
  // Read-only: ordered rivalry ids (oldest first) for the signed-in account. Never throws; memory-only state.
  async function pairReadCareerIndex(options={}){let accountId=null;try{let firestore=options.firestore,firebaseSdk=options.firebaseSdk;accountId=options.accountId||null;if(!firestore||!firebaseSdk||!accountId){const context=await pairResolveContext();firestore=context.services.firestore;firebaseSdk=context.services.firestoreSdk;accountId=context.accountId;}careerIndexState=pairFreezeDeep({status:"loading",accountId,rivalryIds:[],sealedPageCount:0,code:null});const result=await pairReadCareerIndexWith({firestore,firebaseSdk,accountId});careerIndexState=pairFreezeDeep({status:"ready",accountId,rivalryIds:result.rivalryIds,sealedPageCount:result.sealedPageCount,code:null});}catch(error){careerIndexState=pairFreezeDeep({status:"unavailable",accountId,rivalryIds:[],sealedPageCount:0,code:error?.code||"CAREER_INDEX_UNAVAILABLE"});}return careerIndexState;}
  function pairIsEnvelopeValue(value,objectType,objectId){return Boolean(value&&value.schemaVersion===1&&value.objectType===objectType&&value.objectId===objectId&&value.lifecycleState==="live"&&Number.isInteger(value.revision)&&value.revision>=0&&typeof value.contentHash==="string");}
  function pairAssertActiveDevice(snapshot,deviceId){if(!snapshot?.exists?.())throw pairErrorWithCode("PERSISTENT_PAIR_DEVICE_REQUIRED",root.CareerModeFirestoreBudget?.quotaMessage?.()||"This browser is not ready yet.");const value=snapshot.data();if(!pairIsEnvelopeValue(value,"device",deviceId)||value.data?.deviceId!==deviceId||value.data?.state!=="active")throw pairErrorWithCode("PERSISTENT_PAIR_DEVICE_REQUIRED",root.CareerModeFirestoreBudget?.quotaMessage?.()||"This browser is not ready yet.");return value;}
  function pairRivalrySlotFor(value,accountId){if(!pairIsEnvelopeValue(value,"rivalry",value?.objectId)||!Array.isArray(value.data?.managerSlots))return null;return value.data.managerSlots.find(slot=>slot&&slot.accountId===accountId)||null;}
  function pairAssertRivalryMembership(value,rivalryId,accountId,expectedRole=null){if(!pairIsEnvelopeValue(value,"rivalry",rivalryId))throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","This Showdown could not be found.");if(!["pending-pair","active"].includes(value.data?.connectionState))throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_INACTIVE","This Showdown is no longer available.");const slot=pairRivalrySlotFor(value,accountId);if(!slot||!MANAGER_BY_ROLE[slot.slotId])throw pairErrorWithCode("PERSISTENT_PAIR_MEMBERSHIP_MISSING","This account is not part of this Showdown.");if(expectedRole&&slot.slotId!==expectedRole)throw pairErrorWithCode("PERSISTENT_PAIR_ROLE_CONFLICT","This account is assigned to the other player slot.");return{slot,connectionState:value.data.connectionState};}
  function pairProviderBindingFromMembership(membership){const slot=membership?.slot,role=pairNormalizeManagerRole(slot?.slotId),saveId=slot?.saveId,profileId=slot?.profileId;if(!pairValidSaveId(saveId)||!pairValidProfileId(profileId))throw pairErrorWithCode("PERSISTENT_PAIR_BINDING_INVALID","The linked career has invalid recovery identity data.");return Object.freeze({saveId,profileId,managerRole:role});}
  function pairParsePairLink(value,accountId){if(!pairIsEnvelopeValue(value,"pairLink",PAIR_DOC_ID))throw pairErrorWithCode("PERSISTENT_PAIR_LINK_INVALID","The saved Showdown connection is invalid.");const data=value.data||{},role=pairNormalizeManagerRole(data.managerRole),manager=pairAssertCanonicalIdentity(role,data.managerId),rivalryId=pairNormalizeRivalryId(data.rivalryId);return{accountId,rivalryId,managerRole:role,managerId:manager.id,managerLabel:manager.label,revision:value.revision,contentHash:value.contentHash,linkedAt:data.linkedAt,lastConfirmedAt:data.lastConfirmedAt};}

  async function pairResolveContext(){const runtime=root.CareerModeProductionFirebaseRuntime,account=root.CareerModeSparkConnectedAccount,pairing=root.CareerModeSparkPrivatePairing;if(!runtime||!account||!pairing)throw pairErrorWithCode("PERSISTENT_PAIR_RUNTIME_UNAVAILABLE","The connection service is unavailable.");await account.initialize();const accountState=account.getState?.();if(!accountState?.connected||!accountState.accountId)throw pairErrorWithCode("PERSISTENT_PAIR_AUTH_REQUIRED","Sign in before continuing.");await pairing.initialize();const pairingState=pairing.getState?.();if(!pairingState?.registered||!pairingState.deviceId)throw pairErrorWithCode("PERSISTENT_PAIR_DEVICE_REQUIRED",root.CareerModeFirestoreBudget?.quotaMessage?.()||"This browser is not ready yet.");const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());const user=services?.auth?.currentUser;if(!services?.ok||!user||user.uid!==accountState.accountId)throw pairErrorWithCode("PERSISTENT_PAIR_AUTH_REQUIRED","The signed-in account is unavailable.");return{runtime,account,pairing,services,user,accountId:accountState.accountId,deviceId:pairingState.deviceId};}
  async function pairReadPairLink(context){const sdk=context.services.firestoreSdk,ref=pairLinkReference(context);pairLastClosedRivalryId=null;pairLastClosedProviderSaveId=null;return sdk.runTransaction(context.services.firestore,async transaction=>{pairLastClosedRivalryId=null;pairLastClosedProviderSaveId=null;const pairSnapshot=await transaction.get(ref);if(!pairSnapshot.exists())return null;const link=pairParsePairLink(pairSnapshot.data(),context.accountId),rivalrySnapshot=await transaction.get(pairRivalryReference(context,link.rivalryId));if(!rivalrySnapshot.exists())throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","This Showdown could not be found.");const rivalryValue=rivalrySnapshot.data();if(!pairIsEnvelopeValue(rivalryValue,"rivalry",link.rivalryId))throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","This Showdown could not be found.");if(rivalryValue.data?.connectionState==="closed"){const slot=pairRivalrySlotFor(rivalryValue,context.accountId);if(!slot||slot.slotId!==link.managerRole)throw pairErrorWithCode("PERSISTENT_PAIR_MEMBERSHIP_MISSING","This account is not part of this Showdown.");pairLastClosedRivalryId=link.rivalryId;pairLastClosedProviderSaveId=pairValidSaveId(slot.saveId)?slot.saveId:null;return null;}const membership=pairAssertRivalryMembership(rivalryValue,link.rivalryId,context.accountId,link.managerRole),providerBinding=pairProviderBindingFromMembership(membership);return{...link,connectionState:membership.connectionState,providerSaveId:providerBinding.saveId,providerProfileId:providerBinding.profileId};});}
  async function pairPersistPairLink(context,rivalryId,managerRole){const sdk=context.services.firestoreSdk,role=pairNormalizeManagerRole(managerRole),manager=pairRequireCurrentIdentity(role),normalizedRivalryId=pairNormalizeRivalryId(rivalryId),pairRef=pairLinkReference(context),rivalryRef=pairRivalryReference(context,normalizedRivalryId),deviceRef=pairDeviceReference(context),now=sdk.Timestamp.fromMillis(Date.now());return sdk.runTransaction(context.services.firestore,async transaction=>{const deviceSnapshot=await transaction.get(deviceRef);pairAssertActiveDevice(deviceSnapshot,context.deviceId);const rivalrySnapshot=await transaction.get(rivalryRef);if(!rivalrySnapshot.exists())throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","This Showdown could not be confirmed.");const membership=pairAssertRivalryMembership(rivalrySnapshot.data(),normalizedRivalryId,context.accountId,role),providerBinding=pairProviderBindingFromMembership(membership),pairSnapshot=await transaction.get(pairRef);let revision=0,parentRevision=null,priorContentHash=null,linkedAt=now;if(pairSnapshot.exists()){const existing=pairParsePairLink(pairSnapshot.data(),context.accountId),sameManager=existing.managerRole===role&&existing.managerId===manager.id;if(existing.rivalryId===normalizedRivalryId&&!sameManager)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","This active Showdown belongs to the other player identity. Close it before changing players.");if(existing.rivalryId!==normalizedRivalryId){const oldSnapshot=await transaction.get(pairRivalryReference(context,existing.rivalryId)),oldState=oldSnapshot.exists()?oldSnapshot.data()?.data?.connectionState:null;if(oldState==="active")throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","This account already has an active Showdown.");if(!sameManager&&oldState!=="closed")throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","Close the previous Showdown before changing this Google account between Daniel and Nik.");}revision=existing.revision+1;parentRevision=existing.revision;priorContentHash=existing.contentHash;linkedAt=existing.linkedAt||now;}const data={rivalryId:normalizedRivalryId,managerRole:role,managerId:manager.id,linkedAt,lastConfirmedAt:now};const envelope=await pairBuildEnvelope({revision,parentRevision,priorContentHash,updatedAt:now,updatedByAccountId:context.accountId,updatedByDeviceId:context.deviceId,data});transaction.set(pairRef,envelope);return{rivalryId:normalizedRivalryId,managerRole:role,managerId:manager.id,managerLabel:manager.label,connectionState:membership.connectionState,providerSaveId:providerBinding.saveId,providerProfileId:providerBinding.profileId,revision:envelope.revision};});}
  async function pairPersistPairLinkWithRetry(context,rivalryId,managerRole,attempts=2){let lastError=null;const total=Math.max(1,Number.isInteger(attempts)?attempts:2);for(let attempt=0;attempt<total;attempt+=1){try{return await pairPersistPairLink(context,rivalryId,managerRole);}catch(error){lastError=error;}}throw lastError||pairErrorWithCode("PERSISTENT_PAIR_LINK_SAVE_FAILED","The Showdown connection could not be saved to this account.");}

  async function pairAbandonCurrentShowdown(options={}){
    if(state.busy)throw pairErrorWithCode("PERSISTENT_PAIR_BUSY","The current Showdown connection is busy. Try again when the current action finishes.");
    const expectedRivalryId=options.expectedRivalryId?pairNormalizeRivalryId(options.expectedRivalryId):null;
    const expectedSaveId=options.expectedSaveId==null?null:String(options.expectedSaveId);
    if(expectedSaveId!==null&&!pairValidSaveId(expectedSaveId))throw pairErrorWithCode("PERSISTENT_PAIR_BINDING_INVALID","The current Showdown identity is invalid.");
    // r80 END SHOWDOWN: the ended-early mark rides on this same closure write (seasons finished, or null when unknown).
    const endedEarly=Object.hasOwn(options,"seasonsPlayed")?{seasonsPlayed:Number.isInteger(options.seasonsPlayed)&&options.seasonsPlayed>=0&&options.seasonsPlayed<=10?options.seasonsPlayed:null}:null;
    pairSetState({status:"abandoning",busy:true,message:"Ending the current Showdown for both players…"});
    try{
      const context=await pairResolveContext(),sdk=context.services.firestoreSdk,pairRef=pairLinkReference(context),deviceRef=pairDeviceReference(context);
      const result=await sdk.runTransaction(context.services.firestore,async transaction=>{
        const deviceSnapshot=await transaction.get(deviceRef);pairAssertActiveDevice(deviceSnapshot,context.deviceId);
        const pairSnapshot=await transaction.get(pairRef);
        if(!pairSnapshot.exists()){
          if(expectedRivalryId)throw pairErrorWithCode("PERSISTENT_PAIR_LINK_REQUIRED","The online Showdown connection could not be verified. Nothing was changed.");
          return{ok:true,status:"unpaired",rivalryId:null};
        }
        const link=pairParsePairLink(pairSnapshot.data(),context.accountId);
        pairRequireCurrentIdentity(link.managerRole);
        if(expectedRivalryId&&link.rivalryId!==expectedRivalryId)throw pairErrorWithCode("PERSISTENT_PAIR_CONTEXT_MISMATCH","This Showdown does not match the remembered online Showdown. Nothing was deleted.");
        const rivalryRef=pairRivalryReference(context,link.rivalryId),rivalrySnapshot=await transaction.get(rivalryRef);
        if(!rivalrySnapshot.exists())throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","The online Showdown could not be verified. Nothing was changed.");
        const rivalryValue=rivalrySnapshot.data();
        if(!pairIsEnvelopeValue(rivalryValue,"rivalry",link.rivalryId))throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","The online Showdown could not be verified. Nothing was changed.");
        const slot=pairRivalrySlotFor(rivalryValue,context.accountId);
        if(!slot||slot.slotId!==link.managerRole)throw pairErrorWithCode("PERSISTENT_PAIR_MEMBERSHIP_MISSING","This account is not part of the remembered Showdown.");
        if(expectedSaveId&&slot.saveId!==expectedSaveId)throw pairErrorWithCode("PERSISTENT_PAIR_CONTEXT_MISMATCH","This Showdown's save does not match the remembered online Showdown. Nothing was deleted.");
        if(rivalryValue.data?.connectionState==="closed")return{ok:true,status:"already-closed",rivalryId:link.rivalryId,managerRole:link.managerRole};
        // r80 (Codex #936): Daniel's first real START closes his leftover code only while nobody has joined it (read here, in the
        // close itself): a code Nik has joined is a Showdown being played and is never ended from that START.
        if(options.unjoinedOnly===true&&(link.managerRole!=="playerOne"||rivalryValue.data?.connectionState!=="pending-pair"))throw pairErrorWithCode("PERSISTENT_PAIR_CODE_JOINED","Nik has already joined your earlier code, so that Showdown is being played. Finish or end it first. Nothing was changed.");
        const membership=pairAssertRivalryMembership(rivalryValue,link.rivalryId,context.accountId,link.managerRole),providerBinding=pairProviderBindingFromMembership(membership);
        if(expectedSaveId&&providerBinding.saveId!==expectedSaveId)throw pairErrorWithCode("PERSISTENT_PAIR_CONTEXT_MISMATCH","This Showdown's save does not match the remembered online Showdown. Nothing was deleted.");
        const now=sdk.Timestamp.fromMillis(Date.now()),next=await pairBuildRivalryClosureEnvelope(rivalryValue,context,now,options.cryptoImpl||root.crypto,endedEarly);
        transaction.set(rivalryRef,next);
        return{ok:true,status:"closed",rivalryId:link.rivalryId,managerRole:link.managerRole,revision:next.revision};
      });
      await pairInitialize({force:true});
      return result;
    }catch(error){
      pairSetState({status:"error",busy:false,message:"The current Showdown connection was not closed. "+(error?.message||"Nothing was changed.")});
      throw error;
    }
  }
  async function pairLoadConnectedRivalry(){if(root.CareerModeSparkConnectedRivalry)return root.CareerModeSparkConnectedRivalry;if(pairConnectedRivalryLoadPromise)return pairConnectedRivalryLoadPromise;if(typeof root.loadRuntimeScript!=="function")return null;pairConnectedRivalryLoadPromise=root.loadRuntimeScript("persistent-pair-connected-rivalry",CONNECTED_RIVALRY_PATH,()=>Boolean(root.CareerModeSparkConnectedRivalry)).then(()=>root.CareerModeSparkConnectedRivalry||null).catch(()=>null).finally(()=>{pairConnectedRivalryLoadPromise=null;});return pairConnectedRivalryLoadPromise;}
  async function pairLoadSharedJourneyEntry(){if(root.CareerModeProductionSharedJourneyEntry)return root.CareerModeProductionSharedJourneyEntry;if(pairSharedEntryLoadPromise)return pairSharedEntryLoadPromise;if(typeof root.loadRuntimeScript!=="function")return null;pairSharedEntryLoadPromise=root.loadRuntimeScript("persistent-pair-shared-entry",SHARED_ENTRY_PATH,()=>Boolean(root.CareerModeProductionSharedJourneyEntry)).then(()=>root.CareerModeProductionSharedJourneyEntry||null).catch(()=>null).finally(()=>{pairSharedEntryLoadPromise=null;});return pairSharedEntryLoadPromise;}
  async function pairEnsurePreparedBinding(context,role){const binding=pairPreparedBindingForRole(context.pairing,role);if(binding)return binding;/* r79: no screen change here (that was the reverse bounce); the panel offers CHOOSE SEASONS instead. */throw pairErrorWithCode("PERSISTENT_PAIR_SEASON_SELECTION_REQUIRED","Choose 1, 3, 5, or 10 seasons and press START A SHOWDOWN before connecting players.");}
  async function pairAttachRecoveryPointer(context,binding,rivalryId){const connected=await pairLoadConnectedRivalry();if(!connected?.attachRivalry)return{ok:false,connected:null,result:null};const result=await connected.attachRivalry({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,deviceId:context.deviceId,binding,rivalryId,indexedDBImpl:root.indexedDB});if(result?.ok&&typeof connected.initialize==="function")await connected.initialize();return{ok:Boolean(result?.ok),connected,result};}

// r78 (HO-029): the shared marble confirm box (js/showdownConfirm.js, loaded on first use) replaces the native confirm().
// It resolves true only for OK; Cancel, Esc or a box that cannot load resolve false (undefined when no loader exists).
function pairAskConfirm(message,tone){return typeof root.askShowdownConfirm==="function"?root.askShowdownConfirm(message,{tone}):typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof root.askShowdownConfirm==="function").then(()=>root.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}
function pairTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
function pairCreateDurablePairWitness(context,role,manager,expectedRivalryId,connectionState){const sdk=context.services.firestoreSdk,normalizedRole=pairNormalizeManagerRole(role),expected=expectedRivalryId?pairNormalizeRivalryId(expectedRivalryId):null;return async({transaction,binding,capability,now,nowEpochMs})=>{const normalizedRivalryId=pairNormalizeRivalryId(capability);if(expected&&normalizedRivalryId!==expected)throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_INVALID","The Showdown connection changed during provider mutation.");if(!binding||binding.managerRole!==normalizedRole||!pairValidSaveId(binding.saveId)||!pairValidProfileId(binding.profileId))throw pairErrorWithCode("PERSISTENT_PAIR_BINDING_INVALID","The career identity is invalid.");
  // READ PHASE: every transaction.get happens before any transaction.set (Sol S2C-005R2 §3).
  const pairRef=pairLinkReference(context),indexRef=pairCareerIndexReference(context,CAREER_INDEX_HEAD_ID),pairSnapshot=await transaction.get(pairRef),indexSnapshot=await transaction.get(indexRef);let revision=0,parentRevision=null,priorContentHash=null,linkedAt=now;if(pairSnapshot.exists()){const existing=pairParsePairLink(pairSnapshot.data(),context.accountId),sameManager=existing.managerRole===normalizedRole&&existing.managerId===manager.id;if(existing.rivalryId===normalizedRivalryId&&!sameManager)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","This Showdown belongs to the other player identity. Close it before changing players.");if(existing.rivalryId!==normalizedRivalryId){const oldSnapshot=await transaction.get(pairRivalryReference(context,existing.rivalryId));if(!oldSnapshot.exists()||!pairIsEnvelopeValue(oldSnapshot.data(),"rivalry",existing.rivalryId))throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","The current Showdown authority cannot be replaced safely.");const oldState=oldSnapshot.data().data?.connectionState;if(oldState==="active")throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","This account already has an active Showdown.");if(!sameManager&&oldState!=="closed")throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","Close the previous Showdown before changing this Google account between Daniel and Nik.");if(oldState==="pending-pair"){const oldInviteRef=sdk.doc(context.services.firestore,"rivalries",existing.rivalryId,"invites",existing.rivalryId),oldInviteSnapshot=await transaction.get(oldInviteRef),oldInvite=oldInviteSnapshot.exists()?oldInviteSnapshot.data():null,expiresAt=pairTimestampMillis(oldInvite?.data?.expiresAt),stillOpen=pairIsEnvelopeValue(oldInvite,"invite",existing.rivalryId)&&oldInvite.data?.state==="open"&&Number.isFinite(expiresAt)&&expiresAt>nowEpochMs;if(stillOpen)throw pairErrorWithCode("PERSISTENT_PAIR_PENDING_CONFLICT","This account already has a connection code waiting for the other player.");}else if(oldState!=="closed")throw pairErrorWithCode("PERSISTENT_PAIR_ACTIVE_CONFLICT","The current Showdown authority cannot be replaced safely.");}revision=existing.revision+1;parentRevision=existing.revision;priorContentHash=existing.contentHash;linkedAt=existing.linkedAt||now;}
  const indexWrites=await pairPlanCareerIndexAppend({headValue:indexSnapshot.exists()?indexSnapshot.data():null,rivalryId:normalizedRivalryId,accountId:context.accountId,deviceId:context.deviceId,now});const data={rivalryId:normalizedRivalryId,managerRole:normalizedRole,managerId:manager.id,linkedAt,lastConfirmedAt:now},envelope=await pairBuildEnvelope({revision,parentRevision,priorContentHash,updatedAt:now,updatedByAccountId:context.accountId,updatedByDeviceId:context.deviceId,data});
  // WRITE PHASE
  transaction.set(pairRef,envelope);for(const write of indexWrites)transaction.set(pairCareerIndexReference(context,write.indexId),write.value);return{ok:true,rivalryId:normalizedRivalryId,managerRole:normalizedRole,managerId:manager.id,managerLabel:manager.label,connectionState,providerSaveId:binding.saveId,providerProfileId:binding.profileId,revision:envelope.revision,careerIndexAppended:indexWrites.length>0};};}
function pairCreateDurableCreationWitness(context,role,manager){return pairCreateDurablePairWitness(context,role,manager,null,"pending-pair");}
function pairCreateDurableRedemptionWitness(context,role,manager,rivalryId){return pairCreateDurablePairWitness(context,role,manager,rivalryId,"active");}

  async function pairEnsureSaveLibraryAuthority(){const runtime=root.CareerModeSaveLibraryRuntime;if(runtime?.isReady?.())return runtime;if(typeof root.loadRuntimeScript!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_STORAGE_UNAVAILABLE","Career storage is unavailable.");await root.loadRuntimeScript("save-library-cutover","js/saveLibraryCutover.js",()=>typeof root.ensureSaveLibraryRuntimeAuthority==="function");await root.ensureSaveLibraryRuntimeAuthority();const active=root.CareerModeSaveLibraryRuntime;if(!active?.isReady?.())throw pairErrorWithCode("PERSISTENT_PAIR_STORAGE_UNAVAILABLE","Career storage could not be activated.");return active;}

  // r80: this browser's Save Library is a cache of the live Showdown. When the pair read says one is live here (ACTIVE, or Daniel's
  // own code still PENDING) and the exact shell is missing, it is rebuilt from the pair link's exact ids and the seasons in the
  // rivalry id (js/saveLibraryRuntime.js adoptOnlineEntry). No read or write; an exact shell is reused, another save never touched.
  async function pairAdoptOnlineShell(role,connectionState,rivalryId,saveId,profileId){const normalized=pairNormalizeManagerRole(role);if(connectionState!=="active"&&!(connectionState==="pending-pair"&&normalized==="playerOne"))return false;const runtime=await pairEnsureSaveLibraryAuthority();if(pairHasExactShowdownShell(normalized,saveId,profileId))return true;if(typeof runtime.adoptOnlineEntry!=="function")return false;return(await runtime.adoptOnlineEntry({saveId,profileId,role:normalized,totalRounds:pairSeasonFromCapability(rivalryId)}))?.ok===true;}
  async function pairDeleteExactPreparedShell(context,role,saveId,profileId){
    const normalizedRole=pairNormalizeManagerRole(role);
    if(!pairValidSaveId(saveId)||!pairValidProfileId(profileId))throw pairErrorWithCode("PERSISTENT_PAIR_BINDING_INVALID","The stale Showdown identity is invalid.");
    const runtime=await pairEnsureSaveLibraryAuthority(),binding=pairPreparedBindingForRole(context.pairing,normalizedRole);
    if(!binding)return{ok:true,status:"absent"};
    if(binding.saveId!==saveId||binding.profileId!==profileId)throw pairErrorWithCode("PERSISTENT_PAIR_LOCAL_CLEANUP_CONTEXT_CHANGED","The Showdown changed while the old connection was being removed. It was not deleted.");
    if(typeof runtime.deleteSave!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_STORAGE_UNAVAILABLE","Safe Showdown removal is unavailable.");
    const result=runtime.deleteSave(saveId);
    if(!result||result.ok!==true||result.deletedSaveId!==saveId)throw pairErrorWithCode("PERSISTENT_PAIR_LOCAL_CLEANUP_FAILED","The old online connection was closed, but its unfinished Showdown could not be cleared.");
    try{root.sessionStorage?.removeItem("careerModeShowdown.sharedJourneyPending.v1");}catch(_error){}
    return{ok:true,status:"deleted",saveId};
  }

  async function pairInitialize(options={}){if(state.busy&&pairBusyAction&&!pairBusyAction.refreshing)return pairBusyAction.done.then(()=>state);if(pairInitializePromise&&!options.force)return pairInitializePromise;pairInitializePromise=(async()=>{try{const context=await pairResolveContext(),link=await pairReadPairLink(context);if(!link)return pairSetState({status:"unpaired",initialized:true,busy:false,accountId:context.accountId,deviceId:context.deviceId,managerRole:null,managerId:null,rivalryId:null,connectionState:null,providerSaveId:null,providerProfileId:null,capability:null,closedRivalryId:pairLastClosedRivalryId,closedProviderSaveId:pairLastClosedProviderSaveId,message:"Daniel and Nik need to connect before the first Showdown."});let localManagerId=pairCurrentIdentityManagerId();if(localManagerId!==link.managerId&&typeof options.reconcileIdentity==="function"){await options.reconcileIdentity(link.managerId,link.managerRole);localManagerId=pairCurrentIdentityManagerId();}if(localManagerId&&localManagerId!==link.managerId)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH","Your player selection does not match this Google account. Reload and choose its linked player.");/* r79 PR3: after a reload Daniel's waiting code keeps its CMS17R- form when it is still his first real pairing. *//* Codex #904: a check that cannot answer shows no code yet (CHECK STATUS asks again), never an unverified code. */let realUnknown=false;if(link.connectionState==="pending-pair"&&link.managerRole==="playerOne"&&pairRealRivalryId!==link.rivalryId){try{if(await pairDanielNeedsRealPairing(context))pairRealRivalryId=link.rivalryId;}catch(_error){realUnknown=true;}}pairRequestDurableStorage();const active=link.connectionState==="active";if(active)await pairEnsureSaveLibraryAuthority();await pairAdoptOnlineShell(link.managerRole,link.connectionState,link.rivalryId,link.providerSaveId,link.providerProfileId).catch(()=>false);const localRecoveryReady=active&&pairHasExactShowdownShell(link.managerRole,link.providerSaveId,link.providerProfileId);return pairSetState({status:active?(localRecoveryReady?"paired":"recovery-required"):"waiting",initialized:true,busy:false,closedRivalryId:null,closedProviderSaveId:null,accountId:context.accountId,deviceId:context.deviceId,managerRole:link.managerRole,managerId:link.managerId,rivalryId:link.rivalryId,connectionState:link.connectionState,providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:link.connectionState==="pending-pair"&&!realUnknown?(()=>{try{return pairBuildPlayerJoinCode(link.rivalryId,{real:pairRealRivalryId===link.rivalryId});}catch(_error){return link.rivalryId;}})():null,message:active?(localRecoveryReady?`Welcome back, ${link.managerLabel}. Your Showdown is ready.`:`The online Showdown is still live, but it could not be loaded here. Tap BACK, then LOAD SHOWDOWN on Home to try again, or restore a backup, or start over.`):realUnknown?"Your account could not be checked just now, so the code is not shown yet. Check your internet, then tap CHECK STATUS.":`${link.managerLabel} is ready. Waiting for the other player to join.`});}catch(error){return pairSetState({status:error?.code==="PERSISTENT_PAIR_AUTH_REQUIRED"?"signed-out":"unavailable",initialized:true,busy:false,accountId:null,deviceId:null,managerRole:null,managerId:null,rivalryId:null,connectionState:null,providerSaveId:null,providerProfileId:null,capability:null,message:error?.code==="PERSISTENT_PAIR_AUTH_REQUIRED"?(error?.message||"Sign in before continuing."):pairIsProductError(error)?error.message:`${pairPlainProviderMessage(error,"Your Showdown could not be checked right now.",{permissionMessage:"This Google account could not read your Showdown connection right now."})} Tap CHECK STATUS to try again.`});}})().finally(()=>{pairInitializePromise=null;});return pairInitializePromise;}
  function pairSelectedRole(){return state.managerRole||pairCurrentIdentityRole();}
  const PAIR_SEASON_NIBBLE=Object.freeze({1:"1",3:"3",5:"5",10:"a"});
  const PAIR_SEASON_BY_NIBBLE=Object.freeze({1:1,3:3,5:5,a:10});
  function pairPreparedTotalRounds(){try{const runtime=root.CareerModeSaveLibraryRuntime,library=runtime?.getLibrarySnapshot?.(),entry=library&&Array.isArray(library.saves)?library.saves.find(item=>item&&item.saveId===library.activeSaveId):null,showdown=entry?.showdown,rounds=Number(showdown?.totalRounds);return showdown?.sharedJourney?.mode==="shared"&&showdown?.sharedJourney?.setupPending===true&&[1,3,5,10].includes(rounds)?rounds:null;}catch(_error){return null;}}
  function pairCreateSeasonBoundCapability(totalRounds,cryptoImpl=root.crypto){const rounds=Number(totalRounds),marker=PAIR_SEASON_NIBBLE[rounds];if(!marker)throw pairErrorWithCode("PERSISTENT_PAIR_SEASON_SELECTION_REQUIRED","Choose the number of seasons before creating a connection code.");if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_CRYPTO_UNAVAILABLE","Secure browser randomness is unavailable.");const bytes=new Uint8Array(32);cryptoImpl.getRandomValues(bytes);const hex=pairHexFromBytes(bytes);return pairNormalizeRivalryId(`pair_${marker}${hex.slice(1)}`);}
  function pairSeasonFromCapability(rivalryId){const normalized=pairNormalizeRivalryId(rivalryId),marker=normalized.slice(5,6).toLowerCase(),rounds=PAIR_SEASON_BY_NIBBLE[marker];if(!rounds)throw pairErrorWithCode("PERSISTENT_PAIR_JOIN_CODE_UPGRADE_REQUIRED","Ask Daniel to create a new connection code, then paste that new code here.");return rounds;}
  // r79 PR3: the first real pairing (Daniel holds a career start marker and no active partner yet) wraps the code as CMS17R-, so
  // Nik's phone knows to start his real career (write his marker) before redeeming. Every other code stays CMS17-.
  function pairBuildPlayerJoinCode(rivalryId,options={}){const normalized=pairNormalizeRivalryId(rivalryId);pairSeasonFromCapability(normalized);return `${options&&options.real===true?REAL_CODE_PREFIX:CODE_PREFIX}${normalized}`;}
  // BH-11 (#11): a pasted message such as "code: CMS17-pair_…" still joins when it holds exactly one code. Two different
  // codes in one paste stay invalid, and the error never echoes the pasted text.
  function pairExtractPastedCode(input){const found=new Map(),pattern=/(?:^|[^0-9a-z_])(CMS17(R?)-)?(pair_[0-9a-f]{64})(?![0-9a-z_])/gi;for(const match of input.matchAll(pattern)){const id=match[3].toLowerCase(),prior=found.get(id)||{wrapped:false,real:false};found.set(id,{wrapped:prior.wrapped||Boolean(match[1]),real:prior.real||/^r$/i.test(match[2]||"")});}if(found.size!==1)return null;const [[id,flags]]=[...found];return{id,wrapped:flags.wrapped,real:flags.real};}
  function pairParsePlayerJoinCode(value){const input=String(value||"").trim(),anchored=/^CMS17(R?)-(pair_[0-9a-f]{64})$/i.exec(input),extracted=anchored?{id:anchored[2],wrapped:true,real:/^r$/i.test(anchored[1])}:(/^pair_[0-9a-f]{64}$/i.test(input)?{id:input,wrapped:false,real:false}:pairExtractPastedCode(input));if(extracted&&extracted.wrapped){const rivalryId=pairNormalizeRivalryId(extracted.id);return{rivalryId,totalRounds:pairSeasonFromCapability(rivalryId),legacy:false,real:extracted.real===true};}if(extracted)return{rivalryId:pairNormalizeRivalryId(extracted.id),totalRounds:null,legacy:true,real:false};throw pairErrorWithCode("PAIRING_CAPABILITY_INVALID","Daniel's connection code is invalid.");}
  // r79: the active save of a Showdown that is already CLOSED (finished, or deleted on Daniel's phone; the pair-link read or the
  // DELETED notice says which rivalry and save) is not "a different unfinished Showdown". Its empty shell of the same length is
  // reused as before; otherwise Nik's JOIN makes a new shell beside it and that save stays in the library untouched.
  function pairClosedShowdownSaveId(role){return role==="playerTwo"&&!state.rivalryId&&/^pair_[0-9a-f]{64}$/.test(String(state.closedRivalryId||""))&&pairValidSaveId(state.closedProviderSaveId)?state.closedProviderSaveId:null;}
  async function pairProvisionJoinerBinding(context,role,totalRounds){let binding=pairPreparedBindingForRole(context.pairing,role);const closedSaveId=pairClosedShowdownSaveId(role);if(binding){const preparedRounds=pairPreparedTotalRounds();if(role==="playerTwo"&&Number(totalRounds)!==preparedRounds){if(binding.saveId!==closedSaveId)throw pairErrorWithCode("PERSISTENT_PAIR_SEASON_MISMATCH","You still have a different unfinished Showdown. End it in Settings (END SHOWDOWN), then paste Daniel's code again.");binding=null;}else return binding;}if(role!=="playerTwo")return pairEnsurePreparedBinding(context,role);if(![1,3,5,10].includes(Number(totalRounds)))throw pairErrorWithCode("PERSISTENT_PAIR_JOIN_CODE_UPGRADE_REQUIRED","Ask Daniel to create a new connection code, then paste that new code here.");const entry=await pairLoadSharedJourneyEntry();if(!entry||typeof entry.provisionJoinerShell!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_SHARED_ENTRY_UNAVAILABLE","Nik's career could not be prepared automatically.");await entry.provisionJoinerShell(Number(totalRounds));binding=pairPreparedBindingForRole(context.pairing,role);if(!binding||pairPreparedTotalRounds()!==Number(totalRounds))throw pairErrorWithCode("PERSISTENT_PAIR_SHARED_SHELL_REQUIRED","Nik's career could not be prepared automatically.");return binding;}
  function pairAlreadyActiveState(){if(state.connectionState!=="active"||!state.rivalryId)return null;const recoveryRequired=state.status==="recovery-required";return pairSetState({status:recoveryRequired?"recovery-required":"paired",busy:false,message:recoveryRequired?state.message:"Daniel and Nik are already connected."});}
  function pairProviderConflictNeedsRefresh(error){return error?.code==="PERSISTENT_PAIR_PENDING_CONFLICT"||error?.code==="PERSISTENT_PAIR_ACTIVE_CONFLICT";}

  // Codex #904 (P1, twice): a permanent pair's code is created only while BOTH partner records, read again INSIDE the
  // code-creation transaction, still name each other. An UNPAIR on either side (another Daniel browser, or Nik's Settings) that
  // commits after the fresh reads in START then conflicts with this transaction (it retries and stops) instead of leaving an open
  // code Nik either could still redeem or can never join. Two more reads, only for a permanent pair's code.
  function pairCreationWhilePaired(context,role,real,witness,seen){const mine=role==="playerOne"&&!real?pairPartnerRecordFor(context.accountId):null;if(!mine||mine.active!==true||typeof witness!=="function")return witness;return async args=>{const own=await args.transaction.get(pairPartnerReference(context)),other=await args.transaction.get(pairPartnerReference(context,mine.partnerAccountId));let record=null,theirs=null;try{record=own.exists()?pairParsePartnerRecord(own.data(),context.accountId):null;}catch(_error){record=null;}try{theirs=other.exists()?pairParsePartnerRecord(other.data(),mine.partnerAccountId):null;}catch(_error){theirs=null;}if(!record||record.active!==true||record.partnerAccountId!==mine.partnerAccountId||record.myRole!==mine.myRole){seen.seen="here";seen.record=record;throw pairErrorWithCode("PERMANENT_PARTNER_UNPAIRED_HERE","Nik was unpaired on another screen, so nothing was started. Tap START to pair again.");}if(!theirs||theirs.active!==true||theirs.partnerAccountId!==context.accountId||theirs.myRole===mine.myRole){seen.seen="partner";seen.record=null;throw pairErrorWithCode("PARTNER_UNPAIRED","Nik is no longer paired with you, so nothing was started. Tap PAIR AGAIN.");}seen.seen=false;seen.record=null;return await witness(args);};}
  // The same on Nik's side: a permanent pair's plain code is redeemed only while Nik's own record, read again INSIDE the redeem
  // transaction, still names Daniel, so an UNPAIR from Nik's other browser conflicts with the join. One more read, only here.
  function pairRedeemWhilePaired(context,role,parsed,witness,seen){const mine=role==="playerTwo"&&!parsed.real?pairPartnerRecordFor(context.accountId):null;if(!mine||mine.active!==true||typeof witness!=="function")return witness;return async args=>{const own=await args.transaction.get(pairPartnerReference(context));let record=null;try{record=own.exists()?pairParsePartnerRecord(own.data(),context.accountId):null;}catch(_error){record=null;}if(!record||record.active!==true||record.partnerAccountId!==mine.partnerAccountId||record.myRole!==mine.myRole){seen.seen="here";seen.record=record;throw pairErrorWithCode("PERMANENT_PARTNER_UNPAIRED_HERE","This account was unpaired on another screen, so nothing was joined. Ask Daniel to pair again.");}seen.seen=false;seen.record=null;return await witness(args);};}
  function pairAdoptUnpairedHere(context,record){partnerState=pairFreezeDeep({status:record?"ready":"none",accountId:context.accountId,record:record?pairFreezeDeep(record):null,code:null,checkedAt:Date.now()});pairSetPartnerSide("not-paired",context.accountId,null);pairRealRivalryId=null;pairNotifyPartner();}
  async function pairStartPairing(options={}){if(state.busy)return state;const active=pairAlreadyActiveState();if(active)return active;const action=pairBeginBusyAction();pairSetState({status:"starting",busy:true,message:"Preparing your Showdown…"});try{const context=await pairResolveContext(),role=pairNormalizeManagerRole(options.managerRole||pairSelectedRole()),manager=pairRequireCurrentIdentity(role),binding=await pairEnsurePreparedBinding(context,role),totalRounds=pairPreparedTotalRounds(),capability=pairCreateSeasonBoundCapability(totalRounds),durableWitness=pairCreateDurableCreationWitness(context,role,manager);/* r79 PR3: before the code exists, know whether this is Daniel's first real pairing (CMS17R- code) or a Showdown of the permanent pair (JOIN note). Page memo: the marker once; the partner record is read fresh here (Codex #904). */const real=role==="playerOne"&&await pairDanielNeedsRealPairing(context,{fresh:true});if(role==="playerOne"&&!real&&!pairPartnerActiveFor("playerOne"))throw pairErrorWithCode("CAREER_START_REQUIRED","Go Home and tap START to begin your career. Nothing was started.");const unpairedHere={seen:false,record:null};/* Codex #915: a permanent-pair code only while Nik's record still names Daniel, read fresh here (seasons may have been chosen minutes after the START tap; one read per code). An UNPAIR on Nik's side or an unanswered check makes no code Nik cannot join; START then leads into PAIR AGAIN. */if(role==="playerOne"&&!real){const side=await pairReadPartnerSide({context,fresh:true});if(side.status!=="mutual"&&side.status!=="not-paired")throw side.status==="unpaired"?pairErrorWithCode("PARTNER_UNPAIRED","Nik is no longer paired with you, so nothing was started. Tap PAIR AGAIN."):pairRealModeUnknown();}const result=await context.pairing.createPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:await context.pairing.getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto}),...(pairPartnerActiveFor("playerOne")?{ttlMs:JOIN_INVITE_TTL_MS}:{}),binding,capability,cryptoImpl:root.crypto,durableWitness:pairCreationWhilePaired(context,role,real,durableWitness,unpairedHere)});if(!result?.ok){if(unpairedHere.seen==="here")pairAdoptUnpairedHere(context,unpairedHere.record);else if(unpairedHere.seen==="partner"){pairSetPartnerSide("unpaired",context.accountId,pairPartnerRecordFor(context.accountId)?.partnerAccountId||null);pairNotifyPartner();}throw pairErrorWithCode(result?.code||"PERSISTENT_PAIR_CREATE_FAILED",result?.message||"The connection code could not be created.");}const link=result.durableWitness;if(!link?.ok||link.rivalryId!==result.rivalryId)throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_FAILED","The connection code could not be bound to durable account authority.");const other=role==="playerOne"?"Nik":"Daniel",playerCode=pairBuildPlayerJoinCode(result.capability,{real});pairRealRivalryId=real?link.rivalryId:null;pairRequestDurableStorage();/* Codex #904 (P2): a permanent pair's JOIN note is still part of this START, so the action stays busy (one flight: NEW CODE and CHECK STATUS cannot start a second createPairing) until the note write settles. */const partner=pairPartnerRecordFor(context.accountId),noteFollows=!real&&role==="playerOne"&&Boolean(partner&&partner.active===true&&partner.myRole==="playerOne");const waiting=pairSetState({status:"waiting",initialized:true,busy:noteFollows,accountId:context.accountId,deviceId:context.deviceId,managerRole:role,managerId:manager.id,rivalryId:link.rivalryId,connectionState:"pending-pair",providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:playerCode,message:`Send this code to ${other}. It is needed only once.`});/* r79 PR3: a permanent pair gets Nik's JOIN note in its OWN transaction after createPairing (the pairing commit is near the 20-access limit). A note that fails never breaks the Showdown: the code above still works. */if(noteFollows){const note=await pairWriteJoinNoteSafely({context,rivalryId:link.rivalryId,expiresAtEpochMs:result.expiresAtEpochMs});if(note.ok&&state.rivalryId===link.rivalryId&&state.connectionState==="pending-pair")return pairSetState({busy:false,message:"Nik can tap JOIN on his Home screen now. This code works too."});/* Codex #904: Nik's UNPAIR landed after the code but before its note (the note Rules refuse it), so Nik can never join this code. One fresh check, only when the note failed; the code is then closed so START can pair again. */if(!note.ok&&state.rivalryId===link.rivalryId&&state.connectionState==="pending-pair"){let side=null;try{side=await pairReadPartnerSide({context,fresh:true});}catch(_error){side=null;}if(side?.status==="unpaired"&&state.rivalryId===link.rivalryId){/* the close re-reads the link (as the conflict refresh does), so this action no longer holds it */action.refreshing=true;pairSetState({busy:false});let closed=false;try{closed=(await pairAbandonCurrentShowdown({expectedRivalryId:link.rivalryId}))?.ok===true;}catch(_error){closed=false;}/* Codex #923: only a confirmed close says nothing was started; otherwise the Showdown is still online and Settings DELETE is the retry */return pairSetState({status:"error",busy:false,capability:null,message:closed?"Nik is no longer paired with you, so nothing was started. Tap PAIR AGAIN.":"Nik is no longer paired with you, and this Showdown could not be closed yet. End it in Settings (END SHOWDOWN), then tap PAIR AGAIN."});}}return pairSetState({busy:false});}return waiting;}catch(error){if(pairProviderConflictNeedsRefresh(error)){action.refreshing=true;return await pairInitialize({force:true});}return pairSetState({status:error?.code?.includes("SHARED_SHELL")||error?.code==="PERSISTENT_PAIR_SEASON_SELECTION_REQUIRED"?"save-required":"error",busy:false,message:pairPlainProviderMessage(error,"The Showdown could not be started. Try again.",{clockHint:true,permissionMessage:"The connection code could not be created."})});}finally{action.release();}}
  // BH-11 (#7): the Save ids present before Nik's join, so a failed join can tell a shell it just created from an existing one.
  async function pairKnownSaveIds(){try{await pairEnsureSaveLibraryAuthority();const library=root.CareerModeSaveLibraryRuntime?.getLibrarySnapshot?.();return Array.isArray(library?.saves)?new Set(library.saves.map(entry=>entry&&entry.saveId).filter(Boolean)):null;}catch(_error){return null;}}
  // BH-11 (#3): read-only re-check after a failed join. checked=false means the outcome is unknown (keep everything).
  async function pairReadCommittedJoin(context,parsed,role){if(!context||!parsed||!role)return{checked:false,link:null};try{const link=await pairReadPairLink(context);return{checked:true,link:link&&link.rivalryId===parsed.rivalryId&&link.managerRole===role&&link.connectionState==="active"?link:null};}catch(_error){return{checked:false,link:null};}}
  async function pairJoinPairing(capability,options={}){if(state.busy)return state;const active=pairAlreadyActiveState();if(active)return active;const action=pairBeginBusyAction();pairSetState({status:"joining",busy:true,message:"Joining Daniel's Showdown…"});let parsed=null,context=null,role=null,manager=null,binding=null,createdShell=null;const unpairedHere={seen:false,record:null};try{parsed=pairParsePlayerJoinCode(capability);context=await pairResolveContext();role=pairNormalizeManagerRole(options.managerRole||pairSelectedRole());manager=pairRequireCurrentIdentity(role);/* r79 PR3: a CMS17R- code is Daniel's first real pairing. Nik starts his real career (his marker) BEFORE redeeming, because the marker must name exactly his career index as it is now; afterwards the new Showdown is already in it. */if(role==="playerTwo")await pairRequireJoinAllowed(context,parsed,role);if(parsed.real&&role==="playerTwo"){/* Codex #903: the R prefix is only text, so the code is first checked joinable (the same capability read the redeem makes); a code that cannot be joined writes nothing, not even the marker. */await pairCheckJoinableBeforeMarker(context,parsed.rivalryId,role);await pairEnsureOwnMarkerBeforeRealJoin();}const knownSaveIds=role==="playerTwo"?await pairKnownSaveIds():null;binding=await pairProvisionJoinerBinding(context,role,parsed.totalRounds);if(knownSaveIds&&binding&&!knownSaveIds.has(binding.saveId))createdShell={saveId:binding.saveId,profileId:binding.profileId};const rivalryId=parsed.rivalryId,durableWitness=pairRedeemWhilePaired(context,role,parsed,pairCreateDurableRedemptionWitness(context,role,manager,rivalryId),unpairedHere);const result=await context.pairing.redeemPairing({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,identity:await context.pairing.getOrCreateDeviceIdentity({indexedDBImpl:root.indexedDB,cryptoImpl:root.crypto}),binding,capability:rivalryId,cryptoImpl:root.crypto,durableWitness});if(!result?.ok&&unpairedHere.seen)pairAdoptUnpairedHere(context,unpairedHere.record);if(!result?.ok)throw pairErrorWithCode(result?.code||"PERSISTENT_PAIR_JOIN_FAILED",result?.message||"The code could not be joined.");const link=result.durableWitness;if(!link?.ok||link.rivalryId!==result.rivalryId)throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_FAILED","The players could not be connected with durable recovery authority.");try{await pairAttachRecoveryPointer(context,binding,link.rivalryId);}catch(_error){}if(parsed.real&&role==="playerTwo"){pairRealRivalryId=link.rivalryId;await pairRecordRealPairing(link.rivalryId,role,context);}pairRequestDurableStorage();return pairSetState({status:"paired",initialized:true,busy:false,accountId:context.accountId,deviceId:context.deviceId,managerRole:role,managerId:manager.id,rivalryId:link.rivalryId,connectionState:"active",providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:null,message:`${manager.label} joined Daniel's Showdown. Continue Career when both players are ready.`});}catch(error){
    // BH-11 (#3): a lost acknowledgement can hide a join that did commit, and the retry then reads as "already used".
    const committed=await pairReadCommittedJoin(context,parsed,role);
    if(committed.link){const link=committed.link;if(manager&&binding&&binding.saveId===link.providerSaveId&&binding.profileId===link.providerProfileId){try{await pairAttachRecoveryPointer(context,binding,link.rivalryId);}catch(_error){}if(parsed.real&&role==="playerTwo"){pairRealRivalryId=link.rivalryId;await pairRecordRealPairing(link.rivalryId,role,context);}pairRequestDurableStorage();return pairSetState({status:"paired",initialized:true,busy:false,accountId:context.accountId,deviceId:context.deviceId,managerRole:role,managerId:manager.id,rivalryId:link.rivalryId,connectionState:"active",providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:null,message:`${manager.label} joined Daniel's Showdown. Continue Career when both players are ready.`});}action.refreshing=true;return await pairInitialize({force:true});}
    if(pairProviderConflictNeedsRefresh(error)){action.refreshing=true;return await pairInitialize({force:true});}
    // BH-11 (#7): remove only the empty local copy this attempt created, and only when the join was definitely refused.
    if(createdShell&&committed.checked&&pairJoinFailureIsDefinitive(error)){try{await pairDeleteExactPreparedShell(context,role,createdShell.saveId,createdShell.profileId);}catch(_error){}}
    return pairSetState({status:error?.code?.includes("SHARED_SHELL")?"save-required":"error",busy:false,message:pairContextualJoinMessage(error)});
  }finally{action.release();}}
function pairContextualJoinMessage(error){const pairing=root.CareerModeSparkPrivatePairing;if(pairing&&typeof pairing.pairingJoinErrorMessage==="function")return pairing.pairingJoinErrorMessage(error);return error?.message||"The code could not be joined.";}
  async function pairRetryPairLink(){if(state.busy||!state.rivalryId||!state.managerRole)return state;const priorConnectionState=state.connectionState,priorCapability=state.capability,providerSaveId=state.providerSaveId,providerProfileId=state.providerProfileId;pairSetState({status:"retrying-link",busy:true,message:"Finishing your connection…"});try{const context=await pairResolveContext(),role=pairNormalizeManagerRole(state.managerRole||pairSelectedRole()),manager=pairRequireCurrentIdentity(role);await pairAdoptOnlineShell(role,priorConnectionState,state.rivalryId,providerSaveId,providerProfileId).catch(()=>false);let binding=await pairExactLocalBindingForProviderSlot(context.pairing,role,providerSaveId,providerProfileId);if(!binding&&priorConnectionState==="pending-pair")binding=pairPreparedBindingForRole(context.pairing,role);if(!binding)throw pairErrorWithCode("PERSISTENT_PAIR_SHOWDOWN_NOT_LOADED","This Showdown could not be loaded here to finish the connection. Try again.");const link=await pairPersistPairLinkWithRetry(context,state.rivalryId,role,3);if(link.connectionState==="active"){const recovery=await pairAttachRecoveryPointer(context,binding,link.rivalryId);if(!recovery.ok)throw pairErrorWithCode(recovery.result?.code||"PERSISTENT_PAIR_ATTACH_FAILED",recovery.result?.message||"The Showdown connection was saved, but it could not be checked here yet. Try again.");return pairSetState({status:"paired",initialized:true,busy:false,accountId:context.accountId,deviceId:context.deviceId,managerRole:role,managerId:manager.id,rivalryId:link.rivalryId,connectionState:"active",providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:null,message:`${manager.label} is ready. Continue Career when both players are ready.`});}const other=role==="playerOne"?"Nik":"Daniel";return pairSetState({status:"waiting",initialized:true,busy:false,accountId:context.accountId,deviceId:context.deviceId,managerRole:role,managerId:manager.id,rivalryId:link.rivalryId,connectionState:"pending-pair",providerSaveId:link.providerSaveId,providerProfileId:link.providerProfileId,capability:priorCapability,message:`Connection saved. Send the code to ${other}. It is needed only once.`});}catch(error){return pairSetState({status:"pair-link-retry",busy:false,connectionState:priorConnectionState,providerSaveId,providerProfileId,capability:priorCapability,message:error?.message?`Connection still needs attention: ${error.message} Choose RETRY CONNECTION before leaving this page.`:"The connection still needs to be saved. Choose RETRY CONNECTION before leaving this page."});}}
  async function pairContinueOnlineShowdown(){if(state.busy||!state.rivalryId)return state;pairSetState({status:"continuing",busy:true,message:"Opening your career…"});try{const context=await pairResolveContext(),role=pairNormalizeManagerRole(state.managerRole||pairSelectedRole());pairRequireCurrentIdentity(role);await pairEnsureSaveLibraryAuthority();await pairAdoptOnlineShell(role,state.connectionState,state.rivalryId,state.providerSaveId,state.providerProfileId).catch(()=>false);const binding=await pairExactLocalBindingForProviderSlot(context.pairing,role,state.providerSaveId,state.providerProfileId);if(!binding)throw pairErrorWithCode("PERSISTENT_PAIR_SHOWDOWN_NOT_LOADED","This Showdown could not be loaded here. Check your connection and try again.");const recovery=await pairAttachRecoveryPointer(context,binding,state.rivalryId);if(!recovery.ok)throw pairErrorWithCode(recovery.result?.code||"PERSISTENT_PAIR_ATTACH_FAILED",recovery.result?.message||"The Showdown could not be checked here. Try again.");const entry=await pairLoadSharedJourneyEntry();if(!entry||typeof entry.openPanel!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_SHARED_ENTRY_UNAVAILABLE","Career entry is unavailable.");entry.install?.();/* r80 resume (G7): an ACTIVE session goes straight back into the game, as after a reload */await entry.openPanel({resumeActive:true});return pairSetState({status:"paired",busy:false,connectionState:"active",message:"Career ready."});}catch(error){return pairSetState({status:error?.code==="PERSISTENT_PAIR_SHOWDOWN_NOT_LOADED"?"recovery-required":"error",busy:false,message:error?.message||"The career could not be opened."});}}
  // r79: once this device's own JOIN (Nik) or WAITING (Daniel) sees the pair ACTIVE it continues into the Showdown by itself,
  // as R6 already does for sessions. The Connect layer closes first; if continuing fails it opens again on the same screen
  // with START CAREER / TRY CONTINUE AGAIN as the fallback. It never acts for the other device.
  let pairAutoContinuePromise=null;
  function pairAutoContinueAfterConnect(){if(pairAutoContinuePromise)return pairAutoContinuePromise;if(state.busy||state.connectionState!=="active"||state.status!=="paired"||!state.rivalryId)return Promise.resolve(null);/* r79 PR3: however Daniel learned Nik joined his first real pairing, his record write starts with the continue (single-flight; this page's CMS17R- rivalry only) */if(state.managerRole==="playerOne"&&pairRealRivalryId===state.rivalryId)void pairRecordRealPairing(state.rivalryId,"playerOne");const layer=root.CareerModeConnectPlayersScreenV10;pairAutoContinuePromise=(async()=>{try{layer?.close?.({restoreFocus:false});}catch(_error){}const next=await pairContinueOnlineShowdown();if(next?.status!=="paired"){try{await layer?.open?.({sync:false,stayOnScreen:true});}catch(_error){}}return next;})().finally(()=>{pairAutoContinuePromise=null;});return pairAutoContinuePromise;}
  async function pairJoinAndContinue(capability,options={}){const wasActive=state.connectionState==="active",joined=await pairJoinPairing(capability,options);if(!wasActive&&options.autoContinue!==false&&joined?.status==="paired"&&joined.connectionState==="active")await pairAutoContinueAfterConnect();return joined;}

  // r79 PR3: the permanent pair (owner decisions 2026-10-17). accounts/{uid}/partner/current names the account this one paired
  // with through a real (marker-holding) pairing; accounts/{nikUid}/partnerInbox/current is the private JOIN note Daniel's START
  // leaves for Nik. Reads: the partner record once per page load; the note only when Nik's Home is shown or the tab comes
  // back, at most once per 30 s and never in render. Writes: the note in its own small transaction after createPairing; each
  // partner record once, by its owner, after the real pairing is ACTIVE. Every shape below is exactly what the pair fragment
  // of the Rules accepts (firestore.persistent-pair-production.fragment.rules, cmsPartner* functions).
  // Codex #908: a device clock can run ahead of the server; a code counts as expired here only 10 minutes after its expiry.
  const PAIR_CLOCK_MARGIN_MS=10*60*1000;
  // Job 12: only a permanent pair's Home START requests the full agreed JOIN window; the note keeps the invite's exact expiry.
  // One minute under the Rules cap (expiresAt <= request.time + 30 min), so a device clock running slightly fast never refuses START.
  const JOIN_INVITE_TTL_MS=29*60*1000;
  const PARTNER_DOC_ID="current",JOIN_NOTE_MEMO_MS=30000,JOIN_NOTE_WATCH_WINDOW_MS=600000,PARTNER_RETRY_MS=30000,REAL_CODE_PREFIX="CMS17R-",CODE_PREFIX="CMS17-",PARTNER_EVENT="career-mode-permanent-pair-change";
  const PARTNER_KEYS="active,myRole,pairedAt,pairedViaRivalryId,partnerAccountId,schemaVersion,updatedAt",NOTE_KEYS="createdAt,expiresAt,fromAccountId,rivalryId,schemaVersion,totalSeasons";
  let partnerState=pairFreezeDeep({status:"unknown",accountId:null,record:null,code:null,checkedAt:0}),partnerReadPromise=null;
  let joinNoteState=pairFreezeDeep({status:"unknown",accountId:null,note:null,code:null,checkedAt:0}),joinNotePromise=null,joinNoteExpiryTimer=null;
  // The rivalry this page made with a CMS17R- code (Daniel) or joined with one (Nik): only that pairing writes partner records.
  let pairRealRivalryId=null;
  function pairPartnerReference(context,accountId){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",accountId||context.accountId,"partner",PARTNER_DOC_ID);}
  function pairInboxReference(context,accountId){return context.services.firestoreSdk.doc(context.services.firestore,"accounts",accountId,"partnerInbox",PARTNER_DOC_ID);}
  function pairParsePartnerRecord(value,accountId){const keys=value&&typeof value==="object"?Object.keys(value).sort().join(","):"";if(keys!==PARTNER_KEYS||value.schemaVersion!==1||typeof value.partnerAccountId!=="string"||!value.partnerAccountId||value.partnerAccountId===accountId||!MANAGER_BY_ROLE[value.myRole]||typeof value.active!=="boolean")throw pairErrorWithCode("PERMANENT_PARTNER_INVALID","The saved partner record is invalid.");return pairFreezeDeep({partnerAccountId:value.partnerAccountId,myRole:value.myRole,pairedViaRivalryId:pairNormalizeRivalryId(value.pairedViaRivalryId),pairedAtEpochMs:pairTimestampMillis(value.pairedAt),active:value.active});}
  function pairParseJoinNote(value,partnerAccountId){try{const keys=value&&typeof value==="object"?Object.keys(value).sort().join(","):"";if(keys!==NOTE_KEYS||value.schemaVersion!==1||typeof partnerAccountId!=="string"||value.fromAccountId!==partnerAccountId)return null;const rivalryId=pairNormalizeRivalryId(value.rivalryId),totalSeasons=pairSeasonFromCapability(rivalryId),expiresAtEpochMs=pairTimestampMillis(value.expiresAt);if(value.totalSeasons!==totalSeasons||!Number.isFinite(expiresAtEpochMs))return null;return pairFreezeDeep({rivalryId,totalSeasons,fromAccountId:value.fromAccountId,createdAtEpochMs:pairTimestampMillis(value.createdAt),expiresAtEpochMs});}catch(_error){return null;}}
  function pairPartnerRecordFor(accountId){return partnerState.status==="ready"&&partnerState.accountId===accountId?partnerState.record:null;}
  function pairPartnerActiveFor(role){const record=pairPartnerRecordFor(state.accountId||partnerState.accountId);return Boolean(record&&record.active===true&&(!role||record.myRole===role));}
  function pairNotifyPartner(){try{if(typeof root.dispatchEvent==="function"&&typeof root.CustomEvent==="function")root.dispatchEvent(new root.CustomEvent(PARTNER_EVENT,{detail:{partner:partnerState.status,note:joinNoteState.status}}));}catch(_error){}pairRender();}
  function pairServerTime(sdk){if(typeof sdk?.serverTimestamp!=="function")throw pairErrorWithCode("PERMANENT_PARTNER_PROVIDER_UNAVAILABLE","The online service is not ready yet. Try again.");return sdk.serverTimestamp();}
  // Read once per page load per account (a failed read is tried again at most every 30 s). Never throws.
  // Codex #904/#918: fresh (code creation and redeem only) reads the server itself (no copy, no read already in flight), so an
  // UNPAIR from another device counts at once.
  async function pairReadPartnerRecord(options={}){let context;try{context=options.context||await pairResolveContext();}catch(_error){return partnerState;}const accountId=context.accountId,now=Date.now(),fresh=options.fresh===true;if(!fresh&&partnerState.accountId===accountId&&(partnerState.status==="ready"||partnerState.status==="none"||(partnerState.status==="unavailable"&&now-partnerState.checkedAt<PARTNER_RETRY_MS)))return partnerState;if(!fresh&&partnerReadPromise&&partnerReadPromise.accountId===accountId)return partnerReadPromise.promise;const promise=(async()=>{try{const ref=pairPartnerReference(context);if(fresh)root.CareerModeFirestoreBudget?.readServerNext?.(ref.path);const record=await context.services.firestoreSdk.runTransaction(context.services.firestore,async transaction=>{const snapshot=await transaction.get(ref);return snapshot.exists()?pairParsePartnerRecord(snapshot.data(),accountId):null;});partnerState=pairFreezeDeep({status:record?"ready":"none",accountId,record,code:null,checkedAt:Date.now()});}catch(error){partnerState=pairFreezeDeep({status:"unavailable",accountId,record:null,code:error?.code||"PERMANENT_PARTNER_UNAVAILABLE",checkedAt:Date.now()});}pairNotifyPartner();return partnerState;})().finally(()=>{if(partnerReadPromise&&partnerReadPromise.promise===promise)partnerReadPromise=null;});partnerReadPromise={accountId,promise};return promise;}
  // One partner record write, by its owner, only while the named rivalry is ACTIVE with both managers in their own slots.
  // Daniel writes his only after this transaction has read the rivalry ACTIVE with Nik's account in the playerTwo slot.
  // requirePartnerRecord (reload recovery): also require the other manager's own record to name this account already.
  async function pairWritePartnerRecord(options={}){const context=options.context||await pairResolveContext(),sdk=context.services.firestoreSdk,rivalryId=pairNormalizeRivalryId(options.rivalryId||state.rivalryId),role=pairNormalizeManagerRole(options.managerRole||state.managerRole||pairSelectedRole());pairRequireCurrentIdentity(role);const result=await sdk.runTransaction(context.services.firestore,async transaction=>{
    // READ PHASE
    const rivalrySnapshot=await transaction.get(pairRivalryReference(context,rivalryId)),rivalry=rivalrySnapshot.exists()?rivalrySnapshot.data():null,slots=rivalry?.data?.managerSlots;
    if(!pairIsEnvelopeValue(rivalry,"rivalry",rivalryId)||rivalry.data.connectionState!=="active"||!Array.isArray(slots)||slots.length!==2||slots[0]?.slotId!=="playerOne"||slots[1]?.slotId!=="playerTwo"||slots[0].entitlementState!=="active"||slots[1].entitlementState!=="active"||!Array.isArray(rivalry.data.authorizedAccountIds)||rivalry.data.authorizedAccountIds.length!==2)throw pairErrorWithCode("PERMANENT_PARTNER_PAIRING_INACTIVE","Daniel and Nik are not connected in this Showdown yet.");
    const mine=role==="playerOne"?slots[0]:slots[1],theirs=role==="playerOne"?slots[1]:slots[0];
    if(mine.accountId!==context.accountId||typeof theirs.accountId!=="string"||!theirs.accountId||theirs.accountId===context.accountId)throw pairErrorWithCode("PERMANENT_PARTNER_MEMBERSHIP_MISSING","This account is not part of this Showdown.");
    if(options.requirePartnerRecord===true){const other=await transaction.get(pairPartnerReference(context,theirs.accountId)),value=other.exists()?pairParsePartnerRecord(other.data(),theirs.accountId):null;if(!value)throw pairErrorWithCode("PERMANENT_PARTNER_NOT_FOUND","The other manager has no saved partner record yet.");if(value.active!==true||value.partnerAccountId!==context.accountId||value.myRole===role)throw pairErrorWithCode("PERMANENT_PARTNER_NOT_CONFIRMED","The other manager has not confirmed this pairing.");}
    const ref=pairPartnerReference(context),snapshot=await transaction.get(ref),existing=snapshot.exists()?pairParsePartnerRecord(snapshot.data(),context.accountId):null;
    // Job 14: both post-JOIN writes may have dropped. The existing marker and rivalry are durable proof of a real
    // pairing (the same hidden-id and time boundaries as cmsPartnerPairingValid), so no foreign missing-document read
    // is needed. Re-read own absence and the exact current link in this transaction; UNPAIR is never absence.
    if(options.recoverMissing===true){
      if(existing)throw pairErrorWithCode("PERMANENT_PARTNER_NOT_CONFIRMED","This account already has a saved partner decision.");
      const linkSnapshot=await transaction.get(pairLinkReference(context)),link=linkSnapshot.exists()?pairParsePairLink(linkSnapshot.data(),context.accountId):null;
      const markerSnapshot=await transaction.get(sdk.doc(context.services.firestore,"accounts",context.accountId,"careerStart",PARTNER_DOC_ID));
      const markerApi=await pairLoadCareerStartMarker(),marker=markerSnapshot.exists()?markerApi?.parseMarker?.(markerSnapshot.data()):null;
      const createdAt=pairTimestampMillis(rivalry.data.createdAt),marginMs=(role==="playerOne"?5:35)*60*1000;
      if(!link||link.rivalryId!==rivalryId||link.managerRole!==role||!marker||marker.status!=="ready"||marker.hiddenRivalryIds.includes(rivalryId)||!Number.isFinite(createdAt)||createdAt<marker.startedAt-marginMs||!rivalry.data.authorizedAccountIds.includes(mine.accountId)||!rivalry.data.authorizedAccountIds.includes(theirs.accountId))throw pairErrorWithCode("PERMANENT_PARTNER_NOT_CONFIRMED","This Showdown has not confirmed a real pairing.");
    }
    if(existing&&existing.active===true){if(existing.partnerAccountId===theirs.accountId&&existing.myRole===role)return{ok:true,status:"already-paired",record:existing};throw pairErrorWithCode("PERMANENT_PARTNER_CONFLICT","This account is paired with another account. Unpair it in Settings first.");}
    // WRITE PHASE (create, or re-pair after UNPAIR)
    transaction.set(ref,{schemaVersion:1,partnerAccountId:theirs.accountId,myRole:role,pairedViaRivalryId:rivalryId,pairedAt:pairServerTime(sdk),active:true,updatedAt:pairServerTime(sdk)});
    return{ok:true,status:existing?"re-paired":"paired",record:pairFreezeDeep({partnerAccountId:theirs.accountId,myRole:role,pairedViaRivalryId:rivalryId,pairedAtEpochMs:Date.now(),active:true})};});
    partnerState=pairFreezeDeep({status:"ready",accountId:context.accountId,record:result.record,code:null,checkedAt:Date.now()});joinNoteState=pairFreezeDeep({status:"unknown",accountId:null,note:null,code:null,checkedAt:0});/* r79 PR4: this page just (re)paired through a real pairing both managers write: no partner-side read for it. */pairSetPartnerSide("mutual",context.accountId,result.record.partnerAccountId);pairNotifyPartner();return result;}
  // Never throws: a partner record that cannot be written is tried once more, then left for retriable reload recovery.
  let pairRealRecording=null;
  // Single-flight per rivalry: the waiting poll and any other path that ends Daniel's wait (#901 pairContinueAfterWaitEnded) share one write; a write that ended without a record may be tried again later.
  function pairRecordRealPairing(rivalryId,role,context=null){let id;try{id=pairNormalizeRivalryId(rivalryId);}catch(_error){return Promise.resolve(null);}if(pairRealRivalryId!==id)return Promise.resolve(null);if(pairRealRecording&&pairRealRecording.id===id&&pairRealRecording.role===role)return pairRealRecording.promise;const promise=(async()=>{for(let attempt=0;attempt<2;attempt+=1){try{return await pairWritePartnerRecord({context:context||undefined,rivalryId:id,managerRole:role});}catch(error){if(!error||!PAIR_AMBIGUOUS_PROVIDER_CODES.has(pairProviderCode(error)))return null;}}return null;})().then(result=>{if(!result&&pairRealRecording?.promise===promise)pairRealRecording=null;return result;});pairRealRecording={id,role,promise};return promise;}
  // Reload recovery first uses the other manager's confirmation as before. If that record is also missing (a
  // foreign missing get is permission-denied under the existing Rules), recover ONLY an absent own record from
  // the durable real-career proof. Failures stay pending, bounded to one attempt per 30 s, with one flight per page.
  let pairPartnerRecoveryTried=false,pairPartnerRecoveryPromise=null,pairPartnerRecoveryRetryAt=0;
  function pairEnsurePartnerRecord(){
    if(pairPartnerRecoveryPromise)return pairPartnerRecoveryPromise;
    if(pairPartnerRecoveryTried||Date.now()<pairPartnerRecoveryRetryAt||state.status!=="paired"||state.connectionState!=="active"||!state.rivalryId||(state.managerRole!=="playerOne"&&state.managerRole!=="playerTwo"))return Promise.resolve(null);
    const rivalryId=state.rivalryId,role=state.managerRole;
    pairPartnerRecoveryRetryAt=Date.now()+PARTNER_RETRY_MS;
    pairPartnerRecoveryPromise=(async()=>{try{
      const context=await pairResolveContext(),partner=await pairReadPartnerRecord({context});
      if(role==="playerOne"){
        if(partner.status!=="none"&&!(partner.status==="ready"&&partner.record.active===false))return null;
        if(!await pairDanielNeedsRealPairing(context))return null;
      }else{
        if(partner.status!=="none")return null;
        const api=await pairLoadCareerStartMarker(),marker=api&&typeof api.readCurrentMarker==="function"?await api.readCurrentMarker():null;
        if(marker?.status!=="ready")return null;
      }
      let result;
      try{result=await pairWritePartnerRecord({context,rivalryId,managerRole:role,requirePartnerRecord:true});}
      catch(error){
        if(partner.status!=="none"||(error?.code!=="PERMANENT_PARTNER_NOT_FOUND"&&pairProviderCode(error)!=="permission-denied"))throw error;
        result=await pairWritePartnerRecord({context,rivalryId,managerRole:role,recoverMissing:true});
      }
      pairPartnerRecoveryTried=true;return result;
    }catch(_error){return null;}})().finally(()=>{pairPartnerRecoveryPromise=null;});
    return pairPartnerRecoveryPromise;
  }
  async function pairLoadCareerStartMarker(){if(root.CareerModeCareerStartMarker)return root.CareerModeCareerStartMarker;if(typeof root.loadRuntimeScript!=="function")return null;try{await root.loadRuntimeScript("career-start-marker","js/careerStartMarker.js",()=>Boolean(root.CareerModeCareerStartMarker));}catch(_error){return null;}return root.CareerModeCareerStartMarker||null;}
  // Daniel's first real pairing: his account is real (careerStart/current exists) and has no active partner record yet.
  // Codex #904 (10-season audit): fails closed. A partner or marker read that cannot answer throws, so a real account never gets a
  // plain test code by accident (that Showdown would count for Daniel and later be hidden for Nik); START shows a retry, writes nothing.
  function pairRealModeUnknown(){return pairErrorWithCode("REAL_MODE_CHECK_UNAVAILABLE","Your account could not be checked just now, so nothing was started. Check your internet, then try again.");}
  async function pairReadOwnMarkerStatus(options={}){const api=await pairLoadCareerStartMarker();if(!api||typeof api.readCurrentMarker!=="function")throw pairRealModeUnknown();let marker;try{if(options.fresh===true)api.clearCache?.();marker=await api.readCurrentMarker();}catch(_error){throw pairRealModeUnknown();}if(marker?.status==="ready"||marker?.status==="none")return marker.status;throw pairRealModeUnknown();}
  async function pairDanielNeedsRealPairing(context,options={}){const partner=await pairReadPartnerRecord({context,fresh:options.fresh===true});if(partner.status==="ready"&&partner.record.active===true)return false;if(partner.status!=="ready"&&partner.status!=="none")throw pairRealModeUnknown();return await pairReadOwnMarkerStatus()==="ready";}
  // Codex #904 (10-season audit) and #909: an active partner record authorises a join (CMS17- or CMS17R-, the R is only text) only
  // in its own seat and only for a code that partner made. Without a partner record, plain codes are retired.
  // First pairing requires the real prefix; it writes Nik's marker before redemption.
  async function pairRequireJoinAllowed(context,parsed,role){const rivalryId=parsed.rivalryId,partner=await pairReadPartnerRecord({context,fresh:true});/* Codex #909: the permanent pair's plain code must come from the recorded partner (the creator never changes; the same two reads the redeem makes) */if(partner.status==="ready"&&partner.record.active===true){if(partner.record.myRole!==role)throw pairErrorWithCode("PARTNER_ROLE_MISMATCH","This Google account is paired in the other manager's seat, so it cannot join here. Choose your own manager on Home, then join again.");const code=await pairCheckJoinableBeforeMarker(context,rivalryId,role);if(code.createdByAccountId!==partner.record.partnerAccountId)throw pairErrorWithCode("PLAIN_CODE_NOT_FROM_PARTNER","This code was not made by the account you are paired with, so it cannot join. Use JOIN on Home, or the code on your partner's phone.");return;}if(partner.status!=="ready"&&partner.status!=="none")throw pairRealModeUnknown();/* a CMS17R- code without an active record is the first real pairing: its own checks follow (joinable first, then the marker) */if(parsed.real)return;throw pairErrorWithCode("REAL_PAIRING_CODE_REQUIRED","Ask Daniel to tap START on Home and send a new pairing code (it starts with CMS17R-).");}
  // Read-only capability check (rivalry + invite, exactly what the redeem transaction reads and Rules allow a code holder to get):
  // pending-pair, invite for private pairing, open, unexpired, for the playerTwo slot, that slot still free, made by another account.
  // Any read failure or failed check throws the redeem's own error, so the normal join error is shown and nothing is written.
  async function pairCheckJoinableBeforeMarker(context,rivalryId,role){const sdk=context.services.firestoreSdk,id=pairNormalizeRivalryId(rivalryId),fail=(code,message)=>{throw pairErrorWithCode(code,message);};/* a read Rules refuse (an expired or used code is not readable by a code holder) rejects as the redeem would: same error */const [rivalry,invite]=await sdk.runTransaction(context.services.firestore,async transaction=>{const r=await transaction.get(pairRivalryReference(context,id)),i=await transaction.get(sdk.doc(context.services.firestore,"rivalries",id,"invites",id));return[r.exists()?r.data():null,i.exists()?i.data():null];});
    if(!pairIsEnvelopeValue(rivalry,"rivalry",id)||!pairIsEnvelopeValue(invite,"invite",id))fail("PAIRING_CAPABILITY_NOT_FOUND","The private pairing code was not found.");
    const d=invite.data||{},r=rivalry.data||{},expires=pairTimestampMillis(d.expiresAt),slots=Array.isArray(r.managerSlots)?r.managerSlots:[],target=slots.find(slot=>slot&&slot.slotId===role);
    if(d.purpose!=="rivalry-pairing")fail("PAIRING_SCOPE_DENIED","This capability is not valid for private rivalry pairing.");
    if(d.createdByAccountId===context.accountId)fail("PAIRING_CREATOR_CANNOT_REDEEM","This Google account made the code, so it cannot join it. Nik must sign in with a different Google account than Daniel, then paste the code again.");
    if(d.state!=="open")fail("PAIRING_CAPABILITY_ALREADY_USED","This private pairing code is no longer open.");
    if(!Number.isFinite(expires)||expires<=Date.now())fail("PAIRING_CAPABILITY_EXPIRED","This private pairing code has expired.");
    if(d.slotId!==role)fail("PAIRING_SLOT_MISMATCH",`This code is for ${d.slotId==="playerOne"?"Daniel":"Nik"}. Choose ${d.slotId==="playerOne"?"Daniel":"Nik"} for this phone on Home, then join again.`);
    if(r.connectionState!=="pending-pair"||slots.length!==2)fail("PAIRING_RIVALRY_NOT_JOINABLE","This private rivalry is not waiting for exactly one manager.");
    if(!target||target.accountId!==null||target.entitlementState!=="open")fail("PAIRING_TWO_MANAGER_LIMIT","The second manager slot is no longer open.");
    return{createdByAccountId:d.createdByAccountId};}
  async function pairEnsureOwnMarkerBeforeRealJoin(){const api=await pairLoadCareerStartMarker();if(!api||typeof api.readCurrentMarker!=="function"||typeof api.startRealCareer!=="function")throw pairErrorWithCode("CAREER_START_UNAVAILABLE","Your real career could not be started right now. Try again.");const marker=await api.readCurrentMarker();if(marker?.status==="ready")return marker;return api.startRealCareer();}
  // Daniel's START for the permanent pair: the note names his own open pending rivalry with the invite's exact expiry. Its own
  // transaction (no reads when createPairing handed the expiry over). Rules refuse a same-rivalry rewrite inside 60 s.
  async function pairWriteJoinNote(options={}){const context=options.context||await pairResolveContext(),sdk=context.services.firestoreSdk,partner=pairPartnerRecordFor(context.accountId);if(!partner||partner.active!==true||partner.myRole!=="playerOne")return{ok:false,status:"not-paired"};const rivalryId=pairNormalizeRivalryId(options.rivalryId),totalSeasons=pairSeasonFromCapability(rivalryId),ref=pairInboxReference(context,partner.partnerAccountId);await sdk.runTransaction(context.services.firestore,async transaction=>{let expiresAt=Number.isFinite(options.expiresAtEpochMs)?sdk.Timestamp.fromMillis(options.expiresAtEpochMs):null;if(!expiresAt){const invite=await transaction.get(sdk.doc(context.services.firestore,"rivalries",rivalryId,"invites",rivalryId)),value=invite.exists()?invite.data():null;if(!pairIsEnvelopeValue(value,"invite",rivalryId)||value.data?.state!=="open"||value.data?.createdByAccountId!==context.accountId)throw pairErrorWithCode("JOIN_NOTE_INVITE_UNAVAILABLE","This connection code is no longer open.");expiresAt=value.data.expiresAt;}if(!(pairTimestampMillis(expiresAt)>Date.now()))throw pairErrorWithCode("JOIN_NOTE_EXPIRED","This connection code has already expired.");transaction.set(ref,{schemaVersion:1,rivalryId,totalSeasons,fromAccountId:context.accountId,createdAt:pairServerTime(sdk),expiresAt});});return{ok:true,status:"written",rivalryId,totalSeasons,partnerAccountId:partner.partnerAccountId};}
  async function pairWriteJoinNoteSafely(options){try{return await pairWriteJoinNote(options);}catch(error){const code=error?.code||"JOIN_NOTE_FAILED";/* Codex #903: diagnosable, no UI (the code still works) */root.console?.warn?.(`[Career Mode Showdown] JOIN note for Nik could not be written (${code}); the code still works.`);return{ok:false,status:"failed",code};}}
  function pairScheduleJoinNoteExpiry(){if(joinNoteExpiryTimer!==null){root.clearTimeout?.(joinNoteExpiryTimer);joinNoteExpiryTimer=null;}const note=joinNoteState.note,wait=note?note.expiresAtEpochMs-Date.now():-1;if(wait>0&&typeof root.setTimeout==="function"){/* re-render only (no read): an expired JOIN offers CHECK STATUS on Home */joinNoteExpiryTimer=root.setTimeout(()=>{joinNoteExpiryTimer=null;pairNotifyPartner();},Math.min(wait+50,2147483000));joinNoteExpiryTimer?.unref?.();}}
  // Nik's note read: only for an active playerTwo partner record, only while visible, at most once per 30 s (a failed read
  // counts too). Never throws; the result is page memory that render and whichShowdownIsLive read without another read.
  async function pairReadJoinNote(options={}){let context;try{context=options.context||await pairResolveContext();}catch(_error){return joinNoteState;}const accountId=context.accountId,partner=pairPartnerRecordFor(accountId);if(!partner||partner.active!==true||partner.myRole!=="playerTwo"){if(joinNoteState.status!=="not-paired"||joinNoteState.accountId!==accountId){joinNoteState=pairFreezeDeep({status:"not-paired",accountId,note:null,code:null,checkedAt:0});pairScheduleJoinNoteExpiry();}return joinNoteState;}if(pairJoinNoteListening(accountId))return joinNoteState;/* the live listener already holds the server's copy */if(options.fresh!==true&&joinNoteState.accountId===accountId&&joinNoteState.checkedAt>0&&Date.now()-joinNoteState.checkedAt<JOIN_NOTE_MEMO_MS)return joinNoteState;/* Codex #903: an explicit tap (fresh) bypasses the memo; still one read in flight */if(joinNotePromise)return joinNotePromise;if(root.document?.visibilityState==="hidden")return joinNoteState;joinNotePromise=(async()=>{const ref=pairInboxReference(context,accountId);noteLastReadAt=Date.now();try{root.CareerModeFirestoreBudget?.wantFresh?.(ref.path);const note=await context.services.firestoreSdk.runTransaction(context.services.firestore,async transaction=>{const snapshot=await transaction.get(ref);return snapshot.exists()?pairParseJoinNote(snapshot.data(),partner.partnerAccountId):null;});joinNoteState=pairFreezeDeep({status:"ready",accountId,note,code:null,checkedAt:Date.now()});}catch(error){joinNoteState=pairFreezeDeep({status:"unavailable",accountId,note:null,code:error?.code||"JOIN_NOTE_UNAVAILABLE",checkedAt:Date.now()});}pairScheduleJoinNoteExpiry();pairNotifyPartner();return joinNoteState;})().finally(()=>{joinNotePromise=null;});return joinNotePromise;}
  // Nik's call (2026-10-18, "check by itself"): while Nik's Home is shown and the tab is visible, ONE onSnapshot listener watches
  // accounts/{nikUid}/partnerInbox/current, so reads happen only on attach and when the note changes. It detaches when JOIN shows,
  // Home is left, the tab is hidden, or 10 minutes after the Home visit began; a new Home visit or the tab becoming visible
  // re-attaches it. Never more than one listener, never from render. A listener that errors falls back to the memoised read
  // (at most once per 30 s) with the same stop rules.
  const JOIN_NOTE_FIRST_DELIVERY_MS=5000;
  let noteWatch={mode:null,unsubscribe:null,timer:null,attachTimer:null,until:0,isHomeShown:null,accountId:null,delivered:false,first:null,seq:0};
  // Codex #904: app switching (tab hidden -> visible) never costs more than one note read per 30 s and never restarts the
  // 10-minute Home visit; a new Home visit (navigation) attaches at once.
  let noteLastReadAt=0,noteVisitUntil=0;
  function pairJoinNoteWatchStop(){const w=noteWatch;/* Codex #903: what the listener delivered is never served as the 30 s memo after it detaches */if(w.mode==="listen"&&joinNoteState.via==="listener")joinNoteState=pairFreezeDeep({...joinNoteState,via:null,checkedAt:0});if(w.timer!==null)root.clearTimeout?.(w.timer);if(w.attachTimer!==null)root.clearTimeout?.(w.attachTimer);if(typeof w.unsubscribe==="function"){try{w.unsubscribe();}catch(_error){}}w.first?.(false);noteWatch={mode:null,unsubscribe:null,timer:null,attachTimer:null,until:0,isHomeShown:null,accountId:null,delivered:false,first:null,seq:w.seq+1};/* Job 12: a bounded wait that stops must redraw Home with its existing CHECK STATUS action. */if(pairJoinNoteView().watchPaused)pairNotifyPartner();return false;}
  function pairJoinNoteWatchWanted(){const shown=noteWatch.isHomeShown;if(typeof shown!=="function"||root.document?.visibilityState==="hidden")return false;try{if(shown()!==true)return false;}catch(_error){return false;}if(state.rivalryId&&(state.connectionState==="active"||state.connectionState==="pending-pair"))return false;if(!pairPartnerActiveFor("playerTwo"))return false;if(root.CareerModeFirestoreBudget?.paused?.()===true)return false;return !pairJoinNoteView().note&&Date.now()<noteWatch.until;}
  function pairJoinNoteWatchTimer(ms,fn){if(noteWatch.timer!==null)root.clearTimeout?.(noteWatch.timer);noteWatch.timer=typeof root.setTimeout==="function"?root.setTimeout(()=>{noteWatch.timer=null;fn();},Math.max(0,ms)):null;noteWatch.timer?.unref?.();}
  // listener mode: the only timer is the end of the 10-minute window
  function pairJoinNoteWindowTimer(){pairJoinNoteWatchTimer(noteWatch.until-Date.now(),()=>{if(!pairJoinNoteWatchWanted())pairJoinNoteWatchStop();else pairJoinNoteWindowTimer();});}
  // fallback mode: the memoised read, at most once per 30 s, same stop rules
  function pairJoinNoteFallbackTick(){if(!pairJoinNoteWatchWanted())return pairJoinNoteWatchStop();const seq=noteWatch.seq;void pairReadJoinNote().finally(()=>{if(noteWatch.seq!==seq)return;if(!pairJoinNoteWatchWanted())return pairJoinNoteWatchStop();pairJoinNoteWatchTimer(Math.min(JOIN_NOTE_MEMO_MS,noteWatch.until-Date.now()),pairJoinNoteFallbackTick);});}
  function pairJoinNoteFallback(){if(typeof noteWatch.unsubscribe==="function"){try{noteWatch.unsubscribe();}catch(_error){}}noteWatch.unsubscribe=null;noteWatch.mode="fallback";noteWatch.delivered=false;noteWatch.first?.(false);noteWatch.first=null;pairJoinNoteWatchTimer(Math.max(0,JOIN_NOTE_MEMO_MS-(Date.now()-(joinNoteState.checkedAt||0))),pairJoinNoteFallbackTick);}
  async function pairJoinNoteSnapshotApi(context){/* r85: deliveries are counted by the budget layer's read meter */const meter=root.CareerModeFirestoreBudget?.meterSdk||(s=>s);const sdk=context.services.firestoreSdk;if(typeof sdk.onSnapshot==="function"&&typeof sdk.doc==="function")return meter(sdk);const url=root.CareerModeProductionFirebaseRuntime?.firebaseFirestoreModule;if(typeof url!=="string"||!url)return null;try{const module=await import(url);return module&&typeof module.onSnapshot==="function"&&typeof module.doc==="function"?meter(module):null;}catch(_error){return null;}}
  function pairJoinNoteDelivery(seq,accountId,partnerAccountId,snapshot){if(noteWatch.seq!==seq||noteWatch.mode!=="listen")return;if(snapshot?.metadata?.fromCache)return;let note=null;try{note=snapshot&&snapshot.exists()?pairParseJoinNote(snapshot.data(),partnerAccountId):null;}catch(_error){note=null;}joinNoteState=pairFreezeDeep({status:"ready",accountId,note,code:null,checkedAt:Date.now(),via:"listener"});noteWatch.delivered=true;noteWatch.first?.(true);noteWatch.first=null;pairScheduleJoinNoteExpiry();pairNotifyPartner();if(!pairJoinNoteWatchWanted())pairJoinNoteWatchStop();}
  async function pairJoinNoteAttach(){const seq=noteWatch.seq;let context;try{context=await pairResolveContext();}catch(_error){if(noteWatch.seq===seq)pairJoinNoteFallback();return;}const partner=pairPartnerRecordFor(context.accountId),api=await pairJoinNoteSnapshotApi(context);if(noteWatch.seq!==seq)return;if(!partner||!pairJoinNoteWatchWanted())return pairJoinNoteWatchStop();if(!api)return pairJoinNoteFallback();try{const ref=api.doc(context.services.firestore,"accounts",context.accountId,"partnerInbox",PARTNER_DOC_ID);noteWatch.accountId=context.accountId;noteLastReadAt=Date.now();/* r79 PR5: a listener re-attached once the cache holds the note gets a first snapshot from the cache (ignored); metadata changes deliver the identical server copy */noteWatch.unsubscribe=api.onSnapshot(ref,{includeMetadataChanges:true},snapshot=>pairJoinNoteDelivery(seq,context.accountId,partner.partnerAccountId,snapshot),()=>{if(noteWatch.seq===seq&&noteWatch.mode==="listen")pairJoinNoteFallback();});}catch(_error){pairJoinNoteFallback();}}
  // Resolves true once the listener has delivered the note from the server (page memory is then current), false otherwise.
  function pairWatchJoinNote(options={}){if(typeof options.isHomeShown!=="function")return Promise.resolve(pairJoinNoteWatchStop());try{if(options.isHomeShown()===true)pairEndClosedOnHome();}catch(_error){}const now=Date.now(),resume=options.resume===true;if(!resume||!(noteVisitUntil>now))noteVisitUntil=now+JOIN_NOTE_WATCH_WINDOW_MS;noteWatch.isHomeShown=options.isHomeShown;noteWatch.until=noteVisitUntil;if(!pairJoinNoteWatchWanted())return Promise.resolve(pairJoinNoteWatchStop());
    if(noteWatch.mode==="listen"){pairJoinNoteWindowTimer();if(noteWatch.delivered)return Promise.resolve(true);if(noteWatch.attachTimer!==null){if(resume)return Promise.resolve("deferred");/* a tap or a new Home visit never waits for the deferred attach (Codex #907) */root.clearTimeout?.(noteWatch.attachTimer);noteWatch.attachTimer=null;void pairJoinNoteAttach();}}
    else if(noteWatch.mode==="fallback"){if(noteWatch.timer===null)pairJoinNoteFallbackTick();return Promise.resolve(false);}
    else{noteWatch.mode="listen";pairJoinNoteWindowTimer();const wait=resume?noteLastReadAt+JOIN_NOTE_MEMO_MS-now:0;
      // a tab return within 30 s of the last note read keeps page memory and attaches at the 30 s mark (if still wanted)
      if(wait>0&&typeof root.setTimeout==="function"){const seq=noteWatch.seq;noteWatch.attachTimer=root.setTimeout(()=>{if(noteWatch.seq!==seq)return;noteWatch.attachTimer=null;if(pairJoinNoteWatchWanted())void pairJoinNoteAttach();else pairJoinNoteWatchStop();},wait);noteWatch.attachTimer?.unref?.();return Promise.resolve("deferred");}
      void pairJoinNoteAttach();}
    if(!noteWatch.firstPromise||noteWatch.firstSeq!==noteWatch.seq){noteWatch.firstSeq=noteWatch.seq;noteWatch.firstPromise=new Promise(resolve=>{let done=false;const finish=value=>{if(done)return;done=true;resolve(value);};noteWatch.first=finish;if(typeof root.setTimeout==="function")root.setTimeout(()=>finish(false),JOIN_NOTE_FIRST_DELIVERY_MS);});}
    return noteWatch.firstPromise;}
  function pairJoinNoteListening(accountId){return noteWatch.mode==="listen"&&noteWatch.delivered===true&&noteWatch.accountId===accountId&&joinNoteState.accountId===accountId;}
  if(root.document?.addEventListener)root.document.addEventListener("visibilitychange",()=>{if(root.document.visibilityState==="hidden")pairJoinNoteWatchStop();});
  // Pure view of the memo: the note only while unexpired and not the Showdown this account already joined or closed.
  function pairJoinNoteView(nowEpochMs=Date.now()){const note=joinNoteState.status==="ready"&&joinNoteState.accountId===state.accountId?joinNoteState.note:null,valid=Boolean(note&&note.expiresAtEpochMs>nowEpochMs&&note.rivalryId!==state.rivalryId&&note.rivalryId!==state.closedRivalryId);return pairFreezeDeep({status:joinNoteState.status,checked:joinNoteState.status==="ready"&&joinNoteState.accountId===state.accountId,partnerActive:pairPartnerActiveFor("playerTwo"),watchPaused:!valid&&!noteWatch.mode&&Boolean(note&&note.expiresAtEpochMs<=nowEpochMs||noteVisitUntil>0&&nowEpochMs>=noteVisitUntil),note:valid?note:null});}
  // r79 PR4 one-sided UNPAIR: the partner's OWN record, read once per page load and only while this account's record is
  // active (the Rules let a partner get it only while it names this account). It answers "does the other manager still
  // name me?": active and naming me -> mutual; active:false, or not readable because it names someone else or was never
  // written -> unpaired (Home and Settings say so and offer PAIR AGAIN). A transient failure claims nothing and is not
  // retried on this page. A pairing or unpair made on this page updates the memo without a read. Daniel's START tap reads it
  // again (options.fresh, Codex #904), so an UNPAIR Nik made after this page loaded is seen before a code is made.
  let partnerSideState=pairFreezeDeep({status:"unknown",accountId:null,partnerAccountId:null,code:null}),partnerSidePromise=null;
  function pairSetPartnerSide(status,accountId,partnerAccountId,code=null){partnerSideState=pairFreezeDeep({status,accountId,partnerAccountId,code});return partnerSideState;}
  async function pairReadPartnerSide(options={}){let context;try{context=options.context||await pairResolveContext();}catch(_error){return partnerSideState;}const accountId=context.accountId,mine=pairPartnerRecordFor(accountId);if(!mine||mine.active!==true){if(partnerSideState.accountId!==accountId||partnerSideState.status!=="not-paired")pairSetPartnerSide("not-paired",accountId,null);return partnerSideState;}if(options.fresh!==true&&partnerSideState.accountId===accountId&&partnerSideState.partnerAccountId===mine.partnerAccountId&&partnerSideState.status!=="unknown")return partnerSideState;if(options.fresh!==true&&partnerSidePromise&&partnerSidePromise.accountId===accountId)return partnerSidePromise.promise;const promise=(async()=>{try{const ref=pairPartnerReference(context,mine.partnerAccountId);/* Codex #915/#918: a fresh read reaches the server itself (no shared snapshot, no read already in flight) */if(options.fresh===true)root.CareerModeFirestoreBudget?.readServerNext?.(ref.path);const value=await context.services.firestoreSdk.runTransaction(context.services.firestore,async transaction=>{const snapshot=await transaction.get(ref);return snapshot.exists()?snapshot.data():null;});let theirs=null;try{theirs=value?pairParsePartnerRecord(value,mine.partnerAccountId):null;}catch(_error){theirs=null;}pairSetPartnerSide(theirs&&theirs.active===true&&theirs.partnerAccountId===accountId&&theirs.myRole!==mine.myRole?"mutual":"unpaired",accountId,mine.partnerAccountId);}catch(error){pairSetPartnerSide(pairProviderCode(error)==="permission-denied"?"unpaired":"unavailable",accountId,mine.partnerAccountId,error?.code||"PARTNER_SIDE_UNAVAILABLE");}pairNotifyPartner();return partnerSideState;})().finally(()=>{if(partnerSidePromise&&partnerSidePromise.promise===promise)partnerSidePromise=null;});partnerSidePromise={accountId,promise};return promise;}
  // UNPAIR (Settings, r79 PR4: UNPAIR and PAIR AGAIN): active:false and updatedAt only. Blocked while a Showdown is in progress (Q2): an ACTIVE
  // rivalry, or a pending one whose code is still open, must be finished or deleted first.
  async function pairUnpair(){if(state.busy)throw pairErrorWithCode("PERSISTENT_PAIR_BUSY","The current Showdown connection is busy. Try again when the current action finishes.");const context=await pairResolveContext(),sdk=context.services.firestoreSdk;const result=await sdk.runTransaction(context.services.firestore,async transaction=>{
    const link=await transaction.get(pairLinkReference(context)),linked=link.exists()?link.data()?.data?.rivalryId:null;
    if(typeof linked==="string"&&/^pair_[0-9a-f]{64}$/.test(linked)){let connection=null,open=false;/* Codex #903: fail closed. If the linked Showdown cannot be read, nothing is unpaired. */try{const rivalry=await transaction.get(pairRivalryReference(context,linked));connection=rivalry.exists()?rivalry.data()?.data?.connectionState??null:null;if(connection==="pending-pair"){const invite=await transaction.get(sdk.doc(context.services.firestore,"rivalries",linked,"invites",linked)),value=invite.exists()?invite.data():null,expires=pairTimestampMillis(value?.data?.expiresAt);/* Codex #908: this clock may be ahead of the server */open=value?.data?.state==="open"&&Number.isFinite(expires)&&expires>Date.now()-PAIR_CLOCK_MARGIN_MS;}}catch(_error){throw pairErrorWithCode("PERMANENT_PARTNER_UNPAIR_UNVERIFIED","The current Showdown could not be checked, so nothing was unpaired. Try again when you are online.");}
      if(connection==="active"||(connection==="pending-pair"&&open))throw pairErrorWithCode("PERMANENT_PARTNER_UNPAIR_BLOCKED","Finish or end the current Showdown before you unpair.");}
    const ref=pairPartnerReference(context),snapshot=await transaction.get(ref);
    if(!snapshot.exists())return{ok:true,status:"not-paired",record:null};
    const raw=snapshot.data(),record=pairParsePartnerRecord(raw,context.accountId);
    if(record.active!==true)return{ok:true,status:"already-unpaired",record};
    /* Codex #904 pairing audit: Nik's own link still names the last Showdown while Daniel's next code waits in his mailbox, and a
       second Nik browser could redeem it meanwhile. UNPAIR waits for that code too (only here: up to three reads, only on UNPAIR). */
    if(record.myRole==="playerTwo"){let waiting=false;try{const inbox=await transaction.get(pairInboxReference(context,context.accountId)),note=inbox.exists()?pairParseJoinNote(inbox.data(),record.partnerAccountId):null;
      if(note&&note.rivalryId!==linked&&note.expiresAtEpochMs>Date.now()-PAIR_CLOCK_MARGIN_MS){const rivalry=await transaction.get(pairRivalryReference(context,note.rivalryId));if(rivalry.exists()&&rivalry.data()?.data?.connectionState==="pending-pair"){const invite=await transaction.get(sdk.doc(context.services.firestore,"rivalries",note.rivalryId,"invites",note.rivalryId)),value=invite.exists()?invite.data():null,expires=pairTimestampMillis(value?.data?.expiresAt);waiting=value?.data?.state==="open"&&Number.isFinite(expires)&&expires>Date.now()-PAIR_CLOCK_MARGIN_MS;}}}
      catch(_error){throw pairErrorWithCode("PERMANENT_PARTNER_UNPAIR_UNVERIFIED","The current Showdown could not be checked, so nothing was unpaired. Try again when you are online.");}
      if(waiting)throw pairErrorWithCode("PERMANENT_PARTNER_UNPAIR_BLOCKED","Daniel's next Showdown is waiting for you. Join it, or wait until its code expires, before you unpair.");}
    transaction.set(ref,{...raw,active:false,updatedAt:pairServerTime(sdk)});
    return{ok:true,status:"unpaired",record:pairFreezeDeep({...record,active:false})};});
    partnerState=pairFreezeDeep({status:result.record?"ready":"none",accountId:context.accountId,record:result.record,code:null,checkedAt:Date.now()});joinNoteState=pairFreezeDeep({status:"not-paired",accountId:context.accountId,note:null,code:null,checkedAt:0});pairSetPartnerSide("not-paired",context.accountId,null);pairRealRivalryId=null;pairScheduleJoinNoteExpiry();pairNotifyPartner();return{ok:true,status:result.status};}

async function pairOpenRecoverySurface(){try{
  root.careerModeLegacyDataTools=true;
  if(typeof root.openOptionalModule!=="function"||await root.openOptionalModule("legacy")!==true){root.careerModeLegacyDataTools=false;throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_UI_UNAVAILABLE","Verified backup restore is unavailable on this screen.");}
  root.mountCareerModeRestorePanel?.();
  const panel=root.document?.getElementById("careerModeRestorePanel");
  if(!panel)throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_UI_UNAVAILABLE","No backup restore panel is available. Return Home and choose Start a Showdown to begin fresh.");
  const input=panel.querySelector('input[type="file"]');
  panel.scrollIntoView?.({block:"start",behavior:"auto"});
  if(input){
    input.focus();
    panel.scrollIntoView?.({block:"start",behavior:"auto"});
  }
  return true;
}catch(error){
  if(typeof root.showScreen==="function")root.showScreen("mainMenu",false);
  pairSetState({status:"recovery-required",busy:false,message:error?.message||"Verified backup restore could not be opened. Choose START OVER to begin a new Showdown."});
  return false;
}}
async function pairDiscardStalePendingConnection(){
  if(state.busy)return false;
  let remoteClosed=false;
  try{
    const refreshed=await pairInitialize({force:true});
    if(refreshed?.status==="unpaired"||refreshed?.connectionState==="closed")return true;
    const identityRole=pairCurrentIdentityRole();
    if(!refreshed||refreshed.connectionState!=="pending-pair"||refreshed.managerRole!=="playerTwo"||identityRole!=="playerTwo"||!refreshed.rivalryId){
      throw pairErrorWithCode("PERSISTENT_PAIR_STALE_PENDING_STATE_CHANGED","This old connection changed. Nothing was deleted. Review the current screen and try again.");
    }
    const rivalryId=refreshed.rivalryId,providerSaveId=refreshed.providerSaveId,providerProfileId=refreshed.providerProfileId;
    const confirmed=await pairAskConfirm("Delete this old connection and start fresh? This closes the stale online connection and clears only its unfinished Showdown so Nik can join the new code Daniel creates.","danger");
    // BH-11 (#2): only an explicit yes deletes; a missing or blocked confirm box never counts as consent.
    if(confirmed!==true)return false;
    const rechecked=await pairInitialize({force:true});
    if(!rechecked||rechecked.connectionState!=="pending-pair"||rechecked.managerRole!=="playerTwo"||pairCurrentIdentityRole()!=="playerTwo"||rechecked.rivalryId!==rivalryId||rechecked.providerSaveId!==providerSaveId||rechecked.providerProfileId!==providerProfileId){
      throw pairErrorWithCode("PERSISTENT_PAIR_STALE_PENDING_STATE_CHANGED","This old connection changed after confirmation. Nothing was deleted. Review the current screen and try again.");
    }
    const context=await pairResolveContext();
    const closed=await pairAbandonCurrentShowdown({expectedRivalryId:rivalryId,expectedSaveId:providerSaveId});
    if(!closed||closed.ok!==true)throw pairErrorWithCode("PERSISTENT_PAIR_ABANDON_FAILED","The old connection could not be closed safely.");
    remoteClosed=true;
    await pairDeleteExactPreparedShell(context,"playerTwo",providerSaveId,providerProfileId);
    return pairSetState({...state,status:"unpaired",busy:false,managerRole:null,managerId:null,rivalryId:null,connectionState:null,providerSaveId:null,providerProfileId:null,capability:null,message:"Old connection and unfinished test Showdown deleted. Paste the new code Daniel sends."});
  }catch(error){
    const prefix=remoteClosed?"The old online connection was closed, but its unfinished Showdown was not cleared yet. ":"Old connection cleanup could not finish. ";
    return pairSetState({...state,status:remoteClosed?"save-required":state.status,busy:false,message:prefix+(error?.message||"Nothing else was changed.")});
  }
}

// r79: START OVER goes through the same canonical START as Home (Daniel: seasons; Nik: JOIN, never the seasons screen).
async function pairOpenCanonicalStart(){
  const identity=root.CareerModeOnlinePlayerIdentity;
  if(identity&&typeof identity.openStart==="function"){const decision=await identity.openStart();return decision!==null&&decision!==false;}
  return typeof root.navigateTo==="function"
    ? await root.navigateTo("createShowdown",{addToHistory:false,allowCanonicalFallback:true})
    : (typeof root.showScreen==="function"?root.showScreen("createShowdown",false):false);
}
async function pairStartOverFromRecovery(){
  if(state.busy)return false;
  try{
    const refreshed=await pairInitialize({force:true});
    if(refreshed?.connectionState==="active"&&refreshed.status==="paired"){
      pairSetState({status:"paired",busy:false,message:"Your restored career is ready. Continue Career instead of deleting it."});
      return false;
    }
    if(refreshed?.status==="unpaired"||refreshed?.connectionState==="closed"){
      const opened=await pairOpenCanonicalStart();
      return opened!==false;
    }
    if(!refreshed||refreshed.status!=="recovery-required"||refreshed.connectionState!=="active"||!refreshed.rivalryId){
      throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_STATE_CHANGED","The old Showdown state changed. Nothing was deleted. Review the current screen and try again.");
    }
    const rivalryId=refreshed.rivalryId;
    const confirmed=await pairAskConfirm("Delete the old Showdown and start over? This closes the old online Showdown for both players. Your player identity, registered device, Legacy history and app settings are kept.","danger");
    // BH-11 (#2): only an explicit yes deletes; a missing or blocked confirm box never counts as consent.
    if(confirmed!==true)return false;
    const rechecked=await pairInitialize({force:true});
    if(rechecked?.connectionState==="active"&&rechecked.status==="paired"){
      pairSetState({status:"paired",busy:false,message:"Your restored career is ready. Continue Career instead of deleting it."});
      return false;
    }
    if(!rechecked||rechecked.status!=="recovery-required"||rechecked.connectionState!=="active"||rechecked.rivalryId!==rivalryId){
      throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_STATE_CHANGED","The old Showdown changed after confirmation. Nothing was deleted. Review the current screen and try again.");
    }
    const closed=await pairAbandonCurrentShowdown({expectedRivalryId:rivalryId});
    if(!closed||closed.ok!==true)throw pairErrorWithCode("PERSISTENT_PAIR_ABANDON_FAILED","The old Showdown could not be closed safely.");
    const opened=await pairOpenCanonicalStart();
    if(opened===false)throw pairErrorWithCode("PERSISTENT_PAIR_START_OVER_ROUTE_FAILED","The new Showdown screen could not be opened.");
    return true;
  }catch(error){
    pairSetState({status:state.status==="paired"?"paired":"recovery-required",busy:false,message:`Start over could not finish. ${error?.message||"The old Showdown was not changed."}`});
    return false;
  }
}

  function pairCreateElement(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined&&text!==null)element.textContent=String(text);return element;}
  function pairCopyText(value){if(root.navigator?.clipboard?.writeText)return root.navigator.clipboard.writeText(value).then(()=>true).catch(()=>false);return Promise.resolve(false);}
  function pairRoleLabel(role){if(!role)return root.CareerModeOnlinePlayerIdentity?.getState?.().managerLabel||"PLAYER";return pairManagerForRole(role).label;}
  function pairRender(){if(!root.document)return null;const shell=root.document.querySelector("#connectPlayersScreen #connectPlayersPairSlot");if(!shell)return null;let panel=root.document.getElementById(PANEL_ID);if(!panel){panel=pairCreateElement("section","stateNote");panel.id=PANEL_ID;Object.assign(panel.style,{margin:"0 0 14px",padding:"14px 16px",border:"1px solid rgba(255,255,255,.16)",background:"rgba(5,10,17,.7)"});shell.append(panel);}if(panel.parentNode!==shell)shell.append(panel);const typed=root.document.getElementById(CODE_INPUT_ID),typedFocus=Boolean(typed&&root.document.activeElement===typed),typedStart=typed?.selectionStart,typedEnd=typed?.selectionEnd;if(typed)pairDraftCode=typed.value;if(!state.accountId||state.connectionState)pairDraftCode="";panel.replaceChildren();const staleNikPending=state.connectionState==="pending-pair"&&state.managerRole==="playerTwo"&&pairCurrentIdentityRole()==="playerTwo",titleText=state.status==="pair-link-retry"?"FINISH CONNECTION":state.connectionState==="active"?(state.status==="recovery-required"?"OLD SHOWDOWN FOUND":"CAREER READY"):state.connectionState==="pending-pair"?(staleNikPending?"OLD CONNECTION FOUND":"WAITING FOR THE OTHER PLAYER"):"CONNECT PLAYERS",messageText=staleNikPending?"This old test connection cannot be used in the current Daniel-hosted flow. Delete it, then wait for Daniel's new code.":state.message,title=pairCreateElement("strong","",titleText),message=pairCreateElement("p","",messageText);message.style.margin="6px 0 10px";panel.append(title,message);if(!state.accountId){if(state.status==="unavailable"){/* BH-11 (#6): a transient startup error keeps a retry on the panel. */const retryRow=pairCreateElement("div",""),retry=pairCreateElement("button","menuButton","CHECK STATUS");retry.type="button";retry.disabled=state.busy;retry.addEventListener("click",()=>{if(state.busy)return;pairSetState({busy:true,message:"Checking your Showdown connection…"});void pairInitialize({force:true});});retryRow.append(retry);panel.append(retryRow);}return panel;}const actions=pairCreateElement("div","");Object.assign(actions.style,{display:"flex",flexWrap:"wrap",gap:"8px",alignItems:"center"});if(state.status==="pair-link-retry"){const retry=pairCreateElement("button","menuButton","RETRY CONNECTION");retry.type="button";retry.disabled=state.busy;retry.addEventListener("click",()=>void pairRetryPairLink());actions.append(retry,pairCreateElement("span","",state.connectionState==="active"?"DO NOT REFRESH UNTIL THE CONNECTION IS SAVED":"SAVE THE CONNECTION BEFORE SHARING THE CODE"));}else if(state.connectionState==="active"&&state.status==="recovery-required"){const startOver=pairCreateElement("button","menuButton dangerButton pairRecoverySecondary","DELETE OLD SHOWDOWN & START OVER"),recover=pairCreateElement("button","menuButton","RESTORE BACKUP");startOver.type=recover.type="button";startOver.disabled=recover.disabled=state.busy;startOver.addEventListener("click",()=>void pairStartOverFromRecovery());recover.addEventListener("click",()=>void pairOpenRecoverySurface());/* QoL 1 (BH-12): the safe RESTORE BACKUP leads in layout and focus order; the delete keeps its own confirm and stays on the screen. */actions.append(recover,startOver,pairCreateElement("span","","THIS SHOWDOWN COULD NOT BE LOADED HERE"));}else if(state.connectionState==="active"){const open=pairCreateElement("button","menuButton",state.status==="error"?"TRY CONTINUE AGAIN":"START CAREER");open.type="button";open.disabled=state.busy;open.addEventListener("click",()=>void pairContinueOnlineShowdown());actions.append(open,pairCreateElement("span","",pairRoleLabel(state.managerRole)));}else if(state.status==="unpaired"||state.status==="save-required"||state.status==="error"){const role=pairSelectedRole();if(role==="playerOne"&&partnerSideState.status==="unpaired"&&pairPartnerRecordFor(partnerSideState.accountId)?.active===true){/* Codex #915: Nik unpaired while Daniel chose seasons. CREATE CODE would only repeat the error, so the one way forward is START's PAIR AGAIN (his stale record goes inactive, then the first-pairing code). */const again=pairCreateElement("button","menuButton","PAIR AGAIN");again.type="button";again.disabled=state.busy;again.addEventListener("click",()=>void root.CareerModeOnlinePlayerIdentity?.openStart?.());actions.append(again,pairCreateElement("span","","NIK UNPAIRED, SO A NEW PAIRING CODE IS MADE FOR HIM"));}else if(role==="playerOne"&&pairPreparedTotalRounds()===null){/* r79: no seasons chosen yet, so the code cannot be made; the one way forward is the seasons screen (no bounce). */const seasons=pairCreateElement("button","menuButton","CHOOSE SEASONS");seasons.type="button";seasons.disabled=state.busy;seasons.addEventListener("click",()=>{root.CareerModeConnectPlayersScreenV10?.close?.({restoreFocus:false});if(typeof root.navigateTo==="function")void root.navigateTo("createShowdown");else root.showScreen?.("createShowdown");});actions.append(seasons,pairCreateElement("span","","DANIEL CHOOSES THE SEASONS, THEN THE CODE FOR NIK IS MADE"));}else if(role==="playerOne"){const start=pairCreateElement("button","menuButton","CREATE CODE FOR NIK");start.type="button";start.disabled=state.busy;start.addEventListener("click",()=>void pairStartPairing({managerRole:"playerOne"}));actions.append(start,pairCreateElement("span","","DANIEL STARTS THE SHOWDOWN AND SENDS THIS CODE TO NIK"));}else if(role==="playerTwo"){const input=pairCreateElement("input","settingsConnectedAccountInput");input.id=CODE_INPUT_ID;input.type="text";input.placeholder="Paste Daniel's code";input.autocomplete="off";input.spellcheck=false;input.style.minWidth="min(330px,100%)";input.value=pairDraftCode;const join=pairCreateElement("button","menuButton","JOIN DANIEL'S SHOWDOWN");join.type="button";join.disabled=state.busy;join.addEventListener("click",()=>{if(!input.value.trim()){pairSetState({message:"Paste Daniel's code first, then press Join."});return;}void pairJoinAndContinue(input.value,{managerRole:"playerTwo"});});actions.append(input,join,pairCreateElement("span","","NIK ENTERS THE CODE DANIEL SENDS"));}else{actions.append(pairCreateElement("span","","CHOOSE DANIEL OR NIK FOR THIS DEVICE FIRST"));}}else if(staleNikPending){const discard=pairCreateElement("button","menuButton dangerButton","DELETE OLD CONNECTION & START FRESH"),refresh=pairCreateElement("button","menuButton","CHECK STATUS");discard.type=refresh.type="button";discard.disabled=refresh.disabled=state.busy;discard.addEventListener("click",()=>void pairDiscardStalePendingConnection());refresh.addEventListener("click",()=>void pairInitialize({force:true}));actions.append(discard,refresh,pairCreateElement("span","","NIK WAITS FOR THE NEW CODE DANIEL CREATES"));}else if(state.status==="starting"&&state.busy){/* r80: while a code is being made only "Preparing your Showdown…" shows, as for a first START; an older open code (the one being replaced) is never shown meanwhile */}else if(state.connectionState==="pending-pair"&&state.capability){const code=pairCreateElement("code","",state.capability),copy=pairCreateElement("button","menuButton","COPY CODE"),refresh=pairCreateElement("button","menuButton","CHECK STATUS"),replace=pairCreateElement("button","menuButton","NEW CODE");code.style.wordBreak="break-all";copy.type=refresh.type=replace.type="button";copy.addEventListener("click",async()=>{const ok=await pairCopyText(state.capability);pairSetState({message:ok?"Code copied. Send it to the other player.":"Select the full code shown here and copy it manually."});});refresh.addEventListener("click",()=>void pairInitialize({force:true}));replace.addEventListener("click",()=>void pairStartPairing({managerRole:state.managerRole}));actions.append(code,copy,refresh,replace);}else if(state.connectionState==="pending-pair"){const refresh=pairCreateElement("button","menuButton","CHECK STATUS");refresh.type="button";refresh.addEventListener("click",()=>void pairInitialize({force:true}));actions.append(refresh,pairCreateElement("span","","If the original code expired, create a new one."));}panel.append(actions);const restored=typedFocus&&root.document.getElementById(CODE_INPUT_ID);if(restored){restored.focus();try{restored.setSelectionRange(typedStart,typedEnd);}catch(_error){}}return panel;}
  function pairSubscribe(listener){if(typeof listener!=="function")return()=>{};pairListeners.add(listener);return()=>pairListeners.delete(listener);}

  if(root.addEventListener){root.addEventListener("career-mode-online-identity-change",()=>pairRender());root.addEventListener("online",()=>{if(state.initialized)void pairInitialize({force:true});});}
  // r79: DELETE CURRENT SHOWDOWN on the other phone closes this pair's rivalry without a terminal witness. This page's own
  // Terminal Close read (the one it already makes) reports it as DELETED; the pair then holds exactly what its next pair-link
  // read would return (unpaired, that closed rivalry and its save), with no read of its own, so Home's JOIN note watch and the
  // next JOIN treat it as closed instead of as a live Showdown. Codex #910: it is held at every later publication (after a busy
  // action settles, or when an in-flight or overlapping pair read answers with the old live rivalry), never lost.
  // r79 PR5 (two-player journey): a normal finish (CLOSED, with its witness) is let go the same way, but only once Home is
  // shown again, because the Final Winner screen, Final Reconciliation and Apply still run on it.
  function pairHeldIfEnded(next){if(next.busy||!next.rivalryId||!endedRivalryIds.has(next.rivalryId)||!["active","pending-pair"].includes(next.connectionState))return next;endedHeldNow=true;return {...next,status:"unpaired",initialized:true,busy:false,managerRole:null,managerId:null,rivalryId:null,connectionState:null,providerSaveId:null,providerProfileId:null,capability:null,closedRivalryId:next.rivalryId,closedProviderSaveId:pairValidSaveId(next.providerSaveId)?next.providerSaveId:null,message:"Daniel and Nik need to connect before the first Showdown."};}
  // Codex #910: Home may already be showing (its JOIN note watch stopped while the Showdown was live), so the page is told once
  // the ended Showdown is let go; Nik's Home then redraws and watches Daniel's next JOIN note without a tap.
  function pairAnnounceEnded(){endedHeldNow=false;const closedRivalryId=state.closedRivalryId;/* after this state change has finished, never inside it */void Promise.resolve().then(()=>{try{if(typeof root.dispatchEvent==="function"&&typeof root.CustomEvent==="function")root.dispatchEvent(new root.CustomEvent("career-mode-permanent-pair-ended",{detail:{closedRivalryId}}));}catch(_error){}});}
  function pairEndRivalry(rivalryId){endedRivalryIds.add(rivalryId);if(!state.busy&&state.rivalryId===rivalryId)pairSetState({});}
  function pairEndClosedOnHome(){const rivalryId=closedOnHomeRivalryId;if(!rivalryId)return;closedOnHomeRivalryId=null;pairEndRivalry(rivalryId);}
  function pairOnShowdownDeleted(event){const detail=event?.detail;if(!detail||!/^pair_[0-9a-f]{64}$/.test(String(detail.rivalryId||"")))return;if(detail.phase==="DELETED")pairEndRivalry(detail.rivalryId);else if(detail.phase==="CLOSED"&&!endedRivalryIds.has(detail.rivalryId))closedOnHomeRivalryId=detail.rivalryId;}
  if(root.addEventListener)root.addEventListener("career-mode-shared-terminal-close-state-change",pairOnShowdownDeleted);
  return pairFreezeDeep({contractVersion:5,feature:"persistent-nik-daniel-pair",permanentPartner:true,joinNoteMemoMs:JOIN_NOTE_MEMO_MS,realCodePrefix:REAL_CODE_PREFIX,partnerChangeEvent:PARTNER_EVENT,pairDocumentId:PAIR_DOC_ID,publicDiscovery:false,billingRequired:false,persistentAcrossRegisteredBrowsers:true,pairLinkPersistentAcrossRegisteredBrowsers:true,gameplayCacheHydrationAcrossFreshBrowsers:true,freshBrowserGameplayRequiresVerifiedLocalRecovery:false,legacyPairMigration:false,managerByRole:MANAGER_BY_ROLE,roleByManager:ROLE_BY_MANAGER,normalizeRivalryId:pairNormalizeRivalryId,parsePairLink:pairParsePairLink,readPairLink:pairReadPairLink,persistPairLink:pairPersistPairLink,initialize:pairInitialize,waitingPoll:Object.freeze({fastMs:PAIR_WAIT_FAST_MS,slowMs:PAIR_WAIT_SLOW_MS,windowMs:PAIR_WAIT_WINDOW_MS}),isWaitingForRival:()=>Boolean(pairWaitingKey()),startPairing:pairStartPairing,joinPairing:pairJoinAndContinue,autoContinueAfterConnect:pairAutoContinueAfterConnect,retryPairLink:pairRetryPairLink,careerIndexPageCapacity:CAREER_INDEX_PAGE_CAPACITY,readCareerIndex:pairReadCareerIndex,getCareerIndexState:()=>careerIndexState,planCareerIndexAppend:pairPlanCareerIndexAppend,createDurableCreationWitness:pairCreateDurableCreationWitness,createDurableRedemptionWitness:pairCreateDurableRedemptionWitness,abandonCurrentShowdown:pairAbandonCurrentShowdown,closeUnjoinedCode:options=>options&&options.expectedRivalryId?pairAbandonCurrentShowdown({expectedRivalryId:options.expectedRivalryId,unjoinedOnly:true}):Promise.reject(pairErrorWithCode("PERSISTENT_PAIR_LINK_REQUIRED","The earlier code could not be verified. Nothing was changed.")),discardStalePendingConnection:pairDiscardStalePendingConnection,continuePair:pairContinueOnlineShowdown,settleOnHome:pairEndClosedOnHome,openRecovery:pairOpenRecoverySurface,startOver:pairStartOverFromRecovery,buildPlayerJoinCode:pairBuildPlayerJoinCode,parsePlayerJoinCode:pairParsePlayerJoinCode,readPartnerRecord:pairReadPartnerRecord,writePartnerRecord:pairWritePartnerRecord,ensurePartnerRecord:pairEnsurePartnerRecord,writeJoinNote:pairWriteJoinNote,readJoinNote:pairReadJoinNote,watchJoinNote:pairWatchJoinNote,stopJoinNoteWatch:pairJoinNoteWatchStop,getJoinNoteWatch:()=>pairFreezeDeep({mode:noteWatch.mode,listening:typeof noteWatch.unsubscribe==="function",delivered:noteWatch.delivered,until:noteWatch.until}),joinNoteWatchWindowMs:JOIN_NOTE_WATCH_WINDOW_MS,getJoinNoteState:pairJoinNoteView,getPartnerState:()=>partnerState,readPartnerSide:pairReadPartnerSide,getPartnerSideState:()=>partnerSideState,unpair:pairUnpair,render:pairRender,subscribe:pairSubscribe,getState:()=>state});
});
```

## FILE: js/productionSharedJourneyReconnect.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedJourneyReconnect=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  const STATUS_ID="sharedJourneyReconnectStatus";
  const ACTION_ID="sharedJourneyReconnectAction";
  const NEW_CODE_ACTION_ID="sharedJourneyReconnectNewCode";
  const DEPENDENCIES=Object.freeze([
    ["ssjr-multi-season-protocol","js/sharedMultiSeasonProgression.js",()=>root.CareerModeSharedMultiSeasonProgression],
    ["ssjr-journey-reconnect-protocol","js/sharedJourneyReconnect.js",()=>root.CareerModeSharedJourneyReconnect],
    ["ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup],
    ["ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js",()=>root.CareerModeProductionSharedMultiSeasonProgression],
    ["rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining],
    ["spark-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount],
    ["pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing],
    ["rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry]
  ]);
  let installed=false,busy=false,state=null,protocol=null,setupApi=null,multiApi=null,remoteApi=null,accountApi=null,pairingApi=null,rivalryApi=null,unsubscribeRemote=null,refreshPromise=null,contextKey="";
  let lastReportedCode="";
  // A progression read can be denied for one poll right after a fresh session or a close while the
  // rivalry catches up; that check retries itself, so it is reported only if the same failure repeats.
  let heldTransientCode="";
  // Hunt 1018 (H1018-4): going offline bumps the generation, so a refresh still awaiting its reads cannot publish over OFFLINE_HOLD.
  let pjrGeneration=0,wakePending=false;

  function pjrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pjrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pjrSharedMarker(){const showdown=pjrShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pjrMarkerRivalry(){return String(pjrShowdown()?.sharedJourney?.rivalryId||"").trim();}
  function pjrSetupPending(){const journey=pjrShowdown()?.sharedJourney;return Boolean(journey&&journey.mode==="shared"&&journey.setupPending===true);}
  function pjrPrePairShell(){return Boolean(pjrSetupPending()&&!pjrMarkerRivalry());}
  function pjrSetupPresentationActive(){const presentation=root.CareerModeProductionSharedShowdownPresentation;return Boolean(presentation&&typeof presentation.isPresentationActive==="function"&&presentation.isPresentationActive());}
  function pjrReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pjrLoad(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(Object.assign(new Error("Release-owned runtime loader is unavailable."),{code:"JOURNEY_RECONNECT_DEPENDENCY_UNAVAILABLE"}));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)pjrFail("JOURNEY_RECONNECT_DEPENDENCY_UNAVAILABLE",`${path} loaded without its expected API.`);return api;});}
  async function pjrEnsureDependencies(){
    const resolved={};for(const [key,path,ready] of DEPENDENCIES)resolved[key]=await pjrLoad(key,path,ready);
    const factory=resolved["ssjr-journey-reconnect-protocol"];
    if(!factory||typeof factory.createProtocol!=="function")pjrFail("JOURNEY_RECONNECT_PROTOCOL_UNAVAILABLE");
    protocol=protocol||factory.createProtocol({multiSeasonModule:resolved["ssjr-multi-season-protocol"]});
    setupApi=resolved["ssjr-production-setup"];multiApi=resolved["ssjr-production-multi-season"];remoteApi=resolved.rj;accountApi=resolved["spark-account"];pairingApi=resolved.pairing;rivalryApi=resolved.rivalry;
    if(typeof setupApi?.refresh!=="function"||typeof setupApi?.getState!=="function")pjrFail("JOURNEY_RECONNECT_SETUP_UNAVAILABLE");
    if(typeof multiApi?.refresh!=="function"||typeof multiApi?.getState!=="function")pjrFail("JOURNEY_RECONNECT_PROGRESSION_UNAVAILABLE");
    if(typeof remoteApi?.getState!=="function")pjrFail("JOURNEY_RECONNECT_SESSION_UNAVAILABLE");
    return true;
  }
  function pjrCurrentIdentity(){
    const account=accountApi?.getState?.(),device=pairingApi?.getState?.(),rivalry=rivalryApi?.getState?.();
    const accountId=String(account?.accountId||"").trim(),deviceId=String(device?.deviceId||"").trim(),rivalryId=String(rivalry?.rivalryId||"").trim(),managerRole=rivalry?.binding?.managerRole;
    if(!account?.connected||!accountId)pjrFail("JOURNEY_RECONNECT_AUTH_REQUIRED");
    if(!device?.registered||!deviceId)pjrFail("JOURNEY_RECONNECT_DEVICE_REQUIRED");
    if(!rivalry?.attached||!rivalryId||!rivalry?.binding)pjrFail("JOURNEY_RECONNECT_RIVALRY_REQUIRED");
    if(managerRole!=="playerOne"&&managerRole!=="playerTwo")pjrFail("JOURNEY_RECONNECT_ROLE_INVALID");
    const marker=pjrMarkerRivalry();if(marker&&marker!==rivalryId)pjrFail("JOURNEY_RECONNECT_RIVALRY_MISMATCH");
    return Object.freeze({rivalryId,accountId,deviceId,managerRole});
  }
  async function pjrResolveIdentity(){
    if(typeof accountApi?.initialize==="function")await accountApi.initialize();
    if(typeof pairingApi?.initialize==="function")await pairingApi.initialize();
    if(typeof rivalryApi?.initialize==="function")await rivalryApi.initialize();
    if(pjrPrePairShell()&&!rivalryApi?.getState?.()?.attached)return null;
    return pjrCurrentIdentity();
  }
  function pjrSameAuthority(a,b){return Boolean(a&&b&&a.rivalryId===b.rivalryId&&a.accountId===b.accountId&&a.deviceId===b.deviceId&&a.managerRole===b.managerRole);}
  function pjrExactActive(remote,authority,now){const expiry=Number(remote?.expiresAtEpochMs);return Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.rivalryId===authority.rivalryId&&remote.accountId===authority.accountId&&remote.deviceId===authority.deviceId&&remote.pendingAction==null&&Number.isFinite(expiry)&&now<expiry);}
  // Hunt 1018 (H1018-4): after each awaited read, a refresh that went offline or whose account, device or rivalry changed stops.
  function pjrAssertCurrent(generation,authority){if(generation!==pjrGeneration||!pjrOnline())pjrFail("JOURNEY_RECONNECT_SUPERSEDED");if(!pjrSameAuthority(pjrCurrentIdentity(),authority))pjrFail("JOURNEY_RECONNECT_CONTEXT_CHANGED");}
  function pjrPreviousFor(authority){
    if(!state)return null;
    if(state.rivalryId!==authority.rivalryId||state.accountId!==authority.accountId||state.deviceId!==authority.deviceId||state.managerRole!==authority.managerRole){state=null;contextKey="";return null;}
    return state;
  }
  function pjrRemoteSnapshot(){const remote=remoteApi?.getState?.();return remote&&typeof remote==="object"?remote:null;}
  function pjrStatusElement(){
    if(!root.document)return null;let node=root.document.getElementById(STATUS_ID);if(node)return node;
    const app=root.document.getElementById("app");if(!app)return null;
    node=root.document.createElement("div");node.id=STATUS_ID;node.className="stateNote hidden";node.setAttribute("role","status");node.setAttribute("aria-live","polite");node.dataset.sharedJourneyReconnect="true";
    const header=root.document.getElementById("topHeader");if(header?.parentNode===app)header.insertAdjacentElement("afterend",node);else app.prepend(node);return node;
  }
  // Permanent pairs reuse the same automatic connection as Home > CONTINUE CAREER.
  function pjrPermanentlyPaired(){try{const partner=root.CareerModePersistentNikDanielPair?.getPartnerState?.(),account=accountApi?.getState?.();return Boolean(partner?.status==="ready"&&partner.record?.active===true&&account&&partner.accountId===account.accountId);}catch(_error){return false;}}
  function pjrAutomaticStep(){return "Tap RECONNECT to connect Daniel and Nik again.";}
  // Accounts without a permanent partner retain the existing manual recovery instructions.
  function pjrManagerName(role){const name=pjrShowdown()?.managers?.[role];return String(name||(role==="playerOne"?"Manager 1":"Manager 2"));}
  function pjrReconnectStep(role){if(pjrPermanentlyPaired())return pjrAutomaticStep();return role==="playerTwo"?`Tap RECONNECT, paste the new code from ${pjrManagerName("playerOne")} and tap JOIN PRIVATE SESSION.`:`Tap RECONNECT, then HOST PRIVATE SESSION and send the new code to ${pjrManagerName("playerTwo")}.`;}
  // BH-11 (#1): a reload drops the page-memory session code, so this phone simply has no session. That is not an ended
  // session; say so plainly. Kept about as short as the ended-session line so the banner does not reflow the game screens;
  // where the other phone takes the new code is said in the Remote Joining panel.
  function pjrNotConnectedStep(role){if(pjrPermanentlyPaired())return pjrAutomaticStep();const other=pjrManagerName(role==="playerTwo"?"playerOne":"playerTwo");return `Tap RECONNECT, then HOST and send the code to ${other}, or JOIN ${other}'s new code.`;}
  function pjrShowdownClosed(){try{const t=root.CareerModeProductionSharedTerminalClose?.getState?.();return Boolean(t&&t.phase==="CLOSED"&&t.terminal===true);}catch(_){return false;}}
  // r80 END SHOWDOWN: the other phone ended this Showdown (Terminal Close holds it DELETED: closed, no finish witness). This
  // page has already left it for Home with the ended-early notice, and a closed rivalry never reopens, so there is no session
  // to reconnect: no banner, no RECONNECT SESSION (the gallery saw both over Nik's Home and History right after Daniel's END).
  function pjrShowdownEnded(){try{return root.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="DELETED";}catch(_){return false;}}
  function pjrMessage(value){
    if(!value)return "";
    if(value.phase==="FRESH_SESSION_REQUIRED"&&pjrShowdownClosed())return "SHOWDOWN COMPLETE · Open the Final Winner or History from Home.";
    if(value.phase==="OFFLINE_HOLD")return "OFFLINE · Reconnect to carry on.";
    if(value.phase==="RECOVERY_PENDING")return "RECONNECTING · Finish reconnecting both players before continuing.";
    if(value.phase==="FRESH_SESSION_REQUIRED"&&!value.sessionId)return `NOT CONNECTED ON THIS PHONE · Reloading drops the connection. ${pjrNotConnectedStep(value.managerRole)}`;
    if(value.phase==="FRESH_SESSION_REQUIRED")return `NEW CONNECTION NEEDED · ${value.resumable?"Your Showdown is saved; the connection ended":"The connection ended"} (a connection lasts up to 4 hours). ${pjrReconnectStep(value.managerRole)}`;
    if(value.phase==="TERMINAL_RECOVERED")return `RECONNECTED · ALL ${value.totalSeasons} SEASONS COMPLETE · No new season can be added.`;
    if(value.phase==="ACTIVE_RECOVERED")return `RECONNECTED · SEASON ${value.activeSeason} OF ${value.totalSeasons} · League, clubs and history pick up where you left off.`;
    return "RECONNECT STATUS UNAVAILABLE";
  }
  // Job 31: after RECONNECT SESSION the Remote Joining panel stayed open over the game once the fresh session was ACTIVE.
  // It now closes itself as soon as this page holds an exact unexpired ACTIVE session, and the banner re-checks at once.
  let recoveryReturnUnsubscribe=null;
  function pjrRemoteExactActive(remote){const expiry=Number(remote?.expiresAtEpochMs);return Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&Number.isFinite(expiry)&&Date.now()<expiry);}
  function pjrArmRecoveryReturn(exceptSessionId=null,authority=pjrCurrentIdentity()){
    if(typeof recoveryReturnUnsubscribe==="function")recoveryReturnUnsubscribe();recoveryReturnUnsubscribe=null;
    if(typeof remoteApi?.subscribe!=="function")return false;
    const onState=next=>{
      if(!pjrSharedMarker()||pjrShowdownEnded()||!pjrExactActive(next,authority,Date.now())||(exceptSessionId&&next.sessionId===exceptSessionId))return;
      try{if(!pjrSameAuthority(pjrCurrentIdentity(),authority))return;}catch(_error){return;}
      const stop=recoveryReturnUnsubscribe;recoveryReturnUnsubscribe=null;if(typeof stop==="function")stop();
      try{remoteApi.closePanel?.();}catch(_error){}
      void pjrRefresh();
    };
    recoveryReturnUnsubscribe=remoteApi.subscribe(onState);
    // Adoption can finish while openPanel awaits; include that already-delivered ACTIVE result.
    onState(pjrRemoteSnapshot());
    return true;
  }
  async function pjrOpenRecovery(fresh=false){
    try{
      await pjrEnsureDependencies();
      if(typeof remoteApi?.openPanel!=="function")pjrFail("JOURNEY_RECONNECT_SESSION_UI_UNAVAILABLE","Reconnecting is unavailable right now.");
      const authority=pjrCurrentIdentity(),held=pjrRemoteSnapshot(),automatic=pjrPermanentlyPaired();
      if(automatic&&typeof remoteApi.autoConnect!=="function")pjrFail("JOURNEY_RECONNECT_SESSION_UI_UNAVAILABLE","Reconnecting is unavailable right now.");
      const auto=automatic?remoteApi.autoConnect():null;
      await remoteApi.openPanel();
      if(automatic||fresh||!pjrRemoteExactActive(held))pjrArmRecoveryReturn(!automatic&&fresh&&pjrRemoteExactActive(held)?held.sessionId:null,authority);
      if(auto)void auto;
      return true;
    }catch(error){pjrReport("Unable to open private session recovery",error);return false;}
  }
  async function pjrOpenSessionRecovery(){return pjrOpenRecovery();}
  // A paired phone reuses its exact ACTIVE session; manual recovery waits for a different session.
  async function pjrOpenFreshSessionCode(){return pjrOpenRecovery(true);}
  function pjrRender(){
    const node=pjrStatusElement();if(!node)return false;const visible=pjrSharedMarker()&&Boolean(state)&&!pjrShowdownEnded();node.classList.toggle("hidden",!visible);if(!visible){node.replaceChildren();return false;}const text=pjrMessage(state);node.replaceChildren(root.document.createTextNode(text));if((state.phase==="FRESH_SESSION_REQUIRED"&&!pjrShowdownClosed())||state.phase==="RECOVERY_PENDING"){const action=root.document.createElement("button");action.id=ACTION_ID;action.type="button";action.className="compactButton";action.textContent=state.phase==="FRESH_SESSION_REQUIRED"?"RECONNECT":"CHECK CONNECTION";action.disabled=busy;action.addEventListener("click",()=>{void pjrOpenSessionRecovery();});node.append(root.document.createTextNode(" "),action);}else if(state.phase==="ACTIVE_RECOVERED"){/* BH-11 (#1): this phone may still hold the session the other phone lost; let it take the other phone's new code. */const fresh=root.document.createElement("button");fresh.id=NEW_CODE_ACTION_ID;fresh.type="button";fresh.className="compactButton";fresh.textContent=pjrPermanentlyPaired()?"RECONNECT":"NEW CODE";fresh.disabled=busy;fresh.addEventListener("click",()=>{void pjrOpenFreshSessionCode();});node.append(root.document.createTextNode(" "),fresh);}node.dataset.recoveryPhase=state.phase;node.dataset.authoritative=state.activeAuthorization?"true":"false";return true;
  }
  function pjrPublish(next){
    state=next||null;contextKey=state?`${state.accountId}|${state.deviceId}|${state.rivalryId}`:"";pjrRender();
    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-journey-reconnect-state-change",{detail:state?{phase:state.phase,rivalryId:state.rivalryId,managerRole:state.managerRole,activeAuthorization:state.activeAuthorization,resumable:state.resumable,recovered:state.recovered,acceptedSeasons:state.acceptedSeasons,activeSeason:state.activeSeason,totalSeasons:state.totalSeasons,terminal:state.terminal,sessionChanged:state.sessionChanged}:null}));}catch(_error){}
    return state;
  }
  function pjrOnline(){return !root.navigator||root.navigator.onLine!==false;}
  function pjrOfflineHold(){
    pjrGeneration+=1;
    if(!state||!protocol)return pjrPublish(null);
    try{
      const authority={rivalryId:state.rivalryId,accountId:state.accountId,deviceId:state.deviceId,managerRole:state.managerRole};
      return pjrPublish(protocol.observe({authority,previous:state,nowEpochMs:Date.now(),networkOnline:false,remote:null}));
    }catch(error){pjrReport("Unable to hold Shared Journey offline",error);return pjrPublish(null);}
  }
  // Hunt 1018 (H1018-3): losing account, device or rivalry authority after recovery keeps the durable plan and history but
  // publishes a non-authoritative state (recovered and activeAuthorization false) until the identity is verified again.
  function pjrDropAuthority(){
    if(!state?.activeAuthorization||!protocol)return state;
    try{return pjrPublish(protocol.observe({authority:{rivalryId:state.rivalryId,accountId:state.accountId,deviceId:state.deviceId,managerRole:state.managerRole},previous:state,nowEpochMs:Date.now(),networkOnline:pjrOnline(),remote:null}));}
    catch(error){pjrReport("Unable to drop Shared Journey authority",error);return pjrPublish(null);}
  }
  function pjrBootstrap(){return pjrEnsureDependencies().then(()=>{if(!unsubscribeRemote&&typeof remoteApi?.subscribe==="function")unsubscribeRemote=remoteApi.subscribe(()=>pjrWake());});}
  async function pjrRefreshNow(){
    const generation=pjrGeneration;
    // Codex #942: a refresh superseded while it awaited (END landed: DELETED, or offline) never publishes a banner state over the newer one.
    const publish=next=>generation===pjrGeneration?pjrPublish(next):state;
    if(!pjrSharedMarker()||pjrShowdownEnded())return pjrPublish(null);
    if(pjrSetupPending()&&pjrSetupPresentationActive())return pjrPublish(null);
    await pjrBootstrap();
    if(!pjrOnline())return pjrOfflineHold();
    const authority=await pjrResolveIdentity();if(!authority)return pjrPublish(null);const previous=pjrPreviousFor(authority),remote=pjrRemoteSnapshot();
    const now=Date.now(),base={authority,previous,nowEpochMs:now,networkOnline:true,remote};
    const remoteExpiry=Number(remote?.expiresAtEpochMs);
    const exactActive=Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.rivalryId===authority.rivalryId&&remote.accountId===authority.accountId&&remote.deviceId===authority.deviceId&&remote.pendingAction==null&&Number.isFinite(remoteExpiry)&&now<remoteExpiry);
    if(!exactActive)return publish(protocol.observe(base));
    if(!previous)return pjrPublish(null);
    const setupResult=await setupApi.refresh(),setupState=setupApi.getState();
    pjrAssertCurrent(generation,authority);
    const sameSetupContext=Boolean(setupResult&&setupState&&setupState.ready===true&&setupState.rivalryId===authority.rivalryId&&setupState.sessionId===remote.sessionId);
    if(sameSetupContext&&pjrSetupPending()&&(!setupState.setup||setupState.setup.phase!=="SHOWDOWN_CONFIRMED"))return pjrPublish(null);
    if(!sameSetupContext||!setupState.setup||setupState.setup.phase!=="SHOWDOWN_CONFIRMED"||setupState.setup.revision!==6)pjrFail("JOURNEY_RECONNECT_SETUP_NOT_CONFIRMED");
    const progressionResult=await multiApi.refresh(),progressionView=multiApi.getState();
    pjrAssertCurrent(generation,authority);
    if(!progressionResult||!progressionView||progressionView.authoritative!==true||progressionView.rivalryId!==authority.rivalryId||!progressionView.state){const latestRemote=pjrRemoteSnapshot(),latestNow=Date.now(),latestExpiry=Number(latestRemote?.expiresAtEpochMs),latestExactActive=Boolean(latestRemote&&latestRemote.sessionState==="active"&&latestRemote.sessionId&&latestRemote.rivalryId===authority.rivalryId&&latestRemote.accountId===authority.accountId&&latestRemote.deviceId===authority.deviceId&&latestRemote.pendingAction==null&&Number.isFinite(latestExpiry)&&latestNow<latestExpiry);if(!latestExactActive)return publish(protocol.observe({authority,previous,nowEpochMs:latestNow,networkOnline:true,remote:latestRemote}));pjrFail("JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE",`Season progress could not be checked (${String(multiApi?.lastError?.()||"NO_PROGRESSION_VIEW")}). You are connected; this retries by itself.`);}
    // Hunt 1018 (H1018-5): recovered authority is claimed only for the same exact session, still unexpired after the reads.
    const latestRemote=pjrRemoteSnapshot(),latestNow=Date.now();
    if(!pjrExactActive(latestRemote,authority,latestNow))return publish(protocol.observe({authority,previous,nowEpochMs:latestNow,networkOnline:true,remote:latestRemote}));
    if(latestRemote.sessionId!==remote.sessionId)return state;
    return publish(protocol.observe({...base,nowEpochMs:latestNow,remote:latestRemote,setup:setupState.setup,progression:progressionView.state}));
  }
  // A new Showdown setup or a lagging progression read can fail for one poll; report only when the same failure repeats.
  const PJR_HELD_CODES=Object.freeze(["JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE","JOURNEY_RECONNECT_SETUP_NOT_CONFIRMED"]);
  // Account, device or rivalry authority not resolved yet (reload, startup, provider transition) is a quiet pending state:
  // the banner cannot speak for an unresolved identity, and the next poll or wake re-checks. Role/rivalry mismatches still report.
  const PJR_PENDING_AUTHORITY_CODES=Object.freeze(["JOURNEY_RECONNECT_AUTH_REQUIRED","JOURNEY_RECONNECT_DEVICE_REQUIRED","JOURNEY_RECONNECT_RIVALRY_REQUIRED"]);
  function pjrRefresh(){
    if(refreshPromise)return refreshPromise;busy=true;
    const run=pjrRefreshNow().then(value=>{lastReportedCode="";heldTransientCode="";return value;},error=>{if(pjrShowdownEnded()){heldTransientCode="";return state;}if(error?.code==="JOURNEY_RECONNECT_SUPERSEDED"){heldTransientCode="";return pjrOnline()?state:pjrOfflineHold();}if(PJR_PENDING_AUTHORITY_CODES.includes(error?.code)||error?.code==="JOURNEY_RECONNECT_CONTEXT_CHANGED"){heldTransientCode="";return pjrDropAuthority();}const code=`${String(accountApi?.getState?.()?.accountId||"")}|${String(pairingApi?.getState?.()?.deviceId||"")}|${String(pjrMarkerRivalry()||"")}|${String(error?.code||"JOURNEY_RECONNECT_FAILED")}|${String(multiApi?.lastError?.()||"")}`;if(PJR_HELD_CODES.includes(error?.code)&&code!==heldTransientCode&&code!==lastReportedCode){heldTransientCode=code;return state;}heldTransientCode="";if(code!==lastReportedCode)pjrReport("Unable to refresh Shared Journey recovery",error);lastReportedCode=code;return state;}).finally(()=>{busy=false;if(refreshPromise===run)refreshPromise=null;pjrRender();if(wakePending){wakePending=false;pjrWake();}});refreshPromise=run;return run;
  }
  // Codex #942: END landing while a refresh is in flight (busy) must not wait for that refresh: the banner and its action are
  // cleared at once and the in-flight refresh is superseded (it can no longer publish), then the usual wake follows.
  function pjrOnTerminalClose(){if(pjrShowdownEnded()){pjrGeneration+=1;pjrPublish(null);}pjrWake();}
  function pjrWake(){if(!pjrSharedMarker()||root.document?.visibilityState==="hidden")return;if(busy){wakePending=true;return;}void pjrRefresh();}
  function pjrInstall(){
    // r75: an ordinary startup with no Shared Journey loads none of the recovery runtime (Remote Joining stays unloaded);
    // the first wake that finds the shared marker loads it through pjrRefreshNow.
    if(installed)return true;installed=true;if(pjrSharedMarker())void pjrBootstrap().then(()=>pjrWake()).catch(error=>pjrReport("Shared Journey recovery bootstrap unavailable",error));
    root.addEventListener?.("career-mode-shared-wait-context-change",pjrWake);
    root.addEventListener?.("online",pjrWake);
    root.addEventListener?.("offline",()=>pjrOfflineHold());
    root.addEventListener?.("career-mode-shared-setup-state-change",pjrWake);
    root.addEventListener?.("career-mode-shared-season-cursor-change",pjrWake);
    root.addEventListener?.("career-mode-connected-account-state-change",pjrWake);
    root.addEventListener?.("career-mode-shared-terminal-close-state-change",pjrOnTerminalClose);
    root.document?.addEventListener?.("visibilitychange",pjrWake);
    if(typeof root.setInterval==="function")root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.()||Date.now()>=Number(root.CareerModeSparkRemoteJoining?.getState?.()?.expiresAtEpochMs))pjrWake();},POLL_MS);
    if(typeof root.setTimeout==="function")root.setTimeout(pjrWake,0);
    return true;
  }

  return Object.freeze({
    contractVersion:1,feature:"ssjr-production-shared-journey-reconnect",productionEnabled:true,runtimeRevision:"1.9.1-r14",pollIntervalMs:POLL_MS,
    sessionAuthorityReplaceable:true,durableRivalryStatePreserved:true,expiredSessionNeverActive:true,offlineNeverAuthoritative:true,freshRuntimeRequiresReauthorization:true,
    dualManagerStatusVisible:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
    install:pjrInstall,refresh:pjrRefresh,openSessionRecovery:pjrOpenSessionRecovery,openFreshSessionCode:pjrOpenFreshSessionCode,getState:()=>state,isRecovered:()=>Boolean(state?.recovered&&state?.activeAuthorization),isBusy:()=>busy
  });
});
```

## FILE: js/productionSharedSeasonResults.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedSeasonResults=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  // Job 33 (R1): after publishing, read every 3 s for at most 3 minutes while the rival has not published yet.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  let fastWaitKey="",fastWaitSince=0;
  const CONTROL_IDS=Object.freeze(["completeSeason","confirmSeasonCompletion","editSeasonResults"]);
  // r80: EuropaLeague is a check like the others (index >= 3). One manager plays the Champions League or the Europa League in a
  // season, never both: ticking one unticks the other (pssrContinental), and the read refuses both. The two managers play different
  // FIFA saves, so nothing is ever compared across them.
  const RESULT_SUFFIXES=Object.freeze(["LeaguePosition","LeaguePoints","LeagueGoals","DomesticCup","ChampionsLeague","EuropaLeague","TopScorer","TopAssist"]);
  let formContextKey="",installed=false,busy=false,provider=null,setupApi=null,transferApi=null,catalogApi=null,view=null,draft=null,pollTimer=null,providerChain=Promise.resolve(),refreshPromise=null,contextKey="",renderedContextKey="",errorNode=null,errorMessage="";

  function pssrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pssrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pssrSharedMarker(){const showdown=pssrShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pssrReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pssrField(id){return root.document&&root.document.getElementById(id);}
  function pssrText(id,value){const node=pssrField(id);if(node)node.textContent=String(value??"");return node;}
  function pssrHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pssrDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
  function pssrLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pssrEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
    else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await pssrLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pssrLoadScript("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js",()=>root.CareerModeProductionSharedTransferChallenge);
    await pssrLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
    await pssrLoadScript("ssjr-shared-setup-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup);
    await pssrLoadScript("ssjr-season-results-protocol","js/sharedSeasonResults.js",()=>root.CareerModeSharedSeasonResults);
    await pssrLoadScript("ssjr-season-results-provider","js/sparkSharedSeasonResults.js",()=>root.CareerModeSparkSharedSeasonResults);
    await pssrLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;transferApi=root.CareerModeProductionSharedTransferChallenge;provider=root.CareerModeSparkSharedSeasonResults;catalogApi=root.CareerModeSharedShowdownCatalog;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pssrFail("SEASON_RESULTS_SETUP_UNAVAILABLE");
    if(!transferApi||typeof transferApi.refresh!=="function"||typeof transferApi.getState!=="function")pssrFail("SEASON_RESULTS_TRANSFER_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function"||typeof provider.publishResult!=="function")pssrFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");
  }
  function pssrSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=pssrShowdown()?.currentRound,season=Number(pssrSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)pssrFail("SEASON_RESULTS_SEASON_INVALID");return season;}
  function pssrRolePrefix(role){return role==="playerOne"?"p1":"p2";}
  function pssrOtherRole(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function pssrManagerName(role){const showdown=pssrShowdown();return showdown?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
  function pssrSetupState(){try{return setupApi?.getState?.()||null;}catch(_error){return null;}}
  function pssrTransferState(){try{return transferApi?.getState?.()||null;}catch(_error){return null;}}
  function pssrClubName(role){const setup=pssrSetupState()?.setup||pssrTransferState()?.setup;return setup?.clubs?.[role]||pssrShowdown()?.clubs?.[role]||"Club";}
  function pssrRequestContext(){
    const showdown=pssrShowdown(),setup=pssrSetupState(),rivalryId=String(showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"").trim();let seasonNumber;
    try{seasonNumber=pssrSeason();}catch(_error){return null;}
    const saveId=String(showdown?.id||showdown?.saveId||"").trim();
    const key=rivalryId&&seasonNumber?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";
    return key?Object.freeze({key,rivalryId,seasonNumber}):null;
  }
  function pssrContextMatches(request){const current=pssrRequestContext();return Boolean(request&&current&&request.key===current.key);}
  function pssrTransferComplete(request){const transfer=pssrTransferState();return Boolean(request&&transfer&&Number(transfer.seasonNumber)===request.seasonNumber&&transfer.state&&transfer.state.phase==="COMPLETED");}
  function pssrCanRoute(){const request=pssrRequestContext();return Boolean(pssrSharedMarker()&&request&&contextKey===request.key&&view&&view.managerRole&&view.rivalryId===request.rivalryId&&Number(view.seasonNumber)===request.seasonNumber&&pssrTransferComplete(request));}
  function pssrResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The Season Results request was rejected.");error.code=result&&result.code||"SEASON_RESULTS_PROVIDER_FAILED";throw error;}
  // JOB-1611: provider codes that mean "contended", not "refused": Firestore lock contention after the SDK's own retries.
  const PSSR_CONTENTION_CODES=Object.freeze(["aborted","failed-precondition","permission-denied","firestore/permission-denied","permission_denied"]);
  const PSSR_CONTENTION_RETRY_MS=Object.freeze([500,1000,1500]);
  function pssrWait(ms){return new Promise(resolve=>{const timer=typeof root.setTimeout==="function"?root.setTimeout:setTimeout;timer(resolve,ms);});}
  // JOB-1611: the reads inside a publish meet the same contention; they get the same bounded wait before failing as before.
  async function pssrPublishRead(ctx,request){let read=await provider.read(ctx.options);for(let retry=0;read?.ok!==true&&PSSR_CONTENTION_CODES.includes(read?.code)&&retry<PSSR_CONTENTION_RETRY_MS.length&&pssrContextMatches(request);retry+=1){await pssrWait(PSSR_CONTENTION_RETRY_MS[retry]);read=await provider.read(ctx.options);}return pssrResultError(read,"Season Results could not be refreshed before publishing.");}
  function pssrQueueProvider(task){const run=providerChain.then(task,task);providerChain=run.catch(()=>{});return run;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and the COMPLETED Transfer Challenge.
  async function pssrProviderContext(request=pssrRequestContext(),light=false){
    if(!pssrSharedMarker())pssrFail("SEASON_RESULTS_SHARED_MODE_REQUIRED");
    if(!request||!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
    await pssrEnsureDependencies();
    if(!(light===true&&pssrSetupState()?.ready===true&&pssrTransferComplete(request))){
      await setupApi.refresh();if(!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
      try{await transferApi.refresh();}catch(error){if(!(pssrContextMatches(request)&&pssrTransferComplete(request)))throw error;}if(!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
    }
    if(!pssrTransferComplete(request))pssrFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE","Finish the Transfer Challenge before publishing Season Results.");
    const setup=pssrSetupState();
    if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.managerRole||!setup.rivalryId||!setup.sessionId||!setup.deviceId)pssrFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    const runtime=root.CareerModeProductionFirebaseRuntime,services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pssrFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    return Object.freeze({setup,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:Date.now()}});
  }
  async function pssrRefreshNow(request=pssrRequestContext(),light=false){
    if(!request)return null;
    const ctx=await pssrProviderContext(request,light);if(!pssrContextMatches(request))return null;
    const result=pssrResultError(await provider.read(ctx.options),"Season Results could not be loaded.");if(!pssrContextMatches(request))return null;
    view={...result,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;pssrRender();
    if(result.ownResult||result.state?.phase==="RESULTS_READY")pssrSetError("");
    return view;
  }
  function pssrRefresh(light=false){const request=pssrRequestContext();if(!request)return Promise.resolve(null);if(refreshPromise&&contextKey===request.key)return refreshPromise;const current=pssrQueueProvider(()=>pssrRefreshNow(request,light===true));refreshPromise=current;current.then(()=>{if(refreshPromise===current)refreshPromise=null;},()=>{if(refreshPromise===current)refreshPromise=null;});return current;}
  function pssrRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")pssrFail("SEASON_RESULTS_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `season_result_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  function pssrTeamCount(){const stateCount=view?.state?.teamCount;if(Number.isInteger(stateCount)&&stateCount>=2&&stateCount<=20)return stateCount;const leagueId=view?.setup?.leagueId||pssrSetupState()?.setup?.leagueId,catalog=catalogApi?.catalog;const clubs=catalog&&leagueId?catalog[leagueId]:null;return Array.isArray(clubs)&&clubs.length>=2&&clubs.length<=20?clubs.length:20;}
  function pssrReadForm(role){
    const prefix=pssrRolePrefix(role),position=pssrField(`${prefix}LeaguePosition`),points=pssrField(`${prefix}LeaguePoints`),goals=pssrField(`${prefix}LeagueGoals`);
    if(!position||!points||!goals||position.value===""||points.value===""||goals.value==="")pssrFail("SEASON_RESULTS_FORM_INCOMPLETE",`Enter league position, league points and league goals for ${pssrManagerName(role)}.`);
    const result={leaguePosition:Number(position.value),leaguePoints:Number(points.value),leagueGoals:Number(goals.value),domesticCup:Boolean(pssrField(`${prefix}DomesticCup`)?.checked),championsLeague:Boolean(pssrField(`${prefix}ChampionsLeague`)?.checked),topScorer:Boolean(pssrField(`${prefix}TopScorer`)?.checked),topAssist:Boolean(pssrField(`${prefix}TopAssist`)?.checked)};
    // The stored result carries europaLeague only when it is true (the sparse key; an unticked box leaves the 7-key r79 shape).
    if(pssrField(`${prefix}EuropaLeague`)?.checked===true){if(result.championsLeague)pssrFail("SEASON_RESULTS_CONTINENTAL_CONFLICT",`${pssrManagerName(role)}: pick Champions League or Europa League, not both.`);result.europaLeague=true;}
    const teamCount=pssrTeamCount(),maxPoints=(teamCount-1)*2*3;
    if(!Number.isInteger(result.leaguePosition)||result.leaguePosition<1||result.leaguePosition>teamCount)pssrFail("SEASON_RESULTS_POSITION_INVALID",`${pssrManagerName(role)}'s league position must be a whole number from 1 to ${teamCount}.`);
    if(!Number.isInteger(result.leaguePoints)||result.leaguePoints<0||result.leaguePoints>maxPoints)pssrFail("SEASON_RESULTS_POINTS_INVALID",`${pssrManagerName(role)}'s league points must be a whole number from 0 to ${maxPoints}.`);
    if(!Number.isInteger(result.leagueGoals)||result.leagueGoals<0||result.leagueGoals>300)pssrFail("SEASON_RESULTS_GOALS_INVALID",`${pssrManagerName(role)}'s league goals must be a whole number from 0 to 300.`);
    return Object.freeze(result);
  }
  function pssrFingerprint(result){return JSON.stringify({leaguePosition:Number(result.leaguePosition),leaguePoints:Number(result.leaguePoints),leagueGoals:Number(result.leagueGoals),domesticCup:Boolean(result.domesticCup),championsLeague:Boolean(result.championsLeague),topScorer:Boolean(result.topScorer),topAssist:Boolean(result.topAssist),europaLeague:result.europaLeague===true});}
  function pssrPopulate(role,result){if(!result)return;const prefix=pssrRolePrefix(role);pssrField(`${prefix}LeaguePosition`).value=String(result.leaguePosition);pssrField(`${prefix}LeaguePoints`).value=String(result.leaguePoints);pssrField(`${prefix}LeagueGoals`).value=String(result.leagueGoals);for(const [suffix,key] of [["DomesticCup","domesticCup"],["ChampionsLeague","championsLeague"],["EuropaLeague","europaLeague"],["TopScorer","topScorer"],["TopAssist","topAssist"]]){const input=pssrField(`${prefix}${suffix}`);if(input)input.checked=result[key]===true;}}
  function pssrDisableRole(role,disabled){const prefix=pssrRolePrefix(role);RESULT_SUFFIXES.forEach(suffix=>pssrDisable(pssrField(`${prefix}${suffix}`),disabled));}
  // QoL 3: a half-typed result survives a reload. Own manager only, this device only, through the js/storage.js draft helpers; removed on publish.
  function pssrDraftFieldIds(role){const prefix=pssrRolePrefix(role);return RESULT_SUFFIXES.map(suffix=>`${prefix}${suffix}`);}
  function pssrDraftKey(role,request=pssrRequestContext()){return request&&(role==="playerOne"||role==="playerTwo")?`cms.draft.v1:${request.rivalryId}:${request.seasonNumber}:${role}:seasonResult`:"";}
  function pssrDraftClear(role,request=pssrRequestContext()){const key=pssrDraftKey(role,request);if(key&&typeof root.removeStorageValue==="function")root.removeStorageValue(key);}
  function pssrDraftSave(){
    const request=pssrRequestContext(),role=view?.managerRole;
    const key=pssrDraftKey(role,request);if(!key||contextKey!==request.key||view.ownResult||view.state?.phase==="RESULTS_READY"||typeof root.writeStorageValue!=="function")return false;
    const prefix=pssrRolePrefix(role),values={},checks={};let any=false;
    RESULT_SUFFIXES.forEach((suffix,index)=>{const input=pssrField(`${prefix}${suffix}`);if(!input)return;if(index<3){values[suffix]=String(input.value||"");if(values[suffix])any=true;}else if(suffix!=="EuropaLeague"||input.checked){checks[suffix]=Boolean(input.checked);if(checks[suffix])any=true;}});
    if(!any){pssrDraftClear(role,request);return true;}
    return root.writeStorageValue(key,JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,values,checks}))===true;
  }
  function pssrDraftRestore(role){
    const request=pssrRequestContext(),key=pssrDraftKey(role,request);if(!key||typeof root.readStorageValue!=="function")return false;
    let saved;try{saved=JSON.parse(root.readStorageValue(key)||"null");}catch(_error){return false;}
    if(!saved||saved.version!==1||saved.rivalryId!==request.rivalryId||Number(saved.seasonNumber)!==request.seasonNumber||saved.role!==role)return false;
    const prefix=pssrRolePrefix(role),values=saved.values&&typeof saved.values==="object"?saved.values:{},checks=saved.checks&&typeof saved.checks==="object"?saved.checks:{};
    RESULT_SUFFIXES.forEach((suffix,index)=>{const input=pssrField(`${prefix}${suffix}`);if(!input)return;if(index<3){if(input.value===""&&typeof values[suffix]==="string")input.value=values[suffix].slice(0,12);}else if(!input.checked&&checks[suffix]===true)input.checked=true;});
    return true;
  }
  function pssrContinental(id){const match=/^(p[12])(ChampionsLeague|EuropaLeague)$/.exec(String(id||""));if(!match||pssrField(id)?.checked!==true)return;const other=pssrField(`${match[1]}${match[2]==="ChampionsLeague"?"EuropaLeague":"ChampionsLeague"}`);if(other?.checked)other.checked=false;}
  function pssrDraftChange(event){const role=view?.managerRole,id=event?.target?.id;pssrContinental(id);if(!role||!id||!pssrSharedMarker()||!pssrDraftFieldIds(role).includes(id))return;pssrDraftSave();}
  function pssrCard(role){const input=pssrField(`${pssrRolePrefix(role)}LeaguePosition`);return input&&input.closest?input.closest(".seasonResultCard"):null;}
  function pssrSetError(message=""){
    const value=String(message||"");
    if(!value){if(errorNode&&errorNode.textContent===errorMessage)errorNode.textContent="";errorNode=null;errorMessage="";return;}
    const panel=pssrField("seasonReviewPanel"),target=panel&&!panel.classList.contains("hidden")?pssrField("seasonReviewError"):pssrField("seasonEntryError");
    if(target){target.textContent=value;errorNode=target;errorMessage=value;}
  }
  function pssrAppendLine(container,label,value){const row=root.document.createElement("div"),name=root.document.createElement("span"),data=root.document.createElement("strong");row.className="summaryLine seasonReviewLine";name.textContent=label;data.textContent=String(value);row.append(name,data);container.append(row);}
  // r86: the published card shows the manager's Special Player under the name, as the entry card does (none before r86).
  function pssrSpecialPlayerSlot(role){try{const api=root.CareerModeSpecialPlayerChip,sp=api?.live?.(),chip=sp?api.element(root.document,sp[role==="playerOne"?"daniel":"nik"]):null;if(!chip)return null;const slot=root.document.createElement("span");slot.className="seasonSpecialPlayer";slot.appendChild(chip);return slot;}catch(_error){return null;}}
  function pssrRenderReviewCard(container,role,result){if(!container||!result)return;const fragment=root.document.createDocumentFragment(),heading=root.document.createElement("h3"),club=root.document.createElement("p"),special=pssrSpecialPlayerSlot(role);heading.textContent=pssrManagerName(role);club.className="summaryClub";club.textContent=pssrClubName(role);fragment.append(heading);if(special)fragment.append(special);fragment.append(club);pssrAppendLine(fragment,"League Position",result.leaguePosition);pssrAppendLine(fragment,"League Points",result.leaguePoints);pssrAppendLine(fragment,"League Goals",result.leagueGoals);const achievements=root.document.createElement("div");achievements.className="seasonReviewAchievements";[["Champions League",result.championsLeague],["Europa League",result.europaLeague===true],["Domestic Cup",result.domesticCup],["Top Scorer",result.topScorer],["Top Assist",result.topAssist]].forEach(([label,active])=>{const item=root.document.createElement("span");item.className=active?"isEarned":"isNotEarned";item.textContent=`${active?"✓":"—"} ${label}`;achievements.append(item);});fragment.append(achievements);container.replaceChildren(fragment);}
  function pssrEntryMode(reviewing){const panel=pssrField("seasonReviewPanel"),grid=root.document?.querySelector?.("#seasonEntry .seasonEntryGrid"),hint=root.document?.querySelector?.("#seasonEntry .seasonEntryHint"),actions=pssrField("completeSeason")?.closest?.(".seasonEntryActions");pssrHidden(panel,!reviewing);pssrHidden(grid,reviewing);pssrHidden(hint,reviewing);pssrHidden(actions,reviewing);if(pssrField("seasonEntry"))pssrField("seasonEntry").dataset.sharedSeasonResults=reviewing?"review":"entry";}
  function pssrRenderReview(result,{waiting=false,ready=false}={}){
    const role=view?.managerRole,other=pssrOtherRole(role),one=pssrField("seasonReviewOne"),two=pssrField("seasonReviewTwo"),ownCard=role==="playerOne"?one:two,otherCard=role==="playerOne"?two:one,confirm=pssrField("confirmSeasonCompletion"),edit=pssrField("editSeasonResults"),overall=pssrField("seasonReviewOverallScore")?.closest?.(".seasonReviewOverall"),warning=root.document?.querySelector?.("#seasonReviewPanel .seasonReviewWarning");
    pssrEntryMode(true);pssrHidden(overall,true);pssrText("seasonEntryTitle",`SEASON ${view?.seasonNumber||pssrSeason()} RESULTS`);pssrText("seasonReviewHeading",ready?"BOTH MANAGERS PUBLISHED":waiting?"YOUR RESULT IS PUBLISHED":"REVIEW YOUR SEASON RESULT");pssrText("seasonReviewStatusMeta",ready?"":waiting?"PUBLISHED · WAITING FOR YOUR RIVAL":"NOT PUBLISHED YET");pssrHidden(pssrField("seasonReviewStatusMeta")?.closest?.(".seasonReviewStatus"),ready);
    pssrRenderReviewCard(ownCard,role,result);pssrHidden(ownCard,false);
    if(ready&&view?.opponentResult){pssrRenderReviewCard(otherCard,other,view.opponentResult);pssrHidden(otherCard,false);pssrText("seasonReviewResult","Both managers published their FIFA 17 season results.");}
    else{pssrHidden(otherCard,true);pssrText("seasonReviewResult",waiting?"Your rival sees this only after publishing theirs. This screen updates by itself.":"Check your results. Once published, they are final.");}
    // Job 33 (R8): once both published, the Shared Season Commit status below is the one banner that says what to tap next.
    if(warning){pssrHidden(warning,ready);if(!ready)warning.textContent="PUBLISHING IS FINAL";}
    if(confirm){pssrHidden(confirm,ready);pssrDisable(confirm,busy||waiting);confirm.textContent=waiting?"PUBLISHED ✓":"PUBLISH MY SEASON RESULT";}
    if(edit){pssrHidden(edit,ready||waiting);pssrDisable(edit,busy);edit.textContent="EDIT MY RESULT";}
  }
  function pssrRenderEntry(){
    const role=view?.managerRole;if(!role)return;const other=pssrOtherRole(role),own=view?.ownResult||null,ready=view?.state?.phase==="RESULTS_READY";
    pssrText("seasonEntryTitle",`SEASON ${view?.seasonNumber||pssrSeason()} RESULTS`);pssrText("seasonManagerOne",pssrManagerName("playerOne"));pssrText("seasonManagerTwo",pssrManagerName("playerTwo"));pssrText("seasonClubOne",pssrClubName("playerOne"));pssrText("seasonClubTwo",pssrClubName("playerTwo"));
    if(own)pssrPopulate(role,own);if(ready&&view?.opponentResult)pssrPopulate(other,view.opponentResult);
    if(own||ready){pssrDraftClear(role);pssrDisableRole(role,true);pssrDisableRole(other,true);pssrRenderReview(own||view?.allResults?.[role],{waiting:!ready,ready});return;}
    if(draft&&draft.contextKey===contextKey&&draft.seasonNumber===view.seasonNumber&&draft.managerRole===role){pssrDisableRole(role,true);pssrDisableRole(other,true);pssrRenderReview(draft.result);return;}
    pssrEntryMode(false);pssrHidden(pssrCard(role),false);pssrHidden(pssrCard(other),true);pssrDraftRestore(role);pssrDisableRole(role,false);pssrDisableRole(other,true);const complete=pssrField("completeSeason");if(complete){complete.textContent="REVIEW MY SEASON RESULT";pssrDisable(complete,busy);}const hint=root.document?.querySelector?.("#seasonEntry .seasonEntryHint");if(hint)hint.textContent=`Enter ${pssrManagerName(role)}'s FIFA 17 season result. Your rival enters theirs on their own device.`;
  }
  // H1017-4: a new shared season or manager role starts from an empty form for both managers. Same-context polls keep typed input.
  // formContextKey is the last context the form was rendered for; the tick's context reset leaves it alone so the change is still seen.
  function pssrClearForm(){for(const role of ["playerOne","playerTwo"]){const prefix=pssrRolePrefix(role);RESULT_SUFFIXES.forEach((suffix,index)=>{const input=pssrField(`${prefix}${suffix}`);if(!input)return;if(index<3)input.value="";else input.checked=false;});}}
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let pssrWatchedKey=null;
  function pssrWatchSync(){let key="";try{key=pssrWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pssrWatchedKey)return;pssrWatchedKey=key;try{pssrWatchWait();}catch(_error){}}
  function pssrRender(){pssrWatchSync();if(!root.document||!pssrSharedMarker()||!view)return false;const request=pssrRequestContext();if(!request||contextKey!==request.key)return false;if(renderedContextKey!==request.key){renderedContextKey=request.key;draft=null;}const formKey=`${request.key}|${view.managerRole||""}`;if(formContextKey&&formContextKey!==formKey){draft=null;pssrClearForm();}formContextKey=formKey;pssrRenderEntry();return true;}
  function pssrBeginReview(){
    if(!view||!view.managerRole)return false;if(view.ownResult){root.CareerModeSeasonFinalV10?.reviewFinalSeason?.();pssrRender();return true;}
    try{const result=pssrReadForm(view.managerRole);draft={contextKey,seasonNumber:view.seasonNumber,managerRole:view.managerRole,result,fingerprint:pssrFingerprint(result),operationId:null,baseRevision:null};pssrSetError("");pssrRenderReview(result);return true;}catch(error){draft=null;pssrSetError(error.message||error.code);return false;}
  }
  function pssrEdit(){if(busy||view?.ownResult)return false;draft=null;pssrSetError("");pssrEntryMode(false);pssrRenderEntry();const input=pssrField(`${pssrRolePrefix(view.managerRole)}LeaguePosition`);input?.focus?.({preventScroll:true});return true;}
  async function pssrPublish(){
    if(busy||!draft||!view?.managerRole)return false;
    if(draft.contextKey!==contextKey||draft.seasonNumber!==view.seasonNumber||draft.managerRole!==view.managerRole){pssrSetError("The shared season context changed. Review your result again.");draft=null;return false;}
    let currentResult;try{currentResult=pssrReadForm(view.managerRole);}catch(error){pssrSetError(error.message||error.code);return false;}
    if(pssrFingerprint(currentResult)!==draft.fingerprint){pssrSetError("Your season result changed after review. Choose Edit My Result and review it again before publishing.");return false;}
    const request=pssrRequestContext();if(!request||!pssrContextMatches(request))return false;busy=true;pssrSetError("");const publishRole=view.managerRole;pssrRender();
    try{
      return await pssrQueueProvider(async()=>{
        const ctx=await pssrProviderContext(request);if(!pssrContextMatches(request))return false;
        let current=await pssrPublishRead(ctx,request);if(!pssrContextMatches(request))return false;
        let staleRetried=false,contentionRetries=0;
        for(;;){
          if(current.ownResult){pssrDraftClear(publishRole,request);view={...current,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;pssrRender();return true;}
          draft.operationId=draft.operationId||pssrRandomOperationId();draft.baseRevision=Number(current.revision||0);
          const published=await provider.publishResult({...ctx.options,operationId:draft.operationId,baseRevision:draft.baseRevision,result:draft.result});
          if(published?.code==="SEASON_RESULTS_STALE_BASE_REVISION"&&!staleRetried){staleRetried=true;current=await pssrPublishRead(ctx,request);if(!pssrContextMatches(request))return false;continue;}
          // JOB-1611: two same-moment publishes can both lose to lock contention instead of one losing to the other's write.
          // One manager then gets aborted (SDK retries spent) or permission-denied (the rival's retried write had not landed
          // by the provider's last re-read) while the rival quietly retries and wins. Wait, re-read and publish again with
          // the same operationId (an own write that did land is bound, never written twice); bounded, then surfaced as before.
          if(PSSR_CONTENTION_CODES.includes(published?.code)&&contentionRetries<PSSR_CONTENTION_RETRY_MS.length){await pssrWait(PSSR_CONTENTION_RETRY_MS[contentionRetries]);contentionRetries+=1;if(!pssrContextMatches(request))return false;const fresh=await provider.read(ctx.options);if(!pssrContextMatches(request))return false;if(fresh?.ok===true)current=fresh;continue;}
          const result=pssrResultError(published,"Your Season Result could not be published.");if(!pssrContextMatches(request))return true;
          pssrDraftClear(publishRole,request);view={...result,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;try{await pssrRefreshNow(request);}catch(_error){pssrRefresh().catch(()=>{});}return true;
        }
      });
    }catch(error){if(pssrContextMatches(request)){pssrSetError(error.message||error.code||"Shared Season Result publication failed.");pssrReport("Unable to publish Shared Season Result",error);}return false;}
    finally{busy=false;if(pssrContextMatches(request))pssrRender();}
  }
  async function pssrOpen(){
    const navAtTap=typeof root.getNavigationRevision==="function"?root.getNavigationRevision():null;
    if(!pssrSharedMarker())return false;await pssrEnsureDependencies();const request=pssrRequestContext();if(!request)return false;const result=await pssrRefresh();if(!result||!pssrContextMatches(request)||contextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pssrFail("SEASON_RESULTS_NAVIGATION_UNAVAILABLE");if(navAtTap!==null&&root.getNavigationRevision()!==navAtTap)return false;const shown=await root.navigateTo("seasonEntry");if(shown===false||!pssrContextMatches(request))return false;pssrRender();return true;
  }
  function pssrCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||!CONTROL_IDS.includes(target.id)||!pssrSharedMarker())return;const active=pssrField("seasonEntry");if(!active||active.classList.contains("hidden"))return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.id==="completeSeason")pssrBeginReview();else if(target.id==="editSeasonResults")pssrEdit();else void pssrPublish();}
  function pssrWaitingKey(){const active=["seasonEntry","mainMenu","standings"].some(id=>{const node=pssrField(id);return node&&!node.classList.contains("hidden");});if(!view||contextKey!==pssrRequestContext()?.key||!view.ownResult||view.state?.phase==="RESULTS_READY"||!active)return "";return `${contextKey}|publish`;}
  function pssrFastPollDue(){const key=pssrWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // timer checks stop while that listener is healthy; deliveries still wake the provider immediately.
  function pssrWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pssrWaitingKey()||pssrLiveScreen()?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`:null)(pssrRequestContext()):null);}catch(_error){path=null;}let relaxed=false;try{relaxed=Boolean(path&&!pssrWaitingKey()&&pssrLiveScreen());}catch(_error){relaxed=false;}return budget.watchWaitPoint("season-results",path,pssrWaitWake,{relaxed});}
  function pssrWaitWake(){if(!busy){void pssrTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pssrTick(true);},400);}
  function pssrWaitHealthy(){const request=pssrRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();return Boolean(request&&live?.watchHealthy&&live.watching===`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`);}
  function pssrFastTick(){pssrWatchWait();if(pssrWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!pssrFastPollDue())return;void pssrTick(true);}
  // r75: the 15 s check of the visible Season Results screen reads the shared results from the server (see Transfer).
  // r84: the listener also watches while Season Results is open and not yet RESULTS_READY (not only after this manager publishes):
  // 15 s fresh reads here were ~32 billed reads/min for both phones over a 30-90 minute results wait.
  function pssrLiveScreen(){const active=pssrField("seasonEntry");return Boolean(view&&contextKey===pssrRequestContext()?.key&&view.state?.phase!=="RESULTS_READY"&&active&&!active.classList.contains("hidden"));}
  function pssrScreenFresh(request){if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)){const path=`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}
  async function pssrTick(light=false){if(!pssrSharedMarker()||root.document?.visibilityState==="hidden"||busy)return;const request=pssrRequestContext();if(!request)return;if(contextKey&&contextKey!==request.key){view=null;draft=null;contextKey="";renderedContextKey="";}if(view?.state?.phase==="RESULTS_READY"&&view.allResults?.playerOne&&view.allResults?.playerTwo)return;const active=pssrField("seasonEntry");if(view||active&&!active.classList.contains("hidden")){if(light!==true&&active&&!active.classList.contains("hidden"))pssrScreenFresh(request);try{await pssrRefresh(light===true);}catch(_error){}}}
  function pssrInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pssrCapture,true);root.document.addEventListener("input",pssrDraftChange,true);root.document.addEventListener("change",pssrDraftChange,true);}root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void pssrTick());if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())void pssrTick();},POLL_MS);root.setInterval(pssrFastTick,FAST_POLL_MS);}return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-results",productionEnabled:true,requiresCompletedSharedTransfer:true,privateUntilBothPublished:true,reusesSeasonEntry:true,interceptsLocalSeasonPersistence:true,authoritativeScoring:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pssrWaitingKey()),install:pssrInstall,open:pssrOpen,refresh:pssrRefresh,getState:()=>view,isActive:pssrSharedMarker,canRoute:pssrCanRoute});
});

```

## FILE: js/productionSharedSeasonCommit.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedSeasonCommit=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  // Job 33 (R1): read every 3 s for at most 3 minutes while waiting for the coordinator's commit or the rival's acknowledge.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  let fastWaitKey="",fastWaitSince=0;
  function psscReadTimeoutMs(){const value=Number(root.CMS_COMMIT_READ_TIMEOUT_MS);return Number.isFinite(value)&&value>=1000&&value<=25000?value:25000;}
  const ACTION_ID="sharedSeasonCommitAction";
  let installed=false,busy=false,provider=null,conflictGuard=null,setupApi=null,resultsApi=null,view=null,contextKey="",providerChain=Promise.resolve(),refreshPromise=null,refreshRequestKey="",headingObserver=null,bootstrapObserver=null,errorMessage="",pendingErrorKind="",readError="",readErrorKey="",readGeneration=0,heldReportKey="";

  function psscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function psscShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function psscSharedMarker(){const showdown=psscShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function psscField(id){return root.document&&root.document.getElementById(id);}
  function psscHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function psscDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
  function psscText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function psscReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function psscLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function psscEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
    else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await psscLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await psscLoadScript("ssjr-production-season-results","js/productionSharedSeasonResults.js",()=>root.CareerModeProductionSharedSeasonResults);
    await psscLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
    await psscLoadScript("ssjr-shared-setup-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup);
    await psscLoadScript("ssjr-season-results-protocol","js/sharedSeasonResults.js",()=>root.CareerModeSharedSeasonResults);
    await psscLoadScript("ssjr-season-commit-protocol","js/sharedSeasonCommit.js",()=>root.CareerModeSharedSeasonCommit);
    await psscLoadScript("ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js",()=>root.CareerModeSparkSharedSeasonCommit);
    await psscLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    await psscLoadScript("ssjr-production-journey-conflicts","js/productionSharedJourneyConflicts.js",()=>root.CareerModeProductionSharedJourneyConflicts);
    setupApi=root.CareerModeProductionSharedShowdownSetup;resultsApi=root.CareerModeProductionSharedSeasonResults;provider=root.CareerModeSparkSharedSeasonCommit;conflictGuard=root.CareerModeProductionSharedJourneyConflicts;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")psscFail("SEASON_COMMIT_SETUP_UNAVAILABLE");
    if(!resultsApi||typeof resultsApi.refresh!=="function"||typeof resultsApi.getState!=="function")psscFail("SEASON_COMMIT_RESULTS_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function"||typeof provider.commitSeason!=="function"||typeof provider.acknowledgeSeason!=="function")psscFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");
    if(!conflictGuard||typeof conflictGuard.execute!=="function")psscFail("JOURNEY_CONFLICT_GUARD_UNAVAILABLE");
  }
  function psscSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=psscShowdown()?.currentRound,season=Number(psscSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)psscFail("SEASON_COMMIT_SEASON_INVALID");return season;}
  function psscSetupState(){try{return (setupApi||root.CareerModeProductionSharedShowdownSetup)?.getState?.()||null;}catch(_error){return null;}}
  function psscResultsState(){try{return (resultsApi||root.CareerModeProductionSharedSeasonResults)?.getState?.()||null;}catch(_error){return null;}}
  function psscRequestContext(){const showdown=psscShowdown(),setup=psscSetupState(),rivalryId=String(showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"").trim();let seasonNumber;try{seasonNumber=psscSeason();}catch(_error){return null;}const saveId=String(showdown?.id||showdown?.saveId||"").trim(),key=rivalryId?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";return key?Object.freeze({key,rivalryId,seasonNumber}):null;}
  function psscContextMatches(request){const current=psscRequestContext();return Boolean(request&&current&&request.key===current.key);}
  function psscResultsPublished(request=psscRequestContext()){const results=psscResultsState();return Boolean(request&&results&&results.state?.phase==="RESULTS_READY"&&results.state?.revision===2&&Number(results.seasonNumber)===request.seasonNumber&&String(results.rivalryId||"")===request.rivalryId);}
  function psscResultsReady(request=psscRequestContext()){const results=psscResultsState();return Boolean(psscResultsPublished(request)&&results.allResults?.playerOne&&results.allResults?.playerTwo);}
  function psscResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The season request was rejected.");error.code=result&&result.code||"SEASON_COMMIT_PROVIDER_FAILED";throw error;}
  function psscWithTimeout(promise,ms,code){let timer=null;const timeout=new Promise((_,reject)=>{timer=root.setTimeout?.(()=>{const error=new Error("The Shared Season Commit check took too long. Check your connection and retry.");error.code=code;reject(error);},ms);});return Promise.race([promise,timeout]).finally(()=>{if(timer!==null)root.clearTimeout?.(timer);});}
  function psscQueue(task){const run=providerChain.then(task,task);providerChain=run.catch(()=>{});return run;}
  function psscRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")psscFail("SEASON_COMMIT_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `season_commit_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and the RESULTS_READY Season Results.
  async function psscProviderContext(request=psscRequestContext(),light=false){
    if(!psscSharedMarker())psscFail("SEASON_COMMIT_SHARED_MODE_REQUIRED");
    if(!request||!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
    await psscEnsureDependencies();
    if(!psscResultsPublished(request))psscFail("SEASON_COMMIT_RESULTS_NOT_READY","Both managers must publish their Season Results first.");
    if(!(light===true&&psscSetupState()?.ready===true&&psscResultsReady(request))){
      await setupApi.refresh();if(!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
      await resultsApi.refresh();if(!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
    }
    if(!psscResultsReady(request))psscFail("SEASON_COMMIT_RESULTS_NOT_READY","Both managers must publish their Season Results first.");
    const setup=psscSetupState();
    if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.managerRole||!setup.rivalryId||!setup.sessionId||!setup.deviceId)psscFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await root.CareerModeProductionFirebaseRuntime.ensureAccountServices());
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)psscFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    return Object.freeze({setup,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:Date.now()}});
  }
  function psscEnsureUi(){
    const panel=psscField("seasonReviewPanel"),actions=panel?.querySelector?.(".seasonReviewActions");if(!panel||!actions)return null;
    let status=psscField("sharedSeasonCommitStatus");if(!status){status=root.document.createElement("p");status.id="sharedSeasonCommitStatus";status.className="seasonReviewWarning sharedSeasonCommitStatus";actions.parentNode.insertBefore(status,actions);}
    let action=psscField(ACTION_ID);if(!action){action=root.document.createElement("button");action.id=ACTION_ID;action.className="menuButton";action.type="button";actions.prepend(action);}
    return {panel,actions,status,action};
  }
  function psscSetError(message=""){
    const node=psscField("seasonReviewError"),value=String(message||"");
    if(!value){if(node&&errorMessage&&node.textContent===errorMessage)node.textContent="";errorMessage="";return;}
    if(node){node.textContent=value;errorMessage=value;}
  }
  // r80 (Nik, 2026-10-19): the two managers play different FIFA saves, so both winning the league (same position), the
  // Champions League or the domestic cup in the same season is normal and is never a clash. Only a same-manager
  // impossibility (one save winning both the Champions League and the Europa League) may ever be listed here; none is yet.
  function psscSeasonResultClash(_results){
    const lines=[];
    return lines;
  }
  function psscClashWarning(who){
    const lines=psscSeasonResultClash(psscResultsState()?.allResults);
    return lines.length?` · CHECK RESULTS: ${lines.join(" ")} ${who} can still lock the season; scores use what was entered.`:"";
  }
  function psscManagerName(role){return psscShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let psscWatchedKey=null;
  function psscWatchSync(){let key="";try{key=psscWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===psscWatchedKey)return;psscWatchedKey=key;try{psscWatchWait();}catch(_error){}}
  function psscRender(){psscWatchSync();
    const ui=psscEnsureUi();if(!ui)return false;
    const request=psscRequestContext(),ready=Boolean(psscSharedMarker()&&request&&psscResultsPublished(request)),eligible=Boolean(ready&&psscResultsReady(request)&&contextKey===request.key&&view);
    psscHidden(ui.status,!ready);psscHidden(ui.action,!ready);if(!ready)return false;
    if(!eligible){
      psscText(ui.status,readError?`SEASON CHECK FAILED · ${readError} · YOUR RESULTS ARE SAVED`:'CHECKING THE SEASON · YOUR RESULTS ARE SAVED');
      psscText(ui.action,readError?'CHECK AGAIN':'CHECK SEASON');psscDisable(ui.action,busy||Boolean(refreshPromise));return false;
    }
    const role=view.managerRole,coordinator=view.coordinatorRole,phase=view.phase||"RESULTS_READY";
    if(phase==="ACKNOWLEDGED"){
      psscText(ui.status,"SEASON COMMITTED · SCORE BELOW");psscText(ui.action,"SEASON CONFIRMED ✓");psscDisable(ui.action,true);return true;
    }
    if(view.committed){
      if(view.ownAcknowledged){psscText(ui.status,"YOU CONFIRMED THIS SEASON · WAITING FOR YOUR RIVAL");psscText(ui.action,"CONFIRMED ✓ · WAITING FOR RIVAL");psscDisable(ui.action,true);}
      else{psscText(ui.status,"SEASON RESULT LOCKED · BOTH MANAGERS CONFIRM TO SCORE IT");psscText(ui.action,"CONFIRM SEASON");psscDisable(ui.action,busy);}
      return true;
    }
    if(role===coordinator){psscText(ui.status,`BOTH RESULTS ARE IN · LOCK THE SEASON${psscClashWarning("You")}`);psscText(ui.action,"LOCK & CONFIRM SEASON");psscDisable(ui.action,busy);}
    else{psscText(ui.status,`BOTH RESULTS ARE IN · WAITING FOR ${psscManagerName(coordinator)} TO LOCK THE SEASON${psscClashWarning(psscManagerName(coordinator))}`);psscText(ui.action,`WAITING FOR ${String(psscManagerName(coordinator)).toUpperCase()}`);psscDisable(ui.action,true);}
    return true;
  }
  // r87 shared reads meter: the season's ACKNOWLEDGED also tells the reads meter this phone's role and Firestore, so it writes this
  // phone's meter document once and reads the partner's (js/sparkPrivatePairing.js, fsbShareSeason). Season 1 is measured from
  // its Career Start (noteSeasonStart), never from the setup before it.
  function psscBind(result,ctx,request){if(!psscContextMatches(request))return false;const before=view&&contextKey===request.key?view.phase:null;view={...result,rivalryId:ctx.setup.rivalryId,coordinatorRole:result.coordinatorRole||ctx.setup.setup.coordinatorRole};contextKey=request.key;readError="";readErrorKey="";psscRender();if(before&&before!=="ACKNOWLEDGED"&&view.phase==="ACKNOWLEDGED")psscNudgeHistory();if(view.phase==="ACKNOWLEDGED"){try{root.CareerModeFirestoreBudget?.noteSeasonDone?.(`${view.rivalryId}|${request.seasonNumber}`,Boolean(before&&before!=="ACKNOWLEDGED"),{role:ctx.setup.managerRole,season:request.seasonNumber,rivalryId:view.rivalryId,firestore:ctx.options?.firestore||null});}catch(_error){}}return true;}
  // r75: the moment this page sees the season commit become ACKNOWLEDGED, Canonical Scoring and then Shared History check
  // once, in that order (History needs the reconciled score), instead of each waiting for its next 3 s check: nothing else
  // announces the commit change to them. The next season, the history screens and Final Winner follow from History's event.
  function psscNudgeHistory(){if(typeof root.setTimeout!=="function"||root.document?.visibilityState==="hidden")return;root.setTimeout(()=>{void (async()=>{
    const scoring=root.CareerModeProductionSharedCanonicalScoring,history=root.CareerModeProductionSharedHistoryConvergence;
    try{if(scoring&&typeof scoring.refresh==="function"){let state=await scoring.refresh(true);if(state?.phase!=="SCORING_RECONCILED")state=await scoring.refresh(true);}}catch(_error){}
    try{if(history&&typeof history.refresh==="function"){const state=await history.refresh(true);if(state?.phase!=="HISTORY_CONVERGED")await history.refresh(true);}}catch(_error){}
  })();},0);}
  async function psscRefreshNow(request=psscRequestContext(),generation=0,light=false){
    if(!request)return null;
    if(contextKey&&contextKey!==request.key){psscSetError("");pendingErrorKind="";}
    const ctx=await psscProviderContext(request,light);if(!psscContextMatches(request))return null;const result=psscResultError(await provider.read(ctx.options),"The season could not be checked.");if(!psscContextMatches(request))return null;
    if(generation&&generation!==readGeneration)return null;
    if(pendingErrorKind&&psscSatisfied(pendingErrorKind,result)){psscSetError("");pendingErrorKind="";}
    psscBind(result,ctx,request);return view;
  }
  function psscRefresh(light=false){
    const request=psscRequestContext();if(!request)return Promise.resolve(null);
    // Job 33: an ACKNOWLEDGED commit is immutable (Rules cap it at revision 3), so later callers reuse it instead of re-reading it.
    if(view&&contextKey===request.key&&view.phase==="ACKNOWLEDGED"&&!refreshPromise)return Promise.resolve(view);
    if(refreshPromise&&refreshRequestKey===request.key)return refreshPromise;
    if(contextKey!==request.key){view=null;contextKey="";if(readErrorKey!==request.key){readError="";readErrorKey="";}}
    refreshRequestKey=request.key;
    const generation=++readGeneration;
    const current=psscQueue(()=>psscWithTimeout(psscRefreshNow(request,generation,light===true),psscReadTimeoutMs(),"SEASON_COMMIT_CHECK_TIMEOUT"));refreshPromise=current;psscRender();
    // Job 33: the check failure shows at once (CHECK AGAIN), but it is reported only when the same failure repeats on the
    // next poll, like Shared History and Multi Season; a single aborted read under contention is not an application error.
    current.then(()=>{heldReportKey="";if(refreshPromise===current){refreshPromise=null;psscRender();}},error=>{
      if(error?.code==="SEASON_COMMIT_CHECK_TIMEOUT"&&readGeneration===generation)readGeneration+=1;
      // Job 33: a failed fast (3 s) read keeps the current view and is retried by the next poll; the 15 s poll still reports a real failure.
      if(light===true&&refreshPromise===current&&view&&contextKey===request.key){refreshPromise=null;psscRender();return;}
      if(refreshPromise===current){refreshPromise=null;if(psscContextMatches(request)&&psscResultsPublished(request)&&!/_CONTEXT_STALE$/.test(String(error?.code||""))){const previous=readErrorKey===request.key?readError:"";view=null;contextKey="";readErrorKey=request.key;readError=String(error?.code||"SEASON_COMMIT_CHECK_FAILED").replace(/[^A-Za-z0-9_-]/g,"").slice(0,80);psscRender();const reportKey=request.key+"|"+readError;if(readError!==previous)heldReportKey=reportKey;else if(heldReportKey===reportKey){heldReportKey="";psscReport("Unable to check Shared Season Commit",error);}}}
    });
    return current;
  }
  function psscSatisfied(kind,current){if(kind==="commit")return Boolean(current.committed);return Boolean(current.ownAcknowledged||current.phase==="ACKNOWLEDGED");}
  async function psscWrite(kind,ctx,request,current){
    const operationId=psscRandomOperationId(),method=kind==="commit"?"commitSeason":"acknowledgeSeason";
    if(kind==="commit"&&current.managerRole!==current.coordinatorRole)psscFail("SEASON_COMMIT_COORDINATOR_REQUIRED",`Only ${psscManagerName(current.coordinatorRole)} can lock the season.`);
    for(let attempt=0;attempt<2;attempt+=1){
      const baseRevision=Number(current.revision||0);
      const providerRequest={...ctx.options,operationId,baseRevision};
      const result=await conflictGuard.execute({surface:"season-commit",action:kind==="commit"?"commit-season":"acknowledge-season",operationId,baseRevision,authority:{accountId:ctx.options.user.uid,deviceId:ctx.setup.deviceId,rivalryId:ctx.setup.rivalryId,sessionId:ctx.setup.sessionId,managerRole:ctx.setup.managerRole},intent:{seasonNumber:request.seasonNumber}},()=>provider[method](providerRequest));
      if(result&&result.ok===true)return true;
      if(result?.code==="SEASON_COMMIT_STALE_BASE_REVISION"&&attempt===0){current=psscResultError(await provider.read(ctx.options));if(psscSatisfied(kind,current))return true;continue;}
      psscResultError(result,kind==="commit"?"The season could not be locked.":"Your season confirmation could not be saved.");
    }
    return false;
  }
  async function psscMutate(kind){
    if(busy)return false;const request=psscRequestContext();if(!request)return false;busy=true;readGeneration+=1;psscSetError("");pendingErrorKind="";psscRender();
    let stage=kind;
    try{
      return await psscQueue(async()=>{
        const ctx=await psscProviderContext(request);if(!psscContextMatches(request))return false;let current=psscResultError(await provider.read(ctx.options));
        if(!psscContextMatches(request))return false;
        if(!psscSatisfied(kind,current)){if(!await psscWrite(kind,ctx,request,current))return false;if(kind==="commit")stage="acknowledge";current=psscResultError(await provider.read(ctx.options));if(!psscContextMatches(request))return false;}
        psscBind(current,ctx,request);
        // One tap for the coordinator: COMMIT & ACKNOWLEDGE records his own acknowledgement right after the commit (each write keeps its own operationId and stale retry).
        // If this second half fails, the committed view shows the existing CONFIRM SEASON button (only this R7 case re-reads
        // at once; a manager's own ACKNOWLEDGE failure keeps its error until the next read, exactly as before).
        if(kind!=="commit"||current.managerRole!==current.coordinatorRole||psscSatisfied("acknowledge",current))return true;
        stage="acknowledge";
        if(!await psscWrite("acknowledge",ctx,request,current))return false;
        try{await psscRefreshNow(request);}catch(_error){psscRefresh().catch(()=>{});}return true;
      });
    }catch(error){if(psscContextMatches(request)){pendingErrorKind=stage;if(stage==="acknowledge"&&view&&contextKey===request.key&&!view.committed)view={...view,committed:true};psscSetError(error.message||error.code||"Shared Season Commit failed.");psscReport("Unable to update Shared Season Commit",error);if(kind==="commit"&&stage==="acknowledge")void psscRefresh().catch(()=>{});}return false;}
    finally{busy=false;if(psscContextMatches(request))psscRender();}
  }
  function psscCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||target.id!==ACTION_ID||!psscSharedMarker())return;const screen=psscField("seasonEntry");if(!screen||screen.classList.contains("hidden"))return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.disabled)return;const request=psscRequestContext();if(!request||contextKey!==request.key||!view||!psscResultsReady(request)){void psscRefresh().catch(()=>{});return;}void psscMutate(view.committed?"acknowledge":"commit");}
  // All three waiting screens share the same season authority; navigation does not end the partner wait.
  function psscWaitScreen(){return ["seasonEntry","mainMenu","standings"].some(id=>{const node=psscField(id);return node&&!node.classList.contains("hidden");});}
  // A Results/Commit listener alone cannot cover Setup, session, later commits or terminal authority.
  // These listeners live only for the wait, share its existing health/fallback cadence, and never poll.
  // A hidden page stops them (keep=true) and the same wait attaches them again when it returns (psscWaitReturn); their first
  // server delivery is the new baseline and answers the return check's reads of the same documents (one read each).
  // An ACKNOWLEDGED revision-3 commit can never change again (Rules), so the next attach leaves it out.
  let waitContext=null,waitReturn=null;const waitSettled=new Set();
  function psscDropWaitContext(keep=false){const held=waitContext,budget=root.CareerModeFirestoreBudget;waitContext=null;if(keep===true&&held&&!held.failed)waitReturn={key:held.key,watching:held.watching};else if(keep!==true||held){waitReturn=null;budget?.returnListen?.([]);}if(!held)return;for(const stop of held.stops.values())try{stop();}catch(_error){}held.stops.clear();budget?.listened?.();}
  function psscWaitReturn(){const back=waitReturn,request=psscRequestContext();waitReturn=null;if(back&&request&&psscWaitScreen()&&!root.CareerModeFirestoreBudget?.paused?.())psscWaitContext(request,back.watching,back.key);else root.CareerModeFirestoreBudget?.returnListen?.([]);}
  function psscContextWake(){try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-wait-context-change"));}catch(_error){}}
  function psscWaitContext(request,watching,returnKey){
    const setup=psscSetupState(),runtime=root.CareerModeProductionFirebaseRuntime,budget=root.CareerModeFirestoreBudget;
    const key=`${request.rivalryId}|${setup?.accountId}|${setup?.deviceId}|${setup?.sessionId}`;
    if(returnKey!==undefined&&returnKey!==key){budget?.returnListen?.([]);return false;}
    if(waitContext?.key===key){
      const held=waitContext;
      if(held.failed&&Date.now()>=held.retryAt)psscDropWaitContext();
      else if(watching!==held.watching){
        // One listener per document: the wait listener now watches this one, so its authority listener stops. A document
        // the wait listener stops watching gets its authority listener back (rebuild).
        const old=held.watching;held.watching=watching;
        if(held.paths?.includes(old)&&!waitSettled.has(old))psscDropWaitContext();
        else{const stop=held.stops.get(watching);held.stops.delete(watching);if(stop)try{stop();}catch(_error){}if(held.pending?.delete(watching))held.ready=!held.failed&&held.pending.size===0;return held.ready&&!held.failed;}
      }else return held.ready&&!held.failed;
    }
    if(waitContext)psscDropWaitContext();
    const held={key,watching,stops:new Map(),ready:false,failed:false,retryAt:0,returnUntil:returnKey===undefined?0:Date.now()+10000};waitContext=held;
    const fail=error=>{if(waitContext!==held)return;held.failed=true;held.ready=false;held.retryAt=Date.now()+60000;for(const stop of held.stops.values())try{stop();}catch(_error){}held.stops.clear();/* r86 red team #19: the context listeners take the rivalry and Session back while these wait to retry. */budget?.returnListen?.([]);budget?.listened?.();budget?.noteError?.(error);};
    Promise.resolve().then(async()=>{
      const services=await runtime?.ensureAccountServices?.();if(waitContext!==held)return;
      if(!services?.ok||!setup?.sessionId||services.auth?.currentUser?.uid!==setup.accountId)throw new Error("Waiting context is unresolved.");
      let sdk=services.firestoreSdk;
      if(typeof sdk?.onSnapshot!=="function"){
        const url=runtime?.firebaseFirestoreModule;
        if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url))throw new Error("Waiting listener SDK is unavailable.");
        sdk=await import(url);
      }
      // r85: every delivery of these listeners is counted once by the budget layer's read meter.
      sdk=(budget?.meterSdk||(s=>s))(sdk);
      if(waitContext!==held)return;
      const base=`rivalries/${request.rivalryId}`,paths=[base,`${base}/sharedSetup/authoritative`,`${base}/sessions/${setup.sessionId}`];
      const total=Number(setup.setup?.totalSeasons);
      if([1,3,5,10].includes(total))for(let n=1;n<=total;n++)paths.push(`${base}/seasonCommits/season_${n}`);
      held.paths=paths;
      const pending=held.pending=new Set(paths.filter(path=>path!==held.watching&&!waitSettled.has(path)));let queued=false,sessionChanged=false,dirty=false,notified=false;
      budget?.returnListen?.([...pending]);
      const wake=(changed=false)=>{dirty=dirty||changed;if(queued)return;queued=true;Promise.resolve().then(async()=>{queued=false;if(waitContext!==held||held.failed)return;if(dirty){dirty=false;root.CareerModeFirestoreBudget?.forgetContext?.();}if(sessionChanged){sessionChanged=false;try{await root.CareerModeSparkRemoteJoining?.refreshSession?.();}catch(_error){}}if(waitContext===held&&!held.failed)psscContextWake();});};
      for(const path of pending){
        let serial;
        const stop=sdk.onSnapshot(sdk.doc(services.firestore,path),{includeMetadataChanges:true},snapshot=>{
          if(waitContext!==held||held.failed)return;
          /* r86 red team #18: a cached copy (the SDK delivers one first on a return) no longer hands the waiting reads back to the server: they wait for this listener's server copy (the budget layer gives up after 5 s). */if(snapshot.metadata?.fromCache||snapshot.metadata?.hasPendingWrites){held.ready=false;pending.add(path);return;}
          const value=snapshot.exists()?snapshot.data():null,next=JSON.stringify(value),changed=serial!==undefined&&serial!==next;
          if(serial===undefined)budget?.listened?.(path,snapshot);
          if(/\/seasonCommits\/season_\d+$/.test(path)&&value?.phase==="ACKNOWLEDGED"&&value.revision===3)waitSettled.add(path);/* r86: a confirmed Setup (revision 6) never changes again either, and the budget layer keeps it. */if(/\/sharedSetup\/authoritative$/.test(path)&&value?.revision===6&&value?.phase==="SHOWDOWN_CONFIRMED")waitSettled.add(path);
          if(serial!==undefined&&changed&&(path===base||path===`${base}/sessions/${setup.sessionId}`))sessionChanged=true;
          serial=next;pending.delete(path);held.ready=pending.size===0;
          if(changed)wake(true);
          if(held.ready&&!notified){notified=true;wake();}
        },fail);
        if(held.failed)stop();else held.stops.set(path,stop);
      }
      held.ready=pending.size===0;
    }).catch(fail);
    return false;
  }
  function psscWaitHealthy(){const request=psscRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();const healthy=Boolean(request&&root.document?.visibilityState!=="hidden"&&!root.CareerModeFirestoreBudget?.paused?.()&&live?.watchHealthy&&["seasonResults","seasonCommits"].some(collection=>live.watching===`rivalries/${request.rivalryId}/${collection}/season_${request.seasonNumber}`));if(!healthy){const hidden=root.document?.visibilityState==="hidden";if(!(request&&!hidden&&!root.CareerModeFirestoreBudget?.paused?.()&&waitContext?.returnUntil>Date.now()))psscDropWaitContext(hidden);return false;}return ![root.CareerModeProductionSharedMultiSeasonProgression,root.CareerModeProductionSharedFinalReconciliation,root.CareerModeProductionSharedJourneyReconnect,root.CareerModeProductionSharedTerminalClose].some(api=>api?.productionEnabled===true)||psscWaitContext(request,live.watching);}

  function psscWaitingKey(){
    const screen=psscField("seasonEntry"),request=psscRequestContext();if(!psscWaitScreen()||!view||!request||contextKey!==request.key||!psscResultsReady(request))return "";
    if(!view.committed&&view.managerRole!==view.coordinatorRole)return `${contextKey}|commit`;
    if(view.committed&&view.ownAcknowledged&&view.phase!=="ACKNOWLEDGED")return `${contextKey}|acknowledge`;
    return "";
  }
  function psscFastPollDue(){const key=psscWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // timer checks stop while that listener is healthy; deliveries still wake the provider immediately.
  function psscWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(psscWaitScreen()&&psscResultsReady()&&view?.phase!=="ACKNOWLEDGED"?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`:null)(psscRequestContext()):null);}catch(_error){path=null;}return budget.watchWaitPoint("season-commit",path,psscWaitWake);}
  function psscWaitWake(){const inflight=refreshPromise;if(inflight){const again=()=>{if(!busy)void psscTick(true);};inflight.then(again,again);return;}if(!busy){void psscTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void psscTick(true);},400);}
  function psscFastTick(){psscWatchWait();if(psscWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!psscFastPollDue())return;void psscTick(true);}
  // r75: the 15 s check of the visible Season Commit screen reads the shared commit from the server (see Transfer).
  // r84: no commit exists before both results are published, so the fresh read starts then (before, it ran every check of the
  // results wait: ~37 billed reads/min for both phones); a healthy listener on the commit replaces it.
  function psscScreenFresh(){try{const request=psscRequestContext();if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)&&psscResultsReady(request)){const path=`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}catch(_error){}}
  async function psscTick(light=false){if(!psscSharedMarker()||busy||root.document?.visibilityState==="hidden")return;const screen=psscField("seasonEntry");if(!psscWaitScreen())return;psscRender();if(view?.phase==="ACKNOWLEDGED"&&contextKey===psscRequestContext()?.key)return;if(light!==true)psscScreenFresh();try{await psscRefresh(light===true);}catch(_error){}}
  function psscAttachHeadingObserver(){
    if(!root.MutationObserver||!root.document)return false;const heading=psscField("seasonReviewHeading");if(!heading)return false;if(headingObserver)return true;
    headingObserver=new root.MutationObserver(()=>void psscTick());headingObserver.observe(heading,{childList:true,characterData:true,subtree:true});return true;
  }
  function psscInstallObservers(){if(psscAttachHeadingObserver()||!root.MutationObserver||!root.document?.documentElement)return;bootstrapObserver=new root.MutationObserver(()=>{if(psscAttachHeadingObserver()){bootstrapObserver.disconnect();bootstrapObserver=null;}});bootstrapObserver.observe(root.document.documentElement,{childList:true,subtree:true});}
  function psscInstall(){if(installed)return true;installed=true;for(const event of ["career-mode-connected-account-state-change","career-mode-firestore-quota"])root.addEventListener?.(event,()=>psscDropWaitContext());root.addEventListener?.("career-mode-shared-wait-context-change",()=>void psscTick());root.document?.addEventListener?.("visibilitychange",()=>{if(root.document.visibilityState==="hidden")psscDropWaitContext(true);else psscWaitReturn();});if(root.document)root.document.addEventListener("click",psscCapture,true);psscInstallObservers();root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void psscTick());if(typeof root.setInterval==="function"){root.setInterval(()=>{if(!psscWaitHealthy())void psscTick();},POLL_MS);root.setInterval(psscFastTick,FAST_POLL_MS);}if(typeof root.setTimeout==="function")root.setTimeout(()=>void psscTick(),0);return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-commit",productionEnabled:true,runtimeRevision:"1.9.1-r10",requiresResultsReady:true,requiresCoordinatorCommit:true,requiresBothAcknowledgements:true,coordinatorCommitAlsoAcknowledges:true,reusesSeasonReview:true,distinctFromLocalConfirm:true,boundedStaleRetry:true,canonicalStorageMutation:false,authoritativeScoring:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,waitingListenerHealthy:psscWaitHealthy,isWaitingForRival:()=>Boolean(psscWaitingKey()),install:psscInstall,refresh:psscRefresh,seasonResultClash:psscSeasonResultClash,getState:()=>view,isActive:psscSharedMarker});
});

```

## FILE: js/settings.js
```js
/* =====================================================
   Career Mode Showdown v1.2.1
   Lightweight application Settings
===================================================== */

let settingsOverlay = null;

// r78 (HO-029): the shared marble confirm box (js/showdownConfirm.js, loaded on first use) replaces the native confirm().
// It resolves true only for OK; Cancel, Esc or a box that cannot load resolve false (undefined when no loader exists).
function settingsAskConfirm(message,tone){return typeof window.askShowdownConfirm==="function"?window.askShowdownConfirm(message,{tone}):typeof window.loadRuntimeScript==="function"?window.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof window.askShowdownConfirm==="function").then(()=>window.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}

let settingsDialog = null;
let settingsContent = null;
let settingsPreviousFocus = null;
let settingsPreferenceListenerBound = false;
let settingsOfflineListenerBound = false;
let settingsOfflineGuidance = "";
let settingsUpdatePending = false;

function getSettingsAssetRevision(){
    const meta = document.querySelector('meta[name="app-asset-revision"]');
    return meta && meta.content ? meta.content.trim() : "Unknown build";
}

function getSettingsApplicationVersion(){
    return typeof APP_VERSION === "string" ? APP_VERSION : "1.2.1";
}

function getSettingsActiveShowdown(){
    if(typeof currentShowdown !== "undefined" && currentShowdown){
        return currentShowdown;
    }
    return typeof loadSavedShowdown === "function" ? loadSavedShowdown() : null;
}

function getSettingsLegacyHistory(){
    if(typeof loadLegacyShowdowns !== "function"){
        return [];
    }
    try{
        return loadLegacyShowdowns();
    }catch(error){
        return [];
    }
}

/* CE2PG (r80): online, the local save outlives its Showdown (it still reads "Created" after the Final Winner, or after the
   other phone ended it) and the local history list is never written. Home's LIVE tile reads the pair state, so Settings
   reads it too: CURRENT SHOWDOWN and END SHOWDOWN only while the pair holds a live (active or waiting) Showdown. With no
   pair state yet (module not loaded or not initialized) the local save decides, as before. */
function getSettingsPairState(){
    try{
        const pair = window.CareerModePersistentNikDanielPair;
        const pairState = pair && typeof pair.getState === "function" ? pair.getState() : null;
        // Codex #935: a transient "unavailable" (or idle/signed-out) pair state is unknown, as in js/whichShowdownIsLive.js, so
        // the local save decides; only an authoritative pair state can hide the current Showdown and its END SHOWDOWN.
        return pairState && pairState.initialized === true && !["idle", "unavailable", "signed-out"].includes(pairState.status) ? pairState : null;
    }catch(_error){
        return null;
    }
}

function getSettingsLiveShowdown(){
    const active = getSettingsActiveShowdown();
    if(!active){ return null; }
    const pairState = getSettingsPairState();
    if(!pairState){ return { showdown: active, status: active.status || "Saved" }; }
    if(!pairState.rivalryId){ return null; }
    if(pairState.connectionState === "active"){ return { showdown: active, status: "Live" }; }
    if(pairState.connectionState === "pending-pair"){ return { showdown: active, status: "Waiting to join" }; }
    return null;
}

/* CE2PG (r80): online, HISTORY counts the completed Showdowns of the shared career model that History, Career Statistics
   and Trophy Room show (the same exact gets Career Statistics makes when it opens, once per Settings open). The local list
   is still used when this browser is not a registered Daniel or Nik. */
function isSettingsOnlineCareer(){
    try{
        const identity = window.CareerModeOnlinePlayerIdentity && typeof window.CareerModeOnlinePlayerIdentity.getState === "function"
            ? window.CareerModeOnlinePlayerIdentity.getState()
            : null;
        return Boolean(identity && identity.registered === true && (identity.managerId === "daniel" || identity.managerId === "nik"));
    }catch(_error){
        return false;
    }
}

function settingsCompletedCountText(count){
    return `${count} completed showdown${count === 1 ? "" : "s"}`;
}

function getSettingsOnlineHistoryText(){
    try{
        const legacy = window.CareerModeRivalryLegacyV10;
        const model = legacy && typeof legacy.cachedCareerModel === "function" ? legacy.cachedCareerModel() : null;
        if(model && ["ready", "partial", "empty"].includes(model.status)){
            const showdowns = model.history && Array.isArray(model.history.showdowns) ? model.history.showdowns : [];
            const completed = showdowns.filter(row => row && row.status === "completed").length;
            // Codex #935: a partial career could not read every indexed Showdown, so its count is a floor, not the total.
            return model.status === "partial" ? `At least ${settingsCompletedCountText(completed)}` : settingsCompletedCountText(completed);
        }
        return settingsHistoryLoad ? "Loading…" : "Unavailable right now";
    }catch(_error){
        return "Unavailable right now";
    }
}

let settingsHistoryLoad = null;
function refreshSettingsOnlineHistory(){
    if(settingsHistoryLoad || typeof window.loadRuntimeScript !== "function"){ return; }
    const load = settingsHistoryLoad = Promise.resolve().then(async () => {
        if(!window.CareerModeRivalryLegacyV10){
            await window.loadRuntimeScript("rivalry-legacy-v10", "js/rivalryLegacyV10.js", () => Boolean(window.CareerModeRivalryLegacyV10));
        }
        await window.CareerModeRivalryLegacyV10.loadCareerModel();
    }).catch(() => {}).then(() => {
        if(settingsHistoryLoad === load){ settingsHistoryLoad = null; }
        const value = settingsContent ? settingsContent.querySelector(".settingsHistoryCount") : null;
        if(value){ value.textContent = getSettingsOnlineHistoryText(); }
    });
}

function createSettingsElement(tagName, className = "", text = ""){
    const element = document.createElement(tagName);
    if(className){ element.className = className; }
    if(text !== ""){ element.textContent = text; }
    return element;
}

function createSettingsInfoRow(label, value, valueClass = ""){
    const row = createSettingsElement("div", "settingsInfoRow");
    const labelElement = createSettingsElement("span", "", label);
    const valueElement = createSettingsElement("strong", valueClass, value);
    row.append(labelElement, valueElement);
    return row;
}

function createSettingsPanel(eyebrow, title, description){
    const panel = createSettingsElement("section", "settingsPanel");
    const heading = createSettingsElement("div", "settingsPanelHeading");
    heading.append(
        createSettingsElement("span", "settingsPanelEyebrow", eyebrow),
        createSettingsElement("h3", "", title)
    );
    if(description){
        heading.appendChild(createSettingsElement("p", "", description));
    }
    panel.appendChild(heading);
    return panel;
}

function getSettingsMotionState(){
    if(typeof window.getApplicationMotionPreferenceState === "function"){
        return window.getApplicationMotionPreferenceState();
    }
    const systemReduced = typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return {
        motionPreference: "follow",
        reducedMotionOverride: false,
        systemReduced,
        effectiveReduced: systemReduced
    };
}

function focusSettingsControl(selector){
    window.requestAnimationFrame(() => {
        if(!settingsOverlay || settingsOverlay.classList.contains("hidden") || !settingsContent){
            return;
        }
        const selected = settingsContent.querySelector(selector);
        if(selected){
            selected.focus({ preventScroll: true });
        }
    });
}

function focusSelectedSettingsMotionChoice(){
    focusSettingsControl(".settingsMotionChoice.selected");
}

function setSettingsMotionPreference(choice){
    if(typeof window.setApplicationMotionPreference !== "function"){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Motion preferences are unavailable right now.", "error");
        }
        return;
    }

    if(!window.setApplicationMotionPreference(choice)){
        return;
    }

    if(typeof window.showAppNotice === "function"){
        window.showAppNotice(
            choice === "reduce" ? "Reduced motion is enabled."
                : choice === "full" ? "Full motion is enabled."
                : "Motion now follows your device preference.",
            "success",
            3000
        );
    }
}

function setSettingsMenuFeedbackPreference(enabled){
    if(typeof window.setApplicationMenuFeedbackPreference !== "function"){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Menu feedback preferences are unavailable right now.", "error");
        }
        return;
    }

    if(!window.setApplicationMenuFeedbackPreference(Boolean(enabled))){
        return;
    }

    if(typeof window.showAppNotice === "function"){
        window.showAppNotice(
            enabled ? "Menu click feedback is enabled." : "Menu click feedback is muted.",
            "success",
            3000
        );
    }
}

function handleMotionChoiceKeydown(event){
    if(!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)){
        return;
    }

    const group = event.currentTarget.closest("[role='radiogroup']");
    if(!group){ return; }
    const choices = Array.from(group.querySelectorAll(".settingsMotionChoice"));
    if(!choices.length){ return; }

    event.preventDefault();
    const currentIndex = Math.max(0, choices.indexOf(event.currentTarget));
    let nextIndex = currentIndex;
    if(event.key === "Home"){
        nextIndex = 0;
    }else if(event.key === "End"){
        nextIndex = choices.length - 1;
    }else{
        const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
        nextIndex = (currentIndex + direction + choices.length) % choices.length;
    }

    choices[nextIndex].click();
}

function createMotionChoice(label, description, selected, choice){
    const button = createSettingsElement("button", "settingsMotionChoice");
    button.type = "button";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", selected ? "true" : "false");
    button.tabIndex = selected ? 0 : -1;
    button.dataset.motionChoice = choice;
    button.dataset.motionReduced = choice === "reduce" ? "true" : "false";
    button.classList.toggle("selected", selected);

    const marker = createSettingsElement("span", "settingsMotionMarker");
    marker.setAttribute("aria-hidden", "true");
    const copy = createSettingsElement("span", "settingsMotionCopy");
    copy.append(
        createSettingsElement("strong", "", label),
        createSettingsElement("small", "", description)
    );
    button.append(marker, copy);
    button.addEventListener("click", () => setSettingsMotionPreference(choice));
    button.addEventListener("keydown", handleMotionChoiceKeydown);
    return button;
}

function createMenuFeedbackControl(){
    const enabled = typeof window.isMenuFeedbackEnabled === "function"
        ? window.isMenuFeedbackEnabled()
        : true;
    const row = createSettingsElement("div", "settingsAudioRow");
    const copy = createSettingsElement("div", "settingsAudioCopy");
    copy.append(
        createSettingsElement("strong", "", "MENU CLICK FEEDBACK"),
        createSettingsElement(
            "small",
            "",
            "A short click on menu taps. Silent while Home music plays."
        )
    );

    const toggle = createSettingsElement("button", `settingsAudioToggle ${enabled ? "enabled" : "muted"}`);
    toggle.type = "button";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-checked", String(enabled));
    toggle.setAttribute("aria-label", `Menu click feedback ${enabled ? "on" : "off"}`);
    toggle.append(
        createSettingsElement("span", "settingsAudioToggleTrack"),
        createSettingsElement("strong", "", enabled ? "ON" : "OFF")
    );
    toggle.addEventListener("click", () => setSettingsMenuFeedbackPreference(!enabled));
    row.append(copy, toggle);
    return row;
}

// r86: today's free Firebase reads as Google bills them (documents plus the security-check lookups, priced per document).
// r87 shared reads meter: once both phones have confirmed a season today, the total is the two phones' own meters added up, the same
// number on both phones ("both phones after season N"), with this phone's part ("here"), the partner's and what this phone has
// read since. Before that (or with a partner phone on an older build) it is an estimate from this phone's reads and its role's share
// of a season, marked "estimated". Resets at 3 am Boston.
function getSettingsRoundedReads(value){
    return (Math.round(value / 10) * 10).toLocaleString("en-US");
}
function getSettingsReadsTodayText(){
    try{
        const today = window.CareerModeFirestoreBudget?.readsToday?.();
        if(!today || !Number.isFinite(today.billedEstimate)){ return ""; }
        const limit = today.freeReadsPerDay.toLocaleString("en-US");
        const shared = today.shared;
        if(shared && Number.isFinite(shared.used)){
            const since = shared.sinceThisPhone >= 5 ? ` · +${getSettingsRoundedReads(shared.sinceThisPhone)} here since` : "";
            return `${getSettingsRoundedReads(shared.used)} of ${limit} · both phones after season ${shared.season} · ${getSettingsRoundedReads(shared.thisPhone)} here · partner ${getSettingsRoundedReads(shared.partner)}${since}`;
        }
        const total = `About ${getSettingsRoundedReads(today.billedEstimate)} of ${limit} · estimated for both phones`;
        if(!Number.isFinite(today.thisPhone)){ return total; }
        return `${total} · ${getSettingsRoundedReads(today.thisPhone)} here`;
    }catch(_error){
        return "";
    }
}

// r84: how many more seasons today's free reads allow at the pace played. r87: from both phones' meters (the same on both
// phones), or estimated from this phone's own season costs and its role's share.
function getSettingsSeasonsLeftText(){
    try{
        const left = window.CareerModeFirestoreBudget?.seasonsLeftToday?.();
        if(!left || !Number.isFinite(left.seasons)){ return ""; }
        const count = `${left.seasons} ${left.seasons === 1 ? "season" : "seasons"}`;
        const cost = Number.isFinite(left.billedPerSeason) ? ` · ${getSettingsRoundedReads(left.billedPerSeason)} per season` : "";
        if(left.basis === "shared"){ return `About ${count}${cost}, both phones`; }
        if(left.basis === "today"){ return `About ${count}${cost} · estimated at today's pace`; }
        return `About ${count} · estimate until a season is played today`;
    }catch(_error){
        return "";
    }
}

function createApplicationPanel(){
    const panel = createSettingsPanel(
        "APPLICATION",
        "CAREER MODE SHOWDOWN",
        "Daniel and Nik's FIFA 17 Career Mode companion for two managers."
    );
    const info = createSettingsElement("div", "settingsInfoGrid");
    info.append(
        createSettingsInfoRow("APPLICATION VERSION", `v${getSettingsApplicationVersion()}`),
        createSettingsInfoRow("BUILD", getSettingsAssetRevision()),
        createSettingsInfoRow("CAREER DATA", "Automatic Showdown storage"),
        createSettingsInfoRow("PLAY MODE", "Daniel vs Nik · two devices")
    );
    const readsToday = getSettingsReadsTodayText();
    if(readsToday){ info.appendChild(createSettingsInfoRow("FREE ONLINE USE TODAY", readsToday)); }
    const seasonsLeft = getSettingsSeasonsLeftText();
    if(seasonsLeft){ info.appendChild(createSettingsInfoRow("SEASONS LEFT TODAY", seasonsLeft)); }
    panel.appendChild(info);
    const updateState = getSettingsOfflineState();
    const update = createSettingsElement("button", "menuButton settingsApplicationUpdateButton", updateState.updateActionLabel || "UPDATE TO LATEST VERSION");
    update.type = "button";
    update.disabled = settingsUpdatePending || Boolean(updateState.updateActionDisabled);
    update.addEventListener("click", handleSettingsOfflineUpdate);
    const status = createSettingsElement("p", "settingsOfflineNote settingsApplicationUpdateStatus", settingsOfflineGuidance || "Updating keeps your Showdown and player.");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    panel.append(update, status);
    return panel;
}

function createMotionPanel(){
    const state = getSettingsMotionState();
    const panel = createSettingsPanel(
        "ACCESSIBILITY",
        "MOTION & FEEDBACK",
        "Follow your device, cut motion, or turn the menu click on or off."
    );

    const summary = createSettingsElement("div", "settingsMotionSummary");
    const effective = createSettingsElement(
        "strong",
        `settingsStatus ${state.effectiveReduced ? "reduced" : "standard"}`,
        state.effectiveReduced ? "REDUCED" : "STANDARD"
    );
    summary.append(
        createSettingsInfoRow("DEVICE PREFERENCE", state.systemReduced ? "Reduced motion" : "Standard motion"),
        createSettingsInfoRow("EFFECTIVE APP MOTION", state.effectiveReduced ? "Reduced motion" : "Standard motion")
    );
    summary.prepend(effective);

    const choices = createSettingsElement("div", "settingsMotionChoices");
    choices.setAttribute("role", "radiogroup");
    choices.setAttribute("aria-label", "Application motion preference");
    choices.append(
        createMotionChoice(
            "FOLLOW DEVICE",
            "Match your device's accessibility setting.",
            state.motionPreference === "follow",
            "follow"
        ),
        createMotionChoice(
            "FULL MOTION",
            "Always play transitions and reveals.",
            state.motionPreference === "full",
            "full"
        ),
        createMotionChoice(
            "REDUCE MOTION",
            "Cut menu transitions, the wheel delay and club reveal effects.",
            state.motionPreference === "reduce",
            "reduce"
        )
    );

    panel.append(summary, choices, createMenuFeedbackControl());
    return panel;
}

function getSettingsOfflineState(){
    if(typeof window.getOfflineAppSettingsState === "function"){
        return window.getOfflineAppSettingsState();
    }
    return {
        supported:false,
        standalone:false,
        connectivity:"online",
        connectivityVerified:false,
        connectivityLabel:"Checking",
        offlineReady:false,
        offlineRecoveryReady:false,
        shellLabel:"Preparing offline support",
        waitingUpdate:false,
        installPromptAvailable:false,
        installationLabel:"Preparing install support",
        installActionLabel:"PREPARING OFFLINE SUPPORT",
        installActionDisabled:true,
        updateActionLabel:"UPDATE TO LATEST VERSION",
        updateActionDisabled:true,
        installGuidance:"Offline support is still starting. Reopen Settings in a moment if this status does not update."
    };
}

async function handleSettingsOfflineInstall(){
    if(typeof window.requestOfflineAppInstall !== "function"){
        settingsOfflineGuidance = "Offline installation support is still starting. Try again in a moment.";
        renderSettings();
        focusSettingsControl(".settingsOfflineInstallButton");
        return;
    }

    const result = await window.requestOfflineAppInstall();
    settingsOfflineGuidance = result?.message || "";
    renderSettings();
    focusSettingsControl(".settingsOfflineInstallButton");
}

async function handleSettingsOfflineUpdate(event){
    if(settingsUpdatePending){ return; }
    const button = event?.currentTarget || null;
    const focusSelector = button?.classList.contains("settingsApplicationUpdateButton") ? ".settingsApplicationUpdateButton" : ".settingsOfflineUpdateButton";
    const state = getSettingsOfflineState();
    const action = state.waitingUpdate
        ? window.activateWaitingOfflineUpdate
        : window.requestLatestOfflineUpdate;

    if(typeof action !== "function"){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Updates are not available offline right now.", "error", 6000);
        }
        return;
    }

    settingsUpdatePending = true;
    if(button){
        button.disabled = true;
    }
    // Nik 2026-10-05: the result belongs in the status box under the button, not in a toast behind Settings.
    showSettingsUpdateStatus(state.waitingUpdate ? "Applying the downloaded update…" : "Checking for the latest version…");

    try{
        const result = await action({ quiet:true });
        settingsOfflineGuidance = typeof result === "boolean"
            ? (result ? "Updating now. The app reloads into the new version in a moment." : "The update could not be applied yet. Return to Home and try again.")
            : (result?.message || "");
    }catch(error){
        settingsOfflineGuidance = error?.message || "The latest version could not be checked right now.";
    }finally{
        settingsUpdatePending = false;
        renderSettings();
        focusSettingsControl(focusSelector);
    }
}

function showSettingsUpdateStatus(message){
    settingsOfflineGuidance = message;
    settingsContent?.querySelectorAll(".settingsOfflineNote").forEach(note => { note.textContent = message; });
}

function createOfflinePanel(){
    const state = getSettingsOfflineState();
    const panel = createSettingsPanel(
        "DEVICE",
        "OFFLINE APP",
        "Install Career Mode Showdown to open it like an app and play offline."
    );
    panel.classList.add("settingsOfflinePanel");

    const info = createSettingsElement("div", "settingsInfoGrid settingsOfflineInfo");
    info.append(
        createSettingsInfoRow("INSTALLATION", state.installationLabel),
        createSettingsInfoRow("OFFLINE SHELL", state.shellLabel),
        createSettingsInfoRow(
            "CONNECTIVITY",
            state.connectivityVerified ? state.connectivityLabel : "Checking connection"
        )
    );

    const actions = createSettingsElement("div", "settingsOfflineActions");
    const install = createSettingsElement(
        "button",
        "menuButton settingsOfflineInstallButton",
        state.installActionLabel
    );
    install.type = "button";
    install.disabled = Boolean(state.installActionDisabled);
    install.addEventListener("click", handleSettingsOfflineInstall);
    actions.appendChild(install);

    const update = createSettingsElement(
        "button",
        "menuButton settingsOfflineUpdateButton",
        state.updateActionLabel || (state.waitingUpdate ? "APPLY READY UPDATE" : "UPDATE TO LATEST VERSION")
    );
    update.type = "button";
    update.disabled = Boolean(state.updateActionDisabled);
    update.addEventListener("click", handleSettingsOfflineUpdate);
    actions.appendChild(update);

    const note = createSettingsElement(
        "p",
        "settingsOfflineNote",
        settingsOfflineGuidance || (
            state.standalone
                ? "Installed. Your Showdown save is not affected."
                : "Tap install for your browser's install steps."
        )
    );
    note.setAttribute("role", "status");
    note.setAttribute("aria-live", "polite");

    panel.append(info, actions, note);
    return panel;
}

function refreshSettingsOfflinePanel(){
    if(!settingsContent){ return false; }
    const applicationUpdate = settingsContent.querySelector(".settingsApplicationUpdateButton");
    if(applicationUpdate){
        const state = getSettingsOfflineState();
        applicationUpdate.textContent = state.updateActionLabel || "UPDATE TO LATEST VERSION";
        applicationUpdate.disabled = settingsUpdatePending || Boolean(state.updateActionDisabled);
    }
    const existing = settingsContent.querySelector(".settingsOfflinePanel");
    if(!existing){
        renderSettings();
        return false;
    }
    existing.replaceWith(createOfflinePanel());
    return true;
}

async function openSettingsDataManagement(){
    closeSettings(false);

    if(typeof window.openOptionalModule !== "function"){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("Data Management could not be opened.", "error");
        }
        openSettings();
        return;
    }

    // Legacy is Team V's History screen; this button asks for its data tools page (backup, restore, reset) instead.
    window.careerModeLegacyDataTools = true;
    const opened = await window.openOptionalModule("legacy");
    if(!opened){
        window.careerModeLegacyDataTools = false;
        openSettings();
    }
}

async function ensureSettingsShowdownStorageAuthority(){
    if(window.CareerModeSaveLibraryRuntime?.isReady?.()){
        return true;
    }

    if(typeof window.ensureSaveLibraryRuntimeAuthority !== "function"){
        if(typeof window.loadRuntimeScript !== "function"){
            throw new Error("Showdown storage is unavailable in this session.");
        }
        await window.loadRuntimeScript(
            "save-library-cutover",
            "js/saveLibraryCutover.js",
            () => typeof window.ensureSaveLibraryRuntimeAuthority === "function"
        );
    }

    await window.ensureSaveLibraryRuntimeAuthority();
    if(!window.CareerModeSaveLibraryRuntime?.isReady?.()){
        throw new Error("Showdown storage could not be verified.");
    }
    return true;
}

async function ensureSettingsPersistentPairAuthority(){
    const identity = window.CareerModeOnlinePlayerIdentity;
    if(identity && typeof identity.syncPair === "function"){
        await identity.syncPair();
    }

    if(!window.CareerModePersistentNikDanielPair){
        if(typeof window.loadRuntimeScript !== "function"){
            throw new Error("The Showdown connection service is unavailable.");
        }
        await window.loadRuntimeScript(
            "online-persistent-pair",
            "js/persistentNikDanielPair.js",
            () => Boolean(window.CareerModePersistentNikDanielPair)
        );
    }

    const pair = window.CareerModePersistentNikDanielPair;
    if(!pair || typeof pair.initialize !== "function" || typeof pair.getState !== "function"){
        throw new Error("The Showdown connection service is unavailable.");
    }
    await pair.initialize({ force: true });
    return pair;
}

/* r80 END SHOWDOWN: the seasons count is read at END time from the accepted Shared Season Commits of this exact rivalry
   (rivalries/{id}/seasonCommits/season_N, ACKNOWLEDGED revision 3): the same documents and the same accepted-prefix rule
   the multi-season progression counts from. Both paired players may read them without the private session, so the count
   is the same on a fresh browser that opened Settings before CONTINUE (no Shared Setup state, no session) as in the game.
   One read-only transaction (no write; the budget layer ends it without a commit), straight from the server, stopping at
   the first season not yet accepted: accepted + 1 document reads at most (11). No season commit at all is 0 seasons (the
   league wheel). resumeFromAuthority() is not used: it also moves the season cursor. Unknown (offline, the
   read denied or a malformed commit) is null: END still closes and History shows a dash. */
const SETTINGS_SEASONS_READ_MS = 10000;
const SETTINGS_SEASONS_MAX = 10;
async function readSettingsAcceptedSeasonCount(rivalryId){
    const runtime = window.CareerModeProductionFirebaseRuntime;
    if(!runtime || typeof runtime.ensureAccountServices !== "function"){ return null; }
    const budget = window.CareerModeFirestoreBudget;
    const services = (budget && typeof budget.services === "function" ? budget.services : value => value)(await runtime.ensureAccountServices());
    const sdk = services && services.ok === true ? services.firestoreSdk : null;
    if(!sdk || !services.firestore || !services.auth || !services.auth.currentUser
        || typeof sdk.doc !== "function" || typeof sdk.runTransaction !== "function"){
        return null;
    }
    return sdk.runTransaction(services.firestore, async transaction => {
        let accepted = 0;
        for(let seasonNumber = 1; seasonNumber <= SETTINGS_SEASONS_MAX; seasonNumber += 1){
            const ref = sdk.doc(services.firestore, "rivalries", rivalryId, "seasonCommits", `season_${seasonNumber}`);
            if(budget && typeof budget.readServerNext === "function" && ref && typeof ref.path === "string"){ budget.readServerNext(ref.path); }
            const snapshot = await transaction.get(ref);
            const commit = snapshot && typeof snapshot.exists === "function" && snapshot.exists() ? snapshot.data() : null;
            if(!commit){ break; }
            if(commit.schemaVersion !== 1 || commit.objectType !== "sharedSeasonCommit" || commit.rivalryId !== rivalryId
                || commit.seasonNumber !== seasonNumber || !["COMMITTED", "ACKNOWLEDGED"].includes(commit.phase)
                || (commit.phase === "ACKNOWLEDGED") !== (commit.revision === 3)){
                return null;
            }
            if(commit.phase !== "ACKNOWLEDGED"){ break; }
            accepted = seasonNumber;
        }
        return accepted;
    });
}
async function readSettingsSeasonsPlayed(rivalryId){
    if(typeof rivalryId !== "string" || !/^pair_[0-9a-f]{64}$/.test(rivalryId)){ return null; }
    let timer = null;
    try{
        const accepted = await Promise.race([
            readSettingsAcceptedSeasonCount(rivalryId),
            new Promise(resolve => { timer = setTimeout(() => resolve(null), SETTINGS_SEASONS_READ_MS); })
        ]);
        return Number.isInteger(accepted) && accepted >= 0 && accepted <= SETTINGS_SEASONS_MAX ? accepted : null;
    }catch(_error){
        return null;
    }finally{
        clearTimeout(timer);
    }
}

async function releaseSettingsCurrentShowdownConnection(showdown){
    const expectedRivalryId = showdown && showdown.sharedJourney && showdown.sharedJourney.rivalryId
        ? showdown.sharedJourney.rivalryId
        : null;
    const expectedSaveId = showdown && showdown.identity && showdown.identity.saveId
        ? showdown.identity.saveId
        : null;

    const pair = await ensureSettingsPersistentPairAuthority();
    const pairState = pair.getState();
    const hasCurrentPair = Boolean(
        pairState
        && pairState.rivalryId
        && (pairState.connectionState === "active" || pairState.connectionState === "pending-pair")
    );

    if(!expectedRivalryId && !hasCurrentPair){
        // Codex #937: only a refresh that read the pair link ("paired" or "unpaired") may end locally; an outage or error
        // state must not turn END for both players into a local-only delete.
        if(!pairState || !["paired", "unpaired"].includes(pairState.status)){
            throw new Error("The online Showdown could not be checked, so nothing was changed. Try again.");
        }
        return { ok: true, status: "unpaired" };
    }

    if(typeof pair.abandonCurrentShowdown !== "function"){
        throw new Error("Safe Showdown restart is unavailable in this build.");
    }

    const rivalryId = expectedRivalryId || pairState.rivalryId;
    // Codex #933: a code Nik has not joined yet (pending-pair) has no season commits, and the Rules deny reading them before
    // ACTIVE, so its count is 0 without a read (a denied read would record "-" seasons).
    const waiting = pairState && pairState.rivalryId === rivalryId && pairState.connectionState === "pending-pair";
    const seasonsPlayed = waiting ? 0 : await readSettingsSeasonsPlayed(rivalryId);
    // A rivalry already closed (the other phone ended it, or a retry after this one landed) answers "already-closed": success.
    const result = await pair.abandonCurrentShowdown({
        expectedRivalryId: rivalryId,
        expectedSaveId,
        seasonsPlayed
    });
    if(!result || result.ok !== true){
        throw new Error("The online Showdown was not ended, so nothing was changed.");
    }
    return { ...result, endedRivalryId: rivalryId };
}

// After END has closed the Showdown here too, its private session leaves page memory, as it does on the other phone
// (Terminal Close). Only that rivalry's session; a later Showdown's session is never touched.
function forgetSettingsEndedSession(rivalryId){
    const remote = window.CareerModeSparkRemoteJoining;
    try{
        const session = rivalryId && remote && typeof remote.getState === "function" ? remote.getState() : null;
        if(session && session.rivalryId === rivalryId && typeof remote.forgetSession === "function"){ remote.forgetSession(); }
    }catch(_error){}
}

function finishSettingsCurrentShowdownDeletion(){
    if(typeof window.stopTransferTimerLoop === "function"){
        window.stopTransferTimerLoop();
    }
    if(typeof window.resetTransientSelectionOperations === "function"){
        window.resetTransientSelectionOperations();
    }
    if(typeof currentShowdown !== "undefined"){
        currentShowdown = null;
    }
    if(typeof window.resetNavigationState === "function"){
        window.resetNavigationState();
    }

    closeSettings(false);
    const navigated = typeof showScreen === "function"
        ? showScreen("mainMenu", false)
        : (typeof window.navigateTo === "function"
            ? window.navigateTo("mainMenu", { addToHistory: false })
            : false);

    if(typeof window.refreshMainMenuExperience === "function"){
        window.refreshMainMenuExperience();
    }
    return navigated;
}

/* Ending the Showdown also removes every unsent private draft on this device (Season Results, Transfer Challenge, signing), for every rivalry, including orphans.
   The sweep lives in diagnostics.js (the only non-startup file allowed to touch browser storage directly) and loads on demand; it needs no rivalry id, so it also works offline or before the pair module loads. */
function sweepSettingsShowdownDrafts(){
    try{
        return Promise.resolve(window.ensureDiagnosticsModule()).then(() => window.clearAllShowdownDraftKeys() === true).catch(() => false);
    }catch(_error){
        return Promise.resolve(false);
    }
}

/* r80: a double tap (or a second tap while the first END is still running) joins the END already in flight. */
let settingsEndShowdownInFlight = null;
function endSettingsCurrentShowdown(button){
    if(!settingsEndShowdownInFlight){
        settingsEndShowdownInFlight = runSettingsEndShowdown(button).finally(() => { settingsEndShowdownInFlight = null; });
    }
    return settingsEndShowdownInFlight;
}

async function runSettingsEndShowdown(button){
    const active = getSettingsActiveShowdown();
    if(!active){
        renderSettings();
        return false;
    }

    const name = active.name || "Daniel vs Nik";
    const confirmedSaveId = active && active.identity && active.identity.saveId ? String(active.identity.saveId) : null;
    const confirmedLocalId = active && active.id !== undefined && active.id !== null ? String(active.id) : null;
    const confirmed = await settingsAskConfirm(
        `End the "${name}" Showdown? Ends this Showdown for both players. History keeps it as Ended early. This cannot be undone.`,
        "danger"
    );
    if(confirmed !== true){ return false; }

    if(button){
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
    }

    try{
        await ensureSettingsShowdownStorageAuthority();
        const runtime = window.CareerModeSaveLibraryRuntime;
        const authoritative = runtime && typeof runtime.loadActiveShowdown === "function"
            ? runtime.loadActiveShowdown()
            : null;
        if(!runtime || !authoritative || typeof runtime.clearActiveShowdown !== "function"){
            throw new Error("The current Showdown could not be verified safely.");
        }
        const authoritativeSaveId = authoritative && authoritative.identity && authoritative.identity.saveId
            ? String(authoritative.identity.saveId)
            : null;
        const authoritativeLocalId = authoritative && authoritative.id !== undefined && authoritative.id !== null
            ? String(authoritative.id)
            : null;
        if(
            (confirmedSaveId && authoritativeSaveId !== confirmedSaveId)
            || (!confirmedSaveId && confirmedLocalId !== authoritativeLocalId)
        ){
            throw new Error("The active Showdown changed after you confirmed. Nothing was ended. Review the current Showdown and confirm again.");
        }

        const released = await releaseSettingsCurrentShowdownConnection(authoritative);

        if(!runtime.clearActiveShowdown()){
            throw new Error("The Showdown was ended, but it could not be closed here. Tap END SHOWDOWN again; nothing new will be created.");
        }

        await sweepSettingsShowdownDrafts();
        finishSettingsCurrentShowdownDeletion();
        forgetSettingsEndedSession(released && released.endedRivalryId);
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                `Ended the "${name}" Showdown for both players. History keeps it as Ended early.`,
                "success",
                6200
            );
        }
        return true;
    }catch(error){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                `The Showdown was not ended. ${error && error.message ? error.message : "No saved data was changed."}`,
                "error",
                10000
            );
        }
        return false;
    }finally{
        if(button && button.isConnected){
            button.disabled = false;
            button.removeAttribute("aria-busy");
        }
    }
}

/* r79 PR4 (Nik, 2026-10-17): the START REAL CAREER row and the SHOW TEST SHOWDOWNS AGAIN switch are gone from Settings.
   The first real START (the one-time checkmark on the seasons screen) writes the career start marker; old test games stay
   stored and are never shown. The ACCOUNT panel's pairing rows (Paired with ..., UNPAIR)
   are js/showdownModes.js. */

function createDataPanel(){
    const live = getSettingsLiveShowdown();
    const active = live ? live.showdown : null;
    const online = isSettingsOnlineCareer();
    const historyText = online ? getSettingsOnlineHistoryText() : settingsCompletedCountText(getSettingsLegacyHistory().length);
    const panel = createSettingsPanel(
        "CAREER DATA",
        "SHOWDOWN DATA",
        "End the current Showdown or open History & Backup. Your player and device stay set up."
    );
    panel.classList.add("settingsDataPanel");

    const info = createSettingsElement("div", "settingsInfoGrid");
    const historyRow = createSettingsInfoRow("HISTORY", historyText, "settingsHistoryCount");
    info.append(
        createSettingsInfoRow(
            "CURRENT SHOWDOWN",
            active ? `${active.name || "Unnamed Showdown"} · ${live.status}` : "None"
        ),
        historyRow
    );

    const actions = createSettingsElement("div", "settingsOfflineActions settingsDataActions");
    if(active){
        const endCurrent = createSettingsElement(
            "button",
            "menuButton dangerButton settingsDeleteCurrentShowdown",
            "END SHOWDOWN"
        );
        endCurrent.type = "button";
        endCurrent.addEventListener("click", () => void endSettingsCurrentShowdown(endCurrent));
        actions.appendChild(endCurrent);
    }

    const historyAction = createSettingsElement(
        "button",
        "menuButton settingsDataButton",
        "OPEN HISTORY & BACKUP"
    );
    historyAction.type = "button";
    historyAction.addEventListener("click", openSettingsDataManagement);
    actions.appendChild(historyAction);

    const note = createSettingsElement(
        "p",
        "settingsDataNote",
        active
            ? "END SHOWDOWN ends it for both players. History keeps it as Ended early. Your player, device, history and settings stay."
            : "No Showdown in progress. History, backup and reset are under History & Backup."
    );

    panel.append(info, actions, note);
    return panel;
}

function renderSettings(){
    ensureSettingsDialog();
    if(!settingsContent){ return; }

    const fragment = document.createDocumentFragment();
    fragment.append(
        createApplicationPanel(),
        createMotionPanel(),
        createOfflinePanel(),
        createDataPanel()
    );
    settingsContent.replaceChildren(fragment);
    window.CareerModeRulesSettingsV10?.refreshSettings();
}

function getSettingsFocusRestoreSelector(){
    const active = document.activeElement;
    if(!settingsContent || !(active instanceof HTMLElement) || !settingsContent.contains(active)){
        return "";
    }
    if(active.matches(".settingsMotionChoice")){
        return `.settingsMotionChoice[data-motion-choice="${active.dataset.motionChoice}"]`;
    }
    for(const selector of [
        ".settingsAudioToggle",
        ".settingsOfflineInstallButton",
        ".settingsOfflineUpdateButton",
        ".settingsApplicationUpdateButton",
        ".settingsDataButton"
    ]){
        if(active.matches(selector)){ return selector; }
    }
    return "";
}

function getSettingsFocusableElements(){
    if(!settingsDialog){ return []; }
    return Array.from(settingsDialog.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )).filter(element => !element.classList.contains("hidden") && element.tabIndex !== -1);
}

function handleSettingsKeydown(event){
    if(!settingsOverlay || settingsOverlay.classList.contains("hidden")){
        return;
    }

    if(event.key === "Escape"){
        event.preventDefault();
        closeSettings();
        return;
    }

    if(event.key !== "Tab"){
        return;
    }

    const focusable = getSettingsFocusableElements();
    if(!focusable.length){
        event.preventDefault();
        settingsDialog.focus();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if(event.shiftKey && document.activeElement === first){
        event.preventDefault();
        last.focus();
    }else if(!event.shiftKey && document.activeElement === last){
        event.preventDefault();
        first.focus();
    }
}

function ensureSettingsDialog(){
    if(settingsOverlay && settingsOverlay.isConnected){
        return settingsOverlay;
    }

    const overlay = createSettingsElement("div", "settingsOverlay hidden");
    overlay.id = "settingsOverlay";
    overlay.setAttribute("aria-hidden", "true");

    const dialog = createSettingsElement("section", "settingsDialog");
    dialog.id = "settingsDialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "settingsTitle");
    dialog.tabIndex = -1;

    const header = createSettingsElement("header", "settingsHeader");
    const heading = createSettingsElement("div", "settingsHeading");
    heading.append(
        createSettingsElement("span", "settingsEyebrow", "CAREER MODE SHOWDOWN"),
        createSettingsElement("h2", "", "SETTINGS")
    );
    heading.querySelector("h2").id = "settingsTitle";

    const close = createSettingsElement("button", "settingsClose", "×");
    close.id = "settingsClose";
    close.type = "button";
    close.setAttribute("aria-label", "Close Settings");
    close.addEventListener("click", () => closeSettings());
    header.append(heading, close);

    const content = createSettingsElement("div", "settingsContent");
    content.id = "settingsContent";

    const footer = createSettingsElement("footer", "settingsFooter");
    const done = createSettingsElement("button", "menuButton", "DONE");
    done.type = "button";
    done.addEventListener("click", () => closeSettings());
    footer.appendChild(done);

    dialog.append(header, content, footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    overlay.addEventListener("pointerdown", event => {
        if(event.target === overlay){
            closeSettings();
        }
    });
    overlay.addEventListener("keydown", handleSettingsKeydown);

    settingsOverlay = overlay;
    settingsDialog = dialog;
    settingsContent = content;
    return overlay;
}

function setSettingsBackgroundInert(inert){
    const app = document.getElementById("app");
    if(!app){ return; }
    if(inert){
        app.setAttribute("inert", "");
        app.setAttribute("aria-hidden", "true");
    }else{
        app.removeAttribute("inert");
        app.removeAttribute("aria-hidden");
    }
}

function openSettings(){
    ensureSettingsDialog();
    settingsOfflineGuidance = "";
    if(isSettingsOnlineCareer()){ refreshSettingsOnlineHistory(); }
    renderSettings();

    settingsPreviousFocus = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    settingsOverlay.classList.remove("hidden");
    settingsOverlay.setAttribute("aria-hidden", "false");
    setSettingsBackgroundInert(true);
    window.CareerModeV10Screens?.expect?.("settingsOverlay");
    window.CareerModeRulesSettingsV10?.openSettings();

    window.requestAnimationFrame(() => {
        if(settingsDialog && !settingsOverlay.classList.contains("hidden")){
            settingsDialog.focus();
        }
    });
}

function closeSettings(restoreFocus = true){
    if(!settingsOverlay){ return; }
    settingsOverlay.classList.add("hidden");
    settingsOverlay.setAttribute("aria-hidden", "true");
    setSettingsBackgroundInert(false);
    window.CareerModeRulesSettingsV10?.closeSettings();

    if(restoreFocus && settingsPreviousFocus && settingsPreviousFocus.isConnected){
        settingsPreviousFocus.focus();
    }
    settingsPreviousFocus = null;
    settingsOfflineGuidance = "";
}

function initializeSettings(){
    ensureSettingsDialog();
    window.loadRuntimeScript("rules-settings-v10", "js/rulesSettingsV10.js", () => Boolean(window.CareerModeRulesSettingsV10)).then(() => window.CareerModeRulesSettingsV10.install()).catch(() => { window.CareerModeV10Screens?.settle?.("settingsOverlay"); });

    if(!settingsPreferenceListenerBound){
        settingsPreferenceListenerBound = true;
        window.addEventListener("career-mode-preferences-change", event => {
            if(settingsOverlay && !settingsOverlay.classList.contains("hidden")){
                renderSettings();
                if(event && event.detail && event.detail.source === "user"){
                    focusSelectedSettingsMotionChoice();
                }else if(event && event.detail && event.detail.source === "menu-feedback"){
                    focusSettingsControl(".settingsAudioToggle");
                }
            }
        });
    }

    if(!settingsOfflineListenerBound){
        settingsOfflineListenerBound = true;
        window.addEventListener("career-mode-offline-state-change", () => {
            if(settingsOverlay && !settingsOverlay.classList.contains("hidden")){
                const focusSelector = getSettingsFocusRestoreSelector();
                refreshSettingsOfflinePanel();
                if(focusSelector){ focusSettingsControl(focusSelector); }
            }
        });
    }
}

window.initializeSettings = initializeSettings;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.renderSettings = renderSettings;

```

## FILE: js/offlineApp.js
```js
const OFFLINE_APP_REVISION=(()=>{
    const meta=document.querySelector('meta[name="app-asset-revision"]');
    return meta?.content?.trim()||"1.4.0-r1";
})();
const OFFLINE_MESSAGE_TIMEOUT_MS=4500;
const SAFE_UPDATE_SCREENS=new Set(["mainMenu","dashboard"]);
let offlineRegistration=null;
let deferredInstallPrompt=window.__cmsDeferredInstallPrompt||null;
let activationRequested=false;
let lastActivationMessage="";
let controllerReloaded=false;
let installPromptCaptured=Boolean(deferredInstallPrompt);
let installedStandalone=false;
let offlineReady=false;
let offlineRecoveryReady=false;
let lastCacheStatus=null;
let menuMediaStatusBeforeOffline="";
let verifiedConnectivity=navigator.onLine===false?"offline":"online";
let connectivityVerified=navigator.onLine===false;
let connectivityProbeGeneration=0;

function isStandaloneDisplay(){
    return Boolean(
        (typeof matchMedia==="function"&&matchMedia("(display-mode: standalone)").matches)
        || navigator.standalone===true
    );
}

function isServiceWorkerSupported(){ return "serviceWorker" in navigator; }
function isOffline(){ return verifiedConnectivity==="offline"; }
function getActiveApplicationScreen(){
    return typeof window.getActiveScreenName==="function"
        ? window.getActiveScreenName()
        : document.querySelector(".screen:not(.hidden)")?.id||"";
}

function getUpdateBoundaryStatus(){
    const screen=getActiveApplicationScreen();
    const recoveryBusy=Boolean(document.querySelector('[data-transaction-busy="true"],[data-critical-recovery="true"]'));
    const uiBusy=Boolean(document.querySelector('[aria-busy="true"]:not(#loadingScreen)'));
    return{
        safe:SAFE_UPDATE_SCREENS.has(screen)&&!recoveryBusy&&!uiBusy,
        screen,
        recoveryBusy,
        uiBusy
    };
}

function getInstallGuidance(){
    const ua=navigator.userAgent||"";
    const isiOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    if(isiOS){
        return "In Safari, open Share and choose Add to Home Screen. Career Mode Showdown will launch like an app.";
    }
    if(/Android|CrOS/i.test(ua)){
        return "Use Install app from the browser address bar or menu when offered.";
    }
    return "Use your browser's Install app or Add to Home Screen command when available. Installation support and wording vary by browser.";
}

function getOfflineAppSettingsState(){
    installedStandalone=isStandaloneDisplay();
    const supported=isServiceWorkerSupported();
    const offline=isOffline();
    const waitingUpdate=Boolean(offlineRegistration?.waiting);
    const installPromptAvailable=Boolean(deferredInstallPrompt&&!offline);

    let installationLabel="Browser install";
    let installActionLabel="SHOW INSTALL INSTRUCTIONS";
    let installActionDisabled=false;
    if(installedStandalone){
        installationLabel="Installed";
        installActionLabel="INSTALLED ON THIS DEVICE";
        installActionDisabled=true;
    }else if(installPromptAvailable){
        installationLabel="Ready to install";
        installActionLabel="INSTALL OFFLINE APP";
    }else if(!supported){
        installationLabel="Install support varies";
    }else if(offline){
        installationLabel="Install requires browser controls";
    }

    let shellLabel="Preparing offline shell";
    if(!supported){ shellLabel="Service worker unavailable"; }
    else if(offlineReady&&offlineRecoveryReady){ shellLabel="Recovery shell ready"; }
    else if(offlineReady){ shellLabel="Offline shell ready"; }

    return{
        supported,
        standalone:installedStandalone,
        connectivity:verifiedConnectivity,
        connectivityVerified,
        connectivityLabel:offline?"Offline":"Online",
        offlineReady:offlineReady&&connectivityVerified,
        offlineRecoveryReady,
        shellLabel,
        waitingUpdate,
        installPromptAvailable,
        installPromptCaptured,
        installationLabel,
        installActionLabel,
        installActionDisabled,
        updateActionLabel:waitingUpdate?"APPLY READY UPDATE":"UPDATE TO LATEST VERSION",
        updateActionDisabled:!supported||(offline&&!waitingUpdate),
        installGuidance:getInstallGuidance(),
        cacheStatus:lastCacheStatus
    };
}

function dispatchOfflineState(){
    window.dispatchEvent(new CustomEvent("career-mode-offline-state-change",{
        detail:getOfflineAppSettingsState()
    }));
}

function setMenuMediaOfflineState(offline){
    const toggle=document.getElementById("menuMusicToggle");
    const status=document.getElementById("menuMusicStatus");
    const offlineStatus="OFFLINE · YOUTUBE MEDIA REQUIRES A CONNECTION";
    if(offline){
        try{
            // The Team V Audius player shares this toggle; pause it too before the toggle is disabled.
            const audius=window.HomeSoundtrack?.state?.();
            if((window.isMenuMediaPlaying?.()||audius?.wantPlaying)&&toggle&&!toggle.disabled){ toggle.click(); }
        }catch(error){
            console.warn("[Career Mode Showdown] External media could not be paused while entering offline mode:",error);
        }
        if(status){
            if(status.textContent!==offlineStatus){
                menuMediaStatusBeforeOffline=status.textContent||menuMediaStatusBeforeOffline;
            }
            status.textContent=offlineStatus;
        }
        if(toggle){
            toggle.disabled=true;
            toggle.setAttribute("aria-disabled","true");
        }
        return;
    }
    if(toggle){
        toggle.disabled=false;
        toggle.removeAttribute("aria-disabled");
    }
    if(status&&status.textContent===offlineStatus&&menuMediaStatusBeforeOffline){
        status.textContent=menuMediaStatusBeforeOffline;
    }
    menuMediaStatusBeforeOffline="";
}

function renderConnectivity(){
    setMenuMediaOfflineState(isOffline());
    dispatchOfflineState();
}

function setConnectivityState(state,verified=true){
    verifiedConnectivity=state==="offline"?"offline":"online";
    connectivityVerified=Boolean(verified);
    renderConnectivity();
    return verifiedConnectivity;
}

function versionedLocalUrl(path){
    const url=new URL(path,location.href);
    url.searchParams.set("v",OFFLINE_APP_REVISION);
    return url.href;
}

function ensureOfflineStyles(){
    if(document.querySelector('link[data-offline-app-style]')){ return; }
    const link=document.createElement("link");
    link.rel="stylesheet";
    link.href=versionedLocalUrl("css/offline.css");
    link.dataset.offlineAppStyle=OFFLINE_APP_REVISION;
    link.addEventListener("error",()=>{
        console.warn("[Career Mode Showdown] Offline/installed presentation stylesheet could not be loaded.");
    },{once:true});
    document.head.appendChild(link);
}

function sendWorkerMessage(worker,type,payload={}){
    return new Promise((resolve,reject)=>{
        if(!worker){
            reject(new Error("No service worker is available for this request."));
            return;
        }
        const channel=new MessageChannel();
        const timeout=setTimeout(()=>{
            channel.port1.close();
            reject(new Error(`Service worker message timed out: ${type}`));
        },OFFLINE_MESSAGE_TIMEOUT_MS);
        channel.port1.onmessage=event=>{
            clearTimeout(timeout);
            channel.port1.close();
            resolve(event.data||{});
        };
        worker.postMessage({type,...payload},[channel.port2]);
    });
}

// Studio Z2: one slow or failed probe used to mark the game offline for the rest of the visit (nothing probed again
// until the browser fired "online", which never happens when the device never lost its connection), so the identity gate
// stayed on CONNECTION REQUIRED and TRY AGAIN re-read the same stale flag. Only the browser's own offline signal is final
// at once; a failed probe counts as offline only after a second failure in a row, and while offline the probe repeats.
const PROBE_RETRY_MS=3000,OFFLINE_RECHECK_MS=15000;
let probeFailures=0,probeRetryTimer=null;
function scheduleConnectivityProbe(delay){
    if(probeRetryTimer)clearTimeout(probeRetryTimer);
    probeRetryTimer=setTimeout(()=>{probeRetryTimer=null;if(document.visibilityState==="hidden"){scheduleConnectivityProbe(delay);return;}void verifyNetworkConnectivity();},delay);
}
async function verifyNetworkConnectivity(){
    const generation=++connectivityProbeGeneration;
    if(navigator.onLine===false){
        probeFailures=0;
        setConnectivityState("offline",true);
        return false;
    }
    const worker=navigator.serviceWorker?.controller||offlineRegistration?.active;
    if(!worker){
        connectivityVerified=false;
        renderConnectivity();
        return false;
    }
    let online=false;
    try{
        const response=await sendWorkerMessage(worker,"CMS_PROBE_NETWORK");
        online=response?.type==="CMS_NETWORK_STATUS"&&response.online===true;
    }catch(error){ online=false; }
    if(generation!==connectivityProbeGeneration)return online;
    if(online){
        probeFailures=0;
        if(probeRetryTimer){clearTimeout(probeRetryTimer);probeRetryTimer=null;}
        setConnectivityState("online",true);
        return true;
    }
    probeFailures+=1;
    if(probeFailures>=2)setConnectivityState("offline",true);
    scheduleConnectivityProbe(probeFailures>=2?OFFLINE_RECHECK_MS:PROBE_RETRY_MS);
    return false;
}

async function verifyOfflineReadiness(worker=offlineRegistration?.active||navigator.serviceWorker?.controller){
    if(!worker){
        offlineReady=false;
        offlineRecoveryReady=false;
        connectivityVerified=false;
        renderConnectivity();
        return false;
    }
    try{
        const response=await sendWorkerMessage(worker,"CMS_GET_CACHE_STATUS");
        lastCacheStatus=response;
        const currentReady=Boolean(response.current?.ok??response.ok);
        const previousReady=Boolean(response.previous?.ok);
        offlineReady=currentReady||previousReady;
        offlineRecoveryReady=!currentReady&&previousReady;
    }catch(error){
        offlineReady=false;
        offlineRecoveryReady=false;
        if(!isOffline()){
            console.warn("[Career Mode Showdown] Offline shell verification could not complete:",error);
        }
    }
    await verifyNetworkConnectivity();
    renderConnectivity();
    return offlineReady;
}

// Studio Z5: a downloaded update used to wait for an UPDATE tap in Settings, so phones and tablets kept running an old
// build (old Settings panels, old screens) for days. A ready update now applies by itself on Home, between games, once
// nothing is busy and no sign-in or connection step is open. One try per page; a refused activation keeps the old build.
const AUTO_UPDATE_DELAY_MS=1200;
let autoUpdateTried=false,autoUpdateTimer=null;
function autoUpdateSafe(){
    if(getActiveApplicationScreen()!=="mainMenu"||!getUpdateBoundaryStatus().safe)return false;
    if(document.getElementById("onlinePlayerIdentityOverlay"))return false;
    return ![...document.querySelectorAll('[id$="Overlay"]')].some(o=>!o.classList.contains("hidden")&&!o.hidden&&getComputedStyle(o).display!=="none");
}
function scheduleAutoApplyUpdate(){
    if(autoUpdateTried||autoUpdateTimer||!offlineRegistration?.waiting||!navigator.serviceWorker?.controller)return;
    autoUpdateTimer=setTimeout(async()=>{
        autoUpdateTimer=null;
        if(autoUpdateTried||!offlineRegistration?.waiting)return;
        if(document.visibilityState==="hidden"||!autoUpdateSafe()){setTimeout(scheduleAutoApplyUpdate,15000);return;}
        autoUpdateTried=true;
        window.showAppNotice?.("Updating Career Mode Showdown to the latest version…","info",6000);
        await activateWaitingUpdate({quiet:true});
    },AUTO_UPDATE_DELAY_MS);
}
function markUpdateReady(){ dispatchOfflineState(); scheduleAutoApplyUpdate(); }

async function requestOfflineAppInstall(){
    installedStandalone=isStandaloneDisplay();
    if(installedStandalone){
        return{kind:"installed",message:"Career Mode Showdown is already installed on this device."};
    }
    if(deferredInstallPrompt&&!isOffline()){
        const prompt=deferredInstallPrompt;
        deferredInstallPrompt=null;
        dispatchOfflineState();
        try{
            await prompt.prompt();
            const choice=await prompt.userChoice;
            dispatchOfflineState();
            return{
                kind:choice?.outcome==="accepted"?"accepted":"dismissed",
                message:choice?.outcome==="accepted"
                    ? "Installation was accepted. Your browser will finish adding Career Mode Showdown."
                    : "Installation was not completed. You can try again from Settings when your browser offers it."
            };
        }catch(error){
            deferredInstallPrompt=prompt;
            dispatchOfflineState();
            window.reportApplicationError?.("The browser install prompt could not be opened",error);
            return{kind:"error",message:"The browser install prompt could not be opened."};
        }
    }
    return{kind:"guidance",message:getInstallGuidance()};
}

function waitForUpdateInstallation(registration,timeoutMs=30000){
    const worker=registration?.installing;
    const failed=()=>new Error("The downloaded update could not be installed completely. Try Update to Latest Version again.");
    if(!worker){
        return Promise.resolve(registration?.waiting||null);
    }
    if(worker.state==="redundant"){
        return Promise.reject(failed());
    }
    if(worker.state==="installed"||worker.state==="activated"){
        return Promise.resolve(worker);
    }
    return new Promise((resolve,reject)=>{
        let settled=false;
        const cleanup=()=>{
            clearTimeout(timeout);
            worker.removeEventListener("statechange",onStateChange);
        };
        const finish=value=>{
            if(settled)return;
            settled=true;
            cleanup();
            resolve(value);
        };
        const fail=error=>{
            if(settled)return;
            settled=true;
            cleanup();
            reject(error);
        };
        const onStateChange=()=>{
            if(worker.state==="redundant"){
                fail(failed());
                return;
            }
            if(worker.state==="installed"||worker.state==="activated"){
                finish(worker);
            }
        };
        const timeout=setTimeout(()=>finish(worker),timeoutMs);
        worker.addEventListener("statechange",onStateChange);
    });
}

async function requestLatestOfflineUpdate(options={}){
    // Settings shows the result in its own status box (options.quiet), so it skips the Home toast.
    const notice=options?.quiet?()=>{}:(...args)=>window.showAppNotice?.(...args);
    if(!isServiceWorkerSupported()){
        const message="This browser does not support the application update service.";
        notice(message,"error",6500);
        return{ok:false,kind:"unsupported",message};
    }
    if(isOffline()){
        const message="Connect to the internet before checking for the latest Career Mode Showdown version.";
        notice(message,"error",6500);
        return{ok:false,kind:"offline",message};
    }

    try{
        let registration=offlineRegistration||await navigator.serviceWorker.getRegistration("./");
        if(!registration){
            registration=await registerOfflineApplication();
        }
        if(!registration){
            throw new Error("The application update service could not be prepared.");
        }

        offlineRegistration=registration;
        if(registration.waiting){
            const applied=await activateWaitingUpdate(options);
            return{
                ok:Boolean(applied),
                kind:applied?"activated":"ready",
                message:applied?"Updating now. The app reloads into the new version in a moment.":(lastActivationMessage||"A verified update is ready to apply.")
            };
        }

        notice("Checking for the latest Career Mode Showdown version…","info",3500);
        await registration.update();
        await waitForUpdateInstallation(registration);
        markUpdateReady();

        if(registration.waiting){
            const applied=await activateWaitingUpdate(options);
            return{
                ok:Boolean(applied),
                kind:applied?"activated":"ready",
                message:applied?"Updating now. The app reloads into the new version in a moment.":(lastActivationMessage||"A verified update is ready to apply.")
            };
        }

        if(registration.installing){
            const message="The latest application update is still downloading. Keep this page open and press Update to Latest Version again in a moment.";
            notice(message,"info",8000);
            return{ok:true,kind:"downloading",message};
        }

        const message="You are already using the latest available Career Mode Showdown version.";
        notice(message,"success",5000);
        return{ok:true,kind:"current",message};
    }catch(error){
        const message=error?.message||"The latest version could not be checked right now.";
        if(options?.quiet)console.error("[Career Mode Showdown] The latest application version could not be checked:",error);
        else window.reportApplicationError?.("The latest application version could not be checked",error);
        return{ok:false,kind:"error",message};
    }
}

async function activateWaitingUpdate(options={}){
    lastActivationMessage="";
    const waiting=offlineRegistration?.waiting;
    if(!waiting){
        activationRequested=false;
        markUpdateReady();
        return false;
    }
    const boundary=getUpdateBoundaryStatus();
    if(!boundary.safe){
        const message=boundary.recoveryBusy||boundary.uiBusy
            ? "Update is ready, but an application operation is still in progress. Finish it and return to Home or Showdown Home before updating."
            : "Update is ready. Return to Home or Showdown Home before applying it so unsaved form work is never discarded.";
        lastActivationMessage=message;
        if(!options?.quiet)window.showAppNotice?.(message,"error",8000);
        return false;
    }
    activationRequested=true;
    try{
        const response=await sendWorkerMessage(waiting,"CMS_ACTIVATE_UPDATE",{
            pageRevision:OFFLINE_APP_REVISION,
            screen:boundary.screen
        });
        if(!response.ok||response.type!=="CMS_ACTIVATION_ACCEPTED"){
            const missing=Array.isArray(response.missing)&&response.missing.length
                ? `: ${response.missing.join(", ")}`
                : ".";
            throw new Error(response.error||`Cached update is incomplete${missing}`);
        }
        dispatchOfflineState();
        return true;
    }catch(error){
        activationRequested=false;
        dispatchOfflineState();
        lastActivationMessage=`The update was not applied because its offline files could not be verified. ${error?.message||""}`.trim();
        if(options?.quiet)console.error("[Career Mode Showdown] Update activation failed:",error);
        else window.reportApplicationError?.(
            "The update was not activated because its offline shell could not be verified",
            error
        );
        return false;
    }
}

async function requestPreviousRuntimeRollback(){
    const boundary=getUpdateBoundaryStatus();
    if(!boundary.safe){
        window.showAppNotice?.(
            "Return to Home or Showdown Home before reloading a previous offline version.",
            "error",
            7000
        );
        return false;
    }
    const worker=navigator.serviceWorker?.controller||offlineRegistration?.active;
    try{
        const response=await sendWorkerMessage(worker,"CMS_ROLLBACK_TO_PREVIOUS");
        if(!response.ok||response.type!=="CMS_ROLLBACK_ACCEPTED"){
            throw new Error(response.error||"No complete previous offline shell is available.");
        }
        location.reload();
        return true;
    }catch(error){
        window.reportApplicationError?.("A previous offline version could not be selected",error);
        return false;
    }
}

function observeRegistration(registration){
    offlineRegistration=registration;
    markUpdateReady();
    registration.addEventListener("updatefound",()=>{
        const installing=registration.installing;
        if(!installing){ return; }
        installing.addEventListener("statechange",()=>{
            if(installing.state==="installed"){
                if(navigator.serviceWorker.controller){ markUpdateReady(); }
                else{ void verifyOfflineReadiness(registration.active||installing); }
            }
        });
    });
}

async function registerOfflineApplication(){
    if(!isServiceWorkerSupported()){
        renderConnectivity();
        return null;
    }
    const existing=await navigator.serviceWorker.getRegistration("./");
    if(existing){
        observeRegistration(existing);
        const readyRegistration=await navigator.serviceWorker.ready;
        offlineRegistration=readyRegistration;
        await verifyOfflineReadiness(readyRegistration.active||navigator.serviceWorker.controller);
        if(!isOffline()){
            try{ await existing.update(); }
            catch(error){
                console.warn("[Career Mode Showdown] Service worker update check could not complete:",error);
                void verifyNetworkConnectivity();
            }
        }
        markUpdateReady();
        return existing;
    }
    const workerUrl=new URL("service-worker.js",location.href);
    workerUrl.searchParams.set("v",OFFLINE_APP_REVISION);
    const registration=await navigator.serviceWorker.register(workerUrl.href,{
        scope:"./",
        updateViaCache:"none"
    });
    observeRegistration(registration);
    const readyRegistration=await navigator.serviceWorker.ready;
    offlineRegistration=readyRegistration;
    await verifyOfflineReadiness(readyRegistration.active||navigator.serviceWorker.controller);
    markUpdateReady();
    return registration;
}

function consumeEarlyInstallPrompt(){
    if(window.__cmsDeferredInstallPrompt){
        deferredInstallPrompt=window.__cmsDeferredInstallPrompt;
        window.__cmsDeferredInstallPrompt=null;
        installPromptCaptured=true;
    }
}

async function initializeRemoteJoiningAcceptance(){
    if(new URLSearchParams(location.search).get("rjr-acceptance")!=="1"){ return; }
    try{
        if(typeof window.loadRuntimeScript!=="function"){ throw new Error("Release-owned runtime loader is unavailable."); }
        await window.loadRuntimeScript("rjr-acceptance","js/remoteJoiningAcceptance.js",()=>window.CareerModeRemoteJoiningAcceptance);
        if(typeof window.CareerModeRemoteJoiningAcceptance?.initialize!=="function"){ throw new Error("Acceptance recorder API is unavailable."); }
        window.CareerModeRemoteJoiningAcceptance.initialize();
    }catch(error){
        window.reportApplicationError?.("Remote Joining acceptance recorder could not start",error);
    }
}

function initializeOfflineApplication(){
    ensureOfflineStyles();
    consumeEarlyInstallPrompt();
    installedStandalone=isStandaloneDisplay();
    renderConnectivity();
    void initializeRemoteJoiningAcceptance();

    window.addEventListener("offline",()=>setConnectivityState("offline",true));
    window.addEventListener("online",()=>{
        connectivityVerified=false;
        void verifyNetworkConnectivity();
    });
    window.addEventListener("beforeinstallprompt",event=>{
        event.preventDefault();
        deferredInstallPrompt=event;
        installPromptCaptured=true;
        dispatchOfflineState();
    });
    window.addEventListener("appinstalled",()=>{
        deferredInstallPrompt=null;
        installedStandalone=true;
        dispatchOfflineState();
        window.showAppNotice?.(
            "Career Mode Showdown is installed and opens like an app.",
            "success",
            5500
        );
    });

    if(!isServiceWorkerSupported()){
        setConnectivityState(navigator.onLine===false?"offline":"online",true);
        return;
    }

    navigator.serviceWorker.addEventListener("controllerchange",()=>{
        if(activationRequested&&!controllerReloaded){
            controllerReloaded=true;
            location.reload();
            return;
        }
        void verifyOfflineReadiness(navigator.serviceWorker.controller);
    });

    registerOfflineApplication().catch(error=>{
        offlineReady=false;
        offlineRecoveryReady=false;
        connectivityVerified=false;
        renderConnectivity();
        window.reportApplicationError?.("Offline application support could not be prepared",error);
    });
}

window.recheckOfflineConnectivity=verifyNetworkConnectivity;
window.getOfflineAppDiagnostics=()=>({
    revision:OFFLINE_APP_REVISION,
    supported:isServiceWorkerSupported(),
    registration:Boolean(offlineRegistration),
    waiting:Boolean(offlineRegistration?.waiting),
    connectivity:verifiedConnectivity,
    connectivityVerified,
    standalone:isStandaloneDisplay(),
    installPromptCaptured,
    installGuidance:getInstallGuidance(),
    offlineReady:offlineReady&&connectivityVerified,
    offlineRecoveryReady,
    cacheStatus:lastCacheStatus,
    safeUpdateBoundary:getUpdateBoundaryStatus()
});
window.getOfflineAppSettingsState=getOfflineAppSettingsState;
window.requestOfflineAppInstall=requestOfflineAppInstall;
window.requestLatestOfflineUpdate=requestLatestOfflineUpdate;
window.getOfflineUpdateBoundaryStatus=getUpdateBoundaryStatus;
window.activateWaitingOfflineUpdate=activateWaitingUpdate;
window.requestPreviousOfflineRuntime=requestPreviousRuntimeRollback;
initializeOfflineApplication();
```
