# Showdown Visual Asset Library v1

Source-pinned UI/UX asset library for Career Mode Showdown.

Source authority:
* Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
* Main commit: `2da11de1cb6db59e8ec013d9e2122cd51d1b00f5`
* Runtime: `v1.9.1`
* Asset revision: `1.9.1-r7`

Naming:
`CSUX-{seq4}-{surface}-{state}-{kind}-R{rev2}`

Current player-facing index:
* 22 audited screen / overlay / panel assets
* 2 character master IDs reserved for the refined AI likeness pass

Canonical files:
* `00_manifest/asset_index.json`
* `00_manifest/screen_inventory.md`
* `00_manifest/control_map.md`
* `00_manifest/naming_convention.md`
* `00_manifest/source_revision.json`

The complete r7 audit includes runtime-injected Shared Showdown entry, shared League Wheel authority states, shared Club Packs, shared season-length/final confirmation, Shared Career Start, Save Library, Connected Account, registered-device pairing, Private Remote Joining, Statistics, Trophy Room, Legacy, Rule Book, Settings and Atomic Restore.

Accuracy contract:
1. No functional control is invented without an audited live source.
2. Conditional controls stay indexed as conditional states rather than being shown simultaneously in an impossible state.
3. Dynamic values in prototypes are presentation placeholders; labels and functions come from the pinned live source.
4. Character art is a replaceable decorative layer and never changes screen geometry.
