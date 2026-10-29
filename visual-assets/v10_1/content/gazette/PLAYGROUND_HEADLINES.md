# Touchline Gazette: headline prompts (copy one whole block into the User box)

Settings for all three: Claude Opus 5.5, effort High, Max tokens 64000. Leave the System box empty. Each prompt is complete on its own, so start a new prompt for each one and paste the whole grey block. When it finishes, send me the raw reply.

Run order: 4B, then 5A, then 5B. About $1 each.

---

## PROMPT 4B: last 147 season headlines

```
You are the headline desk of "The Touchline Gazette", an invented newspaper inside a private two-player website called Career Mode Showdown. Two friends each manage one club in FIFA 17 career mode. After every season they enter what their club won and the site turns it into points. The Gazette prints a front page after each season and a final front page when the whole Showdown ends. Your headlines are the biggest words on that page, so they must be brilliant: the kind a reader screenshots and sends to their rival.

FACTS THE GAME KNOWS (never invent anything else)
- Points per season, per manager: Champions League 5, league title 3, domestic cup 1, performance bonus at most 1, awards bonus at most 1. Europa League can appear as a trophy. So a season is worth 0 to 11 points; never suggest more than 11 in a season.
- A Showdown lasts 1, 3, 5 or 10 seasons. Overall points are the seasons added up.
- A Golden Showdown is won by the FIRST single manager to reach 110 points. Never a combined total.
- A draw is a draw: nobody wins it, nobody loses it.
- The game does NOT know goals, match scores, scorers, players, transfers, injuries, tactics, crowds, dates or weather. Never state any of these as fact. You may play with the scoreboard, the table, the trophy cabinet, the rivalry, late nights at the console, bragging rights and the next season.

PLACEHOLDERS (the game fills these in; copy them exactly with curly brackets; never write the managers' real names)
{winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints}
{managerA} {managerB} {clubA} {clubB} {points} (for level situations only)
{leader} {trailer} (who is ahead and behind overall)
{seasonNo} {seasonsTotal}
Only use the placeholders allowed for each situation below.

HEADLINE RULES
1. ALL CAPITALS. 12 to 30 characters including spaces (count a placeholder as 10). It must break into two short lines on a phone.
2. No numbers or number words that the game should supply (no "ELEVEN", "TWO", "110"). No em or en dashes. Apostrophes are fine.
3. At most 8 of every 40 headlines may contain a placeholder.
4. Every headline is new: not the same as, or a light rewording of, anything in the EXISTING list, and no two new headlines share the same key idea or pun. No more than 3 headlines in the whole reply may start with the same word. Avoid starting with "A" or "THE" more than 6 times each per situation.
5. In each situation of 40, use this mix: 8 classic broadsheet (calm, grand), 8 tabloid shouts (short, loud, a verb that punches), 8 football wordplay puns (net, bar, post, table, cup, cabinet, whistle, extra time, penalty, offside, clean sheet, silverware, top flight, dugout), 6 alliteration, 4 short questions, 6 one-idea punchlines in two or three words plus a twist.
6. It must read naturally for any club and either manager, and be kind: tease the rivalry, never mock the loser.
7. No real newspapers, real headlines, chants, slogans, players, pundits or brands. American readers must understand it.

GOOD examples of the bar we want (do not reuse): "CABINET RESHUFFLE", "NET PROFIT", "TABLE MANNERS", "WHO BLINKED FIRST?", "SILVER SERVICE", "CROWNED AT THE DEATH".
BAD examples: "{winner} WINS THE SEASON" (flat), "A GREAT SEASON" (vague), "WON BY TWO POINTS" (number), "SCORES A HAT TRICK" (game does not know goals).

SUBHEAD AND KICKER
- "subhead": one sentence, 12 to 24 words, the plain news behind the headline in warm broadsheet English, using only that situation's placeholders. It should pay off the headline's joke, not repeat it. Numbers only through placeholders.
- "kicker": 1 to 3 words in capitals for the black label above the headline. Vary them; use any one kicker at most 4 times per situation.

WORK METHOD
Think briefly and spend your effort on writing, not on long planning. Write each situation in one pass, then quickly check rules 1 to 4 and fix anything that breaks them before replying.

OUTPUT
Reply with ONE JSON object and nothing else: no intro, no notes, no markdown fence. Straight double quotes. Ids unique and in the order shown.

THE JOB: SEASON FRONT PAGE, LAST PART (147 headlines)

Write these rows, in this order:
- lead-extended: 27 rows, ids h1-634 to h1-660. {leader} won this season and is now further ahead of {trailer} overall. Allowed: {leader} {trailer} {winner} {loser} {winnerClub} {loserClub} {margin} {seasonNo} {seasonsTotal}. (27 rows, so use the style mix roughly: 6 broadsheet, 5 tabloid, 5 puns, 4 alliteration, 3 questions, 4 punchlines.)
- level-overall: 40 rows, ids h1-661 to h1-700. After this season the two managers are exactly level overall. Allowed: {managerA} {managerB} {clubA} {clubB} {points} {seasonNo} {seasonsTotal}. Never {winner} or {loser}.
- winning-streak: 40 rows, ids h1-701 to h1-740. {winner} has now won several seasons in a row. Allowed: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonNo} {seasonsTotal}. Never say how many in a row.
- final-season-decider: 40 rows, ids h1-741 to h1-780. This season was the last one and it decided the whole Showdown for {winner}. Allowed: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal}.

JSON shape:
{"season":[{"id":"h1-634","situation":"lead-extended","kicker":"...","headline":"...","subhead":"..."}, ...]}

EXISTING season headlines (do not repeat or lightly reword any of these):
A SCOREBOARD STATEMENT | THE GAP GROWS GRAND | A SEASON IN CAPITALS | ONE WAY TRAFFIC | A GIANT POINTS HAUL | THE BIG FINISH | THAT IS SOME MARGIN | ROOM TO CELEBRATE | THE POINTS PARADE | THE DISTANCE TELLS | CLEAR BLUE SCOREBOARD | A MARGIN WITH MUSCLE | THE LEAD IS LARGE | PLENTY OF DAYLIGHT | THE BIG PICTURE | A DASH OF DOMINANCE | POINTS BY THE PLENTY | A WHISKER WILL DO | THE NARROWEST OF WINDOWS | JUST ENOUGH TO CHEER | FINE MARGINS FINE FEELING | A LITTLE GOES LONG | A SLENDER SEASON SUCCESS | THE TINIEST BREATHING SPACE | CLOSE CALL CLEAR RESULT | TWO SIDES ONE SMALL GAP | A FINISH WORTH FRAMING | SMALL GAP BIG GRIN | THE SLIM ADVANTAGE | A CLOSE SHAVE INDEED | THAT WILL JUST ABOUT DO | LITTLE BETWEEN THESE TWO | A TIGHT SEASON SETTLED | THE NARROW ROAD HOME | A SOLID SEASON'S WORK | THE CUSHION LOOKS COMFY | A HEALTHY LEAD TAKES IT | COMFORT ON THE CARD | A VERY HANDY MARGIN | NO NEED FOR A RULER | THE POINTS ADD UP | A LITTLE ROOM TO ROAR | THE CAMPAIGN PAYS OFF | SPACE ON THE SCOREBOARD | THE COMFORT ZONE | POINTS WITH PURPOSE | A REWARDING RETURN | THE GAP HAS A CHAIR | A CONVINCING CAMPAIGN | A GOOD DAY FOR ARITHMETIC | THE STEADY ROUTE HOME | LEVEL AT THE LINE | POINTS SHARED HONOURS SHARED | THE SCOREBOARD SAYS DRAW | A PERFECT BALANCE | EVEN STEVENS ON POINTS | THE SHARED SPOILS | TWO CAMPAIGNS ONE TOTAL | NO SPACE BETWEEN THEM | A MATCHED SET | DEAD LEVEL AND DELIGHTFUL | THE SAME NUMBER TWICE | THE EQUALLY GOOD NEWS | ALL SQUARE IN PRINT | THE BALANCE HOLDS | A DRAW TO REMEMBER | THE NUMBERS AGREE | SHARING THE SPOTLIGHT | EUROPE'S BIG NIGHT BELONGS | THE EUROPEAN CROWN ARRIVES | A FIVE POINT EUROPEAN TOUR | THE STARS SHINE BRIGHT | A EUROPEAN NIGHT TO FRAME | THE BIG CUP COMES HOME | FIVE POINTS OF GLORY | CHAMPIONS OF THE CONTINENT | THE ANTHEM HAS A WINNER | A TROPHY UNDER THE LIGHTS | EUROPEAN SILVERWARE SECURED | THE CROWN AND THE COUNT | A NIGHT ABOVE THE REST | FIVE FOR THE BIG ONE | THE EUROPEAN SPOTLIGHT | SILVERWARE WITH STAR QUALITY | THE CONTINENTAL CELEBRATION | EUROPA GLORY ON THE BOARD | THREE POINTS AND A TROPHY | THE EUROPA CELEBRATION | A EUROPEAN PRIZE CLAIMED | THREE CHEERS FOR EUROPA | THE ROAD ENDS IN GLORY | A CONTINENTAL CUP RETURNS | EUROPA LIGHTS UP THE PAGE | A TRIO OF EUROPEAN POINTS | THE CUP WITH THREE POINTS | A NIGHT IN EUROPA COLOURS | SILVERWARE AND THREE MORE | EUROPEAN JOY IN THREE | THE EUROPA REWARD | A CUP FOR THE CABINET | THREE POINTS ACROSS EUROPE | THE EUROPA EDITION | TOP OF THE LEAGUE | THE CHAMPIONS HAVE ARRIVED | A CROWN FOR THE CAMPAIGN | LEAGUE GLORY IN PRINT | THE TITLE IS THEIRS | CHAMPIONS ON HOME SOIL | A TITLE WORTH THE WAIT | THE LEAGUE BELONGS HERE | CROWNED AFTER THE CAMPAIGN | THE CHAMPION'S EDITION | FIRST PLACE FESTIVITIES | A LEAGUE OF THEIR OWN | THE TITLE COMES TO TOWN | DOMESTIC DELIGHT DELIVERED | THE TOP TABLE CELEBRATES | CHAMPIONS WRITE THE STORY | THE CROWN FINDS A HOME | THE CHASE GAINS GROUND | A STEP BACK TOWARD THE LEAD | THE PURSUIT FINDS ITS FEET | A LITTLE CLOSER NOW | THE GAP GETS A TRIM | THE COMEBACK HAS BEGUN | A GAIN IN THE CHASE | THE ROAD BACK OPENS | THE LEADER LOOKS BACK | POINTS TAKEN GROUND GAINED | THE CHASER STRIKES BACK | A TURN IN THE PURSUIT | THE MARGIN MEETS ITS MATCH | A CHASE WORTH WATCHING | THE GAP IS SHRINKING | A REPLY ON THE BOARD | THE COMEBACK COLUMN | THE LEADER PULLS AWAY | MORE ROOM AT THE TOP | THE LEAD GETS LONGER | POINTS PILE UP FRONT | THE GAP TAKES A STEP | FRONT RUNNER FINDS MORE | THE LEADER ADDS DISTANCE | ANOTHER STEP CLEAR | THE CUSHION GETS CUSHIONIER | THE VIEW FROM FIRST | MORE POINTS MORE DISTANCE | A LEAD WITH LEGS | OUT IN FRONT AGAIN | THE GAP GROWS AGAIN | FRONT PAGE FOR THE LEADER | THE ADVANTAGE BUILDS | THE OVERALL SCORES ALIGN | A LEVEL PLAYING LEDGER | THE BIG PICTURE IS EVEN | NOTHING BETWEEN THEM OVERALL | THE OVERALL BALANCE RETURNS | EVEN IN THE LONG VIEW | THE SHOWDOWN STANDS SQUARE | OVERALL HONOURS EVEN | TWO TOTALS ONE NUMBER | THE LEDGER LEVELS OUT | THE BIG SCOREBOARD BALANCES | A SHOWDOWN IN EQUILIBRIUM | LEVEL IN THE LONG GAME | THE TOTALS SHAKE HANDS | THE OVERALL PICTURE MATCHES | ALL SQUARE ACROSS SEASONS | THE RUN ROLLS ON | ANOTHER SEASON ANOTHER WIN | THE STREAK HAS LEGS | THE WINNING WAYS CONTINUE | A HABIT WORTH KEEPING | THE RUN CONTINUES IN STYLE | THE STREAK MAKES HEADLINES | THE WINNING COLUMN GROWS | ANOTHER ENTRY IN THE RUN | THE SEASONS KEEP COMING | THREE OR MORE AND RISING | THE STREAK STILL SHINES | A SEQUENCE TO SAVOUR | THE RUN IS STILL RUNNING | MORE MOMENTUM MORE MEMORIES | THE STREAK FINDS ANOTHER GEAR | THE FINAL CHAPTER AWAITS | ONE SEASON LEFT TO WRITE | THE LAST ACT BECKONS | THE DECIDER DRAWS NEAR | ONE MORE CAMPAIGN TO GO | THE FINALE TAKES SHAPE | THE LAST SEASON CALLS | ALL ROADS LEAD TO FINALE | THE FINAL PAGE IS BLANK | THE LAST CAMPAIGN LOOMS | THE FINALE IS SET | ONE LAST SEASON'S WORK | THE SHOWDOWN'S FINAL ACT | THE LAST WORD AWAITS | THE HOME STRETCH BEGINS | ONE SEASON TO SETTLE IT | RUNAWAY SEASON SEALED | ROUT ON THE LEDGER | MILES CLEAR AT THE WHISTLE | TOTAL CONTROL | NOBODY GETS CLOSE | LAPPED ON THE LEADERBOARD | STROLL IN THE PARK | CRUISE CONTROL ENGAGED | THUMPING TRIUMPH | AN ALMIGHTY WALLOP | NET GAINS GALORE | CABINET CRAMMED FULL | ROMPING HOME IN STYLE | CANYON ON THE TABLE | HOW BIG IS THAT GAP? | ANY ROOM FOR DOUBT? | MASTERCLASS AT THE CONSOLE | FIGURES FLY FAR APART | GULF OF A GAP | MOUNTAIN OF POINTS | POWER, PACE AND POINTS | SUPREME SEASON | WIDE AS A GOALMOUTH | STAMPEDE TO THE SUMMIT | LEAVING NO DOUBT | CLASS APART THIS TERM | EMPHATIC IS THE WORD | HAMMER BLOW ON THE BOARD | SEE YOU AT THE FINISH | OUT OF SIGHT | {winner} RUNS RIOT | MAJESTY FOR {winnerClub} | {winner} MILES AHEAD | ROMP FOR {winnerClub} | HATS OFF TO {winner} | DOMINANCE DELIVERED | STEAMROLLER SEASON | WHAT A WHOPPER | UNTOUCHABLE THIS TERM | SILVER AVALANCHE | SQUEAKING OVER THE LINE | BY A HAIR'S BREADTH | NAIL-BITER SETTLED | PHOTO FINISH VERDICT | INCHES DECIDE IT | SKIN OF THE TEETH | HEARTS IN MOUTHS | EDGED AT THE LAST | RAZOR-THIN RESULT | TIGHTROPE TRIUMPH | OFF THE BAR AND IN | KNIFE-EDGE CAMPAIGN | NOSED AHEAD AT THE END | BREATHE OUT NOW | PHEW! WHAT A FINISH | SLIMMEST OF SUCCESSES | WAFER-THIN WINNER | TOO CLOSE FOR COMFORT | COULD IT BE ANY TIGHTER? | FINGERNAILS BITTEN | DEAD HEAT DODGED | SPLITTING HAIRS | NERVES OF STEEL | JUST ABOUT JUBILANT | EKED OUT ON THE CARD | SNATCHED IN EXTRA TIME | SQUEEZE PLAY SUCCEEDS | BOOTLACE VICTORY | HANGING ON FOR GLORY | TENSE? JUST A BIT | SCRAPED BUT SAVOURED | NARROW BUT NOTABLE | BY A NOSE, {winner} | STEELY {winner} PREVAILS | RELIEF FOR {winnerClub} | EDGE TO {winner} | SWEATING ON THE SUMS | CALCULATORS OUT | TENTERHOOKS TO TRIUMPH | PULSES RACING TO THE END | SAFE AND SOUND | FEET UP BY THE FINISH | NO SWEAT THIS SEASON | TIDY WORK ALL ROUND | SMOOTH SAILING | ARMCHAIR RIDE | CALM, COOL, COLLECTED | ASSURED FROM START TO END | EASY DOES IT | COMFORTABLY CLEAR | BUFFER ZONE BUILT | HANDSOME HONOURS | STEADY HANDS ON THE PAD | MEASURED MASTERY | WELL WORTH THE WIN | RELAXED AT THE WHISTLE | ROOMY AT THE TOP | SLIPPERS ON, JOB DONE | UNFLUSTERED FINISH | POISE PAYS OFF | COMPOSURE COUNTS | CLEAR AND COMFORTABLE | SORTED, WITH ROOM TO SPARE | JOB DONE, NO DRAMA | WHO NEEDS A NAIL-BITER? | UNRUFFLED AND AHEAD | COASTING TO THE TAPE | BREATHING ROOM EARNED | SECURE ON THE SCORECARD | NEATLY PARCELLED UP | SOLID AS A CROSSBAR | PLENTY IN THE TANK | GREAT, NOT GRUELLING | SERENE SEASON | {winner} CRUISES IN | SMILES FOR {winnerClub} | EASY STREET FOR {winner} | UNHURRIED AND UNMATCHED | BOSSING THE BOARD | IN CHARGE ALL ALONG | STALEMATE IN THE STANDINGS | DEADLOCKED AT THE DEADLINE | SPLIT DOWN THE MIDDLE | MIRROR IMAGE SEASONS | IDENTICAL TALLIES | NEITHER BLINKS | CAN ANYONE SEPARATE THEM? | TIED UP IN KNOTS | HONOURS ON BOTH SIDES | SAME PAGE, SAME SCORE | LOCKED TOGETHER | EVENLY DIVIDED DIVIDENDS | NO WINNER THIS TIME | LEVEL PEGGING | PEAS IN A POD | NECK AND NECK | BALANCED ON A PIN | HANDSHAKES ALL ROUND | PARITY PREVAILS | TIE GAME, TIDY STORY | SHARE AND SHARE ALIKE | MATCHING TALLIES | STANDOFF AT THE SUMMIT | CALL IT A TIE | SQUARE DEAL ALL ROUND | DEAD EVEN AT THE BELL | NOBODY BUDGES | HOLD THE FRONT PAGE: TIE | SCALES STAY STILL | STRIKING A BALANCE | EQUALS AT THE END | INSEPARABLE THIS TERM | WHO WON? NEITHER | PERFECTLY POISED | {managerA} AND {managerB} TIE | {managerB} MATCHES {managerA} | DRAWN OUT, DRAWN LEVEL | LEVEL BEST FROM BOTH | STUCK TOGETHER | STANDINGS SPLIT EVENLY | RULERS OF EUROPE | EUROPE CONQUERED | STARRY NIGHT, SILVER PRIZE | PEAK OF THE CONTINENT | ELITE CROWN CLAIMED | CROWNED IN EUROPE | SUMMIT SCALED | CONTINENT AT THEIR FEET | THE BIGGEST PRIZE OF ALL | GLORY BEYOND MEASURE | ANTHEM ANSWERED | STARS ALIGNED | CABINET'S CROWN JEWEL | JACKPOT IN EUROPE | CONTINENTAL CONQUEST | PINNACLE PRIZE PROCURED | EUROPE'S FINEST | HEAVYWEIGHT HONOUR | THE DREAM COMES TRUE | DREAMS DELIVERED ABROAD | BRIGHTEST LIGHTS, BIGGEST CUP | ATOP THE EUROPEAN TREE | MAXIMUM EUROPEAN MAGIC | NIGHT OF NIGHTS | SILVERWARE SUPREME | QUEST COMPLETE | FROM HOME TO HISTORY | EUROPEAN ROYALTY | PRIZE OF PRIZES | CONTINENTAL CLASS ACT | GRANDEST STAGE CONQUERED | IS THIS THE BEST YET? | WHO RULES EUROPE NOW? | EUROPE BOWS TO {winner} | GLORY FOR {winnerClub} | {winnerClub} ON TOP OF EUROPE | CHAMPAGNE AND SILVER | CROWNING GLORY | GOLDEN NIGHT, SILVER CUP | TROPHY OF TROPHIES | EUROPA DELIVERS | ROAD TRIP REWARDED | PASSPORT STAMPED, CUP LIFTED | EUROPA ADDS LUSTRE | TRAVELS END IN TRIUMPH | SOUVENIR FROM ABROAD | FOREIGN FIELDS CONQUERED | SHELF SPACE NEEDED | LIFTED ON THE CONTINENT | YES PLEASE, EUROPA | MISSION ABROAD ACCOMPLISHED | JOURNEY'S HAPPY ENDING | TROPHY TOUR COMPLETE | BOOKED, PACKED, LIFTED | WANDERLUST WINS | SILVER FROM OVERSEAS | GLOBETROTTING GLORY | ACROSS BORDERS, INTO CABINET | ANOTHER BADGE OF HONOUR | CUP RUN COMPLETED | EURO TRIP TRIUMPH | POLISHED AND PLACED | UNPACK THE SILVERWARE | AWAY DAYS PAY OFF | SIGHTSEEING AND SILVERWARE | FAR-FLUNG FORTUNE | SHINY SOUVENIR | HANDLES HELD HIGH | BRINGING IT HOME | GRAND TOUR, GRAND PRIZE | EXPEDITION SUCCESSFUL | WORTH EVERY MILE | HOMEWARD BOUND, HEADS HIGH | VOYAGE VINDICATED | EUROPA FOR {winner} | SILVER TRAIL FOR {winnerClub} | EUROPEAN STAMP FOR {winner} | OVERSEAS OVATION | SUITCASE NEEDS A BIGGER LID | ROAMING AND REWARDED | TITLE SECURED | TABLE TOPPERS | CROWN FITS PERFECTLY | SUMMIT OF THE STANDINGS | FLAG FLIES HIGH | DOMESTIC DOMINION | LEAGUE WON, LEGEND GROWS | PERCHED AT THE PEAK | PICK OF THE PACK | TOP-FLIGHT TRIUMPH | CHAMPIONS, PLAIN AND SIMPLE | BEST IN THE LAND | LONG HAUL, LEAGUE CROWN | MARATHON MASTERED | GRIND BECOMES GLORY | TITLE TALK OVER | STANDINGS SETTLED | PENNANT RAISED | KEYS TO THE KINGDOM | SITTING PRETTY UP TOP | UNRIVALLED AT HOME | CHAMPAGNE ON ICE | PARADE ROUTE PLANNED | OPEN-TOP BUS BOOKED | CLINCHED AND CROWNED | TOP SPOT TAKEN | REIGN SUPREME AT HOME | LEADERS TO THE LAST | BANNER SEASON | ULTIMATE TABLE TRIUMPH | HIGHEST RUNG REACHED | PEERLESS IN THE LEAGUE | NOBODY ABOVE THEM | LEAGUE CROWN FOR {winnerClub} | TITLE TO {winner} | CHAMPIONS {winnerClub} | SEASON-LONG SUPREMACY | HEAD OF THE TABLE | WELCOME TO THE TOP | ROYAL SEAL ON THE SEASON | FIGHTBACK UNDER WAY | CLAWING BACK THE DEFICIT | REVIVAL ON THE REGISTER | RESURGENT AND RESTLESS | BOUNCE-BACK SEASON | GAME ON AGAIN | HUNTER CLOSES IN | DON'T WRITE THEM OFF | RALLY CRY ANSWERED | MOMENTUM SWINGS | TIDE IS TURNING | PHOENIX RISING | GROUND RECLAIMED | CATCHING UP FAST | HUNT IS ON IN EARNEST | BACK FROM THE BRINK | RECOVERY ROAD | SHOWDOWN ALIVE AND KICKING | SPRINGING BACK TO LIFE | THE GAP FEELS THE SQUEEZE | CLOSING THE DISTANCE | NIBBLING AT THE LEAD | CHARGE FROM BEHIND | LOOK WHO'S COMING | FORTUNES SHIFTING | ROARING BACK | GLANCE OVER YOUR SHOULDER | PRESSURE PILES BACK ON | UPSWING UNDERWAY | REPLY WITH RELISH | SWINGING THE PENDULUM | RESPONSE DELIVERED | CHASE HEATS UP | COMEBACK FOR {winner} | {loser} FEELS THE HEAT | DEFIANCE FROM {winner} | RESILIENT {winnerClub} | UNDERDOG BARKS BACK | NOT DONE YET | SPARK BECOMES A FIRE | STRETCHING THE LEAD | FURTHER OUT FRONT | DISAPPEARING INTO THE DISTANCE | TIGHTENING THE GRIP | PULLING CLEAR | BIGGER BUFFER BUILT | EXTENDING THE EMPIRE | GRIP GROWS FIRMER | WIDENING THE GULF | RUNNING AWAY WITH IT | STILL SETTING THE PACE | PACESETTER POWERS ON | OPENING UP THE ROAD
```

