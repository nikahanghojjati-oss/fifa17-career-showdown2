# R8 Proposal Screenshot QA — r13

Status: ACTIVE QA EVIDENCE — OWNER FINAL SCREENSHOT APPROVAL STILL OPEN

This ledger records proposal-only browser rendering evidence. None of these captures are production deployment evidence and none authorize merge to `main`.

Proposal branch:

`developer/r8-26-complete-proposal-asset-build-r13-work`

Production study anchor:

`ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686` / `1.9.1-r13`

Renderer route:

- self-contained proposal HTML rendered with the connected HTML/CSS renderer;
- included image quota only;
- overages disabled;
- no Pages deployment required;
- raw GitHub URL rendering was rejected as a QA path because one proxy added an interstitial and `raw.githubusercontent.com` rendered source text rather than executing the HTML.

## 1. Create Showdown — wide desktop

Viewport: `1600 × 900`

Renderer asset ID: `01a08bb7-6c59-7f5c-a6af-85c5fd2020ff`

Evidence URL:

`https://hcti.io/v1/image/01a08bb7-6c59-7f5c-a6af-85c5fd2020ff.png`

Result: PASS for proposal composition.

Observed:

- no horizontal or vertical control clipping;
- Showdown title hierarchy remains clear;
- Manager 1 = Daniel and Manager 2 = Nik are correct;
- four 1/3/5/10 season choices remain distinct;
- selected 3-season tile is visually obvious without hiding its text;
- primary Start Showdown action is dominant;
- Back remains clearly secondary;
- black/charcoal/gold material hierarchy is coherent;
- no raster character dependency or copyrighted crest/photography is introduced.

Remaining acceptance outside this static composition: real-DOM keyboard/focus behavior and product validation state.

## 2. Create Showdown — mobile

Viewport: `390 × 844`, mobile/touch emulation.

Renderer asset ID: `01a08bb7-e245-7fed-8913-3c0736478844`

Evidence URL:

`https://hcti.io/v1/image/01a08bb7-e245-7fed-8913-3c0736478844.png`

Result: PASS for proposal composition.

Observed:

- no horizontal overflow;
- Manager 1 and Manager 2 fields stack in logical order;
- 1/3/5/10 tiles collapse to a readable 2 × 2 grid;
- Start Showdown remains fully visible and dominant;
- Back remains full-width and readable;
- title wraps intentionally rather than colliding with the header;
- decorative rivalry divider is omitted before form controls are compressed.

## 3. Shared Season Results / r13 Multi Season — wide desktop

Viewport: `1600 × 1100`.

Renderer asset ID: `01a08bb8-b035-7fb2-8cbb-7466818f0554`

Evidence URL:

`https://hcti.io/v1/image/01a08bb8-b035-7fb2-8cbb-7466818f0554.png`

Result: PASS for proposal composition and r13 state separation.

Observed:

- Manager 1 Daniel and Manager 2 Nik remain equal before canonical result treatment;
- published/revealed state is explicit in text;
- Shared Season Commit is visually separate from Shared Canonical Score;
- canonical scoring is the strongest authority panel only after the fixture is shown as terminal;
- Shared History Convergence is quieter and read-only;
- all three required r13 Multi Season visual modes are distinguishable: history not witnessed, ready to continue, season plan terminal;
- disabled states remain text-readable rather than opacity-only;
- `CONTINUE TO SEASON 3` reads as progression rather than another commit;
- terminal copy explicitly keeps Final Reconciliation separate.

The review sheet intentionally shows all three Multi Season visual modes at once for design review. Production activates only the runtime-owned current state.

## 4. Shared Season Results / r13 Multi Season — mobile exact composition

Viewport: `390 × 2400`, mobile/touch emulation.

Renderer asset ID: `01a08bc5-c225-763c-b0ea-84cfe7c774b9`

Evidence URL:

`https://hcti.io/v1/image/01a08bc5-c225-763c-b0ea-84cfe7c774b9.png`

Result: PASS.

This exact repository composition supersedes the earlier compact mobile transcription `01a08bb9-3ebd-7d2c-96b7-6b54d56f55a5`, whose status remains historical exploration only.

Observed:

