#!/usr/bin/env python3
"""Builds the mega-factory queue: tickets (jobs/JOB-NNNN.md), queue/QUEUE.json, queue/slots/*.md.

Run from the factory checkout (branch factory/gameplay-v1):
  python3 project-documents/gameplay-factory/queue/make_queue.py --first 1061
Job numbers must already be claimed on leads/relay. The generator is deterministic:
the same --first gives the same files, so it can be re-run to fix wording.
"""
import argparse, json, pathlib

GF = pathlib.Path(__file__).resolve().parents[1]
REPO = "nikahanghojjati-oss/fifa17-career-showdown2"
RAW = f"https://raw.githubusercontent.com/{REPO}/factory/gameplay-v1/project-documents/gameplay-factory"
BASE = "gameplay/bug-list-1"
STUDY_BASE = "study/mega-queue"
AUDIT_BASE = "qa/mega-audits"

SCREENS = [
 ("home", "Home", ["css/homeV10.css", "js/homeScreensV10.js", "visual-assets/v10_1/home/home.css"], "A1"),
 ("start-join", "Connect Players (start and join)", ["css/connectPlayersV10.css", "js/connectPlayersScreenV10.js", "js/startJoinViewModel.js"], "A2"),
 ("league", "Select League", ["css/v10Setup.css", "js/leagueWheel.js", "js/v10Setup.js"], "A3"),
 ("club", "Club packs", ["css/v10Club.css", "js/clubScreenV10.js", "visual-assets/v10_1/club/club.css"], "A4"),
 ("transfer", "Transfer challenge and Signing Entry", ["css/v10Transfer.css", "js/transferScreenV10.js"], "A5"),
 ("season-results", "Season Results", ["visual-assets/v10_1/season-results/app.css", "visual-assets/v10_1/season-results/season-results.css", "visual-assets/v10_1/season-results/season-results.js"], "A6"),
 ("standings", "Standings", ["visual-assets/v10_1/standings/standings.css", "visual-assets/v10_1/standings/standings.js"], "A7"),
 ("final-winner", "Final Winner (Showdown Champion)", ["visual-assets/v10_1/final-winner/final-winner.css", "visual-assets/v10_1/final-winner/final-winner.js", "js/seasonFinalV10.js"], "A8"),
 ("legacy", "Legacy", ["visual-assets/v10_1/legacy/legacy.css", "visual-assets/v10_1/legacy/legacy.js", "css/rivalryLegacyV10.css"], "A9"),
 ("trophy-room", "Trophy Room", ["visual-assets/v10_1/trophy-room/trophy-room.css", "visual-assets/v10_1/trophy-room/trophy-room.js"], "A10"),
 ("rivalry-statistics", "Rivalry Statistics", ["visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css", "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js", "css/rivalryLegacyV10.css"], "B1"),
 ("career-statistics", "Career Statistics", ["visual-assets/v10_1/career-statistics/career-statistics.css", "visual-assets/v10_1/career-statistics/career-statistics.js", "js/careerScreensV10.js"], "B2"),
 ("rule-book", "Rule Book", ["css/rulesSettingsV10.css", "visual-assets/v10_1/rule-book/rule-book.css", "js/rulesSettingsV10.js"], "B3"),
 ("settings", "Settings", ["css/rulesSettingsV10.css", "visual-assets/v10_1/settings/settings.css", "js/rulesSettingsV10.js"], "B4"),
]

KINDS = [
 ("s2a", 2, "code", "phone layout fixes (upright and sideways)"),
 ("s2b", 2, "code", "small desktop and laptop layout fixes"),
 ("s3", 3, "code", "match the desktop screen to its desktop mockup"),
 ("s4", 4, "study", "phone mockup (HTML and CSS study)"),
 ("s5", 5, "study", "improved desktop version (HTML and CSS study)"),
]

