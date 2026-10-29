# Screen specs for the factory generator: what each mockup shows and what product truth changes.

NEW_SCREENS = {
 "TR": dict(
  name="Trophy Room", folder="trophy-room", mockup="MOCKUP_TROPHY_ROOM.png", plate="TR", truth_src=["js/trophyRoom.js", "js/statistics.js", "js/scoring.js", "js/screens.js (route and Back)"],
  frames="TR1 both managers with trophies (preview data) · TR2 new career, no trophies yet (empty) · TR3 history partial/unavailable label · TR4 Daniel-only filter",
  mockup_take=[
   "A cathedral of gold: night stadium, banners, confetti specks. The hero is ONE trophy on a black plinth in the centre with a gold nameplate \"SHOWDOWN CHAMPION / CAREER MODE SHOWDOWN\". It is the brightest object on screen.",
   "Brush title \"TROPHY ROOM\" top centre, eyebrow \"CAREER MODE SHOWDOWN 17\", tagline \"TWO MANAGERS. ONE LEGACY.\"",
   "Daniel left, hand on chin, thoughtful. Nik right, arms crossed. Both waist-up, framing the trophy like guards.",
   "Bottom third: a gold-edged shelf panel with a category tab bar on its top edge and six trophy cards in a row (trophy picture, name, ×count). One BACK button centred under the shelf.",
   "Handwritten tags and banners stay as decoration (they are on the plate).",
  ],
  overrides=[
   "Trophies are OUR originals (jobs 19–22): Showdown Champion, League Title, Domestic Cup, Champions League (\"continental\") cup. Never the real Premier League, FA Cup, Copa del Rey or Supercopa trophies.",
   "Categories come from what the game records (TRUTH.md). Expected: ALL · SHOWDOWN · LEAGUE TITLES · DOMESTIC CUPS · CHAMPIONS LEAGUE. Fix the mockup typo \"CONTINEENTAL\", drop the duplicate ABOUT and drop SPECIAL unless TRUTH.md finds it.",
   "Counts are live and per manager: each card shows Daniel's count on the left and Nik's on the right (Daniel left!). A trophy never won is shown dark with \"Not won yet\", never hidden.",
   "If a trophy type can be won in different leagues, the card may carry the league mark (original marks via getLeagueMark) as a small badge.",
   "History source label rules from PRODUCT_TRUTH §4 (\"Current Showdown only. Career history is not yet available.\" until provider history exists).",
  ],
  desktop=[
   "Hero plinth and trophy centred between the managers, trophy art from job 19 at about 34 % of viewport height, standing on a CSS plinth (black, gold edge, nameplate as DOM text).",
   "Spotlight: a soft cone from above onto the trophy (radial gradient, multiply/screen blend) and a reflection on the plinth top.",
   "Shelf panel full width between x = 8 % and 92 %, six cards equal width, trophy art 70 % of card height, name in Barlow Condensed 600 uppercase, counts in big tabular numerals.",
   "Tab bar overlaps the shelf's top edge (half in, half out) like the mockup; active tab solid gold with black text.",
  ],
  depth=[
   "Nik's crossed forearm and Daniel's elbow are near the shelf's top corners: if the shelf overlaps them, cut those arm parts out and lay them on top of the shelf with a contact shadow on the shelf.",
   "The trophy sits in front of the stadium but behind nothing: give it a warm rim light and a grounded plinth shadow.",
  ],
  phone=[
   "Face band (top 34 %): both faces, title \"TROPHY ROOM\" between them.",
   "Hero trophy smaller (about 22 % of height) with the nameplate.",
   "Shelf becomes a sideways swipe row (scroll-snap), one and a half cards visible, so the next card peeks. Tabs above as a compact scrollable chip row.",
   "BACK pinned at the bottom.",
  ],
  motion=[
   "Spotlight snaps on (anticipation 250 ms dark, then light).",
   "Hero trophy rises 20 px out of the plinth glow and one glint sweeps across it.",
   "Shelf cards flip up in sequence (60 ms stagger), counts count up; a card with a count > 0 gets one gold shimmer.",
   "Changing tab: cards cross-fade and slide 12 px.",
  ]),
 "CS": dict(
  name="Career Statistics", folder="career-statistics", mockup="MOCKUP_CAREER_STATISTICS.png", plate="CS", truth_src=["js/statistics.js (renderCareerStatistics, renderCareerLeaders, renderCareerManagerComparison)", "js/scoring.js", "js/screens.js"],
  frames="CS1 several Showdowns (preview data) · CS2 new career (empty) · CS3 partial history with coverage note · CS4 unavailable",
  mockup_take=[
   "Title \"CAREER STATISTICS\" in heavy gold block letters (here use the brush title style for consistency with siblings; keep it as big).",
   "Row of four headline tiles: COMPLETED SHOWDOWNS, SEASONS PLAYED, CAREER POINTS, TROPHIES WON, each with an icon and a huge number.",
   "Left middle: CAREER TABLE (rank, manager, Showdowns, seasons, points, trophies, win %), leader row highlighted with gold edge and crown.",
   "Right middle: MANAGER COMPARISON, two numbers with a split bar per stat.",
   "Bottom: CAREER LEADERS row of four cards, then three buttons: CURRENT RIVALRY STATISTICS, OPEN TROPHY ROOM (primary gold), BACK TO MAIN MENU.",
   "Daniel left, arms crossed. Nik right, hand on chin, wristwatch.",
  ],
  overrides=[
   "Only recorded stats (PRODUCT_TRUTH §3). Comparison rows: drop EUROPEAN WINS (unless it means Champions League wins, then call it CHAMPIONS LEAGUE WINS), CLEAN SHEETS and BIGGEST WIN. Use rows TRUTH.md lists (expected: league titles, domestic cups, Champions League wins, league goals, league points, season wins).",
   "Career Leaders: no player photos; leaders are managers. Use recorded categories (TRUTH.md), e.g. Most season wins, Most trophies, Best season score, Most league goals. Each card shows the manager portrait crop from this screen's plate (or crest + initials). Drop \"Cian Cheets\".",
   "Headline tiles: if a number is per manager, show both (Daniel left / Nik right) or make the tile clearly combined (\"Together\"). TRUTH.md decides.",
   "Comparison bar colours: manager accents from shared tokens, Daniel's side on the left.",
   "History states per PRODUCT_TRUTH §4. Partial data shows a coverage line (\"3 of 4 Showdowns readable\").",
  ],
  desktop=[
   "Title block top centre, headline tiles centred below it, spanning between the two managers' inner shoulders (do not cover faces).",
   "Career Table panel (about 36 % width) and Manager Comparison panel (about 22 % width) side by side; Leaders row below; button row at the bottom.",
   "Numbers: tiles 64–72 px Barlow Condensed 700 gold; table numbers tabular, leader's points in gold.",
  ],
  depth=[
   "Daniel's crossed arms sit behind the Career Table's left edge in the mockup; better: cut out his forearm so it rests in front of the panel's left edge with a contact shadow. Nik's hand on chin stays clear of all panels.",
  ],
  phone=[
   "Face band with title.",
   "Headline tiles as a 2 × 2 grid.",
   "Tabs: TABLE · COMPARE · LEADERS, one panel visible at a time.",
   "Buttons: OPEN TROPHY ROOM primary pinned; RIVALRY and BACK as two compact secondary buttons in one row.",
  ],
  motion=[
   "Tiles drop in with 60 ms stagger and the numbers count up.",
   "Comparison bars grow from the centre line outward to their values.",
   "Leader row in the table gets one gold sweep and the crown pops (scale 0.6 → 1.0 with slight overshoot).",
  ]),
 "RV": dict(
  name="Rivalry Statistics", folder="rivalry-statistics", mockup="MOCKUP_RIVALRY_STATISTICS.png", plate="RV", truth_src=["js/statistics.js (renderRivalryStatistics, renderRivalryComparison, renderSeasonProgression, renderRivalryHighlights)", "js/productionSharedShowdownPresentation.js", "js/visualIdentity.js (getClubCrestSvg)"],
  frames="RV1 active Showdown mid-way (preview data) · RV2 completed Showdown · RV3 first season, nothing played yet · RV4 transfer data unavailable",
  mockup_take=[
   "Centre: one tall comparison panel. Header row: Daniel's crest, \"DANIEL\" and club name on the left; Nik's on the right. Then seven rows: big number left, gold icon, label, big number right.",
   "Bottom: three panels in a row: HEAD-TO-HEAD (Daniel wins / Nik wins / Draws as giant numerals), SEASON-BY-SEASON (season, Daniel score, Nik score, winner), TROPHY CABINET (four trophies).",
   "Daniel left, pointing at the viewer/panel with his index finger: the most energetic pose in the set. Nik right, arms crossed.",
   "One button: BACK TO SHOWDOWN HOME.",
  ],
  overrides=[
   "Crests are our original crests for each manager's current club (getClubCrestSvg). Club names as text are fine.",
   "Rows only from recorded data. TRANSFER SIGNINGS only when transfer history is available; otherwise the row says \"Unavailable\" (never 0).",
   "Season winner icon: the winner's crest; a draw shows a gold dash and \"Draw\" (tie-break rules from PRODUCT_TRUTH §2 already decide most ties).",
   "Trophy cabinet uses our trophies (jobs 19–22) with per-manager counts.",
  ],
  desktop=[
   "Comparison panel centred, about 44 % width, from just under the tagline to about 63 % height. Leader's number in each row in gold, the other in white.",
   "Three bottom panels share one baseline, equal height, with the button centred below.",
  ],
  depth=[
   "Daniel's pointing hand reaches toward the comparison panel's left edge: cut out his hand and forearm and lay them OVER the panel edge, with a 3 px contact shadow on the panel. This is the screen's signature \"out of the menu\" moment; it must look real.",
   "Nik's crossed arms near the right edge of the panel: if they overlap, same treatment.",
  ],
  phone=[
   "Face band with a big score strip between the faces: Daniel's Showdown points | Nik's Showdown points.",
   "Comparison rows as a compact list (number · label · number).",
   "Tabs: HEAD-TO-HEAD · SEASONS · TROPHIES for the three bottom panels.",
   "BACK pinned.",
  ],
  motion=[
   "Rows deal in from the centre line outward (left numbers slide from left, right from right), 40 ms stagger.",
   "The leading number of each row flashes gold once after counting up.",
   "Head-to-head numerals slam in (scale 1.3 → 1.0, 180 ms) like a scoreboard.",
  ]),
 "LG": dict(
  name="Legacy (History)", folder="legacy", mockup="MOCKUP_LEGACY_V2.png (reference) and MOCKUP_LEGACY_V1.png", plate="LG", truth_src=["js/legacy.js (renderLegacy, legacy cards)", "js/statistics.js", "js/screens.js", "S2C-005R2 in project-documents/model-relay/LATEST.md"],
  frames="LG1 eight completed Showdowns over two pages (preview data) · LG2 one active Showdown plus history · LG3 abandoned Showdown row · LG4 new career empty · LG5 current-Showdown-only label · LG6 unavailable",
  mockup_take=[
   "Huge brush title \"LEGACY\" with tagline \"PAST SHOWDOWNS. A LASTING JOURNEY.\"",
   "Daniel left (hand on chin), Nik right, both shown chest-up ABOVE the big archive panel, as if leaning over it.",
   "One wide archive panel: a side menu on the left (LEGACY ARCHIVE active in solid gold), and a 4 × 2 grid of Showdown cards with pager arrows and dots.",
   "A card: \"Showdown #12\", left crest + manager name, league mark above the score, big score \"3 – 2\", right crest + name, gold crown under the winner, footer \"5 Seasons · Aug 2026\". The selected card has a glowing gold border.",
  ],
  overrides=[
   "Daniel is ALWAYS on the left of every card (the mockup puts Nik left on some cards: wrong).",
   "Card score = Showdown points total (Daniel – Nik).",
   "Crests and league marks are our originals. No real logos.",
   "Side menu: only real destinations. Expected: LEGACY ARCHIVE (this view), TROPHY ROOM (opens Trophy Room), RECORDS (opens Career Statistics), TRANSFER HISTORY only if TRUTH.md finds it. CHALLENGE TRACKER only if it exists in the product. On phone the menu becomes tabs.",
   "Bottom bar: keep only VIEW SEASON HISTORY. Drop Export Backup, Delete Showdown, Delete All, Reset All and the backup status block (those live in Settings behind a confirm, if at all).",
   "Abandoned Showdowns: status-only card (\"Abandoned · not counted\"), dimmed, no score.",
   "History states and the exact honest label from PRODUCT_TRUTH §4.",
  ],
  desktop=[
   "Archive panel spans 4 %–96 % width from about 41 % to 82 % height; side menu 19 % of the panel; cards 4 × 2 with 12 px gaps.",
   "VIEW SEASON HISTORY as the one primary action, centred below the panel.",
  ],
  depth=[
   "The managers lean over the panel: their lower chests are behind the panel's top edge. Add a soft shadow on the panel's top edge under each body so they look like they stand behind a desk, not cut in half.",
   "If Daniel's hand on chin sits close to the panel edge, keep it fully visible (never cut a hand with the panel).",
  ],
  phone=[
   "Face band with title.",
   "Menu as a tab row (ARCHIVE · TROPHIES · RECORDS).",
   "Cards as a sideways swipe: one full card plus a peek, card height about 150 px; page dots under it.",
   "VIEW SEASON HISTORY pinned.",
  ],
  motion=[
   "Cards deal in like a pack opening: each card flips from face-down (CM17 card back) to face-up, 50 ms stagger.",
   "The winner's crown drops in after the card lands.",
   "Pager: cards slide as a page with a slight parallax on the background.",
  ]),
 "SR": dict(
  name="Season Results", folder="season-results", mockup="MOCKUP_SEASON_RESULTS.jpg", plate="SR", truth_src=["js/productionSharedSeasonResults.js", "js/sharedSeasonResults.js", "js/productionSharedSeasonResultsRoute.js", "js/scoring.js", "js/sharedCanonicalScoring.js"],
  frames="SR1 entering, Daniel's device (own panel live, Nik's sealed) · SR2 entering, Nik's device · SR3 waiting-for-rival (own inputs published, rival sealed) · SR4 results-ready (both inputs visible, commit pending) · SR5 committed · SR6 validation error",
  mockup_take=[
   "Brush title \"SEASON RESULTS\", tagline \"TWO MANAGERS • ONE LEGACY\".",
   "Top centre: SEASON SCORING SYSTEM panel with a gold trophy on its left and two columns of rules with point values, \"Maximum season score 11\" at the bottom right.",
   "Two entry panels side by side: Daniel's warm gold-edged panel left, Nik's cool silver-edged panel right. Each: crown, name, \"ENTER YOUR SEASON RESULTS\", fields LEAGUE POSITION / LEAGUE POINTS / LEAGUE GOALS, four checkboxes (Domestic cup winner, Champions League winner, Top scorer, Top assist) and a SEASON SCORE bar with a big number.",
   "Managers in black football shirts with gold trim, both with a clenched fist: Daniel shouting, Nik determined. This is the most emotional screen.",
   "Buttons: REVIEW SEASON (primary gold) and BACK TO SHOWDOWN HOME.",
  ],
  overrides=[
   "The season score is COMPUTED, never typed. The mockup's \"9\" for Daniel is wrong (his ticks give 10).",
   "League points and league goals are number inputs (16 px+, inputmode numeric), not dropdowns. League position may be a select if the product uses one (TRUTH.md).",
   "The scoring panel shows exactly PRODUCT_TRUTH §2 (CL 5, League title 3, Domestic cup 1, 100 pts and/or 100 goals max 1, Top scorer and/or top assist max 1, max 11). Note the title row: the product derives League Title from league position 1; TRUTH.md says whether it is a checkbox or derived.",
   "Privacy: what each manager may see of the other's entry comes from TRUTH.md. Never show the rival's unsubmitted inputs; show a sealed state (\"Waiting for Nik\").",
   "No brand marks on shirts (the plate job removes the swoosh).",
  ],
  desktop=[
   "Scoring panel centred under the title (about 40 % width). Entry panels about 33 % width each, close to the centre, so the managers' fists frame them from outside.",
   "Season score bar: number 56 px in the manager's accent; bar fills proportionally to the 11-point max.",
  ],
  depth=[
   "Both clenched fists are at the outer edges of the entry panels: cut out each fist and forearm and lay them OVER the panel's outer edge with a contact shadow. That gives the \"punching out of the menu\" feel.",
  ],
  phone=[
   "Face band with title, faces cropped tight (the emotion is the point).",
   "A Daniel / Nik toggle (own panel selected by default; rival tab shows the sealed or submitted state).",
   "One entry panel visible. \"How scoring works\" opens the scoring panel as a pop-up sheet.",
   "REVIEW SEASON pinned at the bottom.",
  ],
  motion=[
   "Ticking a checkbox stamps a gold tick (scale 1.4 → 1.0, 120 ms) and the score number rolls to the new value; the bar fills.",
   "Reaching a bonus cap shows a tiny \"MAX\" tag pop.",
   "Panels enter from their manager's side.",
  ]),
 "FW": dict(
  name="Final Winner", folder="final-winner", mockup="no own mockup: style it from MOCKUP_SEASON_RESULTS.jpg and MOCKUP_TROPHY_ROOM.png", plate="TR", truth_src=["js/productionSharedFinalReconciliation.js", "js/sharedFinalReconciliation.js", "js/productionSharedTerminalClose.js", "js/showdownUI.js", "js/scoring.js"],
  frames="FW1 Daniel wins · FW2 Nik wins · FW3 draw · FW4 result reconciled, completion pending · FW5 completed",
  mockup_take=[
   "This screen is the Showdown's final whistle: the biggest moment in the app. Use the Trophy Room plate and the Showdown Champion trophy (job 19) as the centrepiece.",
   "Title: \"SHOWDOWN CHAMPION\" in the brush style; under it the winner's name huge (e.g. \"DANIEL\"), then the final totals \"28 – 24\" (Daniel left).",
   "A results strip: seasons played, season wins each, trophies each (all from recorded data).",
   "Buttons: the product's real actions (TRUTH.md; e.g. VIEW SEASON HISTORY, BACK TO HOME).",
  ],
  overrides=[
   "The final winner is decided by total Showdown points only; equal totals = \"SHOWDOWN DRAWN\" (both sides lit equally, no crown).",
   "Completion pending (Terminal Close not yet verified): show the result with a visible \"Completion pending\" chip; do not hide it.",
   "Winner side lighting: the winner's half of the plate gets a warm spotlight; the other half dims to 70 %, never to black (respect the rival).",
  ],
  desktop=[
   "Trophy centred and larger than in Trophy Room (about 42 % of height), confetti layer behind the managers and in front of the stadium.",
   "Winner name and totals under the title, results strip and buttons at the bottom.",
  ],
  depth=[
   "The trophy is in front of everything except the managers' nearest arms. Reuse the Trophy Room cut-outs.",
  ],
  phone=[
   "Face band with the winner side lit, trophy in the centre, winner name and totals under it, buttons pinned.",
  ],
  motion=[
   "The pack rip: 400 ms of anticipation (screen dims, drum-roll pulse on the trophy glow), white-gold flash, the trophy rises, a burst of gold confetti (canvas, ≤ 60 particles), the winner's name brush-wipes on, totals count up. Draw: two smaller bursts, one on each side.",
   "Settle into a slow shine loop on the trophy (every 4 s, disabled with reduced motion).",
  ]),
 "SJ": dict(
  name="Start / Join", folder="start-join", mockup="MOCKUP_START_JOIN.png", plate="SJ", truth_src=["js/productionSharedJourneyEntry.js", "js/sparkRemoteJoining.js", "js/sparkPrivatePairing.js", "js/persistentNikDanielPair.js", "js/screens.js"],
  frames="SJ1 nothing hosted yet (two choices) · SJ2 hosting, code shown, waiting for partner · SJ3 joining, code typed · SJ4 error (bad code) · SJ5 connected/paired",
  mockup_take=[
   "Title in brush style (the product's real screen name from TRUTH.md; the mockup says \"PRIVATE REMOTE JOINING\").",
   "One central panel with a close X: two cards side by side (HOST with laptop icon and a big gold HOST button; JOIN with a code input and a JOIN button), and under them a CURRENT SESSION panel with the code in a big monospace field, a copy button and a green OPEN status.",
   "A lock line at the bottom: private, no public discovery.",
   "Daniel left, pointing at the panel (he is the host in the established journey). Nik right, standing calm.",
  ],
  overrides=[
   "Plain words. Example: \"Only someone with this code can join.\" Replace jargon like \"page-memory session\" and \"exact capability\" with plain words; exact strings come from TRUTH.md, adjusted only where the product already uses plainer text.",
   "Only buttons the real app has. Revoke, Close and Forget go into one \"More\" menu, each with a confirm step.",
   "The code is live data: DOM text only, never in an image.",
   "Daniel hosts and Nik joins in the established journey; both cards stay available on both devices unless TRUTH.md says otherwise.",
  ],
  desktop=[
   "Panel centred, about 52 % width; host and join cards equal; current session panel full panel width.",
   "Code field: Barlow Condensed 600, 32 px, letter-spaced, with a copy icon button (44 × 44).",
  ],
  depth=[
   "Daniel's pointing hand reaches the panel's left edge: cut it out and lay it over the edge with a contact shadow, exactly like Rivalry Statistics.",
  ],
  phone=[
   "Face band with title.",
   "Before hosting: two big stacked buttons, HOST and JOIN (JOIN opens the code input).",
   "After hosting: the code card with a big COPY button; More menu for the rest.",
   "Input 16 px+, the keyboard must not hide the JOIN button (test with a 300 px keyboard inset).",
  ],
  motion=[
   "Hosting: the code \"deals\" in character by character like a slot reel (300 ms), then the OPEN dot pulses slowly.",
   "Paired: a gold link line draws between Daniel's and Nik's sides and a short burst marks the pairing.",
  ]),
}

