# THIRD-PARTY NOTICES

Career Mode Showdown is a personal fan project. This file records third-party material intentionally referenced by the application so licensing/source decisions remain explicit.

## Barlow / Barlow Condensed

- Typeface family: Barlow
- Principal designer: Jeremy Tribby
- Project source: `https://github.com/jpt/barlow`
- License: SIL Open Font License, Version 1.1
- Application use: Barlow Condensed 600 / 700 / 800 for selected football-game-inspired display text.
- Delivery: Google Fonts stylesheet service with `display=swap`; no font binary is stored in this repository.
- Fallback: local condensed/system fonts are used if the external stylesheet cannot load.

The application does not claim Barlow is EA/FIFA's proprietary typeface.

## Marco Reus photograph

- Repository file: `assets/marco-reus-2015-cc-by.webp`
- Source file: `Marco Reus (16204330530) (cropped).jpg`
- Photographer: Tim Reckmann
- Source page: `https://commons.wikimedia.org/wiki/File:Marco_Reus_(16204330530)_(cropped).jpg`
- License: CC BY 2.0, `https://creativecommons.org/licenses/by/2.0/`
- Application use: protected startup-screen athlete treatment and Home-menu cover treatment.
- Local transformation: Wikimedia derivative resized to 900 × 1520, encoded as WebP and stripped of embedded metadata; responsive display crop is documented in the Home/startup credit.

## Licensed football photography visual set — v1.1.3

v1.1.3 replaces the James Rodríguez, Marcus Rashford and Anthony Martial source photographs and adds seven more historic/cinematic football photographs across appropriate screens. The set is stored locally; no destination screen hotlinks a third-party image. Route-scoped loading means the archive is not downloaded on Home startup: a destination requests only the photo or photos declared for that screen.

The finished repository derivatives are presentation authority. Runtime CSS uses `object-fit: contain`, so responsive layouts must not create an unreviewed second semantic crop. The deterministic builder and `assets/football/asset-manifest.json` retain source dimensions, crop/full-frame policy, source fingerprints where captured, exact output dimensions, output SHA-256 and byte sizes.

The owner explicitly rejected the previous v1.1.1 James interview still and prohibited reuse of the older 2019 James photograph. Those sources are not active v1.1.3 runtime authority.

### James Rodríguez — Colombia / 2014 World Cup

- Repository file: `assets/football/james-rodriguez-world-cup-2014-v113.webp`
- Source file: `James Rodríguez (cropped).jpg`
- Author/source: Copa2014.gov.br
- Source page: `https://commons.wikimedia.org/wiki/File:James_Rodríguez_(cropped).jpg`
- License: CC BY 3.0 BR, `https://creativecommons.org/licenses/by/3.0/br/deed.en`
- Context: James Rodríguez at the 2014 FIFA World Cup in Brazil, 19 June 2014.
- Application use: Create Showdown.
- Source dimensions / crop: 1415 × 3062; complete Commons derivative `(0, 0, 1415, 3062)` preserved.
- Local derivative: 508 × 1099 WebP, 108,120 bytes.
- Output SHA-256: `95b3d55df2117b619273f9e46378974836e785bb68e0c7ef4aecd1a15d6f9ee8`.

### Marcus Rashford — Manchester United / Chelsea 2–0

- Repository file: `assets/football/marcus-rashford-chelsea-2017-v113.webp`
- Source file: `Manchester United v Chelsea, 16 April 2017 (11).jpg`
- Author: Ardfern
- Source page: `https://commons.wikimedia.org/wiki/File:Manchester_United_v_Chelsea,_16_April_2017_(11).jpg`
- License: CC BY-SA 4.0, `https://creativecommons.org/licenses/by-sa/4.0/`
- Context: Manchester United's 2–0 Premier League win over Chelsea at Old Trafford, 16 April 2017; the selected frame shows a genuine post-action teammate-embrace moment around Rashford.
- Application use: Transfer Challenge.
- Source dimensions / crop: 4896 × 3672; complete high-resolution match frame retained after responsive review.
- Local derivative: 1120 × 840 WebP, 176,988 bytes.
- Output SHA-256: `8ade8cb66393ea9d8cc8b4adc4a63a63e27d574777c1281740f45daeba0e0be7`.

### Anthony Martial — Manchester United / Champions League

