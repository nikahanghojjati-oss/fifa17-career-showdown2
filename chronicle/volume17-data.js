/* THE CHRONICLE · Volume 17 (Team G, r89 / 2.2.0): Sacked and Chamber Men 3D, written from gameplay/r89. Loaded by volume17.js. */
window.CHRONICLE_VOLUME17={
 "capturedAt": "2026-11-06T03:00:00Z",
 "part": {
  "id": "sack-and-spot",
  "title": "The sack and the spot",
  "dek": "6 November 2026: 2.1.0 is live; 2.2.0 brings the sack and the broadcast penalty.",
  "image": "legacy.webp"
 },
 "chapters": [
  {
   "id": "r89-sacked",
   "title": "The board has the last word",
   "dek": "2.2.0 gives the Showdown the one result FIFA 17 can hand you that no trophy can fix: the sack.",
   "part": "sack-and-spot",
   "number": 176,
   "blocks": [
    {
     "type": "callout",
     "label": "Release boundary",
     "text": "Written on 6 November 2026 from gameplay/r89, the branch that becomes 2.2.0. The live game is 2.1.0, released on 4 November. Everything below describes the 2.2.0 code as it stands on that branch, and it reaches the phones when 2.2.0 is released."
    },
    {
     "type": "p",
     "text": "Every career in FIFA 17 lives one bad run from the phone call. The chairman is polite about it. He thanks you for your work, he wishes you well, and then the save file belongs to someone else. For three months the Showdown could not hear that call. A manager who lost his job mid-career had two bad choices: pretend it never happened and keep typing results for a club that had already shown him the door, or end the Showdown early and watch it disappear into the hidden pile of games that never count."
    },
    {
     "type": "p",
     "text": "Nik called it a serious gap in the logic, and he was right. A sacking is not a failure of the game. It is part of the game, and the Showdown had to treat it with the same respect it gives a title."
    },
    {
     "type": "h2",
     "text": "One line on your own card"
    },
    {
     "type": "p",
     "text": "So 2.2.0 adds a single line to Season Results, on each manager’s own card: “I was sacked this season.” Only he can tick it, and only for himself. Daniel cannot sack Nik and Nik cannot sack Daniel; the card belongs to the man who lived the season."
    },
    {
     "type": "p",
     "text": "Ticking it changes the button beneath. PUBLISH MY SEASON RESULT becomes PUBLISH · I WAS SACKED, and the first tap does not publish anything. It asks again, in plain words: YES, I WAS SACKED · PUBLISH. Above it the warning spells out what follows, in the season’s own numbers: this Showdown ends after this season, the points so far decide, both phones need version 2.2.0, and publishing is final."
    },
    {
     "type": "h2",
     "text": "Not losing. Finishing."
    },
    {
     "type": "p",
     "text": "The rule that follows is short, and it is deliberately fair. Any sacking ends the Showdown after that season. Either manager can be sacked, or both in the same season, and either way nothing more is played. Every point earned up to then counts, and the manager with more Showdown points wins, even if he is the one who was sacked. Being sacked is not losing. If the totals are level it is a DRAW, as it has always been here, because this game has no tiebreak anywhere."
    },
    {
     "type": "p",
     "text": "The screens keep their order. After a sacked season the Showdown runs exactly as it does after its planned last season: Season Results, then the Final Winner, then the Gazette. No Transfer War opens for a season that will never be played. And a sacking in the planned last season changes nothing about the length: a ten-season Showdown sacked in season ten is still ten seasons, and it can still be Golden."
    },
    {
     "type": "h2",
     "text": "A finished Showdown keeps its place"
    },
    {
     "type": "p",
     "text": "What remains is a completed Showdown, never an abandoned one. It counts on History, Legacy, the Trophy Room and every stats screen, and it carries a quiet line of its own: “Ended — sacked in season 2 of 3 (Nik).” On the Final Winner screen a small crimson SACKED stamp sits beside the name of each manager who lost his job, in the totals band, never over a face, and under the seasons played it reads OF 3 · SACKED."
    },
    {
     "type": "p",
     "text": "The Touchline Gazette prints its own edition for the day. It has 61 sacked stories, 25 headlines and 61 lines of banter, written for one manager sacked or both, and for the sacked manager winning, losing or drawing: THE BOARD HAS SPOKEN, CLEAR YOUR DESK, TAXI FOR the man in question."
    },
    {
     "type": "h2",
     "text": "The referee nobody sees"
    },
    {
     "type": "p",
     "text": "Under the surface the change is small and strict. A season result may carry one extra key, sacked, and only ever as true. The Firebase Rules check that the season’s commit carries exactly what each manager published, that the Showdown’s running record names who was sacked in the season that ended it, that nothing is accepted after that season, and that the final close says the same. The next season’s first roulette mark is refused, so the Transfer War can never open again."
    },
    {
     "type": "p",
     "text": "Two reviews tightened the edges. Codex found that END SHOWDOWN in Settings could still turn a sacked Showdown into an ended-early one; now the Rules refuse it, the phone hands the Showdown to the normal close instead, and Settings tells the manager it is saved to History as a completed Showdown. A second review found the moment between the sacked season being accepted and the running record catching up; END SHOWDOWN now has to name the exact number of seasons accepted, the Rules check that number against the season records themselves, and the gap is closed. If the rival’s phone is still on 2.1.0 when a sacking is published, the waiting screen names him and the exact Settings button to tap: UPDATE TO LATEST VERSION."
    },
    {
     "type": "p",
     "text": "All of it stays on the free Spark plan, and every refusal is an ordinary Rules denial. A last change, after Sacked, gave the Rules room to breathe: the season record no longer proves the shape of the stored record a second time on every write, so a tenth-season save uses about 804 of the engine’s 1,000 checks instead of 929."
    },
    {
     "type": "p",
     "text": "The Rule Book has a tenth card, SACKED, with the five lines a manager needs."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "js/productionSharedSeasonResults.js",
     "label": "js/productionSharedSeasonResults.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/js/productionSharedSeasonResults.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "js/careerScreenSeam.js",
     "label": "js/careerScreenSeam.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/js/careerScreenSeam.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "js/seasonFinalV10.js",
     "label": "js/seasonFinalV10.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/js/seasonFinalV10.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "data/gazetteSacked.js",
     "label": "data/gazetteSacked.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/data/gazetteSacked.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "firestore.terminal-close-production.fragment.rules",
     "label": "firestore.terminal-close-production.fragment.rules",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/firestore.terminal-close-production.fragment.rules",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "js/ruleBook.js",
     "label": "js/ruleBook.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/js/ruleBook.js",
     "kind": "repository"
    }
   ],
   "tags": [
    "Sacked",
    "Season Results",
    "Terminal Close",
    "Rules",
    "2.2.0"
   ],
   "words": 890,
   "minutes": 4
  },
  {
   "id": "r89-chamber-turns",
   "title": "Seven shots, one at a time",
   "dek": "Chamber Men, the shootout that loads the roulette, as the 2.2.0 code plays it.",
   "part": "sack-and-spot",
   "number": 177,
   "blocks": [
    {
     "type": "callout",
     "label": "Release boundary",
     "text": "Written on 6 November 2026 from gameplay/r89, the branch that becomes 2.2.0. The live game is 2.1.0, released on 4 November. Everything below describes the 2.2.0 code as it stands on that branch, and it reaches the phones when 2.2.0 is released."
    },
    {
     "type": "p",
     "text": "Every season now begins at the penalty spot. Before the roulette spins, Daniel and Nik take a shootout of seven shots each, and the shootout decides what the roulette will hold. It arrived in 2.1.0, and it plays in every Showdown started on 2.1.0 or later."
    },
    {
     "type": "h2",
     "text": "One shoots, one keeps"
    },
    {
     "type": "p",
     "text": "It goes turn by turn, the way a real shootout does. Daniel shoots and Nik keeps; then Nik shoots and Daniel keeps; seven rounds, fourteen kicks. Nobody shoots and keeps on the same kick. The shooter picks LEFT, MIDDLE or RIGHT for his shot, the keeper picks where to dive, and neither sees the other’s pick until both have locked in. The ball goes in when the keeper dives the other way. Both phones show the kick, and then the next one starts."
    },
    {
     "type": "p",
     "text": "There is no clock until the rival has locked in. Then, once the last kick has been shown, the other manager has ten seconds. The clock is tied to the rival’s lock-in as the server recorded it, so leaving the screen and coming back never buys more time. Out of time, a shot is a miss and a keeper stays in the middle."
    },
    {
     "type": "h2",
     "text": "A late pick is a missed pick"
    },
    {
     "type": "p",
     "text": "A review of 2.2.0 found one honest weakness: a pick locked a moment before the clock ran out could reach the server after it, on a slow network or a retried write, and still be stored as a real side. 2.2.0 closes it from both ends. The phone checks the time on every try of its write, and a pick that lands more than 16.6 seconds after the rival’s lock-in (the 10-second clock, the 4.6 seconds the last kick is shown, and two seconds for the network) is stored as the timeout: a miss, or a keeper in the middle. The Rules hold the same 16.6 seconds and refuse a real side that arrives later. The timeout itself is always allowed, so nobody is ever stuck."
    },
    {
     "type": "h2",
     "text": "Goals become bullets"
    },
    {
     "type": "p",
     "text": "Chamber Men scores no Showdown points. What it scores is danger. Each goal a manager scores loads one live round into his rival’s roulette cylinder for that season, chamber by chamber in the order of his shots. A cylinder has seven chambers, so a manager’s chance of losing a player is his rival’s goals out of seven: no goals and it never fires, seven and it always does. Even then the roulette still spins, one trigger pull each, because no screen is ever skipped."
    },
    {
     "type": "p",
     "text": "At full time the board says it plainly, names and goals and nothing else, “Level” when the goals are equal, and under it each cylinder: how many live rounds it holds, and who put them there."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "js/chamberMenStep.js",
     "label": "js/chamberMenStep.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/js/chamberMenStep.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "js/chamberMen.js",
     "label": "js/chamberMen.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/js/chamberMen.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "firestore.season-results-production.fragment.rules",
     "label": "firestore.season-results-production.fragment.rules",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/firestore.season-results-production.fragment.rules",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "js/ruleBook.js",
     "label": "js/ruleBook.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/js/ruleBook.js",
     "kind": "repository"
    }
   ],
   "tags": [
    "Chamber Men",
    "Roster Russian Roulette",
    "Turn by turn",
    "2.1.0",
    "2.2.0"
   ],
   "words": 494,
   "minutes": 2
  },
  {
   "id": "r89-chamber-broadcast",
   "title": "The camera behind the taker",
   "dek": "2.2.0 turns the Chamber Men goal into a broadcast penalty: a stadium at night, a taker in his club’s kit, a keeper who dives.",
   "part": "sack-and-spot",
   "number": 178,
   "blocks": [
    {
     "type": "callout",
     "label": "Release boundary",
     "text": "Written on 6 November 2026 from gameplay/r89, the branch that becomes 2.2.0. The live game is 2.1.0, released on 4 November. Everything below describes the 2.2.0 code as it stands on that branch, and it reaches the phones when 2.2.0 is released."
    },
    {
     "type": "p",
     "text": "Nik’s brief was one sentence: it should look like what it looks like in FIFA 17. In 2.1.0 the shootout was played on a marble drawing of a goal, beautiful and still. In 2.2.0 the camera goes to the stadium."
    },
    {
     "type": "h2",
     "text": "A penalty as television shows it"
    },
    {
     "type": "p",
     "text": "The camera sits behind and above the taker, as on TV. While the players wait it drifts slowly; on the run-up it pushes in; after the strike it leans after the ball. The taker runs up and strikes, the keeper dives LEFT, MIDDLE or RIGHT, and the taker celebrates a goal or turns away from a miss. The crowd stirs with the run-up. Every frame is worked out from the time since the strike, so both phones show the same kick."
    },
    {
     "type": "p",
     "text": "The taker wears his manager’s club home kit, its 2016-17 colours as FIFA 17 shows them, one of 98 clubs. The keeper wears his own club’s keeper kit, picked so it never clashes with the shirt in front of him. Each club keeps one body for the whole Showdown, chosen from its name, so nothing about who walks up to the ball is random."
    },
    {
     "type": "h2",
     "text": "A stadium drawn by code"
    },
    {
     "type": "p",
     "text": "Around them stands a whole stadium: white posts, a knotted net that bulges when it is hit, a pitch with mown stripes and chalk lines, LED boards carrying only the game’s own marks, a two-tier stand behind the goal, side stands with a crowd in each club’s colour, a roof with floodlights and a night sky. Every texture in it is drawn by code in the repository, so the whole kit belongs to the game: no third-party licence, no real brand. It runs on three.js r187, the same engine the roulette moved to in 2.2.0."
    },
    {
     "type": "h2",
     "text": "The game never waits for the picture"
    },
    {
     "type": "p",
     "text": "The 3D scene is a picture of the shootout, never its referee. The step that runs the game still owns every pick, clock and score, and the scene only shows what the step decides. The scene is built behind the loading screen, so the shootout appears with the stadium already drawn. If the stadium’s own files cannot come in time, a simpler 3D goal in a dark marble hall stands in for it. If it is not ready within six seconds, if the phone has no WebGL2, or if anything goes wrong, the marble goal plays that shootout as before, and a scene that arrives late is thrown away rather than swapped in mid-game. A review found that a slow load could hold the clock back, so when a rival locks in before the stadium is ready, the marble goal now appears at once, and a kick shown while the scene was loading is never lost."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "js/chamberMenScene3d.js",
     "label": "js/chamberMenScene3d.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/js/chamberMenScene3d.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "js/chamberMenStadium3d.js",
     "label": "js/chamberMenStadium3d.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/js/chamberMenStadium3d.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "js/kits17.js",
     "label": "js/kits17.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/js/kits17.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r89",
     "ref": "1e6489a8fe932db9fe018893b540063761e30128",
     "path": "js/chamberMenStep.js",
     "label": "js/chamberMenStep.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/1e6489a8fe932db9fe018893b540063761e30128/js/chamberMenStep.js",
     "kind": "repository"
    }
   ],
   "tags": [
    "Chamber Men",
    "3D",
    "three.js",
    "Kits",
    "2.2.0"
   ],
   "words": 496,
   "minutes": 2
  }
 ],
 "wordCount": 1880
};
