# R8 Global Visual System

Status: PROPOSAL AUTHORITY ONLY

Production implementation remains owned by the senior developer after final visual approval. This document defines presentation behavior inside `visual-proposal/r8-complete-product/` and must not be treated as a production runtime authority.

## Product anchor

Validated main anchor at this proposal slice: `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`, app `v1.9.1`, runtime `1.9.1-r12`.

The proposal preserves all product rules, storage, routing, scoring, Firebase/Spark, pairing, Remote Joining and shared-play authority unchanged.

## Core material tokens

Use these proposal tokens consistently across screen contracts and reference compositions:

```css
--r8-black: #080b0e;
--r8-ink: #10151a;
--r8-panel: rgba(10,14,18,.90);
--r8-panel-solid: #0d1216;
--r8-panel-soft: rgba(18,22,26,.82);
--r8-gold: #f3cc4f;
--r8-gold-deep: #b98216;
--r8-gold-line: rgba(243,204,79,.56);
--r8-cream: #f5f0e4;
--r8-muted: #bdb49a;
--r8-success: #7fd77a;
--r8-warning: #f0bd45;
--r8-danger: #dc6f6f;
```

Use black/charcoal as the shell, warm gold for active competition emphasis, cream/white for primary text, and muted warm neutrals for supporting copy. Red is reserved for destructive/error states. Green is reserved for genuinely confirmed success.

## Three presentation levels

### Level A: competition and emotional screens

Applies to Home, League Wheel, Club Assignment, Showdown Home and selected Season Summary states.

Allow restrained stadium atmosphere, stronger gold framing, large competition numerals and approved character art where it does not compete with controls.

### Level B: information and archive screens

Applies to statistics, career statistics, trophy room, rule book and ordinary Legacy history.

Use charcoal cards, thin gold rules, restrained background energy and clear information density. Character art is optional and normally omitted.

### Level C: provider, safety and recovery surfaces

Applies to Save Library safety states, Connected Account, Pairing, Connected Rivalry, Remote Joining, backup/import/restore, offline/update and destructive confirmations.

Use maximum legibility and minimum decoration. No continuous background animation behind authentication, pairing, restore, destructive or critical recovery controls.

## Typography

Core UI text remains real DOM text. Do not bake labels, manager names, club names, scores, timer values, status text or navigation labels into artwork.

Use rights-safe/system stacks only. The proposal may describe condensed-looking display typography but may not require proprietary FIFA/EA fonts.

## Interaction and accessibility

Minimum interactive target: 44px.

Every interactive control requires a visible focus state that remains visible against both gold and dark surfaces. A recommended reference treatment is a dark inner outline plus cream and gold outer rings so focus cannot disappear into a gold border.

Disabled and waiting controls retain readable explanatory state. Opacity alone must never communicate why progression is unavailable.

Decorative artwork is pointer inert, non-focusable and `aria-hidden` when implemented by the senior developer.

## Responsive tiers

### Wide desktop: 1280px and above

Full atmosphere is allowed. A01/A02 may appear on selected screens. Controls and live information remain inside an explicit central interaction-safe zone.

### Reduced wide: 1180px to 1279px

Decorative character art may remain only when it can be cropped without crowding. Decorative layers yield before controls, labels or data yield.

### Chromebook/tablet: 1179px and below

Large character art is omitted by default. Primary actions and readable state remain first-class. No hero asset may push the main action below the useful viewport.

### Mobile

Use a single-column progression by default. Large A01/A02 art is omitted. Long identifiers and tables must remain horizontally safe or use an intentional stacked representation.

## Motion

Normal motion may use short panel entrances, gold-line sweeps, restrained card lift or sheen and subtle atmosphere drift. Existing gameplay-owned wheel/pack reveal motion remains product authority.

Reduced-motion mode suppresses decorative translation, scale and continuous motion while preserving immediate state changes and all required controls.

No visual transition may delay save completion, navigation, provider acknowledgement, shared-play authority or error recovery.

## Character authority

A01 is Nik and A02 is Daniel. Both are immutable approved AI character masters.

Manager mapping is permanent throughout this proposal:

Manager 1 = Daniel

Manager 2 = Nik

Never replace either with a raw photograph. Never regenerate either because a composition is inconvenient. Crops, masks, responsive omission and character-free layouts are preferred before any new pose is considered.

## Rights-safe contract

Do not introduce official club crests, proprietary EA/FIFA fonts, copied FIFA menu screens, copied menu audio, downloaded soundtrack files or unlicensed footballer photography as new R8 proposal assets.

The intended result is original football-rivalry presentation with FIFA-17-era energy, not asset copying.