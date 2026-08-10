# Career Mode Showdown — AI Developer Audit and Visual Regression Record

Date: 2026-08-10
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Current application version: `v1.0.1`
Current runtime revision: `1.0.1-r3`
Current main at time of this record: `ceb3161f29f4d4d384f50f458474078236edcd9c`

## Purpose of this file

This file is a public developer handoff, implementation audit, and incident record requested explicitly by the project owner after the visual work merged through PR #9 was found to be visibly unacceptable on a real iPhone.

It records:

- the recoverable chronology of this ChatGPT development conversation;
- the repository actions taken by the assistant during this conversation;
- the visual decisions and asset changes made;
- the claims made about testing and visual acceptance;
- what the automated gates actually tested;
- what the owner's real-device screenshots proved those gates failed to protect;
- the technical reasons for the current bad crops;
- the exact mistakes that the next developer must not repeat;
- the next correction criteria.

This is not claimed to be a byte-for-byte raw ChatGPT platform export. The assistant does not have a raw conversation-export API. It is the complete recoverable project chronology available to the assistant in this conversation. The owner's official ChatGPT data export, when available, remains the canonical historical transcript for older locked chats, especially:

1. `Website Creation and Guide`
2. `Career Mode Showdown Dev`

## Owner verdict on the current deployed r3 visual work

The current football-image presentation added through PR #9 is not visually accepted.

On 2026-08-10 at approximately 17:11–17:12 EDT, the owner supplied real iPhone screenshots showing the following:

- James Rodríguez on Create Showdown is cropped so high that the banner primarily shows his forehead, hair and eyes. The owner accurately described this as laughable.
- Marcus Rashford on Transfer Challenge is the worst image in the set: excessively zoomed/cropped, soft-looking and badly framed.
- Anthony Martial on Transfer Challenge has poor composition. The source contains another player who occupies substantial visual space, making Martial's supposedly dedicated hero image cluttered and weak.
- Lionel Messi on Career Statistics is at least recognizable, but the composition is still below the intended presentation quality and does not justify the earlier claim that the complete set was visually accepted.

Therefore:

- Do not treat PR #9's green workflows as proof of acceptable art direction.
- Do not treat the current deployed r3 image layout as owner-approved.
- Do not proceed to the next feature milestone until this visual regression is corrected or explicitly deferred by the owner.

## Non-negotiable project rules recovered in this conversation

The project is an existing FIFA 17 Career Mode Showdown tracker. Do not restart architecture or redesign working systems unless explicitly requested.

Authority philosophy used during this conversation:

1. Current source code is the implementation authority.
2. Later explicit owner decisions supersede older plans.
3. `PROJECT_STATE.md`
4. `ROADMAP_AMENDMENTS.md`
5. `NEXT_TASK.md`
6. Older documentation and historical planning.

Working rules repeatedly emphasized by the owner and/or adopted in this conversation:

- preserve completed gameplay and architectural decisions;
- avoid repetitive planning/development loops;
- identify root causes instead of repeatedly patching symptoms;
- preserve gameplay, storage, routing and data behavior during visual work;
- do not weaken CI gates merely to force a green result;
- keep performance constraints real rather than solving failures by raising limits;
- verify mobile, Chromebook, full desktop and windowed desktop;
- use real-browser and deterministic checks before merging;
- preserve rollback points;
- do not pretend a historical asset/source choice was recovered when it was not;
- use appropriately licensed local assets with provenance and attribution;
- do not copy official FIFA/EA UI artwork directly;
- when conversation/platform limits become a risk, maintain a handoff before context is lost.

## Core gameplay context that was preserved

Purpose: two-player FIFA 17 Career Mode Showdown tracker heavily inspired by FIFA 17's menu presentation.

Competition rules preserved throughout this work:

- exactly two participants;
- both play their own FIFA 17 Career Mode saves;
- league selected from Premier League, LaLiga, Bundesliga, Serie A or Ligue 1;
- both clubs in a Showdown come from the same selected league;
- assigned clubs remain fixed for the entire Showdown;
- club reuse is allowed across Showdowns;
- Showdowns may be one season or multi-season.

Scoring preserved:

- Champions League winner: +5;
- Domestic League winner: +3;
- Main domestic Cup winner: +1;
- 100 league points and/or 100 league goals: shared maximum +1 bonus;
- Top Scorer and/or Top Assist: shared maximum +1 bonus;
- existing tiebreak logic remains intact.

