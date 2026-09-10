# START NEXT VISUAL SESSION — R8.26 COMPLETE PROPOSAL + ASSET BUILD SAFE TRANSFER

Status: SAFE TRANSITION POINT

This is the first file the next visual developer must read.

## 0. Owner clarification that overrides ambiguous earlier wording

The visual track does NOT own production implementation.

Its complete job is to produce a final-product-quality visual proposal package containing all planning, all required assets, all responsive/state variants, proposal-only reference compositions/code, QA evidence, and exact senior-developer implementation instructions.

The visual track may study the live/current website and repository as deeply as needed. It must not modify or deploy the live/main website.

Production implementation happens only after the visual proposal is complete and is handed to the senior developer for final review, adaptation, bug fixing, approval and intentional integration.

Inside this visual track, any use of words such as "implement," "integrate" or "build" must mean proposal-only composition/assembly inside:

`visual-proposal/r8-complete-product/`

unless the text explicitly says "senior developer production implementation."

Do not edit `main`. Do not deploy Pages. Do not merge PR #238 as the visual-track deliverable.

---

## 1. Current exact authority at transfer

Repository:

`nikahanghojjati-oss/fifa17-career-showdown2`

Production main reverified immediately before this transfer:

`cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`

Current product/runtime at that main anchor:

- app `v1.9.1`
- runtime `1.9.1-r12`
- MDP recorded on main: `70.30/100`
- SSJR recorded on main: `0/100`

Isolated visual branch:

`developer/r8-25-home-global-first-slice-r12`

Proposal workspace head immediately before committing this transfer file:

`ece5b1588a409f13e39230727c96826deafe23a5`

Draft PR:

`#238` — `Visual R8.25: bounded black/gold Home integration on r12`

PR #238 state at transfer:

- open;
- draft;
- base `main` = `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`;
- head immediately before this transfer file = `ece5b1588a409f13e39230727c96826deafe23a5`;
- no submitted reviews at last check;
- not approved for merge;
- should be treated as historical/prototype evidence, not the final visual deliverable.

The next visual developer must independently resolve current `main` and current proposal-branch head at session start. The main developer may advance the product in parallel.

---

## 2. Canonical proposal workspace

From this transfer onward, remaining visual-track writes belong under:

`visual-proposal/r8-complete-product/`

Start with:

1. `README.md`
2. `ASSET_BUILD_MATRIX.md`
3. `QA_AND_PROTOTYPE_FINDINGS.md`
4. `SENIOR_DEVELOPER_FINAL_HANDOFF_REQUIREMENTS.md`
5. this transfer file

Subdirectories already established:

- `assets/` — final proposal assets and manifest material;
- `prototypes/` — presentation-only final-product-quality reference compositions/code;
- `evidence/` — screenshots, hashes, contrast checks, responsive/state QA and final-main reconciliation evidence.

Earlier root-level sources remain useful research authority:

- `/VISUAL_R8_COMPLETE_PRODUCT_PROPOSAL.md`
- `/VISUAL_R8_COMPLETE_PRODUCT_INVENTORY.json`

Absorb their useful content into the folder over time. Do not treat their location outside the proposal workspace as permission to continue production-path editing.

---

## 3. What was completed before transfer

The design track is no longer only a Home redesign.

The current proposal authority covers the complete known product, including all 13 current routed screens:

1. `mainMenu`
2. `createShowdown`
3. `leagueWheelScreen`
4. `clubWheelScreen`
5. `dashboard`
6. `transferChallenge`
7. `seasonEntry`
8. `seasonSummary`
9. `statistics`
10. `careerStatistics`
11. `trophyRoom`
12. `legacy`
13. `ruleBook`

It also explicitly includes substantial non-route surfaces and state families:

- startup/loading;
- global header/season indicator;
- runtime notices;
- menu media/soundtrack;
- Settings;
- Save Library;
- Local Profiles/identity linking;
- Connected Account;
- Registered Device & Pairing;
- Connected Rivalry;
- Private Remote Joining;
- backup/export;
- import analysis;
- Atomic Restore & Recovery;
- offline/update;
- local/shared variants;
- shared setup;
- shared Career Start;
- shared Transfer Challenge;
- shared Season Results;
- shared Season Commit;
- Shared Canonical Scoring;
- Shared History Convergence;
- empty/loading/error/stale/revoked/waiting/reconnecting/reduced-motion states.

The visual language is established as original black/charcoal + warm gold, rights-safe/system typography, FIFA-17-era competitive energy without copying proprietary EA screens/fonts/crests/audio/assets, and a strict hierarchy where gameplay/emotional screens can be cinematic while provider/data/recovery screens remain clearer and more technical.

