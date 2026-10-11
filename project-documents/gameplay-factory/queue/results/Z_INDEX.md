# JOB-1476 · Stacking-order inventory (stage 1)

Source: `qa/mega-audits`. Inspection restricted to the four ticket-approved Team V CSS files. Line numbers refer to that branch. The table records CSS declarations, not comment-only suggested values or browser-computed layers.

| Selector | z-index | File:line |
| --- | ---: | --- |
| `html[data-v10-screen="mainMenu"]:not([data-v10-setup]) #app #topHeader` | 12 | `css/v10Shell.css:22` |
| `html[data-v10-screen]:not([data-v10-setup]):not([data-v10-screen="mainMenu"]) #app #topHeader` | 41 | `css/v10Shell.css:49` |
| `html[data-v10-screen="careerStatistics"] #careerStatistics.careerScreenV10, html[data-v10-screen="trophyRoom"] #trophyRoom.careerScreenV10` | 30 | `css/v10Shell.css:80` |
| `html[data-v10-screen="standings"] #app #standings.standingsScreenV10` | 30 | `css/v10Shell.css:86` |
| `html[data-v10-setup]:not([data-v10-screen="mainMenu"]) #app #topHeader` (desktop) | 41 | `css/v10Shell.css:135` |
| `html[data-v10-tools] #app #topHeader` | 41 | `css/v10Shell.css:183` |
| `#transferChallenge.tw-on > .tw-host` | 30 | `css/v10Transfer.css:14` |
| `#transferChallenge .tw-host .phone-hero-daniel` | 3 | `css/v10Transfer.css:99` |
| `#transferChallenge .tw-host .phone-hero-nik` | 2 | `css/v10Transfer.css:107` |
| `#settingsOverlay.v10Settings #settingsClose` | 20 | `css/rulesSettingsV10.css:14` |
| `#ruleBook.v10RuleBook` | 30 | `css/rulesSettingsV10.css:62` |
| `#mainMenu.v10Home .menuTile .menuTileCode` | 2 | `css/homeV10.css:24` |
| `#app > footer` | 7 | `css/homeV10.css:42` |
| `#mainMenu.v10Home .menuAthleteCredit` | 6 | `css/homeV10.css:49` |
| `#app #topHeader` | 12 | `css/homeV10.css:58` |
| `#mainMenu.v10Home #persistentNikDanielPairPanel` | 11 | `css/homeV10.css:73` |
| `#mainMenu.v10Home > .nav-reserve` | 5 | `css/homeV10.css:110` |
| `#mainMenu.v10Home > .fifaMenuShell` (phone portrait) | 4 | `css/homeV10.css:157` |
| `#mainMenu.v10Home .fifaMenuGrid > .menuTile:not(#continueCareer) .menuTileLabel` | 2 | `css/homeV10.css:180` |
| `#mainMenu.v10Home .phoneSheetToggle` (phone landscape) | 3 | `css/homeV10.css:283` |
| `#mainMenu.v10Home .phoneSheetToggle:checked ~ .menuMediaSelector` (phone landscape) | 8 | `css/homeV10.css:295` |
| `#mainMenu.v10Home .menuBottomStrip` (phone landscape) | 6 | `css/homeV10.css:301` |

**Observed order in scoped files:** major screens = 30; app header on non-Home stages = 41; Home header = 12; in-screen decoration = 2–8. The close button's 20 is local to Settings, **not** proof that the dialog itself is layer 20. The transfer CSS comment describes a bar at 40 and app overlays at 80+, but those declarations do **not** occur in the four inspected files.

**Not established by this scope:** computed `z-index` and stacking context for `#settingsOverlay`, `#appRuntimeNotice`, other toasts/banners and dialog hosts. These may be defined in excluded stylesheets or inline styles. A numeric comparison across different stacking contexts is insufficient to prove paint order. See `project-documents/gameplay-factory/queue/audits/x-layers.md` for the follow-up findings. No product CSS changed.
