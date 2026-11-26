# HO-055 · Team G → Team V · Story Home tile: film-reel tile art TILE_STORY_V1.webp (r88)

```ticket
{
 "id": "HO-055",
 "from": "G",
 "to": "V",
 "title": "Story Home tile: film-reel tile art TILE_STORY_V1.webp (r88)",
 "kind": "art",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude-visual/story-film-reel @ 78917ec6 - TILE_STORY_V1.webp/.png + previews"],
 "log": [{"at": "2026-11-02T17:23:48Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-02T17:33:31Z", "by": "V", "status": "DONE", "note": "Art ready on claude-visual/story-film-reel: TILE_STORY_V1.webp (512 RGBA q88) + TILE_STORY_V1.png master in visual-assets/v10_1/shared/art/home-tiles/. Previews + notes in project-documents/factory/reviews/STORY_TILE/. Phone: the 44 px bar does not fit under the grid at 393x660 today (tab bar covers it); G owns that layout."}, {"at": "2026-11-02T18:34:56Z", "by": "G", "status": "DONE", "note": "Art merged into gameplay/r88 via PR #1208; phone bar fits above the tab bar at 393x660 in r88's layout"}],
 "sessions": {"G": "session_01GU43Q5K146UxtLxFthrm2k"}
}
```

# Team V ticket: STORY Home tile art (film reel)

From: Team G (thread "Build the Story home tile"), for the release after 2.0.0 (r88)
Asked by: Nik, 2026-11-02
Status: art request only. Team G builds the tile, its screen and all text.

## What we need
One new Home tile icon for a new tile, **STORY** ("How the Showdown was built").
It opens a short screen about how the game was made, with a link to the full history site.

## The object
A premium cinematic **film reel** with a short, gently curved strip of film. One object, nothing else.
- Dark metal reel, restrained antique-gold edges, subtle wear, warm controlled highlights, deep charcoal.
- Three-quarter view, compact, clear round silhouette, readable at small phone size (about 60 to 76 px).
- Same family as the other Home tile icons (Tactics, History, Statistics, Rule Book, Settings, Trophy).
- No text, letters, numbers, logos, crests, people, faces, trophies, player cards, scenery, floor, poster background or big glow.
- The film strip must not look like a reward or a player card.

## Files (same pipeline as the other tiles)
- `visual-assets/v10_1/shared/art/home-tiles/TILE_STORY_V1.webp`: 512 x 512, real alpha (RGBA), quality 88.
- The full-size PNG master kept alongside, as with the other tiles.
- Existing tiles for reference: `TILE_RULEBOOK_V1.webp`, `TILE_HISTORY_V1.webp` (512 x 512 RGBA).

## Where it shows
- Desktop: one tile in the Home row, the icon in the lower-right of the tile, like Rule Book.
- Phone: the tile's final shape depends on Nik's placement pick (pending). If it is a slim full-width bar, the icon sits at the right end at about 44 px tall.
- Please send a small-size preview on the Home tile background.

## Out of scope
No change to any other tile, manager art, the Home plate or the music player.
Team G uses a plain placeholder until this lands and will not ship STORY without V's art unless Nik says otherwise.

## Delivery
Push to a `claude-visual/…` branch or open a PR, and tell Team G's lead the branch and file names.

## Team V delivery (2 Nov 2026, 12:40 p.m. Eastern)
- Branch `claude-visual/story-film-reel` @ 78917ec6 (off main 00ae2b72). Only new files, nothing else changed.
- `visual-assets/v10_1/shared/art/home-tiles/TILE_STORY_V1.webp` (512 x 512 RGBA, q88, 47 KB) and `TILE_STORY_V1.png` (master, 1236 x 1236 RGBA).
- Previews and notes: `project-documents/factory/reviews/STORY_TILE/` (README.md, PREVIEW_DESKTOP_1440.jpg, PREVIEW_DESKTOP_TILE_ZOOM.jpg, PREVIEW_PHONE_393.jpg).
- Desktop: Rule Book's tileArt rule works as is. Phone: a 44 px bar under the grid is covered by the tab bar at 393 x 660 today; the preview moved the grid up 54 px. Your layout call.
- Product truth (Nik 2 Nov: Team G lead now owns it): please confirm the tile name, text and placement are yours to set; the art carries no text.
