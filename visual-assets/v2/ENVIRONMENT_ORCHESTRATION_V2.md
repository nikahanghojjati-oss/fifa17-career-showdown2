# SHOWDOWN VISUAL — ENVIRONMENT ORCHESTRATION V2

## Strategy

Treat environments as a reusable spatial system, not one background JPEG per screen.

Each environment is composed from:

`ARCHITECTURE PLATE + LIGHT RECIPE + COLOR GRADE + WORLD DECOR + SCREEN OBJECT + LIVE UI`

## Architecture plates

Maintain a small set of camera geometries:
- frontal stadium bowl
- close manager war-room / technical area
- ceremonial center-stage
- trophy/legacy stage
- analytical night stadium

New camera geometry is generated only when existing plates cannot support the intended composition.

## Light recipes

HOME_GOLDEN_RIVALRY
broad warm floodlight, welcoming competitive energy

SETUP_COMMAND
cleaner center light, lower background complexity, formal decision energy

LEAGUE_SPOTLIGHT
concentrated center gold, darker flanks, wheel emphasis

CLUB_PACK_CEREMONY
high-contrast pack-edge light, suspense

TRANSFER_DEADLINE_WARROOM
deep blacks, narrow practical gold, desk/tactical light, urgency

RESULTS_FLOODLIGHT
strong face/scoreboard separation, judicial competition

RESULTS_CELEBRATION
expansive warm bloom, brighter crowd, optional confetti atmosphere

STATS_NIGHT_ANALYTIC
cooler-neutral blacks with precise gold accents, minimal haze

TROPHY_GOLDEN_CEREMONY
centered prestige glow, controlled background

RULES_PLAYBOOK
stable even light, reduced haze, readable dense UI

## Banner system

Banners may contain only durable brand/world phrases:
- TWO MANAGERS · ONE LEGACY
- FOOTBALL BRINGS US TOGETHER
- DIFFERENT MANAGERS · SAME PASSION
- RIVALS BUILD LEGACIES

Do not bake:
- season number
- score
- timer
- club name
- player name
- current phase
- live result

## Safe-zone metadata

Every approved environment should record:
- horizon y
- bright-light hotspots
- left hero zone
- right hero zone
- center live-UI safe zone
- mobile crop center
- banner/noise areas to avoid for text

## Decision rule

If the base plate + CSS/SVG grade can produce the required emotional change, REUSE_WITH_GRADE.

Generate a new environment only when the spatial story changes.