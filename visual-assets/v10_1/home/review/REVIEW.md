# Home review

## Verdict


## Scorecard


## Hard gates


## Evidence

### Claude carry-forward measurements

- H5 phone fit: NOT MEASURED (Claude measures). Sources checked: `project-documents/factory/status/JOB-032.md`, `project-documents/factory/status/JOB-033.md`; `visual-assets/v10_1/home/evidence/QA_SUMMARY.md` is absent. JOB-033 contains worker arithmetic, not a Claude browser measurement, so it is not promoted to a gate result here.
- H6 input size / contrast: NOT MEASURED (Claude measures). Sources checked: JOB-032 and JOB-033 statuses; no Claude contrast number is recorded.
- H7 reduced motion: NOT MEASURED (Claude measures). Sources checked: JOB-032 and JOB-033 statuses; no Claude reduced-motion measurement is recorded.
- H8 keyboard / focus: NOT MEASURED (Claude measures). Sources checked: JOB-032 and JOB-033 statuses; no Claude tab-through measurement is recorded.
- H9 console / failed requests: NOT MEASURED (Claude measures). JOB-032 records worker factory-QA with zero console errors, but no Claude intake measurement is present.
- H10 mockup-diff: NOT MEASURED (Claude measures). `visual-assets/v10_1/home/evidence/scores.json` is absent and neither source status records Claude H10 scores.
- H11 first-paint weight: NOT MEASURED (Claude measures). JOB-033 records a worker-calculated 252,124-byte phone hero bundle ceiling, but no Claude network measurement is present.

Source availability note: the requested Claude intake note is present only as JOB-032's earlier `Claude check: FIX 4.0` plus its fix list; JOB-033 has no Claude check line yet. Neither status contains H5-H11 intake measurements, so no unmeasured gate is marked FAIL.


### Mockup differences

