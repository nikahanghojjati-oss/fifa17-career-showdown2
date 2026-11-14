/* THE CHRONICLE · Volume 20 (Team G, r92 / 2.5.0): the iPhone 17 sent to Light, the fair Device check that only raises Auto, the phone memory limit, the level pictures removed and the Rules pin moved to 2.4.0. Written from gameplay/r92 b36c4e6c. Loaded by volume20.js.
   RELEASE LINE: the last sentence of chapter 189 ("It is not live yet: ...") is the one sentence the r92 lead replaces at release with the live date and time. */
window.CHRONICLE_VOLUME20={
 "capturedAt": "2026-11-14T12:30:00Z",
 "part": {
  "id": "phone-in-pocket",
  "title": "The phone in the pocket",
  "dek": "14 November 2026: 2.4.0 is live; an iPhone 17 is sent to Light, and 2.5.0 makes the Device check fair, keeps phones inside their memory and takes the level pictures down.",
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
     "type": "callout",
     "label": "Release boundary",
     "text": "Written on 14 November 2026 from gameplay/r92 (b36c4e6c), the branch that becomes 2.5.0. The live game is 2.4.0, which went live from main ac0a1338 that morning. Every memory number in this volume was counted in the build room, on the device lab’s iPhone 17 profile, which draws in software. The frame rates are the ones Nik’s own phone reported. Nothing here is a physical acceptance."
    },
    {
     "type": "p",
     "text": "2.4.0 had been live for about twenty minutes when Nik wrote from his phone, at 09:09 UTC on 14 November: “Why device check suggest light on iphone 17 why auto was set to high?” Before the check, Auto had read the Apple chip and started at High, as the level guide promised every strong phone. Then the check ran, and Auto said Light."
    },
    {
     "type": "p",
     "text": "He ran it again. Twice it stopped at Light. A third run played Light, then Balanced, stopped there, and suggested High. “I believe device check is broken,” he wrote at 09:17. It did not show its numbers after the test, and the example pictures looked the same at every level."
    },
    {
     "type": "h2",
     "text": "Six frames"
    },
    {
     "type": "p",
     "text": "The numbers he sent back told the story. On runs 4 and 5 the Special Player reveal at Light averaged 60 frames a second, and the graphics chip spent 2 to 3 ms on each frame. It still failed. The check asked for a 1% low of 45 or more, and the reveal’s 1% low was 44.3, then 40.2. Over ten seconds the worst 1% is about six frames, so three missed refreshes were enough to call a smooth screen slow."
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
     "text": "There was a third fault, and it had nothing to do with speed. Opening High, the first screen, Chamber Men, closed the Safari tab. The device lab showed why. At High a phone loaded the computer’s file set for Chamber Men, about 427 MB of textures (579 MB at Extra, 95 MB at Balanced), for a picture about 590 by 390 pixels. The check’s own Chamber Men frame and the Special Player page also kept their graphics memory after they closed. The roulette already let its memory go."
    },
    {
     "type": "h2",
     "text": "One clean system"
    },
    {
     "type": "p",
     "text": "The first answer was a large one. The plan for 2.5.0 grew a judge, an Auto that learned while you played, a level locked for a week, and device signatures. Nik stopped it at 09:43 UTC: “I just want a clean working quality system ... We just want auto to be smart. And don’t overcomplicate things.” At 09:48 he said “Go” to the simple version. The large plan went to the archive unbuilt."
    },
    {
     "type": "p",
     "text": "The simple version is the 2.4.0 system with its faults taken out (#1458). A screen now counts as smooth when it averages 57 frames a second or more, no more than 2% of its frames are late (over 25 ms), and no single frame takes over 100 ms. Nik’s runs 4 and 5 both pass. A slow screen gets one more try before it counts. If Light itself is not smooth, nothing is saved. The check can only raise Auto. Auto is the higher of the chip’s level and the check’s result, a lower result is neither saved nor read, and the page says so in plain words. The results table now shows each screen’s slowest frame, the second it came, and how many frames were late."
    },
    {
     "type": "p",
     "text": "Phones now load the phone 3D files at High and above, and the flat pictures keep their own size. Chamber Men at High fell from about 427 MB to 166 MB. A phone asks for at most 4 samples of edge smoothing, the Special Player card is drawn at most twice its size on screen, and both check frames free their memory when they close. The lab then found the Special Player at Extra needing 370 MB at the sharpest a phone may draw. So a phone’s Extra now stops at 2.25 times the screen instead of 3, which brings it to 263 MB."
    },
    {
     "type": "h2",
     "text": "A limit on every release"
    },
    {
     "type": "p",
     "text": "The last piece is a rule that runs by itself. On every push to a release branch, a check opens Chamber Men, the roulette and the Special Player on the iPhone 17 profile at High and Extra, at the sharpest each level may reach. It fails if any of them needs more than 300 MB of textures and buffers. Its first run on the release branch, at 47c7cf9b, passed with the same numbers as the lab: Chamber Men 166 and 190 MB, the roulette 214 and 226, the Special Player 241 and 263. Codex found two real faults on the way. The check would have passed a screen that never loaded, at 0 MB, and an older test saved a result below its chip. Both were fixed before the merge. A new contract of 15 checks fails on 2.4.0 and passes on the branch."
    },
    {
     "type": "p",
     "text": "None of this has been proved on the phone that started it. The build room cannot measure a frame rate. Only Nik’s iPhone can show that High now opens, and stays open."
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
   "words": 916,
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
     "text": "In 2.4.0 the Device check page ended with a level guide: six rows from Light to 8K, and under each row the same view of Chamber Men, the roulette and the Special Player at that level, 36 pictures in all. On Nik’s iPhone they all looked the same. A Sonnet thread shot them again on 14 November, framed close on what changes from one level to the next: the crowd and the keeper, the room behind the table, the card’s lower half and its sparkles (#1459)."
    },
    {
     "type": "p",
     "text": "The same morning Nik chose to take them off the page instead. The guide keeps its six rows in words, with the reader’s own row marked. The Your device card above it stays, and so does the check. The pictures, their code and the 36 files are gone, and nothing else in the game had ever named them (#1461). The Extra row now says what a phone really draws: “The whole marble café, and up to 3x sharpness on a sharp computer screen (2.25x on a phone).”"
    },
    {
     "type": "h2",
     "text": "The pin moves"
    },
    {
     "type": "p",
     "text": "The first pull request into the new branch went red on the Rules lane, though it touched no Rules. That test keeps a reviewed list of every line by which the Rules being built differ from the Rules production runs, pinned to production’s commit. The pin still named 2.3.0. 2.4.0 had shipped its Rules, so production and the branch were now the same, and the pin had to say so. The new pin names main ac0a1338, with no lines of difference and no owners, as it did after 2.2.0 (#1460). Because it is a Rules pin, it waited for Nik’s word. He gave it at 10:51 UTC: “Ok”."
    },
    {
     "type": "p",
     "text": "2.5.0 changes no Rules and no saved data, and it costs no new reads. It is not live yet: the version number waits for Nik’s word."
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
   "words": 345,
   "minutes": 2
  }
 ],
 "wordCount": 1261
};
