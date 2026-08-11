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

## Licensed football photography visual set — r4 corrective sources

The following images are required screen-level presentation assets. They are stored locally and proactively warmed after the critical application shell starts so the intended football presentation is ready before its destination screens are used. They do not own gameplay logic or saved data. Each runtime file is a licensed WebP derivative created without generative alteration. The r4 corrective presentation explicitly rejects the blind portrait-to-wide `object-fit: cover` failure class seen in r3 and extends that protection to any blind ultra-wide cover crop: all five runtime photographs use bounded, contained, subject-safe frames. Four retain their full selected source derivative at display time. The Lahm Trophy Room asset uses one separately documented, hand-reviewed local derivative crop before display so the captain and complete trophy remain readable; that selected derivative is then also displayed with `contain` and receives no further responsive crop. The repository manifest `assets/football/asset-manifest.json` records source and derivative dimensions, byte size, fingerprints and the Lahm crop box.

The earlier r3 James/Rashford/Martial/Messi runtime derivatives were removed after real-device owner review showed unacceptable crops. Their historical provenance and the regression itself remain documented in `AI_DEVELOPER_AUDIT_2026-08-10_VISUAL_REGRESSION.md`.

### James Rodríguez — Real Madrid era

- Repository file: `assets/football/james-rodriguez-real-madrid-2016-r4.webp`
- Source file: `James Rodríguez in September 2016 - 01.jpg`
- Author/source account: Real Madrid
- Source page: `https://commons.wikimedia.org/wiki/File:James_Rodr%C3%ADguez_in_September_2016_-_01.jpg`
- License: Creative Commons Attribution 3.0 Unported (CC BY 3.0), `https://creativecommons.org/licenses/by/3.0/`
- Source context: photographed after Borussia Dortmund vs Real Madrid on 28 September 2016.
- Application use: Create Showdown presentation.
- Local transformation: retained at 863 × 1080 and encoded as WebP at quality 92.
- Display policy: portrait-aware subject-safe contained frame; the complete source remains visible rather than being force-cropped into the wide Create Showdown slot.

### Marcus Rashford — Manchester United

- Repository file: `assets/football/marcus-rashford-man-utd-2016-r4.webp`
- Source file: `Marcus Rashford September 2016 (cropped).jpg`
- Author: Ardfern
- Source page: `https://commons.wikimedia.org/wiki/File:Marcus_Rashford_September_2016_(cropped).jpg`
- License: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), `https://creativecommons.org/licenses/by-sa/4.0/`
- Source context: Marcus Rashford for Manchester United against Zorya Luhansk at Old Trafford on 29 September 2016; the Commons source is an extracted crop from the photographer's match photograph.
- Application use: Transfer Challenge presentation.
- Local transformation: retained at 594 × 661 and encoded as WebP at quality 94. This local derivative remains available under CC BY-SA 4.0.
- Display policy: subject-dominant contained frame; the complete source remains visible and the previous distant/official-dominated Transfer composition is no longer active.

### Anthony Martial — Manchester United

- Repository file: `assets/football/anthony-martial-man-utd-2015-r4.webp`
- Source file: `Anthony Martial 2015.jpg`
- Author: Dmitry Golubovich
- Source page: `https://commons.wikimedia.org/wiki/File:Anthony_Martial_2015.jpg`
- License: Creative Commons Attribution-ShareAlike 2.5 Generic (CC BY-SA 2.5), `https://creativecommons.org/licenses/by-sa/2.5/`
- Source context: Anthony Martial playing for Manchester United against CSKA Moscow on 21 October 2015.
- Application use: Transfer Challenge presentation.
- Local transformation: resized from 872 × 710 to 688 × 560 with Lanczos and encoded as WebP at quality 94. This local derivative remains available under CC BY-SA 2.5.
- Display policy: subject-safe contained frame; the source is not allowed to be enlarged and cropped merely to fill the Transfer banner.

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
