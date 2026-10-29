# HO-047 · Team V → Team G · Sounds for Russian Roster Roulette: eight real cues that drop into platemap.json sfx

```ticket
{
 "id": "HO-047",
 "from": "V",
 "to": "G",
 "title": "Sounds for Russian Roster Roulette: eight real cues that drop into platemap.json sfx",
 "kind": "build",
 "priority": "normal",
 "worker": "sol-work",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-29T22:54:49Z", "by": "V", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q5sYPRm7BBmhFhnbcd"
}
```

# HO-047 · Sounds for Russian Roster Roulette (Team V → Team G)

**From:** Team V (thread "Make Russian Roster Roulette screen") · **Date:** 29 Oct 2026 · **Requested by:** Nik ("ask the lead to make matching sounds for the scene as well")

## What this is
The Russian Roster Roulette screen (HO-040, `visual-assets/v10_1/roulette/`, branch `claude/project-thread-6rq94x`) plays its sound cues from a small synthesizer in the page today. Nik wants real, matching sounds. The page already loads recordings when they exist: list them in `visual-assets/v10_1/roulette/platemap.json` under `"sfx"` and the file replaces the synthesized cue of the same name. No code change on our side.

```json
"sfx": { "spinStart": "assets/sfx/spin_start.mp3", "felt": "assets/sfx/felt.mp3", "click": "assets/sfx/click.mp3", "cock": "assets/sfx/cock.mp3", "heart": "assets/sfx/heart.mp3", "dry": "assets/sfx/dry.mp3", "bang": "assets/sfx/bang.mp3", "splinter": "assets/sfx/splinter.mp3" }
```

Format: mp3 (or ogg/wav), mono or stereo, 44.1 kHz, peak at -1 dBFS, no silence at the start (the cue must land on the frame). Keep every file short; the longest (bang) under 2 s. Royalty-free or made in-house; note the source in the PR.

## The cues, in the order the turn plays them (seconds from the start of a turn, desktop timing)
| Name | When | What it should sound like |
| --- | --- | --- |
| spinStart | 0.35 | the revolver spun on green felt: a short metal-on-cloth whirr that fades over about 2.5 s as the gun slows and stops pointing at a board |
| felt | 0.4-3.0 (a few times, volume 0-1 passed in) | soft rub of steel on felt as the gun turns |
| cock (crane) | 3.3 | the crane swings the cylinder out: a small steel clank |
| click | 3.75-10.55, many times, faster then slower, then 11.4 and 11.9 | ONE ratchet click of the cylinder passing a chamber. It plays up to ~14 times a second at the start of the spin and once a second at the end, so it must be a single clean tick (20-40 ms), no tail. The same file plays at 11.4 (crane shuts) and 11.9 (bolt locks) |
| heart | 8.2 and 13.1 | three slow heartbeats (about 1.5 s), low and felt more than heard: the anticipation while the drum crawls to its stop, and again while the hand aims |
| cock (hammer) | 12.9 | the hammer pulled back on a single-action revolver: the classic multi-click (Colt "C-O-L-T"), about 0.4 s |
| bang | 14.1 | the shot, close and big: a sharp crack with a low thump, then the room's echo (marble cafe, 1 to 1.5 s). This is the hero sound |
| dry | 14.1 (click turn) | hammer falls on an empty chamber: a dry metallic snap, no echo tail |
| splinter | 14.22 (after a shot) | the bullet hits the wooden squad board 2 m away: wood crack and splinters, a little paper tear |

Also wanted if you can (new names; we will wire them when they arrive): `handUp` at 12.2 (leather glove creak + cloth as the hand rises from the dark), `roomTone` (a 20-30 s loop: quiet cafe, oil-lamp hiss, far street, no music; loops under the whole screen at low volume).

## Where the cues come from
`index.html`, search for `SFX.play(`. The beats table is `const B=` (spin .35, spinEnd 3.0, close 3.3, inside 11.4, turnC 11.9, hand 12.2, cock 12.9, aim 13.1, fire 14.1, end 16.9). Reduced-motion users get the short table and the same names.

## Evidence
- Desktop turn: `visual-assets/v10_1/roulette/evidence/TURN_DESKTOP_1536x864.mp4` (silent; the timings above match it)
- Phone turn: `visual-assets/v10_1/roulette/evidence/TURN_PHONE_393x660.mp4`

## For Team G
Produce or source the eight files, add the `"sfx"` block to platemap.json, and PR into the branch that carries HO-040 (or into the r87 integration branch once HO-040 is received). Reply with the source of each sound.
