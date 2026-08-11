# THIRD-PARTY NOTICES

Career Mode Showdown is a personal fan project. This file records third-party material intentionally referenced by the application so licensing/source decisions remain explicit.

## Barlow / Barlow Condensed

- Typeface family: Barlow
- Principal designer: Jeremy Tribby
- Project source: `https://github.com/jpt/barlow`
- License: SIL Open Font License, Version 1.1
- Application use: Barlow Condensed 600 / 700 / 800 as a display-face option for selected game-menu headings, navigation labels, scores and reveal presentation.
- Delivery: requested through the Google Fonts stylesheet service with `display=swap`; no font binary is stored in this repository.
- Fallback behavior: the application immediately falls back to local condensed/system fonts if the external font cannot be loaded.

The application does not claim Barlow is the FIFA 17 proprietary typeface. It is used as an independently licensed design choice that supports the project's original mid-2010s football-game-inspired presentation.

## Marco Reus photograph

- Repository file: `assets/marco-reus-2015-cc-by.webp`
- Source file: `Marco Reus (16204330530) (cropped).jpg`
- Photographer: Tim Reckmann
- Source page: `https://commons.wikimedia.org/wiki/File:Marco_Reus_(16204330530)_(cropped).jpg`
- License: Creative Commons Attribution 2.0 Generic (CC BY 2.0), `https://creativecommons.org/licenses/by/2.0/`
- Application use: decorative startup-screen athlete treatment and Home-menu cover treatment.
- Local transformation: the Wikimedia derivative was resized to 900 × 1520 pixels, encoded as WebP, stripped of embedded metadata, and is cropped further at display time through responsive CSS.

The application displays the photographer, source, license and display-crop notice on Home, with a compact photographer/license credit on the startup screen. The local copy prevents the portrait from becoming a third-party availability or privacy dependency and does not imply that Marco Reus, Borussia Dortmund, the photographer or Wikimedia Commons endorses this fan project.

## Licensed football photography visual set — r5 smart-crop player rebuild

The following images are required screen-level presentation assets. They are stored locally and proactively warmed after the critical application shell starts so the intended football presentation is ready before its destination screens are used. They do not own gameplay logic or saved data.

The r5 owner-requested rebuild changes only the James Rodríguez, Marcus Rashford and Anthony Martial photographs. Each of those three now begins from a different licensed source photograph and receives one explicit, hand-reviewed crop in source-pixel coordinates before WebP conversion. The finished derivative is then shown in full with `object-fit: contain`; responsive CSS is not allowed to crop the derivative again. Lionel Messi and Philipp Lahm remain unchanged from r4.

The earlier r3 visual regression and its rejected source/crop decisions remain documented in `AI_DEVELOPER_AUDIT_2026-08-10_VISUAL_REGRESSION.md`. The subsequently replaced r4 James/Rashford/Martial derivatives remain recoverable through Git history but are no longer active runtime assets. The repository manifest `assets/football/asset-manifest.json` records source dimensions, source fingerprints, exact source-pixel crop boxes, derivative dimensions, derivative fingerprints and byte sizes.

### James Rodríguez — Real Madrid

- Repository file: `assets/football/james-rodriguez-real-madrid-2019-smart-r5.webp`
- Source file: `James Rodríguez in 2019.jpg`
- Author/source account: Real Madrid
- Source page: `https://commons.wikimedia.org/wiki/File:James_Rodríguez_in_2019.jpg`
- License: Creative Commons Attribution 3.0 Unported (CC BY 3.0), `https://creativecommons.org/licenses/by/3.0/`
- Source dimensions: 540 × 720.
- Source context: James Rodríguez wearing Real Madrid training apparel, dated 23 October 2019.
- Application use: Create Showdown presentation.
- Local transformation: source-pixel crop `(20, 0, 540, 705)`, producing a 520 × 705 crop that retains his complete head, shoulders, shirt and Real Madrid crest; encoded as WebP at quality 92 with no upscaling.
- Display policy: the complete 520 × 705 authored derivative is displayed with `object-fit: contain`; runtime layout cannot crop the face or head merely to fill a wide tile.

### Marcus Rashford — Manchester United

- Repository file: `assets/football/marcus-rashford-man-utd-2016-smart-r5.webp`
- Source file: `Man Utd v Everton, August 2016 (08).JPG`
- Author: Ardfern
- Source page: `https://commons.wikimedia.org/wiki/File:Man_Utd_v_Everton,_August_2016_(08).JPG`
- License: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), `https://creativecommons.org/licenses/by-sa/4.0/`
- Source dimensions: 4896 × 3672.
- Source context: Manchester United v Everton, Wayne Rooney testimonial at Old Trafford, 3 August 2016; the source belongs to the Commons Marcus Rashford in 2016 set.
- Application use: Transfer Challenge presentation.
- Local transformation: source-pixel crop `(0, 400, 1800, 2600)` removes the large unused stadium area and makes Rashford the dominant figure while retaining his complete head and upper body; downscaled only to 900 × 1100 with Lanczos and encoded as WebP at quality 90. This local derivative remains available under CC BY-SA 4.0.
- Display policy: the complete 900 × 1100 authored derivative is displayed with `object-fit: contain`; there is no secondary responsive crop or zoom.

