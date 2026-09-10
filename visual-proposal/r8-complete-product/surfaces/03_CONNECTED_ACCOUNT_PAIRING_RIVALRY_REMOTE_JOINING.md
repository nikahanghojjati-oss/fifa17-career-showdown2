# Surface Group 03 — Connected Account, Pairing, Connected Rivalry and Private Remote Joining

Status: ACTIVE SURFACE CONTRACT

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
- Local Applied state;
- reconciliation preview;
- explicit confirmed Apply path owned by existing recovery authority.

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

## Accessibility and QA

- codes and IDs remain selectable real text;
- active vs unresolved vs error states use explicit words, not color alone;
- local availability remains visible in connected-feature failure states where product authority supports it;
- focus ownership works across overlays/dialogs;
- copy buttons have visible focus and clear feedback;
- destructive revoke/close actions are separated from ordinary retry/refresh;
- no secret/capability is baked into a screenshot or decorative image;
- no public discovery affordance is introduced;
- zero-dollar/Spark-only presentation truth is preserved.