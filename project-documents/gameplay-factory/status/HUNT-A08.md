Slice A08: js/sharedCareerAnalytics.js lines 1-158

| # | confidence | what the player sees | example | file:line and quoted lines |
| --- | --- | --- | --- | --- |
| 1 | HIGH | Career Statistics attributes Biggest Showdown win to Daniel while Trophy Room calls the equal record Shared. | Daniel wins one finished Showdown by 2 points; Nik wins another by 2 points. Career Statistics displays Daniel by 2 and Trophy Room displays Shared 2. | js/sharedCareerAnalytics.js:95 `manager:managers.size===1?tied[0].manager:"shared"` and :140 `if(biggestShowdownWin===null` (first winning manager is retained on equal margins). |
| 2 | HIGH | Tied career standings have numbered first and second ranks, even when both managers are marked level. | After two finished Showdowns both managers have 14 career points and one season win. Trophy Room displays 1. Daniel (level), 2. Nik (level). | js/sharedCareerAnalytics.js:101 `standings.forEach(row=>{row.level=true;});` and js/careerScreenSeam.js:85 `label:(index+1)+". "+csNames[row.manager]` |

No game code changed.
