/* THE CHRONICLE · Volume 21 (Team G, r93 / 2.6.0): the Golden Showdown screen and the winner’s gold bust, the flat logo and live-text titles,
   the Special Player stands, the Device check that closed the tab, the roulette hand filmed again with a whisky glass, and the bug hunts
   with the Rules budget sweep. Written from gameplay/r93 1b15c246. Loaded by volume21.js.
   RELEASE LINE: the last sentence of chapter 194 (“2.6.0 went live on 15 November 2026, on Nik’s word.”) was filled in by the 2.6.0
   release bump with the live date. */
window.CHRONICLE_VOLUME21={
 "capturedAt": "2026-11-15T20:30:00Z",
 "part": {
  "id": "gold-and-glove",
  "title": "The gold and the glove",
  "dek": "14 and 15 November 2026: 2.5.0 is live; a Golden Showdown gets its own moment and its own bust, the first screen is redrawn flat, the roulette hand is filmed again, and the bug hunts find one lock that would not close.",
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
     "type": "callout",
     "label": "Release boundary",
     "text": "Written on 15 November 2026 from gameplay/r93 (1b15c246), the branch that becomes 2.6.0. The live game is 2.5.1, which went live from main 23bdd439 that morning. Every number in this volume was measured in the build room or on the Firebase emulator. Nothing here is a physical acceptance."
    },
    {
     "type": "p",
     "text": "A Golden Showdown is the hardest thing the game can ask of a manager. Ten seasons, fifteen points in every one of them, a hundred and fifty in all. Fifteen is everything a season can give, the Prime Pack points included, and it has to happen ten times running. Until 2.6.0, reaching it changed almost nothing on screen."
    },
    {
     "type": "p",
     "text": "Nik said so at 16:25 UTC on 14 November, minutes after 2.5.0 went live: “I don’t think it shows up enough in the game right now.” The r93 lead went looking. In the Trophy Room the gold case only borrowed the Showdown Champion trophy and tinted it gold with a filter. The Final Winner screen had no Golden state at all. A manager who reached 150 would learn it from one line of commentary."
    },
    {
     "type": "h2",
     "text": "Before Final Winner"
    },
    {
     "type": "p",
     "text": "The plan gave Golden its own screen, and a card asked Nik where it should stand. He picked the first option at 16:33: before Final Winner. Reaching 150 is the bigger moment, so it gets the first reveal, and one button, SEE FINAL WINNER, leads on to the screen that keeps Rematch and the way out. At 17:15 he widened the ask: “the golden showdown should be visually and logically there wherever it needs to be.”"
    },
    {
     "type": "p",
     "text": "An Opus thread built it in four pull requests (#1465 to #1468). Every screen reads Golden from one rule in one file, so the two phones can never disagree, and nothing new is stored, read or written. The Trophy Room got a gold case that is always on the shelf and a GOLDEN tab, greyed until someone earns it, so it reads as the goal. Season Results says ON COURSE FOR GOLDEN while a manager still has fifteen in every season. Career Statistics, Standings, History and Rivalry Statistics show the gold trophy where a star or a plain line used to be. A Golden Showdown sits in its own gold case and is not added to Total Trophies, which counts season silverware only, as it always has."
    },
    {
     "type": "h2",
     "text": "His own face in gold"
    },
    {
     "type": "p",
     "text": "Team G had asked Team V for the Champion trophy cast in gold. When the art came back at 03:26 UTC on 15 November, Nik had changed the brief on the way: a personal bust for each manager, cast in gold. “If I win, my sculpture should be shown as a trophy, and if Daniel wins, his sculpture should be shown.”"
    },
    {
     "type": "p",
     "text": "He then asked for both busts side by side if the two of them ever drew on 150. A Fable 5.2 hunt was reading the Golden logic at that moment, and it had already found why that screen would never be needed. Fifteen in a season needs the four Prime Pack points, and only one manager can earn Prime Pack points in a season. Both cannot reach fifteen in the same season, so both cannot reach 150. Nik agreed a minute later: “it cannot ever happen that we both get 150 points.” The Golden screen was drawn for one winner, and both phones show it, as he asked: “even the loser would see the winner’s, the other manager’s golden sculpture.” The busts went in with #1469."
    },
    {
     "type": "p",
     "text": "The same hunt played Golden Showdowns on the emulator to the end. 150 gave Golden on both phones, after a reload, a late join, a hidden tab and an update from 2.5.0 after season 6. 149 gave none. A sack in season 9 gave none; a sack in season 10 on 150 still counted, as the Rule Book says. Two faults were real. ON COURSE FOR GOLDEN was almost never readable in play: phones hid it, and on the windowed Chromebook a panel covered it. The desktop GOLDEN tab showed no trophy. Both were fixed within about an hour of the report (#1469, #1470)."
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
    }
   ],
   "tags": [
    "2.6.0",
    "Golden Showdown",
    "Trophy Room",
    "Team V"
   ],
   "words": 725,
   "minutes": 4
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
     "text": "The criticism came from outside the studio. Grok had looked at the live 2.4.0 pictures and liked the rooms: the tunnel was “a directed plate: dark stone, one warm lamp, the pitch at the end of a long walk.” Then it reached the wordmark. “Gold block letters, a bar through the middle, ‘17’ as a separate medal. That is the piece that still looks made by a logo prompt.” Its last line was the brief: “One mark, redrawn flatter, and the first screen stops arguing with itself.”"
    },
    {
     "type": "p",
     "text": "The screen titles already used the letter family Nik had approved on 11 November. What gave them away was the rendered gold inside the letters, the shine and the bevel. Team G sent ticket HO-079 to Team V on the afternoon of 14 November. Team V delivered at 03:36 UTC the next morning: a flat logo, the fourth version, and titles in the same flat gold."
    },
    {
     "type": "p",
     "text": "A Sonnet thread put them in (#1471). The logo changed wherever it was drawn, on Home, on the cover, in the set-up bar and in the offline shell. The titles stopped being pictures. Each one is now real text in Cormorant SC Bold, flat gold #C9A45C, no shadow and nothing behind it, set to the same height and baseline as the picture it replaced, so it stays sharp at every size. The font is part of what the loading screen waits for, so no title flashes in a fallback face. The first try clipped the SETTINGS title on a 393x660 phone and went back for a fix. The old picture files stayed in the repository, unused, because removing anything waits for a check first."
    },
    {
     "type": "h2",
     "text": "Only what a player can see"
    },
    {
     "type": "p",
     "text": "At 04:23 Nik asked about the Special Player stadium. Some screenshots had shown parts of the stands washed out or glitched. He set the rule two minutes later: shoot the real game with the pack and its animation on screen, because “we’re not going to fix something that’s not visible.”"
    },
    {
     "type": "p",
     "text": "A Sonnet thread took 225 screenshots that way, at every quality level and every test size. One fault was real. A dark brown blurred smear ran down the left side of the stands on every level, strongest on the windowed Chromebook at 1920x866. The side stand photos sat 72 degrees from the centre photo, and their edges met only where both had faded out, so the blurry panorama behind them showed through. At 58 degrees the photos overlap and the smear is gone (#1472). The same pull request gave Light a soft tone curve, because the three.js build in the game does not ship the one Light had been asking for."
    },
    {
     "type": "h2",
     "text": "Twenty more songs"
    },
    {
     "type": "p",
     "text": "The last change on the first screen was the music. Nik asked at 05:24 for a research prompt: ten more Persian songs and ten more English ones, to take the player from 19 to 39. GPT Work mode found them and checked that each one streams in full from Audius, the only place the game plays from. The build room cannot reach Audius, so that check is GPT’s. Zedbazi, Shayea and Sijal joined the Persian side; M83’s “Midnight City” and Empire of the Sun’s “Walking on a Dream” joined the English one (#1474). Blur’s “Song 2” still plays first, and John Newman second."
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
   "words": 591,
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
     "text": "2.5.0 had made the Device check fair. On the morning of 15 November Nik ran it again on his iPhone 17 and wrote at 05:27 UTC: “the checker says we suggest high and then it failed before even start high.” The note under High said the tab had closed at that level last time, so it was not opened again."
    },
    {
     "type": "p",
     "text": "Both statements were true, and they were about different days. On 14 November, 2.4.0 had closed his tab at High. That was the memory fault 2.5.0 fixed. When a tab closes on a 3D screen the game sets a safety limit on that level, and the limit lasts seven days. 2.5.0 kept honouring a limit that 2.4.0 had earned. The lead gave him the way out: pick High in Settings, then Auto again, because any pick clears the limit."
    },
    {
     "type": "p",
     "text": "He did, and ran the check again. At 05:35 it closed the tab while Chamber Men opened at Balanced, a level that had passed cleanly the run before. When he came back the results table was empty, and the top card still said “We suggest High”. “I think the device check is actually kind of broken,” he wrote."
    },
    {
     "type": "h2",
     "text": "One screen in memory"
    },
    {
     "type": "p",
     "text": "The Opus thread that had fixed the phone memory in 2.5.0 took it (#1473). It found three faults. The limit carried no sign of the build that wrote it. The check played every 3D screen in one page, one after another, and a closed frame gives its memory back only when the browser chooses to. And the results lived only in that page, so a tab that closed took them all with it."
    },
    {
     "type": "p",
     "text": "Now every limit carries the build that wrote it, and a limit from an older build is dropped on load, so an update gives a level one fresh try. If it fails again, the new build writes its own limit, and there is no retry loop. The check saves its run in the tab and reloads the page before each 3D screen, so only one is ever in memory. If the tab dies mid-screen, the next load keeps the rows already done and says where it stopped. The top card tells the truth about a limit: which level, why, and the day it ends."
    },
    {
     "type": "p",
     "text": "The build room can count memory. It cannot hold an iPhone. Whether High now opens and stays open on Nik’s phone is a question only his phone can answer, and he has said he will test it."
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
   "words": 452,
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
     "text": "In the roulette a gloved hand comes in, takes the revolver and fires at the board. At 04:32 UTC on 15 November Nik wrote a long message about it. He did not believe the angle of the gun to the board was the same on a desktop and a phone, and “right now it looks a bit generated. It looks about like put together without like a handcrafted feel.” He also asked for one or two new things on the table, as long as they made no level heavier, Light included."
    },
    {
     "type": "p",
     "text": "He chose the split on a card: Fable studies, Opus builds. The Fable study went through the hand frame by frame at every size, and Nik was right. The gun tilted 20 degrees on the windowed Chromebook, 24.5 full screen and up to 35 on a 4:3 screen. On phones it missed the board by 35 to 45 degrees and covered the subs row. The recoil kicked the gun down, not up. For about a second, two revolvers were on screen at once."
    },
    {
     "type": "h2",
     "text": "A glass that had to look real"
    },
    {
     "type": "p",
     "text": "The word “props” needed explaining first; it is the film word for objects in a scene. Then Nik knew what he wanted: a whisky glass, “only if look realistic with its glass material and liquid in it.” The study ranked a tumbler and a decanter first: very little cost, real-looking from High up, and a painted glass on Light and Balanced that still reads as glass. Nik put the whisky set on every level."
    },
    {
     "type": "p",
     "text": "Opus built it (#1475). The gun’s angle on screen now comes from one rule, set by the shape of the window: 22 degrees on a wide one, 72 on an upright one, blended in between, with the barrel always through the board’s centre and the muzzle kept off it. The hand takes the gun, raises it and kicks up. Team V painted the hand again from behind the shooter’s eye (HO-081), and Nik asked that the brown leather glove stay large and clear. On Light the whisky costs one more draw: 34 instead of 33 on the windowed Chromebook."
    },
    {
     "type": "h2",
     "text": "The glove on a phone"
    },
    {
     "type": "p",
     "text": "Upright phones were the hard part. On them the glove came out small at the screen’s edge, and on tall desktop windows a strip at the bottom covered part of it. The caption moved into the room of the hidden Spin button (#1478). Team V painted a third hand, coming in from the side, for the tall windows (HO-082, #1479). For phones a card offered a wider lens during the take and the aim. Nik chose it, and for the shortest phones told the lead to take whichever looks more realistic. On a 390x844 phone the glove grew from 112 to about 150 pixels across (#1483); it was the last pull request still in review when this chapter was written."
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
   "words": 521,
   "minutes": 3
  },
  {
   "id": "r93-hunts-and-budget",
   "number": 194,
   "part": "gold-and-glove",
   "title": "A thousand checks, counted",
   "dek": "Fable hunted the two places most likely to break a game and found one lock that would not close. After the hotfix, every save the game makes was measured against Firestore’s limit, and two quieter bugs came out of the season’s end.",
   "blocks": [
    {
     "type": "p",
     "text": "At 05:06 UTC on 15 November Nik asked a question with fourteen possible answers: which model, at which setting, finds the bugs that can really stop a game, and not the fake ones whose fixes break something else? And where in the game do those bugs most likely hide? He wanted a short Fable answer first, and the lead’s own reading after it."
    },
    {
     "type": "p",
     "text": "The answer was a Fable 5.2 High thread that can play both managers on the emulator, reload, join late and update in the middle of a Showdown. Every bug such a hunt had reproduced by playing had been real. The five riskiest places, in order, were the end of a season, the Transfer War and Squad locks, an update or reload in the middle of a Showdown, the Prime Pack clock, and the end of a Showdown. Nik sent a hunt to the first two."
    },
    {
     "type": "p",
     "text": "It found the lock. Chapter 189 tells how three names picked from the list pushed LOCK MY SIGNINGS past the thousand conditions Firestore checks for one save, and how the fix went live as 2.5.1. Nik’s reply to the finding was short: “this seems like serious bug to me.” His next question was how to stop the whole kind."
    },
    {
     "type": "h2",
     "text": "Every save, at its worst"
    },
    {
     "type": "p",
     "text": "The answer is a sweep (#1482). It runs ten real test suites, records every save the game makes, 45 kinds from pairing to the end of a Showdown, and sends each again through the real Rules with the largest input a normal game can produce. The limit turned out to be per document, counting every rule that document passes through. A save fails the sweep if it is refused, if it uses more than 850 of the thousand where it did not before, or if it gets worse than its recorded number. The sweep runs in the Gate on every pull request."
    },
    {
     "type": "p",
     "text": "Its first run listed the saves that sat closest to the edge. Redeeming the pairing code used about 991; it uses 904 now. Starting the Transfer War used 975 and uses 826. Creating the season commit went from 916 to 898. Each cut checks the same things in a cheaper form. Two protections that cost room were kept on purpose, because integrity comes first."
    },
    {
     "type": "h2",
     "text": "Two quieter bugs"
    },
    {
     "type": "p",
     "text": "The same hunt also found a phone that, reopened after the Transfer War had finished, went straight to ENTER SEASON RESULTS and skipped the verdicts. Nik chose to show VIEW TRANSFER VERDICTS first (#1484). The second hunt, on the last three areas, found nothing serious and explained the one mystery left: a phone hidden while the final season locked showed Rivalry Statistics as “unavailable” until the app was reopened. It was live in 2.5.0 too, and it is fixed (#1481)."
    },
    {
     "type": "p",
     "text": "One experiment did not pay. A red-team job on the Transfer War, sent to a different model family, used up Nik’s whole five-hour allowance and returned no answer; that model’s jobs were dropped. Nik said OK to the version number at 20:12 UTC. 2.6.0 went live on 15 November 2026, on Nik’s word."
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
   "words": 563,
   "minutes": 3
  }
 ],
 "wordCount": 2852
};
