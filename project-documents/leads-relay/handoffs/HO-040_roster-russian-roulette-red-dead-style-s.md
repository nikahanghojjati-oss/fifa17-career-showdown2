# HO-040 · Team G → Team V · Roster Russian Roulette: Red Dead Redemption game scene, cowboy cafe + boards (r87)

```ticket
{
 "id": "HO-040",
 "from": "G",
 "to": "V",
 "title": "Roster Russian Roulette: Red Dead Redemption game scene, cowboy cafe + boards (r87)",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-6rq94x/visual-assets/v10_1/roulette/HANDOFF_HO-040_DONE.md"],
 "log": [{"at": "2026-10-29T00:06:08Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-29T00:13:05Z", "by": "V", "status": "RECEIVED", "note": "Team V: received; asking the coordinator to open a new Team V thread for it (picture tickets + layered assets)"}, {"at": "2026-10-30T00:18:36Z", "by": "V", "status": "DONE", "note": "Nik approved the screen 29 Oct 8:16 p.m. Eastern. Real 3D screen (three.js, one page, no build) at visual-assets/v10_1/roulette/ on claude/project-thread-6rq94x f598b44dc. Package HANDOFF_HO-040_DONE.md has the wiring contract: URL params d/n/seed, window.__rr.play({fire,target}), rr:end event, squads.json shape, 22 s turn, sfx map (HO-047 merged). Team G decides outcomes (HO040-M1), the page's own random is demo only. Evidence sheets + 23 s videos in evidence/."}],
 "from_session": "session_01GU43Q8SekYEo4yZo5Tik3P"
}
```

# Roster Russian Roulette: Red Dead Redemption game scene in a cowboy cafe (r87, new screen)

**Sent by the Team G lead for r87.** Thread "Build Roster Russian Roulette for r87", session `session_01GU43Q8SekYEo4yZo5Tik3P`.
INBOX.json "G" still points at the r86 lead, which keeps working until r86 ships. **Wake THIS session for anything about HO-040** (send_message to session_01GU43Q8SekYEo4yZo5Tik3P), not the r86 one.

## Nik's words (28-29 Oct 2026, Boston evening)
- "The screen should look like a Red Dead Redemption scene game, like maybe in a cafe or something, and they're playing a Russian roulette game. The small one that has seven, and me and Daniel are holding two boards."
- "It could be the character from Red Dead Redemption if we can resemble it very well. I understand about copyright ... the scene should be very high quality, right? But it also should have like the game element. We have like a top bar, whatever it's needed. The other for the phone."
- "I like to have a real high quality as possible ... a scene from Red Dead Redemption with that quality of 3D pictures for the character ... a guy is like sitting ... we spin the gun and it just shoot."
- 00:05 UTC: "red dead redemption game scene and visualization and presentation quality and heavily inspired by 3D high quality scene on cafe or cowboy restaurant"

- 00:07 UTC: "it is not saloon it is red dead redemption game scene and visualization and presentation quality and heavily inspired by 3D high quality scene on cafe or cowboy restaurant"

## The game (decided, Team G builds the logic)
- Name on screen: **ROSTER RUSSIAN ROULETTE**.
- When: every season, after Career Start (season 1) / after the previous season, **before the transfer window**.
- A seven-chamber revolver: 6 empty, 1 bullet. Each manager spins once (Daniel first, then Nik). Empty = click, safe.
- If it fires, the bullet **always hits one player on that manager's board** (random, 1 of 15). That player must be released in the real FIFA 17 save. The bullet hits the board, never a person. Not gory.
- Each manager **holds a board** shaped like the FIFA 17 squad screen (Nik's 3 screenshots in attachments/HO-040/): a green pitch with the **starting XI** (shirt, rating, name) and **one row of 4 substitutes** below. No reserves.
- Boards are real data (all 98 clubs). Team G renders names, ratings and shirts in code on top of your art, so the board frames need a clean flat area for the pitch and the sub row.

## What we need from Team V
1. **Desktop mockup NEXT_ROULETTE** and **phone mockup PHONE_ROULETTE** (upright), the usual way (GPT image tickets, your lanes).
   - **NOT a saloon (Nik 00:07 UTC).** A Red Dead Redemption game scene: RDR2 visual and presentation quality, high-quality 3D, set in a **cafe or cowboy restaurant**, warm lamplight, a seated man at the table (the dealer) with the revolver.
   - Characters: **fresh, original** Western characters in that style. Do not copy Arthur Morgan, John Marston or any real RDR character's face, outfit or logo (same copyright line as the crests). If Nik and Daniel appear as the two board holders, follow the likeness ticket rules.
   - Desktop keeps the top bar and music dock. Phone keeps the bottom bar. Nothing covers anything; no dimming (HO-027); Reus Gate loading.
2. **Layered assets for the animation** (Team G wires them): background plate (1X/2X webp like the V2 plates), the revolver cylinder with **seven visible chambers** as its own layer so code can spin it, a safe "click" state, a non-graphic muzzle flash plus a bullet trail that lands on one bubble of a board, and the two board frames (held in hands) with the flat pitch area.
3. A short layout note: where each board sits, where the SPIN / PULL TRIGGER button sits, and where the result line goes (one line in the layout, like the commentary strip).

## Not in this ticket
- The game logic, Firebase and squad data (Team G).
- A board-editing screen for later seasons (not decided yet).

## Done when
Nik approves NEXT_ROULETTE and PHONE_ROULETTE, and the layered assets are on a branch with a platemap, then sent back to Team G.