- Top navigation / chrome: GOAL_HOME.jpg uses an ~8.7% high black bar with CM17 at far left, HOME / CAREER / STANDINGS / STATS / RULES / ABOUT across the top and search / settings / profile at the right. `index.html #topHeader` instead contains only the CM17 badge, a small CAREER MODE / SHOWDOWN // 17 brand, SIGN IN and a season indicator. This also differs from PRODUCT_TRUTH §7, which requires HOME / CAREER / STANDINGS / STATS / RULES plus a settings icon.
- Title kicker: mockup starts “THE RIVALRY STARTS HERE” at about x 6.3%, y 14.8%. `.homeLockup` starts at `left: var(--gutter)` = 2.4vw and `top: 56px + clamp(14px,4vh,44px)`, placing the block materially farther left and roughly 4–6 percentage points higher at standard desktop heights.
- Brush wordmark: mockup brush title spans roughly x 4%–35% and keeps its lower edge around y 37%. Code uses the correct brush image `LOGO_CM17_WORDMARK_V1.webp` at `width: var(--wm-w,32vw)`, but inherits the earlier/higher `.homeLockup` origin; the width is close while the registration is not.
- Tagline: mockup has “TWO MANAGERS · ONE LEGACY” centred under the brush at about y 40%. Code uses the same words in `.lockupLegacy`, but its vertical position follows the higher title block.
- Preparing/progress panel: mockup includes a left-side “PREPARING CAREER MODE SHOWDOWN” progress strip around x 8.5%–30%, y 45%–53%. No equivalent element exists in `index.html`; this is an intentional omission unless later product code requires a loading state, because PRODUCT_TRUTH does not list a Home progress control.
- Home heading block: mockup places HOME / RIVALRY HEADQUARTERS and its explanatory copy at roughly x 3.4%, y 58%–72%, directly above the tile band. Code keeps the same HOME label, same RIVALRY HEADQUARTERS wording and same body sentence in `.fifaMenuHeading`, but positions it from `bottom: calc(100% - var(--tile-top) + ...)`; exact vertical registration depends on `--tile-top` written elsewhere, so CSS alone does not prove the mockup’s y-value.
- Soundtrack panel: mockup has a single right-side card at roughly x 64.5%, y 53.3%, w 33.5%, h 17%, with square concert art, a record edge, waveform, ARE WE READY? (WRECK), PLAY TRACK and MUTE. Code `.menuMusicTile` is also a right-side glass card but its exact box is delegated outside this CSS; its content is AUDIUS SOUNDTRACK / WHAT YOU GOT / Valentino Khan & NITTI, a CSS vinyl/equalizer, four track-choice buttons, status text, PLAY TRACK and MUTE. The hierarchy is recognisable but the card artwork and internal composition are substantially different from the mockup.
- Tile band geometry: mockup has six equal-ish destination tiles from about x 2.5% to 98%, y 74% to 92%, with Continue only modestly wider than the others. Code `.fifaMenuGrid` uses `left/right: 2.4vw`, `height: clamp(136px,17.5vh,158px)` and `grid-template-columns: minmax(0,2fr) repeat(6,1fr)`; this creates seven destinations and makes Continue about twice the width of each secondary tile. The extra destination and stronger Continue are PRODUCT_TRUTH §5 changes, not accidental mockup drift.
- Continue button: mockup says CONTINUE CAREER on a bright gold tile with a number-17 football silhouette. Code `#continueCareer` preserves the gold primary treatment and exact label, uses `TILE_CONTINUE_V1.webp`, and scales the art to 190×190 px with a darkened treatment; code therefore matches the role but uses a more dominant tile/art ratio.
- Start/Join button: mockup says NEW SHOWDOWN with a tactics-board object. Code `#newShowdown` says START A SHOWDOWN and uses `TILE_TACTICS_V1.webp`. PRODUCT_TRUTH names the destination Start/Join, so the code is closer to current product intent than the mockup but does not literally use the final destination name.
- History button: mockup says HISTORY / LEGACY with a trophy illustration. Code `#legacyButton` keeps HISTORY / LEGACY but uses `TILE_HISTORY_V1.webp`, so the words match while the object art is intentionally replaced by original Showdown art.
- Statistics button: mockup says DATA / STATISTICS with rising gold bars. Code `#careerStatisticsButton` keeps DATA / STATISTICS and uses `TILE_STATISTICS_V1.webp`; this is the closest tile-level match.
- Trophy Room button: no standalone Trophy Room tile exists in the mockup. Code adds `#trophyRoomButton` with HONOURS / TROPHY ROOM and original `TRO_LEAGUE_TITLE_V1_512.webp`, required by PRODUCT_TRUTH §5.
- Rule Book button: mockup says RULES / RULE BOOK with a tactics-book object. Code `#ruleBookButton` keeps those words and uses `TILE_RULEBOOK_V1.webp`; role and hierarchy match.
- Settings button: mockup’s sixth tile is LOCAL SAVE / LIBRARY with a black disc/book object. Code removes that destination and adds `#settingsButton` with SETTINGS / SETTINGS and `TILE_SETTINGS_V1.webp`, matching PRODUCT_TRUTH §5 rather than the old mockup.
- Secondary tile copy: mockup shows only two-line destination labels. Code keeps additional `.menuTileMeta` descriptive text in the DOM but visually hides it on available secondary tiles; unavailable reasons become visible. This preserves the mockup’s visual density while supporting honest availability states.
- Tile panel craft: mockup tiles are thin gold-edged black rectangles with illustrated objects and subtle depth. Code uses `.sd-panel` plus black glass, a 1 px gold edge, top gold inset and cut-corner shared panel treatment. This is directionally consistent, though the code’s stronger top-edge highlight and seven-column density differ from the mockup.
- Footer / bottom strip: mockup has a thin footer with “CM 17 | CAREER MODE SHOWDOWN 17” at left and “FOOTBALL BRINGS US TOGETHER” plus crown at right. Code adds a separate `.menuBottomStrip` with competition/ruleset/READY messaging and a footer reading “Career Mode Showdown / v1.9.1”, while `.footDeco` retains the right-side slogan/crown. The left and centre footer content therefore diverge from the mockup.
- Daniel desktop area: mockup places Daniel on the left-centre, roughly x 32%–56%, with his pointing hand reaching toward the viewer while Nik occupies the right-centre. Desktop code does not reposition Daniel in DOM; he remains in the Home plate, which preserves plate registration. There is no desktop Daniel cut-out layer in `index.html`, so no extra z-layer can place his pointing hand in front of a future overlapping panel.
- Nik desktop area: mockup places Nik on the right, roughly x 53%–84%, with his chin resting on his hand. Desktop code likewise leaves Nik in the plate and does not mirror him, preserving the approved side/order; there is no desktop Nik cut-out layer for additional panel overlap depth.
- Phone manager areas: the desktop mockup is not a phone authority. Code authors a separate portrait composition with `.phoneHeroDaniel { left:31%; height:58vh }` and `.phoneHeroNik { left:68%; height:61vh }`, Daniel first/left and Nik right, both extending below the 40vh hero band. This follows PRODUCT_TRUTH’s phone ordering and deliberate recomposition rather than shrinking the desktop mockup.
- Phone title/content split: mockup provides no portrait layout. Code uses a 40vh hero band rather than the QUALITY_BAR’s “about 55%” target and dedicates the rest to soundtrack plus seven destinations above the 56 px nav reserve; that is a clear composition departure to be judged in scoring, even though it was chosen to fit all required destinations.

## Fix list

