# R8.25 Proposal Finish — Exact Home + Global Selective Integration Blueprint

Status: PROPOSAL-COMPLETE IMPLEMENTATION BLUEPRINT / NO PRODUCTION ACTIVATION

Controller: GPT-5.6 Sol reasoning

Image generation: CLOSED

## 1. Why R8.25 exists

R8.24 completed the visual system, screen/state mapping, responsive safe zones, accessibility review and master-developer handoff. The remaining proposal weakness was not visual ideation. It was that the first selective production slice was described mostly in prose.

R8.25 closes that gap by pinning the first implementation slice to the exact current r11 Home/global DOM and providing concrete proposal-only CSS, decorative-layer JavaScript, asset-path authority and acceptance criteria.

This file does not authorize a whole-branch merge, production deployment or any gameplay/storage/Firebase mutation.

## 2. Re-resolved live authority

Verified before this blueprint:

- live `main`: `32723b900dee45f689391908dc976f0ce5d06dd5`
- runtime / asset revision: `1.9.1-r11`
- visual branch before the R8.25 write batch: `8cdc4975a70b6c99b379f3fcb847cb4c0b8d70af`
- production Home DOM authority: `index.html`
- production base CSS: `css/app.css`
- production bounded Home/loading override: `css/visual-fidelity-r3.css`
- production Home behavior: `js/menuExperience.js`
- production startup/bootstrap: `js/app.js`

Current `main` still matches the R8.24 observed r11 DOM/CSS/runtime baseline.

## 3. Exact current Home facts that the implementation must reconcile

The Home surface is not a blank mockup. Current production contains:

- `#mainMenu`
- `.fifaMenuShell`
- `.fifaMenuHeading`
- `.fifaMenuGrid`
- six real button controls:
  - `#continueCareer`
  - `#newShowdown`
  - `#legacyButton`
  - `#careerStatisticsButton`
  - `#ruleBookButton`
  - `#settingsButton`
- a real `.menuMusicTile` with runtime-created media selector buttons and YouTube player behavior
- `.menuBottomStrip`

`js/menuExperience.js` currently injects a Marco Reus photo treatment into `#continueCareer` through `.menuCoverAthlete`, plus `#menuAthleteCredit` after the grid.

`js/app.js` currently loads `css/visual-fidelity-r3.css`, which contains the accepted protected loading composition and the current Reus Home treatment.

R8.25 therefore does not pretend that the R8 layer can simply be stacked blindly on top of an empty page.

## 4. First-slice cutover decision

For the first selective R8 integration:

1. preserve the current protected loading presentation and startup Reus treatment;
2. leave `js/menuExperience.js` behavior intact initially;
3. load the R8 proposal stylesheet after `visual-fidelity-r3.css` so R8 has presentation precedence on Home/global selectors only;
4. activate R8 through a single root dataset gate: `html[data-r8-visual="active"]`;
5. on Home only, hide the injected `.menuCoverAthlete` and `#menuAthleteCredit` while the R8 gate is active;
6. replace the visible Home hero rhythm with frozen A02 Daniel on the left and A01 Nik on the right through a separate noninteractive final-art layer;
7. keep all six menu buttons, media controls, labels, states and dynamic text as live DOM;
8. do not delete the Reus code path in the first slice. Retiring redundant legacy Home treatment can be a later cleanup after integrated acceptance.

This prevents a crowded three-person Home composition while minimizing behavioral risk.

## 5. Proposal implementation files

The concrete proposal bundle is:

- `implementation/r8-black-gold-presentation.proposed.css`
- `implementation/r8-final-art-layer.proposed.js`
- `implementation/R8_25_ASSET_PATH_MANIFEST.json`

These are reviewable source proposals. They are deliberately not linked from production `index.html` on the visual branch.

## 6. CSS integration order

Recommended first implementation order on the developer branch:

1. existing `css/app.css`
2. existing `css/visual-fidelity-r3.css`
3. adapted production copy of `r8-black-gold-presentation.proposed.css`
4. existing runtime scripts
5. adapted production copy of `r8-final-art-layer.proposed.js`

