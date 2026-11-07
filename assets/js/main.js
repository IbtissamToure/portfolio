/* Portfolio behaviour: language switching, navigation, and the Digital Lab visuals.
   English text lives in index.html, so the page still reads without JavaScript.
   Arabic text lives in translations.js, keyed by each element's data-i18n value. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var STORAGE_KEY = 'portfolio-lang';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var toArray = function (list) { return Array.prototype.slice.call(list); };
  var languageListeners = [];

  /* ---------- Language ---------- */
  var textNodes = toArray(doc.querySelectorAll('[data-i18n]'));
  var ariaNodes = toArray(doc.querySelectorAll('[data-i18n-aria]'));
  var metaDescription = doc.querySelector('meta[name="description"]');
  var langButtons = toArray(doc.querySelectorAll('[data-set-lang]'));

  // Keep the English originals so switching back needs no second copy of the text.
  textNodes.forEach(function (el) { el.__en = el.innerHTML; });
  ariaNodes.forEach(function (el) { el.__enAria = el.getAttribute('aria-label'); });
  var enTitle = doc.title;
  var enDescription = metaDescription.getAttribute('content');

  function setLanguage(lang, persist) {
    var ar = window.PORTFOLIO_AR || {};
    var isArabic = lang === 'ar';

    root.lang = isArabic ? 'ar' : 'en';
    root.dir = isArabic ? 'rtl' : 'ltr';

    textNodes.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.innerHTML = isArabic && ar[key] ? ar[key] : el.__en;
    });
    ariaNodes.forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      el.setAttribute('aria-label', isArabic && ar[key] ? ar[key] : el.__enAria);
    });
    doc.title = isArabic && ar['meta.title'] ? ar['meta.title'] : enTitle;
    metaDescription.setAttribute('content', isArabic && ar['meta.description'] ? ar['meta.description'] : enDescription);

    langButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-set-lang') === root.lang));
    });

    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, root.lang); } catch (e) { /* storage unavailable */ }
    }
    languageListeners.forEach(function (fn) { fn(); });
  }

  var savedLang = 'en';
  try { savedLang = localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en'; } catch (e) { /* storage unavailable */ }
  setLanguage(savedLang, false);

  langButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { setLanguage(btn.getAttribute('data-set-lang'), true); });
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = doc.querySelector('.menu-btn');
  var siteNav = doc.getElementById('site-nav');

  function setMenu(open) {
    siteNav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  siteNav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuBtn.focus();
    }
  });

  /* ---------- Active section in the navigation ---------- */
  var navLinks = toArray(siteNav.querySelectorAll('a'));
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -54% 0px' });
    doc.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });

    // The hero has no navigation entry, so clear the marker when it is in view.
    var heroSpy = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) navLinks.forEach(function (l) { l.removeAttribute('aria-current'); });
    }, { rootMargin: '-45% 0px -54% 0px' });
    heroSpy.observe(doc.querySelector('.hero'));
  }

  /* ---------- Scroll reveal ---------- */
  var revealItems = doc.querySelectorAll('[data-reveal]');
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    var revealer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach(function (el) { revealer.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Career line: the logo's spine fills as you scroll ---------- */
  var journey = doc.querySelector('.journey');
  if (journey && !reduceMotion.matches) {
    var journeyTicking = false;
    var updateJourney = function () {
      journeyTicking = false;
      var box = journey.getBoundingClientRect();
      var progress = (window.innerHeight * 0.62 - box.top) / box.height;
      journey.style.setProperty('--progress', Math.max(0, Math.min(1, progress)).toFixed(3));
    };
    window.addEventListener('scroll', function () {
      if (!journeyTicking) { journeyTicking = true; requestAnimationFrame(updateJourney); }
    }, { passive: true });
    updateJourney();
  }

  /* ---------- Cursor light and card spotlight (mouse and trackpad only) ---------- */
  var pointer = { x: -1000, y: -1000, active: false };
  var heroEl = doc.querySelector('.hero');

  if (finePointer.matches && !reduceMotion.matches) {
    var glow = doc.querySelector('.cursor-glow');
    var heroSpot = doc.querySelector('.hero-spot');
    var glowX = 0, glowY = 0, spotX = 0, spotY = 0, cursorFrame = 0;

    var paintCursor = function () {
      glowX += (pointer.x - glowX) * 0.22;
      glowY += (pointer.y - glowY) * 0.22;
      glow.style.transform = 'translate3d(' + glowX.toFixed(1) + 'px,' + glowY.toFixed(1) + 'px,0)';

      var heroBox = heroEl.getBoundingClientRect();
      if (heroBox.bottom > 0) {
        var localX = pointer.x - heroBox.left, localY = pointer.y - heroBox.top;
        spotX += (localX - spotX) * 0.08;
        spotY += (localY - spotY) * 0.08;
        heroSpot.style.transform = 'translate3d(' + spotX.toFixed(1) + 'px,' + spotY.toFixed(1) + 'px,0)';
      }
      var settled = Math.abs(pointer.x - glowX) < 0.5 && Math.abs(pointer.y - glowY) < 0.5;
      cursorFrame = settled ? 0 : requestAnimationFrame(paintCursor);
    };

    window.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!pointer.active) {
        pointer.active = true;
        glowX = e.clientX; glowY = e.clientY;
        glow.classList.add('is-on');
        heroSpot.classList.add('is-on');
      }
      if (!cursorFrame) cursorFrame = requestAnimationFrame(paintCursor);

      var card = e.target.closest ? e.target.closest('.spot') : null;
      if (card) {
        var box = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - box.left) + 'px');
        card.style.setProperty('--my', (e.clientY - box.top) + 'px');
      }
    }, { passive: true });
    doc.addEventListener('mouseleave', function () {
      pointer.active = false;
      glow.classList.remove('is-on');
      heroSpot.classList.remove('is-on');
    });
  }

  /* ---------- Hero network: nodes drift and connect, responding to the cursor ---------- */
  var canvas = doc.getElementById('hero-network');
  if (canvas && canvas.getContext) startNetwork();

  function startNetwork() {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var coarse = !finePointer.matches;
    var width = 0, height = 0;
    var nodes = [];
    var visible = true, frame = 0, lastDraw = 0;
    var FRAME_MS = coarse ? 42 : 24;

    var seed = 7;
    function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

    function build() {
      var box = heroEl.getBoundingClientRect();
      width = box.width; height = box.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed = 7;
      nodes = [];
      var free = Math.round(Math.min(coarse ? 26 : 64, width * height / 19000));
      for (var i = 0; i < free; i++) {
        nodes.push({ x: rand() * width, y: rand() * height, vx: (rand() - 0.5) * 0.28, vy: (rand() - 0.5) * 0.28 });
      }
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      var heroBox = heroEl.getBoundingClientRect();
      var px = pointer.active ? pointer.x - heroBox.left : -9999;
      var py = pointer.active ? pointer.y - heroBox.top : -9999;
      var n, i, j;

      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = width + 20; else if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20; else if (n.y > height + 20) n.y = -20;
        var cx = n.x - px, cy = n.y - py, cd = cx * cx + cy * cy;
        if (cd < 22500 && cd > 1) { var push = (22500 - cd) / 22500 * 0.9; var len = Math.sqrt(cd); n.x += cx / len * push; n.y += cy / len * push; }
      }

      ctx.lineWidth = 0.8;
      for (i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var reach = 118;
          var dx = a.x - b.x, dy = a.y - b.y;
          if (Math.abs(dx) > reach || Math.abs(dy) > reach) continue;
          var d2 = dx * dx + dy * dy;
          if (d2 > reach * reach) continue;
          var strength = 1 - Math.sqrt(d2) / reach;
          ctx.strokeStyle = 'rgba(29,78,216,' + (0.3 * strength).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        var mx = a.x - px, my = a.y - py, md2 = mx * mx + my * my;
        if (md2 < 28900) {
          ctx.strokeStyle = 'rgba(8,145,178,' + (0.65 * (1 - Math.sqrt(md2) / 170)).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(px, py); ctx.stroke();
        }
      }

      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        ctx.fillStyle = 'rgba(29,78,216,.62)';
        ctx.beginPath(); ctx.arc(n.x, n.y, 1.9, 0, 6.2832); ctx.fill();
      }
    }

    function loop(time) {
      frame = requestAnimationFrame(loop);
      if (time - lastDraw < FRAME_MS) return;
      lastDraw = time;
      draw(time);
    }
    function play() { if (!frame && visible && !doc.hidden && !reduceMotion.matches) frame = requestAnimationFrame(loop); }
    function pause() { if (frame) { cancelAnimationFrame(frame); frame = 0; } }
    function refresh() {
      build();
      draw(performance.now());
    }

    refresh();
    play();

    var resizeTimer = 0;
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refresh, 160);
      }).observe(heroEl);
    }
    languageListeners.push(function () { requestAnimationFrame(refresh); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) play(); else pause();
      }).observe(heroEl);
    }
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) pause(); else play(); });
  }

  /* ---------- Hero figure: scattered signals resolving into one line ---------- */
  var signalHost = doc.getElementById('signal-canvas');
  if (signalHost) buildSignalFigure(signalHost);

  function buildSignalFigure(host) {
    var NS = 'http://www.w3.org/2000/svg';
    var W = 640, H = 440;
    var X = [24, 213, 427, 616];   // start, research→strategy, strategy→leadership, end
    var midY = H / 2;
    var seed = 11;
    function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function el(name, attrs, parent) {
      var node = doc.createElementNS(NS, name);
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      (parent || svg).appendChild(node);
      return node;
    }
    function curve(x0, y0, x1, y1) {
      var bend = (x1 - x0) * 0.55;
      return 'C' + (x0 + bend) + ' ' + y0 + ' ' + (x1 - bend) + ' ' + y1 + ' ' + x1 + ' ' + y1;
    }

    var svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    // One band per discipline; these highlight on hover.
    var bands = {};
    [['research', 0, X[1]], ['strategy', X[1], X[2] - X[1]], ['leadership', X[2], W - X[2]]].forEach(function (b) {
      bands[b[0]] = el('rect', { x: b[1], y: 0, width: b[2], height: H, 'class': 'signal-band' });
    });
    [X[1], X[2]].forEach(function (x) { el('line', { x1: x, x2: x, y1: 0, y2: H, 'class': 'signal-gate' }); });

    var LANES_A = [52, 94, 136, 178, 220, 262, 304, 346, 388];
    var LANES_B = [150, 220, 290];
    var paths = [];
    var count = 36;
    for (var i = 0; i < count; i++) {
      var y0 = 26 + rand() * (H - 52);
      var x0 = X[0] + rand() * 74;
      var laneA = LANES_A[Math.floor(rand() * LANES_A.length)];
      var laneB = LANES_B[Math.min(2, Math.floor(LANES_A.indexOf(laneA) / 3))];
      var d = 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) +
        curve(x0, y0, X[1], laneA) + curve(X[1], laneA, X[2], laneB) + curve(X[2], laneB, X[3] - 16, midY);
      paths.push(el('path', { d: d, 'class': 'signal-path' }));
      el('circle', { cx: x0.toFixed(1), cy: y0.toFixed(1), r: 2.2, 'class': 'signal-origin' });
    }
    LANES_A.forEach(function (y) { el('circle', { cx: X[1], cy: y, r: 3, 'class': 'signal-node' }); });
    LANES_B.forEach(function (y) { el('circle', { cx: X[2], cy: y, r: 4.5, 'class': 'signal-node' }); });
    el('circle', { cx: X[3] - 8, cy: midY, r: 14, 'class': 'signal-halo' });
    el('circle', { cx: X[3] - 8, cy: midY, r: 7, 'class': 'signal-end' });

    // Slow pulses travel along the paths, skipped when motion is reduced.
    if (!reduceMotion.matches) {
      for (var p = 0; p < 12; p++) {
        var pathIndex = (p * 3) % paths.length;
        var dot = el('circle', { r: 2.6, 'class': 'signal-pulse' });
        var motion = doc.createElementNS(NS, 'animateMotion');
        motion.setAttribute('dur', (11 + rand() * 7).toFixed(1) + 's');
        motion.setAttribute('begin', (-rand() * 16).toFixed(1) + 's');
        motion.setAttribute('repeatCount', 'indefinite');
        motion.setAttribute('path', paths[pathIndex].getAttribute('d'));
        dot.appendChild(motion);
      }
    }
    host.appendChild(svg);

    if ('IntersectionObserver' in window && svg.pauseAnimations) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) svg.unpauseAnimations();
        else svg.pauseAnimations();
      }).observe(host);
    }

    // Linked highlight: headline word, pillar card, and figure band.
    var linked = toArray(doc.querySelectorAll('[data-stage]'));
    function highlight(stage) {
      Object.keys(bands).forEach(function (k) { bands[k].classList.toggle('is-active', k === stage); });
      linked.forEach(function (node) { node.classList.toggle('is-active', node.getAttribute('data-stage') === stage); });
    }
    linked.forEach(function (node) {
      node.addEventListener('pointerenter', function () { highlight(node.getAttribute('data-stage')); });
      node.addEventListener('pointerleave', function () { highlight(null); });
    });
  }
})();
