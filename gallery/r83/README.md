# r83 emulator gallery

Gameplay head: `21e74be78eb4c6ba8332e08b70ab5cc3c0f5f902`.

42 WebP captures at quality 80, each state at 1920×1080 and 393×852. Open `gallery.html` locally; image data and captions are embedded, so it works without a server or Firebase.

Auth and Firestore used only `demo-cms-browser-journey` on localhost (9199/8181). The production Rules were regenerated with `build-production-firestore-rules-with-persistent-pair.mjs`, uploaded to the emulator, and verified to reject an unauthenticated read. The browser journey's emulator runtime switch and locally served Firebase 12.17.0 browser SDK supplied emulator Google identities. Production Firebase API requests were blocked. Product and test files were not edited.

Pairing, season selection, league and clubs, career acknowledgements, transfers, result publication and commits, final close, career navigation, subsequent START and JOIN were driven through actual Playwright taps. The three-season finished Showdown has 1–1 each season, 3–3 overall, with different league positions and league points. The live statistics companion shows zero completed career totals before that Showdown finished. Support fixtures (`real-pair-fixture.cjs`, `showdown-settings-fixture.cjs`) informed account/role and setup-state expectations; their VM-rendered UI was not photographed.

Controlled conditions: restoring Home holds localhost Firestore requests after a real reload; failed CONTINUE returns a provider failure before any write, followed by the real BACK tap; CHECK STATUS advances the clock beyond the actual JOIN-note expiry and stops the existing watcher. Its screenshot then calls the existing `refreshHome()` method: the tile had stayed on JOIN despite the expired note and paused watcher. These conditions are described in manifest captions. No screenshot replaces or paints UI text.

Every image was visually inspected, including desktop and phone contact sheets and individual problem images. No blank, half-loaded, dimmed or old-design capture was retained. Long Rules and phone Season Results are deliberately scrolled to the changed content.

Observed problems / limits (not fixed):

- Desktop Season Results clips the canonical score panel after its heading, so its actual 1–1 / Draw text is not visible in that capture. The phone capture shows the real Draw result. This is the closest desktop state retained.
- After failed CONTINUE, the live tile survives, but its retry reason is in visually hidden Home metadata. The desktop capture also has the real error toast; the phone does not visibly show the reason. Both are genuine Home captures after BACK.
- Settings still reports build `1.9.6-r82` on the recorded r83 head.
- Trophy Room's phone BACK control appears blank although its DOM text is BACK.
- With the fixture clock advanced past note expiry and discovery stopped, Nik's Home stayed visually on JOIN until the product's existing `refreshHome()` was called. CHECK STATUS is the resulting real rendered state, not proof of automatic expiry redraw.

All requested screen families were reached. The limitations above are preserved for release review.
