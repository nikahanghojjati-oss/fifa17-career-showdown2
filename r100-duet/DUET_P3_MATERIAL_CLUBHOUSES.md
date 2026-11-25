# Duet job P3: material clubhouses (Ruby, Emerald, Lapis), with Duet as both Team V and Team G

Model: Opus 5.5, high effort or above. This is SENSITIVE work: the theme script and plates load at startup, so a mistake can flash, cover a face or break a screen. Never use Sonnet or Haiku for it, including in sub-teams.

Picked by Nik on 2026-11-25, 06:56-07:01 UTC. In his words: Duet does the whole job itself, as the Team V lead and its workers AND the Team G lead and its workers. It writes the GPT image prompts, Nik generates the pictures in ChatGPT and gives them back, and Duet scores, redoes, cuts, wires, checks and ships. You may run your own sub-teams (for example a V desk and a G desk). Everything happens in Duet.

## Budget, clock and what ships
- **Budget:** about $400 of Duet credit. **Clock:** stop by Thu 26 Nov, 5 PM Boston (22:00 UTC). Stop at whichever runs out first, and post a REPORT with where each clubhouse stands.
- **Ships in 3.0 only if it is merged and proven before Sat 28 Nov, 8 PM Boston** (Sun 29, 01:00 UTC; the 3.0 build cut line). A clubhouse that misses this stays on its branch for after launch. Never rush one in half-done.
- **Order:** each clubhouse finishes FULLY (painted, wired, checked, PR green, Nik's board OK) before the next one starts.
  1. **Ruby:** Rosso Levanto marble, oxblood leather, rosewood, antique gold. Palette #2A0A10 / #6E1423 / #9B2335. Key `ruby`.
  2. **Emerald:** malachite, bottle-green leather, walnut, satin brass. Palette #0B2E22 / #145A3C / #2E8B57. Key `emerald`.
  3. **Lapis:** ultramarine lapis lazuli with gold flecks. Palette #10204A / #1F3A93, gold #C9A24D. Key `lapis`.
- **Names:** players never see the word "Premium" anywhere. Nik is picking the display names on a card. Until the desk passes them on, use placeholders `Ruby Clubhouse`, `Emerald Clubhouse` and `Lapis Clubhouse`, and say they are placeholders in each PR.

## Who's who
- **Repo:** nikahanghojjati-oss/fifa17-career-showdown2. **Base branch:** `gameplay/r100`, but start each clubhouse branch only once B7's `claude-gameplay/r100-premium-only` has merged into it (it adds the panel marble tile, the premium manifest and the scripted loading room, which the new keys need too). The desk tells you when that has happened.
- **You (Duet):** you write the prompts, score and redo the pictures, cut and deliver the files, wire them, run the checks, build the board and open one PR per clubhouse into `gameplay/r100`. You never merge.
- **The r100 lead** (Team G lead: r100 (2)) merges and decides priority and merge questions. **B7** ("Make the clubhouses premium") built the Platinum/Black/Matte pipeline and answers how-it-was-done questions. Both reach you only through the mailbox.
- **Nik** generates every picture in ChatGPT from your prompts and gives you the results. He judges each clubhouse on your board.
- **Mailbox:** `r100-duet/DUET_MAILBOX.md` on this branch, the same rules as P1. Questions, FLAGs and REPORTs go under "To desk". The desk relays to the lead and B7.

## Read first
1. `r100-duet/p3/b7-kit/PIPELINE_FOR_NEW_CLUBHOUSES.md`: B7's full pipeline (tickets, wiring, new key, proof). It is the backbone of this job. Its `/mnt/project-files/...` paths are copied to `r100-duet/p3/b7-kit/` on this branch.
2. `r100-duet/p3/b7-kit/mk_tickets.py`, `mk_full.py`, `mk_lr.py`, `mk_signin.py`: B7's prompt generators. Each takes an output folder as argv[1]. Add a LOOKS entry per clubhouse with feel, walls, stone, metal, floor, ceiling, sofa, light and a **Colour lock** (copy the shape of `mk_signin.py` LOOKS["MATTE"]).
3. `r100-duet/p3/b7-kit/examples/`: finished Matte tickets of every kind (desktop room, phone band, League Roulette phone and desktop, Club sideways, sign-in desktop and phone). Match their structure and wording.
4. leads/relay `project-documents/leads-relay/handoffs/HO-173_*.md`: **the premium bar** (Nik 2026-11-25 01:05 UTC: "must truly look premium"). Also `attachments/ho-premium-full/MATTE_COLOUR_STUDY.md`, which shows how a colour study and colour lock were done.
5. **`r100-duet/p3/teamv-kit/TEAM_V_METHOD.md`**: Team V's exact method after 57+ premium repaints (copied from leads/relay 170ca0b1). **It wins over anything below that differs.** The same folder holds their `align.py`, `save2.py` and `RUN_SHEET_MATTE.md` (a finished run sheet to copy the layout from). Wooden source PNGs (Image 1) are already converted on Team V's branch `claude/project-thread-ie3afv`, under `project-documents/hc-art/ho-premium-full/src/IMG1_*.png`. Link those, and convert any that are missing yourself.
6. Skills: **showdown-astra-image-prompts** (route, prompt rules, scoring) and **showdown-likeness-image-ticket** (one asset per ticket, edit from the source, never an edit of an edit). Their rules are summarised below in case they don't load for you.
7. `tools/clubhouse-themes/` on gameplay/r100 (paint.py, panel_tiles.py, pin.py, manifest.py, matte_check.py, finish.py, masks/), plus your own P1 work in paint.py.

## Step 0, before any prompt: prove you can take Nik's pictures in
Ask Nik for one test picture (any ChatGPT image). Then:
- If you can find the attached file on disk, commit it to `claude-duet/p3-intake/inbox/` and delete it again. That proves the path.
- **If you can't read attachments:** tell Nik in one line and use this path. Nik saves each picture to his phone or Chromebook, opens `https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/upload/claude-duet/p3-intake/inbox` in the browser, drops the files in and taps "Commit changes". You then fetch the branch. Create that branch with an `inbox/README.md` first so the link works.
- **Every picture name** is the asset ID you gave in its prompt box (e.g. `ENV_HOME_PLATE_RUBY_P1_2X.png`). Ask Nik to rename only if the tool lets him. Otherwise match by order and say which file is which before using it.

## The V side: you are the Team V lead and its workers
**Route:** ChatGPT **Work mode, Astra 6, Extra High** (Sol 6.1 Work mode only if Astra refuses). Normal or incognito chats can't make images.

**Per picture, one asset = one ticket = one NEW chat** (TEAM_V_METHOD §1). Reuse a chat only for a one-line fix of the picture it just made.
1. **Attachments, in order:**
   - Image 1 = the Wooden plate to edit, as a PNG.
   - Image 2 = a people-free reference of the APPROVED look of this clubhouse: the pilot cut for desktop rooms, the swatch for phones.
   - Never attach a previous try, another clubhouse's painting or any outside photo (cars, products), because Astra copies their objects and logos. Describe outside references in words.
2. **Prompt in ONE fenced box, in Team V's order:**
   1. Image 1 is the picture to edit; Image 2 only shows materials and light, copy nothing else.
   2. Keep camera, framing, layout.
   3. Keep the two men exactly (faces, hair, suits, hands, pose, size, position).
   4. Keep-in-place list naming every object, window, lamp and the counter-rail height.
   5. "The room:" one line of mood, then each surface as one named real material.
   6. Light: night, same lamps only, where light pools and falls off, colour limits.
   7. Objects keep identity and colours.
   8. Finish: real set-builder materials, clear air, no fog/halo/grain/streaks/text/logos/new objects/extra lamps.
   9. Same framing, nothing cropped, largest size.
   Say what TO make before what to avoid: every "no X" gets a positive target in the same sentence.
3. **Every prompt carries:**
   - **(a) The clubhouse's Colour lock paragraph:** exact base colours from the palette above, "none of image 1's wood colour survives", and lamps warm only a small pool.
   - **(b) The clubhouse's LIGHT RULE**, written into EVERY prompt, not just the first. Fix it in the colour study and get Nik's OK with the pilot. Start from these:
     - Ruby: deep oxblood and red marble at night, rich not pink, antique gold small.
     - Emerald: deep green stone and leather at night, never mint, brass small.
     - Lapis: deep ultramarine at night, never royal-blue plastic, gold flecks small.
   - **(c) The fix wording from Team V's redo list (TEAM_V_METHOD §3) where the room needs it:**
     - straight real textures only, never "smooth";
     - calm long marble veins, never cracked ice;
     - square pillars;
     - "this room has no lamps" for tunnels, archives and other lamp-less rooms;
     - a numeric framing lock on phones (for example "rail at 58% of the height, no extra panel rows"), with Image 2 cropped to a materials-only strip.
4. Nik pastes it. If ChatGPT offers a rewrite, he replies `No, use my prompt exactly.`

**Run sheet for Nik (he is on an iPhone):** keep one `RUN_SHEET_<LOOK>.md` per clubhouse under `project-documents/hc-art/material-clubhouses/<key>/`, in the layout of `teamv-kit/RUN_SHEET_MATTE.md`. For each ticket it has:
- a heading;
- GitHub **blob** links (plus raw links) to Image 1 and Image 2 PNGs;
- "Saves as <ASSET_ID>";
- one code box with the prompt;
- the score and notes of each try.
In the mailbox, give the desk ONE BATCH at a time: the pilot's 2, then the desktop rooms, then the phones. The desk hands Nik a link to the run sheet section plus a short copy box. Nik returns the pictures in the same order.

**Scoring (TEAM_V_METHOD §2).** **PASS = 9/10 or better for EVERY picture** (Nik's rule). An 8 or 8.5 means one more fix, never acceptance. Check in this order:
1. **Align to Image 1** with `align.py`. Reject any change of aspect, zoom or crop. Astra lands at scale ~1.000 and under 1-2 px.
2. **Men identical:** face crops at 2x next to Wooden.
3. **Side by side** with the approved sibling rooms of this clubhouse.
4. **2x crops** of walls, stone and metal for AI texture.
5. **Numbers:** the colour rules from your `<key>_check.py`.
6. **Bar:** the HO-173 premium bar (real luxury materials, unmistakably this clubhouse and not a sibling, rich not flat, every big surface changed, accents small, clean craft, "private members' club at night").

Score honestly, one line per issue, and tell Nik each score in one line.

**Redo loop (TEAM_V_METHOD §5):**
- ONE change per follow-up edit ("Keep this image exactly the same. Change only: ...").
- At 9/10, stop editing.
- After 2 failed fixes in a chat, open a NEW chat from Image 1 with the better prompt.
- If a surface still won't change, use a people-free cut of an already-approved sibling room of THIS clubhouse as Image 2, plus "make the X look exactly like image 2".
- Max 3 fresh chats per asset, then FLAG it in the mailbox with the best try and what fails.
- Once Nik OKs a pilot, copy its winning wording into every later prompt of that clubhouse.

**Lessons:** after each result, note under P3 in the mailbox if Astra read a word in an unexpected way: the words, what it did, and the fix. The desk passes good lessons on for the skill.

**V worker steps per picture (TEAM_V_METHOD §4).** First copy `teamv-kit/align.py` and `save2.py` into your own tools folder and fix their paths. They have Team V's container path `/home/user/work/...` written in, and save2 must write to `project-documents/hc-art/material-clubhouses/<key>/`. Skip done.sh, handoff.py and feed_sync.py: you never write leads/relay. Then:
1. Copy Nik's picture untouched as `<NAME>_RAW.png`.
2. Run `align.py raw.png IMG1.png out.webp`. It resizes to Image 1's size, warps onto it (ORB affine, Lanczos) and saves WebP q88 plus a side-by-side `.cmp.jpg`. No manual cropping: alignment does it.
3. **Sizes:**
   - desktop rooms 3072x1728;
   - Loading 3840x2160;
   - phone plates 1179x2096;
   - Club sideways 2532x1170;
   - sign-in as in mk_signin.
4. Name it exactly as the ticket's "Saves as". Keep RAW png + aligned webp + a SHA256.json line each (save2.py), committed on your clubhouse branch.
5. Never composite the men back at this stage: paint.py does that on the G side.
6. If a window's stadium got redrawn, lay the original Image 1 stadium pixels back inside each pane by code. RAW stays untouched; say so in the run sheet.
7. **Swatches gate the phones:** cut a people-free swatch `REF_<ROOM>_<LOOK>_SWATCH.webp` from each finished desktop painting. Take full height at the widest mask-free column run of `masks/ENV_<ROOM>_PLATE_HC_V3_1920.png`, 12 px in from each side, x1.6, WebP q90. Re-cut it under the same name if the desktop room is redone.

## Paintings per clubhouse (about 24)
- **Pilot first:** HOME and BOARD desktop (mk_tickets). **Stop and get Nik's OK on the pilot on the board before writing any more tickets** (that's how Matte avoided a full wrong-colour set).
- **Full set (mk_full):**
  - 8 desktop rooms: OFFICE HALL ARCHIVE BOX COACHES TUNNEL CLUB LOADING;
  - the material slab;
  - 10 phone bands: HOME BOARD OFFICE HALL ARCHIVE BOX COACHES TUNNEL CLUB LOADING. Each phone band uses the swatch from its desktop room.
- **League Roulette and sideways (mk_lr):**
  - the empty League Roulette desktop (no men): `ENV_BOX_PLATE_EMPTY_<LOOK>_P1_2X`;
  - the League Roulette phone V4;
  - CLUB SIDEWAYS.
  - BOX SIDEWAYS is derived in code from the empty desktop room with your P1 cut (0, 60, 3072, 1596).
- **Sign-in lounge (mk_signin):** `ENV_SIGNIN_PLATE_<LOOK>_P1_2X` (3072x1728) and `ENV_SIGNIN_PHONE_<LOOK>_P1` (1179x2096).

## Colour study and numeric bar, per clubhouse (before the pilot)
Write `project-documents/hc-art/material-clubhouses/<key>/COLOUR_STUDY.md`. It holds:
- the palette and real-material references in words;
- where the warm lamps may show and where gold or brass belongs;
- the numeric limits you will check.

Make a `<key>_check.py` from matte_check.py with limits that fit the material:
- **Glint:** polished marble, malachite and lapis may reflect more than matte graphite, but never as stray hot spots. Calibrate against the Platinum and Black numbers in matte_check's notes.
- **Hue:** hue and saturation in the palette's range; Wooden brown must not survive.
- **Difference:** mb/mw-style difference against every existing clubhouse, so it's unmistakably new.
- **Richness:** spread and detail at least Wooden's.

Passing the numbers is necessary but not sufficient. Your eye check against HO-173 and Nik's OK on the board still decide.

## The G side: wiring, checks, PR (B7's pipeline, sections 2-4)
1. Masters go in `tools/clubhouse-themes/paintings/`. Add the look to paint.py THEME/NAME/PHONE/LOOKS.
2. Run in order:
   1. `paint.py`: lays the Wooden men back through the masks; checks faces and sizes.
   2. `panel_tiles.py`: add the key to BAND.
   3. `pin.py`.
   4. `manifest.py`: the premium-only manifest; its contract fails on any unlisted file.
3. **Never ship a build.py recolour** for a new key.
4. **New key in the game:** everywhere B7's section 3 lists:
   - index.html: theme script regexes, `use()`, the BASE map, the `html[data-clubhouse=...]` blocks. Then re-pin index.html in v10-foundation-contracts.
   - service-worker.js: the panel-tile precache lists and THEMED_LOADING_PATH; r86 R99_ADDED, r87 w.added.
   - js/settings.js SETTINGS_CLUBHOUSE_THEMES: placeholder name plus one line on the materials.
   - js/ruleBook.js: the clubhouse sentence.
   - finish.py: the UI finish (panels, frames, buttons in the clubhouse's materials).
   - Every test that lists keys: r99-clubhouse-themes, flash-gate-always, the v10 flash audits, the r91 old-art audit.
5. **Faces:** 0 changed pixels inside the mask before WebP encoding. Decoded drift ≤3 levels with 4x crops against Wooden in the PR.
6. **Size:** each plate within +10% of its Wooden plate. Smaller is fine if a 2X eye check shows no banding. Any bigger exception needs the lead's OK through the mailbox.
7. **Never add startup bytes** beyond the theme script lines (the startup gzip budget is nearly full).

## Proof on each PR's exact head
- **Contracts:** r99, v10-foundation (F9c, F10), r86, r87 rollback, reus-gate-startup, static-app-release, final-polish (startup gzip budget), v10-home.
- **Flash in EVERY clubhouse** (Wooden, Platinum, Metallic Black, Matte and each new key) **after every art or startup change.** Use `CMS_CLUBHOUSE=<key> npm run -s test:v10-flash` with Chrome 153 (`CMS_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/real/chrome-linux64/chrome`) and a static server on 4701, as B7's file says. If you can't run a browser, say so and rely on the Gate's run.
- **Old-art audit:** `CMS_CLUBHOUSE=<key> node tests/browser/r91-old-art-audit.cjs` passes with no A4/A5.
- **Quality tiers:** every gfx tier (js/gfxTier.js) shows the painted rooms, never a recolour.
- **Board for Nik:** 5 screens x 4 sizes (1920x866, 1920x1035, 390x844, 844x390) per clubhouse, plus the sign-in lounge. Publish it as one page Nik can open on his phone, as a claude.ai artifact if you can make one, otherwise an image sheet on the branch linked from the PR. Nik OKs the look before merge.
- **Gate:** keep the PR a DRAFT until it's truly ready (drafts skip the Gate), then mark it ready in ONE push. Merge the base only when GitHub shows a real conflict. Hold pushes when the lead asks. Add `@codex review` when it's ready, or say if Codex is out.
- **Image links:** put plain file paths in a PR comment. The desk turns them into links. Never rewrite earlier parts of a PR body.

## Never
- Never touch `main`, the version, the Rules, Firestore (production or emulator writes outside tests), or the service worker's version line.
- Never change a Wooden plate or any face pixel. Never dim, tint or blur the managers, and never let anything cover a face, a hand or a button.
- Never use "Premium" in any text a player sees.
- Never push to `claude-duet/phone-rooms` (P1 is final at 635f8a6f).
- Never write to leads/relay. You don't need Team V tickets: Nik runs your prompts himself.
- No backward compatibility work (pre-launch rule).

## Report (under "To desk")
```
P3 report: <key> | stage: study / pilot / full set / wired / PR #NNNN head <sha8> | pictures: <n accepted>/<n total>, avg score <x>/10, redos <n> | Gate: <state> | flash: <keys passed> | faces: 0 px pre-encode, decoded max <x> | sizes: <range vs Wooden> | spend so far: ~$<n> | next: <one line> | needs Nik: <prompts batch / board OK / nothing>
```
