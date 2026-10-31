#!/usr/bin/env node
'use strict';
// r87 career fixes, the phone pager (A-06) and long-career navigation half of r87-career-fixes-browser-contracts.cjs (split so each file stays well
// inside the runner's 120 s): History opens on the newest Showdown; more than ten positions use "‹ n / N ›", « » jumps, a
// scrubber, ← → / Home / End on desktop and a sideways swipe on a phone.
global.R87_CAREER_FIXES_PART='nav';
require('./r87-career-fixes-browser-contracts.cjs');
