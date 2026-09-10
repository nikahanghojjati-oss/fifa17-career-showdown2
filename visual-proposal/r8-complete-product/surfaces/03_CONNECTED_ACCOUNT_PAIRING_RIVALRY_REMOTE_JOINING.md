# Surface Group 03 — Connected Account, Pairing, Connected Rivalry and Private Remote Joining

Status: ACTIVE SURFACE CONTRACT — RECONCILED THROUGH r16 LOCAL RECONCILIATION

These are private connection surfaces. They must stay technical, explicit and calm. They never become a public/community skin and never imply cloud authority beyond what the runtime confirms.

## Connected Account

Presentation truth:

- local Career Mode identity remains primary;
- connected account is a private capability layer;
- Firebase remains Spark-only with billing off;
- failure of connected features must not visually imply loss of local Career Mode data when local play remains available.

Required states:

- local only / signed out;
- connecting;
- signing in;
- bootstrapping;
- ready;
- setup incomplete;
- auth/runtime/persistence unavailable;
- signing out;
- cancelled/error.

Use a privacy-forward information grid for Status, Account, shortened Account ID, Remote Joining availability and zero-billing infrastructure note where current product exposes them.

## Registered Device & Pairing

Core truths:

- sign-in may be required;
- device registration is explicit;
- pairing capability is one-use and time-limited according to current runtime;
- exactly two stable account/profile/save identities participate;
- gameplay sync semantics remain product authority.

Required states/actions include:

- sign-in required;
- connected but device not registered;
- registered;
- choose local binding;
- Create Pairing Code;
- Join Private Pairing;
- pair code open;
- Copy Pairing Code;
- paired/confirmed;
- expired/already-used/unavailable capability;
- revoked device;
- registration/pairing error.

Capability/code fields are selectable and may use a monospace system font. Expiry and one-use status must be text-explicit. Do not add QR behavior unless final product actually owns it.

## Connected Rivalry

Core principle: remote observation is not local application.

The proposal must visually separate:

- Remote Observed state/revision/hash;
- exact Local Target identity;
- Local Commit / Applied state;
- reconciliation preview;
- explicit confirmed Apply path owned by existing Candidate C recovery authority.

Required states:

- not attached;
- auto-link available;
- verify auto-link;
- attached;
- observe/refresh;
- remote revision/hash metadata;
- tombstone/revoked/unavailable;
- reconciliation preview ready;
- local commit/apply path;
- stale/conflict/error.

Use a technical ledger layout. A refresh or remote preview must never look like local gameplay has already changed.

### r16 Shared Journey Local Reconciliation ownership

Production `1.9.1-r16` does not introduce a new reconciliation page. Its user-visible controls remain inside the existing Settings overlay in the existing Connected Rivalry panel, `#sparkConnectedRivalryPanel`, under `#settingsContent`.

R8 therefore treats r16 as an additive Connected Rivalry state family. It must not create a route, dashboard tile, conflict inbox or second Restore/Recovery authority.

The live r16 relationship is:

`Shared Journey history -> r16 projection/adapter -> existing Connected Rivalry preview -> existing Candidate C explicit Apply`

Presentation rules:

- Candidate B/Connected Rivalry preview remains read-only observation;
- Candidate C remains the sole destructive local Apply authority;
- preview must show that the remote revision is observed only and local gameplay is unchanged;
- the exact local target remains visible before Apply;
- Apply requires deliberate confirmation;
- Apply copy must preserve the backup-first boundary;
- `BACK UP + APPLY EXACT REVISION` is the appropriate action hierarchy where the final product exposes that action;
- stale target or authority changes require review again rather than force/bypass;
- unrelated local saves remain visually outside the mutation boundary;
- no automatic Apply is implied.

Material r16 presentation states:

- `WAITING_REMOTE`: no observed remote envelope yet;
- `REMOTE_OBSERVED`: exact remote revision/hash is available for observation, but Apply is not yet ready;
- `PREVIEW_READY`: non-mutating preview exists for the exact remote revision and exact local target;
- `OFFLINE_FALLBACK`: an already-observed exact envelope may remain previewable, but Apply is explicitly unavailable while offline;
- `APPLIED`: exact reviewed revision completed through Candidate C and verified backup/transaction authority;
- blocked/error: local Career Mode remains available where product authority supports it and no force path appears.

The visual layer does not persist any r16 state and does not write provider or canonical local storage. It only presents runtime-owned state.

Evidence authority:

`evidence/R16_SHARED_JOURNEY_LOCAL_RECONCILIATION_2026-09-10.md`

## Private Remote Joining

Heading concept: Remote Joining

Eyebrow concept: Private Session · Exact Capability Only

Permanent presentation truths:

- no lobby;
- no public listing;
- no discovery/community/rankings;
- exact capability only;
- private session services resolve from explicit user action;
- ambiguous recovery preserves the exact page-memory capability when that is product truth;
- no replacement capability is visually implied during unresolved recovery.

Primary areas:

- Host / Open Private Session;
- Join / exact session code input;
- Current Page-Memory Session state when product authority exposes it.

Required visual states:

- idle;
- resolving prerequisites;
- auth required;
- device required;
- rivalry required;
- hosting unresolved;
- host open;
- joining unresolved;
- active;
- recovery pending;
- retrying exact capability;
- terminal close;
- rejected/error;
- authority context changed;
- Spark quota exhausted while local Career Mode remains available.

No A01/A02 art. No continuous animation behind secret/capability content. Use only original lock/session/device iconography if needed.

## Responsive contract

Desktop may use two-column host/join or observed/applied comparisons.

Chromebook/tablet collapses secondary metadata before reducing capability readability.

Mobile stacks host/join, observed/applied and pairing states. Codes remain selectable and horizontally safe; do not shrink them below readable size.

For r16 confirmation states, the exact local target, confirmation copy and Apply action must remain in source order on narrow screens. Do not place the Apply button above the confirmation control merely to save vertical space.

## Accessibility and QA

- codes and IDs remain selectable real text;
- active vs unresolved vs error states use explicit words, not color alone;
- local availability remains visible in connected-feature failure states where product authority supports it;
- focus ownership works across overlays/dialogs;
- copy buttons have visible focus and clear feedback;
- destructive revoke/close actions are separated from ordinary retry/refresh;
- r16 preview and r16 Apply are distinguishable by text and structure, not color alone;
- offline r16 preview-only state explicitly says Apply is unavailable;
- no secret/capability is baked into a screenshot or decorative image;
- no public discovery affordance is introduced;
- zero-dollar/Spark-only presentation truth is preserved;
- no new canonical-storage/provider authority is implied.
