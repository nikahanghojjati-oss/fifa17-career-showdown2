# B7: League Roulette men-free rooms in each premium clubhouse (r100 lead 2026-11-24 19:13 UTC; HO-097 kind).
# Two Astra assets per clubhouse (rule zero: one asset = one ticket): the upright phone room and the 16:9 desktop room,
# both WITHOUT the men. Code derives the rest: TALL (Duet, as HO-097 did), SIDEWAYS (Duet, from the men-free desktop),
# desktop V4 with the men placed apart (B7: Wooden V4 men pixels laid on the men-free painting).
# Usage: python3 mk_lr.py OUTDIR   (reuses the LOOK/M words of mk_full.py)
import os, sys, re
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "mk_full.py")).read()
src = src[:src.index("ORDER = []")].replace("OUT = sys.argv[1]; FIRST = int(sys.argv[2]) if len(sys.argv) > 2 else 104", "")
exec(src)
OUT = sys.argv[1]
for _k in M: M[_k]["counter"] = M[_k]["counter"].replace(" and of the dark suits", "").replace(" and of the two men", "")
LOOK["SILVER"]["name"] = "Platinum Clubhouse"  # HO-161: display name Platinum; key and files stay silver
LOOK["SILVER"]["art"] = LOOK["SILVER"]["art"].replace("Silver =", "Platinum (key silver) =")
VRAW = "https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/claude/project-thread-ie3afv/project-documents/hc-art/ho097/"
DESK_ID = {"SILVER": "HO-107", "BLACK": "HO-126", "MATTE": "HO-145"}
KINDS = {
 "phone": dict(name="League Roulette room without the men, phone upright", asset="ENV_BOX_PHONE_V4_{lk}_P1", size="1179x2096",
   img1="the Wooden men-free phone room `visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V4.webp` (1179x2096, from HO-097), raw: " + RAW + "visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V4.webp",
   keep="Keep in the same places and at the same sizes: the window with the night stadium, the crowd and the green pitch exactly as they are, the window frames, the counter rail, with the counter edge at exactly the same height. Everything below the counter edge stays a plain, calm stone surface in the same material as the counter.",
   room="Walls and panels: {wall}. Frames: {frame}. Lamp metal: {metal}; shades stay warm cream and lit. The rail becomes {rail}. Counter: {counter}.",
   frame_words="Same tall 9:16 framing as image 1, nothing cropped or extended at any edge, largest size available.",
   check="overlay test: the counter edge and the window sit exactly where they were"),
 "desk": dict(name="League Roulette room without the men, desktop", asset="ENV_BOX_PLATE_EMPTY_{lk}_P1_2X", size="3072x1728",
   img1="the Wooden men-free desktop room `ENV_BOX_PLATE_EMPTY_HC_V4_2X.webp` (3072x1728, Team V's own HO-097 output), raw: " + VRAW + "ENV_BOX_PLATE_EMPTY_HC_V4_2X.webp",
   keep=D["BOX"]["keep"],
   room=D["BOX"]["room"],
   frame_words="Same 16:9 framing as image 1, nothing cropped or extended at any edge, largest size available.",
   check="overlay test: the thin rail along the top of the counter and the window sit exactly where they were"),
}
index = []; n = 0
for kind in ("phone", "desk"):
    for lk in ("SILVER", "BLACK", "MATTE"):
        n += 1; K = KINDS[kind]; L = LOOK[lk]; asset = K["asset"].format(lk=lk)
        sw = f"REF_BOX_{lk}_SWATCH.webp"; ready = lk == "SILVER"
        p = f"""Image 1 is the picture to edit. Image 2 shows only the finished materials and light of this same room in this clubhouse; match its materials, colours and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself. There are no people in this room; keep it empty of people.

{K['keep']} The middle of the picture stays calm and uncluttered: a large roulette board will sit there.

The room: {L['feel']}
{fill(K['room'], lk)}

Light: {light(lk, True, False)}

{D['BOX']['objs'] if kind == 'desk' else 'Objects keep their identity and their own colours and are relit by the new room.'}

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, no people.

{K['frame_words']}"""
        img2 = (f"  2. Image 2, `{sw}`: the people-free swatch Team G cut from the finished {DESK_ID[lk]} Directors' box painting, raw: {REFRAW}{sw}" if ready else
                f"  2. Image 2, `{sw}`: the people-free swatch Team G cuts from the finished {DESK_ID[lk]} Directors' box painting and posts at {REFRAW}{sw}. **Do not start this ticket until it is there**; Team G posts it within the hour after {DESK_ID[lk]} is DONE.")
        md = f"""### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
League Roulette set, ticket {n} of 6 (r100 lead 2026-11-24 19:13 UTC): the men-free room HO-097 made for League Roulette, now painted in each premium clubhouse so no recoloured room ships next to painted ones. Same deadline as the full set: **DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: {L['art']} Match the approved paintings of this clubhouse, above all the finished Directors' box ({DESK_ID[lk]}), which is the same room. No men in this picture at all, so no likeness risk.

### What
- **Clubhouse:** {L['name']} (Settings key `{L['key']}`). **Room:** {K['name']}.
- **Attach exactly these two files, in this order:**
  1. Image 1, {K['img1']} (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old recolour.
{img2}
- **Save the result as:** `{asset}` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as image 1 ({K['check']}); no person or trace of a person anywhere; calm middle; night, warm lamps in the same places; the look matches {DESK_ID[lk]}; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from image 1. Max 3 tries.

### Prompt
```
{p}
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/{L['key']}/` on your branch: the raw Astra output (PNG, untouched) **and** `{asset}.webp` aligned to image 1 at {K['size']}, plus a line in `SHA256.json`.
- Do not delete or replace any existing plate.

### After DONE (Team G)
{'The phone builder (Duet) turns it into ENV_BOX_PHONE_HC_V4 (+590W) and builds the TALL version in code, as HO-097 did.' if kind == 'phone' else 'B7 lays the Wooden V4 men (placed apart, HO-097 part 2) back on it for ENV_BOX_PLATE_HC_V4 (1920, 1X, 2X); the phone builder (Duet) derives ENV_BOX_SIDEWAYS_HC_V4 from it.'} Faces stay pixel-identical to Wooden. Then it goes on the board for Nik.
"""
        title = f"Premium League Roulette room {n}/6: {L['name']}, {'phone upright' if kind == 'phone' else 'desktop'}, no men"
        fn = f"LR{n}_{L['key']}_{kind}.md"
        open(os.path.join(OUT, fn), "w").write(md)
        index.append((fn, title))