- Repository file: `assets/football/anthony-martial-cska-2017-v113.webp`
- Source file: `Anthony Martial 27 September 2017 cropped.jpg`
- Author: Дмитрий Голубович
- Source page: `https://commons.wikimedia.org/wiki/File:Anthony_Martial_27_September_2017_cropped.jpg`
- License: CC BY-SA 3.0, `https://creativecommons.org/licenses/by-sa/3.0/`
- Context: Anthony Martial with Manchester United against CSKA Moscow in the UEFA Champions League, 27 September 2017.
- Application use: Transfer Challenge.
- Source dimensions / crop: 521 × 999; complete player-isolated Commons derivative preserved.
- Local derivative: 521 × 999 WebP, 114,040 bytes.
- Output SHA-256: `92bef5c5be2f7a6c0ab36e28491254763f8b96bdd6c9a57c72abab3d9a82476b`.

### Lionel Messi — FC Barcelona

- Repository file: `assets/football/lionel-messi-barcelona-2016-subject-r4.webp`
- Source file: `Leo Messi 2016.PNG`
- Attribution: Save the Dream / derivative by SdHb
- Source page: `https://commons.wikimedia.org/wiki/File:Leo_Messi_2016.PNG`
- License: CC BY 2.0, `https://creativecommons.org/licenses/by/2.0/`
- Application use: Career Statistics.
- Local derivative: protected r4 469 × 779 WebP, 63,788 bytes.
- Output SHA-256: `a84eba9c108bb4237bde989c36dd837114480bd0d1a823eeacf401955995d204`.

### Philipp Lahm — 2014 World Cup champion

- Repository file: `assets/football/philipp-lahm-world-cup-2014-focus-r4.webp`
- Source file: `Philipp Lahm lifts the 2014 FIFA World Cup.jpg`
- Author: Agência Brasil
- Source page: `https://commons.wikimedia.org/wiki/File:Philipp_Lahm_lifts_the_2014_FIFA_World_Cup.jpg`
- License: CC BY 3.0 BR, `https://creativecommons.org/licenses/by/3.0/br/deed.en`
- Application use: Trophy Room.
- Local derivative: protected r4 subject-focused 624 × 722 WebP, 148,134 bytes; crop preserves Lahm, raised arms and complete trophy.
- Output SHA-256: `c745c9dfd3619e384604890c6ed183dd4ff92db6cc1d4b93e1ce6edf5ebf6eb5`.

### Cristiano Ronaldo — Portugal / Euro 2016

- Repository file: `assets/football/cristiano-ronaldo-euro-2016-v113.webp`
- Source file: `Euro 2016 Cristiano Ronaldo.jpg`
- Author: Chensiyuan
- Source page: `https://commons.wikimedia.org/wiki/File:Euro_2016_Cristiano_Ronaldo.jpg`
- License: CC BY-SA 4.0, `https://creativecommons.org/licenses/by-sa/4.0/`
- Context: Portugal v Poland, UEFA Euro 2016 quarter-final, 1 July 2016.
- Application use: League Wheel / `FIND YOUR STAGE`.
- Local derivative: 700 × 1099 WebP, 110,272 bytes.
- Output SHA-256: `7060f5afd5aa4d6399b8e2d8c9591d84f87cee6c46bfd2a07af0ed1e644dd081`.

### Paul Pogba — Manchester United / 2016

- Repository file: `assets/football/paul-pogba-man-utd-2016-v113.webp`
- Source file: `Manchester United v Zorya Luhansk, September 2016 (07) - Paul Pogba (edited).jpg`
- Author: Ardfern / derivative by Danyele
- Source page: `https://commons.wikimedia.org/wiki/File:Manchester_United_v_Zorya_Luhansk,_September_2016_(07)_-_Paul_Pogba_(edited).jpg`
- License: CC BY-SA 4.0, `https://creativecommons.org/licenses/by-sa/4.0/`
- Application use: Club Assignment / `CLUB IDENTITY`.
- Local derivative: 893 × 1100 WebP, 175,628 bytes.
- Output SHA-256: `a5988c444d0c6f33599e9035cba962c647cf7e28fd0e522e3b92c7df4dc79564`.

### Zlatan Ibrahimović — Manchester United / 2016

