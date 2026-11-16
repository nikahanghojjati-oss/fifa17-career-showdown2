/* THE CHRONICLE · Volume 20 (Team G, r92 / 2.5.0): the iPhone 17 sent to Light, the fair Device check that only raises Auto, the phone memory limit, the level pictures removed and the Rules pin moved to 2.4.0. Written from gameplay/r92 b36c4e6c. Loaded by volume20.js.
   RELEASE LINE: the last sentence of chapter 189 ("2.5.0 went live on 14 November 2026, ...") was filled in by the 2.5.0 release PR with the live date. */
window.CHRONICLE_VOLUME20={
 "capturedAt": "2026-11-14T12:30:00Z",
 "part": {
  "id": "phone-in-pocket",
  "title": "The phone in the pocket",
  "dek": "The fourteenth of November. 2.4.0 is live, and within about twenty minutes an iPhone 17 is told it is slow. 2.5.0 makes the Device check fair, keeps phones inside their memory and takes the level pictures down.",
  "image": "club.webp"
 },
 "chapters": [
  {
   "id": "r92-iphone-light",
   "number": 188,
   "part": "phone-in-pocket",
   "title": "The phone that was told it was slow",
   "dek": "Nik’s iPhone 17 started at High, ran the Device check and was sent to Light. The check was too harsh, a failure wrote over a pass, and High was closing the tab for another reason.",
   "blocks": [
    {
     "type": "p",
     "text": "2.4.0 has been live for about twenty minutes. Nine oh-nine in the morning, UTC, on the fourteenth of November. A message arrives from Nik’s phone."
    },
    {
     "type": "p",
     "text": "\"Why device check suggest light on iphone 17 why auto was set to high?\""
    },
    {
     "type": "p",
     "text": "Before the check, Auto had read the Apple chip and started at High, as the level guide promised every strong phone. Then the check ran. And Auto said Light. An iPhone 17, told by its own game to take it easy."
    },
    {
     "type": "p",
     "text": "This part of the record was written that same day, from the branch that becomes 2.5.0. Every memory number in it was counted in the build room, on the device lab’s iPhone 17 profile, which draws in software. The frame rates are the ones Nik’s own phone reported. None of it is proof on a real phone."
    },
    {
     "type": "p",
     "text": "He runs the check again. Twice it stops at Light. A third run plays Light, then Balanced, stops there, and suggests High."
    },
    {
     "type": "p",
     "text": "Nine seventeen. \"I believe device check is broken,\" he writes. It did not show its numbers after the test. And the example pictures looked the same at every level."
    },
    {
     "type": "h2",
     "text": "Six frames"
    },
    {
     "type": "p",
     "text": "The numbers he sends back tell the story. On runs four and five, the Special Player reveal at Light averaged sixty frames a second, and the graphics chip spent two to three milliseconds on each frame."
    },
    {
     "type": "p",
     "text": "It still failed."
    },
    {
     "type": "p",
     "text": "Here is the forty-five, come back. The check asked for a one per cent low of forty-five or more. The reveal’s one per cent low was 44.3. Then 40.2. Over ten seconds, the worst one per cent is about six frames. So three missed refreshes were enough to call a smooth screen slow. Three frames, on a phone averaging sixty."
    },
    {
     "type": "p",
     "text": "A second fault made it worse. When Light failed, the check saved Light, over the High that Auto had guessed from the chip. One unlucky run dropped an iPhone 17 two levels."
    },
    {
     "type": "h2",
     "text": "The tab that closed"
    },
    {
     "type": "p",
     "text": "There was a third fault, and it had nothing to do with speed."
    },
    {
     "type": "p",
     "text": "Opening High, the first screen, Chamber Men, closed the Safari tab. The device lab showed why. At High, a phone loaded the computer’s file set for Chamber Men: about 427 megabytes of textures, for a picture about 590 by 390 pixels. At Extra it was 579 megabytes. At Balanced, 95. And the check’s own Chamber Men frame and the Special Player page kept their graphics memory after they closed. The roulette already let its memory go."
    },
    {
     "type": "h2",
     "text": "One clean system"
    },
    {
     "type": "p",
     "text": "The first answer is a large one. The plan for 2.5.0 grows a judge, an Auto that learns while you play, a level locked for a week, and device signatures. A quality setting, in other words, with a legal system."
    },
    {
     "type": "p",
     "text": "Nine forty-three. Nik stops it. \"I just want a clean working quality system ... We just want auto to be smart. And don’t overcomplicate things.\""
    },
    {
     "type": "p",
     "text": "Nine forty-eight. He says \"Go\" to the simple version. The large plan goes to the archive, unbuilt."
    },
    {
     "type": "p",
     "text": "The simple version is the 2.4.0 system with its faults taken out. A screen now counts as smooth when it averages fifty-seven frames a second or more, no more than two per cent of its frames are late, meaning over twenty-five milliseconds, and no single frame takes over a hundred milliseconds. Nik’s runs four and five both pass. A slow screen gets one more try before it counts. If Light itself is not smooth, nothing is saved."
    },
    {
     "type": "p",
     "text": "And the check can only raise Auto. Auto is the higher of the chip’s level and the check’s result. A lower result is neither saved nor read, and the page says so in plain words. The results table now shows each screen’s slowest frame, the second it came, and how many frames were late."
    },
    {
     "type": "p",
     "text": "Phones now load the phone 3D files at High and above, and the flat pictures keep their own size. Chamber Men at High falls from about 427 megabytes to 166. A phone asks for at most four samples of edge smoothing. The Special Player card is drawn at most twice its size on screen, and both check frames free their memory when they close."
    },
    {
     "type": "p",
     "text": "Then the lab finds the Special Player at Extra needing 370 megabytes, at the sharpest a phone may draw. So a phone’s Extra now stops at 2.25 times the screen, instead of three. That brings it to 263."
    },
    {
     "type": "h2",
     "text": "A limit on every release"
    },
    {
     "type": "p",
     "text": "The last piece is a rule that runs by itself. On every push to a release branch, a check opens Chamber Men, the roulette and the Special Player on the iPhone 17 profile, at High and at Extra, at the sharpest each level may reach. It fails if any of them needs more than 300 megabytes of textures and buffers."
    },
    {
     "type": "p",
     "text": "Its first run on the release branch passes with the same numbers as the lab. Chamber Men, 166 and 190 megabytes. The roulette, 214 and 226. The Special Player, 241 and 263."
    },
    {
     "type": "p",
     "text": "Codex finds two real faults on the way. The check would have passed a screen that never loaded, at zero megabytes. And an older test saved a result below its chip. Both are fixed before the merge. A new contract of fifteen checks fails on 2.4.0, and passes on the branch."
    },
    {
     "type": "p",
     "text": "None of this has been proved on the phone that started it. The build room cannot measure a frame rate. Only Nik’s iPhone can show that High now opens, and stays open."
    },
    {
     "type": "p",
     "text": "That phone will try again. What it finds comes later."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r92",
     "ref": "b36c4e6c2d211ab268e6afeee0ecce9eefa4305b",
     "path": "Pull request #1458, merged",
     "label": "PR #1458: r92 quality: the Device check only raises Auto, and phones stay inside their memory",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1458",
     "kind": "pull-request"
    }
   ],
   "tags": [
    "2.5.0",
    "Device check",
    "Quality levels",
    "iPhone"
   ],
   "words": 965,
   "minutes": 4
  },
  {
   "id": "r92-pictures-and-pin",
   "number": 189,
   "part": "phone-in-pocket",
   "title": "The pictures came down",
   "dek": "The level guide’s 36 pictures were shot again to show the difference, then taken off the page by Nik’s choice, and the Rules test learned that production had moved to 2.4.0.",
   "blocks": [
    {
     "type": "p",
     "text": "In 2.4.0, the Device check page ended with a level guide: six rows from Light to 8K, and under each row the same view of Chamber Men, the roulette and the Special Player at that level. Thirty-six pictures in all."
    },
    {
     "type": "p",
     "text": "On Nik’s iPhone, they all looked the same. Thirty-six pictures, carefully showing that nothing changes."
    },
    {
     "type": "p",
     "text": "On the fourteenth of November a Sonnet thread shoots them again, framed close on what changes from one level to the next: the crowd and the keeper, the room behind the table, the card’s lower half and its sparkles."
    },
    {
     "type": "p",
     "text": "The same morning, Nik chooses to take them off the page instead."
    },
    {
     "type": "p",
     "text": "The guide keeps its six rows, in words, with the reader’s own row marked. The Your device card above it stays, and so does the check. The pictures, their code and the 36 files are gone, and nothing else in the game had ever named them. The Extra row now says what a phone really draws: \"The whole marble café, and up to 3x sharpness on a sharp computer screen (2.25x on a phone).\""
    },
    {
     "type": "h2",
     "text": "The pin moves"
    },
    {
     "type": "p",
     "text": "The first pull request into the new branch goes red on the Rules lane. It touched no Rules. The pull request was innocent. The test was living in the past."
    },
    {
     "type": "p",
     "text": "That test keeps a reviewed list of every line by which the Rules being built differ from the Rules production runs, pinned to production’s commit. The pin still named 2.3.0. But 2.4.0 had shipped its Rules, so production and the branch were now the same, and the pin had to say so. The new pin names 2.4.0’s commit on main, with no lines of difference and no owners, as it did after 2.2.0."
    },
    {
     "type": "p",
     "text": "Because it is a Rules pin, it waits for Nik’s word. Ten fifty-one in the morning, UTC. He gives it: \"Ok\". Rules pins do not need speeches."
    },
    {
     "type": "p",
     "text": "2.5.0 changes no Rules and no saved data, and it costs no new reads. It goes live on the fourteenth of November, twenty twenty-six, on Nik’s word."
    },
    {
     "type": "h2",
     "text": "Three names from the list"
    },
    {
     "type": "p",
     "text": "The next morning, the hunt finds what no real game had reached yet."
    },
    {
     "type": "p",
     "text": "A manager who picks two or three of his signings from the name list cannot lock them. Every picked name brings its overall, its position and its SoFIFA number, and the Rules read each one. Three of them take the check past the thousand expressions Firestore allows for one request. The screen says the session has expired, which is not true. The game was too polite to say it had run out of arithmetic. Trying again changes nothing."
    },
    {
     "type": "p",
     "text": "Nothing is taken out to fix it. The same checks are written so they cost less, each cut measured on its own. The worst lock that can be played now uses about 842 of the thousand. A new test measures that lock in all eight orders, and fails if the spare room drops under 150."
    },
    {
     "type": "p",
     "text": "2.5.1 goes live, on Nik’s word."
    },
    {
     "type": "p",
     "text": "Why a hunt was looking there at all, and what Nik asked for once he saw it, is the last story in the record so far."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r92",
     "ref": "b36c4e6c2d211ab268e6afeee0ecce9eefa4305b",
     "path": "Pull request #1459, merged",
     "label": "PR #1459: R92-09: level guide pictures that show the difference",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1459",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r92",
     "ref": "b36c4e6c2d211ab268e6afeee0ecce9eefa4305b",
     "path": "Pull request #1461, merged",
     "label": "PR #1461: r92: remove the level pictures from the Device check",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1461",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r92",
     "ref": "b36c4e6c2d211ab268e6afeee0ecce9eefa4305b",
     "path": "Pull request #1460, merged",
     "label": "PR #1460: r92 Rules baseline: production main is 2.4.0, no reviewed delta",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1460",
     "kind": "pull-request"
    }
   ],
   "tags": [
    "2.5.0",
    "Device check",
    "Level guide",
    "Rules"
   ],
   "words": 558,
   "minutes": 2
  }
 ],
 "wordCount": 1523
};
