# Career Mode Showdown — v1.1.3 Maintenance Release

Release tag: `v1.1.3`
Runtime asset revision: `1.1.3-r1`
Status: PRE-MERGE VALIDATION IN PROGRESS
Owner acceptance: PENDING PUBLIC BUILD REVIEW

## Release purpose

v1.1.3 is an owner-priority maintenance release between Candidate B and Candidate C. It fixes the reproduced League Wheel post-selection visual reroll and substantially expands/replaces licensed football photography without changing competition rules, persistence authority, scoring, Transfer state or Season Review behavior.

Candidate C — Atomic Restore + Recovery UX — remains the next substantive Data Safety and Recovery build after this maintenance release is merged, deployed and proven.

## League Wheel correction

The old wheel kept a permanent transform transition outside an active spin. At spin completion the code normalized the five-revolution transform to the equivalent selected-league angle; a browser could coalesce that style boundary and animate the normalization, visually appearing to reroll and stop on the same league before Continue was pressed.

v1.1.3 makes the transform transition operation-scoped:

- settled/unspun/selected/cancelled wheel state is explicitly `transition:none`;
- only a real active spin arms the transform transition;
- reduced-motion spin duration uses the same operation-scoped contract;
- the transition is disarmed before selected state is persisted/rendered;
- stale completion callbacks after cancellation cannot commit selection;
- the selected league still persists once and waits for explicit `CONTINUE TO CLUB ASSIGNMENT`.

The permanent League Confirmation workflow now protects the settled-transition and stale-operation behavior in addition to the existing explicit-confirmation transaction and route boundary.

## Licensed player-source replacements

The owner rejected the previous James Rodríguez interview still as insufficiently cinematic and explicitly prohibited reuse of the older 2019 James image. v1.1.3 therefore activates a different 2014 FIFA World Cup source and replaces the active Rashford/Martial sources as well.

- James Rodríguez — Colombia / 2014 FIFA World Cup — Copa2014.gov.br — CC BY 3.0 BR — `james-rodriguez-world-cup-2014-v113.webp`.
- Marcus Rashford — Manchester United 2–0 Chelsea, Old Trafford, 16 April 2017 — Ardfern — CC BY-SA 4.0 — `marcus-rashford-chelsea-2017-v113.webp`.
- Anthony Martial — Manchester United v CSKA Moscow, UEFA Champions League, 27 September 2017 — Дмитрий Голубович — CC BY-SA 3.0 — `anthony-martial-cska-2017-v113.webp`.

Exact source dimensions, source/crop policies, fingerprints, derivative dimensions, output SHA-256 values, authors and licenses are recorded in `assets/football/asset-manifest.json` and `THIRD_PARTY_NOTICES.md`.

## Seven additional screen-purpose photographs

v1.1.3 adds exactly seven more local licensed derivatives and assigns each to a bounded screen-purpose presentation rather than global wallpaper:

- League Wheel — Cristiano Ronaldo / Portugal / Euro 2016 — `FIND YOUR STAGE`.
- Club Assignment — Paul Pogba / Manchester United / 2016 — `CLUB IDENTITY`.
- Showdown Home — Zlatan Ibrahimović / Manchester United / 2016 — `RIVALRY HEADQUARTERS`.
- Season Results — Antoine Griezmann / Atlético Madrid / Champions League 2016 — `SEASON PRESSURE`.
- Season Summary — Neymar / Brazil / Rio 2016 Olympic gold final — `SEASON VERDICT`.
- Legacy — Radamel Falcao / Atlético Madrid / 2012 Europa League title celebration — `LEGACY`.
- Rule Book — Mario Balotelli / Italy / Euro 2012 semi-final celebration — `RULES OF THE GAME`.

Protected Messi/Statistics and Lahm/Trophy Room derivatives remain byte-identical.

## Visual architecture / performance

The active licensed visual set is 12 local derivatives across 11 destinations. Runtime presentation remains `object-fit: contain` and clean-anchor/face-safe; responsive CSS cannot introduce a blind semantic cover crop.

Unlike the older five-photo subsystem, v1.1.3 does not preload the entire archive when the football-visual module initializes. Destination routes own warming/loading of only their declared photographs. The permanent browser gate requires zero `/assets/football/` requests at Home startup, then exercises all 11 destinations across desktop, compact desktop, reduced-motion windowed/Chromebook geometry and mobile DPR2.

Protected startup budgets remain unchanged at 165,000 raw eager code bytes and 37,500 gzip eager code bytes. The 12-image repository/archive ceiling is separately bounded at 3 MB and does not replace the zero-startup-image-request contract.

## Diagnostic visual evidence

The temporary responsive preview gate ultimately passed all 11 visual destinations / 12 derivatives at 1366×768, 940×700 and 390×844 DPR2 (33 screenshots) in run `31552440038`, artifact `9124750493`.

Earlier diagnostic failures remain documented rather than erased:

- `31551978375` — test waited less than the protected 180 ms image fade before asserting opacity; harness fixed without changing product fade.
- `31552082889` — real Rashford photo/copy overlap; product geometry corrected while keeping the larger player frame.
- `31552209516` — lazy Career Statistics screen was not constructed by the temporary harness; harness corrected to use the real screen constructor.
- `31552675540` — release-identity helper expected nine shell revision references but exact source contained ten; helper failed closed and was corrected without partial publish.

See `CAREER_MODE_SHOWDOWN_V1.1.3_DIAGNOSTIC_LOG.md` and `CAREER_MODE_SHOWDOWN_V1.1.3_ACTIVE_HANDOFF.md` for complete chronology.

## Protected systems unchanged

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league / different permanent clubs;
- scoring and tiebreak rules;
- `js/screens.js` route/history authority;
- `js/storage.js` persistence authority and canonical key/schema behavior;
- Transfer Challenge state machine;
- Season Review boundary;
- Candidate A export semantics;
- Candidate B read-only import-analysis/migration/conflict-preview semantics;
- Marco Reus Home/loading source separation and owner-liked loading presentation.

## Release evidence still required before status can become DEPLOYED / PROVEN

1. remove temporary build/integration/preview/version/audit workflows and helpers;
2. run a diagnostic pull-request matrix and correct any current-release validator/document drift without weakening thresholds;
3. freeze one exact handoff-inclusive candidate SHA;
4. pass every permanent gate family twice independently on that same SHA;
5. manually inspect final licensed-visual screenshot artifacts;
6. merge with expected-head protection;
7. wait for GitHub Pages deployment of the runtime merge SHA;
8. pass every permanent gate family twice again in production, including Stability exact deployed-byte/public-journey proof;
9. align current authority docs and seal final evidence without creating a recursive CI-document loop.

Until those steps are complete this file is a candidate release record, not a claim that v1.1.3 is deployed.