- Repository file: `assets/football/zlatan-ibrahimovic-man-utd-2016-v113.webp`
- Source file: `Manchester United v Zorya Luhansk, September 2016 (08) - Zlatan Ibrahimović (edited).jpg`
- Author: Ardfern / derivative by Danyele
- Source page: `https://commons.wikimedia.org/wiki/File:Manchester_United_v_Zorya_Luhansk,_September_2016_(08)_-_Zlatan_Ibrahimović_(edited).jpg`
- License: CC BY-SA 4.0, `https://creativecommons.org/licenses/by-sa/4.0/`
- Application use: Showdown Home / `RIVALRY HEADQUARTERS`.
- Local derivative: 651 × 1100 WebP, 158,960 bytes.

### Antoine Griezmann — Atlético Madrid / Champions League 2016

- Repository file: `assets/football/antoine-griezmann-atletico-2016-v113.webp`
- Source file: `Antoine Griezmann 2016.jpg`
- Author: Светлана Бекетова
- Source page: `https://commons.wikimedia.org/wiki/File:Antoine_Griezmann_2016.jpg`
- License: CC BY-SA 3.0, `https://creativecommons.org/licenses/by-sa/3.0/`
- Context: Rostov v Atlético Madrid, UEFA Champions League, 19 October 2016.
- Application use: Season Results / `SEASON PRESSURE`.
- Local derivative: 1120 × 832 WebP, 204,440 bytes.

### Neymar — Brazil / Rio 2016 Olympic gold final

- Repository file: `assets/football/neymar-brazil-olympic-gold-2016-v113.webp`
- Source file: `Brasil conquista primeiro ouro olímpico no futebol 1039247-20082016- mg 3424.jpg`
- Author: Fernando Frazão/Agência Brasil
- Source page: `https://commons.wikimedia.org/wiki/File:Brasil_conquista_primeiro_ouro_olímpico_no_futebol_1039247-20082016-_mg_3424.jpg`
- License: CC BY 3.0 BR, `https://creativecommons.org/licenses/by/3.0/br/deed.en`
- Context: Brazil's first Olympic men's football gold-medal final, Rio 2016, 20 August 2016.
- Application use: Season Summary / `SEASON VERDICT`.
- Local derivative: 1120 × 747 WebP, 83,836 bytes.

### Mario Balotelli — Italy / Euro 2012 semi-final celebration

- Repository file: `assets/football/mario-balotelli-euro-2012-celebration-v113.webp`
- Source file: `Balotelli 2nd goal celebration - Euro 2012.jpg`
- Author: Joern Fehrmann
- Source page: `https://commons.wikimedia.org/wiki/File:Balotelli_2nd_goal_celebration_-_Euro_2012.jpg`
- License: CC BY-SA 3.0, `https://creativecommons.org/licenses/by-sa/3.0/`
- Context: Italy celebrate Balotelli's second goal against Germany in the Euro 2012 semi-final, 28 June 2012.
- Application use: Rule Book / `RULES OF THE GAME`.
- Local derivative: 1200 × 675 WebP, 224,638 bytes.

### Radamel Falcao — Atlético Madrid / Europa League champion 2012

- Repository file: `assets/football/radamel-falcao-europa-league-2012-v113.webp`
- Source file: `Falcao Celebración Europa League 2012.JPG`
- Author: Juanca Parce
- Source page: `https://commons.wikimedia.org/wiki/File:Falcao_Celebración_Europa_League_2012.JPG`
- License: CC BY-SA 3.0, `https://creativecommons.org/licenses/by-sa/3.0/`
- Context: Falcao celebrating Atlético Madrid's 2012 Europa League title in Puerta del Sol, 10 May 2012.
- Application use: Legacy.
- Local derivative: 708 × 1100 WebP, 101,514 bytes.

These images are decorative/editorial references to historical football subjects and do not imply endorsement by players, clubs, competitions, photographers, source organizations or Wikimedia Commons.

## YouTube soundtrack / trailer embeds

The application references selected FIFA 17-era soundtrack tracks and a FIFA 17 gameplay trailer through user-initiated `youtube-nocookie.com` embeds.

- Audio/video files are not downloaded or republished by this repository.
- No media iframe is created before the user presses Play.
- The application permits at most one active media iframe.

## Club identity artwork

Current club emblems are original procedural SVG compositions generated locally by `js/visualIdentity.js`. Official club badge images/vector paths are not bundled. Broad club-associated colours are factual cues; geometry and motifs come from project-owned templates.

## Menu click feedback

The optional menu-confirmation cue is synthesized at runtime by `js/menuFeedback.js` with Web Audio. No recorded EA/FIFA sound file is bundled or copied.
