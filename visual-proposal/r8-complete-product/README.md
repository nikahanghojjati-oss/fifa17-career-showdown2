# R8 Complete Product Visual Proposal Workspace

Status: ACTIVE PROPOSAL WORKSPACE — NOT PRODUCTION AUTHORITY

This folder is the only intended work surface for the remaining Career Mode Showdown R8 visual-proposal track.

## Hard boundary

The visual track may:

- inspect `main`, production Pages, current DOM, runtime modules, tests and product states;
- design every routed screen and substantial non-route surface;
- build and generate every rights-safe asset required by the proposal;
- create responsive compositions, prototypes, presentation-only reference code, screenshots and QA evidence inside this folder;
- identify product-facing visual defects and record exact implementation requirements;
- package the finished proposal so a senior developer can review it briefly and implement/approve it against the then-current product.

The visual track must NOT:

- modify `main`;
- merge a PR into `main`;
- deploy GitHub Pages;
- change production Firebase/Firestore, routing, storage, scoring, Save Library, pairing, Remote Joining or shared-play authority;
- treat proposal CSS/JS as production authority;
- claim the final proposal is finished before final-product reconciliation against the main developer's finished product.

Within this visual track, the word "implementation" means only proposal assembly, asset composition or prototype integration inside this proposal workspace. Production implementation belongs to the senior developer after proposal handoff.

## Current live study anchor

At the transition checkpoint:

- repository: `nikahanghojjati-oss/fifa17-career-showdown2`
- production `main`: `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`
- product: `v1.9.1`
- runtime: `1.9.1-r12`
- visual study branch / draft PR: `developer/r8-25-home-global-first-slice-r12` / PR #238
- branch checkpoint before this workspace: `eb136ed2bfbc6d6ea5f124edd66813cba3fdbf62`
- PR #238 remains draft and must not be merged as the visual-track deliverable.

These anchors are historical orientation only. Every successor session must independently resolve current `main` before using live structure as design authority.

## Existing proposal authorities

The earlier root-level files remain source material until their content is fully absorbed into this workspace:

- `/VISUAL_R8_COMPLETE_PRODUCT_PROPOSAL.md`
- `/VISUAL_R8_COMPLETE_PRODUCT_INVENTORY.json`

Do not interpret those root files as permission to publish the existing R8 branch prototype. The final deliverable is this folder's complete proposal package.

## Completion model

The final visual proposal is one inseparable package containing:

1. current-product research and final screen/surface inventory;
2. complete UI/UX design system and page-by-page specifications;
3. every required asset, including character masters/derivatives, procedural graphics, original icons or backgrounds where required;
4. exact asset manifest, dimensions, hashes and usage maps;
5. responsive and state variants;
6. accessibility, interaction, motion and rights-safe QA evidence;
7. implementation mapping for the senior developer;
8. final reconciliation against the main developer's finished product;
9. final senior-developer handoff prompt pointing to this folder.

The proposal is NOT complete if planning is finished but required assets are missing. It is also NOT complete if assets exist but final-main reconciliation has not occurred.

## Immediate successor direction

Read `START_NEXT_VISUAL_SESSION_R8_26_COMPLETE_PROPOSAL_ASSET_BUILD_SAFE_TRANSFER.md` in this folder first. Continue proposal and asset production here only. Do not modify production paths merely to make a prototype test green.
