# C2W-005 extras log

- extra 1: done, visual-assets/v10_1/season-results/season-results.css .season-phone-toolbar / entry and review panel phone offsets moved to the 44% composition seam.
- extra 2: done by job 179.
- extra 3: done, visual-assets/v10_1/season-results/season-results.css short-desktop .scoring-panel / .scoring-grid / .scoring-rule fit.
- extra 4: done, visual-assets/v10_1/tr2/slice-02-plate/plate.css short-desktop .transfer-wordmark clearance.
- extra 5: done, visual-assets/v10_1/club/club.css phone .phoneSceneBackground img object-position centred to crop the stray banner edge.

## Claude intake (2026-10-04 16:5x UTC)

- extra 1: PASS on render (tabs sit under the title).
- extra 2: PASS (job 179).
- extra 3: reworked by Claude: the smaller box made rows overlap; the box keeps its size and the contents are compacted. PASS at 1366x640 and 1366x768.
- extra 4: reverted by Claude: the DOM wordmark landed under the top bar and the painted title stayed cropped. Redo as extra 6.
- extra 5: reworked by Claude: the stray letter was the desktop "VS" text fallback, not the plate; hidden on phone. PASS.
- extra 6: done by Claude (thread 'Claude jobs from the Sol bundle'): plate.js layoutDesktop short branch scales the world (transform, no reflow) so title top to content bottom fits; .stage.fit::before blurred plate in the side gaps. titleCropPx 0 at 1366x640 and 1366x600 (F1, F3, F4D), panels and footer whole, 1366x768/1280x720/1920x1080/1024x600 unchanged.
