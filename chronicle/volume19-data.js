/* THE CHRONICLE · Volume 19 (Team G, r91 / 2.4.0): Squad Management, the full FIFA 17 list, the old-era cut, the truthful Device check, art to 100 and the 2.4.0 bug hunt. Written from gameplay/r91 9aa3baee. Loaded by volume19.js.
   RELEASE LINE: the last sentence of chapter 187 ("2.4.0 is not live yet; ...") is the one sentence the r91 lead replaces at release with the live date and time. */
window.CHRONICLE_VOLUME19={
 "capturedAt": "2026-11-13T12:00:00Z",
 "part": {
  "id": "coaches-room",
  "title": "The coaches’ room",
  "dek": "13 November 2026: 2.3.0 is live; 2.4.0 gives each manager a squad to set, the whole FIFA 17 list to sign from, a Device check that tells the truth and handcrafted art, then hunts its own bugs.",
  "image": "club.webp"
 },
 "chapters": [
  {
   "id": "r91-squad-management",
   "number": 182,
   "part": "coaches-room",
   "title": "Fifteen names on a board",
   "dek": "The roulette had always shot at a squad the managers never chose. 2.4.0 hands them the board, twice a season, and gives them nowhere to hide a star.",
   "blocks": [
    {
     "type": "callout",
     "label": "Release boundary",
     "text": "Written on 13 November 2026 from gameplay/r91 (9aa3baee), the branch that becomes 2.4.0. The live game is 2.3.0, which went live on 11 November at 10:04 UTC. Every number in this volume was measured in the build room: Firebase emulators with the production Rules, the CE2PG harness playing both managers, never the production database. Nothing here is a physical acceptance; that belongs to Nik and Daniel on their own phones."
    },
    {
     "type": "p",
     "text": "Every season since 2.0.0 the roulette has fired at fifteen names: a starting eleven and four substitutes, laid out on a board in front of the cylinder. Until 2.4.0 the managers never picked those fifteen. The game worked them out alone, from the launch squad, the Transfer War verdicts and the players the gun had already taken. It was fair, and it was nobody’s team."
    },
    {
     "type": "p",
     "text": "On 9 November at 05:51 UTC Nik saved three ideas for the release after 2.3.0. The third was a new screen between Chamber Men and the roulette, where a manager could pick a formation, drag his players and lock the fifteen himself, in the manner of FIFA 17’s own squad screen."
    },
    {
     "type": "h2",
     "text": "The first plan was wrong"
    },
    {
     "type": "p",
     "text": "The planning thread did its homework. It found that at 81 of the 98 clubs the launch fifteen is not the fifteen best players by overall, and that at 6 clubs the best fifteen has no goalkeeper at all. So its first plan simply took the top fifteen by overall."
    },
    {
     "type": "p",
     "text": "Nik said that was wrong, at 00:03 UTC on 11 November, and wrote the rules himself. Season 1 is the launch eleven in the club’s default formation plus its four original substitutes, changed only by signings and by the roulette. From season 2 players leave, for the reasons a FIFA career gives them: contract ended, retired, swapped, sold. The manager takes the man out and replaces him inside the same line, goalkeeper, defence, midfield or attack. The formation decides how many of each line start, and nobody is ever sorted across positions. The screen has three parts, as FIFA 17’s does: Starting XI, Substitutes and Reserves. Reserves never stand on the roulette board."
    },
    {
     "type": "p",
     "text": "Thirty-five minutes later he closed the obvious loophole. A screen that lets you arrange your squad also lets you hide your best player in the reserves, where the gun cannot see him. So from season 2 each line of the XI is filled by its best players by overall, the four substitutes on the board are strictly the best four left, and a reserve rated above anyone in the fifteen moves up on his own. A manager arranges his stars. He cannot put them away."
    },
    {
     "type": "p",
     "text": "Three exceptions cross a line, because Nik named them: RM and RW, LM and LW, CF and CAM. The lead added one more rule at 00:59 UTC: a player’s own FIFA positions decide who must start, and the flex list only says who may."
    },
    {
     "type": "h2",
     "text": "Twice a season"
    },
    {
     "type": "p",
     "text": "The screen comes twice. After Chamber Men, before the roulette, both managers set and lock their squads, and the cylinder waits until both are locked; it then spins on those two sheets. After the Transfer War, before Season Results, the kept signings walk in, the player the roulette shot is gone, and the manager locks his squad for next season without waiting for his rival. The last season of a Showdown has no second screen, because there is no next season to set."
    },
    {
     "type": "p",
     "text": "Behind it sit all 33 FIFA 17 formations, with a search box beside them, so that 433 finds the five 4-3-3s and diamond finds the diamonds. Checking them against Nik’s own 48-second FIFA 17 clip found one real mistake: the two 4-4-1-1 labels were the wrong way round, and only the labels changed (#1376). Seven substitutes are allowed, but subs 5 to 7 carry a plain line, “Not on the Russian Roulette board”. The room behind the pitch is Team V’s coaches room."
    },
    {
     "type": "h2",
     "text": "What a locked squad costs"
    },
    {
     "type": "p",
     "text": "Each lock is one document per manager per screen, created once and never changed: the Rules allow nobody to update or delete it (#1358). The lists of departures and reported overalls only grow, so either phone can rebuild any squad from its latest document plus the automatic chain, and two phones holding different documents still arrive at the same fifteen; a contract proves it on 98 seeded ten-season careers, 1,661 locked screens. Departures and new overalls also reach the Touchline Gazette as one line of squad news, at most three names a manager, never in season 1 (#1374)."
    },
    {
     "type": "p",
     "text": "The bug hunt measured the cost on the emulator: 42 billed reads and 6 writes for the squad sheets in season 1, then 24 to 26 billed reads and 4 writes in each middle season. The new screen was ready. Whether its idea of who a player is would hold up was a question for chapter 187."
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
   "words": 845,
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
     "text": "Until 2.4.0 the Transfer War asked for a signing’s name and trusted the manager to type it. The game itself knew 2,975 players, the men of its 98 clubs. Anyone else was a string of letters."
    },
    {
     "type": "p",
     "text": "Nik’s second idea of 9 November asked for names that complete themselves, from the full FIFA 17 database, with a list like the Prime Pack’s, and with custom names still allowed. He also wanted it light. On the night of 10 November he made himself clearer: the database must be full, every player at every club and beyond, in the exact FIFA 17 release the game uses, and “light” only describes the file format. At 23:56 UTC he picked one full file, fetched only when it is needed."
    },
    {
     "type": "h2",
     "text": "Which FIFA 17"
    },
    {
     "type": "p",
     "text": "The first question was which version of FIFA 17’s squads. The research thread chose the SoFIFA roster 170002, pinned by its hash, and noticed it had Payet at West Ham and Oscar at Chelsea, which fits the launch squads. At 23:59 UTC Nik reset all squads on his own console and read back the same two clubs."
    },
    {
     "type": "p",
     "text": "The file holds 17,597 players, 224 of them free agents, at 632 clubs. It weighs 905 KB raw and 296 KB gzipped, under a budget of 320 KB. Full names are kept for players rated 75 and over, so typing Lionel finds Messi. Five leagues with no place of their own in the game, Ukraine, Greece, Brazil Série B, South Africa and Finland, went to Rest of World, after Nik checked on his console that FIFA 17 files those clubs there (#1365)."
    },
    {
     "type": "p",
     "text": "Home never sees the file. It is not precached and not in the offline pack; the Transfer War asks for it when the screen is idle, and the Squad screen before the roulette now starts the fetch early, so the list is warm before the clock starts (#1383)."
    },
    {
     "type": "h2",
     "text": "Two letters"
    },
    {
     "type": "p",
     "text": "Type two letters into a signing’s name and up to twenty matches drop down: the name, then position, overall and club, or Free agent. Pick one and the row fills itself. In season 1 that means name, position, nationality, overall and previous league. From season 2 overall and league change with every save, so only name, position and nationality are filled, and every box can still be edited."
    },
    {
     "type": "p",
     "text": "A custom name still works exactly as typed. Nothing in the list is highlighted until an arrow key moves, so Enter or a tap elsewhere keeps the manager’s own words, and the game adds one quiet line: “Not in the FIFA 17 list. Your name stays as typed.”"
    },
    {
     "type": "p",
     "text": "The list also knows the house rules. A player the roulette shot, a player already guessed, or the manager’s own Special Player appears with his name struck through and CAN’T BE SIGNED beside it. Tap him and the game shows the words LOCK itself would use. LOCK did not change; it still refuses."
    },
    {
     "type": "p",
     "text": "In the 3-season run that proved it, typing paulinho put the free agent first (CM 81), then the men at BK Häcken and GD Chaves. Picking the BK Häcken one in season 1 filled LW, 72, Allsvenskan and Brazil; in seasons 2 and 3 it filled only LW and Brazil."
    },
    {
     "type": "h2",
     "text": "The one Rules change"
    },
    {
     "type": "p",
     "text": "The list mapped 160 of the 162 nationalities in the file. Kyrgyzstan and Sudan, one player each, were missing from the game’s catalog, and Nik’s answer was to add every country that has a player in FIFA 17. The catalog went from 164 to 166. In the same change a picked player’s SoFIFA id is stored on the locked signing as an optional playerId, a whole number from 1 to 999,999; a typed name, or a picked one edited afterwards, has none. Those two edits and the squad sheets are the whole Rules change of 2.4.0, and they deploy only when the release reaches main (#1383)."
    },
    {
     "type": "p",
     "text": "The planning file had already noted one rare edge. LOCK compares names, so two different players with the same short name block each other. It looked like a footnote."
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
   "words": 699,
   "minutes": 3
  },
  {
   "id": "r91-old-era-cut",
   "number": 184,
   "part": "coaches-room",
   "title": "What stays in the loft",
   "dek": "Five steps clear out the offline era. One finished game is kept exactly as it is, and the last two steps were dropped by Nik’s rule that a cut must pay for its risk.",
   "blocks": [
    {
     "type": "p",
     "text": "2.3.0 had cleared the loft of things nobody ran. r91 went after a harder kind of waste: code that still ran, for an era that was over. Release dates that switched features on, off switches nobody used, a backup system for a game that now keeps its history in Firebase."
    },
    {
     "type": "p",
     "text": "Nik answered the cut plan at 04:19 UTC on 11 November. History & Backup could go, and he did not need the one finished game from the r79 era kept. Four hours later a decision card asked him plainly, and at 08:34 UTC he picked: keep that finished game’s History row exactly as it is. A minute later he set the rule for the whole cut, in his own words: “Make sure nothing changes that can break the game. Keep anything needed.”"
    },
    {
     "type": "h2",
     "text": "Step 0: the game that must not move"
    },
    {
     "type": "p",
     "text": "Before anything was deleted, the team built a guard (#1402). The r79 build itself played a one-season Showdown to the end on the emulator, Daniel winning 9-3 with Málaga against Real Betis, and the data was exported. Its setup time was set to 25 October, the r79 era, so like the real game it has no Special Player. A new test plan imports it, signs both managers in on fresh browsers and reads every career page. It passed 19 of 19 checks on r91, and 32 of 32 through an update from 2.3.0, with every figure the same before and after."
    },
    {
     "type": "h2",
     "text": "Steps 2 to 5"
    },
    {
     "type": "p",
     "text": "Step 2 removed the release-time gates, seven kinds of “live from this date” check (#1356). Prime Pack’s alone had seven copies. The off switches went with them. One date stays on purpose, MARQUEE_FROM_MS, because it is the reason the finished game shows no Special Player."
    },
    {
     "type": "p",
     "text": "Step 2 also broke something. With it in, a shot or guessed player could be signed again in the Transfer War: the refusal still read a value the cut had taken away, and its contract never noticed because it tested a fake provider that still had it. The fix put the check back on the live provider (#1393), and the cut’s notes now say to test the real module wherever possible."
    },
    {
     "type": "p",
     "text": "Step 3 took out Settings > OPEN HISTORY & BACKUP and the page behind it, the backup-file export, import and restore, the hidden Save Library editor and the RESTORE BACKUP button on the OLD SHOWDOWN FOUND screen (#1366). What Nik loses in practice is saving his history to a file and loading it back. Pairing, JOIN, the offline cache and the update notice use the Save Library underneath, so all of that stays."
    },
    {
     "type": "p",
     "text": "Step 4 deleted three Rules drafts that were never published, and the generated production Rules came out byte for byte the same (#1379). Step 5 removed an old update page, the Stage 5F page and the old acceptance tools (#1386). The one thing lost is the manual update page for a phone still on the r29 service worker; such a phone now updates the normal way."
    },
    {
     "type": "p",
     "text": "The proof ran on everything together: CE2PG 185 of 185 checks for one season, 288 of 288 for three, 243 of 243 with a manager sacked, the full contract suite 321 of 321, the finished game unchanged, and an independent Opus reviewer who found nothing removed that was still in use. Step 1 of the plan, a handful of dead leftovers, is not in that table: its tiebreak helper, which nothing reads and which can only ever answer none or draw, is still in the code."
    },
    {
     "type": "h2",
     "text": "Steps 6 and 7"
    },
    {
     "type": "p",
     "text": "Two steps stay in the loft for now. Step 6 is the old save migrations; step 7 is the local Transfer War handlers inside js/transferChallenge.js, a 1,035-line file that still hosts the online Transfer War screen, so it can only be cut function by function. Both will delete only what a coverage run proves never executes. Nik chose the timing on 12 November: right after 2.4.0 ships."
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
   "words": 689,
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
     "text": "2.3.0 shipped with a Device check: a page that plays the 3D screens at each quality level and lets Auto choose. On the live game, Settings > 3D QUALITY > Device check... changed the address and showed Home."
    },
    {
     "type": "p",
     "text": "Sol 6.1’s review of 2.3.0 found why. The page had never been copied into the published site, so it did not exist online, and the service worker answered any page it did not know with Home. The fix publishes both pages and lets the worker fetch them from the network; offline it shows a short page of its own with the way back (#1384). A new contract fails if any page at the site’s root is ever left out again."
    },
    {
     "type": "h2",
     "text": "Two false passes"
    },
    {
     "type": "p",
     "text": "Sol found something worse inside the page. It reproduced two false passes, and both saved Ultra (4K) as Auto when they should not have: one when Chamber Men failed to start while the roulette ran smoothly, because the check ignored the scene that failed, and one when every frame drew Light whatever level was asked, because the check never compared the level drawn with the level asked."
    },
    {
     "type": "p",
     "text": "Nik’s rule came at 14:33 UTC on 11 November: “Auto should allow all qualities based on device real test ... from light to 8k.” The check now plays a Chamber Men kick, a roulette turn and a Special Player reveal at each level, lightest first. A level counts only when all three screens answered, drew the level asked with its own files at full size, finished a whole beat and held 60 frames a second, an average of 57 or more and a 1% low of 45 or more. A screen that is not smooth settles the level. Anything else is not verified: nothing is saved, the last good result stays, and the page says which screen failed and why (#1389). Without a check, Auto’s own guess still stops at Extra."
    },
    {
     "type": "h2",
     "text": "Weak machines"
    },
    {
     "type": "p",
     "text": "The device lab found Settings offering Ultra (4K) and 8K on a Chromebook with 2 processor threads and 4 GB of memory. Nik chose on 12 November: on a weak device, 2 threads or fewer or 4 GB or less, those two levels appear only after the Device check passes them there (#1409). The same change remembers a tab that dies while a 3D screen opens; next time Auto opens that screen one level lower."
    },
    {
     "type": "h2",
     "text": "A table anyone can read"
    },
    {
     "type": "p",
     "text": "Nik then asked for a table in the game that says what is suggested for each machine, from its graphics chip and processor, with real pictures of each 3D screen at each level, and with the link and the Auto pick easy to see. The Device check page now opens on a “Your device” card, chip, threads and memory with what each means, then “We suggest” a level. Under the results a Level guide runs six rows from Light to 8K, marks the reader’s own row, and shows Chamber Men, the roulette and the Special Player at every level: 36 pictures, loaded only on that page. In Settings a gold link reads “Device check and guide”, and the Auto entry names its pick, “Auto · Light” (#1423). The guide never promises a frame rate; “Holds 60 fps” appears only for the reader’s own machine after a finished check."
    },
    {
     "type": "p",
     "text": "For the machine on the kitchen table the answer is plain. Nik’s Chromebook, an Intel UHD chip with 2 threads and 4 GB, stays on Auto, and Auto picks Light. At Light Chamber Men carries about 67 MB of textures by the scene’s own estimate, against 97 at Balanced, and Balanced is the only step up worth trying, once 2.4.0 is live and his own check measures it smooth. Speed could not be measured in the build room, which draws in software, so this chapter quotes no frame rate."
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
   "words": 671,
   "minutes": 3
  },
  {
   "id": "r91-art-to-100",
   "number": 186,
   "part": "coaches-room",
   "title": "A lamp for every light",
   "dek": "Glows with no source, crowns over every title and a title in a manager’s hair on a tablet: the art is taken to 100 one ledger row at a time.",
   "blocks": [
    {
     "type": "p",
     "text": "On 11 November Nik said the titles and pages looked over-decorated. He wanted them handcrafted, not overly shiny, and lit the way a real room is lit, from a source. The art thread turned that into a ledger: one row for each defect, checked on the real screen, scored only after its fix was merged."
    },
    {
     "type": "h2",
     "text": "Taking things off"
    },
    {
     "type": "p",
     "text": "The first count was of glow. At 1920x866, 44 resting elements wore a gold outer glow that no lamp could explain, the strongest a 30-pixel halo at 40% around the Standings board. The glow came off the panels and titles of nine screens, one value at a time, and nothing moved (#1400)."
    },
    {
     "type": "p",
     "text": "The crown and the small CAREER MODE SHOWDOWN 17 line repeated above the title on ten screens and said nothing new. Nik picked “Remove both” at 00:02 UTC on 12 November. They are hidden rather than deleted, so every box keeps its size and no title shifts (#1405). Six minutes later he picked flat dark panels behind the numbers on the statistics screens, where a gold vein had crossed the rows; marble stays everywhere else (#1406). On 13 November the crown above the Final Winner title went too, at Nik’s word, with the gold halos behind the cups (#1433)."
    },
    {
     "type": "h2",
     "text": "One family, one lamp"
    },
    {
     "type": "p",
     "text": "Team V drew a single family of title lettering, V3, “Honours Board”, Nik’s pick of 11 November, and it now stands on every screen title, matte gold leaf instead of three older styles. The titles are pictures, not a new font, so nothing extra loads before the loading screen lets go, and each one sits inside the box its old title had (#1416, #1418, #1422). At its 640-pixel size the new Home logo is 30 KB where the old one was 86."
    },
    {
     "type": "p",
     "text": "The rooms were relit by code, not repainted. In each one the managers’ hair now catches light only on the side that faces the room’s lamp, in that lamp’s colour; faces, poses and clothes are unchanged (#1404). Start and Showdown Home moved into a new front hall, Squad Management into the coaches room, and the league wheel got a brushed-brass rim (#1417). Marco Reus’s loading screen was rebuilt from Team V’s layers, the same photo, the same credit with its word edited, and on phones the status line no longer runs over his boots (#1430)."
    },
    {
     "type": "h2",
     "text": "No touching faces"
    },
    {
     "type": "p",
     "text": "Nik’s word on 12 November covered every phone, tablet and desktop: no touching faces. It became a Gate check. Fourteen screens are measured at eleven window sizes, and a check fails when 1% of a face is painted over, by pixels or by a solid box (#1425). The two warm spotlight ovals on Final Winner, lights for cut-out figures the board room no longer has, were hazing 2.0% and 3.2% of the faces, so they went."
    },
    {
     "type": "p",
     "text": "The first run listed five known rows, all on tablets and sideways phones. The layout thread fixed all five (#1424), and the known list is now empty."
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
    }
   ],
   "tags": [
    "2.4.0",
    "Art",
    "Titles",
    "Faces"
   ],
   "words": 531,
   "minutes": 2
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
     "text": "On 13 November, just after 02:00 UTC, the release candidate was complete, and the lead set a Fable 5.2 thread to hunt it at 42eb86cb before anything went to Nik. It played on the emulators with the production Rules: one, three and ten seasons, six sacked endings, two draws, a new phone mid-Showdown, 21 reloads at awkward moments, five kinds of outage, an update from 2.3.0 in the middle of a Showdown, and the finished r79 game."
    },
    {
     "type": "h2",
     "text": "The namesake"
    },
    {
     "type": "p",
     "text": "At Barcelona the club’s own L. Suárez wears 9. Say a manager signs and keeps a different player called L. Suárez in season 1, and the roulette shoots the club’s man in season 2. From then on every LOCK on the Squad screen answered “A player who is out is back in the squad.”, on that screen and every one after. The roulette needs both locked sheets, so the Showdown could not go on. Real Madrid’s J. Rodríguez showed the same thing. The hunt caught it with an engine repro, a screen repro where three LOCK taps were all refused, and a fuzz that stuck on seeds 388, 653, 1111, 1112 and 1154."
    },
    {
     "type": "p",
     "text": "It was rare, and it was a P1, because it could stop a Showdown dead. The cause was the footnote from chapter 183: the squad engine treated a name as a person. Two smaller rows came from the same root. A signing who was sold and bought back never rejoined the squad (C2), and a signing who was the rival’s Special Player silently never joined it (C3)."
    },
    {
     "type": "h2",
     "text": "A player, not a name"
    },
    {
     "type": "p",
     "text": "An Opus thread rebuilt the rule (#1436). A player is now the man, not his name. The list of who is away holds only the exact men who left. A separate list holds names that may never come in as a kept signing, shot, guessed or a Special Player, and it never touches a man already at the club, so a signed namesake of a shot player stays. A player bought back rejoins at his new overall. The rival’s Special Player is refused at Transfer War LOCK with a plain line, the same on both phones, and every refusal now names the player."
    },
    {
     "type": "p",
     "text": "The proof was heavy. A fuzz of 3,000 careers, 33,178 squad screens, found no stuck LOCK and no reload that disagreed; a second one of 6,000 careers and 723 buy-backs passed too. A ten-season CE2PG with a namesake forced every season passed 489 of 489 checks, Athletic Club against Deportivo. Codex was at its usage limit and could not review it, so a separate Opus reviewer thread read it on its own, re-ran the hunt’s three repros and a 2,000-seed fuzz with no stuck lock, and only then did the lead merge it, at 07:47 UTC. #1439 below went through the same independent review. Using the new playerId in the Transfer War refusals as well was first left for r92, so that the two screens never disagree; the next section tells how it came in after all."
    },
    {
     "type": "h2",
     "text": "The loading screen that never let go"
    },
    {
     "type": "p",
     "text": "In season 6 of a ten-season run, a reload on Daniel’s phone lost one start-up file, js/storage.js. The loading screen, PREPARING CAREER MODE SHOWDOWN, stayed up for good, with no message and no button. Three hundred plain reloads never lost a file again, but dropping one on purpose did the same thing three times out of three, and 2.3.0 does it too."
    },
    {
     "type": "p",
     "text": "The fix is a small guard written straight into the page, before the first start-up file, so that it works even when every file is lost (#1439). If one of the seven start-up files fails, or the game never starts, the page reloads once by itself; a mark in the session makes sure it can never loop. If the second try fails, the black-and-gold marble error screen appears with RELOAD, solid, never dimmed. The loading screen still waits until Home or that error screen is ready. It all fits the start-up budget, 33,997 bytes of 34,000."
    },
    {
     "type": "p",
     "text": "The same pull request closed the other rows: a Rivalry Statistics page that once said unavailable after a close now asks again, the Gazette reads missing squad sheets side by side, so in a live Showdown a phone that lost its copies prints the same paper as the other, and a phone updated in the middle of a Showdown no longer asks for the squad screen before a roulette that 2.3.0 already spun. The hunt’s other worry, about 70 more reads in a middle season, turned out to be the longer season and ordinary noise. Ten seasons came to 10,393 billed reads in the hunt and 10,131 after the fixes."
    },
    {
     "type": "h2",
     "text": "Nothing left for later"
    },
    {
     "type": "p",
     "text": "A second Fable 5.2 thread re-checked the fixed candidate, 712f6301, that afternoon. It played every fix twice on different seeds, fuzzed 41,886 squad screens without a single stuck lock, and said release. It left two rows. A later game file lost at a reload still left a phone half-working until the next reload, the same on 2.3.0 (L1). And once, on a busy test machine, CONFIRM SEASON did not land within 45 seconds (W1). Both were marked for r92, with a short list of older rows beside them."
    },
    {
     "type": "p",
     "text": "At 19:22 UTC Nik turned that list around: fix everything deferred to r92 inside 2.4.0, then have Fable check the fixes. Four threads took the rows. A lost later file is now asked for once more, then the page reloads once by itself (#1446). At Transfer War LOCK and in the squad engine the shot or guessed man is matched by his playerId first; Nik chose it on a card at 19:26 UTC, so a different man who only shares the name may now be signed (#1448), and a fuzz of 2,500 careers and 32,600 screens found no disagreement between the two. Final Winner in a short, wide desktop window takes the sideways layout (#1445)."
    },
    {
     "type": "p",
     "text": "Working the list turned up three more. A phone on the Squad screen kept showing it after the partner ended the Showdown (#1449). The LOCK button that had stalled the test journey twice was moving under a resting mouse: the player card above the pitch swapped back and forth every frame, and Chamber Men’s goal was still drawing underneath (#1450); the journey on a 360-pixel phone then passed 20 times out of 20. And W1 had a real cause: a confirm that failed offline left CONFIRM MY RESULT greyed out for good, so the screen now draws itself again when the signal comes back, with the line “Your result was not confirmed. Check the connection and tap CONFIRM MY RESULT again.” (#1453). Two five-season outage runs passed 405 of 405 checks each."
    },
    {
     "type": "p",
     "text": "Two rows were measured and left alone. Pausing the 15-second season check during the Squad screen saved no reads, 805 and 782 billed in a middle season before against 829 and 809 after, so it was dropped. The old PUBLISH SAVE panel in Settings is never shown to a player, so nothing was cut. Old-era cut steps 6 and 7 were dropped earlier the same evening, at 18:07 UTC, by Nik’s rule that a cut is done only when it pays for its risk."
    },
    {
     "type": "p",
     "text": "A third Fable 5.2 thread re-checked the final candidate, fe4a1d36, late that evening and said release: no P1, and nothing wrong in any of the new fixes. Ten seasons passed 489 of 489 checks, the same-name runs 289 of 289, an update from 2.3.0 293 of 293, and the fuzz found no shot or guessed man coming back in 151,446 screens. It left two smaller rows: a partner’s END SHOWDOWN could leave the roulette or the Prime Pack over Home, the same in 2.3.0, and after an outage CONFIRM MY RESULT could stay grey for up to 15 seconds under its own “tap again” line. Nik chose to fix both first. An END SHOWDOWN now takes down the roulette, the Prime Pack and Chamber Men, and Home opens with the notice that the Showdown ended for both players (#1456). After an outage the button comes back lit with the line beneath it, and one tap publishes once (#1455). A short Fable check played seven END SHOWDOWNs across the three screens and the outage case sixteen ways, and said merge both."
    },
    {
     "type": "p",
     "text": "Every row is closed in the code. None of it counts yet. Nik and Daniel still have to play it on their own devices. 2.4.0 went live from main on 14 November 2026, on the standing word Nik gave at 01:20 UTC that night: merge r91 once everything is ready."
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
   "words": 1462,
   "minutes": 6
  }
 ],
 "wordCount": 4897
};
