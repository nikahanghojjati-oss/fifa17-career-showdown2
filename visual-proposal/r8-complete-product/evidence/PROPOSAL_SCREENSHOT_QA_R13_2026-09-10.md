# R8 Proposal Screenshot QA — r13

Status: ACTIVE QA EVIDENCE

This ledger records proposal-only browser rendering evidence. None of these captures are production deployment evidence and none authorize merge to `main`.

Current proposal branch at start of this QA slice:

`developer/r8-26-complete-proposal-asset-build-r13-work`

Current production study anchor:

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

## 4. Shared Season Results / r13 Multi Season — mobile exploration

Viewport: `390 × 1800`, mobile/touch emulation.

Renderer asset ID: `01a08bb9-3ebd-7d2c-96b7-6b54d56f55a5`

Evidence URL:

`https://hcti.io/v1/image/01a08bb9-3ebd-7d2c-96b7-6b54d56f55a5.png`

Result: CONDITIONAL PASS as responsive-layout exploration, not exact-file evidence.

The render used a compact self-contained mobile transcription of the current composition so it is not the canonical repository-file screenshot. It demonstrates that the intended stack order works: results, commit, canonical score, history, then Multi Season progression. Exact-file mobile rendering remains required before this screen receives final visual QA.

Do not treat transcription-specific typography/spacing artifacts as repository defects.

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

Remaining acceptance outside this static composition: actual dialog focus ownership, runtime freeze behavior and real stale/conflict state transitions.

## Current QA conclusion

The tested proposal surfaces support the R8 black/gold system without reproducing the previously discovered Legacy contrast failure. Responsive behavior is verified directly for Create Showdown and directionally for the highest-density shared review. High-risk safety/data surfaces are visually distinct and text-first.

Still open before final visual proposal status:

- exact A01/A02 byte-safe placement under `assets/masters/` and Home visual QA using those exact files;
- exact-file mobile QA for shared Season Results;
- representative Chromebook/tablet proof;
- real-DOM keyboard/focus/dialog-focus verification during senior implementation or a browser environment capable of executing the actual product DOM;
- broader routed/non-route screenshot sampling as needed;
- reconciliation with any product work after r13, especially Journey Reconnect and later final reconciliation/terminal capabilities;
- mandatory final-main reconciliation at the main developer's actual final product checkpoint.