# Senior Developer Final Visual Handoff Requirements

Status: TARGET CONTRACT — NOT YET READY FOR SENIOR HANDOFF

The visual track may create the final senior-developer implementation handoff only when every condition below is satisfied.

## 1. Final product reconciliation

After the main developer reaches the actual final development checkpoint:

1. independently resolve current `main`;
2. inventory every routed screen and substantial overlay/panel/status/state family;
3. compare that inventory with this proposal workspace;
4. add/revise only proposal coverage affected by real drift;
5. remove assumptions that no longer match product authority;
6. record the exact final-main commit.

Current intermediate reconciliation is through:

`97c28b1efea6ee6e901e6076a834ec419cbad5aa` / `1.9.1-r14`.

r14 Journey Reconnect is already represented by `surfaces/08_JOURNEY_RECONNECT_R14.md` and `prototypes/28-journey-reconnect-r14-reference.html`.

No intermediate main commit may substitute for the true final reconciliation.

## 2. Complete visual design

Every final routed screen and substantial non-route surface must have:

- intended information hierarchy;
- responsive layout contract;
- action hierarchy;
- reachable empty/loading/error/waiting/disabled/destructive states;
- local/shared variants where applicable;
- motion/reduced-motion behavior;
- accessibility/focus requirements;
- asset usage decision.

The Home Audius player and r14 Journey Reconnect status surface are explicitly included.

## 3. Complete asset package

Every required visual asset must be resolved with:

- stable ID;
- proposal path;
- dimensions/type;
- SHA-256 where applicable;
- provenance/rights status;
- source master/derivative relationship;
- target screens/states;
- responsive eligibility/safe zones;
- acceptance status.

A01/A02 authoritative source masters must retain exact approved hashes and must never be replaced by regenerations.

A new generated character asset requires a screen-specific unresolved role plus identity/anatomy/crop/safe-zone QA. No current contract justifies A03–A06.

## 4. Media player implementation boundary

Read first:

- `surfaces/07_MEDIA_PLAYER.md`
- `evidence/MEDIA_PLAYER_FEASIBILITY_2026-09-10.md`
- `evidence/MEDIA_PROVIDER_ZERO_DOLLAR_DECISION_2026-09-10.md`
- `prototypes/27-audius-showdown-radio-reference.html`
- `prototypes/26-native-music-player-functional-reference.html` for browser-media state-authority proof
- `prototypes/26-soundcloud-fifa17-audio-provider-reference.html` for optional nostalgia-provider behavior

### Primary music — Audius Showdown Radio

The owner has prioritized audio-only smoothness/replayability over exact FIFA 17 soundtrack fidelity.

Final direction:

`SHOWDOWN RADIO -> AUDIUS -> one browser HTML <audio> authority`

Requirements:

- curated track manifest with stable Audius IDs/metadata;
- do not search/trend on every Home visit;
- one active audio element;
- no autoplay on startup;
- no listener Audius login for ordinary public playback;
- no music iframe/video;
- source request only for the selected track;
- UI state derives from actual HTML media events rather than the click;
- Play/Pause, Previous/Next, seek/progress, queue selection and provider attribution;
- bounded failure/retry behavior;
- no duplicate player after navigation/re-entry.

At the proposal verification date, Audius official developer documentation states a Free API plan of 10 requests/second and 500,000 requests/month and describes it as always free. These are API requests rather than a direct song-play count. The implementation must minimize requests regardless of expected low usage.

The final handoff must record the Free-plan verification date and instruct the senior developer to recheck provider terms before production publication.

### Optional nostalgia — SoundCloud FIFA 17 Picks

SoundCloud may be retained as an optional secondary exact-song panel.

Per track outcome:

- `FULL`;
- `PREVIEW` clearly labelled as such;
- `UNAVAILABLE`.

Use one reusable standard SoundCloud widget and real READY/PLAY/PAUSE/FINISH/ERROR state. A preview must not masquerade as full playback.

SoundCloud failure returns to Showdown Radio/another eligible item; it does not invoke YouTube music fallback.

### Video — YouTube trailer only

YouTube is not a music fallback.

If the FIFA 17 gameplay trailer remains:

- it is intentionally visible video;
- lazy-load after deliberate intent;
- use official IFrame Player API lifecycle/events;
- handle ready/state/autoplay-blocked/error explicitly;
- no audio isolation/extraction;
- no ad suppression/workaround.

### Permanent financial invariant

`paidUpgradeAllowed = false`

No payment card, paid API tier, listener Premium requirement, automatic overage or automatic provider upgrade is permitted.

