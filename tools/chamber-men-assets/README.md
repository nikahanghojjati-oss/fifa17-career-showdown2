# Chamber Men stadium kit

Loaded by `js/chamberMenStadium3d.js` (`window.CareerModeChamberMenStadium`), three.js r187 (the vendored build), no extra
loaders. Units metres, Y up, goal line z 0, goal centred on x 0, pitch toward +z (105 x 68), penalty spot z 11. Same axes as
`js/chamberMenScene3d.js`.

```js
const kit=await CareerModeChamberMenStadium.load(THREE,{phone});   // phone ~1.4 MB, desktop ~2.9 MB of WebP
const s=CareerModeChamberMenStadium.build(THREE,kit,{phone,posts:"white"|"gold",home:0x670e36,away:0x6cabdd,aniso});
scene.add(s.group);
// each frame: s.update(seconds, excitement)   excitement 0 waiting, ~.5 run-up, 1 goal (crowd bounces, arms up)
// on a goal:  s.hitNet(x, y, speed)           the back net bulges at (x, y) and settles
// s.ball (the match ball mesh), s.goal.back (net sheet), s.crowd (InstancedMesh), s.dispose()
```

What it builds (about 50-60 draw calls, ~60k triangles, 16k fans desktop / 11k phone):
- the Showdown match ball (4K desktop / 2K phone colour, normal, roughness-metal), clearcoat;
- goal: 12 cm round posts and bar (white like FIFA 17, or gold), curved box stanchions 2.2 m deep, knotted 12 cm net (sides,
  roof, back) that bulges; far goal frame;
- pitch: tiling grass with mown stripes and wear at the spot and six-yard box (shader), every chalk line of a 105 x 68 pitch;
- LED ad boards on all four sides (CHAMBER MEN, CMS, chevrons), scrolling slowly, merged into a few draws;
- stands: a two-tier home end behind the goal, long single-tier side stands, an away end, roofs with floodlight panels and
  glare; black and gold seats; a night sky dome with floodlight haze;
- crowd: one instanced draw; each fan is a card from the atlas, shirts tinted to the home colour (away colour at the far end),
  swaying always, bouncing and raising arms as excitement rises.

Lighting is the scene's (key/fill lights + an environment). Tip: `pmrem.fromScene(scene,.04,.1,300)` once after building
gives the gold and the ball real stadium reflections at no per-frame cost.

Rebuild the textures: `cd tools/chamber-men-assets && python3 build_all.py`.