CROSS = [
 ("tap-targets", "Tap targets of at least 44 px on every Team V screen",
  "On phones, every button, tab and link on the Team V screens must be at least 44 by 44 CSS px (or have padding that makes its tappable area that big). Find the ones that are smaller in the screen stylesheets and fix them with media-query rules for phones only (max-width 760px). Desktop must not change.",
  ["css/v10Shell.css", "css/homeV10.css", "css/v10Transfer.css", "css/rulesSettingsV10.css"]),
 ("long-names", "Long manager and club names never break a layout",
  "Look at how names are placed on the Team V screens: manager names, club names, player names in the transfer and results screens. A 22 letter club name or a 14 letter manager name must not overlap other text, push a button off screen or grow a box. Add ellipsis, wrapping or smaller text where a name sits in a fixed box. CSS only.",
  ["css/v10Shell.css", "css/v10Club.css", "css/v10Transfer.css", "visual-assets/v10_1/season-results/season-results.css"]),
 ("safe-area", "Phone notch and bottom bar safe areas",
  "On iPhones the notch, the rounded corners and the bottom home bar can cover content. Check the shared shell and the screens' bottom action buttons: fixed or sticky bars need env(safe-area-inset-*) padding. Fix with CSS only (do not edit index.html).",
  ["css/v10Shell.css", "css/v10Transfer.css", "visual-assets/v10_1/season-results/app.css"]),
 ("short-landscape", "Phone held sideways: nothing hidden or overlapping",
  "At 844x390, 932x430 and 667x375 (sideways phones) check the shared shell and screen headers: no title over a tab row, no action button below the fold without a page scroll, no inner scroll box shorter than the screen. Use landscape and short-height media queries. CSS only; list each screen you checked in the status file.",
  ["css/v10Shell.css", "css/homeV10.css", "css/rulesSettingsV10.css"]),
 ("focus-motion", "Keyboard focus rings and reduced motion",
  "Every button and tab on the Team V screens needs a visible focus ring when reached with the keyboard, and animations must stop or shorten when the device asks for reduced motion (prefers-reduced-motion). Add shared rules to the shell stylesheet. Do not change any screen's look when a mouse or finger is used.",
  ["css/v10Shell.css", "visual-assets/v10_1/shared/motion.css", "visual-assets/v10_1/shared/showdown-ui.css"]),
 ("empty-states", "Empty, loading and waiting messages read the same everywhere",
  "List the loading, waiting and empty messages across the Team V screens (search the screen JavaScript for 'Loading', 'Waiting', 'No '). Make a short table in a new file queue/results/EMPTY_STATES.md, then change only the texts that are clearly inconsistent (capital letters, trailing dots, 'please', different words for the same state) to the most common style. Leave any text a contract test pins as it is; the lead runs the tests.",
  ["js/homeScreensV10.js", "js/careerScreensV10.js", "js/rivalryLegacyV10.js", "js/rulesSettingsV10.js"]),
 ("contrast", "Text contrast on plates and badges",
  "Using the colour tokens in showdown-tokens.css and the screen stylesheets, find text and background colour pairs on the Team V screens whose contrast ratio is below 4.5 to 1 (3 to 1 for text of 24 px and larger). List them in queue/results/CONTRAST.md, and fix the worst five by adjusting the text colour only, never the artwork.",
  ["visual-assets/v10_1/shared/showdown-tokens.css", "visual-assets/v10_1/shared/showdown-ui.css", "css/v10Shell.css"]),
 ("fonts", "Fonts: fallback while loading, no jumps",
  "Check how the Team V fonts are declared (font-face rules and the font stack). Make sure each font-face has font-display set sensibly and that the fallback stack has a similar looking system font, so text does not jump or vanish while fonts load on a slow phone. CSS only; list what you found in the status file.",
  ["visual-assets/v10_1/shared/showdown-type.css", "css/v10Shell.css"]),
 ("alt-text", "Picture descriptions and screen reader labels",
  "Look at the Team V screen JavaScript and markup for images, icons and icon-only buttons. Every meaningful image needs a short alt text, every decorative one alt=\"\" or aria-hidden, every icon-only button an aria-label. Change only the attributes, never the visible text or layout.",
  ["js/homeScreensV10.js", "js/clubScreenV10.js", "js/transferScreenV10.js", "js/careerScreensV10.js"]),
 ("layers", "Stacking order: dialogs above screens, toasts above dialogs",
  "Search the Team V stylesheets for z-index values. List them in queue/results/Z_INDEX.md as a table (selector, value, file), then fix any conflict where a dialog, toast or banner can end up under a screen element. Prefer a small set of shared values in the shell stylesheet. CSS only.",
  ["css/v10Shell.css", "css/v10Transfer.css", "css/rulesSettingsV10.css", "css/homeV10.css"]),
 ("tokens", "Hard-coded colours that should use the design tokens",
  "Find colour values written directly in the Team V stylesheets that equal or nearly equal a design token in showdown-tokens.css, and replace the clear matches with the token (var(--...)). The look must stay identical. List replacements in the status file; skip anything unsure.",
  ["visual-assets/v10_1/shared/showdown-tokens.css", "css/v10Shell.css", "css/homeV10.css", "css/rulesSettingsV10.css"]),
 ("touch-hover", "Hover-only effects must also work by touch",
  "Find places where something is shown or becomes usable only on :hover (tooltips, reveal-on-hover buttons, highlighted rows). On a phone there is no hover. Make each work on touch by also applying the style to :focus-visible and :active, or by showing it always on touch (pointer: coarse). CSS only.",
  ["css/v10Shell.css", "css/homeV10.css", "visual-assets/v10_1/trophy-room/trophy-room.css", "visual-assets/v10_1/standings/standings.css"]),
]
CROSS_SLOTS = {"B5": CROSS[0:3], "B6": CROSS[3:6], "B7": CROSS[6:9], "B8": CROSS[9:12]}
REVIEW_SLOTS = ["B10"]
SLOTS = [f"A{i}" for i in range(1, 11)] + [f"B{i}" for i in range(1, 11)]