- no horizontal overflow at 390px;
- published results precede authority/actions;
- Shared Season Commit remains separate from canonical score;
- Shared History Convergence remains read-only and quieter;
- r13 history-not-witnessed, ready-to-continue and plan-terminal states preserve clear ordering;
- disabled actions remain readable;
- the long screen remains comprehensible as a one-column authority sequence.

## 5. Legacy — wide desktop

Viewport: `1600 × 900`.

Renderer asset ID: `01a08bb9-d628-71c1-bea3-b5d7d4620b0c`

Evidence URL:

`https://hcti.io/v1/image/01a08bb9-d628-71c1-bea3-b5d7d4620b0c.png`

Result: PASS for the known dark-shell contrast boundary.

Observed:

- outer Legacy headings are clearly legible on the dark global shell;
- archive cards retain dark Level B treatment;
- the intentionally light Data Management panel retains dark text rather than receiving a dangerous global cream override;
- Import Analysis remains visibly read-only;
- Export, analysis, review and destructive delete are visually separated;
- destructive Delete This Showdown is distinct without dominating the page;
- no character art is introduced.

This visual result is consistent with the separate token proof: old heading pair approximately `1.305:1`; proposed outer cream treatment approximately `17.347:1`; proposed muted dark-shell text approximately `9.543:1`.

A later mobile review exposed microtype. The proposal was corrected and the follow-up mobile visual review passed. The previous renderer IDs were not retained in the continuity record; therefore final owner approval requires a fresh retained mobile Legacy screenshot rather than relying on that uncatalogued pass.

## 6. Atomic Restore & Recovery — wide desktop

Viewport: `1600 × 900`.

Renderer asset ID: `01a08bba-8475-743a-ae79-d11cec41d6f9`

Evidence URL:

`https://hcti.io/v1/image/01a08bba-8475-743a-ae79-d11cec41d6f9.png`

Result: PASS for proposal hierarchy.

Observed:

- verification, snapshot review and Apply gate are visually distinct stages;
- successful verification explicitly says no local data changed;
- incomplete plan keeps Apply Restore disabled and readable;
- Review Conflict remains the available next action;
- Critical Recovery uses reserved destructive-risk red and is visually isolated;
- ordinary-action freeze instruction is explicit;
- no decorative motion, character art, cloud-sync implication or automatic-restore implication is present.

A later mobile review exposed microtype. The proposal was corrected and the follow-up mobile visual review passed. The previous renderer IDs were not retained in the continuity record; therefore final owner approval requires a fresh retained mobile Restore/Recovery screenshot.

Remaining acceptance outside static composition: actual dialog focus ownership, runtime freeze behavior and real stale/conflict transitions.

## 7. Connected Account / Pairing / Private Remote Joining — mobile

First viewport review: `390px` class mobile.

First renderer asset ID: `01a08bc3-e5e1-78bc-bb3b-72193ab32ac4`

Result: FIX REQUIRED.

The structure was sound, but explanatory and metadata typography fell below the proposal's no-pinch-zoom quality floor.

Fix commit:

`9bea16600dcdc653a5e836241f9ac0b34cf93fcc`

Second renderer asset ID: `01a08bc5-0e0f-7dc1-b992-5944186c9756`

Evidence URL:

`https://hcti.io/v1/image/01a08bc5-0e0f-7dc1-b992-5944186c9756.png`

Result: PASS after fix.

Observed:

- private pairing/session capabilities remain prominent without becoming decorative;
- remote observed and local applied revisions are unmistakably separate;
- recovery-pending warning remains readable;
- no public lobby/discovery semantics are introduced;
- controls stack without horizontal overflow;
- mobile explanatory text is materially more readable after the correction.

## 8. Settings / Save Library / Local Profiles — mobile

First renderer asset ID: `01a08bc6-4482-7c28-87c1-05aadec20ca2`

Result: FIX REQUIRED.

The layout worked, but metadata, profile IDs and setting explanations were too small.

Fix commit:

`9d24dde34c064600fdd88b99f0087c6eda51bc05`

Second renderer asset ID: `01a08bc7-1b03-7785-a02b-dffd05df54ed`

Evidence URL:

`https://hcti.io/v1/image/01a08bc7-1b03-7785-a02b-dffd05df54ed.png`

Result: PASS after fix.

Observed:

