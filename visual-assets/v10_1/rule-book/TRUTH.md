# Rule Book · Product truth

Authority: live product on `main` (`js/ruleBook.js`, `js/optionalModules.js`, `js/screens.js`, `index.html`) plus `project-documents/factory/PRODUCT_TRUTH.md` and `DATA_CONTRACT_V1.md`.

## Ids and routes

### Screen and entry ids

| Hook | Product use |
| --- | --- |
| `#ruleBookButton` | Home menu entry button in `index.html`; `initializeOptionalModules()` binds it to `openOptionalModule("ruleBook")`. |
| `#ruleBook` | Lazy-created screen root. `createRuleBookScreen()` uses it as the duplicate-mount guard; `showScreen("ruleBook")` uses it as the route target. |

### Route

1. Home `#ruleBookButton` → `openOptionalModule("ruleBook")` in `js/optionalModules.js`.
2. `ensureRuleBookModule()` loads `css/rulebook.css` and `js/ruleBook.js`, requiring `window.openRuleBook`.
3. `openRuleBook()` calls `createRuleBookScreen()`, then `showScreen("ruleBook")`.
4. `ruleBook` is a registered screen in `js/screens.js` and is always a legal route, with or without an active Showdown.
5. Back: the only screen button is `.backButton[data-smart-back]`. The centralized smart-back delegate in `js/screens.js` intercepts `.backButton` and calls `navigateBackSmart()`. `SAFE_BACK_TARGETS.ruleBook` is exactly `["mainMenu"]`, so Back returns to Home.

### Classes and structural hooks

Created by `js/ruleBook.js` and used by `css/rulebook.css` and/or shared navigation:

- Screen root: `screen`, `hidden`, `ruleBookScreen`
- Hero: `ruleBookHero`
- Grid: `ruleBookGrid`
- Rule article: `ruleSection`
- Rule header: `ruleSectionHeader`
- Scoring article modifier: `scoringRuleSection`
- Scoring rows: `ruleScoreTable`
- Scoring maximum: `ruleScoreMaximum`
- Actions: `ruleBookActions`
- Back control: `backButton`
- Back marker attribute: `data-smart-back` (emitted by this screen; the current centralized click handler keys on `.backButton`)

No Rule Book-specific references appear in `CURRENT_PRODUCT_TEST_MANIFEST.json` or `POS20_SUPPLEMENTAL_PRODUCT_TESTS.json`; the route and shared hooks above are the live code dependencies.


## Buttons and exact visible strings

The Rule Book itself has one button: `BACK TO MAIN MENU`, on `.backButton[data-smart-back]`; it returns to `mainMenu`.

Rendered Rule Book copy from `js/ruleBook.js`, verbatim:

`RULE BOOK`
`CAREER MODE SHOWDOWN`
`THE LOCKED COMPETITION RULES`
`Daniel and Nik. One league. Permanent clubs. One rivalry.`

### 01 · SHOWDOWN FORMAT

- `Career Mode Showdown is a two-player rivalry for Daniel and Nik.`
- `Daniel is Player One. Nik is Player Two.`
- `Both managers compete in the same selected league.`
- `The assigned clubs remain fixed for the entire Showdown, across every season.`
- `A Showdown may contain 1, 3, 5, or 10 seasons.`

### 02 · MATCH PLAY

- `Career Mode matches are simulated.`
- `A Champions League final may be played or simulated by the manager.`
- `The main domestic cup final may be played or simulated by the manager.`
- `No other match-play exceptions are part of the current rules.`

### 03 · TRANSFER CHALLENGE

- `Each manager may sign a maximum of three players per season.`
- `The transfer window challenge lasts 15 minutes.`
- `The opponent receives three guesses.`
- `Each guess must be either a league or a nationality.`
- `If a signing matches a correct guess, that signing must be released before the season begins.`

### 04 · SCORING

- `Champions League winner` → `+5`
- `Domestic league winner` → `+3`
- `Main domestic cup winner` → `+1`
- `100 league points and/or 100 league goals` → `+1 MAX`
- `League Top Scorer and/or Top Assist` → `+1 MAX`
- `MAXIMUM PER MANAGER / SEASON` → `11`

### 05 · TIEBREAK

- `If both managers finish a season with the same Showdown points, use the approved fallback.`
- `The manager with the better league finishing position wins the season.`
- `If both managers finish in the same league position, the manager with more league points wins.`
- `No goal-difference, goals-scored, or head-to-head tiebreak is used.`

### 06 · CONNECTION & RECOVERY

- `Daniel and Nik connect once before the first Showdown and can then continue the same career from a remembered account and browser.`
- `A new or forgotten browser may need to be connected again before play continues.`
- `Device storage may be used internally for recovery and rollback, but it does not create a separate gameplay mode.`
- `Results are entered manually from FIFA 17; screenshots and match notes are not required.`

