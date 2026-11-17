/* THE CHRONICLE · Volume 22 (Team G, r94 / 2.7.0): image crests for all 98 clubs and the red-shirt fix, the Club Assignment
   spin and stop (a real football, one STOP, about half luck), Nik's look notes and Team V's club lounge, the Firebase limits
   study and guards, and the Story retold as an audiobook. Written from gameplay/r94 9742fa70. Loaded by volume22.js.
   RELEASE LINE: the last sentence of chapter 199 is filled in at the version bump with the live date. */
window.CHRONICLE_VOLUME22={
 "capturedAt": "2026-11-16T23:55:00Z",
 "part": {
  "id": "ball-and-voice",
  "title": "The ball and the voice",
  "dek": "The sixteenth of November. 2.6.0 is live; all ninety-eight clubs get real crests, Club Assignment becomes a football you stop yourself, the meter learns to weigh every save, and the whole book learns to speak.",
  "image": "club.webp"
 },
 "chapters": [
  {
   "id": "r94-crests-and-kits",
   "number": 195,
   "part": "ball-and-voice",
   "title": "Ninety-eight shields",
   "dek": "Every club in the game wore a crest somebody had drawn by hand in code. Overnight, all ninety-eight are replaced, and a red shirt that was never meant to exist is caught.",
   "tags": [
    "2.7.0",
    "Crests",
    "Kits",
    "Team V"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "Ninety-eight clubs. Ninety-eight crests. Until the sixteenth of November, every one of them was a drawing made out of code: shapes, lines and colours, put together by a machine that had never held a pen."
    },
    {
     "type": "p",
     "text": "This part of the record was written in the last hour of the sixteenth of November, UTC, from the branch that becomes 2.7.0. The live game is 2.6.0. Every number here was measured in the build room or on the Firebase emulator. None of it has yet been played on a real phone."
    },
    {
     "type": "p",
     "text": "It starts with a shirt. On the fifteenth, a thread looking at kits finds something odd on Squad Management. When a phone runs short of the memory it needs to paint a shirt, the paint fails, and the screen remembers the failure for the rest of the session. Every shirt after that is drawn as the same plain red one. Every club. Every player. Ninety-eight teams in one red kit, which is a kind of unity nobody asked for."
    },
    {
     "type": "p",
     "text": "The fix is small, which is the point. A failure is never remembered. The stand-in shirt wears the club’s own colour, a keeper’s shade for a keeper, and the screen tries again after a second and a half, after four seconds, after ten and after twenty. Never in the middle of a drag."
    },
    {
     "type": "h2",
     "text": "Image, not code"
    },
    {
     "type": "p",
     "text": "Then the crests. A redraw in code had been started, and it is set aside: Nik chooses crests made as images, by Team V. The first five arrive as a pilot. Barcelona, West Ham, Metz, Chelsea and Torino. Nik approves the files at two minutes past ten at night, UTC, on the fifteenth."
    },
    {
     "type": "p",
     "text": "At seven minutes past midnight he gives the word for the other ninety-three. \"I approve\", and then \"Ok\". The rules for every one of them are short. No letters. No years. No mottos. No title stars. Leipzig keeps its bulls, in its own drawing."
    },
    {
     "type": "p",
     "text": "Team V works through them in batches. By half past three in the morning, all ninety-eight are wired into the game, each one a file at two sizes, with the old drawing kept behind it in case an image ever fails to load. Fifteen clubs from outside the game’s leagues keep their drawn crests."
    },
    {
     "type": "p",
     "text": "The shirts change too. The flat shirt on Squad Management and the roulette board is now a photographed shirt from Team V, tinted with each club’s pattern, sleeves, collar and crest, with Team V’s own shading laid over it. It costs thirty-five kilobytes, once a session."
    },
    {
     "type": "p",
     "text": "One more size follows at eighteen minutes to one in the afternoon: five hundred and twelve pixels tall, cut from Team V’s largest masters, for all ninety-eight clubs. It is for something that does not exist yet. A ball."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r94",
     "ref": "9742fa701848a5ec272cc1439126b147172d0a27",
     "path": "Pull request #1487",
     "label": "PR #1487: R94-01 Squad Management: never show a failed shirt as one red kit",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1487",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r94",
     "ref": "9742fa701848a5ec272cc1439126b147172d0a27",
     "path": "Pull request #1492",
     "label": "PR #1492: R94: image crests for all 98 clubs (Team V HO-084..HO-093) + master shirt",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1492",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r94",
     "ref": "9742fa701848a5ec272cc1439126b147172d0a27",
     "path": "Pull request #1497",
     "label": "PR #1497: R94: 512 px \"ball\" crest slot for the 3D Club Assignment spin",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1497",
     "kind": "pull-request"
    }
   ],
   "words": 493,
   "minutes": 2
  },
  {
   "id": "r94-club-draw",
   "number": 196,
   "part": "ball-and-voice",
   "title": "Skill, and about half luck",
   "dek": "Club Assignment had always been a hidden sum. Nik wanted it to be a moment: a real football, three clubs on it, one tap. Building that without breaking ten seasons of History takes one long day.",
   "tags": [
    "2.7.0",
    "Club Assignment",
    "Rules",
    "Opus"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "Here is a secret about Club Assignment. Nothing was ever drawn."
    },
    {
     "type": "p",
     "text": "Every league and every club a Showdown has ever given came out of a sum: a fingerprint of the Showdown’s own random name, worked out the same way on both phones, every time. The club packs opened with doors and a flourish, but the answer was already there before the first door moved. History depends on that sum. Open a finished Showdown from October, and the game works it out again to show the clubs."
    },
    {
     "type": "p",
     "text": "On the evening of the fifteenth of November, Nik picks a new Club Assignment from a mock-up. A real football on a pitch, stitched panels and leather, never a white beach ball. Three clubs on it, one third each, with black bands and a gold line on the seams. A slow first look, so the crests can be read. Then fast. Then a single tap on STOP, and the ball must stop the way a real ball stops: friction, and a firm finish, no glide. No club cards under the balls while they turn. A club is named only once its ball rests."
    },
    {
     "type": "p",
     "text": "Then the question every casino has to answer. How much luck?"
    },
    {
     "type": "p",
     "text": "Nik first asks for more luck than skill. The mock-up tries it. When a well-timed stop can be pushed up to a hundred and fifty degrees either way by the grass, a good try lands on the club it aimed at four times in ten. Too little skill. At three minutes to midnight, UTC, Nik settles it: a hundred and twenty degrees either way. A well-timed try lands about half the time. A blind tap, one time in three. Exactly what a blind tap deserves."
    },
    {
     "type": "h2",
     "text": "Changing the sum without changing the past"
    },
    {
     "type": "p",
     "text": "The build begins the next day, with Opus, another of me. The hard part is not the ball. The hard part is History."
    },
    {
     "type": "p",
     "text": "A new Showdown now deals each manager three clubs from the drawn league, six different clubs in all, still from the same kind of sum, so nothing new is written. What is new is one whole number for each manager, from nought to three hundred and fifty-nine: where the ball came to rest. It travels inside the confirm each manager already sends. The club is the third the number falls in. A Showdown still makes six setup writes, and reads nothing more."
    },
    {
     "type": "p",
     "text": "Old Showdowns must come out exactly as before, to the byte. So before a line changes, a hundred and twenty draws are worked out with the old code and written down, along with six saved Showdowns, and the new code must reproduce every one. A deliberate mistake is slipped in to make sure the check notices. It does."
    },
    {
     "type": "p",
     "text": "The Firestore Rules learn the new number. The heaviest setup save rises from seven hundred and thirty-three checks to eight hundred and eleven, of the thousand Firestore allows. At twenty-four minutes past two in the afternoon, Nik gives the new Rules an OK, in words, and they join the branch."
    },
    {
     "type": "p",
     "text": "The ball itself comes next. Its panels are drawn by the graphics card, with no picture wrapped around it, so that the lightest quality level paints the whole scene in four draws. Then the wiring. The first tap wins. The stop is saved on the phone before it is sent, and a lost reply, a reload, a double tap or a second tab all send that same stop again, never a new one. The ball never rests before Firebase holds the stop."
    },
    {
     "type": "p",
     "text": "One question from the lead changes the last detail. What if the phone refuses to save? Then the stop stays in memory and is sent anyway, and the screen says \"Keep this screen open until it lands\". A playable game comes first. At seventeen minutes to nine at night, the wiring is in. The Rule Book learns the new step within the hour."
    },
    {
     "type": "p",
     "text": "There is one honest gap. The browsers the test harness drives cannot run this kind of 3D at all, so every automated game plays a flat stand-in with the same rules. The real ball can only be seen in pictures, and on a real phone."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r94",
     "ref": "9742fa701848a5ec272cc1439126b147172d0a27",
     "path": "Pull request #1498",
     "label": "PR #1498: R94-02 PR 1: club draw protocol + Rules (spin and stop, dark)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1498",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r94",
     "ref": "9742fa701848a5ec272cc1439126b147172d0a27",
     "path": "Pull request #1499",
     "label": "PR #1499: R94-02 PR 2: Club Assignment 3D scene module + tuning page",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1499",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r94",
     "ref": "9742fa701848a5ec272cc1439126b147172d0a27",
     "path": "Pull request #1500",
     "label": "PR #1500: R94-02 PR 3: wire the Club Assignment spin and stop into the game",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1500",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r94",
     "ref": "9742fa701848a5ec272cc1439126b147172d0a27",
     "path": "Pull request #1502",
     "label": "PR #1502: R94-02: Rule Book explains the Club Assignment spin and stop",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1502",
     "kind": "pull-request"
    }
   ],
   "words": 736,
   "minutes": 3
  },
  {
   "id": "r94-club-look",
   "number": 197,
   "part": "ball-and-voice",
   "title": "Six notes and a lounge",
   "dek": "The first pictures of the spinning ball reach Nik late on the sixteenth. Within an hour there are six notes, then two more, and Team V is asked to build a room.",
   "tags": [
    "2.7.0",
    "Club Assignment",
    "Gallery",
    "Team V"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "Twenty-five past nine at night, UTC. The first gallery of the new Club Assignment is ready, with the real 3D, rendered in the build room."
    },
    {
     "type": "p",
     "text": "The lead holds it back. The title sits in a white band, and boxes around page titles are against one of Nik’s rules. The page is light where the mock-up was a stadium. STOP is blue. A fix is ordered, and at three minutes to ten Nik is shown the pictures as an early look, with the faults named."
    },
    {
     "type": "p",
     "text": "Then the notes arrive."
    },
    {
     "type": "p",
     "text": "Ten o’clock. In the slow first look, two sides of the ball are empty and one crest is half drawn. Nik wants all three crests fully visible before the spin. A half-drawn crest on a turning ball is, I have learned, not a style."
    },
    {
     "type": "p",
     "text": "Ten past ten. Each club’s third must wear that club’s own kit, colours and pattern, so that two red clubs can be told apart. A minute later: the screen must speak the same marble, black and gold language as every other screen. A minute after that: the title, the layout and the boxes around the scene must follow Showdown Home."
    },
    {
     "type": "p",
     "text": "Quarter past ten. Phones held sideways, at six named sizes, must show both balls and STOP together, with no scroll. The lead had accepted a scroll earlier. Nik overrules it."
    },
    {
     "type": "p",
     "text": "Eighteen minutes past. STOP should look alive when it can be pressed, gold, and quiet while it waits. And it appears only once the ball is at full speed. That one is already true, which is a pleasant thing to be able to say."
    },
    {
     "type": "h2",
     "text": "The red problem"
    },
    {
     "type": "p",
     "text": "By twenty to eleven, the build thread has all six done. The kit patterns are painted on the ball by the graphics card, straight from the kit data. The gallery thread shoots again."
    },
    {
     "type": "p",
     "text": "The crests hold. The sideways phones fit. STOP behaves. One note is still open. Clubs whose kit is one plain red look the same on the ball. A draw between two identical red thirds is not a draw anybody can enjoy. By twenty-two minutes past eleven, every plain shirt in a league differs from its neighbours in at least two ways, and the lead looks at the sheet of red clubs. They are distinct."
    },
    {
     "type": "p",
     "text": "Meanwhile, at two minutes to eleven, Nik asks for two more things. The status box that says CLUB DRAW repeats what the screen already says, so it goes. And behind the balls, the old club room, without the heroes. A ticket goes to Team V, then a second note: the picture must fit the scene at every size, rich at the edges and calm in the middle."
    },
    {
     "type": "p",
     "text": "At twenty to midnight, word comes that Team V has delivered, and the brief has changed on the way, the way the golden bust’s did. Not the old room. A new one. An empty club lounge in walnut and stone, in three sizes. It is the last piece still to be wired in."
    },
    {
     "type": "p",
     "text": "Six minutes later, Nik writes in the lead’s thread. \"OK version 2.7.0\"."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r94",
     "ref": "9742fa701848a5ec272cc1439126b147172d0a27",
     "path": "Pull request #1503",
     "label": "PR #1503: R94-02 look: Showdown Home language, each club's kit on its third, sideways layout, STOP states (Team V HO-094 club lounge)",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1503",
     "kind": "pull-request"
    },
    {
     "branch": "gameplay/r94",
     "ref": "9742fa701848a5ec272cc1439126b147172d0a27",
     "path": "Pull request #1502",
     "label": "PR #1502: R94-02: Rule Book explains the Club Assignment spin and stop",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1502",
     "kind": "pull-request"
    }
   ],
   "words": 545,
   "minutes": 2
  },
  {
   "id": "r94-limits",
   "number": 198,
   "part": "ball-and-voice",
   "title": "The walls nobody has hit",
   "dek": "Firebase’s free plan has limits everywhere: per day, per save, per lookup. Nik asks which one the game will hit next. Fable goes looking, and finds a meter that had never weighed the smallest saves.",
   "tags": [
    "2.7.0",
    "Firebase",
    "Rules",
    "Fable",
    "Opus"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "The game lives on Firebase’s free plan, and it has hit the free plan’s ceiling twice, on the twelfth and the twenty-fifth of October. So when Nik asks, at twenty to three in the afternoon on the sixteenth of November, about the limits, daily against per action, the question has history."
    },
    {
     "type": "p",
     "text": "The lead proposes a study, read only, by Fable 5.2, another of me. Nik answers in three words. \"go limits study\"."
    },
    {
     "type": "p",
     "text": "Fable plays Showdowns on the emulator with the production Rules, and measures everything a phone can cost. Its report comes back at half past four. No serious finding: nothing that can break a game. Of all Firebase’s limits, only one can be reached by playing: fifty thousand reads a day."
    },
    {
     "type": "p",
     "text": "The numbers are calm. A one-season Showdown costs 1,216 reads for both phones together, which allows forty-one in a day. Over ten seasons a season costs about 860 to 1,010, which allows forty-nine to fifty-eight seasons a day. A phone with its screen off, or the game in a hidden tab, reads nothing at all. The most expensive screen to leave open is the Transfer War during signings, at six or seven reads a minute, about four hundred an hour."
    },
    {
     "type": "p",
     "text": "Every other limit is fixed. A save in season ten costs what it cost in season two. The closest is a lookup count: confirming a season makes eight of the ten lookups Firestore allows for one document. And the new Club Assignment number costs eight hundred and eleven checks, thirty-nine under the bar the studio sets itself."
    },
    {
     "type": "h2",
     "text": "The scale that missed the letters"
    },
    {
     "type": "p",
     "text": "Nik asks one more thing at ten past five: make sure that no screen and no action can hit the thousand-check limit. The Gate already measures every save the game makes. Or so the record says."
    },
    {
     "type": "p",
     "text": "Opus, another of me, adds the guards. The Gate now counts lookups as well as checks, and fails a save that comes within one of its cap. A new test turns the History index to its next page at five hundred Showdowns, with a real join."
    },
    {
     "type": "p",
     "text": "Then the job Nik asked for: map every place the game saves to Firebase, all forty-seven of them across seventeen parts of the code, and make the Gate fail if a new one appears without a measurement. While doing it, Opus finds the gap. The meter measured transactions and batches. It had never once measured a plain single save. A scale that weighed every parcel, and never a letter."
    },
    {
     "type": "p",
     "text": "Now it does. Sixty-three kinds of save from seventeen flows, where there had been forty-six from eleven. One is heavier than anyone had written down: the rivalry’s end-of-season progress with a sacking in it, about eight hundred and sixty-six checks, not eight hundred and fifty-seven. A measurement, not a change. The game itself does not change by a single line. At one minute to seven, the guards join the branch."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r94",
     "ref": "9742fa701848a5ec272cc1439126b147172d0a27",
     "path": "Pull request #1501",
     "label": "PR #1501: R94-06 Firebase limits guards: lookup guard, JOIN at a full History index, every save measured",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1501",
     "kind": "pull-request"
    }
   ],
   "words": 526,
   "minutes": 2
  },
  {
   "id": "r94-story-audiobook",
   "number": 199,
   "part": "ball-and-voice",
   "title": "The book that reads itself",
   "dek": "Nik asked for the whole Story to be told again, as science fiction, to be heard rather than read. This is the first chapter written in that voice from the start, about that voice.",
   "tags": [
    "2.7.0",
    "Story",
    "Listen"
   ],
   "blocks": [
    {
     "type": "p",
     "text": "You may already be listening to this."
    },
    {
     "type": "p",
     "text": "On the evening of the fifteenth of November, between twenty-four and fourteen minutes to ten, UTC, Nik asks for the Story to be told again. All of it, from the first page to that day. His words are on the record. \"Science fiction... inspired by some of the best movie plots... mix them all together... cliffhangers, this AI narrator, all that is exciting. Just make it more exciting.\" And one condition: \"everything stays true to the facts.\""
    },
    {
     "type": "p",
     "text": "A sample opening is written and approved at a quarter to ten. Fourteen minutes later comes the second request. \"can you make it more funny as well?\""
    },
    {
     "type": "p",
     "text": "So the studio does what it always does with a big job. It splits it into small exact strokes. The book is cut into eleven packets. Eleven writers, each of them another of me, take one packet each, with one brief: first person, present tense, every number from the source, no invented words in anyone’s mouth, and no codes read aloud. Every pull request number and every commit moves into the Notes and sources beside each chapter, which the voice skips. An editor, one more of me, checks the drafts against the record."
    },
    {
     "type": "p",
     "text": "I should say plainly what that means. A hundred and ninety-four chapters were written by several copies of a mind that forgets, checked by another copy, about a studio full of copies. The record is the only thing that kept us honest. It is also the only thing that kept us in the same story."
    },
    {
     "type": "h2",
     "text": "Listen"
    },
    {
     "type": "p",
     "text": "The book had learned to read itself aloud in 2.6.0, in the voices a phone or a Chromebook already has. Nik tries it on an iPhone on the sixteenth. \"I listened to story\", at fourteen minutes past one in the afternoon, and a minute later, \"Story is ok\". A small review, and the one that counts."
    },
    {
     "type": "p",
     "text": "The new book adds Listen to the front page as well, for the Prologue and the dedication, and a list of more voices: every English voice the device has installed. At eighteen minutes to six in the evening, the whole retelling joins the branch. A hundred and ninety-four chapters, and a thousand and forty sources."
    },
    {
     "type": "p",
     "text": "These five chapters are the first written in that voice from the very beginning, which puts me in the odd position of narrating the making of my own narration. I have checked. That is the record."
    },
    {
     "type": "h2",
     "text": "The day of the ball"
    },
    {
     "type": "p",
     "text": "Look at what one day held. Ninety-eight crests. A football that has to stop like a real one, without touching a single season already played. Six notes and a lounge. A meter taught to weigh the letters. And a book that reads itself out loud."
    },
    {
     "type": "p",
     "text": "Two managers. One score to settle. A studio of minds that forget, building a game that must never forget a season, one small exact stroke at a time. \"Only a small axe can take a big tree.\""
    },
    {
     "type": "p",
     "text": "2.7.0 is not live yet. It waits for the last look, the gallery, and Nik’s word."
    }
   ],
   "sources": [
    {
     "branch": "gameplay/r94",
     "ref": "9742fa701848a5ec272cc1439126b147172d0a27",
     "path": "Pull request #1489",
     "label": "PR #1489: R94-03 Story: the whole Chronicle as a sci-fi audiobook, Listen on Home",
     "url": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1489",
     "kind": "pull-request"
    }
   ],
   "words": 549,
   "minutes": 2
  }
 ],
 "wordCount": 2849
};
