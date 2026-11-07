# Where the site still looks prompted
Date: 7 November 2026
From: outside read-only pass. Nothing in the game was changed by this note.
Audience: Team G lead. One job: make the live night look handcrafted. Not a new mechanic.

Live at time of writing: `2.2.0-r89` (commit `2fe8d2f`, release PR #1254).
Source read: `js/chamberMenScene3d.js`, `js/chamberMenStadium3d.js`, `js/rosterRoulette.js`.

## The split

Only two ceremonies are WebGL. Everything else is CSS marble, gold, type, and pictures drawn in code.

| What the player sees | How it is built | How it reads |
|---|---|---|
| Home, Settings, History, Legacy, Trophy Room, Rule Book, Season Results, Gazette, commentary | CSS. Studio Small Axe 40/40. | A polished gold dashboard. The fussiness is real. The material is still the default "premium football" prompt. |
| League wheel, Club Assignment, Special Player, Prime Pack, Transfer War | CSS stages and cards. | The mechanic is a law. The screen is a themed panel with labels. |
| Chamber Men | `js/chamberMenScene3d.js` plus `js/chamberMenStadium3d.js`. three.js r187. | The one place that tries to be a broadcast. It still announces itself as generated. |
| Russian Roster Roulette picture | three.js r187, shared with Chamber Men (`visual-assets/v10_1/roulette/vendor/three-r187.min.js`). The rules live in `js/rosterRoulette.js` and are not the problem. | A gold object in a dark hall. Camera polish does not make it a prop from a studio. |
| No WebGL2, slow load, or a fault | SVG marble goal stays. The 3D mount returns null. | The player falls back into the prompted picture. |

There is no post stack. No `EffectComposer`. Antialias is on. Shadows and tone mapping exist. That is a lit scene, not a finished shot.

## Chamber Men, exactly

`js/chamberMenScene3d.js` says what it is. A gold-framed goal, a faceless polished-gold statue keeper, a ball drawn as an icosahedron, under the roulette's lounge EXR (`ENV_LOUNGE_V1.exr`), in a dark marble hall. The SVG goal stays in the page on top of the canvas. Its art is hidden. Its gold border and the words LEFT / MIDDLE / RIGHT stay, moved over the 3D goal.

`js/chamberMenStadium3d.js` builds the night around that: pitch stripes in a shader, a knotted net, LED boards with "never a word or a logo," a two-tier stand, and a moving card crowd. Textures are painted by `tools/chamber-men-assets` (numpy and Pillow). About 1.3 MB on a phone, 2.6 MB on a desktop. No GLTF players. Kits are colour numbers (`home`, `away`) on generated maps. The keeper in the hall file is still a lathed body: smooth head, no face, gold yoke.

These are the tells, in the order a stranger sees them:

1. A gold statue in a marble hall is the prompt. A broadcast penalty is a man in a kit, on grass, at night. The hall and the statue have to go for any Showdown that can load the stadium. Do not keep both looks.
2. The SVG frame and the three words sitting on the canvas mark it as a web page with a 3D insert. The choice is part of the ground, or it is not there. Do not float LEFT / MIDDLE / RIGHT in a gold border over the goal.
3. The lounge HDRI is the wrong sky. A night match has floodlights, a black sky, and a dim crowd. One environment, built for this ground. Not the roulette room's light.
4. The crowd is cards. From the penalty spot that reads as a texture sliding on a box. A handcrafted stand is a mass of dark shapes with a few scarves and a reaction when the net moves. Not faces of real people. Not a grid of rectangles.
5. The boards are empty gold diamonds. Empty "premium" boards look generated. Put our own marks, short, few, and the same ones every season. Never a real sponsor. Never a paragraph.
6. The kit is a pinstripe drawn on a lathe. Cloth needs a seam, a collar that is a separate piece, wrinkles at the dive, and grass stain only on the keeper who has already dived. All 98 clubs stay. The pattern is the club. The cloth is shared.
7. The ball's seams are a math trick on an icosahedron. Keep the 32-panel ball. Scuff it. A new ball every kick looks rendered. A ball with one dirty panel looks used.
8. Geometry is boxes, capsules, and spheres under `MeshPhysical`. That is correct for a goal frame and a ball. It is wrong for a head, a hand, and a boot if they stay smooth gold. Model those three pieces. Leave the posts as geometry.
9. No grade on the shot. A handcrafted frame has one grade: slightly crushed blacks, floodlight falloff, a net that softens when it is not the focus. Do not add bloom on the gold. Do not add a vignette strong enough to notice. If Reduce Motion is on, the grade stays and the clocks stay stopped. That behaviour is already required. Do not break it.
10. The fallback SVG is the old prompted goal. When WebGL fails, show the same pitch as a still frame of this scene, not a different marble illustration. One art direction, two qualities.

## Roulette, exactly

The spin is already a law. Both phones agree. The picture is still a ceremonial gold gun in the dark. That object is what image models draw for "premium chance."

Make it a prop from this night, not a symbol of chance.

- One cylinder the size of something a person could hold. Chambers you can count before it spins. Empty and live must be readable with the motion off.
- The same night light as the penalty, or a tight table light. Not the marble hall and not a second gold world.
- The camera move that already settles, from the drum to the shot, is the right idea. One move. Then still. No orbit. No loop.
- The player who is hit is a name and a shirt on the board behind the cylinder, not a new gold card.

## The screens that are not 3D, and should mostly stay that way

Do not put a WebGL scene behind Home, History, the Rule Book, or Settings. A handcrafted product is quiet where the player is reading and physical where the player is performing. Three.js on a menu is how a prompt shows off.

What still looks generated there, and the fix:

- One gold treatment on every panel. Gold marks the live choice, the points just earned, or the winner. Resting panels are paper, cloth, or dark paint. Marble is the room, once, on Home. It is not a texture on the gazette.
- The brush wordmark fighting the line above it. One name. No kicker glued to it.
- Crests drawn as glossy badges with the same bevel. Draw them flatter, like cloth patches. Different outlines are already there. The shared plastic shine is the tell.
- Prime Pack as four equal cards and a sentence of rules. One masked shirt. The stage is a clock, not a label. The face stays hidden until the guess window is real.
- Transfer War as a dashboard. The clock is the object. The signing is the second line. Nothing else competes.
- Season score plaques that glow as a reward for existing. They light once, in order, then rest. Already specified. Hold that. A loop is the prompt.
- Helper text under a control that already has a name. Cut it. If the screen is unclear without it, the object is wrong.

## What "over the years" means in the files

A stranger cannot see the git history. They can see wear, restraint, and one grammar.

- One camera language. Penalty: behind the taker, low, still until the kick. Roulette: one settle. Nowhere else moves in 3D.
- One night. Same grass, same floodlight colour, same sky, in both WebGL scenes. If the two scenes look like two products, it looks assembled by prompts.
- Wear in three places only: the ball, the six-yard box, the keeper's gloves. Not dirt on every surface.
- Type set like a broadcast lower-third. Two sizes on a playing screen. The 12px floor stays on anything the player must read.
- Motion ends. Reduce Motion is a still of the finished pose, not a different page.
- No new dependency that the service worker cannot cache. The roulette vendor file is the engine. Do not add a second three.js.

## Do not

- Do not restyle all screens in one pull request. Do the penalty until a still frame could be mistaken for a broadcast graphic. Then match the roulette light to it. Then strip gold off Home until the room is quiet.
- Do not copy EA Sports FC, a real kit manufacturer, a real face, or a real board logo.
- Do not put the Small Axe badge on the scene.
- Do not change the scoring law, Sacked, Spark, pairing, or saved Showdowns to get a better picture.
- Do not remove the SVG fallback until the still-frame fallback exists.

## Done

A still of the penalty, shown for five seconds, with no explanation.

- Still prompted: "AI stadium." They mention gold, a statue, or floating words.
- Handcrafted: "A penalty." They name the taker, the keeper, or the net. They do not mention the website.

Then the same test on Home. If Home still shouts and the penalty is quiet and specific, the site finally has a hierarchy. That is the whole job.