Major systems repeatedly protected from visual changes:

- Home / Continue Career;
- Create Showdown;
- League Wheel;
- Club Assignment / pack reveal;
- Showdown dashboard;
- Transfer Challenge;
- Season Entry;
- Season Summary / Review;
- Statistics;
- Legacy;
- Trophy Room;
- Rule Book;
- Settings;
- local persistence;
- Smart Back navigation;
- diagnostics;
- menu media / YouTube loading.

## Recovered long-term roadmap

The dependency sequence recovered and used in this conversation was:

`v1.0.0 Release Seal`
→ `v1.0.x Stability Lane`
→ `v1.1.0 Data Safety and Recovery`
→ `v1.2.0 Installable Offline App`
→ `v1.3.0 Local Profiles and Save Library`
→ `v1.4.0 Legacy 2.0 and Achievements`
→ `v1.5.0 Analytics 2.0`
→ `v1.6.0 Optional Content Packs`
→ `v1.7.0 Challenge Studio`
→ `v1.8.0 Cloud Readiness`
→ `v1.9.0 Cloud Backup Beta`
→ `v2.0.0 Private QR Paired Two Device Alpha`
→ `v2.1.0 Connected Rivalry`
→ `v2.2.0 Private Sharing`
→ eventual community/rankings decision gate.

The next true feature milestone remains `v1.1.0 Data Safety and Recovery`, but the owner has now rejected the current r3 visual work, so visual correction is again an active blocker before claiming the finite visual lane is accepted.

# Recoverable conversation chronology and actions

## Initial continuation / Work-limit discussion

The owner asked whether continuing development in normal Chat rather than ChatGPT Work would massively degrade quality after Work usage ran out.

The assistant stated that quality need not collapse, that the main loss was Work's autonomous multi-step execution environment, and that normal Chat could continue effectively with disciplined repository inspection and testing.

The owner asked whether the chat was in the same project/folder. The assistant confirmed project continuity.

The owner asked whether GPT-5.6 Sol High could be trusted to continue with the same attention to detail. The assistant said High remained capable of serious project work and committed to compensating with disciplined inspection/testing rather than relying on reasoning-budget labels.

## Reus main-menu and loading-screen investigation

The owner requested a full inspection of the current main menu and loading screen, determination of why the Marco Reus presentation regressed, a fix without breaking anything, deeper FIFA 17 fidelity, and continuation from the previous Work session.

### PR #6

Title: `Fix Reus presentation and restore FIFA 17 menu fidelity`

Major work:

- added a bounded `css/visual-fidelity-r2.css` layer;
- removed disabled-state dimming/desaturation from the Reus tile;
- adjusted startup image composition;
- removed negative startup placement;
- reduced excessive loading-screen darkness;
- increased normal startup hold to approximately 2700 ms while retaining a shorter reduced-motion path;
- refined Home tile and secondary surfaces toward FIFA 17-era presentation;
- intentionally avoided gameplay/storage/navigation/scoring/media/state changes.

CI detail:

- an old splash-duration contract initially rejected the longer splash;
- that contract was updated rather than undoing the intentional timing change;
- Chromium diagnostics exposed mixed runtime cache identity;
- cache coherence was fixed rather than suppressing diagnostics.

PR #6 merged.
Recorded merge commit: `cef550d0bbb1bdaf155f0b414d0d046163cccc37`.

## Reus washed-out composite issue

The owner supplied a desktop screenshot showing Reus still looked washed out/translucent.

The assistant traced this to a pale pseudo-element overlay, not literal image opacity. The overlay included a color near `rgba(229,237,239,.92)`, effectively recreating visual transparency even though the image itself had opacity 1.

### PR #7

Title: `Fix Reus main-menu composite opacity`

Changes:

- removed the pale post-render wash;
- kept diagonal FIFA-style geometry without washing over Reus;
- preserved full image opacity and normal compositing;
- added a regression contract against the old pale wash.

PR #7 merged.
Recorded merge commit: `ef9f0701a0335361b26976eef6f0e938baa1bb65`.

## Reus sharpness / responsive rendering course correction

The owner then supplied full-browser and smaller/windowed desktop screenshots and said Reus looked lower quality, more pixelated, less natural and less blended, especially in the smaller desktop window.