- Save identity remains visually distinct from a generic file browser;
- active save, progress and Continue action remain dominant;
- Delete This Save remains separated and destructive without overpowering Continue;
- Daniel and Nik profile identities remain legible;
- Settings remain secondary to Career data;
- no cloud-sync promise is implied;
- typography is materially improved without destabilizing the mobile layout.

## 9. Showdown Radio / FIFA 17 Originals — desktop

Prototype:

`prototypes/25-native-music-player-reference.html`

Viewport: `1600 × 1200`.

Renderer asset ID: `01a08be3-8a1c-71c1-a33c-4896cd7ef504`

Evidence URL:

`https://hcti.io/v1/image/01a08be3-8a1c-71c1-a33c-4896cd7ef504.png`

Result: PASS for media architecture review.

Observed:

- native licensed playback reads as the default media experience;
- compact transport, time rail, queue and volume fit without turning Home media into a dominant video block;
- current playing state is explicit;
- expanded licensed queue remains readable and restrained;
- FIFA 17 Originals is clearly a separate provider mode;
- the visible provider-player boundary is explicit rather than disguised as native audio;
- unavailable-track state provides Retry and next-track actions without becoming a global app failure;
- rights/provenance warning is visible and the fixture tracks are not falsely presented as approved assets.

## 10. Showdown Radio / FIFA 17 Originals — mobile

Viewport: `390 × 2400`, mobile/touch emulation.

Renderer asset ID: `01a08be4-10db-7751-9912-38f553d08602`

Evidence URL:

`https://hcti.io/v1/image/01a08be4-10db-7751-9912-38f553d08602.png`

Result: PASS for responsive architecture review.

Observed:

- no horizontal overflow;
- 44px+ transport targets remain distinct;
- track title, artist, state and timing remain readable;
- Queue becomes full width rather than compressing the seek rail;
- licensed tracks remain a clean single-column list;
- provider mode stacks its actions vertically;
- provider-player area remains visibly distinct;
- failure state and rights boundary remain readable without pinch zoom.

The native queue names are visual fixtures only. No native soundtrack track is approved until its individual rights ledger is complete.

## Mobile typography floor learned from QA

The proposal must not use microtype merely because a desktop review looks clean.

For final mobile compositions, target:

- essential body/status copy: approximately 13–14px minimum;
- metadata/labels: approximately 11–12px minimum;
- button labels: approximately 12px minimum;
- touch targets: 44px minimum where interactive.

Exceptions require actual readability evidence rather than an aesthetic preference.

## Owner final screenshot approval gate — NEW HARD GATE

Internal screenshot QA does not finish the visual proposal.

The owner has required that, once the proposal reaches the designer's final standard:

1. every built page/surface must be represented in a screenshot approval package;
2. every materially different user-visible version/state of a page must also be represented;
3. the screenshots must be presented to the owner for explicit approval;
4. the R8 proposal remains `NOT FINAL` until that owner approval is obtained.

The authoritative coverage inventory lives in:

`evidence/FINAL_SCREENSHOT_APPROVAL_INDEX.md`

Do not collapse genuinely different product states into one screenshot merely to reduce the number of captures. Conversely, do not manufacture screenshots for unreachable or semantically identical states.

## Current QA conclusion

The tested proposal surfaces support the R8 black/gold system, and the QA loop is producing substantive corrections rather than screenshot-only paperwork. The shared r13 composition now has exact-file mobile evidence. Connected/private-play and Save Library were corrected after real mobile readability findings. The new media architecture has desktop/mobile proposal evidence.

Still open before final visual proposal status:

- exact A01/A02 byte-safe placement under `assets/masters/` and Home wide/reduced-wide/Chromebook/mobile visual QA using those exact files;
- representative screenshot coverage for every routed screen and substantial non-route surface/state in `FINAL_SCREENSHOT_APPROVAL_INDEX.md`;
- fresh retained mobile screenshots for Legacy and Restore/Recovery;
- final licensed native soundtrack selection with per-track rights/provenance evidence if Showdown Radio is carried into implementation;
- real-DOM keyboard/focus/dialog-focus verification during senior implementation or an executable product-browser QA phase;
- reconciliation with product work after r13, especially Journey Reconnect and later final reconciliation/terminal capabilities;
- mandatory final-main reconciliation at the main developer's actual final product checkpoint;
- owner review and explicit approval of the complete final screenshot package.
