# Career Mode Showdown — r78: the marble look (v1.9.2 runtime r78)

Application version: `v1.9.2`  
Runtime asset revision: `1.9.2-r78`  
Previous known-good runtime: `1.9.1-r77`

r78 is the visual release the owner calls r78. The application version moves to 1.9.2 and the runtime revision to r78.

## What changed

- Phone marble (HO-031, #894, #895). On phones, sideways phones and upright tablets, Home, Club, Connect Players, Final
  Winner, Legacy, Season Results, Statistics and Transfer draw Team V's marble phone plates with both managers painted in.
  Standings, Rivalry Statistics and Trophy Room draw the v3 marble plates. League (HO-032, #899) draws Team V's V5 marble
  plate with a 15% smaller wheel on upright phones 340-430px wide, up to 960px tall, with a width/height ratio of at least
  59/128; taller phones (for example 412x915 and 360x800) keep the old League look. Desktop is unchanged.
- Rule Book and Settings on phone and tablet use Team V's marble phone plates. Phone panels lose the glass blur and wear the
  desktop tile's black-marble face (#891).
- New marble loading screen (HO-030, #892): the Reus photo in the black-and-gold marble tunnel, title baked into the picture,
  credit "Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped and edited for display".
- Readable body text and marble pop-ups (HO-028, HO-029, #893): one body type (Barlow 16px, ivory), and errors, modals,
  toasts and notes in black-and-gold marble. Every native `confirm()` is now one shared marble confirm box.
- No dimming anywhere (HO-027, #890): the losing manager, empty or signed-out panels, disabled Home tiles and the gear show at
  full brightness; the words say the state.
- The Career tab on Home goes to your game, and DELETE CURRENT SHOWDOWN exists only in Settings (#889).
- Settings no longer shows the REAL CAREER STARTED row (#887).
- The application version moves to 1.9.2 and the runtime revision to r78.

## Update safety

- The shell and service worker advance to r78 in a fresh `career-mode-showdown-shell-1.9.2-r78` cache, and r77 is retained
  for rollback.
- An installed phone keeps running the r77 shell from its own cache until the r78 worker takes over on Home, and r77 is the
  rollback copy afterwards. That shell still draws 12 of the phone images r78 stopped using, so they stay deployed for this
  release and are removed in r79.

## What did not change

- The scoring formula, game rules, the fewer-taps flow and Remote Joining stay as they were.
- The no-flash rules, the Reus Gate, preload, decode and startup order are unchanged. Startup stays within its gzip budget.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten.

## Firestore Rules

- No Rules change.

## Checks

- Filled in on the release PR from the exact release head.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r78.