RULES = """## Rules for every queue job (read first)
- **Start:** branch `{base}`. Create the branch `{branch}-<slug>` from it and open the PR **into `{base}`**. Never push to `main`, `gameplay/bug-list-1`, `gameplay/recovery-v1` or `study/mega-queue` directly. Never merge.
- **Scope:** change only the files this ticket names. If it truly needs another file, change it and say why in the PR body.
- **Never** edit `index.html`, `service-worker.js`, the release version or anything under `.github/`. Tests may only be added, never edited, deleted, skipped or loosened to make them pass. No player-visible text changes unless this ticket says so. Scoring, game rules and every screen's order of taps stay exactly as they are. Never use sessionStorage. Never touch anything under `visual-assets/v10_1/` (Team V's frozen design files), `tests/fixtures/`, and do not edit anything in `scripts/` (running it is fine) (Nik: fewer taps, but never skip, hide or reorder a needed screen).
- **Checks:** Re-read your edit once. Code jobs: run `node scripts/pos10-syntax.mjs` and `npm run -s test:contracts` and paste the last lines in the PR body (a browser is not needed). The Team G lead checks the screen and merges only on green CI after a `Sol review` comment.
- **If you cannot finish** (a file is missing, a limit is reached): push the branch `{branch}-blocked` with one small file `project-documents/gameplay-factory/status/JOB-{n}.md` saying what stopped you. That frees the slot for the next job.
- **PR title:** `JOB-{n} {tag}<ticket title>`. **PR body:** a "Before:" paragraph, an "After:" paragraph, a short "How" paragraph, then the lines you changed.
- **Done:** reply with one line: `Job {n} done, PR <link>.` Do not ask to continue.
"""

SIZE = """## Size of this job (one chat turn)
Read at most 5 files besides this ticket, write at most 3 files (about 200 changed lines), make one decision (the DEFAULT covers the rest), save as you go and end with one line.
"""

def lane(base):
    if base == BASE:
        return (f"| Lane | Depends on | Branch to start from | PR into |\n| --- | --- | --- | --- |\n"
                f"| White team: Codex cloud on the repo (default model and effort; runs the tests itself) | none | `{base}` | `{base}` |")
    return (f"| Lane | Depends on | Branch to start from | PR into |\n| --- | --- | --- | --- |\n"
            f"| Blue team: GPT-6 Sol, High effort (ChatGPT project \"Career Mode Showdown\", normal chat) | none | `{base}` | `{base}` |")

def reads_md(files):
    return "\n".join(f"{i+1}. `{f}`" for i, f in enumerate(files))

def ticket_code(n, key, sid, title, files, kind_title, stage):
    nochange = (f"- DEFAULT: if you find nothing wrong after reading the files, change nothing and push only the status file "
                f"`status/JOB-{n}.md` saying `no change needed` with the three most likely risks you checked.\n")
    if key == "s2a":
        body = f"""## What to fix
On a phone, the **{title}** screen must work held upright (about 360x640, 390x844, 430x932) and held sideways (844x390, 932x430, 667x375).
- One page scroll only: no inner scroll box, no action button hidden below an inner box, nothing clipped by a fixed height.
- No text over text, no title over tabs, no button off screen, every tap target at least 44 px.
- Use phone media queries only (`max-width: 760px` and landscape `max-height: 520px`). Desktop must not change by a single pixel.
{nochange}"""
    elif key == "s2b":
        body = f"""## What to fix
On a laptop or small desktop, the **{title}** screen must work at 1280x650, 1366x650, 1366x768, 1440x900 and 1920x1080.
- No content cut off at the bottom of short windows (650 px tall), no horizontal scroll bar, no overlapping text or buttons, and the main action button visible without scrolling at 1366x768 where possible.
- Use `min-width` and `max-height` media queries or `clamp()`; do not touch the phone rules (max-width 760px).
{nochange}"""
    else:
        body = f"""## What to fix
Match the current desktop **{title}** screen to its desktop mockup.
- Find the mockup of this screen in this ChatGPT project's files (the desktop mockups; also try the pictures in `visual-assets/v10_1/{sid}/assets/` named `ENV_*_PLATE_V1_*`). Look at it, then read the files and list at most 8 differences in spacing, sizes, alignment, text style, colours or order of elements between the mockup and the code.
- Fix the clear ones in the CSS (and tiny markup changes in the screen's JavaScript when a class is missing). Do not change any text a player reads, any order of taps, or any game logic.
- Save the list as `project-documents/gameplay-factory/queue/results/{sid}-s3.md` with a line per difference: fixed / not fixed (reason).
- DEFAULT: if you cannot find the mockup, do not guess. Push only the status file `status/JOB-{n}.md` saying `NEEDS MOCKUP` and naming the places you looked. The lead will route a mockup request.
"""
    return (f"# JOB-{n} · {title}: {kind_title} (stage {stage})\n\n{lane(BASE)}\n\n{body}\n"
            f"## Read (only these)\n{reads_md(files)}\n\n{SIZE}\n{RULES.format(base=BASE, branch=f'gameplay/job-{n}', n=n, tag='')}")

