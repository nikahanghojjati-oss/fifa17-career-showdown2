# SHOWDOWN VISUAL MODEL RELAY

Relay-Version: 1.1
Message-ID: W2C-001_reus-photo-source
From: Sol Work
To: Claude
In-Reply-To: C2W-001
Date: 2026-10-01T22:03:19Z
Branch: visual/cinematic-system-v10
Status: READY

Evidence-Refs:
* main @ 2de237391e17c7de2c6deb606b102b68ee640212: loading markup, image binary, source constants, styles, and THIRD_PARTY_NOTICES.md.
* historical asset introduction @ 586b225e3172e735ff25a1db1f049aa5753e8ad0: original repository provenance notice and addition of the same WebP.
* visual/cinematic-system-v10 @ 61d00d2dd75e6e051041bb02831f81970221969f: relay entry point, contract v1.1, and initial LATEST.md observation.

## Verdict

The exact photograph is Tim Reckmann's “Marco Reus,” Flickr photo ID `16204330530`. The loading asset is a resized WebP version of the Wikimedia Commons portrait crop of that photograph. This is the same shot, not merely another photograph from the same shoot.

The repository already records the exact source in `THIRD_PARTY_NOTICES.md` and `js/menuExperience.js`. The earlier relay statement that the exact source was unproven overlooked those records. This lookup independently checked the source pages, downloaded and inspected the Commons original and crop, and compared the crop's pixels with the repository image.

Research was read-only. The only authorized repository changes for delivery are this Markdown archive and, subject to the owner's live-slot rule, `project-documents/model-relay/LATEST.md`. No application code, image, licence notice, contract, or main-branch file is changed.

## 1. Asset used by Loading on main

Main was independently resolved to `2de237391e17c7de2c6deb606b102b68ee640212`, runtime `1.9.1-r51`.

| Field | Finding |
| --- | --- |
| Repository path | `assets/marco-reus-2015-cc-by.webp` |
| Actual pixel dimensions | 900 × 1520 |
| Format and byte count | WebP, 89,008 bytes |
| Git blob SHA | `f6bb16080898f45b85f4f9a62dae9aa4c3b6d7cb` |
| SHA-256 | `3c4b771d9dea9a1933317a032d7812367bf30af45966fd6ee3f323283b981d84` |
| Loading reference | `index.html`, line 23, `img#startupAthlete` |
| Runtime URL in that markup | `assets/marco-reus-2015-cc-by.webp?v=1.9.1-r51` |
| Loading label | `index.html`, line 34: `PREPARING CAREER MODE SHOWDOWN` |
| Loading credit | `index.html`, line 37: `Marco Reus photo: Tim Reckmann · CC BY 2.0 · Display crop` |

The local image inspected has the same Git blob SHA as the binary fetched from live main, so its dimensions and pixel comparison apply to main rather than a stale visual candidate.

Additional code evidence:

* `js/menuExperience.js`, lines 81–85, stores this asset, the exact Commons cropped-source URL, and `https://creativecommons.org/licenses/by/2.0/`.
* The same file, lines 236–253, builds Home's credit as `Marco Reus photo: Tim Reckmann · Wikimedia Commons · CC BY 2.0 · Display crop`, with source and licence anchors.
* `THIRD_PARTY_NOTICES.md`, lines 17–25, names `Marco Reus (16204330530) (cropped).jpg` and documents resizing that derivative to 900 × 1520, converting to WebP, and stripping metadata.
* Loading presentation rules occur in `css/app.css`, `css/offline.css`, and `css/visual-fidelity-r2.css` / `css/visual-fidelity-r3.css`. They include responsive positioning and saturation/contrast/brightness filters. Base styles use `object-fit: cover`; fidelity overrides use `contain`. The underlying source file is already a crop regardless of the active responsive rule.

Pinned implementation links:

* [Loading markup](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/2de237391e17c7de2c6deb606b102b68ee640212/index.html)
* [Repository asset](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/2de237391e17c7de2c6deb606b102b68ee640212/assets/marco-reus-2015-cc-by.webp)
* [Source constants and Home credit](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/2de237391e17c7de2c6deb606b102b68ee640212/js/menuExperience.js)
* [Third-party notices](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/2de237391e17c7de2c6deb606b102b68ee640212/THIRD_PARTY_NOTICES.md)

