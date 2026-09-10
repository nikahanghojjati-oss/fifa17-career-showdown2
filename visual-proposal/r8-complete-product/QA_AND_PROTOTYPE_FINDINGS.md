# R8 Proposal QA and Prototype Findings

Status: OPEN LEDGER FOR PROPOSAL DEVELOPMENT

This file records what the isolated R8 branch prototype has taught the visual track. Findings are proposal evidence, not permission for this track to patch or deploy the production website.

## Exact study checkpoint

Prototype branch checkpoint used for the latest validation:

`eb136ed2bfbc6d6ea5f124edd66813cba3fdbf62`

Production main at that checkpoint:

`cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`

PR #238 remained draft with no review submissions or inline review threads at the last checked state.

## What passed on the isolated prototype

The exact-head deterministic census reached 77/78 selected product contracts before the frozen binary requirement stopped the R8 visual contract.

Confirmed green evidence included:

- static release startup budget: 163070 raw / 37494 compressed bytes;
- startup compressed ceiling remained <= 37500;
- shared setup / Career Start / Transfer Challenge / Season Results / Season Commit / Canonical Scoring / History Convergence deterministic product contracts;
- Save Library and identity-safe analytics contracts;
- zero-billing Firebase/Spark constraints;
- connected account, pairing, Connected Rivalry and Remote Joining contracts;
- navigation/focus/reduced-motion baseline contracts;
- many existing visual and offline proofs.

Do not reinterpret these passes as senior approval of the final R8 proposal. They only prove that the prototype did not break those tested authorities at that exact checkpoint.

## Frozen A01/A02 binary gap

The deterministic R8 contract failed because the branch did not contain the exact frozen A01 binary at:

`assets/visual/r8/a01-nik-core-thinking-hero.png`

The Home browser visual proof also failed because A01 did not load. A02 is likewise required by the frozen Home contract.

This is not a reason to generate replacements. The exact approved masters already exist as source authority and must be copied byte-for-byte into the final proposal asset package when materialization is available.

Expected hashes:

- A01: `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`
- A02: `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`

## Real cross-page defect discovered by FULL browser proof

The isolated black/gold prototype changes the global background to near black. Existing Legacy CSS still gives `.legacySectionHeading` the old `var(--f17-ink)` text color.

In the corrupt-Legacy fallback browser fixture this produced approximately:

- foreground: `#20272d`
- background: `#080b0e`
- contrast: 1.3:1
- expected automated accessibility threshold: 4.5:1

This is a serious proposal defect for the future senior integration.

Required proposal resolution:

- Legacy section headings need an R8-scoped high-contrast treatment, normally cream/white with the gold left rule retained;
- verify ordinary Legacy, empty Legacy, corrupt/fail-closed Legacy, import analysis and restore/recovery states separately;
- do not fix one selector and assume all inherited light-theme text remains readable on the dark global shell;
- include automated color-contrast validation in the final proposal QA package.

The visual track must record/fix this in proposal compositions/reference CSS only. Production-path application belongs to the senior developer.

## Previous code collision already learned

An earlier R8 helper named `activate()` collided with an existing static-release symbol. The isolated prototype was corrected by using an R8-specific helper name.

Permanent proposal lesson:

- all reference JS identifiers must be R8 namespaced;
- senior implementation should avoid generic global helper names;
- presentation reference code must not create a second authority layer.

## Responsive lesson

The current Home prototype intentionally removes large A01/A02 character art at widths <=1179px. This matches the owner goal of keeping Chromebook/mobile controls visible and prevents hero art from pushing actions below the useful viewport.

Carry this principle to all screens: decorative assets disappear before controls or readable state are compressed.

## Character-art lesson

The approved Nik and Daniel masters are identity authority. The visual track must not substitute raw user photos, duplicate Nik in Daniel's slot, or regenerate existing masters simply to solve composition problems.

Manager-label lock:

- Manager 1 = Daniel
- Manager 2 = Nik

## Transfer-art lesson

Previous visual attempts produced mirrored/baked text on transfer-board/paper imagery. Final proposal assets must avoid baked core UI text. Transfer labels, numbers and names should remain real DOM text over rights-safe graphic surfaces.

## Season-art lesson

Previous visual attempts produced anatomy/extra-hand artifacts. If a future generated celebratory character asset is actually required, hands, limbs, ball contact and cropping must receive explicit visual QA before acceptance.

## Final proposal QA requirements

Before senior handoff, verify at minimum:

- exact final route/surface inventory versus then-current `main`;
- wide desktop;
- reduced wide desktop;
- Chromebook/tablet;
- mobile;
- ordinary and reduced motion;
- keyboard focus and dialog focus ownership;
- color contrast on normal, empty, corrupt, error, waiting, disabled and destructive states;
- no decorative hit targets/focusables;
- no primary controls hidden by art;
- no baked mirrored UI text;
- character identity and Manager 1/Manager 2 mapping;
- rights/provenance manifest;
- exact hashes for packaged binary assets;
- no visual persistence/provider/billing authority;
- local and shared variants on canonical screens;
- final-main reconciliation after the main developer finishes product work.

A QA failure is fixed in the proposal package and reverified. It does not authorize this visual track to patch or deploy production.
