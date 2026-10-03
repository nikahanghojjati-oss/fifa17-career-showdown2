# League Review · JOB-040

## Verdict

## Scorecard

## Hard gates

## Evidence

### Claude measurement carryover

Source checks:
- `project-documents/factory/status/JOB-037.md`: Claude check records that Daniel's fingertip touches the wheel rim, no seams were seen, and the 1366 × 768 render was clean. It does not provide numeric H5–H11 measurements.
- `project-documents/factory/status/JOB-039.md`: no Claude intake/check line and no Claude-measured H5–H11 values are present.
- `visual-assets/v10_1/league/evidence/QA_SUMMARY.md`: NOT PRESENT.
- `visual-assets/v10_1/league/evidence/scores.json`: NOT PRESENT.

Gate measurements:
- H5 phone fit / scroll per size: NOT MEASURED (Claude measures). No Claude numeric scroll-height/button-rect result exists in the sources above.
- H6 input size / contrast: NOT MEASURED (Claude measures). No Claude contrast ratio or input-size measurement exists in the sources above.
- H7 reduced motion: NOT MEASURED (Claude measures). No Claude reduced-motion run is recorded in the sources above.
- H8 keyboard / focus: NOT MEASURED (Claude measures). No Claude tab-order/focus-ring run is recorded in the sources above.
- H9 console / failed requests: NOT MEASURED (Claude measures). The Job 37 Claude note says the 1366 × 768 render was clean, but it does not state a console/network measurement.
- H10 mockup diff: NOT MEASURED (Claude measures). Job 37's worker notes say H10 passed, but no Claude H10 scores are recorded and `scores.json` is absent.
- H11 first-paint weight: NOT MEASURED (Claude measures). Job 39 records a worker-side hero payload figure, not a Claude first-paint network measurement.

### Mockup differences

Reference: project file `GOAL_LEAGUE.jpg`, 1536 × 864. Code values are from `index.html`, `league.css`, and the desktop placement logic in `league.js`; PRODUCT_TRUTH.md overrides the reference where noted.

- Title block — mockup: kicker sits near y≈98 px, a broad hand-painted `SELECT LEAGUE` wordmark spans roughly the central third of the screen, with `SPIN TO SELECT LEAGUE` directly below around y≈225 px; code: desktop kicker top is 86 px at 1536 × 864, the title is a 64 px Kaushan Script `TODO-WORDMARK` fallback, and the subtitle is positioned from the title line box. Wording matches, but the title is materially narrower/cleaner and lacks the mockup's rough brush silhouette.
- Top navigation panel — mockup: segmented black bar carries CM17, HOME, CAREER, STANDINGS, STATS, RULES, ABOUT, plus search/settings/profile controls on the right; code: `#topHeader` is a 56 px full-width gradient bar with CM17, CAREER MODE / SHOWDOWN // 17, SIGN IN, Season 1 / 5 and the script tag, with no nav tabs. PRODUCT_TRUTH requires HOME / CAREER / STANDINGS / STATS / RULES plus settings only, so both the mockup's ABOUT/search/profile controls and the current build's SIGN IN/season layout differ from final truth.
- Left slogan panel — mockup: dark outlined box around x≈40–283, y≈648–771 with `DIFFERENT LEAGUES / DIFFERENT STORIES / SAME PASSION`; code: same words and plate-registered zone, expanded by 6 px on every edge via `grow = 6`, so it is about 12 px larger in both dimensions.
- Right slogan panel — mockup: dark outlined box around x≈1253–1496, y≈648–771 with `WHERE RIVALS / CREATE LEGENDS`; code: same words and plate-registered zone, likewise expanded by 6 px per edge.
- Wheel panel — mockup: reflective blank gold orb centered at approximately (763, 495) with radius ≈233 px; code: live wheel uses `GOAL_WHEEL = { cx: 762.6, cy: 495.0, r: 233.3 }`, so the outer geometry matches, but its interior is a dark segmented five-league selector with original Showdown league marks, a gold selected wedge, hub and rim art. The interior difference is functional and permitted by PRODUCT_TRUTH; real league logos are not used.
- State-note panel — mockup: no status panel is visible; code: `#leagueStateNote` is hidden in the initial state but can appear as a centered dark-glass status strip above the buttons in other truthful wheel states. This is an intentional functional addition rather than a default-frame mismatch.
- Primary button — mockup: gold `SPIN WHEEL` button begins around x≈505, y≈746, about 285 × 58 px; code: `#spinLeague` is 300 × 56 px minimum and the desktop row is placed at y=743 px at 1536 × 864. Vertical registration is close, but the code button is roughly 15 px wider.
- Secondary button — mockup: dark `BACK` button begins around x≈800, y≈746, about 208 × 58 px with a narrow gap after the primary; code: `.backButton` is 200 × 56 px minimum with a fixed 16 px row gap. In the centered 516 px code row it lands farther right than the mockup's tighter two-button group.
- Daniel area — mockup: Daniel occupies the left side, with his pointing fingertip touching the wheel rim; code: the desktop scene uses the 1536 × 864 plate at 1:1 on the native reference size and registers `FINGER = { x: 532.5, y: 457.0 }` to a 3 px rim overlap. The manager side and contact geometry match; only the small dedicated finger overlay/contact treatment is added above the plate.
- Nik area — mockup: Nik occupies the right side, facing inward with hand at chin; code: the same plate-registered 1:1 desktop scene preserves Nik on the right with no mirroring or replacement layer in the desktop composition.
- Phone manager composition — mockup: no portrait-phone reference; code: PRODUCT_TRUTH intentionally replaces the desktop crop on phone with a portrait stadium plus dedicated Daniel-left/Nik-right cut-outs at 30%/70% and 56svh height. This is not scored as a desktop mockup mismatch.

## Fix list
