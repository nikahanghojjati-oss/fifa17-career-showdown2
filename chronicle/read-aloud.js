/* THE CHRONICLE · READ ALOUD (Team G, r94)
   A "Listen" bar under the title of every Story page that has real prose: chapters, the latest-release pages
   and the long reads. It uses the device's own speech voices (speechSynthesis), so it costs nothing, needs no
   server, and works on the Chromebook (Chrome) and the iPhone (Safari and the home-screen app).

   Up to three voices are offered, chosen from what the device has, British first. The choice is remembered on
   this device. Speech goes paragraph by paragraph (long paragraphs by sentence), because Chrome stops a single
   long utterance after about 15 seconds and iOS drops very long ones. The paragraph being read gets a gold edge
   and is kept on screen. Pause remembers the paragraph; a chapter that ends turns the page and keeps reading.
   Nothing is laid over the text: the bar sits in the page flow. */
(function(){
  'use strict';
  var main = document.getElementById('book-main');
  // r94 R94-03: on the cover page (index.html) the Listen bar reads the Prologue and the dedication only.
  var home = main ? null : document.getElementById('prologue');
  if(home) main = home.closest('main') || document.body;
  var synth = window.speechSynthesis;
  if(!main || !synth || typeof window.SpeechSynthesisUtterance !== 'function') return;

  var KEY_VOICE = 'chronicle.readAloud.voice', KEY_RATE = 'chronicle.readAloud.rate';
  function store(k, v){ try{ if(v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} }
  function load(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }

  // ---- voices ------------------------------------------------------------------------------------------------
  // Friendly names for voices we know. Anything else keeps the device's own name.
  var KNOWN = [
    [/google uk english male/i, 'British man'], [/google uk english female/i, 'British woman'], [/google us english/i, 'American woman'],
    [/^daniel\b/i, 'British man'], [/^arthur\b/i, 'British man'], [/^oliver\b/i, 'British man'],
    [/^(serena|kate|martha|stephanie)\b/i, 'British woman'],
    [/^samantha\b/i, 'American woman'], [/^(aaron|alex|fred|tom|evan|nathan)\b/i, 'American man'], [/^(ava|allison|susan|zoe|nicky)\b/i, 'American woman'],
    [/^(karen|catherine)\b/i, 'Australian woman'], [/^(lee|gordon)\b/i, 'Australian man'], [/^moira\b/i, 'Irish woman'], [/^(tessa)\b/i, 'South African woman'], [/^rishi\b/i, 'Indian man']
  ];
  function friendly(v){
    for(var i = 0; i < KNOWN.length; i++) if(KNOWN[i][0].test(v.name)) return KNOWN[i][1];
    var lang = (v.lang || '').replace('_', '-');
    var place = /-GB/i.test(lang) ? 'British' : /-US/i.test(lang) ? 'American' : /-AU/i.test(lang) ? 'Australian' : /-IE/i.test(lang) ? 'Irish' : /-IN/i.test(lang) ? 'Indian' : '';
    var short = v.name.replace(/^(Google|Microsoft|Chrome OS|Android)\s+/i, '').replace(/\s*\(.*\)$/, '').replace(/\s+(English|Online|Natural).*/i, '');
    return place ? place + ' · ' + short : short;
  }
  function score(v){
    var lang = (v.lang || '').replace('_', '-'), s = 0, n = v.name;
    if(/^en-GB/i.test(lang)) s += 40; else if(/^en-(US|AU|IE)/i.test(lang)) s += 25; else if(/^en/i.test(lang)) s += 10; else return -1;
    if(/google|enhanced|premium|natural|siri/i.test(n)) s += 12;           // the better-sounding families
    if(/^(daniel|arthur|serena|samantha|kate|martha)\b/i.test(n)) s += 8;
    if(/novelty|bells|bubbles|boing|whisper|zarvox|trinoids|cellos|bad news|good news|organ|jester|superstar|wobble|albert|hysterical|ralph|junior|kathy|princess|deranged|pipe/i.test(n)) return -1;
    return s;
  }
  function pickThree(){
    var all = synth.getVoices() || [], seen = {}, list = [];
    all.map(function(v){ return { v: v, s: score(v), label: friendly(v) }; })
       .filter(function(x){ return x.s >= 0; })
       .sort(function(a, b){ return b.s - a.s; })
       .forEach(function(x){
         // one voice per label, so the three choices really sound different (man / woman / accent)
         if(list.length >= 3 || seen[x.label] || seen['name:' + x.v.name]) return;
         seen[x.label] = seen['name:' + x.v.name] = 1;
         list.push(x);
       });
    if(!list.length && all.length) list.push({ v: all[0], s: 0, label: friendly(all[0]) });
    return list;
  }
  // r94 (Nik 2026-11-15 "can we add couple more voices"): every English voice the device has is offered. The three
  // best stay as quick buttons; the rest sit in a "More voices" list. Voices the person installs on the device
  // (iPhone: Settings > Accessibility > Spoken Content > Voices; Chromebook: Settings > Accessibility > Text-to-Speech)
  // appear here automatically.
  function allEnglish(){
    var all = synth.getVoices() || [], seen = {}, list = [];
    all.map(function(v){ return { v: v, s: score(v), label: friendly(v) }; })
       .filter(function(x){ return x.s >= 0; })
       .sort(function(a, b){ return b.s - a.s || a.v.name.localeCompare(b.v.name); })
       .forEach(function(x){ if(seen[x.v.name]) return; seen[x.v.name] = 1; list.push(x); });
    return list;
  }
  var voices = [], allVoices = [];
  function refreshVoices(){
    voices = pickThree(); allVoices = allEnglish();
    var bar = main.querySelector('.ra-bar');
    if(bar) drawVoices(bar);
  }
  if('onvoiceschanged' in synth) synth.addEventListener('voiceschanged', refreshVoices);
  refreshVoices();
  function chosenVoice(){
    var want = load(KEY_VOICE);
    for(var i = 0; i < voices.length; i++) if(voices[i].v.name === want) return voices[i];
    for(var j = 0; j < allVoices.length; j++) if(allVoices[j].v.name === want) return allVoices[j];
    return voices[0] || null;
  }

  // ---- what to read ------------------------------------------------------------------------------------------
  var SKIP = '.dedication-strokes,.prologue-actions,.ra-bar,.chapter-aside,.novel-notes,.chapter-footer,.chapter-kicker,.book-actions,nav,table,.table-scroll,figure,button,.novel-opener,.novel-end,.novel-break,.visually-hidden,.sr-only,[aria-hidden="true"],.book-toast,script,style';
  function blocks(){
    var roots = home ? [home, document.getElementById('small-axe')].filter(Boolean) : [main];
    var nodes = [];
    roots.forEach(function(r){ Array.prototype.push.apply(nodes, r.querySelectorAll('h1,h2,h3,h4,p,li,blockquote')); });
    var out = [];
    nodes.forEach(function(n){
      if(n.closest(SKIP)) return;
      if(n.tagName === 'P' && n.closest('li,blockquote')) return;        // read the list item or quote once
      if(n.tagName === 'LI' && n.querySelector('li')) return;
      // textContent, not innerText: Chrome's innerText drops the space after a floated drop-cap letter ("I left" became
      // "Ileft"); line breaks become spaces first.
      var c = n.cloneNode(true);
      Array.prototype.forEach.call(c.querySelectorAll('br'), function(br){ br.replaceWith(' '); });
      Array.prototype.forEach.call(c.querySelectorAll('[aria-hidden="true"],.sr-only,.visually-hidden'), function(x){ x.remove(); });
      Array.prototype.forEach.call(c.querySelectorAll('cite'), function(x){ x.before('\u0001'); });   // "quote. Who said it"
      var t = (c.textContent || '').replace(/\s+/g, ' ').replace(/\s*([.!?…])?\s*\u0001\s*/g, function(m, p){ return (p || '.') + ' '; }).trim();
      if(t.length < 2) return;
      if(!n.offsetParent && n.getClientRects().length === 0) return;      // hidden
      out.push({ node: n, text: t });
    });
    return out;
  }
  function readable(){
    var n = 0;
    blocks().forEach(function(b){ if(b.node.tagName === 'P' && b.text.length > 60) n++; });
    return n >= 3;
  }
  // split long text at sentence ends into pieces Chrome and iOS speak reliably
  function pieces(text){
    if(text.length <= 220) return [text];
    var parts = text.match(/[^.!?…]+[.!?…]+["'’”)\]]*\s*|[^.!?…]+$/g) || [text], out = [], cur = '';
    parts.forEach(function(p){
      if((cur + p).length > 220 && cur){ out.push(cur.trim()); cur = ''; }
      while(p.length > 260){ var cut = p.lastIndexOf(',', 240); if(cut < 80) cut = p.lastIndexOf(' ', 240); if(cut < 1) cut = 240; out.push(p.slice(0, cut + 1).trim()); p = p.slice(cut + 1); }
      cur += p;
    });
    if(cur.trim()) out.push(cur.trim());
    return out;
  }
  function spoken(t){
    return t.replace(/—|–/g, ', ').replace(/·/g, ', ').replace(/\b(\d+)\s*-\s*(\d+)\b/g, '$1 to $2').replace(/&/g, ' and ').replace(/[❦⁂†‡]/g, '');
  }

  // ---- the player --------------------------------------------------------------------------------------------
  var state = 'idle';           // idle | playing | paused
  var queue = [], qi = 0, token = 0, lastNode = null, keepAlive = 0, pageKey = '';
  var RATES = [0.9, 1, 1.15, 1.3];
  function rate(){ var r = parseFloat(load(KEY_RATE)); return RATES.indexOf(r) >= 0 ? r : 1; }

  function build(){
    queue = [];
    blocks().forEach(function(b){ pieces(b.text).forEach(function(p){ queue.push({ node: b.node, text: spoken(p) }); }); });
  }
  function mark(node){
    if(lastNode && lastNode !== node) lastNode.classList.remove('ra-current');
    lastNode = node;
    if(!node) return;
    node.classList.add('ra-current');
    var r = node.getBoundingClientRect(), h = window.innerHeight || document.documentElement.clientHeight;
    var header = document.querySelector('.book-header'), top = header ? header.getBoundingClientRect().bottom : 0;
    if(r.top < top + 8 || r.bottom > h - 24){
      try{ node.scrollIntoView({ block: 'center', behavior: 'smooth' }); }catch(e){ node.scrollIntoView(); }
    }
  }
  function speakNext(my){
    if(my !== token || state !== 'playing') return;
    if(qi >= queue.length){ finished(); return; }
    var item = queue[qi], u = new SpeechSynthesisUtterance(item.text), v = chosenVoice();
    if(v){ u.voice = v.v; u.lang = v.v.lang; } else u.lang = 'en-GB';
    u.rate = rate(); u.pitch = 1;
    var done = false;
    function next(){ if(done) return; done = true; if(my !== token) return; qi++; speakNext(my); }
    u.onend = next;
    u.onerror = function(e){ if(e && (e.error === 'interrupted' || e.error === 'canceled')) return; next(); };
    mark(item.node);
    synth.speak(u);
    paint();
  }
  function play(){
    var key = home ? 'home' : location.hash;      // on the cover, in-page links change the hash but not the text
    if(state === 'paused' && key === pageKey && queue.length){ state = 'playing'; token++; synth.cancel(); speakNext(token); startKeepAlive(); return; }
    build(); pageKey = key;
    if(!queue.length) return;
    qi = 0; state = 'playing'; token++;
    synth.cancel();
    speakNext(token);
    startKeepAlive();
  }
  // pause = stop speaking and remember the paragraph (Chrome's own pause() is unreliable with Google voices)
  function pause(){
    if(state !== 'playing') return;
    state = 'paused'; token++;
    // go back to the start of this paragraph, so resuming never starts mid-thought
    while(qi > 0 && queue[qi - 1] && queue[qi] && queue[qi - 1].node === queue[qi].node) qi--;
    synth.cancel(); stopKeepAlive(); paint();
  }
  function stop(){
    state = 'idle'; token++; qi = 0; queue = [];
    synth.cancel(); stopKeepAlive(); mark(null); paint();
  }
  function finished(){
    stopKeepAlive();
    var next = main.querySelector('.novel-next') || main.querySelector('.chapter-footer a:last-child');
    var small = next && next.querySelector('small');
    if(next && small && /NEXT/i.test(small.textContent)){
      state = 'continue';
      location.hash = next.getAttribute('href').replace(/^#/, '');
      return;                    // the new page draws, then attach() starts reading it
    }
    state = 'idle'; qi = 0; mark(null); paint();
  }
  // Chrome on ChromeOS can go silent on long sessions; a gentle resume() nudge keeps it awake. Not needed on iOS.
  function startKeepAlive(){ stopKeepAlive(); keepAlive = setInterval(function(){ if(state === 'playing' && synth.paused) synth.resume(); }, 5000); }
  function stopKeepAlive(){ if(keepAlive) clearInterval(keepAlive); keepAlive = 0; }

  // ---- the bar -----------------------------------------------------------------------------------------------
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function drawVoices(bar){
    var box = bar.querySelector('.ra-voices');
    if(!box) return;
    box.innerHTML = '';
    var cur = chosenVoice();
    if(allVoices.length < 2){ box.hidden = true; return; }
    box.hidden = false;
    voices.forEach(function(x){
      var b = el('button', 'ra-voice', x.label);
      b.type = 'button';
      b.setAttribute('aria-pressed', cur && cur.v.name === x.v.name ? 'true' : 'false');
      b.title = x.v.name;
      b.addEventListener('click', function(){
        store(KEY_VOICE, x.v.name);
        drawVoices(bar);
        if(state === 'playing'){ pause(); play(); }
      });
      box.appendChild(b);
    });
    var quick = {}; voices.forEach(function(x){ quick[x.v.name] = 1; });
    var extra = allVoices.filter(function(x){ return !quick[x.v.name]; });
    if(extra.length){
      var sel = el('select', 'ra-more'); sel.setAttribute('aria-label', 'More voices');
      var first = el('option', '', 'More voices (' + extra.length + ')'); first.value = ''; sel.appendChild(first);
      extra.forEach(function(x){
        var name = x.v.name.replace(/^(Google|Microsoft|Chrome OS|Android)\s+/i, '').replace(/\s*\(.*\)$/, '');
        var o = el('option', '', name + (x.label.indexOf(name) >= 0 ? '' : ' · ' + x.label.replace(/ · .*/, '')));
        o.value = x.v.name; if(cur && cur.v.name === x.v.name) o.selected = true; sel.appendChild(o);
      });
      sel.addEventListener('change', function(){
        if(!sel.value) return;
        store(KEY_VOICE, sel.value);
        drawVoices(bar);
        if(state === 'playing'){ pause(); play(); }
      });
      box.appendChild(sel);
    }
  }
  function paint(){
    var bar = main.querySelector('.ra-bar');
    if(!bar) return;
    var playBtn = bar.querySelector('.ra-play'), stopBtn = bar.querySelector('.ra-stop'), speed = bar.querySelector('.ra-speed');
    var playing = state === 'playing' || state === 'continue';
    playBtn.querySelector('.ra-icon').textContent = playing ? '❚❚' : '▶';
    playBtn.querySelector('.ra-word').textContent = playing ? 'Pause' : state === 'paused' ? 'Resume' : 'Listen';
    playBtn.setAttribute('aria-label', playing ? 'Pause reading' : state === 'paused' ? 'Resume reading' : 'Read this page aloud');
    stopBtn.hidden = state === 'idle';
    speed.textContent = (rate() === 1 ? '1' : String(rate())) + '×';
    bar.classList.toggle('is-playing', playing);
  }
  function attach(){
    if(main.querySelector('.ra-bar')){ return; }
    if(state !== 'continue'){ if(state !== 'idle') stop(); }
    if(!readable()) return;
    var title = home ? home.querySelector('h2') : (main.querySelector(':scope > h1') || main.querySelector('h1'));
    var after = title && title.nextElementSibling && title.nextElementSibling.classList.contains('book-intro') ? title.nextElementSibling : title;
    var bar = el('div', 'ra-bar');
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Listen to this page');
    var playBtn = el('button', 'ra-play'); playBtn.type = 'button';
    playBtn.appendChild(el('span', 'ra-icon', '▶')); playBtn.appendChild(el('span', 'ra-word', 'Listen'));
    playBtn.addEventListener('click', function(){ if(state === 'playing') pause(); else play(); });
    var stopBtn = el('button', 'ra-stop', '■'); stopBtn.type = 'button'; stopBtn.setAttribute('aria-label', 'Stop reading'); stopBtn.hidden = true;
    stopBtn.addEventListener('click', stop);
    var speed = el('button', 'ra-speed', '1×'); speed.type = 'button'; speed.setAttribute('aria-label', 'Reading speed');
    speed.addEventListener('click', function(){
      var i = RATES.indexOf(rate()); store(KEY_RATE, String(RATES[(i + 1) % RATES.length])); paint();
      if(state === 'playing'){ pause(); play(); }
    });
    var voicesBox = el('div', 'ra-voices'); voicesBox.setAttribute('role', 'group'); voicesBox.setAttribute('aria-label', 'Voice');
    bar.appendChild(playBtn); bar.appendChild(stopBtn); bar.appendChild(speed); bar.appendChild(voicesBox);
    if(after && after.parentNode) after.parentNode.insertBefore(bar, after.nextSibling);
    else main.insertBefore(bar, main.firstChild);
    drawVoices(bar);
    paint();
    if(state === 'continue'){ state = 'idle'; setTimeout(play, 350); }
  }

  var pending = 0;
  new MutationObserver(function(){ if(pending) return; pending = requestAnimationFrame(function(){ pending = 0; attach(); }); })
    .observe(main, { childList: true });
  window.addEventListener('hashchange', function(){ if(!home && (state === 'playing' || state === 'paused')){ stop(); } });
  window.addEventListener('pagehide', function(){ synth.cancel(); });
  attach();
})();
