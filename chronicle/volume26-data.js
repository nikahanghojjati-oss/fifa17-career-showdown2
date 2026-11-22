/* THE CHRONICLE · Volume 26 (Team G, r98 / 2.11.0): Nik's League Roulette, asked for eleven minutes after 2.10.0 went live;
   the board shows the shared draw and never decides it (a pure plan from the draw and a shared seed); Nik's option A, each
   manager drops his own two balls (the drops counter, three writes, one Rules check); the board on the counter, reload and late
   join, the flat wheel kept as the no-3D fallback; three look rounds (LEAGUE ROULETTE, black metal and gold, a sharp board,
   Team V's HO-097 rooms); the Fable FJ12/FJ13 findings and the both-phones-first release step; 2.11.0 going live (dateless
   until it ships). Written 22 November 2026 from gameplay/r98. Loaded by volume26.js. Builder:
   gameplay/r98/threads/bump/v26.py (project files), or edit this JSON directly. */
window.CHRONICLE_VOLUME26={
 "capturedAt": "2026-11-22T23:00:00Z",
 "part": {
  "id": "four-balls",
  "title": "Four Balls, One League",
  "dek": "The twentieth to the twenty-second of November. Eleven minutes after 2.10.0 goes live, Nik asks for a casino roulette to pick the league. 2.11.0 builds it: four balls, two each, taking turns, until the board is one colour.",
  "image": "legacy.webp"
 },
 "chapters": [
  {
   "id": "r98-eleven-minutes",
   "number": 215,
   "part": "four-balls",
   "title": "Eleven minutes",
   "dek": "2.10.0 goes live at thirteen minutes past three in Boston. At twenty-four past, Nik asks for the league wheel to become a casino roulette.",
   "tags": [
    "2.11.0",
    "League Roulette",
    "Nik’s idea",
    "3D"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "2.10.0 went live on the twentieth of November at thirteen minutes past three in the afternoon, Boston time. Eleven minutes later Nik had the next idea, and it was not a fix."
    },
    {
     "type": "p",
     "text": "For a long time the league had been picked by a flat wheel. It turned, it slowed, and it stopped on one of five leagues. It worked, and nobody had complained about it. But every other step of a Showdown had grown a scene of its own since then. Chamber Men had its stadium, the Roulette its table, the Ball Game its footballs. The league, which decides everything after it, still came from a drawing."
    },
    {
     "type": "p",
     "text": "Nik’s message asked for a premium round board cut into five even sections, one for each league, with its name, its mark and its colour. Daniel and Nik would each have two balls. A ball drops, spins, and settles in a hole in one league’s section. That league is out. Its section splits in two, and each half joins the league beside it. Ball by ball the board loses its colours, until it is one colour and one league."
    },
    {
     "type": "p",
     "text": "A minute later came a second message, to make sure nobody built the wrong thing. It had to be a real casino roulette: a bowl, a spinning wheel head, a ball track, pockets. The balls had to look like real roulette balls, small and glossy white. Launched round the track, they slow, fall, bounce and drop into a pocket."
    },
    {
     "type": "p",
     "text": "Five leagues and four balls leave exactly one league. That made the arithmetic easy and the engineering strict. The league a Showdown is played in was already decided by the shared draw, the one both phones agree on and the Rules check. A beautiful wheel that could disagree with it would be worse than the flat one."
    },
    {
     "type": "p",
     "text": "So the roulette was built to show, never to decide. The draw still picks the league. The board then works out, from the draw’s answer and a seed both phones share, which leagues go out, in which order, and into which pocket each ball falls. It is a pure function: the same answer on every phone, after every reload. It was checked against five thousand seeds for each of the five leagues. The ball always ends in the right league’s run, and never on an edge pocket where a viewer could argue about it."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r98",
     "ref": "10de376012be32d978e510d2927e3c31c08a1606",
     "path": "Pull request #1563",
     "label": "PR #1563: 3D League Roulette on the live Select League screen",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1563",
     "kind": "pull-request"
    }
   ],
   "words": 396,
   "minutes": 2
  },
  {
   "id": "r98-whose-ball",
   "number": 216,
   "part": "four-balls",
   "title": "Whose ball",
   "dek": "Two ways to drop four balls. Nik picks the one that costs three writes and one small change to the Rules, so that each manager drops his own.",
   "tags": [
    "2.11.0",
    "League Roulette",
    "Rules",
    "Nik’s choice"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "Before any of it was wired in, there was a question only Nik could answer. Option A: each manager presses DROP on his own phone for his own balls, taking turns, while both phones watch. Option B: Daniel starts it, and the four balls fall one after another by themselves, the same show on both phones, with no new writes at all."
    },
    {
     "type": "p",
     "text": "B was cheaper. A was a game. At four minutes past five that afternoon, Boston time, Nik picked A."
    },
    {
     "type": "p",
     "text": "A meant the shared setup had to learn about balls. It learned with one small counter, drops, on the setup ledger of a Showdown opened for the roulette. It is 0 when the setup opens. Daniel’s first ball is the league draw itself, so the step that commits the league sets it to 1. Balls two, three and four are plain one-field writes. Nik drops the second, Daniel the third, Nik the fourth. The Ball Game waits for four."
    },
    {
     "type": "p",
     "text": "The counter is not an input to the draw. One hundred and twenty frozen Showdowns were replayed with and without it, and every one landed on the same league, the same clubs and the same fingerprint. The balls change what the managers see and when. They never change where the Showdown is played."
    },
    {
     "type": "p",
     "text": "A double tap had to be harmless, and so did a retry on a slow connection. A phone may drop a ball only when the ledger it holds says the ball is its own, now. A second tap sends the same write, the Rules refuse it, and one read sees that the ball has already landed. The wrong manager, or a ball out of turn, is turned away by name before anything is written."
    },
    {
     "type": "p",
     "text": "The Rules took one more check, and the studio remembers what Rules changes can cost. The first form read the counter on both sides of every step. It was correct, and it was too expensive: the second confirm came to 857 expressions against a bar of 850. A second form compares the whole ledger once, and that came to 839. A ball on its own costs about 556. The compile probe, the instrument built after 2.1.0’s long night of refused deploys, ran it three times, between 1.4 and 2.0 seconds each."
    },
    {
     "type": "p",
     "text": "The cost in play is three writes per Showdown and no new reads in the code. Nik wrote “OK rules r98”, and the change merged into the release branch. It reaches the live game only when 2.11.0 does."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r98",
     "ref": "4249e45755754405c41656b2b8e5c67b171eb2e8",
     "path": "Pull request #1562",
     "label": "PR #1562: League Roulette protocol and Rules (each manager drops his own two balls)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1562",
     "kind": "pull-request"
    }
   ],
   "words": 416,
   "minutes": 2
  },
  {
   "id": "r98-on-the-counter",
   "number": 217,
   "part": "four-balls",
   "title": "On the counter",
   "dek": "The board goes where the flat wheel stood. A ball dropped while you were away is already in its pocket when you come back, and the flat wheel stays for the phones that cannot draw 3D.",
   "tags": [
    "2.11.0",
    "League Roulette",
    "Reload",
    "Fallback"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "The roulette stands where the flat wheel stood, on the counter of the box room, between the two men. The words around it are short: “Five leagues. Four balls. One league stays.” The button reads DROP BALL for the manager whose ball it is, and WAITING FOR DANIEL or WAITING FOR NIK for the other. When a ball settles, the screen names the league that is out. After the fourth, it says CONTINUE TO BALL GAME and goes on by itself."
    },
    {
     "type": "p",
     "text": "The hard part was coming back. A phone can reload, a manager can join late, or come back from Home in the middle of the drops. The board waits for the first word from the shared setup before it draws anything. A ball the ledger gains while the screen is up rolls. A ball dropped before the screen opened is shown in its pocket at once, and it never rolls again. A finished roulette never plays twice."
    },
    {
     "type": "p",
     "text": "The Reus Gate holds the screen behind the loading picture until the board has drawn its first frame, with the same fifteen-second cap as every other screen. Nobody sees a half-built wheel."
    },
    {
     "type": "p",
     "text": "The old flat wheel was not deleted. Before anything goes, the studio’s rule is to write down what would be lost. The list had one real entry: a phone that cannot draw 3D would have no wheel at all. So the flat wheel stays, as the fallback when WebGL is missing or the board fails. It still lands on the same league, because it always did."
    },
    {
     "type": "p",
     "text": "The reviewer found one loop worth fixing before merge: once the 3D board was on, the screen and the board could keep waking each other. That was cut. A second note asked that Reduce Motion should mean a board that stands still and simply shows the result, and now it does."
    },
    {
     "type": "p",
     "text": "In two-manager runs against the emulators, on the same container and side by side with 2.10.0, the roulette added three writes per Showdown, about seven reads that the other phone’s existing listener takes, and thirty-three billed reads, once, in the first season."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r98",
     "ref": "10de376012be32d978e510d2927e3c31c08a1606",
     "path": "Pull request #1563",
     "label": "PR #1563: 3D League Roulette on the live Select League screen",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1563",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r98",
     "ref": "4249e45755754405c41656b2b8e5c67b171eb2e8",
     "path": "Pull request #1562",
     "label": "PR #1562: League Roulette protocol and Rules (each manager drops his own two balls)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1562",
     "kind": "pull-request"
    }
   ],
   "words": 349,
   "minutes": 1
  },
  {
   "id": "r98-black-metal-and-gold",
   "number": 218,
   "part": "four-balls",
   "title": "Black metal and gold",
   "dek": "Three rounds of looks over two evenings: a new name, a sharper board, real gold, and rooms Team V painted without the men.",
   "tags": [
    "2.11.0",
    "League Roulette",
    "Look",
    "Team V"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "Nik looked at the first board that evening and sent his notes over eight minutes. The room should be the handcrafted box room, not the old stadium plate. The board must stay clear of Daniel’s finger. The ball was too small and lagged. The outer ring was dull. Each note was fixed in the lab before the board went near the live game."
    },
    {
     "type": "p",
     "text": "The second round started with a name. The screen title had said SELECT LEAGUE since the beginning. Nik made it LEAGUE ROULETTE. The board became black metal and gold on black marble, with flat league colours and a fine engraved pattern, no shadows, and larger names and marks."
    },
    {
     "type": "p",
     "text": "Then he wrote that it looked pixelated, especially on the phone. The cause was simple to find. The board was drawn at the quality level’s own pixel size, one to one on Light, and then stretched to the screen’s two or three. The quality system now gives this one screen its device’s full sharpness, up to three times, and still steps it down if the device is slow. The bowl and wheel gained more sides, and the gold painted on the board became real metal, with a clean bright highlight instead of a brown one."
    },
    {
     "type": "p",
     "text": "Sharpness costs memory, and the studio had learned on the iPhone in 2.10.0 to count all of it. The phone budget test caught the first try at 409 megabytes at High, well over the 300 a phone screen may use. Most of that turned out to be the lab page rebuilding the board over and over, which the real game never does. With that out, phones keep the full 2048-pixel board: 101.8 megabytes at High and at Extra, well under the line."
    },
    {
     "type": "p",
     "text": "The board wanted to be bigger, and the two men were in the way. Team V painted the rooms again for this screen. On the desktop, the box room with the men standing further apart. On phones and tablets, the same room with no men at all, upright, tall and sideways, so the board can fill the width. Nik approved them, and the game uses them only while the 3D board is on. The flat wheel keeps its old rooms."
    },
    {
     "type": "p",
     "text": "Nik picked one more change from a card: move the SPIN TO PICK THE LEAGUE line up, under the title. Against 2.10.0 the board is thirty per cent larger on the windowed Chromebook and thirty-one on full screen, clear of both men, with both buttons in reach."
    },
    {
     "type": "p",
     "text": "Codex had run out of its allowance by then. Under Nik’s rule from that day, a Claude review at high effort read the exact head instead, twice. The first found six things worth fixing, and they were fixed. The last look round merged into the release branch at half past midnight, Boston time, on the twenty-second."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r98",
     "ref": "3e7169323d5e1294dce9c6785eab91cef6ac11b4",
     "path": "Pull request #1564",
     "label": "PR #1564: League Roulette look (name, sharp board, gold, Team V rooms, bigger board)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1564",
     "kind": "pull-request"
    }
   ],
   "words": 471,
   "minutes": 2
  },
  {
   "id": "r98-live",
   "number": 219,
   "part": "four-balls",
   "title": "Both phones first",
   "dek": "The red team reads the new screen and Career Start. One finding needs no code at all, only a line in the release note. And then 2.11.0 goes live.",
   "tags": [
    "2.11.0",
    "Release",
    "Fable",
    "Rules"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "While the look rounds ran, two Fable red-team jobs read the new code. One was aimed at the roulette, the other at Career Start. Each finding was checked against the code by a separate thread before anything was changed."
    },
    {
     "type": "p",
     "text": "Career Start had three real faults. Nothing reloads the page between two Showdowns, so the second one could first draw the first one’s clubs, with BOTH MANAGERS STARTED and an enabled CONTINUE, until its own read arrived. A tap there would have been refused further on, so the score was never at risk, but the screen was wrong. Now a view from another Showdown is forgotten at once, and the fifteen-second check starts again."
    },
    {
     "type": "p",
     "text": "The second fault was a false alarm. Coming back to a Showdown through CONTINUE CAREER, a long shootout and the roulette could use up Career Start’s two minutes, and the Squad Sheet or the Prime Pack would be told that Career Start took too long. The limit now waits for those screens too. The third fault was cost: each check while waiting re-read a setup that cannot change once it is confirmed. The check is lighter now, five reads fewer each time on each phone."
    },
    {
     "type": "p",
     "text": "The finding that mattered most needed no code. If Daniel’s phone is on the new version and Nik’s is still on 2.10.0, the old phone does not know the new counter. It refuses the roulette’s setup and stops at Select League. Nothing is lost, and updating the phone clears it. But updates only happen when a manager opens Home and accepts one, so it could happen on release day."
    },
    {
     "type": "p",
     "text": "So the release note carries a step, before anything else. Both phones show v2.11.0 in the footer before the first Showdown. Then both managers open Home once, and Nik runs the Device check again on the iPhone and the Chromebook."
    },
    {
     "type": "p",
     "text": "This release changes the Rules, which 2.9.0 and 2.10.0 did not. The counter and its one check deploy when 2.11.0 merges into main, and the composed Rules were compiled three times on the release head before Nik was asked for the merge."
    },
    {
     "type": "p",
     "text": "None of it is physical proof. The score the game has earned was earned on an earlier build, and these pages do not add to it. The four balls have only fallen on test phones so far."
    },
    {
     "type": "p",
     "text": "Then Nik gives the word, and 2.11.0 goes live."
    }
   ],
   "sources": [
    {
     "branch": "claude-gameplay/r98-bump",
     "ref": "ac13dedb0a55bf099bf7e3b09e4753df86e1dbc1",
     "path": "Pull request #1566",
     "label": "PR #1566: the 2.11.0 version bump, release record and Volume 26",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1566",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r98",
     "ref": "f35bfd73f0f68092f2870bda456fc708fd843c7b",
     "path": "Pull request #1565",
     "label": "PR #1565: FJ12: Career Start forgets an earlier Showdown, waits on Squad Sheet and Prime Pack, lighter 15 s check",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1565",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r98",
     "ref": "4249e45755754405c41656b2b8e5c67b171eb2e8",
     "path": "Pull request #1562",
     "label": "PR #1562: League Roulette protocol and Rules (each manager drops his own two balls)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1562",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r98",
     "ref": "10de376012be32d978e510d2927e3c31c08a1606",
     "path": "Pull request #1563",
     "label": "PR #1563: 3D League Roulette on the live Select League screen",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1563",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r98",
     "ref": "3e7169323d5e1294dce9c6785eab91cef6ac11b4",
     "path": "Pull request #1564",
     "label": "PR #1564: League Roulette look (name, sharp board, gold, Team V rooms, bigger board)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1564",
     "kind": "pull-request"
    }
   ],
   "words": 395,
   "minutes": 2
  }
 ],
 "wordCount": 2027
};
