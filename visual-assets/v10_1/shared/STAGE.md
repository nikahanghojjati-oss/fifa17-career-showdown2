# Cinematic stage engine

Factory job 15. The stage keeps the approved plate and every registered cut-out on one camera transform while leaving live UI responsive and semantic.

## Rules learned from Home and League

1. One camera owns every plate coordinate. Home exposes `plateToScreen`; League does the same with one `{k, ox, oy}` transform. No overlay gets its own crop or scale.
2. Desktop uses cover math: `k = max(viewWidth / plateWidth, viewHeight / plateHeight)`. X is normally centred. Y is a focal decision, not an accidental browser default.
3. Home is effectively top biased on desktop: its camera uses the cover scale, horizontal centring and `offY = 0`. This keeps the Home faces whole on short laptops.
4. League centres the cover crop, then biases it down on short desktops so protected faces remain below the header. For the 1536×864 League plate this is equivalent to a useful focal point around `(768, 383)` at the factory desktop sizes.
5. Plate registered regions are always computed from the same transform. League positions the plate, heals, slot, wheel contact and Daniel finger from plate coordinates; the finger is never independently object fitted.
6. DPR is an asset selection problem, not a geometry problem. Logical coordinates stay in 1X plate pixels. The 1X and 2X assets must have identical composition. Runtime density selection uses CSS `image-set`.
7. Phone is a different composition. Existing Home fits the union of both faces into a portrait band; League uses the source band x=195..1280, y=70..400 and applies the same phone transform to the plate layers. The shared engine formalises this as `platemap.phone_band = [x0,y0,x1,y1]` or an equivalent object supplied by the screen without mutating an older map.
8. Phone content is not inside the plate camera. The face band owns the registered scene; responsive UI lives below it. Cut-outs still use the exact same registered inner box and are clipped by the same face-band viewport.
9. No image dimension may drive layout after load. The stage knows plate dimensions before requesting art, so there is no layout shift.
10. Depth order is fixed: plate 0, atmosphere 1, UI 2, cut-out/contact 3, light 4. A contact shadow is painted in the cut-out plane below the cut-out pixels so it can darken a UI panel while the hand itself stays above that panel.

## Required markup

```html
<div class="sd-stage" data-plate-width="1536" data-plate-height="864">
  <div class="sd-stage__layer sd-stage__layer--plate">
    <div class="sd-stage__registered"><div class="sd-stage__plate"></div></div>
  </div>
  <div class="sd-stage__layer sd-stage__layer--atmosphere"></div>
  <div class="sd-stage__layer sd-stage__layer--ui"><!-- semantic responsive UI --></div>
  <div class="sd-stage__layer sd-stage__layer--cutout">
    <div class="sd-stage__registered"><!-- registered cut-outs --></div>
  </div>
  <div class="sd-stage__layer sd-stage__layer--light">
    <div class="sd-stage__registered"><!-- registered rim masks --></div>
  </div>
</div>
```

`stage.js` may build the atmosphere helpers, but it does not own screen copy or product behaviour.

## Initialisation

```js
ShowdownStage.mount(stage, {
  plate: { width: 1536, height: 864, src1x: "..._1X.webp", src2x: "..._2X.webp" },
  focal: { x: 768, y: 383 },
  platemap: { phone_band: [195, 70, 1280, 400] }
});
```

A cut-out can be a full-canvas layer or a cropped registered box. Cropped assets use `data-box="x0 y0 x1 y1"` in 1X plate pixels. Rim masks use the same box and density rules.

## Camera contract

For a desktop viewport `(W,H)` and plate `(PW,PH)`:

```text
k = max(W/PW, H/PH)
sceneW = PW*k
sceneH = PH*k
x = clamp(W/2 - focalX*k, W-sceneW, 0)
y = clamp(H/2 - focalY*k, H-sceneH, 0)
```

Every registered layer receives exactly `left=x`, `top=y`, `width=sceneW`, `height=sceneH`.

For portrait width <= 760 px, the registered scene is clipped by the face-band viewport. The engine reads `phone_band`, preserves its focal centre, chooses the smallest scale that both keeps the requested band visible and covers the face-band viewport, then clamps the plate so the band remains in view as far as the plate allows. The responsive content region begins immediately below the face band.

## Registration test

For a cut-out box `[x0,y0,x1,y1]`, expected CSS pixels are:

```text
left   = sceneX + x0*k
 top    = sceneY + y0*k
 width  = (x1-x0)*k
 height = (y1-y0)*k
```

QA compares that expected rectangle with the cut-out DOM rectangle. `max(abs(delta)) * devicePixelRatio <= 1` is the pass condition at every factory viewport.

## Accessibility and motion

Plate, cut-outs, rim masks, dust and flare are decorative and `aria-hidden`. The UI layer remains normal DOM. `prefers-reduced-motion: reduce` and `html[data-motion-reduced="true"]` disable dust and flare rather than merely slowing them. The stage never mirrors a manager image.
