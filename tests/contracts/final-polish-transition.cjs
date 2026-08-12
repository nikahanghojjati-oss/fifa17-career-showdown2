const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert');

class FakeClassList {
  constructor(hidden = false){ this.values = new Set(hidden ? ['hidden'] : []); }
  contains(value){ return this.values.has(value); }
  add(value){ this.values.add(value); }
  remove(value){ this.values.delete(value); }
  toggle(value, force){
    if(force === true){ this.values.add(value); return true; }
    if(force === false){ this.values.delete(value); return false; }
    if(this.values.has(value)){ this.values.delete(value); return false; }
    this.values.add(value); return true;
  }
}

class FakeElement {
  constructor(id, hidden = false){
    this.id = id;
    this.classList = new FakeClassList(hidden);
    this.attributes = new Map();
    this.listeners = new Map();
    this.heading = {
      id: '', dataset: {}, focused: false,
      setAttribute(name, value){ this[name] = String(value); },
      focus(){ this.focused = true; }
    };
  }
  setAttribute(name, value){ this.attributes.set(name, String(value)); }
  getAttribute(name){ return this.attributes.get(name) || null; }
  removeAttribute(name){ this.attributes.delete(name); }
  querySelector(selector){ return selector === 'h2' ? this.heading : null; }
  addEventListener(type, handler){ this.listeners.set(type, handler); }
  removeEventListener(type, handler){ if(this.listeners.get(type) === handler){ this.listeners.delete(type); } }
  finishAnimation(){ const handler = this.listeners.get('animationend'); if(handler){ handler({ target: this }); } }
}

const elements = {
  mainMenu: new FakeElement('mainMenu'),
  createShowdown: new FakeElement('createShowdown', true),
  statistics: new FakeElement('statistics', true)
};
const main = { scrollTop: 91 };
const frames = [];
let feedbackCalls = 0;
let reducedMotion = false;
let timerId = 0;
const context = {
  console,
  currentShowdown: null,
  document: {
    getElementById(id){ return elements[id] || null; },
    querySelector(selector){ return selector === 'main' ? main : null; }
  },
  setTimeout(){ return ++timerId; },
  clearTimeout(){},
  requestAnimationFrame(callback){ frames.push(callback); return frames.length; },
  isReducedMotionPreferred(){ return reducedMotion; },
  consumeMenuFeedbackCue(){ feedbackCalls += 1; }
};
context.window = context;
vm.createContext(context);
const source = fs.readFileSync('js/screens.js', 'utf8');
vm.runInContext(`${source}\n;globalThis.__routes = { showScreen, getNavigationDiagnostics };`, context, { filename: 'js/screens.js' });
const api = context.__routes;

assert.strictEqual(api.showScreen('createShowdown', true, { direction: 'forward' }), true);
assert.strictEqual(elements.mainMenu.classList.contains('hidden'), true, 'Previous screen must hide immediately.');
assert.strictEqual(elements.mainMenu.getAttribute('aria-hidden'), 'true', 'Previous screen must leave the accessibility tree.');
assert.strictEqual(elements.createShowdown.getAttribute('aria-hidden'), 'false', 'Destination must enter the accessibility tree.');
assert.strictEqual(elements.createShowdown.getAttribute('data-route-state'), 'entering');
assert.strictEqual(elements.createShowdown.getAttribute('data-route-direction'), 'forward');
assert.strictEqual(feedbackCalls, 1, 'A successful route commit must consume feedback exactly once.');
frames.splice(0).forEach(callback => callback());
assert.strictEqual(elements.createShowdown.heading.focused, true, 'Destination heading must receive focus.');
assert.strictEqual(main.scrollTop, 0, 'New destinations must open at the top.');
elements.createShowdown.finishAnimation();
assert.strictEqual(api.getNavigationDiagnostics().transitionActive, false, 'Completed transition state must be released.');

reducedMotion = false;
assert.strictEqual(api.showScreen('mainMenu', false, { direction: 'back' }), true);
assert.strictEqual(elements.mainMenu.getAttribute('data-route-direction'), 'back');
assert.strictEqual(api.showScreen('createShowdown', false), true);
assert.strictEqual(elements.mainMenu.getAttribute('data-route-state'), null, 'A newer route must cancel stale transition state.');
assert.strictEqual(elements.createShowdown.getAttribute('data-route-state'), 'entering');

reducedMotion = true;
assert.strictEqual(api.showScreen('mainMenu', false, { direction: 'back' }), true);
assert.strictEqual(elements.mainMenu.getAttribute('data-route-state'), null, 'Reduced motion must skip theatrical route state.');
const feedbackBeforeInvalid = feedbackCalls;
assert.strictEqual(api.showScreen('statistics'), false, 'State-invalid destinations must remain blocked.');
assert.strictEqual(feedbackCalls, feedbackBeforeInvalid, 'Blocked navigation must not consume confirmation feedback.');

const showSource = api.showScreen.toString();
assert.ok(showSource.indexOf('flushScreenBeforeLeave') < showSource.indexOf('beginRouteTransition'), 'Pending writes must flush before presentation begins.');
assert.ok(showSource.indexOf('renderScreenBeforeEnter') < showSource.indexOf('beginRouteTransition'), 'Destination rendering must validate before presentation begins.');
console.log('Central transition, stale-callback cleanup, reduced motion, focus, and save-before-presentation contracts passed.');