There are no Rule Book-owned aria-labels, empty messages, loading messages, or in-screen error messages. The lazy Home entry only changes `aria-busy`; its visible label does not change. A lazy-open failure is reported at app level as `Unable to open ruleBook`, not as Rule Book body copy.

No Rule Book body string changes by manager, Showdown progress, completion state, or history availability.


## Data contract

Authority: `project-documents/factory/DATA_CONTRACT_V1.md` §0 only. The Rule Book is static rules copy and displays no Showdown-history, season-history, transfer-history, manager-record, score, club, league, or provider field. There are therefore no displayed Rule Book data fields to classify E or A.

### Universal contract state

`DATA_CONTRACT_V1.md` §0 requires every screen view model to use exactly one `status`: `loading`, `empty`, `unavailable`, `partial`, or `ready`. The current `main` Rule Book has no provider read and no screen view model; once its lazy JS/CSS module mounts, its effective state is `ready`.

| Contract status | Rule Book meaning |
| --- | --- |
| `loading` | Optional JS/CSS is loading before the screen mounts; `main` has no Rule Book body loading UI. |
| `empty` | Not applicable: static rules cannot be an empty career. |
| `unavailable` | Not a Rule Book body state: there is no provider read. A module-load failure remains an app-level open error. |
| `partial` | Not applicable: static rules are not aggregated history. |
| `ready` | The Rule Book is mounted and all six rule sections are available. |

The exact §0 interim label is `Current Showdown only. Career history is not yet available.` It is not rendered on Rule Book because this screen shows no career-history data.

The §0 fixture bounds do not create Rule Book fields. The fixed copy `1, 3, 5, or 10 seasons` matches the allowed `totalSeasons` values, but it is rules text rather than fixture data.

Contract §9 dropped statistics do not appear and must not be added: clean sheets, biggest single-match win, European wins other than the Champions League, player names or player-based leaders/photos, match-by-match results, possession, or any per-match stat.


## Screen states and preview frames

The live Rule Book is static and role-neutral. It does not vary with Daniel/Nik role, active/completed Showdown state, or career-history availability.

| Candidate state | Product answer |
| --- | --- |
| `loading` | Exists only in the lazy module loader before the screen mounts. No Rule Book body loading frame exists on `main`. |
| `empty` | Not applicable. |
| `partial` | Not applicable. |
| `unavailable` | Not a Rule Book body state because there is no data read. |
| error | A module/open failure is app-level and prevents the Rule Book body from mounting. |
| active Showdown | Same Rule Book copy and layout. |
| completed Showdown | Same Rule Book copy and layout. |
| Daniel viewer | Same Rule Book copy and layout. |
| Nik viewer | Same Rule Book copy and layout. |
| `ready` | The real Rule Book screen: all six rule sections present. |

Preview frames for the factory build:

- `RB1` · opened from Home: standard `ready` Rule Book, all six sections present, Back to Main Menu available.
- `RB2` · long-content stress view: still the same `ready` screen with all sections present. The job phrase “a long section open” is adjusted because `main` has no accordion/collapse behavior; every section is always expanded. Use this frame to verify the longest rule copy and scoring rows remain readable without changing wording.

No preview frame may reveal private rivalry inputs or introduce manager-specific content.


## Mockup reconciliation

There is no Rule Book mockup or goal image in `project-documents/factory/mockups/`; the folder README lists Trophy Room, Career Statistics, Rivalry Statistics, Legacy, Season Results, Start / Join, Home, League, Club and Transfer only. For Rule Book, live product copy and product truth are the authority.

| Mockup element | Product answer |
| --- | --- |
| No Rule Book mockup exists | N/A. Do not invent a visual-content requirement from another screen. Preserve the live Rule Book rules, scoring, routing and Back behavior, then apply the shared factory visual language in the later build job. |

Product-truth overrides that still govern the later visual build even without a mockup:

- KEEP Daniel before Nik in copy and any future composition; Daniel LEFT, Nik RIGHT if portraits are used.
- KEEP scoring exactly: Champions League +5, league title +3, domestic cup +1, performance bonus max +1, awards bonus max +1, season max 11.
- DROP any unrecorded-stat additions listed in PRODUCT_TRUTH §3 / DATA_CONTRACT_V1 §9.
- DROP any real crests, league logos, trophies, EA/FIFA art or player imagery.
- KEEP only the real Back action plus shared navigation supplied by the factory navigation job; do not invent Rule Book actions.


## Open questions

None. The live product fully determines Rule Book content, scoring, routing and Back behavior, and there is no Rule Book mockup to reconcile. The later build may recompose the static content for the factory phone/no-scroll quality bar, but it must not add competition rules, change wording, add unrecorded data, or invent Rule Book actions.
