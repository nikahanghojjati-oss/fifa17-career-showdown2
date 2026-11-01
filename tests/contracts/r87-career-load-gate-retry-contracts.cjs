#!/usr/bin/env node
'use strict';
// r87 H4 career load gate, the "retry" part (see r87-career-load-gate-browser-contracts.cjs).
global.R87_CAREER_LOAD_GATE_PART='retry';
require('./r87-career-load-gate-browser-contracts.cjs');
