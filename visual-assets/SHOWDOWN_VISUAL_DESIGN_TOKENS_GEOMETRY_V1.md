# SHOWDOWN VISUAL — DESIGN TOKENS + GEOMETRY SYSTEM V1
Status: ACTIVE SOL ART-DIRECTION AUTHORITY
Scope: visual proposal work
Purpose: remove ambiguous "make it premium/FIFA-like" instructions from Luna's build contract.

## 1. Palette

BACKGROUND BLACK
- #070809 to #0b0d0f
- use for page mass, chrome and deep panel areas

GRAPHITE PANEL
- #111316 to #17191d
- optional subtle diagonal/brushed texture
- never flat medium gray as the dominant surface

WARM GOLD
- #d6a94a to #e1b54f
- rails, selected state, key outlines, signatures

BRIGHT CTA GOLD
- #f2c94c to #ffd75d
- primary action only
- may use restrained inner highlight / outer bloom

CREAM
- #f4efe3 to #fff7e6
- primary readable text

MUTED WARM GRAY
- #a9a18f to #c1b9a8
- secondary labels only

ERROR
- deep burnt red / amber-black, not saturated app red
- example #7f3428 with warm amber edge

BLUE / CYAN
- not a brand color
- use only if a real product state requires it
- never dominate the visual composition

## 2. Gold hierarchy

Level 1:
- one primary CTA
- active stage
- dominant object emphasis

Level 2:
- title accent
- active board rail
- selected item

Level 3:
- separators
- rim light
- fine strokes
- decorative ticks
- personality signatures

If everything is gold, nothing is priority.

## 3. Typography roles

DISPLAY TITLE
- rights-safe heavy condensed / distressed / brush-energy approximation
- uppercase
- 52–86px desktop depending on screen
- 30–44px mobile
- line-height 0.85–0.98
- slight forward skew allowed: -4deg to -8deg
- subtle dark shadow or duplicate edge
- gold / cream split allowed
- do not use a plain editorial serif/italic as the final visual target

FUNCTIONAL TITLE
- rights-safe condensed sans
- 18–34px desktop
- uppercase
- 0.04–0.10em tracking

LABEL / DATA
- condensed sans
- 10–15px desktop
- 11–16px mobile
- uppercase for headings/status; normal casing allowed inside input values

PERSONALITY SCRIPT
- short Daniel/Nik names, mottos, short flourishes only
- never for primary controls or long instructions

## 4. Geometry

TOP SHELL
- target height 54–66px desktop
- angular/trapezoid ends allowed
- near-black
- thin gold active underline

MAIN SAFE ZONE
- central live-control zone should normally remain inside 62–70% of desktop width
- character art may flank/overlap behind edges but not cover hit targets

PANELS
- shallow or zero radius
- 1px gold/bronze rails
- clipped corners 6–14px
- compact padding 10–20px
- avoid 20px+ soft radius as a default

PRIMARY CTA
- 48–58px desktop height
- 48–56px mobile height
- bright gold
- high-contrast dark text
- visibly stronger than every secondary action

CONTENT DENSITY
- no large blank card interior
- major desktop page should typically keep critical task within one viewport
- if a task needs scrolling, the visual hierarchy must remain obvious

## 5. Character geometry

Desktop hero region:
- character height usually 64–92% of product-canvas height depending on screen
- face must not intersect live control zones
- keep at least 24px visual breathing room around face
- hands/props may approach a stable decorative surface but never a live moving control

Default rivalry placement:
- Daniel left
- Nik right
- acting emphasis changes through lighting/rails, not by swapping physical sides

Character layering:
stadium -> hero art -> live UI

Characters are pointer-inert and non-authoritative.

## 6. Desktop composition

Use 1366×768 as the primary reference canvas.

A screen blueprint must state:
- title zone y-range;
- dominant-object box;
- left/right hero anchor boxes;
- live-control safe zone;
- CTA zone;
- maximum intentional overlap.

No horizontal overflow is allowed.
Accidental internal vertical scrolling should be avoided for the primary desktop composition.

## 7. Mobile composition

390×844 is a separate layout.

Rules:
- large desktop heroes hidden unless blueprint explicitly allows a shallow crop;
- live task first;
- no horizontal overflow;
- primary action full width when practical;
- touch targets near 48px;
- stadium remains atmospheric but quieter;
- typography and gold rails preserve product identity;
- do not shrink the desktop canvas as one unit.

## 8. Material language

Preferred:
- smoked glass
- graphite metal
- diagonal black-on-black texture
- gold metal rail
- warm floodlight haze
- tactical chalk/board lines
- restrained scanline/grid details where screen-specific

Avoid:
- frosted SaaS cards
- glassmorphism blobs
- pill stacks
- default browser form look
- neutral gray dashboards

## 9. Visual QA gate

Sol rejects before product-detail review if:
- dominant object is unclear;
- character pose does not match the screen story;
- page could belong to a generic dark app;
- typography loses the three-role hierarchy;
- gold has no priority hierarchy;
- controls read like a spreadsheet;
- geometry visibly departs from the approved reference family.