The owner correctly pushed the investigation away from an opacity-only framing and reminded the assistant that the previous Work session had been attempting a broader visual-immersion pass with licensed images of:

- Marcus Rashford at Manchester United;
- Anthony Martial at Manchester United;
- James Rodríguez at Real Madrid;
- Lionel Messi at Barcelona;
- a famous footballer raising an important trophy, later implemented as Philipp Lahm with the 2014 World Cup.

The assistant reframed the Reus defect as a hero-image fidelity / responsive composition / physical-pixel rendering problem rather than only opacity.

## Roadmap and old-chat recovery discussion

The owner asked the assistant to deeply study the latest roadmap from the previous Work environment and, if possible, the two old maximum-length chats `Website Creation and Guide` and `Career Mode Showdown Dev`.

The assistant recovered the post-v1 roadmap from repository documentation and used it as dependency guidance.

The assistant also explicitly stated that it could not honestly claim a full message-by-message read of locked historical ChatGPT chats merely by title. The owner requested an official account export and planned to share it later.

## Mobile Reus screenshot became the control sample

The owner supplied a mobile screenshot showing the same Reus image looked good on mobile and instructed the assistant to investigate the route of the issue more deeply.

This was an important diagnostic shift:

- the same source asset could look good;
- therefore the source image itself was not necessarily the primary defect;
- likely differences included DPR2 mobile versus DPR1 desktop, the responsive layout class, crop geometry, resampling and compositing.

### PR #8

Title: `Correct desktop Reus rendering and add windowed visual gate`

Key changes:

- preserved accepted <=700px mobile Reus rendering;
- desktop Reus moved to opacity 1, `filter:none`, normal blend, browser-native image rendering and a more natural crop;
- added Playwright Home visual auditing;
- tested 1100x720 DPR1, 1366x768 DPR1, 390x844 DPR2 and later 940x700 DPR1;
- runtime cache identity advanced to `1.0.1-r2`;
- historical release evidence was preserved rather than rewritten.

PR #8 merged.
Recorded merge commit: `a49be1e4c1760ec6f05c63c73d01af9163d84bcf`.

The Reus browser audit measured opacity/filter/crop/physical size and protected the desktop/windowed/mobile split.

## Conversation-limit continuity requirement

The owner emphasized that ChatGPT conversations and Work usage can reach limits and requested a text handoff before context is lost.

The assistant created private rolling and full handoff files during this chat and committed to updating them at major milestones.

At that point the user had not yet requested that the conversation record be public, so it was intentionally kept out of the repository.

## Owner decision: football imagery is required presentation

The owner then clarified that the football photography should not be treated as lazy/optional decoration and told the assistant not to wait for the old Work image selections if doing so would downgrade quality.

The governing architecture was changed accordingly:

- football imagery became required first-class presentation;
- the large visual subsystem stayed outside the initial HTML parse path only to preserve startup budgets;
- immediately after the critical shell starts, the subsystem is proactively warmed;
- all five image files are preloaded;
- destination screens require preparation/mounting of their visual presentation.

This was implemented through the work that became PR #9.

# PR #9 — required licensed football presentation

Final PR title: `Add required licensed FIFA-era football presentation`

Final tested PR head recorded in chat: `9ffdf24442c41ab21139e50372591a7d2649ac17`.

Merge commit: `ceb3161f29f4d4d384f50f458474078236edcd9c`.

The assistant reported all 11 PR workflows green before merge and then waited for Pages and the main Stability Lane.

The Pages build for the exact merge commit succeeded.

The main Stability Lane subsequently reported:

- `stability-contracts`: success;
- `chromium-stability`: success;
- `deployed-site-smoke`: success;
- deployed byte verification: success;
- deployed Home/Reus audit: success;
- deployed football-photo audit: success;
- deployed complete gameplay/navigation journey: success.

Those tests genuinely ran. The later visual failure is not evidence that the browser jobs were skipped. It is evidence that the visual acceptance contract was inadequate and that the assistant's manual review was too permissive.

# Final r3 image selections that were merged

## James Rodríguez — Create Showdown

Repository file: `assets/football/james-rodriguez-real-madrid-2016.webp`
Source: `James Rodríguez in September 2016 - 02.jpg`
Author: Real Madrid
License: CC BY 3.0
Derivative recorded: 863x1080
Manifest focal position: `50% 18%`

