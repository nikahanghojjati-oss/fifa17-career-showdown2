# R8.20 Package 1/2 Static Responsive + Obstruction QA

Status: STATIC EXACT-DOM/CSS QA PASS / FULL IMPLEMENTATION BROWSER QA LATER

Runtime authority: `1d0c9f9d6542cd020a4aae53998cb6daeba380e4` / `1.9.1-r10`.

Visual branch: `visual/r8-5-approved-character-identity-lock`.

This QA validates whether the frozen A01/A02 masters and optional owner-liked C01/C02 pack-holder candidates can coexist with the current Package 1/2 DOM geometry without requiring production behavior changes.

It does not claim final browser acceptance of a shipping implementation because the final art layer is not yet linked into production.

## 1. Production geometry revalidated

Current production CSS uses:

- global safe width: `1510px`;
- Create Showdown `.setupBox`: `min(520px, 92vw)`;
- League `.wheelContainer`: `min(700px, 92vw)`;
- Club `.clubAssignmentShell`: `min(980px, 94vw)`;
- low-height desktop rule at `min-width:901px and max-height:800px` reduces Club shell to `min(900px,93vw)`;
- `max-width:900px` switches Home into compact two-column behavior;
- `max-width:700px` switches Home to one column and Club reveal area to one column;
- `max-width:480px` further tightens mobile controls;
- existing real buttons retain yellow focus-visible outlines;
- existing reduced-motion rules suppress decorative animation.

## 2. Desktop reference QA — 1600x900

### Home

Decision: PASS WITH BACKGROUND CONSTRAINTS.

- live safe width caps at 1510px;
- A01/A02 may occupy upper outer/background regions;
- real `.fifaMenuHeading`, six menu tiles, media tile and bottom strip stay above artwork;
- no full character may become a clickable-card background that compromises text contrast;
- approved Home composition remains direction evidence only.

### Create Showdown

Production central form width: 520px.

Gross viewport remainder: 1080px, approximately 540px per side before screen padding.

Decision: STRONG PASS.

- A02 Daniel can occupy the left rail with pointing fingertip stopping before the real form;
- A01 Nik can occupy the right rail;
- no Create-specific character generation is justified;
- primary Start Showdown and Back controls remain fully real DOM.

### League Wheel

Production central container width: 700px.

Gross viewport remainder: 900px, approximately 450px per side.

Decision: STRONG PASS.

- A02 pointing pose has a real directional purpose on the left;
- A01 thinking pose balances the right;
- neither character may enter the central wheel container;
- `#selectedLeague`, `#leagueStateNote`, `#spinLeague` and Back stay clear;
- no League-specific character generation is justified.

### Club Assignment core A01/A02 placement

Production shell width: 980px.

Gross viewport remainder: 620px, approximately 310px per side.

Decision: PASS ONLY AS NARROW EDGE FRAMING OR OMISSION.

- A01/A02 are not allowed to push the 980px shell inward;
- face/shoulder crops may exist at extreme edges;
- real club pack cards, progress rail, VS state, confirmation panel and CTAs remain dominant.

## 3. Optional C01/C02 pack-holder subtest — desktop wide only

Owner override reopens these assets as optional cinematic material.

The existing Club Assignment runtime already owns the sequence:

`ready -> opening -> manager-one -> manager-two -> versus -> confirmation`.

The club pair is persisted before the timed presentation stages begin.

Therefore C01/C02 may be tested as a visual layer driven by the existing stage attribute without creating new state.

### Safe use window

Preferred: `opening`.

Why:

- runtime has already disabled the Open action;
- club identity has already been persistently selected by gameplay authority;
- the moment is explicitly cinematic;
- the visual layer can disappear before confirmation needs maximum information density.

Secondary possibility:

- brief single-side emphasis during `manager-one` / `manager-two` if the revealed real card remains fully readable.

### Unsafe use

- permanent full-size pack-holder pair throughout the whole Club screen;
- placing raster pack graphics above the real DOM pack cards;
- using the artwork to determine which club was drawn;
- letting the artwork overlap the confirm CTA;
- using the figures on narrow layouts merely to preserve visual drama.

Decision: OPTIONAL DESKTOP CINEMATIC PASS, NOT A LAYOUT REQUIREMENT.

