# Screen 02 — Create Showdown / `createShowdown`

Status: ACTIVE SCREEN CONTRACT

Source anchor: current `main` at `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`.

## Purpose

Create Showdown is the premium pre-match setup step. It should feel deliberate and competitive while remaining a form first. Decorative character art is intentionally excluded.

## Exact current product controls

Preserve the current real fields and actions:

- Showdown Name text input;
- Manager 1 text input;
- Manager 2 text input;
- Number of Rounds selector with 1, 3, 5 and 10;
- Start Showdown;
- Back.

The visual proposal does not add fields, alter supported lengths or create a second setup authority.

## Composition

Use a centered dark setup panel with a thin warm-gold competition rail. Place a procedural two-manager rivalry divider near the manager fields so the relationship reads as equal opposing sides without using portraits.

Showdown Name remains the first field and spans the available content width.

Manager 1 and Manager 2 may become equal side-by-side fields on wide desktop. On Chromebook/mobile they stack in DOM order.

The existing select remains the product control. The senior developer may visually present its four allowed values as competition tiles only if semantics, keyboard behavior and value authority remain native and unambiguous. Otherwise style the select as a premium compact control and preserve the current options exactly.

Start Showdown is the only dominant gold action. Back remains visually secondary.

## Manager identity treatment

No new character generation and no A01/A02 requirement.

If the proposal shows canonical owner example content, Manager 1 maps to Daniel and Manager 2 maps to Nik. In production, the fields remain user-entered product data.

Use original initials/number badges or pure typography only. No raw photos.

## Validation states

The final proposal must cover:

- untouched empty form;
- focused input;
- completed valid form;
- invalid/missing required value state if surfaced by current product;
- duplicate/unsupported state if current product exposes one;
- Start Showdown disabled/busy state if applicable;
- keyboard focus on Start and Back.

Validation copy stays immediately adjacent to its field. Gold atmosphere must never reduce error legibility.

## Responsive contract

Wide desktop may use a two-column manager row and compact season/round choice zone.

At 1179px and below, use a character-free single content column or two-column field layout only where labels remain comfortably readable.

Mobile stacks fields and actions with at least 44px targets. Avoid fixed-height panels that can hide validation messages behind the viewport.

## Asset resolution

- two-manager rivalry divider/badge system: original procedural vector/CSS asset required;
- season-length treatment: DOM/CSS solution, no external asset required;
- validation/focus examples: proposal reference CSS, no external asset required;
- character art: intentionally not required.

New image generation: CLOSED.

## Acceptance checks

- exact four supported lengths remain 1/3/5/10;
- exactly two manager fields remain visible and equal in hierarchy;
- Start Showdown is the dominant action without obscuring Back;
- every label/input pair remains associated and readable;
- keyboard and touch operation remain native;
- validation is not communicated by color alone;
- no decorative asset overlaps fields or messages;
- no extra product field or gameplay rule is invented;
- no proprietary crest/font/screen asset is introduced.

## Final-main reconciliation

Re-read the final `createShowdown` DOM before senior handoff. Any new validation or identity state introduced by the main developer must be incorporated without restarting the approved visual direction.