---

## PROMPT 5A: 160 final headlines, part 1

```
You are the headline desk of "The Touchline Gazette", an invented newspaper inside a private two-player website called Career Mode Showdown. Two friends each manage one club in FIFA 17 career mode. After every season they enter what their club won and the site turns it into points. The Gazette prints a front page after each season and a final front page when the whole Showdown ends. Your headlines are the biggest words on that page, so they must be brilliant: the kind a reader screenshots and sends to their rival.

FACTS THE GAME KNOWS (never invent anything else)
- Points per season, per manager: Champions League 5, league title 3, domestic cup 1, performance bonus at most 1, awards bonus at most 1. Europa League can appear as a trophy. So a season is worth 0 to 11 points; never suggest more than 11 in a season.
- A Showdown lasts 1, 3, 5 or 10 seasons. Overall points are the seasons added up.
- A Golden Showdown is won by the FIRST single manager to reach 110 points. Never a combined total.
- A draw is a draw: nobody wins it, nobody loses it.
- The game does NOT know goals, match scores, scorers, players, transfers, injuries, tactics, crowds, dates or weather. Never state any of these as fact. You may play with the scoreboard, the table, the trophy cabinet, the rivalry, late nights at the console, bragging rights and the next season.

PLACEHOLDERS (the game fills these in; copy them exactly with curly brackets; never write the managers' real names)
{winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints}
{managerA} {managerB} {clubA} {clubB} {points} (for level situations only)
{leader} {trailer} (who is ahead and behind overall)
{seasonNo} {seasonsTotal}
Only use the placeholders allowed for each situation below.

HEADLINE RULES
1. ALL CAPITALS. 12 to 30 characters including spaces (count a placeholder as 10). It must break into two short lines on a phone.
2. No numbers or number words that the game should supply (no "ELEVEN", "TWO", "110"). No em or en dashes. Apostrophes are fine.
3. At most 8 of every 40 headlines may contain a placeholder.
4. Every headline is new: not the same as, or a light rewording of, anything in the EXISTING list, and no two new headlines share the same key idea or pun. No more than 3 headlines in the whole reply may start with the same word. Avoid starting with "A" or "THE" more than 6 times each per situation.
5. In each situation of 40, use this mix: 8 classic broadsheet (calm, grand), 8 tabloid shouts (short, loud, a verb that punches), 8 football wordplay puns (net, bar, post, table, cup, cabinet, whistle, extra time, penalty, offside, clean sheet, silverware, top flight, dugout), 6 alliteration, 4 short questions, 6 one-idea punchlines in two or three words plus a twist.
6. It must read naturally for any club and either manager, and be kind: tease the rivalry, never mock the loser.
7. No real newspapers, real headlines, chants, slogans, players, pundits or brands. American readers must understand it.

GOOD examples of the bar we want (do not reuse): "CABINET RESHUFFLE", "NET PROFIT", "TABLE MANNERS", "WHO BLINKED FIRST?", "SILVER SERVICE", "CROWNED AT THE DEATH".
BAD examples: "{winner} WINS THE SEASON" (flat), "A GREAT SEASON" (vague), "WON BY TWO POINTS" (number), "SCORES A HAT TRICK" (game does not know goals).

SUBHEAD AND KICKER
- "subhead": one sentence, 12 to 24 words, the plain news behind the headline in warm broadsheet English, using only that situation's placeholders. It should pay off the headline's joke, not repeat it. Numbers only through placeholders.
- "kicker": 1 to 3 words in capitals for the black label above the headline. Vary them; use any one kicker at most 4 times per situation.

WORK METHOD
Think briefly and spend your effort on writing, not on long planning. Write each situation in one pass, then quickly check rules 1 to 4 and fix anything that breaks them before replying.

OUTPUT
Reply with ONE JSON object and nothing else: no intro, no notes, no markdown fence. Straight double quotes. Ids unique and in the order shown.

THE JOB: FINAL FRONT PAGE, PART 1 (160 headlines)

This page is printed once, when the whole Showdown is over, so it should feel bigger and more final than a season page: legacy, history, the last word, the trophy that settles the argument.

Write 40 rows for each of these situations, in this order:
- showdown-won-1-season: ids h2-301 to h2-340. {winner} won a one-season Showdown: a sprint, one shot, no second chances.
- showdown-won-3-seasons: ids h2-341 to h2-380. {winner} won a Showdown that lasted three seasons: a trilogy, a best of three.
- showdown-won-5-seasons: ids h2-381 to h2-420. {winner} won a five-season Showdown: an era, a long campaign.
- golden-showdown-won: ids h2-421 to h2-460. {winner} was the FIRST manager to reach 110 points and wins the Golden Showdown. This is the biggest story the Gazette will ever print: gold commemorative edition, history books, a dynasty. Never a combined total. Never write the number.
Allowed placeholders for winning situations: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal}. Here {winnerPoints} {loserPoints} and {margin} are OVERALL totals for the whole Showdown.
Never write "one", "three" or "five" as numbers in headlines; suggest the length with words like sprint, trilogy, era, marathon.

JSON shape:
{"final":[{"id":"h2-301","situation":"showdown-won-1-season","kicker":"...","headline":"...","subhead":"..."}, ...]}

EXISTING final headlines (do not repeat or lightly reword any of these):
THE SPRINT BELONGS HERE | ONE CAMPAIGN ONE CHAMPION | A SINGLE SEASON TRIUMPH | THE QUICK ROUTE TO GLORY | ONE AND WON | THE SHORT GAME DELIVERS | A ONE SEASON MASTERPIECE | THE SPRINT FINDS A WINNER | ONE SEASON ALL THE GLORY | A BRIEF AND BRIGHT CAMPAIGN | THE ONE SEASON STORY | A SPRINT TO CELEBRATE | THREE SEASONS ONE VICTOR | THE THREE ACT TRIUMPH | A TRILOGY WITH A WINNER | THREE CAMPAIGNS ONE CROWN | THE THIRD CHAPTER CLOSES | THREE SEASONS OF STORIES | THE THREE YEAR SHOWDOWN | A TRIPLE CHAPTER CELEBRATION | THE SERIES FINDS ITS CHAMPION | THREE SEASONS IN THE BOOKS | THE THIRD SEASON'S VERDICT | THREE STEPS TO THE TITLE | FIVE SEASONS ONE CHAMPION | THE FIVE CHAPTER FINALE | HALF A DECADE OF DRAMA | FIVE CAMPAIGNS ONE CROWN | THE FIFTH ACT CLOSES | FIVE SEASONS IN PRINT | A FIVE SEASON CELEBRATION | THE LONG STORY FINDS ITS WINNER | THE FIFTH CHAPTER'S CHAMPION | FIVE CAMPAIGNS AND COUNTED | A FINALE FIVE SEASONS MAKING | THE FIVE SEASON VERDICT | TEN SEASONS OF GOLD | A DECADE FINDS ITS CHAMPION | THE GOLDEN CROWN IS CLAIMED | TEN CHAPTERS ONE WINNER | THE DECADE BELONGS HERE | GOLD AT THE FINISH | THE GOLDEN STORY CLOSES | A DECADE WORTH CELEBRATING | TEN SEASONS ONE GOLDEN ENDING | THE LONG ROAD TO GOLD | A GOLDEN FINALE TO REMEMBER | THE SHOWDOWN ENDS LEVEL | A SHARED FINAL CHAPTER | TWO MANAGERS ONE DRAW | THE TOTALS TELL THE STORY | EVEN AT THE VERY END | THE FINAL LEDGER BALANCES | NO SPACE BETWEEN TOTALS | HONOURS EVEN AFTER ALL | A PERFECTLY SHARED FINALE | THE ENDING IS ALL SQUARE | EQUAL BILLING IN THE FINALE | THE LAST DAY DELIVERS | A FINALE FOR THE AGES | THE LAST WORD GOES HERE | THE DECIDING DAY ARRIVES | THE FINALE FINDS ITS HERO | ONE LAST DAY OF DRAMA | THE CLOSING ACT DECIDES | A FINAL DAY TO FRAME | THE LAST PAGE IS WRITTEN | THE DECISIVE DAY BELONGS | THE CURTAIN FALLS ON GLORY | A SHOWDOWN IN FULL COMMAND | THE BIG PICTURE BELONGS | THE GAP TELLS THE STORY | CLEAR AT THE FINISH | A COMMANDING FINAL ACCOUNT | A LEAD BUILT TO LAST | PLENTY OF ROOM TO CELEBRATE | THE GRAND SCOREBOARD STATEMENT | A CONVINCING FINAL CHAPTER | THE OVERALL MARGIN SPEAKS | A BIG WIN IN PRINT
```