If any provider changes terms such that payment becomes necessary, disable that provider lane until a new zero-dollar decision is approved. Career Mode remains usable with all media disabled.

### Final track ledger

Each final Audius track requires:

- stable queue key;
- Audius track ID and canonical source URL;
- title/creator/duration;
- public streamability result;
- governing provider/creator license or rights basis;
- attribution requirement;
- iPhone Safari proof;
- Chromebook proof;
- final owner taste status;
- verification date.

Do not infer that all Audius tracks share one license.

## 5. r14 Journey Reconnect implementation boundary

Read:

- `surfaces/08_JOURNEY_RECONNECT_R14.md`
- `evidence/R14_JOURNEY_RECONNECT_RECONCILIATION_2026-09-10.md`
- `prototypes/28-journey-reconnect-r14-reference.html`

Preserve production ownership of `#sharedJourneyReconnectStatus` below `#topHeader` and its `role=status` / `aria-live=polite` semantics.

Exact phases to preserve:

- `OFFLINE_HOLD`;
- `RECOVERY_PENDING`;
- `FRESH_SESSION_REQUIRED`;
- `ACTIVE_RECOVERED`;
- `TERMINAL_RECOVERED`.

Journey Reconnect is read-only. It does not mutate canonical Save Library state, perform provider writes/listing, create public discovery or require billing.

Expired/missing sessions are never styled as active authority. A resumable durable journey must be visibly distinguished from a valid current private-session authorization. Terminal recovery must not expose a next-season resurrection cue.

## 6. Final-product-quality proposal package

Reference HTML/CSS/JS must:

- remain proposal/reference code rather than production authority;
- avoid product-domain mutation/persistence;
- use real DOM text for core UI;
- identify production selectors/components it maps to;
- explicitly identify any network/provider calls used only for functional feasibility proof;
- give the senior developer enough specificity that major visual decisions are not inferred from scratch.

## 7. QA package

Representative visual QA:

- wide desktop;
- reduced-wide desktop;
- Chromebook/tablet;
- 390px-class mobile.

Also verify:

- normal/reduced motion;
- keyboard focus;
- modal focus ownership/restoration;
- contrast;
- no art/control overlap;
- no decorative focus targets;
- no baked/mirrored core UI text;
- character identity + Manager 1 Daniel / Manager 2 Nik mapping;
- rights-safe/provenance assets;
- no missing/broken assets;
- local/shared authority clarity;
- error/recovery/destructive legibility;
- Audius ready/play-requested/playing/paused/buffering/error truthfulness;
- SoundCloud Full/Preview/Unavailable truthfulness if retained;
- Journey Reconnect five-phase truthfulness;
- responsive readability without pinch zoom.

Mobile practical floor learned during R8 QA:

- essential body/status ~13–14px minimum;
- metadata/labels ~11–12px minimum;
- button labels ~12px minimum;
- touch targets 44px minimum.

## 8. Owner final screenshot approval — HARD GATE

Read:

`evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`

Before R8 may become `FINAL` or become an approved implementation target:

1. every final routed page has a final screenshot;
2. every substantial non-route surface has required final screenshots;
3. every materially different reachable state/version is shown;
4. responsive variants are included where geometry/content materially changes;
5. Audius player screenshots disclose provider/state and final queue context;
6. Journey Reconnect states are represented;
7. screenshots reflect final reconciled proposal, not obsolete exploration;
8. complete set is presented to owner;
9. owner explicitly approves exact images;
10. rejected states are revised/re-rendered.

Internal QA PASS is not owner approval.

## 9. Senior implementation map

The final package must state:

- production screen/component mapping;
- existing domain authority that must remain untouched;
- likely integration selectors/files;
- approved asset destinations;
- responsive/state rules;
- Audius provider/track/financial boundary;
- optional SoundCloud Full/Preview mapping;
- YouTube trailer-only rule;
- Journey Reconnect status/state boundary;
- intentionally omitted character art;
- final-main compatibility risks.

Senior developer owns actual production implementation and code review.

## 10. Final handoff prompt

Only after every gate closes, create a concise final implementation prompt that:

- points first to this proposal folder;
- identifies exact final proposal manifest/head and exact final-main reconciliation commit;
- states owner screenshot approval is complete;
- states final Audius track/device/rights matrix;
- states optional SoundCloud classifications if retained;
- states r14/later reconnect reconciliation status;
- instructs review/verification and intentional implementation;
- explicitly says visual track did not modify/deploy `main`;
- preserves Firebase Spark-only / zero-billing / private-two-manager/domain-authority locks.

Proposal approval does not itself equal deployment approval.
