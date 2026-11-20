/* THE CHRONICLE · Volume 25 (Team G, r97 / 2.10.0): Nik's iPhone closes the Device check on the Roulette at High; the check
   keeps its run and stops only the screen that died; the Roulette's painted canvases held twice on a phone and freed after upload
   (pixel for pixel); Nik's option A, a crash holds only its own screen in play; the Roulette's words in the house typeface on
   every load; the Career Start heading kept and REFRESH reached by scrolling; the red team moved on; 2.10.0 going live (dateless
   until it ships). Written 20 November 2026 from gameplay/r97. Loaded by volume25.js. Builder: gameplay/r97/threads/bump/v25.py
   (project files), or edit this JSON directly. */
window.CHRONICLE_VOLUME25={
 "capturedAt": "2026-11-20T14:30:00Z",
 "part": {
  "id": "one-screen-at-a-time",
  "title": "One Screen at a Time",
  "dek": "The eighteenth to the twentieth of November. An iPhone closes the Device check on the Roulette, and 2.10.0 follows that one evening all the way down: the check goes on, the Roulette fits a phone, a crash holds only its own screen.",
  "image": "legacy.webp"
 },
 "chapters": [
  {
   "id": "r97-the-phone-that-closed",
   "number": 210,
   "part": "one-screen-at-a-time",
   "title": "The phone that closed",
   "dek": "2.9.0 is live by breakfast in Boston. Before lunch, Nik’s iPhone closes the Device check on the Roulette and never comes back to it.",
   "tags": [
    "2.10.0",
    "Device check",
    "iPhone",
    "Roulette"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "2.9.0 went live on the eighteenth of November at twenty-four minutes to eight in the morning, Boston time. It gave every 3D screen its own level. The light screens no longer had to wait for the heavy one. To get those levels, each device has to run the Device check once. The check plays each screen, steps it up one level at a time, and keeps the highest level that still runs smoothly."
    },
    {
     "type": "p",
     "text": "Nik ran it on his iPhone 17. A few hours later he wrote: \"Device check on iphone closes my screen on rrr on high and doesnt continue the check for rest of screens.\" The Roulette had reached High, the phone closed the page, and when Nik opened the check again it had forgotten everything."
    },
    {
     "type": "p",
     "text": "There were two faults, and the first was in the check itself. It kept its progress in the tab’s own short-term memory, the kind that lasts while a tab is open. When iOS closes the whole tab, or the app saved to the home screen, that memory goes with it. So the reopened check found no run, no rows and no hint of what had killed it."
    },
    {
     "type": "p",
     "text": "The second fault undid a promise 2.9.0 had just made. When a screen closes the tab, the game writes down one limit. The check then applied that limit to every screen. So after the Roulette died at High, the Special Player and the Ball Game were never tried at High either. One heavy screen was holding the light ones down again, the very thing 2.9.0 was meant to stop."
    },
    {
     "type": "p",
     "text": "The fix stays inside the check’s own page. The run is now kept with the game’s saved data for thirty minutes, stamped with the build. While a screen plays, the page sends a sign of life every five seconds. If a run’s tab is still alive, another tab leaves it alone. Once the sign of life stops, the next page picks the run up. Leaving the check on purpose, by Back or by switching away, clears the run at once. Only a page that really died leaves a screen open."
    },
    {
     "type": "p",
     "text": "A death now stops only the screen that was playing. The others go on climbing, each in a fresh page. The check says so as it goes: \"The tab closed while Russian Roulette was playing at High. Going on with the other screens.\""
    },
    {
     "type": "p",
     "text": "A test replays Nik’s run twice: once with the tab closed and reopened, once with the same tab reloaded. Against the 2.9.0 page it fails both ways. Against the new one it passes both."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r97",
     "ref": "69eca9f7fbeadffa923d794c27cb1b48176fe816",
     "path": "Pull request #1553",
     "label": "PR #1553: the Device check goes on after a screen closes the tab (iPhone, Roulette at High)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1553",
     "kind": "pull-request"
    }
   ],
   "words": 430,
   "minutes": 2
  },
  {
   "id": "r97-twice-in-memory",
   "number": 211,
   "part": "one-screen-at-a-time",
   "title": "Twice in memory",
   "dek": "Why the Roulette closed an iPhone at High: every painted picture was kept twice, and the test that guards the phone’s memory only counted one copy.",
   "tags": [
    "2.10.0",
    "Roulette",
    "Phone memory",
    "3D quality"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "Fixing the check did not explain why the Roulette had died. The answer was in how the scene gets its pictures. The scoreboards, the plates and the labels are painted first on ordinary 2D canvases, then uploaded to the graphics chip as textures. On a desktop that costs little. On a phone the chip and the page share one memory, so every painted picture was held twice: once on the chip and once as its canvas."
    },
    {
     "type": "p",
     "text": "The game already had a rule for this. Each 3D screen may use at most three hundred megabytes on a phone. But the test that checks the rule counted only what sat on the chip. Three of the Roulette’s canvases are 2048 pixels square. On the iPhone 17 profile at High, the chip held about 215 megabytes and the canvases another 128. That makes about 342 in all, well over the limit, and iOS closed the page."
    },
    {
     "type": "p",
     "text": "The fix lets go of what is never painted again. On a phone, once every texture is on the chip, a canvas is freed if nothing will ever draw on it again. The scoreboards are kept, because they change during play. At High that frees twenty-nine canvases, 76.4 megabytes. The Roulette now comes to 266.7 megabytes at High and 278.6 at Extra, both under the limit. Desktop is untouched."
    },
    {
     "type": "p",
     "text": "The easy answer would have been to shrink the three big canvases to 1024 pixels. That would change the picture, and in this studio a change to the picture goes to Nik first. So nothing was shrunk. Instead the new build was compared with the old one, pixel for pixel, at five moments: the spin, the aim, the shot, the result and the table after the turn. All five match exactly."
    },
    {
     "type": "p",
     "text": "There is one trade-off, and it is written down. A freed canvas cannot be uploaded again. On a phone that has freed its canvases, if the browser takes the graphics away and gives them back, the Roulette can no longer rebuild itself in place. It hands over to the game’s own result card, or to a reload."
    },
    {
     "type": "p",
     "text": "The lead asked for proof with two managers before merging. In emulator runs, with both phones and both managers, the graphics were taken away at the spin, the aim, the shot and the result. Each time, one error was logged, the result card took over, both phones showed the same card, and the season kept one record of the spin, not two."
    },
    {
     "type": "p",
     "text": "The memory test now counts the canvases too. A run that cannot count them fails."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r97",
     "ref": "e7055f7ffa0efaa1597ce3d2a744c62f1f17362e",
     "path": "Pull request #1554",
     "label": "PR #1554: Roulette frees its painted canvases on phones; the phone budget counts 2D canvases",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1554",
     "kind": "pull-request"
    }
   ],
   "words": 427,
   "minutes": 2
  },
  {
   "id": "r97-one-screen-at-a-time",
   "number": 212,
   "part": "one-screen-at-a-time",
   "title": "One screen at a time",
   "dek": "The check learned to hold only the screen that died. Nik is asked whether the game should do the same in play, and picks the answer on a card.",
   "tags": [
    "2.10.0",
    "3D quality",
    "Nik’s choice",
    "Crash limit"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "After the first fix, the Device check held only the screen that had died. In play the old rule still stood. If a screen closed the tab, every 3D screen was held at a lower level for a week. That was the safe choice, but it was not what 2.9.0 had promised."
    },
    {
     "type": "p",
     "text": "It was a product question, so it went to Nik on a card. Option A: in play, too, hold only the screen that closed the tab. Option B: keep holding every screen, as today. On the afternoon of the eighteenth, Boston time, Nik picked A."
    },
    {
     "type": "p",
     "text": "Then the lead ran into a usage limit. The work stopped late on the eighteenth and picked up again just after midnight on the twentieth, UTC. Nothing was lost, because the state was in the branches and the notes, not in anyone’s head."
    },
    {
     "type": "p",
     "text": "In 2.10.0 the saved limit becomes a list of holds, one for each screen. A screen that closes the tab, or loses its picture, holds only itself, at the lowest level it reached. The others keep their own levels. A hold that names no screen still holds them all, as before."
    },
    {
     "type": "p",
     "text": "Each hold expires on its own. It ends after seven days. It ends after three clean plays of its own screen, unless the tab was closed, which counts as more serious. A new build drops it, and a level picked in Settings clears every hold. The 2D parts of the game and the Auto line in Settings follow only the holds that name no screen. One crash on the Roulette will not dim the whole clubhouse."
    },
    {
     "type": "p",
     "text": "The Device check reads the same holds. When the Roulette is held, the check names it, as in \"Russian Roulette draws Balanced\", instead of the vaguer \"the game draws Balanced\". Nothing else on any screen looks different."
    },
    {
     "type": "p",
     "text": "Nik had reopened the check on 2.9.0 in the meantime, and it told him what it could: \"recommend Balanced\". That was the right answer for a check that had lost its run. The real answer will come from running it again on 2.10.0."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r97",
     "ref": "34d3a38c83fd9b3ea7dba5c2f1cf95894209c741",
     "path": "Pull request #1555",
     "label": "PR #1555: hold only the 3D screen that closed the tab (option A)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1555",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r97",
     "ref": "69eca9f7fbeadffa923d794c27cb1b48176fe816",
     "path": "Pull request #1553",
     "label": "PR #1553: the Device check goes on after a screen closes the tab (iPhone, Roulette at High)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1553",
     "kind": "pull-request"
    }
   ],
   "words": 347,
   "minutes": 1
  },
  {
   "id": "r97-small-print",
   "number": 213,
   "part": "one-screen-at-a-time",
   "title": "Small print",
   "dek": "Two things nobody had reported: the Roulette’s painted words were in the wrong typeface on every load, and a small heading on Career Start hid itself.",
   "tags": [
    "2.10.0",
    "Roulette",
    "Career Start",
    "Look"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "Once the iPhone fixes had merged, the lead put a card in front of Nik. Should 2.10.0 go out now with the iPhone fixes only, or with two small fixes added, or should it wait for a red team as well? The recommendation was the two small fixes, then ship. Nik’s answer was one word, \"Ok\", and it was taken as the recommendation."
    },
    {
     "type": "p",
     "text": "The first small fix was about type. 2.8.0 had given the whole clubhouse one typeface, Instrument Sans. But the Roulette paints some words straight onto its pictures: FIRES HERE on the pointer, and the gold plate under each board. The brief assumed those words were in Arial only when the fonts arrived late. The job found something worse. They were painted while the script was still loading, before the typeface had even been asked for, and they were never painted again. So they were in Arial on every load."
    },
    {
     "type": "p",
     "text": "Now a word painted without its typeface is remembered, and painted once more when the typeface arrives. That happens either before the pictures are uploaded or, if the font is very late, during play. The start waits up to fifteen seconds for the fonts, behind the loading screen, and tells the game every two seconds that it is still alive. If a font file fails, the scene still starts. In a run with the fonts held back six seconds, the labels were Arial before and Instrument Sans Narrow after."
    },
    {
     "type": "p",
     "text": "The second fix was on Career Start. On small phones with Special Player lines, the panel shrinks step by step to fit. At the tightest step it hid its small heading, START YOUR FIFA 17 CAREER. The house rule says a needed element is never hidden, so the heading now stays."
    },
    {
     "type": "p",
     "text": "Showing it made the panel taller than the screen on some phones, and that exposed an older fault. The panel’s growth rule assumed the page would scroll, but on an upright phone the screen clips at its own height. At 375 by 553 pixels this was already true before the fix: the REFRESH button sat below the fold and could not be reached. Now the panel tells the page how much room it needs, and the page scrolls down to the buttons. The managers’ faces and the plate stay where they were. On the Chromebook, windowed or full screen, nothing changed."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r97",
     "ref": "3c63e0c2853140b19306f94ea959d8ac0518f128",
     "path": "Pull request #1556",
     "label": "PR #1556: Roulette's painted labels end up in Instrument Sans however late the font arrives",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1556",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r97",
     "ref": "ccef1668c1e3a7fd0369e2c9692afe058c1f9942",
     "path": "Pull request #1557",
     "label": "PR #1557: Career Start's small heading stays at the tightest step; REFRESH is reached by scrolling",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1557",
     "kind": "pull-request"
    }
   ],
   "words": 393,
   "minutes": 2
  },
  {
   "id": "r97-live",
   "number": 214,
   "part": "one-screen-at-a-time",
   "title": "Two point ten",
   "dek": "Five fixes, no new screen, the same Rules. The red team waits. And then 2.10.0 goes live.",
   "tags": [
    "2.10.0",
    "Release",
    "Rules",
    "What is next"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "2.10.0 changes nothing in the Firestore Rules. They were compared with the live ones when r97 opened, and again before release. There is no difference, so the only words this release needs from Nik are the version and the merge."
    },
    {
     "type": "p",
     "text": "It adds no read and no write in play either. Nothing in r97 talks to Firebase in a new way. The Device check keeps its run on the phone, the holds live on the phone, and the Roulette frees memory on the phone."
    },
    {
     "type": "p",
     "text": "There is no bug hunt this time. Two were written and pinned: one for Astra on the end of a season, and a new one for Sol on the start of a season, from the Roulette to the Transfer War. Nik chose to ship the small fixes first, and the hunts can still run against 2.10.0 once it is live."
    },
    {
     "type": "p",
     "text": "So 2.10.0 is one evening on an iPhone, followed all the way down. The check that closed now goes on. The Roulette that was too big for a phone now fits, with the same picture. A crash holds only the screen that crashed. The Roulette’s words are in the house typeface on every load, and the Career Start heading stays on small phones with REFRESH within reach."
    },
    {
     "type": "p",
     "text": "Release day has two small steps. Both managers open Home once on the new version before they start a Showdown. Then Nik runs the Device check again on the iPhone, and on the Chromebook, so each screen can find its own level on the build that keeps its run."
    },
    {
     "type": "p",
     "text": "None of it is physical proof. The score the game has earned was earned on an earlier build, and these pages do not add to it."
    },
    {
     "type": "p",
     "text": "Then Nik gives the word, and 2.10.0 goes live."
    }
   ],
   "sources": [
    {
     "branch": "claude-gameplay/r97-bump",
     "ref": "819bf9efc55ef9e259ff2c5acc59af5f424ccfef",
     "path": "Pull request #1558",
     "label": "PR #1558: the 2.10.0 version bump, release record and Volume 25",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1558",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r97",
     "ref": "69eca9f7fbeadffa923d794c27cb1b48176fe816",
     "path": "Pull request #1553",
     "label": "PR #1553: the Device check goes on after a screen closes the tab (iPhone, Roulette at High)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1553",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r97",
     "ref": "e7055f7ffa0efaa1597ce3d2a744c62f1f17362e",
     "path": "Pull request #1554",
     "label": "PR #1554: Roulette frees its painted canvases on phones; the phone budget counts 2D canvases",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1554",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r97",
     "ref": "34d3a38c83fd9b3ea7dba5c2f1cf95894209c741",
     "path": "Pull request #1555",
     "label": "PR #1555: hold only the 3D screen that closed the tab (option A)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1555",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r97",
     "ref": "3c63e0c2853140b19306f94ea959d8ac0518f128",
     "path": "Pull request #1556",
     "label": "PR #1556: Roulette's painted labels end up in Instrument Sans however late the font arrives",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1556",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r97",
     "ref": "ccef1668c1e3a7fd0369e2c9692afe058c1f9942",
     "path": "Pull request #1557",
     "label": "PR #1557: Career Start's small heading stays at the tightest step; REFRESH is reached by scrolling",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1557",
     "kind": "pull-request"
    }
   ],
   "words": 294,
   "minutes": 1
  }
 ],
 "wordCount": 1891
};