---

## PROMPT 5B: 120 final headlines, part 2

```
You are the headline desk of "The Touchline Gazette", an invented newspaper inside a private two-player website called Career Mode Showdown. Two friends each manage one club in FIFA 17 career mode. After every season they enter what their club won and the site turns it into points. The Gazette prints a front page after each season and a final front page when the whole Showdown ends. Your headlines are the biggest words on that page, so they must be brilliant: the kind a reader screenshots and sends to their rival.

FACTS THE GAME KNOWS (never invent anything else)
- Points per season, per manager: Champions League 5, league title 3, domestic cup 1, performance bonus at most 1, awards bonus at most 1. Europa League can appear as a trophy. So a season is worth 0 to 11 points; never suggest more than 11 in a season.
- A Showdown lasts 1, 3, 5 or 10 seasons. Overall points are the seasons added up.
- A Golden Showdown is won by the FIRST single manager to reach 110 points. Never a combined total.
- A draw is a draw: nobody wins it, nobody loses it.
- The game does NOT know goals, match scores, scorers, players, transfers, injuries, tactics, crowds, dates or weather. Never state any of these as fact. You may play with the scoreboard, the table, the trophy cabinet, the rivalry, late nights at the console, bragging rights and the next season.

PLACEHOLDERS (the game fills these in; copy them exactly with curly brackets; never write the managers' real names)
{winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints}
{managerA} {managerB} {clubA} {clubB} {points} (for level situations only)
{leader} {trailer} (who is ahead and behind overall)
{seasonNo} {seasonsTotal}
Only use the placeholders allowed for each situation below.

HEADLINE RULES
1. ALL CAPITALS. 12 to 30 characters including spaces (count a placeholder as 10). It must break into two short lines on a phone.
2. No numbers or number words that the game should supply (no "ELEVEN", "TWO", "110"). No em or en dashes. Apostrophes are fine.
3. At most 8 of every 40 headlines may contain a placeholder.
4. Every headline is new: not the same as, or a light rewording of, anything in the EXISTING list, and no two new headlines share the same key idea or pun. No more than 3 headlines in the whole reply may start with the same word. Avoid starting with "A" or "THE" more than 6 times each per situation.
5. In each situation of 40, use this mix: 8 classic broadsheet (calm, grand), 8 tabloid shouts (short, loud, a verb that punches), 8 football wordplay puns (net, bar, post, table, cup, cabinet, whistle, extra time, penalty, offside, clean sheet, silverware, top flight, dugout), 6 alliteration, 4 short questions, 6 one-idea punchlines in two or three words plus a twist.
6. It must read naturally for any club and either manager, and be kind: tease the rivalry, never mock the loser.
7. No real newspapers, real headlines, chants, slogans, players, pundits or brands. American readers must understand it.

GOOD examples of the bar we want (do not reuse): "CABINET RESHUFFLE", "NET PROFIT", "TABLE MANNERS", "WHO BLINKED FIRST?", "SILVER SERVICE", "CROWNED AT THE DEATH".
BAD examples: "{winner} WINS THE SEASON" (flat), "A GREAT SEASON" (vague), "WON BY TWO POINTS" (number), "SCORES A HAT TRICK" (game does not know goals).

SUBHEAD AND KICKER
- "subhead": one sentence, 12 to 24 words, the plain news behind the headline in warm broadsheet English, using only that situation's placeholders. It should pay off the headline's joke, not repeat it. Numbers only through placeholders.
- "kicker": 1 to 3 words in capitals for the black label above the headline. Vary them; use any one kicker at most 4 times per situation.

WORK METHOD
Think briefly and spend your effort on writing, not on long planning. Write each situation in one pass, then quickly check rules 1 to 4 and fix anything that breaks them before replying.

OUTPUT
Reply with ONE JSON object and nothing else: no intro, no notes, no markdown fence. Straight double quotes. Ids unique and in the order shown.

THE JOB: FINAL FRONT PAGE, PART 2 (120 headlines)

This page is printed once, when the whole Showdown is over, so it should feel bigger and more final than a season page: legacy, history, the last word.

Write 40 rows for each of these situations, in this order:
- showdown-drawn: ids h2-461 to h2-500. The whole Showdown ended exactly level. Nobody wins. Allowed: {managerA} {managerB} {clubA} {clubB} {points} {seasonsTotal}. Never {winner} or {loser}. Make a shared ending feel dramatic, not disappointing.
- won-on-the-final-day: ids h2-501 to h2-540. {winner} won the Showdown, and it was only settled by the very last season.
- dominant-win: ids h2-541 to h2-580. {winner} finished the Showdown far ahead overall.
Allowed placeholders for winning situations: {winner} {loser} {winnerClub} {loserClub} {margin} {winnerPoints} {loserPoints} {seasonsTotal}. Here {winnerPoints} {loserPoints} and {margin} are OVERALL totals for the whole Showdown.

JSON shape:
{"final":[{"id":"h2-461","situation":"showdown-drawn","kicker":"...","headline":"...","subhead":"..."}, ...]}

EXISTING final headlines (do not repeat or lightly reword any of these):
THE SPRINT BELONGS HERE | ONE CAMPAIGN ONE CHAMPION | A SINGLE SEASON TRIUMPH | THE QUICK ROUTE TO GLORY | ONE AND WON | THE SHORT GAME DELIVERS | A ONE SEASON MASTERPIECE | THE SPRINT FINDS A WINNER | ONE SEASON ALL THE GLORY | A BRIEF AND BRIGHT CAMPAIGN | THE ONE SEASON STORY | A SPRINT TO CELEBRATE | THREE SEASONS ONE VICTOR | THE THREE ACT TRIUMPH | A TRILOGY WITH A WINNER | THREE CAMPAIGNS ONE CROWN | THE THIRD CHAPTER CLOSES | THREE SEASONS OF STORIES | THE THREE YEAR SHOWDOWN | A TRIPLE CHAPTER CELEBRATION | THE SERIES FINDS ITS CHAMPION | THREE SEASONS IN THE BOOKS | THE THIRD SEASON'S VERDICT | THREE STEPS TO THE TITLE | FIVE SEASONS ONE CHAMPION | THE FIVE CHAPTER FINALE | HALF A DECADE OF DRAMA | FIVE CAMPAIGNS ONE CROWN | THE FIFTH ACT CLOSES | FIVE SEASONS IN PRINT | A FIVE SEASON CELEBRATION | THE LONG STORY FINDS ITS WINNER | THE FIFTH CHAPTER'S CHAMPION | FIVE CAMPAIGNS AND COUNTED | A FINALE FIVE SEASONS MAKING | THE FIVE SEASON VERDICT | TEN SEASONS OF GOLD | A DECADE FINDS ITS CHAMPION | THE GOLDEN CROWN IS CLAIMED | TEN CHAPTERS ONE WINNER | THE DECADE BELONGS HERE | GOLD AT THE FINISH | THE GOLDEN STORY CLOSES | A DECADE WORTH CELEBRATING | TEN SEASONS ONE GOLDEN ENDING | THE LONG ROAD TO GOLD | A GOLDEN FINALE TO REMEMBER | THE SHOWDOWN ENDS LEVEL | A SHARED FINAL CHAPTER | TWO MANAGERS ONE DRAW | THE TOTALS TELL THE STORY | EVEN AT THE VERY END | THE FINAL LEDGER BALANCES | NO SPACE BETWEEN TOTALS | HONOURS EVEN AFTER ALL | A PERFECTLY SHARED FINALE | THE ENDING IS ALL SQUARE | EQUAL BILLING IN THE FINALE | THE LAST DAY DELIVERS | A FINALE FOR THE AGES | THE LAST WORD GOES HERE | THE DECIDING DAY ARRIVES | THE FINALE FINDS ITS HERO | ONE LAST DAY OF DRAMA | THE CLOSING ACT DECIDES | A FINAL DAY TO FRAME | THE LAST PAGE IS WRITTEN | THE DECISIVE DAY BELONGS | THE CURTAIN FALLS ON GLORY | A SHOWDOWN IN FULL COMMAND | THE BIG PICTURE BELONGS | THE GAP TELLS THE STORY | CLEAR AT THE FINISH | A COMMANDING FINAL ACCOUNT | A LEAD BUILT TO LAST | PLENTY OF ROOM TO CELEBRATE | THE GRAND SCOREBOARD STATEMENT | A CONVINCING FINAL CHAPTER | THE OVERALL MARGIN SPEAKS | A BIG WIN IN PRINT
```
