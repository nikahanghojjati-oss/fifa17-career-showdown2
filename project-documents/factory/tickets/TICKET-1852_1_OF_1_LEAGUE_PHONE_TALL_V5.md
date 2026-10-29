# Ticket 1852 · 1 of 1 · Select League phone background for TALL phones (ENV_LEAGUE_PHONE_TALL_V5)

One image only (one asset, one ticket). Team G's hand-off HO-044 (29 Oct): tall Android phones (412x915, 384x854, 360x800, 340x960) still show the old stadium picture on Select League, because the approved phone picture (V5, 9:16) would cut off the men's faces when it is stretched to cover a taller screen. We need the same picture made taller (9:20): the men and the stadium between them stay exactly as they are, only the edges grow (more sky and roof above, more marble floor below, a little more stadium at each side). Claude puts the exact V5 middle back afterwards, so the men's faces stay pixel for pixel the same.

1. Open a **new normal ChatGPT chat outside any project** (not a Temporary Chat; it cannot make pictures).
2. Attach this one file only: **LEAGUE_PHONE_V5_TALL_FOR_GPT.png**. On iPhone open https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-t9jat5/project-documents/factory/tickets/attach/LEAGUE_PHONE_V5_TALL_FOR_GPT.png in Safari, press and hold the picture, then Save to Photos. It is the tall golden stadium picture of you and Daniel with a bright pink border around it; the pink is the part ChatGPT must paint.
3. Paste the prompt below exactly. If ChatGPT asks a question or offers to change it, reply: `No, use my prompt exactly.`
4. Check the picture:
   - Daniel on the LEFT, Nik on the RIGHT, same place, same size, same pose, not flipped, not dimmed
   - NO pink left anywhere; the new edges look like the same stadium continued (sky and roof above, marble floor below, stands at the sides)
   - NO wheel, NO title, NO buttons, NO words anywhere; no new people
   - very tall phone shape (taller than before), nothing from the middle cropped or moved
5. If it passes, download it and drop it into the thread "Hunt and fix visual bugs" with the words `1852 LEAGUE TALL`. If it fails, paste the fix line once in the same chat; if it still fails, start again in a brand-new chat (up to 3 tries).

Fix line (paste once if needed):

```
Wrong: do not change anything inside the original picture and do not add a wheel, title, buttons, words or people. Only paint the pink border so it becomes more of the same stadium: night sky and roof lights above, polished black marble floor with gold veins below, more stands at the two sides. Keep the whole canvas, same very tall shape, no pink left.
```

Prompt:

```
I am attaching a very tall phone picture. In the middle is a finished picture of two men in a golden night stadium; around it is a bright pink border. Keep the middle picture EXACTLY as it is, pixel for pixel: same two men, same faces, same hair, same hands, same suits, same pose, same size and same position, same natural lighting, never dimmed, never flipped (the man on the LEFT stays left, the man on the RIGHT stays right). Do not add any people.

Paint ONLY the pink border so that the picture simply continues outward, in the same perspective and the same warm golden light:
- above: more of the dark night sky with soft clouds and the top of the stadium roof with its floodlights
- below: more of the polished black marble floor with gold veins, with its reflections, continuing to the bottom edge
- left and right: a little more of the stadium stands, crowd bokeh and gold banners

No pink may remain. The join between the middle and the new edges must be invisible. This is an empty background: no wheel, no ring, no dial, no football, no league names or symbols, no title or logo, no buttons, no cards, no panels, no menus, no numbers and no words of any kind. No blue tint, no glass panels, no neon. Keep the whole canvas at exactly the same very tall shape (9 wide by 20 tall), largest size available, nothing cropped.
```

## For Claude (on return)
Position lock: scale the result to 1179x2620 (aspect must match within 1%); paste the exact V5 plate (Lanczos 0.879, 1036x1842) back at (71,389) per `attach/LEAGUE_PHONE_V5_TALL_zones.json` with a 6 px inward feather, so only the border pixels come from GPT; check the four joins and the floor reflections blend; export `visual-assets/v10_1/plates-v5/ENV_LEAGUE_PHONE_TALL_V5.webp` (q88 method 6, under 400 KB; if over, q84). Face zones = V5 LEAGUE zones mapped through the transform: Daniel [0.1396, 0.2807, 0.2834, 0.3660], Nik [0.7159, 0.2792, 0.8590, 0.3643] (each face 14.0% in from its side, as HO-044 asks). Render at 412x915, 384x854, 360x800 and 340x960 with cover centre-top plus the 0.85 wheel circle (HO-032 swap check) and confirm the faces are clear; then a PR into gameplay/r86 (or r87 if r86 is closed) with the plate and a note on the HO-044 ticket with the sha.