---

## 4. Critical clarification: planning is not the final proposal by itself

Do NOT say the final proposal is complete merely because the screen-by-screen design plan exists.

The final proposal contains planning + required assets + proposal-only compositions + QA + final-main reconciliation + senior implementation map.

Asset production is a required stage of this same proposal.

The correct rule is:

- random/unjustified image generation remains CLOSED;
- required asset production remains OPEN and mandatory;
- a new image is generated only when a screen-specific brief proves the visual role is required;
- the proposal cannot close while any required asset role is blank, placeholder-only or unverified.

Image generation must be directed by GPT-5.6 Sol's screen-specific design decision. Do not let the image generator invent the product direction or generate a random image after each work session.

---

## 5. Frozen character authority

Approved source masters are immutable.

A01 Nik:

- ID `A01_NIK_CORE_THINKING_HERO`
- expected SHA-256 `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`
- 1086x1448 RGBA

A02 Daniel:

- ID `A02_DANIEL_CORE_POINTING_HERO`
- expected SHA-256 `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`
- 1086x1448 RGBA

Fixed manager mapping everywhere:

- Manager 1 = Daniel
- Manager 2 = Nik

Never substitute raw photographs for these approved AI character identities.

Never regenerate A01/A02 because a composition is inconvenient.

Use crops/masks/derivatives first. Generate a new pose only when the screen contract proves a distinct role cannot be solved from the approved masters or a character-free layout.

When new character generation is justified, first write a bounded brief containing:

- exact screen/state;
- character/manager;
- pose/action;
- expression;
- camera/crop;
- background/transparency requirement;
- dimensions;
- left/right/center safe zones;
- prohibited overlap zone;
- rights-safe requirements;
- identity/anatomy acceptance tests.

Then generate only that asset.

---

## 6. Existing isolated prototype: use as evidence, not production mandate

The draft branch contains a bounded R8 Home/global prototype outside the new proposal folder. It is useful because it established working visual tokens and exposed real integration problems.

Do not continue treating those production-path CSS/JS files as this visual track's final implementation surface.

Useful lessons from the prototype:

- black/gold token system is viable;
- central Home safe zone with A02 Daniel left / A01 Nik right is viable at large widths;
- large character art should disappear before controls compress, currently <=1179px in the prototype;
- decorative art must be `aria-hidden`, pointer-inert and non-focusable;
- generic global JS helper names can collide with existing release code, so reference code must be R8 namespaced;
- the startup budget was successfully reduced to 37494 compressed bytes under the protected 37500 ceiling at the validated prototype checkpoint.

Do not interpret these as approval to deploy the draft branch.

---

## 7. Known QA defect that must carry forward

The full browser proof uncovered a serious cross-page contrast defect in the isolated prototype.

With the new dark global shell, existing Legacy `.legacySectionHeading` text inherited approximately `#20272d` over `#080b0e`, producing about 1.3:1 contrast where 4.5:1 was expected.

This must be solved in the proposal/reference design, not patched into `main` by the visual track.

The lesson is wider than one selector: when moving the global shell to black, every existing light-theme text/state surface must be checked in ordinary, empty, corrupt, fail-closed, data-management and recovery states.

See `QA_AND_PROTOTYPE_FINDINGS.md`.

---

## 8. Current prototype validation evidence

At exact prototype head `eb136ed2bfbc6d6ea5f124edd66813cba3fdbf62`, the selected deterministic product census passed 77 of 78 contracts.

The only deterministic contract failure was the intentionally absent exact A01 binary required by the prototype R8 visual contract.

The Home visual proof likewise failed because the frozen A01 file was absent from the branch.

The FULL browser bundle then exposed the separate Legacy contrast defect described above.

Therefore:

- no unknown gameplay/storage/provider regression was identified at that checkpoint;
- the prototype was still not visually acceptance-ready;
- do not claim green CI or senior approval;
- do not weaken the binary/hash or accessibility requirements merely to make the draft branch green.

---

## 9. Required next-session work order

The next visual developer should proceed in this order.

### A. Re-anchor to current product read-only

Independently resolve current `main` and study any product changes since `cef2e101…`.

If routes, overlays, controls or shared states changed, update the proposal inventory before asset work for the affected surfaces.

Do not patch `main`.

### B. Finish proposal normalization inside the folder

Move/translate the root complete-product design authority into organized folder documents so the proposal workspace becomes self-contained.

Recommended structure:

- `design-system/`
- `screens/`
- `surfaces/`
- `assets/`
- `prototypes/`
- `evidence/`
- `implementation-map/`