SYSTEM_SCREENS = {
 "RB": dict(
  name="Rule Book", folder="rule-book", truth_src=["js/ruleBook.js (createRuleBookScreen, createRuleSection, createScoringRuleSection)"],
  frames="RB1 opened from Home · RB2 a long section open",
  design=[
   "No own mockup: style it from the system. Background: the system plate (job 29, stadium without people) with a dark scrim.",
   "Brush title \"RULE BOOK\", eyebrow and tagline as on the other screens.",
   "Numbered rule sections as gold-edged cards (number in a gold circle, section title, rules as short lines). The scoring section reuses the exact scoring panel design from Season Results (same component).",
   "Desktop: two columns of section cards; a sticky section index on the left (01, 02, ...) that jumps to sections.",
   "Phone: section index as a chip row; the content panel scrolls INSIDE itself (the page never scrolls); Back pinned.",
   "All rule text comes from ruleBook.js word for word. Do not rewrite rules.",
  ]),
 "ST": dict(
  name="Settings", folder="settings", truth_src=["js/settings.js", "js/menuFeedback.js", "js/saveLibraryUI.js (only if Settings links to it)"],
  frames="ST1 default · ST2 reduced motion on · ST3 a confirm dialog open (if a destructive action exists)",
  design=[
   "No own mockup: style it from the system. System plate with a heavier scrim.",
   "Brush title \"SETTINGS\".",
   "Panels exactly as settings.js builds them (eyebrow, title, description): motion preference choice (two large radio cards), menu feedback toggle, app version and asset revision info rows, any account rows.",
   "Toggles and radio cards are gold-on-black, 44 px targets, visible focus rings, aria states unchanged from the product.",
   "Any destructive action sits at the bottom in a \"Danger zone\" panel with a red-edged button and a confirm dialog.",
   "Phone: one column, panel content scrolls inside itself if needed; Back pinned.",
  ]),
}