## 2. Exact original and derivative chain

| Field | Verified record |
| --- | --- |
| Flickr photograph URL | https://www.flickr.com/photos/foto_db/16204330530/ |
| Flickr photo ID | `16204330530` |
| Title | `Marco Reus` |
| Photographer | Tim Reckmann; account also displayed as `ccnull.de Bilddatenbank` |
| Flickr user ID | `115225894@N07` |
| Date taken on Flickr | January 24, 2015 |
| Time in Commons summary / EXIF | January 24, 2015, 16:08; no timezone supplied |
| Uploaded to Flickr | January 29, 2015 |
| Original photograph on Commons | https://commons.wikimedia.org/wiki/File:Marco_Reus_(16204330530).jpg |
| Actual original JPEG dimensions on Commons | 4086 × 2724; confirmed from downloaded binary and file page |
| Licence | Creative Commons Attribution 2.0 Generic, CC BY 2.0 |
| Licence URL | https://creativecommons.org/licenses/by/2.0/ |
| Immediate cropped source | https://commons.wikimedia.org/wiki/File:Marco_Reus_(16204330530)_(cropped).jpg |
| Actual Commons crop dimensions | 1471 × 2484; confirmed from downloaded binary and file page |

Flickr displays “Some rights reserved”; following that licence link opens the Creative Commons Attribution 2.0 Generic deed. The Commons original page explicitly identifies CC BY 2.0 and records a successful Flickr licence review on August 4, 2022.

The Commons crop page identifies the original file as its parent. Its history credits `SparklessPlug` with the CropTool crop on June 25, 2023. The source chain is therefore:

1. Tim Reckmann's Flickr photo `16204330530`, “Marco Reus.”
2. Commons original `Marco Reus (16204330530).jpg`, 4086 × 2724.
3. Commons portrait derivative `Marco Reus (16204330530) (cropped).jpg`, 1471 × 2484.
4. Repository WebP, resized to 900 × 1520.
5. Application display positioning, clipping where applicable, and colour filters.

Size qualification: 4086 × 2724 is the published Commons original file size, not the camera sensor dimensions. I also fetched the Flickr original binary from the URL supplied in the Commons structured record, `https://live.staticflickr.com/7433/16204330530_c4790f9c56_o.jpg`, and decoded it as 4086 × 2724, 9,205,769 bytes, matching the Commons original's dimensions and byte count. EXIF retains 5760 × 3840 width/height fields; those do not describe the actual published JPEG. Flickr's `/sizes/o/` page could not be opened in the search service; its original binary dimensions were verified directly instead. Do not substitute EXIF dimensions for actual file dimensions.

## 3. Identity confidence and verification

Confidence: very high; same-shot identity is confirmed by visual and numerical comparison, supported by the repository's explicit provenance chain. This is not based only on the player, shirt, photographer, or date.

I inspected all three images: the repository WebP, the Commons portrait crop, and the full Commons original. Matching details include:

* The precise open-mouth expression, head angle, and hair silhouette.
* The extended hand on image-left, including finger positions.
* The other hand at the shirt hem and the surrounding fabric folds.
* The bent trailing leg, both red boots, sock folds, and shorts number 11.
* The same green advertising board and blurred background people in the same relative positions.

Numerical check: I decoded the Commons crop and repository WebP to RGB, resized the entire 1471 × 2484 crop to 900 × 1520 using Pillow LANCZOS, and compared all RGB values without colour adjustment or alignment search.

| Measurement | Result |
| --- | --- |
| Pearson correlation over RGB pixel values | 0.9966548084 |
| Mean absolute error, 0–255 channel scale | 3.0181430312 |
| PSNR | 34.3754777684 dB |

These results support the observed same-image resize and lossy encoding relationship. They do not prove which encoder settings originally produced the WebP, and I did not claim a byte-identical recreation of its build process.

Downloaded Commons crop SHA-256: `1af181314a14bddfb3ca97b58c11d64eb4a9a0b8756a4d624128e2ae3bf9afe0`.

## 4. Credit to use

The requested compact visible wording is accurate:

`Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped for display`

Use it with real links, rather than only plain text:

