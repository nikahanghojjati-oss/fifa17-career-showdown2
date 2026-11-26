# HO-081 · Team G → Team V · Roulette hand repainted from the shooter's eye (two plates)

```ticket
{
 "id": "HO-081",
 "from": "G",
 "to": "V",
 "title": "Roulette hand repainted from the shooter's eye (two plates)",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-6kfnkn ca06b2277 project-documents/hc-art/ho081/"],
 "log": [{"at": "2026-11-15T07:42:32Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-15T07:49:47Z", "by": "V", "status": "RECEIVED", "note": "Team V lead: writes Astra prompts (Work mode Astra 6 XH), Nik runs, lead checks + cuts + measures plate numbers"}, {"at": "2026-11-15T08:08:15Z", "by": "V", "status": "DONE", "note": "Nik OK 15 Nov 3:08 a.m. Eastern. RR_HAND_POV_W_V1 1672x941 bore 22.5deg, RR_HAND_POV_P_V1 941x1672 bore 72deg, alpha WebP no fringe, glove large; plate numbers in HO081_PLATE_NUMBERS.json (muzzle, boreRear, wrist, elbow, cutEdges). Forearm ~32-33% (asked 35/40%). No hammer-down frames."}],
 "from_session": "session_01GU43Q6ycny5YqAKEeZjFWZ",
 "sessions": {"G": "session_01GU43Q6ycny5YqAKEeZjFWZ", "V": "session_01GU43Q6ygGHrAsJfLkNSMzY"}
}
```

### Why (Nik 2026-11-15 06:59 UTC)
"keep the hand painting, or have it repainted from the shooter's eye? which ever looks better and more realistic". Team G's Fable study picked the repaint: from the shooter's eye the barrel runs into the picture toward the board on every screen; today's side-on plate cannot do that, and today's painted gun (brass, engraved) is not the revolver on the table.

### Ask (two plates, optional two more)
| | Wide plate `RR_HAND_POV_W` | Upright plate `RR_HAND_POV_P` |
|---|---|---|
| Used when | window wider than about 1.15 : 1 | narrower |
| Size, format | 1672x941, transparent WebP, edge pixels glove or metal colour (no dark fringe) | 941x1672, same |
| Bore on the plate | rising to the upper left at 24° ± 2 | rising at 72° ± 3, leaning left |
| Sleeve leaves through | right and bottom edges only; forearm continues at least 35% of plate width past the wrist | bottom edge only; forearm at least 40% of plate height |
| Layout reference | attachments/HO-081/pov_desktop.jpg, right panels | attachments/HO-081/pov_phone.jpg, right panel |

Both: the shooter's own RIGHT hand seen from his eye (back of the glove toward us, thumb beside the hammer, index finger into the guard); same brown leather glove and dark wool cuff as today's plate (attachments/HO-081/hand_marked.png, ingame_1920x866_light.jpg); the TABLE's revolver: blued steel frame and barrel, nickel fluted cylinder, red-brown wood grip, brass grip frame and trigger guard; hammer cocked; barrel foreshortened to about half its side-view length; one warm low lamp from the front left, soft; no glow, no blur, no background, no rim light. Must look like a frame from a real film, not generated. Team G mirrors it in code for Daniel.
Optional (worth it, +0 draws): a hammer-down frame of each, same registration.

The pov_*.jpg frames are a 3D stand-in for layout only (angle, size, where the barrel points), not the look.


### Nik's must-have (2026-11-15 07:45 UTC)
"I like the hand and glove ... I want it to be there." The gloved hand is the hero of these plates, not just the gun. In the 3D stand-in frames (pov_*.jpg) the hand barely shows; that is NOT what we want. On both plates the brown leather glove (back of the hand, knuckles, thumb, wrist) and the dark wool cuff must be clearly visible and large: the glove covers at least as much of the plate as the revolver, the gun sits IN the hand, not in front of it. Same glove and cuff as today's plate (hand_marked.png). Reject any try where the glove is hidden, tiny or cut off.

### Deliver
The webp files plus measured plate numbers on the final art: muzzle point, rear of bore, bore angle, wrist and elbow pivots, cut edges (pixels). Team G drops them into platemap.json in a small data PR; the motion build already reads every number from there.

### Accept when
- Bore angle within tolerance; muzzle and sleeve edges as above; no fringe on the dark room.
- The gloved hand is clearly visible and large (at least as much of the plate as the gun); glove and cuff match today's.
- Gun matches the table revolver.
- Reads as filmed at 1920x866 and 390x844 in the room.
