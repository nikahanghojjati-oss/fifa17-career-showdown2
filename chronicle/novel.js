/* THE CHRONICLE · CLAUDE EDITION · reading mode (Team G, r88 / 2.1.0)
   Every chapter opens like a page in a bound novel: the book's contents slide away, the chapter gets a proper
   opener (Volume in roman numerals, "Chapter Twelve" in words, a fleuron), the evidence becomes endnotes under the
   prose, and the last line hands over to a "Turn the page" leaf. Arrow keys turn pages. Nothing here changes the
   words or the data; it decorates what book.js has just drawn into #book-main. */
(function(){
  'use strict';
  var main = document.getElementById('book-main');
  if(!main) return;
  var ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  var TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function words(n){
    if(n < 20) return ONES[n];
    if(n < 100) return TENS[Math.floor(n/10)] + (n%10 ? '-' + ONES[n%10] : '');
    var rest = n % 100;
    return ONES[Math.floor(n/100)] + ' Hundred' + (rest ? ' and ' + words(rest) : '');
  }
  function roman(n){
    var map = [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']], out = '';
    if(n >= 40) return String(n);
    map.forEach(function(m){ while(n >= m[0]){ out += m[1]; n -= m[0]; } });
    return out;
  }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }

  var progress = el('div', 'novel-progress');
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  function onScroll(){
    if(!document.body.classList.contains('is-reading')){ progress.style.transform = 'scaleX(0)'; return; }
    var doc = document.documentElement, max = doc.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1) + ')';
  }

  function decorate(){
    var prose = main.querySelector('.chapter-prose');
    document.body.classList.toggle('is-reading', !!prose);
    onScroll();
    if(!prose || main.querySelector('.novel-opener')) return;

    var kicker = main.querySelector('.chapter-kicker span');
    var eyebrow = main.querySelector(':scope > .eyebrow');
    var title = main.querySelector(':scope > h1');
    var numMatch = kicker && /CHAPTER\s+0*(\d+)/i.exec(kicker.textContent);
    var volMatch = eyebrow && /VOLUME\s+0*(\d+)\s*\/\s*(.+)$/i.exec(eyebrow.textContent.trim());

    // the opener: ornament, volume, chapter number in words
    if(title){
      var opener = el('div', 'novel-opener');
      opener.setAttribute('aria-hidden', 'true');
      opener.appendChild(el('span', 'novel-fleuron', '❦'));
      if(volMatch) opener.appendChild(el('span', 'novel-volume', 'Book ' + roman(+volMatch[1]) + ' · ' + volMatch[2]));
      if(numMatch) opener.appendChild(el('span', 'novel-number', 'Chapter ' + words(+numMatch[1])));
      title.parentNode.insertBefore(opener, eyebrow || title);
    }

    // a quiet section break before every boxed aside inside the prose, like a scene change
    Array.prototype.forEach.call(prose.querySelectorAll(':scope > .book-callout, :scope > figure, :scope > .table-scroll'), function(node){
      var prev = node.previousElementSibling;
      if(prev && prev.classList.contains('novel-break')) return;
      var brk = el('p', 'novel-break', '⁂');
      brk.setAttribute('aria-hidden', 'true');
      node.parentNode.insertBefore(brk, node);
    });

    // the next-chapter link becomes a leaf you turn
    var footer = prose.querySelector('.chapter-footer');
    if(footer){
      footer.classList.add('novel-turn');
      var links = footer.querySelectorAll('a');
      Array.prototype.forEach.call(links, function(a){
        var small = a.querySelector('small');
        if(small && /NEXT/i.test(small.textContent)) a.classList.add('novel-next');
        if(small && /PREVIOUS/i.test(small.textContent)) a.classList.add('novel-prev');
      });
      var next = footer.querySelector('.novel-next');
      if(next && !next.querySelector('.novel-turn-cue')) next.insertBefore(el('span', 'novel-turn-cue', 'Turn the page'), next.firstChild);
      var end = el('p', 'novel-end', '— ❦ —');
      end.setAttribute('aria-hidden', 'true');
      footer.parentNode.insertBefore(end, footer);
    }

    // the evidence reads as endnotes under the chapter
    var aside = main.querySelector('.chapter-aside');
    if(aside){
      aside.classList.add('novel-notes');
      var head = aside.querySelector('.eyebrow');
      if(head && !aside.querySelector('.novel-notes-title')) head.parentNode.insertBefore(el('h2', 'novel-notes-title', 'Notes & sources'), head.nextSibling);
    }
  }

  new MutationObserver(decorate).observe(main, { childList: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  document.addEventListener('keydown', function(e){
    if(!document.body.classList.contains('is-reading')) return;
    if(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || (e.target.closest && e.target.closest('input,textarea,select'))) return;
    var link = e.key === 'ArrowRight' ? main.querySelector('.novel-next') : e.key === 'ArrowLeft' ? main.querySelector('.novel-prev') : null;
    if(link){ e.preventDefault(); location.hash = link.getAttribute('href').replace(/^#/, ''); }
  });
  decorate();
})();
