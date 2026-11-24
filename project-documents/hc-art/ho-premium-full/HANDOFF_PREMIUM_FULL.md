# Premium full set HO-104..160: handoff to the next thread (24 Nov 2026, 12:35 p.m. Eastern)

Nik asked (24 Nov 12:32 p.m. Eastern) for a separate thread to finish the rest of the premium background repaints. Everything needed is here.

## Goal
57 Astra repaints of the Wooden plates for three clubhouses, each at least 9/10 before accepting (Nik's rule). All DONE before the 3.0 freeze, **Mon 30 Nov noon Eastern**.
- **Platinum** (was "Silver"; renamed by Nik 24 Nov, relayed as HO-161): HO-104..122. Files and folder still say SILVER/silver.
- **Metallic Black**: HO-123..141. **Premium Matte Black**: HO-142..160.

## State now
- DONE: 104 Office, 105 Hall, 106 Archive (v3 + arch fix), 107 Directors' box.
- WORKING (startable): 108-114, 123-133, 142-152.
- WAITING on Team G's swatch from the finished desktop room (still SENT): phone tickets 115-122, 134-141, 153-160. When G sends swatches, add them to the run sheets (need the IMG1 phone source + REF swatch) and mark WORKING.

## How Nik runs it
Nik works on iPhone: give GitHub links only. He opens a **new ChatGPT chat per ticket (Work mode, Astra 6, Extra High)**, attaches Image 1 + Image 2 and pastes the prompt from the run sheet:
- [RUN_SHEET_SILVER.md](RUN_SHEET_SILVER.md) (Platinum, prompts updated with the Archive lessons, ec33bfed2)
- [RUN_SHEET_BLACK.md](RUN_SHEET_BLACK.md), [RUN_SHEET_MATTE.md](RUN_SHEET_MATTE.md)
He posts the picture in the thread; you score it.

## Scoring + saving (tools/)
1. Copy the upload to `/tmp/claude-0/in/NNN_tryK.png`.
2. `python3 tools/align.py NNN_tryK.png src/IMG1_<plate>.png NNN_tryK_aligned.webp` (ORB affine; Astra lands ~1.000 scale, <1 px; check the printed affine and the `.cmp.jpg` side by side). Zoom crops at full size on walls, marble and men.
3. At 9/10: `bash tools/done.sh <silver|black|matte> <SAVE_NAME> NNN_tryK HO-NNN "note"` → saves RAW png + aligned webp + SHA256.json in `<club>/`, commits/pushes this branch, sets HO DONE with handoff.py on leads/relay, runs feed_sync, pushes leads/relay. Scripts assume this branch is checked out at `/home/user/work`, leads/relay at `/home/user/relay`, and work files in `/tmp/claude-0/in` (edit paths if yours differ).
4. **No relay wakes** (never run triggers/sessions for relay). Nik pastes "relay HO-NNN" into Team G himself.

## Astra lessons (judge by these)
- Platinum = bright platinum that still reads as night: brushed platinum-leaf squares like the pilot ref, pale grey-white marble with fine dark veins, polished nickel, warm lamps, shadow only in far corners. Never beige/taupe/brown, never a dark room (Nik rejected a darker Archive).
- AI tells to reject: swirl/worm texture on walls, crackle or cracked-ice marble, cloudy stone, haze/halos, invented lamps or objects.
- Fix with ONE small change per follow-up in the same chat; name a real straight texture (brushed grain, herringbone, slate) or point to another surface ("the same calm stone as the counter"). Never ask Astra to remove texture (goes plastic). At 9/10 stop editing.
- Matte: directional weaves (herringbone flannel, slate) beat felt/suede. Metallic Black: watch for invented pillar lamps.
- Men must stay identical; Team G composites the men back, V never composites.
