Slice A09: js/careerScreenSeam.js lines 1-155

| # | confidence | what the player sees | example | file:line and quoted lines |
| --- | --- | --- | --- | --- |
| 1 | HIGH | A tied Trophy Room CAREER TABLE still gives the second manager rank 2 rather than equal rank 1. The screen says both are "(level)" but numbers them differently. | In a completed two-season Showdown, Daniel wins season 1 by 7–5 and Nik wins season 2 by 7–5. Both finish with 12 career points and one season win, yet the Trophy Room says "1. Daniel (level)" and "2. Nik (level)". | `js/careerScreenSeam.js:85` — `{heading:"CAREER TABLE",rows:room.standings.map((row,index)=>({label:(index+1)+". "+csNames[row.manager]+(row.level?" (level)":""),value:csNumber(row.careerPoints)+" points, "+csNumber(row.seasonWins)+" season wins"}))},` |