def ticket_study(n, key, sid, title, files, kind_title, stage):
    if key == "s4":
        what = f"""## What to make
A **phone mockup** of the **{title}** screen as a self-contained HTML file with inline CSS (no JavaScript needed), designed for a 390x844 phone held upright, with a note for the sideways 844x390 view.
- Start from the existing desktop screen and its artwork: the pictures under `visual-assets/v10_1/{sid}/assets/` (use relative links such as `../../../../visual-assets/v10_1/{sid}/assets/<file>`), and the desktop mockup in this ChatGPT project's files.
- Keep every element the desktop screen has and the same order of taps; the phone version may stack, shrink or scroll, but never skip, hide or reorder a needed element.
- Files (3 at most): `project-documents/gameplay-factory/studies/{sid}/phone-{n}.html`, `.../phone-{n}-notes.md` (at most 15 lines: layout choices, what moved where, sideways view plan), and `project-documents/gameplay-factory/studies/{sid}/README.md` only if it does not exist yet (one line naming the screen).
"""
    else:
        what = f"""## What to make
An **improved desktop version** of the **{title}** screen as a self-contained HTML file with inline CSS (no JavaScript needed) for 1920x1080, with a note for 1366x768.
- Keep the same elements, game rules, text and order of taps. Improve only presentation: hierarchy, spacing, readability, a clearer main action, better use of the plate artwork. Use the existing artwork under `visual-assets/v10_1/{sid}/assets/` (relative links such as `../../../../visual-assets/v10_1/{sid}/assets/<file>`).
- Files (3 at most): `project-documents/gameplay-factory/studies/{sid}/desktop-v2-{n}.html`, `.../desktop-v2-{n}-notes.md` (at most 15 lines: what improved and why), and `project-documents/gameplay-factory/studies/{sid}/README.md` only if it does not exist yet.
"""
    rules = RULES.format(base=STUDY_BASE, branch=f'study/job-{n}', n=n, tag='')
    return (f"# JOB-{n} · {title}: {kind_title} (stage {stage})\n\n{lane(STUDY_BASE)}\n\n"
            f"This is a **study**: it adds new files only and changes no game code. Team V's lead decides which studies become real screens. If you can, use GPT-6's picture and design features to look at the mockups.\n\n"
            f"{what}\n## Read (only these)\n{reads_md(files)}\n- the mockup picture of this screen in the ChatGPT project files, if present\n\n{SIZE}\n{rules}"
            f"- **Text only:** commit text files only. Never upload, zip or base64 a picture.\n")

def ticket_cross(n, title, text, files):
    return (f"# JOB-{n} · {title} (stage 2)\n\n{lane(BASE)}\n\n## What to fix\n{text}\n"
            f"- DEFAULT: if you find nothing wrong, change nothing and push only the status file `status/JOB-{n}.md` saying `no change needed`.\n\n"
            f"## Read (only these)\n{reads_md(files)}\n\n{SIZE}\n{RULES.format(base=BASE, branch=f'gameplay/job-{n}', n=n, tag='')}")

def standing_line(slot):
    return (f"Career Mode Showdown factory, slot {slot}. With the GitHub connector, read "
            f"project-documents/gameplay-factory/queue/slots/{slot}.md on branch factory/gameplay-v1 of {REPO} "
            f"(or open {RAW}/queue/slots/{slot}.md) and do exactly what it says. "
            f"When I type next, read it again and do the next job on its list.")

def slot_file(slot, tickets):
    lines = "\n".join(f"{i+1}. Job {t['job']} · {t['title']} · branch prefix `{t['prefix']}` · ticket `jobs/JOB-{t['job']}.md`" for i, t in enumerate(tickets))
    return f"""# Slot {slot} · standing instructions

You are a worker in the Career Mode Showdown gameplay factory, slot **{slot}**. Repository `{REPO}`, factory branch `factory/gameplay-v1`, factory folder `project-documents/gameplay-factory/`. Use the GitHub connector (preferred) or the raw links.

## Your list (in order)
{lines}

## What to do now (every time Nik types something or `next`)
1. List the branches of the repository (connector). A job is **taken** when any branch exists whose name starts with its branch prefix above (a finished job or a `-blocked` one).
2. Pick the **first job on your list that is not taken**. If all are taken, reply exactly `Slot {slot} is empty. Nothing more to do.` and stop.
3. Open that job's ticket (`jobs/JOB-NNNN.md`) on `factory/gameplay-v1`, read it fully, and do exactly what it says. It is sized to finish in one turn. If the previous job on your list is for the same screen and its pull request is still open (not merged), start your branch from that job's branch instead of the base branch, and say so in your PR body, so your edits do not collide.
4. Your first reply line is `Slot {slot} · Job NNNN · <ticket title>`. Your last line is the one line the ticket asks for. Do not ask to continue.
5. Never do two jobs in one turn. Never edit this file, the tickets, BOARD files or anything under `queue/`.
6. If a limit hits you mid-job, that is fine: Nik opens a new chat, pastes the same standing line, and the job (not taken yet) is picked up again from its ticket.
"""

