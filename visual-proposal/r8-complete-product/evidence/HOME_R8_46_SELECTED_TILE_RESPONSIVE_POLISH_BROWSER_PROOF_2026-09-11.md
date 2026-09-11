# Home R8.46 Selected-Tile + Responsive Polish Browser Proof

Status: `ASSEMBLED_PROPOSAL / BROWSER-PROVEN / OWNER REVIEW OPEN / PRODUCTION INTEGRATION NOT AUTHORIZED`

Date: 2026-09-11

## Authority snapshot

- Production `main` was independently re-resolved immediately before the continuation pass at `3c5fb2589414f8f497d1f7cb174200ef84290431` (`1.9.1-r18`).
- Visual branch was independently re-resolved at `382b63efcdfe3cd88a2e5aa27211f5f5e533a47c` before R8.46 work.
- The owner reattached the premium black/gold Home, Select League and Club Assignment references. They remain `REFERENCE_ONLY / OWNER VISUAL-LANGUAGE AUTHORITY` and are not implementation screenshots.
- No image-generation call was used.
- No production logic, Firebase, Firestore Rules, saves, routing, scoring, shared-session behavior, media runtime or reveal runtime was changed.

## Starting point

R8.44 had already rebuilt the real Home presentation around the current production-owned seams:

1. `#continueCareer`
2. `#newShowdown`
3. `#legacyButton`
4. `#careerStatisticsButton`
5. `#ruleBookButton`
6. `#settingsButton`
7. `#menuMusicPlayer`
8. `#menuMusicStatus`
9. `#menuMusicToggle`
10. `#menuMusicMute`

The R8.44 browser assembly was visually close to the supplied Home reference, but the selected Continue Career tile still allowed its decorative player/17 motif to crowd the live `CONTINUE CAREER` label.

## R8.46 bounded correction

R8.46 changes presentation only.

### Selected tile object/text separation

- The selected Continue Career player/17 motif is reduced and shifted into its own left visual lane.
- The live `CONTINUE CAREER` DOM label receives a dedicated text lane to the right of the object.
- The arrow remains a separate browser-owned affordance.
- The gold selected treatment remains unchanged.
- No text is baked into the object artwork.

### Intermediate fallback correction

The first R8.46 matrix exposed object/text overlap at 1179px and 940px because the wider 3-column fallback changes the inline SVG scaling relationship.

That failure was fixed by moving only the selected tile's decorative SVG farther left inside the intermediate/fallback layout. Product geometry and action ownership were not changed.

### Mobile vertical-flow correction

A second inspection exposed a small mobile overlap between the `RIVALRY HEADQUARTERS` copy and soundtrack card at 390x844 DPR2.

R8.46 moves the soundtrack card, action grid and footer down as one deterministic mobile stack and increases the mobile proposal canvas height accordingly.

The final mobile order is disjoint:

`Home copy -> soundtrack module -> six-action grid -> footer`.

## Chromium matrix

Two deterministic Home presentation states were exercised across six viewport conditions:

- 1440x900 DPR1
- 1366x768 DPR1
- 1280x720 DPR1
- 1179x800 DPR1
- 940x700 DPR1 with reduced motion
- 390x844 DPR2

States:

- `active`
- `empty`

Result: `12/12 PASS`.

## Machine checks

Every final case asserts:

- no horizontal overflow;
- exactly six real Home action buttons;
- Play and Mute media controls present;
- Continue Career disabled only in `empty`;
- correct selected/primary action for active versus empty state;
- Daniel/Nik decorative character and manager layers fail closed at `<=1179px`;
- Continue Career live label remains inside its real button;
- Continue Career decorative player/17 object is disjoint from its live label;
- Home copy is disjoint from the soundtrack module;
- soundtrack module is disjoint from the action grid;
- action grid is disjoint from the footer.

## Persistent owner-review artifacts

Stored in `/Showdown visual/R8_46_Home_Polish/`:

- `home-r8-46-selected-tile-polish.html`
- `HOME_R8_46_1366_ACTIVE.png`
- `HOME_R8_46_1366_EMPTY.png`
- `HOME_R8_46_390_ACTIVE_FULL.png`
- `HOME_R8_46_BROWSER_QA_12_CASES.json`

The HTML is the real browser owner-review assembly. Screenshots are evidence of that assembly, not source-of-truth implementation images.

## Authority labels

- Owner references: `REFERENCE_ONLY`
- Existing stadium/character source family: retains its prior candidate/source authority; no silent promotion
- R8.46 browser assembly: `ASSEMBLED_PROPOSAL`
- Production integration: not authorized
- `OWNER_APPROVED_FINAL`: false

## Image-generation gate

R8.46 does not justify a generation call. The observed Home defects were deterministic HTML/CSS/SVG geometry issues and were solved in the browser layer.

Image generation remains subordinate source-asset rendering only and stays locked unless GPT-5.6 Sol writes a bounded `READY` asset ticket that cannot reasonably be satisfied by the current source-art family plus real HTML/CSS/JS/SVG presentation.