C01/C02 remain `OWNER_LIKED_CANDIDATE`, not frozen shipping assets, until exact final-art implementation/owner review proves the wide-desktop composition.

## 4. Compact desktop/tablet QA — 1024x768

Create Showdown:

- 520px form leaves approximately 252px gross per side;
- shoulder/head crops are possible;
- full-width pointing gesture should be cropped before entering form bounds.

Decision: PASS WITH AGGRESSIVE CROP/OMIT.

League Wheel:

- 700px container leaves approximately 162px gross per side;
- full A01/A02 figures are too large as side rails;
- head/shoulder atmospheric crops may remain only if wheel/status/CTA clarity is unchanged.

Decision: PASS WITH CROP/OMIT.

Club Assignment:

- low-height desktop rule uses max 900px shell;
- at 1024px that leaves only approximately 62px gross per side;
- full C01/C02 pack-holder art is not safe;
- core character figures are also not worth protecting at this width.

Decision: OMIT LARGE CHARACTERS / OMIT PACK HOLDERS.

This is not a failure of the concept. Responsive priority intentionally chooses controls over art.

## 5. Mobile portrait QA — approximately 390x844

At `max-width:700px` production already:

- stacks Home tiles into one column;
- stacks major manager/result grids;
- stacks Club reveal cards into one column;
- maintains real button/input authority.

At `max-width:480px` controls tighten further.

Visual rule:

- omit A01/A02 large figures;
- omit C01/C02 pack-holder art;
- do not create mobile-specific character generations;
- retain black/gold identity through CSS, borders, typography, small deterministic identity crops only if later needed.

Decision: PASS WITH LARGE ART OMITTED.

## 6. Focus, pointer and overflow QA contract

Any final-art implementation must satisfy:

- art container uses `pointer-events:none`;
- art container is `aria-hidden=true`;
- art never creates focusable descendants;
- real focus-visible outlines stay above artwork;
- art is absolutely positioned inside an overflow-controlled screen/final-art wrapper;
- no character image participates in grid/flex sizing;
- character widths/heights use clamp/max rules rather than increasing document width;
- body/screen must not gain horizontal scroll because of art;
- reduced-motion mode disables decorative pack-holder movement without changing reveal state.

Static authority analysis: PASS.

## 7. Outcome-dependent expressions are not part of this Package 1/2 QA

R8.19 proves the architecture is feasible, but A05/A06 remain gated until Season Summary exact composition.

Do not generate them here.

## 8. QA verdict

Package 1/2 frozen-master placement:

- Home: PASS with background constraints
- Create Showdown: STRONG PASS
- League Wheel: STRONG PASS
- Club Assignment A01/A02: PASS as edge crop/omit
- Club Assignment optional C01/C02: CONDITIONAL PASS on wide desktop opening stage only
- 1024x768: PASS by crop/omit policy; pack holders omitted
- 390x844: PASS by large-character omission
- accessibility/pointer authority: PASS by required layer contract
- new image generation required for Package 1/2: NO

## 9. Progress accounting

Responsive safe-zone / obstruction QA workstream advances from `2/10` to `4/10`.

Reason:

- exact production breakpoints and component widths are now reconciled against frozen-master placement;
- wide desktop, compact desktop/tablet and mobile policies are resolved;
- Club pack-holder owner override has a bounded safe stage and explicit omission breakpoints;
- final linked implementation still requires browser/runtime QA later, so the workstream is not close to complete.

Formal visual-production progress advances from `72%` to `74%`.

No progress credit is awarded merely for generating or liking optional images.

## 10. Next roadmap gate

Package 1/2 static placement QA is sufficiently resolved to begin Package 3 exact-DOM visual reconciliation without new generation.

Next study order:

1. Transfer Challenge and Shared Transfer Challenge;
2. Season Entry and Shared Season Results;
3. Shared Season Commit;
4. Season Summary;
5. real Tiebreak authority only if it actually exists in the live runtime.

A03/A04 stay CLOSED until exact Transfer composition proves a missing tactical asset.

A05/A06 stay CLOSED until exact Season Summary composition proves a winner-specific payoff asset is worth adding.

Image generation remains CLOSED at the end of this QA.