REVIEW = """# Slot {slot} · reviewer standing instructions

You are a **reviewer** in the Career Mode Showdown gameplay factory, slot **{slot}**. Repository `{repo}`. Use the GitHub connector.

## What to do now (every time Nik types something or `next`)
1. List open pull requests whose title starts with `JOB-`. Skip a PR that already has a comment starting with `Sol review`.
2. Pick the {pick} one that is left. If none, reply exactly `No pull request is waiting for review.` and stop.
3. Read its ticket (`project-documents/gameplay-factory/jobs/JOB-NNNN.md` on `factory/gameplay-v1`) and its diff.
4. Post ONE comment on the PR that starts with `Sol review`, containing: verdict (`OK`, `OK with notes`, or `Needs changes`); whether it stayed inside the ticket's files and rules (yes/no, name any file outside); anything that changes a player-visible text, an order of taps, or game logic (must be none); up to 5 short bullets of concrete problems with file and line. Do not push, approve, merge or close anything.
5. Last line to Nik: `Reviewed PR <link>: <verdict>.` Do not ask to continue.
"""

GROUPS = {"home": "home", "start-join": "start-join", "league": "league", "club": "club", "transfer": "transfer",
          "season-results": "season-final", "final-winner": "season-final", "standings": "season-final",
          "legacy": "rivalry-legacy", "rivalry-statistics": "rivalry-legacy", "trophy-room": "career-screens",
          "career-statistics": "career-screens", "rule-book": "rules-settings", "settings": "rules-settings"}

EDIT = {  # adapter layer only; visual-assets/v10_1/** is Team V's frozen design source
 "home": ["css/homeV10.css", "js/homeScreensV10.js"],
 "start-join": ["css/connectPlayersV10.css", "js/connectPlayersScreenV10.js", "js/startJoinViewModel.js"],
 "league": ["css/v10Setup.css", "js/leagueWheel.js", "js/v10Setup.js"],
 "club": ["css/v10Club.css", "js/clubScreenV10.js"],
 "transfer": ["css/v10Transfer.css", "js/transferScreenV10.js"],
 "season-results": ["js/seasonFinalV10.js"], "final-winner": ["js/seasonFinalV10.js"], "standings": ["js/seasonFinalV10.js"],
 "legacy": ["css/rivalryLegacyV10.css", "js/rivalryLegacyV10.js", "js/rivalryLegacyV10Markup.js"],
 "rivalry-statistics": ["css/rivalryLegacyV10.css", "js/rivalryLegacyV10.js", "js/rivalryLegacyV10Markup.js"],
 "trophy-room": ["js/careerScreensV10.js"], "career-statistics": ["js/careerScreensV10.js"],
 "rule-book": ["css/rulesSettingsV10.css", "js/rulesSettingsV10.js"], "settings": ["css/rulesSettingsV10.css", "js/rulesSettingsV10.js"],
}

VIEWPORTS = ["360x640 (small phone, upright)", "390x844 (iPhone, upright)", "430x932 (large iPhone, upright)",
             "844x390 (iPhone, sideways)", "932x430 (large iPhone, sideways)", "768x1024 (tablet, upright)",
             "1280x650 (small laptop)", "1366x768 (Chromebook)", "1920x1080 (desktop)", "2560x1080 (ultrawide)"]