One screen document per routed screen is acceptable and preferred once detail grows.

### C. Resolve the asset matrix screen by screen

Use `ASSET_BUILD_MATRIX.md` as the queue.

For each screen/surface:

1. determine whether existing DOM/CSS is sufficient;
2. determine whether an original procedural/SVG/icon asset is required;
3. determine whether an A01/A02 crop/derivative is required;
4. only if still necessary, write a generation brief and create the new image asset;
5. package it under `assets/`;
6. hash it and record provenance/rights/safe zones/responsive use;
7. mark the role resolved.

Do not generate whole fake webpage screenshots as primary assets. Build isolated reusable assets first, then composite/reference them against the exact real product structure.

### D. Build proposal-only final-product compositions

Use `prototypes/` to demonstrate how the final UI should actually look.

These should be close enough to final product that the senior developer can review quickly and integrate without guessing.

They remain proposal artifacts only.

### E. QA continuously

Store evidence under `evidence/`.

At minimum verify:

- wide desktop;
- reduced-wide desktop;
- Chromebook/tablet;
- mobile;
- normal/reduced motion;
- focus/keyboard;
- dialog focus;
- contrast;
- overflow;
- art/control safe zones;
- local/shared variants;
- empty/error/waiting/recovery/destructive states;
- exact asset hashes;
- rights/provenance;
- Manager 1 Daniel / Manager 2 Nik identity;
- no baked mirrored UI text;
- no extra-hand/anatomy defects on generated human art.

Fix proposal defects in the proposal package and reverify.

### F. Keep tracking the main developer without merging tracks

The main product may advance while this proposal is being built.

Study new `main` as needed to keep the proposal aligned, but do not let ongoing product development repeatedly reset visual work that is unaffected.

The mandatory full reconciliation happens only when the main developer reaches the final product checkpoint.

### G. Final-main reconciliation

At the main developer's finishing point:

- resolve exact final `main`;
- inventory every final screen/surface/state;
- compare against the proposal folder;
- add/adapt anything missing;
- rerun proposal QA;
- record the exact final-main commit.

Only then may the visual proposal approach final status.

### H. Final senior-developer handoff

When planning, assets, compositions, QA and final-main reconciliation are all complete, create the final senior-developer handoff prompt.

It must point to:

`visual-proposal/r8-complete-product/`

The senior developer then owns production review, final bug fixes/adaptation, approval, actual implementation into the live codebase, CI, merge and deployment.

---

## 10. Product/domain locks that the proposal must preserve

Do not alter or redesign semantics for:

- exactly two managers;
- same league;
- different permanent clubs;
- 1/3/5/10 season lengths;
- CL +5;
- league +3;
- main cup +1;
- 100 points/goals combined bonus max +1;
- Top Scorer/Top Assist combined bonus max +1;
- maximum season score 11;
- zero-zero tiebreak only;
- Save Library authority;
- routing authority;
- local-first recovery;
- connected account/pairing/rivalry/Remote Joining authority;
- provider-authoritative shared-play state;
- permanent zero-dollar operation;
- Firebase Spark only;
- billing off;
- no Blaze;
- no Cloud Functions;
- no Cloud Run;
- no public lobby/discovery/community/rankings.

The visual proposal changes presentation and UX clarity, not domain rules.

---

## 11. Rights-safe locks

Do not introduce:

- official club crests;
- proprietary EA/FIFA fonts;
- copied FIFA menu screens as assets;
- copied menu audio;
- downloaded soundtrack files;
- unlicensed footballer photography as new proposal assets.

The target is FIFA-17-era energy and UX inspiration, not asset copying.

Existing product media governed by existing product authority is studied/preserved separately and is not a license to add new copyrighted material.

---

## 12. True finish line

The visual track is finished only when all of these are true at the same time:

1. final product structure has been reconciled against final `main`;
2. every page and substantial surface has a complete visual contract;
3. every required asset has been built/generated and packaged;
4. A01/A02 and all other binary assets have verified hashes/provenance;
5. proposal-only final compositions/reference implementation are complete;
6. responsive/state/accessibility/rights QA is green;
7. known proposal bugs are fixed;
8. senior implementation mapping is complete;
9. a concise final senior-developer handoff prompt points to this folder.

Until then, status is ACTIVE VISUAL PROPOSAL, not FINAL.

---

## 13. Session transition instruction

This R8.26 document marks a safe session transition, not the end of the visual project.

Next developer: continue from this folder, preserve the hard production boundary, and move the proposal forward toward complete asset production and final-product-quality reviewability. Do not restart the visual direction, do not randomly generate images, and do not push visual-track changes into `main`.
