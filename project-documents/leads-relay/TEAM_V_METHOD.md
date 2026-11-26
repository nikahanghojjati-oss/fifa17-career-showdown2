# Team V method: premium clubhouse paintings (handoff to Claude Duet, 25 Nov 2026)

Written by the Team V lead after 57 premium repaints plus the extras (HO-098..181). Tools, run sheets and every finished file live on branch `claude/project-thread-ie3afv` under `project-documents/hc-art/ho-premium-full/` (start file `HANDOFF_PREMIUM_FULL.md`, scripts in `tools/`).

## 1. Mode and prompt template
- **ChatGPT Work mode, Astra 6, Extra High.** One new chat per asset. Never reuse a chat for a different picture; use the same chat only for a one-line fix of the picture it just made.
- **Attachments, in order:** Image 1 = the Wooden plate to edit (PNG; convert WebP first). Image 2 = a people-free reference of the approved look (a pilot cut or a swatch from a finished sibling room). Never attach a previous try, and never attach outside photos (cars, products): Astra copies their objects and logos. Describe those references in words instead.
- **Nik is on an iPhone:** give him GitHub blob links to the PNGs and the prompt in a code box. A run sheet per clubhouse (`RUN_SHEET_<LOOK>.md`) with links + box per ticket works best.
- **Prompt order (keep it):** (1) Image 1 is the picture to edit, Image 2 only shows materials and light, copy nothing else from it. (2) Keep camera, framing, layout. (3) Keep the two men exactly (faces, hair, suits, hands, pose, size, position). (4) Keep-in-place list naming every object, window, lamp and the counter rail height. (5) "The room:" one line of mood, then each surface -> one named real material. (6) Light: night, same lamps only, where light pools and where it falls off, colour limits. (7) Objects keep identity and colours. (8) Finish: real set-builder materials, clear air, no fog/halo/grain/streaks/text/logos/new objects/extra lamps. (9) Same framing, nothing cropped, largest size.
- Say what TO make, not only what to avoid. Astra reads every word literally.

## 2. Scoring and pass mark
- **Pass = 9/10 or better, every picture** (Nik's rule). Plus Team G's bar for the look (HO-173 for Matte: real luxury materials, unmistakably this clubhouse and not a sibling, rich not flat, every big surface changed, accents small, clean craft, "private members' club at night").
- Check in this order: (a) align to Image 1 (`tools/align.py`, ORB affine; Astra lands at scale ~1.000 and under 1-2 px; reject anything that changes aspect, zoom or crop); (b) men identical (crop faces at 2x next to Wooden); (c) look side by side with the approved sibling clubhouse rooms; (d) 2x crops of walls, stone, metal for AI texture; (e) numbers for colour rules (e.g. Matte wall saturation under ~0.12 away from lamp pools; no specular pixels > ~230 on matte metal).
- Score honestly in one line per issue. 8 or 8.5 = one fix, not acceptance.

## 3. Most common redo reasons (and the wording that fixed them)
- **Swirl / worm / maze texture** on walls (felt, suede, leaf): name a straight real texture: "fine straight brushed grain", "fine herringbone wool flannel, regular V rows like suit cloth". Never write "smooth / no texture" (goes plastic).
- **Cracked-ice or jagged marble:** "a few long, smooth, softly curving grey veins that flow gently across the slab like brush strokes, no jagged, broken or cracked lines", or "the same calm stone as the counter".
- **Colour bleed from Wooden** (khaki, brown, beige): add a Colour lock paragraph: every surface the target colour, "none of image 1's wood colour survives", lamps warm only a small pool.
- **Chrome / glints on a matte look:** "brushed satin titanium with a soft, dull, even sheen, no bright line".
- **Flat, evenly lit rooms:** "each lamp casts a soft warm pool on the wall around it, fading to deep charcoal".
- **Invented lamps / sconces / objects:** "no extra lamps"; in rooms with no lamps, drop every lamp line and say "this room has no lamps".
- **Round pillars with teardrop reflections, foil/crinkle slate:** "keep the exact square shape, flat faces, one thin straight hairline per corner"; "slate flat like honed blackboard".
- **Framing drift on phone plates** (aspect change, 16% zoom, counter pushed down, extra tile row): pin the layout in numbers ("rail at 58% of the height, no extra panel rows") and crop Image 2 to the band or a materials-only strip so Astra cannot copy its layout.
- **Stadiums redrawn in windows:** lay the original Image 1 stadium pixels back inside each pane by code (RAW stays untouched; say so in the DONE note).

## 4. From GPT to the repo
1. Nik posts the picture; copy it untouched as `<NAME>_RAW.png`.
2. `tools/align.py raw.png IMG1.png out.webp` resizes to Image 1's size and warps onto it (affine, Lanczos), saving WebP q88 + a side-by-side `.cmp.jpg`.
3. Sizes: desktop rooms 3072x1728, Loading 3840x2160, phone plates 1179x2096, sideways as the ticket says. No manual cropping: alignment does it.
4. Name exactly as the ticket's "Save as" (e.g. `ENV_BOX_PLATE_SILVER_P1_2X`). Folder `project-documents/hc-art/ho-premium-full/<look>/` (Platinum's key is still `silver`), RAW png + aligned webp + a line each in that folder's `SHA256.json`.
5. `tools/done.sh <look> <NAME> <tryfile> HO-NNN "note"` saves, commits, pushes the branch, sets the ticket DONE with `handoff.py` (evidence = branch, SHA, path) and runs `feed_sync.py`. Never composite the men back: Team G does that.

## 5. What a new painter would miss
- **One change per follow-up edit.** Several fixes at once make Astra redraw the whole picture and lose what was right. At 9/10, stop editing.
- **Fresh chat beats arguing.** After 2 failed fixes in a chat, start a new chat from Image 1 with the better prompt; if a surface still won't change, use a people-free cut of an already-approved sibling room as Image 2 plus "make the X look exactly like image 2".
- **Each clubhouse has a light rule Nik set:** Platinum = bright platinum that still reads as night (not dark, not daytime); Metallic Black = polished black and gold; Matte = neutral graphite velvet with satin titanium, never brown. Write the look's rule into every prompt, not just the first.
- **Tunnels, archives and other lamp-less rooms** need their own light line, or Astra invents sconces or turns them near-black.
- **Swatches gate phones:** phone tickets wait for Team G's swatch cut from the finished desktop room; always download Image 2 fresh, since swatches get re-cut under the same name.
- **Nik approves the pilot first** (one Board Room + one Home per new look) before the rest are run; lock the look there, then copy its winning wording into every prompt.
- **Nik never fades hair or skin and never wants dim filters;** check face and hair outlines at 2x before showing him anything.
- **Phone and sign-in repaints (lesson 26 Nov, HO-174..181):** start a phone or a hard Matte room from an already approved sibling picture of the same room as Image 1 (it carries the right framing and furniture), then send a short colour-and-weave-only follow-up edit if the look is off.
