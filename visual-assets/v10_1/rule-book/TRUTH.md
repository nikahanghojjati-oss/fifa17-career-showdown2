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
