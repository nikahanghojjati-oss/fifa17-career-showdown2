# LIVE PRODUCT SCREEN INVENTORY — V4 BASELINE

Baseline resolved at creation:
main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962
app shell reports v1.9.1 / runtime r46 in index.html

IMPORTANT:
Re-resolve main before every redesign slice. This inventory is a baseline, not permanent truth.

## Static primary screens verified in index.html

1. loadingScreen
2. mainMenu
3. createShowdown
4. leagueWheelScreen
5. clubWheelScreen
6. dashboard
7. transferChallenge
8. seasonEntry
9. seasonSummary
10. legacy

## Dynamic / lazy visual surfaces verified in current JS

11. statistics
   Current-rivalry statistics; dynamically created by js/statistics.js.

12. careerStatistics
   Career-wide analytics; dynamically created by js/statistics.js.

13. trophyRoom
   Opened through optional-module routing.

14. ruleBook
   Dynamically created by js/ruleBook.js.

15. settings
   Modal/overlay surface created by js/settings.js.

16. Legacy History & Backup / Restore
   Legacy now includes backup/export and restore-related runtime surfaces.

## Current Settings responsibilities verified

The current Settings implementation is not a generic preferences modal. It includes multiple product responsibilities that must be visually represented accurately:

APPLICATION
- application version/build
- automatic Showdown storage
- Daniel vs Nik two-device play mode
- update-to-latest-version action/status

ACCESSIBILITY
- follow-device motion
- reduce-motion override
- effective motion state
- optional menu-feedback preference

DEVICE / OFFLINE APP
- installation state
- offline shell state
- connectivity state
- install action
- update/apply-ready-update action

CAREER DATA
- current Showdown summary
- completed history count
- safe Delete Current Showdown
- Open History & Backup
- deletion preserves player identity, registered device, history and settings while closing the current Showdown connection

These responsibilities make the old Settings visual assumptions obsolete.

## Current Home / main-menu responsibilities

The main menu is not only a decorative landing page. Current source/runtime includes:
- Continue/View Completed Showdown state
- New Showdown
- Legacy
- Career Statistics
- Rule Book
- Settings
- dynamic season/showdown indicator
- media/player surface and media controls
- product status / bottom-strip information

The media provider and presentation must be re-resolved against current owner direction before final redesign.

## Current Showdown Home responsibilities

Current dashboard includes:
- Showdown name
- league
- current season / total seasons
- overall status
- transfer-challenge status
- overall score
- series status
- last-season summary when available
- Daniel / Nik club and latest position state
- season-primary action
- back to main menu
- current runtime may inject additional optional-module actions such as Rivalry Statistics

## Current Transfer responsibilities

Transfer is a multi-phase product surface, not one static screen:
- 15-minute transfer window
- start/end actions
- signing entry
- private guess entry
- transfer verdicts
- continue to season results
- actor/privacy-specific states

SV01 currently targets the Guess Entry phase only.

## Current Results responsibilities

Season Entry:
- league position
- league points
- league goals
- domestic cup
- Champions League
- top scorer
- top assist
- Review Season

Season Summary:
- season result
- per-manager summary
- overall Showdown score
- next-season action or completion path
- Showdown Home return

## Current Legacy responsibilities

Legacy is no longer only a simple archive counter. Current runtime includes:
- completed Showdown cards/history
- trophy and total-point metadata
- season history details
- delete specific Showdown
- local backup/export
- restore/recovery-related flow
- destructive maintenance protections

## Connected-play / recovery surfaces requiring later visual audit

Current repository architecture also contains connected-account, persistent pairing, shared-play, reconnect/conflict and recovery behavior. These may appear as overlays, transient states or module-owned surfaces rather than primary index.html sections.

They must not be visually ignored just because they are not static page sections.

## V4 rule

Before redesigning any screen:
1. resolve current main;
2. inspect the screen's current DOM and owning JS/CSS;
3. enumerate user-visible states/actions;
4. compare against the previous visual proposal;
5. mark every stale visual assumption;
6. only then begin art direction.
