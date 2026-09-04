/* ============================================================
   The Investor's Roundtable — motion + interactions

   Effects follow inkgames.com, which runs Lenis + GSAP + Three.js.
   Reimplemented by hand so this page ships with no dependencies:
     · lerped smooth scroll                    (Lenis)
     · split-text line reveals, staggered      (GSAP SplitText)
     · clip-path wipes on media                (ScrollTrigger)
     · scroll depth, spin and mouse parallax   (ScrollTrigger)
     · scroll-velocity push on the photo strips
   ============================================================ */
(function () {
  'use strict';
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse  = matchMedia('(pointer: coarse)').matches;

  /* ══ 1. NATIVE SCROLL ══════════════════════════════════════
     Keep scrolling browser-native on every input method. The previous
     wheel interception could fight scrollbar dragging and leave the page
     pinned to a stale virtual target on some desktop browsers. CSS handles
     the optional smooth behaviour for in-page links. */
  var Scroll = { y: window.scrollY, target: window.scrollY, vel: 0, smooth: false };

  function maxScroll() { return document.documentElement.scrollHeight - innerHeight; }

  /* ══ 2. EDITORIAL SHOWCASE — THE TWO STRIPS ════════════════
     The looping drift is CSS. This adds the part CSS cannot feel: how
     hard you are scrolling. Velocity pushes the two strips apart, skews
     them a little, and then they settle back to rest. Hovering a frame
     holds both strips so the photo you are looking at stops moving. */
  var reel = $('#showcase');
  var reelRows = reel ? $$('.reel__drift', reel) : [];
  var reelPush = [0, 0];

  if (reel && !reduced) {
    if (!coarse) {
      reel.addEventListener('pointerenter', function () { reel.classList.add('is-held'); });
      reel.addEventListener('pointerleave', function () { reel.classList.remove('is-held'); });
    }
    /* a tap on touch holds the strips for a beat, then lets them run on */
    if (coarse) {
      var holdT;
      reel.addEventListener('touchstart', function () {
        reel.classList.add('is-held');
        clearTimeout(holdT);
        holdT = setTimeout(function () { reel.classList.remove('is-held'); }, 2200);
      }, { passive: true });
    }
  }

  function reelDrift() {
    if (!reelRows.length || reduced) return;
    var r = reel.getBoundingClientRect();
    if (r.bottom < -300 || r.top > innerHeight + 300) return;   /* off screen: idle */
    var kick = clamp(Scroll.vel * 1.6, -90, 90);
    reelRows.forEach(function (row, i) {
      var dir = i === 0 ? 1 : -1;
      reelPush[i] += (kick * dir - reelPush[i]) * 0.12;          /* chase, then decay */
      reelPush[i] *= 0.9;
      row.style.setProperty('--vx', reelPush[i].toFixed(1) + 'px');
      row.style.setProperty('--sk', (reelPush[i] * 0.035).toFixed(2) + 'deg');
    });
  }

  /* ══ 3. SPLIT TEXT ═════════════════════════════════════════
     Group words into real lines by their offsetTop, then wrap each
     line in an overflow-hidden block so it can slide up from below.
     The untouched sentence stays in the DOM for screen readers. */
  function splitLines(el) {
    if (el.dataset.orig === undefined) el.dataset.orig = el.innerHTML;
    else el.innerHTML = el.dataset.orig;
    var nodes = Array.prototype.slice.call(el.childNodes);
    var frag = document.createDocumentFragment();

    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span');
          w.className = 'w'; w.textContent = tok;
          frag.appendChild(w);
        });
      } else {
        frag.appendChild(n.cloneNode(true));
      }
    });

    el.textContent = '';
    el.appendChild(frag);

    /* measure, then bucket by vertical position */
    var lines = [], last = null;
    $$('.w, br', el).forEach(function (n) {
      if (n.tagName === 'BR') { last = null; return; }
      var top = Math.round(n.offsetTop);
      if (last === null || Math.abs(top - last) > 4) { lines.push([]); last = top; }
      lines[lines.length - 1].push(n);
    });
    if (!lines.length) return;

    /* rebuild the sentence FROM the measured lines, so a <br> that carried
       no surrounding space does not glue two words together for a reader */
    var full = lines.map(function (ws) {
      return ws.map(function (w) { return w.textContent; }).join(' ');
    }).join(' ');

    el.textContent = '';
    var sr = document.createElement('span');
    sr.className = 'sr-only'; sr.textContent = full;
    el.appendChild(sr);

    var host = document.createElement('span');
    host.className = 'split'; host.setAttribute('aria-hidden', 'true');
    lines.forEach(function (words, i) {
      var line = document.createElement('span');
      line.className = 'split__line';
      line.style.setProperty('--d', (i * 0.1) + 's');
      var inner = document.createElement('span');
      inner.textContent = words.map(function (w) { return w.textContent; }).join(' ');
      line.appendChild(inner);
      host.appendChild(line);
    });
    el.appendChild(host);
  }
  /* single-line mask, for headings whose inner markup must survive */
  $$('[data-reveal="mask"]').forEach(function (el) {
    var w = document.createElement('span');
    w.className = 'maskwrap';
    while (el.firstChild) w.appendChild(el.firstChild);
    el.appendChild(w);
  });

  /* Lines must be measured in the REAL display face. Splitting before
     Manrope lands would group words against the fallback
     metrics and put the breaks in the wrong places. */
  function whenFontsReady(fn) {
    var done = false, go = function () { if (!done) { done = true; fn(); } };
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); setTimeout(go, 1500); }
    else go();
  }

  /* ══ 4. REVEAL ON ENTER ════════════════════════════════════ */
  var io = new IntersectionObserver(function (rows) {
    rows.forEach(function (row) {
      if (!row.isIntersecting) return;
      row.target.classList.add('in');
      if (row.target.id === 'fan') row.target.classList.add('spread');
      io.unobserve(row.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  $$('.sec .wrap:not([data-static]), .fan').forEach(function (el) { el.setAttribute('data-rise', ''); });
  $$('[data-rise], [data-reveal], [data-clip]').forEach(function (el) { io.observe(el); });
  var splitTargets = $$('[data-split]');
  whenFontsReady(function () {
    splitTargets.forEach(function (el) {
      splitLines(el);
      el.classList.add('ready');
      io.observe(el);
    });
    /* lines are measured, so a width change has to re-measure them */
    var w = innerWidth, t;
    addEventListener('resize', function () {
      if (innerWidth === w) return;
      w = innerWidth;
      clearTimeout(t);
      t = setTimeout(function () {
        splitTargets.forEach(function (el) {
          var was = el.classList.contains('in');
          splitLines(el);
          el.classList.add('ready');
          if (was) el.classList.add('in');       /* already seen: stay revealed */
          else io.observe(el);
        });
      }, 180);
    });
  });

  /* ══ 5. PROPS: bob, depth, spin, mouse ═════════════════════ */
  var props = $$('.prop, .offer__die');
  props.forEach(function (p, i) {
    if (reduced) return;
    p.style.setProperty('--bobdur', (6 + (i % 5) * 0.9).toFixed(1) + 's');
    p.style.animationDelay = (i * 0.23).toFixed(2) + 's';
    p.classList.add('prop--bob');
  });

  function moveProps() {
    if (reduced) return;
    var mid = innerHeight / 2;
    props.forEach(function (p) {
      var r = p.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      var off = ((r.top + r.height / 2) - mid) / innerHeight;   /* -1 .. 1 */
      p.style.setProperty('--py', (off * parseFloat(p.dataset.depth || 0)).toFixed(1) + 'px');
      if (p.dataset.spin) p.style.setProperty('--spin', (off * parseFloat(p.dataset.spin)).toFixed(1) + 'deg');
    });
  }

  /* v4's hero has no loose props to push around — the banner is a fixed
     composition. What it does have is depth, so the pointer separates the
     layers instead: the two figures lean out, the offer group leans in, and
     the title stays put because it is the thing being read. */
  var heroFigs = $$('.hero .fig');
  var heroOffer = $('.hero .offer');
  if (!reduced && !coarse && heroFigs.length) {
    addEventListener('pointermove', function (e) {
      var nx = e.clientX / innerWidth - .5;
      var ny = e.clientY / innerHeight - .5;
      heroFigs.forEach(function (f, i) {
        var s = i ? 1 : -1;                       /* the two lean apart */
        f.style.setProperty('--fx', (nx * 13 * s).toFixed(1) + 'px');
        f.style.setProperty('--fy', (ny * 7).toFixed(1) + 'px');
      });
      if (heroOffer) {
        heroOffer.style.setProperty('--ox', (nx * -9).toFixed(1) + 'px');
        heroOffer.style.setProperty('--oy', (ny * -5).toFixed(1) + 'px');
      }
    }, { passive: true });
  }

  /* ══ 6. SCRUB ENGINE ═══════════════════════════════════════
     One number per section. `--p` runs 0 → 1 across the section's whole
     passage through the viewport, and every rule in the v3 block of
     styles.css reads it. Because the number is a position and not an
     event, nothing pops: scrub back up and the page runs backwards.

       data-scrub          0 when the top reaches the viewport bottom,
                           1 when the bottom clears the viewport top
       data-scrub="exit"   0 while the section is parked at the top of the
                           screen, 1 once it has fully scrolled past
                           (the hero, which must not start half-done)
       data-scrub="in"     0 when the top reaches the viewport bottom,
                           1 when the top reaches the viewport top.
                           The LAST section needs this: the page stops
                           scrolling while its bottom is still on screen, so
                           the default mode can never reach 1 there and
                           anything staggered late would never arrive.

     Reads are batched ahead of writes so a long page does not force a
     fresh layout for every element in the list. */
  var scrubs = $$('[data-scrub]').map(function (el) {
    return { el: el, mode: el.getAttribute('data-scrub') || '', p: -1 };
  });
  var paras = $$('[data-para]');

  function scrubPass() {
    if (!scrubs.length) return;
    var i, s, r, p, vh = innerHeight;

    for (i = 0; i < scrubs.length; i++) {            /* read */
      s = scrubs[i]; r = s.el.getBoundingClientRect();
      if (s.mode === 'exit')      p = -r.top / (r.height || 1);
      else if (s.mode === 'in')   p = (vh - r.top) / vh;
      else                        p = (vh - r.top) / ((r.height + vh) || 1);
      s.next = clamp(p, 0, 1);
    }
    for (i = 0; i < scrubs.length; i++) {            /* write */
      s = scrubs[i];
      if (Math.abs(s.next - s.p) < 0.0008) continue;  /* skip no-op writes */
      s.p = s.next;
      s.el.style.setProperty('--p', s.p.toFixed(4));
    }

    /* elements that drift against the page at their own rate */
    var boxes = paras.map(function (el) { return el.getBoundingClientRect(); });
    paras.forEach(function (el, n) {
      var b = boxes[n];
      var off = ((b.top + b.height / 2) - vh / 2) / vh;      /* -1 .. 1 */
      el.style.setProperty('--pary', (off * parseFloat(el.dataset.para || 0)).toFixed(1) + 'px');
    });
  }

  /* ══ 6b. THE SCROLL RAIL ══════════════════════════════════
     The only fixed chrome left. Hover is the browser's job again: the
     custom cursor ring and the right-hand section nav are gone. */
  var progBar = $('.prog i');

  function chrome() {
    if (!progBar) return;
    var max = maxScroll();
    var realY = window.scrollY || document.documentElement.scrollTop || 0;
    var p = max > 0 ? clamp(realY / max, 0, 1) : 0;
    progBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }
  addEventListener('scroll', chrome, { passive: true });

  /* ══ 6c. WORD-BY-WORD ILLUMINATION ═════════════════════════
     The bright copy of each word lives in a ::after fed by data-w, so the
     visible text is drawn twice but only spoken once: the whole rebuilt
     sentence is aria-hidden and a plain sr-only copy carries the reading. */
  $$('[data-words]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';

    var sr = document.createElement('span');
    sr.className = 'sr-only'; sr.textContent = words.join(' ');
    el.appendChild(sr);

    var host = document.createElement('span');
    host.setAttribute('aria-hidden', 'true');
    el.style.setProperty('--n', words.length);
    words.forEach(function (w, i) {
      var sp = document.createElement('span');
      sp.className = 'qw';
      sp.style.setProperty('--i', i);
      sp.setAttribute('data-w', w);
      sp.textContent = w;
      host.appendChild(sp);
      if (i < words.length - 1) host.appendChild(document.createTextNode(' '));
    });
    el.appendChild(host);
    el.classList.add('ready');
  });

  /* ══ 6d. THE CTA LEANS TOWARD THE POINTER ══════════════════
     Selected as a list: the page now carries more than one "Ready to Play?"
     button, and the single-element lookup only ever wired the first. */
  if (!reduced && !coarse) $$('.pill--cta').forEach(function (mag) {
    mag.addEventListener('pointermove', function (e) {
      var r = mag.getBoundingClientRect();
      mag.style.setProperty('--magx', (((e.clientX - r.left) / r.width - .5) * 16).toFixed(1) + 'px');
      mag.style.setProperty('--magy', (((e.clientY - r.top) / r.height - .5) * 10).toFixed(1) + 'px');
    });
    mag.addEventListener('pointerleave', function () {
      mag.style.setProperty('--magx', '0px');
      mag.style.setProperty('--magy', '0px');
    });
  });

  /* ══ 7. ONE rAF LOOP ═══════════════════════════════════════ */
  function frame() {
    if (Scroll.smooth) {
      var next = Scroll.y + (Scroll.target - Scroll.y) * 0.085;
      if (Math.abs(Scroll.target - Scroll.y) < 0.12) next = Scroll.target;
      Scroll.vel = next - Scroll.y;
      Scroll.y = next;
      window.scrollTo(0, Scroll.y);
    } else {
      Scroll.vel = window.scrollY - Scroll.y;
      Scroll.y = window.scrollY;
    }
    moveProps(); reelDrift(); scrubPass(); chrome();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('resize', function () { Scroll.target = clamp(Scroll.target, 0, maxScroll()); });

  /* ══ 8. TABLE SOUNDS ═══════════════════════════════════════ */
  var Sfx = {
    on: false, ctx: null, noise: null,
    boot: function () {
      if (this.ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      var len = this.ctx.sampleRate * 0.6;
      var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      this.noise = buf;
    },
    burst: function (freq, q, gain, dur, delay) {
      if (!this.on || !this.ctx) return;
      var t = this.ctx.currentTime + (delay || 0);
      var s = this.ctx.createBufferSource(); s.buffer = this.noise;
      var f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      var g = this.ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.ctx.destination);
      s.start(t); s.stop(t + dur);
    },
    card: function () { this.burst(2600, 1.1, 0.18, 0.09); this.burst(1100, 0.8, 0.09, 0.14, 0.02); },
    dice: function () { for (var i = 0; i < 4; i++) this.burst(320 + Math.random() * 460, 2.4, 0.24, 0.10, i * 0.075); }
  };
  var sBtn = $('#soundBtn');
  if (sBtn) sBtn.addEventListener('click', function () {
    Sfx.boot();
    if (Sfx.ctx && Sfx.ctx.state === 'suspended') Sfx.ctx.resume();
    Sfx.on = !Sfx.on;
    sBtn.setAttribute('aria-pressed', String(Sfx.on));
    if (Sfx.on) Sfx.dice();
  });

  /* ══ 9. COUNTDOWN to 11 Sep 2026, 19:30 SGT ════════════════ */
  var TARGET = new Date('2026-09-11T19:30:00+08:00').getTime();
  var cd = $('#countdown');
  function tickCountdown() {
    if (!cd) return;
    var diff = TARGET - Date.now();
    if (diff <= 0) { cd.textContent = '00d 00h 00m'; return; }
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    cd.textContent = Math.floor(diff / 864e5) + 'd ' +
      p(Math.floor(diff / 36e5) % 24) + 'h ' + p(Math.floor(diff / 6e4) % 60) + 'm';
  }
  tickCountdown(); setInterval(tickCountdown, 30000);

  /* ══ 10. DRAGGABLE PHOTO CARDS ═════════════════════════════ */
  var zTop = 30;
  $$('.pola').forEach(function (p) {
    var drag = null;
    p.addEventListener('pointerdown', function (e) {
      if (getComputedStyle(p).position !== 'absolute') return;
      var box = p.parentElement.getBoundingClientRect(), r = p.getBoundingClientRect();
      p.style.left = (r.left - box.left) + 'px';
      p.style.top  = (r.top - box.top) + 'px';
      p.style.zIndex = ++zTop;
      drag = { x: e.clientX, y: e.clientY, l: r.left - box.left, t: r.top - box.top };
      p.classList.add('dragging'); p.setPointerCapture(e.pointerId);
      Sfx.card();
    });
    p.addEventListener('pointermove', function (e) {
      if (!drag) return;
      p.style.left = (drag.l + e.clientX - drag.x) + 'px';
      p.style.top  = (drag.t + e.clientY - drag.y) + 'px';
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      p.addEventListener(ev, function () { drag = null; p.classList.remove('dragging'); });
    });
  });

  /* ══ 11. CTA ═══════════════════════════════════════════════
     Every "Ready to Play?" rolls the dice on the way to the form; only a
     placeholder href="#" swallows the click. */
  $$('.pill--cta').forEach(function (cta) {
    cta.addEventListener('click', function (e) {
      Sfx.dice();
      if (cta.getAttribute('href') === '#') e.preventDefault();
    });
  });

  /* ══ 12. FONT CHECK ════════════════════════════════════════ */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      if (!document.fonts.check('800 40px "Manrope"')) {
        console.warn('[roundtable] Manrope did not load — display type is using the system fallback.');
      }
    });
  }
})();
