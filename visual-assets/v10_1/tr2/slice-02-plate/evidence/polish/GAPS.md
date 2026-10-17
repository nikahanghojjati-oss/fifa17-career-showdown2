# Job 49 · Transfer War polish gaps

Compared against `GOAL_TRANSFER_PLATE_G.png`, the Job 1 Transfer baseline, PRODUCT_TRUTH.md and the shared foundation.

## Cross-frame gaps

1. **Shared foundation drift:** `plate.css` carries its own gold, type, button, focus and shadow values instead of consuming `showdown-tokens.css`, `showdown-type.css` and `showdown-ui.css`. The layout registration is already strong, so the polish should swap styling primitives without moving the approved panel geometry.
2. **Brush title is not on the shared wordmark path:** the Plate G scene still relies on the painted `TRANSFER WAR` lettering. `TITLE_TRANSFER_V1.webp` now exists in the shared wordmark kit and should be used as the crisp accessible title treatment without shifting the accepted composition.
3. **Rival lock reads as digital glass, not a physical Sealed Dossier:** F1, G2/G3 and F3/F3D/F3L/F3DL show a flat frosted fill with a glowing CM17 seal. It needs paper grain, a wax-seal treatment, a gold clasp and stronger locked-object depth while preserving the exact constant markup and revealing no rival state.
4. **Buttons are screen-local:** END EARLY, LOCK GUESSES, LOCK MY SIGNINGS and the disabled continuation use local rounded/gradient treatments. They should use the shared primary/secondary cut-corner craft while keeping the same ids, labels and positions.
5. **Atmosphere is mostly baked into the plate:** the live scene lacks a subtle depth layer of drifting gold dust, lamp bloom and edge vignette. The key art has stronger warm light in the air around the table.
6. **Nik finger contact needs a clearer shadow:** the fingertip overlay is correctly above panel A, but the contact point reads slightly pasted at desktop size. Add a soft 2–4 px contact shadow under the fingertip while keeping the supplied cut-out registered exactly.
7. **Footer chrome conflicts with current product truth:** the baseline shows HOME / season rail / REFRESH at the bottom in every frame. PRODUCT_TRUTH now says Transfer War has no bottom bar and may use the full phone height. Preserve the strings/ids in source, but do not present a bottom navigation bar in the polished screen.
8. **Top-strip safety:** the desktop composition must leave the top 52 px usable for the shared top bar when integrated. Do not move faces or approved panels into that strip while polishing.

## Frame-specific compare

- **F1 Window:** panel registration and manager positions already match the key art closely. The largest visible delta is UI material: the rival side is a flat sealed glass, the viewer panel controls are locally styled, and the hanging sign/live status is brighter and more digital than the painted key-art board.
- **G2/G3 Guess Entry:** the three-column form fits the painted glass, but the fields/button look like a prototype layer rather than one material system with the rest of Showdown. The rival panel also needs the physical dossier treatment.
- **F3 family Signing Entry:** the compact three-row layout is correctly contained and must not be reflowed. The main polish opportunity is shared field/button treatment plus a more convincing sealed rival object.
- **F4 family Verdicts:** verdict density and left/right ownership are correct. The screen needs the same shared typography/material tokens and atmospheric depth so the revealed data feels embedded in Plate G rather than laid over it.

## Keep

- Plate registration, face placement and panel rectangles.
- Daniel left / Nik right.
- All F1–F4 strings, ids, validation and intent behaviour.
- Constant rival privacy before reveal.
- The existing fingertip cut-out asset and its registration.
