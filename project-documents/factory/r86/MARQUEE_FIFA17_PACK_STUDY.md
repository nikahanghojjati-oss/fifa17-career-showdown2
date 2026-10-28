# Marquee Player: FIFA 17 pack opening study (HO-035, r86)

Team V lead, Wed 28 Oct 2026, 12:45 a.m. Eastern. For Nik's ask: "study FIFA 17 pack opening animations a lot more deeply to try to replicate it without player walking out".

## What the sources say (checked tonight)
- Walkouts were introduced in FIFA 17 to add drama to top-player reveals; they mark the best players (usually 86+), not a card tier ([FUTEAM](https://fifauteam.com/fc-26-walkout-player/)).
- Before the reveal, top players show clues in a fixed order: **nation flag, then position, then club**, so you can guess the player ([FUTEAM FC 24](https://fifauteam.com/fc-24-walkout-player/)).
- The first second is the "tell": if the **tunnel** appears it is a walkout; if a flag/position appears straight away it is a smaller "board" pull. Walkouts show the whole tunnel, then the camera pushes in on the flags; then the reveal ([Dexerto](https://www.dexerto.com/wikis/ea-fc-26-guides-walkthrough-tips/pack-animations/)).
- Older titles signalled better cards with **more confetti, flames and lights** before the entrance; special cards add splashes of colour in the tunnel ([FUTEAM](https://fifauteam.com/fc-26-walkout-player/), [Dexerto](https://www.dexerto.com/wikis/ea-fc-26-guides-walkthrough-tips/pack-animations/)).
- Written sources do not give frame-by-frame FIFA 17 detail; the beat list below combines them with how the FIFA 17-19 era sequence is commonly remembered. A few real screenshots from Nik would let us match it more exactly.

## The FIFA-era beats and our version (no player walks out)
| # | FIFA beat | Approx. time | Our Marquee version |
|---|---|---|---|
| 1 | Pack sits on screen, glowing in its pack colour | 0.0-1.0 s | Black-and-gold Marquee pack on the pitch, edge glow in the tier colour |
| 2 | Pack opens / bursts, camera jolts | 1.0-1.6 s | Pack tears open, light shaft and a short screen shake |
| 3 | **Tell:** the tunnel appears, lights drop, crowd swells | 1.6-3.0 s | Stadium lights dim (no dimming filter: the plate itself is the night scene), tunnel blazes, smoke rolls, pyro wall fires in the **tier colour** (bronze, silver, gold, blue-gold, black-blue-gold); bigger show for higher tiers |
| 4 | Camera pushes in, **nation flag** waves | 3.0-4.4 s | Board 1 swings in: the national flag waving (needs `nation` from Team G) |
| 5 | **Position** | 4.4-5.6 s | Board 2: club colours with the **kit number** (we have no position data; Nik's order wants the number) |
| 6 | **Club badge** | 5.6-6.8 s | Board 3: the **club name** on a club-colour board (no real crests) |
| 7 | Player walks out of the tunnel | 6.8-9.0 s | **Dropped** (Nik). Instead the card flies out of the tunnel through the smoke, with a light trail and sparks |
| 8 | Card flips to the front, rating shown, light burst | 9.0-10.5 s | Card spins once, flashes in the tier colour, settles; the shirt on the card gets DYBALA and 21 stamped on, then the rank badge flashes |
| 9 | Result screen (send to club) | after | Strip at the bottom fills "01 DANIEL P. Dybala"; then the whole sequence runs for Nik's player |

Total about 10-11 s per player, about 22 s for both; a "skip" tap jumps to the settled card (as FIFA allows). Reduced motion: settled cards only.

## Card (our original, FUT-like)
Shield card in the tier finish. Top left: OVR (`overall`), POT (`potential`) under it, nation flag, club-colour roundel. Centre: the club shirt seen from the back with name and number (no person). Gold name bar. Bottom: rank (#N) and tier label, club name.

## Rules kept
No EA/FIFA/FUT logos, cards or sounds; no real crests; no real players or faces; real national flags are fine. No dimming filter (HO-027): the darkness is painted into the night plate. Lazy-loaded so startup size is untouched.

## Data needed from Team G
`nation` (name) and `nationCode` (ISO 3166-1 alpha-2) per Marquee player, plus the shirt `number` they are already adding. Asked on the relay (leads/relay be291186).
