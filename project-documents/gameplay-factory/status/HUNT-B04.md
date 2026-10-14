Slice B04: js/sharedSeasonResults.js lines 1-75

| # | confidence | what the player sees | example | file:line and quoted lines |
| --- | --- | --- | --- | --- |
| 1 | HIGH | Empty league-points or goals values are accepted as **0** instead of rejected. The zero is saved as an actual result and can appear on both managers' screens after reload. | In a 3-season Showdown, player one publishes Season 2 with league position 3, `leaguePoints: ""`, `leagueGoals: null`, and valid award flags. The shared record saves **0 points, 0 goals** rather than flagging the missing values. | `js/sharedSeasonResults.js:32` — **32:** `const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals),maxPoints=(teamCount-1)*2*3;` |
