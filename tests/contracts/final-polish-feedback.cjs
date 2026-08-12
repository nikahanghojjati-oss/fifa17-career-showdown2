const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert');

const values = new Map([
  ['careerModeShowdown.preferences', JSON.stringify({ schemaVersion: 1, reducedMotion: true })]
]);
const storageContext = {
  console, Date, JSON, structuredClone, setTimeout, clearTimeout,
  localStorage: {
    getItem(key){ return values.has(key) ? values.get(key) : null; },
    setItem(key, value){ values.set(key, String(value)); },
    removeItem(key){ values.delete(key); }
  },
  document: { documentElement: { dataset: {} }, visibilityState: 'visible', addEventListener(){} },
  CustomEvent: function(type, init){ this.type = type; this.detail = init && init.detail; },
  matchMedia(){ return { matches: false, addEventListener(){}, addListener(){} }; },
  addEventListener(){}, dispatchEvent(){ return true; }
};
storageContext.window = storageContext;
vm.createContext(storageContext);
const storageSource = fs.readFileSync('js/storage.js', 'utf8');
vm.runInContext(`${storageSource}\n;globalThis.__preferences = { loadApplicationPreferences, isMenuFeedbackEnabled, setApplicationMenuFeedbackPreference };`, storageContext, { filename: 'js/storage.js' });
const preferences = JSON.parse(JSON.stringify(storageContext.__preferences.loadApplicationPreferences()));
assert.deepStrictEqual(preferences, { schemaVersion: 2, reducedMotion: true, menuFeedback: true }, 'v1 preferences must migrate safely with feedback enabled.');
assert.strictEqual(storageContext.__preferences.setApplicationMenuFeedbackPreference(false), true);
assert.strictEqual(storageContext.__preferences.isMenuFeedbackEnabled(), false);

let clock = 1000;
let oscillatorCount = 0;
let feedbackEnabled = true;
let mediaPlaying = false;
const parameter = { setValueAtTime(){}, exponentialRampToValueAtTime(){} };
class FakeAudioContext {
  constructor(){ this.state = 'running'; this.currentTime = 1; this.destination = {}; }
  createGain(){ return { gain: { ...parameter }, connect(){ return this; }, disconnect(){} }; }
  createOscillator(){
    oscillatorCount += 1;
    return { type: '', frequency: { ...parameter }, connect(){ return this; }, start(){}, stop(){}, disconnect(){}, addEventListener(){} };
  }
  resume(){ this.state = 'running'; return Promise.resolve(); }
  suspend(){ this.state = 'suspended'; return Promise.resolve(); }
}
const audioContext = {
  console,
  Date,
  performance: { now(){ return clock; } },
  document: { visibilityState: 'visible', addEventListener(){} },
  AudioContext: FakeAudioContext,
  isMenuFeedbackEnabled(){ return feedbackEnabled; },
  isMenuMediaPlaying(){ return mediaPlaying; }
};
audioContext.window = audioContext;
vm.createContext(audioContext);
const audioSource = fs.readFileSync('js/menuFeedback.js', 'utf8');
vm.runInContext(`${audioSource}\n;globalThis.__feedback = { playMenuFeedbackCue, getMenuFeedbackDiagnostics };`, audioContext, { filename: 'js/menuFeedback.js' });
const feedback = audioContext.__feedback;

assert.strictEqual(feedback.playMenuFeedbackCue(), true);
assert.strictEqual(oscillatorCount, 2, 'Original cue must use its restrained two-voice synthesis.');
assert.strictEqual(feedback.playMenuFeedbackCue(), false, 'Rapid repeat feedback must be throttled.');
assert.strictEqual(oscillatorCount, 2);
clock += 111;
assert.strictEqual(feedback.playMenuFeedbackCue(), true);
assert.strictEqual(oscillatorCount, 4);
clock += 111; mediaPlaying = true;
assert.strictEqual(feedback.playMenuFeedbackCue(), false, 'Home media playback must suppress the cue.');
mediaPlaying = false; feedbackEnabled = false;
assert.strictEqual(feedback.playMenuFeedbackCue(), false, 'The persisted mute preference must suppress the cue.');
assert.strictEqual(feedback.getMenuFeedbackDiagnostics().synthesis, 'original-web-audio');

assert.ok(!/new\s+Audio\s*\(/.test(audioSource), 'Recorded Audio assets must not be introduced.');
assert.ok(!/(?:https?:|\.mp3|\.wav|\.ogg)/i.test(audioSource), 'Feedback synthesis must not fetch or embed a recorded asset.');
const html = fs.readFileSync('index.html', 'utf8');
const optional = fs.readFileSync('js/optionalModules.js', 'utf8');
const menuExperience = fs.readFileSync('js/menuExperience.js', 'utf8');
assert.ok(!html.includes('js/menuFeedback.js'), 'Feedback synthesis must remain outside the initial shell.');
assert.ok(optional.includes('"js/menuFeedback.js"'), 'Feedback synthesis must use the established lazy loader.');
assert.ok(menuExperience.includes('window.addEventListener("click", recordMenuFeedbackInteraction, true)'), 'Feedback intent must run before centralized Back stops document propagation.');
console.log('Preference migration, user mute, media suppression, cooldown, and original Web Audio synthesis passed.');
