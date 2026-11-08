/* THE CHRONICLE · Volume 18 (Team G, r90 / 2.3.0): cut the waste, quality first, Nik's Chromebook. Written from gameplay/r90. Loaded by volume18.js. */
window.CHRONICLE_VOLUME18={
 "capturedAt": "2026-11-08T23:45:00Z",
 "part": {
  "id": "chromebook-light",
  "title": "The light on the Chromebook",
  "dek": "8 November 2026: 2.2.0 is live; 2.3.0 cuts the waste and keeps every 3D screen in 3D on Nik’s Chromebook.",
  "image": "club.webp"
 },
 "chapters": [
  {
   "id": "r90-cut-the-waste",
   "number": 179,
   "part": "chromebook-light",
   "title": "Cut the waste",
   "dek": "On the night of 7 November the owner stopped the polishing and gave the release one goal: less, and better.",
   "blocks": [
    {
     "type": "callout",
     "label": "Release boundary",
     "text": "Written on 8 November 2026 from gameplay/r90, the branch that becomes 2.3.0. The live game is 2.2.0, released on 6 November. The numbers below were measured in the build room on a copy of Nik’s Chromebook: two processor threads, a processor slowed four times, an 8.7 Mbps line and a 1920x866 window. Sizes, counts and freezes there are exact. That copy draws its graphics in software, so its frame rates and waiting times only compare one build with another; the proof on the real Chromebook comes before the release."
    },
    {
     "type": "p",
     "text": "Every game that grows for a hundred days grows a loft. Things go up there because nobody is sure they can be thrown away: a screen from an older era, a stylesheet for a look that was replaced, a picture that nothing shows any more. The Showdown had a large loft by November, and the house was starting to creak under it."
    },
    {
     "type": "p",
     "text": "It creaked loudest on Nik’s Chromebook. On the evening of 7 November the roulette crashed Chrome on its first open and ran choppy after that, the packs stuttered, and the Season Results boxes slid over faces in a window that was not full screen. The owner cancelled the polishing round that night and gave 2.3.0 one goal instead: cut the waste, and put quality first. Faster on the weakest machine, at its best picture, and never a crash on the first try."
    },
    {
     "type": "h2",
     "text": "Nothing that plays is touched"
    },
    {
     "type": "p",
     "text": "The goal came with a rule that mattered more than the goal. Not one line still used by a screen, a career, the history or the pairing could go, whatever its old name. The save library that sounds obsolete still carries the join link, so it stays. The offline helper still brings the update notice, so it stays. Only what nothing used was cut, and each cut was searched for across the whole game first."
    },
    {
     "type": "p",
     "text": "That still filled a skip. 267 KB of source that no screen ever ran was deleted, with a check that stops it coming back. The CSS rules that could never apply went, along with an unused sheet. Thirteen pictures from the first visual era went, and so did a font the game downloaded twice. 37 MB of finished history, records of work already done, moved out of the working game into an archive folder where it can still be read."
    },
    {
     "type": "h2",
     "text": "Home arrives lighter"
    },
    {
     "type": "p",
     "text": "The first thing a manager sees is Home, so Home was made to load first. Screens a manager has not opened yet now wait their turn, Home’s pictures are sized for the screen that shows them, and the rest of the game is fetched quietly afterwards as an offline pack. On the copy of Nik’s Chromebook, the first open of Home fell from 3.15 MB to 1.95 MB, and from 96 files to 68."
    },
    {
     "type": "p",
     "text": "The eight Home tiles lost their painted pictures as well. In their place stands one set of gold icons, drawn by the game itself with a single light falling on their relief, so every tile now speaks the same language. Fourteen picture files went with the old art. Nik turned down the first, thinner line icons, and approved this set."
    },
    {
     "type": "h2",
     "text": "One ladder for every screen"
    },
    {
     "type": "p",
     "text": "Quality had grown the same way the loft had, one screen at a time, each with its own idea of what “high” meant. 2.3.0 gives the whole game one ladder: Light, Balanced, High, Extra, Ultra (4K) and 8K, with Auto choosing for each device. Settings now says which level Auto picked. A strong PC climbs to 4K, and to 8K if a manager asks for it; a strong phone gets a rich picture too; a weak machine stays lean. No screen is allowed its own names or its own levels any more, and a check keeps it that way."
    },
    {
     "type": "p",
     "text": "Two smaller cuts answered the owner directly. The yellow LEFT, MIDDLE and RIGHT words no longer hang over the Chamber Men goal. And the roulette no longer gives away its aim: nothing on screen tells a manager whose player the gun will find before the shot does."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1264, merged",
     "label": "PR #1264: delete the dead code (267 KB of source)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1264",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1289, merged",
     "label": "PR #1289: delete CSS that never applies",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1289",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1293, merged",
     "label": "PR #1293: move 37 MB of finished history to archive",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1293",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1305, merged",
     "label": "PR #1305: drop unused images and a duplicate font",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1305",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1268, merged",
     "label": "PR #1268: load Home first",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1268",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1296, merged",
     "label": "PR #1296: one icon set for Home",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1296",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1291, merged",
     "label": "PR #1291: one quality framework",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1291",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1284, merged",
     "label": "PR #1284: Settings says what Auto picked",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1284",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "js/gfxTier.js",
     "label": "js/gfxTier.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/4d2dd9e35e0a750765f3a784a3992a11ae4d51e1/js/gfxTier.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "js/homeScreensV10.js",
     "label": "js/homeScreensV10.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/4d2dd9e35e0a750765f3a784a3992a11ae4d51e1/js/homeScreensV10.js",
     "kind": "repository"
    }
   ],
   "tags": [
    "2.3.0",
    "Cleanup",
    "Home",
    "Quality levels"
   ],
   "words": 706,
   "minutes": 3
  },
  {
   "id": "r90-chromebook",
   "number": 180,
   "part": "chromebook-light",
   "title": "The machine on the kitchen table",
   "dek": "2.3.0 was built around one Chromebook, and around one promise to it: the 3D screens stay 3D.",
   "blocks": [
    {
     "type": "callout",
     "label": "Release boundary",
     "text": "Written on 8 November 2026 from gameplay/r90, the branch that becomes 2.3.0. The live game is 2.2.0, released on 6 November. The numbers below were measured in the build room on a copy of Nik’s Chromebook: two processor threads, a processor slowed four times, an 8.7 Mbps line and a 1920x866 window. Sizes, counts and freezes there are exact. That copy draws its graphics in software, so its frame rates and waiting times only compare one build with another; the proof on the real Chromebook comes before the release."
    },
    {
     "type": "p",
     "text": "Most games are tuned for the machine their makers wish you owned. This one was tuned, in the end, for the machine Nik actually plays on. On 8 November the owner ran a small check page on it and pasted back what it found: an Intel UHD graphics chip, 4 GB of memory, two processor threads, a 1920x866 window and a line of 8.7 Mbps. Then the check drew a test scene, and the answer surprised everyone. 307,200 lit triangles a frame, at the full window size, and it held 60 frames a second the whole way."
    },
    {
     "type": "p",
     "text": "So the graphics chip was never the problem. The problem was two threads of processor doing everything else: unpacking files, preparing shaders, moving players, and all of it while trying to keep the picture still. The fix had to move that work out of the way, not shrink the picture."
    },
    {
     "type": "h2",
     "text": "The promise"
    },
    {
     "type": "p",
     "text": "Nik’s rule came the same day, and it was short. Chamber Men above all, then the roulette, the Special Player pack and the Prime Pack stay as they are designed on Light, the level the Chromebook gets. A flat screen is allowed only on a device that cannot draw 3D at all. Light is not a lesser game. It is the same game, made to fit."
    },
    {
     "type": "h2",
     "text": "Chamber Men finds its stadium"
    },
    {
     "type": "p",
     "text": "Until 2.3.0 the Chromebook had never seen the broadcast penalty. On the copy of Nik’s machine the stadium simply did not arrive in time: the shootout waited 4.2 seconds for 7 to 17 MB of players and stands, gave up, and played on the flat drawing, where repainting a kit cost a second and a half on every kick. Now the stadium’s Light files weigh 4.17 MB instead of 7.48, they are fetched while the season page is still open, and nothing gives up any more. The step waits for the stadium. If the kick clock starts first, a marble LOADING CHAMBER MEN box holds the goal, and the scene takes its place in step with the kicks already shown. If the graphics chip hiccups mid-shootout, the scene rebuilds itself instead of freezing. The flat drawing is left for a device without 3D."
    },
    {
     "type": "p",
     "text": "On Light the stadium carries one real light, with the fill and the rim folded into it; on frozen frames the taker and the pitch read as bright as before. Every shader and texture is prepared behind the loading screen, so nothing is built in the middle of a kick. On the copy of the Chromebook, the freezes in ten seconds of play went from two of up to 1,538 ms to two of at most 161 ms, and to none at all on Balanced."
    },
    {
     "type": "h2",
     "text": "The roulette keeps its nerve"
    },
    {
     "type": "p",
     "text": "The roulette learned the same patience. It used to give up after 15 seconds of loading, or 20 seconds waiting to arm, and show a card where the spin should be. Now it waits as long as the page keeps reporting progress, up to four minutes, tries a fresh start once if something breaks, and rides out a lost graphics context in place. The card is left for a device without 3D, or a scene that fails twice."
    },
    {
     "type": "p",
     "text": "On Light the room has two lights and the shot’s flash; the oil lamp’s glow is painted into the felt. The whole scene on the Chromebook copy now downloads 1.56 MB instead of 3.24. It draws 34 batches at rest instead of 44, and never more than 41 in a turn, where the shot used to reach 99. It needs 11 shaders instead of 17, and its stalls in play went from two to none."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "js/chamberMenStep.js",
     "label": "js/chamberMenStep.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/4d2dd9e35e0a750765f3a784a3992a11ae4d51e1/js/chamberMenStep.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "js/chamberMenScene3d.js",
     "label": "js/chamberMenScene3d.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/4d2dd9e35e0a750765f3a784a3992a11ae4d51e1/js/chamberMenScene3d.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "js/rosterRouletteStep.js",
     "label": "js/rosterRouletteStep.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/4d2dd9e35e0a750765f3a784a3992a11ae4d51e1/js/rosterRouletteStep.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "js/gfxTier.js",
     "label": "js/gfxTier.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/4d2dd9e35e0a750765f3a784a3992a11ae4d51e1/js/gfxTier.js",
     "kind": "repository"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1310, merged",
     "label": "PR #1310: Chamber Men first open at 10 Mbps",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1310",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1325, merged",
     "label": "PR #1325: Chamber Men Light: 3D guaranteed",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1325",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1326, merged",
     "label": "PR #1326: RRR stays 3D on Light",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1326",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1258, merged",
     "label": "PR #1258: remove the yellow LEFT / MIDDLE / RIGHT words",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1258",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1261, merged",
     "label": "PR #1261: RRR: no aiming spoiler",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1261",
     "kind": "pull-request"
    }
   ],
   "tags": [
    "2.3.0",
    "Chromebook",
    "Chamber Men",
    "RRR",
    "Light"
   ],
   "words": 720,
   "minutes": 3
  },
  {
   "id": "r90-packs",
   "number": 181,
   "part": "chromebook-light",
   "title": "The packs, without the stutter",
   "dek": "The Special Player pack loads without its long freeze, the Prime Pack stops fighting its own shadow, and the 2D screens breathe.",
   "blocks": [
    {
     "type": "callout",
     "label": "Release boundary",
     "text": "Written on 8 November 2026 from gameplay/r90, the branch that becomes 2.3.0. The live game is 2.2.0, released on 6 November. The numbers below were measured in the build room on a copy of Nik’s Chromebook: two processor threads, a processor slowed four times, an 8.7 Mbps line and a 1920x866 window. Sizes, counts and freezes there are exact. That copy draws its graphics in software, so its frame rates and waiting times only compare one build with another; the proof on the real Chromebook comes before the release."
    },
    {
     "type": "p",
     "text": "A pack opening is a held breath. It only works if nothing breaks the hold: no hitch as the card turns, no pause while the music plays on alone. On the Chromebook both packs broke it."
    },
    {
     "type": "h2",
     "text": "The Special Player pack"
    },
    {
     "type": "p",
     "text": "The Special Player pack froze the whole page for 6.4 seconds while it loaded, music and all, even behind the loading screen. Most of that freeze was the page waiting for every shader at once. The rest was sixteen card faces painted in one go, and a whole drawn stadium that was built and thrown away before the first frame, because a photograph replaced it."
    },
    {
     "type": "p",
     "text": "Now the shaders are prepared one at a time while the page keeps breathing, the card faces are painted one per beat, and the stadium nobody saw is never built. The longest freeze on the copy of Nik’s Chromebook fell from 6.4 seconds to 0.29. The pack itself got lighter too, from 3.84 MB to 3.54, and plays with no freezes at any level."
    },
    {
     "type": "h2",
     "text": "The Prime Pack stays 2D, and gets smooth"
    },
    {
     "type": "p",
     "text": "The Prime Pack was never a 3D scene. It is a marble plate, a card, a clock ring and five stages of clues. The owner was asked whether it should become 3D or stay flat and be made smooth, and chose smooth. It is a guessing screen, the clues have to read at a glance, and the Chromebook’s two threads were better spent on the stadium and the roulette."
    },
    {
     "type": "p",
     "text": "The stutter turned out to be work nobody could see. In two seconds of the guessing window on the Chromebook copy, the page changed itself 1,830 times and laid itself out again 121 times. Now it changes the page 120 times and lays it out 8. The clock ring now steps five times a second, a pixel of arc at a time, instead of repainting on every frame. The card’s soft shadow, which the browser used to blur afresh each frame, is now one 25 KB picture, blurred once. The look is the same; only the work is gone."
    },
    {
     "type": "h2",
     "text": "The flat screens breathe"
    },
    {
     "type": "p",
     "text": "The same idea reached every 2D screen. On Light, the costliest effects give way to lighter stand-ins that look nearly the same. A moving block over each screen measures what a frame costs to paint. On the Chromebook copy, History fell from 197.6 ms a frame to 40.0, Settings from 129.2 to 41.7, Season Results from 101.1 to 30.6 and Home from 40.5 to 17.1. The full look on Balanced and above is untouched. Light just stopped paying for what it could not show."
    },
    {
     "type": "p",
     "text": "None of this changes a rule. Chamber Men still loads the roulette, the Prime Pack still pays 4, 3, 2 or 1, and a Showdown is still won fifteen points at a time. 2.3.0 only makes sure the weakest machine at the table sees the same game as the strongest."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1324, merged",
     "label": "PR #1324: SP pack lean load",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1324",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1322, merged",
     "label": "PR #1322: SP pack: Light stays 3D",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1322",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1323, merged",
     "label": "PR #1323: Prime Pack smooth 2D",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1323",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1285, merged",
     "label": "PR #1285: MOTION fixes for the SP pack and Prime Pack",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1285",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1287, merged",
     "label": "PR #1287: Light 2D fallbacks",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1287",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "Pull request #1314, merged",
     "label": "PR #1314: keep the stage on its own layer at Light",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1314",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r90",
     "ref": "4d2dd9e35e0a750765f3a784a3992a11ae4d51e1",
     "path": "js/ruleBook.js",
     "label": "js/ruleBook.js",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/4d2dd9e35e0a750765f3a784a3992a11ae4d51e1/js/ruleBook.js",
     "kind": "repository"
    }
   ],
   "tags": [
    "2.3.0",
    "Special Player",
    "Prime Pack",
    "2D screens",
    "Light"
   ],
   "words": 601,
   "minutes": 3
  }
 ],
 "wordCount": 2027
};
