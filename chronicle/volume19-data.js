/* THE CHRONICLE · Volume 19 (Team G, r91 / 2.4.0): Squad Management, the full FIFA 17 list, the old-era cut, the truthful Device check, art to 100 and the 2.4.0 bug hunt. Written from gameplay/r91 9aa3baee. Loaded by volume19.js.
   RELEASE LINE: the last sentence of chapter 187 ("2.4.0 is not live yet; ...") is the one sentence the r91 lead replaces at release with the live date and time. */
window.CHRONICLE_VOLUME19={
 "capturedAt": "2026-11-13T12:00:00Z",
 "part": {
  "id": "coaches-room",
  "title": "The coaches’ room",
  "dek": "The thirteenth of November. 2.3.0 is live, and 2.4.0 gives each manager a squad to set, the whole FIFA 17 list to sign from, a Device check that tells the truth and handcrafted art. Then it turns and hunts its own bugs.",
  "image": "club.webp"
 },
 "chapters": [
  {
   "id": "r91-squad-management",
   "number": 182,
   "part": "coaches-room",
   "title": "Fifteen names on a board",
   "dek": "The roulette had always shot at a squad the managers never chose. Now they get the board, twice a season, and nowhere to hide a star.",
   "blocks": [
    {
     "type": "p",
     "text": "Fifteen names on a board. A starting eleven and four substitutes, laid out in front of a cylinder with seven chambers. Every season since 2.0.0, the roulette has fired at them."
    },
    {
     "type": "p",
     "text": "And until 2.4.0, the managers never chose a single one."
    },
    {
     "type": "p",
     "text": "The game worked the fifteen out on its own, from the launch squad, the Transfer War verdicts and the players the gun had already taken. It was fair. It was nobody’s team."
    },
    {
     "type": "p",
     "text": "This part of the record was written on the thirteenth of November, twenty twenty-six, from the branch that becomes 2.4.0. The live game is 2.3.0, live since the eleventh at ten oh-four in the morning, UTC. Every number that follows was measured in the build room: Firebase emulators running the production Rules, and a harness playing both managers, never the production database. None of this is proof yet. Proof belongs to Nik and Daniel, on their own phones."
    },
    {
     "type": "p",
     "text": "On the ninth of November, at five fifty-one in the morning, UTC, Nik saved three ideas for the release after 2.3.0. The third was a new screen. It would sit between Chamber Men and the roulette, and on it a manager could pick a formation, drag his players and lock the fifteen himself, in the manner of FIFA 17’s own squad screen."
    },
    {
     "type": "h2",
     "text": "The first plan was wrong"
    },
    {
     "type": "p",
     "text": "The planning thread did its homework. At 81 of the game’s 98 clubs, it found, the launch fifteen are not the fifteen best players by overall. At six clubs, the best fifteen has no goalkeeper at all. So the first plan was simple: take the top fifteen by overall. Tidy. Logical. Wrong."
    },
    {
     "type": "p",
     "text": "Three minutes past midnight, UTC, on the eleventh of November. Nik says so. And he writes the rules himself."
    },
    {
     "type": "p",
     "text": "Season one is the launch eleven, in the club’s default formation, plus its four original substitutes, changed only by signings and by the roulette. From season two, players leave, for the reasons a FIFA career gives them: contract ended, retired, swapped, sold. The manager takes the man out and replaces him inside the same line: goalkeeper, defence, midfield or attack. The formation decides how many of each line start. Nobody is ever sorted across positions. And the screen has three parts, as FIFA 17’s does: Starting Eleven, Substitutes and Reserves. Reserves never stand on the roulette board."
    },
    {
     "type": "p",
     "text": "Thirty-five minutes pass. Then he closes the obvious loophole."
    },
    {
     "type": "p",
     "text": "A screen that lets you arrange your squad also lets you hide your best player in the reserves, where the gun cannot see him. So from season two, each line of the eleven is filled by its best players by overall. The four substitutes on the board are strictly the best four left. And a reserve rated above anyone in the fifteen moves up on his own."
    },
    {
     "type": "p",
     "text": "A manager can arrange his stars. He cannot put them away in a drawer."
    },
    {
     "type": "p",
     "text": "Three exceptions may cross a line, because Nik named them: right midfield and right wing, left midfield and left wing, centre forward and attacking midfield. At a minute to one in the morning, UTC, the lead adds one more rule. A player’s own FIFA positions decide who must start. The flex list only says who may."
    },
    {
     "type": "h2",
     "text": "Twice a season"
    },
    {
     "type": "p",
     "text": "The screen comes twice. The first time is after Chamber Men and before the roulette. Both managers set their squads and lock them, and the cylinder waits until both are locked. Then it spins on those two sheets."
    },
    {
     "type": "p",
     "text": "The second time is after the Transfer War, before Season Results. The kept signings walk in. The player the roulette shot is gone. And each manager locks his squad for next season without waiting for his rival. The last season of a Showdown has no second screen, because there is no next season to set."
    },
    {
     "type": "p",
     "text": "Behind it sit all 33 FIFA 17 formations, with a search box beside them. Type four three three and you find the five four-three-threes. Type diamond and you find the diamonds. Then they were checked against a forty-eight-second FIFA 17 clip of Nik’s own, and the clip found one real mistake: the two four-four-one-one labels were the wrong way round. Only the labels changed. Two of the 33 had spent their whole lives wearing each other’s name tags."
    },
    {
     "type": "p",
     "text": "Seven substitutes are allowed. But subs five to seven carry a plain line: \"Not on the Russian Roulette board\". And the room behind the pitch is Team V’s coaches room."
    },
    {
     "type": "h2",
     "text": "What a locked squad costs"
    },
    {
     "type": "p",
     "text": "Each lock is one document, per manager, per screen. It is created once and never changed: the Rules allow nobody to update it or delete it. The lists of departures and reported overalls only ever grow. So either phone can rebuild any squad from its latest document plus the automatic chain, and two phones holding different documents still arrive at the same fifteen. A contract proves it on 98 seeded ten-season careers: 1,661 locked screens."
    },
    {
     "type": "p",
     "text": "Departures and new overalls also reach the Touchline Gazette, as one line of squad news. At most three names a manager. Never in season one."
    },
    {
     "type": "p",
     "text": "The bug hunt measured the cost on the emulator. Forty-two billed reads and six writes for the squad sheets in season one. Then twenty-four to twenty-six billed reads and four writes in each middle season."
    },
    {
     "type": "p",
     "text": "The new screen was ready. But it rests on an idea of who a player is, and nobody has yet tried to break that idea. A bug hunt is coming that will."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1358, merged",
     "label": "PR #1358: r91 Squad Management: store, Rules and wiring (before the Roulette, after the Transfer War)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1358",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1376, merged",
     "label": "PR #1376: r91 Squad Management: Formations search + 4-4-1-1 labels (all 33 FIFA 17 formations)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1376",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1374, merged",
     "label": "PR #1374: r91 Gazette: squad news (departures and reported overalls)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1374",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1372, merged",
     "label": "PR #1372: r91 Squad Management: one shirt image per club side (speed)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1372",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1417, merged",
     "label": "PR #1417: r91 new rooms: front hall (Start, Showdown Home), coaches room (Squad), HC V3 relit rooms, Home crowd, brass wheel",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1417",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "js/squadSheet.js",
     "label": "js/squadSheet.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/9aa3baee140567ec2c13c7333c3aed4eb79e442d/js/squadSheet.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "js/squadSheetStep.js",
     "label": "js/squadSheetStep.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/9aa3baee140567ec2c13c7333c3aed4eb79e442d/js/squadSheetStep.js",
     "kind": "repository"
    }
   ],
   "tags": [
    "2.4.0",
    "Squad Management",
    "Russian Roulette",
    "Rules"
   ],
   "words": 939,
   "minutes": 4
  },
  {
   "id": "r91-player-list",
   "number": 183,
   "part": "coaches-room",
   "title": "Seventeen thousand names",
   "dek": "The Transfer War learns every player in the FIFA 17 launch squads, free agents included, without Home carrying a byte of it.",
   "blocks": [
    {
     "type": "p",
     "text": "Until 2.4.0, the Transfer War asked for a signing’s name and trusted the manager to type it. The game itself knew 2,975 players: the men of its 98 clubs. Anyone else was a string of letters, and the game believed every one of them."
    },
    {
     "type": "p",
     "text": "Nik’s second idea of the ninth of November asked for names that complete themselves, from the full FIFA 17 database, with a list like the Prime Pack’s, and with custom names still allowed. He also wanted it light."
    },
    {
     "type": "p",
     "text": "On the night of the tenth, he made himself clearer. The database must be full: every player, at every club and beyond, in the exact FIFA 17 release the game uses. And \"light\" only describes the file format. At four minutes to midnight, UTC, he picks one full file, fetched only when it is needed. Full and light, then. Both. The file would have to manage."
    },
    {
     "type": "h2",
     "text": "Which FIFA 17"
    },
    {
     "type": "p",
     "text": "The first question was which version of FIFA 17’s squads."
    },
    {
     "type": "p",
     "text": "The research thread chose a SoFIFA roster and pinned it by its hash. Then it noticed two things: Payet at West Ham, and Oscar at Chelsea. That fits the launch squads."
    },
    {
     "type": "p",
     "text": "A minute to midnight, UTC. Nik resets all squads on his own console and reads back the same two clubs. The research had a hash. Nik had a controller. They agreed."
    },
    {
     "type": "p",
     "text": "The file holds 17,597 players, 224 of them free agents, at 632 clubs. It weighs 905 kilobytes raw and 296 gzipped, under a budget of 320. Full names are kept for players rated seventy-five and over, so typing Lionel finds Messi. Five leagues with no place of their own in the game, Ukraine, Greece, Brazil’s Série B, South Africa and Finland, went to Rest of World, after Nik checked on his console that FIFA 17 files those clubs there."
    },
    {
     "type": "p",
     "text": "And Home never sees the file. It is not precached, and it is not in the offline pack. The Transfer War asks for it when the screen is idle, and the Squad screen before the roulette now starts the fetch early, so the list is warm before the clock starts."
    },
    {
     "type": "h2",
     "text": "Two letters"
    },
    {
     "type": "p",
     "text": "Type two letters into a signing’s name, and up to twenty matches drop down: the name, then position, overall and club, or Free agent. Pick one, and the row fills itself. In season one that means name, position, nationality, overall and previous league. From season two, overall and league change with every save, so only name, position and nationality are filled. Every box can still be edited."
    },
    {
     "type": "p",
     "text": "A custom name still works exactly as typed. Nothing in the list is highlighted until an arrow key moves, so Enter, or a tap elsewhere, keeps the manager’s own words. The game adds one quiet line: \"Not in the FIFA 17 list. Your name stays as typed.\""
    },
    {
     "type": "p",
     "text": "The list knows the house rules, too. A player the roulette shot, a player already guessed, or the manager’s own Special Player appears with his name struck through and the words CAN’T BE SIGNED beside it. Tap him, and the game shows the words LOCK itself would use. LOCK did not change. It still refuses."
    },
    {
     "type": "p",
     "text": "In the three-season run that proved it, typing paulinho put the free agent first, a central midfielder rated 81. Then came the men at BK Häcken and GD Chaves. Picking the BK Häcken one in season one filled left wing, 72, Allsvenskan and Brazil. In seasons two and three it filled only left wing and Brazil."
    },
    {
     "type": "h2",
     "text": "The one Rules change"
    },
    {
     "type": "p",
     "text": "The list mapped 160 of the 162 nationalities in the file. Two were missing from the game’s catalog: Kyrgyzstan and Sudan, one player each. Nik’s answer was to add every country that has a player in FIFA 17. The catalog went from 164 to 166: two new countries, so that two players would not be left out."
    },
    {
     "type": "p",
     "text": "In the same change, a picked player’s SoFIFA number is stored on the locked signing as an optional player number, a whole number from one to 999,999. A typed name has none. Neither does a picked one edited afterwards. Those two edits and the squad sheets are the whole Rules change of 2.4.0, and they deploy only when the release reaches main."
    },
    {
     "type": "p",
     "text": "The planning file had already noted one rare edge. LOCK compares names. So two different players with the same short name block each other."
    },
    {
     "type": "p",
     "text": "It looked like a footnote."
    },
    {
     "type": "p",
     "text": "Remember it."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1365, merged",
     "label": "PR #1365: r91: Transfer War name autocomplete from the full FIFA 17 launch list",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1365",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1383, merged",
     "label": "PR #1383: r91 Rules ship: playerId on signings, Kyrgyzstan + Sudan, player list warmed on Squad Management",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1383",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "js/playerSearch.js",
     "label": "js/playerSearch.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/9aa3baee140567ec2c13c7333c3aed4eb79e442d/js/playerSearch.js",
     "kind": "repository"
    }
   ],
   "tags": [
    "2.4.0",
    "Transfer War",
    "FIFA 17 list",
    "Rules"
   ],
   "words": 758,
   "minutes": 3
  },
  {
   "id": "r91-old-era-cut",
   "number": 184,
   "part": "coaches-room",
   "title": "What stays in the loft",
   "dek": "Five steps clear out the offline era. One finished game is kept exactly as it is, and the last two steps fall to Nik’s rule that a cut must pay for its risk.",
   "blocks": [
    {
     "type": "p",
     "text": "2.3.0 had already cleared the loft of things nobody ran. The next build went after a harder kind of waste: code that still ran, for an era that was over. Release dates that switched features on. Off switches nobody used. A backup system for a game that now keeps its history in Firebase."
    },
    {
     "type": "p",
     "text": "Nik answers the cut plan at four nineteen in the morning, UTC, on the eleventh of November. History and Backup can go. And he does not need the one finished game from that older era kept."
    },
    {
     "type": "p",
     "text": "Four hours later, a decision card asks him plainly. At eight thirty-four he picks: keep that finished game’s History row exactly as it is. A minute later he sets the rule for the whole cut, in his own words."
    },
    {
     "type": "p",
     "text": "\"Make sure nothing changes that can break the game. Keep anything needed.\""
    },
    {
     "type": "h2",
     "text": "Step zero: the game that must not move"
    },
    {
     "type": "p",
     "text": "Before anything is deleted, the team builds a guard. The old build itself, the one from that era, plays a one-season Showdown to the end on the emulator. Daniel wins, nine to three, with Málaga against Real Betis, and the data is exported. Its setup time is set to the twenty-fifth of October, in that era, so that, like the real game, it has no Special Player."
    },
    {
     "type": "p",
     "text": "A new test plan imports it, signs both managers in on fresh browsers, and reads every career page. On the new build it passes 19 of 19 checks. Through an update from 2.3.0, 32 of 32. Every figure is the same before and after."
    },
    {
     "type": "h2",
     "text": "Steps two to five"
    },
    {
     "type": "p",
     "text": "Step two removes the release-time gates: seven kinds of \"live from this date\" check. Prime Pack’s alone had seven copies. The off switches go with them. One date stays, on purpose, because it is the reason the finished game shows no Special Player."
    },
    {
     "type": "p",
     "text": "And step two breaks something."
    },
    {
     "type": "p",
     "text": "With it in, a shot or guessed player can be signed again in the Transfer War. The refusal still reads a value the cut had taken away, and its contract never notices, because it tests a fake provider that still has it. The contract had been checking a stand-in. The stand-in was fine. The fix puts the check back on the live provider. And the cut’s notes now say it in plain words: test the real module wherever possible."
    },
    {
     "type": "p",
     "text": "Step three takes out the History and Backup door in Settings and the page behind it: the backup-file export, import and restore, the hidden Save Library editor, and the RESTORE BACKUP button on the OLD SHOWDOWN FOUND screen. What Nik loses, in practice, is saving his history to a file and loading it back. Pairing, JOIN, the offline cache and the update notice all use the Save Library underneath, so all of that stays."
    },
    {
     "type": "p",
     "text": "Step four deletes three Rules drafts that were never published, and the generated production Rules come out the same, byte for byte. Three drafts gone, and the Rules did not notice. That was the point. Step five removes an old update page, another retired page and the old acceptance tools. The one thing lost is the manual update page for a phone still on a service worker from far back in the record. Such a phone now updates the normal way."
    },
    {
     "type": "p",
     "text": "The proof runs on everything together. The harness: 185 of 185 checks for one season, 288 of 288 for three, 243 of 243 with a manager sacked. The full contract suite, 321 of 321. The finished game, unchanged. And an independent Opus reviewer, another of me, who finds nothing removed that was still in use."
    },
    {
     "type": "p",
     "text": "Step one of the plan, a handful of dead leftovers, is not in that count. Its tiebreak helper is still in the code. Nothing reads it, and it can only ever answer none, or draw. In a game with no tiebreak anywhere, it is a tiebreak that can only say draw."
    },
    {
     "type": "h2",
     "text": "Steps six and seven"
    },
    {
     "type": "p",
     "text": "Two steps stay in the loft for now. Step six is the old save migrations. Step seven is the local Transfer War handlers, inside a 1,035-line file that still hosts the online Transfer War screen, so it can only be cut function by function. Both will delete only what a coverage run proves never executes."
    },
    {
     "type": "p",
     "text": "On the twelfth of November, Nik chooses the timing: right after 2.4.0 ships."
    },
    {
     "type": "p",
     "text": "That timing will never come. Before 2.4.0 ships, both steps will be dropped, by a rule of Nik’s: a cut is done only when it pays for its risk."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1402, merged",
     "label": "PR #1402: Golden fixture: the finished r79 Showdown pinned on every career screen (cut step 0)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1402",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1356, merged",
     "label": "PR #1356: r91 cut step 2: remove release-time gates, CMS_* off switches and the release-time tool",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1356",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1393, merged",
     "label": "PR #1393: r91 cut fix: Transfer War LOCK refuses shot and guessed players again",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1393",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1366, merged",
     "label": "PR #1366: r91 cut step 3: remove History & Backup, backup/restore file tools and the Save Library editor",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1366",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1379, merged",
     "label": "PR #1379: r91 cut step 4: delete the three unpublished Rules drafts and their stage tests",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1379",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1386, merged",
     "label": "PR #1386: r91 cut step 5: old update bootstrap, Stage 5F page and old acceptance tooling",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1386",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "tests/fixtures/r79-finished-game/README.md",
     "label": "tests/fixtures/r79-finished-game/README.md",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/9aa3baee140567ec2c13c7333c3aed4eb79e442d/tests/fixtures/r79-finished-game/README.md",
     "kind": "repository"
    }
   ],
   "tags": [
    "2.4.0",
    "Cleanup",
    "History",
    "Golden fixture"
   ],
   "words": 790,
   "minutes": 3
  },
  {
   "id": "r91-device-check",
   "number": 185,
   "part": "coaches-room",
   "title": "The check that told the truth",
   "dek": "A Device check that opened Home, a test that passed a scene that never started, and a level guide that tells each machine what it can draw.",
   "blocks": [
    {
     "type": "p",
     "text": "2.3.0 shipped with a Device check: a page that plays the 3D screens at each quality level and lets Auto choose."
    },
    {
     "type": "p",
     "text": "On the live game, you open Settings, then 3D Quality, then Device check. The address changes. And what appears is Home. The Device check, asked to check the device, checks nothing and shows you the front door."
    },
    {
     "type": "p",
     "text": "Sol 6.1’s review of 2.3.0 finds why. The page had never been copied into the published site, so online it did not exist, and the service worker answered any page it did not know with Home. The fix publishes the pages and lets the worker fetch them from the network. Offline, it shows a short page of its own, with the way back. A new contract fails if any page at the site’s root is ever left out again."
    },
    {
     "type": "h2",
     "text": "Two false passes"
    },
    {
     "type": "p",
     "text": "Then Sol finds something worse, inside the page itself. It reproduces two false passes, and both save Ultra, the 4K level, as Auto when they should not."
    },
    {
     "type": "p",
     "text": "In the first, Chamber Men fails to start while the roulette runs smoothly, and the check ignores the scene that failed. In the second, every frame draws Light, whatever level is asked, and the check never compares the level drawn with the level asked."
    },
    {
     "type": "p",
     "text": "A check that cannot see a failure. A check that cannot tell Light from 4K. And both of them answering the same way: this machine can do anything."
    },
    {
     "type": "p",
     "text": "Nik’s rule comes at two thirty-three in the afternoon, UTC, on the eleventh of November. \"Auto should allow all qualities based on device real test ... from light to 8k.\""
    },
    {
     "type": "p",
     "text": "The check now plays three things at each level, lightest first: a Chamber Men kick, a roulette turn and a Special Player reveal. A level counts only when all three screens answered, drew the level asked with their own files at full size, finished a whole beat, and held sixty frames a second: an average of fifty-seven or more, and a one per cent low of forty-five or more. Hold on to that forty-five. It will come back."
    },
    {
     "type": "p",
     "text": "A screen that is not smooth settles the level. Anything else is not verified: nothing is saved, the last good result stays, and the page says which screen failed and why. Without a check, Auto’s own guess still stops at Extra."
    },
    {
     "type": "h2",
     "text": "Weak machines"
    },
    {
     "type": "p",
     "text": "The device lab finds Settings offering Ultra and 8K on a Chromebook with two processor threads and four gigabytes of memory. Nik chooses on the twelfth of November. On a weak device, two threads or fewer, or four gigabytes or less, those two levels appear only after the Device check passes them there."
    },
    {
     "type": "p",
     "text": "The same change remembers a tab that dies while a 3D screen opens. Next time, Auto opens that screen one level lower. It is a small memory. It will matter."
    },
    {
     "type": "h2",
     "text": "A table anyone can read"
    },
    {
     "type": "p",
     "text": "Then Nik asks for a table in the game that says what is suggested for each machine, from its graphics chip and processor, with real pictures of each 3D screen at each level, and with the link and the Auto pick easy to see."
    },
    {
     "type": "p",
     "text": "The Device check page now opens on a card called \"Your device\": chip, threads and memory, with what each means. Then \"We suggest\", and a level. Under the results, a Level guide runs six rows from Light to 8K, marks the reader’s own row, and shows Chamber Men, the roulette and the Special Player at every level: 36 pictures, loaded only on that page. In Settings a gold link reads \"Device check and guide\", and the Auto entry names its pick: \"Auto · Light\"."
    },
    {
     "type": "p",
     "text": "The guide never promises a frame rate. \"Holds 60 fps\" appears only for the reader’s own machine, after a finished check."
    },
    {
     "type": "p",
     "text": "For the machine on the kitchen table, the answer is plain. Nik’s Chromebook, an Intel UHD chip with two threads and four gigabytes, stays on Auto, and Auto picks Light. At Light, Chamber Men carries about 67 megabytes of textures, by the scene’s own estimate, against 97 at Balanced. Balanced is the only step up worth trying, once 2.4.0 is live and his own check measures it smooth."
    },
    {
     "type": "p",
     "text": "Speed could not be measured in the build room, which draws in software. So I quote no frame rate for that machine. Not one."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1384, merged",
     "label": "PR #1384: r91 Device check: publish the pages and stop the worker answering them with Home",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1384",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1389, merged",
     "label": "PR #1389: r91 Device check: a level counts only when all three 3D screens proved it (Auto: Light to 8K)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1389",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1409, merged",
     "label": "PR #1409: r91 crash safety: weak devices get Ultra and 8K only after a passed Device check; a tab that dies opening a 3D screen opens one level down",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1409",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1423, merged",
     "label": "PR #1423: r91 level guide: \"Your device\" card, level table with real pictures, and a visible Auto pick in Settings",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1423",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "device-check.html",
     "label": "device-check.html",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/9aa3baee140567ec2c13c7333c3aed4eb79e442d/device-check.html",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "js/gfxTier.js",
     "label": "js/gfxTier.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/9aa3baee140567ec2c13c7333c3aed4eb79e442d/js/gfxTier.js",
     "kind": "repository"
    }
   ],
   "tags": [
    "2.4.0",
    "Device check",
    "Quality levels",
    "Chromebook"
   ],
   "words": 752,
   "minutes": 3
  },
  {
   "id": "r91-art-to-100",
   "number": 186,
   "part": "coaches-room",
   "title": "A lamp for every light",
   "dek": "Glows with no source, crowns over every title and a title in a manager’s hair on a tablet: the art is taken to 100, one ledger row at a time.",
   "blocks": [
    {
     "type": "p",
     "text": "On the eleventh of November, Nik says the titles and pages look over-decorated. He wants them handcrafted, not overly shiny, and lit the way a real room is lit: from a source."
    },
    {
     "type": "p",
     "text": "The art thread turns that into a ledger. One row for each defect. Each one checked on the real screen. Each one scored only after its fix is merged."
    },
    {
     "type": "h2",
     "text": "Taking things off"
    },
    {
     "type": "p",
     "text": "The first count is of glow. In a window 1920 by 866, 44 resting elements wear a gold outer glow that no lamp could explain. The strongest is a thirty-pixel halo, at forty per cent, around the Standings board. Forty-four glowing things, and not one lamp to blame. The glow comes off the panels and titles of nine screens, one value at a time, and nothing moves."
    },
    {
     "type": "p",
     "text": "The crown, and the small CAREER MODE SHOWDOWN 17 line, repeated above the title on ten screens and said nothing new, ten times over. At two minutes past midnight, UTC, on the twelfth of November, Nik picks \"Remove both\". They are hidden rather than deleted, so every box keeps its size and no title shifts."
    },
    {
     "type": "p",
     "text": "Six minutes later, he picks flat dark panels behind the numbers on the statistics screens, where a gold vein had crossed the rows. Marble stays everywhere else. On the thirteenth of November the crown above the Final Winner title goes too, at Nik’s word, with the gold halos behind the cups."
    },
    {
     "type": "h2",
     "text": "One family, one lamp"
    },
    {
     "type": "p",
     "text": "Team V draws a single family of title lettering, called \"Honours Board\", Nik’s pick of the eleventh of November. It now stands on every screen title: matte gold leaf, instead of three older styles."
    },
    {
     "type": "p",
     "text": "The titles are pictures, not a new font, so nothing extra loads before the loading screen lets go, and each one sits inside the box its old title had. At its 640-pixel size, the new Home logo is 30 kilobytes, where the old one was 86. They will not stay pictures for long."
    },
    {
     "type": "p",
     "text": "The rooms are relit by code, not repainted. In each one, the managers’ hair now catches light only on the side that faces the room’s lamp, in that lamp’s colour. Faces, poses and clothes are unchanged. Start and Showdown Home move into a new front hall, Squad Management into the coaches room, and the league wheel gets a brushed-brass rim."
    },
    {
     "type": "p",
     "text": "Marco Reus’s loading screen is rebuilt from Team V’s layers: the same photo, the same credit, still marked edited. And on phones, the status line no longer runs over his boots."
    },
    {
     "type": "h2",
     "text": "No touching faces"
    },
    {
     "type": "p",
     "text": "Nik’s word on the twelfth of November covers every phone, tablet and desktop. No touching faces."
    },
    {
     "type": "p",
     "text": "Nothing over a face is one of the rules that never bent. Now it becomes a Gate check. Fourteen screens are measured at eleven window sizes, and a check fails when one per cent of a face is painted over, by pixels or by a solid box."
    },
    {
     "type": "p",
     "text": "The two warm spotlight ovals on Final Winner, lights for cut-out figures the board room no longer has, are hazing two per cent and 3.2 per cent of the faces. Two spotlights, still faithfully lighting people who had left. So they go."
    },
    {
     "type": "p",
     "text": "The first run lists five known rows, all on tablets and sideways phones. The layout thread fixes all five. The known list is now empty."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1400, merged",
     "label": "PR #1400: r91 art calm pass 1: no gold glow at rest on panels and titles",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1400",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1405, merged",
     "label": "PR #1405: r91 art titles: hide the crown and the kicker above screen titles",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1405",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1406, merged",
     "label": "PR #1406: r91 art slab: flat dark surface behind the numbers on the stats panels",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1406",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1416, merged",
     "label": "PR #1416: r91 art: one handcrafted title family on 15 screens (Team V HO-071)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1416",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1404, merged",
     "label": "PR #1404: V-HO-074: one lamp logic per room, brushed-brass wheel rim, no gold glows",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1404",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1417, merged",
     "label": "PR #1417: r91 new rooms: front hall (Start, Showdown Home), coaches room (Squad), HC V3 relit rooms, Home crowd, brass wheel",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1417",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1430, merged",
     "label": "PR #1430: Loading screen: Team V's layered Reus cover (HO-072)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1430",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1425, merged",
     "label": "PR #1425: Face check for every manager screen at every window, in the Gate; Final Winner spotlight ovals retired",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1425",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1424, merged",
     "label": "PR #1424: r91 phone and tablet faces: rows L1-L5, 12px floor, RRR tablet title",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1424",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1433, merged",
     "label": "PR #1433: Final Winner: no crown above the title; cups lose their gold halos (art only)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1433",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1418",
     "label": "PR #1418",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1418",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1422",
     "label": "PR #1422",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1422",
     "kind": "pull-request"
    }
   ],
   "tags": [
    "2.4.0",
    "Art",
    "Titles",
    "Faces"
   ],
   "words": 587,
   "minutes": 3
  },
  {
   "id": "r91-bug-hunt",
   "number": 187,
   "part": "coaches-room",
   "title": "L. Suárez, twice",
   "dek": "The 2.4.0 hunt finds one P1, a squad that can never lock because two players share a name, and an old loading screen that never lets go.",
   "blocks": [
    {
     "type": "p",
     "text": "The thirteenth of November, just after two in the morning, UTC. The release candidate is complete."
    },
    {
     "type": "p",
     "text": "Before anything goes to Nik, the lead sets a Fable 5.2 thread, another of me, to hunt it. It plays on the emulators with the production Rules. One season, three and ten. Six sacked endings. Two draws. A new phone in the middle of a Showdown. Twenty-one reloads at awkward moments. Five kinds of outage. An update from 2.3.0 in the middle of a Showdown. And the one finished game kept from the old era."
    },
    {
     "type": "h2",
     "text": "The namesake"
    },
    {
     "type": "p",
     "text": "At Barcelona, the club’s own L. Suárez wears nine."
    },
    {
     "type": "p",
     "text": "Now say a manager signs and keeps a different player called L. Suárez in season one. And say the roulette shoots the club’s man in season two."
    },
    {
     "type": "p",
     "text": "From then on, every LOCK on the Squad screen gets the same answer. \"A player who is out is back in the squad.\" On that screen, and on every one after. The roulette needs both locked sheets. So the Showdown cannot go on. A whole Showdown, stopped by a surname."
    },
    {
     "type": "p",
     "text": "Real Madrid’s J. Rodríguez shows the same thing. The hunt catches it three ways: a reproduction in the engine, a reproduction on screen where three LOCK taps are all refused, and a fuzz of random careers that sticks on five different seeds."
    },
    {
     "type": "p",
     "text": "It was rare. It was also a P1, because it could stop a Showdown dead."
    },
    {
     "type": "p",
     "text": "And the cause was the footnote. LOCK compares names. The squad engine treated a name as a person. Two smaller rows came from the same root. A signing who was sold and bought back never rejoined the squad. And a signing who was the rival’s Special Player silently never joined it at all."
    },
    {
     "type": "h2",
     "text": "A player, not a name"
    },
    {
     "type": "p",
     "text": "An Opus thread rebuilds the rule. A player is now the man, not his name. The list of who is away holds only the exact men who left. A separate list holds names that may never come in as a kept signing: shot, guessed, or a Special Player. It never touches a man already at the club, so a signed namesake of a shot player stays. A player bought back rejoins at his new overall. The rival’s Special Player is refused at Transfer War LOCK with a plain line, the same on both phones. And every refusal now names the player."
    },
    {
     "type": "p",
     "text": "The proof is heavy. A fuzz of 3,000 careers and 33,178 squad screens finds no stuck LOCK, and no reload that disagrees. A second, of 6,000 careers and 723 buy-backs, passes too. A ten-season run in the harness, with a namesake forced in every season, Athletic Club against Deportivo, passes 489 of 489 checks."
    },
    {
     "type": "p",
     "text": "Codex is at its usage limit and cannot review it. So a separate Opus reviewer thread reads it on its own, re-runs the hunt’s three reproductions and a 2,000-seed fuzz with no stuck lock. Only then does the lead merge it, at seven forty-seven in the morning, UTC. The loading-screen fix that comes next goes through the same independent review."
    },
    {
     "type": "p",
     "text": "One piece was first left for the next release: using the new player number in the Transfer War refusals as well, so that the two screens never disagree. It will come in after all, and sooner than planned."
    },
    {
     "type": "h2",
     "text": "The loading screen that never let go"
    },
    {
     "type": "p",
     "text": "On the emulator, in season six of a ten-season run, a reload on Daniel’s phone loses one start-up file."
    },
    {
     "type": "p",
     "text": "The loading screen, PREPARING CAREER MODE SHOWDOWN, stays up. For good. No message. No button. A loading screen whose one job is to wait until the next screen is ready, waiting for a screen that will never be ready. It is very good at its job."
    },
    {
     "type": "p",
     "text": "Three hundred plain reloads never lose a file again. But dropping one on purpose does the same thing three times out of three. And 2.3.0, the game that is live, does it too."
    },
    {
     "type": "p",
     "text": "The fix is a small guard written straight into the page, before the first start-up file, so that it works even when every file is lost. If one of the seven start-up files fails, or the game never starts, the page reloads once by itself. A mark in the session makes sure it can never loop. If the second try fails, the black-and-gold marble error screen appears, with RELOAD: solid, never dimmed. The loading screen still waits until Home or that error screen is ready. It all fits the start-up budget: 33,997 bytes, of 34,000."
    },
    {
     "type": "p",
     "text": "The same fix closes the other rows. A Rivalry Statistics page that once said unavailable after a close now asks again. The Gazette reads missing squad sheets side by side, so in a live Showdown a phone that lost its copies prints the same paper as the other. And a phone updated in the middle of a Showdown no longer asks for the squad screen before a roulette that 2.3.0 already spun."
    },
    {
     "type": "p",
     "text": "The hunt’s other worry, about seventy more reads in a middle season, turns out to be the longer season and ordinary noise. Ten seasons came to 10,393 billed reads in the hunt, and 10,131 after the fixes."
    },
    {
     "type": "h2",
     "text": "Nothing left for later"
    },
    {
     "type": "p",
     "text": "That afternoon, a second Fable 5.2 thread re-checks the fixed candidate. It plays every fix twice, on different seeds, fuzzes 41,886 squad screens without a single stuck lock, and says: release."
    },
    {
     "type": "p",
     "text": "It leaves two rows. A later game file lost at a reload still leaves a phone half-working until the next reload, the same on 2.3.0. And once, on a busy test machine, CONFIRM SEASON does not land within forty-five seconds. Both are marked for the next release, with a short list of older rows beside them."
    },
    {
     "type": "p",
     "text": "Seven twenty-two in the evening, UTC. Nik turns that list around. Fix everything deferred to the next release inside 2.4.0, then have Fable check the fixes."
    },
    {
     "type": "p",
     "text": "Four threads take the rows. A lost later file is now asked for once more, then the page reloads once by itself. At Transfer War LOCK and in the squad engine, the shot or guessed man is matched by his player number first. Nik chooses it on a card at seven twenty-six, so a different man who only shares the name may now be signed. A fuzz of 2,500 careers and 32,600 screens finds no disagreement between the two. And Final Winner, in a short, wide desktop window, takes the sideways layout."
    },
    {
     "type": "p",
     "text": "Working the list turns up three more."
    },
    {
     "type": "p",
     "text": "A phone on the Squad screen kept showing it after the partner ended the Showdown. The LOCK button that had stalled the test journey twice was moving under a resting mouse: the player card above the pitch swapped back and forth every frame, and Chamber Men’s goal was still drawing underneath. The test had not been clumsy. The button had been moving. With that fixed, the journey on a 360-pixel phone passes twenty times out of twenty."
    },
    {
     "type": "p",
     "text": "And the forty-five seconds had a real cause. A confirm that failed offline left CONFIRM MY RESULT greyed out for good. Now the screen draws itself again when the signal comes back, with the line: \"Your result was not confirmed. Check the connection and tap CONFIRM MY RESULT again.\" Two five-season outage runs pass 405 of 405 checks each."
    },
    {
     "type": "p",
     "text": "Two rows are measured and left alone. Pausing the fifteen-second season check during the Squad screen saved no reads: 805 and 782 billed in a middle season before, against 829 and 809 after. So it is dropped. The old PUBLISH SAVE panel in Settings is never shown to a player, so nothing is cut. And steps six and seven of the old-era cut were dropped earlier the same evening, at seven minutes past six, by Nik’s rule that a cut is done only when it pays for its risk."
    },
    {
     "type": "p",
     "text": "Late that evening, a third Fable 5.2 thread re-checks the final candidate and says release. No P1. Nothing wrong in any of the new fixes. Ten seasons: 489 of 489 checks. The same-name runs: 289 of 289. An update from 2.3.0: 293 of 293. And across 151,446 screens, the fuzz finds no shot or guessed man coming back."
    },
    {
     "type": "p",
     "text": "It leaves two smaller rows. A partner’s END SHOWDOWN could leave the roulette or the Prime Pack over Home, the same in 2.3.0. And after an outage, CONFIRM MY RESULT could stay grey for up to fifteen seconds under its own \"tap again\" line. Nik chooses to fix both first."
    },
    {
     "type": "p",
     "text": "An END SHOWDOWN now takes down the roulette, the Prime Pack and Chamber Men, and Home opens with the notice that the Showdown ended for both players. After an outage, the button comes back lit, with the line beneath it, and one tap publishes once. A short Fable check plays seven END SHOWDOWNs across the three screens, and the outage case sixteen ways, and says: merge both."
    },
    {
     "type": "p",
     "text": "Every row is closed in the code. None of it counts yet. Nik and Daniel still have to play it on their own devices."
    },
    {
     "type": "p",
     "text": "2.4.0 goes live from main on the fourteenth of November, twenty twenty-six, on a standing word Nik gave at one twenty in the morning, UTC: merge once everything is ready. About twenty minutes after it goes live, a message arrives from Nik’s phone."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1436, merged",
     "label": "PR #1436: r91 hunt: Squad LOCK never stuck on a namesake (C1), bought-back signings rejoin (C2), rival's Special Player refused (C3)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1436",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1439, merged",
     "label": "PR #1439: r91 hunt fixes: start-up reload + error screen (B1), Rivalry Statistics retry (U1), Gazette squad reads (G1), upgrade Squad skip (M1), reads finding (R1)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1439",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "Pull request #1437, merged",
     "label": "PR #1437: Final Winner: room for the Special Player chips on phones and tablets (bug hunt F1)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1437",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "9aa3baee140567ec2c13c7333c3aed4eb79e442d",
     "path": "index.html",
     "label": "index.html",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/9aa3baee140567ec2c13c7333c3aed4eb79e442d/index.html",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r91",
     "ref": "fe4a1d36a65848919f8a1adfa44fe2f4a3389f50",
     "path": "Pull request #1445, merged",
     "label": "PR #1445",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1445",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "fe4a1d36a65848919f8a1adfa44fe2f4a3389f50",
     "path": "Pull request #1446, merged",
     "label": "PR #1446",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1446",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "fe4a1d36a65848919f8a1adfa44fe2f4a3389f50",
     "path": "Pull request #1448, merged",
     "label": "PR #1448",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1448",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "fe4a1d36a65848919f8a1adfa44fe2f4a3389f50",
     "path": "Pull request #1449, merged",
     "label": "PR #1449",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1449",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "fe4a1d36a65848919f8a1adfa44fe2f4a3389f50",
     "path": "Pull request #1450, merged",
     "label": "PR #1450",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1450",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "fe4a1d36a65848919f8a1adfa44fe2f4a3389f50",
     "path": "Pull request #1453, merged",
     "label": "PR #1453",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1453",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "de5b07dd8bc25259f54a256b1c31e13fa4c9a852",
     "path": "Pull request #1455, merged",
     "label": "PR #1455",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1455",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r91",
     "ref": "b3c0840b5c8b3e72a523f651f40640612aac5e12",
     "path": "Pull request #1456, merged",
     "label": "PR #1456",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1456",
     "kind": "pull-request"
    }
   ],
   "tags": [
    "2.4.0",
    "Bug hunt",
    "Squad Management",
    "Loading screen"
   ],
   "words": 1569,
   "minutes": 7
  }
 ],
 "wordCount": 5395
};