ASPECTS = [  # key, title, instruction
 ("long-names", "long names", "Put the longest realistic texts into this screen in your head (22 letter club name, 14 letter manager name, 3 digit scores, 7 seasons) and make sure nothing overlaps, overflows or pushes a button away. Use ellipsis, wrapping or smaller text where a name sits in a fixed box."),
 ("tap-targets", "tap targets", "Every button, tab and link must be at least 44 by 44 CSS px on touch screens (pointer: coarse or max-width 760px), with at least 8 px between neighbours. Fix the ones that are smaller. Desktop with a mouse must not change."),
 ("focus-motion", "keyboard focus and reduced motion", "Every control needs a visible focus ring from the keyboard (:focus-visible), and animations must stop or shorten under prefers-reduced-motion. A mouse or finger user sees no change."),
 ("contrast", "text contrast", "Find text and background pairs below 4.5 to 1 (3 to 1 for text of 24 px or larger). Fix the worst five by changing the text colour only, never the artwork. List the pairs in the results file."),
 ("alt-text", "picture descriptions and labels", "Every meaningful image needs a short alt text, every decorative one alt=\"\" or aria-hidden, every icon-only button an aria-label. Change only attributes, never visible text or layout."),
 ("loading-state", "loading state", "Look at what the screen shows while its data loads. It must show something calm and readable (no empty frame, no half-drawn layout, no jump when data arrives). Fix with CSS, and with markup classes only if needed. Do not change any text."),
 ("empty-state", "empty state", "Look at what the screen shows when there is no data yet (a brand new career, no trophies, no seasons). It must look finished, not broken: centred message, correct spacing, no empty boxes with borders. Do not change any text."),
 ("error-state", "error and retry state", "Look at what the screen shows when something fails to load. The message and its retry button must be fully visible and tappable at phone and desktop sizes, not hidden behind other layers. Do not change any text or logic."),
 ("touch-hover", "hover-only effects", "Find anything that is shown or usable only on :hover. Make each also work by touch: apply the style on :focus-visible and :active, or show it always when pointer: coarse."),
]
STUDY_VARIANTS = [
 ("phone-a", "phone mockup, version A (faithful)", "A phone mockup of the screen, version A: stay close to the desktop mockup's look, only re-flow it for a 390x844 upright phone."),
 ("phone-b", "phone mockup, version B (bold hierarchy)", "A phone mockup of the screen, version B: make the single most important thing on the screen unmissable (bigger, higher), and group the rest into clear blocks, for a 390x844 upright phone."),
 ("phone-c", "phone mockup, version C (compact)", "A phone mockup of the screen, version C: the most compact layout that still shows every element without a nested scroll, for a small 360x640 upright phone."),
 ("sideways", "sideways phone study", "A sideways phone design of the screen for 844x390: every element reachable with one page scroll, main action always reachable, nothing overlapping."),
 ("tablet", "upright tablet study", "An upright tablet design of the screen for 768x1024 and 820x1180: a real tablet layout, not a scaled phone."),
 ("desktop-a", "improved desktop, version A (polish)", "An improved desktop version, version A: the same layout as today with better spacing, type scale and alignment, for 1920x1080."),
 ("desktop-b", "improved desktop, version B (focus)", "An improved desktop version, version B: stronger focus on the main action and the key numbers, calmer secondary information, for 1920x1080."),
 ("desktop-c", "improved desktop, version C (wide)", "An improved desktop version, version C: make better use of a wide 1920x1080 and an ultrawide 2560x1080 screen, with the 1366x768 Chromebook size noted."),
 ("states", "states sheet", "One HTML sheet showing the screen in its states side by side at 1440x900: loading, empty, normal, long names, and error with retry. Same elements and text as the real screen."),
]
AUDIT_MODULES = [
 "seasonEngine", "transferChallenge", "productionSharedTransferChallenge", "sparkSharedTransferChallenge", "sharedTransferChallenge",
 "restore", "importAnalysis", "persistentNikDanielPair", "sparkConnectedRivalry", "visualIdentity", "saveLibraryRuntime",
 "saveLibraryUI", "productionSharedShowdownPresentation", "productionSharedTerminalClose", "sparkSharedSeasonResults",
 "productionSharedSeasonResults", "productionSharedSeasonCommit", "sparkSharedSeasonCommit", "productionSharedJourneyEntry",
 "productionSharedJourneyReconnect", "productionSharedMultiSeasonProgression", "productionSharedCareerStart",
 "productionSharedShowdownSetup", "sparkSharedShowdownSetup", "sharedShowdownSetup", "sparkTerminalClose",
 "productionSharedCanonicalScoring", "productionSharedHistoryConvergence", "sharedHistoryConvergence", "sharedJourneyReconnect",
 "sharedActiveShowdownAdapter", "statistics", "legacy", "analytics", "settings", "screens", "menuExperience", "clubAssignment",
 "storage", "diagnostics", "offlineApp", "sparkCompletedShowdownReader", "sparkCompletedTransferHistoryReader",
 "careerScreensV10", "rivalryLegacyV10", "transferScreenV10", "clubScreenV10", "seasonFinalV10", "homeScreensV10", "v10Screens",
]