Current owner verdict: unacceptable crop on mobile. Only the upper portion of James's head/face dominates the banner.

## Marcus Rashford — Transfer Challenge

Repository file: `assets/football/marcus-rashford-man-utd-2016.webp`
Source: `Marcus Rashford.jpg`
Author: Egghead06
License: CC BY-SA 4.0
Dimensions: 742x888
Manifest focal position: `50% 18%`

This source replaced an even smaller 594x661 crop because a physical-pixel gate showed the smaller derivative was too close to high-DPR upscaling.

Current owner verdict: worst image in the deployed set. The real-device screenshot shows an over-cropped, soft-looking face with poor framing.

## Anthony Martial — Transfer Challenge

Repository file: `assets/football/anthony-martial-man-utd-2017.webp`
Source: `Anthony Martial 27 September 2017.jpg`
Author: Dmitry Golubovich
License: CC BY-SA 3.0
Source dimensions recorded: 1500x1000
Derivative: 1200x800
Manifest focal position: `50% 28%`

This source replaced a smaller Martial candidate after DPR2 testing exposed about 5.3% runtime upscaling.

Known compromise already documented before merge: this is a 2017 image rather than exact FIFA 17 season imagery.

Additional defect now clear from the owner's screenshot: the source composition includes another player occupying substantial visual space, so it was a poor art-direction choice even though its resolution and licensing were valid.

## Lionel Messi — Career Statistics

Repository file: `assets/football/lionel-messi-barcelona-2016.webp`
Final source: `Save the Dream at the Match of Champions (31791513341).jpg`
Author: Save the Dream
License: CC BY 2.0
Dimensions: 960x810
Manifest focal position: `55% 10%`

Several earlier alternatives were tried and rejected during development because they failed different desktop/windowed/mobile compositions. The final source made Messi recognizable, but the owner's real-device screenshot demonstrates that recognizability alone was not enough to justify claiming the Statistics hero had reached the intended quality.

## Philipp Lahm — Trophy Room

Repository file: `assets/football/philipp-lahm-world-cup-2014.webp`
Author: Agência Brasil
License: CC BY 3.0 BR
Derivative: 1600x829
Subject: Philipp Lahm lifting the 2014 World Cup.

The owner did not include Trophy Room in the current regression screenshots, so this incident record does not make a new visual-quality judgment about Lahm.

# Required-visual loading architecture implemented in r3

Relevant files include:

- `data/footballVisuals.js`
- `js/footballVisuals.js`
- `css/footballVisuals.css`
- `assets/football/asset-manifest.json`
- `THIRD_PARTY_NOTICES.md`
- `tests/browser/football-visual-audit.cjs`

The renderer:

- initializes a required football visual manifest;
- preloads all football assets;
- creates screen-specific figure panels;
- uses a `.footballVisualMediaFrame` and `.footballVisualMedia` image;
- sets the image to eager load inside the already-warmed subsystem;
- mounts imagery into Create Showdown, Transfer Challenge, Career Statistics and Trophy Room.

The target screens are intentionally not allowed to silently omit the presentation if the required subsystem cannot prepare.

# Performance limits preserved during r3

The assistant did not raise the established hard startup/image budgets simply to make the new visuals fit.

Recorded limits:

- eager startup JS raw <= 165,000 bytes;
- gzip-equivalent <= 37,500 bytes;
- combined first-party startup <= 260,000 bytes;
- each required photo <= 360,000 bytes;
- aggregate required football photos <= 1,100,000 bytes.

The final five-image payload was recorded at approximately 890,532 bytes.

This performance discipline was reasonable. The visual regression came from crop/art-direction and gate-design failures, not from exceeding the payload budget.

# What the football browser gate actually tests

The relevant gate is `tests/browser/football-visual-audit.cjs`.

It runs these classes:

- 1366x768 DPR1 desktop;
- 940x700 DPR1 windowed/near-breakpoint desktop;
- 390x844 DPR2 mobile reference.

It checks that:

- the required images are proactively requested;
- target screens mount the expected number of image panels;
- every image decodes;
- every image reaches essentially full opacity;
- the visual host remains inside the viewport;
- there is no horizontal page overflow;
- the image's rendered box is not too small;
- physical-pixel cover scale does not require material source upscaling beyond `1.02x`;
- `object-fit` remains `cover`;
- `image-rendering` remains browser-native;
- `mix-blend-mode` remains `normal`;
- CSS `filter` remains `none`;
- page errors, console errors and first-party request failures are absent;
- screenshots are saved for Create, Transfer, Statistics and Trophy Room.