The R8 stylesheet is root-gated so the developer can land the code disabled, inspect it, then enable the gate in the bounded implementation branch.

## 7. Global shell scope

The first slice may style only presentation concerns on:

- `#background`
- `#overlay`
- `#topHeader`
- `.brand`
- `.seasonIndicator`
- `main`
- `.screen>h2`
- `footer`
- common buttons/focus indicators where no semantic state is altered
- `#appRuntimeNotice` dismiss focus visibility

It may not change routing, screen visibility, app initialization or state semantics.

The black/gold token direction remains:

- black `#080b0e`
- ink `#10151a`
- panel `rgba(10,14,18,.90)`
- soft panel `rgba(18,22,26,.82)`
- gold `#f3cc4f`
- deep gold `#b98216`
- cream `#f5f0e4`
- muted warm text `#bdb49a`

Existing semantic success/warning/danger colors remain state colors. Gold must never replace error/success meaning.

## 8. Home final-art DOM contract

The proposal JavaScript creates one decorative wrapper inside `#mainMenu`:

```html
<div class="r8FinalArtLayer r8HomeFinalArt" aria-hidden="true">
  <div class="r8AtmosphereLayer" aria-hidden="true"></div>
  <div class="r8CharacterLayer r8CharacterLayerDaniel" aria-hidden="true">
    <img class="r8CharacterImage" alt="">
  </div>
  <div class="r8CharacterLayer r8CharacterLayerNik" aria-hidden="true">
    <img class="r8CharacterImage" alt="">
  </div>
</div>
```

Hard rules:

- wrapper is decorative only;
- `pointer-events:none !important`;
- `user-select:none !important`;
- no focusable descendants;
- all images have empty alt text;
- art participates in no functional grid/flex sizing;
- art is clipped inside the Home screen and cannot create horizontal document overflow;
- `.fifaMenuShell` and all real controls stay above it.

## 9. Frozen asset authority and expected deploy paths

No image generation is authorized.

A01 Nik:

- authority: `OWNER_APPROVED_FROZEN`
- source file ID: `file_00000000bbf081f7b29944352f5e76a5`
- SHA-256: `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`
- dimensions: 1086x1448 RGBA
- expected production path after the developer materializes the frozen binary: `assets/visual/r8/a01-nik-core-thinking-hero.png`

A02 Daniel:

- authority: `OWNER_APPROVED_FROZEN`
- source file ID: `file_000000007fe081f59bbac0a09a9eeca3`
- SHA-256: `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`
- dimensions: 1086x1448 RGBA
- expected production path after the developer materializes the frozen binary: `assets/visual/r8/a02-daniel-core-pointing-hero.png`

The developer must verify the deployed binaries against those hashes. A crop, mirror or responsive variant is derived from these exact masters, not regenerated.

## 10. Home placement contract against current r11 DOM

### Wide desktop >=1280px

Daniel / A02:

- left outer/background rail;
- maximum width approximately `23vw`;
- top anchor near Home heading/upper tile field;
- face and pointing gesture remain visually readable in atmospheric negative space;
- lower body fades behind opaque menu tiles;
- pointing fingertip must not become a fake pointer for any specific button.

Nik / A01:

- right outer/background rail;
- maximum width approximately `23vw`;
- thinking face/hand remain in upper-right atmosphere;
- lower body fades behind real tiles/media shell.

The `.fifaMenuGrid`, menu labels and media controls remain visually stronger than character lower bodies.

### 1180px to 1279px

- reduce each figure to approximately `20vw`;
- increase lower fade;
- if either figure approaches focused controls, hide that figure rather than shrinking or moving the real menu.

### <=1179px

R8.25 chooses the conservative implementation path: omit both large figures.

The black/gold UI identity remains fully present through CSS, so Chromebook/tablet safety does not depend on character art.

### Mobile

No large characters.

