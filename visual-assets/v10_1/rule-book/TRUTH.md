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
