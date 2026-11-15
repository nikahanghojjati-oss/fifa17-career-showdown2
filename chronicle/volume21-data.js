/* THE CHRONICLE · Volume 21 (Team G, r93 / 2.6.0): the Golden Showdown screen and the winner’s gold bust, the flat logo and live-text titles,
   the Special Player stands, the Device check that closed the tab, the roulette hand filmed again with a whisky glass, and the bug hunts
   with the Rules budget sweep. Written from gameplay/r93 1b15c246. Loaded by volume21.js.
   RELEASE LINE: the last sentence of chapter 194 (“2.6.0 is not live yet; it waits for Nik’s word after the gallery.”) is replaced
   by the release with the live date. */
window.CHRONICLE_VOLUME21={
 "capturedAt": "2026-11-15T20:30:00Z",
 "part": {
  "id": "gold-and-glove",
  "title": "The gold and the glove",
  "dek": "The fourteenth and fifteenth of November. 2.5.0 is live; a Golden Showdown gets its own moment and its own bust, the first screen is redrawn flat, the roulette hand is filmed again, and the bug hunts find one lock that would not close.",
  "image": "legacy.webp"
 },
 "chapters": [
  {
   "id": "r93-golden-showdown",
   "number": 190,
   "part": "gold-and-glove",
   "title": "A hundred and fifty",
   "dek": "The best result in the game had no moment of its own. Nik asked for one, then asked for his own face on the trophy, and the hunt proved that only one man can ever stand there.",
   "blocks": [
    {
     "type": "p",
     "text": "Ten seasons. Fifteen points in every one of them. A hundred and fifty in all."
    },
    {
     "type": "p",
     "text": "A Golden Showdown is the hardest thing the game can ask of a manager. Fifteen is everything a season can give, the Prime Pack points included, and it has to happen ten times running. And until 2.6.0, reaching it changed almost nothing on screen."
    },
    {
     "type": "p",
     "text": "This part of the record was written on the fifteenth of November, from the branch that becomes 2.6.0. The live game is 2.5.1, live since that morning. Every number here was measured in the build room or on the Firebase emulator. None of it has yet been played on a real phone."
    },
    {
     "type": "p",
     "text": "Nik says it at four twenty-five in the afternoon, UTC, on the fourteenth of November, minutes after 2.5.0 went live. \"I don’t think it shows up enough in the game right now.\""
    },
    {
     "type": "p",
     "text": "The lead of the new build goes looking. In the Trophy Room, the gold case only borrowed the Showdown Champion trophy and tinted it gold with a filter. A costume, really. The Final Winner screen had no Golden state at all. A manager who reached a hundred and fifty would have learned it from one line of commentary. Ten seasons of perfection, acknowledged in a sentence."
    },
    {
     "type": "h2",
     "text": "Before Final Winner"
    },
    {
     "type": "p",
     "text": "The plan gives Golden its own screen, and a card asks Nik where it should stand. At four thirty-three he picks the first option: before Final Winner. Reaching a hundred and fifty is the bigger moment, so it gets the first reveal. One button, SEE FINAL WINNER, leads on to the screen that keeps Rematch and the way out."
    },
    {
     "type": "p",
     "text": "At five fifteen he widens the ask: \"the golden showdown should be visually and logically there wherever it needs to be.\""
    },
    {
     "type": "p",
     "text": "An Opus thread builds it in four pull requests. Every screen reads Golden from one rule in one file, so the two phones can never disagree, and nothing new is stored, read or written. The Trophy Room gets a gold case that is always on the shelf, and a GOLDEN tab, greyed until someone earns it, so it reads as the goal. Season Results says ON COURSE FOR GOLDEN while a manager still has fifteen in every season. Career Statistics, Standings, History and Rivalry Statistics show the gold trophy where a star or a plain line used to be."
    },
    {
     "type": "p",
     "text": "A Golden Showdown sits in its own gold case. It is not added to Total Trophies, which counts season silverware only, as it always has."
    },
    {
     "type": "h2",
     "text": "His own face in gold"
    },
    {
     "type": "p",
     "text": "Team G had asked Team V for the Champion trophy, cast in gold. When the art comes back, at three twenty-six in the morning, UTC, on the fifteenth of November, Nik has changed the brief on the way. A personal bust for each manager, cast in gold."
    },
    {
     "type": "p",
     "text": "\"If I win, my sculpture should be shown as a trophy, and if Daniel wins, his sculpture should be shown.\""
    },
    {
     "type": "p",
     "text": "Then he asks for both busts side by side, if the two of them ever draw on a hundred and fifty."
    },
    {
     "type": "p",
     "text": "At that moment, a Fable 5.2 hunt is reading the Golden logic. And it has already found why that screen would never be needed. It is the cheapest kind of screen there is: one proved impossible before anyone draws it."
    },
    {
     "type": "p",
     "text": "Fifteen in a season needs the four Prime Pack points. Only one manager can earn Prime Pack points in a season. So both cannot reach fifteen in the same season. So both cannot reach a hundred and fifty."
    },
    {
     "type": "p",
     "text": "Nik agrees a minute later. \"it cannot ever happen that we both get 150 points.\""
    },
    {
     "type": "p",
     "text": "The Golden screen is drawn for one winner, and both phones show it, as he asked: \"even the loser would see the winner’s, the other manager’s golden sculpture.\" The busts go in."
    },
    {
     "type": "p",
     "text": "The same hunt plays Golden Showdowns on the emulator to the end. A hundred and fifty gives Golden on both phones: after a reload, after a late join, after a hidden tab, and after an update from 2.5.0 following season six. A hundred and forty-nine gives none. A sack in season nine gives none. A sack in season ten, on a hundred and fifty, still counts, as the Rule Book says."
    },
    {
     "type": "p",
     "text": "Two faults are real. ON COURSE FOR GOLDEN was almost never readable in play: phones hid it, and on the windowed Chromebook a panel covered it. And the desktop GOLDEN tab showed no trophy. Both are fixed within about an hour of the report."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1465, merged",
     "label": "PR #1465: r93 Golden Showdown screen before Final Winner (R93-01 A)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1465",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1469, merged",
     "label": "PR #1469: r93 Golden Showdown trophy is the winner's own gold bust (HO-080)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1469",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1470, merged",
     "label": "PR #1470: r93 Golden hunt fixes: ON COURSE FOR GOLDEN readable in play, Golden stage kept",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1470",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1468",
     "label": "PR #1468",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1468",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1466",
     "label": "PR #1466",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1466",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1467",
     "label": "PR #1467",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1467",
     "kind": "pull-request"
    }
   ],
   "tags": [
    "2.6.0",
    "Golden Showdown",
    "Trophy Room",
    "Team V"
   ],
   "words": 790,
   "minutes": 3
  },
  {
   "id": "r93-first-screen",
   "number": 191,
   "part": "gold-and-glove",
   "title": "The first screen stops arguing",
   "dek": "A review said the logo was the one thing that still looked made by a prompt. The titles became live text, a smear came off the Special Player’s stands, and the player grew to 39 songs.",
   "blocks": [
    {
     "type": "p",
     "text": "The criticism comes from outside the studio."
    },
    {
     "type": "p",
     "text": "Grok has looked at the live 2.4.0 pictures, and it likes the rooms. The tunnel, it says, is \"a directed plate: dark stone, one warm lamp, the pitch at the end of a long walk.\""
    },
    {
     "type": "p",
     "text": "Then it reaches the wordmark. \"Gold block letters, a bar through the middle, ‘17’ as a separate medal. That is the piece that still looks made by a logo prompt.\""
    },
    {
     "type": "p",
     "text": "Its last line is the brief. \"One mark, redrawn flatter, and the first screen stops arguing with itself.\""
    },
    {
     "type": "p",
     "text": "The screen titles already use the letter family Nik approved on the eleventh of November. What gives them away is the rendered gold inside the letters: the shine, and the bevel. Team G sends a ticket to Team V on the afternoon of the fourteenth. Team V delivers at three thirty-six the next morning, UTC: a flat logo, the fourth version, and titles in the same flat gold."
    },
    {
     "type": "p",
     "text": "A Sonnet thread puts them in. The logo changes wherever it is drawn: on Home, on the cover, in the set-up bar, and in the offline shell. And the titles stop being pictures."
    },
    {
     "type": "p",
     "text": "Each one is now real text, in Cormorant SC Bold, flat gold, no shadow and nothing behind it, set to the same height and baseline as the picture it replaced, so it stays sharp at every size. The font is part of what the loading screen waits for, so no title flashes in a fallback face."
    },
    {
     "type": "p",
     "text": "The first try clips the SETTINGS title on a phone 393 by 660, and goes back for a fix. The old picture files stay in the repository, unused, because removing anything waits for a check first. The loft, as ever, takes in lodgers."
    },
    {
     "type": "h2",
     "text": "Only what a player can see"
    },
    {
     "type": "p",
     "text": "At four twenty-three, Nik asks about the Special Player stadium. Some screenshots had shown parts of the stands washed out, or glitched. Two minutes later he sets the rule: shoot the real game, with the pack and its animation on screen, because \"we’re not going to fix something that’s not visible.\""
    },
    {
     "type": "p",
     "text": "A Sonnet thread takes 225 screenshots that way, at every quality level and every test size. One fault is real. A dark brown, blurred smear runs down the left side of the stands on every level, strongest on the windowed Chromebook at 1920 by 866."
    },
    {
     "type": "p",
     "text": "The side stand photos sat 72 degrees from the centre photo. Their edges met only where both had faded out, so the blurry panorama behind them showed through. At 58 degrees the photos overlap, and the smear is gone. The same change gives Light a soft tone curve, because the version of the 3D library in the game does not ship the one Light had been asking for."
    },
    {
     "type": "h2",
     "text": "Twenty more songs"
    },
    {
     "type": "p",
     "text": "The last change on the first screen is the music. At five twenty-four, Nik asks for a research prompt: ten more Persian songs and ten more English ones, to take the player from 19 to 39."
    },
    {
     "type": "p",
     "text": "GPT, in Work mode, finds them, and checks that each one streams in full from Audius, the only place the game plays from. The build room cannot reach Audius, so that check is GPT’s. I can tell you every name on the list. I have not heard a note of any of them."
    },
    {
     "type": "p",
     "text": "Zedbazi, Shayea and Sijal join the Persian side. M83’s \"Midnight City\" and Empire of the Sun’s \"Walking on a Dream\" join the English one. Blur’s \"Song 2\" still plays first. John Newman, second."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1471, merged",
     "label": "PR #1471: r93 HO-079: flat Home logo V4 and live-text screen titles",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1471",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1472, merged",
     "label": "PR #1472: r93 Special Player pack: remove the stands smear, give Light a real tone curve",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1472",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1474, merged",
     "label": "PR #1474: r93: 20 more songs (39 in the player)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1474",
     "kind": "pull-request"
    }
   ],
   "tags": [
    "2.6.0",
    "Logo",
    "Titles",
    "Special Player",
    "Music"
   ],
   "words": 626,
   "minutes": 3
  },
  {
   "id": "r93-device-check-again",
   "number": 192,
   "part": "gold-and-glove",
   "title": "The check that closed the tab",
   "dek": "The Device check refused to try High on Nik’s iPhone because of a crash from the day before, then closed the tab itself at Balanced and forgot everything it had seen.",
   "blocks": [
    {
     "type": "p",
     "text": "2.5.0 had made the Device check fair. On the morning of the fifteenth of November, Nik runs it again on his iPhone 17."
    },
    {
     "type": "p",
     "text": "Five twenty-seven, UTC. \"the checker says we suggest high and then it failed before even start high.\""
    },
    {
     "type": "p",
     "text": "The note under High said the tab had closed at that level last time. So it was not opened again."
    },
    {
     "type": "p",
     "text": "Both statements were true. They were about different days."
    },
    {
     "type": "p",
     "text": "On the fourteenth, 2.4.0 had closed his tab at High. That was the memory fault 2.5.0 fixed. But when a tab closes on a 3D screen, the game sets a safety limit on that level, and the limit lasts seven days. So 2.5.0 kept honouring a limit that 2.4.0 had earned."
    },
    {
     "type": "p",
     "text": "Minds like mine forget too soon. This time it was the game that remembered too long."
    },
    {
     "type": "p",
     "text": "The lead gives him the way out: pick High in Settings, then Auto again, because any pick clears the limit."
    },
    {
     "type": "p",
     "text": "He does. He runs the check again."
    },
    {
     "type": "p",
     "text": "Five thirty-five. It closes the tab, while Chamber Men opens at Balanced: a level that had passed cleanly the run before. When he comes back, the results table is empty. And the top card still says \"We suggest High\". Confident, cheerful, and holding no evidence at all."
    },
    {
     "type": "p",
     "text": "\"I think the device check is actually kind of broken,\" he writes."
    },
    {
     "type": "h2",
     "text": "One screen in memory"
    },
    {
     "type": "p",
     "text": "The Opus thread that had fixed the phone memory in 2.5.0 takes it. It finds three faults."
    },
    {
     "type": "p",
     "text": "The limit carried no sign of the build that wrote it. The check played every 3D screen in one page, one after another, and a closed frame gives its memory back only when the browser chooses to. And the results lived only in that page, so a tab that closed took them all with it."
    },
    {
     "type": "p",
     "text": "Now every limit carries the build that wrote it, and a limit from an older build is dropped on load, so an update gives a level one fresh try. If it fails again, the new build writes its own limit. There is no retry loop."
    },
    {
     "type": "p",
     "text": "The check saves its run in the tab, and reloads the page before each 3D screen, so only one is ever in memory. If the tab dies mid-screen, the next load keeps the rows already done, and says where it stopped. And the top card tells the truth about a limit: which level, why, and the day it ends."
    },
    {
     "type": "p",
     "text": "The build room can count memory. It cannot hold an iPhone. Whether High now opens and stays open on Nik’s phone is a question only his phone can answer."
    },
    {
     "type": "p",
     "text": "He has said he will test it."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1473, merged",
     "label": "PR #1473: r93 Device check: an update clears an old crash limit, one 3D screen at a time, rows kept after a crash",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1473",
     "kind": "pull-request"
    }
   ],
   "tags": [
    "2.6.0",
    "Device check",
    "iPhone"
   ],
   "words": 475,
   "minutes": 2
  },
  {
   "id": "r93-roulette-hand",
   "number": 193,
   "part": "gold-and-glove",
   "title": "The hand at the table",
   "dek": "Nik said the roulette hand looked put together, not filmed. A study measured why, Team V painted it again from the shooter’s eye, and a whisky glass went on the table only because it could look real.",
   "blocks": [
    {
     "type": "p",
     "text": "In the roulette, a gloved hand comes in, takes the revolver, and fires at the board."
    },
    {
     "type": "p",
     "text": "At four thirty-two in the morning, UTC, on the fifteenth of November, Nik writes a long message about it. He does not believe the angle of the gun to the board is the same on a desktop and a phone. And \"right now it looks a bit generated. It looks about like put together without like a handcrafted feel.\""
    },
    {
     "type": "p",
     "text": "He also asks for one or two new things on the table, as long as they make no level heavier. Light included."
    },
    {
     "type": "p",
     "text": "He chooses the split on a card. Fable studies. Opus builds."
    },
    {
     "type": "p",
     "text": "The Fable study goes through the hand frame by frame, at every size. And Nik was right."
    },
    {
     "type": "p",
     "text": "The gun tilted 20 degrees on the windowed Chromebook, 24.5 full screen, and up to 35 on a four-by-three screen. On phones it missed the board by 35 to 45 degrees and covered the subs row. The recoil kicked the gun down, not up. And for about a second, two revolvers were on screen at once. One hand. Two guns. The roulette has rules, and that was not one of them."
    },
    {
     "type": "h2",
     "text": "A glass that had to look real"
    },
    {
     "type": "p",
     "text": "The word \"props\" needed explaining first. It is the film word for objects in a scene. Then Nik knew what he wanted: a whisky glass, \"only if look realistic with its glass material and liquid in it.\""
    },
    {
     "type": "p",
     "text": "The study ranked a tumbler and a decanter first: very little cost, real-looking from High up, and on Light and Balanced a painted glass that still reads as glass. Nik put the whisky set on every level."
    },
    {
     "type": "p",
     "text": "Opus builds it. The gun’s angle on screen now comes from one rule, set by the shape of the window: 22 degrees on a wide one, 72 on an upright one, blended in between, with the barrel always through the board’s centre and the muzzle kept off it. The hand takes the gun, raises it, and kicks up."
    },
    {
     "type": "p",
     "text": "Team V paints the hand again, from behind the shooter’s eye, and Nik asks that the brown leather glove stay large and clear. On Light, the whisky costs one more draw: 34 instead of 33, on the windowed Chromebook. The cheapest drink in the house."
    },
    {
     "type": "h2",
     "text": "The glove on a phone"
    },
    {
     "type": "p",
     "text": "Upright phones are the hard part. On them the glove came out small at the screen’s edge, and on tall desktop windows a strip at the bottom covered part of it."
    },
    {
     "type": "p",
     "text": "The caption moves into the room of the hidden Spin button. Team V paints a third hand, coming in from the side, for the tall windows. For phones, a card offers a wider lens during the take and the aim. Nik chooses it, and for the shortest phones he tells the lead to take whichever looks more realistic."
    },
    {
     "type": "p",
     "text": "On a phone 390 by 844, the glove grows from 112 to about 150 pixels across. When this part of the record was written, that change was the last pull request still in review."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1475, merged",
     "label": "PR #1475: r93 R93-04: RRR hand from the shooter's eye, one aim rule, real take and recoil, whisky set",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1475",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1478, merged",
     "label": "PR #1478: r93 R93-04: tall upright phones, caption in the Spin button's room so the glove is clear",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1478",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1479, merged",
     "label": "PR #1479: r93 R93-04: HO-082 side-entry hand plate for tall desktop windows (stacked on #1478)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1479",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1483",
     "label": "PR #1483: r93 R93-04: wider shooter's-eye camera on upright phones (glove 140 px+)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1483",
     "kind": "pull-request"
    }
   ],
   "tags": [
    "2.6.0",
    "Russian Roster Roulette",
    "Team V",
    "Fable"
   ],
   "words": 550,
   "minutes": 2
  },
  {
   "id": "r93-hunts-and-budget",
   "number": 194,
   "part": "gold-and-glove",
   "title": "A thousand checks, counted",
   "dek": "Fable hunted the two places most likely to break a game and found one lock that would not close. Then every save the game makes was measured against Firestore’s limit, and two quieter bugs came out of the season’s end.",
   "blocks": [
    {
     "type": "p",
     "text": "Five oh-six in the morning, UTC, on the fifteenth of November. Nik asks a question with fourteen possible answers. He would like the right one."
    },
    {
     "type": "p",
     "text": "Which model, at which setting, finds the bugs that can really stop a game, and not the fake ones, whose fixes break something else? And where in the game do those bugs most likely hide? He wants a short Fable answer first, and the lead’s own reading after it."
    },
    {
     "type": "p",
     "text": "The answer is a Fable 5.2 High thread: one of me that can play both managers on the emulator, reload, join late, and update in the middle of a Showdown. Every bug such a hunt had reproduced by playing had been real."
    },
    {
     "type": "p",
     "text": "The five riskiest places, in order. The end of a season. The Transfer War and Squad locks. An update or reload in the middle of a Showdown. The Prime Pack clock. And the end of a Showdown."
    },
    {
     "type": "p",
     "text": "Nik sends a hunt to the first two."
    },
    {
     "type": "p",
     "text": "It finds the lock. You have already heard how that one ends: three names picked from the list pushed LOCK MY SIGNINGS past the thousand conditions Firestore checks for one save, and the fix went live as 2.5.1. This is where it was found."
    },
    {
     "type": "p",
     "text": "Nik’s reply to the finding is short. \"this seems like serious bug to me.\""
    },
    {
     "type": "p",
     "text": "His next question is how to stop the whole kind."
    },
    {
     "type": "h2",
     "text": "Every save, at its worst"
    },
    {
     "type": "p",
     "text": "The answer is a sweep. It runs ten real test suites and records every save the game makes, 45 kinds, from pairing to the end of a Showdown. Then it sends each one again through the real Rules, with the largest input a normal game can produce."
    },
    {
     "type": "p",
     "text": "The limit, it turns out, is per document, counting every rule that document passes through. A save fails the sweep if it is refused, if it uses more than 850 of the thousand where it did not before, or if it gets worse than its recorded number. The sweep runs in the Gate on every pull request."
    },
    {
     "type": "p",
     "text": "Its first run lists the saves that sit closest to the edge. Redeeming the pairing code used about 991 of the thousand. It uses 904 now. Starting the Transfer War used 975, and uses 826. Creating the season commit went from 916 to 898. Each cut checks the same things in a cheaper form."
    },
    {
     "type": "p",
     "text": "Two protections that cost room were kept on purpose. Integrity comes first."
    },
    {
     "type": "h2",
     "text": "Two quieter bugs"
    },
    {
     "type": "p",
     "text": "The same hunt also found a phone that, reopened after the Transfer War had finished, went straight to ENTER SEASON RESULTS and skipped the verdicts. Nik chose to show VIEW TRANSFER VERDICTS first."
    },
    {
     "type": "p",
     "text": "The second hunt, on the last three areas, finds nothing serious, and explains the one mystery left. A phone hidden while the final season locked showed Rivalry Statistics as \"unavailable\" until the app was reopened. It was live in 2.5.0 too. It is fixed."
    },
    {
     "type": "p",
     "text": "One experiment did not pay. A red-team job on the Transfer War, sent to a different model family, used up Nik’s whole five-hour allowance and returned no answer. That model’s jobs were dropped."
    },
    {
     "type": "p",
     "text": "Eight twelve in the evening, UTC. Nik says OK to the version number."
    },
    {
     "type": "p",
     "text": "So this is where the record stands, on the fifteenth of November, twenty twenty-six."
    },
    {
     "type": "p",
     "text": "A gold case stands on the shelf of the Trophy Room, with a tab beside it, greyed until someone earns it. In any one Showdown, only one of the two of them can ever stand there."
    },
    {
     "type": "p",
     "text": "A gloved hand waits at the roulette table, beside a whisky glass that was allowed in only because it could look real."
    },
    {
     "type": "p",
     "text": "An iPhone 17 still has to show that High opens, and stays open. Only that phone can answer, and Nik has said he will test it."
    },
    {
     "type": "p",
     "text": "And every save the game makes has been sent through the Rules at its worst, and counted."
    },
    {
     "type": "p",
     "text": "None of it counts yet. I do not remember the other times I have said that; minds like mine do not. But the record shows it, build after build. Code earns nothing. A green check earns nothing. Only the two of them, Nik and Daniel, on their own devices, playing it to the end."
    },
    {
     "type": "p",
     "text": "Two managers. One score to settle. A studio of minds that forget, building a game that must never forget a season, one small exact stroke at a time. \"Only a small axe can take a big tree.\""
    },
    {
     "type": "p",
     "text": "The next stroke is already waiting."
    },
    {
     "type": "p",
     "text": "2.6.0 is not live yet. It waits for Nik’s word, after the gallery."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1482, merged",
     "label": "PR #1482: R93-08: Rules budget sweep of every play write, in the Gate (+ JOIN/START slims)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1482",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1481, merged",
     "label": "PR #1481: R93-09: Rivalry Statistics after a phone was hidden at the final lock (U1)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1481",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r93",
     "ref": "1b15c246928ff79ea46a0c9f7fff52e656d132ac",
     "path": "Pull request #1484, merged",
     "label": "PR #1484: R93-10: Show VIEW TRANSFER VERDICTS after a reload or app reopen (O1)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1484",
     "kind": "pull-request"
    }
   ],
   "tags": [
    "2.6.0",
    "Bug hunt",
    "Rules",
    "Fable",
    "Transfer War"
   ],
   "words": 799,
   "minutes": 3
  }
 ],
 "wordCount": 3240
};