## Critical limitation of that gate

It does not test whether the intended human subject remains visibly and aesthetically framed inside the crop.

It does not know where James Rodríguez's head, eyes, torso or body are located.

It does not know that Rashford's face is cropped badly.

It does not know that Martial shares the frame with an opposing player who visually competes with him.

It does not know whether the player occupies an appropriate percentage of the hero.

It does not measure how much of the source image is discarded by `object-fit:cover`.

It does not compare the rendered screenshot against an owner-approved visual baseline.

Therefore it can correctly report that an image is high-resolution, decoded, full-opacity and not upscaled while the actual composition is terrible.

# Why James and Rashford are cropped so badly

This is the most important technical finding from the owner's real-device screenshots.

The CSS uses:

```css
.footballVisualMedia {
    width:100%;
    height:100%;
    object-fit:cover;
    object-position:var(--football-visual-position,50% 30%);
}
```

On mobile, `@media(max-width:480px)` reduces the single-player hero minimum height to about 175px and each stacked Transfer panel to about 142px.

That creates extremely wide banners.

James is an 863x1080 portrait, aspect ratio about 0.80:1, but the mobile Create hero is roughly a 2:1-to-4:1 wide banner depending on the actual available content width.

Rashford is a 742x888 portrait, aspect ratio about 0.84:1, but the stacked mobile Transfer panel is also a wide banner.

Both manifest entries use:

`position: "50% 18%"`

With `object-fit:cover`, the browser scales the portrait until its width covers the banner, leaving the image much taller than the banner. Most of the vertical source is then discarded. Because the focal point is only 18% from the top, the crop strongly favors the upper portion of the portrait.

The result is exactly what the owner supplied:

- James: forehead/hair/eyes dominate, the rest of the portrait is missing;
- Rashford: head/face are over-cropped and the image reads as an accidental zoom rather than intentional art direction.

This is not a source-resolution problem. In fact the physical-resolution gate encouraged selection of larger sources while remaining blind to the crop itself.

# Why the physical-pixel gate passed anyway

The gate calculates approximately:

`physicalWidth = renderedWidth × devicePixelRatio`

`physicalHeight = renderedHeight × devicePixelRatio`

and compares those against natural image dimensions.

This is useful for detecting softness caused by source upscaling. It successfully found earlier too-small Rashford/Martial candidates.

However, source upscaling and crop quality are different problems.

A large portrait can have ample native pixels and still be cropped catastrophically when forced into a very wide `cover` box.

The current gate proves only that the browser does not need to invent many pixels. It does not prove that the correct pixels are visible.

# Manual-review failure by the assistant

During PR #9 the assistant repeatedly stated that generated screenshots had been manually inspected.

The final claim before merge was essentially that the 12 rendered screenshots — Create, Transfer, Statistics and Trophy Room across desktop/windowed/mobile — showed James, Rashford, Martial, Messi and Lahm visibly present and correctly framed.

The owner's real-device screenshots contradict that quality judgment, especially for James and Rashford.

The correct conclusion is not that automated browser tests were skipped. They were run.

The correct conclusion is:

1. the automated tests were insufficient for semantic/focal composition;
2. the assistant's manual visual acceptance was too permissive and should not have been presented as strong proof of quality;
3. merging PR #9 as visually accepted was a quality-control mistake.

Future developers must not cite those green r3 gates as evidence that the image composition is acceptable.

# Additional implementation concern visible in the owner's screenshots

The Create Showdown screenshot also shows an application error toast containing:

`undefined is not an object (evaluating 'contentScriptData.init_ts')`

That text resembles a browser/content-script environment failure rather than an obvious Career Mode Showdown-owned symbol, but this incident file does not assume its source. It should be traced separately if reproducible. Do not dismiss it without reproduction, and do not automatically attribute it to core app code without evidence.

# Corrective design requirements for the next developer

## 1. Do not solve this with more blind object-position tweaking

The current defect is structural. Portrait photos are being asked to fill ultra-wide mobile banners.

