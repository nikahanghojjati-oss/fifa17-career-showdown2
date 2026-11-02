# Ticket 1846 · 1 of 1 · Select League phone background clean-up (ENV_LEAGUE_PHONE_V5)

One image only (one asset, one ticket). Nik's pick 17 Oct: a new League phone picture. The live game now has a 15% smaller wheel and the two men moved so their faces are clear of it (V4). V4 is already safe to ship; this ticket only makes the background behind the men look natural again: in V4 the stadium crowd between the men is a little smeared sideways and the round plinth is bigger. The men themselves must not change (Claude puts the exact V4 men back afterwards, so their place and faces stay exactly as they are).

1. Open a **new normal ChatGPT chat outside any project** (not a Temporary Chat; it cannot make pictures).
2. Attach this one file only: **LEAGUE_PHONE_V4_FOR_GPT.png**. On iPhone open https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/tickets/attach/LEAGUE_PHONE_V4_FOR_GPT.png in Safari, press and hold the picture, then Save to Photos. It is a tall picture of you and Daniel in a golden stadium, with no title and no buttons.
3. Paste the prompt below exactly. If ChatGPT asks a question or offers to change it, reply: `No, use my prompt exactly.`
4. Check the picture:
   - Daniel on the LEFT, Nik on the RIGHT, same place, same size, same pose, not flipped, not dimmed
   - NO wheel, NO title, NO buttons, NO words anywhere
   - the crowd and floodlights between the men look like a real stadium (no smeared or stretched streaks)
   - tall phone shape, same framing, nothing cropped
5. If it passes, download it and drop it into the Team V lead thread with the words `1846 LEAGUE`. If it fails, paste the fix line once in the same chat; if it still fails, start again in a brand-new chat (up to 3 tries).

Fix line (paste once if needed):

```
Wrong: keep both men exactly where and how they are and do not add a wheel, title, buttons or words. Only repaint the stadium behind and between them as a clean, sharp golden night stadium. Same tall phone shape and framing.
```

Prompt:

```
I am attaching a tall phone background picture of two men in a golden night stadium. Keep both men EXACTLY as they are: same faces, same hair, same hands, same suits, same pose, same size and the same position in the picture, same natural lighting, never dimmed. The man on the LEFT stays on the left and the man on the RIGHT stays on the right, never flipped. Do not add any people.

Only improve the background behind and between them: the stadium crowd and floodlights between the two men look smeared and stretched sideways. Repaint that area as a clean, sharp, premium golden night stadium: warm floodlights, crowd bokeh, gold banners, continuing the existing perspective. The round black marble plinth with gold veins in the centre stays, with a flat empty top and nothing standing on it; make it a natural size for the scene. Keep the polished black marble floor with gold veins at the bottom.

This is an empty background: no wheel, no ring, no dial, no football, no league names or symbols, no title or logo, no buttons, no cards, no panels, no menus, no numbers and no words of any kind. No blue tint, no glass panels, no neon. Keep the same tall phone shape and exactly the same framing, nothing cropped.
```

## For Claude (on return)
Likeness and position lock: align the result to ENV_LEAGUE_PHONE_V4 (1179x2096), keep V4 pixels inside both men's mattes (HO-032_V4 tools, about 6 px feather) and take the new pixels only for the background; check the wheel area, plinth and edges blend; export ENV_LEAGUE_PHONE_V5.webp q88; face zones = PHONE_FACE_ZONES_V4 LEAGUE (unchanged); re-run the HO-032 swap check at the 4 sizes; send Team G the sha.