## 11. Home menu behavior that must not change

The visual layer may not alter:

- whether `#continueCareer` is enabled or disabled;
- dynamic Continue label/meta derived from saved showdown state;
- season indicator updates;
- creation/navigation button handlers;
- media selector creation;
- Play/Pause/Mute behavior;
- YouTube privacy-enhanced host behavior;
- media unload/error behavior;
- menu feedback/audio warmup;
- routing transitions;
- storage reads/writes.

The fact that R8 hides `.menuCoverAthlete` visually does not authorize changes to any of those behaviors in the first slice.

## 12. Focus and accessibility correction included in the first slice

Current `#appRuntimeNotice` has a real dismiss button with an accessible name but no explicit application-level `:focus-visible` rule.

R8.25 includes a dark/high-contrast focus boundary plus gold accent for that button.

Do not use yellow alone as the focus indicator on light UI. The R8.24 static check recorded only about 1.44:1 for the current yellow token against white.

## 13. Reduced-motion rule

R8.25 final art is static by default.

If the developer later adds decorative drift/parallax, it must disappear under:

- `prefers-reduced-motion: reduce`; and
- existing application reduced-motion state.

Removing decorative motion may not alter screen state, menu state, media state, reveal state, scoring or session authority.

## 14. No-authority-mutation proof boundary

The proposed JS may:

- create decorative nodes;
- set visual dataset markers;
- handle missing decorative image files by hiding the affected art wrapper;
- read viewport conditions through CSS only.

It may not:

- call storage APIs;
- call Firebase;
- write Firestore;
- add protocol fields;
- change scoring;
- change Save Library identity;
- change pairing;
- change Remote Joining;
- change generated Firestore Rules;
- enable billing;
- require Blaze, Cloud Functions or Cloud Run.

## 15. First-slice acceptance checklist

Before expanding beyond global + Home on the developer branch, prove all of the following on one exact implementation head:

1. app starts normally;
2. loading presentation still completes;
3. Home opens normally;
4. all six Home controls retain behavior;
5. Continue enabled/disabled state still reflects real save state;
6. media selector, Play, Pause and Mute still work;
7. no decorative element receives pointer events;
8. no decorative element enters keyboard focus;
9. all real focus states remain visible;
10. runtime-notice dismiss has explicit visible focus;
11. no horizontal document overflow at 1600x900, 1024x768 or 390x844;
12. no character art at 1024x768 or 390x844 under the conservative R8.25 rule;
13. no status/error/validation text is covered;
14. reduced-motion remains state-neutral;
15. no storage diff attributable to visual code;
16. no Firebase/provider/rules change;
17. Firebase remains Spark-only;
18. billing remains off;
19. disabling/removing the R8 art layer leaves a complete functioning app;
20. deployed A01/A02 hashes match the frozen authority before they are accepted as shipping assets.

## 16. Proposal completion decision

The visual proposal no longer has an unresolved design or asset-generation requirement.

A03/A04/A05/A06 are not missing work. Their original functional intent was resolved by the proven reuse-first/state-derived architecture. The proposal therefore does not need to generate unnecessary poses to reach completion.

R8.25 defines visual proposal completion as:

- identity authority complete;
- exact live-DOM mapping complete;
- frozen core masters complete;
- screen/state expression architecture complete through reuse and authoritative state derivation;
- black/gold visual system complete;
- responsive/accessibility/noninterference static QA complete;
- concrete first-slice integration source complete;
- implementation handoff complete.

Remaining browser acceptance belongs to the developer integration lane because it cannot occur until the proposal is selectively linked into a real shipping candidate.

## 17. Final visual-lane boundary

After the R8.25 status/handoff seal, the independent visual proposal lane should stop at 100% proposal completion.

Next work is master-developer selective implementation, not another visual concept cycle.

Image generation remains CLOSED unless actual integrated-browser evidence later proves a concrete mapped asset deficit that frozen A01/A02, deterministic transforms, CSS, SVG or procedural treatment cannot solve.