Moving `18%` to `30%`, `40%` or another number may show a different portion of the face but does not make the source/banner aspect ratios compatible.

## 2. Prefer source composition that matches the target panel

For wide mobile/desktop heroes, prefer:

- landscape photographs;
- action photographs with safe space around the player;
- close-ups whose subject remains valid when cropped to the actual target aspect ratio;
- or purpose-built local derivatives cropped per target presentation class.

A high-resolution portrait is not automatically a high-quality hero asset.

## 3. Dedicated derivatives are acceptable and likely preferable

The repository already uses local licensed derivatives. Create separate optimized crops for target aspect ratios when one original cannot support every layout.

For example, one licensed original may produce:

- desktop/windowed hero crop;
- mobile hero crop.

The derivative manifest must retain full attribution/provenance.

This is preferable to forcing one portrait through `object-fit:cover` everywhere.

## 4. Add semantic focal-region contracts

A stronger deterministic gate can be built without requiring face-recognition AI.

For each asset, the manifest can define a manually approved focal rectangle in natural-image coordinates, for example:

```js
focalRegion: { x: 0.30, y: 0.08, width: 0.38, height: 0.58 }
```

The browser or Node test can mathematically calculate the actual source rectangle visible after `object-fit:cover` and `object-position` for each viewport.

Then assert that a required percentage of the approved focal rectangle remains visible.

This would have failed the current James/Rashford layouts even though their source resolution is adequate.

## 5. Add crop-loss limits where appropriate

The test should report:

- visible source rectangle;
- percentage of source width retained;
- percentage of source height retained;
- percentage of approved focal region retained.

Do not make one universal crop percentage mandatory because deliberate hero crops vary, but report it and combine it with focal-region requirements.

## 6. Owner-approved visual baselines should become real gates

Once the owner approves a screenshot for a viewport, store a visual baseline or otherwise make that accepted composition reproducible.

Do not call screenshot creation itself a visual regression gate.

A screenshot artifact that nobody correctly judges is only evidence capture, not quality assurance.

## 7. Add real mobile composition acceptance before merge

At minimum, before any replacement PR is merged, inspect:

- Create Showdown James replacement on 390x844 DPR2-equivalent layout;
- Transfer Rashford and Martial replacements on 390x844 DPR2-equivalent layout;
- Statistics Messi on the same mobile layout;
- 940x700 windowed desktop;
- 1366x768 desktop/Chromebook.

The owner should be shown or asked to inspect the final live candidate if visual quality is the acceptance criterion.

## 8. Preserve the working Reus correction

Do not damage the accepted Reus desktop/windowed/mobile split while repairing these other football heroes.

PR #8's Reus work was a separate responsive-rendering problem and should remain independently gated.

# Current safe technical facts after this incident

- Main currently contains PR #9 at merge `ceb3161f29f4d4d384f50f458474078236edcd9c`.
- The deployed r3 runtime is technically functional according to the existing automated suites.
- The deployed r3 football-image art direction is not owner-approved and is now explicitly rejected.
- Existing image-resolution, licensing, request, overflow and runtime gates should remain; they caught real technical issues.
- Those gates must be augmented rather than discarded.
- Gameplay/scoring/storage/routing behavior was not intentionally changed by PR #9 and should remain untouched during the correction.

# Public accountability note

The owner specifically requested this public record because the quality of the merged image presentation was unacceptable and because the next developer must be able to see what the previous assistant actually changed rather than inheriting a misleading "all green / visually accepted" narrative.

That request is valid.

The next developer should treat this file as a correction to any earlier documentation that describes r3 football imagery as visually accepted.

Technical test success and visual-art-direction success were conflated during PR #9. The current real-device screenshots demonstrate that they are not the same thing.

# Immediate next task

Do not begin `v1.1.0 Data Safety and Recovery` yet unless the owner explicitly chooses to defer this regression.

First:

1. reproduce the owner's mobile crops from current `main`;
2. design/select better image compositions for James, Rashford, Martial and Messi;
3. avoid forcing incompatible portrait sources into ultra-wide `cover` banners;
4. add focal-region/crop-quality contracts;
5. run all existing product/stability tests unchanged;
6. run the strengthened image composition tests;
7. inspect final desktop/windowed/mobile screenshots critically;
8. obtain owner visual acceptance before calling the replacement complete;
9. only then return to the long-term roadmap.

End of public audit record.