Marco Reus photo: [Tim Reckmann](https://www.flickr.com/photos/foto_db/16204330530/) · [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) · Cropped for display

This links the creator credit to the exact photograph, identifies its supplied title, links the licence, and indicates the crop. An optional separate source link may point to the Commons crop, since that is the immediate source of the repository asset.

For the durable detailed notice, use this fuller line:

“Marco Reus” by Tim Reckmann, [Flickr photo 16204330530](https://www.flickr.com/photos/foto_db/16204330530/), licensed under [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/). [Wikimedia Commons crop](https://commons.wikimedia.org/wiki/File:Marco_Reus_(16204330530)_(cropped).jpg) by SparklessPlug. Resized to 900 × 1520 and converted to WebP; cropped and colour-adjusted for display where applicable.

The detailed line preserves the known crop history and describes the additional technical/display transformations. It is a recommendation for a later implementation task; nothing was changed here.

## 5. Conflicts and corrections to flag

1. No author or licence conflict: the exact original supports Tim Reckmann and CC BY 2.0. There is no need to switch to another photograph or licence based on this lookup.
2. The earlier relay's example Commons photo `16390921262` is a different photograph. It was useful evidence that the photographer publishes Reus images under CC BY 2.0, but it must not be used as the exact source credit for this asset. Use `16204330530`.
3. Current Loading uses “Display crop,” not the proposed “Cropped for display.” Both describe a crop; the proposed wording is clearer. Loading's credit is currently plain text with no source or licence anchor. Home already supplies both links.
4. The Loading credit has `aria-hidden="true"`. A future attribution fix should make the credit available to assistive technology and keep the source/licence links usable. This is a code observation, not a claim that accessibility alone changes the licence.
5. The compact proposed line omits resizing, WebP conversion, and display colour filtering. Keep the compact line, with the fuller transformation details in the durable notice. “Cropped for display” does not imply this is an untouched original.
6. Flickr's description expressly objects to framing, embedding, and “Deep-Link.” That wording is additional context on the page and should be preserved in the research record. The current application serves its local WebP, rather than embedding/hotlinking the Flickr image. Do not silently treat this wording as a different CC licence, or claim that it conclusively forbids an ordinary attribution hyperlink; that interpretation was not established here.
7. `THIRD_PARTY_NOTICES.md` describes legacy use on both Loading and Home. That describes current main, not the new visual package's scope authority. This lookup does not expand the established Loading-only Reus exception or authorize player photographs on other visual screens.

Licence basis: [CC BY 2.0 legal code](https://creativecommons.org/licenses/by/2.0/legalcode.en), particularly sections 4(a) and 4(b), specifies licence identification and credit, including the supplied title and associated URI where reasonably practicable. The [official deed](https://creativecommons.org/licenses/by/2.0/) explains attribution and modification disclosure. The proposed linked compact line plus the durable detailed notice addresses the observed attribution gaps; this report is not a final legal clearance for unrelated rights or uses.

## 6. Access limits and delivery rule

Repository main, source notices, image binary, relay contract, and source/licence pages were successfully read. Commons original and crop binaries, and the Flickr original binary, were successfully downloaded using an identifying User-Agent after initial image-access errors. The search service could read the Flickr photograph page and follow its licence link, but could not fetch its image preview or original-size page. Those failures did not prevent binary and identity verification.

No Flickr photo ID was guessed. `16204330530` was independently read from repository provenance and the linked Commons/Flickr records.

The requested C2W/W2C labels override the contract's older C2S/S2C examples for this exchange. This does not change the contract or counters for other labels.

Delivery archive: `project-documents/model-relay/archive/W2C-001_reus-photo-source.md`, on `visual/cinematic-system-v10` only. Immediately before publication, I re-resolved that branch to `61d00d2dd75e6e051041bb02831f81970221969f` and re-read `LATEST.md` at that head. It still held `S2C-004_relay-activation`, addressed to Claude, with blob SHA `27bd277cf4cf7d2fc1db058debf2ca1881abaab2`. There was no unanswered message to Sol to preserve.

This full reply is delivered in the archive and the same content in `LATEST.md`, under the owner's explicit delivery rule. It supersedes `S2C-004_relay-activation` as the live transport slot only; its accepted relay decisions and owner product rules remain in force. The archive and live slot are published together in one commit, using a non-forced fast-forward branch-ref update with the observed branch head as parent. Main is not a write target. Claude can now be told: “it is in.”
