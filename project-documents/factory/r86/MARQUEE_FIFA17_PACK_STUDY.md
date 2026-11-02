# Marquee Player: FIFA 17 pack opening study (HO-035, r86)

Team V lead, Wed 28 Oct 2026, 12:45 a.m. Eastern. For Nik's ask: "study FIFA 17 pack opening animations a lot more deeply to try to replicate it without player walking out".

## What the sources say (checked tonight)
- Walkouts were introduced in FIFA 17 to add drama to top-player reveals; they mark the best players (usually 86+), not a card tier ([FUTEAM](https://fifauteam.com/fc-26-walkout-player/)).
- Before the reveal, top players show clues in a fixed order: **nation flag, then position, then club**, so you can guess the player ([FUTEAM FC 24](https://fifauteam.com/fc-24-walkout-player/)).
- The first second is the "tell": if the **tunnel** appears it is a walkout; if a flag/position appears straight away it is a smaller "board" pull. Walkouts show the whole tunnel, then the camera pushes in on the flags; then the reveal ([Dexerto](https://www.dexerto.com/wikis/ea-fc-26-guides-walkthrough-tips/pack-animations/)).
- Older titles signalled better cards with **more confetti, flames and lights** before the entrance; special cards add splashes of colour in the tunnel ([FUTEAM](https://fifauteam.com/fc-26-walkout-player/), [Dexerto](https://www.dexerto.com/wikis/ea-fc-26-guides-walkthrough-tips/pack-animations/)).
- Written sources do not give frame-by-frame FIFA 17 detail; the beat list below combines them with how the FIFA 17-19 era sequence is commonly remembered. A few real screenshots from Nik would let us match it more exactly.

## What Nik's FIFA 17 screenshots show (Wed 28 Oct 12:26-12:27 a.m. Eastern, 5 frames from a real FIFA 17 pack opening video)
Reference frames are kept privately in the project files (they contain a streamer's face and EA marks; never in the repo, never sent to GPT).
1. **Daylight stadium, camera on the pitch.** Sunny sky with clouds, yellow-and-black stands with a steel roof, mostly empty seats, green striped grass. Not a night tunnel.
2. **The pack** is a huge 3D black-and-gold slab standing upright on the grass, turning slowly, gold sparkles at its base.
3. **The card back** then stands on the pitch, about a third of the screen high, in its card colour (blue with a gold band in the frames), casting a shadow on the grass. White starburst fireworks/sparklers fire along both stand roofs.
4. **Clues are added onto the card back, one at a time:** first the **position** (ST) top left, then the **nation flag** appears on the card while giant flags of that nation drop down from the stand roofs with firework bursts, then a **huge gold-rimmed club-badge coin** rolls past right in front of the camera and its badge lands on the card.
5. **Reveal:** the card flips to the front (rating, position, badge, flag, photo, name, six stats) with confetti in the nation's colours raining down and the nation's flags hanging in the stands; the player stands beside it waving (we drop the player).

## Our Marquee sequence (matches the screenshots; no player)
| # | FIFA 17 | Our version | ~time |
|---|---|---|---|
| 1 | 3D pack stands on the pitch, turns, sparkles | Black-and-gold Marquee pack (gold crown, no words) stands on our pitch, turns, sparkles in the tier colour | 0-1.5 s |
| 2 | Pack bursts, card back stands on the grass, roof sparklers fire | Card back in the **tier finish** (bronze, silver, gold, blue-gold, black-blue-gold) stands on the grass; starbursts fire along both roofs | 1.5-3 s |
| 3 | Position appears on the card | **Position** top left (needs `position` from Team G) | 3-4 s |
| 4 | Nation flag on card + giant flags drop from the roofs + fireworks | Same: flag on the card, giant flags of that nation drop from both roofs, bursts | 4-5.5 s |
| 5 | Huge club-badge coin rolls past the camera, badge lands on card | Huge gold-rimmed **club coin** in club colours and pattern (no crest, no letters) rolls past, lands on the card | 5.5-7 s |
| 6 | Player walks out, card flips | **No player.** Card lifts, spins and flips in a burst of light | 7-8.5 s |
| 7 | Card front + confetti in nation colours | Card front settles: OVR, position, flag, club coin, the club shirt seen from the back with name and number where the photo would be, name bar, POT and #rank TOP N; confetti in the nation's colours | 8.5-10 s |
Then the same for Nik's player; the bottom strip shows both picks. Tap to skip to the settled card.

## Our stadium
Our own stadium, not FIFA's: black-and-gold stands (close to FIFA 17's yellow-and-black), steel roof, late-afternoon sun with clouds, green striped pitch, no adverts, no EA/FIFA words on any board.

## Card (our original, FUT-like)
Shield card in the tier finish. Top left: OVR (`overall`), POT (`potential`) under it, nation flag, club-colour roundel. Centre: the club shirt seen from the back with name and number (no person). Gold name bar. Bottom: rank (#N) and tier label, club name.

## Rules kept
No EA/FIFA/FUT logos, cards or sounds; no real crests; no real players or faces; real national flags are fine. No dimming filter (HO-027): the darkness is painted into the night plate. Lazy-loaded so startup size is untouched.

## Data needed from Team G
`nation` (name), `nationCode` (ISO 3166-1 alpha-2) and `position` (e.g. ST, CAM, CB, GK) per Marquee player, plus the shirt `number` they are already adding. Asked on the relay (leads/relay be291186).