open(os.path.join(OUT, "ORDER.txt"), "w").write("\n".join(f"{f}\t{t}" for f, t in index) + "\n")
print("wrote", len(index))

# --- CLUB SIDEWAYS (r100 lead 2026-11-24 19:30 UTC): ENV_CLUB_SIDEWAYS_HC_V4 is its own composition (window on the left,
# one tall panel with a single pennant on the right), not a crop of the CLUB desktop, so it needs its own painting per look.
CLUB_DESK = {"SILVER": "HO-110", "BLACK": "HO-129", "MATTE": "HO-148"}
club = []
for i, lk in enumerate(("SILVER", "BLACK", "MATTE"), 1):
    L = LOOK[lk]; asset = f"ENV_CLUB_SIDEWAYS_{lk}_P1"; sw = f"REF_CLUB_{lk}_SWATCH.webp"
    p = f"""Image 1 is the picture to edit. Image 2 shows only the finished materials and light of this same room in this clubhouse; match its materials, colours and light exactly, and copy nothing else from it.

Keep image 1 exactly the same in camera, framing and layout. Change only the materials and finish of the room itself. There are no people in this room; keep it empty of people.

Keep in the same places and at the same sizes: the two wall lamps with pleated shades along the top, the wide window on the left with the floodlit stadium, the two leather armchairs and the low table under the window, the tall wall panel on the right with the one hanging pennant banner, the gold trophy and the old leather ball on the low shelf at the lower right, and the counter strip along the bottom at exactly the same height.

The room: {L['feel']}
The wall panels become {M[lk]['wall']}. The back wall below the window becomes {M[lk]['wall']}. The window frames become {M[lk]['frame']}. The low shelf becomes {M[lk]['shelf']}. The banner rod and lamp arms become {M[lk]['metal']}; the shades stay warm cream and lit. The floor becomes {M[lk]['floor']}. The counter strip becomes {M[lk]['counter']}.

Light: {light(lk, True, False)}

{D['CLUB']['objs']}

Finish: real materials as a set builder would make them, handcrafted, with clean sharp detail; the air is clear, with no fog, no glow halo, no noise grain, no streaks and no swirl or crackle patterns: every texture is a straight real one. No new objects and no extra lamps anywhere, no text, no logos, no people.

Same wide framing as image 1 (about 2.16:1), nothing cropped or extended at any edge, largest size available."""
    md = f"""### Read this first
For Team V and Nik. One asset, one ticket, one new chat. Do not upload this ticket to ChatGPT.
**Route:** ChatGPT Work mode, **Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses).
Club room sideways set, ticket {i} of 3 (r100 lead 2026-11-24 19:30 UTC). The sideways phone Club room is its own picture, not a crop of the desktop Club room, so it needs its own painting in each premium clubhouse. Same deadline as the full set: **DONE before the 3.0 freeze, Mon 30 Nov noon Boston.**
Art direction: {L['art']} Match the approved paintings of this clubhouse, above all the finished desktop Club room ({CLUB_DESK[lk]}). No people in this room.

### What
- **Clubhouse:** {L['name']} (Settings key `{L['key']}`). **Room:** Club room, phone sideways.
- **Attach exactly these two files, in this order:**
  1. Image 1, the Wooden plate `visual-assets/v10_1/plates-hc/ENV_CLUB_SIDEWAYS_HC_V4.webp` (2532x1170), raw: {RAW}visual-assets/v10_1/plates-hc/ENV_CLUB_SIDEWAYS_HC_V4.webp (convert to PNG if ChatGPT refuses WebP). Never attach a previous try or the old recolour.
  2. Image 2, `{sw}`: the swatch Team G cuts from the finished {CLUB_DESK[lk]} Club room painting and posts at {REFRAW}{sw} (the same one the Club phone ticket uses). **Do not start this ticket until it is there**; Team G posts it within the hour after {CLUB_DESK[lk]} is DONE.
- **Save the result as:** `{asset}` (exactly one asset).

### Steps
1. New chat in Work mode, Astra 6, Extra High. Attach as above.
2. Paste the prompt below exactly. If ChatGPT offers a rewrite, reply `No, use my prompt exactly.`
3. Check: same framing as image 1 (overlay test: the counter strip and the window sit exactly where they were); no people; night, warm lamps in the same places; the look matches {CLUB_DESK[lk]}; no fog, halo, noise, streaks, text, logos or new objects.
4. Save, or retry in a new chat from image 1. Max 3 tries.

### Prompt
```
{p}
```

### Deliver
- Folder `project-documents/hc-art/ho-premium-full/{L['key']}/` on your branch: the raw Astra output (PNG, untouched) **and** `{asset}.webp` aligned to image 1 at 2532x1170, plus a line in `SHA256.json`.
- Do not delete or replace any existing plate.

### After DONE (Team G)
The phone builder (Duet) turns it into `plates-hc/{L['key']}/ENV_CLUB_SIDEWAYS_HC_V4.webp`. No men, no mask. Then it goes on the board for Nik.
"""
    fn = f"CLUBSIDE{i}_{L['key']}.md"; open(os.path.join(OUT, fn), "w").write(md)
    club.append((fn, f"Premium Club room sideways {i}/3: {L['name']}, phone sideways"))
open(os.path.join(OUT, "ORDER_CLUB.txt"), "w").write("\n".join(f"{f}\t{t}" for f, t in club) + "\n")
print("wrote club", len(club))