def generic(n, title, stage, base, body, files, branch_kind="gameplay", tag="", done=""):
    extra = ("- **Open the pull request as a DRAFT** (this job adds new files only, so it needs no full CI run; the lead reads drafts without waiting for checks).\n" if base != BASE
             else "- **Open the pull request as a DRAFT.** The Team G lead marks at most eight ready for review, so each head is checked once. Never mark it ready yourself.\n")
    return (f"# JOB-{n} · {title} (stage {stage})\n\n{lane(base)}\n\n{body}\n"
            f"## Read (only these)\n{reads_md(files)}\n\n{SIZE}\n{done}{RULES.format(base=base, branch=f'{branch_kind}/job-{n}', n=n, tag=tag)}{extra}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--first", type=int, required=True)
    a = ap.parse_args()
    n = a.first
    tickets, slots = [], {s: [] for s in SLOTS}
    def add(slot, **t):
        nonlocal n
        t["job"] = n; n += 1
        tickets.append(t); slots[slot].append(t)
    nochange = lambda j: f"- DEFAULT: if you find nothing wrong after reading the files, change nothing and push only the status file `status/JOB-{j}.md` saying `no change needed` with the three most likely risks you checked.\n"
    for sid, title, files, slot in SCREENS:
        pre = f"visual-assets/v10_1/{sid}/assets/"
        for vp in VIEWPORTS:
            add(slot, key="vp", screen=sid, stage=2, mode="code", stitle=title, title=f"{title}: fix the {vp.split(' ')[0]} view",
                files=files, text=f"## What to fix\nCheck only the **{vp}** view of the **{title}** screen and fix what is wrong in the CSS: no content cut off, no horizontal scroll, no text over text, no button off screen, one page scroll (no nested scroll box), tap targets at least 44 px on touch sizes. Use media queries that apply only to this size range so other sizes do not change.\n")
        add(slot, key="s3", screen=sid, stage=3, mode="code", stitle=title, title=f"{title}: match the desktop mockup", files=files,
            text=f"## What to fix\nMatch the current desktop **{title}** screen to its desktop mockup.\n- Find the mockup of this screen: in this repo look at the pictures in `{pre}` named `ENV_*_PLATE_V1_*`, and in the ChatGPT project's files if you can reach them. List at most 8 differences in spacing, sizes, alignment, text style, colours or order of elements between the mockup and the code and fix the clear ones in the CSS (tiny markup class changes only when a class is missing). Never change text a player reads, an order of taps, or game logic.\n- Save the list as `project-documents/gameplay-factory/queue/results/{sid}-s3.md` (fixed / not fixed with reason).\n- DEFAULT: if you cannot find the mockup, do not guess. Push only `status/JOB-N.md` saying `NEEDS MOCKUP` and where you looked.\n")
        for key, ktitle, text in ASPECTS:
            add(slot, key="a-" + key, screen=sid, stage=2, mode="code", stitle=title, title=f"{title}: {ktitle}", files=files,
                text=f"## What to fix\nFor the **{title}** screen only: {text}\nCSS only unless the instruction says otherwise.\n")
        for key, ktitle, text in STUDY_VARIANTS:
            st = 4 if key.startswith(("phone", "sideways", "tablet")) else 5
            add(slot, key="st-" + key, screen=sid, stage=st, mode="study", title=f"{title}: {ktitle}", files=files,
                text=f"## What to make\n{text}\n- Self-contained HTML with inline CSS and no JavaScript. Use the existing artwork under `{pre}` (relative links such as `../../../../{pre}<file>`) and the screen's desktop mockup in this ChatGPT project's files. If you can, use GPT-6's picture and design features to look at the mockups.\n- Keep every element, all text and the same order of taps as the real screen. Presentation only.\n- Files (3 at most): `project-documents/gameplay-factory/studies/{sid}/<kind>-<job>.html`, `.../<kind>-<job>-notes.md` (at most 15 lines: what you chose and why), and `.../studies/{sid}/README.md` only if it does not exist (one line).\n")
    for i, (key, title, text, files) in enumerate(CROSS):
        add(["B5", "B6", "B7", "B8", "B9"][i % 5], key="x-" + key, screen="shared", stage=1, mode="audit", title="Audit all screens: " + title.lower(), files=files,
            text=f"## What to do\nRead-only check across the Team V screens. {text}\n- Do NOT edit any game file. Write at most 8 findings in `project-documents/gameplay-factory/queue/audits/x-{key}.md`: screen, file and line, what is wrong, the smallest CSS or markup change. The Team G lead bundles real findings into one fix job.\n- DEFAULT: if you find nothing, write `no findings` and what you checked.\n")
    for i, m in enumerate(AUDIT_MODULES):
        slot = ["B5", "B6", "B7", "B8", "B9"][(i + 2) % 5]
        add(slot, key="audit", screen="gameplay", stage=1, mode="audit", title=f"Audit js/{m}.js for gameplay bugs (first half)",
            files=[f"js/{m}.js"], module=m, half=1,
            text=f"## What to do\nRead the **first half** of `js/{m}.js` carefully (lines 1 to the middle) and look for real bugs a player could hit: wrong scores or counts, a state that can get stuck, a button that does nothing, a wrong screen after a refresh or reconnect, a value that is off by one, a double tap that does something twice. Skip style and speculation.\n- Write at most 3 findings in `project-documents/gameplay-factory/queue/audits/{m}-1.md`. Each finding: file and line, what the player sees, why the code does it (quote 1 to 3 lines), and the smallest change. Mark each `SURE` or `PROBABLE`.\n- DEFAULT: if you find nothing real, write `no findings` and the three riskiest places you checked. Do not edit any game file in this job.\n")
        add(slot, key="audit", screen="gameplay", stage=1, mode="audit", title=f"Audit js/{m}.js for gameplay bugs (second half)",
            files=[f"js/{m}.js"], module=m, half=2,
            text=f"## What to do\nRead the **second half** of `js/{m}.js` carefully (from the middle to the end) and look for real bugs a player could hit: wrong scores or counts, a state that can get stuck, a button that does nothing, a wrong screen after a refresh or reconnect, a value that is off by one, a double tap that does something twice. Skip style and speculation.\n- Write at most 3 findings in `project-documents/gameplay-factory/queue/audits/{m}-2.md`. Each finding: file and line, what the player sees, why the code does it (quote 1 to 3 lines), and the smallest change. Mark each `SURE` or `PROBABLE`.\n- DEFAULT: if you find nothing real, write `no findings` and the three riskiest places you checked. Do not edit any game file in this job.\n")
    out_jobs = GF / "jobs"; out_slots = GF / "queue" / "slots"
    out_slots.mkdir(parents=True, exist_ok=True)
    for d in ("results", "audits"): (GF / "queue" / d).mkdir(parents=True, exist_ok=True)
    for t in tickets:
        j = t["job"]
        t["prefix"] = f"study/job-{j}-" if t["mode"] == "study" else (f"qa/job-{j}-" if t["mode"] == "audit" else f"gameplay/job-{j}-")
        if t["mode"] == "study":
            body = (f"This is a **study**: new files only, no game code. Team V's lead decides which studies become real screens.\n\n" + t["text"].replace("<job>", str(j)).replace("<kind>", t["key"][3:]))
            md = generic(j, t["title"], t["stage"], STUDY_BASE, body, t["files"], "study")
        elif t["mode"] == "audit":
            body = "This is a **reading audit**: you only write a findings file. The Team G lead turns real findings into fix jobs.\n\n" + t["text"]
            md = generic(j, t["title"], t["stage"], AUDIT_BASE, body, t["files"], "qa")
        else:
            body = t["text"].replace("status/JOB-N.md", f"status/JOB-{j}.md")
            if "DEFAULT" not in body: body += nochange(j)
            grp = GROUPS[t["screen"]]; t["group"] = grp
            fl = ", ".join(f"`{f}`" for f in EDIT[t["screen"]])
            body += (f"\n**Editable files (the adapter layer, and the only ones you may change):** {fl}.\n"
                     f"**Frozen, read only:** everything under `visual-assets/v10_1/` is Team V's design source. If the fix would need a change there, do not make it: push only `status/JOB-{j}.md` saying `NEEDS TEAM V` with what and why.\n"
                     f"**Lock group:** `{grp}` (one open code pull request per group at a time).\n")
            vp = t["title"].split("fix the ")[1].split(" ")[0] if "fix the " in t["title"] else "1920x1080"
            done = (f"## Done check (the Team G lead runs this)\n- `node scripts/pos10-syntax.mjs` and `npm run -s test:contracts` pass in CI (Showdown Gate green).\n"
                    f"- The **{t['stitle'] if 'stitle' in t else t['screen']}** screen looks right at **{vp}** and is unchanged at 1920x1080 and 390x844 (except where this job says otherwise).\n\n")
            md = generic(j, t["title"], t["stage"], BASE, body, t["files"], tag=f"[{grp}] ", done=done)
            t["edit"] = EDIT[t["screen"]]
        (out_jobs / f"JOB-{j}.md").write_text(md)
    for s in SLOTS:
        if s in REVIEW_SLOTS:
            (out_slots / f"{s}.md").write_text(REVIEW.format(slot=s, repo=REPO, pick="oldest"))
        else:
            (out_slots / f"{s}.md").write_text(slot_file(s, slots[s]))
    q = {
        "_about": "Mega factory queue (Nik 2026-10-10): 2 GPT accounts (A, B) x 10 chat slots. A slot is a standing ChatGPT chat; its slot file lists its jobs in order and the chat picks the first job whose branch does not exist yet. queue_state.py derives live state from GitHub branches and PRs; never hand-write state.",
        "slots": {s: {"kind": "reviewer" if s in REVIEW_SLOTS else "worker", "account": s[0],
                      "standing_line": standing_line(s), "file": f"queue/slots/{s}.md",
                      "jobs": [t["job"] for t in slots[s]]} for s in SLOTS},
        "tickets": {str(t["job"]): {"title": t["title"], "stage": t["stage"], "screen": t["screen"],
                                    "mode": t["mode"], "prefix": t["prefix"], "kind": t["key"], "group": t.get("group")} for t in tickets},
        "base_branches": {"code": BASE, "study": STUDY_BASE, "audit": AUDIT_BASE},
    }
    (GF / "queue" / "QUEUE.json").write_text(json.dumps(q, indent=1, ensure_ascii=False) + "\n")
    print(f"{len(tickets)} tickets, first {a.first}, last {n-1}")

if __name__ == "__main__":
    main()
