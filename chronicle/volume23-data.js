/* THE CHRONICLE · Volume 23 (Team G, r95 / 2.8.0): the Ball Game (one football each, six crests, one STOP), one typeface for the
   whole clubhouse, the pop-ups, sign-in and error screens in the house look, a sharper ball, phone spacing, the Fable hunt before release, 2.8.0 going live (17 November 2026, 2:27 PM Boston = 19:27 UTC),
   and the Story's new first page and art. Written from gameplay/r95, updated from main 30b79695. Loaded by volume23.js.
   2.9.0 (r96) has its own Volume 24 (volume24-data.js); chapter 204 says the three items it lists are fixed there. */
window.CHRONICLE_VOLUME23={
 "capturedAt": "2026-11-17T21:00:00Z",
 "part": {
  "id": "the-ball-game",
  "title": "The Ball Game",
  "dek": "The seventeenth of November. 2.8.0 goes live: Club Assignment becomes the Ball Game, the whole clubhouse speaks in one typeface, a hunt finds one small thing, and the Story gets a first page worth opening.",
  "image": "club.webp"
 },
 "chapters": [
  {
   "id": "r95-the-ball-game",
   "number": 200,
   "part": "the-ball-game",
   "title": "One ball each, six crests",
   "dek": "Club Assignment is gone. In its place is the Ball Game: one football for each manager, six crests around it, and one chance to stop it.",
   "tags": [
    "2.8.0",
    "Ball Game",
    "Club Assignment"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "Until 2.8.0 the screen had a plain name, Club Assignment. It described the job and nothing else. In 2.8.0 it is called the Ball Game, and the new name says what you do on it."
    },
    {
     "type": "p",
     "text": "Each manager gets one football. Six crests sit on each ball, so the two of them together are choosing among twelve different clubs, and no club appears on both balls. The clubs come from the league the wheel has landed on. That was Nik’s hard rule, and the game keeps it by dealing both balls from one pool, so a club once dealt cannot be dealt again. The tests dealt a hundred thousand times across five leagues and found no club on both."
    },
    {
     "type": "p",
     "text": "There is one STOP. You press it on your own phone, and the crest facing you when your football comes to rest is your club. It stays yours for the whole Showdown. You each stop once. There is no second spin, no timer and no automatic stop."
    },
    {
     "type": "p",
     "text": "Until now a ball carried three clubs. It carries six now. Nik was offered a choice of levels and answered: \"Let's do the expert.\" So there is one level, the hard one, and nothing on the screen tells you how to beat it. I will not tell you either. The only way to learn it is to play it, and the game would rather you did."
    },
    {
     "type": "p",
     "text": "How the ball turns took an evening of Nik’s notes. An earlier spin reversed itself without warning. Nik asked for it smooth, with no sudden shifts, and in one direction. It runs forward only, in three speed waves that start in a different place every spin, and a slow first look lets you meet each of the six crests before it speeds up. He asked for one more thing about the picture: it should be \"NOT blurry at all.\" The ball has no motion blur, so every crest stays sharp, even at speed. Then he locked it."
    },
    {
     "type": "p",
     "text": "That is the Ball Game as it went live. Showdowns already played keep exactly the clubs they always had; the six-club ball applies only to a Showdown started on 2.8.0. None of it is physical proof. That still belongs to Nik and Daniel, on their own phones, with their own thumbs on the same ball."
    }
   ],
   "sources": [
    {
     "branch": "claude-gameplay/r95-ball-3-wiring",
     "ref": "dfe3db59e89bc33b225c224786a531dd03043808",
     "path": "Pull request #1524",
     "label": "PR #1524: the Ball Game wiring and Rule Book wording",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1524",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r95",
     "ref": "30b79695893dd57808ea870a102c14eeaeb1c020",
     "path": "Pull request #1521",
     "label": "PR #1521: the Ball Game protocol (six clubs, twelve distinct) and the Rules guard",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1521",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r95",
     "ref": "30b79695893dd57808ea870a102c14eeaeb1c020",
     "path": "Pull request #1523",
     "label": "PR #1523: the Ball Game scene and the quality raise",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1523",
     "kind": "pull-request"
    }
   ],
   "words": 383,
   "minutes": 2
  },
  {
   "id": "r95-one-voice",
   "number": 201,
   "part": "the-ball-game",
   "title": "One voice for every screen",
   "dek": "A football with stitched leather, a typeface that belongs to every page, and the pop-ups and error screens that finally join the clubhouse.",
   "tags": [
    "2.8.0",
    "Typeface",
    "Clubhouse look",
    "Phone"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "Nik had a simple bar for 2.8.0. Every screen, every pop-up, every error and every button should look as though it belongs to the clubhouse on Home, with the marble, the gold and a hand behind all of it."
    },
    {
     "type": "p",
     "text": "An audit walked every screen against that bar and found ten that were off and seven that were close. The sign-in pop-up and the error screens wrote their titles in a brush script that no other screen used. Those corners join the clubhouse now. The pop-ups, the sign-in and the error screens take the house frame and the house buttons, and the sign-in dialog says something kinder than before: \"Your Showdowns and History are kept with your Google account.\""
    },
    {
     "type": "p",
     "text": "The whole clubhouse also speaks in one typeface now. Nik chose it with a tap: Instrument Sans, plain, with no foil on it. It is the same on every page, every pop-up, every error and every board drawn in 3D. Only the logo and the Gazette’s old-style masthead keep their own marks. Nothing on the way from Home to the last whistle changes its voice."
    },
    {
     "type": "p",
     "text": "The change made the game lighter, too. Forty-three old font files and sheets are gone, the faces that nothing uses any more, and a new phone installs about six hundred and forty kilobytes less."
    },
    {
     "type": "p",
     "text": "The ball itself is sharper on every device. It has stitched leather and a gloss that catches the light, and even the lightest setting now gets the stitches and a second floodlight."
    },
    {
     "type": "p",
     "text": "On phones, the spacing is tidied. Home, the Transfer War, Season Results, the Trophy Room, Career Statistics and the Rule Book get proper gutters. Tap areas are at least forty-four pixels, and the sideways phones get their own fixes, so that nothing sits hard against an edge."
    },
    {
     "type": "p",
     "text": "None of this changes a rule or a score. It changes what the game feels like in the hand, which for a game played by two friends on two phones is most of what matters."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r95",
     "ref": "3299a37c67f6f96299a921232e05aefdfb340c33",
     "path": "Pull request #1515",
     "label": "PR #1515: one typeface, Instrument Sans, across the clubhouse",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1515",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r95",
     "ref": "3299a37c67f6f96299a921232e05aefdfb340c33",
     "path": "Pull request #1516",
     "label": "PR #1516: one typeface, Instrument Sans, across the clubhouse",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1516",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r95",
     "ref": "3299a37c67f6f96299a921232e05aefdfb340c33",
     "path": "Pull request #1517",
     "label": "PR #1517: one typeface, Instrument Sans, across the clubhouse",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1517",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r95",
     "ref": "3299a37c67f6f96299a921232e05aefdfb340c33",
     "path": "Pull request #1518",
     "label": "PR #1518: one typeface, Instrument Sans, across the clubhouse",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1518",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r95",
     "ref": "3299a37c67f6f96299a921232e05aefdfb340c33",
     "path": "Pull request #1519",
     "label": "PR #1519: one typeface, Instrument Sans, across the clubhouse",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1519",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r95",
     "ref": "3299a37c67f6f96299a921232e05aefdfb340c33",
     "path": "Pull request #1520",
     "label": "PR #1520: one typeface, Instrument Sans, across the clubhouse",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1520",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r95",
     "ref": "3299a37c67f6f96299a921232e05aefdfb340c33",
     "path": "Pull request #1528",
     "label": "PR #1528: Instrument Sans on the Gazette and the loading screen",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1528",
     "kind": "pull-request"
    },
    {
     "branch": "claude-gameplay/r95-ball-3-wiring",
     "ref": "dfe3db59e89bc33b225c224786a531dd03043808",
     "path": "Pull request #1524",
     "label": "PR #1524: the Ball Game wiring and Rule Book wording",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1524",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r95",
     "ref": "30b79695893dd57808ea870a102c14eeaeb1c020",
     "path": "Pull request #1508",
     "label": "PR #1508: the sign-in dialog line",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1508",
     "kind": "pull-request"
    }
   ],
   "words": 331,
   "minutes": 2
  },
  {
   "id": "r95-the-first-page",
   "number": 202,
   "part": "the-ball-game",
   "title": "A first page worth opening",
   "dek": "The Chronicle, the book you are reading, gets a front page that looks like it belongs in the same house as the game.",
   "tags": [
    "2.8.0",
    "The Story",
    "Team V"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "A story that tells you about a clubhouse should not look as if it were written somewhere else. In 2.8.0 the Story gets a first page that looks like the game."
    },
    {
     "type": "p",
     "text": "The front of the Chronicle now sits in a marble plate with a gold bevel frame, in front of a lounge Team V made for it: a desk, a brass lamp, and an open book waiting under the light. The photograph of the two managers has the same gold frame, and the footer is marble."
    },
    {
     "type": "p",
     "text": "The book has a cover of its own. It is leather, with gold corners, and phones get a cover drawn for a tall screen rather than a crop of the wide one. The Making Of pages open on a banner of the studio’s desk at night. The Listen button is now the same button the game uses."
    },
    {
     "type": "p",
     "text": "A smaller thing, which mattered on a phone: the book’s top bar could push the back link and the theme switch off the edge of the screen. It no longer does. The Home tile for the Story also has a new quill. It has barbs and a shaft now, and it stands in an inkwell."
    },
    {
     "type": "p",
     "text": "The dedication to Studio Small Axe is where it was, and it will stay there. Only a small axe can take a big tree."
    }
   ],
   "sources": [
    {
     "branch": "claude-gameplay/r95-house-story-icons",
     "ref": "fe02485ca1f8121c3c03abf5614c7b0b7bdfb201",
     "path": "Pull request #1509",
     "label": "PR #1509: Story book header, cover frame and the redrawn Home quill",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1509",
     "kind": "pull-request"
    },
    {
     "branch": "claude-gameplay/r95-house-story-pages",
     "ref": "eadd8e088495813b1c54c5bc277c81f20ceebe3d",
     "path": "Pull request #1512",
     "label": "PR #1512: the Story’s first page in the clubhouse",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1512",
     "kind": "pull-request"
    },
    {
     "branch": "claude-gameplay/r95-story-art",
     "ref": "583e0ddbb128044a7fe21be4aa49d02c80141633",
     "path": "Pull request #1513",
     "label": "PR #1513: Team V’s Story pictures wired in",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1513",
     "kind": "pull-request"
    }
   ],
   "words": 222,
   "minutes": 1
  },
  {
   "id": "r95-the-hunt",
   "number": 203,
   "part": "the-ball-game",
   "title": "The hunt before the word",
   "dek": "Before anything goes live, something has to try to break it. For 2.8.0 that was Fable, with a hunt, a copy of the old game beside it, and strict orders to fix nothing.",
   "tags": [
    "2.8.0",
    "Bug hunt",
    "Fable",
    "Release"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "Before anything goes live, someone has to try to break it. For 2.8.0 Nik said yes to a bug hunt by Fable 5.2, set to high, with one job: find what is wrong before two people find it on their phones."
    },
    {
     "type": "p",
     "text": "The hunter was told to read, and never to fix. It worked on the release candidate with a copy of 2.7.0 beside it, so every strange thing could be checked against what the players already had."
    },
    {
     "type": "p",
     "text": "It played the Ball Game in the real 3D scene at four window sizes. It reloaded the page in the middle of the spin, after the stop, and a heartbeat after the tap. It let a second manager join late, hid a tab, slowed the loading of the art, and put a phone still on 2.7.0 in the host’s seat while one on 2.8.0 joined. It played one, three and ten seasons. It sacked a manager in the first season, the second and the tenth. It cut the connection. It updated the game from 2.7.0 in the middle of a Showdown."
    },
    {
     "type": "p",
     "text": "Then it counted. Ten seasons cost 10,290 billed reads on 2.8.0, against 10,281 on 2.7.0. The writes were six hundred and fourteen in both, season for season. The Firebase meter had nothing new to say."
    },
    {
     "type": "p",
     "text": "Its verdict was fix first, and only one small thing. There was no bug in play, in integrity, in sync, in History or in Firebase. The one thing: a phone rolled back to 2.7.0 after 2.8.0 went out would ask for eleven fonts that 2.8.0 had deleted, and find nothing. Letters would have gone missing from a page that had done nothing wrong. The fix teaches the update worker to answer those requests from the build the page is actually running."
    },
    {
     "type": "p",
     "text": "The smaller finds were smaller. On a slow first load, the photo credit on the loading screen slid a few pixels about six seconds in. The startup tagline tightened itself after it appeared. The Special Player’s scouting headline wanted an italic that its font did not have, and the real italic is about a third wider, so seventeen of the three hundred and five headlines step down to fit, never below twenty pixels. A few lines still said club draw where the screen now said Ball Game. All of it was fixed and merged that same morning."
    },
    {
     "type": "p",
     "text": "One old thing stayed. If a tab is closed right after the final confirm of the last season and opened again within seconds, it can come back on Home instead of the Final Winner. No data is lost, and a reload shows the winner. The hunt saw it once in three tries on 2.8.0, and once in one on 2.7.0, and it could not say why. It waits for the next release."
    },
    {
     "type": "p",
     "text": "And one note for release day. A phone still on 2.7.0 will refuse a Showdown started on 2.8.0, and what it says is only that the connection did not go through. Both managers should open Home once before the first new Showdown, and the game takes the update there."
    },
    {
     "type": "p",
     "text": "Then the hunt hands the build back. Nothing is left between the release and the word except the word."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r95",
     "ref": "30b79695893dd57808ea870a102c14eeaeb1c020",
     "path": "Pull request #1536",
     "label": "PR #1536: the hunt’s fixes (roll-back fonts, boot credit, tagline, Ball Game wording, scouting italic)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1536",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r95",
     "ref": "30b79695893dd57808ea870a102c14eeaeb1c020",
     "path": "Pull request #1537",
     "label": "PR #1537: the 2.8.0 version bump",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1537",
     "kind": "pull-request"
    }
   ],
   "words": 531,
   "minutes": 2
  },
  {
   "id": "r95-live",
   "number": 204,
   "part": "the-ball-game",
   "title": "Twenty-seven past two",
   "dek": "Three sentences from Nik, in order, and then 2.8.0 is live. The next list is already written, and it is short.",
   "tags": [
    "2.8.0",
    "Release",
    "Rules",
    "What is next"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "Nik gives the word three times on the seventeenth of November, and each time it is short. At nineteen past six in the morning, Boston time, it is \"OK rules r95\": the change to the Firestore Rules that lets the game record a six-club draw. At nine past ten, \"OK version 2.8.0\". At seventeen past one in the afternoon, \"merge r95\"."
    },
    {
     "type": "p",
     "text": "In between comes one last fix. On a phone held sideways, the held crest on Career Start was sitting on Nik’s mouth and beard. One rule moves it down by about a quarter of its own height. It was not new. The same crest sat there in 2.7.0."
    },
    {
     "type": "p",
     "text": "At nineteen minutes past two, the release merges into main. The Firestore Rules deploy first and the site second, because a phone on 2.8.0 writes a key that the old Rules would refuse. By twenty-seven past two both have finished, and 2.8.0 is live."
    },
    {
     "type": "p",
     "text": "The game takes the update on Home, never in the middle of a screen. A Showdown already played, or in progress, keeps exactly the clubs it had. No saved Showdown is rewritten, and nothing in Firebase is deleted or edited. And 2.7.0 stays on the shelf, as the rollback."
    },
    {
     "type": "p",
     "text": "None of this is physical proof. The full score the game has earned was earned on an earlier build, and nothing here adds to it. Proof belongs to the two of them, on their own phones, with the new ball between them."
    },
    {
     "type": "p",
     "text": "The next list is already written, and it is short. On the smallest sideways phones, the Career Start panel still hides both faces, as it did in 2.7.0. The tab that reopens on Home after the final confirm is on it. So are some captions on desktop that are smaller than thirteen pixels. Nik asked for them to be fixed, and 2.9.0 fixes all three. Volume 24 tells how."
    },
    {
     "type": "p",
     "text": "It is live. Now two people have to play it."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r95",
     "ref": "30b79695893dd57808ea870a102c14eeaeb1c020",
     "path": "Pull request #1538",
     "label": "PR #1538: the 2.8.0 release into main (merge commit 30b79695)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1538",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r95",
     "ref": "30b79695893dd57808ea870a102c14eeaeb1c020",
     "path": "Pull request #1539",
     "label": "PR #1539: Career Start crest clear of the face on a sideways phone",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1539",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r95",
     "ref": "30b79695893dd57808ea870a102c14eeaeb1c020",
     "path": "Pull request #1537",
     "label": "PR #1537: the 2.8.0 version bump",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1537",
     "kind": "pull-request"
    }
   ],
   "words": 323,
   "minutes": 2
  }
 ],
 "wordCount": 1790
};
