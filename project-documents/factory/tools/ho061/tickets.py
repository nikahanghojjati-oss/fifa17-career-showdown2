"""Writes the one ticket file for HO-061 (job 1851): 17 GPT clean-up pictures."""
BR = "claude/project-thread-kxgun9"
RAW = f"https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/{BR}/project-documents/factory/tickets/attach/HO061"
SCENE = {
    "HOME": "the stadium stands and floodlights seen through the tall lounge windows, the gold pillars and window frames, the lounge plants, lamps and leather furniture",
    "CONNECT_PLAYERS": "the black-marble tunnel walls with their gold light strips and plain marble wall panels, continuing the perspective toward the stadium",
    "CLUB": "the dark marble walls, gold shelves and the stadium seen through the windows",
    "FINAL_WINNER": "the black marble columns, the stadium stands with warm lights, and falling gold confetti",
    "LEAGUE": "the stadium stands full of fans and the rings of gold floodlights",
    "LEGACY": "the hall of lit trophy cabinets, dark marble walls and gold trims",
    "RIVALRY": "the stadium stands full of fans and the rings of gold floodlights",
    "SEASON_RESULTS": "the stadium stands and floodlights; at the bottom corners the gold railing and the black marble ledge",
    "STANDINGS": "the gold-lit marble walls and pillars and the dark stadium sky",
    "STATISTICS": "the night city seen through the windows, dark marble walls and gold shelves",
    "TRANSFER": "the dark marble wall, the night city and the stadium seen through the windows, and the polished marble desk",
    "TROPHY_ROOM": "the trophy hall walls with lit glass cases, dark marble and gold trims",
    "RULE_BOOK": "the library bookshelves full of books, lit with warm gold lights, and the marble columns",
    "RIVALRY_PHONE": "the stadium stands full of fans and the rings of gold floodlights",
    "HOME_PHONE": "the polished black-and-gold marble floor with its reflections, and the lounge walls and windows at the sides",
    "CONNECT_PLAYERS_PHONE": "the polished black-and-gold marble floor with its reflections, and the gold-lit tunnel walls at the sides",
    "LEGACY_PHONE": "the polished black-and-gold marble floor with its reflections, and the trophy cabinets at the sides",
}
ITEMS = [(k, f"GUIDE_{k}_CLEAN.png", "Desktop") for k in
         ["HOME", "CONNECT_PLAYERS", "CLUB", "FINAL_WINNER", "LEAGUE", "LEGACY", "RIVALRY", "SEASON_RESULTS",
          "STANDINGS", "STATISTICS", "TRANSFER", "TROPHY_ROOM", "RULE_BOOK"]]
ITEMS += [("RIVALRY_PHONE", "GUIDE_RIVALRY_PHONE_CLEAN.png", "Phone"),
          ("HOME_PHONE", "GUIDE_HOME_PHONE_SMALLER.png", "Phone"),
          ("CONNECT_PLAYERS_PHONE", "GUIDE_CONNECT_PLAYERS_PHONE_SMALLER.png", "Phone"),
          ("LEGACY_PHONE", "GUIDE_LEGACY_PHONE_SMALLER.png", "Phone")]


def prompt(k):
    extra = ""
    if k == "HOME_PHONE":
        extra = " Finish both of Nik's shoes (the man on the right): the bottom of his trouser legs ends in polished black leather lace-up shoes standing on the floor, matching his other shoes and Daniel's."
    elif k.endswith("_PHONE") and k != "RIVALRY_PHONE":
        extra = " Both men keep their full legs and their own shoes exactly as they are."
    bars = ("Keep the black bars at the left and right pure black." if k.endswith("_PHONE")
            else "Keep the black bars at the top and bottom pure black.")
    return (
        "I am attaching a picture that has solid cyan boxes on it. Paint over each cyan box with the scenery that would really be behind it, "
        "so the boxes disappear and nobody could tell anything was there.\n\n"
        f"What belongs inside the cyan areas: {SCENE[k]}. Continue the existing perspective, the black-and-gold marble and the warm golden lighting. "
        "Photo-real, sharp and detailed, the same sharpness and grain as the rest of the picture: never blurry, never smudged, never painted-looking.\n\n"
        "Never draw inside the old cyan areas: no banners, no flags, no signs, no posters, no plaques, no name tags, no words, no letters, no numbers, "
        "no slogans, no logos and no crowns. Do not add new people." + extra + "\n\n"
        "Keep everything that is not cyan exactly as it is: the same two men, same faces, same hair, same hands, same pose, same clothes, same framing. "
        "Daniel stays on the LEFT and Nik on the RIGHT, never flipped. No dark overlay, no dimming, no vignette, no blur. "
        f"No cyan may remain. {bars}"
    )


FIX = ("Wrong: some cyan areas still show words, a banner, a sign or a blurry patch. Paint every old cyan area again as the real scenery behind it, "
       "sharp and photo-real, with no banners, signs, words, letters or crowns. Keep everything else exactly as it is.")

L = ["# Job 1851 · HO-061 · 17 clean-up pictures (slogans out, smaller phone faces)", "",
     "Each picture repaints only the cyan boxes. Claude then keeps ONLY the repainted boxes and leaves every other pixel of the "
     "real background untouched, so faces and layout cannot move.", "",
     "## How to run each picture", "",
     "1. Open a **new normal ChatGPT chat outside any project** (not a Temporary Chat). Use a brand-new chat for every picture.",
     "2. Open the guide link in Safari, press and hold the picture, **Save to Photos**, then attach it. The right file has solid cyan boxes on it.",
     "3. Paste that picture's prompt exactly. If ChatGPT asks a question, reply: `No, use my prompt exactly.`",
     "4. Check it: no cyan left; no words, banners, signs or crowns where the boxes were; the filled parts are **sharp** (not blurry); both men are the same, Daniel LEFT.",
     "5. If it passes, drop it in Claude's thread with the code shown (for example `1851 HOME`). If it fails, paste the fix line once; if it still fails, start a new chat (up to 3 tries).",
     "", "Fix line (paste once if needed):", "", "```", FIX, "```", ""]
for i, (k, f, kind) in enumerate(ITEMS, 1):
    L += [f"## {i} of {len(ITEMS)} · {kind} · {k.replace('_', ' ').title()} · code `1851 {k}`", "",
          f"Guide: [{f}]({RAW}/{f})", "", "```", prompt(k), "```", ""]
open("project-documents/factory/tickets/TICKET-1851C_HO061_CLEAN_PLATES.md", "w").write("\n".join(L))
print(len(ITEMS), "pictures")