### Anthony Martial — Manchester United

- Repository file: `assets/football/anthony-martial-man-utd-2016-smart-r5.webp`
- Source file: `Manchester United v Zorya Luhansk, September 2016 (26).JPG`
- Author: Ardfern
- Source page: `https://commons.wikimedia.org/wiki/File:Manchester_United_v_Zorya_Luhansk,_September_2016_(26).JPG`
- License: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), `https://creativecommons.org/licenses/by-sa/4.0/`
- Source dimensions: 4896 × 3672.
- Source context: Manchester United v Zorya Luhansk at Old Trafford, 29 September 2016.
- Application use: Transfer Challenge presentation.
- Local transformation: source-pixel crop `(0, 0, 1800, 2400)` makes Martial the dominant close subject and trims the adjacent player from the presentation edge as far as possible without cutting Martial; downscaled only to 825 × 1100 with Lanczos and encoded as WebP at quality 90. This local derivative remains available under CC BY-SA 4.0.
- Display policy: the complete 825 × 1100 authored derivative is displayed with `object-fit: contain`; no wide-banner cover crop is allowed.

### Lionel Messi — FC Barcelona

- Repository file: `assets/football/lionel-messi-barcelona-2016-subject-r4.webp`
- Source file: `Leo Messi 2016.PNG`
- Attribution: Save the Dream / derivative by SdHb
- Original source account: Save the Dream
- Commons derivative author: SdHb
- Source page: `https://commons.wikimedia.org/wiki/File:Leo_Messi_2016.PNG`
- License: Creative Commons Attribution 2.0 Generic (CC BY 2.0), `https://creativecommons.org/licenses/by/2.0/`
- Source context: subject-isolated derivative of Lionel Messi with FC Barcelona before Al-Ahli v Barcelona in December 2016, derived on Commons from `Save the Dream at the Match of Champions (31791513341).jpg`.
- Application use: Career Statistics presentation.
- Local transformation: retained at 469 × 779 and encoded as WebP at quality 94. The local derivative remains available under CC BY 2.0.
- Display policy: tall portrait-aware Statistics frame keeps Messi as the dominant readable subject while the complete source remains protected from ultra-wide cover cropping.

### Philipp Lahm — 2014 World Cup

- Repository file: `assets/football/philipp-lahm-world-cup-2014-focus-r4.webp`
- Source file: `Philipp Lahm lifts the 2014 FIFA World Cup.jpg`
- Author: Agência Brasil
- Source page: `https://commons.wikimedia.org/wiki/File:Philipp_Lahm_lifts_the_2014_FIFA_World_Cup.jpg`
- License: Creative Commons Attribution 3.0 Brazil (CC BY 3.0 BR), `https://creativecommons.org/licenses/by/3.0/br/deed.en`
- Source context: Germany captain Philipp Lahm lifting the FIFA World Cup on 13 July 2014.
- Application use: Trophy Room presentation.
- Local transformation: the licensed source was first resized from 4256 × 2204 to 1600 × 829. After browser screenshot review showed Lahm and the cup were too small in that full-team composition, a hand-reviewed crop box `(624, 41, 1248, 763)` was taken from the 1600 × 829 local derivative, producing a 624 × 722 WebP at quality 94. The selected crop preserves Lahm's head and torso, his raised arms, the complete World Cup trophy, and surrounding celebration context.
- Display policy: the 624 × 722 focused derivative is displayed in a portrait-aware Trophy Room frame with `object-fit: contain`; no additional responsive crop is allowed.

These photographic uses are decorative editorial references to historical football subjects. They do not imply endorsement by the photographed players, clubs, competitions, photographers, source organizations or Wikimedia Commons.

## YouTube soundtrack / trailer embeds

The application references selected FIFA 17-era soundtrack tracks and a FIFA 17 gameplay trailer through user-initiated `youtube-nocookie.com` embeds.

- Audio/video files are not downloaded or republished by this repository.
- No media iframe is created before the user presses Play.
- The application permits at most one active media iframe.

## Club identity artwork

Current club emblems shown by Career Mode Showdown are original procedural SVG compositions generated locally by `js/visualIdentity.js`.

- Official club badge images or badge vector paths are not bundled.
- Broad club-associated colours are used as factual visual cues.
- Shield/roundel geometry, stripe/half/chevron patterns and abstract motifs are generated from project-owned templates.
- The system is intended to create differentiated fan-project identities, not replicas of official club marks.

## Menu click feedback

The optional menu-confirmation cue is synthesized at runtime by `js/menuFeedback.js` with the browser Web Audio API.

- No recorded sound file is bundled or downloaded.
- No EA/FIFA waveform or proprietary interface sound is copied.
- The cue uses a short project-original two-oscillator envelope and remains muted while Home media is playing.
